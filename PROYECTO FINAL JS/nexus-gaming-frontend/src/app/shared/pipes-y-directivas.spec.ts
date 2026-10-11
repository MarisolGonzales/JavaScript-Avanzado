import { UMBRAL_STOCK_BAJO, textoStock } from './directives/stock.directive';
import { EstadoPedidoPipe } from './pipes/estado-pedido.pipe';
import { SolesPipe } from './pipes/soles.pipe';

describe('SolesPipe', () => {
  const pipe = new SolesPipe();
  it('da formato de soles con dos decimales y separador de miles', () => {
    expect(pipe.transform(59.9)).toBe('S/ 59.90');
    expect(pipe.transform(0)).toBe('S/ 0.00');
    expect(pipe.transform(1234.5)).toBe('S/ 1,234.50');
    expect(pipe.transform(4617.8)).toBe('S/ 4,617.80');
    expect(pipe.transform(1234567.891)).toBe('S/ 1,234,567.89');
  });
  it('tolera valores vacíos', () => {
    expect(pipe.transform(null)).toBe('S/ 0.00');
    expect(pipe.transform(undefined)).toBe('S/ 0.00');
    expect(pipe.transform(NaN)).toBe('S/ 0.00');
  });
});

describe('EstadoPedidoPipe', () => {
  it('traduce el estado a texto legible', () => {
    const pipe = new EstadoPedidoPipe();
    expect(pipe.transform('ENTREGADO')).toBe('Entregado');
    expect(pipe.transform('REEMBOLSADO')).toBe('Reembolsado');
    expect(pipe.transform('PENDIENTE')).toBe('Pendiente');
  });
});

describe('textoStock (usado por la directiva appStock)', () => {
  it('clasifica agotado, últimas unidades y disponible', () => {
    expect(textoStock(0)).toBe('Agotado');
    expect(textoStock(-3)).toBe('Agotado');
    expect(textoStock(3)).toBe('¡Últimas 3!');
    expect(textoStock(UMBRAL_STOCK_BAJO)).toContain('Últimas');
    expect(textoStock(UMBRAL_STOCK_BAJO + 1)).toBe('Disponible');
  });
});
