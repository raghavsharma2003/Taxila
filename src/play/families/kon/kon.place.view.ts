// Kon · place, the 2D view (r8; the law is kon.place.ts). The board (BW × BH board px, y up) is scaled into the box, never
// below 1 board px per CSS px at 360 when the box allows it, so the protractor is ≥ 200 px wide on a phone.
//   measure / draw  the angle (OA, and OB for measure) above; the loose protractor rests below it. Drag its body to move it;
//                   drag the round handle under its centre to turn it about its own centre (1° steps; ↺ ↻ nudge by 1°);
//                   "Rakh do" locks it. measure: tap a number band of the scale (the outer or the inner one) to choose a
//                   reading, ±1, "Yahi hai". draw: tap the rim to put a dot (↺ ↻ move it by 1°), then join it to O or to A.
//   size            ∠P and ∠Q, each with a protractor already on it, one big, one small: ∠P, ∠Q or "Barabar".
// No snapping to the vertex or an arm (a snap would be the placement), no live reading of the angle (the reading is the
// skill), no timer. After a decision the law plays out what the protractor showed AS PLACED:
//   vertex-off   the arm the misplaced protractor measures, drawn from ITS centre: it starts off the corner and runs beside
//                OB (a ring joins the centre to O)
//   wrong-scale  the arm her number means on the scale whose 0 is on the arm, far from OB
//   join-wrong-end  the arm from A, and the angle it makes at A, with its number
//   size (a miss) both readings, each in place of its angle's name
import type { KonAct, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, type ControlSpec, type FamilyView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { say } from "../../copy.ts";
import { word } from "../../engines/words.ts";
import type { KonParams, KonState } from "./kon.logic.ts";
import { ARM, BH, BW, KNOB_AT, PD, PR, PRINT_EVERY, arms, centreRingShown, dir, farEnd, initPlace, madeAngle, norm, placement, rimAngleOf, rimPoint, sizeFigs, type Pose } from "./kon.place.ts";
import { freeSpot } from "./kon.spot.ts";

type Pt = [number, number];
const RUN_END = 1.4;
/** the turning handle sits on the body, this far up from the centre (board px), at the scale's 90 */
const KNOB = KNOB_AT * PR;

export function makePlaceView(api: ViewApi, depsIn: ViewDeps): FamilyView {
  const deps = depsIn as unknown as ViewDeps<KonParams, KonState, KonAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, goal = p.goal as "measure" | "draw" | "size";
  const st = () => ctl.state;
  const ps = () => st().pl ?? initPlace(p);
  let s = 1, ox = 0, oy = 0;
  let drag: "body" | "spin" | null = null, live: Pose | null = null, grab: Pt = [0, 0], moved = false;
  /** measure: the reading she has chosen on the scale (not an act until "Yahi hai") */
  let sel: { n: number; r: number; outer: boolean } | null = null;
  let truthAt = -1;
  const S = (x: number, y: number): Pt => [ox + x * s, oy + (BH - y) * s];
  const B = (X: number, Y: number): Pt => [(X - ox) / s, BH - (Y - oy) / s];
  const rad = (d: number) => (d * Math.PI) / 180;
  const pose = (): Pose => live ?? ps().pose;
  const knobAt = (q: Pose): Pt => { const [c, n] = dir(q.rot + 90); return [q.x + KNOB * c, q.y + KNOB * n]; };
  /** the handle's touch radius: 32 px for classes 6-9 (a 64 px target), 24 px below */
  const knobR = () => (api.young ? 24 : 32);
  const fs = () => (api.young ? 16 : 14);

  function layout(w: number, h: number): void {
    s = Math.min(w / BW, h / BH);
    ox = (w - BW * s) / 2; oy = (h - BH * s) / 2;
  }
  function act(a: KonAct): void { ctl.dispatch(a); deps.changed(); }
  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as KonAct | undefined;
    const decisive = last && (last.kind === "read" || last.kind === "join" || last.kind === "pick");
    if (last?.kind === "move" || last?.kind === "spin") api.sfx("slide");
    if (last?.kind === "lock") api.sfx("select");
    if (decisive && !(refused && refused !== "missed")) { truthAt = api.t; api.sfx("land"); }
    for (const m of ms) {
      if (m.kind === "solved") setTimeout(() => api.sfx("good"), 200);
      if (m.kind === "misconception_consequence" || m.kind === "law_refused" || m.kind === "near_miss") setTimeout(() => api.sfx("look"), 200);
    }
    if (last?.kind === "undo" || last?.kind === "free") { truthAt = -1; sel = null; }
    // any other step after a decision ends its play-out (a new dot is not graded until she joins it: no live reading)
    else if (last && !decisive && !refused) truthAt = -1;
    api.invalidate(); deps.changed();
  }
  /** inside the protractor's body (the half-disc and the strip under its base)? */
  function onBody(q: Pose, x: number, y: number): boolean {
    const dx = x - q.x, dy = y - q.y, [bx, by] = dir(q.rot), [nx, ny] = dir(q.rot + 90);
    const along = dx * bx + dy * by, up = dx * nx + dy * ny;
    if (up >= 0) return Math.hypot(dx, dy) <= PR + 6;
    return up >= -PD - 6 && Math.abs(along) <= PR + 6;
  }
  function pointer(kind: PointerKind, X: number, Y: number): void {
    const S0 = st();
    if (S0.done || goal === "size") return;
    const [x, y] = B(X, Y), P0 = ps();
    if (kind === "down") {
      if (!P0.locked) {
        const [kx, ky] = S(...knobAt(P0.pose));
        if (Math.hypot(X - kx, Y - ky) <= knobR() + 4) { drag = "spin"; live = { ...P0.pose }; ctl.finger(true); api.sfx("select"); moved = false; }
        else if (onBody(P0.pose, x, y)) { drag = "body"; live = { ...P0.pose }; grab = [P0.pose.x - x, P0.pose.y - y]; ctl.finger(true); api.sfx("select"); moved = false; }
        api.invalidate(); deps.changed();
        return;
      }
      // locked: a tap on the scale (measure: choose a number on the outer or inner band; draw: a dot on the rim)
      const q = P0.pose, d = Math.hypot(x - q.x, y - q.y), r = rimAngleOf(q, x, y);
      if (r < -6 || r > 186 || d < PR - 48 || d > PR + 32) return;
      const rr = clamp(Math.round(r), 0, 180);
      if (goal === "measure") { const outer = d >= PR - 14; sel = { n: outer ? rr : 180 - rr, r: rr, outer }; api.sfx("select"); }
      else act({ kind: "mark", r: rr });
      api.invalidate(); deps.changed();
      return;
    }
    if (kind === "move" && drag && live) {
      if (drag === "body") live = { ...live, x: clamp(x + grab[0], 0, BW), y: clamp(y + grab[1], 0, BH) };
      else live = { ...live, rot: norm(Math.round((Math.atan2(y - live.y, x - live.x) * 180) / Math.PI - 90)) };
      moved = true;
      api.invalidate();
      return;
    }
    if ((kind === "up" || kind === "cancel") && drag) {
      const was = drag, q = live;
      drag = null; live = null; ctl.finger(false);
      if (q && moved) act(was === "body" ? { kind: "move", x: +q.x.toFixed(1), y: +q.y.toFixed(1) } : { kind: "spin", deg: q.rot });
      api.invalidate(); deps.changed();
    }
  }
  const update = () => { /* the protractor follows the finger directly */ };
  const busy = () => drag !== null || (truthAt >= 0 && api.t - truthAt < RUN_END);

  // ── drawing
  function arcAt(c: CanvasRenderingContext2D, o: Pt, r: number, a0: number, a1: number, role: string, width = 2.5, dash?: number[]): void {
    // the smaller turn from heading a0 to a1, about board point o, radius r (screen px)
    let d = norm(a1 - a0); if (d > 180) d -= 360;
    const [x, y] = S(...o);
    c.save(); c.beginPath(); c.strokeStyle = api.P.color(role as never); c.lineWidth = width; if (dash) c.setLineDash(dash);
    c.arc(x, y, r, -rad(a0), -rad(a0 + d), d > 0); c.stroke(); c.restore();
  }
  const ray = (o: Pt, h: number, len: number): Pt[] => { const [c, n] = dir(h); return [S(...o), S(o[0] + c * len, o[1] + n * len)]; };
  /** a letter just beyond a point, away from the vertex */
  function letter(c: CanvasRenderingContext2D, t: string, at: Pt, away: number, off = 14): void {
    const [cx, cy] = dir(away), [X, Y] = S(at[0] + cx * off, at[1] + cy * off);
    api.P.text(c, t, X, Y, { size: 16, weight: 700, role: "ink2" });
  }
  function protractor(c: CanvasRenderingContext2D, q: Pose, rad0 = PR, o: { knob?: boolean; locked?: boolean } = {}): void {
    const P = api.P, [cx, cy] = S(q.x, q.y), R = rad0 * s, [nx, ny] = dir(q.rot - 90), [bx, by] = dir(q.rot);
    const depth = (rad0 === PR ? PD : PD * (rad0 / PR)) * s;
    // the body: the half-disc and the strip under the base, see-through
    c.save(); c.beginPath();
    c.arc(cx, cy, R, -rad(q.rot), -rad(q.rot + 180), true);
    const e1: Pt = [cx - bx * R + nx * depth, cy + by * R - ny * depth], e2: Pt = [cx + bx * R + nx * depth, cy - by * R - ny * depth];
    c.lineTo(e1[0], e1[1]); c.lineTo(e2[0], e2[1]); c.closePath();
    c.fillStyle = P.color("panel"); c.globalAlpha = 0.42; c.fill();
    c.globalAlpha = 1; c.strokeStyle = P.color(o.locked ? "ink2" : "ink3"); c.lineWidth = o.locked ? 2.5 : 1.8; c.stroke();
    c.restore();
    // the base line through the centre, and the centre point
    P.stroke(c, [[cx - bx * R, cy + by * R], [cx + bx * R, cy - by * R]], { role: "ink3", width: 1.5 });
    P.circle(c, cx, cy, 3.5, { role: "ink", fill: true });
    P.stroke(c, [[cx, cy], [cx - nx * 9, cy + ny * 9]], { role: "ink", width: 1.5 });
    // ticks every 5°, longer every 10°; both scales numbered (outer from this end, inner from the other)
    const every = PRINT_EVERY[p.scale];
    for (let a = 0; a <= 180; a += 5) {
      const [tc, tn] = dir(q.rot + a), len = (a % 10 === 0 ? 10 : 5) * Math.min(1, rad0 / PR + 0.2);
      P.stroke(c, [[cx + tc * R, cy - tn * R], [cx + tc * (R - len), cy - tn * (R - len)]], { role: "ink3", width: a % 30 === 0 ? 1.8 : 1 });
      if (a % every === 0) {
        const lo = R + 13, li = R - 24, nudge = a === 0 ? 6 : a === 180 ? -6 : 0, [ic, iN] = dir(q.rot + a + nudge * (rad0 === PR ? 1 : 1.4));
        // the outer 0 and 180 sit a little inside the half-disc, off the base line (an arm runs along it)
        const [oc, oN] = dir(q.rot + a + (a === 0 ? 5 : a === 180 ? -5 : 0) * (rad0 === PR ? 1 : 1.4));
        P.text(c, String(a), cx + oc * lo, cy - oN * lo, { size: fs(), weight: 700, font: "mono", role: "ink2" });
        // a small protractor numbers its inner scale every 60° (every 30° the numbers would touch)
        if (a !== 90 && (rad0 >= 90 || a % 60 === 0)) P.text(c, String(180 - a), cx + ic * li, cy - iN * li, { size: fs(), weight: 600, font: "mono", role: "ink3" });
      }
    }
    if (o.knob) {
      // the turning handle on the body: a ring the arms show through
      const [kx, ky] = S(...knobAt(q));
      P.circle(c, kx, ky, 16, { role: "you", width: 3 });
      // two turning arrows on the handle
      c.save(); c.strokeStyle = P.color("you"); c.lineWidth = 2.5; c.beginPath(); c.arc(kx, ky, 8, 0.3, 2.5); c.stroke(); c.beginPath(); c.arc(kx, ky, 8, 3.4, 5.6); c.stroke(); c.restore();
      api.target("turn", kx - knobR(), ky - knobR(), knobR() * 2, knobR() * 2);
    }
  }

  /** an arm or ray, drawn and declared to the layout audit (chips must not sit across it) */
  function line(c: CanvasRenderingContext2D, pts: Pt[], o: { role: string; width?: number; dash?: number[] }): void {
    api.P.stroke(c, pts, o as never);
    api.P.noteSeg("arm", pts[0], pts[pts.length - 1]);
  }
  /** measure: where her reading's chip sits (the protractor is not there): under it when it sits high, over it when low */
  const readChipAt = (q: Pose): Pt => S(BW / 2, q.y > BH / 2 - 30 ? 22 : BH - 16);
  function draw(c: CanvasRenderingContext2D): void {
    if (goal === "size") return drawSize(c);
    const P = api.P, S0 = st(), P0 = ps(), q = pose(), V: Pt = [p.vx ?? 0, p.vy ?? 0], hs = arms(p);
    // the angle: OA (and OB)
    for (const h of hs) line(c, ray(V, h, ARM), { role: "ink", width: 3.5 });
    P.circle(c, ...S(...V), 4.5, { role: "ink", fill: true });
    const bis = hs.length === 2 ? hs[0] + (norm(hs[1] - hs[0]) > 180 ? (norm(hs[1] - hs[0]) - 360) / 2 : norm(hs[1] - hs[0]) / 2) : hs[0] + 90;
    const oAway = bis + 180;
    // the arm letters stand well past the arm ends, clear of the protractor's numbers
    letter(c, "A", farEnd(p), hs[0], 24);
    if (hs.length === 2) { const [bc, bn] = dir(hs[1]); letter(c, "B", [V[0] + ARM * bc, V[1] + ARM * bn], hs[1], 24); }
    // the protractor
    protractor(c, q, PR, { knob: !P0.locked && !S0.done, locked: P0.locked });
    // O on top of the see-through protractor, so it stays readable where the centre sits
    letter(c, "O", V, oAway, 20);
    if (!P0.locked) {
      // its body is the drag target (the bounding box of the half-disc)
      const [cx, cy] = S(q.x, q.y), R = PR * s;
      api.target("protractor", cx - R, cy - R, R * 2, R * 2);
    } else {
      const [cx, cy] = S(q.x, q.y), R = (PR + 32) * s;
      api.target("scale", cx - R, cy - R, R * 2, R * 2);
    }
    // measure: the number she has chosen, marked on its band; her reading (chosen, or the one she gave) in a chip
    if (goal === "measure" && P0.locked) {
      if (sel) {
        const rr = (sel.outer ? PR + 2 : PR - 30), [a, b] = S(...rimPoint(q, sel.r, rr)), [a2, b2] = S(...rimPoint(q, sel.r, sel.outer ? PR - 10 : PR - 18));
        P.stroke(c, [[a, b], [a2, b2]], { role: "you", width: 4 });
      }
      const n = sel ? sel.n : P0.read;
      if (n !== null) P.chip(c, `${n}°`, ...readChipAt(q), { size: 16, role: "you" });
    }
    // draw: the dot, and the arm she joined
    if (goal === "draw" && P0.mark !== null && P0.locked) {
      const D = rimPoint(q, P0.mark);
      if (P0.joined) {
        const from: Pt = P0.joined === "v" ? V : farEnd(p), h = (Math.atan2(D[1] - from[1], D[0] - from[0]) * 180) / Math.PI;
        line(c, ray(from, h, Math.max(ARM, Math.hypot(D[0] - from[0], D[1] - from[1]) + 30)), { role: "you", width: 3.5 });
      }
      P.circle(c, ...S(...D), 6, { role: "you", fill: true });
    }
    if (truthAt >= 0 && S0.commits > 0) drawRun(c, q, V, hs);
  }
  /** the law's play-out after a decision (its beats all land before RUN_END) */
  function drawRun(c: CanvasRenderingContext2D, q: Pose, V: Pt, hs: number[]): void {
    const P = api.P, S0 = st(), P0 = ps(), k = clamp((api.t - truthAt) / 0.5, 0, 1);
    const pl = placement(p, q);
    if (S0.done) {
      const kt = clamp((api.t - truthAt - 0.3) / 0.3, 0, 1);
      if (goal === "measure" && P0.read !== null) {
        // the tick sits with her answer: beside her reading's chip
        const [hx, hy] = readChipAt(q), w = P.chipSize(c, `${P0.read}°`, { size: 16 }).w;
        P.tick(c, hx + w / 2 + 18, hy, 18, kt);
        return;
      }
      // draw: at the end of the arm she drew
      const [tc, tn] = dir(P0.mark !== null ? norm(q.rot + P0.mark) : hs[0]);
      P.tick(c, ...S(V[0] + (ARM + 18) * tc, V[1] + (ARM + 18) * tn), 18, kt);
      return;
    }
    // vertex-off (her committed placement is the bottom edge on O, and only then): a ring on O and a dashed join to the
    // centre. Any other off placement shows only what her number or arm means on the protractor as it sits (below).
    if (centreRingShown(p, st(), true)) {
      const [ox2, oy2] = S(...V), rr = 7 * k + 1;
      P.circle(c, ox2, oy2, rr, { role: "look", width: 2 });
      P.note("ring", ox2 - rr, oy2 - rr, 2 * rr, 2 * rr);
      P.stroke(c, [S(...V), S(q.x, q.y)], { role: "look", width: 2, dash: [4, 3] });
    }
    if (goal === "measure") {
      if (P0.read === null) return;
      // her number, on the scale whose 0 is on the placed arm: the arm it means, from the protractor's OWN centre. Placed
      // off (vertex-off), it starts off the corner and runs beside OB, never on it
      const r = pl.zeroOnArm ? P0.read : 180 - P0.read, h = norm(q.rot + r);
      line(c, ray([q.x, q.y], h, ARM * k), { role: "look", width: 3, dash: [7, 5] });
      if (pl.ok && k >= 1) arcAt(c, [q.x, q.y], PR * 0.42 * s, hs[1 - pl.arm], h, "look", 3, [5, 4]);
      return;
    }
    // draw: the angle she made, at the end she joined, with its number; and ∠AOB as asked, dashed
    if (P0.mark === null || !P0.joined) return;
    const at: Pt = P0.joined === "v" ? V : farEnd(p), D = rimPoint(q, P0.mark), hD = norm((Math.atan2(D[1] - at[1], D[0] - at[0]) * 180) / Math.PI);
    const base = P0.joined === "v" ? hs[0] : norm(hs[0] + 180), made = madeAngle(p, q, P0.mark, P0.joined);
    arcAt(c, at, 30 * s, base, hD, "look", 3);
    if (api.t - truthAt > 0.4) {
      // the angle it makes, named by its corner, where the protractor is not (under it when it sits high, over it when low)
      const [hx, hy] = S(BW / 2, q.y > BH / 2 - 30 ? 22 : BH - 16);
      P.chip(c, `∠${P0.joined === "v" ? "O" : "A"} ${Math.round(made)}°`, hx, hy, { size: 15, role: "look" });
    }
    // the asked angle at O on the side she marked
    const side = norm(hD - hs[0]) < 180 || P0.joined === "e" ? 1 : -1, want = norm(hs[0] + side * (p.theta ?? 0));
    line(c, ray(V, want, ARM * k), { role: "ink2", width: 2.5, dash: [8, 6] });
  }
  function drawSize(c: CanvasRenderingContext2D): void {
    const P = api.P, S0 = st(), figs = sizeFigs(p), names = ["P", "Q"];
    const run = truthAt >= 0 && S0.commits > 0, k = clamp((api.t - truthAt - 0.2) / 0.4, 0, 1);
    // the play-out after a miss: each angle's reading in place of its name (under its own figure, clear of every arm)
    const readings = run && !S0.done && k > 0;
    const labels: Pt[] = [];
    figs.forEach((f, i) => {
      const a0 = f.mirror ? 180 : 0, a1 = norm(a0 + (f.mirror ? -1 : 1) * f.th), len = f.rad + 30;
      for (const h of [a0, a1]) line(c, ray(f.v, h, len), { role: "ink", width: 3.5 });
      P.circle(c, ...S(...f.v), 4.5, { role: "ink", fill: true });
      // always upright: a mirrored angle opens from the left arm, so its reading is on the inner scale (0 on the left)
      protractor(c, { x: f.v[0], y: f.v[1], rot: 0 }, f.rad, { locked: true });
      // the angle's name below its vertex, outside the strip
      const [X, Y] = S(f.v[0], f.v[1] - PD * (f.rad / PR) - 12);
      labels.push([X, Y]);
      if (readings) P.chip(c, `∠${names[i]} ${i === 0 ? p.thA : p.thB}°`, X, Y + 4 * s, { size: 15, role: "look" });   // (a little lower: clear of the strip)
      else P.text(c, `∠${names[i]}`, X, Y, { size: 16, weight: 700, role: "ink2" });
    });
    if (run && S0.done) {
      // the tick sits with her answer: beside the angle she picked, or, for "Barabar", between the two figures (neutral)
      const pick = ps().pick;
      if (pick === "a" || pick === "b") { const [X, Y] = labels[pick === "a" ? 0 : 1]; P.tick(c, X + 34, Y, 18, k); return; }
      const top = S(BW / 2, figs[1].v[1] + figs[1].rad + 16)[1], [lx, ly] = labels[0];
      const y = (top + ly) / 2, segs = api.P.audit.segs.map((g): [Pt, Pt] => [[g.x0, g.y0], [g.x1, g.y1]]);
      const boxes = api.P.audit.texts.map((t) => ({ x: t.x - t.w / 2, y: t.y - t.px * 0.6, w: t.w, h: t.px * 1.2 }));
      const cands: Pt[] = [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5].map((j) => [lx + j * 26 * s, y]);
      const at = freeSpot(cands, 22, 18, { segs, boxes }, { x: 0, y: 0, w: api.w, h: api.h }) ?? cands[0];
      P.tick(c, at[0], at[1], 18, k);
    }
  }

  function goalLine(): string {
    if (goal === "measure") return word(lang, "kon.goal.measure");
    if (goal === "draw") return word(lang, "kon.goal.draw", { a: `${p.theta}°` });
    return word(lang, "kon.goal.size");
  }
  // no live reading of the angle: reading the protractor IS the skill
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    // solved: the same controls, all off, so the controls keep their rows and the board does not move (judge packet)
    if (st().done) return liveControls().map((c) => ({ ...c, disabled: true, you: false }));
    return liveControls();
  }
  function liveControls(): ControlSpec[] {
    const P0 = ps();
    const undo: ControlSpec = { id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) };
    if (goal === "size") {
      return [
        { id: "pick-a", label: "∠P", kind: "choice", group: "pick", onPress: () => act({ kind: "pick", which: "a" }) },
        { id: "pick-same", label: word(lang, "kon.same"), kind: "choice", group: "pick", onPress: () => act({ kind: "pick", which: "same" }) },
        { id: "pick-b", label: "∠Q", kind: "choice", group: "pick", onPress: () => act({ kind: "pick", which: "b" }) },
      ];
    }
    const rot = P0.pose.rot;
    if (!P0.locked) return [
      { id: "nudge-left", label: "↺", aria: word(lang, "kon.aria.acw"), kind: "pad", group: "nudge", onPress: () => act({ kind: "spin", deg: norm(rot + 1) }) },
      { id: "nudge-right", label: "↻", aria: word(lang, "kon.aria.cw"), kind: "pad", group: "nudge", onPress: () => act({ kind: "spin", deg: norm(rot - 1) }) },
      undo,
      { id: "lock", label: word(lang, "kon.lock"), kind: "primary", group: "go", you: true, onPress: () => act({ kind: "lock" }) },
    ];
    const free: ControlSpec = { id: "free", label: word(lang, "kon.free"), kind: "secondary", group: "go", onPress: () => act({ kind: "free" }) };
    if (goal === "measure") return [
      { id: "less", label: "−1", aria: word(lang, "kon.aria.less"), kind: "pad", group: "nudge", disabled: !sel || sel.n <= 0, onPress: () => { if (sel) { sel = { ...sel, n: sel.n - 1, r: sel.outer ? sel.r - 1 : sel.r + 1 }; api.invalidate(); deps.changed(); } } },
      { id: "more", label: "+1", aria: word(lang, "kon.aria.more"), kind: "pad", group: "nudge", disabled: !sel || sel.n >= 180, onPress: () => { if (sel) { sel = { ...sel, n: sel.n + 1, r: sel.outer ? sel.r + 1 : sel.r - 1 }; api.invalidate(); deps.changed(); } } },
      // "Wapas" after the lock too: one step back (the lock, or her last decision)
      free, undo,
      { id: "commit", label: word(lang, "kon.this"), kind: "primary", group: "go", you: !!sel, disabled: !sel, onPress: () => sel && act({ kind: "read", n: sel.n }) },
    ];
    const m = P0.mark;
    return [
      // (the dot moves by tapping the rim again: two rows, as before the lock, so the board keeps its size)
      { id: "join-o", label: word(lang, "kon.join", { p: "O" }), kind: "choice", group: "join", disabled: m === null, onPress: () => act({ kind: "join", end: "v" }) },
      { id: "join-a", label: word(lang, "kon.join", { p: "A" }), kind: "choice", group: "join", disabled: m === null, onPress: () => act({ kind: "join", end: "e" }) },
      free, undo,
    ];
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, goal: goalLine, readouts, controls, react, dragging: () => drag !== null };
  return view;
}
