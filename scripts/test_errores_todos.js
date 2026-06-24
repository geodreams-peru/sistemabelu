/**
 * Prueba local del flujo "Todos": error global y aceptación independiente por empleado.
 * Ejecutar: node scripts/test_errores_todos.js
 */
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const ERRORES_DB = path.join(__dirname, '..', 'data', 'errores.db');

function dbAll(db, sql, p = []) {
  return new Promise((res, rej) => db.all(sql, p, (e, r) => e ? rej(e) : res(r || [])));
}
function dbRun(db, sql, p = []) {
  return new Promise((res, rej) => db.run(sql, p, function (e) { e ? rej(e) : res(this); }));
}

async function pendientes(db, empId, fecha) {
  return dbAll(db,
    `SELECT id FROM errores
     WHERE fecha = ? AND resuelto = 0
       AND (
         (empleado_id = ? AND COALESCE(para_todos, 0) = 0 AND notificado_salida = 0)
         OR (
           COALESCE(para_todos, 0) = 1
           AND id NOT IN (SELECT error_id FROM error_vistos WHERE empleado_id = ?)
         )
       )`,
    [fecha, empId, empId]
  );
}

async function main() {
  const errores = require('../routes/errores');
  await errores.ensureErroresSchema();

  const hoy = new Date().toISOString().slice(0, 10);
  const db = new sqlite3.Database(ERRORES_DB);
  const empA = 9001;
  const empB = 9002;
  const testDesc = `TEST_TODOS_${Date.now()}`;

  const ins = await dbRun(db,
    `INSERT INTO errores (fecha, hora, empleado_id, nombre, seccion, descripcion, solucion, notificado_salida, para_todos)
     VALUES (?,?,NULL,?,?,?,?,0,1)`,
    [hoy, '12:00:00', 'Todos los embajadores', 'Test', testDesc, '']
  );
  const errorId = ins.lastID;

  const pA1 = await pendientes(db, empA, hoy);
  const pB1 = await pendientes(db, empB, hoy);
  if (!pA1.some(r => r.id === errorId) || !pB1.some(r => r.id === errorId)) {
    throw new Error('ambos empleados deberían ver el error global antes de aceptar');
  }

  await dbRun(db, 'INSERT OR IGNORE INTO error_vistos (error_id, empleado_id) VALUES (?, ?)', [errorId, empA]);
  const pA2 = await pendientes(db, empA, hoy);
  const pB2 = await pendientes(db, empB, hoy);
  if (pA2.some(r => r.id === errorId)) throw new Error('empleado A no debería ver el error tras aceptar');
  if (!pB2.some(r => r.id === errorId)) throw new Error('empleado B aún debería ver el error');

  await dbRun(db, 'INSERT OR IGNORE INTO error_vistos (error_id, empleado_id) VALUES (?, ?)', [errorId, empB]);
  const pB3 = await pendientes(db, empB, hoy);
  if (pB3.some(r => r.id === errorId)) throw new Error('empleado B no debería ver el error tras aceptar');

  await dbRun(db, 'DELETE FROM error_vistos WHERE error_id=?', [errorId]);
  await dbRun(db, 'DELETE FROM errores WHERE id=?', [errorId]);
  db.close();

  console.log('OK: flujo Todos verificado (2 empleados, aceptación independiente)');
}

main().catch(e => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
