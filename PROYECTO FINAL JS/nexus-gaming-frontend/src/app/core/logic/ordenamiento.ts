/**
 * ORDENAMIENTO BURBUJA (Semana 5: algoritmos con arreglos).
 * Escrito a mano —no con Array.sort— para demostrar el algoritmo: recorre el
 * arreglo comparando pares adyacentes e intercambiándolos hasta que no haga
 * falta ningún cambio. Es estable y no modifica el arreglo original.
 */
export function ordenarBurbuja<T>(lista: readonly T[], comparar: (a: T, b: T) => number): T[] {
  const arreglo = [...lista];            // Spread: copia superficial (Semana 2)
  let n = arreglo.length;
  let huboIntercambio: boolean;
  do {                                    // do-while (Semana 1)
    huboIntercambio = false;
    for (let j = 0; j < n - 1; j++) {
      if (comparar(arreglo[j], arreglo[j + 1]) > 0) {
        [arreglo[j], arreglo[j + 1]] = [arreglo[j + 1], arreglo[j]];
        huboIntercambio = true;
      }
    }
    n--;                                  // el mayor ya quedó al final de cada pasada
  } while (huboIntercambio);
  return arreglo;
}
