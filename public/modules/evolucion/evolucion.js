/* eslint-disable no-unused-vars */
(function () {
  'use strict';

  const API = '/api/evolucion';
  const UMBRALES = [30, 50, 70, 90, 100];
  const ALARM_CFG = {
    30:  { icon: '🌱', cls: 'umbral-30',  freq: 440,  dur: 150,  type: 'beep' },
    50:  { icon: '⭐', cls: 'umbral-50',  freq: 550,  dur: 200,  type: 'ascend' },
    70:  { icon: '🔥', cls: 'umbral-70',  freq: 660,  dur: 150,  type: 'double' },
    90:  { icon: '🚀', cls: 'umbral-90',  freq: 770,  dur: 120,  type: 'triple' },
    100: { icon: '🏆', cls: 'umbral-100', freq: 880,  dur: 300,  type: 'fanfare' }
  };

  let resumenData = [];
  let detalleActual = null;
  let embajadorSeleccionado = null;
  let audioCtx = null;

  function evoTab(tab) {
    document.querySelectorAll('#evoTabs .mod-tab').forEach((b, i) => {
      b.classList.toggle('active', (tab === 'embajadores' && i === 0) || (tab === 'detalle' && i === 1));
    });
    document.querySelectorAll('.evo-section').forEach(s => s.classList.remove('active'));
    document.getElementById('evo-' + tab).classList.add('active');
    if (tab === 'detalle' && embajadorSeleccionado) evoCargarDetalle();
  }

  async function evoFetch(url, opts) {
    const res = await fetch(url, { credentials: 'same-origin', ...opts });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Error de red');
    return data;
  }

  function evoToast(msg) {
    const el = document.createElement('div');
    el.className = 'evo-toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  function evoIniciales(nombre) {
    if (!nombre) return '?';
    return nombre.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  function evoAvatarHtml(foto, nombre) {
    if (foto) return `<img src="/uploads/fotos/${foto}" alt="">`;
    return evoIniciales(nombre);
  }

  async function evoInit() {
    try {
      await evoCargarResumen();
    } catch (e) {
      console.error('[evolucion]', e);
      evoToast(e.message || 'Error al cargar módulo');
    }
  }

  async function evoCargarResumen() {
    const data = await evoFetch(API + '/resumen');
    resumenData = data.embajadores || [];
    evoPoblarFiltroCargo();
    evoPoblarSelect();
    evoRenderResumen();
  }

  function evoPoblarFiltroCargo() {
    const sel = document.getElementById('evoFiltroCargo');
    const cargos = [...new Set(resumenData.map(e => e.cargo).filter(Boolean))].sort();
    sel.innerHTML = '<option value="">Todos los cargos</option>' +
      cargos.map(c => `<option value="${c}">${c}</option>`).join('');
  }

  function evoPoblarSelect() {
    const sel = document.getElementById('evoSelectEmbajador');
    const prev = sel.value;
    sel.innerHTML = '<option value="">— Seleccionar embajador —</option>' +
      resumenData.filter(e => e.matrizId).map(e =>
        `<option value="${e.id}">${e.nombre_completo} (${e.cargo})</option>`
      ).join('');
    if (prev) sel.value = prev;
  }

  function evoFiltrarResumen() {
    evoRenderResumen();
  }

  function evoRenderResumen() {
    const buscar = (document.getElementById('evoBuscar').value || '').toLowerCase();
    const cargo = document.getElementById('evoFiltroCargo').value;
    const grid = document.getElementById('evoGridResumen');

    let lista = resumenData.filter(e => {
      if (cargo && e.cargo !== cargo) return false;
      if (buscar && !e.nombre_completo.toLowerCase().includes(buscar)) return false;
      return true;
    });

    if (!lista.length) {
      grid.innerHTML = '<div class="evo-empty" style="grid-column:1/-1"><div class="evo-empty-icon">👥</div><p>No hay embajadores que coincidan.</p></div>';
      return;
    }

    grid.innerHTML = lista.map(e => {
      const pct = e.progreso ? e.progreso.porcentaje : null;
      const sinMatriz = !e.matrizId;
      return `
        <div class="evo-card" onclick="evoAbrirDetalle(${e.id})">
          <div class="evo-card-head">
            <div class="evo-avatar">${evoAvatarHtml(e.foto, e.nombre_completo)}</div>
            <div>
              <div class="evo-card-name">${e.nombre_completo}</div>
              <div class="evo-card-cargo">${e.cargo || '—'}</div>
            </div>
          </div>
          ${sinMatriz
            ? '<div class="evo-card-sin-matriz">Sin matriz de evolución</div>'
            : `<div class="evo-progress-label"><span>${e.progreso.completados}/${e.progreso.total}</span><span>${pct}%</span></div>
               <div class="evo-progress-bar"><div class="evo-progress-fill" style="width:${pct}%"></div></div>`
          }
        </div>`;
    }).join('');
  }

  function evoAbrirDetalle(id) {
    embajadorSeleccionado = id;
    document.getElementById('evoSelectEmbajador').value = String(id);
    evoTab('detalle');
    evoCargarDetalle();
  }

  async function evoCargarDetalle() {
    const id = document.getElementById('evoSelectEmbajador').value;
    const cont = document.getElementById('evoDetalleContenido');
    if (!id) {
      detalleActual = null;
      document.getElementById('evoDetalleMeta').style.display = 'none';
      document.getElementById('evoDetProgressWrap').style.display = 'none';
      document.getElementById('evoMilestones').innerHTML = '';
      cont.innerHTML = '<div class="evo-empty"><div class="evo-empty-icon">📈</div><p>Seleccioná un embajador para ver su matriz de evolución.</p></div>';
      return;
    }

    embajadorSeleccionado = +id;
    cont.innerHTML = '<div class="evo-skeleton" style="height:200px"></div>';

    try {
      const data = await evoFetch(API + '/embajador/' + id);
      detalleActual = data;

      const e = data.embajador;
      document.getElementById('evoDetalleMeta').style.display = 'flex';
      document.getElementById('evoDetAvatar').innerHTML = evoAvatarHtml(e.foto, e.nombre_completo);
      document.getElementById('evoDetNombre').textContent = e.nombre_completo;
      document.getElementById('evoDetCargo').textContent = e.cargo || '—';

      if (!data.matriz) {
        document.getElementById('evoDetProgressWrap').style.display = 'none';
        document.getElementById('evoMilestones').innerHTML = '';
        cont.innerHTML = `<div class="evo-empty"><div class="evo-empty-icon">⚠️</div><p>${data.mensaje || 'Sin matriz para este cargo.'}</p></div>`;
        return;
      }

      document.getElementById('evoDetProgressWrap').style.display = 'block';
      evoActualizarProgresoUI(data.progreso);
      evoRenderMilestones(data.progreso.porcentaje, data.alarmas || []);
      evoRenderColumnas(data.matriz.categorias);
    } catch (err) {
      console.error('[evolucion] detalle', err);
      evoToast(err.message);
      cont.innerHTML = '<div class="evo-empty"><p>Error al cargar detalle.</p></div>';
    }
  }

  function evoActualizarProgresoUI(progreso) {
    document.getElementById('evoDetPct').textContent = progreso.porcentaje + '%';
    document.getElementById('evoDetBar').style.width = progreso.porcentaje + '%';
    document.getElementById('evoDetCount').textContent = `${progreso.completados} / ${progreso.total} ítems`;
  }

  function evoRenderMilestones(pct, alarmas) {
    const reached = new Set((alarmas || []).map(a => a.umbral));
    let currentFound = false;
    const html = UMBRALES.map(u => {
      const isReached = reached.has(u) || pct >= u;
      let cls = 'evo-milestone';
      if (isReached) cls += ' reached';
      else if (!currentFound && pct < u) { cls += ' current'; currentFound = true; }
      const icon = isReached ? '✓' : '○';
      return `<span class="${cls}">${icon} ${u}%</span>`;
    }).join('');
    document.getElementById('evoMilestones').innerHTML = html;
  }

  function evoRenderColumnas(categorias) {
    const cont = document.getElementById('evoDetalleContenido');
    cont.innerHTML = `<div class="evo-cols-scroll">${categorias.map(cat => `
      <div class="evo-col">
        <div class="evo-col-title">${cat.titulo}</div>
        <div class="evo-col-items">
          ${cat.items.map(item => `
            <label class="evo-chip ${item.completado ? 'done' : ''}" data-key="${item.key}">
              <input type="checkbox" ${item.completado ? 'checked' : ''}
                aria-label="${item.label.replace(/"/g, '&quot;')}"
                onchange="evoToggleItem('${item.key}', this.checked, this)">
              <span>${item.label}</span>
            </label>
          `).join('')}
        </div>
        <div class="evo-col-footer">${cat.progreso.completados}/${cat.progreso.total} · ${cat.progreso.porcentaje}%</div>
      </div>
    `).join('')}</div>`;
  }

  async function evoToggleItem(itemKey, checked, inputEl) {
    const id = embajadorSeleccionado;
    if (!id) return;

    const chip = inputEl.closest('.evo-chip');
    chip.classList.add('saving');

    try {
      const data = await evoFetch(API + '/embajador/' + id + '/item', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_key: itemKey, completado: checked })
      });

      chip.classList.toggle('done', checked);
      evoActualizarProgresoUI(data.progreso);

      if (detalleActual) {
        detalleActual.progreso = data.progreso;
        const cat = detalleActual.matriz.categorias.find(c => c.items.some(i => i.key === itemKey));
        if (cat) {
          const item = cat.items.find(i => i.key === itemKey);
          if (item) item.completado = checked;
          const done = cat.items.filter(i => i.completado).length;
          cat.progreso = {
            total: cat.items.length,
            completados: done,
            porcentaje: cat.items.length ? Math.round((done / cat.items.length) * 100) : 0
          };
          const col = chip.closest('.evo-col');
          const footer = col && col.querySelector('.evo-col-footer');
          if (footer) footer.textContent = `${cat.progreso.completados}/${cat.progreso.total} · ${cat.progreso.porcentaje}%`;
        }
      }

      const alarmasHist = (detalleActual?.alarmas || []).map(a => a.umbral);
      const allAlarmas = [...new Set([...alarmasHist, ...(data.alarmas || [])])];
      evoRenderMilestones(data.progreso.porcentaje, allAlarmas.map(u => ({ umbral: u })));

      if (data.alarmas && data.alarmas.length) {
        for (const umbral of data.alarmas) {
          evoMostrarAlarma(umbral, data.embajador);
        }
      }

      const idx = resumenData.findIndex(e => e.id === id);
      if (idx >= 0 && resumenData[idx].progreso) {
        resumenData[idx].progreso = data.progreso;
      }
    } catch (err) {
      inputEl.checked = !checked;
      chip.classList.toggle('done', !checked);
      evoToast(err.message);
    } finally {
      chip.classList.remove('saving');
    }
  }

  function evoGetAudioCtx() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) {}
    }
    return audioCtx;
  }

  function evoPlayTone(freq, dur, delay = 0) {
    const ctx = evoGetAudioCtx();
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + dur / 1000);
    osc.start(t);
    osc.stop(t + dur / 1000);
  }

  function evoPlaySound(umbral) {
    const cfg = ALARM_CFG[umbral];
    if (!cfg) return;
    try {
      if (cfg.type === 'beep') evoPlayTone(cfg.freq, cfg.dur);
      else if (cfg.type === 'ascend') {
        evoPlayTone(440, 120, 0);
        evoPlayTone(550, 120, 0.15);
        evoPlayTone(660, 180, 0.3);
      } else if (cfg.type === 'double') {
        evoPlayTone(cfg.freq, cfg.dur, 0);
        evoPlayTone(cfg.freq, cfg.dur, 0.2);
      } else if (cfg.type === 'triple') {
        evoPlayTone(660, 100, 0);
        evoPlayTone(770, 100, 0.12);
        evoPlayTone(880, 150, 0.24);
      } else if (cfg.type === 'fanfare') {
        [523, 659, 784, 1047].forEach((f, i) => evoPlayTone(f, 200, i * 0.12));
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      }
    } catch (e) { console.warn('[evolucion] audio', e); }
  }

  function evoConfetti() {
    const box = document.getElementById('evoConfetti');
    box.innerHTML = '';
    const colors = ['#8fa3ff', '#56d08e', '#c5a86f', '#ff6b6b', '#7da3f7'];
    for (let i = 0; i < 40; i++) {
      const s = document.createElement('span');
      s.style.left = Math.random() * 100 + '%';
      s.style.background = colors[i % colors.length];
      s.style.animationDelay = Math.random() * 0.5 + 's';
      box.appendChild(s);
    }
  }

  function evoMostrarAlarma(umbral, embajador) {
    const cfg = ALARM_CFG[umbral] || ALARM_CFG[50];
    const overlay = document.getElementById('evoAlarmOverlay');
    const box = document.getElementById('evoAlarmBox');
    box.className = 'evo-alarm-box ' + cfg.cls;
    document.getElementById('evoAlarmIcon').textContent = cfg.icon;
    document.getElementById('evoAlarmTitle').textContent = `¡${umbral}% alcanzado!`;
    document.getElementById('evoAlarmMsg').textContent =
      `¡${embajador.nombre_completo} alcanzó el ${umbral}% en su evolución como ${embajador.cargo || 'embajador'}!`;
    document.getElementById('evoConfetti').innerHTML = '';
    if (umbral >= 90) evoConfetti();
    overlay.style.display = 'flex';
    evoPlaySound(umbral);
  }

  function evoCerrarAlarma() {
    document.getElementById('evoAlarmOverlay').style.display = 'none';
  }

  window.evoTab = evoTab;
  window.evoFiltrarResumen = evoFiltrarResumen;
  window.evoAbrirDetalle = evoAbrirDetalle;
  window.evoCargarDetalle = evoCargarDetalle;
  window.evoToggleItem = evoToggleItem;
  window.evoCerrarAlarma = evoCerrarAlarma;

  evoInit();
})();
