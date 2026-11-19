import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

type Requisito = 'sesion' | 'cliente' | 'staff' | 'admin' | 'invitado';

/** Redirige y, si hace falta, explica por qué con un aviso (el aviso va en un efecto, no durante el render). */
function Redirigir({ a, aviso }: { a: string; aviso?: string }) {
  const toast = useToast();
  const { error } = toast;
  useEffect(() => { if (aviso) error(aviso); }, [aviso, error]);
  return <Navigate to={a} replace />;
}

/**
 * "GUARDS" DE RUTAS con React Router (equivalen a authGuard, invitadoGuard, staffGuard,
 * adminGuard y clienteGuard de la versión Angular): si el usuario no cumple el requisito
 * se le redirige con <Navigate>.
 */
export function RutaProtegida({ requiere, children }: { requiere: Requisito; children: ReactNode }) {
  const { logueado, restaurando, esCliente, esStaff, esAdmin } = useAuth();
  const { pathname, search } = useLocation();
  const alLogin = `/login?volver=${encodeURIComponent(pathname + search)}`;

  if (restaurando) return null; // se espera a saber si el token guardado sigue siendo válido

  switch (requiere) {
    case 'invitado': {
      // Con sesión abierta, login y registro no tienen sentido: cada rol va a su pantalla
      // (el cliente, a la página de la que venía si llegó con ?volver=).
      const volver = new URLSearchParams(search).get('volver');
      const destino = esStaff ? '/admin' : volver && volver.startsWith('/') && !volver.startsWith('//') ? volver : '/inicio';
      return logueado ? <Redirigir a={destino} /> : children;
    }
    case 'sesion':
      return logueado ? children : <Redirigir a={alLogin} />;
    case 'cliente':
      if (!logueado) return <Redirigir a={alLogin} />;
      return esCliente ? children : <Redirigir a="/inicio" aviso="Las cuentas del personal no pueden comprar. Entra con una cuenta de cliente." />;
    case 'staff':
      if (esStaff) return children;
      return logueado ? <Redirigir a="/inicio" aviso="El panel es solo para el personal de NEXUS GAMING." /> : <Redirigir a={alLogin} />;
    case 'admin':
      return esAdmin ? children : <Redirigir a="/admin" aviso="Esta sección es exclusiva de administración." />;
  }
}
