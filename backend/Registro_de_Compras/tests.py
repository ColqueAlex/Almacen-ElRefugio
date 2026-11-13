import json
from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from Gestion_de_Productos.models import Producto, ProductoProveedor
from Gestion_de_Proveedores.models import Proveedor

from .models import Compra, DetalleCompra, LoteProducto


class CompraApiTests(TestCase):
    def setUp(self):
        self.proveedor = Proveedor.objects.create(
            nombre='Proveedor de prueba',
            numero_telefono='123456789',
            tipo_productos='Fruta',
        )
        self.producto = Producto.objects.create(
            nombre='Manzana',
            categoria='Fruta',
            precio='100.00',
        )
        self.producto.proveedores.add(self.proveedor)
        self.payload = {
            'id_proveedor': self.proveedor.id,
            'total': '1.00',
            'cart_data': [{
                'id_producto': self.producto.id,
                'lote': 'L-001',
                'fecha_vencimiento': (timezone.localdate() + timedelta(days=30)).isoformat(),
                'cantidad': 3,
                'precio_costo': '40.50',
            }],
        }

    def test_registra_compra_detalle_lote_y_actualiza_stock(self):
        response = self.client.post(
            reverse('api_compras'),
            data=json.dumps(self.payload),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 201)
        compra = Compra.objects.get()
        detalle = DetalleCompra.objects.get(compra=compra)
        lote = LoteProducto.objects.get(producto=self.producto, lote='L-001')
        self.producto.refresh_from_db()

        self.assertEqual(compra.total, Decimal('121.50'))
        self.assertEqual(compra.proveedor, self.proveedor)
        self.assertIsNone(compra.usuario)
        self.assertEqual(detalle.subtotal, Decimal('121.50'))
        self.assertEqual(lote.stock_actual, 3)
        self.assertEqual(lote.precio_costo, Decimal('40.50'))
        self.assertEqual(self.producto.stock, 3)
        self.assertEqual(response.json()['compra']['estado'], 'Confirmado')
        self.assertEqual(response.json()['compra']['usuario'], 'Sin usuario')
        self.assertIsNone(response.json()['compra']['usuario_anulacion_id'])
        self.assertEqual(ProductoProveedor.objects.count(), 1)

    def test_rechaza_compra_invalida_sin_modificar_stock(self):
        payload = {**self.payload, 'cart_data': []}

        response = self.client.post(
            reverse('api_compras'),
            data=json.dumps(payload),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Compra.objects.count(), 0)
        self.assertEqual(DetalleCompra.objects.count(), 0)
        self.producto.refresh_from_db()
        self.assertEqual(self.producto.stock, 0)

    def test_anula_compra_y_revierte_stock(self):
        self.client.post(
            reverse('api_compras'),
            data=json.dumps(self.payload),
            content_type='application/json',
        )
        compra = Compra.objects.get()

        response = self.client.patch(
            reverse('api_anular_compra', args=[compra.id]),
            data=json.dumps({'motivo': 'Compra duplicada'}),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        compra.refresh_from_db()
        lote = LoteProducto.objects.get(producto=self.producto, lote='L-001')
        self.producto.refresh_from_db()
        self.assertEqual(compra.estado, 'Anulado')
        self.assertEqual(compra.motivo_anulacion, 'Compra duplicada')
        self.assertIsNotNone(compra.fecha_anulacion)
        self.assertIsNone(compra.usuario_anulado)
        self.assertEqual(lote.stock_actual, 0)
        self.assertFalse(lote.activo)
        self.assertEqual(self.producto.stock, 0)
