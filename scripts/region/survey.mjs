// India move, Survey (docs/ops/INDIA-MOVE.md §1-2). READ-ONLY ARM inventory of everything Taxila runs on today, plus
// what South India (southindia) offers: Foundry model catalogue + per-model quota, ACA workload profiles, PostgreSQL
// Flexible SKUs/versions, and the DragonHD voices on the existing India AIServices/Speech resources.
// Prints NO secret values: Container App secrets are listed by name only (GET never returns values), keys from
// .env.local are only sent as request headers to the voices/list endpoint and never logged.
//   NODE_USE_ENV_PROXY=1 node scripts/region/survey.mjs [--out FILE]
import { writeFileSync, mkdirSync } from "fs";
import { ROOT, arm, loadEnv, SUB_PATH } from "../../infra/azure.mjs";

loadEnv();
const argv = process.argv.slice(2);
const OUT = argv.includes("--out") ? argv[argv.indexOf("--out") + 1] : ROOT + "node_modules/.cache/india-move/survey.json";
const REGION = process.env.TAXILA_TARGET_REGION || "southindia";
const safe = async (p, f) => { try { return await f(); } catch (e) { return { error: String(e.message).slice(0, 300), at: p }; } };
const pages = async (path) => { const out = []; for (let u = path; u;) { const j = await arm("GET", u); out.push(...(j.value || [])); u = j.nextLink ? j.nextLink.replace("https://management.azure.com", "") : null; } return out; };
const S = SUB_PATH();
const out = { at: new Date().toISOString(), region: REGION };

// 1) every resource in the subscription (name, type, location, RG)
out.resources = (await pages(`${S}/resources?api-version=2021-04-01`)).map((r) => ({ name: r.name, type: r.type, location: r.location, rg: r.id.split("/")[4], kind: r.kind, sku: r.sku?.name }));

// 2) Container Apps: environments, apps, jobs — config shape, env var NAMES, secret NAMES
const ACA = "api-version=2024-03-01";
out.managedEnvironments = (await pages(`${S}/providers/Microsoft.App/managedEnvironments?${ACA}`)).map((e) => ({ name: e.name, location: e.location, rg: e.id.split("/")[4],
  staticIp: e.properties.staticIp, vnet: e.properties.vnetConfiguration || null, workloadProfiles: (e.properties.workloadProfiles || []).map((w) => `${w.name}:${w.workloadProfileType}`), defaultDomain: e.properties.defaultDomain }));
out.containerApps = (await pages(`${S}/providers/Microsoft.App/containerApps?${ACA}`)).map((a) => ({ name: a.name, location: a.location, rg: a.id.split("/")[4], env: a.properties.managedEnvironmentId?.split("/").pop(),
  fqdn: a.properties.configuration?.ingress?.fqdn, revisionsMode: a.properties.configuration?.activeRevisionsMode, outboundIps: a.properties.outboundIpAddresses,
  secrets: (a.properties.configuration?.secrets || []).map((s) => s.name), registries: (a.properties.configuration?.registries || []).map((r) => r.server),
  containers: (a.properties.template?.containers || []).map((c) => ({ image: c.image, cpu: c.resources?.cpu, memory: c.resources?.memory,
    env: (c.env || []).map((e) => e.secretRef ? `${e.name}<-secret:${e.secretRef}` : e.name) })), scale: a.properties.template?.scale }));
out.jobs = (await pages(`${S}/providers/Microsoft.App/jobs?${ACA}`)).map((j) => ({ name: j.name, location: j.location, env: j.properties.environmentId?.split("/").pop(), trigger: j.properties.configuration?.triggerType }));

// 3) Cognitive Services accounts + every deployment
out.cognitive = [];
for (const a of out.resources.filter((r) => r.type === "Microsoft.CognitiveServices/accounts")) {
  const id = `${S}/resourceGroups/${a.rg}/providers/Microsoft.CognitiveServices/accounts/${a.name}`;
  const acc = await safe(id, () => arm("GET", `${id}?api-version=2024-10-01`));
  const deps = await safe(id, () => pages(`${id}/deployments?api-version=2024-10-01`));
  out.cognitive.push({ name: a.name, kind: a.kind, location: a.location, rg: a.rg, endpoint: acc?.properties?.endpoint, customSubdomain: acc?.properties?.customSubDomainName,
    deployments: Array.isArray(deps) ? deps.map((d) => ({ name: d.name, model: d.properties?.model?.name, version: d.properties?.model?.version, format: d.properties?.model?.format, sku: d.sku?.name, capacity: d.sku?.capacity })) : deps });
}

// 4) target-region Foundry catalogue + usages (quota)
out.targetModels = await safe("models", async () => (await pages(`${S}/providers/Microsoft.CognitiveServices/locations/${REGION}/models?api-version=2024-10-01`))
  .map((m) => ({ name: m.model?.name, version: m.model?.version, format: m.model?.format, skus: (m.model?.skus || []).map((s) => s.name), lifecycle: m.model?.lifecycleStatus })));
out.targetUsages = await safe("usages", async () => (await pages(`${S}/providers/Microsoft.CognitiveServices/locations/${REGION}/usages?api-version=2024-10-01`))
  .map((u) => ({ name: u.name?.value, used: u.currentValue, limit: u.limit, unit: u.unit })));
out.eastus2Usages = await safe("usages-eus2", async () => (await pages(`${S}/providers/Microsoft.CognitiveServices/locations/eastus2/usages?api-version=2024-10-01`))
  .map((u) => ({ name: u.name?.value, used: u.currentValue, limit: u.limit })));

// 5) ACA in the target region: workload profile types + provider location list
out.acaProfiles = await safe("aca", async () => (await pages(`${S}/providers/Microsoft.App/locations/${REGION}/availableManagedEnvironmentsWorkloadProfileTypes?${ACA}`))
  .map((p) => ({ name: p.name, cores: p.properties?.cores, memGiB: p.properties?.memoryGiB, category: p.properties?.category })));
out.providers = {};
for (const ns of ["Microsoft.App", "Microsoft.DBforPostgreSQL", "Microsoft.Network", "Microsoft.CognitiveServices", "Microsoft.ContainerRegistry", "Microsoft.Storage"]) {
  out.providers[ns] = await safe(ns, async () => { const p = await arm("GET", `${S}/providers/${ns}?api-version=2021-04-01`);
    return { state: p.registrationState, inTarget: Object.fromEntries((p.resourceTypes || []).filter((t) => ["managedEnvironments", "containerApps", "flexibleServers", "accounts", "registries", "storageAccounts", "privateDnsZones", "virtualNetworks"].includes(t.resourceType))
      .map((t) => [t.resourceType, t.locations.some((l) => l.toLowerCase().replace(/ /g, "") === REGION)])) }; });
}

// 6) PostgreSQL Flexible capabilities in the target region
out.pgCaps = await safe("pg", async () => {
  const caps = await pages(`${S}/providers/Microsoft.DBforPostgreSQL/locations/${REGION}/capabilities?api-version=2024-08-01`);
  return caps.map((c) => ({ zone: c.zone, status: c.status, reason: c.reason, haModes: c.supportedHAMode, geoBackup: c.geoBackupSupported, zoneRedundantHa: c.zoneRedundantHaSupported,
    editions: (c.supportedServerEditions || []).map((e) => ({ name: e.name, storageGB: (e.supportedStorageEditions?.[0]?.supportedStorageMb || []).map((s) => s.storageSizeMb / 1024).filter((x, i, a) => i === 0 || i === a.length - 1),
      skus: (e.supportedServerSkus || []).map((s) => `${s.name}${s.supportedZones?.length ? `[z${s.supportedZones.join("")}]` : ""}`) })),
    versions: (c.supportedServerVersions || []).map((v) => v.name) }));
});

// 7) DragonHD voices on the India speech resources (.env.local keys go in headers only)
out.voices = {};
for (const R of ["SOUTHINDIA", "CENTRALINDIA"]) {
  const region = process.env[`AZURE_AI_${R}_REGION`] || R.toLowerCase(), key = process.env[`AZURE_AI_${R}_KEY`];
  if (!key) { out.voices[region] = { error: "no key in .env.local" }; continue; }
  out.voices[region] = await safe(region, async () => {
    const r = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`, { headers: { "Ocp-Apim-Subscription-Key": key } });
    if (!r.ok) return { status: r.status };
    const list = await r.json();
    return { status: r.status, total: list.length, enIN: list.filter((v) => v.Locale === "en-IN" || v.Locale === "hi-IN").map((v) => v.ShortName).filter((n) => /Dragon|Diya|Arjun|Meera|Aarti|Ananya|Kavya|Swara|Madhur/i.test(n)) };
  });
}

mkdirSync(OUT.replace(/\/[^/]+$/, ""), { recursive: true });
writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(`wrote ${OUT}: ${out.resources.length} resources, ${out.cognitive.length} cognitive accounts, ${Array.isArray(out.targetModels) ? out.targetModels.length : "?"} ${REGION} model rows`);
