// Computed numbers for COMPREHENSION-ENGINE.md (§1 LR table, §2 facet trajectories and the matched-model Monte Carlo,
// §3 budget arithmetic). Uses the REAL launch emission tables and BKT-R step functions from server/learner/kt/.
// No children. The Monte Carlo draws simulated answers from the SAME tables the engine inverts, so every accuracy it
// prints is an upper bound (inverse crime, STUDENT-SIM SIM2); its job is to show which policies CANNOT work, not
// which ones do. Run: node docs/research/comprehension/comp-engine-calc.mjs [--n 20000] [--seed 7]
import { EMISSIONS, OUTCOMES, confusion, fold } from "../../../server/learner/kt/outcomes.js";
import { spend, transition, tEff, logit, sigmoid } from "../../../server/learner/kt/bktr.js";

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? Number(process.argv[i + 1]) : d; };
const N = arg("--n", 20000), SEED = arg("--seed", 7);

// ---------- §1: launch LRs per class x grader (code = identity, llm = diagonal 0.7) ----------
const diagM = (d, n) => (d >= 1 ? null : Array.from({ length: n }, (_, t) => Array.from({ length: n }, (_, o) => (t === o ? d : (1 - d) / (n - 1)))));
const folded = (cls, M) => { const e = EMISSIONS[cls]; return { k: fold(e.k, M), u: fold(e.u, M) }; };
const lrTable = {};
for (const cls of Object.keys(EMISSIONS)) {
  const n = EMISSIONS[cls].k.length;
  const row = {};
  for (const [g, M] of [["code", null], ["llm", confusion("llm", n)]]) {
    const { k, u } = folded(cls, M);
    row[g] = Object.fromEntries(OUTCOMES[cls].slice(0, n).map((o, i) => [o, +(k[i] / u[i]).toFixed(2)]));
  }
  lrTable[cls] = row;
}

// ---------- §2: facets ----------
// Which latent each class informs (spec §2.2). K = BKT-R pL (every class, exactly as the ledger does today).
const U_CLASSES = new Set(["probe.why", "probe.teachback", "probe.errorspot", "probe.predict"]);
const T_CLASSES = new Set(["probe.transfer.near", "probe.transfer.far"]);
export const FACET = { U0: 0.2, T0: 0.2, CAP: Math.log(20) };
export const TH = { K_DO: 0.6, K_LEARNED: 0.95, U_FRAGILE: 0.6, U_UNDERSTOOD: 0.75, T_UNDERSTOOD: 0.6 };

function lr(cls, o, d, R = 1) {
  const n = EMISSIONS[cls].k.length;
  const { k, u } = folded(cls, diagM(d, n));
  return (R * k[o] + (1 - R) * u[o]) / u[o];
}
const newFacets = () => ({ K: 0.3, U: FACET.U0, T: FACET.T0, delayed: false, delayedMiss: 0, sess: null });
function openSession(f) { f.sess = { K: { sum: 0, byClass: {} }, U: { sum: 0, byClass: {} }, T: { sum: 0, byClass: {} }, ep: 0 }; }
function capSpend(b, cls, raw, cap) {
  const j = (b.byClass[cls] ?? 0) + 1, c = raw / j;
  const sum = Math.max(-cap, Math.min(cap, b.sum + c));
  return { applied: sum - b.sum, b: { sum, byClass: { ...b.byClass, [cls]: j } } };
}
/** One event: K by the ledger's rules (1/j, ±log 50, one T3 transition per episode); U/T by the facet rules. */
function apply(f, cls, o, { d = 0.7, grader = "llm", x = 1, R = 1, delayedCheck = false } = {}) {
  const dd = grader === "code" ? 1 : d;
  const L = lr(cls, o, dd, R);
  const k = spend(f.sess.K, cls, Math.log(L) * x); f.sess.K = k.budget;
  f.K = transition(sigmoid(logit(f.K) + k.applied), tEff("T3"));
  if (U_CLASSES.has(cls)) { const s = capSpend(f.sess.U, cls, Math.log(L) * x, FACET.CAP); f.sess.U = s.b; f.U = sigmoid(logit(f.U) + s.applied); }
  if (T_CLASSES.has(cls)) { const s = capSpend(f.sess.T, cls, Math.log(L) * x, FACET.CAP); f.sess.T = s.b; f.T = sigmoid(logit(f.T) + s.applied); }
  if (delayedCheck) {
    // Ledger semantics: C0 / transfer pass = success (resets misses); C3, C4, IDK, transfer fail = miss; C1/C2 neither.
    const name = OUTCOMES[cls][o];
    const pass = (cls === "item.open" && name === "C0") || (T_CLASSES.has(cls) && name === "pass");
    const miss = (cls === "item.open" && ["C3", "C4", "IDK"].includes(name)) || (T_CLASSES.has(cls) && name === "fail");
    if (pass) { f.delayed = true; f.delayedMiss = 0; } else if (miss) f.delayedMiss += 1;
  }
}
/** Spec §2.4 state ladder (misconception and durability branches omitted here: no bugs, two sessions). */
export function stateOf(f) {
  if (f.K < TH.K_DO) return "not_yet";
  if (f.U < TH.U_FRAGILE) return "shallow";
  if (f.K >= TH.K_LEARNED && f.U >= TH.U_UNDERSTOOD && f.T >= TH.T_UNDERSTOOD && f.delayed && f.delayedMiss === 0) return "understood";
  return "fragile";
}

// Deterministic trajectories (expected-outcome scripts) for the spec's worked examples.
function traj(steps) {
  const f = newFacets(); openSession(f);
  const out = [];
  for (const s of steps) {
    if (s === "NEW_SESSION") { openSession(f); continue; }
    const [cls, oName, opt = {}] = s;
    apply(f, cls, OUTCOMES[cls].indexOf(oName), opt);
    out.push(`${cls}:${oName}${opt.grader === "code" ? "(code)" : ""} -> K ${f.K.toFixed(3)} U ${f.U.toFixed(3)} T ${f.T.toFixed(3)} ${stateOf(f)}`);
  }
  return out;
}
const code = { grader: "code" };
const trajectories = {
  understander: traj([["item.open", "C0", code], ["item.open", "C0", code], ["probe.why", "full"], ["probe.errorspot", "caught_fixed", code],
    ["probe.transfer.near", "pass", code], "NEW_SESSION", ["item.open", "C0", { grader: "code", R: 0.9, delayedCheck: true }], ["probe.transfer.far", "pass", code]]),
  correct_answer_trap: traj([["item.open", "C0", code], ["item.open", "C0", code], ["item.open", "C0", code], ["probe.why", "none"],
    ["probe.predict", "mapped_wrong", code], "NEW_SESSION", ["item.open", "C0", { grader: "code", R: 0.9, delayedCheck: true }]]),
  game_only_8_predictions_w05: traj(Array.from({ length: 8 }, () => ["probe.predict", "right", { grader: "code", x: 0.5 }])),
  one_why_vs_two_llm_same_session: traj([["probe.why", "full"], ["probe.why", "full"]]),
};

// ---------- matched-model Monte Carlo (spec §8.3) ----------
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pick = (r, p) => { let u = r(), s = 0; for (let i = 0; i < p.length; i++) { s += p[i]; if (u < s) return i; } return p.length - 1; };
// Truth types: bits K (can do), U (can explain/evaluate), T (travels to new contexts), keep (retained at >= 20 h).
const TYPES = {
  not_yet: { K: 0, U: 0, T: 0, keep: 1, expect: "not_yet" },
  shallow: { K: 1, U: 0, T: 0, keep: 1, expect: "shallow" },          // the correct-answer trap
  fragile_bound: { K: 1, U: 1, T: 0, keep: 1, expect: "fragile" },     // understands, instance-bound
  fragile_forgets: { K: 1, U: 1, T: 1, keep: 0, expect: "fragile" },   // understood today, gone by the next session
  understood: { K: 1, U: 1, T: 1, keep: 1, expect: "understood" },
};
const bitFor = (cls, t, s) => { if (s > 1 && !t.keep) return 0; return U_CLASSES.has(cls) ? t.U : T_CLASSES.has(cls) ? t.T : t.K; };
function draw(r, cls, bit, grader, dTrue) {
  const e = EMISSIONS[cls], v = bit ? e.k : e.u;
  let o = pick(r, v);
  if (grader !== "code") { const n = v.length; o = pick(r, Array.from({ length: n }, (_, j) => (j === o ? dTrue : (1 - dTrue) / (n - 1)))); }
  return o;
}
// The ladder with the "do" signal and the forgot-is-not-never-understood branch (spec §2.4).
function ladder(f) {
  const does = f.recent.filter((x) => x === 1).length >= 2 || f.K >= TH.K_DO;
  if (f.U >= TH.U_FRAGILE && f.delayedMiss > 0) return "fragile";
  if (!does) return "not_yet";
  if (f.U < TH.U_FRAGILE) return "shallow";
  if (f.K >= TH.K_LEARNED && f.U >= TH.U_UNDERSTOOD && f.T >= TH.T_UNDERSTOOD && f.delayed && f.delayedMiss === 0) return "understood";
  return "fragile";
}
const kOnly = (f) => (!(f.recent.filter((x) => x === 1).length >= 2 || f.K >= TH.K_DO) ? "not_yet"
  : f.K >= TH.K_LEARNED && f.delayed && f.delayedMiss === 0 ? "understood" : "fragile");
const DECIDED = { U: [0.1, TH.U_UNDERSTOOD], T: [0.1, 0.7] };
const undecided = (p, [lo, hi]) => p > lo && p < hi;
/**
 * Adaptive scheduler policy (spec §3): per concept per session ≤ uMax U-probes (families rotate, never the same class
 * twice in a session), ≤ tMax T-probes (near first, far after a near pass or in later sessions), 2 practice items
 * (the first item of sessions ≥ 2 is the delayed check), and it stops probing a facet once it is decided.
 */
function runAdaptive(name, { sessions = 3, uOrder = [["probe.why", "llm"], ["probe.errorspot", "code"], ["probe.teachback", "llm"], ["probe.predict", "code"]],
  uMax = 2, tMax = 1, dAssumed = 0.7, dTrue = 0.7, rule = ladder, items = [["item.open", "code"], ["item.open", "code"]], gameX = 1 } = {}) {
  const r = rng(SEED), res = {};
  let probes = 0, events = 0, sessionsRun = 0;
  for (const [tn, t] of Object.entries(TYPES)) {
    const finals = {}; let ttd = 0, ttdN = 0;
    for (let i = 0; i < N; i++) {
      const f = { ...newFacets(), recent: [] }; let firstOk = null; const hist = [];
      for (let s = 1; s <= sessions; s++) {
        openSession(f); sessionsRun++;
        items.forEach(([cls, g], j) => {
          const o = draw(r, cls, bitFor(cls, t, s), g, dTrue);
          const delayedCheck = s > 1 && j === 0;
          apply(f, cls, o, { d: dAssumed, grader: g, R: s > 1 ? 0.9 : 1, delayedCheck });
          f.recent = [...f.recent, OUTCOMES[cls][o] === "C0" || OUTCOMES[cls][o] === "first_correct" ? 1 : 0].slice(-3);
          events++;
        });
        // A facet decided HIGH stops being probed; one decided LOW keeps one probe per session (after a re-teach the
        // state may have moved, and an unlucky early miss must not freeze an understander as shallow).
        const uCap = f.U >= DECIDED.U[1] ? 0 : f.U <= DECIDED.U[0] ? Math.min(1, uMax) : uMax;
        let u = 0; for (const [cls, g] of uOrder) {
          if (u >= uCap) break;
          const x = cls === "probe.predict" ? gameX : 1;
          apply(f, cls, draw(r, cls, bitFor(cls, t, s), g, dTrue), { d: dAssumed, grader: g, x, R: s > 1 ? 0.9 : 1 }); u++; probes++; events++;
        }
        const tCap = f.T >= DECIDED.T[1] ? 0 : f.T <= DECIDED.T[0] ? Math.min(1, tMax) : tMax;
        let tc = 0;
        while (tc < tCap && f.U >= 0.4) {
          const cls = s === 1 ? "probe.transfer.near" : "probe.transfer.far";
          apply(f, cls, draw(r, cls, bitFor(cls, t, s), "code", dTrue), { grader: "code", R: s > 1 ? 0.9 : 1 }); tc++; probes++; events++;
        }
        hist.push(rule(f));
      }
      const fin = hist[hist.length - 1]; finals[fin] = (finals[fin] ?? 0) + 1;
      if (fin === t.expect) { let k = hist.length - 1; while (k > 0 && hist[k - 1] === t.expect) k--; ttd += k + 1; ttdN++; }
    }
    res[tn] = { final: Object.fromEntries(Object.entries(finals).sort().map(([k, v]) => [k, +(v / N).toFixed(3)])),
      correct: +((finals[t.expect] ?? 0) / N).toFixed(3), false_understood: tn === "understood" ? null : +((finals.understood ?? 0) / N).toFixed(3),
      mean_sessions_to_detect_if_correct: ttdN ? +(ttd / ttdN).toFixed(2) : null };
  }
  const types = Object.keys(TYPES), nonU = types.filter((k) => k !== "understood");
  return { policy: name, sessions, summary: {
    macro_acc: +(types.reduce((a, k) => a + res[k].correct, 0) / types.length).toFixed(3),
    false_understood_max: Math.max(...nonU.map((k) => res[k].false_understood)),
    shallow_called_understood: res.shallow.false_understood,
    understood_detected: res.understood.correct,
    probes_per_concept_session: +(probes / sessionsRun).toFixed(2), events_per_concept_session: +(events / sessionsRun).toFixed(2) }, by_type: res };
}
const mc = {
  note: `matched-model MC, n=${N} per truth type, seed ${SEED}; answers drawn from the engine's own tables => upper bounds only`,
  adaptive_3s: runAdaptive("adaptive mixed graders, 3 sessions"),
  adaptive_5s: runAdaptive("adaptive mixed graders, 5 sessions", { sessions: 5 }),
  adaptive_3s_grader_worse: runAdaptive("adaptive, LLM grader true diagonal 0.55 vs assumed 0.7", { dTrue: 0.55 }),
  adaptive_3s_llm_only_U: runAdaptive("adaptive, U evidence only from LLM-graded why/teach-back", { uOrder: [["probe.why", "llm"], ["probe.teachback", "llm"]] }),
  adaptive_3s_one_U_probe: runAdaptive("adaptive, max 1 U probe per session", { uMax: 1 }),
  adaptive_3s_game_predict_w05: runAdaptive("adaptive, predictions are game commits at w=0.5", { uOrder: [["probe.predict", "code"], ["probe.why", "llm"], ["probe.errorspot", "code"]], gameX: 0.5 }),
  quiz_only_k_only_rule: runAdaptive("overt quiz: 4 items/session, no probes, K-only mastery rule", { uMax: 0, tMax: 0, rule: kOnly, items: [["item.open", "code"], ["item.mcq4", "code"], ["item.mcq4", "code"], ["item.open", "code"]] }),
  quiz_only_facet_rule: runAdaptive("overt quiz, facet ladder", { uMax: 0, tMax: 0, items: [["item.open", "code"], ["item.mcq4", "code"], ["item.mcq4", "code"], ["item.open", "code"]] }),
};

// ---------- §3: budget arithmetic ----------
// Child turns per minute ≈ 2 [U, from the realtime bake-off turn lengths]; assessment-weight share caps per band (spec §3.3).
const budget = {};
for (const [band, min, share, win] of [["B1", 15, 0.2, 1.5], ["B2", 20, 0.2, 2.0], ["B3", 25, 0.25, 2.5], ["B4", 30, 0.25, 2.5]]) {
  const turns = Math.round(min * 2), weight = +(turns * share).toFixed(1);
  budget[band] = { minutes: min, childTurns: turns, sessionTestWeight: weight, per10TurnWindow: win,
    eg_short_probes_at_w05: Math.floor(weight / 0.5), eg_overt_items_at_w1: Math.floor(weight / 1) };
}

console.log(JSON.stringify({ lrTable, facet: FACET, thresholds: TH, trajectories, mc, budget }, null, 1));
