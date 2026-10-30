// Health overview: one day read closely. How you slept and how recovered that
// leaves you, what you've eaten against the hours left, water, training load and
// which muscles are still recovering, and where body weight is heading — with the
// numbers turned into sentences instead of left for you to interpret.
import { state } from './store.js';
import { esc, dayKey, addDays, daysBetween, weekStart, toDate, dayLabel, initial, longDate, fmt, fmt1, fmtHours, time12, timeOf, toMin, fromMin, minNow, nowHHMM, pad, clamp, mean, sum, plural } from './util.js';
import { icon, tile } from './icons.js';
import { actions, ui, render, header } from './core.js';
import { sparkline } from './charts.js';
import { goals, of, sleepOn, waterOn, weights, weeklyRate, macroTargets, maintenanceKcal } from './data.js';
import { workouts, nextDay, active, routine, exById, workoutLoad } from './gym.js';
import { MUSCLES, exRegions } from './gym-data.js';
import { bodyMap, bodyPair } from './body.js';

// The waking day runs from when you got up (10am, the coach's usual start, when
// sleep isn't logged) to midnight; "on pace" means on pace for that much of it.
const USUAL_WAKE = 10 * 60, DAY_END = 24 * 60;

export const overviewDate = () => ui.tab.healthDate ?? dayKey();

const fmtMins = m => { m = Math.round(m); return m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${pad(m % 60)}m` : ''}` : `${m} min`; };
const signed = n => `${n >= 0 ? '+' : '−'}${fmt(Math.abs(n))}`;
const chip = ([level, text]) => `<span class="hv-chip lv-${level}">${text}</span>`;
const setsOf = w => w.exercises.reduce((t, x) => t + x.sets.length, 0);
const volumeOf = w => w.exercises.reduce((t, x) => t + x.sets.reduce((s, y) => s + (Number(y.kg) || 0) * (Number(y.reps) || 0), 0), 0);
const minOfTs = ts => { const d = new Date(ts); return d.getHours() * 60 + d.getMinutes(); };
const relDay = key => (key === dayKey() ? 'today' : key === addDays(dayKey(), -1) ? 'yesterday' : dayLabel(key));
const daysAgo = n => (n === 0 ? 'Same day' : n === 1 ? '1 day ago' : `${n} days ago`);
const note = (ic, area, html) => `<li style="--nc:var(--${area}-ink)">${icon(ic)}<span>${html}</span></li>`;
const notesList = items => (items.length ? `<ul class="hv-notes">${items.join('')}</ul>` : '');
const toTab = (tab, label) => `<a data-act="segTab" data-key="health" data-tab="${tab}">${label}</a>`;

// ---------- what the day holds ----------
function factsFor(date) {
  const g = goals();
  const live = date === dayKey();
  const sleep = of('sleep', date)[0] ?? null;
  const meals = of('meal', date);
  const start = sleep ? toMin(sleep.wake) : USUAL_WAKE;
  const ws = weights().filter(w => w.date <= date);
  return {
    date, live, g, sleep, meals,
    // 0 at wake-up, 1 at midnight; a past day is always complete.
    pace: live ? clamp((minNow() - start) / Math.max(60, DAY_END - start), 0, 1) : 1,
    kcal: sum(meals, 'kcal'), protein: sum(meals, 'protein'), carbs: sum(meals, 'carbs'), fat: sum(meals, 'fat'),
    water: waterOn(date),
    trained: workouts().filter(w => w.date === date).reverse(),
    weigh: ws.at(-1) ?? null, prevWeigh: ws.at(-2) ?? null,
    rate: weeklyRate(date),
  };
}

// Where an amount stands: against where it should be by now on the live day,
// against the whole goal on a past one.
function paceLevel(value, goal, f, { over } = {}) {
  if (over && value > goal * over) return ['ok', 'Over goal'];
  if (value >= goal * 0.95) return ['good', 'Goal hit'];
  if (!f.live) return !value ? ['none', 'Not logged'] : value >= goal * 0.8 ? ['ok', 'Close'] : ['low', 'Short'];
  if (!value) return f.pace < 0.15 ? ['none', 'Not yet'] : ['low', 'Nothing yet'];
  const expected = goal * f.pace;
  if (value >= expected * 0.85) return ['good', 'On pace'];
  return value >= expected * 0.6 ? ['ok', 'A bit behind'] : ['low', 'Behind'];
}

function sleepLevel(f) {
  if (!f.sleep) return ['none', 'Not logged'];
  const short = f.g.sleep - f.sleep.hours;
  return short <= 0.25 ? ['good', 'Rested'] : short <= 1 ? ['ok', 'A bit short'] : ['low', 'Short night'];
}

function trainingLevel(f) {
  if (f.trained.length) return ['good', 'Done'];
  if (f.live && active()) return ['ok', 'In progress'];
  return ['none', f.live ? 'Not yet' : 'Rest day'];
}

// Same lean-bulk band as bulkStatus: 0.25–0.5% of body weight a week.
function weightLevel(f) {
  if (!f.weigh) return ['none', 'Not logged'];
  if (daysBetween(f.weigh.date, f.date) > 7) return ['none', 'Weigh in'];
  if (f.rate == null) return ['none', 'No trend yet'];
  if (f.rate < 0) return ['low', 'Losing'];
  if (f.rate < f.weigh.kg * 0.0025) return ['ok', 'Slow gain'];
  return f.rate > f.weigh.kg * 0.005 ? ['ok', 'Fast gain'] : ['good', 'Lean bulk'];
}

function pillars(f) {
  const plan = f.live ? active()?.name ?? nextDay()?.name : null;
  return [
    { label: 'Sleep', ic: 'moon', area: 'sleep', value: f.sleep ? fmtHours(f.sleep.hours) : '–', lvl: sleepLevel(f) },
    { label: 'Calories', ic: 'diet', area: 'diet', value: f.kcal ? fmt(f.kcal) : '–', unit: f.kcal ? 'kcal' : '', lvl: paceLevel(f.kcal, f.g.kcal, f, { over: 1.15 }) },
    { label: 'Protein', ic: 'shaker', area: 'move', value: f.protein ? fmt(f.protein) : '–', unit: f.protein ? 'g' : '', lvl: paceLevel(f.protein, f.g.protein, f) },
    { label: 'Water', ic: 'drop', area: 'work', value: `${fmt(f.water)} / ${f.g.water}`, lvl: paceLevel(f.water, f.g.water, f) },
    { label: 'Training', ic: 'dumbbell', area: 'move', value: f.trained[0]?.name ?? plan ?? '–', lvl: trainingLevel(f) },
    { label: 'Weight', ic: 'scale', area: 'move', value: f.weigh ? String(f.weigh.kg) : '–', unit: f.weigh ? 'kg' : '', lvl: weightLevel(f) },
  ];
}

function headline(ps, f) {
  const scored = ps.filter(p => p.lvl[0] !== 'none');
  const low = scored.filter(p => p.lvl[0] === 'low').length;
  const ok = scored.filter(p => p.lvl[0] === 'ok').length;
  const logged = f.sleep || f.meals.length || f.water || f.trained.length || f.weigh?.date === f.date;
  if (!logged || !scored.length) return f.live ? 'Nothing logged yet' : 'Nothing logged';
  if (!low && ok <= 1) return f.live ? 'On track so far' : 'A strong day';
  if (low <= 1) return 'Mostly on track';
  return f.live ? 'Some catching up to do' : 'An off day';
}

// The day in a few plain sentences, built from the same facts as the tiles below.
function summary(f, ps) {
  const { g } = f, out = [];
  if (f.sleep) {
    const diff = f.sleep.hours - g.sleep;
    const vs = Math.abs(diff) < 0.25 ? 'right on your goal' : diff > 0 ? `${fmtMins(diff * 60)} over your goal` : `${fmtMins(-diff * 60)} short of your ${g.sleep}h goal`;
    out.push(`${f.live ? 'You slept' : 'Slept'} <b>${fmtHours(f.sleep.hours)}</b>, ${vs}.`);
  } else out.push(f.live ? 'Last night’s sleep isn’t logged yet.' : 'No sleep was logged for that night.');

  if (f.meals.length) {
    const where = !f.live ? `${Math.round((f.kcal / g.kcal) * 100)}% of your calorie goal`
      : f.kcal >= g.kcal ? 'already at your calorie goal'
      : `${{ good: 'right on pace', ok: 'a little behind pace', low: 'well behind pace' }[ps[1].lvl[0]]} for this time of day`;
    out.push(`${f.live ? 'So far you’ve had' : 'Ate'} <b>${fmt(f.kcal)} kcal</b> and <b>${fmt(f.protein)} g protein</b> over ${plural(f.meals.length, 'meal')}, ${where}.`);
  } else out.push(f.live ? 'No meals logged yet.' : 'No meals were logged.');

  if (f.water) out.push(f.live ? `Water is at <b>${f.water} of ${g.water} glasses</b>.` : `Drank <b>${f.water} of ${g.water} glasses</b> of water.`);

  const w = f.trained[0];
  if (w) out.push(`<b>${esc(w.name)}</b> done: ${fmtMins((w.end - w.start) / 6e4)}, ${plural(setsOf(w), 'set')}${w.prs?.length ? `, ${plural(w.prs.length, 'PR')}` : ''}.`);
  else if (f.live && active()) out.push(`<b>${esc(active().name)}</b> is in progress.`);
  else if (f.live && nextDay()) out.push(`<b>${esc(nextDay().name)}</b> is next on your routine.`);
  else if (!f.live) out.push('No workout, so a rest day.');

  if (f.weigh?.date === f.date) {
    const d = f.prevWeigh ? f.weigh.kg - f.prevWeigh.kg : 0;
    out.push(`Weighed in at <b>${f.weigh.kg} kg</b>${Math.abs(d) >= 0.05 ? `, ${d > 0 ? 'up' : 'down'} ${fmt1(Math.abs(d))} kg on the last weigh-in` : ''}.`);
  }
  return out.join(' ');
}

function heroCard(f, ps) {
  return `<section class="card glass hv-hero">
    <div class="label-sm">${dayLabel(f.date)} · ${f.live ? `as of ${time12(nowHHMM())}` : 'whole day'}</div>
    <div class="hv-headline">${headline(ps, f)}</div>
    <p class="hv-summary">${summary(f, ps)}</p>
    <div class="hv-pillars">${ps.map(p => `<div class="hv-pillar lv-${p.lvl[0]}">
      <div class="l" style="--pc:var(--${p.area}-ink)">${icon(p.ic)}${p.label}</div>
      <div class="v">${esc(p.value)}${p.unit ? `<small>${p.unit}</small>` : ''}</div>
      <div class="s">${p.lvl[1]}</div></div>`).join('')}</div>
  </section>`;
}

// ---------- sleep & recovery ----------
function recovery(f, debt) {
  if (!f.sleep) return ['none', 'Not logged'];
  const short = f.g.sleep - f.sleep.hours;
  if (short <= 0.25 && debt < 3) return ['good', 'Well rested'];
  if (short > 1 || debt >= 6) return ['low', 'Under-recovered'];
  return ['ok', 'A little short'];
}

function sleepCard(f) {
  const { g } = f;
  const nights = Array.from({ length: 7 }, (_, i) => addDays(f.date, i - 6));
  const logged = nights.map(d => of('sleep', d)[0]).filter(Boolean);
  const avg = logged.length ? mean(logged.map(s => s.hours)) : 0;
  const debt = Math.max(0, sum(logged.map(s => g.sleep - s.hours)));
  // Bedtimes counted from noon, so 11:30pm and 12:30am sit an hour apart rather than 23.
  const beds = logged.map(s => { const m = toMin(s.bed); return m < 12 * 60 ? m + 1440 : m; });
  const bedAvg = mean(beds);
  const spread = beds.length >= 3 ? Math.sqrt(mean(beds.map(b => (b - bedAvg) ** 2))) : null;
  const level = recovery(f, debt);
  const top = Math.max(g.sleep + 2, ...nights.map(sleepOn));
  const diff = f.sleep ? f.sleep.hours - g.sleep : null;

  const notes = [];
  if (f.live && f.sleep) {
    notes.push(note('bolt', 'sleep', {
      good: 'Well recovered: a good day to push your top sets.',
      ok: debt >= 3 ? `Carrying <b>${fmtMins(debt * 60)}</b> of sleep debt from the week. Train as planned and aim for an earlier night.` : 'Slightly under-slept. Train as planned and aim for an earlier night.',
      low: 'Short sleep blunts strength, focus and appetite. Keep training moderate today and get to bed earlier tonight.',
    }[level[0]]));
  }
  if (spread != null) {
    const usual = time12(fromMin(bedAvg));
    notes.push(note('clock', 'sleep', spread < 30
      ? `Steady bedtime this week, usually around <b>${usual}</b>.`
      : `Bedtime moved by about <b>±${fmtMins(spread)}</b> this week, usually around ${usual}.${spread >= 60 ? ' A steadier bedtime makes sleep more restful.' : ''}`));
  }
  if (logged.length && logged.length < 7) notes.push(note('info', 'sleep', `${plural(logged.length, 'night')} logged out of the last 7; averages use only those.`));

  return `<div class="section-label">Sleep &amp; recovery ${toTab('sleep', 'History')}</div>
  <section class="card glass">
    <div class="hv-top"><div><div class="label-sm">${f.live ? 'Last night' : 'Night before'}</div>
      <div class="big-xl">${f.sleep ? fmtHours(f.sleep.hours) : '–'}<small>${f.sleep ? `${time12(f.sleep.bed)} → ${time12(f.sleep.wake)}` : 'not logged'}</small></div></div>
      ${f.sleep || !f.live ? chip(level) : `<button class="pill-btn" data-act="sheet" data-sheet="sleep">${icon('plus')} Sleep</button>`}</div>
    <div class="stats">
      <div class="stat"><div class="l">vs goal</div><div class="v">${diff == null ? '–' : `${diff >= 0 ? '+' : '−'}${fmtMins(Math.abs(diff) * 60)}`}</div></div>
      <div class="stat"><div class="l">7-night avg</div><div class="v">${avg ? fmtHours(avg) : '–'}</div></div>
      <div class="stat"><div class="l">Sleep debt</div><div class="v">${logged.length ? fmtMins(debt * 60) : '–'}</div></div>
    </div>
    <div class="hv-nights" style="--goal:${(g.sleep / top) * 100}%" role="img" aria-label="Sleep over the last 7 nights">${nights.map(d => {
      const h = sleepOn(d);
      return `<div class="hv-night${d === f.date ? ' cur' : ''}"><b>${h ? h.toFixed(1) : '–'}</b><div class="hv-bar"><i class="${h >= g.sleep - 0.25 ? 'met' : ''}" style="height:${(h / top) * 100}%"></i></div><span>${initial(d)}</span></div>`;
    }).join('')}</div>
    ${notesList(notes)}
  </section>`;
}

// ---------- nutrition ----------
function nutritionCard(f) {
  const { g } = f;
  const t = macroTargets(g);
  const level = paceLevel(f.kcal, g.kcal, f, { over: 1.15 });
  const expected = g.kcal * f.pace;
  const left = Math.max(0, g.kcal - f.kcal), pLeft = Math.max(0, g.protein - f.protein);
  const kg = f.weigh?.kg ?? null;
  const perKg = kg && f.protein ? f.protein / kg : null;
  const exact = kg ? maintenanceKcal(state.kv.profile ?? {}, kg) : null;
  const maint = exact && Math.round(exact / 10) * 10; // as the bulk calculator shows it
  const lastMeal = f.meals.map(m => m.time).filter(Boolean).sort().at(-1);
  const bar = (label, value, goal, color) => `<div class="macro"><span>${label}</span><div class="track"><div class="fill" style="width:${Math.min(100, (value / goal) * 100)}%;background:${color}"></div></div><b>${fmt(value)} / ${fmt(goal)} g</b></div>`;

  // Energy from each macro, with whatever the logged macros don't explain shown as untracked.
  const parts = [['Protein', f.protein * 4, 'var(--move)'], ['Carbs', f.carbs * 4, 'var(--school)'], ['Fat', f.fat * 9, 'var(--diet)']];
  const total = Math.max(f.kcal, sum(parts.map(p => p[1])));
  parts.push(['Untracked', total - sum(parts.map(p => p[1])), 'rgba(0,0,0,.1)']);
  const split = (f.carbs || f.fat) && total ? parts.filter(p => p[1] / total >= 0.01) : [];

  const notes = [];
  if (f.live && f.meals.length) {
    if (left) {
      const n = clamp(Math.round((DAY_END - minNow()) / 240), 1, 3);
      notes.push(note('diet', 'diet', `About <b>${fmt(left)} kcal</b>${pLeft ? ` and <b>${fmt(pLeft)} g protein</b>` : ''} to go. ${n === 1 ? 'That’s one more meal of' : `Over ${n} more meals that’s`} roughly ${fmt(left / n)} kcal${pLeft ? ` and ${fmt(pLeft / n)} g protein` : ''}${n === 1 ? '' : ' each'}.`));
    } else if (pLeft) notes.push(note('diet', 'diet', `Calories are covered; protein still needs <b>${fmt(pLeft)} g</b>${pLeft <= 35 ? ', about one protein-rich snack' : ''}.`));
    else notes.push(note('star', 'diet', 'Calories and protein are both covered for today.'));
  } else if (!f.live && f.meals.length) {
    const gap = f.kcal - g.kcal;
    notes.push(note('diet', 'diet', `Finished on <b>${fmt(f.kcal)} kcal</b>, ${Math.abs(gap) < 50 ? 'right on goal' : `${fmt(Math.abs(gap))} ${gap < 0 ? 'short of' : 'over'} goal`}, with <b>${fmt(f.protein)} g protein</b> (${Math.round((f.protein / g.protein) * 100)}% of ${g.protein} g).`));
  }
  if (perKg) notes.push(note('shaker', 'move', `Around 1.6–2.2 g of protein per kg of body weight a day best supports muscle gain. You’re at <b>${fmt1(perKg)} g/kg</b>${f.live && pLeft ? ' so far' : ''}; your goal works out to ${fmt1(g.protein / kg)} g/kg.`));
  if (maint) {
    if (!f.live && f.meals.length) {
      const s = f.kcal - maint;
      const kind = s < -150 ? 'a deficit, so no room to build that day' : s <= 150 ? 'about maintenance' : s <= 550 ? 'a lean-bulk surplus' : 'more surplus than a lean bulk needs';
      notes.push(note('scale', 'move', `That’s <b>${signed(s)} kcal</b> against your estimated ${fmt(maint)} kcal maintenance: ${kind}.`));
    } else if (f.live) notes.push(note('scale', 'move', `Your ${fmt(g.kcal)} kcal goal is ${signed(g.kcal - maint)} over your estimated ${fmt(maint)} kcal maintenance.`));
  }
  const rich = f.meals.filter(m => Number(m.protein) >= 25).length;
  if (f.meals.length >= 2) notes.push(note('muscle', 'move', `${rich} of ${f.meals.length} meals had 25 g or more protein${rich < f.meals.length ? '; spreading it evenly across meals helps muscle repair' : ''}.`));

  return `<div class="section-label">Nutrition ${toTab('diet', 'Meals')}</div>
  <section class="card glass">
    <div class="hv-top"><div><div class="label-sm">${f.live ? 'Eaten so far' : 'Eaten'}</div>
      <div class="big-xl">${fmt(f.kcal)}<small>of ${fmt(g.kcal)} kcal</small></div></div>
      ${f.live ? `<button class="pill-btn" data-act="sheet" data-sheet="meal">${icon('plus')} Meal</button>` : chip(level)}</div>
    <div class="hv-pace"><div class="fill" style="width:${Math.min(100, (f.kcal / g.kcal) * 100)}%;background:var(--diet)"></div>${f.live && f.kcal < g.kcal ? `<i class="mark" style="left:${f.pace * 100}%"></i>` : ''}</div>
    <div class="hv-cap">${f.live
      ? `<span>${chip(level)}</span><span>${f.kcal >= g.kcal ? `${fmt(f.kcal - g.kcal)} over goal` : `≈ ${fmt(Math.round(expected / 50) * 50)} by now · ${fmt(left)} to go`}</span>`
      : `<span>${Math.round((f.kcal / g.kcal) * 100)}% of goal</span><span>${plural(f.meals.length, 'meal')}</span>`}</div>
    <div class="macro-bars">
      ${bar('Protein', f.protein, g.protein, 'var(--move)')}
      ${bar('Carbs', f.carbs, t.carbs, 'var(--school)')}
      ${bar('Fat', f.fat, t.fat, 'var(--diet)')}
    </div>
    ${split.length ? `<div class="hv-split" role="img" aria-label="Where today’s energy came from">${split.map(p => `<i style="flex:${p[1]};background:${p[2]}"></i>`).join('')}</div>
    <div class="hv-legend">${split.map(p => `<span><i class="dot" style="background:${p[2]}"></i>${p[0]} <b>${Math.round((p[1] / total) * 100)}%</b></span>`).join('')}</div>` : ''}
    <div class="stats hv-stats">
      <div class="stat"><div class="l">Meals</div><div class="v">${f.meals.length}</div></div>
      <div class="stat"><div class="l">${f.live ? 'Last meal' : 'Avg meal'}</div><div class="v">${f.live ? (lastMeal ? time12(lastMeal) : '–') : f.meals.length ? `${fmt(f.kcal / f.meals.length)}<span> kcal</span>` : '–'}</div></div>
      <div class="stat"><div class="l">Protein / kg</div><div class="v">${perKg ? `${fmt1(perKg)}<span> g</span>` : '–'}</div></div>
    </div>
    ${notesList(notes)}
  </section>`;
}

// ---------- water and body ----------
function waterCard(f) {
  const { g } = f;
  const level = paceLevel(f.water, g.water, f);
  const expected = Math.round(g.water * f.pace);
  return `<section class="card glass hv-mini">
    <div class="head"><div class="title">${tile('drop', 'work')}Water</div></div>
    <div class="big" data-pulse="water">${fmt(f.water)}<small>of ${g.water} glasses</small></div>
    <div class="sub">${chip(level)}</div>
    <div class="track"><div class="fill" style="width:${Math.min(100, (f.water / g.water) * 100)}%;background:var(--work)"></div></div>
    ${f.live ? `<div class="sub">${f.water >= g.water ? 'Goal reached' : `≈ ${expected} expected by now`}</div>
    <div class="water-ctrl"><button class="mini" data-act="water" data-n="-1" aria-label="Remove a glass">−</button><button class="mini" data-act="water" data-n="1" aria-label="Add a glass">${icon('plus')}</button></div>`
      : `<div class="sub">${f.water >= g.water ? 'Goal reached' : `${g.water - f.water} short of goal`}</div>`}
  </section>`;
}

function bodyCard(f) {
  const w = f.weigh;
  const level = weightLevel(f);
  const height = Number(state.kv.profile?.height);
  const bmi = w && height > 100 ? w.kg / (height / 100) ** 2 : null;
  const trend = weights().filter(x => x.date <= f.date && x.date >= addDays(f.date, -30)).map(x => x.kg);
  return `<section class="card glass hv-mini tap" data-act="segTab" data-key="health" data-tab="body">
    <div class="head"><div class="title">${tile('scale', 'move')}Body</div><div class="chev">${icon('chevron')}</div></div>
    <div class="big">${w ? w.kg : '–'}<small>kg</small></div>
    <div class="sub">${chip(level)}</div>
    <div class="sub">${w ? `Weighed ${relDay(w.date)}` : 'No weigh-in yet'}</div>
    ${f.rate != null || bmi ? `<div class="sub">${[f.rate != null ? `${f.rate >= 0 ? '+' : '−'}${Math.abs(f.rate).toFixed(2)} kg/wk` : '', bmi ? `BMI ${fmt1(bmi)}` : ''].filter(Boolean).join(' · ')}</div>` : ''}
    ${sparkline(trend, 'var(--move)')}
  </section>`;
}

// ---------- training ----------
// Roughly 48 hours between hard sessions for the same muscle: trained today or
// yesterday is still recovering, anything older is ready again.
function muscleStatus(f) {
  const recent = workouts().filter(w => w.date <= f.date && w.date > addDays(f.date, -14));
  return Object.entries(MUSCLES).map(([m, name]) => {
    const w = recent.find(x => x.exercises.some(e => exById(e.exId).muscle === m));
    if (!w) return { m, name, lvl: ['none', 'Not lately'] };
    const n = daysBetween(w.date, f.date);
    return { m, name, lvl: n <= 1 ? ['low', `Recovering · ${!n && f.live ? 'today' : `${n}d`}`] : ['good', `Ready · ${n}d`] };
  });
}

// The same 48-hour rule drawn on the body: the deeper the red, the more recently
// that muscle was worked and the less it wants another hard session today.
function recoveryFills(f) {
  const out = {};
  workouts().filter(w => w.date <= f.date && w.date > addDays(f.date, -2)).forEach(w => {
    const heat = daysBetween(w.date, f.date) === 0 ? 1 : 0.55;
    w.exercises.forEach(x => {
      const r = exRegions(exById(x.exId));
      r.pri.forEach(k => { out[k] = Math.max(out[k] ?? 0, heat); });
      r.sec.forEach(k => { out[k] = Math.max(out[k] ?? 0, heat * 0.5); });
    });
  });
  return out;
}

function trainingCard(f) {
  const r = routine();
  const all = workouts();
  const w0 = weekStart(f.date);
  const week = Array.from({ length: 7 }, (_, i) => addDays(w0, i));
  const trainedOn = new Set(all.map(w => w.date));
  const thisWeek = all.filter(w => w.date >= w0 && w.date <= f.date).length;
  const sets7 = sum(all.filter(w => w.date > addDays(f.date, -7) && w.date <= f.date).map(setsOf));
  const before = all.find(w => w.date < f.date);
  const muscles = muscleStatus(f);
  const aw = f.live ? active() : null;
  const next = f.live && !aw ? nextDay() : null;

  let main = '';
  const notes = [];
  if (f.trained.length) {
    main = f.trained.map(w => {
      return `<div class="hv-wk tap" data-act="sheet" data-sheet="wkDetail" data-id="${w.id}" role="button">
        <div class="t">${esc(w.name)}${w.prs?.length ? ` <span class="pr-badge">${icon('trophy')}${w.prs.length} PR</span>` : ''}</div>
        <div class="d">${timeOf(w.start)} · ${fmtMins((w.end - w.start) / 6e4)} · ${plural(setsOf(w), 'set')} · ${fmt(volumeOf(w))} kg moved</div>
        <div class="hv-wk-map">${bodyPair(workoutLoad(w), Math.max(1, ...Object.values(workoutLoad(w))))}</div></div>`;
    }).join('');
    const prs = [...new Set(f.trained.flatMap(w => w.prs ?? []))].map(id => exById(id).name);
    if (prs.length) notes.push(note('trophy', 'school', `New best on <b>${esc(prs.join(', '))}</b>.`));
  } else if (aw) {
    main = `<div class="hv-wk tap" data-act="nav" data-to="workout" role="button"><div class="t">${esc(aw.name)} in progress</div><div class="d">Tap to resume</div></div>`;
  } else if (next) {
    const targets = [...new Set(next.exercises.map(x => exById(x.exId).muscle))];
    const sore = muscles.filter(x => targets.includes(x.m) && x.lvl[0] === 'low').map(x => x.name.toLowerCase());
    main = `<div class="hv-next"><div class="grow"><div class="label-sm">Next on your routine</div><div class="t">${esc(next.name)}</div>
      <div class="d">${esc(next.exercises.map(x => exById(x.exId).name).join(', ')) || 'No exercises yet'}</div></div>
      <button class="pill-btn strong" data-act="startWorkout" data-day="${next.id}">${icon('play')} Start</button></div>`;
    if (targets.length) notes.push(note('muscle', 'move', sore.length
      ? `${esc(next.name)} works ${sore.join(' and ')}, which ${sore.length > 1 ? 'are' : 'is'} still recovering from the last session. Lighter top sets are fine today.`
      : `Everything ${esc(next.name)} works has had 48 hours or more to recover.`));
  } else {
    main = `<p class="note">${f.live ? 'No workout yet today.' : 'No workout that day: a rest day.'}</p>`;
  }
  if (r?.perWeek) {
    const left = Math.max(0, r.perWeek - thisWeek);
    const daysLeft = daysBetween(f.date, addDays(w0, 6)) + (f.live && !f.trained.length ? 1 : 0);
    if (left) notes.push(note('calendar', 'move', `${plural(left, 'workout')} to go this week to hit ${r.perWeek}${f.live ? `, with ${plural(daysLeft, 'day')} left` : ''}.`));
    else notes.push(note('star', 'move', `This week’s ${r.perWeek} workouts are done.`));
  }

  return `<div class="section-label">Training ${toTab('gym', 'Gym')}</div>
  <section class="card glass">
    <div class="head"><div class="title">${tile('dumbbell', 'move')}${f.live ? 'Today' : dayLabel(f.date)}</div>${chip(trainingLevel(f))}</div>
    ${main}
    <div class="hv-week">${week.map(d => `<div class="hv-day${trainedOn.has(d) ? ' on' : ''}${d === f.date ? ' cur' : ''}${d > dayKey() ? ' later' : ''}"><i>${trainedOn.has(d) ? icon('check') : ''}</i>${initial(d)}</div>`).join('')}</div>
    <div class="stats">
      <div class="stat"><div class="l">This week</div><div class="v">${thisWeek}<span>${r?.perWeek ? ` / ${r.perWeek}` : ''} workouts</span></div></div>
      <div class="stat"><div class="l">Sets · 7 days</div><div class="v">${sets7}</div></div>
      <div class="stat"><div class="l">Previous</div><div class="v">${before ? `${daysAgo(daysBetween(before.date, f.date))}` : '–'}</div></div>
    </div>
    <div class="label-sm hv-sub">Muscle recovery</div>
    ${bodyMap(recoveryFills(f), { label: 'Muscles still recovering', tap: true, cls: 'bm-rec' })}
    <p class="note center bm-key"><i class="bm-dot on"></i>worked today <i class="bm-dot half"></i>yesterday <i class="bm-dot off"></i>ready to go</p>
    ${notesList(notes)}
  </section>`;
}

// ---------- the day, in order ----------
function logCard(f) {
  const items = [];
  if (f.sleep) items.push({ min: toMin(f.sleep.wake), time: time12(f.sleep.wake), area: 'sleep', t: 'Woke up', d: `${fmtHours(f.sleep.hours)} asleep · in bed ${time12(f.sleep.bed)}`, sheet: 'sleep', id: f.sleep.id });
  f.meals.forEach(m => items.push({ min: m.time ? toMin(m.time) : null, time: m.time ? time12(m.time) : '', area: 'diet', t: m.name, d: `${fmt(m.kcal)} kcal${m.protein ? ` · ${fmt(m.protein)} g protein` : ''}`, sheet: 'meal', id: m.id }));
  f.trained.forEach(w => items.push({ min: minOfTs(w.start), time: timeOf(w.start), area: 'move', t: w.name, d: `${fmtMins((w.end - w.start) / 6e4)} · ${plural(setsOf(w), 'set')}`, sheet: 'wkDetail', id: w.id }));
  of('weight', f.date).forEach(w => items.push({ min: w.time ? toMin(w.time) : null, time: w.time ? time12(w.time) : '', area: 'move', t: 'Weigh-in', d: `${w.kg} kg`, sheet: 'weight', id: w.id }));
  // Things logged without a clock time (backdated, imported) go last rather than at a guessed hour.
  items.sort((a, b) => (a.min ?? DAY_END) - (b.min ?? DAY_END));
  return `<div class="section-label">Day log${f.water ? ` <span>${plural(f.water, 'glass', 'glasses')} of water</span>` : ''}</div>
  <section class="card glass">${items.length ? `<div class="list">${items.map(it => `<div class="row tap" data-act="sheet" data-sheet="${it.sheet}" data-id="${it.id}" role="button">
    <div class="time">${it.time || '–'}</div><div class="bar" style="background:var(--${it.area})"></div>
    <div class="grow"><div class="t">${esc(it.t)}</div><div class="d">${it.d}</div></div></div>`).join('')}</div>`
    : `<div class="empty">${f.live ? 'Nothing logged yet today.' : 'Nothing was logged on this day.'}</div>`}</section>`;
}

export function overviewHeader() {
  const date = overviewDate();
  const live = date === dayKey();
  const nav = `<div class="day-nav">
    <button class="icon-btn glass" data-act="healthStep" data-n="-1" aria-label="Previous day">${icon('back')}</button>
    ${live ? '' : '<button class="pill-btn" data-act="healthToday">Today</button>'}
    <button class="icon-btn glass" data-act="healthStep" data-n="1" aria-label="Next day" ${live ? 'disabled' : ''}>${icon('chevron')}</button>
  </div>`;
  return header('Health', longDate(toDate(date)), nav);
}

export function overviewTab() {
  const f = factsFor(overviewDate());
  const ps = pillars(f);
  return `${heroCard(f, ps)}
  ${sleepCard(f)}
  ${nutritionCard(f)}
  <div class="grid">${waterCard(f)}${bodyCard(f)}</div>
  ${trainingCard(f)}
  ${logCard(f)}`;
}

Object.assign(actions, {
  healthStep(el) {
    const next = addDays(overviewDate(), Number(el.dataset.n));
    if (next > dayKey()) return;
    // Today is stored as "no date" so the overview keeps following the clock past midnight.
    ui.tab.healthDate = next === dayKey() ? null : next;
    render({ enter: true });
  },
  healthToday() { ui.tab.healthDate = null; render({ enter: true }); },
});
