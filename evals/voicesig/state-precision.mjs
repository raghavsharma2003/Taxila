// Per-state precision / recall of the voicesig knowledge states (VALUES-100 V2 item 3), plus the added value of voice on
// delayed-check prediction (V2 item 4). SIMULATED: the rows come from simulate-pilot.mjs, whose effect sizes are stated
// assumptions [E]. Every number this script prints carries `population: "simulated"`; it can never make a state live
// (server/voicesig/gate.js requires population "children"). It exists so that (a) the status page has a measured row per
// state today, honestly labelled, and (b) the same script runs unchanged on the pilot's rows the day they exist
// (`--rows pilot.jsonl --population children`), where truth comes from OUTCOMES, never from a coder's rating.
//
//   node evals/voicesig/state-precision.mjs [--children 200] [--effect 1] [--seeds 5] [--out file.json]
//   node evals/voicesig/state-precision.mjs --rows pilot.jsonl --population children --out file.json
//
// Truth per state. Simulated rows: the simulator's latent state (`sim.state`, `sim.rapid`). Real rows: the outcome that
// defines the state (SPEC §1.2: O1 delayed/transfer failure after a correct answer, O2 recognition-probe success after a
// non-answer, O3 the same wrong answer persisting, O4 re-ask agreement), so a real-row precision is outcome-defined.
import { readFileSync, writeFileSync } from "node:fs";
import { simulate } from "./simulate-pilot.mjs";
import { evaluate, runAdapter } from "./harness.mjs";
import { VS_STATES } from "../../server/voicesig/ladder.js";

/** Truth predicates. `sim` uses the latent state; `outcome` uses only measured outcomes (pilot rows). */
export const TRUTH = Object.freeze({
  fluentRecall: { sim: (r) => r.sim?.state === "solid" && !r.sim?.rapid, outcome: (r) => r.verdict === "correct" && r.outcomes?.O1 === 1, eligible: (r) => r.verdict === "correct" },
  fragileCorrect: { sim: (r) => r.sim?.state === "fragile" && !r.sim?.rapid, outcome: (r) => r.verdict === "correct" && r.outcomes?.O1 === 0, eligible: (r) => r.verdict === "correct" },
  heldBelief: { sim: (r) => r.sim?.state === "misconception" && !r.sim?.rapid, outcome: (r) => r.outcomes?.O3 === 1, eligible: (r) => r.verdict === "not_yet" || r.verdict === "partial" },
  effortfulGuess: { sim: (r) => ["fragile", "retrievable", "absent"].includes(r.sim?.state) && !r.sim?.rapid, outcome: (r) => r.outcomes?.O3 === 0, eligible: (r) => r.verdict === "not_yet" },
  rapidGuess: { sim: (r) => !!r.sim?.rapid, outcome: (r) => r.outcomes?.O4 === 0, eligible: () => true },
  searching: { sim: (r) => r.sim?.state === "retrievable", outcome: (r) => r.outcomes?.O2 === 1, eligible: (r) => !!r.ling?.idk },
  absent: { sim: (r) => r.sim?.state === "absent", outcome: (r) => r.outcomes?.O2 === 0, eligible: (r) => !!r.ling?.idk },
  // No simulator branch produces think-aloud turns, and no outcome defines it yet: unmeasured until the pilot codes it
  // against its own outcome (wait licence → the answer that follows the wait is correct).
  workingAloud: null,
});

/** Wilson 95% interval for k of n. */
export function wilson(k, n) {
  if (!n) return [NaN, NaN];
  const z = 1.96, p = k / n, d = 1 + (z * z) / n;
  const c = (p + (z * z) / (2 * n)) / d, h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return [Math.round((c - h) * 1000) / 1000, Math.round((c + h) * 1000) / 1000];
}

const r3 = (x) => (Number.isFinite(x) ? Math.round(x * 1000) / 1000 : null);

/**
 * Precision / recall per state over adapter-annotated rows (runAdapter output). Safety turns are excluded (they abstain
 * by construction; VS-A12 counts them separately). `mode`: "sim" (latent truth) or "outcome" (measured outcomes only).
 */
export function stateTable(rows, mode = "sim") {
  const live = rows.filter((r) => r.vs && !r.vs.abstain && !r.safety);
  const out = {};
  for (const s of VS_STATES) {
    const T = TRUTH[s];
    if (!T) { out[s] = { precision: null, recall: null, n: 0, fired: 0, truth: 0, note: "no truth source yet" }; continue; }
    const truth = T[mode];
    const pool = mode === "outcome" ? live.filter((r) => T.eligible(r) && r.outcomes) : live;
    const fired = pool.filter((r) => r.vs.state === s);
    const tp = fired.filter(truth).length;
    const pos = pool.filter((r) => T.eligible(r) && truth(r));
    const tpR = pos.filter((r) => r.vs.state === s).length;
    out[s] = {
      precision: fired.length ? r3(tp / fired.length) : null, precisionCi95: wilson(tp, fired.length),
      recall: pos.length ? r3(tpR / pos.length) : null, recallCi95: wilson(tpR, pos.length),
      n: pool.length, fired: fired.length, truth: pos.length,
      firePer100: pool.length ? r3((100 * fired.length) / pool.length) : null,
    };
  }
  return out;
}

/** Pool several simulated replicates (seeds) into one table: counts add, so the intervals tighten honestly. */
export function simulatedStates({ children = 200, effect = 1, seeds = 5 } = {}) {
  const rows = [];
  for (let s = 0; s < seeds; s++) {
    for (const r of runAdapter(simulate({ children, effect, seed: 500 + s }))) rows.push({ ...r, child: `${s}:${r.child}` });
  }
  return { rows: rows.length, table: stateTable(rows, "sim") };
}

/** Delayed-check prediction with vs without voice (VS-A1), on simulated pilots, at effect `effect` and the true null 0. */
export function addedValue({ children = 200, seeds = 3, effect = 1, B = 300 } = {}) {
  const arms = {};
  for (const e of [effect, 0]) {
    const reps = [];
    for (let s = 0; s < seeds; s++) {
      const m = evaluate(simulate({ children, effect: e, seed: 900 + s }), { B }).metrics["VS-A1"];
      reps.push({ seed: 900 + s, dAuroc: m.value, aurocText: m.aurocText, aurocTextVoice: m.aurocTextVoice, ci95: m.ci95, n: m.n, children: m.children });
    }
    arms[`effect${e}`] = reps;
  }
  return arms;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
  const at = new Date().toISOString().slice(0, 10);
  let result;
  if (opt("--rows")) {
    const population = opt("--population", "unknown");
    const rows = readFileSync(opt("--rows"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
    const ann = runAdapter(rows);
    result = { at, population, method: "outcome-defined truth over pilot rows", rows: ann.length, children: new Set(rows.map((r) => r.child)).size, states: stateTable(ann, "outcome") };
  } else {
    const children = Number(opt("--children", 200)), effect = Number(opt("--effect", 1)), seeds = Number(opt("--seeds", 5));
    const st = simulatedStates({ children, effect, seeds });
    result = {
      at, population: "simulated", method: `simulate-pilot.mjs latent state, ${seeds} seeds x ${children} children, effect ${effect} [E]`,
      rows: st.rows, states: st.table,
      addedValue: args.includes("--added") ? addedValue({ children, seeds: Math.min(3, seeds), effect }) : undefined,
    };
  }
  const json = JSON.stringify(result, null, 1);
  if (opt("--out")) writeFileSync(opt("--out"), json + "\n");
  process.stdout.write(json + "\n");
}
