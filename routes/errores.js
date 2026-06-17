const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path    = require('path');

const router = express.Router();

// ─── BASE DE DATOS ───────────────────────────────────────────────
const DB_PATH = path.join(__dirname, '../data/errores.db');
const ASIST_DB_PATH = path.join(__dirname, '../data/asistencia.db');

const db = new sqlite3.Database(DB_PATH, err => {
  if (err) { console.error('✗ errores.db error:', err.message); return; }
  console.log('  ✓ errores.db conectada');
});

const asistDb = new sqlite3.Database(ASIST_DB_PATH, err => {
  if (err) { console.error('✗ asistencia.db (errores aux) error:', err.message); return; }
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS errores (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha       TEXT NOT NULL,
    nombre      TEXT NOT NULL,
    seccion     TEXT NOT NULL DEFAULT '',
    descripcion TEXT NOT NULL,
    solucion    TEXT DEFAULT '',
    resuelto    INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now','localtime'))
  )`);
  db.run(`ALTER TABLE errores ADD COLUMN hora TEXT DEFAULT '12:12:12'`, () => {});
  db.run(`ALTER TABLE errores ADD COLUMN empleado_id INTEGER DEFAULT NULL`, () => {});
  db.run(`ALTER TABLE errores ADD COLUMN notificado_salida INTEGER DEFAULT 0`, () => {});
});

// ─── MIDDLEWARES ─────────────────────────────────────────────────
function auth(req, res, next) {
  if (!req.session?.user) return res.status(401).json({ error: 'No autenticado' });
  if (!req.session.user.modulos.includes('errores')) return res.status(403).json({ error: 'Sin acceso' });
  next();
}

// ─── HELPERS ─────────────────────────────────────────────────────
const run = (sql, p=[]) => new Promise((res,rej) => db.run(sql, p, function(e){ e ? rej(e) : res(this); }));
const all = (sql, p=[]) => new Promise((res,rej) => db.all(sql, p, (e,r) => e ? rej(e) : res(r)));
const get = (sql, p=[]) => new Promise((res,rej) => db.get(sql,  p, (e,r) => e ? rej(e) : res(r)));

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

// GET /api/errores/embajadores
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

// GET /api/errores/stats
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

// GET /api/errores?desde=&hasta=&nombre=&seccion=&resuelto=
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

// POST /api/errores
router.post('/', auth, async (req, res) => {
  try {
    const { fecha, empleado_id, seccion='', descripcion, solucion='' } = req.body;
    if (!fecha || !descripcion)
      return res.status(400).json({ error: 'Campos requeridos: fecha, embajador, descripcion' });

    const embajador = await resolverEmbajador(empleado_id);
    const hora = new Date().toTimeString().slice(0, 8);
    const r = await run(
      `INSERT INTO errores (fecha, hora, empleado_id, nombre, seccion, descripcion, solucion, notificado_salida)
       VALUES (?,?,?,?,?,?,?,0)`,
      [fecha, hora, embajador.id, embajador.nombre, String(seccion).trim(), descripcion.trim(), solucion.trim()]
    );
    res.json({ ok: true, id: r.lastID });
  } catch(e) { res.status(400).json({ error: e.message }); }
});

// PUT /api/errores/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { fecha, empleado_id, seccion, descripcion, solucion, resuelto } = req.body;
    const embajador = await resolverEmbajador(empleado_id);
    await run(
      `UPDATE errores SET fecha=?, empleado_id=?, nombre=?, seccion=?, descripcion=?, solucion=?, resuelto=?
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
    res.json({ ok: true });
  } catch(e) { res.status(400).json({ error: e.message }); }
});

// PATCH /api/errores/:id/resolver  (marcar como resuelto/pendiente)
router.patch('/:id/resolver', auth, async (req, res) => {
  try {
    const { resuelto, solucion='' } = req.body;
    await run('UPDATE errores SET resuelto=?,solucion=? WHERE id=?',
      [resuelto?1:0, solucion.trim(), req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/errores/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await run('DELETE FROM errores WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
