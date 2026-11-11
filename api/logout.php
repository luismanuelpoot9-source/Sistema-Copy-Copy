<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

exigir_metodo(['POST']);
$_SESSION = [];
$p = session_get_cookie_params();
setcookie(session_name(), '', ['expires' => time() - 3600, 'path' => $p['path'], 'httponly' => true, 'samesite' => 'Lax']);
session_destroy();
responder(['ok' => true]);
