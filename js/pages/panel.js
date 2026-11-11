// El inicio muestra el resumen y las ventas recientes (desde MySQL).
window.CopyCopy = window.CopyCopy || { pages: {} };
window.CopyCopy.pages.panel = ({ db, money, table, summary }) => {
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
