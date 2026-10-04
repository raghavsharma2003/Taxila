// Model-refresh 2026-10-04, Studio area: streaming adapter for the Foundry deployments (measurement only).
// Same request shape as evals/live-studio/models.mjs, plus: new deployments, a first-REASONING-token time (to tell
// queueing from think time on reasoning-first models), and per-arm max tokens. Key only in the api-key header.
import fs from "node:fs";

export function loadEnv(file = new URL("../../../.env.local", import.meta.url)) {
  for (const l of fs.readFileSync(file, "utf8").split("\n")) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(l.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

// $ per 1M tokens, Azure retail Global Standard eastus2, read 2026-10-04 from
// evals/model-refresh-2026-10-04/setup/results/prices-2026-10-04.json (MODEL-ROUTER §2 for the older ones).
// [U] = no Direct retail meter to read; the number is a stand-in and is flagged in the report.
export const PRICES = {
  "taxila-codex": { in: 1.75, cached: 0.175, out: 14 },
  "taxila-brain": { in: 4, cached: 0.4, out: 20 },
  "gpt-5.6-terra": { in: 2, cached: 0.2, out: 12 },
  "taxila-gpt6": { in: 2, cached: 0.2, out: 10 },            // 6-sol ShortCo Std Gl
  "taxila-gpt61-sol": { in: 2, cached: 0.2, out: 10, u: true }, // [U] no meter; 6-sol price used as stand-in
  "taxila-gpt6-luna": { in: 0.1, cached: 0.01, out: 0.5 },    // 6-luna ShortCo Std Gl
  "taxila-ds41": { in: 0.375, cached: 0.375, out: 1.5, u: true }, // [U] Fireworks list price = upper bound; Direct DS30/DS31 rate unconfirmed
  "DeepSeek-V4-Flash": { in: 0.19, cached: 0.19, out: 0.51 },
  "taxila-ds4f-0731": { in: 0.44, cached: 0.014, out: 1.32 },
  "taxila-kimi-code": { in: 0.95, cached: 0.95, out: 4 },
  "taxila-kimi26": { in: 0.95, cached: 0.16, out: 4 },
  "taxila-mistral-m35": { in: 1.5, cached: 1.5, out: 7.5 },
};

export function usd(deployment, u) {
  const p = PRICES[deployment]; if (!p || !u) return 0;
  return ((u.in - (u.cached || 0)) * p.in + (u.cached || 0) * p.cached + u.out * p.out) / 1e6;
}

const RESPONSES_ONLY = new Set(["taxila-codex"]);
const REASONING = /^(taxila-(fast|brain|codex|gpt6|gpt61)|gpt-5)/;

async function* sse(res) {
  const dec = new TextDecoder(); let buf = "";
  for await (const chunk of res.body) {
    buf += dec.decode(chunk, { stream: true });
    let i;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const block = buf.slice(0, i); buf = buf.slice(i + 2);
      const data = block.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("\n");
      if (!data || data === "[DONE]") continue;
      try { yield JSON.parse(data); } catch { /* keep-alive */ }
    }
  }
}

/** Stream one generation. ttftMs = first visible content token; firstAnyMs = first content OR reasoning token. */
export async function generate(deployment, system, user, { effort = "low", maxTokens = 16000, timeoutMs = 300_000 } = {}) {
  const base = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "");
  const key = process.env.AZURE_OPENAI_API_KEY;
  const t0 = performance.now();
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), timeoutMs);
  let text = "", ttftMs = null, firstAnyMs = null, usage = null, error = null, served = null, reasoningChars = 0; const chunks = [];
  const any = () => { if (firstAnyMs === null) firstAnyMs = Math.round(performance.now() - t0); };
  const push = (d) => { if (!d) return; any(); if (ttftMs === null) ttftMs = Math.round(performance.now() - t0); text += d; chunks.push({ t: Math.round(performance.now() - t0), n: text.length }); };
  try {
    let res;
    if (RESPONSES_ONLY.has(deployment)) {
      res = await fetch(`${base}/responses`, { method: "POST", signal: ctl.signal, headers: { "api-key": key, "content-type": "application/json" },
        body: JSON.stringify({ model: deployment, stream: true, max_output_tokens: maxTokens, reasoning: { effort },
          input: [{ role: "developer", content: system }, { role: "user", content: user }] }) });
    } else {
      const reasoning = REASONING.test(deployment);
      const body = { model: deployment, stream: true, stream_options: { include_usage: true },
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        [reasoning ? "max_completion_tokens" : "max_tokens"]: maxTokens };
      if (reasoning && effort) body.reasoning_effort = effort;
      res = await fetch(`${base}/chat/completions`, { method: "POST", signal: ctl.signal, headers: { "api-key": key, "content-type": "application/json" }, body: JSON.stringify(body) });
    }
    if (!res.ok) { error = `HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`; }
    else {
      for await (const ev of sse(res)) {
        if (ev.model && !served) served = ev.model;
        if (ev.type === "response.output_text.delta") push(ev.delta);
        else if (ev.type && /reasoning/.test(ev.type)) any();
        else if (ev.type === "response.completed") { served = ev.response?.model || served; const u = ev.response?.usage; if (u) usage = { in: u.input_tokens, cached: u.input_tokens_details?.cached_tokens || 0, out: u.output_tokens, reasoning: u.output_tokens_details?.reasoning_tokens || 0 }; if (ev.response?.status === "incomplete") error = "length"; }
        else if (ev.type === "response.failed" || ev.type === "error") error = JSON.stringify(ev).slice(0, 300);
        else if (ev.choices) {
          for (const c of ev.choices) {
            const r = c.delta?.reasoning_content || c.delta?.reasoning;
            if (r) { any(); reasoningChars += r.length; }
            push(c.delta?.content);
            if (c.finish_reason === "content_filter") error = "content_filter";
            if (c.finish_reason === "length") error = "length";
          }
        }
        if (ev.usage && !ev.type) { const u = ev.usage; usage = { in: u.prompt_tokens, cached: u.prompt_tokens_details?.cached_tokens || 0, out: u.completion_tokens, reasoning: u.completion_tokens_details?.reasoning_tokens || 0 }; }
      }
    }
  } catch (e) { error = e?.name === "AbortError" ? "timeout" : String(e?.message || e).slice(0, 300); }
  finally { clearTimeout(timer); }
  return { text, chunks, ttftMs, firstAnyMs, reasoningChars, served, ms: Math.round(performance.now() - t0), usage, error };
}

// unfence: identical to evals/live-studio/models.mjs (comparability with the 2026-10-04 bench).
export { unfence } from "../../live-studio/models.mjs";
