(() => {
  "use strict";
  if (document.body.hidden || !document.querySelector("#mensaje")) return;
  const $ = (s) => document.querySelector(s);
  const key = "copycopy.datos.v1";
  const money = (n) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(n / 100);
  const day = (date = new Date()) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const message = (text, error = false) => {
    $("#mensaje").textContent = text;
    $("#mensaje").hidden = false;
    $("#mensaje").classList.toggle("error", error);
  };
  let db;
  try {
    const saved = localStorage.getItem(key);
    db = saved
      ? JSON.parse(saved)
      : { products: window.PRODUCTOS_INICIALES, sales: [] };
    if (!Array.isArray(db.products) || !Array.isArray(db.sales))
      throw new Error();
    if (!saved) localStorage.setItem(key, JSON.stringify(db));
  } catch {
    message(
      "No se pudieron cargar los datos. Revisa el almacenamiento del navegador; no se sobrescribieron los datos existentes.",
      true,
    );
    return;
  }
  function save(next) {
    try {
      localStorage.setItem(key, JSON.stringify(next));
      Object.assign(db, next);
      return true;
    } catch {
      message(
        "No se pudieron guardar los cambios. Revisa el espacio y los permisos del navegador.",
        true,
      );
      return false;
    }
  }
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
  window.CopyCopy?.pages[page]?.({
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
  });
  // Si otra pestaña cambia datos, recargar antes de permitir otra escritura.
  addEventListener("storage", (event) => {
    if (event.key === key) {
      message(
        "Los datos cambiaron en otra pestaña. Recarga esta página para continuar.",
        true,
      );
      document
        .querySelectorAll("main button, main input, main select")
        .forEach((el) => (el.disabled = true));
    }
  });
})();
