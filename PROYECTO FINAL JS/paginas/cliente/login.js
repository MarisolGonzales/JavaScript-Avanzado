document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');

    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = document.getElementById('login-email').value;

            // Datos del usuario que inicia sesión
            const datosUsuario = {
                nombre: "Vanessa Valerio",
                correo: email,
                avatar: "https://ui-avatars.com/api/?name=Vanessa+Valerio&background=ab7fff&color=000&size=128"
            };

            // Guardar sesión activa en el navegador
            localStorage.setItem('nexus_usuario_activo', JSON.stringify(datosUsuario));

            alert('¡Inicio de sesión exitoso! Bienvenido a Nexus Gaming.');

            // Redirigir a la página de inicio con la sesión activa
            window.location.href = '../../index.html';
        });
    }
});