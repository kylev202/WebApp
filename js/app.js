import { state, openStore, addEntry, updateEntry, putEntry, removeEntry, setKV, exportData, importData, eraseAll } from './store.js';
import { lineChart, sparkline } from './charts.js';

const VERSION = '1.1.0';
const DEFAULT_GOALS = { kcal: 3000, protein: 160, water: 8, sleep: 8 };
const DEFAULT_HABITS = [
  { id: 'gym', name: 'Gym', emoji: '🏋️' },
  { id: 'protein', name: 'Protein', emoji: '🥛' },
  { id: 'study', name: 'Study', emoji: '📚' },
  { id: 'bed', name: 'Bed by 11', emoji: '🌙' },
];
const C = { diet: 'var(--diet)', move: 'var(--move)', sleep: 'var(--sleep)', work: 'var(--work)' };
const TITLES = { today: 'Today', health: 'Health', plan: 'Plan', money: 'Money', settings: 'Settings' };
const WEEK = 7 * 24 * 3600 * 1000;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ui = { route: 'today', healthTab: 'diet', sheet: null, params: {}, pulse: null };
const main = document.getElementById('main');
const sheetEl = document.getElementById('sheet');
const toastEl = document.getElementById('toast');

// ---------- helpers ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toDate = key => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (key, n) => { const d = toDate(key); d.setDate(d.getDate() + n); return dayKey(d); };
const lastDays = n => Array.from({ length: n }, (_, i) => addDays(dayKey(), i - (n - 1)));
const fmt = n => Math.round(n).toLocaleString('en-AU');
const fmtHours = h => { const m = Math.round(h * 60); return `${Math.floor(m / 60)}h ${pad(m % 60)}m`; };
const dayLabel = key => {
  const today = dayKey();
  if (key === today) return 'Today';
  if (key === addDays(today, -1)) return 'Yesterday';
  return toDate(key).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
};
const shortDate = key => toDate(key).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
const initial = key => toDate(key).toLocaleDateString('en-AU', { weekday: 'narrow' });
const timeOf = ts => new Date(ts).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
const mean = xs => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
const avgLogged = values => { const v = values.filter(Boolean); return v.length ? mean(v) : 0; };

const goals = () => ({ ...DEFAULT_GOALS, ...state.kv.goals });
const habits = () => state.kv.habits ?? DEFAULT_HABITS;
const of = (type, date) => state.entries.filter(e => e.type === type && (date == null || e.date === date)).sort((a, b) => a.ts - b.ts);
const sum = (list, field) => list.reduce((t, e) => t + (Number(e[field]) || 0), 0);
const kcalOn = d => sum(of('meal', d), 'kcal');
const waterOn = d => sum(of('water', d), 'amount');
const sleepOn = d => sum(of('sleep', d), 'hours');
const weights = () => of('weight').sort((a, b) => a.date.localeCompare(b.date) || a.ts - b.ts);
const habitDone = (id, d) => state.entries.some(e => e.type === 'habit' && e.habitId === id && e.date === d);
const anyLogOn = d => state.entries.some(e => e.date === d);

// Consecutive days ending today (or yesterday, if today isn't done yet).
function streak(test) {
  let d = dayKey();
  if (!test(d)) d = addDays(d, -1);
  let n = 0;
  while (test(d)) { n++; d = addDays(d, -1); }
  return n;
}

// Weight trend over the last 4 weeks (least squares), in kg per week.
function weeklyRate() {
  const ws = weights().filter(w => w.date >= addDays(dayKey(), -28));
  if (ws.length < 2) return null;
  const xs = ws.map(w => (toDate(w.date) - toDate(ws[0].date)) / 864e5);
  if (xs.at(-1) < 6) return null;
  const ys = ws.map(w => w.kg), mx = mean(xs), my = mean(ys);
  const slope = xs.reduce((t, x, i) => t + (x - mx) * (ys[i] - my), 0) / xs.reduce((t, x) => t + (x - mx) ** 2, 0);
  return slope * 7;
}
// Lean bulk: gain about 0.25–0.5% of body weight per week.
function bulkStatus(rate, kg) {
  const lo = kg * 0.0025, hi = kg * 0.005;
  if (rate < lo) return { text: 'Gaining slowly: eat a little more', color: 'var(--school-ink)' };
  if (rate > hi) return { text: 'Faster than a lean bulk', color: 'var(--move-ink)' };
  return { text: 'On track for a lean bulk', color: 'var(--diet-ink)' };
}

const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

// iOS Safari has no vibrate API, but toggling a native switch gives a light haptic tap.
const hapticSwitch = (() => {
  const label = document.createElement('label');
  label.className = 'haptic';
  label.ariaHidden = 'true';
  label.innerHTML = '<input type="checkbox" switch tabindex="-1">';
  document.body.append(label);
  return label;
})();
function haptic() {
  try {
    if (navigator.vibrate) navigator.vibrate(8);
    else hapticSwitch.click();
  } catch { /* haptics are best-effort */ }
}

function toast(msg, action) {
  toastEl.innerHTML = `<span>${esc(msg)}</span>${action ? `<button class="toast-act" data-act="toastAction">${esc(action.label)}</button>` : ''}`;
  toastEl.classList.toggle('has-action', !!action);
  toast.run = action?.run;
  toastEl.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => toastEl.classList.remove('show'), action ? 4500 : 1800);
}

// ---------- screens ----------
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function header(title, sub, right = '') {
  return `<header><div class="grow"><div class="date">${sub}</div><h1>${title}</h1></div>${right}</header>`;
}

const gearIcon = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>`;

function renderToday() {
  const t = dayKey();
  const g = goals();
  const meals = of('meal', t);
  const kcal = sum(meals, 'kcal');
  const protein = sum(meals, 'protein');
  const water = waterOn(t);
  const sleep = sleepOn(t);
  const ws = weights();
  const latestW = ws.at(-1);
  const rate = weeklyRate();
  const days = lastDays(7);
  const logStreak = streak(anyLogOn);
  const pct = (v, goal) => (v ? (v / goal) * 100 : null);

  let banners = '';
  if (!isStandalone() && !state.kv.installHintDismissed) {
    banners += `<section class="card glass banner"><div class="spark-ico">📲</div>
      <p>Add Loop to your Home Screen so your data stays safe: tap <b>Share</b> → <b>Add to Home Screen</b>, then open it from the icon.</p>
      <button class="x-btn" data-act="dismissInstall" aria-label="Dismiss">✕</button></section>`;
  }
  const lastBackup = state.kv.lastBackup ?? 0;
  if (state.entries.length && Date.now() - lastBackup > WEEK) {
    banners += `<section class="card glass banner"><div class="spark-ico">☁️</div>
      <p>${lastBackup ? 'Last backup was over a week ago.' : 'You haven’t backed up yet.'} Save a copy to iCloud Drive.</p>
      <button class="pill-btn" data-act="backup">Back up</button></section>`;
  }

  const kcalLeft = g.kcal - kcal;
  const yesterdayMeals = of('meal', addDays(t, -1));
  const dateLine = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })
    + (logStreak >= 2 ? ` · <span class="streak">🔥 ${logStreak} days</span>` : '');

  return `
  ${header(greeting(), dateLine, `<button class="icon-btn glass" data-act="nav" data-to="settings" aria-label="Settings">${gearIcon}</button>`)}
  ${banners}

  <section class="card glass tap" data-act="nav" data-to="health">
    <div class="head"><div class="title">This Week</div><div class="sub-note">% of goal ›</div></div>
    <div class="stats">
      <div class="stat"><div class="l"><span class="dot" style="background:var(--diet)"></span>Eat</div><div class="v">${avgLogged(days.map(kcalOn)) ? fmt(avgLogged(days.map(kcalOn))) : '–'}<span> avg</span></div></div>
      <div class="stat"><div class="l"><span class="dot" style="background:var(--sleep)"></span>Sleep</div><div class="v">${avgLogged(days.map(sleepOn)) ? fmtHours(avgLogged(days.map(sleepOn))) : '–'}<span> avg</span></div></div>
      <div class="stat"><div class="l"><span class="dot" style="background:var(--work)"></span>Water</div><div class="v">${avgLogged(days.map(waterOn)) ? avgLogged(days.map(waterOn)).toFixed(1) : '–'}<span> / ${g.water}</span></div></div>
    </div>
    ${lineChart({
      series: [
        { values: days.map(d => pct(kcalOn(d), g.kcal)), color: C.diet },
        { values: days.map(d => pct(sleepOn(d), g.sleep)), color: C.sleep },
        { values: days.map(d => pct(waterOn(d), g.water)), color: C.work },
      ],
      labels: days.map((d, i) => (i === 6 ? 'Today' : initial(d))),
      max: 130, goal: 100, live: true,
      empty: 'Log meals, water and sleep to see your week here.',
    })}
  </section>

  <div class="grid">
    <section class="card glass w tap" data-act="sheet" data-sheet="meal">
      <div class="head"><div class="title"><div class="ico" style="background:var(--diet-bg)">🥗</div>Diet</div><div class="chev">＋</div></div>
      <div class="big">${kcalLeft > 0 ? fmt(kcalLeft) : fmt(kcal)}<small>${kcalLeft > 0 ? 'kcal to go' : 'kcal'}</small></div>
      <div class="sub">${kcalLeft > 0 ? `Protein ${fmt(protein)} / ${g.protein} g` : '🎉 Calorie goal hit'}</div>
      <div class="track"><div class="fill" style="width:${Math.min(100, (kcal / g.kcal) * 100)}%;background:var(--diet)"></div></div>
    </section>
    <section class="card glass w tap" data-act="sheet" data-sheet="sleep">
      <div class="head"><div class="title"><div class="ico" style="background:var(--sleep-bg)">🌙</div>Sleep</div><div class="chev">＋</div></div>
      <div class="big">${sleep ? fmtHours(sleep) : '–'}</div>
      <div class="sub">${sleep ? `${sleep >= g.sleep ? '✓ ' : ''}Goal ${g.sleep}h` : 'Tap to log last night'}</div>
      ${sparkline(lastDays(7).map(d => sleepOn(d) || null), C.sleep)}
    </section>
    <section class="card glass w">
      <div class="head"><div class="title"><div class="ico" style="background:var(--work-bg)">💧</div>Water</div></div>
      <div class="big" data-pulse="water">${fmt(water)}<small>of ${g.water} glasses</small></div>
      <div class="drops">${Array.from({ length: g.water }, (_, i) =>
        `<button class="drop ${i < water ? 'on' : ''}" data-act="waterSet" data-n="${i + 1}" aria-label="${i + 1} glasses"></button>`).join('')}</div>
      <div class="water-ctrl"><button class="mini" data-act="water" data-n="-1" aria-label="Remove a glass">−</button><button class="mini" data-act="water" data-n="1" aria-label="Add a glass">＋</button></div>
    </section>
    <section class="card glass w tap" data-act="sheet" data-sheet="weight">
      <div class="head"><div class="title"><div class="ico" style="background:var(--move-bg)">⚖️</div>Weight</div><div class="chev">＋</div></div>
      <div class="big">${latestW ? latestW.kg : '–'}<small>kg</small></div>
      <div class="sub" ${rate != null && latestW ? `style="color:${bulkStatus(rate, latestW.kg).color}"` : ''}>${rate != null ? `${rate >= 0 ? '+' : '−'}${Math.abs(rate).toFixed(2)} kg / week` : latestW ? 'Weigh in weekly for a trend' : 'Tap to log a weigh-in'}</div>
      ${sparkline(ws.filter(w => w.date >= addDays(t, -30)).map(w => w.kg), C.move)}
    </section>
  </div>

  <div class="section-label">Habits <a data-act="nav" data-to="settings">Edit</a></div>
  <section class="card glass">
    <div class="habits">${habits().map(h => {
      const on = habitDone(h.id, t);
      const s = streak(d => habitDone(h.id, d));
      return `<button class="habit ${on ? 'on' : ''}" data-act="habit" data-id="${esc(h.id)}" aria-pressed="${on}"><div class="c">${esc(h.emoji)}</div>${esc(h.name)}<span class="s">${s ? `🔥 ${s}` : '&nbsp;'}</span></button>`;
    }).join('')}</div>
  </section>

  <div class="section-label">Today’s food${meals.length ? ` <span>${fmt(kcal)} kcal · ${fmt(protein)} g P</span>` : ''} <a data-act="sheet" data-sheet="meal">Add</a></div>
  <section class="card glass">
    ${meals.length ? `<div class="list">${meals.map(mealRow).join('')}</div>`
      : `<div class="empty">Nothing logged yet today.</div>${yesterdayMeals.length
        ? `<button class="btn soft" data-act="repeatYesterday">↻ Repeat yesterday’s ${yesterdayMeals.length} meal${yesterdayMeals.length > 1 ? 's' : ''}</button>` : ''}`}
  </section>`;
}

function mealRow(m) {
  return `<div class="row tap" data-act="sheet" data-sheet="meal" data-id="${m.id}" role="button">
    <div class="time">${timeOf(m.ts)}</div><div class="bar" style="background:var(--diet)"></div>
    <div class="grow"><div class="t">${esc(m.name)}</div><div class="d">${fmt(m.kcal)} kcal${m.protein ? ` · ${fmt(m.protein)} g protein` : ''}</div></div>
    <button class="x-btn" data-act="del" data-id="${m.id}" aria-label="Delete">✕</button></div>`;
}

function renderHealth() {
  const tab = ui.healthTab;
  const seg = ['diet', 'sleep', 'body'].map(k =>
    `<button class="${tab === k ? 'on' : ''}" data-act="healthTab" data-tab="${k}">${{ diet: 'Diet', sleep: 'Sleep', body: 'Body' }[k]}</button>`).join('');
  const body = { diet: healthDiet, sleep: healthSleep, body: healthBody }[tab]();
  return `${header('Health', 'Diet · Sleep · Body')}<div class="seg wide" style="--i:${['diet', 'sleep', 'body'].indexOf(tab)}">${seg}</div>${body}`;
}

const sparseLabels = days => days.map((d, i) => (i === days.length - 1 ? 'Today' : i % 3 === 1 ? toDate(d).getDate() : ''));

function healthDiet() {
  const g = goals();
  const t = dayKey();
  const meals = of('meal', t);
  const days14 = lastDays(14);
  const [p, c, f] = ['protein', 'carbs', 'fat'].map(k => sum(meals, k));
  const targets = macroTargets(g);
  return `
  <section class="card glass">
    <div class="money-top"><div><div class="label-sm">Eaten today</div><div class="big-xl">${fmt(sum(meals, 'kcal'))}<small>of ${fmt(g.kcal)} kcal</small></div></div>
      <button class="pill-btn" data-act="sheet" data-sheet="meal">＋ Meal</button></div>
    <div class="macro-bars">
      ${macroBar('Protein', p, g.protein, 'var(--move)')}
      ${macroBar('Carbs', c, targets.carbs, 'var(--school)')}
      ${macroBar('Fat', f, targets.fat, 'var(--diet)')}
    </div>
  </section>
  <section class="card glass">
    <div class="head"><div class="title">Calories · 14 days</div><div class="sub-note">dashed = goal</div></div>
    ${lineChart({ series: [{ values: days14.map(d => kcalOn(d) || null), color: C.diet }], labels: sparseLabels(days14), goal: g.kcal, live: true, empty: 'Your calorie line appears after you log meals.' })}
  </section>
  ${lastDays(7).reverse().map(d => {
    const ms = of('meal', d);
    if (!ms.length) return '';
    return `<div class="section-label">${dayLabel(d)} <span>${fmt(sum(ms, 'kcal'))} kcal · ${fmt(sum(ms, 'protein'))} g P</span></div><section class="card glass"><div class="list">${ms.map(mealRow).join('')}</div></section>`;
  }).join('')}`;
}

// Bulking split: protein from goals, fat ~25% of calories, carbs fill the rest.
function macroTargets(g) {
  const fat = Math.round((g.kcal * 0.25) / 9);
  return { fat, carbs: Math.max(0, Math.round((g.kcal - g.protein * 4 - fat * 9) / 4)) };
}

function macroBar(label, value, goal, color) {
  return `<div class="macro"><span>${label}</span><div class="track"><div class="fill" style="width:${Math.min(100, (value / goal) * 100)}%;background:${color}"></div></div><b>${fmt(value)} / ${fmt(goal)} g</b></div>`;
}

function healthSleep() {
  const g = goals();
  const days14 = lastDays(14);
  const recent = of('sleep').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
  const a = avgLogged(lastDays(7).map(sleepOn));
  return `
  <section class="card glass">
    <div class="money-top"><div><div class="label-sm">7-day average</div><div class="big-xl">${a ? fmtHours(a) : '–'}<small>goal ${g.sleep}h</small></div></div>
      <button class="pill-btn" data-act="sheet" data-sheet="sleep">＋ Sleep</button></div>
    ${lineChart({ series: [{ values: days14.map(d => sleepOn(d) || null), color: C.sleep }], labels: sparseLabels(days14), max: Math.max(g.sleep + 2, ...days14.map(sleepOn)), goal: g.sleep, empty: 'Log a night of sleep to start your chart.' })}
  </section>
  ${recent.length ? `<div class="section-label">Nights</div><section class="card glass"><div class="list">${recent.map(s => `
    <div class="row tap" data-act="sheet" data-sheet="sleep" data-id="${s.id}" role="button"><div class="bar" style="background:var(--sleep)"></div><div class="grow"><div class="t">${dayLabel(s.date)}</div><div class="d">${esc(s.bed)} → ${esc(s.wake)}</div></div>
    <div class="amt">${fmtHours(s.hours)}</div><button class="x-btn" data-act="del" data-id="${s.id}" aria-label="Delete">✕</button></div>`).join('')}</div></section>` : ''}`;
}

function healthBody() {
  const ws = weights();
  const recent = ws.slice(-60);
  const latest = ws.at(-1);
  const rate = weeklyRate();
  const status = rate != null && latest ? bulkStatus(rate, latest.kg) : null;
  return `
  <section class="card glass">
    <div class="money-top"><div><div class="label-sm">Body weight</div><div class="big-xl">${latest ? latest.kg : '–'}<small>kg</small></div></div>
      <button class="pill-btn" data-act="sheet" data-sheet="weight">＋ Weigh-in</button></div>
    ${lineChart({ series: [{ values: recent.map(w => w.kg), color: C.move }], labels: recent.map((w, i) => (i === 0 || i === recent.length - 1 ? shortDate(w.date) : '')), min: Math.min(...recent.map(w => w.kg)) - 1, max: Math.max(...recent.map(w => w.kg)) + 1, empty: 'Weigh in to track your bulk.' })}
  </section>
  ${latest ? `<section class="card glass rate">
    <div><div class="label-sm">Trend · last 4 weeks</div><div class="big-md">${rate != null ? `${rate >= 0 ? '+' : '−'}${Math.abs(rate).toFixed(2)} kg/week` : '–'}</div></div>
    <p class="note" style="margin:6px 0 0">${status ? `<b style="color:${status.color}">${status.text}.</b> ` : 'Weigh in at least weekly for 2 weeks to see your trend. '}Lean bulk target: ${(latest.kg * 0.0025).toFixed(2)}–${(latest.kg * 0.005).toFixed(2)} kg/week.</p>
  </section>` : ''}
  ${ws.length ? `<div class="section-label">Weigh-ins</div><section class="card glass"><div class="list">${ws.slice().reverse().slice(0, 20).map(w => `
    <div class="row tap" data-act="sheet" data-sheet="weight" data-id="${w.id}" role="button"><div class="bar" style="background:var(--move)"></div><div class="grow"><div class="t">${dayLabel(w.date)}</div></div>
    <div class="amt">${w.kg} kg</div><button class="x-btn" data-act="del" data-id="${w.id}" aria-label="Delete">✕</button></div>`).join('')}</div></section>` : ''}`;
}

function renderSoon(title, emoji, text) {
  return `${header(title, 'Coming soon')}
  <section class="card glass soon"><div class="soon-e">${emoji}</div><p>${text}</p></section>`;
}

function renderSettings() {
  const g = goals();
  const lastBackup = state.kv.lastBackup;
  return `${header('Settings', 'Loop', '<button class="pill-btn" data-act="nav" data-to="today">Done</button>')}
  <section class="card glass brand"><img src="icons/icon-192.png" alt="" width="52" height="52"><div><div class="t">Loop</div><div class="d">Version ${VERSION} · data stays on this iPhone</div></div></section>

  <div class="section-label">Daily goals</div>
  <form class="card glass" data-form="goals">
    <button type="button" class="btn soft calc-btn" data-act="sheet" data-sheet="calc">🧮 Calculate for my bulk</button>
    <div class="row2">
      <div class="field"><label>Calories (kcal)</label><input class="input-x" name="kcal" inputmode="numeric" value="${g.kcal}"></div>
      <div class="field"><label>Protein (g)</label><input class="input-x" name="protein" inputmode="numeric" value="${g.protein}"></div>
      <div class="field"><label>Water (glasses)</label><input class="input-x" name="water" inputmode="numeric" value="${g.water}"></div>
      <div class="field"><label>Sleep (hours)</label><input class="input-x" name="sleep" inputmode="decimal" value="${g.sleep}"></div>
    </div>
    <button class="btn">Save goals</button>
  </form>

  <div class="section-label">Habits</div>
  <section class="card glass">
    <div class="list">${habits().map(h => `<div class="row"><div class="ico big-ico">${esc(h.emoji)}</div><div class="grow"><div class="t">${esc(h.name)}</div></div>
      <button class="x-btn" data-act="delHabit" data-id="${esc(h.id)}" aria-label="Remove habit">✕</button></div>`).join('')}</div>
    <form class="add-habit" data-form="habit">
      <input class="input-x emoji-in" name="emoji" placeholder="✅" maxlength="4" aria-label="Emoji">
      <input class="input-x" name="name" placeholder="New habit" required maxlength="20" aria-label="Habit name">
      <button class="pill-btn">Add</button>
    </form>
  </section>

  <div class="section-label">Backup</div>
  <section class="card glass">
    <p class="note">Your data lives only on this iPhone. Save a backup to <b>iCloud Drive</b> weekly: tap Back up → <b>Save to Files</b> → iCloud Drive.</p>
    <p class="note">Last backup: <b>${lastBackup ? new Date(lastBackup).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }) : 'never'}</b></p>
    <div class="row2"><button class="btn" data-act="backup">Back up</button><button class="btn soft" data-act="restore">Restore</button></div>
    <p class="note" id="persist-note" style="margin:10px 0 0"></p>
  </section>

  <div class="section-label">Danger zone</div>
  <section class="card glass"><button class="btn danger" data-act="erase">Erase all data</button></section>`;
}

const screens = {
  today: renderToday,
  health: renderHealth,
  plan: () => renderSoon('Plan', '🗓', 'Your calendar, uni units from Canvas, café shifts and freelance projects arrive in a later version, plus Google Calendar events.'),
  money: () => renderSoon('Money', '💳', 'Budgets, spending, income, bills and savings goals arrive in a later version, with Apple Pay logging and Westpac & Revolut imports.'),
  settings: renderSettings,
};

// ---------- sheets ----------
function recentMeals() {
  const seen = new Map();
  of('meal').reverse().forEach(m => { const k = m.name.toLowerCase(); if (!seen.has(k)) seen.set(k, m); });
  return [...seen.values()].slice(0, 8);
}

const closeBtn = '<button type="button" class="x-btn" data-act="close" aria-label="Close">✕</button>';
const deleteBtn = id => (id ? `<button type="button" class="btn danger" data-act="delFromSheet" data-id="${id}">Delete</button>` : '');

const sheets = {
  quick: () => `<h2>Log ${closeBtn}</h2>
    <div class="quick-grid">
      <button class="quick-btn" style="background:var(--diet-bg)" data-act="sheet" data-sheet="meal"><span class="e">🥗</span>Meal</button>
      <button class="quick-btn" style="background:var(--work-bg)" data-act="water" data-n="1" data-close="1"><span class="e">💧</span>Glass of water</button>
      <button class="quick-btn" style="background:var(--sleep-bg)" data-act="sheet" data-sheet="sleep"><span class="e">🌙</span>Sleep</button>
      <button class="quick-btn" style="background:var(--move-bg)" data-act="sheet" data-sheet="weight"><span class="e">⚖️</span>Weigh-in</button>
    </div>
    <p class="note center">✨ AI logging (“3 eggs and toast”) comes with the Ask assistant.</p>`,

  meal: ({ id }) => {
    const m = id && state.entries.find(e => e.id === id);
    const recent = m ? [] : recentMeals();
    const v = k => (m && m[k] ? esc(m[k]) : '');
    return `<h2>${m ? 'Edit meal' : 'Add meal'} ${closeBtn}</h2>
    ${recent.length ? `<div class="label-sm">Recent · tap to fill</div><div class="chips-recent">${recent.map(r => `<button type="button" class="chip-btn" data-act="recent" data-id="${r.id}">${esc(r.name)}</button>`).join('')}</div>` : ''}
    <form data-form="meal">
      <input type="hidden" name="id" value="${m ? m.id : ''}">
      <div class="field"><label>What did you eat?</label><input class="input-x" name="name" required maxlength="60" placeholder="e.g. Chicken rice bowl" autocomplete="off" value="${v('name')}"></div>
      <div class="row2">
        <div class="field"><label>Calories (kcal)</label><input class="input-x" name="kcal" inputmode="numeric" required placeholder="650" value="${v('kcal')}"></div>
        <div class="field"><label>Protein (g)</label><input class="input-x" name="protein" inputmode="decimal" placeholder="40" value="${v('protein')}"></div>
        <div class="field"><label>Carbs (g)</label><input class="input-x" name="carbs" inputmode="decimal" placeholder="optional" value="${v('carbs')}"></div>
        <div class="field"><label>Fat (g)</label><input class="input-x" name="fat" inputmode="decimal" placeholder="optional" value="${v('fat')}"></div>
      </div>
      <div class="field"><label>Day</label><input class="input-x" type="date" name="date" value="${m ? m.date : dayKey()}" max="${dayKey()}" required></div>
      <div class="btn-row"><button class="btn">${m ? 'Save changes' : 'Save meal'}</button>${deleteBtn(m?.id)}</div>
    </form>`;
  },

  sleep: ({ id }) => {
    const s = id && state.entries.find(e => e.id === id);
    return `<h2>${s ? 'Edit sleep' : 'Log sleep'} ${closeBtn}</h2>
    <form data-form="sleep">
      <input type="hidden" name="id" value="${s ? s.id : ''}">
      <div class="row2">
        <div class="field"><label>Went to bed</label><input class="input-x" type="time" name="bed" value="${s ? esc(s.bed) : '23:00'}" required></div>
        <div class="field"><label>Woke up</label><input class="input-x" type="time" name="wake" value="${s ? esc(s.wake) : '07:00'}" required></div>
      </div>
      <div class="field"><label>Morning of</label><input class="input-x" type="date" name="date" value="${s ? s.date : dayKey()}" max="${dayKey()}" required></div>
      <div class="sleep-preview" id="sleep-preview"></div>
      <div class="btn-row"><button class="btn">${s ? 'Save changes' : 'Save sleep'}</button>${deleteBtn(s?.id)}</div>
    </form>`;
  },

  weight: ({ id }) => {
    const w = id && state.entries.find(e => e.id === id);
    return `<h2>${w ? 'Edit weigh-in' : 'Weigh-in'} ${closeBtn}</h2>
    <form data-form="weight">
      <input type="hidden" name="id" value="${w ? w.id : ''}">
      <div class="field"><label>Weight (kg)</label><input class="input-x" name="kg" inputmode="decimal" required value="${w ? w.kg : weights().at(-1)?.kg ?? ''}" placeholder="72.4"></div>
      <div class="field"><label>Date</label><input class="input-x" type="date" name="date" value="${w ? w.date : dayKey()}" max="${dayKey()}" required></div>
      <p class="note">Tip: weigh in the morning, after the bathroom, before eating.</p>
      <div class="btn-row"><button class="btn">${w ? 'Save changes' : 'Save weigh-in'}</button>${deleteBtn(w?.id)}</div>
    </form>`;
  },

  calc: () => {
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
  },

  welcome: () => `<div class="welcome">
      <img src="icons/icon-192.png" alt="" width="84" height="84">
      <h2 class="center">Welcome to Loop</h2>
      <p class="note center">Your diet, gym, sleep and habits in one place. Everything stays on this iPhone.</p>
      <ul class="welcome-list">
        <li><span>🎯</span>Set calorie and protein goals for your bulk</li>
        <li><span>＋</span>Log meals, water, sleep and weigh-ins in seconds</li>
        <li><span>📈</span>Watch your week as soft line charts</li>
        <li><span>☁️</span>Back up to iCloud Drive from Settings</li>
      </ul>
      <button class="btn" data-act="sheet" data-sheet="calc">Set my bulk goals</button>
      <button class="btn ghost" data-act="finishWelcome">Skip for now</button>
    </div>`,
};

function calcGoals(f) {
  const n = k => num(f.get(k));
  const age = n('age'), height = n('height'), weight = n('weight');
  if (!(age > 10 && height > 100 && weight > 30)) return null;
  // Mifflin–St Jeor resting energy, times activity, plus a bulking surplus.
  const bmr = 10 * weight + 6.25 * height - 5 * age + (f.get('sex') === 'female' ? -161 : 5);
  const maintenance = bmr * Number(f.get('activity'));
  const kcal = Math.round((maintenance + Number(f.get('pace'))) / 50) * 50;
  const protein = Math.round((weight * 2) / 5) * 5; // ~2 g per kg
  return { maintenance: Math.round(maintenance / 10) * 10, kcal, protein };
}

function updateSheetPreview(form) {
  if (form.dataset.form === 'calc') {
    const r = calcGoals(new FormData(form));
    const el = document.getElementById('calc-result');
    if (el) el.innerHTML = r
      ? `<div><span>Maintenance</span><b>${fmt(r.maintenance)} kcal</b></div><div><span>Bulk target</span><b>${fmt(r.kcal)} kcal</b></div><div><span>Protein</span><b>${r.protein} g</b></div>`
      : '<div><span>Fill in your details</span></div>';
  }
  if (form.dataset.form === 'sleep') {
    const el = document.getElementById('sleep-preview');
    const h = sleepHours(form.elements.bed.value, form.elements.wake.value);
    if (el) el.textContent = h ? `${fmtHours(h)} of sleep` : '';
  }
}

function sleepHours(bed, wake) {
  if (!bed || !wake) return 0;
  const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  let mins = toMin(wake) - toMin(bed);
  if (mins <= 0) mins += 24 * 60;
  return Math.round((mins / 60) * 100) / 100;
}

function openSheet(name, params = {}) {
  if (ui.sheet === 'welcome') setKV('onboarded', true);
  ui.sheet = name;
  ui.params = params;
  sheetEl.innerHTML = `<div class="sheet-wrap"><div class="sheet-bg" data-act="close"></div><div class="sheet glass" role="dialog" aria-modal="true"><div class="grabber"></div>${sheets[name](params)}</div></div>`;
  const form = sheetEl.querySelector('form');
  if (form) updateSheetPreview(form);
  enableSheetDrag(sheetEl.querySelector('.sheet'));
}

function closeSheet(immediate = false) {
  if (!ui.sheet) return;
  if (ui.sheet === 'welcome') setKV('onboarded', true);
  ui.sheet = null;
  const wrap = sheetEl.firstElementChild;
  if (!wrap || immediate || reduceMotion) { sheetEl.innerHTML = ''; return; }
  wrap.classList.add('closing');
  setTimeout(() => { if (!ui.sheet) sheetEl.innerHTML = ''; }, 240);
}

// Drag the sheet down to dismiss it, like iOS.
function enableSheetDrag(sheet) {
  let startY = null, dy = 0, t0 = 0;
  sheet.addEventListener('touchstart', e => {
    if (sheet.scrollTop > 0 || e.target.closest('input, select, textarea')) return;
    startY = e.touches[0].clientY;
    dy = 0;
    t0 = Date.now();
    sheet.style.transition = 'none';
  }, { passive: true });
  sheet.addEventListener('touchmove', e => {
    if (startY == null) return;
    dy = Math.max(0, e.touches[0].clientY - startY);
    sheet.style.transform = dy ? `translateY(${dy}px)` : '';
  }, { passive: true });
  sheet.addEventListener('touchend', () => {
    if (startY == null) return;
    const fast = dy / Math.max(1, Date.now() - t0) > 0.6;
    startY = null;
    sheet.style.transition = '';
    if (dy > 120 || (dy > 40 && fast)) closeSheet();
    else sheet.style.transform = '';
  });
}

// ---------- actions ----------
const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : 0; };

async function deleteWithUndo(id) {
  const entry = await removeEntry(id);
  if (!entry) return;
  haptic();
  render();
  const what = { meal: 'Meal', sleep: 'Sleep', weight: 'Weigh-in' }[entry.type] ?? 'Entry';
  toast(`${what} deleted`, { label: 'Undo', run: async () => { await putEntry(entry); render(); } });
}

async function setWater(target) {
  const t = dayKey();
  let current = waterOn(t);
  target = Math.max(0, target);
  while (current < target) { await addEntry('water', { amount: 1 }, t); current++; }
  while (current > target) {
    const last = of('water', t).at(-1);
    if (!last) break;
    await removeEntry(last.id);
    current--;
  }
  haptic();
  ui.pulse = '[data-pulse="water"]';
  render();
  if (target === goals().water) toast('💧 Water goal reached');
}

const actions = {
  nav: el => { location.hash = el.dataset.to; },
  quick: () => { haptic(); openSheet('quick'); },
  sheet: el => openSheet(el.dataset.sheet, { id: el.dataset.id }),
  close: () => closeSheet(),
  toastAction: () => { toastEl.classList.remove('show'); toast.run?.(); },
  healthTab: el => { ui.healthTab = el.dataset.tab; render({ enter: true }); },
  dismissInstall: async () => { await setKV('installHintDismissed', true); render(); },
  finishWelcome: () => closeSheet(),
  async water(el) {
    await setWater(waterOn(dayKey()) + Number(el.dataset.n));
    if (el.dataset.close) { closeSheet(); toast('💧 +1 glass'); }
  },
  waterSet: el => {
    const n = Number(el.dataset.n);
    return setWater(n === waterOn(dayKey()) ? n - 1 : n);
  },
  async habit(el) {
    const id = el.dataset.id, t = dayKey();
    const existing = state.entries.find(e => e.type === 'habit' && e.habitId === id && e.date === t);
    if (existing) await removeEntry(existing.id);
    else await addEntry('habit', { habitId: id }, t);
    haptic();
    ui.pulse = `.habit[data-id="${CSS.escape(id)}"]`;
    render();
    if (!existing && habits().every(h => habitDone(h.id, t))) toast('🎉 All habits done today');
  },
  del: el => deleteWithUndo(el.dataset.id),
  async delFromSheet(el) {
    closeSheet();
    await deleteWithUndo(el.dataset.id);
  },
  recent(el) {
    const m = state.entries.find(e => e.id === el.dataset.id);
    const f = sheetEl.querySelector('form[data-form="meal"]');
    if (!m || !f) return;
    ['name', 'kcal', 'protein', 'carbs', 'fat'].forEach(k => { f.elements[k].value = m[k] || ''; });
    haptic();
  },
  async repeatYesterday() {
    const t = dayKey();
    for (const m of of('meal', addDays(t, -1))) {
      const { id, ts, date, ...fields } = m;
      await addEntry('meal', fields, t);
    }
    haptic();
    toast('↻ Yesterday’s meals added');
    render();
  },
  async delHabit(el) {
    if (!confirm('Remove this habit? Its history stays in your backup.')) return;
    await setKV('habits', habits().filter(h => h.id !== el.dataset.id));
    render();
  },
  backup,
  restore: () => document.getElementById('restore-input').click(),
  async erase() {
    if (!confirm('Erase ALL Loop data on this iPhone? This cannot be undone.')) return;
    if (!confirm('Really erase everything? Make sure you have a backup.')) return;
    await eraseAll();
    toast('All data erased');
    location.hash = 'today';
    render({ enter: true });
  },
};

const forms = {
  async meal(f) {
    const kcal = num(f.get('kcal'));
    if (!kcal) return toast('Add the calories');
    const fields = {
      name: String(f.get('name')).trim(),
      kcal, protein: num(f.get('protein')), carbs: num(f.get('carbs')), fat: num(f.get('fat')),
    };
    const date = String(f.get('date')) || dayKey();
    const id = f.get('id');
    if (id) await updateEntry(id, { ...fields, date });
    else await addEntry('meal', fields, date);
    haptic();
    closeSheet();
    toast(id ? 'Meal updated' : `🥗 ${fields.name} saved`);
    render();
  },
  async sleep(f) {
    const bed = String(f.get('bed')), wake = String(f.get('wake'));
    const hours = sleepHours(bed, wake);
    const date = String(f.get('date'));
    if (f.get('id')) await removeEntry(f.get('id'));
    // One main sleep per morning: replace an existing log for that date.
    for (const e of of('sleep', date)) await removeEntry(e.id);
    await addEntry('sleep', { bed, wake, hours }, date);
    haptic();
    closeSheet();
    toast(`🌙 ${fmtHours(hours)} saved`);
    render();
  },
  async weight(f) {
    const kg = num(f.get('kg'));
    if (kg < 20 || kg > 300) return toast('Check the weight');
    const date = String(f.get('date'));
    if (f.get('id')) await removeEntry(f.get('id'));
    for (const e of of('weight', date)) await removeEntry(e.id);
    await addEntry('weight', { kg: Math.round(kg * 10) / 10 }, date);
    haptic();
    closeSheet();
    toast('⚖️ Weigh-in saved');
    render();
  },
  async goals(f) {
    const g = {};
    for (const k of Object.keys(DEFAULT_GOALS)) {
      const v = num(f.get(k));
      g[k] = v > 0 ? v : DEFAULT_GOALS[k];
    }
    await setKV('goals', g);
    haptic();
    toast('Goals saved');
    render();
  },
  async calc(f) {
    const r = calcGoals(f);
    if (!r) return toast('Check your details');
    await setKV('profile', { sex: f.get('sex'), age: num(f.get('age')), height: num(f.get('height')), weight: num(f.get('weight')), activity: f.get('activity'), pace: f.get('pace') });
    await setKV('goals', { ...goals(), kcal: r.kcal, protein: r.protein });
    await setKV('onboarded', true);
    haptic();
    closeSheet();
    toast(`🎯 ${fmt(r.kcal)} kcal · ${r.protein} g protein`);
    render();
  },
  async habit(f) {
    const name = String(f.get('name')).trim();
    if (!name) return;
    const emoji = String(f.get('emoji')).trim() || '✅';
    await setKV('habits', [...habits(), { id: crypto.randomUUID(), name, emoji }]);
    haptic();
    render();
  },
};

async function backup() {
  const name = `loop-backup-${dayKey()}.json`;
  const file = new File([JSON.stringify(exportData())], name, { type: 'application/json' });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Loop backup' });
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(file);
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }
    await setKV('lastBackup', Date.now());
    toast('☁️ Backup saved');
    render();
  } catch (err) {
    if (err.name !== 'AbortError') toast('Backup failed');
  }
}

document.getElementById('restore-input').addEventListener('change', async e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!confirm(`Replace everything on this iPhone with the backup from ${data.exportedAt?.slice(0, 10) ?? 'this file'}?`)) return;
    await importData(data);
    toast('Backup restored');
    render({ enter: true });
  } catch {
    toast('That file isn’t a Loop backup');
  }
});

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  e.preventDefault();
  actions[el.dataset.act]?.(el, e);
});
document.addEventListener('submit', e => {
  const f = e.target.closest('form[data-form]');
  if (!f) return;
  e.preventDefault();
  forms[f.dataset.form]?.(new FormData(f), f);
});
['input', 'change'].forEach(type => document.addEventListener(type, e => {
  const f = e.target.closest?.('form[data-form]');
  if (f && sheetEl.contains(f)) updateSheetPreview(f);
}));

// ---------- render & routing ----------
function render({ enter = false } = {}) {
  const route = screens[ui.route] ? ui.route : 'today';
  main.classList.toggle('enter', enter && !reduceMotion);
  main.innerHTML = `<div class="screen">${screens[route]()}</div>`;
  document.querySelectorAll('.tab[data-to]').forEach(t => t.classList.toggle('active', t.dataset.to === route));
  document.getElementById('topbar-title').textContent = TITLES[route];
  moveTabIndicator();
  if (ui.pulse) {
    main.querySelector(ui.pulse)?.classList.add('pop');
    ui.pulse = null;
  }
  if (route === 'settings') showPersistStatus();
}

// Liquid pill that slides under the active tab.
function moveTabIndicator() {
  const ind = document.getElementById('tab-ind');
  const active = document.querySelector('.tab.active');
  if (!active) { ind.style.opacity = '0'; return; }
  ind.style.opacity = '1';
  ind.style.width = `${active.offsetWidth}px`;
  ind.style.transform = `translateX(${active.offsetLeft}px)`;
}
window.addEventListener('resize', moveTabIndicator);

// Compact blurred title bar once the large title scrolls away.
const topbar = document.getElementById('topbar');
window.addEventListener('scroll', () => topbar.classList.toggle('show', window.scrollY > 48), { passive: true });

async function showPersistStatus() {
  const el = document.getElementById('persist-note');
  if (!el || !navigator.storage?.persisted) return;
  const persisted = await navigator.storage.persisted();
  el.textContent = persisted ? '✅ Storage is marked persistent on this device.' : 'Storage isn’t marked persistent yet. Open Loop from the Home Screen icon.';
}

function route() {
  ui.route = location.hash.slice(1) || 'today';
  closeSheet(true);
  window.scrollTo(0, 0);
  render({ enter: true });
}
window.addEventListener('hashchange', route);

// Re-render when the app comes back to the foreground on a new day.
let renderedDay = dayKey();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && dayKey() !== renderedDay) { renderedDay = dayKey(); render({ enter: true }); }
});

await openStore();
route();
if (!state.kv.onboarded && !state.entries.length) openSheet('welcome');

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
