import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegistroCompras.css';

function RegistroCompras({
  proveedores = [],
  productos = [],
  mapeoProveedores = {},
  productosSinProveedor = [],
  onRegistrarCompra
}) {
  const navigate = useNavigate();

  // Estados del formulario
  const [proveedorId, setProveedorId] = useState('');
  const [productoId, setProductoId] = useState('');
  const [lote, setLote] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [precioCosto, setPrecioCosto] = useState('');
  const [registrando, setRegistrando] = useState(false);

  // Estado del carrito de compra
  const [cart, setCart] = useState([]);

  // Fecha mínima permitida para vencimiento (mañana en formato YYYY-MM-DD)
  const minFechaVencimiento = useMemo(() => {
    const manana = new Date();
    manana.setHours(0, 0, 0, 0);
    manana.setDate(manana.getDate() + 1);
    return [
      manana.getFullYear(),
      String(manana.getMonth() + 1).padStart(2, '0'),
      String(manana.getDate()).padStart(2, '0')
    ].join('-');
  }, []);

  // Filtrado dinámico de productos según proveedor seleccionado
  const productosFiltrados = useMemo(() => {
    if (!proveedorId) {
      if (productosSinProveedor.length > 0) {
        return productos.filter((prod) => productosSinProveedor.includes(prod.id));
      }
      return productos.filter((prod) => !prod.proveedores || prod.proveedores.length === 0);
    }

    const idsPermitidos = mapeoProveedores[String(proveedorId)] || [];
    return productos.filter((prod) => idsPermitidos.includes(prod.id));
  }, [proveedorId, productos, mapeoProveedores, productosSinProveedor]);

  // Cálculo del total de la compra
  const totalCompra = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.cantidad * item.precio_costo, 0);
  }, [cart]);

  const handleProveedorChange = (e) => {
    setProveedorId(e.target.value);
    setProductoId('');
  };

  const handleAgregarItem = () => {
    if (!productoId) {
      alert('Debe seleccionar un producto.');
      return;
    }

    const prodSeleccionado = productos.find((p) => String(p.id) === String(productoId));
    if (!prodSeleccionado) {
      alert('Producto no válido.');
      return;
    }

    const cantVal = parseInt(cantidad, 10) || 0;
    const costoVal = parseFloat(precioCosto) || 0;
    const precioVentaVal = parseFloat(prodSeleccionado.precio) || 0;
    const loteVal = lote.trim() || 'Sin lote';

    if (cantVal <= 0) {
      alert('La cantidad debe ser mayor a 0.');
      return;
    }
    if (costoVal <= 0) {
      alert('El precio de costo debe ser mayor a 0.');
      return;
    }

    // Validación: el costo no puede superar al precio de venta
    if (costoVal > precioVentaVal) {
      alert(
        `¡Atención! El costo ($${costoVal.toFixed(2)}) no puede ser mayor al precio de venta ($${precioVentaVal.toFixed(2)}).`
      );
      return;
    }

    // Validación: fecha de vencimiento posterior a hoy
    if (fechaVencimiento) {
      const [year, month, day] = fechaVencimiento.split('-').map(Number);
      const fechaSeleccionada = new Date(year, month - 1, day);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (fechaSeleccionada <= hoy) {
        alert('La fecha de vencimiento debe ser posterior a la fecha actual.');
        return;
      }
    }

    const nuevoItem = {
      id_producto: prodSeleccionado.id,
      nombre: prodSeleccionado.nombre,
      lote: loteVal,
      fecha_vencimiento: fechaVencimiento || null,
      cantidad: cantVal,
      precio_costo: costoVal
    };

    setCart((prev) => [...prev, nuevoItem]);

    // Limpiar campos del producto
    setProductoId('');
    setLote('');
    setFechaVencimiento('');
    setCantidad(1);
    setPrecioCosto('');
  };

  const handleEliminarItem = (index) => {
    setCart((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleFinalizarCompra = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert('El detalle de la compra está vacío. Agregue productos antes de finalizar.');
      return;
    }

    const payload = {
      id_proveedor: proveedorId || null,
      cart_data: cart,
      total: totalCompra
    };

    try {
      if (!onRegistrarCompra) {
        throw new Error('El registro de compras no está conectado al servidor.');
      }
      setRegistrando(true);
      await onRegistrarCompra(payload);
      navigate('/compras');
    } catch (error) {
      alert(error.message || 'Error al procesar la compra.');
    } finally {
      setRegistrando(false);
    }
  };

  return (
    <div className="registro-compra-page">
      {/* ENCABEZADO */}
      <div>
        <span className="subtitle-badge">Ingreso de Mercadería</span>
        <h1 className="page-title">Registrar Nueva Compra</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Carga de productos, asignación de lotes y actualización de stock.
        </p>
      </div>

      <div className="compras-grid">
        {/* COLUMNA IZQUIERDA: FORMULARIOS */}
        <div>
          {/* CARD PROVEEDOR */}
          <div className="card">
            <div className="card-header primary">
              <span className="material-symbols-outlined">local_shipping</span> 1. Datos del Proveedor
            </div>
            <div className="card-body">
              <div className="input-group">
                <label>Seleccionar Proveedor</label>
                <select
                  className="form-control"
                  value={proveedorId}
                  onChange={handleProveedorChange}
                >
                  <option value="">Sin proveedor (Compra informal)</option>
                  {proveedores.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.tipo_productos})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* CARD PRODUCTO */}
          <div className="card">
            <div className="card-header secondary">
              <span className="material-symbols-outlined">inventory_2</span> 2. Carga de Producto y Lote
            </div>
            <div className="card-body">
              <div className="input-group">
                <label>Producto del Catálogo</label>
                <select
                  className="form-control"
                  value={productoId}
                  onChange={(e) => setProductoId(e.target.value)}
                >
                  <option value="" disabled>
                    Seleccione producto...
                  </option>
                  {productosFiltrados.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.nombre} ({prod.marca || 'Sin marca'}) - Venta: ${Number(prod.precio).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>N° de Lote</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: L3042"
                    value={lote}
                    onChange={(e) => setLote(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label>Fecha Vencimiento</label>
                  <input
                    type="date"
                    className="form-control"
                    min={minFechaVencimiento}
                    value={fechaVencimiento}
                    onChange={(e) => setFechaVencimiento(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label>Precio de Costo ($)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    className="form-control"
                    placeholder="0.00"
                    value={precioCosto}
                    onChange={(e) => setPrecioCosto(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="button"
                className="btn-agregar-compra"
                style={{ background: 'var(--secondary)', marginTop: '8px' }}
                onClick={handleAgregarItem}
              >
                <span className="material-symbols-outlined">add_shopping_cart</span> Agregar a la Compra
              </button>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: CARRITO */}
        <div>
          <div className="cart-card">
            <div className="cart-header">
              <h3>
                <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '6px' }}>
                  shopping_basket
                </span>
                Detalle de la Compra
              </h3>
              <span className="cart-total">${totalCompra.toFixed(2)}</span>
            </div>

            <div className="cart-body">
              <table className="cart-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Lote</th>
                    <th>Cant.</th>
                    <th>Costo</th>
                    <th>Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="cart-empty">
                        No hay ítems agregados a la compra.
                      </td>
                    </tr>
                  ) : (
                    cart.map((item, index) => {
                      const subtotal = item.cantidad * item.precio_costo;
                      return (
                        <tr key={index}>
                          <td>
                            <strong>{item.nombre}</strong>
                          </td>
                          <td>
                            <span style={{ background: 'var(--bg-body)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>
                              {item.lote}
                            </span>
                          </td>
                          <td>{item.cantidad}</td>
                          <td>${item.precio_costo.toFixed(2)}</td>
                          <td style={{ fontWeight: 700 }}>${subtotal.toFixed(2)}</td>
                          <td>
                            <button
                              type="button"
                              className="btn-delete"
                              title="Quitar"
                              onClick={() => handleEliminarItem(index)}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="cart-footer">
              <form onSubmit={handleFinalizarCompra}>
                <button type="submit" className="btn-finalizar" disabled={registrando}>
                  <span className="material-symbols-outlined">save</span>
                  {registrando ? 'Registrando compra...' : 'Finalizar Registro de Compra'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegistroCompras;
