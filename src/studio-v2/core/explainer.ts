// Shared shell for cinematic explainers: the narration-locked playhead, phrase captions, progress marks, live lines
// for the hands-on ending, the pace knob (re-compiles the timeline at 0.6-1.4× and keeps the position), "again", and
// the QA bot's skim (seek 5 s per step). Engines supply only the scene (a pure function of V and t) and the ending.
import type { BeatT, NarrationLine } from "../../../shared/studio-spec.ts";
import { clamp } from "./math.ts";
import { captionAt, chunksOf, compileTimeline, lineTiming, Playhead, valueAt, type Chunk, type Timeline, type TimelineConfig } from "./timeline.ts";
import type { BotAction, EngineApi, Knob } from "./types.ts";

export interface ExplainerSpec { beats: BeatT[]; text: Record<string, string>; narration: Record<string, NarrationLine> }
export class ExplainerShell {
  pace = 1; tl!: Timeline; head!: Playhead; live: Chunk[] | null = null; liveT = 0; private boot = 0; private timers: number[] = [];
  private api: EngineApi; private spec: ExplainerSpec; private cfg: TimelineConfig;
  constructor(api: EngineApi, spec: ExplainerSpec, cfg: TimelineConfig) {
    this.api = api; this.spec = spec; this.cfg = cfg;
    this.tl = compileTimeline(spec.beats, spec.text, spec.narration, cfg, 1);
    if (this.tl.repairs.length) api.event("timeline_repaired", { repairs: this.tl.repairs.slice(0, 20) });
    this.head = new Playhead(this.tl, (id) => api.say(id));
  }
  V = (p: string): number => valueAt(this.tl, this.cfg.init, p, this.head.t);
  get interactive(): boolean { return this.head.mode !== "timeline"; }
  /** advance; returns true on the frame the timeline hands over to the interactive ending */
  step(dt: number): boolean {
    this.boot += dt;
    if (this.boot > 0.6 && this.boot - dt <= 0.6 && this.head.mode === "timeline") this.head.play();
    const entered = this.head.step(dt);
    let cap = "";
    if (this.head.mode === "timeline") cap = captionAt(this.tl, this.head.t);
    else if (this.live) { this.liveT += dt; for (const c of this.live) if (this.liveT >= c.t0 - 0.05 && this.liveT < c.t1 + 0.3) cap = c.text; }
    this.api.caption(cap);
    this.api.progress(this.head.frac, this.head.marks);
    return entered;
  }
  /** a short live line in the ending (from spec text; estimated timing unless measured) */
  say(id: string, text?: string): void {
    const t = text ?? this.spec.text[id];
    if (!t) return;
    const c = chunksOf(lineTiming(id, { ...this.spec.text, [id]: t }, this.spec.narration));
    this.live = c.chunks; this.liveT = 0; this.api.say(id);
  }
  later(ms: number, fn: () => void): void { this.timers.push(window.setTimeout(fn, ms)); }
  tapToPlay(): boolean { if (this.head.mode === "timeline" && !this.head.playing) { this.head.play(); return true; } return false; }
  key(k: string): void { if (k === " ") { if (this.head.playing) this.head.pause(); else this.head.play(); } if (k === "ArrowRight") this.head.seek(this.head.t + 5); if (k === "ArrowLeft") this.head.seek(this.head.t - 5); }
  knob(k: Knob, onAgain?: () => void): boolean {
    if (k === "slower" || k === "faster") {
      const frac = this.head.t / Math.max(0.1, this.tl.interactiveAt), mode = this.head.mode;
      this.pace = clamp(this.pace * (k === "slower" ? 0.85 : 1.15), 0.6, 1.4);
      this.tl = compileTimeline(this.spec.beats, this.spec.text, this.spec.narration, this.cfg, this.pace);
      this.head = new Playhead(this.tl, (id) => this.api.say(id), frac * this.tl.interactiveAt); this.head.mode = mode; this.head.play();
      return true;
    }
    if (k === "again") { this.live = null; this.head = new Playhead(this.tl, (id) => this.api.say(id)); this.head.play(); onAgain?.(); return true; }
    return false;
  }
  /** QA bot: let the opening play at natural speed (what the recording shows), then seek 5 s per step */
  skim(): BotAction { if (!this.head.playing) return { type: "tap", at: [500, 300] }; return this.head.t < 20 ? { type: "wait", ms: 500 } : { type: "key", key: "ArrowRight", after: 1500 }; }
  dispose(): void { for (const t of this.timers) clearTimeout(t); }
}
