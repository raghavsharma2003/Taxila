// The floor: whose turn it is (PRODUCT-DESIGN-V2 §4.1). Exactly one of eight states holds at a time. It is
// reduced from the runtime's link events plus the Director's ui.handover / ui.cues and the child's local commits,
// never set from a literal and never from a timer alone (the only timed edge is the spec's heard → thinking hold).
//
//   idle → speaking (teacher_audio_start) → showing (ui.cues demo/point) → yielding (< 250 ms left, handover ≠ chain)
//   → your_turn (teacher_audio_end with a pending hand-over) → listening (child_speech_start / PTT press)
//   → heard (child_speech_end, typed send, tile tap, module answer, + the outbox write) → thinking (+heardMs or
//   response_start) → speaking (teacher_audio_start). Barge-in: speaking → listening. Chain: speaking → idle.
//
// YOUR TURN requires a pending hand-over (handover ∈ {answer, choice, judge, ready, finish}); without one the
// honest state is idle or thinking (§4.1 "the bug fix", ds-status-carriers).
// LEGACY MODE: until the Director sends ui.handover at all (shared/contracts.ts has no such field yet), a turn with
// no handover is treated as "answer", exactly as the old statusOf did. The first turn that carries a handover
// switches the lesson to strict mode for good, where an absent handover means no YOUR TURN.
import type { LinkEvent } from "./link.ts";
import { Store } from "./store.ts";
import { realTimers, type Timers } from "./timers.ts";
import { setTurnContext } from "./turnModel.ts";
// W2 seam commit (BUILD-PLAN §4): the fixed safety openings (W2-I) are reached through the floor, which owns the SAFETY
// state's client side. Re-exported so the runtime and the Desk import them from one place.
export { safetyOpening, type SafetyLangMode, type SafetyOpening } from "./safetyStrings.ts";

export type Floor = "idle" | "speaking" | "showing" | "yielding" | "your_turn" | "listening" | "heard" | "thinking";
export type Handover = "chain" | "answer" | "choice" | "judge" | "ready" | "finish";
export const HANDOVERS: readonly Handover[] = ["chain", "answer", "choice", "judge", "ready", "finish"];
/** The hand-overs that open a YOUR TURN. */
export const OPENS_TURN: ReadonlySet<Handover> = new Set(["answer", "choice", "judge", "ready", "finish"]);

export interface FloorState {
  floor: Floor;
  /** The hand-over of the teacher turn in flight / last heard (from ui.handover; undefined = none sent). */
  handover: Handover | undefined;
  /** A hand-over is open: the child holds the floor (or will, when her audio ends). */
  pending: boolean;
  /** No turn has carried ui.handover yet: an absent handover means "answer" (the old behaviour). */
  legacy: boolean;
  /** A demonstration cue is active (→ showing while she talks). */
  cue: boolean;
  /** Monotonic ms when the current floor began, and when the last child commit landed (heard). */
  since: number;
  heardAt: number | null;
  /** Bumped on every transition; the signals layer keys "one transition, all carriers" on it. */
  seq: number;
}

export type FloorInput =
  | Pick<LinkEvent & { type: "teacher_audio_start" }, "type">
  | Pick<LinkEvent & { type: "teacher_audio_end" }, "type">
  | { type: "teacher_audio_ending"; remainingMs: number }
  | { type: "child_speech_start" }
  | { type: "child_speech_end" }
  | { type: "child_silent" }
  | { type: "response_start" }
  /** A local commit: typed send, tile tap, number-pad send, module answer (after the outbox write). */
  | { type: "commit" }
  /** The Director's ui for the turn about to be spoken (arrives before her audio on every lane). */
  | { type: "ui"; handover?: unknown; cues?: { program?: string } | null }
  /** Time passes (heard → thinking after heardMs). */
  | { type: "tick" }
  /** No reply is coming for the wait (failed turn, watchdog): the open question stays open. */
  | { type: "settle" }
  | { type: "reset" };

export interface FloorTiming {
  /** The receipt hold (§4.9 heardMs): 600 Young / 400 Older. */
  heardMs: number;
  /** The yielding window (§4.9 yieldMs). */
  yieldMs: number;
}
export const FLOOR_TIMING = { young: { heardMs: 600, yieldMs: 250 }, older: { heardMs: 400, yieldMs: 250 } } as const;

export const INITIAL_FLOOR: FloorState = { floor: "idle", handover: undefined, pending: false, legacy: true, cue: false, since: 0, heardAt: null, seq: 0 };

const isHandover = (v: unknown): v is Handover => typeof v === "string" && (HANDOVERS as readonly string[]).includes(v);

/** Does the current teacher turn hand the floor over when it ends? */
export function opensTurn(s: Pick<FloorState, "handover" | "legacy">): boolean {
  if (s.handover) return OPENS_TURN.has(s.handover);
  return s.legacy; // legacy: no handover field yet → the old "nothing pending = your turn"
}

function go(s: FloorState, floor: Floor, now: number, patch: Partial<FloorState> = {}): FloorState {
  if (floor === s.floor) return { ...s, ...patch };
  return { ...s, ...patch, floor, since: now, seq: s.seq + 1 };
}

/** Pure reducer. `now` is a monotonic ms clock (performance.now in the app, a fake clock in tests). */
export function reduceFloor(s: FloorState, e: FloorInput, now: number, timing: FloorTiming): FloorState {
  switch (e.type) {
    case "ui": {
      const patch: Partial<FloorState> = {};
      if (isHandover(e.handover)) {
        patch.handover = e.handover;
        patch.legacy = false;
      } else if (!s.legacy) {
        patch.handover = undefined; // strict mode: a turn without a handover hands nothing over
      }
      const cue = !!e.cues && (e.cues.program === "demo" || e.cues.program === "point");
      patch.cue = cue;
      const next = { ...s, ...patch };
      if (s.floor === "speaking" && cue) return go(next, "showing", now);
      if (s.floor === "showing" && !cue) return go(next, "speaking", now);
      return next;
    }
    case "teacher_audio_start":
      // Her voice: a new teacher turn holds the floor (from idle, thinking, heard, or a resumed pause).
      return go(s, s.cue ? "showing" : "speaking", now, { pending: false });
    case "teacher_audio_ending":
      if ((s.floor === "speaking" || s.floor === "showing") && e.remainingMs <= timing.yieldMs && opensTurn(s)) return go(s, "yielding", now);
      return s;
    case "teacher_audio_end":
      if (s.floor === "speaking" || s.floor === "showing" || s.floor === "yielding") {
        return opensTurn(s) ? go(s, "your_turn", now, { pending: true }) : go(s, "idle", now, { pending: false });
      }
      return s;
    case "child_speech_start":
      // your_turn → listening; speaking/showing/yielding → listening is a barge-in (she stops).
      if (s.floor === "listening") return s;
      return go(s, "listening", now);
    case "child_speech_end":
      if (s.floor === "listening") return go(s, "heard", now, { pending: false, heardAt: now });
      return s;
    case "child_silent":
      // An accidental tap with no audio: no reply is coming; the open question is still open.
      if (s.floor === "listening" || s.floor === "heard") return go(s, s.pending || opensTurn(s) ? "your_turn" : "idle", now, { pending: s.pending || opensTurn(s) });
      return s;
    case "commit":
      // A typed send, tile tap or module answer: the receipt, from whatever floor the child acted in.
      return go(s, "heard", now, { pending: false, heardAt: now });
    case "response_start":
      if (s.floor === "heard") return go(s, "thinking", now);
      return s;
    case "tick":
      if (s.floor === "heard" && s.heardAt !== null && now - s.heardAt >= timing.heardMs) return go(s, "thinking", now);
      return s;
    case "settle":
      if (s.floor === "thinking" || s.floor === "heard") {
        // The question the child was answering stays open (her last turn handed it over); otherwise nobody holds it.
        return opensTurn(s) ? go(s, "your_turn", now, { pending: true }) : go(s, "idle", now);
      }
      return s;
    case "reset":
      return go(s, "idle", now, { pending: false, cue: false, heardAt: null });
  }
}

// ───────────── controller: the runtime-facing wrapper (non-pure: subscribes, schedules the heard hold) ─────────────

export interface FloorSource {
  /** Every link event, in order, plus runtime signals (see LessonRuntime.events). */
  events: { on(fn: (e: RuntimeSignal) => void): () => void };
}

/** What the runtime re-emits to the floor: the link's events and its own ui/settle signals. */
export type RuntimeSignal = LinkEvent | { type: "ui"; ui: Record<string, unknown> } | { type: "settle" } | { type: "reset" } | { type: "commit" };

export interface FloorTransition { from: Floor; to: Floor; seq: number; at: number }

export class FloorController {
  readonly store: Store<FloorState>;
  private listeners = new Set<(t: FloorTransition) => void>();
  private heardTimer: unknown = null;
  private unsub: (() => void) | null = null;
  private timing: FloorTiming;
  private readonly timers: Timers;
  private readonly clock: () => number;
  /** Is a Director call still in flight? A settle while one is pending is ignored (the answer is not lost). */
  private readonly turnInFlight: () => boolean;

  constructor(
    timing: FloorTiming,
    timers: Timers = realTimers,
    clock: () => number = () => (typeof performance !== "undefined" ? performance.now() : Date.now()),
    turnInFlight: () => boolean = () => false,
  ) {
    this.timing = timing;
    this.timers = timers;
    this.clock = clock;
    this.turnInFlight = turnInFlight;
    this.store = new Store<FloorState>({ ...INITIAL_FLOOR, since: this.clock() });
  }

  get state(): FloorState {
    return this.store.get();
  }

  setTiming(t: FloorTiming): void {
    this.timing = t;
  }

  attach(src: FloorSource): () => void {
    this.unsub?.();
    const off = src.events.on((e) => this.onSignal(e));
    this.unsub = off;
    return () => {
      off();
      if (this.unsub === off) this.unsub = null;
    };
  }

  /** One transition → every carrier (src/lesson/signals.ts subscribes here). Called synchronously. */
  onTransition(fn: (t: FloorTransition) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** The child committed an answer locally (typed, tile, pad, module). Call AFTER the outbox write. */
  commit(): void {
    this.feed({ type: "commit" });
  }

  onSignal(e: RuntimeSignal): void {
    switch (e.type) {
      case "teacher_audio_start":
      case "teacher_audio_end":
      case "child_speech_start":
      case "child_speech_end":
      case "child_silent":
      case "response_start":
      case "reset":
      case "commit":
        return this.feed({ type: e.type });
      case "child_final":
        // A typed or tapped turn arrives as child_final{typed}: the receipt (a spoken final follows speech_end).
        if (e.typed) this.feed({ type: "commit" });
        return;
      case "ui":
        // W2-E L1: the turn's context (beat, answer form, hand-over) sets how long a pause may be a thought, not an end
        // (turnModel.ts; read by the cascade link's fragment merger when turn.predictive is on).
        setTurnContext(e.ui);
        return this.feed({ type: "ui", handover: e.ui.handover, cues: (e.ui.cues as { program?: string } | undefined) ?? null });
      case "settle":
        if (this.turnInFlight()) return;
        return this.feed({ type: "settle" });
      case "connection":
        if (e.state === "reconnecting") this.feed({ type: "reset" });
        return;
      default:
        return;
    }
  }

  feed(e: FloorInput): void {
    const before = this.state;
    const now = this.clock();
    const after = reduceFloor(before, e, now, this.timing);
    if (after === before) return;
    this.store.set(after);
    if (after.floor === "heard" && after.seq !== before.seq) this.armHeard();
    if (after.seq !== before.seq) {
      const t: FloorTransition = { from: before.floor, to: after.floor, seq: after.seq, at: now };
      for (const fn of [...this.listeners]) fn(t);
    }
  }

  private armHeard(): void {
    if (this.heardTimer !== null) this.timers.clearTimeout(this.heardTimer);
    this.heardTimer = this.timers.setTimeout(() => {
      this.heardTimer = null;
      this.feed({ type: "tick" });
    }, this.timing.heardMs);
  }

  dispose(): void {
    this.unsub?.();
    this.unsub = null;
    if (this.heardTimer !== null) this.timers.clearTimeout(this.heardTimer);
    this.heardTimer = null;
    this.listeners.clear();
  }
}
