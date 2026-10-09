// Kyun-Lab apparatus scenes (DESIGN.md §3.4, "the law runs"). Each lab draws its REAL set-up from the conditions the child
// set (a sealed jar is a jar with a lid, the cupboard is dark, the long thread is long) and, on a run, animates the outcome
// the lab's causal model computed (labs.ts outcomeOf): sprouts grow to the computed count, the shirt dries at the computed
// time, the pendulum swings at T = 2π√(L/g), rust spots spread, the shadow grows by similar triangles. Nothing here
// decides an outcome; it only draws `v`. All colour comes from the painter (roles and materials): no literals.
//
// Timeline: `p` is this set-up's own progress (0 = before the run, 1 = its outcome reached). For time outcomes the view
// runs one shared clock to the slower set-up, so the faster one finishes first, visibly.
import type { Painter, Material, Role } from "../../core/styles.ts";
import type { LabDef } from "./labs.ts";

export interface SceneArgs {
  P: Painter; c: CanvasRenderingContext2D;
  x: number; y: number; w: number; h: number;
  setup: Record<string, string>;
  /** this set-up's progress 0..1 (0 before the run) */
  p: number;
  /** the run has happened (results exist) */
  ran: boolean;
  /** the computed outcome (null before the run) */
  v: number | null;
  lab: LabDef;
  /** seconds, for motion that runs only while the run animates */
  t: number;
  reduced: boolean;
  /** stable per set-up (A = 0, B = 1) so A and B never look cloned */
  seed: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const ease = (k: number) => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
function h01(n: number): number { let x = (n | 0) * 374761393; x = (x ^ (x >>> 13)) * 1274126177; return ((x ^ (x >>> 16)) >>> 0) / 4294967296; }
const rrect = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  const q = Math.max(0, Math.min(r, w / 2, h / 2));
  c.moveTo(x + q, y); c.arcTo(x + w, y, x + w, y + h, q); c.arcTo(x + w, y + h, x, y + h, q); c.arcTo(x, y + h, x, y, q); c.arcTo(x, y, x + w, y, q); c.closePath();
};
const ell = (c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rot = 0) => { c.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), rot, 0, Math.PI * 2); };

/** a sun disc with rays, top-right of the scene */
function sun(a: SceneArgs, cx: number, cy: number, r: number): void {
  const { P, c } = a;
  P.fillPath(c, (g) => g.arc(cx, cy, r, 0, Math.PI * 2), "sun", { outline: null });
  for (let k = 0; k < 8; k++) { const t = (k * Math.PI) / 4; P.stroke(c, [[cx + Math.cos(t) * r * 1.35, cy + Math.sin(t) * r * 1.35], [cx + Math.cos(t) * r * 1.85, cy + Math.sin(t) * r * 1.85]], { role: "q1", width: 2 }); }
}
function snowflake(a: SceneArgs, cx: number, cy: number, r: number): void {
  for (let k = 0; k < 3; k++) { const t = (k * Math.PI) / 3; a.P.stroke(a.c, [[cx - Math.cos(t) * r, cy - Math.sin(t) * r], [cx + Math.cos(t) * r, cy + Math.sin(t) * r]], { role: "q2", width: 2 }); }
}
function droplets(a: SceneArgs, x: number, y: number, w: number, h: number, n: number, seed: number, m: Material = "water", alpha = 0.8): void {
  for (let i = 0; i < n; i++) {
    const dx = x + h01(seed * 31 + i * 7) * w, dy = y + h01(seed * 17 + i * 13) * h, r = 2 + h01(i * 5 + seed) * 2;
    a.P.fillPath(a.c, (g) => { g.moveTo(dx, dy - r * 1.6); g.quadraticCurveTo(dx + r, dy, dx, dy + r); g.quadraticCurveTo(dx - r, dy, dx, dy - r * 1.6); }, m, { alpha, outline: null });
  }
}
/** a glass jar outline with a lid (sealed set-ups) */
function jar(a: SceneArgs, x: number, y: number, w: number, h: number, lid: boolean): void {
  const { P, c } = a;
  P.stroke(c, [[x, y + 10], [x, y + h], [x + w, y + h], [x + w, y + 10]], { role: "ink3", width: 2 });
  c.save(); c.globalAlpha = 0.12; c.fillStyle = P.color("ink3"); c.fillRect(x + 2, y + 10, 5, h - 12); c.restore();
  if (lid) P.body(c, x - 4, y, w + 8, 10, { role: "q3", r: 3 });
}

// ───────────────────────────── the scenes ─────────────────────────────

function ankur(a: SceneArgs): void {
  const { P, c, x, y, w, h, setup, p, v } = a;
  const tx = x + 6, tw = w - 12, ty = y + h - 30, th = 22;
  // the bed: cotton puffs or a soil band, in a tray
  P.body(c, tx, ty, tw, th, { role: "panel", r: 6 });
  if (setup.base === "soil") P.fillPath(c, (g) => rrect(g, tx + 3, ty + 4, tw - 6, th - 7, 4), "soil", { outline: null });
  else for (let i = 0; i < 9; i++) P.fillPath(c, (g) => ell(g, tx + 8 + (i * (tw - 16)) / 8, ty + th / 2, (tw / 18) + 2, th / 3), "cotton", { outline: "ink3", width: 1 });
  // water: damp = a darker wet sheen with drops; under = a water layer over the seeds
  if (setup.water === "damp") droplets(a, tx + 4, ty - 2, tw - 8, 8, 6, a.seed + 3, "water", 0.7);
  const n = 10, seeds: [number, number][] = [];
  for (let i = 0; i < n; i++) seeds.push([tx + 10 + (i * (tw - 20)) / (n - 1), ty + 4]);
  // which seeds sprout: v of them, spread evenly (deterministic), growing with p
  const grown = v === null ? 0 : v;
  const pick = new Set<number>(); for (let i = 0; i < grown; i++) pick.add(Math.round((i + 0.5) * n / Math.max(1, grown) - 0.5));
  const sh = Math.min(h - 54, 46) * ease(p);
  seeds.forEach(([sx, sy], i) => {
    P.fillPath(c, (g) => ell(g, sx, sy, 4.5, 3.2, 0.3), "seed", { outline: "ink3", width: 1 });
    if (pick.has(i) && sh > 1) {
      const top = sy - sh, sway = Math.sin(i * 1.7) * 3;
      P.stroke(c, [[sx, sy - 2], [sx + sway * 0.5, sy - sh * 0.5], [sx + sway, top]], { role: "q4", width: 2.5 });
      if (sh > 10) { P.fillPath(c, (g) => ell(g, sx + sway - 5, top, 5, 2.6, -0.5), "sprout", { outline: null }); P.fillPath(c, (g) => ell(g, sx + sway + 5, top, 5, 2.6, 0.5), "sprout", { outline: null }); }
    }
  });
  if (setup.water === "under") { c.save(); c.globalAlpha = 0.38; c.fillStyle = P.material("water"); c.fillRect(tx + 2, ty - 16, tw - 4, th + 12); c.restore(); P.stroke(c, [[tx + 2, ty - 16], [tx + tw - 2, ty - 16]], { role: "q2", width: 2 }); }
  if (setup.air === "sealed") jar(a, tx - 2, y + 4, tw + 4, h - 10, true);
  if (setup.warm === "fridge") { snowflake(a, x + w - 16, y + 14, 8); P.stroke(c, [[x + 4, y + 6], [x + 4, y + h - 4]], { role: "q2", width: 2, dash: [3, 4] }); }
  if (setup.light === "dark") P.veil(c, x, y, w, h, 0.42, { r: 8, dark: true });
  else sun(a, x + 18, y + (setup.air === "sealed" ? 28 : 14), 6);
}

function sukhao(a: SceneArgs): void {
  const { P, c, x, y, w, h, setup, p } = a;
  const ly = y + 14;
  P.stroke(c, [[x + 4, ly], [x + w - 4, ly]], { role: "ink3", width: 2 });
  if (setup.sun === "sun") sun(a, x + w - 16, y + 12, 6);
  else { P.fillPath(c, (g) => { g.moveTo(x, y); g.lineTo(x + w, y); g.lineTo(x + w, y + 6); g.lineTo(x, y + 6); }, "shadow", { alpha: 0.35, outline: null }); }
  // the shirt: spread out (full) or folded (a small thick block)
  const cx = x + w / 2, top = ly + 2;
  const wet = 1 - clamp(p, 0, 1);
  const shirt = (g: CanvasRenderingContext2D) => {
    if (setup.spread === "folded") { rrect(g, cx - w * 0.14, top, w * 0.28, Math.min(h - 32, 34), 4); return; }
    const sw = Math.min(w * 0.62, 120), sh = Math.min(h - 30, 74);
    g.moveTo(cx - sw * 0.22, top); g.lineTo(cx - sw * 0.5, top + sh * 0.12); g.lineTo(cx - sw * 0.42, top + sh * 0.34); g.lineTo(cx - sw * 0.3, top + sh * 0.28);
    g.lineTo(cx - sw * 0.3, top + sh); g.lineTo(cx + sw * 0.3, top + sh); g.lineTo(cx + sw * 0.3, top + sh * 0.28); g.lineTo(cx + sw * 0.42, top + sh * 0.34);
    g.lineTo(cx + sw * 0.5, top + sh * 0.12); g.lineTo(cx + sw * 0.22, top); g.quadraticCurveTo(cx, top + sh * 0.14, cx - sw * 0.22, top); g.closePath();
  };
  P.fillPath(c, shirt, "paper", { outline: "ink2", width: 1.5 });
  if (wet > 0.02) { P.fillPath(c, shirt, "water", { alpha: 0.55 * wet, outline: null }); droplets(a, cx - w * 0.2, top + Math.min(h - 30, 74) + 2, w * 0.4, 10, 4, a.seed + 9, "water", 0.8 * wet); }
  // pegs
  P.body(c, cx - (setup.spread === "folded" ? w * 0.1 : Math.min(w * 0.62, 120) * 0.2) - 3, ly - 5, 6, 12, { role: "q3", r: 2 });
  if (setup.wind === "fan") { const ph = a.ran && p < 1 && !a.reduced ? a.t * 8 : 0; for (let k = 0; k < 3; k++) { const yy = top + 14 + k * 14, off = (ph + k * 9) % 18; P.stroke(c, [[x + 6 + off * 0.3, yy], [x + 20 + off * 0.3, yy - 2]], { role: "ink3", width: 2 }); } }
  if (setup.air === "humid") droplets(a, x + 6, y + 18, w - 12, h - 30, 7, a.seed + 21, "water", 0.35);
}

function jhoola(a: SceneArgs): void {
  const { P, c, x, y, w, h, setup, p, ran, t, reduced } = a;
  const px = x + w / 2, py = y + 8;
  P.stroke(c, [[x + w * 0.2, py], [x + w * 0.8, py]], { role: "ink2", width: 4 });
  const L = (setup.len === "long" ? 0.86 : 0.43) * (h - 26);
  const R = setup.bob === "heavy" ? 10 : 6;
  const amp = (setup.pull === "big" ? 30 : 12) * Math.PI / 180;
  // the period ratio is the real one (√ of the length ratio); the time-lapse plays 10 swings over the run
  const swings = 10, T = setup.len === "long" ? 2 : 1;
  let th = amp;
  if (ran && p > 0 && p < 1 && !reduced) th = amp * Math.cos((2 * Math.PI * (t % (T * 1.2))) / (T * 1.2));
  if (!ran) P.stroke(c, [[px, py], [px + Math.sin(amp) * L, py + Math.cos(amp) * L]], { role: "ink3", width: 1, dash: [3, 4] });
  if (!ran) { c.save(); c.globalAlpha = 0.5; c.strokeStyle = P.color("ink3"); c.setLineDash([2, 4]); c.beginPath(); c.arc(px, py, L, Math.PI / 2 - amp, Math.PI / 2 + amp); c.stroke(); c.restore(); }
  const bx = px + Math.sin(th) * L, by = py + Math.cos(th) * L;
  P.stroke(c, [[px, py], [bx, by]], { role: "ink", width: 1.6 });
  P.fillPath(c, (g) => g.arc(bx, by, R, 0, Math.PI * 2), setup.bob === "heavy" ? "iron" : "wood", { outline: "ink2", width: 1.5 });
  if (ran) P.text(c, `${Math.min(swings, Math.floor(swings * p))}/${swings}`, x + 10, y + h - 12, { size: 14, role: "ink3", align: "left", font: "mono" });
}

function jang(a: SceneArgs): void {
  const { P, c, x, y, w, h, setup, p, v } = a;
  const tw = Math.min(46, w * 0.34), tx = x + w / 2 - tw / 2, ty = y + 6, th = h - 16;
  // contents: wet = water half way; dry = drying-salt granules at the bottom and a cotton plug; no air = water to the top under an oil layer
  if (setup.air === "none") { c.save(); c.globalAlpha = 0.4; c.fillStyle = P.material("water"); c.fillRect(tx + 2, ty + 18, tw - 4, th - 22); c.restore(); P.fillPath(c, (g) => g.rect(tx + 2, ty + 12, tw - 4, 7), "oil", { alpha: 0.9, outline: null }); }
  else if (setup.water === "wet") { c.save(); c.globalAlpha = 0.4; c.fillStyle = P.material("water"); c.fillRect(tx + 2, ty + th * 0.5, tw - 4, th * 0.5 - 4); c.restore(); }
  if (setup.water === "dry") { for (let i = 0; i < 14; i++) P.fillPath(c, (g) => g.rect(tx + 4 + h01(i * 3 + a.seed) * (tw - 10), ty + th - 10 - h01(i * 7) * 8, 3, 3), "salt", { outline: "ink3", width: 0.8 }); P.fillPath(c, (g) => ell(g, tx + tw / 2, ty + 6, tw / 2 - 1, 6), "cotton", { outline: "ink3", width: 1 }); }
  // the nail
  const nx = tx + tw / 2, n0 = ty + 10, n1 = ty + th - 14;
  P.stroke(c, [[nx, n0], [nx, n1]], { role: "ink2", width: 5 });
  P.stroke(c, [[nx - 6, n0], [nx + 6, n0]], { role: "ink2", width: 4 });
  if (setup.coat === "paint") P.stroke(c, [[nx, n0 + 2], [nx, n1 - 1]], { role: "q2", width: 4 });
  // rust: spots along the nail in proportion to the computed amount (of 10)
  const spots = v === null ? 0 : Math.round(v * 2 * ease(p));
  for (let i = 0; i < spots; i++) { const sy = n0 + 6 + h01(i * 11 + 3) * (n1 - n0 - 8), sx = nx + (h01(i * 5) - 0.5) * 5; P.fillPath(c, (g) => ell(g, sx, sy, 3 + h01(i) * 2.5, 2.4, 0.4), "rust", { outline: null }); }
  // the test tube
  P.stroke(c, [[tx, ty], [tx, ty + th - tw / 2], [tx + tw / 2, ty + th], [tx + tw, ty + th - tw / 2], [tx + tw, ty]], { role: "ink3", width: 2 });
}

function parchhai(a: SceneArgs): void {
  const { P, c, x, y, w, h, setup, p, v, ran } = a;
  const cy = y + h / 2 + 4, torchX = x + 14, wallX = x + w - 12;
  // the torch, the ball at its distance (20 or 50 cm of a 100 cm bench), the wall
  P.body(c, torchX - 10, cy - 7, 18, 14, { role: "ink3", r: 3 });
  P.stroke(c, [[wallX, y + 6], [wallX, y + h - 4]], { role: "ink2", width: 3 });
  const bench = wallX - torchX, d = setup.dist === "far" ? 0.5 : 0.2;
  const bx = torchX + bench * d, br = Math.max(5, bench * 0.05);
  if (ran && p > 0) {
    const half = ((v ?? 0) / 2) * (bench / 100) * ease(p);       // the shadow's half-height on the wall, in the bench's cm
    c.save(); c.globalAlpha = 0.22 * ease(p); c.fillStyle = P.material("sun");
    c.beginPath(); c.moveTo(torchX + 8, cy - 3); c.lineTo(wallX, cy - Math.min(h / 2, half * 1.6 + 14)); c.lineTo(wallX, cy + Math.min(h / 2, half * 1.6 + 14)); c.lineTo(torchX + 8, cy + 3); c.closePath(); c.fill(); c.restore();
    P.stroke(c, [[torchX + 8, cy], [wallX, cy - half]], { role: "q1", width: 1, alpha: 0.8 }); P.stroke(c, [[torchX + 8, cy], [wallX, cy + half]], { role: "q1", width: 1, alpha: 0.8 });
    P.fillPath(c, (g) => ell(g, wallX - 2, cy, 3, Math.max(1, half)), "shadow", { alpha: 0.85, outline: null });
  }
  P.fillPath(c, (g) => g.arc(bx, cy, br, 0, Math.PI * 2), setup.ball === "blue" ? "blue" : "red", { outline: "ink2", width: 1.2 });
}

function rang(a: SceneArgs): void {
  const { P, c, x, y, w, h, setup, p, v } = a;
  const cw = Math.min(40, w * 0.28), ch = Math.min(52, h - 34), cx = x + w * 0.38 - cw / 2, cyy = y + h - ch - 8;
  if (setup.place === "sun") { sun(a, x + 16, y + 14, 7); for (let k = 0; k < 3; k++) P.stroke(c, [[x + 26 + k * 6, y + 24 + k * 3], [cx + 4 + k * 10, cyy - 4]], { role: "q1", width: 1.5, dash: [4, 4] }); }
  else P.fillPath(c, (g) => { g.moveTo(x + 4, y + 18); g.lineTo(x + w * 0.7, y + 10); g.lineTo(x + w * 0.7, y + 16); g.lineTo(x + 4, y + 24); }, "wood", { outline: "ink3", width: 1 });
  P.fillPath(c, (g) => rrect(g, cx, cyy, cw, ch, 4), setup.colour === "white" ? "white" : "black", { outline: "ink2", width: 1.5 });
  // the thermometer: the column rises by the computed warming
  const tx = x + w * 0.74, t0 = y + 18, t1 = y + h - 14, rise = v === null ? 0 : (v / a.lab.outcome.max) * ease(p);
  P.stroke(c, [[tx, t0], [tx, t1]], { role: "ink3", width: 7 });
  P.stroke(c, [[tx, t1], [tx, t1 - 6 - (t1 - t0 - 6) * (0.15 + 0.85 * rise)]], { role: "q3", width: 3.5 });
  P.circle(c, tx, t1 + 2, 5, { role: "q3", fill: true });
}

function tairna(a: SceneArgs): void {
  const { P, c, x, y, w, h, setup, p, v, ran } = a;
  const tx = x + 8, tw = w - 16, ty = y + 22, th = h - 28, water = ty + 10;
  c.save(); c.globalAlpha = 0.32; c.fillStyle = P.material("water"); c.fillRect(tx + 1, water, tw - 2, th - 11); c.restore();
  P.stroke(c, [[tx, ty], [tx, ty + th], [tx + tw, ty + th], [tx + tw, ty]], { role: "ink3", width: 2 });
  const big = setup.size === "big", s = big ? 1.5 : 1, m: Material = setup.stuff === "iron" ? "iron" : setup.stuff === "clay" ? "clay" : "wood";
  const ox = x + w / 2;
  const start = y + 6, floatY = water - 2, sinkY = ty + th - 8 * s;
  const oy = !ran ? start : v === 1 ? start + (floatY - start) * ease(p) : start + (sinkY - start) * ease(p);
  if (setup.shape === "boat") P.fillPath(c, (g) => { g.moveTo(ox - 16 * s, oy - 6 * s); g.lineTo(ox + 16 * s, oy - 6 * s); g.lineTo(ox + 10 * s, oy + 4 * s); g.lineTo(ox - 10 * s, oy + 4 * s); g.closePath(); }, m, { outline: "ink2", width: 1.5 });
  else P.fillPath(c, (g) => g.arc(ox, oy, 7 * s, 0, Math.PI * 2), m, { outline: "ink2", width: 1.5 });
}

function barf(a: SceneArgs): void {
  const { P, c, x, y, w, h, setup, p } = a;
  const by = y + h - 14, bw = Math.min(w * 0.7, 120), bx = x + w / 2 - bw / 2;
  // the base: a wooden board or a steel plate
  if (setup.base === "steel") P.fillPath(c, (g) => ell(g, bx + bw / 2, by, bw / 2, 7), "steel", { outline: "ink2", width: 1.5 });
  else P.fillPath(c, (g) => rrect(g, bx, by - 5, bw, 10, 2), "wood", { outline: "ink2", width: 1.5 });
  if (setup.place === "sun") sun(a, x + w - 16, y + 14, 6);
  // the cube shrinks on the clock (linear: the clock is linear); a puddle grows
  const s = Math.max(0, 1 - p), side = Math.min(w * 0.34, h * 0.42) * Math.sqrt(Math.max(0.04, s)) * (p >= 1 ? 0 : 1);
  P.fillPath(c, (g) => ell(g, bx + bw / 2, by - 4, 10 + 26 * ease(p), 3 + 3 * ease(p)), "water", { alpha: 0.35 + 0.3 * ease(p), outline: null });
  if (side > 1) P.fillPath(c, (g) => rrect(g, bx + bw / 2 - side / 2, by - 5 - side, side, side, 4), "ice", { outline: "q2", width: 1.5 });
  if (setup.wrap === "wool") {
    const r = 30;
    P.fillPath(c, (g) => { g.moveTo(bx + bw / 2 - r, by - 5); g.quadraticCurveTo(bx + bw / 2 - r - 6, by - 5 - r * 1.3, bx + bw / 2, by - 5 - r * 1.5); g.quadraticCurveTo(bx + bw / 2 + r + 6, by - 5 - r * 1.3, bx + bw / 2 + r, by - 5); g.closePath(); }, "wool", { alpha: 0.88, outline: "ink2", width: 1.5 });
    for (let k = 0; k < 4; k++) P.stroke(c, [[bx + bw / 2 - r + 8, by - 14 - k * 9], [bx + bw / 2 + r - 8, by - 14 - k * 9]], { role: "ink3", width: 1, dash: [3, 3], alpha: 0.7 });
  }
}

function chumbak(a: SceneArgs): void {
  const { P, c, x, y, w, h, setup, p, v, ran } = a;
  const cx = x + w / 2, table = y + h - 10;
  P.stroke(c, [[x + 6, table], [x + w - 6, table]], { role: "ink3", width: 2 });
  // the magnet comes down during the run and stops a hand's width above the object (a U magnet: N red, S blue);
  // an object that is attracted JUMPS up to it, one that is not stays on the table
  const gapAbove = Math.min(56, (h - 60) * 0.45);
  const my = y + 8 + (table - 46 - gapAbove - (y + 8)) * (ran ? ease(Math.min(1, p * 1.6)) : 0);
  P.fillPath(c, (g) => { g.moveTo(cx - 18, my); g.lineTo(cx - 18, my + 22); g.arc(cx, my + 22, 18, Math.PI, 0, true); g.lineTo(cx + 18, my); g.lineTo(cx + 9, my); g.lineTo(cx + 9, my + 22); g.arc(cx, my + 22, 9, 0, Math.PI, false); g.lineTo(cx - 9, my); g.closePath(); }, "magnetN", { outline: "ink2", width: 1.2 });
  P.fillPath(c, (g) => { g.rect(cx + 9, my, 9, 8); }, "magnetS", { outline: null }); P.fillPath(c, (g) => { g.rect(cx - 18, my, 9, 8); }, "magnetS", { outline: null });
  // the object: lifts to the magnet only when the computed outcome says it sticks
  const stuck = ran && v === 1 && p > 0.62, oy = stuck ? my + 46 + 4 * (1 - ease((p - 0.62) / 0.38)) : table - 5;
  const m: Material = setup.thing === "iron" ? "iron" : setup.thing === "alu" ? "aluminium" : setup.thing === "copper" ? "copper" : setup.thing === "brass" ? "brass" : "plastic";
  if (setup.thing === "copper") P.stroke(c, [[cx - 16, oy], [cx - 6, oy - 4], [cx + 4, oy], [cx + 14, oy - 4]], { role: "q3", width: 3 });
  else if (setup.thing === "alu") P.fillPath(c, (g) => { g.moveTo(cx - 14, oy - 4); g.lineTo(cx + 12, oy - 6); g.lineTo(cx + 14, oy + 2); g.lineTo(cx - 12, oy + 3); g.closePath(); }, m, { outline: "ink3", width: 1 });
  else if (setup.thing === "brass") { P.fillPath(c, (g) => g.arc(cx - 8, oy - 1, 5, 0, Math.PI * 2), m, { outline: "ink3", width: 1 }); P.stroke(c, [[cx - 3, oy - 1], [cx + 14, oy - 1]], { role: "q1", width: 3 }); }
  else if (setup.thing === "plastic") P.fillPath(c, (g) => rrect(g, cx - 10, oy - 5, 20, 8, 3), m, { outline: "ink3", width: 1 });
  else { P.stroke(c, [[cx - 14, oy], [cx + 12, oy]], { role: "ink2", width: 3.5 }); P.stroke(c, [[cx - 14, oy - 4], [cx - 14, oy + 4]], { role: "ink2", width: 3 }); }
  // the paper sheet sits between the magnet and the object (held up on its two edges)
  if (setup.between === "paper") { const py2 = Math.min(oy - 10, my + 43); P.fillPath(c, (g) => g.rect(x + 10, py2, w - 20, 3), "paper", { alpha: 0.95, outline: "ink3", width: 1 }); }
}

function bijli(a: SceneArgs): void {
  const { P, c, x, y, w, h, setup, p, v, ran } = a;
  // a cell, an LED and two wires ending in a gap bridged by the material
  const l = x + 12, r = x + w - 12, top = y + 14, bot = y + h - 16, gapL = x + w / 2 - 18, gapR = x + w / 2 + 18;
  P.body(c, l - 6, top + (bot - top) / 2 - 16, 12, 32, { role: "ink3", r: 3 });
  P.stroke(c, [[l, top + (bot - top) / 2 - 16], [l, top], [r, top], [r, bot], [gapR, bot]], { role: "ink2", width: 2 });
  P.stroke(c, [[l, top + (bot - top) / 2 + 16], [l, bot], [gapL, bot]], { role: "ink2", width: 2 });
  // the LED on the top wire
  const ledX = x + w / 2, glow = ran ? (v ?? 0) / 2 * ease(p) : 0;
  if (glow > 0.02) { c.save(); c.globalAlpha = 0.45 * glow; c.fillStyle = P.material("glow"); c.beginPath(); c.arc(ledX, top, 10 + 12 * glow, 0, Math.PI * 2); c.fill(); c.restore(); }
  P.fillPath(c, (g) => { g.moveTo(ledX - 7, top + 6); g.lineTo(ledX - 7, top - 3); g.arc(ledX, top - 3, 7, Math.PI, 0); g.lineTo(ledX + 7, top + 6); g.closePath(); }, glow > 0.02 ? "glow" : "white", { outline: "ink2", width: 1.2 });
  if (h >= 120) { P.text(c, "LED", ledX + 16, top - 2, { size: 14, role: "ink3", align: "left", weight: 700 }); P.text(c, "cell", l + 10, top + (bot - top) / 2, { size: 14, role: "ink3", align: "left", weight: 700 }); }
  // the material in the gap
  const m: Material = ({ copper: "copper", iron: "iron", graphite: "graphite", salt: "water", plastic: "plastic", wood: "wood", rubber: "rubber" } as Record<string, Material>)[setup.gap] ?? "plastic";
  if (setup.gap === "salt") { P.fillPath(c, (g) => rrect(g, gapL - 4, bot - 14, gapR - gapL + 8, 20, 4), "water", { alpha: 0.5, outline: "ink3", width: 1.2 }); P.stroke(c, [[gapL, bot], [gapL, bot - 8]], { role: "ink2", width: 2 }); P.stroke(c, [[gapR, bot], [gapR, bot - 8]], { role: "ink2", width: 2 }); }
  else P.fillPath(c, (g) => rrect(g, gapL - 6, bot - 4, gapR - gapL + 12, 8, 3), m, { outline: "ink2", width: 1.2 });
}

function phaphoond(a: SceneArgs): void {
  const { P, c, x, y, w, h, setup, p, v } = a;
  const cx = x + w / 2, cy = y + h / 2 + 6, R = Math.min(w * 0.3, (h - 26) / 2);
  P.fillPath(c, (g) => ell(g, cx, cy + R * 0.3, R * 1.25, R * 0.45), "steel", { outline: "ink3", width: 1 });
  P.fillPath(c, (g) => ell(g, cx, cy, R, R * 0.62), "roti", { outline: "ink2", width: 1.5 });
  for (let i = 0; i < 6; i++) P.fillPath(c, (g) => ell(g, cx + (h01(i * 3) - 0.5) * R * 1.2, cy + (h01(i * 7) - 0.5) * R * 0.7, 3, 1.6), "soil", { alpha: 0.4, outline: null });
  if (setup.moist === "damp") droplets(a, cx - R * 0.6, cy - R * 0.5, R * 1.2, R * 0.5, 4, a.seed + 2, "water", 0.65);
  // mould spots: the computed count, fuzzy, growing with p
  const n = v === null ? 0 : v;
  for (let i = 0; i < n; i++) {
    const sx = cx + (h01(i * 13 + 1) - 0.5) * R * 1.4, sy = cy + (h01(i * 17 + 5) - 0.5) * R * 0.8, rr2 = (3 + h01(i) * 4) * ease(p);
    if (rr2 > 0.6) { P.fillPath(c, (g) => g.arc(sx, sy, rr2, 0, Math.PI * 2), "mould", { alpha: 0.9, outline: null }); for (let k = 0; k < 5; k++) { const t = k * 1.26; P.stroke(c, [[sx, sy], [sx + Math.cos(t) * rr2 * 1.4, sy + Math.sin(t) * rr2 * 1.4]], { role: "ink3", width: 0.8, alpha: 0.6 }); } }
  }
  if (setup.cover === "closed") jar(a, x + 6, y + 6, w - 12, h - 10, true);
  if (setup.warm === "fridge") snowflake(a, x + w - 14, y + 14, 7);
  else if (setup.warm === "warm") sun(a, x + w - 16, y + 14, 5);
}

function patta(a: SceneArgs): void {
  const { P, c, x, y, w, h, setup, p, v, ran } = a;
  const cx = x + w / 2, cy = y + h / 2 + 4, L = Math.min(w * 0.38, (h - 20) * 0.62);
  const leaf = (g: CanvasRenderingContext2D) => { g.moveTo(cx - L, cy); g.quadraticCurveTo(cx - L * 0.2, cy - L * 0.62, cx + L, cy); g.quadraticCurveTo(cx - L * 0.2, cy + L * 0.62, cx - L, cy); g.closePath(); };
  // before the test: green (or the pale variegated part); after iodine: blue-black where starch was made, brown where not
  const tested = ran && p > 0;
  const base: Material = setup.part === "white" ? "leafPale" : "leaf";
  P.fillPath(c, leaf, base, { outline: "ink2", width: 1.5 });
  if (tested) P.fillPath(c, leaf, v === 1 ? "starch" : "nostarch", { alpha: 0.9 * ease(p), outline: null });
  P.stroke(c, [[cx - L, cy], [cx + L * 0.95, cy]], { role: "ink3", width: 1.2 });
  for (let k = 1; k <= 3; k++) { const vx = cx - L + (k * L * 2) / 4.2; P.stroke(c, [[vx, cy], [vx + L * 0.2, cy - L * 0.24]], { role: "ink3", width: 1, alpha: 0.7 }); P.stroke(c, [[vx, cy], [vx + L * 0.2, cy + L * 0.24]], { role: "ink3", width: 1, alpha: 0.7 }); }
  P.stroke(c, [[cx - L, cy], [cx - L - 10, cy + 6]], { role: "q4", width: 2 });
  if (setup.light === "covered") P.fillPath(c, (g) => rrect(g, cx - L * 0.5, cy - L * 0.62, L * 0.9, L * 1.24, 2), "black", { alpha: tested ? 0.35 : 0.95, outline: "ink3", width: 1 });
  if (setup.co2 === "none") {
    // "no CO2" is a closed jar WITH something that takes the CO2 out (the NCERT set-up: a dish of KOH under the bell jar);
    // a bare jar still holds CO2 (a model judge caught the bare jar, 2026-10-09)
    jar(a, x + 6, y + 6, w - 12, h - 10, true);
    const dw = Math.min(44, w - 30), dx = x + w / 2 - dw / 2, dy = y + h - 20;
    P.body(c, dx, dy, dw, 8, { role: "q3", r: 4 });
    P.text(c, "KOH", x + w / 2, dy - 10, { size: 14, weight: 700, font: "mono", role: "ink2" });
  }
  if (setup.light !== "covered") sun(a, x + 22, y + (setup.co2 === "none" ? 30 : 14), 6);
}

const SCENES: Record<string, (a: SceneArgs) => void> = { ankur, sukhao, jhoola, jang, parchhai, rang, tairna, barf, chumbak, bijli, phaphoond, patta };
/** Draw the lab's apparatus for one set-up; false when the lab has no scene (the view falls back to its bar). */
export function drawScene(a: SceneArgs): boolean {
  const f = SCENES[a.lab.id];
  if (!f || a.w < 40 || a.h < 40) return false;
  // scenes are drawn for a ~150 × 130 box; a bigger card scales the apparatus up (≤ 1.7×) instead of leaving it small
  const sc = Math.max(1, Math.min(1.7, a.w / 150, a.h / 130));
  // a very tall card (a phone's narrow column, a laptop's tall card) keeps the apparatus at ≤ 1.35 × its width tall,
  // centred: a scene laid out over a 1 : 2 strip spread its parts apart and left the top half empty
  const vw = a.w / sc, vh = Math.min(a.h / sc, vw * 1.35), oy = (a.h / sc - vh) / 2;
  a.c.save();
  a.c.beginPath(); a.c.rect(a.x, a.y, a.w, a.h); a.c.clip();
  a.c.translate(a.x, a.y + oy * sc); a.c.scale(sc, sc);
  try { f({ ...a, x: 0, y: 0, w: vw, h: vh }); } finally { a.c.restore(); }
  return true;
}
export const SCENE_LABS = Object.keys(SCENES);
export type { Role };
