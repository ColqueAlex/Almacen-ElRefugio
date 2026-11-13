import React, { useState, useMemo } from 'react';
import './HistorialVentas.css';

function HistorialVentas({
  ventas = [],
  periodoInicial = 'todos',
  onCambiarFiltroPeriodo,
  onAnularVenta
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [periodo, setPeriodo] = useState(periodoInicial);
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handlePeriodoChange = (e) => {
    const val = e.target.value;
    setPeriodo(val);
    if (onCambiarFiltroPeriodo) {
      onCambiarFiltroPeriodo(val);
    }
  };

  const filteredVentas = useMemo(() => {
    return ventas.filter(venta => {
      const clienteInfo = venta.cliente_info || (venta.id_clientes ? `${venta.id_clientes.nombre} ${venta.id_clientes.apellido || ''}` : 'Consumidor Final');
      const textToSearch = `${venta.id_ventas} ${clienteInfo}`.toLowerCase();
      return textToSearch.includes(searchQuery.toLowerCase());
    });
  }, [ventas, searchQuery]);

  return (
    <div className="historial-ventas-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
        <div>
          <span className="subtitle-badge">Registro de Operaciones</span>
          <h1 className="page-title">Historial de Ventas</h1>
        </div>
        <a href="/registrar-venta" className="btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span> Nueva Venta
        </a>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <span className="material-symbols-outlined">search</span>
          <input 
            type="text" 
            placeholder="Buscar por N° Venta o Cliente..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <form style={{ display: 'flex', gap: '10px' }} onSubmit={(e) => e.preventDefault()}>
          <select 
            name="filtro" 
            className="filter-select" 
            value={periodo} 
            onChange={handlePeriodoChange}
          >
            <option value="todos">Todas las fechas</option>
            <option value="semana">Última semana</option>
            <option value="mes">Último mes</option>
            <option value="año">Este año</option>
          </select>
        </form>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>N° Venta</th>
              <th>Caja</th>
              <th>Total</th>
              <th>Fecha / Hora</th>
              <th>Cliente</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredVentas.length > 0 ? (
              filteredVentas.map((venta) => {
                const isExpanded = !!expandedRows[venta.id_ventas];
                const estadoLower = (venta.estado_de_pago || '').toLowerCase();
                const clienteNombre = venta.cliente_info || (venta.id_clientes ? `${venta.id_clientes.nombre} ${venta.id_clientes.apellido || ''}`.trim() : null);

                return (
                  <React.Fragment key={venta.id_ventas}>
                    <tr className={`main-row fila-venta ${isExpanded ? 'expanded' : ''}`}>
                      <td style={{ fontWeight: 700 }}>#{venta.id_ventas}</td>
                      <td>Caja {venta.id_caja?.id_caja || venta.id_caja}</td>
                      <td style={{ fontWeight: 800 }}>${Number(venta.total).toFixed(2)}</td>
                      <td>
                        {venta.fecha}{' '}
                        <span style={{ color: 'var(--text-muted, #6b7280)', fontSize: '12px' }}>
                          {venta.hora}
                        </span>
                      </td>
                      <td>
                        {!clienteNombre ? (
                          <span style={{ color: 'var(--text-muted, #6b7280)' }}>Consumidor Final</span>
                        ) : (
                          <span style={{ color: 'var(--primary, #1f2937)', fontWeight: 600 }}>
                            {clienteNombre}
                          </span>
                        )}
                      </td>
                      <td>
                        {estadoLower === 'pagado' && <span className="badge badge-pagado">Pagado</span>}
                        {estadoLower === 'anulado' && <span className="badge badge-anulado">Anulado</span>}
                        {estadoLower !== 'pagado' && estadoLower !== 'anulado' && (
                          <span className="badge badge-fiado">Fiado</span>
                        )}
                      </td>
                      <td>
                        <div className="actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <a 
                            href={`/comprobantes/pdf/${venta.id_ventas}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn-icon" 
                            title="PDF"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>print</span>
                          </a>

                          <button 
                            type="button" 
                            className="btn-icon btn-toggle" 
                            title="Ver Detalle"
                            onClick={() => toggleRow(venta.id_ventas)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                              {isExpanded ? 'expand_less' : 'expand_more'}
                            </span>
                          </button>

                          {estadoLower !== 'anulado' && (
                            <button
                              type="button"
                              className="btn-icon danger"
                              title="Anular"
                              onClick={() => {
                                if (window.confirm(`¿Anular Venta #${venta.id_ventas}?`)) {
                                  if (onAnularVenta) onAnularVenta(venta.id_ventas);
                                }
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>cancel</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="detail-row">
                        <td colSpan={7}>
                          <div className="detail-content">
                            <table className="detail-table" style={{ width: '100%' }}>
                              <thead>
                                <tr>
                                  <th>Producto</th>
                                  <th>Lote</th>
                                  <th>Cant.</th>
                                  <th>Precio Unit.</th>
                                  <th>Subtotal</th>
                                </tr>
                              </thead>
                              <tbody>
                                {venta.detalles && venta.detalles.length > 0 ? (
                                  venta.detalles.map((detalle, idx) => (
                                    <tr key={idx}>
                                      <td style={{ fontWeight: 600 }}>{detalle.producto?.nombre || detalle.producto}</td>
                                      <td>{detalle.lote?.lote || detalle.lote || '-'}</td>
                                      <td>{detalle.cantidad}</td>
                                      <td>${Number(detalle.precio_unitario_venta).toFixed(2)}</td>
                                      <td style={{ fontWeight: 700 }}>${Number(detalle.subtotal).toFixed(2)}</td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted, #6b7280)' }}>
                                      Sin detalles disponibles
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted, #6b7280)' }}>
                  No hay ventas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HistorialVentas;
