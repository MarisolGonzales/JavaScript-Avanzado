import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

/**
 * Todas las rutas usan carga perezosa (lazy loading) con loadChildren,
 * tal como se vio en la Semana 8: cada módulo de funcionalidad (feature
 * module) solo se descarga cuando el usuario navega a esa sección.
 */
const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadChildren: () => import('./modules/home/home.module').then(m => m.HomeModule)
  },
  {
    path: 'catalogo',
    loadChildren: () => import('./modules/catalogo/catalogo.module').then(m => m.CatalogoModule)
  },
  {
    path: 'carrito',
    loadChildren: () => import('./modules/carrito/carrito.module').then(m => m.CarritoModule)
  },
  {
    path: 'biblioteca',
    loadChildren: () => import('./modules/biblioteca/biblioteca.module').then(m => m.BibliotecaModule)
  },
  {
    path: 'perfil',
    loadChildren: () => import('./modules/perfil/perfil.module').then(m => m.PerfilModule)
  },
  {
    path: 'soporte',
    loadChildren: () => import('./modules/soporte/soporte.module').then(m => m.SoporteModule)
  },
  {
    path: 'historial',
    loadChildren: () => import('./modules/historial/historial.module').then(m => m.HistorialModule)
  },
  // Ruta comodín: cualquier URL desconocida vuelve al inicio
  { path: '**', redirectTo: 'home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
