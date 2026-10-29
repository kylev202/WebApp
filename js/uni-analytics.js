// Uni analytics: a semester report. What each mark was actually worth, what the
// work still to come has to score, and whether the hours you put into a unit show
// up in its results. Everything comes from the assessments you have entered (or
// Canvas has synced) and the study blocks on your timeline.
import { esc, dayKey, addDays, daysBetween, weekStart, shortDate, dayLabel, toMin, fmt, fmt1, fmtHours, mean, sum, plural, clamp } from './util.js';
import { icon, tile } from './icons.js';
import { state } from './store.js';
import { blocks } from './data.js';
import { courses, courseById, assessments, courseResult, uniSummary, band, BANDS, gpaScale, gradePoints, ASSESS_KINDS } from './plan.js';
import { chip, note, notes, signed, stat, section, slope, dayNo } from './an-ui.js';

// Timed work that counts as studying. Coding, admin and chores are logged the same
// way but belong to other parts of life.
const STUDY_KINDS = ['study', 'revision', 'reading'];
const WIN = 28;
const norm = s => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
const bandLvl = mark => (mark == null ? 'none' : mark >= 75 ? 'good' : mark >= 50 ? 'ok' : 'low');
const hoursOf = b => Math.max(0, toMin(b.end) - toMin(b.start)) / 60;
const pearson = (xs, ys) => {
  const n = xs.length;
  if (n < 3) return null;
  const mx = mean(xs), my = mean(ys);
  const sx = Math.sqrt(sum(xs.map(x => (x - mx) ** 2))), sy = Math.sqrt(sum(ys.map(y => (y - my) ** 2)));
  return sx && sy ? sum(xs.map((x, i) => (x - mx) * (ys[i] - my))) / (sx * sy) : null;
};

// ---------- the numbers ----------
function uniFacts() {
  const today = dayKey();
  const cs = courses();
  const all = assessments();
  const marked = all.filter(a => a.score != null && a.score !== '');
  // Only finished blocks, and only the kinds that are studying.
  const done = blocks().filter(b => b.end && !b.planned && STUDY_KINDS.includes(b.kind));

  // A block belongs to a unit when you picked one, or when the unit's code or name
  // turns up in what you called it.
  const belongs = c => {
    const code = norm(c.code), name = norm(c.name);
    return b => (b.courseId ? b.courseId === c.id
      : (() => { const t = norm(`${b.title ?? ''} ${b.note ?? ''}`); return !!t && ((code && t.includes(code)) || (name.length >= 6 && t.includes(name))); })());
  };

  const w0 = weekStart();
  const weeks = Array.from({ length: 8 }, (_, i) => addDays(w0, (i - 7) * 7));
  const hoursIn = (list, from, to = today) => sum(list.filter(b => b.date > from && b.date <= to).map(hoursOf));

  const units = cs.map(c => {
    const r = courseResult(c.id);
    const mine = done.filter(belongs(c));
    const list = r.list.slice().sort((a, b) => a.due.localeCompare(b.due));
    const pending = list.filter(a => a.score == null || a.score === '');
    const next = pending.filter(a => a.due >= today)[0] ?? null;
    const lost = r.weightDone - r.earned;
    const hours28 = hoursIn(mine, addDays(today, -WIN));
    const projected = r.average != null ? r.earned + (r.remaining * r.average) / 100 : null;
    // What the work still to come would have to average for each grade band.
    const ladder = BANDS.filter(([, min]) => min > 0).map(([name, min]) => {
      const need = r.remaining > 0 ? ((min - r.earned) / r.remaining) * 100 : null;
      return { name, min, need, locked: r.earned >= min, gone: need != null && need > 100 };
    });
    return { c, r, list, pending, next, lost, mine, hours28, projected,
      hoursTotal: sum(mine.map(hoursOf)),
      lastStudied: mine.map(b => b.date).sort().at(-1) ?? null, ladder,
      dueSoon: sum(pending.filter(a => a.due >= today && a.due <= addDays(today, 14)).map(a => Number(a.weight) || 0)) };
  });

  const rated = units.filter(u => u.r.average != null);
  const credits = u => Number(u.c.credits || 6);
  const sumCredits = sum(rated.map(credits));
  const projWam = sumCredits ? sum(rated.map(u => u.projected * credits(u))) / sumCredits : null;
  const projGpa = sumCredits ? sum(rated.map(u => gradePoints(u.projected) * credits(u))) / sumCredits : null;
  // The floor and ceiling: everything left scored at zero, and at a hundred.
  const marks = f => (sumCredits ? sum(rated.map(u => f(u) * credits(u))) / sumCredits : null);
  const wamFloor = marks(u => u.r.earned);
  const wamCeil = marks(u => u.r.earned + u.r.remaining);

  // Do you do better on the pieces that count? Twenty per cent is the usual line
  // between a weekly quiz and something that decides the grade.
  const heavy = marked.filter(a => Number(a.weight) >= 20), light = marked.filter(a => Number(a.weight) < 20);
  const byKind = Object.keys(ASSESS_KINDS).map(k => {
    const xs = marked.filter(a => a.kind === k);
    return { k, label: ASSESS_KINDS[k], n: xs.length, avg: xs.length ? mean(xs.map(a => Number(a.score))) : null,
      weight: sum(xs.map(a => Number(a.weight) || 0)) };
  }).filter(x => x.n);

  const chron = marked.slice().sort((a, b) => a.due.localeCompare(b.due));
  const fit = slope(chron.map(a => ({ d: dayNo(a.due), y: Number(a.score) })));
  const totalHours = sum(done.map(hoursOf));
  const attributed = sum(units.flatMap(u => u.mine).map(hoursOf));
  const weeklyAll = weeks.map(w => hoursIn(done, addDays(w, -1), addDays(w, 6)));

  const upcoming = all.filter(a => (a.score == null || a.score === '') && a.due >= today).sort((a, b) => a.due.localeCompare(b.due));
  const due14 = upcoming.filter(a => a.due <= addDays(today, 14));
  const clash = (() => {
    // Three days with two or more things due is the week that goes wrong.
    const byDay = {};
    due14.forEach(a => { byDay[a.due] = (byDay[a.due] ?? 0) + 1; });
    const weeksAhead = [0, 1].map(i => due14.filter(a => a.due > addDays(today, i * 7) && a.due <= addDays(today, (i + 1) * 7)));
    return { byDay, worstWeek: weeksAhead.reduce((b, x) => (x.length > b.length ? x : b), []) };
  })();

  return { today, cs, all, marked, units, rated, sum: uniSummary(), projWam, projGpa, wamFloor, wamCeil, heavy, light, byKind,
    chron, fit, weeks, weeklyAll, totalHours, attributed, unattributed: totalHours - attributed,
    upcoming, due14, clash, scale: gpaScale() };
}

// ---------- status ----------
function status(f) {
  const s = f.sum;
  const markedPct = f.all.length ? (sum(f.marked.map(a => Number(a.weight) || 0)) / sum(f.all.map(a => Number(a.weight) || 0))) * 100 : 0;
  if (!s) return { lvl: ['none', 'Nothing marked yet'], text: `${plural(f.all.length, 'assessment')} entered and none marked. Put the marks in as they come back and this page reads the whole semester: what each one was worth, what the rest has to score and where your hours are going.` };
  const b = band(s.wam);
  const risk = f.rated.filter(u => u.projected != null && u.projected < 50);
  if (risk.length) {
    const u = risk[0], p = u.ladder.find(x => x.name === 'P');
    return { lvl: ['low', 'A unit at risk'], text: u.r.remaining <= 0.5
      ? `<b>${esc(u.c.code)}</b> is fully marked at ${fmt(u.r.average)} — below a pass, with nothing left to fix it. Worth asking the faculty about a supplementary assessment today rather than next week.`
      : p.gone
        ? `<b>${esc(u.c.code)}</b> cannot reach 50 any more: even 100% on the remaining ${fmt1(u.r.remaining)}% leaves it at ${fmt(u.r.earned + u.r.remaining)}. Deal with that before anything else on this page.`
        : `<b>${esc(u.c.code)}</b> projects to ${fmt(u.projected)} on current form — below a pass. It needs <b>${fmt(p.need)}%</b> on the remaining ${fmt1(u.r.remaining)}% just to clear 50. Everything else can wait.` };
  }
  if (markedPct < 25) return { lvl: ['ok', 'Early days'], text: `Only <b>${fmt(markedPct)}%</b> of the semester's weight has come back, so a WAM of ${fmt1(s.wam)} is a sketch rather than a result. The grade-needed numbers below are the useful half of this page right now.` };
  if (f.projWam != null && f.projWam >= 85) return { lvl: ['good', 'High distinction pace'], text: `On current form you finish the semester around <b>${fmt1(f.projWam)}</b> — a high distinction average, with ${fmt(100 - markedPct)}% of the weight still to play for.` };
  if (f.projWam != null && f.projWam >= 75) return { lvl: ['good', 'Distinction pace'], text: `Current form puts you at about <b>${fmt1(f.projWam)}</b> for the semester, a distinction average. ${f.rated.some(u => u.ladder.some(x => x.name === 'HD' && !x.gone && !x.locked)) ? 'A high distinction is still reachable in at least one unit — see what it would take below.' : 'Holding this is the job; nothing needs rescuing.'}` };
  if (f.projWam != null && f.projWam >= 65) return { lvl: ['ok', 'Credit pace'], text: `Current form lands the semester near <b>${fmt1(f.projWam)}</b>, a credit average. The remaining ${fmt(100 - markedPct)}% of weight is enough to move that — the numbers below say by how much.` };
  return { lvl: ['ok', `Passing, averaging ${b}`], text: `Your weighted average is <b>${fmt1(s.wam)}</b> across ${plural(s.count, 'unit')}. With ${fmt(100 - markedPct)}% of the weight still to come there is room to lift it; start with whichever unit has the most left.` };
}

// ---------- cards ----------
function heroCard(f, st) {
  const s = f.sum;
  const canvas = `<button class="pill-btn" data-act="${state.kv.canvas?.token ? 'canvasSync' : 'sheet'}" data-sheet="guideCanvas">${icon('repeat')} ${state.kv.canvas?.token ? 'Sync' : 'Canvas'}</button>`;
  return `<section class="card glass hv-hero an-hero">
    <div class="label-sm">Semester report · ${plural(f.cs.length, 'unit')} · ${plural(f.marked.length, 'mark')} in</div>
    <div class="hv-top"><div class="hv-headline">${st.lvl[1]}</div>
      <div class="an-side">${chip([st.lvl[0], s ? `WAM ${fmt1(s.wam)}` : 'No marks yet'])}${canvas}
        <button class="sub-note" data-act="toggleScale">${f.scale}-point GPA ${icon('repeat')}</button></div></div>
    <p class="hv-summary">${st.text}</p>
    <div class="stats an-stats4">
      ${stat('WAM', s ? fmt1(s.wam) : '–', s ? band(s.wam) : 'no marks')}
      ${stat('GPA', s ? s.gpa.toFixed(2) : '–', `of ${f.scale}`)}
      ${stat('Could land', f.wamFloor == null ? '–' : f.wamCeil - f.wamFloor < 0.5 ? fmt(f.wamFloor) : `${fmt(f.wamFloor)}–${fmt(f.wamCeil)}`, f.wamFloor != null && f.wamCeil - f.wamFloor < 0.5 ? 'all marked' : 'floor to ceiling')}
      ${stat('Next due', f.upcoming[0] ? `${daysBetween(f.today, f.upcoming[0].due)}d` : '–', f.upcoming[0] ? esc(courseById(f.upcoming[0].courseId).code) : 'nothing entered')}
    </div>
  </section>`;
}

// Marks against weight: what each result was actually worth to the final grade.
function marksCard(f) {
  if (!f.marked.length) return '';
  const strip = f.chron.slice(-12);
  const ins = [];
  const banked = sum(f.units.map(u => u.r.earned)), droppedW = sum(f.units.map(u => u.lost));
  const weightIn = sum(f.marked.map(a => Number(a.weight) || 0));
  if (weightIn) {
    ins.push(note('school', 'school', `Across every unit you have banked <b>${fmt1(banked)}</b> of the ${fmt1(weightIn)} grade points marked so far, dropping ${fmt1(droppedW)}. Dropped points are the only ones you can never get back.`));
  }
  if (f.heavy.length >= 2 && f.light.length >= 2) {
    const h = mean(f.heavy.map(a => Number(a.score))), l = mean(f.light.map(a => Number(a.score)));
    ins.push(note('scale', Math.abs(h - l) < 4 ? 'diet' : 'move', Math.abs(h - l) < 4
      ? `You score about the same on the big pieces as the small ones (<b>${fmt(h)}</b> vs ${fmt(l)}). Steady under weight is worth more than it sounds.`
      : h < l
        ? `You average <b>${fmt(h)}</b> on assessments worth 20% or more but <b>${fmt(l)}</b> on the small ones — ${fmt(l - h)} points lower exactly where it counts. The small ones are practice; treat the heavy ones as the real exam and start them a week earlier.`
        : `You average <b>${fmt(h)}</b> on assessments worth 20% or more against ${fmt(l)} on the small ones. You rise to the big ones, but the small ones still carry ${fmt1(sum(f.light.map(a => Number(a.weight) || 0)))}% of your grade.`));
  }
  const kinds = f.byKind.filter(x => x.n >= 2).sort((a, b) => a.avg - b.avg);
  if (kinds.length >= 2) {
    ins.push(note('exam', 'work', `By type: ${kinds.map(x => `<b>${x.label.toLowerCase()}s ${fmt(x.avg)}</b>`).join(', ')}. ${kinds[0].avg < kinds.at(-1).avg - 8 ? `${kinds[0].label}s are your weak format and carry ${fmt1(kinds[0].weight)}% of what has been marked — practising the format itself is usually worth more than more content.` : 'No format is letting you down.'}`));
  }
  if (f.fit && f.fit.n >= 4 && Math.abs(f.fit.perWeek) >= 0.3) {
    ins.push(note('chart', f.fit.perWeek > 0 ? 'diet' : 'move', `Marks are trending <b>${signed(f.fit.perWeek * 4, 1)} a month</b> through the semester${f.fit.r2 >= 0.4 ? '' : ' (a loose fit, so read it as a direction, not a rate)'}.`));
  }
  const best = f.marked.reduce((b, a) => (Number(a.score) > Number(b.score) ? a : b));
  const worst = f.marked.reduce((b, a) => (Number(a.score) < Number(b.score) ? a : b));
  if (f.marked.length >= 3) ins.push(note('star', 'school', `Best: <b>${esc(best.title)}</b> ${fmt(best.score)}% (${esc(courseById(best.courseId).code)}, worth ${best.weight}%). Weakest: ${esc(worst.title)} ${fmt(worst.score)}% (${esc(courseById(worst.courseId).code)}, worth ${worst.weight}%).`));

  return `${section('Marks against weight', `${plural(f.marked.length, 'mark')} in`)}
  <section class="card glass">
    <div class="head"><div class="title">${tile('pen', 'school')}Every mark</div><div class="sub-note">height = mark · label = weight</div></div>
    <div class="an-wbars" style="--wb:#cfd0f2;--wbc:var(--school)" role="img" aria-label="Marks in order of due date, with the weight of each">
      ${strip.map((a, i) => `<div class="an-wbar${i === strip.length - 1 ? ' cur' : ''}" title="${esc(a.title)} · ${a.weight}% · ${fmt(a.score)}">
        <i style="height:${clamp(Number(a.score), 2, 100)}%"></i><span>${a.weight ? `${fmt(a.weight)}%` : ''}</span></div>`).join('')}
    </div>
    <p class="note an-foot">Marked assessments in due order${f.chron.length > 12 ? ' · last 12' : ''}. A short bar on a wide weight is the expensive kind of mark.</p>
    <div class="an-units">${f.units.filter(u => u.r.weightDone > 0 || u.r.list.length).map(unitBar).join('')}</div>
    ${notes(ins)}
  </section>`;
}

// One unit: points banked, points dropped, weight still to come.
function unitBar(u) {
  const { r } = u;
  const got = clamp(r.earned, 0, 100), lost = clamp(u.lost, 0, 100 - got);
  return `<div class="an-unit lv-${bandLvl(r.average)}">
    <div class="an-base-h"><span class="t">${tile('book', u.c.color ?? 'school')}${esc(u.c.code)}</span>
      <b>${r.average != null ? `${fmt(r.average)}` : '–'}${r.average != null ? ` <small>${band(r.average)} · ${fmt1(r.weightDone)}% marked</small>` : ' <small>nothing marked</small>'}</b></div>
    <div class="an-stack" role="img" aria-label="Grade points banked, dropped and still to come">
      <i class="got" style="width:${got}%"></i><i class="lost" style="width:${lost}%"></i></div>
    <div class="an-base-f"><span>${fmt1(r.earned)} points banked</span><span>${fmt1(r.remaining)}% still to come${u.lost >= 1 ? ` · ${fmt1(u.lost)} dropped` : ''}</span></div>
  </div>`;
}

// What the work still to come has to score.
function neededCard(f) {
  const live = f.units.filter(u => u.r.remaining > 0.5);
  if (!live.length) {
    return `${section('What the rest has to score')}
    <section class="card glass"><p class="note" style="margin:0">Every unit is fully marked — there is nothing left to score. Final averages are above.</p></section>`;
  }
  const ins = [];
  // The grade you are reaching for: the next band above where current form lands,
  // skipping any that even a perfect run cannot reach.
  const reach = live.filter(u => u.r.average != null).map(u => {
    const up = u.ladder.slice().sort((a, b) => a.min - b.min);
    const nextUp = up.find(x => x.min > (u.projected ?? 0) && !x.locked && !x.gone) ?? up.filter(x => !x.locked && !x.gone).at(-1);
    return { u, nextUp };
  }).filter(x => x.nextUp);
  const stretch = reach.filter(x => x.nextUp.need > (x.u.r.average ?? 0) + 5).sort((a, b) => b.nextUp.need - a.nextUp.need)[0];
  const easy = reach.filter(x => x.nextUp.need <= (x.u.r.average ?? 0)).sort((a, b) => a.nextUp.need - b.nextUp.need)[0];
  if (easy) ins.push(note('target', 'diet', `<b>${esc(easy.u.c.code)}</b> only needs <b>${fmt(easy.nextUp.need)}%</b> on the remaining ${fmt1(easy.u.r.remaining)}% for a ${easy.nextUp.name} — below the ${fmt(easy.u.r.average)} you are already averaging. That grade is yours to lose, not to earn.`));
  if (stretch) ins.push(note('bolt', 'move', `<b>${esc(stretch.u.c.code)}</b> needs <b>${fmt(stretch.nextUp.need)}%</b> on what is left for a ${stretch.nextUp.name}, against the ${fmt(stretch.u.r.average)} you average. That is the gap to decide about: ${stretch.nextUp.need > 90 ? 'it takes a near-perfect run, so be honest about whether the hours are better spent elsewhere' : 'a real step up, but one unit of effort away'}.`));
  const locked = live.filter(u => u.ladder.find(x => x.name === 'P')?.locked);
  if (locked.length) ins.push(note('star', 'school', `${locked.map(u => `<b>${esc(u.c.code)}</b>`).join(', ')} ${locked.length > 1 ? 'have' : 'has'} already banked a pass: even a zero on everything left still clears 50.`));
  const danger = live.filter(u => { const p = u.ladder.find(x => x.name === 'P'); return p && !p.locked && p.need > 60; });
  if (danger.length) ins.push(note('alert', 'move', `<b>${esc(danger[0].c.code)}</b> needs ${fmt(danger[0].ladder.find(x => x.name === 'P').need)}% of the remaining ${fmt1(danger[0].r.remaining)}% just to pass. Check whether the unit has a hurdle requirement on the final exam too.`));
  const partial = f.units.filter(u => u.r.totalWeight > 0 && u.r.totalWeight < 99);
  if (partial.length) ins.push(note('info', 'sleep', `${partial.map(u => esc(u.c.code)).join(', ')} ${partial.length > 1 ? 'have' : 'has'} assessments adding to ${partial.map(u => `${fmt1(u.r.totalWeight)}%`).join(', ')}, not 100. These numbers assume the missing weight exists — add the rest so they are exact.`));

  return `${section('What the rest has to score', 'on the weight still to come')}
  <section class="card glass">
    <div class="an-units">${live.map(u => `<div class="an-unit lv-${bandLvl(u.r.average)}">
      <div class="an-base-h"><span class="t">${tile('book', u.c.color ?? 'school')}${esc(u.c.code)}</span>
        <b>${fmt1(u.r.remaining)}%<small>left${u.next ? ` · next ${dayLabel(u.next.due)}` : ''}</small></b></div>
      <div class="an-needs">${u.ladder.map(x => `<span class="an-need${x.locked ? ' ok' : x.gone ? ' gone' : ''}">${x.name} ${x.locked ? '✓' : x.gone ? 'out of reach' : `${fmt(Math.max(0, x.need))}%`}</span>`).join('')}</div>
      <div class="an-base-f"><span>${u.r.average != null ? `averaging ${fmt(u.r.average)}` : 'nothing marked yet'}</span><span>${fmt(u.r.earned)}–${fmt(u.r.earned + u.r.remaining)} still possible</span></div>
    </div>`).join('')}</div>
    <p class="note an-foot">Each figure is the average the remaining weight needs for that grade. A tick means it is already banked; “out of reach” means even 100% on everything left falls short.</p>
    ${notes(ins)}
  </section>`;
}

// Study hours per unit, set against what each unit is returning.
function hoursCard(f) {
  const withHours = f.units.filter(u => u.hoursTotal > 0 || u.r.average != null);
  if (!withHours.length || (!f.totalHours && !f.marked.length)) return '';
  const maxH = Math.max(...withHours.map(u => u.hours28), 1);
  const perWeek = u => u.hours28 / 4;
  const paired = withHours.filter(u => u.hoursTotal >= 1 && u.r.average != null);
  const r = paired.length >= 3 ? pearson(paired.map(u => u.hoursTotal), paired.map(u => u.r.average)) : null;

  const ins = [];
  if (f.totalHours) {
    const named = sum(f.units.map(u => u.hours28)) / 4;
    ins.push(note('clock', 'school', `You logged <b>${fmtHours(sum(f.weeklyAll) / 8)}</b> of study a week over the last 8 weeks, ${fmtHours(named)} a week of it against a named unit. These are the blocks you remembered to log, so read them as a floor.`));
  }
  if (f.unattributed > 2) ins.push(note('info', 'sleep', `<b>${fmtHours(f.unattributed)}</b> of study is not tied to any unit. Pick the unit on the block, or put the code in its name, and it lands in the right row here.`));
  const starved = paired.filter(u => u.r.average != null).sort((a, b) => (a.hoursTotal / Math.max(1, a.r.totalWeight)) - (b.hoursTotal / Math.max(1, b.r.totalWeight)))[0];
  const fed = paired.sort((a, b) => b.hoursTotal - a.hoursTotal)[0];
  if (fed && starved && fed !== starved) {
    ins.push(note('scale', 'move', `<b>${esc(fed.c.code)}</b> gets the most of your time (${fmtHours(fed.hoursTotal)}, averaging ${fmt(fed.r.average)}) and <b>${esc(starved.c.code)}</b> the least (${fmtHours(starved.hoursTotal)}, averaging ${fmt(starved.r.average)}). ${starved.r.average < fed.r.average ? 'The thinner one is also the weaker one, which is the easiest kind of problem to fix.' : 'The thinner one is doing better per hour — worth asking what you do differently there.'}`));
  }
  if (r != null) {
    ins.push(note('chart', 'work', Math.abs(r) < 0.3
      ? `Across your ${plural(paired.length, 'unit')} hours and marks barely line up (r ${r.toFixed(2)}). With this few units that is normal — how you study is doing more work than how long.`
      : r > 0
        ? `More hours does track higher marks across your units (r ${r.toFixed(2)}), though ${plural(paired.length, 'unit')} is far too few to call it proof.`
        : `The units you spend most on are scoring lowest (r ${r.toFixed(2)}). That usually means the hard unit is getting the hours it needs, not that study hurts — but check the hours are practice, not re-reading.`));
  }
  const cold = f.units.filter(u => u.dueSoon > 0 && (!u.lastStudied || daysBetween(u.lastStudied, f.today) > 10));
  if (cold.length) ins.push(note('alert', 'move', `<b>${esc(cold[0].c.code)}</b> has ${fmt1(cold[0].dueSoon)}% of its grade due inside two weeks and no study logged ${cold[0].lastStudied ? `since ${shortDate(cold[0].lastStudied)}` : 'at all'}.`));

  return `${section('Hours against results', 'study blocks')}
  <section class="card glass">
    <div class="head"><div class="title">${tile('book', 'school')}Study a week</div><div class="sub-note">last 8 weeks</div></div>
    <div class="an-wbars" style="--wb:#cfd0f2;--wbc:var(--school)" role="img" aria-label="Study hours per week over the last 8 weeks">
      ${f.weeklyAll.map((h, i) => `<div class="an-wbar${i === 7 ? ' cur' : ''}" title="${fmtHours(h)}"><i style="height:${(h / Math.max(...f.weeklyAll, 1)) * 100}%"></i><span>${i % 2 === 1 || i === 7 ? shortDate(f.weeks[i]) : ''}</span></div>`).join('')}
    </div>
    <div class="macro-bars an-gap">${withHours.map(u => `<div class="macro an-meter lv-${bandLvl(u.r.average)}"><span>${esc(u.c.code)}</span>
      <div class="track"><div class="fill" style="width:${clamp((u.hours28 / maxH) * 100, 0, 100)}%;background:var(--lvc)"></div></div>
      <b>${fmt1(perWeek(u))} h<small class="lvt">${u.r.average != null ? fmt(u.r.average) : '–'}</small></b></div>`).join('')}</div>
    <p class="note an-foot">Hours a week over the last 4 weeks, with the unit's current average beside it. A block counts toward a unit when you pick one or name its code.</p>
    <div class="stats an-stats3 an-gap">
      ${stat('Study', fmt1(sum(f.weeklyAll) / 8), 'h / week')}
      ${stat('Per unit', withHours.length ? fmt1(sum(withHours.map(perWeek)) / withHours.length) : '–', 'h / week')}
      ${stat('Logged', fmt1(f.totalHours), 'hours total')}
    </div>
    ${notes(ins)}
  </section>`;
}

// What is coming, and how much of the grade is riding on it.
function aheadCard(f) {
  const head = `<div class="head"><div class="title">${tile('calendar', 'school')}Due next</div><button class="sub-note" data-act="sheet" data-sheet="assessment">Add ${icon('plus')}</button></div>`;
  if (!f.upcoming.length) {
    return `${section('What is coming')}
    <section class="card glass">${head}
      <div class="empty">${f.all.length ? 'Everything entered has been marked. Add the rest of the semester’s assessments and this card weighs up what is at stake.' : 'No assessments entered yet. Add them with their weights and Loop can tell you what each one is worth and what the rest has to score.'}</div></section>`;
  }
  const next = f.upcoming.slice(0, 6);
  const w14 = sum(f.due14.map(a => Number(a.weight) || 0));
  const w28 = sum(f.upcoming.filter(a => a.due <= addDays(f.today, 28)).map(a => Number(a.weight) || 0));
  const ins = [];
  if (w14) ins.push(note('calendar', w14 >= 40 ? 'move' : 'school', `<b>${fmt1(w14)}% of grade</b> is due inside two weeks across ${plural(f.due14.length, 'assessment')}. ${w14 >= 40 ? 'That is a heavy fortnight: the order you do them in matters more than the hours.' : 'Manageable, if nothing slips.'}`));
  if (f.clash.worstWeek.length >= 2) {
    const wk = f.clash.worstWeek;
    ins.push(note('alert', 'move', `${plural(wk.length, 'piece')} land in the same week (${wk.map(a => `${esc(courseById(a.courseId).code)} ${shortDate(a.due)}`).join(', ')}), worth ${fmt1(sum(wk.map(a => Number(a.weight) || 0)))}% together. Start the heaviest of them first, not the nearest.`));
  }
  const heaviest = f.upcoming.reduce((b, a) => (Number(a.weight) > Number(b.weight) ? a : b));
  if (Number(heaviest.weight) >= 25) ins.push(note('target', 'school', `The biggest thing left is <b>${esc(heaviest.title)}</b> (${esc(courseById(heaviest.courseId).code)}), worth ${heaviest.weight}% on ${dayLabel(heaviest.due)} — ${plural(Math.max(0, daysBetween(f.today, heaviest.due)), 'day')} away.`));

  return `${section('What is coming', `${plural(f.upcoming.length, 'piece')} left`)}
  <section class="card glass">${head}
    <div class="stats an-stats3">
      ${stat('Due in 7 days', fmt1(sum(f.upcoming.filter(a => a.due <= addDays(f.today, 7)).map(a => Number(a.weight) || 0))), 'grade points')}
      ${stat('In 14 days', fmt1(w14), 'grade points')}
      ${stat('In 28 days', fmt1(w28), 'grade points')}
    </div>
    <p class="note an-foot">Percentage points of a unit's grade, added up across every unit — ${plural(f.cs.length, 'unit')} means ${f.cs.length * 100} points are on the table this semester.</p>
    <div class="list an-gap">${next.map(a => {
      const c = courseById(a.courseId), d = daysBetween(f.today, a.due);
      return `<div class="row tap" data-act="sheet" data-sheet="assessment" data-id="${a.id}" role="button">${tile(a.kind === 'exam' ? 'exam' : 'pen', c.color ?? 'school')}
        <div class="grow"><div class="t">${esc(a.title)}</div><div class="d">${esc(c.code)} · ${ASSESS_KINDS[a.kind] ?? 'Assessment'}${a.weight ? ` · ${a.weight}% of grade` : ''}</div></div>
        <span class="tag ${d <= 2 ? 'hot' : ''}">${d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : `${d} days`}</span></div>`;
    }).join('')}</div>
    ${notes(ins)}
  </section>`;
}

export function uniAnalytics() {
  const cs = courses();
  if (!cs.length) {
    return `<section class="card glass">
      <div class="money-top"><div><div class="label-sm">Semester report</div><div class="big-md" style="color:var(--text-3)">No units yet</div></div>
        <button class="pill-btn" data-act="sheet" data-sheet="course">${icon('plus')} Unit</button></div>
      <p class="note" style="margin:8px 0 0">Add your units and their assessments — or sync them from Canvas — and this page becomes a semester report: every mark against what it was worth, the grade the remaining work needs for each band, and your study hours per unit set against its results.</p>
      <button class="btn soft" style="margin-top:12px" data-act="sheet" data-sheet="guideCanvas">${icon('repeat')} Connect Canvas</button>
    </section>`;
  }
  const f = uniFacts();
  const st = status(f);
  return `${heroCard(f, st)}
  ${marksCard(f)}
  ${neededCard(f)}
  ${hoursCard(f)}
  ${aheadCard(f)}`;
}
