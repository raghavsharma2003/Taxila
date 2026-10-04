// Deploy the Conductor's background host and its scheduled detectors (CONDUCTOR.md §8.1; decision
// conductor-hosting-lanes; BUILD-PLAN W1-D item 4):
//   1) ACA app `taxila-worker` in taxila-web's managed environment: min 1 / max 1 replica, NO ingress, DB_DRIVER=pg,
//      DATABASE_URL = the DIRECT (unpooled) Neon URL (the ticker's session advisory lock does not survive Neon's
//      pooler, X1); liveness GET /healthz on :8081 (container-local; the worker has no ingress);
//   2) --jobs: two ACA scheduled jobs on the same image (they outlive the worker, so they can say it died):
//      `taxila-conductor-canary`  every 15 min  node server/conductor/ops.mjs --canary  (exit 1 = alert)
//      `taxila-conductor-nightly` 22:40 UTC     node server/conductor/ops.mjs --nightly (04:10 IST: rollup + test sweep)
// The worker gets taxila-web's model / storage env (report.daily's writer and Forge read them) and its secrets by
// value, never printed. forge.g2.nightly stays paused (server/conductor/handlers.js) unless FORGE_G2_NIGHTLY=on.
//
//   node scripts/deploy-worker.mjs [--dry-run] [--force] [--jobs] [--jobs-only]
//   test targets:  --app NAME (default taxila-worker; jobs are prefixed by it) --db test (the Neon TEST branch,
//                  CONDUCTOR_TEST_DATABASE_URL) --local (build the WORKING TREE, uploaded; only with --db test)
//                  --manual (jobs are MANUAL-trigger, never scheduled: a proof run starts them by hand, so a scratch
//                  canary with no worker behind it never fails on a timer and mails the owner; only with --db test)
//
// Production (`--db` not test) needs HEAD pushed AND a passing gate for HEAD (infra/gate.mjs), exactly like the web,
// AND every migration of HEAD applied on the target database (migrationsGate; --local test builds skip it).
// Freeze: deploys that touch the Conductor are refused 18:00-21:30 IST (X37); --force overrides.
import { ROOT, acrBuild, arm, loadEnv, sleep } from "../infra/azure.mjs";
import { REPO, branchName, gateEvidence, headSha, migrationsGate } from "../infra/gate.mjs";
import { directUrl } from "../server/conductor/pg.js";
import { createRequire } from "module";
const require_ = createRequire(import.meta.url);

loadEnv();
const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
const DRY = flag("--dry-run"), FORCE = flag("--force"), JOBS = flag("--jobs") || flag("--jobs-only"), JOBS_ONLY = flag("--jobs-only");
const APP = opt("--app", "taxila-worker"), WEB = "taxila-web", ACR = "taxilacr", API = "api-version=2024-03-01";
const TEST_DB = opt("--db", "prod") === "test", LOCAL = flag("--local");
if (LOCAL && !TEST_DB) throw new Error("--local builds an unpushed, ungated tree: only with --db test (never against production data)");
const PROD = !TEST_DB;
const MANUAL = flag("--manual");
if (MANUAL && PROD) throw new Error("--manual (unscheduled jobs) is for --db test proof runs only");

// X37 deploy freeze, evaluated in IST whatever the machine's timezone.
const istMin = (() => { const d = new Date(Date.now() + 330 * 60_000); return d.getUTCHours() * 60 + d.getUTCMinutes(); })();
if (PROD && istMin >= 18 * 60 && istMin < 21 * 60 + 30 && !FORCE && !DRY) throw new Error("deploy freeze 18:00-21:30 IST (X37): peak lessons; re-run after 21:30 or pass --force");

const branch = branchName();
const full = headSha(), sha = full.slice(0, 7);
const tag = LOCAL ? `${sha}-local-${Date.now().toString(36).slice(-5)}` : sha;
if (!LOCAL && !DRY) {
  const { execSync } = await import("child_process");
  const remote = execSync(`git ls-remote origin refs/heads/${branch}`, { cwd: ROOT }).toString().slice(0, 40);
  if (remote !== full) throw new Error(`HEAD ${sha} is not pushed (origin has ${remote.slice(0, 7)}): push first`);
}
if (PROD) {
  const ev = await gateEvidence(full);
  if (!ev && !DRY) throw new Error(`no passing gate for ${sha}: run \`node scripts/deploy-azure.mjs --gate --dry-run\` first. Refusing to deploy the worker.`);
  console.log(`gate: ${ev || "NONE (dry run continues)"}`);
}

/** The worker image's build context, and nothing else (the whole tree is >1 GB of art; Dockerfile.worker copies these). */
function localContext() {
  const { execFileSync } = require_("child_process");
  const all = execFileSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], { cwd: ROOT, maxBuffer: 64 << 20 }).toString().split("\0");
  return all.filter((f) => /^(server|shared|data|db\/migrations)\//.test(f) || ["package.json", "package-lock.json", "Dockerfile.worker"].includes(f));
}
// ── 1. image ──
const image = `${ACR}.azurecr.io/taxila-worker:${tag}`;
if (!DRY) {
  console.log(`building taxila-worker:${tag} from ${LOCAL ? "the working tree" : branch}…`);
  await acrBuild({ images: [`taxila-worker:${tag}`, ...(LOCAL ? [] : ["taxila-worker:latest"])], dockerfile: "Dockerfile.worker",
    ...(LOCAL ? { dir: ROOT, files: localContext() } : { git: { repo: REPO, branch } }) });
}

// ── 2. the bodies, derived from taxila-web (same environment, same registry access, same model/storage env) ──
const web = await arm("GET", `/providers/Microsoft.App/containerApps/${WEB}?${API}`);
const webSecrets = (await arm("POST", `/providers/Microsoft.App/containerApps/${WEB}/listSecrets?${API}`)).value || [];
const secretVal = (name) => webSecrets.find((s) => s.name === name)?.value;
const registries = web.properties.configuration.registries || [];
const secrets = [];
for (const r of registries) if (r.passwordSecretRef) secrets.push({ name: r.passwordSecretRef, value: secretVal(r.passwordSecretRef) });
const webEnv = web.properties.template.containers[0].env;
// The DIRECT Neon URL: the test branch, or an explicit DATABASE_URL_DIRECT, else taxila-web's own DATABASE_URL de-pooled.
const webDbRef = webEnv.find((e) => e.name === "DATABASE_URL");
const pooled = TEST_DB ? process.env.CONDUCTOR_TEST_DATABASE_URL
  : process.env.DATABASE_URL_DIRECT || (webDbRef?.secretRef ? secretVal(webDbRef.secretRef) : webDbRef?.value) || process.env.DATABASE_URL;
if (!pooled) throw new Error(TEST_DB ? "no CONDUCTOR_TEST_DATABASE_URL in .env.local" : "no DATABASE_URL on taxila-web or in .env.local");
secrets.push({ name: "database-url-direct", value: directUrl(pooled) });
// The target database must hold every migration of the sha being deployed, whatever the gate evidence was (a CI run
// cannot check production's schema_migrations). The worker's own boot check would refuse to start anyway; this
// refuses before a revision or a job is created.
if (!LOCAL) {
  try { await migrationsGate(pooled, full); console.log(`migrations: every db/migrations file of ${sha} is applied on the target database`); }
  catch (e) { if (!DRY) throw e; console.log(`WARN ${e.message} (dry run continues)`); }
}

// taxila-web's env minus what is the worker's own (DB, role, host knobs): models + storage for report and Forge jobs.
const OWN = new Set(["DATABASE_URL", "NODE_ENV", "TAXILA_ROLE", "GIT_SHA", "ACCESS_LOG", "WORKER_HEALTH_PORT", "CONDUCTOR_STATEMENT_TIMEOUT_MS", "DB_DRIVER", "TAXILA_HOST", "TAXILA_OPS_KEY"]);
const env = [];
for (const e of webEnv) {
  if (OWN.has(e.name)) continue;
  if (e.secretRef) {
    if (!secrets.some((s) => s.name === e.secretRef)) secrets.push({ name: e.secretRef, value: secretVal(e.secretRef) });
    env.push({ name: e.name, secretRef: e.secretRef });
  } else env.push({ name: e.name, value: e.value });
}
env.push(
  { name: "DATABASE_URL", secretRef: "database-url-direct" },
  { name: "DB_DRIVER", value: "pg" }, { name: "NODE_ENV", value: "production" }, { name: "TAXILA_HOST", value: "azure" },
  { name: "TAXILA_ROLE", value: "worker" }, { name: "GIT_SHA", value: tag },
  { name: "WORKER_HEALTH_PORT", value: "8081" }, { name: "CONDUCTOR_STATEMENT_TIMEOUT_MS", value: "15000" },
);
const template = {
  revisionSuffix: `w${sha}-${Date.now().toString(36).slice(-4)}`,          // unique per revision
  containers: [{ name: "taxila-worker", image, env, resources: { cpu: 0.5, memory: "1Gi" },
    // Liveness: /healthz on the container port (no ingress needed) answers 503 when a loop has stalled; ACA then
    // restarts the replica. The in-process watchdog (server/worker.mjs) exits on the same condition as a backstop.
    probes: [{ type: "Liveness", httpGet: { path: "/healthz", port: 8081 }, initialDelaySeconds: 20, periodSeconds: 30, timeoutSeconds: 5, failureThreshold: 3 }] }],
  // min 1: timers and the dirty set must always have a host. max 1 at M0 (leader election makes 2 safe; §8.1 allows 2).
  scale: { minReplicas: 1, maxReplicas: 1, rules: [] },
};
const configuration = { activeRevisionsMode: "Single", ingress: null, registries, secrets };
const envId = web.properties.managedEnvironmentId ?? web.properties.environmentId;
const body = { location: web.location, properties: { managedEnvironmentId: envId, configuration, template } };

/** An ACA scheduled job running ops.mjs on the worker image. */
const jobBody = (cron, args, timeoutSec) => ({ location: web.location, properties: { environmentId: envId,
  configuration: { replicaTimeout: timeoutSec, replicaRetryLimit: 0, registries, secrets,
    ...(MANUAL ? { triggerType: "Manual", manualTriggerConfig: { parallelism: 1, replicaCompletionCount: 1 } }
      : { triggerType: "Schedule", scheduleTriggerConfig: { cronExpression: cron, parallelism: 1, replicaCompletionCount: 1 } }) },
  template: { containers: [{ name: "ops", image, command: ["node", "server/conductor/ops.mjs", ...args],
    env: env.filter((e) => ["DATABASE_URL", "DB_DRIVER", "NODE_ENV", "GIT_SHA", "TAXILA_HOST"].includes(e.name)), resources: { cpu: 0.25, memory: "0.5Gi" } }] } } });
const JOBS_SPEC = [
  [`${APP === "taxila-worker" ? "taxila-conductor" : APP}-canary`, "*/15 * * * *", ["--canary"], 120],
  [`${APP === "taxila-worker" ? "taxila-conductor" : APP}-nightly`, "40 22 * * *", ["--nightly"], 900],
];

if (DRY) {
  const red = JSON.parse(JSON.stringify(body));
  for (const s of red.properties.configuration.secrets) s.value = s.value ? "<redacted>" : "<MISSING>";
  console.log(JSON.stringify(red, null, 2));
  for (const [name, cron, args] of JOBS_SPEC) console.log(`job ${name}: "${cron}" node server/conductor/ops.mjs ${args.join(" ")}`);
  process.exit(0);
}
if (secrets.some((s) => !s.value)) throw new Error(`missing secret value(s): ${secrets.filter((s) => !s.value).map((s) => s.name).join(", ")}`);

if (!JOBS_ONLY) {
  const existing = await arm("GET", `/providers/Microsoft.App/containerApps/${APP}?${API}`, undefined, { allow404: true });
  if (existing) {
    console.log(`rolling ${APP} to ${image}…`);
    await arm("PATCH", `/providers/Microsoft.App/containerApps/${APP}?${API}`, { properties: { configuration, template } });
  } else {
    console.log(`creating ${APP} (${image}) in ${envId.split("/").pop()}…`);
    await arm("PUT", `/providers/Microsoft.App/containerApps/${APP}?${API}`, body);
  }
  // ── 3. wait for the new revision to run ──
  let live = false;
  for (let i = 0; i < 60 && !live; i++) {
    await sleep(6000);
    const a = await arm("GET", `/providers/Microsoft.App/containerApps/${APP}?${API}`);
    if (a.properties.provisioningState === "Failed") throw new Error(`provisioning failed (latest ready revision ${a.properties.latestReadyRevisionName} keeps running)`);
    if (a.properties.provisioningState !== "Succeeded" || !a.properties.template.containers[0].image.endsWith(tag)) continue;
    const rev = await arm("GET", `/providers/Microsoft.App/containerApps/${APP}/revisions/${a.properties.latestRevisionName}?${API}`);
    const { runningState, healthState, replicas } = rev.properties;
    process.stdout.write(`  ${a.properties.latestRevisionName}: ${runningState} ${healthState} replicas=${replicas}\n`);
    if (/^Running/.test(runningState || "") && healthState !== "Unhealthy" && replicas >= 1) {
      console.log(`live: ${APP} revision ${a.properties.latestRevisionName} (image ${tag})`);
      live = true;
    }
  }
  if (!live) throw new Error("worker revision did not reach Running in time");
}
if (JOBS) {
  for (const [name, cron, args, timeoutSec] of JOBS_SPEC) {
    console.log(`job ${name}: "${cron}" ops.mjs ${args.join(" ")}`);
    await arm("PUT", `/providers/Microsoft.App/jobs/${name}?${API}`, jobBody(cron, args, timeoutSec));
  }
  console.log("jobs scheduled (start one now: POST …/jobs/<name>/start)");
}
