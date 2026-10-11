import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, firstValueFrom, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { SesionApi, Usuario } from '../../shared/models';

const CLAVE_TOKEN = 'nexus_token';
const API = `${environment.apiUrl}/auth`;

/**
 * SESIÓN DEL USUARIO. El servidor firma un token al iniciar sesión; aquí se guarda
 * en localStorage y el interceptor lo envía en cada petición. El rol (cliente,
 * soporte o admin) viene del servidor: aunque alguien edite este valor en el
 * navegador, la API vuelve a comprobarlo en cada operación.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  readonly token = signal<string | null>(this.leerToken());
  readonly usuario = signal<Usuario | null>(null);

  readonly logueado = computed(() => this.usuario() !== null);
  readonly esCliente = computed(() => this.usuario()?.rol === 'cliente');
  readonly esStaff = computed(() => this.usuario()?.rol === 'admin' || this.usuario()?.rol === 'soporte');
  readonly esAdmin = computed(() => this.usuario()?.rol === 'admin');
  readonly inicial = computed(() => (this.usuario()?.nombre.trim().charAt(0) || '?').toUpperCase());
  readonly rolEtiqueta = computed(() => ({ admin: 'Administrador', soporte: 'Soporte', cliente: 'Jugador' })[this.usuario()?.rol ?? 'cliente']);

  /** Se ejecuta al arrancar la app: si hay un token guardado, comprueba que siga siendo válido. */
  async restaurar(): Promise<void> {
    if (!this.token()) return;
    try {
      const r = await firstValueFrom(this.http.get<{ usuario: Usuario }>(`${API}/yo`));
      this.usuario.set(r.usuario);
    } catch {
      this.limpiar(); // token vencido o inválido
    }
  }

  iniciarSesion(email: string, password: string): Observable<SesionApi> {
    return this.http.post<SesionApi>(`${API}/login`, { email, password }).pipe(tap((s) => this.guardar(s)));
  }

  registrar(datos: { nombre: string; email: string; password: string; departamento: string }): Observable<SesionApi> {
    return this.http.post<SesionApi>(`${API}/registro`, datos).pipe(tap((s) => this.guardar(s)));
  }

  actualizarPerfil(cambios: { nombre?: string; departamento?: string }): Observable<{ usuario: Usuario }> {
    return this.http.patch<{ usuario: Usuario }>(`${API}/perfil`, cambios).pipe(tap((r) => this.usuario.set(r.usuario)));
  }

  cambiarPassword(actual: string, nueva: string): Observable<void> {
    return this.http.post<void>(`${API}/password`, { actual, nueva });
  }

  cerrarSesion(): void { this.limpiar(); }

  private guardar(s: SesionApi): void {
    try { localStorage.setItem(CLAVE_TOKEN, s.token); } catch { /* modo privado */ }
    this.token.set(s.token);
    this.usuario.set(s.usuario);
  }

  private limpiar(): void {
    try { localStorage.removeItem(CLAVE_TOKEN); } catch { /* modo privado */ }
    this.token.set(null);
    this.usuario.set(null);
  }

  private leerToken(): string | null {
    try { return localStorage.getItem(CLAVE_TOKEN); } catch { return null; }
  }
}
