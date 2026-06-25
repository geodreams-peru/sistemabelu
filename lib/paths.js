'use strict';

const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');

function resolveDir(envKey, defaultRelative) {
  const raw = process.env[envKey];
  if (!raw || !String(raw).trim()) {
    return path.join(ROOT, defaultRelative);
  }
  const val = String(raw).trim();
  return path.isAbsolute(val) ? val : path.join(ROOT, val);
}

const DATA_DIR = resolveDir('DATA_DIR', 'data');
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
