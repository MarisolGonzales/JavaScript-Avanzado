import { esArreglo, esObjeto, guardarJson, leerJson } from './almacenamiento';

/** localStorage mínimo para ejecutar sin navegador. */
function instalarAlmacenamientoFalso(): Map<string, string> {
  const datos = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => { datos.set(k, String(v)); },
    removeItem: (k: string) => { datos.delete(k); },
    clear: () => datos.clear(),
    key: () => null,
    get length() { return datos.size; }
  } as Storage;
  return datos;
}

describe('almacenamiento seguro (unknown + guardias)', () => {
  let datos: Map<string, string>;
  beforeEach(() => { datos = instalarAlmacenamientoFalso(); });

  const guardiaNumeros = (v: unknown): v is number[] => esArreglo(v) && v.every((n) => typeof n === 'number');

  it('devuelve el respaldo si la clave no existe', () => {
    expect(leerJson('x', guardiaNumeros, [9])).toEqual([9]);
  });

  it('ida y vuelta de datos válidos', () => {
    guardarJson('x', [1, 2, 3]);
    expect(leerJson('x', guardiaNumeros, [])).toEqual([1, 2, 3]);
  });

  it('descarta JSON corrupto sin lanzar error', () => {
    datos.set('x', '{roto');
    expect(leerJson('x', guardiaNumeros, [0])).toEqual([0]);
  });

  it('descarta datos con forma inesperada (p. ej. manipulados a mano)', () => {
    datos.set('x', JSON.stringify(['uno', 'dos']));
    expect(leerJson('x', guardiaNumeros, [0])).toEqual([0]);
    datos.set('y', JSON.stringify({ a: 1 }));
    expect(leerJson('y', guardiaNumeros, [0])).toEqual([0]);
  });

  it('las guardias distinguen arreglos de objetos', () => {
    expect(esObjeto({})).toBeTrue();
    expect(esObjeto([])).toBeFalse();
    expect(esObjeto(null)).toBeFalse();
    expect(esArreglo([])).toBeTrue();
  });
});
