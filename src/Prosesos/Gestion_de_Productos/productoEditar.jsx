import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './formularios.css';

function EditarProducto() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    marca: 'Sin marca',
    precio: '',
    estado: 'activo',
    proveedores: [],
  });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [proveedoresDisponibles, setProveedoresDisponibles] = useState([]);

  useEffect(() => {
    let vigente = true;

    fetch(`/api/productos/${id}/`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'No se pudo cargar el producto.');
        }
        if (vigente) setProveedoresDisponibles(data.proveedores_disponibles);
        return data.producto;
      })
      .then((producto) => {
        if (!vigente) return;
        setFormData({
          nombre: producto.nombre,
          categoria: producto.categoria,
          marca: producto.marca,
          precio: producto.precio,
          estado: producto.estado,
          proveedores: producto.proveedores.map((proveedor) => String(proveedor.id)),
        });
      })
      .catch((err) => {
        if (vigente) setError(err.message || 'No se pudo conectar con el servidor.');
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, selectedOptions } = e.target;
    setFormData((actual) => ({
      ...actual,
      [name]: type === 'select-multiple'
        ? Array.from(selectedOptions, (option) => option.value)
        : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setGuardando(true);

    const payload = {
      ...formData,
      nombre: formData.nombre.trim(),
      categoria: formData.categoria.trim(),
      marca: formData.marca.trim() || 'Sin marca',
    };

    try {
      const response = await fetch(`/api/productos/${id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo actualizar el producto.');
      }

      navigate('/consultar', {
        state: { mensajeExito: data.mensaje || `Producto "${payload.nombre}" actualizado correctamente.` },
      });
    } catch (err) {
      setError(err.message || 'No se pudo conectar con el servidor.');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <p>Cargando producto...</p>;

  return (
    <div className="form-container" style={{ margin: '0 auto', maxWidth: '700px', paddingTop: '10px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 className="page-title">Editar Producto</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Actualizá los datos del catálogo y sus proveedores.
        </p>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          {error && <div className="products-error" role="alert">{error}</div>}

          <div className="form-row">
            <div className="input-group">
              <label htmlFor="producto-nombre">Nombre del Producto</label>
              <input
                id="producto-nombre"
                type="text"
                name="nombre"
                className="form-control"
                required
                value={formData.nombre}
                onChange={handleChange}
              />
            </div>
            <div className="input-group">
              <label htmlFor="producto-categoria">Categoría</label>
              <input
                id="producto-categoria"
                type="text"
                name="categoria"
                className="form-control"
                required
                value={formData.categoria}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label htmlFor="producto-marca">Marca</label>
              <input
                id="producto-marca"
                type="text"
                name="marca"
                className="form-control"
                value={formData.marca}
                onChange={handleChange}
              />
            </div>
            <div className="input-group">
              <label htmlFor="producto-precio">Precio de Venta ($)</label>
              <input
                id="producto-precio"
                type="number"
                name="precio"
                min="0.01"
                step="0.01"
                className="form-control"
                required
                value={formData.precio}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="producto-proveedores">Proveedores Habituales</label>
            <select
              id="producto-proveedores"
              name="proveedores"
              className="form-control"
              multiple
              size="4"
              value={formData.proveedores}
              onChange={handleChange}
            >
              {proveedoresDisponibles.map((proveedor) => (
                <option key={proveedor.id} value={String(proveedor.id)}>
                  {proveedor.nombre}
                </option>
              ))}
            </select>
            <span className="help-text">Mantené apretada la tecla Ctrl para seleccionar más de uno.</span>
          </div>

          <div className="input-group">
            <label htmlFor="producto-estado">Estado del Producto</label>
            <select
              id="producto-estado"
              name="estado"
              className="form-control"
              required
              value={formData.estado}
              onChange={handleChange}
            >
              <option value="activo">Activo (Visible en ventas)</option>
              <option value="inactivo">Inactivo (Oculto en ventas)</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-cancel" onClick={() => navigate('/consultar')}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-save" disabled={guardando}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
              {guardando ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditarProducto;
