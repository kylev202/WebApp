// Gym analytics: a lifting report. How strong you are for your body weight, whether
// you are actually adding load over time, where the volume goes and whether the
// programme is balanced. Everything comes from logged sets — the only estimate is
// the Epley one-rep max the rest of the app already uses.
import { state } from './store.js';
import { esc, dayKey, addDays, daysBetween, weekStart, shortDate, fmt, fmt1, mean, sum, plural, clamp } from './util.js';
import { icon, tile } from './icons.js';
import { lineChart, sparkline } from './charts.js';
import { weights } from './data.js';
import { workouts, routine, exById, history, e1rm } from './gym.js';
import { MUSCLES, REGIONS, REGION_PATTERN, exRegions } from './gym-data.js';
import { bodyMap, toFills, addRegions } from './body.js';
import { chip, note, notes, signed, fmtMins, stat, section, sd, slope, dayNo } from './an-ui.js';

// ---------- training theory, in constants ----------
// Weekly hard sets per muscle: below MEV little grows, MEV–MRV is the productive
// range, past MRV recovery usually fails before the muscle does.
const MEV = 10, MAV = 18, MRV = 22;
// Acute:chronic workload ratio — the window where adaptation is high and injury risk low.
const ACWR_OK = [0.8, 1.3];

// Movement pattern per exercise, read off the muscles it works, so a move added
// to the library is classified without a second table to keep in step.
const patternOf = exId => {
  const tally = {};
  exRegions(exById(exId)).pri.forEach(r => { const p = REGION_PATTERN[r]; if (p) tally[p] = (tally[p] ?? 0) + 1; });
  return Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'core';
};

// Weekly hard sets each muscle region wants before it grows — the MEV above,
// scaled down for the small muscles that get plenty of work indirectly.
const REGION_MEV = { ch: 10, df: 6, ds: 8, dr: 8, tr: 6, lt: 10, ub: 8, lb: 4, bi: 8, tx: 8, fa: 4, ab: 6, ob: 4, gl: 8, qu: 10, ha: 8, ca: 8 };

// Vertical vs horizontal, for the pulling balance that keeps shoulders healthy.
const VERTICAL = new Set(['pullup', 'chinup', 'neutral_pullup', 'lat_pulldown', 'close_pulldown', 'neutral_pulldown', 'ohp', 'seated_ohp', 'push_press', 'db_shoulder', 'arnold', 'machine_shoulder']);

// One-rep max as a multiple of body weight, at each level. Widely published
// strength standards for men; women's thresholds run about 73% of these.
const STANDARDS = {
  squat: [0.75, 1.25, 1.75, 2.5, 3.0],
  bench: [0.5, 0.75, 1.25, 1.75, 2.0],
  deadlift: [1.0, 1.5, 2.25, 3.0, 3.5],
  ohp: [0.35, 0.55, 0.8, 1.1, 1.4],
  row: [0.5, 0.75, 1.0, 1.4, 1.75],
  front_squat: [0.6, 1.0, 1.4, 2.0, 2.4],
  hip_thrust: [1.0, 1.5, 2.0, 2.75, 3.25],
};
const LEVELS = ['Untrained', 'Beginner', 'Novice', 'Intermediate', 'Advanced', 'Elite'];
const LEVEL_LV = ['low', 'low', 'ok', 'good', 'good', 'good'];
const FEMALE = 0.73;

// Strength ratios a balanced lifter tends to land near, as a share of the bench press.
const RATIOS = [
  { a: 'squat', b: 'bench', ideal: 1.3, span: 0.25, label: 'Squat : Bench', low: 'legs lag the upper body', high: 'upper body lags the legs' },
  { a: 'deadlift', b: 'squat', ideal: 1.2, span: 0.25, label: 'Deadlift : Squat', low: 'posterior chain lags', high: 'squat pattern lags' },
  { a: 'ohp', b: 'bench', ideal: 0.65, span: 0.12, label: 'Press : Bench', low: 'shoulders lag the chest', high: 'chest lags the shoulders' },
  { a: 'row', b: 'bench', ideal: 1.0, span: 0.2, label: 'Row : Bench', low: 'back lags the chest', high: 'chest lags the back' },
];

const volumeOf = w => w.exercises.reduce((t, x) => t + x.sets.reduce((s, y) => s + (Number(y.kg) || 0) * (Number(y.reps) || 0), 0), 0);
const setsOf = w => w.exercises.reduce((t, x) => t + x.sets.length, 0);
const repsOf = w => w.exercises.reduce((t, x) => t + x.sets.reduce((s, y) => s + (Number(y.reps) || 0), 0), 0);
const tonnes = v => (v >= 1000 ? `${fmt1(v / 1000)} t` : `${fmt(v)} kg`);

// ---------- the numbers ----------
function gymFacts() {
  const all = workouts();                 // newest first
  const today = dayKey();
  const w0 = weekStart();
  const since = n => all.filter(x => x.date > addDays(today, -n));
  const bw = weights().at(-1)?.kg ?? null;
  const female = (state.kv.profile?.sex ?? '') === 'female';

  const weeks = Array.from({ length: 12 }, (_, i) => addDays(w0, (i - 11) * 7));
  const weekStats = weeks.map(w => {
    const ws = all.filter(x => x.date >= w && x.date <= addDays(w, 6));
    return { w, n: ws.length, sets: sum(ws.map(setsOf)), vol: sum(ws.map(volumeOf)), reps: sum(ws.map(repsOf)) };
  });

  // Acute:chronic workload: this week's tonnage against your own 4-week average.
  const volIn = n => sum(since(n).map(volumeOf));
  const acute = volIn(7), chronic = volIn(28) / 4;
  const acwr = chronic > 0 && since(28).length >= 4 ? acute / chronic : null;

  // Hard sets and training days per muscle, this week and over the last 4.
  const perMuscle = Object.keys(MUSCLES).map(m => {
    const setsIn = n => sum(since(n).map(w => sum(w.exercises.filter(x => exById(x.exId).muscle === m).map(x => x.sets.length))));
    const days = new Set(since(28).filter(w => w.exercises.some(x => exById(x.exId).muscle === m)).map(w => w.date));
    const weekly = weekStats.slice(-6).map(({ w }) => sum(all.filter(x => x.date >= w && x.date <= addDays(w, 6))
      .map(x => sum(x.exercises.filter(e => exById(e.exId).muscle === m).map(e => e.sets.length)))));
    return { m, name: MUSCLES[m], sets: setsIn(7), avg4: setsIn(28) / 4, freq: days.size / 4, weekly };
  });

  // The same sets again, but split across the muscle regions the body map draws.
  const regionWeek = {}, region4 = {};
  since(7).forEach(w => w.exercises.forEach(x => addRegions(regionWeek, exById(x.exId), x.sets.length)));
  since(28).forEach(w => w.exercises.forEach(x => addRegions(region4, exById(x.exId), x.sets.length)));

  // Sets by movement pattern over 4 weeks: the balance checks below read from this.
  const pat = { push: 0, pull: 0, quad: 0, hinge: 0, calf: 0, core: 0 };
  const vert = { vertical: 0, horizontal: 0 };
  since(28).forEach(w => w.exercises.forEach(x => {
    pat[patternOf(x.exId)] += x.sets.length;
    if (VERTICAL.has(x.exId)) vert.vertical += x.sets.length;
    else if (['push', 'pull'].includes(patternOf(x.exId))) vert.horizontal += x.sets.length;
  }));

  // Every working set of the last 4 weeks, by reps and by how heavy it was for that
  // lift. Relative intensity needs a reference, so each set is read against the best
  // estimated 1RM you have ever hit on that exercise.
  const bestEver = {};
  all.forEach(w => w.exercises.forEach(x => {
    const b = Math.max(...x.sets.map(s => e1rm(Number(s.kg) || 0, Number(s.reps) || 0)));
    bestEver[x.exId] = Math.max(bestEver[x.exId] ?? 0, b);
  }));
  const reps = { 1: 0, 6: 0, 9: 0, 13: 0 };
  const zones = { light: 0, moderate: 0, heavy: 0, max: 0 };
  let loaded = 0;
  since(28).forEach(w => w.exercises.forEach(x => x.sets.forEach(s => {
    const r = Number(s.reps) || 0, kg = Number(s.kg) || 0;
    reps[r >= 13 ? 13 : r >= 9 ? 9 : r >= 6 ? 6 : 1] += 1;
    const ref = bestEver[x.exId];
    if (kg > 0 && ref > 0) {
      const pct = kg / ref;
      zones[pct >= 0.9 ? 'max' : pct >= 0.8 ? 'heavy' : pct >= 0.65 ? 'moderate' : 'light'] += 1;
      loaded += 1;
    }
  })));

  // The lifts you train most: estimated 1RM now, the trend through it, and how long
  // since it last moved.
  const count = {};
  all.forEach(w => w.exercises.forEach(x => { count[x.exId] = (count[x.exId] ?? 0) + 1; }));
  const lifts = Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([exId, n]) => {
    const h = history(exId);              // newest first
    const ex = exById(exId);
    const base = h.find(x => x.date <= addDays(today, -28));
    const pct = base?.best ? ((h[0].best - base.best) / base.best) * 100 : null;
    const fit = slope(h.slice().reverse().filter(x => x.date > addDays(today, -84)).map(x => ({ d: dayNo(x.date), y: x.best })));
    const peak = h.reduce((b, x) => (x.best > b.best ? x : b));
    const sincePR = h.findIndex(x => x.id === peak.id);
    // A bodyweight move that never had weight added is measured in reps, not kilos,
    // so its best set, its units and its rate of progress all read that way.
    const unloaded = ex.bw && !h.some(x => x.sets.some(s => (Number(s.kg) || 0) > 0));
    const bestSet = h.flatMap(x => x.sets).reduce((b, s) => (unloaded
      ? ((Number(s.reps) || 0) > (Number(b.reps) || 0) ? s : b)
      : ((Number(s.kg) || 0) > (Number(b.kg) || 0) ? s : b)));
    const std = STANDARDS[exId] && !unloaded && bw ? STANDARDS[exId].map(v => v * (female ? FEMALE : 1) * bw) : null;
    const lvl = std ? std.filter(v => peak.best >= v).length : null;
    return {
      exId, n, name: ex.name, muscle: ex.muscle, sessions: h.length,
      bw: unloaded, unit: unloaded ? 'reps' : 'kg', now: h[0].best, peak: peak.best, pct, fit, sincePR,
      std, lvl,
      trend: h.slice(0, 14).reverse().map(x => x.best),
      top: unloaded ? `${bestSet.reps} reps` : `${fmt1(Number(bestSet.kg) || 0)} kg × ${bestSet.reps}`,
      stalled: h.length >= 4 && sincePR >= 3,
    };
  });

  // A strength index: each tracked lift indexed to 100 at its first logged week,
  // then averaged. One number for "am I getting stronger", immune to which lift
  // happened to be trained in a given week.
  const tracked = lifts.filter(l => l.sessions >= 3);
  const idx = weeks.map((w, i) => {
    const vals = tracked.map(l => {
      const h = history(l.exId).slice().reverse();
      const upTo = h.filter(x => x.date <= addDays(w, 6));
      if (!upTo.length) return null;
      return (Math.max(...upTo.map(x => x.best)) / h[0].best) * 100;
    }).filter(v => v != null);
    return vals.length >= Math.min(2, tracked.length) && i >= 1 ? mean(vals) : null;
  });
  const idxNow = idx.filter(v => v != null).at(-1) ?? null;
  const idx4 = idx[idx.length - 5] ?? null;
  const idxDelta = idxNow != null && idx4 != null ? idxNow - idx4 : null;

  const r = routine();
  const done4 = weekStats.slice(-4);
  const adherence = r?.perWeek ? Math.round((sum(done4.map(x => Math.min(x.n, r.perWeek))) / (r.perWeek * 4)) * 100) : null;
  const hitWeeks = r?.perWeek ? done4.filter(x => x.n >= r.perWeek).length : null;
  const s28 = since(28);
  const avgLen = s28.length ? mean(s28.map(x => (x.end - x.start) / 6e4)) : null;
  const density = s28.length && avgLen ? sum(s28.map(volumeOf)) / sum(s28.map(x => (x.end - x.start) / 6e4)) : null;
  const gap = all.length ? daysBetween(all[0].date, today) : null;
  const prs30 = sum(since(30).map(x => x.prs?.length ?? 0));

  // Longest run of weeks with at least one session, counting back from this week.
  let streak = 0;
  for (let i = weekStats.length - 1; i >= 0; i--) { if (weekStats[i].n) streak++; else if (i < weekStats.length - 1) break; }

  return { all, r, today, w0, bw, female, weeks, weekStats, acwr, perMuscle, regionWeek, region4, pat, vert, reps, zones, loaded,
    lifts, tracked, idx, idxNow, idxDelta, adherence, hitWeeks, avgLen, density, gap, prs30, streak, since };
}

// ---------- training status ----------
// Volume trend and strength trend together: load alone cannot tell hard work that
// is paying off from hard work that is digging a hole.
function status(f) {
  if (f.gap == null || f.gap > 14) return { key: 'detraining', lvl: ['low', 'Detraining'], text: 'No session in over two weeks. Strength starts to slide after about 10 days; restart at roughly 80% of your old loads.' };
  if (f.acwr == null) return { key: 'building', lvl: ['none', 'Building a baseline'], text: 'Four weeks of logged sessions unlock load tracking, training status and trend lines.' };
  const s = f.idxDelta;
  if (f.acwr > 1.5) return { key: 'overreaching', lvl: ['low', 'Overreaching'], text: `This week carries ${f.acwr.toFixed(2)}× your 4-week average. Spikes this size are where overuse injuries start — hold volume or take a lighter week.` };
  if (f.acwr < ACWR_OK[0]) return { key: 'recovering', lvl: ['ok', s > 0.5 ? 'Deloading' : 'Losing load'], text: `Load is ${f.acwr.toFixed(2)}× your 4-week average. Good as a planned deload; otherwise add a session or a few sets back.` };
  if (s == null) return { key: 'maintaining', lvl: ['ok', 'Steady'], text: 'Load sits in the productive range. A few more weeks of lifts repeated will show whether strength is moving with it.' };
  if (s > 1.5) return { key: 'productive', lvl: ['good', 'Productive'], text: `Strength index is up ${signed(s)}% in four weeks on load inside the productive range. Keep the programme as it is.` };
  if (s > 0.3) return { key: 'productive', lvl: ['good', 'Progressing'], text: `Strength index is up ${signed(s)}% in four weeks. Slow but real; keep adding a rep or a small jump each session.` };
  if (s > -0.5) return { key: 'maintaining', lvl: ['ok', 'Maintaining'], text: 'Strength is flat over four weeks. Holding is fine on a cut; on a bulk it means the overload has stopped — add a set per muscle or a session.' };
  return { key: 'unproductive', lvl: ['low', 'Unproductive'], text: `Strength index is down ${signed(s)}% while load stays high. That is the classic under-recovered pattern: check sleep, calories and take a lighter week.` };
}

// ---------- cards ----------
function heroCard(f, st) {
  const cur = f.weekStats.at(-1);
  const prior = mean(f.weekStats.slice(-5, -1).map(x => x.vol));
  const delta = prior ? ((cur.vol - prior) / prior) * 100 : null;
  return `<section class="card glass hv-hero an-hero">
    <div class="label-sm">Training status · this week against your last four</div>
    <div class="hv-top"><div class="hv-headline">${st.lvl[1]}</div>${chip([st.lvl[0],
      f.idxDelta != null ? `${signed(f.idxDelta)}% strength` : f.acwr != null ? `${f.acwr.toFixed(2)}× load` : 'Getting started'])}</div>
    <p class="hv-summary">${st.text}</p>
    <div class="stats an-stats4">
      ${stat('Sessions', `${cur.n}`, f.r?.perWeek ? `/ ${f.r.perWeek}` : 'this week')}
      ${stat('Hard sets', `${cur.sets}`, 'this week')}
      ${stat('Tonnage', tonnes(cur.vol), delta != null ? `${delta >= 0 ? '+' : '−'}${Math.abs(Math.round(delta))}% vs avg` : 'this week')}
      ${stat('Load ratio', f.acwr != null ? f.acwr.toFixed(2) : '–', f.acwr != null ? `${ACWR_OK[0]}–${ACWR_OK[1]} ideal` : '4 wks needed')}
    </div>
  </section>`;
}

// Relative strength: what you lift against what you weigh, on the standard ladder.
function standardsCard(f) {
  const rated = f.lifts.filter(l => l.std && l.lvl != null).sort((a, b) => b.n - a.n).slice(0, 5);
  if (!f.bw) {
    return `<section class="card glass">
      <div class="head"><div class="title">${tile('scale', 'move')}Relative strength</div></div>
      <p class="note">Log a weigh-in and your lifts get read against body weight — the measure that actually tracks strength, with a level for each.</p>
    </section>`;
  }
  if (!rated.length) return '';
  const big3 = ['squat', 'bench', 'deadlift'].map(id => f.lifts.find(l => l.exId === id));
  const total = big3.every(Boolean) ? sum(big3.map(l => l.peak)) : null;
  const totalX = total ? total / f.bw : null;
  const totalStd = [2.5, 3.5, 4.5, 6.0, 7.0].map(v => v * (f.female ? FEMALE : 1));
  const totalLvl = totalX ? totalStd.filter(v => totalX >= v).length : null;

  const ladder = l => {
    const max = l.std[4] * 1.1;
    const pos = v => clamp((v / max) * 100, 0, 100);
    return `<div class="an-std lv-${LEVEL_LV[l.lvl]}">
      <div class="an-std-h"><span class="t">${esc(l.name)}</span><b>${fmt1(l.peak)} kg <small>${fmt1(l.peak / f.bw)}× BW</small></b></div>
      <div class="an-std-bar">${l.std.map((v, i) => `<i class="tick${l.lvl > i ? ' on' : ''}" style="left:${pos(v)}%" title="${LEVELS[i + 1]}"></i>`).join('')}
        <div class="fill" style="width:${pos(l.peak)}%"></div></div>
      <div class="an-std-f"><span>${LEVELS[l.lvl]}</span>${l.lvl < 5 ? `<span>${fmt1(l.std[l.lvl] - l.peak)} kg to ${LEVELS[l.lvl + 1]}</span>` : '<span>Top of the scale</span>'}</div>
    </div>`;
  };

  const ins = [];
  const weakest = rated.reduce((a, b) => (a.lvl <= b.lvl ? a : b));
  const strongest = rated.reduce((a, b) => (a.lvl >= b.lvl ? a : b));
  if (rated.length >= 2 && strongest.lvl - weakest.lvl >= 1) {
    ins.push(note('target', 'move', `Your <b>${esc(weakest.name.toLowerCase())}</b> (${LEVELS[weakest.lvl]}) sits a level behind your <b>${esc(strongest.name.toLowerCase())}</b> (${LEVELS[strongest.lvl]}). Lifts rarely catch up by themselves; train it first in the session while you are fresh.`));
  }
  const next = rated.filter(l => l.lvl < 5 && l.fit?.perWeek > 0.05)
    .map(l => ({ l, wks: (l.std[l.lvl] - l.peak) / l.fit.perWeek }))
    .filter(x => x.wks > 0 && x.wks < 80).sort((a, b) => a.wks - b.wks)[0];
  if (next) ins.push(note('chart', 'school', `At your current rate on the <b>${esc(next.l.name.toLowerCase())}</b> (${signed(next.l.fit.perWeek, 2)} kg a week) you reach ${LEVELS[next.l.lvl + 1]} in <b>${next.wks < 1.5 ? 'a week or two' : `about ${Math.round(next.wks)} weeks`}</b>.`));
  if (totalX) ins.push(note('trophy', 'school', `Squat, bench and deadlift add to <b>${fmt(total)} kg</b> — ${fmt1(totalX)}× your body weight, a ${LEVELS[totalLvl].toLowerCase()} total.`));

  return `${section('Relative strength', `vs ${fmt1(f.bw)} kg body weight`)}
  <section class="card glass">
    ${totalX ? `<div class="hv-top"><div><div class="label-sm">Big 3 total</div><div class="big-xl">${fmt(total)}<small>kg · ${fmt1(totalX)}× BW</small></div></div>${chip([LEVEL_LV[totalLvl], LEVELS[totalLvl]])}</div>` : ''}
    <div class="an-stds">${rated.map(ladder).join('')}</div>
    <p class="note an-foot">Ladders mark Beginner, Novice, Intermediate, Advanced and Elite for a ${f.female ? 'woman' : 'man'} at your body weight, measured on your best estimated one-rep max.</p>
    ${notes(ins)}
  </section>`;
}

// Progressive overload: the composite index, then lift by lift.
function overloadCard(f) {
  const labels = f.weeks.map((w, i) => (i === 11 ? 'Now' : i % 3 === 0 ? shortDate(w) : ''));
  const ins = [];
  if (f.idxDelta != null) {
    ins.push(note('chart', 'move', Math.abs(f.idxDelta) < 0.3
      ? 'The strength index has not moved in four weeks. Plateaus break on a lighter week, a rep-range change or more food, in that order.'
      : `Strength index ${f.idxDelta > 0 ? 'up' : 'down'} <b>${signed(f.idxDelta)}%</b> over four weeks across ${plural(f.tracked.length, 'tracked lift')}.`));
  }
  const stalled = f.lifts.filter(l => l.stalled);
  if (stalled.length) ins.push(note('target', 'school', `No new best on <b>${esc(stalled.slice(0, 3).map(l => l.name).join(', '))}</b> for ${plural(Math.max(...stalled.map(l => l.sincePR)), 'session')}. Drop to 85% for a week, then build back adding reps before weight.`));
  const climbing = f.lifts.filter(l => l.fit?.perWeek > 0.1);
  if (climbing.length) {
    const best = climbing.reduce((a, b) => (a.fit.perWeek > b.fit.perWeek ? a : b));
    ins.push(note('bolt', 'move', `Fastest riser is <b>${esc(best.name.toLowerCase())}</b> at ${signed(best.fit.perWeek, 2)} ${best.unit} a week over 12 weeks (${fmt(best.fit.perWeek * 4)} ${best.unit} a month).`));
  }

  return `${section('Progressive overload', '12 weeks')}
  <section class="card glass">
    <div class="hv-top"><div><div class="label-sm">Strength index · all tracked lifts, 100 = first logged</div>
      <div class="big-xl">${f.idxNow != null ? fmt1(f.idxNow) : '–'}<small>${f.idxDelta != null ? `${signed(f.idxDelta)} in 4 weeks` : f.idxNow != null ? 'four weeks needed for a trend' : 'needs 3 sessions a lift'}</small></div></div></div>
    ${lineChart({ series: [{ values: f.idx, color: 'var(--move)', fill: true }], labels, min: Math.min(95, ...f.idx.filter(v => v != null)) - 1, live: true, yAxis: v => fmt1(v), empty: 'Repeat a few lifts and your strength index appears here.' })}
    ${f.lifts.length ? `<div class="list an-lifts">${f.lifts.slice(0, 6).map(l => `<div class="row tap" data-act="sheet" data-sheet="exDetail" data-id="${l.exId}" role="button">
      <div class="grow"><div class="t">${esc(l.name)}</div>
        <div class="d">${l.top} · ${l.fit ? `${signed(l.fit.perWeek, 2)} ${l.unit}/wk` : `${plural(l.sessions, 'session')}`}${l.stalled ? ' · <span class="late">plateau</span>' : l.sincePR === 0 ? ' · <span class="an-pr">PR last session</span>' : ''}</div></div>
      <div class="lift-spark">${sparkline(l.trend, 'var(--move)')}</div>
      <div class="an-lift"><div class="amt">${fmt1(l.now)}${l.bw ? ' reps' : ' kg'}</div>${l.pct != null ? `<div class="an-delta ${l.pct >= 0 ? 'up' : 'down'}">${l.pct >= 0 ? '▲' : '▼'} ${Math.abs(l.pct).toFixed(1)}%</div>` : '<div class="an-delta">new</div>'}</div></div>`).join('')}</div>` : ''}
    ${notes(ins)}
  </section>`;
}

// Where the volume goes: a body map of this week, and six weeks of it as a heatmap.
function volumeCard(f) {
  const lvlOf = n => (n >= MEV ? (n <= MAV ? ['good', 'Optimal'] : n <= MRV ? ['ok', 'High'] : ['low', 'Over MRV']) : n >= MEV * 0.6 ? ['ok', 'Light'] : ['low', n ? 'Below MEV' : 'None']);
  const rows = f.perMuscle.map(x => ({ ...x, lvl: lvlOf(x.sets) }));
  const heat = n => (n ? `rgba(244,167,181,${clamp(0.18 + (n / MRV) * 0.72, 0.18, 0.95)})` : 'rgba(0,0,0,.035)');
  const weekCols = f.weeks.slice(-6);

  // The map reads each muscle against what that muscle needs, so a calf and a
  // quad are judged on their own terms: half-lit is the weekly minimum, full is
  // twice it.
  const fills = Object.fromEntries(Object.keys(REGIONS).map(r => [r, (f.regionWeek[r] ?? 0) / (REGION_MEV[r] * 2)]));
  const short = Object.keys(REGIONS).filter(r => (f.regionWeek[r] ?? 0) < REGION_MEV[r] * 0.6);
  const fed = Object.keys(REGIONS).length - short.length;
  const totalSets = sum(f.perMuscle.map(x => x.sets));

  const ins = [];
  const low = rows.filter(x => x.m !== 'core' && x.sets < MEV).sort((a, b) => a.sets - b.sets);
  if (low.length) ins.push(note('muscle', 'move', `<b>${low.slice(0, 2).map(x => x.name).join(' and ')}</b> ${low.length > 1 ? 'are' : 'is'} under the ${MEV}-set minimum this week. Adding ${MEV - low[0].sets} sets of ${low[0].name.toLowerCase()} is the cheapest growth on the board.`));
  const over = rows.filter(x => x.sets > MRV);
  if (over.length) ins.push(note('info', 'move', `${over.map(x => x.name).join(' and ')} ${over.length > 1 ? 'are' : 'is'} past ${MRV} sets. Beyond your recoverable volume the extra sets cost recovery without adding growth.`));
  const rare = rows.filter(x => x.m !== 'core' && x.avg4 >= 6 && x.freq < 1.5);
  if (rare.length) ins.push(note('calendar', 'sleep', `<b>${rare.map(x => x.name).join(' and ')}</b> ${rare.length > 1 ? 'get' : 'gets'} trained about once a week. Splitting the same sets over two sessions builds more, because the growth signal only lasts a couple of days.`));
  // A region nobody has touched in four weeks is worth naming even when its
  // group looks healthy — a whole back day can still miss the rear delts.
  const blind = Object.keys(REGIONS).filter(r => !(f.region4[r] > 0));
  if (blind.length) ins.push(note('target', 'school', `Nothing has worked your <b>${blind.map(r => REGIONS[r].name.toLowerCase()).join(', ')}</b> in four weeks. Grey on the map is a muscle with no claim on your week.`));
  const trend6 = rows.map(x => ({ x, d: mean(x.weekly.slice(-3)) - mean(x.weekly.slice(0, 3)) }));
  const falling = trend6.filter(t => t.d <= -3).sort((a, b) => a.d - b.d)[0];
  if (falling) ins.push(note('chart', 'move', `${falling.x.name} volume has drifted down by about ${Math.round(-falling.d)} sets a week over six weeks. Often unintentional — check it is what you meant.`));

  return `${section('Volume by muscle', 'hard sets · this week')}
  <section class="card glass">
    <div class="head"><div class="title">${tile('muscle', 'move')}Where the work landed</div><div class="sub-note">tap a muscle</div></div>
    ${bodyMap(fills, { label: 'Hard sets per muscle this week', tap: true, cls: 'bm-big' })}
    <div class="bm-scale"><span>untouched</span><i></i><span>well fed</span></div>
    <div class="stats an-stats3 an-gap">
      ${stat('Sets', `${fmt(totalSets)}`, 'this week')}
      ${stat('Fed', `${fed}`, `of ${Object.keys(REGIONS).length} muscles`)}
      ${stat('Short', `${short.length}`, 'under minimum')}
    </div>

    <div class="head an-gap"><div class="title">Six-week map</div><div class="sub-note">sets · darker is more</div></div>
    <div class="an-heat" style="--cols:${weekCols.length}">
      <div class="an-heat-row head"><span></span>${weekCols.map((w, i) => `<b>${i === weekCols.length - 1 ? 'Now' : `${+w.slice(8)}/${+w.slice(5, 7)}`}</b>`).join('')}<em>/wk</em></div>
      ${rows.map(x => `<div class="an-heat-row"><span>${x.name}</span>${x.weekly.map(n => `<i style="background:${heat(n)}">${n || ''}</i>`).join('')}<em>${x.freq ? `${fmt1(x.freq)}×` : '–'}</em></div>`).join('')}
    </div>
    <p class="note an-foot">The last column is how many days a week that muscle gets trained, averaged over four weeks — twice beats once for the same number of sets.</p>
    ${notes(ins)}
  </section>`;
}

// How hard the work is: rep ranges and load relative to your own best.
function intensityCard(f) {
  const total = sum(Object.values(f.reps));
  if (!total) return '';
  const repParts = [
    ['1–5 · strength', f.reps[1], 'var(--move)'],
    ['6–8 · heavy hypertrophy', f.reps[6], 'var(--school)'],
    ['9–12 · hypertrophy', f.reps[9], 'var(--diet)'],
    ['13+ · metabolic', f.reps[13], 'var(--work)'],
  ].filter(p => p[1]);
  const zoneParts = [
    ['Under 65%', f.zones.light, 'rgba(0,0,0,.12)'],
    ['65–80%', f.zones.moderate, 'var(--work)'],
    ['80–90%', f.zones.heavy, 'var(--school)'],
    ['Over 90%', f.zones.max, 'var(--move)'],
  ].filter(p => p[1]);
  const avgReps = sum([[1, 3], [6, 7], [9, 10.5], [13, 15]].map(([k, mid]) => f.reps[k] * mid)) / total;
  const heavyShare = f.loaded ? ((f.zones.heavy + f.zones.max) / f.loaded) * 100 : null;

  const ins = [];
  if (heavyShare != null) {
    ins.push(note('bolt', 'move', heavyShare < 10
      ? `Only <b>${Math.round(heavyShare)}%</b> of your sets are above 80% of your best. Most growth comes from 65–85%, but a few heavy sets each week keep the one-rep max honest.`
      : heavyShare > 45
        ? `<b>${Math.round(heavyShare)}%</b> of sets sit above 80%. Heavy work is fatiguing per set; dropping some to 70% buys volume for the same recovery.`
        : `<b>${Math.round(heavyShare)}%</b> of sets are above 80% of your best — a sensible mix of heavy and volume work.`));
  }
  if (f.reps[13] / total > 0.4) ins.push(note('info', 'school', `${Math.round((f.reps[13] / total) * 100)}% of sets run past 12 reps. They build, but take longer and hurt more; some of that is better spent at 6–10.`));
  if (f.reps[1] / total > 0.4) ins.push(note('info', 'school', `${Math.round((f.reps[1] / total) * 100)}% of sets are 5 reps or fewer. Great for strength, thin on volume — add back-off sets at 8–12 for size.`));

  const split = (parts, label) => `<div class="hv-split" role="img" aria-label="${label}">${parts.map(p => `<i style="flex:${p[1]};background:${p[2]}"></i>`).join('')}</div>
    <div class="hv-legend">${parts.map(p => `<span><i class="dot" style="background:${p[2]}"></i>${p[0]} <b>${Math.round((p[1] / sum(parts.map(x => x[1]))) * 100)}%</b></span>`).join('')}</div>`;

  return `${section('Intensity', 'last 28 days')}
  <section class="card glass">
    <div class="label-sm">Rep ranges · ${plural(total, 'set')}</div>
    ${split(repParts, 'Share of sets by rep range')}
    <div class="label-sm an-gap">Load against your best · ${plural(f.loaded, 'weighted set')}</div>
    ${f.loaded ? split(zoneParts, 'Share of sets by percentage of estimated one-rep max') : '<p class="note">Bodyweight-only sets carry no load to measure.</p>'}
    <div class="stats an-stats3 an-gap">
      ${stat('Avg reps', fmt1(avgReps), 'per set')}
      ${stat('Heavy sets', heavyShare != null ? `${Math.round(heavyShare)}%` : '–', 'over 80%')}
      ${stat('Sets / week', fmt1(total / 4))}
    </div>
    ${notes(ins)}
  </section>`;
}

// Balance: push against pull, quads against hinge, and the lift ratios underneath.
function balanceCard(f) {
  const p = f.pat;
  const pairs = [
    { l: 'Push', r: 'Pull', a: p.push, b: p.pull, ideal: 1, span: 0.25, why: 'Pulling at least as much as you press keeps shoulders healthy and posture upright.' },
    { l: 'Quads', r: 'Hinge', a: p.quad, b: p.hinge, ideal: 1.2, span: 0.4, why: 'Hamstrings and glutes are the usual blind spot; they want close to the work the quads get.' },
    { l: 'Upper', r: 'Lower', a: p.push + p.pull, b: p.quad + p.hinge + p.calf, ideal: 1.4, span: 0.5, why: 'Legs take the longest to build and are the easiest to quietly skip.' },
    { l: 'Vertical', r: 'Horizontal', a: f.vert.vertical, b: f.vert.horizontal, ideal: 0.6, span: 0.3, why: 'Pressing and pulling in both planes develops the whole shoulder girdle.' },
  ].filter(x => x.a + x.b >= 4);
  if (!pairs.length) return '';

  const bar = x => {
    const tot = x.a + x.b || 1;
    const share = (x.a / tot) * 100;
    const ratio = x.b ? x.a / x.b : null;
    const off = ratio == null ? null : Math.abs(ratio - x.ideal) > x.span;
    const idealShare = (x.ideal / (x.ideal + 1)) * 100;
    return `<div class="an-pair${off ? ' off' : ''}">
      <div class="an-pair-h"><span>${x.l} <b>${x.a}</b></span><span class="r"><b>${x.b}</b> ${x.r}</span></div>
      <div class="an-pair-bar"><i class="a" style="width:${share}%"></i><i class="ideal" style="left:${idealShare}%"></i></div>
      <div class="an-pair-f">${ratio != null ? `${fmt1(ratio)} : 1` : `${x.a} : 0`} <span>· balanced near ${fmt1(x.ideal)} : 1</span></div>
    </div>`;
  };

  const ins = [];
  // A side with nothing at all is the loudest finding there is, and no ratio describes it.
  pairs.filter(x => !x.b || !x.a).forEach(x => {
    const [miss, has] = x.b ? [x.l, x.r] : [x.r, x.l];
    ins.push(note('muscle', 'move', `No <b>${miss.toLowerCase()}</b> work at all in four weeks against ${plural(Math.max(x.a, x.b), 'set')} of ${has.toLowerCase()}. ${x.why}`));
  });
  pairs.filter(x => x.a && x.b && Math.abs(x.a / x.b - x.ideal) > x.span).forEach(x => {
    const r = x.a / x.b;
    ins.push(note('muscle', 'move', `<b>${r > x.ideal ? x.l : x.r}</b> work outweighs ${r > x.ideal ? x.r.toLowerCase() : x.l.toLowerCase()} at ${fmt1(Math.max(r, 1 / r))} : 1 over four weeks. ${x.why}`));
  });
  // Strength ratios need two rated lifts and say something volume cannot.
  const by = id => f.lifts.find(l => l.exId === id);
  RATIOS.forEach(rt => {
    const a = by(rt.a), b = by(rt.b);
    if (!a || !b) return;
    const v = a.peak / b.peak;
    if (Math.abs(v - rt.ideal) <= rt.span) return;
    ins.push(note('scale', 'school', `<b>${rt.label}</b> is ${fmt1(v)} : 1 against about ${rt.ideal} : 1 for a balanced lifter — your ${v < rt.ideal ? rt.low : rt.high}.`));
  });
  if (!ins.length) ins.push(note('star', 'diet', 'Push and pull, upper and lower all sit inside the usual balanced ranges over the last four weeks.'));

  return `${section('Programme balance', 'sets · last 28 days')}
  <section class="card glass">
    ${pairs.map(bar).join('')}
    ${notes(ins)}
  </section>`;
}

// Consistency and what a session actually looks like.
function consistencyCard(f) {
  const bars = f.weekStats;
  const maxN = Math.max(f.r?.perWeek ?? 0, ...bars.map(x => x.n), 1);
  const ins = [];
  if (f.adherence != null) ins.push(note('calendar', 'sleep', `You hit ${f.r.perWeek} sessions in <b>${f.hitWeeks} of the last 4 weeks</b> — ${f.adherence}% of what the routine asks. Consistency over months beats any single session.`));
  if (f.gap >= 4) ins.push(note('clock', 'move', `Last session was ${plural(f.gap, 'day')} ago. Most muscles lose the growth signal after about 72 hours.`));
  if (f.density) ins.push(note('bolt', 'school', `You move about <b>${fmt(f.density)} kg a minute</b> in the gym, ${fmtMins(f.avgLen)} a session. Shorter, denser sessions are usually better tolerated than long ones.`));
  if (f.streak >= 3) ins.push(note('flame', 'move', `<b>${plural(f.streak, 'week')} in a row</b> with at least one session.`));

  return `${section('Consistency', 'last 12 weeks')}
  <section class="card glass">
    <div class="an-wbars" role="img" aria-label="Sessions per week over 12 weeks">${bars.map((x, i) => `<div class="an-wbar${i === bars.length - 1 ? ' cur' : ''}">
      <i style="height:${(x.n / maxN) * 100}%"></i><span>${i % 3 === 0 || i === bars.length - 1 ? shortDate(x.w) : ''}</span></div>`).join('')}</div>
    <div class="stats an-stats4 an-gap">
      ${stat('Adherence', f.adherence != null ? `${f.adherence}%` : '–', '4 weeks')}
      ${stat('Session', f.avgLen != null ? fmtMins(f.avgLen) : '–', 'average')}
      ${stat('Density', f.density ? `${fmt(f.density)}` : '–', 'kg / min')}
      ${stat('PRs', `${f.prs30}`, '30 days')}
    </div>
    ${notes(ins)}
  </section>`;
}

export function gymAnalytics() {
  const all = workouts();
  if (!all.length) return '';
  const f = gymFacts();
  const st = status(f);
  return `${heroCard(f, st)}
  ${standardsCard(f)}
  ${overloadCard(f)}
  ${volumeCard(f)}
  ${intensityCard(f)}
  ${balanceCard(f)}
  ${consistencyCard(f)}`;
}
