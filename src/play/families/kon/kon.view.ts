// Kon · the 2D view (the board twin and the 2D-tier view of the angles law; round 4 G1). A dial at the world's centre: the
// start arm (turn) or the base arm (set), and the child's arm, turned by dragging anywhere around the centre (or ◀ ▶). A set
// level draws a protractor with BOTH scales (the outer from the base arm, the inner from the other side): reading the other
// scale is the misconception it shows. After a commit the law's arm rises and the turn between the two is drawn with its
// size. No snapping (a snap would be the answer), no timer.
// r7: zone (a kind of angle from a tilted base, or match a long-armed reference: no numbers), pair (a straight line A–O–B,
// ∠AOC stated, the protractor only from B) and close (a triangle on AB: ∠A drawn, the arm turns at B; the triangle closes
// where the arms meet). The pair and close protractors carry ONE scale (the other would be the answer).
import type { KonAct, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import { diff, meets, norm, targetOf, type KonParams, type KonState } from "./kon.logic.ts";

export const makeKonView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<KonParams, KonState, KonAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, setGoal = p.goal === "set";
  // a protractor on the base arm: set (both scales), linear / tri / iso (one scale, from the base arm only)
  const protractor = setGoal || p.goal === "linear" || p.goal === "tri" || p.goal === "iso";
  const triGoal = p.goal === "tri" || p.goal === "iso";
  const sign = p.mirror ? -1 : 1;
  let cx = 180, cy = 260, R = 120, armR = 1;
  let ax = 0, refX = 0, refY = 0, refR = 0;
  let drag = false, shown: number | null = null, truthAt = -1;
  const st = () => ctl.state;
  const rad = (d: number) => (d * Math.PI) / 180;
  const pt = (d: number, r: number): [number, number] => [cx + Math.cos(rad(d)) * r, cy - Math.sin(rad(d)) * r];
  const headingAt = (x: number, y: number) => norm((Math.atan2(cy - y, x - cx) * 180) / Math.PI);

  function layout(w: number, h: number): void {
    R = clamp(Math.min(w, h) * 0.36, 90, 220); armR = 0.95;
    cx = w / 2; cy = setGoal ? clamp(h * 0.62, R + 40, h - 60) : h / 2;
    if (p.goal === "linear") { R = clamp(Math.min(w * 0.4, h * 0.36), 90, 220); cy = clamp(h * 0.66, R + 40, h - 60); }
    if (triGoal) {
      // B (the turning vertex) right of centre, A on the base line to its left
      R = clamp(Math.min(w * 0.3, h * 0.3), 80, 190);
      // the protractor's end labels sit R + 18 out: keep "180" inside the box
      cx = clamp(w * 0.64, R + 30, w - R - 40); cy = clamp(h * 0.72, R + 40, h - 50); ax = clamp(cx - R * 1.6, 24, cx - R);
    }
    if (p.goal === "match") {
      // the reference angle above with long arms and a big arc; the child's dial below with short arms
      refR = clamp(Math.min(w * 0.42, h * 0.22), 70, 260); refX = w / 2; refY = clamp(h * 0.26, refR * 0.5 + 10, h / 2);
      R = clamp(Math.min(w * 0.32, h * 0.2), 70, 160); cy = clamp(h * 0.74, refY + refR + 20, h - R - 20); armR = 0.55;
    }
  }
  /** an arc for the opening from heading a0 by `open` degrees in the goal's sense */
  function arc(c: CanvasRenderingContext2D, x: number, y: number, r: number, a0: number, open: number, s0: number, role: string, width = 3): void {
    c.save(); c.beginPath(); c.strokeStyle = api.P.color(role as never); c.lineWidth = width;
    c.arc(x, y, r, -rad(a0), -rad(a0 + s0 * open), s0 > 0); c.stroke(); c.restore();
  }
  function act(a: KonAct): void { ctl.dispatch(a); deps.changed(); }
  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as KonAct | undefined;
    if (last?.kind === "turn" && !refused) api.sfx("slide");
    if (last?.kind === "commit" && refused !== "turn_first") { truthAt = api.t; api.sfx("land"); api.fx.shake(2); }
    for (const m of ms) {
      if (m.kind === "solved") { setTimeout(() => api.sfx("good"), 200); const [x, y] = pt(st().heading ?? targetOf(p), R * armR); api.fx.burst(x, y, { n: 14, color: api.P.color("good"), speed: 110, life: 0.6, size: 3, kind: "spark" }); }
      if (m.kind === "misconception_consequence" || m.kind === "law_refused" || m.kind === "near_miss") setTimeout(() => api.sfx("look"), 200);
    }
    if (last?.kind === "undo") truthAt = -1;
    api.invalidate(); deps.changed();
  }
  function pointer(kind: PointerKind, x: number, y: number): void {
    if (st().done) return;
    if (kind === "down") { if (Math.hypot(x - cx, y - cy) > R * 1.35) return; drag = true; ctl.finger(true); shown = headingAt(x, y); api.sfx("select"); }
    else if (kind === "move" && drag) shown = headingAt(x, y);
    else if ((kind === "up" || kind === "cancel") && drag) { drag = false; ctl.finger(false); if (shown !== null) act({ kind: "turn", deg: +shown.toFixed(1) }); }
    api.invalidate(); if (kind !== "move") deps.changed();
  }
  const update = () => { /* the arm follows the finger directly (no tween on the child's own act) */ };
  const busy = () => drag || (truthAt >= 0 && api.t - truthAt < 0.6);

  function draw(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st();
    api.target("dial", cx - R * 1.35, cy - R * 1.35, R * 2.7, R * 2.7);
    if (!triGoal && p.goal !== "linear") P.circle(c, cx, cy, R, { role: "ink3", width: 2 });
    if (p.goal === "linear") {
      // the straight line A–O–B; ∠AOC is stated in the goal, never drawn
      P.stroke(c, [pt(180, R * 1.15), pt(0, R * 1.15)], { role: "ink", width: 4 });
      P.text(c, "A", ...pt(180, R * 1.15 + 16), { size: 16, weight: 700, role: "ink2" });
      P.text(c, "B", ...pt(0, R * 1.15 + 16), { size: 16, weight: 700, role: "ink2" });
      P.text(c, "O", cx, cy + 22, { size: 15, weight: 700, role: "ink2" });
    }
    if (triGoal) {
      // base AB, and ∠A drawn at A (iso by apex: ∠A is not given, so A's arm is drawn without a number)
      const aAng = p.goal === "tri" || p.isoBy !== "apex" ? (p.given ?? 0) : (180 - (p.apex ?? 0)) / 2;
      // A's arm runs long (the apex can sit far up) but never leaves the box: cut at 8 px from the left and top edges
      const cA = Math.cos(rad(aAng)), sA = Math.sin(rad(aAng));
      const aLen = Math.min((cx - ax) * 1.6, sA > 0 ? (cy - 8) / sA : Infinity, cA < 0 ? (ax - 8) / -cA : Infinity), aEnd: [number, number] = [ax + cA * aLen, cy - sA * aLen];
      P.stroke(c, [[ax, cy], [cx, cy]], { role: "ink", width: 4 });
      P.stroke(c, [[ax, cy], aEnd], { role: "ink2", width: 3 });
      arc(c, ax, cy, 28, 0, aAng, 1, "ink2", 2);
      // ∠A's number inside its arc, on the bisector (never on the base line, where B's protractor writes its 0)
      if (p.goal === "tri" || p.isoBy !== "apex") P.text(c, `${p.given}°`, ax + Math.cos(rad(aAng / 2)) * 52, cy - Math.sin(rad(aAng / 2)) * 52, { size: 14, weight: 700, font: "mono", role: "ink2" });
      P.text(c, "A", ax - 4, cy + 20, { size: 16, weight: 700, role: "ink2" });
      P.text(c, "B", cx + 4, cy + 20, { size: 16, weight: 700, role: "ink2" });
      // where the child's arm meets A's arm: the triangle closes there (no number on the top angle: that is the goal)
      const h0 = drag ? shown : st().heading;
      if (h0 !== null) {
        const tA = rad(aAng), tB = rad(h0);
        const den = Math.sin(tB - tA);
        const k = Math.abs(den) > 1e-3 ? ((cx - ax) * Math.sin(tB)) / den : -1;
        const apexX = ax + Math.cos(tA) * k, apexY = cy - Math.sin(tA) * k;
        if (k > 0 && apexY < cy - 8 && apexY > 0 && apexX > 0) {
          c.save(); c.beginPath(); c.moveTo(ax, cy); c.lineTo(cx, cy); c.lineTo(apexX, apexY); c.closePath();
          c.fillStyle = P.color("you"); c.globalAlpha = 0.12; c.fill(); c.restore();
          P.circle(c, apexX, apexY, 5, { role: "you", fill: true });
          P.text(c, "C", apexX, apexY - 16, { size: 16, weight: 700, role: "ink2" });
        }
      }
    }
    if (p.goal === "kind") {
      P.stroke(c, [[cx, cy], pt(p.start, R * 1.05)], { role: "ink", width: 4 });   // the base arm (any tilt)
      const cur0 = drag ? shown : st().heading;
      if (cur0 !== null) arc(c, cx, cy, R * 0.32, p.start, norm(sign * (cur0 - p.start)), sign, "you", 3);
    }
    if (p.goal === "match") {
      // the reference: long arms and a big arc (neither makes it bigger)
      const rp = (d: number, r: number): [number, number] => [refX + Math.cos(rad(d)) * r, refY - Math.sin(rad(d)) * r];
      P.stroke(c, [rp(p.refStart ?? 0, refR), [refX, refY], rp((p.refStart ?? 0) + (p.ref ?? 0), refR)], { role: "ink", width: 4 });
      arc(c, refX, refY, refR * 0.45, p.refStart ?? 0, p.ref ?? 0, 1, "ink2", 3);
      P.circle(c, refX, refY, 5, { role: "ink", fill: true });
      P.stroke(c, [[cx, cy], pt(p.start, R * armR)], { role: "ink", width: 4 });   // the child's base arm (short)
      const cur0 = drag ? shown : st().heading;
      if (cur0 !== null) arc(c, cx, cy, R * 0.22, p.start, norm(cur0 - p.start), 1, "you", 2);
    }
    if (protractor && !setGoal) {
      // one scale only, from the base arm
      const big = p.scale === "10" ? 30 : p.scale === "30" ? 30 : 90;
      for (let a = 0; a <= 180; a += 10) {
        const h = norm(p.start + sign * a), len = a % 30 === 0 ? 14 : 7;
        P.stroke(c, [pt(h, R), pt(h, R - len)], { role: "ink3", width: a % 30 === 0 ? 2 : 1.2 });
        if (a % big === 0 && (p.scale !== "10" || a % 30 === 0)) P.text(c, String(a), ...pt(h, R + 18), { size: 14, weight: 700, font: "mono", role: "ink2" });
      }
      c.save(); c.beginPath(); c.strokeStyle = P.color("ink3"); c.lineWidth = 1.5;
      c.arc(cx, cy, R, -rad(p.start), -rad(p.start + sign * 180), sign > 0); c.stroke(); c.restore();
    }
    if (setGoal) {
      // the protractor: ticks every 10°, both scales labelled every 30° (outer from the base arm, inner from the other side)
      const dirSign = p.mirror ? -1 : 1;
      const big = p.scale === "10" ? 10 : p.scale === "30" ? 30 : 90;
      for (let a = 0; a <= 180; a += 10) {
        const h = norm(p.start + dirSign * a), len = a % 30 === 0 ? 14 : 7;
        P.stroke(c, [pt(h, R), pt(h, R - len)], { role: "ink3", width: a % 30 === 0 ? 2 : 1.2 });
        if (a % 30 === 0 && a % big === 0) {
          // the inner numeral sits a few degrees inside the opening so the base arm never runs through it
          const [ox, oy] = pt(h, R + 18), [ix, iy] = pt(norm(h + dirSign * (a === 0 ? 7 : a === 180 ? -7 : 0)), R - 30);
          P.text(c, String(a), ox, oy, { size: 15, weight: 700, font: "mono", role: "ink2" });
          if (a !== 90) P.text(c, String(180 - a), ix, iy, { size: 14, weight: 600, font: "mono", role: "ink3" });
        }
      }
      P.stroke(c, [pt(p.start, R * 1.05), [cx, cy]], { role: "ink", width: 4 });   // the base arm
    } else if (p.goal === "turn") {
      for (const h of [0, 90, 180, 270]) P.circle(c, ...pt(h, R), 4, { role: "ink3", fill: true });
      P.stroke(c, [[cx, cy], pt(p.start, R * 0.9)], { role: "ink2", width: 4, dash: [8, 6] });   // where the arm starts
    }
    const cur = drag ? shown : s.heading;
    if (cur !== null) {
      P.stroke(c, [[cx, cy], pt(cur, R * armR)], { role: "you", width: 5 });
      const [kx, ky] = pt(cur, R * armR);
      P.circle(c, kx, ky, 10, { role: "you", fill: true });
    }
    P.circle(c, cx, cy, 6, { role: "ink", fill: true });
    // after a commit: the law's arm, and the turn between when it missed
    if (truthAt >= 0 && s.heading !== null) {
      const t = targetOf(p), hit = meets(p, s.heading), k = clamp((api.t - truthAt) / 0.35, 0, 1);
      // a kind is a zone: on a miss the law shows one angle of that kind; on a hit the child's own arm stands
      if (!hit || p.goal !== "kind") P.stroke(c, [[cx, cy], pt(t, R * armR * k)], { role: hit ? "good" : "ink2", width: 3 });
      if (!hit && k >= 1) {
        const a0 = rad(s.heading), a1 = rad(t);
        let d = a1 - a0; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
        c.save(); c.beginPath(); c.strokeStyle = P.color("look"); c.lineWidth = 3; c.setLineDash([5, 4]);
        c.arc(cx, cy, R * 0.55, -a0, -(a0 + d), d > 0); c.stroke(); c.restore();
        const g = Math.round(diff(s.heading, t));
        if (p.goal !== "kind") P.chip(c, say(lang, "line.gap", { g: `${g}°` }), cx, Math.min(cy + R + (protractor ? 18 : 34), api.h - 16), { size: 15, role: "look", font: "ui" });
      }
      if (hit) P.tick(c, ...pt(p.goal === "kind" ? s.heading : t, R * armR + 22), 18, clamp((api.t - truthAt - 0.3) / 0.3, 0, 1));
    }
  }

  const qWord = (q: number) => word(lang, `kon.q${q}` as WordKey);
  function goal(): string {
    if (setGoal) return word(lang, "kon.goal.set", { a: `${p.theta}°` });
    if (p.goal === "kind") return word(lang, "kon.goal.kind", { k: word(lang, `kon.kind.${p.kind ?? "right"}` as WordKey) });
    if (p.goal === "match") return word(lang, "kon.goal.match");
    if (p.goal === "linear") return word(lang, "kon.goal.linear", { a: `${p.given}°` });
    if (p.goal === "tri") return word(lang, "kon.goal.tri", { a: `${p.given}°`, c: `${p.apex}°` });
    if (p.goal === "iso") return p.isoBy === "apex" ? word(lang, "kon.goal.isoTop", { c: `${p.apex}°` }) : word(lang, "kon.goal.iso", { a: `${p.given}°` });
    return word(lang, "kon.goal.turn", { q: qWord(p.q ?? 1), dir: word(lang, p.dir === "acw" ? "kon.acw" : "kon.cw") });
  }
  // no live angle readout: reading the protractor IS the skill (a readout would be the answer)
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    const step = protractor ? 1 : 5, cur = s.heading;
    return [
      { id: "nudge-left", label: "↺", aria: "turn anticlockwise a little", kind: "pad", group: "nudge", disabled: cur === null, onPress: () => cur !== null && act({ kind: "turn", deg: norm(cur + step) }) },
      { id: "nudge-right", label: "↻", aria: "turn clockwise a little", kind: "pad", group: "nudge", disabled: cur === null, onPress: () => cur !== null && act({ kind: "turn", deg: norm(cur - step) }) },
      { id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) },
      { id: "commit", label: say(lang, "line.here"), kind: "primary", group: "go", you: cur !== null, disabled: cur === null, onPress: () => act({ kind: "commit" }) },
    ];
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, goal, readouts, controls, react, dragging: () => drag };
  return view;
};
