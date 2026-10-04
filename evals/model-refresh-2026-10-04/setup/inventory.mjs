import { writeFileSync } from "node:fs";
import { arm, ACCT_ID, SUB } from "./arm.mjs";
const D = "evals/model-refresh-2026-10-04/setup/results";
const acct = await arm("GET", `${ACCT_ID}?api-version=2024-10-01`);
console.log("account", acct.status, acct.body.location, acct.body.kind, acct.body.sku?.name);
const deps = await arm("GET", `${ACCT_ID}/deployments?api-version=2025-06-01`);
writeFileSync(`${D}/deployments-before.json`, JSON.stringify(deps.body, null, 1));
for (const d of deps.body.value || []) console.log(" dep", d.name, d.properties.model.format, d.properties.model.name, d.properties.model.version, d.sku?.name, d.sku?.capacity, d.properties.provisioningState);
const models = await arm("GET", `${ACCT_ID}/models?api-version=2025-06-01`);
let all = models.body.value || []; let nl = models.body.nextLink;
while (nl) { const p = await arm("GET", nl); all.push(...(p.body.value || [])); nl = p.body.nextLink; }
writeFileSync(`${D}/account-models.json`, JSON.stringify(all, null, 1));
console.log("account models", models.status, all.length);
const loc = await arm("GET", `/subscriptions/${SUB}/providers/Microsoft.CognitiveServices/locations/eastus2/models?api-version=2025-06-01`);
let la = loc.body.value || []; nl = loc.body.nextLink;
while (nl) { const p = await arm("GET", nl); la.push(...(p.body.value || [])); nl = p.body.nextLink; }
writeFileSync(`${D}/location-models-eastus2.json`, JSON.stringify(la, null, 1));
console.log("location models", loc.status, la.length);
