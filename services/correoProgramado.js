const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const { generateBoletaPdf } = require('../lib/boletaPdf');
const { DATA_DIR } = require('../lib/paths');

const CORREO_DESTINO = 'beluchicharroneria@gmail.com';
const DB_COMPLETO = ['asistencia.db', 'compras.db', 'contabilidad.db', 'errores.db', 'movimientos.db'];
const TMP_BASE = path.join(__dirname, '..', 'tmp', 'correo-backup');

let deps = null;

function normalizeEmailPassword(value) {
  return String(value || '').replace(/\s+/g, '').trim();
}

function formatSMTPError(error) {
  const message = String(error?.message || '');
  if (/Application-specific password required|InvalidSecondFactor|534-5\.7\.9|535-5\.7\.8/i.test(message)) {
    return 'Gmail rechazó el acceso. Usa una contraseña de aplicación de 16 caracteres, sin espacios, y verifica que la cuenta tenga activada la verificación en dos pasos.';
  }
  return message || 'Error enviando correo.';
}

function createMailTransport(cfg) {
  if (!cfg?.email_activo) throw new Error('Email desactivado en Configuración.');
  if (!cfg?.email_usuario || !cfg?.email_password) throw new Error('Faltan credenciales SMTP.');
  return nodemailer.createTransport({
    host: cfg.email_smtp,
    port: +cfg.email_puerto,
    secure: +cfg.email_puerto === 465,
    auth: { user: cfg.email_usuario, pass: normalizeEmailPassword(cfg.email_password) }
  });
}

function copyDbFiles(filenames) {
  const stamp = Date.now();
  const tmpDir = path.join(TMP_BASE, String(stamp));
  fs.mkdirSync(tmpDir, { recursive: true });
  const faltantes = [];
  const attachments = [];
  for (const filename of filenames) {
    const src = path.join(DATA_DIR, filename);
    if (!fs.existsSync(src)) {
      faltantes.push(filename);
      continue;
    }
    const dest = path.join(tmpDir, filename);
    fs.copyFileSync(src, dest);
    attachments.push({ filename, path: dest });
  }
  if (faltantes.length) {
    cleanupTmp(tmpDir);
    throw new Error(`Faltan archivos .db: ${faltantes.join(', ')}`);
  }
  return { attachments, tmpDir };
}

function cleanupTmp(tmpDir) {
  if (!tmpDir) return;
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
}

async function sendMail(cfg, { subject, text, attachments }) {
  const transporter = createMailTransport(cfg);
  await transporter.sendMail({
    from: cfg.email_usuario,
    to: CORREO_DESTINO,
    subject,
    text,
    attachments
  });
}

async function getCfg() {
  await deps.ensureConfigSchema();
  return deps.get('SELECT * FROM configuracion WHERE id=1');
}

async function enviarAsistenciaDb({ forzar = false } = {}) {
  const cfg = await getCfg();
  if (!cfg?.email_activo) return { skipped: true, reason: 'Email desactivado.' };
  const hoy = deps.hoyISO();
  if (!forzar && cfg.correo_asistencia_db_ultimo === hoy) {
    return { skipped: true, reason: 'Ya enviado hoy.' };
  }

  let tmpDir = null;
  try {
    const { attachments, tmpDir: td } = copyDbFiles(['asistencia.db']);
    tmpDir = td;
    await sendMail(cfg, {
      subject: `BELÚ SYSTEM — asistencia.db ${hoy}`,
      text: 'Respaldo diario de asistencia.db (07:20).',
      attachments
    });
    if (!forzar) {
      await deps.run('UPDATE configuracion SET correo_asistencia_db_ultimo=? WHERE id=1', [hoy]);
    }
    await deps.audit('configuracion', 1, 'correo_asistencia_db', `Enviado asistencia.db a ${CORREO_DESTINO}`);
    return { ok: true, destino: CORREO_DESTINO, archivos: ['asistencia.db'], fecha: hoy };
  } catch (e) {
    await deps.audit('configuracion', 1, 'correo_asistencia_db_error', e.message).catch(() => {});
    throw e;
  } finally {
    cleanupTmp(tmpDir);
  }
}

async function enviarRespaldoCompleto({ forzar = false } = {}) {
  const cfg = await getCfg();
  if (!cfg?.email_activo) return { skipped: true, reason: 'Email desactivado.' };
  if (!cfg?.backup_diario_activo && !forzar) return { skipped: true, reason: 'Respaldo completo desactivado.' };
  const hoy = deps.hoyISO();
  if (!forzar && cfg.correo_respaldo_5_ultimo === hoy) {
    return { skipped: true, reason: 'Respaldo completo ya enviado hoy.' };
  }

  let tmpDir = null;
  try {
    const { attachments, tmpDir: td } = copyDbFiles(DB_COMPLETO);
    tmpDir = td;
    await sendMail(cfg, {
      subject: `BELÚ SYSTEM — Respaldo completo DB ${hoy}`,
      text: 'Respaldo diario de las 5 bases de datos (15:20).',
      attachments
    });
    await deps.run(
      'UPDATE configuracion SET correo_respaldo_5_ultimo=?, correo_respaldo_5_pendiente=? WHERE id=1',
      [hoy, '']
    );
    await deps.audit('configuracion', 1, 'correo_respaldo_5',
      `Respaldo completo (${attachments.length} archivos) a ${CORREO_DESTINO}`);
    return { ok: true, destino: CORREO_DESTINO, archivos: attachments.map(a => a.filename), fecha: hoy };
  } catch (e) {
    if (!forzar) {
      await deps.run('UPDATE configuracion SET correo_respaldo_5_pendiente=? WHERE id=1', [hoy]);
    }
    await deps.audit('configuracion', 1, 'correo_respaldo_5_error', e.message).catch(() => {});
    throw e;
  } finally {
    cleanupTmp(tmpDir);
  }
}

async function recuperarRespaldoCompleto({ forzar = false } = {}) {
  const cfg = await getCfg();
  if (!cfg?.email_activo) return { skipped: true, reason: 'Email desactivado.' };
  const pendiente = (cfg.correo_respaldo_5_pendiente || '').trim();
  if (!pendiente) return { skipped: true, reason: 'Sin respaldo pendiente.' };
  if (!forzar && (cfg.correo_respaldo_5_ultimo || '') >= pendiente) {
    await deps.run('UPDATE configuracion SET correo_respaldo_5_pendiente=? WHERE id=1', ['']);
    return { skipped: true, reason: 'Respaldo pendiente ya cubierto.' };
  }

  let tmpDir = null;
  try {
    const { attachments, tmpDir: td } = copyDbFiles(DB_COMPLETO);
    tmpDir = td;
    await sendMail(cfg, {
      subject: `BELÚ SYSTEM — Recuperación respaldo DB ${pendiente}`,
      text: `Recuperación del respaldo completo pendiente del ${pendiente} (07:00).`,
      attachments
    });
    await deps.run(
      'UPDATE configuracion SET correo_respaldo_5_ultimo=?, correo_respaldo_5_pendiente=? WHERE id=1',
      [pendiente, '']
    );
    await deps.audit('configuracion', 1, 'correo_respaldo_5_recuperacion',
      `Recuperación enviada (${attachments.length} archivos) a ${CORREO_DESTINO}`);
    return { ok: true, destino: CORREO_DESTINO, archivos: attachments.map(a => a.filename), fecha: pendiente };
  } catch (e) {
    await deps.audit('configuracion', 1, 'correo_respaldo_5_recuperacion_error', e.message).catch(() => {});
    throw e;
  } finally {
    cleanupTmp(tmpDir);
  }
}

function quincenaKey(anio, mes, quincena) {
  return `${anio}-${String(mes).padStart(2, '0')}-Q${quincena}`;
}

async function enviarBoletasQuincenaPdf({ forzar = false, anio, mes, quincena } = {}) {
  const cfg = await getCfg();
  if (!cfg?.email_activo) return { skipped: true, reason: 'Email desactivado.' };

  const now = deps.nowLima();
  let q = quincena;
  let a = anio || now.year;
  let m = mes || now.month;

  if (!forzar) {
    const lastDay = now.endOf('month').day;
    if (now.day !== 15 && now.day !== lastDay) {
      return { skipped: true, reason: 'Hoy no es día 15 ni último del mes.' };
    }
    q = now.day === 15 ? 1 : 2;
    a = now.year;
    m = now.month;
  } else {
    q = +q || (now.day <= 15 ? 1 : 2);
  }

  const periodo = deps.periodoParams(a, m, q);
  const clave = quincenaKey(periodo.anio, periodo.mes, periodo.quincena);
  if (!forzar && cfg.correo_quincena_pdf_ultimo === clave) {
    return { skipped: true, reason: 'PDF quincenal ya enviado para este período.' };
  }

  const empleados = await deps.all('SELECT id FROM empleados WHERE activo=1 ORDER BY apellido, nombre');
  const pdfAttachments = [];
  const errores = [];

  for (const row of empleados) {
    try {
      const data = await deps.buildBoletaPayload(row.id, periodo.desde, periodo.hasta);
      if (!data) continue;
      const { buffer, filename } = await generateBoletaPdf(data);
      pdfAttachments.push({ filename, content: buffer });
    } catch (e) {
      errores.push(`ID ${row.id}: ${e.message}`);
    }
  }

  if (!pdfAttachments.length) {
    throw new Error('No se generó ningún PDF de boleta.' + (errores.length ? ` Errores: ${errores.join('; ')}` : ''));
  }

  try {
    await sendMail(cfg, {
      subject: `BELÚ SYSTEM — Boletas quincena ${periodo.desde} al ${periodo.hasta}`,
      text: `Resumen quincenal en PDF (${pdfAttachments.length} boletas). Período ${periodo.desde} al ${periodo.hasta}.`,
      attachments: pdfAttachments
    });
    if (!forzar) {
      await deps.run('UPDATE configuracion SET correo_quincena_pdf_ultimo=? WHERE id=1', [clave]);
    }
    await deps.audit('configuracion', 1, 'correo_quincena_pdf',
      `${pdfAttachments.length} PDFs a ${CORREO_DESTINO} (${clave})`);
    return { ok: true, destino: CORREO_DESTINO, pdfs: pdfAttachments.length, clave, errores };
  } catch (e) {
    await deps.audit('configuracion', 1, 'correo_quincena_pdf_error', e.message).catch(() => {});
    throw e;
  }
}

function wrapCron(fn) {
  return () => {
    fn().catch(e => console.error(`  ✗ Correo programado: ${e.message}`));
  };
}

function registerTestRoutes(router, authAdmin) {
  router.post('/correo/probar/asistencia-db', authAdmin, async (_req, res) => {
    try {
      const result = await enviarAsistenciaDb({ forzar: true });
      res.json({ ok: true, ...result });
    } catch (e) {
      res.status(500).json({ error: formatSMTPError(e) });
    }
  });

  router.post('/correo/probar/respaldo-5', authAdmin, async (_req, res) => {
    try {
      const result = await enviarRespaldoCompleto({ forzar: true });
      res.json({ ok: true, ...result });
    } catch (e) {
      res.status(500).json({ error: formatSMTPError(e) });
    }
  });

  router.post('/correo/probar/quincena-pdf', authAdmin, async (req, res) => {
    try {
      const { anio, mes, quincena } = req.body || {};
      const result = await enviarBoletasQuincenaPdf({ forzar: true, anio, mes, quincena });
      res.json({ ok: true, ...result });
    } catch (e) {
      res.status(500).json({ error: formatSMTPError(e) });
    }
  });
}

function init(injectedDeps) {
  deps = injectedDeps;
  fs.mkdirSync(TMP_BASE, { recursive: true });

  const { router, authAdmin, TZ } = deps;

  cron.schedule('0 7 * * *', wrapCron(recuperarRespaldoCompleto), { timezone: TZ });
  cron.schedule('20 7 * * *', wrapCron(enviarAsistenciaDb), { timezone: TZ });
  cron.schedule('20 15 * * *', wrapCron(enviarRespaldoCompleto), { timezone: TZ });
  cron.schedule('0 17 * * *', wrapCron(enviarBoletasQuincenaPdf), { timezone: TZ });

  registerTestRoutes(router, authAdmin);

  console.log(`  ✓ Correos programados: 07:00 recuperación | 07:20 asistencia.db | 15:20 respaldo 5 DB | 17:00 PDF quincena (${TZ})`);
}

module.exports = {
  init,
  enviarAsistenciaDb,
  enviarRespaldoCompleto,
  recuperarRespaldoCompleto,
  enviarBoletasQuincenaPdf,
  formatSMTPError,
  CORREO_DESTINO
};
