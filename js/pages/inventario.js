// Aquí se agregan, editan y buscan los productos (guardados en MySQL).
window.CopyCopy = window.CopyCopy || { pages: {} };
window.CopyCopy.pages.inventario = ({
  $,
  db,
  refresh,
  money,
  message,
  table,
  button,
}) => {
  let editing = null;
  function reset() {
    editing = null;
    $("#product-form").reset();
    $("#codigo").readOnly = false;
    $("#form-title").textContent = "Agregar producto";
    $("#cancelar-edicion").hidden = true;
  }
  // Ejecuta un cambio en el servidor, vuelve a leer MySQL y repinta la tabla.
  async function aplicar(accion, exito) {
    try {
      await accion();
      await refresh();
      render();
      if (exito) message(exito);
      return true;
    } catch (e) {
      message(e.message, true);
      return false;
    }
  }
  function render() {
    const term = $("#search-input").value.toLocaleLowerCase();
    const products = db.products.filter(
      (p) =>
        (!$("#solo-favoritos").checked || p.favorite) &&
        `${p.code} ${p.name} ${p.category}`.toLocaleLowerCase().includes(term),
    );
    table(
      "#productos",
      [
        "Código",
        "Nombre",
        "Categoría",
        "Existencias",
        "Precio",
        "Estado",
        "Favorito",
        "Acciones",
      ],
      products.map((p) => {
        const actions = document.createElement("div");
        actions.append(
          button("Editar", () => {
            editing = p.code;
            $("#codigo").value = p.code;
            $("#codigo").readOnly = true;
            $("#nombre").value = p.name;
            $("#categoria").value = p.category;
            $("#unidades").value = p.stock;
            $("#precio").value = (p.price / 100).toFixed(2);
            $("#form-title").textContent = "Editar producto";
            $("#cancelar-edicion").hidden = false;
            $("#nombre").focus();
          }),
          button("Eliminar", async () => {
            if (
              !confirm(
                `¿Eliminar ${p.name} del inventario? Las ventas registradas se conservarán.`,
              )
            )
              return;
            const ok = await aplicar(
              () => Api.eliminarProducto(p.code),
              "Producto eliminado.",
            );
            if (ok && editing === p.code) reset();
          }),
        );
        return [
          p.code,
          p.name,
          p.category,
          p.stock,
          p.price ? money(p.price) : "Sin precio",
          p.stock === 0
            ? "Agotado"
            : p.stock < 10
              ? "Existencias bajas"
              : "Disponible",
          button(
            p.favorite ? "★" : "☆",
            () => aplicar(() => Api.favorito(p.code, !p.favorite)),
            `Cambiar favorito: ${p.name}`,
          ),
          actions,
        ];
      }),
    );
  }
  $("#product-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const p = {
      code: $("#codigo").value.trim().toUpperCase(),
      name: $("#nombre").value.trim(),
      category: $("#categoria").value.trim(),
      stock: Number($("#unidades").value),
      price: Math.round(Number($("#precio").value) * 100),
    };
    if (
      !p.code ||
      !p.name ||
      !p.category ||
      !Number.isSafeInteger(p.stock) ||
      p.stock < 0 ||
      p.stock > 1000000 ||
      !Number.isSafeInteger(p.price) ||
      p.price <= 0 ||
      p.price > 100000000
    ) {
      message(
        "Completa los campos con existencias enteras y un precio válido.",
        true,
      );
      return;
    }
    if (!editing && db.products.some((x) => x.code === p.code)) {
      message("Ese código ya existe. Usa Editar para modificarlo.", true);
      return;
    }
    const cuerpo = Datos.aApi(p);
    const ok = await aplicar(
      () =>
        editing ? Api.editarProducto(editing, cuerpo) : Api.crearProducto(cuerpo),
      "Producto guardado.",
    );
    if (ok) reset();
  });
  $("#cancelar-edicion").addEventListener("click", reset);
  $("#search-input").addEventListener("input", render);
  $("#solo-favoritos").addEventListener("change", render);
  render();
};
