'use strict';

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const { dbPath } = require('./paths');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

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
  const fullPath = dbPath(filename);

  if (IS_PRODUCTION) {
    if (!fs.existsSync(fullPath)) {
      console.error(`🔴 FATAL: ${filename} no encontrada en ${fullPath}`);
      console.error(`   Verifique que DATA_DIR esté configurado en las variables de entorno de Hostinger.`);
      console.error(`   Ver DATABASE_RULES.md para más información.`);
      process.exit(1);
    }
    const stats = fs.statSync(fullPath);
    if (stats.size === 0) {
      console.error(`🔴 FATAL: ${filename} está vacía (0 bytes) en ${fullPath}`);
      console.error(`   Restaure la base de datos desde un backup antes de iniciar.`);
      process.exit(1);
    }
    return new sqlite3.Database(fullPath, sqlite3.OPEN_READWRITE, onOpen);
  }

  // Desarrollo: permite crear archivos nuevos (comportamiento por defecto de sqlite3)
  return new sqlite3.Database(fullPath, onOpen);
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

module.exports = { openDatabase, shouldMigrate, IS_PRODUCTION };
