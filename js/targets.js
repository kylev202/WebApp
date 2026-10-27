// v9 Targets: the long horizon. Daily goals say what today should look like and
// savings goals cover money; neither can express "78 kg by March" or "four study
// hours a week". A target is a metric, a number and a date, so the coach has
// something to manage toward instead of only reacting to this week.
import { addEntry, updateEntry } from './store.js';
import { esc, dayKey, addDays, addMonths, daysBetween, dayLabel, shortDate, toMin, fmt, fmt1, fmtHours, money, num, clamp, plural } from './util.js';
import { icon, tile } from './icons.js';
import { sheets, actions, forms, previews, render, closeSheet, haptic, toast, closeBtn, chips, removeWithUndo, sheetForm } from './core.js';
import { of, byId, goals, proteinOn, sleepOn, weights, BLOCK_KINDS } from './data.js';
import { workouts } from './gym.js';
import { uniSummary } from './plan.js';
import { goalsList, monthTxns, spentIn } from './money.js';

const STUDYISH = ['study', 'revision', 'reading', 'coding'];
const WINDOW = 28; // four weeks, the shortest span a weekly rate can be read from

const lastN = (n = WINDOW) => Array.from({ length: n }, (_, i) => addDays(dayKey(), -i));
const blockHoursOn = d => of('block', d)
  .filter(b => STUDYISH.includes(b.kind) && b.done !== false && b.end)
  .reduce((t, b) => t + Math.max(0, toMin(b.end) - toMin(b.start)) / 60, 0);

// A point metric is somewhere you're trying to get to; a rate metric is something
// you're trying to keep up (or, with `lower`, keep under). They need different
// arithmetic and different words — and the sheet asks for different things.
//
// Each metric also carries its own question: what the number means, what good
// looks like, how far out a sensible deadline is. Picking a metric swaps those in.
export const TARGET_METRICS = {
  weight: {
    label: 'Body weight', unit: 'kg', icon: 'scale', color: 'move', kind: 'point', step: '0.1',
    now: () => weights().at(-1)?.kg ?? null,
    placeholder: '78', months: 3, verbs: ['to gain', 'to lose'], presets: now => (now ? [now - 5, now - 2, now + 2, now + 5].map(v => Math.round(v * 10) / 10) : [65, 70, 75, 80]),
    hint: 'Weigh in on the Health tab and the pace updates itself.',
  },
  gpa: {
    label: 'GPA', unit: '', icon: 'school', color: 'school', kind: 'point', step: '0.05',
    now: () => uniSummary()?.gpa ?? null,
    placeholder: '3.5', months: 6, verbs: ['to climb', 'to claw back'], presets: () => [3, 3.5, 3.8, 4], max: 4,
    hint: 'Read from the marks you enter against each course on Plan.',
  },
  saved: {
    label: 'Saved', unit: 'A$', icon: 'piggy', color: 'money', kind: 'point', step: '1',
    now: () => goalsList().reduce((t, g) => t + (Number(g.saved) || 0), 0),
    placeholder: '2500', months: 6, verbs: ['to put away', 'to draw down'], presets: () => [1000, 2500, 5000, 10000],
    hint: 'Counts everything across your savings goals on Money.',
  },
  spend: {
    label: 'Monthly spending', unit: 'A$', icon: 'wallet', color: 'money', kind: 'rate', per: 'month', lower: true, step: '10', basis: 'at your recent rate',
    now: () => {
      // Average of the last three whole months, so a half-finished month doesn't flatter it.
      const months = Array.from({ length: 3 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (i + 1)); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; });
      const spent = months.map(mk => (monthTxns(mk).length ? spentIn(monthTxns(mk)) : null)).filter(v => v != null);
      if (spent.length) return spent.reduce((a, b) => a + b, 0) / spent.length;
      // No whole month behind you yet: read this month at the pace it's going.
      const soFar = spentIn(monthTxns());
      const d = new Date().getDate();
      return soFar ? (soFar / d) * new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() : null;
    },
    placeholder: '1200', months: 0, presets: () => [800, 1200, 1600, 2000],
    hint: 'A ceiling for everything you spend in a month: your last three whole months, or this month’s pace until you have them.',
  },
  study_hours: {
    label: 'Study hours a week', unit: 'h', icon: 'book', color: 'school', kind: 'rate', step: '0.5',
    now: () => (lastN().reduce((t, d) => t + blockHoursOn(d), 0) / WINDOW) * 7,
    placeholder: '12', months: 0, presets: () => [6, 10, 14, 20],
    hint: 'Counts study, revision, reading and coding blocks on Plan.',
  },
  workouts: {
    label: 'Workouts a week', unit: '', icon: 'dumbbell', color: 'move', kind: 'rate', step: '1',
    now: () => (workouts().filter(w => w.date > addDays(dayKey(), -WINDOW)).length / WINDOW) * 7,
    placeholder: '4', months: 0, presets: () => [3, 4, 5, 6],
    hint: 'Counts finished sessions in the gym log.',
  },
  protein_days: {
    label: 'Protein days a week', unit: '', icon: 'shaker', color: 'diet', kind: 'rate', step: '1',
    now: () => (lastN().filter(d => proteinOn(d) >= goals().protein * 0.95).length / WINDOW) * 7,
    placeholder: '6', months: 0, presets: () => [4, 5, 6, 7], max: 7,
    hint: 'A day counts once you hit your daily protein goal.',
  },
  sleep: {
    label: 'Average sleep', unit: 'h', icon: 'moon', color: 'sleep', kind: 'rate', step: '0.25',
    now: () => { const v = lastN().map(sleepOn).filter(Boolean); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; },
    placeholder: '8', months: 0, presets: () => [7, 7.5, 8, 8.5],
    hint: 'Averaged over the last four weeks of logged nights.',
  },
  // Retired, but kept so targets set before it went away still read correctly.
  wam: { label: 'WAM', unit: '%', icon: 'school', color: 'school', kind: 'point', step: '0.1', hidden: true, now: () => uniSummary()?.wam ?? null, placeholder: '75', months: 6, presets: () => [65, 70, 75, 80] },
};
export const PICKABLE = () => Object.entries(TARGET_METRICS).filter(([, m]) => !m.hidden);

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
    const per = m.per ?? 'week';
    // A ceiling reads the other way round: under it is the win, over it is the gap.
    if (m.lower) {
      const pct = now > 0 ? clamp((t.to / now) * 100, 0, 100) : 100;
      const ok = now <= t.to * 1.05;
      return { m, now, pct, ok, text: `${fmtVal(now, m)} a ${per} against ${fmtVal(t.to, m)}`, note: ok ? 'Under it' : `${fmtVal(now - t.to, m)} over` };
    }
    const pct = t.to > 0 ? clamp((now / t.to) * 100, 0, 100) : 0;
    const ok = now >= t.to * 0.95;
    return { m, now, pct, ok, text: `${fmtVal(now, m)} a ${per} against ${fmtVal(t.to, m)}`, note: ok ? 'Keeping it up' : `${fmtVal(Math.max(0, t.to - now), m)} short` };
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

// Everything below the metric picker depends on which metric is picked: the unit
// on the target box, whether there's a starting point, whether a date is required,
// the suggested numbers, the sentence about what it would take. Picking a different
// metric redraws this block rather than leaving kilograms on a savings target.
function targetBody(metric, t) {
  const m = metricOf(metric);
  const now = m.now();
  const rate = m.kind === 'rate';
  const per = m.per ?? 'week';
  const presets = (m.presets?.(now) ?? []).filter(v => v > 0);
  const due = t?.due ?? (m.months ? addMonths(dayKey(), m.months) : '');
  const unit = m.unit === 'A$' ? 'A$' : m.unit;
  return `<div class="row2">
      ${field(rate ? `${m.lower ? 'Stay under each' : 'Every'} ${per}${unit ? ` (${unit})` : ''}` : `Target${unit ? ` (${unit})` : ''}`,
        `<input class="input-x" name="to" inputmode="decimal" step="${m.step}" ${m.max ? `max="${m.max}"` : ''} required value="${esc(t?.to ?? '')}" placeholder="${esc(m.placeholder ?? '')}">`)}
      ${rate ? '' : field('Starting from', `<input class="input-x" name="from" inputmode="decimal" step="${m.step}" value="${esc(t?.from ?? (now != null ? fmt1(now) : ''))}" placeholder="${now != null ? esc(fmt1(now)) : 'now'}">`)}
    </div>
    ${presets.length ? `<div class="quick-amts">${presets.map(v => `<button type="button" class="chip-btn soft" data-act="tgtPreset" data-v="${v}">${m.unit === 'A$' ? money(v, false) : fmt1(v)}${m.unit && m.unit !== 'A$' ? ` ${m.unit}` : ''}</button>`).join('')}</div>` : ''}
    ${field(`By when${rate ? ' <span class="opt">optional</span>' : ''}`, `<input class="input-x" type="date" name="due" value="${esc(due)}" ${rate ? '' : 'required'}>`)}
    ${rate ? '' : `<div class="quick-amts">${[['3 months', 3], ['6 months', 6], ['1 year', 12]].map(([l, mo]) => `<button type="button" class="chip-btn soft" data-act="tgtDue" data-m="${mo}">${l}</button>`).join('')}</div>`}
    <p class="note" id="tgt-pace">${esc(paceLine(metric, t?.to, due))}</p>
    ${m.hint ? `<p class="note sub">${esc(m.hint)}</p>` : ''}`;
}

// The one sentence that makes a target real: what it asks of you between now and then.
function paceLine(metric, to, due) {
  const m = metricOf(metric);
  const now = m.now();
  const target = num(to);
  const nowText = now == null
    ? 'Nothing logged for this yet, so the pace starts once there is.'
    : `Right now: ${fmtVal(now, m)}${m.kind === 'rate' ? ` a ${m.per ?? 'week'}, ${m.basis ?? 'averaged over the last four weeks'}` : ''}.`;
  if (now == null || !target) return nowText;
  if (m.kind === 'rate') {
    const gap = m.lower ? now - target : target - now;
    if (gap <= 0) return `${nowText} You're already there — this target holds the line.`;
    return `${nowText} That's ${fmtVal(gap, m)} ${m.lower ? 'to cut' : 'more'} a ${m.per ?? 'week'}.`;
  }
  const days = due ? daysBetween(dayKey(), due) : 0;
  const span = target - now;
  if (!span) return `${nowText} You're already at the number.`;
  if (days <= 0) return `${nowText} Pick a date in the future to see the pace.`;
  const weeks = days / 7;
  const perWeek = Math.abs(span) / weeks;
  const [up, down] = m.verbs ?? ['up', 'down'];
  const rateText = m.unit === 'A$'
    ? `${money((Math.abs(span) / days) * 30.4, false)} a month`
    : `${fmtVal(perWeek, m)} a week`;
  return `${nowText} ${fmtVal(Math.abs(span), m)} ${span > 0 ? up : down} over ${plural(days, 'day')} — about ${rateText}.`;
}

sheets.target = ({ id, metric: m0, to: to0, due: due0 }) => {
  const t = id && byId(id);
  const metric = t?.metric ?? m0 ?? 'weight';
  const m = metricOf(metric);
  const seed = t || (to0 || due0 ? { to: to0, due: due0 } : null);
  return `<h2>${t ? 'Edit target' : 'New target'} ${closeBtn}</h2>
  <form data-form="target" class="nice-form">
    <input type="hidden" name="id" value="${t ? t.id : ''}">
    ${field('What are you aiming at?', chips('metric', PICKABLE().map(([v, x]) => [v, x.label, x.icon, x.color]), metric, { cols: 2 }))}
    <div class="field"><label>Name <span class="opt">optional</span></label><input class="input-x" name="label" maxlength="50" placeholder="${esc(m.label)}" value="${esc(t?.label ?? '')}"></div>
    <div id="tgt-body" data-metric="${esc(metric)}">${targetBody(metric, seed)}</div>
    <div class="btn-row"><button class="btn">${t ? 'Save changes' : 'Set target'}</button>
      ${t ? `<button type="button" class="btn danger" data-act="delTarget" data-id="${t.id}">Delete</button>` : ''}</div>
  </form>`;
};

// Swapping the metric swaps the question; typing in it only refreshes the pace line.
previews.target = form => {
  const metric = new FormData(form).get('metric') || 'weight';
  const box = form.querySelector('#tgt-body');
  if (!box) return;
  if (box.dataset.metric !== metric) {
    box.dataset.metric = metric;
    box.innerHTML = targetBody(metric, null);
    form.elements.label.placeholder = metricOf(metric).label;
    return;
  }
  const line = form.querySelector('#tgt-pace');
  if (line) line.textContent = paceLine(metric, form.elements.to?.value, form.elements.due?.value);
};

actions.tgtPreset = el => {
  const f = sheetForm('target');
  if (!f) return;
  f.elements.to.value = el.dataset.v;
  previews.target(f);
};
actions.tgtDue = el => {
  const f = sheetForm('target');
  if (!f) return;
  f.elements.due.value = addMonths(dayKey(), Number(el.dataset.m));
  previews.target(f);
};

forms.target = async (f) => {
  const id = f.get('id');
  const metric = f.get('metric') || 'weight';
  const m = metricOf(metric);
  const to = num(f.get('to'));
  if (!to) return toast(`Enter a ${m.kind === 'rate' ? 'weekly number' : 'target'} for ${m.label.toLowerCase()}`, { icon: 'info' });
  const from = m.kind === 'point' ? (f.get('from') ? num(f.get('from')) : m.now() ?? 0) : null;
  const fields = { metric, label: String(f.get('label') ?? '').trim(), to, from, due: f.get('due') || null, done: false };
  if (id) await updateEntry(id, fields);
  else await addEntry('target', { ...fields, source: 'manual' }, dayKey());
  haptic();
  closeSheet();
  render();
};
actions.delTarget = async el => { closeSheet(); await removeWithUndo(el.dataset.id, 'Target deleted'); };
