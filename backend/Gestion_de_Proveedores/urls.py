from django.urls import path
from . import views

urlpatterns = [
    path('', views.api_listar_proveedores, name='api_listar_proveedores'),
    path('crear/', views.api_crear_proveedor, name='api_crear_proveedor'),
    path(
        'editar/<int:proveedor_id>/',
        views.api_editar_proveedor,
        name='api_editar_proveedor',
    ),
]