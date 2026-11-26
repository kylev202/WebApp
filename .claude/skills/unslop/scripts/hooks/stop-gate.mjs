#!/usr/bin/env node
// Stop hook: do not let an unslop project end before the QA loop has produced a verdict.
// Active only when .unslop/brief.md exists. Opt out for a project with .unslop/skip-gate.
// Exit 2 blocks the stop and tells Claude why; stop_hook_active prevents an endless loop.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

let input = {};
try { input = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { process.exit(0); }
if (input.stop_hook_active) process.exit(0);

const dir = join(input.cwd || process.cwd(), '.unslop');
if (!existsSync(join(dir, 'brief.md')) || existsSync(join(dir, 'skip-gate'))) process.exit(0);

const critiques = readdirSync(dir)
  .filter((f) => /^critique-\d+\.md$/.test(f))
  .map((f) => ({ f, t: statSync(join(dir, f)).mtimeMs }))
  .sort((a, b) => b.t - a.t);

const block = (why) => {
  process.stderr.write(`unslop stop gate: ${why}\nRun the design critic (Phase 6 in SKILL.md): shoot, lint, score the rubric, and write a critique with "Verdict: ship" or "Verdict: escalate" and the reasons. To skip for this project, create .unslop/skip-gate.\n`);
  process.exit(2);
};

if (!critiques.length) block('no critique has been written yet.');
const latest = critiques[0];
const briefTime = statSync(join(dir, 'brief.md')).mtimeMs;
if (briefTime > latest.t) block(`the brief changed after ${latest.f}.`);
const text = readFileSync(join(dir, latest.f), 'utf8');
// Only a finished, single-word verdict line counts. The unfilled template line
// "Verdict: ship | fix | escalate" must not read as a ship.
if (!/^[\s>*_-]*verdict:?[\s*_]*:?\s*(ship|escalate)[\s*_.]*$/im.test(text)) block(`${latest.f} has no single-word ship or escalate verdict yet.`);
process.exit(0);
