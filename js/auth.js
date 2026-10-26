// Acceso local de demostración; la autenticación real requiere un servidor.
(() => {
  const key = 'copycopy.sesion';
  const login = document.body.dataset.page === 'login';
  try {
    const session = sessionStorage.getItem(key) || localStorage.getItem(key);
    if (!login && session !== 'admin') { location.replace('login.html'); return; }
    if (login && session === 'admin') { location.replace('panel.html'); return; }
    document.body.hidden = false;
    if (login) {
      document.querySelector('#login-form').addEventListener('submit', event => {
        event.preventDefault();
        const error = document.querySelector('#login-error');
        if (document.querySelector('#usuario').value.trim() !== 'admin' || document.querySelector('#clave').value !== 'copycopy123') {
          error.textContent = 'Usuario o contraseña incorrectos.'; error.hidden = false; return;
        }
        try {
          localStorage.removeItem(key); sessionStorage.removeItem(key);
          (document.querySelector('[name="recordar"]').checked ? localStorage : sessionStorage).setItem(key, 'admin');
          location.replace('panel.html');
        } catch { error.textContent = 'Permite el almacenamiento del navegador para entrar.'; error.hidden = false; }
      });
    } else {
      document.querySelector('#sesion-usuario').textContent = 'Usuario: admin';
      document.querySelector('#cerrar-sesion').addEventListener('click', () => {
        localStorage.removeItem(key); sessionStorage.removeItem(key); location.replace('login.html');
      });
    }
    addEventListener('pageshow', () => {
      if (!login && !(sessionStorage.getItem(key) || localStorage.getItem(key))) location.replace('login.html');
    });
  } catch {
    document.body.hidden = false;
    document.body.textContent = 'Activa el almacenamiento del navegador y recarga la página para usar Copy Copy.';
  }
})();
