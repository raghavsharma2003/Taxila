// PuppetStage: the imperative host for the 2D puppet (the 2D twin of src/avatar/three/stage3d.ts). It owns the canvas,
// the WebGL2 rig, the frame loop and every failure path; React only mounts and unmounts it (PuppetFace.tsx).
//
// Frame loop: rAF, 60 fps target. Each frame = tap read → PuppetDriver (lip, floor, acting) → rig deform + draw.
// Governor (low CPU on cheap phones): the frame's JS work (driver + rig) is tracked over a rolling 2 s window; if its p95
// exceeds the budget the stage steps down, in order: DPR → 1.5 → 1, then a 30 fps cap; if a 30 fps / DPR 1 frame still
// cannot fit, the stage reports `fallback: slow` and the host shows the fallback face. It never steps back up within a
// page (no oscillation). Hidden tab: rAF stops, nothing runs.
// Failures → `fallback` events (the host decides the face): no WebGL2, asset load error, load timeout (8 s), a second
// context loss, the governor floor. A first context loss shows the poster and rebuilds once on restore.
// Loading (ship5 p2-face): loader.ts decodes the layers off the main thread and runs the warm-up in <= 8 ms slices (the
// judged load + warm() was one ~1 s main-thread task on a 4x-throttled profile); pixels match the judged path within 3/255
// (evals/p2-face/out/loader-parity.json). Events: loaded (path, slices, longest slice), firstDraw, reveal (+ which rule
// fired), stall (a drawn-frame gap > STALL_MS), all also kept in `log` for the ?facerig=1 read-out and the acceptance test.
// Audio floor: nothing here touches playback; the tap is analysis-only (src/avatar/tap.ts).
import { Puppet2DRig } from "./runtime/rig.js";
import { PuppetDriver } from "./driver.ts";
import { loadRigChunked } from "./loader.ts";
import { clearPageSafety, pageInSafety } from "./latch.ts";
import { puppetBus } from "./bus.ts";
import { lookPack, type PuppetLook } from "./assets.ts";
import { TeacherTap, type TapSource } from "../avatar/tap.ts";
import { faceCues, faceAffectOf, gazeAngles, gazeElement, type FaceCue } from "../avatar/faceCues.ts";
import type { FloorStatus } from "../avatar/behaviour.ts";

export type PuppetStageEvent =
  | { type: "loaded"; ms: number; path?: string; slices?: number; longestSliceMs?: number; warmFrameMs?: number }
  /** `why`: the reveal rule that fired (silence | closed | bound), so the "never mid-word" claim is measured, not assumed. */
  | { type: "reveal"; ms: number; why: "silence" | "closed" | "bound" }
  /** The first live frame was drawn (ms since the stage was constructed), revealed or not. */
  | { type: "firstDraw"; ms: number }
  /** A drawn-frame gap over STALL_MS while the stage was running and the page visible (telemetry; ship5 p2-face). */
  | { type: "stall"; ms: number; speaking: boolean }
  | { type: "fallback"; reason: string }
  | { type: "contextlost" }
  | { type: "governor"; step: string; workP95: number }
  | { type: "stats"; fpsP50: number; intervalP95: number; workP95: number; rigP95: number; dpr: number; fpsCap: number; draws: number; tris: number; lipSource: string };

export interface PuppetStageOptions {
  band: string;
  sources: TapSource[];
  framing?: "medium" | "close";
  reducedMotion?: boolean;
  gentle?: boolean;
  seed?: number;
  /** The puppet look (./assets.ts): its pack, clear colour and views. Default the shipped default look. */
  look?: PuppetLook;
  /** Base URL of the pack (default the look's own). */
  base?: string;
  /** Budget for the frame's JS work at p95 (ms). 8 ms leaves half a 60 fps frame for the GPU and the page. */
  budgetMs?: number;
  loadTimeoutMs?: number;
  /** "chunked" (default, loader.ts) or "judged" (Puppet2DRig.load + warm() in one task: the parity eval). */
  loader?: "chunked" | "judged";
  /** The clock the bus events are judged against (default performance.now; the evals pass their scripted clock). */
  now?: () => number;
  onEvent?: (e: PuppetStageEvent) => void;
}

/** A drawn-frame gap above this is a visible freeze (5+ frames at 30 fps), reported as a `stall` event. */
export const STALL_MS = 180;

/** At most one RUNNING stage per page: the newest started. Measured (ship5 p2-face): the safeguarding TroubleScreen
 *  mounted a second live puppet over the lesson tile (two WebGL loops on a budget phone). The others hold their last
 *  frame (suspended) and the most recent of them resumes when the foreground stage is disposed. */
const foreground: PuppetStage[] = [];

const pct = (a: number[], q: number) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };

export class PuppetStage {
  readonly canvas: HTMLCanvasElement;
  readonly driver: PuppetDriver;
  private host: HTMLElement;
  private o: PuppetStageOptions;
  private rig: Puppet2DRig | null = null;
  private tap: TeacherTap;
  private raf = 0;
  private running = false;
  private suspended = false;
  private wasSafe = false;
  private disposed = false;
  private status: FloorStatus | null = null;
  private childLevel = 0;
  private dpr: number;
  private fpsCap = 60;
  private curFps = 60;
  private strikes = 0;
  private lastDraw = 0;
  private lastNow = 0;
  private work: number[] = [];
  private rigMs: number[] = [];
  private intervals: number[] = [];
  private frames = 0;
  private stalls = 0;
  private revealed = false;
  private losses = 0;
  private lastStep = 0;
  private lipSource = "none";
  private offs: Array<() => void> = [];
  private timers = new Set<number>();
  private t0 = performance.now();

  constructor(host: HTMLElement, o: PuppetStageOptions) {
    this.host = host;
    this.o = o;
    this.dpr = Math.min(2, typeof devicePixelRatio === "number" ? devicePixelRatio : 1);
    this.driver = new PuppetDriver({ band: o.band, seed: o.seed, reducedMotion: o.reducedMotion, gentle: o.gentle });
    // a face mounted during a safety turn (the TroubleScreen's) is neutral from its first frame (latch.ts)
    if (pageInSafety()) { this.driver.safetyTurn(performance.now()); this.wasSafe = true; }
    this.tap = new TeacherTap(o.sources);
    const c = document.createElement("canvas");
    c.className = "fp-canvas";
    c.setAttribute("aria-hidden", "true");
    c.style.cssText = "position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity 220ms ease-out;display:block";
    this.canvas = c;
    c.addEventListener("webglcontextlost", this.onLost, false);
    c.addEventListener("webglcontextrestored", this.onRestored, false);
    // Review v4 (2026-10-05): listen from construction, not after the pack loads. The driver needs no rig, and init()
    // awaits the chunk + pack + GL warm (seconds on a cold phone): a part-0 viseme batch, a Director affect or a look that
    // arrived in that window was silently dropped, so the greeting (the first line of every lesson) lost its visemes.
    // dispose() removes these listeners on every path, including a failed init.
    this.subscribe();
    // a hidden tab stops rAF: the gap on return is not a stall
    if (typeof document !== "undefined") {
      const onVis = () => { this.lastNow = 0; };
      document.addEventListener("visibilitychange", onVis);
      this.offs.push(() => document.removeEventListener("visibilitychange", onVis));
    }
  }

  /** The last 64 non-stats events with their performance.now() (the owner's ?facerig read-out and the acceptance test). */
  readonly log: Array<PuppetStageEvent & { at: number }> = [];

  private emit(e: PuppetStageEvent): void {
    if (e.type !== "stats") { this.log.push({ ...e, at: Math.round(performance.now()) }); if (this.log.length > 64) this.log.shift(); }
    try {
      this.o.onEvent?.(e);
    } catch {
      /* a host callback must never break the face */
    }
  }

  /** Load the pack and the rig; resolves when the first frame can draw. Rejects → the host falls back. */
  async init(): Promise<void> {
    const t0 = performance.now();
    if (typeof WebGL2RenderingContext === "undefined") throw new Error("no WebGL2");
    this.host.appendChild(this.canvas);
    const pack = lookPack(this.o.look);
    const view = [...pack.view[this.o.framing ?? "medium"]] as [number, number, number];
    const ropts = { ext: "webp", dpr: this.dpr, view, clear: [...pack.clear] as [number, number, number], reducedMotion: this.o.reducedMotion };
    const base = this.o.base ?? pack.base;
    // ship5 p2-face: the chunked loader (loader.ts) by default: bitmaps decoded off-thread, warm-up in <= 8 ms slices.
    // The judged single-task path (load + warm) stays available for the parity eval and as the loader's own fallback.
    const abort = { aborted: false };
    const load = this.o.loader === "judged"
      ? Puppet2DRig.load(this.canvas, base, ropts).then((rig) => { rig.warm(); return { rig, path: "judged", slices: 1, longestSliceMs: NaN, warmFrameMs: NaN }; })
      : loadRigChunked(this.canvas, base, ropts, { signal: abort });
    const timeout = new Promise<never>((_, rej) => { const id = window.setTimeout(() => { abort.aborted = true; rej(new Error("puppet load timeout")); }, this.o.loadTimeoutMs ?? 8000); this.timers.add(id); });
    const res = await Promise.race([load, timeout]);
    const rig = res.rig;
    if (this.disposed) { rig.dispose(); return; }
    this.rig = rig;
    this.emit({ type: "loaded", ms: Math.round(performance.now() - t0), path: res.path, slices: res.slices, longestSliceMs: Math.round(res.longestSliceMs), warmFrameMs: Math.round(res.warmFrameMs * 10) / 10 });
    this.startTier(res.warmFrameMs);
  }

  private subscribe(): void {
    this.offs.push(puppetBus.on((e) => {
      const now = (this.o.now ?? (() => performance.now()))();
      if (e.kind === "visemes") this.driver.visemes.push(e.part, e.playAt, e.visemes, e.words ?? [], now, e.text, e.reqId);
      else if (e.kind === "cut") this.driver.cut();
      else if (e.kind === "duplex") {
        const c = e.cue;
        if (c.kind === "pose") this.driver.pose(c.pose, now);
        else if (c.kind === "nod") this.driver.nodCue(c.peakDeg, now);
        // "clip" cues are audio (the mm bank): the face does not invent a mouth for a sound it was not given
      } else if (e.kind === "duplex-detach") this.driver.detachDuplex(now);
      else if (e.kind === "ack") this.driver.ack(e.phase, now);
    }));
    this.offs.push(faceCues.on((cue: FaceCue) => this.onCue(cue)));
  }

  private onCue(cue: FaceCue): void {
    const now = (this.o.now ?? (() => performance.now()))();
    if (cue.kind === "affect") {
      // R6 (policy.ts): a safety turn is neutral, never the concern preset (which read as a smile, or as disappointed)
      if (cue.display === "calm_steady") { this.driver.safetyTurn(now); return; }
      const a = faceAffectOf(cue.display, this.o.band);
      if (a) this.driver.affect(a.emotion, a.intensity, now);
    } else if (cue.kind === "gaze") {
      if (cue.target === "child") return;
      const el = gazeElement(cue.target, document);
      if (!el) return;
      const a = this.host.getBoundingClientRect(), b = el.getBoundingClientRect();
      if (!a.width || !b.width) return;
      const [yaw, pitch] = gazeAngles({ x: a.left, y: a.top, w: a.width, h: a.height }, { x: b.left, y: b.top, w: b.width, h: b.height });
      this.driver.lookAt(yaw, pitch, cue.holdMs / 1000, cue.reason);
    } else if (cue.kind === "voice") {
      const kind = cue.event.kind;
      const id = window.setTimeout(() => { this.timers.delete(id); this.driver.voiceEvent(kind); }, Math.max(0, Math.min(10_000, cue.event.atMs)));
      this.timers.add(id);
    }
  }

  /** Move this live stage into another host (a Face <-> Work layout switch: two <Teacher> mounts, medium <-> close),
   *  keeping its WebGL context, rig, driver state and her in-flight visemes. Review v4 (2026-10-05): the alternative is a
   *  new stage per mount, which shows the still poster over her voice until it reveals (evals/face-puppet/out/remount.json). */
  attach(host: HTMLElement, framing: "medium" | "close", onEvent?: (e: PuppetStageEvent) => void): void {
    this.host = host;
    this.o = { ...this.o, framing, onEvent: onEvent ?? this.o.onEvent };
    host.appendChild(this.canvas);
    if (this.rig) this.rig.view = [...lookPack(this.o.look).view[framing]];
  }

  get isRevealed(): boolean {
    return this.revealed && !this.disposed;
  }

  set(p: { status?: FloorStatus | null; reducedMotion?: boolean; gentle?: boolean; childLevel?: number }): void {
    if (p.status !== undefined) this.status = p.status;
    if (p.childLevel !== undefined) this.childLevel = p.childLevel;
    if (p.reducedMotion !== undefined || p.gentle !== undefined) {
      this.driver.setMotion({ reduced: p.reducedMotion, gentle: p.gentle });
      if (this.rig && p.reducedMotion !== undefined) { this.rig.reduced = p.reducedMotion; this.rig.life.reduced = p.reducedMotion; }
    }
  }

  start(): void {
    if (this.running || this.disposed) return;
    this.suspended = false;
    const k = foreground.indexOf(this);
    if (k >= 0) foreground.splice(k, 1);
    foreground.push(this);
    for (const other of foreground) if (other !== this && other.running) { other.stop(); other.suspended = true; }
    this.running = true;
    this.lastNow = 0; // a stop/start (park, context restore) is not a stall
    const loop = (now: number) => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      this.tick(now);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /** One frame (public for the deterministic evals: tick(now) with a scripted clock). */
  tick(now: number, force = false): void {
    const rig = this.rig;
    if (!rig || this.disposed) return;
    // adaptive rate (low CPU): 60 fps while she speaks or the face is changing (a state change, an expression ramp, a nod,
    // a look); 30 fps in the slow holds (listening, thinking, idle: breath, drift and blinks, whose shaper already runs on
    // 30 Hz steps). The governor's cap, when it has stepped down, wins.
    const want = this.fpsCap < 60 ? this.fpsCap : now / 1000 < this.driver.busyUntil ? 60 : 30;
    this.curFps = want;
    if (!force && want < 60 && now - this.lastDraw < 1000 / want - 2) return;
    // intervals between DRAWN frames (the rate the child sees), not rAF callbacks
    const gap = this.lastNow ? now - this.lastNow : 0;
    if (gap) this.intervals.push(gap);
    this.lastNow = now;
    this.lastDraw = now;
    const w0 = performance.now();
    const tap = this.tap.read();
    rig.R.dpr = this.dpr;
    const r0 = performance.now();
    const f = this.driver.frame({ nowMs: now, tap, status: this.status, childLevel: this.childLevel }, rig);
    const rigMs = performance.now() - r0 - f.workMs;
    const work = performance.now() - w0;
    this.lipSource = f.lipSource;
    const safe = this.driver.inSafety;
    if (this.wasSafe && !safe) clearPageSafety();
    this.wasSafe = safe;
    this.work.push(work);
    this.rigMs.push(rigMs);
    if (this.work.length > 120) { this.work.shift(); this.rigMs.shift(); }
    if (this.intervals.length > 120) this.intervals.shift();
    this.frames++;
    if (this.frames === 1) this.emit({ type: "firstDraw", ms: Math.round(performance.now() - this.t0) });
    else if (gap > STALL_MS && (typeof document === "undefined" || document.visibilityState !== "hidden")) {
      this.stalls++;
      this.emit({ type: "stall", ms: Math.round(gap), speaking: f.state === "speaking" });
    }
    // reveal in her silence, or while she talks at a moment her live mouth is closed (the poster under it is the same face
    // with the mouth closed, so the 220 ms fade shows no jump), or after 0.8 s regardless. Review v4 (2026-10-05): the
    // rule was "silence or 2.5 s", and every Face <-> Work layout switch (TeacherWindow medium <-> SpeechRow close are two
    // mounts) while she talked held the still poster for 2.5 s over her voice: a frozen mouth on a talking teacher
    // (evals/face-puppet/out/remount.json: 2514-2535 ms, n = 3; in silence 157-161 ms).
    // "Closed" = jaw under 0.12 of the rig's range with no open vowel at full: a near-closure (p/b/m, a word gap), so the
    // fade from the poster's closed lips shows no jump. Bounded at 800 ms of talking: a still mouth over her voice is the
    // worse failure, and the face is the same either side of the fade.
    const closedMouth = (f.mouth.jawOpen ?? 0) < 0.12 && (f.mouth.viseme_aa ?? 0) < 0.5 && (f.mouth.viseme_O ?? 0) < 0.5;
    // The rule, exactly (ship5 p2-face: the earlier write-up said "only during her silence", which was never true): the
    // FIRST of (a) she is not speaking, (b) she is speaking and her live mouth is near-closed, (c) 800 ms of frames. The
    // event names which one fired; (c) is the only case where the fade can start on an open mouth.
    if (!this.revealed && this.frames > 2) {
      const why = f.state !== "speaking" ? "silence" : closedMouth ? "closed" : now - this.t0 > 800 ? "bound" : null;
      if (why) {
        this.revealed = true;
        this.canvas.style.opacity = "1";
        this.emit({ type: "reveal", ms: Math.round(now - this.t0), why });
      }
    }
    if (this.frames % 60 === 0) {
      this.govern(now);
      const st = rig.stats();
      this.emit({ type: "stats", fpsP50: 1000 / Math.max(1, pct(this.intervals, 0.5)), intervalP95: pct(this.intervals, 0.95), workP95: pct(this.work, 0.95), rigP95: pct(this.rigMs, 0.95), dpr: this.dpr, fpsCap: this.fpsCap, draws: st.meshes, tris: st.triangles, lipSource: this.lipSource });
    }
  }

  /** Ship5 p2-face: start at the rate this device can hold. Measured on the throttled phone profile (evals/p2-face): the
   *  governor alone took 15 s to its first step and ~30 s to 30 fps, and in that window a 20-30 ms rig frame at 60 fps
   *  starved the page (freezes up to 1.3 s in her first sentences). The warm-up's own frames (after their first-use costs)
   *  measure the rig here before the face is shown: over the 60 fps budget → start at 30 fps; over the 30 fps budget →
   *  20 fps. The governor still steps down from there (never up). */
  private startTier(warmFrameMs: number): void {
    if (!(warmFrameMs > 0)) return;
    const budget = this.o.budgetMs ?? 8;
    const cap = warmFrameMs > budget * 2.5 ? 20 : warmFrameMs > budget ? 30 : 60;
    if (cap < this.fpsCap) {
      this.fpsCap = cap;
      this.emit({ type: "governor", step: `start ${cap} fps`, workP95: warmFrameMs });
    }
  }

  private govern(now: number): void {
    // ship5 p2-face: 60-frame windows, 1.5 s apart (was 90 frames, 2 s): the first step lands in ~2-3 s, not 15 s
    if (this.work.length < 60 || now - this.lastStep < 1500) return;
    // budget per frame interval: 8 ms of JS at 60 fps (half the frame left for GL, compositing and the page), 20 ms at
    // 30 fps, 30 ms at 20 fps. A step needs TWO consecutive over-budget windows (~4 s sustained): wall-clock work includes
    // preemption, and one busy moment on the phone must not cost the child the smooth face for the rest of the page.
    const budget = this.o.budgetMs ?? 8;
    const p95 = pct(this.work, 0.95);
    const limit = this.fpsCap >= 60 ? budget : this.fpsCap >= 30 ? budget * 2.5 : budget * 3.75;
    if (p95 <= limit) { this.strikes = 0; return; }
    if (++this.strikes < 2) { this.work.length = 0; this.rigMs.length = 0; return; }
    this.strikes = 0;
    this.lastStep = now;
    this.work.length = 0;
    this.rigMs.length = 0;
    let step: string;
    if (this.dpr > 1.5) { this.dpr = 1.5; step = "dpr 1.5"; }
    else if (this.dpr > 1) { this.dpr = 1; step = "dpr 1"; }
    else if (this.fpsCap > 30) { this.fpsCap = 30; step = "30 fps"; }
    else if (this.fpsCap > 20) { this.fpsCap = 20; step = "20 fps"; }
    else if (p95 > budget * 5.6) { step = "floor"; this.emit({ type: "governor", step, workP95: p95 }); this.emit({ type: "fallback", reason: `slow: work p95 ${p95.toFixed(1)} ms at 20 fps, dpr 1` }); this.stop(); return; }
    else return; // at the 20 fps / dpr 1 floor and still inside a 20 fps frame: hold
    this.emit({ type: "governor", step, workP95: p95 });
  }

  private onLost = (e: Event) => {
    e.preventDefault();
    this.losses++;
    this.stop();
    this.canvas.style.opacity = "0";
    this.revealed = false;
    this.emit({ type: "contextlost" });
    if (this.losses > 1) this.emit({ type: "fallback", reason: "webgl context lost twice" });
    else {
      // the restore may never come (the GPU process died): give it 3 s, then fall back
      const id = window.setTimeout(() => { this.timers.delete(id); if (!this.running && !this.disposed) this.emit({ type: "fallback", reason: "webgl context not restored" }); }, 3000);
      this.timers.add(id);
    }
  };

  private onRestored = () => {
    if (this.disposed || this.losses > 1) return;
    // every GL object died with the context: rebuild the rig (the pack is in the HTTP cache)
    this.rig = null;
    const pack = lookPack(this.o.look);
    const view = [...pack.view[this.o.framing ?? "medium"]] as [number, number, number];
    Puppet2DRig.load(this.canvas, this.o.base ?? pack.base, { ext: "webp", dpr: this.dpr, view, clear: [...pack.clear] as [number, number, number], reducedMotion: this.o.reducedMotion })
      .then((rig) => { if (this.disposed) return rig.dispose(); rig.warm(); this.rig = rig; this.t0 = performance.now(); this.frames = 0; this.start(); })
      .catch((err: unknown) => this.emit({ type: "fallback", reason: `rebuild after context loss failed: ${String(err).slice(0, 120)}` }));
  };

  /** The live rig's mouth state (evals: the rendered lip gap in rest-space px, p.g). */
  mouthProbe(): { gap: number; name: string; lip: string; state: string; revealed: boolean } | null {
    const r = this.rig as unknown as { solver?: { p?: { g?: number } }; mouth?: { name: string } } | null;
    return r ? { gap: r.solver?.p?.g ?? 0, name: r.mouth?.name ?? "", lip: this.lipSource, state: this.driver.policy.faceState, revealed: this.revealed } : null;
  }

  /** Stats for the evals and the owner's ?facerig read-out. */
  snapshot() {
    const st = this.rig?.stats() ?? { triangles: 0, meshes: 0 };
    return { frames: this.frames, fpsP50: 1000 / Math.max(1, pct(this.intervals, 0.5)), intervalP95: pct(this.intervals, 0.95), workP50: pct(this.work, 0.5), workP95: pct(this.work, 0.95), rigP95: pct(this.rigMs, 0.95), dpr: this.dpr, fpsCap: this.fpsCap, draws: st.meshes, tris: st.triangles, lipSource: this.lipSource, curFps: this.curFps, revealed: this.revealed, state: this.driver.policy.faceState, stalls: this.stalls };
  }

  dispose(): void {
    this.disposed = true;
    this.stop();
    const k = foreground.indexOf(this);
    if (k >= 0) {
      const wasTop = k === foreground.length - 1;
      foreground.splice(k, 1);
      const top = foreground[foreground.length - 1];
      if (wasTop && top?.suspended && !top.disposed) top.start();
    }
    for (const off of this.offs) off();
    this.offs = [];
    for (const id of this.timers) window.clearTimeout(id);
    this.timers.clear();
    this.tap.dispose();
    this.canvas.removeEventListener("webglcontextlost", this.onLost);
    this.canvas.removeEventListener("webglcontextrestored", this.onRestored);
    this.rig?.dispose();
    this.rig = null;
    this.canvas.remove();
  }
}
