import { createContext, useCallback, useContext, useEffect, useEffectEvent, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router';
import { guardarToken, leerToken, registrarSesionVencida } from '../api/http';
import { authApi } from '../api/servicios';
import type { SesionApi, Usuario } from '../models';
import { useToast } from './ToastContext';

interface ApiAuth {
  usuario: Usuario | null;
  /** true mientras se comprueba el token guardado al abrir la app. */
  restaurando: boolean;
  logueado: boolean;
  esCliente: boolean;
  esStaff: boolean;
  esAdmin: boolean;
  /** Primera letra del nombre (para el avatar). */
  inicial: string;
  /** "Administrador", "Soporte" o "Jugador". */
  rolEtiqueta: string;
  login: (email: string, password: string) => Promise<Usuario>;
  registrar: (datos: { nombre: string; email: string; password: string; departamento: string }) => Promise<Usuario>;
  cerrarSesion: () => void;
  actualizarUsuario: (u: Usuario) => void;
}

const AuthContext = createContext<ApiAuth | null>(null);

/**
 * SESIÓN DEL USUARIO (Context + useState + useEffect).
 * El servidor firma un token al iniciar sesión; se guarda en localStorage y el
 * interceptor de Axios lo envía en cada petición. El rol lo decide el servidor.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [restaurando, setRestaurando] = useState(() => leerToken() !== null);
  const cache = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const limpiar = useCallback(() => {
    guardarToken(null);
    setUsuario(null);
    cache.clear(); // los datos en caché eran de la cuenta anterior
  }, [cache]);

  // Al abrir la app: si hay un token guardado, se comprueba que siga siendo válido.
  useEffect(() => {
    if (!leerToken()) return;
    const controller = new AbortController();
    authApi.yo(controller.signal)
      .then(setUsuario)
      .catch(() => { if (!controller.signal.aborted) guardarToken(null); }) // token vencido o inválido
      .finally(() => { if (!controller.signal.aborted) setRestaurando(false); });
    return () => controller.abort();
  }, []);

  // useEffectEvent (Laboratorio 13): el aviso usa SIEMPRE la ruta actual sin volver a registrar el manejador.
  const alVencer = useEffectEvent(() => {
    limpiar();
    toast.info('Tu sesión venció. Inicia sesión de nuevo.');
    void navigate(`/login?volver=${encodeURIComponent(location.pathname)}`);
  });
  useEffect(() => {
    registrarSesionVencida(() => alVencer());
    return () => registrarSesionVencida(() => undefined);
  }, []);

  const abrir = useCallback((s: SesionApi): Usuario => {
    cache.clear();
    guardarToken(s.token);
    setUsuario(s.usuario);
    return s.usuario;
  }, [cache]);

  const valor = useMemo<ApiAuth>(() => ({
    usuario,
    restaurando,
    logueado: usuario !== null,
    esCliente: usuario?.rol === 'cliente',
    esStaff: usuario?.rol === 'admin' || usuario?.rol === 'soporte',
    esAdmin: usuario?.rol === 'admin',
    inicial: (usuario?.nombre.trim().charAt(0) || '?').toUpperCase(),
    rolEtiqueta: ({ admin: 'Administrador', soporte: 'Soporte', cliente: 'Jugador' } as const)[usuario?.rol ?? 'cliente'],
    login: async (email, password) => abrir(await authApi.login(email, password)),
    registrar: async (datos) => abrir(await authApi.registro(datos)),
    cerrarSesion: limpiar,
    actualizarUsuario: setUsuario,
  }), [usuario, restaurando, abrir, limpiar]);

  return <AuthContext value={valor}>{children}</AuthContext>;
}

export function useAuth(): ApiAuth {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  return ctx;
}
