# NEXUS GAMING — Angular + Node.js/Express

Migración del proyecto de JavaScript Avanzado (Semanas 5–10) al stack que
pide el sílabo: **Angular** en el frontend y **Node.js con Express** en el
backend (reemplaza a la versión anterior en Spring Boot).

## Estructura

```
NEXUS-GAMING-ANGULAR/
├── nexus-gaming-backend/     API REST en Node.js + Express
└── nexus-gaming-frontend/    Aplicación Angular (CLI, NgModules)
```

## 1. Backend (Node.js + Express)

```bash
cd nexus-gaming-backend
npm install
npm run dev
```

Queda escuchando en **http://localhost:3000**. Los datos se guardan en
`data/db.json` (igual que json-server, mencionado en la Semana 9), así que
persisten aunque reinicies el servidor.

Endpoints disponibles:

| Método | Ruta                          | Descripción                          |
|--------|-------------------------------|---------------------------------------|
| GET    | `/api/juegos`                 | Catálogo completo                     |
| GET    | `/api/juegos/:id`              | Un juego puntual                      |
| GET    | `/api/tickets`                 | Todos los tickets de soporte          |
| POST   | `/api/tickets`                 | Crear un ticket (asunto, mensaje)     |
| PATCH  | `/api/tickets/:id/resolver`    | Marcar un ticket como resuelto        |
| DELETE | `/api/tickets/:id`              | Eliminar un ticket                    |
| GET    | `/api/historial`               | Todas las boletas de compra           |
| POST   | `/api/historial`               | Registrar una nueva boleta            |

## 2. Frontend (Angular)

**El backend debe estar corriendo antes de abrir el frontend**, porque el
catálogo, los tickets y el historial se piden por HTTP.

```bash
cd nexus-gaming-frontend
npm install
npm start
```

Se abre en **http://localhost:4200**.

## Arquitectura del frontend

```
src/app/
├── core/               Servicios singleton (@Injectable) e inyección de dependencias
│   └── services/       JuegosService, CarritoService, AuthService, TicketsService, HistorialService, BibliotecaService
├── shared/             Piezas reutilizables entre módulos
│   ├── models/         Interfaces TypeScript (Juego, Ticket, Boleta, etc.)
│   ├── pipes/           SolesPipe (formatea precios)
│   └── components/      ModalDetalleJuegoComponent
└── modules/            Un módulo por funcionalidad, con lazy loading (loadChildren)
    ├── home/
    ├── catalogo/         búsqueda con hash table (Map) + ordenamiento burbuja
    ├── carrito/          formularios reactivos (Tarjeta / Yape / Plin)
    ├── biblioteca/
    ├── perfil/           formulario reactivo + panel de administrador
    ├── soporte/          formulario reactivo -> POST /api/tickets
    └── historial/        boletas de compra (recibo) -> GET /api/historial
```

## Cómo se ve el rol de administrador

El rol se calcula por el dominio del correo (en **Perfil → Editar
información**): cualquier cuenta que termine en `@nexusgaming.pe` obtiene
acceso de administrador y ve un panel con estadísticas (ingresos totales,
juegos en catálogo, tickets pendientes) y la bandeja de tickets de soporte.
Cualquier otro correo (como tu `@utp.edu.pe`) es un usuario normal.

## Notas para la sustentación

- **Bootstrap** está instalado (`npm install bootstrap`) e importado en
  `src/styles.scss`, junto con el sistema de diseño personalizado (oscuro/violeta).
- El **catálogo** implementa una tabla hash (`Map`) para indexar la búsqueda
  por palabra y el algoritmo de **ordenamiento burbuja** para ordenar los
  resultados por precio — ambos escritos a mano, no con métodos nativos de
  ordenamiento.
- El **carrito y la biblioteca** se guardan en `localStorage` del navegador
  (son datos por sesión/dispositivo); el **catálogo, los tickets y el
  historial** viven en el backend de Express (`data/db.json`).
- Todas las rutas (`/home`, `/catalogo`, `/carrito`, `/biblioteca`,
  `/perfil`, `/soporte`, `/historial`) usan **carga perezosa**
  (`loadChildren`), visible al compilar: cada módulo genera su propio chunk.
