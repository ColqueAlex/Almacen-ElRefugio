import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './Proveedores.css';

function ProveedoresList({
  proveedores = [],
  totalProveedores,
  activosCount,
  inactivosCount,
  onToggleEstado,
  itemsPerPage = 10
}) {
  const [busqueda, setBusqueda] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [actualizandoId, setActualizandoId] = useState(null);
  const [errorEstado, setErrorEstado] = useState('');

  // Filtrado por nombre o rubro de proveedor
  const proveedoresFiltrados = useMemo(() => {
    const query = busqueda.trim().toLowerCase();
    if (!query) return proveedores;
    return proveedores.filter(
      (prov) =>
        prov.nombre.toLowerCase().includes(query) ||
        (prov.tipo_productos && prov.tipo_productos.toLowerCase().includes(query))
    );
  }, [proveedores, busqueda]);

  // Cálculo de KPIs (usa los props si vienen del backend o los calcula localmente)
  const total = totalProveedores ?? proveedores.length;
  const activos = activosCount ?? proveedores.filter((p) => p.activo).length;
  const inactivos = inactivosCount ?? proveedores.filter((p) => !p.activo).length;

  // Paginación
  const totalPages = Math.max(1, Math.ceil(proveedoresFiltrados.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProveedores = useMemo(() => {
    const startIndex = (safePage - 1) * itemsPerPage;
    return proveedoresFiltrados.slice(startIndex, startIndex + itemsPerPage);
  }, [proveedoresFiltrados, safePage, itemsPerPage]);

  const handleSearchChange = (e) => {
    setBusqueda(e.target.value);
    setCurrentPage(1);
  };

  const handleSwitchEstado = async (proveedor) => {
    if (!onToggleEstado || actualizandoId !== null) return;

    setErrorEstado('');
    setActualizandoId(proveedor.id);
    try {
      await onToggleEstado(proveedor.id, !proveedor.activo);
    } catch (error) {
      setErrorEstado(error.message || 'No se pudo cambiar el estado del proveedor.');
    } finally {
      setActualizandoId(null);
    }
  };

  return (
    <div className="inv-container">
      {/* ENCABEZADO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span className="subtitle-badge">Gestión de Compras y Suministros</span>
          <h1 className="page-title">Directorio de Proveedores</h1>
        </div>
        <Link to="/proveedores/nuevo" className="btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span> Nuevo Proveedor
        </Link>
      </div>

      {errorEstado && <div className="alert-error-box" role="alert">{errorEstado}</div>}

      {/* KPI CARDS */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-info">
            <h3>Total Proveedores</h3>
            <div className="value">{total}</div>
            <div className="sub" style={{ color: 'var(--primary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>trending_up</span> En padrón
            </div>
          </div>
          <div className="kpi-icon blue">
            <span className="material-symbols-outlined">local_shipping</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <h3>Proveedores Activos</h3>
            <div className="value" style={{ color: 'var(--secondary)' }}>{activos}</div>
            <div className="sub">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span> Suministro regular
            </div>
          </div>
          <div className="kpi-icon green">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <h3>Proveedores Inactivos</h3>
            <div className="value">{inactivos}</div>
            <div className="sub" style={{ color: 'var(--text-muted)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>pause_circle</span> Sin pedidos recientes
            </div>
          </div>
          <div className="kpi-icon red">
            <span className="material-symbols-outlined">pause_circle</span>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar">
        <div className="toolbar-left">
          <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
            <div className="search-box">
              <span className="material-symbols-outlined">search</span>
              <input
                type="text"
                name="busqueda"
                value={busqueda}
                onChange={handleSearchChange}
                placeholder="Buscar por nombre de proveedor..."
              />
            </div>
          </form>
        </div>
      </div>

      {/* TABLA DE PROVEEDORES */}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Proveedor</th>
              <th>Contacto Directo</th>
              <th>Rubro / Productos</th>
              <th style={{ textAlign: 'center' }}>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProveedores.length > 0 ? (
              paginatedProveedores.map((proveedor) => (
                <tr key={proveedor.id} style={!proveedor.activo ? { opacity: 0.7 } : undefined}>
                  <td>
                    <div className="prod-info">
                      <div className={`prod-avatar ${!proveedor.activo ? 'badge-gray' : ''}`}>
                        {proveedor.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="prod-details">
                        <h4>{proveedor.nombre}</h4>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontSize: '13px' }}>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '16px', color: proveedor.activo ? 'var(--secondary)' : 'var(--text-muted)' }}
                      >
                        call
                      </span>
                      {proveedor.numero_telefono || 'Sin teléfono'}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-gray">{proveedor.tipo_productos}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {proveedor.activo ? (
                      <span className="badge badge-success">Activo</span>
                    ) : (
                      <span className="badge badge-gray" style={{ background: 'var(--bg-body)', color: 'var(--text-muted)' }}>
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="actions">
                      <Link to={`/proveedores/editar/${proveedor.id}`} className="btn-icon" title="Editar Proveedor">
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit</span>
                      </Link>

                      <label className="switch" title="Cambiar estado">
                        <input
                          type="checkbox"
                          checked={!!proveedor.activo}
                          disabled={actualizandoId !== null}
                          aria-label={`Cambiar estado de ${proveedor.nombre}`}
                          title={proveedor.activo ? 'Cambiar a inactivo' : 'Cambiar a activo'}
                          onChange={() => handleSwitchEstado(proveedor)}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No se encontraron proveedores.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* PAGINACIÓN */}
        <div className="pagination">
          <span className="page-info">
            Mostrando página {safePage} de {totalPages}
          </span>
          <div className="page-buttons">
            {safePage > 1 && (
              <button
                type="button"
                className="page-btn"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
              </button>
            )}

            <button type="button" className="page-btn active">
              {safePage}
            </button>

            {safePage < totalPages && (
              <button
                type="button"
                className="page-btn"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProveedoresList;
