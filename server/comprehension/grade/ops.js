// Code grading operators (COMPREHENSION-ENGINE.md §4.2) and the label → outcome maps for the closed-label LLM
// operators. Grading is classification against verified kit keys, never free grading (CE5).
import { outcomeIndex } from "../../learner/kt/outcomes.js";
import { numberPhrases } from "../../grading/spoken-number.js";
import { tokens } from "./span.js";

/**
 * R-KEY. key: a number (numeric compare with tolerance) or { accept: string[] } (folded-token match of any accepted
 * answer). Returns 'correct' | 'wrong' | 'NA' (NA = nothing gradable said: no update, never a wrong answer).
 */
// A denial next to the accepted words ("parallel nahi", "not parallel") is never the key (VALUES-100 V1.1,
// evals/grading-truth: 162/162 negated keys were credited by token containment).
const DENY = /(?:^|[^\p{L}])(?:not|nahi|nahin|nhi|no|galat|wrong|isn'?t)(?![\p{L}])/iu;
export function rKey(text, key, o = {}) {
  if (typeof key === "number" || (typeof key === "string" && /^-?\d+(\.\d+)?$/.test(key))) {
    // the ONE number reader (server/grading/spoken-number.js); the child's answer is the last number phrase
    // ("3... nahi, 4"), a reply with no readable number is NA, never wrong
    const ph = numberPhrases(text);
    if (!ph || !ph.length) return "NA";
    const k = Number(key), tol = Math.max(o.tol ?? 1e-9, (o.relTol ?? 0) * Math.abs(k));
    return Math.abs(ph.at(-1) - k) <= tol ? "correct" : "wrong";
  }
  const t = tokens(text);
  if (!t.length) return "NA";
  const joined = ` ${t.join(" ")} `;
  const accept = (key?.accept ?? []).map((a) => ` ${tokens(a).join(" ")} `);
  return accept.some((a) => joined.includes(a)) && !DENY.test(String(text)) ? "correct" : "wrong";
}

/**
 * R-OPT. The chosen option (index or text) → { verdict: 'key' | 'misc' | 'other', misconceptionId? }.
 * @param {number|string|null} choice @param {{ text: string, correct?: boolean, misconceptionId?: string|null }[]} options
 */
export function rOpt(choice, options) {
  let opt = typeof choice === "number" ? options[choice] : null;
  if (!opt && typeof choice === "string") {
    const c = ` ${tokens(choice).join(" ")} `;
    opt = options.find((o) => c.includes(` ${tokens(o.text).join(" ")} `)) ?? null;
  }
  if (!opt) return { verdict: "other" };
  if (opt.correct) return { verdict: "key" };
  return opt.misconceptionId ? { verdict: "misc", misconceptionId: opt.misconceptionId } : { verdict: "other" };
}

/** R-OPT verdict → outcome index of the shape's class. */
export function optOutcome(cls, r) {
  if (cls === "probe.predict") return outcomeIndex(cls, r.verdict === "key" ? "right" : r.verdict === "misc" ? "mapped_wrong" : "other");
  return outcomeIndex(cls, r.verdict === "key" ? "first_correct" : "wrong");
}

/**
 * R-CATCH: did the child reject the planted step, locate it, fix it? (The classifier supplies these as booleans from
 * the child's turn; R-EXP judges only the reason.) → errorspot outcome index.
 */
export function rCatch({ rejected, located, fixed }) {
  if (rejected && located && fixed) return outcomeIndex("probe.errorspot", "caught_fixed");
  if (rejected) return outcomeIndex("probe.errorspot", "caught");
  return outcomeIndex("probe.errorspot", "missed");
}

export const EXP_LABELS = Object.freeze(["present", "partial", "absent", "contradicted"]);
export const INST_LABELS = Object.freeze(["valid_instance", "invalid_misc", "irrelevant"]);
export const MIS_LABELS_NONE = "none_of_these";

/** R-EXP label (one expectation) → probe.why outcome. contradicted = says the opposite: the misconception outcome. */
export const whyOutcome = (label) => outcomeIndex("probe.why", { present: "full", partial: "partial", absent: "none", contradicted: "misconception" }[label] ?? "none");

/**
 * Teach-back coverage over expectations (one R-EXP call each): share present → high ≥ 2/3, mid ≥ 1/3, else low;
 * any contradicted expectation → misconception.
 */
export function teachbackOutcome(labels) {
  if (!labels.length) return null;
  if (labels.includes("contradicted")) return outcomeIndex("probe.teachback", "misconception");
  const cov = labels.filter((l) => l === "present").length / labels.length;
  return outcomeIndex("probe.teachback", cov >= 2 / 3 ? "high" : cov >= 1 / 3 || labels.includes("partial") ? "mid" : "low");
}

/** R-INST label → transfer outcome (valid instance = pass). */
export const instOutcome = (cls, label) => outcomeIndex(cls, label === "valid_instance" ? "pass" : "fail");
