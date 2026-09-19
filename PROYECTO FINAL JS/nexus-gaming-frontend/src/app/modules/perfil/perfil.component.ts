import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService, PerfilUsuario } from '../../core/services/auth.service';
import { BibliotecaService } from '../../core/services/biblioteca.service';
import { JuegosService } from '../../core/services/juegos.service';
import { HistorialService } from '../../core/services/historial.service';
import { TicketsService } from '../../core/services/tickets.service';
import { Ticket } from '../../shared/models/ticket.model';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss'
})
export class PerfilComponent implements OnInit {
  perfil!: PerfilUsuario;
  totalJuegosBiblioteca = 0;
  formPerfil!: FormGroup;

  // Panel de administrador (solo visible si perfil.rol === 'admin')
  totalJuegosCatalogo = 0;
  ingresosTotales = 0;
  tickets: Ticket[] = [];

  constructor(
    private authService: AuthService,
    private bibliotecaService: BibliotecaService,
    private juegosService: JuegosService,
    private historialService: HistorialService,
    private ticketsService: TicketsService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.perfil = this.authService.obtenerPerfilActual();

    this.formPerfil = this.fb.group({
      nombre: [this.perfil.nombre, Validators.required],
      email: [this.perfil.email, [Validators.required, Validators.email]]
    });

    this.bibliotecaService.obtenerBiblioteca().subscribe(biblioteca => {
      this.totalJuegosBiblioteca = biblioteca.length;
    });

    if (this.perfil.rol === 'admin') {
      this.cargarPanelAdmin();
    }
  }

  get inicialAvatar(): string {
    return (this.perfil?.nombre || '?').trim().charAt(0).toUpperCase();
  }

  guardarCambios(): void {
    if (this.formPerfil.invalid) {
      this.formPerfil.markAllAsTouched();
      return;
    }

    const { nombre, email } = this.formPerfil.value;
    const rolAnterior = this.perfil.rol;

    this.perfil = this.authService.actualizarPerfil(nombre, email);

    if (this.perfil.rol === 'admin' && rolAnterior !== 'admin') {
      alert('¡Perfil actualizado! Ahora tienes acceso de administrador.');
      this.cargarPanelAdmin();
    } else {
      alert('¡Perfil actualizado correctamente!');
    }
  }

  cerrarSesion(): void {
    if (!confirm('¿Seguro que deseas cerrar sesión?')) return;
    this.authService.cerrarSesion();
    window.location.href = '/home';
  }

  private cargarPanelAdmin(): void {
    this.juegosService.obtenerTodos().subscribe(juegos => {
      this.totalJuegosCatalogo = juegos.length;
    });

    this.historialService.obtenerTodas().subscribe(historial => {
      this.ingresosTotales = historial.reduce((suma, boleta) => suma + boleta.total, 0);
    });

    this.cargarTickets();
  }

  private cargarTickets(): void {
    this.ticketsService.obtenerTodos().subscribe(tickets => {
      this.tickets = tickets.filter(t => !t.resuelto);
    });
  }

  resolverTicket(id: number): void {
    this.ticketsService.marcarResuelto(id).subscribe(() => this.cargarTickets());
  }
}
