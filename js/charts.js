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

/**
 * series: [{ values: (number|null)[], color, dash?, straight? }]
 * labels: string[] (same length as values; '' to hide)
 * goal: optional value drawn as a dashed line
 */
export function lineChart({ series, labels, min = 0, max, goal, empty = 'No data yet', live = false }) {
  const n = labels.length;
  const all = series.flatMap(s => s.values).filter(v => v != null);
  if (!all.length) return `<div class="empty">${empty}</div>`;
  const hi = max ?? Math.max(...all, goal ?? 0) * 1.1;
  const x = i => (n === 1 ? W / 2 : PAD + (i * (W - PAD * 2)) / (n - 1));
  const y = v => PAD + (1 - (Math.min(Math.max(v, min), hi) - min) / (hi - min || 1)) * (H - PAD * 2);

  let svg = [PAD, H / 2, H - PAD].map(gy => `<line class="grid-line" x1="0" x2="${W}" y1="${gy}" y2="${gy}"/>`).join('');
  if (goal != null) svg += `<line class="goal-line" x1="0" x2="${W}" y1="${y(goal)}" y2="${y(goal)}"/>`;
  let dots = '';
  series.forEach(s => {
    const pts = s.values.map((v, i) => (v == null ? null : [x(i), y(v)]));
    segments(pts).forEach(seg => {
      if (seg.length > 1) svg += `<path class="ln${s.dash ? ' dash' : ''}" stroke="${s.color}" d="${s.straight ? `M${seg.join('L')}` : smoothPath(seg)}"/>`;
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

  return `<div class="chart-wrap"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${svg}</svg>${dots}</div>
    <div class="chart-days">${labels.map(l => `<span>${l}</span>`).join('')}</div>`;
}

export function sparkline(values, color) {
  const vals = values.filter(v => v != null);
  if (vals.length < 2) return '<div class="spark-empty"></div>';
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const span = hi - lo || 1;
  const pts = vals.map((v, i) => [4 + (i * 112) / (vals.length - 1), 26 - ((v - lo) / span) * 22]);
  return `<svg class="spark" viewBox="0 0 120 30" preserveAspectRatio="none"><path fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" d="${smoothPath(pts)}"/></svg>`;
}
