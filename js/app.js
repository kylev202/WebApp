import { state, openStore, addEntry, removeEntry, setKV, exportData, importData, eraseAll } from './store.js';
import { lineChart, sparkline } from './charts.js';

const VERSION = '1.0.0';
const DEFAULT_GOALS = { kcal: 3000, protein: 160, water: 8, sleep: 8 };
const DEFAULT_HABITS = [
  { id: 'gym', name: 'Gym', emoji: '🏋️' },
  { id: 'protein', name: 'Protein', emoji: '🥛' },
  { id: 'study', name: 'Study', emoji: '📚' },
  { id: 'bed', name: 'Bed by 11', emoji: '🌙' },
];
const C = { diet: 'var(--diet)', move: 'var(--move)', sleep: 'var(--sleep)', work: 'var(--work)', school: 'var(--school)' };
const WEEK = 7 * 24 * 3600 * 1000;

const ui = { route: 'today', healthTab: 'diet', sheet: null };
const main = document.getElementById('main');
const sheetEl = document.getElementById('sheet');

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
const initial = key => toDate(key).toLocaleDateString('en-AU', { weekday: 'narrow' });
const timeOf = ts => new Date(ts).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });

const goals = () => ({ ...DEFAULT_GOALS, ...state.kv.goals });
const habits = () => state.kv.habits ?? DEFAULT_HABITS;
const of = (type, date) => state.entries.filter(e => e.type === type && (date == null || e.date === date)).sort((a, b) => a.ts - b.ts);
const sum = (list, field) => list.reduce((t, e) => t + (Number(e[field]) || 0), 0);
const kcalOn = d => sum(of('meal', d), 'kcal');
const waterOn = d => sum(of('water', d), 'amount');
const sleepOn = d => sum(of('sleep', d), 'hours');
const weights = () => of('weight').sort((a, b) => a.date.localeCompare(b.date) || a.ts - b.ts);
const habitDone = (id, d) => state.entries.some(e => e.type === 'habit' && e.habitId === id && e.date === d);

// Consecutive days ending today (or yesterday, if today isn't done yet).
function streak(test) {
  let d = dayKey();
  if (!test(d)) d = addDays(d, -1);
  let n = 0;
  while (test(d)) { n++; d = addDays(d, -1); }
  return n;
}
const anyLogOn = d => state.entries.some(e => e.date === d);

const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 1800);
}

// ---------- screens ----------
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function header(title, sub, right = '') {
  return `<header><div><div class="date">${sub}</div><h1>${title}</h1></div>${right}</header>`;
}

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
  const monthAgo = ws.find(w => w.date >= addDays(t, -30));
  const days = lastDays(7);
  const logStreak = streak(anyLogOn);

  const pct = (v, goal) => (v ? (v / goal) * 100 : null);
  const eatAvg = avg(days.map(kcalOn));
  const sleepAvg = avg(days.map(sleepOn));
  const waterAvg = avg(days.map(waterOn));

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
  return `
  ${header(greeting(), new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' }),
    `<div class="hdr-right">${logStreak >= 2 ? `<span class="hdr-pill" style="background:var(--move-bg);color:var(--move-ink)">🔥 ${logStreak}-day streak</span>` : ''}
     <button class="icon-btn glass" data-act="nav" data-to="settings" aria-label="Settings"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg></button></div>`)}

  ${banners}

  <section class="card glass">
    <div class="head"><div class="title">This Week</div><div class="sub-note">% of goal</div></div>
    <div class="stats">
      <div class="stat"><div class="l"><span class="dot" style="background:var(--diet)"></span>Eat</div><div class="v">${eatAvg ? fmt(eatAvg) : '–'}<span> avg kcal</span></div></div>
      <div class="stat"><div class="l"><span class="dot" style="background:var(--sleep)"></span>Sleep</div><div class="v">${sleepAvg ? fmtHours(sleepAvg) : '–'}<span> avg</span></div></div>
      <div class="stat"><div class="l"><span class="dot" style="background:var(--work)"></span>Water</div><div class="v">${waterAvg ? waterAvg.toFixed(1) : '–'}<span> / ${g.water}</span></div></div>
    </div>
    ${lineChart({
      series: [
        { values: days.map(d => pct(kcalOn(d), g.kcal)), color: C.diet },
        { values: days.map(d => pct(sleepOn(d), g.sleep)), color: C.sleep },
        { values: days.map(d => pct(waterOn(d), g.water)), color: C.work },
      ],
      labels: days.map((d, i) => (i === 6 ? 'Today' : initial(d))),
      max: 130, goal: 100,
      empty: 'Log meals, water and sleep to see your week here.',
    })}
  </section>

  <div class="grid">
    <section class="card glass w" data-act="sheet" data-sheet="meal">
      <div class="head"><div class="title"><div class="ico" style="background:var(--diet-bg)">🥗</div>Diet</div><div class="chev">＋</div></div>
      <div class="big">${kcalLeft > 0 ? fmt(kcalLeft) : fmt(kcal)}<small>${kcalLeft > 0 ? 'kcal to go' : 'kcal 🎉'}</small></div>
      <div class="sub">Protein ${fmt(protein)} / ${g.protein} g</div>
      <div class="track"><div class="fill" style="width:${Math.min(100, (kcal / g.kcal) * 100)}%;background:var(--diet)"></div></div>
    </section>
    <section class="card glass w" data-act="sheet" data-sheet="sleep">
      <div class="head"><div class="title"><div class="ico" style="background:var(--sleep-bg)">🌙</div>Sleep</div><div class="chev">＋</div></div>
      <div class="big">${sleep ? fmtHours(sleep) : '–'}</div>
      <div class="sub">${sleep ? `Goal ${g.sleep}h` : 'Tap to log last night'}</div>
      ${sparkline(lastDays(7).map(d => sleepOn(d) || null), C.sleep)}
    </section>
    <section class="card glass w">
      <div class="head"><div class="title"><div class="ico" style="background:var(--work-bg)">💧</div>Water</div></div>
      <div class="big">${fmt(water)}<small>of ${g.water} glasses</small></div>
      <div class="drops">${Array.from({ length: g.water }, (_, i) => `<i class="${i < water ? '' : 'off'}"></i>`).join('')}</div>
      <div class="water-ctrl"><button class="mini" data-act="water" data-n="-1" aria-label="Remove a glass">−</button><button class="mini" data-act="water" data-n="1" aria-label="Add a glass">＋</button></div>
    </section>
    <section class="card glass w" data-act="sheet" data-sheet="weight">
      <div class="head"><div class="title"><div class="ico" style="background:var(--move-bg)">⚖️</div>Weight</div><div class="chev">＋</div></div>
      <div class="big">${latestW ? latestW.kg : '–'}<small>kg</small></div>
      <div class="sub" ${latestW && monthAgo && latestW.kg >= monthAgo.kg ? 'style="color:var(--diet-ink)"' : ''}>${latestW && monthAgo && latestW !== monthAgo ? `${latestW.kg >= monthAgo.kg ? '↑' : '↓'} ${Math.abs(latestW.kg - monthAgo.kg).toFixed(1)} kg this month` : 'Tap to log a weigh-in'}</div>
      ${sparkline(ws.filter(w => w.date >= addDays(t, -30)).map(w => w.kg), C.move)}
    </section>
  </div>

  <div class="section-label">Today’s food <a data-act="sheet" data-sheet="meal">Add</a></div>
  <section class="card glass">
    ${meals.length ? `<div class="list">${meals.map(mealRow).join('')}</div>` : '<div class="empty">Nothing logged yet. Tap ＋ to add a meal.</div>'}
  </section>

  <div class="section-label">Habits <a data-act="nav" data-to="settings">Edit</a></div>
  <section class="card glass">
    <div class="habits">${habits().map(h => {
      const on = habitDone(h.id, t);
      const s = streak(d => habitDone(h.id, d));
      return `<button class="habit ${on ? 'on' : ''}" data-act="habit" data-id="${esc(h.id)}"><div class="c">${esc(h.emoji)}</div>${esc(h.name)}<span class="s">${s ? `🔥 ${s}` : '&nbsp;'}</span></button>`;
    }).join('')}</div>
  </section>`;
}

function avg(values) {
  const v = values.filter(Boolean);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
}

function mealRow(m) {
  return `<div class="row"><div class="time">${timeOf(m.ts)}</div><div class="bar" style="background:var(--diet)"></div>
    <div class="grow"><div class="t">${esc(m.name)}</div><div class="d">${fmt(m.kcal)} kcal${m.protein ? ` · ${fmt(m.protein)} g protein` : ''}</div></div>
    <button class="x-btn" data-act="del" data-id="${m.id}" aria-label="Delete">✕</button></div>`;
}

function renderHealth() {
  const tab = ui.healthTab;
  const seg = ['diet', 'sleep', 'body'].map(k =>
    `<button class="${tab === k ? 'on' : ''}" data-act="healthTab" data-tab="${k}">${{ diet: 'Diet', sleep: 'Sleep', body: 'Body' }[k]}</button>`).join('');
  const body = { diet: healthDiet, sleep: healthSleep, body: healthBody }[tab]();
  return `${header('Health', 'Diet · Sleep · Body')}<div class="seg wide">${seg}</div>${body}`;
}

function healthDiet() {
  const g = goals();
  const t = dayKey();
  const meals = of('meal', t);
  const days14 = lastDays(14);
  const days7 = lastDays(7).reverse();
  const totals = ['protein', 'carbs', 'fat'].map(k => sum(meals, k));
  return `
  <section class="card glass">
    <div class="money-top"><div><div class="label-sm">Eaten today</div><div class="big-xl">${fmt(sum(meals, 'kcal'))}<small>of ${fmt(g.kcal)} kcal</small></div></div>
      <button class="pill-btn" data-act="sheet" data-sheet="meal">＋ Meal</button></div>
    <div class="chips"><span class="chip" style="background:var(--move-bg);color:var(--move-ink)">P ${fmt(totals[0])} / ${g.protein} g</span><span class="chip" style="background:var(--school-bg);color:var(--school-ink)">C ${fmt(totals[1])} g</span><span class="chip" style="background:var(--diet-bg);color:var(--diet-ink)">F ${fmt(totals[2])} g</span></div>
  </section>
  <section class="card glass">
    <div class="head"><div class="title">Calories · 14 days</div><div class="sub-note">dashed = goal</div></div>
    ${lineChart({ series: [{ values: days14.map(d => kcalOn(d) || null), color: C.diet }], labels: days14.map((d, i) => (i % 3 === 1 || i === 13 ? (i === 13 ? 'Today' : toDate(d).getDate()) : '')), goal: g.kcal, empty: 'Your calorie line appears after you log meals.' })}
  </section>
  ${days7.map(d => {
    const ms = of('meal', d);
    if (!ms.length) return '';
    return `<div class="section-label">${dayLabel(d)} <span>${fmt(sum(ms, 'kcal'))} kcal</span></div><section class="card glass"><div class="list">${ms.map(mealRow).join('')}</div></section>`;
  }).join('')}`;
}

function healthSleep() {
  const g = goals();
  const days14 = lastDays(14);
  const recent = of('sleep').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
  const a = avg(lastDays(7).map(sleepOn));
  return `
  <section class="card glass">
    <div class="money-top"><div><div class="label-sm">7-day average</div><div class="big-xl">${a ? fmtHours(a) : '–'}<small>goal ${g.sleep}h</small></div></div>
      <button class="pill-btn" data-act="sheet" data-sheet="sleep">＋ Sleep</button></div>
    ${lineChart({ series: [{ values: days14.map(d => sleepOn(d) || null), color: C.sleep }], labels: days14.map((d, i) => (i % 3 === 1 || i === 13 ? (i === 13 ? 'Today' : toDate(d).getDate()) : '')), min: 0, max: Math.max(g.sleep + 2, ...days14.map(sleepOn)), goal: g.sleep, empty: 'Log a night of sleep to start your chart.' })}
  </section>
  ${recent.length ? `<div class="section-label">Nights</div><section class="card glass"><div class="list">${recent.map(s => `
    <div class="row"><div class="bar" style="background:var(--sleep)"></div><div class="grow"><div class="t">${dayLabel(s.date)}</div><div class="d">${esc(s.bed)} → ${esc(s.wake)}</div></div>
    <div class="amt">${fmtHours(s.hours)}</div><button class="x-btn" data-act="del" data-id="${s.id}" aria-label="Delete">✕</button></div>`).join('')}</div></section>` : ''}`;
}

function healthBody() {
  const ws = weights();
  const recent = ws.slice(-60);
  const latest = ws.at(-1);
  return `
  <section class="card glass">
    <div class="money-top"><div><div class="label-sm">Body weight</div><div class="big-xl">${latest ? latest.kg : '–'}<small>kg</small></div></div>
      <button class="pill-btn" data-act="sheet" data-sheet="weight">＋ Weigh-in</button></div>
    ${lineChart({ series: [{ values: recent.map(w => w.kg), color: C.move }], labels: recent.map((w, i) => (i === 0 || i === recent.length - 1 ? toDate(w.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : '')), min: Math.min(...recent.map(w => w.kg)) - 1, max: Math.max(...recent.map(w => w.kg)) + 1, empty: 'Weigh in to track your bulk.' })}
  </section>
  ${ws.length ? `<div class="section-label">Weigh-ins</div><section class="card glass"><div class="list">${ws.slice().reverse().slice(0, 20).map(w => `
    <div class="row"><div class="bar" style="background:var(--move)"></div><div class="grow"><div class="t">${dayLabel(w.date)}</div></div>
    <div class="amt">${w.kg} kg</div><button class="x-btn" data-act="del" data-id="${w.id}" aria-label="Delete">✕</button></div>`).join('')}</div></section>` : ''}`;
}

function renderSoon(title, emoji, text) {
  return `${header(title, 'Coming soon')}
  <section class="card glass soon"><div class="soon-e">${emoji}</div><p>${text}</p></section>`;
}

function renderSettings() {
  const g = goals();
  const lastBackup = state.kv.lastBackup;
  return `${header('Settings', `Loop v${VERSION}`, '<button class="pill-btn" data-act="nav" data-to="today">Done</button>')}
  <div class="section-label">Daily goals</div>
  <form class="card glass" data-form="goals">
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
      <input class="input-x emoji-in" name="emoji" placeholder="✅" maxlength="4">
      <input class="input-x" name="name" placeholder="New habit" required maxlength="20">
      <button class="pill-btn">Add</button>
    </form>
  </section>

  <div class="section-label">Backup</div>
  <section class="card glass">
    <p class="note">Your data lives only on this iPhone. Save a backup to <b>iCloud Drive</b> weekly: tap Back up → <b>Save to Files</b> → iCloud Drive.</p>
    <p class="note">Last backup: <b>${lastBackup ? new Date(lastBackup).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }) : 'never'}</b></p>
    <div class="row2"><button class="btn" data-act="backup">Back up</button><button class="btn soft" data-act="restore">Restore</button></div>
    <p class="note" id="persist-note"></p>
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
  of('meal').reverse().forEach(m => { if (!seen.has(m.name.toLowerCase())) seen.set(m.name.toLowerCase(), m); });
  return [...seen.values()].slice(0, 8);
}

const sheets = {
  quick: () => `<h2>Log</h2>
    <div class="quick-grid">
      <button class="quick-btn" style="background:var(--diet-bg)" data-act="sheet" data-sheet="meal"><span class="e">🥗</span>Meal</button>
      <button class="quick-btn" style="background:var(--work-bg)" data-act="water" data-n="1" data-close="1"><span class="e">💧</span>Glass of water</button>
      <button class="quick-btn" style="background:var(--sleep-bg)" data-act="sheet" data-sheet="sleep"><span class="e">🌙</span>Sleep</button>
      <button class="quick-btn" style="background:var(--move-bg)" data-act="sheet" data-sheet="weight"><span class="e">⚖️</span>Weigh-in</button>
    </div>
    <p class="note center">✨ AI logging (“3 eggs and toast”) comes with the Ask assistant.</p>`,
  meal: () => {
    const recent = recentMeals();
    return `<h2>Add meal <button type="button" class="x-btn" data-act="close" aria-label="Close">✕</button></h2>
    ${recent.length ? `<div class="label-sm">Recent</div><div class="chips-recent">${recent.map(m => `<button type="button" class="chip-btn" data-act="recent" data-id="${m.id}">${esc(m.name)}</button>`).join('')}</div>` : ''}
    <form data-form="meal">
      <div class="field"><label>What did you eat?</label><input class="input-x" name="name" required maxlength="60" placeholder="e.g. Chicken rice bowl" autocomplete="off"></div>
      <div class="row2">
        <div class="field"><label>Calories (kcal)</label><input class="input-x" name="kcal" inputmode="numeric" required placeholder="650"></div>
        <div class="field"><label>Protein (g)</label><input class="input-x" name="protein" inputmode="decimal" placeholder="40"></div>
        <div class="field"><label>Carbs (g)</label><input class="input-x" name="carbs" inputmode="decimal" placeholder="optional"></div>
        <div class="field"><label>Fat (g)</label><input class="input-x" name="fat" inputmode="decimal" placeholder="optional"></div>
      </div>
      <button class="btn">Save meal</button>
    </form>`;
  },
  sleep: () => `<h2>Log sleep <button type="button" class="x-btn" data-act="close" aria-label="Close">✕</button></h2>
    <form data-form="sleep">
      <div class="row2">
        <div class="field"><label>Went to bed</label><input class="input-x" type="time" name="bed" value="23:00" required></div>
        <div class="field"><label>Woke up</label><input class="input-x" type="time" name="wake" value="07:00" required></div>
      </div>
      <div class="field"><label>Morning of</label><input class="input-x" type="date" name="date" value="${dayKey()}" max="${dayKey()}" required></div>
      <button class="btn">Save sleep</button>
    </form>`,
  weight: () => `<h2>Weigh-in <button type="button" class="x-btn" data-act="close" aria-label="Close">✕</button></h2>
    <form data-form="weight">
      <div class="field"><label>Weight (kg)</label><input class="input-x" name="kg" inputmode="decimal" required value="${weights().at(-1)?.kg ?? ''}" placeholder="72.4"></div>
      <div class="field"><label>Date</label><input class="input-x" type="date" name="date" value="${dayKey()}" max="${dayKey()}" required></div>
      <button class="btn">Save weigh-in</button>
    </form>`,
};

function openSheet(name) {
  ui.sheet = name;
  sheetEl.innerHTML = `<div class="sheet-wrap"><div class="sheet-bg" data-act="close"></div><div class="sheet glass"><div class="grabber"></div>${sheets[name]()}</div></div>`;
}
function closeSheet() {
  ui.sheet = null;
  sheetEl.innerHTML = '';
}

// ---------- actions ----------
const num = v => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : 0; };

const actions = {
  nav: el => { location.hash = el.dataset.to; },
  quick: () => openSheet('quick'),
  sheet: el => openSheet(el.dataset.sheet),
  close: () => closeSheet(),
  healthTab: el => { ui.healthTab = el.dataset.tab; render(); },
  dismissInstall: async () => { await setKV('installHintDismissed', true); render(); },
  async water(el) {
    const n = Number(el.dataset.n);
    if (n > 0) {
      await addEntry('water', { amount: 1 }, dayKey());
      toast('💧 +1 glass');
    } else {
      const last = of('water', dayKey()).at(-1);
      if (last) await removeEntry(last.id);
    }
    if (el.dataset.close) closeSheet();
    render();
  },
  async habit(el) {
    const id = el.dataset.id, t = dayKey();
    const existing = state.entries.find(e => e.type === 'habit' && e.habitId === id && e.date === t);
    if (existing) await removeEntry(existing.id);
    else await addEntry('habit', { habitId: id }, t);
    render();
  },
  async del(el) {
    if (!confirm('Delete this entry?')) return;
    await removeEntry(el.dataset.id);
    render();
  },
  recent(el) {
    const m = state.entries.find(e => e.id === el.dataset.id);
    const f = sheetEl.querySelector('form[data-form="meal"]');
    if (!m || !f) return;
    ['name', 'kcal', 'protein', 'carbs', 'fat'].forEach(k => { f.elements[k].value = m[k] || ''; });
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
    render();
  },
};

const forms = {
  async meal(f) {
    const kcal = num(f.get('kcal'));
    if (!kcal) return toast('Add the calories');
    await addEntry('meal', {
      name: String(f.get('name')).trim(),
      kcal, protein: num(f.get('protein')), carbs: num(f.get('carbs')), fat: num(f.get('fat')),
    }, dayKey());
    closeSheet();
    toast('🥗 Meal saved');
    render();
  },
  async sleep(f) {
    const bed = String(f.get('bed')), wake = String(f.get('wake'));
    const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
    let mins = toMin(wake) - toMin(bed);
    if (mins <= 0) mins += 24 * 60;
    const date = String(f.get('date'));
    // One main sleep per morning: replace an existing log for that date.
    for (const e of of('sleep', date)) await removeEntry(e.id);
    await addEntry('sleep', { bed, wake, hours: Math.round((mins / 60) * 100) / 100 }, date);
    closeSheet();
    toast(`🌙 ${fmtHours(mins / 60)} saved`);
    render();
  },
  async weight(f) {
    const kg = num(f.get('kg'));
    if (kg < 20 || kg > 300) return toast('Check the weight');
    const date = String(f.get('date'));
    for (const e of of('weight', date)) await removeEntry(e.id);
    await addEntry('weight', { kg: Math.round(kg * 10) / 10 }, date);
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
    toast('Goals saved');
    render();
  },
  async habit(f) {
    const name = String(f.get('name')).trim();
    if (!name) return;
    const emoji = String(f.get('emoji')).trim() || '✅';
    await setKV('habits', [...habits(), { id: crypto.randomUUID(), name, emoji }]);
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
    render();
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

// ---------- render & routing ----------
function render() {
  const route = screens[ui.route] ? ui.route : 'today';
  main.innerHTML = `<div class="screen">${screens[route]()}</div>`;
  document.querySelectorAll('.tab[data-to]').forEach(t => t.classList.toggle('active', t.dataset.to === route));
  if (route === 'settings') showPersistStatus();
}

async function showPersistStatus() {
  const el = document.getElementById('persist-note');
  if (!el || !navigator.storage?.persisted) return;
  const persisted = await navigator.storage.persisted();
  el.textContent = persisted ? '✅ Storage is marked persistent on this device.' : 'Storage isn’t marked persistent yet. Open Loop from the Home Screen icon.';
}

function route() {
  ui.route = location.hash.slice(1) || 'today';
  closeSheet();
  render();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);

// Re-render when the app comes back to the foreground on a new day.
let renderedDay = dayKey();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && dayKey() !== renderedDay) { renderedDay = dayKey(); render(); }
});

await openStore();
route();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
