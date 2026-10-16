import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { esArreglo, guardarJson, leerJson } from '../logic/almacenamiento';
import { Descarga, Instalacion, TareaProgreso, formatoTamano } from '../logic/instalacion';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

export type EstadoInstalacion = 'NO_INSTALADO' | 'DESCARGANDO' | 'PAUSADO' | 'INSTALANDO' | 'INSTALADO';
export interface VistaInstalacion {
  readonly estado: EstadoInstalacion;
  readonly porcentaje: number;
  readonly detalle: string;
}

const TICK_MS = 200;
const NO_INSTALADO: VistaInstalacion = { estado: 'NO_INSTALADO', porcentaje: 0, detalle: '' };
const INSTALADO: VistaInstalacion = { estado: 'INSTALADO', porcentaje: 100, detalle: '' };
const esListaDeTextos = (v: unknown): v is string[] => esArreglo(v) && v.every((x) => typeof x === 'string');

/**
 * INSTALACIONES SIMULADAS de la biblioteca. Vive en la raíz de la app, así que una
 * descarga sigue avanzando aunque el usuario cambie de página.
 * Semana 6: setInterval y el event loop (el temporizador no bloquea la interfaz).
 * Los juegos instalados se recuerdan por usuario en localStorage; una descarga a
 * medias se pierde al recargar, como pasaría en la vida real.
 */
@Injectable({ providedIn: 'root' })
export class InstalacionesService {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  /** Tareas en curso por juego de la biblioteca (llave → descarga o instalación). */
  private readonly tareas = new Map<string, { titulo: string; tarea: TareaProgreso }>();
  private temporizador: ReturnType<typeof setInterval> | null = null;
  private claveAlmacen: string | null = null;

  private readonly instalados = signal<ReadonlySet<string>>(new Set());
  private readonly enCurso = signal<Readonly<Record<string, VistaInstalacion>>>({});

  /** Cuántas descargas o instalaciones están activas (para el aviso del menú). */
  readonly activas = computed(() => Object.keys(this.enCurso()).length);

  constructor() {
    // Al iniciar o cerrar sesión se cargan los juegos instalados de esa cuenta.
    effect(() => {
      const email = this.auth.usuario()?.email ?? null;
      untracked(() => this.cambiarCuenta(email));
    });
  }

  estado(llave: string): VistaInstalacion {
    return this.enCurso()[llave] ?? (this.instalados().has(llave) ? INSTALADO : NO_INSTALADO);
  }

  instalar(llave: string, titulo: string, tamanoGb: number): void {
    if (this.tareas.has(llave) || this.instalados().has(llave)) return;
    this.tareas.set(llave, { titulo, tarea: new Descarga(tamanoGb) });
    this.publicar();
    this.iniciarTemporizador();
    this.toast.info(`Descargando ${titulo} (${formatoTamano(tamanoGb)}).`);
  }

  pausar(llave: string): void { this.cambiarPausa(llave, true); }
  reanudar(llave: string): void { this.cambiarPausa(llave, false); }

  cancelar(llave: string): void {
    const t = this.tareas.get(llave);
    if (!t) return;
    this.tareas.delete(llave);
    this.publicar();
    this.toast.info(`Se canceló la descarga de ${t.titulo}.`);
  }

  desinstalar(llave: string, titulo: string): void {
    this.cambiarInstalados((s) => s.delete(llave));
    this.toast.info(`${titulo} se desinstaló.`);
  }

  jugar(titulo: string): void {
    this.toast.exito(`Iniciando ${titulo}… ¡Que lo disfrutes! (simulación)`);
  }

  /** Olvida los juegos que ya no están en la biblioteca (por ejemplo, un pedido reembolsado). */
  sincronizar(llavesVigentes: readonly string[]): void {
    const vigentes = new Set(llavesVigentes);
    const sobran = [...this.instalados()].filter((l) => !vigentes.has(l));
    if (sobran.length > 0) this.cambiarInstalados((s) => sobran.forEach((l) => s.delete(l)));
    for (const llave of [...this.tareas.keys()]) if (!vigentes.has(llave)) this.tareas.delete(llave);
    this.publicar();
  }

  // ---------- internos ----------

  private cambiarPausa(llave: string, pausada: boolean): void {
    const t = this.tareas.get(llave)?.tarea;
    if (t instanceof Descarga) { t.pausada = pausada; this.publicar(); }
  }

  private iniciarTemporizador(): void {
    if (this.temporizador !== null) return;
    let anterior = Date.now();
    this.temporizador = setInterval(() => {
      const ahora = Date.now();
      this.avanzarTodo(ahora - anterior);
      anterior = ahora;
    }, TICK_MS);
  }

  private detenerTemporizador(): void {
    if (this.temporizador !== null) clearInterval(this.temporizador);
    this.temporizador = null;
  }

  private avanzarTodo(ms: number): void {
    for (const [llave, t] of this.tareas) {
      t.tarea.avanzar(ms);
      if (!t.tarea.terminada) continue;
      if (t.tarea instanceof Descarga) {
        t.tarea = new Instalacion(); // terminó de bajar: ahora se "instala"
      } else {
        this.tareas.delete(llave);
        this.cambiarInstalados((s) => s.add(llave));
        this.toast.exito(`${t.titulo} está listo para jugar.`);
      }
    }
    this.publicar();
  }

  /** Copia el estado de las tareas a la señal que lee la vista. */
  private publicar(): void {
    const vista: Record<string, VistaInstalacion> = {};
    for (const [llave, { tarea }] of this.tareas) {
      const estado: EstadoInstalacion = tarea instanceof Descarga ? (tarea.pausada ? 'PAUSADO' : 'DESCARGANDO') : 'INSTALANDO';
      vista[llave] = { estado, porcentaje: tarea.porcentaje, detalle: tarea.detalle() };
    }
    this.enCurso.set(vista);
    if (this.tareas.size === 0) this.detenerTemporizador();
  }

  private cambiarInstalados(cambio: (s: Set<string>) => void): void {
    const nuevo = new Set(this.instalados());
    cambio(nuevo);
    this.instalados.set(nuevo);
    if (this.claveAlmacen) guardarJson(this.claveAlmacen, [...nuevo]);
  }

  private cambiarCuenta(email: string | null): void {
    this.tareas.clear();
    this.publicar();
    this.claveAlmacen = email ? `nexus_instalados_${email}` : null;
    this.instalados.set(new Set(this.claveAlmacen ? leerJson(this.claveAlmacen, esListaDeTextos, []) : []));
  }
}
