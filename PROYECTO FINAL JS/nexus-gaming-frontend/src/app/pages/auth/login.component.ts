import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { mensajeError } from '../../core/http-error';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { LogoComponent } from '../../shared/components/logo.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LogoComponent, ThemeToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html'
})
export class LoginComponent {
  /** ?volver=/checkout → después de entrar, se regresa a esa página. */
  readonly volver = input<string>();

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly enviando = signal(false);
  protected readonly verClave = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  /** Cuentas de demostración del proyecto (las crea el servidor la primera vez). */
  protected readonly cuentasDemo: readonly { rol: string; icono: string; email: string; password: string }[] = [
    { rol: 'Cliente', icono: 'fa-user', email: 'vanessa@utp.edu.pe', password: 'Cliente2026!' },
    { rol: 'Soporte', icono: 'fa-headset', email: 'soporte@nexusgaming.pe', password: 'Soporte2026!' },
    { rol: 'Administrador', icono: 'fa-user-shield', email: 'admin@nexusgaming.pe', password: 'Admin2026!' }
  ];

  protected usarCuenta(c: { email: string; password: string }): void {
    this.form.setValue({ email: c.email, password: c.password });
    this.error.set(null);
  }

  protected invalido(c: 'email' | 'password'): boolean { const x = this.form.controls[c]; return x.invalid && x.touched; }

  protected entrar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.enviando.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();
    this.auth.iniciarSesion(email.trim().toLowerCase(), password).subscribe({
      next: ({ usuario }) => {
        this.toast.exito(`¡Bienvenido, ${usuario.nombre.split(' ')[0]}!`);
        // El personal va a su panel; el cliente vuelve a donde estaba (solo rutas internas).
        const destino = this.volver();
        const seguro = destino && destino.startsWith('/') && !destino.startsWith('//') ? destino : '/inicio';
        void this.router.navigateByUrl(usuario.rol === 'cliente' ? seguro : '/admin');
      },
      error: (e: unknown) => { this.enviando.set(false); this.error.set(mensajeError(e)); }
    });
  }
}
