// Naksha · the 2D view (round 7). One view, four maps:
//   locate  a sea graticule (lines every 10°; the Equator and the Prime Meridian drawn bold). The drone is dragged (or the
//           crossing tapped) and dropped with "Drop". The ship is never drawn until the drone finds it; a miss shows a
//           magnifier on the empty spot. No readout of the drone's own position (that would make the map unnecessary).
//   route   a street grid (columns A…, rows 1… from the bottom) with ponds, the rider and the house. The program is built
//           with the buttons and shown as chips at the top; Go rolls the rider step by step; a pond or the map's edge stops
//           it. Compass: an arrow shows where north is (not always up); its letters fade.
//   scale   cm squared paper with a road from the truck to the town, and the scale bar "1 cm = k km". Fuel: the pump buttons
//           set the tank; reach: the pump is dragged along the road. Go drives the truck until its fuel runs out.
//   shape   the plan (a garden on a dot grid) and the child's dot plot: tapped dots become fence corners; Go closes the fence.
// Nothing moves on a clock: the law answers at once on Go and the world catches up (reduced motion: no animation).
import type { Moment, NakshaAct } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import {
  colName, deg, pointAt, roadLen, runRoute, runsOf, reachWant, type Dir, type LocateP, type NakshaParams, type NakshaState, type Pt, type RouteP, type RouteRun,
  type ScaleP, type ShapeP, type Step, screenOf,
} from "./naksha.logic.ts";

const STEP_SPEED = 3.2;   // route cells / s (cosmetic: the law has already answered)
const ROAD_SPEED = 3;     // scale cm / s
const DROP_TIME = 0.7;    // locate / shape: the drop or fence animation, s
type Box = { x: number; y: number; w: number; h: number };
const ANGLE: Record<Dir, number> = { n: -Math.PI / 2, e: 0, s: Math.PI / 2, w: Math.PI };

export const makeNakshaView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<NakshaParams, NakshaState, NakshaAct>;
  const { level, ctl, lang } = deps;
  const p = level.params;
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const st = () => ctl.state;
  const fs = () => (api.young ? 16 : 14);
  let w = 320, h = 420;
  /** the last go's animation: 0 → 1 (route: cells walked; scale: cm driven) */
  let anim: { t0: number; dur: number; run?: RouteRun; dist?: number } | null = null;
  let ghost: Pt | null = null, held = false;
  const act = (a: NakshaAct) => { ctl.dispatch(a); deps.changed(); };
  const animK = () => (anim ? (api.reduced ? 1 : clamp((api.t - anim.t0) / anim.dur, 0, 1)) : 1);
  /** the law's answer is shown only once the world has caught up with it */
  const shown = () => st().ended && animK() >= 1;
  const hemi = (v: number, axis: "lat" | "lon") => { const [a, hh] = deg(v, axis); return hh ? `${a}°${W(`naksha.${hh}`)}` : `${a}°`; };

  // ───────────────────────────── layout ─────────────────────────────
  // locate
  let gx = 40, gy = 40, ox = 40, oy = 30;
  // route / scale (cell size and grid origin, top band)
  let cell = 40, gx0 = 30, gy0 = 50, band: Box = { x: 8, y: 8, w: 300, h: 36 };
  // shape (dot spacing, plan origin, plot origin)
  let dot = 30, planO: [number, number] = [20, 40], plotO: [number, number] = [20, 200], planDots: Pt = [5, 4], stacked = true;

  function layout(bw: number, bh: number): void {
    w = bw; h = bh;
    const f = fs();
    if (p.goal === "fix") {
      const nx = (p.lon[1] - p.lon[0]) / p.step + 1, ny = (p.lat[1] - p.lat[0]) / p.step + 1;
      const L = f * 3.4 + 22, B = f + 16, T = f + 30, R = f * 1.8 + 6;
      gx = Math.min(72, (w - L - R) / (nx - 1)); gy = Math.min(64, (h - T - B) / (ny - 1));
      ox = L + Math.max(0, (w - L - R - gx * (nx - 1)) / 2); oy = T + Math.max(0, (h - T - B - gy * (ny - 1)) / 2);
    } else if (p.goal === "steps" || p.goal === "compass" || p.goal === "turns") {
      const rose = p.goal === "compass" ? 88 : 0, top = Math.max(f * 1.8 + 12, rose), left = f * 1.5 + 10, bottom = f + 14;
      cell = Math.max(24, Math.min(64, (w - left - 10) / p.cols, (h - top - bottom - 6) / p.rows));
      const gw = cell * p.cols, gh = cell * p.rows;
      gx0 = left + Math.max(0, (w - left - 10 - gw) / 2); gy0 = top + Math.max(0, (h - top - bottom - 6 - gh) / 2);
      // the program band sits over the grid (wide boxes: not stretched to the far edge)
      const bw = Math.min(w - 16, Math.max(gw, rose ? 220 : 0)), bx = Math.min(gx0, w - 8 - bw);
      band = { x: bx, y: Math.max(4, gy0 - top), w: bw, h: top - 4 };
    } else if (p.goal === "fuel" || p.goal === "reach") {
      const top = f * 2 + 14;
      cell = Math.max(20, Math.min(56, (w - 20) / p.cols, (h - top - 12) / p.rows));
      const gw = cell * p.cols, gh = cell * p.rows;
      gx0 = Math.max(10, (w - gw) / 2); gy0 = top + Math.max(0, (h - top - 12 - gh) / 2);
      band = { x: gx0, y: gy0 - top, w: gw, h: top - 4 };
    } else {
      const hp = p as ShapeP, xs = hp.model.map((q) => q[0]), ys = hp.model.map((q) => q[1]);
      planDots = [Math.max(...xs) - Math.min(...xs) + 3, Math.max(...ys) - Math.min(...ys) + 3];
      const lab = f + 14;
      // stacked (portrait) or side by side (landscape): whichever gives the larger dot spacing
      const sv = Math.min((w - 24) / (Math.max(planDots[0], p.cols) - 1 + 0.6), (h - 2 * lab - 24) / (planDots[1] - 1 + p.rows - 1 + 1.4));
      const sh = Math.min((w - 40) / (planDots[0] - 1 + p.cols - 1 + 1.6), (h - lab - 24) / (Math.max(planDots[1], p.rows) - 1 + 0.6));
      stacked = sv >= sh; dot = Math.max(20, Math.min(64, stacked ? sv : sh));
      if (stacked) {
        const ph = (planDots[1] - 1) * dot, qh = (p.rows - 1) * dot, total = lab + ph + dot * 0.7 + lab + qh, y0 = Math.max(6, (h - total) / 2);
        planO = [(w - (planDots[0] - 1) * dot) / 2, y0 + lab + ph]; plotO = [(w - (p.cols - 1) * dot) / 2, y0 + lab + ph + dot * 0.7 + lab + qh];
      } else {
        const pw = (planDots[0] - 1) * dot, qw = (p.cols - 1) * dot, gap = dot * 1.6, x0 = Math.max(10, (w - pw - gap - qw) / 2), hh = Math.max(planDots[1], p.rows) - 1;
        const yb = Math.max(lab + 6, (h - hh * dot) / 2 + lab / 2) + hh * dot;
        planO = [x0, yb - (hh - (planDots[1] - 1)) * dot / 2]; plotO = [x0 + pw + gap, yb];
      }
    }
  }

  // ───────────────────────────── coordinates ─────────────────────────────
  const geoXY = (q: Pt): [number, number] => [ox + ((q[0] - (p as LocateP).lon[0]) / (p as LocateP).step) * gx, oy + (((p as LocateP).lat[1] - q[1]) / (p as LocateP).step) * gy];
  const cellXY = (c: Pt): [number, number] => [gx0 + c[0] * cell, gy0 + ((p as RouteP).rows - 1 - c[1]) * cell];   // top-left
  const cellC = (c: Pt): [number, number] => { const [x, y] = cellXY(c); return [x + cell / 2, y + cell / 2]; };
  const paperXY = (q: [number, number]): [number, number] => [gx0 + q[0] * cell, gy0 + ((p as ScaleP).rows - q[1]) * cell];
  const dotXY = (o: [number, number], q: Pt): [number, number] => [o[0] + q[0] * dot, o[1] - q[1] * dot];

  // ───────────────────────────── input ─────────────────────────────
  function nearestGeo(x: number, y: number): Pt {
    const lp = p as LocateP;
    const i = Math.round((x - ox) / gx), j = Math.round((y - oy) / gy);
    const nx = (lp.lon[1] - lp.lon[0]) / lp.step, ny = (lp.lat[1] - lp.lat[0]) / lp.step;
    return [lp.lon[0] + clamp(i, 0, nx) * lp.step, lp.lat[1] - clamp(j, 0, ny) * lp.step];
  }
  function nearestRoad(x: number, y: number): Pt {
    const sp = p as ScaleP, L = roadLen(sp.road);
    let best = 1, bd = Infinity;
    for (let d = 1; d <= L; d++) { const [qx, qy] = paperXY(pointAt(sp.road, d)), dd = (qx - x) ** 2 + (qy - y) ** 2; if (dd < bd) { bd = dd; best = d; } }
    return [best, 0];
  }
  function pointer(kind: PointerKind, x: number, y: number): void {
    if (st().done) { held = false; ghost = null; return; }
    if (p.goal === "fix" || p.goal === "reach") {
      if (kind === "down") { const id = api.hit(x, y); if (id !== "map") return; held = true; }
      if (!held) return;
      if (kind === "down" || kind === "move") { ghost = p.goal === "fix" ? nearestGeo(x, y) : nearestRoad(x, y); api.invalidate(); return; }
      if (kind === "up" && ghost) { const g = ghost; ghost = null; held = false; const s = st(); if (!s.at || s.at[0] !== g[0] || s.at[1] !== g[1]) act({ kind: "put", x: g[0], y: g[1] }); else api.invalidate(); return; }
      held = false; ghost = null; api.invalidate();
      return;
    }
    if (p.goal === "copy" && kind === "down") {
      if (api.hit(x, y) !== "map") return;
      const i = Math.round((x - plotO[0]) / dot), j = Math.round((plotO[1] - y) / dot);
      if (i < 0 || j < 0 || i >= p.cols || j >= p.rows) return;
      if (Math.hypot(plotO[0] + i * dot - x, plotO[1] - j * dot - y) > dot * 0.62) return;
      act({ kind: "put", x: i, y: j });
    }
  }
  const dragging = () => held;

  // ───────────────────────────── the law answered ─────────────────────────────
  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as NakshaAct | undefined;
    if (!last) return;
    const s = st();
    if (refused && refused !== "missed") { api.sfx("refuse"); api.fx.shake(2); }
    else if (last.kind === "run") {
      api.sfx("slide");
      if (p.goal === "steps" || p.goal === "compass" || p.goal === "turns") { const run = runRoute(p, s.prog); anim = { t0: api.t, dur: Math.max(0.5, (run.cells.length - 1 + (run.bump ? 0.5 : 0)) / STEP_SPEED), run }; }
      else if (p.goal === "fuel" || p.goal === "reach") { const dist = p.goal === "fuel" ? s.value / p.k : reachWant(p); anim = { t0: api.t, dur: Math.max(0.6, Math.min(dist, roadLen(p.road) + 1.5) / ROAD_SPEED), dist }; }
      else anim = { t0: api.t, dur: DROP_TIME };
    } else if (last.kind === "undo") { api.sfx("tap"); anim = null; }
    else { api.sfx(last.kind === "put" ? "land" : "tap"); anim = null; }
    void ms;
    api.invalidate(); deps.changed();
  }
  let landedOnce = false;
  function update(_dt: number): void {
    if (!anim) return;
    if (animK() < 1) { api.invalidate(); landedOnce = false; return; }
    if (!landedOnce && st().ended) {
      landedOnce = true;
      if (st().done) { api.sfx("good"); const [x, y] = endXY(); api.fx.burst(x, y, { n: 18, color: api.P.color("good"), speed: 110, life: 0.7, size: 3, kind: "spark" }); }
      else api.sfx("look");
      deps.changed();
      api.invalidate();
    }
  }
  const busy = () => !!anim && animK() < 1;
  /** where the go ended (for the burst) */
  function endXY(): [number, number] {
    const s = st();
    if (p.goal === "fix") return s.at ? geoXY(s.at) : [w / 2, h / 2];
    if (p.goal === "steps" || p.goal === "compass" || p.goal === "turns") { const r = anim?.run ?? runRoute(p, s.prog); return cellC(r.cells[r.cells.length - 1]); }
    if (p.goal === "fuel" || p.goal === "reach") return paperXY(pointAt(p.road, Math.min(anim?.dist ?? 0, roadLen(p.road))));
    const c = s.corners;
    return c.length ? dotXY(plotO, [Math.round(c.reduce((a, q) => a + q[0], 0) / c.length), Math.round(c.reduce((a, q) => a + q[1], 0) / c.length)]) : [w / 2, h / 2];
  }

  // ───────────────────────────── drawings ─────────────────────────────
  function drone(c: CanvasRenderingContext2D, x: number, y: number, r: number, alpha = 1): void {
    const P = api.P;
    for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      P.stroke(c, [[x, y], [x + dx * r * 0.85, y + dy * r * 0.85]], { role: "ink2", width: 2, alpha });
      P.circle(c, x + dx * r * 0.85, y + dy * r * 0.85, r * 0.42, { role: "you", width: 1.8, alpha });
    }
    P.circle(c, x, y, r * 0.45, { role: "you", fill: true, alpha });
  }
  function ship(c: CanvasRenderingContext2D, x: number, y: number, s: number): void {
    const P = api.P;
    c.save(); c.fillStyle = P.color("q4"); c.beginPath(); c.moveTo(x - s, y); c.lineTo(x + s, y); c.lineTo(x + s * 0.65, y + s * 0.5); c.lineTo(x - s * 0.65, y + s * 0.5); c.closePath(); c.fill(); c.restore();
    P.stroke(c, [[x, y], [x, y - s]], { role: "ink2", width: 2 });
    c.save(); c.fillStyle = P.color("q1"); c.beginPath(); c.moveTo(x, y - s); c.lineTo(x + s * 0.6, y - s * 0.3); c.lineTo(x, y - s * 0.2); c.closePath(); c.fill(); c.restore();
  }
  function house(c: CanvasRenderingContext2D, x: number, y: number, s: number): void {
    const P = api.P;
    P.body(c, x + s * 0.2, y + s * 0.42, s * 0.6, s * 0.46, { role: "q4", r: 2 });
    c.save(); c.fillStyle = P.color("q1"); c.beginPath(); c.moveTo(x + s * 0.12, y + s * 0.46); c.lineTo(x + s / 2, y + s * 0.12); c.lineTo(x + s * 0.88, y + s * 0.46); c.closePath(); c.fill(); c.restore();
  }
  function pond(c: CanvasRenderingContext2D, x: number, y: number, s: number, seed: number): void {
    const P = api.P;
    P.body(c, x + s * 0.1, y + s * 0.1, s * 0.8, s * 0.8, { role: "q2", r: s * 0.32, seed });
    for (const k of [0.4, 0.62]) P.stroke(c, [[x + s * 0.28, y + s * k], [x + s * 0.4, y + s * (k - 0.05)], [x + s * 0.52, y + s * k], [x + s * 0.64, y + s * (k - 0.05)], [x + s * 0.72, y + s * k]], { role: "ink3", width: 1.5 });
  }
  function rider(c: CanvasRenderingContext2D, x: number, y: number, s: number, ang: number): void {
    const P = api.P, r = s * 0.26;
    P.circle(c, x, y, r, { role: "you", fill: true });
    const tip: [number, number] = [x + Math.cos(ang) * r * 1.9, y + Math.sin(ang) * r * 1.9];
    const a1: [number, number] = [x + Math.cos(ang + 2.4) * r * 1.05, y + Math.sin(ang + 2.4) * r * 1.05], a2: [number, number] = [x + Math.cos(ang - 2.4) * r * 1.05, y + Math.sin(ang - 2.4) * r * 1.05];
    c.save(); c.fillStyle = P.color("you"); c.beginPath(); c.moveTo(tip[0], tip[1]); c.lineTo(a1[0], a1[1]); c.lineTo(a2[0], a2[1]); c.closePath(); c.fill(); c.restore();
    P.circle(c, x, y, r * 0.42, { role: "panel", fill: true });
  }
  function truck(c: CanvasRenderingContext2D, x: number, y: number, s: number): void {
    const P = api.P;
    P.body(c, x - s * 0.5, y - s * 0.34, s * 0.62, s * 0.42, { role: "q1", r: 2 });
    P.body(c, x + s * 0.14, y - s * 0.24, s * 0.34, s * 0.32, { role: "you", r: 2 });
    P.circle(c, x - s * 0.3, y + s * 0.12, s * 0.12, { role: "ink", fill: true });
    P.circle(c, x + s * 0.3, y + s * 0.12, s * 0.12, { role: "ink", fill: true });
  }
  function pump(c: CanvasRenderingContext2D, x: number, y: number, s: number, alpha = 1): void {
    const P = api.P;
    P.stroke(c, [[x, y], [x, y - s]], { role: "ink2", width: 2.5, alpha });
    c.save(); c.globalAlpha = alpha; c.fillStyle = P.color("you"); c.beginPath(); c.moveTo(x, y - s); c.lineTo(x + s * 0.62, y - s * 0.78); c.lineTo(x, y - s * 0.56); c.closePath(); c.fill(); c.restore();
    P.circle(c, x, y, 4, { role: "you", fill: true, alpha });
  }
  /** a straight arrow (dir) or a turn arrow (l / r) inside a chip of size s centred at (x, y) */
  function arrowGlyph(c: CanvasRenderingContext2D, x: number, y: number, s: number, step: Step): void {
    const P = api.P;
    if (step === "l" || step === "r") {
      const sg = step === "l" ? -1 : 1;
      P.stroke(c, [[x - sg * s * 0.1, y + s * 0.35], [x - sg * s * 0.1, y - s * 0.05], [x + sg * s * 0.25, y - s * 0.05]], { role: "ink", width: 2.6 });
      c.save(); c.fillStyle = P.color("ink"); c.beginPath(); c.moveTo(x + sg * s * 0.4, y - s * 0.05); c.lineTo(x + sg * s * 0.2, y - s * 0.22); c.lineTo(x + sg * s * 0.2, y + s * 0.12); c.closePath(); c.fill(); c.restore();
      return;
    }
    const d: Dir = step === "f" ? "n" : step, a = ANGLE[d], L = s * 0.36;
    const t: [number, number] = [x + Math.cos(a) * L, y + Math.sin(a) * L], b: [number, number] = [x - Math.cos(a) * L, y - Math.sin(a) * L];
    P.stroke(c, [b, t], { role: "ink", width: 2.6 });
    c.save(); c.fillStyle = P.color("ink"); c.beginPath(); c.moveTo(t[0] + Math.cos(a) * 3, t[1] + Math.sin(a) * 3);
    c.lineTo(t[0] + Math.cos(a + 2.5) * s * 0.22, t[1] + Math.sin(a + 2.5) * s * 0.22); c.lineTo(t[0] + Math.cos(a - 2.5) * s * 0.22, t[1] + Math.sin(a - 2.5) * s * 0.22); c.closePath(); c.fill(); c.restore();
  }

  // ───────────────────────────── locate ─────────────────────────────
  function lonLabelled(lp: LocateP): number[] {
    const xs: number[] = [];
    for (let x = lp.lon[0]; x <= lp.lon[1]; x += lp.step) xs.push(x);
    const ref = lp.lon[0] <= 0 && lp.lon[1] >= 0 ? 0 : lp.lon[0];
    const want = xs.filter((x) => lp.labels === 1 || x === ref || (lp.labels === 2 ? (x - ref) % (2 * lp.step) === 0 : x === lp.lon[0] || x === lp.lon[1]));
    // never two labels closer than one label's width: keep the reference line, thin the rest outward from it
    const min = fs() * 3.7, out = [ref];
    for (const dir of [1, -1]) { let lastX = geoXY([ref, 0])[0]; for (const x of want.filter((v) => (v - ref) * dir > 0).sort((a, b) => (a - b) * dir)) { const px = geoXY([x, 0])[0]; if (Math.abs(px - lastX) >= min) { out.push(x); lastX = px; } } }
    return out;
  }
  function latLabelled(lp: LocateP): number[] {
    const ys: number[] = [];
    for (let y = lp.lat[0]; y <= lp.lat[1]; y += lp.step) ys.push(y);
    const want = ys.filter((y) => lp.labels === 1 || y === 0 || (lp.labels === 2 ? y % (2 * lp.step) === 0 : y === lp.lat[0] || y === lp.lat[1]));
    return gy >= fs() + 6 ? want : want.filter((y) => y % (2 * lp.step) === 0);
  }
  function drawLocate(c: CanvasRenderingContext2D, lp: LocateP): void {
    const P = api.P, s = st(), f = fs();
    const [x0, y0] = geoXY([lp.lon[0], lp.lat[1]]), [x1, y1] = geoXY([lp.lon[1], lp.lat[0]]);
    P.body(c, x0 - 10, y0 - 10, x1 - x0 + 20, y1 - y0 + 20, { role: "panel", r: 8 });
    if (!s.done) api.target("map", x0 - gx / 2, y0 - gy / 2, x1 - x0 + gx, y1 - y0 + gy);
    for (let x = lp.lon[0]; x <= lp.lon[1]; x += lp.step) { const [px] = geoXY([x, 0]); P.stroke(c, [[px, y0], [px, y1]], { role: x === 0 ? "q3" : "ink3", width: x === 0 ? 3 : 1.2, alpha: x === 0 ? 1 : 0.7 }); }
    for (let y = lp.lat[0]; y <= lp.lat[1]; y += lp.step) { const [, py] = geoXY([0, y]); P.stroke(c, [[x0, py], [x1, py]], { role: y === 0 ? "q3" : "ink3", width: y === 0 ? 3 : 1.2, alpha: y === 0 ? 1 : 0.7 }); }
    for (const x of lonLabelled(lp)) { const [px] = geoXY([x, 0]); P.text(c, hemi(x, "lon"), px, y1 + 12 + f / 2, { size: f, role: x === 0 ? "ink" : "ink2", font: "mono", weight: 700 }); }
    for (const y of latLabelled(lp)) { const [, py] = geoXY([0, y]); P.text(c, hemi(y, "lat"), x0 - 14, py, { size: f, role: y === 0 ? "ink" : "ink2", font: "mono", weight: 700, align: "right" }); }
    // the north arrow, above the map's right corner
    const nx = x1 - 4, ny = y0 - 14;
    P.stroke(c, [[nx, ny + 2], [nx, ny - f + 2]], { role: "ink2", width: 2 });
    c.save(); c.fillStyle = P.color("ink2"); c.beginPath(); c.moveTo(nx, ny - f - 2); c.lineTo(nx - 5, ny - f + 6); c.lineTo(nx + 5, ny - f + 6); c.closePath(); c.fill(); c.restore();
    P.text(c, W("naksha.N"), nx - f * 0.9, ny - f / 2 + 2, { size: f, role: "ink2", weight: 700 });
    const r = Math.max(8, Math.min(gx, gy) * 0.3);
    const end = shown();
    if (end && s.done) { const [tx, ty] = geoXY(lp.target); ship(c, tx, ty + r * 0.4, r * 1.1); }
    // the drone: at its spot, at the finger while dragging, or waiting by the map's corner
    const spot = ghost ?? s.at;
    if (spot) {
      const [dx, dy] = geoXY(spot), k = !ghost && s.ended ? animK() : 1;
      if (!ghost && s.ended && k < 1) P.circle(c, dx, dy, r * (0.6 + 1.6 * k), { role: "you", width: 2, alpha: 1 - k });
      drone(c, dx, dy - (ghost ? r * 0.5 : 0), r, ghost ? 0.75 : 1);
    } else { const rw = Math.min(r * 0.8, 12); drone(c, x0 + rw * 1.4, y0 - 12 - rw * 1.3, rw, 0.55); }
    if (end && s.done && s.at) { const [tx, ty] = geoXY(s.at); P.tick(c, tx + r * 1.4, ty - r * 1.6, Math.min(26, r * 2), 1); }
    if (end && !s.done && s.at) { const [tx, ty] = geoXY(s.at); P.magnifier(c, tx + r * 1.5, ty - r * 1.2, Math.min(24, r * 2)); }
  }

  // ───────────────────────────── route ─────────────────────────────
  function drawRoute(c: CanvasRenderingContext2D, rp: RouteP): void {
    const P = api.P, s = st(), f = fs(), end = shown();
    const gw = cell * rp.cols, gh = cell * rp.rows;
    P.body(c, gx0 - 4, gy0 - 4, gw + 8, gh + 8, { role: "panel", r: 8 });
    for (let i = 0; i <= rp.cols; i++) P.stroke(c, [[gx0 + i * cell, gy0], [gx0 + i * cell, gy0 + gh]], { role: "ink3", width: 1, alpha: 0.6 });
    for (let j = 0; j <= rp.rows; j++) P.stroke(c, [[gx0, gy0 + j * cell], [gx0 + gw, gy0 + j * cell]], { role: "ink3", width: 1, alpha: 0.6 });
    for (let i = 0; i < rp.cols; i++) P.text(c, colName(i), gx0 + (i + 0.5) * cell, gy0 + gh + 6 + f / 2, { size: f, role: "ink2", weight: 700, font: "mono" });
    for (let j = 0; j < rp.rows; j++) P.text(c, String(j + 1), gx0 - 8, gy0 + (rp.rows - 1 - j + 0.5) * cell, { size: f, role: "ink2", weight: 700, font: "mono", align: "right" });
    rp.rocks.forEach((q, i) => { const [x, y] = cellXY(q); pond(c, x, y, cell, i + 1); });
    if (rp.labels < 3 || (end && s.done)) { const [x, y] = cellXY(rp.home); house(c, x, y, cell); }
    // the rider: walking the last go, else at the start
    const run = anim?.run;
    let rx: number, ry: number, ang: number;
    if (run && s.ended) {
      const n = run.cells.length - 1, u = animK() * (n + (run.bump ? 0.5 : 0)), i = Math.min(n, Math.floor(u)), fr = u - i;
      const a = cellC(run.cells[i]), b = i < n ? cellC(run.cells[i + 1]) : run.bumpAt ? cellC(run.bumpAt) : a;
      const bounce = i >= n && run.bump ? Math.sin(Math.min(1, fr * 2) * Math.PI) * 0.35 : fr;
      [rx, ry] = [a[0] + (b[0] - a[0]) * bounce, a[1] + (b[1] - a[1]) * bounce];
      ang = ANGLE[run.heads[Math.min(run.heads.length - 1, i + (fr > 0.5 && i < n ? 1 : 0))]];
    } else { [rx, ry] = cellC(rp.start); ang = ANGLE[rp.goal === "turns" ? rp.heading : "n"]; if (rp.goal !== "turns") ang = NaN; }
    if (Number.isNaN(ang)) { P.circle(c, rx, ry, cell * 0.26, { role: "you", fill: true }); P.circle(c, rx, ry, cell * 0.11, { role: "panel", fill: true }); }
    else rider(c, rx, ry, cell, ang);
    if (end && run) {
      const last = run.cells[run.cells.length - 1], [ex, ey] = cellXY(last);
      if (s.done) P.tick(c, ex + cell * 0.5, ey + cell * 0.2, Math.min(26, cell * 0.5), 1);
      else P.magnifier(c, ex + cell * 0.78, ey + cell * 0.3, Math.min(24, cell * 0.42));
    }
    drawProgram(c, rp);
    if (rp.goal === "compass") rose(c, rp);
  }
  /** the program as chips at the top: one chip per run of equal steps (an arrow or a letter, and how many) */
  function drawProgram(c: CanvasRenderingContext2D, rp: RouteP): void {
    const P = api.P, f = fs(), s = st();
    const right = rp.goal === "compass" ? band.x + band.w - 76 : band.x + band.w;
    const ch = f * 1.8, cy = band.y + band.h / 2;
    const runs = runsOf(s.prog);
    const widthOf = (r: [Step, number]) => (rp.goal === "compass" ? f * 0.75 : f * 1.15) + (r[1] > 1 ? f * 0.65 * String(r[1]).length + 4 : 0) + 16;
    let start = 0, total = runs.reduce((a, r) => a + widthOf(r) + 6, 0);
    const room = right - band.x;
    while (start < runs.length && total > room - (start ? f * 1.6 : 0)) { total -= widthOf(runs[start]) + 6; start++; }
    let x = band.x;
    if (start) { P.text(c, "…", x + f * 0.5, cy, { size: f, role: "ink2", weight: 700 }); x += f * 1.6; }
    for (const r of runs.slice(start)) {
      const cw = widthOf(r);
      P.body(c, x, cy - ch / 2, cw, ch, { role: "panel", r: ch / 2 });
      const gxl = x + 8 + (rp.goal === "compass" ? f * 0.38 : f * 0.58);
      if (rp.goal === "compass") P.text(c, W(`naksha.${r[0].toUpperCase()}`), gxl, cy, { size: f, role: "ink", weight: 800 });
      else arrowGlyph(c, gxl, cy, f * 1.15, r[0]);
      if (r[1] > 1) P.text(c, String(r[1]), x + cw - 8, cy, { size: f, role: "ink", weight: 700, font: "mono", align: "right" });
      x += cw + 6;
    }
  }
  /** the north arrow: it points where north is on THIS map (fade 1: all four letters; else N only) */
  function rose(c: CanvasRenderingContext2D, rp: RouteP): void {
    const P = api.P, f = fs(), cx = band.x + band.w - 36, cy = band.y + band.h / 2, R = Math.min(20, band.h / 2 - f * 1.25);
    P.circle(c, cx, cy, R, { role: "ink3", width: 1.5 });
    for (const d of ["n", "e", "s", "w"] as Dir[]) {
      const sd = screenOf(d, rp.north), a = ANGLE[sd], len = d === "n" ? R : R * 0.55;
      P.stroke(c, [[cx, cy], [cx + Math.cos(a) * len, cy + Math.sin(a) * len]], { role: d === "n" ? "q1" : "ink2", width: d === "n" ? 3.2 : 1.6 });
      if (d === "n" || rp.labels === 1) {
        const tx = cx + Math.cos(a) * (R + f * 0.62), ty = cy + Math.sin(a) * (R + f * 0.62);
        P.text(c, W(`naksha.${d.toUpperCase()}`), tx, ty, { size: f, role: d === "n" ? "ink" : "ink2", weight: 800 });
      }
    }
  }

  // ───────────────────────────── scale ─────────────────────────────
  function drawScale(c: CanvasRenderingContext2D, sp: ScaleP): void {
    const P = api.P, s = st(), f = fs(), end = shown(), L = roadLen(sp.road);
    const gw = cell * sp.cols, gh = cell * sp.rows;
    P.body(c, gx0, gy0, gw, gh, { role: "panel", r: 6 });
    if (!s.done && sp.goal === "reach") api.target("map", gx0, gy0, gw, gh);
    for (let i = 1; i < sp.cols; i++) P.stroke(c, [[gx0 + i * cell, gy0], [gx0 + i * cell, gy0 + gh]], { role: "ink3", width: 1, alpha: 0.45 });
    for (let j = 1; j < sp.rows; j++) P.stroke(c, [[gx0, gy0 + j * cell], [gx0 + gw, gy0 + j * cell]], { role: "ink3", width: 1, alpha: 0.45 });
    // the scale bar: one square = 1 cm
    const by = band.y + band.h / 2, bx = band.x + 2;
    P.stroke(c, [[bx, by], [bx + cell, by]], { role: "ink", width: 4 });
    for (const k of [0, 1]) P.stroke(c, [[bx + k * cell, by - 7], [bx + k * cell, by + 7]], { role: "ink", width: 2 });
    P.text(c, W("naksha.scale", { k: sp.k, u: W(`naksha.${sp.unit}`) }), bx + cell + 10, by, { size: f + 1, role: "ink", weight: 700, align: "left", font: "mono" });
    // the road, its cm ticks (fade 1), the truck's depot and the town
    const pts = sp.road.map((q) => paperXY(q));
    P.stroke(c, pts, { role: "q3", width: Math.max(6, cell * 0.3), alpha: 0.85 });
    P.stroke(c, pts, { role: "panel", width: 1.5, dash: [4, 5] });
    if (sp.labels === 1) for (let d = 1; d < L; d++) {
      const [ax, ay] = paperXY(pointAt(sp.road, d)), [bx2, by2] = paperXY(pointAt(sp.road, Math.min(L, d + 0.01)));
      const nx = -(by2 - ay), ny = bx2 - ax, n = Math.hypot(nx, ny) || 1, t = cell * 0.22;
      P.stroke(c, [[ax - (nx / n) * t, ay - (ny / n) * t], [ax + (nx / n) * t, ay + (ny / n) * t]], { role: "ink", width: 1.6 });
    }
    const [tx, ty] = pts[pts.length - 1];
    house(c, tx - cell * 0.5, ty - cell * 0.95, cell);
    // the pump (reach): at its spot or at the finger
    if (sp.goal === "reach") {
      const spot = ghost ?? s.at;
      if (spot) { const [px, py] = paperXY(pointAt(sp.road, spot[0])); pump(c, px, py, cell * 0.8, ghost ? 0.7 : 1); }
    }
    // the truck: at the depot, or driving the last go (past the town's end when the tank was too full)
    let d = 0;
    if (anim?.dist !== undefined && s.ended) d = Math.min(anim.dist, L + 1.5) * animK();
    let q = pointAt(sp.road, Math.min(d, L));
    if (d > L) { const a = sp.road[sp.road.length - 2], b = sp.road[sp.road.length - 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; q = [b[0] + ((b[0] - a[0]) / l) * (d - L), b[1] + ((b[1] - a[1]) / l) * (d - L)]; }
    const [vx, vy] = paperXY(q);
    truck(c, clamp(vx, gx0 + cell * 0.4, gx0 + gw - cell * 0.4), clamp(vy, gy0 + cell * 0.4, gy0 + gh - cell * 0.2), cell * 0.9);
    if (end) {
      const [ex, ey] = [clamp(vx, gx0 + cell * 0.4, gx0 + gw - cell * 0.4), clamp(vy, gy0, gy0 + gh)];
      if (s.done) P.tick(c, ex, ey - cell * 0.9, Math.min(26, cell * 0.7), 1);
      else P.magnifier(c, ex + cell * 0.5, ey - cell * 0.6, Math.min(24, cell * 0.6));
    }
  }

  // ───────────────────────────── shape ─────────────────────────────
  function dotGrid(c: CanvasRenderingContext2D, o: [number, number], nx: number, ny: number, lines: boolean): void {
    const P = api.P;
    if (lines) {
      for (let i = 0; i < nx; i++) P.stroke(c, [dotXY(o, [i, 0]), dotXY(o, [i, ny - 1])], { role: "ink3", width: 1, alpha: 0.35 });
      for (let j = 0; j < ny; j++) P.stroke(c, [dotXY(o, [0, j]), dotXY(o, [nx - 1, j])], { role: "ink3", width: 1, alpha: 0.35 });
    }
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const [x, y] = dotXY(o, [i, j]); P.circle(c, x, y, Math.max(2.5, dot * 0.08), { role: "ink2", fill: true }); }
  }
  function fillPoly(c: CanvasRenderingContext2D, pts: [number, number][], role: "q1" | "good", alpha: number): void {
    c.save(); c.globalAlpha = alpha; c.fillStyle = api.P.color(role); c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill(); c.restore();
  }
  function drawShape(c: CanvasRenderingContext2D, hp: ShapeP): void {
    const P = api.P, s = st(), f = fs(), end = shown();
    const mx = Math.min(...hp.model.map((q) => q[0])), my = Math.min(...hp.model.map((q) => q[1]));
    const plan = hp.model.map(([x, y]) => dotXY(planO, [x - mx + 1, y - my + 1]));
    const lab = (t: string, o: [number, number], nx: number) => P.text(c, t, o[0] + ((nx - 1) * dot) / 2, o[1] - 0 - ((o === planO ? planDots[1] : hp.rows) - 1) * dot - f / 2 - 10, { size: f, role: "ink2", weight: 700 });
    lab(W("naksha.plan"), planO, planDots[0]);
    lab(W("naksha.plot"), plotO, hp.cols);
    // the plan: the garden shaded on its squares (fade 1), else its fence only
    dotGrid(c, planO, planDots[0], planDots[1], hp.labels === 1);
    if (hp.labels === 1) fillPoly(c, plan, "q1", 0.35);
    P.stroke(c, plan, { role: "q1", width: 3.5, closed: true });
    // the plot: dots (squares faint at fades 1-2), the child's fence so far
    const [px1, py1] = dotXY(plotO, [hp.cols - 1, hp.rows - 1]);
    if (!s.done) api.target("map", plotO[0] - dot / 2, py1 - dot / 2, px1 - plotO[0] + dot, plotO[1] - py1 + dot);
    dotGrid(c, plotO, hp.cols, hp.rows, hp.labels < 3);
    const pts = s.corners.map((q) => dotXY(plotO, q));
    if (pts.length >= 3 && s.ended) { const k = animK(); fillPoly(c, pts, s.done && end ? "good" : "q1", 0.3 * k); }
    if (pts.length >= 2) P.stroke(c, pts, { role: "you", width: 3.5, closed: s.ended });
    if (pts.length >= 3 && !s.ended) P.stroke(c, [pts[pts.length - 1], pts[0]], { role: "you", width: 2, dash: [5, 6], alpha: 0.6 });
    pts.forEach(([x, y], i) => P.circle(c, x, y, Math.max(5, dot * 0.16), { role: "you", fill: i === pts.length - 1 && !s.ended, width: 2.5 }));
    if (end && pts.length) {
      const cx = pts.reduce((a, q) => a + q[0], 0) / pts.length, cy = pts.reduce((a, q) => a + q[1], 0) / pts.length;
      if (s.done) P.tick(c, cx, cy, Math.min(28, dot * 0.8), 1);
      else P.magnifier(c, cx, cy, Math.min(26, dot * 0.8));
    }
  }

  function draw(c: CanvasRenderingContext2D): void {
    switch (p.goal) {
      case "fix": return drawLocate(c, p);
      case "steps": case "compass": case "turns": return drawRoute(c, p);
      case "fuel": case "reach": return drawScale(c, p);
      case "copy": return drawShape(c, p);
    }
  }

  // ───────────────────────────── chrome ─────────────────────────────
  function goal(): string {
    const s = st();
    if (s.ended && !s.done && shown()) return W("naksha.again");
    switch (p.goal) {
      case "fix": return W("naksha.goal.fix", { lat: hemi(p.target[1], "lat"), lon: hemi(p.target[0], "lon") });
      case "steps": return W("naksha.goal.steps", { ref: `${colName(p.home[0])}${p.home[1] + 1}` });
      case "compass": return W("naksha.goal.compass");
      case "turns": return W("naksha.goal.turns");
      case "fuel": return W("naksha.goal.fuel");
      case "reach": return W("naksha.goal.reach", { d: p.fuel, u: W(`naksha.${p.unit}`) });
      case "copy": return W("naksha.goal.copy");
    }
  }
  // the tank only (fuel): never the drone's position, the rider's cell or a running distance
  const readouts = (): Readout[] => (p.goal === "fuel" ? [{ k: W("naksha.fuel"), v: `${st().value} ${W(`naksha.${p.unit}`)}` }] : []);
  function controls(): ControlSpec[] {
    const s = st();
    if (s.done) return [];
    const out: ControlSpec[] = [];
    const setReady = p.goal === "fix" || p.goal === "reach" ? !!s.at : p.goal === "fuel" ? s.value > 0 : p.goal === "copy" ? s.corners.length >= 3 : s.prog.length > 0;
    const ready = setReady && !s.ended && !busy();
    if (p.goal === "steps") for (const [d, lab, aria] of [["w", "←", "left"], ["n", "↑", "up"], ["s", "↓", "down"], ["e", "→", "right"]] as const)
      out.push({ id: `go-${d}`, label: lab, aria: `one step ${aria}`, kind: "pad", group: "pad", disabled: busy(), onPress: () => act({ kind: "step", dir: d }) });
    if (p.goal === "compass") for (const d of ["n", "e", "s", "w"] as const)
      out.push({ id: `go-${d}`, label: W(`naksha.${d.toUpperCase()}`), aria: `one step ${({ n: "north", e: "east", s: "south", w: "west" } as const)[d]}`, kind: "pad", group: "pad", disabled: busy(), onPress: () => act({ kind: "step", dir: d }) });
    if (p.goal === "turns") for (const [d, k] of [["l", "naksha.left"], ["f", "naksha.fwd"], ["r", "naksha.right"]] as const)
      out.push({ id: `go-${d}`, label: W(k), aria: d === "f" ? "one step forward" : `turn ${d === "l" ? "left" : "right"}`, kind: "secondary", group: "turn", disabled: busy(), onPress: () => act({ kind: "step", dir: d }) });
    if (p.goal === "fuel") for (const by of [-10, -1, 1, 10]) {
      const v = clamp(s.value + by, 0, p.max);
      out.push({ id: `fuel${by > 0 ? "p" : "m"}${Math.abs(by)}`, label: `${by > 0 ? "+" : "−"}${Math.abs(by)}`, aria: `${by > 0 ? "add" : "take out"} ${Math.abs(by)}`, kind: "pad", group: "pad", disabled: busy() || v === s.value, onPress: () => act({ kind: "set", value: v }) });
    }
    out.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", disabled: busy() || s.depth === 0, onPress: () => act({ kind: "undo" }) });
    const goLabel = p.goal === "fix" ? W("naksha.drop") : p.goal === "copy" ? W("naksha.fence") : W("naksha.run");
    out.push({ id: "run", label: goLabel, aria: "go: the map answers", kind: "primary", group: "go", you: ready, disabled: !ready, onPress: () => act({ kind: "run" }) });
    return out;
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, dragging, goal, readouts, controls, react };
  return view;
};
