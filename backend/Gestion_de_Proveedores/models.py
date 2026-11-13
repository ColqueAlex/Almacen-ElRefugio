from django.db import models
from django.db.models.functions import Lower


class Proveedor(models.Model):
    nombre = models.CharField(max_length=200)
    numero_telefono = models.CharField(max_length=30, blank=True)
    tipo_productos = models.CharField(max_length=200)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'productos_proveedor'
        ordering = ['nombre']
        constraints = [
            models.UniqueConstraint(
                Lower('nombre'),
                name='proveedor_nombre_case_insensitive_unico',
            ),
        ]

    def __str__(self):
        return self.nombre
