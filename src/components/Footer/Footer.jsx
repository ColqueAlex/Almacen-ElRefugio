import estilos from './Footer.module.css';

function Footer (){
    return(
        <footer className={estilos.pie}>
            <p>Almacen El Refugio — Práctica Profesional 2</p>
            <p>Equipo: Beltran, Colque, Mamani y Martinez</p>
            <p>Instituto Superior Del Milagro N.º 8207 — 2026</p>
        </footer>
    );
}

export default Footer;