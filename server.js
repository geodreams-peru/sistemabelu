require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { dbPath, ensureRuntimeDirs, logPaths, UPLOADS_DIR, DATA_DIR } = require('./lib/paths');
const { shouldMigrate, getResolvedDbPaths } = require('./lib/db');

const DEPLOY_VERSION = '2026-07-01-smart-db-resolver-v6';

function uniquePaths(list) {
  return [...new Set((list || []).filter(Boolean))];
}

function inspectAsistenciaDbFile(dbFilePath) {
  return new Promise((resolve) => {
    try {
      const exists = fs.existsSync(dbFilePath);
      const size = exists ? fs.statSync(dbFilePath).size : 0;
      if (!exists || size <= 0) {
        return resolve({ path: dbFilePath, exists, size, empleadosTotal: null, empleadosActivos: null });
      }

      const db = new sqlite3.Database(dbFilePath, sqlite3.OPEN_READONLY, (openErr) => {
        if (openErr) {
          return resolve({ path: dbFilePath, exists, size, error: openErr.message, empleadosTotal: null, empleadosActivos: null });
        }

        const q = (sql) => new Promise((res, rej) => db.get(sql, [], (err, row) => err ? rej(err) : res(row || {})));
        (async () => {
          try {
            const t = await q('SELECT COUNT(*) AS n FROM empleados');
            const a = await q("SELECT COUNT(*) AS n FROM empleados WHERE COALESCE(NULLIF(LOWER(TRIM(CAST(activo AS TEXT))),''),'1') IN ('1','true','t','si','s','y','yes')");
            resolve({
              path: dbFilePath,
              exists,
              size,
              empleadosTotal: t.n || 0,
              empleadosActivos: a.n || 0
            });
          } catch (e) {
            resolve({ path: dbFilePath, exists, size, error: e.message, empleadosTotal: null, empleadosActivos: null });
          } finally {
            db.close();
          }
        })();
      });
    } catch (e) {
      resolve({ path: dbFilePath, exists: false, size: 0, error: e.message, empleadosTotal: null, empleadosActivos: null });
    }
  });
}

function buildAsistenciaCandidateFiles(primaryDataDir) {
  const cwd = process.cwd();
  const d0 = __dirname;
  const p1 = path.resolve(d0, '..');
  const p2 = path.resolve(d0, '..', '..');
  const p3 = path.resolve(d0, '..', '..', '..');
  const home = process.env.HOME || null;

  const baseDirs = uniquePaths([
    primaryDataDir,
    cwd,
    d0,
    p1,
    p2,
    p3,
    home,
    home ? path.join(home, 'belu_data') : null,
    home ? path.join(home, 'data') : null,
    home ? path.join(home, 'domains') : null
  ]);

  const candidateDirs = [];
  for (const b of baseDirs) {
    candidateDirs.push(b);
    candidateDirs.push(path.join(b, 'data'));
    candidateDirs.push(path.join(b, 'belu_data'));
    candidateDirs.push(path.join(b, 'db'));

    try {
      const children = fs.readdirSync(b, { withFileTypes: true })
        .filter(d => d.isDirectory() && /data|db|belu|backup|nodejs/i.test(d.name))
        .map(d => path.join(b, d.name));
      for (const c of children) {
        candidateDirs.push(c);
        candidateDirs.push(path.join(c, 'data'));
      }
    } catch (_) {}
  }

  return uniquePaths(candidateDirs).map(dir => path.join(dir, 'asistencia.db'));
}

async function inspectDbCounts(filePath, countQueries) {
  const info = {
    path: filePath,
    exists: fs.existsSync(filePath),
    size: fs.existsSync(filePath) ? (fs.statSync(filePath).size || 0) : 0,
    counts: {}
  };

  if (!info.exists || info.size <= 0) return info;

  return new Promise((resolve) => {
    const db = new sqlite3.Database(filePath, sqlite3.OPEN_READONLY, async (openErr) => {
      if (openErr) {
        info.error = openErr.message;
        return resolve(info);
      }

      const q = (sql) => new Promise((res, rej) => db.get(sql, [], (err, row) => err ? rej(err) : res(row || {})));
      try {
        for (const [key, sql] of Object.entries(countQueries || {})) {
          try {
            const r = await q(sql);
            info.counts[key] = r.n ?? 0;
          } catch (e) {
            info.counts[key] = null;
            info.counts[`${key}_error`] = e.message;
          }
        }
      } finally {
        db.close(() => resolve(info));
      }
    });
  });
}

function bootLog(location, message, data, hypothesisId = 'H503') {
  const entry = { sessionId: '61705f', hypothesisId, location, message, data, timestamp: Date.now() };
  console.log('[BELU boot]', JSON.stringify(entry));
  // #region agent log
  try { fs.appendFileSync(path.join(__dirname, 'debug-61705f.log'), JSON.stringify(entry) + '\n'); } catch (_) {}
  // #endregion
}

process.on('uncaughtException', (err) => {
  bootLog('server.js:uncaughtException', err.message, { code: err.code, stack: err.stack }, 'H1-H4');
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  bootLog('server.js:unhandledRejection', String(reason), { reason: String(reason) }, 'H1-H4');
});

ensureRuntimeDirs();
logPaths();

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
if (!process.env.PORT) {
  console.warn('[BELU] PORT no asignado por el hosting; usando 3000. En Hostinger no fijar PORT=3000 en variables de entorno.');
}
bootLog('server.js:port', 'puerto de escucha', { PORT, envPort: process.env.PORT || null }, 'H3');
const PUBLIC_DIR = path.join(__dirname, 'public');
const INDEX_HTML = path.resolve(PUBLIC_DIR, 'index.html');
const ERRORES_DB = dbPath('errores.db');

function logPublicPaths(runId = 'startup') {
  let publicContents = null;
  try {
    publicContents = fs.existsSync(PUBLIC_DIR) ? fs.readdirSync(PUBLIC_DIR) : null;
  } catch (e) {
    publicContents = { readdirError: e.message };
  }
  const data = {
    __dirname,
    cwd: process.cwd(),
    publicDir: PUBLIC_DIR,
    indexHtml: INDEX_HTML,
    publicDirExists: fs.existsSync(PUBLIC_DIR),
    indexExists: fs.existsSync(INDEX_HTML)
  };
  console.log('[BELU paths]', JSON.stringify({ ...data, publicContents }));
  // #region agent log
  try {
    fs.appendFileSync(
      path.join(__dirname, 'debug-61705f.log'),
      JSON.stringify({
        sessionId: '61705f',
        runId,
        hypothesisId: 'H1-H5',
        location: 'server.js:logPublicPaths',
        message: 'public path check',
        data: { ...data, publicContents },
        timestamp: Date.now()
      }) + '\n'
    );
  } catch (_) {}
  // #endregion
}

function sendSpaFile(res, filePath, reqPath) {
  res.sendFile(filePath, (err) => {
    if (!err) return;
    const payload = {
      reqPath,
      filePath,
      code: err.code,
      message: err.message,
      __dirname,
      cwd: process.cwd(),
      indexExists: fs.existsSync(INDEX_HTML)
    };
    console.error('[BELU sendFile]', JSON.stringify(payload));
    if (!res.headersSent) {
      res.status(err.code === 'ENOENT' ? 404 : 500).json({
        error: 'No se pudo servir la aplicación',
        detail: err.message,
        expectedIndex: INDEX_HTML,
        hint: 'Verifique que public/index.html esté junto a server.js (carpeta nodejs/public/, no public_html).'
      });
    }
  });
}

function migrateErroresDbAtBoot() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(ERRORES_DB, err => {
      if (err) return reject(err);
      db.serialize(() => {
        db.run('ALTER TABLE errores ADD COLUMN para_todos INTEGER DEFAULT 0', e => {
          if (e && !/duplicate column name/i.test(e.message)) {
            bootLog('server.js:migrateErrores', 'ALTER para_todos', { error: e.message }, 'H1');
          }
        });
        db.run(`CREATE TABLE IF NOT EXISTS error_vistos (
          error_id INTEGER NOT NULL,
          empleado_id INTEGER NOT NULL,
          visto_at TEXT DEFAULT (datetime('now','localtime')),
          PRIMARY KEY (error_id, empleado_id)
        )`, e => {
          if (e) bootLog('server.js:migrateErrores', 'CREATE error_vistos', { error: e.message }, 'H1');
          db.all('PRAGMA table_info(errores)', (pragmaErr, cols) => {
            db.close(closeErr => {
              if (closeErr) return reject(closeErr);
              if (pragmaErr) return reject(pragmaErr);
              const colNames = (cols || []).map(c => c.name);
              resolve({
                dbPath: ERRORES_DB,
                hasParaTodos: colNames.includes('para_todos'),
                columns: colNames
              });
            });
          });
        });
      });
    });
  });
}

logPublicPaths();

// ─── MIDDLEWARES ────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

// Importante para hosting con reverse proxy (HTTPS al cliente, HTTP interno a Node).
app.set('trust proxy', 1);

app.use(session({
  secret: process.env.SESSION_SECRET || 'belu_secret',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    secure: IS_PRODUCTION,
    sameSite: 'lax',
    httpOnly: true,
    maxAge: 8 * 60 * 60 * 1000
  }
}));

// ─── Migración manual (sin auth) — abrir en navegador tras deploy ─
app.get('/api/migrate-errores-db', async (_req, res) => {
  if (!shouldMigrate()) {
    return res.status(403).json({ ok: false, error: 'Migraciones deshabilitadas en producción. Ver DATABASE_RULES.md' });
  }
  try {
    const schema = await migrateErroresDbAtBoot();
    bootLog('server.js:migrate-errores-db', 'OK', { deployVersion: DEPLOY_VERSION, ...schema }, 'H4');
    res.json({ ok: true, deployVersion: DEPLOY_VERSION, message: 'Migración completada', ...schema });
  } catch (e) {
    bootLog('server.js:migrate-errores-db', 'error', { error: e.message }, 'H4');
    res.status(500).json({ ok: false, deployVersion: DEPLOY_VERSION, error: e.message });
  }
});

// ─── RUTAS API ──────────────────────────────────────────────────
const authRoutes         = require('./routes/auth');
const contabilidadRoutes = require('./routes/contabilidad');
const movimientosRoutes  = require('./routes/movimientos');
const asistenciaRoutes   = require('./routes/asistencia');
const comprasRoutes      = require('./routes/compras');
const erroresRoutes      = require('./routes/errores');
const evolucionRoutes    = require('./routes/evolucion');

app.use('/api/auth',         authRoutes);
app.use('/api/contabilidad', contabilidadRoutes);
app.use('/api/movimientos',  movimientosRoutes);
app.use('/api/asistencia',   asistenciaRoutes);
app.use('/api/compras',      comprasRoutes);
app.use('/api/errores',      erroresRoutes);
app.use('/api/evolucion',    evolucionRoutes);

app.get('/api/health', async (_req, res) => {
  const dataDir = DATA_DIR;
  const uploadsDir = UPLOADS_DIR;
  const asisPath = dbPath('asistencia.db');
  let dataFiles = null;
  let publicFiles = null;
  let erroresSchema = null;
  let asistenciaDbInfo = null;
  let asistenciaCandidates = [];
  let dbModuleInfo = {};
  try { dataFiles = fs.existsSync(dataDir) ? fs.readdirSync(dataDir) : null; } catch (e) { dataFiles = { error: e.message }; }
  try { publicFiles = fs.existsSync(PUBLIC_DIR) ? fs.readdirSync(PUBLIC_DIR) : null; } catch (e) { publicFiles = { error: e.message }; }
  try {
    erroresSchema = await erroresRoutes.getErroresSchemaInfo();
  } catch (e) {
    erroresSchema = { error: e.message };
  }

  try {
    asistenciaDbInfo = await inspectAsistenciaDbFile(asisPath);
  } catch (e) {
    asistenciaDbInfo = { error: e.message, path: asisPath };
  }

  try {
    const files = buildAsistenciaCandidateFiles(dataDir);
    const inspected = [];
    for (const f of files) {
      const info = await inspectAsistenciaDbFile(f);
      if (info.exists || (info.error && !/SQLITE_CANTOPEN|ENOENT/i.test(info.error))) {
        inspected.push(info);
      }
    }
    asistenciaCandidates = inspected
      .sort((a, b) => {
        const aScore = (a.empleadosTotal || 0) * 100000 + (a.size || 0);
        const bScore = (b.empleadosTotal || 0) * 100000 + (b.size || 0);
        return bScore - aScore;
      })
      .slice(0, 10);
  } catch (e) {
    asistenciaCandidates = [{ error: e.message }];
  }

  try {
    const resolved = getResolvedDbPaths();
    const targets = {
      asistencia: resolved['asistencia.db'] || dbPath('asistencia.db'),
      compras: resolved['compras.db'] || dbPath('compras.db'),
      contabilidad: resolved['contabilidad.db'] || dbPath('contabilidad.db'),
      errores: resolved['errores.db'] || dbPath('errores.db'),
      evolucion: resolved['evolucion.db'] || dbPath('evolucion.db'),
      movimientos: resolved['movimientos.db'] || dbPath('movimientos.db')
    };

    const [asis, comp, cont, erro, evol, mov] = await Promise.all([
      inspectDbCounts(targets.asistencia, {
        empleados: 'SELECT COUNT(*) AS n FROM empleados',
        registros: 'SELECT COUNT(*) AS n FROM registros'
      }),
      inspectDbCounts(targets.compras, {
        compras: 'SELECT COUNT(*) AS n FROM compras',
        proveedores: 'SELECT COUNT(*) AS n FROM proveedores'
      }),
      inspectDbCounts(targets.contabilidad, {
        ventas: 'SELECT COUNT(*) AS n FROM ventas',
        gastos_items: 'SELECT COUNT(*) AS n FROM gastos_items',
        gastos_mensuales: 'SELECT COUNT(*) AS n FROM gastos_mensuales'
      }),
      inspectDbCounts(targets.errores, {
        errores: 'SELECT COUNT(*) AS n FROM errores',
        error_vistos: 'SELECT COUNT(*) AS n FROM error_vistos'
      }),
      inspectDbCounts(targets.evolucion, {
        evolucion_items: 'SELECT COUNT(*) AS n FROM evolucion_items',
        evolucion_alarmas: 'SELECT COUNT(*) AS n FROM evolucion_alarmas'
      }),
      inspectDbCounts(targets.movimientos, {
        producto: 'SELECT COUNT(*) AS n FROM producto',
        compra: 'SELECT COUNT(*) AS n FROM compra',
        venta: 'SELECT COUNT(*) AS n FROM venta',
        movimiento: 'SELECT COUNT(*) AS n FROM movimiento'
      })
    ]);

    dbModuleInfo = {
      resolvedDbPaths: targets,
      asistencia: asis,
      compras: comp,
      contabilidad: cont,
      errores: erro,
      evolucion: evol,
      movimientos: mov
    };
  } catch (e) {
    dbModuleInfo = { error: e.message };
  }

  res.json({
    ok: fs.existsSync(INDEX_HTML),
    deployVersion: DEPLOY_VERSION,
    node: process.version,
    cwd: process.cwd(),
    dirname: __dirname,
    portListening: PORT,
    envPort: process.env.PORT || null,
    nodeEnv: process.env.NODE_ENV || null,
    publicDir: PUBLIC_DIR,
    indexHtml: INDEX_HTML,
    publicIndexExists: fs.existsSync(INDEX_HTML),
    dataDir,
    dataDirExists: fs.existsSync(dataDir),
    dataDirFromEnv: process.env.DATA_DIR || null,
    uploadsDir,
    uploadsDirFromEnv: process.env.UPLOADS_DIR || null,
    dataFiles,
    asistenciaDbInfo,
    asistenciaCandidates,
    dbModuleInfo,
    uploadsDirExists: fs.existsSync(uploadsDir),
    publicFiles,
    erroresSchema,
    uptimeSec: Math.round(process.uptime())
  });
});

// ─── SPA ────────────────────────────────────────────────────────
app.get('/login', (req, res) => {
  sendSpaFile(res, path.resolve(PUBLIC_DIR, 'login.html'), req.path);
});
app.get('/', (req, res) => {
  sendSpaFile(res, INDEX_HTML, req.path);
});
app.get('*', (req, res) => {
  sendSpaFile(res, INDEX_HTML, req.path);
});

function logAsistenciaCount() {
  const asisPath = dbPath('asistencia.db');
  const sqlActivoTrue = "COALESCE(NULLIF(LOWER(TRIM(CAST(activo AS TEXT))),''),'1') IN ('1','true','t','si','s','y','yes')";
  if (!fs.existsSync(asisPath)) {
    console.warn(`  ⚠ asistencia.db no encontrada en ${asisPath} — configure DATA_DIR o restaure backup`);
    return;
  }
  const db = new sqlite3.Database(asisPath, sqlite3.OPEN_READONLY, err => {
    if (err) return;
    db.get(`SELECT COUNT(*) AS n FROM empleados WHERE ${sqlActivoTrue}`, [], (e, row) => {
      if (!e && row) console.log(`  ✦ Embajadores activos en BD: ${row.n} (${asisPath})`);
      db.close();
    });
  });
}

// ─── INICIO ─────────────────────────────────────────────────────
(shouldMigrate()
  ? migrateErroresDbAtBoot()
      .then(schema => {
        bootLog('server.js:startup', 'migración OK', { deployVersion: DEPLOY_VERSION, ...schema }, 'H1');
        console.log('  ✓ errores.db schema migrado (para_todos)');
        return erroresRoutes.ensureErroresSchema();
      })
      .catch(err => {
        bootLog('server.js:startup', 'migración falló', { error: err.message }, 'H1');
        console.error('[BELU] migrateErroresDbAtBoot:', err.message);
      })
  : Promise.resolve().then(() => {
      console.log('  ✦ Producción: migraciones de esquema deshabilitadas (ver DATABASE_RULES.md)');
    })
).finally(() => {
  logAsistenciaCount();
  app.listen(PORT, () => {
    logPublicPaths('listen');
    console.log(`\n  ✦ BELÚ SYSTEM corriendo en http://localhost:${PORT}`);
    console.log(`  ✦ Deploy: ${DEPLOY_VERSION}`);
    console.log(`  ✦ Entorno: ${process.env.NODE_ENV || 'development'}\n`);
  });
});
