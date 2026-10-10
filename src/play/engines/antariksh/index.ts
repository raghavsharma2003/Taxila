// E1 Antariksh: a 3D space-flight view over the EXISTING Nishana law (src/play/families/nishana/line.logic.ts). The
// skill is the mechanic: aiming the cannon IS placing a value on the number line; the target decloaks where the law says
// the value lives; the gap is drawn in the value's own form. Compare and rounding commit by FLYING INTO A GATE (a spatial
// commit, not a button): the gate of the smaller value, or the gate of the nearer landmark.
//
// Law mapping (every decision is a law act through the PlayController; the server replays them):
//   fire on value i      → { place, which: i, x }      then, when every value is placed, { commit }
//   fly into order gate  → { order, first: i }  (voice: order-0 / order-1 / order-same)
//   fly into round gate  → { round, to: lo | hi } (voice: "upar" / "neeche" → round-<hi> / round-<lo>)
//   ◀ ▶                  → { place } nudges of the current mark (the 2D view's step)
//   undo                 → { undo }
// Only the FIRST committed decision is evidence (core/replay.ts); re-firing after a reveal clears the target, never the
// grade. No points, lives, timers or locks: a miss leaves the target visible with the gap drawn, and the world waits.
import * as THREE from "three";
import type { LineAct, Moment, PlayLevel } from "../../../../shared/play.ts";
import type { LineParams, LineState } from "../../families/nishana/line.logic.ts";
import { lineHelpers as H } from "../../families/nishana/line.logic.ts";
import type { PlayController } from "../../core/controller.ts";
import type { ControlSpec, Readout } from "../../core/viewkit.ts";
import { say } from "../../copy.ts";
import type { Core3D, DressedSpec, EngineDeps, EngineView, LabelHandle } from "../core3d/api.ts";
import { buildWorld, CAM, LOOK, LINE_Y, LINE_Z, SHIP_Y, SHIP_Z, THEMES, VOLT, type TargetObj, type Theme, type Wrapper } from "./world.ts";

type Phase = "aim" | "flight" | "reveal" | "gates" | "done" | "doors" | "warp";
type GateMode = null | "order" | "round" | "doors";
const LANGTAG = { hinglish: "hi-Latn", en: "en", hi: "hi" } as const;

export function create(core: Core3D, depsIn: EngineDeps): EngineView {
  const scene = core.scene as THREE.Scene;
  let camera = core.camera as THREE.PerspectiveCamera;
  if (!(camera as THREE.PerspectiveCamera).isPerspectiveCamera) { camera = new THREE.PerspectiveCamera(58, 1, 0.1, 420); core.camera = camera; }
  camera.position.copy(CAM); camera.lookAt(LOOK); camera.fov = 58; camera.updateProjectionMatrix();
  const W = buildWorld(scene, () => core.cosmeticRandom());

  // ── per-level state (re-set by relevel)
  let level = depsIn.level as PlayLevel<LineParams>;
  let ctl = depsIn.ctl as unknown as PlayController<LineParams, LineState, LineAct>;
  let spec: DressedSpec = depsIn.spec;
  let lang = depsIn.lang;
  let changed = depsIn.changed;
  let p = level.params, span = p.hi - p.lo;
  let T: Theme = THEMES[spec.dress.theme] ?? THEMES["neela-nebula"];
  let wrapper = spec.dress.wrapper as Wrapper;
  let targets: TargetObj[] = [];
  let phase: Phase = "aim", phaseT = 0, gateMode: GateMode = null;
  let u = 0.5, uVis = 0.5, shipX = 0, shipVX = 0, speed = 1, warpK = 0, fovKick = 0;
  let cur = 0;
  const revealed = [false, false], cleared = [false, false];
  let lastCommit: { seq: number; moments: Moment[] } | null = null;
  let boltFrom = new THREE.Vector3(), boltTo = new THREE.Vector3();
  let pendingCommit = false;
  let doorChoose: ((d: "garam" | "teekha") => void) | null = null, doorList: { door: "garam" | "teekha"; hint: string }[] = [];
  let ghost: { t: number } | null = null;
  let firstActSeen = false;
  let lookAt = -1;
  /** the engine's own fire path is committing (react() must not reveal twice) */
  let selfCommit = false;

  // ── layout (solved for THIS box)
  let LW = 2, linePx = 300, boxW = 360, boxH = 400;
  let tickLabels: LabelHandle[] = [];
  const L = {
    aim: core.label({ id: "aim", text: "", lang: "en", size: 20, kind: "numeral", at: { x: 0, y: 0, z: 0 }, dy: -8, align: "bottom", role: "you", frac: true }),
    truth: [0, 1].map((i) => core.label({ id: `truth${i}`, text: "", lang: "en", size: 20, kind: "numeral", at: { x: 0, y: 0, z: 0 }, align: "bottom", role: "good", frac: true, hidden: true })),
    gap: [0, 1].map((i) => core.label({ id: `gap${i}`, text: "", lang: "en", size: 16, kind: "text", at: { x: 0, y: 0, z: 0 }, align: "top", role: "look", hidden: true })),
    gate: [0, 1, 2].map((i) => core.label({ id: `gate${i}`, text: "", lang: "en", size: 18, kind: "text", at: { x: 0, y: 0, z: 0 }, align: "top", hidden: true })),
    half: core.label({ id: "half", text: "", lang: "en", size: 15, kind: "text", at: { x: 0, y: 0, z: 0 }, align: "bottom", role: "look", hidden: true }),
    hint: core.label({ id: "hint", text: "", lang: "en", size: 16, kind: "text", at: { box: { x: 0, y: 0 } }, align: "bottom", hidden: true }),
    look: core.label({ id: "look", text: "", lang: "en", size: 16, kind: "text", at: { x: 0, y: 0, z: 0 }, align: "top", role: "look", hidden: true }),
  };
  const tl = () => LANGTAG[lang];
  const uToX = (uu: number) => -LW + uu * 2 * LW;
  const valToU = (x: number) => (x - p.lo) / span;
  const wpt = (uu: number, dy: number) => ({ x: uToX(uu), y: LINE_Y + dy, z: LINE_Z });
  const fmtTick = (v: number) => (p.values[0].form === "decimal" ? H.fmt(v) : p.values[0].form === "whole" && Math.abs(v) >= 1000 ? H.fmtWhole(v) : p.values[0].form === "integer" && v < 0 ? `−${-v}` : String(+v.toFixed(3)));
  const st = () => ctl.state;

  function layout(box: { w: number; h: number }): void {
    boxW = box.w; boxH = box.h;
    camera.aspect = box.w / box.h; camera.updateProjectionMatrix();
    const d = CAM.distanceTo(new THREE.Vector3(0, LINE_Y, LINE_Z)), halfH = d * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), halfW = halfH * camera.aspect;
    const endW = Math.max(fmtTick(p.lo).length, fmtTick(p.hi).length) * 18 * 0.62 + 18;
    const margin = Math.max(28, endW / 2 + 10);
    linePx = Math.max(160, Math.min(box.w - margin * 2, 720));
    LW = halfW * (linePx / box.w);
    W.bar.scale.x = LW * 2; W.glow.scale.x = LW * 2.1; W.curtain.scale.x = LW * 2.05;
    W.pylonL.position.set(-LW, 0.28, 0); W.pylonR.position.set(LW, 0.28, 0);
    buildTicks();
    L.hint.set({ at: { box: { x: box.w / 2, y: box.h - 10 } } });
    core.target("world", 0, 0, box.w, box.h);
    placeGates();
  }

  function buildTicks(): void {
    const { tmpM, tmpQ, tmpV, tmpS } = W;
    let k = 0;
    const nMaj = Math.round(span / p.major);
    for (let j = 0; j <= nMaj && k < 64; j++) { tmpM.compose(tmpV.set(uToX(valToU(p.lo + j * p.major)), 0.05, 0), tmpQ.identity(), tmpS.set(1, 0.42, 1)); W.ticks.setMatrixAt(k++, tmpM); }
    if (p.minor > 0) for (let v = p.lo + p.minor; v < p.hi - 1e-9 && k < 64; v += p.minor) {
      if (Math.abs((v - p.lo) / p.major - Math.round((v - p.lo) / p.major)) < 1e-6) continue;
      tmpM.compose(tmpV.set(uToX(valToU(v)), 0.02, 0), tmpQ.identity(), tmpS.set(0.85, 0.28, 0.85)); W.ticks.setMatrixAt(k++, tmpM);
    }
    W.ticks.count = k; W.ticks.instanceMatrix.needsUpdate = true;
    for (const t of tickLabels) t.remove();
    tickLabels = [];
    // labels on majors, thinned so no two overlap at this box (the ends are always labelled)
    const shown: number[] = [];
    const want = p.labels === "ends" ? [0, nMaj] : Array.from({ length: nMaj + 1 }, (_, j) => j);
    const est = (j: number) => fmtTick(p.lo + j * p.major).length * 18 * 0.62 + 16;
    const pxAt = (j: number) => (j / nMaj) * linePx;
    for (const j of want) {
      const last = shown[shown.length - 1];
      if (last === undefined || pxAt(j) - pxAt(last) >= (est(j) + est(last)) / 2 + 6) shown.push(j);
      else if (j === nMaj) { shown.pop(); const prev = shown[shown.length - 1]; if (prev === undefined || pxAt(j) - pxAt(prev) >= (est(j) + est(prev)) / 2 + 6) shown.push(j); }
    }
    for (const j of shown) tickLabels.push(core.label({ id: `tick${j}`, text: fmtTick(p.lo + j * p.major), lang: "en", size: 18, kind: "numeral", at: wpt(valToU(p.lo + j * p.major), -0.32), align: "top" }));
    // rounding: the halfway mark is the one landmark that decides up or down
    W.half.visible = p.goal === "round"; W.half.position.x = uToX(0.5);
    L.half.set({ text: say(lang, "line.half"), lang: tl(), hidden: p.goal !== "round", at: wpt(0.5, 0.78) });
  }

  function makeTargets(): void {
    for (const t of targets) { W.lineGroup.remove(t.g); }
    targets = p.values.map(() => W.makeTarget(wrapper));
    for (const t of targets) for (const m of t.mats) (m as THREE.MeshBasicMaterial).color?.setHex(T.target);
    for (const t of targets) { const lam = t.mats[0] as THREE.MeshLambertMaterial; lam.emissive?.setHex(T.target); }
  }

  function applyTheme(): void {
    T = THEMES[spec.dress.theme] ?? THEMES["neela-nebula"];
    W.theme(T, level.seed);
    for (const g of W.gates) { (g.tor.material as THREE.MeshBasicMaterial).color.setHex(T.garam); (g.disc.material as THREE.MeshBasicMaterial).color.setHex(T.garam); }
  }

  function startLevel(): void {
    p = level.params; span = p.hi - p.lo;
    wrapper = spec.dress.wrapper as Wrapper;
    applyTheme(); makeTargets();
    revealed.fill(false); cleared.fill(false); cur = 0; u = 0.5; lastCommit = null; pendingCommit = false; gateMode = null; lookAt = -1;
    firstActSeen = ctl.acts.length > 0;
    for (const m of W.marks) m.visible = false;
    for (const b of W.gapBars) (b.material as THREE.MeshBasicMaterial).opacity = 0;
    for (const l of [...L.truth, ...L.gap, ...L.gate]) l.set({ hidden: true });
    L.look.set({ hidden: true });
    hideGates();
    core.progress.set("cur", 0, { level: "start" });
    core.audio.music(spec.musicMood);
    L.hint.set({ text: say(lang, "ant.drag"), lang: tl(), hidden: false });
    if (boxW > 1) layout({ w: boxW, h: boxH });
    syncFromState();
    setPhase(phase === "warp" ? "warp" : "aim");
  }

  function setPhase(ph: Phase): void { phase = ph; phaseT = 0; core.invalidate(); }

  // ── the law answers: read everything from the controller's state (one truth)
  function syncFromState(): void {
    const s = st();
    for (let i = 0; i < p.values.length; i++) {
      const m = s.marks[i];
      W.marks[i].visible = m !== null && !cleared[i];
      if (m !== null) W.marks[i].position.x = uToX(valToU(m));
    }
    if (s.done) { gateMode = null; hideGates(); if (phase !== "doors" && phase !== "warp") setPhase("done"); }
    else if (s.landed && (p.goal === "compare" || p.goal === "round")) { gateMode = p.goal === "compare" ? "order" : "round"; placeGates(); }
    else if (gateMode === "order" || gateMode === "round") { gateMode = null; hideGates(); }
  }

  function act(a: LineAct): { moments: Moment[]; refused?: string; seq: number } {
    firstActSeen = true; L.hint.set({ hidden: true }); ghost = null;
    const r = ctl.dispatch(a);
    const seq = ctl.acts[ctl.acts.length - 1]?.seq ?? 0;
    changed();
    return { ...r, seq };
  }

  // ── the child's decisions
  function fire(): void {
    if (phase === "doors") { chooseDoor(); return; }
    if (phase === "gates" || gateMode) { flyGate(); return; }
    if (phase !== "aim") return;
    const s = st();
    const i = Math.min(cur, s.marks.length - 1);
    const x = +(p.lo + u * span).toFixed(4);
    const r = act({ kind: "place", which: i, x });
    core.progress.set("cur", i, { act: r.seq });
    core.audio.sfx(spec.verb === "scan" ? "scan" : "fire");
    try { navigator.vibrate?.(15); } catch { /* none */ }
    W.bolt.visible = true; W.bolt.position.set(W.ship.position.x, W.ship.position.y + 0.05, W.ship.position.z - 0.7);
    boltFrom = W.bolt.position.clone(); boltTo = new THREE.Vector3(uToX(valToU(x)), LINE_Y + 0.05, LINE_Z);
    pendingCommit = st().marks.every((m) => m !== null);
    setPhase("flight");
  }
  function landShot(): void {
    W.bolt.visible = false;
    if (!pendingCommit) {
      // a compare level: this value is placed; the other still waits (no reveal yet: both decloak together)
      core.audio.sfx("land"); W.burst(boltTo, 10, VOLT, 0.8, 0.4);
      const next = st().marks.findIndex((m) => m === null);
      if (next >= 0) { cur = next; core.progress.set("cur", next, { act: ctl.acts[ctl.acts.length - 1].seq }); }
      syncFromState(); setPhase("aim"); return;
    }
    selfCommit = true;
    const r = act({ kind: "commit" });
    selfCommit = false;
    lastCommit = { seq: r.seq, moments: r.moments };
    reveal(r.moments);
    setPhase("reveal");
  }
  function reveal(ms: Moment[]): void {
    const s = st();
    core.audio.sfx("reveal");
    let anyHit = false, anyMiss = false;
    p.values.forEach((v, i) => {
      if (cleared[i]) return;
      const truth = H.valueOf(v), tu = valToU(truth), mk = s.marks[i];
      revealed[i] = true;
      const t = targets[i]; t.g.visible = true; t.g.position.x = uToX(tu); t.g.scale.setScalar(0.01);
      L.truth[i].set({ text: v.text, hidden: false, at: wpt(tu, 1.25), frac: v.form === "fraction" });
      const hit = mk !== null && Math.abs(mk - truth) <= p.tol;
      const gb = W.gapBars[i], gm = gb.material as THREE.MeshBasicMaterial;
      if (hit) {
        anyHit = true; cleared[i] = true;
        const ms0 = ms.find((m) => m.kind === "solved" || m.kind === "progress");
        core.progress.set(`cleared${i}`, true, ms0 ? { moment: ms0.kind, seq: ms0.seq } : { act: lastCommit?.seq ?? 0 });
        gm.opacity = 0; L.gap[i].set({ hidden: true });
      } else if (mk !== null) {
        anyMiss = true;
        const a = uToX(valToU(mk)), b = uToX(tu);
        gb.position.set((a + b) / 2, -0.34 - i * 0.16, 0); gb.scale.x = Math.max(0.02, Math.abs(b - a)); gm.opacity = 0.9; gm.color.setHex(0xffd27a);
        const gi = H.gapInfo(v, mk);
        // below the tick-label band, a fixed pixel step per value (labels never share a band)
        L.gap[i].set({ text: say(lang, gi.exact ? "line.gap" : "line.gapAbout", { g: gi.g }), lang: tl(), hidden: false, at: wpt((valToU(mk) + tu) / 2, -0.32), dy: 34 + i * 32 });
      }
    });
    if (anyHit) {
      core.hitstop(60); core.shake(3);
      const best = Math.min(...p.values.map((v, i) => (st().marks[i] === null ? 1 : Math.abs((st().marks[i] as number) - H.valueOf(v)) / p.tol)));
      core.audio.sfx("hit", { c: 1 - Math.min(1, best) * 0.5 });
      try { navigator.vibrate?.([10, 30, 40]); } catch { /* none */ }
    }
    if (anyMiss) { core.audio.sfx(ms.some((m) => m.kind === "near_miss") ? "near" : "miss"); core.shake(1); }
    // the next value to fly at: the first one still not cleared
    const nxt = p.values.findIndex((_, i) => !cleared[i]);
    if (nxt >= 0 && nxt !== cur) { cur = nxt; core.progress.set("cur", nxt, { act: lastCommit?.seq ?? 0 }); }
  }
  function afterReveal(): void {
    for (let i = 0; i < targets.length; i++) if (cleared[i]) { targets[i].g.visible = false; L.truth[i].set({ hidden: true }); W.marks[i].visible = false; }
    syncFromState();
    if (phase === "reveal") setPhase(st().done ? "done" : "aim");
  }

  // ── gates: compare order, rounding landmarks, doors
  function gateUs(): number[] {
    if (gateMode === "order") return p.values.map((v) => valToU(H.valueOf(v)));
    if (gateMode === "round") return [0, 1];
    if (gateMode === "doors") return doorList.map((_, i) => (doorList.length === 1 ? 0.5 : i === 0 ? 0.22 : 0.78));
    return [];
  }
  function placeGates(): void {
    const us = gateUs();
    // the gates carry the values themselves: the truth labels step aside (no two labels in one place)
    if (us.length) for (const l of L.truth) l.set({ hidden: true });
    W.gates.forEach((g, i) => {
      const on = i < us.length;
      g.g.visible = on;
      if (!on) { L.gate[i].set({ hidden: true }); return; }
      g.g.position.x = uToX(us[i]);
      const col = gateMode === "doors" ? (doorList[i]?.door === "teekha" ? T.teekha : T.garam) : i === 0 ? T.garam : T.teekha;
      (g.tor.material as THREE.MeshBasicMaterial).color.setHex(col); (g.disc.material as THREE.MeshBasicMaterial).color.setHex(col);
      const text = gateMode === "order" ? p.values[i].text : gateMode === "round" ? H.fmtWhole(i === 0 ? p.lo : p.hi) : say(lang, doorList[i].door === "garam" ? "door.garam" : "door.teekha");
      L.gate[i].set({ text, hidden: false, kind: gateMode === "doors" ? "text" : "numeral", lang: gateMode === "doors" ? tl() : "en", role: gateMode === "doors" ? (doorList[i].door === "teekha" ? "q2" : "q1") : "ink", at: wpt(us[i], gateMode === "order" ? 2.05 : 1.95), align: "bottom", frac: gateMode === "order" && p.values[i].form === "fraction" });
    });
    if (us.length) { setPhase(gateMode === "doors" ? "doors" : "gates"); core.audio.sfx("gate"); }
  }
  function hideGates(): void { for (const g of W.gates) g.g.visible = false; for (const l of L.gate) l.set({ hidden: true }); }
  const nearestGate = () => { const us = gateUs(); let best = 0; us.forEach((g, i) => { if (Math.abs(g - u) < Math.abs(us[best] - u)) best = i; }); return best; };
  function flyGate(): void {
    if (!gateMode || gateMode === "doors") return;
    const i = nearestGate();
    if (gateMode === "order") orderAct(i); else roundAct(i === 0 ? p.lo : p.hi);
  }
  function orderAct(first: number): void {
    const r = act({ kind: "order", first });
    gateFeedback(r.moments, first);
  }
  function roundAct(to: number): void {
    const r = act({ kind: "round", to });
    gateFeedback(r.moments, to === p.lo ? 0 : 1);
  }
  function gateFeedback(ms: Moment[], i: number): void {
    const g = W.gates[Math.max(0, Math.min(2, i))];
    if (ms.some((m) => m.kind === "solved")) {
      core.audio.sfx("good"); core.hitstop(50);
      W.burst(g.g.getWorldPosition(new THREE.Vector3()), 90, T.garam, 3, 0.8);
      const sm = ms.find((m) => m.kind === "solved");
      if (sm) core.progress.set("done", true, { moment: "solved", seq: sm.seq });
      hideGates(); gateMode = null; L.look.set({ hidden: true }); setPhase("done");
    } else if (ms.some((m) => m.kind === "misconception_consequence" || m.kind === "law_refused")) {
      core.audio.sfx("look"); lookAt = core.t;
      if (gateMode === "order") L.look.set({ text: say(lang, "line.leftSmaller"), lang: tl(), hidden: false, at: wpt(0.5, -0.32), dy: 34 });
      if (gateMode === "round") L.look.set({ text: say(lang, "line.half"), lang: tl(), hidden: false, at: wpt(0.5, -0.32), dy: 34 });
    }
    syncFromState();
  }
  function chooseDoor(): void {
    if (!doorChoose || !doorList.length) return;
    const i = nearestGate(), d = doorList[i]?.door ?? "garam";
    const choose = doorChoose; doorChoose = null;
    core.audio.sfx("gate"); core.audio.sfx("warp");
    hideGates(); gateMode = null; setPhase("warp");
    choose(d);
  }

  function react(ms: Moment[], refused: string | undefined): void {
    const last = ctl.acts[ctl.acts.length - 1]?.act as LineAct | undefined;
    if (last?.kind === "undo") {
      // undo is a law act: re-read the marks; what the child has already seen revealed stays revealed
      for (const b of W.gapBars) (b.material as THREE.MeshBasicMaterial).opacity = 0;
      for (const l of L.gap) l.set({ hidden: true });
      core.audio.sfx("undo"); syncFromState();
      if (!st().landed && (phase === "gates" || gateMode)) { gateMode = null; hideGates(); setPhase("aim"); }
    } else if (last?.kind === "commit" && !selfCommit && refused !== "place_first") {
      // a commit from outside the fire path (a voice press routed elsewhere, the harness): the law answered, show it
      lastCommit = { seq: ctl.acts[ctl.acts.length - 1].seq, moments: ms };
      reveal(ms); setPhase("reveal");
    } else if ((last?.kind === "order" || last?.kind === "round") && !gateMode) {
      syncFromState();
    } else if (last?.kind === "place" && !refused) {
      syncFromState();
    }
    core.invalidate();
  }

  // ── input: drag anywhere steers (relative, precise); a short tap aims straight at the touched point
  let drag: { x0: number; y0: number; last: number; moved: number } | null = null;
  function lineU(x: number): number {
    const a = core.project(wpt(0, 0)), b = core.project(wpt(1, 0));
    return Math.max(0, Math.min(1, (x - a.x) / Math.max(1, b.x - a.x)));
  }
  function steer(du: number): void {
    if (!(phase === "aim" || phase === "gates" || phase === "doors")) return;
    const before = u; u = Math.max(0, Math.min(1, u + du));
    if (Math.abs(u - before) > 1e-4 && Math.floor(u * 40) !== Math.floor(before * 40)) core.audio.sfx("aim", { x: u });
    core.invalidate();
  }
  function pointer(kind: string, x: number, y: number): void {
    if (kind === "down") { drag = { x0: x, y0: y, last: x, moved: 0 }; ghost = null; return; }
    if (!drag) return;
    if (kind === "move") { const dx = x - drag.last; drag.last = x; drag.moved += Math.abs(dx); steer(dx / Math.max(1, linePx)); return; }
    if (kind === "up" && drag.moved < 6) { const t = lineU(x); steer(t - u); }
    drag = null;
  }
  function nudge(dir: -1 | 1): void {
    // the 2D view's step on the current mark (a law act) when a mark exists and nothing is revealed for it; else steer
    const step = (p.minor > 0 ? p.minor : p.major) / 4;
    if (phase === "aim") { u = Math.max(0, Math.min(1, u + (dir * step) / span)); core.audio.sfx("aim", { x: u }); core.invalidate(); changed(); return; }
    steer((dir * step) / span); changed();
  }

  // ── frame
  const tmpV = new THREE.Vector3();
  function update(dt: number): void {
    phaseT += dt;
    if (phase === "flight") {
      const k = Math.min(1, phaseT / 0.22);
      W.bolt.position.lerpVectors(boltFrom, boltTo, k);
      if (!core.reduced) W.burst(W.bolt.position, Math.max(1, Math.round(2 * core.budget.particles)), VOLT, 0.4, 0.25);
      if (k >= 1) landShot();
    } else if (phase === "reveal") {
      const k = Math.min(1, phaseT / 0.25);
      targets.forEach((t, i) => {
        if (!t.g.visible) return;
        if (cleared[i]) {
          const s = Math.max(0.01, (1 - Math.min(1, phaseT / 0.35)) * 1.4); t.g.scale.setScalar(s);
          if (phaseT < dt * 1.5 && !core.reduced) {
            const wp = t.g.getWorldPosition(tmpV), n = core.budget.particles;
            W.burst(wp, Math.round(160 * n), T.target, 5.5, 1.1); W.burst(wp, Math.round(90 * n), 0xffffff, 3, 0.7); W.burst(wp, Math.round(60 * n), VOLT, 2.2, 0.9);
            W.shock.position.copy(wp); W.shock.scale.setScalar(0.2); (W.shock.material as THREE.MeshBasicMaterial).opacity = 0.9; W.shock.lookAt(camera.position);
          }
        } else t.g.scale.setScalar(THREE.MathUtils.lerp(0.01, 1, k));
      });
      if (phaseT > (cleared.some(Boolean) && !p.values.some((_, i) => revealed[i] && !cleared[i]) ? 1.0 : 1.4)) afterReveal();
    } else if (phase === "warp") {
      warpK = Math.min(1, warpK + dt * 1.6);
      if (phaseT > 1.3 && pendingLevel) { const d = pendingLevel; pendingLevel = null; adopt(d); }
    }
    if (phase !== "warp") warpK = Math.max(0, warpK - dt * 2);
    if (phase === "gates" || phase === "doors") for (const g of W.gates) if (g.g.visible) { const s = Math.min(1, g.g.scale.x + dt * 3); g.g.scale.setScalar(Math.max(0.01, s)); if (!core.reduced) g.tor.rotation.z += dt * 1.2; }
    if (lookAt >= 0 && core.t - lookAt > 2.4) { lookAt = -1; L.look.set({ hidden: true }); }

    // ghost demonstration (teacher move "ghost-first"): the reticle sweeps to show "drag to aim"; no act, no grade
    if (ghost) {
      ghost.t += dt;
      const k = ghost.t / 2.4;
      if (k >= 1) { ghost = null; u = 0.5; }
      else u = 0.5 + 0.35 * Math.sin(k * Math.PI * 2);
    }

    // flight (cosmetic): the world streams toward the ship; pace only changes travel speed, never a deadline
    const pace = spec.dress.pace === "brisk" && spec.secure ? 1.6 : 1;
    const travel = core.reduced ? 0 : pace * (1 + warpK * 14);
    speed = THREE.MathUtils.lerp(speed, travel, Math.min(1, dt * 3));
    const dz = speed * 9 * dt;
    W.stream(dt, dz, core.reduced ? 0 : warpK);
    W.stepParticles(dt, dz);

    // the ship follows the aim on a spring and banks into the turn
    uVis += (u - uVis) * Math.min(1, dt * 14);
    const targetX = uToX(uVis) * ((SHIP_Z - CAM.z) / (LINE_Z - CAM.z));
    const ax = (targetX - shipX) * 60 - shipVX * 11; shipVX += ax * dt; shipX += shipVX * dt;
    if (core.reduced) { shipX = targetX; shipVX = 0; }
    W.ship.position.set(shipX, SHIP_Y + (core.reduced ? 0 : Math.sin(core.t * 2.1) * 0.05), SHIP_Z);
    W.ship.rotation.set(0.06, 0, THREE.MathUtils.clamp(-shipVX * 0.18, -0.7, 0.7));
    W.flame.scale.set(1, 1, 0.8 + core.cosmeticRandom() * 0.4 + warpK * 2.5);
    if (!core.reduced && Math.round(core.t * 60) % 2 === 0) W.burst(tmpV.set(shipX, W.ship.position.y, SHIP_Z + 1.0), 1, T.glow, 0.25, 0.35);
    W.reticle.position.x = uToX(uVis);
    W.reticle.visible = phase === "aim" || phase === "flight" || phase === "gates" || phase === "doors";
    if (!core.reduced) W.reticle.rotation.z += dt * 1.5;
    core.audio.hum(Math.min(1, (speed - 1) / 3 + Math.abs(shipVX) * 0.1));
    for (const t of targets) if (t.g.visible && !core.reduced) for (const o of t.spin) { o.rotation.y += dt * 1.3; o.rotation.x += dt * 0.5; }
    const sm = W.shock.material as THREE.MeshBasicMaterial;
    if (sm.opacity > 0) { W.shock.scale.multiplyScalar(1 + dt * 6); sm.opacity = Math.max(0, sm.opacity - dt * 1.8); }
    const fov = 58 + (core.reduced ? 0 : warpK * 26 + fovKick);
    if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
    camera.position.copy(CAM); camera.lookAt(LOOK);

    // the aim readout rides the reticle: the value being looked for, never the answer
    // the aim readout steps aside while a decloaked target's own label is up (the rail still names the value)
    const showAim = phase === "aim" && !st().done && !p.values.some((_, i) => revealed[i] && !cleared[i]);
    const v = p.values[Math.min(cur, p.values.length - 1)];
    L.aim.set({ text: showAim ? v.text : "", hidden: !showAim, at: wpt(uVis, 1.45), frac: v.form === "fraction" });
  }
  function busy(): boolean { return !core.reduced || phase === "flight" || phase === "reveal" || phase === "warp" || !!drag || !!ghost || Math.abs(u - uVis) > 1e-3 || W.liveParticles() > 0; }

  // ── chrome
  function goal(): string {
    const s = st();
    if (phase === "doors") return say(lang, "ant.goal.doors");
    if (s.done) return "";
    if (p.goal === "round") return s.landed ? say(lang, "ant.goal.round2", { t: say(lang, p.to && p.to >= 10000 ? "line.u10000" : p.to && p.to >= 1000 ? "line.u1000" : p.to && p.to >= 100 ? "line.u100" : "line.u10") }) : say(lang, `ant.goal.${wrapper}`, { v: p.values[0].text });
    if (p.goal === "compare") return s.landed ? say(lang, "ant.goal.cmp2") : say(lang, "ant.goal.cmp");
    return say(lang, `ant.goal.${wrapper}`, { v: p.values[0].text });
  }
  function readouts(): Readout[] {
    if (p.goal !== "compare") return [];
    return p.values.map((v, i) => ({ k: i === cur && !st().landed ? "▸" : "·", v: v.text, role: i === 0 ? "q1" : "q2" }));
  }
  function controls(): (ControlSpec & { voiceOnly?: boolean })[] {
    const s = st(), out: (ControlSpec & { voiceOnly?: boolean })[] = [];
    if (phase === "warp") return out;
    if (phase === "doors") {
      out.push({ id: "nudge-left", label: "◀", aria: "steer left", kind: "pad", group: "go", onPress: () => nudge(-1) });
      out.push({ id: "commit", label: say(lang, "ant.go"), kind: "primary", group: "go", you: true, onPress: () => fire() });
      out.push({ id: "nudge-right", label: "▶", aria: "steer right", kind: "pad", group: "go", onPress: () => nudge(1) });
      return out;
    }
    if (s.done) return out;
    const busyNow = phase === "flight" || phase === "reveal";
    out.push({ id: "nudge-left", label: "◀", aria: "steer left", kind: "pad", group: "go", disabled: busyNow, onPress: () => nudge(-1) });
    if (gateMode === "order") {
      out.push({ id: "commit", label: say(lang, "ant.go"), kind: "primary", group: "go", you: true, disabled: busyNow, onPress: () => fire() });
      for (const i of [0, 1]) out.push({ id: `order-${i}`, label: say(lang, "line.smaller", { v: p.values[i].text }), kind: "choice", group: "order", voiceOnly: true, onPress: () => orderAct(i) });
      out.push({ id: "order-same", label: say(lang, "ant.same"), kind: "choice", group: "order", voiceOnly: true, onPress: () => orderAct(-1) });
    } else if (gateMode === "round") {
      out.push({ id: "commit", label: say(lang, "ant.go"), kind: "primary", group: "go", you: true, disabled: busyNow, onPress: () => fire() });
      for (const end of [p.lo, p.hi]) out.push({ id: `round-${end}`, label: `${end === p.lo ? "↓" : "↑"} ${H.fmtWhole(end)}`, kind: "choice", group: "order", voiceOnly: true, onPress: () => roundAct(end) });
    } else {
      out.push({ id: "commit", label: say(lang, spec.verb === "scan" ? "ant.scan" : "ant.fire"), kind: "primary", group: "go", you: true, disabled: busyNow, onPress: () => fire() });
    }
    out.push({ id: "nudge-right", label: "▶", aria: "steer right", kind: "pad", group: "go", disabled: busyNow, onPress: () => nudge(1) });
    if (s.marks.some((m) => m !== null) || s.commits > 0) out.push({ id: "undo", label: say(lang, "undo"), kind: "secondary", group: "undo", disabled: busyNow, onPress: () => act({ kind: "undo" }) });
    return out;
  }

  function demo(): void { if (!firstActSeen && phase === "aim") { ghost = { t: 0 }; core.invalidate(); } }
  function doors(list: { door: "garam" | "teekha"; hint: string }[] | null, choose: (d: "garam" | "teekha") => void): boolean {
    if (!list || !list.length) { if (gateMode === "doors") { gateMode = null; hideGates(); } doorChoose = null; return true; }
    doorList = list.slice(0, 2); doorChoose = choose; gateMode = "doors"; u = 0.5; placeGates(); changed();
    return true;
  }
  let pendingLevel: EngineDeps | null = null;
  function adopt(d: EngineDeps): void {
    level = d.level as PlayLevel<LineParams>; ctl = d.ctl as unknown as PlayController<LineParams, LineState, LineAct>; spec = d.spec; lang = d.lang; changed = d.changed;
    phase = "aim"; startLevel(); changed();
  }
  function relevel(d: EngineDeps): void {
    // the next sector arrives in the world: if the warp is still playing, the new level waits for it to finish
    if (phase === "warp" && phaseT < 1.3) { pendingLevel = d; return; }
    adopt(d);
  }
  function redress(s: DressedSpec): boolean {
    if (ctl.acts.length || phase !== "aim") return false;
    spec = s; lang = s.dress.lang; applyTheme(); wrapper = s.dress.wrapper as Wrapper; makeTargets(); core.audio.music(s.musicMood);
    L.hint.set({ text: say(lang, "ant.drag"), lang: tl() }); changed();
    if (s.dress.teacherMove === "ghost-first") demo();
    return true;
  }

  startLevel();
  return {
    layout, update, pointer, busy, goal, readouts, controls, react, demo, doors, relevel, redress,
    key: (k: string) => { if (k === "ArrowLeft") nudge(-1); else if (k === "ArrowRight") nudge(1); else if (k === " " || k === "Enter") fire(); },
    speaking: () => { /* the bus ducks; nothing in the world waits on her voice */ },
    dispose: () => { for (const t of tickLabels) t.remove(); },
  };
}
