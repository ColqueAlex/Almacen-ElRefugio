# auditoria/views.py
from rest_framework import viewsets
from .models import Auditoria
from .serializers import AuditoriaSerializer

class AuditoriaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Auditoria.objects.all().order_by('-fecha_hora')
    serializer_class = AuditoriaSerializer