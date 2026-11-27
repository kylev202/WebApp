// Writes .unslop/preview/<screen>.html: index.html + mock db + seed + sample progress + a fixed clock (Thu 14 Jan 2027, 9:30 pm Melbourne).
// Output holds the doc's text, so .unslop/preview/ is git-ignored. For design review only.
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const seed = JSON.parse(fs.readFileSync(path.join(root, 'seed/out/seed.json'), 'utf8'));
const extra = {};
for (const p of Object.keys(seed)) if (/^tasks\/w0[1-4]-/.test(p)) extra[p] = {status: 'done', doneAt: '2026-12-20', by: 'kyle'};
Object.assign(extra, {
  'tasks/w02-2': {status: 'done', doneAt: '2026-12-10', by: 'claude'}, 'tasks/w07-1': {status: 'done', doneAt: '2027-01-12', by: 'kyle'},
  'checkpoints/2026-12': {status: 'done', doneAt: '2027-01-03', by: 'kyle'},
  'logs/a1': {kind: 'hours', date: '2027-01-11', hours: 3, dsa: 2, by: 'kyle'}, 'logs/a2': {kind: 'hours', date: '2027-01-12', hours: 1.5, dsa: 1, by: 'kyle'},
  'logs/a3': {kind: 'hours', date: '2026-12-15', hours: 4, dsa: 7, by: 'kyle'}, 'logs/m1': {kind: 'mark', date: '2026-12-01', unit: 'COS20007', assessment: 'Final exam', mark: 74, by: 'kyle'},
  'skills/big-o': {status: 'proven', statusDate: '2026-12-12', evidence: {url: 'https://github.com/example/dsa', note: ''}, by: 'kyle'},
  'skills/hash-maps': {status: 'can-explain', statusDate: '2026-12-19', by: 'kyle'}, 'skills/py-decorators': {status: 'learning', statusDate: '2026-12-16', by: 'kyle'},
  'activity/x1': {at: '2026-12-10T09:00:00Z', by: 'claude', action: 'update', path: 'tasks/w02-2', summary: 'Ticked: Read a small, well-known open-source Python library…'},
  'activity/x2': {at: '2027-01-12T10:00:00Z', by: 'kyle', action: 'update', path: 'tasks/w07-1', summary: "Ticked: Kaggle Learn's free pandas course"},
  'weeks/w07': {note: 'Kaggle dataset choice is slow; pick one tonight.', noteBy: 'kyle', noteAt: '2027-01-12T10:05:00Z'},
});
const clock = `<script>{const T=new Date('2027-01-14T21:30:00+11:00').getTime(),d=T-Date.now(),R=Date;class F extends R{constructor(...a){super(...(a.length?a:[R.now()+d]))}static now(){return R.now()+d}};window.Date=F;}</script>`;
const inject = `${clock}<script>window.__seed=${JSON.stringify(seed).replace(/</g, '\\u003c')};window.__extra=${JSON.stringify(extra)};</script><script>${fs.readFileSync(path.join(__dirname, 'mock-db.js'), 'utf8')}</script>`;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace('<head>', '<head>' + inject);
const out = path.join(root, '.unslop/preview'); fs.mkdirSync(out, {recursive: true});
for (const s of ['week', 'roadmap', 'skills', 'projects', 'profile', 'reports'])
  fs.writeFileSync(path.join(out, `${s}.html`), html.replace('<script>\n{', `<script>\nif(!location.hash)location.hash='${s}';\n{`));
console.log('wrote', out);
