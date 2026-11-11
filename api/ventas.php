<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$usuario = exigir_sesion();
$metodo = exigir_metodo(['GET', 'POST']);
$pdo = db();

/* ------------------------- Consultar ventas ------------------------- */
if ($metodo === 'GET') {
    $filtros = [];
    $params = [];
    foreach (['desde' => 'p.Fecha >= ?', 'hasta' => 'p.Fecha <= ?'] as $campo => $condicion) {
        $valor = (string) ($_GET[$campo] ?? '');
        if ($valor === '') continue;
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $valor)) {
            throw new HttpError(400, "Fecha $campo inválida");
        }
        $filtros[] = $condicion;
        $params[] = $valor;
    }
    $where = $filtros ? 'WHERE ' . implode(' AND ', $filtros) : '';
    $st = $pdo->prepare(
        "SELECT p.NumeroV, p.Fecha, p.Descuento, p.Subtotal, p.Total, p.Tipopago, p.ClaveE,
                v.Producto, v.Cantidad, v.PU, v.Total AS TotalLinea
           FROM puntoventa p
           LEFT JOIN ventas v ON v.NumeroV = p.NumeroV
           $where
          ORDER BY p.Fecha DESC, p.NumeroV DESC, v.IDventa"
    );
    $st->execute($params);

    $ventas = [];
    foreach ($st as $r) {
        $n = $r['NumeroV'];
        if (!isset($ventas[$n])) {
            $ventas[$n] = [
                'numeroV' => $n,
                'fecha' => $r['Fecha'],
                'descuento' => (float) $r['Descuento'],
                'subtotal' => (float) $r['Subtotal'],
                'total' => (float) $r['Total'],
                'tipopago' => $r['Tipopago'],
                'claveE' => $r['ClaveE'],
                'lineas' => [],
            ];
        }
        if ($r['Producto'] !== null) {
            $ventas[$n]['lineas'][] = [
                'producto' => $r['Producto'],
                'cantidad' => (int) $r['Cantidad'],
                'pu' => (float) $r['PU'],
                'total' => (float) $r['TotalLinea'],
            ];
        }
    }
    responder(array_values($ventas));
}

/* ------------------------- Registrar venta -------------------------- */
$b = cuerpo();
$tipopago = (string) ($b['tipopago'] ?? 'efectivo');
$items = $b['items'] ?? null;

if (empty($usuario['claveE'])) throw new HttpError(403, 'Tu usuario no está ligado a un empleado');
if (!in_array($tipopago, ['efectivo', 'tarjeta', 'transferencia'], true)) throw new HttpError(400, 'Tipo de pago inválido');
if (!is_array($items) || !$items) throw new HttpError(400, 'El carrito está vacío');

// Une renglones repetidos del mismo producto
$pedido = [];
foreach ($items as $it) {
    $codigo = mb_strtoupper(trim((string) ($it['codigo'] ?? '')));
    $cantidad = filter_var($it['cantidad'] ?? null, FILTER_VALIDATE_INT);
    if ($codigo === '' || $cantidad === false || $cantidad < 1 || $cantidad > 1000000) {
        throw new HttpError(400, 'Producto o cantidad inválidos');
    }
    $pedido[$codigo] = ($pedido[$codigo] ?? 0) + $cantidad;
}

$pdo->beginTransaction();
try {
    // Bloquea los productos para que dos ventas simultáneas no vendan el mismo stock
    $codigos = array_map('strval', array_keys($pedido));
    $marcas = implode(',', array_fill(0, count($codigos), '?'));
    $st = $pdo->prepare("SELECT codigo, producto, unidades, precio FROM inventario WHERE codigo IN ($marcas) FOR UPDATE");
    $st->execute($codigos);
    $productos = [];
    foreach ($st as $p) {
        $productos[mb_strtoupper((string) $p['codigo'])] = $p;
    }

    // Importes en centavos (enteros) para evitar errores de redondeo
    $lineas = [];
    $totalCent = 0;
    foreach ($pedido as $codigo => $cantidad) {
        $codigo = (string) $codigo;
        $p = $productos[$codigo] ?? null;
        if (!$p) throw new HttpError(404, "El producto $codigo no existe");
        if ($p['precio'] === null) throw new HttpError(400, "\"{$p['producto']}\" no tiene precio asignado");
        if ((int) $p['unidades'] < $cantidad) {
            throw new HttpError(409, "Existencias insuficientes de \"{$p['producto']}\" (quedan {$p['unidades']})");
        }
        $puCent = (int) round(((float) $p['precio']) * 100);
        $lineaCent = $puCent * $cantidad;
        $totalCent += $lineaCent;
        $lineas[] = [
            'codigo' => $p['codigo'],
            'producto' => $p['producto'],
            'cantidad' => $cantidad,
            'pu' => $puCent / 100,
            'total' => $lineaCent / 100,
        ];
    }

    $cambioCent = 0;
    if ($tipopago === 'efectivo') {
        if (!is_numeric($b['pago'] ?? null)) throw new HttpError(400, 'Escribe el pago recibido');
        $recibidoCent = (int) round(((float) $b['pago']) * 100);
        if ($recibidoCent < $totalCent) throw new HttpError(400, 'El pago recibido es menor al total');
        $cambioCent = $recibidoCent - $totalCent;
    }

    // Siguiente folio: V-0006, V-0007...
    $ultimo = (int) $pdo->query(
        "SELECT COALESCE(MAX(CAST(SUBSTRING(NumeroV, 3) AS UNSIGNED)), 0) FROM puntoventa FOR UPDATE"
    )->fetchColumn();
    $numeroV = 'V-' . str_pad((string) ($ultimo + 1), 4, '0', STR_PAD_LEFT);
    $total = $totalCent / 100;

    $pdo->prepare(
        'INSERT INTO puntoventa (NumeroV, Fecha, Descuento, Subtotal, Total, Tipopago, ClaveE)
         VALUES (?, CURDATE(), 0, ?, ?, ?, ?)'
    )->execute([$numeroV, $total, $total, $tipopago, $usuario['claveE']]);

    $insLinea = $pdo->prepare('INSERT INTO ventas (NumeroV, Producto, Cantidad, PU, Total) VALUES (?, ?, ?, ?, ?)');
    // En MySQL las asignaciones del UPDATE se evalúan de izquierda a derecha:
    // 'estado' ya ve el valor nuevo de 'unidades'.
    $descuenta = $pdo->prepare(
        "UPDATE inventario
            SET unidades = unidades - ?,
                estado = IF(unidades > 0, 'disponible', 'agotado'),
                fechaact = CURDATE()
          WHERE codigo = ?"
    );
    foreach ($lineas as $l) {
        $insLinea->execute([$numeroV, $l['producto'], $l['cantidad'], $l['pu'], $l['total']]);
        $descuenta->execute([$l['cantidad'], $l['codigo']]);
    }

    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    throw $e;
}

responder([
    'numeroV' => $numeroV,
    'total' => $total,
    'cambio' => $cambioCent / 100,
    'tipopago' => $tipopago,
    'lineas' => $lineas,
], 201);
