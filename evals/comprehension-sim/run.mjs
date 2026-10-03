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
