// Live Studio probe: streaming model adapters for the Foundry code-capable deployments (measurement only; product
// code lives in server/). Streams so time-to-first-token and the partial-artifact timeline can be measured.
// Key goes only in the api-key header; payloads are never logged.
import fs from "node:fs";

export function loadEnv(file = new URL("../../.env.local", import.meta.url)) {
  for (const l of fs.readFileSync(file, "utf8").split("\n")) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(l.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

// $ per 1M tokens, Azure retail (docs/research/models/MODEL-ROUTER.md §2, read 2026-10-02). cached = cached-input.
export const PRICES = {
  "taxila-codex": { in: 1.75, cached: 0.175, out: 14 },
  "taxila-brain": { in: 4, cached: 0.4, out: 20 },
  "gpt-5.6-terra": { in: 2, cached: 0.2, out: 12 },
  "taxila-kimi-code": { in: 0.95, cached: 0.95, out: 4 },
  "DeepSeek-V4-Pro": { in: 1.74, cached: 1.74, out: 3.48 },
  "DeepSeek-V4-Flash": { in: 0.19, cached: 0.19, out: 0.51 },
  "grok-4.3": { in: 1.25, cached: 1.25, out: 2.5 },
  "taxila-fast": { in: 0.2, cached: 0.02, out: 1.2 },
};

export function usd(deployment, u) {
  const p = PRICES[deployment]; if (!p || !u) return 0;
  return ((u.in - (u.cached || 0)) * p.in + (u.cached || 0) * p.cached + u.out * p.out) / 1e6;
}

const RESPONSES_ONLY = new Set(["taxila-codex"]);
const REASONING = /^(taxila-(fast|brain|codex)|gpt-5)/;

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

/**
 * Stream one generation. Returns { text, chunks: [{t, n}] (cumulative chars at ms since request), ttftMs, ms, usage, error }.
 * effort applies to reasoning-family deployments only.
 */
export async function generate(deployment, system, user, { effort = "low", maxTokens = 16000, timeoutMs = 300_000 } = {}) {
  const base = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "");
  const key = process.env.AZURE_OPENAI_API_KEY;
  const t0 = performance.now();
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), timeoutMs);
  let text = "", ttftMs = null, usage = null, error = null; const chunks = [];
  const push = (d) => { if (!d) return; if (ttftMs === null) ttftMs = Math.round(performance.now() - t0); text += d; chunks.push({ t: Math.round(performance.now() - t0), n: text.length }); };
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
      if (reasoning) body.reasoning_effort = effort;
      res = await fetch(`${base}/chat/completions`, { method: "POST", signal: ctl.signal, headers: { "api-key": key, "content-type": "application/json" }, body: JSON.stringify(body) });
    }
    if (!res.ok) { error = `HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`; }
    else {
      for await (const ev of sse(res)) {
        if (ev.type === "response.output_text.delta") push(ev.delta);
        else if (ev.type === "response.completed") { const u = ev.response?.usage; if (u) usage = { in: u.input_tokens, cached: u.input_tokens_details?.cached_tokens || 0, out: u.output_tokens, reasoning: u.output_tokens_details?.reasoning_tokens || 0 }; }
        else if (ev.type === "response.failed" || ev.type === "error") error = JSON.stringify(ev).slice(0, 300);
        else if (ev.choices) { for (const c of ev.choices) { push(c.delta?.content); if (c.finish_reason === "content_filter") error = "content_filter"; if (c.finish_reason === "length") error = "length"; } }
        if (ev.usage && !ev.type) { const u = ev.usage; usage = { in: u.prompt_tokens, cached: u.prompt_tokens_details?.cached_tokens || 0, out: u.completion_tokens, reasoning: u.completion_tokens_details?.reasoning_tokens || 0 }; }
      }
    }
  } catch (e) { error = e?.name === "AbortError" ? "timeout" : String(e?.message || e).slice(0, 300); }
  finally { clearTimeout(timer); }
  return { text, chunks, ttftMs, ms: Math.round(performance.now() - t0), usage, error };
}

/** Strip a markdown fence if the model wrapped its file in one. Works on partial (streaming) text too. */
export function unfence(s) {
  let t = s.replace(/^\s*```[a-zA-Z]*\s*\n/, "");
  t = t.replace(/\n```\s*$/, "");
  return t;
}
