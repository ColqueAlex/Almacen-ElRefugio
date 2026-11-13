import { useEffect, useState } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import logo from './assets/logo.png';
import GestionProductos from './Prosesos/Gestion_de_Productos/Productos';
import EditarProducto from './Prosesos/Gestion_de_Productos/productoEditar';
import RegistroVentas from './Prosesos/Registro_de_venta/RegistroVentas';
import HistorialVentas from './Prosesos/Gestion_de_Ventas/HistorialVentas';
import DashboardPrincipal from './components/Main/Main';
import ProveedoresList from './Prosesos/Gestion_de_Proveedores/ProveedoresList';
import ProveedorForm from './Prosesos/Gestion_de_Proveedores/ProveedorForm';
import GestionCompra from './Prosesos/Gestion_de_Compras/ComprasList';
import RegistroCompras from './Prosesos/Registro_de_Compras/RegistroCompras';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';

async function requestApi(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch {
    throw new Error('No se pudo conectar con Django. Verificá que el backend esté ejecutándose.');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('El servidor respondió con una respuesta inválida.');
  }

  if (!response.ok) {
    throw new Error(data.error || 'Error al procesar la solicitud.');
  }

  return data;
}

function handleGuardarProveedor(payload, esEdicion) {
  const path = esEdicion
    ? `/api/proveedores/editar/${payload.id}/`
    : '/api/proveedores/crear/';

  return requestApi(path, {
    method: esEdicion ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

function handleObtenerProveedor(id) {
  return requestApi(`/api/proveedores/editar/${id}/`);
}

function handleCambiarEstadoProveedor(id, activo) {
  return requestApi(`/api/proveedores/editar/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activo }),
  });
}

function ProveedoresPage() {
  const [proveedores, setProveedores] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;

    requestApi('/api/proveedores/')
      .then((data) => {
        if (vigente) setProveedores(data.proveedores);
      })
      .catch((err) => {
        if (vigente) setError(err.message);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [intento]);

  if (cargando) return <p>Cargando proveedores...</p>;
  if (error) {
    return (
      <section>
        <div className="alert-error-box">{error}</div>
        <button type="button" className="btn btn-cancel" onClick={() => {
          setError('');
          setCargando(true);
          setIntento((actual) => actual + 1);
        }}>
          Reintentar
        </button>
      </section>
    );
  }

  const cambiarEstado = async (id, activo) => {
    const data = await handleCambiarEstadoProveedor(id, activo);
    setProveedores((actuales) =>
      actuales.map((proveedor) =>
        proveedor.id === id ? data.proveedor : proveedor,
      ),
    );
  };

  return (
    <ProveedoresList
      proveedores={proveedores}
      onToggleEstado={cambiarEstado}
    />
  );
}

function RegistroComprasPage() {
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;

    Promise.all([
      requestApi('/api/proveedores/'),
      requestApi('/api/productos/'),
    ])
      .then(([datosProveedores, datosProductos]) => {
        if (!Array.isArray(datosProveedores.proveedores)
          || !Array.isArray(datosProductos.productos)) {
          throw new Error('Django devolvió un catálogo con un formato inválido.');
        }
        if (vigente) {
          setProveedores(datosProveedores.proveedores);
          setProductos(datosProductos.productos);
          setError('');
        }
      })
      .catch((err) => {
        if (vigente) setError(err.message || 'No se pudieron cargar los catálogos.');
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [intento]);

  if (cargando) {
    return <p role="status">Cargando proveedores y productos...</p>;
  }

  if (error) {
    return (
      <section>
        <div className="alert-error-box">{error}</div>
        <button
          type="button"
          className="btn btn-cancel"
          onClick={() => {
            setError('');
            setCargando(true);
            setIntento((actual) => actual + 1);
          }}
        >
          Reintentar
        </button>
      </section>
    );
  }

  const mapeoProveedores = {};
  const productosSinProveedor = [];
  productos.forEach((producto) => {
    const proveedoresProducto = Array.isArray(producto.proveedores)
      ? producto.proveedores
      : [];
    if (proveedoresProducto.length === 0) {
      productosSinProveedor.push(producto.id);
    }
    proveedoresProducto.forEach((proveedor) => {
      const idProveedor = String(proveedor.id);
      if (!mapeoProveedores[idProveedor]) mapeoProveedores[idProveedor] = [];
      mapeoProveedores[idProveedor].push(producto.id);
    });
  });

  const handleRegistrarCompra = (payload) => requestApi('/api/compras/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return (
    <RegistroCompras
      proveedores={proveedores}
      productos={productos}
      mapeoProveedores={mapeoProveedores}
      productosSinProveedor={productosSinProveedor}
      onRegistrarCompra={handleRegistrarCompra}
    />
  );
}

function ComprasPage() {
  const [compras, setCompras] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;

    requestApi('/api/compras/')
      .then((data) => {
        if (!Array.isArray(data.compras)) {
          throw new Error('Django devolvió un historial de compras con formato inválido.');
        }
        if (vigente) {
          setCompras(data.compras);
          setError('');
        }
      })
      .catch((err) => {
        if (vigente) setError(err.message || 'No se pudieron cargar las compras.');
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [intento]);

  const handleAnularCompra = async (id, motivo) => {
    const data = await requestApi(`/api/compras/${id}/anular/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo }),
    });
    setCompras((actuales) =>
      actuales.map((compra) => compra.id === id ? data.compra : compra),
    );
  };

  if (cargando) return <p role="status">Cargando compras...</p>;
  if (error) {
    return (
      <section>
        <div className="alert-error-box">{error}</div>
        <button
          type="button"
          className="btn btn-cancel"
          onClick={() => {
            setError('');
            setCargando(true);
            setIntento((actual) => actual + 1);
          }}
        >
          Reintentar
        </button>
      </section>
    );
  }

  return <GestionCompra compras={compras} onAnularCompra={handleAnularCompra} />;
}

function Layout({ children, user, onLogout }) {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState('');
  const isAdmin = user?.perfil === 'Administrador';

  useEffect(() => {
    const updateClock = () => {
      setCurrentTime(
        new Date().toLocaleString('es-ES', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      );
    };

    updateClock();
    const intervalId = setInterval(updateClock, 60_000);
    return () => clearInterval(intervalId);
  }, []);

  const navItemClass = (path) => {
    const active = location.pathname === path
      || (path !== '/' && location.pathname.startsWith(`${path}/`));
    return `nav-item ${active ? 'active' : ''}`;
  };

  return (
    <>
      <aside className="sidebar">
        <div
          className="sidebar-brand"
          style={{ display: 'flex', justifyContent: 'center', padding: '20px 10px' }}
        >
          <img
            src={logo}
            alt="Logo El Refugio"
            style={{ maxWidth: '100%', height: 'auto', maxHeight: '55px', objectFit: 'contain' }}
          />
        </div>

        <nav className="sidebar-nav">
          <Link to="/" className={navItemClass('/')}>
            <span className="material-symbols-outlined">home</span> Inicio
          </Link>
          <Link to="/registrar-venta" className={navItemClass('/registrar-venta')}>
            <span className="material-symbols-outlined">point_of_sale</span> Ventas
          </Link>
          <Link to="/ventas" className={navItemClass('/ventas')}>
            <span className="material-symbols-outlined">receipt_long</span> Historial de Ventas
          </Link>

          {isAdmin && (
            <>
              <Link to="/consultar" className={navItemClass('/consultar')}>
                <span className="material-symbols-outlined">inventory_2</span> Productos &amp; Stock
              </Link>
              <Link to="/proveedores" className={navItemClass('/proveedores')}>
                <span className="material-symbols-outlined">local_shipping</span> Proveedores
              </Link>
              <Link to="/compras" className={navItemClass('/compras')}>
                <span className="material-symbols-outlined">shopping_bag</span> Compras
              </Link>
              <Link to="/auditoria" className={navItemClass('/auditoria')}>
                <span className="material-symbols-outlined">history</span> Auditoría
              </Link>
              <Link to="/usuarios" className={navItemClass('/usuarios')}>
                <span className="material-symbols-outlined">manage_accounts</span> Usuarios
              </Link>
            </>
          )}

          <Link to="/caja" className={navItemClass('/caja')}>
            <span className="material-symbols-outlined">payments</span> Caja &amp; Arqueo
          </Link>
          <Link to="/clientes" className={navItemClass('/clientes')}>
            <span className="material-symbols-outlined">group</span> Clientes (Cuentas)
          </Link>
        </nav>
      </aside>

      <div className="main-content">
        <header className="top-header">
          <div className="header-time">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>schedule</span>
            <span>{currentTime}</span>
          </div>

          <div className="header-user">
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
              <strong style={{ fontSize: '13px' }}>{user?.username || 'Invitado'}</strong>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {user?.perfil || 'Usuario'}
              </span>
            </div>
            <div className="avatar">{(user?.username || 'I').charAt(0).toUpperCase()}</div>
            {user && (
              <button
                type="button"
                className="btn-logout"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
                style={{ marginLeft: '10px' }}
                onClick={onLogout}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
              </button>
            )}
          </div>
        </header>

        <main className="inv-container">{children}</main>
      </div>
    </>
  );
}

function ModuleUnavailable({ name }) {
  return (
    <section>
      <span className="subtitle-badge">Módulo</span>
      <h1 className="page-title">{name}</h1>
      <p>Esta pantalla todavía no está disponible.</p>
    </section>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState({
    username: 'Joaquín',
    perfil: 'Administrador',
  });
  const dashboardUser = currentUser || { username: 'Invitado', perfil: '' };

  return (
    <BrowserRouter>
      <Layout user={currentUser} onLogout={() => setCurrentUser(null)}>
        <Routes>
          <Route
            path="/"
            element={<DashboardPrincipal user={dashboardUser} />}
          />
          <Route path="/consultar" element={<GestionProductos />} />
          <Route path="/consultar/editar/:id" element={<EditarProducto />} />
          <Route path="/registrar-venta" element={<RegistroVentas />} />
          <Route path="/ventas" element={<HistorialVentas />} />
          <Route path="/proveedores" element={<ProveedoresPage />} />
          <Route
            path="/proveedores/nuevo"
            element={<ProveedorForm onGuardar={handleGuardarProveedor} />}
          />
          <Route
            path="/proveedores/editar/:id"
            element={
              <ProveedorForm
                onGuardar={handleGuardarProveedor}
                onCargar={handleObtenerProveedor}
              />
            }
          />
          <Route path="/compras" element={<ComprasPage />} />
          <Route path="/compras/nueva" element={<RegistroComprasPage />} />
          <Route path="/registrar-compra" element={<RegistroComprasPage />} />
          <Route path="/auditoria" element={<ModuleUnavailable name="Auditoría" />} />
          <Route path="/listar-auditoria" element={<ModuleUnavailable name="Auditoría" />} />
          <Route path="/usuarios" element={<ModuleUnavailable name="Usuarios" />} />
          <Route path="/caja" element={<ModuleUnavailable name="Caja y arqueo" />} />
          <Route path="/gestion-caja" element={<ModuleUnavailable name="Caja" />} />
          <Route path="/clientes" element={<ModuleUnavailable name="Clientes" />} />
          <Route path="/cuentas-clientes" element={<ModuleUnavailable name="Cuentas de clientes" />} />
          <Route path="*" element={<ModuleUnavailable name="Página no encontrada" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
