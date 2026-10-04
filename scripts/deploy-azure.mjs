// Gated, canaried deploys of the web app to Azure Container Apps (BUILD-PLAN W1-D item 1; smooth audit G9).
//
//   node scripts/deploy-azure.mjs --gate             run the gates on HEAD (clean tree), stamp the sha, then deploy
//   node scripts/deploy-azure.mjs                    deploy HEAD; REFUSES unless HEAD has a passing gate stamp
//   node scripts/deploy-azure.mjs --dry-run [--gate] every check (pushed, gate stamp, app readable), then the plan; no write
//   node scripts/deploy-azure.mjs --rollback         move 100% of traffic back to the previous revision (timed)
//   flags: --app NAME (default taxila-web) · --image-tag TAG (deploy an image already in ACR; skips the build and the
//          pushed check, still needs a gate stamp for the sha in the tag unless --stamp-sha says which) · --keep N
//
// The deploy:
//   1) gate: a stamp for the exact sha (node_modules/.cache/taxila-gate/<sha>.json, written by --gate after
//      `npx tsc -b && npx vite build && npm test && node scripts/check-prompt-budget.mjs` passed on a CLEAN tree), or a
//      successful `gates` GitHub Actions run for that sha (.github/workflows/gates.yml);
//   2) ACR builds the image from the GitHub branch (push first: ACR builds what is on GitHub, not the working tree);
//   3) the app runs in MULTIPLE revision mode: the new revision is created at 0% traffic, labelled `canary`, and must be
//      Running + Healthy (readiness = /api/health?ready=1, one DB round trip);
//   4) the prod acceptance smoke (tests/prod/w0-smoke.mjs: signup → child → consent → lesson → end → account deleted)
//      runs against https://<app>---canary.<env domain>, the new revision's own URL, before any traffic moves;
//   5) traffic moves 100% to the new revision (label `current`); the old one keeps label `previous`, stays active, so
//      --rollback is one traffic PATCH; revisions older than that are deactivated.
// A failed smoke deactivates the new revision and leaves traffic where it was.
// Needs AZURE_SP_CLIENT_ID / AZURE_SP_SECRET / AZURE_TENANT_ID (+ .env.local). Run under NODE_USE_ENV_PROXY=1.
import { execSync, spawnSync } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import { ROOT, acrBuild, arm, loadEnv, until } from "../infra/azure.mjs";
import { REPO, gateEvidence, runGates } from "../infra/gate.mjs";

loadEnv();
const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
const DRY = flag("--dry-run"), GATE = flag("--gate"), ROLLBACK = flag("--rollback");
const APP = opt("--app", "taxila-web");
const LOCAL = flag("--local");                         // build the WORKING TREE (uploaded): --scratch apps only
const IMAGE_TAG = opt("--image-tag", null) || (LOCAL ? `local-${Date.now().toString(36)}` : null);
if (LOCAL && (APP === "taxila-web" || !flag("--scratch"))) throw new Error("--local builds an unpushed, ungated tree: only with --scratch on a non-production app");
const API = "api-version=2024-03-01";
const APP_PATH = `/providers/Microsoft.App/containerApps/${APP}`;
const LOG = ROOT + "node_modules/.cache/taxila-deploys.jsonl";
/**
 * Session affinity (smooth G10: prewarm, the comprehension PENDING map and the TTS limiters are per process, so
 * /turn and its tts-stream must land on one replica once the app scales past 1). ACA honours sticky sessions only in
 * SINGLE revision mode [V: Azure docs "Session affinity", and the ARM refusal measured on the scratch app,
 * context/inbox/w1-d.json]; this script needs Multiple mode for the 0% canary. So affinity is requested only when the
 * environment says it is allowed (STICKY=1) and is otherwise reported, not silently dropped.
 */
const STICKY = process.env.TAXILA_STICKY === "1";
const sh = (cmd) => execSync(cmd, { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] }).toString().trim();
const t0 = Date.now();
const elapsed = () => `${((Date.now() - t0) / 1000).toFixed(1)} s`;

// ───────────────────────────── gate (infra/gate.mjs) ─────────────────────────────
// runGates(sha) stamps node_modules/.cache/taxila-gate/<sha>.json; gateEvidence(sha) accepts that stamp (clean tree,
// pass) or a successful `gates` GitHub Actions run for the sha.

// ───────────────────────────── revisions and traffic ─────────────────────────────

const getApp = () => arm("GET", `${APP_PATH}?${API}`);
const getRev = (name) => arm("GET", `${APP_PATH}/revisions/${name}?${API}`, undefined, { allow404: true });
const listRevs = async () => (await arm("GET", `${APP_PATH}/revisions?${API}`)).value || [];
const revReady = (r) => r && /^(Running|RunningAtMaxScale)/.test(r.properties.runningState || "") && r.properties.healthState === "Healthy" && r.properties.provisioningState === "Provisioned";
const setTraffic = (app, traffic) => arm("PATCH", `${APP_PATH}?${API}`, { properties: { configuration: { ingress: { ...app.properties.configuration.ingress, traffic } } } });
const healthOf = (url) => fetch(`${url}/api/health`, { signal: AbortSignal.timeout(10_000) }).then((r) => r.json()).catch(() => null);
/** Poll the app's public URL until /api/health answers from `rev` `n` times in a row (traffic actually moved). */
async function servedBy(url, rev, { n = 3, maxMs = 180_000 } = {}) {
  let streak = 0;
  return until(async () => { const h = await healthOf(url); streak = h?.revision === rev ? streak + 1 : 0; return streak >= n; }, { everyMs: 2000, maxMs, what: `${url} served by ${rev}` });
}
function record(entry) { try { mkdirSync(ROOT + "node_modules/.cache", { recursive: true }); writeFileSync(LOG, JSON.stringify({ at: new Date().toISOString(), app: APP, ...entry }) + "\n", { flag: "a" }); } catch { /* best effort */ } }

/** The revision currently taking traffic, and the one to roll back to. */
function trafficRoles(app, revs) {
  const tr = app.properties.configuration.ingress.traffic || [];
  const byWeight = [...tr].filter((t) => t.revisionName).sort((a, b) => b.weight - a.weight);
  const current = byWeight[0]?.revisionName || app.properties.latestReadyRevisionName;
  const labelled = tr.find((t) => t.label === "previous" && t.revisionName !== current)?.revisionName;
  const fallback = revs.filter((r) => r.name !== current && r.properties.healthState !== "Unhealthy")
    .sort((a, b) => Date.parse(b.properties.createdTime) - Date.parse(a.properties.createdTime))[0]?.name;
  return { current, previous: labelled || fallback || null };
}

async function rollback() {
  const app = await getApp();
  if (app.properties.configuration.activeRevisionsMode !== "Multiple") throw new Error(`${APP} is in ${app.properties.configuration.activeRevisionsMode} revision mode; --rollback needs a deploy by this script first`);
  const revs = await listRevs();
  const { current, previous } = trafficRoles(app, revs);
  if (!previous) throw new Error("no previous revision to roll back to");
  console.log(`rollback ${APP}: ${current} → ${previous}`);
  if (DRY) return console.log("dry run: no change");
  let prev = await getRev(previous);
  if (!prev.properties.active) {
    console.log(`  activating ${previous}…`);
    await arm("POST", `${APP_PATH}/revisions/${previous}/activate?${API}`);
  }
  prev = await until(async () => { const r = await getRev(previous); return revReady(r) && r; }, { everyMs: 3000, maxMs: 240_000, what: `${previous} ready` });
  await setTraffic(app, [{ revisionName: previous, weight: 100, label: "current" }, { revisionName: current, weight: 0, label: "previous" }]);
  await servedBy(`https://${app.properties.configuration.ingress.fqdn}`, previous);
  console.log(`rolled back: ${previous} serves 100% (${elapsed()} from the command)`);
  record({ action: "rollback", from: current, to: previous, seconds: (Date.now() - t0) / 1000 });
}

// ───────────────────────────── deploy ─────────────────────────────

async function deploy() {
  const branch = sh("git rev-parse --abbrev-ref HEAD");
  const full = opt("--stamp-sha", null) || sh("git rev-parse HEAD");
  const sha = IMAGE_TAG || full.slice(0, 7);
  if (!IMAGE_TAG) {
    const remote = sh(`git ls-remote origin refs/heads/${branch}`).slice(0, 40);
    if (remote !== full) {
      const msg = `HEAD ${full.slice(0, 7)} is not pushed (origin/${branch} has ${remote.slice(0, 7) || "nothing"}): push first, ACR builds GitHub`;
      if (!DRY) throw new Error(msg);
      console.log(`WARN ${msg}`);
    }
  }
  // --allow-dirty: gate the working tree as it is; a failure still blocks, a pass is never accepted as evidence
  if (GATE) runGates(full, { allowDirty: flag("--allow-dirty") });
  // --scratch: a throwaway app (infra/scratch-web.mjs) exercising this script's canary/traffic/rollback; never taxila-web
  const scratch = flag("--scratch") && APP !== "taxila-web";
  const evidence = scratch ? "SCRATCH APP: gate not required (not production)" : await gateEvidence(full);
  if (!evidence) throw new Error(`no passing gate for ${full.slice(0, 7)}: run \`node scripts/deploy-azure.mjs --gate\` (or wait for the gates workflow). Refusing to deploy.`);
  console.log(`gate: ${evidence}`);

  const app = await getApp();
  const cfg = app.properties.configuration;
  const domain = cfg.ingress.fqdn.split(".").slice(1).join(".");
  // The revision SERVING now: after a --rollback that is not the latest-ready one (found on the scratch app, 2026-10-04:
  // taking latestReady here pinned 100% back onto the rolled-back revision for the canary phase).
  const prev = cfg.activeRevisionsMode === "Multiple" ? trafficRoles(app, await listRevs()).current : app.properties.latestReadyRevisionName;
  const tpl = JSON.parse(JSON.stringify(app.properties.template));
  tpl.revisionSuffix = `s${sha}-${Date.now().toString(36).slice(-4)}`;   // unique per revision
  const newRev = `${APP}--${tpl.revisionSuffix}`;
  const c0 = tpl.containers[0];
  c0.image = `taxilacr.azurecr.io/taxila-web:${sha}`;
  // host-level env the image expects on Azure (idempotent)
  for (const [name, value] of Object.entries({ DB_DRIVER: "pg", NODE_ENV: "production", TAXILA_HOST: "azure", DEPLOY_CLASSIFY: "grok-4-1-fast-non-reasoning",
    TAXILA_CLASSIFY_HEDGE_MS: "1500", GIT_SHA: sha, ACCESS_LOG: "on" })) {
    const e = c0.env.find((x) => x.name === name); if (e) { e.value = value; delete e.secretRef; } else c0.env.push({ name, value });
  }
  // 1 vCPU / 2 GiB (smooth G10: signup's scrypt is CPU-bound at 0.5 vCPU, 1.44 s p50 at 10 concurrent)
  c0.resources = { ...c0.resources, cpu: 1, memory: "2Gi" };
  // Liveness stays shallow (a Neon blip must not restart-loop the replica); readiness adds one DB round trip.
  c0.probes = [
    { type: "Liveness", httpGet: { path: "/api/health", port: 8080 }, periodSeconds: 30, timeoutSeconds: 5, failureThreshold: 3 },
    { type: "Readiness", httpGet: { path: "/api/health?ready=1", port: 8080 }, periodSeconds: 10, timeoutSeconds: 5, failureThreshold: 3 },
  ];
  // Secrets from .env.local that the image reads, stored as Container App secrets (never plain env). A PATCH that
  // touches configuration.secrets must restate every secret's value, so the current ones are listed first.
  const SECRET_ENV = { FORGE_G2_CHILD_SALT: "forge-g2-child-salt" };
  const missing = Object.entries(SECRET_ENV).filter(([envName, ref]) => process.env[envName] && !(c0.env.find((x) => x.name === envName)?.secretRef === ref));
  const configuration = { activeRevisionsMode: "Multiple", maxInactiveRevisions: 20,
    ingress: { ...cfg.ingress, traffic: [{ revisionName: prev, weight: 100, label: "current" }], ...(STICKY ? { stickySessions: { affinity: "sticky" } } : {}) } };
  if (missing.length) {
    const cur = (await arm("POST", `${APP_PATH}/listSecrets?${API}`)).value || [];
    const secrets = cur.map(({ name, value }) => ({ name, value }));
    for (const [envName, ref] of missing) {
      if (!secrets.some((x) => x.name === ref)) secrets.push({ name: ref, value: process.env[envName] });
      const e = c0.env.find((x) => x.name === envName); if (e) { delete e.value; e.secretRef = ref; } else c0.env.push({ name: envName, secretRef: ref });
    }
    configuration.secrets = secrets;
  }

  console.log(`plan: ${APP} ${cfg.activeRevisionsMode} → Multiple; new revision ${newRev} (image ${c0.image}, 1 vCPU/2Gi, readiness ?ready=1) at 0% as \`canary\`;`);
  console.log(`      smoke https://${APP}---canary.${domain}; then 100% → ${newRev}, ${prev} kept as \`previous\`${STICKY ? "; sticky sessions" : ""}`);
  if (DRY) { console.log(`dry run: all checks passed, nothing changed (${elapsed()})`); return; }

  if (LOCAL) {
    const { execFileSync } = await import("child_process");
    const files = execFileSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], { cwd: ROOT, maxBuffer: 64 << 20 }).toString().split("\0")
      .filter((f) => f && !/^(docs|art|context|evals)\//.test(f) && !f.startsWith("scripts/character/"));
    console.log(`building taxila-web:${sha} from the working tree (${files.length} files)…`);
    await acrBuild({ images: [`taxila-web:${sha}`], dockerfile: "Dockerfile", dir: ROOT, files });
  } else if (!IMAGE_TAG) {
    console.log(`building taxila-web:${sha} from ${branch}…`);
    await acrBuild({ images: [`taxila-web:${sha}`, "taxila-web:latest"], dockerfile: "Dockerfile", git: { repo: REPO, branch } });
  }
  await arm("PATCH", `${APP_PATH}?${API}`, { properties: { configuration, template: tpl } });
  console.log(`  revision ${newRev} requested (${elapsed()}); waiting for Running + Healthy…`);
  await until(async () => {
    const a = await getApp();
    if (a.properties.provisioningState === "Failed") throw new Error(`provisioning failed; ${prev} keeps serving`);
    const r = await getRev(newRev);
    if (r?.properties.provisioningState === "Failed" || r?.properties.healthState === "Unhealthy") throw new Error(`${newRev} is ${r.properties.provisioningState}/${r.properties.healthState}; ${prev} keeps serving`);
    return revReady(r);
  }, { everyMs: 6000, maxMs: 600_000, what: `${newRev} healthy` });

  const fresh = await getApp();
  await setTraffic(fresh, [{ revisionName: prev, weight: 100, label: "current" }, { revisionName: newRev, weight: 0, label: "canary" }]);
  const canary = `https://${APP}---canary.${domain}`;
  await until(async () => (await healthOf(canary))?.revision === newRev, { everyMs: 3000, maxMs: 180_000, what: `${canary} answering from ${newRev}` });
  console.log(`  canary ${canary} answers from ${newRev}; running the smoke (tests/prod/w0-smoke.mjs)…`);
  const smoke = spawnSync(process.execPath, [ROOT + "tests/prod/w0-smoke.mjs"], { stdio: "inherit", timeout: 300_000, env: { ...process.env, TAXILA_BASE: canary } });
  if (smoke.status !== 0) {
    console.error(`SMOKE FAILED on ${newRev} (exit ${smoke.status ?? smoke.signal}); deactivating it, ${prev} keeps 100%`);
    await setTraffic(await getApp(), [{ revisionName: prev, weight: 100, label: "current" }]);
    await arm("POST", `${APP_PATH}/revisions/${newRev}/deactivate?${API}`).catch((e) => console.error(`  deactivate: ${e.message}`));
    record({ action: "deploy", sha, rev: newRev, result: "smoke_failed" });
    process.exit(1);
  }
  await setTraffic(await getApp(), [{ revisionName: newRev, weight: 100, label: "current" }, { revisionName: prev, weight: 0, label: "previous" }]);
  await servedBy(`https://${cfg.ingress.fqdn}`, newRev);
  // keep exactly two active revisions (current + previous): older ones cost a replica each and are never routed to
  const keep = new Set([newRev, prev]);
  for (const r of await listRevs()) {
    if (r.properties.active && !keep.has(r.name)) await arm("POST", `${APP_PATH}/revisions/${r.name}/deactivate?${API}`).then(() => console.log(`  deactivated ${r.name}`), (e) => console.warn(`  deactivate ${r.name}: ${e.message}`));
  }
  console.log(`live: https://${cfg.ingress.fqdn} serves ${newRev} (image ${sha}); rollback: node scripts/deploy-azure.mjs --rollback (${elapsed()})`);
  record({ action: "deploy", sha, rev: newRev, prev, result: "live", seconds: (Date.now() - t0) / 1000 });
}

try {
  if (ROLLBACK) await rollback();
  else await deploy();
} catch (e) {
  console.error(`deploy-azure: ${e.message}`);
  process.exit(1);
}
