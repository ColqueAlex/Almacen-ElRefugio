# usuarios/api_views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Usuario, Perfil
from .serializers import UsuarioSerializer, UsuarioCreateSerializer, PerfilSerializer

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all().order_by('apellido', 'nombre')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UsuarioCreateSerializer
        return UsuarioSerializer

    # Endpoint para Restablecer Clave
    @action(detail=True, methods=['post'])
    def restablecer_clave(self, request, pk=None):
        # pk será el DNI del usuario
        usuario = self.get_object()
        clave_temporal = str(usuario.dni)
        usuario.set_password(clave_temporal)
        usuario.debe_cambiar_clave = True
        usuario.save()
        return Response({'message': f'Clave restablecida para {usuario.username}. Clave: {clave_temporal}'})

    # Endpoint para Dar de baja / Reactivar (Toggle)
    @action(detail=True, methods=['post'])
    def toggle_estado(self, request, pk=None):
        usuario = self.get_object()
        
        # Validaciones de tu código original
        if request.user.dni == usuario.dni:
            return Response({'error': 'No puedes darte de baja a ti mismo.'}, status=status.HTTP_400_BAD_REQUEST)

        rol_actual = request.user.id_perfil.nombre if request.user.id_perfil else ''
        rol_destino = usuario.id_perfil.nombre if usuario.id_perfil else ''

        if rol_actual not in ['Administrador', 'Propietario']:
            return Response({'error': 'No tienes permisos.'}, status=status.HTTP_403_FORBIDDEN)
            
        if rol_actual == rol_destino and request.user.dni != usuario.dni:
             return Response({'error': f'No puedes dar de baja a otro usuario con el mismo rango ({rol_actual}).'}, status=status.HTTP_403_FORBIDDEN)

        # Lógica de cambio de estado
        usuario.activo = not usuario.activo
        if not usuario.activo:
            usuario.fecha_baja = timezone.now()
        else:
            usuario.fecha_baja = None
            usuario.intentos_fallidos = 0
            usuario.bloqueo_hasta = None
            
        usuario.save()
        return Response({'message': 'Estado actualizado correctamente', 'activo': usuario.activo})

class PerfilViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Perfil.objects.all()
    serializer_class = PerfilSerializer