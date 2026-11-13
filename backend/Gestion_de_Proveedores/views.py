import json

from django.db import IntegrityError, transaction
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt

from .models import Proveedor


def _serializar_proveedor(proveedor):
    return {
        'id': proveedor.id,
        'nombre': proveedor.nombre,
        'numero_telefono': proveedor.numero_telefono,
        'tipo_productos': proveedor.tipo_productos,
        'activo': proveedor.activo,
    }


def _leer_payload(request):
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None, JsonResponse({'error': 'JSON inválido'}, status=400)

    if not isinstance(data, dict):
        return None, JsonResponse({'error': 'El cuerpo debe ser un objeto JSON.'}, status=400)

    campos = ('nombre', 'numero_telefono', 'tipo_productos')
    if any(not isinstance(data.get(campo, ''), str) for campo in campos):
        return None, JsonResponse({'error': 'Todos los campos deben ser texto.'}, status=400)

    payload = {
        'nombre': data.get('nombre', '').strip(),
        'numero_telefono': data.get('numero_telefono', '').strip(),
        'tipo_productos': data.get('tipo_productos', '').strip(),
    }

    if not any(caracter.isalpha() for caracter in payload['nombre']):
        return None, JsonResponse(
            {'error': 'El nombre del proveedor debe contener letras y no puede ser solo números.'},
            status=400,
        )
    if payload['numero_telefono'] and not (
        payload['numero_telefono'].isascii() and payload['numero_telefono'].isdigit()
    ):
        return None, JsonResponse(
            {'error': 'El número de teléfono solo puede contener números.'},
            status=400,
        )
    if not any(caracter.isalpha() for caracter in payload['tipo_productos']):
        return None, JsonResponse(
            {'error': 'El rubro debe contener letras y no puede ser solo números.'},
            status=400,
        )

    return payload, None


def _guardar_proveedor(request, proveedor=None):
    payload, error = _leer_payload(request)
    if error:
        return error

    existentes = Proveedor.objects.filter(nombre__iexact=payload['nombre'])
    if proveedor:
        existentes = existentes.exclude(pk=proveedor.pk)
    if existentes.exists():
        return JsonResponse(
            {'error': f'Ya existe un proveedor registrado con el nombre "{payload["nombre"]}".'},
            status=400,
        )

    try:
        with transaction.atomic():
            if proveedor:
                for campo, valor in payload.items():
                    setattr(proveedor, campo, valor)
                proveedor.save()
            else:
                proveedor = Proveedor.objects.create(**payload)
    except IntegrityError:
        return JsonResponse(
            {'error': f'Ya existe un proveedor registrado con el nombre "{payload["nombre"]}".'},
            status=400,
        )

    return JsonResponse(
        {
            'mensaje': f'Proveedor "{proveedor.nombre}" guardado correctamente.',
            'proveedor': _serializar_proveedor(proveedor),
        },
        status=201 if request.method == 'POST' else 200,
    )


@csrf_exempt
def api_listar_proveedores(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    proveedores = Proveedor.objects.all()
    return JsonResponse({'proveedores': [_serializar_proveedor(item) for item in proveedores]})


@csrf_exempt
def api_crear_proveedor(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    return _guardar_proveedor(request)


@csrf_exempt
def api_editar_proveedor(request, proveedor_id):
    proveedor = get_object_or_404(Proveedor, pk=proveedor_id)

    if request.method == 'GET':
        return JsonResponse({'proveedor': _serializar_proveedor(proveedor)})
    if request.method == 'PATCH':
        try:
            data = json.loads(request.body)
        except (json.JSONDecodeError, UnicodeDecodeError):
            return JsonResponse({'error': 'JSON inválido'}, status=400)

        if not isinstance(data, dict) or type(data.get('activo')) is not bool:
            return JsonResponse(
                {'error': 'El estado activo debe ser verdadero o falso.'},
                status=400,
            )

        proveedor.activo = data['activo']
        proveedor.save(update_fields=['activo'])
        return JsonResponse({
            'mensaje': 'Estado del proveedor actualizado correctamente.',
            'proveedor': _serializar_proveedor(proveedor),
        })
    if request.method != 'PUT':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    return _guardar_proveedor(request, proveedor)
