<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

exigir_sesion();
$metodo = exigir_metodo(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
$pdo = db();

const SELECT_PRODUCTO = 'SELECT codigo, producto AS nombre, categoria, unidades, precio, favorito, estado, fechaact FROM inventario';

function formatear(array $r): array
{
    $r['unidades'] = (int) $r['unidades'];
    $r['precio'] = $r['precio'] === null ? null : (float) $r['precio'];
    $r['favorito'] = (bool) $r['favorito'];
    return $r;
}

function leer_producto(array $b, string $codigo): array
{
    $nombre = trim((string) ($b['nombre'] ?? ''));
    $categoria = trim((string) ($b['categoria'] ?? ''));
    $unidades = filter_var($b['unidades'] ?? null, FILTER_VALIDATE_INT);
    $precioCrudo = $b['precio'] ?? null;

    if ($codigo === '' || mb_strlen($codigo) > 40) throw new HttpError(400, 'Código inválido');
    if ($nombre === '' || mb_strlen($nombre) > 150) throw new HttpError(400, 'Nombre inválido');
    if ($categoria === '' || mb_strlen($categoria) > 80) throw new HttpError(400, 'Categoría inválida');
    if ($unidades === false || $unidades < 0 || $unidades > 1000000) throw new HttpError(400, 'Existencias inválidas');
    if (!is_numeric($precioCrudo)) throw new HttpError(400, 'Precio inválido');
    $precio = round((float) $precioCrudo, 2);
    if ($precio <= 0 || $precio > 1000000) throw new HttpError(400, 'Precio inválido');

    return [
        'nombre' => $nombre,
        'categoria' => $categoria,
        'unidades' => $unidades,
        'precio' => $precio,
        'estado' => $unidades > 0 ? 'disponible' : 'agotado',
    ];
}

function obtener(PDO $pdo, string $codigo): array
{
    $st = $pdo->prepare(SELECT_PRODUCTO . ' WHERE codigo = ?');
    $st->execute([$codigo]);
    $fila = $st->fetch();
    if (!$fila) throw new HttpError(404, 'Producto no encontrado');
    return formatear($fila);
}

$codigo = mb_strtoupper(trim((string) ($_GET['codigo'] ?? '')));

if ($metodo === 'GET') {
    $filas = $pdo->query(SELECT_PRODUCTO . ' ORDER BY producto')->fetchAll();
    responder(array_map('formatear', $filas));
}

if ($metodo === 'POST') {
    $b = cuerpo();
    $codigo = mb_strtoupper(trim((string) ($b['codigo'] ?? '')));
    $p = leer_producto($b, $codigo);
    try {
        $st = $pdo->prepare(
            'INSERT INTO inventario (codigo, producto, categoria, unidades, precio, estado, fechaact)
             VALUES (?, ?, ?, ?, ?, ?, CURDATE())'
        );
        $st->execute([$codigo, $p['nombre'], $p['categoria'], $p['unidades'], $p['precio'], $p['estado']]);
    } catch (PDOException $e) {
        if (es_duplicado($e)) throw new HttpError(409, 'Ya existe un producto con ese código');
        throw $e;
    }
    responder(obtener($pdo, $codigo), 201);
}

if ($codigo === '') throw new HttpError(400, 'Falta el parámetro codigo');

if ($metodo === 'PUT') {
    $p = leer_producto(cuerpo(), $codigo);
    $st = $pdo->prepare(
        'UPDATE inventario
            SET producto = ?, categoria = ?, unidades = ?, precio = ?, estado = ?, fechaact = CURDATE()
          WHERE codigo = ?'
    );
    $st->execute([$p['nombre'], $p['categoria'], $p['unidades'], $p['precio'], $p['estado'], $codigo]);
    if ($st->rowCount() === 0) throw new HttpError(404, 'Producto no encontrado');
    responder(obtener($pdo, $codigo));
}

if ($metodo === 'PATCH') { // marcar o quitar favorito
    $st = $pdo->prepare('UPDATE inventario SET favorito = ? WHERE codigo = ?');
    $st->execute([empty(cuerpo()['favorito']) ? 0 : 1, $codigo]);
    if ($st->rowCount() === 0) throw new HttpError(404, 'Producto no encontrado');
    responder(['ok' => true]);
}

// DELETE
$st = $pdo->prepare('DELETE FROM inventario WHERE codigo = ?');
$st->execute([$codigo]);
if ($st->rowCount() === 0) throw new HttpError(404, 'Producto no encontrado');
responder(['ok' => true]);
