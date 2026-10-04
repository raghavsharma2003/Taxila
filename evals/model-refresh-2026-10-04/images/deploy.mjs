// Model refresh 2026-10-04, images: deploy FLUX.2-flex (Black Forest Labs, v1, GlobalStandard) on the eastus2 account
// for MEASUREMENT. Meter: "Azure BFL Flux Models / Flex Megapixel" $0.05 per MP (same Direct product family as
// taxila-flux2). Idempotent; logs ARM status only, never keys.
// Usage (repo root): node --env-file=.env.local evals/model-refresh-2026-10-04/images/deploy.mjs
import { writeFileSync } from "node:fs";
import { arm, ACCT_ID } from "../setup/arm.mjs";
const PLAN = [["taxila-flux2-flex", "Black Forest Labs", "FLUX.2-flex", "1", "GlobalStandard", +(process.argv[2] || 4)]];
const log = [];
for (const [name, format, model, version, sku, cap] of PLAN) {
  const path = `${ACCT_ID}/deployments/${name}?api-version=2025-06-01`;
  const cur = await arm("GET", path);
  if (cur.status === 200 && cur.body.properties?.provisioningState === "Succeeded") { log.push({ name, status: "exists", cap: cur.body.sku?.capacity }); console.log(name, "exists", cur.body.sku?.capacity); continue; }
  const r = await arm("PUT", path, { sku: { name: sku, capacity: cap }, properties: { model: { format, name: model, version } } });
  let state = r.body.properties?.provisioningState;
  for (let i = 0; i < 40 && state && !/Succeeded|Failed/.test(state); i++) { await new Promise((s) => setTimeout(s, 5000)); state = (await arm("GET", path)).body.properties?.provisioningState; }
  log.push({ name, model, version, sku, cap, http: r.status, state, err: r.body.error ? `${r.body.error.code}: ${String(r.body.error.message).slice(0, 240)}` : undefined });
  console.log(name, r.status, state || "", r.body.error?.code || "", String(r.body.error?.message || "").slice(0, 240));
}
writeFileSync(new URL("results/deploy-2026-10-04.json", import.meta.url), JSON.stringify({ date: "2026-10-04", log }, null, 1));
