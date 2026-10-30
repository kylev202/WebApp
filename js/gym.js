// v2 Gym: routines, live workout logging, progressive overload, PRs, rest timer, plates.
import { state, addEntry, putEntry, removeEntry, setKV } from './store.js';
import { esc, dayKey, addDays, weekStart, shortDate, dayLabel, fmt, fmt1, fmtDuration, num, uid, plural, clamp } from './util.js';
import { icon, tile } from './icons.js';
import { screens, sheets, actions, forms, previews, afterRender, ui, go, render, openSheet, closeSheet, refreshSheet, toast, haptic, confetti, unlockAudio, chime, closeBtn, header } from './core.js';
import { lineChart, sparkline } from './charts.js';
import { of, byId, habits, habitDone } from './data.js';
import { EXERCISES, MUSCLES, REGIONS, TEMPLATES, REP_PRESETS, PLATES, PLATE_COLORS, exRegions } from './gym-data.js';
import { bodyMap, bodyPair, addRegions, toFills } from './body.js';
import { exShot, muscleShot, hasHalf } from './closeup.js';

// ---------- data ----------
export const allExercises = () => [...EXERCISES, ...(state.kv.customExercises ?? [])];
export const exById = id => allExercises().find(e => e.id === id) ?? { id, name: id, muscle: 'core', equip: '', inc: 2.5 };
export const routine = () => state.kv.routine ?? null;
export const workouts = () => of('workout').sort((a, b) => b.start - a.start);
export const active = () => state.kv.activeWorkout ?? null;
const gymSettings = () => ({ rest: 120, ...state.kv.gymSettings });
const DEFAULT_PLAN = { sets: 3, repMin: 8, repMax: 12 };
// Rest for one exercise: its own override, else the routine-wide setting.
const restOf = x => Number(x?.rest) || gymSettings().rest;

// Hard sets landing on each muscle region. A set counts fully towards the muscles
// doing the job and half towards the ones helping, so a bench press is not counted
// as a triceps session.
export function regionLoad(items) {
  const out = {};
  items.forEach(({ exId, sets }) => addRegions(out, exById(exId), Number(sets) || 0));
  return out;
}
export const dayLoad = d => regionLoad((d?.exercises ?? []).map(x => ({ exId: x.exId, sets: x.sets })));
export const workoutLoad = w => regionLoad((w?.exercises ?? []).map(x => ({ exId: x.exId, sets: x.sets.length })));
const topLoad = c => Math.max(1, ...Object.values(c));
// Consecutive exercises sharing a superset tag are run back to back.
function groupSets(list) {
  const out = [];
  list.forEach((x, i) => {
    const last = out.at(-1);
    if (x.sg && last?.sg === x.sg) last.items.push({ x, i });
    else out.push({ sg: x.sg ?? null, items: [{ x, i }] });
  });
  return out;
}

// Epley estimated one-rep max; bodyweight moves without added weight score by reps.
export const e1rm = (kg, reps) => (kg > 0 ? (reps <= 1 ? kg : kg * (1 + reps / 30)) : reps);
const setScore = s => e1rm(Number(s.kg) || 0, Number(s.reps) || 0);

export function history(exId) {
  return workouts()
    .map(w => ({ w, ex: w.exercises.find(x => x.exId === exId) }))
    .filter(x => x.ex?.sets.length)
    .map(({ w, ex }) => ({ id: w.id, date: w.date, start: w.start, sets: ex.sets, best: Math.max(...ex.sets.map(setScore)) }));
}

// Previous bests before a workout: estimated 1RM and heaviest weight.
function bestBefore(exId, beforeTs) {
  const past = history(exId).filter(h => h.start < beforeTs);
  if (!past.length) return null;
  return { score: Math.max(...past.map(h => h.best)), kg: Math.max(...past.flatMap(h => h.sets.map(s => Number(s.kg) || 0))) };
}
// A PR is a higher estimated 1RM or a heavier weight than ever before.
const isPR = (set, best) => best != null && (setScore(set) > best.score + 1e-9 || (Number(set.kg) || 0) > best.kg + 1e-9);

export function nextDay() {
  const r = routine();
  if (!r?.days.length) return null;
  const last = workouts().find(w => r.days.some(d => d.id === w.dayId));
  if (!last) return r.days[0];
  const i = r.days.findIndex(d => d.id === last.dayId);
  return r.days[(i + 1) % r.days.length];
}

// Double progression: add reps inside the range; once every set hits the top, add weight.
export function suggestion(exId, plan = DEFAULT_PLAN) {
  const ex = exById(exId);
  const last = history(exId)[0];
  const n = plan.sets;
  if (!last) {
    return { kg: ex.bw ? 0 : null, reps: Array(n).fill(plan.repMin), text: ex.bw ? `Aim for ${plan.repMin}–${plan.repMax} reps` : `Pick a weight you can lift ${plan.repMin}–${plan.repMax} times`, prev: [] };
  }
  const top = Math.max(...last.sets.map(s => Number(s.kg) || 0));
  const working = last.sets.filter(s => (Number(s.kg) || 0) === top);
  const prev = last.sets.map(s => `${fmt1(Number(s.kg) || 0)}×${s.reps}`);
  if (working.length >= n && working.every(s => s.reps >= plan.repMax) && ex.inc > 0) {
    const kg = top + ex.inc;
    return { kg, reps: Array(n).fill(plan.repMin), text: `Hit ${plan.repMax} reps on every set. Go up to ${fmt1(kg)} kg`, prev, up: true };
  }
  const reps = Array.from({ length: n }, (_, i) => Math.min(plan.repMax, (working[i]?.reps ?? plan.repMin) + 1));
  return { kg: top, reps, text: `Same weight, beat last time by a rep`, prev };
}

// ---------- active workout ----------
let saveTimer;
function saveActive(aw, now = false) {
  state.kv.activeWorkout = aw;
  clearTimeout(saveTimer);
  if (now) return setKV('activeWorkout', aw);
  saveTimer = setTimeout(() => setKV('activeWorkout', aw), 400);
}

function workoutExercise(exId, plan = DEFAULT_PLAN) {
  const s = suggestion(exId, plan);
  return {
    exId, plan, hint: s.text, up: !!s.up, prev: s.prev,
    rest: plan.rest ?? null, note: plan.note ?? '', sg: plan.sg ?? null,
    sets: s.reps.map(r => ({ kg: '', reps: '', pk: s.kg ?? '', pr: r, done: false })),
  };
}

export async function startWorkout(dayId) {
  if (active()) { go('workout'); return; }
  const day = routine()?.days.find(d => d.id === dayId);
  const aw = {
    id: uid(), name: day?.name ?? 'Workout', dayId: day?.id ?? null, start: Date.now(), restEnd: null, restTotal: 0,
    exercises: (day?.exercises ?? []).map(x => workoutExercise(x.exId, x)),
  };
  await saveActive(aw, true);
  unlockAudio();
  haptic();
  go('workout');
}

// In a superset, the next move of the group still has a set waiting, so you walk
// straight over to it instead of sitting down.
function partnerWaiting(aw, i) {
  const x = aw.exercises[i];
  if (!x?.sg) return false;
  return aw.exercises.some((y, j) => j !== i && y.sg === x.sg && y.sets.some(s => !s.done));
}

const setValue = (s, f) => (s[f] === '' || s[f] == null ? s[f === 'kg' ? 'pk' : 'pr'] : s[f]);

async function finishWorkout() {
  const aw = active();
  const exercises = aw.exercises
    .map(x => ({ exId: x.exId, sets: x.sets.filter(s => s.done).map(s => ({ kg: num(setValue(s, 'kg')), reps: num(setValue(s, 'reps')) })) }))
    .filter(x => x.sets.length);
  if (!exercises.length) {
    if (!confirm('No sets are ticked. Discard this workout?')) return;
    await discardWorkout();
    return;
  }
  const entry = await recordWorkout({ name: aw.name, dayId: aw.dayId, start: aw.start, end: Date.now(), exercises });
  const prs = entry.prs;
  await setKV('activeWorkout', null);
  haptic();
  go('health');
  ui.tab.health = 'gym';
  setTimeout(() => { openSheet('wkDetail', { id: entry.id, done: '1' }); if (prs.length) confetti(); }, 350);
}

// Save a finished workout: PRs, volume, and tick the Gym habit. Used by the live logger and the AI.
export async function recordWorkout({ name, dayId = null, start, end, exercises }) {
  const prs = exercises.filter(x => {
    const best = bestBefore(x.exId, start);
    return x.sets.some(set => isPR(set, best));
  }).map(x => x.exId);
  const volume = exercises.reduce((t, x) => t + x.sets.reduce((s, y) => s + y.kg * y.reps, 0), 0);
  const entry = await addEntry('workout', { name, dayId, start, end, exercises, prs, volume }, dayKey(new Date(start)));
  const habit = habits().find(h => h.id === 'gym') && !habitDone('gym', entry.date) ? await addEntry('habit', { habitId: 'gym' }, entry.date) : null;
  entry.habitEntryId = habit?.id ?? null;
  return entry;
}

// Match a spoken/typed exercise name to the library ("db bench", "rdl", "lat pull down").
const ALIASES = { ohp: 'ohp', 'military press': 'ohp', 'shoulder press': 'db_shoulder', rdl: 'rdl', 'romanian deadlift': 'rdl', pulldown: 'lat_pulldown', 'lat pull down': 'lat_pulldown', 'pull ups': 'pullup', 'chin ups': 'chinup', 'skull crushers': 'skull', 'tricep pushdown': 'pushdown', 'triceps pushdown': 'pushdown', squats: 'squat', 'db bench': 'db_bench', 'db row': 'db_row', 'incline db': 'incline_db', 'db curl': 'db_curl', 'leg extensions': 'leg_ext', 'leg curls': 'leg_curl', 'calf raises': 'calf_raise', 'lateral raises': 'lateral_raise', 'laterals': 'lateral_raise', 'hammer curls': 'hammer', flyes: 'cable_fly', flys: 'cable_fly' };
export function exByName(name) {
  const n = String(name).toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
  if (ALIASES[n]) return exById(ALIASES[n]);
  const list = allExercises();
  return list.find(e => e.name.toLowerCase() === n)
    ?? list.find(e => e.name.toLowerCase().replace(/s$/, '') === n.replace(/s$/, ''))
    ?? list.find(e => n.includes(e.name.toLowerCase()) || e.name.toLowerCase().includes(n))
    ?? null;
}
export async function addCustomExercise(name, muscle = 'core') {
  const ex = { id: `c_${uid().slice(0, 8)}`, name: String(name).trim().replace(/^./, c => c.toUpperCase()), muscle: MUSCLES[muscle] ? muscle : 'core', equip: 'Custom', inc: 2.5 };
  await setKV('customExercises', [...(state.kv.customExercises ?? []), ex]);
  return ex;
}

async function discardWorkout() {
  await setKV('activeWorkout', null);
  go('health');
}

// Rest timer + elapsed clock tick while a workout is open.
let ticker;
function tick() {
  const aw = active();
  if (!aw) { clearInterval(ticker); ticker = null; return; }
  const el = document.getElementById('wk-elapsed');
  if (el) el.textContent = fmtDuration(Date.now() - aw.start);
  const bar = document.getElementById('rest-bar');
  if (aw.restEnd) {
    const left = aw.restEnd - Date.now();
    if (left <= 0) {
      aw.restEnd = null;
      saveActive(aw);
      chime();
      haptic();
      toast('Rest over. Next set', { icon: 'timer' });
      if (ui.route === 'workout') render();
      return;
    }
    if (bar) {
      bar.querySelector('#rest-left').textContent = fmtDuration(left);
      bar.style.setProperty('--p', `${(left / (aw.restTotal || 1)) * 100}%`);
    }
  }
}
afterRender.push(() => {
  if (active() && !ticker) ticker = setInterval(tick, 500);
  tick();
});

// ---------- screens ----------
function setRow(x, xi, s, si) {
  const ex = exById(x.exId);
  return `<div class="set-row ${s.done ? 'done' : ''}">
    <span class="n">${si + 1}</span>
    <span class="prev">${esc(x.prev[si] ?? '–')}</span>
    <input class="set-in" data-ex="${xi}" data-set="${si}" data-f="kg" inputmode="decimal" value="${esc(s.kg)}" placeholder="${esc(s.pk)}" aria-label="${ex.bw ? 'Added kg' : 'kg'}">
    <input class="set-in" data-ex="${xi}" data-set="${si}" data-f="reps" inputmode="numeric" value="${esc(s.reps)}" placeholder="${esc(s.pr)}" aria-label="Reps">
    <button class="set-check" data-act="setDone" data-ex="${xi}" data-set="${si}" aria-label="Done">${icon('check')}</button>
  </div>`;
}

function renderWorkout() {
  const aw = active();
  if (!aw) return `${header('Workout', 'Nothing in progress')}<section class="card glass soon">${tile('dumbbell', 'move', 'xl')}<p>Start a workout from the Gym tab.</p><button class="btn" data-act="nav" data-to="health">Go to Gym</button></section>`;
  const doneSets = aw.exercises.reduce((t, x) => t + x.sets.filter(s => s.done).length, 0);
  const totalSets = aw.exercises.reduce((t, x) => t + x.sets.length, 0);
  const groups = groupSets(aw.exercises);
  return `
  <header class="wk-head"><div class="grow"><div class="date"><span id="wk-elapsed">${fmtDuration(Date.now() - aw.start)}</span> · ${doneSets}/${totalSets} sets</div><h1>${esc(aw.name)}</h1></div>
    <button class="icon-btn glass" data-act="wkMenu" aria-label="Workout options">${icon('more')}</button></header>
  ${groups.map(g => {
    const cards = g.items.map(({ x, i }) => exCard(x, i)).join('');
    return g.items.length > 1 ? `<div class="ss-group"><div class="ss-tag">${icon('repeat')} Superset · ${plural(g.items.length, 'move')}</div>${cards}</div>` : cards;
  }).join('')}
  <button class="btn soft" data-act="sheet" data-sheet="exPicker" data-mode="workout">${icon('plus')} Add exercise</button>
  <div class="wk-bar">
    ${aw.restEnd ? `<div class="rest glass" id="rest-bar" style="--p:100%"><span class="rest-fill"></span>${icon('timer')}<b id="rest-left">${fmtDuration(aw.restEnd - Date.now())}</b>
      <button class="mini-pill" data-act="rest" data-d="-15">−15</button><button class="mini-pill" data-act="rest" data-d="15">+15</button><button class="mini-pill" data-act="rest" data-d="0">Skip</button></div>` : ''}
    <button class="btn finish" data-act="finishWorkout">${icon('check')} Finish workout</button>
  </div>`;
}

function exCard(x, xi) {
  const ex = exById(x.exId);
  return `<section class="card glass ex-card">
    <div class="ex-head">${exShot(ex)}<div class="grow tap" data-act="sheet" data-sheet="exDetail" data-id="${x.exId}"><div class="t">${esc(ex.name)}</div><div class="d">${esc(ex.equip)} · ${x.plan.sets} × ${x.plan.repMin}–${x.plan.repMax}${x.rest ? ` · ${fmtRest(x.rest)} rest` : ''}</div></div>
      <button class="x-btn" data-act="sheet" data-sheet="exMenu" data-i="${xi}" aria-label="Exercise options">${icon('more')}</button></div>
    ${x.note ? `<div class="ex-note">${icon('pen')}${esc(x.note)}</div>` : ''}
    <div class="hint ${x.up ? 'up' : ''}">${icon(x.up ? 'chart' : 'target')}${esc(x.hint)}</div>
    <div class="sets"><div class="set-row head"><span>Set</span><span>Last</span><span>${ex.bw ? '+kg' : 'kg'}</span><span>Reps</span><span></span></div>
      ${x.sets.map((s, si) => setRow(x, xi, s, si)).join('')}</div>
    <div class="ex-actions"><button class="chip-btn soft" data-act="addSet" data-ex="${xi}">${icon('plus')} Set</button>${x.sets.length > 1 ? `<button class="chip-btn soft" data-act="removeSet" data-ex="${xi}">Remove set</button>` : ''}</div>
  </section>`;
}

export const fmtRest = s => (s % 60 === 0 && s >= 120 ? `${s / 60} min` : `${s}s`);


export function gymTab(insights = '') {
  const r = routine();
  const aw = active();
  const chooser = `<section class="card glass"><div class="head"><div class="title">${tile('dumbbell', 'move')}Choose a routine</div></div>
      <p class="note">Pick a starting split. You can change every exercise, set and rep range later.</p>
      <div class="tpl-list">${Object.entries(TEMPLATES).map(([k, t]) => `<button class="tpl tap" data-act="useTemplate" data-t="${k}"><div class="t">${t.name}</div><div class="d">${t.blurb}</div><div class="tpl-days">${t.days.map(d => `<span>${esc(d.name)}</span>`).join('')}</div></button>`).join('')}</div>
      <button class="btn ghost" data-act="startEmpty">Or start an empty workout</button></section>`;
  if (!r && !workouts().length && !aw) return chooser;
  const next = nextDay();
  const ws = workouts();
  const thisWeek = ws.filter(w => w.date >= weekStart()).length;
  const weeks = Array.from({ length: 8 }, (_, i) => addDays(weekStart(), (i - 7) * 7));
  const setsPerWeek = weeks.map(w0 => ws.filter(w => w.date >= w0 && w.date <= addDays(w0, 6)).reduce((t, w) => t + w.exercises.reduce((s, x) => s + x.sets.length, 0), 0));
  const lifts = keyLifts();
  return `
  ${aw ? `<section class="card glass live-card tap" data-act="nav" data-to="workout"><div class="head"><div class="title">${tile('play', 'move')}${esc(aw.name)} in progress</div><div class="chev">${icon('chevron')}</div></div><p class="note" style="margin:0">Started ${fmtDuration(Date.now() - aw.start)} ago. Tap to resume.</p></section>` : `
  ${!r || !next ? chooser : `<section class="card glass">
    <div class="head"><div class="title">${tile('dumbbell', 'move')}Next up</div><span class="sub-note">${esc(r.name)}</span></div>
    <div class="next-up"><div class="grow"><div class="big-md">${esc(next.name)}</div>
      <div class="sub-note">${plural(next.exercises.length, 'exercise')} · ${plural(next.exercises.reduce((t, x) => t + x.sets, 0), 'set')}</div></div>
      ${bodyPair(dayLoad(next), topLoad(dayLoad(next)), { cls: 'bm-next' })}</div>
    <div class="ex-chips">${next.exercises.map(x => `<span>${esc(exById(x.exId).name)} <b>${x.sets}×${x.repMin}–${x.repMax}</b></span>`).join('')}</div>
    <button class="btn" data-act="startWorkout" data-day="${next.id}">${icon('play')} Start ${esc(next.name)}</button>
    <div class="day-pick">${r.days.filter(d => d.id !== next.id).map(d => `<button class="chip-btn soft" data-act="startWorkout" data-day="${d.id}">${esc(d.name)}</button>`).join('')}<button class="chip-btn soft" data-act="startEmpty">Empty</button></div>
  </section>`}`}

  ${insights || `  <section class="card glass">
    <div class="head"><div class="title">This week</div><span class="sub-note">sets per week</span></div>
    <div class="stats two"><div class="stat"><div class="l">Workouts</div><div class="v">${thisWeek}<span>${r ? ` / ${r.perWeek}` : ''}</span></div></div>
      <div class="stat"><div class="l">Sets</div><div class="v">${setsPerWeek.at(-1)}<span> this week</span></div></div></div>
    ${lineChart({ series: [{ values: setsPerWeek.map(v => v || null), color: 'var(--move)' }], labels: weeks.map((w, i) => (i === 7 ? 'Now' : i % 2 === 1 ? shortDate(w) : '')), live: true, empty: 'Your weekly sets line appears after your first workout.' })}
  </section>

  ${lifts.length ? `<div class="section-label">Strength <span>estimated 1-rep max</span></div>
  <section class="card glass"><div class="list">${lifts.map(l => `<div class="row tap" data-act="sheet" data-sheet="exDetail" data-id="${l.exId}" role="button">
    <div class="grow"><div class="t">${esc(l.name)}</div><div class="d">Best ${l.bestText}</div></div>
    <div class="lift-spark">${sparkline(l.trend, 'var(--move)')}</div><div class="amt">${fmt1(l.now)}${l.bw ? ' reps' : ' kg'}</div></div>`).join('')}</div></section>` : ''}`}

  ${ws.length ? `<div class="section-label">Recent workouts</div>
  <section class="card glass"><div class="list">${ws.slice(0, 8).map(w => `<div class="row tap" data-act="sheet" data-sheet="wkDetail" data-id="${w.id}" role="button">
    ${bodyPair(workoutLoad(w), topLoad(workoutLoad(w)), { cls: 'bm-row' })}<div class="grow"><div class="t">${esc(w.name)}${w.prs?.length ? ` <span class="pr-badge">${icon('trophy')}${w.prs.length} PR</span>` : ''}</div>
    <div class="d">${dayLabel(w.date)} · ${fmtDuration(w.end - w.start)} · ${plural(w.exercises.reduce((t, x) => t + x.sets.length, 0), 'set')}</div></div><div class="chev">${icon('chevron')}</div></div>`).join('')}</div></section>` : ''}

  <div class="section-label">Tools</div>
  <div class="tools">
    <button class="tool glass tap" data-act="nav" data-to="routine">${tile('list', 'move')}<span>Routine</span></button>
    <button class="tool glass tap" data-act="sheet" data-sheet="plates">${tile('plate', 'work')}<span>Plates</span></button>
    <button class="tool glass tap" data-act="sheet" data-sheet="restSettings">${tile('timer', 'sleep')}<span>Rest ${gymSettings().rest}s</span></button>
  </div>`;
}

function keyLifts() {
  const count = {};
  workouts().forEach(w => w.exercises.forEach(x => { count[x.exId] = (count[x.exId] ?? 0) + 1; }));
  return Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([exId]) => {
    const h = history(exId);
    const ex = exById(exId);
    const bestSet = h.flatMap(x => x.sets).reduce((b, s) => (setScore(s) > setScore(b) ? s : b));
    return { exId, name: ex.name, bw: ex.bw && !(bestSet.kg > 0), now: h[0].best, trend: h.slice(0, 12).reverse().map(x => x.best), bestText: `${fmt1(bestSet.kg)} kg × ${bestSet.reps}` };
  });
}

// Today screen card.
export function workoutCard() {
  const aw = active();
  const r = routine();
  const todays = workouts().find(w => w.date === dayKey());
  if (aw) {
    return `<section class="card glass wk-card tap" data-act="nav" data-to="workout">${tile('play', 'move', 'lg')}
      <div class="grow"><div class="label-sm">In progress</div><div class="t">${esc(aw.name)}</div><div class="d">${fmtDuration(Date.now() - aw.start)} · tap to resume</div></div><div class="chev">${icon('chevron')}</div></section>`;
  }
  if (todays) {
    return `<section class="card glass wk-card tap" data-act="sheet" data-sheet="wkDetail" data-id="${todays.id}">${tile('check', 'diet', 'lg')}
      <div class="grow"><div class="label-sm">Workout done</div><div class="t">${esc(todays.name)}</div><div class="d">${fmtDuration(todays.end - todays.start)} · ${plural(todays.exercises.reduce((t, x) => t + x.sets.length, 0), 'set')}${todays.prs?.length ? ` · ${todays.prs.length} PR` : ''}</div></div>${todays.prs?.length ? `<span class="pr-badge big">${icon('trophy')}</span>` : ''}</section>`;
  }
  const next = nextDay(); // null when the routine has no days left
  if (!r || !next) {
    return `<section class="card glass wk-card tap" data-act="nav" data-to="health">${tile('dumbbell', 'move', 'lg')}
      <div class="grow"><div class="label-sm">Gym</div><div class="t">${r ? 'Add a day to your routine' : 'Set up your routine'}</div><div class="d">Push/Pull/Legs, Upper/Lower or Full body</div></div><div class="chev">${icon('chevron')}</div></section>`;
  }
  return `<section class="card glass wk-card">${bodyPair(dayLoad(next), topLoad(dayLoad(next)), { cls: 'bm-row' })}
    <div class="grow tap" data-act="nav" data-to="health"><div class="label-sm">Next workout</div><div class="t">${esc(next.name)}</div><div class="d">${plural(next.exercises.length, 'exercise')} · ${plural(next.exercises.reduce((t, x) => t + x.sets, 0), 'set')}</div></div>
    <button class="pill-btn strong" data-act="startWorkout" data-day="${next.id}">${icon('play')} Start</button></section>`;
}

// ---------- routine editor ----------
const LIM = { sets: [1, 12], repMin: [1, 60], repMax: [1, 60] };
const REST_OPTS = [45, 60, 90, 120, 150, 180, 240];

const stepper = (di, xi, f, v, label) => `<div class="step" role="group" aria-label="${label}">
  <button class="step-b" data-act="stepNum" data-day="${di}" data-ex="${xi}" data-f="${f}" data-d="-1" aria-label="Fewer ${label}">−</button>
  <b>${v}</b>
  <button class="step-b" data-act="stepNum" data-day="${di}" data-ex="${xi}" data-f="${f}" data-d="1" aria-label="More ${label}">+</button></div>`;

function rtRow(x, di, xi) {
  const ex = exById(x.exId);
  return `<div class="rt-ex">
    <div class="rt-ex-h">${exShot(ex)}
      <div class="grow tap" role="button" tabindex="0" data-act="sheet" data-sheet="exDetail" data-id="${x.exId}"><div class="t">${esc(ex.name)}</div>
        <div class="d">${esc(ex.equip)}${x.rest ? ` · ${fmtRest(x.rest)} rest` : ''}</div></div>
      <button class="x-btn" data-act="sheet" data-sheet="exOpts" data-day="${di}" data-ex="${xi}" aria-label="Options for ${esc(ex.name)}">${icon('more')}</button></div>
    <div class="rt-nums">${stepper(di, xi, 'sets', x.sets, 'sets')}<span class="rt-unit">sets ×</span>
      ${stepper(di, xi, 'repMin', x.repMin, 'minimum reps')}<span class="rt-dash">–</span>${stepper(di, xi, 'repMax', x.repMax, 'maximum reps')}<span class="rt-unit">reps</span></div>
    ${x.note ? `<div class="ex-note">${icon('pen')}${esc(x.note)}</div>` : ''}
  </div>`;
}

function dayCard(d, di) {
  const load = dayLoad(d);
  const sets = d.exercises.reduce((t, x) => t + x.sets, 0);
  return `<section class="card glass rt-day" data-day="${di}">
    <div class="day-head"><input class="input-x r-in day-name" data-day="${di}" data-f="dayName" value="${esc(d.name)}" aria-label="Day name">
      <button class="x-btn" data-act="sheet" data-sheet="dayMenu" data-day="${di}" aria-label="Day options">${icon('more')}</button></div>
    <div class="rt-sum">${bodyPair(load, topLoad(load), { cls: 'bm-day' })}
      <div class="grow"><div class="rt-sum-n">${plural(d.exercises.length, 'exercise')}</div>
        <div class="sub-note">${plural(sets, 'hard set')}${sets ? ` · about ${Math.round(sets * 2.6 + d.exercises.length * 1.5)} min` : ''}</div>
        ${d.exercises.length ? `<div class="rt-presets">${REP_PRESETS.map(pz => `<button class="mini-pill" data-act="dayPreset" data-day="${di}" data-p="${pz.id}">${pz.name}</button>`).join('')}</div>` : ''}</div></div>
    ${d.exercises.length ? `<div class="rt-list">${groupSets(d.exercises).map(g => {
      const rows = g.items.map(({ x, i }) => rtRow(x, di, i)).join('');
      return g.items.length > 1 ? `<div class="ss-group tight"><div class="ss-tag">${icon('repeat')} Superset</div>${rows}</div>` : rows;
    }).join('')}</div>` : '<p class="note" style="margin:4px 0 10px">No exercises yet. Add the first one below.</p>'}
    <button class="chip-btn soft add-ex" data-act="sheet" data-sheet="exPicker" data-mode="routine" data-day="${di}">${icon('plus')} Add exercise</button>
  </section>`;
}

function renderRoutine() {
  const r = routine();
  if (!r) return `${header('Routine', 'Gym')}${gymTab()}`;
  const weekly = regionLoad(r.days.flatMap(d => d.exercises.map(x => ({ exId: x.exId, sets: x.sets }))));
  const sets = r.days.reduce((t, d) => t + d.exercises.reduce((n, x) => n + x.sets, 0), 0);
  return `${header('Routine', esc(r.name), '<button class="pill-btn" data-act="nav" data-to="health">Done</button>')}
  <section class="card glass">
    <div class="rt-week">${bodyMap(toFills(weekly, topLoad(weekly)), { label: 'Muscles this routine works', tap: true, cls: 'bm-week' })}
      <div class="grow"><div class="label-sm">One round of this routine</div>
        <div class="big-md">${plural(sets, 'set')}</div>
        <div class="sub-note">across ${plural(r.days.length, 'day')}. Tap a muscle to see what feeds it.</div></div></div>
    <div class="row2">
      <div class="field"><label>Routine name</label><input class="input-x r-in" data-f="name" value="${esc(r.name)}"></div>
      <div class="field"><label>Workouts per week</label><input class="input-x r-in" data-f="perWeek" inputmode="numeric" value="${r.perWeek}"></div>
    </div>
    <div class="label-sm">Start again from a template</div>
    <div class="day-pick">${Object.entries(TEMPLATES).map(([k, t]) => `<button class="chip-btn soft" data-act="useTemplate" data-t="${k}" data-confirm="1">${t.name}</button>`).join('')}</div>
  </section>
  ${r.days.map(dayCard).join('')}
  <button class="btn soft" data-act="addDay">${icon('plus')} Add a day</button>`;
}

screens.workout = renderWorkout;
screens.routine = renderRoutine;

// ---------- sheets ----------
// How often you have used each exercise, newest sessions first — drives "Recent".
function recentExIds() {
  const seen = new Map();
  workouts().forEach(w => w.exercises.forEach(x => seen.set(x.exId, (seen.get(x.exId) ?? 0) + 1)));
  return [...seen.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
}
// What a search matches on: the name, the gear and the muscles it works, so
// "lats" finds pulldowns and "machine" finds the machines.
const searchKey = e => [e.name, e.equip, ...exRegions(e).pri.map(r => REGIONS[r]?.name ?? ''), MUSCLES[e.muscle] ?? ''].join(' ').toLowerCase();
const EQUIPS = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight'];

sheets.exPicker = ({ mode, day, ex }) => {
  const swap = mode === 'swap';
  const d = { mode, day: day ?? '', ex: ex ?? '' };
  const row = e => `<button class="pick-row" data-act="pickEx" data-id="${e.id}" data-mode="${d.mode}" data-day="${d.day}" data-ex="${d.ex}"
      data-name="${esc(searchKey(e))}" data-m="${e.muscle}" data-eq="${esc(e.equip)}">
      ${exShot(e)}<span class="grow"><span class="t">${esc(e.name)}</span><span class="d">${esc(e.equip)}</span></span>${icon(swap ? 'repeat' : 'plus')}</button>`;
  const recent = recentExIds().map(id => allExercises().find(e => e.id === id)).filter(Boolean).slice(0, 6);
  const groups = Object.entries(MUSCLES).map(([m, label]) => {
    const list = allExercises().filter(e => e.muscle === m);
    return list.length ? `<div class="pick-group"><div class="label-sm">${label}</div>${list.map(row).join('')}</div>` : '';
  }).join('');
  const chips = (key, opts) => `<div class="pick-filters" data-k="${key}">${[['', 'All'], ...opts].map(([v, label], i) =>
    `<button class="chip-btn ${i ? 'soft' : 'on'}" data-act="exFilter" data-k="${key}" data-v="${esc(v)}">${esc(label)}</button>`).join('')}</div>`;
  return `<h2>${swap ? 'Swap exercise' : 'Add exercise'} ${closeBtn}</h2>
    <div class="search-box">${icon('search')}<input class="input-x" id="ex-search" placeholder="Search a move, a muscle or the gear" autocomplete="off" enterkeyhint="search"></div>
    ${chips('m', Object.entries(MUSCLES))}
    ${chips('eq', EQUIPS.map(e => [e, e]))}
    <div class="pick-list">
      ${recent.length ? `<div class="pick-group pick-recent"><div class="label-sm">${swap ? 'You train these most' : 'Recent'}</div>${recent.map(row).join('')}</div>` : ''}
      ${groups}
      <div class="empty" id="ex-none" hidden>Nothing matches. Try a different word, or create your own below.</div>
    </div>
    <details class="custom-ex"><summary>Create a custom exercise</summary>
      <form data-form="customEx" data-mode="${d.mode}" data-day="${d.day}" data-ex="${d.ex}">
        <div class="field"><label>Name</label><input class="input-x" name="name" required maxlength="40"></div>
        <div class="row2"><div class="field"><label>Muscle</label><select class="input-x" name="muscle">${Object.entries(MUSCLES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
        <div class="field"><label>Weight step (kg)</label><input class="input-x" name="inc" inputmode="decimal" value="2.5"></div></div>
        <button class="btn">Create and add</button>
      </form></details>`;
};

// Options for one exercise inside the routine.
sheets.exOpts = ({ day, ex }) => {
  const x = routine()?.days[day]?.exercises[ex];
  if (!x) return `<h2>Exercise ${closeBtn}</h2><div class="empty">This exercise is gone.</div>`;
  const list = routine().days[day].exercises;
  const i = Number(ex);
  const paired = i < list.length - 1 && x.sg && list[i + 1].sg === x.sg;
  return `<h2>${esc(exById(x.exId).name)} ${closeBtn}</h2>
    <div class="label-sm">Rest between sets</div>
    <div class="rest-opts">${[['', 'Routine default'], ...REST_OPTS.map(v => [v, fmtRest(v)])].map(([v, label]) =>
      `<button class="chip-btn ${String(x.rest ?? '') === String(v) ? 'on' : 'soft'}" data-act="setExRest" data-day="${day}" data-ex="${ex}" data-s="${v}">${label}</button>`).join('')}</div>
    <form data-form="exNote" data-day="${day}" data-ex="${ex}">
      <div class="field"><label>Note to yourself</label><input class="input-x" name="note" maxlength="80" placeholder="Seat 4, feet high, pause at the bottom" value="${esc(x.note ?? '')}"></div>
      <button class="btn soft">Save note</button></form>
    <div class="menu">
      <button class="menu-row" data-act="sheet" data-sheet="exPicker" data-mode="swap" data-day="${day}" data-ex="${ex}">${icon('repeat')}Swap for another exercise</button>
      <button class="menu-row" data-act="sheet" data-sheet="exDetail" data-id="${x.exId}">${icon('chart')}History and best sets</button>
      ${i < list.length - 1 ? `<button class="menu-row" data-act="superset" data-day="${day}" data-ex="${ex}">${icon('repeat')}${paired ? 'Break the superset' : `Superset with ${esc(exById(list[i + 1].exId).name)}`}</button>` : ''}
      <button class="menu-row" data-act="moveEx" data-day="${day}" data-ex="${ex}" data-d="-1">${icon('chevron', 'up')}Move up</button>
      <button class="menu-row" data-act="moveEx" data-day="${day}" data-ex="${ex}" data-d="1">${icon('chevron', 'down')}Move down</button>
      <button class="menu-row danger" data-act="removeEx" data-day="${day}" data-ex="${ex}">${icon('trash')}Remove from this day</button>
    </div>`;
};

sheets.dayMenu = ({ day }) => {
  const r = routine();
  const d = r?.days[day];
  if (!d) return '';
  return `<h2>${esc(d.name)} ${closeBtn}</h2>
    <div class="menu">
      <button class="menu-row" data-act="dupDay" data-day="${day}">${icon('plus')}Duplicate this day</button>
      <button class="menu-row" data-act="moveDay" data-day="${day}" data-d="-1">${icon('chevron', 'up')}Move earlier</button>
      <button class="menu-row" data-act="moveDay" data-day="${day}" data-d="1">${icon('chevron', 'down')}Move later</button>
      <button class="menu-row" data-act="startWorkout" data-day="${d.id}">${icon('play')}Start this workout now</button>
      <button class="menu-row danger" data-act="removeDay" data-day="${day}">${icon('trash')}Remove this day</button>
    </div>`;
};

sheets.exMenu = ({ i }) => {
  const x = active()?.exercises[i];
  if (!x) return '';
  return `<h2>${esc(exById(x.exId).name)} ${closeBtn}</h2>
    <div class="label-sm">Rest between sets</div>
    <div class="rest-opts">${[['', 'Routine default'], ...REST_OPTS.map(v => [v, fmtRest(v)])].map(([v, label]) =>
      `<button class="chip-btn ${String(x.rest ?? '') === String(v) ? 'on' : 'soft'}" data-act="setWkRest" data-i="${i}" data-s="${v}">${label}</button>`).join('')}</div>
    <div class="menu">
      <button class="menu-row" data-act="sheet" data-sheet="exDetail" data-id="${x.exId}">${icon('chart')}History and best sets</button>
      <button class="menu-row" data-act="sheet" data-sheet="exPicker" data-mode="wkswap" data-ex="${i}">${icon('repeat')}Swap for another exercise</button>
      <button class="menu-row" data-act="moveWkEx" data-i="${i}" data-d="-1">${icon('chevron', 'up')}Move up</button>
      <button class="menu-row" data-act="moveWkEx" data-i="${i}" data-d="1">${icon('chevron', 'down')}Move down</button>
      <button class="menu-row danger" data-act="removeWkEx" data-i="${i}">${icon('trash')}Remove from workout</button>
    </div>`;
};

sheets.wkMenu = () => `<h2>Workout ${closeBtn}</h2>
  <div class="menu">
    <button class="menu-row" data-act="sheet" data-sheet="plates">${icon('plate')}Plate calculator</button>
    <button class="menu-row" data-act="sheet" data-sheet="restSettings">${icon('timer')}Rest timer</button>
    <button class="menu-row" data-act="nav" data-to="routine">${icon('list')}Edit the routine</button>
    <button class="menu-row danger" data-act="discardWorkout">${icon('trash')}Discard workout</button>
  </div>`;

sheets.exDetail = ({ id }) => {
  const ex = exById(id);
  const h = history(id);
  const pts = h.slice(0, 20).reverse();
  const best = h.flatMap(x => x.sets.map(s => ({ ...s, date: x.date }))).reduce((b, s) => (!b || setScore(s) > setScore(b) ? s : b), null);
  return `<h2>${esc(ex.name)} ${closeBtn}</h2>
    <div class="ex-hero">${exShot(ex, { cls: 'cu-lg' })}
      <div class="grow"><span class="hdr-pill" style="background:var(--move-bg);color:var(--move-ink)">${esc(ex.equip)}</span>
        ${ex.cues?.length ? `<ul class="ex-cues">${ex.cues.map(c => `<li>${icon('check')}<span>${esc(c)}</span></li>`).join('')}</ul>` : ''}
        <p class="note bm-key"><i class="bm-dot on"></i>does the work${hasHalf(ex) ? ' <i class="bm-dot half"></i>helps out' : ''}</p></div></div>
    ${best ? `<div class="calc-result"><div><span>Best set</span><b>${fmt1(best.kg)} × ${best.reps}</b></div><div><span>Est. 1RM</span><b>${fmt1(h.length ? Math.max(...h.map(x => x.best)) : 0)}</b></div><div><span>Sessions</span><b>${h.length}</b></div></div>` : ''}
    ${lineChart({ series: [{ values: pts.map(x => x.best), color: 'var(--move)' }], labels: pts.map((x, i) => (i === 0 || i === pts.length - 1 ? shortDate(x.date) : '')), min: pts.length ? Math.min(...pts.map(x => x.best)) * 0.95 : 0, empty: 'No sets logged for this exercise yet.' })}
    ${h.length ? `<div class="label-sm" style="margin-top:14px">History</div><div class="list">${h.slice(0, 12).map(x => `<div class="row"><div class="grow"><div class="t">${dayLabel(x.date)}</div><div class="d">${x.sets.map(s => `${fmt1(s.kg)}×${s.reps}`).join(' · ')}</div></div><div class="amt">${fmt1(x.best)}</div></div>`).join('')}</div>` : ''}`;
};

// Tapping a muscle on any body map: how much work it is getting and what gives it.
sheets.muscleDetail = ({ r }) => {
  const reg = REGIONS[r];
  if (!reg) return '';
  const share = ex => { const rr = exRegions(ex); return rr.pri.includes(r) ? 1 : rr.sec.includes(r) ? 0.5 : 0; };
  const since = n => workouts().filter(w => w.date > addDays(dayKey(), -n));
  const tally = n => {
    let sets = 0; const by = {}; const days = new Set();
    since(n).forEach(w => w.exercises.forEach(x => {
      const f = share(exById(x.exId));
      if (!f) return;
      sets += x.sets.length * f;
      by[x.exId] = (by[x.exId] ?? 0) + x.sets.length * f;
      days.add(w.date);
    }));
    return { sets, by, days: days.size };
  };
  const wk = tally(7), mo = tally(28);
  const top = Object.entries(mo.by).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const more = allExercises().filter(e => exRegions(e).pri.includes(r) && !mo.by[e.id]).slice(0, 5);
  return `<h2>${esc(reg.name)} ${closeBtn}</h2>
    <div class="ex-hero">${muscleShot(r, { cls: 'cu-lg' })}
      <div class="grow"><p class="note">Part of ${esc(MUSCLES[reg.group])}. A set counts fully when this muscle does the job and half when it only helps.</p></div></div>
    <div class="calc-result"><div><span>This week</span><b>${fmt1(wk.sets)}</b></div><div><span>Weekly avg</span><b>${fmt1(mo.sets / 4)}</b></div><div><span>Days / week</span><b>${fmt1(mo.days / 4)}</b></div></div>
    ${top.length ? `<div class="label-sm" style="margin-top:14px">Where the work comes from · 28 days</div>
    <div class="list">${top.map(([id, n]) => `<div class="row tap" role="button" tabindex="0" data-act="sheet" data-sheet="exDetail" data-id="${id}">
      ${exShot(exById(id))}<div class="grow"><div class="t">${esc(exById(id).name)}</div><div class="d">${esc(exById(id).equip)}</div></div><div class="amt">${fmt1(n)}</div></div>`).join('')}</div>` : '<div class="empty">Nothing has worked this muscle in the last four weeks.</div>'}
    ${more.length ? `<div class="label-sm" style="margin-top:14px">Moves that hit it hardest</div>
    <div class="ex-chips">${more.map(e => `<span>${esc(e.name)}</span>`).join('')}</div>` : ''}`;
};

sheets.wkDetail = ({ id, done }) => {
  const w = byId(id);
  if (!w) return `<h2>Workout ${closeBtn}</h2><div class="empty">This workout was deleted.</div>`;
  const sets = w.exercises.reduce((t, x) => t + x.sets.length, 0);
  return `<h2>${done ? 'Workout done' : esc(w.name)} ${closeBtn}</h2>
    ${done ? `<div class="done-hero">${tile(w.prs?.length ? 'trophy' : 'check', w.prs?.length ? 'school' : 'diet', 'xl')}<div class="t">${esc(w.name)}</div><div class="d">${w.prs?.length ? `${w.prs.length} new personal record${w.prs.length > 1 ? 's' : ''}!` : 'Nice work. Logged and the Gym habit is ticked.'}</div></div>` : `<p class="note">${dayLabel(w.date)} · ${new Date(w.start).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}</p>`}
    <div class="calc-result"><div><span>Time</span><b>${fmtDuration(w.end - w.start)}</b></div><div><span>Sets</span><b>${sets}</b></div><div><span>Volume</span><b>${fmt(w.volume)} kg</b></div></div>
    <div class="wk-map">${bodyMap(toFills(workoutLoad(w), topLoad(workoutLoad(w))), { label: 'Muscles this workout worked', tap: true })}</div>
    <div class="list">${w.exercises.map(x => `<div class="row">${exShot(exById(x.exId))}<div class="grow"><div class="t">${esc(exById(x.exId).name)}${w.prs?.includes(x.exId) ? ` <span class="pr-badge">${icon('trophy')}PR</span>` : ''}</div><div class="d">${x.sets.map(s => `${fmt1(s.kg)}×${s.reps}`).join(' · ')}</div></div></div>`).join('')}</div>
    ${done ? '<button class="btn" data-act="close" style="margin-top:14px">Done</button>' : `<button class="btn danger" data-act="delWorkout" data-id="${w.id}" style="margin-top:14px">Delete workout</button>`}`;
};

sheets.plates = () => `<h2>Plate calculator ${closeBtn}</h2>
  <form data-form="plates">
    <div class="row2"><div class="field"><label>Target weight (kg)</label><input class="input-x" name="kg" inputmode="decimal" value="${state.kv.plateKg ?? 60}"></div>
    <div class="field"><label>Bar</label><select class="input-x" name="bar"><option value="20">Olympic 20 kg</option><option value="15">Women's 15 kg</option><option value="10">Light 10 kg</option><option value="0">No bar</option></select></div></div>
    <div id="plates-out" class="plates-out"></div>
  </form>`;

sheets.restSettings = () => `<h2>Rest timer ${closeBtn}</h2>
  <p class="note">The timer starts when you tick a set and chimes when it's time to go again.</p>
  <div class="rest-opts">${[60, 90, 120, 150, 180, 240].map(s => `<button class="chip-btn ${gymSettings().rest === s ? 'on' : 'soft'}" data-act="setRest" data-s="${s}">${s < 120 ? `${s}s` : `${s / 60} min`}</button>`).join('')}</div>`;

previews.plates = form => {
  const kg = num(form.elements.kg.value), bar = Number(form.elements.bar.value);
  const out = document.getElementById('plates-out');
  let side = (kg - bar) / 2;
  if (side < 0) { out.innerHTML = '<div class="empty">Lighter than the bar.</div>'; return; }
  const used = [];
  for (const p of PLATES) while (side >= p - 1e-9) { used.push(p); side -= p; }
  out.innerHTML = `<div class="bar-viz"><span class="sleeve"></span>${used.map(p => `<span class="pl" style="--h:${40 + p * 2.2}px;background:${PLATE_COLORS[p]}">${p}</span>`).join('')}<span class="collar"></span></div>
    <p class="note center">${used.length ? `Each side: <b>${used.join(' + ')}</b> kg` : 'Just the bar.'}${side > 0.01 ? ` (${fmt1(side * 2)} kg can't be made with standard plates)` : ''}</p>`;
  state.kv.plateKg = kg;
};

// ---------- actions ----------
// The routine saves itself a beat after you stop tapping, and only the day you
// touched is redrawn, so holding + on a stepper stays smooth.
let rtTimer;
function saveRoutine(r) {
  clearTimeout(rtTimer);
  rtTimer = setTimeout(() => setKV('routine', r), 350);
}
function refreshDay(di) {
  const el = document.querySelector(`.rt-day[data-day="${di}"]`);
  if (!el) { render(); return; }
  el.outerHTML = dayCard(routine().days[di], di);
}

const updateRoutine = async (fn, rerender = true) => {
  const r = structuredClone(routine());
  fn(r);
  await setKV('routine', r);
  if (rerender) render();
};

Object.assign(actions, {
  startWorkout: el => startWorkout(el.dataset.day),
  startEmpty: () => startWorkout(null),
  finishWorkout,
  async discardWorkout() {
    if (!confirm('Discard this workout? Ticked sets will be lost.')) return;
    closeSheet(true);
    await discardWorkout();
  },
  wkMenu: () => openSheet('wkMenu'),
  async useTemplate(el) {
    if (el.dataset.confirm && !confirm('Replace your routine with this template?')) return;
    const t = structuredClone(TEMPLATES[el.dataset.t]);
    await setKV('routine', { template: el.dataset.t, name: t.name, perWeek: t.perWeek, days: t.days });
    haptic();
    toast(`${t.name} set up`, { icon: 'dumbbell' });
    render({ enter: true });
  },
  async setDone(el) {
    const aw = active();
    const x = aw.exercises[el.dataset.ex], s = x.sets[el.dataset.set];
    unlockAudio();
    if (!s.done) {
      const kg = num(setValue(s, 'kg')), reps = num(setValue(s, 'reps'));
      if (!reps) { toast('Enter the reps first', { icon: 'info' }); return; }
      if (s.kg === '') s.kg = String(kg);
      if (s.reps === '') s.reps = String(reps);
      s.done = true;
      aw.restTotal = (partnerWaiting(aw, Number(el.dataset.ex)) ? 15 : restOf(x)) * 1000;
      aw.restEnd = Date.now() + aw.restTotal;
      const best = bestBefore(x.exId, aw.start);
      const earlierPR = x.sets.some(y => y.done && y !== s && isPR({ kg: num(y.kg), reps: num(y.reps) }, best));
      if (!earlierPR && isPR({ kg, reps }, best)) {
        toast(`New PR: ${exById(x.exId).name} ${fmt1(kg)} × ${reps}`, { icon: 'trophy', ms: 3000 });
        confetti();
      }
    } else {
      s.done = false;
    }
    haptic();
    await saveActive(aw, true);
    ui.pulse = s.done ? `.set-check[data-ex="${el.dataset.ex}"][data-set="${el.dataset.set}"]` : null;
    render();
  },
  async addSet(el) {
    const aw = active();
    const x = aw.exercises[el.dataset.ex];
    const last = x.sets.at(-1);
    x.sets.push({ kg: '', reps: '', pk: last ? setValue(last, 'kg') : '', pr: last ? setValue(last, 'reps') : x.plan.repMin, done: false });
    await saveActive(aw, true);
    render();
  },
  async removeSet(el) {
    const aw = active();
    aw.exercises[el.dataset.ex].sets.pop();
    await saveActive(aw, true);
    render();
  },
  async rest(el) {
    const aw = active();
    const d = Number(el.dataset.d);
    if (!d) aw.restEnd = null;
    else { aw.restEnd += d * 1000; aw.restTotal += d * 1000; }
    await saveActive(aw, true);
    render();
  },
  async setRest(el) {
    await setKV('gymSettings', { ...gymSettings(), rest: Number(el.dataset.s) });
    haptic();
    refreshSheet();
    render();
  },
  async pickEx(el) {
    await addExercise(el.dataset.id, el.dataset.mode, el.dataset.day, el.dataset.ex);
  },
  async moveWkEx(el) {
    const aw = active(), i = Number(el.dataset.i), j = i + Number(el.dataset.d);
    if (j < 0 || j >= aw.exercises.length) return;
    [aw.exercises[i], aw.exercises[j]] = [aw.exercises[j], aw.exercises[i]];
    await saveActive(aw, true);
    closeSheet();
    render();
  },
  async removeWkEx(el) {
    const aw = active();
    aw.exercises.splice(Number(el.dataset.i), 1);
    await saveActive(aw, true);
    closeSheet();
    render();
  },
  async delWorkout(el) {
    const entry = await removeEntry(el.dataset.id);
    closeSheet();
    render();
    toast('Workout deleted', { icon: 'trash', action: { label: 'Undo', run: async () => { await putEntry(entry); render(); } } });
  },
  addDay: () => updateRoutine(r => r.days.push({ id: uid(), name: `Day ${r.days.length + 1}`, exercises: [] })),
  removeDay: el => {
    if (!confirm('Remove this day from your routine?')) return;
    closeSheet();
    return updateRoutine(r => r.days.splice(Number(el.dataset.day), 1));
  },
  removeEx: el => { closeSheet(); return updateRoutine(r => r.days[el.dataset.day].exercises.splice(Number(el.dataset.ex), 1)); },
  moveEx: el => {
    closeSheet();
    return updateRoutine(r => {
      const list = r.days[el.dataset.day].exercises, i = Number(el.dataset.ex), j = i + Number(el.dataset.d);
      if (j < 0 || j >= list.length) return;
      [list[i], list[j]] = [list[j], list[i]];
    });
  },

  // Sets and rep range, one tap at a time.
  stepNum(el) {
    const r = routine();
    const { day, ex, f } = el.dataset;
    const x = r.days[day]?.exercises[ex];
    if (!x) return;
    const [lo, hi] = LIM[f];
    const v = clamp((Number(x[f]) || lo) + Number(el.dataset.d), lo, hi);
    if (v === x[f]) return;
    x[f] = v;
    if (f === 'repMin' && x.repMax < v) x.repMax = v;
    if (f === 'repMax' && x.repMin > v) x.repMin = v;
    haptic();
    refreshDay(Number(day));
    saveRoutine(r);
  },
  // Point a whole day at strength, hypertrophy or pump in one tap.
  dayPreset(el) {
    const r = routine();
    const pz = REP_PRESETS.find(x => x.id === el.dataset.p);
    const d = r.days[el.dataset.day];
    if (!pz || !d) return;
    d.exercises.forEach(x => { x.sets = pz.sets; x.repMin = pz.repMin; x.repMax = pz.repMax; x.rest = pz.rest; });
    haptic();
    toast(`${d.name} set to ${pz.name.toLowerCase()}`, { icon: 'target' });
    refreshDay(Number(el.dataset.day));
    saveRoutine(r);
  },
  setExRest(el) {
    const r = routine();
    const x = r.days[el.dataset.day]?.exercises[el.dataset.ex];
    if (!x) return;
    x.rest = el.dataset.s ? Number(el.dataset.s) : null;
    haptic();
    refreshSheet();
    refreshDay(Number(el.dataset.day));
    saveRoutine(r);
  },
  setWkRest(el) {
    const aw = active();
    const x = aw.exercises[el.dataset.i];
    x.rest = el.dataset.s ? Number(el.dataset.s) : null;
    haptic();
    refreshSheet();
    saveActive(aw, true);
    render();
  },
  // Superset with the next exercise, or break the pair apart again.
  superset: el => {
    closeSheet();
    return updateRoutine(r => {
      const list = r.days[el.dataset.day].exercises, i = Number(el.dataset.ex);
      if (i >= list.length - 1) return;
      if (list[i].sg && list[i + 1].sg === list[i].sg) { list[i].sg = null; list[i + 1].sg = null; }
      else { const tag = uid().slice(0, 6); list[i].sg = tag; list[i + 1].sg = tag; }
    });
  },
  dupDay: el => {
    closeSheet();
    return updateRoutine(r => {
      const d = structuredClone(r.days[el.dataset.day]);
      r.days.splice(Number(el.dataset.day) + 1, 0, { ...d, id: uid(), name: `${d.name} copy` });
    });
  },
  moveDay: el => {
    closeSheet();
    return updateRoutine(r => {
      const i = Number(el.dataset.day), j = i + Number(el.dataset.d);
      if (j < 0 || j >= r.days.length) return;
      [r.days[i], r.days[j]] = [r.days[j], r.days[i]];
    });
  },
  // Filter chips on the exercise picker, applied without redrawing the sheet.
  exFilter(el) {
    el.parentElement.querySelectorAll('.chip-btn').forEach(b => { b.classList.toggle('on', b === el); b.classList.toggle('soft', b !== el); });
    filterEx();
  },
  muscle: el => openSheet('muscleDetail', { r: el.dataset.r }),
});

// Narrow the picker to what matches the search box and the two chip rows.
function filterEx() {
  const q = (document.getElementById('ex-search')?.value ?? '').trim().toLowerCase();
  const pick = k => document.querySelector(`.pick-filters[data-k="${k}"] .chip-btn.on`)?.dataset.v ?? '';
  const m = pick('m'), eq = pick('eq');
  let any = false;
  document.querySelectorAll('.pick-row').forEach(row => {
    const ok = (!q || row.dataset.name.includes(q)) && (!m || row.dataset.m === m) && (!eq || row.dataset.eq === eq);
    row.hidden = !ok;
    any = any || ok;
  });
  document.querySelectorAll('.pick-group').forEach(g => { g.hidden = ![...g.querySelectorAll('.pick-row')].some(r => !r.hidden); });
  const none = document.getElementById('ex-none');
  if (none) none.hidden = any;
}

async function addExercise(exId, mode, day, exIndex) {
  const name = exById(exId).name;
  if (mode === 'swap') {
    // Keep the sets, reps, rest and superset of the exercise being replaced.
    await updateRoutine(r => { r.days[day].exercises[exIndex] = { ...r.days[day].exercises[exIndex], exId }; }, false);
  } else if (mode === 'routine') {
    await updateRoutine(r => r.days[day].exercises.push({ exId, ...DEFAULT_PLAN }), false);
  } else if (mode === 'wkswap') {
    const aw = active();
    const old = aw.exercises[exIndex];
    aw.exercises[exIndex] = workoutExercise(exId, { ...old.plan, rest: old.rest, note: old.note, sg: old.sg });
    await saveActive(aw, true);
  } else {
    const aw = active();
    aw.exercises.push(workoutExercise(exId));
    await saveActive(aw, true);
  }
  haptic();
  closeSheet();
  toast(`${name} ${mode === 'swap' || mode === 'wkswap' ? 'swapped in' : 'added'}`, { icon: mode.includes('swap') ? 'repeat' : 'plus' });
  render();
}

forms.customEx = async (f, form) => {
  const ex = { id: `c_${uid().slice(0, 8)}`, name: String(f.get('name')).trim(), muscle: f.get('muscle'), equip: 'Custom', inc: num(f.get('inc')) || 2.5 };
  await setKV('customExercises', [...(state.kv.customExercises ?? []), ex]);
  await addExercise(ex.id, form.dataset.mode, form.dataset.day, form.dataset.ex);
};

forms.exNote = async (f, form) => {
  const { day, ex } = form.dataset;
  await updateRoutine(r => { r.days[day].exercises[ex].note = String(f.get('note')).trim(); }, false);
  closeSheet();
  toast('Note saved', { icon: 'pen' });
  render();
};

// Live inputs: workout sets and routine fields save as you type (no re-render, keeps focus).
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'ex-search') { filterEx(); return; }
  if (t.classList.contains('set-in')) {
    const aw = active();
    aw.exercises[t.dataset.ex].sets[t.dataset.set][t.dataset.f] = t.value.replace(',', '.');
    saveActive(aw);
    return;
  }
  if (t.classList.contains('r-in')) {
    const r = routine();
    const { f, day, ex } = t.dataset;
    if (f === 'name') r.name = t.value;
    else if (f === 'perWeek') r.perWeek = Math.max(1, num(t.value)) || 1;
    else if (f === 'dayName') r.days[day].name = t.value || `Day ${Number(day) + 1}`;
    else r.days[day].exercises[ex][f] = Math.max(1, Math.round(num(t.value))) || 1;
    saveRoutine(r);
  }
});
