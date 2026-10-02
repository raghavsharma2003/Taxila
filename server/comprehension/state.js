// The five-state ladder and the belief view (COMPREHENSION-ENGINE.md §2.4-§2.5). Pure. Reads the ledger (K, D, M)
// and the facet record (U, T); never writes either. The only clock is `now`, and it can only raise `refresh`
// (absence never lowers a state: CEI6). A state is never above what the ledger display allows (CEI2).
import { readSkill, rank } from "../learner/kt/ledger.js";
import { misP } from "../learner/kt/misconception.js";
import { COMP_PARAMS_VERSION, FACET, TH } from "./params.js";

/** The topic prefix of a skill or misconception id: `c5-maths-ch01-t01-s1` / `c5-maths-ch01-t01-m-x` → `c5-maths-ch01-t01`. */
export const topicOf = (id) => String(id).replace(/-(s\d+|m-.*)$/, "");
/** Default skill → misconception link: same topic (kit ids share the topic prefix). Kits may pass their own. */
export const defaultMisconceptionsOf = (L) => (skillId) => Object.keys(L.mis).filter((m) => topicOf(m) === topicOf(skillId));

/**
 * Linked misconceptions of a skill: the max unresolved p (M*) and whether it is verified by a second family.
 * @returns {{ mStar: number, mId: string|null, verified: boolean, active: { id: string, p: number }[] }}
 */
export function misconceptionSummary(L, comp, skillId, misOf) {
  const ids = (misOf ?? defaultMisconceptionsOf(L))(skillId);
  const active = ids.map((id) => L.mis[id]).filter((m) => m && !m.resolvedAt && m.hits > 0)
    .map((m) => ({ id: m.misconceptionId, p: misP(m) })).sort((a, b) => b.p - a.p || (a.id < b.id ? -1 : 1));
  const top = active[0];
  return { mStar: top?.p ?? 0, mId: top?.id ?? null, verified: !!(top && comp.misVerify[top.id]?.verified), active };
}

/**
 * The ladder (§2.4), on already-read inputs. Exported for the property tests.
 * @param {{ display: string, pL: number, recent: number[], delayedMisses: number, U: number, T: number,
 *   nonGameU: boolean, nonGameT: boolean, mStar: number, verified: boolean, longDelayPos: boolean }} x
 * @param {typeof TH} [th] thresholds (launch TH; an override exists ONLY for sensitivity reports, never fitted: SIM6)
 * @returns {{ state: 'not_yet'|'shallow'|'fragile'|'understood'|'durable', reason: string }}
 */
export function ladder(x, th = TH) {
  const does = x.recent.filter((r) => r === 1).length >= 2 || x.pL >= th.K_DO;
  if (x.mStar >= th.M_CONFIRMED && x.verified) return { state: "not_yet", reason: "wrong_idea_confirmed" };
  if (x.U >= th.U_FRAGILE && x.delayedMisses >= 1) return { state: "fragile", reason: "forgot_not_never" };
  if (!does) return { state: "not_yet", reason: "not_doing_yet" };
  if (x.U < th.U_FRAGILE) return { state: "shallow", reason: "why_not_shown" };
  if (x.mStar >= th.M_CHECKING) return { state: "shallow", reason: "wrong_idea_checking" };
  const certifiable = rank(x.display) >= rank("mastered") && x.U >= th.U_UNDERSTOOD && x.T >= th.T_UNDERSTOOD
    && x.mStar < th.M_CLEAR && x.nonGameU && x.nonGameT;
  if (!certifiable) return { state: "fragile", reason: "evidence_missing" };
  if (x.display === "durable" && x.longDelayPos) return { state: "durable", reason: "kept" };
  return { state: "understood", reason: "delayed_and_transfer" };
}

/**
 * The belief for one skill (ComprehensionBelief, §2.5). `undefined` when the skill has no evidence at all.
 * @param {string} skillId
 * @param {{ ledger: any, comp: any, now?: string|number|Date, misconceptionsOf?: (skillId: string) => string[], th?: Partial<typeof TH> }} s
 */
export function beliefFor(skillId, { ledger, comp, now, misconceptionsOf, th }) {
  const sk = readSkill(ledger.skills[skillId], now ?? ledger.session?.startAt ?? 0);
  if (!sk) return undefined;
  const c = comp.skills[skillId];
  const U = c?.U.p ?? FACET.U0, T = c?.T.p ?? FACET.T0;
  const m = misconceptionSummary(ledger, comp, skillId, misconceptionsOf);
  const longDelayPos = Math.max(c?.U.lastPosDelayDays ?? 0, c?.T.lastPosDelayDays ?? 0) >= TH.DURABLE_DELAY_DAYS;
  const { state, reason } = ladder({ display: sk.display, pL: sk.pL, recent: sk.recent, delayedMisses: sk.delayedMisses, U, T,
    nonGameU: !!c?.U.nonGame, nonGameT: !!c?.T.nonGame, mStar: m.mStar, verified: m.verified, longDelayPos }, th ? { ...TH, ...th } : TH);
  const open = [];
  if (U < TH.U_STOP) open.push("U");
  if (T < TH.T_STOP) open.push("T");
  if (rank(sk.display) >= rank("learned_today") && (!sk.flags.delayed || sk.refresh)) open.push("D");
  if (m.active.some((a) => a.p >= TH.M_CLEAR)) open.push("M");
  return {
    skillId, state, reason, refresh: !!sk.refresh, display: sk.display, pL: sk.pL, retention: sk.retention,
    facets: { U: c?.U ?? null, T: c?.T ?? null }, U, T, open, misconception: m,
    reasons: c?.reasons ?? [], paramsVersion: COMP_PARAMS_VERSION,
  };
}

/** Every skill's belief (the Director / Conductor / parent report read). */
export function beliefView(state, { now, misconceptionsOf } = {}) {
  const out = {};
  for (const k of Object.keys(state.ledger.skills).sort()) out[k] = beliefFor(k, { ...state, now, misconceptionsOf });
  return out;
}
