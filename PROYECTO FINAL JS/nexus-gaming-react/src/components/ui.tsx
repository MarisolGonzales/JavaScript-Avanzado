import { useMemo } from 'react';
import type { SyntheticEvent } from 'react';
import { useTema } from '../context/TemaContext';
import { infoEstado } from '../logic/estados';
import { fecha } from '../logic/fechas';
import { generarQr } from '../logic/qr';
import type { CambioEstado, EstadoPedido } from '../models';

/**
 * COMPONENTES DE PRESENTACIÓN (equivalen a los de shared/components de la versión Angular).
 * Reciben props y devuelven el MISMO HTML y las mismas clases, así se ven igual.
 */

// ---------- Imagen rota → marcador gris ----------
const PLACEHOLDER = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225"><rect width="400" height="225" fill="#14141b"/>' +
  '<text x="50%" y="50%" font-family="Arial" font-size="13" fill="#5c5c68" text-anchor="middle" dominant-baseline="middle">Imagen no disponible</text></svg>',
);

/** onError={imagenRota}: reemplaza una imagen rota por un marcador gris. */
export function imagenRota(e: SyntheticEvent<HTMLImageElement>): void {
  const img = e.currentTarget;
  if (img.src !== PLACEHOLDER) img.src = PLACEHOLDER;
}

// ---------- Logo ----------
export function Logo({ solo = false, tamano = 34 }: { solo?: boolean; tamano?: number }) {
  return (
    <span className="logo">
      <img src="assets/img/nexus-icon.png" alt="" className="logo-icon" style={{ width: tamano, height: tamano }} />
      {!solo && <span className="logo-texto">NEXUS <span>GAMING</span></span>}
    </span>
  );
}

// ---------- Botón de tema ----------
export function ThemeToggle() {
  const { tema, alternar } = useTema();
  return (
    <button type="button" className="btn-icono btn-tema" onClick={alternar}
      aria-label={tema === 'oscuro' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title={tema === 'oscuro' ? 'Tema claro' : 'Tema oscuro'}>
      <i className={`fa-solid ${tema === 'oscuro' ? 'fa-sun' : 'fa-moon'}`} aria-hidden="true" />
    </button>
  );
}

// ---------- Insignia de estado ----------
export function EstadoBadge({ estado }: { estado: EstadoPedido }) {
  const info = infoEstado(estado);
  return (
    <span className={`estado-badge ${info.clase}`}>
      <i className={`fa-solid ${info.icono}`} aria-hidden="true" /> {info.etiqueta}
    </span>
  );
}

// ---------- Stock (equivale a la directiva [appStock]) ----------
export const UMBRAL_STOCK_BAJO = 5;

export function textoStock(unidades: number): string {
  if (unidades <= 0) return 'Agotado';
  if (unidades <= UMBRAL_STOCK_BAJO) return `¡Últimas ${unidades}!`;
  return 'Disponible';
}

/** Clases y atributo que la directiva añadía según las unidades disponibles. */
export function propsStock(unidades: number): { className: string; 'data-stock': string } {
  const nivel = unidades <= 0 ? 'agotado' : unidades <= UMBRAL_STOCK_BAJO ? 'bajo' : 'ok';
  return { className: `stock-pill stock-${nivel}`, 'data-stock': nivel };
}

export function StockPill({ unidades, texto }: { unidades: number; texto?: string | number }) {
  return <span {...propsStock(unidades)}>{texto ?? textoStock(unidades)}</span>;
}

// ---------- Código QR ----------
const MARGEN_QR = 4; // "zona de silencio" que exige el estándar QR

export function Qr({ texto, tamano = 176, color = '#111111', etiqueta = 'Código QR' }: { texto: string; tamano?: number; color?: string; etiqueta?: string }) {
  // useMemo: la matriz (Reed-Solomon) solo se recalcula si cambia el texto.
  const matriz = useMemo(() => generarQr(texto), [texto]);
  const lado = matriz.length + MARGEN_QR * 2;
  const trazo = useMemo(() => {
    const partes: string[] = [];
    matriz.forEach((fila, y) => fila.forEach((oscuro, x) => { if (oscuro) partes.push(`M${x} ${y}h1v1h-1z`); }));
    return partes.join('');
  }, [matriz]);
  return (
    <span className="qr-host">
      <svg className="qr" role="img" aria-label={etiqueta} width={tamano} height={tamano} viewBox={`0 0 ${lado} ${lado}`} shapeRendering="crispEdges">
        <rect width="100%" height="100%" fill="#fff" rx="1.5" />
        <path d={trazo} fill={color} transform={`translate(${MARGEN_QR} ${MARGEN_QR})`} />
      </svg>
    </span>
  );
}

// ---------- Línea de tiempo de estados ----------
export function TimelineEstados({ historial }: { historial: readonly CambioEstado[] }) {
  return (
    <ol className="timeline" aria-label="Historial de estados del pedido">
      {historial.map((c, i) => (
        <li key={i} className={`timeline-item ${i === historial.length - 1 ? 'actual' : ''}`}>
          <span className="timeline-dot"><i className={`fa-solid ${infoEstado(c.estadoNuevo).icono}`} aria-hidden="true" /></span>
          <div>
            <strong>{infoEstado(c.estadoNuevo).etiqueta}</strong>
            {c.comentario && <span className="timeline-nota"> · {c.comentario}</span>}
            <time className="timeline-fecha" dateTime={c.fecha}>{fecha(c.fecha, 'dd/MM/yyyy HH:mm')}</time>
          </div>
        </li>
      ))}
    </ol>
  );
}
