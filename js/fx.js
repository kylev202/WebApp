// Bubbles, springs and squash: the playful layer on top of every screen.
// Everything here is decoration. It never blocks an action, it lives in its own
// fixed layer so a re-render can't cut an effect short, and with Reduce Motion on
// it does nothing at all. It imports nothing, so core.js can use it too.

export const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canAnimate = !still && typeof Element.prototype.animate === 'function';

export const PASTELS = ['var(--sleep)', 'var(--move)', 'var(--diet)', 'var(--work)', 'var(--school)', 'var(--money)'];

// The spring curves live in app.css (--spring, --spring-soft, --jelly) so CSS and
// JS move alike; older iPhones get the cubic-bezier fallback defined there too.
const curves = {};
const ease = name => (curves[name] ??= getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim() || 'ease-out');

let layer;
function fxLayer() {
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'fx-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.append(layer);
  }
  return layer;
}

// A burst of bubbles can't pile up into thousands if something calls it in a loop.
const MAX_PARTS = 160;

function spawn(cls, css) {
  const box = fxLayer();
  if (box.childElementCount > MAX_PARTS) return null;
  const el = document.createElement('i');
  el.className = cls;
  el.style.cssText = css;
  box.append(el);
  return el;
}

function play(el, frames, opts) {
  const anim = animate(el, frames, { fill: 'both', ...opts });
  if (anim) anim.onfinish = anim.oncancel = () => el.remove();
  else el.remove();
}

// An effect that can't run (an easing this browser rejects, say) is skipped,
// never thrown: these run inside render(), which must always finish.
function animate(el, frames, opts) {
  try { return el.animate(frames, opts); } catch { return null; }
}

function centre(target) {
  if (!target) return null;
  if ('x' in target && 'y' in target && !(target instanceof Element)) return target;
  const r = target.getBoundingClientRect();
  if (!r.width && !r.height) return null;
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

const rand = (a, b) => a + Math.random() * (b - a);
const pick = c => (Array.isArray(c) ? c[Math.floor(Math.random() * c.length)] : c);

// Soap bubbles that fan out of something you just ticked, drift up and pop.
// target: an element or {x, y} in viewport pixels. color: one colour or a list.
export function burst(target, { color = 'var(--sleep)', count = 10, spread = 1 } = {}) {
  if (!canAnimate) return;
  const at = centre(target);
  if (!at) return;
  ring(at, pick(color));
  for (let i = 0; i < count; i++) {
    const size = rand(7, 19);
    const b = spawn('fx-bubble', `left:${at.x - size / 2}px;top:${at.y - size / 2}px;width:${size}px;height:${size}px;--c:${pick(color)}`);
    if (!b) return;
    const angle = -Math.PI / 2 + rand(-0.68, 0.68) * Math.PI; // mostly upwards, in a fan
    const dist = rand(26, 70) * spread;
    const dx = Math.cos(angle) * dist, dy = Math.sin(angle) * dist;
    const rise = rand(24, 60) * spread, sway = rand(-16, 16);
    play(b, [
      { transform: 'translate(0, 0) scale(.2)', opacity: 0 },
      { transform: `translate(${dx}px, ${dy}px) scale(1)`, opacity: 1, offset: 0.32 },
      { transform: `translate(${dx + sway}px, ${dy - rise}px) scale(1.05)`, opacity: 0.85, offset: 0.86 },
      { transform: `translate(${dx + sway}px, ${dy - rise - 4}px) scale(1.7)`, opacity: 0 },
    ], { duration: rand(760, 1250), delay: rand(0, 90), easing: 'cubic-bezier(.2,.7,.3,1)' });
  }
}

// A ring that swells and fades, like a bubble popping.
function ring(at, color, size = 46) {
  const r = spawn('fx-ring', `left:${at.x - size / 2}px;top:${at.y - size / 2}px;width:${size}px;height:${size}px;--c:${color}`);
  if (!r) return;
  play(r, [
    { transform: 'scale(.3)', opacity: 0.8 },
    { transform: 'scale(1.35)', opacity: 0 },
  ], { duration: 560, easing: 'cubic-bezier(.2,.8,.3,1)' });
}

// Celebration: a column of bubbles rising from the bottom of the screen, like fizz.
export function fizz({ color = PASTELS, count = 24 } = {}) {
  if (!canAnimate) return;
  const w = window.innerWidth, h = window.innerHeight;
  for (let i = 0; i < count; i++) {
    const size = rand(10, 30);
    const b = spawn('fx-bubble', `left:${rand(0.04, 0.96) * w - size / 2}px;top:${h + 10}px;width:${size}px;height:${size}px;--c:${pick(color)}`);
    if (!b) return;
    const top = rand(0.25, 0.85) * h, s1 = rand(-26, 26), s2 = rand(-26, 26);
    play(b, [
      { transform: 'translate(0, 0) scale(.6)', opacity: 0 },
      { transform: `translate(${s1}px, ${-top * 0.35}px) scale(1)`, opacity: 0.95, offset: 0.3 },
      { transform: `translate(${s2}px, ${-top * 0.75}px) scale(1)`, opacity: 0.9, offset: 0.7 },
      { transform: `translate(${s1 * 0.5}px, ${-top}px) scale(1.05)`, opacity: 0.8, offset: 0.94 },
      { transform: `translate(${s1 * 0.5}px, ${-top - 4}px) scale(1.7)`, opacity: 0 },
    ], { duration: rand(1500, 2600), delay: rand(0, 450), easing: 'cubic-bezier(.3,.5,.4,1)' });
  }
}

// The tab pill travels like a drop of liquid: its leading edge stretches ahead to
// the new tab, the rest catches up and it wobbles as it settles.
let pillAnim = null;
export function slidePill(el, from, to) {
  if (!canAnimate || from.x === to.x) return;
  // Tapped again mid-slide: carry on from where the pill is now, not where it was headed.
  if (pillAnim?.playState === 'running') {
    const cs = getComputedStyle(el);
    from = { x: new DOMMatrix(cs.transform).e, w: parseFloat(cs.width) };
    pillAnim.cancel();
  }
  const fromR = from.x + from.w, toR = to.x + to.w;
  const [l, r] = to.x > from.x
    ? [from.x + (to.x - from.x) * 0.3, toR]
    : [to.x, fromR + (toR - fromR) * 0.3];
  const frame = (x, w, sy = 1) => ({ transform: `translateX(${x}px) scaleY(${sy})`, width: `${w}px` });
  pillAnim = animate(el, [
    { ...frame(from.x, from.w), easing: 'cubic-bezier(.45,0,.55,1)' },
    { ...frame(l, r - l, 0.8), offset: 0.36, easing: ease('spring-soft') },
    frame(to.x, to.w),
  ], { duration: 640 });
}

// Slide new content in from the side with a springy settle (calendar weeks).
export function slideIn(el, dir) {
  if (!canAnimate || !el) return;
  animate(el, [
    { transform: `translateX(${dir * 46}px)`, opacity: 0 },
    { transform: 'none', opacity: 1 },
  ], { duration: 620, easing: ease('spring-soft') });
}

// Every real tap leaves a small bubble at the fingertip that swells and pops.
document.addEventListener('click', e => {
  if (!canAnimate || !e.detail || (!e.clientX && !e.clientY)) return; // keyboard "clicks" have no point
  if (e.target.matches?.('label input')) return; // the label's own click already made one
  const el = e.target.closest?.('[data-act], button, .pk, .toggle, a');
  if (!el || el.disabled) return;
  const at = { x: e.clientX, y: e.clientY };
  const size = 40;
  const b = spawn('fx-tap', `left:${at.x - size / 2}px;top:${at.y - size / 2}px;width:${size}px;height:${size}px`);
  if (b) {
    play(b, [
      { transform: 'scale(.25)', opacity: 0.7 },
      { transform: 'scale(1)', opacity: 0.45, offset: 0.6 },
      { transform: 'scale(1.3)', opacity: 0 },
    ], { duration: 520, easing: 'cubic-bezier(.2,.8,.3,1)' });
  }
  // The Ask orb fizzes in every colour.
  if (el.matches('.tab.ask')) burst(el.querySelector('.orb') ?? el, { color: PASTELS, count: 12, spread: 0.9 });
}, { passive: true });
