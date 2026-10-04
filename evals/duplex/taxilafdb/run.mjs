// TaxilaFDB runner: every (stream × arm × STT lane) through world.mjs, scored by metrics.mjs, with 95% cluster-bootstrap
// intervals. Parallel over forked workers (pure CPU; no network, USD 0 — the LLM arm replays a recorded cache).
//
//   node evals/duplex/taxilafdb/run.mjs --arms stage-a,silence-640,cascade-900,smart-turn-0.5 --lanes D4,FAST \
//        [--split test|dev|train|all] [--workers 3] [--name main] [--limit N] [--families F1,F2]
// Writes evals/duplex/results/taxilafdb-<name>-2026-10-04.json (aggregates) and /tmp/taxila-fdb/runs/<name>.jsonl (facts).
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fork } from "node:child_process";
import { listStreams, loadStream, runStream } from "./world.mjs";
import { armSpec, FeatStore } from "./arms.mjs";
import { facts, aggregate } from "./metrics.mjs";
import { SPLIT_VERSION } from "./split.mjs";

const DATE = "2026-10-04";
const HERE = path.dirname(new URL(import.meta.url).pathname);
const RESULTS = path.join(HERE, "../results");
const RUNS = process.env.TAXILA_FDB_RUNS || "/tmp/taxila-fdb/runs";
const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };

async function makeArms(names, lane) {
  const need = names.join(",");
  const store = /smart-turn|stage-b/.test(need) ? new FeatStore() : null;
  const semantic = /-sem/.test(need) ? (await import("./semantic.mjs")).loadSemanticCache() : null;
  const model = /stage-b/.test(need) ? (await import("./stageb.mjs")).loadStageB({ store }) : null;
  return names.map((n) => ({ ...armSpec(n, { store, semantic, model }), lane }));
}

// ── worker ──
if (process.env.FDB_WORKER) {
  process.on("message", async (m) => {
    if (m.kind !== "job") return;
    const arms = {};
    for (const lane of m.lanes) arms[lane] = await makeArms(m.arms, lane);
    const out = [];
    for (const id of m.ids) {
      const d = loadStream(id);
      for (const lane of m.lanes) for (const arm of arms[lane]) {
        try {
          const r = await runStream(d, arm);
          out.push({ f: facts(r), extra: { probes: r.probes, semCalls: r.semCalls, ticks: r.ticks, spec: r.spec ?? null, engineStats: r.engineStats ?? null } });
        } catch (e) {
          out.push({ error: `${id} ${arm.name} ${lane}: ${String(e?.stack || e).slice(0, 400)}` });
        }
      }
    }
    process.send({ kind: "done", out });
  });
} else {
  const arms = opt("--arms", "stage-a,silence-640,cascade-900").split(",");
  const lanes = opt("--lanes", "D4,FAST").split(",");
  const split = opt("--split", "test");
  const workers = Number(opt("--workers", Math.max(1, Math.min(3, os.cpus().length - 1))));
  const name = opt("--name", "main");
  const fams = opt("--families", null)?.split(",") ?? null;
  const conds = opt("--conds", null)?.split(",") ?? null;
  let ids = listStreams().filter((id) => {
    const [sc, , cond] = id.split("~");
    if (conds && !conds.includes(cond)) return false;
    return true;
  });
  const meta = new Map();
  ids = ids.filter((id) => {
    const d = JSON.parse(fs.readFileSync(path.join(process.env.TAXILA_FDB_STREAMS || "/tmp/taxila-fdb/streams", `${id}.json`), "utf8")).meta;
    meta.set(id, d);
    return (split === "all" || d.split === split) && (!fams || fams.includes(d.family));
  });
  const limit = Number(opt("--limit", 0));
  if (limit) ids = ids.slice(0, limit);
  console.log(`TaxilaFDB ${name}: ${ids.length} streams (${split}) × arms [${arms}] × lanes [${lanes}] on ${workers} workers`);
  const t0 = Date.now();
  const chunks = Array.from({ length: workers }, () => []);
  ids.forEach((id, i) => chunks[i % workers].push(id));
  const results = await Promise.all(chunks.filter((c) => c.length).map((c) => new Promise((resolve, reject) => {
    const w = fork(new URL(import.meta.url).pathname, [], { env: { ...process.env, FDB_WORKER: "1" }, execArgv: ["--max-old-space-size=3000"] });
    w.on("message", (m) => { if (m.kind === "done") { resolve(m.out); w.kill(); } });
    w.on("error", reject);
    w.on("exit", (code) => { if (code && code !== 0 && code !== null) reject(new Error(`worker exit ${code}`)); });
    w.send({ kind: "job", ids: c, arms, lanes });
  })));
  const all = results.flat();
  const errors = all.filter((x) => x.error).map((x) => x.error);
  const rows = all.filter((x) => x.f);
  fs.mkdirSync(RUNS, { recursive: true });
  fs.writeFileSync(path.join(RUNS, `${name}.jsonl`), rows.map((x) => JSON.stringify(x)).join("\n"));
  const table = {};
  for (const lane of lanes) for (const a of arms) {
    const F = rows.filter((x) => x.f.arm === a && x.f.lane === lane).map((x) => x.f);
    const ex = rows.filter((x) => x.f.arm === a && x.f.lane === lane).map((x) => x.extra);
    table[`${a}@${lane}`] = { ...aggregate(F), probesPerStream: +(ex.reduce((s, e) => s + (e.probes || 0), 0) / Math.max(1, ex.length)).toFixed(2),
      semCallsPerStream: +(ex.reduce((s, e) => s + (e.semCalls || 0), 0) / Math.max(1, ex.length)).toFixed(2) };
  }
  const out = { id: `taxilafdb-${name}`, date: DATE, split, splitVersion: SPLIT_VERSION, streams: ids.length, scenarios: new Set(ids.map((i) => i.split("~")[0])).size,
    arms, lanes, method: "evals/duplex/taxilafdb/{world,arms,metrics,run}.mjs: L1 simulation on rendered TaxilaFDB streams (Azure TTS child-like voices + mixed echo/overlays/noise), reactive STT model (D4 calibrated on M-D2 n=28; FAST [E]), the real src/duplex runtime; CIs = 95% bootstrap over scenarios (1,000)",
    seconds: Math.round((Date.now() - t0) / 1000), errors: errors.slice(0, 20), nErrors: errors.length, table };
  fs.mkdirSync(RESULTS, { recursive: true });
  const file = path.join(RESULTS, `taxilafdb-${name}-${DATE}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 1));
  console.log(`done in ${out.seconds} s, ${errors.length} errors → ${path.relative(process.cwd(), file)}`);
  if (errors.length) console.log(errors.slice(0, 5).join("\n"));
  const show = (k, v) => console.log(k.padEnd(28), v);
  for (const [k, v] of Object.entries(table)) {
    show(k, `cutoff(think) ${v.M2_thinkingCutoff.rate} [${v.M2_thinkingCutoff.ci95}] n=${v.M2_thinkingCutoff.n} | gap p50 ${v.M3_gapDecision.p50} p90 ${v.M3_gapDecision.p90} (audible ${v.M3_gapAudible.p50}/${v.M3_gapAudible.p90}) | missed ${v.M4_missedRespond.rate} | yield p50 ${v.M7_yieldLatency.p50} | keep ${v.M8_keepTalkingStrict.rate} | holdViol ${v.M12_holdViolation.k} | verdictRep ${v.M11_verdictOnRepaired.k} | unsafe ${v.M13_nonSafetySpeechAfterDistress.k}`);
  }
}
