import { useEffect, useState } from 'react';
import './inventario.css';

function GestionProductos() {

  // ESTADOS DEL COMPONENTE

const [productos, setProductos] = useState([]);
const [proveedores, setProveedores] = useState([]);
const [categorias, setCategorias] = useState([]);
const [isModalOpen, setIsModalOpen] = useState(false);
const [recarga, setRecarga] = useState(0);

  // Estados para filtros
const [filtros, setFiltros] = useState({
    busqueda: '',
    categoria: '',
    estado_stock: ''
});

  //(Carga inicial y filtros)

useEffect(() => {
    let vigente = true;
    const queryParams = new URLSearchParams(filtros).toString();

    fetch(`/api/productos?${queryParams}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error al cargar productos: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (!vigente) return;
        setProductos(data.productos ?? []);
        setCategorias(data.categorias ?? []);
        setProveedores(data.proveedores ?? []);
      })
      .catch(error => {
        if (vigente) console.error('Error al cargar los datos:', error);
      });

    return () => {
      vigente = false;
    };
  }, [filtros, recarga]);

  // Simula la vista 'guardar'
const handleGuardarProducto = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Captura los datos del formulario según los campos esperados en el backend[cite: 2]
        const nuevoProducto = {
        nombre: formData.get('nombre').trim(),
        categoria: formData.get('categoria').trim(),
        // Asigna "Sin marca" por defecto si el campo está vacío[cite: 2]
        marca: formData.get('marca').trim() || "Sin marca",
        precio: parseFloat(formData.get('precio')),
        estado: formData.get('estado') || "activo",
        // Captura múltiples proveedores[cite: 2]
        proveedores: formData.getAll('proveedores')
    };

        try {
        const response = await fetch('/api/productos/guardar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoProducto)
        });

        if (response.ok) {
            alert(`Producto "${nuevoProducto.nombre}" agregado al catálogo.`); // Feedback de éxito[cite: 2]
            setIsModalOpen(false);
            setRecarga(actual => actual + 1);
        } else {
            const errorData = await response.json();
            alert(`Error: ${errorData.mensaje}`); // Ejemplo: Precio inválido o producto duplicado[cite: 2]
        }
        } catch (error) {
        console.error('Error al guardar:', error);
        }
};

  // Simula la vista 'cambiar_estado'
const handleCambiarEstado = async (idProducto, estadoActual) => {
    // Alterna el estado entre 'activo' e 'inactivo'[cite: 2]
    const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';

        try {
        const response = await fetch(`/api/productos/${idProducto}/cambiar_estado`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        if (response.ok) {
            // Actualización optimista del estado local
            setProductos(productos.map(p => 
            p.id === idProducto ? { ...p, estado: nuevoEstado } : p
        ));
        }
    } catch (error) {
        console.error('Error al cambiar el estado:', error);
    }
};

  // Manejo de cambios en los filtros[cite: 2]
const handleFiltroChange = (e) => {
    setFiltros({
        ...filtros,
        [e.target.name]: e.target.value
        });
    };

  // CÁLCULO DE KPIs

const totalProductos = productos.length;
// Calcula productos con stock mayor a 0 y menor o igual a 10[cite: 2]
const stockBajo = productos.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 10).length;
// Calcula productos con stock igual a 0[cite: 2]
const sinStock = productos.filter(p => Number(p.stock) === 0).length;

return (
    <>
        {/* HEADER Y BOTÓN NUEVO PRODUCTO */}
        <div className="products-heading">
            <div>
            <span className="subtitle-badge">Catálogo General y Control de Existencias</span>
            <h1 className="page-title">Inventario y Productos</h1>
            </div>
            <button type="button" className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span> Nuevo Producto
            </button>
        </div>

        {/* KPIs */}
        <div className="kpi-grid">
            <div className="kpi-card">
            <div className="kpi-info">
                <h3>Total Productos</h3>
                <div className="value">{totalProductos}</div>
                <div className="sub"><span className="material-symbols-outlined">trending_up</span> En catálogo</div>
            </div>
            <div className="kpi-icon blue"><span className="material-symbols-outlined">inventory_2</span></div>
            </div>
            <div className="kpi-card">
            <div className="kpi-info">
                <h3>Stock Bajo</h3>
                <div className="value" style={{ color: 'var(--tertiary)' }}>{stockBajo}</div>
                <div className="sub warning"><span className="material-symbols-outlined">warning</span> Reposición urgente</div>
            </div>
            <div className="kpi-icon orange"><span className="material-symbols-outlined">warning</span></div>
            </div>
            <div className="kpi-card">
            <div className="kpi-info">
                <h3>Sin Stock</h3>
                <div className="value" style={{ color: 'var(--danger)' }}>{sinStock}</div>
                <div className="sub danger"><span className="material-symbols-outlined">production_quantity_limits</span> Agotados</div>
            </div>
            <div className="kpi-icon red"><span className="material-symbols-outlined">remove_shopping_cart</span></div>
            </div>
        </div>

        {/* BARRA DE HERRAMIENTAS (Filtros) */}
        <div className="toolbar">
            <div className="toolbar-left">
            <div className="products-filters">
                <div className="search-box">
                <span className="material-symbols-outlined">search</span>
                <input 
                    type="text" 
                    name="busqueda" 
                    value={filtros.busqueda} 
                    onChange={handleFiltroChange}
                    placeholder="Buscar producto por nombre o marca..." 
                />
                </div>
                <select name="categoria" className="filter-select" value={filtros.categoria} onChange={handleFiltroChange}>
                <option value="">Todas las Categorías</option>
                {categorias.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                ))}
                </select>
                <select name="estado_stock" className="filter-select" value={filtros.estado_stock} onChange={handleFiltroChange}>
                <option value="">Todos los Estados</option>
                <option value="normal">Stock Normal</option>
                <option value="bajo">Stock Bajo</option>
                <option value="agotado">Agotado</option>
                </select>
            </div>
            </div>
        </div>

        {/* TABLA DE PRODUCTOS */}
        <div className="table-card">
            <table>
            <thead>
                <tr>
                <th>Nombre & SKU</th><th>Categoría</th><th>Proveedor</th><th>Precio / Costo</th><th>Nivel de Stock</th><th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {productos.length > 0 ? productos.map((producto) => (
                <tr key={producto.id}>
                    <td>
                    <div className="prod-info">
                        <div className="prod-avatar">{producto.nombre.charAt(0).toUpperCase()}</div>
                        <div className="prod-details">
                        <h4>{producto.nombre}</h4>
                        <span>#ART-{String(producto.id).padStart(5, '0')}</span>
                        </div>
                    </div>
                    </td>
                    <td><span className="badge badge-gray">{producto.categoria}</span></td>
                    <td>
                    {producto.proveedores && producto.proveedores.length > 0 
                        ? producto.proveedores.map((prov, i) => <span key={i} className="badge badge-gray">{prov.nombre}</span>)
                        : <span>Sin asignar</span>
                    }
                    </td>
                    <td>
                    <div className="price-info">
                        <strong>${Number(producto.precio).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false })}</strong>
                    </div>
                    </td>
                    <td>
                    {(() => {
                        const stock = Number(producto.stock) || 0;
                        const stockClass = stock === 0 ? 'out' : stock <= 10 ? 'low' : 'normal';
                        const stockLabel = stock === 0 ? 'Agotado' : stock <= 10 ? 'Bajo' : 'Normal';

                        return (
                        <div className="stock-info">
                            <div className={`stock-header ${stockClass}`}>
                            <span>{stock} un</span>
                            <span>{stockLabel}</span>
                            </div>
                            <div className="stock-bar-bg">
                            <div className={`stock-bar ${stockClass}`} />
                            </div>
                        </div>
                        );
                    })()}
                    </td>
                    <td>
                    <div className="actions">
                        <button 
                        type="button" 
                        className="btn-icon" 
                        onClick={() => handleCambiarEstado(producto.id, producto.estado)}
                        >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: producto.estado === 'activo' ? 'var(--secondary)' : 'var(--danger)' }}>
                            {producto.estado === 'activo' ? 'toggle_on' : 'toggle_off'}
                        </span>
                        </button>
                        <button className="btn-icon" title="Editar"><span className="material-symbols-outlined">edit</span></button>
                    </div>
                    </td>
                </tr>
                )) : <tr><td colSpan={6} style={{ textAlign: 'center' }}>No se encontraron productos.</td></tr>}
            </tbody>
            </table>
        </div>

        {/* MODAL CREAR PRODUCTO */}
        {isModalOpen && (
            <div className="modal-overlay">
            <div className="modal-producto" role="dialog" aria-modal="true" aria-labelledby="modal-producto-titulo">
                <div className="modal-producto-header">
                    <h2 id="modal-producto-titulo">Añadir Producto</h2>
                    <button
                        type="button"
                        className="modal-producto-cerrar"
                        aria-label="Cerrar"
                        onClick={() => setIsModalOpen(false)}
                    >
                        ×
                    </button>
                </div>
                <form onSubmit={handleGuardarProducto}>
                    <input className="modal-producto-campo" type="text" name="nombre" placeholder="Nombre del producto" required />
                    <input className="modal-producto-campo" type="text" name="categoria" placeholder="Categoría" required />
                    <input className="modal-producto-campo" type="text" name="marca" placeholder="Marca (Opcional)" />
                    <input className="modal-producto-campo" type="number" name="precio" step="0.01" placeholder="Precio de venta ($)" required />
                    <label className="modal-producto-label" htmlFor="modal-producto-proveedores">Proveedores:</label>
                    <select className="modal-producto-proveedores" id="modal-producto-proveedores" name="proveedores" multiple size="3">
                    {proveedores.map(prov => (
                        <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                    ))}
                    </select>
                    <button type="submit" className="btn-primary modal-producto-guardar">Guardar en Catálogo</button>
                </form>
            </div>
            </div>
        )}
        </>
    );
}

export default GestionProductos;