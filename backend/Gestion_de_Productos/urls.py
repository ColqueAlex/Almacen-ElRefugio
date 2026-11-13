from django.urls import path

from . import views


urlpatterns = [
    path('', views.api_listar_productos, name='api_listar_productos'),
    path('guardar/', views.api_guardar_producto, name='api_guardar_producto'),
    path(
        '<int:producto_id>/',
        views.api_editar_producto,
        name='api_editar_producto',
    ),
    path(
        '<int:producto_id>/cambiar_estado/',
        views.api_cambiar_estado_producto,
        name='api_cambiar_estado_producto',
    ),
]
