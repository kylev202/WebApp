// v9 Targets: the long horizon. Daily goals say what today should look like and
// savings goals cover money; neither can express "78 kg by March" or "four study
// hours a week". A target is a metric, a number and a date, so the coach has
// something to manage toward instead of only reacting to this week.
import { addEntry, updateEntry } from './store.js';
import { esc, dayKey, addDays, addMonths, daysBetween, dayLabel, shortDate, toMin, fmt, fmt1, fmtHours, money, num, clamp, plural } from './util.js';
import { icon, tile } from './icons.js';
import { sheets, actions, forms, render, closeSheet, haptic, closeBtn, chips, removeWithUndo } from './core.js';
import { of, byId, goals, proteinOn, sleepOn, weights, BLOCK_KINDS } from './data.js';
import { workouts } from './gym.js';
import { uniSummary } from './plan.js';
import { goalsList } from './money.js';

const STUDYISH = ['study', 'revision', 'reading', 'coding'];
const WINDOW = 28; // four weeks, the shortest span a weekly rate can be read from

const lastN = (n = WINDOW) => Array.from({ length: n }, (_, i) => addDays(dayKey(), -i));
const blockHoursOn = d => of('block', d)
  .filter(b => STUDYISH.includes(b.kind) && b.done !== false && b.end)
  .reduce((t, b) => t + Math.max(0, toMin(b.end) - toMin(b.start)) / 60, 0);

// A point metric is somewhere you're trying to get to; a rate metric is something
// you're trying to keep up. They need different arithmetic and different words.
export const TARGET_METRICS = {
  weight: { label: 'Body weight', unit: 'kg', icon: 'scale', color: 'move', kind: 'point', step: '0.1', now: () => weights().at(-1)?.kg ?? null },
  wam: { label: 'WAM', unit: '%', icon: 'school', color: 'school', kind: 'point', step: '0.1', now: () => uniSummary()?.wam ?? null },
  gpa: { label: 'GPA', unit: '', icon: 'school', color: 'school', kind: 'point', step: '0.1', now: () => uniSummary()?.gpa ?? null },
  saved: { label: 'Saved', unit: 'A$', icon: 'piggy', color: 'money', kind: 'point', step: '1', now: () => goalsList().reduce((t, g) => t + (Number(g.saved) || 0), 0) },
  study_hours: { label: 'Study hours a week', unit: 'h', icon: 'book', color: 'school', kind: 'rate', step: '0.5', now: () => (lastN().reduce((t, d) => t + blockHoursOn(d), 0) / WINDOW) * 7 },
  workouts: { label: 'Workouts a week', unit: '', icon: 'dumbbell', color: 'move', kind: 'rate', step: '1', now: () => (workouts().filter(w => w.date > addDays(dayKey(), -WINDOW)).length / WINDOW) * 7 },
  protein_days: { label: 'Protein days a week', unit: '', icon: 'shaker', color: 'diet', kind: 'rate', step: '1', now: () => (lastN().filter(d => proteinOn(d) >= goals().protein * 0.95).length / WINDOW) * 7 },
  sleep: { label: 'Average sleep', unit: 'h', icon: 'moon', color: 'sleep', kind: 'rate', step: '0.25', now: () => { const v = lastN().map(sleepOn).filter(Boolean); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; } },
};
export const metricOf = m => TARGET_METRICS[m] ?? TARGET_METRICS.weight;
export const targets = () => of('target').filter(t => !t.done).sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'));

const fmtVal = (v, m) => (m.unit === 'A$' ? money(v, false) : `${fmt1(v)}${m.unit ? ` ${m.unit}` : ''}`);

// Where the target stands: how far along, whether that's where it should be by
// now, and — for a point target moving at its current rate — when it would land.
export function targetStatus(t) {
  const m = metricOf(t.metric);
  const now = m.now();
  if (now == null) return { m, now: null, text: 'Nothing logged for this yet', pct: 0 };

  if (m.kind === 'rate') {
    const pct = t.to > 0 ? clamp((now / t.to) * 100, 0, 100) : 0;
    const ok = now >= t.to * 0.95;
    return { m, now, pct, ok, text: `${fmtVal(now, m)} a week against ${fmtVal(t.to, m)}`, note: ok ? 'Keeping it up' : `${fmtVal(Math.max(0, t.to - now), m)} short` };
  }

  const total = Math.max(1, daysBetween(t.date, t.due));
  const gone = clamp(daysBetween(t.date, dayKey()), 0, total);
  const left = Math.max(0, total - gone);
  const span = t.to - t.from;
  const expected = t.from + span * (gone / total);
  const dir = span >= 0 ? 1 : -1;
  const drift = (now - expected) * dir;
  const tol = Math.abs(span) * 0.05;
  const pct = span ? clamp(((now - t.from) / span) * 100, 0, 100) : 100;
  // Projected landing, only when you're actually moving the right way.
  const perDay = gone ? (now - t.from) / gone : 0;
  const eta = perDay * dir > 0 ? addDays(dayKey(), Math.round((t.to - now) / perDay)) : null;
  return {
    m, now, pct, ok: drift >= -tol, left, eta,
    text: `${fmtVal(now, m)} of ${fmtVal(t.to, m)}`,
    note: drift >= tol ? `${fmtVal(Math.abs(drift), m)} ahead` : drift >= -tol ? 'On pace' : `${fmtVal(Math.abs(drift), m)} behind`,
  };
}

// One line each, for the coach's prompts and the weekly report.
export const targetLines = () => targets().map(t => {
  const s = targetStatus(t);
  return `${t.label || metricOf(t.metric).label}: ${s.text}${t.due ? ` by ${t.due}` : ''} — ${s.note ?? s.text}${s.eta ? ` (on this pace, ${s.eta})` : ''}`;
});

// ---------- markup ----------
function targetRow(t) {
  const s = targetStatus(t);
  const m = s.m;
  return `<div class="row tap" data-act="sheet" data-sheet="target" data-id="${t.id}" role="button">
    ${tile(m.icon, m.color)}
    <div class="grow"><div class="t">${esc(t.label || m.label)}</div>
      <div class="d">${esc(s.text)}${t.due ? ` · ${s.left != null ? (s.left ? `${plural(s.left, 'day')} left` : 'due today') : dayLabel(t.due)}` : ''}</div>
      <div class="track tgt"><div class="fill" style="width:${s.pct.toFixed(0)}%;background:var(--${m.color})"></div></div></div>
    <span class="tag plain ${s.now == null ? '' : s.ok ? 'st-paid' : 'hot'}">${esc(s.note ?? '–')}</span></div>`;
}

export function targetsSection() {
  const list = targets();
  return `<div class="section-label">Targets <a data-act="sheet" data-sheet="target">Add</a></div>
  <section class="card glass">${list.length
    ? `<div class="list">${list.slice(0, 5).map(targetRow).join('')}</div>`
    : `<div class="empty">No long-term targets yet. Add one and the coach will track your pace against it.</div>`}</section>`;
}

// ---------- sheet ----------
const field = (label, inner) => `<div class="field"><label>${label}</label>${inner}</div>`;

sheets.target = ({ id, metric: m0, to: to0, due: due0 }) => {
  const t = id && byId(id);
  const metric = t?.metric ?? m0 ?? 'weight';
  const m = metricOf(metric);
  const now = m.now();
  return `<h2>${t ? 'Edit target' : 'New target'} ${closeBtn}</h2>
  <form data-form="target" class="nice-form">
    <input type="hidden" name="id" value="${t ? t.id : ''}">
    ${field('What are you aiming at?', chips('metric', Object.entries(TARGET_METRICS).map(([v, x]) => [v, x.label, x.icon, x.color]), metric, { cols: 2 }))}
    <div class="field"><label>Name <span class="opt">optional</span></label><input class="input-x" name="label" maxlength="50" placeholder="${esc(m.label)}" value="${esc(t?.label ?? '')}"></div>
    <div class="row2">
      ${field(m.kind === 'rate' ? `Every week (${m.unit || 'count'})` : `Target (${m.unit || 'value'})`, `<input class="input-x" name="to" inputmode="decimal" step="${m.step}" required value="${esc(t?.to ?? to0 ?? '')}" placeholder="${m.kind === 'rate' ? '4' : '78'}">`)}
      ${m.kind === 'point' ? field('Starting from', `<input class="input-x" name="from" inputmode="decimal" step="${m.step}" value="${esc(t?.from ?? (now != null ? fmt1(now) : ''))}" placeholder="now">`) : ''}
    </div>
    ${field(`By when${m.kind === 'rate' ? ' <span class="opt">optional</span>' : ''}`, `<input class="input-x" type="date" name="due" value="${esc(t?.due ?? due0 ?? addMonths(dayKey(), 3))}" ${m.kind === 'point' ? 'required' : ''}>`)}
    ${now != null ? `<p class="note">Right now: <b>${esc(fmtVal(now, m))}</b>${m.kind === 'rate' ? ' a week, averaged over the last four weeks' : ''}.</p>` : `<p class="note">Nothing logged for this yet, so pace starts once there is.</p>`}
    <div class="btn-row"><button class="btn">${t ? 'Save changes' : 'Set target'}</button>
      ${t ? `<button type="button" class="btn danger" data-act="delTarget" data-id="${t.id}">Delete</button>` : ''}</div>
  </form>`;
};

forms.target = async (f) => {
  const id = f.get('id');
  const metric = f.get('metric') || 'weight';
  const m = metricOf(metric);
  const to = num(f.get('to'));
  if (!to && m.unit !== '') return;
  const from = m.kind === 'point' ? (f.get('from') !== null && f.get('from') !== '' ? num(f.get('from')) : m.now() ?? 0) : null;
  const fields = { metric, label: f.get('label').trim(), to, from, due: f.get('due') || null, done: false };
  if (id) await updateEntry(id, fields);
  else await addEntry('target', { ...fields, source: 'manual' }, dayKey());
  haptic();
  closeSheet();
  render();
};
actions.delTarget = async el => { closeSheet(); await removeWithUndo(el.dataset.id, 'Target deleted'); };
