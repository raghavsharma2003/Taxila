// model-arm.mjs — duplex prototype, measurement M-D5 (2026-10-04): does a fast Azure decision model earn a place in the
// end-of-turn decision (ARCHITECTURE.md §3.1, law 4: a model may only SHORTEN a hold, never trigger speech)?
//
// Method:
//   1. run the simulator's duplex arm with the model hook on (no answers yet) over every scenario x SEEDS seeds and collect
//      every `ask_model` query: the words at the hold, the answer form, the beat, and the silence so far. Label each query
//      from the script: done = the hold sits in the child's FINAL pause (no more words follow), else not done;
//   2. ask each deployment, once per unique query, for a typed calibrated decision {"done": p} (Jev's pattern on Azure:
//      typed state in, a number out, no free text): chat() json mode, max 20 tokens, effort none, warm connection,
//      concurrency 6, US container -> eastus2; wall-clock latency per call is recorded and used by the simulator;
//   3. score each deployment: accuracy at 0.5, precision of p >= 0.9 (the only band allowed to shorten a hold), the share
//      of truly-done holds it would shorten, ECE (10 bins), latency p50/p90; write results/model-cache-<dep>-<date>.json
//      in the shape harness.mjs reads (env.modelCache: key -> { p, latMs }).
// Jev itself is not called: it is not sold Direct from Azure and no key exists (ARCHITECTURE.md §3.1).
// Spend: a few hundred calls x ~350 tokens on taxila-fast / grok-4-1-fast-nr: < USD 0.10.
//   NODE_USE_ENV_PROXY=1 node evals/duplex/model-arm.mjs [--deps grok-4-1-fast-non-reasoning,taxila-fast] [--seeds 8]
import fs from "node:fs";
import path from "node:path";
import { loadEnv, ROOT, RESULTS, q, r0, wilson } from "./lib.mjs";
import { SCENARIOS } from "./scenarios.mjs";
import { runScenario } from "./harness.mjs";
loadEnv();
await import(ROOT + "server/net.js");
const { chat, usdOf } = await import(ROOT + "server/azure.js");

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const SEEDS = Number(arg("--seeds", 6));
const DEPS = arg("--deps", "grok-4-1-fast-non-reasoning,taxila-fast").split(",");

// 1. collect queries: "shorten" (law 4: asked only inside a code hold >= 800 ms) and "decide" (reference arm: asked at
//    every end-of-turn decision point, so a model-decided floor can be compared with the code floor on the same points)
const queries = new Map();
for (const sc of SCENARIOS) {
  if (sc.teacher) continue;
  for (let s = 1; s <= SEEDS; s++) for (const mode of [true, "decide"]) {
    const r = runScenario(sc, s, { name: "duplex-model", kind: "duplex", stt: "D4", opts: { model: mode } }, {});
    for (const mq of r.modelQueries) {
      const done = !r.words.some((w) => w.start > mq.t);
      const silence = Math.max(0, mq.t - (r.words.filter((w) => w.end <= mq.t).at(-1)?.end ?? mq.t));
      const e = queries.get(mq.key) || { key: mq.key, text: mq.text, ctx: mq.ctx, silenceMs: silence, done: 0, notDone: 0, ids: new Set(), modes: new Set() };
      e.modes.add(mode === true ? "shorten" : "decide");
      if (done) e.done++; else e.notDone++;
      e.ids.add(sc.id);
      queries.set(mq.key, e);
    }
  }
}
const Q = [...queries.values()].map((e) => ({ ...e, ids: [...e.ids], modes: [...e.modes], label: e.done >= e.notDone ? 1 : 0 }));
console.log(`queries: ${Q.length} unique (shorten ${Q.filter((x) => x.modes.includes("shorten")).length}, decide ${Q.filter((x) => x.modes.includes("decide")).length}) (${Q.filter((x) => x.label).length} done, ${Q.filter((x) => !x.label).length} not done)`);

const SYS = [
  "Task: turn-taking judgement for a voice teacher. A child in class 4-7 is speaking Hindi, English or a mix.",
  "Input: the answer form the teacher asked for, the teaching beat, the words recognised so far (punctuation is the recogniser's guess), and how long the child has been silent.",
  "Output: the probability that the child has finished the turn and expects the teacher to speak now.",
  "Evidence of NOT done: a filler, connective, postposition or 'jab/agar' clause with no 'to' at the end; a self-correction in progress; an explanation that has not reached its point. Children pause 1-3 s mid-thought.",
  "Evidence of done: a complete answer to the form asked, a question to the teacher, 'pata nahi' / I don't know, a closing tag like 'na'.",
  'Reply with JSON only: {"done": <number from 0 to 1>}.',
].join("\n");
const userOf = (x) => `answer form: ${x.ctx.answerForm ?? "open"}; beat: ${x.ctx.beat ?? "question"}; silent for: ${(x.silenceMs / 1000).toFixed(1)} s; words so far: "${x.text}"`;

async function ask(dep, x) {
  const t0 = performance.now();
  try {
    const r = await chat(dep, [{ role: "system", content: SYS }, { role: "user", content: userOf(x) }], { json: true, maxTokens: 20, effort: "none" });
    const p = Number(r.json?.done);
    return { p: Number.isFinite(p) ? Math.max(0, Math.min(1, p)) : null, latMs: Math.round(performance.now() - t0), usage: { in: r.usage?.prompt_tokens ?? 0, out: r.usage?.completion_tokens ?? 0 } };
  } catch (e) { return { p: null, latMs: Math.round(performance.now() - t0), error: String(e?.message || e).slice(0, 120) }; }
}

function ece(rows, bins = 10) {
  let e = 0;
  for (let b = 0; b < bins; b++) {
    const inb = rows.filter((r) => r.p >= b / bins && (b === bins - 1 ? r.p <= 1 : r.p < (b + 1) / bins));
    if (!inb.length) continue;
    const conf = inb.reduce((a, r) => a + r.p, 0) / inb.length, acc = inb.reduce((a, r) => a + r.label, 0) / inb.length;
    e += (inb.length / rows.length) * Math.abs(conf - acc);
  }
  return +e.toFixed(4);
}

const summary = {};
for (const dep of DEPS) {
  await ask(dep, Q[0]); // warm the connection (not scored)
  const out = new Array(Q.length);
  let next = 0;
  await Promise.all(Array.from({ length: 6 }, async () => { while (next < Q.length) { const i = next++; out[i] = await ask(dep, Q[i]); } }));
  const rows = Q.map((x, i) => ({ key: x.key, label: x.label, modes: x.modes, ...out[i] })).filter((r) => r.p !== null);
  const shortenRows = rows.filter((r) => r.modes.includes("shorten"));
  const shHi = shortenRows.filter((r) => r.p >= 0.9);
  const hi = rows.filter((r) => r.p >= 0.9);
  const usd = out.reduce((a, r) => a + (r.usage ? usdOf(dep, r.usage) : 0), 0);
  summary[dep] = {
    n: Q.length, answered: rows.length, errors: out.filter((r) => r.p === null).length,
    accuracyAt05: { k: rows.filter((r) => (r.p >= 0.5 ? 1 : 0) === r.label).length, n: rows.length, ci80: wilson(rows.filter((r) => (r.p >= 0.5 ? 1 : 0) === r.label).length, rows.length) },
    precisionAt09: { k: hi.filter((r) => r.label).length, n: hi.length, ci80: wilson(hi.filter((r) => r.label).length, hi.length) },
    recallAt09: { k: hi.filter((r) => r.label).length, n: rows.filter((r) => r.label).length },
    falseShortenAt09: { k: hi.filter((r) => !r.label).length, n: rows.filter((r) => !r.label).length },
    ece10: ece(rows),
    shorten: { n: shortenRows.length, truelyDone: shortenRows.filter((r) => r.label).length, wouldShorten: shHi.length, wrongShorten: shHi.filter((r) => !r.label).length }, latMs: { p50: r0(q(out.map((r) => r.latMs), 0.5)), p90: r0(q(out.map((r) => r.latMs), 0.9)) }, usd: +usd.toFixed(5),
  };
  const cache = Object.fromEntries(Q.map((x, i) => [x.key, { p: out[i].p, latMs: out[i].latMs }]));
  fs.writeFileSync(path.join(RESULTS, `model-cache-${dep}-2026-10-04.json`), JSON.stringify({ id: "M-D5", date: "2026-10-04", deployment: dep, method: "see model-arm.mjs header", summary: summary[dep],
    queries: Q.map((x, i) => ({ key: x.key, text: x.text, ctx: x.ctx, silenceMs: x.silenceMs, label: x.label, ids: x.ids, ...out[i], usage: undefined })), cache }, null, 1));
  console.log(dep, JSON.stringify(summary[dep]));
}
fs.writeFileSync(path.join(RESULTS, "model-arm-2026-10-04.json"), JSON.stringify({ id: "M-D5", date: "2026-10-04", seeds: SEEDS, queries: Q.length, summary }, null, 1));
process.exit(0);
