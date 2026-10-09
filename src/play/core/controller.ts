// The client-side level controller: runs the family's pure law for instant consequences (≤ 100 ms), records every act as
// the raw envelope the server will replay, and tells the host about moments and play turn-points (DESIGN.md §5: the
// teacher may speak only at a turn-point, never while a finger is down or within 600 ms of release).
import type { FamilyLogic, Moment, PlayActBody, PlayActEnvelope, PlayLevel } from "../../../shared/play.ts";

export const SETTLE_MS = 600;
export const IMPASSE_FLOOR_MS = 8000;

export interface ControllerEvents<S> {
  onMoments?(ms: Moment[], state: S, refused: string | undefined): void;
  onAct?(env: PlayActEnvelope): void;
  onSolved?(state: S): void;
  onImpasse?(): void;
}
export class PlayController<P = unknown, S = unknown, A extends PlayActBody = PlayActBody> {
  state: S;
  readonly acts: PlayActEnvelope<A>[] = [];
  private seq = 0;
  private t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  private lastActAt = this.t0;
  private fingerDown = false;
  private releasedAt = 0;
  private impasseTimer: ReturnType<typeof setTimeout> | null = null;
  readonly logic: FamilyLogic<P, S, A>;
  readonly level: PlayLevel<P>;
  private ev: ControllerEvents<S>;
  private impasseMs: number;
  constructor(logic: FamilyLogic<P, S, A>, level: PlayLevel<P>, ev: ControllerEvents<S> = {}, impasseMs = IMPASSE_FLOOR_MS) {
    this.logic = logic; this.level = level; this.ev = ev; this.impasseMs = impasseMs;
    this.state = logic.init(level);
    this.armImpasse();
  }
  private now(): number { return typeof performance !== "undefined" ? performance.now() : Date.now(); }
  private viaNow: "touch" | "voice" | "key" | null = null;
  /** run `fn` (control presses) with every act it dispatches recorded as `via` (a spoken act is a press, tagged voice) */
  withVia(via: "touch" | "voice" | "key", fn: () => void): void { const prev = this.viaNow; this.viaNow = via; try { fn(); } finally { this.viaNow = prev; } }
  dispatch(act: A, via: "touch" | "voice" | "key" = "touch"): { moments: Moment[]; refused?: string } {
    if (this.viaNow) via = this.viaNow;
    const seq = ++this.seq;
    const env: PlayActEnvelope<A> = { seq, t: Math.round(this.now() - this.t0), via, act };
    let r: { state: S; moments: Moment[]; refused?: string };
    try { r = this.logic.apply(this.level, this.state, act, seq); } catch { r = { state: this.state, moments: [], refused: "bad_act" }; }
    this.state = r.state;
    this.acts.push(env);
    this.lastActAt = this.now();
    this.ev.onAct?.(env as PlayActEnvelope);
    this.ev.onMoments?.(r.moments, this.state, r.refused);
    if (this.logic.goalMet(this.level, this.state)) { this.clearImpasse(); this.ev.onSolved?.(this.state); }
    else this.armImpasse();
    return { moments: r.moments, refused: r.refused };
  }
  get solved(): boolean { return this.logic.goalMet(this.level, this.state); }
  facts() { return this.logic.facts(this.level, this.state); }
  board() { return this.logic.board(this.level, this.state); }
  /** the view reports the finger (drag) so the teacher's floor rule can hold */
  finger(down: boolean): void { this.fingerDown = down; if (!down) this.releasedAt = this.now(); if (down) this.clearImpasse(); else this.armImpasse(); }
  /** a play turn-point: no finger down and ≥ 600 ms since release */
  atTurnPoint(): boolean { return !this.fingerDown && this.now() - this.releasedAt >= SETTLE_MS; }
  idleMs(): number { return this.now() - this.lastActAt; }
  private armImpasse(): void {
    this.clearImpasse();
    if (typeof setTimeout === "undefined") return;
    this.impasseTimer = setTimeout(() => { if (!this.solved && !this.fingerDown) this.ev.onImpasse?.(); }, this.impasseMs);
  }
  private clearImpasse(): void { if (this.impasseTimer) { clearTimeout(this.impasseTimer); this.impasseTimer = null; } }
  dispose(): void { this.clearImpasse(); }
}
