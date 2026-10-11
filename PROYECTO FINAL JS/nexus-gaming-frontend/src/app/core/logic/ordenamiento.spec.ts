import { ordenarBurbuja } from './ordenamiento';

describe('ordenarBurbuja', () => {
  const porNumero = (a: number, b: number) => a - b;

  it('ordena de menor a mayor', () => {
    expect(ordenarBurbuja([5, 1, 4, 2, 8], porNumero)).toEqual([1, 2, 4, 5, 8]);
  });

  it('no modifica el arreglo original', () => {
    const original = [3, 1, 2];
    const ordenado = ordenarBurbuja(original, porNumero);
    expect(original).toEqual([3, 1, 2]);
    expect(ordenado).not.toBe(original);
  });

  it('maneja vacío, un elemento y ya ordenado', () => {
    expect(ordenarBurbuja([], porNumero)).toEqual([]);
    expect(ordenarBurbuja([7], porNumero)).toEqual([7]);
    expect(ordenarBurbuja([1, 2, 3], porNumero)).toEqual([1, 2, 3]);
  });

  it('es estable: los empates conservan su orden original', () => {
    const lista = [
      { n: 'a', p: 2 }, { n: 'b', p: 1 }, { n: 'c', p: 2 }, { n: 'd', p: 1 }
    ];
    const r = ordenarBurbuja(lista, (x, y) => x.p - y.p).map((x) => x.n);
    expect(r).toEqual(['b', 'd', 'a', 'c']);
  });

  it('da el mismo resultado que Array.sort en 200 arreglos al azar', () => {
    let semilla = 12345;
    const azar = () => (semilla = (semilla * 1103515245 + 12345) % 2147483648) % 100;
    for (let t = 0; t < 200; t++) {
      const arr = Array.from({ length: (t % 25) + 1 }, azar);
      expect(ordenarBurbuja(arr, porNumero)).toEqual([...arr].sort(porNumero));
    }
  });
});
