import { Descarga, Instalacion, TareaProgreso, duracionDescarga, formatoTamano, tamanoJuego } from './instalacion';

describe('instalación simulada', () => {
  it('Descarga e Instalacion heredan de TareaProgreso', () => {
    expect(new Descarga(10)).toBeInstanceOf(TareaProgreso);
    expect(new Instalacion()).toBeInstanceOf(TareaProgreso);
  });

  it('avanza con el tiempo y se detiene en 100 %', () => {
    const d = new Descarga(10, 1000);
    d.avanzar(250);
    expect(d.porcentaje).toBe(25);
    expect(d.terminada).toBeFalse();
    d.avanzar(5000);
    expect(d.porcentaje).toBe(100);
    expect(d.terminada).toBeTrue();
  });

  it('en pausa no avanza', () => {
    const d = new Descarga(10, 1000);
    d.pausada = true;
    d.avanzar(500);
    expect(d.porcentaje).toBe(0);
    d.pausada = false;
    d.avanzar(500);
    expect(d.porcentaje).toBe(50);
  });

  it('describe lo descargado y la velocidad', () => {
    const d = new Descarga(2, 2000);
    d.avanzar(1000);
    expect(d.detalle()).toMatch(/^1\.0 GB de 2\.0 GB · \d+ MB\/s$/);
    expect(d.velocidadMBs(1)).toBe(1024);
    d.pausada = true;
    expect(d.detalle()).toBe('1.0 GB de 2.0 GB · En pausa');
  });

  it('conoce el tamaño de los juegos del catálogo y asigna uno fijo a los nuevos', () => {
    expect(tamanoJuego('Elden Ring', 7)).toBe(60);
    expect(tamanoJuego('Stardew Valley', 8)).toBe(0.5);
    expect(tamanoJuego('Juego Nuevo', 11)).toBe(tamanoJuego('Juego Nuevo', 11));
    expect(tamanoJuego('Juego Nuevo', 11)).toBeGreaterThanOrEqual(5);
  });

  it('la duración queda entre 6 y 12 segundos', () => {
    expect(duracionDescarga(0.5)).toBeGreaterThanOrEqual(6000);
    expect(duracionDescarga(500)).toBe(12000);
  });

  it('formatea MB y GB', () => {
    expect(formatoTamano(0.5)).toBe('512 MB');
    expect(formatoTamano(60)).toBe('60.0 GB');
  });
});
