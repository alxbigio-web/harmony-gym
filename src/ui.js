/* =====================================================================
   Plan, Today, Progress, Settings, app shell
   ===================================================================== */
const PHASES = [
  { n: 1, from: 1, to: 3, name: 'Foundations',
    ear: { text: 'Degrees 1–5 in major after a cadence. Move on once you’re above 90%.', route: 'ear-degrees', key: 'degLevel', levels: ['d2'] },
    sing: { text: 'Sing degrees 1–5 over a drone, then simple melodies sung as numbers.', route: 'sing-drone', preset: { singMode: 'drone' }, label: 'Drone' },
    voice: { text: 'maj7, m7 and 7 as shell voicings (root, 3rd, 7th) in all 12 keys.', preset: { voicingType: 'shell', voicingQualities: ['maj7', 'm7', 'dom7'], voicingSeq: false }, label: 'Shell voicings' },
    trans: { title: 'Transcribe', text: 'Bass lines only, from simple pop songs.' } },
  { n: 2, from: 4, to: 6, name: 'The full scale',
    ear: { text: 'All 7 major degrees, then chromatic notes (♭3, ♭7, ♯4).', route: 'ear-degrees', key: 'degLevel', levels: ['d3', 'd4', 'd5'] },
    sing: { text: 'Sing the bass of each chord while you play the chord.', route: 'sing-chordtones', preset: { chordToneLevel: 'ct1' }, label: 'Chord tones' },
    voice: { text: 'Rootless and drop-2 voicings. Run ii–V–I through the circle of fifths.', preset: { voicingType: 'rlA', voicingSeq: true, voicingOrder: 'cycle' }, label: 'Rootless ii–V–I' },
    trans: { title: 'Transcribe', text: 'Full chord progressions from diatonic songs.', route: 'ear-progressions', preset: { progLevel: 'p1' }, label: 'Progression drill' } },
  { n: 3, from: 7, to: 9, name: 'Colour',
    ear: { text: 'Chord quality by ear (maj7, m7, 7, m7♭5, sus), then whole progressions.', route: 'ear-chords', key: 'chordLevel', levels: ['c2', 'c3', 'c4'] },
    sing: { text: 'Inner voices: sing the 3rd and 7th as the chord moves.', route: 'sing-chordtones', preset: { chordToneLevel: 'ct3' }, label: 'Inner voices' },
    voice: { text: 'Extensions (9, 11, 13), altered dominants, upper-structure triads.', preset: { voicingType: 'spell' }, label: 'Extensions' },
    trans: { title: 'Reharmonize', text: 'Take a simple tune and find 3 different chords under each melody note.' } },
  { n: 4, from: 10, to: 12, name: 'Collier territory',
    ear: { text: 'Modal and borrowed chords, two notes at once, faster responses.', route: 'ear-degrees', key: 'degLevel', levels: ['d6', 'd7', 'd8'] },
    sing: { text: 'Harmonize a melody by layering your own voice parts.', route: 'sing-chordtones', preset: { chordToneLevel: 'ct4' }, label: 'Colour tones' },
    voice: { text: 'Modal interchange, negative harmony, moving a melody while the harmony shifts underneath.', preset: { voicingType: 'borrowed' }, label: 'Borrowed chords' },
    trans: { title: 'Transcribe', text: 'A section of a Collier arrangement.' } },
];
const BLOCK_TARGET = { ear: 10, sing: 5, voice: 12, trans: 12 };
function currentWeek() { return Math.floor(dayDiff(Store.state.plan.start, dayKey()) / 7) + 1; }
function phaseFor(week) { return PHASES.find(p => week >= p.from && week <= p.to) || (week > 12 ? PHASES[3] : PHASES[0]); }
function setWeek(w) { Store.state.plan = { start: addDays(dayKey(), -(w - 1) * 7), at: Date.now() }; Store.markDirty(); Store.flush(); }
function suggestEar(phase) {
  const e = phase.ear;
  const catOf = id => id.startsWith('c') ? ['chq', CHORD_LEVELS.find(l => l.id === id).q] : ['deg', levelById(id).degs, levelById(id).minor ? 'degm' : 'deg'];
  for (const id of e.levels) {
    const [cat, keys, alt] = catOf(id);
    const m = mastery(alt || cat, keys);
    if (m.done < m.total) return id;
  }
  return e.levels[e.levels.length - 1];
}
function earLevelName(id) { if (id.startsWith('c')) return CHORD_LEVELS.find(l => l.id === id).name; return levelById(id).name; }
function go(route, preset) {
  if (preset) Settings.set(preset);
  if (location.hash === '#' + route) App.render(); else location.hash = route;
}

// ---------------- Today ----------------
function TodayView() {
  const week = currentWeek(), phase = phaseFor(week), today = dayKey(), tot = dayTotals(today);
  const done = Math.min(week, 12);
  const weeks = h('div', { class: 'weeks', 'aria-label': `Week ${done} of 12` }, Array.from({ length: 12 }, (_, i) => h('i', { class: i + 1 < done ? 'done' : i + 1 === done ? 'now' : '' })));
  const d = new Date();
  const dateStr = d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  const st = streak();
  const hero = h('section', { class: 'hero' },
    h('span', { class: 'eyebrow' }, dateStr + (st ? ` · ${st}-day streak` : '')),
    h('h1', null, week > 12 ? 'Plan complete' : `Week ${week}`, h('span', { class: 'phase-name' }, ' · ' + phase.name)),
    weeks,
    h('div', { class: 'weeks-labels' }, PHASES.map(p => h('span', { style: p === phase ? 'color:var(--ink)' : '' }, p.name))),
    week > 12 ? h('div', { class: 'callout' }, icon('info'), h('div', null, 'You’ve been through all 12 weeks. Keep working in Collier territory, or ', h('button', { type: 'button', class: 'btn small', onclick: () => { setWeek(1); App.render(); } }, 'start again at week 1'), '.')) : null);

  const earLevel = suggestEar(phase);
  const blocks = [
    { id: 'ear', name: 'Ear', mins: '10 min', text: phase.ear.text, label: earLevelName(earLevel), act: () => go(phase.ear.route, { [phase.ear.key]: earLevel }) },
    { id: 'sing', name: 'Sing', mins: '5 min', text: phase.sing.text, label: phase.sing.label, act: () => go(phase.sing.route, phase.sing.preset) },
    { id: 'voice', name: 'Voicings', mins: '10–15 min', text: phase.voice.text, label: phase.voice.label, act: () => go('voicings', phase.voice.preset) },
    { id: 'trans', name: phase.trans.title, mins: '10–15 min', text: phase.trans.text, manual: true, label: phase.trans.label, act: phase.trans.route ? () => go(phase.trans.route, phase.trans.preset) : null },
  ];
  const list = h('div', { class: 'blocks' }, blocks.map(b => {
    const ms = tot.ms[b.id] || 0, target = BLOCK_TARGET[b.id] * 60000;
    const isDone = b.manual ? !!tot.done.trans : ms >= target;
    const body = h('div', { class: 'block-body' }, h('p', null, b.text));
    if (b.manual) {
      const rec = dayRec(today);
      const inp = h('input', { type: 'text', id: 'today-note', placeholder: phase.n === 3 ? 'Which tune did you reharmonize?' : 'What did you transcribe?', value: rec.note || tot.note || '', 'aria-label': 'Practice note' });
      let t = 0;
      inp.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { dayRec(today).note = inp.value.slice(0, 200); Store.markDirty(); }, 500); });
      const tg = toggleField('Done today', !!tot.done.trans, v => { dayRec(today).done.trans = v; Store.markDirty(); App.render(); }, 'today-done');
      body.append(h('div', { class: 'manual' }, inp, tg));
    } else {
      body.append(h('div', { style: 'display:flex;align-items:center;gap:10px' },
        h('div', { class: 'progress', style: 'flex:1', role: 'progressbar', 'aria-valuenow': Math.round(ms / 60000), 'aria-valuemin': 0, 'aria-valuemax': BLOCK_TARGET[b.id] }, h('i', { style: { width: Math.min(100, ms / target * 100) + '%' } })),
        h('span', { class: 'note mono' }, `${Math.round(ms / 60000)}/${BLOCK_TARGET[b.id]} min`)));
    }
    return h('div', { class: 'block' + (isDone ? ' done' : '') },
      h('div', { class: 'block-name' }, h('b', null, b.name), h('span', null, b.mins)),
      body,
      h('div', { class: 'actions' }, b.act ? h('button', { type: 'button', class: 'btn ' + (isDone ? '' : 'primary'), onclick: b.act }, b.label, ' →') : null));
  }));

  // This week + snapshot
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const mins = days.map(k => dayMinutes(k));
  const maxM = Math.max(30, ...mins);
  const weekChart = h('div', { style: 'display:grid;grid-template-columns:repeat(7,1fr);gap:8px;align-items:end;height:120px' },
    days.map((k, i) => h('div', { style: 'display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end' },
      h('span', { class: 'note mono', style: 'font-size:11px' }, mins[i] >= 1 ? Math.round(mins[i]) : ''),
      h('div', { style: { width: '100%', 'max-width': '34px', height: Math.max(3, mins[i] / maxM * 80) + 'px', 'border-radius': '6px', background: mins[i] >= 1 ? (k === today ? 'var(--ink)' : 'var(--ink-3)') : 'var(--panel-3)' } }),
      h('span', { class: 'note', style: 'font-size:11.5px' }, weekdayName(k)))));
  const totalWeek = mins.reduce((a, b) => a + b, 0);
  const snapshot = degreeLadder('deg', true);
  return {
    el: h('div', { class: 'view' }, hero,
      h('div', { class: 'card-head', style: 'margin:6px 0 -4px' }, h('h2', { style: 'font-size:20px' }, 'Today’s session'), h('button', { type: 'button', class: 'btn ghost small', onclick: () => go('plan') }, 'See the full plan →')),
      list,
      h('div', { class: 'grid-2' },
        h('div', { class: 'card' }, h('div', { class: 'card-head' }, h('h2', null, 'Last 7 days'), h('span', { class: 'note mono' }, Math.round(totalWeek) + ' min')), weekChart),
        h('div', { class: 'card' }, h('div', { class: 'card-head' }, h('h2', null, 'Your ear'), h('button', { type: 'button', class: 'btn ghost small', onclick: () => go('stats') }, 'Progress →')), snapshot))),
  };
}

// Degree ladder in circle-of-fifths order (flat side → sharp side)
function degreeLadder(cat, compact) {
  const tiles = FIFTHS_ORDER.map(d => {
    const a = agg(cat, d.id);
    const acc = a.recentAcc ?? a.acc;
    return h('div', { class: 'tile', style: { ...hueVars(d.semi), '--a': a.n ? (0.25 + 0.75 * (acc ?? 0)).toFixed(2) : '0.08' }, title: `${d.label}: ${a.n} tries` },
      h('b', null, d.label),
      h('span', null, a.n ? fmtPct(acc) : '–'),
      compact ? null : h('em', null, a.avgMs != null ? fmtSec(a.avgMs) : (a.n ? '' : 'no data')));
  });
  const anyData = FIFTHS_ORDER.some(d => agg(cat, d.id).n);
  return h('div', null,
    h('div', { class: 'ladder' }, tiles),
    h('div', { class: 'ladder-axis' }, h('span', null, '← darker (flat side)'), h('span', null, 'brighter (sharp side) →')),
    anyData ? null : h('p', { class: 'note', style: 'margin-top:10px' }, 'Fills in as you answer. Tile strength shows accuracy over your last 20 tries.'));
}

// ---------------- Plan ----------------
function PlanView() {
  const week = currentWeek(), cur = phaseFor(week);
  const weekSel = selectField('Current week', Array.from({ length: 12 }, (_, i) => [i + 1, `Week ${i + 1}`]), Math.min(Math.max(week, 1), 12), v => { setWeek(Number(v)); toast(`Moved to week ${v}.`); App.render(); });
  const phases = h('div', { class: 'phases' }, PHASES.map(p => h('section', { class: 'phase' + (p === cur ? ' current' : '') },
    h('div', { class: 'phase-meta' }, h('span', { class: 'pill' + (p === cur ? ' now' : '') }, p === cur ? `You’re in week ${week}` : `Weeks ${p.from}–${p.to}`), h('b', null, p.name), h('span', { class: 'note' }, `Weeks ${p.from}–${p.to}`)),
    h('div', { class: 'phase-tasks' },
      h('div', null, h('span', { class: 'eyebrow' }, 'Ear · 10 min'), h('p', null, p.ear.text)),
      h('div', null, h('span', { class: 'eyebrow' }, 'Sing · 5 min'), h('p', null, p.sing.text)),
      h('div', null, h('span', { class: 'eyebrow' }, 'Voicings · 10–15 min'), h('p', null, p.voice.text)),
      h('div', null, h('span', { class: 'eyebrow' }, `${p.trans.title} · 10–15 min`), h('p', null, p.trans.text))))));
  return {
    el: h('div', { class: 'view' },
      h('div', { class: 'view-head' }, h('div', null, h('h1', null, '12-week plan'), h('p', { class: 'sub' }, 'Every session has the same four parts: ear, singing, voicings, and transcription or reharmonization. What goes into each part changes every three weeks.')), weekSel),
      phases,
      h('p', { class: 'note' }, `Started ${new Date(parseDay(Store.state.plan.start)).toLocaleDateString(undefined, { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' })}. Aim for 30–45 minutes a day. Daily beats long and occasional.`)),
  };
}

// ---------------- Progress ----------------
function StatsView() {
  let ctx = 'deg';
  const today = dayKey();
  const weekMin = Array.from({ length: 7 }, (_, i) => dayMinutes(addDays(today, -i))).reduce((a, b) => a + b, 0);
  const degKeys = DEGREES.map(d => d.id);
  let n = 0, c = 0; for (const k of degKeys) { const a = agg('deg', k); n += a.n; c += a.c; }
  const vcKeys = allKeys('vc');
  let vms = 0, vmc = 0; for (const k of vcKeys) { const a = agg('vc', k); if (a.avgMs != null) { vms += a.avgMs * a.c; vmc += a.c; } }
  const kpis = h('div', { class: 'kpis' },
    kpi(Math.round(weekMin) + ' min', 'Practice, last 7 days'),
    kpi(String(streak()), 'Day streak'),
    kpi(n ? fmtPct(c / n) : '–', `Degrees right (${n} tries)`),
    kpi(vmc ? fmtSec(vms / vmc) : '–', 'Average voicing time'));
  const ladderBox = h('div');
  const renderLadder = () => ladderBox.replaceChildren(degreeLadder(ctx, false));
  const ctxSeg = segmented([['deg', 'Major keys'], ['degm', 'Minor keys']], ctx, v => { ctx = v; renderLadder(); }, 'Key context');
  renderLadder();

  // Confusions
  const conf = Object.entries(mergedConf()).filter(([k]) => k.startsWith('deg:') || k.startsWith('degm:')).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const confBox = conf.length ? h('div', { class: 'confusions' }, conf.map(([k, v]) => {
    const [, pair] = k.split(':'); const [t, a] = pair.split('>');
    return h('span', { class: 'conf' }, degChip(t), h('span', { class: 'faint' }, 'heard as'), degChip(a), h('b', { class: 'mono' }, '×' + v));
  })) : h('p', { class: 'note' }, 'No mix-ups recorded yet.');

  const chq = barList('chq', Object.keys(QUAL), k => QUAL[k].sym || 'maj', 'accuracy');
  const prg = barList('prg', Object.keys(NUMERALS), k => NUMERALS[k].label, 'accuracy');
  const sng = barList('sng', DEGREES.map(d => d.id), k => DEG[k].label, 'sing');
  const snc = barList('snc', Object.keys(TONE_NAMES), k => TONE_NAMES[k], 'sing');

  // Voicing heat grid
  const types = [...new Set(allKeys('vk').map(k => k.split(':')[0]))];
  const vt = types.length ? h('div', { class: 'heat-wrap' }, h('table', { class: 'heat' },
    h('tr', null, h('th', null, ''), ...CYCLE_4THS.map(k => h('th', { class: 'k', scope: 'col' }, ROOT_NAMES[k]))),
    ...types.map(t => h('tr', null, h('th', { scope: 'row' }, voicingTypeName(t)), ...CYCLE_4THS.map(k => heatCell(agg('vk', t + ':' + k).avgMs)))))) : h('p', { class: 'note' }, 'Play some voicings and your time per key shows here: green is quick, red is slow.');

  // Calendar: last 12 weeks
  const start = addDays(today, -(7 * 12 - 1) - new Date(parseDay(today)).getUTCDay());
  const cells = [];
  for (let k = start; dayDiff(k, today) >= 0; k = addDays(k, 1)) {
    const m = dayMinutes(k);
    cells.push(h('i', { 'data-l': m >= 30 ? 3 : m >= 15 ? 2 : m >= 1 ? 1 : 0, class: k === today ? 'today' : '', title: `${k}: ${Math.round(m)} min` }));
  }
  const devices = Object.entries(Store.state.buckets).filter(([, b]) => b.at > 0).sort((a, b) => b[1].at - a[1].at);
  return {
    el: h('div', { class: 'view' },
      h('div', { class: 'view-head' }, h('div', null, h('h1', null, 'Progress'), h('p', { class: 'sub' }, 'Accuracy uses your last 20 tries at each item, so it tracks where you are now.'))),
      kpis,
      h('div', { class: 'card' }, h('div', { class: 'card-head' }, h('h2', null, 'Scale degrees'), ctxSeg), ladderBox),
      h('div', { class: 'card' }, h('div', { class: 'card-head' }, h('h2', null, 'Most common mix-ups')), confBox),
      h('div', { class: 'grid-2' },
        h('div', { class: 'card' }, h('div', { class: 'card-head' }, h('h2', null, 'Chord qualities')), chq),
        h('div', { class: 'card' }, h('div', { class: 'card-head' }, h('h2', null, 'Progression chords')), prg)),
      h('div', { class: 'card' }, h('div', { class: 'card-head' }, h('h2', null, 'Voicings by key'), h('span', { class: 'note' }, 'Average seconds to play it right')), vt),
      h('div', { class: 'grid-2' },
        h('div', { class: 'card' }, h('div', { class: 'card-head' }, h('h2', null, 'Singing degrees')), sng),
        h('div', { class: 'card' }, h('div', { class: 'card-head' }, h('h2', null, 'Singing chord tones')), snc)),
      h('div', { class: 'card' }, h('div', { class: 'card-head' }, h('h2', null, 'Last 12 weeks'), h('span', { class: 'note' }, 'Darker = more minutes')), h('div', { class: 'cal' }, cells)),
      devices.length > 1 ? h('p', { class: 'note' }, 'Combined from: ', devices.map(([, b]) => b.name).join(', '), '.') : null),
  };
}
function kpi(v, label) { return h('div', { class: 'kpi' }, h('b', null, v), h('span', null, label)); }
function mergedConf() { const out = {}; for (const b of Object.values(Store.state.buckets)) for (const [k, v] of Object.entries(b.stats?.conf || {})) out[k] = (out[k] || 0) + v; return out; }
function voicingTypeName(t) { const base = t.replace('-251', ''); const vt = VOICING_TYPES.find(x => x.id === base); return (vt ? vt.name : base) + (t.endsWith('-251') ? ' ii–V–I' : ''); }
function barList(cat, keys, labelFn, mode) {
  const rows = keys.map(k => [k, agg(cat, k)]).filter(([, a]) => a.n > 0);
  if (!rows.length) return h('p', { class: 'note' }, 'No tries yet.');
  return h('div', { class: 'bars' }, rows.map(([k, a]) => {
    const acc = a.recentAcc ?? a.acc ?? 0;
    const val = mode === 'sing' ? `${fmtPct(acc)}${a.cents != null ? ' · ' + Math.round(a.cents) + '¢' : ''}` : `${fmtPct(acc)} · ${a.avgMs != null ? fmtSec(a.avgMs) : '–'}`;
    return h('div', { class: 'bar-row' }, h('span', { class: 'lab' }, labelFn(k)), h('div', { class: 'track' }, h('i', { style: { width: Math.round(acc * 100) + '%', background: `oklch(calc(var(--chip-l) - 8%) var(--chip-c) ${Math.round(30 + acc * 120)})` } })), h('span', { class: 'val' }, val));
  }));
}

// ---------------- Settings ----------------
function SettingsView(sub) {
  const s = Settings.get();
  const row = (title, desc, ...ctl) => h('div', { class: 'set-row' }, h('div', { class: 'lbl' }, h('b', null, title), desc ? h('span', null, desc) : null), h('div', { class: 'ctl' }, ...ctl));
  const sel = (id, opts, val, fn) => { const e = h('select', { id, 'aria-label': id }); for (const [v, t] of opts) e.append(h('option', { value: String(v), selected: String(v) === String(val) }, t)); e.addEventListener('change', () => fn(e.value)); return e; };
  const tg = (id, label, val, fn) => toggleField(label, val, fn, id);

  // Sound
  const sound = h('section', { class: 'card', id: 'sound' }, h('div', { class: 'card-head' }, h('h2', null, 'Sound')), h('div', { class: 'set-list' },
    row('Instrument', 'Used for cadences, chords and your keyboard.', sel('set-instrument', [['piano', 'Grand piano'], ['epiano', 'Electric piano'], ['synth', 'Soft synth']], s.instrument, v => { Settings.set({ instrument: v }); testSound(); })),
    row('Volume', null, (() => { const r = h('input', { type: 'range', id: 'set-volume', min: 0, max: 1, step: 0.05, value: s.volume, 'aria-label': 'Volume' }); r.addEventListener('input', () => Settings.set({ volume: Number(r.value) })); return r; })()),
    row('Room sound', 'A little reverb around the piano.', tg('set-reverb', 'On', s.reverb, v => Settings.set({ reverb: v }))),
    row('Test', null, h('button', { type: 'button', class: 'btn', onclick: () => testSound() }, icon('play'), 'Play a chord'))));

  // MIDI
  const midiBox = h('div', { class: 'set-list' });
  const renderMidi = () => {
    const st = Settings.get();
    if (IN_CLAUDE) {
      midiBox.replaceChildren(h('div', { class: 'callout' }, icon('info'), h('div', null, h('strong', null, 'MIDI isn’t available inside Claude. '), 'Open Harmony Gym as its own page in Chrome on your Mac and your keyboard connects here. You can still tap answers and play voicings on the on-screen keys.')));
      return;
    }
    if (MidiIO.status === 'unsupported') { midiBox.replaceChildren(h('div', { class: 'callout' }, icon('info'), h('div', null, 'This browser has no Web MIDI. Use Chrome or Edge to connect a keyboard.'))); return; }
    if (MidiIO.status !== 'ready') {
      midiBox.replaceChildren(row('Keyboard', MidiIO.status === 'blocked' ? 'Chrome refused MIDI access. Allow it from the icon in the address bar, then try again.' : 'Connect your MIDI keyboard over USB, then allow access when Chrome asks.',
        h('button', { type: 'button', class: 'btn primary', onclick: async () => { await AudioEngine.init().catch(() => {}); await MidiIO.connect(); renderMidi(); } }, 'Connect keyboard')));
      return;
    }
    const ins = MidiIO.inputs.map(i => [i.name, i.name]);
    const outs = [['', 'Off: play sounds in the app'], ...MidiIO.outputs.map(o => [o.name, o.name])];
    midiBox.replaceChildren(
      row('Keyboard input', MidiIO.input ? `Listening to ${MidiIO.input.name}.` : 'No keyboard found. Check the USB cable.', ins.length ? sel('set-midi-in', ins, MidiIO.input?.name || '', v => { Settings.set({ midiIn: v }); MidiIO.refresh(); renderMidi(); }) : h('span', { class: 'note' }, 'None')),
      row('Play my keyboard through the app', 'Turn off if Logic is already making sound from your keyboard.', tg('set-thru', 'On', st.thru, v => Settings.set({ thru: v }))),
      row('Send app sounds to Logic', 'Pick the IAC Driver bus to hear cadences and chords on your own Logic instruments.', sel('set-midi-out', outs, st.midiOut, v => { Settings.set({ midiOut: v }); MidiIO.refresh(); renderMidi(); })),
      st.midiOut ? row('Mute the app’s own sound', 'When sending to Logic, only Logic plays.', tg('set-mute', 'On', st.muteWhenOut, v => Settings.set({ muteWhenOut: v }))) : null,
      h('details', null, h('summary', { style: 'cursor:pointer;font-weight:650' }, 'Set up Logic to play the app’s sounds'),
        h('ol', { class: 'steps', style: 'margin-top:10px' },
          h('li', null, 'Open ', h('b', null, 'Audio MIDI Setup'), ' (in Applications → Utilities) and choose ', h('b', null, 'Window → Show MIDI Studio'), '.'),
          h('li', null, 'Double-click ', h('b', null, 'IAC Driver'), ', tick ', h('b', null, 'Device is online'), ', and click Apply.'),
          h('li', null, 'Back here, choose ', h('b', null, 'IAC Driver Bus 1'), ' under “Send app sounds to Logic”.'),
          h('li', null, 'In Logic, record-enable a software instrument track. Logic listens to all MIDI inputs by default, so the app’s notes play through it.'),
          h('li', null, 'Keep your keyboard input set to your Komplete Kontrol, not the IAC bus, so the app doesn’t hear its own notes.')))
    );
  };
  renderMidi();
  const offMidi = Bus.on('midi', renderMidi);
  const midi = h('section', { class: 'card', id: 'midi' }, h('div', { class: 'card-head' }, h('h2', null, 'MIDI keyboard')), midiBox);

  // Mic
  const micBox = h('section', { class: 'card', id: 'mic' }, h('div', { class: 'card-head' }, h('h2', null, 'Microphone')), h('div', { class: 'set-list' },
    IN_CLAUDE ? h('div', { class: 'callout' }, icon('info'), h('div', null, h('strong', null, 'The microphone isn’t available inside Claude. '), 'Singing exercises use self-check mode here. Open the app as its own page in Chrome for live pitch detection.')) : null,
    row('Echo cancellation', 'On if you sing with speakers. Off with headphones, for the cleanest pitch reading.', tg('set-aec', 'On', s.aec, v => { Settings.set({ aec: v }); Mic.stop(); }))));

  // Ear
  const ear = h('section', { class: 'card', id: 'ear' }, h('div', { class: 'card-head' }, h('h2', null, 'Ear training')), h('div', { class: 'set-list' },
    row('Degree labels', 'Show movable-do solfège under the numbers.', sel('set-labels', [['numbers', 'Numbers'], ['solfege', 'Numbers + solfège']], s.labels, v => Settings.set({ labels: v }))),
    row('Cadence speed', null, sel('set-cad', [['relaxed', 'Relaxed'], ['normal', 'Normal'], ['quick', 'Quick']], s.cadenceSpeed, v => Settings.set({ cadenceSpeed: v }))),
    row('Play the cadence', 'Hearing it every time is best at first. Later, only when the key changes.', sel('set-cadevery', [['question', 'Before every question'], ['key', 'Only when the key changes']], s.cadenceEvery, v => Settings.set({ cadenceEvery: v }))),
    row('Key context', 'Add a drone on the tonic under the exercise.', sel('set-ctx', [['cadence', 'Cadence only'], ['cadence-drone', 'Cadence + drone']], s.context, v => Settings.set({ context: v }))),
    row('Note range', 'Wide spreads target notes over two octaves, so you hear the degree, not the pitch.', sel('set-range', [['wide', 'Wide (2 octaves)'], ['narrow', 'Narrow (1 octave above the tonic)']], s.range, v => Settings.set({ range: v }))),
    row('Resolve after answering', 'Plays the note walking home to the tonic.', tg('set-resolve', 'On', s.resolve, v => Settings.set({ resolve: v }))),
    row('Move on automatically', 'Goes to the next question after a correct answer.', tg('set-auto', 'On', s.autoNext, v => Settings.set({ autoNext: v })))));

  // Plan
  const plan = h('section', { class: 'card', id: 'plan' }, h('div', { class: 'card-head' }, h('h2', null, 'Plan')), h('div', { class: 'set-list' },
    row('Current week', 'Move forward or back in the 12-week plan.', sel('set-week', Array.from({ length: 12 }, (_, i) => [i + 1, `Week ${i + 1}`]), clamp(currentWeek(), 1, 12), v => { setWeek(Number(v)); toast(`Moved to week ${v}.`); }))));

  // Progress & sync
  const codeOut = h('textarea', { id: 'sync-out', readonly: true, rows: 3, 'aria-label': 'Your sync code', placeholder: 'Your code appears here.' });
  const codeIn = h('textarea', { id: 'sync-in', rows: 3, 'aria-label': 'Paste a sync code', placeholder: 'Paste a code from your other device here.' });
  const resetBox = h('div');
  const showReset = () => resetBox.replaceChildren(h('button', { type: 'button', class: 'btn danger', onclick: () => resetBox.replaceChildren(h('div', { class: 'confirm' },
    h('span', null, 'Erase this device’s practice history? Other devices keep theirs.'),
    h('button', { type: 'button', class: 'btn danger', onclick: () => { Store.resetMine(); toast('This device’s history was erased.'); showReset(); } }, 'Erase'),
    h('button', { type: 'button', class: 'btn', onclick: () => showReset() }, 'Keep it'))) }, 'Erase this device’s history'));
  showReset();
  const where = Store.mode === 'claude'
    ? 'Your progress is saved to your Claude account and follows you to any device where you open Harmony Gym in Claude.'
    : IN_CLAUDE ? 'Your progress is saved in this browser. Sign in to Claude to save it to your account.' : 'Your progress is saved in this browser on this device. To combine it with another device, copy a sync code here and paste it there.';
  const devices = Object.entries(Store.state.buckets).filter(([, b]) => b.at > 0);
  const nameInp = h('input', { type: 'text', id: 'set-device', value: Store.bucket().name, 'aria-label': 'Device name' });
  nameInp.addEventListener('change', () => { Store.bucket().name = nameInp.value.trim().slice(0, 40) || deviceLabel(); Store.markDirty(); });
  const progress = h('section', { class: 'card', id: 'sync' }, h('div', { class: 'card-head' }, h('h2', null, 'Progress & sync')), h('div', { class: 'set-list' },
    h('p', { class: 'note' }, where),
    row('This device', 'How it’s named when progress is combined.', nameInp),
    devices.length ? row('Devices with progress', null, h('span', { class: 'note' }, devices.map(([id, b]) => b.name + (id === Store.deviceId ? ' (this one)' : '')).join(', '))) : null,
    h('div', { class: 'set-row' }, h('div', { class: 'lbl' }, h('b', null, 'Copy a sync code'), h('span', null, 'Contains all your progress. Paste it into the app on your other device.')),
      h('div', { class: 'ctl', style: 'flex-direction:column;align-items:stretch' }, codeOut,
        h('button', { type: 'button', class: 'btn', onclick: async () => {
          const code = await Store.exportCode(); codeOut.value = code;
          try { await navigator.clipboard.writeText(code); toast('Sync code copied.'); } catch { codeOut.focus(); codeOut.select(); toast('Code ready. Select it and copy.'); }
        } }, 'Create and copy code'))),
    h('div', { class: 'set-row' }, h('div', { class: 'lbl' }, h('b', null, 'Paste a sync code'), h('span', null, 'Adds the other device’s progress here. Nothing is overwritten.')),
      h('div', { class: 'ctl', style: 'flex-direction:column;align-items:stretch' }, codeIn,
        h('button', { type: 'button', class: 'btn', onclick: async () => {
          try { const n = await Store.importCode(codeIn.value); codeIn.value = ''; toast(n ? 'Progress combined.' : 'Nothing new in that code.'); App.render(); }
          catch (e) { toast(e.message || 'That code could not be read.'); }
        } }, 'Combine progress'))),
    row('Start over', null, resetBox)));

  const about = h('section', { class: 'card', id: 'about' }, h('div', { class: 'card-head' }, h('h2', null, 'About')),
    h('p', { class: 'note' }, 'Harmony Gym, version 1. Piano: Salamander Grand Piano by Alexander Holm, CC BY 3.0. ',
      IN_CLAUDE ? 'Running inside Claude: MIDI and the microphone need the standalone page.' : 'Running as a standalone page.'));
  const el = h('div', { class: 'view' }, h('div', { class: 'view-head' }, h('div', null, h('h1', null, 'Settings'))), midi, sound, micBox, ear, plan, progress, about);
  if (sub) setTimeout(() => document.getElementById(sub)?.scrollIntoView({ block: 'start' }), 30);
  return { el, destroy() { offMidi(); } };
}
async function testSound() {
  try { await AudioEngine.init(); } catch (e) { toast(e.message); return; }
  AudioEngine.stopAll();
  const t = AudioEngine.t0(0.05);
  AudioEngine.chord([48, 59, 64, 67, 74], t, 1.8, 0.6, 0.03);
}

// ---------------- App shell ----------------
const NAV = [['today', 'Today'], ['ear', 'Ear'], ['voicings', 'Voicings'], ['sing', 'Sing'], ['stats', 'Progress'], ['plan', 'Plan'], ['settings', 'Settings']];
const TABS = ['today', 'ear', 'voicings', 'sing', 'stats'];
const VIEWS = { today: TodayView, ear: EarView, voicings: VoicingsView, sing: SingView, stats: StatsView, plan: PlanView, settings: SettingsView };
const App = {
  view: null, route: 'today', main: null,
  mount() {
    const navLink = (id, label) => h('a', { href: '#' + id, 'data-route': id }, icon(id), h('span', null, label));
    const midiChip = () => h('button', { type: 'button', class: 'chip-status', 'data-chip': 'midi', onclick: () => this.midiChipClick() }, h('span', { class: 'dot' }), h('span', { class: 't' }, ''));
    const saveChip = () => h('button', { type: 'button', class: 'chip-status', 'data-chip': 'save', onclick: () => go('settings-sync') }, h('span', { class: 'dot' }), h('span', { class: 't' }, ''), h('span', { class: 't-short' }, ''));
    const rail = h('aside', { class: 'rail' },
      h('div', { class: 'brand' }, brandMark(28), 'Harmony Gym'),
      h('nav', { class: 'nav', 'aria-label': 'Main' }, NAV.map(([id, l]) => navLink(id, l))),
      h('div', { class: 'rail-foot' }, h('div', { class: 'status-row' }, midiChip()), h('div', { class: 'status-row' }, saveChip())));
    const topbar = h('header', { class: 'topbar' }, h('div', { class: 'topbar-in' },
      h('div', { class: 'brand' }, brandMark(24), 'Harmony Gym'),
      saveChip(),
      h('a', { class: 'icon-btn', href: '#plan', 'aria-label': 'Plan' }, icon('plan')),
      h('a', { class: 'icon-btn', href: '#settings', 'aria-label': 'Settings' }, icon('settings'))));
    this.main = h('main', { id: 'main' });
    const tabbar = h('nav', { class: 'tabbar', 'aria-label': 'Sections' }, h('div', { class: 'tabbar-in' }, TABS.map(id => navLink(id, NAV.find(n => n[0] === id)[1]))));
    const app = h('div', { class: 'app' }, rail, h('div', { style: 'min-width:0' }, topbar, this.main), tabbar);
    document.getElementById('root').replaceChildren(app);
    addEventListener('hashchange', () => this.render());
    addEventListener('keydown', e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
      if (e.target.closest && e.target.closest('.piano') && (e.key === 'Enter' || e.key === ' ')) return;
      if (tag === 'button' && (e.code === 'Space' || e.code === 'Enter') && !e.target.closest('.pad')) { /* let the view decide */ }
      if (this.view?.onKey?.(e)) e.preventDefault();
    });
    Bus.on('midi', () => this.updateChips());
    Bus.on('save', () => this.updateChips());
    Bus.on('storage', () => { this.updateChips(); if (['today', 'stats', 'plan', 'settings'].includes(this.route)) this.render(); });
    Bus.on('remote', () => { if (['today', 'stats', 'plan'].includes(this.route)) this.render(); });
    this.render();
    this.updateChips();
  },
  async midiChipClick() {
    if (IN_CLAUDE || MidiIO.status === 'unsupported') { go('settings-midi'); return; }
    if (MidiIO.status !== 'ready') { await AudioEngine.init().catch(() => {}); await MidiIO.connect(); if (MidiIO.status === 'ready') toast(MidiIO.input ? `Connected: ${MidiIO.input.name}` : 'MIDI is on, but no keyboard was found.'); return; }
    go('settings-midi');
  },
  updateChips() {
    const ml = MidiIO.label();
    for (const c of $$('[data-chip="midi"]')) { c.className = 'chip-status ' + ml.cls; c.querySelector('.t').textContent = ml.text; }
    let text, cls;
    if (Store.status === 'error') { text = 'Not saved to account'; cls = 'warn'; }
    else if (Store.status === 'pending') { text = 'Saving…'; cls = ''; }
    else if (Store.mode === 'claude') { text = 'Saved to your account'; cls = 'on'; }
    else { text = 'Saved on this device'; cls = 'on'; }
    const short = Store.status === 'error' ? 'Not saved' : Store.status === 'pending' ? 'Saving…' : 'Saved';
    for (const c of $$('[data-chip="save"]')) { c.className = 'chip-status ' + cls; c.querySelector('.t').textContent = text; c.querySelector('.t-short').textContent = short; c.title = Store.error || text; c.setAttribute('aria-label', text); }
  },
  render() {
    const raw = (location.hash || '#today').slice(1);
    const [route, sub] = raw.split('-');
    const r = VIEWS[route] ? route : 'today';
    try { this.view?.destroy?.(); } catch (e) { console.error(e); }
    this.route = r;
    this.view = VIEWS[r](sub);
    this.main.replaceChildren(this.view.el);
    for (const a of $$('[data-route]')) { if (a.dataset.route === r) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }
    if (!sub) scrollTo(0, 0);
    document.title = 'Harmony Gym';
  },
};

// ---------------- Boot ----------------
function boot() {
  Store.init();
  App.mount();
  Store.connectClaude();
  MidiIO.autoConnect();
  addEventListener('pointerdown', () => { AudioEngine.init().catch(() => {}); }, { capture: true, once: true });
  addEventListener('keydown', () => { AudioEngine.init().catch(() => {}); }, { capture: true, once: true });
  try { navigator.storage?.persist?.().catch(() => {}); } catch { /* optional */ }
  window.__hg = { DEBUG, Store, Settings, AudioEngine, MidiIO, Mic, yin, checkVoicing, buildTarget, genProgression, resolutionNotes, voiceLead, agg, record, App, PROG_LEVELS, NUMERALS, qualPcs, nameChord, centsTo, toneInterval, cadenceChords, PHASES, suggestEar };
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
