<?php
declare(strict_types=1);

// Requiere PHP 8.1+ con la extensión pdo_mysql activa.
if (!is_file(__DIR__ . '/../config.php')) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Falta config.php (copia config.example.php y ajusta tus datos).']);
    exit;
}
$CONFIG = require __DIR__ . '/../config.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

ini_set('session.gc_maxlifetime', (string) (7 * 24 * 60 * 60));
session_name('copycopy_sid');
session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax']);
session_start();

class HttpError extends Exception
{
    public function __construct(public int $status, string $message)
    {
        parent::__construct($message);
    }
}

function responder(mixed $datos, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

set_exception_handler(function (Throwable $e): void {
    if ($e instanceof HttpError) {
        responder(['error' => $e->getMessage()], $e->status);
    }
    error_log($e->getMessage() . ' en ' . $e->getFile() . ':' . $e->getLine());
    responder(['error' => 'Error interno del servidor'], 500);
});

function exigir_metodo(array $permitidos): string
{
    $metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (!in_array($metodo, $permitidos, true)) {
        header('Allow: ' . implode(', ', $permitidos));
        throw new HttpError(405, 'Método no permitido');
    }
    return $metodo;
}

function cuerpo(): array
{
    $datos = json_decode((string) file_get_contents('php://input'), true);
    return is_array($datos) ? $datos : [];
}

function exigir_sesion(): array
{
    if (empty($_SESSION['usuario'])) {
        throw new HttpError(401, 'Sesión no iniciada');
    }
    return $_SESSION['usuario'];
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        global $CONFIG;
        $c = $CONFIG['db'];
        $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $c['host'], $c['port'], $c['name']);
        $pdo = new PDO($dsn, $c['user'], $c['pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_FOUND_ROWS => true, // rowCount() = filas encontradas, no solo modificadas
        ]);
    }
    return $pdo;
}

function es_duplicado(PDOException $e): bool
{
    return ($e->errorInfo[1] ?? 0) === 1062;
}
