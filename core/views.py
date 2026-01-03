from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.http import require_POST
from .services import CanvaService
from .models import Presentation, Slide
from .pptx_service import PPTXProcessingService

def dashboard(request):
    # Fetch mock designs
    canva_designs = CanvaService.list_designs()
    
    # Fetch DB presentations
    db_presentations = Presentation.objects.all().order_by('-created_at')
    
    # Pre-calculate local ID and ensure thumbnails
    for item in db_presentations:
        item.local_id = f"local_{item.id}"
    
    context = {
        'canva_designs': canva_designs,
        'db_presentations': db_presentations
    }
    return render(request, 'core/dashboard.html', context)

def presentation(request, design_id):
    # Retrieve design details and slides
    if design_id.startswith('local_'):
        pk = design_id.replace('local_', '')
        item = get_object_or_404(Presentation, pk=pk)
        design = {
            'id': design_id,
            'title': item.title,
            'thumbnail': item.thumbnail.url if item.thumbnail else '/static/img/pptx-icon.png'
        }
        # Fetch real slides from DB
        db_slides = item.slides.all().order_by('order')
        if db_slides.exists():
            slides = [s.image.url for s in db_slides]
        else:
            # Fallback if processing failed
            slides = [
                'https://placehold.co/1920x1080/0f172a/ffffff.png?text=Procesando+archivo...:' + item.title,
            ]
    else:
        design = CanvaService.get_design_details(design_id)
        slides = CanvaService.get_design_slides(design_id)
    
    context = {
        'design': design,
        'slides': slides,
        'CANVA_TOKEN': 'mock_token'
    }
    return render(request, 'core/presentation.html', context)

def upload_slides(request):
    if request.method == 'POST':
        print("DEBUG: POST request received in upload_slides")
        print(f"DEBUG: FILES in request: {request.FILES.keys()}")
        
        if request.FILES.get('file'):
            pptx_file = request.FILES['file']
            title = pptx_file.name
            print(f"DEBUG: Attempting to save file: {title} (Size: {pptx_file.size} bytes)")
            
            try:
                # Save to DB
                p = Presentation.objects.create(
                    title=title,
                    file=pptx_file
                )
                print(f"DEBUG: Presentation saved with ID: {p.id}. Starting background processing...")
                
                # Start background thread to process PPTX
                import threading
                thread = threading.Thread(target=PPTXProcessingService.process_presentation, args=(p,))
                thread.daemon = True # Thread will exit when main process exits
                thread.start()
                
                # Return immediately to the user
                return render(request, 'core/upload.html', {'success': True})
            except Exception as e:
                print(f"DEBUG: Error saving presentation: {str(e)}")
                return render(request, 'core/upload.html', {'error': f"Error en el servidor: {str(e)}"})
        else:
            print("DEBUG: No file found in request.FILES - Check multipart/form-data")
            return render(request, 'core/upload.html', {'error': "El archivo no llegó al servidor. Asegúrate de que el formato sea correcto."})
    
    # This return was missing and caused the 500 error on GET requests
    return render(request, 'core/upload.html')

@require_POST
def delete_presentation(request, pk):
    presentation = get_object_or_404(Presentation, pk=pk)
    presentation.delete()
    return redirect('core:dashboard')

def tutorial(request):
    return render(request, 'core/tutorial.html')

# ==========================================
# CANVA OAUTH VIEWS (Session Based)
# ==========================================

def canva_login(request):
    """Initiates the OAuth flow with Canva."""
    # 1. Generate PKCE
    code_verifier, code_challenge = CanvaService.generate_pkce_pair()
    
    # 2. Store verifier in session for the callback
    request.session['canva_code_verifier'] = code_verifier
    
    # 3. Build Redirect URI (Must match Canva Dashboard exactly)
    # We force localhost:8000 to avoid 127.0.0.1 vs localhost mismatches
    redirect_uri = "http://localhost:8000/core/canva/callback/" 
    
    # 4. Get Auth URL
    auth_url = CanvaService.get_auth_url(redirect_uri, code_challenge)
    
    return redirect(auth_url)

def canva_callback(request):
    """Handles the return from Canva with the authorization code."""
    error = request.GET.get('error')
    if error:
        return render(request, 'core/dashboard.html', {'error': f"Canva Error: {error}"})

    code = request.GET.get('code')
    if not code:
        return redirect('core:dashboard')
    
    # Retrieve verifier
    code_verifier = request.session.get('canva_code_verifier')
    if not code_verifier:
        return redirect('core:dashboard') # Session lost or cookie issue
    
    # Must be identical to what was sent in login
    redirect_uri = "http://localhost:8000/core/canva/callback/" 
    
    try:
        # Exchange code for token
        tokens = CanvaService.exchange_code(code, code_verifier, redirect_uri)
        
        if 'access_token' in tokens:
            # Store in session (NO USER DB)
            request.session['canva_access_token'] = tokens['access_token']
            request.session['canva_refresh_token'] = tokens.get('refresh_token')
            return redirect('core:canva_dashboard')
        else:
            return render(request, 'core/dashboard.html', {'error': "Could not retrieve Canva token."})
            
    except Exception as e:
        print(f"OAuth Exchange Error: {e}")
        return render(request, 'core/dashboard.html', {'error': "Error connecting to Canva."})

def canva_dashboard(request):
    """Displays user's Canva designs using the session token."""
    access_token = request.session.get('canva_access_token')
    
    if not access_token:
        # Not logged in to Canva, redirect to init
        return redirect('core:canva_login')
    
    # Fetch designs with real token
    canva_designs = CanvaService.list_designs(access_token)
    
    return render(request, 'core/canva_dashboard.html', {'canva_designs': canva_designs})
