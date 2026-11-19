import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { abreviar, formatoSoles } from '../logic/formato';

/**
 * GRÁFICOS EN SVG PURO (sin librerías), iguales a los de la versión Angular.
 * Los colores salen de variables CSS, así respetan el tema claro y el oscuro.
 */
export interface PuntoGrafico { readonly etiqueta: string; readonly valor: number }
export interface BarraDato { readonly etiqueta: string; readonly valor: number; readonly detalle?: string }
export interface SegmentoDonut { readonly etiqueta: string; readonly valor: number }

const MARGEN = { izq: 46, der: 14, arr: 14, abajo: 34 };
const ALTO = 270;

/** Gráfico de área: línea suavizada con relleno degradado. */
export function AreaChart({ puntos, prefijoValor = 'S/ ' }: { puntos: readonly PuntoGrafico[]; prefijoValor?: string }) {
  const caja = useRef<HTMLDivElement>(null);
  const [ancho, setAncho] = useState(640);
  const idDegradado = `deg-${useId().replace(/:/g, '')}`;

  // ResizeObserver: el SVG se dibuja al ancho real del contenedor (1:1), así el texto no se deforma.
  useEffect(() => {
    const nodo = caja.current;
    if (!nodo || typeof ResizeObserver === 'undefined') return;
    const observador = new ResizeObserver(([e]) => setAncho(Math.max(300, Math.round(e.contentRect.width))));
    observador.observe(nodo);
    return () => observador.disconnect();
  }, []);

  const { puntosXY, rejilla, linea, area, paso, descripcion } = useMemo(() => {
    const max0 = Math.max(0, ...puntos.map((p) => p.valor));
    const maximo = max0 === 0 ? 100 : (() => { const m = 10 ** Math.floor(Math.log10(max0)); return Math.ceil(max0 / m) * m; })();
    const anchoUtil = ancho - MARGEN.izq - MARGEN.der;
    const altoUtil = ALTO - MARGEN.arr - MARGEN.abajo;
    const xy = puntos.map((p, i) => ({
      etiqueta: p.etiqueta, texto: `${prefijoValor}${p.valor.toFixed(2)}`,
      x: MARGEN.izq + (puntos.length > 1 ? (i / (puntos.length - 1)) * anchoUtil : anchoUtil / 2),
      y: MARGEN.arr + altoUtil - (p.valor / maximo) * altoUtil,
    }));
    const d = xy.reduce((acc, pt, i) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      const prev = xy[i - 1];
      const cx = (prev.x + pt.x) / 2;
      return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
    }, '');
    const base = ALTO - MARGEN.abajo;
    const total = puntos.reduce((s, p) => s + p.valor, 0);
    return {
      puntosXY: xy,
      rejilla: [0, 1, 2, 3, 4].map((i) => ({ y: MARGEN.arr + altoUtil - (i / 4) * altoUtil, texto: i === 0 ? '0' : abreviar((maximo / 4) * i) })),
      linea: d,
      area: xy.length < 2 ? '' : `${d} L ${xy[xy.length - 1].x} ${base} L ${xy[0].x} ${base} Z`,
      paso: Math.max(1, Math.ceil(puntos.length / 7)),
      descripcion: `Gráfico de ventas de ${puntos.length} días. Total: ${prefijoValor}${total.toFixed(2)}.`,
    };
  }, [puntos, ancho, prefijoValor]);

  return (
    <div ref={caja} className="app-area-chart">
      <svg className="grafico" viewBox={`0 0 ${ancho} ${ALTO}`} height={ALTO} role="img" aria-label={descripcion}>
        <defs>
          <linearGradient id={idDegradado} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {rejilla.map((g) => (
          <g key={g.y}>
            <line x1={MARGEN.izq} x2={ancho - MARGEN.der} y1={g.y} y2={g.y} className="grafico-rejilla" />
            <text x={MARGEN.izq - 8} y={g.y + 4} textAnchor="end" className="grafico-eje">{g.texto}</text>
          </g>
        ))}
        {area && (
          <>
            <path d={area} fill={`url(#${idDegradado})`} />
            <path d={linea} className="grafico-linea" fill="none" />
          </>
        )}
        {puntosXY.map((p, i) => (
          <g key={p.etiqueta}>
            <circle cx={p.x} cy={p.y} r="3.4" className="grafico-punto"><title>{`${p.etiqueta}: ${p.texto}`}</title></circle>
            {(i % paso === 0 || i === puntosXY.length - 1) && <text x={p.x} y={ALTO - 10} textAnchor="middle" className="grafico-eje">{p.etiqueta}</text>}
          </g>
        ))}
      </svg>
    </div>
  );
}

/** Barras horizontales comparativas (ingresos por región, juegos más vendidos…). */
export function BarList({ datos, moneda = true }: { datos: readonly BarraDato[]; moneda?: boolean }) {
  const max = Math.max(1, ...datos.map((d) => d.valor));
  return (
    <div className="app-bar-list">
      <ul className="barras">
        {datos.length === 0 ? <li className="muted">Sin datos todavía.</li> : datos.map((d) => {
          const porcentaje = Math.round((d.valor / max) * 100);
          const texto = moneda ? formatoSoles(d.valor) : String(d.valor);
          return (
            <li key={d.etiqueta}>
              <div className="barra-cab"><span>{d.etiqueta}</span><strong>{texto}</strong></div>
              <div className="barra-pista" role="img" aria-label={`${d.etiqueta}: ${texto} (${porcentaje} % del mayor)`}>
                <div className="barra-relleno" style={{ width: `${porcentaje}%` }} />
              </div>
              {d.detalle && <span className="muted small">{d.detalle}</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const CIRCUNFERENCIA = 2 * Math.PI * 64;
const COLORES = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)'];

/** Gráfico de dona: cada segmento es un círculo con trazo parcial (stroke-dasharray). */
export function DonutChart({ segmentos, centro = '', subcentro = '' }: { segmentos: readonly SegmentoDonut[]; centro?: string; subcentro?: string }) {
  const arcos = useMemo(() => {
    const segs = segmentos.filter((s) => s.valor > 0);
    const total = segs.reduce((s, x) => s + x.valor, 0);
    let acumulado = 0;
    return segs.map((s, i) => {
      const largo = (s.valor / total) * CIRCUNFERENCIA;
      const arco = { etiqueta: s.etiqueta, largo, inicio: acumulado, color: COLORES[i % COLORES.length], porcentaje: Math.round((s.valor / total) * 100) };
      acumulado += largo;
      return arco;
    });
  }, [segmentos]);
  const descripcion = `Gráfico de dona: ${arcos.map((a) => `${a.etiqueta} ${a.porcentaje} %`).join(', ')}.`;

  return (
    <div className="app-donut-chart">
      <div className="donut">
        <svg viewBox="0 0 180 180" role="img" aria-label={descripcion} className="donut-svg">
          <circle cx="90" cy="90" r="64" className="donut-fondo" />
          {arcos.map((s) => (
            <circle key={s.etiqueta} cx="90" cy="90" r="64" fill="none" strokeWidth="22" stroke={s.color}
              strokeDasharray={`${s.largo} ${CIRCUNFERENCIA - s.largo}`} strokeDashoffset={-s.inicio}
              transform="rotate(-90 90 90)"><title>{`${s.etiqueta}: ${s.porcentaje} %`}</title></circle>
          ))}
          <text x="90" y="86" textAnchor="middle" className="donut-valor">{centro}</text>
          <text x="90" y="104" textAnchor="middle" className="donut-sub">{subcentro}</text>
        </svg>
        <ul className="donut-leyenda">
          {arcos.map((s) => (
            <li key={s.etiqueta}><span className="punto" style={{ background: s.color }} /><span className="et">{s.etiqueta}</span><strong>{s.porcentaje} %</strong></li>
          ))}
        </ul>
      </div>
    </div>
  );
}
