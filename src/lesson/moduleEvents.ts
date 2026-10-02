// Buffers module events on their way to the Director. Taps and drags stream in fast and are not worth a
// Director call of their own: they ride with the next call, which is the child's next turn or a milestone.
// Milestones (the child reached the goal, is stuck, or committed an answer) change what the teacher should
// do next, so they call the Director at once.
//
// There is deliberately no timer flush. A call carrying only plain interactions reached the server as an
// empty child reply, which was graded "unclear" and walked the lesson plan: measured, 4 interaction-only
// calls walked the whole teach phase, each with a new spoken reply. An engine error is not a milestone
// either: it is reported to the Director with the next call.
import type { ModuleEvent } from "../../shared/contracts.ts";

/** Event types that call the Director at once instead of waiting for the next child turn. */
export const MILESTONE_TYPES: ReadonlySet<ModuleEvent["type"]> = new Set(["goal_met", "stuck", "answer"]);
/** Cap on buffered events; the oldest non-milestone events are dropped first, and every drop is counted. */
export const MAX_BUFFERED = 40;

/** What one Director call carries: the events, and how many were dropped at the cap (truncation is never silent). */
export interface ModuleBatch {
  events: ModuleEvent[];
  dropped: number;
}

export class ModuleEventBuffer {
  private events: ModuleEvent[] = [];
  private dropped = 0;
  private readonly onMilestone: () => void;

  /** onMilestone is a request to call the Director; that call drain()s the buffer when it is actually made. */
  constructor(onMilestone: () => void) {
    this.onMilestone = onMilestone;
  }

  get size(): number {
    return this.events.length;
  }

  add(ev: ModuleEvent): void {
    this.events.push(ev);
    this.trim();
    if (MILESTONE_TYPES.has(ev.type)) this.onMilestone();
  }

  /** Take everything buffered. */
  drain(): ModuleBatch {
    const out = { events: this.events, dropped: this.dropped };
    this.events = [];
    this.dropped = 0;
    return out;
  }

  /** Put a batch back in front of newer events (its Director call failed), so it rides with the next call. */
  restore(batch: ModuleBatch): void {
    this.events = [...batch.events, ...this.events];
    this.dropped += batch.dropped;
    this.trim();
  }

  dispose(): void {
    this.events = [];
    this.dropped = 0;
  }

  private trim(): void {
    while (this.events.length > MAX_BUFFERED) {
      const i = this.events.findIndex((e) => !MILESTONE_TYPES.has(e.type));
      this.events.splice(i >= 0 ? i : 0, 1);
      this.dropped++;
    }
  }
}
