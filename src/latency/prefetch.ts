// Round 2, stream latency: the device half of the turn prefetch (server/latency/routes.js POST /api/lesson/turn-prefetch).
// The live transcription's deltas spell the child's words while they speak; on gpt-live-transcribe the joined deltas are
// complete ~0.3 s before the server VAD's speech_stopped and ~0.8 s before the "completed" transcript the turn waits for.
// This sends that stable partial as soon as the child has gone quiet (the device energy VAD's offset) and the deltas have
// stopped changing for DEBOUNCE_MS, so the server can start classify / the note / the speculative replies on it. The turn
// itself is unchanged: it still goes on the final transcript, and the server adopts the prefetched work only when the
// final words are byte-identical (else it does its own; a mismatch costs tokens, never correctness).
// Pure apart from the injected timer and post: tested in Node (tests/latency-prefetch.test.mjs).

export interface PrefetchBody {
  lessonId: string;
  text: string;
  teacherInterrupted?: boolean;
}

export interface TurnPrefetcherOptions {
  lessonId: string;
  /** Fire-and-forget POST; defaults to fetch("/api/lesson/turn-prefetch"). Errors are swallowed. */
  post?: (body: PrefetchBody) => Promise<unknown>;
  /** Quiet time after the last delta before the text counts as stable (ms). */
  debounceMs?: number;
  /** Sends per transcription item (a child who pauses mid-thought re-sends as the words grow). */
  maxPerItem?: number;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (t: unknown) => void;
  /** TAXILA kill switch: false = never send (the link then behaves exactly as before). */
  enabled?: boolean;
  /** Round 3 (relational-human): told the words each time a prefetch is sent (the AckClient asks on the same words). */
  onSend?: (body: PrefetchBody) => void;
}

export const DEBOUNCE_MS = 250;
export const MAX_PER_ITEM = 3;
export const PREFETCH_KEY = "tx.flag.latency.prefetch";

/** `?prefetch=1|0` (persisted) or localStorage "tx.flag.latency.prefetch"; else VITE_TURN_PREFETCH (default ON). */
export function prefetchEnabled(): boolean {
  try {
    if (typeof location !== "undefined") {
      const v = new URLSearchParams(location.search).get("prefetch");
      if (v === "1" || v === "0") localStorage.setItem(PREFETCH_KEY, v);
    }
    const s = typeof localStorage !== "undefined" ? localStorage.getItem(PREFETCH_KEY) : null;
    if (s === "1") return true;
    if (s === "0") return false;
  } catch {
    /* storage blocked: the build default */
  }
  return (import.meta as { env?: Record<string, string> }).env?.VITE_TURN_PREFETCH !== "0";
}

const defaultPost = (body: PrefetchBody): Promise<unknown> =>
  fetch("/api/lesson/turn-prefetch", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(body), keepalive: true })
    .then((r) => r.arrayBuffer());

export class TurnPrefetcher {
  private readonly o: Required<Omit<TurnPrefetcherOptions, "post" | "onSend">> & { post: (b: PrefetchBody) => Promise<unknown>; onSend?: (b: PrefetchBody) => void };
  private item = "";
  private text = "";
  private quiet = false;
  private timer: unknown = null;
  private sentText = "";
  private sentCount = 0;
  private interrupted = false;
  /** What was sent, for dev UIs and the tests. */
  readonly sent: PrefetchBody[] = [];

  constructor(opts: TurnPrefetcherOptions) {
    this.o = {
      lessonId: opts.lessonId,
      post: opts.post ?? defaultPost,
      debounceMs: opts.debounceMs ?? DEBOUNCE_MS,
      maxPerItem: opts.maxPerItem ?? MAX_PER_ITEM,
      setTimer: opts.setTimer ?? ((fn, ms) => setTimeout(fn, ms)),
      clearTimer: opts.clearTimer ?? ((t) => clearTimeout(t as ReturnType<typeof setTimeout>)),
      enabled: opts.enabled ?? true,
      onSend: opts.onSend,
    };
  }

  /**
   * Round 3 (relational-human), the duplex end-of-turn hook: the engine's own words at its eager end-of-turn (a
   * `think/prepare` command, src/latency/duplexTurn.ts). Sent at once (no quiet / debounce wait: the engine already judged
   * the words), within the same per-item cap and never the same text twice, so the turn the engine then commits with the
   * SAME words adopts this work (server/latency/perceive.js fingerprint).
   */
  sendNow(itemId: string, text: string): boolean {
    const t = text.trim();
    if (itemId !== this.item) this.reset(itemId);
    this.text = t;
    if (!this.o.enabled || !t || t === this.sentText || this.sentCount >= this.o.maxPerItem) return false;
    this.cancel();
    this.sentText = t;
    this.sentCount++;
    const body: PrefetchBody = { lessonId: this.o.lessonId, text: t, ...(this.interrupted ? { teacherInterrupted: true } : {}) };
    this.sent.push(body);
    try { this.o.onSend?.(body); } catch { /* never breaks the link */ }
    void this.o.post(body).catch(() => {});
    return true;
  }

  /** A transcription delta: `text` is the item's words so far. */
  onPartial(itemId: string, text: string): void {
    if (itemId !== this.item) this.reset(itemId);
    this.text = text.trim();
    this.arm();
  }

  /** The device VAD heard the child stop (its offset edge). */
  onQuiet(): void {
    this.quiet = true;
    this.arm();
  }

  /** The child is speaking again: whatever was pending waits for the next quiet. */
  onSpeech(): void {
    this.quiet = false;
    this.cancel();
  }

  /** The child cut her off on this turn (the turn will carry teacherInterrupted; the plan reads it). */
  setInterrupted(v: boolean): void {
    this.interrupted = v;
  }

  /** The item's final transcript arrived (or it failed): the turn takes over, nothing more is sent for it. */
  onFinal(): void {
    this.cancel();
    this.item = "";
    this.text = "";
    this.sentText = "";
    this.sentCount = 0;
    this.quiet = false;
    this.interrupted = false;
  }

  private reset(itemId: string): void {
    this.cancel();
    this.item = itemId;
    this.text = "";
    this.sentText = "";
    this.sentCount = 0;
  }

  private cancel(): void {
    if (this.timer !== null) this.o.clearTimer(this.timer);
    this.timer = null;
  }

  private arm(): void {
    this.cancel();
    if (!this.o.enabled || !this.quiet || !this.text || this.text === this.sentText || this.sentCount >= this.o.maxPerItem) return;
    this.timer = this.o.setTimer(() => {
      this.timer = null;
      if (!this.quiet || !this.text || this.text === this.sentText || this.sentCount >= this.o.maxPerItem) return;
      this.sentText = this.text;
      this.sentCount++;
      const body: PrefetchBody = { lessonId: this.o.lessonId, text: this.text, ...(this.interrupted ? { teacherInterrupted: true } : {}) };
      this.sent.push(body);
      try { this.o.onSend?.(body); } catch { /* never breaks the link */ }
      void this.o.post(body).catch(() => {});
    }, this.o.debounceMs);
  }
}
