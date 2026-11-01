// Health: diet, sleep and body tabs (the overview lives in overview.js, gym in gym.js), plus their logging sheets.
import { addEntry, updateEntry, putEntry, removeEntry } from './store.js';
import { esc, dayKey, lastDays, longDate, dayLabel, fmt, fmtHours, timeOf, time12, avgLogged, sum, num, plural } from './util.js';
import { icon, tile } from './icons.js';
import { screens, sheets, actions, forms, previews, ui, render, openSheet, closeSheet, toast, haptic, closeBtn, header, seg, sect, sheetForm, dateField, readDate, fold, foldReport } from './core.js';
import { goals, of, byId, waterOn, sleepOn, weights, weeklyRate, bulkStatus, macroTargets, sleepHours, recentMeals } from './data.js';
import { gymTab } from './gym.js';
import { overviewTab, overviewHeader } from './overview.js';
import { sleepAnalytics, bodyAnalytics } from './analytics.js';
import { dietAnalytics } from './diet-analytics.js';
import { gymAnalytics } from './gym-analytics.js';
import { consultCard } from './specialists.js';

export function mealRow(m) {
  return `<div class="row tap" data-act="sheet" data-sheet="meal" data-id="${m.id}" role="button">
    <div class="time">${m.time ? time12(m.time) : timeOf(m.ts)}</div><div class="bar" style="background:var(--diet)"></div>
    <div class="grow"><div class="t">${esc(m.name)}</div><div class="d">${fmt(m.kcal)} kcal${m.protein ? ` · ${fmt(m.protein)} g protein` : ''}</div></div>
    <button class="x-btn" data-act="del" data-id="${m.id}" aria-label="Delete">${icon('close')}</button></div>`;
}

// Each subtab says, in the header, what it is a view of: Overview is one day
// read closely, the other four are one subject read over time. Without that the
// five identical pills gave no clue which of the two you were about to get.
const HEALTH_SUB = {
  overview: 'One day, read closely',
  gym: 'Training · session, then progress',
  diet: 'Food · today, then the weeks',
  sleep: 'Sleep · report, then every night',
  body: 'Weight · trend, then every reading',
};

function renderHealth() {
  const tab = ui.tab.health ?? 'overview';
  const body = { overview: overviewTab, gym: () => gymTab(foldReport('gym', gymAnalytics())), diet: healthDiet, sleep: healthSleep, body: healthBody }[tab]();
  const top = tab === 'overview' ? overviewHeader() : header('Health', HEALTH_SUB[tab] ?? longDate());
  // Each tab has its own specialist, who reads that tab's data first. The GP reads
  // everything, so it sits on today's overview (a past day is a record, not a consult).
  const doc = tab === 'overview' && ui.tab.healthDate ? '' : consultCard(tab);
  return `${top}${seg('health', [['overview', 'Overview'], ['gym', 'Gym'], ['diet', 'Diet'], ['sleep', 'Sleep'], ['body', 'Body']], tab, { dock: true })}${doc}${body}`;
}
screens.health = renderHealth;

function healthDiet() {
  const g = goals();
  const t = dayKey();
  const meals = of('meal', t);
  const [p, c, f] = ['protein', 'carbs', 'fat'].map(k => sum(meals, k));
  const targets = macroTargets(g);
  // Today's number, then the meals that made it, then the report, then the days
  // before. The meals used to sit under the multi-week report, so checking what
  // you had an hour ago meant scrolling past four charts to get to it.
  const earlier = lastDays(7).slice(0, -1).reverse().map((d, i) => {
    const ms = of('meal', d);
    if (!ms.length) return '';
    return fold(`diet:day:${i}`, dayLabel(d), `<section class="card glass"><div class="list">${ms.map(mealRow).join('')}</div></section>`,
      { aside: `${plural(ms.length, 'meal')} · ${fmt(sum(ms, 'kcal'))} kcal · ${fmt(sum(ms, 'protein'))} g protein` });
  }).join('');
  return `
  ${sect('Today', { nav: 'Today', note: `Against your ${fmt(g.kcal)} kcal and ${g.protein} g protein targets.`, open: true })}
  <section class="card glass">
    <div class="money-top"><div><div class="label-sm">Eaten today</div><div class="big-xl">${fmt(sum(meals, 'kcal'))}<small>of ${fmt(g.kcal)} kcal</small></div></div>
      <button class="pill-btn" data-act="sheet" data-sheet="meal">${icon('plus')} Meal</button></div>
    <div class="macro-bars">
      ${macroBar('Protein', p, g.protein, 'var(--move)')}
      ${macroBar('Carbs', c, targets.carbs, 'var(--school)')}
      ${macroBar('Fat', f, targets.fat, 'var(--diet)')}
    </div>
  </section>
  ${sect('Today’s meals', { nav: 'Meals', note: meals.length ? 'Tap a meal to edit it.' : 'Nothing written down yet today.', right: `<span class="sect-v">${plural(meals.length, 'meal')}</span>` })}
  <section class="card glass">${meals.length ? `<div class="list">${meals.map(mealRow).join('')}</div>`
    : '<div class="empty">Add your first meal of the day with ＋ Meal above.</div>'}</section>
  ${sect('Report', { nav: 'Report', note: 'How you have actually eaten over the last weeks: averages, consistency and where the calories came from.' })}
  ${foldReport('diet', dietAnalytics())}
  ${earlier ? `${sect('Earlier days', { nav: 'Earlier', note: 'The six days before today, newest first. Tap a day for its meals.' })}${earlier}` : ''}`;
}

function macroBar(label, value, goal, color) {
  return `<div class="macro"><span>${label}</span><div class="track"><div class="fill" style="width:${Math.min(100, (value / goal) * 100)}%;background:${color}"></div></div><b>${fmt(value)} / ${fmt(goal)} g</b></div>`;
}

function healthSleep() {
  const recent = of('sleep').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
  return `${sect('Report', { nav: 'Report', note: 'Your last weeks of sleep: average against goal, debt, how steady your bedtime is and a score out of 100.', open: true })}
  ${foldReport('sleep', sleepAnalytics(), { open: ['last-14-nights'] })}
  ${recent.length ? `${sect('Every night', { nav: 'Nights', note: 'The nights the report is built from, newest first. Tap one to correct it.' })}${fold('sleep:nights', 'Night by night', `<section class="card glass"><div class="list">${recent.map(s => `
    <div class="row tap" data-act="sheet" data-sheet="sleep" data-id="${s.id}" role="button"><div class="bar" style="background:var(--sleep)"></div><div class="grow"><div class="t">${dayLabel(s.date)}</div><div class="d">${esc(s.bed)} → ${esc(s.wake)}</div></div>
    <div class="amt">${fmtHours(s.hours)}</div><button class="x-btn" data-act="del" data-id="${s.id}" aria-label="Delete">${icon('close')}</button></div>`).join('')}</div></section>`, { aside: `last ${plural(recent.length, 'night')}` })}` : ''}`;
}

function healthBody() {
  const ws = weights();
  return `
  ${sect('Report', { nav: 'Report', note: 'Day-to-day water swings smoothed into a trend, read against a lean-bulk rate and your calories.', open: true })}
  ${foldReport('body', bodyAnalytics(), { keep: 2 })}
  ${ws.length ? `${sect('Every weigh-in', { nav: 'Weigh-ins', note: 'The raw readings behind the trend, newest first.' })}${fold('body:weighins', 'Weigh-ins', `<section class="card glass"><div class="list">${ws.slice().reverse().slice(0, 20).map(w => `
    <div class="row tap" data-act="sheet" data-sheet="weight" data-id="${w.id}" role="button"><div class="bar" style="background:var(--move)"></div><div class="grow"><div class="t">${dayLabel(w.date)}</div></div>
    <div class="amt">${w.kg} kg</div><button class="x-btn" data-act="del" data-id="${w.id}" aria-label="Delete">${icon('close')}</button></div>`).join('')}</div></section>`, { aside: `${plural(Math.min(20, ws.length), 'reading')}, newest first` })}` : ''}`;
}

// ---------- sheets ----------
const deleteBtn = id => (id ? `<button type="button" class="btn danger" data-act="delFromSheet" data-id="${id}">Delete</button>` : '');

sheets.quick = () => `<h2>Log ${closeBtn}</h2>
  <div class="quick-grid">
    <button class="quick-btn" style="background:var(--diet-bg);color:var(--diet-ink)" data-act="sheet" data-sheet="meal">${icon('diet')}<span>Meal</span></button>
    <button class="quick-btn" style="background:var(--work-bg);color:var(--work-ink)" data-act="water" data-n="1" data-close="1">${icon('drop')}<span>Glass of water</span></button>
    <button class="quick-btn" style="background:var(--sleep-bg);color:var(--sleep-ink)" data-act="sheet" data-sheet="sleep">${icon('moon')}<span>Sleep</span></button>
    <button class="quick-btn" style="background:var(--move-bg);color:var(--move-ink)" data-act="sheet" data-sheet="weight">${icon('scale')}<span>Weigh-in</span></button>
  </div>`;

sheets.meal = ({ id }) => {
  const m = id && byId(id);
  const recent = m ? [] : recentMeals();
  const v = k => (m && m[k] ? esc(m[k]) : '');
  return `<h2>${m ? 'Edit meal' : 'Add meal'} ${closeBtn}</h2>
  ${recent.length ? `<div class="label-sm">Recent · tap to fill</div><div class="chips-recent">${recent.map(r => `<button type="button" class="chip-btn" data-act="recent" data-id="${r.id}">${esc(r.name)}</button>`).join('')}</div>` : ''}
  <form data-form="meal" class="nice-form">
    <input type="hidden" name="id" value="${m ? m.id : ''}">
    <div class="field"><label>What did you eat?</label><input class="input-x" name="name" required maxlength="60" placeholder="e.g. Chicken rice bowl" autocomplete="off" value="${v('name')}"></div>
    <div class="row2">
      <div class="field"><label>Calories (kcal)</label><input class="input-x" name="kcal" inputmode="numeric" required placeholder="650" value="${v('kcal')}"></div>
      <div class="field"><label>Protein (g)</label><input class="input-x" name="protein" inputmode="decimal" placeholder="40" value="${v('protein')}"></div>
      <div class="field"><label>Carbs (g)</label><input class="input-x" name="carbs" inputmode="decimal" placeholder="optional" value="${v('carbs')}"></div>
      <div class="field"><label>Fat (g)</label><input class="input-x" name="fat" inputmode="decimal" placeholder="optional" value="${v('fat')}"></div>
    </div>
    <div class="field"><label>Day</label>${dateField('date', m ? m.date : dayKey(), { past: true })}</div>
    <div class="btn-row"><button class="btn">${m ? 'Save changes' : 'Save meal'}</button>${deleteBtn(m?.id)}</div>
  </form>`;
};

sheets.sleep = ({ id }) => {
  const s = id && byId(id);
  return `<h2>${s ? 'Edit sleep' : 'Log sleep'} ${closeBtn}</h2>
  <form data-form="sleep" class="nice-form">
    <input type="hidden" name="id" value="${s ? s.id : ''}">
    <div class="row2">
      <div class="field"><label>Went to bed</label><input class="input-x" type="time" name="bed" value="${s ? esc(s.bed) : '23:00'}" required></div>
      <div class="field"><label>Woke up</label><input class="input-x" type="time" name="wake" value="${s ? esc(s.wake) : '07:00'}" required></div>
    </div>
    <div class="field"><label>Woke up on</label>${dateField('date', s ? s.date : dayKey(), { past: true })}</div>
    <div class="sleep-preview" id="sleep-preview"></div>
    <div class="btn-row"><button class="btn">${s ? 'Save changes' : 'Save sleep'}</button>${deleteBtn(s?.id)}</div>
  </form>`;
};

sheets.weight = ({ id }) => {
  const w = id && byId(id);
  return `<h2>${w ? 'Edit weigh-in' : 'Weigh-in'} ${closeBtn}</h2>
  <form data-form="weight" class="nice-form">
    <input type="hidden" name="id" value="${w ? w.id : ''}">
    <div class="field"><label>Weight (kg)</label><input class="input-x" name="kg" inputmode="decimal" required value="${w ? w.kg : weights().at(-1)?.kg ?? ''}" placeholder="72.4"></div>
    <div class="field"><label>Date</label>${dateField('date', w ? w.date : dayKey(), { past: true })}</div>
    <p class="note">Tip: weigh in the morning, after the bathroom, before eating.</p>
    <div class="btn-row"><button class="btn">${w ? 'Save changes' : 'Save weigh-in'}</button>${deleteBtn(w?.id)}</div>
  </form>`;
};

sheets.welcome = () => `<div class="welcome">
    <img src="icons/icon-192.png" alt="" width="84" height="84">
    <h2 class="center">Welcome to Loop</h2>
    <p class="note center">Your gym, diet, sleep and habits in one place. Everything stays on this iPhone.</p>
    <ul class="welcome-list">
      <li>${tile('medical', 'move')}A health profile your specialists read: height, age and every health check</li>
      <li>${tile('dumbbell', 'school')}Follow a gym routine with smart weight suggestions</li>
      <li>${tile('chart', 'diet')}Watch your progress as soft line charts</li>
      <li>${tile('cloud', 'work')}Back up to iCloud Drive from Settings</li>
    </ul>
    <button class="btn" data-act="sheet" data-sheet="profile" data-onboard="1">Set up my health profile</button>
    <button class="btn ghost" data-act="finishWelcome">Skip for now</button>
  </div>`;

previews.sleep = form => {
  const el = document.getElementById('sleep-preview');
  const h = sleepHours(form.elements.bed.value, form.elements.wake.value);
  if (el) el.innerHTML = h ? `${icon('moon')} ${fmtHours(h)} of sleep` : '';
};

// ---------- actions ----------
export async function deleteWithUndo(id) {
  const entry = await removeEntry(id);
  if (!entry) return;
  haptic();
  render();
  const what = { meal: 'Meal', sleep: 'Sleep', weight: 'Weigh-in', check: 'Health check' }[entry.type] ?? 'Entry';
  toast(`${what} deleted`, { icon: 'trash', action: { label: 'Undo', run: async () => { await putEntry(entry); render(); } } });
}

export async function setWater(target) {
  const t = dayKey();
  let current = waterOn(t);
  target = Math.max(0, target);
  const was = current;
  while (current < target) { await addEntry('water', { amount: 1 }, t); current++; }
  while (current > target) {
    const last = of('water', t).at(-1);
    if (!last) break;
    await removeEntry(last.id);
    current--;
  }
  haptic();
  // The number wobbles and each glass just filled sloshes up from the bottom.
  ui.pulse = ['[data-pulse="water"]', ...Array.from({ length: Math.max(0, target - was) }, (_, i) => `.drop[data-n="${was + i + 1}"]`)].join(', ');
  render();
  if (target === goals().water) toast('Water goal reached', { icon: 'drop' });
}

Object.assign(actions, {
  async water(el) {
    await setWater(waterOn(dayKey()) + Number(el.dataset.n));
    if (el.dataset.close) { closeSheet(); toast('+1 glass of water', { icon: 'drop' }); }
  },
  waterSet: el => {
    const n = Number(el.dataset.n);
    return setWater(n === waterOn(dayKey()) ? n - 1 : n);
  },
  del: el => deleteWithUndo(el.dataset.id),
  async delFromSheet(el) {
    closeSheet();
    await deleteWithUndo(el.dataset.id);
  },
  recent(el) {
    const m = byId(el.dataset.id);
    const f = sheetForm('meal');
    if (!m || !f) return;
    ['name', 'kcal', 'protein', 'carbs', 'fat'].forEach(k => { f.elements[k].value = m[k] || ''; });
    haptic();
  },
  finishWelcome: () => closeSheet(),
});

Object.assign(forms, {
  async meal(f) {
    const kcal = num(f.get('kcal'));
    if (!kcal) return toast('Add the calories', { icon: 'info' });
    const fields = {
      name: String(f.get('name')).trim(),
      kcal, protein: num(f.get('protein')), carbs: num(f.get('carbs')), fat: num(f.get('fat')),
    };
    const date = readDate(f, 'date') || dayKey();
    const id = f.get('id');
    if (id) await updateEntry(id, { ...fields, date });
    else await addEntry('meal', fields, date);
    haptic();
    closeSheet();
    toast(id ? 'Meal updated' : `${fields.name} saved`, { icon: 'diet' });
    render();
  },
  async sleep(f) {
    const bed = String(f.get('bed')), wake = String(f.get('wake'));
    const hours = sleepHours(bed, wake);
    const date = readDate(f, 'date') || dayKey();
    if (f.get('id')) await removeEntry(f.get('id'));
    // One main sleep per morning: replace an existing log for that date.
    for (const e of of('sleep', date)) await removeEntry(e.id);
    await addEntry('sleep', { bed, wake, hours }, date);
    haptic();
    closeSheet();
    toast(`${fmtHours(hours)} of sleep saved`, { icon: 'moon' });
    render();
  },
  async weight(f) {
    const kg = num(f.get('kg'));
    if (kg < 20 || kg > 300) return toast('Check the weight', { icon: 'info' });
    const date = readDate(f, 'date') || dayKey();
    if (f.get('id')) await removeEntry(f.get('id'));
    for (const e of of('weight', date)) await removeEntry(e.id);
    await addEntry('weight', { kg: Math.round(kg * 10) / 10 }, date);
    haptic();
    closeSheet();
    toast('Weigh-in saved', { icon: 'scale' });
    render();
  },
});
