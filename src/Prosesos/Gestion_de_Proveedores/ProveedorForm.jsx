import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './Proveedores.css';

function ProveedorForm({ proveedorInicial = null, onGuardar, onCargar }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const esEdicion = Boolean(id || proveedorInicial);

  const [formData, setFormData] = useState(() => ({
    nombre: proveedorInicial?.nombre || '',
    telefono: proveedorInicial?.numero_telefono || proveedorInicial?.telefono || '',
    tipo_productos: proveedorInicial?.tipo_productos || ''
  }));
  const [error, setError] = useState('');
  const [cargandoProveedor, setCargandoProveedor] = useState(Boolean(id));

  useEffect(() => {
    if (!id) return undefined;

    let vigente = true;
    onCargar(id)
      .then(({ proveedor }) => {
        if (vigente) {
          setFormData({
            nombre: proveedor.nombre || '',
            telefono: proveedor.numero_telefono || '',
            tipo_productos: proveedor.tipo_productos || ''
          });
        }
      })
      .catch((err) => {
        if (vigente) setError(err.message || 'No se pudo cargar el proveedor.');
      })
      .finally(() => {
        if (vigente) setCargandoProveedor(false);
      });

    return () => {
      vigente = false;
    };
  }, [id, onCargar]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Restringe el teléfono a solo dígitos numéricos
    if (name === 'telefono' && value !== '' && !/^\d+$/.test(value)) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const contieneLetras = (valor) => /[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(valor);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const nombreTrim = formData.nombre.trim();
    const telefonoTrim = formData.telefono.trim();
    const rubroTrim = formData.tipo_productos.trim();

    if (!contieneLetras(nombreTrim)) {
      setError('El nombre del proveedor debe contener letras y no puede ser solo números.');
      return;
    }
    if (telefonoTrim && !/^\d+$/.test(telefonoTrim)) {
      setError('El número de teléfono solo puede contener números.');
      return;
    }
    if (!contieneLetras(rubroTrim)) {
      setError('El rubro debe contener letras y no puede ser solo números.');
      return;
    }

    const payload = {
      id: id || proveedorInicial?.id,
      nombre: nombreTrim,
      numero_telefono: telefonoTrim,
      tipo_productos: rubroTrim
    };

    try {
      await onGuardar(payload, esEdicion);
      navigate('/proveedores');
    } catch (err) {
      setError(err.message || 'Ocurrió un error al guardar el proveedor.');
    }
  };

  return (
    <div className="provider-form-page">
      <div className="provider-form-heading">
        <h1 className="page-title">{esEdicion ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h1>
        <p>
          {esEdicion ? 'Actualizá los datos de contacto.' : 'Registrá un nuevo canal de suministro.'}
        </p>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert-error-box">
              {error}
            </div>
          )}
          <div className="input-group">
            <label>Nombre o Razón Social</label>
            <input
              type="text"
              name="nombre"
              className="form-control"
              required
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Distribuidora Norte S.R.L."
            />
          </div>

          <div className="input-group">
            <label>Número de Teléfono</label>
            <input
              type="tel"
              name="telefono"
              className="form-control"
              pattern="[0-9]*"
              inputMode="numeric"
              title="Ingrese solo números."
              value={formData.telefono}
              onChange={handleChange}
              placeholder="Ej: 1123456789"
            />
          </div>

          <div className="input-group">
            <label>Rubro / Tipo de Productos</label>
            <input
              type="text"
              name="tipo_productos"
              className="form-control"
              required
              value={formData.tipo_productos}
              onChange={handleChange}
              placeholder="Ej: Bebidas, Lácteos, Limpieza..."
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-cancel"
              onClick={() => navigate('/proveedores')}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-save" disabled={cargandoProveedor}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
              {cargandoProveedor ? 'Cargando proveedor...' : 'Guardar Proveedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProveedorForm;
