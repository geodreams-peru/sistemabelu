const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const router = express.Router();
const catalogo = require('../lib/evolucionCatalogo');
const { dbPath } = require('../lib/paths');

const DB_PATH = dbPath('evolucion.db');
const ASIS_DB_PATH = dbPath('asistencia.db');

const db = new sqlite3.Database(DB_PATH, err => {
  if (err) { console.error('[evolucion] DB error:', err.message); return; }
  console.log('  ✓ evolucion.db conectada');
  initDB();
});

const asisDb = new sqlite3.Database(ASIS_DB_PATH, err => {
  if (err) console.error('[evolucion] asistencia.db aux error:', err.message, ASIS_DB_PATH);
  else console.log('  ✓ evolucion → asistencia.db', ASIS_DB_PATH);
});

function run(sql, p = []) {
  return new Promise((res, rej) => db.run(sql, p, function(e) { e ? rej(e) : res({ id: this.lastID, changes: this.changes }); }));
}
function get(sql, p = []) {
  return new Promise((res, rej) => db.get(sql, p, (e, r) => e ? rej(e) : res(r)));
}
function all(sql, p = []) {
  return new Promise((res, rej) => db.all(sql, p, (e, r) => e ? rej(e) : res(r || [])));
}
function asisAll(sql, p = []) {
  return new Promise((res, rej) => asisDb.all(sql, p, (e, r) => e ? rej(e) : res(r || [])));
}

async function initDB() {
  await run(`CREATE TABLE IF NOT EXISTS evolucion_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empleado_id INTEGER NOT NULL,
    item_key TEXT NOT NULL,
    completado INTEGER DEFAULT 0,
    completado_at TEXT,
    completado_por TEXT,
    UNIQUE(empleado_id, item_key)
  )`);
  await run(`CREATE TABLE IF NOT EXISTS evolucion_alarmas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empleado_id INTEGER NOT NULL,
    umbral INTEGER NOT NULL,
    disparado_at TEXT DEFAULT (datetime('now','localtime')),
    UNIQUE(empleado_id, umbral)
  )`);
  await run('CREATE INDEX IF NOT EXISTS idx_evo_items_emp ON evolucion_items(empleado_id)');
}

function auth(req, res, next) {
  const u = req.session?.user;
  if (!u) return res.status(401).json({ ok: false, error: 'No autenticado' });
  if (!u.modulos.includes('evolucion')) return res.status(403).json({ ok: false, error: 'Sin acceso' });
  next();
}

router.use(auth);

async function getCompletadosSet(empleadoId) {
  const rows = await all(
    'SELECT item_key FROM evolucion_items WHERE empleado_id = ? AND completado = 1',
    [empleadoId]
  );
  return new Set(rows.map(r => r.item_key));
}

async function getUmbralesRegistrados(empleadoId) {
  const rows = await all('SELECT umbral FROM evolucion_alarmas WHERE empleado_id = ?', [empleadoId]);
  return new Set(rows.map(r => r.umbral));
}

async function getEmbajadorBasico(id) {
  return asisAll(
    `SELECT id, nombre, apellido, cargo, foto, activo
     FROM empleados WHERE id = ?`,
    [id]
  ).then(rows => rows[0] || null);
}

function embajadorDTO(e) {
  if (!e) return null;
  return {
    id: e.id,
    nombre_completo: `${e.nombre || ''} ${e.apellido || ''}`.trim(),
    cargo: e.cargo || '',
    foto: e.foto || null,
    activo: e.activo
  };
}

// GET /catalogo
router.get('/catalogo', (_req, res) => {
  const lista = Object.values(catalogo.MATRICES).map(m => ({
    id: m.id,
    titulo: m.titulo,
    totalItems: m.totalItems,
    categorias: m.categorias.length
  }));
  res.json({ ok: true, matrices: lista });
});

// GET /catalogo/:matrizId
router.get('/catalogo/:matrizId', (req, res) => {
  const m = catalogo.matrizPorId(req.params.matrizId);
  if (!m) return res.status(404).json({ ok: false, error: 'Matriz no encontrada' });
  res.json({ ok: true, matriz: m });
});

// GET /resumen
router.get('/resumen', async (req, res) => {
  try {
    const empleados = await asisAll(
      `SELECT id, nombre, apellido, cargo, foto, activo
       FROM empleados
       WHERE COALESCE(activo, 1) = 1
       ORDER BY nombre, apellido`
    );
    console.log(`[evolucion] resumen: ${empleados.length} embajadores activos (${ASIS_DB_PATH})`);
    const resumen = [];
    for (const e of empleados) {
      const matriz = catalogo.matrizPorCargo(e.cargo);
      if (!matriz) {
        resumen.push({
          ...embajadorDTO(e),
          matrizId: null,
          matrizTitulo: null,
          progreso: null
        });
        continue;
      }
      const completados = await getCompletadosSet(e.id);
      const progreso = catalogo.calcularProgreso(matriz.id, completados);
      const alarmas = await all('SELECT umbral, disparado_at FROM evolucion_alarmas WHERE empleado_id = ? ORDER BY umbral', [e.id]);
      resumen.push({
        ...embajadorDTO(e),
        matrizId: matriz.id,
        matrizTitulo: matriz.titulo,
        progreso,
        alarmas
      });
    }
    res.json({ ok: true, embajadores: resumen });
  } catch (err) {
    console.error('[evolucion] GET /resumen', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /embajador/:id
router.get('/embajador/:id', async (req, res) => {
  try {
    const id = +req.params.id;
    const e = await getEmbajadorBasico(id);
    if (!e) return res.status(404).json({ ok: false, error: 'Embajador no encontrado' });

    const cleanCargos = String(e.cargo || '').split(',').map(c => c.trim()).filter(Boolean);
    const matricesDisponibles = [];
    for (const c of cleanCargos) {
      const mId = catalogo.CARGO_MATRIZ[c];
      if (mId && catalogo.MATRICES[mId]) {
        if (!matricesDisponibles.some(m => m.id === mId)) {
          matricesDisponibles.push({ id: mId, titulo: catalogo.MATRICES[mId].titulo, cargo: c });
        }
      }
    }

    let matrizId = req.query.matrizId || (matricesDisponibles[0] ? matricesDisponibles[0].id : null);
    let matriz = null;
    if (matrizId) {
      matriz = catalogo.matrizPorId(matrizId);
    }

    if (!matriz) {
      return res.json({
        ok: true,
        embajador: embajadorDTO(e),
        matriz: null,
        progreso: null,
        alarmas: [],
        mensaje: 'Sin matriz de evolución para este cargo',
        matricesDisponibles,
        matrizIdSelected: null
      });
    }

    const completadosSet = await getCompletadosSet(id);
    const progreso = catalogo.calcularProgreso(matriz.id, completadosSet);
    const alarmas = await all('SELECT umbral, disparado_at FROM evolucion_alarmas WHERE empleado_id = ? ORDER BY umbral', [id]);

    const categorias = matriz.categorias.map(cat => {
      const items = cat.items.map(item => ({
        ...item,
        completado: completadosSet.has(item.key)
      }));
      const done = items.filter(i => i.completado).length;
      return {
        ...cat,
        items,
        progreso: {
          total: items.length,
          completados: done,
          porcentaje: items.length ? Math.round((done / items.length) * 100) : 0
        }
      };
    });

    res.json({
      ok: true,
      embajador: embajadorDTO(e),
      matriz: { id: matriz.id, titulo: matriz.titulo, categorias },
      progreso,
      alarmas,
      umbrales: catalogo.UMBRALES,
      matricesDisponibles,
      matrizIdSelected: matrizId
    });
  } catch (err) {
    console.error('[evolucion] GET /embajador/:id', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PATCH /embajador/:id/item
router.patch('/embajador/:id/item', async (req, res) => {
  try {
    const id = +req.params.id;
    const { item_key, completado } = req.body || {};
    if (!item_key || typeof completado !== 'boolean') {
      return res.status(400).json({ ok: false, error: 'item_key y completado (boolean) requeridos' });
    }

    const e = await getEmbajadorBasico(id);
    if (!e) return res.status(404).json({ ok: false, error: 'Embajador no encontrado' });

    const key = String(item_key).trim();
    const keyMatrizId = key.split('.')[0];
    const matriz = catalogo.matrizPorId(keyMatrizId);
    if (!matriz) return res.status(400).json({ ok: false, error: 'Matriz no encontrada para este ítem' });

    const cleanCargos = String(e.cargo || '').split(',').map(c => c.trim()).filter(Boolean);
    const hasCargoPermission = cleanCargos.some(c => catalogo.CARGO_MATRIZ[c] === keyMatrizId);
    if (!hasCargoPermission) {
      return res.status(400).json({ ok: false, error: 'El embajador no posee el cargo correspondiente a esta matriz.' });
    }

    if (!catalogo.isValidItemKey(matriz.id, key)) {
      return res.status(400).json({ ok: false, error: 'Ítem no válido para esta matriz' });
    }

    const completadosAntes = await getCompletadosSet(id);
    const progresoAnterior = catalogo.calcularProgreso(matriz.id, completadosAntes);

    const usuario = req.session?.user?.nombre || req.session?.user?.username || 'sistema';
    const ahora = new Date().toISOString();

    if (completado) {
      await run(
        `INSERT INTO evolucion_items (empleado_id, item_key, completado, completado_at, completado_por)
         VALUES (?, ?, 1, ?, ?)
         ON CONFLICT(empleado_id, item_key) DO UPDATE SET completado=1, completado_at=?, completado_por=?`,
        [id, key, ahora, usuario, ahora, usuario]
      );
    } else {
      await run(
        `INSERT INTO evolucion_items (empleado_id, item_key, completado, completado_at, completado_por)
         VALUES (?, ?, 0, NULL, NULL)
         ON CONFLICT(empleado_id, item_key) DO UPDATE SET completado=0, completado_at=NULL, completado_por=NULL`,
        [id, key]
      );
    }

    const completadosDespues = await getCompletadosSet(id);
    const progresoNuevo = catalogo.calcularProgreso(matriz.id, completadosDespues);
    const umbralesReg = await getUmbralesRegistrados(id);
    const nuevasAlarmas = catalogo.evaluarUmbrales(
      progresoAnterior.porcentaje,
      progresoNuevo.porcentaje,
      umbralesReg
    );

    const alarmasDisparadas = [];
    for (const umbral of nuevasAlarmas) {
      await run('INSERT OR IGNORE INTO evolucion_alarmas (empleado_id, umbral) VALUES (?, ?)', [id, umbral]);
      alarmasDisparadas.push(umbral);
      console.log(`[evolucion] ALARMA ${umbral}% — embajador ${id} (${embajadorDTO(e).nombre_completo})`);
    }

    console.log(`[evolucion] toggle ${key}=${completado} emp=${id} progreso=${progresoNuevo.porcentaje}%`);

    res.json({
      ok: true,
      progreso: progresoNuevo,
      progresoAnterior: progresoAnterior.porcentaje,
      alarmas: alarmasDisparadas,
      embajador: embajadorDTO(e)
    });
  } catch (err) {
    console.error('[evolucion] PATCH /item', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /embajador/:id/alarmas
router.get('/embajador/:id/alarmas', async (req, res) => {
  try {
    const id = +req.params.id;
    const alarmas = await all(
      'SELECT umbral, disparado_at FROM evolucion_alarmas WHERE empleado_id = ? ORDER BY umbral',
      [id]
    );
    res.json({ ok: true, alarmas });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
