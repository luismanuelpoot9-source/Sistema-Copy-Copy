// Cambia esta lista cuando se agregue una nueva pantalla.
(() => {
  const host = document.querySelector("[data-navigation]");
  if (!host) return;
  const sections = [
    ["panel", "Inicio", "home"],
    ["menu", "Menú", "grid"],
    ["inventario", "Inventario", "box"],
    ["ventas", "Ventas", "cart"],
    ["reportes", "Reportes", "chart"],
  ];
  const icon = (name) =>
    `<img class="icono" src="assets/icons/${name}.svg" alt="" width="20" height="20">`;
  const links = sections
    .map(([page, label, image]) => {
      const active =
        page === document.body.dataset.page ? ' aria-current="page"' : "";
      return `<a href="${page}.html"${active}>${icon(image)}${label}</a>`;
    })
    .join("");
  // La plantilla usa solo los textos de la lista anterior, nunca datos del usuario.
  host.outerHTML = `
    <header class="barra-principal">
      <a class="barra-principal__marca" href="panel.html">
        <span class="logo-icono logo-icono--mini" aria-hidden="true"><img src="assets/copy.jpeg" alt="" width="64" height="64"></span>
        Copy Copy
      </a>
      <nav class="barra-principal__enlaces" aria-label="Navegación principal">${links}</nav>
      <div><span id="sesion-usuario"></span> <button id="cerrar-sesion" type="button">${icon("logout")}Cerrar sesión</button></div>
    </header>`;
})();
