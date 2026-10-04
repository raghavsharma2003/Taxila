// Scout 2026-10-04: deployments for arms the refresh bench does not cover, on the southindia account
// (taxila-ai-southindia; MAI-Image and gpt-live-1 are offered there and not in eastus2). Idempotent; logs ARM status only.
import { writeFileSync } from "node:fs";
import { arm, SUB, RG } from "../setup/arm.mjs";
const ACCT = `/subscriptions/${SUB}/resourceGroups/${RG}/providers/Microsoft.CognitiveServices/accounts/taxila-ai-southindia`;
const PLAN = [
  ["scout-mai-image26-flash", "Microsoft", "MAI-Image-2.6-Flash", "2026-07-31", "GlobalStandard", 2],
  ["scout-mai-image25-pro", "Microsoft", "MAI-Image-2.5-Pro", "2026-06-19", "GlobalStandard", 2],
  ["scout-gpt-live-1", "OpenAI", "gpt-live-1", "2026-09-10", "GlobalStandard", 1],
];
const log = [];
for (const [name, format, model, version, sku, cap] of PLAN) {
  const path = `${ACCT}/deployments/${name}?api-version=2025-06-01`;
  const cur = await arm("GET", path);
  if (cur.status === 200 && cur.body.properties?.provisioningState === "Succeeded") { log.push({ name, status: "exists" }); console.log(name, "exists"); continue; }
  const r = await arm("PUT", path, { sku: { name: sku, capacity: cap }, properties: { model: { format, name: model, version } } });
  let state = r.body.properties?.provisioningState;
  for (let i = 0; i < 30 && state && !/Succeeded|Failed/.test(state); i++) { await new Promise((s) => setTimeout(s, 5000)); state = (await arm("GET", path)).body.properties?.provisioningState; }
  log.push({ name, model, version, http: r.status, state, err: r.body.error ? `${r.body.error.code}: ${String(r.body.error.message).slice(0, 200)}` : undefined });
  console.log(name, r.status, state || "", r.body.error?.code || "", String(r.body.error?.message || "").slice(0, 160));
}
writeFileSync(new URL("results/deploy-scout-2026-10-04.json", import.meta.url), JSON.stringify(log, null, 1));
