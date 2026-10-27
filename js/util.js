// Small pure helpers shared by every screen.

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const pad = n => String(n).padStart(2, '0');
export const uid = () => crypto.randomUUID();

// Dates are local "YYYY-MM-DD" keys so a day means the user's day, not UTC.
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const toDate = key => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (key, n) => { const d = toDate(key); d.setDate(d.getDate() + n); return dayKey(d); };
export const lastDays = n => Array.from({ length: n }, (_, i) => addDays(dayKey(), i - (n - 1)));
export const daysBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / 864e5);
export const weekStart = (key = dayKey()) => { const d = toDate(key); return addDays(key, -((d.getDay() + 6) % 7)); }; // Monday
export const monthKey = (key = dayKey()) => key.slice(0, 7);
export const monthDays = month => { const [y, m] = month.split('-').map(Number); return new Date(y, m, 0).getDate(); };
// Same day of the month n months away, clamped to the shorter month (31 Jan + 1 → 28/29 Feb).
export const addMonths = (key, n) => {
  const [y, m, d] = key.split('-').map(Number);
  const t = new Date(y, m - 1 + n, 1);
  t.setDate(Math.min(d, new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate()));
  return dayKey(t);
};

export const fmt = n => Math.round(n).toLocaleString('en-AU');
export const fmt1 = n => (Math.round(n * 10) / 10).toLocaleString('en-AU', { maximumFractionDigits: 1 });
export const money = (n, cents = true) => `${n < 0 ? '−' : ''}A$${Math.abs(n).toLocaleString('en-AU', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 })}`;
export const moneyShort = n => money(n, Math.abs(n) < 100 && n % 1 !== 0);
export const fmtHours = h => { const m = Math.round(h * 60); return `${Math.floor(m / 60)}h ${pad(m % 60)}m`; };
export const fmtDuration = ms => { const s = Math.max(0, Math.round(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h ? `${h}h ${pad(m)}m` : `${m}:${pad(s % 60)}`; };

export const dayLabel = key => {
  const today = dayKey();
  if (key === today) return 'Today';
  if (key === addDays(today, -1)) return 'Yesterday';
  if (key === addDays(today, 1)) return 'Tomorrow';
  return toDate(key).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
};
export const longDate = (d = new Date()) => d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' });
export const shortDate = key => toDate(key).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
export const monthName = key => toDate(key).toLocaleDateString('en-AU', { month: 'long' });
export const weekday = key => toDate(key).toLocaleDateString('en-AU', { weekday: 'short' });
export const initial = key => toDate(key).toLocaleDateString('en-AU', { weekday: 'narrow' });
export const timeOf = ts => new Date(ts).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
export const time12 = hhmm => { if (!hhmm) return ''; const [h, m] = hhmm.split(':').map(Number); return `${((h + 11) % 12) + 1}:${pad(m)} ${h < 12 ? 'am' : 'pm'}`; };
export const toMin = hhmm => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
export const nowHHMM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

export const mean = xs => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
export const avgLogged = values => { const v = values.filter(Boolean); return v.length ? mean(v) : 0; };
export const sum = (list, field) => list.reduce((t, e) => t + (Number(field ? e[field] : e) || 0), 0);
// "$1,234.56", "A$12.50", "7,50" → number. A comma is a thousands separator when a dot follows or 3 digits end it.
export const num = v => {
  let s = String(v ?? '').replace(/[^0-9.,-]/g, '');
  s = s.includes('.') || /,\d{3}$/.test(s) ? s.replace(/,/g, '') : s.replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};
export const plural = (n, word, many = `${word}s`) => `${fmt(n)} ${n === 1 ? word : many}`;
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const by = f => (a, b) => (f(a) < f(b) ? -1 : f(a) > f(b) ? 1 : 0);
