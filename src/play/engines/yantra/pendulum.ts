// Yantra (E6) · the pendulum law in 3D (core3d@1). A VIEW over the EXISTING law (src/play/families/yantra/pendulum.logic.ts):
// a lab stand on the bench (stand.ts), the thread and the bob, the target rhythm beside it.
//
// Law mapping (the acts the 2D twin dispatches, nothing else):
//   drag the bob up / down (match)          → ONE { set, knob: "length", value } on release, snapped to 5 cm
//   the ± pads (thread, bob, swing)         → { set, knob, value }  (the 2D twin's controls, same ids)
//   run / let go                            → { run }
//   a tap on the world or "one more"        → { count, at }  (oscillation: seconds since the release, as the 2D twin)
//   undo                                    → { undo }
// RUN lets the bob go: θ(t) = θ0 cos(2πt / T) with the law's own T (periodOf), while the drum is struck (or the bell
// rings) every T*; the ghost at the start side flashes each time the bob comes back to it, so the two rhythms are seen side
// by side. The law's answer is shown after two beats, as the 2D twin does. No formula, no live period readout; the HUD is
// the bob's mass, the beat, and one line at the bottom.
import type { Moment, YantraAct } from "../../../../shared/play.ts";
import type { PlayController } from "../../core/controller.ts";
import type { PointerKind } from "../../core/stage.ts";
import type { ControlSpec, Readout } from "../../core/viewkit.ts";
import { say } from "../../copy.ts";
import { word, type WordKey } from "../words.ts";
import type { Core3D, DressedSpec, EngineDeps, EngineView, LabelHandle } from "../core3d/api.ts";
import { BOBS, LEN, LENGTHS, SWINGS, periodOf, type Knob, type PendulumParams, type PendulumState } from "../../families/yantra/pendulum.logic.ts";
import { THEMES, themeOf, type YantraTheme } from "./palette.ts";
import { K, PIV_Y, StandScene } from "./stand.ts";
import { hint, LANGTAG } from "./words.ts";

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

export function createPendulum(core: Core3D, deps: EngineDeps): EngineView {
  const { level, lang } = deps;
  const ctl = deps.ctl as unknown as PlayController<PendulumParams, PendulumState, YantraAct>;
  const p = level.params as PendulumParams;
  const match = p.goal === "match", beat = p.beat ?? 1, n = p.n ?? 5;
  const W = (k: string, v: Record<string, string | number> = {}) => word(lang, `yantra.pendulum.${k}` as WordKey, v);
  const st = () => ctl.state;
  const side = p.side === "right" ? 1 : -1;
  let theme: YantraTheme = themeOf(deps.spec.dress.theme);
  const scene = new StandScene(core.scene as import("three").Scene, p, THEMES[theme], () => core.cosmeticRandom(), core.budget.particles, core.reduced);
  core.camera = scene.rig.cam;
  core.labelColors(THEMES[theme].labels);
  core.progress.set("level", level.levelId, { level: "start" });

  // ── the run being animated (as the 2D twin: core.t at the release, its period, pull and length) and the beat's clock
  let runAt = -1, runT = 1, runSwing = 10, runLen = p.length, runEnd = 0;
  let introAt = -1, lastBeat = -1, lastBack = -1, nextBeat = 1, nextBack = 1;
  let revealAt = -1, shownT: number | null = null, outcome: "solved" | "miss" | "mal" | null = null, outFacts: Record<string, string | number> = {};
  let goodPending = false;
  let drag = false, dragLen: number | null = null, shownLen = st().k.length;
  let box = { w: 1, h: 1 }, busyNow = true;

  // ── labels: the bob's mass, the scale's 50 cm words (fade 1), the beat under the target (or the stopwatch over the
  //    rack), and one line at the bottom (a hint before the first run, the law's answer after it)
  const tag = LANGTAG[lang];
  const massL = core.label({ id: "mass", text: "", lang: "en", size: 18, kind: "numeral", at: { x: 0, y: 0, z: 0 }, align: "center", hidden: true });
  const lenL = core.label({ id: "len", text: "", lang: "en", size: 18, kind: "numeral", at: { x: 0, y: 0, z: 0 }, align: "bottom", dy: -8, role: "you", hidden: true });
  const marks: LabelHandle[] = scene.marksAt().map((m) => core.label({ id: `cm${m.cm}`, text: String(m.cm), lang: "en", size: 18, kind: "numeral", at: { x: m.at.x, y: m.at.y, z: m.at.z }, align: "center", dx: -16 }));
  const beatL = core.label({ id: "beat", text: match ? W("every", { t: beat.toFixed(2) }) : "0.0 s", lang: match ? tag : "en", size: 16, kind: match ? "text" : "numeral", at: { x: 0, y: 0, z: 0 }, align: "bottom", dy: -4, role: "q2" });
  const line = core.label({ id: "line", text: "", lang: tag, size: 15, kind: "text", at: { box: { x: 0, y: 0 } }, align: "bottom", hidden: true, keepInBox: true });

  const lenNow = () => dragLen ?? st().k.length;
  /** the thread's angle now, degrees (0 = straight down; the sign is the side) */
  function angle(): number {
    const s = st();
    if (runAt < 0) return side * s.k.swing;
    const t = core.t - runAt;
    let amp = runSwing;
    if (t > runEnd) amp *= Math.exp(-(t - runEnd) / 1.2);   // the run is over: the swing dies away (the period never changes)
    return side * amp * Math.cos((2 * Math.PI * t) / runT);
  }
  function startRun(): void {
    const s = st();
    runAt = core.t; runLen = match ? s.k.length : p.length; runT = periodOf(runLen); runSwing = s.k.swing;
    runEnd = match ? Math.max(4 * Math.max(runT, beat), 6) : (n + 2) * runT + 3;
    nextBeat = 1; nextBack = 1; lastBeat = match ? core.t : -1; lastBack = -1;
    revealAt = match ? runAt + 2 * Math.max(runT, beat) : -1;
    outcome = null; goodPending = false;
    if (match) core.audio.sfx(p.ctx === "drum" ? "land" : "select");
  }
  const act = (a: YantraAct) => { ctl.dispatch(a); deps.changed(); };
  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as YantraAct | undefined;
    if (last?.kind === "set") core.audio.sfx(refused ? "look" : "aim", { x: 0.5 });
    if (last?.kind === "run" && !refused) startRun();
    if (last?.kind === "count") core.audio.sfx(refused ? "look" : "select");
    if (last?.kind === "undo") { runAt = -1; revealAt = -1; outcome = null; shownT = null; core.audio.sfx("undo"); }
    for (const m of ms) {
      if (m.kind === "solved") { outcome = "solved"; goodPending = true; core.progress.set("done", true, { moment: "solved", seq: m.seq }); }
      if (m.kind === "misconception_consequence") outcome = "mal";
      if (m.kind === "law_refused" || m.kind === "near_miss") outcome = "miss";
      if (m.kind !== "first_act") outFacts = m.facts;
    }
    if (!match && outcome) { revealAt = core.t; runEnd = Math.min(runEnd, core.t - runAt + 2 * runT); }
    core.invalidate(); deps.changed();
  }

  // ── input
  function bobHit(x: number, y: number): boolean {
    const b = scene.bobAt(), c = core.project({ x: b.at.x, y: b.at.y, z: b.at.z }), e = core.project({ x: b.at.x + b.r, y: b.at.y, z: b.at.z });
    return Math.hypot(c.x - x, c.y - y) <= Math.max(30, Math.abs(e.x - c.x) + 14);
  }
  let orbit: { lx: number } | null = null;
  function pointer(kind: PointerKind, x: number, y: number): void {
    const s = st();
    if (!match) {
      if (kind === "down" && !s.done && s.live && runAt >= 0) { act({ kind: "count", at: Math.round((core.t - runAt) * 100) / 100 }); return; }
      if (kind === "down") orbit = { lx: x }; else if (kind === "move" && orbit) { scene.rig.orbit(x - orbit.lx); orbit.lx = x; core.invalidate(); } else orbit = null;
      return;
    }
    if (kind === "down" && !s.done && bobHit(x, y)) { drag = true; ctl.finger(true); runAt = -1; revealAt = -1; dragLen = s.k.length; core.audio.sfx("select"); }
    else if (kind === "down") orbit = { lx: x };
    else if (kind === "move" && drag) {
      const q = scene.rig.onWall(x, y, 0);
      if (q) {
        const a = side * s.k.swing * (Math.PI / 180), d = (Math.cos(a) * (PIV_Y - q.y) + Math.sin(a) * q.x) / K;
        const L = clamp(Math.round(d / LEN.step) * LEN.step, LEN.min, LEN.max);
        if (L !== dragLen) { dragLen = L; core.audio.sfx("aim", { x: (L - LEN.min) / (LEN.max - LEN.min) }); }
      }
    } else if (kind === "move" && orbit) { scene.rig.orbit(x - orbit.lx); orbit.lx = x; }
    else if ((kind === "up" || kind === "cancel") && drag) {
      drag = false; ctl.finger(false);
      const L = dragLen; dragLen = null;
      if (L !== null && L !== s.k.length && kind === "up") act({ kind: "set", knob: "length", value: L });
    } else orbit = null;
    core.invalidate();
  }

  // ── per frame: the beat, the bob's returns, the reveal (the 2D twin's clock, on core.t)
  function update(dt: number): void {
    const t = core.t;
    if (introAt < 0) { introAt = t; lastBeat = t; if (match) core.audio.sfx(p.ctx === "drum" ? "land" : "select"); }
    const t0 = runAt >= 0 && match ? runAt : introAt;
    const span = runAt >= 0 && match ? runEnd : 3 * beat;
    if (match && t - t0 >= nextBeat * beat && nextBeat * beat <= span) { lastBeat = t0 + nextBeat * beat; nextBeat++; core.audio.sfx(p.ctx === "drum" ? "land" : "select"); }
    if (runAt >= 0 && t - runAt >= nextBack * runT && nextBack * runT <= runEnd) { lastBack = runAt + nextBack * runT; nextBack++; }
    if (revealAt >= 0 && t >= revealAt && match && st().lastT !== null && shownT !== st().lastT) shownT = st().lastT;
    if (goodPending && revealAt >= 0 && t >= revealAt) {
      goodPending = false; core.audio.sfx("good");
      scene.burst(scene.bobAt().at, THEMES[theme].good);
    }
    if (runAt >= 0 && t - runAt > runEnd + 5 && (match || !st().live || t - runAt > (n + 3) * runT + 5)) runAt = -1;
    // the thread follows the knob on a spring (a pad press reads as the thread let out or taken in)
    const target = runAt >= 0 ? runLen : lenNow();
    shownLen = core.reduced || drag ? target : shownLen + (target - shownLen) * (1 - Math.exp(-dt * 12));
    if (Math.abs(target - shownLen) < 0.05) shownLen = target;
    const s = st(), sw = runAt >= 0 ? runSwing : s.k.swing;
    scene.pose(shownLen, angle(), s.k.mass);
    scene.ghostAt(shownLen, side * sw, s.k.mass, lastBack >= 0 ? Math.exp(-(t - lastBack) / 0.2) : 0);
    if (match) scene.beat(lastBeat >= 0 ? t - lastBeat : 9);
    else scene.counted(s.taps.length);
    const moving = scene.step(dt);
    labels();
    busyNow = moving || drag || runAt >= 0 || Math.abs(target - shownLen) > 0 || (introAt >= 0 && t - introAt < 3 * beat + 0.5) || goodPending || (revealAt >= 0 && t < revealAt + 0.5);
  }
  const revealed = () => revealAt >= 0 && core.t >= revealAt;
  function labels(): void {
    const s = st(), b = scene.bobAt(), len = drag || dragLen !== null ? dragLen ?? s.k.length : null;
    // the mass sits on the side away from the start side's ghost (it never covers the flash the child counts by)
    massL.set({ text: `${s.k.mass} g`, hidden: false, at: { x: b.at.x - side * b.r, y: b.at.y, z: b.at.z }, dx: -side * 34 });
    lenL.set(len !== null ? { text: `${len} cm`, hidden: false, at: { x: b.at.x, y: b.at.y + b.r, z: b.at.z } } : { hidden: true });
    const tw = scene.targetWordAt();
    if (match) beatL.set({ at: { x: tw.x, y: tw.y, z: tw.z } });
    else {
      const clock = runAt >= 0 && s.live ? core.t - runAt : s.taps.length ? s.taps[s.taps.length - 1] : 0;
      beatL.set({ text: `${clock.toFixed(1)} s`, at: { x: tw.x, y: tw.y, z: tw.z } });
    }
    const at = { box: { x: box.w / 2, y: box.h - 8 } };
    if (match) {
      if (shownT !== null && revealed()) line.set({ text: `${W("yours")} ${W("about", { t: shownT.toFixed(2) })}`, role: outcome === "solved" ? "good" : "look", hidden: false, at });
      else if (!s.runs && !s.done) line.set({ text: hint(lang, "length"), role: "ink", hidden: false, at });
      else line.set({ hidden: true });
    } else {
      const last = s.taps[s.taps.length - 1] ?? 0;
      const msg = revealed() && outcome ? (outcome === "solved" ? W("counted", { n, s: last.toFixed(1), t: (last / n).toFixed(2) }) : outcome === "mal" ? W("real", { r: String(outFacts.real ?? "") }) : "") : "";
      if (msg) line.set({ text: msg, role: outcome === "solved" ? "good" : "look", hidden: false, at });
      else if (!s.done && s.live && runAt >= 0 && !s.taps.length) line.set({ text: hint(lang, "count"), role: "ink", hidden: false, at });
      else line.set({ hidden: true });
    }
  }

  // ── chrome: the 2D twin's, word for word (no readouts: the stage shows them; phones keep the goal line whole)
  function goal(): string { return match ? W("goal.match", { t: beat.toFixed(2) }) : W("goal.oscillation", { n }); }
  const readouts = (): Readout[] => [];
  function step<T extends number>(xs: readonly T[], cur: number, d: number): number | null { const i = xs.indexOf(cur as T) + d; return i >= 0 && i < xs.length ? xs[i] : null; }
  function controls(): ControlSpec[] {
    const s = st(); if (s.done) return [];
    if (!match) {
      return [
        { id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) },
        { id: "run", label: W("release"), kind: s.live ? "secondary" : "primary", group: "go", you: !s.live, onPress: () => act({ kind: "run" }) },
        { id: "count", label: W("count", { k: s.taps.length + 1 }), aria: "count one oscillation", kind: "primary", group: "count", you: s.live && runAt >= 0, disabled: !s.live || runAt < 0, onPress: () => act({ kind: "count", at: Math.round((core.t - runAt) * 100) / 100 }) },
      ];
    }
    const pad = (id: string, knob: Knob, label: string, aria: string, v: number | null): ControlSpec =>
      ({ id, label, aria, kind: "pad", group: knob, disabled: v === null, onPress: () => { if (v !== null) { runAt = -1; revealAt = -1; act({ kind: "set", knob, value: v }); } } });
    return [
      pad("len-down", "length", `${W("length")} −`, "shorter thread", step(LENGTHS, s.k.length, -1)),
      pad("len-up", "length", `${W("length")} +`, "longer thread", step(LENGTHS, s.k.length, 1)),
      pad("mass-down", "mass", `${W("mass")} −`, "lighter bob", step(BOBS, s.k.mass, -1)),
      pad("mass-up", "mass", `${W("mass")} +`, "heavier bob", step(BOBS, s.k.mass, 1)),
      pad("swing-down", "swing", `${W("swing")} −`, "smaller pull", step(SWINGS, s.k.swing, -1)),
      pad("swing-up", "swing", `${W("swing")} +`, "bigger pull", step(SWINGS, s.k.swing, 1)),
      { id: "undo", label: say(lang, "undo"), kind: "secondary", group: "go", onPress: () => act({ kind: "undo" }) },
      { id: "run", label: W("run"), kind: "primary", group: "go", you: true, onPress: () => act({ kind: "run" }) },
    ];
  }

  function applyTheme(t: YantraTheme): void { theme = t; scene.setTheme(THEMES[t]); core.labelColors(THEMES[t].labels); core.invalidate(); }
  function redress(spec: DressedSpec): boolean { if (ctl.acts.length) return false; applyTheme(themeOf(spec.dress.theme)); return true; }

  scene.pose(shownLen, angle(), st().k.mass);
  const view: EngineView = {
    layout(b) {
      box = { w: b.w, h: b.h };
      scene.layout(b.w, b.h, { top: 22, bottom: 40, side: 8 });
      const r = scene.rig.rectOf(scene.keyPoints()); core.target("world", r.x, r.y, r.w, r.h);
      labels(); core.invalidate();
    },
    update, busy: () => busyNow, pointer,
    key(k: string) {
      if (k === "Enter" || k === " ") { const s = st(); if (s.done) return; if (!match && s.live && runAt >= 0) act({ kind: "count", at: Math.round((core.t - runAt) * 100) / 100 }); else act({ kind: "run" }); }
      else if (match && (k === "ArrowLeft" || k === "ArrowRight")) { const v = step(LENGTHS, st().k.length, k === "ArrowLeft" ? -1 : 1); if (v !== null) { runAt = -1; act({ kind: "set", knob: "length", value: v }); } }
    },
    goal, readouts, controls, react, redress,
    speaking: () => { /* the beat keeps its time; nothing waits on her voice */ },
    dispose() { for (const l of [massL, lenL, beatL, line, ...marks]) l.remove(); scene.dispose(); },
  };
  if (typeof location !== "undefined" && /[?&]family=yantra\b/.test(location.search)) (window as unknown as { __yantra: unknown }).__yantra = {
    scene, theme: () => theme, setTheme: (t: string) => applyTheme(themeOf(t)),
    bob: () => { const b = scene.bobAt(); return core.project({ x: b.at.x, y: b.at.y, z: b.at.z }); },
  };
  return view;
}
