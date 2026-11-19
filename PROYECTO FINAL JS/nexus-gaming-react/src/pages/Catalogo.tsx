import { useCallback, useDeferredValue, useMemo, useState, useTransition } from 'react';
import { mensajeError } from '../api/http';
import { GameCard } from '../components/GameCard';
import { useCarrito } from '../context/CarritoContext';
import { useJuegos } from '../hooks/consultas';
import { useTitulo } from '../hooks/useTitulo';
import { IndiceBusqueda } from '../logic/indice-busqueda';
import { ordenarBurbuja } from '../logic/ordenamiento';
import type { Juego } from '../models';

type Orden = 'precio-asc' | 'precio-desc' | 'nombre' | 'reciente';

const COMPARADORES: Record<Orden, (a: Juego, b: Juego) => number> = {
  'precio-asc': (a, b) => a.price - b.price,
  'precio-desc': (a, b) => b.price - a.price,
  nombre: (a, b) => a.title.localeCompare(b.title, 'es'),
  reciente: (a, b) => (b.year ?? 0) - (a.year ?? 0),
};
const ESQUELETO = [1, 2, 3, 4, 5, 6, 7, 8];

/**
 * CATÁLOGO CON PRIORIDADES (Laboratorio 13: "Catálogo").
 * - useDeferredValue: el texto del buscador se actualiza al instante y la lista "va detrás".
 * - useTransition: cambiar orden o categoría es una actualización NO urgente.
 * - useMemo: el índice de búsqueda (tabla hash con Map) solo se reconstruye si cambia el catálogo.
 * - useCallback + memo(GameCard): las tarjetas no se redibujan al escribir.
 */
export function Catalogo() {
  useTitulo('Catálogo · NEXUS GAMING');
  const juegos = useJuegos();
  const carrito = useCarrito();
  const [texto, setTexto] = useState('');
  const [categoria, setCategoria] = useState('Todos');
  const [orden, setOrden] = useState<Orden>('precio-asc');
  const [soloDisponibles, setSoloDisponibles] = useState(false);
  const [, iniciarTransicion] = useTransition();
  const consulta = useDeferredValue(texto);

  const lista = juegos.data;
  const categorias = useMemo(() => ['Todos', ...new Set((lista ?? []).map((j) => j.category))], [lista]);
  const indice = useMemo(() => new IndiceBusqueda((lista ?? []).map((j) => ({
    id: j.id, texto: `${j.title} ${j.category} ${j.description} ${j.developer ?? ''}`,
  }))), [lista]);

  const resultado = useMemo(() => {
    const ids = indice.buscar(consulta);
    const filtrados = (lista ?? []).filter((j) => ids.has(j.id) && (categoria === 'Todos' || j.category === categoria) && (!soloDisponibles || j.stock > 0));
    return ordenarBurbuja(filtrados, COMPARADORES[orden]);
  }, [indice, lista, consulta, categoria, soloDisponibles, orden]);

  const agregar = useCallback((j: Juego) => { carrito.agregar(j); }, [carrito]);
  const limpiar = () => { setTexto(''); setCategoria('Todos'); setSoloDisponibles(false); };

  return (
    <>
      <section className="page-header">
        <h1>Catálogo</h1>
        <p>Explora los juegos disponibles y añade a tu carrito los que quieras.</p>
      </section>

      <section className="page-body">
        <div className="catalog-tools">
          <label className="search-box">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
            <span className="visually-hidden">Buscar juegos</span>
            <input type="search" placeholder="Buscar por título, género o estudio…" value={texto} onChange={(e) => setTexto(e.target.value)} autoComplete="off" />
          </label>
          <label className="campo-inline">
            <span>Ordenar por</span>
            <select value={orden} onChange={(e) => { const v = e.target.value as Orden; iniciarTransicion(() => setOrden(v)); }}>
              <option value="precio-asc">Precio: menor a mayor</option>
              <option value="precio-desc">Precio: mayor a menor</option>
              <option value="nombre">Nombre (A-Z)</option>
              <option value="reciente">Más recientes</option>
            </select>
          </label>
          <label className="check-inline"><input type="checkbox" checked={soloDisponibles} onChange={(e) => setSoloDisponibles(e.target.checked)} /> Solo disponibles</label>
        </div>

        <div className="category-filters" role="group" aria-label="Filtrar por categoría">
          {categorias.map((c) => (
            <button key={c} type="button" className={`filter-chip ${categoria === c ? 'active' : ''}`} aria-pressed={categoria === c}
              onClick={() => iniciarTransicion(() => setCategoria(c))}>{c}</button>
          ))}
        </div>

        {juegos.isPending ? (
          <div className="games-grid" aria-busy="true">{ESQUELETO.map((n) => <div key={n} className="game-card skeleton" />)}</div>
        ) : juegos.isError ? (
          <div className="estado-vacio" role="alert">
            <i className="fa-solid fa-plug-circle-xmark" aria-hidden="true" /><h2>No pudimos cargar el catálogo</h2><p>{mensajeError(juegos.error)}</p>
            <button type="button" className="btn btn-primary" onClick={() => void juegos.refetch()}>Reintentar</button>
          </div>
        ) : (
          <>
            <p className="resultados" aria-live="polite">{resultado.length} {resultado.length === 1 ? 'juego encontrado' : 'juegos encontrados'}</p>
            <div className="games-grid">
              {resultado.length > 0 ? resultado.map((j) => <GameCard key={j.id} juego={j} onAgregar={agregar} />) : (
                <div className="estado-vacio span-all">
                  <i className="fa-solid fa-ghost" aria-hidden="true" /><h2>Sin resultados</h2><p>No encontramos juegos con esos filtros.</p>
                  <button type="button" className="btn btn-secondary" onClick={limpiar}>Limpiar filtros</button>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </>
  );
}
