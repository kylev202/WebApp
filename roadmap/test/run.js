// Local test of roadmap/index.html at 390 x 844 against mock-db.js.
// node test/run.js [outdir]   (needs roadmap/seed/out/seed.json from seed/build_seed.py)
const {chromium} = require('playwright');
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const out = process.argv[2] || path.join(root, '.unslop/shots/test');
fs.mkdirSync(out, {recursive: true});
const seed = JSON.parse(fs.readFileSync(path.join(root, 'seed/out/seed.json'), 'utf8'));
const mock = fs.readFileSync(path.join(__dirname, 'mock-db.js'), 'utf8');
const url = 'file://' + path.join(root, 'index.html');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };

async function open(browser, {time, extra = {}, scheme = 'light', hash = '', noDb = false}) {
  const ctx = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 1, colorScheme: scheme, hasTouch: true});
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => m.type() === 'error' && !/fonts\.g/.test(m.text()) && errors.push(m.text()));
  if (time) await page.clock.install({time: new Date(time)});
  await page.addInitScript(([s, e, nd]) => { window.__seed = s; window.__extra = e; window.__noDb = nd; }, [seed, extra, noDb]);
  await page.addInitScript(mock);
  await page.goto(url + hash);
  if (time) await page.clock.runFor(500);
  await page.waitForTimeout(400);
  return {ctx, page, errors};
}
const overflow = p => p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);

(async () => {
  const browser = await chromium.launch();
  // Mid-plan: Thursday 14 Jan 2027 (Week 7), Weeks 1-4 done, Week 5 left open, some hours logged
  const extra = {};
  for (const [p, d] of Object.entries(seed)) if (p.startsWith('tasks/') && /^tasks\/w0[1-4]-/.test(p)) extra[p] = {status: 'done', doneAt: '2026-12-20', by: 'kyle'};
  extra['tasks/w02-2'] = {status: 'done', doneAt: '2026-12-10', by: 'claude', updatedAt: '2026-12-10T09:00:00Z'};
  extra['checkpoints/2026-12'] = {status: 'done', doneAt: '2027-01-03', by: 'kyle'};
  extra['logs/a1'] = {kind: 'hours', date: '2027-01-11', hours: 3, dsa: 2, by: 'kyle'};
  extra['logs/a2'] = {kind: 'hours', date: '2027-01-12', hours: 1.5, dsa: 1, by: 'kyle'};
  extra['logs/a3'] = {kind: 'hours', date: '2026-12-15', hours: 4, dsa: 7, by: 'kyle'};
  extra['logs/m1'] = {kind: 'mark', date: '2026-12-01', unit: 'COS20007', assessment: 'Final exam', mark: 74, by: 'kyle'};
  extra['activity/x1'] = {at: '2026-12-10T09:00:00Z', by: 'claude', action: 'update', path: 'tasks/w02-2', summary: 'Ticked: Read a small, well-known open-source Python library…'};
  for (const scheme of ['light', 'dark']) {
    const {ctx, page, errors} = await open(browser, {time: '2027-01-14T09:30:00+11:00', extra, scheme});
    for (const t of ['week', 'roadmap', 'skills', 'projects', 'profile', 'reports']) {
      await page.evaluate(h => { location.hash = h; }, t); await page.clock.runFor(200); await page.waitForTimeout(150);
      await page.screenshot({path: `${out}/${scheme}-${t}.png`, fullPage: t !== 'roadmap'});
      ok(!(await overflow(page)), `${scheme} ${t}: no horizontal overflow at 390`);
    }
    ok(!errors.length, `${scheme}: no script errors ${errors.join(' | ')}`);
    await ctx.close();
  }

  // Interaction test (light, Week 7)
  const {ctx, page, errors} = await open(browser, {time: '2027-01-14T21:10:00+11:00', extra});
  const head = await page.textContent('.wk');
  ok(/Week 7/.test(head) && /pandas/.test(head), 'Week screen shows Week 7: pandas');
  ok(/2 weeks behind/.test(head), `pace label: ${(await page.textContent('.pace')).trim()}`);
  const firstTask = await page.locator('.rail .stop').first().boundingBox();
  ok(firstTask && firstTask.y + firstTask.height < 844 - 56, `first task visible without scrolling (y=${Math.round(firstTask.y)})`);
  // 1. Tick a task
  const t0 = Date.now();
  await page.locator('.rail .stop').first().tap();
  await page.clock.runFor(100); await page.waitForTimeout(100);
  const task = await page.evaluate(() => window.__mock.get('tasks/w07-1'));
  ok(task.status === 'done' && task.by === 'kyle' && task.doneAt === '2027-01-14' && task.updatedAt, `tick saved: ${JSON.stringify({s: task.status, by: task.by, doneAt: task.doneAt})}`);
  ok(await page.locator('.rail .stop').first().getAttribute('aria-checked') === 'true', 'ticked row shows checked');
  const act1 = await page.evaluate(() => window.__mock.list('activity').map(x => x[1]).find(a => a.path === 'tasks/w07-1'));
  ok(act1 && act1.by === 'kyle' && /Ticked/.test(act1.summary), `activity entry: ${act1 && act1.summary}`);
  // 2. Log hours
  await page.getByRole('button', {name: 'Log hours'}).tap();
  await page.fill('#h-hours', '2.5'); await page.fill('#h-dsa', '3');
  await page.getByRole('button', {name: 'Save log'}).tap();
  await page.clock.runFor(100); await page.waitForTimeout(150);
  const lg = await page.evaluate(() => window.__mock.list('logs').map(x => x[1]).find(l => l.hours === 2.5));
  ok(lg && lg.kind === 'hours' && lg.dsa === 3 && lg.date === '2027-01-14' && lg.by === 'kyle', `hours log saved: ${JSON.stringify(lg)}`);
  ok(/7 of 14 h|7\s*of 14 h/.test(await page.textContent('#main')), 'hours this week now 7 of 14 h');
  // validation
  await page.getByRole('button', {name: 'Log hours'}).tap();
  await page.fill('#h-hours', '40'); await page.getByRole('button', {name: 'Save log'}).tap();
  ok((await page.textContent('#h-hours-err')).includes('between 0.25 and 16'), 'hours validation message shown');
  await page.keyboard.press('Escape');
  // 3. Note autosave
  await page.fill('#note', 'Kaggle dataset choice is slow; pick one tonight.');
  await page.clock.runFor(1200); await page.waitForTimeout(150);
  ok((await page.evaluate(() => window.__mock.get('weeks/w07'))).note.startsWith('Kaggle'), 'week note saved');
  // 4. Weekly report
  await page.evaluate(() => { location.hash = 'reports'; }); await page.clock.runFor(100); await page.waitForTimeout(100);
  await page.getByRole('button', {name: 'Write weekly report'}).tap();
  await page.clock.runFor(100); await page.waitForTimeout(150);
  const rep = await page.evaluate(() => window.__mock.get('reports/weekly-w07'));
  ok(rep && rep.kind === 'weekly' && rep.by === 'kyle' && /Planned vs done: 1 of 3 tasks/.test(rep.text) && /Hours: 7 of 14 h/.test(rep.text) && /Still open from Week 5/.test(rep.text) && /Next week's focus: Week 8/.test(rep.text), 'weekly report saved with planned vs done, hours, blockers, next focus');
  console.log('---- report text ----\n' + rep.text + '\n---------------------');
  await page.getByRole('button', {name: 'Write monthly report'}).tap();
  await page.clock.runFor(100); await page.waitForTimeout(150);
  const mrep = await page.evaluate(() => window.__mock.get('reports/monthly-2027-01'));
  ok(mrep && /January 2027 report/.test(mrep.text) && /Checkpoint \(open\)/.test(mrep.text), 'monthly report saved');
  await page.screenshot({path: `${out}/after-reports.png`, fullPage: true});
  // 5. Roadmap reflects the tick, month sheet opens
  await page.evaluate(() => { location.hash = 'roadmap'; }); await page.clock.runFor(100); await page.waitForTimeout(150);
  ok(await page.locator('#today-dot').count() === 1, 'roadmap has the today dot');
  await page.locator('g[data-act="month"][data-id="2027-01"]').dispatchEvent('click');
  await page.waitForTimeout(150);
  ok(/January 2027: Data tools and maths/.test(await page.textContent('#sheet-h')), 'month sheet opens with the doc heading');
  await page.screenshot({path: `${out}/month-sheet.png`});
  await page.keyboard.press('Escape');
  // 6. Profile reflects data
  await page.evaluate(() => { location.hash = 'profile'; }); await page.clock.runFor(100); await page.waitForTimeout(150);
  const prof = await page.textContent('#main');
  ok(/DSA problems\s*13/.test(prof), 'profile DSA total = 2+1+7+3 = 13');
  ok(/Uni average\s*74%/.test(prof), 'uni average 74%');
  ok(/Claude/.test(prof), 'recent changes show a Claude entry');
  // 7. Skill status
  await page.evaluate(() => { location.hash = 'skills'; }); await page.clock.runFor(100); await page.waitForTimeout(150);
  await page.locator('[data-act="skill"][data-id="big-o"]').tap();
  await page.getByRole('button', {name: 'Proven'}).tap();
  await page.fill('#k-url', 'http://example.com'); await page.getByRole('button', {name: 'Save skill'}).tap();
  ok((await page.textContent('#k-url-err')).includes('https://'), 'evidence link must be https');
  await page.fill('#k-url', 'https://github.com/example/dsa'); await page.getByRole('button', {name: 'Save skill'}).tap();
  await page.clock.runFor(100); await page.waitForTimeout(150);
  const sk = await page.evaluate(() => window.__mock.get('skills/big-o'));
  ok(sk.status === 'proven' && sk.statusDate === '2027-01-14' && sk.evidence.url.startsWith('https://') && sk.by === 'kyle', 'skill saved with status, date, evidence');
  // 8. Guardrail per project
  await page.evaluate(() => { location.hash = 'projects'; }); await page.clock.runFor(100); await page.waitForTimeout(150);
  await page.locator('[data-act="guard"][data-id="g1"]').tap(); await page.clock.runFor(100); await page.waitForTimeout(100);
  const g1 = await page.evaluate(() => window.__mock.get('guardrails/g1'));
  ok(g1.checks.p1.done === true && g1.checks.p2.done === false, 'guardrail ticked for Project 1 only');
  ok(!errors.length, `interaction run: no script errors ${errors.join(' | ')}`);
  console.log('tick-to-saved ms (wall, incl. waits):', Date.now() - t0);
  await ctx.close();

  // States: before start, no db, unseeded, after weekly plan
  let r = await open(browser, {time: '2026-11-27T10:00:00+11:00'});
  ok(/Week 1/.test(await r.page.textContent('.wk')) && /Starts Mon 30 Nov/.test(await r.page.textContent('.wk')), 'before start: Week 1, "Starts Mon 30 Nov"');
  await r.page.screenshot({path: `${out}/state-before-start.png`}); await r.ctx.close();
  r = await open(browser, {time: '2027-10-14T10:00:00+11:00'});
  ok(/October/.test(await r.page.textContent('.wk')) && /Interviews/.test(await r.page.textContent('.wk')), 'after Week 44: October month block');
  await r.page.screenshot({path: `${out}/state-october.png`}); await r.ctx.close();
  r = await open(browser, {noDb: true});
  ok(/Open it in the Claude app/.test(await r.page.textContent('#main')), 'no db: explains it needs the Claude app'); await r.ctx.close();
  const ctxU = await browser.newContext({viewport: {width: 390, height: 844}}); const pu = await ctxU.newPage();
  await pu.addInitScript(() => { window.__seed = {}; }); await pu.addInitScript(mock); await pu.goto(url); await pu.waitForTimeout(400);
  ok(/Ask Claude to seed/.test(await pu.textContent('#main')), 'empty db: asks Claude to seed'); await ctxU.close();
  await browser.close();
})();
