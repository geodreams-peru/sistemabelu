/**
 * Pruebas locales del módulo de correos (sin enviar SMTP real).
 * Ejecutar: node scripts/test_correo_programado.js
 */
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_COMPLETO = ['asistencia.db', 'compras.db', 'contabilidad.db', 'errores.db', 'movimientos.db'];

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function testDbFilesExist() {
  for (const f of DB_COMPLETO) {
    assert(fs.existsSync(path.join(DATA_DIR, f)), `Falta ${f} en data/`);
  }
  console.log('  OK archivos .db presentes');
}

function testCopySnapshot() {
  const stamp = Date.now();
  const tmpDir = path.join(__dirname, '..', 'tmp', 'test-correo', String(stamp));
  fs.mkdirSync(tmpDir, { recursive: true });
  const copies = [];
  for (const filename of DB_COMPLETO) {
    const src = path.join(DATA_DIR, filename);
    const dest = path.join(tmpDir, filename);
    fs.copyFileSync(src, dest);
    copies.push(dest);
  }
  assert(copies.length === 5, 'Deben copiarse 5 archivos');
  assert(copies.every(p => fs.existsSync(p)), 'Copias deben existir');
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log('  OK copia snapshot 5 archivos en un solo lote');
}

async function testBoletaPdf() {
  let pdfkit;
  try {
    pdfkit = require('pdfkit');
    void pdfkit;
  } catch {
    console.log('  SKIP PDF (ejecuta npm install para instalar pdfkit)');
    return;
  }

  const { generateBoletaPdf } = require('../lib/boletaPdf');
  const sample = {
    emp: { nombre: 'Test', apellido: 'Usuario', tipo_doc: 'DNI', documento: '12345678', cargo: 'Mozo', onp: 0 },
    ajuste: { feriados: 0, bono: 0, prestamo: 0, nota: '' },
    registros: [
      { fecha: '2026-06-01', hora_entrada: '06:30', hora_salida: '15:00', tarde: false }
    ],
    valorDia: 34.17,
    valorHora: 4.27,
    descTardanza: 2,
    periodo: { desde: '2026-06-01', hasta: '2026-06-15' },
    resumen: {
      diasTrabajados: 1,
      diasAdicionales: 0,
      descansos: 0,
      domMonto: 0,
      horasTrabajadas: 0,
      faltas: 0,
      faltasMonto: 0,
      tardanzaCount: 0,
      tardanzaMonto: 0,
      onpMonto: 0,
      sueldo: 34.17
    }
  };
  const { buffer, filename } = await generateBoletaPdf(sample);
  assert(buffer.length > 500, 'PDF debe tener contenido');
  assert(filename.endsWith('.pdf'), 'Nombre debe ser .pdf');
  console.log('  OK generación PDF boleta');
}

async function testCorreoServiceExports() {
  const svc = require('../services/correoProgramado');
  assert(typeof svc.enviarAsistenciaDb === 'function', 'enviarAsistenciaDb');
  assert(typeof svc.enviarRespaldoCompleto === 'function', 'enviarRespaldoCompleto');
  assert(typeof svc.recuperarRespaldoCompleto === 'function', 'recuperarRespaldoCompleto');
  assert(typeof svc.enviarBoletasQuincenaPdf === 'function', 'enviarBoletasQuincenaPdf');
  console.log('  OK exports correoProgramado');
}

async function main() {
  console.log('Test correos programados');
  testDbFilesExist();
  testCopySnapshot();
  await testBoletaPdf();
  await testCorreoServiceExports();
  console.log('\nTodos los tests pasaron.');
}

main().catch(e => {
  console.error('\nFALLÓ:', e.message);
  process.exit(1);
});
