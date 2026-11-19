import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { mensajeError } from '../api/http';
import { GameCard } from '../components/GameCard';
import { imagenRota, UMBRAL_STOCK_BAJO } from '../components/ui';
import { useCarrito } from '../context/CarritoContext';
import { useJuegos } from '../hooks/consultas';
import { useTitulo } from '../hooks/useTitulo';
import { formatoSoles } from '../logic/formato';
import type { Juego } from '../models';

const INTERVALO_MS = 6000;

/**
 * CARRUSEL DE DESTACADOS.
 * - useState guarda la diapositiva actual y si está en pausa.
 * - useEffect arranca un setInterval que avanza cada 6 s; su LIMPIEZA lo detiene
 *   al pausar (mouse o foco encima) o al salir de la página.
 */
function Carrusel({ slides, onAgregar }: { slides: readonly Juego[]; onAgregar: (j: Juego) => void }) {
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const n = slides.length;

  useEffect(() => {
    if (pausado || n < 2) return;
    const id = setInterval(() => setIndice((i) => (i + 1) % n), INTERVALO_MS);
    return () => clearInterval(id);
  }, [pausado, n]);

  const siguiente = () => { if (n > 0) setIndice((i) => (i + 1) % n); };
  const anterior = () => { if (n > 0) setIndice((i) => (i - 1 + n) % n); };

  return (
    <section className="hero" aria-roledescription="carrusel" aria-label="Juegos destacados"
      onMouseEnter={() => setPausado(true)} onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)} onBlur={() => setPausado(false)}>
      <div className="hero-track" style={{ transform: `translateX(-${indice * 100}%)` }}>
        {slides.map((j, i) => (
          <article key={j.id} className="hero-slide" aria-hidden={i !== indice} aria-label={`${i + 1} de ${n}`}>
            <img className="hero-img" src={j.banner || j.image} alt={`Arte de ${j.title}`} onError={imagenRota} />
            <div className="hero-scrim" />
            <div className="hero-content">
              <span className="eyebrow">Destacado · {j.category}</span>
              <h1 className="hero-title">{j.title}</h1>
              <p className="hero-copy">{j.description}</p>
              <div className="hero-meta">
                <span className="hero-price">{formatoSoles(j.price)}</span>
                {j.developer && <span className="hero-dev">{j.developer}</span>}
              </div>
              <div className="hero-actions">
                <Link className="btn btn-primary" to={`/juego/${j.id}`} tabIndex={i === indice ? 0 : -1}>Ver detalles</Link>
                <button type="button" className="btn btn-hero" tabIndex={i === indice ? 0 : -1} onClick={() => onAgregar(j)}>
                  <i className="fa-solid fa-cart-plus" aria-hidden="true" /> Añadir
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {n > 1 && (
        <>
          <button type="button" className="hero-flecha izq" aria-label="Juego anterior" onClick={anterior}><i className="fa-solid fa-chevron-left" aria-hidden="true" /></button>
          <button type="button" className="hero-flecha der" aria-label="Juego siguiente" onClick={siguiente}><i className="fa-solid fa-chevron-right" aria-hidden="true" /></button>
          <div className="hero-dots">
            {slides.map((j, i) => (
              <button key={j.id} type="button" className={`hero-dot ${i === indice ? 'activo' : ''}`} aria-label={`Ir a ${j.title}`}
                aria-current={i === indice} onClick={() => setIndice(i)} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/** PÁGINA DE INICIO: carrusel de destacados, recién llegados, últimas unidades y beneficios. */
export function Inicio() {
  useTitulo('Inicio · NEXUS GAMING');
  const juegos = useJuegos();
  const carrito = useCarrito();

  const { slides, recientes, ultimas } = useMemo(() => {
    const todos = juegos.data ?? [];
    const conBanner = todos.filter((j) => j.banner && j.stock > 0);
    return {
      // Portadas del carrusel: prioriza los juegos que traen banner ancho.
      slides: (conBanner.length >= 2 ? conBanner : todos).slice(0, 3),
      recientes: [...todos].sort((a, b) => (b.year ?? 0) - (a.year ?? 0)).slice(0, 4),
      ultimas: todos.filter((j) => j.stock > 0 && j.stock <= UMBRAL_STOCK_BAJO),
    };
  }, [juegos.data]);

  const agregar = useCallback((j: Juego) => { carrito.agregar(j); }, [carrito]);

  if (juegos.isPending) return <section className="hero hero-skeleton skeleton" aria-busy="true" aria-label="Cargando portada" />;
  if (juegos.isError) {
    return (
      <section className="page-body">
        <div className="estado-vacio" role="alert">
          <i className="fa-solid fa-plug-circle-xmark" aria-hidden="true" />
          <h2>No pudimos cargar el catálogo</h2>
          <p>{mensajeError(juegos.error)}</p>
          <button type="button" className="btn btn-primary" onClick={() => void juegos.refetch()}>Reintentar</button>
        </div>
      </section>
    );
  }

  return (
    <>
      {slides.length > 0 && <Carrusel slides={slides} onAgregar={agregar} />}

      <section className="section">
        <div className="section-head">
          <div><h2>Recién llegados</h2><p className="muted">Los lanzamientos más recientes del catálogo.</p></div>
          <Link className="link-ver" to="/catalogo">Ver todo el catálogo <i className="fa-solid fa-arrow-right" aria-hidden="true" /></Link>
        </div>
        <div className="games-grid">
          {recientes.map((j) => <GameCard key={j.id} juego={j} onAgregar={agregar} />)}
        </div>
      </section>

      {ultimas.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div><h2><i className="fa-solid fa-fire" aria-hidden="true" /> Últimas unidades</h2><p className="muted">Quedan pocas licencias de estos juegos.</p></div>
          </div>
          <div className="games-grid">
            {ultimas.map((j) => <GameCard key={j.id} juego={j} onAgregar={agregar} />)}
          </div>
        </section>
      )}

      <section className="section">
        <div className="features">
          <article className="feature-card"><span className="feature-icon"><i className="fa-solid fa-bolt" aria-hidden="true" /></span><h3>Disponible al instante</h3><p>Pagas y el juego aparece de inmediato en tu biblioteca, listo para instalar.</p></article>
          <article className="feature-card"><span className="feature-icon"><i className="fa-solid fa-gift" aria-hidden="true" /></span><h3>Regala juegos</h3><p>Compra un juego para un amigo: el juego llega directo a su biblioteca.</p></article>
          <article className="feature-card"><span className="feature-icon"><i className="fa-solid fa-file-invoice" aria-hidden="true" /></span><h3>Boleta o factura en PDF</h3><p>Elige tu comprobante al pagar y descárgalo cuando quieras.</p></article>
          <article className="feature-card"><span className="feature-icon"><i className="fa-solid fa-robot" aria-hidden="true" /></span><h3>Soporte con asistente</h3><p>Un asistente virtual resuelve tus dudas y, si hace falta, te pasa con una persona.</p></article>
        </div>
      </section>
    </>
  );
}
