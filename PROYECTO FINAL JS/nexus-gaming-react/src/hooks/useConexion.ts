import { useDebugValue, useSyncExternalStore } from 'react';

/**
 * ESTADO DE CONEXIÓN DEL NAVEGADOR (Laboratorio 13: useSyncExternalStore).
 * Suscribe React a una fuente externa (eventos online/offline de window)
 * sin copiarla a un useState.
 */
function suscribir(alCambiar: () => void) {
  window.addEventListener('online', alCambiar);
  window.addEventListener('offline', alCambiar);
  return () => {
    window.removeEventListener('online', alCambiar);
    window.removeEventListener('offline', alCambiar);
  };
}

const leerEnLinea = () => navigator.onLine;
const enServidor = () => true;

export function useConexion(): boolean {
  const enLinea = useSyncExternalStore(suscribir, leerEnLinea, enServidor);
  useDebugValue(enLinea, (ok) => (ok ? 'En línea' : 'Sin conexión'));
  return enLinea;
}
