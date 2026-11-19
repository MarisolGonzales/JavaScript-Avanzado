/**
 * Generador de códigos QR (función pura, sin librerías): modo byte, corrección de errores M,
 * versiones 1 a 6 (hasta 106 bytes). Sirve para mostrar el QR de Yape y Plin en el pago.
 *
 * Pasos: texto → bytes → palabras de datos (+ relleno) → Reed-Solomon por bloque → intercalado
 * → matriz con patrones fijos → máscara con menor penalización → bits de formato.
 */

/** Versión → [palabras de datos, palabras de corrección por bloque, bloques, centro del patrón de alineación]. */
const VERSIONES: readonly (readonly [number, number, number, number])[] = [
  [16, 10, 1, 0], [28, 16, 1, 18], [44, 26, 1, 22], [64, 18, 2, 26], [86, 24, 2, 30], [108, 16, 4, 34]
];

export const QR_MAX_BYTES = 106;

type Matriz = boolean[][];

// ---------- Reed-Solomon sobre GF(256), polinomio 0x11D ----------
function multiplicarGf(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function divisorRs(grado: number): number[] {
  const r = new Array<number>(grado).fill(0);
  r[grado - 1] = 1;
  let raiz = 1;
  for (let i = 0; i < grado; i++) {
    for (let j = 0; j < grado; j++) {
      r[j] = multiplicarGf(r[j], raiz);
      if (j + 1 < grado) r[j] ^= r[j + 1];
    }
    raiz = multiplicarGf(raiz, 2);
  }
  return r;
}

function restoRs(datos: readonly number[], divisor: readonly number[]): number[] {
  const r = new Array<number>(divisor.length).fill(0);
  for (const b of datos) {
    const factor = b ^ (r.shift() as number);
    r.push(0);
    divisor.forEach((coef, i) => { r[i] ^= multiplicarGf(coef, factor); });
  }
  return r;
}

// ---------- Datos ----------
function palabrasDeDatos(bytes: Uint8Array, capacidad: number): number[] {
  const bits: number[] = [];
  const poner = (valor: number, n: number): void => { for (let i = n - 1; i >= 0; i--) bits.push((valor >>> i) & 1); };
  poner(0b0100, 4);           // modo byte
  poner(bytes.length, 8);     // cantidad de bytes
  bytes.forEach((b) => poner(b, 8));
  poner(0, Math.min(4, capacidad * 8 - bits.length)); // terminador
  while (bits.length % 8) bits.push(0);
  const palabras: number[] = [];
  for (let i = 0; i < bits.length; i += 8) palabras.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  for (let relleno = 0xec; palabras.length < capacidad; relleno ^= 0xec ^ 0x11) palabras.push(relleno);
  return palabras;
}

/** Divide en bloques, calcula la corrección de cada uno y los intercala (todos los bloques miden igual en v1–6). */
function intercalar(datos: readonly number[], eccPorBloque: number, bloques: number): number[] {
  const largo = datos.length / bloques;
  const divisor = divisorRs(eccPorBloque);
  const partes = Array.from({ length: bloques }, (_, i) => datos.slice(i * largo, (i + 1) * largo));
  const eccs = partes.map((p) => restoRs(p, divisor));
  const salida: number[] = [];
  for (let i = 0; i < largo; i++) partes.forEach((p) => salida.push(p[i]));
  for (let i = 0; i < eccPorBloque; i++) eccs.forEach((e) => salida.push(e[i]));
  return salida;
}

// ---------- Matriz ----------
interface Lienzo { modulos: Matriz; fijo: Matriz; tam: number }

function ponerFijo(l: Lienzo, x: number, y: number, oscuro: boolean): void {
  l.modulos[y][x] = oscuro; l.fijo[y][x] = true;
}

function patronesFijos(l: Lienzo, centroAlineacion: number): void {
  const { tam } = l;
  for (let i = 0; i < tam; i++) { ponerFijo(l, 6, i, i % 2 === 0); ponerFijo(l, i, 6, i % 2 === 0); } // temporización
  for (const [cx, cy] of [[3, 3], [tam - 4, 3], [3, tam - 4]]) {                                      // buscadores + separador
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const x = cx + dx; const y = cy + dy;
      const dist = Math.max(Math.abs(dx), Math.abs(dy));
      if (x >= 0 && x < tam && y >= 0 && y < tam) ponerFijo(l, x, y, dist !== 2 && dist !== 4);
    }
  }
  if (centroAlineacion) {                                                                              // alineación (v2+)
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      ponerFijo(l, centroAlineacion + dx, centroAlineacion + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  }
  for (let i = 0; i < 9; i++) { l.fijo[8][i] = true; l.fijo[i][8] = true; }                           // reserva de formato
  for (let i = 0; i < 8; i++) { l.fijo[8][tam - 1 - i] = true; l.fijo[tam - 1 - i][8] = true; }
  ponerFijo(l, 8, tam - 8, true);                                                                      // módulo oscuro fijo
}

function colocarDatos(l: Lienzo, palabras: readonly number[]): void {
  let i = 0;
  for (let derecha = l.tam - 1; derecha >= 1; derecha -= 2) {
    if (derecha === 6) derecha = 5;
    for (let vert = 0; vert < l.tam; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = derecha - j;
        const sube = ((derecha + 1) & 2) === 0;
        const y = sube ? l.tam - 1 - vert : vert;
        if (!l.fijo[y][x] && i < palabras.length * 8) {
          l.modulos[y][x] = ((palabras[i >>> 3] >>> (7 - (i & 7))) & 1) === 1;
          i++;
        }
      }
    }
  }
}

const MASCARAS: readonly ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => ((((x * y) % 2) + ((x * y) % 3)) % 2) === 0,
  (x, y) => ((((x + y) % 2) + ((x * y) % 3)) % 2) === 0
];

/** Bits de formato (nivel M + máscara) con su código BCH, en las dos copias del QR. */
function ponerFormato(m: Matriz, tam: number, mascara: number): void {
  const datos = (0 << 3) | mascara; // nivel M = 00
  let resto = datos;
  for (let i = 0; i < 10; i++) resto = (resto << 1) ^ ((resto >>> 9) * 0x537);
  const bits = ((datos << 10) | resto) ^ 0x5412;
  const bit = (i: number): boolean => ((bits >>> i) & 1) === 1;
  for (let i = 0; i <= 5; i++) m[i][8] = bit(i);
  m[7][8] = bit(6); m[8][8] = bit(7); m[8][7] = bit(8);
  for (let i = 9; i < 15; i++) m[8][14 - i] = bit(i);
  for (let i = 0; i < 8; i++) m[8][tam - 1 - i] = bit(i);
  for (let i = 8; i < 15; i++) m[tam - 15 + i][8] = bit(i);
}

function penalizacion(m: Matriz, tam: number): number {
  let total = 0;
  const lineas: boolean[][] = [];
  for (let i = 0; i < tam; i++) lineas.push(m[i], m.map((f) => f[i]));
  for (const linea of lineas) {
    let corrida = 1;
    for (let i = 1; i <= tam; i++) {
      if (i < tam && linea[i] === linea[i - 1]) corrida++;
      else { if (corrida >= 5) total += 3 + corrida - 5; corrida = 1; }
    }
    const texto = linea.map((v) => (v ? '1' : '0')).join('');
    for (const p of ['10111010000', '00001011101']) {
      for (let k = texto.indexOf(p); k !== -1; k = texto.indexOf(p, k + 1)) total += 40;
    }
  }
  for (let y = 0; y < tam - 1; y++) for (let x = 0; x < tam - 1; x++) {
    if (m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) total += 3;
  }
  const oscuros = m.reduce((s, f) => s + f.filter(Boolean).length, 0);
  total += Math.max(0, Math.ceil(Math.abs(oscuros * 20 - tam * tam * 10) / (tam * tam)) - 1) * 10;
  return total;
}

/** Devuelve la matriz del QR (`true` = módulo oscuro). Lanza un error si el texto no cabe. */
export function generarQr(texto: string): Matriz {
  const bytes = new TextEncoder().encode(texto);
  const indice = VERSIONES.findIndex(([datos]) => bytes.length <= datos - 2);
  if (indice === -1) throw new RangeError(`El texto supera los ${QR_MAX_BYTES} bytes que admite este generador.`);
  const [capacidad, ecc, bloques, alineacion] = VERSIONES[indice];
  const tam = 17 + 4 * (indice + 1);

  const lienzo: Lienzo = {
    modulos: Array.from({ length: tam }, () => new Array<boolean>(tam).fill(false)),
    fijo: Array.from({ length: tam }, () => new Array<boolean>(tam).fill(false)),
    tam
  };
  patronesFijos(lienzo, alineacion);
  colocarDatos(lienzo, intercalar(palabrasDeDatos(bytes, capacidad), ecc, bloques));

  let mejor: Matriz = lienzo.modulos;
  let menor = Infinity;
  MASCARAS.forEach((regla, numero) => {
    const copia = lienzo.modulos.map((f) => f.slice());
    for (let y = 0; y < tam; y++) for (let x = 0; x < tam; x++) if (!lienzo.fijo[y][x] && regla(x, y)) copia[y][x] = !copia[y][x];
    ponerFormato(copia, tam, numero);
    const p = penalizacion(copia, tam);
    if (p < menor) { menor = p; mejor = copia; }
  });
  return mejor;
}
