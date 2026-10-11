import { IndiceBusqueda, normalizar, tokenizar } from './indice-busqueda';

describe('búsqueda (RegEx + Map)', () => {
  it('normaliza tildes y mayúsculas', () => {
    expect(normalizar('ACCIÓN Épica')).toBe('accion epica');
  });

  it('separa palabras ignorando signos', () => {
    expect(tokenizar('The Witcher 3: Wild Hunt!')).toEqual(['the', 'witcher', '3', 'wild', 'hunt']);
    expect(tokenizar('   ')).toEqual([]);
  });

  const indice = new IndiceBusqueda([
    { id: 1, texto: 'The Witcher 3 RPG Acción' },
    { id: 2, texto: 'Grand Theft Auto V Acción' },
    { id: 3, texto: 'Stardew Valley Simulación' }
  ]);

  it('encuentra por prefijo', () => {
    expect([...indice.buscar('wit')]).toEqual([1]);
    expect([...indice.buscar('STAR')]).toEqual([3]);
  });

  it('ignora las tildes al buscar', () => {
    expect([...indice.buscar('accion')].sort()).toEqual([1, 2]);
    expect([...indice.buscar('simulacion')]).toEqual([3]);
  });

  it('exige TODAS las palabras', () => {
    expect([...indice.buscar('accion witcher')]).toEqual([1]);
    expect(indice.buscar('accion stardew').size).toBe(0);
  });

  it('sin texto devuelve todos y sin coincidencias devuelve vacío', () => {
    expect(indice.buscar('').size).toBe(3);
    expect(indice.buscar('zzz').size).toBe(0);
  });

  it('cuenta las palabras distintas indexadas', () => {
    expect(indice.tamanio).toBeGreaterThan(8);
  });
});
