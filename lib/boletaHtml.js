/**
 * HTML de boleta de pago (servidor) — misma estructura que la impresión del frontend.
 */
function renderBoletaHtml(data) {
  const { emp, ajuste, registros, valorDia, valorHora, descTardanza, periodo, resumen } = data;

  const diasAdic = +resumen?.diasAdicionales || 0;
  const descansos = +resumen?.descansos || 0;
  const domMonto = +resumen?.domMonto || 0;
  const faltas = +resumen?.faltas || 0;
  const faltasMonto = +resumen?.faltasMonto || 0;
  const faltasAuto = +resumen?.faltasAuto || 0;
  const tardanzaAuto = +resumen?.tardanzaAuto || 0;
  const tardanzaManual = resumen?.tardanzaManual;
  const faltasManual = resumen?.faltasManual;
  const onpMonto = +resumen?.onpMonto || 0;
  const periodoDesde = periodo?.desde || '';
  const periodoHasta = periodo?.hasta || '';
  const feriados = +ajuste?.feriados || 0;
  const prestamo = +ajuste?.prestamo || 0;
  const bono = +ajuste?.bono || 0;
  const nota = ajuste?.nota || '';
  const diasTrab = +resumen?.diasTrabajados || 0;
  const horasTrab = +resumen?.horasTrabajadas || 0;
  const tardCount = +resumen?.tardanzaCount || 0;
  const tardMonto = +resumen?.tardanzaMonto || +(tardCount * descTardanza).toFixed(2);
  const sueldoFinalFinal = +resumen?.sueldo || 0;

  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const fDesde = new Date(periodoDesde + 'T12:00:00');
  const mesNombre = MESES[fDesde.getMonth()];
  const anio = fDesde.getFullYear();
  const qNum = fDesde.getDate() <= 15 ? '1ª' : '2ª';
  const hoy = new Date();
  const fechaImpresion = `${hoy.getDate()} de ${MESES[hoy.getMonth()]} de ${hoy.getFullYear()}`;
  const fmt = n => 'S/. ' + (+n || 0).toFixed(2);

  const mkCel = r => {
    if (!r) return '<td colspan="4"></td>';
    const fd = new Date(r.fecha + 'T12:00:00');
    const ec = !r.hora_entrada ? ['F', '#c53030'] : r.tarde ? ['T', '#b7791f'] : ['✓', '#276749'];
    return `<td class="cc">${fd.getDate()} ${DIAS[fd.getDay()]}</td>` +
      `<td class="cc cn">${r.hora_entrada || '—'}</td>` +
      `<td class="cc cn">${r.hora_salida || '—'}</td>` +
      `<td class="cc cn" style="color:${ec[1]};font-weight:700;border-right:1px solid #bbb">${ec[0]}</td>`;
  };

  const mid = Math.ceil(registros.length / 2);
  const col1 = registros.slice(0, mid);
  const col2 = registros.slice(mid);
  let calFilas = '';
  for (let i = 0; i < col1.length; i++) {
    calFilas += `<tr>${mkCel(col1[i])}${i < col2.length ? mkCel(col2[i]) : '<td colspan="4"></td>'}</tr>`;
  }

  const faltasLbl = faltasManual !== null && faltasManual !== undefined ? 'Manual' : `Auto: ${faltasAuto}`;
  const tardLbl = tardanzaManual !== null && tardanzaManual !== undefined ? 'Manual' : `Auto: ${tardanzaAuto}`;

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Boleta ${emp.nombre} ${emp.apellido}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{font-family:Arial,sans-serif;font-size:13px;color:#111;background:#fff}
  @page{size:A4;margin:10mm 17.28mm}
  .wrap{width:100%;padding:6px 8px}
  .hdr{display:flex;align-items:center;justify-content:space-between;border-bottom:2.5px solid #111;padding-bottom:5px;margin-bottom:5px}
  .hdr-left h1{font-size:1.35em;font-weight:900;text-transform:uppercase;letter-spacing:.04em}
  .hdr-left p{font-size:.88em;color:#555;margin-top:1px}
  .hdr-right{text-align:right;font-size:.88em;color:#555;line-height:1.6}
  .badge{background:#111;color:#fff;padding:3px 0;font-size:.95em;font-weight:700;letter-spacing:.07em;text-align:center;margin-bottom:6px}
  .ig{display:grid;grid-template-columns:repeat(4,1fr);gap:3px 12px;margin-bottom:7px;font-size:.92em;border:1px solid #ddd;padding:5px 8px;border-radius:3px}
  .ig .lbl{font-size:.8em;color:#777;display:block}
  .ig .val{font-weight:700}
  .sh{font-size:.82em;text-transform:uppercase;letter-spacing:.05em;color:#555;font-weight:700;border-bottom:1px solid #ccc;padding-bottom:2px;margin-bottom:4px}
  table.cal{width:100%;border-collapse:collapse;font-size:.9em;margin-bottom:7px}
  table.cal th{background:#efefef;padding:3px 5px;text-align:center;font-size:.83em;border:1px solid #ddd}
  table.cal td.cc{padding:3px 6px}
  table.cal td.cn{text-align:center}
  table.liq{width:100%;border-collapse:collapse;font-size:.97em;margin-bottom:2px}
  table.liq td{padding:3px 5px}
  table.liq td:last-child{text-align:right;white-space:nowrap}
  table.liq tr.inc td{color:#1d4ed8;font-weight:700}
  table.liq tr.dec td{color:#b91c1c;font-weight:700}
  table.liq tr.total td{border-top:2px solid #111;font-weight:800;font-size:1.08em;padding-top:4px}
  table.liq tr.total td:last-child{color:#1d4ed8}
  .nota-box{background:#fffbe6;border:1px solid #e9c83e;border-radius:3px;padding:4px 8px;font-size:.88em;color:#555;margin-bottom:7px}
  .firma-wrap{display:flex;justify-content:space-between;align-items:flex-end;margin-top:40px;padding-top:18px;border-top:1px solid #ddd;gap:60px}
  .firma-box{text-align:center}
  .firma-linea{border-top:1.5px solid #333;margin-top:36px;padding-top:5px;font-size:.88em;color:#333;font-weight:700}
  .pie{text-align:center;margin-top:8px;font-size:.78em;color:#aaa}
</style></head><body>
<div class="wrap">
  <div class="hdr">
    <div class="hdr-left">
      <h1>Belu Chicharronería</h1>
      <p>Boleta de Liquidación de Sueldo</p>
    </div>
    <div class="hdr-right">
      Emitido: ${fechaImpresion}<br>
      ${emp.tipo_doc}: <strong>${emp.documento}</strong>
    </div>
  </div>
  <div class="badge">BOLETA DE PAGO — ${qNum} QUINCENA DE ${mesNombre.toUpperCase()} ${anio}</div>
  <div class="ig">
    <div><span class="lbl">Trabajador</span><span class="val">${emp.nombre} ${emp.apellido}</span></div>
    <div><span class="lbl">Cargo</span><span class="val">${emp.cargo || '—'}</span></div>
    <div><span class="lbl">Período</span><span class="val">${periodoDesde} → ${periodoHasta}</span></div>
    <div><span class="lbl">Régimen ONP</span><span class="val">${emp.onp ? 'Sí (13%)' : 'No'}</span></div>
  </div>
  <div class="sh">Registro de Asistencia</div>
  <table class="cal">
    <thead><tr>
      <th>Día</th><th>Entrada</th><th>Salida</th><th class="div">Est.</th>
      <th>Día</th><th>Entrada</th><th>Salida</th><th>Est.</th>
    </tr></thead>
    <tbody>${calFilas}</tbody>
  </table>
  <div class="sh">Liquidación</div>
  <table class="liq">
    <tr class="inc"><td>Días trabajados (${diasTrab} x ${(+valorDia || 0).toFixed(2)})</td><td>${fmt(diasTrab * valorDia)}</td></tr>
    <tr class="inc"><td>Días adicionales (${diasAdic} x ${(+valorDia || 0).toFixed(2)})</td><td>${fmt(diasAdic * valorDia)}</td></tr>
    <tr class="inc"><td>Descansos (${descansos} x ${(+valorDia || 0).toFixed(2)})</td><td>${fmt(descansos * valorDia)}</td></tr>
    <tr class="inc"><td>Dominical proporcional</td><td>${fmt(domMonto)}</td></tr>
    <tr class="inc"><td>Horas parciales (${horasTrab} x ${(+valorHora || 0).toFixed(2)})</td><td>${fmt(horasTrab * valorHora)}</td></tr>
    <tr class="inc"><td>Feriados (${feriados} x ${(+valorDia || 0).toFixed(2)})</td><td>${fmt(feriados * valorDia)}</td></tr>
    <tr class="dec"><td>Faltas (${faltas}; ${faltasLbl})</td><td>${faltasMonto > 0 ? '-' : ''}${fmt(faltasMonto)}</td></tr>
    <tr class="dec"><td>Tardanzas (${tardCount}; ${tardLbl})</td><td>${tardMonto > 0 ? '-' : ''}${fmt(tardMonto)}</td></tr>
    <tr class="inc"><td>Bono</td><td>${fmt(bono)}</td></tr>
    <tr class="dec"><td>Préstamo</td><td>${prestamo > 0 ? '-' : ''}${fmt(prestamo)}</td></tr>
    <tr class="dec"><td>ONP</td><td>${onpMonto > 0 ? '-' : ''}${fmt(onpMonto)}</td></tr>
    <tr class="total"><td>SUELDO NETO</td><td>${fmt(sueldoFinalFinal)}</td></tr>
  </table>
  ${nota ? `<div class="nota-box"><strong>Nota:</strong> ${nota}</div>` : ''}
  <div class="firma-wrap">
    <div class="firma-box">
      <div class="firma-linea"></div>
      <div>${emp.nombre} ${emp.apellido}</div>
      <div>Firma del Trabajador</div>
    </div>
  </div>
  <div class="pie">Belu Chicharronería — Documento generado el ${fechaImpresion}</div>
</div>
</body></html>`;
}

module.exports = { renderBoletaHtml };
