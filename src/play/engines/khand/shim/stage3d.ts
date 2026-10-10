// Khand's THIN ADAPTER for core3d@1 (G1's contract, copied verbatim into ./api.ts and ./tier.ts). It implements the Core3D
// an engine is handed — the canvas at the real box, the frame loop, the governor, DOM labels with their audit, the audio bus,
// the progress store, context loss — just enough for Khand, until main merges G1's src/play/engines/core3d. The port is a
// delete: remove this folder, import the API from ../core3d/api.ts, and add Khand's line to src/play/engines/registry.ts.
import type { Camera, PerspectiveCamera, Scene, WebGLRenderer } from "three";
type Three = typeof import("./three-core.ts");
import type { ArtId, Lang, Moment, PlayActBody, PlayLevel } from "../../../../../shared/play.ts";
import type { PlayController } from "../../../core/controller.ts";
import type { StageHandle } from "../../../core/stage.ts";
import type { ControlSpec, FamilyView, Readout } from "../../../core/viewkit.ts";
import { ART, newAudit, type Audit } from "../../../core/styles.ts";
import { sound, type SoundEvent } from "../../../core/sound.ts";
import { mulberry32, hash32 } from "../../../core/rng.ts";
import { dressFor, ENGINE_THEMES, TIER_BUDGET, type AudioBus, type Core3D, type EngineEntry, type EngineView, type LabelHandle, type LabelSpec, type Perf3D, type PlayTier, type ProgressStore, type Sfx, type Vec3 } from "./api.ts";
import { detectTier, noteContextLoss, tierFacts } from "./tier.ts";

export interface Stage3DOpts {
  level: PlayLevel; ctl: PlayController; lang: Lang; changed(): void;
  art: ArtId; young: boolean; classLevel?: number; reducedMotion?: boolean; sound?: boolean; onFail?(why: string): void;
  /** a fixed DPR (harness) */
  dpr?: number;
  /** the tier override ("3d" lets SwiftShader through for the proxy); null = detect */
  force?: PlayTier | null;
}
export interface Stage3DMount { view: FamilyView; stage: StageHandle; tier: PlayTier }

const SFX: Record<Sfx, SoundEvent> = { aim: "tick", fire: "drop", scan: "tick", reveal: "open", hit: "land", miss: "refuse", near: "tilt", gate: "open", warp: "slide", select: "select", undo: "slide", land: "land", good: "good", look: "look" };

export function mountStage3D(host: HTMLElement, entry: EngineEntry, o: Stage3DOpts): Stage3DMount {
  const art = ART[o.art];
  const audit: Audit = newAudit(o.art, o.young);
  const tierPick = detectTier(tierFacts(o.force ?? (typeof location !== "undefined" && /[?&]tier=3d\b/.test(location.search) ? "3d" : null)));
  const tier = tierPick.tier;
  const reduced = o.reducedMotion ?? (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches);
  if (o.sound === false) sound.setMuted(true);
  const failStub = (why: string): Stage3DMount => { o.onFail?.(why); return { view: stubView(), stage: stubStage(audit), tier }; };
  if (tier === "2d") return failStub(`tier_2d:${tierPick.why}`);

  const budget = { ...TIER_BUDGET[tier] };
  const canvas = document.createElement("canvas");
  canvas.className = "pl-canvas kh-canvas";
  canvas.setAttribute("role", "application");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;touch-action:none;display:block";
  host.appendChild(canvas);
  const layer = document.createElement("div");
  layer.className = "kh-labels";
  layer.style.cssText = "position:absolute;inset:0;pointer-events:none;overflow:hidden";
  host.appendChild(layer);
  // three.js and the engine load together, on demand: a 2D game never downloads them
  let T: Three | null = null, renderer: WebGLRenderer | null = null, scene: Scene | null = null, camera: Camera | null = null;
  let dpr = Math.min(o.dpr ?? Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, budget.dprCap), budget.dprCap);
  const dprSteps: number[] = [];
  let box = { w: 1, h: 1 }, t = 0, hitstop = 0, dirty = true, disposed = false, failed = false;
  const rnd = mulberry32(hash32(o.level.levelId));

  // ── labels (DOM over WebGL, on pills; sizes clamped UP to the floor; audited each placement)
  const labels = new Map<string, { spec: LabelSpec; el: HTMLSpanElement }>();
  const floorOf = (s: LabelSpec) => (s.kind === "numeral" ? 18 : o.young || s.lang === "hi" ? 16 : 14);
  const styleLabel = (el: HTMLSpanElement, s: LabelSpec) => {
    const px = Math.max(s.size, floorOf(s)), role = s.role ?? "ink";
    const ink = role === "ink" ? art.ink : role === "you" ? art.ink : (art as unknown as Record<string, string>)[role] ?? art.ink;
    el.lang = s.lang;
    el.style.cssText = `position:absolute;white-space:nowrap;font:600 ${px}px/1.2 ${s.lang === "hi" ? art.font.deva : art.font.ui};color:${ink};background:${art.panel};border:1px solid ${role === "you" ? art.you : art.panelEdge};border-radius:12px;padding:2px 10px`;
    el.dataset.px = String(px);
  };
  function placeLabels(): void {
    audit.texts = []; audit.clipped = 0;
    const rects: DOMRect[] = [];
    for (const { spec, el } of labels.values()) {
      if (spec.hidden) { el.style.display = "none"; continue; }
      const p = "box" in spec.at ? { x: spec.at.box.x, y: spec.at.box.y, visible: true } : core.project(spec.at as Vec3);
      if (!p.visible) { el.style.display = "none"; continue; }
      el.style.display = "";
      const w = el.offsetWidth, h = el.offsetHeight, align = spec.align ?? "center";
      const x = p.x + (spec.dx ?? 0) - w / 2, y = p.y + (spec.dy ?? 0) - (align === "center" ? h / 2 : align === "bottom" ? h : 0);
      el.style.left = `${Math.round(x)}px`; el.style.top = `${Math.round(y)}px`;
      const r = new DOMRect(x, y, w, h);
      // a label the camera has carried out of the box is hidden, not clipped (the child can turn the world to see it)
      if (r.right < 0 || r.bottom < 0 || r.left > box.w || r.top > box.h) { el.style.display = "none"; continue; }
      if (r.left < -1 || r.top < -1 || r.right > box.w + 1 || r.bottom > box.h + 1) audit.clipped++;
      if (rects.some((q) => q.left < r.right && r.left < q.right && q.top < r.bottom && r.top < q.bottom)) audit.clipped++;
      rects.push(r);
      audit.texts.push({ s: spec.text, px: Number(el.dataset.px), x: r.x, y: r.y, w: r.width, align: "center" });
    }
  }

  // ── the audio bus (procedural; Khand has no music: the bed stays off whatever the dress says)
  let ducked = false;
  const audio: AudioBus = {
    sfx(ev) { try { if (!ducked) sound.play(art, SFX[ev] ?? "tap", 0); } catch { /* silent */ } },
    hum() { /* no engine bed in Khand */ },
    music() { /* no music in Khand (O-G2: off by default for classes 4-5; Khand ships none) */ },
    duck(on) { ducked = on; },
    get muted() { return false; },
  };

  // ── the progress store (cause-traced writes; none after the level is done)
  const pmap = new Map<string, unknown>(), ptrace: { key: string; cause: string }[] = [];
  const progress: ProgressStore = {
    get: <T,>(k: string) => pmap.get(k) as T | undefined,
    set(key, value, cause) {
      if (o.ctl.solved && !("level" in cause)) throw new Error(`progress write after done: ${key}`);
      pmap.set(key, value);
      ptrace.push({ key, cause: "act" in cause ? `act:${cause.act}` : "moment" in cause ? `moment:${cause.moment}@${cause.seq}` : "level:start" });
    },
    trace: () => [...ptrace],
  };

  const core: Core3D = {
    get box() { return box; }, get dpr() { return dpr; }, tier, budget, reduced, young: o.young, get t() { return t; },
    get renderer() { return renderer; }, get scene() { return scene; },
    get camera() { return camera; }, set camera(c: unknown) { camera = c as Camera; },
    project(p) {
      if (!T || !camera) return { x: 0, y: 0, visible: false };
      const v = new T.Vector3(p.x, p.y, p.z).project(camera);
      return { x: (v.x + 1) / 2 * box.w, y: (1 - v.y) / 2 * box.h, visible: v.z >= -1 && v.z <= 1 && v.x >= -1.2 && v.x <= 1.2 && v.y >= -1.2 && v.y <= 1.2 };
    },
    unproject(x, y, planeZ) {
      if (!T || !camera) return null;
      const v = new T.Vector3((x / box.w) * 2 - 1, -(y / box.h) * 2 + 1, 0.5).unproject(camera);
      const origin = new T.Vector3().setFromMatrixPosition(camera.matrixWorld), d = v.sub(origin).normalize();
      if (Math.abs(d.z) < 1e-9) return null;
      const k = (planeZ - origin.z) / d.z;
      return k < 0 ? null : { x: origin.x + d.x * k, y: origin.y + d.y * k, z: planeZ };
    },
    worldPerPx(z) {
      const pc = camera as PerspectiveCamera | null;
      if (!T || !pc || !pc.isPerspectiveCamera) return 1 / Math.max(1, box.h);
      const dist = Math.abs(new T.Vector3().setFromMatrixPosition(pc.matrixWorld).z - z);
      return (2 * dist * Math.tan((pc.fov * Math.PI) / 360)) / Math.max(1, box.h);
    },
    label(spec): LabelHandle {
      const el = document.createElement("span"); el.className = "kh-label"; el.dataset.id = spec.id; el.textContent = spec.text;
      styleLabel(el, spec); layer.appendChild(el); labels.set(spec.id, { spec: { ...spec }, el }); dirty = true;
      return {
        set(patch) { const l = labels.get(spec.id); if (!l) return; l.spec = { ...l.spec, ...patch }; l.el.textContent = l.spec.text; styleLabel(l.el, l.spec); dirty = true; },
        remove() { const l = labels.get(spec.id); if (l) { l.el.remove(); labels.delete(spec.id); dirty = true; } },
      };
    },
    target(id, x, y, w, h) { audit.targets.push({ id, x, y, w, h }); },
    audio,
    hitstop(ms) { if (!reduced) hitstop = Math.min(0.08, Math.max(hitstop, ms / 1000)); },
    shake() { /* Khand has no shake: building is calm */ },
    cosmeticRandom: () => rnd(),
    progress,
    invalidate() { dirty = true; },
    fail(why) { if (!failed) { failed = true; o.onFail?.(why); } },
  };

  // ── the dress: base rotation by level seed, no model delta in this adapter (G1's Director wires the delta)
  const themes = ENGINE_THEMES[entry.id];
  const spec = dressFor({ engine: entry.id, base: { theme: themes[o.level.seed % themes.length], wrapper: "beacon-rescue", music: "off", pace: "steady", teacherMove: "notice", lang: o.lang }, delta: null, classLevel: o.classLevel ?? (o.young ? 5 : 6), secure: false, childMusicOn: false, lessonLang: o.lang, verb: "scan" });

  // ── the engine (its chunk loads on demand; the proxy view answers at once)
  let eng: EngineView | null = null;
  const view: FamilyView = {
    layout() {}, update() {}, draw() {}, pointer() {},
    goal: () => eng?.goal() ?? "",
    readouts: (): Readout[] => eng?.readouts() ?? [],
    controls: (): ControlSpec[] => (eng?.controls() ?? []) as ControlSpec[],
    react: (ms: Moment[], refused: string | undefined) => { eng?.react(ms, refused); dirty = true; },
    demo: () => eng?.demo?.(),
    voice: (_a: PlayActBody) => false,
  };
  Promise.all([import("./three-core.ts"), entry.load()]).then(([three, m]) => {
    if (disposed) return;
    T = three;
    try { renderer = new three.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" }); }
    catch { core.fail("webgl"); return; }
    scene = new three.Scene(); camera = new three.PerspectiveCamera(48, 1, 0.1, 400);
    resize();
    try { eng = m.create(core, { level: o.level, ctl: o.ctl, lang: o.lang, spec, changed: o.changed }); eng.layout(box); dirty = true; o.changed(); }
    catch (e) { console.warn("[khand] create failed", String((e as Error)?.message ?? e).slice(0, 160)); core.fail("engine_create"); }
  }).catch(() => core.fail("engine_load"));

  // ── input: one active pointer to the engine
  let active: number | null = null;
  const pos = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] as const; };
  canvas.addEventListener("pointerdown", (e) => { if (active !== null) return; active = e.pointerId; try { canvas.setPointerCapture(e.pointerId); } catch { /* synthetic */ } sound.unlock(); o.ctl.finger(true); eng?.pointer("down", ...pos(e)); dirty = true; e.preventDefault(); });
  canvas.addEventListener("pointermove", (e) => { if (active !== null && e.pointerId !== active) return; eng?.pointer("move", ...pos(e)); });
  const end = (kind: "up" | "cancel") => (e: PointerEvent) => { if (e.pointerId !== active) return; active = null; o.ctl.finger(false); eng?.pointer(kind, ...pos(e)); dirty = true; };
  canvas.addEventListener("pointerup", end("up")); canvas.addEventListener("pointercancel", end("cancel"));
  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); noteContextLoss(); core.fail("context_lost"); });
  const onKey = (e: KeyboardEvent) => { if (eng?.key && host.contains(document.activeElement ?? null)) eng.key(e.key); };
  window.addEventListener("keydown", onKey);

  // ── the loop and the governor (a ratchet: DPR only steps down, 0.25 at a time, to the tier's floor)
  function resize(): void {
    const r = host.getBoundingClientRect();
    box = { w: Math.max(1, Math.round(r.width)), h: Math.max(1, Math.round(r.height)) };
    audit.box = { ...box };
    renderer?.setPixelRatio(dpr); renderer?.setSize(box.w, box.h, false);
    eng?.layout(box); dirty = true;
  }
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => resize()) : null;
  ro?.observe(host);
  let raf = 0, last = performance.now(), drawn = 0, errs: number[] = [], firstMarked = false;
  const frames: number[] = [], work: number[] = [];
  let windowFrames: number[] = [], windowStart = 0, particlesHalved = false;
  function frame(now: number): void {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    if (document.hidden) { last = now; return; }
    const raw = now - last; last = now;
    frames.push(raw); if (frames.length > 20000) frames.splice(0, 10000);
    let dt = Math.min(raw / 1000, 1 / 20);
    if (hitstop > 0) { hitstop -= dt; dt = 0; }
    t += dt;
    if (!eng || failed || !renderer || !scene || !camera) return;
    const t0 = performance.now();
    try {
      eng.update(dt);
      if (!dirty && !eng.busy()) return;
      dirty = false;
      renderer.render(scene, camera);
      placeLabels();
      drawn++; audit.frame++;
      if (!firstMarked && performance.mark) { performance.mark("khand-first-frame"); firstMarked = true; }
    } catch (e) {
      const nowE = performance.now(); errs = errs.filter((x) => nowE - x < 1000); errs.push(nowE);
      console.warn("[khand] frame error", String((e as Error)?.message ?? e).slice(0, 160));
      if (errs.length >= 3) core.fail("frame_errors");
      return;
    }
    work.push(performance.now() - t0); if (work.length > 20000) work.splice(0, 10000);
    windowFrames.push(raw);
    if (!windowStart) windowStart = now;
    if (now - windowStart > 2000 && o.dpr == null) {
      const s = [...windowFrames].sort((a, b) => a - b), p95 = s[Math.floor(0.95 * (s.length - 1))] ?? 0;
      if (p95 > 24) {
        if (dpr - 0.25 >= budget.dprFloor - 1e-6) { dpr = +(dpr - 0.25).toFixed(2); dprSteps.push(dpr); resize(); }
        else if (!particlesHalved) { budget.particles *= 0.5; particlesHalved = true; }
      }
      windowFrames = []; windowStart = now;
    }
  }
  resize();
  raf = requestAnimationFrame(frame);

  const q = (a: number[], f: number) => { const s = [...a].sort((x, y) => x - y); return s.length ? +s[Math.min(s.length - 1, Math.floor(f * s.length))].toFixed(2) : 0; };
  const perf = (reset = false): Perf3D => {
    const f = frames.slice(10), total = f.reduce((a, b) => a + b, 0), info = renderer?.info ?? { render: { calls: 0, triangles: 0 }, memory: { textures: 0, geometries: 0 } };
    const out: Perf3D = {
      n: f.length, drawn, fps: total ? +((1000 * f.length) / total).toFixed(1) : 0, p50: q(f, 0.5), p95: q(f, 0.95),
      over20: f.length ? +((100 * f.filter((x) => x > 20).length) / f.length).toFixed(1) : 0, over33: f.length ? +((100 * f.filter((x) => x > 33.4).length) / f.length).toFixed(1) : 0,
      dpr, dprSteps: [...dprSteps], drawP50: q(work, 0.5), drawP95: q(work, 0.95), workP50: q(work, 0.5), workP95: q(work, 0.95),
      draws: info.render.calls, tris: info.render.triangles, textures: info.memory.textures, geometries: info.memory.geometries, tier, particles: budget.particles,
    };
    if (reset) { frames.length = 0; work.length = 0; drawn = 0; }
    return out;
  };
  const stage: StageHandle & { core3d: Core3D; engine: () => EngineView | null; tierWhy: string } = {
    canvas, audit, perf, core3d: core, engine: () => eng, tierWhy: tierPick.why,
    setArt() { /* the art direction is fixed per level in 3D (the theme comes from the dress) */ },
    resize, invalidate() { dirty = true; },
    dispose() {
      if (disposed) return; disposed = true; cancelAnimationFrame(raf); ro?.disconnect(); window.removeEventListener("keydown", onKey);
      try { eng?.dispose(); } catch { /* gone */ }
      for (const { el } of labels.values()) el.remove();
      renderer?.dispose(); canvas.remove(); layer.remove();
    },
  };
  return { view, stage, tier };
}

function stubView(): FamilyView { return { layout() {}, update() {}, draw() {}, pointer() {}, goal: () => "", readouts: () => [], controls: () => [], react() {} }; }
function stubStage(audit: Audit): StageHandle {
  return { canvas: document.createElement("canvas"), audit, perf: () => ({ n: 0, drawn: 0, fps: 0, p50: 0, p95: 0, over20: 0, over33: 0, dpr: 1, dprSteps: [], drawP50: 0, drawP95: 0 }), setArt() {}, resize() {}, invalidate() {}, dispose() {} };
}
