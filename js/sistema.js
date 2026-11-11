(() => {
  "use strict";
  if (!document.querySelector("#mensaje")) return;
  const $ = (s) => document.querySelector(s);
  // Creamos el formato una vez y lo usamos para todos los precios.
  const currency = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
  const money = (n) => currency.format(n / 100);
  const day = (date = new Date()) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const message = (text, error = false) => {
    $("#mensaje").textContent = text;
    $("#mensaje").hidden = false;
    $("#mensaje").classList.toggle("error", error);
  };

  // `db` conserva siempre la misma referencia: refresh() la actualiza con lo que hay en MySQL.
  const db = { products: [], sales: [] };
  async function refresh() {
    Object.assign(db, await Datos.cargar());
  }

  // Todas las pantallas usan esta misma forma de construir tablas.
  function table(target, headers, rows) {
    const host = $(target);
    host.replaceChildren();
    if (!rows.length) {
      const p = document.createElement("p");
      p.textContent = "No hay registros para mostrar.";
      host.append(p);
      return;
    }
    const t = document.createElement("table"),
      head = t.createTHead().insertRow(),
      body = t.createTBody();
    headers.forEach((text) => {
      const th = document.createElement("th");
      th.scope = "col";
      th.textContent = text;
      head.append(th);
    });
    rows.forEach((row) => {
      const tr = body.insertRow();
      row.forEach((value) => {
        const td = tr.insertCell();
        value instanceof Node
          ? td.append(value)
          : (td.textContent = String(value));
      });
    });
    host.append(t);
  }
  function button(text, action, label = text) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = text;
    b.setAttribute("aria-label", label);
    b.addEventListener("click", action);
    return b;
  }
  const page = document.body.dataset.page;
  function summary() {
    const today = db.sales.filter((s) => s.date === day());
    const entries = [
      ["Ventas de hoy", money(today.reduce((n, s) => n + s.total, 0))],
      [
        "Unidades vendidas hoy",
        today.reduce((n, s) => n + s.items.reduce((v, i) => v + i.qty, 0), 0),
      ],
      ["Productos en catálogo", db.products.length],
      [
        "Existencias bajas (menos de 10)",
        db.products.filter((p) => p.stock < 10).length,
      ],
    ];
    $("#resumen").replaceChildren(
      ...entries.map(([label, value]) => {
        const a = document.createElement("article");
        const h = document.createElement("h2");
        h.textContent = label;
        const p = document.createElement("p");
        p.textContent = value;
        a.append(h, p);
        return a;
      }),
    );
  }

  async function iniciar() {
    // Esperar a que auth.js confirme la sesión antes de pedir datos.
    await window.CopyCopy.sesion;
    try {
      await refresh();
    } catch (e) {
      message(e.message || "No se pudieron cargar los datos.", true);
      return;
    }
    window.CopyCopy.pages[page]?.({
      $,
      db,
      refresh,
      money,
      day,
      message,
      table,
      button,
      summary,
    });
  }
  iniciar().catch(() => {});
})();
