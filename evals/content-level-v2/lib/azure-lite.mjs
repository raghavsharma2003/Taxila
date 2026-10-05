// Minimal Azure Foundry chat client for offline RS-6 tooling (generation, blind solving, rating).
// Key only in the api-key header; payloads are curriculum items (no child data); never logs keys or bodies.
// Spend is accumulated from returned usage x the retail prices read 2026-10-02 (docs/research/models/MODEL-ROUTER.md §2).
import { appendFileSync, mkdirSync } from "node:fs";

export const PRICES = { // $ per 1M tokens [in, out]
  "taxila-gpt6": [2.0, 10.0], "taxila-brain": [4.0, 20.0], "taxila-fast": [0.2, 1.2],
  "DeepSeek-V4-Pro": [1.74, 3.48], "taxila-ds4f-0731": [0.19, 0.51], "grok-4-20-non-reasoning": [1.25, 2.5],
  "grok-4-1-fast-non-reasoning": [0.2, 0.5],
};
const REASONING = /^(taxila-(fast|brain|codex|gpt6|gpt61)|gpt-5|gpt-6|o\d)/i;
const SPEND_LOG = new URL("../out/spend.jsonl", import.meta.url);

export function env() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/$/, "");
  const key = process.env.AZURE_OPENAI_API_KEY;
  if (!endpoint || !key) throw new Error("AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_API_KEY missing (run with --env-file=.env.local)");
  return { endpoint, key };
}

export function costOf(model, usage) {
  const [pi, po] = PRICES[model] ?? [0, 0];
  return ((usage?.prompt_tokens ?? 0) * pi + (usage?.completion_tokens ?? 0) * po) / 1e6;
}

/** JSON-object chat. Returns { json, usage, cost }. Retries 429/5xx/bad JSON up to 4 times. */
export async function chatJSON(model, system, user, { maxTokens = 6000, effort = "low", tag = "", timeoutMs = 240000 } = {}) {
  const { endpoint, key } = env();
  const reasoning = REASONING.test(model);
  const body = { model, messages: [{ role: "system", content: system }, { role: "user", content: user }],
    response_format: { type: "json_object" }, [reasoning ? "max_completion_tokens" : "max_tokens"]: maxTokens };
  if (reasoning && effort) body.reasoning_effort = effort;
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(`${endpoint}/chat/completions`, { method: "POST", headers: { "content-type": "application/json", "api-key": key },
        body: JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs) });
      if (res.ok) {
        const j = await res.json();
        const usage = j.usage ?? {};
        const cost = costOf(model, usage);
        try { mkdirSync(new URL("../out/", import.meta.url), { recursive: true }); appendFileSync(SPEND_LOG, JSON.stringify({ t: new Date().toISOString(), model, tag, in: usage.prompt_tokens ?? 0, out: usage.completion_tokens ?? 0, cost }) + "\n"); } catch {}
        let text = j.choices?.[0]?.message?.content ?? "";
        text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
        try { return { json: JSON.parse(text), usage, cost }; } catch { lastErr = new Error(`bad JSON from ${model} (finish ${j.choices?.[0]?.finish_reason})`); }
      } else {
        lastErr = new Error(`HTTP ${res.status} from ${model}: ${(await res.text()).slice(0, 160)}`);
        if (res.status !== 429 && res.status < 500) throw lastErr;
      }
    } catch (e) { lastErr = e; if (/HTTP 4(0[0-9]|1[0-9])/.test(e.message) && !/429/.test(e.message)) throw e; }
    await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
  }
  throw lastErr;
}

/** Run async fn over items with bounded concurrency. */
export async function pool(items, conc, fn) {
  let next = 0; const out = new Array(items.length);
  await Promise.all(Array.from({ length: Math.min(conc, items.length) }, async () => {
    while (next < items.length) { const i = next++; try { out[i] = await fn(items[i], i); } catch (e) { out[i] = { error: e.message }; } }
  }));
  return out;
}
