import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { mensajeError } from '../../api/http';
import { adminApi } from '../../api/servicios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { claves, useTicketsAdmin } from '../../hooks/consultas';
import { useTitulo } from '../../hooks/useTitulo';
import { fecha } from '../../logic/fechas';
import { hace } from '../../logic/formato';
import { textoMinimo } from '../../logic/validaciones-form';
import type { Ticket } from '../../models';

type Filtro = 'ABIERTOS' | 'RESUELTOS' | 'TODOS';
const FILTROS: readonly Filtro[] = ['ABIERTOS', 'RESUELTOS', 'TODOS'];

/**
 * SOPORTE (panel). Los tickets viven en la caché de TanStack Query: al responder o
 * eliminar se actualiza esa caché (setQueryData) y la insignia del menú cambia sola.
 */
export function SoporteAdmin() {
  useTitulo('Soporte · Panel NEXUS');
  const auth = useAuth();
  const toast = useToast();
  const cache = useQueryClient();
  const tickets = useTicketsAdmin().data ?? [];
  const [filtro, setFiltro] = useState<Filtro>('ABIERTOS');
  const [soloReembolsos, setSoloReembolsos] = useState(false);
  const [seleccionadoId, setSeleccionadoId] = useState<number | null>(null);
  const [respuesta, setRespuesta] = useState('');
  const [tocada, setTocada] = useState(false);

  const visibles = useMemo(() => tickets.filter((t) =>
    (filtro === 'TODOS' || (filtro === 'ABIERTOS' ? t.estado === 'ABIERTO' : t.estado === 'RESUELTO')) && (!soloReembolsos || t.tipo === 'REEMBOLSO')), [tickets, filtro, soloReembolsos]);
  const seleccionado = tickets.find((t) => t.id === seleccionadoId) ?? null;
  const respuestaInvalida = !textoMinimo(respuesta, 3) || respuesta.length > 1000;
  const cuantos = (f: Filtro) => (f === 'TODOS' ? tickets.length : tickets.filter((t) => (f === 'ABIERTOS' ? t.estado === 'ABIERTO' : t.estado === 'RESUELTO')).length);

  const reemplazar = (t: Ticket) => cache.setQueryData<Ticket[]>(claves.ticketsAdmin, (l) => (l ?? []).map((x) => (x.id === t.id ? t : x)));
  /** Lo común tras responder o reembolsar: se actualiza la caché y el formulario (el aviso lo pone cada acción). */
  const tras = {
    onSuccess: (t: Ticket) => { reemplazar(t); setRespuesta(t.respuesta ?? ''); setTocada(false); void cache.invalidateQueries({ queryKey: claves.pedidos }); },
    onError: (e: unknown) => toast.error(mensajeError(e)),
  };

  const responder = useMutation({
    mutationFn: ({ t, resolver }: { t: Ticket; resolver: boolean }) => adminApi.responderTicket(t.id, respuesta.trim(), resolver),
    ...tras,
  });
  const reembolso = useMutation({ mutationFn: (t: Ticket) => adminApi.aprobarReembolso(t.id, respuesta.trim() || undefined), ...tras });
  const eliminar = useMutation({
    mutationFn: (t: Ticket) => adminApi.eliminarTicket(t.id).then(() => t),
    onSuccess: (t: Ticket) => {
      cache.setQueryData<Ticket[]>(claves.ticketsAdmin, (l) => (l ?? []).filter((x) => x.id !== t.id));
      if (seleccionadoId === t.id) setSeleccionadoId(null);
      toast.info('Ticket eliminado.');
    },
    onError: (e: unknown) => toast.error(mensajeError(e)),
  });
  const trabajando = responder.isPending || reembolso.isPending;

  function elegir(t: Ticket) { setSeleccionadoId(t.id); setRespuesta(t.respuesta ?? ''); setTocada(false); }

  function enviar(t: Ticket, resolver: boolean) {
    if (respuestaInvalida) { setTocada(true); return; }
    responder.mutate({ t, resolver }, { onSuccess: () => toast.exito(resolver ? 'Respuesta enviada y ticket resuelto.' : 'Respuesta enviada.') });
  }

  function aprobarReembolso(t: Ticket) {
    if (!window.confirm(`¿Aprobar el reembolso del pedido ${t.pedido}? El juego saldrá de la biblioteca del cliente y se repondrá el stock.`)) return;
    reembolso.mutate(t, { onSuccess: () => toast.exito(`Reembolso de ${t.pedido} aprobado.`) });
  }

  function borrar(t: Ticket) {
    if (!window.confirm(`¿Eliminar el ticket #${t.id}? Esta acción no se puede deshacer.`)) return;
    eliminar.mutate(t);
  }

  return (
    <>
      <div className="dash-cab">
        <div><h1 className="dash-titulo">Soporte</h1><p className="muted">Responde consultas y aprueba reembolsos. Las respuestas le llegan al cliente en "Mis tickets".</p></div>
      </div>

      <div className="soporte-admin">
        <section className="tarjeta lista-tickets" aria-label="Lista de tickets">
          <div className="tabs-linea" role="tablist" aria-label="Estado del ticket">
            {FILTROS.map((f) => (
              <button key={f} type="button" role="tab" className={`tab-linea ${filtro === f ? 'activo' : ''}`} aria-selected={filtro === f} onClick={() => setFiltro(f)}>
                {f === 'ABIERTOS' ? 'Abiertos' : f === 'RESUELTOS' ? 'Resueltos' : 'Todos'} <span className="tab-n">{cuantos(f)}</span>
              </button>
            ))}
          </div>
          <label className="check-inline"><input type="checkbox" checked={soloReembolsos} onChange={(e) => setSoloReembolsos(e.target.checked)} /> Solo reembolsos</label>

          <ul className="tickets-lista">
            {visibles.length === 0 ? <li className="muted text-center py-3">No hay tickets en esta vista.</li> : visibles.map((t) => (
              <li key={t.id}><button type="button" className={`ticket-item ${seleccionadoId === t.id ? 'activo' : ''}`} onClick={() => elegir(t)}>
                <span className="ticket-item-cab"><strong>#{t.id} · {t.asunto}</strong>
                  {t.tipo === 'REEMBOLSO' && <span className="estado-badge est-reembolsado"><i className="fa-solid fa-rotate-left" aria-hidden="true" /> Reembolso</span>}</span>
                <span className="muted small">{t.usuario} · {hace(t.fecha)}{t.estado === 'RESUELTO' ? ' · resuelto' : ''}</span>
              </button></li>
            ))}
          </ul>
        </section>

        <section className="tarjeta detalle-ticket" aria-label="Detalle del ticket">
          {seleccionado ? (() => {
            const t = seleccionado;
            const alEnviar = (e: FormEvent) => { e.preventDefault(); enviar(t, true); };
            return (
              <>
                <header className="tarjeta-cab">
                  <div><h2 className="tarjeta-titulo">#{t.id} · {t.asunto}</h2><p className="muted small">{t.usuario} · {fecha(t.fecha, 'dd/MM/yyyy HH:mm')}</p></div>
                  <span className={`estado-badge ${t.estado === 'RESUELTO' ? 'est-entregado' : 'est-pendiente'}`}>{t.estado === 'RESUELTO' ? 'Resuelto' : 'Abierto'}</span>
                </header>

                <div className="mensaje-cliente"><span className="avatar" aria-hidden="true">{t.usuario.charAt(0).toUpperCase()}</span><p>{t.mensaje}</p></div>

                {t.tipo === 'REEMBOLSO' && t.pedido && (
                  <div className="aviso-reembolso">
                    <i className="fa-solid fa-rotate-left" aria-hidden="true" />
                    <div><strong>Solicitud de reembolso del pedido {t.pedido}</strong><p className="muted small mb-0">Al aprobarla, el pedido pasa a Reembolsado, el juego sale de la biblioteca del cliente y se repone el stock.</p></div>
                    <Link to="/admin/pedidos" className="btn btn-secondary btn-sm">Ver pedidos</Link>
                  </div>
                )}

                {t.respuesta && (
                  <div className="ticket-respuesta"><strong><i className="fa-solid fa-headset" aria-hidden="true" /> {t.respondidoPor} · {t.respondidoEn ? hace(t.respondidoEn) : ''}</strong><p>{t.respuesta}</p></div>
                )}

                <form noValidate onSubmit={alEnviar}>
                  <div className="form-group">
                    <label htmlFor="respuesta">{t.respuesta ? 'Editar respuesta' : 'Tu respuesta'}</label>
                    <textarea id="respuesta" rows={4} placeholder="Escribe una respuesta clara y amable…" className={tocada && respuestaInvalida ? 'invalido' : undefined}
                      value={respuesta} onChange={(e) => setRespuesta(e.target.value)} onBlur={() => setTocada(true)} />
                    {tocada && respuestaInvalida && <p className="msg-error">Escribe una respuesta de al menos 3 caracteres.</p>}
                  </div>
                  <div className="acciones">
                    <button type="submit" className="btn btn-primary" disabled={trabajando}><i className="fa-solid fa-paper-plane" aria-hidden="true" /> Responder y resolver</button>
                    <button type="button" className="btn btn-secondary" disabled={trabajando} onClick={() => enviar(t, false)}>Solo responder</button>
                    {t.tipo === 'REEMBOLSO' && t.estado === 'ABIERTO' && <button type="button" className="btn btn-danger" disabled={trabajando} onClick={() => aprobarReembolso(t)}>Aprobar reembolso</button>}
                    {auth.esAdmin && <button type="button" className="btn btn-link" onClick={() => borrar(t)}><i className="fa-solid fa-trash" aria-hidden="true" /> Eliminar</button>}
                  </div>
                </form>
              </>
            );
          })() : (
            <div className="estado-vacio sin-borde"><i className="fa-solid fa-inbox" aria-hidden="true" /><h2>Elige un ticket</h2><p>Selecciona uno de la lista para leerlo y responder.</p></div>
          )}
        </section>
      </div>
    </>
  );
}
