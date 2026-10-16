import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EstadoCarga } from '../../core/carga';
import { mensajeError } from '../../core/http-error';
import { dentroDePlazoReembolso } from '../../core/logic/documentos';
import { admiteReembolso } from '../../core/logic/estados';
import { AsistenteService } from '../../core/services/asistente.service';
import { AuthService } from '../../core/services/auth.service';
import { PedidosService } from '../../core/services/pedidos.service';
import { TicketsService } from '../../core/services/tickets.service';
import { ToastService } from '../../core/services/toast.service';
import { textoMinimo } from '../../core/validadores';
import type { AccionAsistente, Pedido, Ticket, TipoTicket } from '../../shared/models';

@Component({
  selector: 'app-soporte',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './soporte.component.html'
})
export class SoporteComponent {
  /** Vienen de la URL (?tipo=REEMBOLSO&pedido=NX-...) cuando se llega desde "Solicitar reembolso". */
  readonly tipo = input<string>();
  readonly pedido = input<string>();

  protected readonly auth = inject(AuthService);
  protected readonly asistente = inject(AsistenteService);
  private readonly ticketsApi = inject(TicketsService);
  private readonly pedidosApi = inject(PedidosService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);

  private readonly chat = viewChild<ElementRef<HTMLElement>>('chat');
  protected readonly mios = new EstadoCarga<Ticket[]>();
  protected readonly misPedidos = signal<readonly Pedido[]>([]);
  protected readonly formAbierto = signal(false);
  protected readonly enviando = signal(false);

  /** Pedidos que aún se pueden reembolsar (pagados o entregados, dentro de los 14 días). */
  protected readonly reembolsables = computed(() => this.misPedidos().filter((p) => admiteReembolso(p.estado) && dentroDePlazoReembolso(p.fecha)));
  protected readonly ultimasSugerencias = computed(() => [...this.asistente.mensajes()].reverse().find((m) => m.rol === 'asistente')?.sugerencias ?? []);

  protected readonly mensajeChat = this.fb.control('', [Validators.maxLength(500)]);
  protected readonly form = this.fb.group({
    tipo: this.fb.control<TipoTicket>('CONSULTA'),
    pedido: [''],
    asunto: ['', [Validators.required, textoMinimo(3), Validators.maxLength(120)]],
    mensaje: ['', [Validators.required, textoMinimo(5), Validators.maxLength(1000)]]
  });

  protected readonly faq: readonly { p: string; r: string }[] = [
    { p: '¿Cuándo puedo instalar mi juego?', r: 'Apenas se aprueba el pago: aparece en Mi biblioteca y desde ahí pulsas Instalar.' },
    { p: '¿Puedo pedir un reembolso?', r: 'Sí, dentro de 14 días desde la compra. Abre un ticket de tipo Reembolso y el equipo lo revisa y aprueba.' },
    { p: '¿Cómo pido factura?', r: 'En el pago elige "Factura", escribe tu RUC, razón social y dirección fiscal. Podrás descargarla en PDF.' },
    { p: '¿Cómo funcionan los regalos?', r: 'Marca el juego como regalo, indica el correo de quien lo recibe y el juego llegará a su biblioteca.' }
  ];

  constructor() {
    if (this.auth.esCliente()) {
      this.cargarMios();
      this.pedidosApi.listar().subscribe({ next: (p) => this.misPedidos.set(p), error: () => undefined });
    }
    // Si llegamos desde "Solicitar reembolso", el formulario se abre ya rellenado.
    effect(() => {
      const t = this.tipo(); const p = this.pedido();
      if (t === 'REEMBOLSO' && p) untracked(() => this.abrirTicket({ tipo: 'ticket', ticketTipo: 'REEMBOLSO', pedido: p }));
    });
    // El chat baja solo hasta el último mensaje.
    effect(() => {
      this.asistente.mensajes(); this.asistente.escribiendo();
      setTimeout(() => { const el = this.chat()?.nativeElement; if (el) el.scrollTop = el.scrollHeight; });
    });
  }

  /** Pedido elegido por enlace que no figura entre los reembolsables (se muestra igual para no perderlo). */
  protected pedidoFueraDeLista(): boolean {
    const v = this.form.controls.pedido.value;
    return !!v && !this.reembolsables().some((p) => p.codigo === v);
  }

  protected cargarMios(): void { this.mios.ejecutar(this.ticketsApi.mios()); }

  protected enviarChat(texto?: string): void {
    const t = (texto ?? this.mensajeChat.value).trim();
    if (!t) return;
    this.asistente.enviar(t);
    this.mensajeChat.reset('');
  }

  protected abrirTicket(accion: AccionAsistente | null = null): void {
    if (!this.auth.logueado()) { this.toast.info('Inicia sesión para abrir un ticket.'); return; }
    this.form.reset({
      tipo: accion?.ticketTipo ?? 'CONSULTA', pedido: accion?.pedido ?? '',
      asunto: accion?.ticketTipo === 'REEMBOLSO' && accion.pedido ? `Reembolso del pedido ${accion.pedido}` : '',
      mensaje: ''
    });
    this.formAbierto.set(true);
    setTimeout(() => document.getElementById('form-ticket')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  }

  protected invalido(c: 'asunto' | 'mensaje'): boolean { const x = this.form.controls[c]; return x.invalid && x.touched; }

  protected enviarTicket(): void {
    const v = this.form.getRawValue();
    if (this.form.invalid || (v.tipo === 'REEMBOLSO' && !v.pedido)) { this.form.markAllAsTouched(); this.toast.error('Completa los campos del ticket.'); return; }
    this.enviando.set(true);
    this.ticketsApi.crear({ asunto: v.asunto.trim(), mensaje: v.mensaje.trim(), tipo: v.tipo, ...(v.tipo === 'REEMBOLSO' ? { pedido: v.pedido } : {}) }).subscribe({
      next: () => { this.enviando.set(false); this.formAbierto.set(false); this.toast.exito('¡Ticket enviado! Te responderemos en "Mis tickets".'); this.cargarMios(); },
      error: (e: unknown) => { this.enviando.set(false); this.toast.error(mensajeError(e)); }
    });
  }
}
