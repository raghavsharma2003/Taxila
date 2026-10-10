// core3d stage (CORE-API §1-§10): one WebGL canvas at the world box's REAL size, the frame loop, the frame-time governor,
// DOM labels over WebGL, the audit, context loss → the board twin, input in CSS px, the audio bus and the progress store.
// It returns the same StageHandle the 2D stage returns, so PlayStage treats both alike.
//
// What the stage guarantees whatever an engine does:
//   - a throwing frame is skipped; 3 errors inside 1 s stop the engine and call onFail (the host shows the board twin with
//     the SAME controller: the level, its state and the child's acts survive);
//   - webglcontextlost → onFail("context_lost") at once (never a black canvas);
//   - every ~2 s, a frame-interval p95 over 24 ms steps DPR down 0.25 to the tier's floor, then halves particles once; it
//     never steps up within a session;
//   - every label the child sees is in `audit` with its real size and rect (C4 is measured, not assumed).
import * as THREE from "three";
import type { ArtId } from "../../../../shared/play.ts";
import { newAudit, type Audit } from "../../core/styles.ts";
import type { StageHandle, PointerKind } from "../../core/stage.ts";
import { TIER_BUDGET, type Core3D, type EngineDeps, type EngineView, type Perf3D, type PlayTier, type Vec3 } from "./api.ts";
import { Bus } from "./audio.ts";
import { LabelLayer } from "./labels.ts";
import { Progress } from "./progress.ts";
import { noteContextLoss } from "./tier.ts";
import "./core3d.css";

export interface Stage3DOpts {
  tier: Exclude<PlayTier, "2d">;
  young: boolean;
  reducedMotion?: boolean;
  /** lock the DPR (harness); the governor is then off */
  dpr?: number;
  sound?: boolean;
  musicAllowed?: boolean;
  onFail?(why: string): void;
  /** keep the drawing buffer so a harness can read pixels (certification only) */
  preserveDrawing?: boolean;
  /** a seed for cosmetics (stars, rocks): the level seed, so a screenshot is reproducible */
  seed?: number;
}
export interface Stage3DHandle extends StageHandle {
  perf(reset?: boolean): Perf3D;
  readonly core: Core3D;
  readonly engine: EngineView;
  readonly bus: Bus;
  /** the harness: lose the context on purpose (WEBGL_lose_context) */
  loseContext(): boolean;
  speaking(on: boolean): void;
}

type Create = (core: Core3D, deps: EngineDeps) => EngineView;

/** → the handle, or null when WebGL cannot start here (the host mounts the 2D view instead). */
export function mountStage3D(host: HTMLElement, create: Create, deps: EngineDeps, opts: Stage3DOpts): Stage3DHandle | null {
  const canvas = document.createElement("canvas");
  canvas.className = "c3-canvas";
  canvas.setAttribute("role", "application");
  canvas.setAttribute("aria-label", "game world");
  host.appendChild(canvas);
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance", preserveDrawingBuffer: !!opts.preserveDrawing });
  } catch {
    canvas.remove();
    return null;
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const budget = { ...TIER_BUDGET[opts.tier] };
  const reduced = opts.reducedMotion ?? (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const fixedDpr = opts.dpr ?? null;
  let dpr = fixedDpr ?? Math.min(window.devicePixelRatio || 1, budget.dprCap);
  renderer.setPixelRatio(dpr);
  const scene = new THREE.Scene();
  let camera: THREE.Camera = new THREE.PerspectiveCamera(58, 1, 0.1, 420);
  const labels = new LabelLayer(host, opts.young);
  const bus = new Bus({ muted: opts.sound === false, musicAllowed: !!opts.musicAllowed });
  const progress = new Progress();
  const audit: Audit = newAudit("raat" as ArtId, opts.young);
  let w = 1, h = 1, t = 0, hitstop = 0, shakePx = 0, disposed = false, failed = false, invalid = true;
  let targets: { id: string; x: number; y: number; w: number; h: number }[] = [];
  let cs = ((opts.seed ?? 1) >>> 0) || 1;
  const tmp = new THREE.Vector3();

  const core: Core3D = {
    get box() { return { w, h }; }, get dpr() { return dpr; }, tier: opts.tier, budget, reduced, young: opts.young,
    get t() { return t; },
    renderer, scene,
    get camera() { return camera; }, set camera(c: unknown) { camera = c as THREE.Camera; },
    project(p: Vec3) {
      tmp.set(p.x, p.y, p.z).project(camera);
      return { x: ((tmp.x + 1) / 2) * w, y: ((1 - tmp.y) / 2) * h, visible: tmp.z > -1 && tmp.z < 1 };
    },
    unproject(x: number, y: number, planeZ: number) {
      const ndc = new THREE.Vector3((x / w) * 2 - 1, 1 - (y / h) * 2, 0.5).unproject(camera);
      const cp = (camera as THREE.PerspectiveCamera).position, dir = ndc.sub(cp).normalize();
      if (Math.abs(dir.z) < 1e-6) return null;
      const k = (planeZ - cp.z) / dir.z;
      return k > 0 ? { x: cp.x + dir.x * k, y: cp.y + dir.y * k, z: planeZ } : null;
    },
    worldPerPx(z: number) {
      const cam = camera as THREE.PerspectiveCamera, d = Math.abs(cam.position.z - z);
      return (2 * d * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2))) / Math.max(1, h);
    },
    label: (spec) => labels.add(spec),
    labelColors: (c) => labels.colors(c),
    target(id, x, y, tw, th) { targets.push({ id, x, y, w: tw, h: th }); },
    audio: bus,
    hitstop(ms) { if (!reduced) hitstop = Math.max(hitstop, Math.min(80, ms) / 1000); },
    shake(px) { if (!reduced) shakePx = Math.max(shakePx, Math.min(6, px)); },
    cosmeticRandom() { cs = (cs + 0x6d2b79f5) >>> 0; let x = cs; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; },
    progress,
    invalidate() { invalid = true; },
    fail(why) { failOnce(why); },
  };

  function failOnce(why: string): void {
    if (failed) return; failed = true;
    try { opts.onFail?.(why); } catch { /* host gone */ }
  }

  let engine: EngineView;
  try { engine = create(core, deps); } catch (e) {
    console.warn("[play3d] engine create failed", String((e as Error)?.message ?? e).slice(0, 160));
    labels.dispose(); renderer.dispose(); canvas.remove(); bus.dispose();
    return null;
  }

  function resize(): void {
    const r = host.getBoundingClientRect();
    w = Math.max(1, Math.round(r.width)); h = Math.max(1, Math.round(r.height));
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
    const cam = camera as THREE.PerspectiveCamera; if (cam.isPerspectiveCamera) { cam.aspect = w / h; cam.updateProjectionMatrix(); }
    audit.box = { w, h };
    try { engine.layout({ w, h }); } catch (e) { onError(e); }
    invalid = true;
  }
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => resize()) : null;
  ro?.observe(host);

  // ── input: one active pointer (the child's finger), CSS px in the box
  let active: number | null = null;
  const pos = (e: PointerEvent): [number, number] => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const fire = (k: PointerKind, e: PointerEvent) => { try { const [x, y] = pos(e); engine.pointer(k, x, y); } catch (er) { onError(er); } invalid = true; };
  const down = (e: PointerEvent) => { if (active !== null) return; active = e.pointerId; try { canvas.setPointerCapture(e.pointerId); } catch { /* synthetic */ } bus.unlock(); fire("down", e); e.preventDefault(); };
  const move = (e: PointerEvent) => { if (active === null || e.pointerId !== active) return; fire("move", e); };
  const up = (e: PointerEvent) => { if (e.pointerId !== active) return; fire("up", e); active = null; };
  const cancel = (e: PointerEvent) => { if (e.pointerId !== active) return; fire("cancel", e); active = null; };
  canvas.addEventListener("pointerdown", down); canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", cancel);
  // keys: arrows steer / nudge, space / enter commit (the same acts the controls make)
  canvas.tabIndex = 0;
  const onKey = (e: KeyboardEvent) => { if (!engine.key) return; if (["ArrowLeft", "ArrowRight", " ", "Enter"].includes(e.key)) { e.preventDefault(); bus.unlock(); try { engine.key(e.key); } catch (er) { onError(er); } invalid = true; } };
  canvas.addEventListener("keydown", onKey);
  const onLost = (e: Event) => { e.preventDefault(); noteContextLoss(); failOnce("context_lost"); };
  canvas.addEventListener("webglcontextlost", onLost);

  // ── loop + governor
  let raf = 0, last = performance.now(), errs: number[] = [], govT = 0, particlesCut = false;
  const frames: number[] = [], work: number[] = [], dprSteps: number[] = [];
  let drawn = 0;
  function onError(e: unknown): void {
    const now = performance.now(); errs = errs.filter((x) => now - x < 1000); errs.push(now);
    console.warn("[play3d] frame error", String((e as Error)?.message ?? e).slice(0, 160));
    if (errs.length >= 3) failOnce("frame_errors");
  }
  function frame(now: number): void {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    if (document.hidden) { last = now; return; }
    const raw = now - last; last = now;
    if (failed) return;
    const w0 = performance.now();
    let dt = Math.min(raw / 1000, 0.1);
    if (hitstop > 0) { hitstop -= dt; dt *= 0.05; }
    t += dt;
    let busy = invalid;
    try { engine.update(dt); busy = busy || engine.busy() || active !== null || shakePx > 0; } catch (e) { onError(e); }
    if (!busy) return;
    invalid = false;
    try {
      targets = [];
      const cam = camera as THREE.PerspectiveCamera;
      let ox = 0, oy = 0;
      if (shakePx > 0) {
        const k = shakePx * core.worldPerPx(cam.position.z - 8);
        ox = (core.cosmeticRandom() - 0.5) * 2 * k; oy = (core.cosmeticRandom() - 0.5) * 2 * k;
        cam.position.x += ox; cam.position.y += oy;
        shakePx = Math.max(0, shakePx - dt * 30);
      }
      renderer.render(scene, camera);
      if (ox || oy) { cam.position.x -= ox; cam.position.y -= oy; }
      const placed = labels.place(core.project, { w, h });
      audit.texts = placed.texts; audit.clipped = placed.clipped; audit.targets = targets; audit.frame++;
      drawn++;
    } catch (e) { onError(e); }
    frames.push(raw); work.push(performance.now() - w0);
    if (frames.length > 20000) { frames.splice(0, 10000); work.splice(0, 10000); }
    govT += raw / 1000;
    if (fixedDpr == null && govT > 2) {
      govT = 0;
      const recent = frames.slice(-120).sort((a, b) => a - b);
      if (recent.length > 60 && recent[Math.floor(recent.length * 0.95)] > 24) {
        if (dpr > budget.dprFloor + 0.01) { dpr = Math.max(budget.dprFloor, +(dpr - 0.25).toFixed(2)); dprSteps.push(dpr); resize(); }
        else if (!particlesCut) { particlesCut = true; budget.particles = +(budget.particles / 2).toFixed(2); }
      }
    }
  }
  resize();
  try { renderer.compile(scene, camera); } catch { /* compiled lazily */ }
  raf = requestAnimationFrame(frame);
  const onVis = () => { last = performance.now(); invalid = true; };
  document.addEventListener("visibilitychange", onVis);

  const q = (a: number[], p: number) => { const s = [...a].sort((x, y) => x - y); return s.length ? +s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(2) : 0; };
  const handle: Stage3DHandle = {
    canvas, audit, core, engine, bus,
    perf(reset = false) {
      const f = frames.slice(10), total = f.reduce((a, b) => a + b, 0), info = renderer.info;
      const out: Perf3D = {
        n: f.length, drawn, fps: total ? +((1000 * f.length) / total).toFixed(1) : 0, p50: q(f, 0.5), p95: q(f, 0.95),
        over20: f.length ? +((100 * f.filter((x) => x > 20).length) / f.length).toFixed(1) : 0, over33: f.length ? +((100 * f.filter((x) => x > 33.4).length) / f.length).toFixed(1) : 0,
        dpr, dprSteps: [...dprSteps], drawP50: q(work, 0.5), drawP95: q(work, 0.95), workP50: q(work.slice(10), 0.5), workP95: q(work.slice(10), 0.95),
        draws: info.render.calls, tris: info.render.triangles, textures: info.memory.textures, geometries: info.memory.geometries, tier: opts.tier, particles: budget.particles,
      };
      if (reset) { frames.length = 0; work.length = 0; drawn = 0; }
      return out;
    },
    setArt() { invalid = true; },
    resize, invalidate() { invalid = true; },
    loseContext() { const ext = renderer.getContext().getExtension("WEBGL_lose_context"); if (!ext) return false; ext.loseContext(); return true; },
    speaking(on) { bus.duck(on); try { engine.speaking?.(on); } catch { /* cosmetic */ } invalid = true; },
    dispose() {
      if (disposed) return; disposed = true; cancelAnimationFrame(raf); ro?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("webglcontextlost", onLost); canvas.removeEventListener("keydown", onKey);
      try { engine.dispose(); } catch { /* gone */ }
      labels.dispose(); bus.dispose();
      scene.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose?.(); const mat = m.material as THREE.Material | THREE.Material[] | undefined; if (Array.isArray(mat)) mat.forEach((x) => x.dispose()); else mat?.dispose?.(); });
      renderer.dispose();
      canvas.remove();
    },
  };
  return handle;
}
