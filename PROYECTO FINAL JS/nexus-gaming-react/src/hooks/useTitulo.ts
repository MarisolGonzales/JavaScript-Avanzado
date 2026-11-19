import { useEffect } from 'react';

/** Pone el título de la pestaña del navegador mientras la página está montada (useEffect). */
export function useTitulo(titulo: string): void {
  useEffect(() => {
    document.title = titulo;
  }, [titulo]);
}
