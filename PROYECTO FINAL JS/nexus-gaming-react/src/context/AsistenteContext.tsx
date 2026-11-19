import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { mensajeError } from '../api/http';
import { soporteApi } from '../api/servicios';
import type { AccionAsistente } from '../models';

export interface MensajeChat {
  readonly id: number;
  readonly rol: 'usuario' | 'asistente';
  readonly texto: string;
  readonly accion?: AccionAsistente | null;
  readonly sugerencias?: readonly string[];
  readonly origen?: 'local' | 'ia';
}

const SALUDO = '¡Hola! Soy el asistente virtual de NEXUS GAMING. Puedo ayudarte con pedidos, instalaciones, pagos, comprobantes, regalos y reembolsos. ¿En qué te ayudo?';
const SUGERENCIAS_INICIALES = ['¿Dónde está mi pedido?', '¿Cómo pido un reembolso?', '¿Cómo instalo mi juego?', 'Quiero factura'];
const inicial = (): MensajeChat[] => [{ id: 1, rol: 'asistente', texto: SALUDO, sugerencias: SUGERENCIAS_INICIALES }];

interface ApiAsistente {
  mensajes: readonly MensajeChat[];
  /** Pregunta al servidor y devuelve la respuesta (aún sin agregarla a la conversación). */
  preguntar: (texto: string) => Promise<Omit<MensajeChat, 'id'>>;
  /** Agrega a la conversación la pregunta y su respuesta ya confirmadas. */
  confirmar: (pregunta: string, respuesta: Omit<MensajeChat, 'id'>) => void;
  reiniciar: () => void;
}

const AsistenteContext = createContext<ApiAsistente | null>(null);

/** Conversación con el asistente. Vive en un Context: el chat no se pierde al cambiar de página. */
export function AsistenteProvider({ children }: { children: ReactNode }) {
  const [mensajes, setMensajes] = useState<readonly MensajeChat[]>(inicial);
  const siguienteId = useRef(2);

  const preguntar = useCallback(async (texto: string): Promise<Omit<MensajeChat, 'id'>> => {
    const historial = mensajes.slice(-6).map((m) => ({ rol: m.rol, texto: m.texto }));
    try {
      const r = await soporteApi.asistente(texto, historial);
      return { rol: 'asistente', texto: r.respuesta, accion: r.accion, sugerencias: r.sugerencias, origen: r.origen };
    } catch (e) {
      return { rol: 'asistente', texto: `Lo siento, no pude responder: ${mensajeError(e)}`, sugerencias: [] };
    }
  }, [mensajes]);

  const confirmar = useCallback((pregunta: string, respuesta: Omit<MensajeChat, 'id'>) => {
    setMensajes((l) => [...l, { id: siguienteId.current++, rol: 'usuario', texto: pregunta }, { ...respuesta, id: siguienteId.current++ }]);
  }, []);

  const reiniciar = useCallback(() => { siguienteId.current = 2; setMensajes(inicial()); }, []);

  const valor = useMemo(() => ({ mensajes, preguntar, confirmar, reiniciar }), [mensajes, preguntar, confirmar, reiniciar]);
  return <AsistenteContext value={valor}>{children}</AsistenteContext>;
}

export function useAsistente(): ApiAsistente {
  const ctx = useContext(AsistenteContext);
  if (!ctx) throw new Error('useAsistente debe usarse dentro de <AsistenteProvider>.');
  return ctx;
}
