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

async function asistFetchJson(url, opts) {
  const res = await fetch(url, opts);
  if (res.status === 401) {
    window.location.href = '/login';
    throw new Error('No autenticado');
  }
  return res.json();
}

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
  if (user?.permisos?.asistencia_config) {
    asistCargarEmpleadosSelect();
  }
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
    const data = await asistFetchJson(`${AAPI}/embajadores?activo=${inactivos}`);
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
    const data = await asistFetchJson(`${AAPI}/embajadores?activo=1`);
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
  document.querySelectorAll('.emp-cargo-cb').forEach(cb => cb.checked = false);
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
  const data = await asistFetchJson(`${AAPI}/embajadores/${id}`);
  const e = data.embajador || data.empleado; if (!e) return;
  document.getElementById('empFormTitulo').textContent = `Ficha Embajador: ${e.nombre_completo}`;
  document.getElementById('empId').value        = e.id;
  document.getElementById('empTipoDoc').value   = e.tipo_doc;
  document.getElementById('empDocumento').value = e.documento;
  document.getElementById('empNombre').value    = e.nombre;
  document.getElementById('empApellido').value  = e.apellido;
  
  const selectedCargos = (e.cargo || '').split(',').map(s => s.trim()).filter(Boolean);
  document.querySelectorAll('.emp-cargo-cb').forEach(cb => {
    cb.checked = selectedCargos.includes(cb.value);
  });

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
  
  const selectedCargos = Array.from(document.querySelectorAll('.emp-cargo-cb:checked')).map(cb => cb.value);
  formData.append('cargo',       selectedCargos.join(', '));

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
    const data    = await asistFetchJson(`${AAPI}/registros${qs}`);
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
    const d   = await asistFetchJson(`${AAPI}/registros?desde=2020-01-01&hasta=2030-12-31`);
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
    const data = await asistFetchJson(`${AAPI}/sueldos?anio=${anio}&mes=${mes}&quincena=${quincena}&_=${Date.now()}`, { cache: 'no-store' });
    window._sueldosData = data;
    if (!data.resultados?.length) { t.innerHTML = '<p class="text-center text-muted" style="padding:30px">Sin embajadores activos</p>'; return; }
    const p = data.periodo;

    t.innerHTML = `
      <div style="padding:14px 20px;border-bottom:1px solid var(--border);font-size:.85em;color:var(--text-muted)">
        Período: <strong>${p.desde}</strong> al <strong>${p.hasta}</strong> &nbsp;•&nbsp; Valor día: <strong>${aFmt(data.valorDia)}</strong>
        &nbsp;•&nbsp; Valor hora: <strong>${aFmt(data.valorHora)}</strong>
        &nbsp;•&nbsp; Horas parciales desde <strong>${data.baseHoraParcial || '07:00'}</strong>
      </div>
      <table class="data-table asistencia-sueldos-table" style="font-size:.78em;width:100%">
        <thead><tr>
          <th class="asistencia-sueldos-empleado" style="padding:6px 3px">Embajador</th>
          <th title="Dias trabajados" style="padding:6px 2px;text-align:center">Días</th>
          <th title="Horas trabajadas en jornadas menores a 8 horas" style="padding:6px 2px;text-align:center">Horas</th>
          <th title="Dias adicionales por semana completa" style="padding:6px 2px;text-align:center">Adic</th>
          <th title="Dias feriados trabajados" style="padding:6px 2px;text-align:center">Fer</th>
          <th title="Dia Proporcional" style="padding:6px 2px;text-align:center">Día Prop</th>
          <th title="Dias descansado" style="padding:6px 2px;text-align:center">Desc</th>
          <th title="Faltas/Descuento" style="padding:6px 2px;text-align:center">Faltas</th>
          <th title="Tardanzas de la quincena" style="padding:6px 2px;text-align:center">Tard</th>
          <th title="Descuento por ONP" style="padding:6px 2px;text-align:center">ONP</th>
          <th title="Premio adicional" style="padding:6px 2px;text-align:center">Bono</th>
          <th title="Prestamo en quincena" style="padding:6px 2px;text-align:center">Prést</th>
          <th title="Total final" style="padding:6px 2px;text-align:center">SUELDO</th>
          <th class="asistencia-sueldos-nota" title="Nota" style="padding:6px 2px;text-align:center">Nota</th>
          <th style="padding:6px 2px;text-align:center">Imprimir</th>
        </tr></thead>
        <tbody>${data.resultados.map(r => {
          const empName = r.emp.nombre_completo || '';
          const empCargo = r.emp.cargo || '';
          return `<tr data-empid="${r.emp.id}">
          <td class="asistencia-sueldos-empleado" style="white-space:nowrap;padding:4px 3px">
            <span onclick="asistAbrirModalCalendario(${r.emp.id},'${p.desde}','${p.hasta}')"
               style="text-decoration:none;color:var(--text-light);cursor:pointer">
              <strong>${empName}</strong>
            </span>
            <br><span style="color:var(--text-muted);font-size:.72em">${empCargo}</span>
          </td>
          <td style="text-align:center;white-space:nowrap;padding:4px 2px">${r.dias_trabajados}</td>
          <td style="text-align:center;white-space:nowrap;padding:4px 2px;color:var(--info)">${r.horas_trabajadas > 0 ? r.horas_trabajadas : '—'}</td>
          <td style="text-align:center;color:var(--success);white-space:nowrap;padding:4px 2px">${r.diasAdicionales}</td>
          <td style="text-align:center;white-space:nowrap;padding:4px 2px;color:var(--info)">${r.feriados || 0}</td>
          <td style="text-align:center;white-space:nowrap;padding:4px 2px;color:var(--info);font-size:.92em">${(r.dom_monto || 0) > 0 ? aFmt(r.dom_monto) : '—'}</td>
          <td style="text-align:center;white-space:nowrap;padding:4px 2px;color:var(--text-muted)">${r.descansos}</td>
          <td style="text-align:center;color:var(--danger);white-space:nowrap;padding:4px 2px">
            ${r.faltas}<br><small>(${aFmt(r.faltas_monto)})</small>
          </td>
          <td style="text-align:center;color:var(--warning);white-space:nowrap;padding:4px 2px">
            ${r.tardanza_count}<br><small>(${aFmt(r.tardanza_monto)})</small>
          </td>
          <td style="color:var(--danger);white-space:nowrap;padding:4px 2px;text-align:center">${r.onp_monto > 0 ? aFmt(r.onp_monto) : '—'}</td>
          <td style="text-align:center;white-space:nowrap;padding:4px 2px;color:var(--success)">${r.bono > 0 ? aFmt(r.bono) : '—'}</td>
          <td style="text-align:center;white-space:nowrap;padding:4px 2px;color:var(--danger)">${r.prestamo > 0 ? aFmt(r.prestamo) : '—'}</td>
          <td style="text-align:center;white-space:nowrap;padding:4px 2px"><strong style="color:${r.sueldo >= 0 ? 'var(--success)' : 'var(--danger)'};font-size:.9em">${aFmt(r.sueldo)}</strong></td>
          <td class="asistencia-sueldos-nota" style="padding:4px 2px;font-size:.75em;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${(r.nota||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') || '—'}</td>
          <td style="text-align:center;white-space:nowrap;padding:4px 2px">
            <button class="btn btn-secondary" style="font-size:.72em;padding:4px 8px;min-width:66px" onclick="asistImprimirBoleta(${r.emp.id},'${p.desde}','${p.hasta}')">🖨 Imprimir</button>
          </td>
        </tr>`;
        }).join('')}</tbody>
      </table>`;
  } catch (e) { t.innerHTML = `<p class="text-center text-muted" style="padding:30px">Error: ${e.message}</p>`; }
}

// ── Modal calendario sueldos ─────────────────────────────────────

let _sueldoCalData = null; // datos del empleado actual en el modal

function asistCerrarModalCalendario() {
  document.getElementById('sueldoCalModal').classList.add('hide');
  _sueldoCalData = null;
  asistCargarSueldos();
}

async function asistAbrirModalCalendario(empId, desde, hasta) {
  const overlay = document.getElementById('sueldoCalModal');
  const body = document.getElementById('sueldoCalBody');
  const editor = document.getElementById('sueldoCalEditorGrid');
  overlay.classList.remove('hide');
  body.innerHTML = '<p class="text-center text-muted" style="padding:30px">Cargando...</p>';
  editor.innerHTML = '';

  try {
    // Obtener datos del empleado desde la tabla ya cargada
    const sueldosData = window._sueldosData;
    const empData = sueldosData?.resultados?.find(r => r.emp.id === empId);
    if (!empData) throw new Error('No se encontraron datos del empleado');

    document.getElementById('sueldoCalTitulo').textContent = `📅 ${empData.emp.nombre_completo}`;
    document.getElementById('sueldoCalSubtitulo').textContent = `${empData.emp.cargo || '—'} • ${desde} al ${hasta}`;

    // Obtener data del mes completo para el calendario
    // Extraer el mes/año de desde
    const desdeParts = desde.split('-');
    const anioCal = parseInt(desdeParts[0], 10);
    const mesCal = parseInt(desdeParts[1], 10);
    const ultDia = new Date(anioCal, mesCal, 0).getDate();
    const mesDesde = `${anioCal}-${String(mesCal).padStart(2, '0')}-01`;
    const mesHasta = `${anioCal}-${String(mesCal).padStart(2, '0')}-${String(ultDia).padStart(2, '0')}`;

    // Llamar al endpoint de boleta con el mes completo
    const boletaRes = await fetch(`${AAPI}/sueldos/boleta?emp_id=${empId}&desde=${mesDesde}&hasta=${mesHasta}&_=${Date.now()}`);
    const boleta = await boletaRes.json();
    if (!boleta.ok) throw new Error(boleta.error || 'Error al cargar data');

    _sueldoCalData = { empData, boleta, empId, desde, hasta };

    // Renderizar calendario
    asistRenderCalendario(boleta, empData, desde, hasta);

    // Renderizar editor de campos
    asistRenderEditorModal(empData);
  } catch (e) {
    body.innerHTML = `<p class="text-center text-danger" style="padding:30px">Error: ${e.message}</p>`;
  }
}

function asistRenderCalendario(boleta, empData, qDesde, qHasta) {
  const body = document.getElementById('sueldoCalBody');
  const { registros, descansosFechas, feriadosFechas, noContableFechas } = boleta;
  const fechasDescanso = new Set((descansosFechas || []).filter(f => typeof f === 'string'));
  const fechasFeriado = new Set((feriadosFechas || []).filter(f => typeof f === 'string'));
  const fechasNoContable = new Set((noContableFechas || []).filter(f => typeof f === 'string'));
  const registrosPorFecha = new Map(registros.map(r => [r.fecha, r]));

  // Mostrar el mes completo: determinar primer y último día del mes
  const fDesde = new Date(qDesde + 'T12:00:00');
  const fHasta = new Date(qHasta + 'T12:00:00');
  const anio = fDesde.getFullYear();
  const mes = fDesde.getMonth();
  const ultimoDia = new Date(anio, mes + 1, 0).getDate();
  const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const hoy = new Date();
  const hoyStr = hoy.toISOString().slice(0, 10);

  // Calcular auto-descansos para el mes completo (misma lógica que impresión)
  const autoDescansos = asistCalcularAutoDescansosMes({
    anio,
    mes,
    ultimoDia,
    registrosPorFecha,
    fechasDescanso,
    fechasFeriado,
    fechasNoContable
  });

  // Obtener día de la semana del día 1 (0=Dom, 1=Lun, ... 6=Sáb)
  const primerDiaSem = (new Date(anio, mes, 1).getDay() + 6) % 7; // 0=Lun, 6=Dom

  // Construir celdas del día
  const makeCelda = (dia) => {
    const fecha = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const reg = registrosPorFecha.get(fecha);
    const esNoContable = fechasNoContable.has(fecha);
    const esFeriado = !esNoContable && fechasFeriado.has(fecha);
    const esDescanso = fechasDescanso.has(fecha);
    const esAutoDesc = !esNoContable && !esFeriado && !esDescanso && autoDescansos.has(fecha);
    const esFuturo = fecha > hoyStr;
    const esHoy = fecha === hoyStr;
    // Determinar si este día está dentro de la quincena seleccionada
    const qDesdeDia = fDesde.getDate();
    const qHastaDia = fHasta.getDate();
    const enQuincena = dia >= qDesdeDia && dia <= qHastaDia;
    // Día de corte: 15 (entre 1ra y 2da quincena)
    const esCorte = dia === 15;

    let cls = '';
    if (!enQuincena) cls += ' sueldo-cal-fuera';
    if (esFuturo) cls += ' sueldo-cal-futuro';
    if (esNoContable) cls += ' sueldo-cal-no-contable';
    if (esFeriado) cls += ' sueldo-cal-feriado';
    if (esDescanso || esAutoDesc) cls += ' sueldo-cal-descanso';
    if (!reg && !esNoContable && !esFeriado && !esDescanso && !esAutoDesc && !esFuturo) cls += ' sueldo-cal-falta';
    if (esHoy) cls += ' sueldo-cal-hoy';
    if (esCorte) cls += ' sueldo-cal-corte';

    let contenido = `<div class="sueldo-cal-num">${dia}</div>`;
    if (esNoContable) {
      contenido += `<div class="sueldo-cal-estado" style="color:#7c3aed">No contable</div>`;
    } else if (esFeriado) {
      contenido += `<div class="sueldo-cal-estado" style="color:#0369a1">Feriado</div>`;
    } else if (esDescanso) {
      contenido += `<div class="sueldo-cal-estado descanso">Descanso</div>`;
    } else if (esAutoDesc) {
      contenido += `<div class="sueldo-cal-estado descanso">Descanso*</div>`;
    } else if (reg) {
      const entrada = reg.hora_entrada || '';
      const salida = reg.hora_salida || '';
      const esTarde = reg.tarde;
      const jornada = reg.jornada || {};
      const horas = parseFloat(jornada.horas || 0);

      contenido += `<div class="sueldo-cal-hora${esTarde ? ' sueldo-cal-tarde' : ''}">${entrada || '—'}</div>`;
      contenido += `<div class="sueldo-cal-hora">${salida || '—'}</div>`;
      if (esTarde) {
        contenido += `<div class="sueldo-cal-estado tarde">Tardanza</div>`;
      } else {
        contenido += `<div class="sueldo-cal-estado ok">✓</div>`;
      }
      if (horas > 0 && horas < 8) {
        contenido += `<div class="sueldo-cal-estado parcial">${horas}h</div>`;
      }
    } else if (!esFuturo && !esNoContable && !esFeriado && !esDescanso && !esAutoDesc) {
      contenido += `<div class="sueldo-cal-estado falta">Falta</div>`;
    }

    // Doble clic para marcar estado diario (solo en días de la quincena actual)
    const estadoActual = esNoContable
      ? 'no_contable'
      : esFeriado
        ? 'feriado'
        : ((esDescanso || esAutoDesc) ? 'descanso' : 'falta');
    const dblClickHandler = enQuincena
      ? `asistAbrirMiniModalDia('${fecha}', '${estadoActual}');event.stopPropagation()`
      : '';

    return `<td class="${cls}"${dblClickHandler ? ` ondblclick="${dblClickHandler}"` : ''} style="cursor:${enQuincena ? 'pointer' : 'default'}">${contenido}</td>`;
  };

  // Generar filas del calendario del mes completo
  let filas = '';
  let celdas = '';
  // Celdas vacías antes del día 1
  for (let i = 0; i < primerDiaSem; i++) {
    celdas += '<td></td>';
  }
  for (let d = 1; d <= ultimoDia; d++) {
    celdas += makeCelda(d);
    if ((primerDiaSem + d) % 7 === 0) {
      filas += `<tr>${celdas}</tr>`;
      celdas = '';
    }
  }
  if (celdas) {
    filas += `<tr>${celdas}</tr>`;
  }

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const label = fDesde.getDate() === 1 ? `1° Quincena` : `2° Quincena`;

  const html = `
    <div style="text-align:center;font-size:.78em;color:var(--text-muted);margin-bottom:6px">
      ${label} — ${meses[mes]} ${anio}
    </div>
    <table class="sueldo-cal-grid">
      <thead><tr>${DIAS.map(d => `<th>${d}</th>`).join('')}</tr></thead>
      <tbody>${filas}</tbody>
    </table>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px;font-size:.62em;color:var(--text-muted)">
      <span>✓ Asistencia</span>
      <span style="color:var(--warning)">⚠ Tardanza</span>
      <span style="color:var(--danger)">✗ Falta</span>
      <span style="color:#2f855a">● Descanso</span>
      <span style="color:#166534">● Descanso* (1°/semana)</span>
      <span style="color:#0369a1">◆ Feriado</span>
      <span style="color:#7c3aed">◆ No contable</span>
      <span style="color:var(--info)">⏱ &lt;8h</span>
      <span style="font-style:italic">↔ doble clic</span>
    </div>
    <div class="sueldo-cal-mini-overlay hide" id="sueldoMiniModal" onclick="if(event.target===this) asistCerrarMiniModalDia()">
      <div class="sueldo-cal-mini-card" id="sueldoMiniCard">
        <div style="font-size:.8em;color:var(--text-muted);margin-bottom:8px" id="sueldoMiniFecha">—</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-sm" style="background:rgba(47,133,90,0.2);color:#2f855a;border:1px solid #2f855a;padding:6px 14px"
            id="sueldoMiniBtnDescanso" onclick="asistMarcarDiaEstado('descanso')">🌴 Descanso</button>
          <button class="btn btn-sm" style="background:rgba(197,48,48,0.15);color:#c53030;border:1px solid #c53030;padding:6px 14px"
            id="sueldoMiniBtnFalta" onclick="asistMarcarDiaEstado('falta')">✗ Falta</button>
          <button class="btn btn-sm" style="background:rgba(3,105,161,0.14);color:#0369a1;border:1px solid #0369a1;padding:6px 14px"
            id="sueldoMiniBtnFeriado" onclick="asistMarcarDiaEstado('feriado')">🎉 Feriado</button>
          <button class="btn btn-sm" style="background:rgba(124,58,237,0.14);color:#7c3aed;border:1px solid #7c3aed;padding:6px 14px"
            id="sueldoMiniBtnNoContable" onclick="asistMarcarDiaEstado('no_contable')">🧾 No contable</button>
          <button class="btn btn-sm btn-secondary" style="padding:6px 14px" onclick="asistCerrarMiniModalDia()">Cancelar</button>
        </div>
      </div>
    </div>
  `;
  body.innerHTML = html;
}

function asistCalcularAutoDescansosMes({ anio, mes, ultimoDia, registrosPorFecha, fechasDescanso, fechasFeriado = new Set(), fechasNoContable = new Set() }) {
  // Regla crítica: esta función debe ser la única fuente para auto-descanso.
  // La usan calendario y boleta impresa para evitar desalineaciones.
  const autoDescansos = new Set();
  const semanas = {};

  for (let d = 1; d <= ultimoDia; d++) {
    const fecha = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const fd = new Date(fecha + 'T12:00:00');
    const ws = new Date(fd);
    ws.setDate(fd.getDate() - ((fd.getDay() + 6) % 7));
    const key = ws.toISOString().slice(0, 10);
    if (!semanas[key]) semanas[key] = { fechas: [], conTrabajo: false };
    semanas[key].fechas.push(fecha);
    if (registrosPorFecha.has(fecha)) semanas[key].conTrabajo = true;
  }

  for (const semana of Object.values(semanas)) {
    if (!semana.conTrabajo) continue;
    let primerDescanso = false;
    for (const fecha of semana.fechas) {
      if (fechasNoContable.has(fecha) || fechasFeriado.has(fecha)) continue;
      if (registrosPorFecha.has(fecha) || fechasDescanso.has(fecha)) continue;
      if (!primerDescanso) {
        autoDescansos.add(fecha);
        primerDescanso = true;
      }
    }
  }

  return autoDescansos;
}

// ── Mini modal para marcar estado por día ─────────────────────────

let _sueldoMiniFechaActual = null;

function asistAbrirMiniModalDia(fecha, estadoActual) {
  _sueldoMiniFechaActual = fecha;
  const overlay = document.getElementById('sueldoMiniModal');
  if (!overlay) return;
  overlay.classList.remove('hide');
  const f = new Date(fecha + 'T12:00:00');
  const diaSem = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][f.getDay()];
  document.getElementById('sueldoMiniFecha').textContent = `${diaSem} ${f.getDate()}`;

  const estado = String(estadoActual || 'falta');
  const btnD = document.getElementById('sueldoMiniBtnDescanso');
  const btnF = document.getElementById('sueldoMiniBtnFalta');
  const btnFe = document.getElementById('sueldoMiniBtnFeriado');
  const btnNc = document.getElementById('sueldoMiniBtnNoContable');
  if (btnD) btnD.style.opacity = estado === 'descanso' ? '1' : '0.45';
  if (btnF) btnF.style.opacity = estado === 'falta' ? '1' : '0.45';
  if (btnFe) btnFe.style.opacity = estado === 'feriado' ? '1' : '0.45';
  if (btnNc) btnNc.style.opacity = estado === 'no_contable' ? '1' : '0.45';
}

function asistCerrarMiniModalDia() {
  const overlay = document.getElementById('sueldoMiniModal');
  if (overlay) overlay.classList.add('hide');
  _sueldoMiniFechaActual = null;
}

async function asistMarcarDiaEstado(estado) {
  if (!_sueldoCalData || !_sueldoMiniFechaActual) return;
  const { empId, desde, hasta, boleta } = _sueldoCalData;

  const descansosActuales = new Set((boleta.descansosFechas || []).filter(f => typeof f === 'string'));
  const feriadosActuales = new Set((boleta.feriadosFechas || []).filter(f => typeof f === 'string'));
  const noContableActuales = new Set((boleta.noContableFechas || []).filter(f => typeof f === 'string'));

  const estadoActual = noContableActuales.has(_sueldoMiniFechaActual)
    ? 'no_contable'
    : feriadosActuales.has(_sueldoMiniFechaActual)
      ? 'feriado'
      : descansosActuales.has(_sueldoMiniFechaActual)
        ? 'descanso'
        : 'falta';

  if (estado === estadoActual) {
    asistCerrarMiniModalDia();
    return;
  }

  descansosActuales.delete(_sueldoMiniFechaActual);
  feriadosActuales.delete(_sueldoMiniFechaActual);
  noContableActuales.delete(_sueldoMiniFechaActual);

  if (estado === 'descanso') descansosActuales.add(_sueldoMiniFechaActual);
  if (estado === 'feriado') feriadosActuales.add(_sueldoMiniFechaActual);
  if (estado === 'no_contable') noContableActuales.add(_sueldoMiniFechaActual);

  const payload = {};
  payload[empId] = [...descansosActuales].sort();
  const payloadFeriados = {};
  payloadFeriados[empId] = [...feriadosActuales].sort();
  const payloadNoContable = {};
  payloadNoContable[empId] = [...noContableActuales].sort();

  const btnDesc = document.getElementById('sueldoMiniBtnDescanso');
  const btnFal = document.getElementById('sueldoMiniBtnFalta');
  const btnFer = document.getElementById('sueldoMiniBtnFeriado');
  const btnNc = document.getElementById('sueldoMiniBtnNoContable');
  if (btnDesc) btnDesc.disabled = true;
  if (btnFal) btnFal.disabled = true;
  if (btnFer) btnFer.disabled = true;
  if (btnNc) btnNc.disabled = true;

  try {
    const res = await fetch(`${AAPI}/sueldos/descansos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        periodo_desde: desde,
        periodo_hasta: hasta,
        descansos: payload,
        feriados: payloadFeriados,
        no_contable: payloadNoContable
      })
    });
    const data = await res.json();
    if (data.ok) {
      // Refrescar el calendario con los nuevos datos
      _sueldoCalData.boleta.descansosFechas = [...descansosActuales].sort();
      _sueldoCalData.boleta.feriadosFechas = [...feriadosActuales].sort();
      _sueldoCalData.boleta.noContableFechas = [...noContableActuales].sort();
      asistCerrarMiniModalDia();
      asistRenderCalendario(_sueldoCalData.boleta, _sueldoCalData.empData, _sueldoCalData.desde, _sueldoCalData.hasta);
    } else {
      alert(data.error || 'Error al guardar');
    }
  } catch (e) {
    alert(e.message || 'Error de red');
  } finally {
    if (btnDesc) btnDesc.disabled = false;
    if (btnFal) btnFal.disabled = false;
    if (btnFer) btnFer.disabled = false;
    if (btnNc) btnNc.disabled = false;
  }
}

function asistRenderEditorModal(empData) {
  const editor = document.getElementById('sueldoCalEditorGrid');
  const {
    dias_trabajados = 0, dias_trabajados_auto, dias_trabajados_override,
    feriados = 0, faltas = 0, faltas_auto, faltas_manual,
    descansos = 0, descansos_auto, descansos_manual,
    valor_dia = 0, faltas_descuento_unitario = 20,
    bono = 0, prestamo = 0,
    dom_monto = 0, diasAdicionales = 0,
    onp_activo = false, onp_override,
    diasAdicionalesOverride, dom_monto_override
  } = empData;

  const onpChecked = onp_override !== null && onp_override !== undefined ? !!onp_override : onp_activo;
  const domVal = dom_monto_override !== null && dom_monto_override !== undefined ? dom_monto_override : dom_monto;
  const adicVal = diasAdicionalesOverride !== null && diasAdicionalesOverride !== undefined ? diasAdicionalesOverride : diasAdicionales;
  const diasTrabVal = dias_trabajados_override !== null && dias_trabajados_override !== undefined
    ? dias_trabajados_override
    : (dias_trabajados_auto ?? dias_trabajados ?? 0);
  const faltasVal = faltas_manual !== null && faltas_manual !== undefined
    ? faltas_manual
    : (faltas_auto ?? faltas ?? 0);
  const descansosVal = descansos_manual !== null && descansos_manual !== undefined
    ? descansos_manual
    : (descansos_auto ?? descansos ?? 0);
  const valorDia = +valor_dia || 0;
  const faltaUnit = +faltas_descuento_unitario || 20;

  editor.innerHTML = `
    <div class="sueldo-cal-editor-item">
      <label>Días trabajados</label>
      <input type="number" id="sueldoModalDiasTrab" min="0" step="1" value="${diasTrabVal}">
      <small id="sueldoModalDiasTrabMonto">Monto: ${aFmt(diasTrabVal * valorDia)}</small>
    </div>
    <div class="sueldo-cal-editor-item">
      <label>Feriados</label>
      <input type="number" id="sueldoModalFeriados" min="0" step="1" value="${feriados}">
      <small id="sueldoModalFeriadosMonto">Monto: ${aFmt(feriados * valorDia)}</small>
    </div>
    <div class="sueldo-cal-editor-item">
      <label>Descansos</label>
      <input type="number" id="sueldoModalDescansos" min="0" step="1" value="${descansosVal}">
      <small id="sueldoModalDescansosMonto">Monto: ${aFmt(descansosVal * valorDia)}</small>
    </div>
    <div class="sueldo-cal-editor-item">
      <label>Faltas</label>
      <input type="number" id="sueldoModalFaltas" min="0" step="1" value="${faltasVal}">
      <small id="sueldoModalFaltasMonto">Descuento: -${aFmt(faltasVal * faltaUnit)}</small>
    </div>
    <div class="sueldo-cal-editor-item">
      <label>ONP</label>
      <input type="checkbox" id="sueldoModalOnp" ${onpChecked ? 'checked' : ''}>
    </div>
    <div class="sueldo-cal-editor-item">
      <label>Bono (S/.)</label>
      <input type="number" id="sueldoModalBono" min="0" step="0.01" value="${+bono > 0 ? (+bono).toFixed(2) : ''}">
    </div>
    <div class="sueldo-cal-editor-item">
      <label>Préstamo (S/.)</label>
      <input type="number" id="sueldoModalPrestamo" min="0" step="0.01" value="${+prestamo > 0 ? (+prestamo).toFixed(2) : ''}">
    </div>
    <div class="sueldo-cal-editor-item">
      <label>Día Proporcional (S/.)</label>
      <input type="number" id="sueldoModalDom" min="0" step="0.01" value="${+domVal > 0 ? (+domVal).toFixed(2) : ''}">
    </div>
    <div class="sueldo-cal-editor-item">
      <label>Días Adicionales</label>
      <input type="number" id="sueldoModalAdic" min="0" step="1" value="${adicVal}">
    </div>
  `;

  const refreshMontos = () => {
    const diasTrabNow = parseInt(document.getElementById('sueldoModalDiasTrab')?.value || '0', 10) || 0;
    const ferNow = parseInt(document.getElementById('sueldoModalFeriados')?.value || '0', 10) || 0;
    const descNow = parseInt(document.getElementById('sueldoModalDescansos')?.value || '0', 10) || 0;
    const faltNow = parseInt(document.getElementById('sueldoModalFaltas')?.value || '0', 10) || 0;
    const diasTrabMontoEl = document.getElementById('sueldoModalDiasTrabMonto');
    const ferMontoEl = document.getElementById('sueldoModalFeriadosMonto');
    const descMontoEl = document.getElementById('sueldoModalDescansosMonto');
    const faltMontoEl = document.getElementById('sueldoModalFaltasMonto');
    if (diasTrabMontoEl) diasTrabMontoEl.textContent = `Monto: ${aFmt(diasTrabNow * valorDia)}`;
    if (ferMontoEl) ferMontoEl.textContent = `Monto: ${aFmt(ferNow * valorDia)}`;
    if (descMontoEl) descMontoEl.textContent = `Monto: ${aFmt(descNow * valorDia)}`;
    if (faltMontoEl) faltMontoEl.textContent = `Descuento: -${aFmt(faltNow * faltaUnit)}`;
  };

  ['sueldoModalDiasTrab', 'sueldoModalFeriados', 'sueldoModalDescansos', 'sueldoModalFaltas'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', refreshMontos);
  });
}

async function asistGuardarAjusteModal() {
  if (!_sueldoCalData) return;
  const { empData, empId, desde, hasta } = _sueldoCalData;

  const feriados = parseInt(document.getElementById('sueldoModalFeriados')?.value || '0', 10) || 0;
  const diasTrab = parseInt(document.getElementById('sueldoModalDiasTrab')?.value || '0', 10) || 0;
  const faltas = parseInt(document.getElementById('sueldoModalFaltas')?.value || '0', 10) || 0;
  const descansos = parseInt(document.getElementById('sueldoModalDescansos')?.value || '0', 10) || 0;
  const onpChecked = document.getElementById('sueldoModalOnp')?.checked || false;
  const bono = parseFloat(document.getElementById('sueldoModalBono')?.value || '0') || 0;
  const prestamo = parseFloat(document.getElementById('sueldoModalPrestamo')?.value || '0') || 0;
  const domMonto = parseFloat(document.getElementById('sueldoModalDom')?.value || '0') || 0;
  const adic = parseInt(document.getElementById('sueldoModalAdic')?.value || '0', 10) || 0;

  const onpOriginal = empData.onp_override !== null && empData.onp_override !== undefined ? !!empData.onp_override : empData.onp_activo;
  const domOriginal = empData.dom_monto_override !== null && empData.dom_monto_override !== undefined ? empData.dom_monto_override : empData.dom_monto;
  const adicOriginal = empData.diasAdicionalesOverride !== null && empData.diasAdicionalesOverride !== undefined ? empData.diasAdicionalesOverride : empData.diasAdicionales;

  const payload = {
    empleado_id: empId,
    periodo_desde: desde,
    periodo_hasta: hasta,
    dias_trabajados_override: diasTrab,
    feriados,
    faltas_override: faltas,
    descansos_override: descansos,
    prestamo,
    bono,
    onp_override: onpChecked,
    dom_monto_override: domMonto,
    dias_adicionales_override: adic,
    tardanzas_override: null,
    nota: empData.nota || ''
  };

  const btn = document.getElementById('sueldoCalGuardarBtn');
  const txtOriginal = btn?.textContent || '💾 Guardar';
  if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }

  try {
    const res = await fetch(`${AAPI}/sueldos/ajuste`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.ok) {
      asistCerrarModalCalendario();
      asistCargarSueldos();
    } else {
      alert(data.error || 'No se pudo guardar.');
    }
  } catch (e) {
    alert(e.message || 'Error de red');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = txtOriginal; }
  }
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
  const data = await fetch(`${AAPI}/sueldos/boleta?emp_id=${empId}&desde=${desde}&hasta=${hasta}&_=${Date.now()}`).then(r => r.json());
  if (!data.ok) { alert('Error al cargar boleta'); return; }

  // Para impresión: montos de quincena + calendario con contexto de mes completo.
  // Esto evita que cambie la clasificación descanso/falta entre modal e impresión.
  const baseFecha = new Date(`${desde}T12:00:00`);
  const anioMes = baseFecha.getFullYear();
  const mesNum = baseFecha.getMonth() + 1;
  const ultimoDiaMes = new Date(anioMes, mesNum, 0).getDate();
  const mesDesde = `${anioMes}-${String(mesNum).padStart(2, '0')}-01`;
  const mesHasta = `${anioMes}-${String(mesNum).padStart(2, '0')}-${String(ultimoDiaMes).padStart(2, '0')}`;

  let dataMes = data;
  try {
    const respMes = await fetch(`${AAPI}/sueldos/boleta?emp_id=${empId}&desde=${mesDesde}&hasta=${mesHasta}&_=${Date.now()}`);
    const jsonMes = await respMes.json();
    if (jsonMes?.ok) dataMes = jsonMes;
  } catch {}

  const { emp, ajuste, valorDia, valorHora, descTardanza, periodo, resumen } = data;
  const registrosCalendario = Array.isArray(dataMes?.registros) ? dataMes.registros : [];
  const descansosFechasCalendario = Array.isArray(dataMes?.descansosFechas) ? dataMes.descansosFechas : [];
  const feriadosFechasCalendario = Array.isArray(dataMes?.feriadosFechas) ? dataMes.feriadosFechas : [];
  const noContableFechasCalendario = Array.isArray(dataMes?.noContableFechas) ? dataMes.noContableFechas : [];

  // ── Extraer datos ──
  const diasTrab   = +resumen?.diasTrabajados || 0;
  const horasTrab  = +resumen?.horasTrabajadas || 0;
  const diasAdic   = +resumen?.diasAdicionales || 0;
  const descansos  = +resumen?.descansos || 0;
  const faltas     = +resumen?.faltas || 0;
  const faltasMonto= +resumen?.faltasMonto || 0;
  const tardCount  = +resumen?.tardanzaCount || 0;
  const tardMonto  = +resumen?.tardanzaMonto || 0;
  const domMonto   = +resumen?.domMonto || 0;
  const onpMonto   = +resumen?.onpMonto || 0;
  const feriados   = +ajuste?.feriados  || 0;
  const prestamo   = +ajuste?.prestamo  || 0;
  const bono       = +ajuste?.bono      || 0;
  const nota       = ajuste?.nota       || '';

  const periodoDesde = periodo?.desde || desde;
  const periodoHasta = periodo?.hasta || hasta;
  const fDesde = new Date(periodoDesde + 'T12:00:00');
  const fHasta = new Date(periodoHasta + 'T12:00:00');
  const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const DIAS  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const mesNombre = MESES[fDesde.getMonth()];
  const anio      = fDesde.getFullYear();
  const qNum      = fDesde.getDate() <= 15 ? '1ª' : '2ª';
  const hoy = new Date();
  const fechaImpresion = `${hoy.getDate()} de ${MESES[hoy.getMonth()]} de ${hoy.getFullYear()}`;
  const fmt = n => 'S/. ' + (+n || 0).toFixed(2);

  // ── Calendario grid (mismo estilo que el modal) ──
  const fechasDescanso = new Set((descansosFechasCalendario || []).filter(f => typeof f === 'string'));
  const fechasFeriado = new Set((feriadosFechasCalendario || []).filter(f => typeof f === 'string'));
  const fechasNoContable = new Set((noContableFechasCalendario || []).filter(f => typeof f === 'string'));
  const registrosPorFecha = new Map((registrosCalendario || []).map(r => [r.fecha, r]));
  const qDesde = new Date(desde + 'T12:00:00');
  const qHasta = new Date(hasta + 'T12:00:00');
  const desdeDia = qDesde.getDate();
  const hastaDia = qHasta.getDate();
  const anioCal = qDesde.getFullYear();
  const mesCal = qDesde.getMonth();

  // Auto-descanso del mes completo para no romper semanas que cruzan quincena
  const ultimoDiaMesCal = new Date(anioCal, mesCal + 1, 0).getDate();
  const autoDescansosPrint = asistCalcularAutoDescansosMes({
    anio: anioCal,
    mes: mesCal,
    ultimoDia: ultimoDiaMesCal,
    registrosPorFecha,
    fechasDescanso,
    fechasFeriado,
    fechasNoContable
  });

  let calFilas = '';
  let filaCal = '';
  let col = 0;
  const primerDiaSemCal = (new Date(anioCal, mesCal, desdeDia).getDay() + 6) % 7; // 0=Lun..6=Dom

  for (let i = 0; i < primerDiaSemCal; i++) {
    filaCal += '<td class="pd"></td>';
    col++;
  }

  for (let d = desdeDia; d <= hastaDia; d++) {
    const fecha = `${anioCal}-${String(mesCal + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const reg = registrosPorFecha.get(fecha);
    const esNoContable = fechasNoContable.has(fecha);
    const esFeriado = !esNoContable && fechasFeriado.has(fecha);
    const esDesc = fechasDescanso.has(fecha);
    const esAutoDescPrint = !esNoContable && !esFeriado && !esDesc && autoDescansosPrint.has(fecha);
    const esFut = fecha > hoy.toISOString().slice(0, 10);

    let txt = `<div class="pn">${d}</div>`;
    let cls = 'pd';
    if (esNoContable) { txt += '<div class="ps" style="color:#7c3aed">No contable</div>'; }
    else if (esFeriado) { txt += '<div class="ps" style="color:#0369a1">Feriado</div>'; }
    else if (esDesc || esAutoDescPrint) { txt += '<div class="ps pd-d">Descanso</div>'; cls += ' pd-r'; }
    else if (reg) {
      const et = reg.hora_entrada || '—';
      const st = reg.hora_salida || '—';
      const tr = reg.tarde;
      const hrs = parseFloat(reg.jornada?.horas || 0);
      txt += `<div class="ph ${tr ? 'ph-t' : ''}">${et}</div><div class="ph">${st}</div>`;
      if (tr) txt += '<div class="ps ps-t">Tardanza</div>';
      else txt += '<div class="ps ps-o">✓</div>';
      if (hrs > 0 && hrs < 8) txt += `<div class="ps ps-p">${hrs}h</div>`;
    } else if (!esFut) { txt += '<div class="ps ps-f">Falta</div>'; cls += ' pd-f'; }

    filaCal += `<td class="${cls}">${txt}</td>`;
    col++;
    if (col === 7) { calFilas += `<tr>${filaCal}</tr>`; filaCal = ''; col = 0; }
  }
  if (col > 0) {
    while (col < 7) {
      filaCal += '<td class="pd"></td>';
      col++;
    }
    calFilas += `<tr>${filaCal}</tr>`;
  }

  const sueldoNeto = +resumen?.sueldo || 0;

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Boleta ${emp.nombre} ${emp.apellido}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{font-family:'Segoe UI',system-ui,Arial,sans-serif;font-size:12px;color:#1a1a2e;background:#fff}
  @page{size:A4;margin:14mm 16mm}
  @media print{.no-print{display:none!important}.wrap{padding:0;max-width:100%}}
  .wrap{max-width:780px;margin:0 auto;padding:5px 10px}

  /* Header */
  .hdr{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #1a1a2e;padding-bottom:10px;margin-bottom:12px}
  .hdr-l{display:flex;align-items:center;gap:10px}
  .hdr-l img{width:46px;height:46px;border-radius:6px;object-fit:contain;flex-shrink:0}
  .hdr-l h1{font-size:1.35em;font-weight:800;letter-spacing:.03em;text-transform:uppercase;color:#1a1a2e;line-height:1.15}
  .hdr-l p{font-size:.78em;color:#666;margin-top:1px}
  .hdr-r{text-align:right;font-size:.8em;color:#666;line-height:1.6}

  /* Barra */
  .bar{background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;padding:7px 14px;font-size:.85em;font-weight:700;letter-spacing:.05em;text-align:center;border-radius:6px;margin-bottom:12px}

  /* Info grid */
  .ig{display:grid;grid-template-columns:repeat(4,1fr);gap:2px 14px;margin-bottom:12px;background:#f8f9fc;border:1px solid #e2e6f0;border-radius:8px;padding:10px 14px}
  .ig .lbl{font-size:.7em;color:#888;text-transform:uppercase;letter-spacing:.04em;display:block}
  .ig .val{font-weight:700;font-size:.95em;color:#1a1a2e}

  /* Secciones */
  .sh{font-size:.78em;text-transform:uppercase;letter-spacing:.06em;color:#555;font-weight:700;border-bottom:2px solid #1a1a2e;padding-bottom:4px;margin-bottom:7px;margin-top:10px}
  .sh:first-of-type{margin-top:0}

  /* Calendario grid */
  table.cal{width:100%;border-collapse:collapse;margin-bottom:8px}
  table.cal th{padding:4px 3px;text-align:center;font-size:.7em;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:.04em;border-bottom:2px solid #1a1a2e;background:#f8f9fc}
  table.cal td.pd{vertical-align:top;padding:4px 3px;border:1px solid #e2e6f0;height:48px;width:14.28%;text-align:center}
  table.cal td.pd-r{background:#f0fdf4}
  table.cal td.pd-f{background:#fef2f2}
  table.cal .pn{font-weight:700;font-size:.78em;color:#1a1a2e;margin-bottom:1px}
  table.cal .ph{font-size:.65em;color:#555;line-height:1.25}
  table.cal .ph-t{color:#dc2626;font-weight:700}
  table.cal .ps{font-size:.6em;font-weight:700;margin-top:1px}
  table.cal .ps-o{color:#16a34a}
  table.cal .ps-t{color:#d97706}
  table.cal .ps-f{color:#dc2626}
  table.cal .ps-p{color:#2563eb}
  table.cal .ps-d{color:#15803d}

  /* Liquidación */
  table.liq{width:100%;border-collapse:collapse;font-size:.92em;margin-bottom:3px}
  table.liq td{padding:3px 6px}
  table.liq td:last-child{text-align:right;white-space:nowrap;font-weight:600}
  table.liq tr.i td{color:#1d4ed8}
  table.liq tr.d td{color:#b91c1c}
  table.liq tr.s td{border-top:1px solid #ccc;padding-top:5px}
  table.liq tr.t td{border-top:3px double #1a1a2e;font-weight:800;font-size:1.05em;padding-top:5px}
  table.liq tr.t td:last-child{color:#1d4ed8;font-size:1.1em}

  /* Nota */
  .nota-box{background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:6px 12px;font-size:.82em;color:#92400e;margin-bottom:10px}

  /* Firmas */
  .firmas{display:flex;justify-content:space-between;margin-top:40px;padding-top:14px;border-top:1px solid #e2e6f0;gap:40px}
  .firma{text-align:center;flex:1}
  .firma .ln{border-top:2px solid #1a1a2e;margin-top:32px;padding-top:5px;font-size:.85em;font-weight:700;color:#1a1a2e}
  .firma .lb{font-size:.72em;color:#888;margin-top:3px}
  .huella{width:70px;height:90px;border:2px solid #1a1a2e;border-radius:6px;margin:6px auto 0;background:#f8f9fc}

  /* Pie */
  .pie{text-align:center;margin-top:10px;font-size:.7em;color:#aaa;border-top:1px solid #e2e6f0;padding-top:8px}
</style></head><body>
<div class="wrap">
  <!-- Botones (solo en pantalla) -->
  <div class="no-print" style="margin-bottom:12px;display:flex;gap:8px">
    <button onclick="window.print()" style="padding:7px 18px;background:#1a1a2e;color:#fff;border:none;border-radius:5px;cursor:pointer;font-size:.9em">🖨️ Imprimir</button>
    <button onclick="window.close()" style="padding:7px 18px;background:#888;color:#fff;border:none;border-radius:5px;cursor:pointer;font-size:.9em">✕ Cerrar</button>
  </div>

  <!-- Header -->
  <div class="hdr">
    <div class="hdr-l">
      <img src="/img/logo_belu.png" alt="Belu" onerror="this.style.display='none'">
      <div>
        <h1>Belu Chicharronería</h1>
        <p>Boleta de Liquidación de Sueldo</p>
      </div>
    </div>
    <div class="hdr-r">
      <strong>${fechaImpresion}</strong><br>
      ${emp.tipo_doc}: ${emp.documento}
    </div>
  </div>

  <div class="bar">BOLETA DE PAGO — ${qNum} QUINCENA DE ${mesNombre.toUpperCase()} ${anio}</div>

  <!-- Info empleado -->
  <div class="ig">
    <div><span class="lbl">Trabajador</span><span class="val">${emp.nombre} ${emp.apellido}</span></div>
    <div><span class="lbl">Cargo</span><span class="val">${emp.cargo || '—'}</span></div>
    <div><span class="lbl">Período</span><span class="val">${periodoDesde} → ${periodoHasta}</span></div>
    <div><span class="lbl">Régimen ONP</span><span class="val">${resumen?.onpActivo !== undefined ? (resumen.onpActivo ? 'Sí (13%)' : 'No') : (emp.onp ? 'Sí (13%)' : 'No')}</span></div>
  </div>

  <!-- Calendario de asistencia -->
  <div class="sh">📅 Registro de Asistencia</div>
  <table class="cal">
    <thead><tr><th>Lun</th><th>Mar</th><th>Mié</th><th>Jue</th><th>Vie</th><th>Sáb</th><th>Dom</th></tr></thead>
    <tbody>${calFilas}</tbody>
  </table>

  <!-- Liquidación -->
  <div class="sh">💵 Liquidación de Sueldo</div>
  <table class="liq">
    <tr class="i"><td>Días trabajados (${diasTrab} × ${valorDia.toFixed(2)})</td><td>${fmt(diasTrab * valorDia)}</td></tr>
    ${diasAdic > 0 ? `<tr class="i"><td>Días adicionales (${diasAdic} × ${valorDia.toFixed(2)})</td><td>${fmt(diasAdic * valorDia)}</td></tr>` : ''}
    ${descansos > 0 ? `<tr class="i"><td>Descansos (${descansos} × ${valorDia.toFixed(2)})</td><td>${fmt(descansos * valorDia)}</td></tr>` : ''}
    ${domMonto > 0 ? `<tr class="i"><td>Día proporcional</td><td>${fmt(domMonto)}</td></tr>` : ''}
    ${horasTrab > 0 ? `<tr class="i"><td>Horas parciales (${horasTrab} × ${valorHora.toFixed(2)})</td><td>${fmt(horasTrab * valorHora)}</td></tr>` : ''}
    ${feriados > 0 ? `<tr class="i"><td>Feriados (${feriados} × ${valorDia.toFixed(2)})</td><td>${fmt(feriados * valorDia)}</td></tr>` : ''}
    <tr class="d"><td>Faltas (${faltas})</td><td>${faltasMonto > 0 ? '-' : ''}${fmt(faltasMonto)}</td></tr>
    <tr class="d"><td>Tardanzas (${tardCount})</td><td>${tardMonto > 0 ? '-' : ''}${fmt(tardMonto)}</td></tr>
    ${bono > 0 ? `<tr class="i"><td>Bono</td><td>${fmt(bono)}</td></tr>` : ''}
    ${prestamo > 0 ? `<tr class="d"><td>Préstamo</td><td>${prestamo > 0 ? '-' : ''}${fmt(prestamo)}</td></tr>` : ''}
    ${onpMonto > 0 ? `<tr class="d"><td>ONP 13%</td><td>${onpMonto > 0 ? '-' : ''}${fmt(onpMonto)}</td></tr>` : ''}
    <tr class="s"><td></td><td></td></tr>
    <tr class="t"><td>SUELDO NETO</td><td>${fmt(sueldoNeto)}</td></tr>
  </table>

  ${nota ? `<div class="nota-box"><strong>Nota:</strong> ${nota}</div>` : ''}

  <!-- Firmas -->
  <div class="firmas">
    <div class="firma">
      <div class="ln">${emp.nombre} ${emp.apellido}</div>
      <div class="lb">Firma del Trabajador</div>
    </div>
    <div class="firma">
      <div class="huella"></div>
      <div class="lb">Huella Digital</div>
    </div>
  </div>

  <div class="pie">🐷 Belu Chicharronería — Documento generado el ${fechaImpresion}</div>
</div>
</body></html>`;

  const win = window.open('', '_blank', 'width=900,height=900');
  if (!win) { alert('El navegador bloqueó la ventana emergente. Permití popups para este sitio.'); return; }
  win.document.write(html);
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

// ── Modal de descansos ───────────────────────────────────────────

function asistGenerarDiasPeriodo(desde, hasta) {
  const DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const d0 = new Date(`${desde}T12:00:00`);
  const df = new Date(`${hasta}T12:00:00`);
  const dias = [];
  for (let d = new Date(d0); d <= df; d.setDate(d.getDate() + 1)) {
    const f = d.toISOString().slice(0, 10);
    dias.push({ fecha: f, dia: d.getDate(), diaSem: DIAS[d.getDay()] });
  }
  return dias;
}

function asistCerrarModalDescansos() {
  document.getElementById('modalDescansos').classList.add('hide');
  window._descansosState = null;
}

async function asistAbrirModalDescansos() {
  const data = window._sueldosData;
  if (!data?.periodo?.desde || !data?.periodo?.hasta || !data?.resultados?.length) {
    alert('Primero cargá la liquidación del período.');
    return;
  }
  const p = data.periodo;
  const empleados = data.resultados.map(r => r.emp).sort((a, b) => (a.nombre_completo || '').localeCompare(b.nombre_completo || ''));
  const dias = asistGenerarDiasPeriodo(p.desde, p.hasta);
  document.getElementById('modalDescansos').classList.remove('hide');
  document.getElementById('descansosModalBody').innerHTML = '<p class="text-center text-muted" style="padding:30px">Cargando descansos...</p>';
  try {
    const saved = await fetch(`${AAPI}/sueldos/descansos?periodo_desde=${p.desde}&periodo_hasta=${p.hasta}&_=${Date.now()}`).then(r => r.json());
    const guardados = (saved.ok && saved.descansos) ? saved.descansos : {};
    window._descansosState = {};
    for (const emp of empleados) {
      window._descansosState[emp.id] = new Set(guardados[emp.id] || []);
    }
    asistRenderizarModalDescansos(dias, empleados);
  } catch (e) {
    document.getElementById('descansosModalBody').innerHTML = `<p class="text-center text-danger" style="padding:30px">Error: ${e.message}</p>`;
  }
}

function asistRenderizarModalDescansos(dias, empleados) {
  const body = document.getElementById('descansosModalBody');
  const html = `
    <div style="overflow-x:auto">
      <table class="data-table" style="font-size:.85em;white-space:nowrap">
        <thead>
          <tr>
            <th style="position:sticky;left:0;background:var(--bg-card);z-index:2;min-width:160px">Embajador</th>
            ${dias.map(d => `<th style="text-align:center;min-width:38px">${d.dia}<br><small style="font-weight:400">${d.diaSem}</small></th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${empleados.map(e => `<tr>
            <td style="position:sticky;left:0;background:var(--bg-card);z-index:1;font-weight:600;white-space:nowrap">${e.nombre_completo}</td>
            ${dias.map(d => {
              const checked = window._descansosState[e.id]?.has(d.fecha) ? 'checked' : '';
              return `<td style="text-align:center;padding:4px 2px"><input type="checkbox" id="descChk_${e.id}_${d.fecha}" ${checked} onchange="asistMarcarDescanso(${e.id}, '${d.fecha}', this.checked)" style="width:18px;height:18px;cursor:pointer"></td>`;
            }).join('')}
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
  body.innerHTML = html;
}

function asistMarcarDescanso(empId, fecha, checked) {
  if (!window._descansosState) return;
  if (!window._descansosState[empId]) window._descansosState[empId] = new Set();
  if (checked) window._descansosState[empId].add(fecha);
  else window._descansosState[empId].delete(fecha);
}

async function asistGuardarDescansos() {
  const data = window._sueldosData;
  if (!data?.periodo) return;
  const p = data.periodo;
  const payload = {};
  for (const [empId, set] of Object.entries(window._descansosState || {})) {
    payload[empId] = [...set];
  }
  const btn = document.getElementById('btnGuardarDescansos');
  const originalText = btn?.textContent || '💾 Guardar descansos';
  if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }
  try {
    const res = await fetch(`${AAPI}/sueldos/descansos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ periodo_desde: p.desde, periodo_hasta: p.hasta, descansos: payload })
    });
    const d = await res.json();
    if (d.ok) {
      asistCerrarModalDescansos();
      asistCargarSueldos();
    } else {
      alert(d.error || 'No se pudieron guardar los descansos.');
    }
  } catch (e) {
    alert(e.message || 'Error de red');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = originalText; }
  }
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
    const pruebaAnio = document.getElementById('cfgPruebaAnio');
    if (pruebaAnio && !pruebaAnio.options.length) {
      const y = new Date().getFullYear();
      for (let i = y; i >= y - 2; i--) pruebaAnio.innerHTML += `<option value="${i}">${i}</option>`;
      document.getElementById('cfgPruebaMes').value = new Date().getMonth() + 1;
      document.getElementById('cfgPruebaQuincena').value = new Date().getDate() <= 15 ? '1' : '2';
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

async function asistProbarCorreo(tipo) {
  const msgEl = document.getElementById('cfgCorreoMsg');
  if (msgEl) msgEl.textContent = 'Enviando...';
  try {
    let url = `${AAPI}/correo/probar/${tipo}`;
    let opts = { method: 'POST', headers: { 'Content-Type': 'application/json' } };
    if (tipo === 'quincena-pdf') {
      opts.body = JSON.stringify({
        anio: +document.getElementById('cfgPruebaAnio')?.value,
        mes: +document.getElementById('cfgPruebaMes')?.value,
        quincena: +document.getElementById('cfgPruebaQuincena')?.value
      });
    }
    const res = await fetch(url, opts);
    const data = await res.json();
    if (data.ok) {
      const det = data.pdfs ? `${data.pdfs} PDF(s)` : (data.archivos?.length ? data.archivos.join(', ') : 'OK');
      if (msgEl) msgEl.innerHTML = `<span style="color:var(--success)">Enviado a ${data.destino || 'beluchicharroneria@gmail.com'} — ${det}</span>`;
    } else {
      if (msgEl) msgEl.innerHTML = `<span style="color:var(--danger)">${data.error || 'Error'}</span>`;
    }
  } catch {
    if (msgEl) msgEl.innerHTML = '<span style="color:var(--danger)">Error de red</span>';
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
