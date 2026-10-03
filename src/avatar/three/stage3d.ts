// The 3D stage controller (phase 1: main thread; AVATAR.md §2.1). Framework-free: TutorFace mounts it in an
// effect and pushes inputs; the rAF loop never touches React state.
//
// One tick: tap → LipDriver → floorState → Behaviour → Compositor → rig.apply → render. Everything runs on the same
// clock (performance.now()/1000). Frame cap per TH-1: skip a tick unless ≥ frameDur − 3 ms elapsed; the schedule
// advances by exactly frameDur and re-anchors after gaps > 2 frames (the stock cap delivered ≈ 23 fps with judder).
// This chunk is the ONLY place three.js is imported; it is loaded lazily, so the cold path does not grow.
import { AmbientLight, Color, DirectionalLight, HemisphereLight, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import type { TutorCharacter } from "../../../shared/tutors.js";
import { Behaviour, floorState, type BandKey, type Emotion, type FloorStatus } from "../behaviour.ts";
import { Compositor } from "../compositor.ts";
import { LipDriver, LipRing, lipKeys } from "../lip.ts";
import { TeacherTap, windowFromLevel, type TapSource } from "../tap.ts";
import { Governor, longFrameMs, percentile, probeVerdict, type FaceTier, type TierDecision } from "../tier.ts";
import { buildHead, type HeadRig } from "./head.ts";

export type StageEvent =
  | { type: "ready"; tier: FaceTier; loadMs: number; firstRenderMs: number; triangles: number; meshes: number; drawCalls: number }
  | { type: "state"; state: string; source: "tap" | "status" }
  | { type: "tier"; from: FaceTier; to: FaceTier; reason: string }
  | { type: "pixels"; pixelRatio: number }
  | { type: "stats"; fpsP50: number; intervalP95: number; long50: number; workP95: number; frames: number }
  | { type: "contextlost" }
  | { type: "error"; message: string; fatal: boolean };

export interface StageInputs {
  status: FloorStatus | null;
  reducedMotion: boolean;
  gentle: boolean;
  /** Child mic level 0..1. */
  childLevel: number;
}

export interface Stage3DOptions {
  tutor: TutorCharacter;
  band: BandKey;
  decision: TierDecision;
  sources: TapSource[];
  framing: "medium" | "close";
  /** Per-route face delay (ms); M0 default 0 (speaker/wired). */
  faceDelayMs?: number;
  seed?: number;
  /** Skip the 2 s probe (tests that force a tier). */
  noProbe?: boolean;
  onEvent?: (e: StageEvent) => void;
}

export class Stage3D {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera: PerspectiveCamera;
  private rig: HeadRig;
  private tap: TeacherTap;
  private lip: LipDriver | null = null;
  private ring = new LipRing();
  private behaviour: Behaviour;
  private compositor = new Compositor();
  private governor: Governor;
  private decision: TierDecision;
  private inputs: StageInputs = { status: null, reducedMotion: false, gentle: false, childLevel: 0 };
  private raf = 0;
  private nextAt = 0;
  private lastFrame = -1;
  private lastT = -1;
  private intervals: number[] = [];
  private work: number[] = [];
  private frames = 0;
  private probe: { intervals: number[]; work: number[] } | null = { intervals: [], work: [] };
  private lastStatsAt = 0;
  private lastGovAt = 0;
  private statusSince = 0;
  private spokeSinceStatus = false;
  private lastStatus: FloorStatus | null = null;
  private faceState = "idle";
  private ro: ResizeObserver | null = null;
  private disposed = false;
  private readonly t0 = performance.now();
  private readonly opts: Stage3DOptions;
  private readonly container: HTMLElement;
  private fallbackBuf = new Float32Array(2048);
  private onVis = () => (document.hidden ? this.stop() : this.start());
  /** Only a LIVE stage reports a loss: a context the browser evicts after dispose() must never count against the
   *  session (two counted losses send every later face to tier D). */
  private onLost = (e: Event) => {
    e.preventDefault();
    this.stop();
    if (!this.disposed) this.opts.onEvent?.({ type: "contextlost" });
  };

  constructor(container: HTMLElement, opts: Stage3DOptions) {
    this.opts = opts;
    this.container = container;
    this.decision = opts.decision;
    this.governor = new Governor(opts.decision);
    if (opts.noProbe) this.probe = null;
    // MSAA off at B-lite: the cost it saves is exactly the low-end Mali/PowerVR fill rate B-lite exists for. (A
    // later runtime demotion to B-lite keeps the context it has: antialias is fixed at context creation.)
    this.renderer = new WebGLRenderer({ antialias: opts.decision.tier !== "Blite", alpha: true, depth: true, stencil: false, powerPreference: "low-power", preserveDrawingBuffer: false });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.domElement.style.cssText = "display:block;width:100%;height:100%";
    this.renderer.domElement.addEventListener("webglcontextlost", this.onLost);
    container.appendChild(this.renderer.domElement);

    this.camera = new PerspectiveCamera(opts.framing === "close" ? 21 : 25, 1, 0.1, 50);
    this.frame(opts.framing);
    this.scene.add(new HemisphereLight(new Color("#FFF4E6"), new Color("#5E4B42"), 1.35));
    this.scene.add(new AmbientLight(new Color("#FFFFFF"), 0.35));
    const key = new DirectionalLight(new Color("#FFFFFF"), 1.9);
    key.position.set(2.5, 3, 6);
    this.scene.add(key);
    const fill = new DirectionalLight(new Color("#FFE9D6"), 0.45);
    fill.position.set(-4, 0.5, 3);
    this.scene.add(fill);

    this.rig = buildHead(opts.tutor.look, 0.3 * opts.tutor.faceStyle.smile);
    if (import.meta.env?.DEV) (window as unknown as { __stage3d?: Stage3D }).__stage3d = this;
    this.scene.add(this.rig.root);
    this.behaviour = new Behaviour({ band: opts.band, seed: opts.seed ?? 1, faceStyle: opts.tutor.faceStyle });
    this.tap = new TeacherTap(opts.sources);

    this.resize();
    if (typeof ResizeObserver === "function") {
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(container);
    }
    document.addEventListener("visibilitychange", this.onVis);

    // First render: compile + one render (morph packing happens on the first render, P-2.2), timed apart.
    const tCompile = performance.now();
    this.renderer.compile(this.scene, this.camera);
    const compiled = performance.now();
    this.tick(performance.now(), true);
    const rendered = performance.now();
    const s = this.rig.stats();
    opts.onEvent?.({ type: "ready", tier: this.decision.tier, loadMs: Math.round(compiled - this.t0), firstRenderMs: Math.round(rendered - tCompile),
      triangles: s.triangles, meshes: s.meshes, drawCalls: this.renderer.info.render.calls });
  }

  private frame(framing: "medium" | "close"): void {
    if (framing === "close") {
      this.camera.position.set(0, 0, 7.4);
      this.camera.lookAt(0, -0.1, 0);
    } else {
      this.camera.position.set(0, -0.45, 10.2);
      this.camera.lookAt(0, -0.6, 0);
    }
  }

  private resize(): void {
    const w = Math.max(1, this.container.clientWidth), h = Math.max(1, this.container.clientHeight);
    // Canvas budget ≤ 0.22 Mpx (§6.2): lower the pixel ratio before anything else.
    let pr = this.decision.tier === "Blite" ? Math.min(1, this.governor.pixelRatio) : this.governor.pixelRatio;
    while (pr > 0.5 && w * h * pr * pr > 220_000) pr -= 0.05;
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Portrait tiles are narrow: widen the vertical field so the shoulders stay in frame.
    const base = this.opts.framing === "close" ? 21 : 25;
    this.camera.fov = w / h < 0.8 ? base * Math.min(1.5, 0.8 / (w / h)) : base;
    this.camera.updateProjectionMatrix();
  }

  set(inputs: Partial<StageInputs>): void {
    if (inputs.status !== undefined && inputs.status !== this.lastStatus) {
      this.lastStatus = inputs.status;
      this.statusSince = performance.now() / 1000;
      this.spokeSinceStatus = false;
    }
    Object.assign(this.inputs, inputs);
    this.behaviour.setMotion({ reduced: this.inputs.reducedMotion, gentle: this.inputs.gentle });
  }

  /** Director affect / delight, armed for her next audible onset. */
  arm(emotion: Emotion, intensity: 1 | 2 = 1): void {
    this.behaviour.arm(emotion, intensity);
  }

  start(): void {
    if (this.raf || this.disposed) return;
    this.nextAt = 0;
    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop);
      this.tick(now, false);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private capFps(): number {
    const st = this.faceState;
    const f = this.decision.fps;
    return st === "speaking" ? f.speaking : st === "listening" || st === "your_turn" ? f.listening : f.idle;
  }

  private tick(now: number, force: boolean): void {
    const frameDur = 1000 / this.capFps();
    if (!force) {
      if (this.nextAt === 0) this.nextAt = now;
      if (now < this.nextAt - 3) return;
      this.nextAt += frameDur;
      if (now - this.nextAt > 2 * frameDur) this.nextAt = now + frameDur; // re-anchor after a gap
    }
    const w0 = performance.now();
    const t = now / 1000;
    const dt = this.lastT < 0 ? 1 / 30 : Math.min(0.25, t - this.lastT);
    this.lastT = t;

    // Lips: the real tap when attached, else the meter level (amplitude fallback).
    const read = this.tap.read();
    if (read.fresh) {
      this.ring.flush();
      this.lip?.reset();
    }
    if (!this.lip || this.lip.sampleRate !== read.sampleRate) this.lip = new LipDriver(read.sampleRate);
    const buf = read.buf ?? windowFromLevel(read.level, this.fallbackBuf);
    const lf = this.lip.step(buf, t);
    this.ring.push(lf);
    const lipNow = this.ring.read(t, this.opts.faceDelayMs ?? 0) ?? lf;
    if (lf.speaking) this.spokeSinceStatus = this.spokeSinceStatus || t - this.statusSince > 0.3;

    const st = floorState({ status: this.inputs.status, tapSpeaking: lf.speaking, silenceMs: lf.silenceMs, spokeSinceStatus: this.spokeSinceStatus });
    if (st !== this.faceState) {
      this.opts.onEvent?.({ type: "state", state: st, source: lf.speaking && this.inputs.status !== "speaking" ? "tap" : "status" });
      this.faceState = st;
    }
    this.behaviour.setState(st);
    const b = this.behaviour.update(t, { herRms: lf.rms, herVoiced: lf.voiced, childLevel: this.inputs.childLevel });
    const bs = this.compositor.compose(b.bs, lipKeys(lipNow), dt);
    const breath = this.inputs.reducedMotion ? 0 : Math.sin(t * 2 * Math.PI * 0.25);
    this.rig.apply(bs, b.head, b.gaze, b.lean, breath);
    this.renderer.render(this.scene, this.camera);
    const work = performance.now() - w0;

    // Telemetry, probe and governor.
    if (this.lastFrame >= 0 && !force) {
      const iv = now - this.lastFrame;
      this.intervals.push(iv);
      this.work.push(work);
      if (this.intervals.length > 600) this.intervals.shift();
      if (this.work.length > 600) this.work.shift();
      this.governor.frame(t, iv);
      this.frames++;
      if (this.probe) {
        this.probe.intervals.push(iv);
        this.probe.work.push(work);
        if (this.probe.intervals.length >= 60) {
          const verdict = probeVerdict(this.decision, { workP90: percentile(this.probe.work, 0.9), intervalP90: percentile(this.probe.intervals, 0.9) });
          this.probe = null;
          if (verdict.tier !== this.decision.tier) this.changeTier(verdict.tier, verdict.why.at(-1) ?? "probe");
        }
      }
    }
    if (!force) this.lastFrame = now;
    if (t - this.lastGovAt >= 1 && !this.probe) {
      this.lastGovAt = t;
      const a = this.governor.tick(t, this.capFps(), lf.speaking ? 0 : lf.silenceMs);
      if (a.kind === "pixels") {
        this.resize();
        this.opts.onEvent?.({ type: "pixels", pixelRatio: a.pixelRatio });
      } else if (a.kind === "tier") this.changeTier(a.to, a.reason);
    }
    if (t - this.lastStatsAt >= 5 && this.intervals.length > 10) {
      this.lastStatsAt = t;
      this.opts.onEvent?.({ type: "stats", ...this.stats() });
    }
  }

  private changeTier(to: FaceTier, reason: string): void {
    const from = this.decision.tier;
    if (to === from) return;
    this.decision = { ...this.decision, tier: to, fps: to === "Blite" ? { speaking: 20, listening: 20, idle: 15 } : this.decision.fps };
    if (to === "Blite") this.resize();
    this.opts.onEvent?.({ type: "tier", from, to, reason });
  }

  stats(): { fpsP50: number; intervalP95: number; long50: number; workP95: number; frames: number } {
    const p50 = percentile(this.intervals, 0.5);
    return {
      fpsP50: p50 > 0 ? +(1000 / p50).toFixed(1) : 0,
      intervalP95: +percentile(this.intervals, 0.95).toFixed(1),
      long50: this.intervals.filter((x) => x > longFrameMs(this.capFps())).length,
      workP95: +percentile(this.work, 0.95).toFixed(2),
      frames: this.frames,
    };
  }

  get state(): string {
    return this.faceState;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    document.removeEventListener("visibilitychange", this.onVis);
    this.renderer.domElement.removeEventListener("webglcontextlost", this.onLost);
    this.ro?.disconnect();
    this.tap.dispose();
    this.rig.dispose();
    // three r180's WebGLRenderer.dispose() frees GPU resources but NOT the context; without forceContextLoss() a
    // picker that rebuilds the stage per selection piles contexts up to the browser cap, which then evicts them.
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
