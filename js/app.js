// Loop entry point: wires feature modules, event delegation and routing.
import { state, openStore } from './store.js';
import { dayKey } from './util.js';
import { icon, tile } from './icons.js';
import { screens, actions, forms, previews, ui, render, openSheet, closeSheet, go, header, haptic, moveTabIndicator, reduceMotion } from './core.js';
import './health.js';
import './gym.js';
import './today.js';
import './settings.js';
import './plan.js';
import './money.js';
import './ask.js';
import './csv.js';
import './targets.js';
import './coach.js';
import './day.js';
import { handleOAuthRedirect, startConnections } from './connect.js';

const soon = (title, ic, area, text) => () => `${header(title, 'Coming soon')}
  <section class="card glass soon">${tile(ic, area, 'xl')}<p>${text}</p></section>`;
screens.plan ??= soon('Plan', 'calendar', 'school', 'Your calendar, uni units, café shifts and freelance projects arrive in a later version.');
screens.money ??= soon('Money', 'wallet', 'money', 'Budgets, spending, income, bills and savings goals arrive in a later version.');

Object.assign(actions, {
  // Tapping the tab you're already on scrolls back to the top, like iOS.
  nav: el => {
    if (el.dataset.to !== ui.route) return go(el.dataset.to);
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  },
  quick: () => { haptic(); openSheet('quick'); },
  sheet: el => openSheet(el.dataset.sheet, { ...el.dataset }),
  close: () => closeSheet(),
});

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  e.preventDefault();
  actions[el.dataset.act]?.(el, e);
});
document.addEventListener('submit', e => {
  const f = e.target.closest('form[data-form]');
  if (!f) return;
  e.preventDefault();
  forms[f.dataset.form]?.(new FormData(f), f);
});
// Keyboard: Escape closes a sheet; Enter or Space taps a card or row that isn't a real button.
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && ui.sheet) { closeSheet(); return; }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('[data-act][role="button"]:not(button)')) {
    e.preventDefault();
    e.target.click();
  }
});
['input', 'change'].forEach(type => document.addEventListener(type, e => {
  const f = e.target.closest?.('form[data-form]');
  if (f && previews[f.dataset.form]) previews[f.dataset.form](f);
}));

// Compact blurred title bar once the large title scrolls away.
const topbar = document.getElementById('topbar');
window.addEventListener('scroll', () => topbar.classList.toggle('show', window.scrollY > 48), { passive: true });
window.addEventListener('resize', moveTabIndicator);

function route() {
  ui.route = location.hash.slice(1) || 'today';
  closeSheet(true);
  window.scrollTo(0, 0);
  render({ enter: true });
}
window.addEventListener('hashchange', route);

// Re-render when the app comes back to the foreground on a new day.
let renderedDay = dayKey();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && dayKey() !== renderedDay) { renderedDay = dayKey(); render({ enter: true }); }
});

document.querySelectorAll('[data-icon]').forEach(el => { el.outerHTML = icon(el.dataset.icon); });

await openStore();
await handleOAuthRedirect();
route();
startConnections();
if (!state.kv.onboarded && !state.entries.length) openSheet('welcome');

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
