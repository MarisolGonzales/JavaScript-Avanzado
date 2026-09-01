document.addEventListener('DOMContentLoaded', () => {
    const formPerfil = document.getElementById('form-perfil');

    formPerfil.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nombre = document.getElementById('nombre').value;
        const correo = document.getElementById('correo').value;

        // Guardar cambios en el almacenamiento local del navegador
        localStorage.setItem('usuario_nombre', nombre);
        localStorage.setItem('usuario_correo', correo);

        alert('¡Perfil actualizado con éxito!');
    });
});