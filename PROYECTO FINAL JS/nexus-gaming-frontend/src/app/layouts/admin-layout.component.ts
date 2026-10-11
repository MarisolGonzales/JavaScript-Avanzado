import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { PanelService } from '../core/services/panel.service';
import { ToastService } from '../core/services/toast.service';
import { LogoComponent } from '../shared/components/logo.component';
import { ThemeToggleComponent } from '../shared/components/theme-toggle.component';

/**
 * Marco del PANEL (lo que ve administración y soporte): barra lateral con las
 * secciones, barra superior con título, tema y notificaciones. Es una interfaz
 * distinta de la tienda: otro diseño, otro menú y acceso solo para el personal.
 */
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LogoComponent, ThemeToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-layout.component.html'
})
export class AdminLayoutComponent {
  protected readonly auth = inject(AuthService);
  protected readonly panel = inject(PanelService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  protected readonly titulo = signal('Panel');
  protected readonly lateralAbierto = signal(false);

  constructor() {
    this.panel.cargarTickets();
    // El título se actualiza al terminar cada navegación (en el constructor la ruta hija aún no está activada).
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => { this.actualizarTitulo(); this.lateralAbierto.set(false); });
  }

  /** El título sale de `data.titulo` de la ruta hija activa. */
  private actualizarTitulo(): void {
    let r = this.ruta;
    while (r.firstChild) r = r.firstChild;
    this.titulo.set((r.snapshot?.data['titulo'] as string | undefined) ?? 'Panel');
  }

  protected salir(): void {
    this.auth.cerrarSesion();
    this.toast.info('Cerraste sesión.');
    void this.router.navigate(['/login']);
  }
}
