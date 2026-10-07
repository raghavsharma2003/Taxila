// The delayed check's item (VALUES-100 V1.3: "learnt" = still right later, in a NEW form, without help). Replaces
// routes/lesson.js warmupItemsFor, which always took the skill's EASIEST retrieval item: in the mastery simulator 99.5%
// of delayed checks (2,982 / 2,996) were an item the child had already answered on that skill (evals/mastery-calibration,
// 2026-10-05), so "secure" meant "remembers that one easy question".
//
// Selection, per skill: an item the ledger has never seen on it (ledger skill.items), of a check class (practice, near
// transfer, retrieval; a near transfer first, it is the new form by design), at or above the median difficulty the child
// already met on it; easiest of those first. No unseen item → no CHECK this session (never a repeat dressed as one; see
// openerFor: a skill still owed its check is reviewed, labelled uncertifiable, only in a slot nothing certifiable wanted).
import { getKit } from "../content/index.js";
import { LIMITS } from "../director/state.js";
import { checkReserveIds } from "../director/items.js";
import { checkDayOk, rank } from "./kt/ledger.js";
import { dueForChecks } from "./live.js";

const CHECK_KINDS = ["near_transfer", "practice", "retrieval"];
const topicOf = (skillId) => String(skillId).replace(/-s\d+$/, "");
const median = (xs) => { const v = [...xs].sort((a, b) => a - b); return v.length ? v[Math.floor((v.length - 1) / 2)] : null; };

/**
 * @param {string[]} skillIds the openers planChecks chose @param {{ ledger: any }} o
 * @returns {Promise<any[]>} warm-up items, tagged kind "retrieval" for the Director (it poses them as the session's openers)
 *
 * round2 truth (V1 "the delayed check leads the next lesson every time it is due"; evals/next-day-check/sim.mjs):
 *  - the warm-up holds as many openers as planChecks planned (≤ LIMITS.warmupMax). An opener that yields no item gives
 *    its slot to the next due delayed check (learner/live.js dueForChecks, `check`), not to nothing;
 *  - a skill ≥ 2 learning days past its anchor with NO item it has never met cannot be certified (V1.3: new form): it is
 *    passed over in the first pass so it never starves a skill that can be, and only fills a slot left over, as a REVIEW
 *    (`review: true`, `uncertifiable: true`; the ledger does not count it: checkDayOk + novel).
 */
export async function warmupItemsFor(skillIds, { ledger, now = Date.now() } = {}) {
  const cap = Math.min(LIMITS.warmupMax, skillIds.length);
  const queue = [...skillIds];
  if (ledger) for (const d of dueForChecks(ledger, now)) if (d.check && !queue.includes(d.skillId)) queue.push(d.skillId);
  const out = [], spare = [];
  for (const skillId of queue) {
    if (out.length >= cap) break;
    const r = await openerFor(skillId, { ledger, now });
    if (!r) continue;
    if (r.uncertifiable) spare.push(r); else out.push(r);
  }
  for (const r of spare) if (out.length < cap) out.push(r);
  return out;
}

const withKit = (it, kit, topicId, extra = {}) => ({
  ...it, kind: "retrieval", checkKind: it.kind, ...extra, topicId, topicType: kit.topicType, kitVerified: kit.verified, expectations: kit.expectations,
  misconceptions: kit.misconceptions.filter((m) => m.id === it.targetsMisconception).map((m) => ({ id: m.id, belief: m.belief, signs: m.signs, remediation: m.remediation })),
});

async function openerFor(skillId, { ledger, now }) {
  const topicId = topicOf(skillId);
  const kit = topicId ? await getKit(topicId, { generate: false }) : null;
  if (!kit) return null;
  const seen = new Set(ledger?.skills?.[skillId]?.items ?? []);
  const all = kit.items.filter((i) => i.skillId === skillId && CHECK_KINDS.includes(i.kind));
  const reserved = checkReserveIds(kit);
  const review = (extra = {}) => {
    const met = all.filter((i) => seen.has(i.id) && !reserved.has(i.id)).sort((a, b) => (a.difficulty ?? 3) - (b.difficulty ?? 3));
    const r = met[0] ?? all.filter((i) => !reserved.has(i.id)).sort((a, b) => (a.difficulty ?? 3) - (b.difficulty ?? 3))[0];
    return r ? withKit(r, kit, topicId, { review: true, ...extra }) : null;
  };
  // p5-interaction: before 2 learning days (V1.3) the opener is a REVIEW (spaced retrieval) of an item the child has met —
  // never the reserve, which is kept for the certifying check; the ledger does not count it as the check either way
  const anchorAt = ledger?.skills?.[skillId]?.anchorAt ?? null;
  if (anchorAt && !checkDayOk(anchorAt, new Date(now).toISOString())) return review();
  const metDiff = median(all.filter((i) => seen.has(i.id)).map((i) => i.difficulty ?? 3)) ?? 1;
  const fresh = all.filter((i) => !seen.has(i.id));
  const it = [...fresh].sort((a, b) => reserved.has(b.id) - reserved.has(a.id) || ((b.difficulty ?? 3) >= metDiff) - ((a.difficulty ?? 3) >= metDiff)
    || CHECK_KINDS.indexOf(a.kind) - CHECK_KINDS.indexOf(b.kind) || (a.difficulty ?? 3) - (b.difficulty ?? 3))[0];
  if (it) return withKit(it, kit, topicId);
  // no item never met: a learned skill still owed its certifying check is reviewed (it never certifies); any other
  // (a mastered skill's FSRS review) keeps the old rule: no opener this session
  const sk = ledger?.skills?.[skillId];
  return sk && !sk.flags?.delayed && rank(sk.display) >= rank("learned_today") ? review({ uncertifiable: true }) : null;
}
