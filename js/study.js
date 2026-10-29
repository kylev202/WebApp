// v10 Study: the exam countdown, and the planner behind it.
//
// An assessment already carries a date and a weight. What it doesn't carry is the
// hours it will cost, or where those hours are supposed to come from. This works
// that out the way you would on paper: start at the due date, walk backwards, and
// drop sessions into the gaps the day leaves between classes, shifts and whatever
// else is already on the timeline. The nearest deadline picks its slots first.
//
// Running out of calendar before the hours are covered is the useful answer, not a
// failure: a shortfall found three weeks out is a plan, found the night before it's
// a problem. So the plan is always shown with what didn't fit.
import { state, addEntry, removeEntry, setKV } from './store.js';
import { esc, dayKey, addDays, daysBetween, dayLabel, initial, time12, toMin, fromMin, minNow, fmt1, plural, clamp, num } from './util.js';
import { icon, tile } from './icons.js';
import { sheets, actions, forms, render, refreshSheet, closeSheet, toast, haptic, closeBtn, ui } from './core.js';
import { of, kindOf } from './data.js';
import { assessments, courseById, agendaFor, planTabs, ASSESS_KINDS } from './plan.js';
import { workouts } from './gym.js';
import { todaySections } from './today.js';

const MIN_SESSION = 30;  // shorter than this isn't a session, it's a break
const BREAK = 15;        // between two sessions on the same day
const STEP = 15;         // the same quarter-hour grid a dragged block snaps to
const HORIZON = 28;      // sessions are laid in the four weeks before a due date
const STUDYISH = new Set(['study', 'revision', 'reading', 'coding']);

// ---------- what the planner is allowed to use ----------
const DEFAULTS = { session: 90, perDay: 180, from: '09:00', to: '22:30' };
const LIMITS = { session: [MIN_SESSION, 240], perDay: [MIN_SESSION, 840] };
export function studyPrefs() {
  const p = { ...DEFAULTS, ...state.kv.studyPrefs };
  for (const [k, [lo, hi]] of Object.entries(LIMITS)) p[k] = clamp(Math.round(num(p[k])) || DEFAULTS[k], lo, hi);
  const ok = t => /^\d{1,2}:\d{2}$/.test(t ?? '');
  if (!ok(p.from) || !ok(p.to) || toMin(p.to) - toMin(p.from) < MIN_SESSION) { p.from = DEFAULTS.from; p.to = DEFAULTS.to; }
  return p;
}

// ---------- the gaps ----------
// An end before its start runs past midnight (a 6pm–1am shift); the day stops at
// midnight either way.
const until = (start, end, fallback) => { if (!end) return fallback; const m = toMin(end); return m > start ? m : 1440; };
const minOfTs = ts => { const d = new Date(ts); return d.getHours() * 60 + d.getMinutes(); };
const merge = iv => iv.filter(([s, e]) => e > s).sort((a, b) => a[0] - b[0]).reduce((out, [s, e]) => {
  const last = out.at(-1);
  if (last && s <= last[1]) last[1] = Math.max(last[1], e);
  else out.push([s, e]);
  return out;
}, []);

// Everything already claimed on a day: classes, shifts, events, anything with a
// time on it, blocks (planned ones included — a plan is a promise to yourself) and
// workouts. Cached per day until something is written, because planning a
// fortnight asks about the same fortnight once per assessment.
let busyCache = { version: -1, days: new Map() };
export function busyOn(date) {
  if (busyCache.version !== state.version) busyCache = { version: state.version, days: new Map() };
  const hit = busyCache.days.get(date);
  if (hit) return hit;
  const iv = [];
  agendaFor(date).forEach(it => { if (!it.time) return; const s = toMin(it.time); iv.push([s, until(s, it.end, s + 45)]); });
  of('block', date).forEach(b => { const s = toMin(b.start); iv.push([s, until(s, b.end, Math.max(s + 30, minNow() + 15))]); });
  workouts().filter(w => w.date === date).forEach(w => {
    const s = minOfTs(w.start);
    iv.push([s, Math.max(s + 20, w.end ? minOfTs(w.end) : s + 60)]);
  });
  const out = merge(iv);
  busyCache.days.set(date, out);
  return out;
}

// The free runs of a day, in order. `after` cuts off the part of today that's
// already gone; `extra` is time this planning pass has claimed but not written
// down yet, so two assessments can't book the same afternoon.
export function freeGaps(date, { min = MIN_SESSION, from, to, after = null, extra = [] } = {}) {
  const p = studyPrefs();
  const hi = toMin(to ?? p.to);
  let t = Math.max(toMin(from ?? p.from), after ?? 0);
  const out = [];
  for (const [s, e] of merge([...busyOn(date), ...extra])) {
    if (e <= t) continue;
    if (s >= hi) break;
    if (s - t >= min) out.push([t, s]);
    t = Math.max(t, e);
    if (t >= hi) return out;
  }
  if (hi - t >= min) out.push([t, hi]);
  return out;
}
export const freeMins = (date, opts) => freeGaps(date, opts).reduce((n, [s, e]) => n + (e - s), 0);

// ---------- how much work a thing is ----------
// Hours per weight point, which is the only honest handle available: a 40% exam is
// roughly twice the work of a 20% one. You can overrule it per assessment, and the
// screen says when a number is the estimate rather than yours.
const PER_POINT = { exam: 0.6, quiz: 0.35, assignment: 0.5, report: 0.55, presentation: 0.45 };
const FLAT = { exam: 12, quiz: 3, assignment: 8, report: 8, presentation: 6 };
const KIND_ICON = { assignment: 'pen', exam: 'exam', quiz: 'list', presentation: 'users', report: 'book' };
// Something you sit is revision; something you hand in is study.
const SIT = new Set(['exam', 'quiz']);

export const assessIcon = a => KIND_ICON[a.kind] ?? 'pen';
export const isEstimate = a => !(num(a.hours) > 0);
export function needHours(a) {
  const own = num(a.hours);
  if (own > 0) return clamp(own, 0.5, 200);
  const w = num(a.weight);
  const est = w > 0 ? w * (PER_POINT[a.kind] ?? 0.5) : FLAT[a.kind] ?? 8;
  return clamp(Math.round(est * 2) / 2, 1, 60);
}

const blockMins = b => { if (!b.end) return 0; const s = toMin(b.start); const m = toMin(b.end) - s; return m > 0 ? m : m + 1440; };
const sumHours = list => list.reduce((t, b) => t + blockMins(b), 0) / 60;

// Hours against an assessment are the blocks tagged to it: the planner tags the
// ones it lays out, and the block sheet lets you tag the ones you start yourself.
export function progressOf(a, today = dayKey()) {
  const mine = of('block').filter(b => b.assessId === a.id);
  const need = needHours(a);
  const done = sumHours(mine.filter(b => b.end && b.done !== false));
  const ahead = mine.filter(b => b.planned && !b.done && b.date >= today);
  const planned = sumHours(ahead);
  return {
    need, done, planned, sessions: ahead.length,
    left: Math.max(0, need - done),
    toPlan: Math.max(0, need - done - planned),
    pct: need ? clamp((done / need) * 100, 0, 100) : 0,
    plannedPct: need ? clamp((planned / need) * 100, 0, 100 - clamp((done / need) * 100, 0, 100)) : 0,
  };
}

// ---------- the countdown ----------
export const openAssessments = (from = dayKey()) => assessments().filter(a => !a.done && a.due >= from);
export const pastDue = () => assessments().filter(a => !a.done && a.due < dayKey());
export const daysTo = a => daysBetween(dayKey(), a.due);
// You can work on an assignment the morning it's due. You cannot revise during the
// exam, and an exam with no time on it could be at nine.
const lastUsableDay = a => (SIT.has(a.kind) && !a.dueTime ? addDays(a.due, -1) : a.due);

export function countdown(a) {
  const d = daysTo(a);
  const when = `${dayLabel(a.due)}${a.dueTime ? ` · ${time12(a.dueTime)}` : ''}`;
  if (d < 0) return { big: `${-d}`, unit: `${-d === 1 ? 'day' : 'days'} past due`, late: true, when, tag: 'Overdue' };
  if (d === 0) return { big: 'Today', word: true, unit: a.dueTime ? `due ${time12(a.dueTime)}` : 'due today', when, tag: 'Today' };
  return { big: `${d}`, unit: d === 1 ? 'day to go' : 'days to go', when, tag: d === 1 ? 'Tomorrow' : `${d} days` };
}

const hrs = h => `${fmt1(h)} h`;
const fmtMins = m => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}` : `${m}m`);

// The one line that says whether the rest of it is realistic: what's left, how
// much of it is already in the diary, and what the remainder costs per day.
export function paceOf(a, prog = progressOf(a)) {
  const days = Math.max(1, daysBetween(dayKey(), lastUsableDay(a)) + 1);
  const perDay = prog.left / days;
  const text = prog.left <= 0 ? 'The hours are covered'
    : prog.toPlan < 0.5 ? `${hrs(prog.left)} to go, all of it in the diary`
    : prog.planned >= 0.5 ? `${hrs(prog.left)} to go, ${hrs(prog.planned)} booked — about ${hrs(perDay)} a day`
    : `${hrs(prog.left)} to go — about ${hrs(perDay)} a day over ${plural(days, 'day')}`;
  return { days, perDay, text };
}

// ---------- building the plan ----------
const sessionOf = (a, date, start, mins) => {
  const c = courseById(a.courseId);
  return {
    date, start: fromMin(start), end: fromMin(start + mins), mins,
    kind: SIT.has(a.kind) ? 'revision' : 'study',
    assessId: a.id, courseId: a.courseId, code: c.code, color: c.color ?? 'school',
    title: `${c.code} ${a.title}`.slice(0, 60),
  };
};

// Today starts at the next quarter hour rather than at nine this morning, and
// nothing is laid in the half hour before something is due.
function windowOn(a, d, p, today, now) {
  const to = d === a.due && a.dueTime ? fromMin(Math.max(toMin(p.from), toMin(a.dueTime) - 30)) : p.to;
  const after = d === today ? Math.ceil((now + 10) / STEP) * STEP : null;
  if (toMin(to) - Math.max(toMin(p.from), after ?? 0) < MIN_SESSION) return null;
  return { from: p.from, to, after };
}

export function buildPlan() {
  const p = studyPrefs();
  const today = dayKey(), now = minNow();
  const sessions = [];
  const taken = new Map(); // date -> intervals claimed by this pass
  const load = new Map();  // date -> study minutes on the day, already there plus claimed
  const dayLoad = d => {
    if (!load.has(d)) load.set(d, of('block', d).filter(b => b.end && (b.assessId || STUDYISH.has(b.kind))).reduce((t, b) => t + blockMins(b), 0));
    return load.get(d);
  };

  const rows = openAssessments().map(a => {
    const row = { a, ...progressOf(a, today), added: 0, short: 0 };
    let left = Math.floor((row.toPlan * 60) / STEP) * STEP;
    if (left < MIN_SESSION) return row;
    const last = lastUsableDay(a);
    const stop = addDays(last, 1 - HORIZON) > today ? addDays(last, 1 - HORIZON) : today;
    for (let d = last; d >= stop && left >= MIN_SESSION; d = addDays(d, -1)) {
      const room = p.perDay - dayLoad(d);
      if (room < MIN_SESSION) continue;
      const win = windowOn(a, d, p, today, now);
      if (!win) continue;
      let budget = Math.min(room, left);
      for (const [gs, ge] of freeGaps(d, { ...win, min: MIN_SESSION, extra: taken.get(d) ?? [] })) {
        let s = gs;
        while (budget >= MIN_SESSION && ge - s >= MIN_SESSION) {
          const mins = Math.floor(Math.min(p.session, budget, ge - s) / STEP) * STEP;
          if (mins < MIN_SESSION) break;
          sessions.push(sessionOf(a, d, s, mins));
          if (!taken.has(d)) taken.set(d, []);
          taken.get(d).push([s, s + mins]);
          load.set(d, dayLoad(d) + mins);
          budget -= mins;
          left -= mins;
          row.added += mins / 60;
          s += mins + BREAK;
        }
        if (budget < MIN_SESSION) break;
      }
    }
    row.short = left / 60;
    return row;
  });

  sessions.sort((x, y) => x.date.localeCompare(y.date) || x.start.localeCompare(y.start));
  return { prefs: p, rows, sessions, mins: sessions.reduce((t, s) => t + s.mins, 0), days: byDay(sessions) };
}

function byDay(sessions) {
  const map = new Map();
  sessions.forEach(s => { if (!map.has(s.date)) map.set(s.date, []); map.get(s.date).push(s); });
  return [...map].map(([date, items]) => ({ date, items, mins: items.reduce((t, s) => t + (s.mins ?? blockMins(s)), 0) }));
}

// Sessions already in the diary and not yet ticked off.
export const plannedSessions = (from = dayKey()) => of('block')
  .filter(b => b.assessId && b.planned && !b.done && b.date >= from)
  .sort((x, y) => x.date.localeCompare(y.date) || x.start.localeCompare(y.start));

// ---------- markup ----------
export function assessRow(a) {
  const c = courseById(a.courseId), prog = progressOf(a), cd = countdown(a);
  const color = c.color ?? 'school';
  return `<div class="row tap" data-act="sheet" data-sheet="assessment" data-id="${a.id}" role="button">
    ${tile(assessIcon(a), color)}
    <div class="grow"><div class="t">${esc(a.title)}</div>
      <div class="d">${esc(c.code)}${a.weight ? ` · ${fmt1(a.weight)}%` : ''} · ${hrs(prog.done)} of ${hrs(prog.need)}${prog.sessions ? ` · ${plural(prog.sessions, 'session')} planned` : ''}</div>
      <div class="track tgt two"><div class="fill" style="width:${prog.pct.toFixed(0)}%;background:var(--${color})"></div><div class="fill soft" style="width:${prog.plannedPct.toFixed(0)}%;background:var(--${color})"></div></div></div>
    <span class="tag ${cd.late ? 'st-overdue' : daysTo(a) <= 2 ? 'hot' : 'plain'}">${esc(cd.tag)}</span></div>`;
}

function hero(a) {
  const c = courseById(a.courseId), prog = progressOf(a), cd = countdown(a), pace = paceOf(a, prog);
  const color = c.color ?? 'school';
  const foot = `${hrs(prog.done)} done of ${hrs(prog.need)}${isEstimate(a) ? ' estimated' : ''} · ${pace.text}`;
  return `<section class="card glass">
    <div class="head"><div class="title">${tile(assessIcon(a), color)}${esc(c.code)} · ${esc(ASSESS_KINDS[a.kind] ?? 'Due')}${a.weight ? ` · ${fmt1(a.weight)}%` : ''}</div>
      <button class="sub-note" data-act="sheet" data-sheet="assessment" data-id="${a.id}">Edit ${icon('chevron')}</button></div>
    <div class="cd-n ${cd.word ? 'word' : ''}"><b>${esc(cd.big)}</b><span>${esc(cd.unit)}<em>${esc(a.title)} · ${esc(cd.when)}</em></span></div>
    <div class="track two"><div class="fill" style="width:${prog.pct.toFixed(0)}%;background:var(--${color})"></div><div class="fill soft" style="width:${prog.plannedPct.toFixed(0)}%;background:var(--${color})"></div></div>
    <div class="cd-foot">${esc(foot)}</div>
    <div class="row2" style="margin-top:12px">
      <button class="btn soft" data-act="sheet" data-sheet="studyPlan">${icon('calendar')} Plan my study</button>
      <button class="btn soft" data-act="sheet" data-sheet="studyPrefs">${icon('clock')} Study hours</button></div>
  </section>`;
}

function sessionRow(b) {
  const c = courseById(b.courseId);
  const mins = blockMins(b);
  return `<div class="row tap" data-act="sheet" data-sheet="block" data-id="${b.id}" role="button">
    <div class="time">${time12(b.start)}</div><div class="bar" style="background:var(--${c.color ?? 'school'})"></div>
    <div class="grow"><div class="t">${esc(b.title || c.code)}</div><div class="d">${esc(kindOf(b.kind).label)} · until ${time12(b.end)}</div></div>
    <span class="amt">${fmtMins(mins)}</span></div>`;
}

function diaryCard() {
  const ahead = plannedSessions();
  const days = byDay(ahead);
  const total = sumHours(ahead);
  return `<div class="section-label">In the diary ${ahead.length ? `<span>${hrs(total)} · ${plural(ahead.length, 'session')}</span>` : ''}</div>
  <section class="card glass">
    ${ahead.length ? `${days.slice(0, 4).map(d => `<div class="label-sm" style="margin-top:8px">${dayLabel(d.date)} · ${fmtMins(d.mins)}</div>
      <div class="list tight">${d.items.map(sessionRow).join('')}</div>`).join('')}
      ${days.length > 4 ? `<p class="note sub">…and ${plural(days.length - 4, 'day')} further out, on your timeline.</p>` : ''}`
      : '<div class="empty">Nothing booked yet. Build a plan and each session lands on your day as an outline you tick off — or leave empty, which is the honest record.</div>'}
    <div class="row2" style="margin-top:12px">
      <button class="btn soft" data-act="sheet" data-sheet="studyPlan">${icon('repeat')} ${ahead.length ? 'Re-plan' : 'Plan my study'}</button>
      ${ahead.length ? `<button class="btn soft" data-act="studyClear">${icon('trash')} Clear plan</button>` : `<button class="btn soft" data-act="sheet" data-sheet="studyPrefs">${icon('clock')} Study hours</button>`}</div>
  </section>`;
}

function freeCard() {
  const p = studyPrefs();
  const days = Array.from({ length: 7 }, (_, i) => addDays(dayKey(), i));
  const mins = days.map((d, i) => freeMins(d, i === 0 ? { after: Math.ceil(minNow() / STEP) * STEP } : {}));
  const top = Math.max(120, ...mins);
  return `<div class="section-label">Free hours <span>next 7 days</span></div>
  <section class="card glass">
    <div class="free">${days.map((d, i) => `<div class="fd ${mins[i] >= 120 ? 'on' : ''}">
      <div class="fb"><i style="height:${Math.round((mins[i] / top) * 100)}%"></i></div>
      <b>${mins[i] ? `${fmt1(mins[i] / 60)}h` : '–'}</b><span>${i === 0 ? 'Today' : initial(d)}</span></div>`).join('')}</div>
    <p class="note sub">${time12(p.from)} to ${time12(p.to)}, minus classes, shifts, events and anything already on the timeline. This is all the planner has to work with.</p>
  </section>`;
}

export function planStudy() {
  const list = openAssessments(), late = pastDue();
  if (!list.length && !late.length) {
    return `<section class="card glass soon">${tile('exam', 'school', 'xl')}
      <p>No assessments on the books. Add your exams and assignments with their due dates and weights, and Loop works back from each one into the free hours on your days.</p>
      <button class="btn soft" style="margin-top:16px" data-act="sheet" data-sheet="assessment">${icon('plus')} Add an assessment</button></section>`;
  }
  const rest = list.slice(1);
  return `
  ${list.length ? hero(list[0]) : ''}
  ${rest.length ? `<div class="section-label">After that <a data-act="sheet" data-sheet="assessment">Add</a></div>
    <section class="card glass"><div class="list">${rest.map(assessRow).join('')}</div></section>` : ''}
  ${late.length ? `<div class="section-label">Past due <span>${late.length}</span></div>
    <section class="card glass"><div class="list">${late.map(assessRow).join('')}</div>
    <p class="note sub">Mark these submitted, or move the date, and they drop out of the countdown.</p></section>` : ''}
  ${list.length ? diaryCard() : ''}
  ${freeCard()}`;
}

planTabs.push({ key: 'study', label: 'Study', render: planStudy });

// ---------- Today ----------
todaySections.push({
  pos: 'mid',
  render() {
    const soon = openAssessments().filter(a => daysTo(a) <= 21).slice(0, 3);
    if (!soon.length) return '';
    const todays = of('block', dayKey()).filter(b => b.assessId && b.planned && !b.done);
    return `<div class="section-label">Countdown <a data-act="toStudy">Study plan</a></div>
    <section class="card glass"><div class="list">${soon.map(assessRow).join('')}</div>
      ${todays.length ? `<p class="note">Planned today: ${todays.map(b => `${esc(courseById(b.courseId).code)} at ${time12(b.start)}`).join(', ')}.</p>` : ''}
    </section>`;
  },
});

// ---------- sheets ----------
const field = (label, inner) => `<div class="field"><label>${label}</label>${inner}</div>`;

sheets.studyPlan = () => {
  const plan = buildPlan();
  const p = plan.prefs;
  const n = plan.sessions.length;
  const short = plan.rows.filter(r => r.short >= 0.25);
  const nothingToDo = plan.rows.every(r => r.toPlan < 0.5);
  return `<h2>Plan my study ${closeBtn}</h2>
  <p class="note">Worked back from each due date into the gaps on your days. Classes, shifts and anything already on the timeline stay where they are; the nearest deadline picks first.</p>
  <div class="label-sm">Session length</div>
  <div class="quick-amts">${[45, 60, 90, 120].map(v => `<button type="button" class="chip-btn ${p.session === v ? 'on' : 'soft'}" data-act="studySet" data-k="session" data-v="${v}">${v} min</button>`).join('')}</div>
  <div class="label-sm">Most in one day</div>
  <div class="quick-amts">${[60, 120, 180, 240, 300].map(v => `<button type="button" class="chip-btn ${p.perDay === v ? 'on' : 'soft'}" data-act="studySet" data-k="perDay" data-v="${v}">${v / 60} h</button>`).join('')}</div>

  ${n ? `<div class="calc-result"><div><span>Sessions</span><b>${n}</b></div><div><span>Hours</span><b>${fmt1(plan.mins / 60)}</b></div><div><span>Days</span><b>${plan.days.length}</b></div></div>
  ${plan.days.slice(0, 10).map(d => `<div class="label-sm" style="margin-top:10px">${dayLabel(d.date)} · ${fmtMins(d.mins)}</div>
    <div class="list tight">${d.items.map(s => `<div class="row plain">
      <div class="time">${time12(s.start)}</div><div class="bar" style="background:var(--${s.color})"></div>
      <div class="grow"><div class="t">${esc(s.code)} ${esc(kindOf(s.kind).label.toLowerCase())}</div><div class="d">until ${time12(s.end)}</div></div>
      <span class="amt">${fmtMins(s.mins)}</span></div>`).join('')}</div>`).join('')}
  ${plan.days.length > 10 ? `<p class="note sub">…and ${plural(plan.days.length - 10, 'day')} more.</p>` : ''}`
    : `<div class="empty">${nothingToDo
      ? 'Every assessment already has its hours either done or booked in. Clear the plan first if you want it laid out again.'
      : 'No room for a session in the window you allow, before the dates you’re working to. Widen the hours below, or move something off a day.'}</div>`}

  ${short.length ? `<div class="label-sm" style="margin-top:12px">Doesn’t fit</div>
    <div class="list tight">${short.map(r => `<div class="row plain">${tile(assessIcon(r.a), 'move')}
      <div class="grow"><div class="t">${esc(r.a.title)}</div><div class="d">${hrs(r.short)} short of ${hrs(r.need)} by ${dayLabel(r.a.due)}</div></div></div>`).join('')}</div>
    <p class="note sub">Either the hours are optimistic, or something else has to give. You can set your own hours on each assessment.</p>` : ''}

  <div class="btn-row" style="margin-top:14px">
    ${n ? `<button class="btn" data-act="studyApply">${icon('check')} Add ${plural(n, 'session')}</button>` : ''}
    <button class="btn soft" data-act="close">${n ? 'Not now' : 'Close'}</button></div>`;
};

sheets.studyPrefs = () => {
  const p = studyPrefs();
  return `<h2>Study hours ${closeBtn}</h2>
  <form data-form="studyPrefs" class="nice-form">
    <p class="note">The window the planner may use, and the most it will ask of a single day.</p>
    <div class="row2">${field('Earliest', `<input class="input-x" type="time" name="from" value="${esc(p.from)}" required>`)}
      ${field('Latest', `<input class="input-x" type="time" name="to" value="${esc(p.to)}" required>`)}</div>
    <div class="row2">${field('Session length', `<div class="suffix"><input class="input-x" name="session" inputmode="numeric" value="${p.session}"><span>min</span></div>`)}
      ${field('Most in a day', `<div class="suffix"><input class="input-x" name="perDay" inputmode="decimal" value="${fmt1(p.perDay / 60)}"><span>h</span></div>`)}</div>
    <p class="note sub">Sessions land on the quarter hour with ${BREAK} minutes between them, in the four weeks before each due date. Nothing is laid in the half hour before something is due.</p>
    <div class="btn-row"><button class="btn">Save</button></div>
  </form>`;
};

forms.studyPrefs = async (f) => {
  const perDay = Math.round(num(f.get('perDay')) * 60);
  await setKV('studyPrefs', { from: f.get('from'), to: f.get('to'), session: Math.round(num(f.get('session'))), perDay });
  haptic();
  closeSheet();
  toast('Study hours saved', { icon: 'clock' });
  render();
};

// ---------- actions ----------
Object.assign(actions, {
  toStudy() {
    ui.tab.plan = 'study';
    if (location.hash === '#plan') render({ enter: true });
    else location.hash = 'plan';
  },
  async studySet(el) {
    await setKV('studyPrefs', { ...studyPrefs(), [el.dataset.k]: Number(el.dataset.v) });
    haptic();
    refreshSheet();
  },
  // The plan is rebuilt rather than read back from the sheet: a minute may have
  // passed, and the sheet is a picture of it, not the thing itself.
  async studyApply() {
    const { sessions } = buildPlan();
    if (!sessions.length) return closeSheet();
    for (const s of sessions) {
      await addEntry('block', {
        kind: s.kind, title: s.title, note: '', start: s.start, end: s.end,
        planned: true, done: false, assessId: s.assessId, courseId: s.courseId, source: 'study',
      }, s.date);
    }
    haptic();
    closeSheet();
    toast(`${plural(sessions.length, 'session')} on your days`, { icon: 'calendar' });
    render();
  },
  async studyClear() {
    const mine = of('block').filter(b => b.source === 'study' && b.planned && !b.done && b.date >= dayKey());
    if (!mine.length) return;
    if (!confirm(`Remove ${plural(mine.length, 'planned session')} you haven’t ticked off? Sessions you did are kept.`)) return;
    for (const b of mine) await removeEntry(b.id);
    haptic();
    toast('Plan cleared', { icon: 'trash' });
    render();
  },
});
