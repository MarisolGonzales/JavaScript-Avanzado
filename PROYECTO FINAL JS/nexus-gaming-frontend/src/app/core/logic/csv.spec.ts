import { aCsv, celdaCsv } from './csv';

describe('exportación a CSV', () => {
  it('deja intactos los valores simples', () => {
    expect(celdaCsv('hola')).toBe('hola'); expect(celdaCsv(12.5)).toBe('12.5');
    expect(celdaCsv(null)).toBe(''); expect(celdaCsv(undefined)).toBe('');
  });
  it('encierra entre comillas lo que tiene coma, comillas o saltos de línea', () => {
    expect(celdaCsv('Lima, Perú')).toBe('"Lima, Perú"');
    expect(celdaCsv('Dijo "hola"')).toBe('"Dijo ""hola"""');
    expect(celdaCsv('línea 1\nlínea 2')).toBe('"línea 1\nlínea 2"');
  });
  it('arma el archivo con BOM, encabezados y filas', () => {
    const csv = aCsv(['Pedido', 'Cliente'], [['NX-1', 'Ana, Torres'], ['NX-2', 'Luis']]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.slice(1)).toBe('Pedido,Cliente\r\nNX-1,"Ana, Torres"\r\nNX-2,Luis');
  });
});
