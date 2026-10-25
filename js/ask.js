// v3 Ask: chat with Gemini that logs, plans and answers from your Loop data.
import { state, setKV } from './store.js';
import { esc, uid, timeOf, dayKey, dayLabel } from './util.js';
import { icon, tile } from './icons.js';
import { screens, actions, forms, afterRender, ui, render, openSheet, toast, haptic, confetti, header } from './core.js';
import { aiSettings, hasAI, listModels, bestModel, generate, systemPrompt, tools, runTool, undoCard } from './ai.js';
import { settingsSections } from './settings.js';

const chat = () => state.kv.chat ?? [];
let busy = false;

const SUGGESTIONS = [
  ['diet', 'diet', '3 eggs, 2 toast and a protein shake for breakfast'],
  ['dumbbell', 'move', 'Bench 3x8 at 60, incline db 3x10 at 22'],
  ['card', 'money', 'Spent $18.50 on lunch at uni'],
  ['calendar', 'school', 'Plan study blocks for my exams this week'],
  ['chart', 'diet', 'How is my bulk going?'],
  ['coffee', 'work', 'Add a café shift Saturday 9 to 3'],
];
const CHIPS = [['diet', 'Log meal', 'I ate '], ['dumbbell', 'Log workout', 'I did '], ['card', 'Spent…', 'Spent $'], ['calendar', 'Plan tomorrow', 'Plan my day tomorrow'], ['plus', 'Quick log', null]];

// ---------- screen ----------
function cardHtml(m, c, i) {
  return `<div class="logged ${c.undone ? 'undone' : ''}">${tile(c.icon, c.area)}<div class="grow"><div class="t">${esc(c.title)}</div><div class="d">${esc(c.sub ?? '')}</div></div>
    ${c.undone ? '<span class="undone-tag">Undone</span>' : `<button class="undo" data-act="undoCard" data-m="${m.id}" data-c="${i}">Undo</button>`}</div>`;
}

function messageHtml(m, prev) {
  const sep = !prev || prev.ts < m.ts - 30 * 60000 ? `<div class="day-sep">${dayLabel(dayKey(new Date(m.ts)))} ${timeOf(m.ts)}</div>` : '';
  if (m.role === 'user') return `${sep}<div class="msg-me">${m.photo ? `<span class="photo-tag">${icon('camera')}Photo</span>` : ''}${esc(m.text)}</div>`;
  return `${sep}<div class="msg-ai">${tile('sparkle', 'sleep')}<div class="bubble glass ${m.error ? 'err' : ''}">${m.text ? `<p>${format(m.text)}</p>` : ''}${(m.cards ?? []).map((c, i) => cardHtml(m, c, i)).join('')}</div></div>`;
}

// Light formatting: **bold**, line breaks and "- " bullets.
const format = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/^[-•] (.+)$/gm, '• $1').replace(/\n/g, '<br>');

function renderAsk() {
  if (!hasAI()) return renderSetup();
  const msgs = chat();
  return `${header('Ask', `${icon('sparkle')} Gemini · knows your Loop data`, msgs.length ? `<button class="icon-btn glass" data-act="clearChat" aria-label="Clear chat">${icon('trash')}</button>` : '')}
  <div class="chat">
    ${msgs.length ? msgs.map((m, i) => messageHtml(m, msgs[i - 1])).join('') : `
      <section class="card glass ask-hello">${tile('sparkle', 'sleep', 'xl')}<div class="t">Log or ask anything</div>
        <p class="note center">Tell me what you ate, lifted, spent or need to do. I'll log it and keep you on track.</p>
        <div class="suggest">${SUGGESTIONS.map(([ic, area, text]) => `<button class="sugg" data-act="askSend" data-q="${esc(text)}">${tile(ic, area)}<span>${esc(text)}</span></button>`).join('')}</div>
      </section>`}
    ${busy ? `<div class="msg-ai">${tile('sparkle', 'sleep')}<div class="bubble glass typing"><i></i><i></i><i></i></div></div>` : ''}
  </div>
  <form class="composer" data-form="ask">
    <div class="quick">${CHIPS.map(([ic, label, fill]) => `<button type="button" class="qchip" data-act="${fill == null ? 'quick' : 'askFill'}" data-q="${esc(fill ?? '')}">${icon(ic)}${label}</button>`).join('')}</div>
    ${ui.askPhoto ? `<div class="photo-preview"><img src="${ui.askPhoto}" alt=""><span>Photo attached: roster, meal or receipt</span><button type="button" class="x-btn" data-act="askPhotoClear" aria-label="Remove photo">${icon('close')}</button></div>` : ''}
    <div class="input-bar glass">
      <label class="cbtn" aria-label="Add a photo">${icon('camera')}<input type="file" id="ask-photo" accept="image/*" hidden></label>
      <input name="q" id="ask-q" placeholder="${busy ? 'Thinking…' : 'Ask or log anything…'}" autocomplete="off" enterkeyhint="send" ${busy ? 'disabled' : ''}>
      <button type="button" class="cbtn mic ${ui.listening ? 'on' : ''}" data-act="askMic" aria-label="Speak">${icon('mic')}</button>
      <button class="cbtn send" aria-label="Send" ${busy ? 'disabled' : ''}>${icon('send')}</button>
    </div>
  </form>`;
}

function renderSetup() {
  return `${header('Ask', 'AI assistant')}
  <section class="card glass ask-hello">${tile('sparkle', 'sleep', 'xl')}<div class="t">Connect Gemini</div>
    <p class="note center">Loop's assistant uses Google's Gemini. The free tier is plenty for one person.</p>
    <ol class="steps">
      <li>Open <b>aistudio.google.com/apikey</b> and sign in with Google.</li>
      <li>Tap <b>Create API key</b> and copy it.</li>
      <li>Paste it below. It's stored only on this iPhone.</li>
    </ol>
    <form data-form="aiKey" class="key-form"><input class="input-x" name="key" placeholder="Paste your Gemini API key" autocomplete="off" required><button class="btn">Connect</button></form>
    <p class="note">Privacy: on the free tier Google may use what you send to improve its products. You can switch to a paid key any time in Settings.</p>
  </section>
  <button class="btn soft" data-act="quick">${icon('plus')} Log manually instead</button>`;
}
screens.ask = renderAsk;

afterRender.push(route => {
  if (route !== 'ask') return;
  window.scrollTo(0, document.documentElement.scrollHeight);
});

// ---------- talking to Gemini ----------
function history(msgs) {
  const contents = [];
  for (const m of msgs.slice(-12)) {
    const text = m.role === 'user' ? m.text : `${m.text}${m.cards?.length ? `\n[Logged: ${m.cards.filter(c => !c.undone).map(c => c.title).join('; ')}]` : ''}`;
    if (!text.trim()) continue;
    const role = m.role === 'user' ? 'user' : 'model';
    if (contents.at(-1)?.role === role) contents.at(-1).parts[0].text += `\n${text}`;
    else contents.push({ role, parts: [{ text }] });
  }
  while (contents[0]?.role === 'model') contents.shift();
  return contents;
}

function friendlyError(err) {
  const m = String(err.message ?? err);
  if (/api key not valid|API_KEY_INVALID|permission/i.test(m)) return 'That API key doesn’t work. Check it in Settings → AI assistant.';
  if (/quota|rate|429|exhausted/i.test(m)) return 'The free Gemini limit is used up for now. Try again in a minute.';
  if (/failed to fetch|network|load failed/i.test(m)) return 'I can’t reach Gemini right now. Check your connection and try again.';
  if (/not found|is not supported/i.test(m)) return 'This Gemini model isn’t available any more. Open Settings → AI assistant and tap Refresh models.';
  return `Something went wrong: ${m}`;
}

export async function sendMessage(text, image) {
  text = String(text ?? '').trim();
  if (busy || (!text && !image)) return;
  busy = true;
  const msgs = [...chat(), { id: uid(), role: 'user', text: text || 'What is in this photo? Log it if it is food, a roster or a receipt.', photo: !!image, ts: Date.now() }];
  state.kv.chat = msgs;
  ui.askPhoto = null;
  render();
  try {
    const contents = history(msgs);
    if (image) contents.at(-1).parts.push({ inlineData: { mimeType: 'image/jpeg', data: image } });
    const cards = [];
    let reply = '';
    for (let step = 0; step < 6; step++) {
      const res = await generate({ system: systemPrompt(), contents, tools: tools() });
      const content = res.candidates?.[0]?.content;
      if (!content?.parts?.length) { reply = res.promptFeedback?.blockReason ? 'I can’t help with that one.' : 'Sorry, I didn’t catch that. Try again?'; break; }
      contents.push(content); // passed back unchanged so thought signatures survive
      const calls = content.parts.filter(p => p.functionCall);
      const said = content.parts.filter(p => p.text && !p.thought).map(p => p.text).join('').trim();
      if (said) reply = said;
      if (!calls.length) break;
      const responses = [];
      for (const p of calls) {
        const { result, card } = await runTool(p.functionCall.name, p.functionCall.args);
        if (card) cards.push(card);
        responses.push({ functionResponse: { ...(p.functionCall.id ? { id: p.functionCall.id } : {}), name: p.functionCall.name, response: result } });
      }
      contents.push({ role: 'user', parts: responses });
    }
    msgs.push({ id: uid(), role: 'model', text: reply, cards, ts: Date.now() });
    if (cards.length) haptic();
    if (cards.some(c => c.confetti)) confetti();
  } catch (err) {
    msgs.push({ id: uid(), role: 'model', text: friendlyError(err), error: true, ts: Date.now() });
  }
  busy = false;
  await setKV('chat', msgs.slice(-60));
  render();
}

// ---------- photo & voice ----------
function downscale(file, max = 1280) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

document.addEventListener('change', async e => {
  if (e.target.id !== 'ask-photo' || !e.target.files[0]) return;
  try {
    ui.askPhoto = await downscale(e.target.files[0]);
    render();
    document.getElementById('ask-q')?.focus();
  } catch {
    toast('Couldn’t read that photo', { icon: 'alert' });
  }
});

let recognizer;
function listen() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast('Use the mic on your keyboard to dictate', { icon: 'mic' }); document.getElementById('ask-q')?.focus(); return; }
  if (recognizer) { recognizer.stop(); return; }
  recognizer = new SR();
  recognizer.lang = 'en-AU';
  recognizer.interimResults = true;
  recognizer.onresult = ev => {
    const input = document.getElementById('ask-q');
    if (input) input.value = [...ev.results].map(r => r[0].transcript).join('');
  };
  recognizer.onend = () => {
    recognizer = null;
    ui.listening = false;
    const q = document.getElementById('ask-q')?.value;
    document.querySelector('.cbtn.mic')?.classList.remove('on');
    if (q?.trim()) sendMessage(q);
  };
  recognizer.onerror = () => { toast('Didn’t catch that', { icon: 'mic' }); };
  ui.listening = true;
  document.querySelector('.cbtn.mic')?.classList.add('on');
  haptic();
  recognizer.start();
}

// ---------- actions ----------
Object.assign(actions, {
  askSend: el => sendMessage(el.dataset.q),
  askFill: el => { const i = document.getElementById('ask-q'); if (i) { i.value = el.dataset.q; i.focus(); } },
  askMic: listen,
  askPhotoClear: () => { ui.askPhoto = null; render(); },
  async undoCard(el) {
    const msgs = chat();
    const m = msgs.find(x => x.id === el.dataset.m);
    const c = m?.cards?.[el.dataset.c];
    if (!c || c.undone) return;
    await undoCard(c);
    c.undone = true;
    await setKV('chat', msgs);
    haptic();
    toast('Undone', { icon: 'repeat' });
    render();
  },
  async clearChat() {
    if (!confirm('Clear the chat? Everything it logged stays logged.')) return;
    await setKV('chat', []);
    render();
  },
  async refreshModels() {
    try {
      const models = await listModels();
      await setKV('ai', { ...aiSettings(), models, model: aiSettings().model && models.includes(aiSettings().model) ? aiSettings().model : bestModel(models) });
      toast(`${models.length} models found`, { icon: 'sparkle' });
    } catch (err) {
      toast(friendlyError(err), { icon: 'alert', ms: 4000 });
    }
    render();
  },
  async aiDisconnect() {
    if (!confirm('Remove the Gemini key from this iPhone?')) return;
    await setKV('ai', {});
    render();
  },
});

Object.assign(forms, {
  ask(f, form) {
    const q = f.get('q');
    form.reset();
    const img = ui.askPhoto ? ui.askPhoto.split(',')[1] : null;
    sendMessage(q, img);
  },
  async aiKey(f) {
    const key = String(f.get('key')).trim();
    if (!key) return;
    await setKV('ai', { key });
    try {
      const models = await listModels();
      await setKV('ai', { key, models, model: bestModel(models) });
      haptic();
      toast('Gemini connected', { icon: 'sparkle' });
    } catch (err) {
      await setKV('ai', {});
      toast(friendlyError(err), { icon: 'alert', ms: 4000 });
    }
    render();
  },
  async aiModel(f) {
    await setKV('ai', { ...aiSettings(), model: f.get('model') });
    toast('Model saved', { icon: 'sparkle' });
    render();
  },
});

settingsSections.push(() => {
  const s = aiSettings();
  if (!s.key) {
    return `<div class="section-label">AI assistant</div><section class="card glass"><p class="note">Connect Google Gemini to log by chatting, plan your week and get coaching.</p><button class="btn soft" data-act="nav" data-to="ask">${icon('sparkle')} Set up the assistant</button></section>`;
  }
  const models = s.models?.length ? s.models : [s.model];
  return `<div class="section-label">AI assistant</div>
  <form class="card glass" data-form="aiModel">
    <div class="row">${tile('sparkle', 'sleep')}<div class="grow"><div class="t">Gemini connected</div><div class="d">Key ending …${esc(s.key.slice(-4))}</div></div></div>
    <div class="field" style="margin-top:12px"><label>Model</label><select class="input-x" name="model">${models.map(m => `<option ${m === s.model ? 'selected' : ''}>${esc(m)}</option>`).join('')}</select></div>
    <div class="row3"><button class="btn">Save</button><button type="button" class="btn soft" data-act="refreshModels">Refresh</button><button type="button" class="btn danger" data-act="aiDisconnect">Remove</button></div>
    <p class="note" style="margin:10px 0 0">Free tier: Google may use your messages to improve its products. Your Loop data summary is sent with each message so the assistant can answer.</p>
  </form>`;
});
