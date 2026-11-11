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
  function render() {
    const selected = $("#producto").value;
    $("#producto").replaceChildren(new Option("Selecciona un producto", ""));
    db.products
      .filter((p) => p.stock > 0 && p.price > 0)
      .forEach((p) =>
        $("#producto").add(
          new Option(
            `${p.code} · ${p.name} · ${money(p.price)} · ${p.stock} disponibles`,
            p.code,
          ),
        ),
      );
    $("#producto").value = selected;
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
    const p = db.products.find((p) => p.code === $("#producto").value),
      qty = Number($("#cantidad").value),
      item = cart.find((i) => i.code === p?.code);
    if (
      !p ||
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
    message("Producto agregado al carrito.");
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
