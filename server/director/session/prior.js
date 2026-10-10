// The Conductor's day plan as a PRIVATE prior (TUTOR-MODEL §2.7; the brief's (e)): handed to the session, never shown as a
// menu, never read out as a list. It feeds decide.js (test window, due reviews, level path) and reaches the reply model only
// as short NOTES in LESSON NOW (shapes, never lines she could say; position is mechanism: they sit with the lesson facts,
// droppable, and never in the appended-last rules). PURE.

import { getTopic } from "../../content/curriculum.js";

const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

/**
 * PURE. The PlanPrior from planner.js planDay's plan plus what the start already reads.
 * @param {object|null} plan   planDay(...).plan (or null: no plan today)
 * @param {{ learningDay?: string, classLevel?: number, levelPathTopic?: string|null, dueReviews?: string[],
 *   pointer?: Record<string, number>, testWindows?: { subject: string, to: string, chapters?: number[] }[], promises?: object[] }} x
 */
export function planPrior(plan, x = {}) {
  const lesson = plan?.slots?.find((s) => s.kind === "live_lesson") ?? null;
  const tw0 = x.testWindows?.[0] ?? null;
  const days = tw0?.to && x.learningDay ? daysBetween(x.learningDay, tw0.to) : null;
  const testWindow = tw0 ? { subject: tw0.subject, when: days != null && days <= 1 ? "tomorrow" : "this_week", chapters: tw0.chapters ?? lesson?.testChapters ?? [] } : null;
  return Object.freeze({
    classLevel: x.classLevel ?? null,
    levelPathTopic: x.levelPathTopic ?? null,
    dueReviews: (x.dueReviews ?? []).filter((id) => getTopic(id)).slice(0, 4),
    pointer: { ...(x.pointer ?? {}) },
    testWindow,
    testTopic: testWindow && testWindow.chapters?.length && x.classLevel
      ? (() => { const id = `c${x.classLevel}-${testWindow.subject}-ch${String(testWindow.chapters[0]).padStart(2, "0")}-t01`; return getTopic(id) ? id : null; })() : null,
    promises: (x.promises ?? []).slice(0, 2).map((p) => ({ id: p.id })),
    opener: lesson?.opener ?? "standard_retrieval",
    successFirst: !!lesson?.successFirst,
    newSkillBudget: lesson?.pace?.newSkillBudget ?? 1,
    why: (lesson?.why ?? []).map((w) => ({ code: w.code, ref: w.ref })),
  });
}

const titleOf = (id) => String(getTopic(id)?.title ?? "").replace(/[^\p{L}\p{N} ,'-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 48);
const PURPOSE_NOTE = {
  child_request: "what they asked for", test_revise: "revision for the test", homework: "their homework", school_continue: "carry on from school today",
  school_reteach: "today's school idea again, a new way in", review: "a look back", level_path: "the next step on their path", foundation: "a short foundation step first",
};

/**
 * PURE. At most two private-plan notes for LESSON NOW (compile.js lessonParts). Notes, never lines: no quotes, no second
 * person, no greeting; the agenda she SPEAKS is one line she words herself from the decided segment, never this list.
 */
export function priorNotes(prior, segment) {
  if (!prior && !segment) return [];
  const notes = [];
  if (segment?.topicId) {
    const then = segment.then?.topicId ? `; then back to ${titleOf(segment.then.topicId)} with the foundation named` : "";
    notes.push(`private plan (yours, never read out as a list): now ${PURPOSE_NOTE[segment.purpose] ?? segment.purpose} on ${titleOf(segment.topicId)}${then}`);
  }
  const later = (prior?.dueReviews ?? []).filter((id) => id !== segment?.topicId).slice(0, 2).map(titleOf).filter(Boolean);
  if (later.length) notes.push(`private plan: a short revise slice near the end on ${later.join(" and ")}, framed as a look back, never a test`);
  return notes.map((n) => n.slice(0, 200));
}
