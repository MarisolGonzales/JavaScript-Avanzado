import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastsComponent } from './shared/components/toasts.component';

/** Raíz: solo aloja la página activa. Cada "layout" (tienda o panel) pone su propio marco. */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<router-outlet /><app-toasts />`
})
export class AppComponent {}
