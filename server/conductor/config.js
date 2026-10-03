// Conductor configuration as data. Values tagged [U] are unmeasured design defaults (CONDUCTOR.md tags);
// change them here, never inline in decide/planDay, so cfgDigest (PlannerInputs.build) moves with them.
import { jcs, sha256hex } from "./ids.js";
import { JOB_BUDGET as REPORT_BUDGET } from "../reports/config.js";

export const STATE_V = 1;
export const PLANNER_V = "code-planner@1";

/** Class level → band (§4.1): B1 6-7 y (Class 1-2), B2 8-9 (3-4), B3 10-12 (5-7), B4 13-15 (8-9). */
export const bandFor = (classLevel) => (classLevel <= 2 ? "B1" : classLevel <= 4 ? "B2" : classLevel <= 7 ? "B3" : "B4");

/**
 * §4.3 one sitting per day, per band. Segments with the lane WANTED (granted at lesson start, I-R7).
 * `min` marks the minimum segment set (a heavy-homework / late / short-cap day keeps only these).
 */
export const BAND = {
  B1: { capMin: 30, hwSubCapMin: 10, sessionMin: 20, allowedTo: "20:00", bedtime: "21:00",
    segments: [["retrieve", 3, "tap", 1], ["teach", 5, "realtime", 1], ["play", 5, "tap", 0], ["offline", 3, "tap", 0], ["teachback", 3, "realtime", 1], ["wrap", 1, "realtime", 1]] },
  B2: { capMin: 40, hwSubCapMin: 15, sessionMin: 25, allowedTo: "20:30", bedtime: "21:30",
    segments: [["retrieve", 4, "tap", 1], ["teach", 7, "realtime", 1], ["practice", 7, "tap", 0], ["break", 2, "tap", 0], ["teachback", 4, "realtime", 1], ["wrap", 1, "realtime", 1]] },
  B3: { capMin: 60, hwSubCapMin: 25, sessionMin: 35, allowedTo: "21:00", bedtime: "22:00",
    segments: [["retrieve", 4, "tap", 1], ["teach", 10, "realtime", 1], ["practice", 10, "tap", 0], ["break", 3, "tap", 0], ["transfer", 6, "realtime", 1], ["wrap", 2, "realtime", 1]] },
  B4: { capMin: 75, hwSubCapMin: 30, sessionMin: 45, allowedTo: "21:30", bedtime: "22:30",
    segments: [["retrieve", 5, "tap", 1], ["teach", 12, "realtime", 1], ["practice", 12, "tap", 0], ["break", 3, "tap", 0], ["transfer", 10, "realtime", 1], ["wrap", 3, "realtime", 1]] },
};

/** Routine defaults when the parent has set none [U]. Bedtime per band above. */
export const ROUTINE_DEFAULT = { tz: "Asia/Kolkata", wakeTime: "06:30", schoolStart: "08:00", schoolEnd: "14:00", recoveryMin: 60 };
/** Parent-controls defaults, mirroring server/routes/parent.js defaultControls (§6.9). */
export const LIMITS_DEFAULT = (classLevel) => ({ dailyMinutes: classLevel <= 2 ? 20 : classLevel <= 5 ? 30 : 45, allowedFrom: "07:00", allowedTo: "20:30", restDays: [] });

/**
 * Voice budget placeholder (D-PRICE is an owner decision, §10.5). M0 is ≤ 30 owner-supervised children, so
 * the placeholder is generous and the governor's budget.threshold events are what narrow lanes [U].
 */
export const TIER = { m0_supervised: { voiceSecMonth: { realtime: 600 * 60, realtime_mini: 600 * 60, cascade: 1200 * 60 } } };

/** Plan aims at ≤ 70% of the cap (§4.3); a burst is 3-10 min (§4.3). */
export const PLAN = { capShare: 0.7, burstMinMin: 3, burstMaxMin: 10, replanDebounceMin: 5, resumeWindowMin: 15, dormantDays: 14,
  closesRing: 16, closesMaxDays: 14, promisesMax: 10, overridesKeepDays: 30, reanchorGapDays: 7 };

/** Wakeup windows (local time) + jitter (§3.9). */
export const WAKE = { dayStart: { at: "05:00", windowSec: 3600 }, night: { at: "02:00", windowSec: 3600 } };

/**
 * Job kinds the Conductor may enqueue (§8.2). `purpose` = the consent a job needs (consentGuard; orch R2.6).
 * `allowedIn` = the non-free modes the job may still be queued in (§3.2 background-jobs row).
 */
export const JOB_KINDS = {
  "memory.consolidate": { lane: "fast", priority: 1, purpose: "memory", budgetMicroUsd: 20_000, maxAttempts: 5, leaseSec: 60, allowedIn: ["paused", "in_lesson"] },
  "kt.refold": { lane: "fast", priority: 1, purpose: "learning_profile", budgetMicroUsd: 0, maxAttempts: 5, leaseSec: 60, allowedIn: ["in_lesson"], notBeforeLessonEnd: true },
  // End-of-day parent reports (server/reports/jobs.js; enqueued by decide.js foldNight). report.daily:{child}:{day} is the
  // pull-only daily note (X11); parent.letter:{child}:{isoWeek} the weekly letter body (X8; the Notifier send is M1).
  // budgetMicroUsd caps the Lane B writer (taxila-brain ordering only); over budget the report ships Lane A order.
  // Not allowed in safety_hold (the protocol decides what reaches the family); allowed while paused or in a lesson.
  "report.daily": { lane: "fast", priority: 3, purpose: "core_tutoring", budgetMicroUsd: REPORT_BUDGET.daily, maxAttempts: 4, leaseSec: 120, allowedIn: ["paused", "in_lesson"] },
  "parent.letter": { lane: "fast", priority: 2, purpose: "core_tutoring", budgetMicroUsd: REPORT_BUDGET.weekly, maxAttempts: 4, leaseSec: 120, allowedIn: ["paused", "in_lesson"] },
};
/** A report job runs this long after its learning day closes (04:00 local), so the window's evidence is in [U]. */
export const REPORT_GRACE_MIN = 10;
/** Test-only kinds registered at runtime (tests/conductor-*.test.mjs). */
export function registerJobKind(kind, spec) { JOB_KINDS[kind] = spec; }

/** Event types whose handling is an authority class (§3.6): fail-safe on poison. */
export const authorityClass = (ev) =>
  ev.type.startsWith("safety.") || ev.type === "parent.consent_changed" || ev.type === "parent.pause"
  || (ev.type === "parent.setting_changed" && ev.lowers === true);

export const cfgDigest = () => sha256hex(jcs({ BAND, ROUTINE_DEFAULT, PLAN, WAKE, TIER })).slice(0, 16);
