import { useEffect, useState } from 'react';
import './Auditoria.css';

const ListaAuditoria = () => {
  const [registros, setRegistros] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Estados para el Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);

  const API_URL = 'http://127.0.0.1:8001/api/auditoria/';

  useEffect(() => {
    fetch(API_URL)
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar la auditoría');
        return res.json();
      })
      .then(data => {
        setRegistros(data);
        setCargando(false);
      })
      .catch(err => {
        console.error(err);
        setError('No se pudo conectar con el servidor.');
        setCargando(false);
      });
  }, []);

  const registrosFiltrados = registros.filter(reg => {
    const termino = busqueda.toLowerCase();
    const usuario = reg.usuario_username?.toLowerCase() || 'sistema';
    const modelo = reg.modelo?.toLowerCase() || '';
    const desc = reg.descripcion?.toLowerCase() || '';
    return usuario.includes(termino) || modelo.includes(termino) || desc.includes(termino);
  });

  const formatearFecha = (fechaString) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleString('es-ES', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  const abrirModal = (registro) => {
    setRegistroSeleccionado(registro);
    setModalAbierto(true);
  };

  if (cargando) return <div className="inv-container"><p>Cargando registros de auditoría...</p></div>;

  return (
    <div className="inv-container">
      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '15px', borderRadius: '8px' }}>{error}</div>}

      <div>
        <span className="subtitle-badge">
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>shield</span> Seguridad y Control
        </span>
        <h1 className="page-title">Registro de Actividades</h1>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <span className="material-symbols-outlined">search</span>
          <input 
            type="text" 
            placeholder="Buscar por usuario, módulo o descripción..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {/* TABLA */}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Usuario</th>
              <th>Módulo</th>
              <th>Acción</th>
              <th style={{ textAlign: 'right' }}>Detalles</th>
            </tr>
          </thead>
          <tbody>
            {registrosFiltrados.map((reg) => (
              <tr key={reg.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', fontSize: '13px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-muted)' }}>schedule</span>
                    {formatearFecha(reg.fecha_hora)} hs
                  </div>
                </td>
                <td>
                  <div className="user-info">
                    <div className="user-avatar" style={!reg.usuario_username ? { background: 'var(--text-muted)' } : {}}>
                      {reg.usuario_username ? reg.usuario_username.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div className="user-details">
                      <h4>{reg.usuario_username || 'Sistema'}</h4>
                      <span>{reg.usuario_perfil || 'Automático'}</span>
                    </div>
                  </div>
                </td>
                <td><span className="badge badge-gray">{reg.modelo}</span></td>
                <td>
                  {reg.accion === 'creacion' && <span className="badge badge-creacion">Creación</span>}
                  {reg.accion === 'modificacion' && <span className="badge badge-modificacion">Modificación</span>}
                  {reg.accion === 'eliminacion' && <span className="badge badge-eliminacion">Eliminación</span>}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn-action btn-detalle" onClick={() => abrirModal(reg)}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span> Ver detalle
                  </button>
                </td>
              </tr>
            ))}
            {registrosFiltrados.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No hay registros de auditoría que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && registroSeleccionado && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-content" style={{ width: '600px', maxWidth: '90%' }}>
            <div className="modal-header">
              <h3>Detalle de Actividad</h3>
              <button className="btn-cerrar-modal" onClick={() => setModalAbierto(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="modal-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Usuario</div>
                  <div style={{ fontWeight: '700', fontSize: '14px' }}>{registroSeleccionado.usuario_username || 'Sistema'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fecha</div>
                  <div style={{ fontWeight: '700', fontSize: '14px' }}>{formatearFecha(registroSeleccionado.fecha_hora)}</div>
                </div>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Descripción</div>
                <div className="detail-box" style={{ background: 'var(--bg-body)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontWeight: '500' }}>
                  {registroSeleccionado.descripcion}
                </div>
              </div>

              {((registroSeleccionado.datos_anteriores && Object.keys(registroSeleccionado.datos_anteriores).length > 0) || 
                (registroSeleccionado.datos_nuevos && Object.keys(registroSeleccionado.datos_nuevos).length > 0)) && (
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Cambios Registrados (JSON)</div>
                  <pre style={{ background: '#0f172a', color: '#10b981', padding: '12px', borderRadius: '8px', fontSize: '11px', overflowX: 'auto', maxHeight: '200px', whiteSpace: 'pre-wrap' }}>
                    {`ANTES:\n${registroSeleccionado.datos_anteriores ? JSON.stringify(registroSeleccionado.datos_anteriores, null, 2) : "Sin datos"}\n\nDESPUÉS:\n${registroSeleccionado.datos_nuevos ? JSON.stringify(registroSeleccionado.datos_nuevos, null, 2) : "Sin datos"}`}
                  </pre>
                </div>
              )}
            </div>

            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', textAlign: 'right' }}>
              <button type="button" className="btn-action btn-detalle" onClick={() => setModalAbierto(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ListaAuditoria;