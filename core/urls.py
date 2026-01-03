from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('presentation/<str:design_id>/', views.presentation, name='presentation'),
    path('upload/', views.upload_slides, name='upload'),
    path('delete/<int:pk>/', views.delete_presentation, name='delete_presentation'),
    path('tutorial/', views.tutorial, name='tutorial'),
    
    # Canva OAuth
    path('canva/login/', views.canva_login, name='canva_login'),
    path('canva/callback/', views.canva_callback, name='canva_callback'),
    path('canva/dashboard/', views.canva_dashboard, name='canva_dashboard'),
]
