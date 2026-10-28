// El inicio muestra el resumen y las ventas recientes.
window.CopyCopy = window.CopyCopy || { pages: {} };
window.CopyCopy.pages.panel = ({
  $,
  db,
  save,
  money,
  day,
  message,
  table,
  button,
  summary,
  key,
}) => {
  summary();
  table(
    "#ultimas",
    ["Folio", "Fecha", "Total"],
    db.sales
      .slice(-10)
      .reverse()
      .map((s) => [
        s.id,
        new Date(s.created).toLocaleString("es-MX"),
        money(s.total),
      ]),
  );
  table(
    "#stock-bajo",
    ["Producto", "Existencias"],
    db.products.filter((p) => p.stock < 10).map((p) => [p.name, p.stock]),
  );
};
