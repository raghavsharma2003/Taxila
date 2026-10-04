// India move, Provision (docs/ops/INDIA-MOVE.md §3b/§4). Builds the South India platform in its OWN resource group
// `taxila-sin`: VNet + subnets, private DNS zone for PostgreSQL, Log Analytics workspace, VNet-integrated ACA
// environment (workload profiles, Consumption), a user-assigned identity with AcrPull on the existing `taxilacr`,
// and an Azure Database for PostgreSQL Flexible Server with private access only, TLS required, extensions allow-listed.
// Does NOT create any app, and touches nothing in rg-raghavsharma1729-7190 except a role assignment scoped to taxilacr.
// Idempotent: every step GETs first and PUTs only what is missing or differs. Re-run safely.
// Secrets: the PG admin password is generated once, written ONLY to .env.local (AZURE_PG_SIN_*), and never printed.
//   NODE_USE_ENV_PROXY=1 node scripts/region/provision.mjs [--dry]
import { readFileSync, appendFileSync, writeFileSync, mkdirSync } from "fs";
import { randomBytes, randomUUID } from "crypto";
import { ROOT, arm, loadEnv, SUB_PATH, sleep } from "../../infra/azure.mjs";

loadEnv();
const DRY = process.argv.includes("--dry");
const S = SUB_PATH();
const LOC = process.env.TAXILA_TARGET_REGION || "southindia";
const N = {
  rg: process.env.TAXILA_SIN_RG || "taxila-sin",
  vnet: "taxila-sin-vnet", acaSubnet: "aca", pgSubnet: "pg",
  dns: "taxila-sin.private.postgres.database.azure.com", dnsLink: "taxila-sin-vnet-link",
  logs: "taxila-sin-logs", env: "taxila-sin-env", id: "taxila-sin-pull",
  pg: "taxila-sin-pg", db: "taxila", admin: "taxila_admin",
  acrRg: "rg-raghavsharma1729-7190", acr: "taxilacr",
};
const RG = `${S}/resourceGroups/${N.rg}`;
const V = { rg: "2021-04-01", net: "2023-11-01", dns: "2020-06-01", la: "2022-10-01", aca: "2024-03-01", msi: "2023-01-31", auth: "2022-04-01", pg: "2024-08-01" };
const report = { at: new Date().toISOString(), region: LOC, names: N, steps: [] };
const log = (step, status, detail = "") => { report.steps.push({ step, status, detail: String(detail).slice(0, 500) }); console.log(`[${status}] ${step}${detail ? " — " + String(detail).slice(0, 300) : ""}`); };
const get = (p) => arm("GET", p, undefined, { allow404: true });
async function waitState(p, what, maxMs = 1_800_000) {
  const t0 = Date.now();
  for (;;) {
    const r = await get(p); const st = r?.properties?.provisioningState || r?.properties?.state;
    if (/^(Succeeded|Ready)$/i.test(st || "")) return r;
    if (/^(Failed|Canceled)$/i.test(st || "")) throw new Error(`${what} provisioningState=${st}`);
    if (Date.now() - t0 > maxMs) throw new Error(`${what} still ${st} after ${maxMs / 1000}s`);
    await sleep(15000);
  }
}
async function step(name, fn) { try { const d = await fn(); log(name, "ok", d); return true; } catch (e) { log(name, "FAIL", e.message); return false; } }

// 0) providers
await step("providers registered", async () => {
  for (const ns of ["Microsoft.Network", "Microsoft.DBforPostgreSQL", "Microsoft.App", "Microsoft.OperationalInsights", "Microsoft.ManagedIdentity"]) {
    let p = await arm("GET", `${S}/providers/${ns}?api-version=2021-04-01`);
    if (p.registrationState === "NotRegistered" && !DRY) await arm("POST", `${S}/providers/${ns}/register?api-version=2021-04-01`);
    for (let i = 0; i < 40 && p.registrationState !== "Registered"; i++) { await sleep(15000); p = await arm("GET", `${S}/providers/${ns}?api-version=2021-04-01`); }
    if (p.registrationState !== "Registered") throw new Error(`${ns} ${p.registrationState}`);
  }
  return "Network, DBforPostgreSQL, App, OperationalInsights, ManagedIdentity";
});
if (DRY) { console.log("dry run: stop after provider check"); process.exit(0); }

// 1) resource group
await step(`resource group ${N.rg}`, async () => {
  const r = await get(`${RG}?api-version=${V.rg}`);
  if (r) { if (r.location !== LOC) throw new Error(`exists in ${r.location}, not ${LOC}`); return "exists"; }
  await arm("PUT", `${RG}?api-version=${V.rg}`, { location: LOC, tags: { project: "taxila", purpose: "india-move" } });
  return "created";
});

// 2) VNet: ACA infra subnet /23 delegated to Microsoft.App/environments (required for workload-profiles envs),
//    PG subnet /28 delegated to flexibleServers (private access needs a dedicated delegated subnet).
const vnetPath = `${RG}/providers/Microsoft.Network/virtualNetworks/${N.vnet}`;
await step(`vnet ${N.vnet}`, async () => {
  const body = { location: LOC, properties: { addressSpace: { addressPrefixes: ["10.60.0.0/16"] }, subnets: [
    { name: N.acaSubnet, properties: { addressPrefix: "10.60.0.0/23", delegations: [{ name: "aca", properties: { serviceName: "Microsoft.App/environments" } }] } },
    { name: N.pgSubnet, properties: { addressPrefix: "10.60.2.0/28", delegations: [{ name: "pg", properties: { serviceName: "Microsoft.DBforPostgreSQL/flexibleServers" } }] } },
  ] } };
  const cur = await get(`${vnetPath}?api-version=${V.net}`);
  if (cur && ["aca", "pg"].every((s) => cur.properties.subnets?.some((x) => x.name === s))) return "exists";
  await arm("PUT", `${vnetPath}?api-version=${V.net}`, body);
  await waitState(`${vnetPath}?api-version=${V.net}`, "vnet");
  return "created 10.60.0.0/16 (aca 10.60.0.0/23, pg 10.60.2.0/28)";
});

// 3) private DNS zone (global) + link to the VNet
const dnsPath = `${RG}/providers/Microsoft.Network/privateDnsZones/${N.dns}`;
await step(`private dns ${N.dns}`, async () => {
  if (!(await get(`${dnsPath}?api-version=${V.dns}`))) {
    await arm("PUT", `${dnsPath}?api-version=${V.dns}`, { location: "global" });
    await waitState(`${dnsPath}?api-version=${V.dns}`, "dns zone");
  }
  const lp = `${dnsPath}/virtualNetworkLinks/${N.dnsLink}?api-version=${V.dns}`;
  if (!(await get(lp))) {
    await arm("PUT", lp, { location: "global", properties: { registrationEnabled: false, virtualNetwork: { id: vnetPath } } });
    await waitState(lp, "dns link");
  }
  return "zone + vnet link";
});

// 4) Log Analytics in South India (logs can carry child data; keep them in India)
const laPath = `${RG}/providers/Microsoft.OperationalInsights/workspaces/${N.logs}`;
let la = null;
await step(`log analytics ${N.logs}`, async () => {
  la = await get(`${laPath}?api-version=${V.la}`);
  if (!la) { await arm("PUT", `${laPath}?api-version=${V.la}`, { location: LOC, properties: { sku: { name: "PerGB2018" }, retentionInDays: 30 } }); la = await waitState(`${laPath}?api-version=${V.la}`, "workspace"); return "created (PerGB2018, 30d)"; }
  return "exists";
});

// 5) ACA environment, VNet-integrated, external ingress (the app must be public), Consumption workload profile
const envPath = `${RG}/providers/Microsoft.App/managedEnvironments/${N.env}`;
await step(`aca env ${N.env}`, async () => {
  const cur = await get(`${envPath}?api-version=${V.aca}`);
  if (cur?.properties?.provisioningState === "Succeeded") return `exists staticIp=${cur.properties.staticIp}`;
  if (!cur) {
    const keys = await arm("POST", `${laPath}/sharedKeys?api-version=2020-08-01`);
    await arm("PUT", `${envPath}?api-version=${V.aca}`, { location: LOC, properties: {
      vnetConfiguration: { infrastructureSubnetId: `${vnetPath}/subnets/${N.acaSubnet}`, internal: false },
      workloadProfiles: [{ name: "Consumption", workloadProfileType: "Consumption" }],
      zoneRedundant: false,
      appLogsConfiguration: { destination: "log-analytics", logAnalyticsConfiguration: { customerId: la.properties.customerId, sharedKey: keys.primarySharedKey } },
    } });
  }
  const r = await waitState(`${envPath}?api-version=${V.aca}`, "aca env", 2_400_000);
  report.envStaticIp = r.properties.staticIp; report.envDomain = r.properties.defaultDomain;
  return `staticIp=${r.properties.staticIp} domain=${r.properties.defaultDomain}`;
});

// 6) pull identity + AcrPull on taxilacr. Apps in taxila-sin-env reference this identity in registries[].identity.
const idPath = `${RG}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/${N.id}`;
let ident = null;
await step(`identity ${N.id}`, async () => {
  ident = await get(`${idPath}?api-version=${V.msi}`);
  if (!ident) { ident = await arm("PUT", `${idPath}?api-version=${V.msi}`, { location: LOC }); await sleep(20000); return `created principal=${ident.properties.principalId}`; }
  return `exists principal=${ident.properties.principalId}`;
});
const acrId = `${S}/resourceGroups/${N.acrRg}/providers/Microsoft.ContainerRegistry/registries/${N.acr}`;
await step(`AcrPull on ${N.acr} for ${N.id}`, async () => {
  if (!ident) throw new Error("no identity");
  const ACRPULL = `${S}/providers/Microsoft.Authorization/roleDefinitions/7f951dde-4a24-4fda-b4f2-d5a04b6fcb1e`;
  const existing = await arm("GET", `${acrId}/providers/Microsoft.Authorization/roleAssignments?api-version=${V.auth}&$filter=${encodeURIComponent(`principalId eq '${ident.properties.principalId}'`)}`);
  if ((existing.value || []).some((a) => a.properties.roleDefinitionId.toLowerCase().endsWith("7f951dde-4a24-4fda-b4f2-d5a04b6fcb1e"))) return "exists";
  await arm("PUT", `${acrId}/providers/Microsoft.Authorization/roleAssignments/${randomUUID()}?api-version=${V.auth}`,
    { properties: { roleDefinitionId: ACRPULL, principalId: ident.properties.principalId, principalType: "ServicePrincipal" } });
  return "assigned";
});

// 7) PostgreSQL Flexible Server. Admin creds: reuse from .env.local if present, else generate and write first.
const envFile = ROOT + ".env.local";
const envText = readFileSync(envFile, "utf8");
if (!/^AZURE_PG_SIN_PASSWORD=/m.test(envText)) {
  const pw = randomBytes(24).toString("base64url").replace(/[-_]/g, "") + "Aa9";
  appendFileSync(envFile, `${envText.endsWith("\n") ? "" : "\n"}# India move: Azure PG Flexible taxila-sin-pg (southindia), private access only\nAZURE_PG_SIN_USER=${N.admin}\nAZURE_PG_SIN_PASSWORD=${pw}\n`);
  process.env.AZURE_PG_SIN_USER = N.admin; process.env.AZURE_PG_SIN_PASSWORD = pw;
  log("pg admin creds", "ok", "generated, written to .env.local only");
}
const pgPath = `${RG}/providers/Microsoft.DBforPostgreSQL/flexibleServers/${N.pg}`;
const PGV = process.env.TAXILA_PG_VERSION || "17"; // Neon prod is PG 17.11
let pgOk = await step(`postgres ${N.pg}`, async () => {
  let cur = await get(`${pgPath}?api-version=${V.pg}`);
  if (!cur) {
    // 2026-10-04: southindia returned restricted=Enabled ("Subscriptions are restricted from provisioning in this
    // region", support request needed); the PUT then fails with "Version should be in: []". Fail fast with the reason.
    const caps = await arm("GET", `${S}/providers/Microsoft.DBforPostgreSQL/locations/${LOC}/capabilities?api-version=${V.pg}`);
    const c = (caps.value || [])[0];
    if (c?.restricted === "Enabled" || !(c?.supportedServerVersions || []).some((v) => v.name === PGV))
      throw new Error(`PG Flexible not provisionable in ${LOC} for this subscription: ${c?.reason || "no version " + PGV}`);
    const body = (geo) => ({ location: LOC, sku: { name: "Standard_D2ds_v5", tier: "GeneralPurpose" }, properties: {
      version: PGV, administratorLogin: process.env.AZURE_PG_SIN_USER, administratorLoginPassword: process.env.AZURE_PG_SIN_PASSWORD,
      storage: { storageSizeGB: 64, autoGrow: "Enabled" },
      backup: { backupRetentionDays: 14, geoRedundantBackup: geo },
      network: { delegatedSubnetResourceId: `${vnetPath}/subnets/${N.pgSubnet}`, privateDnsZoneArmResourceId: dnsPath, publicNetworkAccess: "Disabled" },
      highAvailability: { mode: "Disabled" },
      authConfig: { activeDirectoryAuth: "Disabled", passwordAuth: "Enabled" },
      createMode: "Create" }, tags: { project: "taxila" } });
    try { await arm("PUT", `${pgPath}?api-version=${V.pg}`, body("Enabled")); report.geoBackup = "Enabled"; }
    catch (e) { log("pg geo-redundant backup", "WARN", `refused, retrying without: ${e.message}`); await arm("PUT", `${pgPath}?api-version=${V.pg}`, body("Disabled")); report.geoBackup = "Disabled"; }
  }
  cur = await waitState(`${pgPath}?api-version=${V.pg}`, "postgres", 3_000_000);
  report.pg = { fqdn: cur.properties.fullyQualifiedDomainName, version: cur.properties.version, sku: cur.sku.name, storageGB: cur.properties.storage.storageSizeGB,
    autoGrow: cur.properties.storage.autoGrow, backupDays: cur.properties.backup.backupRetentionDays, geoBackup: cur.properties.backup.geoRedundantBackup,
    publicNetworkAccess: cur.properties.network.publicNetworkAccess };
  return JSON.stringify(report.pg);
});

if (pgOk) {
  // migrations need pgcrypto only (grep db/migrations, 2026-10-04); uuid-ossp/citext/pg_stat_statements allow-listed as headroom.
  const cfg = async (name, value) => {
    const p = `${pgPath}/configurations/${name}?api-version=${V.pg}`;
    const cur = await arm("GET", p);
    if (String(cur.properties.value).toUpperCase() === value.toUpperCase()) return `${name}=${cur.properties.value} (already)`;
    await arm("PUT", p, { properties: { value, source: "user-override" } });
    for (let i = 0; i < 40; i++) { await sleep(10000); const c = await arm("GET", p); if (String(c.properties.value).toUpperCase() === value.toUpperCase()) return `${name}=${c.properties.value}`; }
    throw new Error(`${name} did not settle`);
  };
  await step("pg azure.extensions", () => cfg("azure.extensions", "PGCRYPTO,UUID-OSSP,CITEXT,PG_STAT_STATEMENTS"));
  await step("pg require_secure_transport", () => cfg("require_secure_transport", "ON"));
  await step("pg ssl_min_protocol_version", () => cfg("ssl_min_protocol_version", "TLSv1.2"));
  await step(`pg database ${N.db}`, async () => {
    const p = `${pgPath}/databases/${N.db}?api-version=${V.pg}`;
    if (await get(p)) return "exists";
    await arm("PUT", p, { properties: { charset: "UTF8", collation: "en_US.utf8" } });
    for (let i = 0; i < 40; i++) { await sleep(10000); if (await get(p)) return "created"; }
    throw new Error("database did not appear");
  });
  // connection facts (no secrets) into .env.local
  const t = readFileSync(envFile, "utf8"); const add = [];
  if (!/^AZURE_PG_SIN_HOST=/m.test(t)) add.push(`AZURE_PG_SIN_HOST=${report.pg.fqdn}`);
  if (!/^AZURE_PG_SIN_DATABASE=/m.test(t)) add.push(`AZURE_PG_SIN_DATABASE=${N.db}`);
  if (!/^AZURE_PG_SIN_URL=/m.test(t)) add.push(`AZURE_PG_SIN_URL=postgres://${process.env.AZURE_PG_SIN_USER}:${encodeURIComponent(process.env.AZURE_PG_SIN_PASSWORD)}@${report.pg.fqdn}:5432/${N.db}?sslmode=require`);
  if (add.length) { appendFileSync(envFile, add.join("\n") + "\n"); log("env .env.local", "ok", `added ${add.map((l) => l.split("=")[0]).join(", ")}`); }
}

mkdirSync(ROOT + "node_modules/.cache/india-move", { recursive: true });
writeFileSync(ROOT + "node_modules/.cache/india-move/provision.json", JSON.stringify(report, null, 1));
console.log("wrote node_modules/.cache/india-move/provision.json");
