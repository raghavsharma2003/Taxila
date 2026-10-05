// Re-teach resolution (COMPREHENSION-ENGINE.md §5.4, RT7; BUILD-PLAN W1-C #5; comprehension audit G9). Pure: given the
// child's re-teach attempts and the evidence events logged after them, say what each attempt did. Run at lesson start
// (session.js), so an attempt resolves from the child's OWN later answers — the in-lesson re-check, the next lesson,
// a delayed check — never from the classifier's view of the re-teach turn itself.
//
//   failed            the first graded answer on the skill after the re-teach (same lesson) was wrong, or the skill
//                     needed another re-teach in the same lesson before any success      → final, reward 0
//   induced_bug       a DIFFERENT misconception showed on the skill before any success    → final, reward 0
//   contaminated      the deciding answer was helped by a parent or sibling               → final, no reward
//   repaired_now      the in-lesson re-check was right                                    (0.3)
//   resolved_next     the first graded answer in a LATER lesson was right                 (+0.3)
//   resolved_delayed  a delayed success (isDelayedSuccess, ≥ 20 h after the re-teach)     (+0.4) → final
// An attempt also becomes final when a later lesson's first answer is wrong (it keeps the stages it reached), or at
// the 30-day horizon. Only a FINAL attempt updates arm_posteriors (once; rewarded_at), with armReward (reteach.js).
import { outcomeName, isDelayedSuccess } from "../learner/kt/outcomes.js";
import { subjectOfSkill } from "../learner/kt/ability.js";
import { armReward } from "./reteach.js";

export const DELAY_MS = 20 * 3600_000;
export const HORIZON_MS = 30 * 86400_000;
const SUCCESS = new Set(["C0", "C1", "C2", "first_correct", "pass", "caught_fixed", "full", "high"]);
const FAILURE = new Set(["C3", "C4", "IDK", "wrong", "fail", "missed", "none", "misconception", "low"]);

/** A graded answer on the skill (not a teach event, not a correction): its verdict, or null when it says neither. */
export function verdictOf(ev) {
  if (ev.teach || ev.via === "late") return null;
  const n = outcomeName(ev.cls, ev.outcome);
  return SUCCESS.has(n) ? "success" : FAILURE.has(n) ? "failure" : null;
}
const onSkill = (ev, skillId) => (ev.target ?? ev.skillIds?.[0]) === skillId || (ev.skillIds ?? []).includes(skillId);
const t = (x) => new Date(x).getTime();

/** The population cluster an arm's reward pools in: subject × band (no child id; arm_posteriors). */
export const clusterOf = (skillId, band) => `${subjectOfSkill(skillId)}:${band ?? "B3"}`;

/**
 * Resolve one attempt against the events after it.
 * @param {{ id: any, skillId: string, sessionId: string, misId?: string|null, at: string }} a
 * @param {any[]} events the child's EvidenceEvents (any order)
 * @param {{ skillId: string, sessionId: string, at: string }[]} laterAttempts re-teach attempts after this one
 * @param {number} now ms
 * @returns {{ outcome: string|null, final: boolean, reward: number|null, stages: { repairedNow: boolean, resolvedNext: boolean, resolvedDelayed: boolean } }}
 */
export function resolveAttempt(a, events, laterAttempts = [], now = Date.now()) {
  const at = t(a.at);
  const evs = events.filter((e) => onSkill(e, a.skillId) && t(e.at) > at).sort((x, y) => t(x.at) - t(y.at) || (x.seq ?? 0) - (y.seq ?? 0));
  const st = { repairedNow: false, resolvedNext: false, resolvedDelayed: false };
  const done = (outcome, reward) => ({ outcome, final: true, reward, stages: st });
  const nextReteach = laterAttempts.filter((b) => b.skillId === a.skillId && b.sessionId === a.sessionId && t(b.at) > at).map((b) => t(b.at)).sort((x, y) => x - y)[0];

  // the in-lesson re-check
  const sameLesson = evs.filter((e) => e.sessionId === a.sessionId);
  for (const e of sameLesson) {
    if (nextReteach != null && t(e.at) > nextReteach) break;
    if (a.misId && e.misconceptionId && e.misconceptionId !== a.misId) return done("induced_bug", 0);
    const v = verdictOf(e);
    if (!v) continue;
    if (e.contaminated || e.assisted) return done("contaminated", null);
    if (v === "failure") return done("failed", 0);
    st.repairedNow = true;
    break;
  }
  if (!st.repairedNow && nextReteach != null) return done("failed", 0);

  // later lessons: the first graded answer on the skill, then a delayed success
  const later = evs.filter((e) => e.sessionId !== a.sessionId);
  let firstLater = null;
  for (const e of later) {
    if (a.misId && e.misconceptionId && e.misconceptionId !== a.misId && !st.repairedNow) return done("induced_bug", 0);
    const v = verdictOf(e);
    if (!v || e.contaminated || e.assisted) continue;
    if (!firstLater) {
      firstLater = e;
      if (v === "failure") {
        const stage = st.repairedNow ? "repaired_now" : "failed";
        return done(stage, armReward(st));
      }
      st.resolvedNext = true;
    }
    if (v === "success" && isDelayedSuccess(e.cls, e.outcome) && t(e.at) - at >= DELAY_MS) { st.resolvedDelayed = true; break; }
  }
  const outcome = st.resolvedDelayed ? "resolved_delayed" : st.resolvedNext ? "resolved_next" : st.repairedNow ? "repaired_now" : null;
  const final = st.resolvedDelayed || now - at >= HORIZON_MS;
  return { outcome: outcome ?? (final ? "failed" : null), final, reward: outcome || final ? armReward(st) : null, stages: st };
}

/**
 * Resolve every open attempt. Returns the updates to write (only rows whose outcome or finality changed) and the
 * attempts as selectReteach should see them (resolved outcomes, oldest first).
 * @param {{ id: any, skill_id: string, session_id: string, misconception_id?: string|null, arm_id: string, rep_class: string,
 *   representation_id?: string|null, at: string, outcome?: string|null, reward?: number|null, rewarded_at?: string|null }[]} rows
 * @param {any[]} events
 * @param {{ now?: number, band?: string }} [o]
 */
export function resolveAttempts(rows, events, { now = Date.now(), band } = {}) {
  const sorted = [...rows].sort((x, y) => t(x.at) - t(y.at) || String(x.id).localeCompare(String(y.id)));
  const attempts = [], updates = [];
  for (const [i, r] of sorted.entries()) {
    const a = { id: r.id, skillId: r.skill_id, sessionId: r.session_id, misId: r.misconception_id ?? null, at: new Date(r.at).toISOString() };
    let outcome = r.outcome ?? null, reward = r.reward ?? null, final = !!r.rewarded_at;
    if (!final) {
      const later = sorted.slice(i + 1).map((b) => ({ skillId: b.skill_id, sessionId: b.session_id, at: new Date(b.at).toISOString() }));
      const res = resolveAttempt(a, events, later, now);
      if (res.outcome && (res.outcome !== outcome || res.final || (res.reward ?? null) !== (reward ?? null))) {
        updates.push({ id: r.id, armId: r.arm_id, outcome: res.outcome, reward: res.reward, final: res.final, cluster: clusterOf(r.skill_id, band) });
        outcome = res.outcome; reward = res.reward; final = res.final;
      }
    }
    attempts.push({ skillId: r.skill_id, armId: r.arm_id, repClass: r.rep_class, representationId: r.representation_id ?? undefined, misId: r.misconception_id ?? null,
      outcome: outcome ?? "open", final, at: a.at });
  }
  return { attempts, updates };
}
