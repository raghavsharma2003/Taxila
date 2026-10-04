// India move, data (docs/ops/INDIA-MOVE.md §3 step 4, gap G2): Neon prod → Azure Database for PostgreSQL Flexible
// Server, run as a one-off ACA job INSIDE the VNet (the server has private access only, and the sandbox cannot reach
// 5432 at all). The job runs a stock postgres client image (pg_dump / pg_restore / psql); this script defines it,
// starts one execution, reads its result lines back from the environment's Log Analytics workspace, and deletes the
// job again (its secrets hold both connection strings) unless --keep-job.
//
//   NODE_USE_ENV_PROXY=1 node scripts/region/db-copy.mjs [mode] [flags]
//   modes (one):
//     (default) copy         dump source → restore into target (target must have no public tables unless --replace),
//                            then verify
//     --verify-only          no restore: compare source and target per table (meaningful once writes are frozen)
//     --check-migrations     target only: schema_migrations vs db/migrations of --sha; the report is the evidence
//                            scripts/deploy-azure.mjs --migrations-evidence accepts for a private database
//   flags:
//     --dry-run              resolve everything, check the ACA env exists, print the plan; create and start nothing
//     --target VAR|URL       target database (default AZURE_PG_SIN_URL from .env.local). A Neon host is refused unless
//                            --allow-neon-target (rehearsal into a throwaway database), and Neon PROD never
//     --source VAR           source database env var (default DATABASE_URL_DIRECT, else DATABASE_URL: Neon prod)
//     --replace              copy into a target that already has public tables: drop and recreate schema public first
//     --sha REV              which commit's db/migrations to expect (default HEAD)
//     --rg / --env / --job   default taxila-sin / taxila-sin-env / taxila-sin-dbcopy · --image (default postgres:17)
//     --tls require          accept an unverified certificate (default verify-full against the CA roots embedded below)
//     --keep-job             leave the job (and its secrets) in place after the run
//
// Read-only on the source, by construction: every source session starts with default_transaction_read_only=on, and the
// dump and the source checksums share ONE exported snapshot (pg_dump --snapshot), so "the dump" and "what was counted"
// are the same instant even while production keeps writing. Per table: row count + an order-independent checksum
// (md5 over the sorted md5 of every row's text form, TimeZone=UTC, DateStyle=ISO on both sides). Sequences: last_value.
// Migrations: target schema_migrations ⊇ db/migrations of --sha, and equal to the source's set.
// TLS: both connections must report ssl=on in pg_stat_ssl; certificates are verified (verify-full) by default.
// Never prints a connection string, password or key. Report: node_modules/.cache/india-move/db-copy-<mode>-<ts>.json
import { execSync } from "child_process";
import { X509Certificate } from "crypto";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { rootCertificates } from "tls";
import { ROOT, SUB_PATH, arm, laQuery, loadEnv, sleep, until } from "../../infra/azure.mjs";

loadEnv();
const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
const MODE = flag("--check-migrations") ? "migrations" : flag("--verify-only") ? "verify" : "copy";
const DRY = flag("--dry-run");
const RG = opt("--rg", "taxila-sin"), ENV = opt("--env", "taxila-sin-env"), JOB = opt("--job", "taxila-sin-dbcopy");
const IMAGE = opt("--image", "docker.io/library/postgres:17");
const TLS_MODE = opt("--tls", "verify-full");
const API = "api-version=2024-03-01";
const RGP = `${SUB_PATH()}/resourceGroups/${RG}`;
const JOB_PATH = `${RGP}/providers/Microsoft.App/jobs/${JOB}`;
const OUT = ROOT + "node_modules/.cache/india-move/";
const t0 = Date.now();

// ───────────── resolve the two databases (values stay in memory; only hosts are printed) ─────────────

const fromEnvOrUrl = (v) => (/^postgres(ql)?:\/\//.test(v || "") ? v : process.env[v]);
const hostOf = (u) => { try { return new URL(u).hostname.toLowerCase(); } catch { return ""; } };
/** libpq gets TLS settings from PGSSLMODE (set in the job), so a url's own sslmode/channel_binding are dropped. */
const forLibpq = (u, { direct = false } = {}) => {
  const url = new URL(u);
  url.searchParams.delete("sslmode");
  if (direct) url.hostname = url.hostname.replace("-pooler.", ".");   // pg_dump through PgBouncer is unsafe
  return url.toString();
};

const targetArg = opt("--target", "AZURE_PG_SIN_URL");
const TARGET = fromEnvOrUrl(targetArg);
if (!TARGET) throw new Error(`target: ${targetArg} is not set (the PostgreSQL server is not provisioned yet? scripts/region/provision.mjs writes AZURE_PG_SIN_URL)`);
const sourceVar = opt("--source", process.env.DATABASE_URL_DIRECT ? "DATABASE_URL_DIRECT" : "DATABASE_URL");
const SOURCE = MODE === "migrations" ? null : process.env[sourceVar];
if (MODE !== "migrations" && !SOURCE) throw new Error(`source: ${sourceVar} is not set`);

const tHost = hostOf(TARGET), sHost = SOURCE ? hostOf(SOURCE) : "";
const prodHosts = [process.env.DATABASE_URL, process.env.DATABASE_URL_DIRECT].filter(Boolean).map((u) => hostOf(forLibpq(u, { direct: true })));
if (MODE === "copy" && prodHosts.includes(hostOf(forLibpq(TARGET, { direct: true })))) throw new Error(`target ${tHost} is the Neon PROD database: this script never writes to it`);
if (MODE === "copy" && /neon\.tech$/.test(tHost) && !flag("--allow-neon-target")) throw new Error(`target ${tHost} is a Neon host: pass --allow-neon-target for a throwaway rehearsal database`);
if (SOURCE && hostOf(forLibpq(SOURCE, { direct: true })) === hostOf(forLibpq(TARGET, { direct: true })) && new URL(SOURCE).pathname === new URL(TARGET).pathname) throw new Error("source and target are the same database");
if (MODE === "copy" && /neon\.tech$/.test(tHost) && flag("--replace") && prodHosts.includes(hostOf(forLibpq(TARGET, { direct: true })))) throw new Error("refusing --replace on Neon prod");

const sha = execSync(`git rev-parse ${opt("--sha", "HEAD")}`, { cwd: ROOT }).toString().trim();
const EXPECTED = execSync(`git ls-tree --name-only ${sha} db/migrations/`, { cwd: ROOT }).toString().split("\n")
  .map((f) => f.split("/").pop()).filter((f) => f.endsWith(".sql")).sort();

/** The CA roots Neon (Let's Encrypt → ISRG) and Azure PG (DigiCert G2 / Microsoft 2017) chain to, from Node's store. */
const ROOTS_PEM = rootCertificates.filter((pem) => {
  try { return /ISRG Root X[12]|DigiCert Global Root (CA|G2|G3)|Microsoft (RSA|ECC) Root Certificate Authority 2017|Baltimore CyberTrust Root/.test(new X509Certificate(pem).subject); }
  catch { return false; }
}).join("\n");

// ───────────── the in-job script: scripts/region/db-copy.sh (bash + psql/pg_dump/pg_restore) ─────────────

const SCRIPT = readFileSync(new URL("./db-copy.sh", import.meta.url), "utf8");

// ───────────── job lifecycle ─────────────

const report = { at: new Date().toISOString(), mode: MODE, sha, rg: RG, env: ENV, job: JOB, image: IMAGE, tls: TLS_MODE,
  sourceHost: sHost ? hostOf(forLibpq(SOURCE, { direct: true })) : null, targetHost: hostOf(forLibpq(TARGET, { direct: true })), expectedMigrations: EXPECTED };

async function main() {
  const envRes = await arm("GET", `${RGP}/providers/Microsoft.App/managedEnvironments/${ENV}?${API}`);
  const vnet = envRes.properties.vnetConfiguration?.infrastructureSubnetId;
  if (!vnet) throw new Error(`${ENV} has no VNet: a private database is not reachable from it`);
  const ws = envRes.properties.appLogsConfiguration?.logAnalyticsConfiguration?.customerId;
  if (!ws) throw new Error(`${ENV} sends no logs to Log Analytics: the job's result could not be read back`);
  console.log(`plan: ${MODE} ${report.sourceHost ?? "-"} → ${report.targetHost} via job ${JOB} in ${RG}/${ENV} (subnet ${vnet.split("/").pop()}), image ${IMAGE}, tls ${TLS_MODE}`);
  console.log(`      expect ${EXPECTED.length} migrations of ${sha.slice(0, 7)}${flag("--replace") ? "; --replace: target schema public is dropped first" : ""}; script ${SCRIPT.length} chars, ${ROOTS_PEM.split("BEGIN CERTIFICATE").length - 1} CA roots`);
  if (DRY) { console.log(`dry run: nothing created (${((Date.now() - t0) / 1000).toFixed(1)} s)`); return 0; }

  const env = (name, value) => ({ name, value });
  await arm("PUT", `${JOB_PATH}?${API}`, { location: envRes.location, properties: { environmentId: envRes.id, workloadProfileName: "Consumption",
    configuration: { triggerType: "Manual", replicaTimeout: 3600, replicaRetryLimit: 0, manualTriggerConfig: { parallelism: 1, replicaCompletionCount: 1 },
      secrets: [{ name: "dst-url", value: forLibpq(TARGET, { direct: true }) }, ...(SOURCE ? [{ name: "src-url", value: forLibpq(SOURCE, { direct: true }) }] : [])] },
    template: { containers: [{ name: "dbcopy", image: IMAGE, command: ["bash", "-c"], args: [SCRIPT], resources: { cpu: 1, memory: "2Gi" },
      env: [{ name: "DST_URL", secretRef: "dst-url" }, ...(SOURCE ? [{ name: "SRC_URL", secretRef: "src-url" }] : [env("SRC_URL", "")]),
        env("MODE", MODE), env("EXPECTED", EXPECTED.join(",")), env("REPLACE", flag("--replace") ? "1" : "0"), env("TLS_MODE", TLS_MODE), env("ROOTS_PEM", ROOTS_PEM)] }] } } });
  await until(async () => { const j = await arm("GET", `${JOB_PATH}?${API}`); if (j.properties.provisioningState === "Failed") throw new Error("job provisioning failed"); return j.properties.provisioningState === "Succeeded"; },
    { everyMs: 4000, maxMs: 300_000, what: `${JOB} provisioned` });
  const ex = await arm("POST", `${JOB_PATH}/start?${API}`, {});
  const exec = ex.name || ex.id?.split("/").pop();
  console.log(`  execution ${exec} started (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  const status = await until(async () => {
    const e = await arm("GET", `${JOB_PATH}/executions/${exec}?${API}`, undefined, { allow404: true });
    const st = e?.properties?.status;
    return /^(Succeeded|Failed|Stopped|Degraded)$/.test(st || "") && st;
  }, { everyMs: 10_000, maxMs: 3_900_000, what: `${exec} finished` });
  report.execution = { name: exec, status };
  console.log(`  execution ${status}; reading result lines from Log Analytics (ingestion takes a few minutes)…`);

  const kql = `ContainerAppConsoleLogs_CL | where ContainerJobName_s == "${JOB}" and ContainerGroupName_s startswith "${exec}" | project TimeGenerated, Log_s | order by TimeGenerated asc`;
  let lines = [];
  await until(async () => {
    lines = (await laQuery(ws, kql, "PT3H")).map((r) => String(r.Log_s ?? ""));
    return lines.some((l) => l.startsWith("DBCOPY_DONE"));
  }, { everyMs: 20_000, maxMs: 900_000, what: "DBCOPY_DONE in Log Analytics" }).catch((e) => { report.logError = e.message; });
  const parse = (kind) => lines.filter((l) => l.startsWith(`DBCOPY_${kind} `)).map((l) => { try { return JSON.parse(l.slice(kind.length + 8)); } catch { return { raw: l.slice(0, 300) }; } });
  report.start = parse("START")[0];
  report.step = parse("STEP")[0];
  report.tables = parse("TABLE");
  report.result = parse("RESULT")[0] ?? null;
  report.otherLines = lines.filter((l) => !l.startsWith("DBCOPY_")).slice(-30).map((l) => l.slice(0, 300));
  const r = report.result;
  if (r) {
    report.targetMigrations = String(r.targetMigrations || "").split(",").filter(Boolean);
    report.ok = r.ok === true && status === "Succeeded";
  } else report.ok = false;
  return report.ok ? 0 : 1;
}

let code = 1;
try {
  code = await main();
} catch (e) {
  report.error = e.message;
  console.error(`db-copy: ${e.message}`);
} finally {
  if (!DRY && !flag("--keep-job")) {
    await arm("DELETE", `${JOB_PATH}?${API}`, undefined, { allow404: true }).then(() => console.log(`  job ${JOB} deleted (its secrets with it)`), (e) => console.warn(`  delete ${JOB}: ${e.message}`));
  }
}
if (!DRY) {
  mkdirSync(OUT, { recursive: true });
  const file = `${OUT}db-copy-${MODE}-${report.at.replace(/[:.]/g, "-")}.json`;
  writeFileSync(file, JSON.stringify(report, null, 2));
  const r = report.result;
  if (r) {
    console.log(`result: ${r.ok ? "OK" : "FAILED"}${r.stage ? ` at ${r.stage}: ${r.error}` : ""}`);
    if (report.step) console.log(`  dump ${(report.step.dumpBytes / 1e6).toFixed(1)} MB in ${report.step.dumpS} s, restore ${report.step.restoreS} s`);
    if (r.tables !== undefined && MODE !== "migrations") console.log(`  tables ${r.tables}, mismatched [${r.mismatched || ""}], sequences ${r.sequencesMatch ? "match" : "DIFFER"}, migrations source=target ${r.sourceMigrations === r.targetMigrations}`);
    console.log(`  target migrations: ${report.targetMigrations?.length ?? 0}; missing vs ${sha.slice(0, 7)}: [${r.missingMigrations || ""}]`);
  }
  console.log(`report: ${file}`);
}
await sleep(0);
process.exit(code);
