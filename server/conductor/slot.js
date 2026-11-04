// The lesson slot → the LessonBrief a lesson start applies (CONDUCTOR.md §4.5 LessonBrief + LessonBriefAdd; round 7 F
// learning-conductor-day-plan). The planner writes day_plan; until now nothing read its lesson slot at a start (the start
// handed the Director the home's plan summary, which has no slots, so director/session/prior.js planPrior always saw no
// lesson). This module is the one reader:
//   todaysPlan(childId)          today's adopted day plan (latest version), or null
//   lessonBriefOf(plan, ...)     PURE: the brief cut from its live_lesson slot, or null
// What a brief never carries (V26, V30): θ, η, a gap number, a placement level, or anything about a sibling. The
// foundation share is a lesson proportion, not a level.
import { BAND } from "./config.js";
import { addMin, learningDay, localTime, zonedToUtc } from "./clock.js";

export const OPENERS = Object.freeze(["standard_retrieval", "reanchor_light", "goal_review", "thread_return", "callback"]);
/** soloRounds base per band (R7 is not built: base only). */
const SOLO_BASE = Object.freeze({ B1: 1, B2: 1, B3: 2, B4: 2 });

/**
 * PURE. The LessonBrief for a lesson starting `at` from today's plan.
 * @param {any} plan  day_plan.plan (planner.js planDay's plan, as decide adopted it)
 * @param {{ version?: number, lessonId?: string, at: Date, tz: string, day: string }} x
 * @returns {null | {
 *   lessonId: string|null, slotId: string, planVersion: number, band: string, subject: string|null, targetMin: number,
 *   segments: Array<{ kind: string, minutes: number, lane: string }>, wrapAt: string, hardStopAt: string,
 *   holdNewTopics: boolean, reviewItemIds: string[], promisesDue: string[], opener: string, successFirst: boolean,
 *   soloRounds: number, newSkillBudget: 0|1|2, prereqCheck?: { skillId: string, forTopicId: string, prereqTopicId: string },
 *   foundationShare?: number, testChapters?: number[], why: Array<{ code: string, ref: string }>, adaptTrace: string[] }}
 */
export function lessonBriefOf(plan, { version = 1, lessonId = null, at, tz, day }) {
  const slot = plan?.slots?.find((s) => s.kind === "live_lesson");
  if (!slot || !plan.band || !BAND[plan.band]) return null;
  const targetMin = Math.max(1, Number(slot.targetMin) || 0);
  // wrap at the planned length from the start; hard stop at the slot's window end (bedtime − 60 at the latest, V2)
  const startHM = localTime(at, tz);
  const wrapHM = addMin(startHM, targetMin);
  const endHM = slot.window?.[1] ?? wrapHM;
  const toIso = (hm) => zonedToUtc(day, hm, tz).toISOString();
  // a wrap past the window end is pulled back to it (the Director wraps at the earlier, at a natural stop)
  const wrapIso = toIso(wrapHM), hardIso = toIso(endHM);
  const nb = slot.pace?.newSkillBudget;
  return {
    lessonId, slotId: slot.id, planVersion: version, band: plan.band, subject: slot.subject ?? null, targetMin,
    segments: (slot.segments ?? []).map((g) => ({ kind: g.kind, minutes: g.minutes, lane: g.laneWanted })),
    wrapAt: wrapIso < hardIso ? wrapIso : hardIso, hardStopAt: hardIso,
    holdNewTopics: nb === 0,
    reviewItemIds: [...(slot.reviewItemIds ?? [])],
    promisesDue: [...(slot.promisesDue ?? [])],
    opener: OPENERS.includes(slot.opener) ? slot.opener : "standard_retrieval",
    successFirst: !!slot.successFirst,
    soloRounds: Number.isInteger(slot.soloRounds) ? slot.soloRounds : SOLO_BASE[plan.band],
    newSkillBudget: [0, 1, 2].includes(nb) ? nb : 1,
    ...(slot.prereqCheck ? { prereqCheck: { ...slot.prereqCheck } } : {}),
    ...(typeof slot.foundationShare === "number" ? { foundationShare: slot.foundationShare } : {}),
    ...(slot.testChapters ? { testChapters: [...slot.testChapters] } : {}),
    why: (slot.why ?? []).map((w) => ({ code: w.code, ref: w.ref })),
    adaptTrace: [...new Set((plan.adapt?.rules ?? []).map((r) => r.rule))].sort(),
  };
}

/**
 * Today's adopted day plan for a child (latest version), with the day and tz it was read for. null when the child has
 * none (no Conductor yet, a rest day never adopted, or the table is missing): the start then runs as before.
 * @param {string} childId @param {{ now?: Date, q?: (t: string, p?: unknown[]) => Promise<any[]> }} [o]
 */
export async function todaysPlan(childId, { now = new Date(), q } = {}) {
  try {
    const query = q ?? (await import("../db.js")).q;
    const [r] = await query("select tz from child_routine where child_id = $1", [childId]).catch(() => []);
    const tz = r?.tz || "Asia/Kolkata";
    const day = learningDay(now, tz);
    const [row] = await query("select version, plan from day_plan where child_id = $1 and day = $2 order by version desc limit 1", [childId, day]);
    return row?.plan ? { plan: row.plan, version: Number(row.version) || 1, day, tz } : null;
  } catch { return null; }
}

/** today's plan → its brief for a lesson starting now (null when there is no lesson slot). */
export async function lessonBriefFor(childId, { now = new Date(), lessonId = null, q } = {}) {
  const t = await todaysPlan(childId, { now, q });
  return t ? { plan: t.plan, brief: lessonBriefOf(t.plan, { version: t.version, lessonId, at: now, tz: t.tz, day: t.day }) } : null;
}
