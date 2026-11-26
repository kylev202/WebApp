#!/usr/bin/env node
// log.mjs: the studio's memory across projects (the learning loop).
//
//   add      record what a finished project used and what the critic kept finding
//   check    warn when a planned choice repeats a recent project (exit 1 on repeats)
//   recent   list the last projects
//   lessons  recurring critic findings and lessons across all projects, most frequent first
//
// History file: $UNSLOP_HISTORY, else ~/.claude/unslop/history.jsonl, else ./.unslop/history.jsonl.
//
// Examples:
//   node log.mjs add --project "Kiln pottery shop" --aesthetic "Craft heritage" \
//     --palette "Desert clay" --accent "#c2410c" --fonts "Recoleta, Public Sans" \
//     --layouts "editorial cover hero; annotated product; maker quote" --reference "Hasami Porcelain" \
//     --constraint "Borrow the structure of a printed object" --score 41 \
//     --findings "rule-15 contrast, rule-2 eyebrows" --lessons "check muted ink on clay early"
//   node log.mjs check --fonts "Recoleta, Inter" --aesthetic "Craft heritage"
//   node log.mjs lessons

import { readFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';

const FIELDS = ['project', 'aesthetic', 'palette', 'accent', 'fonts', 'type_voice', 'layouts', 'reference',
  'constraint', 'score', 'findings', 'lessons', 'notes'];
const COMPARE = ['aesthetic', 'palette', 'accent', 'fonts', 'type_voice', 'layouts', 'reference', 'constraint'];

const [cmd, ...rest] = process.argv.slice(2);
const args = {};
for (let i = 0; i < rest.length; i++) {
  if (rest[i].startsWith('--')) {
    const k = rest[i].slice(2).replace(/-/g, '_');
    args[k] = rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[++i] : true;
  }
}

const candidates = [
  process.env.UNSLOP_HISTORY,
  join(homedir(), '.claude', 'unslop', 'history.jsonl'),
  join(process.cwd(), '.unslop', 'history.jsonl'),
].filter(Boolean);

const norm = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9#]+/g, ' ').trim();
const tokens = (s) => String(s || '').split(/[,;|]/).map(norm).filter(Boolean);
// Family stem: "tiempos headline" and "tiempos text" are the same choice, as are "ibm plex sans" and "ibm plex serif".
const SUFFIX = new Set(['text', 'display', 'headline', 'caption', 'micro', 'deck', 'sans', 'serif', 'mono', 'slab',
  'condensed', 'extended', 'wide', 'narrow', 'compressed', 'pro', 'std', 'variable', 'vf', 'book', 'grotesk', 'grotesque']);
const stem = (t) => { const w = t.split(' '); while (w.length > 1 && SUFFIX.has(w[w.length - 1])) w.pop(); return w.join(' '); };
const same = (t, u) => t === u || (u.length > 3 && t.includes(u)) || (t.length > 3 && u.includes(t)) || (stem(t).length > 3 && stem(t) === stem(u));

function load() {
  const recs = [];
  for (const f of new Set(candidates)) {
    if (!existsSync(f)) continue;
    for (const line of readFileSync(f, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      try { recs.push(JSON.parse(line)); } catch { /* skip */ }
    }
  }
  return recs.sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

function writableFile() {
  for (const f of candidates) {
    try { mkdirSync(dirname(f), { recursive: true }); appendFileSync(f, ''); return f; } catch { /* try next */ }
  }
  throw new Error('no writable history location');
}

function usage() {
  console.log('usage: log.mjs <add|check|recent|lessons> [--field value ...]');
  console.log(`fields: ${FIELDS.join(', ')}; check also takes --window N (default 5)`);
  process.exit(1);
}

if (cmd === 'add') {
  if (!args.project) { console.error('add needs --project'); process.exit(1); }
  const rec = { date: new Date().toISOString() };
  for (const k of FIELDS) if (args[k] !== undefined && args[k] !== true) rec[k] = args[k];
  const f = writableFile();
  appendFileSync(f, JSON.stringify(rec) + '\n');
  console.log(`logged "${rec.project}" to ${f}`);
} else if (cmd === 'check') {
  const win = Number(args.window) || 5;
  const recent = load().slice(-win);
  let repeats = 0;
  for (const k of COMPARE) {
    if (!args[k] || args[k] === true) continue;
    for (const t of tokens(args[k])) {
      for (const r of recent) {
        const hit = tokens(r[k]).find((u) => same(t, u));
        if (hit) {
          repeats++;
          console.log(`repeat  ${k}: "${t}" was used in "${r.project}" (${String(r.date).slice(0, 10)})`);
        }
      }
    }
  }
  if (repeats) {
    console.log(`\n${repeats} repeat(s) against the last ${recent.length} project(s). Change them or justify each in direction.md.`);
    process.exit(1);
  }
  console.log(`no repeats against the last ${recent.length} project(s)`);
} else if (cmd === 'recent') {
  const n = Number(args.n) || 5;
  const recs = load().slice(-n);
  if (!recs.length) console.log('no history yet');
  for (const r of recs) {
    console.log(`${String(r.date).slice(0, 10)}  ${r.project}`);
    for (const k of COMPARE) if (r[k]) console.log(`    ${k}: ${r[k]}`);
    if (r.score) console.log(`    score: ${r.score}`);
  }
} else if (cmd === 'lessons') {
  const recs = load();
  const count = (field) => {
    const m = new Map();
    for (const r of recs) for (const t of String(r[field] || '').split(/[,;|]/).map((s) => s.trim()).filter(Boolean)) {
      const key = t.toLowerCase();
      m.set(key, (m.get(key) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  };
  if (!recs.length) { console.log('no history yet: nothing learned so far'); process.exit(0); }
  console.log(`From ${recs.length} logged project(s).\n\nRecurring critic findings (check these first):`);
  for (const [k, v] of count('findings')) console.log(`  ${v}x  ${k}`);
  console.log('\nLessons:');
  for (const [k, v] of count('lessons')) console.log(`  ${v}x  ${k}`);
} else {
  usage();
}
