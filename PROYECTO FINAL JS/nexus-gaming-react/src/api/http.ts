import axios from 'axios';

/**
 * CLIENTE HTTP CON AXIOS (Laboratorio 14: servicios en React).
 * Una sola instancia para toda la app. Los interceptores hacen dos cosas:
 *  1. Petición: añaden "Authorization: Bearer <token>" si hay sesión.
 *  2. Respuesta: convierten cualquier fallo en ApiError y, si el servidor
 *     responde 401 con una sesión abierta, avisan al AuthProvider para cerrarla.
 */
export const CLAVE_TOKEN = 'nexus_token';
export const TIEMPO_LIMITE = 15_000;

export function leerToken(): string | null {
  try { return localStorage.getItem(CLAVE_TOKEN); } catch { return null; }
}
export function guardarToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(CLAVE_TOKEN, token);
    else localStorage.removeItem(CLAVE_TOKEN);
  } catch { /* modo privado */ }
}

type Fallo = 'http' | 'timeout' | 'network' | 'format';

export class ApiError extends Error {
  constructor(readonly kind: Fallo, message: string, readonly status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

/** El AuthProvider registra aquí qué hacer cuando el token vence. */
let alVencerSesion: () => void = () => undefined;
export function registrarSesionVencida(fn: () => void): void { alVencerSesion = fn; }

export const api = axios.create({
  baseURL: '/api',
  timeout: TIEMPO_LIMITE,
  responseType: 'json',
});

api.interceptors.request.use((config) => {
  const token = leerToken();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

api.interceptors.response.use(undefined, (error: unknown) => {
  if (axios.isCancel(error)) throw new DOMException('Consulta cancelada.', 'AbortError');
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const url = error.config?.url ?? '';
    const esLogin = url.includes('/auth/login') || url.includes('/auth/registro');
    if (status === 401 && leerToken() && !esLogin) alVencerSesion();
    if (status) {
      const cuerpo: unknown = error.response?.data;
      const texto = typeof cuerpo === 'object' && cuerpo !== null && 'error' in cuerpo && typeof cuerpo.error === 'string'
        ? cuerpo.error
        : `El servidor respondió con un error (${status}).`;
      throw new ApiError('http', texto, status);
    }
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new ApiError('timeout', 'El servidor tardó demasiado en responder.');
    }
    throw new ApiError('network', 'No hay conexión con el servidor. Verifica que el backend esté corriendo (npm run backend).');
  }
  throw error;
});

/** Convierte cualquier error en un mensaje claro para mostrar al usuario. */
export function mensajeError(err: unknown): string {
  if (err instanceof Error && err.name === 'AbortError') return 'Consulta cancelada.';
  if (err instanceof Error) return err.message;
  return 'Ocurrió un error inesperado.';
}
