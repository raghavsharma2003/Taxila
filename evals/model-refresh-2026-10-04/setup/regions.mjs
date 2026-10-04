// Which regions list the candidate models (ARM location /models). Read-only.
import { writeFileSync } from "node:fs";
import { arm, SUB } from "./arm.mjs";
const REGIONS = ["eastus2","eastus","westus","westus3","swedencentral","centralindia","southindia","northcentralus","southcentralus","westeurope","francecentral","uksouth","japaneast","australiaeast","polandcentral","spaincentral"];
const RE = /gpt-6|Kimi|MAI|DeepSeek-V4|grok-4\.[6-9]|grok-5|mistral-medium-3|Mistral-Large|image-2\.5|embed|Embed|transcribe|whisper|GLM|MiniMax|Nemotron|Qwen/i;
const out = {};
for (const r of REGIONS) {
  let u = `/subscriptions/${SUB}/providers/Microsoft.CognitiveServices/locations/${r}/models?api-version=2025-06-01`; const all = [];
  while (u) { const p = await arm("GET", u); if (p.status !== 200) { console.log(r, p.status); break; } all.push(...(p.body.value || [])); u = p.body.nextLink || null; }
  for (const m of all) { if (!RE.test(m.model?.name || "")) continue; const k = `${m.model.format}/${m.model.name}@${m.model.version}`;
    (out[k] ??= { lifecycle: m.model.lifecycleStatus, kinds: new Set(), regions: {} }); out[k].kinds.add(m.kind);
    out[k].regions[r] = [...new Set([...(out[k].regions[r] || []), ...(m.model.skus || []).map((s) => s.name)])]; }
  console.log(r, all.length);
}
for (const v of Object.values(out)) v.kinds = [...v.kinds];
writeFileSync("results/regions-models.json", JSON.stringify(out, null, 1));
for (const [k, v] of Object.entries(out).sort()) console.log(k, v.lifecycle, v.kinds.join("/"), Object.keys(v.regions).length + " regions", v.regions.centralindia ? "CI:" + v.regions.centralindia.join("/") : "", v.regions.eastus2 ? "" : "NOT-eastus2:" + Object.keys(v.regions).join(","));
