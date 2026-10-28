// Small pieces shared by the health analytics screens: status chips, coach notes,
// stat cells and the two bits of statistics the reports lean on.
import { icon } from './icons.js';
import { toDate, mean, sum, clamp } from './util.js';

export const chip = ([level, text]) => `<span class="hv-chip lv-${level}">${text}</span>`;
export const note = (ic, area, html) => `<li style="--nc:var(--${area}-ink)">${icon(ic)}<span>${html}</span></li>`;
export const notes = items => (items.length ? `<ul class="hv-notes">${items.join('')}</ul>` : '');
export const signed = (n, d = 1) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(d)}`;
export const fmtMins = m => { m = Math.round(m); return m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${String(m % 60).padStart(2, '0')}m` : ''}` : `${m} min`; };
export const stat = (l, v, sub = '') => `<div class="stat"><div class="l">${l}</div><div class="v">${v}${sub ? `<span> ${sub}</span>` : ''}</div></div>`;
export const section = (title, aside = '') => `<div class="section-label">${title}${aside ? ` <span>${aside}</span>` : ''}</div>`;
export const meter = (label, pct, text, color) => `<div class="macro an-meter"><span>${label}</span><div class="track"><div class="fill" style="width:${clamp(pct, 0, 100)}%;background:${color}"></div></div><b>${text}</b></div>`;
export const sd = xs => (xs.length >= 3 ? Math.sqrt(mean(xs.map(x => (x - mean(xs)) ** 2))) : null);

// Least-squares slope of y against days, per week, with how well a straight line fits.
export function slope(points) {
  if (points.length < 3) return null;
  const x0 = points[0].d;
  const xs = points.map(p => p.d - x0), ys = points.map(p => p.y);
  if (xs.at(-1) < 6) return null;
  const mx = mean(xs), my = mean(ys);
  const sxx = sum(xs.map(x => (x - mx) ** 2));
  const sxy = sum(xs.map((x, i) => (x - mx) * (ys[i] - my)));
  const b = sxy / sxx;
  const ssTot = sum(ys.map(y => (y - my) ** 2));
  const ssRes = sum(ys.map((y, i) => (y - (my + b * (xs[i] - mx))) ** 2));
  return { perWeek: b * 7, r2: ssTot ? 1 - ssRes / ssTot : 0, n: points.length };
}
export const dayNo = key => Math.round(toDate(key).getTime() / 864e5);
