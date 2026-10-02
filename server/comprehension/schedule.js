// The probe scheduler (COMPREHENSION-ENGINE.md §3): code, not prompt. Mandatory probes first (budget-exempt, but
// they take the lightest eligible shape), then optional probes ranked by expected information gain per unit of
// test load, inside the band's caps, with the spacing, novelty and stop rules. Pure and deterministic: ties are
// broken by a counter-based hash draw, never a shared rng (LM §6.5a). Voice signals may only move an already
// eligible probe one slot earlier (CE8); strain may defer optional probes but never a mandatory one (BE2).
import { EMISSIONS, OUTCOMES, confusion, fold } from "../learner/kt/outcomes.js";
import { logit, sigmoid } from "../learner/kt/bktr.js";
import { rank } from "../learner/kt/ledger.js";
import { SHAPES, shapeById, testWeight, isCodeGraded, evidenceOp } from "./probes/shapes.js";
import { capsFor, fits, skillSess } from "./budget.js";
import { TH, W_SRC } from "./params.js";
import { isPositiveOutcome, isPartial } from "./facets.js";
import { familyOf } from "./probes/shapes.js";

/** FNV-1a → [0, 1): the counter-based draw u01(hash(lessonSeed, 'probe', skillId, opportunityIdx)). */
export function u01(...parts) {
  let h = 0x811c9dc5;
  for (const ch of parts.join("|")) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return h / 4294967296;
}
const H2 = (p) => (p <= 0 || p >= 1 ? 0 : -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p)));

/** Families by the facet that is missing evidence (§3.3 step 2; conversation-probes §6.1). */
export const FAMILIES_FOR = Object.freeze({ U: ["A", "B", "C", "D", "E"], T: ["F", "D", "C", "G", "E"] });
/** Minimum non-probe turns between optional probes; a voice followUpProbe shortens it by one slot for the current skill. */
export const MIN_GAP = 2;
/** An optional probe must buy at least this much (bits per unit of test load) to be worth asking. */
export const MIN_SCORE = 0.08;

/**
 * Expected information gain (bits) of one shape's class on facet f with current p (§3.3 step 4).
 * @param {number} p facet probability @param {string} cls @param {'code'|'llm'} grader @param {number} x tempering
 * @param {number} j 1 + same-class events on this (skill, facet) this session  @param {number} R retrievability
 */
export function eig(p, cls, grader, x = 1, j = 1, R = 1) {
  const e = EMISSIONS[cls];
  const M = confusion(grader, e.k.length);
  const k = fold(e.k, M), u = fold(e.u, M);
  let post = 0;
  for (let o = 0; o < k.length; o++) {
    const kR = R * k[o] + (1 - R) * u[o];
    const P = p * kR + (1 - p) * u[o];
    const q = sigmoid(logit(p) + (x * Math.log(kR / u[o])) / j);
    post += P * H2(q);
  }
  return Math.max(0, H2(p) - post);
}

/**
 * Is this shape usable for this skill right now (§3.3 step 3)?
 * @param {any} shape @param {{ belief: any, topicType?: string, kitInputs?: string[], delayDays?: number }} sk @param {any} sess
 */
export function eligible(shape, sk, sess, { allowDelayed = false } = {}) {
  const b = sk.belief;
  const disp = b?.display ?? "unseen";
  if (!shape.bands.includes(sess.band)) return false;
  if (sk.topicType && !shape.topicTypes.includes(sk.topicType)) return false;
  if (shape.async) return false;                                        // out-of-lesson shapes go through the Conductor
  if (shape.gate === "practising" && rank(disp) < rank("practising")) return false;
  if (shape.gate === "learned_today" && rank(disp) < rank("learned_today")) return false;
  if (rank(disp) <= rank("introduced") && !shape.novice) return false;  // novices: A, D16, G, I only
  if (shape.planted && rank(disp) < rank("learned_today")) return false;
  if (shape.needsVisual && !sess.surface?.visual) return false;
  const have = new Set(sk.kitInputs ?? []);
  if (!shape.kitInputs.every((i) => have.has(i))) return false;
  if ((sess.shapeUses[shape.id] ?? 0) >= 2) return false;
  if ((sess.yesterday?.[b?.skillId] ?? []).includes(shape.id)) return false;
  if (shape.delayed && !allowDelayed) return false;
  if (shape.minDays && (sk.delayDays ?? 0) < shape.minDays) return false;
  return true;
}

const retr = (b) => (b && b.pL > 1e-6 ? Math.min(1, b.retention / b.pL) : 1);
const graderOf = (shape) => (isCodeGraded(shape) ? "code" : "llm");
const facetP = (b, f) => (f === "U" ? b?.U ?? 0.2 : b?.T ?? 0.2);

function planOf(shape, skillId, facet, mandatory, reason, extra = {}) {
  return { skillId, shapeId: shape.id, facet, mandatory, reason, testWeight: testWeight(shape), cls: shape.emits, pre: shape.pre ?? null,
    op: evidenceOp(shape), family: shape.family, via: shape.via, longForm: shape.longForm, kitRefs: extra.kitRefs ?? [], skin: extra.skin ?? null };
}

/** Cheapest eligible shape for a mandatory trigger (§3.2). */
function cheapest(ids, sk, sess, avoid = [], opts) {
  const c = ids.map(shapeById).filter((s) => s && !avoid.includes(s.family) && eligible(s, sk, sess, opts))
    .sort((a, b) => testWeight(a) - testWeight(b) || (isCodeGraded(b) ? 1 : 0) - (isCodeGraded(a) ? 1 : 0) || (a.id < b.id ? -1 : 1));
  return c[0] ?? null;
}
const WHY_SHAPES = ["C03", "C06", "C10", "C14", "C12"];
const VERIFY_SHAPES = ["C04", "C09", "C35", "C08", "C11", "C16"];
const DELAYED_SHAPES = ["C32", "C31", "C33"];

/** Mandatory trigger → plan (§3.2). Fixed order: delayed check (warm-up) > verify > coincident why > first-correct why > partial. */
const MANDATORY_ORDER = ["delayed_check", "verify_misconception", "coincident_why", "verify_first_correct", "partial_followup"];
function mandatoryPlan(sess, skills) {
  const pend = [...sess.pending].sort((a, b) => MANDATORY_ORDER.indexOf(a.reason) - MANDATORY_ORDER.indexOf(b.reason));
  for (const t of pend) {
    const sk = skills[t.skillId] ?? { belief: null };
    let shape = null, facet = "U";
    if (t.reason === "delayed_check") { shape = cheapest(DELAYED_SHAPES, sk, sess, [], { allowDelayed: true }); facet = "D"; }
    else if (t.reason === "verify_misconception") { shape = cheapest(VERIFY_SHAPES, sk, sess, t.avoid ?? []); facet = "M"; }
    else if (t.reason === "partial_followup") shape = cheapest([...WHY_SHAPES, "C09", "C16", "C04", "C07", "C15", "C01"], sk, sess, t.avoid ?? []);
    else shape = cheapest(WHY_SHAPES, sk, sess);
    if (shape) return { plan: planOf(shape, t.skillId, facet, true, t.reason, { kitRefs: t.kitRefs }), trigger: t };
  }
  return null;
}

/**
 * The next probe, or null (§3.6 planProbe). Call once per child turn, after recordTurn() and noteOutcome().
 * @param {Record<string, { belief: any, topicType?: string, kitInputs?: string[], delayDays?: number, urgency?: number, weave?: boolean, due?: boolean }>} skills
 *   candidate skills (taught or practised this session, weave candidates the current item can host, due skills)
 * @param {any} sess the probe session (budget.js)
 * @param {{ currentSkill?: string, voice?: { followUpProbe?: boolean }, skin?: string|null, freezeLow?: boolean }} [o]
 * @returns {null | ReturnType<typeof planOf>}
 */
export function nextProbe(skills, sess, o = {}) {
  if (sess.safetyFired) return null;
  if (!sess.lastTurnWasProbe) {
    const m = mandatoryPlan(sess, skills);
    if (m) return { ...m.plan, skin: o.skin ?? null };
  }
  if (sess.lastTurnWasProbe || sess.childTurns < 3) return null;
  if (sess.engagement === "strained" || sess.engagement === "stopped") return null;
  const caps = capsFor(sess.band);
  const cands = [];
  for (const [skillId, sk] of Object.entries(skills)) {
    const b = sk.belief;
    if (!b) continue;
    const ps = skillSess(sess, skillId);
    const gap = o.voice?.followUpProbe && o.currentSkill === skillId ? MIN_GAP - 1 : MIN_GAP;
    if (sess.sinceProbe < gap) continue;
    for (const f of ["U", "T"]) {
      const p = facetP(b, f);
      if (f === "U" && p >= TH.U_STOP) continue;
      if (f === "T" && p >= TH.T_STOP) continue;
      if (p <= TH.LOW && (ps.lowDone[f] || o.freezeLow)) continue;      // a low facet keeps ONE probe a session (freezeLow = the rejected control)
      if (f === "U" && ps.uFamilies.length >= caps.maxUPerConcept) continue;
      if (f === "T" && (ps.t >= caps.maxTPerConcept || b.pL < 0.5)) continue;
      for (const shape of SHAPES) {
        if (!shape.facets.includes(f) || !FAMILIES_FOR[f].includes(shape.family)) continue;
        if (!eligible(shape, sk, sess)) continue;
        if (f === "U" && ps.uFamilies.includes(shape.family)) continue;  // two U probes: different families
        if (f === "U" && shape.longForm && ps.longForm) continue;
        const w = testWeight(shape);
        if (!fits(sess, w)) continue;
        const x = W_SRC[shape.via] ?? 1;
        const j = (ps.classCounts[shape.emits] ?? 0) + 1;
        const info = eig(p, shape.emits, graderOf(shape), x, j, retr(b));
        const gates = (f === "U" && b.state === "shallow") || (f === "T" && b.state === "fragile" && b.U >= TH.U_UNDERSTOOD);
        const urgency = (sk.urgency ?? (sess.targets.includes(skillId) ? 1 : sk.weave ? 0.8 : sk.due ? 0.6 : 0.8)) + (gates ? 0.3 : 0);
        const novelty = (sess.shapeUses[shape.id] ?? 0) >= 2 ? 0 : ps.lastFamily === shape.family ? 0.5 : 1;
        const bonus = isCodeGraded(shape) ? 1.5 : 1;
        const score = (info * urgency * novelty * bonus) / (w * Math.max(1, shape.costSec / 30));
        if (score >= MIN_SCORE) cands.push({ score, shape, skillId, f });
      }
    }
  }
  if (!cands.length) return null;
  cands.sort((a, b) => b.score - a.score || (a.shape.id < b.shape.id ? -1 : 1));
  const top = cands.filter((c) => c.score >= cands[0].score * 0.95);
  const pick = top.length === 1 ? top[0] : top[Math.floor(u01(sess.seed, "probe", top[0].skillId, sess.opp) * top.length)];
  return planOf(pick.shape, pick.skillId, pick.f, false, "voi", { skin: o.skin ?? null });
}

/**
 * Register mandatory triggers from one graded event (§3.2). Returns a new session.
 * @param {any} sess @param {any} ev the EvidenceEvent just folded @param {any} belief the belief AFTER folding it
 */
export function noteOutcome(sess, ev, belief) {
  const k = ev.target ?? ev.skillIds?.[0];
  if (!k || ev.teach) return sess;
  const ps = { ...skillSess(sess, k) };
  let pending = sess.pending.filter((t) => !(t.skillId === k && t.servedBy === ev.shapeId));
  const add = (t) => { if (!pending.some((x) => x.skillId === t.skillId && x.reason === t.reason)) pending = [...pending, t]; };
  const pos = isPositiveOutcome(ev.cls, ev.outcome);
  const itemish = ev.cls.startsWith("item.") || ev.cls === "solo";
  if (itemish && pos && ev.coincident) add({ skillId: k, reason: "coincident_why" });
  else if (itemish && pos && !ps.firstCorrectHandled && belief && rank(belief.display) <= rank("practising") && (belief.U ?? 0) < TH.U_STOP) {
    add({ skillId: k, reason: "verify_first_correct" });
    ps.firstCorrectHandled = true;
  }
  if (isPartial(ev.cls, ev.outcome)) add({ skillId: k, reason: "partial_followup", avoid: [familyOf(ev.shapeId)].filter(Boolean) });
  const mis = belief?.misconception;
  if (mis && mis.mStar >= TH.M_CHECKING && !mis.verified && ev.misconceptionId) {
    add({ skillId: k, reason: "verify_misconception", avoid: [familyOf(ev.shapeId)].filter(Boolean), kitRefs: [mis.mId] });
  }
  return { ...sess, pending, perSkill: { ...sess.perSkill, [k]: ps } };
}

/** The plan was asked: clear its trigger and record the per-facet low probe (stop rule bookkeeping). */
export function markAsked(sess, plan, belief) {
  const pending = plan.mandatory ? sess.pending.filter((t) => !(t.skillId === plan.skillId && t.reason === plan.reason)) : sess.pending;
  const ps = { ...skillSess(sess, plan.skillId) };
  if ((plan.facet === "U" || plan.facet === "T") && facetP(belief, plan.facet) <= TH.LOW) ps.lowDone = { ...ps.lowDone, [plan.facet]: true };
  return { ...sess, pending, perSkill: { ...sess.perSkill, [plan.skillId]: ps } };
}

/** Session open: queue 2-4 delayed checks (band) from due skills / expired weave entries, lowest retention first (§3.5.7). */
export function openSession(sess, dueSkills) {
  const n = capsFor(sess.band).openers;
  const add = dueSkills.slice(0, n).map((skillId) => ({ skillId, reason: "delayed_check" }));
  return { ...sess, pending: [...sess.pending, ...add] };
}

export { OUTCOMES };
