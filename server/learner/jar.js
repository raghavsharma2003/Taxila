// The Question jar (round 7 F item 8, learning-question-jar-promises; STUDENT-FLOW §7; migration 037).
//
// In a lesson the teacher parks a question or a share for later (Brain's s.later, conversation/policy.js parkEntry). What
// she did not get back to before the lesson ended goes into the jar, so her promise survives the lesson:
//   jarItemsFromLesson(state)                 PURE: the open Later entries worth keeping
//   jarWriteStmts(child, lessonId, state)     PURE: the inserts (idempotent per lesson + entry) and the teacher.promise events
//   openJar(childId, { limit })               the waiting items, oldest first (the next lesson's hook, the home count)
//   answerStmts(childId, ids, lessonId)       PURE: mark items kept (the next lesson answered them)
//   jarSummary(items)                         PURE: { waiting } for the child home's plan.jar
//   jarLaterEntries(hook)                     PURE: the next lesson's hook as Later entries (jarId), served by the opening
//   jarServed(prevLater, nextLater, lessonId) PURE: carried entries served this turn → answerStmts + keptEvents
// Brain calls jarWriteStmts at lesson end (inside its end transaction) and answerStmts when the hook is served; Learning
// owns the table, the reads and the Conductor promise. Never throws on read: a missing table (037 not applied) is an empty jar.

import { q as dbq } from "../db.js";

/** At most this many items wait in the jar (the oldest drop out of the hook first; nothing is deleted). */
export const JAR_HOOK_MAX = 2;
const SUBJ = /^c\d-([a-z]+)-/;

/**
 * PURE. The parked entries of a finished lesson that go into the jar: not served, with a topic, not the default
 * "their question" placeholder. Learning questions first, then shares; at most 5 (policy.js LATER_MAX).
 * @param {{ later?: { id: string, topic: string, learning?: boolean, share?: boolean, servedAt?: number }[], topicId?: string, ctx?: { topicId?: string } }} state
 */
export function jarItemsFromLesson(state) {
  const subject = SUBJ.exec(String(state?.topicId ?? state?.ctx?.topicId ?? ""))?.[1] ?? null;
  return (state?.later ?? [])
    // an entry carried in from the jar (jarId) already has its row: it is never written twice
    .filter((p) => p && p.servedAt == null && !p.jarId && typeof p.topic === "string" && p.topic.trim() && p.topic.trim() !== "their question")
    .sort((a, b) => Number(!!b.learning) - Number(!!a.learning) || (a.at ?? 0) - (b.at ?? 0))
    .slice(0, 5)
    .map((p) => ({ laterId: String(p.id), topic: p.topic.trim().slice(0, 60), learning: !!p.learning, share: !!p.share, subject }));
}

/**
 * PURE. Statements for a lesson end: one insert per jar item (a re-run end is a no-op: unique (lesson_id, later_id)), and
 * the Conductor events (teacher.promise, kind "revisit", ref = `${lessonId}:${laterId}`) for the caller to emit after commit.
 * @returns {{ stmts: { text: string, params: unknown[] }[], events: object[] }}
 */
export function jarWriteStmts(child, lessonId, state, { teacherId = "teacher" } = {}) {
  const items = jarItemsFromLesson(state);
  const stmts = items.map((it) => ({
    text: `insert into question_jar (child_id, lesson_id, later_id, topic, learning, share, subject) values ($1, $2, $3, $4, $5, $6, $7)
           on conflict (lesson_id, later_id) do nothing`,
    params: [child.id, lessonId, it.laterId, it.topic, it.learning, it.share, it.subject],
  }));
  const events = items.map((it) => ({
    type: "teacher.promise", promiseId: `jar:${lessonId}:${it.laterId}`.slice(0, 120),
    what: { kind: "revisit", ref: `${lessonId}:${it.laterId}`.slice(0, 120) }, by: String(teacherId).slice(0, 60),
  }));
  return { stmts, events };
}

/**
 * The child's waiting jar items, oldest first. Defensive: no table or any read error → [].
 * @returns {Promise<{ id: string, topic: string, learning: boolean, share: boolean, subject: string|null, lessonId: string, laterId: string, createdAt: string }[]>}
 */
export async function openJar(childId, { limit = 10, q = dbq } = {}) {
  try {
    const rows = await q(`select id, topic, learning, share, subject, lesson_id, later_id, created_at from question_jar
        where child_id = $1 and answered_at is null order by created_at, later_id limit $2`, [childId, limit]);
    return rows.map((r) => ({ id: String(r.id), topic: r.topic, learning: !!r.learning, share: !!r.share, subject: r.subject ?? null,
      lessonId: String(r.lesson_id), laterId: String(r.later_id), createdAt: new Date(r.created_at).toISOString() }));
  } catch { return []; }
}

/** PURE. The next lesson's hook: the oldest learning questions first (a share only when no question waits), at most JAR_HOOK_MAX. */
export function jarHook(items, { subject = null } = {}) {
  const pick = (xs) => [...xs].sort((a, b) => Number(b.learning) - Number(a.learning)
    || Number(!!subject && b.subject === subject) - Number(!!subject && a.subject === subject) || (a.createdAt < b.createdAt ? -1 : 1));
  return pick(items ?? []).slice(0, JAR_HOOK_MAX).map(({ id, topic, learning, share, lessonId, laterId }) => ({ id, topic, learning, share, lessonId, laterId }));
}

/** PURE. The Conductor events for answered items (teacher.promise_kept; promiseId as jarWriteStmts wrote it). */
export const keptEvents = (items, lessonId) => (items ?? []).map((it) => ({
  type: "teacher.promise_kept", promiseId: `jar:${it.lessonId}:${it.laterId}`.slice(0, 120), lessonId: String(lessonId).slice(0, 120),
}));

/** PURE. Mark items answered by a lesson (only the child's own, only still open). */
export function answerStmts(childId, ids, lessonId) {
  const list = [...new Set((ids ?? []).map(String))].filter((x) => /^[0-9a-f-]{36}$/i.test(x));
  if (!list.length) return [];
  return [{ text: "update question_jar set answered_at = now(), answered_lesson = $3 where child_id = $1 and id = any($2::uuid[]) and answered_at is null",
    params: [childId, list, lessonId] }];
}

/** PURE. The child home's jar: { waiting } (null when nothing waits, so the home shows no empty jar). */
export const jarSummary = (items) => ((items?.length ?? 0) > 0 ? { waiting: items.length } : null);

/**
 * PURE. The next lesson's hook (learnerView.jar, ≤ JAR_HOOK_MAX) as Later entries the Director serves like any parked
 * question: the opening comes back to the first one (state.js warmup start, SH.returnJar), a later boundary to the rest.
 * Each keeps its jar row's id, lesson and Later id so the turn that serves it can mark it kept (jarServed).
 */
export function jarLaterEntries(hook) {
  return (hook ?? []).slice(0, JAR_HOOK_MAX).filter((x) => x && x.id && typeof x.topic === "string" && x.topic.trim()).map((x, i) => ({
    id: `j${i}`, topic: x.topic.trim().slice(0, 60), learning: !!x.learning, ...(x.share ? { share: true } : {}), at: 0,
    promise: "after_question", insist: 0, jarId: String(x.id), jarLesson: String(x.lessonId ?? ""), jarLater: String(x.laterId ?? ""),
  }));
}

/**
 * PURE. The jar entries a step served (servedAt set now, not before): the statements that mark their rows kept and the
 * Conductor events (teacher.promise_kept) for after the commit. Nothing served → { stmts: [], events: [] }.
 */
export function jarServed(prevLater, nextLater, childId, lessonId) {
  const before = new Set((prevLater ?? []).filter((p) => p?.jarId && p.servedAt != null).map((p) => p.jarId));
  const served = (nextLater ?? []).filter((p) => p?.jarId && p.servedAt != null && !before.has(p.jarId));
  if (!served.length) return { stmts: [], events: [] };
  return {
    stmts: answerStmts(childId, served.map((p) => p.jarId), lessonId),
    events: keptEvents(served.map((p) => ({ lessonId: p.jarLesson, laterId: p.jarLater })), lessonId),
  };
}

/** The jar's Conductor events after a commit, fire-and-forget: a promise event never fails a start, a turn or an end. */
export function emitJarEvents(childId, events) {
  if (!events?.length) return;
  import("../conductor/index.js").then(({ emit }) => Promise.all(events.map((e) => emit(childId, e))))
    .catch((e) => console.warn("[jar] promise events not emitted:", e?.message));
}
