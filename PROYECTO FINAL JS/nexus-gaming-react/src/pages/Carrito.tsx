import { Link } from 'react-router';
import { imagenRota } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useCarrito } from '../context/CarritoContext';
import { useTitulo } from '../hooks/useTitulo';
import { desglosarIgv } from '../logic/dinero';
import { formatoSoles } from '../logic/formato';

/** CARRITO: lee y modifica el estado global del CarritoContext (useReducer por dentro). */
export function Carrito() {
  useTitulo('Carrito · NEXUS GAMING');
  const carrito = useCarrito();
  const auth = useAuth();
  const desglose = desglosarIgv(carrito.total);

  const vaciar = () => { if (window.confirm('¿Vaciar todo el carrito?')) carrito.vaciar(); };

  return (
    <>
      <section className="page-header">
        <h1>Tu carrito</h1>
        <p>Revisa tus juegos antes de pagar. Los precios incluyen IGV.</p>
      </section>

      <section className="page-body">
        {carrito.items.length === 0 ? (
          <div className="estado-vacio">
            <i className="fa-solid fa-cart-shopping" aria-hidden="true" /><h2>Tu carrito está vacío</h2><p>Descubre juegos nuevos en el catálogo.</p>
            <Link className="btn btn-primary" to="/catalogo">Explorar catálogo</Link>
          </div>
        ) : (
          <div className="cart-layout">
            <ul className="cart-items" aria-label="Juegos en el carrito">
              {carrito.items.map((item) => (
                <li key={`${item.idJuego}-${item.tipoEntrega}`} className="cart-item">
                  <img src={item.imagen} alt={`Portada de ${item.titulo}`} onError={imagenRota} />
                  <div className="cart-item-info">
                    <Link to={`/juego/${item.idJuego}`} className="cart-item-titulo">{item.titulo}</Link>
                    <span className={`chip-entrega ${item.tipoEntrega === 'REGALO' ? 'regalo' : ''}`}>
                      <i className={`fa-solid ${item.tipoEntrega === 'DIGITAL' ? 'fa-user' : 'fa-gift'}`} aria-hidden="true" />
                      {item.tipoEntrega === 'DIGITAL' ? ' Para mi cuenta' : ' Es un regalo'}
                    </span>
                  </div>
                  <button type="button" className="btn btn-link btn-sm" onClick={() => carrito.cambiarTipo(item.idJuego, item.tipoEntrega)}>
                    {item.tipoEntrega === 'DIGITAL' ? 'Cambiar a regalo' : 'Cambiar a mi cuenta'}
                  </button>
                  <span className="cart-item-total price">{formatoSoles(item.precio)}</span>
                  <button type="button" className="btn-icono" aria-label={`Quitar ${item.titulo}`} onClick={() => carrito.quitar(item.idJuego, item.tipoEntrega)}><i className="fa-solid fa-trash" aria-hidden="true" /></button>
                </li>
              ))}
            </ul>

            <aside className="cart-summary" aria-label="Resumen de la compra">
              <h2>Resumen</h2>
              <div className="summary-row"><span>Subtotal</span><span>{formatoSoles(desglose.subtotal)}</span></div>
              <div className="summary-row"><span>IGV (18 %)</span><span>{formatoSoles(desglose.igv)}</span></div>
              <div className="summary-row total"><span>Total</span><span>{formatoSoles(carrito.total)}</span></div>
              {carrito.hayRegalo && <p className="muted small"><i className="fa-solid fa-gift" aria-hidden="true" /> En el pago indicarás el correo de quien recibe el regalo.</p>}
              {auth.logueado && !auth.esCliente ? (
                <p className="msg-error">Las cuentas del personal no pueden comprar.</p>
              ) : (
                <Link className="btn btn-primary w-100" to="/checkout">{auth.logueado ? 'Continuar con el pago' : 'Ingresa para pagar'}</Link>
              )}
              <button type="button" className="btn btn-link w-100" onClick={vaciar}>Vaciar carrito</button>
            </aside>
          </div>
        )}
      </section>
    </>
  );
}
