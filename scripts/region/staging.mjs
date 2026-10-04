// India move, Rehearse (docs/ops/INDIA-MOVE.md §8): create or update the STAGING app `taxila-sin-staging` in
// taxila-sin/taxila-sin-env (southindia, VNet) from the image the live taxila-web revision runs, with the India env:
// the primary model account = taxila-ai-southindia, TTS/IMAGE/REALTIME lanes pinned to eastus2 (server/endpoints.js,
// honoured only by images that contain it), Speech = centralindia, DATABASE_URL = the India Azure PG (private, via
// VNet peering). taxila-web is only READ (GET + listSecrets), never written.
//
// Why not deploy-azure.mjs --create: it rightly refuses an image whose commit has no gate stamp, and the production
// image (aa263ce today) predates the stamps. Staging reuses the image that already serves production, so no new code
// is shipped; deploy-azure.mjs stays the only path to production.
//
//   NODE_USE_ENV_PROXY=1 node scripts/region/staging.mjs [--image TAG] [--app NAME] [--ai southindia|eastus2] [--set NAME=VALUE ...]
// Never prints a secret value.
import { arm, loadEnv, SUB_PATH, until } from "../../infra/azure.mjs";

loadEnv();
const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
const optAll = (f) => argv.flatMap((a, i) => (a === f && argv[i + 1] ? [argv[i + 1]] : []));
const APP = opt("--app", "taxila-sin-staging"), RG = opt("--rg", "taxila-sin"), ENV = opt("--env", "taxila-sin-env");
if (APP === "taxila-web") throw new Error("never taxila-web");
const API = "api-version=2024-03-01";
const need = (k) => { const v = process.env[k]; if (!v) throw new Error(`${k} is not set in .env.local`); return v; };

const src = await arm("GET", `/providers/Microsoft.App/containerApps/taxila-web?${API}`);
const srcSecrets = new Map(((await arm("POST", `/providers/Microsoft.App/containerApps/taxila-web/listSecrets?${API}`)).value || []).map((s) => [s.name, s.value]));
const c0 = JSON.parse(JSON.stringify(src.properties.template.containers[0]));
const tag = opt("--image", c0.image.split(":").pop());
c0.image = `${c0.image.split(":")[0]}:${tag}`;

const envPath = `${SUB_PATH()}/resourceGroups/${RG}/providers/Microsoft.App/managedEnvironments/${ENV}`;
const env = await arm("GET", `${envPath}?${API}`);

// secrets: production's (acr-password, storage-key, forge-g2-child-salt, azure-openai-key for the pinned eastus2 lanes)
// + the India ones under NEW names. database-url (Neon prod) is deliberately NOT copied: staging must never reach it.
const secrets = new Map([...srcSecrets].filter(([n]) => n !== "database-url"));
secrets.set("azure-openai-key-sin", need("AZURE_OPENAI_API_KEY_SIN"));
secrets.set("database-url-sin", need("AZURE_PG_SIN_URL"));
if (process.env.AZURE_SPEECH_KEY_SIN) secrets.set("azure-speech-key-sin", process.env.AZURE_SPEECH_KEY_SIN);

const eus = need("AZURE_OPENAI_ENDPOINT");
// --ai eastus2: the A/B arm (India compute + India DB, every model lane on today's eastus2 account)
const AI = opt("--ai", "southindia");
if (!["southindia", "eastus2"].includes(AI)) throw new Error("--ai southindia|eastus2");
const plain = {
  AZURE_OPENAI_ENDPOINT: AI === "eastus2" ? eus : need("AZURE_OPENAI_ENDPOINT_SIN"), TAXILA_AI_ACCOUNT: AI,
  AZURE_OPENAI_ENDPOINT_TTS: eus, AZURE_OPENAI_ENDPOINT_IMAGE: eus, AZURE_OPENAI_ENDPOINT_REALTIME: eus,
  TAXILA_REGION: "southindia", TAXILA_STAGING: "1",
  ...(process.env.AZURE_SPEECH_REGION_SIN ? { AZURE_SPEECH_REGION: process.env.AZURE_SPEECH_REGION_SIN } : {}),
};
const refs = { AZURE_OPENAI_API_KEY: AI === "eastus2" ? "azure-openai-key" : "azure-openai-key-sin", DATABASE_URL: "database-url-sin",
  AZURE_OPENAI_API_KEY_TTS: "azure-openai-key", AZURE_OPENAI_API_KEY_IMAGE: "azure-openai-key", AZURE_OPENAI_API_KEY_REALTIME: "azure-openai-key",
  ...(process.env.AZURE_SPEECH_KEY_SIN ? { AZURE_SPEECH_KEY: "azure-speech-key-sin" } : {}) };
for (const kv of optAll("--set")) { const m = /^([A-Z0-9_]+)=(.*)$/s.exec(kv); if (!m) throw new Error(`--set ${kv}`); if (m[2] === "") delete plain[m[1]]; else plain[m[1]] = m[2]; }
const touched = new Set([...Object.keys(plain), ...Object.keys(refs)]);
c0.env = [...c0.env.filter((e) => !touched.has(e.name)),
  ...Object.entries(plain).map(([name, value]) => ({ name, value })),
  ...Object.entries(refs).map(([name, secretRef]) => ({ name, secretRef }))];
for (const e of c0.env) if (e.secretRef && !secrets.has(e.secretRef)) throw new Error(`env ${e.name} → missing secret ${e.secretRef}`);

const sc = src.properties.configuration;
const body = { location: env.location, tags: { project: "taxila", purpose: "india-staging" }, properties: { environmentId: env.id, workloadProfileName: "Consumption",
  configuration: { activeRevisionsMode: "Multiple", maxInactiveRevisions: 10, secrets: [...secrets].map(([name, value]) => ({ name, value })),
    registries: sc.registries, ingress: { external: true, targetPort: sc.ingress.targetPort, transport: sc.ingress.transport, allowInsecure: false, traffic: [{ latestRevision: true, weight: 100 }] } },
  // same size and probes as production today (0.5 vCPU / 1 Gi), so the latency A/B compares like with like
  template: { revisionSuffix: `s${tag.slice(0, 7)}-${Date.now().toString(36).slice(-4)}`, containers: [c0], scale: { minReplicas: 1, maxReplicas: 1 } } } };
const P = `${SUB_PATH()}/resourceGroups/${RG}/providers/Microsoft.App/containerApps/${APP}?${API}`;
console.log(`put ${APP} in ${RG}/${ENV} (${env.location}) image ${c0.image}; env ${c0.env.map((e) => e.name).join(",")}`);
await arm("PUT", P, body);
const app = await until(async () => { const a = await arm("GET", P); if (a.properties.provisioningState === "Failed") throw new Error("provisioning failed"); return a.properties.provisioningState === "Succeeded" && a; },
  { everyMs: 6000, maxMs: 900_000, what: `${APP} provisioned` });
const rev = app.properties.latestRevisionName;
await until(async () => { const r = await arm("GET", `${SUB_PATH()}/resourceGroups/${RG}/providers/Microsoft.App/containerApps/${APP}/revisions/${rev}?${API}`);
  if (/Failed/.test(r.properties.runningState || "") || r.properties.healthState === "Unhealthy") throw new Error(`revision ${rev} ${r.properties.runningState}/${r.properties.healthState}`);
  return r.properties.healthState === "Healthy" && /Running/.test(r.properties.runningState || ""); }, { everyMs: 8000, maxMs: 900_000, what: `${rev} healthy` });
console.log(`ok ${APP} revision ${rev} healthy · https://${app.properties.configuration.ingress.fqdn}`);
