// Los reportes usan las ventas guardadas en MySQL y los filtros elegidos.
window.CopyCopy = window.CopyCopy || { pages: {} };
window.CopyCopy.pages.reportes = ({
  $,
  db,
  refresh,
  day,
  message,
  table,
  summary,
}) => {
  let exported = [];
  summary();

  // Construye el reporte con los datos que ya están cargados.
  function report() {
    const type = $("#tipo").value,
      from = $("#fechaInicio").value,
      to = $("#fechaFin").value;
    if (type !== "inventario" && from && to && from > to) {
      message("La fecha inicial no puede ser posterior a la final.", true);
      return false;
    }
    const sales = db.sales.filter(
      (s) => (!from || s.date >= from) && (!to || s.date <= to),
    );
    let headers, rows;
    if (type === "inventario") {
      headers = [
        "Código",
        "Producto",
        "Categoría",
        "Existencias",
        "Precio MXN",
      ];
      rows = db.products.map((p) => [
        p.code,
        p.name,
        p.category,
        p.stock,
        (p.price / 100).toFixed(2),
      ]);
    } else if (type === "productos") {
      // La tabla `ventas` guarda el nombre del producto, no su código.
      const totals = new Map();
      sales.forEach((s) =>
        s.items.forEach((i) => {
          const p = totals.get(i.name) || { name: i.name, qty: 0, total: 0 };
          p.qty += i.qty;
          p.total += i.qty * i.price;
          totals.set(i.name, p);
        }),
      );
      headers = ["Producto", "Unidades vendidas", "Importe MXN"];
      rows = [...totals.values()].map((p) => [
        p.name,
        p.qty,
        (p.total / 100).toFixed(2),
      ]);
    } else {
      headers = ["Folio", "Fecha", "Unidades", "Total MXN"];
      rows = sales.map((s) => [
        s.id,
        s.date,
        s.items.reduce((n, i) => n + i.qty, 0),
        (s.total / 100).toFixed(2),
      ]);
    }
    exported = [headers, ...rows];
    $("#reporte-titulo").textContent =
      $("#tipo").selectedOptions[0].textContent;
    $("#reporte-periodo").textContent =
      type === "inventario"
        ? `Inventario al ${day()}`
        : `Desde ${from || "el primer registro"} hasta ${to || "el último registro"}`;
    table("#resultados", headers, rows);
    return true;
  }

  // Al consultar se vuelven a leer las ventas y el inventario de MySQL.
  async function consultar() {
    try {
      await refresh();
    } catch (e) {
      message(e.message, true);
      return false;
    }
    summary();
    return report();
  }

  $("#report-form").addEventListener("submit", (e) => {
    e.preventDefault();
    consultar();
  });
  $("#report-form").addEventListener("reset", () => setTimeout(consultar, 0));
  $("#imprimir").addEventListener("click", () => {
    if (report()) window.print();
  });
  $("#exportar").addEventListener("click", () => {
    if (!report()) return;
    const csv =
      "\uFEFF" +
      exported
        .map((row) =>
          row
            .map((value) => {
              let s = String(value);
              if (/^[=+@\-\t\r\n]/.test(s)) s = "'" + s;
              return '"' + s.replaceAll('"', '""') + '"';
            })
            .join(","),
        )
        .join("\r\n");
    const url = URL.createObjectURL(
        new Blob([csv], { type: "text/csv;charset=utf-8;" }),
      ),
      a = document.createElement("a");
    a.href = url;
    a.download = `copycopy-${$("#tipo").value}-${day()}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  report();
};
