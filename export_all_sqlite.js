const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const base = 'C:/APLICATIVOS/sistemabelu/data';
const jobs = [
  { in: 'asistencia.db', out: 'asistencia_export.db' },
  { in: 'compras.db', out: 'compras_export.db' },
  { in: 'contabilidad.db', out: 'contabilidad_export.db' },
  { in: 'errores.db', out: 'errores_export.db' },
  { in: 'evolucion.db', out: 'evolucion_export.db' },
  { in: 'movimientos.db', out: 'movimientos_export.db' }
];

function execDb(src, sql) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(src, sqlite3.OPEN_READWRITE, (e) => {
      if (e) return reject(e);
      db.exec(sql, (err) => {
        db.close((cerr) => {
          if (err) return reject(err);
          if (cerr) return reject(cerr);
          resolve();
        });
      });
    });
  });
}

(async () => {
  for (const j of jobs) {
    const src = path.join(base, j.in).replace(/\\/g, '/');
    const dst = path.join(base, j.out).replace(/\\/g, '/');
    try {
      if (!fs.existsSync(src)) {
        console.log(`${j.in} -> SKIP (no existe)`);
        continue;
      }
      if (fs.existsSync(dst)) fs.unlinkSync(dst);
      const sql = `PRAGMA wal_checkpoint(FULL); VACUUM INTO '${dst}';`;
      await execDb(src, sql);
      const size = fs.statSync(dst).size;
      console.log(`${j.in} -> ${j.out} OK (${size} bytes)`);
    } catch (e) {
      console.log(`${j.in} -> ERROR: ${e.message}`);
    }
  }
})();
