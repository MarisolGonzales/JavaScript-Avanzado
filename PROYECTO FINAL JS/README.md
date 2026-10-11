# NEXUS GAMING · Proyecto final de JavaScript Avanzado (UTP)

Tienda en línea de **videojuegos digitales** (estilo Steam / Epic Games): el cliente compra una licencia, recibe su clave al instante,
elige **boleta o factura** y descarga el comprobante en **PDF**. Hay **dos interfaces**: la tienda (cliente) y un **panel de
administración y soporte** (estilo dashboard SaaS). Incluye **tema claro y oscuro**.

| Capa | Tecnología | Carpeta |
|---|---|---|
| Interfaz | Angular 18 · standalone · señales · `@if/@for` · Bootstrap 5.3 · TypeScript estricto | `nexus-gaming-frontend/` |
| API | Node.js + Express (ESM) · login con token firmado · PDF con PDFKit | `nexus-gaming-backend/` |
| Datos | JSON (sin instalar nada) **o** PostgreSQL distribuido con `postgres_fdw` | `database/` |

## Cuentas para entrar (demostración)

| Rol | Correo | Contraseña | Qué ve |
|---|---|---|---|
| Cliente | `vanessa@utp.edu.pe` | `Cliente2026!` | La tienda: catálogo, carrito, pago, pedidos, biblioteca, soporte |
| Soporte | `soporte@nexusgaming.pe` | `Soporte2026!` | Panel: resumen, pedidos, clientes, tickets (aprueba reembolsos). No edita el catálogo |
| Administrador | `admin@nexusgaming.pe` | `Admin2026!` | Todo el panel, incluido **Catálogo y stock** |

La pantalla de login tiene botones para rellenar estas cuentas. También se pueden **crear cuentas nuevas** (siempre son de cliente).
Con `npm run demo` se cargan 8 clientes más (contraseña `Cliente2026!`, p. ej. `ana.torres@utp.edu.pe`), ~46 pedidos y tickets, para que el panel no salga vacío.

## Cómo ejecutarlo

**Requisito: Node.js 24 LTS** (`node --version` → `v24.x`). Con Node 20.11 Angular 18 puede negarse a compilar.

```powershell
npm run instalar     # una sola vez: instala backend y frontend
npm run demo         # (opcional) datos de ejemplo para el panel
npm run backend      # terminal 1 -> http://localhost:3000/api
npm run frontend     # terminal 2 -> http://localhost:4200
```

Los datos quedan en `nexus-gaming-backend/data/db.json` (se crea solo; bórralo para reiniciar).

**PostgreSQL distribuido (Semanas 9 y 10), opcional:** instala PostgreSQL 14+, ejecuta `database/instalar.ps1` (o `.sh`), copia
`nexus-gaming-backend/.env.example` como `.env` con `DB_DRIVER=postgres` y repite los pasos de arriba. Detalle en [`database/README.md`](database/README.md).

## Qué puede hacer

**Tienda (cliente)**
- Catálogo con búsqueda instantánea (índice hash con `Map`), filtros y orden (burbuja). Todas las tarjetas tienen el mismo tamaño y la portada completa.
- Compra como **licencia para mi cuenta** o **regalo** (la clave llega a la biblioteca del destinatario).
- Pago con tarjeta (validada con el algoritmo de Luhn), Yape o Plin; **boleta** (DNI opcional, obligatorio desde S/ 700) o **factura** (RUC con dígito de control, razón social, dirección).
- **PDF** del comprobante con logo, datos del emisor, receptor, detalle, IGV y monto en letras.
- Pedidos con línea de tiempo, biblioteca con claves (ver/ocultar/copiar), perfil y cambio de contraseña.
- **Soporte:** asistente virtual (conoce tus pedidos) + tickets con respuesta del equipo + solicitud de reembolso (14 días).

**Panel (administración y soporte)**
- Resumen con indicadores, gráfico de ventas, ventas por categoría y por región, juegos más vendidos, actividad reciente.
- Pedidos (filtros, búsqueda, paginación, detalle, PDF del comprobante, aprobar reembolso, exportar CSV), clientes, tickets, y (solo admin) catálogo y stock por servidor.

## Pruebas

```powershell
npm test                                    # backend: 53 · frontend: 68 pruebas unitarias
cd nexus-gaming-backend ; npm run test:pg   # la API completa contra PostgreSQL: 30
```
Además se recorrió la aplicación compilada de punta a punta (login, compra con factura y regalo, PDF, asistente, reembolso, paneles de soporte y administración, temas): 52 comprobaciones sin fallos.
Ese recorrido y las pruebas de Chrome (`npm run test:ci` del frontend) **no vienen incluidos/ejecutados** en este entregable.

## Mapa del curso

| Sem. | Tema | Dónde verlo |
|---|---|---|
| 1 | Tipos, `if/switch`, bucles, `try-catch`, funciones, eventos | `ordenamiento.ts` (`do-while`), `estados.ts` (`switch`), `almacenamiento.ts` (`try-catch`), eventos en las plantillas |
| 2 | IEEE 754, operadores, *spread*, `Math` | `dinero.ts` (céntimos: `0.1 + 0.2 ≠ 0.3`), Luhn en `validaciones-pago.ts`, `[...lista]` en todo el proyecto |
| 3 | Strings, *template literals*, RegEx | `indice-busqueda.ts`, `validaciones-pago.ts`, `csv.ts`, `password.ts`, `validacion.js` |
| 4 | Arreglos, clases, JSON, `Map`, flechas | `IndiceBusqueda` (clase + `Map`), `JsonRepo` / `PgRepo`, `db.json` |
| 5 | Algoritmos | Burbuja estable, Luhn, RUC (módulo 11), monto en letras, búsqueda por prefijo |
| 6 | Node.js y TypeScript | API Express en Node; `tsconfig` **estricto**; `unknown` + guardias en `almacenamiento.ts`; hash `scrypt` y token firmado con `node:crypto` |
| 7 | Angular CLI, directivas, Bootstrap | `StockDirective` (directiva de atributo), `[ngClass]`/`[ngStyle]`, `@if/@for/@switch`, Bootstrap en `angular.json` |
| 8 | Componentes, rutas, formularios, pipes | Standalone con `input()`/`output()`; rutas lazy con `title`, *guards* por rol y comodín; formularios reactivos tipados con validadores propios; `SolesPipe` |
| 9 | Servicios HTTP · BD distribuidas | `HttpClient` + interceptor funcional; `database/02_central_fdw.sql` (servidores, `USER MAPPING`, `FOREIGN TABLE`), `sp_descontar_stock` |
| 10 | Carrito, pedidos, pagos, replicación | `carrito`/`item_carrito`, `pedido`/`detalle_pedido`/`pago`/`comprobante`, `historial_estados`, triggers `replicar_catalogo_*`, `detalle_logistica_*` |

## Decisiones de diseño

- **Tienda digital, sin sedes:** el cliente nunca elige un servidor. Su **departamento** decide en silencio cuál de los 3 servidores regionales (Norte = Trujillo, Sur = Arequipa, Centro = Cusco) guarda sus pedidos (fragmentación por región). Se cambia en `src/domain/regiones.js`.
- **Catálogo central, claves locales:** el catálogo se replica por triggers; el stock de cada servidor solo se envía al **crear** el juego, para no pisar las ventas.
- **El precio siempre lo decide el servidor.** Los precios incluyen IGV (18 %) y el comprobante lo desglosa.
- **Sin sobreventa:** `sp_descontar_stock` usa `FOR UPDATE`; el driver JSON serializa las transacciones. Hay una prueba con 8 compras simultáneas de 3 claves: se aprueban exactamente 3.
- **Las claves son secretas:** soporte las ve enmascaradas y quien compra un regalo tampoco ve la clave del destinatario.

## Seguridad y alcance (léelo antes de exponer)

Es un **proyecto académico**:
- Hay login real: contraseñas con hash `scrypt` + sal, sesión con token firmado (8 h) y límite de 5 intentos fallidos. El token se guarda en `localStorage` (más simple; un sitio real podría usar cookies `HttpOnly`).
- **Cambia las claves de las cuentas de demostración y define `JWT_SECRET`** (valor largo y aleatorio) antes de publicarlo; con `NODE_ENV=production` el servidor se niega a arrancar con el secreto por defecto.
- **Los pagos son simulados** (nunca se guarda el número de tarjeta; la API lo rechaza). Los comprobantes son **de demostración**: el RUC del emisor es ficticio y no se envían a SUNAT.
- **Asistente con IA (opcional):** con `ANTHROPIC_API_KEY` en `.env` usa un modelo de lenguaje y le envía código, estado y total de los últimos pedidos del cliente. Esa ruta solo se probó con una simulación, no contra la API real. Sin clave funciona el motor local.

## Si algo falla

| Síntoma | Causa probable | Solución |
|---|---|---|
| "No hay conexión con el servidor" | El backend no corre | `npm run backend` |
| `ng` o `tsc` "no se reconoce" / error de motor | Node 20 | Instala Node 24 LTS, terminal nueva, borra `node_modules` y `npm run instalar` |
| "No se pudo conectar a la base nexus_central" | PostgreSQL apagado o sin instalar | Usa `DB_DRIVER=json` o ejecuta `database/instalar.*` |
| Puerto 3000/4200 ocupado | Otro proceso | Cambia `PORT` en `.env` / `ng serve --port 4201` (y `CORS_ORIGIN`) |
| El panel sale vacío | No hay pedidos todavía | `npm run demo` |
