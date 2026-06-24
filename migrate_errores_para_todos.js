// Migración: columna para_todos + tabla error_vistos en errores.db
// Se ejecuta en prestart/postinstall y también puede correrse manualmente.
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'errores.db');
const DEBUG_LOG = path.join(__dirname, 'debug-395de7.log');

function log395(msg, data) {
  const entry = { sessionId: '395de7', location: 'migrate_errores_para_todos.js', message: msg, data, timestamp: Date.now() };
  // #region agent log
  try { fs.appendFileSync(DEBUG_LOG, JSON.stringify(entry) + '\n'); } catch (_) {}
  // #endregion
  console.log('[migrate_errores]', msg, data ? JSON.stringify(data) : '');
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
  log395('inicio', { dbPath: DB_PATH, dbExists: fs.existsSync(DB_PATH) });

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
    log395('completado', { hasParaTodos, columns: colNames });

    if (!hasParaTodos) {
      console.error('[migrate_errores] FALTA columna para_todos');
      process.exit(1);
    }
  } finally {
    await new Promise((res, rej) => db.close(err => err ? rej(err) : res()));
  }
})().catch(e => {
  log395('error', { message: e.message });
  console.error('[migrate_errores] Error:', e.message);
  process.exit(1);
});
