#!/usr/bin/env node
// Usage: node lint.mjs <file|dir> [...]
// Cheap static checks for the mechanical unslop rules. Not a substitute for looking.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const EXT = new Set(['.html', '.htm', '.css', '.jsx', '.tsx', '.js', '.ts', '.vue', '.svelte']);
const SKIP = new Set(['node_modules', '.git', 'dist', 'build', '.next']);

function walk(p, out = []) {
  const s = statSync(p);
  if (s.isFile()) { if (EXT.has(extname(p))) out.push(p); return out; }
  for (const n of readdirSync(p)) if (!SKIP.has(n)) walk(join(p, n), out);
  return out;
}

const rules = [
  ['rule 13', 'gradient text', /background-clip:\s*text|bg-clip-text/],
  ['rule 13', 'side-stripe border accent', /border-(left|right):\s*[2-9]\d*px/],
  ['rule 13', 'decorative scroll cue', />\s*(scroll( to explore| down)?|↓ ?scroll)\s*</i],
  ['rule 13', 'version footer / label', />\s*v\d+\.\d+(\.\d+)?(-\w+)?\s*</i],
  ['rule 1', 'filler badge text', />\s*(new|beta|alpha|ai[- ]powered|early access|now live|invite[- ]only)\s*</i],
  ['rule 2', 'tiny uppercase tracked label (eyebrow)', /uppercase[^"'`]{0,40}tracking-\[?0?\.\d|letter-spacing:\s*0?\.\d+em[^}]{0,80}text-transform:\s*uppercase|text-transform:\s*uppercase[^}]{0,80}letter-spacing:\s*0?\.\d+em/],
  ['rule 9', 'buzzword copy', /\b(seamless(ly)?|supercharge|unleash|empower(s|ing)?|revolutioni[sz]e|next[- ]gen(eration)?|game[- ]chang(er|ing)|all-in-one|cutting[- ]edge|world[- ]class|elevate your)\b/i],
  ['rule 9', 'placeholder names/copy', /\b(john doe|jane doe|acme( corp)?|lorem ipsum)\b/i],
  ['copy', 'em dash', /—/],
  ['rule 12', 'emoji used in markup', /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u],
  ['rule 15', 'light gray body text', /text-(gray|slate|zinc|neutral)-(300|400)\b/],
  ['rule 16', 'heading without text-wrap balance (css)', /h1\s*\{(?![^}]*text-wrap)[^}]*\}/],
  ['rule 18', 'numeric UI without tabular-nums (check manually)', /class="[^"]*\b(price|stat|metric|amount|total)\b[^"]*"(?![^>]*tabular)/i],
  ['stability', '100vh full-height (use 100dvh)', /\b(100vh|h-screen)\b/],
  ['stability', 'scroll listener (use IntersectionObserver)', /addEventListener\(\s*['"]scroll['"]/],
  ['rule 20', 'transition: all / linear easing', /transition:\s*all|ease-in-out|transition-timing-function:\s*linear/],
];

const targets = process.argv.slice(2);
if (!targets.length) { console.error('usage: lint.mjs <file|dir> [...]'); process.exit(1); }

let hits = 0;
for (const t of targets) {
  for (const f of walk(t)) {
    const lines = readFileSync(f, 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (const [tag, msg, re] of rules) {
        if (re.test(line)) {
          hits++;
          console.log(`${f}:${i + 1}  [${tag}] ${msg}\n    ${line.trim().slice(0, 140)}`);
        }
      }
    });
  }
}

// Whole-file checks
for (const t of targets) {
  for (const f of walk(t)) {
    const src = readFileSync(f, 'utf8');
    const eyebrows = (src.match(/uppercase[^"'`\n]{0,40}tracking-\[?0?\.\d/g) || []).length;
    if (eyebrows > 3) { hits++; console.log(`${f}  [rule 2] ${eyebrows} uppercase tracked labels: eyebrow on every section?`); }
    if (/@keyframes|animation:|transition/.test(src) && !/prefers-reduced-motion/.test(src)) {
      hits++; console.log(`${f}  [rule 20] animation present but no prefers-reduced-motion handling`);
    }
    const radii = new Set((src.match(/border-radius:\s*[\d.]+(px|rem)/g) || []).map(s => s.split(':')[1].trim()));
    if (radii.size > 5) { hits++; console.log(`${f}  [rule 14] ${radii.size} distinct border-radius values: one radius system?`); }
  }
}

console.log(hits ? `\n${hits} finding(s). Fix or justify each.` : 'clean');
process.exit(hits ? 1 : 0);
