// Health profile, the UI half: the Settings card, the sheets for personal details
// and health checks, and the assistant tools that let Ask fill them in. The data,
// grading and paste-reading live in health-profile.js.
//
// This replaced the bulk calculator. The calculator asked for sex, age, height and
// activity once, used them for one number and forgot why; the profile keeps them
// (plus medical background and every health check) where each specialist and the
// assistant can read them, and works the calorie target out from them as a side
// effect.
import { state, addEntry, updateEntry, removeEntry, setKV } from './store.js';
import { esc, dayKey, shortDate, fmt, fmt1, num, plural, daysBetween } from './util.js';
import { icon, tile } from './icons.js';
import { sheets, actions, forms, previews, render, openSheet, closeSheet, toast, haptic, closeBtn, sect, dateField, readDate, toggle, sheetForm } from './core.js';
import { goals, of, weights, ageOf, heightInfo, bodyProfile, maintenanceKcal } from './data.js';
import { ACTIVITY, PACE, BACKGROUND, METRICS, STORED_KEYS, profile, checks, latestCheck, readCheck, chipOf, trendOf, has, valueText, clean, parseResults, gradeCtx } from './health-profile.js';
import { extraTools, extraRun, promptSections, S, DATE, obj } from './ai.js';

const chip = c => (c ? `<span class="hv-chip lv-${c[0]}">${esc(c[1])}</span>` : '');
const latestKg = () => weights().at(-1)?.kg ?? latestCheck()?.metrics?.weight ?? (Number(profile().weight) || null);

// ---------- calorie targets, from the profile ----------
export function suggestedGoals(p = bodyProfile(), kg = latestKg()) {
  const pace = Number(p.pace ?? 400);
  const maintenance = kg ? maintenanceKcal({ ...p, activity: p.activity ?? '1.55' }, kg) : null;
  if (maintenance == null) return null;
  return {
    maintenance: Math.round(maintenance / 10) * 10,
    kcal: Math.round((maintenance + pace) / 50) * 50,
    protein: Math.round((kg * 2) / 5) * 5, // ~2 g per kg
    pace,
  };
}
// What's still needed before the numbers above can be worked out.
const missingForGoals = () => {
  const out = [];
  if (!ageOf()) out.push('age');
  if (!heightInfo()) out.push('height');
  if (!latestKg()) out.push('weight');
  return out;
};

export function goalsSuggestion() {
  const s = suggestedGoals();
  if (!s) {
    const miss = missingForGoals();
    return `<div class="hp-suggest">${tile('calculator', 'diet')}<div class="grow"><div class="t">Targets from your profile</div><div class="d">Add your ${miss.join(' and ') || 'details'} in Health profile and Loop works out maintenance and a bulk target for you.</div></div>
      <button type="button" class="pill-btn" data-act="sheet" data-sheet="profile">Add</button></div>`;
  }
  const g = goals();
  const same = g.kcal === s.kcal && g.protein === s.protein;
  return `<div class="hp-suggest">${tile('calculator', 'diet')}<div class="grow"><div class="t">From your profile: ${fmt(s.kcal)} kcal · ${s.protein} g protein</div>
    <div class="d">Maintenance ≈ ${fmt(s.maintenance)} kcal, plus ${s.pace} for a ${PACE[s.pace]?.split(':')[0].toLowerCase() ?? ''} bulk.${heightInfo()?.source === 'check' ? ' Height estimated from your check.' : ''}</div></div>
    ${same ? `<span class="hv-chip lv-good">In use</span>` : `<button type="button" class="pill-btn" data-act="useSuggested">Use</button>`}</div>`;
}

// ---------- Settings card ----------
function personalRows() {
  const p = profile();
  const age = ageOf(p);
  const h = heightInfo();
  const kg = latestKg();
  const row = (ic, t, v, extra = '') => `<div class="row tap" data-act="sheet" data-sheet="profile" role="button">${tile(ic, 'work')}<div class="grow"><div class="t">${t}</div>${extra}</div><div class="amt">${v}</div></div>`;
  const unset = '<span class="hp-unset">Not set</span>';
  const heightRow = h?.source === 'profile' ? row('user', 'Height', `${fmt(h.cm)} cm`)
    : `<div class="row hp-missing">${tile('alert', 'school')}<div class="grow"><div class="t">Height</div><div class="d">${h ? `Your ${shortDate(h.date)} check’s weight and BMI work out to about <b>${h.cm} cm</b>. Loop is using that for now.` : 'Needed for BMI, lean-mass and calorie maths. Specialists can’t read your build without it.'}</div></div>
      ${h ? `<button type="button" class="pill-btn" data-act="useHeight" data-cm="${h.cm}">Use ${h.cm} cm</button>` : '<button type="button" class="pill-btn" data-act="sheet" data-sheet="profile">Add</button>'}</div>`;
  const bg = Object.entries(BACKGROUND).filter(([k]) => p[k]).map(([k, d]) => `<div class="row tap" data-act="sheet" data-sheet="profile" role="button">${tile(k === 'medications' ? 'pill' : k === 'family' ? 'users' : k === 'allergies' ? 'alert' : 'medical', 'sleep')}<div class="grow"><div class="t">${d.label}</div><div class="d">${esc(p[k])}</div></div></div>`).join('');
  return `<div class="list">
    ${row('user', 'Sex', p.sex ? (p.sex === 'female' ? 'Female' : 'Male') : unset)}
    ${row('calendar', 'Age', age ? `${age}` : unset, p.birth ? `<div class="d">Born ${shortDate(p.birth)} ${p.birth.slice(0, 4)}</div>` : '')}
    ${heightRow}
    ${row('scale', 'Weight', kg ? `${fmt1(kg)} kg` : unset, '<div class="d">Latest weigh-in</div>')}
    ${row('dumbbell', 'Activity', p.activity ? esc(ACTIVITY[p.activity].split(':')[0]) : unset)}
    ${bg}
  </div>`;
}

function checkTiles(c) {
  const rows = readCheck(c, gradeCtx());
  return `<div class="hp-grid">${rows.map(r => {
    const t = r.key.startsWith('other:') ? null : trendOf(r.key);
    const prev = t?.prev && t.last?.id === c.id ? t.prev : null;
    const delta = prev && r.key !== 'bp' ? c.metrics[r.key] - prev.metrics[r.key] : null;
    return `<div class="hp-tile">
      <div class="hp-l">${icon(r.ic)}${esc(r.label)}</div>
      <div class="hp-v">${esc(r.value)}<small>${esc(r.unit)}</small></div>
      ${chip(chipOf(r))}
      ${prev ? `<div class="hp-d">${delta ? `${delta > 0 ? '▲' : '▼'} ${fmt1(Math.abs(delta))} since ${shortDate(prev.date)}` : r.key === 'bp' ? `${valueText(prev.metrics, 'bp')} on ${shortDate(prev.date)}` : `Same as ${shortDate(prev.date)}`}</div>` : ''}
    </div>`;
  }).join('')}</div>`;
}

export function healthProfileSection() {
  const c = latestCheck();
  const n = checks().length;
  return `${sect('Health profile', { nav: 'Profile', note: 'Who you are and what your health checks found. Every specialist and the assistant read this before they advise you; tell Ask about a new check and it lands here.', open: true })}
  <section class="card glass hp-card">
    <div class="money-top"><div class="label-sm">Personal details</div><button class="pill-btn" data-act="sheet" data-sheet="profile">${icon('edit')} Edit</button></div>
    ${personalRows()}
  </section>
  <section class="card glass hp-card">
    <div class="money-top"><div><div class="label-sm">${c ? 'Latest health check' : 'Health checks'}</div>${c ? `<div class="hp-when">${shortDate(c.date)} ${c.date.slice(0, 4)}${c.source ? ` · ${esc(c.source)}` : ''}${daysBetween(c.date, dayKey()) > 365 ? ' · <b>over a year old</b>' : ''}</div>` : ''}</div>
      <button class="pill-btn" data-act="sheet" data-sheet="check">${icon('plus')} Check</button></div>
    ${c ? checkTiles(c) : '<p class="note">No checks yet. Add the results from a pharmacy health station, a GP visit or a blood test (paste them straight from the report) and every specialist will read them alongside your logs. Do it again each time you have one; Loop keeps them all and shows what changed.</p>'}
    ${c?.note ? `<p class="note">${esc(c.note)}</p>` : ''}
    ${c ? `<div class="row2"><button class="btn soft" data-act="sheet" data-sheet="check" data-id="${c.id}">${icon('edit')} Edit this check</button><button class="btn soft" data-act="sheet" data-sheet="checks">${icon('chart')} All ${plural(n, 'check')}</button></div>` : ''}
  </section>`;
}

// ---------- sheets ----------
const opt = (val, cur, label) => `<option value="${val}" ${String(cur) === val ? 'selected' : ''}>${esc(label)}</option>`;

sheets.profile = ({ onboard }) => {
  const p = { activity: '1.55', pace: '400', ...profile() };
  const h = heightInfo();
  const kg = latestKg();
  return `<h2>Personal details ${closeBtn}</h2>
  <form data-form="profile" class="nice-form">
    <div class="seg wide radio">
      <label><input type="radio" name="sex" value="male" ${p.sex !== 'female' ? 'checked' : ''}>Male</label>
      <label><input type="radio" name="sex" value="female" ${p.sex === 'female' ? 'checked' : ''}>Female</label>
    </div>
    <div class="row3">
      <div class="field"><label>Age</label><input class="input-x" name="age" inputmode="numeric" value="${ageOf(p) ?? ''}" placeholder="20"></div>
      <div class="field"><label>Height (cm)</label><input class="input-x" name="height" inputmode="decimal" value="${Number(p.height) > 100 ? p.height : ''}" placeholder="${h ? `≈ ${h.cm}` : '178'}"></div>
      <div class="field"><label>Weight (kg)</label><input class="input-x" name="weight" inputmode="decimal" value="${kg ?? ''}" placeholder="70"></div>
    </div>
    ${h?.source === 'check' && !(Number(p.height) > 100) ? `<p class="note hp-hint">${icon('info')} Your ${shortDate(h.date)} check’s weight and BMI imply about <b>${h.cm} cm</b>. Type your real height if you know it.</p>` : ''}
    <div class="field"><label>Birthday <small>(optional: keeps your age up to date)</small></label><input class="input-x" type="date" name="birth" value="${esc(p.birth ?? '')}" max="${dayKey()}"></div>
    <div class="field"><label>How active are you?</label><select class="input-x" name="activity">${Object.entries(ACTIVITY).map(([v, l]) => opt(v, p.activity, l)).join('')}</select></div>
    <div class="field"><label>Bulk pace</label><select class="input-x" name="pace">${Object.entries(PACE).map(([v, l]) => opt(v, p.pace, l)).join('')}</select></div>
    <div class="calc-result" id="profile-result"></div>
    ${toggle('setGoals', 'Use these as my daily calorie and protein goals', !!onboard)}
    <div class="label-sm hp-sub">Medical background <small>optional · only your specialists read it</small></div>
    ${Object.entries(BACKGROUND).map(([k, d]) => `<div class="field"><label>${d.label}</label><textarea class="input-x" name="${k}" rows="2" maxlength="400" placeholder="${esc(d.hint)}">${esc(p[k] ?? '')}</textarea></div>`).join('')}
    <button class="btn">Save details</button>
  </form>`;
};

function formProfile(f) {
  const p = { ...profile() };
  p.sex = f.get('sex') === 'female' ? 'female' : 'male';
  const age = num(f.get('age')), height = num(f.get('height')), birth = String(f.get('birth') ?? '');
  if (age > 10 && age < 120) p.age = Math.round(age); else delete p.age;
  if (height > 100 && height < 250) p.height = Math.round(height * 10) / 10; else delete p.height;
  if (/^\d{4}-\d{2}-\d{2}$/.test(birth)) p.birth = birth; else delete p.birth;
  p.activity = ACTIVITY[f.get('activity')] ? String(f.get('activity')) : '1.55';
  p.pace = PACE[f.get('pace')] ? String(f.get('pace')) : '400';
  for (const k of Object.keys(BACKGROUND)) { const v = String(f.get(k) ?? '').trim(); if (v) p[k] = v.slice(0, 400); else delete p[k]; }
  return p;
}

previews.profile = form => {
  const f = new FormData(form);
  const p = formProfile(f);
  const kg = num(f.get('weight')) || latestKg();
  // A typed height wins; otherwise use the one inferred from a check, as everything else does.
  const s = suggestedGoals({ ...p, age: ageOf(p) ?? p.age, height: p.height ?? heightInfo()?.cm }, kg);
  const el = document.getElementById('profile-result');
  if (el) el.innerHTML = s
    ? `<div><span>Maintenance</span><b>${fmt(s.maintenance)} kcal</b></div><div><span>Bulk target</span><b>${fmt(s.kcal)} kcal</b></div><div><span>Protein</span><b>${s.protein} g</b></div>`
    : '<div><span>Add age, height and weight to work out your targets</span></div>';
};

forms.profile = async f => {
  const p = formProfile(f);
  const kg = num(f.get('weight'));
  await setKV('profile', p);
  // A weight typed here that differs from the last weigh-in is today's weigh-in.
  if (kg >= 20 && kg <= 300 && Math.abs(kg - (weights().at(-1)?.kg ?? 0)) >= 0.05) {
    for (const e of of('weight', dayKey())) await removeEntry(e.id);
    await addEntry('weight', { kg: Math.round(kg * 10) / 10 }, dayKey());
  }
  let msg = 'Health profile saved';
  if (f.get('setGoals')) {
    const s = suggestedGoals();
    if (s) { await setKV('goals', { ...goals(), kcal: s.kcal, protein: s.protein }); msg = `${fmt(s.kcal)} kcal · ${s.protein} g protein`; }
  }
  await setKV('onboarded', true);
  haptic();
  closeSheet();
  toast(msg, { icon: 'target' });
  render();
};

function metricField(key, m) {
  const d = METRICS[key];
  if (d.pair) {
    return `<div class="field hp-f"><label>${d.label} <small>${d.unit}</small></label><div class="hp-bp"><input class="input-x" name="m_bpSys" inputmode="numeric" placeholder="119" value="${m.bpSys ?? ''}" aria-label="Systolic"><span>/</span><input class="input-x" name="m_bpDia" inputmode="numeric" placeholder="74" value="${m.bpDia ?? ''}" aria-label="Diastolic"></div></div>`;
  }
  return `<div class="field hp-f"><label>${d.label} <small>${d.unit}</small></label><input class="input-x" name="m_${key}" inputmode="decimal" value="${m[key] ?? ''}"></div>`;
}

sheets.check = ({ id }) => {
  const c = id ? of('check').find(x => x.id === id) : null;
  const m = c?.metrics ?? {};
  const extra = Object.keys(METRICS).filter(k => !METRICS[k].core);
  return `<h2>${c ? 'Edit health check' : 'Add a health check'} ${closeBtn}</h2>
  <form data-form="check" class="nice-form">
    <input type="hidden" name="id" value="${c?.id ?? ''}">
    <input type="hidden" name="labels" value="${esc(JSON.stringify(c?.labels ?? {}))}">
    <details class="fx hp-paste" ${c ? '' : 'open'}><summary>Paste the results from your report</summary>
      <textarea class="input-x" name="paste" rows="5" placeholder="Heart Age 23 Years Elevated&#10;Weight 69.7 kgs Normal&#10;Blood Pressure 119/74 mmHg Optimal&#10;…"></textarea>
      <button type="button" class="btn soft" data-act="parseCheck">${icon('sparkle')} Read the numbers</button>
      <p class="note" id="hp-parse-note"></p>
    </details>
    <div class="field"><label>Date of the check</label>${dateField('date', c?.date ?? dayKey(), { past: true })}</div>
    <div class="field"><label>Where</label><input class="input-x" name="source" maxlength="60" placeholder="e.g. pharmacy health station, GP, blood test" value="${esc(c?.source ?? '')}"></div>
    <div class="label-sm hp-sub">Results <small>leave blank what wasn’t measured</small></div>
    <div class="row2 hp-fields">${Object.keys(METRICS).filter(k => METRICS[k].core).map(k => metricField(k, m)).join('')}</div>
    <details class="fx hp-more" ${extra.some(k => has(m, k)) ? 'open' : ''}><summary>Blood test, waist and more</summary>
      <div class="row2 hp-fields">${extra.map(k => metricField(k, m)).join('')}</div>
    </details>
    ${c?.other?.length ? `<p class="note">Also kept: ${c.other.map(o => esc(`${o.name} ${o.value}${o.unit ? ` ${o.unit}` : ''}`)).join(' · ')}</p>` : ''}
    <div class="field"><label>Note</label><textarea class="input-x" name="note" rows="2" maxlength="300" placeholder="e.g. had a coffee just before, walked there fast">${esc(c?.note ?? '')}</textarea></div>
    ${c ? '' : toggle('logWeight', 'Also save the weight as a weigh-in', true)}
    <div class="btn-row"><button class="btn">${c ? 'Save changes' : 'Save check'}</button>${c ? `<button type="button" class="btn danger" data-act="delFromSheet" data-id="${c.id}">Delete</button>` : ''}</div>
  </form>`;
};

sheets.checks = () => {
  const all = checks();
  const ctx = gradeCtx();
  const keys = Object.keys(METRICS).filter(k => all.some(c => has(c.metrics, k)));
  return `<h2>Health checks ${closeBtn}</h2>
  ${keys.length ? `<div class="label-sm">Every result over time</div><section class="card glass"><div class="list">${keys.map(k => {
    const list = all.filter(c => has(c.metrics, k));
    const last = list.at(-1);
    const r = readCheck(last, ctx).find(x => x.key === k);
    return `<div class="row">${tile(METRICS[k].ic, 'move')}<div class="grow"><div class="t">${METRICS[k].label}</div>
      <div class="d">${list.slice().reverse().slice(0, 6).map(c => `${valueText(c.metrics, k)} <span class="hp-date">${shortDate(c.date)}${c.date.slice(0, 4) !== dayKey().slice(0, 4) ? ` ${c.date.slice(2, 4)}` : ''}</span>`).join(' · ')}</div></div>${chip(r && chipOf(r))}</div>`;
  }).join('')}</div></section>` : ''}
  <div class="label-sm">Checks, newest first</div>
  <section class="card glass"><div class="list">${all.slice().reverse().map(c => {
    const rows = readCheck(c, ctx);
    const flagged = rows.filter(r => r.grade && ['ok', 'low'].includes(r.grade[0]));
    return `<div class="row tap" data-act="sheet" data-sheet="check" data-id="${c.id}" role="button">${tile('medical', 'move')}<div class="grow"><div class="t">${shortDate(c.date)} ${c.date.slice(0, 4)}${c.source ? ` · ${esc(c.source)}` : ''}</div>
      <div class="d">${plural(rows.length, 'result')}${flagged.length ? ` · ${flagged.map(r => esc(r.label.toLowerCase())).join(', ')} flagged` : ' · all in range'}</div></div><div class="chev">${icon('chevron')}</div></div>`;
  }).join('') || '<div class="empty">No checks yet.</div>'}</div></section>
  <button class="btn" data-act="sheet" data-sheet="check">${icon('plus')} Add a health check</button>`;
};

// Reads the form's result fields into a metrics object (blank = not measured).
function formMetrics(f) {
  const m = {};
  for (const k of STORED_KEYS) { const v = clean(k, f.get(`m_${k}`)); if (v != null) m[k] = v; }
  if ((m.bpSys == null) !== (m.bpDia == null)) { delete m.bpSys; delete m.bpDia; }
  return m;
}
const keepLabels = (labels, m) => Object.fromEntries(Object.entries(labels ?? {}).filter(([k]) => has(m, k)));

// A check carrying a weight also counts as a weigh-in, unless that day already has one.
async function weighInFrom(m, date) {
  if (!(m.weight > 0) || of('weight', date).length) return null;
  return addEntry('weight', { kg: Math.round(m.weight * 10) / 10, source: 'check' }, date);
}

forms.check = async f => {
  const metrics = formMetrics(f);
  let labels = {};
  try { labels = JSON.parse(String(f.get('labels') || '{}')); } catch { /* none */ }
  if (!Object.keys(metrics).length) return toast('Add at least one result', { icon: 'info' });
  const date = readDate(f, 'date') || dayKey();
  const fields = { metrics, labels: keepLabels(labels, metrics), source: String(f.get('source') ?? '').trim().slice(0, 60), note: String(f.get('note') ?? '').trim().slice(0, 300), date };
  const id = f.get('id');
  let weighed = null;
  if (id) await updateEntry(id, fields);
  else {
    await addEntry('check', fields, date);
    if (f.get('logWeight')) weighed = await weighInFrom(metrics, date);
  }
  haptic();
  closeSheet();
  const flagged = readCheck({ metrics, labels: fields.labels }).filter(r => r.grade && ['ok', 'low'].includes(r.grade[0]));
  toast(id ? 'Health check updated' : `Check saved${weighed ? ' · weigh-in added' : ''}${flagged.length ? ` · ${flagged.length} to watch` : ''}`, { icon: 'medical' });
  render();
};

Object.assign(actions, {
  async useHeight(el) {
    const cm = Number(el.dataset.cm);
    if (!(cm > 100)) return;
    await setKV('profile', { ...profile(), height: cm });
    haptic();
    toast(`Height set to ${cm} cm`, { icon: 'user' });
    render();
  },
  async useSuggested() {
    const s = suggestedGoals();
    if (!s) return openSheet('profile');
    const prev = state.kv.goals ?? null;
    await setKV('goals', { ...goals(), kcal: s.kcal, protein: s.protein });
    haptic();
    toast(`${fmt(s.kcal)} kcal · ${s.protein} g protein`, { icon: 'target', action: { label: 'Undo', run: async () => { await setKV('goals', prev); render(); } } });
    render();
  },
  parseCheck() {
    const form = sheetForm('check');
    if (!form) return;
    const { metrics, labels, found } = parseResults(form.elements.paste.value);
    const note = document.getElementById('hp-parse-note');
    if (!found.length) { if (note) note.textContent = 'I couldn’t find any results I recognise. Type them into the fields below instead.'; return; }
    for (const [k, v] of Object.entries(metrics)) if (form.elements[`m_${k}`]) form.elements[`m_${k}`].value = v;
    form.elements.labels.value = JSON.stringify(labels);
    if (found.some(k => !METRICS[k].core)) form.querySelector('.hp-more')?.setAttribute('open', '');
    if (note) note.innerHTML = `Found ${plural(found.length, 'result')}: ${found.map(k => esc(METRICS[k].label)).join(', ')}. Check them below, then save.`;
    haptic();
  },
});

// ============================================================
// Assistant tools: Ask can fill in the profile and record checks.
// ============================================================
const ACT_WORD = { light: '1.375', moderate: '1.55', very_active: '1.725', very: '1.725' };
const PACE_WORD = { lean: '250', standard: '400', fast: '600' };
const BG_ARG = { conditions: 'conditions', medications: 'medications', allergies: 'allergies', family_history: 'family', notes: 'notes' };
const TOOL_KEY = Object.fromEntries(Object.entries(METRICS).filter(([, d]) => d.tool).map(([k, d]) => [d.tool, k]));

// "heart_age_years: Elevated; Heart rate: Elevated" → { heartAge: 'Elevated', hr: 'Elevated' }
function readStatuses(text) {
  const out = {};
  for (const part of String(text ?? '').split(/[;\n]+/)) {
    const [name, ...rest] = part.split(':');
    const word = rest.join(':').trim();
    if (!name || !word) continue;
    const n = name.trim().toLowerCase();
    const key = TOOL_KEY[n] ?? (/^bp|blood pressure/.test(n) ? 'bp' : Object.entries(METRICS).find(([k, d]) => k.toLowerCase() === n || d.label.toLowerCase() === n || d.aliases.includes(n))?.[0]);
    if (key) out[key] = word.slice(0, 30);
  }
  return out;
}

export const profileTools = () => [
  {
    name: 'update_health_profile',
    description: 'Save or change the user’s personal health details: sex, age or birthday, height, activity level, bulk pace, and medical background (conditions, medications and supplements, allergies, family history, other notes such as smoking, alcohol or caffeine). Pass only what changes. Text fields replace what is stored, so to add to one include what is already there (see DATA.health_profile.personal).',
    parameters: obj({
      sex: S('string', 'male or female'), age: S('number', 'Age in years'), birth_date: S('string', 'YYYY-MM-DD'), height_cm: S('number', 'Height in cm'),
      activity: S('string', 'light (gym 1–3 days), moderate (3–5 days) or very_active (6–7 days or a physical job)'), bulk_pace: S('string', 'lean, standard or fast'),
      conditions: S('string', 'Medical conditions'), medications: S('string', 'Medications and supplements'), allergies: S('string', 'Allergies and intolerances'),
      family_history: S('string', 'Family medical history'), notes: S('string', 'Other notes for the specialists'),
    }),
  },
  {
    name: 'log_health_check',
    description: 'Record results from a health check: a pharmacy or kiosk health station, a GP visit, a blood test or a body-composition scan. Pass every number given, and the status words the report printed. A check already saved for that date is updated, not duplicated, so this also adds results to an earlier check or corrects one.',
    parameters: obj({
      date: DATE,
      source: S('string', 'Where, e.g. pharmacy health station, GP, blood test'),
      bp_systolic: S('number', 'Blood pressure, top number (mmHg)'), bp_diastolic: S('number', 'Blood pressure, bottom number (mmHg)'),
      ...Object.fromEntries(Object.entries(METRICS).filter(([, d]) => d.tool).map(([, d]) => [d.tool, S('number', `${d.label}${d.unit ? ` (${d.unit})` : ''}`)])),
      reported_statuses: S('string', 'The status word the report gave each result, as "field: word" pairs separated by semicolons, e.g. "heart_age_years: Elevated; resting_heart_rate_bpm: Elevated; diabetes_risk_points: Intermediate"'),
      other_results: S('array', 'Results with no field above', { items: obj({ name: S('string', 'Name'), value: S('string', 'Value'), unit: S('string', 'Unit'), status: S('string', 'Status the report gave') }, ['name', 'value']) }),
      note: S('string', 'Anything worth keeping with it, e.g. "had coffee just before"'),
      also_log_weight: S('boolean', 'Also save the weight as a weigh-in when that day has none. Default true.'),
    }),
  },
  {
    name: 'remove_health_check',
    description: 'Delete the health check saved for a date. Only when the user asks.',
    parameters: obj({ date: S('string', 'YYYY-MM-DD') }, ['date']),
  },
];
// Ask gets them with every other tool; the specialists' chats get only these.
extraTools.push(profileTools);

const isDate = d => /^\d{4}-\d{2}-\d{2}$/.test(d ?? '') && d <= dayKey();

Object.assign(extraRun, {
  async update_health_profile(a) {
    const prev = state.kv.profile ? { ...state.kv.profile } : null;
    const p = { ...profile() };
    const changed = [];
    if (a.sex === 'male' || a.sex === 'female') { p.sex = a.sex; changed.push(a.sex); }
    if (num(a.age) > 10 && num(a.age) < 120) { p.age = Math.round(num(a.age)); changed.push(`age ${p.age}`); }
    if (isDate(a.birth_date)) { p.birth = a.birth_date; changed.push(`born ${a.birth_date}`); }
    if (num(a.height_cm) > 100 && num(a.height_cm) < 250) { p.height = Math.round(num(a.height_cm) * 10) / 10; changed.push(`${p.height} cm`); }
    const act = ACT_WORD[String(a.activity ?? '').toLowerCase()] ?? (ACTIVITY[a.activity] ? String(a.activity) : null);
    if (act) { p.activity = act; changed.push(ACTIVITY[act].split(':')[0].toLowerCase()); }
    const pace = PACE_WORD[String(a.bulk_pace ?? '').toLowerCase()];
    if (pace) { p.pace = pace; changed.push(`${a.bulk_pace} bulk`); }
    for (const [arg, k] of Object.entries(BG_ARG)) {
      if (typeof a[arg] !== 'string') continue;
      const v = a[arg].trim().slice(0, 400);
      if (v) p[k] = v; else delete p[k];
      changed.push(BACKGROUND[k].label.toLowerCase());
    }
    if (!changed.length) return { result: { ok: false, error: 'Nothing to change' } };
    await setKV('profile', p);
    return {
      result: { ok: true, profile: p, age: ageOf(p), suggested_goals: suggestedGoals() },
      card: { icon: 'user', area: 'work', title: 'Health profile updated', sub: changed.join(' · '), kv: { key: 'profile', prev } },
    };
  },

  async log_health_check(a) {
    const date = isDate(a.date) ? a.date : dayKey();
    const metrics = {};
    for (const [tool, k] of Object.entries(TOOL_KEY)) { const v = clean(k, a[tool]); if (v != null) metrics[k] = v; }
    const s = clean('bpSys', a.bp_systolic), d = clean('bpDia', a.bp_diastolic);
    if (s != null && d != null) { metrics.bpSys = s; metrics.bpDia = d; }
    const other = (Array.isArray(a.other_results) ? a.other_results : []).filter(o => o?.name && o.value != null)
      .map(o => ({ name: String(o.name).slice(0, 40), value: String(o.value).slice(0, 20), unit: String(o.unit ?? '').slice(0, 15), status: String(o.status ?? '').slice(0, 30) }));
    if (!Object.keys(metrics).length && !other.length && !a.note) return { result: { ok: false, error: 'No results to save' } };
    const labels = keepLabels(readStatuses(a.reported_statuses), metrics);
    const existing = of('check', date)[0];
    let e;
    if (existing) {
      const merged = { ...existing.metrics, ...metrics };
      const otherByName = new Map([...(existing.other ?? []), ...other].map(o => [o.name.toLowerCase(), o]));
      e = await updateEntry(existing.id, {
        metrics: merged, labels: { ...keepLabels(existing.labels, merged), ...labels }, other: [...otherByName.values()],
        source: String(a.source ?? '').trim().slice(0, 60) || existing.source || '', note: a.note ? String(a.note).slice(0, 300) : existing.note ?? '',
      });
    } else {
      e = await addEntry('check', { metrics, labels, other, source: String(a.source ?? '').trim().slice(0, 60), note: String(a.note ?? '').slice(0, 300) }, date);
    }
    const weighed = a.also_log_weight === false ? null : await weighInFrom(e.metrics, date);
    const rows = readCheck(e, gradeCtx());
    const flagged = rows.filter(r => r.grade && ['ok', 'low'].includes(r.grade[0]));
    const h = heightInfo();
    return {
      result: {
        ok: true, date, updated_existing: !!existing, saved: rows.map(r => `${r.label} ${r.value} ${r.unit}`.trim()),
        graded: rows.map(r => `${r.label}: ${r.grade?.[1] || r.reported || 'not graded'}${r.grade?.[2] ? ` (${r.grade[2]})` : ''}`),
        weigh_in_added: !!weighed,
        height_note: h?.source === 'check' ? `Height isn't in the profile; this check implies about ${h.cm} cm. Ask whether to save it (update_health_profile).` : h ? null : 'Height is missing from the profile; ask for it.',
        age_note: ageOf() ? null : 'Age is missing from the profile, so heart age can’t be judged; ask for it.',
      },
      card: {
        icon: 'medical', area: 'move', title: `Health check · ${shortDate(date)}`,
        sub: `${plural(rows.length, 'result')}${flagged.length ? ` · watch: ${flagged.map(r => r.label.toLowerCase()).join(', ')}` : ' · all in range'}${weighed ? ' · weigh-in added' : ''}`,
        ids: [existing ? null : e.id, weighed?.id].filter(Boolean),
        // Undoing an update puts the old check back whole, never half-merged.
        restore: existing ? [existing] : undefined,
      },
    };
  },

  async remove_health_check(a) {
    const c = of('check', a.date)[0];
    if (!c) return { result: { ok: false, error: `No health check saved on ${a.date}` } };
    await removeEntry(c.id);
    return { result: { ok: true }, card: { icon: 'trash', area: 'move', title: `Health check removed`, sub: shortDate(c.date), restore: [c] } };
  },
});

promptSections.push(() => `- HEALTH PROFILE: DATA.health_profile holds the user's personal details (sex, age, height, activity, medical background) and every health check they've recorded. When they share results from a health check, pharmacy health station, GP visit or blood test (typed, pasted or in a photo), call log_health_check ONCE with every number and the status words the report printed; a second check on another date is a new record, and the same date merges. When they tell you their height, age, birthday, sex, activity, conditions, medications, supplements, allergies or family history, call update_health_profile. If height is missing, ask for it: it drives BMI, lean mass and calorie targets. Read results against their logs (sleep, training, food) rather than on their own, and point to the specialist tabs for a full consult.`);
