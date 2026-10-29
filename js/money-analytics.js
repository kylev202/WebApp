// Money analytics: a spending report. What each category costs against your own
// recent baseline, whether the things that charge you every month are quietly
// growing, how much of what comes in actually stays, and how long the money on
// hand would last. Everything comes from logged transactions, the balances you
// entered and the bills you set up — nothing is estimated except where it says so.
import { esc, dayKey, addDays, addMonths, daysBetween, monthKey, weekStart, toDate, shortDate, money, fmt, fmt1, mean, sum, plural, clamp } from './util.js';
import { icon, tile } from './icons.js';
import { lineChart, niceMax } from './charts.js';
import { byId } from './data.js';
import { CATEGORIES, SPEND_ACCOUNTS, PER_MONTH, txns, bills, balances, hasBalances } from './money.js';
import { chip, note, notes, signed, stat, section, meter, sd } from './an-ui.js';

// ---------- the constants the report judges against ----------
const WIN = 28;              // every "now" figure is the last four weeks
const BASE_MAX = 8;          // and the baseline is up to eight weeks behind it
// Costs you cannot move this month, costs you can move slowly, and the rest.
const FIXED = ['rent', 'bills', 'phone', 'subscriptions'];
const LIVING = ['groceries', 'transport', 'health', 'uni'];
const FLOOR = [...FIXED, ...LIVING];
const SAFE_MONTHS = 3;       // the usual emergency-fund floor
const GOOD_RATE = 20, OK_RATE = 10;  // savings rate, as a share of what comes in
const CYCLE_DAYS = { weekly: 7, fortnightly: 14, monthly: 30.4, quarterly: 91, yearly: 365 };

const norm = s => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const median = xs => { const s = xs.slice().sort((a, b) => a - b); const n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : 0; };
const perMonth = (total, days) => (days > 0 ? (total / days) * 30.4 : 0);
const pctOf = (a, b) => (b ? (a / b) * 100 : null);
// "+A$52" / "−A$18": a change in money always says which way it went.
const signedMoney = n => `${n >= 0 ? '+' : '−'}${money(Math.abs(n), false)}`;

// ---------- the numbers ----------
function moneyFacts() {
  const today = dayKey();
  const all = txns();                        // newest first
  const amt = t => Number(t.amount) || 0;
  const total = list => sum(list.map(amt));
  const exp = all.filter(t => t.kind === 'expense');
  const inc = all.filter(t => t.kind === 'income');
  const span = (list, from, to = today) => list.filter(t => t.date > from && t.date <= to);

  const first = all.length ? all.map(t => t.date).reduce((a, b) => (a < b ? a : b)) : today;
  const logged = daysBetween(first, today) + 1;

  // The window, and the baseline behind it: up to eight weeks, however much of
  // that you have actually logged. Fewer than two weeks and there is no baseline.
  const cut = addDays(today, -WIN);
  const win = span(exp, cut), winInc = span(inc, cut);
  const baseDays = clamp(daysBetween(first, cut), 0, BASE_MAX * 7);
  const baseReady = baseDays >= 14;
  const baseList = baseReady ? span(exp, addDays(cut, -baseDays), cut) : [];
  const baseWeeks = baseReady ? baseDays / 7 : 0;
  const per4 = v => (baseWeeks ? (v / baseWeeks) * 4 : null);

  const spent = total(win), earned = total(winInc);
  const baseSpend = baseReady ? per4(total(baseList)) : null;

  const cats = Object.entries(CATEGORIES).map(([k, c]) => {
    const now = win.filter(t => t.category === k);
    const b4 = baseReady ? per4(total(baseList.filter(t => t.category === k))) : null;
    const n4 = total(now);
    return { k, label: c.label, icon: c.icon, area: c.area, n: now.length, n4, b4,
      delta: b4 == null ? null : n4 - b4, pct: pctOf(n4 - (b4 ?? 0), b4), each: now.length ? n4 / now.length : null };
  }).filter(c => c.n4 > 0 || (c.b4 ?? 0) > 0).sort((a, b) => b.n4 - a.n4);

  // Twelve weeks of spending, so the window has something to sit in.
  const w0 = weekStart();
  const weeks = Array.from({ length: 12 }, (_, i) => addDays(w0, (i - 11) * 7));
  const weekly = weeks.map(w => total(exp.filter(t => t.date >= w && t.date <= addDays(w, 6))));

  const months = Array.from({ length: 6 }, (_, i) => monthKey(addMonths(`${monthKey()}-01`, i - 5)));
  const monthly = months.map(m => {
    const list = all.filter(t => monthKey(t.date) === m);
    const out = total(list.filter(t => t.kind === 'expense'));
    const got = total(list.filter(t => t.kind === 'income'));
    return { m, out, got, kept: got - out, rate: got > 0 ? ((got - out) / got) * 100 : null };
  });

  // Burn and earn over the last 90 days (or all of it, if you started later):
  // a month is too short a window to steer a runway by.
  const days90 = Math.min(90, logged);
  const from90 = addDays(today, -days90);
  const burn = perMonth(total(span(exp, from90)), days90);
  const earn = perMonth(total(span(inc, from90)), days90);
  const net = earn - burn;
  const floor = perMonth(total(span(exp, from90).filter(t => FLOOR.includes(t.category))), days90);
  const fixed = perMonth(total(span(exp, from90).filter(t => FIXED.includes(t.category))), days90);
  const flexible = Math.max(0, burn - floor);

  const rate28 = earned > 0 ? ((earned - spent) / earned) * 100 : null;
  const rate90 = earn > 0 ? (net / earn) * 100 : null;
  const toGoals = perMonth(total(span(all, from90).filter(t => t.goalId)), days90);
  const incSd = sd(monthly.filter(x => x.got > 0).map(x => x.got));

  const bal = hasBalances() ? balances() : null;
  const spendable = bal ? SPEND_ACCOUNTS.reduce((t, k) => t + (bal[k] ?? 0), 0) : null;
  const saved = bal ? bal.savings ?? 0 : null;
  const runway = spendable != null && burn > 0 ? spendable / burn : null;
  const runwayAll = spendable != null && burn > 0 ? (spendable + saved) / burn : null;
  const runwayFloor = spendable != null && floor > 0 ? spendable / floor : null;
  // At your actual net, not at zero income: the number that says whether the
  // balance is growing or being eaten.
  const drain = spendable != null && net < 0 ? spendable / -net : null;

  const noSpend = Array.from({ length: WIN }, (_, i) => addDays(today, -i)).filter(d => !exp.some(t => t.date === d)).length;
  const biggest = win.reduce((b, t) => (amt(t) > amt(b ?? t) ? t : b), null);

  return { today, all, exp, inc, logged, first, win, winInc, spent, earned, baseReady, baseWeeks, baseSpend,
    cats, weeks, weekly, months, monthly, burn, earn, net, floor, fixed, flexible, days90,
    rate28, rate90, toGoals, incSd, bal, spendable, saved, runway, runwayAll, runwayFloor, drain, noSpend, biggest,
    recurring: recurringFacts(exp, today, first) };
}

// ---------- what charges you again and again ----------
// Every bill you set up, plus any merchant whose charges come back on a regular
// gap. Grouped by bill where there is one, by name otherwise.
function recurringFacts(exp, today, first) {
  // Three months against the three before — but never further back than the log
  // goes, or everything would read as newly added.
  const nowFrom = addDays(today, -91);
  const thenFrom = [addDays(today, -182), addDays(first, -1)].sort().at(-1);
  const comparableDays = daysBetween(thenFrom, nowFrom);
  const groups = new Map();
  exp.forEach(t => {
    const key = t.billId ? `bill:${t.billId}` : norm(t.merchant) ? `m:${norm(t.merchant)}` : null;
    if (!key) return;
    const g = groups.get(key) ?? { key, billId: t.billId ?? null, name: t.merchant || CATEGORIES[t.category]?.label || 'Recurring', cat: t.category, rows: [] };
    g.rows.push({ date: t.date, amount: Number(t.amount) || 0 });
    groups.set(key, g);
  });
  // Bills you have set up but never paid through Loop still cost you money.
  bills().forEach(b => {
    const key = `bill:${b.id}`;
    if (!groups.has(key)) groups.set(key, { key, billId: b.id, name: b.name, cat: b.category, rows: [] });
  });

  const items = [...groups.values()].map(g => {
    const rows = g.rows.slice().sort((a, b) => a.date.localeCompare(b.date));
    const gaps = rows.slice(1).map((r, i) => daysBetween(rows[i].date, r.date)).filter(x => x > 0);
    const bill = g.billId ? byId(g.billId) : null;
    const every = bill ? CYCLE_DAYS[bill.cycle] ?? 30.4 : gaps.length ? median(gaps) : null;
    // A subscription charges the same amount on the same gap. A shop you happen to
    // visit often does neither, and counting it would make this card meaningless.
    const amts = rows.map(r => r.amount), med = median(amts);
    const steadyAmt = med > 0 && amts.filter(a => Math.abs(a - med) <= Math.max(1, med * 0.12)).length >= Math.ceil(rows.length * 0.7);
    const steadyGap = gaps.length >= 2 && gaps.filter(g => Math.abs(g - every) <= Math.max(3, every * 0.25)).length >= Math.ceil(gaps.length * 0.7);
    const repeats = !!bill || (rows.length >= 3 && every >= 5 && every <= 45 && steadyAmt && steadyGap);
    // A quarterly or yearly charge lands in one window and not the other, so it is
    // spread over the months it covers instead of counted where it fell.
    // What it costs a month: the typical charge inside the window, spread over its
    // own cycle. Counting the charges that happen to fall in a 91-day window would
    // swing a fortnightly bill by a whole payment depending on where the edge lands.
    const costIn = (from, to) => {
      if (!rows.length || !every) return 0;
      const inside = rows.filter(r => r.date > from && r.date <= to);
      if (inside.length) return (median(inside.map(r => r.amount)) * 30.4) / every;
      // A quarterly or yearly charge covers months it does not land in.
      const live = every > 60 && rows[0].date <= to && rows.at(-1).date > addDays(to, -Math.min(every * 1.7, 430));
      return live ? (median(rows.map(r => r.amount)) * 30.4) / every : 0;
    };
    const declared = bill ? (Number(bill.amount) || 0) * PER_MONTH[bill.cycle] : 0;
    const charged = costIn(nowFrom, today);
    const now = bill ? charged || declared : charged;
    const then = costIn(thenFrom, nowFrom) || (bill && bill.date <= nowFrom ? declared : 0);
    return { ...g, rows, every, repeats, bill, declared, now, then, last: rows.at(-1)?.date ?? null, hits: rows.length };
  }).filter(x => x.repeats && (x.now > 0 || x.then > 0)).sort((a, b) => b.now - a.now);

  const monthlyNow = sum(items.map(x => x.now));
  const monthlyThen = sum(items.map(x => x.then));
  const rises = sum(items.filter(x => x.then > 0 && x.now > x.then).map(x => x.now - x.then));
  const falls = sum(items.filter(x => x.then > 0 && x.now < x.then && x.now > 0).map(x => x.then - x.now));
  const added = sum(items.filter(x => !x.then && x.now).map(x => x.now));
  const dropped = sum(items.filter(x => !x.now && x.then).map(x => x.then));
  const committed = bills().reduce((t, b) => t + (Number(b.amount) || 0) * PER_MONTH[b.cycle], 0);
  const stale = items.filter(x => x.now > 0 && x.last && daysBetween(x.last, today) > Math.max(45, x.every * 1.6));
  return { items, monthlyNow, monthlyThen, creep: monthlyNow - monthlyThen, rises, falls, added, dropped, committed, stale,
    comparable: comparableDays >= 45 && items.some(x => x.then > 0) };
}

// ---------- status ----------
// Savings rate says whether the month pays for itself; runway says how long a bad
// one could last. Neither is the whole picture on its own.
function status(f) {
  if (f.logged < 14 || !f.exp.length) return { lvl: ['none', 'Building a baseline'], text: 'Four weeks of logged spending unlock the category baseline, recurring-cost tracking and a savings rate. Keep logging — a CSV import from Westpac or Revolut fills it in fast.' };
  if (f.earn <= 0) return { lvl: ['none', 'No income logged'], text: `Spending averages <b>${money(f.burn, false)} a month</b> over the last ${f.days90} days, but no income is logged, so there is no savings rate to read. Log your pay or add it from a shift.` };
  if (f.net < 0 && f.drain != null && f.drain < 2) return { lvl: ['low', 'Running down fast'], text: `You are spending <b>${money(-f.net, false)} a month</b> more than you earn, with about <b>${fmt1(f.drain)} months</b> of spendable cash behind it. This is the one that needs a decision now: the flexible ${money(f.flexible, false)} a month is where it is cheapest to find.` };
  if (f.net < 0) return { lvl: ['low', 'Spending more than you earn'], text: `Out is <b>${money(-f.net, false)} a month</b> ahead of in over the last ${f.days90} days. Nothing breaks immediately, but no month fixes itself — cutting ${money(Math.min(f.flexible, -f.net), false)} of flexible spend would square it.` };
  if (f.rate90 >= GOOD_RATE) return { lvl: ['good', 'Building savings'], text: `You keep <b>${Math.round(f.rate90)}%</b> of what comes in, ${money(f.net, false)} a month. That is above the ${GOOD_RATE}% most people aim at; the job now is keeping it while the recurring costs below stay flat.` };
  if (f.rate90 >= OK_RATE) return { lvl: ['ok', 'Living within your means'], text: `You keep <b>${Math.round(f.rate90)}%</b> of what comes in, ${money(f.net, false)} a month. Steady. Another ${money((GOOD_RATE / 100) * f.earn - f.net, false)} a month would put you at ${GOOD_RATE}%.` };
  return { lvl: ['ok', 'Breaking even'], text: `You keep <b>${Math.round(f.rate90)}%</b> of what comes in — ${money(f.net, false)} a month on ${money(f.earn, false)} earned. It works until something unexpected arrives; the recurring costs below are usually where the first ${money(Math.max(40, f.earn * 0.05), false)} is hiding.` };
}

// ---------- cards ----------
function heroCard(f, st) {
  const d = f.baseSpend != null ? f.spent - f.baseSpend : null;
  return `<section class="card glass hv-hero an-hero">
    <div class="label-sm">Money report · last 4 weeks against the ${f.baseReady ? `${fmt1(f.baseWeeks)} weeks before` : 'rest of your log'}</div>
    <div class="hv-top"><div class="hv-headline">${st.lvl[1]}</div>${chip([st.lvl[0],
      f.rate90 != null ? `${Math.round(f.rate90)}% kept` : `${money(f.burn, false)}/month out`])}</div>
    <p class="hv-summary">${st.text}</p>
    <div class="stats an-stats4">
      ${stat('In', money(f.earned, false), '4 weeks')}
      ${stat('Out', money(f.spent, false), d != null ? `${d >= 0 ? '+' : '−'}${money(Math.abs(d), false)} vs base` : '4 weeks')}
      ${stat('Kept', money(f.earned - f.spent, false), f.rate28 != null ? `${Math.round(f.rate28)}% of in` : 'no income logged')}
      ${stat('Runway', f.runway != null ? `${fmt1(f.runway)}` : '–', f.runway != null ? 'months' : 'set balances')}
    </div>
  </section>`;
}

// Spend by category against what the same category used to cost you.
function baselineCard(f) {
  if (!f.cats.length) return '';
  const scale = Math.max(...f.cats.map(c => Math.max(c.n4, c.b4 ?? 0)), 1);
  const pos = v => clamp((v / scale) * 100, 0, 100);
  const lvlOf = c => (c.b4 == null ? ['none', 'no baseline']
    : c.b4 <= 0 ? ['low', 'new']
      : !c.n4 ? ['good', 'stopped']
        : c.pct >= 25 ? ['low', `up ${Math.round(c.pct)}%`]
          : c.pct <= -20 ? ['good', `down ${Math.round(-c.pct)}%`] : ['ok', 'steady']);

  const row = c => {
    const lvl = lvlOf(c);
    return `<div class="an-base lv-${lvl[0]}">
      <div class="an-base-h"><span class="t">${tile(c.icon, c.area)}${c.label}</span>
        <b>${money(c.n4, false)}${c.b4 != null ? ` <small>was ${money(c.b4, false)}</small>` : ''}</b></div>
      <div class="an-base-bar"><div class="fill" style="width:${pos(c.n4)}%"></div>${c.b4 != null && c.b4 > 0 ? `<i class="base" style="left:${pos(c.b4)}%"></i>` : ''}</div>
      <div class="an-base-f"><span>${lvl[1]}</span><span>${c.n ? `${plural(c.n, 'time')} · ${money(c.each, false)} each` : 'nothing this window'}</span></div>
    </div>`;
  };

  const weeklyBase = f.baseSpend != null ? f.baseSpend / 4 : null;
  const movers = f.cats.filter(c => c.delta != null && (c.b4 ?? 0) > 0);
  const up = movers.filter(c => c.delta > 10).sort((a, b) => b.delta - a.delta);
  const down = movers.filter(c => c.delta < -10).sort((a, b) => a.delta - b.delta);
  const fresh = f.cats.filter(c => c.b4 === 0 && c.n4 > 20);
  const ins = [];
  if (!f.baseReady) {
    ins.push(note('info', 'money', `You have ${plural(f.logged, 'day')} logged in total, not yet enough to leave a baseline sitting behind this window. It opens up at six weeks.`));
  } else if (up.length) {
    const c = up[0];
    ins.push(note('chart', 'move', `<b>${c.label}</b> is ${money(c.delta, false)} above its own baseline — ${money(c.n4, false)} against ${money(c.b4, false)}, ${Math.round(c.pct)}% more. That is ${money(c.delta / 4, false)} a week, or ${money(c.delta * 12, false)} a year if it stays.`));
  }
  if (up.length > 1) ins.push(note('info', 'school', `Also up: ${up.slice(1, 4).map(c => `<b>${c.label}</b> ${signedMoney(c.delta)}`).join(', ')}.`));
  if (down.length) ins.push(note('star', 'diet', `<b>${down[0].label}</b> is down ${money(-down[0].delta, false)} on its baseline${down.length > 1 ? `, and ${plural(down.length - 1, 'other category is', 'other categories are')} lower too` : ''}. Worth knowing what you changed.`));
  if (fresh.length) ins.push(note('plus', 'money', `New this window: ${fresh.map(c => `<b>${c.label}</b> ${money(c.n4, false)}`).join(', ')}. Nothing in the baseline to compare against.`));
  const topShare = f.cats[0] && f.spent ? (f.cats[0].n4 / f.spent) * 100 : null;
  if (topShare >= 30) ins.push(note('target', 'work', `<b>${f.cats[0].label}</b> alone is ${Math.round(topShare)}% of everything you spent. One category that large means the budget lives or dies on it.`));
  if (f.noSpend) ins.push(note('calendar', 'sleep', `<b>${plural(f.noSpend, 'no-spend day')}</b> out of the last ${WIN}. They are the cheapest habit there is.`));
  if (f.biggest) ins.push(note('card', 'money', `Biggest single expense was <b>${money(Number(f.biggest.amount))}</b>${f.biggest.merchant ? ` at ${esc(f.biggest.merchant)}` : ''} on ${shortDate(f.biggest.date)}.`));

  return `${section('Spend against baseline', `${WIN} days vs ${f.baseReady ? `${fmt1(f.baseWeeks)} weeks` : 'no baseline'}`)}
  <section class="card glass">
    <div class="hv-top"><div><div class="label-sm">Spent in the last 4 weeks</div>
      <div class="big-xl">${money(f.spent, false)}${f.baseSpend != null ? `<small>baseline ${money(f.baseSpend, false)}</small>` : ''}</div></div>
      ${f.baseSpend != null ? chip(f.spent > f.baseSpend * 1.1 ? ['low', `${signed(((f.spent - f.baseSpend) / f.baseSpend) * 100, 0)}%`] : f.spent < f.baseSpend * 0.9 ? ['good', `${signed(((f.spent - f.baseSpend) / f.baseSpend) * 100, 0)}%`] : ['ok', 'In line']) : ''}</div>
    ${lineChart({ series: [{ values: f.weekly.map(v => v || null), color: 'var(--money)', fill: true }],
      labels: f.weeks.map((w, i) => (i === 11 ? 'This wk' : i % 3 === 0 ? shortDate(w) : '')),
      max: niceMax(Math.max(...f.weekly, weeklyBase ?? 0) * 1.1) || 100, goal: weeklyBase ?? undefined, live: true,
      yAxis: v => money(v, false), empty: 'Log a few expenses to see the weekly line.' })}
    <p class="note an-foot">One point per week${weeklyBase != null ? ` · dashed line is your baseline week, ${money(weeklyBase, false)}` : ''}.</p>
    <div class="an-bases">${f.cats.slice(0, 10).map(row).join('')}</div>
    ${notes(ins)}
  </section>`;
}

// Recurring costs: the ones that charge you whether you think about them or not.
function recurringCard(f) {
  const r = f.recurring;
  if (!r.items.length) {
    return `${section('Recurring costs')}
    <section class="card glass">
      <div class="head"><div class="title">${tile('repeat', 'sleep')}Recurring costs</div></div>
      <p class="note" style="margin:0">Nothing repeating found yet. Add your rent, phone, gym and subscriptions on the Bills tab and this card tracks what they cost a month, what they cost six months ago, and anything that crept up in between.</p>
    </section>`;
  }
  const share = pctOf(r.monthlyNow, f.earn);
  const lvl = r.creep > Math.max(15, r.monthlyThen * 0.1) ? ['low', `${signedMoney(r.creep)}/month`]
    : r.creep < -10 ? ['good', `${money(r.creep, false)}/month`]
      : r.comparable ? ['ok', 'Flat'] : ['none', 'No history yet'];
  // A few dollars either way on a variable bill is not news; five per cent is.
  const moved = x => Math.abs(x.now - x.then) >= Math.max(3, x.then * 0.05);
  const itemLvl = x => (!x.now ? ['good', 'dropped'] : !x.then ? ['low', 'new'] : !moved(x) ? ['none', 'same']
    : x.now > x.then ? ['low', `+${money(x.now - x.then, false)}`] : ['good', `−${money(x.then - x.now, false)}`]);

  const ins = [];
  if (r.comparable) {
    ins.push(note('repeat', r.creep > 0 ? 'move' : 'diet', Math.abs(r.creep) < 5
      ? `Recurring costs are flat at <b>${money(r.monthlyNow, false)} a month</b> against the three months before. Nothing is drifting.`
      : `Recurring costs are <b>${money(Math.abs(r.creep), false)} a month ${r.creep > 0 ? 'higher' : 'lower'}</b> than the three months before — ${money(Math.abs(r.creep) * 12, false)} a year. ${r.creep > 0 ? 'Price rises and new sign-ups both land here, and neither announces itself.' : 'Whatever you cancelled, it stuck.'}`));
  }
  if (r.added > 0) ins.push(note('plus', 'money', `<b>${money(r.added, false)} a month</b> of that is things that were not charging you three months ago: ${r.items.filter(x => !x.then && x.now).slice(0, 3).map(x => esc(x.name)).join(', ')}.`));
  if (r.rises > 0) ins.push(note('chart', 'move', `<b>${money(r.rises, false)} a month</b> is the same things costing more. ${r.items.filter(x => x.then > 0 && x.now > x.then && moved(x)).slice(0, 3).map(x => `${esc(x.name)} ${money(x.then, false)} → ${money(x.now, false)}`).join(', ')}.`));
  if (r.dropped > 0) ins.push(note('star', 'diet', `You stopped ${money(r.dropped, false)} a month of it: ${r.items.filter(x => !x.now && x.then).slice(0, 3).map(x => esc(x.name)).join(', ')}.`));
  if (share != null) ins.push(note('target', 'work', share > 60
    ? `Recurring costs take <b>${Math.round(share)}%</b> of what you earn. Above about half, a thin month has nowhere to give — the only fix is cancelling something, not spending carefully.`
    : `Recurring costs take <b>${Math.round(share)}%</b> of what you earn, leaving ${money(Math.max(0, f.earn - r.monthlyNow), false)} a month that is actually yours to decide about.`));
  if (r.stale.length) ins.push(note('clock', 'sleep', `No charge from <b>${r.stale.slice(0, 2).map(x => esc(x.name)).join(' or ')}</b> for a while, but it is still counted as committed. If it is cancelled, take it off the Bills tab.`));
  const yearly = r.items.filter(x => x.every > 180);
  if (yearly.length) ins.push(note('calendar', 'school', `${plural(yearly.length, 'yearly charge')} (${yearly.slice(0, 2).map(x => esc(x.name)).join(', ')}) spread out to ${money(sum(yearly.map(x => x.now)), false)} a month here, so one big invoice does not read as a spike.`));

  return `${section('Recurring costs', 'per month')}
  <section class="card glass">
    <div class="hv-top"><div><div class="label-sm">Charging you every cycle</div>
      <div class="big-xl">${money(r.monthlyNow, false)}<small>${money(r.monthlyNow * 12, false)} a year</small></div></div>${chip(lvl)}</div>
    ${r.comparable ? `<div class="flow">
      <div style="background:var(--move-bg)"><div class="k" style="color:var(--move-ink)">Price rises</div><div class="n">${money(r.rises, false)}</div></div>
      <div style="background:var(--school-bg)"><div class="k" style="color:var(--school-ink)">Added</div><div class="n">${money(r.added, false)}</div></div>
      <div style="background:var(--diet-bg)"><div class="k" style="color:var(--diet-ink)">Dropped</div><div class="n">${money(r.dropped + r.falls, false)}</div></div>
    </div>` : ''}
    <div class="list tight an-gap">${r.items.slice(0, 10).map(x => {
      const l = itemLvl(x);
      const c = CATEGORIES[x.cat] ?? CATEGORIES.other;
      return `<div class="row${x.billId ? ' tap' : ' plain'}"${x.billId ? ` data-act="sheet" data-sheet="bill" data-id="${x.billId}" role="button"` : ''}>${tile(c.icon, c.area)}
        <div class="grow"><div class="t">${esc(x.name)}</div><div class="d">${x.every ? `every ${x.every <= 8 ? 'week' : x.every <= 20 ? 'fortnight' : x.every <= 45 ? 'month' : x.every <= 120 ? 'quarter' : 'year'}` : 'repeating'}${x.hits ? ` · ${plural(x.hits, 'charge')} logged` : ' · never charged here'}</div></div>
        <div class="an-lift"><div class="amt">${money(x.now, false)}</div><div class="an-delta ${l[0] === 'low' ? 'down' : l[0] === 'good' ? 'up' : ''}">${l[1]}</div></div></div>`;
    }).join('')}</div>
    <div class="stats an-stats3 an-gap">
      ${stat('Committed', money(r.committed, false), 'bills set up')}
      ${stat('Share of income', share != null ? `${Math.round(share)}%` : '–', 'per month')}
      ${stat('Items', `${r.items.length}`, 'repeating')}
    </div>
    <p class="note an-foot">Every bill you set up, plus any merchant charging you on a regular gap. “Added” and “price rises” compare the last three months with the three before.</p>
    ${notes(ins)}
  </section>`;
}

// Savings rate: of everything that came in, what is still here.
function savingsCard(f) {
  if (f.earn <= 0 && !f.monthly.some(x => x.got > 0)) return '';
  const rate = f.rate90;
  const lvl = rate == null ? ['none', 'No income logged'] : rate >= GOOD_RATE ? ['good', 'Strong'] : rate >= OK_RATE ? ['ok', 'Fair'] : rate > 0 ? ['ok', 'Thin'] : ['low', 'Negative'];
  const keptVals = f.monthly.map(x => (x.got || x.out ? x.kept : null));
  const best = f.monthly.filter(x => x.got > 0).reduce((b, x) => (b == null || x.kept > b.kept ? x : b), null);
  const deficits = f.monthly.filter(x => (x.got || x.out) && x.kept < 0).length;
  const mName = m => toDate(`${m}-01`).toLocaleDateString('en-AU', { month: 'short' });

  const ins = [];
  if (rate != null) {
    ins.push(note('piggy', rate >= OK_RATE ? 'diet' : 'move', rate <= 0
      ? `Nothing is staying: you spend <b>${money(-f.net, false)} more a month</b> than comes in. Everything else on this page is downstream of that one line.`
      : `You keep <b>${Math.round(rate)}%</b> of what comes in — ${money(f.net, false)} of ${money(f.earn, false)} a month. ${rate >= GOOD_RATE ? `At this rate a year puts ${money(f.net * 12, false)} aside.` : `Getting to ${GOOD_RATE}% means finding ${money((GOOD_RATE / 100) * f.earn - f.net, false)} a month; your flexible spend is ${money(f.flexible, false)}.`}`));
  }
  if (deficits) ins.push(note('info', 'move', `${plural(deficits, 'month')} of the last 6 spent more than came in. A single bad month is noise; two in a row is the pattern worth naming.`));
  if (f.incSd != null && f.earn > 0 && f.incSd / f.earn > 0.3) ins.push(note('chart', 'work', `Your income swings by about <b>${money(f.incSd, false)} a month</b>. With pay that uneven, a rate measured over one month means little — the 3-month figure is the one to steer by, and the floor below is what a thin month has to cover.`));
  if (f.toGoals > 0) ins.push(note('target', 'sleep', `<b>${money(f.toGoals, false)} a month</b> of it goes into savings goals. Money moved on purpose is the part that survives the month.`));
  else if (f.net > 50) ins.push(note('target', 'sleep', `You are keeping ${money(f.net, false)} a month but none of it is assigned to a savings goal. Money without a name tends to get spent.`));

  return `${section('Savings rate', 'last 3 months')}
  <section class="card glass">
    <div class="head"><div class="title">${tile('piggy', 'sleep')}Of what comes in, what stays</div>${chip(lvl)}</div>
    <div class="an-score"><div class="big-xl">${rate != null ? `${Math.round(rate)}%` : '–'}<small>${money(f.net, false)} a month</small></div>
      <p class="note">Income minus everything you spent, over the last ${f.days90} days.</p></div>
    <div class="macro-bars">
      ${meter('You keep', clamp(rate ?? 0, 0, 100), rate != null ? `${Math.round(rate)}%` : '–', 'var(--diet)')}
      ${meter('Aim', GOOD_RATE, `${GOOD_RATE}%`, 'rgba(0,0,0,.14)')}
    </div>
    <div class="head an-gap"><div class="title">Kept each month</div><div class="sub-note">dashed = breaking even</div></div>
    ${lineChart({ series: [{ values: keptVals, color: 'var(--diet-ink)', straight: true }], labels: f.monthly.map(x => mName(x.m)),
      min: Math.min(0, ...keptVals.filter(v => v != null)) * 1.1, max: niceMax(Math.max(10, ...keptVals.filter(v => v != null)) * 1.15),
      goal: 0, live: true, yAxis: v => money(v, false), empty: 'Log income and spending to see what each month kept.' })}
    <div class="stats an-stats4 an-gap">
      ${stat('In', money(f.earn, false), 'per month')}
      ${stat('Out', money(f.burn, false), 'per month')}
      ${stat('Best month', best ? money(best.kept, false) : '–', best ? mName(best.m) : '')}
      ${stat('To goals', money(f.toGoals, false), 'per month')}
    </div>
    ${notes(ins)}
  </section>`;
}

// Cash runway: how long the money on hand covers the way you actually live.
function runwayCard(f) {
  if (f.spendable == null) {
    return `${section('Cash runway')}
    <section class="card glass">
      <div class="money-top"><div><div class="label-sm">Cash runway</div><div class="big-md" style="color:var(--text-3)">Balances not set up</div></div>
        <button class="pill-btn" data-act="sheet" data-sheet="balances">${icon('plus')} Set up</button></div>
      <p class="note" style="margin:8px 0 0">Enter what is in Westpac, Revolut, cash and savings once. Loop then reads it against your ${money(f.burn, false)}-a-month spending and says how many months you are covered for.</p>
    </section>`;
  }
  const lvl = f.runway == null ? ['none', 'Need spending history']
    : f.runway >= SAFE_MONTHS ? ['good', `${fmt1(f.runway)} months`]
      : f.runway >= 1 ? ['ok', `${fmt1(f.runway)} months`] : ['low', `${fmt1(f.runway)} months`];
  // 0 to 6 months, with the usual 3-month floor shaded.
  const hi = 6, pos = v => clamp((v / hi) * 100, 0, 100);
  const parts = [['Fixed', f.fixed, 'var(--sleep)'], ['Living', Math.max(0, f.floor - f.fixed), 'var(--work)'], ['Flexible', f.flexible, 'var(--school)']].filter(p => p[1] > 0);
  const partTotal = sum(parts.map(p => p[1])) || 1;

  const ins = [];
  if (f.runway != null) {
    ins.push(note('wallet', f.runway >= SAFE_MONTHS ? 'diet' : 'move', f.runway >= SAFE_MONTHS
      ? `<b>${fmt1(f.runway)} months</b> of spendable cash at your current ${money(f.burn, false)} a month. That clears the ${SAFE_MONTHS}-month floor most advice asks for, so a lost shift or a car repair is an inconvenience rather than a problem.`
      : `<b>${fmt1(f.runway)} months</b> of spendable cash at ${money(f.burn, false)} a month, under the ${SAFE_MONTHS}-month floor. Getting there needs ${money(Math.max(0, SAFE_MONTHS * f.burn - f.spendable), false)} more put aside${f.net > 0 ? `, about ${plural(Math.ceil((SAFE_MONTHS * f.burn - f.spendable) / f.net), 'month')} at what you currently keep` : ''}.`));
  }
  if (f.runwayFloor != null && f.runwayFloor > (f.runway ?? 0)) ins.push(note('target', 'work', `Cut back to rent, bills, food and transport only — ${money(f.floor, false)} a month — and the same cash lasts <b>${fmt1(f.runwayFloor)} months</b>. That gap is what the flexible ${money(f.flexible, false)} is really costing you in security.`));
  if (f.saved > 0 && f.runwayAll != null) ins.push(note('piggy', 'sleep', `Counting the ${money(f.saved, false)} in savings takes it to <b>${fmt1(f.runwayAll)} months</b> — worth knowing, but savings you are saving for something else is not an emergency fund.`));
  if (f.drain != null) ins.push(note('alert', 'move', `At your current net you are drawing down <b>${money(-f.net, false)} a month</b>, so the spendable balance empties in about <b>${plural(Math.round(f.drain), 'month')}</b> if nothing changes.`));
  else if (f.net > 0) ins.push(note('chart', 'diet', `The balance is growing by about <b>${money(f.net, false)} a month</b>, which adds roughly ${fmt1(f.net / Math.max(f.burn, 1))} months of runway every month that holds.`));
  if (f.flexible > 0 && f.burn > 0) {
    const cut = Math.min(f.flexible, Math.max(50, f.flexible * 0.25));
    ins.push(note('bolt', 'school', `Trimming <b>${money(cut, false)} a month</b> of flexible spending lowers the burn to ${money(f.burn - cut, false)} and stretches the same cash to <b>${fmt1(f.spendable / (f.burn - cut))} months</b>.`));
  }

  return `${section('Cash runway', `at ${money(f.burn, false)} a month`)}
  <section class="card glass">
    <div class="hv-top"><div><div class="label-sm">Spendable cash would last</div>
      <div class="big-xl">${f.runway != null ? fmt1(f.runway) : '–'}<small>months · ${money(f.spendable, false)} on hand</small></div></div>${chip(lvl)}</div>
    ${f.runway != null ? `<div class="an-gauge" role="img" aria-label="Months of runway against the three-month floor">
      <div class="band" style="left:${pos(SAFE_MONTHS)}%;width:${100 - pos(SAFE_MONTHS)}%"></div>
      <i class="zero" style="left:${pos(1)}%"></i><i class="mark" style="left:${pos(f.runway)}%"></i></div>
    <div class="an-scale"><span>0</span><span style="left:${pos(1)}%">1 mo</span><span class="band-l" style="left:${pos(SAFE_MONTHS)}%">${SAFE_MONTHS}-month floor</span><span>6+</span></div>` : ''}
    <div class="label-sm an-gap">What the month is made of · ${money(f.burn, false)}</div>
    <div class="hv-split" role="img" aria-label="Share of monthly spending by how fixed it is">${parts.map(p => `<i style="flex:${p[1]};background:${p[2]}"></i>`).join('')}</div>
    <div class="hv-legend">${parts.map(p => `<span><i class="dot" style="background:${p[2]}"></i>${p[0]} ${money(p[1], false)} <b>${Math.round((p[1] / partTotal) * 100)}%</b></span>`).join('')}</div>
    <div class="stats an-stats4 an-gap">
      ${stat('Spendable', money(f.spendable, false), 'now')}
      ${stat('Floor', money(f.floor, false), 'per month')}
      ${stat('With savings', f.runwayAll != null ? fmt1(f.runwayAll) : '–', 'months')}
      ${stat('Net', money(f.net, false), 'per month')}
    </div>
    <p class="note an-foot">Fixed is rent, bills, phone and subscriptions; living is food, transport, health and uni; the rest is flexible. Burn is your average over the last ${f.days90} days.</p>
    ${notes(ins)}
  </section>`;
}

export function moneyAnalytics() {
  const f = moneyFacts();
  if (!f.all.length) {
    return `<section class="card glass">
      <div class="money-top"><div><div class="label-sm">Money report</div><div class="big-md" style="color:var(--text-3)">Nothing logged yet</div></div>
        <button class="pill-btn" data-act="sheet" data-sheet="txn">${icon('plus')} Expense</button></div>
      <p class="note" style="margin:8px 0 0">Log a few weeks of spending — by hand, with the Apple Pay Shortcut, or by importing a Westpac or Revolut CSV — and this page turns into a report: every category against its own baseline, recurring costs and what crept up, your savings rate and how long your cash would last.</p>
    </section>`;
  }
  const st = status(f);
  return `${heroCard(f, st)}
  ${baselineCard(f)}
  ${recurringCard(f)}
  ${savingsCard(f)}
  ${runwayCard(f)}`;
}
