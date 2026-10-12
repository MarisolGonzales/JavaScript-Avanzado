import { QR_MAX_BYTES, generarQr } from './qr';

describe('generador de QR', () => {
  it('elige la versión según el largo del texto (21, 25, 29... módulos por lado)', () => {
    expect(generarQr('Yape').length).toBe(21);          // versión 1: hasta 14 bytes
    expect(generarQr('x'.repeat(14)).length).toBe(21);
    expect(generarQr('x'.repeat(15)).length).toBe(25);  // versión 2
    expect(generarQr('x'.repeat(42)).length).toBe(29);  // versión 3
    expect(generarQr('x'.repeat(QR_MAX_BYTES)).length).toBe(41); // versión 6
  });

  it('la matriz es cuadrada y trae los tres buscadores en las esquinas', () => {
    const m = generarQr('Plin | NEXUS GAMING S.A.C. | S/ 59.90');
    const n = m.length;
    expect(m.every((fila) => fila.length === n)).toBeTrue();
    for (const [x, y] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
      expect(m[y][x] && m[y][x + 6] && m[y + 6][x] && m[y + 6][x + 6]).toBeTrue(); // marco 7×7
      expect(m[y + 3][x + 3]).toBeTrue();                                            // centro
      expect(m[y + 1][x + 1]).toBeFalse();                                           // anillo claro
    }
    expect(m[n - 8][8]).toBeTrue(); // módulo oscuro fijo
  });

  it('es determinista y cambia si cambia el texto', () => {
    const a = generarQr('S/ 59.90');
    expect(generarQr('S/ 59.90')).toEqual(a);
    expect(generarQr('S/ 59.91')).not.toEqual(a);
  });

  it('cuenta bytes (no letras) y rechaza lo que no cabe', () => {
    expect(() => generarQr('x'.repeat(QR_MAX_BYTES + 1))).toThrowError(RangeError);
    expect(() => generarQr('ñ'.repeat(54))).toThrowError(RangeError); // 54 letras = 108 bytes en UTF-8
    expect(() => generarQr('ñ'.repeat(53))).not.toThrow();
  });
});
