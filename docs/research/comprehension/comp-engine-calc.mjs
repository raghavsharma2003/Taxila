// Computed numbers for COMPREHENSION-ENGINE.md §1-§3. Pure arithmetic over the REAL launch emission tables
// (server/learner/kt/outcomes.js); no children, no simulator. Run: node docs/research/comprehension/comp-engine-calc.mjs
import { EMISSIONS, OUTCOMES, confusion, fold } from "../../../server/learner/kt/outcomes.js";

const lr = (cls, grader) => {
  const e = EMISSIONS[cls], M = confusion(grader, e.k.length);
  const k = fold(e.k, M), u = fold(e.u, M);
  return OUTCOMES[cls].slice(0, k.length).map((o, i) => [o, +(k[i] / u[i]).toFixed(2)]);
};
const out = { lr: {}, facet: {}, budget: {} };
for (const cls of Object.keys(EMISSIONS)) out.lr[cls] = { code: lr(cls, "code"), llm: lr(cls, "llm") };

// Facet accumulator (spec §2.3): logit F += Σ (1/j)·x·log LR, session clamp ±log 20.
const logit = (p) => Math.log(p / (1 - p)), sig = (x) => 1 / (1 + Math.exp(-x));
const CAP = Math.log(20);
function run(p0, steps) {           // steps: [cls, outcomeIdx, grader, x]
  let sum = 0; const byClass = {}; let p = p0;
  for (const [cls, o, g, x = 1] of steps) {
    const L = lr(cls, g)[o][1];
    const j = (byClass[cls] = (byClass[cls] ?? 0) + 1);
    const c = (x * Math.log(L)) / j;
    const ns = Math.max(-CAP, Math.min(CAP, sum + c));
    p = sig(logit(p0) + ns); sum = ns;
  }
  return +p.toFixed(3);
}
const U0 = 0.2, T0 = 0.2;
out.facet = {
  U_after_5_correct_items: U0,                                         // by rule: item correctness carries LR_U = 1
  U_why_full_llm: run(U0, [["probe.why", 0, "llm"]]),
  U_why_full_code: run(U0, [["probe.why", 0, "code"]]),
  U_why_full_llm_x2_same_session: run(U0, [["probe.why", 0, "llm"], ["probe.why", 0, "llm"]]),
  U_why_full_plus_teachback_high_llm: run(U0, [["probe.why", 0, "llm"], ["probe.teachback", 0, "llm"]]),
  U_why_plus_teachback_plus_errorspot_code: run(U0, [["probe.why", 0, "llm"], ["probe.teachback", 0, "llm"], ["probe.errorspot", 0, "code"]]),
  U_why_partial_llm: run(U0, [["probe.why", 1, "llm"]]),
  U_why_misconception_llm: run(U0, [["probe.why", 3, "llm"]]),
  U_predict_right_game_w05_x4: run(U0, [["probe.predict", 0, "code", 0.5], ["probe.predict", 0, "code", 0.5], ["probe.predict", 0, "code", 0.5], ["probe.predict", 0, "code", 0.5]]),
  T_near_pass_code: run(T0, [["probe.transfer.near", 0, "code"]]),
  T_far_pass_code: run(T0, [["probe.transfer.far", 0, "code"]]),
  T_near_plus_far_code: run(T0, [["probe.transfer.near", 0, "code"], ["probe.transfer.far", 0, "code"]]),
  T_far_pass_game_w05: run(T0, [["probe.transfer.far", 0, "code", 0.5]]),
  T_far_fail_unfamiliar_x05_from_06: run(0.6, [["probe.transfer.far", 1, "code", 0.5]]),
  T_near_fail_from_06: run(0.6, [["probe.transfer.near", 1, "code"]]),
};
// Budget arithmetic (spec §3.3): child turns per minute ≈ 2 [U]; assessment-only share caps.
for (const [band, min, share] of [["B1", 15, 0.2], ["B2", 20, 0.2], ["B3", 25, 0.25], ["B4", 30, 0.25]]) {
  const turns = Math.round(min * 2), slots = Math.floor(turns * share);
  out.budget[band] = { minutes: min, childTurns: turns, assessmentSlots: slots };
}
console.log(JSON.stringify(out, null, 1));
