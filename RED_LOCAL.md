# Acceso desde otros equipos de la misma red

Mantén Apache y MariaDB activos en el equipo que aloja Copy Copy. Los clientes solo necesitan un navegador; acceden a la misma base a través de PHP.

En este equipo, el enlace es http://192.168.1.83/Sistema-Copy-Copy-main/ . La IP puede cambiar. Consulta `ipconfig` si deja de responder.

## Apache

Dentro del VirtualHost de `C:\wamp64\bin\apache\apache2.4.62.1\conf\extra\httpd-vhosts.conf`, se agregó este bloque para permitir únicamente la subred local en Copy Copy. El resto de WAMP conserva `Require local`.

```apache
<Directory "${INSTALL_DIR}/www/Sistema-Copy-Copy-main/">
  Options -Indexes
  <RequireAny>
    Require local
    Require ip 192.168.1.0/24
  </RequireAny>
</Directory>
```

## Aplicar firewall y reiniciar Apache

Ejecuta `scripts/Habilitar-CopyCopy-LAN.ps1` en PowerShell como administrador. Permite únicamente HTTP (puerto 80) para Apache desde `192.168.1.0/24`, y reinicia Apache. Adapta las rutas y la subred si cambian. El script no abre MariaDB a otros equipos.

La configuración de Apache ya fue editada en el equipo original y pasó la comprobación de sintaxis. La regla de firewall y el reinicio siguen pendientes de ejecución con permisos de administrador.

Cada equipo inicia sesión con una cuenta registrada en la tabla `usuario`. El proyecto necesita WAMP/PHP y MariaDB; GitHub almacena el código y no ejecuta este servidor.
