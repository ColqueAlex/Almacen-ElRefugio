# usuarios/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UsuarioViewSet, PerfilViewSet

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet, basename='api-usuarios') 
router.register(r'perfiles', PerfilViewSet, basename='api-perfiles')

urlpatterns = [
    path('api/', include(router.urls)),
]