const PLACEHOLDER = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225"><rect width="400" height="225" fill="#14141b"/>' +
  '<text x="50%" y="50%" font-family="Arial" font-size="13" fill="#5c5c68" text-anchor="middle" dominant-baseline="middle">Imagen no disponible</text></svg>'
);

/** (error)="imagenRota($event)" -> reemplaza una imagen rota por un marcador gris. */
export function imagenRota(evento: Event): void {
  const img = evento.target as HTMLImageElement;
  img.onerror = null;          // evita un bucle si el marcador también fallara
  img.src = PLACEHOLDER;
}
