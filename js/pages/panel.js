// El inicio muestra el resumen y las ventas recientes (desde MySQL).
window.CopyCopy = window.CopyCopy || { pages: {} };
window.CopyCopy.pages.panel = ({ db, money, table, summary }) => {
  const titulo = document.querySelector("#inicio-titulo");
  const reloj = document.querySelector("#inicio-fecha-hora");
  let nombre = "";
  const formatoFecha = new Intl.DateTimeFormat("es-MX", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const formatoHora = new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
  });
  function actualizarBienvenida() {
    const ahora = new Date();
    const hora = ahora.getHours();
    const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
    titulo.textContent = `${saludo}${nombre ? ", " + nombre : ""}. Bienvenido a Copy Copy`;
    reloj.dateTime = ahora.toISOString();
    reloj.textContent = `${formatoFecha.format(ahora)} · ${formatoHora.format(ahora)}`;
  }
  window.CopyCopy.sesion.then((usuario) => {
    nombre = usuario.nombre;
    actualizarBienvenida();
  });
  actualizarBienvenida();
  const intervalo = setInterval(actualizarBienvenida, 1000);
  addEventListener("pagehide", () => clearInterval(intervalo), { once: true });
  addEventListener("pageshow", (event) => {
    if (event.persisted) location.reload();
  });
  // La base guarda solo la fecha de cada venta, sin hora.
  const fecha = (texto) =>
    new Date(`${texto}T00:00:00`).toLocaleDateString("es-MX");
  summary();
  table(
    "#ultimas",
    ["Folio", "Fecha", "Total"],
    db.sales
      .slice(-10)
      .reverse()
      .map((s) => [s.id, fecha(s.date), money(s.total)]),
  );
  table(
    "#stock-bajo",
    ["Producto", "Existencias"],
    db.products.filter((p) => p.stock < 10).map((p) => [p.name, p.stock]),
  );
};
