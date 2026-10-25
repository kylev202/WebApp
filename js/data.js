// Read-only views over the stored entries (health, habits, goals).
import { state } from './store.js';
import { dayKey, addDays, toDate, mean, sum } from './util.js';

export const DEFAULT_GOALS = { kcal: 3000, protein: 160, water: 8, sleep: 8 };
export const DEFAULT_HABITS = [
  { id: 'gym', name: 'Gym', icon: 'dumbbell' },
  { id: 'protein', name: 'Protein', icon: 'shaker' },
  { id: 'study', name: 'Study', icon: 'book' },
  { id: 'bed', name: 'Bed by 11', icon: 'bed' },
];

export const goals = () => ({ ...DEFAULT_GOALS, ...state.kv.goals });
// Older habits stored an emoji; give them an icon.
export const habits = () => (state.kv.habits ?? DEFAULT_HABITS).map(h => ({ icon: DEFAULT_HABITS.find(d => d.id === h.id)?.icon ?? 'star', ...h }));

export const of = (type, date) => state.entries.filter(e => e.type === type && (date == null || e.date === date)).sort((a, b) => a.ts - b.ts);
export const byId = id => state.entries.find(e => e.id === id);
export const kcalOn = d => sum(of('meal', d), 'kcal');
export const proteinOn = d => sum(of('meal', d), 'protein');
export const waterOn = d => sum(of('water', d), 'amount');
export const sleepOn = d => sum(of('sleep', d), 'hours');
export const weights = () => of('weight').sort((a, b) => a.date.localeCompare(b.date) || a.ts - b.ts);
export const habitDone = (id, d) => state.entries.some(e => e.type === 'habit' && e.habitId === id && e.date === d);
const LOG_TYPES = new Set(['meal', 'water', 'sleep', 'weight', 'habit', 'workout']);
export const anyLogOn = d => state.entries.some(e => e.date === d && LOG_TYPES.has(e.type));

// Consecutive days ending today (or yesterday, if today isn't done yet).
export function streak(test) {
  let d = dayKey();
  if (!test(d)) d = addDays(d, -1);
  let n = 0;
  while (test(d)) { n++; d = addDays(d, -1); }
  return n;
}

// Weight trend over the last 4 weeks (least squares), in kg per week.
export function weeklyRate() {
  const ws = weights().filter(w => w.date >= addDays(dayKey(), -28));
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
