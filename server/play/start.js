// Starting a play session, outside any route (the /api/play/start route, and the lesson's Stagecraft seam that turns
// forge's compose() "play" rung into a PlayArtifact: docs/design/round3/forge/FOR-PLAY.md §2.3). No model call.
import { signSession } from "./session.js";
import { artFor, currentLevel, entryFor, entryKey, seedOf } from "./levels.js";

/** child.language_pref is hinglish | hindi | english; play speaks hinglish | hi | en */
export const langOf = (l) => (l === "en" || l === "english" ? "en" : l === "hi" || l === "hindi" ? "hi" : "hinglish");
export const fadeOf = (f) => ([1, 2, 3].includes(Number(f)) ? Number(f) : 1);

/**
 * Learner inputs for the picker (defensive: a missing table or row is the class default).
 *   mis     open misconception posteriors (kt_misconception)
 *   pL      P(skill) (kt_skill_state)
 *   secure  the ledger shows the skill mastered / durable: the only state where a fast pace may be offered
 *   focus   the misconception the lesson JUST saw (round 4 G1, `misconception_seen`): the last answer in this lesson
 *           classified to one of this entry's mapped kit misconceptions (kt_evidence), else the Director's last re-teach
 *           trigger for one (reteach_attempts, migration 023). The picker makes the next level test exactly that belief.
 */
export async function learnerInputs(childId, entry, q, lessonId = null) {
  const out = { mis: {}, pL: undefined, secure: false, focus: null };
  if (!q) return out;
  try {
    const ids = Object.values(entry.misMap);
    if (ids.length) for (const r of await q("select misconception_id, logit from kt_misconception where child_id = $1 and misconception_id = any($2::text[]) and resolved_at is null", [childId, ids])) out.mis[r.misconception_id] = +(1 / (1 + Math.exp(-Number(r.logit)))).toFixed(3);
  } catch { /* default priors */ }
  try {
    const [r] = await q("select p_l, display from kt_skill_state where child_id = $1 and skill_id = $2", [childId, entry.skillId]);
    if (r && Number.isFinite(Number(r.p_l))) out.pL = +Number(r.p_l).toFixed(3);
    out.secure = r?.display === "mastered" || r?.display === "durable";
  } catch { /* class default */ }
  const ids = Object.values(entry.misMap ?? {});
  if (lessonId && ids.length) {
    try {
      const [e] = await q("select misconception_id from kt_evidence where child_id = $1 and session_id = $2 and misconception_id = any($3::text[]) order by seq desc limit 1", [childId, String(lessonId), ids]);
      if (e?.misconception_id) out.focus = e.misconception_id;
      else {
        const [t] = await q("select misconception_id from reteach_attempts where child_id = $1 and session_id = $2 and trigger in ('misconception_seen', 'misconception_confirmed') and misconception_id = any($3::text[]) order by at desc limit 1", [childId, String(lessonId), ids]);
        if (t?.misconception_id) out.focus = t.misconception_id;
      }
    } catch { /* no focus */ }
  }
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
  const inputs = await learnerInputs(child.id, entry, q, o.lessonId ?? null);
  const s = { childId: String(child.id), key, skillId: o.skillId && entry.skillIds.includes(o.skillId) ? o.skillId : entry.skillId, lessonId: o.lessonId ?? null,
    classLevel, fade: fadeOf(o.fade ?? 1), lang: langOf(o.lang ?? child.language_pref), childArt: o.art ?? null, lastArt: o.lastArt ?? null,
    mis: inputs.mis, pL: inputs.pL, secure: !!inputs.secure, ...(inputs.focus ? { focus: inputs.focus } : {}), n: 0, seed: seedOf(child.id, key, 0), door: o.door === "teekha" ? "teekha" : "garam", recent: [], hist: null };
  const level = currentLevel(s, entry);
  if (!level) return null;
  const art = artFor(s, entry);
  s.lastArt = art.art;
  return { sessionId: signSession(s), level, art, entry, session: s };
}
/** forge's name for it (FOR-PLAY.md §2.3). */
export const levelFor = (child, o, q) => startSession(child, o, q);
