import json
from decimal import Decimal

from django.test import TestCase
from django.urls import reverse

from Gestion_de_Proveedores.models import Proveedor

from .models import Producto


class ProductoApiTests(TestCase):
    def setUp(self):
        self.proveedor = Proveedor.objects.create(
            nombre='Distribuidora de prueba',
            numero_telefono='123456789',
            tipo_productos='Almacén',
        )
        self.payload = {
            'nombre': 'Arroz',
            'categoria': 'Almacén',
            'marca': 'Marca de prueba',
            'precio': '1250.50',
            'estado': 'activo',
            'proveedores': [str(self.proveedor.id)],
        }

    def test_guardar_producto_persiste_datos_y_proveedores(self):
        response = self.client.post(
            reverse('api_guardar_producto'),
            data=json.dumps(self.payload),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 201)
        producto = Producto.objects.get(nombre='Arroz')
        self.assertEqual(producto.precio, Decimal('1250.50'))
        self.assertEqual(list(producto.proveedores.all()), [self.proveedor])
        self.assertEqual(producto.stock, 0)

        listado = self.client.get(reverse('api_listar_productos'))
        self.assertEqual(listado.status_code, 200)
        self.assertEqual(listado.json()['productos'][0]['nombre'], 'Arroz')

    def test_no_guarda_producto_con_precio_invalido(self):
        payload = {**self.payload, 'precio': '0'}

        response = self.client.post(
            reverse('api_guardar_producto'),
            data=json.dumps(payload),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Producto.objects.count(), 0)

    def test_cambiar_estado_producto_lo_persiste(self):
        producto = Producto.objects.create(
            nombre='Arroz',
            categoria='Almacén',
            precio='1250.50',
        )

        response = self.client.patch(
            reverse('api_cambiar_estado_producto', args=[producto.id]),
            data=json.dumps({'estado': 'inactivo'}),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        producto.refresh_from_db()
        self.assertEqual(producto.estado, 'inactivo')
        self.assertEqual(
            response.json()['mensaje'],
            'Estado del producto actualizado a Inactivo',
        )

    def test_editar_producto_persiste_cambios_y_devuelve_mensaje(self):
        producto = Producto.objects.create(
            nombre='Arroz',
            categoria='Almacén',
            precio='1250.50',
        )
        payload = {**self.payload, 'nombre': 'Arroz Integral'}

        response = self.client.put(
            reverse('api_editar_producto', args=[producto.id]),
            data=json.dumps(payload),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        producto.refresh_from_db()
        self.assertEqual(producto.nombre, 'Arroz Integral')
        self.assertEqual(list(producto.proveedores.all()), [self.proveedor])
        self.assertIn('actualizado correctamente', response.json()['mensaje'])

    def test_obtener_producto_incluye_proveedores_para_edicion(self):
        producto = Producto.objects.create(
            nombre='Arroz',
            categoria='Almacén',
            precio='1250.50',
        )

        response = self.client.get(
            reverse('api_editar_producto', args=[producto.id]),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()['proveedores_disponibles'][0]['id'],
            self.proveedor.id,
        )
