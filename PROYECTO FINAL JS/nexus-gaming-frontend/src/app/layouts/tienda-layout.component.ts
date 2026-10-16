import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { DIAS_REEMBOLSO } from '../core/logic/documentos';
import { AuthService } from '../core/services/auth.service';
import { CarritoService } from '../core/services/carrito.service';
import { InstalacionesService } from '../core/services/instalaciones.service';
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
  protected readonly instalaciones = inject(InstalacionesService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly menuAbierto = signal(false);
  protected readonly menuUsuario = signal(false);
  protected readonly anio = new Date().getFullYear();
  protected readonly diasReembolso = DIAS_REEMBOLSO;
  protected readonly redes: readonly { nombre: string; icono: string; url: string }[] = [
    { nombre: 'Facebook', icono: 'fa-facebook-f', url: 'https://www.facebook.com' },
    { nombre: 'Instagram', icono: 'fa-instagram', url: 'https://www.instagram.com' },
    { nombre: 'X', icono: 'fa-x-twitter', url: 'https://x.com' },
    { nombre: 'YouTube', icono: 'fa-youtube', url: 'https://www.youtube.com' },
    { nombre: 'Discord', icono: 'fa-discord', url: 'https://discord.com' }
  ];

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

  /** "Volver al principio" del pie: sube suave, salvo que el usuario prefiera menos animaciones. */
  protected subir(): void {
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: suave ? 'smooth' : 'auto' });
    document.getElementById('contenido')?.focus({ preventScroll: true });
  }

  protected salir(): void {
    this.auth.cerrarSesion();
    this.toast.info('Cerraste sesión.');
    void this.router.navigate(['/inicio']);
  }
}
