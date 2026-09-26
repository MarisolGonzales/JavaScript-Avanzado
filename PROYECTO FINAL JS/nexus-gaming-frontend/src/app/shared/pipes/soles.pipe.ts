import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe personalizado (Semana 8): formatea un número como precio en soles.
 * Uso en plantilla:  {{ juego.price | soles }}  ->  "S/ 59.90"
 */
@Pipe({
  name: 'soles'
})
export class SolesPipe implements PipeTransform {
  transform(valor: number | null | undefined): string {
    if (valor === null || valor === undefined || isNaN(valor)) {
      return 'S/ 0.00';
    }
    return `S/ ${valor.toFixed(2)}`;
  }
}
