// Lesson purpose at start (BUILD-PLAN §4 W2 seam; W2-A #3, with the Director halves in W2-C #7). OWNED BY W2-A;
// call sites in server/routes/lesson.js start() owned by W2-E. Contract, binding on the owner:
//   - routeAsk: an Ask ("doubt") start with the child's first words (LessonStartRequest.firstText, W2-A adds the field)
//     → the matching topic in the child's class (or null: the book/chapter picker decides); titled by the question.
//     It may read content indexes, never call a model with the child id, and it never throws into the start;
//   - practiceSet: a practice start → the review-queue items for "Practice · n of 5" (≤ 5; no greeting, no hook), or
//     null (today's practice behaviour). Pure over what the start already read; no network.
//
// Until W2-A fills it: routeAsk → null (the topic is resolved exactly as today), practiceSet → null (nothing pinned).

export const purposeSeam = {
  /**
   * @param {{ child: { id: string, class_level: number, language_pref?: string }, purpose: "lesson" | "practice" | "doubt", firstText?: string, topicId?: string }} _req
   * @returns {Promise<{ topicId: string, title?: string } | null>}
   */
  async routeAsk(_req) { return null; },

  /**
   * @param {{ child: { id: string, class_level: number }, purpose: "lesson" | "practice" | "doubt", kit: object, ledger: object, now: number }} _ctx
   * @returns {{ itemIds: string[], count: number } | null}
   */
  practiceSet(_ctx) { return null; },
};
