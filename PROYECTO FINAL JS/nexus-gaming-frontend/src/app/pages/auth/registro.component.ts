import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { mensajeError } from '../../core/http-error';
import { fuerzaPassword } from '../../core/logic/password';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { UbicacionService } from '../../core/services/ubicacion.service';
import { passwordSegura, textoMinimo } from '../../core/validadores';
import { LogoComponent } from '../../shared/components/logo.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle.component';

const coinciden = (g: AbstractControl): ValidationErrors | null =>
  g.get('password')?.value === g.get('confirmar')?.value ? null : { noCoinciden: true };

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LogoComponent, ThemeToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './registro.component.html'
})
export class RegistroComponent {
  readonly volver = input<string>();

  protected readonly ubicacion = inject(UbicacionService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly verClave = signal(false);
  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, textoMinimo(2), Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(80)]],
    departamento: ['Lima', Validators.required],
    password: ['', [Validators.required, passwordSegura]],
    confirmar: ['', Validators.required]
  }, { validators: coinciden });

  private readonly clave = toSignal(this.form.controls.password.valueChanges, { initialValue: '' });
  protected readonly fuerza = computed(() => fuerzaPassword(this.clave()));

  protected invalido(c: 'nombre' | 'email' | 'password' | 'confirmar'): boolean { const x = this.form.controls[c]; return x.invalid && x.touched; }

  protected crear(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.enviando.set(true);
    this.error.set(null);
    const { nombre, email, departamento, password } = this.form.getRawValue();
    this.auth.registrar({ nombre: nombre.trim(), email: email.trim().toLowerCase(), departamento, password }).subscribe({
      next: ({ usuario }) => {
        this.toast.exito(`¡Cuenta creada! Bienvenido, ${usuario.nombre.split(' ')[0]}.`);
        const destino = this.volver();
        void this.router.navigateByUrl(destino && destino.startsWith('/') && !destino.startsWith('//') ? destino : '/inicio');
      },
      error: (e: unknown) => { this.enviando.set(false); this.error.set(mensajeError(e)); }
    });
  }
}
