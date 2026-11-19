import { useMemo, useState } from 'react';
import { mensajeError } from '../../api/http';
import { useClientes } from '../../hooks/consultas';
import { useTitulo } from '../../hooks/useTitulo';
import { fecha } from '../../logic/fechas';
import { formatoSoles, iniciales } from '../../logic/formato';
import type { ClienteResumen } from '../../models';

type Orden = 'gasto' | 'nombre' | 'reciente';
const REGIONES: Record<string, string> = { NORTE: 'Norte (Trujillo)', SUR: 'Sur (Arequipa)', CENTRO: 'Centro (Cusco)' };
const COMPARADORES: Record<Orden, (a: ClienteResumen, b: ClienteResumen) => number> = {
  gasto: (a, b) => b.gasto - a.gasto, nombre: (a, b) => a.nombre.localeCompare(b.nombre, 'es'), reciente: (a, b) => b.creadoEn.localeCompare(a.creadoEn),
};

/** CLIENTES: indicadores, búsqueda y orden derivados con useMemo de la consulta /admin/clientes. */
export function Clientes() {
  useTitulo('Clientes · Panel NEXUS');
  const datos = useClientes();
  const [texto, setTexto] = useState('');
  const [orden, setOrden] = useState<Orden>('gasto');
  const todos = useMemo(() => datos.data ?? [], [datos.data]);

  const visibles = useMemo(() => {
    const t = texto.trim().toLowerCase();
    const lista = todos.filter((c) => !t || c.nombre.toLowerCase().includes(t) || c.email.toLowerCase().includes(t) || c.departamento.toLowerCase().includes(t));
    return [...lista].sort(COMPARADORES[orden]);
  }, [todos, texto, orden]);
  const conCompras = todos.filter((c) => c.pedidos > 0).length;
  const gastoPromedio = conCompras ? todos.reduce((s, c) => s + c.gasto, 0) / conCompras : 0;

  return (
    <>
      <div className="dash-cab">
        <div><h1 className="dash-titulo">Clientes</h1><p className="muted">Cuentas registradas y lo que han comprado.</p></div>
      </div>

      <div className="kpi-tarjetas tres">
        <article className="kpi-t destacada"><span className="kpi-t-et">Clientes registrados</span><strong className="kpi-t-valor">{todos.length}</strong><span className="kpi-t-delta">{conCompras} con compras</span></article>
        <article className="kpi-t"><span className="kpi-t-et">Gasto promedio</span><strong className="kpi-t-valor">{formatoSoles(gastoPromedio)}</strong><span className="kpi-t-delta">Entre quienes compraron</span></article>
        <article className="kpi-t"><span className="kpi-t-et">Mejor cliente</span><strong className="kpi-t-valor kpi-chico">{visibles[0]?.nombre ?? '—'}</strong><span className="kpi-t-delta">{formatoSoles(visibles[0]?.gasto ?? 0)}</span></article>
      </div>

      <div className="catalog-tools">
        <label className="search-box"><i className="fa-solid fa-magnifying-glass" aria-hidden="true" /><span className="visually-hidden">Buscar clientes</span>
          <input type="search" placeholder="Buscar por nombre, correo o departamento…" value={texto} onChange={(e) => setTexto(e.target.value)} autoComplete="off" /></label>
        <label className="campo-inline"><span>Ordenar por</span>
          <select value={orden} onChange={(e) => setOrden(e.target.value as Orden)}><option value="gasto">Mayor gasto</option><option value="nombre">Nombre (A-Z)</option><option value="reciente">Más recientes</option></select></label>
      </div>

      {datos.isError ? (
        <div className="banner-error en-panel" role="alert">{mensajeError(datos.error)} <button type="button" className="btn-link" onClick={() => void datos.refetch()}>Reintentar</button></div>
      ) : (
        <div className="tabla-scroll">
          <table className="tabla-nx tabla-filas">
            <thead><tr><th scope="col">Cliente</th><th scope="col">Departamento</th><th scope="col">Región</th><th scope="col">Pedidos</th><th scope="col">Gasto</th><th scope="col">Desde</th></tr></thead>
            <tbody>
              {visibles.length === 0 ? <tr><td colSpan={6} className="muted text-center">{datos.isPending ? 'Cargando…' : 'No hay clientes con esa búsqueda.'}</td></tr> : visibles.map((c) => (
                <tr key={c.email}>
                  <td><div className="celda-usuario"><span className="avatar" aria-hidden="true">{iniciales(c.nombre)}</span><div><strong>{c.nombre}</strong><br /><small className="muted">{c.email}</small></div></div></td>
                  <td>{c.departamento}</td><td>{REGIONES[c.nodo]}</td><td>{c.pedidos}</td><td><strong>{formatoSoles(c.gasto)}</strong></td><td>{fecha(c.creadoEn, 'dd/MM/yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
