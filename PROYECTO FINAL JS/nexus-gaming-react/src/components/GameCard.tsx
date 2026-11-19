import { memo } from 'react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { formatoSoles } from '../logic/formato';
import type { Juego } from '../models';
import { imagenRota, StockPill } from './ui';

/**
 * TARJETA DE JUEGO reutilizable: recibe el juego por props y avisa la intención
 * de compra con la función onAgregar (en Angular era un input() y un output()).
 * Está envuelta en memo(): si sus props no cambian, React no la vuelve a dibujar.
 */
export const GameCard = memo(function GameCard({ juego, onAgregar }: { juego: Juego; onAgregar: (juego: Juego) => void }) {
  const agotado = juego.stock === 0;
  return (
    <article className={`game-card ${agotado ? 'agotado' : ''}`}>
      <Link className="game-media" style={{ '--portada': `url(${juego.image})` } as CSSProperties} to={`/juego/${juego.id}`} aria-label={`Ver detalles de ${juego.title}`}>
        <img src={juego.image} alt={`Portada de ${juego.title}`} loading="lazy" onError={imagenRota} />
        <span className="tag">{juego.category}</span>
      </Link>
      <div className="game-info">
        <h3 className="game-title"><Link to={`/juego/${juego.id}`}>{juego.title}</Link></h3>
        <p className="game-desc">{juego.description}</p>
        <div className="game-bottom">
          <span className="price">{formatoSoles(juego.price)}</span>
          <StockPill unidades={juego.stock} />
        </div>
        <button type="button" className="btn btn-primary w-100" disabled={agotado} onClick={() => onAgregar(juego)}>
          <i className="fa-solid fa-cart-plus" aria-hidden="true" />
          {agotado ? ' Sin stock' : ' Añadir'}
        </button>
      </div>
    </article>
  );
});
