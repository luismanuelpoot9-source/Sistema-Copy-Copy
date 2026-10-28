# Papelería Copy Copy

Aplicación local en HTML, CSS y JavaScript. El login está separado del menú interno.

## Abrir

Desde esta carpeta ejecuta `python -m http.server 8765 --bind 127.0.0.1` y abre http://127.0.0.1:8765/login.html.

Acceso de demostración: usuario **admin**, contraseña **copycopy123**. No se guardan ni se envían contraseñas en la URL. La opción de mantener sesión usa almacenamiento local; sin ella la sesión se conserva en la pestaña. Cerrar sesión no elimina productos ni ventas.

## Organización

- `index.html`: entrada al sistema.
- `login.html`: inicio de sesión (`login.html.html` conserva el acceso anterior).
- `panel.html`, `menu.html`, `inventario.html`, `ventas.html`, `reportes.html`: pantallas del sistema.
- `css/`: estilos, navegación, animaciones e iconos. `panel.css` conserva el diseño anterior como referencia.
- `js/`: sesión de demostración, datos iniciales, funciones del sistema y efectos visuales.
- `assets/`: logo original e iconos SVG locales.
- `tests/`: verificaciones de navegador y accesibilidad de movimiento.

## Funciones

- Inventario: agregar, editar, eliminar, buscar y marcar favoritos. Los 20 productos iniciales conservan sus existencias; debes asignarles precio antes de venderlos.
- Ventas: carrito, validación de existencias y pago, cambio, comprobante imprimible y descuento de stock.
- Inicio: cifras y ventas reales de los datos locales, sin totales ficticios.
- Interfaz: navegación con iconos, logo de Copy Copy, diseño adaptable y animaciones que respetan la preferencia de movimiento reducido.
- Reportes: ventas, productos vendidos e inventario actual; filtro de fechas, impresión y CSV compatible con Excel.

Los datos se guardan en localStorage del navegador y origen utilizados. Borrar los datos del navegador los elimina. El acceso es una demostración del flujo, no autenticación segura: para producción o uso multiusuario hacen falta servidor, base de datos y autenticación real. Se avisa al cambiar datos desde otra pestaña; no hay transacciones multiusuario.

## Verificación

Con el servidor local en el puerto 8765, Node.js, Playwright y Microsoft Edge disponibles, ejecuta `node tests/browser.cjs`. Si Playwright está fuera del proyecto, establece NODE_PATH a la carpeta de módulos correspondiente. Las pruebas usan un contexto de navegador aislado y no modifican los datos del usuario.

Para comprobar las animaciones ejecuta también `node tests/animaciones.cjs`.

La conexión a una base de datos queda pendiente para una siguiente etapa.

## Mantenimiento del código

La navegación se define una sola vez en `js/components/navigation.js`.
`js/pages/` contiene un controlador por pantalla: inicio, inventario, ventas y reportes.
`js/sistema.js` inicializa los datos y ofrece utilidades compartidas (tablas, botones, importes, avisos y resumen) a esos controladores.
Los scripts se cargan con `defer`: navegación, sesión, datos, controlador y arranque; después se aplican los efectos visuales.
`css/tema.css` centraliza los colores del logo y la interacción común de los controles.
Para agregar una pantalla, crea su controlador en `js/pages/`, cárgalo antes de `js/sistema.js` y añade su enlace a la plantilla de navegación.

Limpieza: se retiró el CSS del panel anterior, el menú carga solo sus scripts y los precios comparten un único formato. El acceso `login.html.html` se conserva únicamente para redirigir enlaces antiguos.
