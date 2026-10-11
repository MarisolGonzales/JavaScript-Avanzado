import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';

/** Botón para alternar entre tema claro y oscuro (se recuerda la elección). */
@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="btn-icono btn-tema" (click)="theme.alternar()"
            [attr.aria-label]="theme.tema() === 'oscuro' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'"
            [attr.title]="theme.tema() === 'oscuro' ? 'Tema claro' : 'Tema oscuro'">
      <i class="fa-solid" [class]="theme.tema() === 'oscuro' ? 'fa-sun' : 'fa-moon'" aria-hidden="true"></i>
    </button>
  `
})
export class ThemeToggleComponent {
  protected readonly theme = inject(ThemeService);
}
