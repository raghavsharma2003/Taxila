// Read-only ARM listing: every Cognitive Services account in the subscription, its region and kind, and every
// deployment with model, SKU and capacity. Decides the BUILD-PLAN §10 deployment asks (which twins exist, which
// capacities are 1). Prints no keys. Run: NODE_USE_ENV_PROXY=1 node --env-file=.env.local evals/build-plan/deployments.mjs
import { writeFileSync } from "node:fs";
const { AZURE_TENANT_ID: t, AZURE_SP_CLIENT_ID: c, AZURE_SP_SECRET: s, AZURE_SUBSCRIPTION_ID: sub } = process.env;
const tok = await (await fetch(`https://login.microsoftonline.com/${t}/oauth2/v2.0/token`, {
  method: "POST", body: new URLSearchParams({ grant_type: "client_credentials", client_id: c, client_secret: s,
    scope: "https://management.azure.com/.default" }) })).json();
const H = { authorization: `Bearer ${tok.access_token}` };
const get = async (u) => (await fetch(`https://management.azure.com${u}`, { headers: H })).json();
// The provider listing pages through empty pages; the generic resources filter returns the accounts directly.
const accts = { value: [] };
for (let u = `/subscriptions/${sub}/resources?$filter=${encodeURIComponent("resourceType eq 'Microsoft.CognitiveServices/accounts'")}&api-version=2021-04-01`; u;) {
  const j = await get(u); accts.value.push(...(j.value || [])); u = j.nextLink ? j.nextLink.replace("https://management.azure.com", "") : null;
}
const out = { at: new Date().toISOString(), accounts: [] };
for (const a of accts.value || []) {
  const deps = await get(`${a.id}/deployments?api-version=2024-10-01`);
  out.accounts.push({ name: a.name, kind: a.kind, location: a.location, sku: a.sku?.name,
    deployments: (deps.value || []).map((d) => ({ name: d.name, model: `${d.properties?.model?.name}@${d.properties?.model?.version}`,
      format: d.properties?.model?.format, sku: d.sku?.name, capacity: d.sku?.capacity })) });
}
const f = `evals/build-plan/results/deployments-${out.at.slice(0, 10)}.json`;
writeFileSync(f, JSON.stringify(out, null, 1));
for (const a of out.accounts) {
  console.log(`# ${a.name} (${a.kind}, ${a.location}, ${a.deployments.length} deployments)`);
  for (const d of a.deployments) console.log(`  ${d.name.padEnd(34)} ${d.model.padEnd(40)} ${d.sku} cap=${d.capacity}`);
}
console.log("wrote", f);

// Subscription quota per model in the deployment region: does a twin deployment fit without a quota raise?
const loc = out.accounts.find((a) => a.deployments.length)?.location || "eastus2";
const us = await get(`/subscriptions/${sub}/providers/Microsoft.CognitiveServices/locations/${loc}/usages?api-version=2024-10-01`);
const want = /gpt-5\.6|gpt-6|realtime|flux|image|codex|kimi|grok-4|DeepSeek|tts|transcribe|MAI/i;
out.usages = (us.value || []).filter((u) => want.test(u.name?.value || "") && /GlobalStandard|DataZoneStandard/i.test(u.name?.value || ""))
  .map((u) => ({ name: u.name.value, used: u.currentValue, limit: u.limit }));
writeFileSync(f, JSON.stringify(out, null, 1));
console.log(`# quota in ${loc} (GlobalStandard)`);
for (const u of out.usages) console.log(`  ${u.name.padEnd(60)} used=${u.used} limit=${u.limit}`);
