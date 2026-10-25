// v6 CSV import for Westpac and Revolut statements (and most other bank CSVs).
import { addEntry } from './store.js';
import { esc, dayKey, money, num, plural, daysBetween } from './util.js';
import { icon } from './icons.js';
import { sheets, actions, render, openSheet, closeSheet, refreshSheet, toast, haptic, closeBtn } from './core.js';
import { CATEGORIES, INCOME, ACCOUNTS, txns } from './money.js';
import { hasAI, generate } from './ai.js';

// ---------- parsing ----------
export function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some(x => x.trim())) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some(x => x.trim())) rows.push(row);
  return rows;
}

// "20/10/2026", "2026-10-20 14:32:11", "20 Oct 2026" → "2026-10-20".
export function parseDate(s) {
  s = String(s).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) return `${m[3].length === 2 ? `20${m[3]}` : m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; // Australian D/M/Y
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : dayKey(d);
}

const col = (header, ...names) => header.findIndex(h => names.some(n => h.toLowerCase().replace(/[^a-z]/g, '') === n));

// Turn any bank CSV into { date, amount (signed: − spent, + received), description, kind? }.
export function readStatement(text) {
  const rows = parseCSV(text);
  if (rows.length < 2) throw new Error('That file has no transactions');
  const header = rows[0].map(h => h.trim());
  const lower = header.map(h => h.toLowerCase());
  let bank = 'other';
  if (lower.includes('narrative') && (lower.includes('debit amount') || lower.includes('credit amount'))) bank = 'westpac';
  else if (lower.includes('started date') || (lower.includes('product') && lower.includes('state'))) bank = 'revolut';
  const iDate = col(header, 'date', 'completeddate', 'transactiondate', 'posteddate', 'starteddate');
  const iDesc = col(header, 'narrative', 'description', 'details', 'merchant', 'payee', 'transactiondetails');
  const iAmt = col(header, 'amount', 'value');
  const iDebit = col(header, 'debitamount', 'debit', 'withdrawal', 'moneyout');
  const iCredit = col(header, 'creditamount', 'credit', 'deposit', 'moneyin');
  const iType = col(header, 'type');
  const iState = col(header, 'state', 'status');
  const iFee = col(header, 'fee');
  const iCur = col(header, 'currency');
  if (iDate < 0 || iDesc < 0 || (iAmt < 0 && iDebit < 0 && iCredit < 0)) throw new Error('Couldn’t find date, description and amount columns');
  const out = [];
  for (const r of rows.slice(1)) {
    const date = parseDate(r[iDate] ?? '');
    if (!date) continue;
    if (iState >= 0 && /revert|declin|fail|pending/i.test(r[iState] ?? '')) continue;
    let amount;
    // num() keeps a leading minus; accounting-style "(12.50)" also means money out.
    if (iAmt >= 0 && String(r[iAmt] ?? '').trim() !== '') amount = /\(.*\)/.test(r[iAmt]) ? -Math.abs(num(r[iAmt])) : num(r[iAmt]);
    else amount = num(r[iCredit]) - num(r[iDebit]);
    if (iFee >= 0) amount -= Math.abs(num(r[iFee]));
    if (!amount) continue;
    out.push({ date, amount: Math.round(amount * 100) / 100, description: String(r[iDesc] ?? '').replace(/\s+/g, ' ').trim(), type: iType >= 0 ? r[iType] : '', currency: iCur >= 0 ? r[iCur] : 'AUD' });
  }
  return { bank, rows: out };
}

// ---------- categorising ----------
const RULES = [
  ['groceries', /woolworths|coles|aldi|\biga\b|harris farm|foodworks|costco|drakes/],
  ['dining', /uber ?eats|menulog|doordash|mcdonald|kfc|hungry jack|guzman|grill'?d|nando|subway|domino|pizza|sushi|cafe|café|coffee|starbucks|boost juice|bakery|restaurant|thai|kebab|ramen|bubble tea|gong cha|chatime/],
  ['transport', /opal|transport ?nsw|myki|translink|go card|\buber\b(?! ?eats)|didi|ola cabs|shell|\bbp\b|ampol|caltex|7-eleven|united petrol|metro petroleum|linkt|parking|wilson/],
  ['subscriptions', /spotify|netflix|apple\.com\/bill|youtube|disney|\bstan\b|binge|kayo|prime video|amazon prime|chatgpt|openai|icloud|google one|adobe|canva|notion|github/],
  ['phone', /optus|telstra|vodafone|belong|amaysim|boost mobile|aussie broadband|tpg|iinet|felix/],
  ['bills', /\bagl\b|origin energy|energyaustralia|red energy|alinta|sydney water|water corp|council|insurance|nrma|allianz|budget direct/],
  ['gym', /anytime fitness|fitness first|snap fitness|plus fitness|goodlife|jetts|\bgym\b|myprotein|bulk nutrients|supplement|ehp labs/],
  ['health', /chemist warehouse|priceline|pharmacy|terrywhite|medical|dental|physio|bupa|medibank|hcf/],
  ['shopping', /jb ?hi-?fi|kmart|\btarget\b|big w|amazon|ikea|uniqlo|myer|david jones|officeworks|bunnings|rebel|cotton on|h&m|zara|the iconic|ebay/],
  ['fun', /event cinemas|hoyts|village cinemas|ticketek|ticketmaster|steam|playstation|xbox|nintendo|timezone|bar\b|pub\b|hotel|club/],
  ['uni', /university|\buni\b|co-?op bookshop|studentvip|tafe/],
  ['travel', /qantas|virgin|jetstar|rex air|airbnb|booking\.com|expedia|hostel|\bhotel\b/],
  ['rent', /\brent\b|real estate|ray white|lj hooker|belle property|bond/],
  ['gifts', /gift|flowers|florist/],
];
export function guessCategory(desc, amount) {
  const d = desc.toLowerCase();
  if (amount > 0) {
    if (/salary|wage|pay(roll)?\b|payment from .*(cafe|café|pty)/.test(d)) return 'wages';
    if (/invoice|inv-|freelance|stripe|paypal/.test(d)) return 'freelance';
    if (/refund|reversal|return/.test(d)) return 'refund';
    return 'other_in';
  }
  return RULES.find(([, re]) => re.test(d))?.[0] ?? 'other';
}
const isTransfer = (r, bank) => (bank === 'westpac' && /revolut/i.test(r.description))
  || (bank === 'revolut' && (/top.?up|topup/i.test(r.type) || /top-?up|from westpac|westpac/i.test(r.description)))
  || /transfer (to|from) (my|own)|internal transfer|to savings|from savings/i.test(r.description);

// Clean "EFTPOS PURCHASE WOOLWORTHS 1234 SYDNEY AU" → "Woolworths Sydney".
export function cleanMerchant(desc) {
  return desc.replace(/^(eftpos|visa|debit card|card|pos)? ?(purchase|payment|withdrawal)?\s*/i, '')
    .replace(/\b(card ?\d{4}|x{2,}\d+|\d{4,}|ref\S*|aus?|nsw|vic|qld|wa|sa|tas|act|nt)\b/gi, '')
    .replace(/\s{2,}/g, ' ').trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).slice(0, 40) || desc.slice(0, 40);
}

// ---------- import flow ----------
let pending = null; // { bank, account, items: [...], skipped }

function prepare(text, fileName) {
  const { bank, rows } = readStatement(text);
  const account = bank === 'revolut' ? 'revolut' : bank === 'westpac' ? 'westpac' : /revolut/i.test(fileName) ? 'revolut' : 'westpac';
  const existing = txns();
  const refs = new Set(existing.map(t => t.ref).filter(Boolean));
  const items = [];
  let skipped = 0;
  for (const r of rows) {
    const ref = `${account}|${r.date}|${r.amount}|${r.description.toLowerCase()}`;
    const transfer = isTransfer(r, bank);
    const kind = transfer ? 'transfer' : r.amount < 0 ? 'expense' : 'income';
    const amount = Math.abs(r.amount);
    // Already imported, or already logged by hand / Apple Pay / AI (same amount within a day).
    const dup = refs.has(ref) || existing.some(t => t.kind === kind && Math.abs(Number(t.amount) - amount) < 0.01 && Math.abs(daysBetween(t.date, r.date)) <= (transfer ? 2 : 1) && (transfer || t.account === account || !t.ref));
    if (dup) { skipped++; continue; }
    items.push({
      ref, date: r.date, amount, kind, account,
      // Westpac → Revolut top-ups (seen from either side), or money moved to savings.
      toAccount: transfer ? (/savings/i.test(r.description) ? 'savings' : 'revolut') : null,
      fromAccount: transfer && account === 'revolut' && !/savings/i.test(r.description) ? 'westpac' : account,
      merchant: cleanMerchant(r.description), raw: r.description,
      category: transfer ? 'transfer' : guessCategory(r.description, r.amount),
      currency: r.currency && r.currency !== 'AUD' ? r.currency : null, on: true,
    });
  }
  return { bank, account, items, skipped };
}

sheets.csvPreview = () => {
  if (!pending) return `<h2>Import ${closeBtn}</h2><div class="empty">Nothing to import.</div>`;
  const { items, skipped, bank } = pending;
  const on = items.filter(i => i.on);
  const spend = on.filter(i => i.kind === 'expense').reduce((s, i) => s + i.amount, 0);
  const unknown = items.filter(i => i.kind === 'expense' && i.category === 'other').length;
  const catOpts = (i, idx) => `<select class="cat-sel" data-idx="${idx}" aria-label="Category">${Object.entries(i.kind === 'income' ? INCOME : CATEGORIES).map(([k, c]) => `<option value="${k}" ${k === i.category ? 'selected' : ''}>${c.label}</option>`).join('')}</select>`;
  return `<h2>Import ${bank === 'other' ? 'statement' : ACCOUNTS[pending.account].label} ${closeBtn}</h2>
    <div class="calc-result"><div><span>New</span><b>${on.length}</b></div><div><span>Spending</span><b>${money(spend, false)}</b></div><div><span>Duplicates</span><b>${skipped}</b></div></div>
    ${unknown && hasAI() ? `<button class="btn soft" data-act="csvAI" style="margin-bottom:12px">${icon('sparkle')} Sort ${plural(unknown, 'unknown purchase')} with AI</button>` : ''}
    <div class="list csv-list">${items.map((i, idx) => `<div class="row ${i.on ? '' : 'off'}">
      <button class="check ${i.on ? 'on' : ''}" data-act="csvToggle" data-idx="${idx}" aria-label="Include">${icon('check')}</button>
      <div class="grow"><div class="t">${esc(i.merchant)}</div><div class="d">${i.date.slice(8)}/${i.date.slice(5, 7)} · ${i.kind === 'transfer' ? 'Transfer to Revolut' : catOpts(i, idx)}</div></div>
      <div class="amt ${i.kind === 'income' ? 'in' : ''}">${i.kind === 'income' ? '+' : i.kind === 'expense' ? '−' : ''}${money(i.amount)}</div></div>`).join('') || '<div class="empty">Everything in this file is already in Loop.</div>'}</div>
    ${on.length ? `<button class="btn" data-act="csvImport" style="margin-top:14px">Import ${plural(on.length, 'transaction')}</button>` : ''}`;
};

Object.assign(actions, {
  importCsv: () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,text/csv,text/comma-separated-values';
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      try {
        pending = prepare(await file.text(), file.name);
        openSheet('csvPreview');
      } catch (err) {
        toast(err.message || 'Couldn’t read that CSV', { icon: 'alert', ms: 3500 });
      }
    };
    input.click();
  },
  csvToggle: el => { const i = pending.items[el.dataset.idx]; i.on = !i.on; refreshSheet(); },
  async csvImport() {
    const list = pending.items.filter(i => i.on);
    for (const i of list) {
      await addEntry('txn', {
        kind: i.kind, amount: i.amount, category: i.category,
        account: i.kind === 'transfer' ? i.fromAccount : i.account, toAccount: i.kind === 'transfer' ? i.toAccount : null,
        merchant: i.merchant, note: i.raw, ref: i.ref, currency: i.currency, source: 'csv',
      }, i.date);
    }
    pending = null;
    haptic();
    closeSheet();
    toast(`${plural(list.length, 'transaction')} imported`, { icon: 'upload' });
    render();
  },
  async csvAI(el) {
    const unknown = pending.items.filter(i => i.kind === 'expense' && i.category === 'other');
    el.disabled = true;
    el.textContent = 'Sorting…';
    try {
      const res = await generate({
        system: 'You categorise Australian bank transactions. Reply with JSON only.',
        contents: [{ role: 'user', parts: [{ text: `Categories: ${Object.keys(CATEGORIES).join(', ')}.\nReturn a JSON object mapping each description to one category.\n${JSON.stringify(unknown.map(i => i.raw))}` }] }],
      });
      const text = res.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('') ?? '';
      const map = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
      unknown.forEach(i => { if (CATEGORIES[map[i.raw]]) i.category = map[i.raw]; });
      toast('Sorted with AI', { icon: 'sparkle' });
    } catch {
      toast('AI couldn’t sort these. Pick categories by hand.', { icon: 'alert' });
    }
    refreshSheet();
  },
});

document.addEventListener('change', e => {
  if (!e.target.classList.contains('cat-sel') || !pending) return;
  pending.items[e.target.dataset.idx].category = e.target.value;
});
