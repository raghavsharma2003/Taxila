// Nazariya · the plot, drawn flat: Khand's BOARD TWIN (core3d@1 §5). The host mounts it with the SAME PlayController when
// the 3D engine cannot run (no WebGL2, a software or known-bad GPU, a lost context), so the level, its state and every
// act survive. Seen from above: one tile per column, its height written on it; the scenery in muted bodies, the child's
// blocks in the "your quantity" hue, the columns a check found different glowing "look again". A tap puts a block on a
// column (Break takes one off); a drag lays or clears a whole rectangle. Views mode adds the target's front and side
// profiles beside the plot, with the child's own after a check. Same goal line, same control ids as the 3D engine.
import type { Moment, NazariyaAct, PlayActBody } from "../../../../shared/play.ts";
import type { PointerKind, ViewApi } from "../../core/stage.ts";
import { clamp, type ControlSpec, type FamilyView, type MakeView, type Readout, type ViewDeps } from "../../core/viewkit.ts";
import { goalOf } from "../../engines/khand/words.ts";
import { built, frontView, sideView, topView, type NzState, type Plot } from "./grid.ts";
import type { ViewsParams } from "./views.logic.ts";
import { pitCells, type ArrayParams } from "./array.logic.ts";
import { areaPerimeter } from "./floor.logic.ts";
import { termOf, type PowersParams } from "./powers.logic.ts";
import { mirrorMismatch, type MirrorParams } from "./mirror.logic.ts";

export const makePlotView: MakeView = (api: ViewApi, depsIn: ViewDeps) => {
  const deps = depsIn as unknown as ViewDeps<Plot, NzState, NazariyaAct>;
  const { level, ctl, lang } = deps;
  const p = level.params as Plot & Record<string, unknown>, mode = level.mode, goal = level.goal, fade = level.fade;
  const views = mode === "views" ? (p as unknown as ViewsParams) : null;
  let cell = 32, ox = 0, oy = 0, prof = { x: 0, y: 0, s: 16 };
  let tool: "build" | "remove" = "build", pad = false, num = 0, reveal = false, glow: number[] = [];
  let drag: { x0: number; z0: number; x1: number; z1: number; moved: boolean } | null = null;
  const st = () => ctl.state;

  function layout(w: number, h: number): void {
    const extra = views ? 1.8 : 0;   // room for the two profiles under the plot
    cell = clamp(Math.floor(Math.min((w - 24) / p.w, (h - 24) / (p.d + extra * Math.max(2, p.hmax) / 2))), 18, 72);
    ox = Math.round((w - cell * p.w) / 2); oy = 12;
    prof = { x: ox, y: oy + cell * p.d + 16, s: clamp(Math.floor(cell * 0.6), 12, 36) };
  }
  const cellAt = (x: number, y: number) => { const cx = Math.floor((x - ox) / cell), cz = Math.floor((y - oy) / cell); return cx >= 0 && cz >= 0 && cx < p.w && cz < p.d ? { x: cx, z: cz } : null; };
  const act = (a: NazariyaAct) => { ctl.dispatch(a as PlayActBody as never); deps.changed(); };
  const padWanted = () => {
    const s = st(); if (s.done) return false;
    if (mode === "array" && goal === "fill") { const a = p as unknown as ArrayParams; return fade === 3 || pitCells(a, a.pit).every((i) => s.h[i] >= 1); }
    return mode === "powers" && fade >= 2 && s.named === null;
  };
  if (padWanted()) pad = true;

  function draw(c: CanvasRenderingContext2D): void {
    const P = api.P, s = st();
    api.target("plot", ox, oy, cell * p.w, cell * p.d);
    for (let z = 0; z < p.d; z++) for (let x = 0; x < p.w; x++) {
      const i = z * p.w + x, h = s.h[i], X = ox + x * cell, Y = oy + z * cell;
      const role = p.lock[i] ? (h > 0 ? "q2" : "panel") : h > p.base[i] ? "q1" : "panel";
      P.body(c, X + 2, Y + 2, cell - 4, cell - 4, { role, r: Math.min(8, cell * 0.2), state: p.lock[i] && h === 0 ? "dim" : "idle" });
      if (views?.top && views.top[i] && !h) P.body(c, X + cell * 0.3, Y + cell * 0.3, cell * 0.4, cell * 0.4, { role: "q3", state: "ghost" });
      if (h > 0) P.text(c, String(h), X + cell / 2, Y + cell / 2, { size: clamp(cell * 0.45, 18, 30), role: "ink", font: "mono" });
      if (glow.includes(i)) P.stroke(c, [[X + 3, Y + 3], [X + cell - 3, Y + 3], [X + cell - 3, Y + cell - 3], [X + 3, Y + cell - 3]], { role: "look", width: 4, closed: true });
    }
    if (drag?.moved) {
      const ax = Math.min(drag.x0, drag.x1), bx = Math.max(drag.x0, drag.x1), az = Math.min(drag.z0, drag.z1), bz = Math.max(drag.z0, drag.z1);
      P.stroke(c, [[ox + ax * cell, oy + az * cell], [ox + (bx + 1) * cell, oy + az * cell], [ox + (bx + 1) * cell, oy + (bz + 1) * cell], [ox + ax * cell, oy + (bz + 1) * cell]], { role: tool === "build" ? "you" : "look", width: 3, closed: true });
    }
    if (views) {
      // the front profile (columns x, seen from z < 0) and the side profile (rows z), target outlined, the child's filled
      const H = views.hmax, live = fade === 1 || reveal, S = prof.s;
      const tf = views.front ?? frontView(views, views.shown ?? []), ts = views.side ?? sideView(views, views.shown ?? []);
      const mf = frontView(views, s.h), ms = sideView(views, s.h);
      const panel = (x0: number, cols: number, target: number[], mine: number[], label: string) => {
        const y0 = prof.y + 22;
        P.text(c, label, x0, prof.y + 8, { size: 16, role: "ink2", align: "left" });
        for (let k = 0; k < cols; k++) for (let r = 0; r < H; r++) {
          const X = x0 + k * S, Y = y0 + (H - 1 - r) * S, t = r < target[k], m = live && r < mine[k];
          P.body(c, X + 1, Y + 1, S - 2, S - 2, { role: m ? "q1" : t ? "q3" : "panel", state: t || m ? "idle" : "dim", r: 3 });
          if (live && t !== (r < mine[k])) P.stroke(c, [[X + 1, Y + 1], [X + S - 1, Y + 1], [X + S - 1, Y + S - 1], [X + 1, Y + S - 1]], { role: "look", width: 2.5, closed: true });
        }
      };
      if (views.goal === "build3" || views.view === "front") panel(prof.x, views.w, tf, mf, "Front");
      if (views.goal === "build3" || views.view === "side") panel(prof.x + (views.goal === "build3" ? views.w * S + 24 : 0), views.d, ts, ms, "Side");
      void topView;
    }
  }
  function pointer(kind: PointerKind, x: number, y: number): void {
    if (pad || st().done) return;
    const c = cellAt(x, y);
    if (kind === "down") { ctl.finger(true); drag = c ? { x0: c.x, z0: c.z, x1: c.x, z1: c.z, moved: false } : null; }
    if (kind === "move" && drag && c && (c.x !== drag.x1 || c.z !== drag.z1)) { drag.x1 = c.x; drag.z1 = c.z; drag.moved = true; api.invalidate(); }
    if (kind === "up" || kind === "cancel") {
      ctl.finger(false);
      const d = drag; drag = null;
      if (!d || kind === "cancel") { api.invalidate(); return; }
      if (d.moved) act({ kind: tool === "build" ? "layer" : "clear", x0: d.x0, z0: d.z0, x1: d.x1, z1: d.z1 });
      else act({ kind: tool === "build" ? "place" : "remove", x: d.x0, z: d.z0 });
      api.invalidate();
    }
  }

  const view: FamilyView = {
    layout, update() {}, draw, pointer, dragging: () => !!drag,
    goal: () => goalOf(level, lang),
    readouts(): Readout[] {
      const s = st(), out: Readout[] = [];
      if (mode === "floor") { const ap = areaPerimeter(p, s.h), show = fade === 1 || reveal || s.done; out.push({ k: "Floor", v: show ? String(ap.area) : "?", role: "q1" }, { k: "Fence", v: show ? String(ap.perimeter) : "?", role: "q4" }); }
      else if (mode === "array" || mode === "powers") { if (pad || s.named !== null) out.push({ k: "Number", v: pad ? String(num) : String(s.named), role: "you" }); if (mode === "powers") out.push({ k: "Next", v: `${(p as unknown as PowersParams).s}×${(p as unknown as PowersParams).s}${(p as unknown as PowersParams).goal === "cube" ? `×${(p as unknown as PowersParams).s}` : ""}`, role: "q3" }); }
      else out.push({ k: "Blocks", v: String(built(p, s.h)), role: "q1" });
      return out;
    },
    controls(): ControlSpec[] {
      const s = st(), c: ControlSpec[] = [];
      if (s.done) return c;
      if (pad) {
        for (let k = 1; k <= 9; k++) c.push({ id: `k${k}`, label: String(k), kind: "pad", group: k <= 5 ? "pad1" : "pad2", onPress: () => { num = Math.min(9999, num * 10 + k); deps.changed(); } });
        c.push({ id: "k0", label: "0", kind: "pad", group: "pad2", onPress: () => { num = Math.min(9999, num * 10); deps.changed(); } });
        c.push({ id: "kdel", label: "Del", kind: "pad", group: "pad1", aria: "Delete a digit", onPress: () => { num = Math.floor(num / 10); deps.changed(); } });
        if (!(mode === "array" && fade === 3)) c.push({ id: "close", label: "Build", kind: "secondary", group: "go", onPress: () => { pad = false; deps.changed(); } });
        c.push({ id: "name", label: `Say ${num}`, kind: "primary", you: true, group: "go", onPress: () => { const r = ctl.dispatch({ kind: "name", n: num } as never); if (!r.refused) { num = 0; pad = false; } deps.changed(); } });
        return c;
      }
      c.push({ id: "tool-build", label: "Build", kind: "choice", group: "tools", aria: `Build${tool === "build" ? " (on)" : ""}`, onPress: () => { tool = "build"; deps.changed(); } });
      c.push({ id: "tool-remove", label: "Break", kind: "choice", group: "tools", aria: `Break${tool === "remove" ? " (on)" : ""}`, onPress: () => { tool = "remove"; deps.changed(); } });
      if (mode === "array" && goal === "turn" && s.predicted === null) {
        c.push({ id: "predict-same", label: "Same number", kind: "secondary", group: "predict", onPress: () => act({ kind: "predict", same: true }) });
        c.push({ id: "diff", label: "Different", kind: "secondary", group: "predict", onPress: () => act({ kind: "predict", same: false }) });
      }
      c.push({ id: "undo", label: "Undo", kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) });
      if (mode === "array" && goal === "fill") c.push({ id: "say", label: "Say how many", kind: "primary", you: true, group: "go", onPress: () => { pad = true; deps.changed(); } });
      else {
        if (mode === "powers") c.push({ id: "say", label: s.named === null ? "Say how many" : "Say again", kind: "secondary", group: "go", onPress: () => { pad = true; deps.changed(); } });
        c.push({ id: "done", label: mode === "array" ? "Done" : "Check", kind: "primary", you: true, group: "go", onPress: () => act({ kind: "check" }) });
      }
      return c;
    },
    react(ms: Moment[], refused: string | undefined): void {
      const kinds = new Set(ms.map((m) => m.kind)), s = st();
      if (ms.some((m) => m.kind === "progress") || refused === undefined && !kinds.size) { reveal = false; glow = []; }
      if (kinds.has("solved")) { reveal = true; glow = []; api.sfx("good"); }
      else if (kinds.has("misconception_consequence") || kinds.has("near_miss") || refused === "mismatch") {
        reveal = true;
        if (mode === "mirror") glow = mirrorMismatch(p as unknown as MirrorParams, s.h).map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
        api.sfx("look");
      } else if (refused) api.sfx("refuse");
      else if (kinds.has("progress")) api.sfx("drop");
      if (padWanted()) pad = true;
      api.invalidate(); deps.changed();
    },
  };
  void termOf;
  return view;
};
