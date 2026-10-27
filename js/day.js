// v8 Day: a close-up of one day. Today keeps its weekly summary; this is the same
// data at arm's length — a single timeline carrying what's scheduled, what you
// logged, and where the coach has something to say about the hours in between.
import { state, addEntry, updateEntry } from './store.js';
import { esc, dayKey, addDays, dayLabel, time12, toMin, fromMin, snapMin, minNow, nowHHMM, pad, fmt, fmt1, fmtHours, money, num, clamp } from './util.js';
import { icon, tile } from './icons.js';
import { views, sheets, actions, forms, ui, render, openSheet, closeSheet, toast, haptic, header, closeBtn, chips, dateField, readDate, toggle, removeWithUndo, afterRender } from './core.js';
import { of, byId, goals, habits, habitDone, waterOn, BLOCK_KINDS, kindOf, blocks, runningBlock as running } from './data.js';
import { agendaFor, AREAS } from './plan.js';
import { workouts } from './gym.js';
import { CATEGORIES } from './money.js';
import { viewToggle } from './today.js';
import { nudgesFor } from './coach.js';

// The day you're living, not the date on the clock: before 4am you're still
// finishing the night before, and that's the day you'd want to look at.
export const loopToday = () => (new Date().getHours() < 4 ? addDays(dayKey(), -1) : dayKey());
const viewDate = () => ui.tab.dayDate ?? loopToday();

const PX_HOUR = 58, PX_QUIET = 22;
const DEFAULT_SPAN = [9 * 60, 24 * 60]; // 9am–midnight unless the day runs longer
const minOfTs = ts => { const d = new Date(ts); return d.getHours() * 60 + d.getMinutes(); };
// An end before its start means the thing runs past midnight (a 6pm–1am shift).
// The grid stops at midnight, so draw it to the end of the day rather than
// backwards into the morning.
const spanEnd = (start, end) => {
  if (!end) return start + 45;
  const m = toMin(end);
  return m > start ? m : 24 * 60;
};

// ---------- what's on the day ----------
// Blocks (things with a duration) go in the left rail, dots (things that happened
// at a moment) in the right one, so a meal never lands on top of a lecture.
function timelineFor(date) {
  const items = [], dots = [], unplaced = [], allDay = [];

  agendaFor(date).forEach(it => {
    if (!it.time) { allDay.push(it); return; }
    const start = toMin(it.time);
    items.push({
      start, end: spanEnd(start, it.end), title: it.title, sub: it.sub, color: it.area,
      icon: it.icon, sheet: it.sheet, id: it.id, drag: it.sheet === 'event' ? 'event' : null,
    });
  });

  blocks().filter(b => b.date === date).forEach(b => {
    const k = kindOf(b.kind);
    const start = toMin(b.start);
    const live = !b.end;
    const end = live ? Math.max(start + 10, minNow()) : spanEnd(start, b.end);
    const ghost = b.planned && !b.done && !live && (date < dayKey() || end <= minNow());
    items.push({
      start, end, title: b.title || k.label, sub: b.note || `${k.label} · ${shortDur(end - start)}`,
      color: k.color, icon: k.icon, sheet: 'block', id: b.id, drag: 'block', ghost, live,
      planned: b.planned && !b.done, tick: b.planned && !b.done && !live,
    });
  });

  workouts().filter(w => w.date === date).forEach(w => {
    const start = minOfTs(w.start);
    items.push({ start, end: Math.max(start + 20, minOfTs(w.end ?? w.start + 45 * 6e4)), title: w.name, sub: `${w.exercises?.length ?? 0} exercises`, color: 'move', icon: 'dumbbell', sheet: 'workoutLog', id: w.id });
  });

  const dot = (e, d) => (e.time ? dots.push({ ...d, min: toMin(e.time), id: e.id }) : unplaced.push({ ...d, id: e.id }));
  of('meal', date).forEach(m => dot(m, { title: m.name, sub: `${fmt(m.kcal)} kcal`, color: 'diet', icon: 'diet', sheet: 'meal' }));
  of('weight', date).forEach(w => dot(w, { title: `${w.kg} kg`, sub: 'Weigh-in', color: 'move', icon: 'scale', sheet: 'weight' }));
  of('txn', date).filter(x => x.kind === 'expense').forEach(x => {
    const c = CATEGORIES[x.category];
    dot(x, { title: money(Number(x.amount), false), sub: x.merchant || c?.label || 'Spent', color: c?.area ?? 'money', icon: c?.icon ?? 'receipt', sheet: 'txn' });
  });

  return { items: lanes(items.sort((a, b) => a.start - b.start || a.end - b.end)), dots: dots.sort((a, b) => a.min - b.min), unplaced, allDay };
}

// Side-by-side columns, but only for the run of blocks that actually overlap:
// a clash at 11am shouldn't narrow the evening shift to half the rail.
function lanes(items) {
  let cluster = [], ends = [], clusterEnd = -1;
  const flush = () => { cluster.forEach(c => { c.lanes = Math.max(1, ends.length); }); cluster = []; ends = []; };
  items.forEach(it => {
    if (it.start >= clusterEnd) flush();
    let i = ends.findIndex(e => e <= it.start);
    if (i < 0) i = ends.length;
    ends[i] = it.end;
    it.lane = i;
    cluster.push(it);
    clusterEnd = Math.max(clusterEnd, it.end);
  });
  flush();
  return items;
}

// "0h 50m" reads like a stopwatch; a block wants "50m".
const shortDur = m => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}` : `${Math.round(m)}m`);

// Hours with something in them get full height; the rest shrink to a thin band so
// a quiet afternoon costs a few pixels instead of a screenful of empty grid.
function scaleFor(date, items, dots) {
  let lo = DEFAULT_SPAN[0], hi = DEFAULT_SPAN[1];
  const bump = (a, b = a) => { lo = Math.min(lo, a); hi = Math.max(hi, b); };
  items.forEach(it => bump(it.start, it.end));
  dots.forEach(d => bump(d.min, d.min + 30));
  if (date === loopToday()) bump(minNow(), minNow() + 30);
  lo = Math.max(0, Math.floor(lo / 60) * 60);
  hi = Math.min(24 * 60, Math.ceil(hi / 60) * 60);

  const busy = new Set();
  const mark = (a, b) => { for (let h = Math.floor(a / 60); h <= Math.floor(Math.min(b, hi - 1) / 60); h++) busy.add(h); };
  items.forEach(it => mark(it.start, it.end));
  dots.forEach(d => mark(d.min, d.min));
  // One hour of air either side of anything, so blocks aren't drawn edge to edge.
  [...busy].forEach(h => { busy.add(h - 1); busy.add(h + 1); });

  const hours = [];
  let y = 0;
  for (let h = lo / 60; h < hi / 60; h++) {
    const height = busy.has(h) ? PX_HOUR : PX_QUIET;
    hours.push({ h, y, height, quiet: !busy.has(h) });
    y += height;
  }
  const yOf = m => {
    const c = clamp(m, lo, hi);
    const row = hours.find(x => c < (x.h + 1) * 60) ?? hours.at(-1);
    return row.y + clamp((c - row.h * 60) / 60, 0, 1) * row.height;
  };
  const minAt = py => {
    const row = hours.find(x => py < x.y + x.height) ?? hours.at(-1);
    return row.h * 60 + clamp((py - row.y) / row.height, 0, 1) * 60;
  };
  return { lo, hi, hours, total: y, yOf, minAt };
}

let lastScale = null;

// ---------- markup ----------
const hourLabel = h => `${((h + 11) % 12) + 1}${h < 12 ? 'am' : 'pm'}`;

function blockEl(it, s) {
  const top = s.yOf(it.start);
  const height = Math.max(26, s.yOf(it.end) - top);
  const w = 100 / it.lanes;
  const style = `top:${top.toFixed(1)}px;height:${height.toFixed(1)}px;left:${(it.lane * w).toFixed(2)}%;width:calc(${w.toFixed(2)}% - 4px);--c:var(--${it.color});--cb:var(--${it.color}-bg);--ci:var(--${it.color}-ink)`;
  const cls = ['tl-block', it.ghost ? 'ghost' : '', it.live ? 'live' : '', it.planned && !it.ghost ? 'planned' : ''].filter(Boolean).join(' ');
  return `<div class="${cls}" style="${style}" data-act="sheet" data-sheet="${it.sheet}" data-id="${esc(it.id ?? '')}" role="button"
    ${it.drag ? `data-drag="${it.drag}" data-id2="${esc(it.id)}" data-min="${it.start}" data-dur="${it.end - it.start}"` : ''}>
    <div class="tl-b-i">${icon(it.icon)}</div>
    <div class="tl-b-t">${esc(it.title)}</div>
    ${height > 44 ? `<div class="tl-b-s">${it.live ? `Running · ${shortDur(it.end - it.start)}` : esc(it.sub)}</div>` : ''}
    ${it.live ? `<button class="tl-stop" data-act="stopBlock" aria-label="Stop">${icon('stop')}</button>` : ''}
    ${it.tick ? `<button class="tl-tick" data-act="tickBlock" data-id="${esc(it.id)}" aria-label="Mark done">${icon('check')}</button>` : ''}</div>`;
}

function dotEl(d, s) {
  return `<div class="tl-dot" style="top:${d.y.toFixed(1)}px;--c:var(--${d.color});--cb:var(--${d.color}-bg);--ci:var(--${d.color}-ink)"
    data-act="sheet" data-sheet="${d.sheet}" data-id="${esc(d.id)}" role="button" data-drag="log" data-id2="${esc(d.id)}" data-min="${d.min}" data-dur="0">
    <span class="tl-d-i">${icon(d.icon)}</span><span class="tl-d-t">${esc(d.title)}</span></div>`;
}

function renderDay() {
  const date = viewDate();
  const today = date === loopToday();
  const { items, dots, unplaced, allDay } = timelineFor(date);
  const s = scaleFor(date, items, dots);
  lastScale = s;
  // Two things logged ten minutes apart would otherwise sit on top of each other.
  let floor = -99;
  dots.forEach(d => { d.y = Math.max(s.yOf(d.min) - 11, floor + 24); floor = d.y; });
  const nudges = today ? nudgesFor(date) : [];
  const sleep = of('sleep', date)[0];
  const g = goals();
  const water = waterOn(date);
  const note = of('note', date)[0];
  const live = running();

  const nav = `<div class="day-nav">
    <button class="icon-btn glass" data-act="dayStep" data-n="-1" aria-label="Previous day">${icon('back')}</button>
    ${today ? '' : `<button class="pill-btn" data-act="dayToday">Today</button>`}
    <button class="icon-btn glass" data-act="dayStep" data-n="1" aria-label="Next day" ${date >= dayKey() ? 'disabled' : ''}>${icon('chevron')}</button>
  </div>`;

  return `
  ${header(dayLabel(date), new Date(`${date}T12:00`).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }), nav)}
  ${viewToggle()}

  <div class="day-top">
    ${sleep ? `<span class="day-chip" style="--cb:var(--sleep-bg);--ci:var(--sleep-ink)">${icon('moon')}${fmtHours(sleep.hours)} · up ${time12(sleep.wake)}</span>` : ''}
    ${allDay.map(a => `<span class="day-chip tap" style="--cb:var(--${a.area}-bg);--ci:var(--${a.area}-ink)" data-act="sheet" data-sheet="${a.sheet}" data-id="${esc(a.id ?? '')}" role="button">${icon(a.icon)}${esc(a.title)}</span>`).join('')}
  </div>

  <section class="card glass tl-card">
    <div class="head"><div class="title">${tile('clock', 'school')}Timeline</div>
      ${live ? `<button class="pill-btn hot" data-act="stopBlock">${icon('stop')} Stop ${esc(live.title || kindOf(live.kind).label)}</button>`
        : `<button class="pill-btn" data-act="sheet" data-sheet="block" data-start="now">${icon('play')} Start</button>`}</div>
    ${items.length || dots.length ? `
    <div class="tl" style="height:${s.total}px">
      ${s.hours.map(h => `<div class="tl-h ${h.quiet ? 'quiet' : ''}" style="top:${h.y}px;height:${h.height}px"><span>${h.quiet ? '' : hourLabel(h.h)}</span></div>`).join('')}
      ${nudges.filter(n => toMin(n.at) >= s.lo && toMin(n.at) <= s.hi).map(n =>
        `<button class="tl-pin" style="top:${(s.yOf(toMin(n.at)) - 9).toFixed(1)}px" data-act="sheet" data-sheet="nudge" data-at="${n.at}" aria-label="Coach note at ${time12(n.at)}">${icon('sparkle')}</button>`).join('')}
      <div class="tl-rail">${items.map(it => blockEl(it, s)).join('')}</div>
      <div class="tl-side">${dots.map(d => dotEl(d, s)).join('')}</div>
      ${today ? `<div class="tl-now" style="top:${s.yOf(minNow()).toFixed(1)}px"><span>${time12(nowHHMM()).replace(' ', '')}</span></div>` : ''}
    </div>` : `<div class="empty">Nothing on this day yet. Tap <b>Start</b>, or tell Ask what you're doing.</div>`}
    <div class="tl-feet">
      <span class="day-chip" style="--cb:var(--work-bg);--ci:var(--work-ink)">${icon('drop')}${water} / ${g.water} glasses</span>
      ${habits().map(h => `<span class="day-chip ${habitDone(h.id, date) ? 'on' : 'off'}" style="--cb:var(--diet-bg);--ci:var(--diet-ink)">${icon(habitDone(h.id, date) ? 'check' : h.icon)}${esc(h.name)}</span>`).join('')}
    </div>
  </section>

  ${unplaced.length ? `<div class="section-label">No time yet <span>${unplaced.length}</span></div>
  <section class="card glass"><div class="list">${unplaced.map(u => `<div class="row">
    ${tile(u.icon, u.color)}<div class="grow tap" data-act="sheet" data-sheet="${u.sheet}" data-id="${esc(u.id)}" role="button"><div class="t">${esc(u.title)}</div><div class="d">${esc(u.sub)}</div></div>
    <button class="pill-btn" data-act="sheet" data-sheet="placeTime" data-id="${esc(u.id)}">Place</button></div>`).join('')}</div>
  <p class="note">Logged for this day without a clock time — imported, or added after the fact.</p></section>` : ''}

  ${nudges.length ? `<div class="section-label">Coach</div>
  <section class="card glass"><div class="list">${nudges.map(n => `<div class="row">
    ${tile(n.ai ? 'sparkle' : 'bell', 'sleep')}<div class="grow"><div class="t">${time12(n.at)}</div><div class="d">${n.html}</div></div></div>`).join('')}</div></section>` : ''}

  <div class="section-label">How the day went</div>
  <section class="card glass tap" data-act="sheet" data-sheet="dayNote" data-date="${date}" role="button">
    ${note?.text ? `<p class="day-note">${esc(note.text)}</p>` : `<div class="empty">Add a line about the day. The coach reads it at the evening review.</div>`}
  </section>`;
}
views.day = renderDay;

// ---------- actions ----------
Object.assign(actions, {
  dayStep(el) {
    const next = addDays(viewDate(), Number(el.dataset.n));
    if (next > dayKey()) return;
    ui.tab.dayDate = next;
    render({ enter: true });
  },
  dayToday() { ui.tab.dayDate = loopToday(); render({ enter: true }); },
  async stopBlock() {
    const b = running();
    if (!b) return;
    const end = nowHHMM();
    await updateEntry(b.id, { end: toMin(end) > toMin(b.start) ? end : b.start, done: true });
    haptic();
    toast(`${b.title || kindOf(b.kind).label} stopped`, { icon: 'check' });
    render();
  },
  async tickBlock(el) {
    await updateEntry(el.dataset.id, { done: true });
    haptic();
    render();
  },
});

// ---------- sheets ----------
const field = (label, inner) => `<div class="field"><label>${label}</label>${inner}</div>`;

sheets.block = ({ id, start }) => {
  const b = id && byId(id);
  const now = start === 'now' && !b;
  const k = b?.kind ?? 'study';
  return `<h2>${b ? 'Edit block' : now ? 'Start a block' : 'Add a block'} ${closeBtn}</h2>
  <form data-form="block" class="nice-form">
    <input type="hidden" name="id" value="${b ? b.id : ''}">
    <input type="hidden" name="live" value="${now ? '1' : ''}">
    ${field('What are you doing?', chips('kind', Object.entries(BLOCK_KINDS).map(([v, x]) => [v, x.label, x.icon, x.color]), k, { cols: 4 }))}
    <div class="field"><label>Name <span class="opt">optional</span></label><input class="input-x" name="title" maxlength="60" placeholder="e.g. COMP2123 past papers" value="${esc(b?.title ?? '')}"></div>
    ${now ? `<p class="note">Starts now and runs until you stop it.</p>`
      : `<div class="row2 times">${field('Starts', `<input class="input-x" type="time" name="start" value="${esc(b?.start ?? nowHHMM())}" required>`)}${field('Ends', `<input class="input-x" type="time" name="end" value="${esc(b?.end ?? fromMin(toMin(b?.start ?? nowHHMM()) + 60))}">`)}</div>
      ${field('Day', dateField('date', b?.date ?? viewDate(), { past: true }))}
      ${toggle('planned', 'Planning it, not done yet', b ? !!b.planned && !b.done : false)}`}
    <div class="field"><label>Note <span class="opt">optional</span></label><input class="input-x" name="note" maxlength="120" value="${esc(b?.note ?? '')}"></div>
    <div class="btn-row"><button class="btn">${b ? 'Save changes' : now ? 'Start' : 'Save block'}</button>${b ? `<button type="button" class="btn danger" data-act="delBlock" data-id="${b.id}">Delete</button>` : ''}</div>
  </form>`;
};

forms.block = async (f) => {
  const id = f.get('id');
  const live = f.get('live') === '1';
  const kind = f.get('kind') || 'study';
  const title = f.get('title').trim();
  const note = f.get('note').trim();
  if (live) {
    const open = running();
    if (open) await updateEntry(open.id, { end: nowHHMM(), done: true });
    await addEntry('block', { kind, title, note, start: nowHHMM(), end: null, planned: false, done: false, source: 'manual' }, dayKey());
    ui.tab.dayDate = loopToday();
    haptic();
    closeSheet();
    toast(`${title || kindOf(kind).label} started`, { icon: 'play' });
    return render();
  }
  const start = f.get('start');
  const end = f.get('end') || null;
  if (!start) return;
  const planned = !!f.get('planned');
  const fields = { kind, title, note, start, end: end && toMin(end) > toMin(start) ? end : fromMin(toMin(start) + 60), planned, done: !planned };
  const date = readDate(f, 'date') || viewDate();
  if (id) await updateEntry(id, { ...fields, date });
  else await addEntry('block', { ...fields, source: 'manual' }, date);
  haptic();
  closeSheet();
  render();
};
actions.delBlock = async el => { closeSheet(); await removeWithUndo(el.dataset.id, 'Block deleted'); };

sheets.placeTime = ({ id }) => {
  const e = byId(id);
  return `<h2>Place on the timeline ${closeBtn}</h2>
  <form data-form="placeTime" class="nice-form">
    <input type="hidden" name="id" value="${esc(id)}">
    ${field('What time did this happen?', `<input class="input-x" type="time" name="time" value="${esc(e?.time ?? nowHHMM())}" required>`)}
    <div class="btn-row"><button class="btn">Place it</button></div>
  </form>`;
};
forms.placeTime = async (f) => {
  await updateEntry(f.get('id'), { time: f.get('time') });
  haptic();
  closeSheet();
  render();
};

sheets.dayNote = ({ date }) => {
  const n = of('note', date)[0];
  return `<h2>How the day went ${closeBtn}</h2>
  <form data-form="dayNote" class="nice-form">
    <input type="hidden" name="date" value="${esc(date)}">
    <input type="hidden" name="id" value="${n ? n.id : ''}">
    <div class="field"><label>One line is plenty</label><textarea class="input-x" name="text" rows="3" maxlength="300" placeholder="Felt flat after the shift, still got the tutorial done.">${esc(n?.text ?? '')}</textarea></div>
    <div class="btn-row"><button class="btn">Save</button></div>
  </form>`;
};
forms.dayNote = async (f) => {
  const id = f.get('id'), text = f.get('text').trim(), date = f.get('date');
  if (id) await updateEntry(id, { text });
  else if (text) await addEntry('note', { text }, date);
  haptic();
  closeSheet();
  render();
};

sheets.nudge = ({ at }) => {
  const n = nudgesFor(viewDate()).find(x => x.at === at);
  return `<h2>${time12(at)} ${closeBtn}</h2>
  <section class="card glass brief">${tile(n?.ai ? 'sparkle' : 'bell', 'sleep')}<div class="grow"><p>${n?.html ?? 'Nothing to flag at this point of the day.'}</p></div></section>`;
};

// ---------- dragging a block or a dot to another time ----------
// A tap opens the item's sheet, so moving one is a deliberate hold first. Once the
// hold lands we take the gesture over from the page's own scrolling.
let drag = null;
const HOLD_MS = 240;

function startDrag(el, clientY) {
  if (!lastScale) return;
  drag = {
    el, clientY, held: false, dtype: el.dataset.drag, id: el.dataset.id2,
    min: Number(el.dataset.min), dur: Number(el.dataset.dur),
    top0: parseFloat(el.style.top) || 0,
    timer: setTimeout(() => {
      if (!drag) return;
      drag.held = true;
      drag.el.classList.add('dragging');
      haptic();
    }, HOLD_MS),
  };
}

function moveDrag(clientY, e) {
  if (!drag) return;
  const dy = clientY - drag.clientY;
  if (!drag.held) {
    if (Math.abs(dy) > 8) { clearTimeout(drag.timer); drag = null; }
    return;
  }
  e.cancelable && e.preventDefault();
  const top = Math.max(0, Math.min(lastScale.total, drag.top0 + dy));
  drag.el.style.top = `${top}px`;
  drag.at = snapMin(lastScale.minAt(top + (drag.dtype === 'log' ? 11 : 0)));
  drag.el.dataset.at = time12(fromMin(drag.at));
}

async function endDrag() {
  if (!drag) return;
  clearTimeout(drag.timer);
  const { held, el, id, dtype, dur, at, min } = drag;
  drag = null;
  el.classList.remove('dragging');
  if (!held) return;
  // The browser still sends a click after the drop, and by then the element has
  // been redrawn — so the click is swallowed by time, not by what it landed on.
  droppedAt = Date.now();
  if (at == null || at === min) { render(); return; }
  const start = fromMin(at);
  if (dtype === 'log') await updateEntry(id, { time: start });
  else {
    const e = byId(id);
    await updateEntry(id, { start, end: e?.end ? fromMin(at + dur) : null });
  }
  haptic();
  toast(`Moved to ${time12(start)}`, { icon: 'clock' });
  render();
}

document.addEventListener('touchstart', e => {
  const el = e.target.closest?.('[data-drag]');
  if (el && !drag) startDrag(el, e.touches[0].clientY);
}, { passive: true });
document.addEventListener('touchmove', e => moveDrag(e.touches[0].clientY, e), { passive: false });
document.addEventListener('touchend', endDrag);
document.addEventListener('touchcancel', endDrag);
// Mouse, for working on the thing at a desk.
document.addEventListener('mousedown', e => {
  const el = e.target.closest?.('[data-drag]');
  if (el && !drag && e.button === 0) startDrag(el, e.clientY);
});
document.addEventListener('mousemove', e => { if (drag) moveDrag(e.clientY, e); });
document.addEventListener('mouseup', endDrag);
// A hold that turned into a move must not also open the item's sheet.
let droppedAt = 0;
document.addEventListener('click', e => {
  if (Date.now() - droppedAt < 400) { droppedAt = 0; e.stopPropagation(); e.preventDefault(); }
}, true);

// The now line and any running block drift out of date on their own, so the day
// view re-draws itself once a minute while it's the thing on screen.
let tick = null;
afterRender.push(route => {
  const on = route === 'today' && ui.tab.todayView === 'timeline';
  if (on && !tick) tick = setInterval(() => { if (!ui.sheet && !drag && ui.tab.todayView === 'timeline') render(); }, 60000);
  if (!on && tick) { clearInterval(tick); tick = null; }
});
