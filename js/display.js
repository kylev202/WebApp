// Display & accessibility: text size, contrast and transparency.
//
// Text size follows the iPhone's own Text Size (Settings → Display & Brightness)
// unless you pick one here. Safari reports that setting through the system body
// font, which is 17px at the default size, so the ratio to 17 is the scale the
// rest of iOS is using. Every font size in app.css is multiplied by it.
// Contrast and transparency follow the iPhone's Accessibility settings too, and
// can be switched on here for Loop alone.
import { state, setKV } from './store.js';
import { icon } from './icons.js';
import { previews, sect, chips, toggle, toast } from './core.js';

const root = document.documentElement;
const SIZES = [['auto', 'Match iPhone'], ['1', 'Default'], ['1.1', 'Large'], ['1.2', 'Larger'], ['1.3', 'Largest']];
const THEMES = [['auto', 'Match iPhone'], ['light', 'Light'], ['dark', 'Dark']];
// The address bar and the status bar behind the app have to be told the
// colour too, or a dark screen opens behind a light strip.
const THEME_COLOR = { light: '#f8f6f2', dark: '#121113' };
const media = q => window.matchMedia?.(q) ?? { matches: false, addEventListener() {} };
const moreContrast = media('(prefers-contrast: more)');
const lessTransparency = media('(prefers-reduced-transparency: reduce)');
const prefersDark = media('(prefers-color-scheme: dark)');

export const displayPrefs = () => ({ text: 'auto', theme: 'auto', contrast: false, solid: false, ...state.kv.display });

// The iPhone's text size as a multiple of the default. Never below 1: the layout
// is already compact, and inputs must stay at 16px or iOS zooms into them.
function iphoneScale() {
  if (!window.CSS?.supports?.('font', '-apple-system-body')) return 1;
  const el = document.createElement('span');
  el.style.cssText = 'font:-apple-system-body;position:absolute;visibility:hidden;pointer-events:none';
  el.textContent = 'Aa';
  document.body.append(el);
  const px = parseFloat(getComputedStyle(el).fontSize);
  el.remove();
  return px > 0 ? Math.min(1.35, Math.max(1, px / 17)) : 1;
}

export function applyDisplay(p = displayPrefs()) {
  const scale = p.text === 'auto' ? iphoneScale() : Number(p.text) || 1;
  root.style.setProperty('--ts-u', String(Math.round(scale * 100) / 100));
  // 'auto' leaves the attribute off, so the stylesheet's own
  // prefers-color-scheme rules decide; light or dark pins it.
  if (p.theme === 'light' || p.theme === 'dark') root.dataset.theme = p.theme;
  else delete root.dataset.theme;
  // Mirrored into localStorage so the inline script in index.html can set the
  // theme before the first paint; the stored preference itself lives in
  // IndexedDB with everything else, which can only be read asynchronously.
  try { localStorage.setItem('loop-theme', p.theme); } catch { /* private mode */ }
  const dark = p.theme === 'dark' || (p.theme !== 'light' && prefersDark.matches);
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.remove());
  const meta = document.createElement('meta');
  meta.name = 'theme-color';
  meta.content = THEME_COLOR[dark ? 'dark' : 'light'];
  document.head.append(meta);
  root.classList.toggle('hc', !!p.contrast || moreContrast.matches);
  root.classList.toggle('rt', !!p.solid || lessTransparency.matches);
}

// The iPhone settings can change while Loop is in the background.
moreContrast.addEventListener?.('change', () => applyDisplay());
lessTransparency.addEventListener?.('change', () => applyDisplay());
prefersDark.addEventListener?.('change', () => applyDisplay());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') applyDisplay(); });

export function displaySection() {
  const p = displayPrefs();
  const auto = Math.round(iphoneScale() * 100);
  const sizes = SIZES.map(([v, label]) => [v, v === 'auto' ? `${label}${auto > 100 ? ` · ${auto}%` : ''}` : label]);
  return `${sect('Display & accessibility', { nav: 'Display', note: 'Appearance and text size follow your iPhone unless you choose them here. Motion follows Reduce Motion in iPhone Settings.' })}
  <form class="card glass" data-form="display">
    <div class="label-sm">Appearance</div>
    ${chips('theme', THEMES, p.theme, { cls: 'wrap' })}
    <div class="label-sm" style="margin-top:14px">Text size</div>
    ${chips('text', sizes, p.text, { cls: 'wrap' })}
    <div class="ts-sample" aria-hidden="true"><b>2,928 kcal · 199 g protein</b><span>This is how report text will read.</span></div>
    ${toggle('contrast', 'Increase contrast', p.contrast || moreContrast.matches)}
    ${toggle('solid', 'Reduce transparency', p.solid || lessTransparency.matches)}
    <p class="note" style="margin:10px 0 0">${icon('info')} Contrast and transparency also switch on by themselves when they are on in iPhone Settings → Accessibility.</p>
  </form>`;
}

// Changes apply as you tap; there is nothing to save.
let saveTimer = null;
previews.display = form => {
  const f = new FormData(form);
  const theme = String(f.get('theme') ?? 'auto');
  const p = {
    text: String(f.get('text') ?? 'auto'),
    theme: THEMES.some(([v]) => v === theme) ? theme : 'auto',
    contrast: f.get('contrast') === 'on',
    solid: f.get('solid') === 'on',
  };
  applyDisplay(p);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const was = displayPrefs();
    await setKV('display', p);
    if (was.text !== p.text) toast('Text size updated', { icon: 'check' });
    else if (was.theme !== p.theme) toast(`Appearance: ${THEMES.find(([v]) => v === p.theme)[1]}`, { icon: 'check' });
  }, 250);
};
