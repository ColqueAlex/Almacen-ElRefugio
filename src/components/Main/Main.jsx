import Tarjeta from "../Tarjeta/Tarjeta";
import estilos from '../Main/Main.module.css';

function Main() {
    return(
        <main className={estilos.contenido}>
            <h2>Sistema de Gestión — Almacén El Refugio</h2>
            <p>
                Plataforma web enfocada en optimizar el control de inventario, registro de ventas diarias 
                y la administración de proveedores para el almacén de barrio El Refugio. Permite mantener un seguimiento
                en tiempo real del stock disponible.
            </p>

            <h3>Modulos Previstos</h3>
            <section className={estilos.modulos}>
                <Tarjeta
                    titulo="Control de Inventario y Stock"
                    descripcion="Registro de productos, categorías, precios de costo/venta y alertas automáticas por falta de stock."
                    principal
                />
                <Tarjeta
                    titulo="Gestión de Proveedores y Pedidos"
                    descripcion="Listado de contactos, historial de compras e integración de órdenes de reposición."
                    estado="En análisis"
                />
                <Tarjeta
                    titulo="Punto de Venta y Caja"
                    descripcion="Facturación rápida, registro de transacciones diarias y gestión de medios de pago."
                    estado="En desarrollo"
                />
            </section>
        </main>
    );
}

export default Main;