// Migración: columna para_todos + tabla error_vistos en errores.db
//
// Uso manual (local o en el servidor con la ruta real de data/):
//   npm run migrate:errores
//   node migrate_errores_para_todos.js "/ruta/al/data/errores.db"
//
// En Hostinger NO corre en postinstall: la carpeta data/ vive en el servidor
// (persistente) y no en el clon de GitHub usado durante npm install.
// Las migraciones se aplican al arrancar server.js (migrateErroresDbAtBoot).
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { dbPath } = require('./lib/paths');

const DB_PATH = process.argv[2]
  ? path.resolve(process.argv[2])
  : dbPath('errores.db');

function ensureDataDir() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('[migrate_errores] directorio creado:', dir);
  }
}

function run(db, sql, p = []) {
  return new Promise((res, rej) => db.run(sql, p, function (e) { e ? rej(e) : res(this); }));
}
function all(db, sql, p = []) {
  return new Promise((res, rej) => db.all(sql, p, (e, r) => e ? rej(e) : res(r)));
}

async function safeAddColumn(db, sql) {
  try {
    await run(db, sql);
  } catch (e) {
    if (!/duplicate column name/i.test(e.message)) throw e;
  }
}

(async () => {
  ensureDataDir();
  const dbExists = fs.existsSync(DB_PATH);
  if (!dbExists) {
    console.log('[migrate_errores] BD no encontrada, se creará:', DB_PATH);
  }
  console.log('[migrate_errores] inicio', JSON.stringify({ dbPath: DB_PATH, existed: dbExists }));

  const db = await new Promise((res, rej) => {
    const d = new sqlite3.Database(DB_PATH, err => err ? rej(err) : res(d));
  });

  try {
    await run(db, `CREATE TABLE IF NOT EXISTS errores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL,
      nombre TEXT NOT NULL,
      seccion TEXT NOT NULL DEFAULT '',
      descripcion TEXT NOT NULL,
      solucion TEXT DEFAULT '',
      resuelto INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )`);
    await safeAddColumn(db, `ALTER TABLE errores ADD COLUMN hora TEXT DEFAULT '12:12:12'`);
    await safeAddColumn(db, `ALTER TABLE errores ADD COLUMN empleado_id INTEGER DEFAULT NULL`);
    await safeAddColumn(db, `ALTER TABLE errores ADD COLUMN notificado_salida INTEGER DEFAULT 0`);
    await safeAddColumn(db, 'ALTER TABLE errores ADD COLUMN para_todos INTEGER DEFAULT 0');
    await run(db, `CREATE TABLE IF NOT EXISTS error_vistos (
      error_id INTEGER NOT NULL,
      empleado_id INTEGER NOT NULL,
      visto_at TEXT DEFAULT (datetime('now','localtime')),
      PRIMARY KEY (error_id, empleado_id)
    )`);

    const cols = await all(db, 'PRAGMA table_info(errores)');
    const colNames = cols.map(c => c.name);
    const hasParaTodos = colNames.includes('para_todos');
    console.log('[migrate_errores] completado', JSON.stringify({ hasParaTodos, columns: colNames }));

    if (!hasParaTodos) {
      console.error('[migrate_errores] FALTA columna para_todos');
      process.exit(1);
    }
  } finally {
    await new Promise((res, rej) => db.close(err => err ? rej(err) : res()));
  }
})().catch(e => {
  console.error('[migrate_errores] Error:', e.message);
  process.exit(1);
});
