<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

exigir_metodo(['POST']);
$b = cuerpo();
$usuario = trim((string) ($b['usuario'] ?? ''));
$clave = (string) ($b['clave'] ?? '');
$recordar = !empty($b['recordar']);

if ($usuario === '' || $clave === '') {
    throw new HttpError(400, 'Escribe usuario y contraseña');
}

$st = db()->prepare(
    'SELECT u.IDusuario, u.Nombre, u.`Contraseña` AS guardada, e.ClaveE
       FROM usuario u
       LEFT JOIN empleados e ON e.IDusuario = u.IDusuario
      WHERE u.Nombre = ? LIMIT 1'
);
$st->execute([$usuario]);
$u = $st->fetch();

$ok = false;
if ($u) {
    $guardada = (string) $u['guardada'];
    if (str_starts_with($guardada, '$2')) {
        $ok = password_verify($clave, $guardada);
    } elseif (hash_equals($guardada, $clave)) {
        // Contraseña antigua en texto plano: se acepta y se convierte a hash.
        $ok = true;
        $up = db()->prepare('UPDATE usuario SET `Contraseña` = ? WHERE IDusuario = ?');
        $up->execute([password_hash($clave, PASSWORD_BCRYPT), $u['IDusuario']]);
    }
}

if (!$ok) {
    usleep(300000); // frena un poco los intentos de adivinar contraseñas
    throw new HttpError(401, 'Usuario o contraseña incorrectos');
}

session_regenerate_id(true);
$_SESSION['usuario'] = [
    'id' => (int) $u['IDusuario'],
    'nombre' => $u['Nombre'],
    'claveE' => $u['ClaveE'],
];

if ($recordar) { // "Mantener sesión": la cookie dura 7 días
    setcookie(session_name(), session_id(), [
        'expires' => time() + 7 * 24 * 60 * 60,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

responder($_SESSION['usuario']);
