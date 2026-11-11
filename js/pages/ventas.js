// El carrito se revisa antes de cobrar; el servidor vuelve a validar y guarda la venta en MySQL.
window.CopyCopy = window.CopyCopy || { pages: {} };
window.CopyCopy.pages.ventas = ({
  $,
  db,
  refresh,
  money,
  message,
  table,
  button,
}) => {
  let cart = [];
  const total = () => cart.reduce((n, i) => n + i.price * i.qty, 0);
  const aCentavos = (pesos) => Math.round(Number(pesos) * 100);
  function change() {
    $("#cambio").textContent = money(
      Math.max(0, Math.round(Number($("#pago").value) * 100) - total()),
    );
  }
  const codigoInput = $("#producto");
  const sugerencias = $("#codigos-productos");
  function sugerir() {
    const texto = codigoInput.value.trim().toUpperCase();
    const productos = db.products.filter((p) =>
      p.code.toUpperCase().includes(texto) || p.name.toUpperCase().includes(texto),
    ).sort((a, b) => a.code.localeCompare(b.code, "es", { numeric: true }));
    sugerencias.replaceChildren(...productos.map((p) => {
      const opcion = button(
        `${p.code} · ${p.name} · ${money(p.price)} · ${p.stock} disponibles`,
        () => {
          codigoInput.value = p.code;
          sugerencias.hidden = true;
          $("#cantidad").focus();
        },
      );
      opcion.className = "sugerencia-producto";
      opcion.replaceChildren(...[
        ["sugerencia-producto__codigo", p.code],
        ["sugerencia-producto__nombre", p.name],
        ["sugerencia-producto__precio", money(p.price)],
      ].map(([clase, texto]) => {
        const span = document.createElement("span");
        span.className = clase;
        span.textContent = texto;
        return span;
      }));
      return opcion;
    }));
    if (!productos.length) sugerencias.textContent = "No hay productos con ese código o nombre.";
    sugerencias.hidden = false;
  }
  const buscador = codigoInput.parentElement;
  buscador.addEventListener("mouseenter", sugerir);
  buscador.addEventListener("mouseleave", () => { sugerencias.hidden = true; });
  codigoInput.addEventListener("input", () => {
    if (buscador.matches(":hover")) sugerir();
  });
  codigoInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") sugerencias.hidden = true;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      sugerir();
      sugerencias.querySelector("button")?.focus();
    }
  });
  codigoInput.parentElement.addEventListener("focusout", (e) => {
    if (!codigoInput.parentElement.contains(e.relatedTarget)) sugerencias.hidden = true;
  });
  function render() {
    table(
      "#carrito",
      ["Producto", "Cantidad", "Precio", "Importe", "Acciones"],
      cart.map((i) => [
        i.name,
        i.qty,
        money(i.price),
        money(i.price * i.qty),
        button("Quitar", () => {
          cart = cart.filter((x) => x.code !== i.code);
          render();
        }),
      ]),
    );
    $("#total").textContent = money(total());
    $("#cobrar").disabled = !cart.length;
    change();
  }
  $("#sale-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const codigo = $("#producto").value.trim().toUpperCase();
    const p = db.products.find((p) => p.code.toUpperCase() === codigo),
      qty = Number($("#cantidad").value),
      item = cart.find((i) => i.code === p?.code);
    if (!p) {
      message("No existe un producto con ese código.", true);
      return;
    }
    if (p.price <= 0) {
      message("El producto no tiene un precio válido. Revisa el inventario.", true);
      return;
    }
    if (
      !Number.isSafeInteger(qty) ||
      qty < 1 ||
      qty + (item?.qty || 0) > p.stock
    ) {
      message(
        "La cantidad supera las existencias disponibles o no es válida.",
        true,
      );
      return;
    }
    if (item) item.qty += qty;
    else cart.push({ code: p.code, name: p.name, price: p.price, qty });
    render();
    $("#producto").value = "";
    $("#cantidad").value = "1";
    $("#producto").focus();
    sugerencias.hidden = true;
    message(`${p.name} agregado al carrito.`);
  });
  $("#pago").addEventListener("input", change);
  $("#vaciar").addEventListener("click", () => {
    cart = [];
    $("#checkout-form").reset();
    render();
  });
  $("#checkout-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payment = Math.round(Number($("#pago").value) * 100);
    if (!cart.length || !Number.isSafeInteger(payment) || payment < total()) {
      message("El pago debe cubrir el total de la venta.", true);
      return;
    }
    $("#cobrar").disabled = true;
    try {
      // Leer otra vez MySQL para no cobrar con precios o existencias antiguos.
      await refresh();
      if (
        cart.some((i) => {
          const p = db.products.find((p) => p.code === i.code);
          return !p || p.stock < i.qty || p.price !== i.price;
        })
      ) {
        message(
          "Cambió el precio o las existencias. Revisa el carrito y vuelve a intentarlo.",
          true,
        );
        return;
      }
      const venta = await Api.registrarVenta(
        cart.map((i) => ({ codigo: i.code, cantidad: i.qty })),
        payment / 100,
        "efectivo",
      );
      $("#ticket").hidden = false;
      table(
        "#ticket-detalle",
        ["Concepto", "Detalle"],
        [
          ["Folio", venta.numeroV],
          ["Fecha", new Date().toLocaleString("es-MX")],
          ...venta.lineas.map((l) => [
            `${l.cantidad} × ${l.producto}`,
            money(aCentavos(l.total)),
          ]),
          ["Total", money(aCentavos(venta.total))],
          ["Pago", money(payment)],
          ["Cambio", money(aCentavos(venta.cambio))],
        ],
      );
      cart = [];
      $("#checkout-form").reset();
      message("Venta registrada y existencias actualizadas.");
    } catch (error) {
      message(error.message, true);
    } finally {
      try {
        await refresh();
      } catch {
        // Si falla la lectura, se conserva lo que ya estaba en pantalla.
      }
      render();
    }
  });
  $("#imprimir-ticket").addEventListener("click", () => window.print());
  render();
};
