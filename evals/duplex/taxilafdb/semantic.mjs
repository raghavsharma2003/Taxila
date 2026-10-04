// Stage A's LLM estimate, recorded for TaxilaFDB (L1 replays it at its MEASURED latency; the L1 run itself stays USD 0).
//
//   collect  run stage A with a recording semantic hook over every stream: the exact (stable prefix, context) pairs the
//            host asks (host.ts maybeAskSemantic: open contexts, >= 2 new words and >= 600 ms since the last ask)
//   call     each unique pair once per deployment through server/duplex/semantic.js (strict JSON numbers), concurrency 6,
//            wall-clock latency per call from this sandbox (eastus2 endpoints; India latency differs — [E] in reports)
//   cache    evals/duplex/results/taxilafdb-semantic-<dep>-2026-10-04.json: key -> { pComplete, pHoldWanted, asksHer,
//            offTask, latMs }; loadSemanticCache() serves world.mjs. A request missing from the cache (the run's
//            trajectory changed) gets no estimate, and the hit rate is reported.
//   NODE_USE_ENV_PROXY=1 node evals/duplex/taxilafdb/semantic.mjs [--deps grok-4-1-fast-non-reasoning,taxila-fast] [--collect-only]
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const RESULTS = path.join(HERE, "../results");
const DATE = "2026-10-04";
export const keyOf = (text, ctx) => crypto.createHash("sha1").update(`${String(text).trim()}|${ctx?.exchange ?? ""}|${ctx?.beat ?? ""}|${ctx?.questionType ?? ""}`).digest("hex").slice(0, 16);
const fileOf = (dep) => path.join(RESULTS, `taxilafdb-semantic-${dep}-${DATE}.json`);

export function loadSemanticCache(dep = process.env.FDB_SEM_DEP || "grok-4-1-fast-non-reasoning") {
  const f = fileOf(dep);
  const cache = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")).cache : {};
  const stats = { hits: 0, misses: 0 };
  return {
    dep, stats,
    lookup(text, ctx) {
      const hit = cache[keyOf(text, ctx)];
      if (hit && hit.pComplete !== null && hit.pComplete !== undefined) { stats.hits++; return { ...hit, deployment: dep }; }
      stats.misses++;
      return null;
    },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
  const { listStreams, loadStream, runStream } = await import("./world.mjs");
  const { armSpec } = await import("./arms.mjs");
  // 1. collect (every split: the cache must serve train/dev diagnostics and the frozen test run alike)
  const reqs = new Map();
  const recorder = { lookup(text, ctx) { const k = keyOf(text, ctx); if (!reqs.has(k)) reqs.set(k, { key: k, text, ctx: { exchange: ctx.exchange, beat: ctx.beat, questionType: ctx.questionType } }); return null; } };
  const ids = listStreams();
  let n = 0;
  for (const id of ids) {
    const d = loadStream(id);
    if (!["open_explanation", "question_to_her", "chit_chat"].includes(d.sc.ctx.exchange) && d.sc.family !== "F3") continue;
    for (const lane of ["D4", "FAST"]) await runStream(d, { ...armSpec("stage-a-sem", { semantic: recorder }), lane });
    n++;
  }
  const Q = [...reqs.values()];
  console.log(`collected ${Q.length} unique (prefix, context) requests from ${n} open-context streams`);
  if (argv.includes("--collect-only")) process.exit(0);
  // 2. call
  const { loadEnv, ROOT } = await import("../lib.mjs");
  loadEnv();
  await import(ROOT + "server/net.js");
  const { semanticEstimate } = await import(ROOT + "server/duplex/semantic.js");
  const { usdOf } = await import(ROOT + "server/azure.js");
  for (const dep of opt("--deps", "grok-4-1-fast-non-reasoning,taxila-fast").split(",")) {
    const prev = fs.existsSync(fileOf(dep)) ? JSON.parse(fs.readFileSync(fileOf(dep), "utf8")).cache : {};
    const todo = Q.filter((x) => !prev[x.key]);
    await semanticEstimate({ text: "ek do teen", context: { exchange: "open_explanation" }, deployment: dep, fallback: null }); // warm (not scored)
    const out = new Map();
    let next = 0, usd = 0;
    await Promise.all(Array.from({ length: 6 }, async () => {
      while (next < todo.length) {
        const x = todo[next++];
        const r = await semanticEstimate({ text: x.text, context: x.ctx, deployment: dep, fallback: null, timeoutMs: 4000 });
        if (r?.usage) usd += usdOf(dep, { in: r.usage.prompt_tokens ?? 0, out: r.usage.completion_tokens ?? 0 });
        out.set(x.key, r ? { pComplete: r.pComplete, pHoldWanted: r.pHoldWanted, asksHer: r.asksHer, offTask: r.offTask, latMs: r.latMs } : { pComplete: null, latMs: null });
      }
    }));
    const cache = { ...prev, ...Object.fromEntries(out) };
    const lat = Object.values(cache).map((v) => v.latMs).filter((v) => v !== null).sort((a, b) => a - b);
    const qq = (p) => lat[Math.min(lat.length - 1, Math.floor(p * lat.length))];
    const meta = { id: "taxilafdb-semantic", date: DATE, deployment: dep, n: Object.keys(cache).length, newCalls: todo.length, errors: [...out.values()].filter((v) => v.pComplete === null).length,
      latMs: { p50: qq(0.5), p90: qq(0.9), n: lat.length, vantage: "sandbox → eastus2 endpoint (not India) [M]" }, usd: +usd.toFixed(4),
      method: "server/duplex/semantic.js, json mode, max 60 tokens, effort none, concurrency 6", requests: Q.map((x) => ({ key: x.key, text: x.text, ctx: x.ctx })) };
    fs.writeFileSync(fileOf(dep), JSON.stringify({ ...meta, cache }, null, 1));
    console.log(dep, JSON.stringify({ n: meta.n, newCalls: meta.newCalls, errors: meta.errors, latMs: meta.latMs, usd: meta.usd }));
  }
  process.exit(0);
}
