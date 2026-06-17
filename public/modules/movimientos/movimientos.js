/* ================================================================
   MÓDULO MOVIMIENTOS DKP — Frontend
   ================================================================ */

const DKPAPI = '/api/movimientos';
const dkpFmt = n => 'S/. ' + (+n || 0).toFixed(2);

function dkpAhoraLima() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const out = {};
  for (const part of parts) {
    if (part.type !== 'literal') out[part.type] = part.value;
  }
  return out;
}

function dkpFechaHoy() {
  const p = dkpAhoraLima();
  return `${p.year}-${p.month}-${p.day}`;
}

function dkpMesHoy() {
  const p = dkpAhoraLima();
  return `${p.year}-${p.month}`;
}

let dkpMesActual = dkpMesHoy();

// ── Inicialización ───────────────────────────────────────────────
(function dkpInit() {
  const hoy = dkpFechaHoy();
  ['dkpVentaFecha','dkpCompraFecha','dkpCompraFechaIng','dkpMovFecha'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = hoy;
  });
  const [dkpY, dkpM] = dkpMesActual.split('-');
  const dkpMesSel = document.getElementById('dkpMes');
  const dkpAnioEl = document.getElementById('dkpAnio');
  if (dkpMesSel) dkpMesSel.value = dkpM;
  if (dkpAnioEl) dkpAnioEl.value = dkpY;

  dkpActualizarCardsToolbar('balance');
  dkpCargarBalance();
  dkpCargarProductosSelect();
})();

// ── Tabs ─────────────────────────────────────────────────────────
function dkpTab(tab) {
  document.querySelectorAll('.dkp-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('#modTabsSlot .mod-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('dkp-' + tab)?.classList.add('active');
  document.querySelectorAll('#modTabsSlot .mod-tab').forEach(b => {
    if (b.getAttribute('onclick')?.includes(`'${tab}'`)) b.classList.add('active');
  });
  if (tab === 'ventas')   dkpCargarVentas();
  if (tab === 'compras')  dkpCargarCompras();
  if (tab === 'movs')     dkpCargarMovimientos();
  if (tab === 'catalogo') dkpCargarProductos();
  if (tab === 'balance')  dkpCargarBalance();
  dkpActualizarCardsToolbar(tab);
}

function dkpActualizarCardsToolbar(tab) {
  const cardsVentas = document.getElementById('dkpCardsVentas');
  const cardsCompras = document.getElementById('dkpCardsCompras');
  const cardsMovs = document.getElementById('dkpCardsMovs');
  const cardsBalance = document.getElementById('dkpCardsBalance');
  if (!cardsVentas || !cardsCompras || !cardsMovs || !cardsBalance) return;

  cardsVentas.style.display  = tab === 'ventas' ? 'grid' : 'none';
  cardsCompras.style.display = tab === 'compras' ? 'grid' : 'none';
  cardsMovs.style.display    = tab === 'movs' ? 'grid' : 'none';
  cardsBalance.style.display = tab === 'balance' ? 'grid' : 'none';
}

function dkpCambiarMes() {
  const mes  = document.getElementById('dkpMes')?.value;
  const anio = document.getElementById('dkpAnio')?.value;
  if (mes && anio) dkpMesActual = `${anio}-${mes}`;
  dkpCargarBalance();
  dkpCargarVentas();
  dkpCargarCompras();
  dkpCargarMovimientos();
}

// ════════════════ BALANCE ════════════════

async function dkpCargarBalance() {
  try {
    const d = await fetch(`${DKPAPI}/balance?mes=${dkpMesActual}`).then(r => r.json());
    document.getElementById('balVentas').textContent   = dkpFmt(d.totalVentas);
    document.getElementById('balCompras').textContent  = dkpFmt(d.totalCompras);
    document.getElementById('balMovs').textContent     = dkpFmt(d.valorMovs);
    const balComisionEl = document.getElementById('balComision');
    if (balComisionEl) balComisionEl.textContent = dkpFmt(d.comision);
    document.getElementById('balUtilidad').textContent = dkpFmt(d.utilidad);
    document.getElementById('balUtilidad').className   = d.utilidad >= 0 ? 'text-success' : 'text-danger';
    const balUtilCardTop = document.getElementById('balUtilCardTop');
    if (balUtilCardTop) balUtilCardTop.className = d.utilidad >= 0 ? 'card card-success' : 'card card-danger';
    document.getElementById('balMesLabel').textContent = `(${dkpMesActual})`;

    // KPIs cabecera
    document.getElementById('kpiFecha').textContent    = d.kpi.mejorDiaFecha;
    document.getElementById('kpiMonto').textContent    = dkpFmt(d.kpi.mejorDiaMonto);
    document.getElementById('kpiProd').textContent     = d.kpi.topProducto;
    document.getElementById('kpiProdCant').textContent = `${(+d.kpi.topProductoCant || 0).toFixed(2)} kg`;
    document.getElementById('kpiUtilidad').textContent = dkpFmt(d.utilidad);
    document.getElementById('kpiUtilidad').className   = 'card-value ' + (d.utilidad >= 0 ? 'text-success' : 'text-danger');
    document.getElementById('kpiUtilCard').className   = 'card ' + (d.utilidad >= 0 ? 'card-success' : 'card-danger');

    // Rellenar gastos editables
    const g = d.gasto;
    document.getElementById('gAgua').value     = g.agua     || 0;
    document.getElementById('gLuz').value      = g.luz      || 0;
    document.getElementById('gPersonal').value = g.personal || 0;
    document.getElementById('gOtros').value    = g.otros    || 0;
  } catch { /* silencioso */ }
}

async function dkpGuardarGastos() {
  const body = {
    mes:      dkpMesActual,
    agua:     +document.getElementById('gAgua').value    || 0,
    luz:      +document.getElementById('gLuz').value     || 0,
    personal: +document.getElementById('gPersonal').value || 0,
    otros:    +document.getElementById('gOtros').value   || 0
  };
  const r = await fetch(`${DKPAPI}/gastos`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) }).then(r => r.json());
  if (r.ok) {
    const msg = document.getElementById('gastoMsg');
    msg.textContent = '✓ Guardado';
    setTimeout(() => msg.textContent = '', 2500);
    dkpCargarBalance();
  }
}

function dkpActualizarGastos() {
  // Recalcula la utilidad visual en tiempo real (sin guardar)
}

// ════════════════ VENTAS ════════════════

async function dkpCargarVentas() {
  const t = document.getElementById('tablaDkpVentas');
  t.innerHTML = '<p class="text-center text-muted" style="padding:30px">Cargando...</p>';
  try {
    const d = await fetch(`${DKPAPI}/ventas?mes=${dkpMesActual}`).then(r => r.json());
    document.getElementById('dkpVentasTotalMonto').textContent = dkpFmt(d.total || 0);
    if (!d.ventas?.length) { t.innerHTML = '<p class="text-center text-muted" style="padding:30px">Sin registros</p>'; return; }
    t.innerHTML = `<table>
      <thead><tr><th>Fecha</th><th>Monto</th><th>Nota</th><th></th></tr></thead>
      <tbody>${d.ventas.map(v => `<tr>
        <td>${v.fecha}<br><span style="color:#888;font-size:.975em">${v.hora || '12:12:12'}</span></td>
        <td><strong class="text-primary">${dkpFmt(v.monto)}</strong></td>
        <td class="text-muted" style="font-size:.82em">${v.nota || '—'}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-secondary btn-sm btn-icon" onclick="dkpEditarVenta(${v.id})">✏️</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="dkpEliminarVenta(${v.id})">🗑️</button>
        </td></tr>`).join('')}</tbody>
    </table>`;
  } catch { t.innerHTML = '<p class="text-center text-muted" style="padding:30px">Error</p>'; }
}

function dkpAbrirVentaModal() {
  ['dkpVentaId','dkpVentaMonto','dkpVentaNota'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('dkpVentaFecha').value = dkpFechaHoy();
  document.getElementById('dkpVentaTitulo').textContent = 'Nueva Venta';
  document.getElementById('dkpVentaModal').style.display = 'flex';
}

function dkpCerrarVentaModal() {
  document.getElementById('dkpVentaModal').style.display = 'none';
}

async function dkpGuardarVenta() {
  const id = document.getElementById('dkpVentaId').value;
  const body = { id: id || undefined, fecha: document.getElementById('dkpVentaFecha').value,
    monto: +document.getElementById('dkpVentaMonto').value || 0,
    nota:  document.getElementById('dkpVentaNota').value };
  if (!body.fecha) return alert('Ingresá la fecha.');
  if (!body.monto) return alert('Ingresá el monto.');
  const r = await fetch(`${DKPAPI}/ventas`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) }).then(r => r.json());
  if (r.ok) { dkpCerrarVentaModal(); dkpCargarVentas(); dkpCargarBalance(); }
  else alert(r.error);
}

async function dkpEditarVenta(id) {
  const d = await fetch(`${DKPAPI}/ventas?mes=`).then(r => r.json());
  const v = d.ventas.find(x => x.id === id); if (!v) return;
  document.getElementById('dkpVentaId').value     = id;
  document.getElementById('dkpVentaFecha').value  = v.fecha;
  document.getElementById('dkpVentaMonto').value  = v.monto;
  document.getElementById('dkpVentaNota').value   = v.nota || '';
  document.getElementById('dkpVentaTitulo').textContent = 'Editar Venta';
  document.getElementById('dkpVentaModal').style.display = 'flex';
}

async function dkpEliminarVenta(id) {
  if (!confirm('¿Eliminar?')) return;
  const r = await fetch(`${DKPAPI}/ventas/${id}`, { method:'DELETE' }).then(r => r.json());
  if (r.ok) { dkpCargarVentas(); dkpCargarBalance(); }
}

function dkpCancelarVenta() {
  dkpCerrarVentaModal();
}

// ════════════════ COMPRAS ════════════════

async function dkpCargarCompras() {
  const t = document.getElementById('tablaDkpCompras');
  t.innerHTML = '<p class="text-center text-muted" style="padding:30px">Cargando...</p>';
  try {
    const d = await fetch(`${DKPAPI}/compras?mes=${dkpMesActual}`).then(r => r.json());
    document.getElementById('dkpComprasTotalGasto').textContent = dkpFmt(d.total || 0);
    if (!d.compras?.length) { t.innerHTML = '<p class="text-center text-muted" style="padding:30px">Sin registros</p>'; return; }

    const lotes = dkpDetectarLotesCompras(d.compras);
    t.innerHTML = `<table>
      <thead><tr><th>Fecha</th><th>Proveedor</th><th>Insumo</th><th>Cant</th><th>Total</th><th>Nota</th><th></th></tr></thead>
      <tbody>${d.compras.map((c, idx) => {
        const lote = lotes[idx];
        const claseLote = lote.esLote
          ? `dkp-lote-row dkp-lote-${lote.color} ${lote.esInicio ? 'dkp-lote-start' : ''} ${lote.esFin ? 'dkp-lote-end' : ''}`
          : '';
        const tagLote = (lote.esLote && lote.esInicio)
          ? `<div class="dkp-lote-tag">Lote · ${dkpFmt(lote.total)}</div>`
          : '';
        return `<tr class="${claseLote}">
        <td>${c.fecha}<br><span style="color:#888;font-size:.975em">${c.hora || '12:12:12'}</span>${tagLote}</td><td class="text-muted">${c.prov || '—'}</td>
        <td>${c.insumo}</td><td class="text-muted">${c.cant} kg</td>
        <td><strong class="text-danger">${dkpFmt(c.total)}</strong></td>
        <td class="text-muted" style="font-size:.82em">${c.nota || '—'}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-secondary btn-sm btn-icon" onclick="dkpEditarCompra(${c.id})">✏️</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="dkpEliminarCompra(${c.id})">🗑️</button>
        </td></tr>`;
      }).join('')}</tbody>
    </table>`;
  } catch { t.innerHTML = '<p class="text-center text-muted" style="padding:30px">Error</p>'; }
}

function dkpDetectarLotesCompras(rows) {
  const out = rows.map(() => ({ esLote: false, esInicio: false, esFin: false, color: 0, total: 0 }));
  if (rows.length < 2) return out;

  const grupos = [];
  let ini = 0;
  for (let i = 1; i < rows.length; i++) {
    if (!dkpEsMismoLote(rows[i - 1], rows[i])) {
      grupos.push([ini, i - 1]);
      ini = i;
    }
  }
  grupos.push([ini, rows.length - 1]);

  let colorIx = 0;
  for (const [a, b] of grupos) {
    if (b - a + 1 < 2) continue;
    const totalLote = rows.slice(a, b + 1).reduce((acc, row) => acc + (+row.total || 0), 0);
    for (let i = a; i <= b; i++) {
      out[i].esLote = true;
      out[i].esInicio = i === a;
      out[i].esFin = i === b;
      out[i].color = colorIx % 3;
      out[i].total = totalLote;
    }
    colorIx++;
  }
  return out;
}

function dkpEsMismoLote(a, b) {
  if (!a || !b) return false;

  // Prioriza agrupación exacta por lote_ref si existe.
  if ((a.lote_ref || '') && (b.lote_ref || '')) {
    return a.lote_ref === b.lote_ref;
  }

  if ((a.fecha || '') !== (b.fecha || '')) return false;
  if (String(a.prov || '').trim().toLowerCase() !== String(b.prov || '').trim().toLowerCase()) return false;

  const ta = dkpMarcaTiempoCompra(a);
  const tb = dkpMarcaTiempoCompra(b);
  if (ta == null || tb == null) return false;
  return Math.abs(ta - tb) <= 180000;
}

function dkpMarcaTiempoCompra(r) {
  const fecha = String(r.fecha || '').trim();
  const hora = String(r.hora || '').trim();
  if (!fecha || !hora) return null;
  const t = Date.parse(`${fecha}T${hora.length === 5 ? `${hora}:00` : hora}`);
  return Number.isFinite(t) ? t : null;
}

function dkpCompraFilaHtml() {
  return `
    <input type="text" class="dkp-compra-insumo" placeholder="Producto comprado" required>
    <input type="number" class="dkp-compra-cant" step="0.01" min="0" value="0">
    <input type="number" class="dkp-compra-total" step="0.01" min="0" value="0">
    <input type="text" class="dkp-compra-nota" placeholder="Opcional...">
    <button type="button" class="btn btn-danger btn-xs" onclick="dkpCompraEliminarFila(this)">✕</button>
  `;
}

function dkpActualizarTotalCompraModal() {
  const el = document.getElementById('dkpCompraTotalModal');
  if (!el) return;
  const total = Array.from(document.querySelectorAll('#dkpCompraFilas .dkp-compra-total'))
    .reduce((acc, input) => acc + (+input.value || 0), 0);
  el.textContent = `· Total: ${dkpFmt(total)}`;
}

function dkpCompraResetFormulario() {
  document.getElementById('dkpCompraId').value = '';
  document.getElementById('dkpCompraFecha').value = dkpFechaHoy();
  document.getElementById('dkpCompraFechaIng').value = dkpFechaHoy();
  document.getElementById('dkpCompraProv').value = '';
  const filas = document.getElementById('dkpCompraFilas');
  filas.innerHTML = '';
  dkpCompraAgregarFila();
  document.getElementById('dkpCompraTituloTxt').textContent = 'Nueva Compra';
  document.getElementById('dkpBtnAddCompraFila').style.display = '';
  dkpActualizarTotalCompraModal();
}

function dkpAbrirCompraModal() {
  dkpCompraResetFormulario();
  document.getElementById('dkpCompraModal').style.display = 'flex';
}

function dkpCerrarCompraModal() {
  document.getElementById('dkpCompraModal').style.display = 'none';
}

function dkpCompraAgregarFila() {
  const filas = document.getElementById('dkpCompraFilas');
  const row = document.createElement('div');
  row.className = 'dkp-compra-fila';
  row.innerHTML = dkpCompraFilaHtml();
  filas.appendChild(row);
  const totalInput = row.querySelector('.dkp-compra-total');
  if (totalInput) {
    totalInput.addEventListener('input', dkpActualizarTotalCompraModal);
    totalInput.addEventListener('change', dkpActualizarTotalCompraModal);
  }
  dkpActualizarTotalCompraModal();
}

function dkpCompraEliminarFila(btn) {
  const filas = document.getElementById('dkpCompraFilas');
  if (filas.children.length <= 1) return;
  btn.closest('.dkp-compra-fila').remove();
  dkpActualizarTotalCompraModal();
}

window.dkpAbrirCompraModal = dkpAbrirCompraModal;
window.dkpCerrarCompraModal = dkpCerrarCompraModal;
window.dkpCompraAgregarFila = dkpCompraAgregarFila;
window.dkpCompraEliminarFila = dkpCompraEliminarFila;

async function dkpGuardarCompra() {
  const id = document.getElementById('dkpCompraId').value;
  const fecha = document.getElementById('dkpCompraFecha').value;
  const fecha_ingreso = document.getElementById('dkpCompraFechaIng').value;
  const prov = document.getElementById('dkpCompraProv').value;

  const filas = Array.from(document.querySelectorAll('#dkpCompraFilas .dkp-compra-fila'));
  const items = filas.map(f => ({
    insumo: f.querySelector('.dkp-compra-insumo').value.trim(),
    cant: +f.querySelector('.dkp-compra-cant').value || 0,
    total: +f.querySelector('.dkp-compra-total').value || 0,
    nota: f.querySelector('.dkp-compra-nota').value.trim()
  })).filter(i => i.insumo);

  if (!fecha || !items.length) return alert('Completá fecha y al menos un insumo.');

  const body = { fecha, fecha_ingreso, prov };
  if (id) {
    body.id = id;
    Object.assign(body, items[0]);
  } else {
    body.items = items;
  }

  const r = await fetch(`${DKPAPI}/compras`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) }).then(r => r.json());
  if (r.ok) { dkpCancelarCompra(); dkpCargarCompras(); dkpCargarBalance(); }
  else alert(r.error);
}

async function dkpEditarCompra(id) {
  const d = await fetch(`${DKPAPI}/compras?mes=`).then(r => r.json());
  const c = d.compras.find(x => x.id === id); if (!c) return;
  document.getElementById('dkpCompraModal').style.display = 'flex';
  document.getElementById('dkpCompraTituloTxt').textContent = 'Editar Compra';
  document.getElementById('dkpCompraId').value        = id;
  document.getElementById('dkpCompraFecha').value     = c.fecha;
  document.getElementById('dkpCompraFechaIng').value  = c.fecha_ingreso || '';
  document.getElementById('dkpCompraProv').value      = c.prov || '';
  const filas = document.getElementById('dkpCompraFilas');
  filas.innerHTML = '';
  dkpCompraAgregarFila();
  const row = filas.querySelector('.dkp-compra-fila');
  row.querySelector('.dkp-compra-insumo').value = c.insumo || '';
  row.querySelector('.dkp-compra-cant').value = c.cant || 0;
  row.querySelector('.dkp-compra-total').value = c.total || 0;
  row.querySelector('.dkp-compra-nota').value = c.nota || '';
  document.getElementById('dkpBtnAddCompraFila').style.display = 'none';
  dkpActualizarTotalCompraModal();
}

async function dkpEliminarCompra(id) {
  if (!confirm('¿Eliminar?')) return;
  const r = await fetch(`${DKPAPI}/compras/${id}`, { method:'DELETE' }).then(r => r.json());
  if (r.ok) { dkpCargarCompras(); dkpCargarBalance(); }
}

function dkpCancelarCompra() {
  dkpCompraResetFormulario();
  dkpCerrarCompraModal();
}

// ════════════════ MOVIMIENTOS ════════════════

async function dkpCargarMovimientos() {
  const t = document.getElementById('tablaDkpMovs');
  t.innerHTML = '<p class="text-center text-muted" style="padding:30px">Cargando...</p>';
  try {
    const d = await fetch(`${DKPAPI}/movimientos?mes=${dkpMesActual}`).then(r => r.json());
    const totalIngreso = (d.movimientos || [])
      .filter(m => m.tipo !== 'Devolución')
      .reduce((s, m) => s + (+m.valor || 0), 0);
    const totalDevolucion = (d.movimientos || [])
      .filter(m => m.tipo === 'Devolución')
      .reduce((s, m) => s + (+m.valor || 0), 0);
    const diferenciaPagar = totalIngreso - totalDevolucion;

    document.getElementById('dkpMovIngresoTotal').textContent = dkpFmt(totalIngreso);
    document.getElementById('dkpMovDevolucionTotal').textContent = dkpFmt(totalDevolucion);
    document.getElementById('dkpMovDiferenciaPagar').textContent = dkpFmt(diferenciaPagar);
    document.getElementById('dkpMovDiferenciaPagar').className = diferenciaPagar >= 0
      ? 'card-value text-success'
      : 'card-value text-danger';

    // Resumen por producto
    const res = document.getElementById('dkpResumen');
    if (Object.keys(d.resumen || {}).length) {
      res.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px">' +
        Object.entries(d.resumen).map(([prod, r]) => `
          <div style="padding:10px 12px;border:1px solid var(--border-soft,rgba(255,255,255,.08));border-radius:8px;background:var(--bg-row,rgba(255,255,255,.03))">
            <strong style="font-size:.92em">${prod}</strong>
            <div style="display:flex;flex-direction:column;gap:4px;margin-top:6px;font-size:.82em">
              <span class="text-success">↑ ${r.ingreso.toFixed(2)} kg (${dkpFmt(r.val_ingreso)})</span>
              <span class="text-danger">↓ ${r.devolucion.toFixed(2)} kg (${dkpFmt(r.val_devolucion)})</span>
            </div>
          </div>`).join('') +
        '</div>';
    } else {
      res.innerHTML = '<p class="text-muted" style="font-size:.88em">Sin movimientos este mes</p>';
    }

    if (!d.movimientos?.length) { t.innerHTML = '<p class="text-center text-muted" style="padding:30px">Sin registros</p>'; return; }
    t.innerHTML = `<table>
      <thead><tr><th>Fecha</th><th>Tipo</th><th>Producto</th><th>Cant (kg)</th><th>Cant (unid.)</th><th>Valor</th><th>Nota</th><th></th></tr></thead>
      <tbody>${d.movimientos.map(m => `<tr>
        <td>${m.fecha}<br><span style="color:#888;font-size:.975em">${m.hora || '12:12:12'}</span></td>
        <td><span style="padding:3px 10px;border-radius:6px;font-size:.8em;background:${m.tipo==='Ingreso'?'rgba(86,208,142,.15)':'rgba(255,107,107,.15)'};color:${m.tipo==='Ingreso'?'var(--success)':'var(--danger)'}">${m.tipo}</span></td>
        <td>${m.producto_nombre}</td>
        <td class="text-muted">${m.cant} kg</td>
        <td class="text-muted">${m.cant_unid ? m.cant_unid + ' u.' : '—'}</td>
        <td><strong>${dkpFmt(m.valor)}</strong></td>
        <td class="text-muted" style="font-size:.82em">${m.nota || '—'}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-secondary btn-sm btn-icon" onclick="dkpEditarMov(${m.id})">✏️</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="dkpEliminarMov(${m.id})">🗑️</button>
        </td></tr>`).join('')}</tbody>
    </table>`;
  } catch { t.innerHTML = '<p class="text-center text-muted" style="padding:30px">Error</p>'; }
}

function dkpAbrirMovModal() {
  document.getElementById('dkpMovId').value = '';
  document.getElementById('dkpMovFecha').value = dkpFechaHoy();
  document.getElementById('dkpMovFilas').innerHTML = '';
  document.getElementById('dkpMovTitulo').textContent = 'Nuevo Movimiento';
  dkpMovAgregarFila();
  document.getElementById('dkpMovModal').style.display = 'flex';
}

function dkpMovAgregarFila(data = {}) {
  const srcSel = document.getElementById('dkpMovProducto');
  const opts = srcSel
    ? Array.from(srcSel.options).map(o =>
        `<option value="${o.value}"${o.value === (data.producto_nombre || '') ? ' selected' : ''}>${o.text}</option>`
      ).join('')
    : '<option value="">Sin productos</option>';
  const div = document.createElement('div');
  div.className = 'dkp-mov-fila';
  div.innerHTML = `
    <select class="dkp-mov-tipo">
      <option value="Ingreso"${(!data.tipo || data.tipo === 'Ingreso') ? ' selected' : ''}>Ingreso</option>
      <option value="Devolución"${data.tipo === 'Devolución' ? ' selected' : ''}>Devolución</option>
    </select>
    <input type="number" class="dkp-mov-cant" step="0.01" min="0" placeholder="0.00 kg" value="${data.cant || ''}">
    <input type="number" class="dkp-mov-cant-unid" step="0.01" min="0" placeholder="0.00 unid." value="${data.cant_unid || ''}">
    <select class="dkp-mov-prod">${opts}</select>
    <input type="text" class="dkp-mov-nota" placeholder="Opcional..." value="${data.nota || ''}">
    <button type="button" class="btn btn-danger btn-xs btn-icon" onclick="this.closest('.dkp-mov-fila').remove()">✕</button>
  `;
  document.getElementById('dkpMovFilas').appendChild(div);
}

function dkpCerrarMovModal() {
  document.getElementById('dkpMovModal').style.display = 'none';
}

async function dkpGuardarMov() {
  const fecha = document.getElementById('dkpMovFecha').value;
  const id    = document.getElementById('dkpMovId').value;
  if (!fecha) return alert('Completá la fecha.');

  const filas = document.querySelectorAll('#dkpMovFilas .dkp-mov-fila');
  if (!filas.length) return alert('Agregá al menos un producto.');

  const movs = [];
  for (const fila of filas) {
    const tipo      = fila.querySelector('.dkp-mov-tipo').value;
    const cant      = +fila.querySelector('.dkp-mov-cant').value || 0;
    const cant_unid = +fila.querySelector('.dkp-mov-cant-unid').value || 0;
    const prod      = fila.querySelector('.dkp-mov-prod').value;
    const nota      = fila.querySelector('.dkp-mov-nota').value;
    if (!prod) return alert('Seleccioná el producto en todas las filas.');
    movs.push({ tipo, cant, cant_unid, producto_nombre: prod, nota });
  }

  if (id) {
    // Editar un registro existente (solo primera fila)
    const body = { id, fecha, ...movs[0] };
    const r = await fetch(`${DKPAPI}/movimientos`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) }).then(r => r.json());
    if (r.ok) { dkpCerrarMovModal(); dkpCargarMovimientos(); dkpCargarBalance(); }
    else alert(r.error);
  } else {
    // Crear uno o varios registros
    for (const mov of movs) {
      const body = { fecha, ...mov };
      const r = await fetch(`${DKPAPI}/movimientos`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) }).then(r => r.json());
      if (!r.ok) { alert(r.error); return; }
    }
    dkpCerrarMovModal(); dkpCargarMovimientos(); dkpCargarBalance();
  }
}

async function dkpEditarMov(id) {
  const d = await fetch(`${DKPAPI}/movimientos?mes=`).then(r => r.json());
  const m = d.movimientos.find(x => x.id === id); if (!m) return;
  document.getElementById('dkpMovId').value    = id;
  document.getElementById('dkpMovFecha').value = m.fecha;
  document.getElementById('dkpMovFilas').innerHTML = '';
  document.getElementById('dkpMovTitulo').textContent = 'Editar Movimiento';
  dkpMovAgregarFila({ tipo: m.tipo, cant: m.cant, cant_unid: m.cant_unid, producto_nombre: m.producto_nombre, nota: m.nota });
  document.getElementById('dkpMovModal').style.display = 'flex';
}

async function dkpEliminarMov(id) {
  if (!confirm('¿Eliminar?')) return;
  const r = await fetch(`${DKPAPI}/movimientos/${id}`, { method:'DELETE' }).then(r => r.json());
  if (r.ok) { dkpCargarMovimientos(); dkpCargarBalance(); }
}

function dkpCancelarMov() {
  dkpCerrarMovModal();
}

// ════════════════ CATÁLOGO ════════════════

async function dkpCargarProductos() {
  const t = document.getElementById('tablaDkpProductos');
  t.innerHTML = '<p class="text-center text-muted" style="padding:30px">Cargando...</p>';
  try {
    const d = await fetch(`${DKPAPI}/productos`).then(r => r.json());
    if (!d.productos?.length) { t.innerHTML = '<p class="text-center text-muted" style="padding:30px">Sin productos</p>'; return; }
    t.innerHTML = `<table>
      <thead><tr><th>Nombre</th><th>Precio/kg</th><th></th></tr></thead>
      <tbody>${d.productos.map(p => `<tr>
        <td>${p.nombre}</td>
        <td><strong class="text-primary">${dkpFmt(p.precio)}</strong></td>
        <td style="white-space:nowrap">
          <button class="btn btn-secondary btn-sm btn-icon" onclick="dkpEditarProducto(${p.id})">✏️</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="dkpEliminarProducto(${p.id})">🗑️</button>
        </td></tr>`).join('')}</tbody>
    </table>`;
  } catch { t.innerHTML = '<p class="text-center text-muted" style="padding:30px">Error</p>'; }
}

async function dkpCargarProductosSelect() {
  try {
    const d   = await fetch(`${DKPAPI}/productos`).then(r => r.json());
    const sel = document.getElementById('dkpMovProducto');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Seleccioná --</option>' +
      (d.productos || []).map(p => `<option value="${p.nombre}">${p.nombre} (S/.${p.precio}/kg)</option>`).join('');
  } catch { /* silencioso */ }
}

function dkpAbrirProdModal() {
  ['dkpProdId','dkpProdNombre','dkpProdPrecio'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('dkpProdTitulo').textContent = 'Nuevo Producto';
  document.getElementById('dkpProdModal').style.display = 'flex';
}

function dkpCerrarProdModal() {
  document.getElementById('dkpProdModal').style.display = 'none';
}

async function dkpGuardarProducto() {
  const id = document.getElementById('dkpProdId').value;
  const body = { id: id || undefined,
    nombre: document.getElementById('dkpProdNombre').value,
    precio: +document.getElementById('dkpProdPrecio').value || 0 };
  if (!body.nombre) return alert('Ingresá el nombre.');
  const r = await fetch(`${DKPAPI}/productos`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) }).then(r => r.json());
  if (r.ok) { dkpCerrarProdModal(); dkpCargarProductos(); dkpCargarProductosSelect(); }
  else alert(r.error);
}

async function dkpEditarProducto(id) {
  const d = await fetch(`${DKPAPI}/productos`).then(r => r.json());
  const p = d.productos.find(x => x.id === id); if (!p) return;
  document.getElementById('dkpProdId').value     = id;
  document.getElementById('dkpProdNombre').value = p.nombre;
  document.getElementById('dkpProdPrecio').value = p.precio;
  document.getElementById('dkpProdTitulo').textContent = 'Editar Producto';
  document.getElementById('dkpProdModal').style.display = 'flex';
}

async function dkpEliminarProducto(id) {
  if (!confirm('¿Eliminar producto?')) return;
  const r = await fetch(`${DKPAPI}/productos/${id}`, { method:'DELETE' }).then(r => r.json());
  if (r.ok) { dkpCargarProductos(); dkpCargarProductosSelect(); }
}

function dkpCancelarProducto() {
  dkpCerrarProdModal();
}
