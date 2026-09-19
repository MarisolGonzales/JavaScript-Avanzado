import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TicketsService } from '../../core/services/tickets.service';

@Component({
  selector: 'app-soporte',
  templateUrl: './soporte.component.html',
  styleUrl: './soporte.component.scss'
})
export class SoporteComponent implements OnInit {
  formSoporte!: FormGroup;
  enviando = false;

  constructor(
    private ticketsService: TicketsService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.formSoporte = this.fb.group({
      asunto: ['', Validators.required],
      mensaje: ['', Validators.required]
    });
  }

  enviarTicket(): void {
    if (this.formSoporte.invalid) {
      this.formSoporte.markAllAsTouched();
      return;
    }

    this.enviando = true;
    const { asunto, mensaje } = this.formSoporte.value;

    this.ticketsService.crear(asunto, mensaje).subscribe({
      next: () => {
        this.enviando = false;
        alert('¡Ticket enviado con éxito! Te responderemos a la brevedad.');
        this.formSoporte.reset();
      },
      error: () => {
        this.enviando = false;
        alert('No se pudo enviar el ticket. Verifica que el backend esté corriendo (npm run dev).');
      }
    });
  }
}
