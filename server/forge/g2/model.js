// The builder's model adapter (FACTORY.md §3.7 ModelAdapter, one provider): Azure OpenAI Responses API for
// `taxila-codex` (gpt-5.3-codex is Responses-only). server/azure.js holds chat completions only and is another
// workstream's file, so this adapter lives here until the main loop folds it in (inbox open item). Same rules as
// azure.js: the key goes only in the api-key header, payloads are never logged, every call is timed.
// Pricing ($/1M tokens, Azure retail, MODEL-ROUTER.md §2, read 2026-10-02); cached input for codex is [U] 10% of
// input (the retail page lists no cached meter for gpt-5.3-codex on Azure).
import { resolveLane } from "../../endpoints.js";
export const PRICING = {
  "taxila-codex": { inPerM: 1.75, cachedInPerM: 0.175, outPerM: 14.0 },
  "taxila-brain": { inPerM: 4.0, cachedInPerM: 0.4, outPerM: 20.0 },
  "taxila-fast": { inPerM: 0.2, cachedInPerM: 0.02, outPerM: 1.2 },
};
/** Azure Container Apps Consumption, per second (prices.azure.com, eastus2; FACTORY.md §2.2 arithmetic). */
export const ACA_PRICE = { vcpuSec: 0.000024, gibSec: 0.000003 };
/** Azure AI Content Safety text, per 1k text records [V retail S0 tier, 2026-10]. */
export const CONTENT_SAFETY_PER_1K = 0.38;

export function usd(deployment, usage) {
  const p = PRICING[deployment] || PRICING["taxila-codex"];
  if (!usage) return 0;
  const inTok = usage.input_tokens ?? usage.prompt_tokens ?? 0;
  const cached = usage.input_tokens_details?.cached_tokens ?? usage.prompt_tokens_details?.cached_tokens ?? 0;
  const out = usage.output_tokens ?? usage.completion_tokens ?? 0;
  return ((inTok - cached) * p.inPerM + cached * p.cachedInPerM + out * p.outPerM) / 1e6;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * One Responses call. Retries 429/5xx/network with jittered backoff × 3 (FACTORY.md §3.10).
 * @returns {Promise<{ id: string, status: string, output: object[], usage: object, ms: number }>}
 */
export async function respond(body, { timeoutMs = 180_000 } = {}) {
  // RESPONSES lane (server/endpoints.js): AZURE_OPENAI_ENDPOINT unless AZURE_OPENAI_ENDPOINT_RESPONSES overrides it
  const { endpoint: base, key } = resolveLane("RESPONSES");
  if (!base || !key) throw new Error("AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_API_KEY not set");
  for (let attempt = 0; ; attempt++) {
    const t0 = performance.now();
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), timeoutMs);
    let status = 0, text = "";
    try {
      const res = await fetch(`${base}/responses`, { method: "POST", signal: ctl.signal, headers: { "api-key": key, "content-type": "application/json" }, body: JSON.stringify(body) });
      status = res.status; text = await res.text();
    } catch (e) { status = 0; text = String(e?.message || e); }
    finally { clearTimeout(timer); }
    const ms = Math.round(performance.now() - t0);
    console.info(`[forge-g2] responses ${body.model} ${status} ${ms}ms${attempt ? " (retry)" : ""}`);
    if (status === 200) { const j = JSON.parse(text); return { id: j.id, status: j.status, output: j.output || [], usage: j.usage || {}, ms }; }
    const retryable = status === 0 || status === 429 || status >= 500;
    if (!retryable || attempt >= 3) {
      let msg = text; try { msg = JSON.parse(text).error?.message || text; } catch { /* raw */ }
      const err = new Error(`responses ${body.model} HTTP ${status}: ${String(msg).slice(0, 300)}`);
      err.status = status; err.code = /content.?filter|ResponsibleAIPolicyViolation/i.test(text) ? "content_filter" : "";
      throw err;
    }
    await sleep(800 * 2 ** attempt + Math.floor(Math.random() * 400));
  }
}
