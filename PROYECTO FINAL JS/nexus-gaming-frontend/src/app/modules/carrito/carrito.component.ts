import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, map } from 'rxjs';
import { ItemCarrito } from '../../shared/models/item-carrito.model';
import { Boleta } from '../../shared/models/boleta.model';
import { CarritoService } from '../../core/services/carrito.service';
import { BibliotecaService } from '../../core/services/biblioteca.service';
import { HistorialService } from '../../core/services/historial.service';

type MetodoPago = 'tarjeta' | 'yape' | 'plin';

const NOMBRES_METODO: Record<MetodoPago, string> = {
  tarjeta: 'Tarjeta de crédito/débito',
  yape: 'Yape',
  plin: 'Plin'
};

@Component({
  selector: 'app-carrito',
  templateUrl: './carrito.component.html',
  styleUrl: './carrito.component.scss'
})
export class CarritoComponent implements OnInit {
  items$!: Observable<ItemCarrito[]>;
  total$!: Observable<number>;

  modalAbierto = false;
  pasoExito = false;
  metodoActivo: MetodoPago = 'tarjeta';
  boletaGenerada: Boleta | null = null;

  formTarjeta!: FormGroup;
  formYape!: FormGroup;
  formPlin!: FormGroup;

  constructor(
    private carritoService: CarritoService,
    private bibliotecaService: BibliotecaService,
    private historialService: HistorialService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.items$ = this.carritoService.obtenerCarrito();
    this.total$ = this.items$.pipe(map(items => items.reduce((s, i) => s + i.precio, 0)));

    // Formularios reactivos (Semana 8): cada método de pago valida sus
    // propios campos con Validators declarativos.
    this.formTarjeta = this.fb.group({
      numero: ['', [Validators.required, Validators.pattern(/^[\d\s]{16,19}$/)]],
      nombre: ['', Validators.required],
      exp: ['', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}$/)]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]]
    });

    this.formYape = this.fb.group({
      numero: ['', [Validators.required, Validators.pattern(/^9\d{8}$/)]]
    });

    this.formPlin = this.fb.group({
      numero: ['', [Validators.required, Validators.pattern(/^9\d{8}$/)]]
    });
  }

  quitarItem(index: number): void {
    this.carritoService.quitar(index);
  }

  abrirModalPago(): void {
    if (this.carritoService.obtenerSnapshot().length === 0) {
      alert('No hay productos en el carrito para comprar.');
      return;
    }
    this.pasoExito = false;
    this.modalAbierto = true;
  }

  cerrarModalPago(): void {
    this.modalAbierto = false;
  }

  seleccionarMetodo(metodo: MetodoPago): void {
    this.metodoActivo = metodo;
  }

  formActivo(): FormGroup {
    if (this.metodoActivo === 'tarjeta') return this.formTarjeta;
    if (this.metodoActivo === 'yape') return this.formYape;
    return this.formPlin;
  }

  formatearNumeroTarjeta(): void {
    const control = this.formTarjeta.get('numero');
    if (!control) return;
    const soloDigitos = (control.value || '').replace(/\D/g, '').slice(0, 16);
    const agrupado = soloDigitos.replace(/(.{4})/g, '$1 ').trim();
    control.setValue(agrupado, { emitEvent: false });
  }

  formatearExpiracion(): void {
    const control = this.formTarjeta.get('exp');
    if (!control) return;
    let valor = (control.value || '').replace(/\D/g, '').slice(0, 4);
    if (valor.length > 2) valor = `${valor.slice(0, 2)}/${valor.slice(2)}`;
    control.setValue(valor, { emitEvent: false });
  }

  confirmarPago(): void {
    const formulario = this.formActivo();

    if (formulario.invalid) {
      formulario.markAllAsTouched();
      return;
    }

    const items = this.carritoService.obtenerSnapshot();
    const total = items.reduce((s, i) => s + i.precio, 0);
    const metodoNombre = NOMBRES_METODO[this.metodoActivo];

    this.historialService.registrarCompra(items, total, metodoNombre).subscribe({
      next: (boleta) => {
        this.bibliotecaService.agregarItems(items);
        this.carritoService.vaciar();
        this.boletaGenerada = boleta;
        this.pasoExito = true;
      },
      error: () => {
        alert('No se pudo conectar con el servidor. Verifica que el backend esté corriendo (npm run dev) e inténtalo de nuevo.');
      }
    });
  }
}
