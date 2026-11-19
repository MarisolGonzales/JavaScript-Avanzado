import type { CSSProperties } from 'react';
import { useMemo } from 'react';
import { Link } from 'react-router';
import { mensajeError } from '../api/http';
import { imagenRota } from '../components/ui';
import { useFavoritos } from '../context/FavoritosContext';
import { useJuegos } from '../hooks/consultas';
import { useTitulo } from '../hooks/useTitulo';
import { formatoSoles } from '../logic/formato';

/** FAVORITOS: cruza los ids guardados (FavoritosContext) con el catálogo (useQuery). */
export function Favoritos() {
  useTitulo('Mis favoritos · NEXUS GAMING');
  const consulta = useJuegos();
  const progreso = useFavoritos();
  const juegos = useMemo(() => {
    const ids = new Set(progreso.favoritos);
    return (consulta.data ?? []).filter((j) => ids.has(j.id));
  }, [consulta.data, progreso.favoritos]);

  return (
    <>
      <section className="page-header">
        <h1>Mis favoritos</h1>
        <p>Juegos que guardaste para revisar más tarde.</p>
      </section>

      <section className="page-body">
        {consulta.isPending ? (
          <p className="muted" aria-live="polite">Cargando favoritos…</p>
        ) : consulta.isError ? (
          <div className="estado-vacio" role="alert"><i className="fa-solid fa-plug-circle-xmark" aria-hidden="true" /><h2>No pudimos cargar tus favoritos</h2><p>{mensajeError(consulta.error)}</p><button type="button" className="btn btn-primary" onClick={() => void consulta.refetch()}>Reintentar</button></div>
        ) : juegos.length === 0 ? (
          <div className="estado-vacio"><i className="fa-regular fa-heart" aria-hidden="true" /><h2>Aún no tienes favoritos</h2><p>Abre el detalle de un juego y guárdalo para encontrarlo aquí.</p><Link className="btn btn-primary" to="/catalogo">Explorar catálogo</Link></div>
        ) : (
          <div className="games-grid">
            {juegos.map((j) => (
              <article key={j.id} className="game-card favorito-card">
                <Link className="game-media" style={{ '--portada': `url(${j.image})` } as CSSProperties} to={`/juego/${j.id}`} aria-label={`Ver detalle de ${j.title}`}>
                  <img src={j.image} alt={`Portada de ${j.title}`} onError={imagenRota} />
                  <span className="tag">{j.category}</span>
                </Link>
                <div className="game-info">
                  <h2 className="game-title"><Link to={`/juego/${j.id}`}>{j.title}</Link></h2>
                  <p className="game-desc">{j.description}</p>
                  <div className="game-bottom"><span className="price">{formatoSoles(j.price)}</span><span className="muted small">{j.stock > 0 ? 'Disponible' : 'Agotado'}</span></div>
                  <div className="acciones">
                    <Link className="btn btn-secondary btn-sm" to={`/juego/${j.id}`}>Ver detalle</Link>
                    <button type="button" className="btn btn-link btn-sm" onClick={() => progreso.alternar(j.id)}><i className="fa-solid fa-heart-crack" aria-hidden="true" /> Quitar</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
