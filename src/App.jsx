import { useEffect, useState } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import logo from './assets/logo.png';
import GestionProductos from './Prosesos/Gestion_de_Productos/Productos';
import RegistroVentas from './Prosesos/Registro_de_venta/RegistroVentas';
import HistorialVentas from './Prosesos/Gestion_de_Ventas/HistorialVentas';
import DashboardPrincipal from './components/Main/Main';

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

  const navItemClass = (path) =>
    `nav-item ${location.pathname === path ? 'active' : ''}`;

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
          <Route path="/registrar-venta" element={<RegistroVentas />} />
          <Route path="/ventas" element={<HistorialVentas />} />
          <Route path="/proveedores" element={<ModuleUnavailable name="Proveedores" />} />
          <Route path="/listar-proveedores" element={<ModuleUnavailable name="Proveedores" />} />
          <Route path="/compras" element={<ModuleUnavailable name="Compras" />} />
          <Route path="/registrar-compra" element={<ModuleUnavailable name="Registrar compra" />} />
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
