#!/usr/bin/env node
// Usage: node shoot.mjs <file-or-url> <outdir>
// Writes full-page screenshots at mobile, tablet and desktop widths.
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';

const [target, outdir = './unslop-shots'] = process.argv.slice(2);
if (!target) {
  console.error('usage: shoot.mjs <file-or-url> <outdir>');
  process.exit(1);
}

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('playwright not found. Install it or run where it is preinstalled.');
  process.exit(1);
}

const url = /^https?:\/\//.test(target) ? target : 'file://' + resolve(target);
mkdirSync(outdir, { recursive: true });

const sizes = [
  ['mobile', 390, 844],
  ['tablet', 820, 1180],
  ['desktop', 1440, 900],
];

const browser = await chromium.launch();
for (const [name, width, height] of sizes) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(600);
  // Report horizontal overflow, a common mobile failure.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  const file = `${outdir}/${name}-${width}.png`;
  await page.screenshot({ path: file, fullPage: true });
  console.log(`${file}${overflow > 0 ? `  (horizontal overflow: ${overflow}px)` : ''}`);
  await page.close();
}
await browser.close();
