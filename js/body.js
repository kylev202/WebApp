// The anatomy figure: a front and a back silhouette in grey, with the muscles an
// exercise or a week of training works lit up in the Gym red. Shapes are authored
// on the left half of a 100-wide figure and mirrored, so the two sides can never
// drift apart. Regions that only read from one side (lats, glutes, abs) simply
// have no shape in the other view.
import { REGIONS, exRegions } from './gym-data.js';
import { esc, clamp } from './util.js';

const W = 100, H = 220;

// The silhouette everything is drawn inside: head, neck, torso, hips, arms, legs.
// Muscles sit inside it with a hair of space around them, so the figure still
// reads as a body when nothing is lit up.
const BASE = [
  { e: '50 17 9.6 11.6', c: 1 },
  { d: 'M45.4 23h9.2v12h-9.2z', c: 1 },
  { d: 'M50 31.5c11 0 19 5.5 22.5 15 4 11.5 3.5 26.5-.5 40.5-2.5 9-4 19-4.5 30h-35c-.5-11-2-21-4.5-30-4-14-4.5-29-.5-40.5C31 38.5 39 34 50 34z', c: 1 },
  { d: 'M34 109h32c0 13.5-2.4 23.3-6.2 29.5H40.2c-3.8-6.2-6.2-16-6.2-29.5z', c: 1 },
  { d: 'M31 38l3.5 1.5c-1.5 3.5-2.5 10.5-3.5 19.5-1.5 12-2 25-2 36H18.5c-1.5-8-2-19-1-31 1-12 5.5-21.5 13.5-26z' },
  { d: 'M18 93l8 1c.5 5 .5 12 0 23-.5 12-1 24-1.5 33h-10c-2-5-3-14-2.5-26 .5-12 2.5-23 6-31z' },
  { e: '18.5 157 6.2 8.6' },
  { d: 'M32 114h16c.5 5 1 12 1 21 0 12-.5 23-1.5 31H33c-2-2-3.5-7-4-15-1-12 0-25 3-37z' },
  { e: '39.5 164 8.4 7' },
  { d: 'M31.5 162h15.5c.5 3 1 9 1 18 0 10-.5 20-1.5 27H34c-2-1-3.5-5-4.5-12-1.5-10-1-22 2-33z' },
  { d: 'M30.5 202h17c1 3 1 8-.5 10.5H32c-3-1-3.5-5.5-1.5-10.5z' },
];

// Front view. Each region is one or more shapes; `c` marks a centred one that is
// not mirrored across the middle.
const FRONT = {
  tr: [{ d: 'M49.4 28c-8.4 1-15 4.9-18.8 11.6 6.2 2.9 12.5 2.3 18.8-1.9z' }],
  ds: [{ d: 'M31 38.5c-2.5 6-4.5 14.5-5.2 24H19c-.6-11 1-18.5 4.6-22.3 2.2-2.2 4.8-2.7 7.4-1.7z' }],
  df: [{ d: 'M31.4 38.6c-2.5 6-4.5 14.5-5.2 24 4.8-2.1 8.8-7.1 11.4-14.6-1-4.6-3.2-7.8-6.2-9.4z' }],
  ch: [{ d: 'M49.4 37.4c-7.4 0-13.2 2.2-16.8 6.6-1.3 7.5.4 14 5.2 18.5 4.8 2.1 8.6 1.4 11.6-1.5z' }],
  bi: [{ d: 'M32.5 58c-1 12-3.5 24-6 34.5h-7c-1.5-10.5-1-21.5 1.5-31.5 3-3 7-4 11.5-3z' }],
  fa: [{ d: 'M26 95c-.5 11-2 23.5-4 35-1 7-2 12-3 15h-5c-1.5-9-2-20-1.5-31 .5-11 2-19.5 4.5-24.5z' }],
  ab: [{ d: 'M42.5 65.5c5-1.7 10-1.7 15 0 .8 12.5.1 25-2.1 37-3.2 5-7.6 5-10.8 0-2.2-12-2.9-24.5-2.1-37z', c: 1 }],
  ob: [{ d: 'M41.5 66c-5 2-7.7 7-8.3 15-.4 9 1.6 17.5 6 25.5 2-1.5 2.8-5.5 2.4-12.5-.6-9.5-.7-18.8-.1-28z' }],
  qu: [{ d: 'M48 114.5c.8 11.5.8 23.5 0 34.5-.8 6-2.6 9.5-5.5 10.5-3.7-.5-6.7-3.5-8.7-9-2.2-10.5-2.6-21.5-1.2-32 3.4-3.5 8.4-4.7 15.4-4z' }],
  ca: [{ d: 'M46.8 167.5c.8 9.5.6 19.5-.6 28-1.2 6.5-3 10-5.2 11-3-1-5.4-4.7-7.2-11.3-1.6-8.2-1.6-17.7 0-26.2 3.4-2.2 8-2.7 13-1.5z' }],
};

// Back view.
const BACK = {
  tr: [{ d: 'M49.4 27.4c-8.6 1-15.4 5-19.5 11.5 1.9 10.2 6.8 18.2 14.6 23.9 3.2-5.5 4.9-17.3 4.9-35.4z' }],
  ds: [{ d: 'M31 38.5c-2.5 6-4.5 14.5-5.2 24H19c-.6-11 1-18.5 4.6-22.3 2.2-2.2 4.8-2.7 7.4-1.7z' }],
  dr: [{ d: 'M31.4 38.6c-2.5 6-4.5 14.5-5.2 24 4.8-2.1 8.8-7.1 11.4-14.6-1-4.6-3.2-7.8-6.2-9.4z' }],
  lt: [{ d: 'M44.6 59.8c.5 14-.3 27.6-2.5 40.6-7.7-4.4-11.9-13.5-12.5-27.1 2.2-9 7.2-13.5 15-13.5z' }],
  ub: [{ d: 'M44.8 62.5c3.5-1.2 6.9-1.2 10.4 0-.3 9.5-1.2 17.4-2.8 23.6-1.6 2.6-3.2 2.6-4.8 0-1.6-6.2-2.5-14.1-2.8-23.6z', c: 1 }],
  lb: [{ d: 'M43 86c4.7-1.8 9.3-1.8 14 0-.5 9.4-2.1 17-4.7 23-1.6 2.6-3.6 2.6-5.2 0-2.6-6-4.2-13.6-4.1-23z', c: 1 }],
  tx: [{ d: 'M32.5 58c-1 12-3.5 24-6 34.5h-7c-1.5-10.5-1-21.5 1.5-31.5 3-3 7-4 11.5-3z' }],
  fa: [{ d: 'M26 95c-.5 11-2 23.5-4 35-1 7-2 12-3 15h-5c-1.5-9-2-20-1.5-31 .5-11 2-19.5 4.5-24.5z' }],
  gl: [{ d: 'M48 110.5c.8 8 .4 15.5-1.2 22-2.8 6-7.4 8-12.2 5.5-3.2-4.5-4-11.5-2.4-20.5 3.2-5.7 8.6-7.9 15.8-7z' }],
  ha: [{ d: 'M47.6 136.5c-.6 10.5-2.8 17.6-6.4 21.6-3.4 1.3-6.4-.7-8.6-6-1.6-6.5-1.6-13.3.2-20.2 5 2.4 9.9 3.9 14.8 4.6z' }],
  ca: [{ d: 'M46.8 167.5c.8 9.5.6 19.5-.6 28-1.2 6.5-3 10-5.2 11-3-1-5.4-4.7-7.2-11.3-1.6-8.2-1.6-17.7 0-26.2 3.4-2.2 8-2.7 13-1.5z' }],
};

export const VIEWS = { front: FRONT, back: BACK };

// Grey for flesh and an untrained muscle, then the Gym red deepening with load.
const SKIN = '#e4e4ec';
const OFF = '#d2d2dd';
const RAMP = [[250, 225, 231], [244, 167, 181], [224, 114, 136], [193, 71, 96]];
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
export function shade(t) {
  if (!(t > 0)) return OFF;
  const x = clamp(t, 0, 1) * (RAMP.length - 1);
  const i = Math.min(RAMP.length - 2, Math.floor(x));
  return `rgb(${mix(RAMP[i], RAMP[i + 1], x - i).join(',')})`;
}

const MIRROR = 'transform="matrix(-1 0 0 1 100 0)"';
const one = s => (s.e ? `<ellipse cx="${s.e.split(' ')[0]}" cy="${s.e.split(' ')[1]}" rx="${s.e.split(' ')[2]}" ry="${s.e.split(' ')[3]}"/>` : `<path d="${s.d}"/>`);
const shapes = list => list.map(s => one(s) + (s.c ? '' : `<g ${MIRROR}>${one(s)}</g>`)).join('');

// Every shape is defined once in a hidden sprite and referenced after that, so a
// list of a hundred exercises costs a few hundred bytes of markup each instead of
// a few thousand.
let sprited = false;
function sprite() {
  if (sprited || typeof document === 'undefined') return;
  sprited = true;
  const defs = [`<g id="bm-skin">${shapes(BASE)}</g>`,
    ...Object.entries(FRONT).map(([r, l]) => `<g id="bm-f-${r}">${shapes(l)}</g>`),
    ...Object.entries(BACK).map(([r, l]) => `<g id="bm-b-${r}">${shapes(l)}</g>`)].join('');
  document.body.insertAdjacentHTML('beforeend', `<svg class="bm-sprite" aria-hidden="true" width="0" height="0"><defs>${defs}</defs></svg>`);
}

const V = v => (v === 'back' ? 'b' : 'f');
const figure = (view, fills) => `<use href="#bm-skin" fill="${SKIN}"/>`
  + Object.keys(VIEWS[view]).map(r => `<use href="#bm-${V(view)}-${r}" fill="${shade(fills[r] ?? 0)}"/>`).join('');
const svg = (view, fills, cls = '') => `<svg class="${cls}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${figure(view, fills)}</svg>`;

// Regions an exercise works, as fills: primary full strength, secondary half.
export function exFills(ex, { pri = 1, sec = 0.4 } = {}) {
  const r = exRegions(ex);
  const f = {};
  r.sec.forEach(x => { f[x] = sec; });
  r.pri.forEach(x => { f[x] = pri; });
  return f;
}

// How much of a set counts towards each region: all of it for a primary muscle,
// half for one that only helps.
export function addRegions(into, ex, n = 1) {
  const r = exRegions(ex);
  r.pri.forEach(x => { into[x] = (into[x] ?? 0) + n; });
  r.sec.forEach(x => { into[x] = (into[x] ?? 0) + n * 0.5; });
  return into;
}
export const toFills = (counts, max) => Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, v / (max || 1)]));

// The view an exercise is best seen from, so a list can show just one figure.
export const bestView = ex => (exRegions(ex).pri.every(r => BACK[r] && !FRONT[r]) ? 'back' : 'front');

const names = ex => { const r = exRegions(ex); return [...r.pri, ...r.sec].map(x => REGIONS[x]?.name).filter(Boolean).join(', '); };

// Front and back together, the hero version. `tap` makes each muscle a button.
export function bodyMap(fills, { label = 'Muscles worked', tap = false, cls = '' } = {}) {
  sprite();
  return `<div class="bm ${cls}" role="img" aria-label="${esc(label)}">${['front', 'back'].map(v => `<svg class="bm-fig" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">${figure(v, fills)}
    ${tap ? Object.keys(VIEWS[v]).map(r => `<use class="bm-hit" href="#bm-${V(v)}-${r}" fill="transparent" data-act="muscle" data-r="${r}" role="button" tabindex="0" aria-label="${esc(REGIONS[r].name)}"/>`).join('') : ''}</svg>`).join('')}</div>`;
}

// One view only, for a list row where two figures would not fit.
export function bodyOne(ex, view = null) {
  sprite();
  return `<span class="bm-one" role="img" aria-label="Works ${esc(names(ex))}">${svg(view ?? bestView(ex), exFills(ex))}</span>`;
}

// A figure drawn from raw region counts, for a day or a whole session.
export function bodyPair(counts, max, { cls = '' } = {}) {
  sprite();
  const fills = toFills(counts, max);
  return `<span class="bm-thumb ${cls}" aria-hidden="true">${svg('front', fills)}${svg('back', fills)}</span>`;
}
