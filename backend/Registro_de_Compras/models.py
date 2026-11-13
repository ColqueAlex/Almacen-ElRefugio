from django.db import models
from django.db.models import Q
from django.utils import timezone

from Gestion_de_Productos.models import Producto
from Gestion_de_Proveedores.models import Proveedor


def hora_local_actual():
    return timezone.localtime().time()


class Compra(models.Model):
    ESTADOS = [
        ('Confirmado', 'Confirmado'),
        ('Anulado', 'Anulado'),
    ]

    fecha = models.DateField(default=timezone.localdate)
    hora = models.TimeField(default=hora_local_actual)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    estado = models.CharField(max_length=10, choices=ESTADOS, default='Confirmado')
    motivo_anulacion = models.TextField(blank=True, default='')
    fecha_anulacion = models.DateTimeField(null=True, blank=True)
    proveedor = models.ForeignKey(
        Proveedor,
        db_column='id_proveedor_id',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='compras',
    )
    usuario = models.PositiveBigIntegerField(
        db_column='id_usuario_id',
        null=True,
        blank=True,
    )
    usuario_anulado = models.PositiveBigIntegerField(
        db_column='usuario_anulacion_id',
        null=True,
        blank=True,
    )

    class Meta:
        db_table = 'compras_compras'
        ordering = ['-fecha', '-hora', '-id']


class DetalleCompra(models.Model):
    lote = models.CharField(max_length=100)
    fecha_vencimiento = models.DateField(null=True, blank=True)
    cantidad = models.PositiveIntegerField()
    precio_unitario_compra = models.DecimalField(max_digits=12, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    compra = models.ForeignKey(
        Compra,
        db_column='id_compra_id',
        on_delete=models.CASCADE,
        related_name='detalles',
    )
    producto = models.ForeignKey(
        Producto,
        db_column='id_producto_id',
        on_delete=models.PROTECT,
        related_name='detalles_compra',
    )

    class Meta:
        db_table = 'compras_detallescompra'


class LoteProducto(models.Model):
    lote = models.CharField(max_length=100)
    fecha_vencimiento = models.DateField(null=True, blank=True)
    stock_actual = models.PositiveIntegerField(default=0)
    precio_costo = models.DecimalField(max_digits=12, decimal_places=2)
    activo = models.BooleanField(default=True)
    producto = models.ForeignKey(
        Producto,
        db_column='id_producto_id',
        on_delete=models.CASCADE,
        related_name='lotes',
    )

    class Meta:
        db_table = 'productos_lotesproducto'
        ordering = ['fecha_vencimiento', 'id']
        constraints = [
            models.UniqueConstraint(
                fields=['producto', 'lote', 'fecha_vencimiento'],
                condition=Q(fecha_vencimiento__isnull=False),
                name='lote_producto_fecha_unico',
            ),
            models.UniqueConstraint(
                fields=['producto', 'lote'],
                condition=Q(fecha_vencimiento__isnull=True),
                name='lote_producto_sin_vencimiento_unico',
            ),
        ]
