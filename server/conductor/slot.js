// The lesson slot → the LessonBrief a lesson start applies (CONDUCTOR.md §4.5 LessonBrief + LessonBriefAdd; round 7 F
// learning-conductor-day-plan). The planner writes day_plan; until now nothing read its lesson slot at a start (the start
// handed the Director the home's plan summary, which has no slots, so director/session/prior.js planPrior always saw no
// lesson). This module is the one reader:
//   todaysPlan(childId)          today's adopted day plan (latest version), or null
//   lessonBriefOf(plan, ...)     PURE: the brief cut from its live_lesson slot, or null
// What a brief never carries (V26, V30): θ, η, a gap number, a placement level, or anything about a sibling. The
// foundation share is a lesson proportion, not a level.
import { BAND } from "./config.js";
import { addMin, daysBetween, learningDay, localTime, zonedToUtc } from "./clock.js";
import { lessonDecisions } from "./planner.js";
import { R5 } from "./adapt.js";

export const OPENERS = Object.freeze(["standard_retrieval", "reanchor_light", "goal_review", "thread_return", "callback"]);
/** soloRounds base per band (R7 is not built: base only). */
const SOLO_BASE = Object.freeze({ B1: 1, B2: 1, B3: 2, B4: 2 });

/**
 * PURE. The LessonBrief for a lesson starting `at` from today's plan.
 * The slot's window is a clock gate, so it binds only when the family's limits are on (`limits`, dc-r7 D5): otherwise
 * there is no hard stop and the lesson wraps at its planned length from the start (dc-r14-no-clock-gates; audit LEARN-01:
 * a lesson started after the window's end used to wrap on the child's first answer).
 * @param {any} plan  day_plan.plan (planner.js planDay's plan, as decide adopted it)
 * @param {{ version?: number, lessonId?: string, at: Date, tz: string, day: string, limits?: boolean }} x
 * @returns {null | {
 *   lessonId: string|null, slotId: string, planVersion: number, band: string, subject: string|null, targetMin: number,
 *   segments: Array<{ kind: string, minutes: number, lane: string }>, wrapAt: string, hardStopAt: string,
 *   holdNewTopics: boolean, reviewItemIds: string[], promisesDue: string[], opener: string, successFirst: boolean,
 *   soloRounds: number, newSkillBudget: 0|1|2, prereqCheck?: { skillId: string, forTopicId: string, prereqTopicId: string },
 *   foundationShare?: number, testChapters?: number[], why: Array<{ code: string, ref: string }>, adaptTrace: string[] }}
 */
export function lessonBriefOf(plan, { version = 1, lessonId = null, at, tz, day, limits = false }) {
  const slot = plan?.slots?.find((s) => s.kind === "live_lesson");
  if (!slot || !plan.band || !BAND[plan.band]) return null;
  const targetMin = Math.max(1, Number(slot.targetMin) || 0);
  // wrap at the planned length from the start; with limits on, hard stop at the slot's window end (bedtime − 60 at the
  // latest, V2) and a wrap past it is pulled back to it (the Director wraps at the earlier, at a natural stop)
  const wrapIso = new Date(at.getTime() + targetMin * 60_000).toISOString();
  const hardIso = limits ? zonedToUtc(day, slot.window?.[1] ?? addMin(localTime(at, tz), targetMin), tz).toISOString() : null;
  const nb = slot.pace?.newSkillBudget;
  return {
    lessonId, slotId: slot.id, planVersion: version, band: plan.band, subject: slot.subject ?? null, targetMin,
    segments: (slot.segments ?? []).map((g) => ({ kind: g.kind, minutes: g.minutes, lane: g.laneWanted })),
    wrapAt: hardIso && hardIso < wrapIso ? hardIso : wrapIso, hardStopAt: hardIso,
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
  if (!t) return null;
  const limits = await limitsFor(childId, q);
  return { plan: t.plan, brief: lessonBriefOf(t.plan, { version: t.version, lessonId, at: now, tz: t.tz, day: t.day, limits }) };
}

/** Does the family's daily limit (and so the slot's window) apply to this child? routes/child.js limitsOnFor; off on any error. */
async function limitsFor(childId, q) {
  try {
    const query = q ?? (await import("../db.js")).q;
    const [{ limitsOnFor }, rows] = await Promise.all([import("../routes/child.js"),
      query("select limits_on from child_controls where child_id = $1", [childId]).catch(() => [])]);
    return limitsOnFor({ limitsOn: !!rows?.[0]?.limits_on });
  } catch { return false; }
}

/**
 * The lesson's learner-state decisions at its start when there is NO day plan (TAXILA_CONDUCTOR_PLAN is off, so most
 * starts have none): the same rules and names as the plan's lesson slot (planner.js lessonDecisions), from the same
 * inputs read now: the Conductor's state when the child has one (gap since the last active day, success-first after a
 * bad close, prerequisite checks already run, the parent's test windows), the view's wheel-spinning skills, placement gap
 * and first-week rule, and the lesson's subject. With a plan, use lessonBriefOf: tests/r7-learner-evidence keeps the two
 * equal on the same inputs.
 * @param {string} childId
 * @param {{ now?: Date, subject?: string|null, q?: (t: string, p?: unknown[]) => Promise<any[]>, view?: Record<string, any> }} [o]
 * @returns {Promise<ReturnType<typeof lessonDecisions> | null>} null on any read error (the start then runs as before)
 */
export async function lessonDecisionsAtStart(childId, { now = new Date(), subject = null, q, view } = {}) {
  try {
    const query = q ?? (await import("../db.js")).q;
    const [r] = await query("select tz from child_routine where child_id = $1", [childId]).catch(() => []);
    const tz = r?.tz || "Asia/Kolkata";
    const day = learningDay(now, tz);
    const [cs] = await query("select state from conductor_state where child_id = $1", [childId]).catch(() => []);
    const st = cs?.state ?? null;
    const v = view ?? await (await import("./view.js")).loadView({ q: query }, childId, tz, now).catch(() => ({}));
    return decisionsFromState(st, v, { day, subject });
  } catch { return null; }
}

/** PURE. lessonDecisions from a Conductor state (or none) and a loaded view, as planner.js inputsFor builds them. */
export function decisionsFromState(st, view, { day, subject = null }) {
  const lastActive = st?.counters?.lastActiveDay ?? null;
  const checked = Object.entries(st?.adapt?.prereqChecked ?? {}).filter(([, d]) => daysBetween(d, day) < R5.recheckDays).map(([k]) => k).sort();
  const testWindow = (st?.school?.testWindows ?? []).filter((w) => w.from <= day && day <= w.to)
    .sort((a, b) => (a.subject + a.to < b.subject + b.to ? -1 : 1))[0] ?? null;
  const pick = (k) => (view?.[k] && !view[k].stale ? { value: view[k].value } : undefined);
  return lessonDecisions({
    adapt: { gapDays: lastActive ? Math.min(30, daysBetween(lastActive, day)) : null, successFirst: !!st?.adapt?.successFirstNext, prereqChecked: checked },
    view: { "kt.wheelSpin": pick("kt.wheelSpin"), "learner.placementGap": pick("learner.placementGap"), "learner.firstWeek": pick("learner.firstWeek") },
    testWindow, subject, learningDay: day,
  });
}

/**
 * The lesson brief at a start with no day plan, in lessonBriefOf's shape for the learner-state part: { opener, successFirst,
 * newSkillBudget, prereqCheck, foundationShare?, adaptTrace } (adaptTrace: the rules that fired, sorted; R1 = the last lesson
 * ended hard, R15 = the first week). Null on a read error. The clock fields stay lessonBriefOf's (they need a plan).
 */
export async function lessonBriefWithoutPlan(childId, o = {}) {
  const d = await lessonDecisionsAtStart(childId, o);
  return d ? briefShapeOf(d) : null;
}
/** PURE. lessonDecisions → the brief's learner-state fields. */
export const briefShapeOf = (d) => ({
  opener: d.opener, successFirst: d.successFirst, newSkillBudget: d.newSkillBudget, prereqCheck: d.prereqCheck ?? null,
  ...(d.foundationShare != null ? { foundationShare: d.foundationShare } : {}), adaptTrace: [...(d.rules ?? [])],
});

/**
 * Two facts the round-8 reader takes at a lesson start: the child's last active learning day (the Conductor's counter, else
 * the day of her last lesson) and whether the family lets Taxila remember what she likes (consent purpose "memory").
 * @param {{ id: string, guardian_id: string }} child
 * @returns {Promise<{ lastActiveDay: string|null, rememberLikes: boolean }>}
 */
export async function startFactsOf(child, { q, hasConsent } = {}) {
  const query = q ?? (await import("../db.js")).q;
  const consentOf = hasConsent ?? (await import("../auth.js")).hasConsent;
  const [[cs], [r], [last], remember] = await Promise.all([
    query("select state->'counters'->>'lastActiveDay' as day from conductor_state where child_id = $1", [child.id]).catch(() => []),
    query("select tz from child_routine where child_id = $1", [child.id]).catch(() => []),
    query("select started_at from lesson where child_id = $1 order by started_at desc limit 1", [child.id]).catch(() => []),
    Promise.resolve(consentOf(child.guardian_id, child.id, "memory")).catch(() => false),
  ]);
  const lastActiveDay = cs?.day ?? (last?.started_at ? learningDay(new Date(last.started_at), r?.tz || "Asia/Kolkata") : null);
  return { lastActiveDay, rememberLikes: !!remember };
}
