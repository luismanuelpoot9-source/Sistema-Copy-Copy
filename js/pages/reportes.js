window.CopyCopy = window.CopyCopy || { pages: {} };
window.CopyCopy.pages.reportes = ({
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
  let exported = [];
  summary();
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
      const totals = new Map();
      sales.forEach((s) =>
        s.items.forEach((i) => {
          const p = totals.get(i.code) || {
            code: i.code,
            name: i.name,
            qty: 0,
            total: 0,
          };
          p.qty += i.qty;
          p.total += i.qty * i.price;
          totals.set(i.code, p);
        }),
      );
      headers = ["Código", "Producto", "Unidades vendidas", "Importe MXN"];
      rows = [...totals.values()].map((p) => [
        p.code,
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
  $("#report-form").addEventListener("submit", (e) => {
    e.preventDefault();
    report();
  });
  $("#report-form").addEventListener("reset", () => setTimeout(report, 0));
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
