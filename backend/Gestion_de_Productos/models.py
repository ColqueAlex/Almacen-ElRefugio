from django.core.validators import MinValueValidator
from django.db import models

from Gestion_de_Proveedores.models import Proveedor


class Producto(models.Model):
    ESTADOS = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
    ]

    nombre = models.CharField(max_length=200)
    categoria = models.CharField(max_length=100)
    marca = models.CharField(max_length=100, default='Sin marca')
    precio = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
    )
    stock = models.PositiveIntegerField(default=0)
    estado = models.CharField(max_length=8, choices=ESTADOS, default='activo')
    proveedores = models.ManyToManyField(
        Proveedor,
        related_name='productos',
        blank=True,
        through='ProductoProveedor',
        through_fields=('producto', 'proveedor'),
    )

    class Meta:
        db_table = 'productos_productos'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class ProductoProveedor(models.Model):
    producto = models.ForeignKey(
        Producto,
        db_column='productos_id',
        on_delete=models.CASCADE,
        related_name='relaciones_proveedor',
    )
    proveedor = models.ForeignKey(
        Proveedor,
        db_column='proveedor_id',
        on_delete=models.CASCADE,
        related_name='relaciones_producto',
    )

    class Meta:
        db_table = 'productos_productos_proveedores'
        constraints = [
            models.UniqueConstraint(
                fields=['producto', 'proveedor'],
                name='producto_proveedor_unico',
            ),
        ]
