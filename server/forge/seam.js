// The Forge seam into the live lesson (BUILD-PLAN §2, W1 seam commit). OWNED BY W1-B.
//
// server/routes/lesson.js is a hot file (W1-A owns it); Forge reaches the lesson ONLY through these functions, whose
// call sites the W0 seam commit placed. Contract:
//   - never throw into the lesson (catch inside; a Forge failure is a miss, never a lesson error);
//   - never block the start response: prefetchLessonFills is called fire-and-forget AFTER the lesson row landed;
//   - never trust a frame's `correct` (grading stays on the server, against the verified key: director/modules.js
//     moduleAnswerOf → forge/grade.js gradeEvent).
//
// W1-B #5: the prefetch fills the lesson's G1 table (server/forge/lesson-fills.js), which the Director reads
// synchronously on practice / probe / retrieval items with no bound engine plan; a turn-path miss warms the item with
// requestFill({ needByMs: TURN_NEED_BY_MS }) through the warmer registered below.
// W1-B #2: a kit whose engine hints resolve to no engine (shared/engine-catalog.js pickEngine → null) gets a forge_gap
// demand row per lesson that reaches it, instead of a mount of an engine the frame does not have.
import { pickEngine, resolveHint } from "../../shared/engine-catalog.js";
import { readFileSync } from "node:fs";
import { prefetchLessonFills, requestFill, learnerFor, findKitItem, TURN_NEED_BY_MS } from "./index.js";
import { recordGap } from "./cache.js";
import { setFillWarmer, rememberLessonFill, noteLessonChild } from "./lesson-fills.js";
import { hasConsent } from "../auth.js";

const TOPIC_MAP = JSON.parse(readFileSync(new URL("../../shared/engine-topic-map.json", import.meta.url), "utf8"));

/**
 * @typedef {{ id: string, guardian_id?: string, first_name?: string, class_level: number, language_pref?: string, interests?: string[] }} SeamChild
 */

// The turn path's warm: requestFill at the turn budget with the lesson's own pinned context as the learner (no DB
// read; interests are the consented lesson interests). Its result lands in the lesson table for the next posing.
setFillWarmer(({ lessonId, childId, kit, item, move, learner }) =>
  requestFill({ lessonId, childId: childId ?? undefined, kit, item: findKitItem(kit, item.id) ?? item, move, learner, needByMs: TURN_NEED_BY_MS }));

/**
 * The engine hints of a kit that name no engine, when the kit as a whole has none (W1-B #2): what a lesson on it
 * would have mounted before the catalog binding, and now writes as demand. [] when an engine resolves.
 */
export function unservedHints(kit) {
  if (pickEngine(kit, undefined, TOPIC_MAP)) return [];
  return (kit?.formats?.engineHints ?? []).filter((h) => !resolveHint(h));
}

export const forgeSeam = {
  /**
   * A hosted woven sub-step (comprehension/weave.js onTopicPlanned → hosted[0]) goes to the item generator: a kit
   * isomorph or a Forge ModuleRequest with want.subSkill. Until one exists the entry stays hosted and expires into a
   * C31 callback (the pre-seam behaviour, unchanged). Called synchronously in POST /api/lesson/start; return value
   * is ignored.
   * @param {object | null} _hosted  the weave entry, or null when nothing was hosted
   * @returns {void}
   */
  wovenSubStep: (_hosted) => undefined,

  /**
   * Warm the Forge G1 fills this lesson is likely to need (W1-B #5). Called once per started lesson, after the
   * lesson's transaction committed, NOT awaited. Personalises from the child's record (recent wrong items and active
   * misconceptions order the slots), with interests only under the memory consent, as the lesson itself does.
   * @param {{ child: SeamChild, lessonId: string, topicId: string, kit: object, lang: string, band: string, mode: string }} args
   * @returns {Promise<void>}
   */
  prefetchLessonFills: async ({ child, lessonId, topicId, kit }) => {
    try {
      if (!child?.id || !lessonId || !kit) return;
      noteLessonChild(lessonId, child.id);
      const hints = unservedHints(kit);
      if (hints.length) recordGap({ topicId: kit.topicId ?? topicId, itemId: "topic", reason: "no_engine_for_hints", engineHints: hints, childId: child.id });
      const [view, memory] = await Promise.all([
        learnerFor(child.id, kit.topicId ?? topicId, { fresh: true, timeoutMs: 4000 }),
        child.guardian_id ? hasConsent(child.guardian_id, child.id, "memory").catch(() => false) : Promise.resolve(false),
      ]);
      const own = view.child ?? { firstName: child.first_name ?? null, classLevel: child.class_level, languagePref: child.language_pref ?? "hinglish", interests: child.interests ?? [] };
      const learner = { ...view, child: memory ? own : { ...own, interests: [] } };
      await prefetchLessonFills({ lessonId, childId: child.id, topicId: kit.topicId ?? topicId, kit, learner,
        onFill: (item, r) => rememberLessonFill(lessonId, item.id, r) });
    } catch (e) {
      console.warn("[forge] lesson prefetch failed:", String(e?.message ?? e).slice(0, 160));
    }
  },
};
