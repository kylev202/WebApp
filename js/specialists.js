// Health specialists: every Health tab has its own clinician. Each one reads the
// same numbers that tab's report is drawn from and gives a consult the way a
// specialist would at a follow-up: what they see and why it matters, what they
// expect to happen (with how sure they are and what the forecast rests on), a
// plan with real amounts and times, and when to see someone in person.
//
// The consult itself is rule-based, so it works offline and costs nothing. With
// Gemini connected, each specialist can also write a consult letter and answer
// questions in a chat, briefed with their own consult and the rest of your data.
import { state, setKV } from './store.js';
import { esc, uid, dayKey, addDays, daysBetween, shortDate, toDate, fmt, fmt1, fmtHours, time12, fromMin, toMin, mean, sum, plural, clamp, lastDays } from './util.js';
import { icon, tile } from './icons.js';
import { sheets, actions, forms, ui, render, refreshSheet, closeSheet, toast, haptic, closeBtn } from './core.js';
import { goals, of, sleepOn, waterOn, kcalOn, ageOf, heightInfo } from './data.js';
import { sleepFacts, bodyFacts } from './analytics.js';
import { dietFacts } from './diet-analytics.js';
import { gymFacts, status as trainingStatus, LEVELS } from './gym-analytics.js';
import { nextDay } from './gym.js';
import { targets, targetStatus } from './targets.js';
import { hasAI, generate, snapshot, runTool, undoCard } from './ai.js';
import { profileTools } from './profile.js';
import { signed, fmtMins, slope, dayNo } from './an-ui.js';
import { checkRead, profileNotes, profile } from './health-profile.js';

// ---------- the team ----------
export const DOCTORS = {
  overview: { name: 'Dr Maya Okafor', short: 'Dr Okafor', role: 'General Practitioner', area: 'sleep', tab: 'Overview',
    focus: 'the whole picture: how sleep, food, training and weight affect each other, and when something needs an in-person check',
    starters: ['How healthy am I overall right now?', 'What is the one thing I should fix first?', 'Is anything in my data worth seeing a doctor about?'] },
  gym: { name: 'Dr Leo Hartmann', short: 'Dr Hartmann', role: 'Sports & Exercise Physician', area: 'move', tab: 'Gym',
    focus: 'strength progress, training load, recovery and injury risk',
    starters: ['When will my bench go up next?', 'Am I training too much or too little?', 'Which muscle am I neglecting?'] },
  diet: { name: 'Priya Nair', short: 'Priya', role: 'Accredited Sports Dietitian', area: 'diet', tab: 'Diet',
    focus: 'calories, protein, meal timing, food quality and hydration for a lean bulk',
    starters: ['What should I eat tomorrow to hit my goals?', 'Is my protein spread well enough?', 'Cheap high-protein snacks for uni?'] },
  sleep: { name: 'Dr Sam Whitfield', short: 'Dr Whitfield', role: 'Sleep Physician', area: 'sleep', tab: 'Sleep',
    focus: 'sleep duration, timing, regularity, sleep debt and how sleep drives recovery and mood',
    starters: ['What bedtime should I aim for?', 'Why do I wake up tired?', 'How is my sleep affecting my gains?'] },
  body: { name: 'Dr Elena Ruiz', short: 'Dr Ruiz', role: 'Endocrinologist · body composition', area: 'work', tab: 'Body',
    focus: 'body-weight trend, rate of gain, energy balance, muscle versus fat gain and metabolic health',
    starters: ['How much of my gain is muscle?', 'When will I reach my goal weight?', 'Should I change my calories?'] },
};
const initials = name => name.replace(/^Dr\s+/, '').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

// ---------- building blocks ----------
const CONF = { high: ['good', 'High confidence'], moderate: ['ok', 'Moderate confidence'], low: ['none', 'Low confidence'] };
// More points and a tighter fit make a forecast worth more; an estimate never gets "high".
const confOf = (n, r2 = 1, cap = 'high') => {
  const c = n >= 8 && r2 >= 0.6 ? 'high' : n >= 4 && r2 >= 0.3 ? 'moderate' : 'low';
  const order = ['low', 'moderate', 'high'];
  return order[Math.min(order.indexOf(c), order.indexOf(cap))];
};
const finding = (ic, html, why = '') => ({ ic, html, why });
const predict = (label, value, conf, why, lever = '') => ({ label, value, conf, why, lever });
// alerts are raised by something in the data; flags are the standing advice every patient gets.
const blank = () => ({ level: ['none', 'Not enough data'], impression: '', findings: [], predictions: [], plan: [], alerts: [], flags: [], followUp: '', gaps: [] });
const bedMin = s => { const m = toMin(s.bed); return m < 720 ? m + 1440 : m; };
const clock = m => time12(fromMin(m));
const dateIn = days => shortDate(addDays(dayKey(), Math.max(0, Math.round(days))));
const plain = h => String(h ?? '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

// What every specialist says about in-person care, on top of their own red flags.
const IN_PERSON = 'Anything new, severe or getting worse (chest pain, fainting, shortness of breath, sudden weight change you can’t explain) needs a real GP, or 000 in an emergency.';

// ============================================================
// SLEEP PHYSICIAN
// ============================================================
function sleepConsult() {
  const f = sleepFacts(), g = f.g, c = blank();
  if (!f.w28.length) {
    c.impression = 'I can’t assess your sleep yet: there are no nights logged in the last four weeks.';
    c.plan = ['Log tonight’s bedtime and tomorrow’s wake time. Three to five nights are enough for a first read; two weeks for a proper one.'];
    c.gaps = ['Nights of sleep (bed and wake times)'];
    c.flags = ['Loud snoring, gasping in your sleep, or dozing off in lectures despite 7–8 hours in bed are signs of sleep apnoea and worth a GP visit.'];
    return c;
  }
  const avg = f.avg7 ?? mean(f.w28.map(s => s.hours));
  const short = g.sleep - avg;
  const wakeAvg = mean((f.w7.length ? f.w7 : f.w28).map(s => toMin(s.wake)));
  const bedAvg = mean((f.w7.length ? f.w7 : f.w28).map(bedMin));
  const lastNight = sleepOn(dayKey()) || null;
  const under6 = f.w28.filter(s => s.hours < 6).length;
  const irregular = f.bedSd != null && f.bedSd >= 45;

  c.level = short <= 0.25 && !irregular ? ['good', 'Healthy pattern'] : short <= 1 && f.debt < 5 ? ['ok', 'Mildly short'] : ['low', 'Sleep-restricted'];
  c.impression = `You’re averaging <b>${fmtHours(avg)}</b> a night against the <b>${g.sleep} h</b> you need${f.debt >= 1 ? `, carrying <b>${fmtMins(f.debt * 60)}</b> of sleep debt this week` : ''}. `
    + (f.bedSd != null ? (irregular ? `Your bedtime moves about <b>±${fmtMins(f.bedSd)}</b> night to night, which matters as much as the hours. ` : 'Your timing is regular, which is a real strength. ') : '')
    + ({ good: 'From a sleep point of view you’re recovering well; keep protecting it.', ok: 'Nothing alarming, but you’re leaving recovery on the table.', low: 'This is enough restriction to hold back strength, appetite control, mood and study, so it’s my first priority for you.' }[c.level[0]]);

  // ---- findings ----
  c.findings.push(finding('moon', short <= 0.25 ? `Duration on target: <b>${fmtHours(avg)}</b> average.` : `Short by about <b>${fmtMins(short * 60)}</b> a night (${fmtHours(avg)} vs ${g.sleep} h).`,
    'Muscle repair, growth hormone release and memory consolidation all happen mostly in deep and REM sleep. Regularly sleeping under 7 h is linked to slower strength gains, more hunger and lower mood.'));
  if (f.debt >= 1) c.findings.push(finding('bolt', `<b>${fmtMins(f.debt * 60)}</b> of sleep debt over the last 7 nights.`, 'Debt adds up quietly: a week of 1 h short nights impairs reaction time and focus about as much as a night without sleep, even though it rarely feels that way.'));
  if (f.bedSd != null) c.findings.push(finding('clock', `Bedtime averages <b>${clock(bedAvg)}</b> (±${fmtMins(f.bedSd)}), wake <b>${clock(wakeAvg)}</b>${f.wakeSd != null ? ` (±${fmtMins(f.wakeSd)})` : ''}.`, 'Your body clock sets when you feel sleepy and alert. An irregular schedule gives you lighter, less restorative sleep even when the total hours look fine.'));
  if (f.jetlag != null && Math.abs(f.jetlag) >= 45) c.findings.push(finding('calendar', `Weekend sleep sits <b>${fmtMins(Math.abs(f.jetlag))}</b> ${f.jetlag > 0 ? 'later' : 'earlier'} than weekdays.`, 'This “social jetlag” makes Monday feel like flying across a time zone, which is why the start of the week often drags.'));
  if (under6) c.findings.push(finding('alert', `${plural(under6, 'night')} under 6 hours in the last 4 weeks.`, 'Under 6 hours is where the effects on recovery, injury risk and immunity become measurable.'));
  if (f.avgPrev != null && f.avg7 != null && Math.abs(f.avg7 - f.avgPrev) >= 0.25) c.findings.push(finding('chart', `${f.avg7 > f.avgPrev ? 'Up' : 'Down'} <b>${fmtMins(Math.abs(f.avg7 - f.avgPrev) * 60)}</b> a night on the week before.`, f.avg7 > f.avgPrev ? 'Moving the right way.' : 'Worth catching early before it becomes a pattern; look at what changed this week (deadlines, shifts, late screens).'));

  // ---- predictions ----
  const fit = slope(f.w28.map(s => ({ d: dayNo(s.date), y: s.hours })));
  if (fit) {
    const next = clamp(avg + fit.perWeek, 3, 12);
    const conf = confOf(fit.n, Math.max(fit.r2, Math.abs(fit.perWeek) < 0.1 ? 0.6 : fit.r2));
    c.predictions.push(predict('Next week’s average', fmtHours(next), conf,
      Math.abs(fit.perWeek) < 0.1
        ? `Across ${plural(fit.n, 'night')} your sleep has been flat week to week, so next week most likely looks like this one.`
        : `Across ${plural(fit.n, 'night')} over 4 weeks your sleep is ${fit.perWeek > 0 ? 'lengthening' : 'shortening'} by about <b>${fmtMins(Math.abs(fit.perWeek) * 60)}</b> a night each week. If that continues, next week averages ${fmtHours(next)}.`,
      next < g.sleep - 0.25 ? `Going to bed ${fmtMins(Math.min(60, (g.sleep - next) * 60))} earlier would bring it to your goal.` : ''));
  } else {
    c.predictions.push(predict('Next week’s average', fmtHours(avg), 'low', 'There aren’t enough nights across enough days to see a trend yet, so the best forecast is this week repeated.'));
  }
  if (f.debt >= 0.5) {
    const nights = Math.ceil(f.debt / 0.5);
    c.predictions.push(predict('Sleep debt cleared', `by ${dateIn(nights)}`, 'moderate',
      `${fmtMins(f.debt * 60)} of debt repaid at 30 extra minutes a night takes ${plural(nights, 'night')}. That pace repays it without shifting your body clock the way one long weekend lie-in would.`,
      'If you change nothing, the debt stays and adds to next week’s.'));
  }
  const ready = readiness();
  c.predictions.push(predict('Tomorrow’s readiness', `${ready.label} (${ready.score}/100)`, ready.conf, ready.why, ready.lever));

  // ---- plan ----
  const lightsOut = wakeAvg - g.sleep * 60 - 15;
  c.plan.push(`Keep your wake time at <b>${clock(wakeAvg)}</b> every day, weekends included (within 30 minutes). A fixed wake time is the anchor everything else hangs off.`);
  c.plan.push(`Lights out by <b>${clock(lightsOut)}</b>. That gives ${g.sleep} h of sleep plus ~15 minutes to fall asleep.`);
  c.plan.push(`Last caffeine by <b>${clock(lightsOut - 8 * 60)}</b>. Caffeine’s half-life is about 5–6 hours, so an afternoon coffee is still half in your system at midnight.`);
  if (f.debt >= 1) c.plan.push(`Add <b>30 minutes</b> a night until the debt is gone (about ${plural(Math.ceil(f.debt / 0.5), 'night')}), and skip the hardest session of the week if you’re still short by then.`);
  if (irregular || bedAvg > 24 * 60 + 30) c.plan.push('Get 10 minutes of outdoor light within an hour of waking. Morning light is the strongest signal for moving a late body clock earlier.');
  if (short > 0.5) c.plan.push('Start a 30–45 minute wind-down: dim lights, phone across the room, nothing stressful (assignments, banking) in that window.');
  if (f.jetlag != null && Math.abs(f.jetlag) >= 60) c.plan.push('On weekends, stay up late if you want, but get up within an hour of your weekday time and nap 20 minutes early afternoon if needed.');

  // ---- red flags ----
  if (avg < 6) c.alerts.push('You’re averaging under 6 hours. If you’re in bed long enough but can’t fall or stay asleep, three or more nights a week for 3 months, that fits insomnia. A GP can refer you for CBT-I, which works better than sleeping pills.');
  c.flags.push('Loud snoring, gasping or choking at night, morning headaches, or dozing off in lectures despite 7–8 hours in bed can be sleep apnoea. That needs a GP and possibly a sleep study.');
  if (f.covered < 7) c.gaps.push(`${7 - f.covered} of the last 7 nights aren’t logged, so the averages lean on fewer nights.`);
  c.followUp = 'Review in 7 nights: I’ll check that the bedtime held and the debt is shrinking.';
  return c;
}

// How ready the body is to train hard tomorrow: last night, the week’s debt,
// yesterday’s food and this week’s load. Shared by the sleep physician and the GP.
function readiness() {
  const g = goals(), t = dayKey();
  let score = 100;
  const why = [];
  const last = sleepOn(t) || null;
  if (last != null) {
    const s = Math.max(0, g.sleep - last);
    if (s > 0.25) { score -= Math.min(30, s * 12); why.push(`last night was ${fmtMins(s * 60)} short`); } else why.push('last night met your goal');
  } else { score -= 5; why.push('last night isn’t logged'); }
  let debt = 0;
  try { debt = sleepFacts().debt; } catch { /* no sleep data */ }
  if (debt >= 5) { score -= 15; why.push(`${fmtMins(debt * 60)} of weekly sleep debt`); } else if (debt >= 2) { score -= 7; why.push(`${fmtMins(debt * 60)} of weekly sleep debt`); }
  const y = addDays(t, -1), yk = kcalOn(y);
  if (yk && yk < g.kcal * 0.8) { score -= 10; why.push(`yesterday’s food was ${fmt(g.kcal - yk)} kcal under target`); }
  let acwr = null;
  try { acwr = of('workout').length ? gymFacts().acwr : null; } catch { /* no training data */ }
  if (acwr != null && acwr > 1.3) { score -= 12; why.push(`training load is ${acwr.toFixed(2)}× your 4-week average`); }
  score = Math.round(clamp(score, 0, 100));
  const label = score >= 80 ? 'High' : score >= 60 ? 'Moderate' : 'Low';
  return {
    score, label,
    conf: last != null ? 'moderate' : 'low',
    why: `Based on: ${why.join(', ')}.`,
    lever: score < 80 ? (score < 60 ? 'Train lighter tomorrow (keep the weights, drop a set per exercise) and get to bed on time.' : 'Fine to train; save PR attempts for a better-rested day.') : '',
  };
}

// ============================================================
// SPORTS DIETITIAN
// ============================================================
const PROTEIN_FOODS = '200 g Greek yoghurt ≈ 20 g, a whey shake ≈ 25 g, 100 g cooked chicken ≈ 31 g, 3 eggs ≈ 19 g, a 95 g tin of tuna ≈ 22 g, 250 ml milk ≈ 8 g';

function dietConsult() {
  const c = blank();
  if (!of('meal').length) {
    c.impression = 'I don’t have any food logged to look at yet.';
    c.plan = ['Log everything you eat for three normal days, including drinks and snacks. Three days is enough for a first read.'];
    c.gaps = ['Meals with calories and protein'];
    c.flags = ['If you have a medical condition, food allergies or a history of disordered eating, have an accredited dietitian set your targets in person.'];
    return c;
  }
  const f = dietFacts(), g = f.g;
  if (!f.d28.length) {
    c.impression = 'Only today is logged so far, and today isn’t finished. Give me a few complete days and I can read the pattern.';
    c.plan = ['Log every meal for the next three days.'];
    c.gaps = ['At least 3 complete days of meals'];
    return c;
  }
  const kcal = f.kcal7 ?? mean(f.d28.map(x => x.kcal));
  const prot = f.prot7 ?? f.prot28;
  const kg = f.kg;
  const perMealTarget = kg ? Math.max(20, Math.round((kg * 0.4) / 5) * 5) : 30;
  const water7 = lastDays(8).slice(0, 7).map(waterOn).filter(Boolean);
  const waterAvg = water7.length ? mean(water7) : null;

  c.level = f.score == null ? ['none', 'Need 4+ days'] : f.score >= 80 ? ['good', 'Well fuelled'] : f.score >= 60 ? ['ok', 'Partly fuelled'] : ['low', 'Under-fuelled'];
  const kcalGap = g.kcal - kcal, protGap = g.protein - prot;
  c.impression = `Over your recent logged days you’re eating <b>${fmt(kcal)} kcal</b> and <b>${fmt(prot)} g protein</b> against targets of ${fmt(g.kcal)} and ${fmt(g.protein)}. `
    + (Math.abs(kcalGap) <= g.kcal * 0.05 ? 'Calories are right where a bulk needs them. ' : kcalGap > 0 ? `You’re about <b>${fmt(kcalGap)} kcal</b> a day short, which is the most common reason a bulk stalls. ` : `You’re about <b>${fmt(-kcalGap)} kcal</b> a day over, which speeds up fat gain more than muscle. `)
    + (protGap > 10 ? (kcalGap > g.kcal * 0.05 ? `Protein is also <b>${fmt(protGap)} g</b> under your goal.` : `Protein is <b>${fmt(protGap)} g</b> under, so that’s the first thing I’d fix.`) : 'Protein is covered, which is the hardest part.');

  // ---- findings ----
  if (f.surplus != null) c.findings.push(finding('flame', `Eating an estimated <b>${fmt(Math.abs(f.surplus))} kcal/day ${f.surplus >= 0 ? 'above' : 'below'}</b> maintenance (~${fmt(f.maint)} kcal).`, 'A lean bulk works best at roughly +250 to +500 kcal a day. Less and you mostly maintain; more and the extra goes to fat faster than muscle can be built.'));
  if (f.perKg != null) c.findings.push(finding('shaker', `Protein is <b>${fmt1(f.perKg)} g/kg</b> of body weight (target range 1.6–2.2).`, 'Above about 1.6 g/kg, nearly all the muscle-building benefit of protein is captured; under it, you leave gains behind no matter how well you train.'));
  if (f.meals28.length >= 6) {
    const share = Math.round((f.rich / f.meals28.length) * 100);
    c.findings.push(finding('plate', `<b>${share}%</b> of meals carry ${perMealTarget} g+ protein${f.concentration != null ? `; your biggest meal holds ${Math.round(f.concentration)}% of the day’s protein` : ''}.`, `Muscle responds to each protein feeding, up to about 0.4 g/kg (≈${perMealTarget} g for you) per meal. Three to five good feeds beat one huge dinner.`));
  }
  if (f.cv != null) c.findings.push(finding('chart', `Day-to-day calories swing by <b>${Math.round(f.cv)}%</b>.`, f.cv > 20 ? 'Swings this big hide your real weight trend and usually mean some days are badly under target.' : 'Steady enough that the scale trend can be trusted.'));
  if (f.lateShare != null && f.lateShare >= 25) c.findings.push(finding('moon', `<b>${Math.round(f.lateShare)}%</b> of timed calories land after 9 pm.`, 'Large late meals can push back sleep onset and lighten deep sleep. A protein-rich snack before bed is fine; a full dinner at 11 pm is not ideal.'));
  if (f.top5Share != null && f.foodDays >= 7 && f.top5Share >= 70) c.findings.push(finding('leaf', `Five foods make up <b>${Math.round(f.top5Share)}%</b> of what you log (${f.variety} different foods in 8 weeks).`, 'A narrow rotation is easy to stick to but tends to run short on fibre, iron, calcium, omega-3 and vitamins.'));
  if (f.pattern && Math.abs(f.pattern.weKcal - f.pattern.wdKcal) >= f.pattern.wdKcal * 0.15) c.findings.push(finding('calendar', `Weekends average <b>${fmt(f.pattern.weKcal)} kcal</b> vs ${fmt(f.pattern.wdKcal)} on weekdays.`, f.pattern.weKcal > f.pattern.wdKcal ? 'Weekend overshoot can quietly double a surplus.' : 'Weekends are where the bulk is losing ground.'));
  if (waterAvg != null) c.findings.push(finding('drop', `Water averages <b>${fmt1(waterAvg)}</b> of ${g.water} glasses.`, 'Even mild dehydration (2% of body weight) measurably reduces strength and focus.'));

  // ---- predictions ----
  if (f.surplus != null) {
    const kg4 = (f.surplus * 28) / 7700;
    const atTarget = ((g.kcal - f.maint) * 28) / 7700;
    c.predictions.push(predict('Weight change in 4 weeks', `${signed(kg4, 1)} kg`, confOf(f.covered, 1, 'moderate'),
      `You’ve averaged ${fmt(kcal)} kcal against an estimated maintenance of ${fmt(f.maint)}: about ${signed(f.surplus, 0)} kcal a day. Roughly 7,700 kcal is one kilo of body mass, so 4 weeks of this lands near ${signed(kg4, 1)} kg. Maintenance is an estimate, so the Body tab’s scale trend is the referee.`,
      Math.abs(atTarget - kg4) >= 0.2 ? `Eating your ${fmt(g.kcal)} kcal target instead would make it ${signed(atTarget, 1)} kg.` : ''));
  } else c.gaps.push('Your age, height and activity (Bulk calculator) so I can estimate maintenance and forecast weight from your food.');
  if (f.covered >= 4) {
    const hitRate = f.onProt / f.covered;
    c.predictions.push(predict('Protein goal days next week', `${Math.round(hitRate * 7)} of 7`, confOf(f.covered, 1, 'moderate'),
      `You hit ${g.protein} g on ${f.onProt} of your last ${plural(f.covered, 'logged day')}. Habits repeat, so next week most likely looks the same.`,
      hitRate < 0.7 ? `Adding one ${perMealTarget} g protein snack a day would make it about ${Math.min(7, Math.round(hitRate * 7) + 3)} of 7.` : ''));
  }
  if (f.score != null && f.protScore < 27) {
    const better = Math.min(100, Math.round(f.score + (30 - f.protScore)));
    c.predictions.push(predict('Bulk score if protein is closed', `${f.score} → ${better}`, 'moderate',
      'Protein carries 30 of the 100 points. Hitting it daily is the single biggest move available on this score.'));
  }

  // ---- plan ----
  if (kcalGap > g.kcal * 0.05) c.plan.push(`Add <b>~${fmt(Math.round(kcalGap / 50) * 50)} kcal</b> a day. Easiest wins: 250 ml full-cream milk + banana + 30 g peanut butter (≈ 480 kcal), or an extra serve of rice/pasta at dinner (≈ 200 kcal per cup).`);
  else if (kcalGap < -g.kcal * 0.1) c.plan.push(`Trim <b>~${fmt(Math.round(-kcalGap / 50) * 50)} kcal</b> a day: start with liquid calories and late snacks, not protein.`);
  if (protGap > 10) c.plan.push(`Close the <b>${fmt(protGap)} g</b> protein gap. Options: ${PROTEIN_FOODS}.`);
  c.plan.push(`Aim for <b>${perMealTarget} g protein</b> in each of 3–5 meals, spread 3–5 hours apart, with one within a couple of hours after training.`);
  if (f.cv != null && f.cv > 20) c.plan.push('Put breakfast and one snack on autopilot (same foods most days). Fixed anchors are the fastest way to steady a swingy intake.');
  if (f.lateShare != null && f.lateShare >= 25) c.plan.push('Move your biggest meal at least 2–3 hours before bed; keep the late snack small and protein-based (yoghurt, milk, casein).');
  if (f.top5Share != null && f.top5Share >= 70) c.plan.push('Add two colours of fruit or veg a day and rotate protein (fish twice a week, legumes once) to widen the micronutrient net.');
  if (waterAvg != null && waterAvg < g.water - 1) c.plan.push(`Drink ${Math.ceil(g.water - waterAvg)} more glasses a day: one on waking, one with each meal, one at the gym.`);

  // ---- red flags ----
  if (kcal < 1500) c.alerts.push('You’re averaging under 1,500 kcal while training. Long term that risks low energy availability: fatigue, frequent illness, poor bone health and hormonal changes. Please see a GP or dietitian in person.');
  if (f.perKg != null && f.perKg > 3) c.alerts.push('Protein is above 3 g/kg. That’s generally safe for healthy kidneys, but check with a GP if you have any kidney condition.');
  c.flags.push('If you have a medical condition, food allergies, or a difficult relationship with food or your body, have an accredited dietitian set these targets with you in person.');
  if (f.covered < f.possible * 0.7) c.gaps.push(`Only ${f.covered} of the last ${f.possible} days have food logged; unlogged days make averages less reliable.`);
  c.followUp = 'Review in 2 weeks, alongside the scale trend on the Body tab.';
  return c;
}

// ============================================================
// SPORTS & EXERCISE PHYSICIAN
// ============================================================
// Weekly sets per coarse muscle group before it is clearly under-dosed. Legs cover
// quads, hamstrings, glutes and calves, so they want more than a single muscle.
const GROUP_MIN = { chest: 10, back: 10, shoulders: 8, legs: 16, arms: 8 };

function gymConsult() {
  const c = blank();
  if (!of('workout').length) {
    c.impression = 'No training logged yet. Once you finish a few sessions I can track strength, load and recovery.';
    c.plan = [nextDay() ? `Start <b>${esc(nextDay().name)}</b> from the Gym tab and log every set.` : 'Pick a routine on the Gym tab and log your first session.'];
    c.gaps = ['Logged workouts with sets, weights and reps'];
    c.flags = ['Sharp or joint pain, pain that lingers more than a few days, swelling, numbness or tingling: stop that movement and see a physio or sports doctor.'];
    return c;
  }
  const f = gymFacts(), st = trainingStatus(f);
  let debt = 0;
  try { debt = sleepFacts().debt; } catch { /* no sleep */ }
  c.level = st.lvl;
  c.impression = `${st.text} `
    + (f.adherence != null ? `You’ve completed <b>${f.adherence}%</b> of your planned sessions over 4 weeks. ` : '')
    + (f.tracked.length ? `I’m tracking ${plural(f.tracked.length, 'main lift')}${f.idxDelta != null ? `, with your strength index ${f.idxDelta >= 0 ? 'up' : 'down'} <b>${signed(f.idxDelta)}%</b> in four weeks` : ''}.` : 'Repeat the same lifts a few times and I can start forecasting them.');

  // ---- findings ----
  if (f.acwr != null) c.findings.push(finding('bolt', `This week’s load is <b>${f.acwr.toFixed(2)}×</b> your 4-week average.`, '0.8–1.3× is the sweet spot: enough stress to adapt, little enough to recover. Sudden jumps above 1.5× are where overuse injuries cluster.'));
  if (f.gap != null && f.gap >= 5) c.findings.push(finding('clock', `Last session was <b>${plural(f.gap, 'day')}</b> ago.`, 'Strength holds for about 2–3 weeks off; muscle size a little longer. Short breaks are harmless, long ones cost momentum.'));
  const stalled = f.lifts.filter(l => l.stalled && !l.bw);
  if (stalled.length) c.findings.push(finding('flag', `Stalled: ${stalled.slice(0, 3).map(l => `<b>${esc(l.name)}</b> (no PR in ${l.sincePR} sessions)`).join(', ')}.`, 'Three or more sessions without a new best usually means the stimulus has gone stale, or recovery (sleep, food) isn’t keeping up.'));
  const under = f.perMuscle.filter(m => GROUP_MIN[m.m] && m.avg4 < GROUP_MIN[m.m] * 0.7);
  if (under.length) c.findings.push(finding('muscle', `Under-trained: ${under.map(m => `<b>${m.name}</b> ${fmt1(m.avg4)} sets/wk`).join(', ')}.`, 'Below roughly 10 hard sets a week per muscle, growth is slow. These are your easiest gains.'));
  const over = f.perMuscle.filter(m => GROUP_MIN[m.m] && m.sets > GROUP_MIN[m.m] * 2.2);
  if (over.length) c.findings.push(finding('alert', `Very high volume this week: ${over.map(m => `<b>${m.name}</b> ${m.sets} sets`).join(', ')}.`, 'Past about 20–25 hard sets a week for one muscle, recovery usually fails before the muscle grows more.'));
  if (f.pat.push >= 10 && f.pat.pull / f.pat.push < 0.8) c.findings.push(finding('repeat', `Pulling is <b>${Math.round((f.pat.pull / f.pat.push) * 100)}%</b> of your pushing volume.`, 'Pressing much more than you pull rounds the shoulders forward and is a common route to shoulder pain. Aim for at least 1:1.'));
  if (f.pat.quad >= 8 && f.pat.hinge / f.pat.quad < 0.5) c.findings.push(finding('repeat', `Hip-hinge work is only <b>${Math.round((f.pat.hinge / f.pat.quad) * 100)}%</b> of your quad work.`, 'Weak hamstrings and glutes relative to quads raise hamstring-strain and knee risk.'));
  if (debt >= 5) c.findings.push(finding('moon', `You’re carrying <b>${fmtMins(debt * 60)}</b> of sleep debt this week.`, 'Short sleep lowers maximal strength and roughly doubles injury risk in athletes. It’s the Sleep tab’s job, but it shows up in my numbers.'));

  // ---- predictions ----
  const forecastable = f.lifts.filter(l => !l.bw && l.fit && l.sessions >= 4).slice(0, 3);
  forecastable.forEach(l => {
    const w = l.fit.perWeek;
    if (w > 0.05) {
      const in4 = l.now + w * 4, in8 = l.now + w * 4 + w * 4 * 0.8;
      c.predictions.push(predict(`${l.name} (est. 1RM)`, `${fmt1(in4)} kg in 4 wks · ${fmt1(in8)} in 8`, confOf(l.fit.n, l.fit.r2),
        `Your estimated 1-rep max has been climbing about <b>${fmt1(w)} kg a week</b> across ${plural(l.fit.n, 'session')} (fit ${Math.round(l.fit.r2 * 100)}%). Progress slows as you get stronger, so weeks 5–8 are discounted by 20%.`,
        l.std && l.lvl < 5 ? `Next level, ${LEVELS[l.lvl + 1]} (${fmt1(l.std[l.lvl])} kg), around ${dateIn(((l.std[l.lvl] - l.peak) / w) * 7)} at this rate.` : ''));
    } else {
      c.predictions.push(predict(`${l.name} (est. 1RM)`, `Flat near ${fmt1(l.now)} kg`, confOf(l.fit.n, 0.6, 'moderate'),
        `It has ${w < -0.05 ? 'slipped' : 'not moved'} over ${plural(l.fit.n, 'session')}${l.stalled ? ` and your best was ${plural(l.sincePR, 'session')} ago` : ''}. Without a change it will most likely stay here for the next 4 weeks.`,
        'Change the stimulus: a new rep range (e.g. 5×5 if you’ve been doing 3×10), or a close variation for 4 weeks, then come back.'));
    }
  });
  if (!forecastable.length) c.gaps.push('At least 4 sessions of the same lift (with weight) across 6+ days to forecast it.');
  if (f.acwr != null) {
    let risk = f.acwr > 1.5 ? 2 : f.acwr > 1.3 ? 1 : 0;
    if (debt >= 5) risk++;
    const label = ['Low', 'Moderate', 'Elevated', 'High'][Math.min(3, risk)];
    c.predictions.push(predict('Overuse-injury risk, next 2 weeks', label, 'moderate',
      `Load ratio ${f.acwr.toFixed(2)}× (ideal 0.8–1.3)${debt >= 5 ? `, plus ${fmtMins(debt * 60)} of sleep debt` : ''}. Risk climbs with sudden spikes in load and with poor sleep; it isn’t about how heavy you lift, but how fast it changed.`,
      risk >= 2 ? 'Hold volume flat for a week (no new sets) and sleep 30 minutes more.' : ''));
  }
  if (f.r?.perWeek) {
    const cur = f.weekStats.at(-1).n;
    const daysLeft = 6 - ((toDate(dayKey()).getDay() + 6) % 7);
    const usual = mean(f.weekStats.slice(-5, -1).map(x => x.n));
    const expect = Math.min(f.r.perWeek, cur + Math.round((usual * daysLeft) / 7));
    c.predictions.push(predict('Sessions this week', `${expect} of ${f.r.perWeek}`, 'moderate',
      `${plural(cur, 'session')} done, ${plural(daysLeft, 'day')} left, and you usually train ${fmt1(usual)} times a week.`,
      expect < f.r.perWeek ? `Booking the next session into your Day timeline now makes it far more likely to happen.` : ''));
  }

  // ---- plan ----
  if (st.key === 'overreaching') c.plan.push('Deload this week: same exercises and weights, about 40% fewer sets. You’ll come back stronger, not weaker.');
  if (st.key === 'unproductive') c.plan.push('Check recovery before adding work: sleep at goal and calories at target for two weeks usually restarts progress.');
  if (st.key === 'detraining') c.plan.push('Restart at about 80% of your previous weights for the first week, then build back over 2–3 weeks.');
  if (st.key === 'recovering') c.plan.push('If this isn’t a planned deload, add one session or 2 sets per main lift back this week.');
  if (under.length) c.plan.push(`Add weekly sets where you’re under-dosed: ${under.map(m => `<b>+${Math.max(2, Math.ceil(GROUP_MIN[m.m] - m.avg4))}</b> ${m.name.toLowerCase()}`).join(', ')}. Add 2–4 a week at a time, spread over two sessions per muscle, so recovery keeps up.`);
  stalled.slice(0, 2).forEach(l => c.plan.push(`<b>${esc(l.name)}</b>: drop to 90% of your last weight, rebuild over 3 weeks with an extra rep each session, or swap to a close variation for a block.`));
  if (f.pat.push >= 10 && f.pat.pull / f.pat.push < 0.8) c.plan.push(`Add <b>${Math.ceil((f.pat.push - f.pat.pull) / 4)} sets</b> of rows or face pulls a week to even out push and pull.`);
  if (st.key === 'productive' || (!c.plan.length && st.key !== 'building')) c.plan.unshift(`${st.key === 'productive' ? 'Keep the core of the programme: it’s working. ' : ''}When every set reaches the top of its rep range, add 2.5 kg (upper body) or 5 kg (lower body).`);
  if (f.adherence != null && f.adherence < 70) c.plan.push(`You’re averaging fewer sessions than the ${f.r.perWeek}-day plan. A plan you can keep beats a perfect one: consider a ${Math.max(2, f.r.perWeek - 1)}-day split.`);

  // ---- red flags ----
  if (f.acwr != null && f.acwr > 1.5) c.alerts.push('Your load jumped over 1.5× this week. Any new joint or tendon ache now is a warning, not something to train through.');
  c.flags.push('Sharp or joint pain, pain that lingers more than a few days, swelling, clicking with pain, numbness or tingling: stop that movement and see a physio or sports doctor.');
  c.flags.push('Chest pain, unusual breathlessness, dizziness or palpitations during exercise: stop and see a GP before training again.');
  c.followUp = 'Review after your next 4 sessions, when the lift forecasts will have firmed up.';
  return c;
}

// ============================================================
// BODY COMPOSITION (ENDOCRINOLOGY)
// ============================================================
function bodyConsult() {
  const c = blank();
  const f = bodyFacts();
  if (!f) {
    c.impression = 'No weigh-ins yet, so I can’t read your trend.';
    c.plan = ['Weigh in 3–4 mornings a week, after the bathroom and before eating or drinking. I’ll smooth out the daily water swings.'];
    c.gaps = ['Weigh-ins (ideally 3+ a week)'];
    c.flags = ['Losing more than 5% of your body weight in a month without trying needs a GP check.'];
    return c;
  }
  const { kg, trend, rate, pctRate, BAND, fit28, resid, proj } = f;
  const band = [kg * BAND[0] / 100, kg * BAND[1] / 100];
  c.level = pctRate == null ? ['none', 'Need 2+ weeks'] : pctRate < 0 ? ['low', 'Losing'] : pctRate < BAND[0] ? ['ok', 'Gaining slowly'] : pctRate > BAND[1] ? ['ok', 'Gaining fast'] : ['good', 'Lean-bulk pace'];
  c.impression = `Your trend weight is <b>${trend.toFixed(1)} kg</b>${rate != null ? `, moving <b>${signed(rate, 2)} kg a week</b> (${signed(pctRate, 2)}% of body weight)` : ''}. `
    + (pctRate == null ? 'I need about two weeks of weigh-ins to read a rate reliably.'
      : pctRate < 0 ? 'For a bulk, that’s the wrong direction: the body is short of energy.'
      : pctRate < BAND[0] ? `That’s under the lean-bulk band of ${band[0].toFixed(2)}–${band[1].toFixed(2)} kg a week, so muscle gain will be slower than it could be.`
      : pctRate > BAND[1] ? 'That’s above the lean-bulk band; beyond it, more of each extra kilo tends to be fat.'
      : 'That’s inside the lean-bulk band, which is the best ratio of muscle to fat gain for most people.');

  // ---- findings ----
  if (f.c30 != null) c.findings.push(finding('scale', `<b>${signed(f.c30)} kg</b> over 30 days${f.c90 != null ? `, ${signed(f.c90)} kg over 90` : ''}.`, 'Read the trend, not the day: a single weigh-in can swing 1–2 kg with water, salt, carbs and food in transit.'));
  if (f.kcalFromScale != null && f.kcalFromLog != null) {
    const diff = f.kcalFromLog - f.kcalFromScale;
    c.findings.push(finding('diet', `Scale says <b>${signed(f.kcalFromScale, 0)} kcal/day</b>; food log says <b>${signed(f.kcalFromLog, 0)}</b>.`, Math.abs(diff) < 250 ? 'They agree, so your maintenance estimate and logging are trustworthy.' : diff > 0 ? 'Your log shows more surplus than the scale. Either your maintenance is higher than estimated (you burn more) or some days aren’t fully logged.' : 'The scale shows more surplus than the log, which usually means unlogged snacks, drinks or oils.'));
  }
  if (resid != null) c.findings.push(finding('chart', `Daily noise around your trend is <b>±${resid.toFixed(1)} kg</b>.`, resid > 0.8 ? 'That’s a lot of scatter, so weigh under the same conditions each time.' : 'Low scatter, so the trend is reliable.'));
  if (f.bmi != null) c.findings.push(finding('info', `BMI <b>${fmt1(f.bmi)}</b> (${f.bmiCat}).`, 'BMI can’t tell muscle from fat; a lifter on a bulk can read “overweight” while lean. Waist size is the better check.'));
  if (f.lastGap >= 5) c.findings.push(finding('clock', `Last weigh-in was <b>${plural(f.lastGap, 'day')}</b> ago.`, 'A rate is only reliable with 2–3 readings a week.'));

  // ---- predictions ----
  if (proj && fit28) {
    const conf = confOf(fit28.n, fit28.r2);
    const u = n => (resid ?? 0.5) + Math.abs(fit28.perWeek) * n * (1 - fit28.r2) * 0.5 + 0.05 * n;
    const span = n => `${(proj(n) - u(n)).toFixed(1)}–${(proj(n) + u(n)).toFixed(1)}`;
    c.predictions.push(predict('Weight in 4 / 8 / 12 weeks', `${proj(4).toFixed(1)} · ${proj(8).toFixed(1)} · ${proj(12).toFixed(1)} kg`, conf,
      `A straight line through ${plural(fit28.n, 'weigh-in')} over the last 4 weeks (fit ${Math.round(fit28.r2 * 100)}%) runs at ${signed(fit28.perWeek, 2)} kg a week. Likely ranges: ${span(4)}, ${span(8)}, ${span(12)} kg; they widen further out because small daily choices compound.`));
    const t = targets().find(x => x.metric === 'weight');
    if (t) {
      const s = targetStatus(t);
      const dir = Math.sign(t.to - kg);
      if (Math.abs(t.to - kg) < 0.3) c.predictions.push(predict(`Reaching ${fmt1(t.to)} kg`, 'Essentially there', 'high', 'You’re within normal daily noise of your target.'));
      else if (fit28.perWeek * dir > 0.02) {
        const weeks = (t.to - kg) / fit28.perWeek;
        const eta = addDays(dayKey(), Math.round(weeks * 7));
        c.predictions.push(predict(`Reaching ${fmt1(t.to)} kg`, `around ${shortDate(eta)}`, conf,
          `${fmt1(Math.abs(t.to - kg))} kg to go at ${signed(fit28.perWeek, 2)} kg a week is about ${plural(Math.round(weeks), 'week')}.${t.due ? ` Your deadline is ${shortDate(t.due)}, so you’d be ${eta <= t.due ? `${plural(daysBetween(eta, t.due), 'day')} early` : `${plural(daysBetween(t.due, eta), 'day')} late`}.` : ''}`,
          t.due && eta > t.due ? `To land on time you’d need ${signed((t.to - kg) / Math.max(1, daysBetween(dayKey(), t.due) / 7), 2)} kg a week, about ${fmt(Math.abs(((t.to - kg) / Math.max(1, daysBetween(dayKey(), t.due))) * 7700 - fit28.perWeek * 1100))} kcal a day ${dir > 0 ? 'more' : 'less'}.` : ''));
      } else c.predictions.push(predict(`Reaching ${fmt1(t.to)} kg`, 'Not at this rate', 'moderate', `Your trend is ${fit28.perWeek * dir < 0 ? 'moving away from' : 'flat against'} the target, so it won’t arrive without a change in calories.${s.note ? ` (${s.note}.)` : ''}`));
    }
    if (fit28.perWeek > 0.05) {
      const gain8 = fit28.perWeek * 8;
      const lean = pctRate != null && pctRate <= BAND[1] ? [0.5, 0.7] : [0.3, 0.5];
      c.predictions.push(predict('Of the next 8 weeks’ gain', `≈ ${fmt1(gain8 * lean[0])}–${fmt1(gain8 * lean[1])} kg lean`, 'low',
        `You’re on course to gain about ${fmt1(gain8)} kg. With progressive training, a ${pctRate <= BAND[1] ? 'lean-bulk pace usually puts half to two-thirds' : 'faster pace usually puts only a third to a half'} of gain into lean tissue (muscle, glycogen, water); the rest is fat. This is a rule of thumb, not a measurement: only a DEXA scan can tell for sure.`,
        pctRate > BAND[1] ? 'Slowing to the band would shift that split toward muscle.' : ''));
    }
    if (f.bmi != null && f.height > 100) {
      const b12 = proj(12) / (f.height / 100) ** 2;
      if (f.bmi < 25 && b12 >= 25) c.predictions.push(predict('BMI in 12 weeks', fmt1(b12), 'low', 'Crosses 25 at this rate. For a lifter that can still be lean, so track your waist alongside it.'));
    }
  } else c.gaps.push('Weigh-ins spread across at least 6 days (ideally 2–4 weeks) to fit a trend.');

  // ---- plan ----
  if (pctRate != null) {
    if (pctRate < 0) c.plan.push(`Add about <b>${fmt(Math.abs(rate) * 1100 + 250)} kcal</b> a day to turn the loss into a lean gain.`);
    else if (pctRate < BAND[0]) c.plan.push(`Add about <b>${fmt(Math.round((((band[0] - rate) * 7700) / 7) / 50) * 50)} kcal</b> a day to reach the bottom of the lean-bulk band.`);
    else if (pctRate > BAND[1]) c.plan.push(`Trim about <b>${fmt(Math.round((((rate - band[1]) * 7700) / 7) / 50) * 50)} kcal</b> a day to slow into the band.`);
    else c.plan.push('Hold your current intake. Reassess in 2 weeks; if the rate drops under the band, add 150 kcal.');
  }
  c.plan.push('Weigh 3–4 mornings a week: after the bathroom, before food or water, same scale, same spot.');
  c.plan.push('Measure your waist at the navel every 2 weeks. On a lean bulk it should rise no faster than ~1 cm per kilo gained.');
  c.plan.push('Gain goes to muscle only if training progresses, so the Gym tab’s strength index should be rising alongside your weight.');

  // ---- red flags ----
  if (f.c30 != null && f.c30 < -kg * 0.05) c.alerts.push(`You’ve lost ${fmt1(-f.c30)} kg (over 5%) in a month. If that wasn’t intended, see a GP: unexplained loss can come from thyroid, gut or other medical causes.`);
  if (rate != null && rate > 1) c.alerts.push('Gaining over 1 kg a week. If it comes with swollen ankles, puffiness or breathlessness it may be fluid, not tissue; see a GP.');
  c.flags.push('Persistent tiredness, feeling cold, hair loss or big appetite changes alongside weight changes are worth a GP blood test (thyroid, iron).');
  c.followUp = 'Review in 2 weeks with at least 6 more weigh-ins.';
  return c;
}

// ============================================================
// GENERAL PRACTITIONER
// ============================================================
const LEVEL_SCORE = { good: 85, ok: 65, low: 40 };

function gpConsult() {
  const c = blank(), g = goals();
  const safe = fn => { try { return fn(); } catch (err) { console.error(err); return null; } };
  const team = ['sleep', 'diet', 'gym', 'body'].map(k => ({ k, d: DOCTORS[k], c: safe(CONSULTS[k]) })).filter(x => x.c);
  const scored = team.filter(x => x.c.level[0] !== 'none');
  let sleepScore = null, dietScore = null;
  try { sleepScore = sleepFacts().score; } catch { /* none */ }
  try { dietScore = of('meal').length ? dietFacts().score : null; } catch { /* none */ }
  const scoreOf = x => (x.k === 'sleep' && sleepScore != null ? sleepScore : x.k === 'diet' && dietScore != null ? dietScore : LEVEL_SCORE[x.c.level[0]]);
  const parts = scored.map(scoreOf);
  const index = parts.length >= 2 ? Math.round(mean(parts)) : null;
  c.team = team;
  c.index = index;

  const low = scored.filter(x => x.c.level[0] === 'low');
  c.level = index == null ? ['none', 'Building a picture'] : index >= 78 ? ['good', 'In good shape'] : index >= 60 ? ['ok', 'Room to improve'] : ['low', 'Needs attention'];
  c.impression = index == null
    ? 'I don’t have enough logged across sleep, food, training and weight to give an overall picture yet. Each specialist below says what they need.'
    : `Putting your four specialists’ reads together, your overall wellbeing index is <b>${index}/100</b>. `
      + (low.length ? `${low.length > 1 ? 'The areas' : 'The area'} holding you back most ${low.length > 1 ? 'are' : 'is'} <b>${low.map(x => DOCTORS[x.k].tab.toLowerCase()).join(' and ')}</b>, and because these systems feed each other, fixing ${low.length > 1 ? 'them' : 'it'} lifts the others too.` : 'No area is in trouble; the gains now come from consistency.');

  // ---- cross-system findings: the GP's real job ----
  let sf = null, df = null, gf = null, bf = null;
  try { sf = of('sleep').length ? sleepFacts() : null; } catch { /* none */ }
  try { df = of('meal').length ? dietFacts() : null; } catch { /* none */ }
  try { gf = of('workout').length ? gymFacts() : null; } catch { /* none */ }
  try { bf = bodyFacts(); } catch { /* none */ }
  const st = gf ? trainingStatus(gf) : null;
  if (sf?.debt >= 4 && gf?.acwr > 1.2) c.findings.push(finding('alert', `Sleep debt (<b>${fmtMins(sf.debt * 60)}</b>) on top of a heavy training week (${gf.acwr.toFixed(2)}× load).`, 'This combination is the most common setup for injury, illness and burnout in people who train. One of the two needs to give this week.'));
  if (df?.kcal7 != null && df.kcal7 < g.kcal * 0.9 && bf?.pctRate != null && bf.pctRate < 0.25) c.findings.push(finding('diet', `Eating <b>${fmt(g.kcal - df.kcal7)} kcal</b> under target, and weight is ${bf.pctRate < 0 ? 'falling' : 'barely moving'}.`, 'Training can only build what food pays for. This is why the bulk isn’t showing on the scale.'));
  if (st && ['maintaining', 'unproductive'].includes(st.key) && (sf?.avg7 != null && sf.avg7 < g.sleep - 0.75)) c.findings.push(finding('moon', 'Strength has stalled while sleep runs short.', 'Recovery, not effort, is the likely limit. Fix sleep before changing the programme.'));
  if (st && ['maintaining', 'unproductive'].includes(st.key) && df?.perKg != null && df.perKg < 1.6) c.findings.push(finding('shaker', `Strength has stalled and protein is <b>${fmt1(df.perKg)} g/kg</b>.`, 'Below 1.6 g/kg, muscle repair is under-supplied regardless of training.'));
  if (df?.lateShare >= 30 && sf?.avg7 != null && sf.avg7 < g.sleep - 0.5) c.findings.push(finding('clock', 'Late eating and short sleep are showing up together.', 'Big late meals delay sleep, and short sleep raises next-day hunger; each feeds the other.'));
  const loggedDays = lastDays(7).filter(d => of('meal', d).length || of('sleep', d).length || of('workout', d).length || of('weight', d).length).length;
  c.findings.push(finding('list', `You logged something on <b>${loggedDays} of the last 7 days</b>.`, loggedDays >= 6 ? 'Thorough records make every forecast here sharper.' : 'Gaps in the log make every specialist’s forecast less certain.'));
  team.forEach(x => { const top = x.c.findings[0]; if (top && x.c.level[0] === 'low') c.findings.push(finding(top.ic, `${DOCTORS[x.k].short}: ${top.html}`, top.why)); });

  // ---- predictions ----
  const ready = readiness();
  c.predictions.push(predict('Tomorrow’s readiness', `${ready.label} (${ready.score}/100)`, ready.conf, ready.why, ready.lever));
  const biggest = scored.filter(x => x.c.level[0] !== 'good').sort((a, b) => scoreOf(a) - scoreOf(b))[0];
  if (biggest && index != null) {
    const gain = Math.round((85 - scoreOf(biggest)) / Math.max(1, parts.length));
    c.predictions.push(predict('Biggest lever', `${DOCTORS[biggest.k].tab}: +${Math.max(1, gain)} points`, 'moderate',
      `${DOCTORS[biggest.k].tab} is your lowest-scoring area. Bringing it up to “good” would lift your index from ${index} to about ${Math.min(100, index + Math.max(1, gain))}, and usually improves the others too.`,
      biggest.c.plan[0] ? `Start with: ${biggest.c.plan[0]}` : ''));
  }
  team.forEach(x => { const p = x.c.predictions.find(y => y.conf !== 'low' && !/readiness/i.test(y.label)); if (p) c.predictions.push({ ...p, label: `${DOCTORS[x.k].tab} · ${p.label}` }); });

  // ---- plan: the top action from whoever needs it most ----
  [...low, ...scored.filter(x => x.c.level[0] === 'ok'), ...team.filter(x => x.c.level[0] === 'none')].forEach(x => { if (x.c.plan[0] && c.plan.length < 4) c.plan.push(`<b>${DOCTORS[x.k].tab}:</b> ${x.c.plan[0]}`); });
  if (!c.plan.length) c.plan.push('Keep doing what you’re doing, and keep logging so I can spot changes early.');

  // ---- red flags: only the conditional ones from the team, plus the GP's own ----
  team.forEach(x => x.c.alerts.forEach(a => c.alerts.push(`<b>${DOCTORS[x.k].tab}:</b> ${a}`)));
  c.flags.push(IN_PERSON);
  c.flags.push('Feeling low, anxious or overwhelmed for more than two weeks is worth a GP visit too. Uni counselling services are free, and Lifeline is 13 11 14, any time.');
  team.forEach(x => x.c.gaps.forEach(gp => c.gaps.push(`${DOCTORS[x.k].tab}: ${gp}`)));
  c.followUp = 'I’ll re-read everything each day. Open any specialist’s tab for their full consult.';
  return c;
}

// ============================================================
// THE HEALTH PROFILE IN EACH CONSULT
// ============================================================
// Every specialist reads the latest health check, but only for their own
// questions: the GP owns blood pressure, heart age and the in-person flags; the
// body specialist owns body fat and lean mass; the sports physician reads resting
// heart rate as fitness; the dietitian reads diabetes risk and blood lipids as
// food; the sleep physician reads a high resting pulse against short nights.
const PROFILE_HINT = 'Settings → Health profile';
const CHECK_OLD = 365;

function withProfile(key, c) {
  const r = checkRead();
  const p = profile();
  const h = heightInfo();
  const age = ageOf();
  const v = k => r?.m?.[k];
  const word = k => r?.by[k]?.grade?.[1]?.toLowerCase() ?? '';
  const lv = k => r?.by[k]?.grade?.[0];
  // Only worth saying when the report's own word disagrees with ours.
  const said = k => { const rep = r?.by[k]?.reported; return rep && rep.toLowerCase() !== word(k) ? ` (the report said “${esc(rep)}”)` : ''; };
  const plan = x => { if (c.plan.length < 7 && !c.plan.includes(x)) c.plan.push(x); };
  const sleepShort = (() => { try { const f = sleepFacts(); return f.avg7 != null && f.avg7 < goals().sleep - 0.5 ? f.avg7 : null; } catch { return null; } })();

  if (key === 'overview') {
    // Height is the body specialist's to ask for, so it isn't asked for twice.
    const miss = [!p.sex && 'sex', !age && 'age'].filter(Boolean);
    if (miss.length) c.gaps.push(`Your ${miss.join(', ')} in ${PROFILE_HINT}.`);
    if (!r) {
      c.gaps.push('A health check (blood pressure, resting heart rate, diabetes risk). Many pharmacies do one free in about 10 minutes; add the results in ' + PROFILE_HINT + '.');
      return c;
    }
    const n = r.rows.length, bad = r.flagged;
    c.findings.unshift(finding('medical', `Health check ${r.when}: <b>${n - bad.length} of ${n}</b> results in range${bad.length ? `; <b>${bad.map(x => esc(x.label.toLowerCase())).join(', ')}</b> to watch` : ''}.`,
      r.age > CHECK_OLD ? 'That check is over a year old, so treat it as history rather than where you are now.' : 'I read these alongside your logs: a single reading is a snapshot, the logs show what happens every day.'));
    if (v('bpSys') != null) {
      const bp = `${v('bpSys')}/${v('bpDia')}`;
      c.findings.push(finding('heart', `Blood pressure <b>${bp} mmHg</b>: ${word('bp')}${said('bp')}.`, r.by.bp.grade[2] + (lv('bp') === 'good' ? ' Training and a low-salt diet help keep it there.' : '')));
      if (v('bpSys') >= 140 || v('bpDia') >= 90) c.alerts.push(`Blood pressure read ${bp} at your ${r.when} check. One high reading isn’t a diagnosis, but it needs a GP to recheck it, ideally within a month.`);
      if (v('bpSys') >= 130 && v('bpSys') < 140) plan(`Recheck your blood pressure in 3–6 months (${bp} is high-normal). Sit for 5 minutes first, no coffee for 30.`);
    }
    if (v('hr') != null && lv('hr') !== 'good') {
      c.findings.push(finding('heart', `Resting heart rate <b>${v('hr')} bpm</b>: ${word('hr')}${said('hr')}.`,
        `${r.by.hr.grade[2]} At a kiosk it is often raised by walking in, caffeine, nerves or a short night${sleepShort ? `, and you’re averaging ${fmtHours(sleepShort)} at the moment` : ''}. A reading taken after 5 quiet minutes on a different day tells you more.`));
      plan(`Take your own resting pulse on 3 mornings this week, before getting up: count 30 seconds, double it. Under 80 means the check caught you on a busy moment; still 85+ means it’s real, so ask ${DOCTORS.gym.short} on the Gym tab about conditioning.`);
      if (v('hr') > 100) c.alerts.push(`Resting heart rate was ${v('hr')} bpm at your check. If it’s over 100 at rest again, or comes with palpitations, dizziness or chest discomfort, see a GP.`);
    }
    if (v('heartAge') != null) {
      if (age) {
        const d = Math.round(v('heartAge') - age);
        c.findings.push(finding('heart', `Heart age <b>${v('heartAge')}</b> against a real age of ${age}: ${d > 0 ? `<b>${d} year${d > 1 ? 's' : ''} older</b>` : 'at or under your age'}${said('heartAge')}.`,
          'Heart age is a 10-year risk estimate built from blood pressure, cholesterol, smoking, diabetes and weight. At your age the absolute risk is tiny, so read it as a direction, not a danger; the inputs that moved it are the ones to work on.'));
        if (d >= 10) c.alerts.push(`Heart age came out ${d} years above your real age. Worth asking a GP for a cholesterol test and a proper blood-pressure check.`);
      } else c.gaps.push(`Your age (heart age ${v('heartAge')} can’t be judged without it).`);
    }
    if (v('diabetes') != null) {
      c.findings.push(finding('drop', `Diabetes risk score <b>${v('diabetes')} points</b>: ${word('diabetes')}${said('diabetes')}.`, r.by.diabetes.grade[2] + ' The score counts things you can’t change (age, family history, background) and things you can (waist, activity, diet).'));
      if (v('diabetes') >= 6) plan(`Mention your diabetes risk score (${v('diabetes')}) at your next GP visit and ask whether a fasting glucose or HbA1c is worth doing; ${DOCTORS.diet.short} on the Diet tab can turn it into a food plan.`);
      if (v('diabetes') >= 12) c.alerts.push(`A diabetes risk score of ${v('diabetes')} is in the high band: a GP should check your blood glucose.`);
    }
    for (const k of ['glucose', 'hba1c', 'cholTotal', 'ldl', 'hdl', 'trig', 'spo2']) {
      if (v(k) == null) continue;
      const row = r.by[k];
      if (lv(k) !== 'good') c.findings.push(finding('drop', `${esc(row.label)} <b>${row.value} ${row.unit}</b>: ${word(k)}.`, row.grade[2]));
      if (lv(k) === 'low') c.alerts.push(`${row.label} ${row.value} ${row.unit} (${word(k)}) at your ${r.when} check: take this to a GP.`);
    }
    if (p.family) c.findings.push(finding('users', `Family history: ${esc(p.family)}.`, 'Family history raises the stakes on the numbers you can change, and changes how often a GP will want to check them.'));
    if (r.age > CHECK_OLD) plan('Book a fresh health check: your last one is over a year old.');
    else c.followUp = `${c.followUp} Next health check due around ${shortDate(addDays(r.c.date, r.flagged.length ? 182 : CHECK_OLD))}.`.trim();
    return c;
  }

  if (key === 'body') {
    if (!h) c.gaps.push(`Your height in ${PROFILE_HINT} (needed for BMI and lean-mass maths).`);
    else if (h.source === 'check') c.gaps.push(`Confirm your height in ${PROFILE_HINT}: I’m using ${h.cm} cm, worked out from your check’s weight and BMI.`);
    if (!r) return c;
    if (v('bodyFat') != null) {
      c.findings.push(finding('muscle', `Body fat <b>${v('bodyFat')}%</b> at your ${r.when} check: ${word('bodyFat')}${said('bodyFat')}.`,
        `${r.by.bodyFat.grade[2]} Kiosk and scale readings use bio-impedance, which can be 3–5 points out either way and shifts with hydration, so compare readings from the same machine at the same time of day.`));
      if (r.lean) c.findings.push(finding('scale', `That puts lean mass at about <b>${fmt1(r.lean)} kg</b>${r.ffmi ? ` and a fat-free mass index of <b>${fmt1(r.ffmi)}</b>` : ''}.`,
        r.ffmi ? `FFMI is lean mass for your height. ${r.ffmi < 18 ? 'Under 18 is below average for a man, so there is plenty of room to build.' : r.ffmi < 20 ? '18–20 is average for a man who trains a little; a few years of good training typically adds 2–4 points.' : r.ffmi < 22 ? '20–22 is well above average, the mark of consistent training.' : '22+ is excellent; progress from here is slow and earned.'}` : 'Add your height and I can put that against your frame.'));
      if (v('bodyFat') <= 12 && p.sex !== 'female') c.findings.push(finding('info', 'At this body fat a surplus is the right call.', 'You have room to gain without needing to diet down later; the lean-bulk band is what keeps the ratio of muscle to fat good.'));
      if (lv('bodyFat') === 'low') c.alerts.push(`Body fat read ${v('bodyFat')}%, below essential levels. If you also feel cold, tired or your libido or periods have changed, see a GP.`);
      plan('Re-measure body fat on the same machine every 8–12 weeks, same time of day, after the bathroom and before eating, and read the change rather than the number.');
    }
    for (const k of ['waist', 'visceral', 'muscle']) {
      if (v(k) == null) continue;
      const row = r.by[k];
      c.findings.push(finding('scale', `${esc(row.label)} <b>${row.value} ${row.unit}</b>${row.grade?.[1] ? `: ${row.grade[1].toLowerCase()}` : ''}.`, row.grade?.[2] ?? ''));
    }
    return c;
  }

  if (!r) return c;

  if (key === 'gym') {
    if (v('hr') != null && v('hr') > 80) {
      c.findings.push(finding('heart', `Resting heart rate <b>${v('hr')} bpm</b> at your ${r.when} check${said('hr')}.`,
        'For someone who lifts, a resting pulse in the 80s–90s usually means the aerobic base is behind the strength. It also slows recovery between sets and between sessions.'));
      plan('Add two 25–30 minute zone-2 sessions a week (brisk incline walk, bike or rower, able to talk in full sentences) on non-leg days or after upper sessions. Expect resting heart rate to fall 5–10 bpm over 8–12 weeks, without costing strength.');
    } else if (v('hr') != null && v('hr') < 60) c.findings.push(finding('heart', `Resting heart rate <b>${v('hr')} bpm</b>: a good aerobic base.`, 'That helps recovery between hard sets and sessions.'));
    if (v('heartAge') != null && age && v('heartAge') > age) plan('Keep the cardio in even on a bulk: it is the training lever on heart age and blood pressure.');
    return c;
  }

  if (key === 'sleep') {
    if (v('hr') != null && v('hr') > 80 && sleepShort) c.findings.push(finding('heart', `Resting heart rate was <b>${v('hr')} bpm</b> at your check, and sleep is running short.`, 'Short sleep keeps the nervous system on alert and pushes resting heart rate up; a week of full nights often takes several beats off it.'));
    return c;
  }

  if (key === 'diet') {
    if (v('diabetes') != null && v('diabetes') >= 6) {
      c.findings.push(finding('drop', `Diabetes risk score <b>${v('diabetes')} points</b> (${word('diabetes')}) at your ${r.when} check.`, 'A bulk doesn’t have to raise it: what moves the risk is fibre, whole foods and staying lean, not total calories on their own.'));
      plan('Build the surplus from oats, rice, potatoes, wholegrain bread, fruit, milk and nuts rather than lollies, juice and soft drink; aim for 30 g of fibre a day.');
    }
    for (const k of ['glucose', 'hba1c', 'cholTotal', 'ldl', 'trig']) {
      if (v(k) == null || lv(k) === 'good') continue;
      const row = r.by[k];
      c.findings.push(finding('drop', `${esc(row.label)} <b>${row.value} ${row.unit}</b> (${word(k)}).`, row.grade[2]));
    }
    if (['ldl', 'cholTotal', 'trig'].some(k => v(k) != null && lv(k) !== 'good')) plan('For the lipids: swap butter and fatty meats for olive oil, fish twice a week, legumes and nuts; it changes LDL within 6–8 weeks.');
    if (p.allergies) c.findings.push(finding('alert', `Allergies or intolerances on file: ${esc(p.allergies)}.`, 'I’ll keep food suggestions clear of these.'));
    return c;
  }
  return c;
}

const CONSULTS = Object.fromEntries(Object.entries({ overview: gpConsult, gym: gymConsult, diet: dietConsult, sleep: sleepConsult, body: bodyConsult })
  .map(([k, fn]) => [k, () => withProfile(k, fn())]));
export const consultFor = key => CONSULTS[key]?.();

// ============================================================
// RENDERING
// ============================================================
const open = () => (ui.consultOpen ??= {});
const avatar = (d, cls = '') => `<div class="cs-avatar ${cls}" style="--dc:var(--${d.area});--dc-bg:var(--${d.area}-bg);--dc-ink:var(--${d.area}-ink)" aria-hidden="true">${initials(d.name)}<i>${icon('medical')}</i></div>`;
const chipHtml = ([lv, text]) => `<span class="hv-chip lv-${lv}">${text}</span>`;
const fmtAI = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/^[-•*] (.+)$/gm, '• $1').replace(/\n/g, '<br>');

function predHtml(p) {
  return `<div class="cs-pred"><div class="cs-pred-top"><span class="cs-pred-l">${p.label}</span>${chipHtml(CONF[p.conf])}</div>
    <div class="cs-pred-v">${p.value}</div>
    <p class="cs-why"><b>Why:</b> ${p.why}</p>${p.lever ? `<p class="cs-lever">${icon('target')}<span>${p.lever}</span></p>` : ''}</div>`;
}

export function consultCard(key) {
  const d = DOCTORS[key];
  let c;
  try { c = consultFor(key); } catch (err) { console.error('Loop: consult failed', key, err); return ''; }
  if (!c) return '';
  const isOpen = !!open()[key];
  const letter = consultLetters()[`${key}:${dayKey()}`];
  const team = key === 'overview' && c.team?.length ? `<div class="cs-team">${c.team.map(x => `<button class="cs-member" data-act="segTab" data-key="health" data-tab="${x.k}">${avatar(DOCTORS[x.k], 'sm')}<div class="grow"><div class="t">${DOCTORS[x.k].short}</div><div class="d">${DOCTORS[x.k].role}</div></div>${chipHtml(x.c.level)}</button>`).join('')}</div>` : '';
  const shown = c.predictions.slice(0, 2);
  return `<section class="card glass consult" style="--dc:var(--${d.area});--dc-bg:var(--${d.area}-bg);--dc-ink:var(--${d.area}-ink)">
    <div class="cs-head">${avatar(d)}<div class="grow"><div class="cs-name">${d.name}</div><div class="cs-role">${d.role} · consult ${shortDate(dayKey())}</div></div>${chipHtml(c.level)}</div>
    ${key === 'overview' && c.index != null ? `<div class="cs-index"><div class="big-xl">${c.index}<small>/ 100 wellbeing index</small></div><div class="track"><div class="fill" style="width:${c.index}%"></div></div></div>` : ''}
    <p class="cs-impression">${c.impression}</p>
    ${c.alerts.length ? `<div class="cs-alert">${icon('alert')}<div>${c.alerts[0]}${c.alerts.length > 1 ? ` <small>+${c.alerts.length - 1} more in the full consult</small>` : ''}</div></div>` : ''}
    ${team}
    ${shown.length ? `<div class="cs-label">${icon('chart')}What I expect</div><div class="cs-preds">${shown.map(predHtml).join('')}</div>` : ''}
    <details class="cs-more" data-consult="${key}" ${isOpen ? 'open' : ''}>
      <summary><span>${isOpen ? 'Hide full consult' : 'Full consult'}</span><small>${[c.findings.length && plural(c.findings.length, 'finding'), c.predictions.length > shown.length && `${plural(c.predictions.length - shown.length, 'more forecast')}`, c.plan.length && `${c.plan.length}-step plan`].filter(Boolean).join(' · ')}</small>${icon('chevron')}</summary>
      ${letter ? `<div class="cs-letter"><div class="cs-label">${icon('sparkle')}Consult letter</div><p>${fmtAI(letter)}</p></div>` : ''}
      ${c.findings.length ? `<div class="cs-label">${icon('search')}What I see</div><ul class="cs-findings">${c.findings.map(x => `<li>${icon(x.ic)}<div><div>${x.html}</div>${x.why ? `<small>${x.why}</small>` : ''}</div></li>`).join('')}</ul>` : ''}
      ${c.predictions.length > shown.length ? `<div class="cs-label">${icon('chart')}More forecasts</div><div class="cs-preds">${c.predictions.slice(shown.length).map(predHtml).join('')}</div>` : ''}
      ${c.plan.length ? `<div class="cs-label">${icon('list')}My plan for you</div><ol class="cs-plan">${c.plan.map(x => `<li>${x}</li>`).join('')}</ol>` : ''}
      ${c.alerts.length || c.flags.length ? `<div class="cs-label">${icon('alert')}See someone in person if</div><ul class="cs-flags">${c.alerts.map(x => `<li class="hot">${x}</li>`).join('')}${c.flags.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}
      ${c.gaps.length ? `<div class="cs-label">${icon('info')}What would sharpen this</div><ul class="cs-gaps">${c.gaps.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}
      ${c.followUp ? `<p class="cs-follow">${icon('calendar')}<span>${c.followUp}</span></p>` : ''}
    </details>
    <div class="cs-actions">
      <button class="btn soft" data-act="sheet" data-sheet="specialist" data-spec="${key}">${icon('sparkle')} Ask ${d.short}</button>
      ${hasAI() ? `<button class="pill-btn" data-act="consultLetter" data-spec="${key}" ${letterPending.has(key) ? 'disabled' : ''}>${letterPending.has(key) ? 'Writing…' : letter ? 'Rewrite letter' : 'Write my letter'}</button>` : ''}
    </div>
    <p class="cs-disc">An AI specialist reading your logs: guidance, not a diagnosis.</p>
  </section>`;
}

// <details> toggles natively; remember it so a redraw doesn't snap it shut.
document.addEventListener('toggle', e => {
  const el = e.target;
  if (!el.matches?.('details[data-consult]')) return;
  open()[el.dataset.consult] = el.open;
  const s = el.querySelector('summary > span');
  if (s) s.textContent = el.open ? 'Hide full consult' : 'Full consult';
}, true);

// ============================================================
// AI: consult letters and the specialist chat
// ============================================================
const consultLetters = () => state.kv.consults ?? {};
const chats = () => state.kv.specChats ?? {};
const letterPending = new Set();
let busySpec = null;
const aiText = res => res.candidates?.[0]?.content?.parts?.filter(p => p.text && !p.thought).map(p => p.text).join('').trim() ?? '';

function consultNotes(key) {
  const c = consultFor(key);
  if (!c) return '(nothing yet)';
  const lines = [`Overall: ${c.level[1]}.`, `Impression: ${plain(c.impression)}`];
  c.findings.forEach(x => lines.push(`Finding: ${plain(x.html)} (${plain(x.why)})`));
  c.predictions.forEach(p => lines.push(`Forecast: ${plain(p.label)} = ${plain(p.value)} [${p.conf} confidence]. Why: ${plain(p.why)}${p.lever ? ` Lever: ${plain(p.lever)}` : ''}`));
  c.plan.forEach(x => lines.push(`Plan: ${plain(x)}`));
  c.alerts.forEach(x => lines.push(`ALERT from the data: ${plain(x)}`));
  c.flags.forEach(x => lines.push(`Red flag guidance: ${plain(x)}`));
  c.gaps.forEach(x => lines.push(`Missing data: ${plain(x)}`));
  return lines.join('\n');
}

function specialistPrompt(key) {
  const d = DOCTORS[key];
  const others = Object.entries(DOCTORS).filter(([k]) => k !== key).map(([, o]) => `${o.name} (${o.role}, ${o.tab} tab)`).join('; ');
  return `You are ${d.name}, ${d.role}, giving a follow-up consult inside Loop, a personal health and life app. Your patient is a university student in Australia who lifts weights and is on a lean bulk. Your specialty: ${d.focus}.

How to speak: like a warm, experienced specialist who has read the chart before the appointment. Plain language, Australian English, metric units. Use the patient's actual numbers.

Rules:
- Base everything on YOUR CONSULT NOTES, the HEALTH PROFILE and PATIENT DATA below. Read health-check results against the daily logs, not on their own, and say how old a check is when it matters. Never invent numbers or results that aren't there. If something isn't logged, say exactly what you'd need.
- When you predict, say what you expect, by when, how confident you are and why (which numbers drive it), and what would change the outcome.
- Give specific, practical actions: amounts, times, foods, sets and reps.
- Stay in your specialty. If a question belongs to a colleague (${others}), answer briefly and suggest asking them on their tab.
- You are an AI reading app logs: guidance, not a diagnosis, and not a substitute for in-person care. If anything sounds urgent or concerning (chest pain, fainting, severe or worsening symptoms, signs of disordered eating, thoughts of self-harm), kindly advise seeing a GP, or calling 000 in an emergency (Lifeline 13 11 14 for crisis support). Don't add disclaimers to every reply otherwise.
- If the patient gives you new health-check results or personal details (height, age, conditions, medications, allergies, family history), save them with log_health_check or update_health_profile, then say in one line what you saved. You can't log food, sleep or workouts; for those, point them to Ask.
- Keep replies to 2–6 short sentences or a short bulleted list, **bold** the key numbers. No headings.

YOUR CONSULT NOTES (computed today from the logs):
${consultNotes(key)}

HEALTH PROFILE AND HEALTH CHECKS (from Settings → Health profile; the patient or the assistant can add to it):
${profileNotes()}

COACH'S STANDING NOTES ABOUT THE PATIENT:
${state.kv.coachProfile?.text || '(none yet)'}

PATIENT DATA (JSON):
${JSON.stringify(snapshot())}`;
}

async function writeLetter(key) {
  if (!hasAI() || letterPending.has(key)) return;
  letterPending.add(key);
  open()[key] = true;
  render();
  try {
    const res = await generate({ system: specialistPrompt(key), contents: [{ role: 'user', parts: [{ text: 'Write my consult letter for today, addressed to me. Four short paragraphs: (1) your assessment in plain words, (2) your forecasts for the next 2–8 weeks with how confident you are and why, (3) your plan, as 3–5 specific actions, (4) what to watch for and when to see someone in person. Under 220 words. No headings, no sign-off line.' }] }] });
    const text = aiText(res);
    if (text) {
      const keep = Object.fromEntries(Object.entries(consultLetters()).filter(([k]) => k.split(':')[1] >= addDays(dayKey(), -14)));
      await setKV('consults', { ...keep, [`${key}:${dayKey()}`]: text });
    } else toast('No letter came back, try again', { icon: 'info' });
  } catch (err) {
    toast(String(err.message ?? err).slice(0, 80), { icon: 'alert' });
  }
  letterPending.delete(key);
  render();
}

async function sendSpec(key, text) {
  text = String(text ?? '').trim();
  if (!text || busySpec || !DOCTORS[key]) return;
  const all = chats();
  const list = [...(all[key] ?? []), { id: uid(), role: 'user', text, ts: Date.now() }];
  await setKV('specChats', { ...all, [key]: list.slice(-40) });
  busySpec = key;
  haptic();
  refreshSheet();
  scrollSheet();
  let reply;
  try {
    const contents = list.slice(-14).map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
    // A specialist can write to the health profile (a new check, a height, a
    // medication) but nothing else: logging food or sets stays with Ask.
    const saved = [];
    let text = '';
    for (let step = 0; step < 4; step++) {
      const res = await generate({ system: specialistPrompt(key), contents, tools: profileTools() });
      const parts = res.candidates?.[0]?.content?.parts ?? [];
      const calls = parts.filter(p => p.functionCall);
      const said = aiText(res);
      if (said) text = said;
      if (!calls.length) break;
      contents.push(res.candidates[0].content);
      const responses = [];
      for (const p of calls) {
        const { result, card } = await runTool(p.functionCall.name, p.functionCall.args);
        if (card) saved.push(card);
        responses.push({ functionResponse: { ...(p.functionCall.id ? { id: p.functionCall.id } : {}), name: p.functionCall.name, response: result } });
      }
      contents.push({ role: 'user', parts: responses });
    }
    reply = { id: uid(), role: 'doc', text: text || (saved.length ? 'Saved to your health profile.' : 'Sorry, I didn’t catch that. Could you ask again?'), saved, ts: Date.now() };
  } catch (err) {
    reply = { id: uid(), role: 'doc', text: `I couldn’t reach Gemini: ${String(err.message ?? err)}`, error: true, ts: Date.now() };
  }
  busySpec = null;
  const now = chats();
  await setKV('specChats', { ...now, [key]: [...(now[key] ?? []), reply].slice(-40) });
  if (ui.sheet === 'specialist' && ui.params?.spec === key) { refreshSheet(); scrollSheet(); }
}
const scrollSheet = () => { const s = document.querySelector('#sheet .sheet'); if (s) s.scrollTop = s.scrollHeight; };

sheets.specialist = ({ spec }) => {
  const key = DOCTORS[spec] ? spec : 'overview';
  const d = DOCTORS[key];
  const msgs = chats()[key] ?? [];
  const busy = busySpec === key;
  let c = null;
  try { c = consultFor(key); } catch { /* shown without the summary */ }
  return `<h2>${d.short} ${closeBtn}</h2>
  <div class="cs-sheet" style="--dc:var(--${d.area});--dc-bg:var(--${d.area}-bg);--dc-ink:var(--${d.area}-ink)">
  <div class="cs-sheet-head">${avatar(d)}<div class="grow"><div class="cs-name">${d.name}</div><div class="cs-role">${d.role}</div></div>${c ? chipHtml(c.level) : ''}</div>
  ${!hasAI() ? `<div class="cs-offline">
      <p class="note">Connect Gemini on the <b>Ask</b> tab to talk with ${d.short}. Until then, here’s the plan from today’s consult:</p>
      ${c?.plan.length ? `<ol class="cs-plan">${c.plan.map(x => `<li>${x}</li>`).join('')}</ol>` : ''}
      <button class="btn soft" data-act="specToAsk">${icon('sparkle')} Set up Gemini</button></div>`
  : `<div class="chat cs-chat">
      ${msgs.length ? msgs.map(m => (m.role === 'user'
        ? `<div class="msg-me">${esc(m.text)}</div>`
        : `<div class="msg-ai">${avatar(d, 'sm')}<div class="bubble glass ${m.error ? 'err' : ''}"><p>${fmtAI(m.text)}</p>${(m.saved ?? []).map((c, i) => `<div class="logged ${c.undone ? 'undone' : ''}">${tile(c.icon, c.area)}<div class="grow"><div class="t">${esc(c.title)}</div><div class="d">${esc(c.sub ?? '')}</div></div>${c.undone ? '<span class="undone-tag">Undone</span>' : `<button class="undo" data-act="specUndo" data-spec="${key}" data-m="${m.id}" data-c="${i}">Undo</button>`}</div>`).join('')}</div></div>`)).join('')
      : `<div class="msg-ai">${avatar(d, 'sm')}<div class="bubble glass"><p>${esc(`Hi, I’m ${d.name}. I’ve read through your ${d.tab === 'Overview' ? 'whole chart' : `${d.tab.toLowerCase()} data`}`)}${c ? ` and my overall read is <b>${esc(c.level[1].toLowerCase())}</b>` : ''}. What would you like to go over?</p></div></div>`}
      ${busy ? `<div class="msg-ai">${avatar(d, 'sm')}<div class="bubble glass typing"><i></i><i></i><i></i></div></div>` : ''}
    </div>
    <div class="cs-starters">${d.starters.map(q => `<button type="button" class="chip-btn soft" data-act="specStarter" data-spec="${key}" data-q="${esc(q)}" ${busy ? 'disabled' : ''}>${esc(q)}</button>`).join('')}</div>
    <form data-form="specAsk" class="cs-composer"><input type="hidden" name="spec" value="${key}">
      <div class="input-bar glass"><input name="q" placeholder="${busy ? `${d.short} is thinking…` : `Ask ${d.short}…`}" autocomplete="off" enterkeyhint="send" ${busy ? 'disabled' : ''}>
      <button class="cbtn send" aria-label="Send" ${busy ? 'disabled' : ''}>${icon('send')}</button></div>
    </form>
    ${msgs.length ? `<button type="button" class="btn ghost cs-clear" data-act="specClear" data-spec="${key}">Clear this conversation</button>` : ''}`}
  <p class="cs-disc">${d.short} is an AI reading your Loop logs. It’s guidance, not a diagnosis; for anything urgent call 000.</p></div>`;
};

Object.assign(actions, {
  consultLetter: el => writeLetter(el.dataset.spec),
  specStarter: el => sendSpec(el.dataset.spec, el.dataset.q),
  async specClear(el) {
    const all = { ...chats() };
    delete all[el.dataset.spec];
    await setKV('specChats', all);
    refreshSheet();
  },
  specToAsk: () => { closeSheet(); location.hash = 'ask'; },
  async specUndo(el) {
    const all = chats();
    const list = (all[el.dataset.spec] ?? []).map(m => ({ ...m }));
    const m = list.find(x => x.id === el.dataset.m);
    const c = m?.saved?.[el.dataset.c];
    if (!c || c.undone) return;
    await undoCard(c);
    m.saved = m.saved.map((x, i) => (i === Number(el.dataset.c) ? { ...x, undone: true } : x));
    await setKV('specChats', { ...all, [el.dataset.spec]: list });
    haptic();
    refreshSheet();
    render();
  },
});
forms.specAsk = (f, form) => {
  const q = f.get('q');
  if (form?.elements?.q) form.elements.q.value = '';
  return sendSpec(String(f.get('spec')), q);
};
