const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function fmt(n) {
  return 'S/. ' + (+n || 0).toFixed(2);
}

function safeFilename(nombre, apellido) {
  return `Boleta_${String(nombre || '').trim()}_${String(apellido || '').trim()}`
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 80);
}

function generateBoletaPdf(data) {
  let PDFDocument;
  try {
    PDFDocument = require('pdfkit');
  } catch {
    return Promise.reject(new Error('pdfkit no instalado. Ejecuta: npm install'));
  }

  return new Promise((resolve, reject) => {
    try {
      const { emp, ajuste, registros, valorDia, valorHora, periodo, resumen } = data;
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => {
        resolve({
          buffer: Buffer.concat(chunks),
          filename: `${safeFilename(emp.nombre, emp.apellido)}.pdf`
        });
      });
      doc.on('error', reject);

      const periodoDesde = periodo?.desde || '';
      const periodoHasta = periodo?.hasta || '';
      const fDesde = new Date(periodoDesde + 'T12:00:00');
      const mesNombre = MESES[fDesde.getMonth()];
      const anio = fDesde.getFullYear();
      const qNum = fDesde.getDate() <= 15 ? '1ª' : '2ª';
      const hoy = new Date();
      const fechaImpresion = `${hoy.getDate()} de ${MESES[hoy.getMonth()]} de ${hoy.getFullYear()}`;

      doc.fontSize(16).font('Helvetica-Bold').text('Belu Chicharronería', { align: 'left' });
      doc.fontSize(10).font('Helvetica').text('Boleta de Liquidación de Sueldo');
      doc.fontSize(9).text(`Emitido: ${fechaImpresion}  |  ${emp.tipo_doc}: ${emp.documento}`, { align: 'right' });
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica-Bold').text(`BOLETA DE PAGO — ${qNum} QUINCENA DE ${mesNombre.toUpperCase()} ${anio}`, { align: 'center' });
      doc.moveDown(0.5);

      doc.fontSize(9).font('Helvetica');
      doc.text(`Trabajador: ${emp.nombre} ${emp.apellido}  |  Cargo: ${emp.cargo || '—'}`);
      doc.text(`Período: ${periodoDesde} → ${periodoHasta}  |  ONP: ${emp.onp ? 'Sí (13%)' : 'No'}`);
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica-Bold').text('Registro de Asistencia');
      doc.fontSize(8).font('Helvetica');
      const colW = [55, 45, 45, 25];
      let y = doc.y;
      const drawRow = (cells, bold) => {
        if (y > 700) { doc.addPage(); y = 50; }
        let x = 40;
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica');
        cells.forEach((cell, i) => {
          doc.text(String(cell ?? ''), x, y, { width: colW[i], lineBreak: false });
          x += colW[i];
        });
        y += 14;
      };
      drawRow(['Día', 'Ent.', 'Sal.', 'Est.'], true);
      drawRow(['Día', 'Ent.', 'Sal.', 'Est.'], true);
      for (const r of registros) {
        const fd = new Date(r.fecha + 'T12:00:00');
        const est = !r.hora_entrada ? 'F' : r.tarde ? 'T' : 'OK';
        drawRow([`${fd.getDate()} ${DIAS[fd.getDay()]}`, r.hora_entrada || '—', r.hora_salida || '—', est], false);
      }
      doc.y = y + 8;

      doc.fontSize(10).font('Helvetica-Bold').text('Liquidación');
      doc.fontSize(9).font('Helvetica');
      const diasTrab = +resumen?.diasTrabajados || 0;
      const diasAdic = +resumen?.diasAdicionales || 0;
      const descansos = +resumen?.descansos || 0;
      const horasTrab = +resumen?.horasTrabajadas || 0;
      const feriados = +ajuste?.feriados || 0;
      const bono = +ajuste?.bono || 0;
      const prestamo = +ajuste?.prestamo || 0;

      const lineas = [
        [`Días trabajados (${diasTrab})`, fmt(diasTrab * valorDia)],
        [`Días adicionales (${diasAdic})`, fmt(diasAdic * valorDia)],
        [`Descansos (${descansos})`, fmt(descansos * valorDia)],
        ['Dominical proporcional', fmt(resumen?.domMonto)],
        [`Horas parciales (${horasTrab})`, fmt(horasTrab * valorHora)],
        [`Feriados (${feriados})`, fmt(feriados * valorDia)],
        [`Faltas (${resumen?.faltas || 0})`, fmt(-(resumen?.faltasMonto || 0))],
        [`Tardanzas (${resumen?.tardanzaCount || 0})`, fmt(-(resumen?.tardanzaMonto || 0))],
        ['Bono', fmt(bono)],
        ['Préstamo', fmt(-prestamo)],
        ['ONP', fmt(-(resumen?.onpMonto || 0))],
      ];
      for (const [lbl, val] of lineas) {
        doc.text(lbl, 40, doc.y, { continued: true, width: 350 });
        doc.text(val, { align: 'right' });
      }
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').fontSize(11);
      doc.text('SUELDO NETO', 40, doc.y, { continued: true, width: 350 });
      doc.text(fmt(resumen?.sueldo), { align: 'right' });

      if (ajuste?.nota) {
        doc.moveDown(0.5).fontSize(9).font('Helvetica').text(`Nota: ${ajuste.nota}`);
      }
      doc.moveDown(2).fontSize(8).fillColor('#888').text(`Belu Chicharronería — ${fechaImpresion}`, { align: 'center' });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = { generateBoletaPdf, safeFilename };
