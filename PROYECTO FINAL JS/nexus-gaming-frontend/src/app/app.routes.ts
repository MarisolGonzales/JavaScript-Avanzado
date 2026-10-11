import { Routes } from '@angular/router';
import { adminGuard, authGuard, clienteGuard, invitadoGuard, staffGuard } from './core/guards/guards';

/**
 * Rutas con carga perezosa por componente (Semana 8): cada página es un "chunk" que
 * solo se descarga al visitarla. `title` actualiza la pestaña del navegador; los
 * *guards* protegen según la sesión y el rol; la ruta comodín (**) va al final
 * porque el router usa la primera coincidencia.
 *
 * Hay DOS interfaces: la TIENDA (cliente) y el PANEL (administración y soporte).
 */
export const routes: Routes = [
  // ---------- Acceso ----------
  { path: 'login', title: 'Ingresar · NEXUS GAMING', canActivate: [invitadoGuard], loadComponent: () => import('./pages/auth/login.component').then((m) => m.LoginComponent) },
  { path: 'registro', title: 'Crear cuenta · NEXUS GAMING', canActivate: [invitadoGuard], loadComponent: () => import('./pages/auth/registro.component').then((m) => m.RegistroComponent) },

  // ---------- Panel de administración / soporte ----------
  {
    path: 'admin',
    canActivate: [staffGuard],
    loadComponent: () => import('./layouts/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      { path: '', title: 'Resumen · Panel NEXUS', data: { titulo: 'Resumen' }, loadComponent: () => import('./pages/admin/dashboard.component').then((m) => m.DashboardComponent) },
      { path: 'pedidos', title: 'Pedidos · Panel NEXUS', data: { titulo: 'Pedidos' }, loadComponent: () => import('./pages/admin/pedidos-admin.component').then((m) => m.PedidosAdminComponent) },
      { path: 'clientes', title: 'Clientes · Panel NEXUS', data: { titulo: 'Clientes' }, loadComponent: () => import('./pages/admin/clientes.component').then((m) => m.ClientesComponent) },
      { path: 'soporte', title: 'Soporte · Panel NEXUS', data: { titulo: 'Soporte' }, loadComponent: () => import('./pages/admin/soporte-admin.component').then((m) => m.SoporteAdminComponent) },
      { path: 'catalogo', title: 'Catálogo y stock · Panel NEXUS', data: { titulo: 'Catálogo y stock' }, canActivate: [adminGuard], loadComponent: () => import('./pages/admin/catalogo-admin.component').then((m) => m.CatalogoAdminComponent) }
    ]
  },

  // ---------- Tienda (cliente) ----------
  {
    path: '',
    loadComponent: () => import('./layouts/tienda-layout.component').then((m) => m.TiendaLayoutComponent),
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      { path: 'inicio', title: 'Inicio · NEXUS GAMING', loadComponent: () => import('./pages/tienda/inicio.component').then((m) => m.InicioComponent) },
      { path: 'catalogo', title: 'Catálogo · NEXUS GAMING', loadComponent: () => import('./pages/tienda/catalogo.component').then((m) => m.CatalogoComponent) },
      { path: 'juego/:id', title: 'Detalle del juego · NEXUS GAMING', loadComponent: () => import('./pages/tienda/juego-detalle.component').then((m) => m.JuegoDetalleComponent) },
      { path: 'carrito', title: 'Carrito · NEXUS GAMING', loadComponent: () => import('./pages/tienda/carrito.component').then((m) => m.CarritoComponent) },
      { path: 'checkout', title: 'Finalizar compra · NEXUS GAMING', canActivate: [authGuard, clienteGuard], loadComponent: () => import('./pages/tienda/checkout.component').then((m) => m.CheckoutComponent) },
      { path: 'pedidos', title: 'Mis pedidos · NEXUS GAMING', canActivate: [authGuard], loadComponent: () => import('./pages/tienda/pedidos.component').then((m) => m.PedidosComponent) },
      { path: 'pedidos/:codigo', title: 'Pedido · NEXUS GAMING', canActivate: [authGuard], loadComponent: () => import('./pages/tienda/pedido-detalle.component').then((m) => m.PedidoDetalleComponent) },
      { path: 'biblioteca', title: 'Mi biblioteca · NEXUS GAMING', canActivate: [authGuard], loadComponent: () => import('./pages/tienda/biblioteca.component').then((m) => m.BibliotecaComponent) },
      { path: 'perfil', title: 'Mi perfil · NEXUS GAMING', canActivate: [authGuard], loadComponent: () => import('./pages/tienda/perfil.component').then((m) => m.PerfilComponent) },
      { path: 'soporte', title: 'Soporte · NEXUS GAMING', loadComponent: () => import('./pages/tienda/soporte.component').then((m) => m.SoporteComponent) },
      { path: '**', title: 'Página no encontrada · NEXUS GAMING', loadComponent: () => import('./pages/tienda/no-encontrada.component').then((m) => m.NoEncontradaComponent) }
    ]
  }
];
