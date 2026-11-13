import json

from django.test import TestCase
from django.urls import reverse

from .models import Proveedor


class ProveedorApiTests(TestCase):
    def setUp(self):
        self.payload = {
            'nombre': 'Distribuidora Norte',
            'numero_telefono': '1123456789',
            'tipo_productos': 'Bebidas',
        }

    def test_crear_proveedor_lo_persiste_y_lo_lista(self):
        response = self.client.post(
            reverse('api_crear_proveedor'),
            data=json.dumps(self.payload),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Proveedor.objects.count(), 1)

        listado = self.client.get(reverse('api_listar_proveedores'))
        self.assertEqual(listado.status_code, 200)
        self.assertEqual(listado.json()['proveedores'][0]['nombre'], self.payload['nombre'])

    def test_rechaza_nombres_duplicados_sin_distinguir_mayusculas(self):
        self.client.post(
            reverse('api_crear_proveedor'),
            data=json.dumps(self.payload),
            content_type='application/json',
        )
        duplicado = {**self.payload, 'nombre': self.payload['nombre'].upper()}

        response = self.client.post(
            reverse('api_crear_proveedor'),
            data=json.dumps(duplicado),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Proveedor.objects.count(), 1)

    def test_editar_proveedor_persiste_cambios(self):
        proveedor = Proveedor.objects.create(**self.payload)
        payload_actualizado = {**self.payload, 'nombre': 'Distribuidora Sur'}

        response = self.client.put(
            reverse('api_editar_proveedor', args=[proveedor.id]),
            data=json.dumps(payload_actualizado),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        proveedor.refresh_from_db()
        self.assertEqual(proveedor.nombre, 'Distribuidora Sur')

    def test_cambiar_estado_guarda_activo_o_inactivo(self):
        proveedor = Proveedor.objects.create(**self.payload)

        response = self.client.patch(
            reverse('api_editar_proveedor', args=[proveedor.id]),
            data=json.dumps({'activo': False}),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        proveedor.refresh_from_db()
        self.assertFalse(proveedor.activo)
