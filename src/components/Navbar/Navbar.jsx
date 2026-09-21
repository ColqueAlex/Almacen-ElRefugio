import logo from '../../assets/logo.png';
import estilos from './Navbar.module.css';

function Navbar() {
    return(
        <header className={estilos.barra}>
            <img src={logo} alt="Logo de Almacen el Refugio" className={estilos.logo}/>
            <h1 className={estilos.titulo}> Almacen El Refugio</h1>
            <nav className={estilos.menu}>
                <a href="#">Inicio</a>
                <a href="#">Productos</a>
                <a href="#">Proveedores</a>
                <a href="#">Usuarios</a>
                <a href="#">Punto Venta</a>
            </nav>
        </header>
    );
}

export default Navbar;