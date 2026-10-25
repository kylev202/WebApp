// Loop relay: a tiny Cloudflare Worker you own.
//  - /inbox      Apple Pay (Shortcuts "Transaction" automation) and Siri notes wait here until Loop picks them up.
//  - /canvas/*   passes Canvas API requests through (Canvas doesn't allow calls from other websites).
//  - /           public status page (no secrets) so you can check the setup in Safari.
// Bindings: KV namespace INBOX. Secret RELAY_TOKEN. Variable ALLOWED_ORIGIN (e.g. https://kylev202.github.io).

const VERSION = 2;
const CANVAS_DOMAIN = /^[a-z0-9.-]+\.(edu\.au|edu|ac\.nz|ac\.uk|instructure\.com)$/i;
const MONTH = 60 * 60 * 24 * 30;

// "https://kylev202.github.io/WebApp/" → "https://kylev202.github.io" (only scheme + host count for CORS).
const originOf = s => String(s || '').trim().replace(/^(https?:\/\/[^/]+).*$/i, '$1').toLowerCase();

export default {
  async fetch(req, env) {
    const allowed = originOf(env.ALLOWED_ORIGIN);
    const origin = originOf(req.headers.get('Origin'));
    const cors = {
      'Access-Control-Allow-Origin': !allowed || allowed === '*' ? '*' : origin === allowed ? req.headers.get('Origin') : allowed,
      'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Canvas-Domain, X-Canvas-Token',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    };
    const json = (data, status = 200, headers = cors) => new Response(JSON.stringify(data), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    try {
      if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

      // Public status: readable from anywhere so Loop can explain what's missing.
      if (path === '/' && req.method === 'GET') {
        return json({ loop: 'relay', version: VERSION, token_set: !!env.RELAY_TOKEN, kv_bound: !!env.INBOX, allowed_origin: allowed || null }, 200, { ...cors, 'Access-Control-Allow-Origin': '*' });
      }

      if (!env.RELAY_TOKEN) return json({ error: 'RELAY_TOKEN secret is not set on the worker' }, 500);
      if (req.headers.get('Authorization') !== `Bearer ${env.RELAY_TOKEN}`) return json({ error: 'unauthorized' }, 401);

      if (path === '/ping') return json({ ok: true, version: VERSION });

      if (path.startsWith('/inbox') && !env.INBOX) return json({ error: 'KV binding INBOX is missing on the worker' }, 500);

      if (path === '/inbox' && req.method === 'POST') {
        // Shortcuts may send JSON or form fields; keep only small, known fields.
        const raw = (await req.json().catch(() => null)) ?? Object.fromEntries(url.searchParams);
        const body = {};
        for (const k of ['amount', 'merchant', 'name', 'card', 'text']) if (raw[k] != null && String(raw[k]).trim() !== '') body[k] = String(raw[k]).slice(0, 300);
        if (!Object.keys(body).length) return json({ error: 'empty' }, 400);
        const key = `item:${Date.now()}:${crypto.randomUUID().slice(0, 8)}`;
        await env.INBOX.put(key, JSON.stringify({ ts: Date.now(), body }), { expirationTtl: MONTH });
        return json({ ok: true });
      }

      if (path === '/inbox' && req.method === 'GET') {
        const list = await env.INBOX.list({ prefix: 'item:', limit: 100 });
        const items = await Promise.all(list.keys.map(async k => ({ key: k.name, ...JSON.parse((await env.INBOX.get(k.name)) || '{}') })));
        return json({ items });
      }

      if (path === '/inbox/ack' && req.method === 'POST') {
        const { keys = [] } = (await req.json().catch(() => ({}))) ?? {};
        await Promise.all(keys.filter(k => typeof k === 'string' && k.startsWith('item:')).map(k => env.INBOX.delete(k)));
        return json({ ok: true });
      }

      if (path.startsWith('/canvas/') && req.method === 'GET') {
        const domain = req.headers.get('X-Canvas-Domain') || '';
        if (!CANVAS_DOMAIN.test(domain)) return json({ error: 'Canvas address not allowed' }, 400);
        const res = await fetch(`https://${domain}/api/v1/${path.slice('/canvas/'.length)}${url.search}`, {
          headers: { Authorization: `Bearer ${req.headers.get('X-Canvas-Token') || ''}`, Accept: 'application/json' },
        });
        return new Response(res.body, { status: res.status, headers: { ...cors, 'Content-Type': 'application/json' } });
      }

      return json({ error: 'not found' }, 404);
    } catch (err) {
      // Never fail without CORS headers, or Safari only says "Load failed".
      return json({ error: `Relay error: ${err.message}` }, 500);
    }
  },
};
