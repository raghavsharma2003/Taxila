// Model scout 2026-10-04, images: southindia deployments for the image bench (taxila-ai-southindia). Idempotent; logs ARM
// status only, never keys. MAI-Image-2.6-Flash / 2.5-Pro already exist as scout-mai-image26-flash / scout-mai-image25-pro.
// Own MAI-Image-2.6 deployment so this run does not share capacity with the refresh bench's taxila-mai-image26.
// FLUX.2-pro in southindia gives an India-region latency for the baseline (eastus2 taxila-flux2 also benched).
// Usage: node --env-file=.env.local evals/model-scout-2026-10-04/images/deploy.mjs
import { writeFileSync } from "node:fs";
import { arm, SUB, RG } from "../../model-refresh-2026-10-04/setup/arm.mjs";
const ACCT = `/subscriptions/${SUB}/resourceGroups/${RG}/providers/Microsoft.CognitiveServices/accounts/taxila-ai-southindia`;
const PLAN = [
  ["scout-mai-image26", "Microsoft", "MAI-Image-2.6", "2026-07-31", "GlobalStandard", 2],
  ["scout-flux2-pro-si", "Black Forest Labs", "FLUX.2-pro", "1", "GlobalStandard", 4],
];
const log = [];
for (const [name, format, model, version, sku, cap] of PLAN) {
  const path = `${ACCT}/deployments/${name}?api-version=2025-06-01`;
  const cur = await arm("GET", path);
  if (cur.status === 200 && cur.body.properties?.provisioningState === "Succeeded") { log.push({ name, status: "exists" }); console.log(name, "exists"); continue; }
  const r = await arm("PUT", path, { sku: { name: sku, capacity: cap }, properties: { model: { format, name: model, version } } });
  let state = r.body.properties?.provisioningState;
  for (let i = 0; i < 40 && state && !/Succeeded|Failed/.test(state); i++) { await new Promise((s) => setTimeout(s, 5000)); state = (await arm("GET", path)).body.properties?.provisioningState; }
  log.push({ name, model, version, sku, cap, http: r.status, state, err: r.body.error ? `${r.body.error.code}: ${String(r.body.error.message).slice(0, 200)}` : undefined });
  console.log(name, r.status, state || "", r.body.error?.code || "", String(r.body.error?.message || "").slice(0, 200));
}
writeFileSync(new URL("results/deploy-2026-10-04.json", import.meta.url), JSON.stringify({ date: "2026-10-04", log }, null, 1));
