// ARM for the G2 runner: the ACA Job `forge-g2-runner` in its own environment `taxila-forge-untrusted`
// (FACTORY.md §2.9 Phase 0). The TRUSTED side (deploy script, conductor handler, run script) starts one execution per
// build with a template override carrying the build's inputs and a fresh 2-hour SAS for THAT build's own run container
// (g2run-<buildId>, created here): the account key never reaches a runner, and a runner cannot read or write the
// private queue/catalogue, another build's evidence, or the public origin. The starter also writes the TRUSTED build
// record (builds/open/<buildId>.json: topic, identity, execution) that ingest believes instead of anything the runner says.
// Service principal: RG Contributor on rg-raghavsharma1729-7190 only.
import { runContainer, runContainerSas, createRunContainer, putPrivate, deletePrivate, deleteRunContainer } from "./store.js";
import { briefFor } from "./brief.js";

export const JOB = { name: "forge-g2-runner", env: "taxila-forge-untrusted", location: "eastus2", container: "forge-g2", cpu: 2, memory: "4Gi" };
const API = "api-version=2024-03-01";

let cached = null;
export async function armToken() {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const { AZURE_SP_CLIENT_ID, AZURE_SP_SECRET, AZURE_TENANT_ID } = process.env;
  if (!AZURE_SP_CLIENT_ID || !AZURE_SP_SECRET || !AZURE_TENANT_ID) throw new Error("AZURE_SP_CLIENT_ID / AZURE_SP_SECRET / AZURE_TENANT_ID not set");
  const r = await fetch(`https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`, { method: "POST",
    body: new URLSearchParams({ client_id: AZURE_SP_CLIENT_ID, client_secret: AZURE_SP_SECRET, grant_type: "client_credentials", scope: "https://management.azure.com/.default" }) });
  const j = await r.json();
  if (!j.access_token) throw new Error(`token: ${j.error || r.status}`);
  cached = { token: j.access_token, exp: Date.now() + (j.expires_in || 3000) * 1000 };
  return cached.token;
}
const rgBase = () => `https://management.azure.com/subscriptions/${process.env.AZURE_SUBSCRIPTION_ID}/resourceGroups/${process.env.AZURE_RESOURCE_GROUP}`;

/** One ARM call scoped to the resource group. allow404 → null. */
export async function arm(method, path, body, { allow404 = false } = {}) {
  const tok = await armToken();
  let r;
  for (let attempt = 0; ; attempt++) {
    try { r = await fetch(rgBase() + path, { method, headers: { authorization: `Bearer ${tok}`, "content-type": "application/json", ...(body ? {} : { "content-length": "0" }) }, body: body ? JSON.stringify(body) : undefined }); }
    catch (e) { if (attempt >= 3) throw e; await new Promise((ok) => setTimeout(ok, 2000 * (attempt + 1))); continue; }   // network blip
    if ((r.status === 429 || r.status >= 500) && attempt < 3 && method === "GET") { await new Promise((ok) => setTimeout(ok, 2000 * (attempt + 1))); continue; }
    break;
  }
  if (allow404 && r.status === 404) return null;
  const text = await r.text();
  let j = {}; try { j = text ? JSON.parse(text) : {}; } catch { j = { raw: text.slice(0, 200) }; }
  if (!r.ok) { const e = new Error(`${method} ${path.split("?")[0]} ${r.status} ${JSON.stringify(j).slice(0, 300)}`); e.status = r.status; throw e; }
  return j;
}

/**
 * Start one build execution. The override replaces the container's env, so the job's own env list is copied and the
 * build inputs + SAS appended (secrets stay secretRefs).
 * @returns {Promise<{ execution: string, buildId: string }>}
 */
export async function startBuild({ topicId, buildId, archetype, budgetUsd }, deps = {}) {
  const { createRun = createRunContainer, dropRun = deleteRunContainer, put = putPrivate, drop = deletePrivate, armCall = arm } = deps;
  const b = briefFor(topicId, { archetype });
  if (!b.ok) throw new Error(`not a G2 topic: ${topicId} (${b.reason})`);
  await createRun(buildId);
  const runC = runContainer(buildId);
  const extra = { FORGE_G2_TOPIC: topicId, FORGE_G2_BUILD_ID: buildId, FORGE_G2_RUN_CONTAINER: runC, FORGE_G2_RUN_SAS: runContainerSas(buildId, { ttlMs: 2 * 3600_000 }),
    ...(archetype ? { FORGE_G2_ARCHETYPE: archetype } : {}), ...(budgetUsd ? { FORGE_G2_BUDGET_USD: String(budgetUsd) } : {}) };
  // the trusted record goes down BEFORE the start, so a starter that dies mid-way still leaves something ingest can close
  const record = (execution) => JSON.stringify({ v: 1, buildId, topicId, archetype: b.brief.archetype, identityKey: b.identityKey, execution,
    startedAt: new Date().toISOString(), status: "started" });
  await put(`builds/open/${buildId}.json`, record(null));
  let execution;
  try {
    const job = await armCall("GET", `/providers/Microsoft.App/jobs/${JOB.name}?${API}`);
    const c = job.properties.template.containers[0];
    // FORGE_G2_PRIVATE_SAS was the old whole-container grant: never forward it, even if a stale job definition has it
    const env = [...c.env.filter((e) => !(e.name in extra) && e.name !== "FORGE_G2_PRIVATE_SAS" && e.name !== "AZURE_STORAGE_KEY"), ...Object.entries(extra).map(([name, value]) => ({ name, value }))];
    const r = await armCall("POST", `/providers/Microsoft.App/jobs/${JOB.name}/start?${API}`, { containers: [{ name: c.name, image: c.image, env, resources: c.resources }] });
    execution = r.name || r.id?.split("/").pop();
  } catch (e) {
    await dropRun(buildId).catch(() => {});
    await drop(`builds/open/${buildId}.json`).catch(() => {});
    throw e;
  }
  await put(`builds/open/${buildId}.json`, record(execution));
  return { execution, buildId, identityKey: b.identityKey };
}

/** Status of one execution: Running | Succeeded | Failed | Stopped | Degraded | Unknown. */
export async function executionStatus(execution) {
  const r = await arm("GET", `/providers/Microsoft.App/jobs/${JOB.name}/executions/${execution}?${API}`, undefined, { allow404: true });
  return r ? { status: r.properties?.status, start: r.properties?.startTime, end: r.properties?.endTime } : { status: "Unknown" };
}
