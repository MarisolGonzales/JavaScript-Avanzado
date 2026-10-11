import { Pipe, PipeTransform } from '@angular/core';
import { formatoSoles } from '../../core/logic/formato';

/**
 * Pipe personalizado PURO (Semana 8): formatea un número como precio en soles.
 * Uso:  {{ juego.price | soles }}  ->  "S/ 59.90"   ·   {{ 4617.8 | soles }}  ->  "S/ 4,617.80"
 */
@Pipe({ name: 'soles', standalone: true })
export class SolesPipe implements PipeTransform {
  transform(valor: number | null | undefined): string {
    if (valor === null || valor === undefined || Number.isNaN(valor)) return 'S/ 0.00';
    return formatoSoles(valor);
  }
}
