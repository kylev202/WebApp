// v1 Day planner: the assistant lays out a day, you move it around afterwards.
//
// The model is handed the shape of a day rather than a blank page — what's
// already fixed (classes, shifts, events, workouts), what's left of it, and
// what's owed (assessment hours, open tasks, a training day that hasn't
// happened) — and asked to fill the gaps. What comes back is checked against
// those same gaps before anything is written: a block laid over a lecture is
// trimmed to the free time beside it, or dropped if nothing is left. A plan is
// a suggestion until it survives the day's own arithmetic.
//
// Everything it writes is an ordinary planned block, which is the whole trick:
// the day view already knows how to draw one, drag it to another hour, stretch
// it, re-tag it, tick it off or delete it. The planner adds no new kind of
// thing to the app — it just fills the timeline in one go.
import { state, addEntry, removeEntry, putEntry, setKV } from './store.js';
import { dayKey, dayLabel, addDays, toMin, fromMin, minNow, snapMin, fmt1, clamp } from './util.js';
import { of, byId, habits, habitDone, BLOCK_KINDS, kindOf, goals, kcalOn, proteinOn, sleepOn } from './data.js';
import { agendaFor, courseById, tasks, AREAS } from './plan.js';
import { workouts, routine, nextDay } from './gym.js';
import { studyPrefs, openAssessments, progressOf } from './study.js';
import { hasAI, generate, systemPrompt, extraTools, extraRun, promptSections, S, DATE, TIME, obj } from './ai.js';

const MIN_BLOCK = 20;   // shorter than this isn't a block, it's a thought
const MAX_BLOCK = 240;
const STEP = 15;        // the quarter-hour grid a dragged block already snaps to
const MAX_BLOCKS = 14;
// Plans Loop made are its own to replace; a block you planned by hand is not.
const OURS = new Set(['planner', 'ai', 'coach']);
export const PLAN_HORIZON = 14; // how far ahead the day view will walk

const isTime = t => /^\d{1,2}:\d{2}$/.test(t ?? '');
const hhmm = t => (isTime(t) ? String(t).padStart(5, '0') : null);
const isDate = d => /^\d{4}-\d{2}-\d{2}$/.test(d ?? '');
const minOfTs = ts => { const d = new Date(ts); return d.getHours() * 60 + d.getMinutes(); };
// An end before its start ran past midnight (a 6pm–1am shift); the day stops there.
const until = (start, end, fallback) => { if (!end) return fallback; const m = toMin(end); return m > start ? m : 1440; };
const dur = m => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}` : `${m}m`);

const merge = iv => iv.filter(([s, e]) => e > s).sort((a, b) => a[0] - b[0]).reduce((out, [s, e]) => {
  const last = out.at(-1);
  if (last && s <= last[1]) last[1] = Math.max(last[1], e);
  else out.push([s, e]);
  return out;
}, []);

// base minus holes, both as sorted [start, end] minute pairs.
function subtract(base, holes) {
  let out = base.map(([a, b]) => [a, b]);
  for (const [hs, he] of merge(holes)) {
    const next = [];
    for (const [a, b] of out) {
      if (he <= a || hs >= b) { next.push([a, b]); continue; }
      if (hs > a) next.push([a, hs]);
      if (he < b) next.push([he, b]);
    }
    out = next;
  }
  return out;
}

// ---------- the window the planner may use ----------
// Defaults to the study planner's hours, because that's the waking window the
// user has already told Loop about; it can be widened for the day planner alone.
export function planPrefs() {
  const sp = studyPrefs();
  const p = { from: sp.from, to: sp.to, ...state.kv.planPrefs };
  if (!isTime(p.from) || !isTime(p.to) || toMin(p.to) - toMin(p.from) < 120) return { from: sp.from, to: sp.to };
  return { from: hhmm(p.from), to: hhmm(p.to) };
}

// ---------- what the day already holds ----------
// Blocks in `skip` are the plan we're about to replace: they mustn't make the
// hours they sit in look busy, or a re-plan would have nowhere to go.
export function claimedOn(date, skip = new Set()) {
  const iv = [];
  agendaFor(date).forEach(it => {
    if (!it.time) return;
    const s = toMin(it.time);
    iv.push([s, until(s, it.end, s + 45)]);
  });
  of('block', date).forEach(b => {
    if (skip.has(b.id)) return;
    const s = toMin(b.start);
    iv.push([s, until(s, b.end, Math.max(s + 30, minNow() + 15))]);
  });
  workouts().filter(w => w.date === date).forEach(w => {
    const s = minOfTs(w.start);
    iv.push([s, Math.max(s + 20, w.end ? minOfTs(w.end) : s + 60)]);
  });
  return merge(iv);
}

// The free runs of a day, in order. Today starts from the next quarter hour:
// planning the morning you've already spent is a plan for no one.
export function gapsOn(date, skip = new Set(), { min = MIN_BLOCK } = {}) {
  const p = planPrefs();
  const hi = toMin(p.to);
  const floor = date === dayKey() ? Math.ceil((minNow() + 5) / STEP) * STEP : 0;
  let t = Math.max(toMin(p.from), floor);
  const out = [];
  for (const [s, e] of claimedOn(date, skip)) {
    if (e <= t) continue;
    if (s >= hi) break;
    if (s - t >= min) out.push([t, s]);
    t = Math.max(t, e);
    if (t >= hi) return out;
  }
  if (hi - t >= min) out.push([t, hi]);
  return out;
}
export const freeMinsOn = (date, skip) => gapsOn(date, skip).reduce((n, [s, e]) => n + (e - s), 0);

// ---------- the plan on a day ----------
export const plannedBlocks = date => of('block', date).filter(b => b.planned && !b.done);
export const ourPlan = date => plannedBlocks(date).filter(b => OURS.has(b.source));
export const planMeta = date => state.kv.dayPlans?.[date] ?? null;
export const plannedMins = date => ourPlan(date).reduce((n, b) => n + Math.max(0, toMin(b.end ?? b.start) - toMin(b.start)), 0);

// ---------- the brief the model plans from ----------
// Deliberately a picture of the day rather than the whole app: the system prompt
// already carries the standing data, and this is the part that decides an hour.
export function dayContext(date, skip = new Set()) {
  const today = dayKey();
  const gaps = gapsOn(date, skip);
  const p = planPrefs();
  const r = routine();
  const trained = workouts().some(w => w.date === date);
  const open = openAssessments(date).slice(0, 6);

  return {
    date,
    day: dayLabel(date),
    weekday: new Date(`${date}T12:00`).toLocaleDateString('en-AU', { weekday: 'long' }),
    is_today: date === today,
    now: date === today ? fromMin(minNow()) : null,
    day_window: `${p.from}–${p.to}`,
    fixed: agendaFor(date).map(it => (it.time
      ? `${it.time}${it.end ? `–${it.end}` : ''} ${it.title}${it.sub ? ` (${it.sub})` : ''} [${it.tag}]`
      : `no time yet: ${it.title} [${it.tag}]`)),
    workouts_logged: workouts().filter(w => w.date === date).map(w => `${fromMin(minOfTs(w.start))} ${w.name}`),
    free: gaps.map(([a, b]) => `${fromMin(a)}–${fromMin(b)} (${dur(b - a)})`),
    free_total: dur(gaps.reduce((n, [a, b]) => n + (b - a), 0)),
    keeping: plannedBlocks(date).filter(b => !skip.has(b.id)).map(b => `${b.start}–${b.end} ${kindOf(b.kind).label}${b.title ? `: ${b.title}` : ''}`),
    already_done: of('block', date).filter(b => !b.planned || b.done).map(b => `${b.start}${b.end ? `–${b.end}` : ' (running)'} ${kindOf(b.kind).label}${b.title ? `: ${b.title}` : ''}`),
    due_soon: open.map((a, i) => {
      const prog = progressOf(a);
      return { id: `A${i + 1}`, title: a.title, course: courseById(a.courseId).code, due: a.due, weight: a.weight || null, hours_left: fmt1(prog.left), hours_unplanned: fmt1(prog.toPlan) };
    }),
    tasks_open: tasks().filter(x => !x.done).slice(0, 12).map(x => `${x.title}${x.due ? ` (due ${x.due})` : ''}${x.area ? ` [${AREAS[x.area]?.label ?? x.area}]` : ''}`),
    gym: r ? { routine: r.name, per_week: r.perWeek, next_day: nextDay()?.name ?? null, trained_on_this_day: trained, workouts_this_week: workouts().filter(w => w.date >= addDays(today, -6)).length } : null,
    habits_left: date === today ? habits().filter(h => !habitDone(h.id, today)).map(h => h.name) : habits().map(h => h.name),
    today_so_far: date === today ? { kcal: kcalOn(today), of_goal: goals().kcal, protein_g: proteinOn(today), slept_h: sleepOn(today) || null } : null,
    session_minutes_preferred: studyPrefs().session,
  };
}

// ---------- validating what comes back ----------
// The model is good at the shape of a day and careless about its edges, so every
// block is snapped to the quarter hour, trimmed into the free run it overlaps
// most, and kept from landing on top of the one before it.
function fitInto(want, avail) {
  let best = null, overlap = 0;
  for (const [a, b] of avail) {
    const ov = Math.min(want[1], b) - Math.max(want[0], a);
    if (ov > overlap) { overlap = ov; best = [a, b]; }
  }
  if (!best) return null;
  const s = Math.max(want[0], best[0]);
  const e = Math.min(want[1], best[1]);
  return e - s >= MIN_BLOCK ? [s, e] : null;
}

export function cleanBlocks(date, raw, skip = new Set()) {
  const gaps = gapsOn(date, skip);
  const ids = Object.fromEntries(openAssessments(date).slice(0, 6).map((a, i) => [`A${i + 1}`, a.id]));
  const blocks = [], dropped = [], taken = [];

  for (const b of (Array.isArray(raw) ? raw : []).slice(0, MAX_BLOCKS)) {
    const label = String(b?.title || kindOf(b?.kind).label).slice(0, 60);
    const start = hhmm(b?.start);
    if (!start) { dropped.push(`${label} (no start time)`); continue; }
    const a0 = clamp(snapMin(toMin(start), STEP), 0, 1440 - STEP);
    const e0 = isTime(b?.end) ? snapMin(toMin(hhmm(b.end)), STEP) : a0 + 60;
    const want = [a0, clamp(e0 > a0 ? e0 : a0 + 60, a0 + STEP, Math.min(1440, a0 + MAX_BLOCK))];

    const fit = fitInto(want, subtract(gaps, taken));
    if (!fit) { dropped.push(`${label} (${fromMin(want[0])} isn’t free)`); continue; }
    taken.push(fit);

    // An id the model invented is worth less than no id at all: a block tagged
    // to the wrong assessment quietly credits hours to the wrong deadline.
    const assessId = ids[String(b?.assess_id ?? '').trim().toUpperCase()] ?? null;
    blocks.push({
      kind: Object.prototype.hasOwnProperty.call(BLOCK_KINDS, b?.kind) ? b.kind : 'study',
      title: String(b?.title ?? '').slice(0, 60),
      note: String(b?.note ?? '').slice(0, 120),
      start: fromMin(fit[0]),
      end: fromMin(fit[1]),
      mins: fit[1] - fit[0],
      assessId,
      courseId: assessId ? byId(assessId)?.courseId ?? null : null,
    });
  }
  blocks.sort((x, y) => toMin(x.start) - toMin(y.start));
  return { blocks, dropped };
}

// ---------- writing it down ----------
async function rememberPlan(date, patch) {
  const all = state.kv.dayPlans ?? {};
  // Yesterday's plans are history the day view reads off the blocks themselves,
  // so only a fortnight of summaries is kept.
  const keep = Object.fromEntries(Object.entries(all).filter(([d]) => d >= addDays(dayKey(), -14)));
  await setKV('dayPlans', { ...keep, [date]: patch });
}

export async function applyDayPlan(date, raw, { replace = true, summary = '', source = 'planner' } = {}) {
  const meta = planMeta(date);
  const old = replace ? ourPlan(date) : [];
  const skip = new Set(old.map(b => b.id));
  const { blocks, dropped } = cleanBlocks(date, raw, skip);
  if (!blocks.length) {
    return { ok: false, error: 'None of those hours were free', dropped, free: gapsOn(date, skip).map(([a, b]) => `${fromMin(a)}–${fromMin(b)}`) };
  }
  const removed = [];
  for (const b of old) { removed.push({ ...b }); await removeEntry(b.id); }
  const ids = [];
  for (const b of blocks) {
    const e = await addEntry('block', {
      kind: b.kind, title: b.title, note: b.note, start: b.start, end: b.end,
      planned: true, done: false, assessId: b.assessId, courseId: b.courseId, source,
    }, date);
    ids.push(e.id);
  }
  const mins = blocks.reduce((n, b) => n + b.mins, 0);
  await rememberPlan(date, { summary: String(summary ?? '').slice(0, 400), at: Date.now(), ids, blocks: blocks.length, mins });
  return { ok: true, date, ids, removed, blocks, dropped, mins, meta };
}

export async function clearDayPlan(date) {
  const meta = planMeta(date);
  const old = ourPlan(date);
  const removed = [];
  for (const b of old) { removed.push({ ...b }); await removeEntry(b.id); }
  if (meta) await rememberPlan(date, null);
  return { removed, meta };
}

// Put back exactly what a plan displaced, take away what it added, and leave the
// summary line reading as it did before — an undo you can't see isn't one.
export async function undoPlan({ ids = [], removed = [], date, meta = null } = {}) {
  for (const id of ids) await removeEntry(id);
  for (const e of removed) await putEntry(e);
  if (date) await rememberPlan(date, meta ?? null);
}

// ---------- asking the model ----------
const RULES = `How to lay out a day:
- Use only the runs listed in "free". Never cover anything in "fixed", and keep each block inside a single free run.
- Everything starts and ends on the quarter hour. A block is 45–120 minutes; leave 15 minutes between two in a row, and a proper break (45 min or so) where a meal belongs.
- Hardest work first, in the longest run of the day: revision and assignments early, reading and admin and chores in the short ends.
- Nearest deadline wins. Tag a study or revision block to what it serves with assess_id from "due_soon", and cover the hours in "hours_unplanned" before anything optional.
- Do not fill the day. Aim for roughly two thirds of the free time, and no more than about 6 hours of work blocks. Empty hours are part of the plan.
- Use kind "gym" for training when the routine says a day is due and none is logged; don't invent blocks for meals, showers or travel.
- Finish a free evening with rest or social rather than one more hour of study.`;

const planTool = () => ({
  name: 'set_day_plan',
  description: 'Lay out a whole day as planned blocks on the user’s timeline, which they can then drag, stretch, re-time or tick off. Replaces the plan Loop last made for that day. Send the day in one call rather than many log_block calls.',
  parameters: obj({
    date: DATE,
    summary: S('string', 'One or two sentences to the user: the shape of the day and the reason for it. No markdown.'),
    replace: S('boolean', 'Default true: the plan replaces the one Loop last made for that day. Pass false to keep that plan and fit these blocks around it.'),
    blocks: S('array', 'The blocks, in time order', {
      items: obj({
        kind: S('string', `One of: ${Object.keys(BLOCK_KINDS).join(', ')}`),
        title: S('string', 'What specifically, e.g. "COMP2123 past papers"'),
        start: TIME('Start'),
        end: TIME('End'),
        assess_id: S('string', 'The id from due_soon ("A1", "A2"…) this block works towards, if any'),
        note: S('string', 'Optional one-liner'),
      }, ['kind', 'title', 'start', 'end']),
    }),
  }, ['blocks', 'summary']),
});

const aiText = res => (res.candidates?.[0]?.content?.parts ?? []).filter(p => p.text && !p.thought).map(p => p.text).join('').trim();

// One shot, straight from the day view: no chat, no tool loop, just the day back.
export async function generateDayPlan(date, { brief = '', replace = true } = {}) {
  if (!hasAI()) throw new Error('Connect Gemini in Ask first, then Loop can lay the day out for you.');
  const skip = new Set(replace ? ourPlan(date).map(b => b.id) : []);
  const ctx = dayContext(date, skip);
  if (!ctx.free.length) throw new Error('There’s no free time left in that day’s window.');

  const prompt = `Plan ${ctx.day} (${date}) for me and call set_day_plan with it. Nothing else — no reply text.

THE DAY AS IT STANDS (JSON):
${JSON.stringify(ctx)}

${RULES}
${replace ? '' : '\nKeep what is listed under "keeping": plan around it.'}
${brief ? `\nWhat I've told you about this day — treat it as the first thing the plan has to satisfy: "${brief.slice(0, 400)}"` : ''}`;

  const res = await generate({
    system: systemPrompt(),
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    tools: [planTool()],
  });
  const call = (res.candidates?.[0]?.content?.parts ?? []).find(p => p.functionCall?.name === 'set_day_plan');
  if (!call) throw new Error(aiText(res) || 'The planner came back empty. Try again?');
  const args = call.functionCall.args ?? {};
  const out = await applyDayPlan(date, args.blocks, { replace, summary: args.summary });
  if (!out.ok) throw new Error(`${out.error}. Free: ${out.free.join(', ') || 'nothing'}.`);
  return out;
}

// ---------- the same thing, from the chat ----------
extraTools.push(() => [
  {
    name: 'get_day_shape',
    description: 'Read one day before planning it: what is already fixed on it, the free runs left, what is owed (assessments, tasks) and what is already planned. Call this first whenever the user asks you to plan or re-plan a day.',
    parameters: obj({ date: DATE }, []),
  },
  planTool(),
  {
    name: 'clear_day_plan',
    description: 'Remove the planned blocks Loop laid out for a day. Does not touch anything the user logged, ticked off or planned by hand.',
    parameters: obj({ date: DATE }, []),
  },
]);

Object.assign(extraRun, {
  async get_day_shape(a) {
    const date = isDate(a.date) ? a.date : dayKey();
    return { result: { ok: true, ...dayContext(date, new Set(ourPlan(date).map(b => b.id))), rules: RULES } };
  },
  async set_day_plan(a) {
    const date = isDate(a.date) ? a.date : dayKey();
    // Undo on a chat card puts back entries and one stored value, so the whole
    // summaries map rides along: undoing a plan should undo what it says too.
    const prev = state.kv.dayPlans ? { ...state.kv.dayPlans } : null;
    const out = await applyDayPlan(date, a.blocks, { replace: a.replace !== false, summary: a.summary, source: 'ai' });
    if (!out.ok) return { result: { ok: false, error: out.error, dropped: out.dropped, free: out.free } };
    return {
      result: { ok: true, planned: out.blocks.map(b => `${b.start}–${b.end} ${kindOf(b.kind).label}${b.title ? `: ${b.title}` : ''}`), total: dur(out.mins), dropped: out.dropped, replaced: out.removed.length },
      card: {
        icon: 'calendar', area: 'school',
        title: `${dayLabel(date)}: ${out.blocks.length} block${out.blocks.length > 1 ? 's' : ''} planned`,
        sub: `${dur(out.mins)} laid out · ${out.blocks.map(b => b.start).join(', ')}`,
        ids: out.ids, restore: out.removed, kv: { key: 'dayPlans', prev },
      },
    };
  },
  async clear_day_plan(a) {
    const date = isDate(a.date) ? a.date : dayKey();
    const prev = state.kv.dayPlans ? { ...state.kv.dayPlans } : null;
    const { removed } = await clearDayPlan(date);
    if (!removed.length) return { result: { ok: true, removed: 0, note: 'There was no Loop plan on that day' } };
    return {
      result: { ok: true, removed: removed.length },
      card: { icon: 'trash', area: 'sleep', title: `${dayLabel(date)}’s plan cleared`, sub: `${removed.length} planned block${removed.length > 1 ? 's' : ''} removed`, restore: removed, kv: { key: 'dayPlans', prev } },
    };
  },
});

promptSections.push(() => `- DAY PLANNING: when the user asks you to plan or re-plan a day ("plan my day", "plan tomorrow", "redo this afternoon"), call get_day_shape for that date first, then set_day_plan ONCE with the whole day. Follow the rules it returns. Don't lay a day out with repeated log_block calls, and don't plan over anything already fixed. Everything set_day_plan writes is a planned block the user can drag to another hour, stretch, re-time or tick off in the Day view, so say that once and keep the summary short. clear_day_plan removes a plan you made.`);
