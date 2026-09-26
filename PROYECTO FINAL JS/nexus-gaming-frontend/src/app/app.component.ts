import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CarritoService } from './core/services/carrito.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  totalCarrito$: Observable<number>;

  constructor(private carritoService: CarritoService) {
    this.totalCarrito$ = this.carritoService.obtenerCarrito().pipe(
      map(items => items.length)
    );
  }
}
