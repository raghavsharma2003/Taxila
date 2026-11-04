// Yantra (E6) · the beam law in 3D (core3d@1: docs/design/round4/build/games-core/CORE-API.md). A VIEW over the EXISTING
// beam law (src/play/families/yantra/beam.logic.ts): an optics bench seen at a 3/4 angle, the board's cells as tiles on
// it, the walls as blocks, the lamp a laser pointer on the board's edge, the target a photocell drum that spins a fan.
//
// Law mapping (every decision is a law act through the PlayController; the server replays them):
//   tap a free tile                       → { place, part: "mirror", x, y, rot: 0 }  (the new mirror is picked)
//   tap a mirror                          → picks it (a view choice, no act; as the 2D view)
//   drag round the picked mirror          → ONE { rotate, id, rot } on release, rot snapped to the level's step
//   ↺ ↻ (nudge-left / nudge-right)        → { rotate, id, rot ± step }  (the 2D view's controls, same ids)
//   remove / undo / run                   → { remove } / { undo } / { run }
// On RUN the beam is the law's own trace() drawn out segment by segment: no physics here, no preview before a run
// (predicting where the light goes is the skill). The DOM chrome (goal, readouts, controls) is the 2D view's, word for
// word, so PlayStage, the voice grammar (pressesFor) and the evidence path do not move. Nothing here decides an outcome,
// keeps a score, reads a clock for progress or draws a random number (cosmetics use core.cosmeticRandom).
import type { Moment, YantraAct } from "../../../../shared/play.ts";
import type { PlayController } from "../../core/controller.ts";
import type { PointerKind } from "../../core/stage.ts";
import type { ControlSpec, Readout } from "../../core/viewkit.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../words.ts";
import type { Core3D, DressedSpec, EngineDeps, EngineView, LabelHandle } from "../core3d/api.ts";
import { norm, trace, type BeamParams, type BeamState } from "../../families/yantra/beam.logic.ts";
import { BEAM_Y, cellAt, dragTurn, freeCell, headingOf, toWorld } from "./geom.ts";
import { THEMES, themeOf, type YantraTheme } from "./palette.ts";
import { BenchScene } from "./scene.ts";
import { hint, LANGTAG, type HintKey } from "./words.ts";

const TAP = 8;                       // px a finger may wander and still be a tap

export function create(core: Core3D, deps: EngineDeps): EngineView {
  const { level, lang } = deps;
  const ctl = deps.ctl as unknown as PlayController<BeamParams, BeamState, YantraAct>;
  const p = level.params as BeamParams;
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const st = () => ctl.state;
  let theme: YantraTheme = themeOf(deps.spec.dress.theme);
  const scene = new BenchScene(core.scene as import("three").Scene, p, THEMES[theme], () => core.cosmeticRandom(), core.budget.particles, core.reduced);
  core.camera = scene.cam;
  core.labelColors(THEMES[theme].labels);
  core.progress.set("level", level.levelId, { level: "start" });

  // ── view-local choices (never progress: which mirror is picked changes no answer, as in the 2D view)
  let sel: string | null = null;
  let preview: { id: string; rot: number } | null = null;
  let ran = st().runs > 0;
  let box = { w: 1, h: 1 };
  let busyNow = true;
  let outcome: Moment["kind"] | null = null;

  // ── labels: the picked mirror's heading (fade 1, as the 2D view), and one hint while the child is new to the bench
  const angle: LabelHandle = core.label({ id: "angle", text: "", lang: "en", size: 18, kind: "numeral", at: { x: 0, y: 0, z: 0 }, align: "bottom", dy: -4, role: "you", hidden: true });
  const hintL: LabelHandle = core.label({ id: "hint", text: "", lang: LANGTAG[lang], size: core.young ? 16 : 15, kind: "text", at: { box: { x: 0, y: 0 } }, align: "bottom", hidden: true, keepInBox: true });
  function labels(): void {
    const s = st(), m = s.placed.find((x) => x.id === sel) ?? null;
    if (m && level.fade === 1 && !s.done) {
      const at = scene.mirrorAt(m.id);
      const rot = preview && preview.id === m.id ? preview.rot : m.rot;
      if (at) angle.set({ text: `${norm(rot)}°`, hidden: false, at: { x: at.x, y: 0.86, z: at.z } });
    } else angle.set({ hidden: true });
    const key: HintKey | null = s.done || ran ? null : m ? "turn" : s.placed.length >= p.mirrors ? "pick" : "place";
    hintL.set(key ? { text: hint(lang, key), hidden: false, at: { box: { x: box.w / 2, y: box.h - 10 } } } : { hidden: true });
  }
  function refresh(): void { scene.sync(st().placed, st().done ? null : sel, preview); labels(); core.invalidate(); }

  // ── acts: every child decision goes through the controller (react() below answers what the law said)
  function act(a: YantraAct): void { ctl.dispatch(a); deps.changed(); }
  function turnBy(dir: 1 | -1): void {
    const m = st().placed.find((x) => x.id === sel);
    if (m) act({ kind: "rotate", id: m.id, rot: dir > 0 ? m.rot + p.step : m.rot - p.step + 180 });
  }

  function react(ms: Moment[], refused: string | undefined): void {
    const s = st(), last = ctl.acts[ctl.acts.length - 1]?.act as YantraAct | undefined;
    if (last?.kind === "place" && !refused) { core.audio.sfx("land"); sel = s.placed[s.placed.length - 1]?.id ?? sel; }
    if (last?.kind === "rotate" && !refused) core.audio.sfx("aim", { x: 0.5 });
    if (last?.kind === "remove" && !refused) core.audio.sfx("undo");
    if (last?.kind === "undo") core.audio.sfx("undo");
    if (refused && refused !== "missed" && refused !== "level_over") core.audio.sfx("look");
    if (last?.kind === "run" && refused !== "level_over") {
      // the law's own trace of the board the law now holds: the engine animates it, never computes its own
      ran = true;
      scene.shoot(trace(p, s.placed));
      core.audio.sfx("reveal");
      outcome = ms.find((m) => m.kind === "solved" || m.kind === "near_miss" || m.kind === "law_refused")?.kind ?? null;
      const solved = ms.find((m) => m.kind === "solved");
      if (solved) core.progress.set("done", true, { moment: "solved", seq: solved.seq });
    } else if (last && last.kind !== "run") { scene.clearShot(); outcome = null; }
    if (sel && !s.placed.some((m) => m.id === sel)) sel = null;
    preview = null;
    refresh(); deps.changed();
  }

  // ── input: one finger (the core forwards it in CSS px)
  let drag: { sx: number; sy: number; lx: number; moved: number; id: string | null; a0: number | null; r0: number; turning: boolean } | null = null;
  const fingerHeading = (x: number, y: number, id: string): number | null => {
    const c = scene.mirrorAt(id), q = scene.onPlane(x, y, BEAM_Y);
    if (!c || !q || Math.hypot(q.x - c.x, q.z - c.z) < 0.18) return null;
    return headingOf(q.x - c.x, q.z - c.z);
  };
  function mirrorUnder(x: number, y: number): string | null {
    const id = scene.pickMirror(x, y);
    if (id) return id;
    const q = scene.onPlane(x, y), c = q ? cellAt(p, q.x, q.z) : null;
    return c ? st().placed.find((m) => m.x === c.x && m.y === c.y)?.id ?? null : null;
  }
  function down(x: number, y: number): void {
    const done = st().done, id = done ? null : mirrorUnder(x, y);
    // a drag that starts on a mirror (or round the picked one) turns it; anywhere else it orbits the bench a little
    let turnId = id;
    if (!turnId && sel && !done) { const c = scene.mirrorAt(sel), q = scene.onPlane(x, y, BEAM_Y); if (c && q && Math.hypot(q.x - c.x, q.z - c.z) < 1.3) turnId = sel; }
    const m = turnId ? st().placed.find((k) => k.id === turnId) : undefined;
    drag = { sx: x, sy: y, lx: x, moved: 0, id: turnId, a0: m ? fingerHeading(x, y, m.id) : null, r0: m?.rot ?? 0, turning: false };
  }
  function move(x: number, y: number): void {
    if (!drag) return;
    drag.moved = Math.max(drag.moved, Math.hypot(x - drag.sx, y - drag.sy));
    if (drag.moved <= TAP && !drag.turning) { drag.lx = x; return; }
    if (drag.id) {
      if (!drag.turning) { drag.turning = true; if (sel !== drag.id) { sel = drag.id; core.audio.sfx("select"); deps.changed(); } }
      const a = fingerHeading(x, y, drag.id);
      if (a !== null && drag.a0 === null) drag.a0 = a;
      if (a !== null && drag.a0 !== null) {
        const rot = dragTurn(drag.r0, drag.a0, a, p.step);
        if (rot !== preview?.rot) { preview = { id: drag.id, rot }; core.audio.sfx("aim", { x: rot / 180 }); refresh(); }
      }
    } else { scene.orbit(x - drag.lx); core.invalidate(); }
    drag.lx = x;
  }
  function up(x: number, y: number): void {
    const d = drag; drag = null;
    if (!d) return;
    if (d.turning && d.id) {
      const m = st().placed.find((k) => k.id === d.id), pv = preview;
      preview = null;
      if (m && pv && pv.rot !== m.rot) act({ kind: "rotate", id: m.id, rot: pv.rot });
      else refresh();
      return;
    }
    if (d.moved > TAP || st().done) return;
    tap(x, y);
  }
  function tap(x: number, y: number): void {
    const s = st(), id = mirrorUnder(x, y);
    if (id) { sel = id; core.audio.sfx("select"); refresh(); deps.changed(); return; }
    const q = scene.onPlane(x, y), c = q ? cellAt(p, q.x, q.z) : null;
    if (!c) { if (sel) { sel = null; refresh(); deps.changed(); } return; }
    if (!freeCell(p, s.placed, c.x, c.y)) { core.audio.sfx("look"); return; }
    if (s.placed.length >= p.mirrors) { core.audio.sfx("look"); return; }
    act({ kind: "place", part: "mirror", x: c.x, y: c.y, rot: 0 });
  }

  // ── chrome: the 2D view's, word for word (goal, readouts, controls with the same ids)
  function goal(): string { return W(p.goal === "periscope" ? "yantra.beam.goal.periscope" : "yantra.beam.goal.route", { n: p.mirrors }); }
  const readouts = (): Readout[] => [{ k: W("yantra.beam.mirrors"), v: `${p.mirrors - st().placed.length}` }];
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    const m = s.placed.find((x) => x.id === sel) ?? null;
    return [
      { id: "nudge-left", label: "↺", aria: "turn the mirror anticlockwise", kind: "pad", group: "turn", disabled: !m, onPress: () => turnBy(1) },
      { id: "nudge-right", label: "↻", aria: "turn the mirror clockwise", kind: "pad", group: "turn", disabled: !m, onPress: () => turnBy(-1) },
      { id: "remove", label: W("yantra.beam.remove"), kind: "secondary", group: "turn", disabled: !m, onPress: () => m && act({ kind: "remove", id: m.id }) },
      { id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) },
      { id: "run", label: W("yantra.run"), kind: "primary", group: "go", you: s.placed.length > 0, onPress: () => act({ kind: "run" }) },
    ];
  }

  function applyTheme(t: YantraTheme): void { theme = t; scene.setTheme(THEMES[t]); core.labelColors(THEMES[t].labels); core.invalidate(); }
  function redress(spec: DressedSpec): boolean {
    if (ctl.acts.length) return false;
    applyTheme(themeOf(spec.dress.theme));
    return true;
  }

  refresh();
  const view: EngineView = {
    layout(b) {
      box = { w: b.w, h: b.h };
      // the hint pill lives under the board; a little air at the top and sides
      scene.layout(b.w, b.h, { top: 10, bottom: 44, side: 10 });
      const r = scene.boardRect(); core.target("board", r.x, r.y, r.w, r.h);
      labels(); core.invalidate();
    },
    update(dt) {
      const r = scene.step(dt, core.t);
      for (const e of r.events) {
        if (e.kind === "bounce") core.audio.sfx("aim", { x: Math.min(1, e.i / 6) });
        if (e.kind === "hit") { core.audio.sfx("hit"); core.audio.sfx("good"); core.hitstop(60); core.shake(2); }
        if (e.kind === "miss") { core.audio.sfx(outcome === "near_miss" ? "near" : "miss"); core.shake(1); }
      }
      if (preview || sel) labels();
      busyNow = r.busy || !!drag;
    },
    busy: () => busyNow,
    pointer(kind: PointerKind, x: number, y: number) {
      if (kind === "down") down(x, y); else if (kind === "move") move(x, y); else if (kind === "up") up(x, y); else { drag = null; if (preview) { preview = null; refresh(); } }
    },
    key(k: string) { if (k === "ArrowLeft") turnBy(1); else if (k === "ArrowRight") turnBy(-1); else if ((k === "Enter" || k === " ") && !st().done) act({ kind: "run" }); },
    goal, readouts, controls, react, redress,
    speaking: () => { /* the bus ducks; nothing on the bench waits on her voice */ },
    dispose() { angle.remove(); hintL.remove(); scene.dispose(); },
  };

  // the play dev harness (its page carries ?family=… in the URL) also gets the engine's own hooks
  if (typeof location !== "undefined" && /[?&]family=yantra\b/.test(location.search)) (window as unknown as { __yantra: unknown }).__yantra = {
    scene, theme: () => theme, setTheme: (t: string) => applyTheme(themeOf(t)), sel: () => sel, select: (id: string | null) => { sel = id; refresh(); deps.changed(); },
    /** where a board point (cell units) at a height shows on screen (CSS px in the box): the harness taps there */
    px: (x: number, y: number, h = 0.05) => { const w = toWorld(p, x, y); return core.project({ x: w.x, y: h, z: w.z }); },
  };
  return view;
}
