// U (explains / evaluates) and T (travels) facets: logit accumulators that reuse the ledger's emission tables,
// grader folding, symmetric retrieval gate, tempering and the per-session 1/j budget (COMPREHENSION-ENGINE.md
// §2.3). Pure. Reads only HELD inputs (CEI1): class, outcome, grader, held flags, the session start and the
// pre-event FSRS memory. No voice, vibe, timing, affect or engagement value is a parameter of anything here.
//
// Lives in server/comprehension/ (not server/learner/kt/ as the spec sketches) because the learner tree is owned
// by another workstream; it imports the kt step functions read-only, so the K fold is byte-for-byte untouched.
import { outcomeName } from "../learner/kt/outcomes.js";
import { dropReason, gatedEmission, logit, sigmoid, temper } from "../learner/kt/bktr.js";
import { FACET, W_SRC, facetsOfClass } from "./params.js";

/** Game and Forge-module evidence can take a concept to `fragile` at most (E4). */
export const GAME_VIA = Object.freeze(new Set(["game", "module"]));

/** @typedef {{ p: number, S: number, byClass: Record<string, number>, nonGame: boolean, n: number, prior: number,
 *   sessionId: string|null, pos: number, neg: number, lastPosDelayDays: number, teachGain: Record<string, number> }} FacetState */

/** @returns {FacetState} */
export const newFacet = (prior) => ({ p: prior, S: 0, byClass: {}, nonGame: false, n: 0, prior, sessionId: null, pos: 0, neg: 0, lastPosDelayDays: 0, teachGain: {} });

/** Is this outcome a "partial" verdict (E5): why=partial, teachback=mid. */
export const isPartial = (cls, o) => { const n = outcomeName(cls, o); return (cls === "probe.why" && n === "partial") || (cls === "probe.teachback" && n === "mid"); };
/** A correct-type outcome (used by E3 coincident and E6 span rules). */
export const isPositiveOutcome = (cls, o) => ["full", "high", "caught_fixed", "caught", "right", "pass", "C0", "first_correct"].includes(outcomeName(cls, o));
const isFail = (cls, o) => outcomeName(cls, o) === "fail";
const isMissed = (cls, o) => outcomeName(cls, o) === "missed";

/**
 * The facet exponent x_e for one event (§2.3, E3/E5/E6/E8/E9/E10/E11). 0 = the event carries no facet evidence.
 * @param {any} ev
 */
export function facetWeight(ev) {
  const via = ev.via ?? "dialogue";
  let x = temper(ev) * (W_SRC[via] ?? 1);
  const pos = isPositiveOutcome(ev.cls, ev.outcome);
  if (ev.coincident && pos) return 0;                                   // E3: a lucky-correct proves nothing
  if (isPartial(ev.cls, ev.outcome)) return 0;                          // E5: partial never scores on U/T
  if (ev.grader === "llm" && pos && ev.spanOk === false) return 0;      // E6: span-less positive
  if (ev.unfamiliarContext && isFail(ev.cls, ev.outcome)) x *= 0.5;     // E8
  if (ev.deferenceDiscount && (isMissed(ev.cls, ev.outcome) || (ev.cls === "item.mcq2" && outcomeName(ev.cls, ev.outcome) === "wrong"))) x *= 0.5; // E9
  if (ev.preAttemptHelp && pos) x *= 0.5;                               // E11: help-assisted success ≠ unaided
  return x;
}

/**
 * Apply one evidence event to the facets of one skill. Returns a NEW facet record (or the same one when the event
 * carries nothing). `R` is the skill's retrievability at the session start from the PRE-event memory.
 * @param {FacetState} f  @param {any} ev  @param {number} R
 * @param {{ confusion?: any, delayDays?: number, cap?: number }} [o]
 */
export function applyFacetEvent(f, ev, R, o = {}) {
  const x = facetWeight(ev);
  const g = f.sessionId === ev.sessionId ? f : { ...f, S: 0, byClass: {}, sessionId: ev.sessionId };
  if (x === 0) return g;
  const { kR, u } = gatedEmission(ev, R, o.confusion);
  const raw = Math.log(kR / u) * x;
  const j = (g.byClass[ev.cls] ?? 0) + 1;
  const cap = o.cap ?? FACET.CAP;
  const S = Math.max(-cap, Math.min(cap, g.S + raw / j));
  const applied = S - g.S;
  const p = sigmoid(logit(g.p) + applied);
  const positive = raw > 0;
  return {
    ...g, S, p, byClass: { ...g.byClass, [ev.cls]: j }, n: g.n + 1,
    nonGame: g.nonGame || !GAME_VIA.has(ev.via ?? "dialogue"),
    pos: g.pos + (positive ? 1 : 0), neg: g.neg + (positive ? 0 : 1),
    lastPosDelayDays: positive ? Math.max(g.lastPosDelayDays, o.delayDays ?? 0) : g.lastPosDelayDays,
  };
}

/** Teaching transition (§2.3): p ← p + (1 − p)·τ, capped at +0.10 per episode. Never certifies on its own. */
export function applyFacetTeach(f, episodeId) {
  const gained = f.teachGain[episodeId] ?? 0;
  const step = Math.max(0, Math.min((1 - f.p) * FACET.TAU, FACET.TEACH_CAP - gained));
  if (step === 0) return f;
  return { ...f, p: f.p + step, teachGain: { ...f.teachGain, [episodeId]: gained + step } };
}

/** Rule-0 (E2) for facets: identical to the ledger's drop rule, so a dropped event changes no byte of U or T. */
export const facetDrop = (ev, ctx) => (ev.teach ? null : dropReason(ev, ctx));
export { facetsOfClass };
