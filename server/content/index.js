// Content facade: topics, kits (verified file kit → cached mini-kit → generated mini-kit), id lookups,
// and per-lesson kit PINNING.
//
// A lesson refers to its kit's item ids in every turn (activeItemId, the queue, evidence rows), so it must
// see the exact kit it started on: kit files are rewritten by another workflow while lessons run, and a
// file mid-write, a partial topic or a restarted process once swapped a lesson onto a freshly generated
// mini-kit whose ids matched nothing. A lesson stores its kit's content hash; turns, tokens and the end
// route read that exact kit back (memory, then the file if unchanged, then asset_cache) and never generate.
import { one, q } from "../db.js";
import { getTopic, topicIdByPrefix } from "./curriculum.js";
import { kitFromFile, kitIdIndex } from "./kits.js";
import { cachedMiniKit, buildMiniKit } from "./minikit.js";

export { getTopic, topicSequence } from "./curriculum.js";

/** Mini-kits by topic id. File kits are not memoised here: kitFromFile re-checks mtime on each call. */
const miniKits = new Map();
/** Pinned kits by `${topicId}:${hash}` (bounded; asset_cache is the durable copy). */
const pinned = new Map();
const PINNED_MAX = 500;
const pinKey = (topicId, hash) => `kit:pin:${topicId}:${hash}`;

function remember(key, kit) {
  pinned.delete(key);
  pinned.set(key, kit);
  if (pinned.size > PINNED_MAX) pinned.delete(pinned.keys().next().value);
  return kit;
}

/**
 * The kit to START a lesson from (and for cross-lesson lookups). A verified file kit wins; otherwise a
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

/** Pin the kit a lesson starts on: kept in memory and written once to asset_cache, keyed by content hash. */
export async function pinKit(kit) {
  const key = pinKey(kit.topicId, kit.hash);
  if (pinned.has(key)) return;
  await q("insert into asset_cache(key, kind, body) values ($1, 'kit', $2) on conflict (key) do nothing", [key, kit]);
  remember(key, kit);
}

/**
 * The exact kit a lesson started on, or null when it is unavailable (the route answers 503): never a
 * different version, never generated.
 * @returns {Promise<import("../../shared/contracts").TopicKit | null>}
 */
export async function pinnedKit(topicId, hash) {
  const key = pinKey(topicId, hash);
  if (pinned.has(key)) return pinned.get(key);
  const topic = getTopic(topicId);
  const file = topic ? kitFromFile(topic) : null;
  if (file?.hash === hash) return remember(key, file);
  const row = await one("select body from asset_cache where key = $1", [key]);
  return row?.body ? remember(key, row.body) : null;
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
