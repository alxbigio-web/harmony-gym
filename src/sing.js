/* =====================================================================
   Singing: degrees, chord tones and a drone, with live pitch detection
   ===================================================================== */
const CT_LEVELS = [
  { id: 'ct1', name: 'Root, 3rd and 5th', blurb: 'major and minor triads', tones: ['R', '3', '5'], quals: ['maj', 'min'] },
  { id: 'ct2', name: 'Bass and guide tones', blurb: 'root, 3rd and 7th of 7th chords', tones: ['R', '3', '7'], quals: ['maj7', 'm7', 'dom7'] },
  { id: 'ct3', name: 'Inner voices', blurb: '3rd, 5th and 7th', tones: ['3', '5', '7'], quals: ['maj7', 'm7', 'dom7', 'm7b5'] },
  { id: 'ct4', name: 'Colour tones', blurb: '9ths, 11ths and 13ths', tones: ['9', '11', '13'], quals: ['maj9', 'm9', 'dom9', 'dom13', 'm11'] },
];
const TONE_NAMES = { R: 'root', '3': '3rd', '5': '5th', '7': '7th', '9': '9th', '11': '11th', '13': '13th' };
function toneInterval(tone, q) {
  const iv = QUAL[q].iv;
  const find = set => { const x = iv.find(i => set.includes(i)); return x == null ? null : mod12(x); };
  return { R: 0, '3': find([3, 4]), '5': find([6, 7, 8]), '7': find([9, 10, 11]), '9': find([13, 14, 15]), '11': find([17, 18]), '13': find([20, 21]) }[tone];
}
const PATTERNS = [
  { id: 'up3', name: '1 2 3 2 1', seq: ['1', '2', '3', '2', '1'] },
  { id: 'up5', name: '1 2 3 4 5 4 3 2 1', seq: ['1', '2', '3', '4', '5', '4', '3', '2', '1'] },
  { id: 'arp', name: '1 3 5 3 1', seq: ['1', '3', '5', '3', '1'] },
  { id: 'down5', name: '5 4 3 2 1', seq: ['5', '4', '3', '2', '1'] },
  { id: 'lead', name: '1 7 1 2 1', seq: ['1', '7', '1', '2', '1'] },
  { id: 'six', name: '5 6 5 3 1', seq: ['5', '6', '5', '3', '1'] },
  { id: 'blues', name: '1 ♭3 4 5 ♭7 1', seq: ['1', 'b3', '4', '5', 'b7', '1'] },
  { id: 'rand', name: 'Random degrees 1–5', seq: null },
];
function refMidi(pc) { const lo = Settings.get().voice === 'high' ? 60 : 48; return lo + mod12(pc - lo); }
function centsTo(midi, targetPc) { let d = midi - targetPc; d -= 12 * Math.round(d / 12); return d * 100; }
function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

function Meter() {
  const zone = h('div', { class: 'meter-zone' });
  const dot = h('div', { class: 'meter-dot idle' });
  const track = h('div', { class: 'meter-track', role: 'img', 'aria-label': 'Pitch meter' }, zone, h('div', { class: 'meter-center' }), dot);
  const hold = h('i');
  const el = h('div', { class: 'meter' }, track, h('div', { class: 'meter-scale' }, h('span', null, '−60¢ flat'), h('span', null, 'in tune'), h('span', null, 'sharp +60¢')), h('div', { class: 'hold-bar' }, hold));
  return {
    el,
    setTol(t) { const w = (t / 60) * 50; zone.style.left = (50 - w) + '%'; zone.style.width = (2 * w) + '%'; },
    set(cents) {
      if (cents == null) { dot.classList.add('idle'); dot.style.left = '50%'; return; }
      dot.classList.remove('idle');
      dot.style.left = (50 + clamp(cents, -60, 60) / 60 * 50) + '%';
    },
    hold(frac) { hold.style.width = clamp(frac, 0, 1) * 100 + '%'; },
  };
}
function micPanel(onReady) {
  const box = h('div');
  function render() {
    const st = Mic.status;
    if (st === 'on') { box.replaceChildren(); return; }
    if (st === 'blocked-host') {
      box.replaceChildren(h('div', { class: 'callout' }, icon('info'), h('div', null,
        h('strong', null, 'The microphone isn’t available inside Claude. '),
        'Open Harmony Gym as its own page in Chrome to sing with live pitch detection. Here you can still practise: sing, then reveal the note and mark yourself.')));
      return;
    }
    if (st === 'unsupported') { box.replaceChildren(h('div', { class: 'callout' }, icon('info'), h('div', null, 'This browser doesn’t give pages access to a microphone. Use Chrome to sing with pitch detection.'))); return; }
    const blocked = st === 'blocked';
    box.replaceChildren(h('div', { class: 'callout' }, icon('sing'), h('div', { style: 'display:flex;flex-direction:column;gap:10px;align-items:flex-start' },
      h('span', null, blocked ? 'Microphone access was refused. Allow it in Chrome’s address bar (the icon on the left), then try again.' : 'Turn on the microphone and the app hears what you sing and shows how close you are, in cents. Headphones help: the mic then only hears you.'),
      h('button', { type: 'button', class: 'btn primary', onclick: async () => { const ok = await Mic.start(); render(); if (ok) onReady?.(); } }, 'Turn on microphone'))));
  }
  const off = Bus.on('mic', render);
  render();
  box.destroy = off;
  return box;
}

// ---------------- Sing a degree / a chord tone ----------------
function SingDrill(kind) {
  const isCT = kind === 'chordtones';
  const levels = isCT ? CT_LEVELS : DEG_LEVELS.filter(l => l.mode === 'single');
  const getLevel = () => isCT ? (CT_LEVELS.find(l => l.id === Settings.get().chordToneLevel) || CT_LEVELS[0]) : (levels.find(l => l.id === Settings.get().singLevel) || levels[1]);
  let level = getLevel();
  let q = null, token = 0, started = false, listening = false, lastKey = null, lastItem = null, offPitch = null, lastTouch = 0;
  const sess = { n: 0, c: 0, ms: [], cents: [] };

  const keyLine = h('div', { class: 'stage-key' }, 'Ready', h('b', null, isCT ? 'Chord tones' : 'Sing the degree'));
  const status = statusLine();
  const center = h('div', { class: 'stage-center' });
  const meter = Meter();
  const readout = h('div', { class: 'sing-readout' });
  const strip = sessionStrip();
  const selfRow = h('div', { class: 'stage-actions' });
  const nextBtn = h('button', { type: 'button', class: 'btn primary', onclick: () => ask() }, 'Next', h('kbd', null, '↵'));
  const actions = h('div', { class: 'stage-actions' },
    h('button', { type: 'button', class: 'btn', onclick: () => replayContext() }, icon('replay'), isCT ? 'Hear the chord' : 'Hear the key', h('kbd', null, 'C')),
    h('button', { type: 'button', class: 'btn', onclick: () => hearTarget(true) }, 'Hear the note', h('kbd', null, 'N')), nextBtn);
  actions.hidden = true;
  const mic = micPanel(() => { if (started && q) listen(); });

  const levelSel = selectField('Level', levels.map(l => [l.id, `${l.name} · ${l.blurb}`]), level.id, v => {
    Settings.set(isCT ? { chordToneLevel: v } : { singLevel: v }); level = getLevel(); if (started) ask();
  });
  const tolSel = selectField('In tune within', [[20, '±20 cents (strict)'], [30, '±30 cents'], [40, '±40 cents (relaxed)']], Settings.get().singTol, v => { Settings.set({ singTol: Number(v) }); meter.setTol(Number(v)); });
  const voiceSel = selectField('Reference notes', [['low', 'Lower voice'], ['high', 'Higher voice']], Settings.get().voice || 'low', v => Settings.set({ voice: v }));
  const droneTg = toggleField('Drone under it', Settings.get().singDrone, v => { Settings.set({ singDrone: v }); if (!v) AudioEngine.stopDrone(); else if (q && !isCT) AudioEngine.startDrone(q.keyPc); });
  const extra = isCT ? [] : [h('div', { class: 'field' }, h('span', null, ' '), droneTg)];
  meter.setTol(Settings.get().singTol);

  const stage = h('section', { class: 'stage', 'aria-label': isCT ? 'Sing chord tones' : 'Sing scale degrees' },
    h('div', { class: 'stage-top' }, keyLine, status), center, h('div', { class: 'stage-center', style: 'padding:0' }, meter.el, readout, selfRow), actions, strip);
  const el = h('div', { style: 'display:flex;flex-direction:column;gap:16px' },
    h('div', { class: 'toolbar' }, levelSel, tolSel, voiceSel, ...extra), mic, stage,
    shortcutRow([['Space', 'start / next'], ['C', isCT ? 'hear the chord' : 'hear the key'], ['N', 'hear the note']]));

  function updateStrip() { strip.update([['This session', `${sess.c}/${sess.n}`], ['Median time', fmtSec(median(sess.ms))], ['Average error', sess.cents.length ? Math.round(sess.cents.reduce((a, b) => a + b, 0) / sess.cents.length) + '¢' : '–']]); }
  function build() {
    if (isCT) {
      const qual = pick(level.quals);
      const tones = level.tones.filter(t => toneInterval(t, qual) != null);
      const tone = pickWeighted(tones, t => adaptiveWeight('snc', t) * (t === lastItem ? 0.4 : 1));
      lastItem = tone;
      const rootPc = pickKey(lastKey); lastKey = rootPc;
      const targetPc = mod12(rootPc + toneInterval(tone, qual));
      const bass = 36 + rootPc;
      return { kind, rootPc, qual, tone, targetPc, chord: QUAL[qual].play.map(i => bass + i), statKey: tone };
    }
    const keyPc = keyFor(lastKey); lastKey = keyPc;
    const deg = pickWeighted(level.degs, d => adaptiveWeight('sng', d) * (d === lastItem ? 0.3 : 1));
    lastItem = deg;
    return { kind, keyPc, minor: level.minor, deg, targetPc: mod12(keyPc + DEG[deg].semi), statKey: deg };
  }
  function promptView() {
    if (isCT) {
      const iv = toneInterval(q.tone, q.qual);
      return [h('div', { class: 'big-sub' }, 'Sing the'), h('span', { class: 'deg-chip xl', style: hueVars(iv) }, TONE_NAMES[q.tone]), h('div', { class: 'big-sub' }, 'of ', h('b', null, chordSym(q.rootPc, q.qual)))];
    }
    return [h('div', { class: 'big-sub' }, 'Sing'), degChip(q.deg, 'xl'), Settings.get().labels === 'solfege' ? h('div', { class: 'big-sub' }, DEG[q.deg].solf) : null];
  }
  async function ask() {
    const my = ++token; started = true; listening = false;
    try { await AudioEngine.init(); } catch (e) { status.set(e.message, 'bad'); return; }
    if (my !== token) return;
    AudioEngine.stopAll();
    q = build(); q.holdMs = 0; q.missed = false; q.centsAcc = [];
    keyLine.replaceChildren(document.createTextNode(isCT ? 'Chord' : 'Key'), h('b', null, isCT ? chordSym(q.rootPc, q.qual) : keyName(q.keyPc, q.minor)));
    center.replaceChildren(...promptView());
    actions.hidden = false; nextBtn.hidden = true; selfRow.replaceChildren(); meter.set(null); meter.hold(0); readout.replaceChildren();
    status.set(isCT ? 'Listen to the chord…' : 'Listen to the key…');
    const end = playContext(AudioEngine.t0(0.08));
    await AudioEngine.until(end + 0.1);
    if (my !== token) return;
    listen();
  }
  function playContext(t) {
    if (isCT) { AudioEngine.chord(q.chord, t, 2.0, 0.6); return t + 2.0; }
    if (Settings.get().singDrone) AudioEngine.startDrone(q.keyPc); else AudioEngine.stopDrone();
    return AudioEngine.playCadence(q.keyPc, q.minor, t);
  }
  function replayContext() { if (!q) return; AudioEngine.stopAll(); playContext(AudioEngine.t0(0.04)); }
  function hearTarget(counts) {
    if (!q) return;
    AudioEngine.init().then(() => {
      if (counts && listening && !q.missed && Mic.status === 'on') { q.missed = true; }
      AudioEngine.note(refMidi(q.targetPc), AudioEngine.t0(0.03), 1.3, 0.7);
    }).catch(() => {});
  }
  function listen() {
    q.listenStart = performance.now(); listening = true;
    if (Mic.status === 'on') {
      selfRow.replaceChildren();
      status.set('Sing it now — hold the note steady.');
      clearTimeout(q.missTimer);
      const my = token;
      q.missTimer = setTimeout(() => {
        if (my !== token || !listening || q.missed) return;
        q.missed = true; status.set('Here it is. Match it, then move on.', 'bad'); hearTarget(false);
      }, 12000);
    } else {
      status.set('Sing it, then reveal the note.');
      selfRow.replaceChildren(h('button', { type: 'button', class: 'btn primary', onclick: () => selfReveal() }, 'Reveal the note', h('kbd', null, 'R')));
    }
  }
  function selfReveal() {
    hearTarget(false);
    selfRow.replaceChildren(
      h('button', { type: 'button', class: 'btn', onclick: () => selfMark(true) }, 'I was in tune', h('kbd', null, 'Y')),
      h('button', { type: 'button', class: 'btn', onclick: () => selfMark(false) }, 'I was off', h('kbd', null, 'N')));
  }
  function selfMark(ok) {
    if (!q || !listening) return;
    listening = false;
    const rt = performance.now() - q.listenStart;
    record(isCT ? 'snc' : 'sng', q.statKey, ok, null);
    Activity.count('sing');
    sess.n++; if (ok) sess.c++; updateStrip();
    selfRow.replaceChildren();
    status.set(ok ? 'Nice.' : 'Noted. It’ll come up more often.', ok ? 'good' : 'bad');
    void rt;
    const my = token; setTimeout(() => { if (my === token) ask(); }, 900);
  }
  function onPitch(p) {
    if (!q || !listening) { meter.set(null); return; }
    const tol = Settings.get().singTol;
    if (p.midi == null) {
      meter.set(null); q.holdMs = Math.max(0, q.holdMs - 66); meter.hold(q.holdMs / 600);
      if (!p.gated) readout.replaceChildren(h('span', { class: 'faint' }, 'Listening…'));
      return;
    }
    const now = performance.now();
    if (now - lastTouch > 2000) { Activity.touch('sing'); lastTouch = now; }
    const c = centsTo(p.midi, q.targetPc);
    const sungPc = mod12(Math.round(p.midi));
    const base = isCT ? q.rootPc : q.keyPc;
    const sungLabel = isCT ? INTERVAL_LABELS_7[mod12(sungPc - base)] : degBySemi(sungPc - base).label;
    meter.set(Math.abs(c) <= 60 ? c : (c > 0 ? 60 : -60));
    readout.replaceChildren(
      h('span', null, 'You’re on'), h('span', { class: 'deg-chip', style: hueVars(sungPc - base) }, sungLabel),
      h('span', { class: 'cents' }, Math.abs(c) <= 50 ? `${c > 0 ? '+' : ''}${Math.round(c)}¢` : ''));
    if (Math.abs(c) <= tol) { q.holdMs += 33; q.centsAcc.push(c); }
    else q.holdMs = Math.max(0, q.holdMs - 50);
    meter.hold(q.holdMs / 600);
    if (q.holdMs >= 600) success();
  }
  function success() {
    listening = false; clearTimeout(q.missTimer);
    const rt = performance.now() - q.listenStart;
    const avg = q.centsAcc.length ? q.centsAcc.reduce((a, b) => a + Math.abs(b), 0) / q.centsAcc.length : 0;
    const ok = !q.missed;
    record(isCT ? 'snc' : 'sng', q.statKey, ok, ok ? rt : null, { cents: avg });
    Activity.count('sing');
    sess.n++; if (ok) { sess.c++; sess.ms.push(rt); sess.cents.push(avg); }
    updateStrip();
    status.set(ok ? `In tune · ${Math.round(avg)}¢ average · ${fmtSec(rt)}` : 'Matched. That one counts as a miss.', 'good');
    AudioEngine.note(refMidi(q.targetPc), AudioEngine.t0(0.05), 0.9, 0.5);
    nextBtn.hidden = false;
    const my = token;
    if (Settings.get().autoNext) setTimeout(() => { if (my === token) ask(); }, 1300);
  }
  DEBUG.sing = () => q;
  DEBUG.singPitch = p => onPitch(p);
  offPitch = Mic.listen(onPitch);
  center.replaceChildren(startPanel('Start', isCT
    ? 'You’ll hear a chord, then you sing the tone it asks for. The app listens and fills the bar while you hold it in tune.'
    : 'You’ll hear a cadence, then you sing the degree it asks for, in any octave. Hold it steady until the bar fills.', async () => { if (Mic.status === 'idle') await Mic.start(); ask(); }));
  updateStrip();
  return {
    el,
    destroy() { token++; offPitch?.(); mic.destroy?.(); clearTimeout(q?.missTimer); AudioEngine.stopAll(); AudioEngine.stopDrone(); },
    onKey(e) {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (!started) (Mic.status === 'idle' ? Mic.start() : Promise.resolve()).then(() => ask());
        else if (!listening || e.code === 'Enter') ask();
        return true;
      }
      if (e.code === 'KeyC') { replayContext(); return true; }
      if (e.code === 'KeyN' && !selfRow.childElementCount) { hearTarget(true); return true; }
      if (e.code === 'KeyR' && selfRow.childElementCount === 1) { selfReveal(); return true; }
      if (e.code === 'KeyY' && selfRow.childElementCount === 2) { selfMark(true); return true; }
      if (e.code === 'KeyN' && selfRow.childElementCount === 2) { selfMark(false); return true; }
      return false;
    },
  };
}

// ---------------- Drone + live pitch trace ----------------
function DroneDrill() {
  const s = Settings.get();
  let keyPc = Number(s.droneKey) || 0, on = false, raf = 0, offPitch = null, lastTouch = 0;
  const pts = [];
  let pattern = null, patIdx = 0, patHold = 0, patStart = 0, stepStart = 0;
  const canvas = h('canvas', { 'aria-label': 'Pitch trace against the drone' });
  const big = h('div', { class: 'stage-center', style: 'padding:0;min-height:120px;justify-content:center' });
  const status = statusLine();
  const toggleBtn = h('button', { type: 'button', class: 'btn primary big', onclick: () => toggle() }, icon('play'), 'Start drone');
  const keySel = selectField('Drone key', ROOT_NAMES.map((n, i) => [i, n]), keyPc, v => { keyPc = Number(v); Settings.set({ droneKey: keyPc }); if (on) AudioEngine.startDrone(keyPc, Settings.get().droneFifth); });
  const fifthTg = toggleField('Add the 5th', s.droneFifth, v => { Settings.set({ droneFifth: v }); if (on) AudioEngine.startDrone(keyPc, v); });
  const patSel = selectField('Follow a pattern', [['', 'Free singing'], ...PATTERNS.map(p => [p.id, p.name])], '', v => setPattern(v));
  const patRow = h('div', { class: 'slots', style: 'gap:6px' });
  const mic = micPanel(() => {});
  const el = h('div', { style: 'display:flex;flex-direction:column;gap:16px' },
    h('div', { class: 'toolbar' }, keySel, h('div', { class: 'field' }, h('span', null, ' '), fifthTg), patSel), mic,
    h('section', { class: 'stage', 'aria-label': 'Drone practice' },
      h('div', { class: 'stage-top' }, h('div', { class: 'stage-key' }, 'Drone on', h('b', null, ROOT_NAMES[keyPc])), status),
      h('div', { class: 'stage-actions' }, toggleBtn), big, patRow, h('div', { class: 'trace-wrap' }, canvas)),
    h('p', { class: 'note' }, 'Sing scale degrees against the drone and watch where you land. Lines show the degrees of the key; the bright ones are in the major scale.'));
  const keyLabel = el.querySelector('.stage-key b');

  function setPattern(id) {
    pattern = PATTERNS.find(p => p.id === id) || null;
    if (pattern && !pattern.seq) pattern = { ...pattern, seq: Array.from({ length: 6 }, () => pick(['1', '2', '3', '4', '5'])) };
    patIdx = 0; patHold = 0; patStart = 0; stepStart = performance.now();
    renderPattern();
  }
  function renderPattern() {
    if (!pattern) { patRow.replaceChildren(); return; }
    patRow.replaceChildren(...pattern.seq.map((d, i) => {
      const c = degChip(d, 'lg');
      c.style.opacity = i < patIdx ? '0.35' : i === patIdx ? '1' : '0.6';
      if (i === patIdx) c.style.outline = '3px solid var(--ink)';
      return c;
    }));
  }
  async function toggle() {
    await AudioEngine.init().catch(() => {});
    on = !on;
    keyLabel.textContent = ROOT_NAMES[keyPc];
    if (on) {
      AudioEngine.startDrone(keyPc, Settings.get().droneFifth);
      toggleBtn.replaceChildren('Stop drone');
      if (Mic.status === 'idle') await Mic.start();
      status.set(Mic.status === 'on' ? 'Sing any degree. Headphones keep the drone out of the mic.' : 'Sing along. Turn on the microphone to see your pitch.');
      try { (await navigator.wakeLock?.request('screen')); } catch { /* optional */ }
      loop();
    } else {
      AudioEngine.stopDrone();
      toggleBtn.replaceChildren(icon('play'), 'Start drone');
      status.set('');
      cancelAnimationFrame(raf);
    }
  }
  function onPitch(p) {
    const now = performance.now();
    pts.push({ t: now, m: p.midi });
    while (pts.length && now - pts[0].t > 8000) pts.shift();
    if (!on) return;
    if (p.midi == null) { big.replaceChildren(h('span', { class: 'faint' }, 'Listening…')); return; }
    if (now - lastTouch > 2000) { Activity.touch('sing'); lastTouch = now; }
    const semi = Math.round(p.midi) - keyPc;
    const d = degBySemi(semi);
    const c = (p.midi - Math.round(p.midi)) * 100;
    big.replaceChildren(degChip(d.id, 'xl'), h('div', { class: 'sing-readout' }, h('span', { class: 'cents' }, `${c > 0 ? '+' : ''}${Math.round(c)}¢`), h('span', { class: 'faint' }, noteName(Math.round(p.midi)))));
    if (pattern && patIdx < pattern.seq.length) {
      const target = DEG[pattern.seq[patIdx]];
      const cc = centsTo(p.midi, mod12(keyPc + target.semi));
      if (Math.abs(cc) <= Settings.get().singTol) {
        patHold += 33;
        if (patHold >= 300) {
          if (!patStart) patStart = now;
          record('sng', target.id, true, now - stepStart, { cents: Math.abs(cc) });
          patIdx++; patHold = 0; stepStart = now;
          renderPattern();
          if (patIdx >= pattern.seq.length) {
            status.set(`Pattern done in ${fmtSec(now - patStart)}. Starting it again.`, 'good');
            setTimeout(() => setPattern(pattern.id), 1200);
          }
        }
      } else patHold = Math.max(0, patHold - 40);
    }
  }
  function loop() {
    draw();
    if (on) raf = requestAnimationFrame(loop);
  }
  function draw() {
    const dpr = window.devicePixelRatio || 1, w = canvas.clientWidth, hgt = canvas.clientHeight;
    if (!w) return;
    if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(hgt * dpr); }
    const g = canvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, hgt);
    const L = cssVar('--chip-l') || '80%', C = cssVar('--chip-c') || '0.12', ink = cssVar('--ink'), ink3 = cssVar('--ink-3');
    const recent = pts.filter(p => p.m != null).slice(-40).map(p => p.m);
    const centre = recent.length ? median(recent) : refMidi(keyPc) + 4;
    const lo = centre - 9.5, hi = centre + 9.5;
    const y = m => hgt - (m - lo) / (hi - lo) * hgt;
    g.font = '600 11px ' + (cssVar('--mono') || 'monospace');
    for (let m = Math.ceil(lo); m <= Math.floor(hi); m++) {
      const d = degBySemi(m - keyPc), dia = MAJOR_DEGS.includes(d.id);
      { const hue = hueForSemi(d.semi); g.strokeStyle = `oklch(${(parseFloat(L) + lumBump(hue)).toFixed(1)}% ${C} ${hue} / ${dia ? 0.75 : 0.22})`; }
      g.lineWidth = d.id === '1' ? 2.5 : dia ? 1.4 : 1;
      g.beginPath(); g.moveTo(34, y(m)); g.lineTo(w, y(m)); g.stroke();
      g.fillStyle = dia ? ink : ink3;
      g.fillText(d.label, 8, y(m) + 4);
    }
    const now = performance.now();
    g.strokeStyle = ink; g.lineWidth = 3; g.lineJoin = 'round'; g.lineCap = 'round';
    g.beginPath();
    let prev = null;
    for (const p of pts) {
      const x = 34 + (w - 34) * (1 - (now - p.t) / 8000);
      if (p.m == null) { prev = null; continue; }
      if (prev && Math.abs(prev.m - p.m) < 1.5) g.lineTo(x, y(p.m)); else g.moveTo(x, y(p.m));
      prev = p;
    }
    g.stroke();
    const last = pts.length ? pts[pts.length - 1] : null;
    if (last && last.m != null) { g.fillStyle = ink; g.beginPath(); g.arc(w - 6, y(last.m), 6, 0, Math.PI * 2); g.fill(); }
  }
  offPitch = Mic.listen(onPitch);
  big.replaceChildren(h('span', { class: 'faint' }, 'Start the drone, then sing.'));
  requestAnimationFrame(draw);
  return {
    el,
    destroy() { on = false; cancelAnimationFrame(raf); offPitch?.(); mic.destroy?.(); AudioEngine.stopDrone(); },
    onKey(e) { if (e.code === 'Space') { e.preventDefault(); toggle(); return true; } return false; },
  };
}

function SingView(sub) {
  const tabs = [['degrees', 'Degrees'], ['chordtones', 'Chord tones'], ['drone', 'Drone']];
  let current = tabs.some(t => t[0] === sub) ? sub : (Settings.get().singMode || 'degrees');
  let drill = null;
  const body = h('div');
  const seg = segmented(tabs, current, v => show(v), 'Singing exercise');
  const el = h('div', { class: 'view' },
    h('div', { class: 'view-head' }, h('div', null, h('h1', null, 'Sing'), h('p', { class: 'sub' }, 'Your voice is the fastest link between hearing and understanding. Sing degrees and chord tones, and see exactly where you land.')), seg),
    body);
  function show(id) {
    drill?.destroy(); current = id; seg.setValue(id); if (Settings.get().singMode !== id) Settings.set({ singMode: id });
    try { history.replaceState(null, '', '#sing-' + id); } catch { /* sandboxed */ }
    drill = id === 'drone' ? DroneDrill() : SingDrill(id);
    body.replaceChildren(drill.el);
  }
  show(current);
  return { el, destroy() { drill?.destroy(); Mic.stop(); }, onKey(e) { return drill?.onKey?.(e); } };
}
