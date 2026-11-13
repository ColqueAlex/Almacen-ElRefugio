from django.urls import path

from . import views


urlpatterns = [
    path('', views.api_compras, name='api_compras'),
    path('<int:compra_id>/anular/', views.api_anular_compra, name='api_anular_compra'),
]
