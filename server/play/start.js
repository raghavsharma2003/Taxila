// Starting a play session, outside any route (the /api/play/start route, and the lesson's Stagecraft seam that turns
// forge's compose() "play" rung into a PlayArtifact: docs/design/round3/forge/FOR-PLAY.md §2.3). No model call.
import { signSession } from "./session.js";
import { artFor, beliefOf, currentLevel, entriesFor, entryKey, levelsFor, seedOf } from "./levels.js";
import { chooseEntry, fadeFromHistory } from "./choose.js";

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
 *   focusSource  which table named the focus (the because record's source)
 *   hist    her ledger row for the skill { pL, display, n, run, recent } (round 8 P2: the fade), null when none
 */
export async function learnerInputs(childId, entry, q, lessonId = null) {
  const out = { mis: {}, pL: undefined, secure: false, focus: null, focusSource: null, hist: null };
  if (!q) return out;
  const ids = Object.values(entry.misMap ?? {});
  // independent reads, in parallel (each one's failure is its own default; the start path waits for the slowest only)
  const none = Promise.resolve([]);
  const [mis, skill, ev, rt] = await Promise.all([
    ids.length ? q("select misconception_id, logit from kt_misconception where child_id = $1 and misconception_id = any($2::text[]) and resolved_at is null", [childId, ids]).catch(() => []) : none,
    q("select p_l, display, n, run, recent from kt_skill_state where child_id = $1 and skill_id = $2", [childId, entry.skillId]).catch(() => []),
    lessonId && ids.length ? q("select misconception_id from kt_evidence where child_id = $1 and session_id = $2 and misconception_id = any($3::text[]) order by seq desc limit 1", [childId, String(lessonId), ids]).catch(() => []) : none,
    lessonId && ids.length ? q("select misconception_id from reteach_attempts where child_id = $1 and session_id = $2 and trigger in ('misconception_seen', 'misconception_confirmed') and misconception_id = any($3::text[]) order by at desc limit 1", [childId, String(lessonId), ids]).catch(() => []) : none,
  ]);
  for (const r of mis ?? []) out.mis[r.misconception_id] = +(1 / (1 + Math.exp(-Number(r.logit)))).toFixed(3);
  const r = (skill ?? [])[0];
  if (r && Number.isFinite(Number(r.p_l))) out.pL = +Number(r.p_l).toFixed(3);
  out.secure = r?.display === "mastered" || r?.display === "durable";
  // round 8 P2: her history on this skill (the ledger row), for the fade (choose.js fadeFromHistory)
  if (r) out.hist = { pL: out.pL, display: r.display ?? null, n: Number(r.n) || 0, run: Number(r.run) || 0, recent: Array.isArray(r.recent) ? r.recent.map(Number) : [] };
  out.focus = (ev ?? [])[0]?.misconception_id ?? (rt ?? [])[0]?.misconception_id ?? null;
  out.focusSource = (ev ?? [])[0]?.misconception_id ? "kt_evidence" : out.focus ? "reteach_attempts" : null;
  return out;
}

/**
 * → { sessionId, level, art, entry, session, because, inputs } or null (no game for this skill/topic, or no servable level).
 * Round 8 P1: the entry is CHOSEN (server/play/choose.js chooseEntry) over every coverage entry admitting the skill, from
 * her open mix-ups, pL and what she just played; with nothing known it is the first entry, exactly as before. The chosen
 * entry's key and the focus are in the session body, so every route regenerates the same level.
 * @param {{ id: string, class_level?: number, language_pref?: string }} child  the authenticated child row
 * @param {{ skillId?: string, topicId?: string, goal?: string, lessonId?: string, lang?: string, art?: string, fade?: number, door?: "garam"|"teekha", lastArt?: string,
 *   recent?: { families?: string[], keys?: string[], sigs?: string[] }, inputs?: object }} o  (inputs: learner inputs already read, e.g. a retry)
 * @param {Function} [q] the db query function (omit in tests: class defaults)
 */
export async function startSession(child, o = {}, q = undefined) {
  const entries = entriesFor({ skillId: o.skillId ?? null, topicId: o.topicId ?? null, goal: o.goal ?? null });
  if (!entries.length) return null;
  const first = entries[0];
  const skillOf = (e) => (o.skillId && e.skillIds.includes(o.skillId) ? o.skillId : e.skillId);
  // one read for every candidate: her pL on the skill asked for, her open mix-ups over every candidate's mapped beliefs
  const misMap = Object.fromEntries(entries.flatMap((e, i) => Object.entries(e.misMap ?? {}).map(([k, v]) => [`${i}:${k}`, v])));
  const inputs = o.inputs ?? await learnerInputs(child.id, { skillId: skillOf(first), misMap }, q, o.lessonId ?? null);
  // round 8 P2: the fade from her history on the skill; the request's fade only when there is none
  const fz = fadeFromHistory(inputs.hist ?? null, fadeOf(o.fade ?? 1));
  const fade = fz.fade;
  const bodyFor = (entry, focus, door = o.door === "teekha" ? "teekha" : "garam") => {
    const key = entryKey(entry);
    const classLevel = Number(child.class_level ?? child.classLevel ?? entry.classLevel) || entry.classLevel;
    return { childId: String(child.id), key, skillId: skillOf(entry), lessonId: o.lessonId ?? null,
      classLevel, fade, lang: langOf(o.lang ?? child.language_pref), childArt: o.art ?? null, lastArt: o.lastArt ?? null,
      mis: inputs.mis, pL: inputs.pL, secure: !!inputs.secure, ...(focus ? { focus } : {}), n: 0, seed: seedOf(child.id, key, 0), door, recent: [], hist: null };
  };
  const memo = new Map();
  const levelOf = (entry, focus) => {
    const k = `${entryKey(entry)}#${focus ?? ""}`;
    if (!memo.has(k)) memo.set(k, levelsFor(bodyFor(entry, focus, "garam"), entry)?.garam ?? null);
    return memo.get(k);
  };
  const pick = chooseEntry({ entries, inputs, levelOf, recent: o.recent ?? {}, keyOf: entryKey, beliefOf });
  const entry = pick.entry;
  const s = bodyFor(entry, pick.focus);
  const because = [pick.because, fz.because].filter(Boolean);
  if (because.length) s.because = because;
  const level = currentLevel(s, entry, child.first_name);
  if (!level) return null;
  const art = artFor(s, entry);
  s.lastArt = art.art;
  return { sessionId: signSession(s), level, art, entry, session: s, because, inputs };
}
/** forge's name for it (FOR-PLAY.md §2.3). */
export const levelFor = (child, o, q) => startSession(child, o, q);
