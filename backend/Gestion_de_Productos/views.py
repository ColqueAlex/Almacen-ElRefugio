import json
from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.db.models import Q
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from Gestion_de_Proveedores.models import Proveedor

from .models import Producto


def _error(mensaje, status=400):
    return JsonResponse({'error': mensaje, 'mensaje': mensaje}, status=status)


def _serializar_producto(producto):
    return {
        'id': producto.id,
        'nombre': producto.nombre,
        'categoria': producto.categoria,
        'marca': producto.marca,
        'precio': str(producto.precio),
        'estado': producto.estado,
        'stock': producto.stock,
        'proveedores': [
            {'id': proveedor.id, 'nombre': proveedor.nombre}
            for proveedor in producto.proveedores.all()
        ],
    }


def _leer_payload(request):
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None, _error('JSON inválido.')

    if not isinstance(data, dict):
        return None, _error('El cuerpo debe ser un objeto JSON.')

    texto = ('nombre', 'categoria', 'marca')
    if any(not isinstance(data.get(campo, ''), str) for campo in texto):
        return None, _error('El nombre, la categoría y la marca deben ser texto.')

    nombre = data.get('nombre', '').strip()
    categoria = data.get('categoria', '').strip()
    marca = data.get('marca', '').strip() or 'Sin marca'
    if not nombre or not categoria:
        return None, _error('El nombre y la categoría son obligatorios.')
    if len(nombre) > 200 or len(categoria) > 100 or len(marca) > 100:
        return None, _error('Uno de los campos supera la longitud permitida.')

    try:
        precio = Decimal(str(data.get('precio', '')))
    except (InvalidOperation, ValueError):
        return None, _error('El precio debe ser un número válido.')
    if not precio.is_finite() or precio <= 0 or precio.as_tuple().exponent < -2:
        return None, _error('El precio debe ser mayor que cero y tener hasta dos decimales.')
    if precio >= Decimal('100000000'):
        return None, _error('El precio supera el máximo permitido.')

    estado = data.get('estado') or 'activo'
    if not isinstance(estado, str) or estado not in dict(Producto.ESTADOS):
        return None, _error('El estado del producto no es válido.')

    ids_proveedores = data.get('proveedores', [])
    if not isinstance(ids_proveedores, list):
        return None, _error('Los proveedores deben enviarse como una lista.')
    if any(
        isinstance(value, bool)
        or not (
            isinstance(value, int)
            or isinstance(value, str) and value.isdigit()
        )
        for value in ids_proveedores
    ):
        return None, _error('La lista de proveedores contiene identificadores inválidos.')
    ids_proveedores = [int(value) for value in ids_proveedores]
    if any(id_proveedor <= 0 for id_proveedor in ids_proveedores):
        return None, _error('La lista de proveedores contiene identificadores inválidos.')

    ids_proveedores = list(dict.fromkeys(ids_proveedores))
    proveedores = list(Proveedor.objects.filter(pk__in=ids_proveedores))
    if len(proveedores) != len(ids_proveedores):
        return None, _error('Uno o más proveedores seleccionados no existen.')

    return {
        'nombre': nombre,
        'categoria': categoria,
        'marca': marca,
        'precio': precio,
        'estado': estado,
        'proveedores': proveedores,
    }, None


@csrf_exempt
def api_listar_productos(request):
    if request.method != 'GET':
        return _error('Método no permitido.', status=405)

    productos = Producto.objects.prefetch_related('proveedores')
    busqueda = request.GET.get('busqueda', '').strip()
    categoria = request.GET.get('categoria', '').strip()
    estado_stock = request.GET.get('estado_stock', '').strip()

    if busqueda:
        productos = productos.filter(
            Q(nombre__icontains=busqueda) | Q(marca__icontains=busqueda)
        )
    if categoria:
        productos = productos.filter(categoria=categoria)
    if estado_stock == 'normal':
        productos = productos.filter(stock__gt=10)
    elif estado_stock == 'bajo':
        productos = productos.filter(stock__gt=0, stock__lte=10)
    elif estado_stock == 'agotado':
        productos = productos.filter(stock=0)
    elif estado_stock:
        return _error('El filtro de stock no es válido.')

    categorias = list(
        Producto.objects.order_by()
        .values_list('categoria', flat=True)
        .distinct()
    )
    proveedores = list(
        Proveedor.objects.order_by('nombre').values('id', 'nombre')
    )
    return JsonResponse({
        'productos': [_serializar_producto(producto) for producto in productos],
        'categorias': categorias,
        'proveedores': proveedores,
    })


@csrf_exempt
def api_guardar_producto(request):
    if request.method != 'POST':
        return _error('Método no permitido.', status=405)

    payload, error = _leer_payload(request)
    if error:
        return error

    proveedores = payload.pop('proveedores')
    with transaction.atomic():
        producto = Producto.objects.create(**payload)
        producto.proveedores.set(proveedores)

    return JsonResponse({
        'mensaje': f'Producto "{producto.nombre}" agregado al catálogo.',
        'producto': _serializar_producto(producto),
    }, status=201)


@csrf_exempt
def api_editar_producto(request, producto_id):
    try:
        producto = Producto.objects.prefetch_related('proveedores').get(pk=producto_id)
    except Producto.DoesNotExist:
        return _error('Producto no encontrado.', status=404)

    if request.method == 'GET':
        proveedores_disponibles = list(
            Proveedor.objects.order_by('nombre').values('id', 'nombre')
        )
        return JsonResponse({
            'producto': _serializar_producto(producto),
            'proveedores_disponibles': proveedores_disponibles,
        })
    if request.method != 'PUT':
        return _error('Método no permitido.', status=405)

    payload, error = _leer_payload(request)
    if error:
        return error

    proveedores = payload.pop('proveedores')
    with transaction.atomic():
        for campo, valor in payload.items():
            setattr(producto, campo, valor)
        producto.save()
        producto.proveedores.set(proveedores)

    return JsonResponse({
        'mensaje': f'Producto "{producto.nombre}" actualizado correctamente.',
        'producto': _serializar_producto(producto),
    })


@csrf_exempt
def api_cambiar_estado_producto(request, producto_id):
    if request.method != 'PATCH':
        return _error('Método no permitido.', status=405)

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return _error('JSON inválido.')
    if not isinstance(data, dict):
        return _error('El cuerpo debe ser un objeto JSON.')

    estado = data.get('estado')
    if not isinstance(estado, str) or estado not in dict(Producto.ESTADOS):
        return _error('El estado del producto no es válido.')

    try:
        producto = Producto.objects.prefetch_related('proveedores').get(pk=producto_id)
    except Producto.DoesNotExist:
        return _error('Producto no encontrado.', status=404)

    producto.estado = estado
    producto.save(update_fields=['estado'])
    return JsonResponse({
        'mensaje': f'Estado del producto actualizado a {estado.capitalize()}',
        'producto': _serializar_producto(producto),
    })
