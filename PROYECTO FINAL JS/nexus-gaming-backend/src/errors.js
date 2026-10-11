/** Error con código HTTP: el middleware final lo convierte en respuesta JSON. */
export class ApiError extends Error {
  constructor(status, mensaje, detalles) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles;
  }
}
export const badRequest = (m, d) => new ApiError(400, m, d);
export const unauthorized = (m = 'Inicia sesión para continuar.') => new ApiError(401, m);
export const forbidden = (m) => new ApiError(403, m);
export const notFound = (m) => new ApiError(404, m);
export const conflict = (m) => new ApiError(409, m);
export const tooMany = (m) => new ApiError(429, m);
