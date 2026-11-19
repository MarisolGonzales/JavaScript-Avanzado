import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTicketsAdmin } from '../hooks/consultas';
import { ErrorBoundary } from './ErrorBoundary';
import { BannerConexion } from './TiendaLayout';
import { Logo, ThemeToggle } from './ui';

/** Título de cada sección del panel (en Angular venía de data.titulo de la ruta). */
const TITULOS: Record<string, string> = {
  '/admin': 'Resumen', '/admin/pedidos': 'Pedidos', '/admin/clientes': 'Clientes',
  '/admin/soporte': 'Soporte', '/admin/catalogo': 'Catálogo y stock',
};

const claseActiva = ({ isActive }: { isActive: boolean }) => (isActive ? 'activo' : '');

/**
 * Marco del PANEL (administración y soporte): barra lateral con las secciones, barra superior
 * con título, tema y notificaciones. Los tickets abiertos salen de la caché de TanStack Query
 * (la misma consulta que usan el Resumen y Soporte), así la insignia siempre está al día.
 */
export function AdminLayout() {
  const auth = useAuth();
  const { usuario } = auth;
  const toast = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [lateralAbierto, setLateralAbierto] = useState(false);
  const abiertos = (useTicketsAdmin().data ?? []).filter((t) => t.estado === 'ABIERTO');
  const titulo = TITULOS[pathname.replace(/\/$/, '')] ?? 'Panel';

  useEffect(() => { setLateralAbierto(false); }, [pathname]);

  function salir() {
    auth.cerrarSesion();
    toast.info('Cerraste sesión.');
    void navigate('/login');
  }

  return (
    <>
      <a className="saltar" href="#panel-contenido">Saltar al contenido</a>

      <div className={`panel ${lateralAbierto ? 'lateral-abierto' : ''}`}>
        <aside className="lateral" aria-label="Menú del panel">
          <Link to="/admin" className="lateral-logo" aria-label="Panel NEXUS GAMING"><Logo /></Link>

          <nav className="lateral-nav">
            <p className="lateral-seccion">Panel</p>
            <NavLink to="/admin" end className={claseActiva}><i className="fa-solid fa-table-cells-large" aria-hidden="true" /> Resumen</NavLink>
            <NavLink to="/admin/pedidos" className={claseActiva}><i className="fa-solid fa-receipt" aria-hidden="true" /> Pedidos</NavLink>
            <NavLink to="/admin/clientes" className={claseActiva}><i className="fa-solid fa-users" aria-hidden="true" /> Clientes</NavLink>
            <NavLink to="/admin/soporte" className={claseActiva}>
              <i className="fa-solid fa-headset" aria-hidden="true" /> Soporte
              {abiertos.length > 0 && <span className="lateral-badge" aria-label={`${abiertos.length} tickets abiertos`}>{abiertos.length}</span>}
            </NavLink>
            {auth.esAdmin && (
              <>
                <p className="lateral-seccion">Gestión</p>
                <NavLink to="/admin/catalogo" className={claseActiva}><i className="fa-solid fa-gamepad" aria-hidden="true" /> Catálogo y stock</NavLink>
              </>
            )}
          </nav>

          <div className="lateral-pie">
            <Link to="/inicio" className="lateral-tienda"><i className="fa-solid fa-store" aria-hidden="true" /> Ver la tienda</Link>
            {usuario && (
              <div className="lateral-usuario">
                <span className="avatar" aria-hidden="true">{auth.inicial}</span>
                <div className="lateral-usuario-datos"><strong>{usuario.nombre}</strong><span>{auth.rolEtiqueta}</span></div>
                <button type="button" className="btn-icono" aria-label="Cerrar sesión" title="Cerrar sesión" onClick={salir}><i className="fa-solid fa-right-from-bracket" aria-hidden="true" /></button>
              </div>
            )}
          </div>
        </aside>

        {lateralAbierto && <button type="button" className="lateral-velo" aria-label="Cerrar menú" onClick={() => setLateralAbierto(false)} />}

        <div className="panel-principal">
          <header className="panel-barra">
            <button type="button" className="btn-icono panel-hamburguesa" aria-label="Abrir menú" aria-expanded={lateralAbierto} onClick={() => setLateralAbierto(!lateralAbierto)}>
              <i className="fa-solid fa-bars" aria-hidden="true" />
            </button>
            <nav aria-label="Ruta" className="panel-migas"><span className="muted">Panel</span> <i className="fa-solid fa-chevron-right" aria-hidden="true" /> <strong>{titulo}</strong></nav>
            <div className="panel-barra-acciones">
              <ThemeToggle />
              <Link to="/admin/soporte" className="btn-icono campana" aria-label={`Notificaciones: ${abiertos.length} tickets abiertos`}>
                <i className="fa-regular fa-bell" aria-hidden="true" />
                {abiertos.length > 0 && <span className="campana-punto">{abiertos.length}</span>}
              </Link>
              {usuario && (
                <span className="barra-usuario"><span className="avatar" aria-hidden="true">{auth.inicial}</span><span className="barra-usuario-nombre">{usuario.nombre}</span></span>
              )}
            </div>
          </header>
          <BannerConexion />

          <main id="panel-contenido" className="panel-contenido" tabIndex={-1}>
            <ErrorBoundary key={pathname}>
              <Suspense fallback={null}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </>
  );
}
