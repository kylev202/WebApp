// Springs and squash that CSS alone can't do: the liquid tab pill and sliding
// calendar weeks. Everything here is decoration. It never blocks an action, and
// with Reduce Motion on it does nothing at all. It imports nothing, so core.js
// can use it too.

const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canAnimate = !still && typeof Element.prototype.animate === 'function';

// The spring curves live in app.css (--spring, --spring-soft, --jelly) so CSS and
// JS move alike; older iPhones get the cubic-bezier fallback defined there too.
const curves = {};
const ease = name => (curves[name] ??= getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim() || 'ease-out');

// An effect that can't run (an easing this browser rejects, say) is skipped,
// never thrown: these run inside render(), which must always finish.
function animate(el, frames, opts) {
  try { return el.animate(frames, opts); } catch { return null; }
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
