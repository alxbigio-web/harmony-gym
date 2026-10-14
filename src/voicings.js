/* =====================================================================
   Voicing trainer
   ===================================================================== */
const ROOTLESS = {
  maj7: { A: [4, 7, 11, 2], B: [11, 2, 4, 7], sym: 'maj9' },
  m7:   { A: [3, 7, 10, 2], B: [10, 2, 3, 7], sym: 'm9' },
  dom7: { A: [4, 9, 10, 2], B: [10, 2, 4, 9], sym: '13' },
  m7b5: { A: [3, 6, 10, 0], B: [10, 0, 3, 6], sym: 'm7♭5' },
};
const SPELL = {
  maj9:    { sym: 'maj9',    req: [4, 11, 2],  allow: [0, 7] },
  m9:      { sym: 'm9',      req: [3, 10, 2],  allow: [0, 7] },
  dom9:    { sym: '9',       req: [4, 10, 2],  allow: [0, 7] },
  dom13:   { sym: '13',      req: [4, 10, 9],  allow: [0, 7, 2] },
  m11:     { sym: 'm11',     req: [3, 10, 5],  allow: [0, 7, 2] },
  six9:    { sym: '6/9',     req: [4, 9, 2],   allow: [0, 7] },
  maj7s11: { sym: 'maj7♯11', req: [4, 11, 6],  allow: [0, 7, 2, 9] },
  dom7b9:  { sym: '7♭9',     req: [4, 10, 1],  allow: [0, 7] },
  dom7s9:  { sym: '7♯9',     req: [4, 10, 3],  allow: [0, 7] },
  dom7s11: { sym: '7♯11',    req: [4, 10, 6],  allow: [0, 7, 2, 9] },
  dom7b13: { sym: '7♭13',    req: [4, 10, 8],  allow: [0, 2] },
  alt:     { sym: '7alt',    req: [4, 10],     allow: [0, 1, 3, 6, 8], atLeast: { set: [1, 3, 6, 8], n: 2 } },
  sus13:   { sym: '13sus4',  req: [5, 10, 9],  allow: [0, 7, 2] },
  mmaj9:   { sym: 'm(maj9)', req: [3, 11, 2],  allow: [0, 7] },
};
const US = {
  II:   { label: 'II',   triad: 2, sym: '13♯11' },
  bIII: { label: '♭III', triad: 3, sym: '7♯9' },
  bV:   { label: '♭V',   triad: 6, sym: '7♭9♯11' },
  bVI:  { label: '♭VI',  triad: 8, sym: '7♯9♭13' },
  VI:   { label: 'VI',   triad: 9, sym: '13♭9' },
};
const BORROWED = {
  iv7:      { label: 'iv7',       root: 5,  q: 'm7' },
  iv6:      { label: 'iv6',       root: 5,  q: 'm6' },
  bVImaj7:  { label: '♭VImaj7',   root: 8,  q: 'maj7' },
  bVII7:    { label: '♭VII7',     root: 10, q: 'dom7' },
  bIIImaj7: { label: '♭IIImaj7',  root: 3,  q: 'maj7' },
  iim7b5:   { label: 'iiø7',      root: 2,  q: 'm7b5' },
  v7:       { label: 'v7',        root: 7,  q: 'm7' },
  bIImaj7:  { label: '♭IImaj7',   root: 1,  q: 'maj7' },
};
const NEGATIVE = {
  V7:    { label: 'V7',    root: 7, q: 'dom7' },
  ii7:   { label: 'ii7',   root: 2, q: 'm7' },
  IVmaj7:{ label: 'IVmaj7',root: 5, q: 'maj7' },
  vi7:   { label: 'vi7',   root: 9, q: 'm7' },
  iii7:  { label: 'iii7',  root: 4, q: 'm7' },
  Imaj7: { label: 'Imaj7', root: 0, q: 'maj7' },
};
const SEVENTHS = ['maj7', 'm7', 'dom7', 'm7b5'];
const VOICING_TYPES = [
  { id: 'pos7', phase: 1, name: 'Root-position 7ths', desc: 'All four chord tones with the root in the bass.', items: SEVENTHS, seq: false },
  { id: 'shell', phase: 1, name: 'Shell voicings', desc: 'Root in the bass plus the 3rd and 7th, in either order above it.', items: SEVENTHS, seq: true },
  { id: 'guide', phase: 1, name: 'Guide tones', desc: 'Just the 3rd and 7th: the two notes that define the chord.', items: SEVENTHS, seq: true },
  { id: 'rlA', phase: 2, name: 'Rootless A', desc: '3-5-7-9 from the bottom up. Dominants use 3-13-♭7-9.', items: SEVENTHS, seq: true },
  { id: 'rlB', phase: 2, name: 'Rootless B', desc: '7-9-3-5 from the bottom up. Dominants use ♭7-9-3-13.', items: SEVENTHS, seq: true },
  { id: 'drop2', phase: 2, name: 'Drop 2', desc: 'A close 7th chord with the second note from the top dropped an octave. Any of the four inversions counts.', items: SEVENTHS, seq: false },
  { id: 'spell', phase: 3, name: 'Extensions & alterations', desc: 'Play the 3rd, the 7th and the named colour tones. Root and 5th are optional.', items: Object.keys(SPELL), seq: false },
  { id: 'us', phase: 3, name: 'Upper structures', desc: 'A major triad over the 3rd and ♭7 of a dominant chord. The root is optional.', items: Object.keys(US), seq: false },
  { id: 'borrowed', phase: 4, name: 'Borrowed chords', desc: 'Chords from the parallel minor, played in a major key. Any voicing of exactly those notes.', items: Object.keys(BORROWED), seq: false },
  { id: 'negative', phase: 4, name: 'Negative harmony', desc: 'Mirror every note across the axis between the key’s ♭3 and 3, then play the result.', items: Object.keys(NEGATIVE), seq: false },
];
const vtById = id => VOICING_TYPES.find(t => t.id === id) || VOICING_TYPES[1];
const PHASE_LABEL = { 1: 'Weeks 1–3', 2: 'Weeks 4–6', 3: 'Weeks 7–9', 4: 'Weeks 10–12' };
function itemLabel(type, item) {
  if (type === 'spell') return SPELL[item].sym;
  if (type === 'us') return 'US ' + US[item].label;
  if (type === 'borrowed') return BORROWED[item].label;
  if (type === 'negative') return NEGATIVE[item].label;
  if (type === 'rlA' || type === 'rlB') return ROOTLESS[item].sym;
  return QUAL[item].sym;
}

function ascending(pcs, lo) {
  const out = [];
  let m = lo;
  for (const pc of pcs) { while (mod12(m) !== mod12(pc)) m++; out.push(m); m++; }
  return out;
}
function setSpec(req, allow, bass, min, atLeast) { return { mode: 'set', required: new Set(req.map(mod12)), allowed: new Set([...req, ...allow].map(mod12)), bass: bass == null ? null : mod12(bass), min, atLeast }; }
function orderSpec(orders) { const allowed = new Set(orders.flat().map(mod12)); return { mode: 'order', orders: orders.map(o => o.map(mod12)), len: orders[0].length, allowed, required: new Set(orders[0].map(mod12)) }; }
function checkVoicing(spec, notes) {
  if (!notes.length) return { ok: false, wrong: [], missing: [...spec.required] };
  const pcs = notes.map(mod12), uniq = new Set(pcs);
  const wrong = notes.filter(n => !spec.allowed.has(mod12(n)));
  const missing = [...spec.required].filter(pc => !uniq.has(pc));
  if (spec.mode === 'order') {
    const ok = notes.length === spec.len && uniq.size === spec.len && spec.orders.some(o => o.every((pc, i) => pc === pcs[i]));
    return { ok, wrong, missing, orderWrong: !ok && !wrong.length && !missing.length };
  }
  let ok = !wrong.length && !missing.length && notes.length >= (spec.min || 1);
  const bassWrong = spec.bass != null && pcs[0] !== spec.bass;
  if (bassWrong) ok = false;
  if (ok && spec.atLeast) ok = spec.atLeast.set.filter(p => uniq.has(p)).length >= spec.atLeast.n;
  return { ok, wrong, missing, bassWrong };
}
function nameChord(pcs) {
  const set = new Set(pcs.map(mod12));
  const order = ['maj7', 'm7', 'dom7', 'm7b5', 'dim7', 'm6', 'maj6', 'mmaj7', 'sus7', 'min', 'maj', 'dim', 'aug', 'sus4'];
  for (const q of order) for (const r of set) {
    const c = qualPcs(r, q);
    if (c.length === set.size && c.every(p => set.has(p))) return chordSym(r, q);
  }
  return null;
}
// Build what to play for one prompt
function buildTarget(type, item, root, variant) {
  const R = p => mod12(root + p);
  const sym = q => ROOT_NAMES[mod12(root)] + q;
  switch (type) {
    case 'pos7': {
      const pcs = QUAL[item].iv.map(R);
      return { sym: sym(QUAL[item].sym), sub: 'Root position · 1-3-5-7', spec: setSpec(pcs, [], R(0), 4), example: ascending(pcs, 48), labelRoot: root };
    }
    case 'shell': {
      const iv = QUAL[item].iv, pcs = [iv[0], iv[1], iv[3]].map(R);
      return { sym: sym(QUAL[item].sym), sub: 'Shell · root, 3rd, 7th', spec: setSpec(pcs, [], R(0), 3), example: ascending([pcs[0], pcs[2], pcs[1]], 43), labelRoot: root };
    }
    case 'guide': {
      const iv = QUAL[item].iv, pcs = [iv[1], iv[3]].map(R);
      return { sym: sym(QUAL[item].sym), sub: 'Guide tones · 3rd and 7th', spec: setSpec(pcs, [], null, 2), example: ascending(pcs, 55), labelRoot: root };
    }
    case 'rlA': case 'rlB': {
      const v = variant || (type === 'rlA' ? 'A' : 'B');
      const order = ROOTLESS[item][v].map(R);
      return { sym: sym(ROOTLESS[item].sym), sub: `Rootless ${v} · ${v === 'A' ? '3 on the bottom' : '7 on the bottom'}`, spec: orderSpec([order]), example: ascending(order, 50), labelRoot: root, ext: true };
    }
    case 'drop2': {
      const t = QUAL[item].iv.map(R);
      const orders = [[t[2], t[0], t[1], t[3]], [t[3], t[1], t[2], t[0]], [t[0], t[2], t[3], t[1]], [t[1], t[3], t[0], t[2]]];
      return { sym: sym(QUAL[item].sym), sub: 'Drop 2 · any inversion', spec: orderSpec(orders), example: ascending(pick(orders), 50), labelRoot: root };
    }
    case 'spell': {
      const S = SPELL[item], req = S.req.map(R);
      const exPcs = item === 'alt' ? [R(4), R(10), R(3), R(8)] : req;
      return { sym: sym(S.sym), sub: 'Guide tones + colour', spec: setSpec(req, S.allow.map(R), null, req.length, S.atLeast ? { set: S.atLeast.set.map(R), n: S.atLeast.n } : null), example: [36 + mod12(root), ...voiceLead(exPcs, null, 55, 76)], labelRoot: root, ext: true };
    }
    case 'us': {
      const U = US[item], triad = [0, 4, 7].map(i => R(U.triad + i));
      const req = [...new Set([...triad, R(4), R(10)])];
      const tri = ROOT_NAMES[R(U.triad)];
      const show = Settings.get().showTriad;
      return { sym: sym(U.sym), sub: show ? `${tri} triad over ${ROOT_NAMES[mod12(root)]}7 · upper structure ${U.label}` : `Upper structure ${U.label}`, spec: setSpec(req, [R(0)], null, req.length), example: [...ascending([R(4), R(10)], 52), ...ascending(triad, 62)], labelRoot: root, ext: true };
    }
    case 'borrowed': {
      const B = BORROWED[item], cr = R(B.root), pcs = qualPcs(cr, B.q);
      return { sym: B.label, sub: `In ${ROOT_NAMES[mod12(root)]} major`, spec: setSpec(pcs, [], null, pcs.length), example: [36 + cr, ...voiceLead(pcs, null, 55, 76)], labelRoot: root, keyLabels: true, reveal: chordSym(cr, B.q) };
    }
    case 'negative': {
      const N = NEGATIVE[item], sr = R(N.root), src = qualPcs(sr, N.q);
      const mapped = src.map(p => mod12(2 * root + 7 - p));
      return { sym: chordSym(sr, N.q), sub: `Negative harmony in ${ROOT_NAMES[mod12(root)]} · axis ${ROOT_NAMES[R(3)]}–${ROOT_NAMES[R(4)]}`, prefix: 'Mirror', spec: setSpec(mapped, [], null, mapped.length), example: voiceLead(mapped, null, 52, 76), labelRoot: root, keyLabels: true, reveal: nameChord(mapped) || 'the mirrored chord' };
    }
  }
  return null;
}

function VoicingsView() {
  let s = Settings.get();
  let type = vtById(s.voicingType);
  let items = (s.voicingQualities || []).filter(i => type.items.includes(i));
  if (!items.length) items = type.items.slice(0, Math.min(3, type.items.length));
  let q = null, token = 0, started = false, armed = true, timerId = 0;
  const rootState = { i: -1, last: null };
  const touch = new Set();
  const sess = { n: 0, c: 0, ms: [] };
  const round = new Set();

  const status = statusLine();
  const timer = h('span', { class: 'timer', 'aria-live': 'off' }, '0.0 s');
  const keyLine = h('div', { class: 'stage-key' }, 'Chord', h('b', null, '—'));
  const center = h('div', { class: 'stage-center' });
  const roundDots = h('div', { class: 'status-row', 'aria-label': 'Keys done this round' });
  const strip = sessionStrip();
  const showBtn = h('button', { type: 'button', class: 'btn', onclick: () => reveal() }, 'Show me', h('kbd', null, 'H'));
  const hearBtn = h('button', { type: 'button', class: 'btn', onclick: () => hear() }, icon('play'), 'Hear it', h('kbd', null, 'P'));
  const skipBtn = h('button', { type: 'button', class: 'btn', onclick: () => next(true) }, 'Skip', h('kbd', null, 'S'));
  const clearBtn = h('button', { type: 'button', class: 'btn', onclick: () => { touch.clear(); evaluate(); } }, 'Clear keys');
  const actions = h('div', { class: 'stage-actions' }, showBtn, hearBtn, skipBtn, clearBtn);
  actions.hidden = true;
  const piano = Piano({ lo: 36, hi: 84, onDown: m => tapKey(m) });
  const keysTable = h('div');

  // Controls
  const typeSel = h('select', { id: 'voicing-type', 'aria-label': 'Voicing type' });
  for (const ph of [1, 2, 3, 4]) {
    const og = h('optgroup', { label: PHASE_LABEL[ph] });
    for (const t of VOICING_TYPES.filter(t => t.phase === ph)) og.append(h('option', { value: t.id, selected: t.id === type.id }, t.name));
    typeSel.append(og);
  }
  typeSel.addEventListener('change', () => {
    type = vtById(typeSel.value);
    items = type.items.slice(0, Math.min(type.items.length, type.id === 'spell' ? 6 : 4));
    Settings.set({ voicingType: type.id, voicingQualities: items });
    renderItems(); renderControls(); renderKeysTable(); round.clear(); renderRound();
    if (started) next(); else showStart();
  });
  const orderSel = selectField('Key order', [['adaptive', 'Slowest keys first'], ['cycle', 'Cycle of 4ths (C F B♭…)'], ['chromatic', 'Chromatic'], ['random', 'Random']], s.voicingOrder, v => Settings.set({ voicingOrder: v }));
  const seqTg = toggleField('ii–V–I in each key', s.voicingSeq, v => { Settings.set({ voicingSeq: v }); renderControls(); renderKeysTable(); if (started) next(); });
  const triadTg = toggleField('Name the triad', s.showTriad, v => { Settings.set({ showTriad: v }); if (q && !q.done) { q.steps = q.steps.map(() => buildTarget(type.id, q.item, q.root)); render(); } });
  const seqField = h('div', { class: 'field' }, h('span', null, ' '), seqTg);
  const triadField = h('div', { class: 'field' }, h('span', null, ' '), triadTg);
  const itemsRow = h('div', { class: 'status-row', role: 'group', 'aria-label': 'Chords to include' });
  const desc = h('p', { class: 'note' });

  function renderControls() {
    const st = Settings.get();
    seqField.hidden = !type.seq; seqTg.input.checked = st.voicingSeq;
    triadField.hidden = type.id !== 'us';
    itemsRow.hidden = type.seq && st.voicingSeq;
    desc.textContent = type.desc;
  }
  function renderItems() {
    itemsRow.replaceChildren(...type.items.map(it => {
      const on = items.includes(it);
      return h('button', { type: 'button', class: 'chip-status' + (on ? ' on' : ''), 'aria-pressed': String(on), onclick: () => {
        if (on && items.length === 1) return toast('Keep at least one chord selected.');
        items = on ? items.filter(x => x !== it) : [...items, it];
        Settings.set({ voicingQualities: items }); renderItems();
      } }, h('span', { class: 'dot' }), itemLabel(type.id, it));
    }));
  }
  function renderRound() {
    roundDots.replaceChildren(...CYCLE_4THS.map(k => h('span', { class: 'chip-status' + (round.has(k) ? ' on' : ''), style: 'cursor:default;padding:3px 8px' }, h('span', { class: 'dot' }), ROOT_NAMES[k])));
  }
  function seqMode() { return type.seq && Settings.get().voicingSeq; }
  function statKey() { return type.id + (seqMode() ? '-251' : ''); }
  function renderKeysTable() {
    const key = statKey();
    const cells = CYCLE_4THS.map(k => { const a = agg('vk', key + ':' + k); return { k, a }; });
    const vals = cells.filter(c => c.a.avgMs != null).map(c => c.a.avgMs);
    if (!vals.length) { keysTable.replaceChildren(h('p', { class: 'note' }, 'Your average time per key will show here once you’ve played a few.')); return; }
    const table = h('table', { class: 'heat' },
      h('tr', null, h('th', null, ''), ...cells.map(c => h('th', { class: 'k', scope: 'col' }, ROOT_NAMES[c.k]))),
      h('tr', null, h('th', { scope: 'row' }, 'Avg'), ...cells.map(c => heatCell(c.a.avgMs))),
      h('tr', null, h('th', { scope: 'row' }, 'Best'), ...cells.map(c => heatCell(c.a.best))));
    keysTable.replaceChildren(h('div', { class: 'heat-wrap' }, table));
  }
  function updateStrip() { strip.update([['This session', String(sess.c)], ['Median', fmtSec(median(sess.ms))], ['Fastest', fmtSec(sess.ms.length ? Math.min(...sess.ms) : null)]]); }

  function nextRoot() {
    const order = Settings.get().voicingOrder;
    let k;
    if (order === 'cycle') { rootState.i = (rootState.i + 1) % 12; k = CYCLE_4THS[rootState.i]; }
    else if (order === 'chromatic') { rootState.i = (rootState.i + 1) % 12; k = rootState.i; }
    else if (order === 'random') k = pickKey(rootState.last);
    else {
      const key = statKey();
      const pool = [...Array(12).keys()].filter(x => x !== rootState.last);
      const fresh = pool.filter(x => !round.has(x));
      k = pickWeighted(fresh.length ? fresh : pool, x => {
        const a = agg('vk', key + ':' + x);
        if (a.n < 2) return 2.5;
        return 0.5 + clamp((a.avgMs ?? 9000) / 4000, 0, 3) + (1 - (a.recentAcc ?? 0)) * 2;
      });
    }
    rootState.last = k;
    return k;
  }
  function buildPrompt() {
    const root = nextRoot();
    if (seqMode()) {
      const alt = type.id === 'rlA' ? ['A', 'B', 'A'] : type.id === 'rlB' ? ['B', 'A', 'B'] : [null, null, null];
      const steps = [[mod12(root + 2), 'm7'], [mod12(root + 7), 'dom7'], [root, 'maj7']].map(([r, qq], i) => buildTarget(type.id, qq, r, alt[i]));
      return { root, steps, item: '251', label: `ii–V–I in ${ROOT_NAMES[root]}` };
    }
    const item = pickWeighted(items, it => adaptiveWeight('vc', type.id + ':' + it, 6000));
    return { root, item, steps: [buildTarget(type.id, item, root)] };
  }
  function render() {
    if (!q) return;
    const t = q.steps[q.step];
    keyLine.replaceChildren(document.createTextNode(q.steps.length > 1 ? q.label : (t.prefix || 'Chord')), timer);
    const sym = q.steps.length > 1
      ? h('div', { class: 'big-symbol', style: 'display:flex;gap:.35em;flex-wrap:wrap;justify-content:center' }, q.steps.map((st, i) => h('span', { style: { opacity: i === q.step ? '1' : i < q.step ? '0.35' : '0.55' } }, st.sym)))
      : h('div', { class: 'big-symbol' }, t.sym);
    center.replaceChildren(sym, h('div', { class: 'big-sub' }, t.sub));
    evaluate();
  }
  function notesNow() { return [...new Set([...MidiIO.heldNotes(), ...touch])].sort((a, b) => a - b); }
  function evaluate() {
    if (!q) { piano.setMarks(new Map([...touch].map(m => [m, { label: '', cls: 'down' }]))); return; }
    const t = q.steps[q.step], notes = notesNow();
    const base = t.keyLabels ? q.root : t.labelRoot;
    const marks = new Map();
    if (q.done) { for (const m of notes) marks.set(m, { label: labelFor(t, m, base), hue: hueForSemi(m - base), cls: 'down' }); piano.setMarks(marks); return; }
    if (q.revealed) for (const m of t.example) marks.set(m, { label: labelFor(t, m, base), hue: hueForSemi(m - base), cls: 'ghost' });
    let res = null;
    if (armed || !notes.length) {
      armed = true;
      res = checkVoicing(t.spec, notes);
      for (const m of notes) marks.set(m, { label: labelFor(t, m, base), hue: hueForSemi(m - base), cls: t.spec.allowed.has(mod12(m)) ? 'down' : 'down wrong' });
    } else for (const m of notes) marks.set(m, { label: '', cls: 'down' });
    piano.setMarks(marks);
    if (!res || !notes.length) return;
    if (res.ok) return stepDone();
    if (res.wrong.length) status.set(`${res.wrong.map(noteName).map(n => n.replace(/\d+$/, '')).join(', ')} ${res.wrong.length > 1 ? 'aren’t' : 'isn’t'} in this voicing.`, 'bad');
    else if (res.bassWrong && !res.missing.length) status.set('Right notes. Now put the root in the bass.', '');
    else if (res.orderWrong) status.set(t.spec.orders.length > 1 ? 'Right notes, wrong order for a drop 2.' : 'Right notes. Check the order from the bottom up.', '');
    else status.set('', '');
  }
  function labelFor(t, m, base) {
    if (t.keyLabels) return degBySemi(m - base).label;
    return (t.ext ? INTERVAL_LABELS : INTERVAL_LABELS_7)[mod12(m - base)];
  }
  function stepDone() {
    if (q.step < q.steps.length - 1) {
      q.step++; armed = false; touch.clear();
      status.set('Good. Next chord.', 'good');
      render();
      return;
    }
    const ms = performance.now() - q.start, clean = !q.revealed;
    clearInterval(timerId);
    timer.textContent = fmtSec(ms);
    const key = statKey();
    record('vc', type.id + ':' + q.item, clean, clean ? ms : null);
    record('vk', key + ':' + q.root, clean, clean ? ms : null);
    Activity.count('voice');
    if (clean) { sess.c++; sess.ms.push(ms); }
    round.add(q.root); if (round.size >= 12) { toast('All 12 keys done. Starting a new round.'); round.clear(); }
    renderRound(); updateStrip(); renderKeysTable();
    const t = q.steps[q.step];
    status.set(clean ? `Yes — ${fmtSec(ms)}${t.reveal ? ` · that’s ${t.reveal}` : ''}` : `Done${t.reveal ? ` · that’s ${t.reveal}` : ''}. Shown answers don’t count toward your times.`, 'good');
    q.done = true;
    const my = ++token;
    setTimeout(() => { if (my === token) next(); }, t.reveal ? 1500 : 800);
  }
  function next(skipped) {
    token++;
    started = true;
    if (skipped && q && !q.done) record('vc', type.id + ':' + q.item, false, null);
    q = buildPrompt(); q.step = 0; q.start = performance.now(); q.revealed = false; q.done = false;
    touch.clear();
    armed = MidiIO.held.size === 0;
    actions.hidden = false;
    clearBtn.hidden = !touch.size && !!MidiIO.input;
    status.set(MidiIO.input ? 'Play it on your keyboard.' : 'Tap the notes on the keyboard below.');
    clearInterval(timerId);
    timerId = setInterval(() => { if (q && !q.done) timer.textContent = fmtSec(performance.now() - q.start); }, 100);
    render();
    piano.centre(60);
  }
  function reveal() {
    if (!q || q.done) return;
    q.revealed = true; render(); hear();
  }
  async function hear() {
    if (!q) return;
    try { await AudioEngine.init(); } catch { return; }
    const t = q.steps[q.step];
    AudioEngine.stopAll();
    AudioEngine.chord(t.example, AudioEngine.t0(0.03), 1.6, 0.6, 0.02);
  }
  function tapKey(m) {
    AudioEngine.init().catch(() => {});
    if (touch.has(m)) touch.delete(m);
    else { touch.add(m); const v = AudioEngine.hold(m, 0.6); if (v) setTimeout(() => v.release(), 600); }
    clearBtn.hidden = false;
    if (!started) { evaluate(); return; }
    evaluate();
  }
  function showStart() {
    center.replaceChildren(startPanel('Start', MidiIO.input
      ? 'You’ll see a chord symbol. Play the voicing on your keyboard and the app checks it the moment it’s right, then times you.'
      : 'You’ll see a chord symbol. Play the voicing by tapping the keys below. With a MIDI keyboard connected, just play it.', () => next()));
    actions.hidden = true; status.set('');
    keyLine.replaceChildren(document.createTextNode('Chord'), h('b', null, type.name));
  }
  const unsub = MidiIO.subscribe(() => evaluate());
  const offMidi = Bus.on('midi', () => { if (!started) showStart(); });

  const el = h('div', { class: 'view' },
    h('div', { class: 'view-head' }, h('div', null, h('h1', null, 'Voicings'), h('p', { class: 'sub' }, 'See a chord symbol, play the voicing. It’s checked instantly and timed, and slow keys come up more often.'))),
    h('div', { class: 'toolbar' }, h('label', { class: 'field', for: 'voicing-type' }, h('span', null, 'Voicing'), typeSel), orderSel, seqField, triadField),
    desc, itemsRow,
    h('section', { class: 'stage', 'aria-label': 'Voicing trainer' },
      h('div', { class: 'stage-top' }, keyLine, status), center, actions, piano.el, roundDots, strip),
    h('div', { class: 'card' }, h('div', { class: 'card-head' }, h('h2', null, 'Your keys'), h('span', { class: 'note' }, 'Seconds to play it right, cycle of 4ths order')), keysTable),
    shortcutRow([['H', 'show me'], ['P', 'hear it'], ['S', 'skip'], ['Space', 'start']]));

  DEBUG.voicing = () => q;
  setTimeout(() => piano.centre(60), 0);
  renderItems(); renderControls(); renderRound(); updateStrip(); renderKeysTable(); showStart();
  return {
    el,
    destroy() { token++; clearInterval(timerId); unsub(); offMidi(); AudioEngine.stopAll(); },
    onKey(e) {
      if (e.code === 'Space' && !started) { e.preventDefault(); next(); return true; }
      if (!started) return false;
      if (e.code === 'KeyH') { reveal(); return true; }
      if (e.code === 'KeyP') { hear(); return true; }
      if (e.code === 'KeyS') { next(true); return true; }
      return false;
    },
  };
}
function heatCell(ms) {
  if (ms == null) return h('td', null, '–');
  const t = clamp((ms / 1000 - 2) / 8, 0, 1); // 2 s → fast, 10 s → slow
  const hue = Math.round(150 - t * 125);
  return h('td', { class: 'has', style: { background: `oklch(calc(var(--chip-l) + ${lumBump(hue).toFixed(1)}%) var(--chip-c) ${hue})` } }, (ms / 1000).toFixed(1));
}
