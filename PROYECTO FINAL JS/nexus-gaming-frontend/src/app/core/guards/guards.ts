import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/** Exige haber iniciado sesión; si no, lleva al login y vuelve a la página pedida después. */
export const authGuard: CanActivateFn = (_ruta, estado) => {
  if (inject(AuthService).logueado()) return true;
  return inject(Router).createUrlTree(['/login'], { queryParams: { volver: estado.url } });
};

/** Login y registro no tienen sentido con sesión abierta: cada rol va a su pantalla. */
export const invitadoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (!auth.logueado()) return true;
  return inject(Router).createUrlTree([auth.esStaff() ? '/admin' : '/inicio']);
};

/** Panel de administración: solo personal (admin o soporte). */
export const staffGuard: CanActivateFn = (_ruta, estado) => {
  const auth = inject(AuthService);
  if (auth.esStaff()) return true;
  if (!auth.logueado()) return inject(Router).createUrlTree(['/login'], { queryParams: { volver: estado.url } });
  inject(ToastService).error('El panel es solo para el personal de NEXUS GAMING.');
  return inject(Router).createUrlTree(['/inicio']);
};

/** Catálogo y stock: solo administración (soporte no edita el catálogo). */
export const adminGuard: CanActivateFn = () => {
  if (inject(AuthService).esAdmin()) return true;
  inject(ToastService).error('Esta sección es exclusiva de administración.');
  return inject(Router).createUrlTree(['/admin']);
};

/** Comprar: solo cuentas de cliente (el personal no compra). */
export const clienteGuard: CanActivateFn = () => {
  if (inject(AuthService).esCliente()) return true;
  inject(ToastService).error('Las cuentas del personal no pueden comprar. Entra con una cuenta de cliente.');
  return inject(Router).createUrlTree(['/inicio']);
};
