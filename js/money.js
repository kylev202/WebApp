// v5 Money: transactions, budgets, bills & subscriptions, savings goals. All amounts in AUD.
import { state, addEntry, updateEntry, setKV } from './store.js';
import { esc, dayKey, addDays, toDate, monthKey, monthDays, dayLabel, shortDate, money, moneyShort, num, plural, daysBetween } from './util.js';
import { icon, tile } from './icons.js';
import { screens, sheets, actions, forms, previews, ui, render, closeSheet, toast, haptic, closeBtn, header, seg, removeWithUndo, chips, dateField, readDate } from './core.js';
import { lineChart, barRow, niceMax } from './charts.js';
import { of, byId } from './data.js';
import { todaySections } from './today.js';

export const CATEGORIES = {
  groceries: { label: 'Groceries', icon: 'cart', area: 'diet' },
  dining: { label: 'Eating out', icon: 'dining', area: 'school' },
  transport: { label: 'Transport', icon: 'train', area: 'work' },
  rent: { label: 'Rent', icon: 'home', area: 'sleep' },
  bills: { label: 'Bills', icon: 'bolt', area: 'money' },
  phone: { label: 'Phone & internet', icon: 'phone', area: 'work' },
  subscriptions: { label: 'Subscriptions', icon: 'repeat', area: 'sleep' },
  gym: { label: 'Gym & supplements', icon: 'dumbbell', area: 'move' },
  health: { label: 'Health', icon: 'medical', area: 'diet' },
  shopping: { label: 'Shopping', icon: 'bag', area: 'move' },
  fun: { label: 'Fun', icon: 'ticket', area: 'school' },
  uni: { label: 'Uni', icon: 'school', area: 'school' },
  travel: { label: 'Travel', icon: 'globe', area: 'work' },
  gifts: { label: 'Gifts', icon: 'gift', area: 'move' },
  other: { label: 'Other', icon: 'dots', area: 'sleep' },
};
export const INCOME = {
  wages: { label: 'Wages', icon: 'coffee', area: 'work' },
  freelance: { label: 'Freelance', icon: 'laptop', area: 'work' },
  gift_in: { label: 'Gift', icon: 'gift', area: 'move' },
  refund: { label: 'Refund', icon: 'repeat', area: 'diet' },
  other_in: { label: 'Other income', icon: 'coins', area: 'money' },
};
export const ACCOUNTS = { westpac: { label: 'Westpac', icon: 'bank' }, revolut: { label: 'Revolut', icon: 'card' }, cash: { label: 'Cash', icon: 'coins' }, savings: { label: 'Savings', icon: 'piggy' } };
const CYCLES = { weekly: ['Weekly', 7], fortnightly: ['Fortnightly', 14], monthly: ['Monthly', 0], quarterly: ['Quarterly', 0], yearly: ['Yearly', 0] };
const PER_MONTH = { weekly: 52 / 12, fortnightly: 26 / 12, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12 };

export const catInfo = (kind, cat) => (kind === 'income' ? INCOME[cat] ?? INCOME.other_in : kind === 'transfer' ? { label: 'Transfer', icon: 'transfer', area: 'sleep' } : CATEGORIES[cat] ?? CATEGORIES.other);

// ---------- data ----------
export const txns = () => of('txn').sort((a, b) => b.date.localeCompare(a.date) || b.ts - a.ts);
export const bills = () => of('bill').sort((a, b) => a.next.localeCompare(b.next));
export const goalsList = () => of('goal');
export const budgets = () => state.kv.budgets ?? { groceries: 400, dining: 150, transport: 120, rent: 0, bills: 100, phone: 50, subscriptions: 40, gym: 100, fun: 120, shopping: 80 };
export const monthTxns = (m = monthKey()) => txns().filter(t => monthKey(t.date) === m);
export const spentIn = (list, cat) => list.filter(t => t.kind === 'expense' && (!cat || t.category === cat)).reduce((s, t) => s + Number(t.amount), 0);
export const incomeIn = list => list.filter(t => t.kind === 'income').reduce((s, t) => s + Number(t.amount), 0);

function nextDate(date, cycle) {
  if (CYCLES[cycle][1]) return addDays(date, CYCLES[cycle][1]);
  const d = toDate(date);
  const months = { monthly: 1, quarterly: 3, yearly: 12 }[cycle];
  const target = new Date(d.getFullYear(), d.getMonth() + months, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d.getDate(), last));
  return dayKey(target);
}

// ---------- balances ----------
// Spending accounts you tap a card against, and the ones you don't.
export const SPEND_ACCOUNTS = ['westpac', 'revolut', 'cash'];
export const CARD_ACCOUNTS = ['westpac', 'revolut'];

// What every logged transaction has done to each account since the day you started
// logging. Income lands, expenses leave, a transfer does both.
export function movements() {
  const out = Object.fromEntries(Object.keys(ACCOUNTS).map(k => [k, 0]));
  for (const t of of('txn')) {
    const amt = Number(t.amount) || 0;
    const from = t.account ?? 'westpac';
    out[from] = (out[from] ?? 0) + (t.kind === 'income' ? amt : -amt);
    if (t.kind === 'transfer' && t.toAccount) out[t.toAccount] = (out[t.toAccount] ?? 0) + amt;
  }
  return out;
}

// Transactions can't know what was in an account before Loop did, so each account
// carries an opening figure. The sheet asks what's in there right now and stores the
// difference, which means the balances stay right as you keep logging.
export function balances() {
  const open = state.kv.balances ?? {};
  const mv = movements();
  return Object.fromEntries(Object.keys(ACCOUNTS).map(k => [k, Number(open[k] || 0) + (mv[k] ?? 0)]));
}
export const netWorth = () => Object.values(balances()).reduce((a, b) => a + b, 0);
export const hasBalances = () => !!state.kv.balances;

// One pass over the month instead of one per day, per category and per account:
// the overview needs all three, and re-filtering the same list for each was the
// slowest thing on the screen.
export function monthStats(m = monthKey()) {
  const n = monthDays(m);
  const list = monthTxns(m);
  const days = Array.from({ length: n }, () => ({ spend: 0, income: 0 }));
  const byCat = {}, byAccount = {};
  let spent = 0, income = 0;
  for (const t of list) {
    const amt = Number(t.amount) || 0;
    const d = days[Number(t.date.slice(8, 10)) - 1];
    if (t.kind === 'expense') {
      spent += amt;
      if (d) d.spend += amt;
      byCat[t.category] = (byCat[t.category] ?? 0) + amt;
      const a = t.account ?? 'westpac';
      byAccount[a] = (byAccount[a] ?? 0) + amt;
    } else if (t.kind === 'income') {
      income += amt;
      if (d) d.income += amt;
    }
  }
  const b = budgets();
  const budgetTotal = Object.values(b).reduce((s, v) => s + Number(v || 0), 0);
  return { m, n, list, days, byCat, byAccount, b, spent, income, budgetTotal, left: budgetTotal - spent };
}

export function monthSummary(m = monthKey()) {
  const list = monthTxns(m);
  const b = budgets();
  const budgetTotal = Object.values(b).reduce((s, v) => s + Number(v || 0), 0);
  const spent = spentIn(list);
  return { list, spent, income: incomeIn(list), budgetTotal, left: budgetTotal - spent };
}

// ---------- screen ----------
const monthLabel = m => toDate(`${m}-01`).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
const shiftMonth = (m, d) => { const x = toDate(`${m}-01`); x.setMonth(x.getMonth() + d); return monthKey(dayKey(x)); };

function txnRow(t) {
  const c = catInfo(t.kind, t.category);
  const sign = t.kind === 'income' ? '+' : t.kind === 'transfer' ? '' : '−';
  return `<div class="row tap" data-act="sheet" data-sheet="txn" data-id="${t.id}" role="button">${tile(c.icon, c.area)}
    <div class="grow"><div class="t">${esc(t.merchant || c.label)}</div><div class="d">${c.label} · ${ACCOUNTS[t.account]?.label ?? 'Westpac'}${t.kind === 'transfer' ? ` → ${ACCOUNTS[t.toAccount]?.label ?? ''}` : ''}${t.currency && t.currency !== 'AUD' ? ` · ${t.origAmount} ${esc(t.currency)}` : ''}</div></div>
    <div class="amt ${t.kind === 'income' ? 'in' : ''}">${sign}${money(Number(t.amount))}</div></div>`;
}

function renderMoney() {
  const tab = ui.tab.money ?? 'overview';
  const m = ui.month ?? monthKey();
  const body = { overview: moneyOverview, activity: moneyActivity, bills: moneyBills, savings: moneySavings }[tab](m);
  return `${header('Money', `${monthLabel(m)} · AUD`, `<button class="icon-btn glass" data-act="sheet" data-sheet="txn" aria-label="Add transaction">${icon('plus')}</button>`)}
    ${seg('money', [['overview', 'Overview'], ['activity', 'Activity'], ['bills', 'Bills'], ['savings', 'Savings']], tab)}${body}`;
}
screens.money = renderMoney;

const monthNav = m => `<div class="month-nav"><button class="x-btn" data-act="month" data-d="-1" aria-label="Previous month">${icon('back')}</button><b>${monthLabel(m)}</b><button class="x-btn" data-act="month" data-d="1" aria-label="Next month" ${m >= monthKey() ? 'disabled' : ''}>${icon('chevron')}</button></div>`;

// What you have, where it sits. Spending accounts first, savings last, because
// the first question is what's spendable.
function balanceCard() {
  // Before the accounts are set up all Loop knows is net movement, which is not
  // what anyone means by "money I have" — so it asks instead of guessing.
  if (!hasBalances()) {
    return `<section class="card glass">
      <div class="money-top"><div><div class="label-sm">Money you have</div><div class="big-md" style="color:var(--text-3)">Not set up yet</div></div>
        <button class="pill-btn" data-act="sheet" data-sheet="balances">${icon('plus')} Set up</button></div>
      <p class="note" style="margin:8px 0 0">Enter what’s in Westpac, Revolut, cash and savings once. Every expense, pay and transfer you log keeps the total current from then on.</p>
    </section>`;
  }
  const bal = balances();
  const total = Object.values(bal).reduce((a, b) => a + b, 0);
  const spendable = SPEND_ACCOUNTS.reduce((t, k) => t + bal[k], 0);
  return `<section class="card glass">
    <div class="money-top"><div><div class="label-sm">Money you have</div>
      <div class="big-xl">${money(total, false)}${bal.savings ? `<small>${money(spendable, false)} spendable</small>` : ''}</div></div>
      <button class="pill-btn" data-act="sheet" data-sheet="balances">${icon('edit')} Update</button></div>
    <div class="bal-grid">${[...SPEND_ACCOUNTS, 'savings'].map(k => {
      const a = ACCOUNTS[k];
      return `<div class="bal${bal[k] < 0 ? ' neg' : ''}">${tile(a.icon, k === 'cash' ? 'diet' : k === 'savings' ? 'sleep' : 'money')}
        <div><div class="k">${a.label}</div><div class="n">${money(bal[k], false)}</div></div></div>`;
    }).join('')}</div>
    <p class="note" style="margin:8px 0 0">Carried on from the balances you entered, through everything you have logged since.</p>
  </section>`;
}

// Card or cash: the same A$40 feels different depending on which one it left from,
// and only one of them shows up on a statement.
function splitCard(st) {
  const spent = st.spent;
  if (!spent) return '';
  const card = CARD_ACCOUNTS.reduce((t, k) => t + (st.byAccount[k] ?? 0), 0);
  const cash = st.byAccount.cash ?? 0;
  const rows = Object.keys(ACCOUNTS).filter(k => st.byAccount[k]);
  const pct = v => (v / spent) * 100;
  return `<div class="section-label">Card vs cash</div>
  <section class="card glass">
    <div class="two-up">
      <div style="background:var(--money-bg)"><div class="k" style="color:var(--money-ink)">${icon('card')} Card</div><div class="n">${money(card, false)}</div><div class="s">${Math.round(pct(card))}% of spending</div></div>
      <div style="background:var(--diet-bg)"><div class="k" style="color:var(--diet-ink)">${icon('coins')} Cash</div><div class="n">${money(cash, false)}</div><div class="s">${Math.round(pct(cash))}% of spending</div></div>
    </div>
    <div class="split-bar">${rows.map(k => `<i style="width:${pct(st.byAccount[k]).toFixed(1)}%;background:var(--${k === 'cash' ? 'diet' : k === 'revolut' ? 'school' : 'money'})" title="${ACCOUNTS[k].label}"></i>`).join('')}</div>
    <div class="list tight">${rows.map(k => `<div class="row plain">${tile(ACCOUNTS[k].icon, k === 'cash' ? 'diet' : k === 'revolut' ? 'school' : 'money')}
      <div class="grow"><div class="t">${ACCOUNTS[k].label}</div><div class="d">${Math.round(pct(st.byAccount[k]))}% of this month</div></div>
      <div class="amt">${money(st.byAccount[k], false)}</div></div>`).join('')}</div>
  </section>`;
}

function moneyOverview(m) {
  const st = monthStats(m);
  const { n, b } = st;
  const isNow = m === monthKey();
  const todayN = isNow ? toDate(dayKey()).getDate() : n;
  // Cumulative spend and income to date. Days after today are null so both lines
  // stop at today instead of flat-lining across the rest of the month.
  const daily = [], cum = [], cumIn = [];
  let run = 0, runIn = 0;
  for (let d = 0; d < n; d++) {
    run += st.days[d].spend;
    runIn += st.days[d].income;
    const past = d < todayN;
    daily.push(past ? st.days[d].spend : null);
    cum.push(past ? run : null);
    cumIn.push(past ? runIn : null);
  }
  const hasBudget = st.budgetTotal > 0;
  // Pace is only meaningful against a budget; with none there is nothing to pace against.
  const pace = hasBudget ? Array.from({ length: n }, (_, i) => (st.budgetTotal * (i + 1)) / n) : null;
  const onTrack = !hasBudget || run <= pace[todayN - 1] * 1.02;
  const top = niceMax(Math.max(st.budgetTotal, run, runIn) * 1.06);
  const perDay = run / Math.max(1, todayN);
  const projected = perDay * n;
  const daysLeft = Math.max(0, n - todayN);
  const busiest = daily.reduce((bi, v, i) => (v != null && v > (daily[bi] ?? 0) ? i : bi), -1);
  const cats = Object.keys(CATEGORIES).filter(k => Number(b[k]) > 0 || st.byCat[k]);
  const topCat = Math.max(0, ...cats.map(k => st.byCat[k] ?? 0));
  const upcoming = bills().filter(x => x.next <= addDays(dayKey(), 14));
  const headline = hasBudget
    ? `<div class="label-sm">${st.left >= 0 ? 'Left to spend' : 'Over budget'}</div><div class="big-xl">${money(Math.abs(st.left), false)}<small>of ${money(st.budgetTotal, false)}</small></div>`
    : `<div class="label-sm">Spent this month</div><div class="big-xl">${money(st.spent, false)}<small>no budget set</small></div>`;
  const tag = hasBudget
    ? `<span class="tag ${onTrack ? 'ok' : 'hot'}">${onTrack ? 'On track' : 'Spending fast'}</span>`
    : `<button class="pill-btn" data-act="sheet" data-sheet="budgets">${icon('plus')} Set a budget</button>`;
  return `
  ${monthNav(m)}
  ${balanceCard()}
  <div class="row2"><button class="btn soft" data-act="sheet" data-sheet="txn" data-kind="expense">${icon('card')} Expense</button><button class="btn soft" data-act="sheet" data-sheet="txn" data-kind="income">${icon('coins')} Income</button></div>
  <section class="card glass">
    <div class="money-top"><div>${headline}</div>${tag}</div>
    ${lineChart({
      series: [
        ...(pace ? [{ values: pace, color: 'var(--text)', dash: true, straight: true }] : []),
        // Money in and money out on one scale: while the green line sits above the
        // other, the month is paying for itself.
        // Deeper green than the pastel spend line: at 2px the two were too close to tell apart.
        ...(st.income ? [{ values: cumIn, color: 'var(--diet-ink)', straight: true }] : []),
        // Cumulative money only ever goes up: straight segments, never a curve that
        // smooths past the real total between two days.
        { values: cum, color: 'var(--money)', straight: true, fill: true },
      ],
      labels: Array.from({ length: n }, (_, i) => (i === 0 ? '1' : (i + 1) % 7 === 1 ? String(i + 1) : i === n - 1 ? String(n) : '')),
      live: isNow, max: top || 100, yAxis: v => money(v, false),
      empty: 'No spending yet this month',
    })}
    <div class="legend-inline"><span><i class="dot" style="background:var(--money)"></i>Spent ${money(st.spent, false)}</span>${st.income ? `<span><i class="dot" style="background:var(--diet-ink)"></i>In ${money(st.income, false)}</span>` : ''}${hasBudget ? `<span><i class="dot dash-dot"></i>Pace ${money(pace[todayN - 1], false)}</span>` : ''}</div>
    ${run ? `${barRow({ values: daily, color: 'var(--money)', now: isNow ? todayN - 1 : -1, titles: daily.map((v, i) => (v == null ? '' : `${shortDate(`${m}-${String(i + 1).padStart(2, '0')}`)}: ${money(v)}`)) })}
    <p class="note" style="margin:6px 0 0">Each bar is one day${busiest >= 0 && daily[busiest] ? ` · biggest ${money(daily[busiest], false)} on ${shortDate(`${m}-${String(busiest + 1).padStart(2, '0')}`)}` : ''}</p>` : ''}
    <p class="note" style="margin:8px 0 0">${money(perDay, false)}/day so far${isNow ? ` · on pace for ${money(projected, false)}` : ''}${hasBudget && isNow ? (st.left > 0 ? ` · ${money(st.left / Math.max(1, daysLeft || 1), false)}/day left` : ` · ${money(-st.left, false)} over`) : ''}</p>
    <div class="flow">
      <div style="background:var(--diet-bg)"><div class="k" style="color:var(--diet-ink)">In</div><div class="n">${money(st.income, false)}</div></div>
      <div style="background:var(--move-bg)"><div class="k" style="color:var(--move-ink)">Out</div><div class="n">${money(st.spent, false)}</div></div>
      <div style="background:var(--sleep-bg)"><div class="k" style="color:var(--sleep-ink)">${st.income - st.spent >= 0 ? 'Kept' : 'Shortfall'}</div><div class="n">${money(st.income - st.spent, false)}</div></div>
    </div>
  </section>
  ${splitCard(st)}
  <div class="section-label">Budgets <a data-act="sheet" data-sheet="budgets">Edit</a></div>
  <section class="card glass"><div class="budget">${cats.map(k => {
    const spent = st.byCat[k] ?? 0, cap = Number(b[k]) || 0, c = CATEGORIES[k];
    const over = cap && spent > cap;
    // Without a cap there's nothing to fill, so the bar compares the category
    // against the one you spent most on rather than pretending to be full.
    const width = cap ? Math.min(100, (spent / cap) * 100) : topCat ? (spent / topCat) * 100 : 0;
    return `<div class="bud">${tile(c.icon, c.area)}<div class="bud-main">
      <div class="top"><span class="name">${c.label}</span><span class="nums ${over ? 'late' : ''}"><b>${money(spent, false)}</b>${cap ? ` / ${money(cap, false)}` : ''}</span></div>
      <div class="track"><div class="fill${cap ? '' : ' soft'}" style="width:${width.toFixed(1)}%;background:var(--${over ? 'move' : c.area})"></div></div>
      ${cap ? `<div class="left ${over ? 'late' : ''}">${over ? `${money(spent - cap, false)} over` : `${money(cap - spent, false)} left`}</div>` : `<div class="left">${st.spent ? `${Math.round((spent / st.spent) * 100)}% of this month` : 'no budget set'}</div>`}</div></div>`;
  }).join('') || '<div class="empty">Set budgets to track each category.</div>'}</div></section>
  ${upcoming.length ? `<div class="section-label">Bills due soon <a data-act="moneyTab" data-tab="bills">All</a></div><section class="card glass"><div class="list">${upcoming.map(billRow).join('')}</div></section>` : ''}
  ${st.list.length ? `<div class="section-label">Recent <a data-act="moneyTab" data-tab="activity">All</a></div><section class="card glass"><div class="list">${st.list.slice(0, 5).map(txnRow).join('')}</div></section>` : ''}`;
}

function moneyActivity(m) {
  const filter = ui.acct ?? 'all';
  const list = monthTxns(m).filter(t => filter === 'all' || t.account === filter || t.toAccount === filter);
  const days = [...new Set(list.map(t => t.date))];
  const bal = balances();
  const out = spentIn(list), inn = incomeIn(list);
  return `${monthNav(m)}
  <div class="chips-filter">${[['all', 'All'], ...Object.entries(ACCOUNTS).filter(([k]) => k !== 'savings').map(([k, a]) => [k, a.label])].map(([k, l]) => `<button class="chip-btn ${filter === k ? 'on' : 'soft'}" data-act="acct" data-a="${k}">${l}</button>`).join('')}
    ${actions.importCsv ? `<button class="chip-btn soft" data-act="importCsv">${icon('upload')} Import CSV</button>` : ''}</div>
  <section class="card glass"><div class="money-top"><div><div class="label-sm">${filter === 'all' ? 'Across all accounts' : `${ACCOUNTS[filter].label} balance`}</div>
    <div class="big-md">${hasBalances() ? money(filter === 'all' ? netWorth() : bal[filter], false) : '—'}</div></div>
    <div class="io"><span class="in">+${money(inn, false)}</span><span class="out">−${money(out, false)}</span></div></div>
    <p class="note" style="margin:6px 0 0">${plural(list.length, 'transaction')} this month${filter === 'all' ? '' : ` through ${ACCOUNTS[filter].label}`}.</p></section>
  ${days.length ? days.map(d => {
    const dl = list.filter(t => t.date === d);
    const net = dl.reduce((s, t) => s + (t.kind === 'income' ? 1 : t.kind === 'expense' ? -1 : 0) * Number(t.amount), 0);
    return `<div class="section-label">${dayLabel(d)} <span>${net >= 0 ? '+' : '−'}${money(Math.abs(net))}</span></div><section class="card glass"><div class="list">${dl.map(txnRow).join('')}</div></section>`;
  }).join('') : `<section class="card glass soon">${tile('card', 'money', 'xl')}<p>No transactions this month. Add one with ＋, tap to pay with the Apple Pay Shortcut, or import a CSV from Westpac or Revolut.</p></section>`}`;
}

function billRow(x) {
  const c = CATEGORIES[x.category] ?? CATEGORIES.bills;
  const days = daysBetween(dayKey(), x.next);
  return `<div class="row tap" data-act="sheet" data-sheet="bill" data-id="${x.id}" role="button">${tile(c.icon, c.area)}
    <div class="grow"><div class="t">${esc(x.name)}</div><div class="d">${CYCLES[x.cycle][0]} · ${days < 0 ? `<span class="late">overdue</span>` : days === 0 ? 'due today' : `${dayLabel(x.next)}`}</div></div>
    <div class="amt">${money(Number(x.amount))}</div><button class="pill-btn" data-act="payBill" data-id="${x.id}">Paid</button></div>`;
}

function moneyBills() {
  const list = bills();
  const monthly = list.reduce((s, x) => s + Number(x.amount) * PER_MONTH[x.cycle], 0);
  return `<section class="card glass">
    <div class="money-top"><div><div class="label-sm">Bills & subscriptions</div><div class="big-xl">${money(monthly, false)}<small>a month</small></div></div>
    <button class="pill-btn" data-act="sheet" data-sheet="bill">${icon('plus')} Add</button></div>
    <p class="note" style="margin:8px 0 0">${plural(list.length, 'item')} · ${money(monthly * 12, false)} a year. Tap Paid to log it and roll the date forward.</p></section>
  ${list.length ? `<section class="card glass"><div class="list">${list.map(billRow).join('')}</div></section>` : ''}`;
}

function moneySavings() {
  const gs = goalsList();
  return `${gs.map(g => {
    const pct = Math.min(100, (Number(g.saved) / Number(g.target)) * 100);
    // Saving pace since the first deposit (at least one month, so one deposit isn't over-weighted).
    const adds = txns().filter(t => t.goalId === g.id);
    const first = adds.reduce((d, t) => (t.date < d ? t.date : d), dayKey());
    const perMonth = adds.reduce((s, t) => s + Number(t.amount), 0) / Math.max(1, daysBetween(first, dayKey()) / 30.4);
    const left = Number(g.target) - Number(g.saved);
    const eta = left <= 0 ? 'Reached!' : perMonth > 0 ? `At this pace: ${toDate(addDays(dayKey(), Math.round((left / perMonth) * 30.4))).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}` : 'Add money to see when you’ll get there';
    return `<section class="card glass tap" data-act="sheet" data-sheet="goal" data-id="${g.id}">
      <div class="head"><div class="title">${tile(g.icon || 'piggy', 'sleep')}${esc(g.name)}</div><span class="sub-note">${Math.round(pct)}%</span></div>
      <div class="big-md">${money(Number(g.saved), false)} <small class="muted">of ${money(Number(g.target), false)}</small></div>
      <div class="track" style="height:8px"><div class="fill" style="width:${pct}%;background:var(--sleep)"></div></div>
      <div class="goal-foot"><span class="note" style="margin:0">${eta}</span><button class="pill-btn" data-act="sheet" data-sheet="goalAdd" data-id="${g.id}">${icon('plus')} Add</button></div>
    </section>`;
  }).join('')}
  <button class="btn soft" data-act="sheet" data-sheet="goal">${icon('piggy')} New savings goal</button>`;
}

// ---------- Today ----------
todaySections.push({
  pos: 'mid',
  render() {
    const s = monthSummary();
    const due = bills().filter(x => x.next <= addDays(dayKey(), 3));
    if (!s.list.length && !due.length && !state.kv.budgets) return '';
    const capped = s.budgetTotal > 0;
    const on = hasBalances() ? netWorth() : null;
    return `<section class="card glass money-card tap" data-act="nav" data-to="money">${tile('wallet', 'money', 'lg')}
      <div class="grow"><div class="label-sm">Money · ${toDate(dayKey()).toLocaleDateString('en-AU', { month: 'long' })}${on != null ? ` · ${money(on, false)} on hand` : ''}</div><div class="t">${capped ? `${money(Math.abs(s.left), false)} ${s.left >= 0 ? 'left' : 'over budget'}` : `${money(s.spent, false)} spent`}</div>
      <div class="d">${due.length ? `${due.map(x => esc(x.name)).join(', ')} due soon` : capped ? `Spent ${money(s.spent, false)} of ${money(s.budgetTotal, false)}` : 'No budget set yet'}</div></div>
      <div class="mini-track"><i style="height:${capped ? Math.min(100, (s.spent / s.budgetTotal) * 100) : 0}%"></i></div></section>`;
  },
});

// ---------- sheets ----------
const catChips = (name, obj, cur, cols = 4) => chips(name, Object.entries(obj).map(([k, c]) => [k, c.label, c.icon, c.area]), cur, { cols });
const acctChips = (name, cur, list = ['westpac', 'revolut', 'cash']) => chips(name, list.map(k => [k, ACCOUNTS[k].label, ACCOUNTS[k].icon, 'money']), cur, { cols: list.length });

sheets.txn = ({ id, kind: k0 }) => {
  const t = id ? byId(id) : null;
  const kind = t?.kind ?? k0 ?? 'expense';
  return `<h2>${t ? 'Edit transaction' : 'New transaction'} ${closeBtn}</h2><form data-form="txn" class="nice-form"><input type="hidden" name="id" value="${t?.id ?? ''}">
    <div class="seg wide radio">${[['expense', 'Expense'], ['income', 'Income'], ['transfer', 'Transfer']].map(([v, l]) => `<label><input type="radio" name="kind" value="${v}" ${kind === v ? 'checked' : ''}>${l}</label>`).join('')}</div>
    <div class="amount-box"><span>A$</span><input name="amount" inputmode="decimal" required value="${t?.amount ?? ''}" placeholder="0.00" aria-label="Amount" autocomplete="off"></div>
    <div class="field k-not-transfer"><label>Where / who</label><input class="input-x" name="merchant" maxlength="60" value="${esc(t?.merchant ?? '')}" placeholder="e.g. Woolworths" autocomplete="off"></div>
    <div class="field k-expense"><label>Category</label>${catChips('category', CATEGORIES, t?.kind === 'expense' ? t.category : 'groceries')}</div>
    <div class="field k-income"><label>Category</label>${catChips('incomeCategory', INCOME, t?.kind === 'income' ? t.category : 'wages', 3)}</div>
    <div class="field"><label class="k-not-transfer">Account</label><label class="k-transfer">From</label>${acctChips('account', t?.account ?? 'westpac')}</div>
    <div class="field k-transfer"><label>To</label>${acctChips('toAccount', t?.toAccount ?? 'revolut', ['westpac', 'revolut', 'savings'])}</div>
    <div class="field"><label>Date</label>${dateField('date', t?.date ?? dayKey(), { past: true })}</div>
    <details class="fx" ${t?.currency && t.currency !== 'AUD' ? 'open' : ''}><summary>Paid in another currency</summary>
      <div class="row2"><div class="field"><label>Currency</label><input class="input-x" name="currency" maxlength="3" value="${esc(t?.currency ?? '')}" placeholder="USD"></div>
      <div class="field"><label>Original amount</label><input class="input-x" name="origAmount" inputmode="decimal" value="${t?.origAmount ?? ''}"></div></div>
      <p class="note">Enter the A$ amount that left your account above (Revolut shows it).</p></details>
    <div class="field"><label>Note</label><input class="input-x" name="note" maxlength="100" value="${esc(t?.note ?? '')}" placeholder="Optional"></div>
    <div class="btn-row"><button class="btn">${t ? 'Save changes' : 'Save'}</button>${t ? `<button type="button" class="btn danger" data-act="delTxn" data-id="${t.id}">Delete</button>` : ''}</div></form>`;
};
previews.txn = form => {
  form.dataset.kind = new FormData(form).get('kind');
};

sheets.budgets = () => {
  const b = budgets();
  return `<h2>Monthly budgets ${closeBtn}</h2><form data-form="budgets"><p class="note">Set how much you plan to spend each month. Leave 0 to just track.</p>
    <div class="budget-grid">${Object.entries(CATEGORIES).map(([k, c]) => `<label class="bud-in">${tile(c.icon, c.area)}<span>${c.label}</span><input class="input-x" name="${k}" inputmode="decimal" value="${b[k] ?? 0}"></label>`).join('')}</div>
    <div class="sleep-preview" id="budget-total"></div><button class="btn">Save budgets</button></form>`;
};
previews.budgets = form => {
  const total = [...form.querySelectorAll('input')].reduce((s, i) => s + num(i.value), 0);
  document.getElementById('budget-total').textContent = `Total ${money(total, false)} a month`;
};

sheets.balances = () => {
  const bal = balances();
  return `<h2>Account balances ${closeBtn}</h2><form data-form="balances">
    <p class="note">What’s actually in each account right now. Loop moves them itself from then on — every expense, pay and transfer you log.</p>
    <div class="budget-grid">${Object.entries(ACCOUNTS).map(([k, a]) => `<label class="bud-in">${tile(a.icon, k === 'cash' ? 'diet' : k === 'savings' ? 'sleep' : 'money')}<span>${a.label}</span><input class="input-x" name="${k}" inputmode="decimal" value="${Math.round(bal[k] * 100) / 100}"></label>`).join('')}</div>
    <div class="sleep-preview" id="balance-total"></div><button class="btn">Save balances</button></form>`;
};
previews.balances = form => {
  const total = [...form.querySelectorAll('input')].reduce((t, i) => t + num(i.value), 0);
  document.getElementById('balance-total').textContent = `${money(total, false)} in total`;
};

sheets.bill = ({ id }) => {
  const x = id ? byId(id) : null;
  return `<h2>${x ? 'Edit bill' : 'New bill or subscription'} ${closeBtn}</h2><form data-form="bill" class="nice-form"><input type="hidden" name="id" value="${x?.id ?? ''}">
    <div class="field"><label>Name</label><input class="input-x" name="name" required maxlength="40" value="${esc(x?.name ?? '')}" placeholder="e.g. Spotify" autocomplete="off"></div>
    <div class="amount-box small"><span>A$</span><input name="amount" inputmode="decimal" required value="${x?.amount ?? ''}" placeholder="0.00" aria-label="Amount"></div>
    <div class="field"><label>Repeats</label>${chips('cycle', Object.entries(CYCLES).map(([k, [l]]) => [k, l]), x?.cycle ?? 'monthly')}</div>
    <div class="field"><label>Next due</label>${dateField('next', x?.next ?? dayKey())}</div>
    <div class="field"><label>Category</label>${catChips('category', CATEGORIES, x?.category ?? 'subscriptions')}</div>
    <div class="field"><label>Paid from</label>${acctChips('account', x?.account ?? 'westpac')}</div>
    <div class="btn-row"><button class="btn">${x ? 'Save changes' : 'Add'}</button>${x ? `<button type="button" class="btn danger" data-act="delEntity" data-id="${x.id}">Delete</button>` : ''}</div></form>`;
};

sheets.goal = ({ id }) => {
  const g = id ? byId(id) : null;
  return `<h2>${g ? 'Savings goal' : 'New savings goal'} ${closeBtn}</h2><form data-form="goal"><input type="hidden" name="id" value="${g?.id ?? ''}">
    <div class="field"><label>Saving for</label><input class="input-x" name="name" required maxlength="40" value="${esc(g?.name ?? '')}" placeholder="New laptop"></div>
    <div class="row2"><div class="field"><label>Target (A$)</label><input class="input-x" name="target" inputmode="decimal" required value="${g?.target ?? ''}"></div>
      <div class="field"><label>Saved so far</label><input class="input-x" name="saved" inputmode="decimal" value="${g?.saved ?? 0}"></div></div>
    <div class="label-sm">Icon</div><div class="icon-pick small">${['piggy', 'laptop', 'globe', 'home', 'gift', 'star', 'card', 'phone'].map(n => `<label><input type="radio" name="icon" value="${n}" ${(g?.icon ?? 'piggy') === n ? 'checked' : ''}><span>${icon(n)}</span></label>`).join('')}</div>
    <div class="btn-row"><button class="btn">${g ? 'Save changes' : 'Create goal'}</button>${g ? `<button type="button" class="btn danger" data-act="delEntity" data-id="${g.id}">Delete</button>` : ''}</div></form>`;
};

sheets.goalAdd = ({ id }) => {
  const g = byId(id);
  return `<h2>Add to ${esc(g?.name ?? 'goal')} ${closeBtn}</h2><form data-form="goalAdd" class="nice-form"><input type="hidden" name="id" value="${id}">
    <div class="amount-box"><span>A$</span><input name="amount" inputmode="decimal" required placeholder="50" aria-label="Amount"></div>
    <div class="quick-amts">${[20, 50, 100, 200].map(a => `<button type="button" class="chip-btn soft" data-act="fillAmount" data-v="${a}">${moneyShort(a)}</button>`).join('')}</div>
    <div class="field"><label>From</label>${acctChips('account', 'westpac')}</div>
    <button class="btn">Add money</button></form>`;
};

// ---------- actions ----------
Object.assign(actions, {
  month: el => { ui.month = shiftMonth(ui.month ?? monthKey(), Number(el.dataset.d)); render(); },
  moneyTab: el => { ui.tab.money = el.dataset.tab; render({ enter: true }); },
  acct: el => { ui.acct = el.dataset.a; render(); },
  delTxn: el => { closeSheet(); return removeWithUndo(el.dataset.id, 'Transaction deleted'); },
  fillAmount: el => { const f = document.querySelector('form[data-form="goalAdd"]'); if (f) f.elements.amount.value = el.dataset.v; },
  async payBill(el) {
    const x = byId(el.dataset.id);
    await addEntry('txn', { kind: 'expense', amount: Number(x.amount), category: x.category, account: x.account, merchant: x.name, note: `${CYCLES[x.cycle][0]} bill`, billId: x.id, source: 'bill' }, dayKey());
    await updateEntry(x.id, { next: nextDate(x.next, x.cycle) });
    haptic();
    toast(`${x.name} paid · next ${shortDate(nextDate(x.next, x.cycle))}`, { icon: 'receipt' });
    render();
  },
});

Object.assign(forms, {
  async txn(f) {
    const kind = f.get('kind');
    const amount = Math.abs(num(f.get('amount')));
    if (!amount) return toast('Enter an amount', { icon: 'info' });
    const fields = {
      kind, amount,
      category: kind === 'income' ? f.get('incomeCategory') : kind === 'expense' ? f.get('category') : 'transfer',
      account: f.get('account'), toAccount: kind === 'transfer' ? f.get('toAccount') : null,
      merchant: String(f.get('merchant') ?? '').trim(), note: String(f.get('note') ?? '').trim(),
      currency: String(f.get('currency') ?? '').trim().toUpperCase() || null, origAmount: num(f.get('origAmount')) || null,
    };
    const id = f.get('id');
    const date = readDate(f, 'date') || dayKey();
    if (id) await updateEntry(id, { ...fields, date });
    else await addEntry('txn', { ...fields, source: 'manual' }, date);
    haptic();
    closeSheet();
    toast(`${kind === 'income' ? '+' : kind === 'expense' ? '−' : ''}${money(amount)} saved`, { icon: catInfo(kind, fields.category).icon });
    render();
  },
  async budgets(f) {
    const b = {};
    for (const k of Object.keys(CATEGORIES)) b[k] = num(f.get(k));
    await setKV('budgets', b);
    haptic();
    closeSheet();
    toast('Budgets saved', { icon: 'wallet' });
    render();
  },
  // The sheet takes today's balance; what's stored is the opening figure, so the
  // number you typed still comes out right once the logged movements are applied.
  async balances(f) {
    const mv = movements();
    const open = {};
    for (const k of Object.keys(ACCOUNTS)) open[k] = Math.round((num(f.get(k)) - (mv[k] ?? 0)) * 100) / 100;
    await setKV('balances', open);
    haptic();
    closeSheet();
    toast(`${money(netWorth(), false)} across your accounts`, { icon: 'wallet' });
    render();
  },
  async bill(f) {
    const fields = { name: f.get('name').trim(), amount: num(f.get('amount')), cycle: f.get('cycle') || 'monthly', next: readDate(f, 'next') || dayKey(), category: f.get('category') || 'subscriptions', account: f.get('account') || 'westpac' };
    const id = f.get('id');
    if (id) await updateEntry(id, fields);
    else await addEntry('bill', fields, dayKey());
    haptic();
    closeSheet();
    toast('Bill saved', { icon: 'receipt' });
    render();
  },
  async goal(f) {
    const fields = { name: f.get('name').trim(), target: num(f.get('target')), saved: num(f.get('saved')), icon: f.get('icon') || 'piggy' };
    const id = f.get('id');
    if (id) await updateEntry(id, fields);
    else await addEntry('goal', fields, dayKey());
    haptic();
    closeSheet();
    toast('Goal saved', { icon: 'piggy' });
    render();
  },
  async goalAdd(f) {
    const g = byId(f.get('id'));
    const amount = num(f.get('amount'));
    if (!amount) return;
    await updateEntry(g.id, { saved: Number(g.saved) + amount });
    await addEntry('txn', { kind: 'transfer', amount, category: 'transfer', account: f.get('account'), toAccount: 'savings', merchant: g.name, goalId: g.id, source: 'manual' }, dayKey());
    haptic();
    closeSheet();
    toast(`${money(amount)} added to ${g.name}`, { icon: 'piggy' });
    render();
  },
});
