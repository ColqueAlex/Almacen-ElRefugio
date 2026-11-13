
from rest_framework import serializers
from .models import Auditoria

class AuditoriaSerializer(serializers.ModelSerializer):
    usuario_username = serializers.CharField(source='usuario.username', read_only=True, default='Sistema')
    usuario_perfil = serializers.CharField(source='usuario.id_perfil.nombre', read_only=True, default='Automático')

    class Meta:
        model = Auditoria
        fields = '__all__'