// Yantra · beam, the 2D view (the board twin and the 2D-tier view of the beam law; round 7 E6). A board of cells: the lamp
// on its edge with its arrow, the target (a solar panel that opens a gate), walls as solid blocks. Tap a free cell to set a
// mirror there (it starts flat); tap a mirror to pick it; ↺ ↻ turn the picked mirror one step; RUN fires the beam, which
// the law traces and the view draws out segment by segment. The beam is never shown before a run (predicting it is the
// skill) and stays drawn until the board changes. No timer.
import type { Moment, YantraAct } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../../engines/words.ts";
import { MIRROR_HALF, norm, trace, type BeamParams, type BeamState, type BeamTrace } from "./beam.logic.ts";

export const makeBeamView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<BeamParams, BeamState, YantraAct>;
  const { level, ctl, lang } = deps;
  const p = level.params;
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  let ox = 0, oy = 0, cs = 40;                       // board origin and cell size (px)
  let sel: string | null = null;
  let shot: { tr: BeamTrace; at: number } | null = null;
  const st = () => ctl.state;
  const px = (x: number) => ox + x * cs, py = (y: number) => oy + y * cs;
  const rad = (d: number) => (d * Math.PI) / 180;

  function layout(w: number, h: number): void {
    cs = Math.floor(Math.min((w - 24) / p.cols, (h - 24) / p.rows, 72));
    ox = Math.round((w - cs * p.cols) / 2); oy = Math.round((h - cs * p.rows) / 2);
  }
  function act(a: YantraAct): void { ctl.dispatch(a); deps.changed(); }
  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as YantraAct | undefined;
    if (last?.kind === "place" && !refused) { api.sfx("land"); sel = st().placed[st().placed.length - 1]?.id ?? sel; }
    if (last?.kind === "rotate" && !refused) api.sfx("slide");
    if (last?.kind === "run") {
      shot = { tr: trace(p, st().placed), at: api.t }; api.sfx("select");
      for (const m of ms) {
        if (m.kind === "solved") setTimeout(() => { api.sfx("good"); api.fx.burst(px(p.target.x), py(p.target.y), { n: 18, color: api.P.color("good"), speed: 120, life: 0.7, size: 3, kind: "spark" }); }, 650);
        if (m.kind === "near_miss" || m.kind === "law_refused") setTimeout(() => api.sfx("look"), 650);
      }
    }
    if (last && last.kind !== "run") shot = null;
    if (last?.kind === "undo" && st().lastHit === null) shot = null;
    if (sel && !st().placed.some((m) => m.id === sel)) sel = null;
    api.invalidate(); deps.changed();
  }
  function pointer(kind: PointerKind, x: number, y: number): void {
    if (kind !== "down" || st().done) return;
    const id = api.hit(x, y);
    if (!id) return;
    if (id.startsWith("mirror:")) { sel = id.slice(7); api.sfx("select"); api.invalidate(); deps.changed(); return; }
    if (id.startsWith("cell:")) {
      const [cx, cy] = id.slice(5).split(",").map(Number);
      if (st().placed.length >= p.mirrors) { api.sfx("look"); return; }
      act({ kind: "place", part: "mirror", x: cx, y: cy, rot: 0 });
    }
  }
  const update = () => { /* the beam's draw-out is time-based in draw() */ };
  const busy = () => !!shot && api.t - shot.at < 1.2;

  function draw(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st();
    // the board
    for (let y = 0; y < p.rows; y++) for (let x = 0; x < p.cols; x++) {
      const wall = p.walls.some((w) => w.x === x && w.y === y);
      if (wall) { P.body(c, px(x) + 2, py(y) + 2, cs - 4, cs - 4, { role: "ink2", r: 4 }); continue; }
      P.stroke(c, [[px(x), py(y)], [px(x + 1), py(y)], [px(x + 1), py(y + 1)], [px(x), py(y + 1)]], { role: "ink3", width: 1, closed: true, alpha: 0.35 });
      const free = !(x === p.lamp.x && y === p.lamp.y) && !s.placed.some((m) => m.x === x && m.y === y) && Math.hypot(x + 0.5 - p.target.x, y + 0.5 - p.target.y) > p.target.r + 0.3;
      if (free && !s.done) api.target(`cell:${x},${y}`, px(x), py(y), cs, cs);
    }
    // the target: a panel that lights when the beam lands
    const lit = !!shot && shot.tr.hit && api.t - shot.at > 0.6;
    P.circle(c, px(p.target.x), py(p.target.y), p.target.r * cs, { role: lit ? "good" : "q3", fill: true, alpha: lit ? 1 : 0.85 });
    P.circle(c, px(p.target.x), py(p.target.y), p.target.r * cs + 4, { role: "ink", width: 2 });
    // the lamp and its arrow
    const lx = px(p.lamp.x + 0.5), ly = py(p.lamp.y + 0.5), [ux, uy] = [Math.cos(rad(p.lamp.dir)), -Math.sin(rad(p.lamp.dir))];
    P.body(c, lx - cs * 0.3, ly - cs * 0.3, cs * 0.6, cs * 0.6, { role: "q1", r: cs * 0.15 });
    P.stroke(c, [[lx + ux * cs * 0.3, ly + uy * cs * 0.3], [lx + ux * cs * 0.55, ly + uy * cs * 0.55]], { role: "q1", width: 4 });
    // the beam (after a run): drawn out along the law's trace
    if (shot) {
      const pts = shot.tr.points, k = clamp((api.t - shot.at) / 0.7, 0, 1);
      let total = 0; const lens: number[] = [];
      for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); lens.push(l); total += l; }
      let left = total * k; const drawn: [number, number][] = [[px(pts[0][0]), py(pts[0][1])]];
      for (let i = 1; i < pts.length && left > 0; i++) {
        const f = Math.min(1, left / (lens[i - 1] || 1)); left -= lens[i - 1];
        drawn.push([px(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f), py(pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f)]);
      }
      P.stroke(c, drawn, { role: "q1", width: 7, alpha: 0.25 });
      P.stroke(c, drawn, { role: "q1", width: 3 });
      if (k < 1 || api.t - shot.at < 1.2) api.invalidate();
    }
    // mirrors
    for (const m of s.placed) {
      const cx = px(m.x + 0.5), cy = py(m.y + 0.5), hx = Math.cos(rad(m.rot)) * MIRROR_HALF * cs, hy = -Math.sin(rad(m.rot)) * MIRROR_HALF * cs;
      const on = sel === m.id && !s.done;
      if (on) P.circle(c, cx, cy, cs * 0.48, { role: "you", width: 2, alpha: 0.8 });
      P.stroke(c, [[cx - hx, cy - hy], [cx + hx, cy + hy]], { role: on ? "you" : "ink", width: 6 });
      P.circle(c, cx, cy, 3.5, { role: "ink", fill: true });
      if (on && level.fade === 1) P.text(c, `${norm(m.rot)}°`, cx, cy + cs * 0.5 + 2, { size: 14, weight: 700, font: "mono", role: "ink2", baseline: "top" });
      api.target(`mirror:${m.id}`, px(m.x), py(m.y), cs, cs);
    }
  }

  function goal(): string { return W(p.goal === "periscope" ? "yantra.beam.goal.periscope" : "yantra.beam.goal.route", { n: p.mirrors }); }
  const readouts = (): Readout[] => [{ k: W("yantra.beam.mirrors"), v: `${p.mirrors - st().placed.length}` }];
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    const m = s.placed.find((x) => x.id === sel) ?? null;
    return [
      { id: "nudge-left", label: "↺", aria: "turn the mirror anticlockwise", kind: "pad", group: "turn", disabled: !m, onPress: () => m && act({ kind: "rotate", id: m.id, rot: m.rot + p.step }) },
      { id: "nudge-right", label: "↻", aria: "turn the mirror clockwise", kind: "pad", group: "turn", disabled: !m, onPress: () => m && act({ kind: "rotate", id: m.id, rot: m.rot - p.step + 180 }) },
      { id: "remove", label: W("yantra.beam.remove"), kind: "secondary", group: "turn", disabled: !m, onPress: () => m && act({ kind: "remove", id: m.id }) },
      { id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) },
      { id: "run", label: W("yantra.run"), kind: "primary", group: "go", you: s.placed.length > 0, onPress: () => act({ kind: "run" }) },
    ];
  }
  const view: FamilyView = { layout, update, draw, pointer, busy, goal, readouts, controls, react, dragging: () => false };
  return view;
};
