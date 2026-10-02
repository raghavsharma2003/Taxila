// ConductorState (CONDUCTOR.md §3.1), the M0 subset. Mastery, minutes used and notification counts are NOT
// in state by design: they are read through the recorded view (view.js) at decision points.
import { BAND, LIMITS_DEFAULT, ROUTINE_DEFAULT, STATE_V, bandFor } from "./config.js";
import { PURPOSES } from "./events.js";

/**
 * @typedef {'free'|'in_lesson'|'paused'|'safety_hold'} Mode
 * @typedef {{ day: string, version: number, source: 'code'|'llm', inputsHash: string, mode: string,
 *   slots: any[], shownSlotIds: string[], startedSlotIds: string[], doneSlotIds: string[] }} PlanRef
 * @typedef {{ day: string, localHour: number, vibeClose: 'fine'|'strained'|'tired', endedBy: string, minutes: number, plannedMin: number }} CloseLite
 * @typedef {{
 *   childId: string, stateV: number, tz: string, learningDay: string|null, band: string, classLevel: number, tier: string,
 *   mode: Mode, modeSince: string, hold?: { incidentId: string, level: 'high'|'critical' }, pauseUntil?: string, pendingPause?: string,
 *   lesson?: { lessonId: string, since: string, slotId?: string },
 *   plan?: PlanRef, resumable?: { lessonId: string, until: string },
 *   limits: import('./clock.js').ParentLimits, routine: import('./clock.js').RoutineFacts,
 *   school: { dayOverrides: Record<string,string>, testWindows: Array<{ subject: string, from: string, to: string, chapters: string[] }> },
 *   promises: Array<{ id: string, kind: string, ref: string, by: string }>,
 *   pending: { replanAfter?: string, replanCause?: string, jobs: Record<string, { kind: string, idem: string }> },
 *   consent: Record<string, boolean>, budget: { low: boolean, since?: string },
 *   counters: { lastActiveDay?: string, activeDays: string[], lastOpenDay?: string },
 *   adapt: { foldedDay?: string, closes: CloseLite[], successFirstNext: boolean },
 *   household?: null,
 *   failSafe?: { type: string, error: string },   // sticky (§3.6): set by decideOrFailSafe, cleared only by ops.fail_safe_cleared
 * }} ConductorState
 */

/**
 * The first state of a child's actor, from facts read once at actor creation (step.js ensureActor). Later
 * changes reach the actor only as events (parent.setting_changed, parent.consent_changed, …).
 * @returns {ConductorState}
 */
export function initialState({ childId, classLevel, controls, routine, consent, now }) {
  const band = bandFor(classLevel);
  const lim = LIMITS_DEFAULT(classLevel);
  const b = BAND[band];
  return {
    childId, stateV: STATE_V, tz: routine?.tz || ROUTINE_DEFAULT.tz, learningDay: null, band, classLevel, tier: "m0_supervised",
    mode: "free", modeSince: now.toISOString(),
    limits: {
      dailyMinutes: controls?.dailyMinutes ?? lim.dailyMinutes,
      allowedFrom: controls?.hoursStart ?? lim.allowedFrom,
      allowedTo: controls?.hoursEnd ?? lim.allowedTo,
      restDays: [],
    },
    routine: {
      tz: routine?.tz || ROUTINE_DEFAULT.tz,
      wakeTime: routine?.wakeTime || ROUTINE_DEFAULT.wakeTime,
      schoolStart: routine?.schoolStart || ROUTINE_DEFAULT.schoolStart,
      schoolEnd: routine?.schoolEnd || ROUTINE_DEFAULT.schoolEnd,
      recoveryMin: routine?.recoveryMin ?? ROUTINE_DEFAULT.recoveryMin,
      bedtime: routine?.bedtime || b.bedtime,
      ...(routine?.anchor ? { anchor: routine.anchor } : {}),
    },
    school: { dayOverrides: {}, testWindows: [] },
    promises: [],
    pending: { jobs: {} },
    consent: Object.fromEntries(PURPOSES.map((p) => [p, !!consent?.[p]])),
    budget: { low: false },
    counters: { activeDays: [] },
    adapt: { closes: [], successFirstNext: false },
  };
}

/** Pure chain of state migrations (X16: no rainbow reducer versions). v1 is the first. */
export function upgradeState(state, fromV) {
  let s = state;
  if (fromV > 1 || fromV < 1) throw new Error(`upgradeState: no migration from stateV ${fromV}`);
  return s;
}
