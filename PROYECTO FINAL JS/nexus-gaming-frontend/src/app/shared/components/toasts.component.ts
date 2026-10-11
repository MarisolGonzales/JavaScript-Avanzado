import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toasts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-zona" aria-live="polite" aria-atomic="false">
      @for (t of toasts.toasts(); track t.id) {
        <div class="toast-nx" [class]="'toast-nx toast-' + t.tipo" [attr.role]="t.tipo === 'error' ? 'alert' : 'status'">
          <i class="fa-solid" [class]="t.tipo === 'exito' ? 'fa-circle-check' : t.tipo === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info'" aria-hidden="true"></i>
          <span>{{ t.mensaje }}</span>
          <button type="button" class="toast-cerrar" aria-label="Cerrar aviso" (click)="toasts.cerrar(t.id)">
            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastsComponent {
  protected readonly toasts = inject(ToastService);
}
