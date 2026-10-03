// What G1 personalises from, read-only: the child row (class, language, interests, first name for the PII check),
// this child's recent wrong items on the topic (≤ 14 days: FACTORY.md §4.8 errorReplays) and unresolved
// misconceptions. Forge never writes learner tables; the learner model owns them.
import { q, one } from "../db.js";

export const REPLAY_DAYS = 14;

/**
 * @returns {Promise<{ child: { firstName: string, classLevel: number, languagePref: string, interests: string[] } | null,
 *   recentWrong: string[], activeMisconceptions: string[], pKnown: Record<string, number> }>}
 */
export async function learnerView(childId, topicId) {
  const [child, wrong, misc, skills] = await Promise.all([
    one("select first_name, class_level, language_pref, interests from child where id = $1", [childId]),
    q(`select item_id, max(at) as at from evidence where child_id = $1 and item_id like $2 and outcome in ('incorrect','misconception')
         and at > now() - ($3 || ' days')::interval group by item_id order by max(at) desc limit 6`, [childId, `${topicId}-%`, String(REPLAY_DAYS)]).catch(() => []),
    q(`select misconception_id from misconception_state where child_id = $1 and resolved = false and evidence_count > 0 and misconception_id like $2
       union select misconception_id from kt_misconception where child_id = $1 and resolved_at is null and logit > 0 and misconception_id like $2`,
      [childId, `${topicId}-%`]).catch(() => []),
    q("select skill_id, p_known from skill_state where child_id = $1 and skill_id like $2", [childId, `${topicId}-%`]).catch(() => []),
  ]);
  return {
    child: child ? { firstName: child.first_name, classLevel: child.class_level, languagePref: child.language_pref, interests: child.interests || [] } : null,
    recentWrong: wrong.map((r) => r.item_id),
    activeMisconceptions: misc.map((r) => r.misconception_id),
    pKnown: Object.fromEntries(skills.map((r) => [r.skill_id, Number(r.p_known)])),
  };
}
