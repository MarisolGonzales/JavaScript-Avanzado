'use client';
import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { reserve } from '../lib/http.mjs';
export default function Catalog({ items, readError }) {
  const router = useRouter();
  const [quantities, setQuantities] = useState({});
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [pending, startTransition] = useTransition();
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const visible = items.filter(w => w.title.toLowerCase()
    .includes(search.toLowerCase().trim()));
  async function book(id, seats) {
    if (lock.current || pending || !Number.isInteger(seats) || seats < 1 || seats > 4 || seats > (items.find(w => w.id === id)?.seats ?? 0)) return;
    lock.current = true; setSaving(true);
    setError(''); setConfirmation(null);
    try { setConfirmation(await reserve({ workshopId: id, seats })); }
    catch (e) { setError(`${e.message}. Consulta antes de repetir.`); }
    finally {
      startTransition(() => router.refresh());
      setSaving(false); lock.current = false;
    }
  }
  return <>
    <label>Buscar <input type="search" value={search}
        onChange={e => setSearch(e.target.value)} /></label>
      {!readError && <p>Cupos totales: {items.reduce((n, w) => n + w.seats, 0)}</p>}
      <button disabled={saving || pending}
        onClick={() => startTransition(() => router.refresh())}>Actualizar</button>
      {readError && <p role="alert">Lectura fallida: {readError}</p>}
      {!readError && visible.length === 0 && <p>Sin resultados</p>}
      <div className="tiles">{visible.map(w => <article className="tile" key={w.id}>
        <h2>{w.title}</h2><p>{w.seats} cupos disponibles</p>
        <label>Cupos <select value={quantities[w.id] ?? 1} disabled={saving || pending} onChange={e => setQuantities(q => ({...q, [w.id]: Number(e.target.value)}))}>{[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
      <button disabled={saving || pending || (quantities[w.id] ?? 1) > w.seats}
          onClick={() => book(w.id, quantities[w.id] ?? 1)}>Reservar {quantities[w.id] ?? 1} cupo(s)</button>
      </article>)}</div>
      {(saving || pending) && <p role="status">Procesando...</p>}
      {error && <p role="alert">{error}</p>}
      {confirmation && <p role="status">Reserva {confirmation.id}.
        Saldo al confirmar: {confirmation.remaining}.</p>}
    </>;
}
