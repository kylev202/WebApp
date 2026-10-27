// v6 Connections: your relay (Apple Pay + Siri inbox, Canvas proxy), Canvas sync, Google Calendar.
import { state, addEntry, updateEntry, setKV } from './store.js';
import { esc, dayKey, addDays, pad, num, plural, timeOf } from './util.js';
import { icon, tile } from './icons.js';
import { sheets, actions, forms, render, openSheet, closeSheet, refreshSheet, toast, haptic, closeBtn } from './core.js';
import { settingsSections } from './settings.js';
import { agendaSources, courses, assessments } from './plan.js';
import { guessCategory, cleanMerchant } from './csv.js';
import { txns } from './money.js';
import { hasAI } from './ai.js';
import { sendMessage } from './ask.js';
import { setWater } from './health.js';
import { waterOn } from './data.js';

// Always the app folder (…/WebApp/), even if opened as …/index.html, so it matches Google's redirect URI exactly.
const APP_URL = new URL('./', location.href).href;
const relay = () => ({ url: '', token: '', ...state.kv.relay });
const canvas = () => ({ domain: '', token: '', ...state.kv.canvas });
const gcal = () => ({ clientId: '', token: '', expires: 0, ...state.kv.gcal });
const ago = ts => (ts ? `${timeOf(ts)} ${dayKey(new Date(ts)) === dayKey() ? 'today' : new Date(ts).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}` : 'never');

// "looprelay.you.workers.dev/inbox " → "https://looprelay.you.workers.dev"
export function cleanRelayUrl(s) {
  let u = String(s ?? '').trim().replace(/\s+/g, '');
  if (u && !/^https?:\/\//i.test(u)) u = `https://${u}`;
  return u.replace(/^(https?:\/\/[^/]+).*$/i, '$1').toLowerCase();
}

async function relayFetch(path, { method = 'GET', body, headers = {} } = {}) {
  const r = relay();
  if (!r.url || !r.token) throw new Error('Set up your relay in Settings first');
  let res;
  try {
    res = await fetch(`${cleanRelayUrl(r.url)}${path}`, {
      method, headers: { Authorization: `Bearer ${r.token}`, ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Can’t reach your relay. Open Settings → Connections → Your relay and tap Save and test.');
  }
  const text = await res.text().catch(() => '');
  let data = {};
  try { data = JSON.parse(text) ?? {}; } catch {}
  // The relay answers { error }; Canvas errors passed through look like { errors: [{ message }] },
  // or plain text such as "403 Forbidden (Rate Limit Exceeded)".
  if (!res.ok) {
    const err = new Error(data.error ?? data.errors?.[0]?.message ?? data.message ?? (text.trim().slice(0, 120) || `Relay error ${res.status}`));
    err.status = res.status;
    throw err;
  }
  return data;
}

// ---------- inbox: Apple Pay purchases and Siri notes ----------
let lastPull = 0;
export async function pullInbox({ force = false } = {}) {
  if (!relay().url || !relay().token || (!force && Date.now() - lastPull < 60000)) return;
  lastPull = Date.now();
  let items;
  try { ({ items = [] } = await relayFetch('/inbox')); } catch (err) { if (force) toast(err.message, { icon: 'alert' }); return; }
  if (!items.length) { if (force) toast('Inbox is empty', { icon: 'check' }); return; }
  const refs = new Set(txns().map(t => t.ref).filter(Boolean));
  let spent = 0, notes = 0;
  const done = [];
  for (const it of items.sort((a, b) => a.ts - b.ts)) {
    const b = it.body ?? {};
    const date = dayKey(new Date(it.ts));
    if (b.amount != null && String(b.amount).trim() !== '') {
      const ref = `applepay|${it.key}`;
      const amount = Math.abs(num(b.amount));
      if (amount && !refs.has(ref)) {
        const merchant = cleanMerchant(String(b.merchant ?? b.name ?? 'Apple Pay'));
        await addEntry('txn', { kind: 'expense', amount, category: guessCategory(merchant, -amount), account: /revolut/i.test(b.card ?? '') ? 'revolut' : 'westpac', merchant, note: 'Apple Pay', ref, source: 'applepay' }, date);
        spent++;
      }
    } else if (b.text) {
      notes++;
      if (hasAI()) await sendMessage(String(b.text));
      else await quickParse(String(b.text), date);
    }
    done.push(it.key);
  }
  await relayFetch('/inbox/ack', { method: 'POST', body: { keys: done } }).catch(() => {});
  if (spent || notes) toast([spent && `${plural(spent, 'Apple Pay purchase')} added`, notes && `${plural(notes, 'Siri note')} logged`].filter(Boolean).join(' · '), { icon: spent ? 'contactless' : 'mic' });
  render();
}

// Without the AI: understand a few simple phrases, otherwise keep it as a task.
async function quickParse(text, date) {
  const t = text.toLowerCase();
  const n = Number(t.match(/(\d+(?:\.\d+)?)/)?.[1] ?? 1);
  if (/water|glass/.test(t)) return setWater(waterOn(dayKey()) + Math.max(1, Math.round(n)));
  if (/weigh|kg/.test(t) && n > 30) return addEntry('weight', { kg: Math.round(n * 10) / 10 }, date);
  return addEntry('task', { title: text.slice(0, 80), due: null, area: 'life', done: false, source: 'siri' }, date);
}

// ---------- Canvas ----------
// A fallback unit code like "BIO (S1)" must not be read as regex syntax.
const reEscape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Canvas throttles with a 403 "Rate Limit Exceeded": wait and try again rather than give up.
const canvasGet = async path => {
  const c = canvas();
  for (let tries = 0; ; tries++) {
    try {
      return await relayFetch(`/canvas/${path}`, { headers: { 'X-Canvas-Domain': c.domain, 'X-Canvas-Token': c.token } });
    } catch (err) {
      if (err.status !== 403 || !/rate limit/i.test(err.message) || tries >= 3) throw err;
      await new Promise(r => setTimeout(r, 1500 * 2 ** tries));
    }
  }
};

export async function syncCanvas() {
  const c = canvas();
  if (!c.domain || !c.token) { openSheet('guideCanvas'); return; }
  toast('Syncing Canvas…', { icon: 'repeat', ms: 6000 });
  try {
    const list = await canvasGet('courses?enrollment_state=active&per_page=50');
    if (!Array.isArray(list)) throw new Error('Canvas didn’t send a course list');
    let added = 0, updated = 0;
    const skipped = [];
    let why = null;
    const colors = ['school', 'work', 'diet', 'sleep', 'move', 'money'];
    for (const [ci, cc] of list.filter(x => x.name && !x.access_restricted_by_date).entries()) {
      const code = (String(cc.course_code ?? cc.name).toUpperCase().match(/[A-Z]{3,5}\d{3,5}[A-Z]?/) ?? [String(cc.course_code ?? '').slice(0, 10).toUpperCase()])[0];
      let course = courses().find(x => x.canvasId === cc.id) ?? courses().find(x => x.code === code);
      const name = String(cc.name).replace(new RegExp(`^${reEscape(code)}\\s*[-:–]?\\s*`, 'i'), '').slice(0, 60) || code;
      if (!course) course = await addEntry('course', { code, name, credits: 6, color: colors[ci % colors.length], canvasId: cc.id }, dayKey());
      else if (!course.canvasId) await updateEntry(course.id, { canvasId: cc.id });
      // Some units (orientation, library, closed-off ones) refuse this call: skip them, keep syncing the rest.
      let groups;
      try { groups = await canvasGet(`courses/${cc.id}/assignment_groups?include[]=assignments&include[]=submission&per_page=50`); } catch (err) { why ??= err.message; groups = null; }
      if (!Array.isArray(groups)) { skipped.push(code); continue; }
      for (const g of groups) {
        const each = g.assignments?.length ? Number(g.group_weight || 0) / g.assignments.length : 0;
        for (const a of g.assignments ?? []) {
          if (!a.due_at && !a.submission?.score) continue;
          const due = a.due_at ? new Date(a.due_at) : null;
          const sub = a.submission ?? {};
          const fields = {
            courseId: course.id, title: String(a.name).slice(0, 60), kind: /exam|test/i.test(a.name) ? 'exam' : /quiz/i.test(a.name) ? 'quiz' : 'assignment',
            weight: Math.round(each * 10) / 10, due: due ? dayKey(due) : dayKey(), dueTime: due ? `${pad(due.getHours())}:${pad(due.getMinutes())}` : '',
            score: sub.score != null && a.points_possible ? Math.round((sub.score / a.points_possible) * 1000) / 10 : null,
            done: ['submitted', 'graded', 'pending_review'].includes(sub.workflow_state), canvasId: a.id,
          };
          const existing = assessments().find(x => x.canvasId === a.id);
          if (existing) { await updateEntry(existing.id, fields); updated++; } else { await addEntry('assessment', fields, dayKey()); added++; }
        }
      }
    }
    await setKV('canvas', { ...canvas(), lastSync: Date.now() });
    haptic();
    toast(`Canvas synced: ${added} new, ${updated} updated${skipped.length ? ` · skipped ${skipped.join(', ')}${why ? ` (${why})` : ''}` : ''}`, { icon: 'school', ms: skipped.length ? 6000 : undefined });
  } catch (err) {
    toast(`Canvas: ${err.message}`, { icon: 'alert', ms: 4000 });
  }
  render();
}

// ---------- Google Calendar (read-only, OAuth implicit redirect) ----------
const GCAL_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const gcalValid = () => gcal().token && gcal().expires > Date.now() + 60000;

function connectGcal() {
  const { clientId } = gcal();
  if (!clientId) { openSheet('guideGcal'); return; }
  const q = new URLSearchParams({ client_id: clientId, redirect_uri: APP_URL, response_type: 'token', scope: GCAL_SCOPE, include_granted_scopes: 'true', state: 'gcal' });
  if (!gcal().token) q.set('prompt', 'consent');
  location.href = `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}

// Google sends us back to the app with #access_token=… in the address.
export async function handleOAuthRedirect() {
  if (!location.hash.includes('access_token=')) return false;
  const p = new URLSearchParams(location.hash.slice(1));
  history.replaceState(null, '', `${location.pathname}#plan`);
  if (p.get('state') !== 'gcal') return false;
  await setKV('gcal', { ...gcal(), token: p.get('access_token'), expires: Date.now() + Number(p.get('expires_in') ?? 3600) * 1000 });
  await syncGcal();
  return true;
}

async function gapi(path) {
  const res = await fetch(`https://www.googleapis.com/calendar/v3/${path}`, { headers: { Authorization: `Bearer ${gcal().token}` } });
  if (res.status === 401) { await setKV('gcal', { ...gcal(), token: '', expires: 0 }); throw new Error('Google sign-in expired. Tap Reconnect.'); }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? `Google error ${res.status}`);
  return data;
}

export async function syncGcal({ quiet = false } = {}) {
  if (!gcalValid()) return;
  try {
    const cals = (await gapi('users/me/calendarList?minAccessRole=reader')).items?.filter(c => c.selected !== false) ?? [];
    const timeMin = new Date(`${addDays(dayKey(), -7)}T00:00:00`).toISOString();
    const timeMax = new Date(`${addDays(dayKey(), 60)}T23:59:59`).toISOString();
    const out = [];
    for (const c of cals.slice(0, 10)) {
      const ev = await gapi(`calendars/${encodeURIComponent(c.id)}/events?singleEvents=true&orderBy=startTime&maxResults=250&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`);
      for (const e of ev.items ?? []) {
        if (e.status === 'cancelled') continue;
        const s = e.start?.dateTime ? new Date(e.start.dateTime) : null, en = e.end?.dateTime ? new Date(e.end.dateTime) : null;
        out.push({
          id: e.id, title: e.summary ?? '(No title)', cal: c.summaryOverride ?? c.summary ?? 'Google', location: e.location ?? '',
          date: s ? dayKey(s) : e.start?.date, start: s ? `${pad(s.getHours())}:${pad(s.getMinutes())}` : null, end: en ? `${pad(en.getHours())}:${pad(en.getMinutes())}` : null,
        });
      }
    }
    await setKV('gcalEvents', out);
    await setKV('gcal', { ...gcal(), lastSync: Date.now() });
    if (!quiet) toast(`Google Calendar: ${plural(out.length, 'event')}`, { icon: 'calendar' });
  } catch (err) {
    if (!quiet) toast(err.message, { icon: 'alert', ms: 4000 });
  }
  render();
}

agendaSources.push(date => (state.kv.gcalEvents ?? []).filter(e => e.date === date).map(e => ({
  time: e.start, end: e.end, allDay: !e.start, title: e.title, sub: [e.cal, e.location].filter(Boolean).join(' · '), area: 'sleep', icon: 'calendar', tag: 'Google', sheet: 'gcalEvent', id: e.id,
})));

sheets.gcalEvent = ({ id }) => {
  const e = (state.kv.gcalEvents ?? []).find(x => x.id === id);
  if (!e) return `<h2>Event ${closeBtn}</h2>`;
  return `<h2>${esc(e.title)} ${closeBtn}</h2><p class="note">${esc(e.cal)} · read-only from Google Calendar</p>
    <div class="calc-result"><div><span>Date</span><b>${esc(e.date.slice(8))}/${esc(e.date.slice(5, 7))}</b></div><div><span>Start</span><b>${e.start ?? 'All day'}</b></div><div><span>End</span><b>${e.end ?? '–'}</b></div></div>
    ${e.location ? `<p class="note">${icon('globe')} ${esc(e.location)}</p>` : ''}`;
};

// ---------- settings & guides ----------
const copyBtn = text => `<button type="button" class="chip-btn soft copy" data-act="copy" data-text="${esc(text)}">${icon('upload')} Copy</button>`;

settingsSections.push(() => {
  const r = relay(), c = canvas(), g = gcal();
  return `<div class="section-label">Connections</div>
  <section class="card glass conn">
    <div class="row">${tile('calendar', 'sleep')}<div class="grow"><div class="t">Google Calendar</div><div class="d">${!g.clientId ? 'Read-only · needs a Client ID' : gcalValid() ? `Connected · synced ${ago(g.lastSync)}` : 'Signed out · tap Connect'}</div></div>
      ${!g.clientId ? `<button class="pill-btn" data-act="sheet" data-sheet="guideGcal">Set up</button>` : gcalValid() ? `<button class="pill-btn" data-act="gcalSync">Sync</button>` : `<button class="pill-btn strong" data-act="gcalConnect">Connect</button>`}</div>
    <div class="row">${tile('school', 'school')}<div class="grow"><div class="t">Canvas</div><div class="d">${c.token ? `${esc(c.domain)} · synced ${ago(c.lastSync)}` : 'Units and assessments · needs relay + token'}</div></div>
      ${c.token ? `<button class="pill-btn" data-act="canvasSync">Sync</button>` : `<button class="pill-btn" data-act="sheet" data-sheet="guideCanvas">Set up</button>`}</div>
    <div class="row">${tile('contactless', 'money')}<div class="grow"><div class="t">Apple Pay logging</div><div class="d">${r.url ? 'Shortcut sends each tap to your relay' : 'Needs your relay'}</div></div><button class="pill-btn" data-act="sheet" data-sheet="guideApplePay">Guide</button></div>
    <div class="row">${tile('mic', 'sleep')}<div class="grow"><div class="t">Siri: “Log to Loop”</div><div class="d">Say it, Loop logs it next time you open the app</div></div><button class="pill-btn" data-act="sheet" data-sheet="guideSiri">Guide</button></div>
    <div class="row">${tile('upload', 'work')}<div class="grow"><div class="t">Import bank CSV</div><div class="d">Westpac or Revolut statement</div></div><button class="pill-btn" data-act="importCsv">Import</button></div>
    <div class="row">${tile('link', 'diet')}<div class="grow"><div class="t">Your relay</div><div class="d">${r.url ? esc(r.url.replace(/^https?:\/\//, '')) : 'Free Cloudflare Worker you own'}</div></div><button class="pill-btn" data-act="openRelay">${r.url ? 'Edit' : 'Set up'}</button></div>
    ${r.url ? `<button class="btn soft" data-act="inboxPull" style="margin-top:10px">${icon('repeat')} Check inbox now</button>` : ''}
  </section>`;
});

// Step-by-step relay check so each kind of mistake gets a plain-English fix.
let relayCheck = null;
async function checkRelay(url, token) {
  if (!/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/.test(url)) return { ok: false, why: 'url' };
  let status;
  try {
    const res = await fetch(`${url}/`);
    status = await res.json().catch(() => null);
    if (res.status === 401 && status?.error === 'unauthorized') status = { loop: 'relay', version: 1 }; // older Loop code had no status page
  } catch {
    // Can't read it. If Loop's own icon loads from that address (see servesLoopSite), it's the Loop website.
    return { ok: false, why: (await servesLoopSite(url)) ? 'site' : 'unreachable' };
  }
  if (!status?.loop) return { ok: false, why: (await servesLoopSite(url)) ? 'site' : 'not-loop' };
  if (status.version >= 2) {
    if (!status.token_set) return { ok: false, why: 'no-token' };
    if (!status.kv_bound) return { ok: false, why: 'no-kv' };
    if (status.allowed_origin && status.allowed_origin !== '*' && status.allowed_origin !== location.origin.toLowerCase()) return { ok: false, why: 'origin', got: status.allowed_origin };
  }
  try {
    const res = await fetch(`${url}/ping`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) return { ok: false, why: 'token' };
    if (!res.ok) return { ok: false, why: 'error', msg: (await res.json().catch(() => ({}))).error ?? `status ${res.status}` };
  } catch {
    return { ok: false, why: 'origin', got: status.allowed_origin ?? '(not readable)' };
  }
  return { ok: true, version: status.version };
}

// A Cloudflare project made with "Import a repository" publishes the Loop website instead of the relay.
const servesLoopSite = url => new Promise(resolve => {
  const img = new Image();
  const done = v => { clearTimeout(t); resolve(v); };
  const t = setTimeout(() => done(false), 6000);
  img.onload = () => done(img.naturalWidth > 0);
  img.onerror = () => done(false);
  img.src = `${url}/icons/icon-192.png?probe=${Date.now()}`;
});

const FIXES = {
  site: url => `<b>${esc(url)}</b> is showing the Loop app itself, not the relay. That happens when the Cloudflare project is made with <b>Import a repository</b>.<br>Fix: in Cloudflare go to <b>Workers &amp; Pages → Create → Start with Hello World!</b>, name it e.g. <b>loop-api</b>, <b>Deploy</b>, then <b>Edit code</b> → paste the relay code → <b>Deploy</b>. Add the <b>INBOX</b> binding and the two variables to this new worker, and paste its address here. You can delete the old project.`,
  url: () => 'That doesn’t look like a web address. Copy it from Cloudflare: <b>Workers &amp; Pages</b> → your worker → the <b>…workers.dev</b> link.',
  unreachable: url => `Loop can’t read <b>${esc(url)}</b>. Tap <b>Open in Safari</b> below:<br>• If it shows <b>Hello World!</b>, the Loop code isn’t deployed yet: <b>Edit code</b> → paste <b>relay/worker.js</b> → <b>Deploy</b>.<br>• If the page doesn’t open, the address is wrong. Copy the exact <b>…workers.dev</b> link from your worker’s page (the worker name may be <b>loop-relay</b>, with a dash).<br>• If it shows text starting with <b>{"loop":"relay"</b>, tap Save and test again.`,
  'not-loop': () => 'That address works but isn’t running Loop’s code. In Cloudflare: <b>Edit code</b> → delete everything → paste <b>relay/worker.js</b> → <b>Deploy</b>.',
  'no-token': () => 'The worker has no <b>RELAY_TOKEN</b>. Add it under <b>Settings → Variables and Secrets</b> as type <b>Secret</b>, then deploy.',
  'no-kv': () => 'The worker can’t find its storage. Under <b>Settings → Bindings</b>, add a <b>KV namespace</b> binding with the variable name <b>INBOX</b> (all capitals) pointing to <b>loop-inbox</b>.',
  origin: (_, c) => `<b>ALLOWED_ORIGIN</b> on the worker is <b>${esc(c.got)}</b>, but it must be exactly <b>${esc(location.origin)}</b> (no <b>/WebApp</b>, no slash at the end). Change it under <b>Settings → Variables and Secrets</b> and deploy.`,
  token: () => 'The relay is fine, but the token doesn’t match the <b>RELAY_TOKEN</b> secret. Paste it again in both places (watch for spaces at the start or end).',
  error: (_, c) => `The relay replied with an error: ${esc(c.msg)}`,
};

function relayResult(url) {
  if (!relayCheck) return '';
  if (relayCheck.busy) return `<div class="check-box">${icon('repeat')} Checking your relay…</div>`;
  if (relayCheck.ok) return `<div class="check-box ok">${icon('check')}<div><b>Relay connected.</b> Next, set up <a data-act="sheet" data-sheet="guideApplePay">Apple Pay logging</a>.${relayCheck.version < 2 ? '<br>Tip: paste the latest <b>relay/worker.js</b> again for clearer error messages.' : ''}</div></div>`;
  return `<div class="check-box bad">${icon('alert')}<div>${FIXES[relayCheck.why](url, relayCheck)}</div></div>
    ${url && /^https:/.test(url) ? `<a class="btn soft" href="${esc(url)}" target="_blank" rel="noopener" style="margin-top:10px">${icon('globe')} Open in Safari</a>` : ''}`;
}

sheets.guideRelay = () => {
  const r = relay();
  return `<h2>Your relay ${closeBtn}</h2>
    <p class="note">A tiny free server you own on Cloudflare. It holds Apple Pay taps and Siri notes until Loop picks them up, and passes Canvas requests through (Canvas blocks apps calling it directly). It never stores your Canvas token.</p>
    <ol class="steps">
      <li>Sign up free at <b>dash.cloudflare.com</b> → <b>Workers &amp; Pages</b> → <b>Create</b> → <b>Start with Hello World!</b> (not “Import a repository”), name it <b>loop-relay</b> → <b>Deploy</b>.</li>
      <li><b>Edit code</b>: delete everything, paste Loop's relay code, then <b>Deploy</b>. <a class="chip-btn soft" href="https://raw.githubusercontent.com/kylev202/WebApp/main/relay/worker.js" target="_blank" rel="noopener">${icon('code')} Open the code</a> (tap and hold → Select All → Copy)</li>
      <li><b>Storage &amp; Databases → KV</b> → create a namespace <b>loop-inbox</b>. In the worker's <b>Settings → Bindings</b>, add KV namespace binding named <b>INBOX</b>.</li>
      <li><b>Settings → Variables and Secrets</b>: add secret <b>RELAY_TOKEN</b> (any long random password) and variable <b>ALLOWED_ORIGIN</b> = <b>${esc(location.origin)}</b>.</li>
      <li>Paste the worker URL and token below.</li>
    </ol>
    <form data-form="relay">
      <div class="field"><label>Worker URL</label><input class="input-x" name="url" value="${esc(r.url)}" placeholder="https://loop-relay.you.workers.dev" inputmode="url" autocomplete="off"></div>
      <div class="field"><label>Relay token</label><input class="input-x" name="token" value="${esc(r.token)}" placeholder="the RELAY_TOKEN secret" autocomplete="off"></div>
      <button class="btn">Save and test</button>
    </form>
    ${relayResult(cleanRelayUrl(r.url))}`;
};

sheets.guideApplePay = () => {
  const r = relay();
  return `<h2>Apple Pay logging ${closeBtn}</h2>
    <p class="note">Every time you tap your Westpac or Revolut card in Apple Wallet, iPhone sends the amount and shop to your relay. Loop adds it to Money and picks a category.</p>
    ${!r.url ? `<button class="btn soft" data-act="sheet" data-sheet="guideRelay">Set up the relay first</button>` : ''}
    <ol class="steps">
      <li>Open <b>Shortcuts</b> → <b>Automation</b> → <b>＋</b> → <b>Transaction</b>.</li>
      <li>Choose your <b>Westpac</b> and <b>Revolut</b> cards, pick <b>Run Immediately</b>, then <b>Next</b> → <b>New Blank Automation</b>.</li>
      <li>Add <b>Get Contents of URL</b>. URL: <code>${esc((r.url || 'https://your-relay').replace(/\/$/, ''))}/inbox</code> ${copyBtn(`${(r.url || '').replace(/\/$/, '')}/inbox`)}</li>
      <li>Tap <b>Show More</b>: Method <b>POST</b>. Header <b>Authorization</b> = <code>Bearer ${esc(r.token ? `${r.token.slice(0, 3)}…` : 'your-token')}</code> ${copyBtn(`Bearer ${r.token}`)}</li>
      <li>Request Body <b>JSON</b>, add fields: <b>amount</b> → Shortcut Input › <b>Amount</b>, <b>merchant</b> → <b>Merchant</b>, <b>card</b> → <b>Card or Pass</b>.</li>
      <li>Done. Tap your card once, then open Loop: the purchase appears in Money.</li>
    </ol>
    <p class="note">Bank transfers and direct debits don't go through Apple Pay. Import your monthly Westpac/Revolut CSV to catch those.</p>`;
};

sheets.guideSiri = () => {
  const r = relay();
  return `<h2>Siri: “Log to Loop” ${closeBtn}</h2>
    <p class="note">Say “Hey Siri, Log to Loop”, then speak: “two glasses of water”, “chicken wrap 600 calories”, “spent 12 on lunch”. ${hasAI() ? 'The assistant logs it when you open Loop.' : 'Without the AI assistant, Loop understands water and weight, and saves anything else as a task.'}</p>
    <ol class="steps">
      <li><b>Shortcuts</b> → <b>＋</b> new shortcut, name it <b>Log to Loop</b>.</li>
      <li>Add <b>Dictate Text</b> (or <b>Ask for Input</b>).</li>
      <li>Add <b>Get Contents of URL</b>: <code>${esc((r.url || 'https://your-relay').replace(/\/$/, ''))}/inbox</code> ${copyBtn(`${(r.url || '').replace(/\/$/, '')}/inbox`)}, Method <b>POST</b>, header <b>Authorization</b> = <code>Bearer …</code> ${copyBtn(`Bearer ${r.token}`)}, JSON body field <b>text</b> → <b>Dictated Text</b>.</li>
      <li>Optional reminders: <b>Automation</b> → <b>Time of Day</b> (e.g. 10:30 pm) → <b>Show Notification</b> “Wind down, log your day in Loop”.</li>
    </ol>`;
};

sheets.guideCanvas = () => {
  const c = canvas();
  return `<h2>Canvas ${closeBtn}</h2>
    <p class="note">Loop downloads your units, assignments, due dates, weights and marks from Canvas. Requests go through your relay.</p>
    ${!relay().url ? `<button class="btn soft" data-act="sheet" data-sheet="guideRelay">Set up the relay first</button>` : ''}
    <ol class="steps">
      <li>In Canvas on the web: <b>Account</b> → <b>Settings</b> → <b>＋ New Access Token</b>. (Some unis turn this off.)</li>
      <li>Copy the token and your Canvas address, e.g. <b>canvas.sydney.edu.au</b>.</li>
    </ol>
    <form data-form="canvas">
      <div class="field"><label>Canvas address</label><input class="input-x" name="domain" value="${esc(c.domain)}" placeholder="canvas.youruni.edu.au" autocomplete="off" inputmode="url"></div>
      <div class="field"><label>Access token</label><input class="input-x" name="token" value="${esc(c.token)}" placeholder="paste token" autocomplete="off"></div>
      <button class="btn">Save and sync</button>
    </form>
    <p class="note">The token gives full access to your Canvas account, so it stays on this iPhone and is never saved on the relay.</p>`;
};

sheets.guideGcal = () => {
  const g = gcal();
  return `<h2>Google Calendar ${closeBtn}</h2>
    <p class="note">Loop only reads your calendar. Events the assistant plans go in Loop's own calendar.</p>
    <ol class="steps">
      <li>Go to <b>console.cloud.google.com</b> → create a project <b>Loop</b>.</li>
      <li><b>APIs &amp; Services → Library</b> → enable <b>Google Calendar API</b>.</li>
      <li><b>OAuth consent screen</b> (now called <b>Google Auth Platform</b>): External, app name Loop. Then <b>Audience → Test users → Add users</b> and add your Gmail, or Google blocks you with “access_denied”.</li>
      <li><b>Credentials → Create credentials → OAuth client ID → Web application</b>.<br>Authorised JavaScript origin: <code>${esc(location.origin)}</code> ${copyBtn(location.origin)}<br>Authorised redirect URI: <code>${esc(APP_URL)}</code> ${copyBtn(APP_URL)}</li>
      <li>Copy the <b>Client ID</b> and paste it below.</li>
    </ol>
    <form data-form="gcal">
      <div class="field"><label>OAuth Client ID</label><input class="input-x" name="clientId" value="${esc(g.clientId)}" placeholder="…apps.googleusercontent.com" autocomplete="off"></div>
      <div class="btn-row"><button class="btn">Save and connect</button>${g.clientId ? '<button type="button" class="btn danger" data-act="gcalForget">Remove</button>' : ''}</div>
    </form>
    <p class="note"><b>Google says “access_denied” or “hasn’t completed verification”?</b> Add your Gmail under <b>Audience → Test users</b>. On the “Google hasn’t verified this app” screen, tap <b>Continue</b>.</p>
    <p class="note"><b>Google says “redirect_uri_mismatch”?</b> Open your OAuth client in Google Cloud and make the redirect URI exactly <code>${esc(APP_URL)}</code> (capitals and the slash at the end count). Save, wait 5 minutes, then Connect again.</p>
    <p class="note">Google sign-in lasts about an hour. When it runs out, Loop keeps the last synced events and shows Connect again.</p>`;
};

Object.assign(actions, {
  openRelay: () => { relayCheck = null; openSheet('guideRelay'); },
  gcalConnect: connectGcal,
  gcalSync: () => syncGcal(),
  async gcalForget() { await setKV('gcal', {}); await setKV('gcalEvents', []); closeSheet(); render(); },
  canvasSync: () => syncCanvas(),
  inboxPull: () => pullInbox({ force: true }),
  async copy(el) {
    try { await navigator.clipboard.writeText(el.dataset.text); toast('Copied', { icon: 'check' }); } catch { toast('Couldn’t copy', { icon: 'alert' }); }
  },
});

Object.assign(forms, {
  async relay(f) {
    const url = cleanRelayUrl(f.get('url')), token = String(f.get('token')).trim();
    await setKV('relay', { url, token });
    relayCheck = { busy: true };
    refreshSheet();
    relayCheck = await checkRelay(url, token);
    if (relayCheck.ok) { haptic(); toast('Relay connected', { icon: 'link' }); }
    refreshSheet();
    render();
  },
  async canvas(f) {
    await setKV('canvas', { ...canvas(), domain: String(f.get('domain')).trim().replace(/^https?:\/\//, '').replace(/\/.*$/, ''), token: String(f.get('token')).trim() });
    closeSheet();
    await syncCanvas();
  },
  async gcal(f) {
    await setKV('gcal', { ...gcal(), clientId: String(f.get('clientId')).trim() });
    connectGcal();
  },
});

// Check the inbox and refresh Google events when Loop opens or comes back to the front.
export function startConnections() {
  pullInbox();
  if (gcalValid() && Date.now() - (gcal().lastSync ?? 0) > 15 * 60000) syncGcal({ quiet: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    pullInbox();
    if (gcalValid() && Date.now() - (gcal().lastSync ?? 0) > 15 * 60000) syncGcal({ quiet: true });
  });
}
