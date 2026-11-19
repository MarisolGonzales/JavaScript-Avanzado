import { Link } from 'react-router';
import { useTitulo } from '../hooks/useTitulo';

/** Ruta comodín (*): cualquier dirección que no exista termina aquí. */
export function NoEncontrada() {
  useTitulo('Página no encontrada · NEXUS GAMING');
  return (
    <section className="page-body">
      <div className="estado-vacio">
        <i className="fa-solid fa-ghost" aria-hidden="true" />
        <h1>404 · Página no encontrada</h1>
        <p>La dirección que buscas no existe o fue movida.</p>
        <Link className="btn btn-primary" to="/inicio">Volver al inicio</Link>
      </div>
    </section>
  );
}
