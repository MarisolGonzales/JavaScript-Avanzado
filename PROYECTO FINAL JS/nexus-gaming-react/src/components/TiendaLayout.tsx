import { Suspense, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useCarrito } from '../context/CarritoContext';
import { useInstalaciones } from '../context/InstalacionesContext';
import { useToast } from '../context/ToastContext';
import { useConexion } from '../hooks/useConexion';
import { DIAS_REEMBOLSO } from '../logic/documentos';
import { ErrorBoundary } from './ErrorBoundary';
import { Logo, ThemeToggle } from './ui';

const REDES: readonly { nombre: string; icono: string; url: string }[] = [
  { nombre: 'Facebook', icono: 'fa-facebook-f', url: 'https://www.facebook.com' },
  { nombre: 'Instagram', icono: 'fa-instagram', url: 'https://www.instagram.com' },
  { nombre: 'X', icono: 'fa-x-twitter', url: 'https://x.com' },
  { nombre: 'YouTube', icono: 'fa-youtube', url: 'https://www.youtube.com' },
  { nombre: 'Discord', icono: 'fa-discord', url: 'https://discord.com' },
];

/**
 * Aviso de "sin conexión" (useConexion → useSyncExternalStore, Laboratorio 13).
 * Solo aparece si el navegador pierde internet; con conexión no dibuja nada.
 */
export function BannerConexion() {
  const enLinea = useConexion();
  if (enLinea) return null;
  return (
    <div className="banner-error" role="status">
      <i className="fa-solid fa-wifi" aria-hidden="true" /> Sin conexión a internet. Lo que veas puede estar desactualizado.
    </div>
  );
}

/** Enlace del menú: NavLink marca la página actual con la clase "active" y aria-current. */
function EnlaceMenu({ to, icono, texto }: { to: string; icono: string; texto: string }) {
  return <li><NavLink to={to} className={({ isActive }) => (isActive ? 'active' : '')}><i className={`fa-solid ${icono}`} aria-hidden="true" /> {texto}</NavLink></li>;
}

/** Marco de la TIENDA (lo que ve el cliente): barra superior, contenido (<Outlet/>) y pie. */
export function TiendaLayout() {
  const auth = useAuth();
  const { usuario } = auth;
  const carrito = useCarrito();
  const instalaciones = useInstalaciones();
  const toast = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [menuUsuario, setMenuUsuario] = useState(false);
  const zonaUsuario = useRef<HTMLDivElement>(null);
  const anio = new Date().getFullYear();

  // En cada navegación se cierran los menús y se vuelve arriba.
  useEffect(() => { setMenuAbierto(false); setMenuUsuario(false); window.scrollTo({ top: 0 }); }, [pathname]);

  // Clic fuera del menú de usuario → se cierra. Escape cierra ambos menús.
  useEffect(() => {
    const alHacerClic = (e: MouseEvent) => {
      if (zonaUsuario.current && !zonaUsuario.current.contains(e.target as Node)) setMenuUsuario(false);
    };
    const alEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMenuUsuario(false); setMenuAbierto(false); } };
    document.addEventListener('click', alHacerClic);
    document.addEventListener('keydown', alEscape);
    return () => { document.removeEventListener('click', alHacerClic); document.removeEventListener('keydown', alEscape); };
  }, []);

  /** "Volver al principio" del pie: sube suave, salvo que el usuario prefiera menos animaciones. */
  function subir() {
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: suave ? 'smooth' : 'auto' });
    document.getElementById('contenido')?.focus({ preventScroll: true });
  }

  function salir() {
    auth.cerrarSesion();
    toast.info('Cerraste sesión.');
    void navigate('/inicio');
  }

  return (
    <>
      <a className="saltar" href="#contenido">Saltar al contenido</a>

      <header className="navbar-nx">
        <div className="navbar-inner">
          <Link to="/inicio" className="logo-enlace" aria-label="NEXUS GAMING, ir al inicio"><Logo /></Link>

          <button type="button" className="menu-toggle" aria-expanded={menuAbierto} aria-controls="menu-principal"
            aria-label="Abrir o cerrar el menú" onClick={() => setMenuAbierto(!menuAbierto)}>
            <i className={`fa-solid ${menuAbierto ? 'fa-xmark' : 'fa-bars'}`} aria-hidden="true" />
          </button>

          <nav id="menu-principal" className={`menu-zona ${menuAbierto ? 'abierto' : ''}`} aria-label="Navegación principal">
            <ul className="menu">
              <EnlaceMenu to="/inicio" icono="fa-house" texto="Inicio" />
              <EnlaceMenu to="/catalogo" icono="fa-gamepad" texto="Catálogo" />
              {auth.logueado && (
                <>
                  {auth.esCliente && (
                    <>
                      <EnlaceMenu to="/favoritos" icono="fa-heart" texto="Favoritos" />
                      <EnlaceMenu to="/logros" icono="fa-trophy" texto="Logros" />
                    </>
                  )}
                  <EnlaceMenu to="/biblioteca" icono="fa-layer-group" texto="Mi biblioteca" />
                </>
              )}
              <EnlaceMenu to="/soporte" icono="fa-headset" texto="Soporte" />
            </ul>

            <div className="navbar-acciones">
              <ThemeToggle />
              {instalaciones.activas > 0 && (
                <Link to="/biblioteca" className="btn-descargas" title="Descargas en curso"
                  aria-label={`${instalaciones.activas} descarga(s) en curso, ir a Mi biblioteca`}>
                  <i className="fa-solid fa-download" aria-hidden="true" /> {instalaciones.activas}
                </Link>
              )}
              <Link to="/carrito" className="btn-carrito" aria-label={`Carrito, ${carrito.cantidad} juego(s)`}>
                <i className="fa-solid fa-cart-shopping" aria-hidden="true" /> <span className="solo-ancho">Carrito</span>
                <span className="badge-carrito">{carrito.cantidad}</span>
              </Link>

              {usuario ? (
                <div className="usuario-zona" ref={zonaUsuario}>
                  <button type="button" className="usuario-btn" aria-expanded={menuUsuario} aria-haspopup="menu" onClick={() => setMenuUsuario(!menuUsuario)}>
                    <span className="avatar" aria-hidden="true">{auth.inicial}</span>
                    <span className="usuario-nombre">{usuario.nombre.split(' ')[0]}</span>
                    <i className="fa-solid fa-chevron-down" aria-hidden="true" />
                  </button>
                  {menuUsuario && (
                    <div className="usuario-menu" role="menu">
                      <div className="usuario-menu-cab">
                        <strong>{usuario.nombre}</strong>
                        <span className="muted small">{usuario.email}</span>
                        <span className={`rol-badge ${auth.esStaff ? 'admin' : ''}`}>{auth.rolEtiqueta}</span>
                      </div>
                      {auth.esStaff ? (
                        <Link role="menuitem" to="/admin"><i className="fa-solid fa-chart-line" aria-hidden="true" /> Ir al panel</Link>
                      ) : (
                        <>
                          <Link role="menuitem" to="/pedidos"><i className="fa-solid fa-receipt" aria-hidden="true" /> Mis pedidos</Link>
                          <Link role="menuitem" to="/biblioteca"><i className="fa-solid fa-layer-group" aria-hidden="true" /> Mi biblioteca</Link>
                        </>
                      )}
                      <Link role="menuitem" to="/perfil"><i className="fa-solid fa-user" aria-hidden="true" /> Mi perfil</Link>
                      <button type="button" role="menuitem" onClick={salir}><i className="fa-solid fa-right-from-bracket" aria-hidden="true" /> Cerrar sesión</button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link to="/login" className="btn btn-secondary btn-sm">Ingresar</Link>
                  <Link to="/registro" className="btn btn-primary btn-sm">Crear cuenta</Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>
      <BannerConexion />

      <main id="contenido" tabIndex={-1}>
        {/* key: al cambiar de ruta se reinicia el límite de errores */}
        <ErrorBoundary key={pathname}>
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>

      <footer className="footer-nx">
        <div className="footer-inner">
          <div className="footer-marca">
            <Link to="/inicio" className="logo-enlace" aria-label="NEXUS GAMING, ir al inicio"><Logo tamano={30} /></Link>
            <p>&copy; {anio} NEXUS GAMING S.A.C. · RUC 20601234565 · Lima, Perú. Todos los derechos reservados.
              Los nombres, logotipos e imágenes de los juegos son marcas de sus respectivos propietarios.
              Todos los precios están en soles e incluyen IGV.</p>
            <ul className="footer-redes" aria-label="Redes sociales">
              {REDES.map((r) => (
                <li key={r.nombre}><a href={r.url} target="_blank" rel="noopener" aria-label={`NEXUS GAMING en ${r.nombre}`}><i className={`fa-brands ${r.icono}`} aria-hidden="true" /></a></li>
              ))}
            </ul>
          </div>

          <nav className="footer-col" aria-labelledby="f-tienda">
            <h2 id="f-tienda">Tienda</h2>
            <ul>
              <li><Link to="/inicio">Inicio</Link></li>
              <li><Link to="/catalogo">Catálogo</Link></li>
              {auth.esCliente && (
                <>
                  <li><Link to="/favoritos">Favoritos</Link></li>
                  <li><Link to="/logros">Logros</Link></li>
                </>
              )}
              <li><Link to="/carrito">Carrito</Link></li>
            </ul>
          </nav>
          <nav className="footer-col" aria-labelledby="f-cuenta">
            <h2 id="f-cuenta">Mi cuenta</h2>
            <ul>
              {!auth.logueado ? (
                <>
                  <li><Link to="/login">Ingresar</Link></li>
                  <li><Link to="/registro">Crear cuenta</Link></li>
                </>
              ) : auth.esStaff ? (
                <>
                  <li><Link to="/admin">Panel de administración</Link></li>
                  <li><Link to="/perfil">Mi perfil</Link></li>
                </>
              ) : (
                <>
                  <li><Link to="/favoritos">Favoritos</Link></li>
                  <li><Link to="/logros">Logros</Link></li>
                  <li><Link to="/biblioteca">Mi biblioteca</Link></li>
                  <li><Link to="/pedidos">Mis pedidos</Link></li>
                  <li><Link to="/perfil">Mi perfil</Link></li>
                </>
              )}
            </ul>
          </nav>
          <div className="footer-col">
            <h2>Ayuda</h2>
            <ul>
              <li><Link to="/soporte">Soporte y asistente virtual</Link></li>
              <li>Reembolsos hasta {DIAS_REEMBOLSO} días</li>
              <li>Boleta o factura electrónica</li>
            </ul>
          </div>
          <div className="footer-col">
            <h2>Medios de pago</h2>
            <ul className="footer-pagos" aria-label="Medios de pago aceptados">
              <li title="Visa"><i className="fa-brands fa-cc-visa" aria-hidden="true" /><span className="visually-hidden">Visa</span></li>
              <li title="Mastercard"><i className="fa-brands fa-cc-mastercard" aria-hidden="true" /><span className="visually-hidden">Mastercard</span></li>
              <li title="American Express"><i className="fa-brands fa-cc-amex" aria-hidden="true" /><span className="visually-hidden">American Express</span></li>
              <li className="pago-yape">Yape</li>
              <li className="pago-plin">Plin</li>
            </ul>
            <button type="button" className="btn-subir" onClick={subir}>Volver al principio <i className="fa-solid fa-circle-arrow-up" aria-hidden="true" /></button>
          </div>
        </div>
      </footer>
    </>
  );
}
