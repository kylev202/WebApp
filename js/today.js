// Today: the home screen pulling every area together.
import { state, addEntry, removeEntry, setKV } from './store.js';
import { esc, dayKey, addDays, lastDays, initial, fmt, fmtHours, avgLogged, sum, longDate } from './util.js';
import { icon, tile } from './icons.js';
import { screens, actions, ui, render, toast, haptic, header, seg, views } from './core.js';
import { burst, fizz } from './fx.js';
import { lineChart, sparkline } from './charts.js';
import { goals, habits, of, kcalOn, waterOn, sleepOn, weights, habitDone, anyLogOn, streak, weeklyRate, bulkStatus, isStandalone } from './data.js';
import { mealRow } from './health.js';
import { workoutCard } from './gym.js';

const WEEK = 7 * 24 * 3600 * 1000;
// Other areas add their own Today sections (Up Next, To-Do, money...) here.
// Order on screen: things to do today (workout, numbers, habits), then what's coming
// up (mid sections), then how the week is going.
export const todaySections = [];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function banners() {
  let html = '';
  if (!isStandalone() && !state.kv.installHintDismissed) {
    html += `<section class="card glass banner">${tile('phoneDown', 'sleep')}
      <p>Add Loop to your Home Screen so your data stays safe: tap <b>Share</b> → <b>Add to Home Screen</b>, then open it from the icon.</p>
      <button class="x-btn" data-act="dismissInstall" aria-label="Dismiss">${icon('close')}</button></section>`;
  }
  const lastBackup = state.kv.lastBackup ?? 0;
  if (state.entries.length && Date.now() - lastBackup > WEEK) {
    html += `<section class="card glass banner">${tile('cloud', 'work')}
      <p>${lastBackup ? 'Last backup was over a week ago.' : 'You haven’t backed up yet.'} Save a copy to iCloud Drive.</p>
      <button class="pill-btn" data-act="backup">Back up</button></section>`;
  }
  return html;
}

// Summary is what Today has always been; Day is the same data at arm's length.
// It isn't remembered between opens on purpose: the summary is the thing you want
// first thing and last thing, which is when the app is usually opened cold.
export const viewToggle = () => seg('todayView', [['summary', 'Summary'], ['timeline', 'Day']], ui.tab.todayView ?? 'summary');

function renderToday() {
  if (ui.tab.todayView === 'timeline' && views.day) return views.day();
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
  const kcalLeft = g.kcal - kcal;
  const yesterdayMeals = of('meal', addDays(t, -1));
  const dateLine = longDate()
    + (logStreak >= 2 ? ` · <button class="streak" data-act="sheet" data-sheet="badges">${icon('flame')}${logStreak} days</button>` : '');
  const eatAvg = avgLogged(days.map(kcalOn)), sleepAvg = avgLogged(days.map(sleepOn)), waterAvg = avgLogged(days.map(waterOn));

  return `
  ${header(greeting(), dateLine, `<button class="icon-btn glass" data-act="nav" data-to="settings" aria-label="Settings">${icon('gear')}</button>`)}
  ${viewToggle()}
  ${banners()}
  ${todaySections.filter(s => s.pos === 'top').map(s => s.render()).join('')}
  ${workoutCard()}

  <div class="grid">
    <section class="card glass w tap" data-act="sheet" data-sheet="meal">
      <div class="head"><div class="title">${tile('diet', 'diet')}Diet</div><div class="chev">${icon('plus')}</div></div>
      <div class="big">${kcalLeft > 0 ? fmt(kcalLeft) : fmt(kcal)}<small>${kcalLeft > 0 ? 'kcal to go' : 'kcal'}</small></div>
      <div class="sub">${kcalLeft > 0 ? `Protein ${fmt(protein)} / ${g.protein} g` : `${icon('star')} Calorie goal hit`}</div>
      <div class="track"><div class="fill" style="width:${Math.min(100, (kcal / g.kcal) * 100)}%;background:var(--diet)"></div></div>
    </section>
    <section class="card glass w tap" data-act="sheet" data-sheet="sleep">
      <div class="head"><div class="title">${tile('moon', 'sleep')}Sleep</div><div class="chev">${icon('plus')}</div></div>
      <div class="big">${sleep ? fmtHours(sleep) : '–'}</div>
      <div class="sub">${sleep ? `${sleep >= g.sleep ? `${icon('check')} ` : ''}Goal ${g.sleep}h` : 'Tap to log last night'}</div>
      ${sparkline(lastDays(7).map(d => sleepOn(d) || null), 'var(--sleep)')}
    </section>
    <section class="card glass w">
      <div class="head"><div class="title">${tile('drop', 'work')}Water</div></div>
      <div class="big" data-pulse="water">${fmt(water)}<small>of ${g.water} glasses</small></div>
      <div class="drops">${Array.from({ length: g.water }, (_, i) =>
        `<button class="drop ${i < water ? 'on' : ''}" data-act="waterSet" data-n="${i + 1}" aria-label="${i + 1} glasses"></button>`).join('')}</div>
      <div class="water-ctrl"><button class="mini" data-act="water" data-n="-1" aria-label="Remove a glass">−</button><button class="mini" data-act="water" data-n="1" aria-label="Add a glass">${icon('plus')}</button></div>
    </section>
    <section class="card glass w tap" data-act="sheet" data-sheet="weight">
      <div class="head"><div class="title">${tile('scale', 'move')}Weight</div><div class="chev">${icon('plus')}</div></div>
      <div class="big">${latestW ? latestW.kg : '–'}<small>kg</small></div>
      <div class="sub" ${rate != null && latestW ? `style="color:${bulkStatus(rate, latestW.kg).color}"` : ''}>${rate != null ? `${rate >= 0 ? '+' : '−'}${Math.abs(rate).toFixed(2)} kg / week` : latestW ? 'Weigh in weekly for a trend' : 'Tap to log a weigh-in'}</div>
      ${sparkline(ws.filter(w => w.date >= addDays(t, -30)).map(w => w.kg), 'var(--move)')}
    </section>
  </div>

  <div class="section-label">Habits <a data-act="nav" data-to="settings">Edit</a></div>
  <section class="card glass">
    <div class="habits">${habits().map(h => {
      const on = habitDone(h.id, t);
      const s = streak(d => habitDone(h.id, d));
      return `<button class="habit ${on ? 'on' : ''}" data-act="habit" data-id="${esc(h.id)}" aria-pressed="${on}"><div class="c">${icon(h.icon)}</div>${esc(h.name)}<span class="s">${s ? `${icon('flame')}${s}` : '&nbsp;'}</span></button>`;
    }).join('')}</div>
  </section>

  ${todaySections.filter(s => s.pos !== 'top' && s.pos !== 'end').map(s => s.render()).join('')}

  <section class="card glass tap" data-act="nav" data-to="health">
    <div class="head"><div class="title">This Week</div><div class="sub-note">% of goal ${icon('chevron')}</div></div>
    <div class="stats">
      <div class="stat"><div class="l"><span class="dot" style="background:var(--diet)"></span>Eat</div><div class="v">${eatAvg ? fmt(eatAvg) : '–'}<span> avg</span></div></div>
      <div class="stat"><div class="l"><span class="dot" style="background:var(--sleep)"></span>Sleep</div><div class="v">${sleepAvg ? fmtHours(sleepAvg) : '–'}<span> avg</span></div></div>
      <div class="stat"><div class="l"><span class="dot" style="background:var(--work)"></span>Water</div><div class="v">${waterAvg ? waterAvg.toFixed(1) : '–'}<span> / ${g.water}</span></div></div>
    </div>
    ${lineChart({
      series: [
        { values: days.map(d => pct(kcalOn(d), g.kcal)), color: 'var(--diet)' },
        { values: days.map(d => pct(sleepOn(d), g.sleep)), color: 'var(--sleep)' },
        { values: days.map(d => pct(waterOn(d), g.water)), color: 'var(--work)' },
      ],
      labels: days.map((d, i) => (i === 6 ? 'Today' : initial(d))),
      max: 130, goal: 100, live: true,
      empty: 'Log meals, water and sleep to see your week here.',
    })}
  </section>

  <div class="section-label">Today’s food${meals.length ? ` <span>${fmt(kcal)} kcal · ${fmt(protein)} g P</span>` : ''} <a data-act="sheet" data-sheet="meal">Add</a></div>
  <section class="card glass">
    ${meals.length ? `<div class="list">${meals.map(mealRow).join('')}</div>`
      : `<div class="empty">Nothing logged yet today.</div>${yesterdayMeals.length
        ? `<button class="btn soft" data-act="repeatYesterday">${icon('repeat')} Repeat yesterday’s ${yesterdayMeals.length} meal${yesterdayMeals.length > 1 ? 's' : ''}</button>` : ''}`}
  </section>
  ${todaySections.filter(s => s.pos === 'end').map(s => s.render()).join('')}`;
}
screens.today = renderToday;

Object.assign(actions, {
  dismissInstall: async () => { await setKV('installHintDismissed', true); render(); },
  async habit(el) {
    const id = el.dataset.id, t = dayKey();
    const existing = state.entries.find(e => e.type === 'habit' && e.habitId === id && e.date === t);
    if (!existing) burst(el.querySelector('.c'), { color: 'var(--diet)' });
    if (existing) await removeEntry(existing.id);
    else await addEntry('habit', { habitId: id }, t);
    haptic();
    ui.pulse = `.habit[data-id="${CSS.escape(id)}"]`;
    render();
    if (!existing && habits().every(h => habitDone(h.id, t))) { toast('All habits done today', { icon: 'star' }); fizz(); }
  },
  async repeatYesterday() {
    const t = dayKey();
    for (const m of of('meal', addDays(t, -1))) {
      const { id, ts, date, ...fields } = m;
      // Keep yesterday's clock time where there was one; otherwise leave it
      // unplaced rather than stacking the whole day at the moment you tapped.
      await addEntry('meal', { ...fields, time: m.time ?? null }, t);
    }
    haptic();
    toast('Yesterday’s meals added', { icon: 'repeat' });
    render();
  },
});
