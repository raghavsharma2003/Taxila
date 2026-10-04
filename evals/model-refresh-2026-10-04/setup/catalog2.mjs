// Foundry catalogue: exact-name lookups for each candidate (public asset-gallery API).
import { writeFileSync } from "node:fs";
const NAMES = ["gpt-6-luna","gpt-6-sol","gpt-6.1-sol","gpt-6-astra","DeepSeek-V4.1-Flash","DeepSeek-V4.1-Pro","FW-DeepSeek-V4.1-Flash","DeepSeek-V4-Flash-0731","DeepSeek-V4-Pro-0813",
 "Kimi-K3","FW-Kimi-K3","Kimi-K2.7","Kimi-K2.7-Code","Kimi-K2.6","MAI-Transcribe-1.5","MAI-Transcribe-2","MAI-Transcribe-2-Streaming","MAI-Code-1.1-Flash","MAI-Code-1","MAI-Voice-2","MAI-Voice-2.1","MAI-Image-2.6",
 "grok-4.6","grok-5","mistral-medium-3-5","gpt-image-2.5-flare","gpt-image-2.5-sunburst","text-embedding-3-large","embed-v-4-0","Cohere-Embed-V5-Pro","Cohere-Embed-V5-Fast","gpt-transcribe","gpt-live-transcribe","gpt-realtime-whisper","gpt-realtime-whisper-2","FW-GLM-5.3","MAI-Cyber-1-Flash"];
const out = {};
for (const n of NAMES) {
  const body = { filters: [{ field: "Name", operator: "eq", values: [n] }], pageSize: 5 };
  const r = await fetch("https://api.catalog.azureml.ms/asset-gallery/v1.0/models", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  const s = (j.summaries || [])[0];
  out[n] = s ? { name: s.name, version: s.version, publisher: s.publisher, license: s.license, azureOffers: s.azureOffers, deploymentOptions: s.deploymentOptions, lifecycle: s.lifecycle,
    skus: (s.deploymentSku || s.deploymentSkus || []), created: s.createdTime, displayName: s.displayName, summary: (s.summary || "").slice(0, 200), raw: s } : null;
  console.log(n.padEnd(28), s ? `${s.publisher} | lic=${s.license} | offers=${(s.azureOffers||[]).join("/")} | ${s.lifecycle} | ${(s.deploymentOptions||[]).join("/")}` : `NOT FOUND (${r.status})`);
}
writeFileSync("results/foundry-catalog-names.json", JSON.stringify(out, null, 1));
