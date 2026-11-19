import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { mensajeError } from '../../api/http';
import { adminApi } from '../../api/servicios';
import { imagenRota, StockPill } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { useJuegos } from '../../hooks/consultas';
import { useTitulo } from '../../hooks/useTitulo';
import { formatoSoles } from '../../logic/formato';
import { textoMinimo } from '../../logic/validaciones-form';
import type { CodigoNodo, Juego, JuegoEditable } from '../../models';

const SERVIDORES: readonly { codigo: CodigoNodo; etiqueta: string }[] = [
  { codigo: 'NORTE', etiqueta: 'Norte' }, { codigo: 'SUR', etiqueta: 'Sur' }, { codigo: 'CENTRO', etiqueta: 'Centro' },
];
const VACIO = { title: '', price: '0', category: '', description: '', image: 'assets/img/nexus-icon.png', developer: '', year: '', stockInicial: '25' };
type FormJuego = typeof VACIO;

/** Reglas del formulario de juego (las mismas del servidor). */
function erroresJuego(f: FormJuego, nuevo: boolean) {
  const precio = Number(f.price);
  const anio = f.year === '' ? null : Number(f.year);
  const stock = Number(f.stockInicial);
  return {
    title: !textoMinimo(f.title, 2) || f.title.length > 120,
    price: f.price === '' || !Number.isFinite(precio) || precio < 0 || precio > 9999,
    category: !textoMinimo(f.category, 2) || f.category.length > 40,
    year: anio !== null && (!Number.isFinite(anio) || anio < 1970 || anio > 2100),
    stockInicial: nuevo && (f.stockInicial === '' || !Number.isFinite(stock) || stock < 0 || stock > 100000),
  };
}

/**
 * CATÁLOGO Y STOCK (solo administración): alta, edición y baja de juegos, y licencias por servidor regional.
 * El borrador de stock es un estado local (useState) que se compara con lo que vino del servidor.
 */
export function CatalogoAdmin() {
  useTitulo('Catálogo y stock · Panel NEXUS');
  const datos = useJuegos();
  const cache = useQueryClient();
  const toast = useToast();
  const [editando, setEditando] = useState<number | 'nuevo' | null>(null);
  const [form, setForm] = useState<FormJuego>(VACIO);
  const [tocados, setTocados] = useState(false);
  const [borradorStock, setBorradorStock] = useState<Readonly<Record<string, number>>>({});
  const [texto, setTexto] = useState('');

  const filtrados = useMemo(() => {
    const t = texto.trim().toLowerCase();
    return (datos.data ?? []).filter((j) => !t || j.title.toLowerCase().includes(t) || j.category.toLowerCase().includes(t));
  }, [datos.data, texto]);

  const recargar = () => cache.invalidateQueries({ queryKey: ['juegos'] });

  // ----- stock por servidor regional -----
  const stock = (j: Juego, nodo: CodigoNodo): number => borradorStock[`${j.id}-${nodo}`] ?? j.stockPorNodo?.[nodo] ?? 0;
  const total = (j: Juego): number => SERVIDORES.reduce((s, x) => s + stock(j, x.codigo), 0);
  const hayCambios = (j: Juego): boolean => SERVIDORES.some((s) => stock(j, s.codigo) !== (j.stockPorNodo?.[s.codigo] ?? 0));
  const editarStock = (j: Juego, nodo: CodigoNodo, valor: string) => {
    const n = Math.max(0, Math.trunc(Number(valor) || 0));
    setBorradorStock((b) => ({ ...b, [`${j.id}-${nodo}`]: n }));
  };

  async function guardarStock(j: Juego) {
    const cambios = SERVIDORES.filter((s) => stock(j, s.codigo) !== (j.stockPorNodo?.[s.codigo] ?? 0));
    if (!cambios.length) return;
    try {
      await Promise.all(cambios.map((s) => adminApi.ajustarStock(s.codigo, j.id, stock(j, s.codigo))));
      setBorradorStock((b) => Object.fromEntries(Object.entries(b).filter(([k]) => !k.startsWith(`${j.id}-`))));
      toast.exito(`Stock de ${j.title} actualizado.`);
      void recargar();
    } catch (e) {
      toast.error(mensajeError(e));
    }
  }

  // ----- alta, edición y baja -----
  const nuevo = () => { setForm(VACIO); setTocados(false); setEditando('nuevo'); };
  const editar = (j: Juego) => {
    setForm({ title: j.title, price: String(j.price), category: j.category, description: j.description, image: j.image, developer: j.developer ?? '', year: j.year === null ? '' : String(j.year), stockInicial: '25' });
    setTocados(false);
    setEditando(j.id);
  };
  const errores = erroresJuego(form, editando === 'nuevo');
  const invalido = (c: keyof typeof errores) => tocados && errores[c];
  const campo = (k: keyof FormJuego) => ({ value: form[k], onChange: (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value })) });

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (Object.values(errores).some(Boolean)) { setTocados(true); return; }
    const datosJuego: JuegoEditable = {
      title: form.title, price: Number(form.price), category: form.category, description: form.description, image: form.image,
      developer: form.developer, year: form.year === '' ? null : Number(form.year), stockInicial: Number(form.stockInicial),
    };
    const id = editando;
    try {
      let j: Juego;
      if (id === 'nuevo') j = await adminApi.crearJuego(datosJuego);
      else { const { stockInicial: _omitido, ...catalogo } = datosJuego; void _omitido; j = await adminApi.actualizarJuego(id as number, catalogo); }
      toast.exito(id === 'nuevo' ? `${j.title} se creó y se replicó a los 3 servidores.` : `${j.title} se actualizó (las licencias de cada servidor se conservan).`);
      setEditando(null);
      void recargar();
    } catch (err) {
      toast.error(mensajeError(err));
    }
  }

  async function baja(j: Juego) {
    if (!window.confirm(`¿Dar de baja "${j.title}"? Los pedidos anteriores se conservan.`)) return;
    try {
      await adminApi.eliminarJuego(j.id);
      toast.exito(`${j.title} se dio de baja.`);
      void recargar();
    } catch (e) {
      toast.error(mensajeError(e));
    }
  }

  return (
    <>
      <div className="dash-cab">
        <div><h1 className="dash-titulo">Catálogo y stock</h1><p className="muted">Cada servidor regional administra sus propias licencias; el catálogo se replica a los tres.</p></div>
        <button type="button" className="btn btn-primary btn-sm" onClick={nuevo}><i className="fa-solid fa-plus" aria-hidden="true" /> Nuevo juego</button>
      </div>

      {editando !== null && (
        <form className="tarjeta" onSubmit={guardar} noValidate aria-labelledby="t-form-juego">
          <h2 id="t-form-juego" className="tarjeta-titulo">{editando === 'nuevo' ? 'Nuevo juego' : 'Editar juego'}</h2>
          <p className="muted small">Al guardar, el catálogo se replica a los 3 servidores. Editar un juego <strong>no pisa</strong> las licencias de cada servidor.</p>
          <div className="form-fila">
            <div className="form-group"><label htmlFor="j-title">Título</label><input id="j-title" className={invalido('title') ? 'invalido' : undefined} {...campo('title')} />{invalido('title') && <p className="msg-error">Título de 2 a 120 caracteres.</p>}</div>
            <div className="form-group"><label htmlFor="j-price">Precio (S/)</label><input id="j-price" type="number" step="0.01" min="0" className={invalido('price') ? 'invalido' : undefined} {...campo('price')} />{invalido('price') && <p className="msg-error">Precio entre 0 y 9999.</p>}</div>
          </div>
          <div className="form-fila">
            <div className="form-group"><label htmlFor="j-cat">Categoría</label><input id="j-cat" className={invalido('category') ? 'invalido' : undefined} {...campo('category')} />{invalido('category') && <p className="msg-error">Categoría requerida.</p>}</div>
            <div className="form-group"><label htmlFor="j-dev">Desarrollador</label><input id="j-dev" {...campo('developer')} /></div>
          </div>
          <div className="form-group"><label htmlFor="j-desc">Descripción</label><textarea id="j-desc" rows={3} {...campo('description')} /></div>
          <div className="form-fila">
            <div className="form-group"><label htmlFor="j-img">Ruta de imagen</label><input id="j-img" {...campo('image')} /></div>
            <div className="form-group"><label htmlFor="j-year">Año</label><input id="j-year" type="number" className={invalido('year') ? 'invalido' : undefined} {...campo('year')} /></div>
            {editando === 'nuevo' && <div className="form-group"><label htmlFor="j-stock">Licencias iniciales por servidor</label><input id="j-stock" type="number" min="0" className={invalido('stockInicial') ? 'invalido' : undefined} {...campo('stockInicial')} /></div>}
          </div>
          <div className="acciones"><button type="submit" className="btn btn-primary">Guardar</button><button type="button" className="btn btn-secondary" onClick={() => setEditando(null)}>Cancelar</button></div>
        </form>
      )}

      <div className="catalog-tools">
        <label className="search-box"><i className="fa-solid fa-magnifying-glass" aria-hidden="true" /><span className="visually-hidden">Buscar juegos</span>
          <input type="search" placeholder="Buscar juego o categoría…" value={texto} onChange={(e) => setTexto(e.target.value)} autoComplete="off" /></label>
      </div>

      {datos.isError ? (
        <div className="banner-error en-panel" role="alert">{mensajeError(datos.error)} <button type="button" className="btn-link" onClick={() => void datos.refetch()}>Reintentar</button></div>
      ) : (
        <div className="tabla-scroll">
          <table className="tabla-nx tabla-filas">
            <thead><tr><th scope="col">Juego</th><th scope="col">Precio</th>
              {SERVIDORES.map((s) => <th key={s.codigo} scope="col">Licencias {s.etiqueta}</th>)}
              <th scope="col">Total</th><th scope="col"><span className="visually-hidden">Acciones</span></th></tr></thead>
            <tbody>
              {filtrados.length === 0 ? <tr><td colSpan={7} className="muted text-center">{datos.isPending ? 'Cargando…' : 'No hay juegos.'}</td></tr> : filtrados.map((j) => (
                <tr key={j.id}>
                  <td><div className="celda-usuario"><img className="miniatura" src={j.image} alt="" onError={imagenRota} /><div><strong>{j.title}</strong><br /><small className="muted">{j.category}</small></div></div></td>
                  <td>{formatoSoles(j.price)}</td>
                  {SERVIDORES.map((s) => (
                    <td key={s.codigo}><input className="input-stock" type="number" min="0" value={stock(j, s.codigo)} onChange={(e) => editarStock(j, s.codigo, e.target.value)} aria-label={`Licencias de ${j.title} en el servidor ${s.etiqueta}`} /></td>
                  ))}
                  <td><StockPill unidades={total(j)} texto={total(j)} /></td>
                  <td className="acciones">
                    <button type="button" className="btn btn-primary btn-sm" disabled={!hayCambios(j)} onClick={() => void guardarStock(j)}>Guardar stock</button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => editar(j)}>Editar</button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => void baja(j)}>Baja</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
