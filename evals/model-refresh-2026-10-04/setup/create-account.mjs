// Create an AIServices account (S0) in the existing resource group. Usage: node create-account.mjs <name> <location>
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { arm, SUB, RG } from "./arm.mjs";
const [name, location] = process.argv.slice(2);
const id = `/subscriptions/${SUB}/resourceGroups/${RG}/providers/Microsoft.CognitiveServices/accounts/${name}`;
const cur = await arm("GET", `${id}?api-version=2025-06-01`);
let r = cur;
if (cur.status !== 200) {
  r = await arm("PUT", `${id}?api-version=2025-06-01`, { kind: "AIServices", sku: { name: "S0" }, location,
    identity: { type: "SystemAssigned" },
    properties: { customSubDomainName: name, publicNetworkAccess: "Enabled", allowProjectManagement: true },
    tags: { project: "taxila", purpose: "model-refresh-2026-10-04" } });
  console.log("PUT", r.status, r.status >= 400 ? JSON.stringify(r.body.error).slice(0, 400) : "");
}
let state = r.body.properties?.provisioningState;
for (let i = 0; i < 40 && !/Succeeded|Failed/.test(state || ""); i++) { await new Promise((s) => setTimeout(s, 5000)); state = (await arm("GET", `${id}?api-version=2025-06-01`)).body.properties?.provisioningState; }
const g = await arm("GET", `${id}?api-version=2025-06-01`);
const rec = { at: new Date().toISOString(), name, location, kind: g.body.kind, state, endpoint: g.body.properties?.endpoint, endpoints: g.body.properties?.endpoints };
const LOG = "results/accounts-created.json"; const log = existsSync(LOG) ? JSON.parse(readFileSync(LOG, "utf8")) : []; log.push(rec); writeFileSync(LOG, JSON.stringify(log, null, 1));
console.log(name, location, state, g.body.properties?.endpoint);
