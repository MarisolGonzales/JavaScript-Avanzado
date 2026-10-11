import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { CarritoService } from '../core/services/carrito.service';
import { ToastService } from '../core/services/toast.service';
import { LogoComponent } from '../shared/components/logo.component';
import { ThemeToggleComponent } from '../shared/components/theme-toggle.component';

/** Marco de la TIENDA (lo que ve el cliente): barra superior, contenido y pie. */
@Component({
  selector: 'app-tienda-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LogoComponent, ThemeToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tienda-layout.component.html'
})
export class TiendaLayoutComponent {
  protected readonly auth = inject(AuthService);
  protected readonly carrito = inject(CarritoService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly menuAbierto = signal(false);
  protected readonly menuUsuario = signal(false);
  protected readonly anio = new Date().getFullYear();

  constructor() {
    // En cada navegación se cierran los menús y se vuelve arriba.
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => { this.menuAbierto.set(false); this.menuUsuario.set(false); window.scrollTo({ top: 0 }); });
  }

  /** Clic fuera del menú de usuario → se cierra. */
  @HostListener('document:click', ['$event'])
  protected alHacerClic(e: Event): void {
    const zona = this.host.nativeElement.querySelector('.usuario-zona');
    if (this.menuUsuario() && zona && !zona.contains(e.target as Node)) this.menuUsuario.set(false);
  }

  @HostListener('document:keydown.escape')
  protected alEscape(): void { this.menuUsuario.set(false); this.menuAbierto.set(false); }

  protected salir(): void {
    this.auth.cerrarSesion();
    this.toast.info('Cerraste sesión.');
    void this.router.navigate(['/inicio']);
  }
}
