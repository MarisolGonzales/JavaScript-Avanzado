import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { mensajeError } from '../http-error';
import type { AccionAsistente, RespuestaAsistente } from '../../shared/models';

export interface MensajeChat {
  readonly id: number;
  readonly rol: 'usuario' | 'asistente';
  readonly texto: string;
  readonly accion?: AccionAsistente | null;
  readonly sugerencias?: readonly string[];
  readonly origen?: 'local' | 'ia';
}

const SALUDO = '¡Hola! Soy el asistente virtual de NEXUS GAMING. Puedo ayudarte con pedidos, claves, pagos, comprobantes, regalos y reembolsos. ¿En qué te ayudo?';
const SUGERENCIAS_INICIALES = ['¿Dónde está mi pedido?', '¿Cómo pido un reembolso?', 'No me llega mi clave', 'Quiero factura'];

/** Conversación con el asistente de soporte. Es un servicio raíz: el chat no se pierde al cambiar de página. */
@Injectable({ providedIn: 'root' })
export class AsistenteService {
  private readonly http = inject(HttpClient);
  private siguienteId = 2;

  readonly mensajes = signal<readonly MensajeChat[]>([{ id: 1, rol: 'asistente', texto: SALUDO, sugerencias: SUGERENCIAS_INICIALES }]);
  readonly escribiendo = signal(false);

  enviar(texto: string): void {
    const limpio = texto.trim();
    if (!limpio || this.escribiendo()) return;
    const historial = this.mensajes().slice(-6).map((m) => ({ rol: m.rol, texto: m.texto }));
    this.agregar({ rol: 'usuario', texto: limpio });
    this.escribiendo.set(true);
    this.http.post<RespuestaAsistente>(`${environment.apiUrl}/asistente`, { mensaje: limpio, historial }).subscribe({
      next: (r) => { this.escribiendo.set(false); this.agregar({ rol: 'asistente', texto: r.respuesta, accion: r.accion, sugerencias: r.sugerencias, origen: r.origen }); },
      error: (e: unknown) => { this.escribiendo.set(false); this.agregar({ rol: 'asistente', texto: `Lo siento, no pude responder: ${mensajeError(e)}`, sugerencias: [] }); }
    });
  }

  reiniciar(): void {
    this.siguienteId = 2;
    this.mensajes.set([{ id: 1, rol: 'asistente', texto: SALUDO, sugerencias: SUGERENCIAS_INICIALES }]);
  }

  private agregar(m: Omit<MensajeChat, 'id'>): void {
    this.mensajes.update((l) => [...l, { ...m, id: this.siguienteId++ }]);
  }
}
