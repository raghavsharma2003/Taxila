// Feeta · the 2D view (round 7, length and distance; classes 4-5). Nothing here runs on a clock: the scissors, the tape,
// the counter wheels and the rack move on the child's touch, and the run (lay the ribbon, hang the rope, fence the
// garden, ride the trip, roll the lengths out) only shows what the law has already answered.
//   measure/ribbon  the object on its ruler (a broken one at look 2-3: its left end is torn and it starts past 0); under it
//              a whole cutting ruler from 0 with a ribbon pulled out to the scissors: drag them (they snap to the cm
//              marks) or nudge ± 1 cm. The run lifts the ribbon beside the object, its left end at the object's left end.
//   measure/rope · fence · trip/odo   the order on a board (rope, trip) or the garden on its squares (fence); a tape / roll /
//              road from 0 to the instrument's top, the length pulled out drawn to scale; a counter with one wheel per
//              digit (tap a wheel's top half: one more, bottom half: one less), or drag along the tape. The run hangs the
//              rope beside metre sticks, walks the fence round from the gate, or rides the cycle along the road.
//   compare/order   lanes with each length as written; tap a lane then a rack slot (or drag it there); the run rolls every
//              length out to ONE scale side by side, so the order is the law's.
// After a missed run only magnifiers mark what is not as it should be (the ribbon's end, the gap or the spare fence, where
// the cycle stopped, a slot); never the key.
import type { FeetaAct, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import { corners, inPlot, lenOrder, lenText, per, RULER, sideLens, stripGoal, stripUnit, unitsOf, valueOf, want, type FeetaParams, type FeetaState } from "./feeta.logic.ts";

const SWEEP = 1.6;   // s a run takes on screen (cosmetic: the law has already answered)

export const makeFeetaView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<FeetaParams, FeetaState, FeetaAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, strip = stripGoal(p.goal), U = stripUnit(p);
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const st = () => ctl.state;
  let w = 360, h = 480;
  // ribbon: the cm size and the rulers; strip goals: the tape, the counter, the board / plot; order: lanes and slots
  let pc = 20, x0 = 20, objY = 40, rulerAY = 70, rulerBY = 200, rh = 44;
  let tx0 = 20, tx1 = 340, tapeY = 200, tapeH = 40, wheelY = 280, wheelW = 48, wheelH = 64, boardY = 8, boardH = 0;
  let cs = 30, px0 = 0, py0 = 0;
  let laneY = 0, laneH = 48, slotY = 0, slotW = 60, slotH = 60;
  let drag: null | { kind: "cut"; at: number } | { kind: "lane"; lane: number; x: number; y: number; moved: boolean } = null;
  let sel = -1;           // order: the lane picked up by a tap
  let runAt = -1;         // api.t when the last run started on screen
  const digits = String(p.max).length;

  function layout(bw: number, bh: number): void {
    w = bw; h = bh;
    if (p.goal === "ribbon") {
      pc = Math.min((w - 40) / (RULER + 0.8), 56); x0 = (w - pc * RULER) / 2;
      rh = clamp(h * 0.11, 44, 56);
      const block = 34 + 10 + rh + 74 + rh;
      objY = Math.max(10, (h - block) / 2) + 17;
      rulerAY = objY + 27; rulerBY = rulerAY + rh + 74;
    } else if (strip) {
      boardH = p.goal === "fence" ? 0 : clamp(h * 0.13, 52, 70); boardY = 8;
      wheelH = 90; wheelW = 50;   // each half of a wheel is a 44 px target
      wheelY = h - wheelH - 10;
      tapeH = 40; tapeY = wheelY - 26 - tapeH - 22;
      tx0 = 24; tx1 = w - 24;
      if (p.goal === "fence") {
        const availH = tapeY - 22 - 16 - 22, availW = w - 120;   // room for the bottom side's label above the roll
        cs = Math.max(14, Math.min(availW / p.W, (availH - 26) / p.H, 48));
        px0 = (w - cs * p.W) / 2; py0 = 16 + 26 + Math.max(0, (availH - 26 - cs * p.H) / 2);
      } else {
        // the rope / road sits between the board and the counter, with room above it for the sticks, the cycle and the place
        const top = boardY + boardH;
        tapeY = top + 76 + Math.max(0, (wheelY - 30 - top - 76 - tapeH) / 2);
      }
    } else {
      const n = p.items.length;
      slotH = clamp(h * 0.16, 56, 84); slotY = h - slotH - 10;
      laneH = clamp((slotY - 40) / n, 48, 84); laneY = Math.max(8, (slotY - 30 - laneH * n) / 2);
      slotW = Math.min(120, (w - 16 - 8 * (n - 1)) / n);
    }
  }
  const act = (a: FeetaAct) => { ctl.dispatch(a); deps.changed(); };
  const mark = (v: number) => { const at = clamp(Math.round(v), 1, p.max); if (at !== st().at) act({ kind: "mark", at }); };

  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as FeetaAct | undefined;
    if (!last) return;
    if (refused && refused !== "missed") { api.sfx("refuse"); api.fx.shake(2); }
    else if (last.kind === "run") { runAt = api.reduced ? api.t - 10 : api.t; api.sfx("slide"); }
    else if (last.kind === "mark") api.sfx("tick");
    else if (last.kind === "put") api.sfx("land");
    else api.sfx("tap");
    if (!st().ended) runAt = -1;
    void ms;
    api.invalidate(); deps.changed();
  }
  /** 0..1 of the run on screen; 1 once it has played (the law answered when the act landed) */
  const runK = () => (runAt < 0 ? 0 : clamp((api.t - runAt) / SWEEP, 0, 1));
  const shownEnd = () => st().ended && runK() >= 1;
  let announced = -1;
  function update(): void {
    if (runAt >= 0 && runK() < 1) api.invalidate();
    if (runAt >= 0 && runK() >= 1 && announced !== runAt) {
      announced = runAt;
      if (st().done) { api.sfx("good"); api.fx.burst(w / 2, h / 2, { n: 18, color: api.P.color("good"), speed: 110, life: 0.7, size: 3, kind: "spark" }); }
      else api.sfx("look");
      deps.changed();
    }
  }
  const busy = () => !!drag || (runAt >= 0 && runK() < 1);
  /** the setting shown right now (a drag shows its preview; the law is not asked until the finger lifts) */
  const shownAt = () => (drag?.kind === "cut" ? drag.at : st().at);
  const tapeX = (v: number) => tx0 + (v / p.max) * (tx1 - tx0);
  const snap = p.goal === "rope" ? 5 : p.goal === "odo" ? 50 : 1;

  // ── pointer ──
  function pointer(kind: PointerKind, x: number, y: number): void {
    const s = st();
    if (s.done) return;
    if (strip) {
      const onRuler = p.goal === "ribbon" ? y > rulerBY - 50 && y < rulerBY + rh + 6 : y > tapeY - 30 && y < tapeY + tapeH + 12;
      const valAt = (xx: number) => p.goal === "ribbon" ? clamp(Math.round((xx - x0) / pc), 1, RULER) : clamp(Math.round(((xx - tx0) / (tx1 - tx0)) * p.max / snap) * snap, 1, p.max);
      if (kind === "down") {
        const id = api.hit(x, y);
        if (id?.startsWith("wheel-")) {
          const [k, dir] = id.slice(6).split(":"), step = 10 ** Number(k), v = s.at + (dir === "up" ? step : -step);
          if (v >= 1 && v <= p.max) mark(v); else api.sfx("refuse");
          return;
        }
        if (!onRuler) return;
        drag = { kind: "cut", at: valAt(x) }; ctl.finger(true); api.sfx("select");
      } else if (kind === "move" && drag?.kind === "cut") drag.at = valAt(x);
      else if ((kind === "up" || kind === "cancel") && drag?.kind === "cut") {
        const d0 = drag; drag = null; ctl.finger(false);
        if (kind === "up") mark(d0.at);
      }
      api.invalidate(); if (kind !== "move") deps.changed();
      return;
    }
    // order: tap a lane then a slot, or drag a lane onto a slot
    const id = kind === "move" ? null : api.hit(x, y);
    if (kind === "down") {
      if (id?.startsWith("lane-")) { drag = { kind: "lane", lane: Number(id.slice(5)), x, y, moved: false }; ctl.finger(true); api.sfx("select"); }
      else if (id?.startsWith("slot-") && sel >= 0) { const at = Number(id.slice(5)); const lane = sel; sel = -1; if (s.order[at] !== lane) act({ kind: "put", lane, at }); }
      else if (id?.startsWith("slot-") && s.order[Number(id.slice(5))] >= 0) { drag = { kind: "lane", lane: s.order[Number(id.slice(5))], x, y, moved: false }; ctl.finger(true); }
    } else if (kind === "move" && drag?.kind === "lane") { if (Math.hypot(x - drag.x, y - drag.y) > 8) drag.moved = true; drag.x = x; drag.y = y; }
    else if ((kind === "up" || kind === "cancel") && drag?.kind === "lane") {
      const d0 = drag; drag = null; ctl.finger(false);
      if (kind === "up" && id?.startsWith("slot-")) { const at = Number(id.slice(5)); if (s.order[at] !== d0.lane) act({ kind: "put", lane: d0.lane, at }); sel = -1; }
      else if (kind === "up" && !d0.moved) sel = sel === d0.lane ? -1 : d0.lane;
    }
    api.invalidate(); deps.changed();
  }

  // ── a ruler: marks from `first` for RULER cm at `pc` px per cm; a broken one has a torn left edge ──
  function ruler(c: CanvasRenderingContext2D, x: number, y: number, first: number, broken: boolean): void {
    const P = api.P, L = RULER * pc;
    // the ruler's body is a panel (so its marks read on every art direction); a broken one shows a torn left edge
    P.body(c, x - 10, y, L + 20, rh, { role: "panel", r: broken ? 0 : 4 });
    P.stroke(c, [[x - 10, y], [x - 10, y + rh]], { role: "ink2", width: 1.5 });
    if (broken) P.stroke(c, [0, 1, 2, 3, 4, 5, 6].map((k) => [x - 10 + (k % 2 ? 7 : 0), y + (rh * k) / 6] as [number, number]), { role: "ink", width: 2.5 });
    const every = pc >= 34 ? 1 : 2;
    for (let k = 0; k <= RULER; k++) {
      const xx = x + k * pc, m = first + k;
      P.stroke(c, [[xx, y], [xx, y + rh * 0.36]], { role: "ink", width: 1.6 });
      if (k < RULER) P.stroke(c, [[xx + pc / 2, y], [xx + pc / 2, y + rh * 0.2]], { role: "ink2", width: 1 });
      if (m % every === 0) P.text(c, String(m), xx, y + rh * 0.68, { size: 16, role: "ink", weight: 700, font: "mono" });
    }
  }

  function drawRibbon(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), k = runK(), end = shownEnd();
    const xA = (m: number) => x0 + (m - p.from) * pc, xa = xA(p.a), xb = xA(p.b);
    // the pencil, its tip at the right end
    const ph = 22, tip = Math.min(pc * 0.9, 18);
    P.body(c, xa, objY - ph / 2, xb - xa - tip, ph, { role: "q2", r: 4 });
    P.fillPath(c, (g) => { g.beginPath(); g.moveTo(xb - tip, objY - ph / 2); g.lineTo(xb, objY); g.lineTo(xb - tip, objY + ph / 2); g.closePath(); }, "wood", { outline: "ink2", width: 1.2 });
    if (p.look === 1) for (const xx of [xa, xb]) P.stroke(c, [[xx, objY + ph / 2], [xx, rulerAY]], { role: "ink3", width: 1.2, dash: [3, 3] });
    ruler(c, xA(p.from), rulerAY, p.from, p.from > 0);
    // the cutting ruler, the ribbon pulled out on it from 0, and the scissors
    ruler(c, x0, rulerBY, 0, false);
    const at = shownAt(), rbH = 14;
    const lift = s.ended && runAt >= 0 ? k : 0;
    // the run lifts the ribbon beside the object, its left end at the object's left end
    const rx = x0 + (xa - x0) * lift, ry = rulerBY - 24 + (objY + ph / 2 + 12 - (rulerBY - 24)) * lift;
    if (at > 0) P.body(c, rx, ry - rbH / 2, at * pc, rbH, { role: "q1", r: 3 });
    if (!s.done) {
      const sx = x0 + at * pc, sy = rulerBY - 24;
      api.target("scissors", sx - 24, sy - 24, 48, 48);
      P.circle(c, sx, sy, 15, { role: drag ? "you" : "q4", fill: true });
      P.stroke(c, [[sx, sy + 10], [sx, rulerBY + rh * 0.36]], { role: "q4", width: 2 });
      P.circle(c, sx, sy, 6, { role: "panel", fill: true });
    }
    if (end && !s.done) P.magnifier(c, rx + at * pc, ry, 20);
    if (end && s.done) P.tick(c, xb + 16, objY - 18, 24, 1);
  }

  function boardLine(c: CanvasRenderingContext2D, key: string, val: string): void {
    const P = api.P, bw = Math.min(w - 16, 420), bx = (w - bw) / 2;
    P.body(c, bx, boardY, bw, boardH, { role: "panel", r: 10 });
    P.textFit(c, W(key), bx + 10 + (bw * 0.4) / 2, boardY + boardH / 2, bw * 0.4, boardH, { size: 16, role: "ink2", weight: 600 });
    P.textFit(c, val, bx + bw * 0.44 + (bw * 0.54) / 2, boardY + boardH / 2, bw * 0.54, boardH, { size: clamp(boardH * 0.42, 18, 28), role: "ink", weight: 700, font: "mono" });
  }
  /** the tape / roll / road from 0 to the top, numbered as the look allows, and the length pulled out to scale */
  function tape(c: CanvasRenderingContext2D, at: number): void {
    const P = api.P;
    const minor = p.goal === "rope" ? 10 : p.goal === "odo" ? 100 : 1, major = p.goal === "rope" ? 50 : p.goal === "odo" ? 500 : 5;
    const span = tx1 - tx0, maxLabels = Math.max(2, Math.floor(span / 46));
    const steps = p.goal === "rope" ? [50, 100, 200, 400] : p.goal === "odo" ? [500, 1000, 2500, 5000] : [5, 10, 20, 30, 60];
    const lookStep = steps.filter((x) => p.max / x <= maxLabels)[p.look - 1] ?? p.max;
    P.body(c, tx0 - 8, tapeY, span + 16, tapeH, { role: p.goal === "odo" ? "ground2" : "panel", r: p.goal === "odo" ? 4 : 6 });
    for (let v = 0; v <= p.max; v += minor) {
      const xx = tapeX(v), big = v % major === 0;
      P.stroke(c, [[xx, tapeY], [xx, tapeY + (big ? 12 : 6)]], { role: big ? "ink" : "ink3", width: big ? 1.6 : 1 });
    }
    for (let v = 0; v <= p.max; v += lookStep) P.text(c, String(v), tapeX(v), tapeY + 27, { size: 16, role: "ink", weight: 700, font: "mono" });
    P.text(c, U, tx1, tapeY - 12, { size: 16, role: "ink2", weight: 700, font: "mono" });
    // what is pulled out: a rope, a fence wire with posts, the trip on the road
    if (at > 0) {
      const xe = tapeX(at), y = tapeY - 8;
      P.stroke(c, [[tx0, y], [xe, y]], { role: "q1", width: p.goal === "rope" ? 6 : 4 });
      if (!st().done) {
        api.target("cut", xe - 22, y - 26, 44, 44);
        P.circle(c, xe, y, 11, { role: drag ? "you" : "q4", fill: true });
      }
    }
  }
  /** the counter: one wheel per digit; a wheel's top half adds one of its place, the bottom half takes one away */
  function counter(c: CanvasRenderingContext2D, at: number): void {
    const P = api.P, s = st(), gap = 6, total = digits * wheelW + (digits - 1) * gap, unitW = 40;
    const cx0 = (w - total - unitW) / 2;
    for (let i = 0; i < digits; i++) {
      const place = digits - 1 - i, x = cx0 + i * (wheelW + gap), d = Math.floor(at / 10 ** place) % 10;
      P.body(c, x, wheelY, wheelW, wheelH, { role: "panel", r: 8, seed: i });
      if (!s.done) { api.target(`wheel-${place}:up`, x, wheelY, wheelW, wheelH / 2); api.target(`wheel-${place}:down`, x, wheelY + wheelH / 2, wheelW, wheelH / 2); }
      P.text(c, String(d), x + wheelW / 2, wheelY + wheelH / 2, { size: clamp(wheelH * 0.42, 22, 32), role: "ink", weight: 800, font: "mono" });
      P.stroke(c, [[x + wheelW / 2 - 6, wheelY + 9], [x + wheelW / 2, wheelY + 4], [x + wheelW / 2 + 6, wheelY + 9]], { role: "ink3", width: 2 });
      P.stroke(c, [[x + wheelW / 2 - 6, wheelY + wheelH - 9], [x + wheelW / 2, wheelY + wheelH - 4], [x + wheelW / 2 + 6, wheelY + wheelH - 9]], { role: "ink3", width: 2 });
    }
    P.text(c, U, cx0 + total + unitW / 2 + 4, wheelY + wheelH / 2, { size: 20, role: "ink2", weight: 700, font: "mono" });
    if (shownEnd() && !s.done) P.magnifier(c, cx0 - 20, wheelY + wheelH / 2, 18);
  }

  function drawRope(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), k = runK();
    boardLine(c, p.goal === "rope" ? "feeta.rope" : "feeta.trip", lenText(p, p.u));
    const at = shownAt();
    tape(c, at);
    counter(c, at);
    if (!s.ended || runAt < 0) return;
    const yy = tapeY - 34;
    if (p.goal === "rope") {
      // the run: metre sticks end to end, then the cm piece, above the rope on the same scale (the order as written)
      const B = unitsOf(p.u)[0], n = Math.min(p.big, Math.ceil(k * (p.big + 1)));
      for (let i = 0; i < n; i++) {
        P.body(c, tapeX(i * 100) + 1, yy - 9, tapeX(100) - tapeX(0) - 2, 18, { role: "q3", r: 3, seed: i });
        P.text(c, `1 ${B}`, (tapeX(i * 100) + tapeX(i * 100 + 100)) / 2, yy, { size: 16, on: "q3", weight: 700 });
      }
      if (k >= 1) P.body(c, tapeX(p.big * 100), yy - 9, Math.max(3, tapeX(p.small) - tapeX(0)), 18, { role: "q2", r: 3 });
      if (shownEnd() && !s.done) P.magnifier(c, tapeX(s.at), tapeY - 8, 18);
    } else {
      // the run: the cycle rides the road to where the meter runs out; the place is where the board says
      const cxv = tapeX(s.at * k), cy = tapeY - 20;
      P.circle(c, cxv - 7, cy, 7, { role: "ink", width: 2 }); P.circle(c, cxv + 7, cy, 7, { role: "ink", width: 2 });
      P.stroke(c, [[cxv - 7, cy], [cxv, cy - 9], [cxv + 7, cy]], { role: "q1", width: 2.5 });
      if (k >= 1) house(c, tapeX(want(p)), tapeY - 52);
      if (shownEnd() && !s.done) P.magnifier(c, cxv, cy - 22, 18);
    }
    if (shownEnd() && s.done) P.tick(c, tapeX(s.at), tapeY - 64, 24, 1);
  }
  function house(c: CanvasRenderingContext2D, x: number, y: number): void {
    const P = api.P;
    P.body(c, x - 12, y, 24, 18, { role: "q2", r: 2 });
    P.fillPath(c, (g) => { g.beginPath(); g.moveTo(x - 16, y); g.lineTo(x, y - 14); g.lineTo(x + 16, y); g.closePath(); }, "clay", { outline: "ink2", width: 1.2 });
  }

  function drawFence(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), k = runK();
    const X = (i: number) => px0 + i * cs, Y = (j: number) => py0 + j * cs;
    // the garden: its squares (look 1-2), its boundary, its labelled sides, equal-side marks on a square
    for (let i = 0; i < p.W; i++) for (let j = 0; j < p.H; j++) if (inPlot(p, i, j)) P.body(c, X(i) + 1, Y(j) + 1, cs - 2, cs - 2, { role: p.grid ? "q3" : "panel", r: 2, seed: i * 7 + j, fill: p.grid ? 0.55 : 1 });
    if (!p.grid) for (let i = 0; i < p.W; i++) for (let j = 0; j < p.H; j++) if (inPlot(p, i, j)) P.body(c, X(i), Y(j), cs, cs, { role: "q3", r: 0, fill: 0.55 });
    const cn = corners(p), L = sideLens(p), pts = cn.map(([x, y]) => [X(x), Y(y)] as [number, number]);
    P.stroke(c, pts, { role: "ink2", width: 2, closed: true });
    cn.forEach(([x, y], i) => {
      const [x2, y2] = cn[(i + 1) % cn.length], dx = Math.sign(x2 - x), dy = Math.sign(y2 - y);
      const mx = (X(x) + X(x2)) / 2, my = (Y(y) + Y(y2)) / 2, nx = dy, ny = -dx;
      if (p.labels.includes(i)) P.text(c, `${L[i]} m`, mx + nx * (dx ? 16 : 30), my + ny * (dy ? 16 : 16), { size: 16, role: "ink", weight: 700, font: "mono" });
      // a square: a small equal-side mark across the middle of every side
      if (p.W === p.H && !p.nw) P.stroke(c, [[mx - nx * 7, my - ny * 7], [mx + nx * 7, my + ny * 7]], { role: "ink", width: 2.5 });
    });
    // the gate at the top-left corner
    P.circle(c, X(0), Y(0), 7, { role: "q4", fill: true });
    P.text(c, W("feeta.gate"), X(0) - 12, Y(0), { size: 16, role: "ink2", weight: 700, align: "right" });
    const at = shownAt();
    tape(c, at);
    counter(c, at);
    if (!s.ended || runAt < 0) return;
    // the run: the fence goes round from the gate, as far as it lasts; what is left over lies by the gate
    const perim = L.reduce((a, b) => a + b, 0), lay = Math.min(s.at, perim) * k;
    let left = lay;
    const walk: [number, number][] = [pts[0]];
    for (let i = 0; i < pts.length && left > 0; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], f = Math.min(1, left / L[i]);
      walk.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]); left -= L[i];
    }
    P.stroke(c, walk, { role: "q1", width: 5 });
    const tip = walk[walk.length - 1];
    if (k >= 1 && s.at > perim) {
      const spare = Math.min(s.at - perim, 12) * cs * 0.5;
      P.stroke(c, [[X(0) - 6, Y(0) + 8], [X(0) - 6, Y(0) + 8 + spare]], { role: "q1", width: 5 });
      if (!s.done) P.magnifier(c, X(0) - 22, Y(0) + 8 + spare / 2, 18);
    } else if (shownEnd() && !s.done) P.magnifier(c, tip[0], tip[1], 18);
    if (shownEnd() && s.done) P.tick(c, X(p.W) - 4, Y(0) - 14, 24, 1);
  }

  function drawOrder(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st(), n = p.items.length, k = runK(), end = shownEnd();
    const order = lenOrder(p), longest = Math.max(...p.items.map((l) => valueOf(l, p.u)));
    const lab = clamp(laneH * 0.34, 16, 22), maxText = Math.max(...p.items.map((l) => lenText(l, p.u).length));
    const bx0 = Math.min(w * 0.55, 54 + maxText * lab * 0.62 + 16), bx1 = w - 20;
    for (let i = 0; i < n; i++) {
      const y = laneY + i * laneH, l = p.items[i], placed = s.order.includes(i);
      if (!s.done) api.target(`lane-${i}`, 8, y + 2, w - 16, laneH - 4);
      P.body(c, 8, y + 2, w - 16, laneH - 4, { role: "panel", r: 8, state: sel === i ? "look" : "idle", seed: i });
      P.circle(c, 30, y + laneH / 2, 15, { role: placed ? "ink3" : "q2", fill: true });
      P.text(c, String(i + 1), 30, y + laneH / 2, { size: 16, weight: 800, on: placed ? "ink3" : "q2" });
      P.text(c, lenText(l, p.u), 54, y + laneH / 2, { size: lab, role: "ink", weight: 700, font: "mono", align: "left", maxW: bx0 - 54 - 10 });
      // the run: every length rolled out to ONE scale
      const f = runAt >= 0 && s.ended ? k * (valueOf(l, p.u) / longest) : 0;
      if (f > 0) P.stroke(c, [[bx0, y + laneH / 2], [bx0 + (bx1 - bx0) * f, y + laneH / 2]], { role: "q1", width: 7 });
      else P.stroke(c, [[bx0, y + laneH / 2], [bx1, y + laneH / 2]], { role: "ink3", width: 2, dash: [6, 5] });
    }
    // the rack: slots shortest first
    const total = n * slotW + (n - 1) * 8, sx = (w - total) / 2;
    P.text(c, W("feeta.rack"), w / 2, slotY - 14, { size: 16, role: "ink2", weight: 700 });
    for (let j = 0; j < n; j++) {
      const x = sx + j * (slotW + 8), lane = s.order[j], bad = end && !s.done && lane !== order[j];
      if (!s.done) api.target(`slot-${j}`, x, slotY, slotW, slotH);
      P.body(c, x, slotY, slotW, slotH, { role: "q3", r: 8, state: bad ? "look" : "idle", seed: 10 + j, fill: 0.3 + (0.5 * (j + 1)) / n });
      if (lane >= 0) { P.circle(c, x + slotW / 2, slotY + slotH / 2, 17, { role: "q2", fill: true }); P.text(c, String(lane + 1), x + slotW / 2, slotY + slotH / 2, { size: 18, weight: 800, on: "q2" }); }
      else if (sel >= 0 || drag?.kind === "lane") P.circle(c, x + slotW / 2, slotY + slotH / 2, 17, { role: "you", width: 2 });
      if (bad) P.magnifier(c, x + slotW - 14, slotY + 14, 16);
    }
    if (drag?.kind === "lane" && drag.moved) { P.circle(c, drag.x, drag.y, 17, { role: "q2", fill: true }); P.text(c, String(drag.lane + 1), drag.x, drag.y, { size: 18, weight: 800, on: "q2" }); }
    if (end && s.done) P.tick(c, w / 2 + total / 2 + 4, slotY - 14, 22, 1);
  }

  function draw(c: CanvasRenderingContext2D): void {
    if (p.goal === "ribbon") drawRibbon(c);
    else if (p.goal === "fence") drawFence(c);
    else if (strip) drawRope(c);
    else drawOrder(c);
  }

  function goal(): string {
    const s = st();
    if (s.ended && !s.done && runK() >= 1) return W("feeta.again");
    return W(`feeta.goal.${p.goal}`);
  }
  // no readout beyond the instrument itself: reading it IS the skill
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    const out: ControlSpec[] = [];
    let ready = !s.ended;
    if (p.goal === "ribbon") {
      out.push({ id: "less", label: "− 1 cm", aria: "one centimetre shorter", kind: "pad", group: "cut", disabled: s.at <= 1, onPress: () => mark(s.at - 1) });
      out.push({ id: "more", label: "+ 1 cm", aria: "one centimetre longer", kind: "pad", group: "cut", disabled: s.at >= RULER, onPress: () => mark(s.at + 1) });
    }
    if (strip) ready = ready && s.at > 0;
    else ready = ready && s.order.every((l) => l >= 0);
    out.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) });
    const runKey = p.goal === "odo" ? "feeta.ride" : p.goal === "order" ? "feeta.roll" : "feeta.cut";
    out.push({ id: "run", label: W(runKey), aria: "run it", kind: "primary", group: "go", you: ready, disabled: !ready, onPress: () => act({ kind: "run" }) });
    return out;
  }
  void per;
  const view: FamilyView = { layout, update, draw, pointer, busy, goal, readouts, controls, react, dragging: () => !!drag };
  return view;
};
