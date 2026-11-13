# usuarios/views.py (o api_views.py)
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Usuario, Perfil
from .serializers import UsuarioSerializer, UsuarioCreateSerializer, PerfilSerializer
from auditoria.models import Auditoria
from auditoria.middleware import get_current_user

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all().order_by('apellido', 'nombre')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UsuarioCreateSerializer
        return UsuarioSerializer

    def perform_create(self, serializer):
        usuario_creado = serializer.save()
        
        actor = get_current_user()
        if actor and actor.is_anonymous:
            actor = None

        Auditoria.objects.create(
            usuario=actor,
            accion='creacion',
            modelo='Usuario',
            objeto_id=str(usuario_creado.dni),
            descripcion=f'Se creó el usuario {usuario_creado.username} ({usuario_creado.apellido}, {usuario_creado.nombre})',
            datos_nuevos=serializer.data
        )

    def perform_update(self, serializer):
        datos_anteriores = self.get_serializer(self.get_object()).data
        usuario_editado = serializer.save()
        
        actor = get_current_user()
        if actor and actor.is_anonymous:
            actor = None

        Auditoria.objects.create(
            usuario=actor,
            accion='modificacion',
            modelo='Usuario',
            objeto_id=str(usuario_editado.dni),
            descripcion=f'Se modificaron los datos de {usuario_editado.username}',
            datos_anteriores=datos_anteriores,
            datos_nuevos=serializer.data
        )

    @action(detail=True, methods=['post'])
    def toggle_estado(self, request, pk=None):
        usuario = self.get_object()
        
        usuario.activo = not usuario.activo
        if not usuario.activo:
            usuario.fecha_baja = timezone.now()
        else:
            usuario.fecha_baja = None
            usuario.intentos_fallidos = 0
            usuario.bloqueo_hasta = None
            
        usuario.save()

        actor = get_current_user()
        if actor and actor.is_anonymous:
            actor = None

        estado_str = "Activo" if usuario.activo else "Inactivo"
        Auditoria.objects.create(
            usuario=actor,
            accion='modificacion',
            modelo='Usuario',
            objeto_id=str(usuario.dni),
            descripcion=f'Se cambió el estado de {usuario.username} a {estado_str}'
        )

        return Response({'message': 'Estado actualizado', 'activo': usuario.activo})

    # --- AUDITORÍA AL RESETEAR CLAVE ---
    @action(detail=True, methods=['post'])
    def restablecer_clave(self, request, pk=None):
        usuario = self.get_object()
        clave_temporal = str(usuario.dni)
        usuario.set_password(clave_temporal)
        usuario.debe_cambiar_clave = True
        usuario.save()

        actor = get_current_user()
        if actor and actor.is_anonymous:
            actor = None

        Auditoria.objects.create(
            usuario=actor,
            accion='modificacion',
            modelo='Usuario',
            objeto_id=str(usuario.dni),
            descripcion=f'Se restableció la contraseña de {usuario.username}',
        )

        return Response({'message': f'Clave restablecida para {usuario.username}. Clave: {clave_temporal}'})


class PerfilViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Perfil.objects.all()
    serializer_class = PerfilSerializer