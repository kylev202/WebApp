// Health profile, the data half: who you are (personal details and medical
// background) and what your health checks found. Pure reads and grading, no UI,
// so the AI client and the specialists can both import it without a cycle (the
// sheets, Settings card and assistant tools live in profile.js).
//
// A health check is an ordinary entry ({ type: 'check', date, metrics, labels,
// other, source, note }), so it lives in backups like everything else and a
// second, third or tenth check simply adds another one. Every metric is graded
// here against published Australian ranges, so a result means the same thing
// whichever kiosk, pharmacy or lab produced it; the words the report itself
// printed ("Elevated", "Intermediate") are kept beside the number too.
import { state } from './store.js';
import { dayKey, daysBetween, shortDate, fmt1 } from './util.js';
import { of, ageOf, heightInfo, weights } from './data.js';

// ---------- personal details ----------
export const ACTIVITY = {
  '1.375': 'Light: gym 1–3 days a week',
  '1.55': 'Moderate: gym 3–5 days a week',
  '1.725': 'Very active: 6–7 days or a physical job',
};
export const PACE = { '250': 'Lean: +250 kcal a day', '400': 'Standard: +400 kcal a day', '600': 'Fast: +600 kcal a day' };
export const BACKGROUND = {
  conditions: { label: 'Conditions', hint: 'e.g. asthma, none' },
  medications: { label: 'Medications & supplements', hint: 'e.g. creatine 5 g, ventolin as needed' },
  allergies: { label: 'Allergies & intolerances', hint: 'e.g. peanuts, lactose' },
  family: { label: 'Family history', hint: 'e.g. dad: type 2 diabetes; grandad: heart attack at 60' },
  notes: { label: 'Other notes for your specialists', hint: 'e.g. don’t smoke, 2–3 drinks a week, coffee ×2 a day' },
};
export const profile = () => ({ ...state.kv.profile });
export const sexOf = (p = profile()) => (p.sex === 'female' ? 'female' : p.sex === 'male' ? 'male' : null);

// ---------- what a check can hold ----------
// `tool` is the name the assistant uses for it; `aliases` are how printed
// reports label it, for reading pasted text.
export const METRICS = {
  heartAge: { label: 'Heart age', unit: 'years', ic: 'heart', tool: 'heart_age_years', aliases: ['heart age'], core: true },
  weight: { label: 'Weight', unit: 'kg', ic: 'scale', tool: 'weight_kg', aliases: ['weight', 'body weight'], core: true },
  bp: { label: 'Blood pressure', unit: 'mmHg', ic: 'heart', tool: null, aliases: ['blood pressure', 'bp'], core: true, pair: ['bpSys', 'bpDia'] },
  bmi: { label: 'BMI', unit: '', ic: 'scale', tool: 'bmi', aliases: ['body mass index', 'bmi'], core: true },
  bodyFat: { label: 'Body fat', unit: '%', ic: 'muscle', tool: 'body_fat_pct', aliases: ['body fat', 'fat %', 'body fat percentage'], core: true },
  hr: { label: 'Resting heart rate', unit: 'bpm', ic: 'heart', tool: 'resting_heart_rate_bpm', aliases: ['resting heart rate', 'heart rate', 'pulse'], core: true },
  diabetes: { label: 'Diabetes risk', unit: 'pts', ic: 'drop', tool: 'diabetes_risk_points', aliases: ['diabetes risk', 'ausdrisk'], core: true },
  waist: { label: 'Waist', unit: 'cm', ic: 'scale', tool: 'waist_cm', aliases: ['waist circumference', 'waist'] },
  cholTotal: { label: 'Total cholesterol', unit: 'mmol/L', ic: 'drop', tool: 'total_cholesterol_mmol', aliases: ['total cholesterol', 'cholesterol'] },
  hdl: { label: 'HDL cholesterol', unit: 'mmol/L', ic: 'drop', tool: 'hdl_mmol', aliases: ['hdl cholesterol', 'hdl'] },
  ldl: { label: 'LDL cholesterol', unit: 'mmol/L', ic: 'drop', tool: 'ldl_mmol', aliases: ['ldl cholesterol', 'ldl'] },
  trig: { label: 'Triglycerides', unit: 'mmol/L', ic: 'drop', tool: 'triglycerides_mmol', aliases: ['triglycerides', 'triglyceride'] },
  glucose: { label: 'Fasting glucose', unit: 'mmol/L', ic: 'drop', tool: 'fasting_glucose_mmol', aliases: ['fasting glucose', 'blood glucose', 'glucose', 'blood sugar'] },
  hba1c: { label: 'HbA1c', unit: '%', ic: 'drop', tool: 'hba1c_pct', aliases: ['hba1c', 'a1c'] },
  spo2: { label: 'Blood oxygen', unit: '%', ic: 'drop', tool: 'spo2_pct', aliases: ['blood oxygen', 'oxygen saturation', 'spo2'] },
  muscle: { label: 'Muscle mass', unit: 'kg', ic: 'muscle', tool: 'muscle_mass_kg', aliases: ['skeletal muscle mass', 'muscle mass'] },
  visceral: { label: 'Visceral fat', unit: 'level', ic: 'muscle', tool: 'visceral_fat_level', aliases: ['visceral fat'] },
};
// Plausible ranges: a typo or a misread photo outside these is dropped, not stored.
const BOUNDS = { heartAge: [10, 110], weight: [25, 300], bpSys: [60, 260], bpDia: [30, 160], bmi: [10, 70], bodyFat: [2, 70], hr: [25, 220], diabetes: [0, 40], waist: [40, 200], cholTotal: [1, 20], hdl: [0.2, 5], ldl: [0.2, 15], trig: [0.1, 30], glucose: [1, 40], hba1c: [3, 20], spo2: [50, 100], muscle: [10, 120], visceral: [1, 60] };
export const STORED_KEYS = Object.keys(BOUNDS);
export function clean(key, v) {
  const n = Number(String(v ?? '').replace(',', '.'));
  const [lo, hi] = BOUNDS[key] ?? [0, Infinity];
  return Number.isFinite(n) && n >= lo && n <= hi && String(v ?? '').trim() !== '' ? Math.round(n * 100) / 100 : null;
}

export const checks = () => of('check').sort((a, b) => a.date.localeCompare(b.date) || a.ts - b.ts);
export const latestCheck = () => checks().at(-1) ?? null;
export const has = (m, key) => (METRICS[key]?.pair ? m?.bpSys != null && m?.bpDia != null : m?.[key] != null);
export function valueText(m, key) {
  if (!has(m, key)) return '–';
  return key === 'bp' ? `${fmt1(m.bpSys)}/${fmt1(m.bpDia)}` : fmt1(m[key]);
}

// ---------- grading ----------
// Returns [level, word, why]: level is good / ok / low (the colours every chip in
// the app already uses) or none when it can't be judged.
export function grade(key, m, ctx = {}) {
  const sex = ctx.sex ?? sexOf();
  const female = sex === 'female';
  const v = m?.[key];
  const g = (lv, word, why = '') => [lv, word, why];
  switch (key) {
    case 'heartAge': {
      const age = ctx.age ?? ageOf();
      if (v == null) return null;
      if (!age) return g('none', 'Add your age', 'Heart age only means something next to your real age.');
      const d = Math.round(v - age);
      return d <= 0 ? g('good', 'Ideal', `At or under your age (${age}).`)
        : d < 10 ? g('ok', 'Elevated', `${d} year${d > 1 ? 's' : ''} older than you are (${age}).`)
        : g('low', 'High', `${d} years older than you are (${age}).`);
    }
    case 'bp': {
      if (!has(m, 'bp')) return null;
      const s = m.bpSys, d = m.bpDia;
      if (s < 90 || d < 60) return g('ok', 'Low', 'Under 90/60. Fine if you feel well; see a GP if it comes with dizziness or fainting.');
      if (s < 120 && d < 80) return g('good', 'Optimal', 'Under 120/80.');
      if (s < 130 && d < 85) return g('good', 'Normal', 'Under 130/85.');
      if (s < 140 && d < 90) return g('ok', 'High-normal', '130–139 / 85–89: worth rechecking within a year.');
      if (s < 160 && d < 100) return g('low', 'High', '140/90 or more: needs a GP to confirm on repeat readings.');
      return g('low', 'Very high', '160/100 or more: see a GP soon.');
    }
    case 'weight': case 'bmi': {
      const bmi = m?.bmi ?? (m?.weight && ctx.height ? m.weight / (ctx.height / 100) ** 2 : null);
      if (v == null || bmi == null) return v == null ? null : g('none', 'Add your height', 'Needs height for a BMI.');
      return bmi < 18.5 ? g('ok', 'Underweight', `BMI ${fmt1(bmi)}, under 18.5.`)
        : bmi < 25 ? g('good', 'Normal', `BMI ${fmt1(bmi)}, in 18.5–24.9.`)
        : bmi < 30 ? g('ok', 'Overweight', `BMI ${fmt1(bmi)}. Lifters often read here while lean, so waist is the better check.`)
        : g('low', 'Obese range', `BMI ${fmt1(bmi)}, 30 or more.`);
    }
    case 'bodyFat': {
      if (v == null) return null;
      const [vlow, high, vhigh] = female ? [13, 32, 38] : [5, 25, 30];
      return v < vlow ? g('low', 'Very low', `Under ${vlow}%, below essential fat for ${female ? 'women' : 'men'}; hormones and recovery suffer here.`)
        : v < high ? g('good', 'Normal', `${female ? '13–31' : '5–24'}% is the healthy range${!female && v <= 13 ? ' (6–13% is athletic)' : female && v <= 20 ? ' (14–20% is athletic)' : ''}.`)
        : v < vhigh ? g('ok', 'High', `${high}% or more.`) : g('low', 'Very high', `${vhigh}% or more.`);
    }
    case 'hr':
      if (v == null) return null;
      return v < 40 ? g('ok', 'Low', 'Under 40 bpm: normal for some endurance athletes, otherwise worth a GP check.')
        : v < 60 ? g('good', 'Athletic', 'Under 60 bpm, typical of good aerobic fitness.')
        : v <= 80 ? g('good', 'Normal', '60–80 bpm at rest.')
        : v <= 100 ? g('ok', 'Elevated', '81–100 bpm: inside the normal range, but higher than ideal at rest.')
        : g('low', 'High', 'Over 100 bpm at rest.');
    case 'diabetes':
      if (v == null) return null;
      return v <= 5 ? g('good', 'Low', 'AUSDRISK 5 or under: about 1 in 100 develop type 2 diabetes within 5 years.')
        : v <= 11 ? g('ok', 'Intermediate', 'AUSDRISK 6–11: roughly 1 in 50 to 1 in 30 within 5 years. Lifestyle is the lever.')
        : g('low', 'High', 'AUSDRISK 12 or more: a GP should check your blood glucose.');
    case 'waist': {
      if (v == null) return null;
      const [inc, hi] = female ? [80, 88] : [94, 102];
      return v < inc ? g('good', 'Healthy', `Under ${inc} cm.`) : v < hi ? g('ok', 'Increased', `${inc}–${hi - 1} cm: increased risk.`) : g('low', 'High', `${hi} cm or more.`);
    }
    case 'cholTotal':
      if (v == null) return null;
      return v < 5.5 ? g('good', 'Normal', 'Under 5.5 mmol/L.') : v < 6.5 ? g('ok', 'High', '5.5–6.4 mmol/L.') : g('low', 'Very high', '6.5 mmol/L or more.');
    case 'hdl': {
      if (v == null) return null;
      const lo = female ? 1.2 : 1.0;
      return v >= lo ? g('good', 'Normal', `${lo} mmol/L or more is protective.`) : g('ok', 'Low', `Under ${lo} mmol/L.`);
    }
    case 'ldl':
      if (v == null) return null;
      return v < 2 ? g('good', 'Optimal', 'Under 2.0 mmol/L.') : v < 3.5 ? g('good', 'Normal', 'Under 3.5 mmol/L.') : v < 4.9 ? g('ok', 'High', '3.5–4.8 mmol/L.') : g('low', 'Very high', '4.9 mmol/L or more.');
    case 'trig':
      if (v == null) return null;
      return v < 2 ? g('good', 'Normal', 'Under 2.0 mmol/L.') : v < 5.6 ? g('ok', 'High', '2.0–5.5 mmol/L.') : g('low', 'Very high', '5.6 mmol/L or more.');
    case 'glucose':
      if (v == null) return null;
      return v < 3.9 ? g('ok', 'Low', 'Under 3.9 mmol/L.') : v < 5.5 ? g('good', 'Normal', 'Fasting under 5.5 mmol/L.') : v < 7 ? g('ok', 'Impaired', 'Fasting 5.5–6.9 mmol/L: a GP may suggest an HbA1c.') : g('low', 'Diabetic range', 'Fasting 7.0 mmol/L or more: see a GP.');
    case 'hba1c':
      if (v == null) return null;
      return v < 5.7 ? g('good', 'Normal', 'Under 5.7%.') : v < 6.5 ? g('ok', 'Pre-diabetes range', '5.7–6.4%.') : g('low', 'Diabetic range', '6.5% or more: see a GP.');
    case 'spo2':
      if (v == null) return null;
      return v >= 95 ? g('good', 'Normal', '95% or more.') : v >= 92 ? g('ok', 'Low', '92–94%.') : g('low', 'Very low', 'Under 92%: seek care if you’re short of breath.');
    case 'visceral':
      if (v == null) return null;
      return v <= 9 ? g('good', 'Healthy', 'Level 1–9.') : v <= 14 ? g('ok', 'High', 'Level 10–14.') : g('low', 'Very high', 'Level 15 or more.');
    default:
      return v == null ? null : g('none', '', '');
  }
}
export const gradeCtx = () => ({ age: ageOf(), sex: sexOf(), height: heightInfo()?.cm ?? null });

// Every result in a check, graded, in catalogue order (then any extras).
export function readCheck(c, ctx = gradeCtx()) {
  if (!c) return [];
  const m = c.metrics ?? {};
  const rows = Object.entries(METRICS).filter(([k]) => has(m, k)).map(([key, def]) => {
    const gr = grade(key, m, ctx);
    return { key, label: def.label, unit: def.unit, ic: def.ic, value: valueText(m, key), grade: gr, reported: c.labels?.[key] ?? '' };
  });
  for (const o of c.other ?? []) rows.push({ key: `other:${o.name}`, label: o.name, unit: o.unit ?? '', ic: 'info', value: String(o.value ?? ''), grade: null, reported: o.status ?? '' });
  return rows;
}
// The word to show on a chip: our grade, or the report's own when we can't judge.
export const chipOf = r => (r.grade && r.grade[0] !== 'none' ? [r.grade[0], r.grade[1]] : r.reported ? ['none', r.reported] : r.grade ? ['none', r.grade[1] || '–'] : null);

// The newest reading of one metric across all checks, and the one before it.
export function trendOf(key) {
  const list = checks().filter(c => has(c.metrics, key));
  return { last: list.at(-1) ?? null, prev: list.at(-2) ?? null, all: list };
}

// ---------- reading a pasted report ----------
// Kiosk and lab reports print "Label · number · unit · status word". Paste one in
// and each catalogue metric is found by its label, the number after it taken, and
// a status word close behind kept as what the report said.
const STATUS = ['optimal', 'normal', 'healthy', 'ideal', 'good', 'excellent', 'elevated', 'high-normal', 'high normal', 'high', 'very high', 'low', 'very low', 'intermediate', 'moderate', 'borderline', 'above average', 'below average', 'average', 'increased', 'underweight', 'overweight', 'obese'];
export function parseResults(text) {
  const src = String(text ?? '').replace(/\r/g, '');
  const lower = src.toLowerCase();
  const metrics = {}, labels = {};
  const taken = [];
  // Longest aliases first, so "resting heart rate" wins over "heart rate" and "heart age" isn't read as a rate.
  const order = Object.entries(METRICS).flatMap(([key, def]) => def.aliases.map(a => [key, a])).sort((a, b) => b[1].length - a[1].length);
  for (const [key, alias] of order) {
    if (key === 'bp' ? metrics.bpSys != null : metrics[key] != null) continue;
    const re = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    let hit;
    while ((hit = re.exec(lower))) {
      const at = hit.index;
      if (taken.some(([a, b]) => at >= a && at < b)) continue; // inside a longer label already read
      const rest = src.slice(at + alias.length, at + alias.length + 60);
      const num = rest.match(key === 'bp' ? /^[^\d]{0,30}?(\d{2,3})\s*\/\s*(\d{2,3})/ : /^[^\d]{0,30}?(\d+(?:[.,]\d+)?)/);
      if (!num) continue;
      if (key === 'bp') {
        const s = clean('bpSys', num[1]), d = clean('bpDia', num[2]);
        if (s == null || d == null) continue;
        metrics.bpSys = s; metrics.bpDia = d;
      } else {
        const v = clean(key, num[1]);
        if (v == null) continue;
        metrics[key] = v;
      }
      taken.push([at, at + alias.length]);
      const after = rest.slice(num.index + num[0].length).toLowerCase().slice(0, 40);
      const word = STATUS.filter(w => new RegExp(`\\b${w}\\b`).test(after)).sort((a, b) => after.indexOf(a) - after.indexOf(b) || b.length - a.length)[0];
      if (word) labels[key] = word.replace(/(^|[\s-])\w/g, c => c.toUpperCase());
      break;
    }
  }
  return { metrics, labels, found: Object.keys(METRICS).filter(k => has(metrics, k)) };
}

// ---------- what the specialists and the assistant are told ----------
const line = r => `${r.label} ${r.value}${r.unit ? ` ${r.unit}` : ''}${r.grade?.[1] ? ` (${r.grade[1]}${r.reported && r.reported.toLowerCase() !== r.grade[1].toLowerCase() ? `; report said ${r.reported}` : ''})` : r.reported ? ` (report said ${r.reported})` : ''}`;

export function profileFacts() {
  const p = profile();
  const h = heightInfo();
  const ctx = gradeCtx();
  const all = checks();
  const last = all.at(-1);
  const prev = all.at(-2);
  const changes = last && prev ? Object.keys(METRICS).filter(k => k !== 'bp' && has(last.metrics, k) && has(prev.metrics, k) && last.metrics[k] !== prev.metrics[k])
    .map(k => `${METRICS[k].label} ${fmt1(prev.metrics[k])} → ${fmt1(last.metrics[k])} ${METRICS[k].unit}`.trim()) : [];
  if (last && prev && has(last.metrics, 'bp') && has(prev.metrics, 'bp') && valueText(last.metrics, 'bp') !== valueText(prev.metrics, 'bp')) changes.push(`Blood pressure ${valueText(prev.metrics, 'bp')} → ${valueText(last.metrics, 'bp')} mmHg`);
  return {
    personal: {
      sex: p.sex ?? null,
      age: ctx.age,
      birth_date: p.birth ?? null,
      height_cm: h?.cm ?? null,
      height_source: h ? (h.source === 'profile' ? 'entered' : `estimated from the ${h.date} check's weight and BMI, not confirmed`) : 'missing',
      activity: ACTIVITY[p.activity] ?? null,
      bulk_pace: PACE[p.pace] ?? null,
      ...Object.fromEntries(Object.keys(BACKGROUND).map(k => [k, p[k] || null])),
    },
    checks_count: all.length,
    latest_check: last ? { date: last.date, days_ago: daysBetween(last.date, dayKey()), source: last.source || null, results: readCheck(last, ctx).map(line), note: last.note || null } : null,
    changes_since_previous_check: prev ? { previous_date: prev.date, changes } : null,
    earlier_checks: all.slice(0, -1).slice(-4).reverse().map(c => ({ date: c.date, source: c.source || null, results: readCheck(c, ctx).map(line) })),
  };
}

// The same as plain text, for a specialist's brief.
export function profileNotes() {
  const f = profileFacts();
  const P = f.personal;
  const out = [`Personal: ${[P.sex, P.age && `${P.age} years old`, P.height_cm ? `${P.height_cm} cm (${P.height_source})` : 'height not recorded', P.activity && `activity: ${P.activity}`].filter(Boolean).join(', ')}.`];
  Object.entries(BACKGROUND).forEach(([k, d]) => { if (P[k]) out.push(`${d.label}: ${P[k]}`); });
  if (f.latest_check) {
    out.push(`Latest health check ${f.latest_check.date} (${f.latest_check.days_ago} days ago${f.latest_check.source ? `, ${f.latest_check.source}` : ''}): ${f.latest_check.results.join('; ')}.`);
    if (f.latest_check.note) out.push(`Check note: ${f.latest_check.note}`);
  } else out.push('No health check recorded yet.');
  if (f.changes_since_previous_check?.changes.length) out.push(`Since the ${f.changes_since_previous_check.previous_date} check: ${f.changes_since_previous_check.changes.join('; ')}.`);
  f.earlier_checks.slice(1).forEach(c => out.push(`Earlier check ${c.date}: ${c.results.join('; ')}.`));
  return out.join('\n');
}

// What the latest check means for a consult, shared by every specialist: the
// graded rows, how old it is, and lean mass when there's a body-fat reading.
export function checkRead() {
  const c = latestCheck();
  if (!c) return null;
  const ctx = gradeCtx();
  const rows = readCheck(c, ctx);
  const by = Object.fromEntries(rows.map(r => [r.key, r]));
  const m = c.metrics ?? {};
  const kg = m.weight ?? weights().filter(w => w.date <= c.date).at(-1)?.kg ?? null;
  const lean = kg && m.bodyFat != null ? kg * (1 - m.bodyFat / 100) : null;
  const ffmi = lean && ctx.height ? lean / (ctx.height / 100) ** 2 : null;
  return { c, m, rows, by, ctx, age: daysBetween(c.date, dayKey()), when: shortDate(c.date), lean, ffmi, flagged: rows.filter(r => r.grade && ['ok', 'low'].includes(r.grade[0])) };
}
