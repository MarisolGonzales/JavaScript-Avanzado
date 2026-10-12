import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { mensajeError } from '../../core/http-error';
import { desglosarIgv } from '../../core/logic/dinero';
import { MONTO_BOLETA_CON_DNI } from '../../core/logic/documentos';
import { formatearTarjeta, formatearVencimiento, numeroOperacion, ultimos4 } from '../../core/logic/validaciones-pago';
import { AuthService } from '../../core/services/auth.service';
import { CarritoService } from '../../core/services/carrito.service';
import { PedidosService } from '../../core/services/pedidos.service';
import { ToastService } from '../../core/services/toast.service';
import { dniObligatorio, dniOpcional, rucValido, tarjetaValida, textoMinimo, vencimientoValido } from '../../core/validadores';
import type { MetodoPago, NuevoPedido, TipoComprobante } from '../../shared/models';
import { QrComponent } from '../../shared/components/qr.component';
import { SolesPipe } from '../../shared/pipes/soles.pipe';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, QrComponent, SolesPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './checkout.component.html'
})
export class CheckoutComponent {
  protected readonly carrito = inject(CarritoService);
  private readonly auth = inject(AuthService);
  private readonly pedidos = inject(PedidosService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);

  // Formularios reactivos TIPADOS (Semana 8). Cada bloque valida lo suyo.
  protected readonly regaloForm = this.fb.group({
    destinatario: ['', [Validators.required, Validators.email, Validators.maxLength(80)]],
    mensaje: ['', Validators.maxLength(200)]
  });
  protected readonly comprobanteForm = this.fb.group({
    tipo: this.fb.control<TipoComprobante>('BOLETA'),
    documento: [''],
    nombre: [this.auth.usuario()?.nombre ?? ''],
    direccion: ['']
  });
  protected readonly tarjetaForm = this.fb.group({
    numero: ['', [Validators.required, tarjetaValida]],
    nombre: ['', [Validators.required, textoMinimo(3)]],
    exp: ['', [Validators.required, vencimientoValido]],
    cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]]
  });

  protected readonly metodo = signal<MetodoPago>('TARJETA');
  protected readonly enviando = signal(false);
  protected readonly intentado = signal(false);
  protected readonly errorEnvio = signal<string | null>(null);
  protected readonly montoDni = MONTO_BOLETA_CON_DNI;

  protected readonly tipo = toSignal(this.comprobanteForm.controls.tipo.valueChanges, { initialValue: 'BOLETA' as TipoComprobante });
  /** Por norma, una boleta de S/ 700 o más debe llevar el DNI del cliente. */
  protected readonly exigeDni = computed(() => this.tipo() === 'BOLETA' && this.carrito.total() >= MONTO_BOLETA_CON_DNI);
  protected readonly desglose = computed(() => desglosarIgv(this.carrito.total()));
  /** Contenido del QR de Yape/Plin: comercio y monto a pagar. Es solo ASCII para no pasar el límite del generador. */
  protected readonly textoQr = computed(() =>
    `${this.metodo() === 'PLIN' ? 'Plin' : 'Yape'} | NEXUS GAMING S.A.C. | S/ ${this.carrito.total().toFixed(2)} | Pago simulado - proyecto academico`);

  protected readonly metodos: readonly { clave: MetodoPago; nombre: string; icono: string }[] = [
    { clave: 'TARJETA', nombre: 'Tarjeta', icono: 'fa-credit-card' },
    { clave: 'YAPE', nombre: 'Yape', icono: 'fa-mobile-screen' },
    { clave: 'PLIN', nombre: 'Plin', icono: 'fa-mobile-screen-button' }
  ];

  constructor() {
    this.aplicarValidadores();
    this.comprobanteForm.controls.tipo.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.aplicarValidadores());
  }

  /** Boleta y factura piden datos distintos, así que los validadores cambian con el tipo elegido. */
  private aplicarValidadores(): void {
    const c = this.comprobanteForm.controls;
    if (this.comprobanteForm.controls.tipo.value === 'FACTURA') {
      c.documento.setValidators([Validators.required, rucValido]);
      c.nombre.setValidators([Validators.required, textoMinimo(3), Validators.maxLength(120)]);
      c.direccion.setValidators([Validators.required, textoMinimo(5), Validators.maxLength(160)]);
      if (!c.nombre.dirty) c.nombre.setValue('');
    } else {
      c.documento.setValidators(this.carrito.total() >= MONTO_BOLETA_CON_DNI ? [dniObligatorio] : [dniOpcional]);
      c.nombre.setValidators([Validators.maxLength(120)]);
      c.direccion.clearValidators();
      if (!c.nombre.dirty) c.nombre.setValue(this.auth.usuario()?.nombre ?? '');
    }
    Object.values(c).forEach((x) => x.updateValueAndValidity({ emitEvent: false }));
  }

  protected error(control: AbstractControl): boolean { return control.invalid && (control.touched || this.intentado()); }

  protected soloDigitos(c: AbstractControl, e: Event, max: number): void {
    c.setValue((e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, max), { emitEvent: false });
  }
  protected formatearNumero(e: Event): void { this.tarjetaForm.controls.numero.setValue(formatearTarjeta((e.target as HTMLInputElement).value), { emitEvent: false }); }
  protected formatearExp(e: Event): void { this.tarjetaForm.controls.exp.setValue(formatearVencimiento((e.target as HTMLInputElement).value), { emitEvent: false }); }

  /** Yape y Plin no piden datos: el cliente paga escaneando el QR y se guarda un número de operación. */
  private formPago(): { form: AbstractControl | null; referencia: string } {
    return this.metodo() === 'TARJETA'
      ? { form: this.tarjetaForm, referencia: ultimos4(this.tarjetaForm.controls.numero.value) }
      : { form: null, referencia: numeroOperacion() };
  }

  protected confirmar(): void {
    if (this.enviando() || this.carrito.items().length === 0) return;
    this.intentado.set(true);
    this.errorEnvio.set(null);

    const { form, referencia } = this.formPago();
    const regalo = this.carrito.hayRegalo();
    form?.markAllAsTouched(); this.comprobanteForm.markAllAsTouched();
    if (regalo) this.regaloForm.markAllAsTouched();
    if (form?.invalid || this.comprobanteForm.invalid || (regalo && this.regaloForm.invalid)) {
      this.toast.error('Revisa los campos marcados en rojo.');
      return;
    }

    const k = this.comprobanteForm.getRawValue();
    const r = this.regaloForm.getRawValue();
    const pedido: NuevoPedido = {
      items: this.carrito.paraApi(),
      pago: { metodo: this.metodo(), referencia },
      comprobante: k.tipo === 'FACTURA'
        ? { tipo: 'FACTURA', documento: k.documento.trim(), nombre: k.nombre.trim(), direccion: k.direccion.trim() }
        : { tipo: 'BOLETA', ...(k.documento.trim() ? { documento: k.documento.trim() } : {}), ...(k.nombre.trim() ? { nombre: k.nombre.trim() } : {}) },
      ...(regalo ? { regalo: { destinatario: r.destinatario.trim(), mensaje: r.mensaje.trim() } } : {})
    };

    this.enviando.set(true);
    this.pedidos.crear(pedido).subscribe({
      next: (p) => {
        this.carrito.vaciar();
        this.toast.exito(`¡Compra exitosa! Pedido ${p.codigo}.`);
        void this.router.navigate(['/pedidos', p.codigo], { queryParams: { nuevo: 1 } });
      },
      error: (err: unknown) => { this.enviando.set(false); this.errorEnvio.set(mensajeError(err)); }
    });
  }
}
