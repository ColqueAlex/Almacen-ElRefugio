import { useEffect } from 'react';
import './dashboard.css'; // Asegúrate de importar tus estilos aquí

function DashboardPrincipal({ 
    user = { username: 'Usuario', isSuperuser: false, perfil: '' }, 
    alertasVencimiento = [] 
}) {
  // Determinamos si el usuario es administrador para mostrar/ocultar módulos
const isAdmin = user.isSuperuser || user.perfil === 'Administrador';

  // Hook para manejar el atajo de teclado (F2)
useEffect(() => {
    const handleKeyDown = (event) => {
        if (event.key === 'F2') {     
        event.preventDefault();
        window.location.href = '/registrar-venta'; // Cambia por tu ruta o usa navigate() si usas React Router
    }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Limpieza del evento al desmontar el componente
    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
}, []);

return (
        <>
        <div className="dashboard-top">
            <div className="welcome-card">
            <h1>Hola, {user.username} <span style={{ fontSize: '24px' }}>👋</span></h1>
            </div>

            <div className="alerts-card">
            <div className="alerts-header">
                <div className="alerts-title">
                <span className="material-symbols-outlined" style={{ color: '#b45309' }}>warning</span>
                Alertas de Vencimientos
                </div>
                <a href="/consultar" style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                Ver todas &gt;
                </a>
            </div>

            <div className="alerts-grid">
                {alertasVencimiento.length > 0 ? (
                alertasVencimiento.map((alerta, index) => (
                    <div className="alert-item" key={index}>
                    <div>
                        <span className="alert-lote">LOTE: {alerta.lote}</span>
                        <span className="alert-badge">{alerta.tiempoRestante /* Equivale a timeuntil */}</span>
                    </div>
                    <div className="alert-product">{alerta.productoNombre}</div>
                    <div className="alert-date">Vence: {alerta.fechaVencimiento /* Ej: 15 Dic 2026 */}</div>
                    </div>
                ))
                ) : (
                <div style={{ gridColumn: 'span 3', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '10px' }}>
                    No hay productos próximos a vencer.
                </div>
                )}
            </div>
            </div>
        </div>

        <section className="hero-sale">
            <div className="hero-content">
            <div className="hero-icon">
                <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>point_of_sale</span>
            </div>
            <div className="hero-text">
                <h2>Procesar Venta</h2>
                <p>Cobro rápido, lector de código de barras y emisión de comprobantes.</p>
            </div>
            </div>
            <a href="/registrar-venta" className="hero-btn">
            <span className="material-symbols-outlined">shopping_cart_checkout</span>
            Iniciar Nueva Venta (F2)
            </a>
        </section>

        <div className="modules-wrapper">
            <section>
            <div className="section-header">
                <div className="section-title">
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>store</span>
                <div>
                    <h3>Operaciones Diarias</h3>
                    <p>Flujo constante en tienda</p>
                </div>
                </div>
            </div>
            <div className="module-grid">
                {/* REGISTRAR COMPRA SOLO PARA ADMIN */}
                {isAdmin && (
                <a href="/registrar-compra" className="module-card">
                    <div className="module-info">
                    <div className="module-icon icon-blue"><span className="material-symbols-outlined">shopping_bag</span></div>
                    <div className="module-title">Registrar Compra</div>
                    </div>
                    <span className="material-symbols-outlined arrow-icon">arrow_forward</span>
                </a>
                )}
                
                <a href="/gestion-caja" className="module-card">
                <div className="module-info">
                    <div className="module-icon icon-green"><span className="material-symbols-outlined">account_balance_wallet</span></div>
                    <div className="module-title">Caja</div>
                </div>
                <span className="material-symbols-outlined arrow-icon">arrow_forward</span>
                </a>
            </div>
            </section>

            <section>
            <div className="section-header">
                <div className="section-title">
                <span className="material-symbols-outlined" style={{ color: '#4f46e5' }}>corporate_fare</span>
                <div>
                    <h3>Administración</h3>
                    <p>Gestión y auditoría</p>
                </div>
                </div>
            </div>
            <div className="module-grid">
                {/* PRODUCTOS Y PROVEEDORES SOLO PARA ADMIN */}
                {isAdmin && (
                <a href="/consultar" className="module-card">
                    <div className="module-info">
                    <div className="module-icon icon-cyan"><span className="material-symbols-outlined">all_inbox</span></div>
                    <div className="module-title">Productos</div>
                    </div>
                    <span className="material-symbols-outlined arrow-icon">arrow_forward</span>
                </a>
                )}

                <a href="/cuentas-clientes" className="module-card">
                <div className="module-info">
                    <div className="module-icon icon-teal"><span className="material-symbols-outlined">groups</span></div>
                    <div className="module-title">Cuentas Clientes</div>
                </div>
                <span className="material-symbols-outlined arrow-icon">arrow_forward</span>
                </a>

                {isAdmin && (
                <>
                    <a href="/proveedores" className="module-card">
                    <div className="module-info">
                        <div className="module-icon icon-orange"><span className="material-symbols-outlined">local_shipping</span></div>
                        <div className="module-title">Proveedores</div>
                    </div>
                    <span className="material-symbols-outlined arrow-icon">arrow_forward</span>
                    </a>

                    <a href="/listar-auditoria" className="module-card">
                    <div className="module-info">
                        <div className="module-icon icon-slate"><span className="material-symbols-outlined">manage_history</span></div>
                        <div className="module-title">Auditoría</div>
                    </div>
                    <span className="material-symbols-outlined arrow-icon">arrow_forward</span>
                    </a>
                    </>
                )}
            </div>
            </section>
        </div>
        </>
    );
}

export default DashboardPrincipal;