// Read-only views over the stored entries (health, habits, goals).
import { state } from './store.js';
import { dayKey, addDays, toDate, mean, sum, clamp } from './util.js';

export const DEFAULT_GOALS = { kcal: 3000, protein: 160, water: 8, sleep: 8 };
export const DEFAULT_HABITS = [
  { id: 'gym', name: 'Gym', icon: 'dumbbell' },
  { id: 'protein', name: 'Protein', icon: 'shaker' },
  { id: 'study', name: 'Study', icon: 'book' },
  { id: 'bed', name: 'Bed by 11', icon: 'bed' },
];

// Sane bounds, applied on the way out. Today draws one tappable drop per glass
// of water, so a goal of 5000 (a typo, or the assistant mishearing) used to bury
// the screen in buttons; a stored value this far out is a mistake, not a plan.
const GOAL_LIMITS = { kcal: [500, 10000], protein: [10, 500], water: [1, 30], sleep: [2, 16] };
export const goals = () => {
  const g = { ...DEFAULT_GOALS, ...state.kv.goals };
  for (const [k, [lo, hi]] of Object.entries(GOAL_LIMITS)) {
    g[k] = Number.isFinite(Number(g[k])) ? clamp(Number(g[k]), lo, hi) : DEFAULT_GOALS[k];
  }
  return g;
};
// Timed activities you do, as opposed to appointments you attend. Study is split
// several ways because "did I study?" and "did the freelance build move?" are
// different questions, and months later you want to ask them separately.
export const BLOCK_KINDS = {
  study: { label: 'Study', icon: 'book', color: 'school' },
  revision: { label: 'Revision', icon: 'exam', color: 'school' },
  reading: { label: 'Reading', icon: 'brain', color: 'sleep' },
  coding: { label: 'Coding', icon: 'code', color: 'work' },
  admin: { label: 'Admin', icon: 'list', color: 'money' },
  chores: { label: 'Chores', icon: 'home', color: 'diet' },
  social: { label: 'Social', icon: 'users', color: 'move' },
  rest: { label: 'Rest', icon: 'leaf', color: 'diet' },
};
export const kindOf = k => BLOCK_KINDS[k] ?? BLOCK_KINDS.study;
export const blocks = () => of('block');
export const runningBlock = () => blocks().find(b => !b.end);

// Older habits stored an emoji; give them an icon.
export const habits = () => (state.kv.habits ?? DEFAULT_HABITS).map(h => ({ icon: DEFAULT_HABITS.find(d => d.id === h.id)?.icon ?? 'star', ...h }));

// Entries are read hundreds of times per screen and change a few times a day, so
// group them once per change instead of filtering and sorting the whole list on
// every call. The index is rebuilt lazily the first time it's read after a write.
let idx = null;
function index() {
  if (idx?.version === state.version) return idx;
  const byType = new Map(), byTypeDay = new Map(), byId = new Map(), loggedDays = new Set(), habitDays = new Set();
  const push = (map, key, e) => { const list = map.get(key); if (list) list.push(e); else map.set(key, [e]); };
  for (const e of [...state.entries].sort((a, b) => a.ts - b.ts)) {
    push(byType, e.type, e);
    push(byTypeDay, `${e.type}\n${e.date}`, e);
    byId.set(e.id, e);
    if (LOG_TYPES.has(e.type)) loggedDays.add(e.date);
    if (e.type === 'habit') habitDays.add(`${e.habitId}\n${e.date}`);
  }
  idx = { version: state.version, byType, byTypeDay, byId, loggedDays, habitDays };
  return idx;
}

// A copy, because plenty of callers sort or reverse what they get back.
export const of = (type, date) => {
  const i = index();
  const list = date == null ? i.byType.get(type) : i.byTypeDay.get(`${type}\n${date}`);
  return list ? list.slice() : [];
};
export const byId = id => index().byId.get(id);
export const kcalOn = d => sum(of('meal', d), 'kcal');
export const proteinOn = d => sum(of('meal', d), 'protein');
export const waterOn = d => sum(of('water', d), 'amount');
export const sleepOn = d => sum(of('sleep', d), 'hours');
export const weights = () => of('weight').sort((a, b) => a.date.localeCompare(b.date) || a.ts - b.ts);
export const habitDone = (id, d) => index().habitDays.has(`${id}\n${d}`);
const LOG_TYPES = new Set(['meal', 'water', 'sleep', 'weight', 'habit', 'workout', 'block']);
export const anyLogOn = d => index().loggedDays.has(d);

// Consecutive days ending today (or yesterday, if today isn't done yet).
export function streak(test) {
  let d = dayKey();
  if (!test(d)) d = addDays(d, -1);
  let n = 0;
  while (test(d)) { n++; d = addDays(d, -1); }
  return n;
}

// Weight trend over the 4 weeks up to `end` (least squares), in kg per week.
export function weeklyRate(end = dayKey()) {
  const ws = weights().filter(w => w.date >= addDays(end, -28) && w.date <= end);
  if (ws.length < 2) return null;
  const xs = ws.map(w => (toDate(w.date) - toDate(ws[0].date)) / 864e5);
  if (xs.at(-1) < 6) return null;
  const ys = ws.map(w => w.kg), mx = mean(xs), my = mean(ys);
  const slope = xs.reduce((t, x, i) => t + (x - mx) * (ys[i] - my), 0) / xs.reduce((t, x) => t + (x - mx) ** 2, 0);
  return slope * 7;
}

// Lean bulk: gain about 0.25–0.5% of body weight per week.
export function bulkStatus(rate, kg) {
  const lo = kg * 0.0025, hi = kg * 0.005;
  if (rate < lo) return { text: 'Gaining slowly: eat a little more', color: 'var(--school-ink)' };
  if (rate > hi) return { text: 'Faster than a lean bulk', color: 'var(--move-ink)' };
  return { text: 'On track for a lean bulk', color: 'var(--diet-ink)' };
}

// Mifflin–St Jeor resting energy, times activity: what a day costs before any surplus.
export function maintenanceKcal({ sex, age, height, activity }, weight) {
  const factor = Number(activity);
  if (!(age > 10 && height > 100 && weight > 30 && factor > 1)) return null;
  const bmr = 10 * weight + 6.25 * height - 5 * age + (sex === 'female' ? -161 : 5);
  return bmr * factor;
}

// Bulking split: protein from goals, fat ~25% of calories, carbs fill the rest.
export function macroTargets(g = goals()) {
  const fat = Math.round((g.kcal * 0.25) / 9);
  return { fat, carbs: Math.max(0, Math.round((g.kcal - g.protein * 4 - fat * 9) / 4)) };
}

export function sleepHours(bed, wake) {
  if (!bed || !wake) return 0;
  const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  let mins = toMin(wake) - toMin(bed);
  if (mins <= 0) mins += 24 * 60;
  return Math.round((mins / 60) * 100) / 100;
}

export function recentMeals() {
  const seen = new Map();
  of('meal').reverse().forEach(m => { const k = m.name.toLowerCase(); if (!seen.has(k)) seen.set(k, m); });
  return [...seen.values()].slice(0, 8);
}

export const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
