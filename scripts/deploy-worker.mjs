// Deploy the pushed branch as the Container App `taxila-worker` (CONDUCTOR.md §8.1; decision conductor-hosting-lanes):
//   1) ACR builds Dockerfile.worker from the GitHub branch (no local Docker), tagged with the commit sha;
//   2) creates `taxila-worker` in taxila-web's managed environment if it does not exist, else rolls a new revision:
//      min 1 / max 1 replica, NO ingress, DB_DRIVER=pg, DATABASE_URL = the DIRECT (unpooled) Neon URL, because
//      the ticker's session advisory lock does not survive Neon's pooler (X1);
//   3) waits until the new revision is Running (there is no HTTP health endpoint: the worker has no ingress).
// Freeze: deploys that touch the Conductor are refused 18:00-21:30 IST (X37); --force overrides.
// Needs AZURE_SP_CLIENT_ID / AZURE_SP_SECRET / AZURE_TENANT_ID (+ .env.local). PUSH FIRST: ACR builds what is on
// GitHub, not the working tree. Deploy order (§3.12): taxila-web (scripts/deploy-azure.mjs) first, then this.
// Flags: --dry-run (read-only: prints the planned app body with every secret redacted; no build, no write), --force.
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { directUrl } from "../server/conductor/pg.js";

const ROOT = new URL("..", import.meta.url).pathname;
const DRY = process.argv.includes("--dry-run"), FORCE = process.argv.includes("--force");
for (const line of readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
const { AZURE_SP_CLIENT_ID, AZURE_SP_SECRET, AZURE_TENANT_ID, AZURE_SUBSCRIPTION_ID: SUB, AZURE_RESOURCE_GROUP: RGN } = process.env;
if (!AZURE_SP_CLIENT_ID || !AZURE_SP_SECRET || !AZURE_TENANT_ID) throw new Error("set AZURE_SP_CLIENT_ID, AZURE_SP_SECRET, AZURE_TENANT_ID in .env.local");
const APP = "taxila-worker", WEB = "taxila-web", ACR = "taxilacr", API = "api-version=2024-03-01";

// X37 deploy freeze, evaluated in IST whatever the machine's timezone.
const istMin = (() => { const d = new Date(Date.now() + 330 * 60_000); return d.getUTCHours() * 60 + d.getUTCMinutes(); })();
if (istMin >= 18 * 60 && istMin < 21 * 60 + 30 && !FORCE && !DRY) throw new Error("deploy freeze 18:00-21:30 IST (X37): peak lessons; re-run after 21:30 or pass --force");

const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT }).toString().trim();
const sha = execSync("git rev-parse --short HEAD", { cwd: ROOT }).toString().trim();
if (!DRY) {
  const remote = execSync(`git ls-remote origin refs/heads/${branch}`, { cwd: ROOT }).toString().slice(0, 7);
  if (remote !== sha) throw new Error(`HEAD ${sha} is not pushed (origin has ${remote}) — push first`);
}

const tok = (await (await fetch(`https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`, { method: "POST",
  body: new URLSearchParams({ client_id: AZURE_SP_CLIENT_ID, client_secret: AZURE_SP_SECRET, grant_type: "client_credentials", scope: "https://management.azure.com/.default" }) })).json()).access_token;
const RG = `https://management.azure.com/subscriptions/${SUB}/resourceGroups/${RGN}`;
const arm = async (method, path, body, { allow404 = false } = {}) => {
  const r = await fetch(RG + path, { method, headers: { authorization: `Bearer ${tok}`, "content-type": "application/json", ...(body ? {} : { "content-length": "0" }) }, body: body ? JSON.stringify(body) : undefined });
  if (allow404 && r.status === 404) return null;
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(`${method} ${path.split("?")[0]} ${r.status} ${JSON.stringify(j).slice(0, 300)}`); return j;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── 1. image ──
const image = `${ACR}.azurecr.io/${APP}:${sha}`;
if (!DRY) {
  console.log(`building ${APP}:${sha} from ${branch}…`);
  const run = await arm("POST", `/providers/Microsoft.ContainerRegistry/registries/${ACR}/scheduleRun?api-version=2019-06-01-preview`, {
    type: "DockerBuildRequest", imageNames: [`${APP}:${sha}`, `${APP}:latest`], isPushEnabled: true,
    sourceLocation: `https://github.com/raghavsharma2003/Taxila.git#${branch}`, dockerFilePath: "Dockerfile.worker",
    platform: { os: "Linux", architecture: "amd64" }, timeout: 1800 });
  const runId = run.properties.runId;
  let st;
  do { await sleep(10000); st = (await arm("GET", `/providers/Microsoft.ContainerRegistry/registries/${ACR}/runs/${runId}?api-version=2019-06-01-preview`)).properties.status; process.stdout.write(`  ${st}\n`); }
  while (["Queued", "Started", "Running"].includes(st));
  if (st !== "Succeeded") {
    const { logLink } = await arm("POST", `/providers/Microsoft.ContainerRegistry/registries/${ACR}/runs/${runId}/listLogSasUrl?api-version=2019-06-01-preview`);
    console.error((await (await fetch(logLink)).text()).split("\n").slice(-40).join("\n")); process.exit(1);
  }
}

// ── 2. the app body, derived from taxila-web (same environment, same registry access) ──
const web = await arm("GET", `/providers/Microsoft.App/containerApps/${WEB}?${API}`);
const webSecrets = (await arm("POST", `/providers/Microsoft.App/containerApps/${WEB}/listSecrets?${API}`)).value || [];
const secretVal = (name) => webSecrets.find((s) => s.name === name)?.value;
const registries = web.properties.configuration.registries || [];
const secrets = [];
for (const r of registries) if (r.passwordSecretRef) secrets.push({ name: r.passwordSecretRef, value: secretVal(r.passwordSecretRef) });
const usesIdentity = registries.some((r) => r.identity);
// The DIRECT Neon URL: an explicit DATABASE_URL_DIRECT, else taxila-web's own DATABASE_URL with the pooler removed.
const webDbRef = web.properties.template.containers[0].env.find((e) => e.name === "DATABASE_URL");
const pooled = process.env.DATABASE_URL_DIRECT || (webDbRef?.secretRef ? secretVal(webDbRef.secretRef) : webDbRef?.value) || process.env.DATABASE_URL;
if (!pooled) throw new Error("no DATABASE_URL on taxila-web or in .env.local");
secrets.push({ name: "database-url-direct", value: directUrl(pooled) });

const env = [
  { name: "DATABASE_URL", secretRef: "database-url-direct" },
  { name: "DB_DRIVER", value: "pg" }, { name: "NODE_ENV", value: "production" }, { name: "TAXILA_HOST", value: "azure" },
  { name: "TAXILA_ROLE", value: "worker" }, { name: "GIT_SHA", value: sha },
];
const template = {
  revisionSuffix: `w${sha}-${Date.now().toString(36).slice(-4)}`,          // unique per revision
  containers: [{ name: APP, image, env, resources: { cpu: 0.5, memory: "1Gi" } }],
  // min 1: timers and the dirty set must always have a host. max 1 at M0 (leader election makes 2 safe; §8.1 allows 2).
  scale: { minReplicas: 1, maxReplicas: 1, rules: [] },
};
const configuration = { activeRevisionsMode: "Single", ingress: null, registries, secrets };
const body = { location: web.location, ...(usesIdentity ? { identity: { type: "SystemAssigned" } } : {}),
  properties: { managedEnvironmentId: web.properties.managedEnvironmentId ?? web.properties.environmentId, configuration, template } };

if (DRY) {
  const red = JSON.parse(JSON.stringify(body));
  for (const s of red.properties.configuration.secrets) s.value = s.value ? "<redacted>" : "<MISSING>";
  console.log(JSON.stringify(red, null, 2));
  if (usesIdentity) console.log("NOTE: taxila-web pulls from ACR by managed identity; the worker's identity needs AcrPull on taxilacr (owner action).");
  process.exit(0);
}
if (secrets.some((s) => !s.value)) throw new Error(`missing secret value(s): ${secrets.filter((s) => !s.value).map((s) => s.name).join(", ")}`);

const existing = await arm("GET", `/providers/Microsoft.App/containerApps/${APP}?${API}`, undefined, { allow404: true });
if (existing) {
  console.log(`rolling ${APP} to ${image}…`);
  await arm("PATCH", `/providers/Microsoft.App/containerApps/${APP}?${API}`, { properties: { configuration, template } });
} else {
  console.log(`creating ${APP} (${image}) in ${body.properties.managedEnvironmentId.split("/").pop()}…`);
  if (usesIdentity) console.log("NOTE: grant the new app's system identity AcrPull on taxilacr, or the first revision cannot pull.");
  await arm("PUT", `/providers/Microsoft.App/containerApps/${APP}?${API}`, body);
}

// ── 3. wait for the new revision to run ──
for (let i = 0; i < 60; i++) {
  await sleep(6000);
  const a = await arm("GET", `/providers/Microsoft.App/containerApps/${APP}?${API}`);
  if (a.properties.provisioningState === "Failed") throw new Error(`provisioning failed (latest ready revision ${a.properties.latestReadyRevisionName} keeps running)`);
  if (a.properties.provisioningState !== "Succeeded" || !a.properties.template.containers[0].image.endsWith(sha)) continue;
  const rev = await arm("GET", `/providers/Microsoft.App/containerApps/${APP}/revisions/${a.properties.latestRevisionName}?${API}`);
  const { runningState, healthState, replicas } = rev.properties;
  process.stdout.write(`  ${a.properties.latestRevisionName}: ${runningState} ${healthState} replicas=${replicas}\n`);
  if (/^Running/.test(runningState || "") && healthState !== "Unhealthy" && replicas >= 1) {
    console.log(`live: ${APP} revision ${a.properties.latestRevisionName} (image ${sha}); logs: az containerapp logs show -n ${APP} -g ${RGN}`);
    process.exit(0);
  }
}
throw new Error("worker revision did not reach Running in time");
