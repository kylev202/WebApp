// Close-up muscle diagrams — the drawing on a gym machine's placard rather than a
// whole body shrunk to thumbnail size. Nine crops cover the seventeen muscle
// regions: a chest view serves the pecs, the abs and the obliques; a back view
// serves the traps, lats, mid and lower back, and so on. Each crop is drawn once
// at full size and the muscle being worked is the one filled in.
import { REGIONS, exRegions } from './gym-data.js';
import { esc } from './util.js';

const S = 100; // every crop is drawn on a 100 × 100 square

// --- shared helpers (shapes are authored on the left half and mirrored) ---
const VE = 'vector-effect="non-scaling-stroke"';
const one = s => `<path d="${s.d}" ${VE}/>`;
const draw = list => (list ?? []).map(s => one(s) + (s.c ? '' : `<g transform="matrix(-1 0 0 1 100 0)">${one(s)}</g>`)).join('');

// Each crop: the flesh around the muscles, the muscles that can light up, and the
// line work that makes it read as a drawing.
const SHOTS = {
  // Chest, abs and obliques — upper body from the front.
  torsoFront: {
    body: [
      { d: 'M41-2h18v12c-6 4-12 4-18 0z', c: 1 },
      { d: 'M50 8c18 0 30 6 36 19 5 14 3 33-1 50-2 9-4 16-4 25H19c0-9-2-16-4-25-4-17-6-36-1-50C20 14 32 8 50 8z', c: 1 },
      { d: 'M29 10C16 13 7 24 6 39c-1 9 1 15 6 18 6-5 11-16 16-30 2-9 2-15 1-17z' },
    ],
    muscles: {
      ch: [{ d: 'M49 17c-11 0-19 2-24 7-4 8-2 18 5 24 8 4 15 3 19-1z' }],
      ab: [{ d: 'M40 52c7-3 13-3 20 0 1 14 0 28-2 40-5 4-11 4-16 0-2-12-3-26-2-40z', c: 1 }],
      ob: [{ d: 'M38.5 54c-6.5 3-10.5 10-11.5 20-.5 10 2 17 7 22 3-10 3.5-26 4.5-42z' }],
    },
    detail: [
      { d: 'M41 11c-7 2-13 5-18 10' },
      { d: 'M28 48l5.5 3.4' },
      { d: 'M29.5 55l5.2 2.8' },
      { d: 'M31.5 62l5 2.4' },
      { d: 'M41 63h18', c: 1 },
      { d: 'M41.5 73h17', c: 1 },
      { d: 'M43 83h14', c: 1 },
      { d: 'M50 53v39', c: 1 },
    ],
  },
  // Traps, lats, mid back and lower back — upper body from behind.
  torsoBack: {
    body: [
      { d: 'M41-2h18v12c-6 4-12 4-18 0z', c: 1 },
      { d: 'M50 8c18 0 30 6 36 19 5 14 3 33-1 50-2 9-4 16-4 25H19c0-9-2-16-4-25-4-17-6-36-1-50C20 14 32 8 50 8z', c: 1 },
      { d: 'M29 10C16 13 7 24 6 39c-1 9 1 15 6 18 6-5 11-16 16-30 2-9 2-15 1-17z' },
    ],
    muscles: {
      tr: [{ d: 'M49 8c-9 1-17 5-24 13 2 12 8 22 18 30 4-8 6-22 6-43z' }],
      ub: [{ d: 'M48.5 47c-5 2-8.5 6-10.5 12 2 7 5.5 11 10.5 13 1-8 1-17 0-25z' }],
      lt: [{ d: 'M47 33c-11 2-19 8-24 18-1 12 4 22 14 30 5-12 9-29 10-48z' }],
      lb: [{ d: 'M48.5 73c-5 2-8 6-9 12 2 8 5 13 9 15 1-9 1-18 0-27z' }],
    },
    detail: [
      { d: 'M50 11v88', c: 1 },
      { d: 'M46 14c-1 9-2 18-4 27' },
      { d: 'M43.5 44c-5 4-10 7.5-15.5 10' },
      { d: 'M42.5 56c-4.5 4-9 7-14 9.5' },
    ],
  },
  // Front and side deltoid and the biceps — one shoulder and upper arm, front on.
  armFront: {
    body: [{ d: 'M50 5C34 7 23 16 20 30c-3 14-3 30-1 45 1 10 3 19 5 27h52c2-8 4-17 5-27 2-15 2-31-1-45C77 16 66 7 50 5z', c: 1 }],
    muscles: {
      ds: [{ d: 'M48.5 9C37 11 29 20 26 33c-1 7 0 11 3 13 8-4 15-16 19.5-30z', c: 1 }],
      df: [{ d: 'M51.5 9C63 11 71 20 74 33c1 7 0 11-3 13-8-4-15-16-19.5-30z', c: 1 }],
      bi: [{ d: 'M50 48c-11 0-17 7-18 18-1 12 2 22 7 28 6 2 16 2 22 0 5-6 8-16 7-28-1-11-7-18-18-18z', c: 1 }],
    },
    detail: [
      { d: 'M50 14v32', c: 1 },
      { d: 'M38 20c-2 8-3 15-3 23', c: 1 },
      { d: 'M62 20c2 8 3 15 3 23', c: 1 },
      { d: 'M50 54v40', c: 1 },
    ],
  },
  // Rear deltoid and the triceps — the same shoulder and arm from behind.
  armBack: {
    body: [{ d: 'M50 5C34 7 23 16 20 30c-3 14-3 30-1 45 1 10 3 19 5 27h52c2-8 4-17 5-27 2-15 2-31-1-45C77 16 66 7 50 5z', c: 1 }],
    muscles: {
      dr: [{ d: 'M50 8C34 10 26 20 25 35c0 6 2 9 6 10 7-6 13-19 19-32 6 13 12 26 19 32 4-1 6-4 6-10-1-15-9-25-25-27z', c: 1 }],
      tx: [{ d: 'M50 47c-11 0-17 6-18 17-1 12 3 22 9 28 5 2 13 2 18 0 6-6 10-16 9-28-1-11-7-17-18-17z', c: 1 }],
    },
    detail: [
      { d: 'M42 53c-2 12-2 25 1 35', c: 1 },
      { d: 'M58 53c2 12 2 25-1 35', c: 1 },
      { d: 'M50 47v9', c: 1 },
      { d: 'M36 22c3 8 7 15 11 20', c: 1 },
      { d: 'M64 22c-3 8-7 15-11 20', c: 1 },
    ],
  },
  // Forearms — elbow down to the fist.
  forearm: {
    body: [{ d: 'M41 62h18v14c8 4 11 13 7 19-6 7-26 7-32 0-4-6-1-15 7-19z', c: 1 }],
    muscles: {
      fa: [{ d: 'M50-2C36 2 28 16 25 34c-2 14 0 26 5 36 5 4 12 6 20 6s15-2 20-6c5-10 7-22 5-36C72 16 64 2 50-2z', c: 1 }],
    },
    detail: [
      { d: 'M41 10c-4 17-5 37-2 54', c: 1 },
      { d: 'M59 10c4 17 5 37 2 54', c: 1 },
      { d: 'M50 4v64', c: 1 },
      { d: 'M42 86h16', c: 1 },
    ],
  },
  // Glutes — hips from behind.
  hipsBack: {
    body: [
      { d: 'M25-2h50c4 11 5 17 4 21H21c-1-4 0-10 4-21z', c: 1 },
      { d: 'M23 70c-4 13-5 23-3 32h27c1-11 1-21 0-32z' },
    ],
    muscles: {
      gl: [{ d: 'M49 18c-15 1-25 8-29 22-2 14 2 26 12 34 8 3 14 0 17-8z' }],
    },
    detail: [
      { d: 'M50 20v54', c: 1 },
      { d: 'M23 66c8 7 18 10 26 9' },
    ],
  },
  // Quads — thighs from the front.
  thighFront: {
    body: [{ d: 'M24 84c-3 8-3 14-1 18h18c3-4 3-10 1-18z' }],
    muscles: {
      qu: [{ d: 'M48-2c-14 2-24 10-28 24-3 18-2 38 3 54 5 8 12 10 19 6 5-14 7-46 6-84z' }],
    },
    detail: [
      { d: 'M38 12c-4 20-5 44-2 66' },
      { d: 'M27 18c-3 20-3 40 0 58' },
    ],
  },
  // Hamstrings — thighs from behind, under the fold of the glute.
  thighBack: {
    body: [
      { d: 'M16-2h33v14c-14 1-26-4-35-9z' },
      { d: 'M24 84c-3 8-3 14-1 18h18c3-4 3-10 1-18z' },
    ],
    muscles: {
      ha: [{ d: 'M48 14c-14 1-23 8-27 22-3 18-2 36 3 50 5 8 12 10 19 6 4-16 6-42 5-78z' }],
    },
    detail: [
      { d: 'M35 24c-4 22-4 42-1 58' },
      { d: 'M50 14v78', c: 1 },
      { d: 'M18 11c9 6 20 8 31 7' },
    ],
  },
  // Calves — lower legs from behind, down to the ankle.
  lowerLeg: {
    body: [{ d: 'M31 60c-2 13-2 27 0 40h14c2-13 2-27 0-40z' }],
    muscles: {
      ca: [{ d: 'M47-2c-11 3-18 12-21 26-3 14-2 26 3 34 6 4 13 2 16-6 2-14 2.5-36 2-54z' }],
    },
    detail: [
      { d: 'M36 8c-3 16-3 32 0 48' },
      { d: 'M50 0v96', c: 1 },
    ],
  },
};

// Which crop each muscle is drawn on.
export const SHOT_OF = {
  ch: 'torsoFront', ab: 'torsoFront', ob: 'torsoFront',
  tr: 'torsoBack', lt: 'torsoBack', ub: 'torsoBack', lb: 'torsoBack',
  ds: 'armFront', df: 'armFront', bi: 'armFront',
  dr: 'armBack', tx: 'armBack',
  fa: 'forearm', gl: 'hipsBack', qu: 'thighFront', ha: 'thighBack', ca: 'lowerLeg',
};

let sprited = false;
function sprite() {
  if (sprited || typeof document === 'undefined') return;
  sprited = true;
  const defs = Object.entries(SHOTS).flatMap(([k, s]) => [
    `<g id="cu-${k}-b">${draw(s.body)}</g>`,
    `<g id="cu-${k}-d">${draw(s.detail)}</g>`,
    ...Object.entries(s.muscles).map(([r, l]) => `<g id="cu-${r}">${draw(l)}</g>`),
  ]).join('');
  document.body.insertAdjacentHTML('beforeend', `<svg class="bm-sprite" aria-hidden="true" width="0" height="0"><defs>${defs}</defs></svg>`);
}

// One crop, with `on` filled in and anything in `half` shaded lightly.
function shot(region, half = []) {
  const key = SHOT_OF[region];
  const s = SHOTS[key];
  if (!s) return '';
  sprite();
  const muscles = Object.keys(s.muscles).map(r => {
    const cls = r === region ? 'bm-on' : half.includes(r) ? 'bm-half' : 'bm-off';
    return `<use href="#cu-${r}" class="${cls}"/>`;
  }).join('');
  return `<svg class="cu" viewBox="0 0 ${S} ${S}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <use href="#cu-${key}-b" class="bm-skin"/>${muscles}<use href="#cu-${key}-d" class="bm-detail"/></svg>`;
}

// The close-up for an exercise: the muscle it works hardest, with any other
// muscle on the same crop shaded in behind it.
export function exShot(ex, { cls = '' } = {}) {
  const r = exRegions(ex);
  const main = r.pri[0];
  if (!main) return '';
  const half = [...r.pri.slice(1), ...r.sec];
  const names = [...r.pri, ...r.sec].map(x => REGIONS[x]?.name).filter(Boolean).join(', ');
  return `<span class="cu-box ${cls}" role="img" aria-label="Works ${esc(names)}">${shot(main, half)}</span>`;
}

// Whether a muscle that only helps out shows on the same crop — if none does,
// there is nothing for the "helps out" key to point at.
export function hasHalf(ex) {
  const r = exRegions(ex);
  const main = r.pri[0];
  if (!main) return false;
  const crop = SHOT_OF[main];
  return [...r.pri.slice(1), ...r.sec].some(x => SHOT_OF[x] === crop);
}

// The close-up for one muscle on its own.
export const muscleShot = (region, { cls = '' } = {}) =>
  `<span class="cu-box ${cls}" role="img" aria-label="${esc(REGIONS[region]?.name ?? '')}">${shot(region)}</span>`;
