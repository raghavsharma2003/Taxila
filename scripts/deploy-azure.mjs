// Gated, canaried deploys of the web app to Azure Container Apps (BUILD-PLAN W1-D item 1; smooth audit G9).
//
//   node scripts/deploy-azure.mjs --gate             run the gates on HEAD (clean tree), stamp the sha, then deploy
//   node scripts/deploy-azure.mjs                    deploy HEAD; REFUSES unless HEAD has a passing gate stamp
//   node scripts/deploy-azure.mjs --dry-run [--gate] every check (pushed, gate stamp, app readable), then the plan; no write
//   node scripts/deploy-azure.mjs --rollback         move 100% of traffic back to the previous revision (timed)
//   flags: --app NAME (default taxila-web) · --image-tag TAG (deploy an image already in ACR; skips the build and the
//          pushed check). TAG must be a commit sha prefix (the tags this script builds are); the gate is checked for
//          EXACTLY that commit, never for HEAD, and --stamp-sha, if given, must name the same commit. Any other tag is
//          refused: an image whose commit cannot be named has no gate to check.
//   placement flags (docs/ops/INDIA-MOVE.md; defaults = today's eastus2 deploy, unchanged):
//          --rg NAME (default $AZURE_RESOURCE_GROUP) · --region LOC (asserted against the app's location; also sets
//          TAXILA_REGION on the revision) · --env NAME (asserted against the app's managed environment) · --registry NAME
//          (default taxilacr; must live in $AZURE_RESOURCE_GROUP, where acrBuild schedules) · --create (the app does not
//          exist yet: create it in --env/--region from --create-from APP (default taxila-web, READ only), never taxila-web)
//   env/secrets for the new endpoints (server/endpoints.js lanes):
//          --set NAME=VALUE        plain env on the revision (repeatable; an empty VALUE removes NAME)
//          --secret NAME=LOCALVAR  NAME reads a Container App secret holding .env.local's LOCALVAR (repeatable)
//          --profile india         the India stack preset (below) · --db azure|keep (default keep) · --realtime-account
//                                  eastus2|southindia (default eastus2 until the realtime quota raise lands)
//          --migrations-evidence FILE  for a PRIVATE target database (Azure PG in a VNet; the sandbox cannot reach it):
//                                  the report `node scripts/region/db-copy.mjs --check-migrations` wrote from inside the VNet
//   --profile india sets: AZURE_OPENAI_ENDPOINT=$AZURE_OPENAI_ENDPOINT_SIN with key secret `azure-openai-key-sin`
//   ($AZURE_OPENAI_API_KEY_SIN); TTS and IMAGE lanes pinned to today's account ($AZURE_OPENAI_ENDPOINT, secret
//   `azure-openai-key`), REALTIME too unless --realtime-account southindia; Speech AZURE_SPEECH_REGION/_KEY from the
//   _SIN vars (centralindia); with --db azure, DATABASE_URL from secret `database-url-sin` ($AZURE_PG_SIN_URL). The India
//   values live in NEW secret names, so the previous revision (eastus2, Neon) keeps its own secrets and --rollback is
//   still one traffic PATCH. Before any write it checks that every DEPLOY_* deployment exists on the account its lane
//   resolves to.
//
// The deploy:
//   1) gate: a stamp for the exact sha (node_modules/.cache/taxila-gate/<sha>.json, written by --gate after
//      `npx tsc -b && npx vite build && npm test && node scripts/check-prompt-budget.mjs` passed on a CLEAN tree), or a
//      successful `gates` GitHub Actions run for that sha (.github/workflows/gates.yml);
//   1b) migrations: every db/migrations/*.sql of that sha is in the TARGET database's schema_migrations (taxila-web's
//      own DATABASE_URL secret), whichever evidence was used; a CI run cannot check this (no production url there);
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
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { ROOT, acrBuild, arm, loadEnv, until, SUB_PATH } from "../infra/azure.mjs";
import { REPO, gateEvidence, migrationsGate, runGates, shaOfTag } from "../infra/gate.mjs";

loadEnv();
const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
const DRY = flag("--dry-run"), GATE = flag("--gate"), ROLLBACK = flag("--rollback");
const APP = opt("--app", "taxila-web");
const optAll = (f) => argv.flatMap((a, i) => (a === f && argv[i + 1] ? [argv[i + 1]] : []));
const RG = opt("--rg", process.env.AZURE_RESOURCE_GROUP);
const REGION = opt("--region", null);
const ENV_NAME = opt("--env", null);
const REGISTRY = opt("--registry", "taxilacr");
const CREATE = flag("--create");
const PROFILE = opt("--profile", null);
const DB_MODE = opt("--db", "keep");
const RT_ACCOUNT = opt("--realtime-account", "eastus2");
const MIG_EVIDENCE = opt("--migrations-evidence", null);
if (!RG) throw new Error("no resource group: set AZURE_RESOURCE_GROUP or pass --rg");
if (PROFILE && PROFILE !== "india") throw new Error(`--profile ${PROFILE}: only india is defined`);
if (!["keep", "azure"].includes(DB_MODE)) throw new Error(`--db ${DB_MODE}: expected keep or azure`);
if (!["eastus2", "southindia"].includes(RT_ACCOUNT)) throw new Error(`--realtime-account ${RT_ACCOUNT}: expected eastus2 or southindia`);
if (CREATE && APP === "taxila-web") throw new Error("--create never targets taxila-web");
const LOCAL = flag("--local");                         // build the WORKING TREE (uploaded): --scratch apps only
const IMAGE_TAG = opt("--image-tag", null) || (LOCAL ? `local-${Date.now().toString(36)}` : null);
if (LOCAL && (APP === "taxila-web" || !flag("--scratch"))) throw new Error("--local builds an unpushed, ungated tree: only with --scratch on a non-production app");
const API = "api-version=2024-03-01";
const APP_PATH = `${SUB_PATH()}/resourceGroups/${RG}/providers/Microsoft.App/containerApps/${APP}`;
const LOG = ROOT + "node_modules/.cache/taxila-deploys.jsonl";
/**
 * Session affinity (smooth G10: prewarm, the comprehension PENDING map and the TTS limiters are per process, so
 * /turn and its tts-stream must land on one replica once the app scales past 1). ACA honours sticky sessions only in
 * SINGLE revision mode [V: Azure docs "Session affinity", and the ARM refusal measured on the scratch app,
 * context/inbox/w1-d.json]; this script needs Multiple mode for the 0% canary. So affinity is requested only when the
 * environment says it is allowed (STICKY=1) and is otherwise reported, not silently dropped.
 *
 * Without affinity the only correct setting is ONE replica (decision w1d-web-single-replica, context/inbox/w1-d.json):
 * the revision is pinned to min 1 / max 1 until that per-process state is shared (W2-A's half of G10) or affinity
 * works with the canary. TAXILA_MAX_REPLICAS overrides it, deliberately, once that is true.
 */
const STICKY = process.env.TAXILA_STICKY === "1";
const MAX_REPLICAS = Math.max(1, Math.floor(Number(process.env.TAXILA_MAX_REPLICAS || 1)));
const sh = (cmd) => execSync(cmd, { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] }).toString().trim();
const t0 = Date.now();
const elapsed = () => `${((Date.now() - t0) / 1000).toFixed(1)} s`;

// ───────────────────────────── gate (infra/gate.mjs) ─────────────────────────────
// runGates(sha) stamps node_modules/.cache/taxila-gate/<sha>.json; gateEvidence(sha) accepts that stamp (clean tree,
// pass) or a successful `gates` GitHub Actions run for the sha.

// ───────────────────────────── revisions and traffic ─────────────────────────────

const getApp = () => arm("GET", `${APP_PATH}?${API}`);
const findApp = () => arm("GET", `${APP_PATH}?${API}`, undefined, { allow404: true });
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

// ───────────────────────────── placement: env, secrets, lanes (India move) ─────────────────────────────

const slug = (name) => name.toLowerCase().replace(/_/g, "-");
const need = (v) => { if (!process.env[v]) throw new Error(`${v} is not set in .env.local`); return process.env[v]; };
/**
 * The env this deploy asks for beyond the image's host-level defaults: { plain: {NAME: value|null}, secrets: {NAME:
 * {ref, value}} }. null removes a plain var. Empty (no flag) → today's deploy, byte for byte.
 */
function placementEnv() {
  const plain = {}, secrets = {};
  if (PROFILE === "india") {
    const primary = need("AZURE_OPENAI_ENDPOINT_SIN"), eus = need("AZURE_OPENAI_ENDPOINT");
    need("AZURE_OPENAI_API_KEY_SIN"); need("AZURE_OPENAI_API_KEY");
    plain.AZURE_OPENAI_ENDPOINT = primary;
    secrets.AZURE_OPENAI_API_KEY = { ref: "azure-openai-key-sin", value: process.env.AZURE_OPENAI_API_KEY_SIN };
    // models southindia does not sell (INDIA-MOVE §2.2) stay on today's account; its key keeps today's secret name
    const pinned = ["TTS", "IMAGE", ...(RT_ACCOUNT === "eastus2" ? ["REALTIME"] : [])];
    for (const L of ["CHAT", "REALTIME", "TRANSCRIBE", "TTS", "IMAGE", "RESPONSES", "SAFETY"]) {
      if (pinned.includes(L)) {
        plain[`AZURE_OPENAI_ENDPOINT_${L}`] = eus;
        secrets[`AZURE_OPENAI_API_KEY_${L}`] = { ref: "azure-openai-key", value: process.env.AZURE_OPENAI_API_KEY };
      } else { plain[`AZURE_OPENAI_ENDPOINT_${L}`] = null; plain[`AZURE_OPENAI_API_KEY_${L}`] = null; }
    }
    if (process.env.AZURE_SPEECH_REGION_SIN && process.env.AZURE_SPEECH_KEY_SIN) {
      plain.AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION_SIN;
      secrets.AZURE_SPEECH_KEY = { ref: "azure-speech-key-sin", value: process.env.AZURE_SPEECH_KEY_SIN };
    }
    plain.TAXILA_REGION = REGION || "southindia";
  }
  if (DB_MODE === "azure") secrets.DATABASE_URL = { ref: "database-url-sin", value: need("AZURE_PG_SIN_URL") };
  if (REGION && !plain.TAXILA_REGION) plain.TAXILA_REGION = REGION;
  for (const kv of optAll("--set")) {
    const m = /^([A-Z0-9_]+)=(.*)$/s.exec(kv); if (!m) throw new Error(`--set ${kv}: expected NAME=VALUE`);
    plain[m[1]] = m[2] === "" ? null : m[2]; delete secrets[m[1]];
  }
  for (const kv of optAll("--secret")) {
    const m = /^([A-Z0-9_]+)=([A-Z0-9_]+)$/.exec(kv); if (!m) throw new Error(`--secret ${kv}: expected NAME=LOCALVAR`);
    secrets[m[1]] = { ref: slug(m[1]), value: need(m[2]) }; delete plain[m[1]];
  }
  return { plain, secrets };
}

/** Apply placementEnv to a container's env list (in place). Secret VALUES go to configuration.secrets, never env. */
function applyPlacement(c0, { plain, secrets }) {
  for (const [name, value] of Object.entries(plain)) {
    const i = c0.env.findIndex((x) => x.name === name);
    if (value === null) { if (i >= 0) c0.env.splice(i, 1); continue; }
    if (i >= 0) { c0.env[i] = { name, value }; } else c0.env.push({ name, value });
  }
  for (const [name, { ref }] of Object.entries(secrets)) {
    const i = c0.env.findIndex((x) => x.name === name);
    if (i >= 0) c0.env[i] = { name, secretRef: ref }; else c0.env.push({ name, secretRef: ref });
  }
}

/** Env as the revision will see it: plain values, and secret values from `secretValues` (ref → value). */
const effectiveEnv = (c0, secretValues) => Object.fromEntries(c0.env.map((e) => [e.name, e.secretRef ? secretValues.get(e.secretRef) : e.value]));

/**
 * Refuse a placement whose DEPLOY_* names do not exist on the account their lane resolves to (a southindia primary
 * with a deployment that has no SI twin would fail only when a child reaches that lane). Reads ARM only.
 */
async function checkLaneDeployments(env) {
  const { resolveLane } = await import("../server/endpoints.js");
  const laneOf = (v) => (/^DEPLOY_TTS$/.test(v) ? ["TTS"] : /^DEPLOY_(IMAGE|SORA)/.test(v) ? ["IMAGE"] : /^DEPLOY_REALTIME/.test(v) ? ["REALTIME"]
    : /^(DEPLOY_TRANSCRIBE|TAXILA_STT_MODEL)$/.test(v) ? ["TRANSCRIBE", "REALTIME"] : /^DEPLOY_CODEX$/.test(v) ? ["RESPONSES"] : ["CHAT"]);
  // the code defaults (server/azure.js DEPLOY, comprehension/grade/closed.js, forge/g2/harness.js) count too: a name the
  // image falls back to must exist as much as one set in env. Keep in step with those files.
  const names = { DEPLOY_REALTIME: "taxila-realtime", DEPLOY_BRAIN: "taxila-brain", DEPLOY_FAST: "taxila-fast", DEPLOY_TRANSCRIBE: "taxila-transcribe",
    DEPLOY_TTS: "gpt-4o-mini-tts", DEPLOY_GRADE: "DeepSeek-V4-Pro", DEPLOY_CODEX: "taxila-codex", DEPLOY_IMAGE: "taxila-image25-flare" };
  for (const [k, v] of Object.entries(env)) if (/^DEPLOY_|^TAXILA_STT_MODEL$/.test(k) && v) names[k] = v;
  const accounts = [];
  for (let page = `${SUB_PATH()}/providers/Microsoft.CognitiveServices/accounts?api-version=2024-10-01`; page;) {
    const r = await arm("GET", page); accounts.push(...(r.value || []));
    page = r.nextLink ? r.nextLink.replace(/^https:\/\/management\.azure\.com/, "") : null;
  }
  const deps = new Map();
  const depsOf = async (host) => {
    if (deps.has(host)) return deps.get(host);
    const acct = accounts.find((a) => host.split(".")[0] === String(a.properties?.customSubDomainName || "").toLowerCase());
    let set = null;
    if (acct) {
      set = new Set();
      for (let page = `${acct.id}/deployments?api-version=2024-10-01`; page;) {
        const r = await arm("GET", page); for (const d of r.value || []) set.add(d.name);
        page = r.nextLink ? r.nextLink.replace(/^https:\/\/management\.azure\.com/, "") : null;
      }
    }
    deps.set(host, set); return set;
  };
  const missing = [];
  for (const [k, name] of Object.entries(names)) for (const L of laneOf(k)) {
    const host = new URL(resolveLane(L, env).endpoint).host.toLowerCase();
    const set = await depsOf(host);
    if (!set) missing.push(`${k}=${name} (lane ${L}: no account for ${host} in this subscription)`);
    else if (!set.has(name)) missing.push(`${k}=${name} (lane ${L}: not deployed on ${host.split(".")[0]})`);
  }
  if (missing.length) throw new Error(`lane check: ${missing.join("; ")}. Refusing to deploy.`);
  return Object.keys(names).length;
}

/**
 * Migrations gate for a target database. A public url (Neon) is checked directly, as before; a private Azure PG url
 * (reachable only inside its VNet) needs --migrations-evidence: the JSON `scripts/region/db-copy.mjs --check-migrations`
 * wrote from an ACA job in that VNet, for the same host, at most 6 h old, listing every db/migrations file of `sha`.
 */
async function migrationsGateFor(dbUrl, sha) {
  const host = (() => { try { return new URL(dbUrl).hostname; } catch { return ""; } })();
  if (!/\.postgres\.database\.azure\.com$/.test(host)) return migrationsGate(dbUrl, sha);
  if (!MIG_EVIDENCE) throw new Error(`migrations gate: ${host} is private (VNet only); run \`node scripts/region/db-copy.mjs --check-migrations --sha ${sha.slice(0, 7)}\` and pass --migrations-evidence <its report>`);
  if (!existsSync(MIG_EVIDENCE)) throw new Error(`migrations gate: ${MIG_EVIDENCE} not found`);
  const ev = JSON.parse(readFileSync(MIG_EVIDENCE, "utf8"));
  if (ev.targetHost !== host) throw new Error(`migrations gate: evidence is for ${ev.targetHost}, the target is ${host}`);
  if (!(Date.now() - Date.parse(ev.at) < 6 * 3600_000)) throw new Error(`migrations gate: evidence from ${ev.at} is older than 6 h`);
  const files = sh(`git ls-tree --name-only ${sha} db/migrations/`).split("\n").map((f) => f.split("/").pop()).filter((f) => f.endsWith(".sql"));
  const have = new Set(ev.targetMigrations || []);
  const missing = files.filter((f) => !have.has(f));
  if (missing.length) throw new Error(`migrations gate: ${host} lacks ${missing.join(", ")} (evidence ${ev.at}). Refusing to deploy ${sha.slice(0, 7)}.`);
  return [];
}

/**
 * --create: a new app in --env (rehearsal app, e.g. taxila-web-si). Copies the source app's container env, secrets,
 * registries and ingress (READ only; nothing on the source changes), then this deploy's placement on top. Starts at
 * one replica; the normal canary flow below then puts a second revision through the smoke before any traffic moves.
 */
async function createApp(image, placement) {
  if (!ENV_NAME) throw new Error("--create needs --env NAME (the managed environment to create the app in)");
  const envPath = `${SUB_PATH()}/resourceGroups/${RG}/providers/Microsoft.App/managedEnvironments/${ENV_NAME}`;
  const env = await arm("GET", `${envPath}?${API}`);
  if (REGION && env.location.replace(/\s/g, "").toLowerCase() !== REGION) throw new Error(`env ${ENV_NAME} is in ${env.location}, not ${REGION}`);
  const srcName = opt("--create-from", "taxila-web");
  const srcPath = `/providers/Microsoft.App/containerApps/${srcName}`;   // in $AZURE_RESOURCE_GROUP
  const src = await arm("GET", `${srcPath}?${API}`);
  const srcSecrets = (await arm("POST", `${srcPath}/listSecrets?${API}`)).value || [];
  const secrets = new Map(srcSecrets.map(({ name, value }) => [name, value]));
  for (const { ref, value } of Object.values(placement.secrets)) secrets.set(ref, value);
  const c0 = JSON.parse(JSON.stringify(src.properties.template.containers[0]));
  delete c0.probes;
  c0.image = image;
  c0.resources = { cpu: 1, memory: "2Gi" };
  applyPlacement(c0, placement);
  const sc = src.properties.configuration;
  const body = { location: env.location, properties: { environmentId: env.id, configuration: {
    activeRevisionsMode: "Multiple", maxInactiveRevisions: 20, secrets: [...secrets].map(([name, value]) => ({ name, value })),
    registries: sc.registries, ingress: { external: true, targetPort: sc.ingress.targetPort, transport: sc.ingress.transport, allowInsecure: false } },
    template: { containers: [c0], scale: { minReplicas: 1, maxReplicas: 1 } } } };
  await arm("PUT", `${APP_PATH}?${API}`, body);
  return until(async () => { const a = await findApp(); if (a?.properties.provisioningState === "Failed") throw new Error(`${APP} create failed`); return a?.properties.provisioningState === "Succeeded" && a; },
    { everyMs: 6000, maxMs: 600_000, what: `${APP} created` });
}

// ───────────────────────────── deploy ─────────────────────────────

async function deploy() {
  const branch = sh("git rev-parse --abbrev-ref HEAD");
  // The commit being deployed: the one the image tag names (an --image-tag deploy), else --stamp-sha, else HEAD.
  const stampSha = opt("--stamp-sha", null);
  let full;
  if (IMAGE_TAG && !LOCAL) {
    full = shaOfTag(IMAGE_TAG);
    if (!full) throw new Error(`--image-tag ${IMAGE_TAG} does not name a commit (a sha prefix): its gate cannot be checked. Refusing to deploy.`);
    if (stampSha && !full.startsWith(stampSha) && !stampSha.startsWith(full)) throw new Error(`--stamp-sha ${stampSha} is not the commit image ${IMAGE_TAG} was built from (${full.slice(0, 7)})`);
  } else full = stampSha || sh("git rev-parse HEAD");
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

  const placement = placementEnv();
  const placed = Object.keys(placement.plain).length + Object.keys(placement.secrets).length > 0;
  const image = `${REGISTRY}.azurecr.io/taxila-web:${sha}`;
  let built = false;
  const buildImage = async () => {
    if (LOCAL) {
      const { execFileSync } = await import("child_process");
      const files = execFileSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], { cwd: ROOT, maxBuffer: 64 << 20 }).toString().split("\0")
        .filter((f) => f && !/^(docs|art|context|evals)\//.test(f) && !f.startsWith("scripts/character/"));
      console.log(`building taxila-web:${sha} from the working tree (${files.length} files)…`);
      await acrBuild({ registry: REGISTRY, images: [`taxila-web:${sha}`], dockerfile: "Dockerfile", dir: ROOT, files });
    } else if (!IMAGE_TAG) {
      console.log(`building taxila-web:${sha} from ${branch}…`);
      await acrBuild({ registry: REGISTRY, images: [`taxila-web:${sha}`, "taxila-web:latest"], dockerfile: "Dockerfile", git: { repo: REPO, branch } });
    }
    built = true;
  };
  /** Lane check over the env a revision would get (secret-backed values count as present). */
  const laneCheck = async (c0) => {
    const n = await checkLaneDeployments(effectiveEnv(c0, { get: () => "<secret>" }));
    console.log(`lanes: all ${n} deployment names exist on the account their lane resolves to`);
  };

  let app = await findApp();
  if (!app) {
    if (!CREATE) throw new Error(`${APP} not found in ${RG}: pass --create --env NAME to create it`);
    const src = await arm("GET", `/providers/Microsoft.App/containerApps/${opt("--create-from", "taxila-web")}?${API}`);
    const c0 = JSON.parse(JSON.stringify(src.properties.template.containers[0])); applyPlacement(c0, placement);
    await laneCheck(c0);
    console.log(`plan: create ${APP} in ${RG}/${ENV_NAME} from ${opt("--create-from", "taxila-web")}'s env and secrets (read only) + placement [${[...Object.keys(placement.plain), ...Object.keys(placement.secrets)].join(", ")}], image ${image}`);
    if (DRY) { console.log(`dry run: nothing created (${elapsed()})`); return; }
    await buildImage();
    app = await createApp(image, placement);
    console.log(`  created ${APP} (${elapsed()}): https://${app.properties.configuration.ingress.fqdn}`);
    record({ action: "create", sha, rg: RG, env: ENV_NAME });
  }
  if (REGION && app.location.replace(/\s/g, "").toLowerCase() !== REGION.toLowerCase()) throw new Error(`${APP} is in ${app.location}, not --region ${REGION}`);
  if (ENV_NAME && !String(app.properties.managedEnvironmentId).toLowerCase().endsWith(`/managedenvironments/${ENV_NAME.toLowerCase()}`)) throw new Error(`${APP} runs in ${app.properties.managedEnvironmentId.split("/").pop()}, not --env ${ENV_NAME}`);
  const cfg = app.properties.configuration;
  if (scratch) console.log("migrations: SCRATCH APP, not checked");
  else {
    const dbEnv = app.properties.template.containers[0].env.find((e) => e.name === "DATABASE_URL");
    const dbUrl = placement.secrets.DATABASE_URL?.value
      ?? (dbEnv?.secretRef ? ((await arm("POST", `${APP_PATH}/listSecrets?${API}`)).value || []).find((x) => x.name === dbEnv.secretRef)?.value : dbEnv?.value);
    await migrationsGateFor(dbUrl, full);
    console.log(`migrations: every db/migrations file of ${full.slice(0, 7)} is applied on ${APP}'s database`);
  }
  const domain = cfg.ingress.fqdn.split(".").slice(1).join(".");
  // The revision SERVING now: after a --rollback that is not the latest-ready one (found on the scratch app, 2026-10-04:
  // taking latestReady here pinned 100% back onto the rolled-back revision for the canary phase).
  const prev = cfg.activeRevisionsMode === "Multiple" ? trafficRoles(app, await listRevs()).current : app.properties.latestReadyRevisionName;
  const tpl = JSON.parse(JSON.stringify(app.properties.template));
  tpl.revisionSuffix = `s${sha}-${Date.now().toString(36).slice(-4)}`;   // unique per revision
  const newRev = `${APP}--${tpl.revisionSuffix}`;
  const c0 = tpl.containers[0];
  c0.image = image;
  // host-level env the image expects on Azure (idempotent)
  for (const [name, value] of Object.entries({ DB_DRIVER: "pg", NODE_ENV: "production", TAXILA_HOST: "azure", DEPLOY_CLASSIFY: "grok-4-1-fast-non-reasoning",
    TAXILA_CLASSIFY_HEDGE_MS: "1500", GIT_SHA: sha, ACCESS_LOG: "on",
    // Live cascade STT on the eastus2 account (ROUTER-CHANGES A3, 2026-10-04): gpt-live-transcribe, not gpt-4o-transcribe.
    // DEPLOY_TRANSCRIBE stays (push-to-talk batch + realtime-lane transcription were not measured on live-transcribe).
    // Not under --profile india: its TRANSCRIBE lane is the southindia account, which has no live-transcribe twin
    // (INDIA-MOVE §2.1, quota pooled 10/10), and the India STT choice (C4, MAI) is not signed off.
    ...(PROFILE === "india" ? {} : { TAXILA_STT_MODEL: "taxila-live-transcribe" }) })) {
    const e = c0.env.find((x) => x.name === name); if (e) { e.value = value; delete e.secretRef; } else c0.env.push({ name, value });
  }
  // --profile / --set / --secret / --db / --region (none given: nothing here runs, today's deploy unchanged)
  if (placed) { applyPlacement(c0, placement); await laneCheck(c0); }
  // 1 vCPU / 2 GiB (smooth G10: signup's scrypt is CPU-bound at 0.5 vCPU, 1.44 s p50 at 10 concurrent)
  c0.resources = { ...c0.resources, cpu: 1, memory: "2Gi" };
  // one replica until per-process state is shared (MAX_REPLICAS above); live taxila-web had max 5 at 50 concurrent
  tpl.scale = { ...(tpl.scale || {}), minReplicas: 1, maxReplicas: STICKY ? Math.max(MAX_REPLICAS, tpl.scale?.maxReplicas || 1) : MAX_REPLICAS };
  // Liveness stays shallow (a Neon blip must not restart-loop the replica); readiness adds one DB round trip.
  c0.probes = [
    { type: "Liveness", httpGet: { path: "/api/health", port: 8080 }, periodSeconds: 30, timeoutSeconds: 5, failureThreshold: 3 },
    { type: "Readiness", httpGet: { path: "/api/health?ready=1", port: 8080 }, periodSeconds: 10, timeoutSeconds: 5, failureThreshold: 3 },
  ];
  // Secrets from .env.local that the image reads, stored as Container App secrets (never plain env). A PATCH that
  // touches configuration.secrets must restate every secret's value, so the current ones are listed first.
  // TAXILA_OPS_KEY: the operator key for /api/test/boom and fresh ?db=1 numbers (server/router.js); without it on the
  // app the forced-500 route refuses everyone.
  const SECRET_ENV = { FORGE_G2_CHILD_SALT: "forge-g2-child-salt", TAXILA_OPS_KEY: "taxila-ops-key" };
  const missing = Object.entries(SECRET_ENV).filter(([envName, ref]) => process.env[envName] && !(c0.env.find((x) => x.name === envName)?.secretRef === ref));
  const configuration = { activeRevisionsMode: "Multiple", maxInactiveRevisions: 20,
    ingress: { ...cfg.ingress, traffic: [{ revisionName: prev, weight: 100, label: "current" }], ...(STICKY ? { stickySessions: { affinity: "sticky" } } : {}) } };
  const placeSecrets = Object.values(placement.secrets);
  if (missing.length || placeSecrets.length) {
    const cur = (await arm("POST", `${APP_PATH}/listSecrets?${API}`)).value || [];
    const secrets = cur.map(({ name, value }) => ({ name, value }));
    for (const [envName, ref] of missing) {
      if (!secrets.some((x) => x.name === ref)) secrets.push({ name: ref, value: process.env[envName] });
      const e = c0.env.find((x) => x.name === envName); if (e) { delete e.value; e.secretRef = ref; } else c0.env.push({ name: envName, secretRef: ref });
    }
    // placement secrets carry their own names (azure-openai-key-sin, database-url-sin…), so overwriting a value never
    // changes what the previous revision reads
    for (const { ref, value } of placeSecrets) { const x = secrets.find((y) => y.name === ref); if (x) x.value = value; else secrets.push({ name: ref, value }); }
    configuration.secrets = secrets;
  }

  console.log(`plan: ${APP} ${cfg.activeRevisionsMode} → Multiple; new revision ${newRev} (image ${c0.image}, 1 vCPU/2Gi, replicas ${tpl.scale.minReplicas}-${tpl.scale.maxReplicas}, readiness ?ready=1) at 0% as \`canary\`;`);
  console.log(`      smoke https://${APP}---canary.${domain}; then 100% → ${newRev}, ${prev} kept as \`previous\`${STICKY ? "; sticky sessions" : ""}`);
  if (placed) console.log(`      placement (${RG}${REGION ? ", " + REGION : ""}): env [${Object.keys(placement.plain).join(", ")}], secrets [${Object.entries(placement.secrets).map(([n, { ref }]) => `${n}→${ref}`).join(", ")}]`);
  if (DRY) { console.log(`dry run: all checks passed, nothing changed (${elapsed()})`); return; }

  if (!built) await buildImage();
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
