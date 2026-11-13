import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './ComprasList.css';

function ComprasList({ compras = [], onAnularCompra }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState({});
  const [modalAnular, setModalAnular] = useState({
    open: false,
    compraId: null,
    motivo: ''
  });

  // Filtrado por N° de Compra o Proveedor
  const comprasFiltradas = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return compras;

    return compras.filter((c) => {
      const proveedorNombre = c.id_proveedor?.nombre || '';
      const textoBusqueda = `${c.id} ${proveedorNombre}`.toLowerCase();
      return textoBusqueda.includes(query);
    });
  }, [compras, searchQuery]);

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const abrirModalAnular = (compraId) => {
    setModalAnular({
      open: true,
      compraId,
      motivo: ''
    });
  };

  const cerrarModalAnular = () => {
    setModalAnular({
      open: false,
      compraId: null,
      motivo: ''
    });
  };

  const handleConfirmarAnulacion = async (e) => {
    e.preventDefault();
    const motivoTrim = modalAnular.motivo.trim();
    if (!motivoTrim) {
      alert('Debe ingresar un motivo para anular la compra.');
      return;
    }

    try {
      if (onAnularCompra) {
        await onAnularCompra(modalAnular.compraId, motivoTrim);
      } else {
        console.log(`Anulando compra #${modalAnular.compraId} - Motivo: ${motivoTrim}`);
      }
      cerrarModalAnular();
    } catch (error) {
      alert(error.message || 'Error al anular la compra.');
    }
  };

  return (
    <div className="compras-list-page">
      {/* ENCABEZADO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span className="subtitle-badge">Registro de Operaciones</span>
          <h1 className="page-title">Historial de Compras</h1>
        </div>
        <Link to="/compras/nueva" className="btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span> Nueva Compra
        </Link>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar">
        <div className="search-box">
          <span className="material-symbols-outlined">search</span>
          <input
            type="text"
            placeholder="Buscar por N° Compra o Proveedor..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setExpandedRows({});
            }}
          />
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>N° Compra</th>
              <th>Proveedor</th>
              <th>Fecha / Hora</th>
              <th>Usuario</th>
              <th>Estado</th>
              <th>Total</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {comprasFiltradas.length > 0 ? (
              comprasFiltradas.map((c) => {
                const isExpanded = !!expandedRows[c.id];
                const esAnulado = c.estado === 'Anulado';

                return (
                  <React.Fragment key={c.id}>
                    <tr className="main-row fila-compra">
                      <td style={{ fontWeight: 700 }}>#{c.id}</td>
                      <td>
                        {c.id_proveedor ? (
                          c.id_proveedor.nombre
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin proveedor</span>
                        )}
                      </td>
                      <td>
                        {c.fecha}{' '}
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{c.hora}</span>
                      </td>
                      <td>
                        <span className="badge badge-gray">{c.id_usuario?.username || c.usuario}</span>
                      </td>
                      <td>
                        {esAnulado ? (
                          <span className="badge badge-anulado">Anulado</span>
                        ) : (
                          <span className="badge badge-pagado">{c.estado || 'Registrado'}</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 800, color: 'var(--secondary)' }}>
                        ${Number(c.total).toFixed(2)}
                      </td>
                      <td>
                        <div className="actions">
                          <button
                            type="button"
                            className="btn-icon btn-toggle"
                            title="Ver Detalle"
                            onClick={() => toggleRow(c.id)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                              {isExpanded ? 'expand_less' : 'expand_more'}
                            </span>
                          </button>

                          {!esAnulado && (
                            <button
                              type="button"
                              className="btn-icon danger btn-anular"
                              title="Anular Compra"
                              onClick={() => abrirModalAnular(c.id)}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>cancel</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* FILA DE DETALLE DESPLEGABLE */}
                    {isExpanded && (
                      <tr className="detail-row">
                        <td colSpan={7}>
                          <div className="detail-content">
                            <table className="detail-table">
                              <thead>
                                <tr>
                                  <th>Producto</th>
                                  <th>Lote</th>
                                  <th>Vencimiento</th>
                                  <th>Cant.</th>
                                  <th>Precio Costo</th>
                                  <th>Subtotal</th>
                                </tr>
                              </thead>
                              <tbody>
                                {c.detalles && c.detalles.length > 0 ? (
                                  c.detalles.map((detalle, idx) => (
                                    <tr key={idx}>
                                      <td style={{ fontWeight: 600 }}>
                                        {detalle.id_producto?.nombre || detalle.producto}
                                      </td>
                                      <td>
                                        <span className="badge badge-gray">{detalle.lote}</span>
                                      </td>
                                      <td>{detalle.fecha_vencimiento || '-'}</td>
                                      <td>{detalle.cantidad}</td>
                                      <td>${Number(detalle.precio_unitario_compra).toFixed(2)}</td>
                                      <td style={{ fontWeight: 700 }}>
                                        ${Number(detalle.subtotal).toFixed(2)}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                      No hay detalles.
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
                <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No hay compras registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL ANULAR COMPRA */}
      {modalAnular.open && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ color: 'var(--danger)' }}>Anular Compra #{modalAnular.compraId}</h3>
              <button type="button" className="btn-icon" onClick={cerrarModalAnular}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmarAnulacion}>
              <div className="modal-body">
                <p style={{ fontSize: '14px' }}>
                  ¿Anular compra? <br />
                  <strong style={{ color: 'var(--danger)' }}>El stock será revertido.</strong>
                </p>
                <div className="input-group">
                  <label style={{ fontSize: '13px', fontWeight: 600 }}>Motivo</label>
                  <textarea
                    name="motivo"
                    className="form-control"
                    rows={3}
                    required
                    placeholder="Ej: Error de carga..."
                    value={modalAnular.motivo}
                    onChange={(e) => setModalAnular({ ...modalAnular, motivo: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-action btn-cancelar" onClick={cerrarModalAnular}>
                  Cancelar
                </button>
                <button type="submit" className="btn-action btn-confirmar">
                  Confirmar Anulación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ComprasList;
