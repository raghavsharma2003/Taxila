// Shared Azure plumbing for the deploy and infra scripts (W1-D): .env.local loading, a service-principal token per
// resource, and small ARM / Log Analytics helpers. Plain fetch, no SDK, no az CLI (the sandbox has neither).
// Never prints a secret: errors carry the ARM error body (which holds no secret values) cut to 400 chars.
import { readFileSync, existsSync } from "fs";

export const ROOT = new URL("..", import.meta.url).pathname;

/** Load .env.local into process.env (existing values win). */
export function loadEnv(file = ROOT + ".env.local") {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
  }
}

const tokens = new Map();
/** A client-credentials token for `scope` (default ARM), cached until 5 min before expiry. */
export async function token(scope = "https://management.azure.com/.default") {
  const hit = tokens.get(scope);
  if (hit && hit.exp > Date.now() + 300_000) return hit.tok;
  const { AZURE_SP_CLIENT_ID, AZURE_SP_SECRET, AZURE_TENANT_ID } = process.env;
  if (!AZURE_SP_CLIENT_ID || !AZURE_SP_SECRET || !AZURE_TENANT_ID) throw new Error("set AZURE_SP_CLIENT_ID, AZURE_SP_SECRET, AZURE_TENANT_ID in .env.local");
  const r = await fetch(`https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`, { method: "POST",
    body: new URLSearchParams({ client_id: AZURE_SP_CLIENT_ID, client_secret: AZURE_SP_SECRET, grant_type: "client_credentials", scope }) });
  const j = await r.json();
  if (!j.access_token) throw new Error(`token for ${scope}: ${r.status} ${j.error || ""}`);
  tokens.set(scope, { tok: j.access_token, exp: Date.now() + (Number(j.expires_in) || 3000) * 1000 });
  return j.access_token;
}

export const sub = () => process.env.AZURE_SUBSCRIPTION_ID;
export const rgName = () => process.env.AZURE_RESOURCE_GROUP;
export const SUB_PATH = () => `/subscriptions/${sub()}`;
export const RG_PATH = () => `/subscriptions/${sub()}/resourceGroups/${rgName()}`;

/**
 * ARM call. `path` is absolute ("/subscriptions/...") or relative to the resource group ("/providers/...").
 * allow404 → null on 404. Returns the parsed body (or {} for an empty 2xx). Follows nothing: async operations are
 * polled by the caller through the resource's own provisioningState.
 */
export async function arm(method, path, body, { allow404 = false, raw = false } = {}) {
  const full = path.startsWith("/subscriptions/") ? path : RG_PATH() + path;
  const r = await fetch("https://management.azure.com" + full, { method,
    headers: { authorization: `Bearer ${await token()}`, "content-type": "application/json", ...(body ? {} : { "content-length": "0" }) },
    body: body ? JSON.stringify(body) : undefined });
  if (allow404 && r.status === 404) return null;
  const text = await r.text();
  let j = {};
  try { j = text ? JSON.parse(text) : {}; } catch { j = { text: text.slice(0, 200) }; }
  if (!r.ok) throw Object.assign(new Error(`${method} ${full.split("?")[0].replace(/^\/subscriptions\/[^/]+/, "")} ${r.status} ${JSON.stringify(j).slice(0, 400)}`), { status: r.status, body: j });
  return raw ? { status: r.status, headers: r.headers, body: j } : j;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Poll fn() every `everyMs` until it returns a truthy value or `maxMs` passes (then throws `what`). */
export async function until(fn, { everyMs = 5000, maxMs = 600_000, what = "condition" } = {}) {
  const t0 = Date.now();
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() - t0 > maxMs) throw new Error(`timed out waiting for ${what}`);
    await sleep(everyMs);
  }
}

/** Log Analytics query (KQL) against a workspace customer id → rows as objects. */
export async function laQuery(workspaceId, kql, timespan = "PT1H") {
  const r = await fetch(`https://api.loganalytics.io/v1/workspaces/${workspaceId}/query`, { method: "POST",
    headers: { authorization: `Bearer ${await token("https://api.loganalytics.io/.default")}`, "content-type": "application/json" },
    body: JSON.stringify({ query: kql, timespan }) });
  const j = await r.json();
  if (!r.ok) throw new Error(`log query ${r.status} ${JSON.stringify(j).slice(0, 300)}`);
  const t = j.tables?.[0];
  if (!t) return [];
  return t.rows.map((row) => Object.fromEntries(t.columns.map((c, i) => [c.name, row[i]])));
}

/**
 * ACR: build an image in the registry (no local Docker). Source = the GitHub branch (`git` = { repo, branch }), or a
 * local directory uploaded as a tarball (`dir`), which is how an unpushed tree (a probe image, a test worker) is built.
 * Returns when the run finishes; throws with the log tail on failure.
 */
export async function acrBuild({ registry = "taxilacr", images, dockerfile, git, dir, files: only, timeoutSec = 1800, log = console.log }) {
  let sourceLocation;
  if (git) sourceLocation = `https://github.com/${git.repo}.git#${git.branch}`;
  else {
    const { execFileSync } = await import("child_process");
    const { tmpdir } = await import("os");
    const tgz = `${tmpdir()}/acr-src-${Date.now()}.tar.gz`;
    // the tree as git sees it (tracked + untracked-not-ignored), so node_modules, dist and .env.local never leave
    // `files`: an explicit context (a small image that must not see the repo's .dockerignore), else the whole tree
    const files = (only ?? execFileSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], { cwd: dir, maxBuffer: 64 << 20 }).toString().split("\0").filter(Boolean))
      .filter((f) => existsSync(dir + "/" + f));
    execFileSync("tar", ["-czf", tgz, "--null", "-T", "-"], { cwd: dir, input: files.join("\0"), maxBuffer: 64 << 20 });
    const up = await arm("POST", `/providers/Microsoft.ContainerRegistry/registries/${registry}/listBuildSourceUploadUrl?api-version=2019-06-01-preview`);
    const put = await fetch(up.uploadUrl, { method: "PUT", headers: { "x-ms-blob-type": "BlockBlob" }, body: readFileSync(tgz) });
    if (!put.ok) throw new Error(`source upload ${put.status}`);
    sourceLocation = up.relativePath;
    log(`  uploaded ${files.length} files (${Math.round(readFileSync(tgz).length / 1024)} KB)`);
  }
  const run = await arm("POST", `/providers/Microsoft.ContainerRegistry/registries/${registry}/scheduleRun?api-version=2019-06-01-preview`, {
    type: "DockerBuildRequest", imageNames: images, isPushEnabled: true, sourceLocation, dockerFilePath: dockerfile,
    platform: { os: "Linux", architecture: "amd64" }, timeout: timeoutSec });
  const runId = run.properties.runId;
  let st;
  do {
    await sleep(10_000);
    st = (await arm("GET", `/providers/Microsoft.ContainerRegistry/registries/${registry}/runs/${runId}?api-version=2019-06-01-preview`)).properties.status;
    log(`  acr ${runId}: ${st}`);
  } while (["Queued", "Started", "Running"].includes(st));
  if (st !== "Succeeded") {
    const { logLink } = await arm("POST", `/providers/Microsoft.ContainerRegistry/registries/${registry}/runs/${runId}/listLogSasUrl?api-version=2019-06-01-preview`);
    const tail = (await (await fetch(logLink)).text()).split("\n").slice(-40).join("\n");
    throw new Error(`ACR build ${runId} ${st}:\n${tail}`);
  }
  return runId;
}
