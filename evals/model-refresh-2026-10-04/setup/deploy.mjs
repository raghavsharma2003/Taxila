// Create the candidate deployments on the Foundry account (eastus2), GlobalStandard, capacity within free quota.
// Idempotent: skips names that already exist and succeeded. Records every ARM response (no keys) to results/deploy-log.json.
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { arm, ACCT_ID, SUB, RG } from "./arm.mjs";
const LOG = "results/deploy-log.json";
const log = existsSync(LOG) ? JSON.parse(readFileSync(LOG, "utf8")) : [];
export const PLAN = [
  // [deployment, format, model, version, sku, capacity, label]
  ["taxila-gpt6-luna", "OpenAI", "gpt-6-luna", "2026-09-22", "GlobalStandard", 500, "direct"],
  ["taxila-gpt61-sol", "OpenAI", "gpt-6.1-sol", "2026-09-29", "GlobalStandard", 500, "direct"],
  ["taxila-gpt6-astra", "OpenAI", "gpt-6-astra", "2026-09-03", "GlobalStandard", 100, "direct"],
  ["taxila-ds4f-0731", "DeepSeek", "DeepSeek-V4-Flash-0731", "2026-07-31", "GlobalStandard", 125, "direct"],
  ["taxila-kimi26", "MoonshotAI", "Kimi-K2.6", "2026-04-20", "GlobalStandard", 100, "direct"],
  ["taxila-mistral-m35", "Mistral AI", "mistral-medium-3-5", "1", "GlobalStandard", 200, "direct"],
  ["taxila-ocr4", "Mistral AI", "mistral-ocr-4-0", "1", "GlobalStandard", 30, "direct"],
  ["taxila-image25-flare", "OpenAI", "gpt-image-2.5-flare", "2026-09-08", "GlobalStandard", 2, "direct"],
  ["taxila-image25-sunburst", "OpenAI", "gpt-image-2.5-sunburst", "2026-09-08", "GlobalStandard", 2, "direct"],
  ["taxila-embed-3l", "OpenAI", "text-embedding-3-large", "1", "GlobalStandard", 500, "direct"],
  ["taxila-cohere-embed4", "Cohere", "embed-v-4-0", "1", "GlobalStandard", 50, "direct"],
  ["measure-cohere-embed5-pro", "Cohere", "Cohere-Embed-V5-Pro", "1", "GlobalStandard", 50, "MEASUREMENT ONLY (no retail meter)"],
  ["taxila-gpt-transcribe", "OpenAI", "gpt-transcribe", "2026-07-28", "GlobalStandard", 10, "direct"],
  ["taxila-rt-whisper", "OpenAI", "gpt-realtime-whisper", "2026-05-06", "GlobalStandard", 10, "direct"],
  ["taxila-mai-code", "Microsoft", "mai-code-1.1-flash", "2026-09-15", "GlobalStandard", 100, "direct"],
  ["measure-fw-kimi-k3", "Fireworks", "FW-Kimi-K3", "1", "GlobalStandard", 100, "MEASUREMENT ONLY (Fireworks meter)"],
];
const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
const acctId = process.env.ACCT_ID_OVERRIDE || ACCT_ID;
const plan = process.env.PLAN_JSON ? JSON.parse(process.env.PLAN_JSON) : PLAN;
for (const [name, format, model, version, sku, cap, label] of plan) {
  if (only && !only.test(name)) continue;
  const cur = await arm("GET", `${acctId}/deployments/${name}?api-version=2025-06-01`);
  if (cur.status === 200 && cur.body.properties?.provisioningState === "Succeeded") { console.log("exists", name); continue; }
  const body = { sku: { name: sku, capacity: cap }, properties: { model: { format, name: model, version }, versionUpgradeOption: "NoAutoUpgrade", raiPolicyName: "Microsoft.DefaultV2" } };
  let r = await arm("PUT", `${acctId}/deployments/${name}?api-version=2025-06-01`, body);
  if (r.status >= 400 && /modelProviderData/i.test(JSON.stringify(r.body))) {
    body.properties.modelProviderData = { industry: "Education", organizationName: "Taxila", countryCode: "IN" };
    r = await arm("PUT", `${acctId}/deployments/${name}?api-version=2025-10-01-preview`, body);
  }
  let state = r.body.properties?.provisioningState; const err = r.status >= 400 ? (r.body.error?.code + ": " + r.body.error?.message) : null;
  for (let i = 0; i < 40 && r.status < 400 && state && !/Succeeded|Failed|Canceled/.test(state); i++) {
    await new Promise((s) => setTimeout(s, 6000));
    const g = await arm("GET", `${acctId}/deployments/${name}?api-version=2025-06-01`); state = g.body.properties?.provisioningState;
  }
  const rec = { at: new Date().toISOString(), account: acctId.split("/").pop(), name, format, model, version, sku, cap, label, http: r.status, state, err };
  log.push(rec); writeFileSync(LOG, JSON.stringify(log, null, 1));
  console.log(name.padEnd(28), r.status, state || "", err ? err.slice(0, 300) : "");
}
