/* =====================================================================
   Ear training: scale degrees, chord qualities, progressions
   ===================================================================== */
const DEG_LEVELS = [
  { id: 'd1', name: 'Home base', blurb: '1, 3 and 5', degs: ['1', '3', '5'], minor: false, mode: 'single' },
  { id: 'd2', name: 'First five', blurb: 'degrees 1–5', degs: ['1', '2', '3', '4', '5'], minor: false, mode: 'single' },
  { id: 'd3', name: 'Major scale', blurb: 'all seven degrees', degs: MAJOR_DEGS, minor: false, mode: 'single' },
  { id: 'd4', name: 'Blue notes', blurb: 'major scale + ♭3 and ♭7', degs: ['1', '2', 'b3', '3', '4', '5', '6', 'b7', '7'], minor: false, mode: 'single' },
  { id: 'd5', name: 'All twelve', blurb: 'every chromatic degree', degs: ALL_DEGS, minor: false, mode: 'single' },
  { id: 'd6', name: 'Minor key', blurb: 'minor cadence, natural and raised 6/7', degs: ['1', '2', 'b3', '4', '5', 'b6', '6', 'b7', '7'], minor: true, mode: 'single' },
  { id: 'd7', name: 'Two at once', blurb: 'two diatonic degrees together', degs: MAJOR_DEGS, minor: false, mode: 'dyad' },
  { id: 'd8', name: 'Three-note melodies', blurb: 'short diatonic melodies, in order', degs: MAJOR_DEGS, minor: false, mode: 'melody', len: 3 },
];
const levelById = id => DEG_LEVELS.find(l => l.id === id) || DEG_LEVELS[1];
const CHORD_LEVELS = [
  { id: 'c1', name: 'Triads', q: ['maj', 'min', 'dim', 'aug', 'sus4'] },
  { id: 'c2', name: 'Core sevenths', q: ['maj7', 'm7', 'dom7', 'm7b5'] },
  { id: 'c3', name: 'More sevenths', q: ['maj7', 'm7', 'dom7', 'm7b5', 'dim7', 'mmaj7', 'sus7', 'maj6'] },
  { id: 'c4', name: 'Extensions', q: ['maj9', 'm9', 'dom9', 'dom13', 'maj7s11', 'm11'] },
  { id: 'c5', name: 'Altered dominants', q: ['dom7b9', 'dom7s9', 'dom7s11', 'alt', 'dom7b13', 'dom13'] },
];
const PROG_LEVELS = [
  { id: 'p1', name: 'Diatonic triads', blurb: 'I ii iii IV V vi', opts: ['I', 'ii', 'iii', 'IV', 'V', 'vi'], sevenths: false },
  { id: 'p2', name: 'Diatonic sevenths', blurb: 'all seven, as 7th chords', opts: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'viio'], sevenths: true },
  { id: 'p3', name: 'Borrowed & secondary', blurb: 'adds iv, ♭VII, ♭VI, ♭III, II7, III7, VI7', opts: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'iv', 'bVII', 'bVI', 'bIII', 'II7', 'III7', 'VI7'], sevenths: false },
];
const LOOPS = [
  ['I', 'V', 'vi', 'IV'], ['vi', 'IV', 'I', 'V'], ['I', 'vi', 'IV', 'V'], ['ii', 'V', 'I', 'vi'], ['I', 'IV', 'vi', 'V'],
  ['I', 'iii', 'IV', 'V'], ['IV', 'V', 'iii', 'vi'], ['I', 'vi', 'ii', 'V'], ['I', 'IV', 'I', 'V'], ['vi', 'ii', 'V', 'I'],
  ['IV', 'I', 'V', 'vi'], ['iii', 'vi', 'ii', 'V'], ['IV', 'viio', 'iii', 'vi'], ['ii', 'viio', 'I', 'IV'], ['I', 'IV', 'viio', 'iii'],
  ['I', 'bVII', 'IV', 'I'], ['I', 'bVI', 'bVII', 'I'], ['I', 'IV', 'iv', 'I'], ['I', 'III7', 'vi', 'IV'], ['I', 'VI7', 'ii', 'V'],
  ['I', 'II7', 'IV', 'I'], ['I', 'II7', 'V', 'I'], ['vi', 'bVI', 'bVII', 'I'], ['I', 'bIII', 'IV', 'I'], ['IV', 'iv', 'I', 'V'],
  ['I', 'bVII', 'bVI', 'bVII'], ['ii', 'V', 'III7', 'vi'],
];
const NEXT = {
  I: ['IV', 'V', 'vi', 'ii', 'iii', 'bVII', 'bVI', 'II7', 'III7', 'VI7', 'bIII'], ii: ['V', 'V', 'viio', 'IV', 'II7'], iii: ['vi', 'IV', 'ii', 'VI7'],
  IV: ['V', 'I', 'ii', 'vi', 'iii', 'iv'], V: ['I', 'vi', 'IV', 'III7'], vi: ['ii', 'IV', 'V', 'iii', 'bVI', 'II7'], viio: ['I', 'iii'],
  iv: ['I', 'V'], bVII: ['I', 'IV'], bVI: ['bVII', 'V', 'I'], bIII: ['IV', 'bVII'], II7: ['V', 'IV'], III7: ['vi', 'IV'], VI7: ['ii', 'V'],
};
function genProgression(level) {
  const ok = n => level.opts.includes(n);
  const loops = LOOPS.filter(l => l.every(ok) && (level.id !== 'p3' || l.some(n => !['I', 'ii', 'iii', 'IV', 'V', 'vi', 'viio'].includes(n)) || Math.random() < 0.3));
  if (loops.length && Math.random() < 0.5) return pick(loops).slice();
  for (let tries = 0; tries < 30; tries++) {
    const seq = [Math.random() < 0.6 ? 'I' : pick(level.opts.filter(n => n !== 'viio' && ok(n)))];
    while (seq.length < 4) {
      const prev = seq[seq.length - 1];
      const c = (NEXT[prev] || []).filter(n => ok(n) && n !== prev);
      if (!c.length) break;
      seq.push(pick(c));
    }
    const pingPong = seq.length === 4 && seq[0] === seq[2] && seq[1] === seq[3];
    if (seq.length === 4 && !pingPong) return seq;
  }
  return ['I', 'IV', 'V', 'I'].filter(ok).concat(['I', 'IV', 'V', 'I']).slice(0, 4);
}
function pickKey(prev) { let k; do { k = rnd(12); } while (k === prev); return k; }
function keyFor(prev) { const s = Settings.get(); return s.keyMode === 'fixed' ? Number(s.fixedKey) : pickKey(prev); }
function placeDegree(r, semi, range) {
  const opts = [];
  for (const o of [-12, 0, 12]) {
    const m = r + semi + o;
    if (range === 'narrow' ? (m >= r && m < r + 12) : (m >= r - 7 && m <= r + 19)) opts.push(m);
  }
  return opts.length ? pick(opts) : r + semi;
}

function levelControls(levels, current, onChange, labelFn) {
  return selectField('Level', levels.map(l => [l.id, labelFn(l)]), current, onChange);
}
function keyControls(onChange) {
  const s = Settings.get();
  const fixed = selectField('Key', ROOT_NAMES.map((n, i) => [i, n]), s.fixedKey, v => { Settings.set({ fixedKey: Number(v) }); onChange(); });
  fixed.hidden = s.keyMode !== 'fixed';
  const mode = selectField('Keys', [['random', 'New key each time'], ['fixed', 'Stay in one key']], s.keyMode, v => { Settings.set({ keyMode: v }); fixed.hidden = v !== 'fixed'; onChange(); });
  return [mode, fixed];
}

// ---------------- Scale-degree drill ----------------
function DegreeDrill() {
  let level = levelById(Settings.get().degLevel);
  let q = null, token = 0, lastKey = null, lastMinor = null, lastDeg = null, started = false, unsub = null;
  const sess = { n: 0, c: 0, ms: [] };

  const keyLine = h('div', { class: 'stage-key' }, 'Ready', h('b', null, 'Scale degrees'));
  const status = statusLine();
  const center = h('div', { class: 'stage-center' });
  const replayBtn = h('button', { type: 'button', class: 'btn', onclick: () => replay() }, icon('replay'), 'Replay', h('kbd', null, 'Space'));
  const cadBtn = h('button', { type: 'button', class: 'btn', onclick: () => replayCadence() }, 'Cadence', h('kbd', null, 'C'));
  const nextBtn = h('button', { type: 'button', class: 'btn primary', onclick: () => ask() }, 'Next', h('kbd', null, '↵'));
  const actions = h('div', { class: 'stage-actions' }, replayBtn, cadBtn, nextBtn);
  actions.hidden = true;
  const pad = DegreePad(id => answer(id));
  const strip = sessionStrip();
  const masteryLine = h('p', { class: 'note' });
  const midiHint = h('p', { class: 'note' });

  const levelSel = levelControls(DEG_LEVELS, level.id, v => {
    level = levelById(v); Settings.set({ degLevel: v }); refreshPad(); updateStrip();
    if (started) ask();
  }, l => `${l.name} · ${l.blurb}`);
  const [keyMode, fixedKey] = keyControls(() => { if (started) ask(); });

  const stage = h('section', { class: 'stage', 'aria-label': 'Scale degree drill' },
    h('div', { class: 'stage-top' }, keyLine, status), center, actions, pad.el, strip);
  const el = h('div', { class: 'drill' , style: 'display:flex;flex-direction:column;gap:16px' },
    h('div', { class: 'toolbar' }, levelSel, keyMode, fixedKey),
    stage,
    h('div', { style: 'display:flex;flex-direction:column;gap:6px' }, masteryLine, midiHint,
      shortcutRow([['1–7', 'answer'], ['⇧2 ⇧3 ⇧4 ⇧6 ⇧7', 'flat/sharp degrees'], ['Space', 'replay'], ['C', 'cadence'], ['↵', 'next']])));

  function refreshPad() {
    pad.setEnabled(level.degs); pad.clear();
    const m = mastery(level.minor ? 'degm' : 'deg', level.degs);
    masteryLine.textContent = `Level mastery: ${m.done} of ${m.total} degrees at 90%+ over your last 20 tries (15 tries minimum).`;
  }
  function updateStrip() {
    strip.update([['This session', `${sess.c}/${sess.n}`], ['Accuracy', fmtPct(sess.n ? sess.c / sess.n : null)], ['Median time', fmtSec(median(sess.ms))]]);
  }
  function setMidiHint() {
    midiHint.textContent = MidiIO.input ? `Answer on your keyboard: play the note in any octave.` : '';
  }
  function showStart() {
    center.replaceChildren(startPanel('Start', 'You’ll hear a cadence that sets the key, then one note. Name it as a scale degree. Each question uses a new key, so listen for how the note feels against the tonic.', () => ask()));
    actions.hidden = true; status.set('');
  }

  function buildQuestion() {
    const keyPc = keyFor(lastKey), minor = level.minor, r = tonicMidi(keyPc), range = Settings.get().range;
    const cat = minor ? 'degm' : 'deg';
    const w = id => adaptiveWeight(cat, id) * (id === lastDeg ? 0.25 : 1);
    let degs, notes;
    if (level.mode === 'single') {
      degs = [pickWeighted(level.degs, w)];
      notes = [placeDegree(r, DEG[degs[0]].semi, range)];
    } else if (level.mode === 'dyad') {
      const a = pickWeighted(level.degs, w);
      let b; do { b = pick(level.degs); } while (b === a);
      degs = [a, b];
      const lowFirst = Math.random() < 0.5 ? a : b, high = lowFirst === a ? b : a;
      const m1 = placeDegree(r, DEG[lowFirst].semi, 'narrow');
      notes = [m1, m1 + mod12(DEG[high].semi - DEG[lowFirst].semi)];
    } else {
      const idx = [rnd(7)];
      while (idx.length < level.len) {
        let nx; do { nx = idx[idx.length - 1] + pick([-2, -1, -1, 1, 1, 2, 3, -3]); } while (nx < 0 || nx > 6);
        idx.push(nx);
      }
      degs = idx.map(i => MAJOR_DEGS[i]);
      notes = [];
      for (const d of degs) {
        const semi = DEG[d].semi;
        if (!notes.length) notes.push(placeDegree(r, semi, 'narrow'));
        else { const prev = notes[notes.length - 1]; let m = r + semi; while (m - prev > 6) m -= 12; while (prev - m > 6) m += 12; notes.push(m); }
      }
    }
    lastDeg = degs[0];
    return { keyPc, minor, cat, degs, notes, sel: [], answered: false, finished: false, wrongs: 0, accepting: false };
  }
  function playTarget(t) {
    if (level.mode === 'single') AudioEngine.note(q.notes[0], t, 1.3, 0.72);
    else if (level.mode === 'dyad') AudioEngine.chord(q.notes, t, 1.7, 0.66);
    else q.notes.forEach((m, i) => AudioEngine.note(m, t + i * 0.62, 0.58, 0.72));
    return t + (level.mode === 'melody' ? q.notes.length * 0.62 : 1.3);
  }
  async function ask() {
    const my = ++token;
    started = true;
    try { await AudioEngine.init(); } catch (e) { status.set(e.message, 'bad'); return; }
    if (my !== token) return;
    AudioEngine.stopAll();
    q = buildQuestion();
    pad.clear(); refreshPad();
    actions.hidden = false; nextBtn.hidden = true;
    keyLine.replaceChildren(document.createTextNode('Key'), h('b', null, keyName(q.keyPc, q.minor)));
    center.replaceChildren(level.mode === 'melody' ? slotsView() : mysteryView());
    status.set('Listen…');
    const s = Settings.get();
    let t = AudioEngine.t0(0.08);
    const keyChanged = q.keyPc !== lastKey || q.minor !== lastMinor;
    if (s.context === 'cadence-drone') { if (keyChanged || !AudioEngine.drone) AudioEngine.startDrone(q.keyPc); }
    else AudioEngine.stopDrone();
    if (s.cadenceEvery === 'question' || keyChanged) t = AudioEngine.playCadence(q.keyPc, q.minor, t);
    lastKey = q.keyPc; lastMinor = q.minor;
    q.startPerf = AudioEngine.perfAt(t);
    playTarget(t);
    await AudioEngine.until(t);
    if (my !== token) return;
    q.accepting = true;
    status.set(level.mode === 'single' ? 'Which degree?' : level.mode === 'dyad' ? 'Which two degrees? Pick both.' : 'Enter the three degrees in order.');
  }
  function replay() {
    if (!q) return ask();
    AudioEngine.stopAll();
    playTarget(AudioEngine.t0(0.04));
  }
  function replayCadence() {
    if (!q) return;
    AudioEngine.stopAll();
    const t = AudioEngine.playCadence(q.keyPc, q.minor, AudioEngine.t0(0.04));
    playTarget(t);
  }
  function mysteryView(found) {
    const cls = level.mode === 'single' ? 'xl' : 'lg';
    return h('div', { class: 'slots', 'aria-label': found ? 'Answer' : 'Waiting for your answer' },
      (found || q.degs.map(() => null)).map(id => id ? degChip(id, cls + ' pop') : h('span', { class: 'deg-chip unknown ' + cls }, '?')));
  }
  function slotsView() {
    const wrap = h('div', { class: 'slots', 'aria-label': 'Your answer' });
    for (let i = 0; i < level.len; i++) {
      const id = q.sel[i];
      const cls = 'slot' + (id ? ' filled' : '') + (i === q.sel.length && !q.finished ? ' current' : '') + (q.finished ? (q.sel[i] === q.degs[i] ? ' good' : ' bad') : '');
      wrap.append(h('div', { class: cls }, id ? degLabel(id) : ''));
    }
    if (q.finished && q.sel.some((d, i) => d !== q.degs[i])) {
      wrap.append(h('p', { class: 'note', style: 'width:100%' }, 'Answer: ', q.degs.map(degLabel).join(' – ')));
    }
    return wrap;
  }
  function answer(id) {
    if (!q || !q.accepting || q.finished) return;
    Activity.count('ear');
    const rt = performance.now() - q.startPerf;
    if (level.mode === 'single') {
      const target = q.degs[0], ok = id === target;
      if (!q.answered) {
        q.answered = true;
        record(q.cat, target, ok, ok ? rt : null);
        if (!ok) recordConfusion(q.cat, target, id);
        sess.n++; if (ok) { sess.c++; sess.ms.push(rt); }
        updateStrip();
      }
      if (ok) {
        q.finished = true; pad.mark(id, 'good');
        center.replaceChildren(mysteryView([id]));
        status.set(`${degLabel(id)} — ${q.wrongs ? 'got it' : fmtSec(rt)}`, 'good');
        finish();
      } else {
        q.wrongs++; pad.mark(id, 'bad');
        status.set(`Not ${degLabel(id)}. Compare the two.`, 'bad');
        AudioEngine.stopAll();
        const t = AudioEngine.t0(0.04), tn = q.notes[0];
        AudioEngine.note(tn - DEG[target].semi + DEG[id].semi, t, 0.55, 0.6);
        AudioEngine.note(tn, t + 0.8, 1.0, 0.74);
        if (q.wrongs >= 2) pad.mark(target, 'hint');
      }
      return;
    }
    if (level.mode === 'dyad') {
      if (q.sel.includes(id)) { q.sel = q.sel.filter(x => x !== id); pad.unmark(id, 'sel'); return; }
      q.sel.push(id); pad.mark(id, 'sel');
      if (q.sel.length < 2) return;
      const ok = q.degs.every(d => q.sel.includes(d));
      for (const d of q.degs) record(q.cat, d, q.sel.includes(d), ok ? rt : null);
      sess.n++; if (ok) { sess.c++; sess.ms.push(rt); }
      q.finished = true; pad.clear();
      for (const d of q.sel) pad.mark(d, q.degs.includes(d) ? 'good' : 'bad');
      for (const d of q.degs) if (!q.sel.includes(d)) pad.mark(d, 'hint');
      status.set(ok ? `${q.degs.map(degLabel).join(' + ')} — ${fmtSec(rt)}` : `It was ${q.degs.map(degLabel).join(' + ')}.`, ok ? 'good' : 'bad');
      center.replaceChildren(mysteryView(q.notes.slice().sort((a, b) => a - b).map(m => degBySemi(m - q.keyPc).id)));
      updateStrip();
      // Play the two notes one after the other so you can hear each
      AudioEngine.stopAll();
      const t = AudioEngine.t0(0.05), lo = Math.min(...q.notes), hi = Math.max(...q.notes);
      AudioEngine.note(lo, t, 0.5, 0.65); AudioEngine.note(hi, t + 0.55, 0.5, 0.65); AudioEngine.chord(q.notes, t + 1.15, 1.0, 0.6);
      finish(ok, t + 2.2);
      return;
    }
    // melody
    q.sel.push(id);
    pad.clear(); pad.mark(id, 'sel');
    if (q.sel.length >= level.len) {
      const ok = q.sel.every((d, i) => d === q.degs[i]);
      q.degs.forEach((d, i) => record(q.cat, d, q.sel[i] === d, null));
      sess.n++; if (ok) { sess.c++; sess.ms.push(rt); }
      q.finished = true; pad.clear();
      status.set(ok ? `Correct — ${fmtSec(rt)}` : 'Not quite. Listen again.', ok ? 'good' : 'bad');
      updateStrip();
      if (!ok) { AudioEngine.stopAll(); playTarget(AudioEngine.t0(0.3)); }
      finish(ok, AudioEngine.now() + (ok ? 0.2 : 2.6));
    }
    center.replaceChildren(slotsView());
  }
  async function finish(ok = true, endAt) {
    const my = token, s = Settings.get();
    nextBtn.hidden = false;
    let end = endAt ?? AudioEngine.now();
    if (level.mode === 'single' && s.resolve) {
      const notes = resolutionNotes(q.notes[0], q.degs[0], q.minor);
      const t = AudioEngine.t0(0.05);
      notes.forEach((m, i) => AudioEngine.note(m, t + i * 0.3, i === notes.length - 1 ? 0.9 : 0.34, 0.6));
      end = t + (notes.length - 1) * 0.3 + 0.7;
    }
    if (!s.autoNext || !ok) return;
    await AudioEngine.until(end + 0.4);
    if (my === token && q && q.finished) ask();
  }
  function onMidi(type, n) {
    if (type !== 'on' || !q || !q.accepting || q.finished) return;
    answer(degBySemi(n - q.keyPc).id);
  }
  unsub = MidiIO.subscribe(onMidi);
  const offMidi = Bus.on('midi', setMidiHint);
  const offSettings = Bus.on('settings', () => pad.applyLabels());
  DEBUG.degree = () => q;
  refreshPad(); updateStrip(); setMidiHint(); showStart();
  return {
    el,
    destroy() { token++; unsub(); offMidi(); offSettings(); AudioEngine.stopAll(); AudioEngine.stopDrone(); },
    onKey(e) {
      if (e.code === 'Space') { e.preventDefault(); if (!started) ask(); else if (q && q.finished) ask(); else replay(); return true; }
      if (e.code === 'Enter') { e.preventDefault(); ask(); return true; }
      if (e.code === 'KeyC' && !e.metaKey && !e.ctrlKey) { replayCadence(); return true; }
      if (e.code === 'Backspace' && level.mode === 'melody' && q && !q.finished && q.sel.length) { q.sel.pop(); center.replaceChildren(slotsView()); return true; }
      const d = keyToDegree(e);
      if (d && level.degs.includes(d)) { e.preventDefault(); answer(d); return true; }
      return false;
    },
  };
}

// ---------------- Chord-quality drill ----------------
function ChordDrill() {
  let level = CHORD_LEVELS.find(l => l.id === Settings.get().chordLevel) || CHORD_LEVELS[1];
  let q = null, token = 0, started = false, last = null;
  const sess = { n: 0, c: 0, ms: [] };
  const keyLine = h('div', { class: 'stage-key' }, 'Ready', h('b', null, 'Chord qualities'));
  const status = statusLine();
  const center = h('div', { class: 'stage-center' });
  const grid = h('div', { class: 'answer-grid', role: 'group', 'aria-label': 'Chord qualities' });
  const strip = sessionStrip();
  const nextBtn = h('button', { type: 'button', class: 'btn primary', onclick: () => ask() }, 'Next', h('kbd', null, '↵'));
  const actions = h('div', { class: 'stage-actions' },
    h('button', { type: 'button', class: 'btn', onclick: () => replay() }, icon('replay'), 'Replay', h('kbd', null, 'Space')),
    h('button', { type: 'button', class: 'btn', onclick: () => replay(true) }, 'Arpeggiate', h('kbd', null, 'A')), nextBtn);
  actions.hidden = true;
  const modeSeg = segmented([['name', 'Name it'], ['play', 'Play it back']], Settings.get().chordMode, v => { Settings.set({ chordMode: v }); renderGrid(); if (started) ask(); }, 'Answer mode');
  // Touch input for "play it back": tap keys on/off
  const touchHandler = m => {
    if (!q || q.finished) return;
    AudioEngine.init().catch(() => {});
    if (q.touch.has(m)) q.touch.delete(m);
    else { q.touch.add(m); const v = AudioEngine.hold(m, 0.6); if (v) setTimeout(() => v.release(), 700); }
    if (!q.touch.size) { piano.setMarks(new Map()); return; }
    checkPlayed([...q.touch].sort((a, b) => a - b));
  };
  const piano = Piano({ lo: 36, hi: 84, onDown: touchHandler });
  const pianoWrap = h('div', null, piano.el);
  const levelSel = levelControls(CHORD_LEVELS, level.id, v => { level = CHORD_LEVELS.find(l => l.id === v); Settings.set({ chordLevel: v }); renderGrid(); if (started) ask(); }, l => `${l.name} · ${l.q.map(k => QUAL[k].sym || 'maj').join(' ')}`);
  const arpTg = toggleField('Arpeggiate first', Settings.get().arpeggiate, v => Settings.set({ arpeggiate: v }));
  const stage = h('section', { class: 'stage', 'aria-label': 'Chord quality drill' }, h('div', { class: 'stage-top' }, keyLine, status), center, actions, grid, pianoWrap, strip);
  const playNote = h('p', { class: 'note' });
  const el = h('div', { style: 'display:flex;flex-direction:column;gap:16px' },
    h('div', { class: 'toolbar' }, levelSel, h('div', { class: 'field' }, h('span', null, 'Answer by'), modeSeg), h('div', { class: 'field' }, h('span', null, ' '), arpTg)),
    stage, playNote, shortcutRow([['1–9', 'answer'], ['Space', 'replay'], ['A', 'arpeggiate'], ['↵', 'next']]));

  function renderGrid() {
    const play = Settings.get().chordMode === 'play';
    grid.replaceChildren();
    grid.hidden = play; pianoWrap.hidden = !play;
    playNote.textContent = play ? (MidiIO.input ? 'Play the chord you hear on your keyboard, root in the bass. Any voicing and octave works; the 5th is optional.' : 'Tap the notes of the chord on the keyboard, root lowest. Connect a MIDI keyboard to play it for real.') : '';
    level.q.forEach((k, i) => grid.append(h('button', { type: 'button', 'data-q': k, onclick: () => answer(k) }, h('b', null, QUAL[k].sym || 'maj'), h('small', null, `${i + 1} · ${QUAL[k].name}`))));
  }
  function updateStrip() { strip.update([['This session', `${sess.c}/${sess.n}`], ['Accuracy', fmtPct(sess.n ? sess.c / sess.n : null)], ['Median time', fmtSec(median(sess.ms))]]); }
  function notesFor(rootPc, qual) { const bass = 36 + mod12(rootPc); return QUAL[qual].play.map(i => bass + i); }
  function playChord(t, notes, arp) {
    if (arp) { notes.forEach((m, i) => AudioEngine.note(m, t + i * 0.13, 0.5, 0.6)); t += notes.length * 0.13 + 0.2; }
    AudioEngine.chord(notes, t, 1.9, 0.6);
    return t;
  }
  async function ask() {
    const my = ++token; started = true;
    try { await AudioEngine.init(); } catch (e) { status.set(e.message, 'bad'); return; }
    if (my !== token) return;
    AudioEngine.stopAll();
    const qual = pickWeighted(level.q, k => adaptiveWeight('chq', k, 3000) * (k === last ? 0.3 : 1));
    last = qual;
    const rootPc = rnd(12);
    q = { qual, rootPc, notes: notesFor(rootPc, qual), answered: false, finished: false, touch: new Set() };
    for (const b of grid.children) b.classList.remove('good', 'bad', 'hint');
    keyLine.replaceChildren(document.createTextNode('Root'), h('b', null, Settings.get().chordMode === 'play' ? '?' : ROOT_NAMES[rootPc]));
    center.replaceChildren(); actions.hidden = false; nextBtn.hidden = true;
    piano.setMarks(new Map());
    status.set('Listen…');
    const t = playChord(AudioEngine.t0(0.06), q.notes, Settings.get().arpeggiate);
    q.startPerf = AudioEngine.perfAt(t);
    await AudioEngine.until(t);
    if (my !== token) return;
    status.set(Settings.get().chordMode === 'play' ? 'Play it back.' : 'What quality is it?');
  }
  function replay(arp) { if (!q) return ask(); AudioEngine.stopAll(); playChord(AudioEngine.t0(0.04), q.notes, !!arp); }
  function answer(k) {
    if (!q || q.finished) return;
    Activity.count('ear');
    const ok = k === q.qual, rt = performance.now() - q.startPerf;
    if (!q.answered) {
      q.answered = true; record('chq', q.qual, ok, ok ? rt : null);
      if (!ok) recordConfusion('chq', q.qual, k);
      sess.n++; if (ok) { sess.c++; sess.ms.push(rt); } updateStrip();
    }
    const btn = grid.querySelector(`[data-q="${k}"]`);
    if (ok) {
      q.finished = true; btn?.classList.add('good');
      keyLine.querySelector('b').textContent = chordSym(q.rootPc, q.qual);
      status.set(`${QUAL[k].name} — ${fmtSec(rt)}`, 'good');
      nextBtn.hidden = false;
      autoNext(1.1);
    } else {
      btn?.classList.add('bad');
      status.set(`Not ${QUAL[k].sym || 'major'}. Hear the difference.`, 'bad');
      AudioEngine.stopAll();
      const t = AudioEngine.t0(0.04);
      AudioEngine.chord(notesFor(q.rootPc, k), t, 1.0, 0.55);
      AudioEngine.chord(q.notes, t + 1.25, 1.4, 0.6);
    }
  }
  async function autoNext(delay) {
    const my = token;
    if (!Settings.get().autoNext) return;
    await sleep(delay * 1000);
    if (my === token && q?.finished) ask();
  }
  function checkPlayed(notes) {
    if (!q || q.finished || !notes.length) return;
    const pcs = new Set(notes.map(mod12)), target = qualPcs(q.rootPc, q.qual);
    const fifth = mod12(q.rootPc + 7);
    const required = target.filter(p => !(p === fifth && QUAL[q.qual].iv.includes(7) && target.length > 3));
    const lowest = mod12(Math.min(...notes));
    const wrong = [...pcs].filter(p => !target.includes(p));
    piano.setMarks(new Map(notes.map(n => [n, { label: INTERVAL_LABELS[mod12(n - lowest)], hue: hueForSemi(n - lowest), cls: target.includes(mod12(n)) ? 'down' : 'down wrong' }])));
    const ok = !wrong.length && required.every(p => pcs.has(p)) && lowest === q.rootPc;
    if (ok) {
      const rt = performance.now() - q.startPerf;
      if (!q.answered) { q.answered = true; record('chq', q.qual, true, rt); sess.n++; sess.c++; sess.ms.push(rt); updateStrip(); }
      q.finished = true; Activity.count('ear');
      keyLine.querySelector('b').textContent = chordSym(q.rootPc, q.qual);
      status.set(`${chordSym(q.rootPc, q.qual)} — ${fmtSec(rt)}`, 'good');
      nextBtn.hidden = false;
      autoNext(1.4);
    } else if (notes.length >= target.length && wrong.length) status.set('Not quite — some notes aren’t in the chord.', 'bad');
  }
  const unsub = MidiIO.subscribe(() => {
    if (Settings.get().chordMode !== 'play') return;
    const held = MidiIO.heldNotes();
    if (held.length) checkPlayed(held); else if (!q?.finished) piano.setMarks(new Map());
  });
  DEBUG.chord = () => q;
  setTimeout(() => piano.centre(60), 0);
  renderGrid(); updateStrip();
  center.replaceChildren(startPanel('Start', 'You’ll hear a chord with its root in the bass. Name its quality, or switch to “Play it back” and find it on the keyboard.', () => ask()));
  const offMidi = Bus.on('midi', renderGrid);
  return {
    el,
    destroy() { token++; unsub(); offMidi(); AudioEngine.stopAll(); },
    onKey(e) {
      if (e.code === 'Space') { e.preventDefault(); if (!started || q?.finished) ask(); else replay(); return true; }
      if (e.code === 'Enter') { e.preventDefault(); ask(); return true; }
      if (e.code === 'KeyA') { replay(true); return true; }
      const m = /^Digit([1-9])$/.exec(e.code);
      if (m && Settings.get().chordMode !== 'play') { const k = level.q[Number(m[1]) - 1]; if (k) { answer(k); return true; } }
      return false;
    },
  };
}

// ---------------- Progression drill ----------------
function ProgressionDrill() {
  let level = PROG_LEVELS.find(l => l.id === Settings.get().progLevel) || PROG_LEVELS[0];
  let q = null, token = 0, started = false, lastKey = null, needRelease = false;
  const sess = { n: 0, c: 0 };
  const keyLine = h('div', { class: 'stage-key' }, 'Ready', h('b', null, 'Progressions'));
  const status = statusLine();
  const center = h('div', { class: 'stage-center' });
  const grid = h('div', { class: 'answer-grid numerals', role: 'group', 'aria-label': 'Roman numerals' });
  const strip = sessionStrip();
  const nextBtn = h('button', { type: 'button', class: 'btn primary', onclick: () => ask() }, 'Next', h('kbd', null, '↵'));
  const undoBtn = h('button', { type: 'button', class: 'btn', onclick: () => undo() }, 'Undo', h('kbd', null, '⌫'));
  const actions = h('div', { class: 'stage-actions' },
    h('button', { type: 'button', class: 'btn', onclick: () => replay() }, icon('replay'), 'Replay', h('kbd', null, 'Space')),
    h('button', { type: 'button', class: 'btn', onclick: () => replay(true) }, 'With cadence', h('kbd', null, 'C')), undoBtn, nextBtn);
  actions.hidden = true;
  const levelSel = levelControls(PROG_LEVELS, level.id, v => { level = PROG_LEVELS.find(l => l.id === v); Settings.set({ progLevel: v }); renderGrid(); if (started) ask(); }, l => `${l.name} · ${l.blurb}`);
  const [keyMode, fixedKey] = keyControls(() => { if (started) ask(); });
  const midiNote = h('p', { class: 'note' });
  const stage = h('section', { class: 'stage', 'aria-label': 'Progression drill' }, h('div', { class: 'stage-top' }, keyLine, status), center, actions, grid, strip);
  const el = h('div', { style: 'display:flex;flex-direction:column;gap:16px' }, h('div', { class: 'toolbar' }, levelSel, keyMode, fixedKey), stage, midiNote,
    shortcutRow([['Space', 'replay'], ['C', 'with cadence'], ['⌫', 'undo'], ['↵', 'next']]));

  function renderGrid() {
    grid.replaceChildren(...level.opts.map(n => h('button', { type: 'button', 'data-n': n, onclick: () => answer(n) }, h('b', null, NUMERALS[n].label), NUM_HINT[n] ? h('small', null, NUM_HINT[n]) : null)));
    midiNote.textContent = MidiIO.input ? 'You can also play each chord on your keyboard, root in the bass. The app works out which numeral you played.' : '';
  }
  function updateStrip() { strip.update([['This session', `${sess.c}/${sess.n} progressions`], ['Chords right', `${sess.chords || 0}/${sess.n * 4}`]]); }
  function voicings(keyPc, nums) {
    let prev = null, prevBass = null;
    return nums.map(n => {
      const N = NUMERALS[n], rootPc = mod12(keyPc + N.root), qual = level.sevenths ? N.q7 : N.q;
      const pcs = qualPcs(rootPc, qual);
      const upper = voiceLead(pcs, prev, 55, 76);
      let bass = 36 + rootPc; if (prevBass != null && bass - prevBass > 6) bass -= 12; if (bass < 33) bass += 12;
      prev = upper; prevBass = bass;
      return [bass, ...upper];
    });
  }
  function playProg(t, withCadence) {
    if (withCadence) t = AudioEngine.playCadence(q.keyPc, false, t) + 0.25;
    const gap = AudioEngine.cadenceGap() * 1.6;
    q.chords.forEach((ch, i) => AudioEngine.chord(ch, t + i * gap, gap * 0.95, 0.58));
    return t;
  }
  function slotsView() {
    const wrap = h('div', { class: 'slots', 'aria-label': 'Your answer' });
    for (let i = 0; i < 4; i++) {
      const n = q.sel[i];
      let cls = 'slot' + (n ? ' filled' : '') + (i === q.sel.length && !q.finished ? ' current' : '');
      if (q.finished) cls += q.sel[i] === q.nums[i] ? ' good' : ' bad';
      const slot = h('button', { type: 'button', class: cls, 'aria-label': `Chord ${i + 1}`, onclick: () => playOne(i) }, n ? NUMERALS[n].label : '');
      wrap.append(slot);
    }
    if (q.finished && !q.correct) wrap.append(h('p', { class: 'note', style: 'width:100%' }, 'Answer: ', q.nums.map(n => NUMERALS[n].label).join(' – '), ` in ${ROOT_NAMES[q.keyPc]}: `, q.nums.map(n => chordSym(mod12(q.keyPc + NUMERALS[n].root), level.sevenths ? NUMERALS[n].q7 : NUMERALS[n].q)).join(' – ')));
    return wrap;
  }
  function playOne(i) { if (!q) return; AudioEngine.stopAll(); AudioEngine.chord(q.chords[i], AudioEngine.t0(0.03), 1.2, 0.6); }
  async function ask() {
    const my = ++token; started = true;
    try { await AudioEngine.init(); } catch (e) { status.set(e.message, 'bad'); return; }
    if (my !== token) return;
    AudioEngine.stopAll();
    const keyPc = keyFor(lastKey); lastKey = keyPc;
    const nums = genProgression(level);
    q = { keyPc, nums, sel: [], finished: false };
    q.chords = voicings(keyPc, nums);
    for (const b of grid.children) b.classList.remove('good', 'bad');
    keyLine.replaceChildren(document.createTextNode('Key'), h('b', null, keyName(keyPc, false)));
    center.replaceChildren(slotsView()); actions.hidden = false; nextBtn.hidden = true; undoBtn.hidden = false;
    status.set('Listen to the cadence, then the four chords…');
    const t = playProg(AudioEngine.t0(0.08), true);
    await AudioEngine.until(t);
    if (my !== token) return;
    status.set('Enter the four chords.');
  }
  function replay(withCadence) { if (!q) return ask(); AudioEngine.stopAll(); playProg(AudioEngine.t0(0.05), !!withCadence); }
  function undo() { if (!q || q.finished || !q.sel.length) return; q.sel.pop(); center.replaceChildren(slotsView()); }
  function answer(n) {
    if (!q || q.finished) return;
    q.sel.push(n); Activity.count('ear');
    if (q.sel.length === 4) {
      q.finished = true;
      let right = 0;
      q.nums.forEach((t, i) => { const ok = q.sel[i] === t; if (ok) right++; record('prg', t, ok, null); if (!ok) recordConfusion('prg', t, q.sel[i]); });
      q.correct = right === 4;
      sess.n++; if (q.correct) sess.c++; sess.chords = (sess.chords || 0) + right;
      updateStrip();
      status.set(q.correct ? 'All four right.' : `${right} of 4 right. Tap a chord to hear it.`, q.correct ? 'good' : 'bad');
      nextBtn.hidden = false; undoBtn.hidden = true;
      if (q.correct && Settings.get().autoNext) { const my = token; setTimeout(() => { if (my === token) ask(); }, 1500); }
    }
    center.replaceChildren(slotsView());
  }
  function identify(notes) {
    if (notes.length < 3) return null;
    const pcs = new Set(notes.map(mod12)), bass = mod12(notes[0]);
    for (const n of level.opts) {
      const N = NUMERALS[n], root = mod12(q.keyPc + N.root);
      if (root !== bass) continue;
      const triad = qualPcs(root, N.q).slice(0, 3);
      const extra = level.sevenths ? qualPcs(root, N.q7) : triad.concat(qualPcs(root, N.q7));
      if (triad.every(p => pcs.has(p)) && [...pcs].every(p => extra.includes(p))) return n;
    }
    return '?';
  }
  const unsub = MidiIO.subscribe(() => {
    if (!q || q.finished) return;
    const notes = MidiIO.heldNotes();
    if (!notes.length) { needRelease = false; return; }
    if (needRelease) return;
    clearTimeout(q.idTimer);
    q.idTimer = setTimeout(() => {
      const n = identify(MidiIO.heldNotes());
      if (!n) return;
      if (n === '?') { status.set('That chord isn’t one of the options at this level.', 'bad'); needRelease = true; return; }
      needRelease = true; answer(n);
    }, 140);
  });
  DEBUG.prog = () => q;
  renderGrid(); updateStrip();
  center.replaceChildren(startPanel('Start', 'A cadence sets the key, then you hear four chords. Write them down as Roman numerals.', () => ask()));
  const offMidi = Bus.on('midi', renderGrid);
  return {
    el,
    destroy() { token++; unsub(); offMidi(); AudioEngine.stopAll(); },
    onKey(e) {
      if (e.code === 'Space') { e.preventDefault(); if (!started || q?.finished) ask(); else replay(); return true; }
      if (e.code === 'Enter') { e.preventDefault(); ask(); return true; }
      if (e.code === 'KeyC') { replay(true); return true; }
      if (e.code === 'Backspace') { undo(); return true; }
      return false;
    },
  };
}

function EarView(sub) {
  const tabs = [['degrees', 'Degrees'], ['chords', 'Chord qualities'], ['progressions', 'Progressions']];
  let current = tabs.some(t => t[0] === sub) ? sub : 'degrees';
  let drill = null;
  const body = h('div');
  const seg = segmented(tabs, current, v => show(v), 'Ear training type');
  const el = h('div', { class: 'view' },
    h('div', { class: 'view-head' }, h('div', null, h('h1', null, 'Ear training'), h('p', { class: 'sub' }, 'Hear each note as a scale degree in a key, then move on to chord colours and whole progressions.')), seg),
    body);
  function show(id) {
    drill?.destroy();
    current = id; seg.setValue(id);
    try { history.replaceState(null, '', '#ear-' + id); } catch { /* sandboxed */ }
    drill = id === 'chords' ? ChordDrill() : id === 'progressions' ? ProgressionDrill() : DegreeDrill();
    body.replaceChildren(drill.el);
  }
  show(current);
  return { el, destroy() { drill?.destroy(); }, onKey(e) { return drill?.onKey?.(e); } };
}
