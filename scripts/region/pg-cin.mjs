// India move, Rehearse (docs/ops/INDIA-MOVE.md §2.5 option 2 / §8). South India refuses PostgreSQL Flexible for this
// subscription (capabilities: restricted=Enabled, support request needed). This builds the server in CENTRAL INDIA
// instead, private-access only, and makes it reachable from the South India ACA env through VNet peering:
//   taxila-cin-vnet (centralindia, 10.61.0.0/16, subnet pg 10.61.2.0/28 → flexibleServers)
//   <-> peering <-> taxila-sin-vnet (southindia, 10.60.0.0/16)
//   private DNS zone taxila-sin.private.postgres.database.azure.com linked to BOTH VNets
//   PG 17 GeneralPurpose D2ds_v5, 64 GB autogrow, 14 d backup (geo-redundant: pair = South India), public access off,
//   require_secure_transport=ON, TLS >= 1.2, pgcrypto allow-listed, database `taxila`.
// Admin creds are the AZURE_PG_SIN_USER/PASSWORD already in .env.local; the URL is written as AZURE_PG_SIN_URL (the
// "India stack database" URL that deploy-azure.mjs --db azure and db-copy.mjs read), never printed.
// Idempotent. Touches nothing in rg-raghavsharma1729-7190.
//   NODE_USE_ENV_PROXY=1 node scripts/region/pg-cin.mjs
import { readFileSync, appendFileSync, writeFileSync, mkdirSync } from "fs";
import { ROOT, arm, loadEnv, SUB_PATH, sleep } from "../../infra/azure.mjs";

loadEnv();
const S = SUB_PATH();
const LOC = process.env.TAXILA_PG_REGION || "centralindia";
const N = {
  rg: "taxila-sin", sinVnet: "taxila-sin-vnet", vnet: "taxila-cin-vnet", pgSubnet: "pg",
  dns: "taxila-sin.private.postgres.database.azure.com", dnsLink: "taxila-cin-vnet-link",
  pg: process.env.TAXILA_PG_NAME || "taxila-cin-pg", db: "taxila",
};
const RG = `${S}/resourceGroups/${N.rg}`;
const V = { net: "2023-11-01", dns: "2020-06-01", pg: "2024-08-01" };
const report = { at: new Date().toISOString(), region: LOC, names: N, steps: [] };
const log = (s, st, d = "") => { report.steps.push({ step: s, status: st, detail: String(d).slice(0, 500) }); console.log(`[${st}] ${s}${d ? " — " + String(d).slice(0, 300) : ""}`); };
const get = (p) => arm("GET", p, undefined, { allow404: true });
async function waitState(p, what, maxMs = 1_800_000) {
  const t0 = Date.now();
  for (;;) {
    const r = await get(p); const st = r?.properties?.provisioningState || r?.properties?.state || r?.properties?.peeringState;
    if (/^(Succeeded|Ready)$/i.test(st || "")) return r;
    if (/^(Failed|Canceled)$/i.test(st || "")) throw new Error(`${what} state=${st}`);
    if (Date.now() - t0 > maxMs) throw new Error(`${what} still ${st} after ${maxMs / 1000}s`);
    await sleep(15000);
  }
}
async function step(name, fn) { try { const d = await fn(); log(name, "ok", d); return true; } catch (e) { log(name, "FAIL", e.message); return false; } }
const fail = () => { mkdirSync(ROOT + "node_modules/.cache/india-move", { recursive: true }); writeFileSync(ROOT + "node_modules/.cache/india-move/pg-cin.json", JSON.stringify(report, null, 1)); process.exit(1); };

const sinVnet = `${RG}/providers/Microsoft.Network/virtualNetworks/${N.sinVnet}`;
const vnet = `${RG}/providers/Microsoft.Network/virtualNetworks/${N.vnet}`;
const dnsPath = `${RG}/providers/Microsoft.Network/privateDnsZones/${N.dns}`;

(await step("capabilities", async () => {
  const caps = await arm("GET", `${S}/providers/Microsoft.DBforPostgreSQL/locations/${LOC}/capabilities?api-version=${V.pg}`);
  const c = (caps.value || [])[0];
  if (c?.restricted === "Enabled" || !(c?.supportedServerVersions || []).some((v) => v.name === "17")) throw new Error(`not provisionable in ${LOC}: ${c?.reason || "no PG 17"}`);
  return `${LOC} PG17 offered`;
})) || fail();

(await step(`vnet ${N.vnet}`, async () => {
  const cur = await get(`${vnet}?api-version=${V.net}`);
  if (cur?.properties?.subnets?.some((s) => s.name === N.pgSubnet)) return "exists";
  await arm("PUT", `${vnet}?api-version=${V.net}`, { location: LOC, tags: { project: "taxila", purpose: "india-move" }, properties: {
    addressSpace: { addressPrefixes: ["10.61.0.0/16"] },
    subnets: [{ name: N.pgSubnet, properties: { addressPrefix: "10.61.2.0/28", delegations: [{ name: "pg", properties: { serviceName: "Microsoft.DBforPostgreSQL/flexibleServers" } }] } }] } });
  await waitState(`${vnet}?api-version=${V.net}`, "vnet");
  return "created 10.61.0.0/16 (pg 10.61.2.0/28)";
})) || fail();

for (const [from, to, name] of [[sinVnet, vnet, "sin-to-cin"], [vnet, sinVnet, "cin-to-sin"]]) {
  (await step(`peering ${name}`, async () => {
    const p = `${from}/virtualNetworkPeerings/${name}?api-version=${V.net}`;
    const cur = await get(p);
    if (cur?.properties?.peeringState === "Connected") return "connected";
    if (!cur) await arm("PUT", p, { properties: { remoteVirtualNetwork: { id: to }, allowVirtualNetworkAccess: true, allowForwardedTraffic: false, allowGatewayTransit: false, useRemoteGateways: false } });
    for (let i = 0; i < 40; i++) { const r = await get(p); if (r?.properties?.provisioningState === "Succeeded") return r.properties.peeringState; await sleep(10000); }
    throw new Error("peering did not settle");
  })) || fail();
}

(await step(`dns link ${N.dnsLink}`, async () => {
  const lp = `${dnsPath}/virtualNetworkLinks/${N.dnsLink}?api-version=${V.dns}`;
  if (await get(lp)) return "exists";
  await arm("PUT", lp, { location: "global", properties: { registrationEnabled: false, virtualNetwork: { id: vnet } } });
  await waitState(lp, "dns link");
  return "linked";
})) || fail();

const pgPath = `${RG}/providers/Microsoft.DBforPostgreSQL/flexibleServers/${N.pg}`;
(await step(`postgres ${N.pg}`, async () => {
  let cur = await get(`${pgPath}?api-version=${V.pg}`);
  if (!cur) {
    const body = (geo) => ({ location: LOC, sku: { name: "Standard_D2ds_v5", tier: "GeneralPurpose" }, tags: { project: "taxila", purpose: "india-move" }, properties: {
      version: "17", administratorLogin: process.env.AZURE_PG_SIN_USER, administratorLoginPassword: process.env.AZURE_PG_SIN_PASSWORD,
      storage: { storageSizeGB: 64, autoGrow: "Enabled" }, backup: { backupRetentionDays: 14, geoRedundantBackup: geo },
      network: { delegatedSubnetResourceId: `${vnet}/subnets/${N.pgSubnet}`, privateDnsZoneArmResourceId: dnsPath, publicNetworkAccess: "Disabled" },
      highAvailability: { mode: "Disabled" }, authConfig: { activeDirectoryAuth: "Disabled", passwordAuth: "Enabled" }, createMode: "Create" } });
    try { await arm("PUT", `${pgPath}?api-version=${V.pg}`, body("Enabled")); report.geoBackup = "Enabled"; }
    catch (e) { log("geo-redundant backup", "WARN", e.message); await arm("PUT", `${pgPath}?api-version=${V.pg}`, body("Disabled")); report.geoBackup = "Disabled"; }
  }
  cur = await waitState(`${pgPath}?api-version=${V.pg}`, "postgres", 3_000_000);
  report.pg = { fqdn: cur.properties.fullyQualifiedDomainName, version: cur.properties.version, sku: cur.sku.name, geoBackup: cur.properties.backup.geoRedundantBackup, publicNetworkAccess: cur.properties.network.publicNetworkAccess };
  return JSON.stringify(report.pg);
})) || fail();

const cfg = async (name, value) => {
  const p = `${pgPath}/configurations/${name}?api-version=${V.pg}`;
  const cur = await arm("GET", p);
  if (String(cur.properties.value).toUpperCase() === value.toUpperCase()) return `${name}=${cur.properties.value} (already)`;
  await arm("PUT", p, { properties: { value, source: "user-override" } });
  for (let i = 0; i < 60; i++) { await sleep(10000); const c = await arm("GET", p); if (String(c.properties.value).toUpperCase() === value.toUpperCase()) return `${name}=${c.properties.value}`; }
  throw new Error(`${name} did not settle`);
};
await step("azure.extensions", () => cfg("azure.extensions", "PGCRYPTO,UUID-OSSP,CITEXT,PG_STAT_STATEMENTS"));
await step("require_secure_transport", () => cfg("require_secure_transport", "ON"));
await step("ssl_min_protocol_version", () => cfg("ssl_min_protocol_version", "TLSv1.2"));
await step(`database ${N.db}`, async () => {
  const p = `${pgPath}/databases/${N.db}?api-version=${V.pg}`;
  if (await get(p)) return "exists";
  await arm("PUT", p, { properties: { charset: "UTF8", collation: "en_US.utf8" } });
  for (let i = 0; i < 40; i++) { await sleep(10000); if (await get(p)) return "created"; }
  throw new Error("database did not appear");
});

const envFile = ROOT + ".env.local";
const t = readFileSync(envFile, "utf8"); const add = [];
if (!/^AZURE_PG_SIN_HOST=/m.test(t)) add.push(`AZURE_PG_SIN_HOST=${report.pg.fqdn}`);
if (!/^AZURE_PG_SIN_DATABASE=/m.test(t)) add.push(`AZURE_PG_SIN_DATABASE=${N.db}`);
if (!/^AZURE_PG_SIN_URL=/m.test(t)) add.push(`AZURE_PG_SIN_URL=postgres://${process.env.AZURE_PG_SIN_USER}:${encodeURIComponent(process.env.AZURE_PG_SIN_PASSWORD)}@${report.pg.fqdn}:5432/${N.db}?sslmode=require`);
if (add.length) { appendFileSync(envFile, `${t.endsWith("\n") ? "" : "\n"}# India move: the India-stack PG is ${N.pg} in ${LOC} (southindia restricted for PG; peered into taxila-sin-vnet)\n` + add.join("\n") + "\n"); log(".env.local", "ok", `added ${add.map((l) => l.split("=")[0]).join(", ")}`); }

mkdirSync(ROOT + "node_modules/.cache/india-move", { recursive: true });
writeFileSync(ROOT + "node_modules/.cache/india-move/pg-cin.json", JSON.stringify(report, null, 1));
console.log("wrote node_modules/.cache/india-move/pg-cin.json");
