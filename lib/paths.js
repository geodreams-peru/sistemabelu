'use strict';

const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const PARENT = path.resolve(ROOT, '..');
let DATA_DIR_SOURCE = 'default:data';

function resolveDir(envKey, defaultRelative) {
  const raw = process.env[envKey];
  if (!raw || !String(raw).trim()) {
    return path.join(ROOT, defaultRelative);
  }
  const val = String(raw).trim();
  return path.isAbsolute(val) ? val : path.join(ROOT, val);
}

function hasDbFiles(dir) {
  try {
    const files = fs.readdirSync(dir);
    return files.some(f => /\.db$/i.test(f));
  } catch (_) {
    return false;
  }
}

function hasAsistenciaDb(dir) {
  try {
    return fs.existsSync(path.join(dir, 'asistencia.db'));
  } catch (_) {
    return false;
  }
}

function getFileSizeSafe(filePath) {
  try {
    return fs.statSync(filePath).size || 0;
  } catch (_) {
    return 0;
  }
}

function hasRequiredDbSet(dir) {
  return fs.existsSync(path.join(dir, 'asistencia.db')) && fs.existsSync(path.join(dir, 'errores.db'));
}

function findBestDataDir(candidates) {
  // 1) Prioridad máxima: carpeta con asistencia.db (preferir la más probable por tamaño/set requerido)
  const directCandidates = candidates
    .filter(dir => fs.existsSync(dir) && hasAsistenciaDb(dir))
    .map(dir => {
      const asisFile = path.join(dir, 'asistencia.db');
      const size = getFileSizeSafe(asisFile);
      const requiredSet = hasRequiredDbSet(dir);
      return {
        dir,
        size,
        requiredSet,
        score: (requiredSet ? 1000 : 0) + size
      };
    })
    .sort((a, b) => b.score - a.score);

  if (directCandidates.length) {
    const best = directCandidates[0];
    return {
      dir: best.dir,
      source: `direct-asistencia.db(size=${best.size},requiredSet=${best.requiredSet ? 1 : 0})`
    };
  }

  // 2) Compatibilidad: carpeta que contiene subcarpeta data/asistencia.db
  for (const dir of candidates) {
    if (!fs.existsSync(dir)) continue;
    const nestedData = path.join(dir, 'data');
    if (hasAsistenciaDb(nestedData)) {
      return { dir: nestedData, source: 'nested:data/asistencia.db' };
    }
  }

  // 3) Último recurso: cualquier carpeta con algún .db
  const anyDb = candidates.find(dir => fs.existsSync(dir) && hasDbFiles(dir));
  if (anyDb) return { dir: anyDb, source: 'fallback:any-db' };

  return null;
}

function resolveDataDir() {
  const fromEnv = process.env.DATA_DIR && String(process.env.DATA_DIR).trim()
    ? resolveDir('DATA_DIR', 'data')
    : null;

  // 1) Si DATA_DIR existe y contiene .db, respetarlo siempre.
  if (fromEnv && fs.existsSync(fromEnv) && hasDbFiles(fromEnv)) {
    DATA_DIR_SOURCE = 'env:DATA_DIR';
    return fromEnv;
  }

  // 2) Candidatos conocidos y carpetas con "data" en el nombre.
  const known = [
    // En hosting, la carpeta real suele estar fuera de la app (hermana de nodejs)
    path.join(PARENT, 'belu_data'),
    path.join(PARENT, 'data'),
    path.join(ROOT, 'belu_data'),
    path.join(ROOT, 'data'),
    path.join(ROOT, 'storage'),
    path.join(ROOT, 'db')
  ];

  let dynamicRoot = [];
  let dynamicParent = [];
  try {
    dynamicRoot = fs.readdirSync(ROOT, { withFileTypes: true })
      .filter(d => d.isDirectory() && /data|db|storage/i.test(d.name))
      .map(d => path.join(ROOT, d.name));
  } catch (_) {
    dynamicRoot = [];
  }

  try {
    dynamicParent = fs.readdirSync(PARENT, { withFileTypes: true })
      .filter(d => d.isDirectory() && /data|db|storage/i.test(d.name))
      .map(d => path.join(PARENT, d.name));
  } catch (_) {
    dynamicParent = [];
  }

  const candidates = [...new Set([...(fromEnv ? [fromEnv] : []), ...known, ...dynamicRoot, ...dynamicParent])];
  const best = findBestDataDir(candidates);
  if (best?.dir) {
    const sameAsEnv = fromEnv && (best.dir === fromEnv || best.dir === path.join(fromEnv, 'data'));
    DATA_DIR_SOURCE = sameAsEnv ? `env:DATA_DIR(${best.source})` : `autodetect:${path.basename(best.dir)}(${best.source})`;
    return best.dir;
  }

  // 3) Fallback: si DATA_DIR está definido, usarlo aunque aún no tenga DB.
  if (fromEnv) {
    DATA_DIR_SOURCE = 'env:DATA_DIR(fallback)';
    return fromEnv;
  }

  DATA_DIR_SOURCE = 'default:data';
  return path.join(ROOT, 'data');
}

const DATA_DIR = resolveDataDir();
const UPLOADS_DIR = resolveDir('UPLOADS_DIR', 'uploads');

function dbPath(filename) {
  return path.join(DATA_DIR, filename);
}

function uploadsPath(...parts) {
  return path.join(UPLOADS_DIR, ...parts);
}

/** Solo crea carpetas; nunca borra ni sobrescribe archivos .db existentes. */
function ensureRuntimeDirs() {
  const dirs = [
    DATA_DIR,
    uploadsPath('fotos'),
    uploadsPath('fotos_asistencia')
  ];
  for (const dir of dirs) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
      console.error(`[paths] No se pudo crear ${dir}:`, e.message);
    }
  }
}

function logPaths() {
  console.log(`  ✦ DATA_DIR:    ${DATA_DIR}`);
  console.log(`  ✦ DATA_DIR_SOURCE: ${DATA_DIR_SOURCE}`);
  console.log(`  ✦ UPLOADS_DIR: ${UPLOADS_DIR}`);
}

module.exports = {
  ROOT,
  DATA_DIR,
  UPLOADS_DIR,
  dbPath,
  uploadsPath,
  ensureRuntimeDirs,
  logPaths
};
