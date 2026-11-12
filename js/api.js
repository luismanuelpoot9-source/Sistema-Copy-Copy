/* Cliente de la API PHP. Se carga ANTES de auth.js en cada HTML:
   <script src="js/api.js" defer></script>
   Todas las funciones devuelven promesas: usa await. */
(function () {
  'use strict';

  // PHP necesita Apache; un HTML abierto desde el Explorador usa file:.
  if (location.protocol === 'file:') {
    const pagina = location.pathname.split('/').pop() || 'login.html';
    location.replace('http://localhost/Sistema-Copy-Copy-main/' + pagina);
    return;
  }

  async function peticion(url, metodo, cuerpo) {
    const opciones = {
      method: metodo || 'GET',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
    };
    if (cuerpo !== undefined) opciones.body = JSON.stringify(cuerpo);

    let respuesta;
    try {
      respuesta = await fetch(url, opciones);
    } catch (e) {
      throw new Error('No se pudo conectar con el servidor. ¿Está encendido Apache/MySQL?');
    }
    const datos = await respuesta.json().catch(() => ({}));

    if (respuesta.status === 401 && !url.includes('login.php')) {
      const enLogin = document.body && document.body.dataset.page === 'login';
      if (!enLogin) window.location.href = 'login.html'; // sesión vencida
      throw new Error('Sesión no iniciada');
    }
    if (!respuesta.ok) throw new Error(datos.error || 'Error del servidor');
    return datos;
  }

  const prod = (codigo) => 'api/productos.php?codigo=' + encodeURIComponent(codigo);

  window.Api = {
    login: (usuario, clave, recordar) =>
      peticion('api/login.php', 'POST', { usuario, clave, recordar: !!recordar }),
    logout: () => peticion('api/logout.php', 'POST'),
    sesion: () => peticion('api/sesion.php'),

    productos: () => peticion('api/productos.php'),
    crearProducto: (p) => peticion('api/productos.php', 'POST', p),
    editarProducto: (codigo, p) => peticion(prod(codigo), 'PUT', p),
    favorito: (codigo, valor) => peticion(prod(codigo), 'PATCH', { favorito: !!valor }),
    eliminarProducto: (codigo) => peticion(prod(codigo), 'DELETE'),

    // items: [{ codigo, cantidad }], pago: número, tipopago: 'efectivo' | 'tarjeta' | 'transferencia'
    registrarVenta: (items, pago, tipopago) =>
      peticion('api/ventas.php', 'POST', { items, pago, tipopago }),
    ventas: (desde, hasta) => {
      const q = new URLSearchParams();
      if (desde) q.set('desde', desde);
      if (hasta) q.set('hasta', hasta);
      const texto = q.toString();
      return peticion('api/ventas.php' + (texto ? '?' + texto : ''));
    },
  };
})();
