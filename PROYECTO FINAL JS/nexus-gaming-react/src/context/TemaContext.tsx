import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { guardarJson } from '../logic/almacenamiento';

export type Tema = 'oscuro' | 'claro';
const CLAVE = 'nexus_tema';

function temaInicial(): Tema {
  try {
    const guardado: unknown = JSON.parse(localStorage.getItem(CLAVE) ?? 'null');
    if (guardado === 'claro' || guardado === 'oscuro') return guardado;
  } catch { /* almacenamiento no disponible */ }
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: light)').matches ? 'claro' : 'oscuro';
}

const TemaContext = createContext<{ tema: Tema; alternar: () => void }>({ tema: 'oscuro', alternar: () => undefined });

/** TEMA CLARO / OSCURO: useState (inicialización perezosa) + useEffect para tocar el <html>. */
export function TemaProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(temaInicial);

  useEffect(() => {
    const raiz = document.documentElement;
    raiz.setAttribute('data-theme', tema);
    raiz.setAttribute('data-bs-theme', tema === 'claro' ? 'light' : 'dark');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tema === 'claro' ? '#f4f5fa' : '#0a0a0e');
    guardarJson(CLAVE, tema);
  }, [tema]);

  const alternar = () => setTema((t) => (t === 'oscuro' ? 'claro' : 'oscuro'));
  return <TemaContext value={{ tema, alternar }}>{children}</TemaContext>;
}

export const useTema = () => useContext(TemaContext);
