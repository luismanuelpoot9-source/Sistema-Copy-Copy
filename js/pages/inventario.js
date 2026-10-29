// Aquí se agregan, editan y buscan los productos.
window.CopyCopy = window.CopyCopy || { pages: {} };
window.CopyCopy.pages.inventario = ({
  $,
  db,
  save,
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
          button("Eliminar", () => {
            if (
              confirm(
                `¿Eliminar ${p.name} del inventario? Las ventas registradas se conservarán.`,
              )
            ) {
              const next = structuredClone(db);
              next.products = next.products.filter((x) => x.code !== p.code);
              if (save(next)) {
                if (editing === p.code) reset();
                render();
                message("Producto eliminado.");
              }
            }
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
            () => {
              const next = structuredClone(db);
              next.products.find((x) => x.code === p.code).favorite =
                !p.favorite;
              if (save(next)) render();
            },
            `Cambiar favorito: ${p.name}`,
          ),
          actions,
        ];
      }),
    );
  }
  $("#product-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const p = {
      code: $("#codigo").value.trim().toUpperCase(),
      name: $("#nombre").value.trim(),
      category: $("#categoria").value.trim(),
      stock: Number($("#unidades").value),
      price: Math.round(Number($("#precio").value) * 100),
      favorite: false,
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
    const next = structuredClone(db);
    if (editing) {
      const i = next.products.findIndex((x) => x.code === editing);
      p.favorite = next.products[i].favorite;
      next.products[i] = p;
    } else next.products.push(p);
    if (save(next)) {
      reset();
      render();
      message("Producto guardado.");
    }
  });
  $("#cancelar-edicion").addEventListener("click", reset);
  $("#search-input").addEventListener("input", render);
  $("#solo-favoritos").addEventListener("change", render);
  render();
};
