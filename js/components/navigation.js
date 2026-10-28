(() => {
  const host = document.querySelector("[data-navigation]");
  if (!host) return;
  host.outerHTML = `<div class="barra-principal"><a class="barra-principal__marca" href="panel.html"><span class="logo-icono logo-icono--mini" aria-hidden="true"><img src="assets/copy.jpeg" alt=""></span>Copy Copy</a>
<nav class="barra-principal__enlaces" aria-label="Navegación principal"><a href="panel.html"><img class="icono" src="assets/icons/home.svg" alt="" aria-hidden="true" width="20" height="20">Inicio</a><a href="menu.html"><img class="icono" src="assets/icons/grid.svg" alt="" aria-hidden="true" width="20" height="20">Menú</a><a href="inventario.html"><img class="icono" src="assets/icons/box.svg" alt="" aria-hidden="true" width="20" height="20">Inventario</a><a href="ventas.html"><img class="icono" src="assets/icons/cart.svg" alt="" aria-hidden="true" width="20" height="20">Ventas</a><a href="reportes.html"><img class="icono" src="assets/icons/chart.svg" alt="" aria-hidden="true" width="20" height="20">Reportes</a>
</nav>
<div><span id="sesion-usuario"></span> <button id="cerrar-sesion" type="button"><img class="icono" src="assets/icons/logout.svg" alt="" aria-hidden="true" width="20" height="20">Cerrar sesión</button>
</div>
</div>
`;
  const active = document.querySelector(
    `nav a[href="${document.body.dataset.page}.html"]`,
  );
  active?.setAttribute("aria-current", "page");
})();
