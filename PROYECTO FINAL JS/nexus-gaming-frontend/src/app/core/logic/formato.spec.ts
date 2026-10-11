import { abreviar, diaCorto, formatoSoles, hace, iniciales } from './formato';

describe('formato', () => {
  it('formatea soles con miles y decimales', () => {
    expect(formatoSoles(59.9)).toBe('S/ 59.90');
    expect(formatoSoles(1234.5)).toBe('S/ 1,234.50');
    expect(formatoSoles(0)).toBe('S/ 0.00');
    expect(formatoSoles(-12.5)).toBe('-S/ 12.50');
  });
  it('abrevia números para los ejes de los gráficos', () => {
    expect(abreviar(0)).toBe('0'); expect(abreviar(999)).toBe('999'); expect(abreviar(1000)).toBe('1k');
    expect(abreviar(1250)).toBe('1.3k'); expect(abreviar(2_500_000)).toBe('2.5M');
  });
  it('escribe fechas cortas y iniciales', () => {
    expect(diaCorto('2026-10-04')).toBe('04 oct');
    expect(diaCorto('2026-01-31')).toBe('31 ene');
    expect(iniciales('Vanessa Tito Valerio')).toBe('VT');
    expect(iniciales('  ana ')).toBe('A');
    expect(iniciales('')).toBe('?');
  });
  it('dice hace cuánto ocurrió algo', () => {
    const ahora = new Date('2026-10-10T12:00:00Z');
    expect(hace('2026-10-10T11:59:40Z', ahora)).toBe('justo ahora');
    expect(hace('2026-10-10T11:30:00Z', ahora)).toBe('hace 30 min');
    expect(hace('2026-10-10T09:00:00Z', ahora)).toBe('hace 3 h');
    expect(hace('2026-10-09T11:00:00Z', ahora)).toBe('ayer');
    expect(hace('2026-10-06T12:00:00Z', ahora)).toBe('hace 4 días');
  });
});
