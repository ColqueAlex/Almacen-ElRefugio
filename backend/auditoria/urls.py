from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuditoriaViewSet

router = DefaultRouter()
router.register(r'', AuditoriaViewSet, basename='api-auditoria')

urlpatterns = [
    path('', include(router.urls)),
]