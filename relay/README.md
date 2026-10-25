# Loop relay

A tiny free Cloudflare Worker that you own. Loop uses it for two things a website on its own can't do:

1. **Inbox for Apple Pay and Siri.** iPhone Shortcuts can't write into the Loop app directly, so they POST each Apple Pay tap or dictated note here. Loop collects and clears them when you open it.
2. **Canvas pass-through.** Canvas blocks API calls from other websites. The relay forwards them. Your Canvas token is sent with each request and never stored.

Nothing else is stored. Inbox items expire after 30 days.

## Set up (dashboard, about 5 minutes)

1. Sign up free at [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Hello World** → name it `loop-relay` → **Deploy**.
2. **Edit code** → replace everything with [`worker.js`](worker.js) → **Deploy**.
3. **Storage & Databases → KV** → **Create** namespace `loop-inbox`.
4. In the worker: **Settings → Bindings → Add → KV namespace**: variable name `INBOX`, namespace `loop-inbox`.
5. **Settings → Variables and Secrets**:
   - Secret `RELAY_TOKEN` = a long random password (e.g. from a password manager).
   - Variable `ALLOWED_ORIGIN` = `https://kylev202.github.io`
6. In Loop: **Settings → Connections → Your relay** → paste the worker URL (`https://loop-relay.<you>.workers.dev`) and the token → **Save and test**.

Then follow the in-app guides for **Apple Pay logging**, **Siri: "Log to Loop"** and **Canvas**.

## Troubleshooting

Open your worker's address in Safari (e.g. `https://loop-relay.you.workers.dev`). With the current code you see a line like:

```json
{"loop":"relay","version":2,"token_set":true,"kv_bound":true,"allowed_origin":"https://kylev202.github.io"}
```

| You see | Fix |
|---|---|
| `Hello World!` | The Loop code isn't deployed: **Edit code** → paste [`worker.js`](worker.js) → **Deploy** |
| Page doesn't load | Wrong address: copy the exact `…workers.dev` link from the worker's page |
| `"token_set":false` | Add the secret `RELAY_TOKEN` (Settings → Variables and Secrets) |
| `"kv_bound":false` | Add the KV binding `INBOX` (Settings → Bindings) |
| `allowed_origin` isn't `https://kylev202.github.io` | Fix `ALLOWED_ORIGIN` (no `/WebApp`, no trailing slash) |

Loop's **Save and test** runs the same checks and tells you which one failed.

## API

All requests need `Authorization: Bearer <RELAY_TOKEN>`.

| Method | Path | Body / headers | |
|---|---|---|---|
| GET | `/` | (no token) | public status, no secrets |
| GET | `/ping` | | health check |
| POST | `/inbox` | JSON `{ amount, merchant, card }` or `{ text }` | add an item |
| GET | `/inbox` | | list items |
| POST | `/inbox/ack` | `{ keys: [...] }` | delete collected items |
| GET | `/canvas/<api path>` | `X-Canvas-Domain`, `X-Canvas-Token` | proxied to `https://<domain>/api/v1/<api path>` |
