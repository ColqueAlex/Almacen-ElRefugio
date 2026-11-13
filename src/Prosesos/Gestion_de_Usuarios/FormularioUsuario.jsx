import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import './usuarios.css'; // <-- Importamos el CSS del formulario

const FormularioUsuario = () => {
  const navigate = useNavigate();
  const { dni } = useParams(); 
  const esEdicion = !!dni;

  const [formData, setFormData] = useState({
    dni: '', apellido: '', nombre: '', correo: '', password: '', perfil_id: ''
  });
  const [perfiles, setPerfiles] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const API_URL = 'http://127.0.0.1:8001/api';

  useEffect(() => {
    fetch(`${API_URL}/perfiles/`)
      .then(res => res.json())
      .then(data => setPerfiles(data))
      .catch(err => console.error("Error cargando perfiles", err));

    if (esEdicion) {
      fetch(`${API_URL}/usuarios/${dni}/`)
        .then(res => res.json())
        .then(data => {
          setFormData({
            dni: data.dni,
            apellido: data.apellido,
            nombre: data.nombre,
            correo: data.correo,
            perfil_id: data.id_perfil || '', 
            password: '' 
          });
        })
        .catch(err => console.error("Error cargando usuario", err));
    }
  }, [dni, esEdicion]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const url = esEdicion 
        ? `${API_URL}/usuarios/${dni}/` 
        : `${API_URL}/usuarios/`;
      
      const method = esEdicion ? 'PUT' : 'POST';

      const payload = esEdicion ? {
        correo: formData.correo,
        id_perfil: formData.perfil_id,
        apellido: formData.apellido, 
        nombre: formData.nombre
      } : formData;

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(JSON.stringify(errorData)); 
      }

      alert(esEdicion ? 'Usuario actualizado con éxito' : 'Usuario creado con éxito');
      navigate('/usuarios'); 

    } catch (err) {
      console.error(err);
      setError('Ocurrió un error al guardar. Revisá los datos o si el DNI ya existe.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="inv-container">
      <div className="form-container" style={{ margin: '0 auto', maxWidth: '700px', paddingTop: '10px' }}>
        
        <div style={{ marginBottom: '20px' }}>
          <h1 className="page-title">{esEdicion ? 'Editar Usuario' : 'Nuevo Usuario'}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Gestión de credenciales y perfiles de acceso al sistema.
          </p>
        </div>

        <div className="form-card">
          <form onSubmit={handleSubmit}>
            
            {error && <div className="alert-error-box" style={{ marginBottom: '15px' }}>{error}</div>}

            <div className="form-row">
              <div className="input-group">
                <label>DNI (Documento)</label>
                <input 
                  type="text" 
                  name="dni" 
                  className="form-control" 
                  maxLength="8" 
                  pattern="\d{8}" 
                  required 
                  value={formData.dni}
                  onChange={handleChange}
                  readOnly={esEdicion} 
                  style={esEdicion ? { background: '#e2e8f0', cursor: 'not-allowed' } : {}}
                />
                {esEdicion && <span className="help-text">El DNI no se puede modificar.</span>}
              </div>

              <div className="input-group">
                <label>Correo Electrónico</label>
                <input 
                  type="email" 
                  name="correo" 
                  className="form-control" 
                  required 
                  value={formData.correo}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label>Apellido</label>
                <input 
                  type="text" 
                  name="apellido" 
                  className="form-control" 
                  required 
                  value={formData.apellido}
                  onChange={handleChange}
                  disabled={esEdicion}
                />
              </div>
              <div className="input-group">
                <label>Nombre</label>
                <input 
                  type="text" 
                  name="nombre" 
                  className="form-control" 
                  required 
                  value={formData.nombre}
                  onChange={handleChange}
                  disabled={esEdicion}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Perfil de Acceso</label>
              <select 
                name="perfil_id" 
                className="form-control" 
                required 
                value={formData.perfil_id}
                onChange={handleChange}
              >
                <option value="" disabled>Seleccione un perfil...</option>
                {perfiles.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
              <span className="help-text">El perfil define a qué módulos puede acceder el usuario.</span>
            </div>

            {!esEdicion && (
              <div className="input-group" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px dashed var(--border-color)' }}>
                <label>Contraseña Inicial</label>
                <input 
                  type="password" 
                  name="password" 
                  className="form-control" 
                  placeholder="Dejar en blanco para usar el DNI por defecto"
                  value={formData.password}
                  onChange={handleChange}
                />
                <span className="help-text">Si no se ingresa nada, la clave será el DNI del usuario.</span>
              </div>
            )}

            <div className="form-actions">
              <Link to="/usuarios" className="btn btn-cancel">Cancelar</Link>
              <button type="submit" className="btn btn-save" disabled={cargando}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span> 
                {cargando ? 'Guardando...' : 'Guardar Usuario'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default FormularioUsuario;