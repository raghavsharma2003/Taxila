// Darpan · the 2D view (round 7). One view, two worlds:
//   mirror  the figure (a rangoli, a kite, a tile, a star) drawn big. A finger pressed on the figure lays a mirror line
//           through its centre, turning with the finger and snapping to the places a fold can run (a corner or the middle of
//           a side); lifted, the line is laid (pressed again on a laid line, it is lifted). Fade 1 shows those places as
//           small dots. "Fold" flips the figure over each line in turn: a line where it lands on itself turns good, a
//           line where a flap sticks out shows the flap and a magnifier. Nothing says which lines are missing.
//   turn    the figure on a turntable over its own dashed trace; the dial buttons turn it (15° steps, or 1° on a degree
//           dial) and it turns live. Smallest: "Spin" turns it from the start by the dial's turn. Order: "Mark" pins the
//           present stop on the dial's rim; "Spin" turns it once round, stopping at each mark.
// Nothing moves on a clock: the law answers at once on the go and the world catches up (reduced motion: no animation).
import type { DarpanAct, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import type { Role } from "../../core/styles.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import {
  foldsOf, lineGap, mirrorWorld, reflectPt, turnFigure, turnPt, unitOf, type DarpanParams, type DarpanState, type MirrorP, type Piece, type TurnP, type V,
} from "./darpan.logic.ts";

const FOLD_TIME = 0.9;    // s per fold line (cosmetic: the law has already answered)
const SPIN_SPEED = 160;   // degrees / s
const STOP_TIME = 0.35;   // order: the pause at each mark, s
const KIND_ROLE: Record<number, Role> = { 0: "q3", 1: "q1", 2: "q2", 3: "q4" };
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

export const makeDarpanView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<DarpanParams, DarpanState, DarpanAct>;
  const { level, ctl, lang } = deps;
  const p = level.params;
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const st = () => ctl.state;
  const fs = () => (api.young ? 16 : 14);
  const mw = p.goal === "lines" ? mirrorWorld(p) : null;
  const fig: Piece[] = mw ? mw.fig : turnFigure(p as TurnP);
  const reach = Math.max(...fig.flatMap((pc) => pc.pts.map((q) => Math.hypot(q[0], q[1]))));
  let w = 320, h = 420, cx = 160, cy = 220, sc = 20;
  /** the last go's animation (mirror: folds in turn; turn: the spin) */
  let anim: { t0: number; dur: number; folds: boolean[]; angle: number; marks: number[] } | null = null;
  let ghost: number | null = null, held = false;
  const act = (a: DarpanAct) => { ctl.dispatch(a); deps.changed(); };
  const animK = () => (anim ? (api.reduced ? 1 : clamp((api.t - anim.t0) / anim.dur, 0, 1)) : 1);
  const shown = () => st().ended && animK() >= 1;
  const busy = () => !!anim && animK() < 1;

  // ───────────────────────────── layout ─────────────────────────────
  function layout(bw: number, bh: number): void {
    w = bw; h = bh;
    const f = fs(), top = 10, bottom = 10, side = 12;
    // turn: the dial's rim sits outside the figure; mirror: the lines run a little past it
    const R = Math.min((w - 2 * side) / 2, (h - top - bottom) / 2);
    sc = Math.max(4, (R - (p.goal === "lines" ? f * 0.8 : f * 1.6 + 8)) / (reach * (p.goal === "lines" ? 1.12 : 1.08)));
    cx = w / 2; cy = top + (h - top - bottom) / 2;
  }
  const XY = (q: V): [number, number] => [cx + q[0] * sc, cy - q[1] * sc];

  // ───────────────────────────── input (mirror) ─────────────────────────────
  function snap(x: number, y: number): number | null {
    if (!mw || Math.hypot(x - cx, y - cy) < 14) return null;
    const a = Math.atan2(cy - y, x - cx) * 180 / Math.PI;
    let best = 0;
    mw.cands.forEach((c, i) => { if (lineGap(c, a) < lineGap(mw.cands[best], a)) best = i; });
    return best;
  }
  function pointer(kind: PointerKind, x: number, y: number): void {
    if (!mw || st().done || busy()) { held = false; ghost = null; return; }
    if (kind === "down") { if (api.hit(x, y) !== "map") return; held = true; }
    if (!held) return;
    if (kind === "down" || kind === "move") { ghost = snap(x, y); api.invalidate(); return; }
    if (kind === "up" && ghost !== null) { const i = ghost; ghost = null; held = false; act({ kind: "line", deg: Math.round(mw.cands[i] * 10) / 10 }); return; }
    held = false; ghost = null; api.invalidate();
  }
  const dragging = () => held;

  // ───────────────────────────── the law answered ─────────────────────────────
  function react(_ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as DarpanAct | undefined;
    if (!last) return;
    const s = st();
    if (refused && refused !== "missed") { api.sfx("refuse"); api.fx.shake(2); }
    else if (last.kind === "run") {
      api.sfx("slide");
      const folds = foldsOf(p, s);
      if (p.goal === "lines") anim = { t0: api.t, dur: FOLD_TIME * Math.max(1, s.lines.length), folds, angle: 0, marks: [] };
      else if (p.goal === "smallest") anim = { t0: api.t, dur: Math.max(0.6, s.angle / SPIN_SPEED), folds, angle: s.angle, marks: [] };
      else anim = { t0: api.t, dur: 360 / SPIN_SPEED + STOP_TIME * s.marks.length, folds, angle: 360, marks: [...s.marks] };
    } else if (last.kind === "undo") { api.sfx("tap"); anim = null; }
    else { api.sfx(last.kind === "mark" ? "land" : "tap"); anim = null; }
    api.invalidate(); deps.changed();
  }
  let landedOnce = false;
  function update(_dt: number): void {
    if (!anim) return;
    if (animK() < 1) { api.invalidate(); landedOnce = false; return; }
    if (!landedOnce && st().ended) {
      landedOnce = true;
      if (st().done) { api.sfx("good"); api.fx.burst(cx, cy, { n: 18, color: api.P.color("good"), speed: 110, life: 0.7, size: 3, kind: "spark" }); }
      else api.sfx("look");
      deps.changed(); api.invalidate();
    }
  }

  // ───────────────────────────── drawings ─────────────────────────────
  function poly(c: CanvasRenderingContext2D, pts: [number, number][], role: Role, alpha: number): void {
    c.save(); c.globalAlpha = alpha; c.fillStyle = api.P.color(role); c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill(); c.restore();
  }
  /** the figure through a move (identity, a part fold, a turn), filled, or as an outline only */
  function drawFig(c: CanvasRenderingContext2D, move: (q: V) => V, o: { fill: boolean; role?: Role; alpha?: number; dash?: number[]; width?: number }): void {
    for (const pc of fig) {
      const pts = pc.pts.map((q) => XY(move(q)));
      const role = o.role ?? KIND_ROLE[pc.kind] ?? "q1";
      if (o.fill) poly(c, pts, role, (o.alpha ?? 1) * (pc.kind === 0 ? 0.32 : 0.95));
      api.P.stroke(c, pts, { role: o.fill && pc.kind === 0 ? "q3" : role, width: o.width ?? (pc.kind === 0 ? 3 : 1.6), closed: true, alpha: o.alpha ?? 1, ...(o.dash ? { dash: o.dash } : {}) });
    }
  }
  /** a mirror line across the figure at angle a (degrees) */
  function lineAt(c: CanvasRenderingContext2D, a: number, role: Role, o: { width?: number; dash?: number[]; alpha?: number } = {}): void {
    const L = reach * 1.12, u: V = [Math.cos(a * Math.PI / 180), Math.sin(a * Math.PI / 180)];
    api.P.stroke(c, [XY([-u[0] * L, -u[1] * L]), XY([u[0] * L, u[1] * L])], { role, width: o.width ?? 3, ...(o.dash ? { dash: o.dash } : {}), alpha: o.alpha ?? 1 });
  }

  // ───────────────────────────── mirror ─────────────────────────────
  function drawMirror(c: CanvasRenderingContext2D, mp: MirrorP): void {
    const P = api.P, s = st(), end = shown(), k = animK(), wm = mw!;
    const box = reach * sc * 1.12;
    P.body(c, cx - box - 6, cy - box - 6, 2 * box + 12, 2 * box + 12, { role: "panel", r: 10 });
    if (!s.done && !busy()) api.target("map", cx - box, cy - box, 2 * box, 2 * box);
    drawFig(c, (q) => q, { fill: true });
    // fade 1: the places a fold can run through (the outline's corners and side-middles)
    if (mp.labels === 1 && !s.ended) {
      const o = fig[0].pts;
      for (let i = 0; i < o.length; i++) {
        const q = o[i], r = o[(i + 1) % o.length];
        for (const m of [q, [(q[0] + r[0]) / 2, (q[1] + r[1]) / 2] as V]) { const [x, y] = XY(m); P.circle(c, x, y, 3, { role: "ink2", fill: true }); }
      }
    }
    // the folds of the last go, one line after another
    const running = anim && s.ended && k < 1;
    s.lines.forEach((li, j) => {
      const a = wm.cands[li];
      const folded = anim?.folds[j];
      if (running) {
        const n = s.lines.length, u = k * n - j;
        if (u > 0 && u < 1) {
          // the figure flips over the line: its across-the-line part shrinks through zero to the mirror image
          const t = Math.min(1, u * 1.25), k2 = Math.cos(Math.PI * t);
          drawFig(c, (q) => { const r = reflectPt(q, a), m: V = [(q[0] + r[0]) / 2, (q[1] + r[1]) / 2]; return [m[0] + (q[0] - m[0]) * k2, m[1] + (q[1] - m[1]) * k2]; }, { fill: false, role: "you", width: 2.5, alpha: 0.9 });
        }
        lineAt(c, a, u >= 1 ? (folded ? "good" : "look") : "you", { width: 3.2 });
        return;
      }
      if (end && s.ended && folded === false) drawFig(c, (q) => reflectPt(q, a), { fill: false, role: "look", width: 2.5, dash: [6, 5] });
      lineAt(c, a, end && s.ended ? (folded ? "good" : "look") : "you", { width: 3.2, dash: end && s.ended ? undefined : [10, 6] });
    });
    if (ghost !== null && held) lineAt(c, wm.cands[ghost], "you", { width: 2.5, alpha: 0.6, dash: [4, 6] });
    P.circle(c, cx, cy, 4.5, { role: "ink", fill: true });
    if (end && s.ended) {
      const m = Math.min(28, sc * 1.4), x = cx + box - m * 0.6, y = cy - box + m * 0.6;
      if (s.done) P.tick(c, x, y, m, 1); else P.magnifier(c, x, y, m);
    }
  }

  // ───────────────────────────── turn ─────────────────────────────
  /** the dial's angle to a point on a circle of radius r (0 at the top, clockwise) */
  const rim = (deg: number, r: number): [number, number] => [cx + r * Math.sin(deg * Math.PI / 180), cy - r * Math.cos(deg * Math.PI / 180)];
  function drawTurn(c: CanvasRenderingContext2D, tp: TurnP): void {
    const P = api.P, s = st(), end = shown(), k = animK(), f = fs();
    const R = reach * sc * 1.08 + 6, Rd = R + f * 0.6;
    // the turntable: a faint disc (the ground shows through, so the dashed trace and the ticks keep their contrast)
    P.circle(c, cx, cy, Rd + f * 0.7, { role: "panel", fill: true, alpha: 0.3 });
    P.circle(c, cx, cy, Rd, { role: "ink2", width: 1.5, alpha: 0.7 });
    for (let d = 0; d < 360; d += 15) {
      const long = d % 90 === 0, a = rim(d, Rd - (long ? 9 : 5)), b = rim(d, Rd);
      P.stroke(c, [a, b], { role: "ink2", width: long ? 2 : 1.2, alpha: long ? 0.9 : 0.6 });
    }
    // the trace: where the figure started (it never moves)
    drawFig(c, (q) => q, { fill: false, role: "ink2", width: 1.6, dash: [5, 5], alpha: 0.8 });
    // the figure: turned live by the dial, or spinning on the go
    let shownAngle = s.angle;
    if (anim && s.ended && k < 1) {
      if (tp.goal === "smallest") shownAngle = anim.angle * k;
      else {
        // once round, pausing at each mark
        const T = anim.dur * k;
        let acc = 0, ang = 0;
        for (const m of [...anim.marks.filter((x) => x > 0), 360]) {
          const seg = (m - ang) / SPIN_SPEED;
          if (T < acc + seg) { ang = ang + (T - acc) * SPIN_SPEED; acc = -1; break; }
          acc += seg; ang = m;
          if (m < 360) { if (T < acc + STOP_TIME) { acc = -1; break; } acc += STOP_TIME; }
        }
        shownAngle = acc === -1 ? ang : 360;
      }
    } else if (anim && s.ended && tp.goal === "order") shownAngle = 360;
    else if (anim && s.ended) shownAngle = anim.angle;
    drawFig(c, (q) => turnPt(q, shownAngle), { fill: true });
    P.circle(c, cx, cy, Math.max(5, sc * 0.5), { role: "ink2", fill: true });
    P.circle(c, cx, cy, Math.max(2, sc * 0.2), { role: "panel", fill: true });
    // the start and the pointer on the rim
    const [sx, sy] = rim(0, Rd + f * 0.35);
    P.circle(c, sx, sy, 3.5, { role: "ink2", fill: true });
    const [px, py] = rim(shownAngle, Rd - 2), [qx, qy] = rim(shownAngle - 5, Rd + f * 0.55), [rx, ry] = rim(shownAngle + 5, Rd + f * 0.55);
    c.save(); c.fillStyle = P.color("you"); c.beginPath(); c.moveTo(px, py); c.lineTo(qx, qy); c.lineTo(rx, ry); c.closePath(); c.fill(); c.restore();
    // the marks (order): pinned on the rim; after the spin, good where it landed and look where it did not
    if (tp.goal === "order") s.marks.forEach((m, j) => {
      const [mx, my] = rim(m, Rd);
      const role: Role = end && s.ended ? (anim?.folds[j] ? "good" : "look") : "you";
      P.circle(c, mx, my, 6, { role, fill: true });
      P.circle(c, mx, my, 6, { role: "panel", width: 1.5 });
    });
    if (end && s.ended) {
      const m = Math.min(28, Rd * 0.25), x = cx + Rd * 0.78, y = cy - Rd * 0.78;
      if (s.done) P.tick(c, x, y, m, 1); else P.magnifier(c, x, y, m);
    }
  }

  function draw(c: CanvasRenderingContext2D): void {
    if (p.goal === "lines") drawMirror(c, p); else drawTurn(c, p);
  }

  // ───────────────────────────── chrome ─────────────────────────────
  /** a turn as the dial shows it: degrees on a degree dial, else a fraction of a full turn */
  function turnText(a: number): string {
    const tp = p as TurnP;
    if (tp.fine) return `${a}°`;
    if (a === 0) return "0";
    const g = gcd(a, 360);
    return a === 360 ? W("darpan.full") : `${a / g}/${360 / g}`;
  }
  function goal(): string {
    const s = st();
    if (s.ended && !s.done && shown()) {
      if (p.goal === "lines") { const all = (anim?.folds ?? []).every(Boolean); return W(all ? "darpan.again.more" : "darpan.again.flap"); }
      if (p.goal === "smallest") return W(anim?.folds[0] ? "darpan.again.smaller" : "darpan.again.turn");
      return W("darpan.again.marks");
    }
    if (p.goal === "lines") return W("darpan.goal.lines");
    if (p.goal === "smallest") return W(p.fine ? "darpan.goal.angle" : "darpan.goal.smallest");
    return W("darpan.goal.order");
  }
  // the dial's turn only (the instrument); never the count of lines or marks
  const readouts = (): Readout[] => (p.goal === "lines" ? [] : [{ k: W("darpan.turn"), v: turnText(st().angle) }]);
  function controls(): ControlSpec[] {
    const s = st();
    if (s.done) return [];
    const out: ControlSpec[] = [];
    const ready = (p.goal === "lines" ? s.lines.length > 0 : p.goal === "smallest" ? s.angle > 0 : s.marks.length > 0) && !s.ended && !busy();
    if (p.goal !== "lines") {
      const u = unitOf(p), steps = u === 1 ? [-15, -1, 1, 15] : [-15, 15];
      for (const by of steps) {
        const to = s.angle + by;
        const lab = u === 1 ? `${by > 0 ? "+" : "−"}${Math.abs(by)}°` : by > 0 ? "↻" : "↺";
        out.push({ id: `turn${by > 0 ? "p" : "m"}${Math.abs(by)}`, label: lab, aria: `turn ${by > 0 ? "on" : "back"} ${Math.abs(by)} degrees`, kind: "pad", group: "pad", disabled: busy() || to < 0 || to > 360, onPress: () => act({ kind: "turn", by }) });
      }
      if (p.goal === "order") {
        const on = s.marks.includes(s.angle);
        out.push({ id: "mark", label: W(on ? "darpan.unmark" : "darpan.mark"), aria: on ? "take the mark off this stop" : "mark this stop", kind: "secondary", group: "mark", pressed: on, disabled: busy() || (!on && s.marks.length >= 24), onPress: () => act({ kind: "mark" }) });
      }
    }
    out.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", disabled: busy() || s.depth === 0, onPress: () => act({ kind: "undo" }) });
    out.push({ id: "run", label: W(p.goal === "lines" ? "darpan.fold" : "darpan.spin"), aria: "go: the figure answers", kind: "primary", group: "go", you: ready, disabled: !ready, onPress: () => act({ kind: "run" }) });
    return out;
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, dragging, goal, readouts, controls, react };
  return view;
};
