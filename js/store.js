// Tiny IndexedDB layer. Everything is loaded into memory on start (one person's data
// stays small), and every write goes straight to IndexedDB on the device.

const DB_NAME = 'loop';
const DB_VERSION = 1;

let db;
export const state = { entries: [], kv: {} };

const done = r => new Promise((resolve, reject) => {
  r.onsuccess = () => resolve(r.result);
  r.onerror = () => reject(r.error);
});
const txDone = tx => new Promise((resolve, reject) => {
  tx.oncomplete = () => resolve();
  tx.onerror = tx.onabort = () => reject(tx.error);
});

export async function openStore() {
  const open = indexedDB.open(DB_NAME, DB_VERSION);
  open.onupgradeneeded = () => {
    const d = open.result;
    if (!d.objectStoreNames.contains('entries')) d.createObjectStore('entries', { keyPath: 'id' });
    if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
  };
  db = await done(open);
  await load();
  // Ask iOS to treat our storage as persistent so it isn't evicted under pressure.
  navigator.storage?.persist?.().catch(() => {});
}

async function load() {
  const tx = db.transaction(['entries', 'kv']);
  const kv = tx.objectStore('kv');
  const [entries, keys, values] = await Promise.all([
    done(tx.objectStore('entries').getAll()),
    done(kv.getAllKeys()),
    done(kv.getAll()),
  ]);
  state.entries = entries;
  state.kv = Object.fromEntries(keys.map((k, i) => [k, values[i]]));
}

// Insert or replace a whole entry (also used to undo a delete).
export async function putEntry(entry) {
  const tx = db.transaction('entries', 'readwrite');
  tx.objectStore('entries').put(entry);
  await txDone(tx);
  const i = state.entries.findIndex(e => e.id === entry.id);
  if (i >= 0) state.entries[i] = entry;
  else state.entries.push(entry);
  return entry;
}

export function addEntry(type, fields, date) {
  return putEntry({ id: crypto.randomUUID(), type, date, ts: Date.now(), ...fields });
}

export function updateEntry(id, fields) {
  const old = state.entries.find(e => e.id === id);
  return putEntry({ ...old, ...fields, id });
}

// Returns the removed entry so callers can offer Undo.
export async function removeEntry(id) {
  const entry = state.entries.find(e => e.id === id);
  const tx = db.transaction('entries', 'readwrite');
  tx.objectStore('entries').delete(id);
  await txDone(tx);
  state.entries = state.entries.filter(e => e.id !== id);
  return entry;
}

export async function setKV(key, value) {
  const tx = db.transaction('kv', 'readwrite');
  tx.objectStore('kv').put(value, key);
  await txDone(tx);
  state.kv[key] = value;
}

export function exportData() {
  return { app: 'loop', version: 1, exportedAt: new Date().toISOString(), entries: state.entries, kv: state.kv };
}

export async function importData(data) {
  if (data?.app !== 'loop' || !Array.isArray(data.entries) || typeof data.kv !== 'object') {
    throw new Error('Not a Loop backup file');
  }
  const tx = db.transaction(['entries', 'kv'], 'readwrite');
  const entries = tx.objectStore('entries');
  const kv = tx.objectStore('kv');
  entries.clear();
  kv.clear();
  data.entries.forEach(e => entries.put(e));
  Object.entries(data.kv).forEach(([k, v]) => kv.put(v, k));
  await txDone(tx);
  await load();
}

export async function eraseAll() {
  const tx = db.transaction(['entries', 'kv'], 'readwrite');
  tx.objectStore('entries').clear();
  tx.objectStore('kv').clear();
  await txDone(tx);
  state.entries = [];
  state.kv = {};
}
