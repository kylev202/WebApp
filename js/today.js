// Today: the home screen pulling every area together.
import { state, addEntry, removeEntry, setKV } from './store.js';
import { esc, dayKey, addDays, lastDays, initial, fmt, fmtHours, avgLogged, sum, longDate } from './util.js';
import { icon, tile } from './icons.js';
import { screens, actions, ui, render, toast, haptic, header, seg, sect, views } from './core.js';
import { lineChart, sparkline } from './charts.js';
import { goals, habits, of, kcalOn, waterOn, sleepOn, weights, habitDone, anyLogOn, streak, weeklyRate, bulkStatus, isStandalone } from './data.js';
import { mealRow } from './health.js';
import { workoutCard } from './gym.js';

const WEEK = 7 * 24 * 3600 * 1000;
// Other areas add their own Today sections here, each into one of the four bands
// Today is read in (see the comment on sect() in core.js):
//   top   advice to read before anything else (the coach's notes and suggestions)
//   next  what is coming up or due soon (Up Next, To-Do, exam countdown)
//   week  how the last week or month went (money glance, long-term targets)
// Anything with an unrecognised band falls into "next" rather than vanishing.
export const todaySections = [];
const BANDS = ['top', 'next', 'week'];
const bandOf = s => (BANDS.includes(s.band ?? s.pos) ? (s.band ?? s.pos) : 'next');
const at = band => todaySections.filter(s => bandOf(s) === band).map(s => s.render()).join('');

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

// Housekeeping: an install hint and a backup nag. They used to sit above
// everything, so the first screenful of the app was two pieces of admin
// rather than the day. They go at the foot now — still unmissable on a
// screen you scroll anyway, but they no longer push the day off the top.
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

  const coming = at('next');
  return `
  ${header(greeting(), dateLine, `<button class="icon-btn glass" data-act="nav" data-to="settings" aria-label="Settings">${icon('gear')}</button>`)}
  ${viewToggle()}
  ${at('top')}

  ${sect('Today', { nav: 'Today', note: 'Where the day stands against your goals. Tap any card to log.', open: true })}
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

  ${coming ? `${sect('Coming up', { nav: 'Next', note: 'What is left on the clock today and what falls due in the next few days.', right: '<a data-act="nav" data-to="plan">Plan</a>' })}${coming}` : ''}

  ${sect('Logged today', { nav: 'Food',
    note: meals.length ? 'Everything you have eaten today, in the order you logged it.' : 'Nothing eaten has been written down yet.',
    right: `<span class="sect-v">${meals.length ? `${fmt(kcal)} kcal · ${fmt(protein)} g P` : '0 meals'}</span>`,
  })}
  <section class="card glass">
    ${meals.length ? `<div class="list">${meals.map(mealRow).join('')}</div>`
      : `<div class="empty">Nothing logged yet today.</div>${yesterdayMeals.length
        ? `<button class="btn soft" data-act="repeatYesterday">${icon('repeat')} Repeat yesterday’s ${yesterdayMeals.length} meal${yesterdayMeals.length > 1 ? 's' : ''}</button>` : ''}`}
  </section>
  <button class="btn soft" data-act="sheet" data-sheet="meal">${icon('plus')} Add a meal</button>

  ${sect('The week behind you', { nav: 'Week', note: 'Daily averages and how each day compared with its goal — the longer view, after today.' })}
  <section class="card glass tap" data-act="nav" data-to="health">
    <div class="head"><div class="title">Last 7 days</div><div class="sub-note">% of goal ${icon('chevron')}</div></div>
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
  ${at('week')}
  ${banners()}`;
}
screens.today = renderToday;

Object.assign(actions, {
  dismissInstall: async () => { await setKV('installHintDismissed', true); render(); },
  async habit(el) {
    const id = el.dataset.id, t = dayKey();
    const existing = state.entries.find(e => e.type === 'habit' && e.habitId === id && e.date === t);
    if (existing) await removeEntry(existing.id);
    else await addEntry('habit', { habitId: id }, t);
    haptic();
    ui.pulse = `.habit[data-id="${CSS.escape(id)}"]`;
    render();
    if (!existing && habits().every(h => habitDone(h.id, t))) toast('All habits done today', { icon: 'star' });
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
