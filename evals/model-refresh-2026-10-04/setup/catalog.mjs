// Foundry catalogue search (public asset-gallery API). Saves raw summaries for candidate names.
import { writeFileSync } from "node:fs";
const Q = ["Kimi","MAI","DeepSeek","grok","mistral","gpt-6","embed","transcribe"];
const out = {};
for (const q of Q) {
  const body = { filters: [{ field: "Labels", operator: "eq", values: ["latest"] }], freeTextSearch: q, pageSize: 100 };
  const r = await fetch("https://api.catalog.azureml.ms/asset-gallery/v1.0/models", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (r.status !== 200) { console.log(q, r.status, JSON.stringify(j).slice(0, 300)); continue; }
  out[q] = j.summaries || [];
  console.log(q, out[q].length);
  for (const s of out[q]) console.log("  ", s.name, "|", s.publisher, "|", (s.azureOffers || []).join("/"), "|", s.license, "|", s.lifecycle || "", "|", (s.deploymentOptions||[]).join?.("/") || "", "|", (s.createdTime||"").slice(0,10));
}
writeFileSync("results/foundry-catalog.json", JSON.stringify(out, null, 1));
