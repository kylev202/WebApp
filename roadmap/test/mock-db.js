// Test-only stand-in for the artifact runtime's `claude.use("db")` and `claude.use("user")`.
// Same call shapes as the db capability (doc/collection, get/set/update/delete, where/orderBy/limit, onSnapshot).
// Seeded from window.__seed (roadmap/seed/out/seed.json, content + first-time progress). Not shipped.
(() => {
  const store = new Map(), listeners = new Set(), writes = [];
  for (const [p, d] of Object.entries(window.__seed || {})) store.set(p, {...d.content, ...d.progress});
  for (const [p, d] of Object.entries(window.__extra || {})) store.set(p, {...(store.get(p) || {}), ...d});
  const clone = v => v === undefined ? v : JSON.parse(JSON.stringify(v));
  const rid = () => Math.random().toString(36).slice(2, 12);
  const notify = () => setTimeout(() => listeners.forEach(l => l()), 5);
  const merge = (a, b) => { const o = {...a}; for (const [k, v] of Object.entries(b)) o[k] = v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k]) ? merge(a[k], v) : v; return o; };
  const meta = {fromCache: false, hasPendingWrites: false};
  const snapDoc = path => { const d = store.get(path); return {id: path.split('/').pop(), exists: !!d, data: () => clone(d), metadata: meta}; };
  function docRef(path) {
    if (path.split('/').length % 2) throw new TypeError('document path needs an even number of segments: ' + path);
    return {
      id: path.split('/').pop(), path,
      get: async () => snapDoc(path),
      set: async d => { store.set(path, clone(d)); writes.push(['set', path, clone(d)]); notify(); },
      update: async d => { if (!store.has(path)) throw {code: 'invalid_argument', message: 'missing'}; store.set(path, merge(store.get(path), clone(d))); writes.push(['update', path, clone(d)]); notify(); },
      delete: async () => { store.delete(path); writes.push(['delete', path]); notify(); },
      onSnapshot: (next) => { const l = () => next(snapDoc(path)); listeners.add(l); setTimeout(l, 20); return () => listeners.delete(l); },
      collection: sub => query(`${path}/${sub}`),
    };
  }
  function query(col, filters = [], order = null, lim = null) {
    const depth = col.split('/').length + 1;
    const run = () => {
      let docs = [...store.keys()].filter(p => p.startsWith(col + '/') && p.split('/').length === depth).sort().map(snapDoc);
      for (const [f, op, v] of filters) docs = docs.filter(d => { const x = d.data()[f]; return op === '==' ? x === v : op === '!=' ? x !== v : op === '<' ? x < v : op === '<=' ? x <= v : op === '>' ? x > v : op === '>=' ? x >= v : true; });
      if (order) docs.sort((a, b) => { const x = a.data()[order[0]], y = b.data()[order[0]]; return (x === y ? 0 : x === undefined ? 1 : y === undefined ? -1 : x < y ? -1 : 1) * (order[1] === 'desc' ? -1 : 1); });
      if (lim) docs = docs.slice(0, lim);
      return {docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: meta};
    };
    return {
      path: col,
      where: (f, op, v) => query(col, [...filters, [f, op, v]], order, lim),
      orderBy: (f, dir = 'asc') => query(col, filters, [f, dir], lim),
      limit: n => query(col, filters, order, n),
      get: async () => run(),
      onSnapshot: next => { const l = () => next(run()); listeners.add(l); setTimeout(l, 20); return () => listeners.delete(l); },
      doc: id => docRef(`${col}/${id || rid()}`),
      add: async d => { const r = docRef(`${col}/${rid()}`); await r.set(d); return r; },
    };
  }
  const db = {doc: docRef, collection: p => query(p)};
  const user = {can: async () => window.__canWrite ?? true, canEdit: async () => true, isOwner: async () => true, id: async () => 'kyle-test'};
  window.claude = {use: async name => { await new Promise(r => setTimeout(r, 30)); return window.__noDb ? null : name === 'db' ? db : name === 'user' ? user : null; }};
  window.__mock = {store, writes, get: p => clone(store.get(p)), list: c => [...store.keys()].filter(k => k.startsWith(c + '/')).map(k => [k, clone(store.get(k))])};
})();
