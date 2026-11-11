<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

exigir_metodo(['GET']);
responder(exigir_sesion());
