// Principal-review probe for llm-game-generation.md (2026-10-02).
// Measures: (A) which deployments exist + their capacity (ARM), (B) whether taxila-opus answers,
// (C) gpt-5.3-codex agent-turn latency, output/reasoning tokens, prompt caching and rate-limit headers
// on a realistic ~10k-token coder prefix. Never prints secrets.
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(new URL("../../../.env.local", import.meta.url), "utf8")
  .split("\n").filter(l => l.includes("=")).map(l => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).trim()]; }));
const base = env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "");
const account = new URL(base).host.split(".")[0];
const out = { date: new Date().toISOString(), account: "<redacted>" };

// A. ARM deployments
try {
  const tok = await fetch(`https://login.microsoftonline.com/${env.AZURE_TENANT_ID}/oauth2/v2.0/token`, {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: env.AZURE_SP_CLIENT_ID, client_secret: env.AZURE_SP_SECRET, scope: "https://management.azure.com/.default" }),
  }).then(r => r.json());
  const list = await fetch(`https://management.azure.com/subscriptions/${env.AZURE_SUBSCRIPTION_ID}/resourceGroups/${env.AZURE_RESOURCE_GROUP}/providers/Microsoft.CognitiveServices/accounts?api-version=2024-10-01`, { headers: { authorization: `Bearer ${tok.access_token}` } }).then(r => r.json());
  const acct = (list.value || []).find(a => a.name.toLowerCase() === account.toLowerCase());
  if (acct) {
    const deps = await fetch(`https://management.azure.com${acct.id}/deployments?api-version=2024-10-01`, { headers: { authorization: `Bearer ${tok.access_token}` } }).then(r => r.json());
    out.deployments = (deps.value || []).map(d => ({ name: d.name, model: `${d.properties?.model?.name}@${d.properties?.model?.version}`, format: d.properties?.model?.format, sku: d.sku?.name, capacity: d.sku?.capacity, state: d.properties?.provisioningState, rateLimits: d.properties?.rateLimits }));
  } else out.deployments = { error: "account not found", n: (list.value || []).length, tokOk: !!tok.access_token, listErr: list.error?.code };
} catch (e) { out.deployments = { error: String(e) }; }

// B. Claude on Foundry
try {
  const t0 = Date.now();
  const r = await fetch(`https://${account}.services.ai.azure.com/anthropic/v1/messages`, {
    method: "POST", headers: { "content-type": "application/json", "x-api-key": env.AZURE_OPENAI_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "taxila-opus", max_tokens: 16, messages: [{ role: "user", content: "Say ok." }] }),
  });
  out.claude = { status: r.status, ms: Date.now() - t0, body: (await r.text()).slice(0, 300) };
} catch (e) { out.claude = { error: String(e) }; }

// C. codex agent turn
const doc = fs.readFileSync(new URL("./llm-game-generation.md", import.meta.url), "utf8").slice(0, 40000);
const sys = `You are the Forge coder. You extend a Phaser 3.90 template by writing hook overrides only.\n\n# KIT API (reference)\n${doc}`;
const task = `Write src/scenes/Level1Scene.ts: a class FractionTrackScene extends BaseTrackScene (import from '../core/BaseTrackScene') that overrides getTrackConfig(): {min:number,max:number,ticks:number}, createEntities(): void (spawn 5 platforms at the fractions 1/4,1/2,3/4,1/3,2/3 on a 0..1 line using this.addPlatformAt(value:number,id:string)), and onLanded(id:string, value:number): void that calls this.reportAnswer({item:id, value:String(value)}). Return only the file.`;
async function turn(label, effort) {
  const t0 = Date.now();
  const r = await fetch(`${base}/responses`, {
    method: "POST", headers: { "content-type": "application/json", "api-key": env.AZURE_OPENAI_API_KEY },
    body: JSON.stringify({ model: env.DEPLOY_CODEX, instructions: sys, input: task, reasoning: { effort }, max_output_tokens: 16000 }),
  });
  const hdr = {}; for (const [k, v] of r.headers) if (/ratelimit|region|x-ms-deployment/i.test(k)) hdr[k] = v;
  const j = await r.json();
  const u = j.usage || {};
  return { label, effort, status: r.status, ms: Date.now() - t0, in: u.input_tokens, cached: u.input_tokens_details?.cached_tokens, out: u.output_tokens, reasoning: u.output_tokens_details?.reasoning_tokens, headers: hdr, err: j.error?.message?.slice(0, 200), sample: (j.output || []).filter(o => o.type === "message").map(o => o.content?.[0]?.text || "").join("").slice(0, 200) };
}
out.codex = [];
for (const [label, effort] of [["cold-medium", "medium"], ["warm-medium", "medium"], ["warm-high", "high"], ["warm-low", "low"]]) {
  try { out.codex.push(await turn(label, effort)); } catch (e) { out.codex.push({ label, error: String(e) }); }
}
fs.writeFileSync(new URL("./llm-game-generation-review-probe-2026-10-02.json", import.meta.url), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
