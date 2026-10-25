// Settings: goals, habits, backup and data.
import { state, setKV, exportData, importData, eraseAll } from './store.js';
import { esc, dayKey, num, uid } from './util.js';
import { icon, tile, HABIT_ICONS } from './icons.js';
import { screens, actions, forms, afterRender, render, toast, haptic, header, go } from './core.js';
import { goals, habits, DEFAULT_GOALS } from './data.js';

export const VERSION = '3.1.0';
// Later versions add their own settings cards (AI key, connections...).
export const settingsSections = [];

function renderSettings() {
  const g = goals();
  const lastBackup = state.kv.lastBackup;
  return `${header('Settings', 'Loop', '<button class="pill-btn" data-act="nav" data-to="today">Done</button>')}
  <section class="card glass brand"><img src="icons/icon-192.png" alt="" width="52" height="52"><div><div class="t">Loop</div><div class="d">Version ${VERSION} · data stays on this iPhone</div></div></section>

  <div class="section-label">Daily goals</div>
  <form class="card glass" data-form="goals">
    <button type="button" class="btn soft calc-btn" data-act="sheet" data-sheet="calc">${icon('calculator')} Calculate for my bulk</button>
    <div class="row2">
      <div class="field"><label>Calories (kcal)</label><input class="input-x" name="kcal" inputmode="numeric" value="${g.kcal}"></div>
      <div class="field"><label>Protein (g)</label><input class="input-x" name="protein" inputmode="numeric" value="${g.protein}"></div>
      <div class="field"><label>Water (glasses)</label><input class="input-x" name="water" inputmode="numeric" value="${g.water}"></div>
      <div class="field"><label>Sleep (hours)</label><input class="input-x" name="sleep" inputmode="decimal" value="${g.sleep}"></div>
    </div>
    <button class="btn">Save goals</button>
  </form>

  <div class="section-label">Habits</div>
  <section class="card glass">
    <div class="list">${habits().map(h => `<div class="row">${tile(h.icon, 'diet')}<div class="grow"><div class="t">${esc(h.name)}</div></div>
      <button class="x-btn" data-act="delHabit" data-id="${esc(h.id)}" aria-label="Remove habit">${icon('close')}</button></div>`).join('')}</div>
    <form class="add-habit" data-form="habit">
      <div class="label-sm">New habit</div>
      <div class="icon-pick">${HABIT_ICONS.map((n, i) => `<label><input type="radio" name="icon" value="${n}" ${i === 0 ? 'checked' : ''}><span>${icon(n)}</span></label>`).join('')}</div>
      <div class="add-row"><input class="input-x" name="name" placeholder="e.g. Creatine" required maxlength="20" aria-label="Habit name"><button class="pill-btn">Add</button></div>
    </form>
  </section>

  ${settingsSections.map(s => s()).join('')}

  <div class="section-label">Backup</div>
  <section class="card glass">
    <p class="note">Your data lives only on this iPhone. Save a backup to <b>iCloud Drive</b> weekly: tap Back up → <b>Save to Files</b> → iCloud Drive.</p>
    <p class="note">Last backup: <b>${lastBackup ? new Date(lastBackup).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }) : 'never'}</b></p>
    <div class="row2"><button class="btn" data-act="backup">${icon('cloud')} Back up</button><button class="btn soft" data-act="restore">${icon('upload')} Restore</button></div>
    <p class="note" id="persist-note" style="margin:10px 0 0"></p>
  </section>

  <div class="section-label">Danger zone</div>
  <section class="card glass"><button class="btn danger" data-act="erase">${icon('trash')} Erase all data</button></section>`;
}
screens.settings = renderSettings;

afterRender.push(async route => {
  const el = document.getElementById('persist-note');
  if (route !== 'settings' || !el || !navigator.storage?.persisted) return;
  const persisted = await navigator.storage.persisted();
  el.textContent = persisted ? 'Storage is marked persistent on this device.' : 'Storage isn’t marked persistent yet. Open Loop from the Home Screen icon.';
});

export async function backup() {
  const name = `loop-backup-${dayKey()}.json`;
  const file = new File([JSON.stringify(exportData())], name, { type: 'application/json' });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Loop backup' });
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(file);
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }
    await setKV('lastBackup', Date.now());
    toast('Backup saved', { icon: 'cloud' });
    render();
  } catch (err) {
    if (err.name !== 'AbortError') toast('Backup failed', { icon: 'alert' });
  }
}

document.getElementById('restore-input').addEventListener('change', async e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!confirm(`Replace everything on this iPhone with the backup from ${data.exportedAt?.slice(0, 10) ?? 'this file'}?`)) return;
    await importData(data);
    toast('Backup restored', { icon: 'cloud' });
    render({ enter: true });
  } catch {
    toast('That file isn’t a Loop backup', { icon: 'alert' });
  }
});

Object.assign(actions, {
  backup,
  restore: () => document.getElementById('restore-input').click(),
  async delHabit(el) {
    if (!confirm('Remove this habit? Its history stays in your backup.')) return;
    await setKV('habits', habits().filter(h => h.id !== el.dataset.id));
    render();
  },
  async erase() {
    if (!confirm('Erase ALL Loop data on this iPhone? This cannot be undone.')) return;
    if (!confirm('Really erase everything? Make sure you have a backup.')) return;
    await eraseAll();
    toast('All data erased', { icon: 'trash' });
    go('today');
    render({ enter: true });
  },
});

Object.assign(forms, {
  async goals(f) {
    const g = {};
    for (const k of Object.keys(DEFAULT_GOALS)) {
      const v = num(f.get(k));
      g[k] = v > 0 ? v : DEFAULT_GOALS[k];
    }
    await setKV('goals', g);
    haptic();
    toast('Goals saved', { icon: 'target' });
    render();
  },
  async habit(f) {
    const name = String(f.get('name')).trim();
    if (!name) return;
    await setKV('habits', [...habits(), { id: uid(), name, icon: String(f.get('icon') || 'star') }]);
    haptic();
    toast(`${name} added`, { icon: f.get('icon') || 'star' });
    render();
  },
});
