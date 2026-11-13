# usuarios/serializers.py
from rest_framework import serializers
from .models import Usuario, Perfil

class PerfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = Perfil
        fields = ['id', 'nombre']

class UsuarioSerializer(serializers.ModelSerializer):
    perfil_nombre = serializers.CharField(source='id_perfil.nombre', read_only=True)
    
    class Meta:
        model = Usuario
        fields = ['dni', 'apellido', 'nombre', 'correo', 'username', 'activo', 
                  'id_perfil', 'perfil_nombre', 'debe_cambiar_clave', 'fecha_baja']
        read_only_fields = ['username', 'debe_cambiar_clave', 'fecha_baja', 'dni']

class UsuarioCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    perfil_id = serializers.PrimaryKeyRelatedField(
        queryset=Perfil.objects.all(), source='id_perfil', required=False
    )

    class Meta:
        model = Usuario
        fields = ['dni', 'apellido', 'nombre', 'correo', 'perfil_id', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        if not password:
            password = str(validated_data['dni'])
            
        usuario = Usuario.objects.create_user(
            dni=validated_data['dni'],
            apellido=validated_data['apellido'],
            nombre=validated_data['nombre'],
            correo=validated_data['correo'],
            id_perfil=validated_data.get('id_perfil'),
            password=password
        )
        return usuario