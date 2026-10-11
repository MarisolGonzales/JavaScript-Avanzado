import { HttpErrorResponse } from '@angular/common/http';

/** Convierte cualquier error HTTP en un mensaje claro para mostrar al usuario. */
export function mensajeError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'No hay conexión con el servidor. Verifica que el backend esté corriendo (npm run dev en nexus-gaming-backend).';
    }
    const cuerpo: unknown = err.error;
    if (typeof cuerpo === 'object' && cuerpo !== null && 'error' in cuerpo && typeof cuerpo.error === 'string') {
      return cuerpo.error;
    }
    return `El servidor respondió con un error (${err.status}).`;
  }
  return err instanceof Error ? err.message : 'Ocurrió un error inesperado.';
}
