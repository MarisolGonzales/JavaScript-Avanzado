import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { JuegoBiblioteca } from '../../shared/models/juego-biblioteca.model';
import { BibliotecaService } from '../../core/services/biblioteca.service';

@Component({
  selector: 'app-biblioteca',
  templateUrl: './biblioteca.component.html',
  styleUrl: './biblioteca.component.scss'
})
export class BibliotecaComponent implements OnInit {
  biblioteca$!: Observable<JuegoBiblioteca[]>;

  constructor(private bibliotecaService: BibliotecaService) { }

  ngOnInit(): void {
    this.biblioteca$ = this.bibliotecaService.obtenerBiblioteca();
  }

  jugar(titulo: string): void {
    alert(`Iniciando ${titulo}... ¡Que disfrutes la partida!`);
  }
}
