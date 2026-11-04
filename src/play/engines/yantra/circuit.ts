// Yantra (E6) · the circuit law in 3D (core3d@1). A VIEW over the EXISTING law (src/play/families/yantra/circuit.logic.ts):
// the law's parts on a workbench (kit.ts), the child's wires as leads between brass posts.
//
// Law mapping (every decision is a law act through the PlayController, exactly the acts the 2D twin dispatches):
//   drag from a post to another post        → { wire, a, b }
//   tap a wire's knot                       → { unwire, a, b }
//   tap the switch (or the "toggle" pad)    → { toggle, id: "s" }
//   undo / run                              → { undo } / { run }
// No live glow and no snapping: nothing on the bench says whether it will work until RUN. After a run the law's answer
// stays while the board it judged is the board on the bench: current beads one way round the law's own loop
// (currentLoop) and the bulb lit, or a short spark at the spot the answer points to, with the law's why in words
// (yantra.circuit.why.*). The DOM chrome (goal, controls) is the 2D twin's, word for word.
import type { Moment, YantraAct } from "../../../../shared/play.ts";
import type { PlayController } from "../../core/controller.ts";
import type { PointerKind } from "../../core/stage.ts";
import type { ControlSpec, Readout } from "../../core/viewkit.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../words.ts";
import type { Core3D, DressedSpec, EngineDeps, EngineView, LabelHandle } from "../core3d/api.ts";
import { currentLoop, wireEnds, type CircuitParams, type CircuitState } from "../../families/yantra/circuit.logic.ts";
import type { Vector3 } from "three";
import { THEMES, themeOf, type YantraTheme } from "./palette.ts";
import { KitScene, POST_TOP } from "./kit.ts";
import { nearest } from "./rig.ts";
import { hint, LANGTAG } from "./words.ts";

const TAP = 8;
const NAMES: Record<string, string> = { cell: "cell", bulb: "bulb", switch: "switch", clip: "clip", eraser: "eraser" };

export function createCircuit(core: Core3D, deps: EngineDeps): EngineView {
  const { level, lang } = deps;
  const ctl = deps.ctl as unknown as PlayController<CircuitParams, CircuitState, YantraAct>;
  const p = level.params as CircuitParams;
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, k as WordKey, v);
  const st = () => ctl.state;
  let theme: YantraTheme = themeOf(deps.spec.dress.theme);
  const scene = new KitScene(core.scene as import("three").Scene, p, THEMES[theme], () => core.cosmeticRandom(), core.reduced);
  core.camera = scene.rig.cam;
  core.labelColors(THEMES[theme].labels);
  core.progress.set("level", level.levelId, { level: "start" });
  const hasSw = p.parts.some((x) => x.kind === "switch");

  let box = { w: 1, h: 1 };
  let busyNow = true;
  let shownFor: string | null = null;           // the board signature the answer on the bench was drawn for

  // ── labels: each part's name under its board, + and − over the cell's posts, one line at the bottom (a hint before
  //    the first wire, the law's answer after a run)
  const tag = LANGTAG[lang];
  const names: LabelHandle[] = p.parts.map((x, i) => core.label({ id: `part${i}`, text: W(`yantra.circuit.part.${NAMES[x.kind]}`), lang: tag, size: 14, kind: "text", at: { x: 0, y: 0, z: 0 }, align: "top", hidden: true }));
  const plus = core.label({ id: "plus", text: "+", lang: "en", size: 18, kind: "numeral", at: { x: 0, y: 0, z: 0 }, align: "bottom", dy: -6, hidden: true });
  const minus = core.label({ id: "minus", text: "−", lang: "en", size: 18, kind: "numeral", at: { x: 0, y: 0, z: 0 }, align: "bottom", dy: -6, hidden: true });
  const line = core.label({ id: "line", text: "", lang: tag, size: 15, kind: "text", at: { box: { x: 0, y: 0 } }, align: "bottom", hidden: true, keepInBox: true });

  const sig = (s: CircuitState) => `${[...s.wires].sort().join(",")}#${s.sw ? 1 : 0}`;
  /** the board the last run judged is still the board on the bench */
  function showing(): boolean {
    const s = st(), l = s.last;
    return !!l && l.sw === s.sw && l.wires.length === s.wires.length && l.wires.every((k) => s.wires.includes(k));
  }
  function labels(): void {
    const s = st();
    p.parts.forEach((x, i) => {
      const c = scene.centreOf(x.kind);
      names[i].set(c ? { hidden: false, at: { x: c.x, y: 0.12, z: c.z + 0.72 } } : { hidden: true });
    });
    const cp = scene.post("c+"), cm = scene.post("c-");
    plus.set(cp ? { hidden: false, at: { x: cp.x, y: POST_TOP + 0.12, z: cp.z } } : { hidden: true });
    minus.set(cm ? { hidden: false, at: { x: cm.x, y: POST_TOP + 0.12, z: cm.z } } : { hidden: true });
    const why = showing() ? s.last?.why ?? null : null;
    const at = { box: { x: box.w / 2, y: box.h - 8 } };
    if (why === "glow") line.set({ text: W("yantra.circuit.glow"), role: "good", hidden: false, at });
    else if (why) line.set({ text: W(`yantra.circuit.why.${why}`), role: "look", hidden: false, at });
    else if (!s.done && !s.runs && s.wires.length === p.pre.length) line.set({ text: hint(lang, p.pre.length ? "cut" : "wire"), role: "ink", hidden: false, at });
    else line.set({ hidden: true });
  }
  /** the law's answer, for the board on the bench (or nothing when the board has moved on since the run) */
  function answer(sound = true): void {
    const s = st(), on = showing() ? s.last : null;
    const key = on ? sig(s) : null;
    // the short's leads: every wire at a cell end (the 2D twin tints the same)
    scene.syncWires(s.wires, on?.why === "short" ? new Set(s.wires.filter((k) => wireEnds(k).some((t) => t === "c+" || t === "c-"))) : null);
    if (key === shownFor) return;
    shownFor = key;
    if (!on) { scene.show(null, core.t); return; }
    const loop = on.why === "glow" ? currentLoop(p, s.wires, s.sw) : null;
    const dark: Vector3[] = [];
    if (on.why === "open_loop" || on.why === "no_cell") {
      const bare = ["c+", "c-", "b1", "b2"].filter((t) => !s.wires.some((x) => wireEnds(x).includes(t)));
      const er = scene.centreOf("eraser");
      if (bare.length) for (const t of bare) { const q = scene.post(t); if (q) dark.push(q.clone().setY(POST_TOP + 0.2)); }
      else if (er) dark.push(er.setY(0.55));
      else { const q = scene.post("b1"); if (q) dark.push(q.clone().setY(POST_TOP + 0.2)); }
    } else if (on.why === "short") { const c = scene.centreOf("cell"); if (c) dark.push(c.setY(0.75)); }
    else if (on.why !== "glow") { const c = scene.centreOf("switch"); if (c) dark.push(c.setY(0.7)); }
    const ev = scene.show({ loop, wires: s.wires, dark }, core.t);
    if (!sound) return;
    if (ev?.kind === "lit") core.audio.sfx("good");
    else if (on.why === "short") { core.audio.sfx("miss"); core.shake(3); }
    else core.audio.sfx(on.why === "switch_open" ? "near" : "look");
  }
  function refresh(sound = true): void { scene.setSwitch(st().sw); answer(sound); labels(); core.invalidate(); }

  function act(a: YantraAct): void { ctl.dispatch(a); deps.changed(); }
  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as YantraAct | undefined;
    if (last?.kind === "wire") core.audio.sfx(refused ? "look" : "land");
    if (last?.kind === "unwire") core.audio.sfx(refused ? "look" : "undo");
    if (last?.kind === "toggle") core.audio.sfx(refused ? "look" : "select");
    if (last?.kind === "undo") core.audio.sfx("undo");
    if (last?.kind === "run") {
      if (refused === "wire_first") core.audio.sfx("look");
      else core.audio.sfx("reveal");
    }
    const solved = ms.find((m) => m.kind === "solved");
    if (solved) core.progress.set("done", true, { moment: "solved", seq: solved.seq });
    refresh(); deps.changed();
  }

  // ── input: one finger. A drag from a post draws a wire; a tap on a knot cuts it; a tap on the switch flips it; a drag
  //    anywhere else turns the bench a little
  let drag: { sx: number; sy: number; lx: number; moved: number; from: string | null; knot: string | null; sw: boolean } | null = null;
  let over: string | null = null;
  const screenOf = (v: Vector3) => core.project({ x: v.x, y: v.y, z: v.z });
  function postUnder(x: number, y: number, r = 30): string | null {
    const ts = scene.terminals(), i = nearest(ts.map(([, v]) => screenOf(v)), x, y, r);
    return i >= 0 ? ts[i][0] : null;
  }
  function knotUnder(x: number, y: number): string | null {
    const ks = scene.knotsAt(), i = nearest(ks.map(([, v]) => screenOf(v)), x, y, 24);
    return i >= 0 ? ks[i][0] : null;
  }
  function down(x: number, y: number): void {
    if (st().done) { drag = { sx: x, sy: y, lx: x, moved: 0, from: null, knot: null, sw: false }; return; }
    const from = postUnder(x, y);
    const knot = from ? null : knotUnder(x, y);
    const sw = !from && !knot && hasSw && scene.onSwitch(x, y);
    drag = { sx: x, sy: y, lx: x, moved: 0, from, knot, sw };
    if (from) { ctl.finger(true); core.audio.sfx("select"); scene.ringsAt([from, null]); core.invalidate(); }
  }
  function move(x: number, y: number): void {
    if (!drag) return;
    drag.moved = Math.max(drag.moved, Math.hypot(x - drag.sx, y - drag.sy));
    if (drag.from) {
      over = postUnder(x, y, 34);
      if (over === drag.from) over = null;
      const q = over ? scene.post(over) : scene.rig.onPlane(x, y, POST_TOP);
      scene.rubber(drag.from, q ? q.clone() : null);
      scene.ringsAt([drag.from, over]);
      core.invalidate();
    } else if (!drag.knot && !drag.sw && drag.moved > TAP) { scene.rig.orbit(x - drag.lx); core.invalidate(); }
    drag.lx = x;
  }
  function up(x: number, y: number, cancel = false): void {
    const d = drag; drag = null;
    if (!d) return;
    if (d.from) {
      ctl.finger(false);
      const to = cancel ? null : postUnder(x, y, 34);
      scene.rubber(null, null); scene.ringsAt([null, null]); over = null;
      if (to && to !== d.from) act({ kind: "wire", a: d.from, b: to });
      else core.invalidate();
      return;
    }
    if (cancel || d.moved > TAP) return;
    if (d.knot && knotUnder(x, y) === d.knot) { const [a, b] = wireEnds(d.knot); act({ kind: "unwire", a, b }); }
    else if (d.sw && scene.onSwitch(x, y)) act({ kind: "toggle", id: "s" });
  }

  // ── chrome: the 2D twin's, word for word
  function goal(): string {
    if (p.pre.length) return W("yantra.circuit.goal.fix");
    if (p.goal === "switch") return W(p.at === "after" ? "yantra.circuit.goal.after" : "yantra.circuit.goal.switch");
    return W("yantra.circuit.goal.light");
  }
  const readouts = (): Readout[] => [];
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    const out: ControlSpec[] = [];
    if (hasSw) out.push({ id: "toggle", label: W("yantra.circuit.toggle"), aria: s.sw ? "switch closed: open it" : "switch open: close it", kind: "pad", group: "board", pressed: s.sw, onPress: () => act({ kind: "toggle", id: "s" }) });
    out.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) });
    out.push({ id: "run", label: W("yantra.circuit.run"), kind: "primary", group: "go", you: s.wires.length > 0 && !showing(), disabled: !s.wires.length, onPress: () => act({ kind: "run" }) });
    return out;
  }

  function applyTheme(t: YantraTheme): void { theme = t; scene.setTheme(THEMES[t]); core.labelColors(THEMES[t].labels); core.invalidate(); }
  function redress(spec: DressedSpec): boolean { if (ctl.acts.length) return false; applyTheme(themeOf(spec.dress.theme)); return true; }

  refresh();
  const view: EngineView = {
    layout(b) {
      box = { w: b.w, h: b.h };
      scene.layout(b.w, b.h, { top: 22, bottom: 40, side: 8 });
      shownFor = "relayout"; refresh(false);
      const r = scene.rig.rectOf(scene.keyPoints()); core.target("board", r.x, r.y, r.w, r.h);
      core.invalidate();
    },
    update(dt) { busyNow = scene.step(dt, core.t) || !!drag; },
    busy: () => busyNow,
    pointer(kind: PointerKind, x: number, y: number) {
      if (kind === "down") down(x, y); else if (kind === "move") move(x, y); else if (kind === "up") up(x, y); else up(x, y, true);
    },
    key(k: string) { if ((k === "Enter" || k === " ") && !st().done && st().wires.length) act({ kind: "run" }); },
    goal, readouts, controls, react, redress,
    speaking: () => { /* nothing on the bench waits on her voice */ },
    dispose() { for (const l of [...names, plus, minus, line]) l.remove(); scene.dispose(); },
  };
  if (typeof location !== "undefined" && /[?&]family=yantra\b/.test(location.search)) (window as unknown as { __yantra: unknown }).__yantra = {
    scene, theme: () => theme, setTheme: (t: string) => applyTheme(themeOf(t)),
    /** where a terminal shows on screen (CSS px in the box): the harness drags between them */
    px: (t: string) => { const q = scene.post(t); return q ? screenOf(q) : null; },
    knot: (k: string) => { const o = scene.knotsAt().find(([x]) => x === k); return o ? screenOf(o[1]) : null; },
  };
  return view;
}
