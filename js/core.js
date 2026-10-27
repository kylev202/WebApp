// Shared app shell: registries that feature modules fill in, rendering, sheets, toasts, haptics.
import { esc, dayKey, addDays, shortDate } from './util.js';
import { icon } from './icons.js';
import { setKV, removeEntry, putEntry } from './store.js';

export const screens = {};  // route -> () => html
export const sheets = {};   // name -> (params) => html
export const actions = {};  // data-act -> (el, event) => void
export const forms = {};    // data-form -> (FormData, form) => void
export const previews = {}; // data-form -> (form) => void, live updates while typing
export const afterRender = []; // hooks run after each render (timers, focus...)
export const views = {};    // alternate renderings a screen can switch to (today -> day timeline)
export const TITLES = { today: 'Today', health: 'Health', ask: 'Ask', plan: 'Plan', money: 'Money', settings: 'Settings', workout: 'Workout', routine: 'Routine' };
// Routes that hide the tab bar (full-screen flows).
export const FULLSCREEN = new Set(['workout', 'routine']);

export const ui = { route: 'today', tab: {}, sheet: null, params: {}, pulse: null };
export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const main = document.getElementById('main');
const sheetEl = document.getElementById('sheet');
const toastEl = document.getElementById('toast');

export function go(route) { location.hash = route; }

// One screen that can't draw itself used to take the whole app down with it: the
// old screen stayed up, every tab stopped responding and the only way out was to
// clear the app's data. Now the screen that broke says so and the rest still works.
function brokenScreen(route, err) {
  return `${header(TITLES[route] ?? 'Loop', 'Something went wrong')}
  <section class="card glass"><div class="t">This screen couldn’t be drawn</div>
    <p class="note">The rest of Loop still works, and nothing you logged is lost. If it keeps happening, back up your data from Settings and send me this message:</p>
    <p class="note"><b>${esc(String(err?.message ?? err))}</b></p>
    <button class="btn soft" data-act="nav" data-to="settings">${icon('gear')} Open Settings</button></section>`;
}

export function render({ enter = false } = {}) {
  const route = screens[ui.route] ? ui.route : 'today';
  main.classList.toggle('enter', enter && !reduceMotion);
  let html;
  try {
    html = screens[route]();
  } catch (err) {
    console.error(`Loop: the ${route} screen failed to render`, err);
    html = brokenScreen(route, err);
  }
  main.innerHTML = `<div class="screen">${html}</div>`;
  makeFocusable(main);
  document.body.classList.toggle('fullscreen', FULLSCREEN.has(route));
  document.querySelectorAll('.tab[data-to]').forEach(t => {
    t.classList.toggle('active', t.dataset.to === route);
    if (t.dataset.to === route) t.setAttribute('aria-current', 'page');
    else t.removeAttribute('aria-current');
  });
  document.getElementById('topbar-title').textContent = TITLES[route] ?? '';
  moveTabIndicator();
  if (ui.pulse) {
    main.querySelector(ui.pulse)?.classList.add('pop');
    ui.pulse = null;
  }
  // An after-render hook that throws must not take the screen down with it.
  afterRender.forEach(fn => { try { fn(route); } catch (err) { console.error('Loop: after-render hook failed', err); } });
}

// Tappable cards and rows are divs; give them a button role and a tab stop so
// VoiceOver and a keyboard can reach them (app.js turns Enter/Space into a tap).
function makeFocusable(root) {
  root.querySelectorAll('[data-act]:not(button, a[href], input, select, textarea, label, .sheet-bg)').forEach(el => {
    el.tabIndex = 0;
    if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
  });
}

// Liquid pill that slides under the active tab.
export function moveTabIndicator() {
  const ind = document.getElementById('tab-ind');
  const active = document.querySelector('.tab.active:not(.ask)');
  if (!active) { ind.style.opacity = '0'; return; }
  ind.style.opacity = '1';
  ind.style.width = `${active.offsetWidth}px`;
  ind.style.transform = `translateX(${active.offsetLeft}px)`;
}

// ---------- sheets ----------
export function openSheet(name, params = {}) {
  if (ui.sheet === 'welcome') setKV('onboarded', true);
  ui.sheet = name;
  ui.params = params;
  sheetEl.innerHTML = `<div class="sheet-wrap"><div class="sheet-bg" data-act="close"></div><div class="sheet glass" role="dialog" aria-modal="true"><div class="grabber"></div>${sheets[name](params)}</div></div>`;
  const form = sheetEl.querySelector('form[data-form]');
  if (form) previews[form.dataset.form]?.(form);
  const sheet = sheetEl.querySelector('.sheet');
  labelSheet(sheet);
  makeFocusable(sheet);
  enableSheetDrag(sheet);
  document.body.classList.add('sheet-open');
}

// Screen readers announce the sheet by its title.
function labelSheet(sheet) {
  const h2 = sheet.querySelector('h2');
  if (!h2) return;
  h2.id = 'sheet-title';
  sheet.setAttribute('aria-labelledby', 'sheet-title');
}

// Re-draw the open sheet in place (after an action inside it).
export function refreshSheet() {
  const body = sheetEl.querySelector('.sheet');
  if (!ui.sheet || !body) return;
  const scroll = body.scrollTop;
  body.innerHTML = `<div class="grabber"></div>${sheets[ui.sheet](ui.params)}`;
  labelSheet(body);
  makeFocusable(body);
  body.scrollTop = scroll;
}

export function closeSheet(immediate = false) {
  if (!ui.sheet) return;
  if (ui.sheet === 'welcome') setKV('onboarded', true);
  ui.sheet = null;
  document.body.classList.remove('sheet-open');
  const wrap = sheetEl.firstElementChild;
  if (!wrap || immediate || reduceMotion) { sheetEl.innerHTML = ''; return; }
  wrap.classList.add('closing');
  setTimeout(() => { if (!ui.sheet) sheetEl.innerHTML = ''; }, 240);
}

export const sheetForm = name => sheetEl.querySelector(`form[data-form="${name}"]`);

// Drag the sheet down to dismiss it, like iOS.
function enableSheetDrag(sheet) {
  let startY = null, dy = 0, t0 = 0;
  sheet.addEventListener('touchstart', e => {
    if (sheet.scrollTop > 0 || e.target.closest('input, select, textarea, .no-drag')) return;
    startY = e.touches[0].clientY;
    dy = 0;
    t0 = Date.now();
    sheet.style.transition = 'none';
  }, { passive: true });
  sheet.addEventListener('touchmove', e => {
    if (startY == null) return;
    dy = Math.max(0, e.touches[0].clientY - startY);
    sheet.style.transform = dy ? `translateY(${dy}px)` : '';
  }, { passive: true });
  sheet.addEventListener('touchend', () => {
    if (startY == null) return;
    const fast = dy / Math.max(1, Date.now() - t0) > 0.6;
    startY = null;
    sheet.style.transition = '';
    if (dy > 120 || (dy > 40 && fast)) closeSheet();
    else sheet.style.transform = '';
  });
}

// ---------- feedback ----------
// iOS Safari has no vibrate API, but toggling a native switch gives a light haptic tap.
const hapticSwitch = (() => {
  const label = document.createElement('label');
  label.className = 'haptic';
  label.ariaHidden = 'true';
  label.innerHTML = '<input type="checkbox" switch tabindex="-1">';
  document.body.append(label);
  return label;
})();
export function haptic() {
  try {
    if (navigator.vibrate) navigator.vibrate(8);
    else hapticSwitch.click();
  } catch { /* haptics are best-effort */ }
}

let toastRun = null, toastTimer = null;
export function toast(msg, { icon: ic = 'check', action, ms } = {}) {
  toastEl.innerHTML = `<span class="toast-i">${icon(ic)}</span><span class="toast-msg">${esc(msg)}</span>${action ? `<button class="toast-act" data-act="toastAction">${esc(action.label)}</button>` : ''}`;
  toastEl.classList.toggle('has-action', !!action);
  toastRun = action?.run ?? null;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms ?? (action ? 4500 : 1900));
}
actions.toastAction = () => { toastEl.classList.remove('show'); toastRun?.(); };

// Soft pastel confetti for PRs and big wins.
export function confetti() {
  if (reduceMotion) return;
  const colors = ['#f28ca3', '#f5ba74', '#72cc98', '#6ccac3', '#88baf0', '#9d98ef'];
  const box = document.createElement('div');
  box.className = 'confetti';
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('i');
    p.style.cssText = `left:${Math.random() * 100}%;background:${colors[i % colors.length]};--dx:${(Math.random() - 0.5) * 160}px;--r:${Math.random() * 720}deg;animation-delay:${Math.random() * 0.25}s;width:${6 + Math.random() * 5}px;height:${8 + Math.random() * 8}px`;
    box.append(p);
  }
  document.body.append(box);
  setTimeout(() => box.remove(), 2600);
}

// A short soft chime (rest timer). Audio must be unlocked by a tap first on iOS.
let audio;
export function unlockAudio() {
  try { audio ??= new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); } catch { /* no audio */ }
}
export function chime() {
  if (!audio) return;
  const t = audio.currentTime;
  [880, 1320].forEach((f, i) => {
    const o = audio.createOscillator(), g = audio.createGain();
    o.frequency.value = f;
    o.type = 'sine';
    g.gain.setValueAtTime(0, t + i * 0.18);
    g.gain.linearRampToValueAtTime(0.18, t + i * 0.18 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.18 + 0.5);
    o.connect(g).connect(audio.destination);
    o.start(t + i * 0.18);
    o.stop(t + i * 0.18 + 0.55);
  });
}

// Delete an entry, offering Undo in the toast.
export async function removeWithUndo(id, label = 'Deleted') {
  const entry = await removeEntry(id);
  if (!entry) return;
  haptic();
  render();
  toast(label, { icon: 'trash', action: { label: 'Undo', run: async () => { await putEntry(entry); render(); } } });
  return entry;
}

// ---------- friendly form pickers ----------
// Tappable chips instead of tiny selects. options: [value, label, icon?, area?]
export function chips(name, options, current, { cols = 0, cls = '' } = {}) {
  return `<div class="pick ${cls}"${cols ? ` style="--cols:${cols}"` : ''}>${options.map(([v, label, ic, area]) => `<label class="pk"${area ? ` style="--pk:var(--${area}-ink);--pkb:var(--${area}-bg);--pkc:var(--${area})"` : ''}><input type="radio" name="${name}" value="${esc(v)}" ${String(current ?? '') === String(v) ? 'checked' : ''}><span>${ic ? icon(ic) : ''}<em>${esc(label)}</em></span></label>`).join('')}</div>`;
}

// Date as chips: Today / Tomorrow (or Yesterday for past things) / Pick date. past: dates can't be in the future.
export function dateField(name, value, { none = false, past = false } = {}) {
  const t = dayKey(), other = addDays(t, past ? -1 : 1);
  const presets = [...(none ? [['', 'No date']] : []), [t, 'Today'], [other, past ? 'Yesterday' : 'Tomorrow']];
  const v = value ?? (none ? '' : t);
  const custom = !presets.some(([d]) => d === v);
  return `<div class="pick date-pick">${presets.map(([d, label]) => `<label class="pk"><input type="radio" name="${name}" value="${d}" ${!custom && v === d ? 'checked' : ''}><span><em>${label}</em></span></label>`).join('')}
    <label class="pk pk-date"><input type="radio" name="${name}" value="custom" ${custom ? 'checked' : ''}><span>${icon('calendar')}<em class="pk-date-text">${custom ? shortDate(v) : 'Pick date'}</em><input type="date" class="pk-date-in" name="${name}Custom" value="${custom ? esc(v) : ''}" ${past ? `max="${t}"` : ''} aria-label="Pick a date"></span></label></div>`;
}
export const readDate = (f, name) => (f.get(name) === 'custom' ? f.get(`${name}Custom`) || null : f.get(name) || null);

// Picking a date in the hidden date input selects its chip and shows the date.
document.addEventListener('change', e => {
  if (!e.target.classList?.contains('pk-date-in')) return;
  const label = e.target.closest('.pk-date');
  label.querySelector('input[type=radio]').checked = true;
  label.querySelector('.pk-date-text').textContent = e.target.value ? shortDate(e.target.value) : 'Pick date';
});
// Desktop browsers need an explicit nudge to open the picker of an invisible date input.
document.addEventListener('click', e => {
  if (e.target.classList?.contains('pk-date-in')) { try { e.target.showPicker?.(); } catch { /* iOS opens it natively */ } }
});

export const toggle = (name, label, on) => `<label class="toggle"><input type="checkbox" name="${name}" ${on ? 'checked' : ''}><span class="sw"></span>${esc(label)}</label>`;

// ---------- shared bits of markup ----------
export const closeBtn = `<button type="button" class="x-btn" data-act="close" aria-label="Close">${icon('close')}</button>`;
export const header = (title, sub, right = '') => `<header><div class="grow"><div class="date">${sub}</div><h1>${title}</h1></div>${right}</header>`;
export const seg = (key, options, current) => `<div class="seg wide">${options.map(([k, label]) =>
  `<button class="${current === k ? 'on' : ''}" data-act="segTab" data-key="${key}" data-tab="${k}">${label}</button>`).join('')}</div>`;
actions.segTab = el => { ui.tab[el.dataset.key] = el.dataset.tab; render({ enter: true }); };
