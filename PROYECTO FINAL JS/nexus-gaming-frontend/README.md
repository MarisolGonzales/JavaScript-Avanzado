# NEXUS GAMING · Interfaz (Angular 18)

```powershell
npm install
npm start            # http://localhost:4200  (necesita la API en :3000)
npm run build        # compilación de producción en dist/
npm run test:logic   # 68 pruebas unitarias SIN navegador (Node + Jasmine)
npm test             # las mismas pruebas en Chrome (Karma)
```

La URL de la API se cambia en `src/environments/environment.ts`.

```
src/app/
  layouts/        tienda-layout (cliente) · admin-layout (panel de administración y soporte)
  pages/          tienda/ · auth/ (login, registro) · admin/ (resumen, pedidos, clientes, soporte, catálogo)
  core/
    logic/        funciones puras y probadas: dinero (céntimos), ordenamiento, búsqueda, pagos, RUC/DNI, CSV, formato…
    services/     auth, tema, juegos, carrito, pedidos, tickets, asistente, admin, toast (HttpClient + señales)
    interceptors/ auth (Bearer + cierre de sesión si vence)      guards/ por sesión y por rol
  shared/         models, pipes, directiva appStock, componentes y gráficos SVG (área, dona, barras)
src/styles/       tokens (tema oscuro y claro), base, layout, tienda, auth, panel
```

Convenciones: componentes **standalone** con `OnPush`, estado con **señales**, plantillas con `@if` / `@for` / `@switch`,
formularios reactivos **tipados**, `strict` y `strictTemplates` activados.
