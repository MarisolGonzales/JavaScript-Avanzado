/* ==========================================================================
   GESTIÓN DE PERFIL DE USUARIO - NEXUS GAMING
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    inicializarPerfil();
});

function inicializarPerfil() {
    const spanNombre = document.getElementById("perfil-nombre");
    const spanEmail = document.getElementById("perfil-email");
    const spanTotalJuegos = document.getElementById("perfil-total-juegos");
    const avatar = document.getElementById("profile-avatar");
    const formPerfil = document.getElementById("form-perfil");
    const inputNombre = document.getElementById("input-nombre");
    const inputEmail = document.getElementById("input-email");

    const usuarioActivo = localStorage.getItem("nexus_usuario_activo") || "Vanessa Tito";
    const emailActivo = localStorage.getItem("nexus_email_activo") || "vanessa@utp.edu.pe";
    const biblioteca = JSON.parse(localStorage.getItem("nexus_biblioteca")) || [];

    if (spanNombre) spanNombre.textContent = usuarioActivo;
    if (spanEmail) spanEmail.textContent = emailActivo;
    if (spanTotalJuegos) spanTotalJuegos.textContent = biblioteca.length;
    if (avatar) avatar.textContent = usuarioActivo.trim().charAt(0).toUpperCase();

    if (inputNombre) inputNombre.value = usuarioActivo;
    if (inputEmail) inputEmail.value = emailActivo;

    if (formPerfil) {
        formPerfil.addEventListener("submit", (e) => {
            e.preventDefault();

            const nuevoNombre = inputNombre ? inputNombre.value.trim() : usuarioActivo;
            const nuevoEmail = inputEmail ? inputEmail.value.trim() : emailActivo;

            localStorage.setItem("nexus_usuario_activo", nuevoNombre);
            localStorage.setItem("nexus_email_activo", nuevoEmail);

            if (spanNombre) spanNombre.textContent = nuevoNombre;
            if (spanEmail) spanEmail.textContent = nuevoEmail;
            if (avatar) avatar.textContent = nuevoNombre.trim().charAt(0).toUpperCase();

            alert("¡Perfil actualizado correctamente!");
        });
    }
}
