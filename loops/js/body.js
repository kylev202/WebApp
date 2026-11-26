// The anatomy figure. The drawing itself is a pair of pictures — img/body-front.webp
// and img/body-back.webp — and every muscle is an SVG outline traced from the
// artwork's own borders (js/body-art.js). Lighting a muscle means laying its
// outline over the picture in red with a multiply blend, so the drawn shading and
// line work still show through instead of being painted over.
//
// A close-up is the same picture with the viewBox cropped to one muscle, so a row
// in the exercise list and the full figure in the report are the same drawing.
import { REGIONS, exRegions } from './gym-data.js';
import { esc, clamp } from './util.js';
import { ART } from './body-art.js';

const S = 1000;                       // the square the artwork is drawn on
const SRC = view => `img/body-${view}.webp`;

// Reds to multiply over the artwork: the faintest tint for a muscle that only
// helped, deepening with the work it did.
const RAMP = [[255, 232, 228], [255, 176, 159], [244, 112, 92]];
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
export function shade(t) {
  const x = clamp(t, 0, 1) * (RAMP.length - 1);
  const i = Math.min(RAMP.length - 2, Math.floor(x));
  return `rgb(${mix(RAMP[i], RAMP[i + 1], x - i).join(',')})`;
}

export const VIEWS = { front: ART.front, back: ART.back };
// The view a muscle is drawn on; a few show on both, and the front is preferred.
export const viewOf = r => (ART.front[r] ? 'front' : 'back');

const picture = view => `<image href="${SRC(view)}" x="0" y="0" width="${S}" height="${S}" preserveAspectRatio="xMidYMid meet"/>`;
const lit = (view, fills) => Object.entries(ART[view]).map(([r, m]) => {
  const t = fills[r] ?? 0;
  return t > 0 ? `<path d="${m.d}" fill="${shade(t)}" class="bf-lit"/>` : '';
}).join('');

// Regions an exercise works, as fills: the muscles doing the job at full
// strength, the ones helping at a little under half.
export function exFills(ex, { pri = 1, sec = 0.38 } = {}) {
  const r = exRegions(ex);
  const f = {};
  r.sec.forEach(x => { f[x] = sec; });
  r.pri.forEach(x => { f[x] = pri; });
  return f;
}

// How much of a set counts towards each muscle: all of it where the muscle does
// the job, half where it only helps.
export function addRegions(into, ex, n = 1) {
  const r = exRegions(ex);
  r.pri.forEach(x => { into[x] = (into[x] ?? 0) + n; });
  r.sec.forEach(x => { into[x] = (into[x] ?? 0) + n * 0.5; });
  return into;
}
export const toFills = (counts, max) => Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, v / (max || 1)]));

// Front and back together. `tap` turns each muscle into a button.
export function bodyMap(fills, { label = 'Muscles worked', tap = false, cls = '' } = {}) {
  const fig = view => `<svg class="bf" viewBox="0 0 ${S} ${S}" preserveAspectRatio="xMidYMid meet">
    ${picture(view)}${lit(view, fills)}
    ${tap ? Object.entries(ART[view]).map(([r, m]) => `<path class="bf-hit" d="${m.d}" data-act="muscle" data-r="${r}" role="button" tabindex="0" aria-label="${esc(REGIONS[r].name)}"/>`).join('') : ''}</svg>`;
  return `<div class="bm ${cls}" role="img" aria-label="${esc(label)}">${fig('front')}${fig('back')}</div>`;
}

// A square window around one muscle, cropped out of the same picture.
function crop(view, region) {
  const [x0, y0, x1, y1] = ART[view][region].box;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const side = Math.min(S, Math.max(x1 - x0, y1 - y0) * 1.32 + 40);
  const x = clamp(cx - side / 2, 0, S - side);
  const y = clamp(cy - side / 2, 0, S - side);
  return `${x.toFixed(0)} ${y.toFixed(0)} ${side.toFixed(0)} ${side.toFixed(0)}`;
}

const shot = (view, region, fills) => `<svg class="bf" viewBox="${crop(view, region)}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
  ${picture(view)}${lit(view, fills)}</svg>`;

// The close-up for an exercise: the muscle it works hardest, with any other
// muscle in the same view shaded behind it.
export function exShot(ex, { cls = '' } = {}) {
  const r = exRegions(ex);
  const main = r.pri[0];
  if (!main) return '';
  const view = viewOf(main);
  const fills = {};
  [...r.pri.slice(1), ...r.sec].forEach(x => { if (ART[view][x]) fills[x] = 0.38; });
  fills[main] = 1;
  const names = [...r.pri, ...r.sec].map(x => REGIONS[x]?.name).filter(Boolean).join(', ');
  return `<span class="cu-box ${cls}" role="img" aria-label="Works ${esc(names)}">${shot(view, main, fills)}</span>`;
}

// The close-up for one muscle on its own.
export function muscleShot(region, { cls = '' } = {}) {
  const view = viewOf(region);
  if (!ART[view]?.[region]) return '';
  return `<span class="cu-box ${cls}" role="img" aria-label="${esc(REGIONS[region]?.name ?? '')}">${shot(view, region, { [region]: 1 })}</span>`;
}

// Whether a muscle that only helped shows in the same close-up.
export function hasHalf(ex) {
  const r = exRegions(ex);
  const main = r.pri[0];
  if (!main) return false;
  const view = viewOf(main);
  return [...r.pri.slice(1), ...r.sec].some(x => ART[view][x]);
}

// Both figures small, drawn from raw muscle counts — a routine day or a session.
export function bodyPair(counts, max, { cls = '' } = {}) {
  const fills = toFills(counts, max);
  return `<span class="bm-thumb ${cls}" aria-hidden="true">${['front', 'back'].map(v =>
    `<svg class="bf" viewBox="0 0 ${S} ${S}" preserveAspectRatio="xMidYMid meet">${picture(v)}${lit(v, fills)}</svg>`).join('')}</span>`;
}
