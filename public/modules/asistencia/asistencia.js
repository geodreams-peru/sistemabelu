/* ================================================================
   MÓDULO ASISTENCIA — Frontend
   ================================================================ */

const AAPI = '/api/asistencia';
const aFmt = n => 'S/. ' + (+n || 0).toFixed(2);

let _previewTimer = null;
let _asistMarcaModalTimer = null;
let _cumpleanosSelectsReady = false;
let _transcurridoInterval = null;
let _camaraStream = null;
const ASIST_MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// ── Init ─────────────────────────────────────────────────────────
(function asistInit() {
  const hoy   = new Date();
  const hoyISO = hoy.toISOString().split('T')[0];
  const dia   = hoy.getDate();
  const y     = hoy.getFullYear();
  const m     = String(hoy.getMonth() + 1).padStart(2, '0');
  const ultDia = new Date(y, hoy.getMonth() + 1, 0).getDate();
  const qDesde = dia <= 15 ? `${y}-${m}-01` : `${y}-${m}-16`;
  const qHasta = dia <= 15 ? `${y}-${m}-15` : `${y}-${m}-${String(ultDia).padStart(2,'0')}`;

  const regMes  = document.getElementById('regMes');  if (regMes)  regMes.value  = m;
  const regAnio = document.getElementById('regAnio'); if (regAnio) regAnio.value = y;
  const regFecha = document.getElementById('regFecha'); if (regFecha) regFecha.value = hoyISO;

  const anioSel = document.getElementById('sueldoAnio');
  if (anioSel) {
    const y = new Date().getFullYear();
    for (let i = y; i >= y - 3; i--) anioSel.innerHTML += `<option value="${i}">${i}</option>`;
    document.getElementById('sueldoMes').value = new Date().getMonth() + 1;
    document.getElementById('sueldoQuincena').value = new Date().getDate() <= 15 ? '1' : '2';
  }

  const user = window.usuarioActual;
  if (user?.permisos?.asistencia_config) {
    document.querySelectorAll('.asist-admin-tab').forEach(el => {
      if (el.id === 'regForm') {
        return;
      }
      if (el.classList.contains('mod-tab')) {
        el.style.display = 'inline-flex';
      } else if (el.classList.contains('form-card')) {
        el.style.display = 'block';
      } else {
        el.style.display = 'inline-block';
      }
    });
  }

  // Reloj en tiempo real
  asistActualizarReloj();
  setInterval(asistActualizarReloj, 1000);

  // Teclado físico (para el panel marcar)
  document.addEventListener('keydown', e => {
    const loginModal = document.getElementById('kioscoLoginModal');
    if (loginModal && !loginModal.classList.contains('hide')) return;

    const ae = document.activeElement;
    const tag = (ae?.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || ae?.isContentEditable) return;

    const marcaDocEl = document.getElementById('marcaDoc');
    if (!marcaDocEl) return;
    const secActiva = document.getElementById('asist-marcar');
    if (!secActiva?.classList.contains('active')) return;
    if (e.key >= '0' && e.key <= '9') { asistTecla(e.key); e.preventDefault(); }
    else if (e.key === 'Backspace')   { asistTeclaBorrar(); e.preventDefault(); }
    else if (e.key === 'Delete')      { asistTeclaLimpiar(); e.preventDefault(); }
    else if (e.key === 'Enter')       { asistMarcar(); e.preventDefault(); }
  });

  asistTab('marcar');
  asistCargarPanelMarcar();
  asistCargarEmpleadosSelect();
  asistInitCumpleanosSelects();
  const empFotoInput = document.getElementById('empFoto');
  if (empFotoInput && !empFotoInput.dataset.ready) {
    empFotoInput.dataset.ready = '1';
    empFotoInput.addEventListener('change', () => {
      const f = empFotoInput.files?.[0];
      if (f) asistActualizarFichaFoto('', URL.createObjectURL(f));
    });
  }
})();

// ── Reloj ────────────────────────────────────────────────────────
function asistActualizarReloj() {
  const el = document.getElementById('asistReloj');
  const ef = document.getElementById('asistFechaTexto');
  if (!el) return;
  const ahora = new Date();
  const h = String(ahora.getHours()).padStart(2,'0');
  const m = String(ahora.getMinutes()).padStart(2,'0');
  const s = String(ahora.getSeconds()).padStart(2,'0');
  el.textContent = `${h}:${m}:${s}`;
  if (ef) {
    const dias  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    ef.textContent = `${dias[ahora.getDay()]}, ${ahora.getDate()} de ${meses[ahora.getMonth()]} de ${ahora.getFullYear()}`;
  }
}

// ── Tabs ─────────────────────────────────────────────────────────
function asistTab(tab) {
  document.querySelectorAll('.asist-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('#modTabsSlot .mod-tab').forEach(b => b.classList.remove('active'));
  const sec = document.getElementById('asist-' + tab);
  if (sec) sec.classList.add('active');
  document.querySelectorAll('#modTabsSlot .mod-tab').forEach(b => {
    if (b.getAttribute('onclick')?.includes(`'${tab}'`)) b.classList.add('active');
  });
  if (tab === 'marcar')    asistIniciarCamara();
  else                     asistDetenerCamara();
  if (tab === 'hoy')       asistCargarHoy();
  if (tab === 'empleados') asistCargarEmpleados();
  if (tab === 'registros') asistCargarRegistros();
  if (tab === 'sueldos')   asistCargarSueldos();
  if (tab === 'auditoria') asistCargarAuditoria();
  if (tab === 'config')    asistCargarConfig();
}

// ════════════════ TECLADO NUMÉRICO ════════════════

window.asistTecla = function(digito) {
  const el = document.getElementById('marcaDoc');
  if (!el || el.value.length >= 12) return;
  el.value += digito;
  if (!_camaraStream) asistIniciarCamara();
  asistDispararPreview();
};

window.asistTeclaBorrar = function() {
  const el = document.getElementById('marcaDoc');
  if (!el) return;
  el.value = el.value.slice(0, -1);
  asistDispararPreview();
};

window.asistTeclaLimpiar = function() {
  const el = document.getElementById('marcaDoc');
  if (el) el.value = '';
  const pv = document.getElementById('marcaPreview');
  if (pv) pv.innerHTML = '&nbsp;';
};

// ── Preview de embajador ──────────────────────────────────────────
function asistDispararPreview() {
  clearTimeout(_previewTimer);
  const doc = document.getElementById('marcaDoc')?.value || '';
  const pv  = document.getElementById('marcaPreview');
  if (!pv) return;
  if (doc.length < 6) { pv.innerHTML = '&nbsp;'; return; }
  _previewTimer = setTimeout(() => asistBuscarPreview(doc), 350);
}

async function asistBuscarPreview(doc) {
  const pv = document.getElementById('marcaPreview');
  if (!pv) return;
  try {
    const data = await fetch(`${AAPI}/buscar?documento=${encodeURIComponent(doc)}`).then(r => r.json());
    if (data.encontrado) {
      const estados = {
        sin_registro: `🟡 Marcará <strong style="color:var(--success)">entrada</strong>`,
        con_entrada:  `🟢 Marcará <strong style="color:var(--warning)">salida</strong>`,
        completo:     `✅ Ya tiene entrada y salida hoy`
      };
      pv.innerHTML = `<span style="color:var(--success);font-weight:600">${data.nombre}</span>
        <span style="color:var(--text-muted)"> (${data.tipo_doc}) — </span>${estados[data.estado]||''}`;
    } else {
      pv.innerHTML = '<span style="color:var(--danger)">Documento no encontrado</span>';
    }
  } catch { pv.innerHTML = '&nbsp;'; }
}

// ════════════════ MARCAR ════════════════

function asistInitCumpleanosSelects() {
  if (_cumpleanosSelectsReady) return;
  const dia = document.getElementById('cumpleanosDia');
  const mes = document.getElementById('cumpleanosMes');
  const anio = document.getElementById('cumpleanosAnio');
  if (!dia || !mes || !anio) return;

  dia.innerHTML = '<option value="">—</option>' +
    Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('');
  mes.innerHTML = '<option value="">—</option>' +
    ASIST_MESES.map((nombre, i) => `<option value="${i + 1}">${nombre}</option>`).join('');
  const yActual = new Date().getFullYear();
  anio.innerHTML = '<option value="">—</option>' +
    Array.from({ length: yActual - 1950 + 1 }, (_, i) => {
      const y = yActual - i;
      return `<option value="${y}">${y}</option>`;
    }).join('');

  mes.addEventListener('change', asistActualizarDiasCumpleanosSelect);
  anio.addEventListener('change', asistActualizarDiasCumpleanosSelect);
  _cumpleanosSelectsReady = true;
}

function asistDiasEnMes(mes, anio) {
  if (!mes || !anio) return 31;
  return new Date(anio, mes, 0).getDate();
}

function asistActualizarDiasCumpleanosSelect() {
  const dia = document.getElementById('cumpleanosDia');
  const mes = document.getElementById('cumpleanosMes');
  const anio = document.getElementById('cumpleanosAnio');
  if (!dia || !mes || !anio) return;
  const m = parseInt(mes.value, 10);
  const y = parseInt(anio.value, 10);
  const max = asistDiasEnMes(m, y || 2000);
  const prev = dia.value;
  dia.innerHTML = '<option value="">—</option>' +
    Array.from({ length: max }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('');
  if (prev && parseInt(prev, 10) <= max) dia.value = prev;
}

function asistValidarFechaCumpleanos(dia, mes, anio) {
  const d = parseInt(dia, 10);
  const m = parseInt(mes, 10);
  const y = parseInt(anio, 10);
  if (!d || !m || !y || y < 1950 || y > 2026) return null;
  const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const dt = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(dt.getTime())) return null;
  if (dt.getFullYear() !== y || dt.getMonth() + 1 !== m || dt.getDate() !== d) return null;
  return iso;
}

async function asistBuscarEmbajadorMarcacion(doc) {
  return fetch(`${AAPI}/buscar?documento=${encodeURIComponent(doc)}`).then(r => r.json());
}

function asistMostrarMarcaFlashError(texto) {
  const flash = document.getElementById('marcaFlash');
  if (!flash) return;
  flash.style.display = 'block';
  flash.style.background = 'rgba(255,107,107,.12)';
  flash.style.color = 'var(--danger)';
  flash.style.border = '1px solid var(--danger)';
  flash.textContent = '⚠ ' + texto;
  setTimeout(() => { flash.style.display = 'none'; }, 4000);
}

function asistModalCumpleanosFestivo() {
  return new Promise(resolve => {
    const overlay = document.getElementById('cumpleanosFestivoOverlay');
    const btn = document.getElementById('cumpleanosFestivoBtn');
    if (!overlay || !btn) { resolve(); return; }
    overlay.classList.remove('hide');
    btn.onclick = () => {
      overlay.classList.add('hide');
      btn.onclick = null;
      resolve();
    };
  });
}

function asistModalRegistrarCumpleanos(documento, buscar) {
  return new Promise(resolve => {
    asistInitCumpleanosSelects();
    const overlay = document.getElementById('cumpleanosRegistroOverlay');
    const msg = document.getElementById('cumpleanosRegistroMsg');
    const err = document.getElementById('cumpleanosRegistroError');
    const btn = document.getElementById('cumpleanosRegistroBtn');
    if (!overlay || !btn) { resolve(null); return; }

    const nombre = buscar.nombre_solo || (buscar.nombre || '').split(' ')[0] || 'embajadora';
    msg.textContent = `Estimada ${nombre}, por favor registrá tu fecha de nacimiento`;
    err.textContent = '';
    ['cumpleanosDia', 'cumpleanosMes', 'cumpleanosAnio'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    overlay.classList.remove('hide');

    btn.onclick = async () => {
      const dia = document.getElementById('cumpleanosDia')?.value;
      const mes = document.getElementById('cumpleanosMes')?.value;
      const anio = document.getElementById('cumpleanosAnio')?.value;
      if (!dia || !mes || !anio) {
        err.textContent = 'Completá día, mes y año.';
        return;
      }
      const iso = asistValidarFechaCumpleanos(dia, mes, anio);
      if (!iso) {
        err.textContent = 'Esa fecha no es válida. Revisá los datos.';
        return;
      }
      btn.disabled = true;
      err.textContent = '';
      try {
        const res = await fetch(`${AAPI}/cumpleanos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documento, fecha_nacimiento: iso })
        });
        const data = await res.json();
        if (!data.ok) {
          err.textContent = data.error || 'No se pudo guardar.';
          return;
        }
        overlay.classList.add('hide');
        btn.onclick = null;
        resolve(data);
      } catch {
        err.textContent = 'Error de conexión con el servidor.';
      } finally {
        btn.disabled = false;
      }
    };
  });
}

function asistActualizarFichaFoto(fotoFilename, previewUrl) {
  const img = document.getElementById('empFichaFotoImg');
  const ph = document.getElementById('empFichaFotoPlaceholder');
  if (!img || !ph) return;
  const src = previewUrl || (fotoFilename ? `/uploads/fotos/${fotoFilename}` : '');
  if (src) {
    img.src = src;
    img.style.display = 'block';
    ph.style.display = 'none';
  } else {
    img.removeAttribute('src');
    img.style.display = 'none';
    ph.style.display = 'flex';
  }
}

function asistMostrarModalMarcacion(tipo, titulo, subtitulo) {
  const overlay = document.getElementById('marcaModalOverlay');
  const box = document.getElementById('marcaModalBox');
  const titleEl = document.getElementById('marcaModalTitulo');
  const subEl = document.getElementById('marcaModalSubtitulo');
  if (!overlay || !box || !titleEl || !subEl) return;

  overlay.style.display = 'flex';
  box.classList.remove('marca-modal-success', 'marca-modal-danger');
  box.classList.add(tipo === 'danger' ? 'marca-modal-danger' : 'marca-modal-success');

  titleEl.textContent = titulo || '';
  subEl.textContent = subtitulo || '';

  clearTimeout(_asistMarcaModalTimer);
  _asistMarcaModalTimer = setTimeout(() => {
    if (overlay) overlay.style.display = 'none';
  }, 4000);
}

function asistEscHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function asistMostrarModalErroresSalida(nombre, errores, documento) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('erroresSalidaOverlay');
    const titulo = document.getElementById('erroresSalidaTitulo');
    const nombreEl = document.getElementById('erroresSalidaNombre');
    const lista = document.getElementById('erroresSalidaLista');
    const btn = document.getElementById('erroresSalidaBtn');
    if (!overlay || !lista || !btn) { resolve(false); return; }

    const primerNombre = String(nombre || '').split(' ')[0] || nombre || '';
    if (titulo) titulo.textContent = `${primerNombre}, hoy aprendiste de estos detalles`;
    if (nombreEl) nombreEl.textContent = nombre ? `Embajador(a): ${nombre}` : '';

    lista.innerHTML = errores.map(err => {
      const seccion = err.seccion ? `<span class="asist-errores-item-seccion">${asistEscHtml(err.seccion)}</span>` : '';
      const hora = err.hora ? `<span class="asist-errores-item-hora">${asistEscHtml(String(err.hora).slice(0, 5))}</span>` : '';
      const solucion = err.solucion
        ? `<p class="asist-errores-item-solucion">${asistEscHtml(err.solucion)}</p>`
        : '';
      return `<li class="asist-errores-item">
        <div class="asist-errores-item-head">${hora}${seccion}</div>
        <p class="asist-errores-item-desc">${asistEscHtml(err.descripcion)}</p>
        ${solucion}
      </li>`;
    }).join('');

    overlay.style.display = 'flex';
    btn.disabled = false;
    btn.textContent = 'Aceptar';

    const cerrar = async () => {
      btn.removeEventListener('click', onAceptar);
      overlay.style.display = 'none';
      resolve(true);
    };

    const onAceptar = async () => {
      btn.disabled = true;
      btn.textContent = 'Guardando...';
      try {
        const res = await fetch(`${AAPI}/errores-vistos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documento,
            ids: errores.map(e => e.id)
          })
        });
        const data = await res.json();
        if (!data.ok) {
          console.error('[asistencia] errores-vistos:', data.error);
          btn.disabled = false;
          btn.textContent = 'Aceptar';
          alert(data.error || 'No se pudo registrar la aceptación. Intentá de nuevo.');
          return;
        }
      } catch (e) {
        console.error('[asistencia] errores-vistos:', e);
        btn.disabled = false;
        btn.textContent = 'Aceptar';
        alert('Error de conexión al registrar la aceptación.');
        return;
      }
      await cerrar();
    };

    btn.addEventListener('click', onAceptar);
  });
}

window.asistMarcar = async function() {
  const doc = document.getElementById('marcaDoc')?.value.trim();
  if (!doc) return;

  let info;
  try {
    info = await asistBuscarEmbajadorMarcacion(doc);
  } catch {
    asistMostrarMarcaFlashError('Error de conexión');
    return;
  }
  if (!info.encontrado) {
    asistMostrarMarcaFlashError(`Documento ${doc} no encontrado.`);
    return;
  }

  if (info.requiere_cumpleanos) {
    const guardado = await asistModalRegistrarCumpleanos(doc, info);
    if (!guardado?.ok) return;
    info = guardado;
  }

  await asistEjecutarMarcacion(doc, info);
};

async function asistEjecutarMarcacion(doc, infoPrevia) {
  try {
    const fotoBase64 = asistCapturarFoto();
    const res  = await fetch(`${AAPI}/marcar`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ documento: doc, foto_base64: fotoBase64 }) });
    const data = await res.json();
    const flash = document.getElementById('marcaFlash');

    if (data.ok) {
      const esEntrada = data.accion === 'entrada';
      const emoji = esEntrada ? '✅' : '🚪';
      if (esEntrada) {
        const tarde = String(data.llegada_estado || '').toUpperCase() === 'TARDANZA';
        if (tarde) {
          asistMostrarModalMarcacion('danger', 'ESTAS TARDE! que paso?!!', data.nombre || '');
        } else {
          asistMostrarModalMarcacion('success', 'ESTAS A TIEMPO!!', `bienvenido(a) ${data.nombre || ''}`);
        }
      } else {
        const pendientes = Array.isArray(data.errores_pendientes) ? data.errores_pendientes : [];
        if (pendientes.length > 0) {
          await asistMostrarModalErroresSalida(data.nombre || '', pendientes, doc);
        } else {
          asistMostrarModalMarcacion('success', 'GRACIAS POR TU TRABAJO!', data.nombre || '');
        }
      }
      if (flash) {
        flash.style.display = 'block';
        flash.style.background = esEntrada ? 'rgba(86,208,142,.15)' : 'rgba(197,168,111,.15)';
        flash.style.color      = esEntrada ? 'var(--success)' : 'var(--warning)';
        flash.style.border     = `1px solid ${esEntrada ? 'var(--success)' : 'var(--warning)'}`;
        flash.textContent = `${emoji} ${esEntrada ? 'Entrada' : 'Salida'} registrada — ${data.nombre}  •  ${data.hora}`;
        setTimeout(() => { if (flash) flash.style.display = 'none'; }, 4000);
      }
      asistTeclaLimpiar();
      asistCargarPanelMarcar();

      const esCumple = data.es_cumpleanos || (esEntrada && infoPrevia?.es_cumpleanos);
      if (esEntrada && esCumple) {
        await asistModalCumpleanosFestivo();
      }
    } else {
      if (flash) {
        flash.style.display    = 'block';
        flash.style.background = 'rgba(255,107,107,.12)';
        flash.style.color      = 'var(--danger)';
        flash.style.border     = '1px solid var(--danger)';
        flash.textContent = '⚠ ' + (data.error || 'Error al registrar.');
        setTimeout(() => { if (flash) flash.style.display = 'none'; }, 4000);
      }
    }
  } catch(e) {
    const flash = document.getElementById('marcaFlash');
    if (flash) {
      flash.style.display = 'block';
      flash.style.background = 'rgba(255,107,107,.12)';
      flash.style.color = 'var(--danger)';
      flash.style.border = '1px solid var(--danger)';
      flash.textContent = '⚠ Error de conexión';
    }
  }
};

// ── Panel derecho del marcar ──────────────────────────────────────
async function asistCargarPanelMarcar() {
  try {
    const data = await fetch(`${AAPI}/dashboard`).then(r => r.json());

    // Stats
    const presentes = (data.registros || []).length;
    const elPres = document.getElementById('marcaStatPresentes');
    const elTot  = document.getElementById('marcaStatTotal');
    if (elPres) elPres.textContent = presentes;
    if (elTot)  elTot.textContent  = data.total || 0;

    // Último registro
    const elUlt = document.getElementById('marcaUltimo');
    if (elUlt) {
      const regs = data.registros || [];
      // El primero en la lista es el más reciente (ORDER BY hora_entrada DESC)
      const ult = regs[0];
      if (ult) {
        const horaUlt = ult.hora_salida || ult.hora_entrada || '';
        elUlt.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:2px 0">
            <div style="display:flex;align-items:center;gap:10px">
              ${ult.foto
                ? `<img src="/uploads/fotos/${ult.foto}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid var(--primary)">`
                : `<div style="width:36px;height:36px;border-radius:50%;background:var(--border);display:flex;align-items:center;justify-content:center">👤</div>`}
              <span style="font-weight:700;font-size:.95rem">${ult.nombre_completo}</span>
            </div>
            <div style="text-align:right">
              <div style="font-family:monospace;font-size:1.3rem;font-weight:700;color:var(--primary)">${horaUlt}</div>
              <div id="tiempoTranscurrido" style="font-size:.72rem;color:var(--text-muted)"></div>
            </div>
          </div>`;
        // Timer transcurrido
        asistIniciarTranscurrido(data.hoy + 'T' + (ult.hora_salida_raw || ult.hora_entrada_raw || horaUlt + ':00'));
      } else {
        elUlt.innerHTML = `<div style="text-align:center;padding:8px 0;color:var(--text-muted);font-size:.78rem">Sin registros hoy</div>`;
      }
    }

    // Leaderboard
    const elLb = document.getElementById('marcaLeaderboard');
    const elQL = document.getElementById('marcaQLabel');
    if (elQL && data.periodo) elQL.textContent = `Quincena ${data.periodo.desde} — ${data.periodo.hasta}`;
    if (elLb) {
      const lb = (data.leaderboard || []).filter(x => x.dias > 0).slice(0, 8);
      const maxDias = Math.max(...lb.map(x => x.dias), 1);
      const medallas = ['🥇','🥈','🥉'];
      elLb.innerHTML = lb.length
        ? lb.map((x, i) => `
            <div class="lb-item">
              <div style="display:flex;justify-content:space-between;align-items:center;font-size:.8rem">
                <span style="font-weight:600">
                  ${i < 3 ? `<span style="margin-right:4px">${medallas[i]}</span>` : `<span style="color:var(--text-muted);margin-right:6px">${i+1}.</span>`}
                  ${x.nombre}
                </span>
                <span style="font-weight:700;font-family:monospace;color:var(--primary)">${x.dias}<span style="font-weight:400;font-size:.75em;color:var(--text-muted)">d</span></span>
              </div>
              <div class="lb-bar-bg">
                <div class="lb-bar ${i===0?'lb-bar-1':i===1?'lb-bar-2':i===2?'lb-bar-3':'lb-bar-etc'}"
                     style="width:${(x.dias/maxDias*100).toFixed(1)}%"></div>
              </div>
            </div>`).join('')
        : '<p style="font-size:.8rem;color:var(--text-muted)">Sin datos en este período</p>';
    }

    // Marcas de hoy
    const elMarcas = document.getElementById('marcasHoyLista');
    const elBadge  = document.getElementById('marcaQtyBadge');
    const regsHoy  = data.registros || [];
    if (elBadge) elBadge.textContent = regsHoy.length;
    if (elMarcas) {
      elMarcas.innerHTML = regsHoy.length
        ? regsHoy.map(r => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border);font-size:.78rem">
              <span style="font-weight:600">${r.nombre_completo}</span>
              <div style="display:flex;gap:5px;align-items:center">
                ${r.hora_entrada ? `<span style="padding:2px 7px;border-radius:12px;background:rgba(86,208,142,.15);color:var(--success);font-weight:600;font-size:.72rem">${r.hora_entrada}</span>` : ''}
                ${r.hora_salida  ? `<span style="padding:2px 7px;border-radius:12px;background:rgba(197,168,111,.15);color:var(--warning);font-weight:600;font-size:.72rem">${r.hora_salida}</span>`
                                 : `<span style="padding:2px 7px;border-radius:12px;background:rgba(143,163,255,.1);color:var(--text-muted);font-size:.72rem">Pendiente</span>`}
              </div>
            </div>`).join('')
        : '<p style="font-size:.78rem;color:var(--text-muted);text-align:center;padding:10px 0">Sin marcas hoy</p>';
    }
  } catch(e) { console.error('Panel marcar:', e); }
}

// ── Timer "hace X tiempo" ─────────────────────────────────────────
function asistIniciarTranscurrido(isoStr) {
  clearInterval(_transcurridoInterval);
  if (!isoStr) return;
  const ms = new Date(isoStr).getTime();
  if (isNaN(ms)) return;
  function tick() {
    const el = document.getElementById('tiempoTranscurrido');
    if (!el) return;
    const diff = Math.floor((Date.now() - ms) / 1000);
    if (diff < 0) { el.textContent = ''; return; }
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    el.textContent = 'hace ' + (h > 0 ? `${h}h ` : '') + `${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
  }
  tick();
  _transcurridoInterval = setInterval(tick, 1000);
}

// ════════════════ CÁMARA ASISTENCIA ════════════════

async function asistIniciarCamara() {
  // Esperar a que el DOM esté listo
  await new Promise(r => setTimeout(r, 300));
  const video = document.getElementById('camaraVideo');
  const offMsg = document.getElementById('camaraOff');
  if (!video) { console.warn('Cámara: elemento video no encontrado'); return; }
  if (_camaraStream) return;
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('getUserMedia no disponible');
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' }
    });
    _camaraStream = stream;
    video.srcObject = stream;
    await video.play();
    if (offMsg) offMsg.style.display = 'none';
  } catch (e) {
    console.error('Cámara:', e);
    if (offMsg) { offMsg.innerHTML = '<span style="font-size:1.8em">⚠️</span><span>No se pudo acceder a la cámara.<br><small style="font-size:.75rem;color:var(--text-muted)">Verificá permisos del navegador.</small></span>'; }
  }
}

function asistDetenerCamara() {
  if (_camaraStream) {
    _camaraStream.getTracks().forEach(t => t.stop());
    _camaraStream = null;
  }
  const video = document.getElementById('camaraVideo');
  if (video) video.srcObject = null;
  const offMsg = document.getElementById('camaraOff');
  if (offMsg) { offMsg.style.display = 'flex'; offMsg.innerHTML = '<span style="font-size:1.8em">📷</span>Cámara detenida'; }
}

function asistCapturarFoto() {
  const video = document.getElementById('camaraVideo');
  const canvas = document.getElementById('camaraCanvas');
  if (!video || !canvas || !_camaraStream) return '';
  canvas.width = 320;
  canvas.height = 240;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, 320, 240);
  return canvas.toDataURL('image/jpeg', 0.5);
}

// Auto-detener cámara si la sección ya no es visible
setInterval(() => {
  if (_camaraStream) {
    const video = document.getElementById('camaraVideo');
    if (!video || video.offsetParent === null) asistDetenerCamara();
  }
}, 3000);

// ════════════════ HOY ════════════════

async function asistCargarHoy() {
  try {
    const data = await fetch(`${AAPI}/dashboard`).then(r => r.json());
    const elT = document.getElementById('asistTotal');
    const elP = document.getElementById('asistPresentes');
    const elF = document.getElementById('asistFechaHoy');
    const elPer = document.getElementById('asistPeriodo');
    if (elT) elT.textContent = data.total;
    if (elP) elP.textContent = data.registros?.length || 0;
    if (elF) elF.textContent = new Date().toLocaleDateString('es-PE', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    if (elPer) elPer.textContent = `${data.periodo?.desde} al ${data.periodo?.hasta}`;

    const t = document.getElementById('tablaHoy');
    if (!t) return;
    if (!data.registros?.length) { t.innerHTML = '<p class="text-center text-muted" style="padding:30px">Sin registros hoy</p>'; }
    else t.innerHTML = `<table class="data-table">
      <thead><tr><th>Embajador</th><th>Cargo</th><th>Entrada</th><th>📷</th><th>Salida</th><th>📷</th><th>Duración</th></tr></thead>
      <tbody>${data.registros.map(r => `<tr>
        <td style="display:flex;align-items:center;gap:8px">
          ${r.foto ? `<img src="/uploads/fotos/${r.foto}" style="width:30px;height:30px;border-radius:50%;object-fit:cover">` : '<div style="width:30px;height:30px;border-radius:50%;background:var(--border);display:flex;align-items:center;justify-content:center">👤</div>'}
          <strong>${r.nombre_completo}</strong>
        </td>
        <td style="color:var(--text-muted);font-size:.85em">${r.cargo || '—'}</td>
        <td style="color:var(--success)">${r.hora_entrada || '—'}</td>
        <td>${r.foto_entrada ? `<img src="/uploads/fotos_asistencia/${r.foto_entrada}" style="width:36px;height:28px;border-radius:4px;object-fit:cover;cursor:pointer" onclick="window.open(this.src,'_blank')" title="Foto entrada">` : '<span style="color:var(--text-muted)">—</span>'}</td>
        <td style="color:var(--warning)">${r.hora_salida  || '—'}</td>
        <td>${r.foto_salida ? `<img src="/uploads/fotos_asistencia/${r.foto_salida}" style="width:36px;height:28px;border-radius:4px;object-fit:cover;cursor:pointer" onclick="window.open(this.src,'_blank')" title="Foto salida">` : '<span style="color:var(--text-muted)">—</span>'}</td>
        <td style="color:var(--text-muted)">${r.duracion}</td>
      </tr>`).join('')}</tbody></table>`;

    const lb = document.getElementById('leaderboard');
    if (!lb) return;
    const maxDias = Math.max(...(data.leaderboard?.map(x => x.dias) || [1]), 1);
    lb.innerHTML = (data.leaderboard || []).map(x => `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <span style="min-width:160px;font-size:.88em">${x.nombre}</span>
        <div style="flex:1;height:8px;background:var(--border);border-radius:5px">
          <div style="height:8px;width:${(x.dias/maxDias*100).toFixed(0)}%;background:var(--primary);border-radius:5px;transition:.4s ease"></div>
        </div>
        <span style="min-width:30px;text-align:right;font-size:.85em;color:var(--text-muted)">${x.dias}d</span>
      </div>`).join('');
  } catch { /* silencioso */ }
}

// ════════════════ EMBAJADORES ════════════════

function asistEsc(texto) {
  return String(texto || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function asistModalEmpleadoAbrir() {
  const modal = document.getElementById('empModal');
  if (modal) modal.classList.remove('hide');
}

function asistModalEmpleadoCerrar() {
  const modal = document.getElementById('empModal');
  if (modal) modal.classList.add('hide');
}

function asistRenderHistorialEmpleado(empleado) {
  const wrap = document.getElementById('empHistorialWrap');
  const tiempo = document.getElementById('empTiempoTrabajado');
  const tabla = document.getElementById('empPinsTabla');
  if (!wrap || !tiempo || !tabla) return;
  const empId = document.getElementById('empId')?.value;
  if (!empId) {
    wrap.style.display = 'none';
    tabla.innerHTML = '';
    return;
  }

  wrap.style.display = 'block';
  tiempo.textContent = empleado?.tiempo_trabajado_texto || 'Sin fecha de ingreso';
  const pines = Array.isArray(empleado?.pines) ? empleado.pines : [];
  tabla.innerHTML = pines.map(pin => `
    <tr data-pin="${asistEsc(pin.nombre)}">
      <td><strong>${asistEsc(pin.nombre)}</strong></td>
      <td style="color:var(--text-muted);font-size:.8rem">${asistEsc(pin.logro)}</td>
      <td style="color:var(--text-muted);font-size:.8rem">${asistEsc(pin.premio)}</td>
      <td style="text-align:center">
        <input type="checkbox" class="emp-pin-ganado" ${pin.ganado ? 'checked' : ''}>
      </td>
      <td><input type="date" class="emp-pin-fecha" value="${asistEsc(pin.fecha_otorgado || '')}"></td>
      <td><input type="text" class="emp-pin-nota" placeholder="Opcional" value="${asistEsc(pin.nota || '')}"></td>
    </tr>
  `).join('');
}

function asistRecolectarPinesModal() {
  return Array.from(document.querySelectorAll('#empPinsTabla tr[data-pin]')).map(row => ({
    nombre: row.getAttribute('data-pin') || '',
    ganado: !!row.querySelector('.emp-pin-ganado')?.checked,
    fecha_otorgado: row.querySelector('.emp-pin-fecha')?.value || '',
    nota: row.querySelector('.emp-pin-nota')?.value || ''
  }));
}

async function asistCargarEmpleados() {
  const inactivos = document.getElementById('mostrarInactivos')?.checked ? '0' : '1';
  const t = document.getElementById('tablaEmpleados');
  t.innerHTML = '<p class="text-center text-muted" style="padding:30px">Cargando...</p>';
  try {
    const data = await fetch(`${AAPI}/embajadores?activo=${inactivos}`).then(r => r.json());
    const embajadores = data.embajadores || data.empleados || [];
    if (!embajadores.length) { t.innerHTML = '<p class="text-center text-muted" style="padding:30px">Sin embajadores</p>'; return; }
    const esAdmin = window.usuarioActual?.permisos?.asistencia_config;
    t.innerHTML = `<table class="data-table">
      <thead><tr><th>Foto</th><th>Nombre</th><th>Doc.</th><th>Cargo</th><th>Celular</th><th>Estado</th>${esAdmin ? '<th></th>' : ''}</tr></thead>
      <tbody>${embajadores.map(e => `<tr>
        <td>${e.foto ? `<img src="/uploads/fotos/${e.foto}" style="width:38px;height:38px;border-radius:50%;object-fit:cover">` : '<div style="width:38px;height:38px;border-radius:50%;background:var(--border);display:flex;align-items:center;justify-content:center">👤</div>'}</td>
        <td><button type="button" onclick="asistEditarEmpleado(${e.id})" style="background:none;border:none;padding:0;color:var(--primary);font-weight:700;cursor:pointer;text-align:left">${e.nombre_completo}</button></td>
        <td style="color:var(--text-muted);font-size:.85em">${e.tipo_doc}: ${e.documento}</td>
        <td style="color:var(--text-muted);font-size:.85em">${e.cargo || '—'}</td>
        <td style="color:var(--text-muted);font-size:.85em">${e.celular || '—'}</td>
        <td><span style="padding:3px 10px;border-radius:6px;font-size:.78em;background:${e.activo?'rgba(86,208,142,.15)':'rgba(255,107,107,.15)'};color:${e.activo?'var(--success)':'var(--danger)'}">
          ${e.activo ? 'Activo' : 'Inactivo'}
        </span></td>
        ${esAdmin ? `<td style="white-space:nowrap">
          <button class="btn btn-secondary btn-sm" onclick="asistEditarEmpleado(${e.id})">✏️</button>
          ${e.activo
            ? `<button class="btn btn-danger btn-sm" onclick="asistBajaEmpleado(${e.id},'${e.nombre_completo}')">🚫</button>`
            : `<button class="btn btn-success btn-sm" onclick="asistReactivarEmpleado(${e.id})">✅</button>`}
        </td>` : ''}
      </tr>`).join('')}</tbody></table>`;
  } catch { t.innerHTML = '<p class="text-center text-muted" style="padding:30px">Error</p>'; }
}

async function asistCargarEmpleadosSelect() {
  try {
    const data = await fetch(`${AAPI}/embajadores?activo=1`).then(r => r.json());
    const embajadores = data.embajadores || data.empleados || [];
    ['regEmpSelect'].forEach(id => {
      const sel = document.getElementById(id); if (!sel) return;
      sel.innerHTML = '<option value="">-- Seleccioná --</option>' +
        embajadores.map(e => `<option value="${e.id}">${e.nombre_completo}</option>`).join('');
    });
    const filtro = document.getElementById('regEmpleado');
    if (filtro) {
      filtro.innerHTML = '<option value="">Todos los embajadores</option>' +
        embajadores.map(e => `<option value="${e.id}">${e.nombre_completo}</option>`).join('');
    }
  } catch { /* silencioso */ }
}

function asistNuevoEmpleado() {
  document.getElementById('empFormTitulo').textContent = 'Ficha Embajador: Nueva embajadora';
  document.getElementById('empId').value = '';
  ['empDocumento','empNombre','empApellido','empCelular','empEmail'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('empTipoDoc').value = 'DNI';
  document.getElementById('empCargo').value   = '';
  document.getElementById('empFechaIngreso').value = new Date().toISOString().split('T')[0];
  document.getElementById('empFechaNacimiento').value = '';
  document.getElementById('empOnp').checked   = false;
  document.getElementById('empFotoActual').value = '';
  document.getElementById('empFoto').value = '';
  asistActualizarFichaFoto('');
  asistRenderHistorialEmpleado(null);
  asistModalEmpleadoAbrir();
}

async function asistEditarEmpleado(id) {
  const data = await fetch(`${AAPI}/embajadores/${id}`).then(r => r.json());
  const e = data.embajador || data.empleado; if (!e) return;
  document.getElementById('empFormTitulo').textContent = `Ficha Embajador: ${e.nombre_completo}`;
  document.getElementById('empId').value        = e.id;
  document.getElementById('empTipoDoc').value   = e.tipo_doc;
  document.getElementById('empDocumento').value = e.documento;
  document.getElementById('empNombre').value    = e.nombre;
  document.getElementById('empApellido').value  = e.apellido;
  document.getElementById('empCargo').value     = e.cargo || '';
  document.getElementById('empCelular').value   = e.celular || '';
  document.getElementById('empEmail').value     = e.email || '';
  document.getElementById('empFechaIngreso').value = e.fecha_ingreso || '';
  document.getElementById('empFechaNacimiento').value = e.fecha_nacimiento || '';
  document.getElementById('empOnp').checked     = !!e.onp;
  document.getElementById('empFotoActual').value = e.foto || '';
  document.getElementById('empFoto').value = '';
  asistActualizarFichaFoto(e.foto || '');
  asistRenderHistorialEmpleado(e);
  asistModalEmpleadoAbrir();
}

async function asistGuardarEmpleado() {
  const id = document.getElementById('empId').value;
  const fechaIngreso = document.getElementById('empFechaIngreso').value;
  if (!fechaIngreso) return alert('Ingresá la fecha de ingreso.');
  const formData = new FormData();
  if (id) formData.append('id', id);
  formData.append('documento',   document.getElementById('empDocumento').value.trim());
  formData.append('tipo_doc',    document.getElementById('empTipoDoc').value);
  formData.append('nombre',      document.getElementById('empNombre').value.trim());
  formData.append('apellido',    document.getElementById('empApellido').value.trim());
  formData.append('cargo',       document.getElementById('empCargo').value);
  formData.append('celular',     document.getElementById('empCelular').value);
  formData.append('email',       document.getElementById('empEmail').value);
  formData.append('fecha_ingreso', fechaIngreso);
  formData.append('fecha_nacimiento', document.getElementById('empFechaNacimiento').value);
  formData.append('onp',         document.getElementById('empOnp').checked ? '1' : '0');
  formData.append('foto_actual', document.getElementById('empFotoActual').value);
  if (id) formData.append('pines', JSON.stringify(asistRecolectarPinesModal()));
  const fotoFile = document.getElementById('empFoto').files[0];
  if (fotoFile) formData.append('foto', fotoFile);

  const res  = await fetch(`${AAPI}/embajadores`, { method:'POST', body: formData });
  const data = await res.json();
  if (data.ok) { asistCancelarEmpleado(); asistCargarEmpleados(); asistCargarEmpleadosSelect(); }
  else if (data.puede_reactivar) {
    if (confirm(data.error)) {
      const r2 = await fetch(`${AAPI}/embajadores/${data.id}/reactivar`, { method:'POST', headers:{'Content-Type':'application/json'}, body:'{}' });
      const d2 = await r2.json();
      if (d2.ok) { asistCancelarEmpleado(); asistCargarEmpleados(); asistCargarEmpleadosSelect(); }
      else alert(d2.error || 'Error al reactivar');
    }
  }
  else alert(data.error || 'Error al guardar');
}

async function asistBajaEmpleado(id, nombre) {
  asistModalBajaAbrir(id, nombre);
}

function asistModalBajaAbrir(id, nombre) {
  const modal = document.getElementById('embBajaModal');
  if (!modal) return;
  document.getElementById('embBajaId').value = String(id || '');
  document.getElementById('embBajaNombre').textContent = nombre || '';
  document.getElementById('embBajaNota').value = '';
  document.getElementById('embBajaFecha').value = new Date().toISOString().slice(0, 10);
  modal.classList.remove('hide');
}

function asistModalBajaCerrar() {
  const modal = document.getElementById('embBajaModal');
  if (!modal) return;
  modal.classList.add('hide');
  document.getElementById('embBajaId').value = '';
}

async function asistConfirmarBajaEmpleado() {
  const id = document.getElementById('embBajaId')?.value;
  const nota = document.getElementById('embBajaNota')?.value || '';
  const fechaBaja = document.getElementById('embBajaFecha')?.value || '';
  if (!id) return;
  if (!fechaBaja) {
    alert('Ingresá la fecha de baja.');
    return;
  }

  const res = await fetch(`${AAPI}/embajadores/${id}/baja`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ nota_baja: nota, fecha_baja: fechaBaja })
  });
  const d   = await res.json();
  if (d.ok) {
    asistModalBajaCerrar();
    asistCargarEmpleados();
  } else {
    alert(d.error);
  }
}

async function asistReactivarEmpleado(id) {
  if (!confirm('¿Reactivar este embajador?')) return;
  const res = await fetch(`${AAPI}/embajadores/${id}/reactivar`, { method:'POST', headers:{'Content-Type':'application/json'}, body: '{}' });
  const d   = await res.json();
  if (d.ok) asistCargarEmpleados();
}

function asistCancelarEmpleado() {
  asistModalEmpleadoCerrar();
  document.getElementById('empId').value = '';
}

// ════════════════ REGISTROS ════════════════

async function asistCargarRegistros() {
  const ahora = new Date();
  const mesActual = String(ahora.getMonth() + 1).padStart(2, '0');
  const anioActual = String(ahora.getFullYear());
  const regMesEl = document.getElementById('regMes');
  const regAnioEl = document.getElementById('regAnio');
  const mes  = regMesEl?.value || mesActual;
  const anio = regAnioEl?.value || anioActual;
  if (regMesEl && !regMesEl.value) regMesEl.value = mes;
  if (regAnioEl && !regAnioEl.value) regAnioEl.value = anio;
  const empId = document.getElementById('regEmpleado').value;
  const desde = `${anio}-${mes}-01`;
  const hasta = `${anio}-${mes}-${String(new Date(+anio, +mes, 0).getDate()).padStart(2,'0')}`;
  const t      = document.getElementById('tablaRegistros');
  t.innerHTML  = '<p class="text-center text-muted" style="padding:30px">Cargando...</p>';
  let qs = `?desde=${desde}&hasta=${hasta}`;
  if (empId) qs += `&empleado_id=${empId}`;
  try {
    const data    = await fetch(`${AAPI}/registros${qs}`).then(r => r.json());
    if (data?.ok === false) {
      t.innerHTML = `<p class="text-center text-muted" style="padding:30px">${data.error || 'Error al cargar registros'}</p>`;
      return;
    }
    const esAdmin = window.usuarioActual?.permisos?.asistencia_config;
    if (!data.registros?.length) { t.innerHTML = '<p class="text-center text-muted" style="padding:30px">Sin registros</p>'; return; }
    t.innerHTML = `<table class="data-table">
      <thead><tr><th style="min-width:105px">Fecha</th><th>Embajador</th><th>Entrada</th><th>📷</th><th>Salida</th><th>📷</th><th>Estado</th><th>Duración</th><th>Obs.</th>${esAdmin?'<th></th>':''}</tr></thead>
      <tbody>${data.registros.map(r => `<tr>
        <td style="white-space:nowrap">${r.fecha}</td>
        <td><strong>${r.nombre_completo}</strong></td>
        <td style="color:var(--success)">${r.hora_entrada || '—'}</td>
        <td>${r.foto_entrada ? `<img src="/uploads/fotos_asistencia/${r.foto_entrada}" style="width:36px;height:28px;border-radius:4px;object-fit:cover;cursor:pointer" onclick="window.open(this.src,'_blank')" title="Foto entrada">` : '<span style="color:var(--text-muted)">—</span>'}</td>
        <td style="color:var(--warning)">${r.hora_salida  || '—'}</td>
        <td>${r.foto_salida ? `<img src="/uploads/fotos_asistencia/${r.foto_salida}" style="width:36px;height:28px;border-radius:4px;object-fit:cover;cursor:pointer" onclick="window.open(this.src,'_blank')" title="Foto salida">` : '<span style="color:var(--text-muted)">—</span>'}</td>
        <td>
          <span style="padding:2px 8px;border-radius:12px;font-weight:700;font-size:.75rem;background:${r.estado_llegada === 'TARDANZA' ? 'rgba(255,107,107,.15)' : 'rgba(86,208,142,.15)'};color:${r.estado_llegada === 'TARDANZA' ? 'var(--danger)' : 'var(--success)'}">${r.estado_llegada || 'A TIEMPO'}</span>
        </td>
        <td style="color:var(--text-muted)">${r.duracion}</td>
        <td style="color:var(--text-muted);font-size:.82em">${r.observacion||'—'}</td>
        ${esAdmin ? `<td style="white-space:nowrap">
          <button class="btn btn-secondary btn-sm" onclick="asistEditarRegistro(${r.id})">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="asistEliminarRegistro(${r.id})">🗑️</button>
        </td>` : ''}
      </tr>`).join('')}</tbody></table>`;
  } catch { t.innerHTML = '<p class="text-center text-muted" style="padding:30px">Error</p>'; }
}

function asistNuevoRegistro() {
  const m = document.getElementById('regModal');
  if (m) m.classList.remove('hide');
  document.getElementById('regFormTitulo').textContent = 'Registro Manual';
  ['regId','regEntrada','regSalida','regObs'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('regFecha').value = new Date().toISOString().split('T')[0];
}

async function asistEditarRegistro(id) {
  try {
    await asistCargarEmpleadosSelect();
    const d   = await fetch(`${AAPI}/registros?desde=2020-01-01&hasta=2030-12-31`).then(r => r.json());
    const reg = d.registros?.find(r => r.id === id);
    if (!reg) {
      alert('No se encontró el registro a editar.');
      return;
    }
    const m = document.getElementById('regModal');
    if (m) m.classList.remove('hide');
    document.getElementById('regFormTitulo').textContent = 'Editar Registro';
    document.getElementById('regId').value        = id;
    document.getElementById('regEmpSelect').value = String(reg.empleado_id || '');
    document.getElementById('regFecha').value     = reg.fecha || '';
    document.getElementById('regEntrada').value   = reg.entrada_fmt || (reg.hora_entrada ? String(reg.hora_entrada).slice(11, 16) : '');
    document.getElementById('regSalida').value    = reg.salida_fmt  || (reg.hora_salida  ? String(reg.hora_salida).slice(11, 16)  : '');
    document.getElementById('regObs').value       = reg.observacion  || '';
  } catch (e) {
    alert('No se pudo abrir el registro para editar.');
  }
}

async function asistGuardarRegistro() {
  const body = {
    id:           document.getElementById('regId').value || undefined,
    empleado_id:  document.getElementById('regEmpSelect').value,
    fecha:        document.getElementById('regFecha').value,
    hora_entrada: document.getElementById('regEntrada').value,
    hora_salida:  document.getElementById('regSalida').value,
    observacion:  document.getElementById('regObs').value
  };
  if (!body.empleado_id || !body.fecha) return alert('Seleccioná embajador y fecha.');
  const res  = await fetch(`${AAPI}/registros`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
  const data = await res.json();
  if (data.ok) { asistCancelarRegistro(); asistCargarRegistros(); }
  else alert(data.error);
}

async function asistEliminarRegistro(id) {
  const m = document.getElementById('regDeleteModal');
  if (m) m.classList.remove('hide');
  document.getElementById('regDeleteId').value = id;
  document.getElementById('regDeleteMotivo').value = '';
  document.getElementById('btnConfirmarDelete').disabled = false;
  setTimeout(() => document.getElementById('regDeleteMotivo')?.focus(), 200);
}

function asistCancelarDelete() {
  const m = document.getElementById('regDeleteModal');
  if (m) m.classList.add('hide');
}

async function asistConfirmarDelete() {
  const id = document.getElementById('regDeleteId').value;
  const motivo = document.getElementById('regDeleteMotivo').value.trim();
  if (!motivo) { alert('Debés escribir el motivo para poder eliminar.'); return; }
  document.getElementById('btnConfirmarDelete').disabled = true;
  const res  = await fetch(`${AAPI}/registros/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivo })
  });
  const data = await res.json();
  if (data.ok) { asistCancelarDelete(); asistCargarRegistros(); }
  else { alert(data.error); document.getElementById('btnConfirmarDelete').disabled = false; }
}

function asistCancelarRegistro() {
  const m = document.getElementById('regModal');
  if (m) m.classList.add('hide');
}

// ════════════════ SUELDOS ════════════════

async function asistCargarSueldos() {
  const anio     = document.getElementById('sueldoAnio').value;
  const mes      = document.getElementById('sueldoMes').value;
  const quincena = document.getElementById('sueldoQuincena').value;
  const t        = document.getElementById('tablaSueldos');
  t.innerHTML    = '<p class="text-center text-muted" style="padding:30px">Calculando...</p>';
  try {
    const data = await fetch(`${AAPI}/sueldos?anio=${anio}&mes=${mes}&quincena=${quincena}&_=${Date.now()}`, { cache: 'no-store' }).then(r => r.json());
    const esAdmin = !!window.usuarioActual?.permisos?.asistencia_config;
    // #region agent log
    if (data.resultados?.length) {
      const m = data.resultados[0];
      fetch('http://127.0.0.1:7505/ingest/213bef8c-9b8e-4768-8ce2-5544a6b05bf1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'61705f'},body:JSON.stringify({sessionId:'61705f',hypothesisId:'H5',location:'asistencia.js:asistCargarSueldos',message:'Datos recibidos del servidor',data:{empId:m.emp?.id,descansos:m.descansos,descansos_auto:m.descansos_auto,descansos_manual:m.descansos_manual??null,total:data.resultados.length},timestamp:Date.now()})}).catch(()=>{});
    }
    // #endregion
    if (!data.resultados?.length) { t.innerHTML = '<p class="text-center text-muted" style="padding:30px">Sin embajadores activos</p>'; return; }
    const p = data.periodo;
    const asistEncodeAjusteOriginal = (r) => encodeURIComponent(JSON.stringify({
      feriados: parseInt(r.feriados || 0, 10) || 0,
      faltas_override: r.faltas_manual ?? null,
      tardanzas_override: r.tardanza_manual ?? null,
      descansos_override: r.descansos_manual ?? null,
      prestamo: parseFloat(r.prestamo || 0) || 0,
      bono: parseFloat(r.bono || 0) || 0,
      nota: r.nota || ''
    }));

    t.innerHTML = `
      <div style="padding:14px 20px;border-bottom:1px solid var(--border);font-size:.85em;color:var(--text-muted)">
        Período: <strong>${p.desde}</strong> al <strong>${p.hasta}</strong> &nbsp;•&nbsp; Valor día: <strong>${aFmt(data.valorDia)}</strong>
        &nbsp;•&nbsp; Valor hora: <strong>${aFmt(data.valorHora)}</strong>
        &nbsp;•&nbsp; Horas parciales desde <strong>${data.baseHoraParcial || '07:00'}</strong>
      </div>
      <table class="data-table asistencia-sueldos-table" style="font-size:.94em">
        <thead><tr>
          <th class="asistencia-sueldos-empleado" style="white-space:nowrap;padding:8px 5px">Embajador</th>
          <th title="Dias trabajados" style="white-space:nowrap;padding:8px 4px">Días</th>
          <th title="Horas trabajadas en jornadas menores a 8 horas" style="white-space:nowrap;padding:8px 4px">Horas</th>
          <th title="Dias adicionales por semana completa" style="white-space:nowrap;padding:8px 4px">Adic.</th>
          <th title="Dias feriados trabajados" style="white-space:nowrap;padding:8px 4px">Feriados</th>
          <th title="Dominical proporcional" style="white-space:nowrap;padding:8px 4px">DOM</th>
          <th title="Dias descansado" style="white-space:nowrap;padding:8px 4px">Desc.</th>
          <th title="Faltas/Descuento" style="white-space:nowrap;padding:8px 4px;min-width:66px">Faltas</th>
          <th title="Tardanzas de la quincena" style="white-space:nowrap;padding:8px 4px;min-width:66px">Tardanzas</th>
          <th title="Descuento por ONP" style="white-space:nowrap;padding:8px 4px">ONP</th>
          <th title="Premio adicional" style="white-space:nowrap;padding:8px 4px">Bono</th>
          <th title="Prestamo en quincena" style="white-space:nowrap;padding:8px 4px">Préstamo</th>
          <th title="Total final" style="white-space:nowrap;padding:8px 4px">SUELDO</th>
          <th class="asistencia-sueldos-nota" title="Nota" style="padding:8px 4px;min-width:128px">Nota</th>
          <th class="asistencia-sueldos-acciones" style="padding:8px 4px"></th>
        </tr></thead>
        <tbody>${data.resultados.map(r => `<tr data-empid="${r.emp.id}" data-subtotal="${r.subtotal}" data-onp="${r.onp_monto}" data-base="${r.base_sin_descuentos}" data-onp-rate="${r.onp_rate || 0}" data-faltas-auto="${r.faltas_auto}" data-tardanzas-auto="${r.tardanza_auto}" data-descansos-auto="${Number.isFinite(+r.descansos_auto) ? r.descansos_auto : 0}" data-descansos-efectivo="${r.descansos}" data-descansos-manual="${r.descansos_manual !== null && r.descansos_manual !== undefined ? '1' : '0'}" data-valor-dia="${data.valorDia}" data-faltas-unit="${r.faltas_descuento_unitario}" data-tardanzas-unit="${r.tardanza_descuento_unitario}" data-orig-ajuste="${asistEncodeAjusteOriginal(r)}">
          <td class="asistencia-sueldos-empleado" style="white-space:nowrap;padding:6px 5px"><strong>${r.emp.nombre_completo}</strong><br><span style="color:var(--text-muted);font-size:.72em">${r.emp.cargo||''}</span></td>
          <td style="text-align:center;white-space:nowrap;padding:6px 4px">${r.dias_trabajados}</td>
          <td style="text-align:center;white-space:nowrap;padding:6px 4px;color:var(--info)">${r.horas_trabajadas > 0 ? r.horas_trabajadas : '—'}</td>
          <td style="text-align:center;color:var(--success);white-space:nowrap;padding:6px 4px">${r.diasAdicionales}</td>
          <td style="white-space:nowrap;padding:4px 4px;text-align:center">
            ${esAdmin
              ? `<input type="number" id="sueldoFeriados_${r.emp.id}" min="0" step="1" value="${parseInt(r.feriados || 0, 10)}"
                  style="width:40px;height:20px;padding:0 1px;border:none;border-bottom:1px solid var(--border);border-radius:0;background:transparent;box-shadow:none;text-align:center;font-size:.78em;line-height:1.1">`
              : `<span style="color:var(--info)">${r.feriados || 0}</span>`}
          </td>
          <td style="white-space:nowrap;padding:6px 4px;text-align:right;color:var(--info)">${(r.dom_monto || 0) > 0 ? aFmt(r.dom_monto) : '—'}</td>
          <td style="text-align:center;white-space:nowrap;padding:4px 4px">
            ${esAdmin
              ? `<div class="sueldo-stepper">
                  <button type="button" class="sueldo-stepper-btn" onclick="asistAjustarDescansos(${r.emp.id}, 1)" title="Aumentar descansos">▲</button>
                  <span class="sueldo-stepper-val" id="sueldoDescansosVal_${r.emp.id}">${r.descansos}</span>
                  <input type="hidden" id="sueldoDescansos_${r.emp.id}" value="${r.descansos}">
                  <button type="button" class="sueldo-stepper-btn" onclick="asistAjustarDescansos(${r.emp.id}, -1)" title="Disminuir descansos">▼</button>
                </div>
                <small id="sueldoDescansosEstado_${r.emp.id}" class="sueldo-stepper-estado" style="color:${r.descansos_manual !== null && r.descansos_manual !== undefined ? 'var(--warning)' : 'var(--text-muted)'}">${r.descansos_manual !== null && r.descansos_manual !== undefined ? `Manual (Auto: ${r.descansos_auto})` : `Auto: ${r.descansos_auto}`}</small>`
              : `<span style="color:var(--text-muted)">${r.descansos}</span>`}
          </td>
          <td style="text-align:center;color:var(--danger);white-space:nowrap;padding:4px 4px;min-width:66px">
            ${esAdmin
              ? `<input type="number" id="sueldoFaltas_${r.emp.id}" min="0" step="1" value="${r.faltas_manual ?? ''}" placeholder="${r.faltas_auto}"
                  oninput="asistRecalcularSueldo(${r.emp.id})"
                  style="width:44px;height:20px;padding:0 1px;border:none;border-bottom:1px solid var(--border);border-radius:0;background:transparent;box-shadow:none;text-align:center;font-size:.78em;line-height:1.1">`
              : `${r.faltas}`}
            <br><small id="sueldoFaltasMonto_${r.emp.id}">(${aFmt(r.faltas_monto)})</small>
            ${esAdmin
              ? `<br><small id="sueldoFaltasEstado_${r.emp.id}" style="color:${r.faltas_manual !== null && r.faltas_manual !== undefined ? 'var(--warning)' : 'var(--text-muted)'}">${r.faltas_manual !== null && r.faltas_manual !== undefined ? `Manual (Auto: ${r.faltas_auto})` : `Auto: ${r.faltas_auto}`}</small>`
              : ''}
          </td>
          <td style="text-align:center;color:var(--warning);white-space:nowrap;padding:4px 4px;min-width:66px">
            ${esAdmin
              ? `<input type="number" id="sueldoTardanzas_${r.emp.id}" min="0" step="1" value="${r.tardanza_manual ?? ''}" placeholder="${r.tardanza_auto}"
                  oninput="asistRecalcularSueldo(${r.emp.id})"
                  style="width:44px;height:20px;padding:0 1px;border:none;border-bottom:1px solid var(--border);border-radius:0;background:transparent;box-shadow:none;text-align:center;font-size:.78em;line-height:1.1">`
              : `${r.tardanza_count}`}
            <br><small id="sueldoTardanzaMonto_${r.emp.id}">(${aFmt(r.tardanza_monto)})</small>
            ${esAdmin
              ? `<br><small id="sueldoTardanzaEstado_${r.emp.id}" style="color:${r.tardanza_manual !== null && r.tardanza_manual !== undefined ? 'var(--warning)' : 'var(--text-muted)'}">${r.tardanza_manual !== null && r.tardanza_manual !== undefined ? `Manual (Auto: ${r.tardanza_auto})` : `Auto: ${r.tardanza_auto}`}</small>`
              : ''}
          </td>
          <td style="color:var(--danger);white-space:nowrap;padding:6px 4px"><span id="sueldoOnp_${r.emp.id}">${r.onp_monto > 0 ? aFmt(r.onp_monto) : '—'}</span></td>
          <td style="white-space:nowrap;padding:4px 4px">
            ${esAdmin
              ? `<input type="number" id="sueldoBono_${r.emp.id}" min="0" step="0.01" value="${+r.bono > 0 ? (+r.bono).toFixed(2) : ''}"
                  oninput="asistRecalcularSueldo(${r.emp.id})"
                  style="width:54px;height:20px;padding:0 1px;border:none;border-bottom:1px solid var(--border);border-radius:0;background:transparent;box-shadow:none;text-align:right;font-size:.78em;line-height:1.1">`
              : `<span style="color:var(--success)">${r.bono > 0 ? aFmt(r.bono) : '—'}</span>`}
          </td>
          <td style="white-space:nowrap;padding:4px 4px">
            ${esAdmin
              ? `<input type="number" id="sueldoPrestamo_${r.emp.id}" min="0" step="0.01" value="${+r.prestamo > 0 ? (+r.prestamo).toFixed(2) : ''}"
                  oninput="asistRecalcularSueldo(${r.emp.id})"
                  style="width:54px;height:20px;padding:0 1px;border:none;border-bottom:1px solid var(--border);border-radius:0;background:transparent;box-shadow:none;text-align:right;font-size:.78em;line-height:1.1">`
              : `<span style="color:var(--danger)">${r.prestamo > 0 ? aFmt(r.prestamo) : '—'}</span>`}
          </td>
          <td style="white-space:nowrap;padding:6px 4px"><strong id="sueldoTotal_${r.emp.id}" style="color:${r.sueldo >= 0 ? 'var(--success)' : 'var(--danger)'};font-size:.96em">${aFmt(r.sueldo)}</strong></td>
          <td class="asistencia-sueldos-nota" style="padding:4px 4px;vertical-align:top">
            ${esAdmin
              ? `<textarea id="sueldoNota_${r.emp.id}" rows="2" placeholder="—"
                  style="width:124px;padding:3px 5px;border:1px solid var(--border);border-radius:4px;background:transparent;font-size:.78em;line-height:1.35;resize:none;font-family:inherit;color:inherit">${(r.nota||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</textarea>`
              : `<span style="color:var(--text-muted);font-size:.82em;white-space:pre-wrap">${(r.nota||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') || '—'}</span>`}
          </td>
          <td class="asistencia-sueldos-acciones" style="white-space:nowrap;padding:4px 4px">
            ${esAdmin
              ? `<div class="asistencia-sueldos-acciones-wrap"><button class="btn btn-primary btn-sm" style="padding:4px 6px;min-height:20px;font-size:.78em" title="Guardar ajustes" onclick="asistGuardarAjusteFila(${r.emp.id},'${p.desde}','${p.hasta}')">💾</button>
                 <button class="btn btn-sm" style="padding:4px 6px;min-height:20px;font-size:.78em;background:var(--bg-darker);border:1px solid var(--border)" title="Imprimir boleta" onclick="asistImprimirBoleta(${r.emp.id},'${p.desde}','${p.hasta}')">🖨️</button></div>`
              : ''}
          </td>
        </tr>`).join('')}</tbody>
      </table>`;
  } catch (e) { t.innerHTML = `<p class="text-center text-muted" style="padding:30px">Error: ${e.message}</p>`; }
}

function asistAjustarDescansos(empId, delta) {
  const fila = document.querySelector(`#tablaSueldos tr[data-empid="${empId}"]`);
  if (!fila) return;

  const input = document.getElementById(`sueldoDescansos_${empId}`);
  const valEl = document.getElementById(`sueldoDescansosVal_${empId}`);
  const estadoEl = document.getElementById(`sueldoDescansosEstado_${empId}`);
  if (!input || !valEl) return;

  const valorDia = parseFloat(fila.dataset.valorDia || '0') || 0;
  const descansosEfectivo = parseInt(fila.dataset.descansosEfectivo || input.value || '0', 10) || 0;
  const descansosAuto = parseInt(fila.dataset.descansosAuto || '0', 10) || 0;
  const baseActual = parseFloat(fila.dataset.base || '0') || 0;

  const nuevo = Math.max(0, (parseInt(input.value, 10) || 0) + delta);
  const deltaDias = nuevo - descansosEfectivo;
  const nuevoBase = +(baseActual + deltaDias * valorDia).toFixed(2);

  input.value = String(nuevo);
  valEl.textContent = String(nuevo);
  fila.dataset.base = String(nuevoBase);
  fila.dataset.descansosEfectivo = String(nuevo);
  fila.dataset.descansosManual = nuevo !== descansosAuto ? '1' : '0';

  if (estadoEl) {
    const manual = nuevo !== descansosAuto;
    estadoEl.textContent = manual ? `Manual (Auto: ${descansosAuto})` : `Auto: ${descansosAuto}`;
    estadoEl.style.color = manual ? 'var(--warning)' : 'var(--text-muted)';
  }

  asistRecalcularSueldo(empId);
}

function asistRecalcularSueldo(empId) {
  const fila = document.querySelector(`#tablaSueldos tr[data-empid="${empId}"]`);
  if (!fila) return;

  const baseRaw = parseFloat(fila.dataset.base || '');
  const subtotalPrevio = parseFloat(fila.dataset.subtotal || '0') || 0;
  const faltasMontoPrevioTxt = document.getElementById(`sueldoFaltasMonto_${empId}`)?.textContent || '';
  const tardanzasMontoPrevioTxt = document.getElementById(`sueldoTardanzaMonto_${empId}`)?.textContent || '';
  const extraerMonto = (txt) => {
    const limpio = String(txt || '').replace(/,/g, '.');
    const nums = limpio.match(/-?\d+(?:\.\d+)?/g);
    if (!nums?.length) return 0;
    return parseFloat(nums[nums.length - 1]) || 0;
  };
  // Fallback: si falta data-base por cache/backend antiguo, reconstruimos base desde subtotal + descuentos visibles.
  const base = Number.isFinite(baseRaw)
    ? baseRaw
    : +(subtotalPrevio + extraerMonto(faltasMontoPrevioTxt) + extraerMonto(tardanzasMontoPrevioTxt)).toFixed(2);
  const onpRate = parseFloat(fila.dataset.onpRate || '0') || 0;
  const faltasAuto = parseInt(fila.dataset.faltasAuto || '0', 10) || 0;
  const tardanzasAuto = parseInt(fila.dataset.tardanzasAuto || '0', 10) || 0;
  const faltasUnitRaw = parseFloat(fila.dataset.faltasUnit || '');
  const tardanzasUnitRaw = parseFloat(fila.dataset.tardanzasUnit || '');
  const faltasUnit = Number.isFinite(faltasUnitRaw) ? faltasUnitRaw : 20;
  const tardanzasUnit = Number.isFinite(tardanzasUnitRaw) ? tardanzasUnitRaw : 2;
  const faltasInput = document.getElementById(`sueldoFaltas_${empId}`)?.value;
  const tardanzasInput = document.getElementById(`sueldoTardanzas_${empId}`)?.value;
  const bono = parseFloat(document.getElementById(`sueldoBono_${empId}`)?.value || '0') || 0;
  const prestamo = parseFloat(document.getElementById(`sueldoPrestamo_${empId}`)?.value || '0') || 0;

  const faltas = faltasInput === '' || faltasInput === undefined ? faltasAuto : Math.max(0, parseInt(faltasInput, 10) || 0);
  const tardanzas = tardanzasInput === '' || tardanzasInput === undefined ? tardanzasAuto : Math.max(0, parseInt(tardanzasInput, 10) || 0);
  const faltasMonto = +(faltas * faltasUnit).toFixed(2);
  const tardanzasMonto = +(tardanzas * tardanzasUnit).toFixed(2);
  const subtotal = +(base - faltasMonto - tardanzasMonto).toFixed(2);
  const onpMonto = +((subtotal * onpRate)).toFixed(2);
  const sueldo = +(subtotal - onpMonto - prestamo + bono).toFixed(2);

  fila.dataset.subtotal = String(subtotal);
  fila.dataset.onp = String(onpMonto);

  const subtotalEl = document.getElementById(`sueldoSubtotal_${empId}`);
  const onpEl = document.getElementById(`sueldoOnp_${empId}`);
  const faltasMontoEl = document.getElementById(`sueldoFaltasMonto_${empId}`);
  const tardanzasMontoEl = document.getElementById(`sueldoTardanzaMonto_${empId}`);
  const totalEl = document.getElementById(`sueldoTotal_${empId}`);
  const faltasEstadoEl = document.getElementById(`sueldoFaltasEstado_${empId}`);
  const tardanzasEstadoEl = document.getElementById(`sueldoTardanzaEstado_${empId}`);

  if (subtotalEl) subtotalEl.textContent = aFmt(subtotal);
  if (onpEl) onpEl.textContent = onpMonto > 0 ? aFmt(onpMonto) : '—';
  if (faltasMontoEl) faltasMontoEl.textContent = `(${aFmt(faltasMonto)})`;
  if (tardanzasMontoEl) tardanzasMontoEl.textContent = `(${aFmt(tardanzasMonto)})`;
  if (faltasEstadoEl) {
    const manual = !(faltasInput === '' || faltasInput === undefined);
    faltasEstadoEl.textContent = manual ? `Manual (Auto: ${faltasAuto})` : `Auto: ${faltasAuto}`;
    faltasEstadoEl.style.color = manual ? 'var(--warning)' : 'var(--text-muted)';
  }
  if (tardanzasEstadoEl) {
    const manual = !(tardanzasInput === '' || tardanzasInput === undefined);
    tardanzasEstadoEl.textContent = manual ? `Manual (Auto: ${tardanzasAuto})` : `Auto: ${tardanzasAuto}`;
    tardanzasEstadoEl.style.color = manual ? 'var(--warning)' : 'var(--text-muted)';
  }
  if (totalEl) {
    totalEl.textContent = aFmt(sueldo);
    totalEl.style.color = sueldo >= 0 ? 'var(--success)' : 'var(--danger)';
  }
}

async function asistImprimirBoleta(empId, desde, hasta) {
  const data = await fetch(`${AAPI}/sueldos/boleta?emp_id=${empId}&desde=${desde}&hasta=${hasta}`).then(r => r.json());
  if (!data.ok) { alert('Error al cargar boleta'); return; }

  const { emp, ajuste, registros, valorDia, valorHora, descTardanza, periodo, resumen, baseHoraParcial } = data;
  // Extraer todos los campos relevantes del resumen para la tabla de liquidación
  const diasAdic = +resumen?.diasAdicionales || 0;
  const descansos = +resumen?.descansos || 0;
  const domMonto = +resumen?.domMonto || 0;
  const faltas = +resumen?.faltas || 0;
  const faltasMonto = +resumen?.faltasMonto || 0;
  const faltasAuto = +resumen?.faltasAuto || 0;
  const tardanzaAuto = +resumen?.tardanzaAuto || 0;
  const tardanzaManual = resumen?.tardanzaManual;
  const faltasManual = resumen?.faltasManual;
  const onpRate = resumen?.onpRate || 0;
  const onpMonto = resumen?.onpMonto || 0;
  const periodoDesde = periodo?.desde || desde;
  const periodoHasta = periodo?.hasta || hasta;
  const feriados   = +ajuste?.feriados  || 0;
  const prestamo   = +ajuste?.prestamo  || 0;
  const bono       = +ajuste?.bono      || 0;
  const nota       = ajuste?.nota       || '';

  const diasTrab   = +resumen?.diasTrabajados || 0;
  const horasTrab  = +resumen?.horasTrabajadas || 0;
  const tardCount  = +resumen?.tardanzaCount || registros.filter(r => r.tarde).length;
  const tardMonto  = +resumen?.tardanzaMonto || +(tardCount * descTardanza).toFixed(2);
  // descansos y faltas: aproximar desde el backend (usamos los registros como referencia)

  // Meses en español
  const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const DIAS  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const fDesde = new Date(periodoDesde + 'T12:00:00');
  const fHasta = new Date(periodoHasta + 'T12:00:00');
  const mesNombre = MESES[fDesde.getMonth()];
  const anio      = fDesde.getFullYear();
  const qNum      = fDesde.getDate() <= 15 ? '1ª' : '2ª';
  const hoy = new Date();
  const fechaImpresion = `${hoy.getDate()} de ${MESES[hoy.getMonth()]} de ${hoy.getFullYear()}`;

  const fmt = n => 'S/. ' + (+n || 0).toFixed(2);

  // Calendario 2 columnas (mitad izquierda / mitad derecha) para reducir altura
  const mkCel = r => {
    if (!r) return `<td colspan="4"></td>`;
    const fd = new Date(r.fecha + 'T12:00:00');
    const ec = !r.hora_entrada ? ['F','#c53030'] : r.tarde ? ['T','#b7791f'] : ['✓','#276749'];
    return `<td class="cc">${fd.getDate()} ${DIAS[fd.getDay()]}</td>` +
           `<td class="cc cn">${r.hora_entrada||'—'}</td>` +
           `<td class="cc cn">${r.hora_salida||'—'}</td>` +
           `<td class="cc cn" style="color:${ec[1]};font-weight:700;border-right:1px solid #bbb">${ec[0]}</td>`;
  };
  const mid = Math.ceil(registros.length / 2);
  const col1 = registros.slice(0, mid);
  const col2 = registros.slice(mid);
  let calFilas = '';
  for (let i = 0; i < col1.length; i++) {
    calFilas += `<tr>${mkCel(col1[i])}${i < col2.length ? mkCel(col2[i]) : '<td colspan="4"></td>'}</tr>`;
  }

  // Obtener bono y préstamo desde los inputs/celdas actuales
  const bonoInput    = parseFloat(document.getElementById(`sueldoBono_${empId}`)?.value || '0') || bono;
  const prestamoInput= parseFloat(document.getElementById(`sueldoPrestamo_${empId}`)?.value || '0') || prestamo;

  const fila = document.querySelector(`#tablaSueldos tr[data-empid="${empId}"]`);
  // Usar sueldoFinal y onpMonto del resumen por defecto
  let onpVal = onpMonto;
  let sueldoFinalFinal = +resumen?.sueldo || 0;
  if (fila) {
    onpVal = parseFloat(fila.dataset.onp || onpMonto);
    // Prioriza el neto visible en tabla para reflejar ajustes manuales del usuario
    const sueldoTxt = document.getElementById(`sueldoTotal_${empId}`)?.textContent || '';
    const sueldoLimpio = String(sueldoTxt)
      .replace(/^\s*S\/\.\s*/i, '')
      .replace(/,/g, '')
      .trim();
    const sueldoNum = parseFloat(sueldoLimpio);
    if (Number.isFinite(sueldoNum)) sueldoFinalFinal = +sueldoNum.toFixed(2);
  }

  const htmlA4 = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Boleta ${emp.nombre} ${emp.apellido}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{font-family:Arial,sans-serif;font-size:13px;color:#111;background:#fff}
  @page{size:A4;margin:10mm 17.28mm}
  @media print{.no-print{display:none!important} .wrap{padding:0}}
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
  table.cal td.div{border-right:2px solid #bbb;padding-right:8px}
  table.cal tr:nth-child(even){background:#fafafa}
  .liq-wrap{display:block;margin-bottom:7px}
  table.liq{width:100%;border-collapse:collapse;font-size:.97em;margin-bottom:2px}
  table.liq td{padding:3px 5px}
  table.liq td:last-child{text-align:right;white-space:nowrap}
  table.liq tr.inc td{color:#1d4ed8;font-weight:700}
  table.liq tr.dec td{color:#b91c1c;font-weight:700}
  table.liq tr.sep td{border-top:1px solid #ccc;padding-top:4px}
  table.liq tr.total td{border-top:2px solid #111;font-weight:800;font-size:1.08em;padding-top:4px}
  table.liq tr.total td:last-child{color:#1d4ed8}
  .nota-box{background:#fffbe6;border:1px solid #e9c83e;border-radius:3px;padding:4px 8px;font-size:.88em;color:#555;margin-bottom:7px}
  .firma-wrap{display:flex;justify-content:space-between;align-items:flex-end;margin-top:60px;padding-top:18px;border-top:1px solid #ddd;gap:60px}
  .firma-box{text-align:center}
  .firma-linea{border-top:1.5px solid #333;margin-top:36px;padding-top:5px;font-size:.88em;color:#333;font-weight:700}
  .firma-campo{margin-top:6px;font-size:.95em;color:#333;font-weight:700}
  .huella-rect{width:80px;height:100px;border:1.5px solid #333;border-radius:4px;margin:8px auto 0;background:#f9f9f9}
  .pie{text-align:center;margin-top:8px;font-size:.78em;color:#aaa}
  .btn-imp{display:inline-block;margin:0 5px 10px 0;padding:6px 16px;background:#111;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:.92em}
  .btn-80{background:#555}
</style></head><body>
<div class="wrap">
  <div class="no-print" style="margin-bottom:10px">
    <button class="btn-imp" onclick="window.print()">🖨️ Imprimir A4</button>
    <button class="btn-imp btn-80" onclick="imprimirTicket()">🖨️ Imprimir 80mm</button>
    <button class="btn-imp" style="background:#888" onclick="window.close()">✕ Cerrar</button>
  </div>

  <div class="hdr">
    <div class="hdr-left">
      <h1>🐷 Belu Chicharronería</h1>
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

  <div class="sh">📅 Registro de Asistencia</div>
  <table class="cal">
    <thead><tr>
      <th>Día</th><th>Entrada</th><th>Salida</th><th class="div">Est.</th>
      <th>Día</th><th>Entrada</th><th>Salida</th><th>Est.</th>
    </tr></thead>
    <tbody>${calFilas}</tbody>
  </table>

  <div class="sh">💵 Liquidación</div>
  <div class="liq-wrap">
    <table class="liq">
      <tr class="inc"><td>Días trabajados (${diasTrab} x ${(+valorDia || 0).toFixed(2)})</td><td>${fmt(diasTrab * valorDia)}</td></tr>
      <tr class="inc"><td>Días adicionales (${diasAdic} x ${(+valorDia || 0).toFixed(2)})</td><td>${fmt(diasAdic * valorDia)}</td></tr>
      <tr class="inc"><td>Descansos (${descansos} x ${(+valorDia || 0).toFixed(2)})</td><td>${fmt(descansos * valorDia)}</td></tr>
      <tr class="inc"><td>Dominical proporcional</td><td>${fmt(domMonto)}</td></tr>
      <tr class="inc"><td>Horas parciales (${horasTrab} x ${(+valorHora || 0).toFixed(2)})</td><td>${fmt(horasTrab * valorHora)}</td></tr>
      <tr class="inc"><td>Feriados (${feriados} x ${(+valorDia || 0).toFixed(2)})</td><td>${fmt(feriados * valorDia)}</td></tr>
      <tr class="dec"><td>Faltas (${faltas}; ${faltasManual !== null && faltasManual !== undefined ? 'Manual' : 'Auto: ' + faltasAuto})</td><td>${faltasMonto > 0 ? '-' : ''}${fmt(faltasMonto)}</td></tr>
      <tr class="dec"><td>Tardanzas (${tardCount}; ${tardanzaManual !== null && tardanzaManual !== undefined ? 'Manual' : 'Auto: ' + tardanzaAuto})</td><td>${tardMonto > 0 ? '-' : ''}${fmt(tardMonto)}</td></tr>
      <tr class="inc"><td>Bono</td><td>${fmt(bonoInput)}</td></tr>
      <tr class="dec"><td>Préstamo</td><td>${prestamoInput > 0 ? '-' : ''}${fmt(prestamoInput)}</td></tr>
      <tr class="dec"><td>ONP</td><td>${onpVal > 0 ? '-' : ''}${fmt(onpVal)}</td></tr>
      <tr class="total"><td>SUELDO NETO</td><td>${fmt(sueldoFinalFinal)}</td></tr>
    </table>
  </div>

  ${nota ? `<div class="nota-box"><strong>Nota:</strong> ${nota}</div>` : ''}

  <div style="height:60px"></div>
  <div class="firma-wrap">
    <div class="firma-box">
      <div class="firma-linea"></div>
      <div class="firma-campo">${emp.nombre} ${emp.apellido}</div>
      <div class="firma-campo">Firma del Trabajador</div>
    </div>
    <div class="firma-box">
      <div style="font-size:.88em;color:#333;font-weight:700;margin-bottom:4px">Huella Digital</div>
      <div class="huella-rect"></div>
    </div>
  </div>
  <div class="pie">Belu Chicharronería — Documento generado el ${fechaImpresion}</div>
</div>
<div id="ticket80" style="display:none"></div>
<script>
function imprimirTicket() {
  const t = document.getElementById('ticket80');
  t.innerHTML = ${JSON.stringify(`
  <style>
    @page { size: 80mm auto; margin: 2mm 3mm; }
    body { font-family: 'Courier New', monospace; font-size: 11px; width:72mm; }
    .t-center { text-align:center; } .t-right { text-align:right; }
    .sep { border-top:1px dashed #999; margin:4px 0; }
    .bold { font-weight:bold; } .big { font-size:1.1em; }
    table { width:100%; border-collapse:collapse; font-size:10px; }
    td, th { padding:1px 2px; }
  </style>
  <div class="t-center bold" style="font-size:1.2em">BELU CHICHARRONERIA</div>
  <div class="t-center" style="font-size:.85em">BOLETA DE PAGO</div>
  <div class="t-center" style="font-size:.85em">${qNum} Quincena ${mesNombre} ${anio}</div>
  <div class="sep"></div>
  <div><b>${emp.nombre} ${emp.apellido}</b></div>
  <div style="font-size:.85em">${emp.cargo || ''}</div>
  <div style="font-size:.85em">${emp.tipo_doc}: ${emp.documento}</div>
  <div class="sep"></div>
  <table>
    <tr><th>Fecha</th><th>Ent.</th><th>Sal.</th><th>Est.</th></tr>
    ${registros.map(r2 => `<tr><td>${r2.fecha.slice(5)}</td><td>${r2.hora_entrada||'—'}</td><td>${r2.hora_salida||'—'}</td><td>${!r2.hora_entrada?'F':r2.tarde?'T':'OK'}</td></tr>`).join('')}
  </table>
  <div class="sep"></div>
  <table>
    <tr><td>Días trab. (${diasTrab})</td><td class="t-right">${fmt(diasTrab * valorDia)}</td></tr>
    ${horasTrab > 0 ? `<tr><td>Horas parc. (${horasTrab})</td><td class="t-right">${fmt(horasTrab * valorHora)}</td></tr>` : ''}
    ${feriados > 0 ? `<tr><td>Feriados (${feriados})</td><td class="t-right">+${fmt(feriados * valorDia)}</td></tr>` : ''}
    <tr><td>Tardanzas (${tardCount})</td><td class="t-right">-${fmt(tardMonto)}</td></tr>
    ${onpVal > 0 ? `<tr><td>ONP 13%</td><td class="t-right">-${fmt(onpVal)}</td></tr>` : ''}
    ${prestamoInput > 0 ? `<tr><td>Préstamo</td><td class="t-right">-${fmt(prestamoInput)}</td></tr>` : ''}
    ${bonoInput > 0 ? `<tr><td>Bono</td><td class="t-right">+${fmt(bonoInput)}</td></tr>` : ''}
  </table>
  <div class="sep"></div>
  <div class="bold big t-center">NETO: ${fmt(sueldoFinalFinal)}</div>
  <div class="sep"></div>
  ${nota ? `<div style="font-size:.85em">Nota: ${nota}</div><div class="sep"></div>` : ''}
  <div style="margin-top:28px">Firma: ____________________</div>
  <div style="margin-top:18px">DNI:   ____________________</div>
  <div style="margin-top:14px;font-size:.8em;text-align:center">${fechaImpresion}</div>
  `)};
  const w = window.open('', '_blank', 'width=330,height=700');
  w.document.write('<html><body>' + t.innerHTML + '</body></html>');
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 400);
}
<\/script>
</body></html>`;

  const win = window.open('', '_blank', 'width=800,height=900');
  win.document.write(htmlA4);
  win.document.close();
  win.focus();
}

function asistConstruirPayloadAjuste(empId, desde, hasta) {
  const fila = document.querySelector(`#tablaSueldos tr[data-empid="${empId}"]`);
  const ferEl = document.getElementById(`sueldoFeriados_${empId}`);
  const faltasEl = document.getElementById(`sueldoFaltas_${empId}`);
  const tardanzasEl = document.getElementById(`sueldoTardanzas_${empId}`);
  const descansosEl = document.getElementById(`sueldoDescansos_${empId}`);
  const bonoEl = document.getElementById(`sueldoBono_${empId}`);
  const presEl = document.getElementById(`sueldoPrestamo_${empId}`);
  const notaEl = document.getElementById(`sueldoNota_${empId}`);

  const feriados = parseInt(ferEl?.value || '0', 10) || 0;
  const faltasOverride = faltasEl && faltasEl.value !== '' ? Math.max(0, parseInt(faltasEl.value, 10) || 0) : null;
  const tardanzasOverride = tardanzasEl && tardanzasEl.value !== '' ? Math.max(0, parseInt(tardanzasEl.value, 10) || 0) : null;
  const descansosAutoRaw = parseInt(String(fila?.dataset.descansosAuto ?? ''), 10);
  const descansosAuto = Number.isFinite(descansosAutoRaw) ? descansosAutoRaw : 0;
  const descansosValRaw = parseInt(
    String(descansosEl?.value ?? document.getElementById(`sueldoDescansosVal_${empId}`)?.textContent ?? descansosAuto).trim(),
    10
  );
  const descansosVal = Number.isFinite(descansosValRaw) ? Math.max(0, descansosValRaw) : descansosAuto;
  const esManualDescansos = fila?.dataset.descansosManual === '1';
  const descansosOverride = esManualDescansos ? descansosVal : null;
  const bono = parseFloat(bonoEl?.value || '0') || 0;
  const prestamo = parseFloat(presEl?.value || '0') || 0;
  const nota = notaEl?.value || '';

  // #region agent log
  fetch('http://127.0.0.1:7505/ingest/213bef8c-9b8e-4768-8ce2-5544a6b05bf1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'61705f'},body:JSON.stringify({sessionId:'61705f',runId:'post-fix',hypothesisId:'H1',location:'asistencia.js:asistConstruirPayloadAjuste',message:'Payload descansos construido',data:{empId,descansosVal,descansosAuto,descansosOverride,esManualDescansos,hiddenValue:descansosEl?.value??null,datasetAuto:fila?.dataset?.descansosAuto??null,datasetManual:fila?.dataset?.descansosManual??null},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  return {
    empleado_id: empId,
    periodo_desde: desde,
    periodo_hasta: hasta,
    feriados,
    faltas_override: faltasOverride,
    tardanzas_override: tardanzasOverride,
    descansos_override: descansosOverride,
    prestamo,
    bono,
    nota
  };
}

function asistPayloadComparable(payload) {
  return {
    feriados: parseInt(payload?.feriados || 0, 10) || 0,
    faltas_override: payload?.faltas_override === null || payload?.faltas_override === undefined || payload?.faltas_override === ''
      ? null
      : Math.max(0, parseInt(payload.faltas_override, 10) || 0),
    tardanzas_override: payload?.tardanzas_override === null || payload?.tardanzas_override === undefined || payload?.tardanzas_override === ''
      ? null
      : Math.max(0, parseInt(payload.tardanzas_override, 10) || 0),
    descansos_override: payload?.descansos_override === null || payload?.descansos_override === undefined || payload?.descansos_override === ''
      ? null
      : Math.max(0, parseInt(payload.descansos_override, 10) || 0),
    prestamo: parseFloat(payload?.prestamo || 0) || 0,
    bono: parseFloat(payload?.bono || 0) || 0,
    nota: String(payload?.nota || '')
  };
}

function asistFilaFueAlterada(empId, payloadActual) {
  const fila = document.querySelector(`#tablaSueldos tr[data-empid="${empId}"]`);
  if (!fila) return false;
  const origAttr = fila.getAttribute('data-orig-ajuste') || '';
  if (!origAttr) return true;
  try {
    const original = JSON.parse(decodeURIComponent(origAttr));
    const a = asistPayloadComparable(original);
    const b = asistPayloadComparable(payloadActual);
    return JSON.stringify(a) !== JSON.stringify(b);
  } catch {
    return true;
  }
}

async function asistEnviarAjusteSueldo(payload) {
  const res = await fetch(`${AAPI}/sueldos/ajuste`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

async function asistGuardarAjusteFila(empId, desde, hasta) {
  const payload = asistConstruirPayloadAjuste(empId, desde, hasta);
  const data = await asistEnviarAjusteSueldo(payload);
  // #region agent log
  fetch('http://127.0.0.1:7505/ingest/213bef8c-9b8e-4768-8ce2-5544a6b05bf1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'61705f'},body:JSON.stringify({sessionId:'61705f',hypothesisId:'H2',location:'asistencia.js:asistGuardarAjusteFila',message:'Respuesta guardar fila',data:{empId,desde,hasta,payloadDescansos:payload.descansos_override,ok:data?.ok,error:data?.error??null},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  if (data.ok) asistCargarSueldos();
  else alert(data.error || 'No se pudo guardar el ajuste.');
}

async function asistGuardarAjustesLote() {
  const anio = document.getElementById('sueldoAnio')?.value;
  const mes = document.getElementById('sueldoMes')?.value;
  const quincena = document.getElementById('sueldoQuincena')?.value;
  if (!anio || !mes || !quincena) {
    alert('No se pudo identificar el período actual.');
    return;
  }

  const periodo = await fetch(`${AAPI}/sueldos?anio=${anio}&mes=${mes}&quincena=${quincena}`).then(r => r.json()).catch(() => null);
  if (!periodo?.ok || !periodo?.periodo) {
    alert('No se pudo obtener el período para guardar en lote.');
    return;
  }

  const filas = Array.from(document.querySelectorAll('#tablaSueldos tr[data-empid]'));
  if (!filas.length) {
    alert('No hay embajadores para guardar.');
    return;
  }

  const btn = document.getElementById('btnGuardarLoteSueldos');
  const textoOriginal = btn?.textContent || '💾 Guardar todo';
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Guardando...';
  }

  let guardados = 0;
  let alterados = 0;
  const errores = [];
  for (const fila of filas) {
    const empId = parseInt(fila.getAttribute('data-empid') || '0', 10);
    if (!empId) continue;
    try {
      const payload = asistConstruirPayloadAjuste(empId, periodo.periodo.desde, periodo.periodo.hasta);
      if (!asistFilaFueAlterada(empId, payload)) continue;
      alterados += 1;
      const data = await asistEnviarAjusteSueldo(payload);
      if (data.ok) guardados += 1;
      else errores.push(`Embajador ${empId}: ${data.error || 'error'}`);
    } catch (e) {
      errores.push(`Embajador ${empId}: ${e.message || 'error'}`);
    }
  }

  if (btn) {
    btn.disabled = false;
    btn.textContent = textoOriginal;
  }

  if (alterados === 0) {
    alert('No hay cambios por guardar.');
    return;
  }

  if (errores.length) {
    alert(`Se guardaron ${guardados} de ${alterados} cambios.\n\nErrores:\n${errores.slice(0, 5).join('\n')}`);
  } else {
    alert(`Se guardaron ${guardados} cambios correctamente.`);
  }

  asistCargarSueldos();
}

async function asistAjuste(empId, nombre, desde, hasta, feriados, prestamo, bono) {
  const nuevoFer  = prompt(`${nombre}\nFeriados trabajados (actual: ${feriados}):`, feriados);
  if (nuevoFer === null) return;
  const nuevoPres = prompt('Préstamo a descontar:', prestamo);
  if (nuevoPres === null) return;
  const nuevoBono = prompt('Bono:', bono);
  if (nuevoBono === null) return;
  const res  = await fetch(`${AAPI}/sueldos/ajuste`, { method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ empleado_id: empId, periodo_desde: desde, periodo_hasta: hasta,
      feriados: +nuevoFer||0, prestamo: +nuevoPres||0, bono: +nuevoBono||0 }) });
  const data = await res.json();
  if (data.ok) asistCargarSueldos(); else alert(data.error);
}

// ════════════════ AUDITORÍA ════════════════

async function asistCargarAuditoria() {
  const t = document.getElementById('tablaAuditoria');
  t.innerHTML = '<p class="text-center text-muted" style="padding:30px">Cargando...</p>';
  try {
    const data = await fetch(`${AAPI}/auditoria`).then(r => r.json());
    if (!data.logs?.length) { t.innerHTML = '<p class="text-center text-muted" style="padding:30px">Sin registros</p>'; return; }
    t.innerHTML = `<table class="data-table">
      <thead><tr><th>Fecha/Hora</th><th>Tabla</th><th>Acción</th><th>Detalle</th></tr></thead>
      <tbody>${data.logs.map(l => `<tr>
        <td style="color:var(--text-muted);font-size:.82em;white-space:nowrap">${(l.timestamp||'').slice(0,16)}</td>
        <td style="font-size:.82em">${l.tabla||'—'}</td>
        <td><span style="padding:2px 8px;border-radius:5px;font-size:.78em;background:var(--bg-darker)">${l.accion||'—'}</span></td>
        <td style="font-size:.83em;color:var(--text-muted)">${l.detalle||'—'}</td>
      </tr>`).join('')}</tbody></table>`;
  } catch { t.innerHTML = '<p class="text-center text-muted" style="padding:30px">Error</p>'; }
}

// ════════════════ CONFIGURACIÓN ════════════════

async function asistCargarConfig() {
  try {
    const data = await fetch(`${AAPI}/config`).then(r => r.json());
    const cfg  = data.config || {};
    const sueldoBase = parseFloat(cfg.sueldo_minimo || 1025) || 1025;
    const valorDiaAuto = Math.round(sueldoBase / 30 * 100) / 100;
    const valorHoraAuto = Math.round(valorDiaAuto / 8 * 100) / 100;
    document.getElementById('cfgSueldo').value        = cfg.sueldo_minimo || 1025;
    document.getElementById('cfgValorDia').value      = (parseFloat(cfg.valor_dia) || valorDiaAuto).toFixed(2);
    document.getElementById('cfgValorHora').value     = (parseFloat(cfg.valor_hora) || valorHoraAuto).toFixed(2);
    document.getElementById('cfgHoraIngreso').value   = cfg.hora_ingreso || '06:30';
    document.getElementById('cfgTolerancia').value    = cfg.tolerancia_min || 5;
    document.getElementById('cfgDescTard').value      = cfg.descuento_tardanza || 2;
    document.getElementById('cfgSmtp').value          = cfg.email_smtp || 'smtp.gmail.com';
    document.getElementById('cfgPuerto').value        = cfg.email_puerto || 587;
    document.getElementById('cfgEmailUser').value     = cfg.email_usuario || '';
    document.getElementById('cfgEmailPass').value     = '';  // nunca mostrar contraseña guardada
    document.getElementById('cfgEmailActivo').checked = !!cfg.email_activo;
    document.getElementById('cfgBackupDiarioActivo').checked = !!cfg.backup_diario_activo;
    document.getElementById('cfgValorDia').dataset.manual = Math.abs((parseFloat(cfg.valor_dia) || valorDiaAuto) - valorDiaAuto) > 0.009 ? '1' : '0';
    document.getElementById('cfgValorHora').dataset.manual = Math.abs((parseFloat(cfg.valor_hora) || valorHoraAuto) - valorHoraAuto) > 0.009 ? '1' : '0';
    cfgRecalcular();
    cfgActualizarResumen();
    // Inicializar selects de correo quincenal
    const anioSel = document.getElementById('cfgQAnio');
    if (anioSel && !anioSel.options.length) {
      const y = new Date().getFullYear();
      for (let i = y; i >= y - 2; i--) anioSel.innerHTML += `<option value="${i}">${i}</option>`;
      document.getElementById('cfgQMes').value     = new Date().getMonth() + 1;
      document.getElementById('cfgQQuincena').value = new Date().getDate() <= 15 ? '1' : '2';
    }
  } catch { /* silencioso */ }
}

function cfgRecalcular(force = false) {
  const s = parseFloat(document.getElementById('cfgSueldo')?.value) || 0;
  const dia = Math.round(s / 30 * 100) / 100;
  const hora = Math.round(dia / 8 * 100) / 100;
  const diaEl  = document.getElementById('cfgValorDia');
  const horaEl = document.getElementById('cfgValorHora');
  if (diaEl) {
    if (force || diaEl.dataset.manual !== '1' || !diaEl.value) diaEl.value = dia.toFixed(2);
    diaEl.dataset.auto = dia.toFixed(2);
  }
  if (horaEl) {
    if (force || horaEl.dataset.manual !== '1' || !horaEl.value) horaEl.value = hora.toFixed(2);
    horaEl.dataset.auto = hora.toFixed(2);
  }
}

function cfgMarcarManual(tipo) {
  const el = document.getElementById(tipo === 'dia' ? 'cfgValorDia' : 'cfgValorHora');
  if (el) el.dataset.manual = '1';
}

function cfgAplicarValoresAutomaticos() {
  const diaEl = document.getElementById('cfgValorDia');
  const horaEl = document.getElementById('cfgValorHora');
  if (diaEl) diaEl.dataset.manual = '0';
  if (horaEl) horaEl.dataset.manual = '0';
  cfgRecalcular(true);
}

function cfgActualizarResumen() {
  const hora = document.getElementById('cfgHoraIngreso')?.value || '06:30';
  const tol  = document.getElementById('cfgTolerancia')?.value  || '5';
  const tolNum = parseInt(tol, 10) || 0;
  const desc = parseFloat(document.getElementById('cfgDescTard')?.value) || 0;
  const rHora = document.getElementById('cfgResHora');
  const rTol  = document.getElementById('cfgResTol');
  const rDesde = document.getElementById('cfgResDesde');
  const rDesc = document.getElementById('cfgResDesc');
  const [hh, mm] = String(hora).split(':').map(n => parseInt(n, 10));
  const baseMin = (Number.isFinite(hh) ? hh : 6) * 60 + (Number.isFinite(mm) ? mm : 30);
  const desdeMin = (baseMin + tolNum + 1) % (24 * 60);
  const desdeHH = String(Math.floor(desdeMin / 60)).padStart(2, '0');
  const desdeMM = String(desdeMin % 60).padStart(2, '0');
  if (rHora) rHora.textContent = hora;
  if (rTol)  rTol.textContent  = tol;
  if (rDesde) rDesde.textContent = `${desdeHH}:${desdeMM}`;
  if (rDesc) rDesc.textContent = desc.toFixed(2);
}

async function asistEnviarCorreos() {
  const anio     = document.getElementById('cfgQAnio')?.value;
  const mes      = document.getElementById('cfgQMes')?.value;
  const quincena = document.getElementById('cfgQQuincena')?.value;
  const msgEl    = document.getElementById('cfgCorreoMsg');
  if (msgEl) msgEl.textContent = 'Enviando...';
  try {
    const res  = await fetch(`${AAPI}/correo/quincena`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anio: +anio, mes: +mes, quincena: +quincena })
    });
    const data = await res.json();
    if (data.ok) {
      if (msgEl) msgEl.innerHTML = `<span style="color:var(--success)">✓ Enviados: ${data.enviados}</span>${data.errores?.length ? ` | Errores: ${data.errores.length}` : ''}`;
    } else {
      if (msgEl) msgEl.innerHTML = `<span style="color:var(--danger)">✗ ${data.error}</span>`;
    }
  } catch { if (msgEl) msgEl.innerHTML = `<span style="color:var(--danger)">✗ Error de red</span>`; }
}

async function asistEnviarRespaldoPrueba() {
  const msgEl = document.getElementById('cfgBackupMsg');
  if (msgEl) msgEl.textContent = 'Enviando prueba...';
  try {
    const res = await fetch(`${AAPI}/correo/respaldo/prueba`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.ok) {
      if (msgEl) msgEl.innerHTML = `<span style="color:var(--success)">✓ Prueba enviada a ${data.destino} con ${data.archivos?.length || 0} adjuntos</span>`;
    } else {
      if (msgEl) msgEl.innerHTML = `<span style="color:var(--danger)">✗ ${data.error}</span>`;
    }
  } catch {
    if (msgEl) msgEl.innerHTML = `<span style="color:var(--danger)">✗ Error de red</span>`;
  }
}

async function asistGuardarConfig() {
  const body = {
    sueldo_minimo:      +document.getElementById('cfgSueldo').value || 1025,
    valor_dia:          +document.getElementById('cfgValorDia').value || 0,
    valor_hora:         +document.getElementById('cfgValorHora').value || 0,
    hora_ingreso:        document.getElementById('cfgHoraIngreso').value,
    tolerancia_min:     +document.getElementById('cfgTolerancia').value || 5,
    descuento_tardanza: +document.getElementById('cfgDescTard').value || 2,
    email_smtp:          document.getElementById('cfgSmtp').value,
    email_puerto:       +document.getElementById('cfgPuerto').value || 587,
    email_usuario:       document.getElementById('cfgEmailUser').value,
    email_password:      document.getElementById('cfgEmailPass').value,
    email_activo:        document.getElementById('cfgEmailActivo').checked,
    backup_diario_activo: document.getElementById('cfgBackupDiarioActivo').checked
  };
  const res  = await fetch(`${AAPI}/config`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
  const data = await res.json();
  const msg  = document.getElementById('cfgMsg');
  if (data.ok) { msg.textContent = '✓ Configuración guardada'; setTimeout(() => msg.textContent = '', 3000); }
  else alert(data.error);
}
