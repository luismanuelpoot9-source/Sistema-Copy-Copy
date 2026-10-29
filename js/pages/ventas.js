// El carrito se revisa antes de cobrar para no vender más de lo disponible.
window.CopyCopy = window.CopyCopy || { pages: {} };
window.CopyCopy.pages.ventas = ({
  $,
  db,
  save,
  money,
  day,
  message,
  table,
  button,
  key,
}) => {
  let cart = [];
  const total = () => cart.reduce((n, i) => n + i.price * i.qty, 0);
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
  $("#checkout-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const payment = Math.round(Number($("#pago").value) * 100);
    if (!cart.length || !Number.isSafeInteger(payment) || payment < total()) {
      message("El pago debe cubrir el total de la venta.", true);
      return;
    }
    // Leer otra vez para evitar descontar sobre existencias antiguas.
    let next;
    try {
      next = JSON.parse(localStorage.getItem(key));
    } catch {
      message("No se pudieron leer las existencias.", true);
      return;
    }
    if (
      !next ||
      cart.some((i) => {
        const p = next.products.find((p) => p.code === i.code);
        return !p || p.stock < i.qty || p.price !== i.price;
      })
    ) {
      message(
        "Cambió el precio o las existencias. Recarga la página y revisa el carrito.",
        true,
      );
      return;
    }
    const sale = {
      id: `V-${String(next.sales.length + 1).padStart(6, "0")}`,
      created: new Date().toISOString(),
      date: day(),
      items: structuredClone(cart),
      total: total(),
      payment,
      change: payment - total(),
    };
    cart.forEach(
      (i) => (next.products.find((p) => p.code === i.code).stock -= i.qty),
    );
    next.sales.push(sale);
    if (!save(next)) return;
    $("#ticket").hidden = false;
    table(
      "#ticket-detalle",
      ["Concepto", "Detalle"],
      [
        ["Folio", sale.id],
        ["Fecha", new Date(sale.created).toLocaleString("es-MX")],
        ...sale.items.map((i) => [
          `${i.qty} × ${i.name}`,
          money(i.qty * i.price),
        ]),
        ["Total", money(sale.total)],
        ["Pago", money(payment)],
        ["Cambio", money(sale.change)],
      ],
    );
    cart = [];
    $("#checkout-form").reset();
    render();
    message("Venta registrada y existencias actualizadas.");
  });
  $("#imprimir-ticket").addEventListener("click", () => window.print());
  render();
};
