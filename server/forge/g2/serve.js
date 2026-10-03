// Serving an APPROVED G2 module in a lesson (integration seam for the main loop; no route is registered here).
//   mountFor(topicId, entry)  → the ModuleCommand to send: engine `g2:<id>`, `src` = the immutable play-origin URL,
//                                params = the server-side expansion of the verified kit (never stored in Blob)
//   gradeEvent(topicId, ev, { seen }) → evidence from an `answer` ModuleEvent. What the server GUARANTEES: the value is
//                                re-derived from the server's own LevelSpec (choice: the slot the kit posted; build: unit
//                                counts × unit values), must agree with the value the frame posted, and is graded against
//                                the raw kit, so a frame cannot claim `correct` for a distractor. What it does NOT
//                                guarantee: WHICH option the child picked (or how many units) is still the frame's claim —
//                                agent code shares the kit's realm (intrinsics frozen, lint, CSP and the human review are
//                                what stand behind it). Evidence says so (`trust`), and one evidence per
//                                (module, item, attempt) — a repeated commit is a `duplicate`, not more evidence.
// ModuleHost needs `mount.src` support (FACTORY.md §2.6 "ModuleCommand.mount gains optional src"), see the inbox.
import { briefFor } from "./brief.js";
import { frameLevels, loadTopic } from "./levels.js";
import { rederive, kitTruth, sameV as same, fold } from "./truth.js";
import { bundleUrl } from "./store.js";

/**
 * @param {string} topicId
 * @param {{ engine: string, src: string, sha: string }} entry a catalogue / child-folder entry
 * @returns {{ op: "mount", moduleId: string, engine: string, src: string, params: object, goal: string } | null}
 */
export function mountFor(topicId, entry, { moduleId = `g2-${topicId}`, seed = 1 } = {}) {
  const b = briefFor(topicId);
  if (!b.ok || !/^g2:/.test(entry?.engine || "") || !/^[0-9a-f]{64}$/.test(entry?.sha || "")) return null;
  // the only servable URL is the approved, content-addressed one rebuilt from the sha; a stored src that differs is refused
  const src = bundleUrl(entry.sha);
  if (entry.src && entry.src !== src) return null;
  return { op: "mount", moduleId, engine: entry.engine, src, params: { levels: frameLevels(b.levels.all), seed }, goal: "g2_complete" };
}

/** The guarantee, stated on every evidence row (consumers: learner model, parent reports). */
export const TRUST = "value_ref_consistent; graded_by_server_against_kit; selection_is_frame_claim";

/**
 * @param {string} topicId
 * @param {import("../../../shared/contracts").ModuleEvent} ev
 * @param {{ seen?: Set<string> }} [o] the caller's per-lesson set: one evidence per (module, item, attempt)
 * @returns {{ itemId: string, outcome: "correct"|"incorrect"|"misconception", misconceptionId?: string, value: string, source: "forge_g2" } | { reject: string } | null}
 */
export function gradeEvent(topicId, ev, { seen } = {}) {
  if (!ev || ev.type !== "answer" || !/^g2:/.test(ev.engine || "")) return null;
  const p = ev.data?.value;
  if (!p || p.kind !== "g2.commit" || typeof p.item !== "string" || !Number.isInteger(p.attempt) || p.attempt < 1 || p.attempt > 99) return { reject: "shape" };
  if (seen) {
    const k = `${ev.moduleId}|${p.item}|${p.attempt}`;
    if (seen.has(k)) return { reject: "duplicate" };
    seen.add(k);
  }
  const b = briefFor(topicId);
  const spec = b.ok ? b.levels.all.flatMap((l) => l.items).find((s) => s.id === p.item) : null;
  if (!spec) return { reject: "unknown_item" };
  const re = rederive(spec, p);
  if (re.error) return { reject: re.error };
  if (!same(re.value, p.value)) return { reject: "state_diverged" };
  const truth = kitTruth(loadTopic(topicId), p.item);
  if (!truth) return { reject: "not_in_kit" };
  const base = { itemId: p.item, value: re.value, attempt: p.attempt, source: "forge_g2", trust: TRUST };
  if (truth.keys.some((k) => same(k, re.value))) return { ...base, outcome: "correct" };
  const misc = truth.misc[fold(re.value)] ?? re.misc ?? null;
  return misc ? { ...base, outcome: "misconception", misconceptionId: misc } : { ...base, outcome: "incorrect" };
}
