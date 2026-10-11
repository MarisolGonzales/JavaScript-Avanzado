import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EstadoCarga } from '../../core/carga';
import { mensajeError } from '../../core/http-error';
import { sumarSoles } from '../../core/logic/dinero';
import { AuthService } from '../../core/services/auth.service';
import { PedidosService } from '../../core/services/pedidos.service';
import { ToastService } from '../../core/services/toast.service';
import { UbicacionService } from '../../core/services/ubicacion.service';
import { passwordSegura, textoMinimo } from '../../core/validadores';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle.component';
import type { Pedido } from '../../shared/models';
import { SolesPipe } from '../../shared/pipes/soles.pipe';
import { ThemeService } from '../../core/services/theme.service';

/** Valida que las dos contraseñas nuevas coincidan (validador de GRUPO, Semana 8). */
const coinciden = (g: AbstractControl): ValidationErrors | null =>
  g.get('nueva')?.value === g.get('confirmar')?.value ? null : { noCoinciden: true };

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, SolesPipe, ThemeToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './perfil.component.html'
})
export class PerfilComponent {
  protected readonly auth = inject(AuthService);
  protected readonly ubicacion = inject(UbicacionService);
  protected readonly theme = inject(ThemeService);
  private readonly pedidosApi = inject(PedidosService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly guardando = signal(false);
  protected readonly cambiandoClave = signal(false);

  protected readonly form = this.fb.group({
    nombre: [this.auth.usuario()?.nombre ?? '', [Validators.required, textoMinimo(2), Validators.maxLength(80)]],
    departamento: [this.auth.usuario()?.departamento ?? 'Lima', Validators.required]
  });
  protected readonly claveForm = this.fb.group({
    actual: ['', Validators.required],
    nueva: ['', [Validators.required, passwordSegura]],
    confirmar: ['', Validators.required]
  }, { validators: coinciden });

  protected readonly pedidos = new EstadoCarga<Pedido[]>();
  protected readonly stats = computed(() => {
    const lista = this.pedidos.datos() ?? [];
    return {
      pedidos: lista.length,
      juegos: lista.filter((p) => p.estado === 'ENTREGADO').reduce((n, p) => n + p.items.length, 0),
      gasto: sumarSoles(...lista.filter((p) => p.estado !== 'REEMBOLSADO').map((p) => p.total))
    };
  });

  constructor() { if (this.auth.esCliente()) this.pedidos.ejecutar(this.pedidosApi.listar()); }

  protected invalido(g: 'form' | 'claveForm', c: string): boolean {
    // Se usa AbstractControl para poder consultar cualquiera de los dos formularios con la misma función.
    const grupo: AbstractControl = g === 'form' ? this.form : this.claveForm;
    const x = grupo.get(c);
    return !!x && x.invalid && x.touched;
  }

  protected guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);
    const { nombre, departamento } = this.form.getRawValue();
    this.auth.actualizarPerfil({ nombre: nombre.trim(), departamento }).subscribe({
      next: () => { this.guardando.set(false); this.toast.exito('Perfil actualizado correctamente.'); },
      error: (e: unknown) => { this.guardando.set(false); this.toast.error(mensajeError(e)); }
    });
  }

  protected cambiarClave(): void {
    if (this.claveForm.invalid) { this.claveForm.markAllAsTouched(); return; }
    this.cambiandoClave.set(true);
    const { actual, nueva } = this.claveForm.getRawValue();
    this.auth.cambiarPassword(actual, nueva).subscribe({
      next: () => { this.cambiandoClave.set(false); this.claveForm.reset(); this.toast.exito('Contraseña actualizada.'); },
      error: (e: unknown) => { this.cambiandoClave.set(false); this.toast.error(mensajeError(e)); }
    });
  }

  protected cerrarSesion(): void {
    if (!confirm('¿Seguro que deseas cerrar sesión?')) return;
    this.auth.cerrarSesion();
    void this.router.navigate(['/inicio']);
  }
}
