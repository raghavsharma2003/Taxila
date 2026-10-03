// Run Forge G2 builds END TO END on Azure: one ACA Job execution per topic (server/forge/g2/azure-job.js startBuild),
// poll until every execution finishes, INGEST it (review.js: the trusted copy out of the build's own run container into
// the private queue), read the ingested runs/<buildId>/result.json, and report
// the QA pass rate and the cost per build (tokens × retail + Content Safety + ACA seconds from the EXECUTION's own
// start/end times, not the container's clock). Writes server/forge/g2/measurements/run-<stamp>.json.
// Usage: node scripts/forge-g2-run.mjs <topicId> [<topicId> …]   (or --auto N: the first N G2-eligible topics spread
// over classes, by levels.js)  [--concurrency 3]
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { randomUUID } from "crypto";
const ROOT = new URL("..", import.meta.url).pathname;
for (const line of readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
const { startBuild, executionStatus } = await import("../server/forge/g2/azure-job.js");
const { getPrivate } = await import("../server/forge/g2/store.js");
const { ingest } = await import("../server/forge/g2/review.js");
const { briefFor } = await import("../server/forge/g2/brief.js");
const { ACA_PRICE } = await import("../server/forge/g2/model.js");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const args = process.argv.slice(2);
const conc = +(args[args.indexOf("--concurrency") + 1] || 0) || 3;
let topics = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--concurrency" && args[i - 1] !== "--auto");
if (args.includes("--auto")) {
  const n = +args[args.indexOf("--auto") + 1];
  const all = readdirSync(ROOT + "data/kits").filter((f) => /^c\d+-[a-z]+\.json$/.test(f)).flatMap((f) => JSON.parse(readFileSync(ROOT + "data/kits/" + f, "utf8")).topics.map((t) => t.topicId));
  const ok = all.filter((t) => briefFor(t).ok);
  const step = Math.max(1, Math.floor(ok.length / n));
  topics = ok.filter((_, i) => i % step === 0).slice(0, n);
}
if (!topics.length) { console.error("usage: node scripts/forge-g2-run.mjs <topicId>… | --auto N"); process.exit(2); }
console.log(`G2 E2E on ${topics.length} topics, concurrency ${conc}: ${topics.join(" ")}`);

const runs = [];
const queue = [...topics];
async function worker() {
  while (queue.length) {
    const topicId = queue.shift();
    const buildId = randomUUID();
    const t0 = Date.now();
    let ex;
    try { ex = await startBuild({ topicId, buildId }); } catch (e) { runs.push({ topicId, buildId, status: "start_failed", reason: e.message.slice(0, 200) }); continue; }
    console.log(`  started ${topicId} → ${ex.execution}`);
    let st;
    for (;;) { await sleep(15000); st = await executionStatus(ex.execution); if (!["Running", "Processing", "Unknown"].includes(st.status) || Date.now() - t0 > 40 * 60_000) break; }
    let ing = null;
    for (let i = 0; i < 4; i++) { ing = await ingest(buildId, undefined, { execInfo: executionStatus }).catch((e) => ({ outcome: "ingest_error", reason: e.message })); if (ing.outcome !== "running") break; await sleep(15000); }
    const result = await getPrivate(`runs/${buildId}/result.json`).catch(() => null);
    const execSec = st.start && st.end ? (Date.parse(st.end) - Date.parse(st.start)) / 1000 : null;
    const computeUsd = execSec ? execSec * (2 * ACA_PRICE.vcpuSec + 4 * ACA_PRICE.gibSec) : null;
    const cost = result?.cost ? { ...result.cost, compute: computeUsd ?? result.cost.compute, total: +(result.cost.total - result.cost.compute + (computeUsd ?? result.cost.compute)).toFixed(4) } : null;
    runs.push({ topicId, buildId, execution: ex.execution, execStatus: st.status, execSec, status: result?.status || "no_result", stage: result?.stage,
      archetype: result?.brief?.archetype, design: result?.design?.id, failedGates: result?.failedGates || [], outcome: result?.outcome, ledger: result?.ledger,
      ingest: ing?.outcome, problems: ing?.summary?.problems, cost, chromium: result?.chromium, critiqueFlags: (result?.critique || []).filter((c) => !c.pass).map((c) => c.criterion), reason: result?.reason });
    console.log(`  done ${topicId}: ${result?.status} (${execSec ?? "?"} s, $${cost?.total ?? "?"})`);
  }
}
const T0 = Date.now();
await Promise.all(Array.from({ length: Math.min(conc, topics.length) }, worker));
const passed = runs.filter((r) => r.status === "to_review");
const costs = runs.map((r) => r.cost?.total).filter((x) => typeof x === "number").sort((a, b) => a - b);
const med = (xs) => (xs.length ? xs[Math.floor((xs.length - 1) / 2)] : null);
const summary = { date: new Date().toISOString(), n: runs.length, passedQa: passed.length, passRate: +(passed.length / runs.length).toFixed(3),
  costPerBuild: { mean: costs.length ? +(costs.reduce((a, b) => a + b, 0) / costs.length).toFixed(4) : null, median: med(costs), max: costs.at(-1) ?? null },
  costPerPassedBuild: passed.length ? +(costs.reduce((a, b) => a + b, 0) / passed.length).toFixed(4) : null,
  execSec: { median: med(runs.map((r) => r.execSec).filter(Boolean).sort((a, b) => a - b)), max: Math.max(...runs.map((r) => r.execSec || 0)) },
  wallSec: Math.round((Date.now() - T0) / 1000), runs };
mkdirSync(ROOT + "server/forge/g2/measurements", { recursive: true });
const file = `server/forge/g2/measurements/run-${summary.date.replace(/[:.]/g, "-")}.json`;
writeFileSync(ROOT + file, JSON.stringify(summary, null, 1));
console.log(JSON.stringify({ ...summary, runs: undefined }, null, 1));
console.log(`wrote ${file}`);
