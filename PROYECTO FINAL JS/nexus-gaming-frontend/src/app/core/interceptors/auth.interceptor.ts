import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/**
 * Interceptor funcional (Semana 9). Hace dos cosas con cada petición a NUESTRA API:
 *  1. Añade "Authorization: Bearer <token>" si hay sesión.
 *  2. Si el servidor responde 401 con una sesión abierta (token vencido), la cierra y
 *     lleva al usuario a iniciar sesión de nuevo.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) return next(req);
  const auth = inject(AuthService);
  const token = auth.token();
  const peticion = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(peticion).pipe(
    catchError((err: unknown) => {
      const esLogin = req.url.includes('/auth/login') || req.url.includes('/auth/registro');
      if (err instanceof HttpErrorResponse && err.status === 401 && token && !esLogin) {
        auth.cerrarSesion();
        inject(ToastService).info('Tu sesión venció. Inicia sesión de nuevo.');
        const router = inject(Router);
        void router.navigate(['/login'], { queryParams: { volver: router.url } });
      }
      return throwError(() => err);
    })
  );
};
