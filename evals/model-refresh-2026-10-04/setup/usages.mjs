import { arm, SUB } from "./arm.mjs";
const loc = process.argv[2] || "eastus2";
const us = await arm("GET", `/subscriptions/${SUB}/providers/Microsoft.CognitiveServices/locations/${loc}/usages?api-version=2025-06-01`);
const re = new RegExp(process.argv[3] || "gpt-6|image-2\\.5|embedding-3-large|transcribe|whisper|DeepSeek|Kimi|MAI|mai|mistral|Mistral|embed|Embed|Fireworks|FW", "i");
for (const u of us.body.value || []) if (re.test(u.name?.value || "")) console.log(`${u.name.value.padEnd(70)} used=${u.currentValue} limit=${u.limit}`);
