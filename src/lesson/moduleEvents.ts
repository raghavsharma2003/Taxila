// Debounces module interaction events on their way to the Director. Taps and drags stream in fast; the
// Director only needs them batched (with the next child turn, or every few seconds), except milestones,
// which change what the teacher should do next and go immediately.
import type { ModuleEvent } from "../../shared/contracts.ts";

/** Event types that call the Director at once instead of waiting for the batch. */
export const MILESTONE_TYPES: ReadonlySet<ModuleEvent["type"]> = new Set(["goal_met", "stuck", "answer", "error"]);
export const FLUSH_INTERVAL_MS = 3000;
/** Cap on buffered events; the oldest non-milestone events are dropped first. */
export const MAX_BUFFERED = 40;

export interface Timers {
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (handle: unknown) => void;
}

export const realTimers: Timers = {
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
};

export class ModuleEventBuffer {
  private events: ModuleEvent[] = [];
  private timer: unknown = null;
  private readonly onFlush: (milestone: boolean) => void;
  private readonly timers: Timers;
  private readonly intervalMs: number;

  /** onFlush is a request to call the Director; it should drain() when the call is actually made. */
  constructor(onFlush: (milestone: boolean) => void, opts: { timers?: Timers; intervalMs?: number } = {}) {
    this.onFlush = onFlush;
    this.timers = opts.timers ?? realTimers;
    this.intervalMs = opts.intervalMs ?? FLUSH_INTERVAL_MS;
  }

  get size(): number {
    return this.events.length;
  }

  add(ev: ModuleEvent): void {
    this.events.push(ev);
    if (this.events.length > MAX_BUFFERED) {
      const drop = this.events.findIndex((e) => !MILESTONE_TYPES.has(e.type));
      this.events.splice(drop >= 0 ? drop : 0, 1);
    }
    if (MILESTONE_TYPES.has(ev.type)) {
      this.cancelTimer();
      this.onFlush(true);
    } else if (this.timer === null) {
      this.timer = this.timers.setTimeout(() => {
        this.timer = null;
        if (this.events.length) this.onFlush(false);
      }, this.intervalMs);
    }
  }

  /** Take everything buffered (and stop the pending batch timer). */
  drain(): ModuleEvent[] {
    this.cancelTimer();
    const out = this.events;
    this.events = [];
    return out;
  }

  dispose(): void {
    this.cancelTimer();
    this.events = [];
  }

  private cancelTimer(): void {
    if (this.timer !== null) this.timers.clearTimeout(this.timer);
    this.timer = null;
  }
}
