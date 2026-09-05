/* ==========================================================================
   MÓDULO DE PERFIL DE USUARIO
   ========================================================================== */

// --- 1. DEFINICIÓN DE CLASES ---
class UsuarioSesion {
    constructor(datosUsuario) {
        // Uso de operadores modernos de fusión nula (??) y encadenamiento opcional (?.)
        this.nombre = datosUsuario?.nombre ?? "Usuario Invitado";
        this.email = datosUsuario?.email ?? "Sin correo registrado";
        
        // Generación dinámica del avatar basada en el nombre del usuario
        this.avatar = datosUsuario?.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(this.nombre)}&background=ab7fff&color=000`;
    }

    // Método de instancia para renderizar los datos en el DOM
    renderizarPerfil() {
        const imgAvatar = document.getElementById('perfil-img-avatar');
        const nombreUsuario = document.getElementById('perfil-nombre-usuario');
        const emailUsuario = document.getElementById('perfil-email-usuario');
        
        const infoNombre = document.getElementById('info-nombre');
        const infoEmail = document.getElementById('info-email');

        // Inyección segura de elementos en el DOM validando su existencia
        if (imgAvatar) imgAvatar.src = this.avatar;
        if (nombreUsuario) nombreUsuario.textContent = this.nombre;
        if (emailUsuario) emailUsuario.textContent = this.email;
        
        if (infoNombre) infoNombre.textContent = this.nombre;
        if (infoEmail) infoEmail.textContent = this.email;
    }
}

// --- 2. GESTIÓN DE EVENTOS DEL DOM Y CICLO DE VIDA ---
document.addEventListener('DOMContentLoaded', () => {
    
    // Recuperar la sesión activa desde el almacenamiento local del navegador (LocalStorage API)
    const usuarioSesionStr = localStorage.getItem('nexus_usuario_activo');

    // Validación de sesión activa (Control de acceso básico)
    if (!usuarioSesionStr) {
        alert('No has iniciado sesión.');
        window.location.href = 'login.html';
        return;
    }

    // Manejo de errores con bloques Try/Catch (Robustez del código)
    try {
        // Parsear la cadena JSON obtenida de LocalStorage a un objeto utilizable
        const datosCrudos = JSON.parse(usuarioSesionStr);
        
        // Instanciar la clase UsuarioSesion creada en la Semana 1
        const usuarioActual = new UsuarioSesion(datosCrudos);
        
        // Ejecutar el método de renderizado visual
        usuarioActual.renderizarPerfil();

    } catch (error) {
        console.error("Error crítico al procesar los datos de sesión:", error);
        // Limpiar almacenamiento corrupto y redirigir por seguridad
        localStorage.removeItem('nexus_usuario_activo');
        window.location.href = 'login.html';
    }

    // --- 3. IMPLEMENTACIÓN DEL BOTÓN CERRAR SESIÓN (Event Listeners) ---
    const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
    
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', (e) => {
            e.preventDefault(); // Prevenir comportamiento por defecto del enlace (#)
            
            // Eliminar la llave de sesión del LocalStorage
            localStorage.removeItem('nexus_usuario_activo');
            
            // Redirección a la página principal o de inicio de sesión
            window.location.href = '../../index.html';
        });
    }
});