const formLogin = document.getElementById("form-admin-login");
const inputUsuario = document.getElementById("admin-usuario");
const inputPassword = document.getElementById("admin-password");
const mensajeError = document.getElementById("admin-error");

const USUARIO_CORRECTO = "admin";
const PASSWORD_CORRECTO = "admin123";

formLogin.addEventListener("submit", function (evento) {
  evento.preventDefault(); // evita que la página se recargue al enviar el form

  const usuarioIngresado = inputUsuario.value.trim();
  const passwordIngresado = inputPassword.value.trim();

  // VALIDACION
  if (usuarioIngresado === USUARIO_CORRECTO && passwordIngresado === PASSWORD_CORRECTO) {
    
    localStorage.setItem("adminLogueado", "true");

    //Redirigimos al panel
    window.location.href = "admin-panel.html";

  } else {

    mensajeError.textContent = "Usuario o contraseña incorrectos.";
  }
});