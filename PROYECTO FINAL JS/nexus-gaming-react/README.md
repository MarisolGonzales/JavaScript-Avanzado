# NEXUS GAMING · interfaz en React 19

Interfaz de la tienda NEXUS GAMING hecha con **React 19 + TypeScript + Vite**. Usa la **misma API** de `nexus-gaming-backend/`
(Node.js + Express) y **el mismo diseño** que la versión Angular: los estilos de `src/styles/*.scss` son copia exacta de
`nexus-gaming-frontend/src/styles`, y cada página genera el mismo HTML y las mismas clases que su plantilla de Angular.

## Cómo ejecutarlo

```powershell
# desde la carpeta PROYECTO FINAL JS
npm run instalar     # una sola vez: backend + React
npm run demo         # (opcional) datos de ejemplo para el panel
npm run backend      # terminal 1 -> http://localhost:3000/api
npm run react        # terminal 2 -> http://127.0.0.1:5173
```

Vite reenvía `/api` al backend (proxy en `vite.config.ts`), así que no hace falta configurar CORS.
Cuentas: cliente `vanessa@utp.edu.pe` / `Cliente2026!` · soporte `soporte@nexusgaming.pe` / `Soporte2026!` · admin `admin@nexusgaming.pe` / `Admin2026!`.

```powershell
cd nexus-gaming-react
npm test             # 13 pruebas (Vitest + Testing Library)
npm run build        # compila TypeScript y genera dist/
```

## Arquitectura

Esquema visual para presentar: abre [`docs/arquitectura.html`](docs/arquitectura.html) en el navegador.

```
main.tsx  (StrictMode → QueryClientProvider → BrowserRouter → Tema → Toast → Auth → Favoritos → Carrito → Instalaciones → Asistente)
  └─ App.tsx  (Routes + lazy)
       ├─ Login · Registro                (pantalla completa, sin barra)
       ├─ TiendaLayout  (barra superior, pie, <ErrorBoundary>, <Suspense>, <Outlet/>)
       │    └─ pages/  Inicio · Catalogo · JuegoDetalle · Carrito · Checkout · Pedidos · PedidoDetalle
       │               Biblioteca · Favoritos · Logros · Perfil · Soporte · NoEncontrada
       └─ AdminLayout   (barra lateral, migas, campana, <Outlet/>)
            └─ pages/admin/  Dashboard · PedidosAdmin · Clientes · SoporteAdmin · CatalogoAdmin

components/  GameCard (memo) · CampoTexto (useId + useImperativeHandle) · ErrorBoundary (clase)
             RutaProtegida (guards) · Toasts (createPortal) · Graficos (área, dona, barras en SVG)
             ui.tsx (Logo, ThemeToggle, EstadoBadge, StockPill, Qr, TimelineEstados)
context/     Auth · Carrito (+ carritoReducer) · Favoritos · Tema · Toast · Instalaciones · Asistente
hooks/       consultas.ts (TanStack Query) · useConexion (useSyncExternalStore) · useTitulo
api/         http.ts (Axios + interceptores) · contrato.ts (Zod) · servicios.ts (una función por endpoint)
logic/       funciones puras reutilizadas de la versión Angular (dinero, Luhn, RUC, búsqueda, burbuja, QR, instalación…)
styles/      SCSS original de la versión Angular (sin cambios) + react-ajustes.css (3 reglas que en Angular apuntaban a <app-…>)
```

**Flujo de datos:** página → hook (`useQuery`/`useMutation` o contexto) → `servicios.ts` → Axios (token por interceptor)
→ proxy de Vite → API Express → JSON validado con Zod → caché de TanStack Query → la página se vuelve a dibujar.

## Qué concepto de React se usa en cada funcionalidad

| Concepto (laboratorio) | Dónde | Para qué |
|---|---|---|
| Componentes funcionales, props, JSX, listas con `key` | todas las páginas, `GameCard`, `ui.tsx`, `Graficos.tsx` | Interfaz dividida en piezas reutilizables |
| `useState` | formularios (Login, Registro, Perfil, Checkout, tickets), filtros, menús | Estado local de cada componente |
| `useEffect` + limpieza | `Inicio` (carrusel con `setInterval` cada 6 s), `InstalacionesContext` (descargas), `AuthContext` (restaurar sesión con `AbortController`), `CarritoContext` (guardar/sincronizar), `TiendaLayout` (clic fuera / Escape), `Graficos` (`ResizeObserver`) | Efectos secundarios y su limpieza |
| `useReducer` (Lab 13 · Agenda) | `carritoReducer.ts`, `ToastContext` | Carrito: agregar, quitar, regalo, vaciar con reglas de negocio |
| `createContext` + `useContext` (Lab 13 · Preferencias) | 7 contextos | Sesión, carrito, favoritos, tema, avisos, instalaciones y chat compartidos por toda la app |
| `useMemo` / `useCallback` / `memo` (Lab 13 · Catálogo) | `Catalogo`, `Inicio`, `Pedidos`, `Dashboard`, `Qr`, `Graficos`, contextos | Índice de búsqueda, filtros, indicadores derivados; tarjetas que no se redibujan |
| `useDeferredValue` + `useTransition` (Lab 13 · Catálogo) | `Catalogo`, `Biblioteca`, `Soporte`, `PedidosAdmin` | Buscador fluido; cambios no urgentes y acciones asíncronas |
| `useRef` | `CarritoContext` (antirrebote), `InstalacionesContext` (tareas), `Soporte` (caja del chat), `Login`, `Graficos` | Valores que no provocan render y acceso al DOM |
| `useId` + `useImperativeHandle` (Lab 13 · Foco) | `CampoTexto`, `Login`, `Graficos` | Ids únicos y `enfocar()` el correo si el login falla |
| `useLayoutEffect` (Lab 13 · Medición) | `Soporte` | Bajar el scroll del chat antes de pintar |
| `useSyncExternalStore` + `useDebugValue` (Lab 13 · Plataforma) | `useConexion`, `BannerConexion` | Aviso "sin conexión" (solo aparece si se cae internet) |
| `useEffectEvent` (Lab 13 · Avisos) | `AuthContext`, `InstalacionesContext`, `Soporte` | Usar la versión más reciente de una función sin reiniciar el efecto |
| `useActionState` + `useFormStatus` (Lab 13 · Reserva) | `Checkout` | Pago: validación, envío y botón "Procesando…" |
| `useOptimistic` (Lab 13 · Reserva) | `Soporte` (chat), `PedidosAdmin` (aprobar reembolso) | El cambio se ve al instante y se revierte si falla |
| `use(promesa)` + `Suspense` + `ErrorBoundary` (Lab 13 · Recursos) | `PedidoDetalle` | Leer el pedido con carga y error declarativos |
| `lazy` + `Suspense` | `App.tsx`, layouts | Cada página se descarga solo al visitarla |
| Componente de clase | `ErrorBoundary` | Captura errores de render |
| `createPortal` | `Toasts` | Avisos flotantes encima de todo |
| `StrictMode` | `main.tsx` | Detecta efectos sin limpieza en desarrollo |

## Librerías adicionales

| Librería | Uso en el proyecto |
|---|---|
| **React Router 7** | Rutas anidadas, `Outlet`, `NavLink`, `useParams` (detalle), `useSearchParams` (`?volver=`, `?nuevo=`, reembolso), `Navigate` (guards por rol) |
| **TanStack Query 5** (Lab 14) | `useQuery` para catálogo, pedidos, biblioteca, tickets, clientes y reportes; `useMutation` para perfil y tickets; `setQueryData` / `invalidateQueries` tras comprar, responder o reembolsar |
| **Axios** (Lab 14) | Cliente HTTP con interceptores: token `Bearer` y manejo de 401 / timeout / sin red; PDF como `blob` |
| **Zod** (Lab 14) | Contrato de la API: valida juegos, sesión y pedidos antes de usarlos |
| **Bootstrap 5.3** + **Sass** | Mismo CSS base y mismo SCSS que la versión Angular (tema claro/oscuro con `data-theme` y `data-bs-theme`) |
| **Vite** + `@vitejs/plugin-react` | Servidor de desarrollo con proxy `/api` y build |
| **Vitest** + **Testing Library** (Lab 13) | Pruebas del reductor, validaciones, componentes, hooks, carrusel y catálogo |
| Font Awesome (CDN) | Iconos |

## Alcance

Incluye **todas** las pantallas de la versión Angular: tienda (inicio con carrusel, catálogo, detalle, carrito, regalo, pago con
tarjeta/Yape/Plin, boleta/factura, PDF, pedidos, biblioteca con instalación simulada, favoritos, logros, perfil, asistente y tickets)
y panel (resumen con gráficos, pedidos con detalle y reembolso, clientes, soporte y **catálogo y stock**).
