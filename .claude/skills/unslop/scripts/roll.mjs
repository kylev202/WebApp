#!/usr/bin/env node
// roll.mjs: random direction seeds so the studio does not converge on one look.
//
// A language model cannot sample at random: asked for "something different" it returns the
// most typical different thing. This script can. It draws aesthetics, palette recipes, type
// voices, layout patterns, reference systems and a creative constraint from the skill's
// libraries and the repo's data, skipping anything used in recent projects (see log.mjs)
// and anything marked saturated unless --allow-saturated is passed.
//
// Seeds are provocations for the art director, not orders. The brief always wins.
//
// Usage: node roll.mjs [--n 3] [--seed 42] [--allow-saturated] [--window 8] [--json]

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const skill = resolve(here, '..');
const repo = resolve(skill, '..', '..');

const args = parseArgs(process.argv.slice(2));
const N = Number(args.n) || 3;
const allowSat = Boolean(args['allow-saturated']);
const windowSize = Number(args.window) || 8;
const rand = args.seed ? mulberry32(Number(args.seed)) : Math.random;
const notes = [];

function parseArgs(a) {
  const o = {};
  for (let i = 0; i < a.length; i++) {
    if (!a[i].startsWith('--')) continue;
    const k = a[i].slice(2);
    o[k] = a[i + 1] && !a[i + 1].startsWith('--') ? a[++i] : true;
  }
  return o;
}
function mulberry32(s) {
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (arr) => (arr.length ? arr[Math.floor(rand() * arr.length)] : undefined);
function sample(arr, k) {
  const a = [...arr];
  const out = [];
  while (a.length && out.length < k) out.push(a.splice(Math.floor(rand() * a.length), 1)[0]);
  return out;
}
const norm = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim();

// ---------- history (written by log.mjs) ----------
function loadHistory() {
  const files = [
    process.env.UNSLOP_HISTORY || join(homedir(), '.claude', 'unslop', 'history.jsonl'),
    join(process.cwd(), '.unslop', 'history.jsonl'),
  ];
  const recs = [];
  for (const f of new Set(files)) {
    if (!existsSync(f)) continue;
    for (const line of readFileSync(f, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      try { recs.push(JSON.parse(line)); } catch { /* skip bad line */ }
    }
  }
  recs.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return recs.slice(-windowSize);
}
const history = loadHistory();
const used = new Set();
for (const r of history) {
  for (const key of ['aesthetic', 'palette', 'fonts', 'layouts', 'reference', 'constraint', 'type_voice']) {
    if (!r[key]) continue;
    for (const t of String(r[key]).split(/[,;|]/)) if (norm(t)) used.add(norm(t));
  }
}
const SUFFIX = new Set(['text', 'display', 'headline', 'caption', 'micro', 'deck', 'sans', 'serif', 'mono', 'slab',
  'condensed', 'extended', 'wide', 'narrow', 'compressed', 'pro', 'std', 'variable', 'vf', 'book', 'grotesk', 'grotesque']);
const stem = (t) => { const w = t.split(' '); while (w.length > 1 && SUFFIX.has(w[w.length - 1])) w.pop(); return w.join(' '); };
const isUsed = (name) => {
  const n = norm(name);
  if (!n) return false;
  for (const u of used) {
    if (u === n || (u.length > 3 && n.includes(u)) || (n.length > 3 && u.includes(n))) return true;
    if (stem(n).length > 3 && stem(n) === stem(u)) return true;
  }
  return false;
};

// ---------- markdown library parsing ----------
// Reads "### Name" entries (with "- **Field:** value" lines) inside the named "## Section"s.
function entries(file, sections) {
  const p = join(skill, file);
  if (!existsSync(p)) { notes.push(`missing ${file}`); return []; }
  const out = [];
  let inSec = !sections;
  let sec = '';
  let cur = null;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const h2 = /^##\s+(.+?)\s*$/.exec(line);
    if (h2) {
      sec = h2[1];
      inSec = !sections || sections.some((s) => norm(sec).startsWith(norm(s)));
      cur = null;
      continue;
    }
    if (!inSec) continue;
    const h3 = /^###\s+(.+?)\s*$/.exec(line);
    if (h3) { cur = { name: h3[1].replace(/[*`]/g, '').trim(), section: sec, fields: {} }; out.push(cur); continue; }
    const f = cur && /^\s*-\s*\*\*(.+?):?\*\*:?\s*(.*)$/.exec(line);
    if (f) cur.fields[f[1].toLowerCase().replace(/:$/, '')] = f[2].trim();
  }
  return out;
}
const saturation = (e) => ((e.fields.saturation || 'low').toLowerCase().match(/low|medium|high/) || ['low'])[0];
const usable = (list) => {
  const fresh = list.filter((e) => !isUsed(e.name));
  const ok = allowSat ? fresh : fresh.filter((e) => saturation(e) !== 'high');
  return ok.length ? ok : fresh.length ? fresh : list;
};

const aesthetics = usable(entries('references/library/aesthetics.md', ['Catalog']));
const palettes = usable(entries('references/library/color.md', ['Palette recipes']));
const voices = usable(entries('references/library/typography.md', ['Font catalog by voice']));
const layoutSecs = {
  hero: usable(entries('references/library/layout.md', ['Hero patterns'])),
  story: usable(entries('references/library/layout.md', ['Feature and story patterns'])),
  proof: usable(entries('references/library/layout.md', ['Proof patterns'])),
  cta: usable(entries('references/library/layout.md', ['CTA patterns'])),
  app: usable(entries('references/library/layout.md', ['App layout patterns'])),
};

// ---------- repo data ----------
function csv(rel) {
  const p = join(repo, rel);
  if (!existsSync(p)) { notes.push(`missing ${rel}`); return []; }
  const text = readFileSync(p, 'utf8');
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; } else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [head, ...body] = rows;
  return body.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] || '').trim()])));
}

// Typefaces that AI output already over-uses. Excluded from wildcards, not banned from briefs.
const SATURATED_FONTS = new Set([
  'inter', 'roboto', 'open sans', 'arial', 'helvetica', 'poppins', 'montserrat', 'lato', 'fraunces',
  'newsreader', 'lora', 'crimson', 'crimson pro', 'crimson text', 'playfair display', 'cormorant',
  'cormorant garamond', 'syne', 'ibm plex mono', 'ibm plex sans', 'ibm plex serif', 'space mono',
  'space grotesk', 'dm sans', 'dm serif display', 'dm serif text', 'outfit', 'plus jakarta sans',
  'instrument sans', 'instrument serif', 'geist', 'geist mono', 'manrope', 'jetbrains mono',
].map(norm));

const gf = csv('core-design/ui-ux-pro-max/data/google-fonts.csv').filter((r) => {
  const rank = Number(r['Popularity Rank']);
  return r.Family && !/true/i.test(r['Is Noto'] || '') && /latin/i.test(r.Subsets || 'latin')
    && rank >= 25 && rank <= 900 && !SATURATED_FONTS.has(norm(r.Family)) && !isUsed(r.Family);
});
const byCat = (re) => gf.filter((r) => re.test(r.Category || ''));

let systems = [];
const bs = join(repo, 'design-systems', 'brand-systems');
if (existsSync(bs)) {
  systems = readdirSync(bs).filter((d) => !d.startsWith('_') && statSync(join(bs, d)).isDirectory() && !isUsed(d));
}

// ---------- built-in decks ----------
const STRATEGIES = ['restrained (tinted neutrals + one accent under 10%)', 'committed (one saturated color carries 30-60% of the surface)', 'full palette (3-4 named roles, each deliberate)', 'drenched (the surface is the color)'];
const HARMONIES = ['monochrome', 'analogous', 'complementary', 'split-complementary', 'triadic', 'accent on neutral', 'near-complementary with one muted side'];
const THEMES = ['light', 'dark', 'mid-tone (neither white nor black body)', 'decide from the scene sentence, then justify'];
const CONSTRAINTS = [
  'No cards anywhere: group with space and rules only.',
  'One typeface family, at most three weights.',
  'The hero is a photograph or the product, not a sentence over a background.',
  'Everything left-aligned on one strong axis; nothing centered.',
  'Use the brand color as the page background, not as a button color.',
  'Two text sizes plus one display size on the whole page.',
  'Every section uses a different layout family.',
  'The main number or result is the largest thing on the page.',
  'Show the product at true scale, cropped tight, with real data.',
  'No icons at all: words and numbers carry meaning.',
  'One image, cropped three different ways across the page.',
  'Asymmetric 5 and 7 column split for every major section.',
  'Borrow the structure of a printed object: timetable, menu, field guide, catalogue, receipt, label.',
  'Motion only in response to user input. Nothing animates on its own.',
  'Write all the copy before drawing anything, then design around its real lengths.',
  'The accent appears exactly three times on the page.',
  'Hierarchy through size and space only: one weight everywhere.',
  'A visible grid that organizes real content (not decoration).',
  'Type set as large as the viewport allows, for one word only.',
  'Navigation lives at the bottom or the side, not the top bar.',
  'The first screen answers "what is it, who is it for, what does it cost or take".',
  'Use a real-world material reference for surfaces (paper stock, enamel, concrete, felt) without fake texture overlays.',
  'Dense like a reference manual: more information per screen than feels safe, perfectly organized.',
  'Sparse like a gallery wall: one idea per screen.',
  'Tell it as a sequence: the page reads as steps a person actually takes.',
  'Make the comparison the hero: before and after, or us versus the default.',
  'Use the audience\'s own vocabulary from the brief in every headline.',
  'Pick a non-default radius rule and state it (for example 0 everywhere, or 2px inputs and 0 containers).',
  'Contrast scale violently: one huge element, everything else small.',
  'Rhythm through color blocks: each section sits on a different tone of one hue.',
  'Data as illustration: a real chart or table replaces decorative imagery.',
  'Hand-made element: one drawn, photographed or scanned piece that a template cannot have.',
];

// ---------- roll ----------
function voiceCandidates(v) {
  const c = (v && v.fields.candidates) || '';
  const list = c.split(',').map((s) => s.replace(/\((free|commercial)\)/i, '').trim()).filter((s) => s && !isUsed(s) && !SATURATED_FONTS.has(norm(s)));
  return sample(list, 3);
}
function seed(i) {
  const a = pick(aesthetics);
  const blend = pick(aesthetics.filter((x) => x !== a));
  const pal = pick(palettes);
  const voice = pick(voices);
  const display = pick(byCat(/serif|display|sans/i));
  const text = pick(byCat(display && /serif/i.test(display.Category) && !/sans/i.test(display.Category) ? /sans/i : /serif|sans/i).filter((r) => r !== display));
  return {
    label: String.fromCharCode(65 + i),
    aesthetic: a ? `${a.name} (saturation ${saturation(a)})` : null,
    blend_with: blend ? blend.name : null,
    palette_recipe: pal ? `${pal.name}${pal.fields.strategy ? ` | ${pal.fields.strategy}` : ''}` : null,
    color_strategy: pick(STRATEGIES),
    harmony: pick(HARMONIES),
    theme: pick(THEMES),
    type_voice: voice ? voice.name : null,
    type_candidates: voiceCandidates(voice),
    google_fonts_wildcard: [display, text].filter(Boolean).map((r) => `${r.Family} (${r.Category})`),
    hero_pattern: pick(layoutSecs.hero)?.name || null,
    story_pattern: pick(layoutSecs.story)?.name || null,
    proof_pattern: pick(layoutSecs.proof)?.name || null,
    cta_pattern: pick(layoutSecs.cta)?.name || null,
    app_layout: pick(layoutSecs.app)?.name || null,
    study_systems: sample(systems, 2).map((d) => `design-systems/brand-systems/${d}/`),
    constraint: pick(CONSTRAINTS.filter((c) => !isUsed(c))) || pick(CONSTRAINTS),
  };
}

const seeds = Array.from({ length: N }, (_, i) => seed(i));

if (args.json) {
  console.log(JSON.stringify({ seeds, history_window: history.length, notes }, null, 2));
} else {
  console.log(`# Direction seeds (${N})\n`);
  console.log(`Skipping choices from the last ${history.length} logged project(s)${allowSat ? '' : ' and saturated entries'}.\n`);
  for (const s of seeds) {
    console.log(`## Seed ${s.label}`);
    const line = (k, v) => v && (Array.isArray(v) ? v.length : true) && console.log(`- **${k}:** ${Array.isArray(v) ? v.join(', ') : v}`);
    line('Aesthetic', s.aesthetic);
    line('Blend with', s.blend_with);
    line('Palette recipe', s.palette_recipe);
    line('Color strategy', s.color_strategy);
    line('Harmony', s.harmony);
    line('Theme', s.theme);
    line('Type voice', s.type_voice);
    line('Try these families', s.type_candidates);
    line('Google Fonts wildcard', s.google_fonts_wildcard);
    line('Hero pattern', s.hero_pattern);
    line('Story pattern', s.story_pattern);
    line('Proof pattern', s.proof_pattern);
    line('CTA pattern', s.cta_pattern);
    line('App layout (product UI only)', s.app_layout);
    line('Study', s.study_systems);
    line('Constraint card', s.constraint);
    console.log('');
  }
  console.log('Seeds are provocations. Keep what fits the brief, discard the rest, and say why in direction.md.');
  if (notes.length) console.log(`\n(notes: ${notes.join('; ')})`);
}
