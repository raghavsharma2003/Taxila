// Probe: how gpt-6 deployments answer production's parameter shapes (server/azure.js chat()). No secrets printed.
const BASE = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""), KEY = process.env.AZURE_OPENAI_API_KEY;
const msgs = [{ role: "system", content: "Reply in at most 10 words." }, { role: "user", content: "Didi 3/4 bada hai ya 2/3?" }];
const out = [];
async function go(label, dep, extra) {
  const t0 = performance.now();
  const r = await fetch(`${BASE}/chat/completions`, { method: "POST", headers: { "api-key": KEY, "content-type": "application/json" }, body: JSON.stringify({ model: dep, messages: msgs, ...extra }) });
  const j = await r.json().catch(() => ({}));
  const row = { label, dep, http: r.status, ms: Math.round(performance.now() - t0), reasoning_tokens: j.usage?.completion_tokens_details?.reasoning_tokens, out: (j.choices?.[0]?.message?.content || "").slice(0, 80), err: j.error ? String(j.error.message).slice(0, 160) : undefined };
  out.push(row); console.log(JSON.stringify(row));
}
for (const dep of ["taxila-gpt6-luna", "taxila-gpt6", "taxila-gpt61-sol"]) {
  await go("prod-shape max_tokens, no effort", dep, { max_tokens: 220 });
  await go("max_completion_tokens, no effort", dep, { max_completion_tokens: 220 });
  await go("max_completion_tokens, effort none", dep, { max_completion_tokens: 220, reasoning_effort: "none" });
}
for (const dep of ["taxila-grok46"]) {
  await go("max_tokens, effort low", dep, { max_tokens: 2000, reasoning_effort: "low" });
  await go("max_tokens no effort", dep, { max_tokens: 2000 });
}
for (const dep of ["taxila-ds41", "taxila-ds4f-0731", "taxila-mistral-m35", "DeepSeek-V4-Flash", "taxila-gpt6-luna", "taxila-grok46"]) {
  await go("strict json_schema", dep, { max_tokens: dep.includes("gpt6") ? undefined : 200, ...(dep.includes("gpt6") ? { max_completion_tokens: 200, reasoning_effort: "none" } : {}), response_format: { type: "json_schema", json_schema: { name: "r", strict: true, schema: { type: "object", additionalProperties: false, required: ["bigger"], properties: { bigger: { type: "string" } } } } } });
}
(await import("node:fs")).writeFileSync("results/probe-params-2026-10-04.json", JSON.stringify(out, null, 1));
