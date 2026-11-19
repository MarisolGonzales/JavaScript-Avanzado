import { createContext, useCallback, useContext, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { esArreglo, guardarJson, leerJson } from '../logic/almacenamiento';
import { Descarga, Instalacion, formatoTamano } from '../logic/instalacion';
import type { TareaProgreso } from '../logic/instalacion';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

export type EstadoInstalacion = 'NO_INSTALADO' | 'DESCARGANDO' | 'PAUSADO' | 'INSTALANDO' | 'INSTALADO';
export interface VistaInstalacion { readonly estado: EstadoInstalacion; readonly porcentaje: number; readonly detalle: string }

const TICK_MS = 200;
const NO_INSTALADO: VistaInstalacion = { estado: 'NO_INSTALADO', porcentaje: 0, detalle: '' };
const INSTALADO: VistaInstalacion = { estado: 'INSTALADO', porcentaje: 100, detalle: '' };
const esListaDeTextos = (v: unknown): v is string[] => esArreglo(v) && v.every((x) => typeof x === 'string');

interface ApiInstalaciones {
  activas: number;
  estado: (llave: string) => VistaInstalacion;
  instalar: (llave: string, titulo: string, tamanoGb: number) => void;
  pausar: (llave: string) => void;
  reanudar: (llave: string) => void;
  cancelar: (llave: string) => void;
  desinstalar: (llave: string, titulo: string) => void;
  jugar: (titulo: string) => void;
  sincronizar: (llavesVigentes: readonly string[]) => void;
}

const InstalacionesContext = createContext<ApiInstalaciones | null>(null);

/**
 * INSTALACIONES SIMULADAS de la biblioteca. Vive arriba del árbol (Context), así que una
 * descarga sigue avanzando aunque el usuario cambie de página.
 * - useRef guarda las tareas en curso (objetos de clase que cambian en cada tick).
 * - useState guarda lo que la vista necesita ver; useEffect arranca y limpia el setInterval.
 * Los juegos instalados se recuerdan por usuario en localStorage.
 */
export function InstalacionesProvider({ children }: { children: ReactNode }) {
  const email = useAuth().usuario?.email ?? null;
  const toast = useToast();
  const tareas = useRef(new Map<string, { titulo: string; tarea: TareaProgreso }>());
  const [instalados, setInstalados] = useState<ReadonlySet<string>>(new Set());
  const [enCurso, setEnCurso] = useState<Readonly<Record<string, VistaInstalacion>>>({});
  const clave = email ? `nexus_instalados_${email}` : null;

  /** Copia el estado de las tareas al estado que lee la vista. */
  const publicar = useCallback(() => {
    const vista: Record<string, VistaInstalacion> = {};
    for (const [llave, { tarea }] of tareas.current) {
      const estado: EstadoInstalacion = tarea instanceof Descarga ? (tarea.pausada ? 'PAUSADO' : 'DESCARGANDO') : 'INSTALANDO';
      vista[llave] = { estado, porcentaje: tarea.porcentaje, detalle: tarea.detalle() };
    }
    setEnCurso(vista);
  }, []);

  const cambiarInstalados = useCallback((cambio: (s: Set<string>) => void) => {
    setInstalados((actual) => {
      const nuevo = new Set(actual);
      cambio(nuevo);
      if (clave) guardarJson(clave, [...nuevo]);
      return nuevo;
    });
  }, [clave]);

  // Al iniciar o cerrar sesión se cargan los juegos instalados de esa cuenta.
  useEffect(() => {
    tareas.current.clear();
    publicar();
    setInstalados(new Set(clave ? leerJson(clave, esListaDeTextos, []) : []));
  }, [clave, publicar]);

  // Cada "tick" avanza todas las tareas. useEffectEvent: usa siempre las funciones
  // más recientes (toast, cambiarInstalados) sin reiniciar el temporizador.
  const avanzarTodo = useEffectEvent((ms: number) => {
    for (const [llave, t] of tareas.current) {
      t.tarea.avanzar(ms);
      if (!t.tarea.terminada) continue;
      if (t.tarea instanceof Descarga) {
        t.tarea = new Instalacion(); // terminó de bajar: ahora se "instala"
      } else {
        tareas.current.delete(llave);
        cambiarInstalados((s) => s.add(llave));
        toast.exito(`${t.titulo} está listo para jugar.`);
      }
    }
    publicar();
  });

  // Temporizador: solo corre mientras haya descargas o instalaciones activas.
  const hayActivas = Object.keys(enCurso).length > 0;
  useEffect(() => {
    if (!hayActivas) return;
    let anterior = Date.now();
    const id = setInterval(() => {
      const ahora = Date.now();
      avanzarTodo(ahora - anterior);
      anterior = ahora;
    }, TICK_MS);
    return () => clearInterval(id);
  }, [hayActivas]);

  /** Olvida los juegos que ya no están en la biblioteca (por ejemplo, un pedido reembolsado). Función estable. */
  const sincronizar = useCallback((llavesVigentes: readonly string[]) => {
    const vigentes = new Set(llavesVigentes);
    cambiarInstalados((s) => { for (const l of [...s]) if (!vigentes.has(l)) s.delete(l); });
    for (const llave of [...tareas.current.keys()]) if (!vigentes.has(llave)) tareas.current.delete(llave);
    publicar();
  }, [cambiarInstalados, publicar]);

  const cambiarPausa = useCallback((llave: string, pausada: boolean) => {
    const t = tareas.current.get(llave)?.tarea;
    if (t instanceof Descarga) { t.pausada = pausada; publicar(); }
  }, [publicar]);

  const valor = useMemo<ApiInstalaciones>(() => ({
    activas: Object.keys(enCurso).length,
    estado: (llave) => enCurso[llave] ?? (instalados.has(llave) ? INSTALADO : NO_INSTALADO),
    instalar: (llave, titulo, tamanoGb) => {
      if (tareas.current.has(llave) || instalados.has(llave)) return;
      tareas.current.set(llave, { titulo, tarea: new Descarga(tamanoGb) });
      publicar();
      toast.info(`Descargando ${titulo} (${formatoTamano(tamanoGb)}).`);
    },
    pausar: (llave) => cambiarPausa(llave, true),
    reanudar: (llave) => cambiarPausa(llave, false),
    cancelar: (llave) => {
      const t = tareas.current.get(llave);
      if (!t) return;
      tareas.current.delete(llave);
      publicar();
      toast.info(`Se canceló la descarga de ${t.titulo}.`);
    },
    desinstalar: (llave, titulo) => {
      cambiarInstalados((s) => s.delete(llave));
      toast.info(`${titulo} se desinstaló.`);
    },
    jugar: (titulo) => toast.exito(`Iniciando ${titulo}… ¡Que lo disfrutes! (simulación)`),
    sincronizar,
  }), [enCurso, instalados, publicar, cambiarPausa, cambiarInstalados, sincronizar, toast]);

  return <InstalacionesContext value={valor}>{children}</InstalacionesContext>;
}

export function useInstalaciones(): ApiInstalaciones {
  const ctx = useContext(InstalacionesContext);
  if (!ctx) throw new Error('useInstalaciones debe usarse dentro de <InstalacionesProvider>.');
  return ctx;
}
