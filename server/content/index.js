// Content facade: topics, kits (verified file kit → cached mini-kit → generated mini-kit), id lookups.
import { getTopic, topicIdByPrefix } from "./curriculum.js";
import { kitFromFile, kitIdIndex } from "./kits.js";
import { cachedMiniKit, buildMiniKit } from "./minikit.js";

export { getTopic, topicSequence, SUBJECT_ORDER } from "./curriculum.js";

/** Mini-kits by topic id. File kits are not memoised here: kitFromFile re-checks mtime on each call. */
const miniKits = new Map();

/**
 * The kit to teach a topic from. A verified file kit always wins (it may land mid-session); otherwise a
 * cached mini-kit, otherwise one is generated when `generate` is true.
 * @returns {Promise<import("../../shared/contracts").TopicKit | null>}
 */
export async function getKit(topicId, { generate = true, trace } = {}) {
  const topic = getTopic(topicId);
  if (!topic) return null;
  const fileKit = kitFromFile(topic);
  if (fileKit) return fileKit;
  if (miniKits.has(topicId)) return miniKits.get(topicId);
  const kit = (await cachedMiniKit(topic)) ?? (generate ? await buildMiniKit(topic, { trace }) : null);
  if (kit) miniKits.set(topicId, kit);
  return kit;
}

/** Which topic a skill or misconception id belongs to (kit files first, then the mini-kit id prefix). */
export function topicOf(id) {
  return kitIdIndex().get(id) ?? topicIdByPrefix(id);
}

/** Look up a misconception's belief text by id without generating anything. */
export async function misconceptionById(id) {
  const topicId = topicOf(id);
  const kit = topicId ? await getKit(topicId, { generate: false }) : null;
  return kit?.misconceptions.find((m) => m.id === id) ?? null;
}

/** Skill title by id without generating anything. */
export async function skillById(id) {
  const topicId = topicOf(id);
  const kit = topicId ? await getKit(topicId, { generate: false }) : null;
  return kit?.skills.find((s) => s.id === id) ?? null;
}
