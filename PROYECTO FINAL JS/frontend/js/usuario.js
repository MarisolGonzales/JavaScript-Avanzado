/* ==========================================================================
   GESTIÓN DE PERFIL DE USUARIO - NEXUS GAMING
   --------------------------------------------------------------------------
   El "rol" del usuario se determina por el dominio de su correo: las
   cuentas @nexusgaming.pe son del staff y ven el panel de administrador
   (ver admin.js). Cualquier otro correo es un usuario/jugador normal.
   ========================================================================== */

function determinarRol(email) {
    return (email || "").trim().toLowerCase().endsWith("@nexusgaming.pe") ? "admin" : "usuario";
}

document.addEventListener("DOMContentLoaded", () => {
    inicializarPerfil();

    const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener("click", cerrarSesion);
    }
});

function inicializarPerfil() {
    const spanNombre = document.getElementById("perfil-nombre");
    const spanEmail = document.getElementById("perfil-email");
    const spanRango = document.getElementById("perfil-rango");
    const spanTotalJuegos = document.getElementById("perfil-total-juegos");
    const avatar = document.getElementById("profile-avatar");
    const formPerfil = document.getElementById("form-perfil");
    const inputNombre = document.getElementById("input-nombre");
    const inputEmail = document.getElementById("input-email");
    const panelAdmin = document.getElementById("admin-panel");

    const usuarioActivo = localStorage.getItem("nexus_usuario_activo") || "Vanessa Tito";
    const emailActivo = localStorage.getItem("nexus_email_activo") || "vanessa@utp.edu.pe";
    const biblioteca = JSON.parse(localStorage.getItem("nexus_biblioteca")) || [];

    aplicarDatosPerfil(usuarioActivo, emailActivo, biblioteca.length);

    if (inputNombre) inputNombre.value = usuarioActivo;
    if (inputEmail) inputEmail.value = emailActivo;

    function aplicarDatosPerfil(nombre, email, totalJuegos) {
        const rol = determinarRol(email);
        localStorage.setItem("nexus_rol", rol);

        if (spanNombre) spanNombre.textContent = nombre;
        if (spanEmail) spanEmail.textContent = email;
        if (spanTotalJuegos) spanTotalJuegos.textContent = totalJuegos;
        if (avatar) avatar.textContent = nombre.trim().charAt(0).toUpperCase();
        if (spanRango) spanRango.textContent = rol === "admin" ? "Administrador" : "Pro Gamer";

        if (panelAdmin) {
            panelAdmin.style.display = rol === "admin" ? "block" : "none";
            if (rol === "admin" && typeof cargarPanelAdmin === "function") {
                cargarPanelAdmin();
            }
        }
    }

    if (formPerfil) {
        formPerfil.addEventListener("submit", (e) => {
            e.preventDefault();

            const nuevoNombre = inputNombre ? inputNombre.value.trim() : usuarioActivo;
            const nuevoEmail = inputEmail ? inputEmail.value.trim() : emailActivo;
            const rolAnterior = localStorage.getItem("nexus_rol") || "usuario";

            localStorage.setItem("nexus_usuario_activo", nuevoNombre);
            localStorage.setItem("nexus_email_activo", nuevoEmail);

            const biblioteca = JSON.parse(localStorage.getItem("nexus_biblioteca")) || [];
            aplicarDatosPerfil(nuevoNombre, nuevoEmail, biblioteca.length);

            const rolNuevo = determinarRol(nuevoEmail);
            if (rolNuevo !== rolAnterior && rolNuevo === "admin") {
                alert("¡Perfil actualizado! Ahora tienes acceso de administrador.");
            } else {
                alert("¡Perfil actualizado correctamente!");
            }
        });
    }
}

function cerrarSesion() {
    if (!confirm("¿Seguro que deseas cerrar sesión?")) return;

    localStorage.setItem("nexus_usuario_activo", "Invitado");
    localStorage.setItem("nexus_email_activo", "invitado@correo.com");
    localStorage.setItem("nexus_rol", "usuario");

    window.location.href = "../index.html";
}
