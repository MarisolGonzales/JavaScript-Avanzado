# NEXUS GAMING · API (Node.js + Express)

```powershell
npm install
npm start          # http://localhost:3000/api   (o  npm run dev  para recargar al guardar)
npm run demo       # datos de ejemplo (clientes, pedidos, tickets)
npm test           # 53 pruebas (reglas de dominio + API completa, driver JSON)
npm run test:pg    # la API completa contra PostgreSQL (requiere ../database instalada)
```

Configuración en `.env` (copia `.env.example`): `PORT`, `CORS_ORIGIN`, `JWT_SECRET`, `DB_DRIVER=json|postgres`, `PG_*` y, opcional, `ANTHROPIC_API_KEY`.

## Arquitectura

```
src/
  domain/      reglas puras (sin base de datos): validación, IGV, RUC/DNI, monto en letras, auth, PDF, asistente
  repos/       json-repo.js (archivo JSON) · pg-repo.js (PostgreSQL + FDW): MISMA interfaz
  routes/      endpoints
  middleware/  autenticación (Bearer) y permisos por rol
scripts/demo.js   datos de demostración
```

Las reglas viven en `domain/` y las usan **ambos** drivers, por eso producen los mismos pedidos y los mismos reportes (se comprobó con los mismos datos).

## Roles y permisos

`cliente` (compra y ve lo suyo) · `soporte` (ve ventas, pedidos y clientes; responde tickets; aprueba reembolsos) · `admin` (todo, incluido catálogo, stock y borrar tickets).

## Endpoints (`/api`)

| Método | Ruta | Quién | Descripción |
|---|---|---|---|
| POST | `/auth/registro` · `/auth/login` | público | Crea cuenta de cliente / inicia sesión (devuelve token) |
| GET | `/auth/yo` | sesión | Cuenta actual |
| PATCH | `/auth/perfil` · POST `/auth/password` | sesión | Nombre, departamento y contraseña |
| GET | `/salud` · `/departamentos` · `/politicas` | público | Estado, lista de departamentos, IGV y plazo de reembolso |
| GET | `/juegos` · `/juegos/:id` | público | Catálogo (cliente: claves de su servidor; admin: desglose por servidor) |
| POST/PUT/DELETE | `/juegos` · `/juegos/:id` · PUT `/admin/stock/:nodo/:id` | admin | Catálogo y stock |
| GET/PUT | `/carrito` | cliente | Carrito persistente |
| POST | `/pedidos` | cliente | Compra (descuenta stock, cobra, emite boleta o factura, entrega claves) |
| GET | `/pedidos` · `/pedidos/:codigo` | dueño / personal | Pedidos (el personal los ve con las claves enmascaradas) |
| GET | `/pedidos/:codigo/comprobante.pdf` | dueño / personal | Comprobante en PDF |
| PATCH | `/pedidos/:codigo/estado` | personal | Cambia el estado (p. ej. REEMBOLSADO) |
| GET | `/biblioteca` | sesión | Mis licencias y regalos recibidos |
| GET | `/admin/reportes` · `/admin/clientes` | personal | Datos del panel |
| POST/GET | `/tickets` · `/tickets/mios` | sesión | Abrir ticket / ver los míos |
| GET/PATCH/POST/DELETE | `/tickets` · `/tickets/:id/responder` · `/tickets/:id/reembolso` · `/tickets/:id` | personal (borrar: admin) | Gestión de tickets |
| POST | `/asistente` | público | Asistente virtual (usa los pedidos del cliente si hay sesión) |

Errores: JSON `{ "error": "mensaje" }` con 400 (datos inválidos), 401 (sin sesión), 403 (sin permiso), 404, 409 (sin claves / estado inválido), 429 (demasiados intentos).
