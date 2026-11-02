// Shared app shell: registries that feature modules fill in, rendering, sheets, toasts, haptics.
import { esc, dayKey, addDays, shortDate } from './util.js';
import { icon } from './icons.js';
import { setKV, removeEntry, putEntry } from './store.js';
import { slidePill } from './fx.js';

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

// dir: 1 or -1 when a sub-tab was changed sideways, so the new content slides in
// from that side instead of rising (the title and the tab switcher stay still).
export function render({ enter = false, dir = 0 } = {}) {
  const route = screens[ui.route] ? ui.route : 'today';
  main.classList.toggle('enter', enter && !reduceMotion);
  if (dir) main.dataset.dir = dir > 0 ? 'r' : 'l';
  else delete main.dataset.dir;
  let html;
  try {
    html = screens[route]();
  } catch (err) {
    console.error(`Loop: the ${route} screen failed to render`, err);
    html = brokenScreen(route, err);
  }
  main.innerHTML = `<div class="screen">${html}</div>`;
  makeFocusable(main);
  buildSectionNav();
  measureDock();
  document.body.classList.toggle('fullscreen', FULLSCREEN.has(route));
  document.querySelectorAll('.tab[data-to]').forEach(t => {
    t.classList.toggle('active', t.dataset.to === route);
    if (t.dataset.to === route) t.setAttribute('aria-current', 'page');
    else t.removeAttribute('aria-current');
  });
  document.getElementById('topbar-title').textContent = TITLES[route] ?? '';
  moveTabIndicator();
  moveSegIndicators();
  if (ui.pulse) {
    main.querySelectorAll(ui.pulse).forEach(el => el.classList.add('pop'));
    ui.pulse = null;
  }
  // An after-render hook that throws must not take the screen down with it.
  afterRender.forEach(fn => { try { fn(route); } catch (err) { console.error('Loop: after-render hook failed', err); } });
}

// ---------- section bar ----------
// A screen is a stack of sections (see sect()). Nothing on a screen folds away
// behind a summary — a closed block tells you nothing about what is inside it —
// so every screen stays whole and scrollable and gets a bar naming the sections
// on it. The bar rides in the same pinned dock as the sub-tabs: those choose
// which screen you are on, this chooses where in it you land. It says what the
// screen holds before you scroll, marks the section you are reading, shows how
// far down it you are, and jumps to any of the others.
//
// It is built from the rendered page, so a screen only needs sect() to get one;
// there is no list to keep in step with the markup.

// Once a page has bottomed out, its last sections can never be scrolled up to
// the bar, so a tap on one of those is remembered and the bar marks what was
// asked for rather than whatever happens to sit under the line.
let jumped = null, jumpedAt = 0;
// The marked chip. -1 means the bar was just built (or the row has re-wrapped),
// so the pill is placed where it belongs instead of sliding there from nowhere.
let snActive = -1;
// What the bar on this screen is pointing at: its chapters, or — on a screen
// that is one long read with no chapters of its own, like the money report —
// the labels of the groups inside it.
let snSel = '.sect';

function buildSectionNav() {
  const screen = main.querySelector('.screen');
  let marks = [...main.querySelectorAll('.sect')];
  snSel = '.sect';
  if (marks.length < 2) {
    marks = [...main.querySelectorAll('.section-label')];
    snSel = '.section-label';
  }
  snActive = -1;
  // A bar listing one destination is just the heading again.
  if (!screen || marks.length < 2) return;
  const ids = marks.map((el, i) => {
    // Some sections already carry an id that a tile jumps to; keep it.
    if (!el.id) el.id = `sect-${i}`;
    return el.id;
  });
  // A group label carries its own aside in a <span>; only the name goes in the bar.
  const labels = marks.map((el, i) => el.dataset.nav || el.querySelector('h2')?.textContent
    || el.firstChild?.textContent?.trim() || `Section ${i + 1}`);
  jumped = null;
  jumpedAt = 0;
  const nav = document.createElement('nav');
  nav.className = 'subnav';
  nav.setAttribute('aria-label', 'Sections on this screen');
  // The pill sits under the chips, so it can travel between them rather than a
  // background switching off one chip and on under another.
  nav.innerHTML = `<div class="subnav-in"><span class="sn-ind" aria-hidden="true"></span>${ids.map((id, i) =>
    `<button class="sn" data-act="jump" data-to="${id}" data-i="${i}">${esc(labels[i])}</button>`).join('')}</div>`;
  // Into the sub-tab dock where there is one, so the two bars pin as one block;
  // otherwise the bar gets a dock of its own to pin in.
  const dock = screen.querySelector('.seg-dock');
  if (dock) dock.append(nav);
  else {
    const own = document.createElement('div');
    own.className = 'seg-dock';
    own.append(nav);
    const after = [...screen.children].filter(k => k.tagName === 'HEADER' || k.classList.contains('seg')).pop();
    const mark = document.createElement('div');
    mark.className = 'dock-mark';
    mark.setAttribute('aria-hidden', 'true');
    if (after) after.after(mark, own);
    else screen.prepend(mark, own);
  }
  markSection();
}

// Anything jumped to has to clear the pinned bars, and how tall they are depends
// on the screen: sub-tabs, a section bar, both or neither. Measuring beats a
// magic number that goes stale the moment a row is added.
function measureDock() {
  const dock = main.querySelector('.seg-dock');
  document.documentElement.style.setProperty('--dock-h', `${dock ? Math.round(dock.getBoundingClientRect().height) : 0}px`);
}

// The marked chip gets the same liquid pill as the tab bar and the sub-tabs. It
// travels in two directions, because the bar wraps: a chip on a second row is
// reached by dropping to it, not only by sliding along.
function moveSectionPill(nav, btn, instant) {
  const ind = nav.querySelector('.sn-ind');
  if (!ind) return;
  if (!btn) { ind.style.opacity = '0'; return; }
  if (instant) ind.style.transition = 'none';
  ind.style.opacity = '1';
  ind.style.width = `${btn.offsetWidth}px`;
  ind.style.height = `${btn.offsetHeight}px`;
  ind.style.transform = `translate(${btn.offsetLeft}px, ${btn.offsetTop}px)`;
  if (instant) {
    void ind.offsetWidth; // take this move at once; animate the next one
    ind.style.transition = '';
  }
}

// Which section you are reading: the last one whose heading has come up under
// the pinned bars.
function markSection() {
  const nav = main.querySelector('.subnav');
  if (!nav) return;
  // The margin clears the gap a jump leaves, so landing on a section always
  // marks that section and never the one above it.
  const line = nav.getBoundingClientRect().bottom + 40;
  const sects = [...main.querySelectorAll(snSel)];
  let active = 0;
  sects.forEach((el, i) => { if (el.getBoundingClientRect().top <= line) active = i; });
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const atEnd = window.scrollY >= max - 4;
  if (atEnd && jumped != null) {
    // A section at the foot of the page can never be scrolled up to the bar, and
    // on a screen that fits on the phone none of them can. Either way the tap
    // that brought us here is the answer, not whatever sits under the line.
    active = jumped;
  } else if (atEnd && max > 8) {
    active = sects.length - 1;
  } else if (Date.now() - jumpedAt > 1200) {
    // Forget the tap once its scroll has settled mid-page. The test is on time,
    // not position, because a smooth scroll passes through the middle of the
    // page on its way down.
    jumped = null;
  }
  const chips = [...nav.querySelectorAll('.sn')];
  chips.forEach((b, i) => {
    const on = i === active;
    b.classList.toggle('on', on);
    b.setAttribute('aria-current', on ? 'true' : 'false');
    // Only the marked chip is a tab stop: the bar is one control to tab onto,
    // and the arrow keys move along it from there.
    b.tabIndex = on ? 0 : -1;
  });
  if (active !== snActive) {
    moveSectionPill(nav, chips[active], snActive < 0 || reduceMotion);
    snActive = active;
  }
  // A section can be long, so the bar also says how far down the screen you are:
  // a hairline along the foot of the dock, filling as you read.
  nav.closest('.seg-dock')?.style.setProperty('--read', max > 8 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
}

// Marking is throttled to one pass a frame: a screen can hold a dozen sections
// and each pass measures every one of them.
let snFrame = 0;
function onSectionScroll() {
  if (snFrame) return;
  snFrame = requestAnimationFrame(() => { snFrame = 0; markSection(); });
}
window.addEventListener('scroll', onSectionScroll, { passive: true });
// A turn or a text-size change re-wraps the bar, which moves every chip: the
// dock is measured again and the pill re-placed where it now sits.
window.addEventListener('resize', () => { measureDock(); snActive = -1; markSection(); });

// The bar is one tab stop, walked with the arrow keys like a real tab row.
document.addEventListener('keydown', e => {
  const btn = e.target.closest?.('.sn');
  if (!btn || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
  const chips = [...btn.closest('.subnav').querySelectorAll('.sn')];
  const at = chips.indexOf(btn);
  const to = e.key === 'Home' ? 0 : e.key === 'End' ? chips.length - 1
    : Math.min(chips.length - 1, Math.max(0, at + (e.key === 'ArrowRight' ? 1 : -1)));
  if (to === at) return;
  e.preventDefault();
  chips[to].tabIndex = 0;
  chips[to].focus();
  chips[to].click();
});

// Tappable cards and rows are divs; give them a button role and a tab stop so
// VoiceOver and a keyboard can reach them (app.js turns Enter/Space into a tap).
export function makeFocusable(root) {
  root.querySelectorAll('[data-act]:not(button, a[href], input, select, textarea, label, .sheet-bg)').forEach(el => {
    el.tabIndex = 0;
    if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
  });
}

// Liquid pill that slides under the active tab. It remembers where it last sat
// (even while hidden on Ask) so it can stretch across from there.
let pill = null;
export function moveTabIndicator(instant = false) {
  const ind = document.getElementById('tab-ind');
  const active = document.querySelector('.tab.active:not(.ask)');
  if (!active) { ind.style.opacity = '0'; return; }
  const to = { x: active.offsetLeft, w: active.offsetWidth };
  ind.style.opacity = '1';
  ind.style.width = `${to.w}px`;
  ind.style.transform = `translateX(${to.x}px)`;
  if (pill && !instant) slidePill(ind, pill, to);
  pill = to;
}

// The sub-tabs at the top get the same liquid pill as the tab bar. A screen is
// redrawn from scratch on every change, so each row's last position is kept by
// its key and the new pill slides over from there. Only a real move hops the
// label; a redraw for some other reason leaves the pill where it is.
const segPills = {};
export function moveSegIndicators() {
  main.querySelectorAll('.seg[data-seg]').forEach(row => {
    const ind = row.querySelector('.seg-ind'), on = row.querySelector('button.on');
    if (!ind) return;
    if (!on) { ind.style.opacity = '0'; return; }
    const key = row.dataset.seg, to = { x: on.offsetLeft, w: on.offsetWidth }, from = segPills[key];
    ind.style.opacity = '1';
    ind.style.width = `${to.w}px`;
    ind.style.transform = `translateX(${to.x}px)`;
    if (from && from.x !== to.x) {
      slidePill(ind, from, to, `seg:${key}`);
      on.classList.add('hop');
    }
    segPills[key] = to;
  });
}
// A rotation or a text-size change moves every tab: place the pills afresh, without a slide.
window.addEventListener('resize', () => {
  for (const k of Object.keys(segPills)) delete segPills[k];
  moveSegIndicators();
});

// ---------- sheets ----------
export function openSheet(name, params = {}) {
  if (ui.sheet === 'welcome') setKV('onboarded', true);
  ui.sheet = name;
  ui.params = params;
  sheetEl.innerHTML = `<div class="sheet-wrap fresh"><div class="sheet-bg" data-act="close"></div><div class="sheet glass" role="dialog" aria-modal="true"><div class="grabber"></div>${sheets[name](params)}</div></div>`;
  const form = sheetEl.querySelector('form[data-form]');
  if (form) previews[form.dataset.form]?.(form);
  const sheet = sheetEl.querySelector('.sheet');
  labelSheet(sheet);
  makeFocusable(sheet);
  enableSheetDrag(sheet);
  document.body.classList.add('sheet-open');
  // Its contents bounce in once, on opening; redraws inside the sheet stay still.
  const wrap = sheetEl.firstElementChild;
  setTimeout(() => wrap.classList.remove('fresh'), 900);
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

// Drag the sheet down to dismiss it, like iOS. Pulling it up stretches like a
// rubber band (when there's nothing to scroll) and it springs back on release.
const rubber = d => Math.sqrt(d) * 3.2;
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
    const d = e.touches[0].clientY - startY;
    dy = Math.max(0, d);
    const up = d < 0 && sheet.scrollHeight <= sheet.clientHeight + 1 ? -rubber(-d) : 0;
    sheet.style.transform = dy || up ? `translateY(${dy || up}px)` : '';
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

// Date as chips: Today / Tomorrow (or Yesterday for past things) / Pick date.
// past: dates can't be in the future. both: Yesterday and Tomorrow, no limit —
// for things that are sometimes a record and sometimes a plan, like a block.
export function dateField(name, value, { none = false, past = false, both = false } = {}) {
  const t = dayKey(), other = addDays(t, past && !both ? -1 : 1);
  const presets = [...(none ? [['', 'No date']] : []), ...(both ? [[addDays(t, -1), 'Yesterday']] : []), [t, 'Today'], [other, past && !both ? 'Yesterday' : 'Tomorrow']];
  const v = value ?? (none ? '' : t);
  const custom = !presets.some(([d]) => d === v);
  return `<div class="pick date-pick">${presets.map(([d, label]) => `<label class="pk"><input type="radio" name="${name}" value="${d}" ${!custom && v === d ? 'checked' : ''}><span><em>${label}</em></span></label>`).join('')}
    <label class="pk pk-date"><input type="radio" name="${name}" value="custom" ${custom ? 'checked' : ''}><span>${icon('calendar')}<em class="pk-date-text">${custom ? shortDate(v) : 'Pick date'}</em><input type="date" class="pk-date-in" name="${name}Custom" value="${custom ? esc(v) : ''}" ${past && !both ? `max="${t}"` : ''} aria-label="Pick a date"></span></label></div>`;
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

// ---------- reading order ----------
// Every screen is a short stack of named sections, always in the same order:
// what is true *now*, what is coming *next*, the *records* behind it, then the
// longer-range *report*. Before, a tab was nine identical glass cards 12px
// apart, so where one subject ended and the next began had to be guessed from
// the numbers inside them. A section title says which of the four you are
// reading, and its note says what the numbers in it are measured against.
//
// sect() is the chapter heading (one per band); .section-label stays as the
// smaller label for a group *inside* a band (a day of meals, a weekday of
// classes), so the two levels no longer look alike.
// open: the first section of a screen, with nothing above it to divide from.
// nav:  a shorter name for the section bar, so every section on a screen fits
//       across the bar at once instead of running off the edge.
export const sect = (title, { note = '', right = '', open = false, id = '', nav = '' } = {}) =>
  `<div class="sect${open ? ' open' : ''}"${id ? ` id="${id}"` : ''}${nav ? ` data-nav="${esc(nav)}"` : ''}><div class="sect-h"><h2>${esc(title)}</h2>${right}</div>${note ? `<p class="sect-n">${note}</p>` : ''}</div>`;
// A row of sub-tabs. dock: it pins under the title bar while the page scrolls, so
// switching sub-tab never means scrolling back to the top first, and a sideways
// swipe anywhere on the page moves to the next one (see the swipe handler below).
export const seg = (key, options, current, { dock = false } = {}) => {
  const html = `<div class="seg wide" role="tablist" data-seg="${key}"><span class="seg-ind" aria-hidden="true"></span>${options.map(([k, label]) =>
    `<button role="tab" aria-selected="${current === k}" class="${current === k ? 'on' : ''}" data-act="segTab" data-key="${key}" data-tab="${k}">${label}</button>`).join('')}</div>`;
  return dock ? `<div class="dock-mark" aria-hidden="true"></div><div class="seg-dock" data-swipe="${key}">${html}</div>` : html;
};

// Where the docked switcher sits once it is pinned: just under the compact title bar.
const dockTop = () => {
  const mark = main.querySelector('.dock-mark');
  if (!mark) return null;
  const pinned = parseFloat(getComputedStyle(main.querySelector('.seg-dock')).top) || 0;
  return mark.getBoundingClientRect().top + window.scrollY - pinned;
};

export function switchTab(key, to, dir = 0) {
  if (!to || ui.tab[key] === to) return;
  // Scrolled far down a long tab: the next one opens at its top, with the
  // switcher still pinned, rather than at whatever depth the last one was read to.
  const top = dockTop();
  const deep = top != null && window.scrollY > top;
  ui.tab[key] = to;
  render({ enter: true, dir });
  if (deep) window.scrollTo(0, top);
}
actions.segTab = el => {
  const btns = [...(el.closest('.seg')?.querySelectorAll('[data-tab]') ?? [])];
  const from = btns.findIndex(b => b.classList.contains('on')), to = btns.indexOf(el);
  switchTab(el.dataset.key, el.dataset.tab, from >= 0 && to >= 0 && from !== to ? Math.sign(to - from) : 0);
};

// Swipe sideways on a page with a docked switcher to step through its sub-tabs,
// the way you page through Health on a big phone without reaching for the top.
// Anything that already uses a sideways gesture keeps it: the calendar, the
// timeline's drag handles, sliders and inputs, and anything that scrolls sideways.
const OWN_GESTURE = '[data-cal], [data-drag], [data-resize], input, textarea, select, .no-swipe';
function scrollsSideways(el) {
  for (; el && el !== main; el = el.parentElement) {
    if (el.scrollWidth > el.clientWidth + 2 && /auto|scroll/.test(getComputedStyle(el).overflowX)) return true;
  }
  return false;
}
let swipe = null;
main.addEventListener('touchstart', e => {
  swipe = null;
  const t = e.touches[0];
  if (e.touches.length !== 1 || ui.sheet || t.clientX < 24 || t.clientX > window.innerWidth - 24) return;
  const dock = main.querySelector('.seg-dock[data-swipe]');
  if (!dock || e.target.closest(OWN_GESTURE) || scrollsSideways(e.target)) return;
  swipe = { x: t.clientX, y: t.clientY, t: Date.now(), key: dock.dataset.swipe };
}, { passive: true });
main.addEventListener('touchend', e => {
  if (!swipe) return;
  const t = e.changedTouches[0], dx = t.clientX - swipe.x, dy = t.clientY - swipe.y;
  const { key, t: t0 } = swipe;
  swipe = null;
  if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 2 || Date.now() - t0 > 800) return;
  const btns = [...main.querySelectorAll(`.seg-dock[data-swipe="${key}"] [data-tab]`)];
  const i = btns.findIndex(b => b.classList.contains('on'));
  const next = btns[i + (dx < 0 ? 1 : -1)];
  if (!next) return;
  haptic();
  switchTab(key, next.dataset.tab, dx < 0 ? 1 : -1);
}, { passive: true });

// Tap a summary tile, or a name in the section bar, to go to that section.
actions.jump = el => {
  const target = document.getElementById(el.dataset.to);
  if (!target) return;
  haptic();
  if (el.dataset.i) { jumped = Number(el.dataset.i); jumpedAt = Date.now(); }
  target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  // Mark it at once, and again once the scroll has come to rest.
  markSection();
  setTimeout(markSection, 600);
};
