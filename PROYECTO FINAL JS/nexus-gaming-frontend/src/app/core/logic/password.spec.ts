import { fuerzaPassword } from './password';

describe('fuerza de contraseña', () => {
  it('vacía no puntúa', () => { expect(fuerzaPassword('').nivel).toBe(0); });
  it('corta es débil aunque tenga variedad', () => {
    expect(fuerzaPassword('Ab1!').nivel).toBeLessThanOrEqual(1);
    expect(fuerzaPassword('abc').etiqueta).not.toBe('Fuerte');
  });
  it('sube con longitud, mayúsculas y símbolos', () => {
    const a = fuerzaPassword('clave1234').nivel;
    const b = fuerzaPassword('Clave1234').nivel;
    const c = fuerzaPassword('Clave1234!Segura').nivel;
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThanOrEqual(b);
    expect(c).toBe(4);
    expect(fuerzaPassword('Clave1234!Segura').etiqueta).toBe('Fuerte');
  });
});
