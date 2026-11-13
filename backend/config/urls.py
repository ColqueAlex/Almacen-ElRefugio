from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/proveedores/', include('Gestion_de_Proveedores.urls')),
    path('api/productos/', include('Gestion_de_Productos.urls')),
    path('api/compras/', include('Registro_de_Compras.urls')),
    path('', include('usuarios.urls')),
    path('api/auditoria/', include('auditoria.urls')),
]