// Line charts as inline SVG. Lines stretch to the card width; dots are HTML so they stay round.

const W = 300;
const H = 90;
const PAD = 6;

// Catmull-Rom spline through the points, for soft Apple-style curves.
function smoothPath(pts) {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1} ${c2} ${p2}`;
  }
  return d;
}

// Split a series on nulls so missing days show as gaps, not as zero.
function segments(points) {
  const out = [];
  let cur = [];
  points.forEach(p => {
    if (p) cur.push(p);
    else if (cur.length) { out.push(cur); cur = []; }
  });
  if (cur.length) out.push(cur);
  return out;
}

// Round a maximum up to a readable number, so the top gridline is worth printing
// (A$600, not A$551.20). The steps are close together on purpose: jumping 550 up to
// 1000 would leave the line crawling along the bottom of its own chart.
const STEPS = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
export function niceMax(v) {
  if (!(v > 0)) return 0;
  const mag = 10 ** Math.floor(Math.log10(v));
  return STEPS.find(r => v / mag <= r + 1e-9) * mag;
}

/**
 * series: [{ values: (number|null)[], color, dash?, straight?, fill? }]
 * labels: string[] (same length as values; '' to hide)
 * goal: optional value drawn as a dashed line
 * yAxis: optional v => string, printed against the top and middle gridlines
 */
export function lineChart({ series, labels, min = 0, max, goal, empty = 'No data yet', live = false, yAxis }) {
  const n = labels.length;
  const all = series.flatMap(s => s.values).filter(v => v != null);
  if (!all.length) return `<div class="empty">${empty}</div>`;
  const hi = max ?? Math.max(...all, goal ?? 0) * 1.1;
  const x = i => (n === 1 ? W / 2 : PAD + (i * (W - PAD * 2)) / (n - 1));
  const y = v => PAD + (1 - (Math.min(Math.max(v, min), hi) - min) / (hi - min || 1)) * (H - PAD * 2);

  const grid = [PAD, H / 2, H - PAD].map(gy => `<line class="grid-line" x1="0" x2="${W}" y1="${gy}" y2="${gy}"/>`).join('')
    + (goal != null ? `<line class="goal-line" x1="0" x2="${W}" y1="${y(goal)}" y2="${y(goal)}"/>` : '');
  let areas = '', lines = '', dots = '';
  series.forEach(s => {
    const pts = s.values.map((v, i) => (v == null ? null : [x(i), y(v)]));
    segments(pts).forEach(seg => {
      if (seg.length < 2) return;
      const d = s.straight ? `M${seg.join('L')}` : smoothPath(seg);
      if (s.fill) areas += `<path class="ln-fill" fill="${s.color}" d="${d}L${seg.at(-1)[0]},${H - PAD}L${seg[0][0]},${H - PAD}Z"/>`;
      lines += `<path class="ln${s.dash ? ' dash' : ''}" stroke="${s.color}" d="${d}"/>`;
    });
    // Dot on the latest value (and on any lone point so it's still visible).
    // With `live`, today's point is hollow: the day isn't finished yet.
    pts.forEach((p, i) => {
      const lone = p && !pts[i - 1] && !pts[i + 1];
      const last = p && pts.slice(i + 1).every(q => !q);
      const open = live && i === n - 1;
      if ((lone || last) && !s.dash) dots += `<i class="pt${open ? ' live' : ''}" style="left:${(p[0] / W) * 100}%;top:${(p[1] / H) * 100}%;--c:${s.color}"></i>`;
    });
  });

  const axis = yAxis ? `<span class="chart-y top">${yAxis(hi)}</span><span class="chart-y mid">${yAxis(min + (hi - min) / 2)}</span>` : '';
  return `<div class="chart-wrap"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${grid}${areas}${lines}</svg>${dots}${axis}</div>
    <div class="chart-days">${labels.map(l => `<span>${l}</span>`).join('')}</div>`;
}

/**
 * A strip of one bar per day, on its own scale: the line above says how the month
 * adds up, these say what each single day actually cost.
 * values: (number|null)[] — null for days that haven't happened yet.
 */
export function barRow({ values, color, max, now = -1, titles = [] }) {
  const hi = max ?? Math.max(0, ...values.filter(v => v != null));
  if (!hi) return '';
  return `<div class="bars">${values.map((v, i) => {
    const h = v ? Math.max(9, (v / hi) * 100) : 0;
    return `<i class="bar${i === now ? ' on' : ''}" style="--h:${h.toFixed(1)}%;--c:${color}"${titles[i] ? ` title="${titles[i]}"` : ''}></i>`;
  }).join('')}</div>`;
}

export function sparkline(values, color) {
  const vals = values.filter(v => v != null);
  if (vals.length < 2) return '<div class="spark-empty"></div>';
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const span = hi - lo || 1;
  const pts = vals.map((v, i) => [4 + (i * 112) / (vals.length - 1), 26 - ((v - lo) / span) * 22]);
  return `<svg class="spark" viewBox="0 0 120 30" preserveAspectRatio="none"><path fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" d="${smoothPath(pts)}"/></svg>`;
}
