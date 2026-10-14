/* =====================================================================
   Shared UI components
   ===================================================================== */
const ICON = {
  today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/><circle cx="12" cy="15" r="1.6" fill="currentColor" stroke="none"/></svg>',
  ear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9.5a5 5 0 1 1 10 0c0 3-3 4-3 6.5a3 3 0 0 1-5.6 1.5"/><path d="M10 9.5a2 2 0 1 1 4 0"/></svg>',
  voicings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="M8 4.5v15M13 4.5v15M18 4.5v15" /><rect x="6.6" y="4.5" width="2.8" height="8" rx=".6" fill="currentColor"/><rect x="11.6" y="4.5" width="2.8" height="8" rx=".6" fill="currentColor"/><rect x="16.6" y="4.5" width="2.8" height="8" rx=".6" fill="currentColor"/></svg>',
  sing: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6"/></svg>',
  stats: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 20V12M10 20V6M15 20v-9M20 20V4"/></svg>',
  plan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h10M4 18h6"/><circle cx="18" cy="16" r="3"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
  play: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
  replay: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/></svg>',
};
function icon(name) { return svgEl(ICON[name]); }
function brandMark(size = 26) {
  // Twelve dots round the circle of fifths, coloured by brightness — the app's degree spectrum
  const dots = DEGREES.map(d => {
    const order = (d.fifths + 12) % 12; // C at top, G clockwise
    const a = (order / 12) * Math.PI * 2 - Math.PI / 2, r = 9.2;
    return `<circle cx="${(12 + Math.cos(a) * r).toFixed(2)}" cy="${(12 + Math.sin(a) * r).toFixed(2)}" r="${d.id === '1' ? 2.6 : 2}" style="fill:oklch(calc(var(--chip-l) + ${lumBump(hueForSemi(d.semi)).toFixed(1)}%) var(--chip-c) ${hueForSemi(d.semi)})"/>`;
  }).join('');
  return svgEl(`<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${dots}</svg>`);
}

let toastTimer = 0;
function toast(msg, ms = 2600) {
  let t = $('.toast');
  if (!t) { t = h('div', { class: 'toast', role: 'status' }); document.body.append(t); }
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, ms);
}

function selectField(label, options, value, onChange, id) {
  const sel = h('select', { id: id || 'sel-' + uid(), 'aria-label': label });
  for (const [v, text] of options) sel.append(h('option', { value: String(v), selected: String(v) === String(value) }, text));
  sel.addEventListener('change', () => onChange(sel.value));
  const wrap = h('label', { class: 'field', for: sel.id }, h('span', null, label), sel);
  wrap.select = sel;
  return wrap;
}
function toggleField(label, checked, onChange, id) {
  const inp = h('input', { type: 'checkbox', id: id || 'tg-' + uid(), checked: !!checked, role: 'switch' });
  inp.addEventListener('change', () => onChange(inp.checked));
  const wrap = h('label', { class: 'toggle', for: inp.id }, inp, h('span', null, label));
  wrap.input = inp;
  return wrap;
}
function segmented(items, value, onChange, label) {
  const el = h('div', { class: 'seg', role: 'group', 'aria-label': label || 'Choose' });
  const set = v => { for (const b of el.children) b.setAttribute('aria-pressed', String(b.dataset.v === v)); };
  for (const [v, text] of items) el.append(h('button', { type: 'button', 'data-v': v, onclick: () => { set(v); onChange(v); } }, text));
  set(value);
  el.setValue = set;
  return el;
}
function degLabel(id) { return DEG[id].label; }
function degChip(id, cls = '') { const d = DEG[id]; return h('span', { class: 'deg-chip ' + cls, style: hueVars(d.semi) }, d.label); }

// Answer pad laid out like a keyboard: chromatic degrees on top, diatonic below
const PAD_BLACK = [['b2', 2], ['b3', 4], ['s4', 8], ['b6', 10], ['b7', 12]];
const PAD_WHITE = ['1', '2', '3', '4', '5', '6', '7'];
const KEY_HINT = { '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', b2: '⇧2', b3: '⇧3', s4: '⇧4', b6: '⇧6', b7: '⇧7' };
function DegreePad(onPick) {
  const el = h('div', { class: 'pad', role: 'group', 'aria-label': 'Scale degrees' });
  const btns = new Map();
  const mk = (id, black) => {
    const d = DEG[id];
    const b = h('button', { type: 'button', class: black ? 'black' : '', style: hueVars(d.semi), 'data-id': id, 'aria-label': 'Degree ' + d.label },
      d.label, h('small', { class: 'solf' }, d.solf), h('kbd', null, KEY_HINT[id]));
    b.addEventListener('click', () => { if (!b.classList.contains('off')) onPick(id); });
    btns.set(id, b);
    return b;
  };
  for (const [id, col] of PAD_BLACK) { const b = mk(id, true); b.style.gridColumn = `${col} / span 2`; b.style.gridRow = '1'; el.append(b); }
  PAD_WHITE.forEach((id, i) => { const b = mk(id, false); b.style.gridColumn = `${i * 2 + 1} / span 2`; b.style.gridRow = '2'; el.append(b); });
  const api = {
    el,
    setEnabled(ids) {
      const anyBlack = PAD_BLACK.some(([id]) => ids.includes(id));
      for (const [id, b] of btns) {
        const on = ids.includes(id);
        b.classList.toggle('off', !on);
        b.setAttribute('aria-disabled', String(!on));
        b.hidden = !anyBlack && PAD_BLACK.some(([x]) => x === id);
      }
      api.applyLabels();
    },
    applyLabels() { const solf = Settings.get().labels === 'solfege'; for (const b of btns.values()) b.querySelector('.solf').hidden = !solf; },
    mark(id, cls) { btns.get(id)?.classList.add(cls); },
    unmark(id, cls) { btns.get(id)?.classList.remove(cls); },
    clear() { for (const b of btns.values()) b.classList.remove('good', 'bad', 'sel', 'hint'); },
  };
  return api;
}
function keyToDegree(e) {
  const m = /^Digit([1-7])$/.exec(e.code);
  if (!m) return null;
  const n = m[1];
  if (!e.shiftKey) return n;
  return { '2': 'b2', '3': 'b3', '4': 's4', '5': 's4', '6': 'b6', '7': 'b7' }[n] || null;
}

// On-screen keyboard that also mirrors what is held on the MIDI keyboard
const BLACK_PCS = new Set([1, 3, 6, 8, 10]);
function Piano({ lo = 48, hi = 84, onDown, onUp }) {
  const scroll = h('div', { class: 'piano-scroll' });
  const el = h('div', { class: 'piano', role: 'group', 'aria-label': 'Keyboard' });
  scroll.append(el);
  const whites = [];
  for (let m = lo; m <= hi; m++) if (!BLACK_PCS.has(mod12(m))) whites.push(m);
  const W = whites.length, ww = 100 / W, bw = ww * 0.62;
  el.style.minWidth = W * 30 + 'px';
  const keys = new Map();
  const bind = (k, m) => {
    k.addEventListener('pointerdown', e => { e.preventDefault(); try { k.setPointerCapture(e.pointerId); } catch { /* synthetic or finished pointer */ } onDown && onDown(m); });
    const up = () => onUp && onUp(m);
    k.addEventListener('pointerup', up); k.addEventListener('pointercancel', up);
    k.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onDown && onDown(m); setTimeout(up, 250); } });
  };
  for (const m of whites) {
    const k = h('button', { type: 'button', class: 'key white', 'aria-label': noteName(m) }, h('span', { class: 'tag', hidden: true }), mod12(m) === 0 ? h('span', { class: 'lbl' }, noteName(m)) : null);
    bind(k, m); keys.set(m, k); el.append(k);
  }
  for (let m = lo; m <= hi; m++) {
    if (!BLACK_PCS.has(mod12(m))) continue;
    const idx = whites.findIndex(w => w > m);
    const k = h('button', { type: 'button', class: 'key black', 'aria-label': noteName(m), style: { left: `${idx * ww - bw / 2}%`, width: `${bw}%` } }, h('span', { class: 'tag', hidden: true }));
    bind(k, m); keys.set(m, k); el.append(k);
  }
  return {
    el: scroll,
    // marks: Map midi -> { label, hue, cls }
    setMarks(marks) {
      for (const [m, k] of keys) {
        const mk = marks.get(m);
        const tag = k.querySelector('.tag');
        k.classList.remove('down', 'wrong', 'ghost');
        if (!mk) { tag.hidden = true; continue; }
        tag.hidden = false; tag.textContent = mk.label || '';
        if (mk.hue != null) { tag.style.setProperty('--h', mk.hue); tag.style.setProperty('--lb', lumBump(mk.hue).toFixed(1) + '%'); }
        for (const c of (mk.cls || 'down').split(' ')) k.classList.add(c);
      }
    },
    centre(m) {
      const k = keys.get(m); if (!k) return;
      const r = k.offsetLeft - scroll.clientWidth / 2 + k.offsetWidth / 2;
      scroll.scrollLeft = Math.max(0, r);
    },
  };
}

function statusLine() {
  const el = h('p', { class: 'stage-status', 'aria-live': 'polite' });
  el.set = (text, cls = '') => { el.textContent = text; el.className = 'stage-status ' + cls; };
  return el;
}
function startPanel(title, text, onStart, extra) {
  return h('div', { class: 'start-wrap' },
    h('p', null, text),
    h('button', { type: 'button', class: 'btn primary big', onclick: onStart }, icon('play'), title),
    extra || null);
}
function shortcutRow(pairs) {
  return h('div', { class: 'shortcuts hide-phone' }, pairs.map(([k, t]) => h('span', null, h('kbd', null, k), ' ', t)));
}
function sessionStrip() {
  const el = h('div', { class: 'session-strip' });
  el.update = (parts) => { el.replaceChildren(...parts.map(([label, val]) => h('span', null, label + ' ', h('b', null, val)))); };
  return el;
}
