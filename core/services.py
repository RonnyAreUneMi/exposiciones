import os
import requests
import base64
import hashlib
import secrets
from urllib.parse import urlencode

class CanvaService:
    AUTH_URL = "https://www.canva.com/api/oauth/authorize"
    TOKEN_URL = "https://api.canva.com/rest/v1/oauth/token"
    BASE_API_URL = "https://api.canva.com/rest/v1"

    @staticmethod
    def get_client_creds():
        return {
            'client_id': os.environ.get('CANVA_CLIENT_ID', 'PLACEHOLDER_CLIENT_ID'),
            'client_secret': os.environ.get('CANVA_CLIENT_SECRET', 'PLACEHOLDER_CLIENT_SECRET')
        }

    @staticmethod
    def generate_pkce_pair():
        """Generates (code_verifier, code_challenge) for PKCE."""
        code_verifier = secrets.token_urlsafe(96)[:128]
        hashed = hashlib.sha256(code_verifier.encode('ascii')).digest()
        code_challenge = base64.urlsafe_b64encode(hashed).decode('ascii').rstrip('=')
        return code_verifier, code_challenge

    @staticmethod
    def get_auth_url(redirect_uri, code_challenge):
        creds = CanvaService.get_client_creds()
        params = {
            'response_type': 'code',
            'client_id': creds['client_id'],
            'redirect_uri': redirect_uri,
            'code_challenge': code_challenge,
            'code_challenge_method': 'S256',
            'scope': 'design:read design:content:read', # Adjust scopes as needed
        }
        return f"{CanvaService.AUTH_URL}?{urlencode(params)}"

    @staticmethod
    def exchange_code(code, code_verifier, redirect_uri):
        creds = CanvaService.get_client_creds()
        data = {
            'grant_type': 'authorization_code',
            'client_id': creds['client_id'],
            'client_secret': creds['client_secret'],
            'code': code,
            'code_verifier': code_verifier,
            'redirect_uri': redirect_uri,
        }
        # Using basic auth header is also supported/required by some providers, 
        # but Canva docs say to send client_id/secret in body or Authorization header.
        # Let's try body first as per standard. 
        # Actually Canva usually requires Basic Auth for the token endpoint:
        auth_str = f"{creds['client_id']}:{creds['client_secret']}"
        b64_auth = base64.b64encode(auth_str.encode()).decode()
        headers = {
            'Authorization': f'Basic {b64_auth}',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        # Remove secret from body if using Basic Auth
        del data['client_secret']
        
        response = requests.post(CanvaService.TOKEN_URL, data=data, headers=headers)
        return response.json()

    @staticmethod
    def list_designs(access_token=None):
        """List designs. If access_token is provided, use real API. Else mock."""
        if access_token:
            headers = {'Authorization': f'Bearer {access_token}'}
            # Canva API list designs endpoint
            url = f"{CanvaService.BASE_API_URL}/designs"
            # Param 'sort_by' or others might be needed
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                return data.get('items', [])
            else:
                print(f"Canva API Error: {response.status_code} - {response.text}")
                # Fallback to empty list or mock if error to avoid crash
                return []

        # Mock data (Fallback)
        return [
            {
                'id': 'design_1',
                'title': 'Q4 Marketing Strategy (Mock)',
                'thumbnail': 'https://placehold.co/600x400/png?text=Marketing+Strategy'
            },
            {
                'id': 'design_2',
                'title': 'Product Roadmap 2025 (Mock)',
                'thumbnail': 'https://placehold.co/600x400/png?text=Product+Roadmap'
            },
            {
                'id': 'design_3',
                'title': 'Team Onboarding (Mock)',
                'thumbnail': 'https://placehold.co/600x400/png?text=Team+Onboarding'
            }
        ]

    @staticmethod
    def get_design_details(design_id):
        # Mock details
        return {
            'id': design_id,
            'title': f'Presentation {design_id}'
        }

    @staticmethod
    def get_design_slides(design_id):
        # Mock slides (images)
        # Using placeholder images to simulate slides
        return [
            'https://placehold.co/1920x1080/png?text=Slide+1:+Introduction',
            'https://placehold.co/1920x1080/png?text=Slide+2:+Agenda',
            'https://placehold.co/1920x1080/png?text=Slide+3:+Key+Metrics',
            'https://placehold.co/1920x1080/png?text=Slide+4:+Analysis',
            'https://placehold.co/1920x1080/png?text=Slide+5:+Next+Steps',
            'https://placehold.co/1920x1080/png?text=Slide+6:+Q&A',
        ]
