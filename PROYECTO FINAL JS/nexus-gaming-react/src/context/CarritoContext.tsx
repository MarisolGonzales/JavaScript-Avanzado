import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { carritoApi, juegosApi } from '../api/servicios';
import { esArreglo, esObjeto, guardarJson, leerJson } from '../logic/almacenamiento';
import { sumarSoles } from '../logic/dinero';
import type { ItemCarrito, ItemCarritoApi, Juego, TipoEntrega } from '../models';
import { useAuth } from './AuthContext';
import { CARRITO_VACIO, carritoReducer, puedeAgregar } from './carritoReducer';
import { useToast } from './ToastContext';

const clave = (email: string | null) => `nexus_carrito_v3_${email ?? 'visitante'}`;
const esItem = (v: unknown): v is ItemCarrito =>
  esObjeto(v) && typeof v['idJuego'] === 'number' && typeof v['titulo'] === 'string' && typeof v['imagen'] === 'string' &&
  typeof v['precio'] === 'number' && (v['tipoEntrega'] === 'DIGITAL' || v['tipoEntrega'] === 'REGALO');
const guardiaItems = (v: unknown): v is ItemCarrito[] => esArreglo(v) && v.every(esItem);

/** Carga el carrito de una cuenta y le une lo que el visitante dejó antes de iniciar sesión. */
function leerCarrito(email: string | null): ItemCarrito[] {
  let items = leerJson<ItemCarrito[]>(clave(email), guardiaItems, []);
  if (email) {
    const visitante = leerJson<ItemCarrito[]>(clave(null), guardiaItems, []);
    if (visitante.length) {
      items = [...items, ...visitante.filter((v) => !items.some((i) => i.idJuego === v.idJuego && i.tipoEntrega === v.tipoEntrega))];
      guardarJson(clave(email), items);
      try { localStorage.removeItem(clave(null)); } catch { /* modo privado */ }
    }
  }
  return items;
}

interface ApiCarrito {
  items: readonly ItemCarrito[];
  cantidad: number;
  total: number;
  hayRegalo: boolean;
  agregar: (juego: Juego, tipo?: TipoEntrega) => boolean;
  quitar: (idJuego: number, tipo: TipoEntrega) => void;
  cambiarTipo: (idJuego: number, actual: TipoEntrega) => void;
  vaciar: () => void;
  paraApi: () => ItemCarritoApi[];
}

const CarritoContext = createContext<ApiCarrito | null>(null);

/**
 * CARRITO GLOBAL: useReducer + Context + useEffect + useRef.
 * - Cada cuenta tiene su carrito en localStorage.
 * - Para clientes se sincroniza con el servidor con "antirrebote" (una sola llamada por ráfaga).
 */
export function CarritoProvider({ children }: { children: ReactNode }) {
  const { usuario, esCliente } = useAuth();
  const email = usuario?.email ?? null;
  const toast = useToast();
  const cache = useQueryClient();
  const [estado, dispatch] = useReducer(carritoReducer, CARRITO_VACIO, () => ({ ...CARRITO_VACIO, items: leerCarrito(null) }));
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // 1) Al iniciar o cerrar sesión se carga el carrito de esa cuenta.
  useEffect(() => {
    dispatch({ type: 'cargar', duenio: email, items: leerCarrito(email) });
  }, [email]);

  // 2) Si este navegador no tiene carrito pero el servidor sí (otro dispositivo), se recupera.
  useEffect(() => {
    if (!esCliente || !email) return;
    let activo = true;
    void (async () => {
      try {
        if (leerCarrito(email).length > 0) return;
        const [remotos, catalogo] = await Promise.all([
          carritoApi.obtener(),
          cache.fetchQuery({ queryKey: ['juegos', email], queryFn: ({ signal }) => juegosApi.listar(signal) }),
        ]);
        const recuperados = remotos.flatMap((r): ItemCarrito[] => {
          const j = catalogo.find((x) => x.id === r.idJuego);
          return j ? [{ idJuego: j.id, titulo: j.title, imagen: j.image, precio: j.price, tipoEntrega: r.tipoEntrega }] : [];
        });
        if (activo && recuperados.length) dispatch({ type: 'cargar', duenio: email, items: recuperados });
      } catch { /* sin conexión: se sigue con el carrito local */ }
    })();
    return () => { activo = false; };
  }, [esCliente, email, cache]);

  // 3) Cada cambio se guarda en localStorage (con la clave de SU dueño).
  useEffect(() => {
    if (estado.duenio === email) guardarJson(clave(estado.duenio), estado.items);
  }, [estado.items, estado.duenio, email]);

  // 4) Sincronización con antirrebote: solo tras acciones del usuario.
  useEffect(() => {
    if (estado.cambios === 0 || !esCliente || estado.duenio !== email) return;
    clearTimeout(temporizador.current);
    const items = estado.items.map(({ idJuego, tipoEntrega }) => ({ idJuego, tipoEntrega }));
    temporizador.current = setTimeout(() => { void carritoApi.guardar(items).catch(() => undefined); }, 700);
    return () => clearTimeout(temporizador.current);
  }, [estado.cambios, estado.items, estado.duenio, esCliente, email]);

  const agregar = useCallback((juego: Juego, tipo: TipoEntrega = 'DIGITAL') => {
    const r = puedeAgregar(estado.items, juego, tipo);
    if (r.ok) { dispatch({ type: 'agregar', juego, tipo }); toast.exito(r.mensaje); } else toast.error(r.mensaje);
    return r.ok;
  }, [estado.items, toast]);

  const valor = useMemo<ApiCarrito>(() => ({
    items: estado.items,
    cantidad: estado.items.length,
    total: sumarSoles(...estado.items.map((i) => i.precio)),
    hayRegalo: estado.items.some((i) => i.tipoEntrega === 'REGALO'),
    agregar,
    quitar: (idJuego, tipo) => dispatch({ type: 'quitar', idJuego, tipo }),
    cambiarTipo: (idJuego, actual) => {
      const conflicto = estado.items.some((i) => i.idJuego === idJuego && i.tipoEntrega !== actual);
      if (conflicto) toast.error('Ese juego ya está en tu carrito con la otra opción.');
      else dispatch({ type: 'cambiarTipo', idJuego, actual });
    },
    vaciar: () => dispatch({ type: 'vaciar' }),
    paraApi: () => estado.items.map(({ idJuego, tipoEntrega }) => ({ idJuego, tipoEntrega })),
  }), [estado.items, agregar, toast]);

  return <CarritoContext value={valor}>{children}</CarritoContext>;
}

export function useCarrito(): ApiCarrito {
  const ctx = useContext(CarritoContext);
  if (!ctx) throw new Error('useCarrito debe usarse dentro de <CarritoProvider>.');
  return ctx;
}
