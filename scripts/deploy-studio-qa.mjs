// Deploy the Live Studio gate service `studio-qa` (LIVE-STUDIO D7 fallback lane until O-1 ACA Sandboxes) — idempotent:
//   1) ACR taxilacr builds infra/studio-qa/Dockerfile from the working tree's gate files (an uploaded build context), or
//      from the pushed branch with --from-github (like scripts/deploy-azure.mjs). Tag = the context's content hash.
//   2) the untrusted managed environment `taxila-forge-untrusted` must exist (scripts/forge-g2-deploy.mjs creates it):
//      generated code never shares an environment with taxila-web.
//   3) creates / updates the Container App `studio-qa`: 1 vCPU / 2 GiB, min 1 replica (≈ $78/month always-on), port 8080.
//      Ingress: taxila-web lives in ANOTHER environment, and internal ingress is only reachable inside its own one, so
//      ingress is external but locked: ipSecurityRestrictions allow only taxila-web's outbound IPs, plus a bearer token
//      (secret `studio-qa-token`). The app holds no other secret and no child data; the gate's Chromium aborts every
//      request (route-recorded) under a connect-src 'none' CSP whatever the environment's egress.
//   4) --wire-web (opt-in; it makes a new taxila-web revision): sets STUDIO_QA_URL + STUDIO_QA_TOKEN (secretRef) on
//      taxila-web. Without it the script prints what the web app needs (the main loop's deploy owns taxila-web).
// Needs AZURE_SP_* + AZURE_SUBSCRIPTION_ID + AZURE_RESOURCE_GROUP (.env.local). Flags: --from-github, --dry-run, --wire-web, --image <tag>.
// Never prints a secret.
import { execFileSync, execSync } from "child_process";
import { readFileSync, mkdtempSync, statSync } from "fs";
import { createHash, randomBytes } from "crypto";
import { tmpdir } from "os";
import { join, dirname, resolve, relative } from "path";
import { existsSync } from "fs";
import { arm } from "../server/forge/g2/azure-job.js";

const ROOT = new URL("..", import.meta.url).pathname;
for (const line of readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
const DRY = process.argv.includes("--dry-run"), GH = process.argv.includes("--from-github"), WIRE = process.argv.includes("--wire-web");
const IMAGE_TAG = process.argv.includes("--image") ? process.argv[process.argv.indexOf("--image") + 1] : null;
const API = "api-version=2024-03-01", ACR = "taxilacr", IMAGE = "studio-qa", APP = "studio-qa", ENV = "taxila-forge-untrusted", LOCATION = "eastus2";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CONTEXT = ["infra/studio-qa", "server/studio/qa", "server/studio/archetypes", "server/studio/fixers.js"];

// the image carries only CONTEXT: refuse to build one whose import closure reaches outside it (it would crash at boot)
{
  const seen = new Set(), missing = [];
  const walk = (file) => {
    if (seen.has(file)) return; seen.add(file);
    const src = readFileSync(file, "utf8").replace(/^\s*\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
    for (const m of src.matchAll(/(?:import|export)\s[^"'`]*?from\s*["'](\.[^"']+)["']|import\(\s*["'](\.[^"']+)["']\s*\)/g)) {
      const dep = resolve(dirname(file), m[1] || m[2]);
      const rel = relative(ROOT, dep);
      if (!existsSync(dep)) { missing.push(`${relative(ROOT, file)} → ${rel} (no such file)`); continue; }
      if (!CONTEXT.some((c) => rel === c || rel.startsWith(c + "/"))) missing.push(`${relative(ROOT, file)} → ${rel} (not in the image context)`);
      else if (dep.endsWith(".js") || dep.endsWith(".mjs")) walk(dep);
    }
  };
  walk(resolve(ROOT, "infra/studio-qa/server.mjs"));
  if (missing.length) { console.error("studio-qa import closure is not in the image:\n  " + missing.join("\n  ")); process.exit(1); }
  console.log(`import closure ok: ${seen.size} files`);
}

// ── 1. image ──
let tag, sourceLocation;
if (IMAGE_TAG) tag = IMAGE_TAG;
else if (GH) {
  const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT }).toString().trim();
  tag = execSync("git rev-parse --short HEAD", { cwd: ROOT }).toString().trim();
  sourceLocation = `https://github.com/raghavsharma2003/Taxila.git#${branch}`;
} else {
  const dir = mkdtempSync(join(tmpdir(), "studio-qa-ctx-"));
  const tgz = join(dir, "ctx.tar.gz");
  execFileSync("tar", ["--sort=name", "--mtime=2026-01-01", "--owner=0", "--group=0", "--numeric-owner", "-czf", tgz, "--exclude=*.png", ...CONTEXT], { cwd: ROOT });
  tag = "wt-" + createHash("sha256").update(readFileSync(tgz)).digest("hex").slice(0, 12);
  console.log(`context ${CONTEXT.length} paths, ${statSync(tgz).size} B, tag ${tag}`);
  if (!DRY) {
    const up = await arm("POST", `/providers/Microsoft.ContainerRegistry/registries/${ACR}/listBuildSourceUploadUrl?api-version=2019-06-01-preview`);
    const put = await fetch(up.uploadUrl, { method: "PUT", headers: { "x-ms-blob-type": "BlockBlob", "content-type": "application/gzip" }, body: readFileSync(tgz) });
    if (put.status !== 201) throw new Error(`context upload ${put.status}`);
    sourceLocation = up.relativePath;
  }
}
const image = `${ACR}.azurecr.io/${IMAGE}:${tag}`;
if (!DRY && !IMAGE_TAG) {
  console.log(`building ${image}…`);
  const run = await arm("POST", `/providers/Microsoft.ContainerRegistry/registries/${ACR}/scheduleRun?api-version=2019-06-01-preview`, {
    type: "DockerBuildRequest", imageNames: [`${IMAGE}:${tag}`, `${IMAGE}:latest`], isPushEnabled: true, sourceLocation,
    dockerFilePath: "infra/studio-qa/Dockerfile", platform: { os: "Linux", architecture: "amd64" }, timeout: 1800 });
  const runId = run.properties.runId;
  let st;
  do { await sleep(10000); st = (await arm("GET", `/providers/Microsoft.ContainerRegistry/registries/${ACR}/runs/${runId}?api-version=2019-06-01-preview`)).properties.status; process.stdout.write(`  ${st}\n`); }
  while (["Queued", "Started", "Running"].includes(st));
  if (st !== "Succeeded") {
    const { logLink } = await arm("POST", `/providers/Microsoft.ContainerRegistry/registries/${ACR}/runs/${runId}/listLogSasUrl?api-version=2019-06-01-preview`);
    console.error((await (await fetch(logLink)).text()).split("\n").slice(-40).join("\n")); process.exit(1);
  }
}

// ── 2. environment (must exist: forge-g2-deploy.mjs creates it) ──
const env = await arm("GET", `/providers/Microsoft.App/managedEnvironments/${ENV}?${API}`, undefined, { allow404: true });
if (!env && !DRY) throw new Error(`${ENV} does not exist: run scripts/forge-g2-deploy.mjs first (it creates the untrusted environment)`);

// ── 3. the app ──
const web = await arm("GET", `/providers/Microsoft.App/containerApps/taxila-web?${API}`);
const webIps = (web.properties.outboundIpAddresses ?? []).filter(Boolean);
// a Consumption environment reports its whole shared outbound pool (401 addresses on 2026-10-04), more than an ingress
// allow-list should carry: above 64 the lock is the bearer token alone (logged), never an open ingress without it
const IP_LOCK = webIps.length > 0 && webIps.length <= 64;
const webSecrets = (await arm("POST", `/providers/Microsoft.App/containerApps/taxila-web/listSecrets?${API}`)).value || [];
const registries = web.properties.configuration.registries || [];
const existing = await arm("GET", `/providers/Microsoft.App/containerApps/${APP}?${API}`, undefined, { allow404: true });
let token = null;
if (existing) token = ((await arm("POST", `/providers/Microsoft.App/containerApps/${APP}/listSecrets?${API}`)).value || []).find((s) => s.name === "studio-qa-token")?.value ?? null;
token = token ?? randomBytes(24).toString("base64url");
const secrets = registries.filter((r) => r.passwordSecretRef).map((r) => ({ name: r.passwordSecretRef, value: webSecrets.find((s) => s.name === r.passwordSecretRef)?.value }));
secrets.push({ name: "studio-qa-token", value: token });
const body = { location: LOCATION, properties: {
  environmentId: env?.id ?? `/subscriptions/${process.env.AZURE_SUBSCRIPTION_ID}/resourceGroups/${process.env.AZURE_RESOURCE_GROUP}/providers/Microsoft.App/managedEnvironments/${ENV}`,
  workloadProfileName: "Consumption",
  configuration: {
    activeRevisionsMode: "Single", registries, secrets,
    ingress: { external: true, targetPort: 8080, transport: "http", allowInsecure: false,
      ...(IP_LOCK ? { ipSecurityRestrictions: webIps.map((ip, i) => ({ name: `taxila-web-${i}`, ipAddressRange: `${ip}/32`, action: "Allow" })) } : {}) },
  },
  template: {
    containers: [{ name: "studio-qa", image, resources: { cpu: 1, memory: "2Gi" },
      env: [{ name: "STUDIO_QA_TOKEN", secretRef: "studio-qa-token" }, { name: "STUDIO_QA_CONCURRENCY", value: "2" }, { name: "PORT", value: "8080" }],
      probes: [{ type: "Liveness", httpGet: { path: "/healthz", port: 8080 }, periodSeconds: 30 }, { type: "Readiness", httpGet: { path: "/healthz", port: 8080 }, periodSeconds: 10 }] }],
    scale: { minReplicas: 1, maxReplicas: 3, rules: [{ name: "http", http: { metadata: { concurrentRequests: "4" } } }] },
  } } };
if (DRY) {
  const red = JSON.parse(JSON.stringify(body)); for (const s of red.properties.configuration.secrets) s.value = s.value ? "<redacted>" : "<MISSING>";
  console.log(JSON.stringify(red, null, 1));
  console.log(`dry run: image ${image}; ingress lock: ${IP_LOCK ? `${webIps.length} taxila-web IPs + token` : `token only (${webIps.length} shared outbound IPs)`}`);
  process.exit(0);
}
if (!IP_LOCK) console.log(`ingress lock: bearer token only (taxila-web reports ${webIps.length} shared outbound IPs)`);
if (secrets.some((s) => !s.value)) throw new Error(`missing secret value(s): ${secrets.filter((s) => !s.value).map((s) => s.name).join(", ")}`);
console.log(`putting ${APP} (${image})…`);
await arm("PUT", `/providers/Microsoft.App/containerApps/${APP}?${API}`, body);
let app;
for (let i = 0; i < 60; i++) {
  await sleep(5000);
  app = await arm("GET", `/providers/Microsoft.App/containerApps/${APP}?${API}`);
  process.stdout.write(`  ${app.properties.provisioningState}\n`);
  if (app.properties.provisioningState === "Succeeded") break;
  if (app.properties.provisioningState === "Failed") throw new Error("studio-qa provisioning failed");
}
const fqdn = app.properties.configuration.ingress.fqdn;
console.log(`ready: https://${fqdn} (image ${tag}); ${IP_LOCK ? `allowed from ${webIps.length} taxila-web outbound IP(s)` : "token-locked"}`);

// ── 4. the web app's side ──
if (!WIRE) {
  console.log(`taxila-web needs: STUDIO_QA_URL=https://${fqdn} and STUDIO_QA_TOKEN (secretRef studio-qa-token, copied from ${APP}). Re-run with --wire-web to set them.`);
  process.exit(0);
}
const w = web;
const ws = [...(w.properties.configuration.secrets ?? []).map((s) => ({ name: s.name, value: webSecrets.find((x) => x.name === s.name)?.value }))].filter((s) => s.name !== "studio-qa-token");
ws.push({ name: "studio-qa-token", value: token });
w.properties.configuration.secrets = ws;
for (const c of w.properties.template.containers) {
  c.env = (c.env ?? []).filter((e) => e.name !== "STUDIO_QA_URL" && e.name !== "STUDIO_QA_TOKEN");
  c.env.push({ name: "STUDIO_QA_URL", value: `https://${fqdn}` }, { name: "STUDIO_QA_TOKEN", secretRef: "studio-qa-token" });
}
await arm("PATCH", `/providers/Microsoft.App/containerApps/taxila-web?${API}`, { properties: { configuration: { secrets: ws }, template: w.properties.template } });
console.log("taxila-web wired (a new revision rolls out)");
