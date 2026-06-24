<?php
/**
 * Migración one-shot para errores.db en Hostinger (sin SSH ni redeploy Node).
 * Subir este archivo a public_html y abrir en el navegador UNA vez.
 * URL: https://sistemabelu.beluchicharroneria.com/hostinger-migrate-errores.php?key=belu-migrate-2026
 */
header('Content-Type: application/json; charset=utf-8');

const MIGRATE_KEY = 'belu-migrate-2026';

if (($_GET['key'] ?? '') !== MIGRATE_KEY) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Forbidden — clave incorrecta']);
    exit;
}

if (!class_exists('SQLite3')) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'SQLite3 no disponible en PHP']);
    exit;
}

$candidates = [
    __DIR__ . '/../nodejs/data/errores.db',
    __DIR__ . '/nodejs/data/errores.db',
    dirname(__DIR__) . '/nodejs/data/errores.db',
];

$dbPath = null;
foreach ($candidates as $path) {
    if (is_file($path)) {
        $dbPath = $path;
        break;
    }
}

if (!$dbPath) {
    http_response_code(404);
    echo json_encode([
        'ok' => false,
        'error' => 'errores.db no encontrada',
        'tried' => $candidates,
    ]);
    exit;
}

try {
    $db = new SQLite3($dbPath);

    $db->exec('CREATE TABLE IF NOT EXISTS errores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha TEXT NOT NULL,
        nombre TEXT NOT NULL,
        seccion TEXT NOT NULL DEFAULT "",
        descripcion TEXT NOT NULL,
        solucion TEXT DEFAULT "",
        resuelto INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime("now","localtime"))
    )');

    $columns = [];
    $res = $db->query('PRAGMA table_info(errores)');
    while ($row = $res->fetchArray(SQLITE3_ASSOC)) {
        $columns[] = $row['name'];
    }

    $added = [];
    $alters = [
        'hora' => 'ALTER TABLE errores ADD COLUMN hora TEXT DEFAULT "12:12:12"',
        'empleado_id' => 'ALTER TABLE errores ADD COLUMN empleado_id INTEGER DEFAULT NULL',
        'notificado_salida' => 'ALTER TABLE errores ADD COLUMN notificado_salida INTEGER DEFAULT 0',
        'para_todos' => 'ALTER TABLE errores ADD COLUMN para_todos INTEGER DEFAULT 0',
    ];

    foreach ($alters as $name => $sql) {
        if (!in_array($name, $columns, true)) {
            $db->exec($sql);
            $added[] = $name;
        }
    }

    $db->exec('CREATE TABLE IF NOT EXISTS error_vistos (
        error_id INTEGER NOT NULL,
        empleado_id INTEGER NOT NULL,
        visto_at TEXT DEFAULT (datetime("now","localtime")),
        PRIMARY KEY (error_id, empleado_id)
    )');

    $columnsAfter = [];
    $res2 = $db->query('PRAGMA table_info(errores)');
    while ($row = $res2->fetchArray(SQLITE3_ASSOC)) {
        $columnsAfter[] = $row['name'];
    }

    $db->close();

    echo json_encode([
        'ok' => true,
        'message' => 'Migración completada',
        'dbPath' => $dbPath,
        'addedColumns' => $added,
        'hasParaTodos' => in_array('para_todos', $columnsAfter, true),
        'columns' => $columnsAfter,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage(), 'dbPath' => $dbPath]);
}
