import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { mensajeError } from '../api/http';
import { imagenRota, StockPill } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useCarrito } from '../context/CarritoContext';
import { useFavoritos } from '../context/FavoritosContext';
import { useToast } from '../context/ToastContext';
import { useJuego } from '../hooks/consultas';
import { useTitulo } from '../hooks/useTitulo';
import { formatoSoles } from '../logic/formato';
import type { TipoEntrega } from '../models';

/** DETALLE DE UN JUEGO: el id llega por la URL (useParams) y los datos con useQuery. */
export function JuegoDetalle() {
  useTitulo('Detalle del juego · NEXUS GAMING');
  const { id = '' } = useParams();
  const idJuego = Number(id);
  const valido = Number.isInteger(idJuego) && idJuego > 0;
  const consulta = useJuego(idJuego);
  const j = consulta.data;
  const auth = useAuth();
  const carrito = useCarrito();
  const progreso = useFavoritos();
  const toast = useToast();
  const navigate = useNavigate();
  const [tipo, setTipo] = useState<TipoEntrega>('DIGITAL');

  // Efecto: registrar la visita (sirve para el logro "Vitrinero").
  const { registrarVisita } = progreso;
  useEffect(() => { if (j) registrarVisita(j.id); }, [j, registrarVisita]);

  function alternarFavorito() {
    if (!j) return;
    const agregado = progreso.alternar(j.id);
    toast.exito(agregado ? `${j.title} se guardó en Favoritos.` : `${j.title} se quitó de Favoritos.`);
  }

  const agregar = (): boolean => (j ? carrito.agregar(j, tipo) : false);

  function comprarAhora() {
    if (!j) return;
    const yaEsta = carrito.items.some((i) => i.idJuego === j.id && i.tipoEntrega === tipo);
    // Si ya estaba en el carrito, no es un error: simplemente seguimos al pago.
    if (yaEsta || agregar()) void navigate('/checkout');
  }

  const error = !valido ? 'Identificador de juego inválido.' : consulta.isError ? mensajeError(consulta.error) : null;
  const esFavorito = j ? progreso.esFavorito(j.id) : false;

  return (
    <section className="page-body">
      <Link to="/catalogo" className="link-volver"><i className="fa-solid fa-arrow-left" aria-hidden="true" /> Volver al catálogo</Link>

      {error ? (
        <div className="estado-vacio" role="alert">
          <i className="fa-solid fa-circle-exclamation" aria-hidden="true" /><h2>No encontramos este juego</h2><p>{error}</p>
          <Link className="btn btn-primary" to="/catalogo">Ir al catálogo</Link>
        </div>
      ) : !j ? (
        <div className="detalle-layout" aria-busy="true"><div className="skeleton detalle-skel" /><div className="skeleton detalle-skel" /></div>
      ) : (
        <article className="detalle-layout">
          <img className="detalle-img" src={j.image} alt={`Portada de ${j.title}`} onError={imagenRota} />

          <div className="detalle-info">
            <span className="tag">{j.category}</span>
            <h1>{j.title}</h1>
            <p className="detalle-desc">{j.description}</p>

            <dl className="ficha">
              {j.developer && <div><dt>Desarrollador</dt><dd>{j.developer}</dd></div>}
              {j.year && <div><dt>Año</dt><dd>{j.year}</dd></div>}
              {j.platforms && <div><dt>Plataformas</dt><dd>{j.platforms}</dd></div>}
              {j.mode && <div><dt>Modo</dt><dd>{j.mode}</dd></div>}
            </dl>

            <div className="panel-compra">
              <div className="panel-compra-top">
                <span className="price price-grande">{formatoSoles(j.price)}</span>
                <StockPill unidades={j.stock} />
              </div>

              <fieldset className="opciones-entrega" disabled={j.stock === 0}>
                <legend>¿Para quién es?</legend>
                <label className={`opcion ${tipo === 'DIGITAL' ? 'activa' : ''}`}>
                  <input type="radio" name="tipo" value="DIGITAL" checked={tipo === 'DIGITAL'} onChange={() => setTipo('DIGITAL')} />
                  <span><strong><i className="fa-solid fa-user" aria-hidden="true" /> Para mi cuenta</strong><small>El juego llega a tu biblioteca</small></span>
                </label>
                <label className={`opcion ${tipo === 'REGALO' ? 'activa' : ''}`}>
                  <input type="radio" name="tipo" value="REGALO" checked={tipo === 'REGALO'} onChange={() => setTipo('REGALO')} />
                  <span><strong><i className="fa-solid fa-gift" aria-hidden="true" /> Es un regalo</strong><small>La recibe otra persona (indicas su correo al pagar)</small></span>
                </label>
              </fieldset>

              <div className="panel-compra-acciones">
                <button type="button" className="btn btn-primary" disabled={j.stock === 0} onClick={agregar}><i className="fa-solid fa-cart-plus" aria-hidden="true" /> Añadir al carrito</button>
                <button type="button" className="btn btn-secondary" disabled={j.stock === 0} onClick={comprarAhora}>Comprar ahora</button>
                {auth.esCliente ? (
                  <button type="button" className="btn btn-secondary" aria-pressed={esFavorito} onClick={alternarFavorito}>
                    <i className={`fa-heart ${esFavorito ? 'fa-solid' : 'fa-regular'}`} aria-hidden="true" />
                    {esFavorito ? ' Quitar de favoritos' : ' Guardar en favoritos'}
                  </button>
                ) : (
                  <Link className="btn btn-secondary" to={`/login?volver=${encodeURIComponent(`/juego/${j.id}`)}`}>Ingresar para guardar</Link>
                )}
              </div>
              <p className="form-hint"><i className="fa-solid fa-bolt" aria-hidden="true" /> Entrega inmediata · Reembolso dentro de 14 días · Boleta o factura en PDF</p>
            </div>
          </div>
        </article>
      )}
    </section>
  );
}
