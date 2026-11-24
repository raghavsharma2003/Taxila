// Nazariya · tri, the 2D view (r7 nazariya2). The floor plot seen from above, one tile per cell; the cloth lies on it as a
// coloured triangle with its sides' lengths beside them (the slanted side's only when it is a whole number). A tap lays a
// tile on an empty cell or lifts one; a drag lays (or lifts) a whole rectangle. "more": the tiles stay put; a tap on a grid
// point moves tent B's top corner there (tent A stays as a ghost). Fade 1 draws the turned copy of the cloth, dashed, so
// the two make the rectangle (match), and A's top line across the plot (more); the counts are live at fade 1 only, later
// after a check. Nothing is timed.
import type { Moment, NazariyaAct, PlayActBody } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import type { Role } from "../../core/styles.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import { built } from "./grid.ts";
import { area2, baseOf, heightOf, isRight, slantOf, type TriParams, type TriState } from "./tri.logic.ts";

const half = (n2: number) => (n2 % 2 ? `${(n2 - 1) / 2}½` : String(n2 / 2));

export const makeTriView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<TriParams, TriState, NazariyaAct>;
  const { level, ctl, lang } = deps;
  const p = level.params, t = p.tri, goal = p.goal, fade = level.fade;
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const st = () => ctl.state;
  let cell = 28, ox = 0, oy = 0, reveal = false, copyShown = fade === 1 && goal === "match";
  let drag: { x0: number; z0: number; x1: number; z1: number; moved: boolean; lay: boolean } | null = null;
  const act = (a: NazariyaAct) => { ctl.dispatch(a as PlayActBody as never); deps.changed(); };

  function layout(w: number, h: number): void {
    const fs = api.young ? 16 : 14, padB = fs * 2.4;
    cell = clamp(Math.floor(Math.min((w - 24) / p.w, (h - 16 - padB) / p.d)), 16, 64);
    ox = Math.round((w - cell * p.w) / 2); oy = Math.max(8, Math.round((h - padB - cell * p.d) / 2));
  }
  const XY = (x: number, z: number): [number, number] => [ox + x * cell, oy + z * cell];
  const cellAt = (x: number, y: number) => { const cx = Math.floor((x - ox) / cell), cz = Math.floor((y - oy) / cell); return cx >= 0 && cz >= 0 && cx < p.w && cz < p.d ? { x: cx, z: cz } : null; };
  const pointAt = (x: number, y: number) => ({ x: clamp(Math.round((x - ox) / cell), 0, p.w), z: clamp(Math.round((y - oy) / cell), 0, p.d) });

  function fillTri(c: CanvasRenderingContext2D, pts: [number, number][], role: Role, alpha: number): void {
    c.save(); c.globalAlpha = alpha; c.fillStyle = api.P.color(role); c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill(); c.restore();
  }
  /** a side's length chip, pushed off the side away from the cloth's middle and kept inside the box */
  function sideChip(c: CanvasRenderingContext2D, a: [number, number], b: [number, number], mid: [number, number], label: string, role: Role): void {
    const fs = api.young ? 16 : 14;
    let mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const dx = mx - mid[0], dy = my - mid[1], L = Math.hypot(dx, dy) || 1, push = fs * 1.3;
    mx += (dx / L) * push; my += (dy / L) * push;
    mx = clamp(mx, fs * 1.6, api.w - fs * 1.6); my = clamp(my, fs, api.h - fs);
    api.P.chip(c, label, mx, my, { size: fs, role });
  }
  function drawCloth(c: CanvasRenderingContext2D, apex: [number, number], role: Role, o: { alpha: number; dash?: number[]; labels: boolean; tag?: string }): void {
    const A = XY(t.x0, t.zb), B = XY(t.x1, t.zb), C = XY(apex[0], apex[1]), mid: [number, number] = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3];
    fillTri(c, [A, B, C], role, o.alpha);
    api.P.stroke(c, [A, B, C], { role, width: 3, closed: true, ...(o.dash ? { dash: o.dash } : {}) });
    if (o.labels) {
      sideChip(c, A, B, mid, String(baseOf(t)), "ink");
      const right = apex[0] === t.x0 || apex[0] === t.x1;
      if (right) {
        const foot = apex[0] === t.x0 ? A : B, other = apex[0] === t.x0 ? B : A, h = t.zb - apex[1];
        sideChip(c, foot, C, mid, String(h), "ink");
        const s = Math.round(Math.hypot(baseOf(t), h));
        if (s * s === baseOf(t) ** 2 + h * h) sideChip(c, other, C, mid, String(s), "ink");
      }
    }
    if (o.tag) api.P.text(c, o.tag, mid[0], mid[1], { size: api.young ? 18 : 16, role: "ink", weight: 800 });
  }

  function draw(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st();
    api.target("plot", ox, oy, cell * p.w, cell * p.d);
    for (let z = 0; z < p.d; z++) for (let x = 0; x < p.w; x++) {
      const on = s.h[z * p.w + x] > 0, [X, Y] = XY(x, z);
      P.body(c, X + 1.5, Y + 1.5, cell - 3, cell - 3, { role: on ? "q1" : "panel", r: Math.min(6, cell * 0.18), state: on ? "idle" : "dim" });
    }
    if (drag?.moved) {
      const ax = Math.min(drag.x0, drag.x1), bx = Math.max(drag.x0, drag.x1) + 1, az = Math.min(drag.z0, drag.z1), bz = Math.max(drag.z0, drag.z1) + 1;
      P.stroke(c, [XY(ax, az), XY(bx, az), XY(bx, bz), XY(ax, bz)], { role: drag.lay ? "you" : "look", width: 3, closed: true });
    }
    if (goal === "more") {
      // A's top line across the plot (fade 1): every corner on it gives the same cloth
      if (fade === 1) P.stroke(c, [XY(0, t.za), XY(p.w, t.za)], { role: "q3", width: 2, dash: [6, 6] });
      if (fade <= 2 && !s.done) for (let z = 0; z < t.zb; z++) for (let x = 0; x <= p.w; x++) { const [X, Y] = XY(x, z); P.circle(c, X, Y, 2.2, { role: "ink3", fill: true }); }
      drawCloth(c, [t.xa, t.za], "q3", { alpha: 0.28, dash: [7, 5], labels: true, tag: "A" });
      if (s.pt) {
        drawCloth(c, s.pt, s.done ? "good" : "q2", { alpha: 0.5, labels: false, tag: "B" });
        const [X, Y] = XY(s.pt[0], s.pt[1]);
        P.circle(c, X, Y, Math.max(6, cell * 0.22), { role: "you", fill: true });
      }
    } else {
      drawCloth(c, [t.xa, t.za], s.done ? "good" : "q2", { alpha: 0.42, labels: true });
      if (!isRight(t) && (fade === 1 || s.done)) {
        // the height dropped from the top corner to the base (fade 1): the cloth's rectangle is base by this
        const top = XY(t.xa, t.za), foot = XY(t.xa, t.zb);
        P.stroke(c, [top, foot], { role: "ink2", width: 2, dash: [5, 5] });
        const away = t.xa - t.x0 < t.x1 - t.xa ? -1 : 1;   // the chip on the side of the height line away from most of the cloth
        P.chip(c, String(heightOf(t)), clamp(top[0] + away * (api.young ? 16 : 14) * 1.4, 24, api.w - 24), (top[1] + foot[1]) / 2, { size: api.young ? 16 : 14, role: "ink2" });
      }
      if (copyShown) {
        // the turned copy: the cloth turned half round about the middle of its slanted side (a right-angled cloth: the
        // side opposite the square corner), so the two make the rectangle, or a parallelogram
        const pivot: [number, number] = isRight(t) && t.xa === t.x1 ? [(t.x0 + t.xa) / 2, (t.zb + t.za) / 2] : [(t.x1 + t.xa) / 2, (t.zb + t.za) / 2];
        const rot = (x: number, z: number): [number, number] => XY(2 * pivot[0] - x, 2 * pivot[1] - z);
        P.stroke(c, [rot(t.x0, t.zb), rot(t.x1, t.zb), rot(t.xa, t.za)], { role: "q3", width: 2.5, closed: true, dash: [6, 5] });
      }
    }
    if (s.done) { const [X, Y] = XY(t.x1, t.zb); P.tick(c, clamp(X, 24, api.w - 24), clamp(Y - cell, 24, api.h - 24), 22); }
  }

  function pointer(kind: PointerKind, x: number, y: number): void {
    if (st().done) return;
    if (goal === "more") {
      if (kind === "down") ctl.finger(true);
      if (kind === "up" || kind === "cancel") {
        ctl.finger(false);
        if (kind === "up" && api.hit(x, y) === "plot") { const q = pointAt(x, y); act({ kind: "apex", x: q.x, z: q.z }); }
        api.invalidate();
      }
      return;
    }
    const c = cellAt(x, y);
    if (kind === "down") { ctl.finger(true); drag = c ? { x0: c.x, z0: c.z, x1: c.x, z1: c.z, moved: false, lay: st().h[c.z * p.w + c.x] === 0 } : null; }
    if (kind === "move" && drag && c && (c.x !== drag.x1 || c.z !== drag.z1)) { drag.x1 = c.x; drag.z1 = c.z; drag.moved = true; api.invalidate(); }
    if (kind === "up" || kind === "cancel") {
      ctl.finger(false);
      const d = drag; drag = null;
      if (!d || kind === "cancel") { api.invalidate(); return; }
      if (d.moved) act({ kind: d.lay ? "layer" : "clear", x0: d.x0, z0: d.z0, x1: d.x1, z1: d.z1 });
      else act({ kind: d.lay ? "place" : "remove", x: d.x0, z: d.z0 });
      api.invalidate();
    }
  }

  const goalLine = () => W(`nazariya.tri.goal.${goal}`);
  const view: FamilyView = {
    layout, update() {}, draw, pointer, dragging: () => !!drag,
    goal: goalLine,
    readouts(): Readout[] {
      const s = st(), live = fade === 1 || reveal || s.done;
      if (goal === "more") {
        const out: Readout[] = [{ k: W("nazariya.tri.clothA"), v: half(area2(t)), role: "q3" }];
        out.push({ k: W("nazariya.tri.clothB"), v: s.pt && live ? half(baseOf(t) * (t.zb - s.pt[1])) : "?", role: "q2" });
        return out;
      }
      const out: Readout[] = [{ k: W("nazariya.tri.tiles"), v: live ? String(built(p, s.h)) : "?", role: "q1" }];
      if (s.done && goal === "match") out.push({ k: W("nazariya.tri.cloth"), v: half(area2(t)), role: "q2" });
      return out;
    },
    controls(): ControlSpec[] {
      const s = st(), out: ControlSpec[] = [];
      if (s.done) return out;
      out.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", disabled: s.depth === 0, onPress: () => act({ kind: "undo" }) });
      const ready = goal === "more" ? !!s.pt : built(p, s.h) > 0;
      out.push({ id: "done", label: W("nazariya.tri.check"), kind: "primary", you: true, group: "go", disabled: !ready, onPress: () => act({ kind: "check" }) });
      return out;
    },
    react(ms: Moment[], refused: string | undefined): void {
      const kinds = new Set(ms.map((m) => m.kind));
      if (kinds.has("progress")) { reveal = false; api.sfx("drop"); }
      if (kinds.has("solved")) { reveal = true; api.sfx("good"); api.fx.burst(api.w / 2, api.h / 2, { n: 16, color: api.P.color("good"), speed: 100, life: 0.6, size: 3, kind: "spark" }); }
      else if (kinds.has("misconception_consequence") || kinds.has("near_miss") || refused === "mismatch") {
        reveal = true;
        // the consequence: the turned copy drawn beside the cloth (two cloths make the rectangle's floor)
        if (goal === "match") copyShown = true;
        api.sfx("look");
      } else if (refused) api.sfx("refuse");
      api.invalidate(); deps.changed();
    },
  };
  void heightOf; void slantOf;
  return view;
};
