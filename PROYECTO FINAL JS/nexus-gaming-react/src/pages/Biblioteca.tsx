import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { mensajeError } from '../api/http';
import { imagenRota } from '../components/ui';
import { useInstalaciones } from '../context/InstalacionesContext';
import { useBiblioteca } from '../hooks/consultas';
import { useTitulo } from '../hooks/useTitulo';
import { fecha } from '../logic/fechas';
import { IndiceBusqueda } from '../logic/indice-busqueda';
import { formatoTamano, tamanoJuego } from '../logic/instalacion';
import type { ElementoBiblioteca } from '../models';

/** Bloque de instalación de un juego: lee su estado del InstalacionesContext. */
function Instalacion({ j }: { j: ElementoBiblioteca }) {
  const instalaciones = useInstalaciones();
  const inst = instalaciones.estado(j.llave);
  const tamano = tamanoJuego(j.titulo, j.idJuego);
  const tamanoTexto = formatoTamano(tamano);

  const desinstalar = () => {
    if (window.confirm(`¿Desinstalar ${j.titulo}? Podrás volver a instalarlo cuando quieras.`)) instalaciones.desinstalar(j.llave, j.titulo);
  };

  return (
    <div className="instalacion">
      {inst.estado === 'NO_INSTALADO' ? (
        <>
          <span className="inst-info"><i className="fa-solid fa-hard-drive" aria-hidden="true" /> {tamanoTexto}</span>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => instalaciones.instalar(j.llave, j.titulo, tamano)}><i className="fa-solid fa-download" aria-hidden="true" /> Instalar</button>
        </>
      ) : inst.estado === 'INSTALADO' ? (
        <>
          <span className="inst-info inst-ok"><i className="fa-solid fa-circle-check" aria-hidden="true" /> Instalado · {tamanoTexto}</span>
          <div className="inst-acciones">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => instalaciones.jugar(j.titulo)}><i className="fa-solid fa-play" aria-hidden="true" /> Jugar</button>
            <button type="button" className="btn-icono" aria-label={`Desinstalar ${j.titulo}`} title="Desinstalar" onClick={desinstalar}><i className="fa-solid fa-trash-can" aria-hidden="true" /></button>
          </div>
        </>
      ) : (
        <>
          <div className="inst-cab">
            <span>{inst.estado === 'INSTALANDO' ? 'Instalando…' : inst.estado === 'PAUSADO' ? 'En pausa' : 'Descargando…'}</span>
            <strong>{inst.porcentaje}%</strong>
          </div>
          <div className="barra" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={inst.porcentaje} aria-label={`Progreso de ${j.titulo}`}>
            <div className={`barra-relleno ${inst.estado === 'PAUSADO' ? 'pausada' : ''} ${inst.estado === 'INSTALANDO' ? 'instalando' : ''}`} style={{ width: `${inst.porcentaje}%` }} />
          </div>
          <span className="inst-detalle">{inst.detalle}</span>
          {inst.estado !== 'INSTALANDO' && (
            <div className="inst-acciones">
              {inst.estado === 'PAUSADO'
                ? <button type="button" className="btn btn-secondary btn-sm" onClick={() => instalaciones.reanudar(j.llave)}><i className="fa-solid fa-play" aria-hidden="true" /> Reanudar</button>
                : <button type="button" className="btn btn-secondary btn-sm" onClick={() => instalaciones.pausar(j.llave)}><i className="fa-solid fa-pause" aria-hidden="true" /> Pausar</button>}
              <button type="button" className="btn-icono" aria-label={`Cancelar la descarga de ${j.titulo}`} title="Cancelar" onClick={() => instalaciones.cancelar(j.llave)}><i className="fa-solid fa-xmark" aria-hidden="true" /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** MI BIBLIOTECA: juegos comprados y regalos recibidos, con instalación simulada. */
export function Biblioteca() {
  useTitulo('Mi biblioteca · NEXUS GAMING');
  const consulta = useBiblioteca();
  const { sincronizar } = useInstalaciones();
  const [texto, setTexto] = useState('');
  const consultaTexto = useDeferredValue(texto);
  const todos = useMemo(() => consulta.data ?? [], [consulta.data]);

  // Si un juego salió de la biblioteca (p. ej. por un reembolso), deja de figurar como instalado.
  useEffect(() => { if (consulta.data) sincronizar(consulta.data.map((j) => j.llave)); }, [consulta.data, sincronizar]);

  /** Misma búsqueda por índice hash del catálogo, aplicada a tus juegos. */
  const juegos = useMemo(() => {
    const indice = new IndiceBusqueda(todos.map((j, i) => ({ id: i, texto: j.titulo })));
    const ids = indice.buscar(consultaTexto);
    return todos.filter((_, i) => ids.has(i));
  }, [todos, consultaTexto]);

  return (
    <>
      <section className="page-header">
        <h1>Mi biblioteca</h1>
        <p>Tus juegos, listos para instalar, incluidos los regalos que recibiste.</p>
      </section>

      <section className="page-body">
        {consulta.isPending ? (
          <div className="library-grid" aria-busy="true"><div className="skeleton library-skel" /><div className="skeleton library-skel" /></div>
        ) : consulta.isError ? (
          <div className="estado-vacio" role="alert">
            <i className="fa-solid fa-plug-circle-xmark" aria-hidden="true" /><h2>No pudimos cargar tu biblioteca</h2><p>{mensajeError(consulta.error)}</p>
            <button type="button" className="btn btn-primary" onClick={() => void consulta.refetch()}>Reintentar</button>
          </div>
        ) : todos.length === 0 ? (
          <div className="estado-vacio">
            <i className="fa-solid fa-layer-group" aria-hidden="true" /><h2>Tu biblioteca está vacía</h2><p>Tus compras y regalos aparecerán aquí al instante.</p>
            <Link className="btn btn-primary" to="/catalogo">Explorar catálogo</Link>
          </div>
        ) : (
          <>
            <div className="catalog-tools">
              <label className="search-box">
                <i className="fa-solid fa-magnifying-glass" aria-hidden="true" /><span className="visually-hidden">Buscar en mi biblioteca</span>
                <input type="search" placeholder="Buscar en mi biblioteca…" value={texto} onChange={(e) => setTexto(e.target.value)} autoComplete="off" />
              </label>
              <span className="muted small" aria-live="polite">{juegos.length} de {todos.length} juegos</span>
            </div>

            <div className="library-grid">
              {juegos.length === 0 ? <div className="estado-vacio span-all"><h2>Ningún juego coincide</h2></div> : juegos.map((j) => (
                <article key={j.llave} className="library-card">
                  <img src={j.imagen} alt={`Portada de ${j.titulo}`} loading="lazy" onError={imagenRota} />
                  <div className="library-card-body">
                    <h2 className="h6">{j.titulo}</h2>
                    {j.origen === 'REGALO' && (
                      <>
                        <span className="chip-entrega regalo"><i className="fa-solid fa-gift" aria-hidden="true" /> Regalo de {j.de}</span>
                        {j.mensaje && <p className="regalo-mensaje">“{j.mensaje}”</p>}
                      </>
                    )}
                    <span className="library-date">{fecha(j.fecha, 'dd/MM/yyyy')}</span>
                    {j.pedido && <Link className="link-ver" to={`/pedidos/${j.pedido}`}>Pedido {j.pedido}</Link>}
                    <Instalacion j={j} />
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
