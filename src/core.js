'use strict';
/* =====================================================================
   Harmony Gym — core: utilities, music theory, storage, audio, MIDI, mic
   ===================================================================== */

// ---------------- Utilities ----------------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  if (props) {
    for (const k in props) {
      const v = props[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style') {
        if (typeof v === 'string') el.setAttribute('style', v);
        else for (const sk in v) el.style.setProperty(sk, v[sk]);
      } else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'value' || k === 'checked' || k === 'disabled' || k === 'hidden' || k === 'selected') el[k] = v;
      else el.setAttribute(k, v === true ? '' : String(v));
    }
  }
  addKids(el, kids);
  return el;
}
function addKids(el, kids) {
  for (const k of kids) {
    if (k == null || k === false) continue;
    if (Array.isArray(k)) addKids(el, k);
    else el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
}
function svgEl(markup) { const t = document.createElement('template'); t.innerHTML = markup.trim(); return t.content.firstChild; }
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const mod12 = n => ((n % 12) + 12) % 12;
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function pickWeighted(items, wf) {
  const ws = items.map(x => Math.max(0, wf(x)));
  const tot = ws.reduce((a, b) => a + b, 0);
  if (!(tot > 0)) return pick(items);
  let r = Math.random() * tot;
  for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}
function median(a) { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
const pad2 = n => String(n).padStart(2, '0');
function dayKey(d = new Date()) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function parseDay(k) { const [y, m, d] = k.split('-').map(Number); return Date.UTC(y, m - 1, d); }
function dayDiff(a, b) { return Math.round((parseDay(b) - parseDay(a)) / 86400000); }
function addDays(k, n) { const d = new Date(parseDay(k) + n * 86400000); return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`; }
function fmtSec(ms) { return ms == null || !isFinite(ms) ? '–' : (ms / 1000).toFixed(1) + ' s'; }
function fmtPct(x) { return x == null || !isFinite(x) ? '–' : Math.round(x * 100) + '%'; }
function fmtMin(ms) { return Math.round((ms || 0) / 60000) + ' min'; }
function uid() { return Math.random().toString(36).slice(2, 10); }
function weekdayName(k) { return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(parseDay(k)).getUTCDay()]; }
const isPhone = () => matchMedia('(max-width: 899px)').matches;
const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------- Music theory ----------------
// Degrees, with their position on the circle of fifths (flat side negative). Colour follows "brightness".
const DEGREES = [
  { id: '1', semi: 0, label: '1', solf: 'do', fifths: 0 },
  { id: 'b2', semi: 1, label: '♭2', solf: 'ra', fifths: -5 },
  { id: '2', semi: 2, label: '2', solf: 're', fifths: 2 },
  { id: 'b3', semi: 3, label: '♭3', solf: 'me', fifths: -3 },
  { id: '3', semi: 4, label: '3', solf: 'mi', fifths: 4 },
  { id: '4', semi: 5, label: '4', solf: 'fa', fifths: -1 },
  { id: 's4', semi: 6, label: '♯4', solf: 'fi', fifths: 6 },
  { id: '5', semi: 7, label: '5', solf: 'sol', fifths: 1 },
  { id: 'b6', semi: 8, label: '♭6', solf: 'le', fifths: -4 },
  { id: '6', semi: 9, label: '6', solf: 'la', fifths: 3 },
  { id: 'b7', semi: 10, label: '♭7', solf: 'te', fifths: -2 },
  { id: '7', semi: 11, label: '7', solf: 'ti', fifths: 5 },
];
const DEG = Object.fromEntries(DEGREES.map(d => [d.id, d]));
const degBySemi = s => DEGREES[mod12(s)];
const FIFTHS_ORDER = DEGREES.slice().sort((a, b) => a.fifths - b.fifths); // ♭2 … ♯4
const MAJOR_DEGS = ['1', '2', '3', '4', '5', '6', '7'];
const ALL_DEGS = DEGREES.map(d => d.id);
function hueForSemi(semi) { const t = (DEGREES[mod12(semi)].fifths + 5) / 11; return Math.round(300 - t * 230); }
// Yellow hues look muddy at the same lightness as the others, so they get a small lift
function lumBump(hue) { return Math.max(0, 1 - Math.abs(hue - 100) / 42) * 8; }
function hueVars(semi) { const hue = hueForSemi(semi); return { '--h': hue, '--lb': lumBump(hue).toFixed(1) + '%' }; }
// Interval labels relative to a chord root (for keyboard tags)
const INTERVAL_LABELS = ['R', '♭9', '9', '♭3', '3', '11', '♯11', '5', '♭13', '13', '♭7', '7'];
const INTERVAL_LABELS_7 = ['R', '♭9', '9', '♭3', '3', '4', '♭5', '5', '♯5', '6', '♭7', '7'];

const ROOT_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const MINOR_KEY_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'B♭', 'B'];
const SHARP_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
function noteName(m) { return ROOT_NAMES[mod12(m)] + (Math.floor(m / 12) - 1); }
function keyName(pc, minor) { return (minor ? MINOR_KEY_NAMES : ROOT_NAMES)[mod12(pc)] + (minor ? ' minor' : ' major'); }
const freqOf = m => 440 * Math.pow(2, (m - 69) / 12);
const midiOf = f => 69 + 12 * Math.log2(f / 440);
// Circle of fifths going round in fourths, the way jazz cycles move: C F B♭ E♭ …
const CYCLE_4THS = [0, 5, 10, 3, 8, 1, 6, 11, 4, 9, 2, 7];

const QUAL = {
  maj:     { sym: '',        name: 'Major',            iv: [0, 4, 7],            play: [0, 16, 19, 24] },
  min:     { sym: 'm',       name: 'Minor',            iv: [0, 3, 7],            play: [0, 15, 19, 24] },
  dim:     { sym: '°',       name: 'Diminished',       iv: [0, 3, 6],            play: [0, 15, 18, 24] },
  aug:     { sym: '+',       name: 'Augmented',        iv: [0, 4, 8],            play: [0, 16, 20, 24] },
  sus4:    { sym: 'sus4',    name: 'Suspended 4th',    iv: [0, 5, 7],            play: [0, 17, 19, 24] },
  maj7:    { sym: 'maj7',    name: 'Major 7th',        iv: [0, 4, 7, 11],        play: [0, 11, 16, 19] },
  m7:      { sym: 'm7',      name: 'Minor 7th',        iv: [0, 3, 7, 10],        play: [0, 10, 15, 19] },
  dom7:    { sym: '7',       name: 'Dominant 7th',     iv: [0, 4, 7, 10],        play: [0, 10, 16, 19] },
  m7b5:    { sym: 'm7♭5',    name: 'Half-diminished',  iv: [0, 3, 6, 10],        play: [0, 10, 15, 18] },
  dim7:    { sym: '°7',      name: 'Diminished 7th',   iv: [0, 3, 6, 9],         play: [0, 9, 15, 18] },
  mmaj7:   { sym: 'm(maj7)', name: 'Minor-major 7th',  iv: [0, 3, 7, 11],        play: [0, 11, 15, 19] },
  sus7:    { sym: '7sus4',   name: '7 sus 4',          iv: [0, 5, 7, 10],        play: [0, 10, 17, 19] },
  maj6:    { sym: '6',       name: 'Major 6th',        iv: [0, 4, 7, 9],         play: [0, 16, 19, 21] },
  m6:      { sym: 'm6',      name: 'Minor 6th',        iv: [0, 3, 7, 9],         play: [0, 15, 19, 21] },
  maj9:    { sym: 'maj9',    name: 'Major 9th',        iv: [0, 4, 7, 11, 14],    play: [0, 11, 16, 19, 26] },
  m9:      { sym: 'm9',      name: 'Minor 9th',        iv: [0, 3, 7, 10, 14],    play: [0, 10, 15, 19, 26] },
  dom9:    { sym: '9',       name: 'Dominant 9th',     iv: [0, 4, 7, 10, 14],    play: [0, 10, 16, 19, 26] },
  dom13:   { sym: '13',      name: 'Dominant 13th',    iv: [0, 4, 7, 10, 14, 21], play: [0, 10, 16, 21, 26] },
  maj7s11: { sym: 'maj7♯11', name: 'Lydian major 7th', iv: [0, 4, 7, 11, 18],    play: [0, 11, 16, 19, 30] },
  m11:     { sym: 'm11',     name: 'Minor 11th',       iv: [0, 3, 7, 10, 14, 17], play: [0, 10, 15, 17, 26] },
  dom7b9:  { sym: '7♭9',     name: '7 flat 9',         iv: [0, 4, 7, 10, 13],    play: [0, 10, 16, 19, 25] },
  dom7s9:  { sym: '7♯9',     name: '7 sharp 9',        iv: [0, 4, 7, 10, 15],    play: [0, 10, 16, 27] },
  dom7s11: { sym: '7♯11',    name: 'Lydian dominant',  iv: [0, 4, 7, 10, 18],    play: [0, 10, 16, 26, 30] },
  alt:     { sym: '7alt',    name: 'Altered (♯5 ♯9)',  iv: [0, 4, 8, 10, 15],    play: [0, 10, 16, 20, 27] },
  dom7b13: { sym: '7♭13',    name: '7 flat 13',        iv: [0, 4, 10, 20],       play: [0, 10, 16, 20] },
};
const qualPcs = (rootPc, q) => [...new Set(QUAL[q].iv.map(i => mod12(rootPc + i)))];
const chordSym = (rootPc, q) => ROOT_NAMES[mod12(rootPc)] + QUAL[q].sym;

const NUMERALS = {
  I:    { label: 'I',    root: 0,  q: 'maj',  q7: 'maj7' },
  ii:   { label: 'ii',   root: 2,  q: 'min',  q7: 'm7' },
  iii:  { label: 'iii',  root: 4,  q: 'min',  q7: 'm7' },
  IV:   { label: 'IV',   root: 5,  q: 'maj',  q7: 'maj7' },
  V:    { label: 'V',    root: 7,  q: 'maj',  q7: 'dom7' },
  vi:   { label: 'vi',   root: 9,  q: 'min',  q7: 'm7' },
  viio: { label: 'vii°', root: 11, q: 'dim',  q7: 'm7b5' },
  iv:   { label: 'iv',   root: 5,  q: 'min',  q7: 'm7' },
  bVII: { label: '♭VII', root: 10, q: 'maj',  q7: 'dom7' },
  bVI:  { label: '♭VI',  root: 8,  q: 'maj',  q7: 'maj7' },
  bIII: { label: '♭III', root: 3,  q: 'maj',  q7: 'maj7' },
  II7:  { label: 'II7',  root: 2,  q: 'dom7', q7: 'dom7' },
  III7: { label: 'III7', root: 4,  q: 'dom7', q7: 'dom7' },
  VI7:  { label: 'VI7',  root: 9,  q: 'dom7', q7: 'dom7' },
};
const NUM_HINT = { II7: 'V of V', III7: 'V of vi', VI7: 'V of ii', iv: 'borrowed', bVII: 'borrowed', bVI: 'borrowed', bIII: 'borrowed' };

// Tonic placed so cadence voicings sit between F2 and D5
function tonicMidi(pc) { let m = 48 + mod12(pc); if (m < 53) m += 12; return m; }
function cadenceChords(pc, minor) {
  const r = tonicMidi(pc), third = minor ? 3 : 4, sixth = minor ? 8 : 9;
  return [[r - 12, r, r + third, r + 7], [r - 7, r, r + 5, r + sixth], [r - 5, r - 1, r + 2, r + 5, r + 7], [r - 12, r, r + third, r + 7]];
}
// Stepwise paths from a degree to the nearest tonic ('8' = octave above)
const RESOLVE = {
  '1': ['1'], '2': ['2', '1'], '3': ['3', '2', '1'], '4': ['4', '3', '2', '1'],
  '5': ['5', '6', '7', '8'], '6': ['6', '7', '8'], '7': ['7', '8'],
  b2: ['b2', '1'], b3: ['b3', '2', '1'], s4: ['s4', '5', '6', '7', '8'], b6: ['b6', '5', '8'], b7: ['b7', '6', '5', '8'],
};
const RESOLVE_MINOR = { ...RESOLVE, b3: ['b3', '2', '1'], b6: ['b6', '5', '8'], b7: ['b7', '8'], '6': ['6', '7', '8'], '3': ['3', '4', '5', '8'] };
function resolutionNotes(targetMidi, degId, minor) {
  const base = targetMidi - DEG[degId].semi;
  return (minor ? RESOLVE_MINOR : RESOLVE)[degId].map(x => base + (x === '8' ? 12 : DEG[x].semi));
}

// Close-position voicing nearest to the previous one (simple voice leading)
function voiceLead(pcs, prev, lo = 55, hi = 77) {
  const n = pcs.length, cands = [];
  for (let inv = 0; inv < n; inv++) {
    const order = pcs.slice(inv).concat(pcs.slice(0, inv));
    for (let base = lo; base <= hi; base++) {
      if (mod12(base) !== order[0]) continue;
      const notes = [base];
      for (let i = 1; i < n; i++) { let m = notes[i - 1] + 1; while (mod12(m) !== order[i]) m++; notes.push(m); }
      if (notes[n - 1] <= hi) cands.push(notes);
    }
  }
  if (!cands.length) return pcs.map(p => 60 + p);
  const centre = a => a.reduce((x, y) => x + y, 0) / a.length;
  const cost = c => {
    let k = Math.abs(centre(c) - 66) * 0.35;
    if (prev) for (const m of c) k += Math.min(...prev.map(p => Math.abs(p - m)));
    return k;
  };
  return cands.sort((a, b) => cost(a) - cost(b))[0];
}

// ---------------- Settings & storage ----------------
const DEFAULT_SETTINGS = {
  labels: 'numbers', cadenceSpeed: 'normal', resolve: true, autoNext: true, range: 'wide', cadenceEvery: 'question',
  keyMode: 'random', fixedKey: 0, context: 'cadence',
  degLevel: 'd2', chordLevel: 'c2', progLevel: 'p1', chordMode: 'name', arpeggiate: true,
  voicingType: 'shell', voicingQualities: ['maj7', 'm7', 'dom7'], voicingOrder: 'adaptive', voicingSeq: false, showTriad: true,
  singMode: 'degrees', singLevel: 'd2', singTol: 30, singDrone: false, chordToneLevel: 'ct1', droneKey: 0, droneFifth: true, voice: 'low',
};
const DEVICE_DEFAULTS = { instrument: 'piano', volume: 0.8, reverb: true, thru: true, midiIn: '', midiOut: '', muteWhenOut: true, aec: true, name: '' };
const DEVICE_KEYS = Object.keys(DEVICE_DEFAULTS);
const STAT_CATS = ['deg', 'degm', 'chq', 'prg', 'vc', 'vk', 'sng', 'snc', 'conf'];

function emptyStats() { const s = {}; for (const c of STAT_CATS) s[c] = {}; return s; }
function deviceLabel() {
  const ua = navigator.userAgent || '';
  if (/Android/i.test(ua)) return 'Android phone';
  if (/iPhone|iPad/i.test(ua)) return 'iPhone';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'Mac';
  if (/Windows/i.test(ua)) return 'Windows PC';
  return 'This device';
}
const IN_CLAUDE = !!(window.claude && typeof window.claude.use === 'function');
const DEBUG = {}; // read-only hooks for testing

const Bus = {
  subs: new Map(),
  on(ev, fn) { if (!this.subs.has(ev)) this.subs.set(ev, new Set()); this.subs.get(ev).add(fn); return () => this.subs.get(ev).delete(fn); },
  emit(ev, ...a) { for (const fn of this.subs.get(ev) || []) { try { fn(...a); } catch (e) { console.error(e); } } },
};

const Store = {
  KEY: 'harmony-gym:v1',
  state: null, deviceId: 'device', mode: 'local', col: null, unsub: null,
  saveTimer: 0, writeChain: Promise.resolve(), lastSaved: { bucket: '', meta: '' }, status: 'idle', error: '',
  init() {
    let st = null;
    try { const raw = localStorage.getItem(this.KEY); st = raw ? JSON.parse(raw) : null; } catch { st = null; }
    this.state = this.normalize(st);
    let id = null;
    try {
      id = localStorage.getItem(this.KEY + ':device');
      if (!id) { id = 'd' + uid(); localStorage.setItem(this.KEY + ':device', id); }
    } catch { id = matchMedia('(pointer: coarse)').matches ? 'phone' : 'computer'; }
    this.deviceId = id.replace(/[^A-Za-z0-9_-]/g, '');
    this.ensureBucket();
    addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') this.flush(); });
    addEventListener('pagehide', () => this.flush());
  },
  normalize(st) {
    const base = { v: 1, settings: { ...DEFAULT_SETTINGS }, settingsAt: 0, plan: { start: dayKey(), at: 1 }, buckets: {} };
    if (!st || typeof st !== 'object') return base;
    const buckets = {};
    if (st.buckets && typeof st.buckets === 'object') {
      for (const [id, b] of Object.entries(st.buckets)) if (b && typeof b === 'object') buckets[id] = this.normBucket(b);
    }
    return {
      v: 1,
      settings: { ...DEFAULT_SETTINGS, ...(st.settings || {}) },
      settingsAt: Number(st.settingsAt) || 0,
      plan: st.plan && /^\d{4}-\d{2}-\d{2}$/.test(st.plan.start || '') ? { start: st.plan.start, at: Number(st.plan.at) || 1 } : base.plan,
      buckets,
    };
  },
  normBucket(b) {
    const stats = emptyStats();
    if (b.stats) for (const c of STAT_CATS) if (b.stats[c] && typeof b.stats[c] === 'object') stats[c] = b.stats[c];
    return { name: String(b.name || 'Device'), at: Number(b.at) || 0, stats, days: b.days && typeof b.days === 'object' ? b.days : {}, device: { ...DEVICE_DEFAULTS, ...(b.device || {}) } };
  },
  ensureBucket() {
    if (!this.state.buckets[this.deviceId]) this.state.buckets[this.deviceId] = this.normBucket({ name: deviceLabel() + (IN_CLAUDE ? ' (in Claude)' : ''), at: 0 });
  },
  bucket() { this.ensureBucket(); return this.state.buckets[this.deviceId]; },
  markDirty() {
    this.bucket().at = Date.now();
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.flush(), 2500);
    this.setStatus('pending');
  },
  flush() {
    clearTimeout(this.saveTimer);
    if (this.status === 'idle') return;
    this.prune();
    try { localStorage.setItem(this.KEY, JSON.stringify(this.state)); } catch { /* storage may be unavailable */ }
    if (this.mode === 'claude') {
      this.writeChain = this.writeChain.then(() => this.writeRemote()).catch(e => this.onWriteError(e));
    } else this.setStatus('saved');
  },
  async writeRemote() {
    const bj = JSON.stringify(this.bucket());
    if (bj !== this.lastSaved.bucket && this.bucket().at > 0) {
      await this.col.doc('b_' + this.deviceId).set(JSON.parse(bj));
      this.lastSaved.bucket = bj;
    }
    const mj = JSON.stringify({ settings: this.state.settings, settingsAt: this.state.settingsAt, plan: this.state.plan });
    if (mj !== this.lastSaved.meta) {
      await this.col.doc('meta').set(JSON.parse(mj));
      this.lastSaved.meta = mj;
    }
    this.setStatus('saved');
  },
  onWriteError(e) {
    const code = e && e.code;
    if (code === 'unavailable' && !this.retried) {
      this.retried = true;
      setTimeout(() => { this.retried = false; this.flush(); }, 1500 + Math.random() * 1500);
      return;
    }
    this.error = code === 'quota_exceeded' ? 'Your saved progress is full.' : 'Saving to your account failed. Progress is kept on this device.';
    this.setStatus('error');
  },
  setStatus(s) { this.status = s; Bus.emit('save', s); },
  prune() {
    const b = this.bucket(); const keys = Object.keys(b.days).sort();
    if (keys.length > 400) for (const k of keys.slice(0, keys.length - 400)) delete b.days[k];
  },
  // Merge another copy (remote device docs or an imported sync code). Newest wins per device.
  mergeIn(other) {
    let changed = 0;
    if ((other.settingsAt || 0) > this.state.settingsAt && other.settings) {
      this.state.settings = { ...DEFAULT_SETTINGS, ...other.settings }; this.state.settingsAt = other.settingsAt; changed++;
    }
    const op = other.plan, lp = this.state.plan;
    if (op && /^\d{4}-\d{2}-\d{2}$/.test(op.start || '') && ((op.at || 0) > (lp.at || 0) || ((op.at || 0) === (lp.at || 0) && op.start < lp.start))) {
      this.state.plan = { start: other.plan.start, at: other.plan.at }; changed++;
    }
    for (const [id, b] of Object.entries(other.buckets || {})) {
      const local = this.state.buckets[id];
      if (!local || (b.at || 0) > (local.at || 0)) {
        const keepDevice = local && id === this.deviceId ? local.device : null;
        const nb = this.normBucket(JSON.parse(JSON.stringify(b)));
        if (keepDevice) nb.device = keepDevice;
        this.state.buckets[id] = nb; changed++;
      }
    }
    return changed;
  },
  async connectClaude() {
    if (!IN_CLAUDE) return;
    let db = null, user = null;
    try { [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]); } catch { return; }
    if (!db || !user) return;
    let id = null;
    try { id = await user.id(); } catch { id = null; }
    if (!id) return;
    try {
      this.col = db.collection('data/users/' + id);
      const snap = await this.col.get();
      this.applyRemote(snap.docs);
      this.mode = 'claude';
      this.unsub = this.col.onSnapshot(s => this.applyRemote(s.docs), () => { /* keep working locally */ });
      this.setStatus('pending');
      this.flush();
      Bus.emit('storage');
    } catch (e) {
      this.mode = 'local';
      this.error = 'Could not reach your saved progress. Working on this device for now.';
      Bus.emit('storage');
    }
  },
  applyRemote(docs) {
    const other = { buckets: {} };
    for (const d of docs) {
      if (!d.exists) continue;
      const data = d.data() || {};
      if (d.id === 'meta') { other.settings = data.settings; other.settingsAt = data.settingsAt; other.plan = data.plan; }
      else if (d.id.startsWith('b_')) other.buckets[d.id.slice(2)] = data;
    }
    if (this.mergeIn(other)) Bus.emit('remote');
  },
  async exportCode() {
    const payload = JSON.stringify({ v: 1, settings: this.state.settings, settingsAt: this.state.settingsAt, plan: this.state.plan, buckets: this.state.buckets });
    const bytes = new TextEncoder().encode(payload);
    if (typeof CompressionStream === 'function') {
      const comp = await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer();
      return 'HG1.' + b64url(new Uint8Array(comp));
    }
    return 'HG0.' + b64url(bytes);
  },
  async importCode(code) {
    code = String(code || '').trim().replace(/\s+/g, '');
    let json;
    if (code.startsWith('HG1.')) {
      if (typeof DecompressionStream !== 'function') throw new Error('This browser cannot read compressed codes.');
      const bytes = unb64url(code.slice(4));
      json = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
    } else if (code.startsWith('HG0.')) json = new TextDecoder().decode(unb64url(code.slice(4)));
    else throw new Error('That doesn’t look like a Harmony Gym sync code.');
    const other = JSON.parse(json);
    const n = this.mergeIn(other);
    this.markDirty(); this.flush();
    return n;
  },
  resetMine() {
    const b = this.bucket();
    b.stats = emptyStats(); b.days = {};
    this.markDirty(); this.flush();
  },
};
function b64url(u8) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function unb64url(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }

const Settings = {
  get() { return { ...Store.state.settings, ...Store.bucket().device }; },
  set(patch) {
    let shared = false;
    for (const [k, v] of Object.entries(patch)) {
      if (DEVICE_KEYS.includes(k)) Store.bucket().device[k] = v;
      else { Store.state.settings[k] = v; shared = true; }
    }
    if (shared) Store.state.settingsAt = Date.now();
    Store.markDirty();
    Bus.emit('settings', patch);
  },
};

// ---------------- Stats ----------------
function stat(cat, key) { const s = Store.bucket().stats[cat]; return (s[key] ||= { n: 0, c: 0, ms: 0, mc: 0, r: '' }); }
function record(cat, key, correct, ms, extra) {
  const s = stat(cat, key);
  s.n++;
  if (correct) {
    s.c++;
    if (ms != null && isFinite(ms)) { s.ms = (s.ms || 0) + Math.round(ms); s.mc = (s.mc || 0) + 1; s.b = s.b == null ? Math.round(ms) : Math.min(s.b, Math.round(ms)); }
  }
  if (extra && extra.cents != null) { s.ce = (s.ce || 0) + Math.round(Math.abs(extra.cents)); s.cc = (s.cc || 0) + 1; }
  s.r = ((s.r || '') + (correct ? '1' : '0')).slice(-20);
  Store.markDirty();
}
function recordConfusion(cat, target, answer) { const s = Store.bucket().stats.conf; const k = cat + ':' + target + '>' + answer; s[k] = (s[k] || 0) + 1; }
function agg(cat, key) {
  let n = 0, c = 0, ms = 0, mc = 0, ce = 0, cc = 0, best = null, recent = '';
  const own = Store.deviceId;
  const ids = Object.keys(Store.state.buckets).sort((a, b) => (a === own) - (b === own));
  for (const id of ids) {
    const s = Store.state.buckets[id].stats?.[cat]?.[key];
    if (!s) continue;
    n += s.n || 0; c += s.c || 0; ms += s.ms || 0; mc += s.mc || 0; ce += s.ce || 0; cc += s.cc || 0;
    if (s.b != null) best = best == null ? s.b : Math.min(best, s.b);
    recent += s.r || '';
  }
  recent = recent.slice(-20);
  const rc = recent.length ? [...recent].filter(x => x === '1').length / recent.length : null;
  return { n, c, acc: n ? c / n : null, recentAcc: rc, avgMs: mc ? ms / mc : null, best, cents: cc ? ce / cc : null, recentN: recent.length };
}
function allKeys(cat) { const ks = new Set(); for (const b of Object.values(Store.state.buckets)) for (const k of Object.keys(b.stats?.[cat] || {})) ks.add(k); return [...ks]; }
function adaptiveWeight(cat, key, slowMs = 2500) {
  const a = agg(cat, key);
  if (a.n < 6) return 2.2;
  let w = 0.5 + (1 - (a.recentAcc ?? a.acc ?? 0)) * 3.2;
  if (a.avgMs != null) { if (a.avgMs > slowMs) w += 0.6; if (a.avgMs > slowMs * 1.6) w += 0.6; }
  return w;
}
function mastery(cat, keys, minN = 15, minAcc = 0.9) {
  let done = 0;
  for (const k of keys) { const a = agg(cat, k); if (a.n >= minN && (a.recentAcc ?? 0) >= minAcc) done++; }
  return { done, total: keys.length };
}

// ---------------- Practice time ----------------
function dayRec(k = dayKey()) { const b = Store.bucket(); return (b.days[k] ||= { ms: {}, n: {}, done: {}, note: '' }); }
const Activity = {
  last: 0, area: null,
  touch(area) {
    if (!area) return;
    const now = Date.now(), d = dayRec();
    const gap = now - this.last;
    d.ms[area] = (d.ms[area] || 0) + (this.area === area && gap < 45000 ? gap : 0);
    this.last = now; this.area = area;
    Store.markDirty();
  },
  count(area) { const d = dayRec(); d.n[area] = (d.n[area] || 0) + 1; this.touch(area); },
};
function dayTotals(k) {
  const t = { ms: {}, n: {}, done: {}, note: '' };
  for (const b of Object.values(Store.state.buckets)) {
    const d = b.days?.[k]; if (!d) continue;
    for (const [a, v] of Object.entries(d.ms || {})) t.ms[a] = (t.ms[a] || 0) + v;
    for (const [a, v] of Object.entries(d.n || {})) t.n[a] = (t.n[a] || 0) + v;
    for (const [a, v] of Object.entries(d.done || {})) if (v) t.done[a] = true;
    if (d.note && !t.note) t.note = d.note;
  }
  return t;
}
function dayMinutes(k) { const t = dayTotals(k); return Object.values(t.ms).reduce((a, b) => a + b, 0) / 60000; }
function streak() {
  let k = dayKey(), s = 0;
  const active = key => { const t = dayTotals(key); return dayMinutes(key) >= 3 || Object.values(t.done).some(Boolean); };
  if (!active(k)) k = addDays(k, -1);
  while (active(k) && s < 999) { s++; k = addDays(k, -1); }
  return s;
}

// ---------------- Audio ----------------
const AudioEngine = {
  ctx: null, out: null, bus: null, verbGain: null, samples: null, sampleKeys: [], ready: null,
  voices: new Set(), busyUntil: 0, drone: null, failed: false,
  async init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { this.failed = true; throw new Error('Web Audio is not available in this browser.'); }
      const ctx = this.ctx = new AC({ latencyHint: 'interactive' });
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -15; comp.knee.value = 10; comp.ratio.value = 3.5; comp.attack.value = 0.003; comp.release.value = 0.25;
      this.out = ctx.createGain(); this.out.gain.value = Settings.get().volume;
      this.out.connect(comp); comp.connect(ctx.destination);
      this.bus = ctx.createGain(); this.bus.gain.value = 0.9; this.bus.connect(this.out);
      const verb = ctx.createConvolver(); verb.buffer = this.impulse(2.0);
      this.verbGain = ctx.createGain(); this.verbGain.gain.value = Settings.get().reverb ? 0.2 : 0;
      this.bus.connect(verb); verb.connect(this.verbGain); this.verbGain.connect(this.out);
      this.ready = this.loadSamples().catch(e => { console.warn('Piano samples failed to load', e); this.samples = null; });
      Bus.on('settings', p => {
        if ('volume' in p && this.out) this.out.gain.setTargetAtTime(p.volume, this.ctx.currentTime, 0.03);
        if ('reverb' in p && this.verbGain) this.verbGain.gain.setTargetAtTime(p.reverb ? 0.2 : 0, this.ctx.currentTime, 0.05);
      });
    }
    if (this.ctx.state !== 'running') { try { await this.ctx.resume(); } catch { /* resumes on next gesture */ } }
    await this.ready;
  },
  impulse(sec) {
    const ctx = this.ctx, len = Math.floor(ctx.sampleRate * sec), buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2) * (i < 200 ? i / 200 : 1);
    }
    return buf;
  },
  async loadSamples() {
    const el = document.getElementById('piano-samples');
    if (!el) return;
    const data = JSON.parse(el.textContent);
    const entries = await Promise.all(Object.entries(data).map(async ([m, b64]) => {
      const bin = atob(b64), u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      const buf = await new Promise((res, rej) => this.ctx.decodeAudioData(u8.buffer, res, rej));
      return [Number(m), buf];
    }));
    this.samples = new Map(entries);
    this.sampleKeys = [...this.samples.keys()].sort((a, b) => a - b);
  },
  now() { return this.ctx ? this.ctx.currentTime : 0; },
  t0(lead = 0.06) { return this.ctx.currentTime + lead; },
  perfAt(t) { return performance.now() + (t - this.ctx.currentTime) * 1000; },
  until(t) { return sleep(Math.max(0, (t - this.ctx.currentTime) * 1000)); },
  isBusy(margin = 0.15) { return this.ctx && this.ctx.currentTime < this.busyUntil + margin; },
  track(v) {
    v.release = at => {
      if (v.released) return; v.released = true;
      const g = v.g.gain;
      if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(at); else g.cancelScheduledValues(at);
      g.setTargetAtTime(0, at, v.tau);
      for (const s of v.srcs) { try { s.stop(at + v.tau * 7 + 0.02); } catch { /* already stopped */ } }
    };
    v.srcs[0].onended = () => { this.voices.delete(v); try { v.g.disconnect(); } catch { /* noop */ } };
    this.voices.add(v);
    return v;
  },
  makeVoice(m, t, vel, inst) {
    if (inst === 'piano' && this.samples) return this.piano(m, t, vel);
    if (inst === 'synth') return this.synth(m, t, vel);
    return this.ep(m, t, vel);
  },
  piano(m, t, vel) {
    const ctx = this.ctx, keys = this.sampleKeys;
    let s = keys[0];
    for (const k of keys) if (Math.abs(k - m) < Math.abs(s - m)) s = k;
    const src = ctx.createBufferSource();
    src.buffer = this.samples.get(s);
    src.playbackRate.value = Math.pow(2, (m - s) / 12);
    const g = ctx.createGain(), peak = 0.12 + 0.55 * vel * vel;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + 0.004);
    src.connect(g); g.connect(this.bus); src.start(t);
    return this.track({ g, srcs: [src], tau: 0.1 });
  },
  ep(m, t, vel) {
    const ctx = this.ctx, f = freqOf(m);
    const car = ctx.createOscillator(); car.frequency.value = f;
    const mod = ctx.createOscillator(); mod.frequency.value = f;
    const mg = ctx.createGain(), idx = (0.7 + 1.3 * vel) * f;
    mg.gain.setValueAtTime(idx, t); mg.gain.setTargetAtTime(idx * 0.22, t, 0.32);
    mod.connect(mg); mg.connect(car.frequency);
    const tine = ctx.createOscillator(); tine.frequency.value = f * 14;
    const tg = ctx.createGain(); tg.gain.setValueAtTime(f * 1.2 * vel, t); tg.gain.setTargetAtTime(0, t, 0.025);
    tine.connect(tg); tg.connect(car.frequency);
    const g = ctx.createGain(), peak = 0.09 + 0.3 * vel;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + 0.004);
    g.gain.setTargetAtTime(0, t + 0.004, 0.9 + (84 - clamp(m, 36, 84)) / 48 * 1.3);
    car.connect(g); g.connect(this.bus);
    car.start(t); mod.start(t); tine.start(t);
    return this.track({ g, srcs: [car, mod, tine], tau: 0.08 });
  },
  synth(m, t, vel) {
    const ctx = this.ctx, f = freqOf(m);
    const o1 = ctx.createOscillator(); o1.type = 'triangle'; o1.frequency.value = f;
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2;
    const g2 = ctx.createGain(); g2.gain.value = 0.25;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
    const g = ctx.createGain(), peak = 0.08 + 0.22 * vel;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + 0.012);
    g.gain.setTargetAtTime(peak * 0.55, t + 0.02, 0.35);
    o1.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(this.bus);
    o1.start(t); o2.start(t);
    return this.track({ g, srcs: [o1, o2], tau: 0.09 });
  },
  // Scheduled note. Returns the voice (or null when routed only to MIDI out).
  note(m, t, dur, vel = 0.7, opts = {}) {
    if (!this.ctx) return null;
    this.busyUntil = Math.max(this.busyUntil, t + dur);
    MidiIO.sendNote(m, t, dur, vel);
    if (MidiIO.outActive() && Settings.get().muteWhenOut && !opts.force) return null;
    const v = this.makeVoice(m, t, vel, opts.inst || Settings.get().instrument);
    v.release(t + dur);
    return v;
  },
  chord(notes, t, dur, vel = 0.62, strum = 0) {
    notes.slice().sort((a, b) => a - b).forEach((m, i) => this.note(m, t + i * strum, Math.max(0.1, dur - i * strum), vel * (i === 0 ? 1.05 : 0.9)));
    return t + dur;
  },
  // A held note for MIDI thru / on-screen keys
  hold(m, vel = 0.7) {
    if (!this.ctx || this.ctx.state !== 'running') return null;
    const v = this.makeVoice(m, this.ctx.currentTime + 0.005, vel, Settings.get().instrument);
    v.timer = setTimeout(() => v.release(this.ctx.currentTime), 15000);
    return { release: () => { clearTimeout(v.timer); v.release(this.ctx.currentTime); } };
  },
  stopAll() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (const v of this.voices) { v.released = false; v.release(now); }
    this.busyUntil = now;
    MidiIO.panic();
  },
  cadenceGap() { return { relaxed: 0.78, normal: 0.6, quick: 0.44 }[Settings.get().cadenceSpeed] || 0.6; },
  playCadence(pc, minor, t) {
    const gap = this.cadenceGap();
    cadenceChords(pc, minor).forEach((ch, i, arr) => this.chord(ch, t + i * gap, i === arr.length - 1 ? gap * 1.7 : gap * 0.96, 0.55));
    return t + gap * 4 + gap * 0.4;
  },
  startDrone(pc, fifth = true) {
    if (!this.ctx) return;
    this.stopDrone();
    const ctx = this.ctx, t = ctx.currentTime + 0.02;
    const root = 36 + mod12(pc) + (mod12(pc) < 5 ? 12 : 0); // C3–E3 or F2–B2
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.2, t + 1.4);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 760; lp.Q.value = 0.6;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.11;
    const lfoG = ctx.createGain(); lfoG.gain.value = 170; lfo.connect(lfoG); lfoG.connect(lp.frequency);
    const oscs = [lfo];
    const add = (m, type, level, detune) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = freqOf(m); o.detune.value = detune;
      const og = ctx.createGain(); og.gain.value = level; o.connect(og); og.connect(lp); oscs.push(o);
    };
    add(root, 'sawtooth', 0.32, -5); add(root, 'sawtooth', 0.32, 5); add(root - 12, 'sine', 0.55, 0);
    if (fifth) add(root + 7, 'sawtooth', 0.16, 3);
    add(root + 12, 'triangle', 0.12, 0);
    lp.connect(g); g.connect(this.out);
    oscs.forEach(o => o.start(t));
    this.drone = { g, oscs, pc };
  },
  stopDrone() {
    if (!this.drone || !this.ctx) return;
    const { g, oscs } = this.drone, now = this.ctx.currentTime;
    g.gain.cancelScheduledValues(now); g.gain.setTargetAtTime(0, now, 0.25);
    oscs.forEach(o => { try { o.stop(now + 1.6); } catch { /* noop */ } });
    this.drone = null;
  },
};

// ---------------- MIDI ----------------
const MidiIO = {
  access: null, status: navigator.requestMIDIAccess ? 'idle' : 'unsupported',
  inputs: [], outputs: [], input: null, output: null,
  held: new Map(), thru: new Map(), outNotes: new Set(), subs: new Set(),
  async connect() {
    if (!navigator.requestMIDIAccess) { this.status = 'unsupported'; Bus.emit('midi'); return false; }
    try { this.access = await navigator.requestMIDIAccess({ sysex: false }); }
    catch { this.status = 'blocked'; Bus.emit('midi'); return false; }
    this.status = 'ready';
    this.access.onstatechange = () => this.refresh();
    this.refresh();
    return true;
  },
  async autoConnect() {
    if (!navigator.requestMIDIAccess || IN_CLAUDE) return;
    try {
      const p = await navigator.permissions?.query({ name: 'midi' });
      if (p && p.state === 'granted') await this.connect();
    } catch { /* permissions API may not know "midi" */ }
  },
  refresh() {
    if (!this.access) return;
    this.inputs = [...this.access.inputs.values()];
    this.outputs = [...this.access.outputs.values()];
    const s = Settings.get();
    for (const i of this.inputs) i.onmidimessage = null;
    const virtual = /IAC|DAW|Bus \d|Through|Virtual|Network|Session/i;
    this.input = this.inputs.find(i => i.name === s.midiIn) || this.inputs.find(i => !virtual.test(i.name)) || null;
    if (this.input) this.input.onmidimessage = e => this.onMessage(e.data);
    this.output = this.outputs.find(o => o.name === s.midiOut) || null;
    Bus.emit('midi');
  },
  onMessage(data) {
    const st = data[0] & 0xf0, d1 = data[1], d2 = data[2];
    if (st === 0x90 && d2 > 0) this.noteOn(d1, d2);
    else if (st === 0x80 || (st === 0x90 && d2 === 0)) this.noteOff(d1);
  },
  noteOn(n, vel = 96) {
    this.held.set(n, vel);
    if (Settings.get().thru) {
      const old = this.thru.get(n); if (old) old.release();
      const v = AudioEngine.hold(n, 0.25 + 0.65 * vel / 127); if (v) this.thru.set(n, v);
    }
    for (const f of this.subs) f('on', n, vel);
  },
  noteOff(n) {
    this.held.delete(n);
    const v = this.thru.get(n); if (v) { v.release(); this.thru.delete(n); }
    for (const f of this.subs) f('off', n, 0);
  },
  heldNotes() { return [...this.held.keys()].sort((a, b) => a - b); },
  subscribe(fn) { this.subs.add(fn); return () => this.subs.delete(fn); },
  outActive() { return !!(this.output && Settings.get().midiOut); },
  sendNote(m, t, dur, vel) {
    if (!this.outActive() || !AudioEngine.ctx) return;
    const at = performance.now() + Math.max(0, (t - AudioEngine.ctx.currentTime) * 1000);
    const v = clamp(Math.round(vel * 127), 1, 127);
    try { this.output.send([0x90, m, v], at); this.output.send([0x80, m, 0], at + dur * 1000); this.outNotes.add(m); } catch { /* port closed */ }
  },
  panic() {
    if (!this.output) return;
    try {
      if (this.output.clear) this.output.clear();
      for (const n of this.outNotes) this.output.send([0x80, n, 0]);
      this.output.send([0xB0, 123, 0]);
    } catch { /* noop */ }
    this.outNotes.clear();
  },
  label() {
    if (IN_CLAUDE) return { text: 'MIDI off in Claude', cls: '' };
    if (this.status === 'unsupported') return { text: 'No MIDI here', cls: '' };
    if (this.status === 'blocked') return { text: 'MIDI blocked', cls: 'warn' };
    if (this.status !== 'ready') return { text: 'Connect keyboard', cls: '' };
    if (!this.input) return { text: 'No keyboard found', cls: 'warn' };
    return { text: this.input.name.replace(/\s*(MIDI|Port)\s*\d*$/i, '').slice(0, 26), cls: 'on' };
  },
};

// ---------------- Microphone & pitch detection ----------------
function yin(buf, sr, threshold = 0.15, minF = 65, maxF = 1100) {
  const tauMax = Math.min(Math.floor(sr / minF), Math.floor(buf.length / 2));
  const tauMin = Math.max(2, Math.floor(sr / maxF));
  const W = buf.length - tauMax;
  const d = new Float32Array(tauMax + 1);
  for (let tau = 1; tau <= tauMax; tau++) {
    let s = 0;
    for (let j = 0; j < W; j++) { const x = buf[j] - buf[j + tau]; s += x * x; }
    d[tau] = s;
  }
  const c = new Float32Array(tauMax + 1); c[0] = 1;
  let run = 0;
  for (let tau = 1; tau <= tauMax; tau++) { run += d[tau]; c[tau] = run ? d[tau] * tau / run : 1; }
  let tau = -1;
  for (let t = tauMin; t <= tauMax; t++) {
    if (c[t] < threshold) { while (t + 1 <= tauMax && c[t + 1] < c[t]) t++; tau = t; break; }
  }
  if (tau < 0) return null;
  let better = tau;
  if (tau > 1 && tau < tauMax) {
    const s0 = c[tau - 1], s1 = c[tau], s2 = c[tau + 1], den = 2 * (2 * s1 - s2 - s0);
    if (den) better = tau + (s2 - s0) / den;
  }
  return { freq: sr / better, clarity: 1 - c[tau] };
}
const Mic = {
  stream: null, analyser: null, buf: null, status: IN_CLAUDE ? 'blocked-host' : (navigator.mediaDevices?.getUserMedia ? 'idle' : 'unsupported'),
  timer: 0, listeners: new Set(), hist: [],
  async start() {
    if (this.stream) return true;
    if (IN_CLAUDE) { this.status = 'blocked-host'; Bus.emit('mic'); return false; }
    if (!navigator.mediaDevices?.getUserMedia) { this.status = 'unsupported'; Bus.emit('mic'); return false; }
    await AudioEngine.init();
    try {
      const aec = Settings.get().aec;
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: aec, noiseSuppression: false, autoGainControl: false } });
    } catch { this.status = 'blocked'; Bus.emit('mic'); return false; }
    const ctx = AudioEngine.ctx;
    const src = ctx.createMediaStreamSource(this.stream);
    this.analyser = ctx.createAnalyser(); this.analyser.fftSize = 2048;
    src.connect(this.analyser);
    this.buf = new Float32Array(this.analyser.fftSize);
    this.status = 'on'; Bus.emit('mic');
    this.timer = setInterval(() => this.tick(), 33);
    return true;
  },
  stop() {
    clearInterval(this.timer); this.timer = 0;
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    this.stream = null; this.analyser = null; this.hist = [];
    if (this.status === 'on') this.status = 'idle';
    Bus.emit('mic');
  },
  tick() {
    if (!this.analyser) return;
    this.analyser.getFloatTimeDomainData(this.buf);
    let rms = 0; for (let i = 0; i < this.buf.length; i++) rms += this.buf[i] * this.buf[i];
    rms = Math.sqrt(rms / this.buf.length);
    let midi = null;
    if (rms > 0.008) {
      const r = yin(this.buf, AudioEngine.ctx.sampleRate);
      if (r && r.clarity > 0.8 && r.freq > 60 && r.freq < 1200) midi = midiOf(r.freq);
    }
    if (midi == null) { this.hist = []; }
    else { this.hist.push(midi); if (this.hist.length > 5) this.hist.shift(); }
    const smooth = this.hist.length >= 3 ? median(this.hist) : null;
    const gated = AudioEngine.isBusy(0.12);
    for (const f of this.listeners) f({ midi: gated ? null : smooth, rms, gated });
  },
  listen(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
};
