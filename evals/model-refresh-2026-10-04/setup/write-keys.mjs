// Append the new accounts' endpoint + key1 to .env.local under new variable names. Never prints a key.
import { readFileSync, appendFileSync } from "node:fs";
import { arm, SUB, RG } from "./arm.mjs";
const ENV = new URL("../../../.env.local", import.meta.url).pathname;
const accts = [["taxila-ai-centralindia", "CENTRALINDIA", "centralindia"], ["taxila-ai-southindia", "SOUTHINDIA", "southindia"]];
let cur = readFileSync(ENV, "utf8"); let add = "\n# model-refresh-2026-10-04 setup: India AIServices accounts (keys only here; names in evals/model-refresh-2026-10-04/setup/ENDPOINTS.md)\n";
for (const [name, tag, region] of accts) {
  const id = `/subscriptions/${SUB}/resourceGroups/${RG}/providers/Microsoft.CognitiveServices/accounts/${name}`;
  const k = await arm("POST", `${id}/listKeys?api-version=2025-06-01`);
  if (!k.body.key1) { console.log(name, "listKeys failed", k.status); continue; }
  const vars = { [`AZURE_AI_${tag}_ENDPOINT`]: `https://${name}.cognitiveservices.azure.com/`, [`AZURE_AI_${tag}_REGION`]: region, [`AZURE_AI_${tag}_KEY`]: k.body.key1 };
  for (const [v, val] of Object.entries(vars)) { if (new RegExp(`^${v}=`, "m").test(cur)) { console.log("exists", v); continue; } add += `${v}=${val}\n`; console.log("added", v); }
}
add += "REFRESH_DEPLOY_GPT6_LUNA=taxila-gpt6-luna\nREFRESH_DEPLOY_GPT61_SOL=taxila-gpt61-sol\nREFRESH_DEPLOY_GPT6_ASTRA=taxila-gpt6-astra\nREFRESH_DEPLOY_DS4F_0731=taxila-ds4f-0731\nREFRESH_DEPLOY_KIMI26=taxila-kimi26\nREFRESH_DEPLOY_MISTRAL_M35=taxila-mistral-m35\nREFRESH_DEPLOY_OCR4=taxila-ocr4\nREFRESH_DEPLOY_IMAGE25_FLARE=taxila-image25-flare\nREFRESH_DEPLOY_IMAGE25_SUNBURST=taxila-image25-sunburst\nREFRESH_DEPLOY_EMBED_3L=taxila-embed-3l\nREFRESH_DEPLOY_COHERE_EMBED4=taxila-cohere-embed4\nREFRESH_DEPLOY_COHERE_EMBED5_PRO_MEASURE=measure-cohere-embed5-pro\nREFRESH_DEPLOY_GPT_TRANSCRIBE=taxila-gpt-transcribe\nREFRESH_DEPLOY_RT_WHISPER=taxila-rt-whisper\nREFRESH_DEPLOY_MAI_TX2_STREAM=taxila-mai-tx2-stream\nREFRESH_DEPLOY_MAI_IMAGE26=taxila-mai-image26\n";
if (!/^REFRESH_DEPLOY_GPT6_LUNA=/m.test(cur)) appendFileSync(ENV, add); else console.log("deploy vars already present");
