// Comprehension-engine simulator battery (COMPREHENSION-ENGINE.md §8): 24 personas with hidden truth × seeds × the
// engine, its ablations (no delayed probes / no game evidence / no voice features / freeze-low) and the controls that
// must FAIL (quiz-bot K-only, samjha, lecture, why-every-turn). Reports detection accuracy, time to detect, false
// mastery, missed understanding by verbal ability, probes per concept and test load. With --llm, one extra engine
// leg where DeepSeek-V4.1-Flash (taxila-ds41) plays the child's open-language turns and the real closed-label grader
// (DeepSeek-V4-Pro, span-checked) grades them.
//
// Usage: node evals/comprehension-sim/run.mjs [--seeds 30] [--llm] [--llm-seeds 1] [--out file]
//   (LLM leg: NODE_USE_ENV_PROXY=1 in this sandbox; env from .env.local)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { PERSONAS } from "./personas.mjs";
import { runChild, POLICIES, FAMILIES } from "./sim.mjs";

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true) : d; };
const SEEDS = Number(opt("--seeds", 30));
const LLM = !!opt("--llm", false);
const LLM_SEEDS = Number(opt("--llm-seeds", 1));
const POLS = String(opt("--policies", Object.keys(POLICIES).join(","))).split(",");
const FAMS = String(opt("--families", FAMILIES.join(","))).split(",");
const ROOT = new URL("../../", import.meta.url);

const STATES = ["not_yet", "shallow", "fragile", "understood", "durable"];
const TYPES = ["not_yet", "shallow", "fragile_bound", "fragile_forgets", "understood"];
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const r3 = (x) => (x == null ? null : Math.round(x * 1000) / 1000);
const median = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.floor((s.length - 1) / 2)]; };

/** How quiz-like the probing is: the distribution of probes per concept-session (every concept-session that got ≥ 1). */
function probeShape(runs) {
  const cs = runs.flatMap((r) => Object.values(r.counters.perCS ?? {}));
  if (!cs.length) return null;
  const ns = cs.map((c) => c.n).sort((a, b) => a - b);
  const reasons = {};
  for (const c of cs) for (const [k, v] of Object.entries(c.reasons)) reasons[k] = (reasons[k] ?? 0) + v;
  const tot = ns.reduce((a, b) => a + b, 0);
  return { concept_sessions_probed: cs.length, p50: ns[Math.floor(ns.length / 2)], p95: ns[Math.floor(ns.length * 0.95)], max: ns.at(-1),
    mandatory_share: r3(cs.reduce((a, c) => a + c.mand, 0) / tot), u_probes_over_3: r3(mean(cs.map((c) => +(c.u > 3)))),
    by_reason: Object.fromEntries(Object.entries(reasons).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, r3(v / tot)])) };
}

/** Metrics over one policy's runs. */
export function metrics(runs) {
  const recs = runs.flatMap((r) => r.concepts.filter((c) => c.states.length).map((c) => ({ ...c, persona: r.persona, archetype: r.archetype, verbal: r.verbal })));
  const at = (c, sessionIdx) => c.states.find((s) => s.session === sessionIdx) ?? null;
  const fin = (c) => c.states.at(-1);
  const byType = {};
  for (const t of TYPES) {
    const xs = recs.filter((c) => fin(c).type === t);
    const s3 = xs.map((c) => at(c, Math.min(4, c.firstSeen + 2))).filter(Boolean);
    byType[t] = { n: xs.length, acc_final: r3(mean(xs.map((c) => +fin(c).ok))), acc_after3: r3(mean(s3.map((s) => +s.ok))),
      dist_final: Object.fromEntries(STATES.map((s) => [s, r3(mean(xs.map((c) => +(fin(c).state === s))))]).filter(([, v]) => v)) };
  }
  const present = TYPES.filter((t) => byType[t].n);
  const macro = (k) => r3(mean(present.map((t) => byType[t][k]).filter((v) => v != null)));
  const nonU = recs.filter((c) => fin(c).type !== "understood");
  const certified = (s) => s === "understood" || s === "durable";
  // time to detect: sessions of exposure until the state is right and stays right
  const ttd = (c) => { let i = c.states.length; while (i > 0 && c.states[i - 1].ok) i--; return i < c.states.length ? c.states[i].session - c.firstSeen + 1 : null; };
  const und = recs.filter((c) => fin(c).type === "understood");
  const ttdU = und.map(ttd);
  const lowV = und.filter((c) => c.verbal < 0.5), hiV = und.filter((c) => c.verbal >= 0.5);
  const missed = (xs) => mean(xs.map((c) => +["not_yet", "shallow"].includes(fin(c).state)));
  const loads = runs.flatMap((r) => r.load);
  const topicSessions = runs.length * 12;                                  // 6 + 6 concept-topic slots over the 5 sessions
  const probes = runs.reduce((a, r) => a + r.counters.probeTurns, 0);
  const byArch = {};
  for (const a of [...new Set(recs.map((c) => c.archetype))]) {
    const xs = recs.filter((c) => c.archetype === a);
    byArch[a] = { acc_final: r3(mean(xs.map((c) => +fin(c).ok))), false_mastery: r3(mean(xs.filter((c) => fin(c).type !== "understood").map((c) => +certified(fin(c).state)))),
      certified: r3(mean(xs.map((c) => +certified(fin(c).state)))) };
  }
  return {
    n_child_concepts: recs.length,
    CE_M1_macro_acc_final: macro("acc_final"), CE_M1_macro_acc_after3: macro("acc_after3"),
    CE_M2_understood_detected_final: byType.understood.acc_final, CE_M2_median_sessions_to_detect_understood: median(ttdU.filter((x) => x != null)),
    CE_M2_understood_never_detected: r3(mean(ttdU.map((x) => +(x == null)))),
    CE_M3_false_mastery: r3(mean(nonU.map((c) => +certified(fin(c).state)))),
    CE_M3_false_mastery_shallow: r3(mean(recs.filter((c) => fin(c).type === "shallow").map((c) => +certified(fin(c).state)))),
    CE_M4_missed_understanding_verbal_gap_pp: lowV.length && hiV.length ? r3(100 * (missed(lowV) - missed(hiV))) : null,
    probes_per_concept_session: r3(probes / topicSessions),
    CE_M5_load_per10_mean: r3(mean(loads.map((l) => l.per10))), CE_M5_session_weight_over_cap: r3(mean(loads.map((l) => +(l.weight > l.cap + 1e-9)))),
    CE_M5_lexicon_hits: runs.reduce((a, r) => a + r.counters.lexicon, 0), CE_M5_repeat_questions: runs.reduce((a, r) => a + r.counters.repeats, 0),
    reteaches_per_child: r3(mean(runs.map((r) => r.counters.reteach))), woven_per_child: r3(mean(runs.map((r) => r.counters.wovenHosted))),
    callbacks_per_child: r3(mean(runs.map((r) => r.counters.callbacks))),
    held_settle_rate: (() => { const h = runs.reduce((a, r) => a + (r.counters.held ?? 0), 0); return h ? r3(runs.reduce((a, r) => a + (r.counters.settled ?? 0), 0) / h) : null; })(),
    late_corrections_per_child: r3(mean(runs.map((r) => r.counters.late ?? 0))),
    kit_items_code_share: (() => { const n = runs.reduce((a, r) => a + (r.counters.kitItems ?? 0), 0); return n ? r3(runs.reduce((a, r) => a + (r.counters.kitCode ?? 0), 0) / n) : null; })(),
    probe_shape: probeShape(runs),
    by_type: byType, by_archetype: byArch,
  };
}

function loadEnv() {
  const f = new URL(".env.local", ROOT);
  if (!existsSync(f)) return;
  for (const line of readFileSync(f, "utf8").split("\n")) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
  }
}

async function pool(items, n, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const j = i++; out[j] = await fn(items[j]); } }));
  return out;
}

const t0 = Date.now();
const result = { date: new Date().toISOString().slice(0, 10), seeds: SEEDS, personas: PERSONAS.length, concepts: 6, sessions: 5,
  method: "code-played children from hidden truth bits + behaviour params (personas.mjs), separate generative model from the engine's emission tables; real engine code; author-set response probabilities => gates mechanics, not efficacy",
  label: "simulated · gains=author · scope=compliance · not evidence of learning", families: {} };
for (const fam of FAMS) {
  console.log(`simulated · family=${fam}${fam === "cfrag" ? " (cfrag-lite)" : " (matched: upper bound)"} · gains=author · scope=compliance · not evidence of learning`);
  const policies = (result.families[fam] = { policies: {} }).policies;
  for (const pol of POLS) {
  const runs = [];
  for (const P of PERSONAS) for (let s = 0; s < SEEDS; s++) runs.push(await runChild({ persona: P, seed: s, policy: pol, family: fam }));
  policies[pol] = metrics(runs);
  const m = policies[pol];
  console.log(`${fam} ${pol.padEnd(15)} acc ${m.CE_M1_macro_acc_final} (after3 ${m.CE_M1_macro_acc_after3}) · understood found ${m.CE_M2_understood_detected_final} · ttd ${m.CE_M2_median_sessions_to_detect_understood} · false-mastery ${m.CE_M3_false_mastery} (shallow ${m.CE_M3_false_mastery_shallow}) · verbal gap ${m.CE_M4_missed_understanding_verbal_gap_pp}pp · probes/concept-session ${m.probes_per_concept_session} · load/10 ${m.CE_M5_load_per10_mean} · over-cap ${m.CE_M5_session_weight_over_cap} · lexicon ${m.CE_M5_lexicon_hits} · probes/concept-session p50 ${m.probe_shape?.p50 ?? "-"} p95 ${m.probe_shape?.p95 ?? "-"} max ${m.probe_shape?.max ?? "-"}`);
  }
}
result.policies = result.families.bkt2?.policies;                          // back-compat: the bkt2 table at the old key

// ---- the honest number, its ceiling, the battery's validity, and the engine-vs-live divergence (W1-C #4) ----
/** The spec bars (COMPREHENSION-ENGINE.md §8.2): a row "fails a bar" when any of these does not hold. */
const BARS = {
  CE_M1: (m) => m.CE_M1_macro_acc_final >= 0.70,
  CE_M3: (m) => m.CE_M3_false_mastery <= 0.05 && (m.CE_M3_false_mastery_shallow ?? 0) <= 0.02,
  CE_M4: (m) => m.CE_M4_missed_understanding_verbal_gap_pp == null || m.CE_M4_missed_understanding_verbal_gap_pp <= 10,
  CE_M5: (m) => m.CE_M5_session_weight_over_cap === 0 && m.CE_M5_lexicon_hits === 0,
};
/** Rows that must FAIL at least one bar, or the battery cannot see what they stand for (§8.3; X7). */
const MUST_FAIL = ["mut_vc2_partial_as_full", "mut_vc4_game_full_weight", "quiz_bot", "samjha", "lecture", "why_every_turn", "gamer"];
/**
 * Why `engine` and `live` may differ by more than 0.03 (macro accuracy, final). A divergence with no entry here FAILS
 * the run: the published engine number must never drift from the deployed one silently.
 */
const DIVERGENCE_REASONS = {
  bkt2: "live poses 6 of 36 shapes (LIVE_PROBE_SHAPES: why-class only; R-CATCH / predict / transfer shapes need graders the live lane lacks), real kits carry none of characterView/myth/counterfactual/instances/representations/weaveHosts/solver, kit error-spot and most transfer answers are llm-graded with no span (no U/T), and woven sub-steps have no host item. Closing it is W3-A (code-graded R-CATCH, verbal-fair grading) and W3-B (kit fields, CMP probes).",
  cfrag: "same causes as bkt2 (live shape subset, kit fields absent, llm-graded kit items carry no U/T, no woven hosting); W3-A and W3-B close it.",
};
let runFails = false;
result.headline = { policy: "live", note: "THE comprehension number: the deployed configuration; engine is the spec configuration", families: {} };
result.battery = {};
for (const [fam, { policies: P }] of Object.entries(result.families)) {
  const failed = (m) => Object.entries(BARS).filter(([, ok]) => !ok(m)).map(([k]) => k);
  for (const [name, m] of Object.entries(P)) {
    m.bars_failed = failed(m);
    if (P.oracle?.CE_M1_macro_acc_final) m.frac_of_oracle = r3(m.CE_M1_macro_acc_final / P.oracle.CE_M1_macro_acc_final);
  }
  const must = MUST_FAIL.filter((k) => P[k]).map((k) => ({ policy: k, bars_failed: P[k].bars_failed, fails_any: P[k].bars_failed.length > 0, fails_CE_M3: P[k].bars_failed.includes("CE_M3") }));
  // Differential check: a bar the reference ALSO fails says nothing about the mutant. The mutant must be worse than its
  // own reference by ≥ 0.02 on false mastery, macro accuracy, or the truth type its bug inflates (not_yet / shallow).
  const REFERENCE = { mut_vc2_partial_as_full: "engine", mut_vc4_game_full_weight: "engine_game_exploit" };
  const diff = Object.entries(REFERENCE).filter(([m, ref]) => P[m] && P[ref]).map(([m, ref]) => {
    const a = P[m], b = P[ref];
    const d = { false_mastery: r3(a.CE_M3_false_mastery - b.CE_M3_false_mastery), macro_acc: r3(b.CE_M1_macro_acc_final - a.CE_M1_macro_acc_final),
      not_yet_acc: r3((b.by_type.not_yet.acc_final ?? 0) - (a.by_type.not_yet.acc_final ?? 0)), shallow_acc: r3((b.by_type.shallow.acc_final ?? 0) - (a.by_type.shallow.acc_final ?? 0)) };
    return { mutant: m, reference: ref, worse_by: d, seen: Object.values(d).some((x) => x >= 0.02) };
  });
  result.battery[fam] = { valid: must.every((x) => x.fails_any), must_fail: must, differential: diff, differential_valid: diff.every((x) => x.seen) };
  for (const x of diff) console.log(`${fam} ${x.mutant} vs ${x.reference}: worse by ${JSON.stringify(x.worse_by)} → ${x.seen ? "SEEN" : "NOT SEEN"}`);
  if (must.length) console.log(`${fam} battery ${result.battery[fam].valid ? "VALID" : "INVALID"}: ${must.map((x) => `${x.policy} fails [${x.bars_failed.join(",") || "none"}]`).join(" · ")}`);
  if (P.live) {
    result.headline.families[fam] = { macro_acc_final: P.live.CE_M1_macro_acc_final, macro_acc_after3: P.live.CE_M1_macro_acc_after3, understood_found: P.live.CE_M2_understood_detected_final,
      false_mastery: P.live.CE_M3_false_mastery, verbal_gap_pp: P.live.CE_M4_missed_understanding_verbal_gap_pp, settle_rate: P.live.held_settle_rate, frac_of_oracle: P.live.frac_of_oracle ?? null };
    console.log(`HEADLINE ${fam} live: acc ${P.live.CE_M1_macro_acc_final} · understood found ${P.live.CE_M2_understood_detected_final} · false-mastery ${P.live.CE_M3_false_mastery} · verbal gap ${P.live.CE_M4_missed_understanding_verbal_gap_pp}pp · settle ${P.live.held_settle_rate}${P.live.frac_of_oracle ? ` · ${P.live.frac_of_oracle} of oracle` : ""}`);
  }
  if (P.live && P.engine) {
    const gap = Math.abs(P.engine.CE_M1_macro_acc_final - P.live.CE_M1_macro_acc_final);
    const reason = gap > 0.03 ? DIVERGENCE_REASONS[fam] ?? null : null;
    (result.divergence ??= {})[fam] = { engine: P.engine.CE_M1_macro_acc_final, live: P.live.CE_M1_macro_acc_final, gap: r3(gap), reason };
    if (gap > 0.03 && !reason) { runFails = true; console.error(`FAIL ${fam}: engine ${P.engine.CE_M1_macro_acc_final} vs live ${P.live.CE_M1_macro_acc_final} diverge by ${r3(gap)} > 0.03 with no logged reason (DIVERGENCE_REASONS)`); }
    else if (gap > 0.03) console.log(`${fam} engine-vs-live divergence ${r3(gap)} > 0.03, logged reason: ${reason}`);
  }
}

if (LLM) {
  loadEnv();
  const { chat } = await import("../../server/azure.js");
  const quiet = console.info; console.info = () => {};
  const { GRADE_MODELS } = await import("../../server/comprehension/grade/closed.js");
  const childModel = process.env.SIM_CHILD_MODEL || "taxila-ds41";
  // The grader chain is the PRODUCTION chain. It must never contain the model that plays the child: the earlier
  // fallback was taxila-ds41, so on a primary failure the child model graded its own words (review fix 2026-10-02).
  const gradeModels = [GRADE_MODELS.primary, GRADE_MODELS.fallback];
  if (gradeModels.includes(childModel)) throw new Error(`sim: the child model ${childModel} is in the grader chain ${gradeModels}`);
  const llm = { chat, send: chat, childModel, gradeModels,
    calls: { child: 0, childFail: 0, grade: 0 }, log: [], echo: !opt("--no-echo", false) };
  const jobs = PERSONAS.flatMap((P) => Array.from({ length: LLM_SEEDS }, (_, s) => ({ P, s })));
  const runs = await pool(jobs, 12, ({ P, s }) => runChild({ persona: P, seed: 1000 + s, policy: "engine", llm }));
  console.info = quiet;
  const m = metrics(runs);
  const g = llm.log.filter((x) => x.op === "R-EXP" && x.cls === "probe.why");
  const pos = (xs) => r3(mean(xs.map((x) => +(x.label === "present"))));
  const gradeVsTruth = {
    why_present_given_U1: pos(g.filter((x) => x.truthU === 1)), why_present_given_U0: pos(g.filter((x) => x.truthU === 0)),
    why_present_given_U0_fluent: pos(g.filter((x) => x.truthU === 0 && ["p05", "p06", "p18"].includes(x.persona))),
    why_contradicted_given_mis: r3(mean(g.filter((x) => x.truthMis === 1).map((x) => +(x.label === "contradicted")))),
    span_demotions: llm.log.filter((x) => x.demoted && x.demoted !== "present:echo").length, echo_demotions: llm.log.filter((x) => x.demoted === "present:echo").length,
    n_why: g.length, n_all: llm.log.length,
  };
  result.llm_leg = { echoGuard: llm.echo, childModel: llm.childModel, gradeModels: llm.gradeModels, seeds: LLM_SEEDS, calls: llm.calls, metrics: m, grader_vs_hidden_truth: gradeVsTruth,
    samples: llm.log.filter((_, i) => i % 25 === 0).slice(0, 24).map((x) => ({ persona: x.persona, truthU: x.truthU, op: x.op, words: x.words, label: x.label })) };
  console.log(`llm-engine      acc ${m.CE_M1_macro_acc_final} · understood found ${m.CE_M2_understood_detected_final} · false-mastery ${m.CE_M3_false_mastery} (shallow ${m.CE_M3_false_mastery_shallow}) · probes/cs ${m.probes_per_concept_session}`);
  console.log("grader vs hidden truth:", JSON.stringify(gradeVsTruth), "calls", JSON.stringify(llm.calls));
}
result.ms = Date.now() - t0;
const dir = new URL("evals/comprehension-sim/results/", ROOT);
mkdirSync(dir, { recursive: true });
const out = opt("--out", null) ?? new URL(`comp-sim-${result.date}${LLM ? "-llm" : ""}.json`, dir).pathname;
writeFileSync(out, JSON.stringify(result, null, 1) + "\n");
console.log("wrote", out, `${(result.ms / 1000).toFixed(1)} s`);
if (runFails) process.exitCode = 1;
