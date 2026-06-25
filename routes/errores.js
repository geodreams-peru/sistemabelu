const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path    = require('path');
const fs      = require('fs');

const router = express.Router();
const { dbPath } = require('../lib/paths');
const { openDatabase, shouldMigrate } = require('../lib/db');

// ─── BASE DE DATOS ───────────────────────────────────────────────
const DB_PATH = dbPath('errores.db');
const ASIST_DB_PATH = dbPath('asistencia.db');
const SCHEMA_VERSION = 2;

const db = openDatabase('errores.db', err => {
  if (err) { console.error('✗ errores.db error:', err.message); return; }
  console.log('  ✓ errores.db conectada');
});

const asistDb = openDatabase('asistencia.db', err => {
  if (err) { console.error('✗ asistencia.db (errores aux) error:', err.message); return; }
});

// ─── HELPERS (declarados antes del schema) ───────────────────────
const run = (sql, p=[]) => new Promise((res,rej) => db.run(sql, p, function(e){ e ? rej(e) : res(this); }));
const all = (sql, p=[]) => new Promise((res,rej) => db.all(sql, p, (e,r) => e ? rej(e) : res(r)));
const get = (sql, p=[]) => new Promise((res,rej) => db.get(sql,  p, (e,r) => e ? rej(e) : res(r)));

let erroresSchemaReady = null;

async function safeAddColumn(sql) {
  try {
    await run(sql);
  } catch (e) {
    if (!/duplicate column name/i.test(e.message)) throw e;
  }
}

async function getErroresColumnNames() {
  const cols = await all('PRAGMA table_info(errores)');
  return cols.map(c => c.name);
}

async function runErroresMigrations() {
  await run(`CREATE TABLE IF NOT EXISTS errores (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha       TEXT NOT NULL,
    nombre      TEXT NOT NULL,
    seccion     TEXT NOT NULL DEFAULT '',
    descripcion TEXT NOT NULL,
    solucion    TEXT DEFAULT '',
    resuelto    INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now','localtime'))
  )`);
  await safeAddColumn(`ALTER TABLE errores ADD COLUMN hora TEXT DEFAULT '12:12:12'`);
  await safeAddColumn(`ALTER TABLE errores ADD COLUMN empleado_id INTEGER DEFAULT NULL`);
  await safeAddColumn(`ALTER TABLE errores ADD COLUMN notificado_salida INTEGER DEFAULT 0`);
  await safeAddColumn(`ALTER TABLE errores ADD COLUMN para_todos INTEGER DEFAULT 0`);
  await run(`CREATE TABLE IF NOT EXISTS error_vistos (
    error_id INTEGER NOT NULL,
    empleado_id INTEGER NOT NULL,
    visto_at TEXT DEFAULT (datetime('now','localtime')),
    PRIMARY KEY (error_id, empleado_id)
  )`);

  const colNames = await getErroresColumnNames();
  if (!colNames.includes('para_todos')) {
    throw new Error('Migración fallida: falta columna para_todos');
  }
}

async function ensureErroresSchema() {
  if (!erroresSchemaReady) {
    if (!shouldMigrate()) { erroresSchemaReady = Promise.resolve(); return erroresSchemaReady; }
    erroresSchemaReady = runErroresMigrations().catch(err => {
      erroresSchemaReady = null;
      throw err;
    });
  }
  return erroresSchemaReady;
}

async function getErroresSchemaInfo() {
  await ensureErroresSchema();
  const columns = await getErroresColumnNames();
  return {
    dbPath: DB_PATH,
    dbExists: fs.existsSync(DB_PATH),
    schemaVersion: SCHEMA_VERSION,
    hasParaTodos: columns.includes('para_todos'),
    columns
  };
}

async function insertarError({ fecha, hora, empleado_id, nombre, seccion, descripcion, solucion, paraTodos }) {
  const cols = await getErroresColumnNames();
  if (!cols.includes('para_todos')) {
    await safeAddColumn('ALTER TABLE errores ADD COLUMN para_todos INTEGER DEFAULT 0');
  }
  const cols2 = await getErroresColumnNames();
  if (cols2.includes('para_todos')) {
    return run(
      `INSERT INTO errores (fecha, hora, empleado_id, nombre, seccion, descripcion, solucion, notificado_salida, para_todos)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [fecha, hora, empleado_id, nombre, seccion, descripcion, solucion, 0, paraTodos ? 1 : 0]
    );
  }
  return run(
    `INSERT INTO errores (fecha, hora, empleado_id, nombre, seccion, descripcion, solucion, notificado_salida)
     VALUES (?,?,?,?,?,?,?,0)`,
    [fecha, hora, empleado_id, nombre, seccion, descripcion, solucion]
  );
}

router.get('/schema-check', async (_req, res) => {
  try {
    const info = await getErroresSchemaInfo();
    res.json({ ok: true, message: 'Schema migrado correctamente', ...info });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.use(async (_req, res, next) => {
  try {
    await ensureErroresSchema();
    next();
  } catch (e) {
    console.error('[errores] schema migration:', e.message);
    res.status(500).json({ error: e.message });
  }
});

const NOMBRE_TODOS = 'Todos los embajadores';

function esParaTodos(empleadoId) {
  return String(empleadoId || '').toLowerCase() === 'todos';
}

// ─── MIDDLEWARES ─────────────────────────────────────────────────
function auth(req, res, next) {
  if (!req.session?.user) return res.status(401).json({ error: 'No autenticado' });
  if (!req.session.user.modulos.includes('errores')) return res.status(403).json({ error: 'Sin acceso' });
  next();
}

// ─── HELPERS ─────────────────────────────────────────────────────
const asistGet = (sql, p=[]) => new Promise((res,rej) => asistDb.get(sql, p, (e,r) => e ? rej(e) : res(r)));
const asistAll = (sql, p=[]) => new Promise((res,rej) => asistDb.all(sql, p, (e,r) => e ? rej(e) : res(r || [])));

async function resolverEmbajador(empleadoId) {
  const id = Number(empleadoId);
  if (!id) throw new Error('Embajador requerido');
  const emp = await asistGet(
    'SELECT id, nombre, apellido FROM empleados WHERE id=? AND activo=1',
    [id]
  );
  if (!emp) throw new Error('Embajador no encontrado o inactivo');
  return { id: emp.id, nombre: `${emp.nombre} ${emp.apellido}`.trim() };
}

// ─── RUTAS ───────────────────────────────────────────────────────

router.get('/embajadores', auth, async (_req, res) => {
  try {
    const rows = await asistAll(
      'SELECT id, nombre, apellido, documento, cargo FROM empleados WHERE activo=1 ORDER BY apellido, nombre'
    );
    const embajadores = rows.map(e => ({
      id: e.id,
      nombre_completo: `${e.nombre} ${e.apellido}`.trim(),
      documento: e.documento,
      cargo: e.cargo || ''
    }));
    res.json({ ok: true, embajadores });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const mes = new Date().toISOString().slice(0,7);
    const [total, sinResolver, porSeccion, ultimosMes] = await Promise.all([
      get('SELECT COUNT(*) as c FROM errores'),
      get('SELECT COUNT(*) as c FROM errores WHERE resuelto=0'),
      all(`SELECT seccion, COUNT(*) as qty FROM errores WHERE fecha LIKE ?
           GROUP BY seccion ORDER BY qty DESC`, [`${mes}%`]),
      get(`SELECT COUNT(*) as c FROM errores WHERE fecha LIKE ?`, [`${mes}%`])
    ]);
    res.json({ total: total.c, sinResolver: sinResolver.c, porSeccion, ultimosMes: ultimosMes.c });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/', auth, async (req, res) => {
  try {
    const { desde, hasta, nombre, seccion, resuelto } = req.query;
    let sql = 'SELECT * FROM errores WHERE 1=1';
    const p = [];
    if (desde)              { sql += ' AND fecha >= ?'; p.push(desde); }
    if (hasta)              { sql += ' AND fecha <= ?'; p.push(hasta); }
    if (nombre)             { sql += ' AND LOWER(nombre) LIKE ?'; p.push(`%${nombre.toLowerCase()}%`); }
    if (seccion)            { sql += ' AND seccion = ?'; p.push(seccion); }
    if (resuelto !== undefined && resuelto !== '') { sql += ' AND resuelto = ?'; p.push(Number(resuelto)); }
    sql += ' ORDER BY fecha DESC, id DESC';
    const rows = await all(sql, p);
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { fecha, empleado_id, seccion='', descripcion, solucion='' } = req.body;
    if (!fecha || !descripcion)
      return res.status(400).json({ error: 'Campos requeridos: fecha, embajador, descripcion' });
    if (!empleado_id)
      return res.status(400).json({ error: 'Embajador requerido' });

    const hora = new Date().toTimeString().slice(0, 8);
    let r;

    if (esParaTodos(empleado_id)) {
      r = await insertarError({
        fecha, hora, empleado_id: null, nombre: NOMBRE_TODOS,
        seccion: String(seccion).trim(), descripcion: descripcion.trim(),
        solucion: solucion.trim(), paraTodos: true
      });
    } else {
      const embajador = await resolverEmbajador(empleado_id);
      r = await insertarError({
        fecha, hora, empleado_id: embajador.id, nombre: embajador.nombre,
        seccion: String(seccion).trim(), descripcion: descripcion.trim(),
        solucion: solucion.trim(), paraTodos: false
      });
    }
    res.json({ ok: true, id: r.lastID });
  } catch(e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { fecha, empleado_id, seccion, descripcion, solucion, resuelto } = req.body;
    if (!fecha || !descripcion)
      return res.status(400).json({ error: 'Campos requeridos: fecha, descripcion' });
    if (!empleado_id)
      return res.status(400).json({ error: 'Embajador requerido' });

    const actual = await get(
      'SELECT COALESCE(para_todos, 0) AS para_todos FROM errores WHERE id=?',
      [req.params.id]
    );
    if (!actual) return res.status(404).json({ error: 'Error no encontrado' });

    const seraTodos = esParaTodos(empleado_id);
    const eraTodos = actual.para_todos === 1;
    if (seraTodos !== eraTodos) {
      await run('DELETE FROM error_vistos WHERE error_id=?', [req.params.id]);
    }

    if (seraTodos) {
      await run(
        `UPDATE errores SET fecha=?, empleado_id=NULL, nombre=?, seccion=?, descripcion=?, solucion=?, resuelto=?, para_todos=1, notificado_salida=0
         WHERE id=?`,
        [
          fecha,
          NOMBRE_TODOS,
          seccion?.trim() || '',
          descripcion.trim(),
          solucion?.trim() || '',
          resuelto ? 1 : 0,
          req.params.id
        ]
      );
    } else {
      const embajador = await resolverEmbajador(empleado_id);
      await run(
        `UPDATE errores SET fecha=?, empleado_id=?, nombre=?, seccion=?, descripcion=?, solucion=?, resuelto=?, para_todos=0, notificado_salida=0
         WHERE id=?`,
        [
          fecha,
          embajador.id,
          embajador.nombre,
          seccion?.trim() || '',
          descripcion.trim(),
          solucion?.trim() || '',
          resuelto ? 1 : 0,
          req.params.id
        ]
      );
    }
    res.json({ ok: true });
  } catch(e) { res.status(400).json({ error: e.message }); }
});

router.patch('/:id/resolver', auth, async (req, res) => {
  try {
    const { resuelto, solucion='' } = req.body;
    await run('UPDATE errores SET resuelto=?,solucion=? WHERE id=?',
      [resuelto?1:0, solucion.trim(), req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await run('DELETE FROM error_vistos WHERE error_id=?', [req.params.id]);
    await run('DELETE FROM errores WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
module.exports.ensureErroresSchema = ensureErroresSchema;
module.exports.getErroresSchemaInfo = getErroresSchemaInfo;
