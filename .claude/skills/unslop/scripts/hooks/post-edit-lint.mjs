#!/usr/bin/env node
// PostToolUse hook (matcher "Edit|Write"): lint UI files as they are written.
// Only active in projects that opted in by having a .unslop/ folder.
// Exit 2 sends the findings to Claude as feedback (the edit itself already happened).
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

let input = {};
try { input = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { process.exit(0); }
const cwd = input.cwd || process.cwd();
const file = input.tool_input && (input.tool_input.file_path || input.tool_input.path);
if (!file || !existsSync(join(cwd, '.unslop'))) process.exit(0);
if (!['.html', '.htm', '.css', '.jsx', '.tsx', '.vue', '.svelte'].includes(extname(file))) process.exit(0);
if (file.includes('/.unslop/')) process.exit(0);

const lint = join(dirname(fileURLToPath(import.meta.url)), '..', 'lint.mjs');
const r = spawnSync(process.execPath, [lint, file], { encoding: 'utf8' });
if (r.status === 1 && r.stdout.trim()) {
  process.stderr.write(`unslop lint on ${file}:\n${r.stdout.trim().split('\n').slice(0, 40).join('\n')}\nFix these or note why each is intentional in .unslop/build-notes.md.\n`);
  process.exit(2);
}
process.exit(0);
