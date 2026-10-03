// Latency masking (PRODUCT-DESIGN-V2 §4.5): something true happens at every beat of the 2-3.5 s wait, and NOTHING
// previews the verdict. Pure: the beats are a function of time since the commit; the ack-clip rationing is a small
// state machine whose inputs never include correctness (G-WAIT-1: the clip rate, nod timing and thinking duration
// must not differ between right and wrong answers).
//   0 ms     heard: "Got it", the chip collapses onto the card (local)
//   600 ms   "{T} is thinking" + the stroke dots (not earlier, so a fast reply never flashes a label)
//   1.2 s    a mounted Board/module gets the child's answer chalked on (their own answer, right or wrong alike)
//   1.6 s    at most one pre-rendered "hmm / okay / let me see" in her voice (ackClipS), tap-to-talk only
//   4 s      her "one moment" gesture + clip, once; Older see "Thinking… 4 s"
//   8 s      T1 (src/lesson/trouble.ts)
export interface Beats {
  thinkingLabel: boolean;
  chalk: boolean;
  ackDue: boolean;
  moment: boolean;
  /** Older only: whole seconds shown in the dock from 4 s. */
  seconds: number | null;
}

export const BEATS = { labelMs: 600, chalkMs: 1200, ackMs: 1600, momentMs: 4000 } as const;

export function beatsAt(msSinceCommit: number, opts: { older: boolean; ackClipS?: number }): Beats {
  const t = msSinceCommit;
  const ackMs = (opts.ackClipS ?? 1.6) * 1000;
  return {
    thinkingLabel: t >= BEATS.labelMs,
    chalk: t >= BEATS.chalkMs,
    ackDue: t >= ackMs,
    moment: t >= BEATS.momentMs,
    seconds: opts.older && t >= BEATS.momentMs ? Math.floor(t / 1000) : null,
  };
}

/**
 * Ack-clip rationing (§4.5): ≤ 1 per 3 turns, never twice in a row, never on a safety-predicate turn, only in
 * tap-to-talk mode (the uplink is closed, so the clip cannot reach the echo path), and only if no audio has started
 * by ackClipS. Deliberately has NO verdict input: the distribution is the same after right and wrong.
 */
export class AckRationer {
  private turn = 0;
  private lastClipTurn = -Infinity;
  /** Pick an index from the bank deterministically per turn (no repeats in a row). */
  private lastIndex = -1;

  /** A new child commit: call once per turn, before asking. */
  nextTurn(): number {
    return ++this.turn;
  }

  allow(o: { tapToTalk: boolean; safetyTurn: boolean; audioStarted: boolean; bankSize: number }): boolean {
    if (!o.tapToTalk || o.safetyTurn || o.audioStarted || o.bankSize <= 0) return false;
    if (this.turn - this.lastClipTurn < 3) return false; // ≤ 1 per 3 turns, and so never consecutive
    this.lastClipTurn = this.turn;
    return true;
  }

  pick(bankSize: number, rand: () => number = Math.random): number {
    if (bankSize <= 1) return 0;
    let i = Math.floor(rand() * bankSize);
    if (i === this.lastIndex) i = (i + 1) % bankSize;
    this.lastIndex = i;
    return i;
  }
}

/** The ack clip bank: 12 per language per teacher, recorded once in her voice (§9.2, own-teacher-voice-record-once).
 *  None are recorded yet, so the bank is empty and allow() is always false until the files exist (B4 build). */
export function ackBank(_teacherId: string, _lang: string): string[] {
  return [];
}
