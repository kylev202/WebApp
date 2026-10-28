// Health analytics for the Sleep, Body and Gym tabs: the same logged data as the
// rest of the app, read the way a coach would. Every figure says what it is
// measured against, and every card ends in what to do about it.
import { state } from './store.js';
import { esc, dayKey, addDays, daysBetween, weekStart, toDate, shortDate, initial, fmt, fmt1, fmtHours, time12, toMin, fromMin, mean, sum, plural, clamp } from './util.js';
import { icon, tile } from './icons.js';
import { lineChart } from './charts.js';
import { goals, of, sleepOn, weights, weeklyRate, maintenanceKcal, kcalOn } from './data.js';

import { chip, note, notes, signed, fmtMins, stat, section, meter, sd, slope, dayNo } from './an-ui.js';

// ============================================================
// SLEEP
// ============================================================
// Bedtimes counted from noon so 11:30pm and 12:30am sit an hour apart, not 23.
const bedMin = s => { const m = toMin(s.bed); return m < 12 * 60 ? m + 1440 : m; };

function sleepFacts() {
  const g = goals();
  const today = dayKey();
  const nights = n => Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)));
  const entries = days => days.map(d => of('sleep', d)[0]).filter(Boolean);
  const w7 = entries(nights(7)), prev7 = entries(nights(14).slice(0, 7)), w28 = entries(nights(28));
  const avg7 = w7.length ? mean(w7.map(s => s.hours)) : null;
  const avgPrev = prev7.length ? mean(prev7.map(s => s.hours)) : null;
  const debt = Math.max(0, sum(w7.map(s => g.sleep - s.hours)));
  const bedSd = sd(w7.map(bedMin));
  const wakeSd = sd(w7.map(s => toMin(s.wake)));
  const covered = w7.length;

  // 0–100: how long you slept (60), how regular the bedtime was (25), how many nights were logged (15).
  const durScore = avg7 == null ? 0 : clamp(avg7 / g.sleep, 0, 1) * 60;
  const regScore = bedSd == null ? 0 : clamp(1 - bedSd / 90, 0, 1) * 25;
  const covScore = (covered / 7) * 15;
  const score = covered >= 3 ? Math.round(durScore + regScore + covScore) : null;

  // Mid-sleep on weekends against weekdays: a gap over an hour is "social jetlag".
  const mid = s => bedMin(s) + s.hours * 30;
  const isWeekend = s => [0, 6].includes(toDate(s.date).getDay());
  const we = w28.filter(isWeekend), wd = w28.filter(s => !isWeekend(s));
  const jetlag = we.length >= 2 && wd.length >= 3 ? mean(we.map(mid)) - mean(wd.map(mid)) : null;

  const byDow = Array.from({ length: 7 }, (_, i) => {
    const dow = (i + 1) % 7; // Monday first
    const xs = w28.filter(s => toDate(s.date).getDay() === dow).map(s => s.hours);
    return { dow, h: xs.length ? mean(xs) : null, n: xs.length };
  });
  return { g, today, nights, w7, w28, avg7, avgPrev, debt, bedSd, wakeSd, covered, score, jetlag, byDow, durScore, regScore, covScore };
}

export function sleepAnalytics() {
  const f = sleepFacts();
  const { g } = f;
  const logged = of('sleep').length;
  if (!logged) {
    return `<section class="card glass">
      <div class="money-top"><div><div class="label-sm">Sleep analysis</div><div class="big-md" style="color:var(--text-3)">No nights logged yet</div></div>
        <button class="pill-btn" data-act="sheet" data-sheet="sleep">${icon('plus')} Sleep</button></div>
      <p class="note" style="margin:8px 0 0">Log a few nights and this page turns into a sleep report: average against your ${g.sleep}h goal, sleep debt, bedtime regularity, weekday pattern and a score.</p>
    </section>`;
  }
  const trendLvl = f.avg7 == null ? ['none', 'No data this week']
    : f.avg7 >= g.sleep - 0.25 ? ['good', 'Meeting goal']
    : f.avg7 >= g.sleep - 1 ? ['ok', 'Slightly short'] : ['low', 'Chronically short'];
  const scoreLvl = f.score == null ? ['none', 'Need 3+ nights'] : f.score >= 80 ? ['good', 'Excellent'] : f.score >= 60 ? ['ok', 'Fair'] : ['low', 'Needs work'];
  const delta = f.avg7 != null && f.avgPrev != null ? f.avg7 - f.avgPrev : null;
  const beds = f.w7.map(bedMin), wakes = f.w7.map(s => toMin(s.wake));
  const bedAvg = beds.length ? mean(beds) : null, wakeAvg = wakes.length ? mean(wakes) : null;

  // 14 nights, oldest to newest, bars against the goal line.
  const days14 = f.nights(14);
  const top = Math.max(g.sleep + 2, ...days14.map(sleepOn));
  const bars = days14.map(d => {
    const h = sleepOn(d);
    return `<div class="hv-night${d === f.today ? ' cur' : ''}"><div class="hv-bar" style="--goal:${(g.sleep / top) * 100}%"><i class="${h >= g.sleep - 0.25 ? 'met' : ''}" style="height:${(h / top) * 100}%"></i></div><span>${initial(d)}</span></div>`;
  }).join('');

  // 30 nights as a line, with the 7-night average drawn through it.
  const days30 = f.nights(30);
  const raw = days30.map(d => sleepOn(d) || null);
  const smooth = days30.map((d, i) => {
    const win = raw.slice(Math.max(0, i - 6), i + 1).filter(Boolean);
    return win.length >= 3 ? mean(win) : null;
  });

  const dowMax = Math.max(g.sleep + 1, ...f.byDow.map(x => x.h ?? 0));
  const known = f.byDow.filter(x => x.h != null && x.n >= 2);
  const worst = known.length >= 4 ? known.reduce((a, b) => (b.h < a.h ? b : a)) : null;
  const dowName = dow => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dow];

  const short = f.w28.filter(s => s.hours < 6).length;
  const insights = [];
  if (f.avg7 != null) {
    const gap = g.sleep - f.avg7;
    insights.push(note('moon', 'sleep', gap <= 0.25
      ? `Averaging <b>${fmtHours(f.avg7)}</b> over ${plural(f.covered, 'night')}, on target for your ${g.sleep}h goal.`
      : `Averaging <b>${fmtHours(f.avg7)}</b>, <b>${fmtMins(gap * 60)}</b> a night under your ${g.sleep}h goal. Going to bed ${fmtMins(Math.min(gap * 60, 60))} earlier closes most of that.`));
  }
  if (delta != null && Math.abs(delta) >= 0.15) insights.push(note('chart', 'sleep', `${delta > 0 ? 'Up' : 'Down'} <b>${fmtMins(Math.abs(delta) * 60)}</b> a night on the week before (${fmtHours(f.avgPrev)}).`));
  if (f.debt >= 1) insights.push(note('bolt', 'move', f.debt >= 5
    ? `<b>${fmtMins(f.debt * 60)}</b> of sleep debt this week. That is enough to blunt strength, mood and appetite control; protect the next two nights before hard training.`
    : `<b>${fmtMins(f.debt * 60)}</b> of sleep debt this week. An extra 30 minutes for a few nights clears it.`));
  if (f.bedSd != null) insights.push(note('clock', 'sleep', f.bedSd < 30
    ? `Bedtime is steady, within about <b>±${fmtMins(f.bedSd)}</b>. Regular timing is as important as total hours.`
    : `Bedtime swings by about <b>±${fmtMins(f.bedSd)}</b>.${f.bedSd >= 60 ? ' An irregular schedule lowers sleep quality even when the hours add up; anchor your wake time first.' : ''}`));
  if (f.jetlag != null && Math.abs(f.jetlag) >= 45) insights.push(note('calendar', 'work', `Weekend sleep sits <b>${fmtMins(Math.abs(f.jetlag))} ${f.jetlag > 0 ? 'later' : 'earlier'}</b> than weekdays (social jetlag). Over an hour makes Monday feel like a time-zone change.`));
  if (worst && worst.h < g.sleep - 0.75) insights.push(note('info', 'sleep', `${dowName(worst.dow)} is your shortest night, averaging <b>${fmtHours(worst.h)}</b>.`));
  if (short) insights.push(note('info', 'move', `${plural(short, 'night')} under 6 hours in the last 28 days.`));
  if (f.covered < 7 && f.covered > 0) insights.push(note('info', 'sleep', `${f.covered} of the last 7 nights logged; averages use only those.`));

  return `
  <section class="card glass hv-hero an-hero">
    <div class="hv-top"><div><div class="label-sm">7-night average</div>
      <div class="big-xl">${f.avg7 != null ? fmtHours(f.avg7) : '–'}<small>goal ${g.sleep}h</small></div></div>
      <div class="an-side">${chip(trendLvl)}<button class="pill-btn" data-act="sheet" data-sheet="sleep">${icon('plus')} Sleep</button></div></div>
    <div class="stats an-stats4">
      ${stat('Sleep debt', f.covered ? fmtMins(f.debt * 60) : '–', '7 nights')}
      ${stat('Bedtime', bedAvg != null ? time12(fromMin(bedAvg)) : '–', f.bedSd != null ? `±${fmtMins(f.bedSd)}` : '')}
      ${stat('Wake', wakeAvg != null ? time12(fromMin(wakeAvg)) : '–', f.wakeSd != null ? `±${fmtMins(f.wakeSd)}` : '')}
      ${stat('vs last week', delta != null ? `${delta >= 0 ? '+' : '−'}${fmtMins(Math.abs(delta) * 60)}` : '–')}
    </div>
  </section>

  <section class="card glass">
    <div class="head"><div class="title">${tile('moon', 'sleep')}Sleep score</div>${chip(scoreLvl)}</div>
    <div class="an-score"><div class="big-xl">${f.score ?? '–'}<small>/ 100</small></div>
      <p class="note">How long you slept, how regular your bedtime was and how many nights you logged, over the last 7 nights.</p></div>
    <div class="macro-bars">
      ${meter('Duration', (f.durScore / 60) * 100, `${Math.round(f.durScore)} / 60`, 'var(--sleep)')}
      ${meter('Regular', (f.regScore / 25) * 100, `${Math.round(f.regScore)} / 25`, 'var(--work)')}
      ${meter('Logged', (f.covScore / 15) * 100, `${Math.round(f.covScore)} / 15`, 'var(--diet)')}
    </div>
  </section>

  <section class="card glass">
    <div class="head"><div class="title">Last 14 nights</div><div class="sub-note">dashed = goal</div></div>
    <div class="hv-nights an-dense" style="--n:14" role="img" aria-label="Hours slept over the last 14 nights">${bars}</div>
    <div class="head an-gap"><div class="title">30-night trend</div><div class="sub-note">line = 7-night average</div></div>
    ${lineChart({ series: [{ values: raw, color: 'rgba(100,98,184,.35)', straight: true }, { values: smooth, color: 'var(--sleep)' }], labels: days30.map((d, i) => (i === 29 ? 'Today' : i % 6 === 0 ? shortDate(d) : '')), max: Math.max(g.sleep + 2, ...days30.map(sleepOn)), min: 0, goal: g.sleep, empty: 'Log a few nights to see the trend.' })}
  </section>

  <section class="card glass">
    <div class="head"><div class="title">By day of week</div><div class="sub-note">last 28 days</div></div>
    <div class="hv-nights" role="img" aria-label="Average hours slept by weekday">${f.byDow.map(x => `<div class="hv-night${worst && worst.dow === x.dow ? ' cur' : ''}"><b>${x.h != null ? x.h.toFixed(1) : '–'}</b><div class="hv-bar" style="--goal:${(g.sleep / dowMax) * 100}%"><i class="${x.h >= g.sleep - 0.25 ? 'met' : ''}" style="height:${((x.h ?? 0) / dowMax) * 100}%"></i></div><span>${initial(addDays('2024-01-01', (x.dow + 6) % 7))}</span></div>`).join('')}</div>
    ${notes(insights)}
  </section>`;
}

// ============================================================
// BODY
// ============================================================
// Lean-bulk band: 0.25–0.5% of body weight a week, same as the rest of the app.
const BAND = [0.25, 0.5];

export function bodyAnalytics() {
  const ws = weights();
  const latest = ws.at(-1);
  if (!latest) {
    return `<section class="card glass">
      <div class="money-top"><div><div class="label-sm">Body composition</div><div class="big-md" style="color:var(--text-3)">No weigh-ins yet</div></div>
        <button class="pill-btn" data-act="sheet" data-sheet="weight">${icon('plus')} Weigh-in</button></div>
      <p class="note" style="margin:8px 0 0">Weigh in a few times a week. Loop smooths out day-to-day water swings into a real trend, then reads your rate of gain against a lean-bulk band, your calories and your projected weight.</p>
    </section>`;
  }
  const today = dayKey();
  const g = goals();
  const kg = latest.kg;
  const profile = state.kv.profile ?? {};

  // Trend weight: the mean of the weigh-ins in the 7 days up to each reading. Daily
  // noise (water, food in transit) averages out, so this is the number to steer by.
  const trendAt = i => {
    const win = ws.filter(w => w.date <= ws[i].date && daysBetween(w.date, ws[i].date) < 7);
    return mean(win.map(w => w.kg));
  };
  const trend = trendAt(ws.length - 1);
  const recent = ws.slice(-60);
  const recentIdx = ws.length - recent.length;
  const trendSeries = recent.map((_, i) => trendAt(recentIdx + i));

  const around = n => { const target = addDays(today, -n); const w = ws.filter(x => x.date <= target).at(-1); return w && daysBetween(w.date, target) <= Math.max(5, n / 3) ? w : null; };
  const change = n => { const a = around(n); return a ? kg - a.kg : null; };
  const [c7, c30, c90] = [change(7), change(30), change(90)];

  const fit28 = slope(ws.filter(w => w.date > addDays(today, -28)).map(w => ({ d: dayNo(w.date), y: w.kg })));
  const fit84 = slope(ws.filter(w => w.date > addDays(today, -84)).map(w => ({ d: dayNo(w.date), y: w.kg })));
  const rate = weeklyRate();
  const pctRate = rate != null ? (rate / kg) * 100 : null;

  let lvl = ['none', 'Need 2+ weeks of data'];
  if (pctRate != null) lvl = pctRate < 0 ? ['low', 'Losing weight'] : pctRate < BAND[0] ? ['ok', 'Gaining slowly'] : pctRate > BAND[1] ? ['ok', 'Gaining fast'] : ['good', 'Lean-bulk pace'];

  // Gauge from −0.5% to +1.0% of body weight a week, with the lean-bulk band shaded.
  const lo = -0.5, hi = 1.0, pos = v => clamp(((v - lo) / (hi - lo)) * 100, 0, 100);
  const gauge = pctRate == null ? '' : `<div class="an-gauge" role="img" aria-label="Weekly rate against the lean-bulk band">
      <div class="band" style="left:${pos(BAND[0])}%;width:${pos(BAND[1]) - pos(BAND[0])}%"></div>
      <i class="zero" style="left:${pos(0)}%"></i><i class="mark" style="left:${pos(pctRate)}%"></i></div>
    <div class="an-scale"><span>−0.5%</span><span style="left:${pos(0)}%">0</span><span class="band-l" style="left:${(pos(BAND[0]) + pos(BAND[1])) / 2}%">lean bulk ${BAND[0]}–${BAND[1]}%</span><span>+1%</span></div>`;

  // Energy: what the scale says you are in surplus by, against what your food log says.
  const kcalFromScale = rate != null ? (rate * 7700) / 7 : null; // ~7700 kcal per kg of body mass
  const logged14 = Array.from({ length: 14 }, (_, i) => kcalOn(addDays(today, -i))).filter(Boolean);
  const intake = logged14.length >= 5 ? mean(logged14) : null;
  const maint = maintenanceKcal(profile, kg);
  const kcalFromLog = intake != null && maint ? intake - maint : null;

  const height = Number(profile.height);
  const bmi = height > 100 ? kg / (height / 100) ** 2 : null;
  const bmiCat = bmi == null ? '' : bmi < 18.5 ? 'underweight' : bmi < 25 ? 'healthy range' : bmi < 30 ? 'overweight range' : 'obese range';
  const hr = height > 100 ? [18.5 * (height / 100) ** 2, 24.9 * (height / 100) ** 2] : null;

  const last28 = ws.filter(w => w.date > addDays(today, -28));
  const resid = fit28 && last28.length >= 5 ? sd(last28.map(w => w.kg - mean(last28.map(x => x.kg)))) : null;
  const gaps = last28.slice(1).map((w, i) => daysBetween(last28[i].date, w.date));
  const lastGap = daysBetween(latest.date, today);
  const range30 = ws.filter(w => w.date > addDays(today, -30)).map(w => w.kg);

  const proj = fit28 ? n => kg + (fit28.perWeek * n) : null;
  const insights = [];
  if (pctRate != null) {
    const [bl, bh] = [kg * BAND[0] / 100, kg * BAND[1] / 100];
    insights.push(note('scale', 'move', pctRate < 0
      ? `Trending <b>${signed(rate, 2)} kg/week</b>: a loss. If you are bulking, add roughly <b>${fmt(Math.abs(rate) * 1100 + 250)} kcal</b> a day.`
      : pctRate < BAND[0]
        ? `Gaining <b>${signed(rate, 2)} kg/week</b> (${signed(pctRate, 2)}% of body weight), under the ${bl.toFixed(2)}–${bh.toFixed(2)} kg band. Add about <b>${fmt(((bl - rate) * 7700) / 7)} kcal</b> a day to reach the low end.`
        : pctRate > BAND[1]
          ? `Gaining <b>${signed(rate, 2)} kg/week</b>, above the ${bl.toFixed(2)}–${bh.toFixed(2)} kg band. Past it, extra gain is increasingly fat; trim about <b>${fmt(((rate - bh) * 7700) / 7)} kcal</b> a day.`
          : `Gaining <b>${signed(rate, 2)} kg/week</b>, inside the ${bl.toFixed(2)}–${bh.toFixed(2)} kg lean-bulk band. Hold your current intake.`));
  }
  if (kcalFromScale != null && kcalFromLog != null) {
    const diff = kcalFromLog - kcalFromScale;
    insights.push(note('diet', 'diet', `The scale implies a surplus of <b>${signed(kcalFromScale, 0)} kcal/day</b>; your food log against estimated maintenance says <b>${signed(kcalFromLog, 0)}</b>. ${Math.abs(diff) < 250 ? 'They agree, so your logging and maintenance estimate look accurate.' : diff > 0 ? 'The log shows more than the scale, so meals are probably under-recorded or maintenance is set too low.' : 'The scale shows more than the log, so meals are probably under-recorded.'}`));
  } else if (kcalFromScale != null) {
    insights.push(note('diet', 'diet', `The scale implies a surplus of about <b>${signed(kcalFromScale, 0)} kcal/day</b>. Set your profile in Settings to compare with your food log.`));
  }
  if (fit28 && fit28.r2 < 0.4 && fit28.n >= 6) insights.push(note('info', 'move', `Weigh-ins are scattered (fit ${Math.round(fit28.r2 * 100)}%), so the weekly rate is a rough guide. Weigh in under the same conditions, ideally each morning.`));
  if (proj && Math.abs(fit28.perWeek) >= 0.02) insights.push(note('target', 'work', `At this rate you reach about <b>${proj(4).toFixed(1)} kg</b> in 4 weeks and <b>${proj(8).toFixed(1)} kg</b> in 8.`));
  if (lastGap >= 7) insights.push(note('clock', 'sleep', `Last weigh-in was ${lastGap} days ago. Weekly rate is only reliable with at least 2–3 readings a week.`));
  if (bmi != null) insights.push(note('info', 'sleep', `BMI <b>${fmt1(bmi)}</b> (${bmiCat}${hr ? `; ${fmt1(hr[0])}–${fmt1(hr[1])} kg at your height` : ''}). BMI cannot tell muscle from fat, so judge a bulk by rate and waist, not BMI alone.`));

  return `
  <section class="card glass hv-hero an-hero">
    <div class="hv-top"><div><div class="label-sm">Trend weight · ${shortDate(latest.date)}</div>
      <div class="big-xl">${trend.toFixed(1)}<small>kg · last ${latest.kg} kg</small></div></div>
      <div class="an-side">${chip(lvl)}<button class="pill-btn" data-act="sheet" data-sheet="weight">${icon('plus')} Weigh-in</button></div></div>
    <div class="stats an-stats4">
      ${stat('7 days', c7 != null ? `${signed(c7)}` : '–', 'kg')}
      ${stat('30 days', c30 != null ? `${signed(c30)}` : '–', 'kg')}
      ${stat('90 days', c90 != null ? `${signed(c90)}` : '–', 'kg')}
      ${stat('30-day range', range30.length > 1 ? `${(Math.max(...range30) - Math.min(...range30)).toFixed(1)}` : '–', 'kg')}
    </div>
  </section>

  <section class="card glass">
    <div class="head"><div class="title">Weight &amp; trend</div><div class="sub-note">bold = 7-day trend</div></div>
    ${lineChart({ series: [{ values: recent.map(w => w.kg), color: 'rgba(170,80,98,.35)', straight: true }, { values: trendSeries, color: 'var(--move)' }], labels: recent.map((w, i) => (i === 0 || i === recent.length - 1 ? shortDate(w.date) : '')), min: Math.min(...recent.map(w => w.kg)) - 1, max: Math.max(...recent.map(w => w.kg)) + 1, empty: 'Weigh in to build your trend.' })}
  </section>

  <section class="card glass">
    <div class="head"><div class="title">${tile('chart', 'move')}Rate of change</div>${chip(lvl)}</div>
    <div class="big-md">${rate != null ? `${signed(rate, 2)} kg/week` : '–'}${pctRate != null ? `<small class="muted"> ${signed(pctRate, 2)}% of body weight</small>` : ''}</div>
    ${gauge}
    <div class="stats an-stats3">
      ${stat('4-week fit', fit28 ? `${signed(fit28.perWeek, 2)}` : '–', 'kg/wk')}
      ${stat('12-week fit', fit84 ? `${signed(fit84.perWeek, 2)}` : '–', 'kg/wk')}
      ${stat('Consistency', fit28 ? `${Math.round(fit28.r2 * 100)}%` : '–', 'R²')}
    </div>
  </section>

  <section class="card glass">
    <div class="head"><div class="title">Energy balance &amp; outlook</div></div>
    <div class="stats an-stats3">
      ${stat('From scale', kcalFromScale != null ? signed(kcalFromScale, 0) : '–', 'kcal/day')}
      ${stat('From log', kcalFromLog != null ? signed(kcalFromLog, 0) : '–', 'kcal/day')}
      ${stat('Avg intake', intake != null ? fmt(intake) : '–', 'kcal')}
    </div>
    <div class="stats an-stats3 an-gap">
      ${stat('In 4 weeks', proj ? `${proj(4).toFixed(1)}` : '–', 'kg')}
      ${stat('In 8 weeks', proj ? `${proj(8).toFixed(1)}` : '–', 'kg')}
      ${stat('Noise', resid != null ? `±${resid.toFixed(1)}` : '–', 'kg')}
    </div>
    ${notes(insights)}
  </section>`;
}
