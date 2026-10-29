// Health: diet, sleep and body tabs (the overview lives in overview.js, gym in gym.js), plus their logging sheets.
import { state, addEntry, updateEntry, putEntry, removeEntry, setKV } from './store.js';
import { esc, dayKey, lastDays, longDate, dayLabel, fmt, fmtHours, timeOf, time12, avgLogged, sum, num } from './util.js';
import { icon, tile } from './icons.js';
import { screens, sheets, actions, forms, previews, ui, render, openSheet, closeSheet, toast, haptic, closeBtn, header, seg, sheetForm, dateField, readDate } from './core.js';
import { goals, of, byId, waterOn, sleepOn, weights, weeklyRate, bulkStatus, macroTargets, maintenanceKcal, sleepHours, recentMeals } from './data.js';
import { gymTab } from './gym.js';
import { overviewTab, overviewHeader } from './overview.js';
import { sleepAnalytics, bodyAnalytics } from './analytics.js';
import { dietAnalytics } from './diet-analytics.js';
import { gymAnalytics } from './gym-analytics.js';

export function mealRow(m) {
  return `<div class="row tap" data-act="sheet" data-sheet="meal" data-id="${m.id}" role="button">
    <div class="time">${m.time ? time12(m.time) : timeOf(m.ts)}</div><div class="bar" style="background:var(--diet)"></div>
    <div class="grow"><div class="t">${esc(m.name)}</div><div class="d">${fmt(m.kcal)} kcal${m.protein ? ` · ${fmt(m.protein)} g protein` : ''}</div></div>
    <button class="x-btn" data-act="del" data-id="${m.id}" aria-label="Delete">${icon('close')}</button></div>`;
}

function renderHealth() {
  const tab = ui.tab.health ?? 'overview';
  const body = { overview: overviewTab, gym: () => gymTab(gymAnalytics()), diet: healthDiet, sleep: healthSleep, body: healthBody }[tab]();
  const top = tab === 'overview' ? overviewHeader() : header('Health', longDate());
  return `${top}${seg('health', [['overview', 'Overview'], ['gym', 'Gym'], ['diet', 'Diet'], ['sleep', 'Sleep'], ['body', 'Body']], tab)}${body}`;
}
screens.health = renderHealth;

function healthDiet() {
  const g = goals();
  const t = dayKey();
  const meals = of('meal', t);
  const [p, c, f] = ['protein', 'carbs', 'fat'].map(k => sum(meals, k));
  const targets = macroTargets(g);
  // Today first, because that's what you came to log; the report reads the weeks behind it.
  return `
  <section class="card glass">
    <div class="money-top"><div><div class="label-sm">Eaten today</div><div class="big-xl">${fmt(sum(meals, 'kcal'))}<small>of ${fmt(g.kcal)} kcal</small></div></div>
      <button class="pill-btn" data-act="sheet" data-sheet="meal">${icon('plus')} Meal</button></div>
    <div class="macro-bars">
      ${macroBar('Protein', p, g.protein, 'var(--move)')}
      ${macroBar('Carbs', c, targets.carbs, 'var(--school)')}
      ${macroBar('Fat', f, targets.fat, 'var(--diet)')}
    </div>
  </section>
  ${dietAnalytics()}
  ${lastDays(7).reverse().map(d => {
    const ms = of('meal', d);
    if (!ms.length) return '';
    return `<div class="section-label">${dayLabel(d)} <span>${fmt(sum(ms, 'kcal'))} kcal · ${fmt(sum(ms, 'protein'))} g P</span></div><section class="card glass"><div class="list">${ms.map(mealRow).join('')}</div></section>`;
  }).join('')}`;
}

function macroBar(label, value, goal, color) {
  return `<div class="macro"><span>${label}</span><div class="track"><div class="fill" style="width:${Math.min(100, (value / goal) * 100)}%;background:${color}"></div></div><b>${fmt(value)} / ${fmt(goal)} g</b></div>`;
}

function healthSleep() {
  const recent = of('sleep').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
  return `${sleepAnalytics()}
  ${recent.length ? `<div class="section-label">Nights</div><section class="card glass"><div class="list">${recent.map(s => `
    <div class="row tap" data-act="sheet" data-sheet="sleep" data-id="${s.id}" role="button"><div class="bar" style="background:var(--sleep)"></div><div class="grow"><div class="t">${dayLabel(s.date)}</div><div class="d">${esc(s.bed)} → ${esc(s.wake)}</div></div>
    <div class="amt">${fmtHours(s.hours)}</div><button class="x-btn" data-act="del" data-id="${s.id}" aria-label="Delete">${icon('close')}</button></div>`).join('')}</div></section>` : ''}`;
}

function healthBody() {
  const ws = weights();
  return `
  ${bodyAnalytics()}
  ${ws.length ? `<div class="section-label">Weigh-ins</div><section class="card glass"><div class="list">${ws.slice().reverse().slice(0, 20).map(w => `
    <div class="row tap" data-act="sheet" data-sheet="weight" data-id="${w.id}" role="button"><div class="bar" style="background:var(--move)"></div><div class="grow"><div class="t">${dayLabel(w.date)}</div></div>
    <div class="amt">${w.kg} kg</div><button class="x-btn" data-act="del" data-id="${w.id}" aria-label="Delete">${icon('close')}</button></div>`).join('')}</div></section>` : ''}`;
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

sheets.calc = () => {
  const p = { sex: 'male', age: 20, height: 175, activity: '1.55', pace: '400', ...state.kv.profile };
  const kg = weights().at(-1)?.kg ?? p.weight ?? 70;
  const opt = (val, cur, label) => `<option value="${val}" ${String(cur) === val ? 'selected' : ''}>${label}</option>`;
  return `<h2>Bulk calculator ${closeBtn}</h2>
  <form data-form="calc">
    <div class="seg wide radio">
      <label><input type="radio" name="sex" value="male" ${p.sex === 'male' ? 'checked' : ''}>Male</label>
      <label><input type="radio" name="sex" value="female" ${p.sex === 'female' ? 'checked' : ''}>Female</label>
    </div>
    <div class="row3">
      <div class="field"><label>Age</label><input class="input-x" name="age" inputmode="numeric" value="${p.age}" required></div>
      <div class="field"><label>Height (cm)</label><input class="input-x" name="height" inputmode="numeric" value="${p.height}" required></div>
      <div class="field"><label>Weight (kg)</label><input class="input-x" name="weight" inputmode="decimal" value="${kg}" required></div>
    </div>
    <div class="field"><label>How active are you?</label><select class="input-x" name="activity">
      ${opt('1.375', p.activity, 'Light: gym 1–3 days a week')}${opt('1.55', p.activity, 'Moderate: gym 3–5 days a week')}${opt('1.725', p.activity, 'Very active: 6–7 days or a physical job')}
    </select></div>
    <div class="field"><label>Bulk pace</label><select class="input-x" name="pace">
      ${opt('250', p.pace, 'Lean: +250 kcal a day')}${opt('400', p.pace, 'Standard: +400 kcal a day')}${opt('600', p.pace, 'Fast: +600 kcal a day')}
    </select></div>
    <div class="calc-result" id="calc-result"></div>
    <button class="btn">Use these goals</button>
  </form>`;
};

sheets.welcome = () => `<div class="welcome">
    <img src="icons/icon-192.png" alt="" width="84" height="84">
    <h2 class="center">Welcome to Loop</h2>
    <p class="note center">Your gym, diet, sleep and habits in one place. Everything stays on this iPhone.</p>
    <ul class="welcome-list">
      <li>${tile('target', 'move')}Set calorie and protein goals for your bulk</li>
      <li>${tile('dumbbell', 'school')}Follow a gym routine with smart weight suggestions</li>
      <li>${tile('chart', 'diet')}Watch your progress as soft line charts</li>
      <li>${tile('cloud', 'work')}Back up to iCloud Drive from Settings</li>
    </ul>
    <button class="btn" data-act="sheet" data-sheet="calc">Set my bulk goals</button>
    <button class="btn ghost" data-act="finishWelcome">Skip for now</button>
  </div>`;

export function calcGoals(f) {
  const n = k => num(f.get(k));
  const weight = n('weight');
  // Maintenance plus a bulking surplus.
  const maintenance = maintenanceKcal({ sex: f.get('sex'), age: n('age'), height: n('height'), activity: f.get('activity') }, weight);
  if (maintenance == null) return null;
  const kcal = Math.round((maintenance + Number(f.get('pace'))) / 50) * 50;
  const protein = Math.round((weight * 2) / 5) * 5; // ~2 g per kg
  return { maintenance: Math.round(maintenance / 10) * 10, kcal, protein };
}

previews.calc = form => {
  const r = calcGoals(new FormData(form));
  const el = document.getElementById('calc-result');
  if (el) el.innerHTML = r
    ? `<div><span>Maintenance</span><b>${fmt(r.maintenance)} kcal</b></div><div><span>Bulk target</span><b>${fmt(r.kcal)} kcal</b></div><div><span>Protein</span><b>${r.protein} g</b></div>`
    : '<div><span>Fill in your details</span></div>';
};
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
  const what = { meal: 'Meal', sleep: 'Sleep', weight: 'Weigh-in' }[entry.type] ?? 'Entry';
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
  async calc(f) {
    const r = calcGoals(f);
    if (!r) return toast('Check your details', { icon: 'info' });
    await setKV('profile', { sex: f.get('sex'), age: num(f.get('age')), height: num(f.get('height')), weight: num(f.get('weight')), activity: f.get('activity'), pace: f.get('pace') });
    await setKV('goals', { ...goals(), kcal: r.kcal, protein: r.protein });
    await setKV('onboarded', true);
    haptic();
    closeSheet();
    toast(`${fmt(r.kcal)} kcal · ${r.protein} g protein`, { icon: 'target' });
    render();
  },
});
