#!/usr/bin/env node
// contrast.mjs: WCAG 2 contrast ratios, computed instead of guessed.
//
//   node contrast.mjs "#5b5b5b on #f4f1ea" "oklch(0.62 0.17 35) on #ffffff"
//   node contrast.mjs --css path/to/tokens.css
//
// --css reads custom properties (hex, rgb() or oklch()) and checks the common role pairs
// when they exist: ink, ink-muted, accent and on-accent against bg and surface levels.
// Thresholds: 4.5 body text, 3 large text (24px+, or 18.66px+ bold) and UI components.

import { readFileSync } from 'node:fs';

function parse(c) {
  c = c.trim().toLowerCase();
  let m;
  if ((m = /^#([0-9a-f]{3,8})$/.exec(c))) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((x) => x + x).join('');
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  }
  if ((m = /^rgba?\(([^)]+)\)$/.exec(c))) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean).slice(0, 3);
    return p.map((v) => (v.endsWith('%') ? parseFloat(v) / 100 : parseFloat(v) / 255));
  }
  if ((m = /^oklch\(([^)]+)\)$/.exec(c))) {
    const p = m[1].split(/[\s/]+/).filter(Boolean);
    const L = p[0].endsWith('%') ? parseFloat(p[0]) / 100 : parseFloat(p[0]);
    const C = parseFloat(p[1]);
    const H = (parseFloat(p[2]) || 0) * Math.PI / 180;
    return oklabToSrgb(L, C * Math.cos(H), C * Math.sin(H));
  }
  if (c === 'white') return [1, 1, 1];
  if (c === 'black') return [0, 0, 0];
  return null;
}

function oklabToSrgb(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return lin.map((v) => {
    v = Math.min(1, Math.max(0, v));
    return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
  });
}

const lum = (rgb) => {
  const [r, g, b] = rgb.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const verdict = (r) => (r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'large text / UI only' : 'FAIL');

let fails = 0;
function report(fgName, fg, bgName, bg) {
  const a = parse(fg), b = parse(bg);
  if (!a || !b) { console.log(`skip    ${fgName} on ${bgName} (cannot parse ${!a ? fg : bg})`); return; }
  const r = ratio(a, b);
  if (r < 4.5) fails++;
  console.log(`${r.toFixed(2).padStart(5)}:1  ${verdict(r).padEnd(20)} ${fgName} on ${bgName}`);
}

const argv = process.argv.slice(2);
if (!argv.length) {
  console.error('usage: contrast.mjs "<fg> on <bg>" ... | --css tokens.css');
  process.exit(1);
}

if (argv[0] === '--css') {
  const src = readFileSync(argv[1], 'utf8');
  const vars = {};
  for (const m of src.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
  const resolveVar = (v, depth = 0) => {
    const m = /^var\(--([\w-]+)\)$/.exec(v || '');
    return m && depth < 5 ? resolveVar(vars[m[1]], depth + 1) : v;
  };
  const names = Object.keys(vars);
  const find = (re) => names.filter((n) => re.test(n));
  const fgs = find(/^(ink|text|fg|foreground)(-muted|-subtle|-secondary|-2)?$|^on-accent$|^accent$|^muted-foreground$/);
  const bgs = find(/^(bg|background|surface|surface-\d|surface-[a-z]+|paper|canvas|card)$/);
  if (!fgs.length || !bgs.length) console.log('no role pairs found: name tokens like --ink, --ink-muted, --bg, --surface, --accent, --on-accent');
  for (const f of fgs) {
    if (f === 'on-accent') { if (vars.accent) report('--on-accent', resolveVar(vars['on-accent']), '--accent', resolveVar(vars.accent)); continue; }
    for (const b of bgs) report(`--${f}`, resolveVar(vars[f]), `--${b}`, resolveVar(vars[b]));
  }
} else {
  for (const pair of argv) {
    const [fg, bg] = pair.split(/\s+on\s+/i);
    report(fg, fg, bg || '#ffffff', bg || '#ffffff');
  }
}
process.exit(fails ? 1 : 0);
