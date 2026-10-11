import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-no-encontrada',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page-body">
      <div class="estado-vacio">
        <i class="fa-solid fa-ghost" aria-hidden="true"></i>
        <h1>404 · Página no encontrada</h1>
        <p>La dirección que buscas no existe o fue movida.</p>
        <a class="btn btn-primary" routerLink="/inicio">Volver al inicio</a>
      </div>
    </section>
  `
})
export class NoEncontradaComponent {}
