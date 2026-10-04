// Pull Azure retail prices for Foundry Models (all regions) and save. Public API, no auth.
import { writeFileSync } from "node:fs";
const out = [];
for (const svc of ["Foundry Models", "Foundry Tools", "Cognitive Services", "Azure OpenAI"]) {
  let u = `https://prices.azure.com/api/retail/prices?api-version=2023-01-01-preview&$filter=${encodeURIComponent(`serviceName eq '${svc}'`)}`;
  let n = 0;
  while (u) { const j = await (await fetch(u)).json(); out.push(...(j.Items || [])); n += (j.Items || []).length; u = j.NextPageLink; }
  console.log(svc, n);
}
writeFileSync("results/prices-2026-10-04.json", JSON.stringify(out));
console.log("total", out.length);
