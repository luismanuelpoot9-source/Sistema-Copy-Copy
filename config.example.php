<?php
// Copia este archivo como "config.php" y ajusta tus datos de MySQL.
// No subas config.php a Git (agrégalo a .gitignore).
// Si alguien abre este archivo en el navegador no se muestra nada: solo devuelve un arreglo.
return [
    'db' => [
        'host' => '127.0.0.1',
        'port' => 3307,
        'name' => 'proyectoc',
        'user' => 'root',
        'pass' => '', // XAMPP: vacío por defecto. Si instalaste MySQL aparte, tu contraseña.
    ],
];
