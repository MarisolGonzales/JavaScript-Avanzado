import { aCentimos, desglosarIgv, multiplicarSoles, sumarSoles } from './dinero';

describe('dinero (IEEE 754)', () => {
  it('JavaScript suma mal los decimales, nuestras funciones no', () => {
    expect(0.1 + 0.2).not.toBe(0.3);        // 0.30000000000000004 por IEEE 754
    expect(sumarSoles(0.1, 0.2)).toBe(0.3);
  });

  it('convierte soles a céntimos sin perder un céntimo', () => {
    expect(aCentimos(59.9)).toBe(5990);
    expect(aCentimos(1.005)).toBe(101);
    expect(aCentimos(0)).toBe(0);
  });

  it('multiplica precio por cantidad con exactitud', () => {
    expect(multiplicarSoles(79.9, 3)).toBe(239.7);
    expect(multiplicarSoles(19.99, 7)).toBe(139.93);
  });

  it('suma muchos importes sin acumular error', () => {
    const importes = Array.from({ length: 100 }, () => 0.1);
    expect(sumarSoles(...importes)).toBe(10);
  });

  it('desglosa el IGV de un precio que ya lo incluye', () => {
    expect(desglosarIgv(118)).toEqual({ subtotal: 100, igv: 18 });
    const d = desglosarIgv(89.8);
    expect(d).toEqual({ subtotal: 76.1, igv: 13.7 });
    expect(sumarSoles(d.subtotal, d.igv)).toBe(89.8);
  });
});
