// Evidence classes, their categorical outcomes and launch emissions (LEARNER-MODEL §6.1 table; kt-algorithms
// §1.2 k/u columns). Every number here is a launch prior [U], refit by EM per cluster in the nightly job
// (kt_params). The update uses k and u (not just LR) because grader-noise folding (rule 2) needs the
// distributions; LR = k/u.
//
// item.open gained IDK ("pata nahi" before attempting, LR 0.5) and NA (no attempt: no update). IDK's mass
// was taken from the C4 column so the other LRs keep their table values; k is then renormalised, which
// moves every item.open LR by < 1% (asserted in tests/learner-kt.test.mjs).

/** @typedef {import("../../../shared/learner").EvidenceClass} EvidenceClass */

const norm = (v) => { const s = v.reduce((a, b) => a + b, 0); return v.map((x) => x / s); };

/** Outcome names per class, index order = EvidenceEvent.outcome. */
export const OUTCOMES = Object.freeze({
  "item.open": ["C0", "C1", "C2", "C3", "C4", "IDK", "NA"],
  "item.mcq2": ["first_correct", "wrong"],
  "item.mcq3": ["first_correct", "wrong"],
  "item.mcq4": ["first_correct", "wrong"],
  "probe.why": ["full", "partial", "none", "misconception"],
  "probe.teachback": ["high", "mid", "low", "misconception"],
  "probe.transfer.near": ["pass", "fail"],
  "probe.transfer.far": ["pass", "fail"],
  "probe.errorspot": ["caught_fixed", "caught", "missed"],
  "probe.predict": ["right", "mapped_wrong", "other"],
  solo: ["C0", "C1", "fail"],
  para: ["fluent", "hesitant"],
});
export const EVIDENCE_CLASSES = Object.freeze(Object.keys(OUTCOMES));

const openU = [0.094, 0.08, 0.17, 0.25, 0.306, 0.10];
const openLR = [8.0, 1.0, 0.35, 0.16, 0.05, 0.5];
const mcq = (K) => ({ k: [0.9, 0.1], u: [1 / K, 1 - 1 / K] });

/**
 * k[o] = P(o | known), u[o] = P(o | not known). NA has no emission (rule 0: no update), so item.open's
 * vectors have 6 entries for the 7 outcomes.
 */
export const EMISSIONS = Object.freeze({
  "item.open": { k: norm(openU.map((u, i) => u * openLR[i])), u: openU },
  "item.mcq2": mcq(2), "item.mcq3": mcq(3), "item.mcq4": mcq(4),
  "probe.why": { k: [0.60, 0.25, 0.12, 0.03], u: [0.08, 0.22, 0.50, 0.20] },
  "probe.teachback": { k: [0.55, 0.30, 0.12, 0.03], u: [0.08, 0.25, 0.47, 0.20] },
  "probe.transfer.near": { k: [0.85, 0.15], u: [0.15, 0.85] },
  "probe.transfer.far": { k: [0.65, 0.35], u: [0.08, 0.92] },
  "probe.errorspot": { k: [0.60, 0.15, 0.25], u: [0.12, 0.13, 0.75] },
  "probe.predict": { k: [0.60, 0.15, 0.25], u: [0.35, 0.35, 0.30] },
  // solo = item.open C0 / C1 / C4 LRs (8, 1, 0.05): u solves sum(u) = sum(LR*u) = 1 with u[C1] = 0.08.
  solo: { k: [8 * 0.10989, 0.08, 0.05 * 0.81011], u: [0.10989, 0.08, 0.81011] },
  para: { k: [0.60, 0.40], u: [0.50, 0.50] },
});

/** Outcome name of an event (undefined for an out-of-range index). */
export const outcomeName = (cls, o) => OUTCOMES[cls]?.[o];
export const outcomeIndex = (cls, name) => OUTCOMES[cls]?.indexOf(name) ?? -1;

/** Item-type classes: an attempt at an item (retrieval-type for FSRS, opportunity for wheel-spin). */
export const ITEM_CLASSES = new Set(["item.open", "item.mcq2", "item.mcq3", "item.mcq4", "solo"]);
export const isMcq = (cls) => cls === "item.mcq2" || cls === "item.mcq3" || cls === "item.mcq4";

/** No-update outcomes (rule 0). */
export const isNoUpdate = (cls, o) => outcomeName(cls, o) === "NA";

/** Item form (PRODUCT-DESIGN §6.4.1): mcq is recognition unless the event says otherwise; the rest produce. */
export const formOf = (ev) => ev.form ?? (isMcq(ev.cls) ? "recognise" : "produce");

/**
 * The value an outcome adds to `recent` (last 3 unaided-scored outcomes): 1 for an unaided first-try
 * success, 0 for any other item outcome, null when the event is not item-scored (probes, NA, para).
 */
export function recentValue(cls, o) {
  const n = outcomeName(cls, o);
  if (!ITEM_CLASSES.has(cls) || n === undefined || n === "NA") return null;
  return n === "C0" || n === "first_correct" ? 1 : 0;
}

/**
 * FSRS grade from evidence, never self-rating (rule 8): 1 = fail/C3/C4 (IDK counts as a failed retrieval
 * [U]), 2 = C1/C2, 3 = C0; 4 is C0 plus a passed transfer/why in the same episode (upgraded by the ledger).
 * null = not a retrieval-type outcome.
 */
export function fsrsGrade(cls, o) {
  const n = outcomeName(cls, o);
  if (!ITEM_CLASSES.has(cls) || n === undefined || n === "NA") return null;
  if (n === "C0" || n === "first_correct") return 3;
  if (n === "C1" || n === "C2") return 2;
  return 1;
}

/** (b) generative or near-transfer pass (PRODUCT-DESIGN §6.4.1): produce-form, unaided. */
export function isGenerativePass(cls, o) {
  const n = outcomeName(cls, o);
  return (cls === "probe.why" && n === "full") || (cls === "probe.teachback" && n === "high")
    || ((cls === "probe.transfer.near" || cls === "probe.transfer.far") && n === "pass")
    || (cls === "probe.errorspot" && n === "caught_fixed");
}

/** (a) unaided correct: C0 on an item or a solo round (form is checked by the caller). */
export const isUnaidedCorrect = (cls, o) => (cls === "item.open" || cls === "solo" || isMcq(cls)) && recentValue(cls, o) === 1;

/** (c) delayed success: C0 on an item, a near-transfer pass, or a caught+fixed error-spot (produce-form). */
export const isDelayedSuccess = (cls, o) => isUnaidedCorrect(cls, o)
  || (cls === "probe.transfer.near" && outcomeName(cls, o) === "pass") || (cls === "probe.errorspot" && outcomeName(cls, o) === "caught_fixed");

/** A delayed-check miss (FSRS G = 1): C3, C4, IDK, a failed item or transfer. G = 2 is neither. */
export function isDelayedMiss(cls, o) {
  const g = fsrsGrade(cls, o);
  if (g !== null) return g === 1;
  return (cls === "probe.transfer.near" || cls === "probe.transfer.far") && outcomeName(cls, o) === "fail";
}

/**
 * Grader confusion M[true][observed] (rule 2): identity for code; a diagonal default for LLM (0.7, KT R27)
 * and human (0.9 [U]) graders, the rest spread evenly. Per (class, graderVersion) overrides come from kt_params.
 */
export function confusion(grader, n, overrides) {
  const key = grader;
  if (overrides?.[key]) return overrides[key];
  const d = grader === "code" ? 1 : grader === "llm" ? 0.7 : 0.9;
  if (d === 1 || n < 2) return null;            // identity
  const off = (1 - d) / (n - 1);
  return Array.from({ length: n }, (_, t) => Array.from({ length: n }, (_, o) => (t === o ? d : off)));
}

/** k' = k·M, u' = u·M. */
export function fold(vec, M) {
  if (!M) return vec;
  return vec.map((_, o) => vec.reduce((s, v, t) => s + v * M[t][o], 0));
}
