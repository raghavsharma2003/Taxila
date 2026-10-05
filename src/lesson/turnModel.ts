// The end of the child's turn (TEACHER-BRAIN §5.4 L1, BUILD-PLAN W2-E BR2b; world-best S1). Behind `turn.predictive`
// (default OFF): listen longer when the child is mid-thought, answer sooner when they are done.
//
//   1. the transcription session's server VAD ends a fragment after PREDICTIVE_SILENCE_MS (500 ms) instead of 900 ms;
//   2. each final fragment gets P(the child is done) from a scorer: the on-device Smart Turn model when its assets are
//      present (public/models/smart-turn/, not shipped yet: see loadSmartTurn), else the transcript heuristic below;
//   3. P below the turn's threshold → the fragment is HELD for a short window (the floor shows the receipt, the child can
//      go on); a new onset inside the window merges the next fragment into ONE turn; otherwise it is sent as it was.
// The threshold and the window come from the turn's context (`ui.beat`, `ui.answerForm`, `ui.handover`): high for a
// why-probe or a teach-back (a child explaining pauses to think), low for a number or a tap (no hold at all).
// Pure apart from the module's turn-context slot, which the floor controller fills from every `ui` (floor.ts).

export interface TurnContext {
  beat?: string;
  answerForm?: string;
  handover?: string;
}
export interface TurnFinal {
  type: "child_final";
  text: string;
  startedAt: number;
  typed: boolean;
  itemId?: string;
  asrConfidence?: number;
  chipId?: string;
}

/** Server VAD silence when turn.predictive is on (the candidate endpoint; 900 ms otherwise, voice-turn-config). */
export const PREDICTIVE_SILENCE_MS = 500;
export const PREDICTIVE_KEY = "tx.flag.turn.predictive";

/** `turn.predictive`: `?predictive=1|0|default` (persisted), localStorage, else VITE_TURN_PREDICTIVE=1. Default OFF. */
export function predictiveEnabled(): boolean {
  try {
    if (typeof location !== "undefined") {
      const v = new URLSearchParams(location.search).get("predictive");
      if (v === "1" || v === "0") localStorage.setItem(PREDICTIVE_KEY, v);
      else if (v === "default") localStorage.removeItem(PREDICTIVE_KEY);
    }
    const s = typeof localStorage !== "undefined" ? localStorage.getItem(PREDICTIVE_KEY) : null;
    if (s === "1") return true;
    if (s === "0") return false;
  } catch {
    /* no URL / storage blocked: the build default */
  }
  return import.meta.env?.VITE_TURN_PREDICTIVE === "1";
}

let ctxNow: TurnContext = {};
/** The floor controller calls this with every turn's ui (floor.ts FloorController.onSignal). */
export function setTurnContext(ui: Record<string, unknown> | null | undefined): void {
  const beat = ui?.beat && typeof ui.beat === "object" ? (ui.beat as { type?: unknown }).type : undefined;
  ctxNow = {
    beat: typeof beat === "string" ? beat : undefined,
    answerForm: typeof ui?.answerForm === "string" ? ui.answerForm : undefined,
    handover: typeof ui?.handover === "string" ? ui.handover : undefined,
  };
}
export const turnContext = (): TurnContext => ctxNow;

const EXPLAINING_BEATS = new Set(["teachback", "explain", "worked_example", "contrast", "explore_question", "reflect"]);

/** P(done) at or above which a fragment is sent at once. */
export function endThreshold(ctx: TurnContext): number {
  if (ctx.answerForm === "number" || ctx.answerForm === "choice" || ctx.handover === "choice") return 0.3;
  if (ctx.beat && EXPLAINING_BEATS.has(ctx.beat)) return 0.8;
  if (ctx.beat === "probe") return 0.75;
  return 0.55;
}

/** How long a fragment judged unfinished may wait for the child to go on (ms). */
export function holdMsFor(ctx: TurnContext): number {
  if (ctx.answerForm === "number" || ctx.answerForm === "choice" || ctx.handover === "choice") return 0;
  if (ctx.beat && EXPLAINING_BEATS.has(ctx.beat)) return 1500;
  if (ctx.beat === "probe") return 1200;
  return 800;
}

const TRAILING_OPEN = /(?:^|\s)(aur|toh|to|kyunki|kyonki|matlab|jaise|ki|ya|phir|fir|lekin|par|and|so|because|but|or|like|umm+|uh+|hmm+|मतलब|और|क्योंकि|तो|जैसे|कि|या|फिर|लेकिन)[\s.,…-]*$/iu;

/**
 * The transcript heuristic for P(the child is done) (used when no on-device model is loaded). It reads only the shape of
 * the words: a trailing conjunction or filler ("…aur", "…kyunki", "umm") means mid-thought; a question or a bare number
 * means done; a very short reply to a why-probe or a teach-back is probably a start.
 */
export function textCompleteness(text: string, ctx: TurnContext): number {
  const t = String(text ?? "").trim();
  if (!t) return 1;
  if (TRAILING_OPEN.test(t) || /[,…-]\s*$/.test(t)) return 0.15;
  if (/[?？]\s*$/.test(t)) return 0.9;
  if (/^[-−]?[\d,]+(?:[./]\d+)?\s*[.!]?$/.test(t)) return 0.95;
  const words = t.split(/\s+/).filter(Boolean).length;
  if (ctx.beat && EXPLAINING_BEATS.has(ctx.beat) && words <= 3) return 0.4;
  if (ctx.beat === "probe" && words <= 2) return 0.45;
  // a full sentence with no trailing connective reads finished, even for a why-probe or a teach-back
  return words >= 6 ? 0.85 : 0.75;
}

/** An on-device end-of-turn scorer (Smart Turn v3.2 int8 in a worker, when shipped). */
export interface EndScorer {
  score(text: string, ctx: TurnContext): number;
}
export const heuristicScorer: EndScorer = { score: textCompleteness };

/**
 * The Smart Turn assets (BSD-2; ~8 MB int8 ONNX, cached with the lesson pack) are not shipped in this build: there is no
 * ONNX runtime in the bundle yet and the model has not been validated on Hindi/Hinglish child audio (world-best S1(a)).
 * Until both land this returns null and the heuristic scores.
 */
export async function loadSmartTurn(): Promise<EndScorer | null> {
  return null;
}

/**
 * Holds a fragment judged unfinished and merges the next one into it. Feed it the link's events; it answers what to
 * emit and when. One instance per cascade link.
 */
export class FragmentMerger {
  private held: TurnFinal | null = null;
  private resumed = false;
  private readonly scorer: EndScorer;

  constructor(scorer: EndScorer = heuristicScorer) {
    this.scorer = scorer;
  }

  /** A final fragment arrived. `emit` = send this now; `holdMs` = arm a timer and call flush() when it fires. */
  onFinal(e: TurnFinal, ctx: TurnContext): { emit?: TurnFinal; holdMs?: number } {
    const merged = this.held ? mergeFinals(this.held, e) : e;
    this.held = null;
    this.resumed = false;
    const hold = holdMsFor(ctx);
    if (hold > 0 && this.scorer.score(merged.text, ctx) < endThreshold(ctx)) {
      this.held = merged;
      return { holdMs: hold };
    }
    return { emit: merged };
  }

  /** The child started speaking again: a held fragment waits for the next final instead of the timer. */
  onSpeechStart(): boolean {
    if (!this.held) return false;
    this.resumed = true;
    return true;
  }

  /** The hold window ended: the held fragment goes as it was (null when the child resumed or nothing is held). */
  flush(force = false): TurnFinal | null {
    if (!this.held || (this.resumed && !force)) return null;
    const out = this.held;
    this.held = null;
    this.resumed = false;
    return out;
  }

  get holding(): boolean {
    return this.held !== null;
  }

  /**
   * The link is closing (or the resume ceiling fired): whatever is held goes NOW, resumed or not. A held fragment is never
   * dropped: it can be a disclosure (W2-E fixer).
   */
  drain(): TurnFinal | null {
    return this.flush(true);
  }
}

/** Extra wait after the child resumed over a held fragment before it is force-sent (no further final ever arrived). */
export const RESUME_CEILING_EXTRA_MS = 2000;
/** The ceiling for a resumed hold: the context's hold window plus RESUME_CEILING_EXTRA_MS. */
export const resumeCeilingMs = (ctx: TurnContext): number => holdMsFor(ctx) + RESUME_CEILING_EXTRA_MS;

/** Two fragments of one turn as one: the words joined, the first onset, the weaker ASR confidence. */
export function mergeFinals(a: TurnFinal, b: TurnFinal): TurnFinal {
  const conf = [a.asrConfidence, b.asrConfidence].filter((x): x is number => typeof x === "number");
  return {
    ...b,
    text: `${a.text.trim()} ${b.text.trim()}`.trim(),
    startedAt: Math.min(a.startedAt, b.startedAt),
    ...(conf.length ? { asrConfidence: Math.min(...conf) } : {}),
  };
}
