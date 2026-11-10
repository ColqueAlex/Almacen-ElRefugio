import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './formularios.css'; // Asumiendo que migraste tus estilos aquí

function EditarProducto({ proveedores = [] }) {
    const navigate = useNavigate();
    const { id } = useParams(); 

  // Estado del formulario inicializado con valores por defecto
const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    categoria: '',
    marca: 'Sin marca',
    precio: '',
    estado: 'activo',
    proveedores: [] 
});

useEffect(() => {
    
    if (id) {
        setFormData({
            id: id,
            nombre: 'Ejemplo Producto',
            categoria: 'Almacén',
            marca: 'Marca X',
            precio: '150.50',
            estado: 'activo', 
            proveedores: [1, 2] 
        });
        }
}, [id]);

  // Manejador de cambios genérico para inputs
const handleChange = (e) => {
        const { name, value, type } = e.target;

        if (type === 'select-multiple') {
        const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value));
        setFormData({
            ...formData,
            [name]: selectedOptions
        });
        } else {
        setFormData({
            ...formData,
            [name]: value
        });
        }
};

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
        // Petición al backend simulada
        /*
        const response = await fetch('/api/productos/editar', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        if (response.ok) {
            navigate('/consultar');
        }
        */
        console.log('Datos enviados al servidor:', formData);
        alert('Producto actualizado correctamente');
        navigate('/consultar'); // Redirección tras guardar[cite: 6]
        } catch (error) {
        console.error('Error al actualizar el producto:', error);
        }
};

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
            {/* Input hidden para el ID[cite: 6] */}
            <input type="hidden" name="id" value={formData.id} />

            <div className="form-row">
                <div className="input-group">
                <label>Nombre del Producto</label>
                <input 
                    type="text" 
                    name="nombre" 
                    className="form-control" 
                    required 
                    value={formData.nombre} 
                    onChange={handleChange} 
                />
                </div>
                <div className="input-group">
                <label>Categoría</label>
                <input 
                    type="text" 
                    name="categoria" 
                    className="form-control" 
                    required 
                    pattern="^(?!.*\d)[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$" 
                    value={formData.categoria} 
                    onChange={handleChange} 
                />
                </div>
            </div>

            <div className="form-row">
                <div className="input-group">
                <label>Marca</label>
                <input 
                    type="text" 
                    name="marca" 
                    className="form-control" 
                    value={formData.marca} 
                    onChange={handleChange} 
                />
                </div>
                <div className="input-group">
                <label>Precio de Venta ($)</label>
                <input 
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
                <label>Proveedores Habituales</label>
                <select 
                name="proveedores" 
                className="form-control" 
                multiple 
                size="4"
                value={formData.proveedores}
                onChange={handleChange}
                >
                {proveedores.map(prov => (
                    <option key={prov.id} value={prov.id}>
                    {prov.nombre}
                    </option>
                ))}
                </select>
                <span className="help-text">Mantené apretada la tecla Ctrl para seleccionar más de uno.</span>
            </div>

            <div className="input-group">
                <label>Estado del Producto</label>
                <select 
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
                <button 
                type="button" 
                className="btn btn-cancel" 
                onClick={() => navigate('/consultar')}
                >
                Cancelar
                </button>
                <button type="submit" className="btn btn-save">
                <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '5px' }}>
                    save
                </span> 
                Guardar Cambios
                </button>
            </div>
            </form>
        </div>
        </div>
    );
}

export default EditarProducto;