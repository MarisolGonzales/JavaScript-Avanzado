import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface PerfilUsuario {
  nombre: string;
  email: string;
  rol: 'admin' | 'usuario';
}

const CLAVE_NOMBRE = 'nexus_usuario_activo';
const CLAVE_EMAIL = 'nexus_email_activo';

/**
 * Maneja la sesión del usuario en el cliente. El rol se calcula a partir
 * del dominio del correo: las cuentas @nexusgaming.pe son del staff y
 * ven el panel de administrador (ver PerfilComponent).
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly perfil$ = new BehaviorSubject<PerfilUsuario>(this.leerPerfil());

  obtenerPerfil(): Observable<PerfilUsuario> {
    return this.perfil$.asObservable();
  }

  obtenerPerfilActual(): PerfilUsuario {
    return this.perfil$.value;
  }

  actualizarPerfil(nombre: string, email: string): PerfilUsuario {
    const rol = this.determinarRol(email);
    const nuevoPerfil: PerfilUsuario = { nombre, email, rol };

    localStorage.setItem(CLAVE_NOMBRE, nombre);
    localStorage.setItem(CLAVE_EMAIL, email);
    this.perfil$.next(nuevoPerfil);

    return nuevoPerfil;
  }

  cerrarSesion(): void {
    this.actualizarPerfil('Invitado', 'invitado@correo.com');
  }

  private determinarRol(email: string): 'admin' | 'usuario' {
    return email.trim().toLowerCase().endsWith('@nexusgaming.pe') ? 'admin' : 'usuario';
  }

  private leerPerfil(): PerfilUsuario {
    const nombre = localStorage.getItem(CLAVE_NOMBRE) || 'Vanessa Tito';
    const email = localStorage.getItem(CLAVE_EMAIL) || 'vanessa@utp.edu.pe';
    return { nombre, email, rol: this.determinarRol(email) };
  }
}
