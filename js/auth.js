// Acceso al sistema. La sesión la valida el servidor PHP contra la tabla `usuario` de MySQL.
(() => {
  "use strict";
  if (location.protocol === "file:") return;
  const $ = (s) => document.querySelector(s);
  const login = document.body.dataset.page === "login";
  window.CopyCopy = window.CopyCopy || { pages: {} };

  if (!window.Api) {
    document.body.hidden = false;
    document.body.textContent =
      "Falta cargar js/api.js. Revisa que el HTML lo incluya antes de auth.js.";
    return;
  }

  if (login) {
    // Si ya hay una sesión activa, pasar directo al panel.
    Api.sesion()
      .then(() => location.replace("panel.html"))
      .catch(() => {});

    $("#login-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const error = $("#login-error");
      const boton = event.currentTarget.querySelector('[type="submit"]');
      error.hidden = true;
      boton.disabled = true;
      try {
        await Api.login(
          $("#usuario").value.trim(),
          $("#clave").value,
          $('[name="recordar"]').checked,
        );
        location.replace("panel.html");
      } catch (e) {
        error.textContent = e.message;
        error.hidden = false;
        boton.disabled = false;
      }
    });
    return;
  }

  // Páginas internas: sistema.js espera esta promesa antes de cargar los datos.
  window.CopyCopy.sesion = Api.sesion().then((usuario) => {
    document.body.hidden = false;
    $("#sesion-usuario").textContent = "Usuario: " + usuario.nombre;
    $("#cerrar-sesion").addEventListener("click", async () => {
      try {
        await Api.logout();
      } catch {
        // Aunque falle, se vuelve al login.
      }
      location.replace("login.html");
    });
    return usuario;
  });

  window.CopyCopy.sesion.catch((e) => {
    // Sin sesión, api.js ya redirige al login; otros errores se muestran en pantalla.
    if (e.message !== "Sesión no iniciada") {
      document.body.hidden = false;
      document.body.textContent = e.message;
    }
  });

  // Al volver con el botón "atrás", comprobar que la sesión siga activa.
  addEventListener("pageshow", (event) => {
    if (event.persisted) Api.sesion().catch(() => {});
  });
})();
