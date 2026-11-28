# Laboratorio 16 — Vue y Next.js
Node 22.12+ o LTS compatible. Abrir tres terminales desde esta carpeta.

1. `node api/server.mjs` (puerto 3001).
2. `cd vue`, `npm install`, `npm run dev` (http://127.0.0.1:5173).
3. `cd next`, `npm install`, `npm run dev` (http://127.0.0.1:3000).

Pruebas desde raíz: `node --test api/server.test.mjs tests/http.test.mjs`.
Compilación: `npm run build` dentro de cada frontend. Vue: `npm run preview`; Next: `npm start`.

Reto de cantidad 1–4 incorporado en ambas interfaces. Para probar conflicto, abrir ambas, reservar dos cupos de React en una y reservar desde la otra sin actualizar. Debe recibir 409. Reiniciar API restablece cupos. No hay base de datos.

La guía refiere un ZIP de semana 15 no adjunto: se reutilizó la API de semana 14 adaptando su validación para no requerir paquetes; se reconstruyeron manifiestos, estilos y pruebas adicionales según la guía. No se incluye la extensión opcional de ruta de detalle. Las capturas y compilaciones deben verificarse en el equipo del estudiante.
