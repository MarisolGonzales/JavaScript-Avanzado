import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Boleta } from '../../shared/models/boleta.model';
import { HistorialService } from '../../core/services/historial.service';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.component.html',
  styleUrl: './historial.component.scss'
})
export class HistorialComponent implements OnInit {
  historial$!: Observable<Boleta[]>;

  constructor(private historialService: HistorialService) { }

  ngOnInit(): void {
    this.historial$ = this.historialService.obtenerTodas();
  }
}
