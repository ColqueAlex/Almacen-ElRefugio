import estilos from './Tarjeta.module.css';

function Tarjeta({ titulo, descripcion, estado = 'Pendiente', principal = false }) {
  return (
    <article className={`${estilos.tarjeta} ${principal ? estilos.destacada : ''}`}>
      <h3>{titulo}</h3>
      <p>{descripcion}</p>
      {principal && <span className={estilos.insignia}>Módulo central</span>}
      <p className={estilos.estado}>Estado: {estado}</p>
    </article>
  );
}

export default Tarjeta;