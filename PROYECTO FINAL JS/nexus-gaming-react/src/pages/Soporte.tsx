import { useEffect, useEffectEvent, useLayoutEffect, useMemo, useOptimistic, useRef, useState, useTransition } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router';
import { mensajeError } from '../api/http';
import { soporteApi } from '../api/servicios';
import { useAsistente } from '../context/AsistenteContext';
import type { MensajeChat } from '../context/AsistenteContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { claves, useMisTickets, usePedidos } from '../hooks/consultas';
import { useTitulo } from '../hooks/useTitulo';
import { dentroDePlazoReembolso } from '../logic/documentos';
import { admiteReembolso } from '../logic/estados';
import { fecha } from '../logic/fechas';
import { textoMinimo } from '../logic/validaciones-form';
import type { AccionAsistente, TipoTicket } from '../models';

const FAQ: readonly { p: string; r: string }[] = [
  { p: '¿Cuándo puedo instalar mi juego?', r: 'Apenas se aprueba el pago: aparece en Mi biblioteca y desde ahí pulsas Instalar.' },
  { p: '¿Puedo pedir un reembolso?', r: 'Sí, dentro de 14 días desde la compra. Abre un ticket de tipo Reembolso y el equipo lo revisa y aprueba.' },
  { p: '¿Cómo pido factura?', r: 'En el pago elige "Factura", escribe tu RUC, razón social y dirección fiscal. Podrás descargarla en PDF.' },
  { p: '¿Cómo funcionan los regalos?', r: 'Marca el juego como regalo, indica el correo de quien lo recibe y el juego llegará a su biblioteca.' },
];

/**
 * SOPORTE: asistente virtual + tickets.
 * - useOptimistic (Laboratorio 13): tu mensaje aparece AL INSTANTE, antes de que responda el servidor.
 * - useTransition: el envío es una acción asíncrona; mientras dura se ven los "puntitos" de escribiendo.
 * - useLayoutEffect + useRef: baja el scroll del chat ANTES de que el navegador pinte (sin parpadeo).
 * - useQuery / useMutation: lista y creación de tickets.
 */
export function Soporte() {
  useTitulo('Soporte · NEXUS GAMING');
  const auth = useAuth();
  const asistente = useAsistente();
  const toast = useToast();
  const cache = useQueryClient();
  const [params] = useSearchParams();
  const mios = useMisTickets(auth.esCliente);
  const misPedidos = usePedidos(auth.esCliente);
  const chat = useRef<HTMLDivElement>(null);

  // ----- Asistente -----
  const [mensajeChat, setMensajeChat] = useState('');
  const [escribiendo, iniciar] = useTransition();
  const [visibles, agregarOptimista] = useOptimistic(asistente.mensajes, (lista: readonly MensajeChat[], texto: string): readonly MensajeChat[] => [
    ...lista, { id: -1, rol: 'usuario', texto },
  ]);
  const ultimasSugerencias = useMemo(() => [...asistente.mensajes].reverse().find((m) => m.rol === 'asistente')?.sugerencias ?? [], [asistente.mensajes]);

  // El chat baja solo hasta el último mensaje.
  useLayoutEffect(() => {
    const el = chat.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visibles.length, escribiendo]);

  function enviarChat(texto?: string) {
    const limpio = (texto ?? mensajeChat).trim();
    if (!limpio || escribiendo) return;
    setMensajeChat('');
    iniciar(async () => {
      agregarOptimista(limpio);
      const respuesta = await asistente.preguntar(limpio);
      // Tras un await hay que volver a marcar la actualización como transición.
      iniciar(() => asistente.confirmar(limpio, respuesta));
    });
  }

  // ----- Tickets -----
  const [formAbierto, setFormAbierto] = useState(false);
  const [form, setForm] = useState({ tipo: 'CONSULTA' as TipoTicket, pedido: '', asunto: '', mensaje: '' });
  const [tocados, setTocados] = useState({ asunto: false, mensaje: false });
  /** Pedidos que aún se pueden reembolsar (pagados o entregados, dentro de los 14 días). */
  const reembolsables = useMemo(() => (misPedidos.data ?? []).filter((p) => admiteReembolso(p.estado) && dentroDePlazoReembolso(p.fecha)), [misPedidos.data]);
  const pedidoFueraDeLista = !!form.pedido && !reembolsables.some((p) => p.codigo === form.pedido);
  const invalido = {
    asunto: tocados.asunto && (!textoMinimo(form.asunto, 3) || form.asunto.length > 120),
    mensaje: tocados.mensaje && (!textoMinimo(form.mensaje, 5) || form.mensaje.length > 1000),
  };

  function abrirTicket(accion: AccionAsistente | null = null) {
    if (!auth.logueado) { toast.info('Inicia sesión para abrir un ticket.'); return; }
    setForm({
      tipo: accion?.ticketTipo ?? 'CONSULTA', pedido: accion?.pedido ?? '',
      asunto: accion?.ticketTipo === 'REEMBOLSO' && accion.pedido ? `Reembolso del pedido ${accion.pedido}` : '', mensaje: '',
    });
    setTocados({ asunto: false, mensaje: false });
    setFormAbierto(true);
    setTimeout(() => document.getElementById('form-ticket')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  }

  // Si llegamos desde "Solicitar reembolso" (?tipo=REEMBOLSO&pedido=NX-...), el formulario se abre ya rellenado.
  const tipoUrl = params.get('tipo');
  const pedidoUrl = params.get('pedido');
  const abrirDesdeUrl = useEffectEvent((pedido: string) => abrirTicket({ tipo: 'ticket', ticketTipo: 'REEMBOLSO', pedido }));
  useEffect(() => {
    if (tipoUrl === 'REEMBOLSO' && pedidoUrl && auth.logueado) abrirDesdeUrl(pedidoUrl);
  }, [tipoUrl, pedidoUrl, auth.logueado]);

  const crear = useMutation({
    mutationFn: () => soporteApi.crearTicket({ asunto: form.asunto.trim(), mensaje: form.mensaje.trim(), tipo: form.tipo, ...(form.tipo === 'REEMBOLSO' ? { pedido: form.pedido } : {}) }),
    onSuccess: () => {
      setFormAbierto(false);
      toast.exito('¡Ticket enviado! Te responderemos en "Mis tickets".');
      void cache.invalidateQueries({ queryKey: claves.misTickets });
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  function enviarTicket(e: FormEvent) {
    e.preventDefault();
    const malo = !textoMinimo(form.asunto, 3) || form.asunto.length > 120 || !textoMinimo(form.mensaje, 5) || form.mensaje.length > 1000 || (form.tipo === 'REEMBOLSO' && !form.pedido);
    if (malo) { setTocados({ asunto: true, mensaje: true }); toast.error('Completa los campos del ticket.'); return; }
    crear.mutate();
  }

  return (
    <>
      <section className="page-header">
        <h1>Soporte</h1>
        <p>Pregúntale a nuestro asistente virtual o abre un ticket para hablar con una persona.</p>
      </section>

      <section className="page-body">
        <div className="soporte-layout">
          {/* ===== Asistente virtual ===== */}
          <section className="chat-card" aria-labelledby="t-chat">
            <header className="chat-cab">
              <span className="chat-avatar" aria-hidden="true"><i className="fa-solid fa-robot" /></span>
              <div><h2 id="t-chat" className="h6 mb-0">Asistente NEXUS</h2><span className="muted small"><span className="punto-en-linea" /> En línea · responde al instante</span></div>
              <button type="button" className="btn btn-link btn-sm ms-auto" onClick={asistente.reiniciar}><i className="fa-solid fa-rotate" aria-hidden="true" /> Reiniciar</button>
            </header>

            <div className="chat-mensajes" ref={chat} role="log" aria-live="polite" aria-label="Conversación con el asistente">
              {visibles.map((m, i) => (
                <div key={m.id === -1 ? `pendiente-${i}` : m.id} className={`burbuja ${m.rol === 'usuario' ? 'mia' : ''}`}>
                  <p>{m.texto}</p>
                  {m.accion && (
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => abrirTicket(m.accion ?? null)}>
                      <i className="fa-solid fa-ticket" aria-hidden="true" /> {m.accion.ticketTipo === 'REEMBOLSO' ? 'Solicitar reembolso' : 'Abrir un ticket'}
                    </button>
                  )}
                  {m.origen === 'ia' && <small className="burbuja-origen"><i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true" /> Respuesta con IA</small>}
                </div>
              ))}
              {escribiendo && <div className="burbuja escribiendo" aria-label="El asistente está escribiendo"><span /><span /><span /></div>}
            </div>

            {ultimasSugerencias.length > 0 && (
              <div className="chat-sugerencias" aria-label="Preguntas sugeridas">
                {ultimasSugerencias.map((s) => <button key={s} type="button" className="filter-chip" onClick={() => (s === 'Hablar con una persona' ? abrirTicket() : enviarChat(s))}>{s}</button>)}
              </div>
            )}

            <form className="chat-form" noValidate onSubmit={(e) => { e.preventDefault(); enviarChat(); }}>
              <label className="visually-hidden" htmlFor="mensaje-chat">Escribe tu pregunta</label>
              <input id="mensaje-chat" type="text" placeholder="Escribe tu pregunta…" maxLength={500} autoComplete="off" value={mensajeChat} onChange={(e) => setMensajeChat(e.target.value)} />
              <button type="submit" className="btn btn-primary" disabled={escribiendo || !mensajeChat.trim()} aria-label="Enviar mensaje"><i className="fa-solid fa-paper-plane" aria-hidden="true" /></button>
            </form>
          </section>

          {/* ===== Tickets y preguntas frecuentes ===== */}
          <div className="soporte-lado">
            <section className="panel-nx" aria-labelledby="t-tickets">
              <div className="admin-bar">
                <h2 id="t-tickets" className="mb-0">Mis tickets</h2>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => abrirTicket()}><i className="fa-solid fa-plus" aria-hidden="true" /> Nuevo ticket</button>
              </div>

              {!auth.logueado ? (
                <>
                  <p className="muted">Inicia sesión para abrir tickets y ver las respuestas del equipo.</p>
                  <Link className="btn btn-secondary btn-sm" to="/login?volver=%2Fsoporte">Ingresar</Link>
                </>
              ) : (
                <>
                  {formAbierto && (
                    <form id="form-ticket" className="ticket-form" onSubmit={enviarTicket} noValidate aria-label="Nuevo ticket">
                      <div className="form-fila">
                        <div className="form-group"><label htmlFor="tipo-ticket">Tipo</label>
                          <select id="tipo-ticket" value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as TipoTicket }))}><option value="CONSULTA">Consulta</option><option value="REEMBOLSO">Reembolso</option></select></div>
                        {form.tipo === 'REEMBOLSO' && (
                          <div className="form-group"><label htmlFor="pedido-ticket">Pedido</label>
                            <select id="pedido-ticket" value={form.pedido} onChange={(e) => setForm((f) => ({ ...f, pedido: e.target.value }))}>
                              <option value="">Elige un pedido…</option>
                              {reembolsables.map((p) => <option key={p.codigo} value={p.codigo}>{p.codigo}</option>)}
                              {pedidoFueraDeLista && <option value={form.pedido}>{form.pedido}</option>}
                            </select></div>
                        )}
                      </div>
                      <div className="form-group"><label htmlFor="asunto">Asunto</label>
                        <input id="asunto" className={invalido.asunto ? 'invalido' : undefined} value={form.asunto}
                          onChange={(e) => setForm((f) => ({ ...f, asunto: e.target.value }))} onBlur={() => setTocados((t) => ({ ...t, asunto: true }))} />
                        {invalido.asunto && <p className="msg-error">Escribe un asunto de al menos 3 caracteres.</p>}</div>
                      <div className="form-group"><label htmlFor="mensaje-ticket">Mensaje</label>
                        <textarea id="mensaje-ticket" rows={4} className={invalido.mensaje ? 'invalido' : undefined} value={form.mensaje}
                          onChange={(e) => setForm((f) => ({ ...f, mensaje: e.target.value }))} onBlur={() => setTocados((t) => ({ ...t, mensaje: true }))} />
                        {invalido.mensaje && <p className="msg-error">Cuéntanos más (mínimo 5 caracteres).</p>}</div>
                      {form.tipo === 'REEMBOLSO' && <p className="form-hint">Los reembolsos se aceptan hasta 14 días después de la compra.</p>}
                      <div className="acciones">
                        <button type="submit" className="btn btn-primary" disabled={crear.isPending}>{crear.isPending ? 'Enviando…' : 'Enviar ticket'}</button>
                        <button type="button" className="btn btn-secondary" onClick={() => setFormAbierto(false)}>Cancelar</button>
                      </div>
                    </form>
                  )}

                  {mios.isError && <p className="msg-error">{mensajeError(mios.error)}</p>}
                  <ul className="tickets-mios">
                    {(mios.data ?? []).length === 0 ? (!mios.isFetching && <li className="muted">Aún no tienes tickets.</li>) : (mios.data ?? []).map((t) => (
                      <li key={t.id} className="ticket-cliente">
                        <div className="ticket-cab">
                          <strong>#{t.id} · {t.asunto}</strong>
                          <span className={`estado-badge ${t.estado === 'RESUELTO' ? 'est-entregado' : 'est-pendiente'}`}>{t.estado === 'RESUELTO' ? 'Resuelto' : 'Abierto'}</span>
                        </div>
                        <p className="muted small">{t.tipo === 'REEMBOLSO' ? `Reembolso · ${t.pedido} · ` : ''}{fecha(t.fecha, 'dd/MM/yyyy HH:mm')}</p>
                        <p>{t.mensaje}</p>
                        {t.respuesta && (
                          <div className="ticket-respuesta"><strong><i className="fa-solid fa-headset" aria-hidden="true" /> {t.respondidoPor}</strong><p>{t.respuesta}</p></div>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            <section className="panel-nx" aria-labelledby="t-faq">
              <h2 id="t-faq">Preguntas frecuentes</h2>
              {FAQ.map((f) => <details key={f.p} className="faq"><summary>{f.p}</summary><p>{f.r}</p></details>)}
            </section>
          </div>
        </div>
      </section>
    </>
  );
}
