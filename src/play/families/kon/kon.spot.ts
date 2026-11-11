// Kon views: where a chip or a mark may sit (r8 judge packets: a chip over an arm, a tick over a letter). Pure geometry in
// screen px: a box is clear when it stays inside the bounds and touches no listed line, box or dot.
export type Pt = [number, number];
export interface Box { x: number; y: number; w: number; h: number }

/** does segment a–b pass through box r grown by pad (Liang–Barsky clip)? */
export function segHitsBox(a: Pt, b: Pt, r: Box, pad = 0): boolean {
  const x0 = r.x - pad, y0 = r.y - pad, x1 = r.x + r.w + pad, y1 = r.y + r.h + pad;
  const dx = b[0] - a[0], dy = b[1] - a[1];
  let t0 = 0, t1 = 1;
  for (const [p, q] of [[-dx, a[0] - x0], [dx, x1 - a[0]], [-dy, a[1] - y0], [dy, y1 - a[1]]] as const) {
    if (p === 0) { if (q < 0) return false; continue; }
    const t = q / p;
    if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return t0 <= t1;
}
export const boxesMeet = (a: Box, b: Box, pad = 0) => a.x - pad < b.x + b.w && b.x - pad < a.x + a.w && a.y - pad < b.y + b.h && b.y - pad < a.y + a.h;
export const boxAt = (c: Pt, w: number, h: number): Box => ({ x: c[0] - w / 2, y: c[1] - h / 2, w, h });

export interface Avoid { segs?: [Pt, Pt][]; boxes?: Box[]; dots?: { c: Pt; r: number }[] }
/** is a w × h box centred at c clear of everything in `avoid`, and inside `bounds`? */
export function clearAt(c: Pt, w: number, h: number, avoid: Avoid, bounds: Box, pad = 3): boolean {
  const b = boxAt(c, w, h);
  if (b.x < bounds.x || b.y < bounds.y || b.x + b.w > bounds.x + bounds.w || b.y + b.h > bounds.y + bounds.h) return false;
  if ((avoid.segs ?? []).some(([p, q]) => segHitsBox(p, q, b, pad))) return false;
  if ((avoid.boxes ?? []).some((o) => boxesMeet(b, o, pad))) return false;
  return !(avoid.dots ?? []).some(({ c: d, r }) => boxesMeet(b, boxAt(d, 2 * r, 2 * r), pad));
}
/** the first candidate centre whose box is clear (null: none is) */
export function freeSpot(cands: Pt[], w: number, h: number, avoid: Avoid, bounds: Box, pad = 3): Pt | null {
  return cands.find((c) => clearAt(c, w, h, avoid, bounds, pad)) ?? null;
}
/** candidate centres on rings around a point, nearest ring first, starting from heading `from` (screen radians, y down) */
export function around(o: Pt, radii: number[], from = 0, n = 16): Pt[] {
  const out: Pt[] = [];
  for (const r of radii) for (let k = 0; k < n; k++) { const a = from + ((k % 2 ? 1 : -1) * Math.ceil(k / 2) * 2 * Math.PI) / n; out.push([o[0] + r * Math.cos(a), o[1] + r * Math.sin(a)]); }
  return out;
}
