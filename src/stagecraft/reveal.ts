// Fused reveal timing (STAGECRAFT.md §4.3, SC-6): the piece appears WITH the clause of her line that names it, 400 ms
// before that clause's first sound (the cue scheduler's pre-roll), never before her line starts minus the pre-roll and
// never while the child holds the floor. The TTS clock (src/lesson/ttsStream.ts, patch P7) reports clause onsets.
export interface RevealCue { clauseIdx: number; preRollMs: number; crossFadeMs: number }

/** When to fire the reveal command, on the TTS clock: line start + onset(clauseIdx) − preRoll. */
export function fireAt(cue: RevealCue, lineStartAt: number, clauseOnsetsMs: number[]): number {
  const onset = clauseOnsetsMs[Math.min(Math.max(0, cue.clauseIdx), Math.max(0, clauseOnsetsMs.length - 1))] ?? 0;
  return lineStartAt + onset - cue.preRollMs;
}

/**
 * Holds one pending reveal and fires it on the TTS clock. A clause event that arrives late fires at once; a newer reveal
 * replaces the pending one; `childFloor(true)` defers firing until her floor comes back (law: nothing mid-utterance).
 */
export class CueScheduler<T> {
  private pending: { cue: RevealCue; payload: T } | null = null;
  private lineStart: number | null = null;
  private onsets: number[] = [];
  private childHolds = false;
  private readonly fire: (payload: T) => void;
  constructor(fire: (payload: T) => void) { this.fire = fire; }
  arm(cue: RevealCue, payload: T): void { this.pending = { cue, payload }; }
  lineStarted(at: number): void { this.lineStart = at; this.onsets = [0]; }
  clauseOnset(idx: number, offsetMs: number): void { this.onsets[idx] = offsetMs; }
  childFloor(holds: boolean): void { this.childHolds = holds; }
  /** Call on every clock tick (the TTS clock or rAF): fires the pending reveal once its time has come. */
  tick(now: number): boolean {
    const p = this.pending;
    if (!p || this.lineStart == null || this.childHolds) return false;
    if (this.onsets[p.cue.clauseIdx] == null && p.cue.clauseIdx > 0) return false;   // its clause onset is not known yet
    if (now < fireAt(p.cue, this.lineStart, this.onsets)) return false;
    this.pending = null;
    this.fire(p.payload);
    return true;
  }
  cancel(): void { this.pending = null; }
}
