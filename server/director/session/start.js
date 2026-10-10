// The lesson route's ONE call for a session-first start (patch request 02 adds the call site in server/routes/lesson.js):
// everything the intake needs, from what the start already read, as ctx.session for initLessonState. Returns null (today's
// start, unchanged) unless TAXILA_SESSION_FIRST=on and the client asked for purpose "session". PURE over its inputs.

import { sessionFirstMode, sessionSwitches, inSessionCohort } from "./flags.js";
import { planPrior } from "./prior.js";
import { topicIdByPrefix } from "../../content/curriculum.js";

const LEARNED = new Set(["learned_today", "mastered", "durable"]);

/** The topics whose skills are due for review in the child's ledger (oldest due first), at most 4. */
export function dueTopics(ledger, now = Date.now()) {
  const at = new Date(now).toISOString();
  const due = Object.entries(ledger?.skills ?? {})
    .filter(([, sk]) => LEARNED.has(sk?.display) && sk.nextReviewAt && sk.nextReviewAt <= at)
    .sort((a, b) => String(a[1].nextReviewAt).localeCompare(String(b[1].nextReviewAt)))
    .map(([id]) => topicIdByPrefix(id)).filter(Boolean);
  return [...new Set(due)].slice(0, 4);
}

/**
 * A guardian in TAXILA_SESSION_FIRST_FOR (the owner first) gets it on the plain Start too: purpose "lesson" with no topic the
 * child chose (`topicChosen` false); a chosen topic, a practice set or an Ask is never turned into a session.
 * @param {{ purpose: string, child: { class_level: number, school_chapter?: Record<string, number> }, plan?: object|null,
 *   levelPathTopic?: string|null, ledger?: object, now?: number, subjects?: string[], learningDay?: string,
 *   guardian?: { email?: string } | null, topicChosen?: boolean }} x
 * @returns {null | { subjects: string[], pointer: Record<string, number>, prior: object, switches: object }}
 */
export function sessionStartCtx(x) {
  const cohort = !!x?.guardian && inSessionCohort(x.guardian);
  const asked = x?.purpose === "session" && (sessionFirstMode() === "on" || cohort);
  const plainStart = cohort && x?.purpose === "lesson" && !x?.topicChosen;
  if (!asked && !plainStart) return null;
  const pointer = x.child?.school_chapter && typeof x.child.school_chapter === "object" ? { ...x.child.school_chapter } : {};
  const prior = planPrior(x.plan ?? null, { learningDay: x.learningDay, classLevel: x.child?.class_level, levelPathTopic: x.levelPathTopic ?? null,
    dueReviews: dueTopics(x.ledger, x.now), pointer });
  return { subjects: (x.subjects ?? []).slice(0, 2), pointer, prior, switches: sessionSwitches() };
}

/**
 * The school position the intake confirmed, as statements for child.school_chapter (jsonb { subject: chapter number }), read
 * by content/next-topic.js schoolStartIndex and by the next session's candidate set. Only a segment whose purpose is today's
 * school topic writes it (a child's request, a review or the level path says nothing about where the school is). PURE.
 */
export function schoolPointerStmts(child, state) {
  const seg = (state?.session?.segments ?? []).find((x) => x.purpose === "school_continue" || x.purpose === "school_reteach" || x.then?.purpose === "school_continue");
  const topicId = seg?.then?.topicId ?? seg?.topicId;
  const m = /^c(\d)-([a-z]+)-ch(\d+)/.exec(topicId ?? "");
  if (!m || !child?.id || Number(m[1]) !== Number(child.class_level)) return [];
  return [{ text: "update child set school_chapter = coalesce(school_chapter, '{}'::jsonb) || jsonb_build_object($2::text, $3::int) where id = $1", params: [child.id, m[2], Number(m[3])] }];
}
