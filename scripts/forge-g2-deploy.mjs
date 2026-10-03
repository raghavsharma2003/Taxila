// Deploy the Forge G2 runner (FACTORY.md §2.9 Phase 0) — idempotent:
//   1) ACR taxilacr builds infra/forge-runner/Dockerfile. Source: the WORKING TREE's runner files uploaded as a build
//      context (ACR listBuildSourceUploadUrl), because this workstream may not push; `--from-github` builds the pushed
//      branch instead, exactly like scripts/deploy-azure.mjs. The tag is the context's content hash.
//   2) creates the managed environment `taxila-forge-untrusted` (Consumption, no Log Analytics) if missing: a SEPARATE
//      environment from taxila-env, so runner replicas never share a network/env boundary with taxila-web;
//   3) creates/updates the ACA Job `forge-g2-runner`: manual trigger, 2 vCPU / 4 GiB, replicaTimeout 1800,
//      replicaRetryLimit 0, parallelism 1. Secrets: the AOAI key only (the storage key is NOT given: every execution
//      gets a 2-hour SAS for ITS OWN run container g2run-<buildId> in its start override, server/forge/g2/azure-job.js;
//      the private queue/catalogue container is never reachable from a runner).
// Needs AZURE_SP_* + AZURE_SUBSCRIPTION_ID + AZURE_RESOURCE_GROUP (+ .env.local). Flags: --from-github, --dry-run.
import { execFileSync, execSync } from "child_process";
import { readFileSync, mkdtempSync, statSync } from "fs";
import { createHash } from "crypto";
import { tmpdir } from "os";
import { join } from "path";
import { arm, JOB } from "../server/forge/g2/azure-job.js";

const ROOT = new URL("..", import.meta.url).pathname;
for (const line of readFileSync(ROOT + ".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}
const DRY = process.argv.includes("--dry-run"), GH = process.argv.includes("--from-github");
const IMAGE_TAG = process.argv.includes("--image") ? process.argv[process.argv.indexOf("--image") + 1] : null;   // reuse a built tag
const API = "api-version=2024-03-01", ACR = "taxilacr", IMAGE = "forge-g2-runner";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CONTEXT = ["infra/forge-runner", "server/forge/g2", "server/forge/kitmath.js", "server/director/items.js", "server/director/register.js", "server/azure.js", "data/kits"];

// The image carries only CONTEXT: walk the runner's relative-import closure and refuse to build an image that would
// crash at boot (measured: items.js gained ./register.js from another workstream and two Azure builds died on it).
{
  const { dirname, resolve, relative } = await import("path");
  const { existsSync } = await import("fs");
  const seen = new Set(), missing = [];
  const walk = (file) => {
    if (seen.has(file)) return; seen.add(file);
    const src = readFileSync(file, "utf8").replace(/^\s*\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");   // JSDoc type imports are not loads
    for (const m of src.matchAll(/(?:import|export)\s[^"'`]*?from\s*["'](\.[^"']+)["']|import\(\s*["'](\.[^"']+)["']\s*\)/g)) {
      const dep = resolve(dirname(file), m[1] || m[2]);
      const rel = relative(ROOT, dep);
      if (rel.startsWith("server/conductor/")) continue;                  // conductor-job.js only: never loaded in the runner
      if (!existsSync(dep)) { missing.push(`${relative(ROOT, file)} → ${rel} (no such file)`); continue; }
      if (!CONTEXT.some((c) => rel === c || rel.startsWith(c + "/"))) missing.push(`${relative(ROOT, file)} → ${rel} (not in the image context)`);
      else if (dep.endsWith(".js")) walk(dep);
    }
  };
  for (const entry of ["server/forge/g2/job-entry.js", "server/forge/g2/run-build.js"]) walk(resolve(ROOT, entry));
  if (missing.length) { console.error("runner import closure is not in the image:\n  " + missing.join("\n  ")); process.exit(1); }
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
  const dir = mkdtempSync(join(tmpdir(), "forge-g2-ctx-"));
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
    dockerFilePath: "infra/forge-runner/Dockerfile", platform: { os: "Linux", architecture: "amd64" }, timeout: 1800 });
  const runId = run.properties.runId;
  let st;
  do { await sleep(10000); st = (await arm("GET", `/providers/Microsoft.ContainerRegistry/registries/${ACR}/runs/${runId}?api-version=2019-06-01-preview`)).properties.status; process.stdout.write(`  ${st}\n`); }
  while (["Queued", "Started", "Running"].includes(st));
  if (st !== "Succeeded") {
    const { logLink } = await arm("POST", `/providers/Microsoft.ContainerRegistry/registries/${ACR}/runs/${runId}/listLogSasUrl?api-version=2019-06-01-preview`);
    console.error((await (await fetch(logLink)).text()).split("\n").slice(-40).join("\n")); process.exit(1);
  }
}

// ── 2. environment ──
let env = await arm("GET", `/providers/Microsoft.App/managedEnvironments/${JOB.env}?${API}`, undefined, { allow404: true });
for (let i = 0; env && env.properties.provisioningState !== "Succeeded" && i < 90; i++) {
  if (env.properties.provisioningState === "Failed") throw new Error("environment provisioning failed");
  process.stdout.write(`  env ${env.properties.provisioningState}\n`); await sleep(10000);
  env = await arm("GET", `/providers/Microsoft.App/managedEnvironments/${JOB.env}?${API}`);
}
if (!env) {
  const body = { location: JOB.location, properties: { appLogsConfiguration: null, zoneRedundant: false, workloadProfiles: [{ name: "Consumption", workloadProfileType: "Consumption" }] } };
  if (DRY) console.log("would create environment", JSON.stringify(body));
  else {
    console.log(`creating environment ${JOB.env}…`);
    await arm("PUT", `/providers/Microsoft.App/managedEnvironments/${JOB.env}?${API}`, body);
    for (let i = 0; i < 90; i++) { await sleep(10000); env = await arm("GET", `/providers/Microsoft.App/managedEnvironments/${JOB.env}?${API}`); process.stdout.write(`  env ${env.properties.provisioningState}\n`); if (env.properties.provisioningState === "Succeeded") break; if (env.properties.provisioningState === "Failed") throw new Error("environment provisioning failed"); }
  }
}

// ── 3. job ──
const web = await arm("GET", `/providers/Microsoft.App/containerApps/taxila-web?${API}`);
const webSecrets = (await arm("POST", `/providers/Microsoft.App/containerApps/taxila-web/listSecrets?${API}`)).value || [];
const registries = web.properties.configuration.registries || [];
const secrets = registries.filter((r) => r.passwordSecretRef).map((r) => ({ name: r.passwordSecretRef, value: webSecrets.find((s) => s.name === r.passwordSecretRef)?.value }));
secrets.push({ name: "aoai-key", value: process.env.AZURE_OPENAI_API_KEY });
const e = (name, value) => ({ name, value });
const containerEnv = [
  e("NODE_ENV", "production"), e("AZURE_OPENAI_ENDPOINT", process.env.AZURE_OPENAI_ENDPOINT), { name: "AZURE_OPENAI_API_KEY", secretRef: "aoai-key" },
  e("DEPLOY_CODEX", process.env.DEPLOY_CODEX || "taxila-codex"), e("DEPLOY_BRAIN", process.env.DEPLOY_BRAIN || "taxila-brain"),
  e("AZURE_STORAGE_ACCOUNT", process.env.AZURE_STORAGE_ACCOUNT), e("AZURE_STORAGE_CONTAINER", process.env.AZURE_STORAGE_CONTAINER || "forge"),
  e("FORGE_PUBLIC_BASE", process.env.FORGE_PUBLIC_BASE || ""), e("FORGE_CHROMIUM_SANDBOX", "1"), e("FORGE_G2_IMAGE", tag),
];
const jobBody = { location: JOB.location, properties: {
  environmentId: env?.id ?? `/subscriptions/${process.env.AZURE_SUBSCRIPTION_ID}/resourceGroups/${process.env.AZURE_RESOURCE_GROUP}/providers/Microsoft.App/managedEnvironments/${JOB.env}`,
  workloadProfileName: "Consumption",
  configuration: { triggerType: "Manual", replicaTimeout: 1800, replicaRetryLimit: 0, manualTriggerConfig: { parallelism: 1, replicaCompletionCount: 1 }, registries, secrets },
  template: { containers: [{ name: JOB.container, image, env: containerEnv, resources: { cpu: JOB.cpu, memory: JOB.memory } }] } } };
if (DRY) {
  const red = JSON.parse(JSON.stringify(jobBody)); for (const s of red.properties.configuration.secrets) s.value = s.value ? "<redacted>" : "<MISSING>";
  console.log(JSON.stringify(red, null, 1)); process.exit(0);
}
if (secrets.some((s) => !s.value)) throw new Error(`missing secret value(s): ${secrets.filter((s) => !s.value).map((s) => s.name).join(", ")}`);
console.log(`putting job ${JOB.name} (${image})…`);
await arm("PUT", `/providers/Microsoft.App/jobs/${JOB.name}?${API}`, jobBody);
for (let i = 0; i < 60; i++) {
  await sleep(5000);
  const j = await arm("GET", `/providers/Microsoft.App/jobs/${JOB.name}?${API}`);
  process.stdout.write(`  job ${j.properties.provisioningState}\n`);
  if (j.properties.provisioningState === "Succeeded") { console.log(`ready: ${JOB.name} in ${JOB.env}, image ${tag}`); process.exit(0); }
  if (j.properties.provisioningState === "Failed") throw new Error("job provisioning failed");
}
throw new Error("job did not provision in time");
