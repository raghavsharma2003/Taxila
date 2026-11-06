// Kon · the 2D view of the line goals (r7 kon2; the law is kon.lines.ts). Three boards, none timed, none snapping:
//   lines  a sheet of squared paper (fade 3: plain): line 1 drawn short through O, line 2 turned about P (or O) by dragging
//          anywhere on the sheet (or ↺ ↻ by 1°). The run extends both lines off the sheet and zooms out until they meet, if
//          they do; a perpendicular run lays a set-square on the crossing.
//   cross  a road crosses canal 1 at X1 (only a stub of it shows, with ∠1 and its number) and canal 2 at X2, where a
//          one-scale protractor sits on the road ray of ∠2. The child turns canal 2; the run opens canal 1 to its full length
//          and extends canal 2, zooming out to their crossing when they are not parallel.
//   ends   points on one faint straight track; two stops are dragged onto points, or off the end of the track (that end
//          then runs on forever, an arrow), or parked below. ◀ ▶ move each stop too. The run sends a light along every
//          open end and stops it at every stop.
// Angle labels sit on the bisector of their arc, outside it, at 16 px (the class 4-5 floor, kept for classes 6-7 too).
import type { KonAct, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, type ControlSpec, type FamilyView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import type { KonParams, KonState } from "./kon.logic.ts";
import { PAGE, angle1, canalRay, crossSign, crossing, endsTarget, ldiff, lineMeets, lineTarget, norm, roadRay, type Stops } from "./kon.lines.ts";

type Pt = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;
const FAR = 6000;

export function makeLinesView(api: ViewApi, depsIn: ViewDeps): FamilyView {
  const deps = depsIn as unknown as ViewDeps<KonParams, KonState, KonAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, g = p.goal;
  const lines = g === "parallel" || g === "perp", cross = g === "corr" || g === "alt", ends = g === "ends";
  const st = () => ctl.state;
  let w = 360, h = 480, cx = 180, cy = 240, u = 30;
  let drag = false, shown: number | null = null, truthAt = -1;
  // ends: which stop is in the hand, and where it is drawn while dragged
  let held: "lo" | "hi" | null = null, heldAt: Pt = [0, 0];

  // ── world ↔ screen (lines / cross: grid units about the board's centre; the run zooms out about it)
  let zoom = 1;
  const W = (x: number, y: number): Pt => [cx + x * u * zoom, cy - y * u * zoom];
  const dir = (d: number): Pt => [Math.cos(rad(d)), Math.sin(rad(d))];
  const at = (o: Pt, d: number, r: number): Pt => [o[0] + Math.cos(rad(d)) * r, o[1] + Math.sin(rad(d)) * r];
  const pivot = (): Pt => (lines ? [p.px ?? 0, p.py ?? 0] : [0, 0]);
  // cross: X2 sits below the centre, X1 up the road
  const D = 3.6;
  const X1 = (): Pt => at([0, 0], p.start, D / 2), X2 = (): Pt => at([0, 0], p.start, -D / 2);
  const armOrigin = (): Pt => (cross ? X2() : pivot());
  const headingAt = (x: number, y: number) => { const o = W(...armOrigin()); return norm((Math.atan2(o[1] - y, x - o[0]) * 180) / Math.PI); };

  function layout(w0: number, h0: number): void {
    w = w0; h = h0; cx = w / 2; cy = h / 2;
    if (lines) u = Math.min(w, h) * 0.46 / PAGE;
    if (cross) u = Math.min(w / 8.4, h / 8.8, 64);
    if (ends) u = 1;
  }
  /** a whole line through world point o at heading d, as a long screen segment (the canvas clips it) */
  const longLine = (o: Pt, d: number): Pt[] => { const [ux, uy] = dir(d), r = FAR / (u * zoom); return [W(o[0] - ux * r, o[1] - uy * r), W(o[0] + ux * r, o[1] + uy * r)]; };
  function arcAt(c: CanvasRenderingContext2D, o: Pt, r: number, a0: number, open: number, sgn: number, role: string, width = 2.5): void {
    const [x, y] = W(...o);
    c.save(); c.beginPath(); c.strokeStyle = api.P.color(role as never); c.lineWidth = width;
    c.arc(x, y, r, -rad(a0), -rad(a0 + sgn * open), sgn > 0); c.stroke(); c.restore();
  }
  /** the run's zoom: 1 until 0.5 s after the commit, then out (over a second) until the crossing is on the board */
  function runZoom(meetAt: Pt | null): number {
    if (truthAt < 0 || !meetAt) return 1;
    const far = Math.max(Math.abs(meetAt[0]) * u / (w / 2 - 30), Math.abs(meetAt[1]) * u / (h / 2 - 30), 1);
    const k = clamp((api.t - truthAt - 0.5) / 1.0, 0, 1);
    return 1 / (1 + (far - 1) * k);
  }

  function act(a: KonAct): void { ctl.dispatch(a); deps.changed(); }
  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as KonAct | undefined;
    if ((last?.kind === "turn" || last?.kind === "stop") && !refused) api.sfx("slide");
    if (last?.kind === "commit" && refused !== "turn_first" && refused !== "stops_first") { truthAt = api.t; api.sfx("land"); }
    for (const m of ms) {
      if (m.kind === "solved") setTimeout(() => api.sfx("good"), 300);
      if (m.kind === "misconception_consequence" || m.kind === "law_refused" || m.kind === "near_miss") setTimeout(() => api.sfx("look"), 300);
    }
    if (last?.kind === "undo") truthAt = -1;
    api.invalidate(); deps.changed();
  }

  // ── ends geometry (screen space): the track through the centre, the points evenly along it
  const n = p.names?.length ?? 3;
  const track = () => {
    const d = dir(p.start), span = Math.min(w * 0.62, 520), gap = span / (n - 1);
    const pos = (s: number): Pt => [cx + d[0] * s, cy - d[1] * s];
    const sOf = (i: number) => (i - (n - 1) / 2) * gap;
    const edge = Math.min(w / 2 - 18, (w / 2 - 18) / Math.max(0.2, Math.abs(d[0])));
    // the track's normal that points up the screen (letters sit on that side, the tray on the other)
    const up: Pt = d[0] >= 0 ? [-d[1], -d[0]] : [d[1], d[0]];
    return { d, gap, pos, sOf, half: span / 2, edge, up };
  };
  /** where a stop is drawn: on its point, past the track's end (open), or parked in the tray below */
  function stopPos(side: "lo" | "hi", v: number): Pt {
    const T = track();
    if (v >= 0) return T.pos(T.sOf(v));
    if (v === -1) return T.pos((side === "lo" ? -1 : 1) * (T.half + T.gap * 0.6));
    return [side === "lo" ? w * 0.3 : w * 0.7, Math.min(h - 40, cy + 120)];
  }
  function dropStop(side: "lo" | "hi", x: number, y: number): number {
    const T = track(), rx = x - cx, ry = cy - y;
    const s = rx * T.d[0] + ry * T.d[1], off = Math.abs(-rx * T.d[1] + ry * T.d[0]);
    if (off > 56) return -2;
    if (side === "lo" && s < -(T.half + T.gap * 0.35)) return -1;
    if (side === "hi" && s > T.half + T.gap * 0.35) return -1;
    return clamp(Math.round(s / T.gap + (n - 1) / 2), 0, n - 1);
  }

  function pointer(kind: PointerKind, x: number, y: number): void {
    if (st().done) return;
    if (ends) {
      const s0 = st().stops ?? { lo: -2, hi: -2 };
      if (kind === "down") {
        const d = (side: "lo" | "hi") => { const [sx, sy] = stopPos(side, s0[side]); return Math.hypot(x - sx, y - sy); };
        const near = d("lo") <= d("hi") ? "lo" : "hi";
        if (d(near) > 40) return;
        held = near; heldAt = [x, y]; ctl.finger(true); api.sfx("select");
      } else if (kind === "move" && held) heldAt = [x, y];
      else if ((kind === "up" || kind === "cancel") && held) {
        const side = held; held = null; ctl.finger(false);
        const v = dropStop(side, x, y);
        if (v !== s0[side]) act({ kind: "stop", side, at: v });
      }
      api.invalidate(); if (kind !== "move") deps.changed();
      return;
    }
    if (kind === "down") {
      const o = W(...armOrigin());
      if (cross && Math.hypot(x - o[0], y - o[1]) > u * 3.2) return;
      drag = true; ctl.finger(true); shown = headingAt(x, y); api.sfx("select");
    } else if (kind === "move" && drag) shown = headingAt(x, y);
    else if ((kind === "up" || kind === "cancel") && drag) { drag = false; ctl.finger(false); if (shown !== null) act({ kind: "turn", deg: +shown.toFixed(1) }); }
    api.invalidate(); if (kind !== "move") deps.changed();
  }
  const update = () => { /* the arm follows the finger; the run reads api.t */ };
  const busy = () => drag || !!held || (truthAt >= 0 && api.t - truthAt < 1.6);

  // ── draw
  function drawLines(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), cur = drag ? shown : s.heading, piv = pivot();
    const run = truthAt >= 0 && s.heading !== null && !drag;
    const hit = run && lineMeets(p, s.heading!);
    const meetAt = run && !hit && g === "parallel" ? crossing(p, s.heading!) : null;
    zoom = runZoom(meetAt);
    const half = PAGE * u * zoom, [sx, sy] = W(0, 0);
    // the sheet, and its squares (fade 1-2)
    P.stroke(c, [[sx - half, sy - half], [sx + half, sy - half], [sx + half, sy + half], [sx - half, sy + half]], { role: "ink3", width: 1.5, closed: true });
    if (p.grid && zoom > 0.6) for (let k = -PAGE + 1; k < PAGE; k++) {
      P.stroke(c, [W(k, -PAGE), W(k, PAGE)], { role: "ink3", width: 1, alpha: 0.35 });
      P.stroke(c, [W(-PAGE, k), W(PAGE, k)], { role: "ink3", width: 1, alpha: 0.35 });
    }
    const h1 = norm(p.start);
    // line 1: short on the sheet; the run extends it
    if (run) P.stroke(c, longLine([0, 0], h1), { role: "ink", width: 2.5 });
    const e1 = 2.6;
    const [ux, uy] = dir(h1);
    P.stroke(c, [W(-ux * e1, -uy * e1), W(ux * e1, uy * e1)], { role: "ink", width: 4 });
    P.text(c, "1", ...W(ux * (e1 + 0.45), uy * (e1 + 0.45)), { size: 18, weight: 700, role: "ink2" });
    P.circle(c, ...W(0, 0), 5, { role: "ink", fill: true });
    // line 2: across the sheet only (clipped), the knob 3.4 units out along the arm
    if (cur !== null) {
      c.save();
      if (!run) { c.beginPath(); c.rect(sx - half, sy - half, 2 * half, 2 * half); c.clip(); }
      P.stroke(c, longLine(piv, cur), { role: "you", width: run ? 3 : 4 });
      c.restore();
      if (!run) { const k = W(...at(piv, cur, 3.4)); P.circle(c, k[0], k[1], 10, { role: "you", fill: true }); P.text(c, "2", k[0], k[1] - 22, { size: 18, weight: 700, role: "you" }); }
    }
    P.circle(c, ...W(...piv), 6, { role: "you", fill: true });
    const lp = W(piv[0], piv[1]);
    P.text(c, g === "perp" ? "O" : "P", lp[0] - 16, lp[1] + 18, { size: 18, weight: 700, role: "ink2" });
    if (g === "parallel") P.text(c, "O", sx + 16, sy + 18, { size: 16, weight: 700, role: "ink3" });
    api.target("sheet", sx - half, sy - half, 2 * half, 2 * half);
    if (!run) return;
    const k = clamp((api.t - truthAt - 0.4) / 0.4, 0, 1);
    if (g === "perp") {
      // the set-square on the crossing O: one edge along line 1, the corner square; the law's line when it missed
      const side = norm(s.heading! - h1) % 180 < 90 ? 1 : -1;
      const a = W(...at([0, 0], h1, 1.8)), b = W(...at([0, 0], h1 + side * 90, 1.8)), o = W(0, 0);
      c.save(); c.globalAlpha = 0.25 * k; c.beginPath(); c.moveTo(...o); c.lineTo(...a); c.lineTo(...b); c.closePath(); c.fillStyle = P.color(hit ? "good" : "look"); c.fill(); c.restore();
      P.stroke(c, [o, a, b], { role: hit ? "good" : "look", width: 2.5, closed: true, alpha: k });
      if (!hit) P.stroke(c, longLine([0, 0], lineTarget(p)), { role: "ink2", width: 2, dash: [8, 6], alpha: k });
    } else if (hit) {
      // equal gaps at two places along the lines
      for (const t of [-2.6, 2.6]) {
        const q = at([0, 0], h1, t), [nx, ny] = dir(h1 + 90), along = (piv[0] - q[0]) * nx + (piv[1] - q[1]) * ny;
        P.stroke(c, [W(...q), W(q[0] + nx * along, q[1] + ny * along)], { role: "good", width: 2.5, dash: [5, 4], alpha: k });
      }
    } else if (meetAt) {
      const m = W(...meetAt);
      P.circle(c, m[0], m[1], 9, { role: "look", width: 3, alpha: clamp((api.t - truthAt - 1.4) / 0.3, 0, 1) });
    }
    if (hit) P.tick(c, ...W(...at(piv, s.heading!, 2.2)), 18, clamp((api.t - truthAt - 0.6) / 0.3, 0, 1));
    else if (k >= 1) P.chip(c, say(lang, "line.gap", { g: `${Math.round(ldiff(s.heading!, lineTarget(p)))}°` }), cx, Math.min(h - 18, sy + half + 22), { size: 16, role: "look", font: "ui" });
  }

  function drawCross(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), cur = drag ? shown : s.heading;
    const run = truthAt >= 0 && s.heading !== null && !drag, hit = run && lineMeets(p, s.heading!);
    const lam = p.lam ?? 0, x1 = X1(), x2 = X2();
    let meetAt: Pt | null = null;
    if (run && !hit) {
      // canal 1 through X1 along lam, canal 2 through X2 at the child's heading
      const [ax, ay] = dir(lam), [bx, by] = dir(s.heading!), den = ax * by - ay * bx;
      if (Math.abs(den) > 1e-9) { const t = ((x2[0] - x1[0]) * by - (x2[1] - x1[1]) * bx) / den; meetAt = [x1[0] + ax * t, x1[1] + ay * t]; }
    }
    zoom = runZoom(meetAt);
    // the road
    P.stroke(c, longLine([0, 0], p.start), { role: "ink3", width: 10, alpha: 0.5 });
    P.stroke(c, longLine([0, 0], p.start), { role: "ink3", width: 1.5, dash: [10, 8] });
    // canal 1: a stub at X1 (the run opens it all)
    const stub = 2.3;
    P.stroke(c, run ? longLine(x1, lam) : [W(...at(x1, lam, -stub)), W(...at(x1, lam, stub))], { role: "ink", width: 4 });
    P.circle(c, ...W(...x1), 5, { role: "ink", fill: true });
    // ∠1: its arc between road ray t1 and canal ray l1, its number outside the arc on the bisector
    const r1 = roadRay(p, p.t1), c1 = canalRay(p, p.l1), a1 = angle1(p), sg1 = norm(c1 - r1) < 180 ? 1 : -1;
    arcAt(c, x1, u * 0.75, r1, a1, sg1, "ink2", 3);
    const lab1 = W(...at(x1, r1 + sg1 * a1 / 2, 1.95));
    P.text(c, `∠1 ${p.given}°`, lab1[0], lab1[1], { size: 16, weight: 700, font: "mono", role: "ink2" });
    // the canal labels at their right-hand ends
    const tag = (o: Pt, txt: string) => { const q = W(...at(o, lam, stub + 0.45)); P.text(c, txt, q[0], q[1], { size: 16, weight: 700, role: "ink3" }); };
    if (!run) tag(x1, "1");
    // X2's protractor: one scale from road ray t2, opening to ∠2's side
    const r2 = roadRay(p, p.t2), sg2 = crossSign(p), R = u * 1.55, o2 = W(...x2);
    if (!run || zoom > 0.9) {
      const big = p.scale === "landmarks" ? 90 : 30;
      for (let a = 0; a <= 180; a += 10) {
        const hh = norm(r2 + sg2 * a), len = a % 30 === 0 ? 12 : 6, [dx, dy] = dir(hh);
        P.stroke(c, [[o2[0] + dx * R, o2[1] - dy * R], [o2[0] + dx * (R - len), o2[1] - dy * (R - len)]], { role: "ink3", width: a % 30 === 0 ? 2 : 1.2 });
        if (a % big === 0) P.text(c, String(a), o2[0] + dx * (R + 17), o2[1] - dy * (R + 17), { size: 16, weight: 700, font: "mono", role: "ink2" });
      }
      c.save(); c.beginPath(); c.strokeStyle = P.color("ink3"); c.lineWidth = 1.5; c.arc(o2[0], o2[1], R, -rad(r2), -rad(r2 + sg2 * 180), sg2 > 0); c.stroke(); c.restore();
      const l2 = W(...at(x2, r2 + sg2 * 90, 0.62));
      P.text(c, "∠2", l2[0], l2[1], { size: 16, weight: 700, role: "you" });
    }
    // canal 2: the child's arm, the line through X2 both ways
    if (cur !== null) {
      P.stroke(c, run ? longLine(x2, cur) : [W(...at(x2, cur, -2.6)), W(...at(x2, cur, 2.6))], { role: "you", width: run ? 3 : 4 });
      if (!run) { const k = W(...at(x2, cur, 2.2)); P.circle(c, k[0], k[1], 10, { role: "you", fill: true }); }
    }
    P.circle(c, o2[0], o2[1], 6, { role: "ink", fill: true });
    api.target("dial", o2[0] - u * 3, o2[1] - u * 3, u * 6, u * 6);
    if (!run) return;
    if (hit) P.tick(c, ...W(...at(x2, s.heading!, 2.6)), 18, clamp((api.t - truthAt - 0.6) / 0.3, 0, 1));
    else {
      if (meetAt) { const m = W(...meetAt); P.circle(c, m[0], m[1], 9, { role: "look", width: 3, alpha: clamp((api.t - truthAt - 1.4) / 0.3, 0, 1) }); }
      if (api.t - truthAt > 1.6) P.chip(c, say(lang, "line.gap", { g: `${Math.round(ldiff(s.heading!, lineTarget(p)))}°` }), cx, h - 20, { size: 16, role: "look", font: "ui" });
    }
  }

  function arrowHead(c: CanvasRenderingContext2D, tip: Pt, d: Pt, role: string): void {
    const [dx, dy] = d, b: Pt = [tip[0] - dx * 16, tip[1] + dy * 16], nx = -dy * 9, ny = -dx * 9;
    c.save(); c.beginPath(); c.moveTo(...tip); c.lineTo(b[0] + nx, b[1] + ny); c.lineTo(b[0] - nx, b[1] - ny); c.closePath(); c.fillStyle = api.P.color(role as never); c.fill(); c.restore();
  }
  /** a figure (segment / ray / line) on the track from its stops, with dots on stopped ends and arrows on open ones */
  function figure(c: CanvasRenderingContext2D, sp: Stops, role: "you" | "ink2", dy0 = 0, dash?: number[]): void {
    const T = track(), end = (side: -1 | 1, v: number): [number, boolean] => (v >= 0 ? [T.sOf(v), true] : [side * T.edge, false]);
    const [s0, d0] = end(-1, sp.lo), [s1, d1] = end(1, sp.hi);
    const A = T.pos(s0), B = T.pos(s1), off = (q: Pt): Pt => [q[0], q[1] + dy0];
    pa().stroke(c, [off(A), off(B)], { role, width: role === "you" ? 6 : 3, dash });
    for (const [q, stopped, sgn] of [[A, d0, -1], [B, d1, 1]] as const) {
      if (stopped) pa().circle(c, ...off(q), 7, { role, fill: true });
      else arrowHead(c, off(q), [T.d[0] * sgn, T.d[1] * sgn], role);
    }
  }
  const pa = () => api.P;
  function drawEnds(c: CanvasRenderingContext2D): void {
    const Pa = api.P, s = st(), T = track(), sp = s.stops ?? { lo: -2, hi: -2 };
    // the faint track, end to end
    Pa.stroke(c, [T.pos(-T.edge), T.pos(T.edge)], { role: "ink3", width: 2, dash: [3, 7] });
    const placed = sp.lo !== -2 && sp.hi !== -2;
    if (placed) figure(c, sp, "you");
    // the points and their letters (above the track)
    for (let i = 0; i < n; i++) {
      const q = T.pos(T.sOf(i));
      Pa.circle(c, q[0], q[1], 5, { role: "ink", fill: true });
      Pa.text(c, p.names?.[i] ?? "", q[0] + T.up[0] * 30, q[1] + T.up[1] * 30, { size: 20, weight: 700, role: "ink" });
    }
    // the stops: bars across the track (parked ones in the tray below)
    for (const side of ["lo", "hi"] as const) {
      const [x, y] = held === side ? heldAt : stopPos(side, sp[side]);
      const nx = -T.d[1] * 18, ny = -T.d[0] * 18;
      if (held !== side && sp[side] === -1) continue;   // an open end shows as its arrow
      Pa.stroke(c, [[x + nx, y + ny], [x - nx, y - ny]], { role: "you", width: 8 });
      if (sp[side] === -2 && held !== side) Pa.circle(c, x, y, 22, { role: "you", width: 1.5, alpha: 0.5 });
      // each stop carries its number (the ◀ ▶ rows say which stop they move)
      Pa.text(c, side === "lo" ? "1" : "2", x - T.up[0] * 34, y - T.up[1] * 34, { size: 16, weight: 700, role: "you" });
    }
    api.target("track", cx - T.edge, cy - 60, 2 * T.edge, 120);
    if (truthAt < 0 || !placed || held) return;
    // the run: a light along every open end, off the board; a ring at every stop
    const k = (api.t - truthAt) % 1.2 / 1.2, done = s.done;
    for (const [side, v] of [[-1, sp.lo], [1, sp.hi]] as const) {
      if (v === -1) { const q = T.pos(side * (T.half + (T.edge - T.half) * k)); Pa.circle(c, q[0], q[1], 6, { role: "good", fill: true, alpha: 1 - k }); }
      else Pa.circle(c, ...T.pos(T.sOf(v)), 12 + 6 * k, { role: done ? "good" : "ink2", width: 2, alpha: 1 - k });
    }
    if (done) Pa.tick(c, cx, cy + 46, 18, clamp((api.t - truthAt - 0.3) / 0.3, 0, 1));
    else if (api.t - truthAt > 0.6) figure(c, endsTarget(p), "ink2", 44, [7, 6]);
  }

  function draw(c: CanvasRenderingContext2D): void {
    if (lines) drawLines(c); else if (cross) drawCross(c); else drawEnds(c);
  }

  function goal(): string {
    if (g === "parallel") return word(lang, "kon.goal.parallel");
    if (g === "perp") return word(lang, "kon.goal.perp");
    if (cross) return word(lang, "kon.goal.cross", { a: `${p.given}°` });
    const nm = `${p.names?.[p.x ?? 0] ?? ""}${p.names?.[p.y ?? 1] ?? ""}`;
    return word(lang, "kon.goal.ends", { f: word(lang, `kon.fig.${p.fig ?? "seg"}` as WordKey), n: nm });
  }
  // no live readout: the angle between the lines (or the figure's name) is what the child makes
  const readouts = (): Readout[] => [];
  /** ends ◀ ▶: lo walks open ← 0 … n−1, hi walks 0 … n−1 → open; from the tray the first press puts it on the track */
  function stepStop(side: "lo" | "hi", by: -1 | 1): number {
    const seq = side === "lo" ? [-1, ...Array.from({ length: n }, (_, i) => i)] : [...Array.from({ length: n }, (_, i) => i), -1];
    const v = (st().stops ?? { lo: -2, hi: -2 })[side];
    if (v === -2) return by < 0 ? seq[side === "lo" ? 0 : n - 1] : seq[side === "lo" ? 1 : n];
    return seq[clamp(seq.indexOf(v) + by, 0, seq.length - 1)];
  }
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    const go: ControlSpec[] = [
      { id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) },
    ];
    if (ends) {
      const sp = s.stops ?? { lo: -2, hi: -2 }, ready = sp.lo !== -2 && sp.hi !== -2;
      const mv = (side: "lo" | "hi", by: -1 | 1, label: string, aria: string): ControlSpec => ({ id: `${side}-${by < 0 ? "left" : "right"}`, label, aria, kind: "pad", group: side,
        onPress: () => { const v = stepStop(side, by); if (v !== sp[side]) act({ kind: "stop", side, at: v }); } });
      return [mv("lo", -1, "◀ 1", "first stop left"), mv("lo", 1, "1 ▶", "first stop right"), mv("hi", -1, "◀ 2", "second stop left"), mv("hi", 1, "2 ▶", "second stop right"),
        ...go, { id: "commit", label: say(lang, "line.here"), kind: "primary", group: "go", you: ready, disabled: !ready, onPress: () => act({ kind: "commit" }) }];
    }
    const cur = s.heading;
    return [
      { id: "nudge-left", label: "↺", aria: "turn anticlockwise a little", kind: "pad", group: "nudge", disabled: cur === null, onPress: () => cur !== null && act({ kind: "turn", deg: norm(cur + 1) }) },
      { id: "nudge-right", label: "↻", aria: "turn clockwise a little", kind: "pad", group: "nudge", disabled: cur === null, onPress: () => cur !== null && act({ kind: "turn", deg: norm(cur - 1) }) },
      ...go, { id: "commit", label: say(lang, "line.here"), kind: "primary", group: "go", you: cur !== null, disabled: cur === null, onPress: () => act({ kind: "commit" }) },
    ];
  }
  return { layout, update, draw, pointer, busy, goal, readouts, controls, react, dragging: () => drag || !!held };
}
