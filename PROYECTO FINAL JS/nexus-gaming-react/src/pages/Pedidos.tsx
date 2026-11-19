import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { mensajeError } from '../api/http';
import { EstadoBadge } from '../components/ui';
import { usePedidos } from '../hooks/consultas';
import { useTitulo } from '../hooks/useTitulo';
import { sumarSoles } from '../logic/dinero';
import { ESTADOS_PEDIDO, infoEstado } from '../logic/estados';
import { fecha } from '../logic/fechas';
import { formatoSoles } from '../logic/formato';
import type { EstadoPedido } from '../models';

/** MIS PEDIDOS: indicadores, filtro por estado y lista (todo derivado con useMemo de la caché de useQuery). */
export function Pedidos() {
  useTitulo('Mis pedidos · NEXUS GAMING');
  const consulta = usePedidos();
  const [filtro, setFiltro] = useState<EstadoPedido | 'TODOS'>('TODOS');

  const pedidos = useMemo(() => consulta.data ?? [], [consulta.data]);
  const visibles = useMemo(() => (filtro === 'TODOS' ? pedidos : pedidos.filter((p) => p.estado === filtro)), [pedidos, filtro]);
  const gastoTotal = useMemo(() => sumarSoles(...pedidos.filter((p) => p.estado !== 'REEMBOLSADO').map((p) => p.total)), [pedidos]);
  const juegosComprados = useMemo(() => pedidos.filter((p) => p.estado === 'ENTREGADO').reduce((n, p) => n + p.items.length, 0), [pedidos]);
  const cuantos = (e: EstadoPedido) => pedidos.filter((p) => p.estado === e).length;

  return (
    <>
      <section className="page-header">
        <h1>Mis pedidos</h1>
        <p>Consulta tus compras, descarga tus comprobantes y revisa su seguimiento.</p>
      </section>

      <section className="page-body">
        {consulta.isPending ? (
          <div className="history-list" aria-busy="true"><div className="skeleton fila-skel" /><div className="skeleton fila-skel" /></div>
        ) : consulta.isError ? (
          <div className="estado-vacio" role="alert">
            <i className="fa-solid fa-plug-circle-xmark" aria-hidden="true" /><h2>No pudimos cargar tus pedidos</h2><p>{mensajeError(consulta.error)}</p>
            <button type="button" className="btn btn-primary" onClick={() => void consulta.refetch()}>Reintentar</button>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="estado-vacio">
            <i className="fa-solid fa-receipt" aria-hidden="true" /><h2>Aún no tienes pedidos</h2><p>Cuando compres, aquí verás tu comprobante y el seguimiento.</p>
            <Link className="btn btn-primary" to="/catalogo">Ir al catálogo</Link>
          </div>
        ) : (
          <>
            <div className="kpis">
              <div className="kpi"><span className="kpi-valor">{pedidos.length}</span><span className="kpi-label">Pedidos</span></div>
              <div className="kpi"><span className="kpi-valor">{juegosComprados}</span><span className="kpi-label">Juegos recibidos</span></div>
              <div className="kpi"><span className="kpi-valor">{formatoSoles(gastoTotal)}</span><span className="kpi-label">Total gastado</span></div>
            </div>

            <div className="category-filters" role="group" aria-label="Filtrar por estado">
              <button type="button" className={`filter-chip ${filtro === 'TODOS' ? 'active' : ''}`} aria-pressed={filtro === 'TODOS'} onClick={() => setFiltro('TODOS')}>Todos ({pedidos.length})</button>
              {ESTADOS_PEDIDO.filter((s) => cuantos(s) > 0).map((s) => (
                <button key={s} type="button" className={`filter-chip ${filtro === s ? 'active' : ''}`} aria-pressed={filtro === s} onClick={() => setFiltro(s)}>{infoEstado(s).etiqueta} ({cuantos(s)})</button>
              ))}
            </div>

            <ul className="history-list">
              {visibles.length === 0 ? <li className="estado-vacio"><h2>Ningún pedido en este estado</h2></li> : visibles.map((p) => (
                <li key={p.codigo} className="history-entry">
                  <div className="history-entry-head">
                    <div>
                      <Link className="pedido-codigo" to={`/pedidos/${p.codigo}`}>{p.codigo}</Link>
                      <time className="muted small" dateTime={p.fecha}> · {fecha(p.fecha, "dd/MM/yyyy 'a las' HH:mm")}</time>
                    </div>
                    <EstadoBadge estado={p.estado} />
                  </div>
                  <ul className="history-items">
                    {p.items.map((i, n) => (
                      <li key={n}><span>{i.titulo} {i.tipoEntrega === 'REGALO' && <small className="muted"> · <i className="fa-solid fa-gift" aria-hidden="true" /> regalo</small>}</span></li>
                    ))}
                  </ul>
                  <div className="history-entry-foot">
                    <span><span className="price">{formatoSoles(p.total)}</span> <small className="muted">· {p.comprobante.tipo === 'FACTURA' ? 'Factura' : 'Boleta'} {p.comprobante.numeroCompleto}</small></span>
                    <Link className="btn btn-secondary btn-sm" to={`/pedidos/${p.codigo}`}>Ver detalle y comprobante</Link>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  );
}
