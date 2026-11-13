# Almacén El Refugio

Aplicación web para administrar productos, proveedores y compras. El frontend
está hecho con React y Vite; el backend usa Django y SQLite.

## Integrantes

- Beltran Joaquin
- Colque Alex
- Mamani Facundo
- Martinez Diego

## Requisitos

- Git.
- Python 3.10 o superior.
- Node.js 20.19 o superior de la rama 20, o 22.12 o superior, y npm.
- PowerShell en Windows.

Comprobar las herramientas instaladas:

```powershell
git --version
py --version
node --version
npm --version
```

## Bibliotecas y herramientas del proyecto

No hace falta instalar cada biblioteca manualmente ni de forma global. Los
comandos de instalación de las secciones siguientes las descargan desde los
archivos de dependencias del repositorio.

### Backend de Python

`pip install -r requirements.txt` instala:

- **Django 5.2**: servidor web, API, modelos y migraciones de la base de datos.
- **django-cors-headers**: permite la comunicación local entre Vite y Django.
- **SQLite**: base de datos utilizada por el proyecto. Viene incluida con
  Python; no hay que instalar un servidor ni un paquete adicional.

Las aplicaciones `admin`, `auth`, `contenttypes` y `sessions` usadas por Django
también vienen incluidas con Django.

### Frontend de JavaScript

`npm ci` instala las versiones del `package-lock.json`.

Dependencias principales:

- **react** y **react-dom**: interfaz de usuario.
- **react-router-dom**: navegación entre páginas.

Herramientas de desarrollo y comprobación:

- **vite** y **@vitejs/plugin-react**: servidor local y compilación.
- **eslint**, **@eslint/js**, **eslint-plugin-react-hooks**,
  **eslint-plugin-react-refresh** y **globals**: revisión del código.
- **@types/react** y **@types/react-dom**: definiciones de tipos usadas por las
  herramientas de desarrollo.

La tipografía y los iconos Material Symbols se cargan desde Google Fonts; se
necesita conexión a Internet para que se vean correctamente. No son paquetes
que el equipo tenga que instalar.

## Descargar el proyecto

En una terminal PowerShell, clonar el repositorio y entrar a la carpeta:

```powershell
git clone https://github.com/ColqueAlex/Almacen-ElRefugio.git
cd Almacen-ElRefugio
```

## Instalar y ejecutar el backend

Desde la carpeta raíz del proyecto:

```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8001
```

Dejar esta terminal abierta mientras se usa la aplicación. Si PowerShell bloquea
la activación del entorno virtual, permitir scripts solo en esa terminal y
volver a activarlo:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

El comando `migrate` crea o actualiza la base local `backend/db.sqlite3`. No se
debe crear ni copiar manualmente: el archivo está excluido de Git y cada
integrante tendrá su propia base de desarrollo.

## Instalar y ejecutar el frontend

Abrir una segunda terminal PowerShell en la carpeta raíz del proyecto y
ejecutar:

```powershell
npm ci
npm run dev
```

Abrir en el navegador la dirección que muestra Vite, normalmente:

```text
http://127.0.0.1:5173
```

El backend debe seguir ejecutándose en `http://127.0.0.1:8001`. Vite reenvía las
solicitudes `/api` a ese puerto; para el uso local normal no hace falta crear un
archivo `.env`.

Para detener cada servidor, usar `Ctrl+C` en su terminal.

## Comandos disponibles del frontend

Ejecutar estos comandos desde la carpeta raíz:

| Comando | Función |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo de Vite. |
| `npm run build` | Compila el frontend para producción. |
| `npm run lint` | Revisa errores de estilo y uso de JavaScript/React. |
| `npm run preview` | Sirve localmente una compilación ya generada. |

## Actualizar el proyecto después de descargar cambios

Desde la carpeta raíz:

```powershell
git pull
```

Si cambiaron las dependencias de Python, actualizar el backend:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
```

Si cambiaron `package.json` o `package-lock.json`, abrir otra terminal en la
raíz y ejecutar:

```powershell
npm ci
```

Siempre ejecutar `python manage.py migrate` después de descargar migraciones
nuevas. Al modificar modelos de Django, generar y compartir también sus
migraciones; no compartir el archivo `db.sqlite3`.

## Comprobaciones

Backend, desde `backend` con el entorno virtual activado:

```powershell
python manage.py check
python manage.py test Gestion_de_Productos Gestion_de_Proveedores Registro_de_Compras
```

Frontend, desde la raíz:

```powershell
npm run lint
npm run build
```

## Funciones y API local

- Proveedores: `GET /api/proveedores/`, `POST /api/proveedores/crear/` y
  `GET`/`PUT`/`PATCH /api/proveedores/editar/<id>/`.
- Productos: `GET /api/productos/`, `POST /api/productos/guardar/`,
  `GET`/`PUT /api/productos/<id>/` y
  `PATCH /api/productos/<id>/cambiar_estado/`.
- Compras: `GET` y `POST /api/compras/`; anulación con
  `PATCH /api/compras/<id>/anular/`.

El registro de una compra guarda sus detalles y lotes, calcula el total en el
backend y actualiza el stock dentro de una transacción. La anulación requiere
un motivo y revierte el stock si aún está disponible.

El inicio de sesión real todavía no está integrado. Por ese motivo,
`id_usuario_id` y `usuario_anulacion_id` permanecen en `NULL` temporalmente.

## Problemas comunes

- **No se puede conectar con Django:** confirmar que el backend esté activo en
  el puerto `8001`.
- **El puerto `8001` está ocupado:** detener el proceso que lo usa o coordinar
  un cambio del puerto del backend y del proxy en `vite.config.js`.
- **No aparecen tablas o datos iniciales:** ejecutar `python manage.py migrate`
  desde `backend`.
- **`npm ci` falla por la versión de Node.js:** instalar una versión compatible
  indicada en [Requisitos](#requisitos).
