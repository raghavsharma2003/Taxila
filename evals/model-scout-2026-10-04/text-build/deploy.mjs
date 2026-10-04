// Scout text-build 2026-10-04: deploy MAI-Thinking-1 on taxila-ai-southindia (India placement; Direct "MAI Models" meter,
// $2 / $8 per 1M, Preview, retires 2026-11-04). Idempotent; logs ARM status only, never keys.
// Run: NODE_USE_ENV_PROXY=1 node --env-file=../../../.env.local deploy.mjs
import { writeFileSync } from "node:fs";
import { arm, SUB, RG } from "../../model-refresh-2026-10-04/setup/arm.mjs";
const ACCT = `/subscriptions/${SUB}/resourceGroups/${RG}/providers/Microsoft.CognitiveServices/accounts/taxila-ai-southindia`;
const PLAN = [["scout-mai-thinking1", "Microsoft", "MAI-Thinking-1", "2026-06-01", "GlobalStandard", 100]];
const log = [];
for (const [name, format, model, version, sku, cap] of PLAN) {
  const path = `${ACCT}/deployments/${name}?api-version=2025-06-01`;
  const cur = await arm("GET", path);
  if (cur.status === 200 && cur.body.properties?.provisioningState === "Succeeded") { log.push({ name, status: "exists" }); console.log(name, "exists"); continue; }
  const r = await arm("PUT", path, { sku: { name: sku, capacity: cap }, properties: { model: { format, name: model, version } } });
  let state = r.body.properties?.provisioningState;
  for (let i = 0; i < 30 && state && !/Succeeded|Failed/.test(state); i++) { await new Promise((s) => setTimeout(s, 5000)); state = (await arm("GET", path)).body.properties?.provisioningState; }
  log.push({ name, model, version, at: new Date().toISOString(), http: r.status, state, err: r.body.error ? `${r.body.error.code}: ${String(r.body.error.message).slice(0, 200)}` : undefined });
  console.log(name, r.status, state || "", r.body.error?.code || "", String(r.body.error?.message || "").slice(0, 200));
}
writeFileSync(new URL("results/deploy-2026-10-04.json", import.meta.url), JSON.stringify(log, null, 1));
