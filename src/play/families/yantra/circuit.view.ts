// Yantra · circuit · the 2D view (round 7 E6). A board of parts in a 2×3 grid (3×2 when wide): a cell lying on its side
// (+ cap, − flat end, both labelled), a torch bulb on a holder with two screw terminals, a lever switch on a base, and
// sometimes a stray part (a metal clip or a rubber eraser). At fade 3 on the switch goal the parts are drawn as circuit
// symbols. The child drags from one terminal to another to lay a wire (a sagging copper lead), taps a wire's knot to cut
// it and taps the switch to flip it. No live glow and no snapping: nothing on the board says whether it will work until
// RUN. After a run the law's answer stays on the board until the board changes: a glowing bulb with current shown as dots
// moving one way, + → bulb → −, at one speed and one spacing all round the loop (never "less after the bulb"); or a short
// (the cell's leads flash), or a magnifier where the loop is open / on a switch that is open, out of the path or before
// the bulb.
import type { Moment, YantraAct } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { withAlpha } from "../../core/styles.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import { currentLoop, partOf, TERMS, wireEnds, type CircuitParams, type CircuitPart, type CircuitState } from "./circuit.logic.ts";

type Pt = [number, number];
const SPEED = 70;          // px / s, the current's dots (the same everywhere on the loop)
const GAP = 22;            // px between dots (the same everywhere on the loop)
const SHOW_S = 10;         // s of moving dots after a glowing run, then they hold still

export const makeCircuitView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<CircuitParams, CircuitState, YantraAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, sym = p.sym;
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const st = () => ctl.state;
  const sw = p.parts.find((x) => x.kind === "switch") ?? null;
  let w = 300, h = 440, cols = 2, cellW = 150, cellH = 124, top = 34, dx = 48, bodyH = 30;
  const centre = new Map<CircuitPart, Pt>();
  const pos = new Map<string, Pt>();
  let dragFrom: string | null = null, finger: Pt = [0, 0], pressWire: string | null = null, pressSw = false;
  let ranAt = -1;

  function layout(bw: number, bh: number): void {
    w = bw; h = bh;
    cols = w > h * 0.9 ? 3 : 2;
    const rows = 6 / cols;
    top = 34;
    cellW = w / cols; cellH = (h - top - 34) / rows;
    dx = clamp(cellW / 2 - 26, 40, 90);
    bodyH = clamp(cellH * 0.26, 22, 40);
    centre.clear(); pos.clear();
    for (const part of p.parts) {
      const cx = cellW * (part.slot % cols) + cellW / 2, cy = top + cellH * Math.floor(part.slot / cols) + cellH * 0.48;
      centre.set(part, [cx, cy]);
      const [t0, t1] = TERMS[part.kind], [l, r] = part.flip ? [t1, t0] : [t0, t1];
      pos.set(l, [cx - dx, cy]); pos.set(r, [cx + dx, cy]);
    }
  }
  const P = () => api.P;
  const at = (t: string): Pt => pos.get(t) ?? [0, 0];
  const act = (a: YantraAct) => { ctl.dispatch(a); deps.changed(); };
  /** the board the last run judged is still the board on screen */
  function showing(): boolean {
    const s = st(), l = s.last;
    return !!l && l.sw === s.sw && l.wires.length === s.wires.length && l.wires.every((k) => s.wires.includes(k));
  }

  // ── wires: a sagging lead from a to b (sampled), its knot at the middle is the cut target
  function wirePts(k: string, i: number): Pt[] {
    const [a, b] = wireEnds(k), A = at(a), B = at(b);
    const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, d = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1;
    let nx = -(B[1] - A[1]) / d, ny = (B[0] - A[0]) / d;
    if (ny < 0 || (ny === 0 && nx < 0)) { nx = -nx; ny = -ny; }
    const sag = (16 + 0.14 * d) * (1 + 0.3 * (i % 3));
    const C: Pt = [mx + nx * sag, my + ny * sag];
    const out: Pt[] = [];
    for (let j = 0; j <= 18; j++) { const t = j / 18, u = 1 - t; out.push([u * u * A[0] + 2 * u * t * C[0] + t * t * B[0], u * u * A[1] + 2 * u * t * C[1] + t * t * B[1]]); }
    return out;
  }
  /** the route of the current inside a part, from terminal u to terminal v */
  function inside(u: string, v: string): Pt[] {
    const part = partOf(p, u), c = part ? centre.get(part) : undefined;
    if (part?.kind === "bulb" && c) { const g = glass(c); return [at(u), [c[0] + (at(u)[0] < c[0] ? -6 : 6), c[1]], [c[0], g[1] + g[2] * 0.2], [c[0] + (at(v)[0] < c[0] ? -6 : 6), c[1]], at(v)]; }
    return [at(u), at(v)];
  }
  /** the closed loop as a polyline: + → … → bulb → … → −, then through the cell back to + */
  function loopPolyline(): Pt[] | null {
    const s = st(), loop = currentLoop(p, s.wires, s.sw);
    if (!loop) return null;
    const pts: Pt[] = [];
    for (let i = 0; i + 1 < loop.length; i++) {
      const u = loop[i], v = loop[i + 1], k = s.wires.indexOf(u < v ? `${u}|${v}` : `${v}|${u}`);
      const seg = partOf(p, u) === partOf(p, v) && (k < 0 || partOf(p, u)?.kind === "bulb") ? inside(u, v) : (() => { const q = wirePts(s.wires[k], k); return wireEnds(s.wires[k])[0] === u ? q : [...q].reverse(); })();
      pts.push(...(pts.length ? seg.slice(1) : seg));
    }
    pts.push(at("c+"));
    return pts;
  }

  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as YantraAct | undefined;
    if (last?.kind === "wire" || last?.kind === "unwire") api.sfx(refused ? "refuse" : last.kind === "wire" ? "tap" : "crack");
    if (last?.kind === "toggle") api.sfx(refused ? "refuse" : "open");
    if (last?.kind === "undo") api.sfx("tap");
    if (last?.kind === "run") {
      if (refused === "wire_first") api.sfx("refuse");
      else ranAt = api.t;
      if (refused === "short") { api.sfx("refuse"); api.fx.shake(4); api.fx.flash(P().color("look"), 0.12); }
    }
    for (const m of ms) {
      if (m.kind === "solved") {
        api.sfx("good");
        const b = p.parts.find((x) => x.kind === "bulb"), c = b ? centre.get(b) : undefined;
        if (c) { const g = glass(c); api.fx.burst(g[0], g[1], { n: 14, color: P().material("glow"), speed: 90, life: 0.6, size: 3, kind: "spark" }); }
      }
      if (m.kind === "misconception_consequence" || m.kind === "law_refused" || m.kind === "near_miss") api.sfx("look");
    }
    api.invalidate(); deps.changed();
  }
  function pointer(kind: PointerKind, x: number, y: number): void {
    if (st().done) return;
    if (kind === "down") {
      const id = api.hit(x, y);
      if (id?.startsWith("t:")) { dragFrom = id.slice(2); finger = [x, y]; ctl.finger(true); api.sfx("select"); }
      else if (id?.startsWith("w:")) pressWire = id.slice(2);
      else if (id === "sw") pressSw = true;
      api.invalidate();
      return;
    }
    if (kind === "move") { if (dragFrom) { finger = [x, y]; api.invalidate(); } return; }
    const id = kind === "up" ? api.hit(x, y) : null;
    if (dragFrom) {
      const from = dragFrom; dragFrom = null; ctl.finger(false);
      if (id?.startsWith("t:") && id.slice(2) !== from) { const [a, b] = [from, id.slice(2)]; act({ kind: "wire", a, b }); }
    } else if (pressWire) {
      if (id === `w:${pressWire}`) { const [a, b] = wireEnds(pressWire); act({ kind: "unwire", a, b }); }
    } else if (pressSw && id === "sw") act({ kind: "toggle", id: "s" });
    pressWire = null; pressSw = false;
    api.invalidate(); deps.changed();
  }
  const update = () => { /* the dots are a pure function of api.t */ };
  const glowing = () => st().done;
  const busy = () => !!dragFrom || (glowing() && !api.reduced && api.t - ranAt < SHOW_S) || (ranAt >= 0 && api.t - ranAt < 0.6);

  // ── parts
  /** the bulb's glass: centre x, centre y, radius */
  function glass(c: Pt): [number, number, number] { const r = clamp(bodyH * 0.75, 15, 26); return [c[0], c[1] - r - 6, r]; }
  function drawCell(c: CanvasRenderingContext2D, part: CircuitPart, [cx, cy]: Pt): void {
    const Pp = P(), plus = at("c+"), minus = at("c-"), plusRight = plus[0] > cx;
    if (sym) {
      // the symbol: the long thin line is +, the short thick line is −
      const gx = 7, lx = cx + (plusRight ? gx : -gx), sx = cx + (plusRight ? -gx : gx);
      Pp.stroke(c, [plus, [lx, cy]], { role: "ink2", width: 3 }); Pp.stroke(c, [minus, [sx, cy]], { role: "ink2", width: 3 });
      Pp.stroke(c, [[lx, cy - bodyH * 0.8], [lx, cy + bodyH * 0.8]], { role: "ink", width: 2.5 });
      Pp.stroke(c, [[sx, cy - bodyH * 0.4], [sx, cy + bodyH * 0.4]], { role: "ink", width: 6 });
    } else {
      const x0 = cx - dx + 16, x1 = cx + dx - 16, nub = 7;
      Pp.stroke(c, [plus, [plusRight ? x1 + nub : x0 - nub, cy]], { role: "ink2", width: 3 });
      Pp.stroke(c, [minus, [plusRight ? x0 : x1, cy]], { role: "ink2", width: 3 });
      Pp.body(c, x0, cy - bodyH / 2, x1 - x0, bodyH, { role: "q1", r: bodyH * 0.3, seed: 7 });
      // the + cap: a small metal nub on the + end
      Pp.body(c, plusRight ? x1 : x0 - nub, cy - bodyH * 0.22, nub, bodyH * 0.44, { role: "ink3", r: 2, seed: 9 });
    }
    Pp.text(c, "+", plus[0], plus[1] - 26, { size: 20, weight: 800, role: "ink" });
    Pp.text(c, "−", minus[0], minus[1] - 26, { size: 20, weight: 800, role: "ink" });
    void part;
  }
  function drawBulb(c: CanvasRenderingContext2D, [cx, cy]: Pt): void {
    const Pp = P(), [gx, gy, r] = glass([cx, cy]), lit = glowing() && showing();
    const [L, R] = [at("b1"), at("b2")].sort((a, b) => a[0] - b[0]);
    if (lit) {
      const halo = c.createRadialGradient(gx, gy, r * 0.3, gx, gy, r * 2.6);
      halo.addColorStop(0, withAlpha(Pp.material("glow"), 0.75)); halo.addColorStop(1, withAlpha(Pp.material("glow"), 0));
      c.save(); c.fillStyle = halo; c.beginPath(); c.arc(gx, gy, r * 2.6, 0, Math.PI * 2); c.fill(); c.restore();
    }
    // leads from the screw terminals up into the glass, joined by the filament
    Pp.stroke(c, [L, [cx - 6, cy], [cx - 6, gy + r * 0.2]], { role: "ink2", width: 2.5 });
    Pp.stroke(c, [R, [cx + 6, cy], [cx + 6, gy + r * 0.2]], { role: "ink2", width: 2.5 });
    const coil: Pt[] = [];
    for (let j = 0; j <= 8; j++) coil.push([cx - 6 + (12 * j) / 8, gy + r * 0.2 - (j % 2 ? 5 : 0)]);
    if (lit) { c.save(); c.strokeStyle = Pp.material("glow"); c.lineWidth = 3; c.beginPath(); coil.forEach(([x, y], j) => (j ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); c.restore(); }
    else Pp.stroke(c, coil, { role: "ink2", width: 1.5 });
    if (sym) {
      Pp.circle(c, gx, gy, r, { role: "ink", width: 2.5 });
    } else {
      Pp.circle(c, gx, gy, r, { role: "ink2", width: 2, alpha: 0.9 });
      Pp.body(c, cx - 12, gy + r - 2, 24, 10, { role: "ink3", r: 2, seed: 4 });
      Pp.body(c, cx - dx + 14, cy + 6, 2 * dx - 28, 12, { role: "panel", r: 4, seed: 5 });
    }
  }
  function drawSwitch(c: CanvasRenderingContext2D, [cx, cy]: Pt): void {
    const Pp = P(), closed = st().sw;
    const [L, R] = [at("s1"), at("s2")].sort((a, b) => a[0] - b[0]);
    const pivot: Pt = [L[0] + 16, cy], contact: Pt = [R[0] - 16, cy], len = contact[0] - pivot[0];
    api.target("sw", pivot[0] - 6, cy - bodyH - 14, len + 12, bodyH + 28);
    if (!sym) Pp.body(c, L[0] + 6, cy + 4, R[0] - L[0] - 12, 12, { role: "panel", r: 4, seed: 6 });
    Pp.stroke(c, [L, pivot], { role: "ink2", width: 3 }); Pp.stroke(c, [contact, R], { role: "ink2", width: 3 });
    Pp.circle(c, pivot[0], pivot[1], 4, { role: "ink", fill: true });
    Pp.circle(c, contact[0], contact[1], 4, { role: "ink", fill: !sym });
    const ang = closed ? 0 : -0.55, tip: Pt = [pivot[0] + Math.cos(ang) * len, pivot[1] + Math.sin(ang) * len];
    Pp.stroke(c, [pivot, tip], { role: "q3", width: sym ? 3 : 5 });
    if (!sym) Pp.circle(c, tip[0], tip[1], 5, { role: "q3", fill: true });
  }
  function drawStray(c: CanvasRenderingContext2D, part: CircuitPart, [cx, cy]: Pt): void {
    const Pp = P(), [L, R] = [at("x1"), at("x2")].sort((a, b) => a[0] - b[0]);
    if (part.kind === "clip") {
      const a = L[0] + 14, b = R[0] - 14, hh = bodyH * 0.35;
      Pp.stroke(c, [L, [a, cy]], { role: "ink2", width: 3 }); Pp.stroke(c, [[b, cy], R], { role: "ink2", width: 3 });
      c.save(); c.strokeStyle = Pp.material("steel"); c.lineWidth = 3; c.lineJoin = "round";
      c.beginPath(); c.moveTo(a, cy); c.lineTo(b - hh, cy - hh); c.arc(b - hh, cy, hh, -Math.PI / 2, Math.PI / 2); c.lineTo(a + hh, cy + hh); c.arc(a + hh, cy, hh * 0.7, Math.PI / 2, -Math.PI / 2); c.lineTo(b - hh * 1.6, cy - hh * 0.7);
      c.stroke(); c.restore();
    } else {
      Pp.stroke(c, [L, [L[0] + 14, cy]], { role: "ink2", width: 3 }); Pp.stroke(c, [[R[0] - 14, cy], R], { role: "ink2", width: 3 });
      Pp.body(c, L[0] + 14, cy - bodyH / 2, R[0] - L[0] - 28, bodyH, { role: "q3", r: 6, seed: 8 });
    }
  }
  const NAMES: Record<string, string> = { cell: "cell", bulb: "bulb", switch: "switch", clip: "clip", eraser: "eraser" };

  function draw(c: CanvasRenderingContext2D): void {
    const Pp = P(), s = st(), shown = showing(), why = shown ? s.last?.why ?? null : null;
    Pp.textFit(c, W(`yantra.circuit.ctx.${p.ctx}`), w / 2, 16, w - 24, 24, { size: 16, role: "ink2", weight: 700 });
    for (const part of p.parts) {
      const cc = centre.get(part) as Pt;
      if (part.kind === "cell") drawCell(c, part, cc);
      else if (part.kind === "bulb") drawBulb(c, cc);
      else if (part.kind === "switch") drawSwitch(c, cc);
      else drawStray(c, part, cc);
      Pp.textFit(c, W(`yantra.circuit.part.${NAMES[part.kind]}`), cc[0], cc[1] + bodyH / 2 + 30, cellW - 10, 20, { size: 15, role: "ink2", weight: 700 });
    }
    // the wires, then their knots (cut targets)
    const knots: [string, Pt][] = [];
    s.wires.forEach((k, i) => {
      const q = wirePts(k, i);
      const shortLead = why === "short" && wireEnds(k).some((t) => t === "c+" || t === "c-");
      Pp.stroke(c, q, { role: shortLead ? "look" : "q2", width: 4, seed: i + 1 });
      knots.push([k, q[9]]);
    });
    if (!s.done) for (const [k, m] of knots) { Pp.circle(c, m[0], m[1], 6, { role: "q2", fill: true }); api.target(`w:${k}`, m[0] - 22, m[1] - 22, 44, 44); }
    // the rubber band of a wire being drawn
    if (dragFrom) Pp.stroke(c, [at(dragFrom), finger], { role: "you", width: 3, dash: [7, 5] });
    // the terminals (screw posts): drawn and registered last, so they win the touch
    const over = dragFrom ? api.hit(finger[0], finger[1]) : null;
    for (const [t, q] of pos) {
      c.save(); c.fillStyle = Pp.material("brass"); c.beginPath(); c.arc(q[0], q[1], 8, 0, Math.PI * 2); c.fill(); c.restore();
      Pp.circle(c, q[0], q[1], 8, { role: "ink", width: 2 });
      if (t === dragFrom || over === `t:${t}`) Pp.circle(c, q[0], q[1], 15, { role: "you", width: 3 });
      if (!s.done) api.target(`t:${t}`, q[0] - 22, q[1] - 22, 44, 44);
    }
    // the law's answer, while the board it judged is the board on screen
    if (why === "glow") drawCurrent(c);
    else if (why) {
      const k = clamp((api.t - ranAt) / 0.3, 0, 1);
      const mag = (q: Pt) => Pp.magnifier(c, q[0], q[1] - 30, 22 * k + 0.01);
      if (why === "open_loop") {
        const bare = ["c+", "c-", "b1", "b2"].filter((t) => !s.wires.some((x) => wireEnds(x).includes(t)));
        const stray = p.parts.find((x) => x.kind === "eraser");
        if (bare.length) bare.forEach((t) => mag(at(t)));
        else if (stray) mag(centre.get(stray) as Pt);
        else mag(at("b1"));
      } else if (why === "short") mag(centre.get(p.parts.find((x) => x.kind === "cell") as CircuitPart) as Pt);
      else if (sw) mag(centre.get(sw) as Pt);
      Pp.chip(c, W(`yantra.circuit.why.${why}`), w / 2, h - 18, { size: 15, role: "look", font: "ui" });
    } else if (!s.wires.length || (s.wires.length === p.pre.length && !s.runs)) {
      Pp.textFit(c, W("yantra.circuit.hint"), w / 2, h - 19, w - 20, 36, { size: 14, role: "ink3", weight: 600 });
    }
    if (why === "glow") Pp.chip(c, W("yantra.circuit.glow"), w / 2, h - 18, { size: 15, role: "good", font: "ui" });
  }
  /** dots evenly spaced by arc length, all moving at one speed, from + round the loop to − and back through the cell */
  function drawCurrent(c: CanvasRenderingContext2D): void {
    const pts = loopPolyline();
    if (!pts || pts.length < 2) return;
    const seg: number[] = [];
    let total = 0;
    for (let i = 0; i + 1 < pts.length; i++) { const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); seg.push(d); total += d; }
    if (total < GAP) return;
    const tt = api.reduced ? 0 : Math.min(api.t - ranAt, SHOW_S);
    const off = ((tt * SPEED) % GAP + GAP) % GAP;
    let i = 0, acc = 0;
    for (let sPos = off; sPos < total; sPos += GAP) {
      while (i < seg.length - 1 && acc + seg[i] < sPos) { acc += seg[i]; i++; }
      const u = seg[i] ? (sPos - acc) / seg[i] : 0;
      const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u;
      P().circle(c, x, y, 3.5, { role: "q4", fill: true, width: 1 });
    }
  }

  function goal(): string {
    if (p.pre.length) return W("yantra.circuit.goal.fix");
    if (p.goal === "switch") return W(p.at === "after" ? "yantra.circuit.goal.after" : "yantra.circuit.goal.switch");
    return W("yantra.circuit.goal.light");
  }
  // no live readout: whether it will glow is what RUN finds out
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    const out: ControlSpec[] = [];
    if (sw) out.push({ id: "toggle", label: W("yantra.circuit.toggle"), aria: s.sw ? "switch closed: open it" : "switch open: close it", kind: "pad", group: "board", pressed: s.sw, onPress: () => act({ kind: "toggle", id: "s" }) });
    out.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) });
    out.push({ id: "run", label: W("yantra.circuit.run"), kind: "primary", group: "go", you: s.wires.length > 0 && !showing(), disabled: !s.wires.length, onPress: () => act({ kind: "run" }) });
    return out;
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, goal, readouts, controls, react, dragging: () => !!dragFrom };
  return view;
};
