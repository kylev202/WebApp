// v7 Coaching: morning briefing, evening review, weekly report, badges, reminder guide.
import { state, addEntry, updateEntry, setKV } from './store.js';
import { esc, dayKey, addDays, weekStart, monthKey, monthDays, shortDate, initial, fmt, fmt1, fmtHours, money, plural, avgLogged, time12, toMin, fromMin, minNow, clamp, dayLabel } from './util.js';
import { icon, tile } from './icons.js';
import { sheets, actions, forms, afterRender, render, refreshSheet, toast, haptic, confetti, closeBtn } from './core.js';
import { targets, targetsSection, targetLines, TARGET_METRICS, PICKABLE } from './targets.js';
import { lineChart } from './charts.js';
import { of, goals, habits, kcalOn, proteinOn, waterOn, sleepOn, weights, habitDone, streak, anyLogOn, weeklyRate, bulkStatus, BLOCK_KINDS, kindOf } from './data.js';
import { workouts, nextDay, suggestion, exById, routine } from './gym.js';
import { agendaFor, tasks, assessments, invoices } from './plan.js';
import { bills, monthSummary, spentIn, budgets, goalsList, txns } from './money.js';
import { hasAI, generate, systemPrompt } from './ai.js';
import { todaySections } from './today.js';
import { settingsSections } from './settings.js';

const hour = () => new Date().getHours();
const aiText = res => res.candidates?.[0]?.content?.parts?.filter(p => p.text && !p.thought).map(p => p.text).join('').trim() ?? '';
const fmtAI = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');

// AI notes are cached by key (one briefing per day, one report per week) so the free tier lasts.
// They are also the coach's memory, so they are kept by what they're worth rather
// than by a flat count: a nudge is stale by tomorrow, a weekly report is the record
// of a whole week and is never dropped. (A flat cap of 30 used to evict the weekly
// reports within a week of the checkpoint nudges arriving.)
const NOTE_DAYS = { nudge: 3, brief: 120, eve: 120 };
function pruneNotes(notes) {
  return Object.fromEntries(Object.entries(notes).filter(([k]) => {
    const [kind, date] = k.split(':');
    const days = NOTE_DAYS[kind];
    return !days || !date || date >= addDays(dayKey(), -days);
  }));
}

const pending = new Set();
async function aiNote(key, prompt) {
  if (!hasAI() || pending.has(key) || state.kv.notes?.[key]) return;
  pending.add(key);
  try {
    const res = await generate({ system: systemPrompt(), contents: [{ role: 'user', parts: [{ text: prompt }] }] });
    const text = aiText(res);
    if (text) await setKV('notes', { ...pruneNotes(state.kv.notes ?? {}), [key]: text });
    render();
  } catch { /* fall back to the rule-based text */ }
  pending.delete(key);
}

// ---------- morning briefing ----------
export function briefingText() {
  const t = dayKey(), g = goals();
  const bits = [];
  const slept = sleepOn(t);
  bits.push(slept ? `Slept <b>${fmtHours(slept)}</b>${slept < g.sleep - 1 ? ', a short night, so go easy' : ''}.` : 'Log last night’s sleep when you can.');
  const items = agendaFor(t);
  const timed = items.filter(i => i.time && !i.due);
  if (timed.length) bits.push(`${timed.slice(0, 3).map(i => `<b>${esc(i.title)}</b> at ${time12(i.time)}`).join(', ')}${timed.length > 3 ? ` and ${timed.length - 3} more` : ''}.`);
  const due = [...items.filter(i => i.due), ...agendaFor(addDays(t, 1)).filter(i => i.due).map(i => ({ ...i, tomorrow: true }))];
  if (due.length) bits.push(`${due.slice(0, 2).map(i => `${esc(i.title.replace(/^(Due|Deadline|Invoice due): /, ''))} is due ${i.tomorrow ? 'tomorrow' : 'today'}`).join('; ')}.`);
  const done = workouts().find(w => w.date === t);
  const next = nextDay();
  if (!done && next) {
    const first = next.exercises[0];
    const s = first ? suggestion(first.exId, first) : null;
    bits.push(`Gym: <b>${esc(next.name)}</b>${s?.kg ? `, try ${esc(exById(first.exId).name.toLowerCase())} at <b>${fmt1(s.kg)} kg</b>` : ''}.`);
  }
  bits.push(`Aim for <b>${fmt(g.kcal)} kcal</b> and <b>${g.protein} g protein</b> to stay on your bulk.`);
  const billDue = bills().filter(b => b.next <= addDays(t, 3));
  if (billDue.length) bits.push(`${billDue.map(b => `${esc(b.name)} ${money(Number(b.amount), false)}`).join(', ')} due soon.`);
  const dueTasks = tasks().filter(x => !x.done && x.due && x.due <= t).length;
  if (dueTasks) bits.push(`${plural(dueTasks, 'task')} due today.`);
  return bits.join(' ');
}

function morningCard() {
  const key = `brief:${dayKey()}`;
  aiNote(key, 'Write my morning briefing for today in 2–3 short, warm sentences: sleep, what’s on (classes, shifts, deadlines), today’s workout with a target weight if known, and food targets for my bulk. No greeting line, no lists.');
  const ai = state.kv.notes?.[key];
  return `<section class="card glass brief">${tile('sun', 'school')}<div class="grow"><div class="meta">Morning briefing${ai ? ` · ${icon('sparkle')}` : ''}</div><p>${ai ? fmtAI(ai) : briefingText()}</p></div></section>`;
}

// ---------- checkpoint nudges (the day view) ----------
// Three moments chosen around a 10am-to-midnight day: mid-afternoon, early evening,
// and late enough to still act on it before bed. Each one is costed once and cached
// like the briefing, so opening the app twenty times is still one Gemini call.
export const CHECKPOINTS = ['14:00', '18:00', '22:30'];
const WAKE = 10 * 60, BED = 24 * 60;
const STUDYISH = ['study', 'revision', 'reading', 'coding'];

// Everything already claimed on the day, so a gap is really a gap.
function busyOn(date) {
  const iv = [];
  agendaFor(date).forEach(it => { if (it.time) iv.push([toMin(it.time), it.end ? toMin(it.end) : toMin(it.time) + 45]); });
  of('block', date).forEach(b => iv.push([toMin(b.start), b.end ? toMin(b.end) : BED]));
  return iv.sort((a, b) => a[0] - b[0]);
}

function nextGap(date, from) {
  let t = from;
  for (const [a, b] of busyOn(date)) {
    if (b <= t) continue;
    if (a - t >= 90) return [t, a];
    t = Math.max(t, b);
  }
  return BED - t >= 90 ? [t, BED] : null;
}

// Plain facts first: whatever the AI is or isn't up to, these are true and free.
function dayFacts(date, cp) {
  const g = goals(), out = [];
  const hoursLeft = Math.max(0, BED - cp) / 60;
  const pace = clamp((cp - WAKE) / (BED - WAKE), 0, 1);
  const protein = proteinOn(date), kcal = kcalOn(date), water = waterOn(date);

  if (!of('meal', date).length) out.push(`Nothing eaten logged yet, and about ${fmt1(hoursLeft)} h of the day left.`);
  else if (protein < g.protein * pace * 0.8) out.push(`Protein is ${fmt(protein)} of ${g.protein} g with about ${fmt1(hoursLeft)} h left.`);
  if (kcal && kcal < g.kcal * pace * 0.7) out.push(`Calories at ${fmt(kcal)}; the bulk still wants ${fmt(g.kcal - kcal)}.`);
  if (water < Math.floor(g.water * pace) - 1) out.push(`Water is ${water} of ${g.water} glasses.`);

  const studied = of('block', date).some(b => STUDYISH.includes(b.kind) && b.done !== false);
  const soon = assessments().filter(a => !a.done && a.due >= date && a.due <= addDays(date, 2));
  if (soon.length && !studied) out.push(`${soon[0].title} is due ${dayLabel(soon[0].due).toLowerCase()} and nothing has been logged against it.`);
  const gap = nextGap(date, Math.max(cp, minNow()));
  const until = m => (m >= BED ? 'midnight' : time12(fromMin(m)));
  if (gap) out.push(`Clear from ${time12(fromMin(gap[0]))} to ${until(gap[1])}${soon.length && !studied ? ', which is the obvious study window' : ''}.`);

  if (cp >= 18 * 60 && !workouts().find(w => w.date === date) && nextDay()) out.push(`No workout logged and ${nextDay().name} is next up.`);

  const spent = spentIn(txns().filter(x => x.date === date));
  const daily = Object.values(budgets()).reduce((t, v) => t + (Number(v) || 0), 0) / monthDays(monthKey(date));
  if (daily && spent > daily * 1.5) out.push(`Spent ${money(spent, false)} today against a ${money(daily, false)} daily pace.`);
  return out;
}

// Only checkpoints the clock has already passed, and only on the live day: the
// framing ("hours left") is meaningless once the day is over.
export function nudgesFor(date) {
  if (date !== dayKey()) return [];
  const now = minNow();
  return CHECKPOINTS.filter(cp => toMin(cp) <= now).map(cp => {
    const facts = dayFacts(date, toMin(cp));
    if (!facts.length) return null;
    const key = `nudge:${date}:${cp}`;
    aiNote(key, `It is ${time12(cp)} and my day runs to about midnight. Where my day stands:\n- ${facts.join('\n- ')}\nWrite me one checkpoint nudge, two short sentences at most: the one thing worth doing with the rest of the day. No greeting, no lists.`);
    const ai = state.kv.notes?.[key];
    return { at: cp, facts, ai: !!ai, html: ai ? fmtAI(ai) : facts.map(esc).join(' ') };
  }).filter(Boolean);
}

// ---------- evening review ----------
function dayStats(d = dayKey()) {
  const g = goals();
  return {
    kcal: kcalOn(d), protein: proteinOn(d), water: waterOn(d), sleep: sleepOn(d),
    workout: workouts().find(w => w.date === d),
    habitsDone: habits().filter(h => habitDone(h.id, d)).length, habitsAll: habits().length,
    spent: spentIn(txns().filter(x => x.date === d)), g,
  };
}

function eveningCard() {
  const s = dayStats();
  const tmr = addDays(dayKey(), 1);
  const planned = tasks().filter(x => x.due === tmr && !x.done);
  const key = `eve:${dayKey()}`;
  const ai = state.kv.notes?.[key];
  const chip = (ok, text) => `<span class="rv ${ok ? 'ok' : ''}">${icon(ok ? 'check' : 'ring')}${text}</span>`;
  return `<section class="card glass evening">
    <div class="head"><div class="title">${tile('sunset', 'sleep')}Evening review</div><button class="sub-note" data-act="sheet" data-sheet="guideReminders">Reminders ${icon('bell')}</button></div>
    <div class="rv-chips">
      ${chip(s.kcal >= s.g.kcal * 0.95, `${fmt(s.kcal)} / ${fmt(s.g.kcal)} kcal`)}
      ${chip(s.protein >= s.g.protein * 0.95, `${fmt(s.protein)} g protein`)}
      ${chip(!!s.workout, s.workout ? esc(s.workout.name) : 'No workout')}
      ${chip(s.water >= s.g.water, `${s.water} glasses`)}
      ${chip(s.habitsDone === s.habitsAll, `${s.habitsDone}/${s.habitsAll} habits`)}
    </div>
    ${ai ? `<p class="ai-note">${tile('sparkle', 'sleep')}<span>${fmtAI(ai)}</span></p>` : hasAI() ? `<button class="btn ghost small" data-act="eveFeedback">${icon('sparkle')} How did I do?</button>` : ''}
    <div class="label-sm" style="margin-top:10px">Top 3 for tomorrow</div>
    ${planned.length >= 3 ? `<div class="list">${planned.slice(0, 3).map(x => `<div class="row"><span class="dot" style="background:var(--diet)"></span><div class="grow"><div class="t">${esc(x.title)}</div></div></div>`).join('')}</div>` : `
    <form data-form="top3" class="top3">
      ${[0, 1, 2].map(i => `<input class="input-x" name="t${i}" placeholder="${['Most important thing', 'Second', 'Third'][i]}" maxlength="80" value="${esc(planned[i]?.title ?? '')}" ${planned[i] ? 'disabled' : ''}>`).join('')}
      <button class="btn soft">${icon('check')} Save for tomorrow</button>
    </form>`}
  </section>`;
}

// ---------- weekly report ----------
export function weekStats(w0) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(w0, i));
  const g = goals();
  const ws = workouts().filter(w => w.date >= w0 && w.date <= days[6]);
  const wts = weights().filter(w => w.date <= days[6]);
  const startW = wts.filter(w => w.date < w0).at(-1) ?? wts.find(w => w.date >= w0);
  const endW = wts.at(-1);
  const spent = spentIn(txns().filter(x => x.date >= w0 && x.date <= days[6]));
  const b = budgets();
  const weeklyBudget = (Object.values(b).reduce((s, v) => s + Number(v || 0), 0) * 12) / 52;
  return {
    days, g, workouts: ws, prs: ws.flatMap(w => w.prs ?? []),
    kcalAvg: avgLogged(days.map(kcalOn)), proteinAvg: avgLogged(days.map(proteinOn)), sleepAvg: avgLogged(days.map(sleepOn)),
    proteinDays: days.filter(d => proteinOn(d) >= g.protein * 0.95).length, kcalDays: days.filter(d => kcalOn(d) >= g.kcal * 0.95).length,
    weightChange: startW && endW && startW !== endW ? endW.kg - startW.kg : null,
    spent, weeklyBudget,
    tasksDone: tasks().filter(x => x.done && x.doneAt && dayKey(new Date(x.doneAt)) >= w0 && dayKey(new Date(x.doneAt)) <= days[6]).length,
    logged: days.filter(anyLogOn).length,
  };
}

const reportWeek = () => (new Date().getDay() === 0 ? weekStart() : addDays(weekStart(), -7)); // Sunday: this week, else last week

sheets.weekReport = ({ w }) => {
  const w0 = w || reportWeek();
  const s = weekStats(w0);
  const key = `week:${w0}`;
  const ai = state.kv.notes?.[key];
  const perWeek = routine()?.perWeek ?? 4;
  const row = (ic, area, label, value, ok) => `<div class="row">${tile(ic, area)}<div class="grow"><div class="t">${label}</div></div><div class="amt ${ok ? 'in' : ''}">${value}</div></div>`;
  return `<h2>Week in review ${closeBtn}</h2>
    <div class="week-nav"><button class="x-btn" data-act="sheet" data-sheet="weekReport" data-w="${addDays(w0, -7)}" aria-label="Previous week">${icon('back')}</button>
      <b>${shortDate(w0)} – ${shortDate(addDays(w0, 6))}</b>
      <button class="x-btn" data-act="sheet" data-sheet="weekReport" data-w="${addDays(w0, 7)}" ${addDays(w0, 7) > dayKey() ? 'disabled' : ''} aria-label="Next week">${icon('chevron')}</button></div>
    ${ai ? `<p class="ai-note">${tile('sparkle', 'sleep')}<span>${fmtAI(ai)}</span></p>` : hasAI() ? `<button class="btn soft" data-act="weekAI" data-w="${w0}" style="margin-bottom:12px">${icon('sparkle')} Get my coach’s summary</button>` : ''}
    <div class="calc-result"><div><span>Workouts</span><b>${s.workouts.length}/${perWeek}</b></div><div><span>PRs</span><b>${s.prs.length}</b></div><div><span>Days logged</span><b>${s.logged}/7</b></div></div>
    ${lineChart({ series: [{ values: s.days.map(d => kcalOn(d) || null), color: 'var(--diet)' }, { values: s.days.map(d => (proteinOn(d) ? (proteinOn(d) / s.g.protein) * s.g.kcal : null)), color: 'var(--move)' }], labels: s.days.map(initial), goal: s.g.kcal, empty: 'No meals logged this week.' })}
    <div class="legend-inline"><span><i class="dot" style="background:var(--diet)"></i>Calories</span><span><i class="dot" style="background:var(--move)"></i>Protein (scaled to goal)</span><span>dashed = goal</span></div>
    ${(() => { const tr = trendLines(w0); return tr.length ? `<div class="label-sm" style="margin-top:12px">Against the weeks before</div><ul class="trend">${tr.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''; })()}
    ${targets().length ? `<div class="label-sm" style="margin-top:12px">Targets</div><ul class="trend">${targetLines().map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    <div class="list" style="margin-top:12px">
      ${row('diet', 'diet', 'Average calories', s.kcalAvg ? `${fmt(s.kcalAvg)} kcal` : '–', s.kcalAvg >= s.g.kcal * 0.95)}
      ${row('shaker', 'move', 'Protein goal hit', `${s.proteinDays}/7 days`, s.proteinDays >= 5)}
      ${row('moon', 'sleep', 'Average sleep', s.sleepAvg ? fmtHours(s.sleepAvg) : '–', s.sleepAvg >= s.g.sleep - 0.25)}
      ${row('scale', 'move', 'Weight change', s.weightChange != null ? `${s.weightChange >= 0 ? '+' : '−'}${fmt1(Math.abs(s.weightChange))} kg` : '–', s.weightChange > 0)}
      ${row('card', 'money', 'Spent', `${money(s.spent, false)}${s.weeklyBudget ? ` / ${money(s.weeklyBudget, false)}` : ''}`, s.weeklyBudget && s.spent <= s.weeklyBudget)}
      ${row('list', 'diet', 'Tasks done', String(s.tasksDone), s.tasksDone > 0)}
    </div>
    ${s.prs.length ? `<div class="label-sm" style="margin-top:12px">Personal records</div><div class="ex-chips">${[...new Set(s.prs)].map(id => `<span>${icon('trophy')} ${esc(exById(id).name)}</span>`).join('')}</div>` : ''}`;
};

function weeklyCard() {
  const w0 = reportWeek();
  const s = weekStats(w0);
  return `<section class="card glass wk-card tap" data-act="sheet" data-sheet="weekReport" data-w="${w0}">${tile('chart', 'diet', 'lg')}
    <div class="grow"><div class="label-sm">Week in review</div><div class="t">${plural(s.workouts.length, 'workout')} · ${s.prs.length ? plural(s.prs.length, 'PR') : `${s.proteinDays}/7 protein days`}</div><div class="d">${shortDate(w0)} – ${shortDate(addDays(w0, 6))} · tap for your report</div></div><div class="chev">${icon('chevron')}</div></section>`;
}

// The checkpoint notes sit above everything else on Today and the Day view.
export function coachNotes(nudges) {
  return nudges.length ? `<div class="section-label">Coach</div>
  <section class="card glass"><div class="list">${nudges.map(n => `<div class="row">
    ${tile(n.ai ? 'sparkle' : 'bell', 'sleep')}<div class="grow"><div class="t">${time12(n.at)}</div><div class="d">${n.html}</div></div></div>`).join('')}</div></section>` : '';
}
todaySections.unshift({ pos: 'top', render: () => coachNotes(nudgesFor(dayKey())) });

todaySections.push({
  pos: 'top',
  render() {
    const h = hour(), dow = new Date().getDay();
    let html = '';
    if (dow === 0 || (dow === 1 && h < 12)) html += weeklyCard();
    if (h < 12) html += morningCard();
    else if (h >= 18) html += eveningCard();
    return html;
  },
});

// Once a week the coach rewrites what it knows about me; once a day, after the
// evening review, it looks for something worth suggesting. Both are cached, so
// opening Today twenty times costs what opening it once does.
todaySections.push({
  pos: 'top',
  render() {
    refreshProfile();
    if (hour() >= 18) makeProposals(`prop:${dayKey()}`, `Today is ${dayKey()} and the day is nearly done. Look at today against the last few weeks and suggest what I should change or put in the diary for tomorrow.`);
    if (new Date().getDay() === 0) makeProposals(`prop:w:${weekStart()}`, `The week is ending. Looking at how the last few weeks compare rather than at this week alone, suggest what I should change: a daily target that no longer fits, time I should put aside, or a long-term target worth setting.`);
    const open = openProposals();
    if (!open.length) return '';
    return `<div class="section-label">Coach suggests <span>${open.length}</span></div>
      <section class="card glass">${open.map(p => `<div class="prop">
        <div class="prop-h">${tile('sparkle', 'sleep')}<div class="grow"><div class="t">${esc(p.title)}</div><div class="d">${esc(p.why)}</div></div></div>
        <div class="prop-btns"><button class="pill-btn go" data-act="acceptProposal" data-id="${p.id}">${icon('check')} Accept</button><button class="pill-btn" data-act="dismissProposal" data-id="${p.id}">Not now</button></div>
      </div>`).join('')}</section>`;
  },
});
todaySections.push({ pos: 'end', render: targetsSection });


// ---------- the long view ----------
// A week on its own says nothing: 6.4 hours of sleep only means something next to
// the three weeks before it. Everything here is about putting a week in a row.
export function weekCompare(w0) {
  const hist = Array.from({ length: 9 }, (_, i) => weekStats(addDays(w0, -7 * i)));
  const [cur, prev] = hist;
  const perWeek = routine()?.perWeek ?? 4;
  // How many weeks back, counting from this one, a thing has been true.
  const run = test => { let n = 0; for (const s of hist) { if (!s.logged || !test(s)) break; n++; } return n; };
  const delta = (a, b) => (a && b ? a - b : null);
  return {
    cur, prev, perWeek,
    kcal: delta(cur.kcalAvg, prev.kcalAvg),
    protein: delta(cur.proteinAvg, prev.proteinAvg),
    sleep: delta(cur.sleepAvg, prev.sleepAvg),
    workouts: cur.workouts.length - prev.workouts.length,
    spent: cur.spent - prev.spent,
    runs: {
      sleepShort: run(s => s.sleepAvg && s.sleepAvg < s.g.sleep - 0.5),
      proteinShort: run(s => s.proteinDays < 5),
      overBudget: run(s => s.weeklyBudget && s.spent > s.weeklyBudget),
      trainingLight: run(s => s.workouts.length < perWeek),
    },
  };
}

// The lines that turn a snapshot into a trend, for the report and the prompts.
export function trendLines(w0) {
  const c = weekCompare(w0);
  const out = [];
  // Each metric needs a move big enough to mean something: a 17 kcal difference
  // between two weeks is noise, and reporting it as a trend costs trust.
  const move = (v, unit, what, min, dp = 0) => { if (v == null || Math.abs(v) < min) return; out.push(`${what} ${v > 0 ? 'up' : 'down'} ${Math.abs(v).toFixed(dp)}${unit} on last week.`); };
  move(c.kcal, ' kcal', 'Average calories', 80);
  move(c.protein, ' g', 'Average protein', 8);
  move(c.sleep, 'h', 'Average sleep', 0.3, 1);
  if (c.workouts) out.push(`${Math.abs(c.workouts)} ${c.workouts > 0 ? 'more' : 'fewer'} workout${Math.abs(c.workouts) === 1 ? '' : 's'} than last week.`);
  const weeks = n => `${n} weeks running`;
  if (c.runs.sleepShort >= 2) out.push(`Sleep has been under goal ${weeks(c.runs.sleepShort)}.`);
  if (c.runs.proteinShort >= 2) out.push(`Protein has missed 5 days a week ${weeks(c.runs.proteinShort)}.`);
  if (c.runs.trainingLight >= 2) out.push(`Training has been under ${c.perWeek} a week ${weeks(c.runs.trainingLight)}.`);
  if (c.runs.overBudget >= 2) out.push(`Spending has been over budget pace ${weeks(c.runs.overBudget)}.`);
  return out;
}

// ---------- the coach's standing notes ----------
// Everything else the coach sees is a snapshot of now. This is the one thing it
// carries: a short note about me that it rewrites once a week from its own recent
// briefings and reviews, and that goes into the context of every later call.
export const coachProfile = () => state.kv.coachProfile ?? null;
const lastFullWeek = () => addDays(weekStart(), -7);

async function refreshProfile() {
  const w0 = lastFullWeek();
  if (!hasAI() || pending.has('profile') || state.kv.coachProfile?.week === w0) return;
  pending.add('profile');
  try {
    const recent = Object.entries(state.kv.notes ?? {})
      .filter(([k]) => k.startsWith('brief:') || k.startsWith('eve:'))
      .sort(([a], [b]) => a.localeCompare(b)).slice(-14)
      .map(([k, v]) => `${k.split(':')[1]}: ${v}`).join('\n');
    const prompt = `Rewrite your standing notes about me for the week ending ${addDays(w0, 6)}.

What you had written before:
${state.kv.coachProfile?.text || '(nothing yet)'}

What the last week looked like against the weeks before it:
- ${trendLines(w0).join('\n- ') || 'Not enough history to compare yet.'}

My long-term targets:
- ${targetLines().join('\n- ') || '(none set)'}

Your own recent briefings and reviews:
${recent || '(none)'}

Write at most 150 words, as notes to yourself, not to me. Keep what still holds, drop what has gone stale. Cover: the patterns that keep repeating, what actually works for me, what I keep slipping on, and anything I have decided. No greeting, no headings, no lists.`;
    const res = await generate({ system: systemPrompt(), contents: [{ role: 'user', parts: [{ text: prompt }] }] });
    const text = aiText(res);
    if (text) await setKV('coachProfile', { week: w0, updated: dayKey(), text: text.slice(0, 1400) });
    render();
  } catch { /* the coach simply keeps last week's notes */ }
  pending.delete('profile');
}

// ---------- proposals ----------
// The coach may suggest anything but change nothing: each suggestion lands as a
// card you accept or dismiss. Dismissals go back into its context, so saying no
// twice is itself a signal.
const PROPOSE_TOOLS = [
  { name: 'propose_daily_goals', description: 'Suggest changing my daily targets. Only send the ones that should change.', parameters: { type: 'object', properties: { kcal: { type: 'number', description: 'Calories' }, protein: { type: 'number', description: 'Protein g' }, water: { type: 'number', description: 'Glasses' }, sleep: { type: 'number', description: 'Hours' }, why: { type: 'string', description: 'One sentence, the evidence for it' } }, required: ['why'] } },
  { name: 'propose_block', description: 'Suggest a block of time I should put aside (study, revision, reading, coding, admin, chores, social, rest).', parameters: { type: 'object', properties: { kind: { type: 'string', description: `One of: ${Object.keys(BLOCK_KINDS).join(', ')}` }, title: { type: 'string', description: 'What specifically' }, date: { type: 'string', description: 'YYYY-MM-DD' }, start: { type: 'string', description: 'HH:MM' }, end: { type: 'string', description: 'HH:MM' }, why: { type: 'string', description: 'One sentence, the evidence for it' } }, required: ['kind', 'date', 'start', 'why'] } },
  { name: 'propose_task', description: 'Suggest a to-do I should add.', parameters: { type: 'object', properties: { title: { type: 'string', description: 'The task' }, due: { type: 'string', description: 'YYYY-MM-DD, optional' }, why: { type: 'string', description: 'One sentence, the evidence for it' } }, required: ['title', 'why'] } },
  { name: 'propose_target', description: 'Suggest a long-term target to set or change.', parameters: { type: 'object', properties: { metric: { type: 'string', description: `One of: ${PICKABLE().map(([k]) => k).join(', ')}` }, to: { type: 'number', description: 'The number to reach, or to sustain each week (each month for spend)' }, due: { type: 'string', description: 'YYYY-MM-DD, optional for weekly ones' }, why: { type: 'string', description: 'One sentence, the evidence for it' } }, required: ['metric', 'to', 'why'] } },
];

const isDate = d => /^\d{4}-\d{2}-\d{2}$/.test(d ?? '');
const isTime = t => /^\d{1,2}:\d{2}$/.test(t ?? '');
const posNum = v => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : null);
export const openProposals = () => of('proposal').filter(p => p.status === 'open');

// Whatever the model sends back is a suggestion, not a fact: anything that
// doesn't survive validation is dropped rather than stored for a later tap.
function validate(name, a) {
  const why = String(a.why ?? '').slice(0, 200);
  if (!why) return null;
  if (name === 'propose_daily_goals') {
    const payload = {};
    for (const k of ['kcal', 'protein', 'water', 'sleep']) if (posNum(a[k])) payload[k] = Math.round(posNum(a[k]) * 100) / 100;
    if (!Object.keys(payload).length) return null;
    const g = goals();
    const words = Object.entries(payload).map(([k, v]) => `${k} ${fmt(g[k])} → ${fmt(v)}`).join(', ');
    return { kind: 'daily_goals', payload, why, title: `Change daily goals: ${words}` };
  }
  if (name === 'propose_block') {
    const kind = Object.keys(BLOCK_KINDS).includes(a.kind) ? a.kind : null;
    if (!kind || !isDate(a.date) || !isTime(a.start)) return null;
    const start = String(a.start).padStart(5, '0');
    const end = isTime(a.end) ? String(a.end).padStart(5, '0') : null;
    const payload = { kind, title: String(a.title ?? '').slice(0, 60), date: a.date, start, end };
    return { kind: 'block', payload, why, title: `${kindOf(kind).label}${payload.title ? `: ${payload.title}` : ''} — ${dayLabel(a.date)} ${time12(start)}` };
  }
  if (name === 'propose_task') {
    const title = String(a.title ?? '').trim().slice(0, 80);
    if (!title) return null;
    return { kind: 'task', payload: { title, due: isDate(a.due) ? a.due : null }, why, title: `Add task: ${title}` };
  }
  if (name === 'propose_target') {
    const metric = PICKABLE().some(([k]) => k === a.metric) ? a.metric : null;
    const to = posNum(a.to);
    if (!metric || !to) return null;
    const m = TARGET_METRICS[metric];
    return { kind: 'target', payload: { metric, to, due: isDate(a.due) ? a.due : null }, why, title: `Target: ${m.label} ${m.kind === 'rate' ? `${fmt1(to)} a ${m.per ?? 'week'}` : fmt1(to)}` };
  }
  return null;
}

async function makeProposals(key, prompt) {
  if (!hasAI() || pending.has(key) || state.kv.proposalRuns?.[key] || openProposals().length >= 3) return;
  pending.add(key);
  try {
    const recentlyRefused = of('proposal').filter(p => p.status === 'dismissed').slice(-6).map(p => p.title).join('; ');
    const res = await generate({
      system: systemPrompt(),
      contents: [{ role: 'user', parts: [{ text: `${prompt}\n\nSuggest at most two things, and only where the data actually supports one — suggesting nothing is a fine answer. Each needs one sentence of evidence from my own numbers. Do not suggest anything I have already turned down: ${recentlyRefused || '(nothing yet)'}` }] }],
      tools: PROPOSE_TOOLS,
    });
    const calls = (res.candidates?.[0]?.content?.parts ?? []).filter(p => p.functionCall);
    for (const p of calls.slice(0, 2)) {
      const v = validate(p.functionCall.name, p.functionCall.args ?? {});
      if (v) await addEntry('proposal', { ...v, status: 'open', source: 'coach' }, dayKey());
    }
    await setKV('proposalRuns', { ...Object.fromEntries(Object.entries(state.kv.proposalRuns ?? {}).slice(-20)), [key]: dayKey() });
    render();
  } catch { /* no suggestions this time */ }
  pending.delete(key);
}

Object.assign(actions, {
  async acceptProposal(el) {
    const p = of('proposal').find(x => x.id === el.dataset.id);
    if (!p) return;
    const a = p.payload ?? {};
    if (p.kind === 'daily_goals') await setKV('goals', { ...goals(), ...a });
    if (p.kind === 'block') await addEntry('block', { kind: a.kind, title: a.title, note: '', start: a.start, end: a.end, planned: true, done: false, source: 'coach' }, a.date);
    if (p.kind === 'task') await addEntry('task', { title: a.title, due: a.due, area: 'life', done: false, source: 'coach' }, dayKey());
    if (p.kind === 'target') {
      const m = TARGET_METRICS[a.metric];
      const existing = targets().find(t => t.metric === a.metric);
      const fields = { metric: a.metric, label: '', to: a.to, from: m.kind === 'point' ? m.now() ?? 0 : null, due: a.due, done: false };
      if (existing) await updateEntry(existing.id, fields);
      else await addEntry('target', { ...fields, source: 'coach' }, dayKey());
    }
    await updateEntry(p.id, { status: 'accepted', decidedAt: dayKey() });
    haptic();
    toast('Done', { icon: 'check' });
    render();
  },
  async dismissProposal(el) {
    await updateEntry(el.dataset.id, { status: 'dismissed', decidedAt: dayKey() });
    haptic();
    render();
  },
});

// ---------- badges ----------
const consecutive = test => streak(test);
export const BADGES = [
  { id: 'first_workout', icon: 'dumbbell', area: 'move', name: 'First rep', desc: 'Log your first workout', test: () => workouts().length >= 1 },
  { id: 'workouts_10', icon: 'dumbbell', area: 'move', name: 'Regular', desc: '10 workouts', test: () => workouts().length >= 10, progress: () => `${Math.min(10, workouts().length)}/10` },
  { id: 'workouts_50', icon: 'muscle', area: 'move', name: 'Gym rat', desc: '50 workouts', test: () => workouts().length >= 50, progress: () => `${Math.min(50, workouts().length)}/50` },
  { id: 'first_pr', icon: 'trophy', area: 'school', name: 'New best', desc: 'Set a personal record', test: () => workouts().some(w => w.prs?.length) },
  { id: 'prs_10', icon: 'trophy', area: 'school', name: 'Record breaker', desc: '10 personal records', test: () => workouts().reduce((t, w) => t + (w.prs?.length ?? 0), 0) >= 10, progress: () => `${Math.min(10, workouts().reduce((t, w) => t + (w.prs?.length ?? 0), 0))}/10` },
  { id: 'streak_7', icon: 'flame', area: 'move', name: 'On a roll', desc: 'Log something 7 days in a row', test: () => consecutive(anyLogOn) >= 7, progress: () => `${Math.min(7, consecutive(anyLogOn))}/7` },
  { id: 'streak_30', icon: 'flame', area: 'school', name: 'Unstoppable', desc: '30-day logging streak', test: () => consecutive(anyLogOn) >= 30, progress: () => `${Math.min(30, consecutive(anyLogOn))}/30` },
  { id: 'protein_7', icon: 'shaker', area: 'move', name: 'Protein pro', desc: 'Hit your protein goal 7 days in a row', test: () => consecutive(d => proteinOn(d) >= goals().protein * 0.95) >= 7, progress: () => `${Math.min(7, consecutive(d => proteinOn(d) >= goals().protein * 0.95))}/7` },
  { id: 'kcal_7', icon: 'diet', area: 'diet', name: 'Fuelled', desc: 'Hit your calorie goal 7 days in a row', test: () => consecutive(d => kcalOn(d) >= goals().kcal * 0.95) >= 7, progress: () => `${Math.min(7, consecutive(d => kcalOn(d) >= goals().kcal * 0.95))}/7` },
  { id: 'water_7', icon: 'drop', area: 'work', name: 'Hydrated', desc: 'Water goal 7 days in a row', test: () => consecutive(d => waterOn(d) >= goals().water) >= 7, progress: () => `${Math.min(7, consecutive(d => waterOn(d) >= goals().water))}/7` },
  { id: 'sleep_7', icon: 'moon', area: 'sleep', name: 'Well rested', desc: 'Sleep goal 7 nights in a row', test: () => consecutive(d => sleepOn(d) >= goals().sleep - 0.25) >= 7, progress: () => `${Math.min(7, consecutive(d => sleepOn(d) >= goals().sleep - 0.25))}/7` },
  { id: 'bulk_on_track', icon: 'chart', area: 'diet', name: 'Lean bulk', desc: 'Gain at a lean-bulk pace over 4 weeks', test: () => { const r = weeklyRate(), w = weights().at(-1); return r != null && w && bulkStatus(r, w.kg).text.startsWith('On track') && weights().length >= 4; } },
  { id: 'budget_month', icon: 'wallet', area: 'money', name: 'Budget boss', desc: 'Finish a month under budget', test: () => { const m = monthKey(addDays(`${monthKey()}-01`, -1)); const s = monthSummary(m); return s.budgetTotal > 0 && s.list.length > 0 && s.spent <= s.budgetTotal; } },
  { id: 'first_invoice', icon: 'receipt', area: 'work', name: 'Paid!', desc: 'Get a freelance invoice paid', test: () => invoices().some(i => i.status === 'paid') },
  { id: 'freelance_1k', icon: 'laptop', area: 'work', name: 'Side hustle', desc: 'Earn A$1,000 freelancing', test: () => txns().filter(t => t.kind === 'income' && t.category === 'freelance').reduce((s, t) => s + Number(t.amount), 0) >= 1000 },
  { id: 'saver', icon: 'piggy', area: 'sleep', name: 'Goal getter', desc: 'Reach a savings goal', test: () => goalsList().some(g => Number(g.saved) >= Number(g.target)) },
  { id: 'scholar', icon: 'school', area: 'school', name: 'Scholar', desc: 'Get a Distinction or better on an assessment', test: () => assessments().some(a => a.score != null && a.score >= 75) },
];

async function checkBadges() {
  const earned = { ...(state.kv.badges ?? {}) };
  const fresh = BADGES.filter(b => !earned[b.id] && b.test());
  if (!fresh.length) return;
  fresh.forEach(b => { earned[b.id] = dayKey(); });
  await setKV('badges', earned);
  // Don't celebrate badges that were earned before badges existed (first run).
  if (state.kv.badgesSeeded) {
    toast(`Badge unlocked: ${fresh[0].name}${fresh.length > 1 ? ` +${fresh.length - 1}` : ''}`, { icon: fresh[0].icon, ms: 3200 });
    confetti();
  } else await setKV('badgesSeeded', true);
}
// Checked shortly after each render (debounced), so a burst of renders costs one
// check — and skipped entirely when nothing has been logged since the last one,
// since no badge can change until an entry does.
let badgeTimer, checkedVersion = -1;
afterRender.push(() => {
  if (state.version === checkedVersion) return;
  clearTimeout(badgeTimer);
  badgeTimer = setTimeout(() => { checkedVersion = state.version; checkBadges(); }, 400);
});

// What the coach has been carrying, in its own words. Shown because a memory you
// can't read is one you can't correct.
sheets.coachNotes = () => {
  const p = coachProfile();
  return `<h2>What your coach has noticed ${closeBtn}</h2>
    ${p ? `<p class="ai-note">${tile('sparkle', 'sleep')}<span>${fmtAI(p.text)}</span></p><p class="note">Rewritten each week from its own briefings and reviews. Last updated ${shortDate(p.updated)}.</p>`
      : `<div class="empty">Nothing yet. Your coach writes these notes once a week${hasAI() ? '' : ', once you connect it in Settings'}.</div>`}`;
};

sheets.badges = () => {
  const earned = state.kv.badges ?? {};
  const got = BADGES.filter(b => earned[b.id]);
  return `<h2>Badges ${closeBtn}</h2><p class="note">${got.length} of ${BADGES.length} unlocked</p>
    <div class="badges">${BADGES.map(b => `<div class="badge ${earned[b.id] ? 'on' : ''}">${tile(b.icon, earned[b.id] ? b.area : 'sleep', 'lg')}<div class="t">${b.name}</div><div class="d">${earned[b.id] ? shortDate(earned[b.id]) : b.progress?.() ?? b.desc}</div></div>`).join('')}</div>`;
};

sheets.guideReminders = () => `<h2>Reminders ${closeBtn}</h2>
  <p class="note">A web app can't schedule notifications by itself, but your iPhone's Shortcuts app can. Create a few personal automations that show a notification:</p>
  <div class="list rem-list">
    ${[['sun', 'school', '8:00 am', 'Check today in Loop'], ['shaker', 'move', '1:00 pm', 'Protein check: how many grams so far?'], ['drop', 'work', '4:00 pm', 'Drink a glass of water'], ['sunset', 'sleep', '9:30 pm', 'Evening review + top 3 for tomorrow'], ['bed', 'sleep', '10:30 pm', 'Wind down: bed by 11'], ['chart', 'diet', 'Sun 7:00 pm', 'Read your week in review']]
      .map(([ic, area, time, text]) => `<div class="row">${tile(ic, area)}<div class="grow"><div class="t">${text}</div><div class="d">${time}</div></div></div>`).join('')}
  </div>
  <ol class="steps" style="margin-top:12px">
    <li><b>Shortcuts</b> → <b>Automation</b> → <b>＋</b> → <b>Time of Day</b>, pick the time and days, <b>Run Immediately</b>.</li>
    <li>Add the action <b>Show Notification</b> and type the reminder.</li>
    <li>Repeat for each one. For logging by voice, set up <b>Siri: “Log to Loop”</b> in Settings → Connections.</li>
  </ol>`;

// ---------- actions ----------
Object.assign(actions, {
  eveFeedback: () => aiNote(`eve:${dayKey()}`, 'Give me a short, kind evening review of today in 2–3 sentences: what went well for my bulk, gym, study and money, and one concrete thing to do better tomorrow.'),
  weekAI: async el => {
    const w0 = el.dataset.w;
    await aiNote(`week:${w0}`, `Write my weekly review for the week starting ${w0} in 3–4 sentences: training (workouts, PRs), nutrition for the bulk, sleep, money and study.

How this week sits against the weeks before it:
- ${trendLines(w0).join('\n- ') || 'Not enough history to compare yet.'}

My long-term targets:
- ${targetLines().join('\n- ') || '(none set)'}

Where something has been repeating for weeks, say so plainly rather than treating it as new. End with one focus for next week.`);
    refreshSheet();
  },
});

forms.top3 = async f => {
  const tmr = addDays(dayKey(), 1);
  let n = 0;
  for (const k of ['t0', 't1', 't2']) {
    const title = String(f.get(k) ?? '').trim();
    if (title) { await addEntry('task', { title, due: tmr, area: 'life', done: false, top3: true }, dayKey()); n++; }
  }
  if (!n) return;
  haptic();
  toast(`${plural(n, 'task')} set for tomorrow`, { icon: 'list' });
  render();
};

settingsSections.push(() => {
  const earned = Object.keys(state.kv.badges ?? {}).length;
  return `<div class="section-label">Coaching</div>
  <section class="card glass conn">
    <div class="row tap" data-act="sheet" data-sheet="badges" role="button">${tile('medal', 'school')}<div class="grow"><div class="t">Badges</div><div class="d">${earned} of ${BADGES.length} unlocked</div></div><div class="chev">${icon('chevron')}</div></div>
    <div class="row tap" data-act="sheet" data-sheet="weekReport" role="button">${tile('chart', 'diet')}<div class="grow"><div class="t">Week in review</div><div class="d">Your weekly report</div></div><div class="chev">${icon('chevron')}</div></div>
    <div class="row tap" data-act="sheet" data-sheet="coachNotes" role="button">${tile('brain', 'sleep')}<div class="grow"><div class="t">What your coach has noticed</div><div class="d">${coachProfile() ? `Updated ${shortDate(coachProfile().updated)}` : 'Written weekly once the AI is connected'}</div></div><div class="chev">${icon('chevron')}</div></div>
    <div class="row tap" data-act="sheet" data-sheet="guideReminders" role="button">${tile('bell', 'sleep')}<div class="grow"><div class="t">Reminders</div><div class="d">Notifications with iPhone Shortcuts</div></div><div class="chev">${icon('chevron')}</div></div>
  </section>`;
});
