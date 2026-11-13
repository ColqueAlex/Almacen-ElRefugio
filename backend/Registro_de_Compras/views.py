import json
from collections import defaultdict
from datetime import date
from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.db.models import F
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from Gestion_de_Productos.models import Producto
from Gestion_de_Proveedores.models import Proveedor

from .models import Compra, DetalleCompra, LoteProducto


def _error(mensaje, status=400):
    return JsonResponse({'error': mensaje, 'mensaje': mensaje}, status=status)


def _leer_json(request):
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None, _error('JSON inválido.')

    if not isinstance(data, dict):
        return None, _error('El cuerpo debe ser un objeto JSON.')
    return data, None


def _leer_id(value, campo, obligatorio=True):
    if value in (None, '') and not obligatorio:
        return None, None
    if isinstance(value, bool) or not (
        isinstance(value, int) or isinstance(value, str) and value.isdigit()
    ):
        return None, _error(f'El identificador de {campo} no es válido.')

    identificador = int(value)
    if identificador <= 0:
        return None, _error(f'El identificador de {campo} no es válido.')
    return identificador, None


def _leer_items(data, proveedor):
    items = data.get('cart_data')
    if not isinstance(items, list) or not items:
        return None, _error('La compra debe incluir al menos un producto.')

    ids_productos = []
    datos_items = []
    for indice, item in enumerate(items, start=1):
        if not isinstance(item, dict):
            return None, _error(f'El detalle {indice} no es válido.')

        id_producto, error = _leer_id(item.get('id_producto'), 'producto')
        if error:
            return None, error

        cantidad = item.get('cantidad')
        if (
            isinstance(cantidad, bool)
            or not isinstance(cantidad, int)
            or cantidad <= 0
            or cantidad > 2_147_483_647
        ):
            return None, _error(f'La cantidad del detalle {indice} debe ser mayor a cero.')

        lote = item.get('lote', '')
        if not isinstance(lote, str):
            return None, _error(f'El lote del detalle {indice} no es válido.')
        lote = lote.strip() or 'Sin lote'
        if len(lote) > 100:
            return None, _error(f'El lote del detalle {indice} supera los 100 caracteres.')

        fecha_vencimiento = item.get('fecha_vencimiento')
        if fecha_vencimiento in (None, ''):
            fecha_vencimiento = None
        elif isinstance(fecha_vencimiento, str):
            try:
                fecha_vencimiento = date.fromisoformat(fecha_vencimiento)
            except ValueError:
                return None, _error(f'La fecha de vencimiento del detalle {indice} no es válida.')
            if fecha_vencimiento.isoformat() != item.get('fecha_vencimiento'):
                return None, _error(f'La fecha de vencimiento del detalle {indice} no es válida.')
            if fecha_vencimiento <= timezone.localdate():
                return None, _error('La fecha de vencimiento debe ser posterior a hoy.')
        else:
            return None, _error(f'La fecha de vencimiento del detalle {indice} no es válida.')

        try:
            precio = Decimal(str(item.get('precio_costo', '')))
        except (InvalidOperation, ValueError):
            return None, _error(f'El precio de costo del detalle {indice} no es válido.')
        if (
            not precio.is_finite()
            or precio <= 0
            or precio.as_tuple().exponent < -2
            or precio >= Decimal('10000000000')
        ):
            return None, _error(f'El precio de costo del detalle {indice} debe ser positivo y tener hasta dos decimales.')

        ids_productos.append(id_producto)
        datos_items.append({
            'id_producto': id_producto,
            'lote': lote,
            'fecha_vencimiento': fecha_vencimiento,
            'cantidad': cantidad,
            'precio_unitario_compra': precio,
            'subtotal': precio * cantidad,
        })

    productos = Producto.objects.in_bulk(set(ids_productos))
    for item in datos_items:
        producto = productos.get(item['id_producto'])
        if producto is None:
            return None, _error(f'No existe el producto #{item["id_producto"]}.')
        if proveedor and not producto.proveedores.filter(pk=proveedor.pk).exists():
            return None, _error(
                f'El producto "{producto.nombre}" no está asociado al proveedor seleccionado.'
            )
        item['producto'] = producto

    return datos_items, None


def _serializar_compra(compra):
    return {
        'id': compra.id,
        'fecha': compra.fecha.isoformat(),
        'hora': compra.hora.strftime('%H:%M'),
        'total': str(compra.total),
        'estado': compra.estado,
        'motivo_anulacion': compra.motivo_anulacion,
        'fecha_anulacion': (
            timezone.localtime(compra.fecha_anulacion).isoformat()
            if compra.fecha_anulacion
            else None
        ),
        'id_proveedor': (
            {'id': compra.proveedor_id, 'nombre': compra.proveedor.nombre}
            if compra.proveedor_id
            else None
        ),
        'id_usuario': compra.usuario,
        'usuario': f'Usuario #{compra.usuario}' if compra.usuario else 'Sin usuario',
        'usuario_anulacion_id': compra.usuario_anulado,
        'detalles': [
            {
                'id': detalle.id,
                'lote': detalle.lote,
                'fecha_vencimiento': (
                    detalle.fecha_vencimiento.isoformat()
                    if detalle.fecha_vencimiento
                    else None
                ),
                'cantidad': detalle.cantidad,
                'precio_unitario_compra': str(detalle.precio_unitario_compra),
                'subtotal': str(detalle.subtotal),
                'id_producto': {
                    'id': detalle.producto_id,
                    'nombre': detalle.producto.nombre,
                },
                'producto': detalle.producto.nombre,
            }
            for detalle in compra.detalles.all()
        ],
    }


@csrf_exempt
def api_compras(request):
    if request.method == 'GET':
        compras = (
            Compra.objects
            .select_related('proveedor')
            .prefetch_related('detalles__producto')
        )
        return JsonResponse({'compras': [_serializar_compra(compra) for compra in compras]})

    if request.method != 'POST':
        return _error('Método no permitido.', status=405)

    data, error = _leer_json(request)
    if error:
        return error

    id_proveedor, error = _leer_id(data.get('id_proveedor'), 'proveedor', obligatorio=False)
    if error:
        return error
    proveedor = None
    if id_proveedor is not None:
        try:
            proveedor = Proveedor.objects.get(pk=id_proveedor)
        except Proveedor.DoesNotExist:
            return _error('El proveedor seleccionado no existe.')

    items, error = _leer_items(data, proveedor)
    if error:
        return error

    total = sum(
        (item['subtotal'] for item in items),
        start=Decimal('0.00'),
    )
    if total >= Decimal('10000000000'):
        return _error('El total de la compra supera el máximo permitido.')

    with transaction.atomic():
        compra = Compra.objects.create(
            proveedor=proveedor,
            usuario=None,
            total=total,
        )
        for item in items:
            DetalleCompra.objects.create(
                compra=compra,
                producto=item['producto'],
                lote=item['lote'],
                fecha_vencimiento=item['fecha_vencimiento'],
                cantidad=item['cantidad'],
                precio_unitario_compra=item['precio_unitario_compra'],
                subtotal=item['subtotal'],
            )

            lote_producto = LoteProducto.objects.filter(
                producto=item['producto'],
                lote=item['lote'],
                fecha_vencimiento=item['fecha_vencimiento'],
            ).first()
            if lote_producto:
                lote_producto.stock_actual = F('stock_actual') + item['cantidad']
                lote_producto.precio_costo = item['precio_unitario_compra']
                lote_producto.activo = True
                lote_producto.save(update_fields=['stock_actual', 'precio_costo', 'activo'])
            else:
                LoteProducto.objects.create(
                    producto=item['producto'],
                    lote=item['lote'],
                    fecha_vencimiento=item['fecha_vencimiento'],
                    stock_actual=item['cantidad'],
                    precio_costo=item['precio_unitario_compra'],
                )

            Producto.objects.filter(pk=item['producto'].pk).update(
                stock=F('stock') + item['cantidad'],
            )

    compra = (
        Compra.objects
        .select_related('proveedor')
        .prefetch_related('detalles__producto')
        .get(pk=compra.pk)
    )
    return JsonResponse({
        'mensaje': f'Compra #{compra.id} registrada correctamente.',
        'compra': _serializar_compra(compra),
    }, status=201)


@csrf_exempt
def api_anular_compra(request, compra_id):
    if request.method != 'PATCH':
        return _error('Método no permitido.', status=405)

    data, error = _leer_json(request)
    if error:
        return error
    motivo = data.get('motivo')
    if not isinstance(motivo, str) or not motivo.strip():
        return _error('Debe ingresar el motivo de anulación.')
    motivo = motivo.strip()
    if len(motivo) > 2000:
        return _error('El motivo de anulación no puede superar los 2000 caracteres.')

    with transaction.atomic():
        try:
            compra = (
                Compra.objects
                .select_for_update()
                .select_related('proveedor')
                .get(pk=compra_id)
            )
        except Compra.DoesNotExist:
            return _error('Compra no encontrada.', status=404)
        if compra.estado == 'Anulado':
            return _error('La compra ya está anulada.', status=409)

        cantidades_por_lote = defaultdict(int)
        for detalle in compra.detalles.all():
            key = (
                detalle.producto_id,
                detalle.lote,
                detalle.fecha_vencimiento,
            )
            cantidades_por_lote[key] += detalle.cantidad

        lotes_a_actualizar = []
        productos_a_actualizar = {}
        for (producto_id, lote, vencimiento), cantidad in cantidades_por_lote.items():
            try:
                lote_producto = LoteProducto.objects.select_for_update().get(
                    producto_id=producto_id,
                    lote=lote,
                    fecha_vencimiento=vencimiento,
                )
                producto = Producto.objects.select_for_update().get(pk=producto_id)
            except (LoteProducto.DoesNotExist, Producto.DoesNotExist):
                return _error('No se pudo revertir el stock: falta un lote o producto.', status=409)

            if lote_producto.stock_actual < cantidad or producto.stock < cantidad:
                return _error(
                    'No se puede anular la compra porque parte de su stock ya fue utilizado.',
                    status=409,
                )
            lotes_a_actualizar.append((lote_producto, cantidad))
            producto_previo, cantidad_previa = productos_a_actualizar.get(
                producto_id,
                (producto, 0),
            )
            productos_a_actualizar[producto_id] = (producto_previo, cantidad_previa + cantidad)

        if any(producto.stock < cantidad for producto, cantidad in productos_a_actualizar.values()):
            return _error(
                'No se puede anular la compra porque parte de su stock ya fue utilizado.',
                status=409,
            )
        for lote_producto, cantidad in lotes_a_actualizar:
            lote_producto.stock_actual -= cantidad
            lote_producto.activo = lote_producto.stock_actual > 0
            lote_producto.save(update_fields=['stock_actual', 'activo'])

        for producto, cantidad in productos_a_actualizar.values():
            producto.stock -= cantidad
            producto.save(update_fields=['stock'])

        compra.estado = 'Anulado'
        compra.motivo_anulacion = motivo
        compra.fecha_anulacion = timezone.now()
        compra.usuario_anulado = None
        compra.save(update_fields=[
            'estado',
            'motivo_anulacion',
            'fecha_anulacion',
            'usuario_anulado',
        ])

    compra = (
        Compra.objects
        .select_related('proveedor')
        .prefetch_related('detalles__producto')
        .get(pk=compra.pk)
    )
    return JsonResponse({
        'mensaje': f'Compra #{compra.id} anulada correctamente.',
        'compra': _serializar_compra(compra),
    })
