// India move, Rehearse step 4 (docs/ops/INDIA-MOVE.md §8): latency from inside Azure at two vantage points.
// Creates a one-off ACA job per vantage (taxila-sin-env = South India / Chennai, taxila-env = eastus2), runs
// scripts/region/latency-job.mjs in a stock node:22 image, reads its LAT lines from each env's Log Analytics
// workspace, deletes the jobs (their secrets hold the model keys) and writes a summary with p50/p90.
//   NODE_USE_ENV_PROXY=1 node scripts/region/latency.mjs --staging <url> [--prod <url>] [--n 20] [--lessons 20] [--only sin|eus]
// Production is only READ (GET /api/health, /api/health?db=1). Lessons run against staging only.
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { ROOT, SUB_PATH, arm, laQuery, loadEnv, until } from "../../infra/azure.mjs";

loadEnv();
const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
const STAGING = opt("--staging"), PROD = opt("--prod", "https://taxila-web.nicebay-a0d3a12f.eastus2.azurecontainerapps.io");
if (!STAGING) throw new Error("--staging <url>");
const N = opt("--n", "20"), LESSONS = opt("--lessons", "20"), ONLY = opt("--only", null);
const API = "api-version=2024-03-01";
const SCRIPT = readFileSync(new URL("./latency-job.mjs", import.meta.url), "utf8");
const VANTAGES = [
  { v: "southindia", rg: "taxila-sin", env: "taxila-sin-env", job: "taxila-sin-latency" },
  { v: "eastus2", rg: process.env.AZURE_RESOURCE_GROUP, env: "taxila-env", job: "taxila-eus2-latency" },
].filter((x) => !ONLY || (ONLY === "sin" ? x.v === "southindia" : x.v === "eastus2"));

async function run({ v, rg, env, job }) {
  const RGP = `${SUB_PATH()}/resourceGroups/${rg}`, JOB = `${RGP}/providers/Microsoft.App/jobs/${job}`;
  const e = await arm("GET", `${RGP}/providers/Microsoft.App/managedEnvironments/${env}?${API}`);
  const ws = e.properties.appLogsConfiguration?.logAnalyticsConfiguration?.customerId;
  const wp = (e.properties.workloadProfiles || []).length ? { workloadProfileName: "Consumption" } : {};
  const plain = (name, value) => ({ name, value: String(value) });
  try {
    await arm("PUT", `${JOB}?${API}`, { location: e.location, properties: { environmentId: e.id, ...wp,
      configuration: { triggerType: "Manual", replicaTimeout: 3600, replicaRetryLimit: 0, manualTriggerConfig: { parallelism: 1, replicaCompletionCount: 1 },
        secrets: [{ name: "sin-key", value: process.env.AZURE_OPENAI_API_KEY_SIN }, { name: "eus-key", value: process.env.AZURE_OPENAI_API_KEY }] },
      template: { containers: [{ name: "lat", image: "docker.io/library/node:22-slim", command: ["node", "--input-type=module", "-e"], args: [SCRIPT], resources: { cpu: 0.5, memory: "1Gi" },
        env: [plain("VANTAGE", v), plain("STAGING", STAGING), plain("PROD", PROD), plain("N", N), plain("LESSONS", LESSONS),
          plain("SIN_EP", process.env.AZURE_OPENAI_ENDPOINT_SIN), plain("EUS_EP", process.env.AZURE_OPENAI_ENDPOINT),
          { name: "SIN_KEY", secretRef: "sin-key" }, { name: "EUS_KEY", secretRef: "eus-key" }] }] } } });
    await until(async () => (await arm("GET", `${JOB}?${API}`)).properties.provisioningState === "Succeeded", { everyMs: 4000, maxMs: 300_000, what: `${job} provisioned` });
    const ex = await arm("POST", `${JOB}/start?${API}`, {}); const exec = ex.name || ex.id.split("/").pop();
    console.log(`[${v}] execution ${exec} started`);
    const status = await until(async () => { const x = await arm("GET", `${JOB}/executions/${exec}?${API}`, undefined, { allow404: true }); const s = x?.properties?.status; return /^(Succeeded|Failed|Stopped|Degraded)$/.test(s || "") && s; },
      { everyMs: 15_000, maxMs: 3_900_000, what: `${exec} finished` });
    console.log(`[${v}] execution ${status}; reading logs`);
    const kql = `ContainerAppConsoleLogs_CL | where ContainerJobName_s == "${job}" and ContainerGroupName_s startswith "${exec}" | project TimeGenerated, Log_s | order by TimeGenerated asc`;
    let lines = [];
    await until(async () => { lines = (await laQuery(ws, kql, "PT3H")).map((r) => String(r.Log_s ?? "")); return lines.some((l) => l.startsWith("LAT_DONE")); },
      { everyMs: 20_000, maxMs: 900_000, what: "LAT_DONE" }).catch((err) => console.warn(`[${v}] ${err.message} (have ${lines.length} lines)`));
    return { v, status, rows: lines.filter((l) => l.startsWith("LAT ")).map((l) => { try { return JSON.parse(l.slice(4)); } catch { return null; } }).filter(Boolean),
      other: lines.filter((l) => !l.startsWith("LAT")).slice(-20) };
  } finally {
    await arm("DELETE", `${JOB}?${API}`, undefined, { allow404: true }).then(() => console.log(`[${v}] job ${job} deleted`), (err) => console.warn(`[${v}] delete: ${err.message}`));
  }
}

const pct = (a, p) => { const s = a.filter((x) => typeof x === "number").sort((x, y) => x - y); if (!s.length) return null; return s[Math.min(s.length - 1, Math.ceil(p * s.length) - 1)]; };
const stat = (a) => ({ n: a.filter((x) => typeof x === "number").length, p50: pct(a, 0.5), p90: pct(a, 0.9) });
function summarise({ v, rows }) {
  const S = {}, put = (k, a) => { S[k] = stat(a); };
  for (const target of ["staging", "prod"]) {
    put(`health ${target}`, rows.filter((r) => r.t === "health" && r.target === target && r.i > 0).map((r) => r.ms));
    put(`health?db=1 server→db per query ${target}`, rows.filter((r) => r.t === "healthdb" && r.target === target && r.i > 0).flatMap((r) => r.dbMs || []));
  }
  for (const acct of ["sin", "eus"]) put(`taxila-fast TTFT ${acct}`, rows.filter((r) => r.t === "ttft" && r.acct === acct && r.i > 0).map((r) => r.ttft));
  put("taxila-live-transcribe commit→final eus", rows.filter((r) => r.t === "rttx" && r.acct === "eus" && r.i > 0).map((r) => r.final));
  put("taxila-mai-tx2-stream commit→final sin", rows.filter((r) => r.t === "rttx" && r.acct === "sin" && r.i > 0).map((r) => r.final));
  put("taxila-live-transcribe ws open eus", rows.filter((r) => r.t === "rttx" && r.acct === "eus" && r.i > 0).map((r) => r.open));
  put("taxila-mai-tx2-stream ws open sin", rows.filter((r) => r.t === "rttx" && r.acct === "sin" && r.i > 0).map((r) => r.open));
  for (const acct of ["sin", "eus"]) put(`taxila-transcribe batch total ${acct}`, rows.filter((r) => r.t === "batchtx" && r.acct === acct && r.i > 0).map((r) => r.total));
  const L = rows.filter((r) => r.t === "lesson");
  put("staging lesson start", L.map((r) => r.start));
  put("staging lesson turn", L.flatMap((r) => r.turns || []));
  S.lessonErrors = L.filter((r) => r.err).map((r) => r.err).slice(0, 5);
  S.accountsNotDeleted = L.filter((r) => !r.deleted).length;
  S.errors = rows.filter((r) => r.err && r.t !== "lesson").map((r) => `${r.t} ${r.dep || r.target || ""} ${r.acct || ""}: ${r.err}`).slice(0, 10);
  return { vantage: v, ...S };
}

const results = await Promise.all(VANTAGES.map((x) => run(x).catch((e) => ({ v: x.v, error: e.message, rows: [] }))));
const summary = results.map((r) => (r.error ? { vantage: r.v, error: r.error } : summarise(r)));
mkdirSync(ROOT + "node_modules/.cache/india-move", { recursive: true });
const file = ROOT + `node_modules/.cache/india-move/latency-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
writeFileSync(file, JSON.stringify({ at: new Date().toISOString(), staging: STAGING, prod: PROD, n: N, lessons: LESSONS, summary, raw: results }, null, 1));
console.log(JSON.stringify(summary, null, 1));
console.log(`report: ${file}`);
