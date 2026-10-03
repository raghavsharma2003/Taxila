// Goal / answer / stuck bookkeeping shared by every engine. One tracker per goal key: when the goal changes
// (a set_param with a new target), progress starts over, so an old goal's changes never fire a new goal's
// stuck and a met goal is never reported twice. All rules are counts — deterministic, no timers.
import { useMemo } from "react";
import type { EngineApi } from "../engine.ts";

export interface TrackerOptions {
  /** Changes without reaching the goal before `stuck("many_changes_without_goal")`. */
  stuckAfterChanges?: number;
  /** Wrong committed answers before `stuck("repeated_wrong")`. */
  stuckAfterWrong?: number;
}

export interface Tracker {
  /** A child action: forwarded as an interaction and counted toward the change-based stuck rule. */
  change(name: string, data?: Record<string, unknown>): void;
  /** A plain interaction that does not count as an attempt (reveal views, play, toggles of view). */
  note(name: string, data?: Record<string, unknown>): void;
  /**
   * The child committed an answer. `correct` comes from the engine's own state and params. A right answer
   * fires goal_met; after that, further commits are play (`retap`), never second answers to the same item.
   */
  answer(value: Record<string, unknown>, correct: boolean, goal: string): void;
  /** The goal was reached without a commit step (exploratory goals). */
  goal(goal: string): void;
  readonly done: boolean;
  readonly wrong: number;
  readonly attempts: number;
}

export function makeTracker(api: EngineApi, opts: TrackerOptions = {}): Tracker {
  const changesN = opts.stuckAfterChanges ?? 15;
  const wrongN = opts.stuckAfterWrong ?? 2;
  let changes = 0;
  let wrong = 0;
  let attempts = 0;
  let goalSent = false;
  let stuckSent = false;
  const stuck = (reason: string) => {
    if (stuckSent || goalSent) return;
    stuckSent = true;
    api.stuck(reason);
  };
  return {
    change(name, data = {}) {
      api.interaction(name, data);
      if (goalSent) return;
      if (++changes >= changesN) stuck("many_changes_without_goal");
    },
    note(name, data = {}) {
      api.interaction(name, data);
    },
    answer(value, correct, goal) {
      if (goalSent) {
        api.interaction("retap", { value });
        return;
      }
      attempts++;
      api.answer({ ...value, attempt: attempts, changes }, correct);
      if (correct) {
        goalSent = true;
        api.goalMet(goal);
      } else if (++wrong >= wrongN) stuck("repeated_wrong");
    },
    goal(goal) {
      if (goalSent) return;
      goalSent = true;
      api.goalMet(goal);
    },
    get done() {
      return goalSent;
    },
    get wrong() {
      return wrong;
    },
    get attempts() {
      return attempts;
    },
  };
}

/** A tracker that lives as long as `key` does. */
export function useTracker(api: EngineApi, key: string, opts?: TrackerOptions): Tracker {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => makeTracker(api, opts), [api, key]);
}
