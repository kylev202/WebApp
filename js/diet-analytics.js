// Diet analytics: a nutrition report. Whether the bulk is actually being fed, how
// steady the intake is, where the protein lands across the day, what you actually
// eat and how the weekend differs from the week. Everything comes from logged
// meals; the only estimate is the same Mifflin–St Jeor maintenance the rest of the
// app uses. Today is left out of every average — it is still being eaten.
import { state } from './store.js';
import { esc, dayKey, addDays, daysBetween, toDate, shortDate, initial, fmt, fmt1, time12, toMin, fromMin, mean, sum, plural, clamp } from './util.js';
import { icon, tile } from './icons.js';
import { lineChart } from './charts.js';
import { goals, of, kcalOn, proteinOn, weights, maintenanceKcal } from './data.js';
import { chip, note, notes, signed, fmtMins, stat, section, meter, sd } from './an-ui.js';

// Protein per kg of body weight a day: the range that best supports muscle gain.
const PER_KG = [1.6, 2.2];
// A meal carrying at least this much protein gives a full muscle-building signal.
const PER_MEAL = 25;
// Day-to-day calorie swing, as a share of the average: under the first is steady,
// over the second is erratic enough to hide a real weight trend.
const CV_OK = [10, 20];
// Three-hour bands from 5am, so a day of eating reads left to right in seven columns.
const BANDS = [[5, '5a'], [8, '8a'], [11, '11a'], [14, '2p'], [17, '5p'], [20, '8p'], [23, '11p']];

const bandOf = min => {
  const h = min / 60;
  for (let i = BANDS.length - 1; i >= 0; i--) if (h >= BANDS[i][0]) return i;
  return BANDS.length - 1; // after midnight belongs to the night band it started in
};

// ---------- the numbers ----------
function dietFacts() {
  const g = goals();
  const today = dayKey();
  const dayOf = d => {
    const ms = of('meal', d);
    return { d, ms, kcal: sum(ms, 'kcal'), protein: sum(ms, 'protein'), carbs: sum(ms, 'carbs'), fat: sum(ms, 'fat') };
  };
  // The n days before today, keeping only the ones with food logged: an unlogged
  // day is a gap in the record, not a day of eating nothing.
  const back = (n, skip = 0) => Array.from({ length: n }, (_, i) => addDays(today, -(n + skip - i))).map(dayOf).filter(x => x.ms.length);
  const d7 = back(7), prev7 = back(7, 7), d28 = back(28);
  const avg = (xs, k) => (xs.length ? mean(xs.map(x => x[k])) : null);

  const kcal7 = avg(d7, 'kcal'), kcalPrev = avg(prev7, 'kcal'), kcal28 = avg(d28, 'kcal');
  const prot7 = avg(d7, 'protein'), protPrev = avg(prev7, 'protein'), prot28 = avg(d28, 'protein');
  const kcalSd = sd(d28.map(x => x.kcal));
  const protSd = sd(d28.map(x => x.protein));
  const cv = kcalSd != null && kcal28 ? (kcalSd / kcal28) * 100 : null;

  const onKcal = d28.filter(x => Math.abs(x.kcal - g.kcal) <= g.kcal * 0.1).length;
  const underDays = d28.filter(x => x.kcal < g.kcal * 0.9).length;
  const overDays = d28.filter(x => x.kcal > g.kcal * 1.1).length;
  const onProt = d28.filter(x => x.protein >= g.protein * 0.95).length;

  // Coverage is measured against the days you could have logged, not a flat 28, so
  // a new log isn't marked down for days that happened before you started.
  const firstDay = of('meal').reduce((a, m) => (!a || m.date < a ? m.date : a), null);
  const possible = firstDay ? clamp(daysBetween(firstDay, today), 1, 28) : 28;

  // Bulk adherence, 0–100: eating the calories the bulk asks for (40), covering
  // protein (30), keeping it steady enough to read the scale (15), logging it (15).
  const kcalScore = d28.length ? mean(d28.map(x => clamp(1 - Math.abs(x.kcal - g.kcal) / (g.kcal * 0.2), 0, 1))) * 40 : 0;
  const protScore = d28.length ? mean(d28.map(x => clamp(x.protein / g.protein, 0, 1))) * 30 : 0;
  const steadyScore = cv == null ? 0 : clamp((30 - cv) / (30 - CV_OK[0]), 0, 1) * 15;
  const covScore = (d28.length / possible) * 15;
  const score = d28.length >= 4 ? Math.round(kcalScore + protScore + steadyScore + covScore) : null;

  const kg = weights().at(-1)?.kg ?? null;
  const perKg = kg && prot7 != null ? prot7 / kg : null;
  const maint = kg ? maintenanceKcal(state.kv.profile ?? {}, kg) : null;
  const surplus = maint && kcal7 != null ? kcal7 - maint : null;

  // ---- meal timing: only meals that carry a clock time ----
  const meals28 = d28.flatMap(x => x.ms);
  const timed = meals28.filter(m => m.time);
  const dayTimes = d28.map(x => x.ms.filter(m => m.time).map(m => toMin(m.time)).sort((a, b) => a - b)).filter(ts => ts.length);
  const firstAvg = dayTimes.length ? mean(dayTimes.map(ts => ts[0])) : null;
  const lastAvg = dayTimes.length ? mean(dayTimes.map(ts => ts.at(-1))) : null;
  const eatingWindow = dayTimes.filter(ts => ts.length >= 2).length >= 3 && firstAvg != null ? lastAvg - firstAvg : null;
  const mealsPerDay = d28.length ? mean(d28.map(x => x.ms.length)) : null;
  const bands = BANDS.map(() => 0);
  timed.forEach(m => { bands[bandOf(toMin(m.time))] += Number(m.kcal) || 0; });
  const bandAvg = bands.map(v => (d28.length ? v / d28.length : 0));
  const timedKcal = sum(timed, 'kcal');
  const lateKcal = timed.filter(m => toMin(m.time) >= 21 * 60 || toMin(m.time) < 4 * 60).reduce((t, m) => t + (Number(m.kcal) || 0), 0);
  const lateShare = timedKcal ? (lateKcal / timedKcal) * 100 : null;

  // ---- protein per meal ----
  const protPerMeal = meals28.length ? mean(meals28.map(m => Number(m.protein) || 0)) : null;
  const buckets = [
    ['Under 10 g', 0, 10, 'rgba(0,0,0,.12)'],
    ['10–24 g', 10, PER_MEAL, 'var(--work)'],
    ['25–39 g', PER_MEAL, 40, 'var(--school)'],
    ['40 g +', 40, Infinity, 'var(--move)'],
  ].map(([label, lo, hi, color]) => ({ label, color, n: meals28.filter(m => { const p = Number(m.protein) || 0; return p >= lo && p < hi; }).length }));
  const rich = meals28.filter(m => (Number(m.protein) || 0) >= PER_MEAL).length;
  // How much of a day's protein the single biggest meal carries: muscle repair
  // responds to each feeding, so one huge meal is worth less than three good ones.
  const spreads = d28.filter(x => x.ms.length >= 3 && x.protein > 0).map(x => Math.max(...x.ms.map(m => Number(m.protein) || 0)) / x.protein);
  const concentration = spreads.length >= 3 ? mean(spreads) * 100 : null;

  // ---- what you actually eat ----
  // Frequency needs a longer window than the averages do, or a weekly staple shows
  // up three times and ranks below last Tuesday's double-up.
  const long = back(56);
  const foodMeals = long.flatMap(x => x.ms);
  const map = new Map();
  foodMeals.forEach(m => {
    const key = String(m.name ?? '').trim().toLowerCase();
    if (!key) return;
    const e = map.get(key) ?? { name: String(m.name).trim(), n: 0, kcal: 0, protein: 0 };
    e.n++; e.kcal += Number(m.kcal) || 0; e.protein += Number(m.protein) || 0;
    map.set(key, e);
  });
  const foodKcal = sum(foodMeals, 'kcal');
  const foods = [...map.values()].sort((a, b) => b.n - a.n || b.kcal - a.kcal).map(f => ({
    ...f,
    avgKcal: f.kcal / f.n,
    avgProt: f.protein / f.n,
    share: foodKcal ? (f.kcal / foodKcal) * 100 : 0,
    density: f.kcal ? (f.protein / f.kcal) * 1000 : 0, // g of protein per 1000 kcal
  }));
  const top5Share = foodMeals.length ? (sum(foods.slice(0, 5).map(f => f.n)) / foodMeals.length) * 100 : null;
  const foodDays = long.length;

  // ---- weekday against weekend ----
  const isWeekend = d => [0, 6].includes(toDate(d).getDay());
  const we = d28.filter(x => isWeekend(x.d)), wd = d28.filter(x => !isWeekend(x.d));
  const pattern = we.length >= 2 && wd.length >= 3 ? {
    weKcal: avg(we, 'kcal'), wdKcal: avg(wd, 'kcal'), weProt: avg(we, 'protein'), wdProt: avg(wd, 'protein'), we: we.length, wd: wd.length,
  } : null;
  const byDow = Array.from({ length: 7 }, (_, i) => {
    const dow = (i + 1) % 7; // Monday first
    const xs = d28.filter(x => toDate(x.d).getDay() === dow);
    return { dow, kcal: xs.length ? mean(xs.map(y => y.kcal)) : null, prot: xs.length ? mean(xs.map(y => y.protein)) : null, n: xs.length };
  });

  return { g, today, d28, kcal7, kcalPrev, prot7, protPrev, prot28, kcalSd, protSd, cv,
    onKcal, underDays, overDays, onProt, possible, covered: d28.length, score, kcalScore, protScore, steadyScore, covScore,
    kg, perKg, maint, surplus, meals28, timed, firstAvg, lastAvg, eatingWindow, mealsPerDay, bandAvg, lateShare,
    protPerMeal, buckets, rich, concentration, foods, top5Share, foodDays, variety: map.size, pattern, byDow };
}

const dowName = dow => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dow];
const dowLetter = dow => initial(addDays('2024-01-01', (dow + 6) % 7)); // 2024-01-01 was a Monday

// ---------- cards ----------
function heroCard(f) {
  const { g } = f;
  const lvl = f.kcal7 == null ? ['none', 'Nothing logged this week']
    : f.kcal7 < g.kcal * 0.9 ? ['low', 'Under-eating']
    : f.kcal7 > g.kcal * 1.15 ? ['ok', 'Over goal']
    : f.kcal7 < g.kcal * 0.97 ? ['ok', 'Slightly short'] : ['good', 'Feeding the bulk'];
  const delta = f.kcal7 != null && f.kcalPrev != null ? f.kcal7 - f.kcalPrev : null;
  return `<section class="card glass hv-hero an-hero">
    <div class="hv-top"><div><div class="label-sm">7-day average · today not counted</div>
      <div class="big-xl">${f.kcal7 != null ? fmt(f.kcal7) : '–'}<small>of ${fmt(g.kcal)} kcal</small></div></div>
      ${chip(lvl)}</div>
    <div class="stats an-stats4">
      ${stat('Protein', f.prot7 != null ? fmt(f.prot7) : '–', `of ${fmt(g.protein)} g`)}
      ${stat('On target', `${f.onKcal}/${f.covered}`, 'days in 28')}
      ${stat('Protein / kg', f.perKg != null ? fmt1(f.perKg) : '–', f.perKg != null ? `${PER_KG[0]}–${PER_KG[1]} ideal` : 'needs weight')}
      ${stat('vs last week', delta != null ? `${signed(delta, 0)}` : '–', 'kcal')}
    </div>
  </section>`;
}

// One number for "is the bulk being fed properly", and the four things it is made of.
function scoreCard(f) {
  const { g } = f;
  const lvl = f.score == null ? ['none', 'Need 4+ days'] : f.score >= 80 ? ['good', 'Excellent'] : f.score >= 60 ? ['ok', 'Fair'] : ['low', 'Needs work'];
  const ins = [];
  if (f.surplus != null) {
    ins.push(note('scale', 'move', Math.abs(f.surplus) <= 150
      ? `This week you are eating about <b>maintenance</b> (${fmt(f.kcal7)} kcal against an estimated ${fmt(f.maint)}). A bulk needs 250–500 kcal more than this, every day, or the scale will not move.`
      : f.surplus < 0
        ? `This week you are in a <b>deficit of ${fmt(-f.surplus)} kcal</b> a day against an estimated ${fmt(f.maint)} kcal maintenance. Nothing is being built on that; your ${fmt(g.kcal)} kcal goal puts you ${signed(g.kcal - f.maint, 0)} over instead.`
        : f.surplus <= 550
          ? `This week runs a surplus of about <b>${fmt(f.surplus)} kcal</b> a day over your estimated ${fmt(f.maint)} kcal maintenance — the lean-bulk range, roughly ${fmt1((f.surplus * 7) / 7700)} kg a week.`
          : `This week runs a surplus of about <b>${fmt(f.surplus)} kcal</b> a day over your estimated ${fmt(f.maint)} kcal maintenance. Past ~500 the extra gain is increasingly fat; trim ${fmt(f.surplus - 450)} kcal to stay lean.`));
  } else if (f.kcal7 != null) {
    ins.push(note('info', 'move', 'Add your details in the bulk calculator and a weigh-in, and this report can read your intake against your estimated maintenance.'));
  }
  if (f.score != null) {
    const parts = [
      { n: 'calories', got: f.kcalScore, of: 40, fix: `Eating closer to ${fmt(g.kcal)} kcal on more days is the single biggest lever here.` },
      { n: 'protein', got: f.protScore, of: 30, fix: `Protein averages ${fmt(f.prot28)} g against a ${fmt(g.protein)} g goal; one more protein-rich meal or shake a day closes most of it.` },
      { n: 'steadiness', got: f.steadyScore, of: 15, fix: 'Calories swing enough day to day that the scale is hard to read. Repeating a few known meals steadies it fast.' },
      { n: 'logging', got: f.covScore, of: 15, fix: `${f.covered} of the last ${f.possible} days have meals logged. Untracked days are where bulks quietly stall.` },
    ];
    const weak = parts.reduce((a, b) => (a.got / a.of <= b.got / b.of ? a : b));
    if (weak.got / weak.of < 0.9) ins.push(note('target', 'diet', `Your weakest component is <b>${weak.n}</b> (${Math.round(weak.got)} of ${weak.of}). ${weak.fix}`));
    else ins.push(note('star', 'diet', 'Calories, protein, steadiness and logging are all close to full marks. Hold this and let the scale do the talking.'));
  }
  return `<section class="card glass">
    <div class="head"><div class="title">${tile('diet', 'diet')}Bulk adherence</div>${chip(lvl)}</div>
    <div class="an-score"><div class="big-xl">${f.score ?? '–'}<small>/ 100</small></div>
      <p class="note">How close your calories ran to goal, how much of your protein you covered, how steady the intake was and how many days you logged, over the last 28 days.</p></div>
    ${f.score == null ? `<p class="note">${plural(f.covered, 'day')} logged so far. Four days of food is the least this can be scored on.</p>` : `<div class="macro-bars">
      ${meter('Calories', (f.kcalScore / 40) * 100, `${Math.round(f.kcalScore)} / 40`, 'var(--diet)')}
      ${meter('Protein', (f.protScore / 30) * 100, `${Math.round(f.protScore)} / 30`, 'var(--move)')}
      ${meter('Steady', (f.steadyScore / 15) * 100, `${Math.round(f.steadyScore)} / 15`, 'var(--school)')}
      ${meter('Logged', (f.covScore / 15) * 100, `${Math.round(f.covScore)} / 15`, 'var(--work)')}
    </div>`}
    ${notes(ins)}
  </section>`;
}

// Consistency: the day-to-day record for calories and protein, against both goals.
function consistencyCard(f) {
  const { g } = f;
  const days14 = Array.from({ length: 14 }, (_, i) => addDays(f.today, i - 13));
  const top = Math.max(g.kcal * 1.2, ...days14.map(kcalOn));
  const bars = days14.map(d => {
    const v = kcalOn(d);
    return `<div class="hv-night${d === f.today ? ' cur' : ''}"><div class="hv-bar" style="--goal:${(g.kcal / top) * 100}%"><i class="${v >= g.kcal * 0.95 ? 'met' : ''}" style="height:${(v / top) * 100}%"></i></div><span>${initial(d)}</span></div>`;
  }).join('');

  const days30 = Array.from({ length: 30 }, (_, i) => addDays(f.today, i - 29));
  const rawKcal = days30.map(d => kcalOn(d) || null);
  const smooth = days30.map((_, i) => {
    const win = rawKcal.slice(Math.max(0, i - 6), i + 1).filter(Boolean);
    return win.length >= 3 ? mean(win) : null;
  });
  const rawProt = days30.map(d => proteinOn(d) || null);
  const protSmooth = days30.map((_, i) => {
    const win = rawProt.slice(Math.max(0, i - 6), i + 1).filter(Boolean);
    return win.length >= 3 ? mean(win) : null;
  });
  const labels = days30.map((d, i) => (i === 29 ? 'Today' : i % 6 === 0 ? shortDate(d) : ''));

  const ins = [];
  if (f.cv != null) {
    ins.push(note('chart', 'diet', f.cv < CV_OK[0]
      ? `Calories vary by only <b>±${fmt(f.kcalSd)} kcal</b> a day (${Math.round(f.cv)}%). That is steady enough for the scale to show a real trend within two weeks.`
      : f.cv < CV_OK[1]
        ? `Calories swing by about <b>±${fmt(f.kcalSd)} kcal</b> a day (${Math.round(f.cv)}%), which is normal. Under ${CV_OK[0]}% makes weight changes easier to read.`
        : `Calories swing by about <b>±${fmt(f.kcalSd)} kcal</b> a day (${Math.round(f.cv)}% of your average). Swings this size hide a real weight trend for weeks; repeating a few known meals is the quickest fix.`));
  }
  if (f.covered) {
    const miss = f.possible - f.covered;
    if (f.underDays || f.overDays) {
      ins.push(note('diet', 'diet', `Of ${plural(f.covered, 'logged day')}: <b>${f.onKcal}</b> within 10% of your ${fmt(g.kcal)} kcal goal, <b>${f.underDays}</b> more than 10% under, <b>${f.overDays}</b> more than 10% over.${f.underDays > f.overDays * 2 && f.underDays >= 3 ? ' Short days outnumber big ones, so the weekly average lands below goal even when most days look fine.' : ''}`));
    }
    if (miss >= 3) ins.push(note('info', 'work', `${plural(miss, 'day')} of the last ${f.possible} have no meals logged. Every average on this page uses only the logged ones, so they read a little high.`));
  }
  if (f.prot28 != null) {
    ins.push(note('muscle', 'move', `Protein hit ${f.onProt} of ${plural(f.covered, 'logged day')}, averaging <b>${fmt(f.prot28)} g</b> against your ${fmt(g.protein)} g goal${f.protSd != null ? ` (±${fmt(f.protSd)} g)` : ''}. Protein is the one number worth defending on a bad day, even if calories slip.`));
  }
  const dk = f.kcal7 != null && f.kcalPrev != null ? f.kcal7 - f.kcalPrev : null;
  const dp = f.prot7 != null && f.protPrev != null ? f.prot7 - f.protPrev : null;
  if (dk != null && Math.abs(dk) >= 100) {
    ins.push(note('bolt', 'school', `This week runs <b>${signed(dk, 0)} kcal</b> a day against the week before (${fmt(f.kcalPrev)} kcal)${dp != null && Math.abs(dp) >= 10 ? `, with protein ${signed(dp, 0)} g` : ''}.`));
  }

  return `${section('Consistency', 'calories and protein')}
  <section class="card glass">
    <div class="head"><div class="title">Last 14 days</div><div class="sub-note">dashed = goal</div></div>
    <div class="hv-nights an-dense an-diet" style="--n:14" role="img" aria-label="Calories eaten over the last 14 days">${bars}</div>
    <div class="head an-gap"><div class="title">Calories · 30 days</div><div class="sub-note">line = 7-day average</div></div>
    ${lineChart({ series: [{ values: rawKcal, color: 'rgba(122,178,147,.35)', straight: true }, { values: smooth, color: 'var(--diet)' }], labels, goal: g.kcal, min: 0, max: Math.max(g.kcal * 1.2, ...rawKcal.filter(Boolean)), live: true, yAxis: v => fmt(v), empty: 'Log a few meals to see the trend.' })}
    <div class="head an-gap"><div class="title">Protein · 30 days</div><div class="sub-note">line = 7-day average</div></div>
    ${lineChart({ series: [{ values: rawProt, color: 'rgba(170,80,98,.3)', straight: true }, { values: protSmooth, color: 'var(--move)' }], labels, goal: g.protein, min: 0, max: Math.max(g.protein * 1.3, ...rawProt.filter(Boolean)), live: true, yAxis: v => fmt(v), empty: 'Log protein with your meals to see the trend.' })}
    <div class="stats an-stats4 an-gap">
      ${stat('Swing', f.kcalSd != null ? `±${fmt(f.kcalSd)}` : '–', 'kcal / day')}
      ${stat('Variability', f.cv != null ? `${Math.round(f.cv)}%` : '–', `under ${CV_OK[0]}% ideal`)}
      ${stat('Under goal', `${f.underDays}`, 'by 10%+')}
      ${stat('Over goal', `${f.overDays}`, 'by 10%+')}
    </div>
    ${notes(ins)}
  </section>`;
}

// Protein per meal: the same daily total does more work spread across the day.
function proteinCard(f) {
  const { g } = f;
  const total = sum(f.buckets.map(b => b.n));
  if (!total) return '';
  const parts = f.buckets.filter(b => b.n);
  const richShare = (f.rich / total) * 100;
  const lvl = f.perKg == null ? ['none', 'Needs a weigh-in']
    : f.perKg < PER_KG[0] ? ['low', `Under ${PER_KG[0]} g/kg`]
    : f.perKg <= PER_KG[1] ? ['good', 'In range']
    : f.perKg <= 2.8 ? ['good', 'Above range'] : ['ok', 'More than needed'];

  const ins = [];
  if (f.perKg != null) {
    ins.push(note('shaker', 'move', f.perKg < PER_KG[0]
      ? `At <b>${fmt1(f.perKg)} g/kg</b> you are under the ${PER_KG[0]}–${PER_KG[1]} g/kg that best supports muscle gain. For ${fmt1(f.kg)} kg that means ${fmt(f.kg * PER_KG[0])}–${fmt(f.kg * PER_KG[1])} g a day — about <b>${fmt(f.kg * PER_KG[0] - f.prot7)} g</b> more than you average now.`
      : f.perKg <= PER_KG[1]
        ? `At <b>${fmt1(f.perKg)} g/kg</b> you sit inside the ${PER_KG[0]}–${PER_KG[1]} g/kg range for muscle gain, on ${fmt1(f.kg)} kg of body weight.`
        : f.perKg <= 2.8
          ? `At <b>${fmt1(f.perKg)} g/kg</b> you are a little above the ${PER_KG[0]}–${PER_KG[1]} g/kg range. Nothing is wasted at this level, and protein is the macro that keeps a surplus from turning into fat — just make sure carbs still cover your training.`
          : `At <b>${fmt1(f.perKg)} g/kg</b> you are well past the ${PER_KG[1]} g/kg where the benefits flatten. No harm in it, but on a bulk those calories do more as carbs around training.`));
  }
  ins.push(note('muscle', 'move', richShare >= 70
    ? `<b>${Math.round(richShare)}%</b> of meals carry ${PER_MEAL} g of protein or more. Each of those triggers muscle repair on its own, which is why spread beats one big hit.`
    : `Only <b>${Math.round(richShare)}%</b> of your meals reach ${PER_MEAL} g of protein (${f.rich} of ${total}). Muscle repair responds per meal, so moving protein out of your biggest meal and into your smallest builds more on the same daily total.`));
  if (f.concentration != null && f.concentration >= 45) {
    ins.push(note('info', 'school', `Your biggest meal carries about <b>${Math.round(f.concentration)}%</b> of the day's protein. Three or four meals of ${fmt(g.protein / 4)}–${fmt(g.protein / 3)} g use the same food better than one of ${fmt(g.protein * (f.concentration / 100))} g.`));
  }
  if (f.mealsPerDay != null && f.mealsPerDay < 3 && f.kcal7 != null) {
    ins.push(note('plate', 'diet', `You average <b>${fmt1(f.mealsPerDay)} meals a day</b>, so each one has to carry about ${fmt(f.kcal7 / f.mealsPerDay)} kcal. Adding ${f.mealsPerDay < 2.5 ? 'a third' : 'a fourth'} eating occasion is usually the easiest way to raise both calories and protein without feeling stuffed.`));
  }

  const eK = sum(f.d28.map(x => x.protein)) * 4, eC = sum(f.d28.map(x => x.carbs)) * 4, eF = sum(f.d28.map(x => x.fat)) * 9;
  const logged = sum(f.d28.map(x => x.kcal));
  const macroSplit = eC || eF ? [['Protein', eK, 'var(--move)'], ['Carbs', eC, 'var(--school)'], ['Fat', eF, 'var(--diet)'], ['Untracked', Math.max(0, logged - eK - eC - eF), 'rgba(0,0,0,.1)']].filter(p => p[1] / Math.max(logged, 1) >= 0.01) : [];

  const split = (ps, label, denom) => `<div class="hv-split" role="img" aria-label="${label}">${ps.map(p => `<i style="flex:${p[1] ?? p.n};background:${p[2] ?? p.color}"></i>`).join('')}</div>
    <div class="hv-legend">${ps.map(p => `<span><i class="dot" style="background:${p[2] ?? p.color}"></i>${p[0] ?? p.label} <b>${Math.round(((p[1] ?? p.n) / denom) * 100)}%</b></span>`).join('')}</div>`;

  return `${section('Protein per meal', 'last 28 days')}
  <section class="card glass">
    <div class="head"><div class="title">${tile('shaker', 'move')}Per meal</div>${chip(lvl)}</div>
    <div class="label-sm">Share of meals by protein · ${plural(total, 'meal')}</div>
    ${split(parts, 'Share of meals by protein per meal', total)}
    ${macroSplit.length ? `<div class="label-sm an-gap">Where the calories came from</div>${split(macroSplit, 'Share of calories by macronutrient', Math.max(logged, 1))}` : ''}
    <div class="stats an-stats4 an-gap">
      ${stat('Per meal', f.protPerMeal != null ? `${fmt(f.protPerMeal)}` : '–', 'g protein')}
      ${stat(`Over ${PER_MEAL} g`, `${Math.round(richShare)}%`, 'of meals')}
      ${stat('Biggest meal', f.concentration != null ? `${Math.round(f.concentration)}%` : '–', 'of daily P')}
      ${stat('Meals / day', f.mealsPerDay != null ? fmt1(f.mealsPerDay) : '–', 'average')}
    </div>
    ${notes(ins)}
  </section>`;
}

// Meal timing: when the food actually lands, and how wide the eating window is.
function timingCard(f) {
  if (!f.timed.length) {
    return `${section('Meal timing', 'last 28 days')}
    <section class="card glass">
      <div class="head"><div class="title">${tile('clock', 'sleep')}Calories by time of day</div></div>
      <p class="note">None of your logged meals carry a time yet. Meals you log on the day are stamped automatically, so this fills in as you go — then it reads your eating window, your biggest part of the day and how much lands late.</p>
    </section>`;
  }
  const top = Math.max(...f.bandAvg, 1);
  const peak = f.bandAvg.indexOf(Math.max(...f.bandAvg));
  const strip = BANDS.map(([, label], i) => `<div class="hv-night${i === peak ? ' cur' : ''}"><b>${f.bandAvg[i] >= 50 ? fmt(f.bandAvg[i]) : '–'}</b>
    <div class="hv-bar"><i class="${i === peak ? 'met' : ''}" style="height:${(f.bandAvg[i] / top) * 100}%"></i></div><span>${label}</span></div>`).join('');

  const ins = [];
  if (f.eatingWindow != null) {
    ins.push(note('clock', 'sleep', f.eatingWindow > 14 * 60
      ? `You eat across a <b>${fmtMins(f.eatingWindow)}</b> window, from about ${time12(fromMin(f.firstAvg))} to ${time12(fromMin(f.lastAvg))}. A long window makes a big surplus easy to reach; it only becomes a problem if the late food costs you sleep.`
      : f.eatingWindow < 8 * 60
        ? `All your food fits into about <b>${fmtMins(f.eatingWindow)}</b>, from ${time12(fromMin(f.firstAvg))} to ${time12(fromMin(f.lastAvg))}. That is a tight window to fit ${fmt(f.g.kcal)} kcal into — on a bulk, opening it an hour or two is easier than forcing bigger meals.`
        : `Your eating window runs about <b>${fmtMins(f.eatingWindow)}</b>, from ${time12(fromMin(f.firstAvg))} to ${time12(fromMin(f.lastAvg))}, leaving a ${fmtMins(1440 - f.eatingWindow)} overnight fast.`));
  } else if (f.firstAvg != null) {
    ins.push(note('clock', 'sleep', `First food averages <b>${time12(fromMin(f.firstAvg))}</b>. Log a couple more meals a day and this card can read your whole eating window.`));
  }
  if (f.lateShare != null && f.lateShare >= 25) {
    ins.push(note('moon', 'sleep', `<b>${Math.round(f.lateShare)}%</b> of your calories land after 9pm. Fine for gaining, but a large late meal raises body temperature and reflux risk, which is one of the quieter reasons a night's sleep comes out short.`));
  }
  const peakLabel = ['early morning', 'morning', 'midday', 'afternoon', 'early evening', 'evening', 'night'][peak];
  ins.push(note('plate', 'diet', `Your biggest part of the day is the <b>${peakLabel}</b>, averaging ${fmt(f.bandAvg[peak])} kcal in that band alone${f.bandAvg[0] + f.bandAvg[1] < f.g.kcal * 0.15 ? '. Mornings are nearly empty, so most of the day\'s target is being pushed into the back half' : ''}.`));
  if (f.firstAvg != null && f.firstAvg >= 12 * 60) {
    ins.push(note('sun', 'work', `First food averages <b>${time12(fromMin(f.firstAvg))}</b>. Skipping the morning is fine for weight, but it leaves fewer hours to reach ${fmt(f.g.kcal)} kcal and usually means protein comes in two big hits instead of four.`));
  }

  return `${section('Meal timing', 'last 28 days')}
  <section class="card glass">
    <div class="head"><div class="title">${tile('clock', 'sleep')}Calories by time of day</div><div class="sub-note">average per day</div></div>
    <div class="hv-nights an-plain an-diet" role="img" aria-label="Average calories by time of day">${strip}</div>
    <div class="stats an-stats4 an-gap">
      ${stat('First meal', f.firstAvg != null ? time12(fromMin(f.firstAvg)) : '–', 'average')}
      ${stat('Last meal', f.lastAvg != null ? time12(fromMin(f.lastAvg)) : '–', 'average')}
      ${stat('Window', f.eatingWindow != null ? fmtMins(f.eatingWindow) : '–', 'eating')}
      ${stat('After 9pm', f.lateShare != null ? `${Math.round(f.lateShare)}%` : '–', 'of calories')}
    </div>
    <p class="note an-foot">Built from the ${plural(f.timed.length, 'meal')} that carry a time. Meals logged on the day are stamped automatically; ones backfilled for an earlier date are not counted here.</p>
    ${notes(ins)}
  </section>`;
}

// What you actually eat, ranked by how often — the list a diet really runs on.
function foodsCard(f) {
  const rows = f.foods.filter(x => x.n >= 2).slice(0, 8);
  if (rows.length < 3) return '';
  const ins = [];
  const first = rows[0];
  ins.push(note('plate', 'diet', `<b>${esc(first.name)}</b> is your most-logged food — ${plural(first.n, 'time')} in ${plural(f.foodDays, 'logged day')}, ${Math.round(first.share)}% of all the calories you have recorded, at ${fmt(first.avgKcal)} kcal a serve.`));
  if (f.top5Share != null && f.top5Share >= 50 && f.variety >= 6) {
    ins.push(note('repeat', 'work', `Your top five foods make up <b>${Math.round(f.top5Share)}%</b> of every meal you log. Repetition is an advantage on a bulk: known portions mean known calories, and the scale becomes readable. Worth rotating a few vegetables and fruits through for micronutrients.`));
  } else if (f.variety >= 20) {
    ins.push(note('info', 'work', `You have logged <b>${f.variety} different foods</b> in that time, with no real staples. Variety is good for nutrition but makes calories harder to predict; three or four fixed meals a week usually steadies the whole report.`));
  }
  const dense = rows.filter(x => x.avgKcal >= 150);
  if (dense.length >= 3) {
    const best = dense.reduce((a, b) => (a.density > b.density ? a : b));
    const worst = dense.reduce((a, b) => (a.density < b.density ? a : b));
    if (best.density > worst.density * 1.6) {
      ins.push(note('shaker', 'move', `Per 1,000 kcal, <b>${esc(best.name)}</b> brings ${fmt(best.density)} g of protein and <b>${esc(worst.name)}</b> brings ${fmt(worst.density)} g. Swapping one serve a day towards the first adds about ${fmt(((best.density - worst.density) * worst.avgKcal) / 1000)} g of protein for the same calories.`));
    }
  }
  const noProt = rows.filter(x => x.avgProt < 5 && x.avgKcal >= 200);
  if (noProt.length) {
    ins.push(note('info', 'diet', `<b>${noProt.slice(0, 2).map(x => esc(x.name)).join(' and ')}</b> ${noProt.length > 1 ? 'carry' : 'carries'} ${fmt(noProt[0].avgKcal)}+ kcal with almost no protein. Useful for hitting a surplus, but the protein has to come from somewhere else in the day.`));
  }

  return `${section('Most common foods', `last ${f.foodDays} logged days`)}
  <section class="card glass">
    <div class="list an-lifts">${rows.map(x => `<div class="row">
      <div class="grow"><div class="t">${esc(x.name)}</div>
        <div class="d">${plural(x.n, 'time')} · ${fmt(x.avgKcal)} kcal${x.avgProt >= 1 ? ` · ${fmt(x.avgProt)} g protein` : ''} a serve</div></div>
      <div class="an-lift"><div class="amt">${Math.round(x.share)}%</div><div class="an-delta">of kcal</div></div></div>`).join('')}</div>
    <div class="stats an-stats3 an-gap">
      ${stat('Different foods', `${f.variety}`, 'logged')}
      ${stat('Top 5', f.top5Share != null ? `${Math.round(f.top5Share)}%` : '–', 'of meals')}
      ${stat('Most protein', rows.length ? `${fmt(rows.reduce((a, b) => (a.density > b.density ? a : b)).density)}` : '–', 'g / 1000 kcal')}
    </div>
    <p class="note an-foot">Share is how much of your logged energy came from that food. Protein per 1,000 kcal is the number to compare staples on.</p>
    ${notes(ins)}
  </section>`;
}

// Weekday against weekend, and the whole week day by day.
function patternCard(f) {
  const { g, pattern: p } = f;
  const known = f.byDow.filter(x => x.kcal != null && x.n >= 1);
  if (!p && known.length < 4) return '';
  const top = Math.max(g.kcal * 1.15, ...known.map(x => x.kcal));
  const worst = known.length >= 4 ? known.reduce((a, b) => (b.kcal < a.kcal ? b : a)) : null;
  const best = known.length >= 4 ? known.reduce((a, b) => (b.kcal > a.kcal ? b : a)) : null;

  // Weekday on the left, weekend on the right; the marker sits where the two halves
  // would be equal, so the gap between bar and marker is the whole finding.
  const pair = (unit, a, b, tol) => {
    const share = (a / (a + b)) * 100;
    const off = Math.abs(a - b) > Math.max(a, b) * tol;
    return `<div class="an-pair an-diet${off ? ' off' : ''}">
      <div class="an-pair-h"><span>Weekday <b>${fmt(a)}</b></span><span class="r"><b>${fmt(b)}</b> Weekend</span></div>
      <div class="an-pair-bar"><i class="a" style="width:${share}%"></i><i class="ideal" style="left:50%"></i></div>
      <div class="an-pair-f">${signed(Math.round(b) - Math.round(a), 0)} ${unit} a day at the weekend <span>· marker = no difference</span></div>
    </div>`;
  };

  const ins = [];
  if (p) {
    const dk = p.weKcal - p.wdKcal;
    if (Math.abs(dk) >= g.kcal * 0.08) {
      const monthly = dk * 8; // roughly eight weekend days in four weeks
      ins.push(note('calendar', 'work', dk > 0
        ? `Weekends run <b>${fmt(dk)} kcal</b> a day above weekdays. Over four weeks that is about ${fmt(monthly)} extra kcal, roughly ${fmt1(monthly / 7700)} kg of the gain you are seeing — fine on a bulk, worth knowing on a cut.`
        : `Weekends run <b>${fmt(-dk)} kcal</b> a day below weekdays, so two days in seven are pulling the weekly average down. Routine is usually what carries a bulk; weekends are where it goes missing.`));
    } else {
      ins.push(note('star', 'diet', `Weekday and weekend calories are within ${fmt(Math.abs(dk))} kcal of each other. That kind of consistency is what makes the weight trend trustworthy.`));
    }
    const dp = p.weProt - p.wdProt;
    if (Math.abs(dp) >= g.protein * 0.1) {
      ins.push(note('muscle', 'move', dp < 0
        ? `Protein drops <b>${fmt(-dp)} g</b> a day at the weekend (${fmt(p.weProt)} g against ${fmt(p.wdProt)} g). Eating out is usually the cause; one shake or a protein-first main course covers it.`
        : `Protein is <b>${fmt(dp)} g</b> a day higher at the weekend (${fmt(p.weProt)} g against ${fmt(p.wdProt)} g) — the opposite of the usual pattern, so weekdays are the ones to shore up.`));
    }
  }
  if (worst && best && best.kcal - worst.kcal >= g.kcal * 0.15) {
    ins.push(note('chart', 'diet', `<b>${dowName(worst.dow)}</b> is your lowest day, averaging ${fmt(worst.kcal)} kcal against ${fmt(best.kcal)} on ${dowName(best.dow)}. A repeatable plan for that one day moves the weekly average more than anything else on this page.`));
  }

  return `${section('Weekday against weekend', 'last 28 days')}
  <section class="card glass">
    ${p ? `${pair('kcal', p.wdKcal, p.weKcal, 0.08)}
    ${pair('g protein', p.wdProt, p.weProt, 0.1)}
    <p class="note an-foot">Averaged over ${plural(p.wd, 'weekday')} and ${plural(p.we, 'weekend day')} with food logged.</p>` : ''}
    <div class="head an-gap"><div class="title">By day of week</div><div class="sub-note">dashed = ${fmt(g.kcal)} kcal goal</div></div>
    <div class="hv-nights an-diet" role="img" aria-label="Average calories by weekday">${f.byDow.map(x => `<div class="hv-night${worst && worst.dow === x.dow ? ' cur' : ''}"><b>${x.kcal != null ? `${(x.kcal / 1000).toFixed(1)}k` : '–'}</b>
      <div class="hv-bar" style="--goal:${(g.kcal / top) * 100}%"><i class="${x.kcal >= g.kcal * 0.95 ? 'met' : ''}" style="height:${((x.kcal ?? 0) / top) * 100}%"></i></div><span>${dowLetter(x.dow)}</span></div>`).join('')}</div>
    ${notes(ins)}
  </section>`;
}

export function dietAnalytics() {
  const g = goals();
  if (!of('meal').length) {
    return `<section class="card glass">
      <div class="money-top"><div><div class="label-sm">Diet analysis</div><div class="big-md" style="color:var(--text-3)">No meals logged yet</div></div>
        <button class="pill-btn" data-act="sheet" data-sheet="meal">${icon('plus')} Meal</button></div>
      <p class="note" style="margin:8px 0 0">Log a few days of food and this page turns into a nutrition report: your average against your ${fmt(g.kcal)} kcal and ${fmt(g.protein)} g protein goals, a bulk-adherence score, how steady the intake is, protein per meal, when you eat, your most common foods and how weekends differ from weekdays.</p>
    </section>`;
  }
  const f = dietFacts();
  return `${heroCard(f)}
  ${scoreCard(f)}
  ${consistencyCard(f)}
  ${proteinCard(f)}
  ${timingCard(f)}
  ${foodsCard(f)}
  ${patternCard(f)}`;
}
