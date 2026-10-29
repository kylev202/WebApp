// v4 Plan: agenda, uni (courses, timetable, assessments, GPA), work (shifts, freelance), tasks.
import { state, addEntry, updateEntry, removeEntry, setKV } from './store.js';
import { esc, uid, pad, dayKey, addDays, addMonths, toDate, weekStart, monthKey, monthDays, monthName, dayLabel, shortDate, longDate, initial, time12, toMin, nowHHMM, fmt, fmt1, money, num, plural, daysBetween } from './util.js';
import { icon, tile } from './icons.js';
import { screens, sheets, actions, forms, previews, ui, render, openSheet, closeSheet, toast, haptic, closeBtn, header, seg, removeWithUndo, chips, dateField, readDate, toggle, afterRender } from './core.js';
import { of, byId } from './data.js';
import { lineChart } from './charts.js';
import { todaySections } from './today.js';
import { slideIn } from './fx.js';

export const AREAS = {
  uni: { label: 'Uni', color: 'school', icon: 'school' },
  work: { label: 'Work', color: 'work', icon: 'briefcase' },
  gym: { label: 'Gym', color: 'move', icon: 'dumbbell' },
  health: { label: 'Health', color: 'diet', icon: 'heart' },
  money: { label: 'Money', color: 'money', icon: 'wallet' },
  life: { label: 'Life', color: 'sleep', icon: 'star' },
};
const COLORS = ['school', 'work', 'diet', 'sleep', 'move', 'money'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const CLASS_KINDS = ['Lecture', 'Tutorial', 'Lab', 'Workshop', 'Seminar'];
export const ASSESS_KINDS = { assignment: 'Assignment', exam: 'Exam', quiz: 'Quiz', presentation: 'Presentation', report: 'Report' };

// Monday = 0.
const dow = key => (toDate(key).getDay() + 6) % 7;

// ---------- data ----------
export const courses = () => of('course').sort((a, b) => a.code.localeCompare(b.code));
export const courseById = id => byId(id) ?? { code: '???', name: 'Unknown course', color: 'school' };
export const classes = () => of('class');
export const assessments = () => of('assessment').sort((a, b) => a.due.localeCompare(b.due));
export const shifts = () => of('shift').sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
export const clients = () => of('client');
export const projects = () => of('project');
export const invoices = () => of('invoice');
export const tasks = () => of('task');
export const events = () => of('event');
// Part-time jobs, each with its own pay rates. Older versions kept a single job in kv.job; it becomes the first one.
// Shifts point at a job with jobId; shifts without one belong to the first job.
export const JOB_ICONS = [['coffee', 'Café'], ['dining', 'Restaurant'], ['cart', 'Supermarket'], ['bag', 'Retail'], ['briefcase', 'Office'], ['book', 'Tutoring'], ['dumbbell', 'Gym'], ['laptop', 'Tech']];
const JOB_COLORS = ['work', 'money', 'sleep', 'school', 'diet', 'move'];
export const jobs = () => (state.kv.jobs?.length ? state.kv.jobs : [{ id: 'main', name: 'Café', rate: 30, sat: 36, sun: 42, icon: 'coffee', color: 'work', ...state.kv.job }]);
export const jobOf = s => jobs().find(j => j.id === s?.jobId) ?? jobs()[0];
const jobShifts = (j, list) => list.filter(s => jobOf(s).id === j.id);

export function shiftHours(s) {
  let m = toMin(s.end) - toMin(s.start);
  if (m <= 0) m += 1440;
  return Math.max(0, (m - (Number(s.breakMin) || 0)) / 60);
}
export function shiftRate(s) {
  if (Number(s.rate) > 0) return Number(s.rate);
  const j = jobOf(s), d = dow(s.date);
  return d === 5 ? j.sat : d === 6 ? j.sun : j.rate;
}
export const shiftPay = s => shiftHours(s) * shiftRate(s);
export const weekShifts = (w0 = weekStart()) => shifts().filter(s => s.date >= w0 && s.date <= addDays(w0, 6));

export const invoiceStatus = inv => (inv.status === 'paid' ? 'paid' : inv.status === 'sent' && inv.due < dayKey() ? 'overdue' : inv.status);

// Australian grade bands and GPA scales.
export const BANDS = [['HD', 85], ['D', 75], ['C', 65], ['P', 50], ['F', 0]];
export const band = mark => BANDS.find(([, min]) => mark >= min)[0];
const GPA_POINTS = { 7: { HD: 7, D: 6, C: 5, P: 4, F: 0 }, 4: { HD: 4, D: 3, C: 2, P: 1, F: 0 } };
export const gpaScale = () => Number(state.kv.gpaScale ?? 7);

export function courseResult(courseId) {
  const list = assessments().filter(a => a.courseId === courseId);
  const marked = list.filter(a => a.score != null && a.score !== '');
  // Round summed weights to kill float drift (e.g. 38.800000000000004).
  const round2 = n => Math.round(n * 100) / 100;
  const weightDone = round2(marked.reduce((t, a) => t + Number(a.weight || 0), 0));
  const earned = marked.reduce((t, a) => t + (Number(a.weight || 0) * Number(a.score)) / 100, 0);
  const totalWeight = round2(list.reduce((t, a) => t + Number(a.weight || 0), 0));
  return { list, weightDone, earned, totalWeight, average: weightDone ? (earned / weightDone) * 100 : null, remaining: Math.max(0, 100 - weightDone) };
}

export function uniSummary() {
  const rows = courses().map(c => ({ c, r: courseResult(c.id) })).filter(x => x.r.average != null);
  const credits = rows.reduce((t, x) => t + Number(x.c.credits || 6), 0);
  if (!credits) return null;
  const wam = rows.reduce((t, x) => t + x.r.average * Number(x.c.credits || 6), 0) / credits;
  const pts = GPA_POINTS[gpaScale()];
  const gpa = rows.reduce((t, x) => t + pts[band(x.r.average)] * Number(x.c.credits || 6), 0) / credits;
  return { wam, gpa, credits, count: rows.length };
}

// Everything happening on a day, for the agenda and Today's Up Next.
export const agendaSources = []; // later: Google Calendar events
export function agendaFor(date) {
  const items = [];
  const d = dow(date);
  classes().filter(c => Number(c.day) === d).forEach(c => {
    const course = courseById(c.courseId);
    items.push({ time: c.start, end: c.end, title: `${course.code} ${c.kind}`, sub: [course.name, c.room].filter(Boolean).join(' · '), area: course.color ?? 'school', icon: 'school', tag: 'Uni', sheet: 'cls', id: c.id });
  });
  events().filter(e => e.date === date).forEach(e => {
    const a = AREAS[e.area] ?? AREAS.life;
    items.push({ time: e.start || null, end: e.end, title: e.title, sub: e.note ?? '', area: a.color, icon: a.icon, tag: a.label, sheet: 'event', id: e.id });
  });
  shifts().filter(s => s.date === date).forEach(s => {
    const j = jobOf(s);
    items.push({ time: s.start, end: s.end, title: `${j.name} shift`, sub: `${fmt1(shiftHours(s))} h · ≈ ${money(shiftPay(s), false)}`, area: j.color, icon: j.icon, tag: 'Work', sheet: 'shift', id: s.id });
  });
  assessments().filter(a => a.due === date && !a.done).forEach(a => {
    const course = courseById(a.courseId);
    items.push({ time: a.dueTime || null, title: `Due: ${a.title}`, sub: `${course.code}${a.weight ? ` · ${a.weight}%` : ''}`, area: 'school', icon: a.kind === 'exam' ? 'exam' : 'pen', tag: ASSESS_KINDS[a.kind] ?? 'Due', sheet: 'assessment', id: a.id, due: true });
  });
  projects().filter(p => p.deadline === date && p.status !== 'done').forEach(p => {
    items.push({ time: null, title: `Deadline: ${p.title}`, sub: clientName(p.clientId), area: 'work', icon: 'laptop', tag: 'Client', sheet: 'project', id: p.id, due: true });
  });
  invoices().filter(i => i.due === date && i.status !== 'paid').forEach(i => {
    items.push({ time: null, title: `Invoice due: ${money(i.amount, false)}`, sub: clientName(projectClient(i.projectId)), area: 'money', icon: 'receipt', tag: 'Invoice', sheet: 'invoice', id: i.id, due: true });
  });
  agendaSources.forEach(src => items.push(...src(date)));
  return items.sort((a, b) => (a.time ?? '00:00').localeCompare(b.time ?? '00:00') || (a.due ? -1 : 1));
}

const clientName = id => byId(id)?.name ?? '';
const projectClient = id => byId(id)?.clientId;

// ---------- markup ----------
function agendaRow(it) {
  return `<div class="row tap" data-act="sheet" data-sheet="${it.sheet}" data-id="${it.id ?? ''}" role="button">
    <div class="time">${it.time ? time12(it.time) : it.allDay ? 'All day' : 'Due'}</div><div class="bar" style="background:var(--${it.area})"></div>
    <div class="grow"><div class="t">${esc(it.title)}</div>${it.sub ? `<div class="d">${esc(it.sub)}${it.end && it.time ? ` · until ${time12(it.end)}` : ''}</div>` : ''}</div>
    <span class="tag" style="background:var(--${it.area}-bg);color:var(--${it.area}-ink)">${esc(it.tag)}</span></div>`;
}

function taskRow(t) {
  const a = AREAS[t.area] ?? AREAS.life;
  const overdue = t.due && t.due < dayKey() && !t.done;
  return `<div class="row ${t.done ? 'done' : ''}">
    <button class="check ${t.done ? 'on' : ''}" data-act="toggleTask" data-id="${t.id}" aria-label="${t.done ? 'Mark not done' : 'Mark done'}">${icon('check')}</button>
    <div class="grow tap" data-act="sheet" data-sheet="task" data-id="${t.id}" role="button"><div class="t">${esc(t.title)}</div><div class="d">${a.label}${t.due ? ` · <span class="${overdue ? 'late' : ''}">${overdue ? 'Overdue · ' : ''}${dayLabel(t.due)}</span>` : ''}</div></div>
    <span class="dot" style="background:var(--${a.color})"></span></div>`;
}

// Tabs other modules add to Plan, between Uni and Work (study.js adds the exam
// countdown and its planner).
export const planTabs = []; // { key, label, render }

function renderPlan() {
  const tab = ui.tab.plan ?? 'agenda';
  const extra = planTabs.find(t => t.key === tab);
  const body = extra ? extra.render() : ({ agenda: planAgenda, uni: planUni, work: planWork, tasks: planTasks }[tab] ?? planAgenda)();
  const tabs = [['agenda', 'Agenda'], ['uni', 'Uni'], ...planTabs.map(t => [t.key, t.label]), ['work', 'Work'], ['tasks', 'Tasks']];
  return `${header('Plan', longDate(), `<button class="icon-btn glass" data-act="sheet" data-sheet="planAdd" aria-label="Add">${icon('plus')}</button>`)}
    ${seg('plan', tabs, tab)}${body}`;
}
screens.plan = renderPlan;

// The agenda calendar: a week strip you can expand into a month grid. The choice sticks.
const monthView = () => !!state.kv.planMonthView;

// Week view: the Monday-based week around the selected day. Month view: whole
// weeks covering the selected month, so the grid is 4-6 rows with no gaps.
function calDays(sel) {
  if (!monthView()) return Array.from({ length: 7 }, (_, i) => addDays(weekStart(sel), i));
  const month = monthKey(sel), start = weekStart(`${month}-01`);
  const rows = Math.ceil((daysBetween(start, `${month}-${pad(monthDays(month))}`) + 1) / 7);
  return Array.from({ length: rows * 7 }, (_, i) => addDays(start, i));
}

function calCell(d, sel, month) {
  const its = agendaFor(d);
  const areas = [...new Set(its.map(i => i.area))].slice(0, 3);
  const cls = ['day', d === sel && 'on', d === dayKey() && 'today', month && monthKey(d) !== month && 'off'].filter(Boolean).join(' ');
  return `<button class="${cls}" data-act="planDay" data-d="${d}" aria-pressed="${d === sel}" aria-label="${dayLabel(d)}${its.length ? `, ${plural(its.length, 'item')}` : ''}">
    ${month ? '' : `<span>${initial(d)}</span>`}<b>${toDate(d).getDate()}</b>
    <i>${areas.map(a => `<em style="background:var(--${a})"></em>`).join('')}</i></button>`;
}

function planCalendar(sel) {
  const open = monthView(), month = open ? monthKey(sel) : null;
  const step = open ? 'month' : 'week';
  return `
  <section class="card glass cal ${open ? 'month' : ''}" data-cal>
    <div class="cal-top">
      <button class="cal-title" data-act="planExpand" aria-expanded="${open}" aria-label="${open ? 'Show one week' : 'Show the whole month'}">
        <b>${monthName(sel)}</b><span>${toDate(sel).getFullYear()}</span>${icon('chevron')}</button>
      <div class="cal-nav">
        ${sel === dayKey() ? '' : `<button class="cal-today" data-act="planToday">Today</button>`}
        <button class="x-btn" data-act="planStep" data-d="-1" aria-label="Previous ${step}">${icon('back')}</button>
        <button class="x-btn" data-act="planStep" data-d="1" aria-label="Next ${step}">${icon('chevron')}</button>
        <label class="x-btn cal-jump">${icon('calendar')}<input type="date" class="cal-jump-in" value="${sel}" aria-label="Jump to a date"></label>
      </div>
    </div>
    ${open ? `<div class="cal-dow">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => `<span>${d}</span>`).join('')}</div>` : ''}
    <div class="cal-grid">${calDays(sel).map(d => calCell(d, sel, month)).join('')}</div>
  </section>`;
}

function planAgenda() {
  const sel = ui.planDay ?? dayKey();
  const items = agendaFor(sel);
  return `${planCalendar(sel)}
  <div class="section-label">${dayLabel(sel)} <span>${toDate(sel).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
  <section class="card glass">${items.length ? `<div class="list">${items.map(agendaRow).join('')}</div>` : `<div class="empty">Nothing planned. Enjoy the free time.</div>`}</section>
  <div class="row2"><button class="btn soft" data-act="sheet" data-sheet="event" data-date="${sel}">${icon('calendar')} Event</button><button class="btn soft" data-act="sheet" data-sheet="task" data-date="${sel}">${icon('list')} Task</button></div>`;
}

function planUni() {
  const sum = uniSummary();
  const upcoming = assessments().filter(a => !a.done && a.due >= dayKey()).slice(0, 6);
  const cs = courses();
  const byDay = DAYS.map((name, i) => ({ name, list: classes().filter(c => Number(c.day) === i).sort((a, b) => a.start.localeCompare(b.start)) })).filter(d => d.list.length);
  return `
  <section class="card glass">
    <div class="head"><div class="title">${tile('school', 'school')}Results</div><button class="sub-note" data-act="toggleScale">${gpaScale()}-point GPA ${icon('repeat')}</button></div>
    ${sum ? `<div class="calc-result"><div><span>GPA</span><b>${sum.gpa.toFixed(2)}</b></div><div><span>WAM</span><b>${fmt1(sum.wam)}</b></div><div><span>Graded</span><b>${plural(sum.count, 'course')}</b></div></div>`
      : '<p class="note" style="margin:0">Add courses and enter assessment marks to see your GPA and WAM.</p>'}
    <button class="btn soft" style="margin-top:12px" data-act="${state.kv.canvas?.token ? 'canvasSync' : 'sheet'}" data-sheet="guideCanvas">${icon('repeat')} ${state.kv.canvas?.token ? 'Sync from Canvas' : 'Connect Canvas'}</button>
  </section>
  <div class="section-label">Upcoming assessments <a data-act="sheet" data-sheet="assessment">Add</a></div>
  <section class="card glass">${upcoming.length ? `<div class="list">${upcoming.map(a => {
    const c = courseById(a.courseId), days = daysBetween(dayKey(), a.due);
    return `<div class="row tap" data-act="sheet" data-sheet="assessment" data-id="${a.id}" role="button">${tile(a.kind === 'exam' ? 'exam' : 'pen', c.color ?? 'school')}
      <div class="grow"><div class="t">${esc(a.title)}</div><div class="d">${esc(c.code)}${a.weight ? ` · ${a.weight}%` : ''}</div></div>
      <span class="tag ${days <= 2 ? 'hot' : ''}">${days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days`}</span></div>`;
  }).join('')}</div>` : '<div class="empty">No assessments due. Add them so Loop can plan your study.</div>'}
    <button class="btn soft" style="margin-top:12px" data-act="toStudy">${icon('clock')} Countdown and study plan</button></section>
  <div class="section-label">Courses <a data-act="sheet" data-sheet="course">Add</a></div>
  <section class="card glass">${cs.length ? `<div class="list">${cs.map(c => {
    const r = courseResult(c.id);
    return `<div class="row tap" data-act="sheet" data-sheet="courseDetail" data-id="${c.id}" role="button">${tile('book', c.color ?? 'school')}
      <div class="grow"><div class="t">${esc(c.code)} · ${esc(c.name)}</div><div class="d">${c.credits || 6} credit points · ${r.weightDone}% marked</div></div>
      ${r.average != null ? `<span class="tag" style="background:var(--${c.color}-bg);color:var(--${c.color}-ink)">${band(r.average)} ${fmt(r.average)}</span>` : '<span class="chev">' + icon('chevron') + '</span>'}</div>`;
  }).join('')}</div>` : '<div class="empty">No courses yet. Add your units for this semester.</div>'}</section>
  <div class="section-label">Timetable <a data-act="sheet" data-sheet="cls">Add class</a></div>
  <section class="card glass">${byDay.length ? byDay.map(d => `<div class="tt-day"><div class="label-sm">${d.name}</div><div class="list">${d.list.map(c => {
    const course = courseById(c.courseId);
    return `<div class="row tap" data-act="sheet" data-sheet="cls" data-id="${c.id}" role="button"><div class="time">${time12(c.start)}</div><div class="bar" style="background:var(--${course.color ?? 'school'})"></div><div class="grow"><div class="t">${esc(course.code)} ${esc(c.kind)}</div><div class="d">${time12(c.start)}–${time12(c.end)}${c.room ? ` · ${esc(c.room)}` : ''}</div></div></div>`;
  }).join('')}</div></div>`).join('') : '<div class="empty">Add your weekly classes and they appear in your agenda automatically.</div>'}</section>`;
}

function planWork() {
  const js = jobs(), many = js.length > 1;
  const thisWeek = weekShifts();
  const hours = thisWeek.reduce((t, s) => t + shiftHours(s), 0);
  const pay = thisWeek.reduce((t, s) => t + shiftPay(s), 0);
  const upcoming = shifts().filter(s => s.date >= dayKey()).slice(0, 8);
  const weeks = Array.from({ length: 8 }, (_, i) => addDays(weekStart(), (i - 7) * 7));
  const payOf = list => list.reduce((t, s) => t + shiftPay(s), 0);
  const weeklyPay = js.map(j => weeks.map(w => payOf(jobShifts(j, weekShifts(w)))));
  const ps = projects().sort((a, b) => (a.status === 'done') - (b.status === 'done') || (a.deadline ?? '9').localeCompare(b.deadline ?? '9'));
  const unpaid = invoices().filter(i => i.status !== 'paid');
  const overdue = unpaid.filter(i => invoiceStatus(i) === 'overdue');
  return `
  <section class="card glass">
    <div class="head"><div class="title">${tile(many ? 'briefcase' : js[0].icon, 'work')}${many ? 'Part-time jobs' : esc(js[0].name)}</div><button class="sub-note" data-act="sheet" data-sheet="jobs">${many ? plural(js.length, 'job') : 'Jobs &amp; pay'} ${icon('chevron')}</button></div>
    <div class="calc-result"><div><span>This week</span><b>${fmt1(hours)} h</b></div><div><span>Expected pay</span><b>${money(pay, false)}</b></div><div><span>Shifts</span><b>${thisWeek.length}</b></div></div>
    ${many ? `<div class="list job-split">${js.map(j => {
      const mine = jobShifts(j, thisWeek);
      return `<div class="row tap" data-act="sheet" data-sheet="job" data-id="${esc(j.id)}" role="button">${tile(j.icon, j.color)}<div class="grow"><div class="t">${esc(j.name)}</div><div class="d">${mine.length ? `${plural(mine.length, 'shift')} · ${fmt1(mine.reduce((t, s) => t + shiftHours(s), 0))} h this week` : 'No shifts this week'}</div></div><div class="amt">${money(payOf(mine), false)}</div></div>`;
    }).join('')}</div>` : ''}
    ${weeklyPay.flat().some(Boolean) ? payChart(weeks, weeklyPay, js) : ''}
    <div class="row2"><button class="btn soft" data-act="sheet" data-sheet="shift">${icon('plus')} Shift</button><button class="btn soft" data-act="addPay" ${pay ? '' : 'disabled'}>${icon('coins')} Add pay to Money</button></div>
  </section>
  ${upcoming.length ? `<div class="section-label">Upcoming shifts</div><section class="card glass"><div class="list">${upcoming.map(s => {
    const j = jobOf(s);
    return `<div class="row tap" data-act="sheet" data-sheet="shift" data-id="${s.id}" role="button">
    <div class="time">${dayLabel(s.date).replace('Tomorrow', 'Tmrw')}</div><div class="bar" style="background:var(--${j.color})"></div><div class="grow"><div class="t">${time12(s.start)}–${time12(s.end)}</div><div class="d">${many ? `${esc(j.name)} · ` : ''}${fmt1(shiftHours(s))} h · ${money(shiftRate(s), false)}/h</div></div><div class="amt">${money(shiftPay(s), false)}</div></div>`;
  }).join('')}</div></section>` : ''}

  <section class="card glass">
    <div class="head"><div class="title">${tile('laptop', 'work')}Freelance web</div><button class="sub-note" data-act="sheet" data-sheet="client">${plural(clients().length, 'client')} ${icon('chevron')}</button></div>
    <div class="calc-result"><div><span>Active projects</span><b>${ps.filter(p => p.status === 'active').length}</b></div><div><span>Unpaid</span><b>${money(unpaid.reduce((t, i) => t + Number(i.amount), 0), false)}</b></div><div><span>Overdue</span><b ${overdue.length ? 'class="late"' : ''}>${overdue.length}</b></div></div>
    <div class="row2"><button class="btn soft" data-act="sheet" data-sheet="project">${icon('plus')} Project</button><button class="btn soft" data-act="sheet" data-sheet="invoice">${icon('receipt')} Invoice</button></div>
  </section>
  ${ps.length ? `<div class="section-label">Projects</div><section class="card glass"><div class="list">${ps.map(p => `<div class="row tap ${p.status === 'done' ? 'done' : ''}" data-act="sheet" data-sheet="project" data-id="${p.id}" role="button">${tile('code', p.status === 'done' ? 'diet' : 'work')}
    <div class="grow"><div class="t">${esc(p.title)}</div><div class="d">${esc(clientName(p.clientId)) || 'No client'}${p.deadline ? ` · due ${dayLabel(p.deadline)}` : ''}</div></div><div class="amt">${p.fee ? money(p.fee, false) : ''}</div></div>`).join('')}</div></section>` : ''}
  ${invoices().length ? `<div class="section-label">Invoices</div><section class="card glass"><div class="list">${invoices().sort((a, b) => (a.status === 'paid') - (b.status === 'paid') || a.due.localeCompare(b.due)).slice(0, 12).map(i => {
    const st = invoiceStatus(i);
    return `<div class="row tap" data-act="sheet" data-sheet="invoice" data-id="${i.id}" role="button">${tile('receipt', st === 'paid' ? 'diet' : st === 'overdue' ? 'move' : 'money')}
    <div class="grow"><div class="t">${esc(i.number || 'Invoice')} · ${esc(clientName(projectClient(i.projectId)) || byId(i.projectId)?.title || '')}</div><div class="d">${st === 'paid' ? `Paid ${i.paidDate ? dayLabel(i.paidDate) : ''}` : `Due ${dayLabel(i.due)}`}</div></div>
    <span class="tag st-${st}">${st}</span><div class="amt">${money(i.amount, false)}</div></div>`;
  }).join('')}</div></section>` : ''}`;
}

// One line per job.
function payChart(weeks, perJob, js) {
  return lineChart({ series: perJob.map((values, i) => ({ values: values.map(v => v || null), color: `var(--${js[i].color})` })), labels: weeks.map((w, i) => (i === 7 ? 'Now' : i % 2 === 1 ? shortDate(w) : '')), live: true });
}

function planTasks() {
  const t = dayKey();
  const all = tasks();
  const open = all.filter(x => !x.done);
  const groups = [
    ['Overdue', open.filter(x => x.due && x.due < t)],
    ['Today', open.filter(x => x.due === t)],
    ['Tomorrow', open.filter(x => x.due === addDays(t, 1))],
    ['This week', open.filter(x => x.due > addDays(t, 1) && x.due <= addDays(t, 7))],
    ['Later', open.filter(x => x.due > addDays(t, 7))],
    ['No date', open.filter(x => !x.due)],
  ].filter(([, list]) => list.length);
  const done = all.filter(x => x.done).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0)).slice(0, 8);
  return `
  <form class="card glass quick-task" data-form="quickTask">
    <div class="qt-row"><input class="input-x" name="title" placeholder="Add a task…" required maxlength="80" autocomplete="off" aria-label="Task">
      <button class="qt-add" aria-label="Add task">${icon('plus')}</button></div>
    ${dateField('due', '', { none: true })}
    ${chips('area', Object.entries(AREAS).map(([k, a]) => [k, a.label, a.icon, a.color]), 'life', { cls: 'scroll' })}
  </form>
  ${groups.length ? groups.map(([name, list]) => `<div class="section-label">${name} <span>${list.length}</span></div><section class="card glass"><div class="list">${list.map(taskRow).join('')}</div></section>`).join('')
    : `<section class="card glass soon">${tile('check', 'diet', 'xl')}<p>All clear. Add a task above.</p></section>`}
  ${done.length ? `<div class="section-label">Done</div><section class="card glass"><div class="list">${done.map(taskRow).join('')}</div></section>` : ''}`;
}

// ---------- Today sections ----------
todaySections.push({
  pos: 'mid',
  render() {
    const t = dayKey(), now = nowHHMM();
    const items = agendaFor(t).filter(it => !it.time || (it.end ?? it.time) >= now).slice(0, 5);
    if (!items.length) return '';
    return `<div class="section-label">Up Next <a data-act="nav" data-to="plan">Plan</a></div><section class="card glass"><div class="list">${items.map(agendaRow).join('')}</div></section>`;
  },
});
todaySections.push({
  pos: 'mid',
  render() {
    const t = dayKey(), soon = addDays(t, 2);
    const due = tasks().filter(x => !x.done && x.due && x.due <= soon);
    const exams = assessments().filter(a => !a.done && a.due >= t && a.due <= addDays(t, 3));
    const late = invoices().filter(i => invoiceStatus(i) === 'overdue');
    if (!due.length && !exams.length && !late.length) return '';
    return `<div class="section-label">To-Do <a data-act="toTasks">All tasks</a></div><section class="card glass"><div class="list">
      ${due.slice(0, 5).map(taskRow).join('')}
      ${exams.map(a => `<div class="row tap" data-act="sheet" data-sheet="assessment" data-id="${a.id}" role="button">${tile(a.kind === 'exam' ? 'exam' : 'pen', 'school')}<div class="grow"><div class="t">${esc(a.title)}</div><div class="d">${esc(courseById(a.courseId).code)}${a.weight ? ` · ${a.weight}%` : ''}</div></div><span class="tag hot">${dayLabel(a.due)}</span></div>`).join('')}
      ${late.map(i => `<div class="row tap" data-act="sheet" data-sheet="invoice" data-id="${i.id}" role="button">${tile('receipt', 'move')}<div class="grow"><div class="t">Chase invoice ${esc(i.number || '')}</div><div class="d">${money(i.amount, false)} overdue since ${dayLabel(i.due)}</div></div></div>`).join('')}
    </div></section>`;
  },
});

// ---------- sheets ----------
const sel = (name, options, cur) => `<select class="input-x" name="${name}">${options.map(([v, l]) => `<option value="${esc(v)}" ${String(cur) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
const field = (label, inner) => `<div class="field"><label>${label}</label>${inner}</div>`;
const inp = (name, value = '', attrs = '') => `<input class="input-x" name="${name}" value="${esc(value ?? '')}" ${attrs}>`;
const del = (id, label = 'Delete') => (id ? `<button type="button" class="btn danger" data-act="delEntity" data-id="${id}">${label}</button>` : '');
const saveRow = (id, label) => `<div class="btn-row"><button class="btn">${id ? 'Save changes' : label}</button>${del(id)}</div>`;
const areaChips = cur => chips('area', Object.entries(AREAS).map(([k, a]) => [k, a.label, a.icon, a.color]), cur ?? 'life', { cols: 3 });
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
// New events start at the next whole hour, one hour long.
const nextHour = (add = 0) => `${String((new Date().getHours() + 1 + add) % 24).padStart(2, '0')}:00`;
const courseOpts = () => courses().map(c => [c.id, `${c.code} · ${c.name}`]);

sheets.planAdd = () => `<h2>Add ${closeBtn}</h2><div class="quick-grid">
  <button class="quick-btn" style="background:var(--sleep-bg);color:var(--sleep-ink)" data-act="sheet" data-sheet="event">${icon('calendar')}<span>Event</span></button>
  <button class="quick-btn" style="background:var(--diet-bg);color:var(--diet-ink)" data-act="sheet" data-sheet="task">${icon('list')}<span>Task</span></button>
  <button class="quick-btn" style="background:var(--school-bg);color:var(--school-ink)" data-act="sheet" data-sheet="assessment">${icon('pen')}<span>Assessment</span></button>
  <button class="quick-btn" style="background:var(--work-bg);color:var(--work-ink)" data-act="sheet" data-sheet="shift">${icon('coffee')}<span>Shift</span></button>
  <button class="quick-btn" style="background:var(--school-bg);color:var(--school-ink)" data-act="sheet" data-sheet="cls">${icon('school')}<span>Class</span></button>
  <button class="quick-btn" style="background:var(--work-bg);color:var(--work-ink)" data-act="sheet" data-sheet="project">${icon('laptop')}<span>Project</span></button>
</div>`;

sheets.event = ({ id, date }) => {
  const e = id ? byId(id) : null;
  const allDay = e ? !e.start : false;
  return `<h2>${e ? 'Edit event' : 'New event'} ${closeBtn}</h2><form data-form="event" class="nice-form"><input type="hidden" name="id" value="${e?.id ?? ''}">
    ${field('What', inp('title', e?.title, 'required maxlength="80" placeholder="e.g. Study: Calculus ch. 7" autocomplete="off"'))}
    ${field('When', dateField('date', e?.date ?? date ?? dayKey()))}
    <div class="times-head"><label>Time</label>${toggle('allDay', 'All day', allDay)}</div>
    <div class="row2 times">${field('Starts', inp('start', e?.start || nextHour(), 'type="time"'))}${field('Ends', inp('end', e?.end || nextHour(1), 'type="time"'))}</div>
    ${field('Area', areaChips(e?.area))}
    ${field('Note', inp('note', e?.note, 'maxlength="120" placeholder="Optional"'))}
    ${saveRow(e?.id, 'Add event')}</form>`;
};

sheets.task = ({ id, date }) => {
  const t = id ? byId(id) : null;
  return `<h2>${t ? 'Edit task' : 'New task'} ${closeBtn}</h2><form data-form="task" class="nice-form"><input type="hidden" name="id" value="${t?.id ?? ''}">
    ${field('Task', inp('title', t?.title, 'required maxlength="80" placeholder="e.g. Email tutor" autocomplete="off"'))}
    ${field('Due', dateField('due', t ? t.due ?? '' : date ?? '', { none: true }))}
    ${field('Area', areaChips(t?.area))}
    ${saveRow(t?.id, 'Add task')}</form>`;
};

sheets.course = ({ id }) => {
  const c = id ? byId(id) : null;
  return `<h2>${c ? 'Edit course' : 'New course'} ${closeBtn}</h2><form data-form="course" class="nice-form"><input type="hidden" name="id" value="${c?.id ?? ''}">
    <div class="row2">${field('Code', inp('code', c?.code, 'required maxlength="12" placeholder="COMP2123"'))}${field('Credit points', inp('credits', c?.credits ?? 6, 'inputmode="numeric"'))}</div>
    ${field('Name', inp('name', c?.name, 'required maxlength="60" placeholder="Data Structures"'))}
    <div class="label-sm">Colour</div><div class="color-pick">${COLORS.map(col => `<label><input type="radio" name="color" value="${col}" ${(c?.color ?? 'school') === col ? 'checked' : ''}><span style="background:var(--${col})"></span></label>`).join('')}</div>
    <div class="btn-row"><button class="btn">${c ? 'Save changes' : 'Add course'}</button>${c ? `<button type="button" class="btn danger" data-act="delCourse" data-id="${c.id}">Delete</button>` : ''}</div></form>`;
};

sheets.cls = ({ id }) => {
  const c = id ? byId(id) : null;
  if (!courses().length) return `<h2>New class ${closeBtn}</h2><div class="empty">Add a course first.</div><button class="btn" data-act="sheet" data-sheet="course">Add a course</button>`;
  return `<h2>${c ? 'Edit class' : 'New class'} ${closeBtn}</h2><form data-form="cls" class="nice-form"><input type="hidden" name="id" value="${c?.id ?? ''}">
    ${field('Course', chips('courseId', courses().map(x => [x.id, x.code, 'book', x.color ?? 'school']), c?.courseId ?? courses()[0].id))}
    ${field('Type', chips('kind', CLASS_KINDS.map(k => [k, k]), c?.kind ?? 'Lecture'))}
    ${field('Day', chips('day', DAY_SHORT.map((d, i) => [i, d]), c?.day ?? (new Date().getDay() + 6) % 7, { cls: 'days7' }))}
    <div class="row2">${field('Starts', inp('start', c?.start ?? '10:00', 'type="time" required'))}${field('Ends', inp('end', c?.end ?? '12:00', 'type="time" required'))}</div>
    ${field('Room', inp('room', c?.room, 'maxlength="30" placeholder="Optional, e.g. Room 4.02"'))}
    ${saveRow(c?.id, 'Add class')}</form>`;
};

sheets.assessment = ({ id }) => {
  const a = id ? byId(id) : null;
  if (!courses().length) return `<h2>New assessment ${closeBtn}</h2><div class="empty">Add a course first.</div><button class="btn" data-act="sheet" data-sheet="course">Add a course</button>`;
  const icons = { assignment: 'pen', exam: 'exam', quiz: 'list', presentation: 'users', report: 'book' };
  return `<h2>${a ? 'Assessment' : 'New assessment'} ${closeBtn}</h2><form data-form="assessment" class="nice-form"><input type="hidden" name="id" value="${a?.id ?? ''}">
    ${field('Course', chips('courseId', courses().map(x => [x.id, x.code, 'book', x.color ?? 'school']), a?.courseId ?? courses()[0].id))}
    ${field('Title', inp('title', a?.title, 'required maxlength="60" placeholder="e.g. Assignment 2" autocomplete="off"'))}
    ${field('Type', chips('kind', Object.entries(ASSESS_KINDS).map(([k, l]) => [k, l, icons[k], 'school']), a?.kind ?? 'assignment', { cols: 3 }))}
    ${field('Due', dateField('due', a?.due ?? dayKey()))}
    <div class="row2">${field('Due time', inp('dueTime', a?.dueTime, 'type="time"'))}${field('Weight', `<div class="suffix">${inp('weight', a?.weight, 'inputmode="decimal" placeholder="20"')}<span>%</span></div>`)}</div>
    ${field('Study hours <span class="opt">optional</span>', `<div class="suffix">${inp('hours', a?.hours, 'inputmode="decimal" placeholder="Left blank, estimated from the weight"')}<span>h</span></div>`)}
    <div class="row2">${field('Mark', `<div class="suffix">${inp('score', a?.score, 'inputmode="decimal" placeholder="After marking"')}<span>%</span></div>`)}<div class="field"><label>Status</label>${toggle('done', 'Submitted', a?.done)}</div></div>
    ${saveRow(a?.id, 'Add assessment')}</form>`;
};

sheets.courseDetail = ({ id }) => {
  const c = byId(id);
  if (!c) return `<h2>Course ${closeBtn}</h2>`;
  const r = courseResult(id);
  return `<h2>${esc(c.code)} ${closeBtn}</h2><p class="note">${esc(c.name)} · ${c.credits || 6} credit points</p>
    <div class="calc-result"><div><span>Average so far</span><b>${r.average != null ? `${fmt1(r.average)}%` : '–'}</b></div><div><span>Grade</span><b>${r.average != null ? band(r.average) : '–'}</b></div><div><span>Marked</span><b>${r.weightDone}%</b></div></div>
    ${r.list.length ? `<div class="list">${r.list.map(a => `<div class="row tap" data-act="sheet" data-sheet="assessment" data-id="${a.id}" role="button"><div class="grow"><div class="t">${esc(a.title)}</div><div class="d">${a.weight || 0}% · due ${dayLabel(a.due)}</div></div><div class="amt">${a.score != null && a.score !== '' ? `${fmt1(a.score)}%` : '–'}</div></div>`).join('')}</div>` : '<div class="empty">No assessments yet.</div>'}
    ${r.remaining > 0 && r.weightDone > 0 ? `<div class="label-sm" style="margin-top:14px">What do I need on the rest (${r.remaining}%)?</div>
      <div class="need">${BANDS.slice(0, 4).map(([b, min]) => {
        const need = ((min - r.earned) / r.remaining) * 100;
        return `<div class="${need > 100 ? 'no' : need <= 0 ? 'yes' : ''}"><span>${b} (${min}+)</span><b>${need > 100 ? 'Out of reach' : need <= 0 ? 'Secured' : `${fmt(need)}%`}</b></div>`;
      }).join('')}</div>` : ''}
    <div class="row2" style="margin-top:14px"><button class="btn soft" data-act="sheet" data-sheet="assessment">${icon('plus')} Assessment</button><button class="btn soft" data-act="sheet" data-sheet="course" data-id="${c.id}">${icon('edit')} Edit course</button></div>`;
};

sheets.shift = ({ id }) => {
  const s = id ? byId(id) : null;
  const js = jobs(), j = s ? jobOf(s) : js.find(x => x.id === state.kv.lastJob) ?? js[0];
  return `<h2>${s ? 'Edit shift' : 'New shift'} ${closeBtn}</h2><form data-form="shift" class="nice-form"><input type="hidden" name="id" value="${s?.id ?? ''}">
    ${js.length > 1 ? field('Job', chips('jobId', js.map(x => [x.id, x.name, x.icon, x.color]), j.id, { cols: Math.min(js.length, 3) })) : `<input type="hidden" name="jobId" value="${esc(j.id)}">`}
    ${field('Day', dateField('date', s?.date ?? dayKey()))}
    <div class="row2">${field('Starts', inp('start', s?.start ?? '17:00', 'type="time" required'))}${field('Ends', inp('end', s?.end ?? '21:00', 'type="time" required'))}</div>
    ${field('Unpaid break', chips('breakMin', [[0, 'None'], [15, '15 min'], [30, '30 min'], [45, '45 min'], [60, '1 h']], s?.breakMin ?? 0, { cols: 5 }))}
    <details class="fx" ${s?.rate ? 'open' : ''}><summary>Different pay rate for this shift</summary>
      ${field('Hourly rate', `<div class="suffix prefix"><span>A$</span>${inp('rate', s?.rate, `inputmode="decimal" placeholder="${esc(String(j.rate))}"`)}<span>/h</span></div>`)}</details>
    <div class="preview-pill" id="shift-preview"></div>
    ${saveRow(s?.id, 'Add shift')}</form>`;
};
previews.shift = form => {
  const f = new FormData(form);
  const s = { jobId: f.get('jobId'), date: readDate(f, 'date') || dayKey(), start: f.get('start'), end: f.get('end'), breakMin: num(f.get('breakMin')), rate: num(f.get('rate')) };
  const el = document.getElementById('shift-preview');
  if (el && s.start && s.end) el.innerHTML = `${icon(jobOf(s).icon)} ${fmt1(shiftHours(s))} hours · about <b>${money(shiftPay(s))}</b>`;
};

sheets.jobs = () => `<h2>Jobs ${closeBtn}</h2>
  <div class="list">${jobs().map(j => `<div class="row tap" data-act="sheet" data-sheet="job" data-id="${esc(j.id)}" role="button">${tile(j.icon, j.color)}<div class="grow"><div class="t">${esc(j.name)}</div><div class="d">${money(j.rate, false)}/h · Sat ${money(j.sat, false)} · Sun ${money(j.sun, false)}</div></div>${icon('chevron')}</div>`).join('')}</div>
  <button class="btn soft" style="margin-top:14px" data-act="sheet" data-sheet="job">${icon('plus')} Add a job</button>`;

sheets.job = ({ id }) => {
  const j = id ? jobs().find(x => x.id === id) : null;
  return `<h2>${j ? esc(j.name) : 'New job'} ${closeBtn}</h2><form data-form="job" class="nice-form"><input type="hidden" name="id" value="${esc(j?.id ?? '')}">
    ${field('Job name', inp('name', j?.name, 'required maxlength="30" placeholder="e.g. Woolworths"'))}
    ${field('Icon', chips('icon', JOB_ICONS.map(([n, label]) => [n, label, n]), j?.icon ?? 'coffee', { cols: 8, cls: 'icons' }))}
    <div class="row3">${field('Weekday $/h', inp('rate', j?.rate, 'inputmode="decimal" required placeholder="30"'))}${field('Saturday $/h', inp('sat', j?.sat, 'inputmode="decimal" placeholder="Same"'))}${field('Sunday $/h', inp('sun', j?.sun, 'inputmode="decimal" placeholder="Same"'))}</div>
    <p class="note">Casual award rates differ by day. Use the rates on your payslip.</p>
    <div class="btn-row"><button class="btn">${j ? 'Save' : 'Add job'}</button>${j && jobs().length > 1 ? `<button type="button" class="btn danger" data-act="delJob" data-id="${esc(j.id)}">Delete</button>` : ''}</div></form>`;
};

sheets.client = ({ id }) => {
  const c = id ? byId(id) : null;
  return `<h2>${c ? 'Edit client' : 'Clients'} ${closeBtn}</h2>
    ${!c && clients().length ? `<div class="list" style="margin-bottom:14px">${clients().map(x => `<div class="row tap" data-act="sheet" data-sheet="client" data-id="${x.id}" role="button">${tile('user', 'work')}<div class="grow"><div class="t">${esc(x.name)}</div><div class="d">${plural(projects().filter(p => p.clientId === x.id).length, 'project')}</div></div></div>`).join('')}</div><div class="label-sm">New client</div>` : ''}
    <form data-form="client"><input type="hidden" name="id" value="${c?.id ?? ''}">
    ${field('Name', inp('name', c?.name, 'required maxlength="50" placeholder="Bloom Florist"'))}${field('Email', inp('email', c?.email, 'type="email" maxlength="80" placeholder="optional"'))}
    ${saveRow(c?.id, 'Add client')}</form>`;
};

sheets.project = ({ id }) => {
  const p = id ? byId(id) : null;
  return `<h2>${p ? 'Project' : 'New project'} ${closeBtn}</h2><form data-form="project"><input type="hidden" name="id" value="${p?.id ?? ''}">
    ${field('Project', inp('title', p?.title, 'required maxlength="60" placeholder="Homepage redesign"'))}
    ${field('Client', `<input class="input-x" name="client" list="client-list" value="${esc(p ? clientName(p.clientId) : '')}" placeholder="Client name" maxlength="50"><datalist id="client-list">${clients().map(c => `<option value="${esc(c.name)}">`).join('')}</datalist>`)}
    <div class="row2">${field('Fee (A$)', inp('fee', p?.fee, 'inputmode="decimal"'))}${field('Deadline', inp('deadline', p?.deadline, 'type="date"'))}</div>
    ${field('Status', chips('status', [['lead', 'Lead', 'flag', 'school'], ['active', 'Active', 'code', 'work'], ['done', 'Done', 'check', 'diet']], p?.status ?? 'active', { cols: 3 }))}
    ${saveRow(p?.id, 'Add project')}</form>
    ${p ? `<button class="btn soft" style="margin-top:10px" data-act="sheet" data-sheet="invoice" data-project="${p.id}">${icon('receipt')} Create invoice</button>` : ''}`;
};

sheets.invoice = ({ id, project }) => {
  const i = id ? byId(id) : null;
  const ps = projects();
  if (!ps.length) return `<h2>New invoice ${closeBtn}</h2><div class="empty">Add a project first.</div><button class="btn" data-act="sheet" data-sheet="project">Add a project</button>`;
  const pid = i?.projectId ?? project ?? ps[0].id;
  const n = invoices().length + 1;
  return `<h2>${i ? 'Invoice' : 'New invoice'} ${closeBtn}</h2><form data-form="invoice"><input type="hidden" name="id" value="${i?.id ?? ''}">
    ${field('Project', sel('projectId', ps.map(p => [p.id, `${p.title}${p.clientId ? ` · ${clientName(p.clientId)}` : ''}`]), pid))}
    <div class="row2">${field('Number', inp('number', i?.number ?? `INV-${String(n).padStart(3, '0')}`, 'maxlength="20"'))}${field('Amount (A$)', inp('amount', i?.amount ?? byId(pid)?.fee ?? '', 'inputmode="decimal" required'))}</div>
    <div class="row2">${field('Issued', inp('issued', i?.issued ?? dayKey(), 'type="date"'))}${field('Due', inp('due', i?.due ?? addDays(dayKey(), 14), 'type="date" required'))}</div>
    ${field('Status', chips('status', [['draft', 'Draft', 'edit', 'sleep'], ['sent', 'Sent', 'send', 'work'], ['paid', 'Paid', 'check', 'diet']], i?.status ?? 'sent', { cols: 3 }))}
    ${saveRow(i?.id, 'Save invoice')}</form>`;
};

// ---------- actions & forms ----------
const save = async (type, f, fields, date) => {
  const id = f.get('id');
  if (id) await updateEntry(id, { ...fields, ...(date ? { date } : {}) });
  else await addEntry(type, fields, date ?? dayKey());
  haptic();
  closeSheet();
  render();
  return id;
};

// A step is a week in week view and a month once the calendar is expanded.
function calStep(n) {
  const sel = ui.planDay ?? dayKey();
  ui.planDay = monthView() ? addMonths(sel, n) : addDays(sel, n * 7);
  haptic();
  render();
  slideIn(document.querySelector('[data-cal] .cal-grid'), Math.sign(n));
}

// Swipe the calendar sideways to change week or month, like the iOS calendar.
afterRender.push(route => {
  const cal = route === 'plan' ? document.querySelector('[data-cal]') : null;
  if (!cal) return;
  let x0 = null, y0 = 0, swiped = false;
  cal.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; swiped = false; }, { passive: true });
  cal.addEventListener('touchend', e => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    x0 = null;
    if (Math.abs(dx) < 46 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
    swiped = true; // a swipe must not also select the day under the finger
    calStep(dx < 0 ? 1 : -1);
  }, { passive: true });
  cal.addEventListener('click', e => { if (swiped) { swiped = false; e.stopPropagation(); e.preventDefault(); } }, true);
});

// Jumping with the native date picker hidden behind the calendar button.
document.addEventListener('change', e => {
  if (!e.target.classList?.contains('cal-jump-in') || !e.target.value) return;
  ui.planDay = e.target.value;
  haptic();
  render();
});
document.addEventListener('click', e => {
  if (e.target.classList?.contains('cal-jump-in')) { try { e.target.showPicker?.(); } catch { /* iOS opens it natively */ } }
});

Object.assign(actions, {
  planDay: el => { ui.planDay = el.dataset.d; ui.pulse = '[data-cal] .day.on b'; haptic(); render(); },
  planStep: el => calStep(Number(el.dataset.d)),
  planToday: () => { ui.planDay = dayKey(); haptic(); render(); },
  async planExpand() { await setKV('planMonthView', !monthView()); haptic(); render(); },
  toTasks: () => { ui.tab.plan = 'tasks'; location.hash = 'plan'; },
  async toggleTask(el) {
    const t = byId(el.dataset.id);
    await updateEntry(t.id, { done: !t.done, doneAt: t.done ? null : Date.now() });
    haptic();
    ui.pulse = t.done ? null : `.check[data-id="${CSS.escape(t.id)}"]`;
    render();
    if (!t.done) toast('Task done', { icon: 'check' });
  },
  delEntity: el => { closeSheet(); return removeWithUndo(el.dataset.id, 'Deleted'); },
  async delCourse(el) {
    if (!confirm('Delete this course with its classes and assessments?')) return;
    const id = el.dataset.id;
    for (const e of state.entries.filter(x => (x.type === 'class' || x.type === 'assessment') && x.courseId === id)) await removeEntry(e.id);
    await removeEntry(id);
    closeSheet();
    toast('Course deleted', { icon: 'trash' });
    render();
  },
  async toggleScale() { await setKV('gpaScale', gpaScale() === 7 ? 4 : 7); render(); },
  // One income per job, since each employer pays separately.
  async addPay() {
    let total = 0;
    for (const j of jobs()) {
      const list = jobShifts(j, weekShifts());
      const pay = Math.round(list.reduce((t, s) => t + shiftPay(s), 0) * 100) / 100;
      if (!pay) continue;
      await addEntry('txn', { kind: 'income', amount: pay, category: 'wages', account: 'westpac', merchant: `${j.name} pay`, note: `${plural(list.length, 'shift')} · week of ${shortDate(weekStart())}` }, dayKey());
      total += pay;
    }
    if (!total) return;
    haptic();
    toast(`${money(total)} added to Money`, { icon: 'coins' });
    render();
  },
  async delJob(el) {
    const j = jobs().find(x => x.id === el.dataset.id);
    if (!j) return;
    const mine = jobShifts(j, shifts());
    if (!confirm(`Delete ${j.name}${mine.length ? ` and its ${plural(mine.length, 'shift')}` : ''}? Pay already added to Money stays.`)) return;
    for (const s of mine) await removeEntry(s.id);
    await setKV('jobs', jobs().filter(x => x.id !== j.id));
    closeSheet();
    toast(`${j.name} deleted`, { icon: 'trash' });
    render();
  },
});

async function clientIdFor(name) {
  name = String(name ?? '').trim();
  if (!name) return null;
  const found = clients().find(c => c.name.toLowerCase() === name.toLowerCase());
  return found ? found.id : (await addEntry('client', { name }, dayKey())).id;
}

Object.assign(forms, {
  async event(f) {
    const allDay = f.get('allDay') === 'on';
    await save('event', f, { title: f.get('title').trim(), start: allDay ? '' : f.get('start'), end: allDay ? '' : f.get('end'), area: f.get('area') || 'life', note: f.get('note').trim() }, readDate(f, 'date') || dayKey());
    toast('Event saved', { icon: 'calendar' });
  },
  async task(f) {
    await save('task', f, { title: f.get('title').trim(), due: readDate(f, 'due'), area: f.get('area') || 'life' });
    toast('Task saved', { icon: 'list' });
  },
  async quickTask(f, form) {
    await addEntry('task', { title: f.get('title').trim(), due: readDate(f, 'due'), area: f.get('area') || 'life', done: false }, dayKey());
    haptic();
    form.reset();
    render();
    toast('Task added', { icon: 'list' });
  },
  async course(f) {
    await save('course', f, { code: f.get('code').trim().toUpperCase(), name: f.get('name').trim(), credits: num(f.get('credits')) || 6, color: f.get('color') || 'school' });
    toast('Course saved', { icon: 'book' });
  },
  async cls(f) {
    await save('class', f, { courseId: f.get('courseId'), kind: f.get('kind'), day: Number(f.get('day')), start: f.get('start'), end: f.get('end'), room: f.get('room').trim() });
    toast('Class saved', { icon: 'school' });
  },
  async assessment(f) {
    const score = String(f.get('score')).trim();
    await save('assessment', f, { courseId: f.get('courseId'), title: f.get('title').trim(), kind: f.get('kind'), weight: num(f.get('weight')), due: readDate(f, 'due') || dayKey(), dueTime: f.get('dueTime'), hours: num(f.get('hours')) || null, score: score === '' ? null : num(score), done: f.get('done') === 'on' || score !== '' });
    toast('Assessment saved', { icon: 'pen' });
  },
  async shift(f) {
    const jobId = f.get('jobId') || jobs()[0].id;
    if (jobs().length > 1) await setKV('lastJob', jobId);
    await save('shift', f, { jobId, start: f.get('start'), end: f.get('end'), breakMin: num(f.get('breakMin')), rate: num(f.get('rate')) || null }, readDate(f, 'date') || dayKey());
    toast('Shift saved', { icon: jobOf({ jobId }).icon });
  },
  async job(f) {
    const id = f.get('id'), list = jobs();
    const rate = num(f.get('rate'));
    const fields = { name: f.get('name').trim() || 'Job', icon: f.get('icon') || 'coffee', rate, sat: num(f.get('sat')) || rate, sun: num(f.get('sun')) || rate };
    const used = new Set(list.map(j => j.color));
    await setKV('jobs', id ? list.map(j => (j.id === id ? { ...j, ...fields } : j)) : [...list, { id: uid(), color: JOB_COLORS.find(c => !used.has(c)) ?? 'work', ...fields }]);
    haptic();
    closeSheet();
    toast(id ? `${fields.name} saved` : `${fields.name} added`, { icon: fields.icon });
    render();
  },
  async client(f) {
    await save('client', f, { name: f.get('name').trim(), email: f.get('email').trim() });
    toast('Client saved', { icon: 'user' });
  },
  async project(f) {
    const clientId = await clientIdFor(f.get('client'));
    await save('project', f, { title: f.get('title').trim(), clientId, fee: num(f.get('fee')) || null, deadline: f.get('deadline') || null, status: f.get('status') });
    toast('Project saved', { icon: 'laptop' });
  },
  async invoice(f) {
    const id = f.get('id');
    const old = id ? byId(id) : null;
    const status = f.get('status');
    const fields = { projectId: f.get('projectId'), number: f.get('number').trim(), amount: num(f.get('amount')), issued: f.get('issued'), due: f.get('due'), status, paidDate: status === 'paid' ? old?.paidDate ?? dayKey() : null };
    await save('invoice', f, fields);
    // Marking an invoice paid records the income in Money once.
    if (status === 'paid' && old?.status !== 'paid') {
      const p = byId(fields.projectId);
      await addEntry('txn', { kind: 'income', amount: fields.amount, category: 'freelance', account: 'westpac', merchant: clientName(p?.clientId) || p?.title || 'Freelance', note: `${fields.number} · ${p?.title ?? ''}`, invoiceNumber: fields.number }, dayKey());
      toast(`${money(fields.amount)} added to Money`, { icon: 'coins' });
      render();
    } else {
      toast('Invoice saved', { icon: 'receipt' });
    }
  },
});
