// Evidence fusion: ONE log, ONE fold (COMPREHENSION-ENGINE.md CE1). Each event goes through the ledger's own fold
// (server/learner/kt/ledger.js, unchanged: K, D, M and θ) and then through facets.js (U, T) with the PRE-event
// retrievability, in the same seq order and with the same de-duplication, so replay always equals the online fold
// (TP1-TP2 extended to `comp`). Pure: no clock, no randomness, no I/O.
import { fold as ktFold, foldOrder, newLedger, canonical, ledgerDigest, rank, DELAY_MS } from "../learner/kt/ledger.js";
import { ITEM_CLASSES } from "../learner/kt/outcomes.js";
import { retrievability, daysBetween } from "../learner/kt/fsrs.js";
import { applyFacetEvent, applyFacetTeach, facetDrop, facetsOfClass, newFacet } from "./facets.js";
import { COMP_PARAMS_VERSION, FACET } from "./params.js";
import { familyOf } from "./probes/shapes.js";
import { misP } from "../learner/kt/misconception.js";

/**
 * Misconception saturation guard [U]: a further hit on a misconception already at p ≥ 0.95 adds no information but,
 * because the misconception logit is uncapped, it would make recovery after a successful re-teach need 10+
 * discriminating corrects (measured in the simulator). The hit is dropped from THIS event (its K evidence stays);
 * deterministic from the pre-event state, so replay = online. INTEGRATION.md asks the ledger to cap instead.
 */
export const MIS_SATURATE = 0.95;
function guardMis(ev, L) {
  const m = ev.misconceptionId && L.mis[ev.misconceptionId];
  if (!m || ev.misRoute === "skill" || misP(m) < MIS_SATURATE) return ev;
  const { misconceptionId, misRoute, ...rest } = ev;
  void misconceptionId; void misRoute;
  return { ...rest, misSaturated: ev.misconceptionId };
}

/** @returns {{ v: 1, paramsVersion: string, skills: Record<string, any>, misVerify: Record<string, { families: string[], verified: boolean }>, seen: Record<string, 1>, drops: Record<string, number> }} */
export const newComp = () => ({ v: 1, paramsVersion: COMP_PARAMS_VERSION, skills: {}, misVerify: {}, seen: {}, drops: {} });

/** A fresh joint state (ledger + comprehension). */
export const newLearnerState = ({ childId, classLevel }) => ({ ledger: newLedger({ childId, classLevel }), comp: newComp() });

const MOVE_EPS = 0.02;

/**
 * Fold events (any arrival order) into a COPY of { ledger, comp }.
 * @param {{ ledger: any, comp: ReturnType<typeof newComp> }} state
 * @param {any[]} events EvidenceEvent[] (with the CE contract additions: via, ebo, shapeId, weaveHost, coincident,
 *   unfamiliarContext, deferenceDiscount, spanOk)
 * @param {import("../learner/kt/ledger.js").FoldCtx} [ctx]
 */
export function fuseEvidence(state, events, ctx = {}) {
  let ledger = state.ledger;
  const comp = structuredClone(state.comp);
  for (let ev of foldOrder(events)) {                      // the ledger's own order (seq; unsequenced in arrival order)
    if (ledger.seen[ev.id] !== undefined || comp.seen[ev.id]) continue;
    const pre = ledger;
    const startAt = pre.session?.sessionId === ev.sessionId ? pre.session.startAt : new Date(ev.sessionStartAt ?? ev.at).toISOString();
    ev = guardMis(ev, pre);
    ledger = ktFold(pre, [ev], ctx);
    comp.seen[ev.id] = 1;
    const drop = facetDrop(ev, ctx);
    if (drop) { comp.drops[drop] = (comp.drops[drop] ?? 0) + 1; continue; }

    if (ev.teach) {
      for (const k of ev.skillIds) {
        const c = comp.skills[k];
        if (!c) continue;                                   // facets materialise at the first EVIDENCE event
        c.U = applyFacetTeach(c.U, ev.episodeId);
        c.T = applyFacetTeach(c.T, ev.episodeId);
      }
      continue;
    }
    for (const k of ev.skillIds) comp.skills[k] ??= { U: newFacet(FACET.U0), T: newFacet(FACET.T0), reasons: [], firstAt: startAt };
    // U/T evidence lands on the item's target skill only (a conjunctive host never moves the earlier skill's facets: E7).
    const target = ev.target ?? ev.skillIds[0];
    const c = comp.skills[target];
    const preSk = pre.skills[target];
    const R = retrievability(preSk?.mem ?? null, startAt);
    const anchor = preSk?.learnedAt ?? preSk?.anchorAt ?? null;
    const delayDays = anchor ? daysBetween(anchor, startAt) : 0;
    const before = { U: c.U.p, T: c.T.p };
    for (const f of facetsOfClass(ev.cls)) c[f] = applyFacetEvent(c[f], ev, R, { confusion: ctx.confusion?.[ev.cls], delayDays });

    if ((ev.misconceptionId && ev.misRoute !== "skill") || ev.misSaturated) {
      const id = ev.misconceptionId ?? ev.misSaturated;
      const fam = familyOf(ev.shapeId) ?? `cls:${ev.cls}`;
      const mv = comp.misVerify[id] ??= { families: [], verified: false };
      if (mv.families.length && !mv.families.includes(fam)) mv.verified = true;
      if (!mv.families.includes(fam)) mv.families.push(fam);
    }

    const post = ledger.skills[target];
    const moved = [];
    if (preSk && Math.abs(post.pL - preSk.pL) >= MOVE_EPS) moved.push("K");
    else if (!preSk) moved.push("K");
    if (Math.abs(c.U.p - before.U) >= MOVE_EPS) moved.push("U");
    if (Math.abs(c.T.p - before.T) >= MOVE_EPS) moved.push("T");
    const rechecked = !!preSk?.anchorSession && post.anchorSession !== preSk.anchorSession;   // a delayed check ran
    if (preSk && (post.flags.delayed !== preSk.flags.delayed || post.delayedMisses !== preSk.delayedMisses || rechecked)) moved.push("D");
    if (ev.misconceptionId || ev.discriminates) moved.push("M");
    // round2 truth: the first item answer on a learned skill in a later session (>= 20 h after its anchor) is the
    // session-open delayed check / review (C31, director/state.js activate). It is a moment the parent card must show even
    // when only K moved: a +1 day review never certifies (V1.3), so D does not move, and before this the card stayed
    // byte-identical after it (w1c-three-day "the parent card changes after the delayed check alone": none). VALUES-100
    // V1.5. Item events carry no shapeId, so this is read from held state only (replay-stable); once per skill per session.
    const recheck = !!preSk && rank(preSk.display) >= rank("learned_today") && ITEM_CLASSES.has(ev.cls) && !!anchor
      && preSk.anchorSession !== ev.sessionId && delayDays * 86_400_000 >= DELAY_MS && !c.reasons.some((r) => r.at === startAt && r.recheck);
    if (moved.some((m) => m !== "K") || ev.via === "weave" || ev.via === "callback" || recheck) {
      c.reasons = [...c.reasons, {
        evId: ev.id, at: startAt, shapeId: ev.shapeId ?? (recheck ? "C31" : undefined), cls: ev.cls, outcome: ev.outcome, grader: ev.grader, via: ev.via ?? "dialogue",
        help: ev.entryRung ?? 0, delayDays: Math.round(delayDays * 10) / 10, moved, ...(recheck ? { recheck: true } : {}),
      }].slice(-8);
    }
  }
  return { ledger, comp };
}

/** The persisted part of the comprehension state (the byte form replay and isolation properties compare). */
export function compDigest(comp) {
  const skills = Object.fromEntries(Object.entries(comp.skills).map(([k, c]) => [k, { U: c.U, T: c.T, reasons: c.reasons }]));
  return canonical({ skills, misVerify: comp.misVerify });
}
/** Ledger + comprehension digest. */
export const stateDigest = (s) => `${ledgerDigest(s.ledger)}|${compDigest(s.comp)}`;
