'use strict';

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const { dbPath } = require('./paths');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const REQUIRED_DBS_IN_PROD = new Set(['asistencia.db', 'errores.db']);
const RESOLVED_DB_PATHS = {};

function safeSize(filePath) {
  try {
    return fs.existsSync(filePath) ? (fs.statSync(filePath).size || 0) : 0;
  } catch (_) {
    return 0;
  }
}

function uniquePaths(list) {
  return [...new Set((list || []).filter(Boolean))];
}

function resolveBestDbPath(filename, preferredPath) {
  const cwd = process.cwd();
  const libDir = __dirname;
  const appRoot = path.resolve(libDir, '..');
  const p1 = path.resolve(appRoot, '..');
  const p2 = path.resolve(appRoot, '..', '..');
  const home = process.env.HOME || null;

  const baseDirs = uniquePaths([
    path.dirname(preferredPath),
    cwd,
    appRoot,
    p1,
    p2,
    home,
    home ? path.join(home, 'belu_data') : null,
    home ? path.join(home, 'domains') : null
  ]);

  const candidateFiles = [];
  for (const base of baseDirs) {
    candidateFiles.push(path.join(base, filename));
    candidateFiles.push(path.join(base, 'data', filename));
    candidateFiles.push(path.join(base, 'belu_data', filename));

    try {
      const children = fs.readdirSync(base, { withFileTypes: true })
        .filter(d => d.isDirectory() && /data|db|belu|domains|nodejs/i.test(d.name))
        .map(d => path.join(base, d.name));
      for (const c of children) {
        candidateFiles.push(path.join(c, filename));
        candidateFiles.push(path.join(c, 'data', filename));
      }
    } catch (_) {}
  }

  const existing = uniquePaths(candidateFiles)
    .map(file => ({ file, size: safeSize(file) }))
    .filter(x => x.size > 0)
    .sort((a, b) => b.size - a.size);

  if (!existing.length) return preferredPath;
  return existing[0].file;
}

/**
 * Abre una base de datos SQLite de forma segura.
 *
 * En PRODUCCIÓN (NODE_ENV=production):
 *   - Solo abre archivos existentes (OPEN_READWRITE, sin OPEN_CREATE)
 *   - Si el archivo .db no existe o está vacío → detiene el servidor con process.exit(1)
 *   - NUNCA crea archivos .db nuevos
 *
 * En DESARROLLO:
 *   - Comportamiento normal de sqlite3 (crea el archivo si no existe)
 *
 * Ver DATABASE_RULES.md para más información.
 *
 * @param {string} filename - Nombre del archivo .db (ej: 'asistencia.db')
 * @param {function} [onOpen] - Callback opcional (err) => {}
 * @returns {sqlite3.Database}
 */
function openDatabase(filename, onOpen) {
  const preferredPath = dbPath(filename);
  const fullPath = IS_PRODUCTION ? resolveBestDbPath(filename, preferredPath) : preferredPath;
  const isRequired = REQUIRED_DBS_IN_PROD.has(filename);
  RESOLVED_DB_PATHS[filename] = fullPath;

  if (IS_PRODUCTION) {
    if (fullPath !== preferredPath) {
      console.warn(`🟡 WARN: ${filename} en DATA_DIR parece desfasada; usando copia alternativa ${fullPath}`);
    }
    if (!fs.existsSync(fullPath)) {
      if (isRequired) {
        console.error(`🔴 FATAL: ${filename} no encontrada en ${fullPath}`);
        console.error(`   Verifique que DATA_DIR esté configurado en las variables de entorno de Hostinger.`);
        console.error(`   Ver DATABASE_RULES.md para más información.`);
        process.exit(1);
      }
      console.warn(`🟡 WARN: ${filename} no encontrada en ${fullPath}. Se usará DB temporal en memoria para mantener el servidor activo.`);
      return new sqlite3.Database(':memory:', onOpen);
    }
    const stats = fs.statSync(fullPath);
    if (stats.size === 0) {
      if (isRequired) {
        console.error(`🔴 FATAL: ${filename} está vacía (0 bytes) en ${fullPath}`);
        console.error(`   Restaure la base de datos desde un backup antes de iniciar.`);
        process.exit(1);
      }
      console.warn(`🟡 WARN: ${filename} está vacía en ${fullPath}. Se usará DB temporal en memoria para mantener el servidor activo.`);
      return new sqlite3.Database(':memory:', onOpen);
    }
    return new sqlite3.Database(fullPath, sqlite3.OPEN_READWRITE, onOpen);
  }

  // Desarrollo: permite crear archivos nuevos (comportamiento por defecto de sqlite3)
  return new sqlite3.Database(fullPath, onOpen);
}

function getResolvedDbPaths() {
  return { ...RESOLVED_DB_PATHS };
}

/**
 * Retorna true si se deben ejecutar migraciones de esquema
 * (CREATE TABLE, ALTER TABLE, CREATE INDEX, etc.)
 *
 * En producción, SIEMPRE retorna false.
 * Los cambios de esquema en producción se hacen MANUALMENTE.
 * Ver DATABASE_RULES.md para el procedimiento.
 */
function shouldMigrate() {
  return !IS_PRODUCTION;
}

module.exports = { openDatabase, shouldMigrate, IS_PRODUCTION, getResolvedDbPaths };
