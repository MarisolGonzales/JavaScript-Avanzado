import { ESTADOS_PEDIDO, admiteReembolso, infoEstado } from './estados';

describe('estados del pedido', () => {
  it('todos los estados tienen etiqueta, icono y clase', () => {
    expect(ESTADOS_PEDIDO.length).toBe(4);
    for (const e of ESTADOS_PEDIDO) {
      const i = infoEstado(e);
      expect(i.etiqueta.length).toBeGreaterThan(2);
      expect(i.icono).toMatch(/^fa-/);
      expect(i.clase).toMatch(/^est-/);
    }
  });
  it('solo se reembolsa un pedido pagado o entregado', () => {
    expect(admiteReembolso('PAGADO')).toBeTrue();
    expect(admiteReembolso('ENTREGADO')).toBeTrue();
    expect(admiteReembolso('PENDIENTE')).toBeFalse();
    expect(admiteReembolso('REEMBOLSADO')).toBeFalse();
  });
});
