import os
import win32com.client
import tempfile
from django.core.files.base import ContentFile
from .models import Slide

class PPTXProcessingService:
    @staticmethod
    def process_presentation(presentation_obj):
        print(f"DEBUG: Starting Native PowerPoint export for: {presentation_obj.file.path}")
        
        # We need absolute path for win32com
        abs_file_path = os.path.abspath(presentation_obj.file.path)
        
        if not os.path.exists(abs_file_path):
            print("DEBUG: ERROR - File not found")
            return False

        pythoncom_initialized = False
        try:
            # Initialize COM
            import pythoncom
            pythoncom.CoInitialize()
            pythoncom_initialized = True

            # Open PowerPoint
            powerpoint = win32com.client.DispatchEx("PowerPoint.Application")
            
            # Open the presentation
            pres = powerpoint.Presentations.Open(abs_file_path, True, False, False)
            
            print(f"DEBUG: PowerPoint opened. slides: {pres.Slides.Count}")
            
            # Use a temporary folder for the export
            # SaveAs with format 18 (ppSaveAsPNG) exports all slides at once to a folder
            temp_export_dir = os.path.join(tempfile.gettempdir(), f"pres_{presentation_obj.id}")
            if not os.path.exists(temp_export_dir):
                os.makedirs(temp_export_dir)
            
            # 18 = ppSaveAsPNG
            pres.SaveAs(temp_export_dir, 18)
            
            # PowerPoint exports them as Slide1.PNG, Slide2.PNG...
            # We need to find them and save them
            exported_files = sorted(os.listdir(temp_export_dir), key=lambda x: int(''.join(filter(str.isdigit, x)) or 0))
            
            for i, filename in enumerate(exported_files):
                temp_path = os.path.join(temp_export_dir, filename)
                
                if os.path.exists(temp_path):
                    with open(temp_path, 'rb') as f:
                        img_content = ContentFile(f.read())
                    
                    slide_instance = Slide.objects.create(
                        presentation=presentation_obj,
                        order=i
                    )
                    slide_instance.image.save(f"slide_{i}_{presentation_obj.id}.png", img_content, save=True)
                    
                    if i == 0:
                        presentation_obj.thumbnail.save(f"thumb_{presentation_obj.id}.png", img_content, save=True)
                    
                    print(f"DEBUG: Processed Exported Slide {i+1}")

            pres.Close()
            powerpoint.Quit()
            
            print(f"DEBUG: Native export completed for ID: {presentation_obj.id}")
            return True
        except Exception as e:
            print(f"DEBUG: NATIVE EXPORT ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            if pythoncom_initialized:
                pythoncom.CoUninitialize()
