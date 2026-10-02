// FACTORY.md synthesis probe (2026-10-02): do the deployments the workflow brief lists actually answer right now?
// The brief says taxila-opus / taxila-sonnet are available; context/decisions.md#azure-only-compute says deleted,
// and llm-game-generation-review-probe (15:33Z) got 404 on taxila-opus. Re-check both Claude names plus a
// codex control call (so a 404 means "no deployment", not "bad key"). Never prints secrets.
// Run: node docs/research/factory/factory-synth-model-probe.mjs
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(new URL("../../../.env.local", import.meta.url), "utf8")
  .split("\n").filter((l) => l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).trim()]; }));
const base = env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "");
const account = new URL(base).host.split(".")[0];
const out = { date: new Date().toISOString(), method: "one minimal request per deployment from the US build container", results: [] };

async function claude(model) {
  const t0 = Date.now();
  try {
    const r = await fetch(`https://${account}.services.ai.azure.com/anthropic/v1/messages`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": env.AZURE_OPENAI_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 8, messages: [{ role: "user", content: "Say ok." }] }),
    });
    const body = await r.text();
    let code = null; try { code = JSON.parse(body)?.error?.code ?? JSON.parse(body)?.type ?? null; } catch {}
    out.results.push({ deployment: model, api: "anthropic/v1/messages", status: r.status, ms: Date.now() - t0, code });
  } catch (e) { out.results.push({ deployment: model, error: String(e).slice(0, 200) }); }
}
async function codex() {
  const t0 = Date.now();
  try {
    const r = await fetch(`${base}/responses`, {
      method: "POST", headers: { "content-type": "application/json", "api-key": env.AZURE_OPENAI_API_KEY },
      body: JSON.stringify({ model: env.DEPLOY_CODEX || "taxila-codex", input: "Say ok.", max_output_tokens: 16, reasoning: { effort: "low" } }),
    });
    const j = await r.json().catch(() => ({}));
    out.results.push({ deployment: env.DEPLOY_CODEX || "taxila-codex", api: "<endpoint>/responses", status: r.status, ms: Date.now() - t0,
      code: j?.error?.code ?? null, tpmLimit: r.headers.get("x-ratelimit-limit-tokens"), rpmLimit: r.headers.get("x-ratelimit-limit-requests") });
  } catch (e) { out.results.push({ deployment: "taxila-codex", error: String(e).slice(0, 200) }); }
}
await claude("taxila-opus");
await claude("taxila-sonnet");
await codex();
fs.writeFileSync(new URL("./factory-synth-model-probe-2026-10-02.json", import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
