import { useMemo, useOptimistic, useState, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { mensajeError } from '../../api/http';
import { pedidosApi } from '../../api/servicios';
import { EstadoBadge, imagenRota, TimelineEstados } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { claves, usePedidos } from '../../hooks/consultas';
import { useTitulo } from '../../hooks/useTitulo';
import { aCsv, descargarTexto } from '../../logic/csv';
import { admiteReembolso, ESTADOS_PEDIDO, infoEstado } from '../../logic/estados';
import { fecha } from '../../logic/fechas';
import { formatoSoles } from '../../logic/formato';
import type { CodigoNodo, EstadoPedido, Pedido } from '../../models';

const POR_PAGINA = 8;
const REGIONES: readonly { codigo: CodigoNodo; etiqueta: string }[] = [
  { codigo: 'NORTE', etiqueta: 'Norte (Trujillo)' }, { codigo: 'SUR', etiqueta: 'Sur (Arequipa)' }, { codigo: 'CENTRO', etiqueta: 'Centro (Cusco)' },
];
const etiquetaRegion = (c: CodigoNodo): string => REGIONES.find((r) => r.codigo === c)?.etiqueta ?? c;

/**
 * PEDIDOS (panel): pestañas por estado, búsqueda, región, paginación y detalle lateral.
 * useOptimistic: al aprobar un reembolso, la fila y el detalle muestran "Reembolsado" AL INSTANTE;
 * si el servidor lo rechaza, React vuelve solo al estado real.
 */
export function PedidosAdmin() {
  useTitulo('Pedidos · Panel NEXUS');
  const datos = usePedidos();
  const cache = useQueryClient();
  const toast = useToast();
  const [texto, setTexto] = useState('');
  const [estado, setEstado] = useState<EstadoPedido | 'TODOS'>('TODOS');
  const [region, setRegion] = useState<CodigoNodo | 'TODAS'>('TODAS');
  const [pagina, setPagina] = useState(1);
  const [seleccionadoCodigo, setSeleccionadoCodigo] = useState<string | null>(null);
  const [descargando, setDescargando] = useState(false);
  const [trabajando, iniciar] = useTransition();

  const [todos, marcarReembolsado] = useOptimistic(datos.data ?? [], (lista: Pedido[], codigo: string) =>
    lista.map((p) => (p.codigo === codigo ? { ...p, estado: 'REEMBOLSADO' as const } : p)));

  const filtrados = useMemo(() => {
    const t = texto.trim().toLowerCase();
    return todos.filter((p) =>
      (estado === 'TODOS' || p.estado === estado) && (region === 'TODAS' || p.nodo === region) &&
      (!t || p.codigo.toLowerCase().includes(t) || p.usuario.toLowerCase().includes(t) || p.comprobante.numeroCompleto.toLowerCase().includes(t)));
  }, [todos, texto, estado, region]);
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const visibles = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const desde = filtrados.length ? (pagina - 1) * POR_PAGINA + 1 : 0;
  const hasta = Math.min(pagina * POR_PAGINA, filtrados.length);
  const paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1);
  const seleccionado = todos.find((p) => p.codigo === seleccionadoCodigo) ?? null;
  const cuantos = (e: EstadoPedido | 'TODOS') => (e === 'TODOS' ? todos.length : todos.filter((p) => p.estado === e).length);

  /** Cambiar un filtro vuelve a la primera página. */
  const filtrar = (cambio: () => void) => { cambio(); setPagina(1); };

  function reembolsar(p: Pedido) {
    if (!window.confirm(`¿Aprobar el reembolso del pedido ${p.codigo}? El juego saldrá de la biblioteca del cliente y se repondrá el stock.`)) return;
    iniciar(async () => {
      marcarReembolsado(p.codigo);
      try {
        const nuevo = await pedidosApi.cambiarEstado(p.codigo, 'REEMBOLSADO');
        cache.setQueryData<Pedido[]>(claves.pedidos, (l) => (l ?? []).map((x) => (x.codigo === nuevo.codigo ? nuevo : x)));
        toast.exito(`Pedido ${p.codigo} reembolsado.`);
        void cache.invalidateQueries({ queryKey: claves.ticketsAdmin });
      } catch (e) {
        toast.error(mensajeError(e));
      }
    });
  }

  async function pdf(p: Pedido, abrir: boolean) {
    setDescargando(true);
    try { await pedidosApi.descargarPdf(p.codigo, p.comprobante.numeroCompleto, abrir); }
    catch (e) { toast.error(mensajeError(e)); }
    finally { setDescargando(false); }
  }

  /** Exporta lo que se está viendo (con los filtros aplicados) a un CSV que abre Excel. */
  function exportar() {
    const filas = filtrados.map((p) => [p.codigo, p.fecha, p.usuario, etiquetaRegion(p.nodo), p.comprobante.tipo, p.comprobante.numeroCompleto,
      p.comprobante.receptor.documento ?? '', p.comprobante.receptor.nombre ?? '', p.pago.metodo, p.estado, p.comprobante.subtotal.toFixed(2), p.comprobante.igv.toFixed(2), p.total.toFixed(2)]);
    descargarTexto(`pedidos-nexus-${new Date().toISOString().slice(0, 10)}.csv`,
      aCsv(['Pedido', 'Fecha', 'Cliente', 'Región', 'Comprobante', 'Número', 'Documento', 'Receptor', 'Pago', 'Estado', 'Op. gravada', 'IGV', 'Total'], filas));
    toast.exito(`Se exportaron ${filas.length} pedidos.`);
  }

  return (
    <>
      <div className="dash-cab">
        <div><h1 className="dash-titulo">Pedidos</h1><p className="muted" aria-live="polite">{filtrados.length} {filtrados.length === 1 ? 'pedido encontrado' : 'pedidos encontrados'}</p></div>
        <button type="button" className="btn btn-secondary btn-sm" disabled={filtrados.length === 0} onClick={exportar}><i className="fa-solid fa-file-csv" aria-hidden="true" /> Exportar CSV</button>
      </div>

      <div className="tabs-linea" role="tablist" aria-label="Filtrar por estado">
        <button type="button" role="tab" className={`tab-linea ${estado === 'TODOS' ? 'activo' : ''}`} aria-selected={estado === 'TODOS'} onClick={() => filtrar(() => setEstado('TODOS'))}>Todos <span className="tab-n">{cuantos('TODOS')}</span></button>
        {ESTADOS_PEDIDO.map((e) => (
          <button key={e} type="button" role="tab" className={`tab-linea ${estado === e ? 'activo' : ''}`} aria-selected={estado === e} onClick={() => filtrar(() => setEstado(e))}>{infoEstado(e).etiqueta} <span className="tab-n">{cuantos(e)}</span></button>
        ))}
      </div>

      <div className="catalog-tools">
        <label className="search-box"><i className="fa-solid fa-magnifying-glass" aria-hidden="true" /><span className="visually-hidden">Buscar pedidos</span>
          <input type="search" placeholder="Buscar por código, cliente o comprobante…" value={texto} onChange={(e) => filtrar(() => setTexto(e.target.value))} autoComplete="off" /></label>
        <label className="campo-inline"><span>Región</span>
          <select value={region} onChange={(e) => filtrar(() => setRegion(e.target.value as CodigoNodo | 'TODAS'))}><option value="TODAS">Todas</option>{REGIONES.map((r) => <option key={r.codigo} value={r.codigo}>{r.etiqueta}</option>)}</select></label>
      </div>

      {datos.isError ? (
        <div className="banner-error en-panel" role="alert">{mensajeError(datos.error)} <button type="button" className="btn-link" onClick={() => void datos.refetch()}>Reintentar</button></div>
      ) : (
        <div className={`pedidos-admin-layout ${seleccionado ? 'con-detalle' : ''}`}>
          <div>
            <div className="tabla-scroll">
              <table className="tabla-nx tabla-filas">
                <thead><tr><th scope="col">Pedido</th><th scope="col">Cliente</th><th scope="col">Región</th><th scope="col">Fecha</th><th scope="col">Total</th><th scope="col">Estado</th><th scope="col"><span className="visually-hidden">Acciones</span></th></tr></thead>
                <tbody>
                  {visibles.length === 0 ? (
                    <tr><td colSpan={7} className="muted text-center">{datos.isPending ? 'Cargando…' : 'No hay pedidos con esos filtros.'}</td></tr>
                  ) : visibles.map((p) => (
                    <tr key={p.codigo} className={`fila-click ${seleccionado?.codigo === p.codigo ? 'seleccionada' : ''}`} onClick={() => setSeleccionadoCodigo(p.codigo)}>
                      <td><strong>{p.codigo}</strong><br /><small className="muted">{p.comprobante.tipo === 'FACTURA' ? 'Factura' : 'Boleta'} {p.comprobante.numeroCompleto}</small></td>
                      <td>{p.usuario}</td>
                      <td>{etiquetaRegion(p.nodo)}</td>
                      <td>{fecha(p.fecha, 'dd/MM/yy HH:mm')}</td>
                      <td><strong>{formatoSoles(p.total)}</strong></td>
                      <td><EstadoBadge estado={p.estado} /></td>
                      <td><button type="button" className="btn btn-secondary btn-sm" aria-label={`Ver detalle del pedido ${p.codigo}`} onClick={(e) => { setSeleccionadoCodigo(p.codigo); e.stopPropagation(); }}>Ver</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <nav className="paginacion" aria-label="Paginación de pedidos">
              <span className="muted small">Mostrando {desde}–{hasta} de {filtrados.length}</span>
              <div className="paginas">
                <button type="button" className="pag" disabled={pagina === 1} aria-label="Página anterior" onClick={() => setPagina(pagina - 1)}><i className="fa-solid fa-chevron-left" aria-hidden="true" /></button>
                {paginas.map((n) => <button key={n} type="button" className={`pag ${n === pagina ? 'activo' : ''}`} aria-current={n === pagina ? 'page' : undefined} onClick={() => setPagina(n)}>{n}</button>)}
                <button type="button" className="pag" disabled={pagina === totalPaginas} aria-label="Página siguiente" onClick={() => setPagina(pagina + 1)}><i className="fa-solid fa-chevron-right" aria-hidden="true" /></button>
              </div>
            </nav>
          </div>

          {seleccionado && (() => {
            const p = seleccionado;
            return (
              <aside className="detalle-lateral" aria-label="Detalle del pedido">
                <header className="detalle-lateral-cab">
                  <div><h2 className="h5 mb-0">{p.codigo}</h2><span className="muted small">{fecha(p.fecha, 'dd/MM/yyyy HH:mm')}</span></div>
                  <button type="button" className="btn-icono" aria-label="Cerrar detalle" onClick={() => setSeleccionadoCodigo(null)}><i className="fa-solid fa-xmark" aria-hidden="true" /></button>
                </header>
                <EstadoBadge estado={p.estado} />

                <h3 className="mini-titulo">Cliente</h3>
                <dl className="ficha ficha-1"><div><dt>Cuenta</dt><dd>{p.usuario}</dd></div><div><dt>Región</dt><dd>{etiquetaRegion(p.nodo)} · {p.entrega?.zona}</dd></div>
                  <div><dt>Pago</dt><dd>{p.pago.metodo} {p.pago.referencia && <small>({p.pago.referencia})</small>} · {p.pago.estado === 'REEMBOLSADO' ? 'Reembolsado' : 'Aprobado'}</dd></div></dl>

                <h3 className="mini-titulo">Comprobante</h3>
                <dl className="ficha ficha-1"><div><dt>{p.comprobante.tipo === 'FACTURA' ? 'Factura' : 'Boleta'}</dt><dd>{p.comprobante.numeroCompleto}</dd></div>
                  <div><dt>{p.comprobante.receptor.tipoDoc === 'SIN DOC' ? 'Documento' : p.comprobante.receptor.tipoDoc}</dt><dd>{p.comprobante.receptor.documento || 'Sin documento'}</dd></div>
                  {p.comprobante.receptor.nombre && <div><dt>{p.comprobante.tipo === 'FACTURA' ? 'Razón social' : 'Nombre'}</dt><dd>{p.comprobante.receptor.nombre}</dd></div>}
                  {p.comprobante.receptor.direccion && <div><dt>Dirección fiscal</dt><dd>{p.comprobante.receptor.direccion}</dd></div>}
                  <div><dt>Op. gravada · IGV · Total</dt><dd>{formatoSoles(p.comprobante.subtotal)} · {formatoSoles(p.comprobante.igv)} · <strong>{formatoSoles(p.comprobante.total)}</strong></dd></div></dl>
                <div className="acciones">
                  <button type="button" className="btn btn-primary btn-sm" disabled={descargando} onClick={() => void pdf(p, false)}><i className="fa-solid fa-file-pdf" aria-hidden="true" /> Descargar PDF</button>
                  <button type="button" className="btn btn-secondary btn-sm" disabled={descargando} onClick={() => void pdf(p, true)}>Ver PDF</button>
                </div>

                <h3 className="mini-titulo">Juegos</h3>
                <ul className="lineas lineas-mini">
                  {p.items.map((i, n) => (
                    <li key={n} className="linea"><img src={i.imagen} alt="" onError={imagenRota} /><div className="linea-info"><strong>{i.titulo}</strong>
                      <span className="muted small">{i.tipoEntrega === 'REGALO' ? `Regalo → ${p.entrega?.destinatario}` : 'Cuenta del cliente'}</span></div><span className="price">{formatoSoles(i.subtotal)}</span></li>
                  ))}
                </ul>

                <h3 className="mini-titulo">Seguimiento</h3>
                <TimelineEstados historial={p.historial} />

                {(admiteReembolso(p.estado) || trabajando) && (
                  <button type="button" className="btn btn-danger w-100" disabled={trabajando} onClick={() => reembolsar(p)}><i className="fa-solid fa-rotate-left" aria-hidden="true" /> {trabajando ? 'Procesando…' : 'Aprobar reembolso'}</button>
                )}
              </aside>
            );
          })()}
        </div>
      )}
    </>
  );
}
