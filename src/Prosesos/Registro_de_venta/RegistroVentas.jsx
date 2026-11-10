import { useState, useMemo } from 'react';
import './RegistroVentas.css';

function RegistroVentas({
  productos = [],
  categorias = [],
  clientes = []
}) {
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isFiado, setIsFiado] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [pagaCon, setPagaCon] = useState('');

  // Filtrado de productos por búsqueda y categoría
  const filteredProducts = useMemo(() => {
    return productos.filter(prod => {
      const matchName = prod.nombre.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory ? prod.categoria === selectedCategory : true;
      return matchName && matchCat && prod.stock > 0;
    });
  }, [productos, searchQuery, selectedCategory]);

  const cartTotal = cart.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  const vuelto = parseFloat(pagaCon) > cartTotal ? (parseFloat(pagaCon) - cartTotal).toFixed(2) : '0.00';

  const addToCart = (prod) => {
    const existing = cart.find(item => item.id === prod.id);
    if (existing) {
      if (existing.cantidad < prod.stock) {
        setCart(cart.map(item => item.id === prod.id ? { ...item, cantidad: item.cantidad + 1 } : item));
      } else {
        alert('No hay más stock disponible');
      }
    } else {
      setCart([...cart, { ...prod, cantidad: 1 }]);
    }
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.cantidad + delta;
        if (newQty > 0 && newQty <= item.stock) return { ...item, cantidad: newQty };
        if (newQty <= 0) return null; 
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleCheckout = (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('El carrito está vacío. Agregue productos antes de cobrar.');
      return;
    }
    if (isFiado && !selectedClient) {
      alert('Debe seleccionar un cliente para fiar.');
      return;
    }
    if (parseFloat(pagaCon) < 0) {
      alert('El importe de pago no puede ser negativo.');
      return;
    }
    
    const payload = {
      cart,
      fiado: isFiado,
      id_cliente: selectedClient,
      metodo_pago: paymentMethod,
      paga_con: parseFloat(pagaCon) || 0,
      total: cartTotal
    };

    console.log('Enviando datos de venta al servidor:', payload);
    alert('Venta procesada con éxito');
    
    // Limpiar formulario tras venta
    setCart([]);
    setPagaCon('');
    setIsFiado(false);
    setSelectedClient('');
    setPaymentMethod('efectivo');
  };

  return (
    <div className="ventas-registro-page">
      <div className="pos-header">
        <h1>Procesar Venta</h1>
      </div>

      <div className="sales-layout">
        {/* COLUMNA IZQUIERDA: CATALOGO */}
        <section className="products-section">
          <div className="search-bar">
            <div className="search-input-wrapper">
              <span className="material-symbols-outlined search-icon">search</span>
              <input
                type="text"
                placeholder="Buscar producto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="category-filters">
            <button 
              type="button"
              className={`btn-filter ${selectedCategory === '' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('')}
            >
              Todos
            </button>
            {categorias.map(cat => (
              <button 
                type="button"
                key={cat}
                className={`btn-filter ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="product-list">
            {filteredProducts.map(prod => (
              <article key={prod.id} className="product-card">
                <span className="stock-label">Stock: {prod.stock}</span>
                <h3 className="product-name">{prod.nombre}</h3>
                <p className="product-brand">{prod.marca}</p>
                <div className="product-controls">
                  <strong className="product-price">${prod.precio}</strong>
                  <button type="button" className="btn-add" aria-label={`Agregar ${prod.nombre}`} onClick={() => addToCart(prod)}>
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
              </article>
            ))}
            {filteredProducts.length === 0 && (
              <div className="empty-products">No se encontraron productos.</div>
            )}
          </div>
        </section>

        {/* COLUMNA DERECHA: CARRITO */}
        <aside className="cart-section">
          <form onSubmit={handleCheckout}>
            <h2 className="cart-title">
              <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '8px' }}>shopping_basket</span> 
              Detalle
            </h2>
            
            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="empty-cart">El carrito está vacío</div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="item-name-box">
                      <strong>{item.nombre}</strong>
                      <small>${item.precio} c/u</small>
                      <div className="qty-box" style={{ width: 'fit-content', marginTop: '4px' }}>
                        <button type="button" onClick={() => updateQty(item.id, -1)}>-</button>
                        <span>{item.cantidad}</span>
                        <button type="button" onClick={() => updateQty(item.id, 1)}>+</button>
                        <button type="button" style={{ background: 'transparent', color: 'var(--muted)', marginLeft: '8px' }} onClick={() => removeFromCart(item.id)}>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                        </button>
                      </div>
                    </div>
                    <div style={{ fontWeight: 'bold', textAlign: 'right', color: 'var(--text)' }}>
                      ${(item.precio * item.cantidad).toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="cart-footer">
              <div className="total-container">
                <span>TOTAL</span>
                <strong style={{ fontSize: '1.5rem' }}>${cartTotal.toFixed(2)}</strong>
              </div>

              <div className="credit-option">
                <label>
                  <input 
                    type="checkbox" 
                    checked={isFiado}
                    onChange={(e) => setIsFiado(e.target.checked)}
                  />
                  Fiar Venta
                </label>
              </div>

              {isFiado && (
                <div className="client-select">
                  <select 
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                  >
                    <option value="">-- Seleccionar Cliente --</option>
                    {clientes.map(c => (
                      <option key={c.id_clientes} value={c.id_clientes}>
                        {c.nombre} (Debe: ${c.saldo})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="payment-section">
                <label>Método de Pago</label>
                <div className="payment-methods">
                  <button 
                    type="button" 
                    className={`payment-method ${paymentMethod === 'efectivo' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('efectivo')}
                  >
                    Efectivo
                  </button>
                  <button 
                    type="button" 
                    className={`payment-method ${paymentMethod === 'transferencia' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('transferencia')}
                  >
                    Transferencia
                  </button>
                </div>
              </div>

              <div className="payment-amounts">
                <div>
                  <label>Paga con ($)</label>
                  <input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    placeholder="0.00"
                    value={pagaCon}
                    onChange={(e) => setPagaCon(e.target.value)}
                  />
                </div>
                <div>
                  <label>Vuelto</label>
                  <div className="change-amount">
                    ${vuelto}
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-finalize">
                <span className="material-symbols-outlined">point_of_sale</span> 
                Cobrar Venta
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}

export default RegistroVentas;
