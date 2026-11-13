import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './usuarios.css'; 

const ListaUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  const API_URL = 'http://127.0.0.1:8001/api/usuarios/';

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al conectar con Django');
      const data = await res.json();
      setUsuarios(data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('No se pudo conectar al backend. ¿Está corriendo Django en el puerto 8001?');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const toggleEstado = async (dni) => {
    if (!window.confirm("¿Seguro que deseas cambiar el estado de este usuario?")) return;
    try {
      await fetch(`${API_URL}${dni}/toggle_estado/`, { method: 'POST' });
      cargarUsuarios();
    } catch (error) {
      alert("Error al cambiar estado");
    }
  };

  const resetearClave = async (dni) => {
    if (!window.confirm("¿Restablecer la clave al DNI del usuario?")) return;
    try {
      await fetch(`${API_URL}${dni}/restablecer_clave/`, { method: 'POST' });
      alert("Clave restablecida al DNI");
    } catch (error) {
      alert("Error al restablecer clave");
    }
  };

  const usuariosFiltrados = usuarios.filter(u => 
    u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || 
    u.apellido?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.dni?.includes(busqueda)
  );

  // Cálculos para las tarjetas de arriba
  const totalUsuarios = usuarios.length;
  const usuariosActivos = usuarios.filter(u => u.activo).length;
  const usuariosInactivos = totalUsuarios - usuariosActivos;

  if (cargando) return <div className="inv-container"><p>Cargando usuarios...</p></div>;

  return (
    <div className="inv-container">
      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '15px', borderRadius: '8px' }}>{error}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Gestión de Usuarios</h1>
        </div>
        <Link to="/usuarios/nuevo" className="btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span> Nuevo Usuario
        </Link>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-info">
            <h3>Total Usuarios</h3>
            <div className="value" style={{ color: 'var(--primary)' }}>{totalUsuarios}</div>
          </div>
          <div className="kpi-icon blue"><span className="material-symbols-outlined">manage_accounts</span></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-info">
            <h3>Activos</h3>
            <div className="value" style={{ color: 'var(--secondary)' }}>{usuariosActivos}</div>
          </div>
          <div className="kpi-icon green"><span className="material-symbols-outlined">how_to_reg</span></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-info">
            <h3>Inactivos</h3>
            <div className="value" style={{ color: 'var(--danger)' }}>{usuariosInactivos}</div>
          </div>
          <div className="kpi-icon red"><span className="material-symbols-outlined">person_off</span></div>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <span className="material-symbols-outlined">search</span>
          <input 
            type="text" 
            placeholder="Buscar por nombre, DNI o correo..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Usuario / DNI</th>
              <th>Contacto</th>
              <th>Perfil / Rol</th>
              <th style={{ textAlign: 'center' }}>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map((u) => (
              <tr key={u.dni}>
                <td>
                  <div className="user-info">
                    <div className="user-avatar" style={!u.activo ? { background: 'var(--bg-body)', color: 'var(--text-muted)' } : {}}>
                      {u.nombre?.charAt(0).toUpperCase()}{u.apellido?.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-details">
                      <h4>{u.nombre} {u.apellido}</h4>
                      <span>@{u.username} • DNI: {u.dni}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-muted)' }}>mail</span>
                    {u.correo}
                  </div>
                </td>
                <td>
                  {u.perfil_nombre === 'Administrador' ? (
                    <span className="badge badge-admin"><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>key</span> Administrador</span>
                  ) : u.perfil_nombre === 'Vendedor' ? (
                    <span className="badge badge-vendedor"><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>point_of_sale</span> Vendedor</span>
                  ) : (
                    <span className="badge">{u.perfil_nombre || "Sin perfil"}</span>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {u.activo ? (
                    <span className="badge badge-activo">Activo</span>
                  ) : (
                    <span className="badge badge-inactivo">Inactivo</span>
                  )}
                </td>
                <td>
                  <div className="actions">
                    <Link to={`/usuarios/editar/${u.dni}`} className="btn-icon" title="Editar">
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit</span>
                    </Link>
                    
                    <button onClick={() => resetearClave(u.dni)} className="btn-icon" title="Restablecer Clave">
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>lock_reset</span>
                    </button>

                    <label className="switch" title="Cambiar estado">
                      <input 
                        type="checkbox" 
                        checked={u.activo} 
                        onChange={() => toggleEstado(u.dni)} 
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </td>
              </tr>
            ))}
            {usuariosFiltrados.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No hay usuarios registrados que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ListaUsuarios;