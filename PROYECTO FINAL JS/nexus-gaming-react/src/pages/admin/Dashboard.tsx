import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { mensajeError } from '../../api/http';
import { AreaChart, BarList, DonutChart } from '../../components/Graficos';
import { EstadoBadge, StockPill } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { usePedidos, useReportes, useTicketsAdmin } from '../../hooks/consultas';
import { useTitulo } from '../../hooks/useTitulo';
import { fecha } from '../../logic/fechas';
import { abreviar, diaCorto, formatoSoles, hace } from '../../logic/formato';

interface Actividad { icono: string; clase: string; texto: string; fecha: string; enlace: string }

/** RESUMEN DEL PANEL: tres consultas en paralelo (reportes, pedidos y tickets) y todo lo demás DERIVADO con useMemo. */
export function Dashboard() {
  useTitulo('Resumen · Panel NEXUS');
  const auth = useAuth();
  const reportes = useReportes();
  const pedidos = usePedidos();
  const tickets = useTicketsAdmin();
  const [dias, setDias] = useState<7 | 14>(14);
  const r = reportes.data;

  const puntos = useMemo(() => (r?.ventasPorDia ?? []).slice(-dias).map((d) => ({ etiqueta: diaCorto(d.fecha), valor: d.ingresos })), [r, dias]);
  const totalPeriodo = puntos.reduce((s, p) => s + p.valor, 0);
  const categorias = useMemo(() => (r?.ventasPorCategoria ?? []).map((c) => ({ etiqueta: c.categoria, valor: c.ingresos })), [r]);
  const regiones = useMemo(() => (r?.ventasPorNodo ?? []).map((v) => ({ etiqueta: v.etiqueta, valor: v.ingresos, detalle: `${v.pedidosValidos} pedidos` })), [r]);
  const top = useMemo(() => (r?.topJuegos ?? []).map((t) => ({ etiqueta: t.titulo, valor: t.ingresos, detalle: `${t.unidades} ${t.unidades === 1 ? 'licencia' : 'licencias'}` })), [r]);
  const recientes = (pedidos.data ?? []).slice(0, 6);
  const centroDonut = `S/ ${abreviar(categorias.reduce((s, c) => s + c.valor, 0))}`;
  const listaTickets = tickets.data ?? [];
  const abiertos = listaTickets.filter((t) => t.estado === 'ABIERTO');

  /** Panel derecho: mezcla de los últimos pedidos y tickets, del más nuevo al más antiguo. */
  const actividad = useMemo<Actividad[]>(() => {
    const deP = (pedidos.data ?? []).slice(0, 8).map((p): Actividad => ({
      icono: p.estado === 'REEMBOLSADO' ? 'fa-rotate-left' : 'fa-bag-shopping', clase: p.estado === 'REEMBOLSADO' ? 'peligro' : 'exito',
      texto: p.estado === 'REEMBOLSADO' ? `Pedido ${p.codigo} reembolsado` : `Nueva compra ${p.codigo} por S/ ${p.total.toFixed(2)}`,
      fecha: p.fecha, enlace: '/admin/pedidos',
    }));
    const deT = (tickets.data ?? []).slice(0, 8).map((t): Actividad => ({
      icono: t.tipo === 'REEMBOLSO' ? 'fa-rotate-left' : 'fa-headset', clase: t.estado === 'ABIERTO' ? 'aviso' : 'info',
      texto: `${t.tipo === 'REEMBOLSO' ? 'Solicitud de reembolso' : 'Consulta'}: ${t.asunto}`, fecha: t.fecha, enlace: '/admin/soporte',
    }));
    return [...deP, ...deT].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 7);
  }, [pedidos.data, tickets.data]);

  const cargar = () => { void reportes.refetch(); void pedidos.refetch(); };

  return (
    <>
      <div className="dash-cab">
        <div>
          <h1 className="dash-titulo">Hola, {auth.usuario?.nombre.split(' ')[0]} 👋</h1>
          <p className="muted">Así va NEXUS GAMING: ventas, pedidos y soporte en un vistazo.</p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={cargar}><i className="fa-solid fa-rotate" aria-hidden="true" /> Actualizar</button>
      </div>

      {r ? (
        <div className="dash-rejilla">
          <div className="dash-principal">
            {/* ===== Indicadores ===== */}
            <div className="kpi-tarjetas">
              <article className="kpi-t destacada">
                <span className="kpi-t-et">Ingresos totales</span>
                <strong className="kpi-t-valor">{formatoSoles(r.ingresosTotales)}</strong>
                {r.variacionSemanal !== null ? (
                  <span className={`kpi-t-delta ${r.variacionSemanal >= 0 ? 'sube' : 'baja'}`}>
                    <i className={`fa-solid ${r.variacionSemanal >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`} aria-hidden="true" />
                    {' '}{r.variacionSemanal >= 0 ? '+' : ''}{r.variacionSemanal} % vs. semana anterior
                  </span>
                ) : <span className="kpi-t-delta">Sin semana anterior para comparar</span>}
              </article>
              <article className="kpi-t"><span className="kpi-t-et">Pedidos</span><strong className="kpi-t-valor">{r.pedidosValidos}</strong><span className="kpi-t-delta">{r.reembolsos.pedidos} reembolsados</span></article>
              <article className="kpi-t"><span className="kpi-t-et">Clientes</span><strong className="kpi-t-valor">{r.clientes}</strong><span className="kpi-t-delta">{r.totalJuegos} juegos en catálogo</span></article>
              <article className="kpi-t"><span className="kpi-t-et">Ticket promedio</span><strong className="kpi-t-valor">{formatoSoles(r.ticketPromedio)}</strong><span className="kpi-t-delta">Reembolsos: {formatoSoles(r.reembolsos.monto)}</span></article>
            </div>

            {/* ===== Ventas + categorías ===== */}
            <div className="dash-fila dos-uno">
              <section className="tarjeta" aria-labelledby="t-ventas">
                <header className="tarjeta-cab">
                  <div><h2 id="t-ventas" className="tarjeta-titulo">Ventas</h2><p className="muted small">Últimos {dias} días · {formatoSoles(totalPeriodo)}</p></div>
                  <div className="chips-periodo" role="group" aria-label="Periodo">
                    <button type="button" className={`chip-p ${dias === 7 ? 'activo' : ''}`} aria-pressed={dias === 7} onClick={() => setDias(7)}>7 días</button>
                    <button type="button" className={`chip-p ${dias === 14 ? 'activo' : ''}`} aria-pressed={dias === 14} onClick={() => setDias(14)}>14 días</button>
                  </div>
                </header>
                <AreaChart puntos={puntos} />
              </section>

              <section className="tarjeta" aria-labelledby="t-cat">
                <header className="tarjeta-cab"><div><h2 id="t-cat" className="tarjeta-titulo">Ventas por categoría</h2></div></header>
                <DonutChart segmentos={categorias} centro={centroDonut} subcentro="Ingresos" />
              </section>
            </div>

            {/* ===== Regiones + más vendidos ===== */}
            <div className="dash-fila dos">
              <section className="tarjeta" aria-labelledby="t-reg">
                <header className="tarjeta-cab"><div><h2 id="t-reg" className="tarjeta-titulo">Ingresos por región</h2><p className="muted small">Según el departamento del cliente</p></div></header>
                <BarList datos={regiones} />
              </section>
              <section className="tarjeta" aria-labelledby="t-top">
                <header className="tarjeta-cab"><div><h2 id="t-top" className="tarjeta-titulo">Juegos más vendidos</h2></div></header>
                <BarList datos={top} />
              </section>
            </div>

            {/* ===== Últimos pedidos ===== */}
            <section className="tarjeta" aria-labelledby="t-ult">
              <header className="tarjeta-cab"><h2 id="t-ult" className="tarjeta-titulo">Últimos pedidos</h2><Link className="link-ver" to="/admin/pedidos">Ver todos <i className="fa-solid fa-arrow-right" aria-hidden="true" /></Link></header>
              <div className="tabla-scroll sin-borde">
                <table className="tabla-nx">
                  <thead><tr><th scope="col">Pedido</th><th scope="col">Cliente</th><th scope="col">Fecha</th><th scope="col">Total</th><th scope="col">Estado</th></tr></thead>
                  <tbody>
                    {recientes.length === 0 ? <tr><td colSpan={5} className="muted text-center">Aún no hay pedidos.</td></tr> : recientes.map((p) => (
                      <tr key={p.codigo}>
                        <td><strong>{p.codigo}</strong><br /><small className="muted">{p.comprobante.tipo === 'FACTURA' ? 'Factura' : 'Boleta'} {p.comprobante.numeroCompleto}</small></td>
                        <td>{p.usuario}</td>
                        <td>{fecha(p.fecha, 'dd/MM HH:mm')}</td>
                        <td>{formatoSoles(p.total)}</td>
                        <td><EstadoBadge estado={p.estado} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {auth.esAdmin && r.stockBajo.length > 0 && (
              <section className="tarjeta" aria-labelledby="t-bajo">
                <header className="tarjeta-cab"><h2 id="t-bajo" className="tarjeta-titulo"><i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> Licencias por agotarse (5 o menos)</h2><Link className="link-ver" to="/admin/catalogo">Reponer <i className="fa-solid fa-arrow-right" aria-hidden="true" /></Link></header>
                <ul className="stock-bajo-lista">
                  {r.stockBajo.slice(0, 8).map((s) => <li key={s.nodo + s.idJuego}><span>{s.titulo} <small className="muted">· {s.nodo}</small></span><StockPill unidades={s.stock} texto={s.stock} /></li>)}
                </ul>
              </section>
            )}
          </div>

          {/* ===== Columna derecha ===== */}
          <aside className="dash-lateral" aria-label="Actividad y soporte">
            <section className="tarjeta" aria-labelledby="t-pend">
              <header className="tarjeta-cab"><h2 id="t-pend" className="tarjeta-titulo">Soporte</h2><Link className="link-ver" to="/admin/soporte">Abrir</Link></header>
              <div className="soporte-resumen">
                <div><strong>{abiertos.length}</strong><span>Tickets abiertos</span></div>
                <div><strong>{listaTickets.length - abiertos.length}</strong><span>Resueltos</span></div>
              </div>
              {abiertos.slice(0, 3).map((t) => (
                <Link key={t.id} className="ticket-mini" to="/admin/soporte"><strong>{t.asunto}</strong><span className="muted small">{t.usuario} · {hace(t.fecha)}</span></Link>
              ))}
            </section>

            <section className="tarjeta" aria-labelledby="t-act">
              <header className="tarjeta-cab"><h2 id="t-act" className="tarjeta-titulo">Actividad reciente</h2></header>
              <ul className="actividad">
                {actividad.length === 0 ? <li className="muted">Sin actividad todavía.</li> : actividad.map((a) => (
                  <li key={a.fecha + a.texto}><Link to={a.enlace}><span className={`act-icono ${a.clase}`}><i className={`fa-solid ${a.icono}`} aria-hidden="true" /></span><span className="act-texto">{a.texto}<small>{hace(a.fecha)}</small></span></Link></li>
                ))}
              </ul>
            </section>

            <section className="tarjeta" aria-labelledby="t-est">
              <header className="tarjeta-cab"><h2 id="t-est" className="tarjeta-titulo">Pedidos por estado</h2></header>
              <ul className="estados-lista">
                <li><EstadoBadge estado="ENTREGADO" /><strong>{r.pedidosPorEstado.ENTREGADO ?? 0}</strong></li>
                <li><EstadoBadge estado="PAGADO" /><strong>{r.pedidosPorEstado.PAGADO ?? 0}</strong></li>
                <li><EstadoBadge estado="PENDIENTE" /><strong>{r.pedidosPorEstado.PENDIENTE ?? 0}</strong></li>
                <li><EstadoBadge estado="REEMBOLSADO" /><strong>{r.pedidosPorEstado.REEMBOLSADO ?? 0}</strong></li>
              </ul>
            </section>
          </aside>
        </div>
      ) : reportes.isError ? (
        <div className="banner-error en-panel" role="alert"><i className="fa-solid fa-circle-exclamation" aria-hidden="true" /> {mensajeError(reportes.error)} <button type="button" className="btn-link" onClick={cargar}>Reintentar</button></div>
      ) : (
        <div className="dash-rejilla" aria-busy="true"><div className="dash-principal"><div className="kpi-tarjetas"><div className="skeleton kpi-skel" /><div className="skeleton kpi-skel" /><div className="skeleton kpi-skel" /><div className="skeleton kpi-skel" /></div><div className="skeleton grafico-skel" /></div></div>
      )}
    </>
  );
}
