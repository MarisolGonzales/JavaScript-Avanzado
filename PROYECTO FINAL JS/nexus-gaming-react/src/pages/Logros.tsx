import { useMemo } from 'react';
import { Link } from 'react-router';
import { mensajeError } from '../api/http';
import { calcularLogros, useFavoritos } from '../context/FavoritosContext';
import { useBiblioteca } from '../hooks/consultas';
import { useTitulo } from '../hooks/useTitulo';

/** LOGROS: estado DERIVADO. No se guarda nada nuevo; se calcula con useMemo a partir de otros estados. */
export function Logros() {
  useTitulo('Mis logros · NEXUS GAMING');
  const { favoritos, vistos } = useFavoritos();
  const biblioteca = useBiblioteca();
  const logros = useMemo(
    () => calcularLogros(favoritos.length, vistos.length, biblioteca.data?.length ?? 0),
    [favoritos.length, vistos.length, biblioteca.data],
  );
  const desbloqueados = logros.filter((l) => l.desbloqueado).length;
  const porcentaje = (progreso: number, objetivo: number) => Math.round((progreso / objetivo) * 100);

  return (
    <>
      <section className="page-header">
        <h1>Mis logros</h1>
        <p>Tu progreso en NEXUS GAMING.</p>
      </section>

      <section className="page-body">
        <div className="logros-resumen" aria-live="polite"><strong>{desbloqueados} / {logros.length}</strong><span>logros desbloqueados</span></div>
        {biblioteca.isError && <p className="msg-error" role="alert">No se pudo consultar la biblioteca para calcular los logros de colección. {mensajeError(biblioteca.error)}</p>}
        {biblioteca.isPending && <p className="muted">Consultando tu biblioteca…</p>}

        <div className="logros-lista">
          {logros.map((logro) => (
            <article key={logro.id} className={`logro-item ${logro.desbloqueado ? 'desbloqueado' : ''}`}>
              <span className="logro-icono"><i className={`fa-solid ${logro.icono}`} aria-hidden="true" /></span>
              <div className="logro-contenido">
                <div className="logro-cab"><h2>{logro.titulo}</h2><span>{logro.desbloqueado ? 'Desbloqueado' : 'En progreso'}</span></div>
                <p>{logro.descripcion}</p>
                <div className="logro-barra" role="progressbar" aria-label={`Progreso: ${logro.titulo}`} aria-valuenow={logro.progreso} aria-valuemin={0} aria-valuemax={logro.objetivo}>
                  <span style={{ width: `${porcentaje(logro.progreso, logro.objetivo)}%` }} />
                </div>
                <small>{logro.progreso} / {logro.objetivo}</small>
              </div>
            </article>
          ))}
        </div>
        <Link className="btn btn-secondary mt-3" to="/catalogo">Explorar catálogo</Link>
      </section>
    </>
  );
}
