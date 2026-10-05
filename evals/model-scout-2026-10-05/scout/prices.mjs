// SCOUT 2026-10-05 copy of evals/model-refresh-2026-10-04/setup/prices.mjs.
// SCOUT: output name dated 2026-10-05; SCOUT: retry each page up to 5x (the 10-04 script died on a body-read reset);
// SCOUT: also writes the same filtered shape as results/prices-2026-10-04.json (eastus2/centralindia/southindia + Global).
import { writeFileSync } from "node:fs";
const out = [];
async function get(u) { for (let i = 0; i < 5; i++) { try { const r = await fetch(u); if (r.ok) return await r.json(); } catch (e) { if (i == 4) throw e; } await new Promise(r => setTimeout(r, 1500 * (i + 1))); } throw new Error("page failed"); }
for (const svc of ["Foundry Models", "Foundry Tools", "Cognitive Services", "Azure OpenAI"]) {
  let u = `https://prices.azure.com/api/retail/prices?api-version=2023-01-01-preview&$filter=${encodeURIComponent(`serviceName eq '${svc}'`)}`;
  let n = 0;
  while (u) { const j = await get(u); out.push(...(j.Items || [])); n += (j.Items || []).length; u = j.NextPageLink; }
  console.log(svc, n);
}
const keep = out.filter(i => ["eastus2", "centralindia", "southindia", "global", ""].includes((i.armRegionName || "").toLowerCase()));
writeFileSync("results/prices-2026-10-05.json", JSON.stringify({ source: "prices.azure.com retail API, pulled 2026-10-05, filtered to eastus2/centralindia/southindia/global", n_total_pulled: out.length, items: keep }));
console.log("total", out.length, "kept", keep.length);
