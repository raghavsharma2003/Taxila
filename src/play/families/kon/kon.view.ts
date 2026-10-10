// Kon · the 2D view (the board twin and the 2D-tier view of the angles law; round 4 G1). A dial at the world's centre: the
// start arm (turn) or the base arm (set), and the child's arm, turned by dragging anywhere around the centre (or ◀ ▶). A set
// level draws a protractor with BOTH scales (the outer from the base arm, the inner from the other side): reading the other
// scale is the misconception it shows. After a commit the law's arm rises and the turn between the two is drawn with its
// size. No snapping (a snap would be the answer), no timer.
import type { KonAct, Moment } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import { diff, norm, targetOf, type KonParams, type KonState } from "./kon.logic.ts";

export const makeKonView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<KonParams, KonState, KonAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, setGoal = p.goal === "set";
  let cx = 180, cy = 260, R = 120;
  let drag = false, shown: number | null = null, truthAt = -1;
  const st = () => ctl.state;
  const rad = (d: number) => (d * Math.PI) / 180;
  const pt = (d: number, r: number): [number, number] => [cx + Math.cos(rad(d)) * r, cy - Math.sin(rad(d)) * r];
  const headingAt = (x: number, y: number) => norm((Math.atan2(cy - y, x - cx) * 180) / Math.PI);

  function layout(w: number, h: number): void {
    R = clamp(Math.min(w, h) * 0.36, 90, 220);
    cx = w / 2; cy = setGoal ? clamp(h * 0.62, R + 40, h - 60) : h / 2;
  }
  function act(a: KonAct): void { ctl.dispatch(a); deps.changed(); }
  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as KonAct | undefined;
    if (last?.kind === "turn" && !refused) api.sfx("slide");
    if (last?.kind === "commit" && refused !== "turn_first") { truthAt = api.t; api.sfx("land"); api.fx.shake(2); }
    for (const m of ms) {
      if (m.kind === "solved") { setTimeout(() => api.sfx("good"), 200); const [x, y] = pt(targetOf(p), R); api.fx.burst(x, y, { n: 14, color: api.P.color("good"), speed: 110, life: 0.6, size: 3, kind: "spark" }); }
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
    P.circle(c, cx, cy, R, { role: "ink3", width: 2 });
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
    } else {
      for (const h of [0, 90, 180, 270]) P.circle(c, ...pt(h, R), 4, { role: "ink3", fill: true });
      P.stroke(c, [[cx, cy], pt(p.start, R * 0.9)], { role: "ink2", width: 4, dash: [8, 6] });   // where the arm starts
    }
    const cur = drag ? shown : s.heading;
    if (cur !== null) {
      P.stroke(c, [[cx, cy], pt(cur, R * 0.95)], { role: "you", width: 5 });
      const [kx, ky] = pt(cur, R * 0.95);
      P.circle(c, kx, ky, 10, { role: "you", fill: true });
    }
    P.circle(c, cx, cy, 6, { role: "ink", fill: true });
    // after a commit: the law's arm, and the turn between when it missed
    if (truthAt >= 0 && s.heading !== null) {
      const t = targetOf(p), hit = diff(s.heading, t) <= p.tol, k = clamp((api.t - truthAt) / 0.35, 0, 1);
      P.stroke(c, [[cx, cy], pt(t, R * 0.95 * k)], { role: hit ? "good" : "ink2", width: 3 });
      if (!hit && k >= 1) {
        const a0 = rad(s.heading), a1 = rad(t);
        let d = a1 - a0; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
        c.save(); c.beginPath(); c.strokeStyle = P.color("look"); c.lineWidth = 3; c.setLineDash([5, 4]);
        c.arc(cx, cy, R * 0.55, -a0, -(a0 + d), d > 0); c.stroke(); c.restore();
        const g = Math.round(diff(s.heading, t));
        P.chip(c, say(lang, "line.gap", { g: `${g}°` }), cx, cy + R + (setGoal ? 18 : 34), { size: 15, role: "look", font: "ui" });
      }
      if (hit) P.tick(c, ...pt(t, R + 22), 18, clamp((api.t - truthAt - 0.3) / 0.3, 0, 1));
    }
  }

  const qWord = (q: number) => word(lang, `kon.q${q}` as WordKey);
  function goal(): string {
    if (setGoal) return word(lang, "kon.goal.set", { a: `${p.theta}°` });
    return word(lang, "kon.goal.turn", { q: qWord(p.q ?? 1), dir: word(lang, p.dir === "acw" ? "kon.acw" : "kon.cw") });
  }
  // no live angle readout: reading the protractor IS the skill (a readout would be the answer)
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    const step = setGoal ? 1 : 5, cur = s.heading;
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
