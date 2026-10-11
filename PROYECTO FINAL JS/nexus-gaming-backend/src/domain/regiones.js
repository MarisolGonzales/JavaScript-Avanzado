import { badRequest } from '../errors.js';

/**
 * Departamento del cliente → servidor regional que guarda sus pedidos.
 * La partición es didáctica (Semana 9): reparte el país en 3 zonas.
 */
export const DEPARTAMENTOS = {
  Tumbes: 'NORTE', Piura: 'NORTE', Lambayeque: 'NORTE', 'La Libertad': 'NORTE', Cajamarca: 'NORTE',
  Amazonas: 'NORTE', 'San Martín': 'NORTE', Áncash: 'NORTE', Loreto: 'NORTE',
  Arequipa: 'SUR', Moquegua: 'SUR', Tacna: 'SUR', Puno: 'SUR',
  Lima: 'CENTRO', Callao: 'CENTRO', Ica: 'CENTRO', Junín: 'CENTRO', Pasco: 'CENTRO', Huánuco: 'CENTRO',
  Huancavelica: 'CENTRO', Ayacucho: 'CENTRO', Apurímac: 'CENTRO', Cusco: 'CENTRO', Ucayali: 'CENTRO', 'Madre de Dios': 'CENTRO'
};
export const DEPARTAMENTO_POR_DEFECTO = 'Lima';
export const listaDepartamentos = () => Object.keys(DEPARTAMENTOS).sort((a, b) => a.localeCompare(b, 'es'));

/** Devuelve el servidor (NORTE/SUR/CENTRO) que atiende a un departamento. */
export function nodoDeDepartamento(departamento) {
  const nodo = DEPARTAMENTOS[departamento];
  if (!nodo) throw badRequest('Departamento inválido.');
  return nodo;
}
