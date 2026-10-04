// The 3D stage controller (phase 1: main thread; AVATAR.md §2.1). Framework-free: TutorFace mounts it in an
// effect and pushes inputs; the rAF loop never touches React state.
//
// One tick: tap → LipDriver → floorState → Behaviour → Compositor → rig.apply → render. Everything runs on the same
// clock (performance.now()/1000). Frame cap per TH-1: skip a tick unless ≥ frameDur − 3 ms elapsed; the schedule
// advances by exactly frameDur and re-anchors after gaps > 2 frames (the stock cap delivered ≈ 23 fps with judder).
// This chunk is the ONLY place three.js is imported; it is loaded lazily, so the cold path does not grow.
//
// Two heads behind one HeadRig contract:
//  - face.rig off: the procedural M0 head (./head.ts), built synchronously, alpha canvas over the page.
//  - face.rig on (`look`): the look's GLB (./rig.ts) on a hand-made OPAQUE WebGL2 context (three r180 always asks
//    for an alpha context, and alpha-to-coverage then composites every brow, lash and hair-card edge against the
//    page; CHARACTER-PIPELINE §4.4.1), Neutral tone mapping and the look's own light rig. The canvas starts hidden
//    over the look's own plate (tier D, PlatePerson); the GLB loads after mount, off the cold path, with an 8 s
//    timeout; it cross-fades in (200 ms) only in her silence ≥ 300 ms. The camera reproduces the plate's framing and
//    cover crop, so the cross-fade (and any later fall back to D) is the same picture of the same person.
import { AmbientLight, Color, DirectionalLight, HemisphereLight, NeutralToneMapping, PerspectiveCamera, SRGBColorSpace, Scene, WebGLRenderer } from "three";
import type { TutorCharacter } from "../../../shared/tutors.js";
import { Behaviour, floorState, type BandKey, type Emotion, type FloorStatus } from "../behaviour.ts";
import { Compositor } from "../compositor.ts";
import { LipDriver, LipRing, lipKeys } from "../lip.ts";
import { TeacherTap, windowFromLevel, type TapSource } from "../tap.ts";
import { Governor, longFrameMs, percentile, probeVerdict, type FaceTier, type TierDecision } from "../tier.ts";
import { coverBox, rigTierFor, type LookEntry, type RuntimeJson } from "./contract.ts";
import { buildHead, type HeadRig } from "./head.ts";
import { loadTeacher, type GlbRig } from "./rig.ts";
import { fetchRuntime } from "../looks.ts";

/** GLB + runtime.json must arrive within this, else the lesson stays on the look's plate (retry next lesson). */
export const RIG_TIMEOUT_MS = 8000;
/** Her local silence before the plate → 3D cross-fade (the same rule as tier changes). */
export const REVEAL_SILENCE_MS = 300;

export type StageEvent =
  | { type: "ready"; tier: FaceTier; loadMs: number; firstRenderMs: number; triangles: number; meshes: number; drawCalls: number; rig?: { look: string; lookRev: number; file: string; bytes: number } }
  | { type: "reveal"; afterMs: number }
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
  /** face.rig: load this look's GLB instead of building the procedural head (call init()). */
  look?: { entry: LookEntry & { id: string }; runtime?: RuntimeJson };
  /** The plate's vertical cover focus (PlatePerson uses the same). */
  focusY?: number;
}

export class Stage3D {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera: PerspectiveCamera;
  private rig: HeadRig | null = null;
  private tap: TeacherTap;
  private lip: LipDriver | null = null;
  private ring = new LipRing();
  private behaviour: Behaviour;
  private compositor = new Compositor();
  private restSmile = 0;
  /** Rig mode: the plate's camera (virtual 4:5 frame, cover-cropped like the plate). */
  private rigFrame: { eyeY: number; pw: number; ph: number } | null = null;
  private revealed = true;
  private readyAt = 0;
  private lastSig = NaN;
  private io: IntersectionObserver | null = null;
  private offscreen = false;
  private abort: AbortController | null = null;
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
  private onVis = () => (document.hidden || this.offscreen ? this.stop() : this.start());
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
    const antialias = opts.decision.tier !== "Blite";
    if (opts.look) {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("webgl2", { alpha: false, antialias, depth: true, stencil: false, powerPreference: "low-power", preserveDrawingBuffer: false });
      if (!context) throw new Error("no opaque WebGL2 context");
      this.renderer = new WebGLRenderer({ canvas, context, antialias });
      this.renderer.toneMapping = NeutralToneMapping;
      this.renderer.toneMappingExposure = 1;
      this.renderer.outputColorSpace = SRGBColorSpace;
      // exactly the plate renders' background (viewer main.js: Color(backdrop).convertSRGBToLinear() as scene
      // background), so plate → 3D is the same picture
      this.renderer.setClearColor(new Color(opts.look.entry.backdrop).convertSRGBToLinear(), 1);
      canvas.className = "tx-rig-canvas";
      canvas.setAttribute("aria-hidden", "true");
      this.revealed = false;
    } else {
      this.renderer = new WebGLRenderer({ antialias, alpha: true, depth: true, stencil: false, powerPreference: "low-power", preserveDrawingBuffer: false });
      this.renderer.setClearColor(0x000000, 0);
    }
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

    if (import.meta.env?.DEV) (window as unknown as { __stage3d?: Stage3D }).__stage3d = this;
    this.behaviour = new Behaviour({ band: opts.band, seed: opts.seed ?? 1, faceStyle: opts.tutor.faceStyle });
    this.tap = new TeacherTap(opts.sources);

    if (typeof ResizeObserver === "function") {
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(container);
    }
    document.addEventListener("visibilitychange", this.onVis);
    // Off-screen (scrolled away, a hidden tab panel): no rAF at all.
    if (typeof IntersectionObserver === "function") {
      this.io = new IntersectionObserver((es) => {
        this.offscreen = !es.some((e) => e.isIntersecting);
        this.onVis();
      });
      this.io.observe(container);
    }
    if (opts.look) {
      this.resize();
      return; // init() loads the GLB
    }
    this.rig = buildHead(opts.tutor.look, 0.3 * opts.tutor.faceStyle.smile);
    this.scene.add(this.rig.root);
    this.resize();
    this.firstRender();
  }

  /**
   * face.rig only: fetch runtime.json and the tier GLB (≤ RIG_TIMEOUT_MS), build the rig, compile and render one
   * frame, still hidden. Rejects on any failure: the caller stays on (or falls to) the look's plate.
   */
  async init(): Promise<void> {
    const look = this.opts.look;
    if (!look || this.rig) return;
    const rigTier = rigTierFor(this.decision.tier);
    const tierFile = rigTier ? look.entry.tiers[rigTier] : undefined;
    if (!rigTier || !tierFile) throw new Error(`look ${look.entry.id} has no ${String(rigTier)} tier`);
    const abort = (this.abort = new AbortController());
    let timer = 0;
    const timeout = new Promise<never>((_, reject) => {
      timer = window.setTimeout(() => {
        abort.abort();
        reject(new Error(`rig load timed out after ${RIG_TIMEOUT_MS} ms`));
      }, RIG_TIMEOUT_MS);
    });
    const work = (async () => {
      const runtime = look.runtime ?? (await fetchRuntime(look.entry));
      const rig: GlbRig = await loadTeacher(this.renderer, `${look.entry.base}${tierFile.file}`, runtime, rigTier, { signal: abort.signal });
      if (this.disposed || abort.signal.aborted) {
        rig.dispose();
        throw new Error("stage gone or timed out");
      }
      return { runtime, rig };
    })();
    try {
      const { runtime, rig } = await Promise.race([work, timeout]);
      this.rig = rig;
      this.compositor = new Compositor(runtime.jawCeiling ?? 0.85);
      this.restSmile = runtime.faceStyle?.restSmile ?? 0;
      this.rigFrame = { eyeY: rig.landmarks.eyeL.y, pw: look.entry.plate?.plate[0] ?? 360, ph: look.entry.plate?.plate[1] ?? 450 };
      this.scene.add(rig.root);
      this.resize();
      this.firstRender({ look: look.entry.id, lookRev: look.entry.rev, file: tierFile.file, bytes: tierFile.bytes, loadMs: rig.loadMs });
      this.readyAt = performance.now();
    } finally {
      window.clearTimeout(timer);
      work.catch(() => {}); // a late failure after the timeout is already handled
      this.abort = null;
    }
  }

  private firstRender(rig?: { look: string; lookRev: number; file: string; bytes: number; loadMs: number }): void {
    if (!this.rig) return;
    const opts = this.opts;
    // First render: compile + one render (morph packing happens on the first render, P-2.2), timed apart.
    const tCompile = performance.now();
    this.renderer.compile(this.scene, this.camera);
    const compiled = performance.now();
    this.tick(performance.now(), true);
    const rendered = performance.now();
    const s = this.rig.stats();
    opts.onEvent?.({ type: "ready", tier: this.decision.tier, loadMs: Math.round(rig ? rig.loadMs : compiled - this.t0), firstRenderMs: Math.round(rendered - tCompile),
      triangles: s.triangles, meshes: s.meshes, drawCalls: this.renderer.info.render.calls,
      ...(rig ? { rig: { look: rig.look, lookRev: rig.lookRev, file: rig.file, bytes: rig.bytes } } : {}) });
  }

  private frame(framing: "medium" | "close"): void {
    if (this.rigFrame) {
      // the plate's camera (scripts/character/viewer/main.js FRAMES.bust), in metres around her eye line
      const dist = 1.05, dy = -0.07, y = this.rigFrame.eyeY;
      this.camera.fov = 22;
      this.camera.near = 0.05;
      this.camera.far = 20;
      this.camera.position.set(0, y + dy * 0.4, dist);
      this.camera.lookAt(0, y + dy, 0);
      return;
    }
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
    if (this.opts.look) {
      let pr = this.decision.tier === "Blite" ? Math.min(1, this.governor.pixelRatio) : this.governor.pixelRatio;
      while (pr > 0.5 && w * h * pr * pr > 220_000) pr -= 0.05;
      this.renderer.setPixelRatio(pr);
      this.renderer.setSize(w, h, false);
      if (this.rigFrame) {
        // object-fit: cover of the plate's 4:5 frame, the same crop PlatePerson draws
        const { pw, ph } = this.rigFrame;
        const b = coverBox(w, h, pw, ph, this.opts.focusY ?? 0.4);
        this.frame("medium");
        this.camera.aspect = pw / ph;
        this.camera.setViewOffset(b.width, b.height, -b.left, -b.top, w, h);
        this.camera.updateProjectionMatrix();
      }
      return;
    }
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
    if (this.raf || this.disposed || this.offscreen || (typeof document !== "undefined" && document.hidden)) return;
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
    if (!this.rig) return; // rig mode, GLB not loaded yet: the plate underneath is the face
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
    const beh = this.restSmile ? { ...b.bs, mouthSmileLeft: (b.bs.mouthSmileLeft ?? 0) + this.restSmile * 0.5, mouthSmileRight: (b.bs.mouthSmileRight ?? 0) + this.restSmile * 0.5 } : b.bs;
    const bs = this.compositor.compose(beh, lipKeys(lipNow), dt);
    const breath = this.inputs.reducedMotion ? 0 : Math.sin(t * 2 * Math.PI * 0.25);
    // Skip the GPU when nothing moved (idle between blinks); the first frames and a hidden canvas always render.
    let sig = b.head[0] * 1.3 + b.head[1] * 1.7 + b.head[2] * 1.9 + b.gaze[0] * 2.3 + b.gaze[1] * 2.9 + b.lean * 3.1 + breath * 3.7;
    for (const k in bs) sig += bs[k] * (k.length + 1) * 0.37;
    if (force || sig !== this.lastSig || !this.revealed) {
      this.lastSig = sig;
      this.rig.apply(bs, b.head, b.gaze, b.lean, breath);
      this.renderer.render(this.scene, this.camera);
    }
    // Rig mode: reveal the 3D over the plate only in her silence (never mid-word: the mouth would jump).
    if (!this.revealed && !force && this.readyAt && !lf.speaking && lf.silenceMs >= REVEAL_SILENCE_MS) {
      this.revealed = true;
      this.renderer.domElement.dataset.shown = "1";
      this.opts.onEvent?.({ type: "reveal", afterMs: Math.round(performance.now() - this.readyAt) });
    }
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
    this.abort?.abort();
    this.stop();
    this.io?.disconnect();
    document.removeEventListener("visibilitychange", this.onVis);
    this.renderer.domElement.removeEventListener("webglcontextlost", this.onLost);
    this.ro?.disconnect();
    this.tap.dispose();
    this.rig?.dispose();
    // three r180's WebGLRenderer.dispose() frees GPU resources but NOT the context; without forceContextLoss() a
    // picker that rebuilds the stage per selection piles contexts up to the browser cap, which then evicts them.
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
