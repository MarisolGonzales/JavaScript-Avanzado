import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Marca NEXUS GAMING: ícono + nombre. `solo` muestra únicamente el ícono (barra lateral compacta). */
@Component({
  selector: 'app-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="logo">
      <img src="assets/img/nexus-icon.png" alt="" class="logo-icon" [style.width.px]="tamano()" [style.height.px]="tamano()">
      @if (!solo()) { <span class="logo-texto">NEXUS <span>GAMING</span></span> }
    </span>
  `
})
export class LogoComponent {
  readonly solo = input(false);
  readonly tamano = input(34);
}
