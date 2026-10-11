import { DIAS_REEMBOLSO, MONTO_BOLETA_CON_DNI, dentroDePlazoReembolso, esDni, esRuc } from './documentos';

describe('documentos de identidad', () => {
  it('valida el DNI (8 dígitos)', () => {
    expect(esDni('12345678')).toBeTrue();
    expect(esDni('1234567')).toBeFalse();
    expect(esDni('123456789')).toBeFalse();
    expect(esDni('1234567a')).toBeFalse();
    expect(esDni('')).toBeFalse();
  });

  it('valida el RUC con su dígito de control', () => {
    expect(esRuc('20601234565')).toBeTrue();   // RUC ficticio del emisor
    expect(esRuc('20100070970')).toBeTrue();   // RUC real conocido: el control da 0 (caso "10 → 0")
    expect(esRuc('20601234566')).toBeFalse();  // último dígito equivocado
    expect(esRuc('30601234565')).toBeFalse();  // prefijo inexistente
    expect(esRuc('2060123456')).toBeFalse();   // 10 dígitos
    expect(esRuc('2060123456a')).toBeFalse();
  });

  it('un RUC deja de ser válido si se cambia cualquier dígito', () => {
    const base = '20601234565';
    let aceptados = 0;
    for (let i = 0; i < 10; i++) {
      const cambiado = base.slice(0, i) + String((Number(base[i]) + 1) % 10) + base.slice(i + 1);
      if (esRuc(cambiado)) aceptados++;
    }
    expect(aceptados).toBe(0); // el dígito de control detecta cambios de un solo dígito
  });

  it('las boletas desde S/ 700 piden DNI y el reembolso dura 14 días', () => {
    expect(MONTO_BOLETA_CON_DNI).toBe(700);
    expect(DIAS_REEMBOLSO).toBe(14);
    const ahora = new Date('2026-10-20T12:00:00Z');
    expect(dentroDePlazoReembolso('2026-10-07T12:00:00Z', ahora)).toBeTrue();
    expect(dentroDePlazoReembolso('2026-10-05T12:00:00Z', ahora)).toBeFalse();
  });
});
