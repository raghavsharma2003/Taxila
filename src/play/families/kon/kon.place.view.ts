// Kon · place, the 2D view (r8; the law is kon.place.ts). The board (BW × BH board px, y up) is scaled into the box, never
// below 1 board px per CSS px at 360 when the box allows it, so the protractor is ≥ 200 px wide on a phone.
//   measure / draw  the angle (OA, and OB for measure) above; the loose protractor rests below it. Drag its body to move it;
//                   drag the round handle under its centre to turn it about its own centre (1° steps; ↺ ↻ nudge by 1°);
//                   "Rakh do" locks it. measure: tap a number band of the scale (the outer or the inner one) to choose a
//                   reading, ±1, "Yahi hai". draw: tap the rim to put a dot (↺ ↻ move it by 1°), then join it to O or to A.
//   size            ∠P and ∠Q, each with a protractor already on it, one big, one small: ∠P, ∠Q or "Barabar".
// No snapping to the vertex or an arm (a snap would be the placement), no live reading of the angle (the reading is the
// skill), no timer. After a decision the law plays out what the protractor showed AS PLACED:
//   vertex-off / centre-on-arm (named)  the placement only: a ring on O and a dashed join to her centre (measure: her
//                number's chip stays neutral, no arm is drawn from her misplaced centre; draw: her own arm from O and the
//                angle it makes)
//   wrong-scale  the arm her number means on the scale whose 0 is on the arm, far from OB
//   join-wrong-end  the arm from A, and the angle it makes at A, with its number
//   size (a miss) her own pick, in the mix-up colour (never the readings: they would settle the next pick)
// Judging round 2 (dc-r8-game-modes-three-laws): measure's reading is TYPED on a number pad (no tap prints a value: the game
// never reads the scale for her); draw's miss shows only her arm and the angle it makes (never the asked arm), and the dot
// nudges by 1° (↺ ↻); green means right and only right (her selection takes the focus colour, her wrong value the mix-up
// colour); the line under the board says what to do after "Rakh do"; the end line counts the checks, and a solve after a
// miss ends with a pale tick; the join buttons' order varies by level.
// Judging round 3 (RULINGS-2026-11-11-evening, kon/place): her number is graded only on a placed protractor (an off
// placement plays out the placement only, her chip neutral); the letter O stands clear of every line of the protractor in
// every pose; a scale number slides along its tick, or both numbers at a tick go, never one scale alone (kon.scale.ts); the
// scale numbers are drawn last, over the arms and her lines, on a ground halo; four one-pixel position nudges (← ↑ ↓ →)
// beside the turn arrows; "kinare par"; size's end line says what she found.
import type { KonAct, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, type ControlSpec, type FamilyView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { say } from "../../copy.ts";
import { word } from "../../engines/words.ts";
import type { KonParams, KonState } from "./kon.logic.ts";
import { ARM, BH, BW, KNOB_AT, PD, PR, PRINT_EVERY, SIZE_PRINT_EVERY, arms, centreRingShown, dir, farEnd, initPlace, joinAFirst, madeAngle, norm, placement, rimAngleOf, rimPoint, sizeAnswer, sizeFigs, type Pose } from "./kon.place.ts";
import { ROLE, around, freeSpot, type Avoid, type Box } from "./kon.spot.ts";
import { INK_H, LETTER_PX, letterSpot, numberBox, protractorLines, scaleLabels, scaleOmitFor, type Measure, type ScaleLabel } from "./kon.scale.ts";

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
  /** measure: the reading she is typing on the pad (not an act until "Yahi hai") */
  let typed = "";
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
    if (last?.kind === "undo" || last?.kind === "free") { truthAt = -1; typed = ""; }
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
      // locked, draw: a tap on the rim puts the dot (measure: nothing on the board prints a value; she types the reading)
      if (goal !== "draw") return;
      const q = P0.pose, d = Math.hypot(x - q.x, y - q.y), r = rimAngleOf(q, x, y);
      if (r < -6 || r > 186 || d < PR - 48 || d > PR + 32) return;
      act({ kind: "mark", r: clamp(Math.round(r), 0, 180) });
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
  /** this frame's lines and boxes the letters keep clear of, beyond the audit's (the arcs, the join to the centre, the
   *  dots, the ring, the chips about to be drawn), and the scale numbers laid out but drawn last (over every line) */
  type Frame = { lines: [Pt, Pt][]; boxes: Box[]; nums: ScaleLabel[]; drawn: number };
  let frame: Frame = { lines: [], boxes: [], nums: [], drawn: 0 };
  const dotBox = (o: Pt, r: number): Box => ({ x: o[0] - r, y: o[1] - r, w: 2 * r, h: 2 * r });
  function arcAt(c: CanvasRenderingContext2D, o: Pt, r: number, a0: number, a1: number, role: string, width = 2.5, dash?: number[]): void {
    // the smaller turn from heading a0 to a1, about board point o, radius r (screen px)
    let d = norm(a1 - a0); if (d > 180) d -= 360;
    const [x, y] = S(...o);
    c.save(); c.beginPath(); c.strokeStyle = api.P.color(role as never); c.lineWidth = width; if (dash) c.setLineDash(dash);
    c.arc(x, y, r, -rad(a0), -rad(a0 + d), d > 0); c.stroke(); c.restore();
    // its chords, for the letters
    const n = Math.max(2, Math.ceil(Math.abs(d) / 10)), at = (t: number): Pt => [x + r * Math.cos(rad(a0 + (d * t) / n)), y - r * Math.sin(rad(a0 + (d * t) / n))];
    for (let i = 0; i < n; i++) frame.lines.push([at(i), at(i + 1)]);
  }
  const ray = (o: Pt, h: number, len: number): Pt[] => { const [c, n] = dir(h); return [S(...o), S(o[0] + c * len, o[1] + n * len)]; };
  /** A letter just beyond a point, away from the vertex (judging round 3, ruling 2): never on a line of the protractor (the
   *  bottom edge struck through O on the placed screens), nor on an arm or her line, an arc, a dot or the ring, and SCALE_GAP
   *  px clear of every scale number and chip (the hold: "80O"). It keeps to its own side of the point and steps further out
   *  before it swings round (kon.scale.ts letterSpot) */
  function letter(c: CanvasRenderingContext2D, t: string, at: Pt, away: number, off = 14): void {
    const P = api.P, o = S(...at);
    c.save(); c.font = `700 ${Math.max(LETTER_PX, P.minText)}px ${api.art.font.ui}`; const w = c.measureText(t).width; c.restore();
    const h = Math.max(LETTER_PX, P.minText) * INK_H;
    const avoid: Avoid = {
      segs: [...P.audit.segs.map((g): [Pt, Pt] => [[g.x0, g.y0], [g.x1, g.y1]]), ...frame.lines],
      boxes: [...frame.nums.map(numberBox), ...frame.boxes],
    };
    const [dx, dy] = dir(away), def = S(at[0] + dx * off, at[1] + dy * off);
    const spot = letterSpot(o, -rad(away), [off, off + 8, off + 16, off + 26, off + 38].map((r) => r * s), w, h, avoid, { x: 2, y: 2, w: api.w - 4, h: api.h - 4 }) ?? def;
    P.text(c, t, spot[0], spot[1], { size: LETTER_PX, weight: 700, role: "ink2" });
    frame.boxes.push({ x: spot[0] - w / 2, y: spot[1] - h / 2, w, h });
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
    // the base line through the centre, the ticks (every 5°, longer every 10°) and the centre mark, from kon.scale.ts's lines;
    // every line of the protractor is declared ("prot") for the letters and the layout check
    for (const L of protractorLines(cx, cy, R, depth, q.rot, rad0)) {
      if (L.kind === "base") P.stroke(c, [L.a, L.b], { role: "ink3", width: 1.5 });
      else if (L.kind === "tick") P.stroke(c, [L.a, L.b], { role: "ink3", width: (L.deg ?? 0) % 30 === 0 ? 1.8 : 1 });
      else if (L.kind === "mark") P.stroke(c, [L.a, L.b], { role: "ink", width: 1.5 });
      P.noteSeg("prot", L.a, L.b);
    }
    P.circle(c, cx, cy, 3.5, { role: "ink", fill: true });
    frame.boxes.push(dotBox([cx, cy], 3.5));
    // both scales numbered (outer from this end, inner from the other), where kon.scale.ts puts them: no two numbers closer
    // than SCALE_GAP px at this size and turn (a clashing number slides along its tick; only where none can, both numbers at
    // that tick go, never one scale alone: judging round 3, ruling 3); size: the big and the small protractor print the same
    // numbers. They are drawn last, over the arms and her lines, on a ground halo (ruling 4): numbers()
    const every = goal === "size" ? SIZE_PRINT_EVERY[p.scale] : PRINT_EVERY[p.scale];
    const meas: Measure = (t, px) => { c.save(); c.font = `700 ${px}px ${api.art.font.mono}`; const w = c.measureText(t).width; c.restore(); return w; };
    const radii = goal === "size" ? sizeFigs(p).map((f) => ({ R: f.rad * s, rad0: f.rad })) : [{ R, rad0 }];
    const omits = scaleOmitFor(radii, every, fs(), meas, q.rot), k = Math.max(0, radii.findIndex((r) => r.rad0 === rad0));
    frame.nums.push(...scaleLabels({ rot: q.rot, R, rad0, every, fs: fs(), measure: meas, omit: omits[k] }, cx, cy));
    // the drawn size of the protractor, for the layout check (its size never changes while she reads)
    P.note("protractor", cx - R, cy - R, 2 * R, R + depth);
    if (o.knob) {
      // the turning handle on the body: a ring the arms show through
      const [kx, ky] = S(...knobAt(q));
      P.circle(c, kx, ky, 16, { role: ROLE.focus, width: 3 });
      frame.boxes.push(dotBox([kx, ky], 17));
      // two turning arrows on the handle
      c.save(); c.strokeStyle = P.color(ROLE.focus); c.lineWidth = 2.5; c.beginPath(); c.arc(kx, ky, 8, 0.3, 2.5); c.stroke(); c.beginPath(); c.arc(kx, ky, 8, 3.4, 5.6); c.stroke(); c.restore();
      api.target("turn", kx - knobR(), ky - knobR(), knobR() * 2, knobR() * 2);
    }
  }
  /** the scale numbers laid out so far, drawn over every line on a ground halo (judging round 3, ruling 4: OB ran through
   *  the inner 160 and the outer 20 she must read) */
  function numbers(c: CanvasRenderingContext2D): void {
    for (const L of frame.nums.slice(frame.drawn)) {
      api.P.text(c, L.s, L.x, L.y, { size: fs(), weight: L.ring === "outer" ? 700 : 600, font: "mono", role: L.ring === "outer" ? "ink2" : "ink3", halo: true });
    }
    frame.drawn = frame.nums.length;
  }

  /** an arm or ray, drawn and declared to the layout audit (chips must not sit across it) */
  function line(c: CanvasRenderingContext2D, pts: Pt[], o: { role: string; width?: number; dash?: number[] }): void {
    api.P.stroke(c, pts, o as never);
    api.P.noteSeg("arm", pts[0], pts[pts.length - 1]);
  }
  /** measure: where her reading's chip sits (the protractor is not there): under it when it sits high, over it when low */
  const readChipAt = (q: Pose): Pt => S(BW / 2, q.y > BH / 2 - 30 ? 22 : BH - 16);
  type Chip = { s: string; at: Pt; size: number; role?: string };
  function draw(c: CanvasRenderingContext2D): void {
    frame = { lines: [], boxes: [], nums: [], drawn: 0 };
    if (goal === "size") return drawSize(c);
    const P = api.P, S0 = st(), P0 = ps(), q = pose(), V: Pt = [p.vx ?? 0, p.vy ?? 0], hs = arms(p);
    const run = truthAt >= 0 && S0.commits > 0;
    // the angle: OA (and OB)
    for (const h of hs) line(c, ray(V, h, ARM), { role: "ink", width: 3.5 });
    P.circle(c, ...S(...V), 4.5, { role: "ink", fill: true });
    frame.boxes.push(dotBox(S(...V), 4.5));
    // the protractor (its numbers come last)
    protractor(c, q, PR, { knob: !P0.locked && !S0.done, locked: P0.locked });
    if (!P0.locked) {
      // its body is the drag target (the bounding box of the half-disc)
      const [cx, cy] = S(q.x, q.y), R = PR * s;
      api.target("protractor", cx - R, cy - R, R * 2, R * 2);
    } else {
      const [cx, cy] = S(q.x, q.y), R = (PR + 32) * s;
      api.target("scale", cx - R, cy - R, R * 2, R * 2);
    }
    // draw: the dot, and the arm she joined (focus colour; green when right, the mix-up colour while a miss plays out)
    let bAt: { at: Pt; h: number } | null = null;
    if (goal === "draw" && P0.mark !== null && P0.locked) {
      const D = rimPoint(q, P0.mark);
      const role = S0.done ? ROLE.answer : run && P0.joined ? ROLE.mixup : ROLE.focus;
      if (P0.joined && (run || S0.done)) {
        const from: Pt = P0.joined === "v" ? V : farEnd(p), h = (Math.atan2(D[1] - from[1], D[0] - from[0]) * 180) / Math.PI;
        const len = Math.max(ARM, Math.hypot(D[0] - from[0], D[1] - from[1]) + 30);
        line(c, ray(from, h, len), { role, width: 3.5 });
        // the finished arm carries its letter B
        if (S0.done) { const [bc, bn] = dir(h); bAt = { at: [from[0] + len * bc, from[1] + len * bn], h }; }
      }
      P.circle(c, ...S(...D), 6, { role, fill: true });
      frame.boxes.push(dotBox(S(...D), 6));
    }
    // the play-out's lines (the ring and join, her number's arm, the arcs)
    if (run) drawRunLines(c, q, V, hs);
    // the numbers over every line, on their halo
    numbers(c);
    // the chips this frame (laid out first: the letters keep clear of them)
    const chips: Chip[] = [];
    // measure: the number she is typing (focus colour), or the one she gave: green once right; after a miss the mix-up
    // colour only on a placed protractor (judging round 3, ruling 1: her number is graded only on a placed protractor, so
    // on an off placement her chip stays neutral, whatever the number)
    if (goal === "measure" && P0.locked) {
      const shown = run && !typed;
      const n = typed ? typed : P0.read !== null && (shown || S0.done) ? String(P0.read) : "";
      const role = typed ? ROLE.focus : S0.done ? ROLE.answer : placement(p, P0.pose).ok ? ROLE.mixup : undefined;
      if (n) chips.push({ s: `${n}°`, at: readChipAt(q), size: 16, role });
    }
    // draw, after a miss: the angle her arm makes, named by its corner, where the protractor is not
    if (goal === "draw" && run && !S0.done && P0.mark !== null && P0.joined && api.t - truthAt > 0.4) {
      chips.push({ s: `∠${P0.joined === "v" ? "O" : "A"} ${Math.round(madeAngle(p, q, P0.mark, P0.joined))}°`, at: S(BW / 2, q.y > BH / 2 - 30 ? 22 : BH - 16), size: 15, role: ROLE.mixup });
    }
    for (const ch of chips) { const z = P.chipSize(c, ch.s, { size: ch.size }); frame.boxes.push({ x: ch.at[0] - z.w / 2, y: ch.at[1] - z.h / 2, w: z.w, h: z.h }); }
    // the letters on top of everything, so they stay readable where the protractor lies: the arm letters well past the arm
    // ends, O away from the angle's opening (the asked angle's, in draw too); each clear of every line and number (letter())
    const th = p.theta ?? 0, a2 = norm(p.start + (p.mirror ? -1 : 1) * th);
    const bis = p.start + (norm(a2 - p.start) > 180 ? (norm(a2 - p.start) - 360) / 2 : norm(a2 - p.start) / 2);
    letter(c, "A", farEnd(p), hs[0], 24);
    if (hs.length === 2) { const [bc, bn] = dir(hs[1]); letter(c, "B", [V[0] + ARM * bc, V[1] + ARM * bn], hs[1], 24); }
    letter(c, "O", V, bis + 180, 24);
    if (bAt) letter(c, "B", bAt.at, bAt.h, 14);
    for (const ch of chips) P.chip(c, ch.s, ch.at[0], ch.at[1], { size: ch.size, ...(ch.role ? { role: ch.role as never } : {}) });
    if (run && S0.done) drawEndTick(c, q, V);
  }
  /** the law's play-out after a decision, its lines (its beats all land before RUN_END) */
  function drawRunLines(c: CanvasRenderingContext2D, q: Pose, V: Pt, hs: number[]): void {
    const P = api.P, S0 = st(), P0 = ps(), k = clamp((api.t - truthAt) / 0.5, 0, 1);
    if (S0.done) return;
    // vertex-off (her committed placement is the bottom edge on O), or centre-on-arm where the level names it: a ring on O
    // and a dashed join to the centre. Any other off placement shows nothing of where the centre belongs.
    if (centreRingShown(p, st(), true, level.mal)) {
      const [ox2, oy2] = S(...V), rr = 7 * k + 1;
      P.circle(c, ox2, oy2, rr, { role: ROLE.mixup, width: 2 });
      P.note("ring", ox2 - rr, oy2 - rr, 2 * rr, 2 * rr);
      frame.boxes.push(dotBox([ox2, oy2], 9));
      P.stroke(c, [S(...V), S(q.x, q.y)], { role: ROLE.mixup, width: 2, dash: [4, 3] });
      frame.lines.push([S(...V), S(q.x, q.y)]);
    }
    if (goal === "measure") {
      if (P0.read === null || typed) return;
      // judging round 3 (ruling 1): her number is graded only on a placed protractor. Placed off, the play-out shows the
      // placement only (the ring and the join above, where the level names it): no arm from her misplaced centre, which ran
      // beside OB and told her a right number was right
      const pl = placement(p, q);
      if (!pl.ok) return;
      // her number, on the scale whose 0 is on the placed arm: the arm it means, from the protractor's centre
      const r = pl.zeroOnArm ? P0.read : 180 - P0.read, h = norm(q.rot + r);
      line(c, ray([q.x, q.y], h, ARM * k), { role: ROLE.mixup, width: 3, dash: [7, 5] });
      if (k >= 1) arcAt(c, [q.x, q.y], PR * 0.42 * s, hs[1 - pl.arm], h, ROLE.mixup, 3, [5, 4]);
      return;
    }
    // draw: the angle she made, at the end she joined; never the asked arm (law 2: no line to trace); its number is a chip
    if (P0.mark === null || !P0.joined) return;
    const at: Pt = P0.joined === "v" ? V : farEnd(p), D = rimPoint(q, P0.mark), hD = norm((Math.atan2(D[1] - at[1], D[0] - at[0]) * 180) / Math.PI);
    const base = P0.joined === "v" ? hs[0] : norm(hs[0] + 180), made = madeAngle(p, q, P0.mark, P0.joined);
    // (a narrow angle gets a wider arc, so it runs at least 24 board px: the ∠A arc of a join to A is often 20°)
    arcAt(c, at, Math.min(72, Math.max(30, 24 / ((Math.max(made, 1) * Math.PI) / 180))) * s, base, hD, ROLE.mixup, 3);
  }
  /** the end tick of a solve, with her answer */
  function drawEndTick(c: CanvasRenderingContext2D, q: Pose, V: Pt): void {
    const P = api.P, P0 = ps(), kt = clamp((api.t - truthAt - 0.3) / 0.3, 0, 1);
    if (goal === "measure" && P0.read !== null) {
      // the tick sits with her answer: beside her reading's chip
      const [hx, hy] = readChipAt(q), w = P.chipSize(c, `${P0.read}°`, { size: 16 }).w;
      endTick(c, hx + w / 2 + 18, hy, kt);
      return;
    }
    // draw: beside the end of the arm she drew, clear of its letter B and of every line
    const D = P0.mark !== null ? rimPoint(q, P0.mark) : V, h = Math.atan2(D[1] - V[1], D[0] - V[0]);
    const len = Math.max(ARM, Math.hypot(D[0] - V[0], D[1] - V[1]) + 30), end = S(V[0] + len * Math.cos(h), V[1] + len * Math.sin(h));
    const at = freeSpot(around(end, [26, 36, 48], -h + Math.PI / 2), 22, 18, avoidHere(), { x: 2, y: 2, w: api.w - 4, h: api.h - 4 }) ?? [end[0] + 24, end[1]];
    endTick(c, at[0], at[1], kt);
  }
  /** the end tick: full on a first-try solve, pale after a miss (the end screen tells the two apart, without words) */
  function endTick(c: CanvasRenderingContext2D, x: number, y: number, k: number): void {
    if (st().commits > 1) { c.save(); c.globalAlpha *= 0.42; api.P.tick(c, x, y, 18, k); c.restore(); }
    else api.P.tick(c, x, y, 18, k);
  }
  /** what a chip or a tick must keep clear of: every line, letter and mark drawn so far this frame */
  function avoidHere() {
    const A = api.P.audit;
    return {
      segs: A.segs.filter((g) => g.kind !== "prot").map((g): [Pt, Pt] => [[g.x0, g.y0], [g.x1, g.y1]]),
      boxes: [...A.texts.map((t) => ({ x: t.x - t.w / 2, y: t.y - t.px * 0.6, w: t.w, h: t.px * 1.2 })), ...A.marks.filter((m) => m.kind !== "dot" && m.kind !== "protractor")],
    };
  }
  function drawSize(c: CanvasRenderingContext2D): void {
    const P = api.P, S0 = st(), figs = sizeFigs(p), names = ["P", "Q"];
    const run = truthAt >= 0 && S0.commits > 0, k = clamp((api.t - truthAt - 0.2) / 0.4, 0, 1);
    // the play-out after a miss: her own pick in the mix-up colour (never the readings: a pick remains)
    const missed = run && !S0.done && k > 0, pick = ps().pick;
    const labels: Pt[] = [];
    // both figures' arms first, so every scale number lies over them (judging round 3, ruling 4)
    for (const f of figs) {
      const a0 = f.mirror ? 180 : 0, a1 = norm(a0 + (f.mirror ? -1 : 1) * f.th), len = f.rad + 20;   // (+30 ran off the board top at 1366)
      for (const h of [a0, a1]) line(c, ray(f.v, h, len), { role: "ink", width: 3.5 });
      P.circle(c, ...S(...f.v), 4.5, { role: "ink", fill: true });
    }
    figs.forEach((f, i) => {
      // always upright: a mirrored angle opens from the left arm, so its reading is on the inner scale (0 on the left)
      protractor(c, { x: f.v[0], y: f.v[1], rot: 0 }, f.rad, { locked: true });
      numbers(c);
      // the angle's name below its vertex, outside the strip
      const [X, Y] = S(f.v[0], f.v[1] - PD * (f.rad / PR) - 12);
      labels.push([X, Y]);
      if (missed && pick === (i === 0 ? "a" : "b")) P.chip(c, `∠${names[i]}`, X, Y + 4 * s, { size: 16, role: ROLE.mixup });   // (a little lower: clear of the strip)
      else P.text(c, `∠${names[i]}`, X, Y, { size: 16, weight: 700, role: "ink2" });
    });
    // "Barabar" (the same): between the two figures, as a statement of both
    const between = (): Pt => {
      const top = S(BW / 2, figs[1].v[1] + figs[1].rad + 16)[1], [lx, ly] = labels[0], y = (top + ly) / 2;
      const segs = api.P.audit.segs.filter((g) => g.kind !== "prot").map((g): [Pt, Pt] => [[g.x0, g.y0], [g.x1, g.y1]]);
      const boxes = api.P.audit.texts.map((t) => ({ x: t.x - t.w / 2, y: t.y - t.px * 0.6, w: t.w, h: t.px * 1.2 }));
      const w = api.P.chipSize(c, "∠P = ∠Q", { size: 15 }).w + 44;
      const cands: Pt[] = [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5].map((j) => [lx + j * 26 * s, y]);
      return freeSpot(cands, w, 30, { segs, boxes }, { x: 0, y: 0, w: api.w, h: api.h }) ?? cands[0];
    };
    if (missed && pick === "same") { const [X, Y] = between(); P.chip(c, "∠P = ∠Q", X, Y, { size: 15, role: ROLE.mixup }); }
    if (run && S0.done) {
      // the tick sits with her answer: beside the angle she picked, or, for "Barabar", beside "∠P = ∠Q" between the two
      // figures (a statement of both, tied to neither name)
      if (pick === "a" || pick === "b") { const [X, Y] = labels[pick === "a" ? 0 : 1]; endTick(c, X + 34, Y, k); return; }
      const [X, Y] = between(), cw = P.chipSize(c, "∠P = ∠Q", { size: 15 }).w;
      P.chip(c, "∠P = ∠Q", X - 14, Y, { size: 15, role: "ink" });
      endTick(c, X - 14 + cw / 2 + 18, Y, k);
    }
  }

  function goalLine(): string {
    const S0 = st(), P0 = ps();
    // the end: a neutral line of what she did, with the number of checks (no praise, no rule)
    if (S0.done) {
      if (goal === "measure") return word(lang, "kon.end.read", { n: `${P0.read}°`, k: S0.commits });
      if (goal === "draw") return word(lang, "kon.end.draw", { a: `${p.theta}°`, k: S0.commits });
      // size (judging round 3, ruling 6): what she found, then the checks
      const key = sizeAnswer(p);
      return key === "same" ? word(lang, "kon.end.size.same", { k: S0.commits }) : word(lang, "kon.end.size.more", { n: key === "a" ? "∠P" : "∠Q", k: S0.commits });
    }
    // after "Rakh do" the line says what to do next (never which scale, never where the dot goes)
    if (goal === "measure") return word(lang, P0.locked ? "kon.goal.measure.read" : "kon.goal.measure");
    if (goal === "draw") return word(lang, P0.locked ? "kon.goal.draw.mark" : "kon.goal.draw", { a: `${p.theta}°` });
    return word(lang, "kon.goal.size3");
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
    const { x, y, rot } = P0.pose;
    // judging round 3 (ruling 5): four one-pixel position nudges beside the turn arrows (one board px; the law's own move
    // act, so no snap, no reading, no cue beyond the protractor moving)
    const nudge = (id: string, key: "kon.aria.left" | "kon.aria.right" | "kon.aria.up" | "kon.aria.down", label: string, dx: number, dy: number): ControlSpec => ({ id, label, aria: word(lang, key), kind: "pad", group: "nudge",
      disabled: x + dx < 0 || x + dx > BW || y + dy < 0 || y + dy > BH, onPress: () => act({ kind: "move", x: x + dx, y: y + dy }) });
    if (!P0.locked) return [
      { id: "nudge-left", label: "↺", aria: word(lang, "kon.aria.acw"), kind: "pad", group: "nudge", onPress: () => act({ kind: "spin", deg: norm(rot + 1) }) },
      { id: "nudge-right", label: "↻", aria: word(lang, "kon.aria.cw"), kind: "pad", group: "nudge", onPress: () => act({ kind: "spin", deg: norm(rot - 1) }) },
      nudge("move-left", "kon.aria.left", "←", -1, 0), nudge("move-up", "kon.aria.up", "↑", 0, 1), nudge("move-down", "kon.aria.down", "↓", 0, -1), nudge("move-right", "kon.aria.right", "→", 1, 0),
      undo,
      { id: "lock", label: word(lang, "kon.lock"), kind: "primary", group: "go", you: true, onPress: () => act({ kind: "lock" }) },
    ];
    const free: ControlSpec = { id: "free", label: word(lang, "kon.free"), kind: "secondary", group: "go", onPress: () => act({ kind: "free" }) };
    if (goal === "measure") {
      // the number pad: she types the reading (0 … 180); a new digit ends the last play-out
      const key = (d: string): ControlSpec => ({ id: `k${d}`, label: d, kind: "pad", group: "pad", disabled: typed.length >= 3 || typed === "0" || Number(typed + d) > 180,
        onPress: () => { typed += d; truthAt = -1; api.sfx("select"); api.invalidate(); deps.changed(); } });
      return [
        ...["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map(key),
        { id: "kdel", label: "⌫", aria: word(lang, "kon.aria.del"), kind: "pad", group: "pad", disabled: !typed, onPress: () => { typed = typed.slice(0, -1); api.invalidate(); deps.changed(); } },
        // "Wapas" after the lock too: one step back (the lock, or her last decision)
        free, undo,
        { id: "commit", label: word(lang, "kon.this"), kind: "primary", group: "go", you: !!typed, disabled: !typed, onPress: () => { if (!typed) return; const n = Number(typed); typed = ""; act({ kind: "read", n }); } },
      ];
    }
    const m = P0.mark, mv = (d: number) => () => { if (m !== null) act({ kind: "mark", r: clamp(m + d, 0, 180) }); };
    // the two join buttons in an order that varies by level (judging round 2: "O se jodo" was always first)
    const joins: ControlSpec[] = [
      { id: "join-o", label: word(lang, "kon.join", { p: "O" }), kind: "choice", group: "join", disabled: m === null, onPress: () => act({ kind: "join", end: "v" }) },
      { id: "join-a", label: word(lang, "kon.join", { p: "A" }), kind: "choice", group: "join", disabled: m === null, onPress: () => act({ kind: "join", end: "e" }) },
    ];
    if (joinAFirst(level.seed)) joins.reverse();
    return [
      // the dot nudges 1° along the rim (1° is under 2 px on a phone); arrows, not −1 / +1, which would name one scale
      { id: "dot-acw", label: "↺", aria: word(lang, "kon.aria.dotAcw"), kind: "pad", group: "nudge", disabled: m === null || m >= 180, onPress: mv(1) },
      { id: "dot-cw", label: "↻", aria: word(lang, "kon.aria.dotCw"), kind: "pad", group: "nudge", disabled: m === null || m <= 0, onPress: mv(-1) },
      ...joins,
      free, undo,
    ];
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, goal: goalLine, readouts, controls, react, dragging: () => drag !== null };
  return view;
}
