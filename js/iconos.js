// Iconos locales: conservan el texto y los nombres accesibles de cada control.
(() => {
  const pages = {'panel.html':'home','menu.html':'grid','inventario.html':'box','ventas.html':'cart','reportes.html':'chart'};
  const labels = {'Inicio':'home','Menú principal':'grid','Inventario':'box','Registrar venta':'cart','Reportes':'chart','Últimas ventas':'receipt','Productos por reponer':'alert','Ventas de hoy':'cart','Unidades vendidas hoy':'receipt','Productos en catálogo':'box','Existencias bajas (menos de 10)':'alert','Agregar producto':'plus','Editar producto':'edit','Productos':'box','Agregar al carrito':'plus','Carrito':'cart','Venta registrada':'check','Consultar reportes':'search','Ventas':'cart','Productos vendidos':'receipt','Inventario actual':'box','Guardar producto':'save','Cancelar edición':'close','Agregar':'plus','Confirmar venta':'check','Vaciar carrito':'trash','Quitar':'close','Editar':'edit','Eliminar':'trash','Consultar reporte':'search','Limpiar filtros':'close','Imprimir reporte':'print','Imprimir comprobante':'print','Exportar CSV para Excel':'download','Cerrar sesión':'logout','Entrar al sistema':'logout','Usuario':'user','Contraseña':'lock'};
  function setIcon(el, name) {
    el.dataset.icon = name;
    let image = el.querySelector(':scope > img.icono');
    const src = `assets/icons/${name}.svg`;
    if (image && image.getAttribute('src') === src) return;
    if (!image) {
      image = document.createElement('img');
      image.className = 'icono'; image.alt = '';
      image.setAttribute('aria-hidden', 'true');
      image.width = 20; image.height = 20;
      el.prepend(image);
    }
    image.setAttribute('src', src);
  }
  function decorate() {
    document.querySelectorAll('nav a, .accesos-menu a, main a:not(.boton)').forEach(el => {
      const icon=pages[el.getAttribute('href')]; if(icon) setIcon(el, icon);
    });
    document.querySelectorAll('button, h1, h2, .campo label').forEach(el => {
      const icon=labels[el.textContent.trim()]; if(icon) setIcon(el, icon);
    });
    const user=document.getElementById('sesion-usuario'); if(user) setIcon(user, 'user');
    document.querySelectorAll('[data-icon]').forEach(el => setIcon(el, el.dataset.icon));
  }
  decorate();
  // Los botones del inventario y del carrito se vuelven a crear al actualizar.
  new MutationObserver(decorate).observe(document.body,{childList:true,subtree:true,characterData:true});
})();
