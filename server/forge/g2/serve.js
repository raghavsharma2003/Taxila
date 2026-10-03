// Serving an APPROVED G2 module in a lesson (integration seam for the main loop; no route is registered here).
//   mountFor(topicId, entry)  → the ModuleCommand to send: engine `g2:<id>`, `src` = the immutable play-origin URL,
//                                params = the server-side expansion of the verified kit (never stored in Blob)
//   gradeEvent(topicId, ev)   → evidence from an `answer` ModuleEvent: the value is RE-DERIVED from the server's own
//                                LevelSpec (choice: the ref; build: unit counts × unit values) and graded against the raw
//                                kit; the frame's `correct` and `value` are claims and are never read as truth
// ModuleHost needs `mount.src` support (FACTORY.md §2.6 "ModuleCommand.mount gains optional src"), see the inbox.
import { briefFor } from "./brief.js";
import { frameLevels, loadTopic } from "./levels.js";
import { rederive, kitTruth, sameV as same, fold } from "./truth.js";

/**
 * @param {string} topicId
 * @param {{ engine: string, src: string, sha: string }} entry a catalogue / child-folder entry
 * @returns {{ op: "mount", moduleId: string, engine: string, src: string, params: object, goal: string } | null}
 */
export function mountFor(topicId, entry, { moduleId = `g2-${topicId}`, seed = 1 } = {}) {
  const b = briefFor(topicId);
  if (!b.ok || !entry?.src || !/^g2:/.test(entry.engine || "")) return null;
  return { op: "mount", moduleId, engine: entry.engine, src: entry.src, params: { levels: frameLevels(b.levels.all), seed }, goal: "g2_complete" };
}

/**
 * @param {string} topicId
 * @param {import("../../../shared/contracts").ModuleEvent} ev
 * @returns {{ itemId: string, outcome: "correct"|"incorrect"|"misconception", misconceptionId?: string, value: string, source: "forge_g2" } | { reject: string } | null}
 */
export function gradeEvent(topicId, ev) {
  if (!ev || ev.type !== "answer" || !/^g2:/.test(ev.engine || "")) return null;
  const p = ev.data?.value;
  if (!p || p.kind !== "g2.commit" || typeof p.item !== "string") return { reject: "shape" };
  const b = briefFor(topicId);
  const spec = b.ok ? b.levels.all.flatMap((l) => l.items).find((s) => s.id === p.item) : null;
  if (!spec) return { reject: "unknown_item" };
  const re = rederive(spec, p);
  if (re.error) return { reject: re.error };
  if (!same(re.value, p.value)) return { reject: "state_diverged" };
  const truth = kitTruth(loadTopic(topicId), p.item);
  if (!truth) return { reject: "not_in_kit" };
  if (truth.keys.some((k) => same(k, re.value))) return { itemId: p.item, outcome: "correct", value: re.value, source: "forge_g2" };
  const misc = truth.misc[fold(re.value)] ?? re.misc ?? null;
  return misc ? { itemId: p.item, outcome: "misconception", misconceptionId: misc, value: re.value, source: "forge_g2" }
    : { itemId: p.item, outcome: "incorrect", value: re.value, source: "forge_g2" };
}
