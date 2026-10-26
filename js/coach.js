// v7 Coaching: morning briefing, evening review, weekly report, badges, reminder guide.
import { state, addEntry, setKV } from './store.js';
import { esc, dayKey, addDays, weekStart, monthKey, shortDate, initial, fmt, fmt1, fmtHours, money, plural, avgLogged, time12 } from './util.js';
import { icon, tile } from './icons.js';
import { sheets, actions, forms, afterRender, render, refreshSheet, toast, haptic, confetti, closeBtn } from './core.js';
import { lineChart } from './charts.js';
import { goals, habits, kcalOn, proteinOn, waterOn, sleepOn, weights, habitDone, streak, anyLogOn, weeklyRate, bulkStatus } from './data.js';
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
const pending = new Set();
async function aiNote(key, prompt) {
  if (!hasAI() || pending.has(key) || state.kv.notes?.[key]) return;
  pending.add(key);
  try {
    const res = await generate({ system: systemPrompt(), contents: [{ role: 'user', parts: [{ text: prompt }] }] });
    const text = aiText(res);
    if (text) await setKV('notes', { ...Object.fromEntries(Object.entries(state.kv.notes ?? {}).slice(-30)), [key]: text });
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
  const chip = (ok, text) => `<span class="rv ${ok ? 'ok' : ''}">${icon(ok ? 'check' : 'dots')}${text}</span>`;
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
    await aiNote(`week:${el.dataset.w}`, `Write my weekly review for the week starting ${el.dataset.w} in 3–4 sentences: training (workouts, PRs), nutrition for the bulk, sleep, money and study. End with one focus for next week.`);
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
    <div class="row tap" data-act="sheet" data-sheet="guideReminders" role="button">${tile('bell', 'sleep')}<div class="grow"><div class="t">Reminders</div><div class="d">Notifications with iPhone Shortcuts</div></div><div class="chev">${icon('chevron')}</div></div>
  </section>`;
});
