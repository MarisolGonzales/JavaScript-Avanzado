/* ==========================================
   LÓGICA DEL PERFIL DE USUARIO (Refactorizada)
   ========================================== */

class UsuarioSesion {
    constructor(datosUsuario) {
        this.nombre = datosUsuario?.nombre ?? "Usuario Invitado";
        this.email = datosUsuario?.email ?? "Sin correo";
        this.avatar = datosUsuario?.avatar ?? "https://ui-avatars.com/api/?name=User&background=ab7fff&color=000";
    }

    // Método para pintar los datos de la sesión en el DOM de perfil
    renderizarPerfil() {
        const imgAvatar = document.getElementById('perfil-img-avatar');
        const nombreUsuario = document.getElementById('perfil-nombre-usuario');
        const emailUsuario = document.getElementById('perfil-email-usuario');
        
        const infoNombre = document.getElementById('info-nombre');
        const infoEmail = document.getElementById('info-email');

        if (imgAvatar) imgAvatar.src = this.avatar;
        if (nombreUsuario) nombreUsuario.textContent = this.nombre;
        if (emailUsuario) emailUsuario.textContent = this.email;
        
        if (infoNombre) infoNombre.textContent = this.nombre;
        if (infoEmail) infoEmail.textContent = this.email;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Obtener la sesión activa utilizando la llave exacta que genera registro.html
    const usuarioSesionStr = localStorage.getItem('nexus_usuario_activo');

    if (!usuarioSesionStr) {
        alert('No has iniciado sesión.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const datosCrudos = JSON.parse(usuarioSesionStr);
        
        // Instanciar la clase de Usuario para estructurar y validar datos con operadores modernos
        const usuarioActual = new UsuarioSesion(datosCrudos);
        usuarioActual.renderizarPerfil();

    } catch (error) {
        console.error("Error al procesar la sesión del usuario:", error);
        localStorage.removeItem('nexus_usuario_activo');
        window.location.href = 'login.html';
    }
});