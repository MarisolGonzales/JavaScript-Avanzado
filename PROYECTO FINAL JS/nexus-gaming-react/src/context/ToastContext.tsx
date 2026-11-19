import { createContext, useCallback, useContext, useMemo, useReducer, useRef } from 'react';
import type { ReactNode } from 'react';

export type TipoToast = 'exito' | 'error' | 'info';
export interface Toast { readonly id: number; readonly tipo: TipoToast; readonly mensaje: string }

type Accion = { type: 'mostrar'; toast: Toast } | { type: 'cerrar'; id: number };

/** Reductor puro: la lista nunca se modifica, siempre se crea una nueva (máximo 4 avisos a la vez). */
export function toastReducer(estado: readonly Toast[], accion: Accion): readonly Toast[] {
  switch (accion.type) {
    case 'mostrar': return [...estado.slice(-3), accion.toast];
    case 'cerrar': return estado.filter((t) => t.id !== accion.id);
  }
}

interface ApiToast {
  toasts: readonly Toast[];
  exito: (mensaje: string) => void;
  error: (mensaje: string) => void;
  info: (mensaje: string) => void;
  cerrar: (id: number) => void;
}

const ToastContext = createContext<ApiToast | null>(null);

/** AVISOS FLOTANTES accesibles (reemplazan a alert()): useReducer + Context. Se dibujan con un portal. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);
  const siguienteId = useRef(1);
  const ultimo = useRef({ mensaje: '', hora: 0 });

  const cerrar = useCallback((id: number) => dispatch({ type: 'cerrar', id }), []);
  const mostrar = useCallback((tipo: TipoToast, mensaje: string, ms = 4000) => {
    // En desarrollo, StrictMode ejecuta dos veces algunos efectos: se evita el aviso repetido.
    const ahora = Date.now();
    if (ultimo.current.mensaje === mensaje && ahora - ultimo.current.hora < 400) return;
    ultimo.current = { mensaje, hora: ahora };
    const id = siguienteId.current++;
    dispatch({ type: 'mostrar', toast: { id, tipo, mensaje } });
    setTimeout(() => dispatch({ type: 'cerrar', id }), ms);
  }, []);

  // Funciones estables (useCallback): los efectos que las usan no se repiten al cambiar la lista.
  const exito = useCallback((m: string) => mostrar('exito', m), [mostrar]);
  const error = useCallback((m: string) => mostrar('error', m, 7000), [mostrar]);
  const info = useCallback((m: string) => mostrar('info', m), [mostrar]);

  const valor = useMemo<ApiToast>(() => ({ toasts, cerrar, exito, error, info }), [toasts, cerrar, exito, error, info]);

  return <ToastContext value={valor}>{children}</ToastContext>;
}

export function useToast(): ApiToast {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>.');
  return ctx;
}
