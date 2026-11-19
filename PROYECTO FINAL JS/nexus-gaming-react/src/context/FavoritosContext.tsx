import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { guardarJson, leerJson } from '../logic/almacenamiento';
import { useAuth } from './AuthContext';

export interface LogroJugador {
  readonly id: string;
  readonly titulo: string;
  readonly descripcion: string;
  readonly icono: string;
  readonly progreso: number;
  readonly objetivo: number;
  readonly desbloqueado: boolean;
}

const clave = (tipo: 'favoritos' | 'vistos', email: string | null) =>
  `nexus_${tipo}_v1_${email ? encodeURIComponent(email) : 'visitante'}`;
const guardiaIds = (v: unknown): v is number[] =>
  Array.isArray(v) && v.every((id): id is number => Number.isInteger(id) && id > 0);

/** Logros calculados a partir de favoritos, juegos vistos y juegos en la biblioteca (función pura). */
export function calcularLogros(favoritos: number, vistos: number, enBiblioteca: number): LogroJugador[] {
  const definiciones = [
    { id: 'primer-detalle', titulo: 'Vitrinero', descripcion: 'Consulta el detalle de tu primer juego.', icono: 'fa-magnifying-glass', progreso: vistos, objetivo: 1 },
    { id: 'primer-favorito', titulo: 'Buen gusto', descripcion: 'Guarda tu primer juego en Favoritos.', icono: 'fa-heart', progreso: favoritos, objetivo: 1 },
    { id: 'cinco-favoritos', titulo: 'Curador', descripcion: 'Guarda cinco juegos en Favoritos.', icono: 'fa-star', progreso: favoritos, objetivo: 5 },
    { id: 'primer-juego', titulo: 'Coleccionista', descripcion: 'Consigue tu primer juego en la biblioteca.', icono: 'fa-gamepad', progreso: enBiblioteca, objetivo: 1 },
    { id: 'tres-juegos', titulo: 'Biblioteca en marcha', descripcion: 'Consigue tres juegos en la biblioteca.', icono: 'fa-layer-group', progreso: enBiblioteca, objetivo: 3 },
  ];
  return definiciones.map((l) => ({ ...l, desbloqueado: l.progreso >= l.objetivo, progreso: Math.min(l.progreso, l.objetivo) }));
}

interface ApiFavoritos {
  favoritos: readonly number[];
  vistos: readonly number[];
  esFavorito: (id: number) => boolean;
  alternar: (id: number) => boolean;
  registrarVisita: (id: number) => void;
}

const FavoritosContext = createContext<ApiFavoritos | null>(null);

/** Favoritos y juegos vistos: se guardan en este navegador, separados por cuenta. */
export function FavoritosProvider({ children }: { children: ReactNode }) {
  const email = useAuth().usuario?.email ?? null;
  const [favoritos, setFavoritos] = useState<readonly number[]>([]);
  const [vistos, setVistos] = useState<readonly number[]>([]);

  useEffect(() => {
    setFavoritos(leerJson<number[]>(clave('favoritos', email), guardiaIds, []));
    setVistos(leerJson<number[]>(clave('vistos', email), guardiaIds, []));
  }, [email]);

  const alternar = useCallback((id: number) => {
    const agregado = !favoritos.includes(id);
    const siguiente = agregado ? [...favoritos, id] : favoritos.filter((x) => x !== id);
    setFavoritos(siguiente);
    guardarJson(clave('favoritos', email), siguiente);
    return agregado;
  }, [favoritos, email]);

  const registrarVisita = useCallback((id: number) => {
    setVistos((actual) => {
      if (actual.includes(id)) return actual;
      const siguiente = [...actual, id];
      guardarJson(clave('vistos', email), siguiente);
      return siguiente;
    });
  }, [email]);

  const valor = useMemo<ApiFavoritos>(() => ({
    favoritos, vistos, alternar, registrarVisita, esFavorito: (id) => favoritos.includes(id),
  }), [favoritos, vistos, alternar, registrarVisita]);

  return <FavoritosContext value={valor}>{children}</FavoritosContext>;
}

export function useFavoritos(): ApiFavoritos {
  const ctx = useContext(FavoritosContext);
  if (!ctx) throw new Error('useFavoritos debe usarse dentro de <FavoritosProvider>.');
  return ctx;
}
