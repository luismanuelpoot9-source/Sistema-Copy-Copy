# Papelería Copy Copy

Sistema local con interfaz HTML/JavaScript, API PHP y base MariaDB `proyectoc`.

## Uso local

Mantén Apache y MariaDB activos en WAMP y abre http://localhost/Sistema-Copy-Copy-main/login.html . El archivo `.htaccess` permite únicamente las direcciones de bucle local `127.0.0.1` y `::1`. La página no carga fuentes ni servicios externos.

`config.php` conserva la conexión a `127.0.0.1:3307` y queda excluido de Git. En otra instalación, copia `config.example.php` como `config.php` y ajusta la conexión. Se necesita PHP 8.1+ con PDO MySQL y mbstring.

## Base de datos

La base y su contenido permanecen en MariaDB del equipo. Inventario, ventas, reportes y usuarios se consultan mediante la API PHP. Los datos existentes se conservan; no se sustituyen por datos de demostración ni se publican contraseñas en GitHub.

`migracion.sql` es una migración histórica para un esquema anterior: no se debe ejecutar sobre la base actual, que ya contiene esas columnas. Un respaldo de la base se debe guardar fuera de la carpeta pública de Apache.

## Código

- `api/`: sesión, autenticación, productos y ventas.
- `js/pages/`: controladores de las pantallas.
- `js/components/navigation.js`: navegación compartida.
- `css/` y `assets/`: estilos, logo e iconos locales.

GitHub conserva el código; el sistema se ejecuta localmente en WAMP. Las pruebas antiguas de `tests/` incluyen supuestos de la anterior versión con datos del navegador y requieren adaptación antes de usarlas para validar la API actual.
