const express    = require('express');
const sqlite3    = require('sqlite3').verbose();
const path       = require('path');
const multer     = require('multer');
const { DateTime } = require('luxon');
const fs         = require('fs');
const router     = express.Router();
const correoProgramado = require('../services/correoProgramado');
const { dbPath, uploadsPath } = require('../lib/paths');
const { openDatabase, shouldMigrate } = require('../lib/db');

// ── Config ───────────────────────────────────────────────────────
const TZ = 'America/Lima';
const DB_PATH    = dbPath('asistencia.db');
const ERRORES_DB_PATH = dbPath('errores.db');
const UPLOAD_DIR = uploadsPath('fotos');
const CARGOS     = ['Mozo/Azafata', 'Ayudante de cocina', 'Planchero', 'Cantor', 'Armado', 'Líquidos', 'Caja', 'Admin', 'Part time/cocina', 'Part time/salon'];
const PINES_CATALOGO = [
  {
    nombre: 'Puntualidad',
    logro: 'Llegar a tiempo 30 dias consecutivos, todo un logro. Recuerda mantener esta marca siempre.',
    premio: 'Vale de consumo de 25 soles + Pin Puntualidad'
  },
  {
    nombre: 'Limpieza PRO',
    logro: 'Manejar la limpieza de vajilla, bano, area de trabajo y mesas. Mantener 2 meses sin recibir observaciones.',
    premio: 'Vale de consumo de 25 soles + Pin Limpieza Pro'
  },
  {
    nombre: '3 meses',
    logro: 'Llegaste a los 3 meses, y ya sabes tu trabajo y te llevas bien con tus companeros.',
    premio: 'Vale de consumo de 25 soles + Pin 3 meses'
  },
  {
    nombre: 'Influencer',
    logro: 'Crea historias y reels para la marca, ademas participa en reels, historias y/o post de la marca.',
    premio: 'Bono dinero efectivo de 50 soles + Pin Influencer + 1 consumos al 15% de descuento'
  },
  {
    nombre: 'Creciendo',
    logro: 'Actitud positiva, aprende varias areas, respeta normas y se capacita. Ya domina al menos 1 de las 5 secciones y sigue avanzando.',
    premio: 'Vale de consumo de 50 soles + Pin Creciendo + 1 consumos al 15% de descuento'
  },
  {
    nombre: 'Creatividad',
    logro: 'Proponer 2 mejoras para su area o para el local que se implemente y funcione.',
    premio: 'Vale de consumo de 50 soles + Pin Creciendo + 1 consumos al 15% de descuento'
  },
  {
    nombre: 'Actitud Belu',
    logro: 'Mostrar actitud positiva constante, buena energia y disposicion a ayudar, desde el inicio hasta el final.',
    premio: 'Bono dinero efectivo de 70 soles + Pin Actitud Belu + 1 consumo del 30%'
  },
  {
    nombre: 'Trabajo en equipo',
    logro: 'Reconoce a quien destaca por ayudar a sus companeros, evitar conflictos, proponer soluciones y trabajar en armonia con todo el grupo.',
    premio: 'Bono dinero efectivo de 70 soles + Pin Trabajo en equipo + 1 consumos al 30%'
  },
  {
    nombre: 'Servicio Estrella',
    logro: 'Atencion PRO, atento con el cliente y con los pedidos, recibir felicitaciones de los clientes.',
    premio: 'Bono dinero efectivo de 100 soles + Pin Servicio Estrella + 1 consumos al 30%'
  },
  {
    nombre: '1 ano',
    logro: 'Al cumplir 1 ano de trabajo con buena evaluacion de parte de companeros y administracion.',
    premio: 'Bono en efectivo de 100 soles + Pin 1 ano + 30% x 3 veces'
  },
  {
    nombre: 'Maestro embajador',
    logro: 'Acumular 6 pines en el ano y ademas durante ese ano no tener mas de 3 comentarios negativos del cliente por cualquier incidente.',
    premio: 'Bono especial en efectivo de 500 soles + Descuento de Gerente (40% en consumos x 10) + Pin MAESTRO EMBAJADOR (GOLD)'
  },
  {
    nombre: 'Veterano',
    logro: 'Cumplir 2 anos como Maestro Embajador llegando a la meta anual (2 anos consecutivos).',
    premio: 'Bono en efectivo de 600 soles + Descuento de Gerente Master (50% en consumos x 10) + Pin Veterano'
  }
];
const FOTOS_ASIST_DIR = uploadsPath('fotos_asistencia');
fs.mkdirSync(FOTOS_ASIST_DIR, { recursive: true });

// ── DB ───────────────────────────────────────────────────────────
const db = openDatabase('asistencia.db', err => {
  if (err) { console.error('Asistencia DB error:', err.message); return; }
  console.log('  ✓ asistencia.db conectada');
  if (shouldMigrate()) initDB();
});
db.on('error', err => console.error('Asistencia DB:', err.message));

const erroresDb = openDatabase('errores.db', err => {
  if (err) { console.error('Errores DB (asistencia aux) error:', err.message); }
});
erroresDb.on('error', err => console.error('Errores DB (asistencia aux):', err.message));

function erroresAll(sql, p = []) {
  return new Promise((res, rej) => erroresDb.all(sql, p, (e, r) => e ? rej(e) : res(r || [])));
}
function erroresRun(sql, p = []) {
  return new Promise((res, rej) => erroresDb.run(sql, p, function(e) { e ? rej(e) : res(this); }));
}

async function getErroresPendientesSalida(empleadoId, fecha) {
  await require('./errores').ensureErroresSchema();
  return erroresAll(
    `SELECT id, descripcion, solucion, hora, seccion
     FROM errores
     WHERE fecha = ?
       AND resuelto = 0
       AND (
         (empleado_id = ? AND COALESCE(para_todos, 0) = 0 AND notificado_salida = 0)
         OR (
           COALESCE(para_todos, 0) = 1
           AND id NOT IN (SELECT error_id FROM error_vistos WHERE empleado_id = ?)
         )
       )
     ORDER BY hora ASC, id ASC`,
    [fecha, empleadoId, empleadoId]
  );
}

function run(sql, p = []) {
  return new Promise((res, rej) => db.run(sql, p, function(e) { e ? rej(e) : res({ id: this.lastID, changes: this.changes }); }));
}
function get(sql, p = []) {
  return new Promise((res, rej) => db.get(sql, p, (e, r) => e ? rej(e) : res(r)));
}
function all(sql, p = []) {
  return new Promise((res, rej) => db.all(sql, p, (e, r) => e ? rej(e) : res(r)));
}

// Compatibilidad: en algunas migraciones antiguas `activo` quedó como texto
// (p.ej. "true", "si", "1"). Esta expresión evita perder embajadores por tipado.
const SQL_ACTIVO_TRUE = "COALESCE(NULLIF(LOWER(TRIM(CAST(activo AS TEXT))),''),'1') IN ('1','true','t','si','s','y','yes')";

function esActivo(valor) {
  if (valor === null || valor === undefined) return true;
  const v = String(valor).trim().toLowerCase();
  if (!v) return true;
  return ['1', 'true', 't', 'si', 's', 'y', 'yes'].includes(v);
}

let configSchemaReady = null;

async function safeAddColumn(sql) {
  try {
    await run(sql);
  } catch (e) {
    // Ignorar errores de columna ya existente (distintas versiones de SQLite usan mensajes diferentes)
    if (!/duplicate column name|already exists/i.test(e.message)) throw e;
  }
}

let _sueldoAjustesSchemaReady = null;
async function ensureSueldoAjustesColumns() {
  if (_sueldoAjustesSchemaReady) return _sueldoAjustesSchemaReady;
  _sueldoAjustesSchemaReady = (async () => {
    // Verificar columnas via PRAGMA (más fiable que atrapar errores de ALTER TABLE)
    const cols = await all(`PRAGMA table_info(sueldo_ajustes)`);
    const names = new Set(cols.map(c => c.name));
    if (!names.has('descansos_override'))         await safeAddColumn(`ALTER TABLE sueldo_ajustes ADD COLUMN descansos_override INTEGER DEFAULT NULL`);
    if (!names.has('descansos_fechas'))           await safeAddColumn(`ALTER TABLE sueldo_ajustes ADD COLUMN descansos_fechas TEXT DEFAULT NULL`);
    if (!names.has('feriados_fechas'))            await safeAddColumn(`ALTER TABLE sueldo_ajustes ADD COLUMN feriados_fechas TEXT DEFAULT NULL`);
    if (!names.has('no_contable_fechas'))         await safeAddColumn(`ALTER TABLE sueldo_ajustes ADD COLUMN no_contable_fechas TEXT DEFAULT NULL`);
    if (!names.has('faltas_fechas'))              await safeAddColumn(`ALTER TABLE sueldo_ajustes ADD COLUMN faltas_fechas TEXT DEFAULT NULL`);
    if (!names.has('faltas_override'))            await safeAddColumn(`ALTER TABLE sueldo_ajustes ADD COLUMN faltas_override INTEGER DEFAULT NULL`);
    if (!names.has('tardanzas_override'))         await safeAddColumn(`ALTER TABLE sueldo_ajustes ADD COLUMN tardanzas_override INTEGER DEFAULT NULL`);
    if (!names.has('nota'))                       await safeAddColumn(`ALTER TABLE sueldo_ajustes ADD COLUMN nota TEXT DEFAULT ''`);
      if (!names.has('dias_adicionales_override'))  await safeAddColumn(`ALTER TABLE sueldo_ajustes ADD COLUMN dias_adicionales_override INTEGER DEFAULT NULL`);
      if (!names.has('dias_trabajados_override'))   await safeAddColumn(`ALTER TABLE sueldo_ajustes ADD COLUMN dias_trabajados_override INTEGER DEFAULT NULL`);
    if (!names.has('dom_monto_override'))         await safeAddColumn(`ALTER TABLE sueldo_ajustes ADD COLUMN dom_monto_override FLOAT DEFAULT NULL`);
    if (!names.has('onp_override'))               await safeAddColumn(`ALTER TABLE sueldo_ajustes ADD COLUMN onp_override BOOLEAN DEFAULT NULL`);
  })().catch(err => { _sueldoAjustesSchemaReady = null; throw err; });
  return _sueldoAjustesSchemaReady;
}

async function ensureConfigSchema() {
  if (configSchemaReady) return configSchemaReady;
  if (!shouldMigrate()) { configSchemaReady = Promise.resolve(); return configSchemaReady; }

  configSchemaReady = (async () => {
    await run(`CREATE TABLE IF NOT EXISTS configuracion (
      id INTEGER PRIMARY KEY,
      sueldo_minimo FLOAT DEFAULT 1025.0,
      valor_dia FLOAT DEFAULT NULL,
      valor_hora FLOAT DEFAULT NULL,
      hora_ingreso VARCHAR(5) DEFAULT '06:30',
      tolerancia_min INTEGER DEFAULT 5,
      descuento_tardanza FLOAT DEFAULT 2.0,
      email_smtp VARCHAR(100) DEFAULT 'smtp.gmail.com',
      email_puerto INTEGER DEFAULT 587,
      email_usuario VARCHAR(120) DEFAULT '',
      email_password VARCHAR(200) DEFAULT '',
      email_activo BOOLEAN DEFAULT 0,
      backup_diario_activo BOOLEAN DEFAULT 0,
      backup_diario_ultimo_envio VARCHAR(10) DEFAULT '',
      correo_asistencia_db_ultimo VARCHAR(10) DEFAULT '',
      correo_respaldo_5_ultimo VARCHAR(10) DEFAULT '',
      correo_respaldo_5_pendiente VARCHAR(10) DEFAULT '',
      correo_quincena_pdf_ultimo VARCHAR(20) DEFAULT ''
    )`);

    const cols = await all(`PRAGMA table_info(configuracion)`);
    const names = new Set(cols.map(col => col.name));

    if (!names.has('backup_diario_activo')) {
      await safeAddColumn(`ALTER TABLE configuracion ADD COLUMN backup_diario_activo BOOLEAN DEFAULT 0`);
    }
    if (!names.has('backup_diario_ultimo_envio')) {
      await safeAddColumn(`ALTER TABLE configuracion ADD COLUMN backup_diario_ultimo_envio VARCHAR(10) DEFAULT ''`);
    }
    if (!names.has('correo_asistencia_db_ultimo')) {
      await safeAddColumn(`ALTER TABLE configuracion ADD COLUMN correo_asistencia_db_ultimo VARCHAR(10) DEFAULT ''`);
    }
    if (!names.has('correo_respaldo_5_ultimo')) {
      await safeAddColumn(`ALTER TABLE configuracion ADD COLUMN correo_respaldo_5_ultimo VARCHAR(10) DEFAULT ''`);
    }
    if (!names.has('correo_respaldo_5_pendiente')) {
      await safeAddColumn(`ALTER TABLE configuracion ADD COLUMN correo_respaldo_5_pendiente VARCHAR(10) DEFAULT ''`);
    }
    if (!names.has('correo_quincena_pdf_ultimo')) {
      await safeAddColumn(`ALTER TABLE configuracion ADD COLUMN correo_quincena_pdf_ultimo VARCHAR(20) DEFAULT ''`);
    }
    if (!names.has('valor_dia')) {
      await safeAddColumn(`ALTER TABLE configuracion ADD COLUMN valor_dia FLOAT DEFAULT NULL`);
    }
    if (!names.has('valor_hora')) {
      await safeAddColumn(`ALTER TABLE configuracion ADD COLUMN valor_hora FLOAT DEFAULT NULL`);
    }

    await run(`INSERT OR IGNORE INTO configuracion (id) VALUES (1)`);

    // Garantizar columnas en sueldo_ajustes aunque la DB sea vieja
    await safeAddColumn(`ALTER TABLE sueldo_ajustes ADD COLUMN descansos_override INTEGER DEFAULT NULL`);
    await safeAddColumn(`ALTER TABLE sueldo_ajustes ADD COLUMN descansos_fechas TEXT DEFAULT NULL`);
    await safeAddColumn(`ALTER TABLE sueldo_ajustes ADD COLUMN feriados_fechas TEXT DEFAULT NULL`);
    await safeAddColumn(`ALTER TABLE sueldo_ajustes ADD COLUMN no_contable_fechas TEXT DEFAULT NULL`);
    await safeAddColumn(`ALTER TABLE sueldo_ajustes ADD COLUMN faltas_fechas TEXT DEFAULT NULL`);
    await safeAddColumn(`ALTER TABLE sueldo_ajustes ADD COLUMN dias_adicionales_override INTEGER DEFAULT NULL`);
    await safeAddColumn(`ALTER TABLE sueldo_ajustes ADD COLUMN dom_monto_override FLOAT DEFAULT NULL`);
    await safeAddColumn(`ALTER TABLE sueldo_ajustes ADD COLUMN onp_override BOOLEAN DEFAULT NULL`);
  })().catch(err => {
    configSchemaReady = null;
    throw err;
  });

  return configSchemaReady;
}

function initDB() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS empleados (
      id INTEGER PRIMARY KEY,
      documento VARCHAR(20) NOT NULL UNIQUE,
      tipo_doc VARCHAR(10) NOT NULL DEFAULT 'DNI',
      nombre VARCHAR(100) NOT NULL,
      apellido VARCHAR(100) NOT NULL,
      cargo VARCHAR(80) DEFAULT '',
      celular VARCHAR(20) DEFAULT '',
      email VARCHAR(120) DEFAULT '',
      foto VARCHAR(200) DEFAULT '',
      fecha_ingreso DATE DEFAULT NULL,
      fecha_nacimiento DATE DEFAULT NULL,
      onp BOOLEAN DEFAULT 0,
      activo BOOLEAN DEFAULT 1,
      fecha_baja DATE DEFAULT NULL,
      nota_baja VARCHAR(500) DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS empleado_pines (
      id INTEGER PRIMARY KEY,
      empleado_id INTEGER NOT NULL,
      pin_nombre VARCHAR(120) NOT NULL,
      fecha_otorgado DATE DEFAULT NULL,
      nota VARCHAR(500) DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (empleado_id) REFERENCES empleados(id)
    )`);
    db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_empleado_pin_unico ON empleado_pines (empleado_id, pin_nombre)`);
    db.run(`CREATE TABLE IF NOT EXISTS registros (
      id INTEGER PRIMARY KEY,
      empleado_id INTEGER NOT NULL,
      fecha DATE NOT NULL,
      hora_entrada DATETIME,
      hora_salida DATETIME,
      observacion VARCHAR(200) DEFAULT '',
      FOREIGN KEY (empleado_id) REFERENCES empleados(id)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY,
      tabla VARCHAR(50),
      registro_id INTEGER,
      accion VARCHAR(40),
      detalle VARCHAR(500),
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS configuracion (
      id INTEGER PRIMARY KEY,
      sueldo_minimo FLOAT DEFAULT 1025.0,
      valor_dia FLOAT DEFAULT NULL,
      valor_hora FLOAT DEFAULT NULL,
      hora_ingreso VARCHAR(5) DEFAULT '06:30',
      tolerancia_min INTEGER DEFAULT 5,
      descuento_tardanza FLOAT DEFAULT 2.0,
      email_smtp VARCHAR(100) DEFAULT 'smtp.gmail.com',
      email_puerto INTEGER DEFAULT 587,
      email_usuario VARCHAR(120) DEFAULT '',
      email_password VARCHAR(200) DEFAULT '',
      email_activo BOOLEAN DEFAULT 0,
      backup_diario_activo BOOLEAN DEFAULT 0,
      backup_diario_ultimo_envio VARCHAR(10) DEFAULT ''
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS sueldo_ajustes (
      id INTEGER PRIMARY KEY,
      empleado_id INTEGER NOT NULL,
      periodo_desde DATE NOT NULL,
      periodo_hasta DATE NOT NULL,
      feriados INTEGER DEFAULT 0,
      faltas_override INTEGER DEFAULT NULL,
      tardanzas_override INTEGER DEFAULT NULL,
      descansos_override INTEGER DEFAULT NULL,
      descansos_fechas TEXT DEFAULT NULL,
      feriados_fechas TEXT DEFAULT NULL,
      no_contable_fechas TEXT DEFAULT NULL,
      faltas_fechas TEXT DEFAULT NULL,
      dias_trabajados_override INTEGER DEFAULT NULL,
      prestamo FLOAT DEFAULT 0.0,
      bono FLOAT DEFAULT 0.0,
      nota TEXT DEFAULT '',
      dias_adicionales_override INTEGER DEFAULT NULL,
      dom_monto_override FLOAT DEFAULT NULL,
      onp_override BOOLEAN DEFAULT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (empleado_id) REFERENCES empleados(id)
    )`);
    db.run(`ALTER TABLE sueldo_ajustes ADD COLUMN nota TEXT DEFAULT ""`, () => {}); // ignorar si ya existe
    db.run(`ALTER TABLE sueldo_ajustes ADD COLUMN faltas_override INTEGER DEFAULT NULL`, () => {});
    db.run(`ALTER TABLE sueldo_ajustes ADD COLUMN tardanzas_override INTEGER DEFAULT NULL`, () => {});
    db.run(`ALTER TABLE sueldo_ajustes ADD COLUMN descansos_override INTEGER DEFAULT NULL`, () => {});
    db.run(`ALTER TABLE sueldo_ajustes ADD COLUMN descansos_fechas TEXT DEFAULT NULL`, () => {});
    db.run(`ALTER TABLE sueldo_ajustes ADD COLUMN feriados_fechas TEXT DEFAULT NULL`, () => {});
    db.run(`ALTER TABLE sueldo_ajustes ADD COLUMN no_contable_fechas TEXT DEFAULT NULL`, () => {});
    db.run(`ALTER TABLE sueldo_ajustes ADD COLUMN faltas_fechas TEXT DEFAULT NULL`, () => {});
    db.run(`ALTER TABLE sueldo_ajustes ADD COLUMN dias_trabajados_override INTEGER DEFAULT NULL`, () => {});
    db.run(`ALTER TABLE sueldo_ajustes ADD COLUMN dias_adicionales_override INTEGER DEFAULT NULL`, () => {});
    db.run(`ALTER TABLE sueldo_ajustes ADD COLUMN dom_monto_override FLOAT DEFAULT NULL`, () => {});
    db.run(`ALTER TABLE sueldo_ajustes ADD COLUMN onp_override BOOLEAN DEFAULT NULL`, () => {});
    db.run(`ALTER TABLE empleados ADD COLUMN fecha_ingreso DATE DEFAULT NULL`, () => {});
    db.run(`ALTER TABLE empleados ADD COLUMN fecha_nacimiento DATE DEFAULT NULL`, () => {});
    db.run(`ALTER TABLE empleados ADD COLUMN fecha_baja DATE DEFAULT NULL`, () => {});
    db.run(`UPDATE empleados SET activo=1 WHERE activo IS NULL`, () => {});
    db.run(`ALTER TABLE registros ADD COLUMN foto_entrada TEXT DEFAULT ''`, () => {});
    db.run(`ALTER TABLE registros ADD COLUMN foto_salida TEXT DEFAULT ''`, () => {});
    db.run(`ALTER TABLE configuracion ADD COLUMN valor_dia FLOAT DEFAULT NULL`, () => {});
    db.run(`ALTER TABLE configuracion ADD COLUMN valor_hora FLOAT DEFAULT NULL`, () => {});
    db.run(`ALTER TABLE configuracion ADD COLUMN backup_diario_activo BOOLEAN DEFAULT 0`, () => {});
    db.run(`ALTER TABLE configuracion ADD COLUMN backup_diario_ultimo_envio VARCHAR(10) DEFAULT ''`, () => {});
    db.run(`INSERT OR IGNORE INTO configuracion (id) VALUES (1)`);
  });
}

// ── Guardar foto de asistencia ───────────────────────────────────
function saveAsistPhoto(doc, fecha, tipo, base64Data) {
  if (!base64Data) return '';
  try {
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const filename = `${doc}_${fecha}_${tipo}.jpg`;
    const filepath = path.join(FOTOS_ASIST_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    return filename;
  } catch (e) {
    console.error('Error guardando foto asistencia:', e.message);
    return '';
  }
}

// ── Helpers de fecha ─────────────────────────────────────────────
const nowLima  = () => DateTime.now().setZone(TZ);
const hoyISO   = () => nowLima().toISODate();
const ayerISO  = () => nowLima().minus({ days: 1 }).toISODate();
const ahoraSQL = () => nowLima().toFormat('yyyy-LL-dd HH:mm:ss');

function tieneFechaNacimiento(fecha) {
  return !!String(fecha || '').trim();
}

function esCumpleanosHoy(fechaNacimiento) {
  if (!tieneFechaNacimiento(fechaNacimiento)) return false;
  const partes = String(fechaNacimiento).trim().slice(0, 10).split('-');
  if (partes.length < 3) return false;
  const mes = parseInt(partes[1], 10);
  const dia = parseInt(partes[2], 10);
  if (!mes || !dia) return false;
  const hoy = nowLima();
  return mes === hoy.month && dia === hoy.day;
}

function validarFechaNacimientoISO(iso) {
  const s = String(iso || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return { ok: false, error: 'Fecha inválida.' };
  const [y, m, d] = s.split('-').map(Number);
  if (y < 1950 || y > 2026) return { ok: false, error: 'El año debe estar entre 1950 y 2026.' };
  const dt = DateTime.fromObject({ year: y, month: m, day: d }, { zone: TZ });
  if (!dt.isValid || dt.year !== y || dt.month !== m || dt.day !== d) {
    return { ok: false, error: 'Esa fecha de cumpleaños no es válida.' };
  }
  return { ok: true, fecha: s };
}

function embajadorBuscarPayload(emp, estado) {
  return {
    encontrado: true,
    id: emp.id,
    nombre: `${emp.nombre} ${emp.apellido}`,
    nombre_solo: emp.nombre,
    tipo_doc: emp.tipo_doc,
    estado,
    foto: emp.foto,
    requiere_cumpleanos: !tieneFechaNacimiento(emp.fecha_nacimiento),
    es_cumpleanos: esCumpleanosHoy(emp.fecha_nacimiento)
  };
}

function normalizeEmailPassword(value) {
  return String(value || '').replace(/\s+/g, '').trim();
}

async function buildBoletaPayload(empId, desde, hasta) {
  await ensureSueldoAjustesColumns();
  const cfg = await get('SELECT * FROM configuracion WHERE id=1') || {};
  const valores = getValoresSalariales(cfg);
  const descTardanza = +cfg.descuento_tardanza || 2;

  const emp = await get('SELECT * FROM empleados WHERE id=?', [+empId]);
  if (!emp) return null;

  const periodoSolicitado = { desde, hasta };
  const periodoEmp = periodoConCortePorBaja(periodoSolicitado, emp);
  if (periodoEmp.hasta < periodoEmp.desde) return null;

  const ajuste = await get(
    'SELECT * FROM sueldo_ajustes WHERE empleado_id=? AND periodo_desde=? AND periodo_hasta=?',
    [+empId, desde, hasta]
  );
  const ajustesSolapados = await all(
    `SELECT descansos_fechas, feriados_fechas, no_contable_fechas, faltas_fechas
     FROM sueldo_ajustes
     WHERE empleado_id=? AND NOT (periodo_hasta < ? OR periodo_desde > ?)`,
    [+empId, periodoEmp.desde, periodoEmp.hasta]
  );
  const regs = await all(
    'SELECT * FROM registros WHERE empleado_id=? AND fecha>=? AND fecha<=? ORDER BY fecha',
    [+empId, periodoEmp.desde, periodoEmp.hasta]
  );
  const desdeDT = DateTime.fromISO(periodoEmp.desde, { zone: TZ });
  const hastaDT = DateTime.fromISO(periodoEmp.hasta, { zone: TZ });
  const ctxDesde = desdeDT.minus({ days: weekday(desdeDT) }).toISODate();
  const ctxHasta = hastaDT.plus({ days: 6 - weekday(hastaDT) }).toISODate();
  const regsContext = await all(
    'SELECT * FROM registros WHERE empleado_id=? AND fecha>=? AND fecha<=? AND hora_entrada IS NOT NULL ORDER BY fecha',
    [+empId, ctxDesde, ctxHasta]
  );
  const resumen = calcularResumenSueldo({ emp, regs, ajuste, periodo: periodoEmp, cfg, regsContext });

  const parseFechas = (raw) => {
    try {
      const parsed = JSON.parse(raw || '[]');
      return Array.isArray(parsed) ? parsed.filter(f => typeof f === 'string') : [];
    } catch {
      return [];
    }
  };

  const inPeriodoSolicitado = (f) => typeof f === 'string' && f >= periodoEmp.desde && f <= periodoEmp.hasta;

  const descansosSet = new Set();
  const feriadosSet = new Set();
  const noContableSet = new Set();
  const faltasSet = new Set();

  for (const a of (ajustesSolapados || [])) {
    for (const f of parseFechas(a.descansos_fechas)) if (inPeriodoSolicitado(f)) descansosSet.add(f);
    for (const f of parseFechas(a.feriados_fechas)) if (inPeriodoSolicitado(f)) feriadosSet.add(f);
    for (const f of parseFechas(a.no_contable_fechas)) if (inPeriodoSolicitado(f)) noContableSet.add(f);
    for (const f of parseFechas(a.faltas_fechas)) if (inPeriodoSolicitado(f)) faltasSet.add(f);
  }

  const noContableFechas = [...noContableSet].sort();
  const feriadosFechas = [...feriadosSet].filter(f => !noContableSet.has(f)).sort();
  const descansosFechas = [...descansosSet].filter(f => !noContableSet.has(f) && !feriadosSet.has(f)).sort();
  const faltasFechas = [...faltasSet].filter(f => !noContableSet.has(f) && !feriadosSet.has(f) && !descansosSet.has(f)).sort();

  const registros = regs.map(r => {
    const tarde = !r.hora_salida || esTardanza(r.fecha, r.hora_entrada);
    return {
      fecha: r.fecha,
      hora_entrada: r.hora_entrada ? r.hora_entrada.slice(11, 16) : null,
      hora_salida: r.hora_salida ? r.hora_salida.slice(11, 16) : null,
      observacion: r.observacion || '',
      tarde,
      jornada: calcularJornadaPagable(r.fecha, r.hora_entrada, r.hora_salida)
    };
  });

  return {
    emp,
    ajuste,
    registros,
    descansosFechas,
    feriadosFechas,
    noContableFechas,
    faltasFechas,
    valorDia: valores.valorDia,
    valorHora: valores.valorHora,
    descTardanza,
    periodo: periodoEmp,
    resumen,
    baseHoraParcial: HORA_BASE_SUELDO_PARCIAL
  };
}

function weekday(dt) { return (dt.weekday + 6) % 7; } // 0=Lun..6=Dom

function antiguedadDesde(fechaIngreso) {
  if (!fechaIngreso) return { dias: 0, texto: 'Sin fecha de ingreso' };
  const ini = DateTime.fromISO(String(fechaIngreso), { zone: TZ }).startOf('day');
  if (!ini.isValid) return { dias: 0, texto: 'Fecha de ingreso invalida' };
  const hoy = nowLima().startOf('day');
  const dias = Math.max(0, Math.floor(hoy.diff(ini, 'days').days || 0));
  const anios = Math.floor(dias / 365);
  const meses = Math.floor((dias % 365) / 30);
  const restantes = dias - (anios * 365) - (meses * 30);
  const partes = [];
  if (anios > 0) partes.push(`${anios} ano${anios === 1 ? '' : 's'}`);
  if (meses > 0) partes.push(`${meses} mes${meses === 1 ? '' : 'es'}`);
  if (restantes > 0 || !partes.length) partes.push(`${restantes} dia${restantes === 1 ? '' : 's'}`);
  return { dias, texto: partes.join(', ') };
}

function normalizarPines(payload) {
  if (!payload) return [];
  let parsed = payload;
  if (typeof payload === 'string') {
    try { parsed = JSON.parse(payload); }
    catch { return []; }
  }
  if (!Array.isArray(parsed)) return [];
  const permitidos = new Set(PINES_CATALOGO.map(p => p.nombre));
  return parsed
    .map(p => ({
      nombre: String(p?.nombre || '').trim(),
      ganado: !!p?.ganado,
      fecha_otorgado: String(p?.fecha_otorgado || '').trim(),
      nota: String(p?.nota || '').trim().slice(0, 500)
    }))
    .filter(p => p.nombre && permitidos.has(p.nombre));
}

async function obtenerPinesEmpleado(empleadoId) {
  const rows = await all('SELECT pin_nombre, fecha_otorgado, nota FROM empleado_pines WHERE empleado_id=?', [+empleadoId]);
  const map = new Map(rows.map(r => [r.pin_nombre, r]));
  return PINES_CATALOGO.map(pin => {
    const actual = map.get(pin.nombre);
    return {
      ...pin,
      ganado: !!actual,
      fecha_otorgado: actual?.fecha_otorgado || '',
      nota: actual?.nota || ''
    };
  });
}

async function syncPinesEmpleado(empleadoId, pinesPayload) {
  const pines = normalizarPines(pinesPayload);
  for (const pin of pines) {
    if (!pin.ganado) {
      await run('DELETE FROM empleado_pines WHERE empleado_id=? AND pin_nombre=?', [+empleadoId, pin.nombre]);
      continue;
    }
    await run(
      `INSERT INTO empleado_pines (empleado_id,pin_nombre,fecha_otorgado,nota,created_at)
       VALUES (?,?,?,?,?)
       ON CONFLICT(empleado_id,pin_nombre)
       DO UPDATE SET fecha_otorgado=excluded.fecha_otorgado, nota=excluded.nota`,
      [+empleadoId, pin.nombre, pin.fecha_otorgado || null, pin.nota || '', ahoraSQL()]
    );
  }
}

function periodoParams(anio, mes, quincena) {
  const hoy = nowLima();
  anio     = +anio     || hoy.year;
  mes      = +mes      || hoy.month;
  quincena = +quincena || (hoy.day <= 15 ? 1 : 2);
  const desde = DateTime.fromObject({ year: anio, month: mes, day: quincena === 1 ? 1 : 16 }, { zone: TZ });
  const hasta  = quincena === 1
    ? DateTime.fromObject({ year: anio, month: mes, day: 15 }, { zone: TZ })
    : DateTime.fromObject({ year: anio, month: mes, day: 1 }, { zone: TZ }).endOf('month').startOf('day');
  return { anio, mes, quincena, desde: desde.toISODate(), hasta: hasta.toISODate() };
}

function isoDateOrNull(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const dt = DateTime.fromISO(raw, { zone: TZ }).startOf('day');
  return dt.isValid ? dt.toISODate() : null;
}

function periodoConCortePorBaja(periodo, emp) {
  const desde = DateTime.fromISO(periodo.desde, { zone: TZ });
  const hasta = DateTime.fromISO(periodo.hasta, { zone: TZ });
  if (!desde.isValid || !hasta.isValid) return periodo;

  let desdeCortado = desde;
  let hastaCortado = hasta;

  const ingreso = isoDateOrNull(emp?.fecha_ingreso);
  if (ingreso) {
    const inicioLab = DateTime.fromISO(ingreso, { zone: TZ });
    if (inicioLab.isValid && inicioLab > desdeCortado) {
      desdeCortado = inicioLab;
    }
  }

  const baja = isoDateOrNull(emp?.fecha_baja);
  if (baja) {
    const corteBaja = DateTime.fromISO(baja, { zone: TZ });
    if (corteBaja.isValid && corteBaja < hastaCortado) {
      hastaCortado = corteBaja;
    }
  }

  return {
    ...periodo,
    desde: desdeCortado.toISODate(),
    hasta: hastaCortado.toISODate()
  };
}

const HORA_BASE_SUELDO_PARCIAL = '07:00';
const HORA_LIMITE_TARDANZA = '06:45';

function toMoney(value) {
  return +(+value || 0).toFixed(2);
}

function getValoresSalariales(cfg = {}) {
  const sueldoMinimo = +cfg.sueldo_minimo || 1025;
  const autoValorDia = toMoney(sueldoMinimo / 30);
  const manualDia = Number.isFinite(+cfg.valor_dia) && +cfg.valor_dia > 0 ? +cfg.valor_dia : null;
  const valorDia = toMoney(manualDia ?? autoValorDia);
  const autoValorHora = toMoney(valorDia / 8);
  const manualHora = Number.isFinite(+cfg.valor_hora) && +cfg.valor_hora > 0 ? +cfg.valor_hora : null;
  const valorHora = toMoney(manualHora ?? autoValorHora);

  return {
    sueldoMinimo,
    valorDia,
    valorHora,
    valorDiaAuto: autoValorDia,
    valorHoraAuto: autoValorHora,
    valorDiaManual: manualDia,
    valorHoraManual: manualHora
  };
}

function calcularJornadaPagable(fecha, horaEntrada, horaSalida) {
  if (!fecha || !horaSalida) return { dias: 0, horas: 0, minutosBase: 0, minutosTrabajados: 0 };

  const salida = DateTime.fromSQL(horaSalida, { zone: TZ });
  const entrada = horaEntrada ? DateTime.fromSQL(horaEntrada, { zone: TZ }) : null;
  if (!salida.isValid) return { dias: 0, horas: 0, minutosBase: 0, minutosTrabajados: 0 };

  const limiteEntrada = DateTime.fromISO(fecha, { zone: TZ }).set({ hour: 7, minute: 0, second: 0, millisecond: 0 });
  const limiteSalida = DateTime.fromISO(fecha, { zone: TZ }).set({ hour: 14, minute: 45, second: 0, millisecond: 0 });
  const minutosBase = Math.max(0, Math.floor(salida.diff(limiteEntrada, 'minutes').minutes || 0));
  const inicioComputable = entrada?.isValid
    ? (entrada > limiteEntrada ? entrada : limiteEntrada)
    : limiteEntrada;
  const minutosTrabajados = Math.max(0, Math.floor(salida.diff(inicioComputable, 'minutes').minutes || 0));

  // Dia completo solo si ingreso antes de 07:00 y salio despues de 14:45.
  if (entrada?.isValid && entrada < limiteEntrada && salida > limiteSalida) {
    return { dias: 1, horas: 0, minutosBase, minutosTrabajados };
  }

  const bloquesMediaHora = Math.floor(minutosTrabajados / 30);
  const horas = bloquesMediaHora / 2;

  return { dias: 0, horas, minutosBase, minutosTrabajados };
}

function esTardanza(fecha, horaEntrada) {
  if (!fecha || !horaEntrada) return false;
  const entrada = DateTime.fromSQL(horaEntrada, { zone: TZ });
  if (!entrada.isValid) return false;

  const horaLimite = DateTime.fromFormat(HORA_LIMITE_TARDANZA, 'HH:mm', { zone: TZ });
  if (!horaLimite.isValid) return false;

  const limite = DateTime.fromISO(fecha, { zone: TZ }).set({
    hour: horaLimite.hour,
    minute: horaLimite.minute,
    second: 0,
    millisecond: 0
  });

  return entrada > limite;
}

function calcularResumenSueldo({ emp, regs, ajuste, periodo, cfg, regsContext = [] }) {
  const { valorDia, valorHora } = getValoresSalariales(cfg);
  const descTardanza = +cfg.descuento_tardanza || 2;

  // fechasContextSet incluye dias fuera del periodo (semanas parciales previas/posteriores)
  // para detectar si el descanso semanal ya fue consumido en la quincena anterior.
  const fechasContextSet = new Set(regsContext.map(r => r.fecha));
  const fechaIngresoEmp = emp.fecha_ingreso ? DateTime.fromISO(String(emp.fecha_ingreso), { zone: TZ }) : null;

  let feriadosFechasSet = new Set();
  let noContableFechasSet = new Set();
  try {
    const parsed = JSON.parse(ajuste?.feriados_fechas || '[]');
    if (Array.isArray(parsed)) feriadosFechasSet = new Set(parsed.filter(f => typeof f === 'string'));
  } catch {}
  try {
    const parsed = JSON.parse(ajuste?.no_contable_fechas || '[]');
    if (Array.isArray(parsed)) noContableFechasSet = new Set(parsed.filter(f => typeof f === 'string'));
  } catch {}

  const conEntrada = regs.filter(r => r.hora_entrada && !noContableFechasSet.has(r.fecha));
  const completos = conEntrada.filter(r => r.hora_salida);
  const sinSalida = conEntrada.filter(r => !r.hora_salida);
  const fechasAsistencia = new Set(conEntrada.map(r => r.fecha));
  for (const f of feriadosFechasSet) {
    if (!noContableFechasSet.has(f)) fechasAsistencia.add(f);
  }

  let diasTrabajados = 0;
  let horasTrabajadas = 0;
  for (const reg of completos) {
    const jornada = calcularJornadaPagable(reg.fecha, reg.hora_entrada, reg.hora_salida);
    diasTrabajados += jornada.dias;
    horasTrabajadas += jornada.horas;
  }
  // Regla solicitada: si hay entrada pero no salida, se paga como dia completo.
  diasTrabajados += sinSalida.length;
  horasTrabajadas = toMoney(horasTrabajadas);

  let tardCount = 0;
  for (const r of completos) {
    if (esTardanza(r.fecha, r.hora_entrada)) tardCount++;
  }
  // Regla solicitada: falta de salida siempre cuenta como tardanza.
  tardCount += sinSalida.length;

  const desde = DateTime.fromISO(periodo.desde, { zone: TZ });
  const hasta = DateTime.fromISO(periodo.hasta, { zone: TZ });
  const hoy = nowLima().startOf('day');
  const hastaCalc = hasta < hoy ? hasta : hoy;
  const periodoCerrado = hastaCalc.toISODate() === hasta.toISODate();

  let diasAdicionales = 0;
  let descansosAuto = 0;
  let faltasAuto = 0;
  let domMonto = 0;
  let lun = desde.minus({ days: weekday(desde) });
  while (lun <= hastaCalc) {
    const diasSem = [];
    for (let i = 0; i < 7; i++) {
      const d = lun.plus({ days: i });
      const f = d.toISODate();
      if (d >= desde && d <= hastaCalc && !noContableFechasSet.has(f)) diasSem.push(f);
    }
    if (diasSem.length === 7) {
      const trabSem = diasSem.filter(d => fechasAsistencia.has(d)).length;
      if (trabSem === 7) {
        // Regla: semana completa trabajada = 2 dias adicionales (se pagan 9 dias en total)
        diasAdicionales += 2;
      } else if (trabSem === 6) {
        // Regla: con 6 dias trabajados se paga 1 descanso
        descansosAuto += 1;
      } else {
        // Regla: con 5 o menos, existe 1 descanso no pagado; faltas = 6 - trabajados
        faltasAuto += Math.max(0, 6 - trabSem);
        domMonto += (valorDia / 7) * trabSem;
      }
    } else if (diasSem.length > 0) {
      const trabParcial = diasSem.filter(d => fechasAsistencia.has(d)).length;
      const ausenciasParcial = diasSem.length - trabParcial;
      const finSemana = lun.plus({ days: 6 });
      const semanaParcialCierre = periodoCerrado && finSemana > hastaCalc;
      const semanaParcialInicio = lun < desde;

      if (ausenciasParcial > 0) {
        if (semanaParcialCierre) {
          // Semana parcial de cierre: 1er ausencia = descanso, las demás = faltas.
          descansosAuto += 1;
          faltasAuto += Math.max(0, ausenciasParcial - 1);
        } else if (semanaParcialInicio) {
          // Semana parcial de inicio: contar trabajo total en la semana completa
          // (días previos al período + días del período) para determinar si se
          // ganó el descanso semanal. Regla: se necesitan >= 6 días trabajados
          // en toda la semana para tener derecho a 1 descanso pagado.
          let preAusencias = 0;
          let preTrabajos = 0;
          for (let d = lun; d < desde; d = d.plus({ days: 1 })) {
            if (fechaIngresoEmp && d < fechaIngresoEmp) continue;
            if (!fechasContextSet.has(d.toISODate())) preAusencias++;
            else preTrabajos++;
          }
          const totalTrabajados = trabParcial + preTrabajos;
          if (totalTrabajados < 6) {
            // No se ganaron 6 días en la semana → todas las ausencias son faltas.
            faltasAuto += ausenciasParcial;
          } else {
            // Se ganó el descanso: verificar si ya fue asignado a la quincena anterior.
            const descansoConsumidoPrevio = preAusencias >= 1 && preTrabajos >= 1;
            if (descansoConsumidoPrevio) {
              faltasAuto += ausenciasParcial;
            } else {
              descansosAuto += 1;
              faltasAuto += Math.max(0, ausenciasParcial - 1);
            }
          }
        }
      }
    }
    lun = lun.plus({ days: 7 });
  }
  domMonto = toMoney(domMonto);

  const feriadosAuto = [...feriadosFechasSet]
    .filter(f => !noContableFechasSet.has(f) && f >= periodo.desde && f <= periodo.hasta)
    .length;
  const feriados = feriadosAuto > 0 ? feriadosAuto : (+ajuste?.feriados || 0);
  const prestamo = +ajuste?.prestamo || 0;
  const bono = +ajuste?.bono || 0;
  const nota = ajuste?.nota || '';
  const diasTrabajadosOverride = ajuste?.dias_trabajados_override === null || ajuste?.dias_trabajados_override === undefined
    ? null
    : Math.max(0, +ajuste.dias_trabajados_override || 0);
  const diasTrabajadosFinal = diasTrabajadosOverride ?? diasTrabajados;
  const faltasManual = ajuste?.faltas_override === null || ajuste?.faltas_override === undefined ? null : Math.max(0, +ajuste.faltas_override || 0);
  const tardanzasManual = ajuste?.tardanzas_override === null || ajuste?.tardanzas_override === undefined ? null : Math.max(0, +ajuste.tardanzas_override || 0);
  const descansosManual = ajuste?.descansos_override === null || ajuste?.descansos_override === undefined ? null : Math.max(0, +ajuste.descansos_override || 0);
  const faltas = faltasManual ?? faltasAuto;
  const tardanzaCount = tardanzasManual ?? tardCount;
  const descansos = descansosManual ?? descansosAuto;

  // Overrides para nuevos campos editables
  const diasAdicionalesOverride = ajuste?.dias_adicionales_override === null || ajuste?.dias_adicionales_override === undefined ? null : Math.max(0, +ajuste.dias_adicionales_override || 0);
  const domMontoOverride = ajuste?.dom_monto_override === null || ajuste?.dom_monto_override === undefined ? null : Math.max(0, +ajuste.dom_monto_override || 0);
  const onpOverride = ajuste?.onp_override === null || ajuste?.onp_override === undefined ? null : !!ajuste.onp_override;

  const diasAdicionalesFinal = diasAdicionalesOverride ?? diasAdicionales;
  const domMontoFinal = domMontoOverride ?? domMonto;
  const onpActivo = onpOverride ?? emp.onp;

  const tardanzaMonto = toMoney(tardanzaCount * descTardanza);
  const faltasMonto = toMoney(faltas * 20);
  const montoHoras = toMoney(horasTrabajadas * valorHora);
  const baseSinDescuentos = toMoney(((diasTrabajadosFinal + diasAdicionalesFinal + feriados + descansos) * valorDia) + montoHoras + domMontoFinal);
  const subtotal = toMoney(baseSinDescuentos - faltasMonto - tardanzaMonto);
  const onpMonto = onpActivo ? toMoney(subtotal * 0.13) : 0;
  const sueldo = toMoney(subtotal - onpMonto - prestamo + bono);

  return {
    diasTrabajados: diasTrabajadosFinal,
    diasTrabajadosAuto: diasTrabajados,
    diasTrabajadosOverride,
    horasTrabajadas,
    diasEquivalentes: toMoney(diasTrabajadosFinal + (horasTrabajadas / 8)),
    diasAdicionales: diasAdicionalesFinal,
    diasAdicionalesAuto: diasAdicionales,
    diasAdicionalesOverride,
    descansos,
    descansosAuto,
    descansosManual,
    faltas,
    feriados,
    domMonto: domMontoFinal,
    domMontoAuto: domMonto,
    domMontoOverride,
    faltasAuto,
    faltasManual,
    tardanzaCount,
    tardanzaAuto: tardCount,
    tardanzaManual: tardanzasManual,
    tardanzaMonto,
    faltasMonto,
    montoHoras,
    baseSinDescuentos,
    faltasDescuentoUnitario: 20,
    tardanzaDescuentoUnitario: descTardanza,
    valorDia,
    valorHora,
    prestamo,
    bono,
    nota,
    onpMonto,
    onpRate: onpActivo ? 0.13 : 0,
    onpActivo,
    onpOverride,
    subtotal,
    sueldo,
    baseHoraParcial: HORA_BASE_SUELDO_PARCIAL
  };
}

function duracion(entrada, salida) {
  if (!entrada || !salida) return '—';
  const e = DateTime.fromSQL(entrada, { zone: TZ });
  const s = DateTime.fromSQL(salida,  { zone: TZ });
  if (!e.isValid || !s.isValid) return '—';
  const seg = Math.max(0, s.diff(e, 'seconds').seconds);
  const h   = Math.floor(seg / 3600);
  const m   = Math.floor((seg % 3600) / 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

// ── Multer (fotos) ───────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (req, file, cb) => {
    const doc = String(req.body.documento || '').trim();
    const ext = file.originalname.split('.').pop().toLowerCase();
    cb(null, `${doc}.${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ['png','jpg','jpeg','webp'].includes(file.originalname.split('.').pop().toLowerCase());
    cb(null, ok);
  }
});

// ── Auth middleware ──────────────────────────────────────────────
function auth(req, res, next) {
  const u = req.session?.user;
  if (!u) return res.status(401).json({ error: 'No autenticado' });
  if (!u.modulos.includes('asistencia')) return res.status(403).json({ error: 'Sin acceso' });
  next();
}
function authAdmin(req, res, next) {
  const u = req.session?.user;
  if (!u) return res.status(401).json({ error: 'No autenticado' });
  if (!u.modulos.includes('asistencia')) return res.status(403).json({ error: 'Sin acceso' });
  if (!u.permisos?.asistencia_config) return res.status(403).json({ error: 'Solo administradores' });
  next();
}

const RUTAS_PUBLICAS = new Set([
  'GET:/dashboard',
  'GET:/buscar',
  'POST:/marcar',
  'POST:/cumpleanos',
  'POST:/errores-vistos'
]);

router.use((req, res, next) => {
  const key = `${req.method}:${req.path}`;
  if (RUTAS_PUBLICAS.has(key)) return next();
  return auth(req, res, next);
});

// ── Audit ────────────────────────────────────────────────────────
async function audit(tabla, id, accion, detalle) {
  await run('INSERT INTO audit_log (tabla,registro_id,accion,detalle,timestamp) VALUES (?,?,?,?,?)',
    [tabla, id, accion, detalle, ahoraSQL()]);
}

// ════════════════ DASHBOARD ════════════════

router.get('/dashboard', async (req, res) => {
  try {
    const hoy   = hoyISO();
    const total = (await get(`SELECT COUNT(*) AS t FROM empleados WHERE ${SQL_ACTIVO_TRUE}`))?.t || 0;
    const regs  = await all(`
      SELECT r.*, e.nombre, e.apellido, e.cargo, e.foto, e.documento
      FROM registros r JOIN empleados e ON e.id=r.empleado_id
      WHERE r.fecha=? ORDER BY r.hora_entrada DESC`, [hoy]);

    const registros = regs.map(r => ({
      ...r,
      nombre_completo: `${r.nombre} ${r.apellido}`,
      duracion: duracion(r.hora_entrada, r.hora_salida),
      hora_entrada: r.hora_entrada ? r.hora_entrada.slice(11, 16) : null,
      hora_salida:  r.hora_salida  ? r.hora_salida.slice(11, 16)  : null
    }));

    // Leaderboard quincenal
    const now = nowLima();
    const q   = periodoParams(now.year, now.month, now.day <= 15 ? 1 : 2);
    const activos = await all(`SELECT * FROM empleados WHERE ${SQL_ACTIVO_TRUE} ORDER BY apellido,nombre`);
    const lb = [];
    for (const e of activos) {
      const r = await get('SELECT COUNT(*) AS d FROM registros WHERE empleado_id=? AND fecha>=? AND fecha<=? AND hora_entrada IS NOT NULL',
        [e.id, q.desde, q.hasta]);
      lb.push({ nombre: `${e.nombre} ${e.apellido}`, dias: r?.d || 0 });
    }
    lb.sort((a, b) => b.dias - a.dias);

    res.json({ ok: true, hoy, total, registros, leaderboard: lb, periodo: q });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════ BUSCAR EMPLEADO (preview teclado) ════════════════

router.get('/buscar', async (req, res) => {
  try {
    const doc = String(req.query.documento || '').trim();
    if (!doc) return res.json({ encontrado: false });
    const emp = await get(`SELECT * FROM empleados WHERE documento=? AND ${SQL_ACTIVO_TRUE}`, [doc]);
    if (!emp) return res.json({ encontrado: false });
    const hoy = hoyISO();
    const reg = await get('SELECT hora_entrada, hora_salida FROM registros WHERE empleado_id=? AND fecha=?', [emp.id, hoy]);
    let estado = 'sin_registro';
    if (reg?.hora_entrada && reg?.hora_salida) estado = 'completo';
    else if (reg?.hora_entrada) estado = 'con_entrada';
    res.json(embajadorBuscarPayload(emp, estado));
  } catch(e) { res.json({ encontrado: false }); }
});

// ════════════════ REGISTRAR CUMPLEAÑOS (kiosco) ════════════════

router.post('/cumpleanos', async (req, res) => {
  try {
    const doc = String(req.body.documento || '').trim();
    const fechaRaw = String(req.body.fecha_nacimiento || '').trim();
    if (!doc) return res.status(400).json({ ok: false, error: 'Documento requerido.' });

    const emp = await get(`SELECT * FROM empleados WHERE documento=? AND ${SQL_ACTIVO_TRUE}`, [doc]);
    if (!emp) return res.status(404).json({ ok: false, error: 'Embajadora no encontrada.' });

    const val = validarFechaNacimientoISO(fechaRaw);
    if (!val.ok) return res.status(400).json({ ok: false, error: val.error });

    await run('UPDATE empleados SET fecha_nacimiento=? WHERE id=?', [val.fecha, emp.id]);
    await audit('empleados', emp.id, 'cumpleanos', `Cumpleaños registrado: ${val.fecha}`);

    const actualizado = await get('SELECT * FROM empleados WHERE id=?', [emp.id]);
    const hoy = hoyISO();
    const reg = await get('SELECT hora_entrada, hora_salida FROM registros WHERE empleado_id=? AND fecha=?', [emp.id, hoy]);
    let estado = 'sin_registro';
    if (reg?.hora_entrada && reg?.hora_salida) estado = 'completo';
    else if (reg?.hora_entrada) estado = 'con_entrada';

    res.json({
      ok: true,
      ...embajadorBuscarPayload(actualizado, estado)
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ════════════════ MARCAR ENTRADA/SALIDA ════════════════

router.post('/marcar', async (req, res) => {
  try {
    const doc = String(req.body.documento || '').trim();
    if (!doc) return res.status(400).json({ error: 'Ingresá el documento.' });

    const emp = await get(`SELECT * FROM empleados WHERE documento=? AND ${SQL_ACTIVO_TRUE}`, [doc]);
    if (!emp) return res.status(404).json({ error: `Documento ${doc} no encontrado.` });

    const hoy   = hoyISO();
    const ahora = ahoraSQL();
    let   reg   = await get('SELECT * FROM registros WHERE empleado_id=? AND fecha=?', [emp.id, hoy]);

    if (!reg) {
      // Primera marca → entrada
      const fotoEntrada = saveAsistPhoto(doc, hoy, 'entrada', req.body.foto_base64);
      const r = await run('INSERT INTO registros (empleado_id,fecha,hora_entrada,foto_entrada) VALUES (?,?,?,?)', [emp.id, hoy, ahora, fotoEntrada]);
      const llegada_estado = esTardanza(hoy, ahora) ? 'TARDANZA' : 'A_TIEMPO';
      await audit('registros', r.id, 'entrada', `Entrada: ${emp.nombre} ${emp.apellido} a las ${ahora.slice(11,16)}`);
      return res.json({
        ok: true,
        accion: 'entrada',
        nombre: `${emp.nombre} ${emp.apellido}`,
        hora: ahora.slice(11, 16),
        foto: emp.foto || '',
        llegada_estado,
        es_cumpleanos: esCumpleanosHoy(emp.fecha_nacimiento)
      });
    }

    if (!reg.hora_salida) {
      // Candado anti doble-marcación inmediata: mínimo 5 minutos entre entrada y salida
      let entradaDT = DateTime.fromSQL(reg.hora_entrada, { zone: TZ });
      if (!entradaDT.isValid) {
        entradaDT = DateTime.fromISO(String(reg.hora_entrada || '').replace(' ', 'T'), { zone: TZ });
      }
      const ahoraDT = DateTime.fromSQL(ahora, { zone: TZ });
      const minDiff = entradaDT.isValid && ahoraDT.isValid
        ? ahoraDT.diff(entradaDT, 'minutes').minutes
        : 999;
      if (minDiff < 5) {
        const faltan = Math.ceil(5 - minDiff);
        return res.status(400).json({
          error: `Esperá al menos 5 minutos entre una marca y otra. Faltan ${faltan} min.`
        });
      }

      // Segunda marca → salida
      const fotoSalida = saveAsistPhoto(doc, hoy, 'salida', req.body.foto_base64);
      await run('UPDATE registros SET hora_salida=?,foto_salida=? WHERE id=?', [ahora, fotoSalida, reg.id]);
      await audit('registros', reg.id, 'salida', `Salida: ${emp.nombre} ${emp.apellido} a las ${ahora.slice(11,16)}`);
      const errores_pendientes = await getErroresPendientesSalida(emp.id, hoy);
      return res.json({
        ok: true,
        accion: 'salida',
        nombre: `${emp.nombre} ${emp.apellido}`,
        hora: ahora.slice(11, 16),
        foto: emp.foto || '',
        errores_pendientes
      });
    }

    return res.status(400).json({ error: `${emp.nombre} ${emp.apellido} ya tiene entrada y salida registradas hoy.` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════ ERRORES PENDIENTES EN SALIDA ════════════════

router.post('/errores-vistos', async (req, res) => {
  try {
    const doc = String(req.body.documento || '').trim();
    const ids = Array.isArray(req.body.ids)
      ? req.body.ids.map(Number).filter(n => Number.isInteger(n) && n > 0)
      : [];
    if (!doc) return res.status(400).json({ ok: false, error: 'Documento requerido.' });
    if (!ids.length) return res.status(400).json({ ok: false, error: 'Lista de errores requerida.' });

    const emp = await get('SELECT id FROM empleados WHERE documento=? AND activo=1', [doc]);
    if (!emp) return res.status(404).json({ ok: false, error: 'Embajador no encontrado.' });

    const hoy = hoyISO();
    await require('./errores').ensureErroresSchema();
    const placeholders = ids.map(() => '?').join(',');
    const rows = await erroresAll(
      `SELECT id, empleado_id, COALESCE(para_todos, 0) AS para_todos, notificado_salida
       FROM errores
       WHERE id IN (${placeholders}) AND fecha = ?`,
      [...ids, hoy]
    );
    if (!rows.length) return res.json({ ok: true, marcados: 0 });

    let marcados = 0;
    const individualIds = [];

    for (const row of rows) {
      if (row.para_todos === 1) {
        const r = await erroresRun(
          'INSERT OR IGNORE INTO error_vistos (error_id, empleado_id) VALUES (?, ?)',
          [row.id, emp.id]
        );
        if (r.changes) marcados++;
      } else if (row.empleado_id === emp.id && row.notificado_salida === 0) {
        individualIds.push(row.id);
      }
    }

    if (individualIds.length) {
      const ph2 = individualIds.map(() => '?').join(',');
      await erroresRun(`UPDATE errores SET notificado_salida = 1 WHERE id IN (${ph2})`, individualIds);
      marcados += individualIds.length;
    }

    res.json({ ok: true, marcados });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ════════════════ EMPLEADOS ════════════════

router.get(['/empleados', '/embajadores'], async (req, res) => {
  try {
    const { activo = '1' } = req.query;
    const sqlFiltro = String(activo) === '1' ? SQL_ACTIVO_TRUE : `NOT (${SQL_ACTIVO_TRUE})`;
    const empleados = await all(`SELECT * FROM empleados WHERE ${sqlFiltro} ORDER BY apellido,nombre`);
    const embajadores = empleados.map(e => ({ ...e, nombre_completo: `${e.nombre} ${e.apellido}` }));
    res.json({ ok: true, empleados: embajadores, embajadores });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get(['/empleados/:id', '/embajadores/:id'], async (req, res) => {
  try {
    const e = await get('SELECT * FROM empleados WHERE id=?', [req.params.id]);
    if (!e) return res.status(404).json({ error: 'Embajador no encontrado' });
    const anti = antiguedadDesde(e.fecha_ingreso);
    const pines = await obtenerPinesEmpleado(e.id);
    const embajador = {
      ...e,
      nombre_completo: `${e.nombre} ${e.apellido}`,
      tiempo_trabajado_dias: anti.dias,
      tiempo_trabajado_texto: anti.texto,
      pines
    };
    res.json({
      ok: true,
      empleado: embajador,
      embajador
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post(['/empleados', '/embajadores'], upload.single('foto'), async (req, res) => {
  try {
    const { id, documento, tipo_doc = 'DNI', nombre, apellido, cargo, celular, email, onp = 0, fecha_ingreso = '', fecha_nacimiento = '', pines = '' } = req.body;
    if (!documento || !nombre || !apellido) return res.status(400).json({ error: 'Documento, nombre y apellido son requeridos.' });

    const foto = req.file ? req.file.filename : (req.body.foto_actual || '');
    const onpVal = String(onp) === '1' ? 1 : 0;
    const fechaIngresoVal = String(fecha_ingreso || '').trim();
    const fechaNacimientoVal = String(fecha_nacimiento || '').trim();

    if (id) {
      await run(`UPDATE empleados SET documento=?,tipo_doc=?,nombre=?,apellido=?,cargo=?,celular=?,email=?,foto=?,fecha_ingreso=?,fecha_nacimiento=?,onp=? WHERE id=?`,
        [documento.trim(), tipo_doc, nombre.trim(), apellido.trim(), cargo || '', celular || '', email || '', foto, fechaIngresoVal || null, fechaNacimientoVal || null, onpVal, id]);
      if (pines !== undefined) await syncPinesEmpleado(id, pines);
      await audit('empleados', id, 'editar', `Embajador ${nombre} ${apellido} actualizado.`);
      return res.json({ ok: true, id: +id });
    }

    const existe = await get('SELECT id, activo FROM empleados WHERE documento=?', [documento.trim()]);
    if (existe) {
      if (!esActivo(existe.activo)) {
        return res.status(400).json({ error: `El documento ${documento} pertenece a un embajador dado de baja. ¿Deseas reactivarlo?`, puede_reactivar: true, id: existe.id });
      }
      return res.status(400).json({ error: `El documento ${documento} ya está registrado.` });
    }

    const r = await run(`INSERT INTO empleados (documento,tipo_doc,nombre,apellido,cargo,celular,email,foto,fecha_ingreso,fecha_nacimiento,onp,activo) VALUES (?,?,?,?,?,?,?,?,?,?,?,1)`,
      [documento.trim(), tipo_doc, nombre.trim(), apellido.trim(), cargo || '', celular || '', email || '', foto, fechaIngresoVal || null, fechaNacimientoVal || null, onpVal]);
    if (pines !== undefined) await syncPinesEmpleado(r.id, pines);
    await audit('empleados', r.id, 'crear', `Nuevo embajador: ${nombre} ${apellido}.`);
    res.status(201).json({ ok: true, id: r.id });
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return res.status(400).json({ error: 'El documento ya está registrado.' });
    res.status(500).json({ error: e.message });
  }
});

router.post(['/empleados/:id/baja', '/embajadores/:id/baja'], authAdmin, async (req, res) => {
  try {
    const { nota_baja = '', fecha_baja = '' } = req.body;
    const fechaBaja = isoDateOrNull(fecha_baja) || hoyISO();
    await run('UPDATE empleados SET activo=0, fecha_baja=?, nota_baja=? WHERE id=?', [fechaBaja, nota_baja, req.params.id]);
    await audit('empleados', req.params.id, 'baja', `Baja desde ${fechaBaja}. Motivo: ${nota_baja}`);
    res.json({ ok: true, fecha_baja: fechaBaja });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post(['/empleados/:id/reactivar', '/embajadores/:id/reactivar'], authAdmin, async (req, res) => {
  try {
    await run('UPDATE empleados SET activo=1, fecha_baja=NULL, nota_baja="" WHERE id=?', [req.params.id]);
    await audit('empleados', req.params.id, 'reactivar', 'Embajador reactivado.');
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════ REGISTROS ════════════════

router.get('/registros', async (req, res) => {
  try {
    const { desde, hasta, empleado_id } = req.query;
    const hoy = hoyISO();
    const d   = desde || hoy;
    const h   = hasta || hoy;
    let sql   = `SELECT r.*, e.nombre, e.apellido, e.cargo, e.documento, e.foto
                 FROM registros r JOIN empleados e ON e.id=r.empleado_id
                 WHERE r.fecha>=? AND r.fecha<=?`;
    const p   = [d, h];
    if (empleado_id) { sql += ' AND r.empleado_id=?'; p.push(+empleado_id); }
    sql += ' ORDER BY r.fecha DESC, r.hora_entrada ASC, e.apellido, e.nombre';
    const rows = await all(sql, p);
    const registros = rows.map(r => ({
      ...r,
      nombre_completo: `${r.nombre} ${r.apellido}`,
      duracion: duracion(r.hora_entrada, r.hora_salida),
      entrada_fmt: r.hora_entrada ? r.hora_entrada.slice(11, 16) : null,
      salida_fmt:  r.hora_salida  ? r.hora_salida.slice(11, 16)  : null,
      estado_llegada: esTardanza(r.fecha, r.hora_entrada) ? 'TARDANZA' : 'A TIEMPO'
    }));
    res.json({ ok: true, registros });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/registros', authAdmin, async (req, res) => {
  try {
    const { id, empleado_id, fecha, hora_entrada, hora_salida, observacion } = req.body;
    if (!empleado_id || !fecha) return res.status(400).json({ error: 'Embajador y fecha requeridos.' });

    const fmtDT = (h) => h ? `${fecha} ${h}:00` : null;

    if (id) {
      await run('UPDATE registros SET empleado_id=?,fecha=?,hora_entrada=?,hora_salida=?,observacion=? WHERE id=?',
        [+empleado_id, fecha, fmtDT(hora_entrada), fmtDT(hora_salida), observacion || '', id]);
      await audit('registros', id, 'editar', `Registro ${id} editado manualmente.`);
      return res.json({ ok: true });
    }

    const existe = await get('SELECT id FROM registros WHERE empleado_id=? AND fecha=?', [+empleado_id, fecha]);
    if (existe) return res.status(400).json({ error: 'Ya existe un registro para ese embajador en esa fecha.' });

    const r = await run('INSERT INTO registros (empleado_id,fecha,hora_entrada,hora_salida,observacion) VALUES (?,?,?,?,?)',
      [+empleado_id, fecha, fmtDT(hora_entrada), fmtDT(hora_salida), observacion || '']);
    await audit('registros', r.id, 'manual', `Registro manual para embajador ${empleado_id} en ${fecha}.`);
    res.status(201).json({ ok: true, id: r.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/registros/:id', authAdmin, async (req, res) => {
  try {
    const motivo = String(req.body.motivo || '').trim();
    if (!motivo) return res.status(400).json({ error: 'Debe indicar el motivo de eliminación.' });
    await run('DELETE FROM registros WHERE id=?', [req.params.id]);
    await audit('registros', req.params.id, 'eliminar', `Registro ${req.params.id} eliminado. Motivo: ${motivo}`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════ SUELDOS ════════════════

router.get('/sueldos', async (req, res) => {
  try {
    const { anio, mes, quincena } = req.query;
    const periodo = periodoParams(anio, mes, quincena);
    const cfg     = await get('SELECT * FROM configuracion WHERE id=1') || {};
    const activos = await all(
      `SELECT * FROM empleados
       WHERE ((${SQL_ACTIVO_TRUE}) OR (fecha_baja IS NOT NULL AND fecha_baja >= ?))
         AND (fecha_ingreso IS NULL OR fecha_ingreso <= ?)
       ORDER BY apellido,nombre`,
      [periodo.desde, periodo.hasta]
    );
    const valores = getValoresSalariales(cfg);

    const resultados = [];
    for (const emp of activos) {
      const periodoEmp = periodoConCortePorBaja(periodo, emp);
      if (periodoEmp.hasta < periodoEmp.desde) continue;

      const desdeDT = DateTime.fromISO(periodoEmp.desde, { zone: TZ });
      const hastaDT = DateTime.fromISO(periodoEmp.hasta, { zone: TZ });
      const ctxDesde = desdeDT.minus({ days: weekday(desdeDT) }).toISODate();
      const ctxHasta = hastaDT.plus({ days: 6 - weekday(hastaDT) }).toISODate();
      const regs = await all(`SELECT * FROM registros WHERE empleado_id=? AND fecha>=? AND fecha<=? AND hora_entrada IS NOT NULL`,
        [emp.id, periodoEmp.desde, periodoEmp.hasta]);
      const regsContext = await all(`SELECT * FROM registros WHERE empleado_id=? AND fecha>=? AND fecha<=? AND hora_entrada IS NOT NULL`,
        [emp.id, ctxDesde, ctxHasta]);
      const ajuste = await get('SELECT * FROM sueldo_ajustes WHERE empleado_id=? AND periodo_desde=? AND periodo_hasta=?',
        [emp.id, periodo.desde, periodo.hasta]);
      const resumen = calcularResumenSueldo({ emp, regs, ajuste, periodo: periodoEmp, cfg, regsContext });

      resultados.push({
        emp: { ...emp, nombre_completo: `${emp.nombre} ${emp.apellido}` },
        dias_trabajados: resumen.diasTrabajados,
        dias_trabajados_auto: resumen.diasTrabajadosAuto,
        dias_trabajados_override: resumen.diasTrabajadosOverride,
        horas_trabajadas: resumen.horasTrabajadas,
        dias_equivalentes: resumen.diasEquivalentes,
        diasAdicionales: resumen.diasAdicionales,
        diasAdicionalesAuto: resumen.diasAdicionalesAuto,
        diasAdicionalesOverride: resumen.diasAdicionalesOverride,
        descansos: resumen.descansos,
        descansos_auto: resumen.descansosAuto,
        descansos_manual: resumen.descansosManual,
        faltas: resumen.faltas,
        faltas_auto: resumen.faltasAuto,
        faltas_manual: resumen.faltasManual,
        feriados: resumen.feriados,
        dom_monto: resumen.domMonto,
        dom_monto_auto: resumen.domMontoAuto,
        dom_monto_override: resumen.domMontoOverride,
        tardanza_count: resumen.tardanzaCount,
        tardanza_auto: resumen.tardanzaAuto,
        tardanza_manual: resumen.tardanzaManual,
        tardanza_monto: resumen.tardanzaMonto,
        faltas_monto: resumen.faltasMonto,
        monto_horas: resumen.montoHoras,
        base_sin_descuentos: resumen.baseSinDescuentos,
        faltas_descuento_unitario: resumen.faltasDescuentoUnitario,
        tardanza_descuento_unitario: resumen.tardanzaDescuentoUnitario,
        subtotal: resumen.subtotal,
        bono: resumen.bono,
        prestamo: resumen.prestamo,
        onp_monto: resumen.onpMonto,
        onp_rate: resumen.onpRate,
        onp_activo: resumen.onpActivo,
        onp_override: resumen.onpOverride,
        sueldo: resumen.sueldo,
        nota: resumen.nota,
        base_hora_parcial: resumen.baseHoraParcial,
        valor_dia: resumen.valorDia
      });
    }

    res.json({
      ok: true,
      periodo,
      resultados,
      valorDia: valores.valorDia,
      valorHora: valores.valorHora,
      valorDiaAuto: valores.valorDiaAuto,
      valorHoraAuto: valores.valorHoraAuto,
      baseHoraParcial: HORA_BASE_SUELDO_PARCIAL
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Boleta detallada por empleado ──────────────────────────────
router.get('/sueldos/boleta', async (req, res) => {
  try {
    const { emp_id, desde, hasta } = req.query;
    if (!emp_id || !desde || !hasta) return res.status(400).json({ error: 'Faltan parámetros.' });

    const emp = await get('SELECT id FROM empleados WHERE id=?', [+emp_id]);
    if (!emp) return res.status(404).json({ error: 'Embajador no encontrado.' });

    const payload = await buildBoletaPayload(+emp_id, desde, hasta);
    if (!payload) return res.status(400).json({ error: 'El embajador no tiene días laborables en el período solicitado.' });

    res.json({ ok: true, ...payload });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/sueldos/ajuste', authAdmin, async (req, res) => {
  try {
    const { empleado_id, periodo_desde, periodo_hasta, feriados = 0, faltas_override = null, tardanzas_override = null, descansos_override = null, prestamo = 0, bono = 0, nota = '', dias_adicionales_override = null, dias_trabajados_override = null, dom_monto_override = null, onp_override = null } = req.body;
    if (!empleado_id || !periodo_desde || !periodo_hasta) return res.status(400).json({ error: 'Faltan campos.' });
    await ensureSueldoAjustesColumns();

    const faltasOverride = faltas_override === null || faltas_override === '' || faltas_override === undefined
      ? null
      : Math.max(0, parseInt(faltas_override, 10) || 0);
    const tardanzasOverride = tardanzas_override === null || tardanzas_override === '' || tardanzas_override === undefined
      ? null
      : Math.max(0, parseInt(tardanzas_override, 10) || 0);
    const descansosOverride = descansos_override === null || descansos_override === '' || descansos_override === undefined
      ? null
      : Math.max(0, parseInt(descansos_override, 10) || 0);
    const diasAdicOverride = dias_adicionales_override === null || dias_adicionales_override === '' || dias_adicionales_override === undefined
      ? null
      : Math.max(0, parseInt(dias_adicionales_override, 10) || 0);
    const diasTrabOverride = dias_trabajados_override === null || dias_trabajados_override === '' || dias_trabajados_override === undefined
      ? null
      : Math.max(0, parseInt(dias_trabajados_override, 10) || 0);
    const domMontoOverride = dom_monto_override === null || dom_monto_override === '' || dom_monto_override === undefined
      ? null
      : Math.max(0, parseFloat(dom_monto_override) || 0);
    const onpOverride = onp_override === null || onp_override === '' || onp_override === undefined
      ? null
      : onp_override ? 1 : 0;

    const existe = await get('SELECT id FROM sueldo_ajustes WHERE empleado_id=? AND periodo_desde=? AND periodo_hasta=?',
      [+empleado_id, periodo_desde, periodo_hasta]);
    if (existe) {
      await run('UPDATE sueldo_ajustes SET feriados=?,faltas_override=?,tardanzas_override=?,descansos_override=?,prestamo=?,bono=?,nota=?,dias_adicionales_override=?,dias_trabajados_override=?,dom_monto_override=?,onp_override=?,updated_at=? WHERE id=?',
        [+feriados, faltasOverride, tardanzasOverride, descansosOverride, +prestamo, +bono, nota, diasAdicOverride, diasTrabOverride, domMontoOverride, onpOverride, ahoraSQL(), existe.id]);
    } else {
      await run('INSERT INTO sueldo_ajustes (empleado_id,periodo_desde,periodo_hasta,feriados,faltas_override,tardanzas_override,descansos_override,prestamo,bono,nota,dias_adicionales_override,dias_trabajados_override,dom_monto_override,onp_override,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [+empleado_id, periodo_desde, periodo_hasta, +feriados, faltasOverride, tardanzasOverride, descansosOverride, +prestamo, +bono, nota, diasAdicOverride, diasTrabOverride, domMontoOverride, onpOverride, ahoraSQL()]);
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Descansos manuales por período ─────────────────────────────

router.get('/sueldos/descansos', authAdmin, async (req, res) => {
  try {
    const { periodo_desde, periodo_hasta } = req.query;
    if (!periodo_desde || !periodo_hasta) return res.status(400).json({ error: 'Faltan fechas del período.' });
    await ensureSueldoAjustesColumns();
    const rows = await all(
      'SELECT empleado_id, descansos_fechas, feriados_fechas, no_contable_fechas, faltas_fechas FROM sueldo_ajustes WHERE periodo_desde=? AND periodo_hasta=?',
      [periodo_desde, periodo_hasta]
    );
    const map = {};
    const mapFeriados = {};
    const mapNoContable = {};
    const mapFaltas = {};
    for (const r of rows) {
      try {
        const fechas = JSON.parse(r.descansos_fechas || '[]');
        if (Array.isArray(fechas)) map[r.empleado_id] = fechas;
      } catch { map[r.empleado_id] = []; }
      try {
        const fechas = JSON.parse(r.feriados_fechas || '[]');
        if (Array.isArray(fechas)) mapFeriados[r.empleado_id] = fechas;
      } catch { mapFeriados[r.empleado_id] = []; }
      try {
        const fechas = JSON.parse(r.no_contable_fechas || '[]');
        if (Array.isArray(fechas)) mapNoContable[r.empleado_id] = fechas;
      } catch { mapNoContable[r.empleado_id] = []; }
      try {
        const fechas = JSON.parse(r.faltas_fechas || '[]');
        if (Array.isArray(fechas)) mapFaltas[r.empleado_id] = fechas;
      } catch { mapFaltas[r.empleado_id] = []; }
    }
    res.json({ ok: true, periodo_desde, periodo_hasta, descansos: map, feriados: mapFeriados, no_contable: mapNoContable, faltas: mapFaltas });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

async function guardarEstadosDiaPorPeriodo({ periodo_desde, periodo_hasta, descansos = {}, feriados = {}, no_contable = {}, faltas = {} }) {
  if (!periodo_desde || !periodo_hasta) throw new Error('Faltan fechas del período.');
  if (typeof descansos !== 'object' || descansos === null) throw new Error('Descansos inválidos.');

  await ensureSueldoAjustesColumns();

  const desde = DateTime.fromISO(periodo_desde, { zone: TZ });
  const hasta = DateTime.fromISO(periodo_hasta, { zone: TZ });
  if (!desde.isValid || !hasta.isValid) throw new Error('Fechas inválidas.');
  const hoy = nowLima().startOf('day');

  const empIds = Array.from(new Set([
    ...Object.keys(descansos || {}),
    ...Object.keys(feriados || {}),
    ...Object.keys(no_contable || {}),
    ...Object.keys(faltas || {})
  ])).map(id => +id).filter(Number.isFinite);

  const empleados = empIds.length
    ? await all(`SELECT id, fecha_ingreso, fecha_baja FROM empleados WHERE id IN (${empIds.map(() => '?').join(',')})`, empIds)
    : [];
  const empMap = new Map(empleados.map(e => [e.id, e]));

  const registros = await all(
    'SELECT empleado_id, fecha FROM registros WHERE fecha>=? AND fecha<=? AND hora_entrada IS NOT NULL',
    [periodo_desde, periodo_hasta]
  );
  const asistenciasPorEmpleado = new Map();
  for (const r of registros) {
    if (!asistenciasPorEmpleado.has(r.empleado_id)) asistenciasPorEmpleado.set(r.empleado_id, new Set());
    asistenciasPorEmpleado.get(r.empleado_id).add(r.fecha);
  }

  let actualizados = 0;

  for (const empleado_id of empIds) {
    if (!Number.isFinite(empleado_id)) continue;
    const empIdRaw = String(empleado_id);
    const fechasDescansosRaw = descansos?.[empIdRaw] || [];
    const fechasFeriadosRaw = feriados?.[empIdRaw] || [];
    const fechasNoContableRaw = no_contable?.[empIdRaw] || [];
    const fechasFaltasRaw = faltas?.[empIdRaw] || [];

    const emp = empMap.get(empleado_id);
    const periodoEmp = emp ? periodoConCortePorBaja({ desde: periodo_desde, hasta: periodo_hasta }, emp) : { desde: periodo_desde, hasta: periodo_hasta };
    const desdeEmp = DateTime.fromISO(periodoEmp.desde, { zone: TZ });
    const hastaEmp = DateTime.fromISO(periodoEmp.hasta, { zone: TZ });
    const hastaCalc = hastaEmp < hoy ? hastaEmp : hoy;

    const fechasDescansos = Array.isArray(fechasDescansosRaw) ? fechasDescansosRaw : [];
    const fechasFeriados = Array.isArray(fechasFeriadosRaw) ? fechasFeriadosRaw : [];
    const fechasNoContable = Array.isArray(fechasNoContableRaw) ? fechasNoContableRaw : [];
    const fechasFaltas = Array.isArray(fechasFaltasRaw) ? fechasFaltasRaw : [];

    const validasDescansos = fechasDescansos
      .filter(f => typeof f === 'string')
      .map(f => DateTime.fromISO(f, { zone: TZ }).toISODate())
      .filter(f => f && f >= periodo_desde && f <= periodo_hasta);

    const validasFeriados = fechasFeriados
      .filter(f => typeof f === 'string')
      .map(f => DateTime.fromISO(f, { zone: TZ }).toISODate())
      .filter(f => f && f >= periodo_desde && f <= periodo_hasta);

    const validasNoContable = fechasNoContable
      .filter(f => typeof f === 'string')
      .map(f => DateTime.fromISO(f, { zone: TZ }).toISODate())
      .filter(f => f && f >= periodo_desde && f <= periodo_hasta);

    const validasFaltas = fechasFaltas
      .filter(f => typeof f === 'string')
      .map(f => DateTime.fromISO(f, { zone: TZ }).toISODate())
      .filter(f => f && f >= periodo_desde && f <= periodo_hasta);

    const noContableSet = new Set(validasNoContable);
    const feriadosSet = new Set(validasFeriados.filter(f => !noContableSet.has(f)));
    let fechasDescanso = new Set(validasDescansos.filter(f => !noContableSet.has(f) && !feriadosSet.has(f)));
    const fechasFalta = new Set(validasFaltas.filter(f => !noContableSet.has(f) && !feriadosSet.has(f) && !fechasDescanso.has(f)));
    const asistencias = asistenciasPorEmpleado.get(empleado_id) || new Set();

    const fechasAsistencia = new Set();
    for (const f of asistencias) {
      if (!noContableSet.has(f)) fechasAsistencia.add(f);
    }
    for (const f of feriadosSet) {
      if (!noContableSet.has(f)) fechasAsistencia.add(f);
    }

    const descansoNormalizado = new Set(fechasDescanso);
    const semanaInicio = desdeEmp.minus({ days: weekday(desdeEmp) });
    for (let lun = semanaInicio; lun <= hastaCalc; lun = lun.plus({ days: 7 })) {
      const diasSem = [];
      for (let i = 0; i < 7; i++) {
        const d = lun.plus({ days: i });
        if (d < desdeEmp || d > hastaCalc) continue;
        const f = d.toISODate();
        if (noContableSet.has(f)) continue;
        diasSem.push(f);
      }
      if (diasSem.length !== 7) continue;

      const trabSem = diasSem.filter(f => fechasAsistencia.has(f)).length;
      const ausentesSem = diasSem.filter(f => !fechasAsistencia.has(f));

      for (const f of ausentesSem) descansoNormalizado.delete(f);

      if (trabSem === 6) {
        const forzadaFalta = ausentesSem.some(f => fechasFalta.has(f));
        if (!forzadaFalta) {
          const manual = ausentesSem.find(f => fechasDescanso.has(f) && !fechasFalta.has(f));
          const elegida = manual || ausentesSem.find(f => !fechasFalta.has(f));
          if (elegida) descansoNormalizado.add(elegida);
        }
      }
    }
    fechasDescanso = descansoNormalizado;

    let descansosCount = 0;
    let faltasCount = 0;
    const fechasContadas = new Set();

    for (let lun = semanaInicio; lun <= hastaCalc; lun = lun.plus({ days: 7 })) {
      const diasSem = [];
      for (let i = 0; i < 7; i++) {
        const d = lun.plus({ days: i });
        if (d < desdeEmp || d > hastaCalc) continue;
        const f = d.toISODate();
        if (noContableSet.has(f)) continue;
        diasSem.push(f);
      }
      if (diasSem.length !== 7) continue;

      diasSem.forEach(f => fechasContadas.add(f));
      const trabSem = diasSem.filter(f => fechasAsistencia.has(f)).length;

      if (trabSem === 7) continue;
      if (trabSem === 6) {
        const ausente = diasSem.find(f => !fechasAsistencia.has(f));
        if (ausente && !fechasFalta.has(ausente) && fechasDescanso.has(ausente)) descansosCount += 1;
        else faltasCount += 1;
        continue;
      }
      faltasCount += Math.max(0, 6 - trabSem);
    }

    for (let d = desdeEmp; d <= hastaCalc; d = d.plus({ days: 1 })) {
      const f = d.toISODate();
      if (fechasContadas.has(f)) continue;
      if (noContableSet.has(f)) continue;
      if (fechasAsistencia.has(f)) continue;
      if (fechasFalta.has(f)) {
        faltasCount++;
        continue;
      }
      if (fechasDescanso.has(f)) descansosCount++;
      else faltasCount++;
    }

    const fechasJson = JSON.stringify([...fechasDescanso].sort());
    const feriadosJson = JSON.stringify([...feriadosSet].sort());
    const noContableJson = JSON.stringify([...noContableSet].sort());
    const faltasJson = JSON.stringify([...fechasFalta].sort());
    const usaOverrideManual = fechasDescanso.size > 0 || fechasFalta.size > 0;
    const descansosOverride = usaOverrideManual ? descansosCount : null;
    const faltasOverride = usaOverrideManual ? faltasCount : null;
    const feriadosCount = feriadosSet.size;

    const existe = await get(
      'SELECT id FROM sueldo_ajustes WHERE empleado_id=? AND periodo_desde=? AND periodo_hasta=?',
      [empleado_id, periodo_desde, periodo_hasta]
    );
    if (existe) {
      await run(
        'UPDATE sueldo_ajustes SET descansos_fechas=?,feriados_fechas=?,no_contable_fechas=?,faltas_fechas=?,descansos_override=?,faltas_override=?,feriados=?,updated_at=? WHERE id=?',
        [fechasJson, feriadosJson, noContableJson, faltasJson, descansosOverride, faltasOverride, feriadosCount, ahoraSQL(), existe.id]
      );
    } else {
      await run(
        'INSERT INTO sueldo_ajustes (empleado_id,periodo_desde,periodo_hasta,descansos_fechas,feriados_fechas,no_contable_fechas,faltas_fechas,descansos_override,faltas_override,feriados,prestamo,bono,nota,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [empleado_id, periodo_desde, periodo_hasta, fechasJson, feriadosJson, noContableJson, faltasJson, descansosOverride, faltasOverride, feriadosCount, 0, 0, '', ahoraSQL()]
      );
    }

    actualizados += 1;
  }

  return { actualizados, empleados: empIds.length };
}

router.post('/sueldos/descansos', authAdmin, async (req, res) => {
  try {
    const { periodo_desde, periodo_hasta, descansos = {}, feriados = {}, no_contable = {}, faltas = {} } = req.body;
    const out = await guardarEstadosDiaPorPeriodo({ periodo_desde, periodo_hasta, descansos, feriados, no_contable, faltas });
    res.json({ ok: true, ...out });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/sueldos/reparar-regla-semanal', authAdmin, async (req, res) => {
  try {
    const { periodo_desde, periodo_hasta, empleado_id = null } = req.body || {};
    if (!periodo_desde || !periodo_hasta) return res.status(400).json({ error: 'Faltan fechas del período.' });
    await ensureSueldoAjustesColumns();

    const params = [periodo_desde, periodo_hasta];
    let whereEmp = '';
    if (empleado_id !== null && empleado_id !== undefined && String(empleado_id).trim() !== '') {
      whereEmp = ' AND empleado_id=?';
      params.push(+empleado_id);
    }

    const rows = await all(
      `SELECT empleado_id, descansos_fechas, feriados_fechas, no_contable_fechas, faltas_fechas
       FROM sueldo_ajustes
       WHERE periodo_desde=? AND periodo_hasta=?${whereEmp}`,
      params
    );

    const descansos = {};
    const feriados = {};
    const no_contable = {};
    const faltas = {};

    for (const r of rows) {
      const empKey = String(r.empleado_id);
      try {
        const parsed = JSON.parse(r.descansos_fechas || '[]');
        descansos[empKey] = Array.isArray(parsed) ? parsed : [];
      } catch { descansos[empKey] = []; }
      try {
        const parsed = JSON.parse(r.feriados_fechas || '[]');
        feriados[empKey] = Array.isArray(parsed) ? parsed : [];
      } catch { feriados[empKey] = []; }
      try {
        const parsed = JSON.parse(r.no_contable_fechas || '[]');
        no_contable[empKey] = Array.isArray(parsed) ? parsed : [];
      } catch { no_contable[empKey] = []; }
      try {
        const parsed = JSON.parse(r.faltas_fechas || '[]');
        faltas[empKey] = Array.isArray(parsed) ? parsed : [];
      } catch { faltas[empKey] = []; }
    }

    const out = await guardarEstadosDiaPorPeriodo({ periodo_desde, periodo_hasta, descansos, feriados, no_contable, faltas });
    res.json({ ok: true, reparados: rows.length, ...out });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ════════════════ AUDITORÍA ════════════════

router.get('/auditoria', authAdmin, async (req, res) => {
  try {
    const logs = await all('SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 200');
    res.json({ ok: true, logs });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════ CONFIGURACIÓN ════════════════

router.get('/config', authAdmin, async (req, res) => {
  try {
    await ensureConfigSchema();
    const cfg = await get('SELECT * FROM configuracion WHERE id=1');
    res.json({ ok: true, config: cfg || {}, cargos: CARGOS });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/config', authAdmin, async (req, res) => {
  try {
    await ensureConfigSchema();
    const { sueldo_minimo, valor_dia, valor_hora, hora_ingreso, tolerancia_min, descuento_tardanza,
            email_smtp, email_puerto, email_usuario, email_password, email_activo,
            backup_diario_activo } = req.body;
    const actual = await get('SELECT * FROM configuracion WHERE id=1');
              const passwordIngresada = normalizeEmailPassword(email_password);
              const passwordFinal = passwordIngresada || normalizeEmailPassword(actual?.email_password);
    const valoresActualizados = getValoresSalariales({
      sueldo_minimo: +sueldo_minimo || 1025,
      valor_dia,
      valor_hora
    });
    await run(`UPDATE configuracion SET sueldo_minimo=?,valor_dia=?,valor_hora=?,hora_ingreso=?,tolerancia_min=?,descuento_tardanza=?,
               email_smtp=?,email_puerto=?,email_usuario=?,email_password=?,email_activo=?,backup_diario_activo=? WHERE id=1`,
      [
        +sueldo_minimo || 1025,
        valoresActualizados.valorDia,
        valoresActualizados.valorHora,
        hora_ingreso || '06:30',
        +tolerancia_min || 5,
        +descuento_tardanza || 2,
        email_smtp || 'smtp.gmail.com',
        +email_puerto || 587,
        email_usuario || '',
        passwordFinal,
        email_activo ? 1 : 0,
        backup_diario_activo ? 1 : 0
      ]);
    await audit('configuracion', 1, 'actualizar', 'Configuración actualizada.');
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════ LIMPIEZA DE FOTOS ASISTENCIA ════════════════
// Día 18: elimina fotos del 1 al 15 del mes actual
// Día 3: elimina fotos del 16 al último día del mes anterior
function cleanupAsistPhotos() {
  const now = nowLima();
  const dia = now.day;
  if (dia !== 3 && dia !== 18) return;
  try {
    const files = fs.readdirSync(FOTOS_ASIST_DIR).filter(f => f.endsWith('.jpg'));
    if (!files.length) return;
    let deleted = 0;
    for (const f of files) {
      // formato: DOC_YYYY-MM-DD_tipo.jpg
      const match = f.match(/(\d{4})-(\d{2})-(\d{2})_/);
      if (!match) continue;
      const fDay = parseInt(match[3], 10);
      const fMonth = parseInt(match[2], 10);
      const fYear = parseInt(match[1], 10);
      let borrar = false;
      if (dia === 18) {
        // Borrar fotos del 1 al 15 del mes actual
        borrar = fYear === now.year && fMonth === now.month && fDay >= 1 && fDay <= 15;
      } else if (dia === 3) {
        // Borrar fotos del 16+ del mes anterior
        const mesAnt = now.month === 1 ? 12 : now.month - 1;
        const anioAnt = now.month === 1 ? now.year - 1 : now.year;
        borrar = fYear === anioAnt && fMonth === mesAnt && fDay >= 16;
      }
      if (borrar) {
        fs.unlinkSync(path.join(FOTOS_ASIST_DIR, f));
        deleted++;
      }
    }
    if (deleted > 0) console.log(`  ✓ Fotos de asistencia limpiadas (${deleted} archivos)`);
  } catch (e) {
    console.error('Error limpiando fotos asistencia:', e.message);
  }
}
cleanupAsistPhotos();
setInterval(cleanupAsistPhotos, 60 * 60 * 1000);

correoProgramado.init({
  router,
  authAdmin,
  TZ,
  get,
  run,
  all,
  audit,
  ensureConfigSchema,
  hoyISO,
  ayerISO,
  nowLima,
  periodoParams,
  buildBoletaPayload
});

module.exports = router;
