// v3 AI: Gemini client, a compact snapshot of the user's data, and the tools the model may call.
// The API key lives only in this device's storage and is sent only to Google's Gemini API.
import { state, addEntry, removeEntry, putEntry, setKV } from './store.js';
import { dayKey, addDays, lastDays, monthKey, nowHHMM, fmt, fmt1, money, num, weekStart } from './util.js';
import { goals, habits, of, kcalOn, proteinOn, waterOn, sleepOn, weights, weeklyRate, habitDone, sleepHours } from './data.js';
import { routine, nextDay, workouts, exById, exByName, addCustomExercise, recordWorkout } from './gym.js';
import { courses, assessments, tasks, shifts, jobs, jobOf, shiftHours, shiftPay, projects, invoices, invoiceStatus, courseResult, band, AREAS } from './plan.js';
import { CATEGORIES, INCOME, ACCOUNTS, monthSummary, bills, budgets, spentIn, goalsList } from './money.js';

const API = 'https://generativelanguage.googleapis.com/v1beta';
export const aiSettings = () => ({ key: '', model: '', ...state.kv.ai });
export const hasAI = () => !!aiSettings().key;

async function call(path, body) {
  const { key } = aiSettings();
  const res = await fetch(`${API}/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error?.message ?? `Gemini error ${res.status}`);
  return data;
}

// Pick the newest general "Flash" model this key can use (names change often).
export async function listModels() {
  const data = await call('models?pageSize=200');
  return (data.models ?? [])
    .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
    .map(m => m.name.replace(/^models\//, ''))
    .filter(n => /^gemini-/.test(n) && /flash/.test(n) && !/(lite|image|tts|live|audio|embed|exp|thinking|8b|robotics|computer)/.test(n));
}
export function bestModel(names) {
  const version = n => parseFloat(n.match(/gemini-(\d+(?:\.\d+)?)/)?.[1] ?? 0);
  const stable = names.filter(n => !/preview/.test(n) && !/latest/.test(n));
  const pool = stable.length ? stable : names.filter(n => !/latest/.test(n));
  return pool.sort((a, b) => version(b) - version(a) || a.length - b.length)[0] ?? 'gemini-flash-latest';
}

// Gemini 2.5 and newer think before they answer, and the thinking comes out of
// the same output budget. With a small cap a long message (a whole gym routine,
// say) spends the budget on thoughts and the reply comes back with no parts —
// which read as "Sorry, I didn't catch that". So: a roomy cap and no thinking.
// A few models refuse to turn thinking off, so drop the setting and retry once.
let noThinking = true;

export async function generate({ system, contents, tools }) {
  const model = aiSettings().model || 'gemini-flash-latest';
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents,
    ...(tools ? { tools: [{ functionDeclarations: tools }], toolConfig: { functionCallingConfig: { mode: 'AUTO' } } } : {}),
    generationConfig: { temperature: 0.4, maxOutputTokens: 8192, ...(noThinking ? { thinkingConfig: { thinkingBudget: 0 } } : {}) },
  };
  try {
    return await call(`models/${model}:generateContent`, body);
  } catch (err) {
    if (!noThinking || !/thinking|thought/i.test(String(err.message ?? err))) throw err;
    noThinking = false; // this model always thinks; let it, the cap is big enough
    delete body.generationConfig.thinkingConfig;
    return call(`models/${model}:generateContent`, body);
  }
}

// ---------- context ----------
export function snapshot() {
  const t = dayKey();
  const g = goals();
  const days = lastDays(7);
  const r = routine();
  const ms = monthSummary();
  const b = budgets();
  const ws = weights();
  return {
    now: `${new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} ${nowHHMM()}`,
    today: t,
    goals: g,
    today_totals: { kcal: kcalOn(t), protein_g: proteinOn(t), water_glasses: waterOn(t), sleep_h: sleepOn(t), meals: of('meal', t).map(m => `${m.name} ${fmt(m.kcal)}kcal ${fmt(m.protein)}gP`) },
    last_7_days: days.map(d => ({ d, kcal: kcalOn(d), protein: proteinOn(d), water: waterOn(d), sleep_h: sleepOn(d) })),
    habits: habits().map(h => ({ name: h.name, done_today: habitDone(h.id, t) })),
    body: { latest_kg: ws.at(-1)?.kg ?? null, trend_kg_per_week: weeklyRate() != null ? fmt1(weeklyRate()) : null, goal: 'lean bulk' },
    gym: {
      routine: r ? { name: r.name, per_week: r.perWeek, days: r.days.map(d => `${d.name}: ${d.exercises.map(x => `${exById(x.exId).name} ${x.sets}x${x.repMin}-${x.repMax}`).join(', ')}`) } : null,
      next_day: nextDay()?.name ?? null,
      this_week_workouts: workouts().filter(w => w.date >= weekStart()).length,
      recent: workouts().slice(0, 5).map(w => `${w.date} ${w.name}: ${w.exercises.map(x => `${exById(x.exId).name} ${x.sets.map(s => `${s.kg}x${s.reps}`).join('/')}`).join('; ')}`),
    },
    uni: {
      courses: courses().map(c => { const res = courseResult(c.id); return `${c.code} ${c.name}${res.average != null ? ` avg ${fmt(res.average)}% (${band(res.average)})` : ''}`; }),
      upcoming: assessments().filter(a => !a.done && a.due >= t).slice(0, 8).map(a => `${a.due} ${a.title} (${courses().find(c => c.id === a.courseId)?.code ?? ''}${a.weight ? `, ${a.weight}%` : ''})`),
    },
    tasks_open: tasks().filter(x => !x.done).slice(0, 15).map(x => `${x.title}${x.due ? ` due ${x.due}` : ''}`),
    work: {
      jobs: jobs().map(j => ({ name: j.name, weekday_rate: j.rate, saturday_rate: j.sat, sunday_rate: j.sun })),
      upcoming_shifts: shifts().filter(s => s.date >= t).slice(0, 8).map(s => `${s.date} ${jobOf(s).name} ${s.start}-${s.end} (${fmt1(shiftHours(s))}h, ${money(shiftPay(s), false)})`),
      projects: projects().filter(p => p.status !== 'done').map(p => `${p.title}${p.deadline ? ` due ${p.deadline}` : ''}${p.fee ? ` fee ${p.fee}` : ''}`),
      unpaid_invoices: invoices().filter(i => i.status !== 'paid').map(i => `${i.number} ${money(i.amount, false)} ${invoiceStatus(i)} due ${i.due}`),
    },
    money: {
      month: monthKey(),
      spent: Math.round(ms.spent), income: Math.round(ms.income), budget_total: Math.round(ms.budgetTotal), left: Math.round(ms.left),
      by_category: Object.keys(CATEGORIES).map(k => ({ k, spent: Math.round(spentIn(ms.list, k)), budget: Number(b[k]) || 0 })).filter(x => x.spent || x.budget),
      bills_due_14d: bills().filter(x => x.next <= addDays(t, 14)).map(x => `${x.name} ${money(Number(x.amount))} ${x.next}`),
      savings: goalsList().map(g => `${g.name} ${money(Number(g.saved), false)}/${money(Number(g.target), false)}`),
    },
  };
}

export function systemPrompt() {
  return `You are Loop, the friendly assistant inside a personal life-manager iPhone app. The user is a university student in Australia who lifts weights (lean bulking), has part-time job(s) (listed under work.jobs) and does freelance web building. Use Australian English, metric units and AUD.

Rules:
- When the user tells you something they ate, drank, did, lifted, spent, earned or need to do, CALL THE MATCHING TOOL. Several tools in one turn is fine.
- Estimate calories and macros for foods from typical Australian portions when not given. Be realistic.
- Dates are YYYY-MM-DD. Default to today (${dayKey()}) unless they say otherwise ("yesterday", "on Friday"...).
- For questions, answer from the DATA below. Never invent numbers that aren't there. If data is missing, say so briefly.
- Keep replies short: 1–3 sentences, warm and encouraging, no markdown headings. After logging, confirm in one line and add one useful nudge (e.g. protein left for the bulk).
- When asked to plan (study plan, week plan, gym routine), create the items with tools (add_event, add_task, create_routine) and summarise.

DATA (JSON):
${JSON.stringify(snapshot())}`;
}

// ---------- tools ----------
const S = (type, description, extra = {}) => ({ type, description, ...extra });
const DATE = S('string', 'YYYY-MM-DD, default today');
const TIME = d => S('string', `${d}, 24h HH:MM`);
const obj = (properties, required = []) => ({ type: 'object', properties, required });

export const tools = () => [
  { name: 'log_meal', description: 'Log food or drink the user ate.', parameters: obj({ name: S('string', 'Short meal name'), kcal: S('number', 'Calories'), protein_g: S('number', 'Protein grams'), carbs_g: S('number', 'Carb grams'), fat_g: S('number', 'Fat grams'), date: DATE }, ['name', 'kcal', 'protein_g']) },
  { name: 'log_water', description: 'Add glasses of water (250 ml each).', parameters: obj({ glasses: S('number', 'Number of glasses') }, ['glasses']) },
  { name: 'log_sleep', description: 'Log a night of sleep.', parameters: obj({ bed: TIME('Bed time'), wake: TIME('Wake time'), date: S('string', 'The morning they woke up, YYYY-MM-DD') }, ['bed', 'wake']) },
  { name: 'log_weight', description: 'Log a body-weight weigh-in.', parameters: obj({ kg: S('number', 'Body weight in kg'), date: DATE }, ['kg']) },
  { name: 'set_habit', description: 'Mark a daily habit done or not done today.', parameters: obj({ habit: S('string', `Habit name, one of: ${habits().map(h => h.name).join(', ')}`), done: S('boolean', 'true = done') }, ['habit', 'done']) },
  {
    name: 'log_workout', description: 'Log a gym workout with sets.',
    parameters: obj({
      name: S('string', 'Workout name, e.g. Push day'), date: DATE, duration_min: S('number', 'Minutes, default 60'),
      exercises: S('array', 'Exercises done', { items: obj({ exercise: S('string', 'Exercise name'), muscle: S('string', 'chest, back, shoulders, legs, arms or core'), sets: S('array', 'Sets', { items: obj({ kg: S('number', 'Weight in kg (0 for bodyweight)'), reps: S('number', 'Reps') }, ['kg', 'reps']) }) }, ['exercise', 'sets']) }),
    }, ['exercises']),
  },
  {
    name: 'create_routine', description: 'Create or replace the gym routine (a weekly split).',
    parameters: obj({
      name: S('string', 'Routine name'), per_week: S('number', 'Workouts per week'),
      days: S('array', 'Training days in order', { items: obj({ name: S('string', 'Day name'), exercises: S('array', 'Exercises', { items: obj({ exercise: S('string', 'Exercise name'), muscle: S('string', 'chest, back, shoulders, legs, arms or core'), sets: S('number', 'Sets'), rep_min: S('number', 'Min reps'), rep_max: S('number', 'Max reps') }, ['exercise', 'sets', 'rep_min', 'rep_max']) }) }, ['name', 'exercises']) }),
    }, ['name', 'days']),
  },
  { name: 'add_task', description: 'Add a to-do task.', parameters: obj({ title: S('string', 'Task'), due: S('string', 'YYYY-MM-DD, optional'), area: S('string', `One of: ${Object.keys(AREAS).join(', ')}`) }, ['title']) },
  { name: 'add_event', description: 'Add a calendar event (study block, appointment, plan).', parameters: obj({ title: S('string', 'Title'), date: DATE, start: TIME('Start'), end: TIME('End'), area: S('string', `One of: ${Object.keys(AREAS).join(', ')}`), note: S('string', 'Optional note') }, ['title', 'date']) },
  { name: 'add_shift', description: 'Add a shift at one of the user’s part-time jobs.', parameters: obj({ job: S('string', `Which job, one of: ${jobs().map(j => j.name).join(', ')}`), date: DATE, start: TIME('Start'), end: TIME('End'), break_min: S('number', 'Unpaid break minutes') }, ['date', 'start', 'end']) },
  { name: 'add_assessment', description: 'Add a uni assessment or exam due date.', parameters: obj({ course_code: S('string', 'Course code, e.g. COMP2123'), title: S('string', 'Title'), due: S('string', 'YYYY-MM-DD'), weight: S('number', 'Weight %'), kind: S('string', 'assignment, exam, quiz, presentation or report') }, ['course_code', 'title', 'due']) },
  { name: 'log_expense', description: 'Log money the user spent.', parameters: obj({ amount: S('number', 'AUD amount'), merchant: S('string', 'Where'), category: S('string', `One of: ${Object.keys(CATEGORIES).join(', ')}`), account: S('string', `One of: ${Object.keys(ACCOUNTS).filter(k => k !== 'savings').join(', ')}`), date: DATE, note: S('string', 'Optional') }, ['amount', 'category']) },
  { name: 'log_income', description: 'Log money the user received.', parameters: obj({ amount: S('number', 'AUD amount'), source: S('string', 'From whom'), category: S('string', `One of: ${Object.keys(INCOME).join(', ')}`), account: S('string', 'westpac, revolut or cash'), date: DATE }, ['amount', 'category']) },
  { name: 'set_goals', description: 'Change daily goals.', parameters: obj({ kcal: S('number', 'Calories'), protein: S('number', 'Protein g'), water: S('number', 'Glasses'), sleep: S('number', 'Hours') }) },
];

const validDate = d => (/^\d{4}-\d{2}-\d{2}$/.test(d ?? '') ? d : dayKey());
const validTime = t => (/^\d{1,2}:\d{2}$/.test(t ?? '') ? t.padStart(5, '0') : null);
const pick = (v, allowed, dflt) => (Object.prototype.hasOwnProperty.call(allowed, v) ? v : dflt);

// Each tool returns { result (sent back to the model), card (shown in chat with Undo) }.
const RUN = {
  async log_meal(a) {
    const e = await addEntry('meal', { name: String(a.name).slice(0, 60), kcal: Math.round(num(a.kcal)), protein: Math.round(num(a.protein_g)), carbs: Math.round(num(a.carbs_g)), fat: Math.round(num(a.fat_g)), source: 'ai' }, validDate(a.date));
    return { result: { ok: true, kcal_today: kcalOn(dayKey()), protein_today: proteinOn(dayKey()) }, card: { icon: 'diet', area: 'diet', title: e.name, sub: `${fmt(e.kcal)} kcal · P ${e.protein}g · C ${e.carbs}g · F ${e.fat}g`, ids: [e.id] } };
  },
  async log_water(a) {
    const n = Math.max(1, Math.min(10, Math.round(num(a.glasses))));
    const ids = [];
    for (let i = 0; i < n; i++) ids.push((await addEntry('water', { amount: 1 }, dayKey())).id);
    return { result: { ok: true, water_today: waterOn(dayKey()), goal: goals().water }, card: { icon: 'drop', area: 'work', title: `${n} glass${n > 1 ? 'es' : ''} of water`, sub: `${waterOn(dayKey())} of ${goals().water} today`, ids } };
  },
  async log_sleep(a) {
    const bed = validTime(a.bed), wake = validTime(a.wake);
    if (!bed || !wake) return { result: { ok: false, error: 'Need bed and wake times' } };
    const date = validDate(a.date);
    const hours = sleepHours(bed, wake);
    const old = of('sleep', date);
    for (const e of old) await removeEntry(e.id);
    const e = await addEntry('sleep', { bed, wake, hours }, date);
    return { result: { ok: true, hours }, card: { icon: 'moon', area: 'sleep', title: `${fmt1(hours)} h of sleep`, sub: `${bed} → ${wake}`, ids: [e.id], restore: old } };
  },
  async log_weight(a) {
    const kg = Math.round(num(a.kg) * 10) / 10;
    if (kg < 20 || kg > 300) return { result: { ok: false, error: 'Weight looks wrong' } };
    const date = validDate(a.date);
    const old = of('weight', date);
    for (const e of old) await removeEntry(e.id);
    const e = await addEntry('weight', { kg }, date);
    return { result: { ok: true, kg, trend_kg_per_week: weeklyRate() }, card: { icon: 'scale', area: 'move', title: `${kg} kg`, sub: 'Weigh-in saved', ids: [e.id], restore: old } };
  },
  async set_habit(a) {
    const h = habits().find(x => x.name.toLowerCase() === String(a.habit).toLowerCase()) ?? habits().find(x => x.name.toLowerCase().includes(String(a.habit).toLowerCase()));
    if (!h) return { result: { ok: false, error: `No habit called ${a.habit}` } };
    const t = dayKey();
    const existing = state.entries.find(e => e.type === 'habit' && e.habitId === h.id && e.date === t);
    if (a.done && !existing) {
      const e = await addEntry('habit', { habitId: h.id }, t);
      return { result: { ok: true }, card: { icon: h.icon, area: 'diet', title: `${h.name} done`, sub: 'Habit ticked', ids: [e.id] } };
    }
    if (!a.done && existing) {
      await removeEntry(existing.id);
      return { result: { ok: true }, card: { icon: h.icon, area: 'diet', title: `${h.name} unticked`, sub: 'Habit', restore: [existing] } };
    }
    return { result: { ok: true, unchanged: true } };
  },
  async log_workout(a) {
    const exercises = [];
    const created = [];
    for (const x of a.exercises ?? []) {
      let ex = exByName(x.exercise);
      if (!ex) { ex = await addCustomExercise(x.exercise, x.muscle); created.push(ex.id); }
      const sets = (x.sets ?? []).map(s => ({ kg: num(s.kg), reps: Math.round(num(s.reps)) })).filter(s => s.reps > 0);
      if (sets.length) exercises.push({ exId: ex.id, sets });
    }
    if (!exercises.length) return { result: { ok: false, error: 'No sets found' } };
    const date = validDate(a.date);
    const end = date === dayKey() ? Date.now() : new Date(`${date}T19:00`).getTime();
    const e = await recordWorkout({ name: a.name || 'Workout', start: end - (num(a.duration_min) || 60) * 60000, end, exercises });
    const sets = exercises.reduce((t, x) => t + x.sets.length, 0);
    return {
      result: { ok: true, prs: e.prs.map(id => exById(id).name), sets },
      card: { icon: e.prs.length ? 'trophy' : 'dumbbell', area: 'move', title: e.name, sub: `${exercises.length} exercises · ${sets} sets${e.prs.length ? ` · PR: ${e.prs.map(id => exById(id).name).join(', ')}` : ''}`, ids: [e.id, e.habitEntryId].filter(Boolean), confetti: e.prs.length > 0 },
    };
  },
  async create_routine(a) {
    const prev = state.kv.routine ?? null;
    const days = [];
    for (const d of a.days ?? []) {
      const exs = [];
      for (const x of d.exercises ?? []) {
        const ex = exByName(x.exercise) ?? await addCustomExercise(x.exercise, x.muscle);
        exs.push({ exId: ex.id, sets: Math.max(1, Math.round(num(x.sets)) || 3), repMin: Math.max(1, Math.round(num(x.rep_min)) || 8), repMax: Math.max(1, Math.round(num(x.rep_max)) || 12) });
      }
      days.push({ id: `d_${days.length}_${Date.now().toString(36)}`, name: String(d.name).slice(0, 30), exercises: exs });
    }
    if (!days.length) return { result: { ok: false, error: 'No days' } };
    await setKV('routine', { template: 'ai', name: String(a.name || 'My routine').slice(0, 40), perWeek: Math.round(num(a.per_week)) || days.length, days });
    return { result: { ok: true, days: days.length }, card: { icon: 'list', area: 'move', title: a.name || 'New routine', sub: days.map(d => d.name).join(' · '), kv: { key: 'routine', prev } } };
  },
  async add_task(a) {
    const e = await addEntry('task', { title: String(a.title).slice(0, 80), due: /^\d{4}-\d{2}-\d{2}$/.test(a.due ?? '') ? a.due : null, area: pick(a.area, AREAS, 'life'), done: false, source: 'ai' }, dayKey());
    return { result: { ok: true }, card: { icon: 'list', area: AREAS[e.area].color, title: e.title, sub: e.due ? `Task · due ${e.due}` : 'Task', ids: [e.id] } };
  },
  async add_event(a) {
    const area = pick(a.area, AREAS, 'life');
    const e = await addEntry('event', { title: String(a.title).slice(0, 80), start: validTime(a.start) ?? '', end: validTime(a.end) ?? '', area, note: String(a.note ?? '').slice(0, 120), source: 'ai' }, validDate(a.date));
    return { result: { ok: true }, card: { icon: 'calendar', area: AREAS[area].color, title: e.title, sub: `${e.date}${e.start ? ` · ${e.start}${e.end ? `–${e.end}` : ''}` : ''}`, ids: [e.id] } };
  },
  async add_shift(a) {
    const start = validTime(a.start), end = validTime(a.end);
    if (!start || !end) return { result: { ok: false, error: 'Need start and end' } };
    const want = String(a.job ?? '').trim().toLowerCase();
    const j = jobs().find(x => x.name.toLowerCase() === want) ?? jobs().find(x => want && (x.name.toLowerCase().includes(want) || want.includes(x.name.toLowerCase()))) ?? jobs()[0];
    const e = await addEntry('shift', { jobId: j.id, start, end, breakMin: Math.round(num(a.break_min)), rate: null, source: 'ai' }, validDate(a.date));
    return { result: { ok: true, job: j.name, hours: shiftHours(e), pay: Math.round(shiftPay(e)) }, card: { icon: j.icon, area: j.color, title: `${j.name} shift`, sub: `${e.date} · ${start}–${end} · ≈ ${money(shiftPay(e), false)}`, ids: [e.id] } };
  },
  async add_assessment(a) {
    const code = String(a.course_code).toUpperCase().replace(/\s+/g, '');
    let c = courses().find(x => x.code === code);
    const ids = [];
    if (!c) { c = await addEntry('course', { code, name: code, credits: 6, color: 'school' }, dayKey()); ids.push(c.id); }
    const kind = ['assignment', 'exam', 'quiz', 'presentation', 'report'].includes(a.kind) ? a.kind : 'assignment';
    const e = await addEntry('assessment', { courseId: c.id, title: String(a.title).slice(0, 60), kind, weight: num(a.weight), due: validDate(a.due), dueTime: '', score: null, done: false }, dayKey());
    ids.push(e.id);
    return { result: { ok: true }, card: { icon: kind === 'exam' ? 'exam' : 'pen', area: 'school', title: e.title, sub: `${code} · due ${e.due}${e.weight ? ` · ${e.weight}%` : ''}`, ids } };
  },
  async log_expense(a) {
    const amount = Math.abs(num(a.amount));
    if (!amount) return { result: { ok: false, error: 'No amount' } };
    const category = pick(a.category, CATEGORIES, 'other');
    const e = await addEntry('txn', { kind: 'expense', amount, category, account: pick(a.account, ACCOUNTS, 'westpac'), merchant: String(a.merchant ?? '').slice(0, 60), note: String(a.note ?? '').slice(0, 100), source: 'ai' }, validDate(a.date));
    const ms = monthSummary();
    const cap = Number(budgets()[category]) || 0;
    return { result: { ok: true, category_spent_this_month: Math.round(spentIn(ms.list, category)), category_budget: cap, left_this_month: Math.round(ms.left) }, card: { icon: CATEGORIES[category].icon, area: CATEGORIES[category].area, title: `−${money(amount)} ${e.merchant}`.trim(), sub: `${CATEGORIES[category].label}${cap ? ` · ${money(Math.max(0, cap - spentIn(ms.list, category)), false)} left` : ''}`, ids: [e.id] } };
  },
  async log_income(a) {
    const amount = Math.abs(num(a.amount));
    if (!amount) return { result: { ok: false, error: 'No amount' } };
    const category = pick(a.category, INCOME, 'other_in');
    const e = await addEntry('txn', { kind: 'income', amount, category, account: pick(a.account, ACCOUNTS, 'westpac'), merchant: String(a.source ?? '').slice(0, 60), source: 'ai' }, validDate(a.date));
    return { result: { ok: true }, card: { icon: INCOME[category].icon, area: 'diet', title: `+${money(amount)} ${e.merchant}`.trim(), sub: INCOME[category].label, ids: [e.id] } };
  },
  async set_goals(a) {
    const prev = state.kv.goals ?? null;
    const g = { ...goals() };
    for (const k of ['kcal', 'protein', 'water', 'sleep']) if (num(a[k]) > 0) g[k] = num(a[k]);
    await setKV('goals', g);
    return { result: { ok: true, goals: g }, card: { icon: 'target', area: 'move', title: 'Goals updated', sub: `${fmt(g.kcal)} kcal · ${g.protein} g protein · ${g.water} glasses · ${g.sleep} h`, kv: { key: 'goals', prev } } };
  },
};

export async function runTool(name, args) {
  try {
    return (await RUN[name]?.(args ?? {})) ?? { result: { ok: false, error: `Unknown tool ${name}` } };
  } catch (err) {
    return { result: { ok: false, error: String(err.message ?? err) } };
  }
}

// Undo what a chat card did: remove created entries, restore replaced ones or a setting.
export async function undoCard(card) {
  for (const id of card.ids ?? []) await removeEntry(id);
  for (const e of card.restore ?? []) await putEntry(e);
  if (card.kv) await setKV(card.kv.key, card.kv.prev);
}
