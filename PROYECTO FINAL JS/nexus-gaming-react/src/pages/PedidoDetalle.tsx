import { Suspense, use, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useParams, useSearchParams } from 'react-router';
import { mensajeError } from '../api/http';
import { pedidosApi } from '../api/servicios';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { EstadoBadge, imagenRota, TimelineEstados } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { claves } from '../hooks/consultas';
import { useTitulo } from '../hooks/useTitulo';
import { DIAS_REEMBOLSO, dentroDePlazoReembolso } from '../logic/documentos';
import { admiteReembolso } from '../logic/estados';
import { fecha } from '../logic/fechas';
import { formatoSoles } from '../logic/formato';
import type { Pedido } from '../models';

/**
 * Lee el pedido con el hook use(promesa) (Laboratorio 13: "Lectura de recursos").
 * Mientras la promesa está pendiente, el <Suspense> de arriba muestra el esqueleto;
 * si se rechaza, el <ErrorBoundary> muestra el error.
 */
function CuerpoPedido({ promesa, nuevo }: { promesa: Promise<Pedido>; nuevo: boolean }) {
  const p = use(promesa);
  const toast = useToast();
  const [descargando, setDescargando] = useState(false);
  const puedeReembolso = admiteReembolso(p.estado) && dentroDePlazoReembolso(p.fecha);

  async function descargar(abrir: boolean) {
    if (descargando) return;
    setDescargando(true);
    try {
      await pedidosApi.descargarPdf(p.codigo, p.comprobante.numeroCompleto, abrir);
      if (!abrir) toast.exito(`Comprobante ${p.comprobante.numeroCompleto} descargado.`);
    } catch (e) {
      toast.error(mensajeError(e));
    } finally {
      setDescargando(false);
    }
  }

  return (
    <>
      {nuevo && p.estado === 'ENTREGADO' && (
        <div className="banner-exito no-imprimir" role="status">
          <i className="fa-solid fa-circle-check" aria-hidden="true" />
          <div><strong>¡Compra exitosa!</strong> {p.entrega?.canal === 'REGALO' ? 'Tu regalo ya fue enviado y tus juegos están en tu biblioteca.' : 'Tus juegos ya están en tu biblioteca, listos para instalar.'}</div>
          <Link to="/biblioteca" className="btn btn-primary btn-sm">Ir a mi biblioteca</Link>
        </div>
      )}

      <div className="pedido-cabecera">
        <div>
          <h1>Pedido {p.codigo}</h1>
          <p className="muted">{fecha(p.fecha, "dd 'de' MMMM 'de' yyyy, HH:mm")}</p>
        </div>
        <EstadoBadge estado={p.estado} />
      </div>

      <div className="pedido-grid">
        <div className="pedido-col">
          <section className="panel-nx" aria-labelledby="t-items">
            <h2 id="t-items">Juegos</h2>
            <ul className="lineas">
              {p.items.map((i, n) => (
                <li key={n} className="linea">
                  <img src={i.imagen} alt={`Portada de ${i.titulo}`} onError={imagenRota} />
                  <div className="linea-info">
                    <strong>{i.titulo}</strong>
                    <span className="muted small">
                      {i.tipoEntrega === 'REGALO'
                        ? <><i className="fa-solid fa-gift" aria-hidden="true" /> Regalo para {p.entrega?.destinatario}</>
                        : <><i className="fa-solid fa-user" aria-hidden="true" /> Para tu cuenta</>}
                    </span>
                    {p.estado === 'ENTREGADO' && (i.tipoEntrega === 'DIGITAL'
                      ? <Link className="link-ver small" to="/biblioteca"><i className="fa-solid fa-download" aria-hidden="true" /> Instalar desde Mi biblioteca</Link>
                      : <span className="muted small">El juego se agregó a la biblioteca del destinatario.</span>)}
                  </div>
                  <span className="price">{formatoSoles(i.subtotal)}</span>
                </li>
              ))}
            </ul>
          </section>

          {p.entrega?.canal === 'REGALO' && (
            <section className="panel-nx" aria-labelledby="t-regalo">
              <h2 id="t-regalo"><i className="fa-solid fa-gift" aria-hidden="true" /> Regalo</h2>
              <dl className="ficha"><div><dt>Destinatario</dt><dd>{p.entrega.destinatario}</dd></div>{p.entrega.mensaje && <div><dt>Tu mensaje</dt><dd>{p.entrega.mensaje}</dd></div>}</dl>
            </section>
          )}

          <section className="panel-nx no-imprimir" aria-labelledby="t-hist">
            <h2 id="t-hist">Seguimiento</h2>
            <TimelineEstados historial={p.historial} />
            {puedeReembolso && (
              <>
                <p className="muted small">¿Algo salió mal? Puedes pedir el reembolso hasta {DIAS_REEMBOLSO} días después de la compra.</p>
                <Link className="btn btn-secondary btn-sm" to={`/soporte?tipo=REEMBOLSO&pedido=${encodeURIComponent(p.codigo)}`}><i className="fa-solid fa-rotate-left" aria-hidden="true" /> Solicitar reembolso</Link>
              </>
            )}
          </section>
        </div>

        <aside className="comprobante" aria-labelledby="t-comp">
          <header className="comprobante-cab">
            <strong>NEXUS GAMING</strong>
            <span>{p.comprobante.tipo === 'FACTURA' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA'}</span>
            <span id="t-comp" className="comprobante-num">{p.comprobante.numeroCompleto}</span>
          </header>
          <dl className="comprobante-datos">
            <div><dt>Emisión</dt><dd>{fecha(p.comprobante.emitidoEn, 'dd/MM/yyyy HH:mm')}</dd></div>
            <div><dt>{p.comprobante.tipo === 'FACTURA' ? 'Razón social' : 'Cliente'}</dt><dd>{p.comprobante.receptor.nombre || p.usuario}</dd></div>
            <div><dt>{p.comprobante.receptor.tipoDoc === 'SIN DOC' ? 'Documento' : p.comprobante.receptor.tipoDoc}</dt><dd>{p.comprobante.receptor.documento || 'Sin documento'}</dd></div>
            {p.comprobante.receptor.direccion && <div><dt>Dirección</dt><dd>{p.comprobante.receptor.direccion}</dd></div>}
            <div><dt>Pago</dt><dd>{p.pago.metodo} {p.pago.referencia && <small>({p.pago.referencia})</small>} · {p.pago.estado === 'REEMBOLSADO' ? 'Reembolsado' : 'Aprobado'}</dd></div>
          </dl>
          <div className="summary-row"><span>Op. gravada</span><span>{formatoSoles(p.comprobante.subtotal)}</span></div>
          <div className="summary-row"><span>IGV (18 %)</span><span>{formatoSoles(p.comprobante.igv)}</span></div>
          <div className="summary-row total"><span>Total</span><span>{formatoSoles(p.comprobante.total)}</span></div>
          <div className="comprobante-acciones no-imprimir">
            <button type="button" className="btn btn-primary w-100" disabled={descargando} onClick={() => void descargar(false)}><i className="fa-solid fa-file-pdf" aria-hidden="true" /> {descargando ? 'Generando…' : 'Descargar PDF'}</button>
            <button type="button" className="btn btn-secondary w-100" disabled={descargando} onClick={() => void descargar(true)}><i className="fa-regular fa-eye" aria-hidden="true" /> Ver PDF</button>
            <button type="button" className="btn btn-link w-100" onClick={() => window.print()}><i className="fa-solid fa-print" aria-hidden="true" /> Imprimir esta página</button>
          </div>
        </aside>
      </div>
    </>
  );
}

export function PedidoDetalle() {
  useTitulo('Pedido · NEXUS GAMING');
  const { codigo = '' } = useParams();
  const [params] = useSearchParams();
  const cache = useQueryClient();

  // La promesa se crea UNA vez por código (useMemo) y aprovecha la caché de TanStack Query.
  const promesa = useMemo(
    () => cache.fetchQuery({ queryKey: claves.pedido(codigo), queryFn: ({ signal }) => pedidosApi.obtener(codigo, signal) }),
    [cache, codigo],
  );

  return (
    <section className="page-body">
      <Link to="/pedidos" className="link-volver no-imprimir"><i className="fa-solid fa-arrow-left" aria-hidden="true" /> Volver a mis pedidos</Link>
      <ErrorBoundary key={codigo} fallback={(error) => (
        <div className="estado-vacio" role="alert">
          <i className="fa-solid fa-circle-exclamation" aria-hidden="true" /><h2>No pudimos mostrar este pedido</h2><p>{mensajeError(error)}</p>
          <Link className="btn btn-primary" to="/pedidos">Mis pedidos</Link>
        </div>
      )}>
        <Suspense fallback={<div className="skeleton fila-skel" aria-busy="true" />}>
          <CuerpoPedido promesa={promesa} nuevo={params.has('nuevo')} />
        </Suspense>
      </ErrorBoundary>
    </section>
  );
}
