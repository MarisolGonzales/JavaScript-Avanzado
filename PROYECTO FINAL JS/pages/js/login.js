/* ==========================================================================
   MÓDULO DE INICIO DE SESIÓN (LOGIN)
   ========================================================================== */

// --- 1. CLASE PARA GESTIONAR LA AUTENTICACIÓN Y ROLES ---
class AuthManager {
    constructor(email, nombreInput) {
        this.email = email ?? "";
        this.nombre = nombreInput ?? "Vanessa Tito"; // Nombre por defecto indicado por la usuaria
    }

    // Método para determinar si el usuario posee privilegios de Administrador
    esAdministrador() {
        // Criterio: Si el correo incluye "admin" o es un correo corporativo específico
        return this.email.toLowerCase().includes('admin');
    }

    // Método para generar el objeto de sesión con su respectivo rol y avatar dinámico
    generarDatosSesion() {
        const esAdmin = this.esAdministrador();
        
        return {
            nombre: this.nombre,
            email: this.email,
            // Asignar rol según la validación
            rol: esAdmin ? "ADMIN" : "MEMBER",
            // Avatar personalizado según el rol
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(this.nombre)}&background=${esAdmin ? 'ff4d4d' : 'ab7fff'}&color=000`
        };
    }
}

// --- 2. GESTIÓN DE EVENTOS DEL FORMULARIO DE ACCESO ---
document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');

    if (!formLogin) return;

    formLogin.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevenir el envío tradicional del formulario

        // Capturar los valores ingresados en el formulario del DOM 
        const inputEmail = document.getElementById('login-email');
        const emailValor = inputEmail ? inputEmail.value.trim() : "";

        // Instanciar la clase de autenticación
        const gestorAuth = new AuthManager(emailValor, "Vanessa Tito");
        const datosUsuario = gestorAuth.generarDatosSesion();

        // --- 3. PERSISTENCIA DE SESIÓN ---
        // Guardar el objeto serializado como JSON en el LocalStorage del navegador
        localStorage.setItem('nexus_usuario_activo', JSON.stringify(datosUsuario));

        // Notificación de éxito según el rol detectado
        if (datosUsuario.rol === "ADMIN") {
            alert('¡Acceso concedido! Bienvenido al Panel de Administrador de Nexus Gaming.');
            // Redirección especial para administradores (puedes cambiar la ruta si creaste un admin.html)
            window.location.href = '../../index.html'; 
        } else {
            alert('¡Inicio de sesión exitoso! Bienvenido a Nexus Gaming.');
            // Redirección estándar a la página principal
            window.location.href = '../../index.html';
        }
    });
});