// Capa de datos: traduce entre la API PHP (pesos, nombres de la base de datos)
// y el formato interno de las pantallas (importes en centavos).
(() => {
  "use strict";
  const centavos = (pesos) => Math.round(Number(pesos) * 100);

  const aProducto = (p) => ({
    code: p.codigo,
    name: p.nombre,
    category: p.categoria,
    stock: p.unidades,
    price: p.precio == null ? 0 : centavos(p.precio),
    favorite: !!p.favorito,
  });

  const aVenta = (v) => ({
    id: v.numeroV,
    date: v.fecha,
    total: centavos(v.total),
    method: v.tipopago,
    items: v.lineas.map((l) => ({
      name: l.producto,
      qty: l.cantidad,
      price: centavos(l.pu),
    })),
  });

  window.Datos = {
    // Productos y ventas desde MySQL. Las ventas quedan de la más antigua a la más reciente.
    async cargar() {
      const [productos, ventas] = await Promise.all([
        Api.productos(),
        Api.ventas(),
      ]);
      return {
        products: productos.map(aProducto),
        sales: ventas.map(aVenta).reverse(),
      };
    },
    // Producto del formulario (centavos) → cuerpo que espera la API (pesos).
    aApi: (p) => ({
      codigo: p.code,
      nombre: p.name,
      categoria: p.category,
      unidades: p.stock,
      precio: p.price / 100,
    }),
  };
})();
