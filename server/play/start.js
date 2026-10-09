// Starting a play session, outside any route (the /api/play/start route, and the lesson's Stagecraft seam that turns
// forge's compose() "play" rung into a PlayArtifact: docs/design/round3/forge/FOR-PLAY.md §2.3). No model call.
import { signSession } from "./session.js";
import { artFor, currentLevel, entryFor, entryKey, seedOf } from "./levels.js";

/** child.language_pref is hinglish | hindi | english; play speaks hinglish | hi | en */
export const langOf = (l) => (l === "en" || l === "english" ? "en" : l === "hi" || l === "hindi" ? "hi" : "hinglish");
export const fadeOf = (f) => ([1, 2, 3].includes(Number(f)) ? Number(f) : 1);

/** Learner inputs for the picker (defensive: a missing table or row is the class default). */
export async function learnerInputs(childId, entry, q) {
  const out = { mis: {}, pL: undefined };
  if (!q) return out;
  try {
    const ids = Object.values(entry.misMap);
    if (ids.length) for (const r of await q("select misconception_id, logit from kt_misconception where child_id = $1 and misconception_id = any($2::text[]) and resolved_at is null", [childId, ids])) out.mis[r.misconception_id] = +(1 / (1 + Math.exp(-Number(r.logit)))).toFixed(3);
  } catch { /* default priors */ }
  try {
    const [r] = await q("select p_l from kt_skill_state where child_id = $1 and skill_id = $2", [childId, entry.skillId]);
    if (r && Number.isFinite(Number(r.p_l))) out.pL = +Number(r.p_l).toFixed(3);
  } catch { /* class default */ }
  return out;
}

/**
 * → { sessionId, level, art, entry, session } or null (no game for this skill/topic, or no servable level).
 * @param {{ id: string, class_level?: number, language_pref?: string }} child  the authenticated child row
 * @param {{ skillId?: string, topicId?: string, goal?: string, lessonId?: string, lang?: string, art?: string, fade?: number, door?: "garam"|"teekha", lastArt?: string }} o
 * @param {Function} [q] the db query function (omit in tests: class defaults)
 */
export async function startSession(child, o = {}, q = undefined) {
  const entry = entryFor({ skillId: o.skillId ?? null, topicId: o.topicId ?? null, goal: o.goal ?? null });
  if (!entry) return null;
  const classLevel = Number(child.class_level ?? child.classLevel ?? entry.classLevel) || entry.classLevel;
  const key = entryKey(entry);
  const inputs = await learnerInputs(child.id, entry, q);
  const s = { childId: String(child.id), key, skillId: o.skillId && entry.skillIds.includes(o.skillId) ? o.skillId : entry.skillId, lessonId: o.lessonId ?? null,
    classLevel, fade: fadeOf(o.fade ?? 1), lang: langOf(o.lang ?? child.language_pref), childArt: o.art ?? null, lastArt: o.lastArt ?? null,
    mis: inputs.mis, pL: inputs.pL, n: 0, seed: seedOf(child.id, key, 0), door: o.door === "teekha" ? "teekha" : "garam", recent: [], hist: null };
  const level = currentLevel(s, entry);
  if (!level) return null;
  const art = artFor(s, entry);
  s.lastArt = art.art; s.recent = [level.levelId];
  return { sessionId: signSession(s), level, art, entry, session: s };
}
/** forge's name for it (FOR-PLAY.md §2.3). */
export const levelFor = (child, o, q) => startSession(child, o, q);
