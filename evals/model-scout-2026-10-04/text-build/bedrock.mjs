// Scout text-build 2026-10-04: dependency-free Bedrock ConverseStream adapter (SigV4 + AWS event-stream decoding) so the
// Azure harnesses (bench-mai.mjs, studio-run.mjs) can run Bedrock arms with the SAME prompts, items and scoring, and
// with a real TTFT (first visible text delta). Reads AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY from the environment;
// never prints them. Validated 2026-10-04 only up to the account quota: a correctly signed call returns
// ThrottlingException "Too many tokens per day" (per-model quota 0), not a signature error. No Bedrock reply has been
// parsed yet, so the delta/usage parsing is written to the Converse API docs and is UNVERIFIED on a live stream.
import { createHmac, createHash } from "node:crypto";
import { readFileSync } from "node:fs";
// Credentials come from .env.local ONLY: the container shell exports 14-char placeholder AWS_* values that a
// "do not override" env loader would keep (found 2026-10-04: 403 "security token invalid"); file values are '-quoted.
let CREDS;
const creds = () => CREDS ??= Object.fromEntries(readFileSync(new URL("../../../.env.local", import.meta.url), "utf8").split("\n")
  .map((l) => l.match(/^(AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2].trim().replace(/^(["'])(.*)\1$/, "$2")]));

const hmac = (k, s) => createHmac("sha256", k).update(s).digest();
const sha = (s) => createHash("sha256").update(s).digest("hex");
const enc = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());

function sign({ region, path, body }) {
  const host = `bedrock-runtime.${region}.amazonaws.com`;
  const now = new Date(); const amz = now.toISOString().replace(/[:-]|\.\d{3}/g, ""); const day = amz.slice(0, 8);
  // non-S3 services: canonical URI = each segment URI-encoded twice (the request line carries it encoded once)
  const reqPath = path.split("/").map((seg) => enc(seg)).join("/");
  const canonPath = path.split("/").map((seg) => enc(enc(seg))).join("/");
  const headers = { "content-type": "application/json", host, "x-amz-date": amz };
  const signed = Object.keys(headers).sort().join(";");
  const canon = ["POST", canonPath, "", Object.keys(headers).sort().map((h) => `${h}:${headers[h]}\n`).join(""), signed, sha(body)].join("\n");
  const scope = `${day}/${region}/bedrock/aws4_request`;
  const sts = ["AWS4-HMAC-SHA256", amz, scope, sha(canon)].join("\n");
  const kS = hmac(hmac(hmac(hmac("AWS4" + creds().AWS_SECRET_ACCESS_KEY, day), region), "bedrock"), "aws4_request");
  const sig = createHmac("sha256", kS).update(sts).digest("hex");
  return { url: `https://${host}${reqPath}`, headers: { ...headers, authorization: `AWS4-HMAC-SHA256 Credential=${creds().AWS_ACCESS_KEY_ID}/${scope}, SignedHeaders=${signed}, Signature=${sig}` } };
}

// AWS event-stream frames: [total u32][headers u32][prelude crc u32][headers][payload][crc u32]
function* frames(buf) {
  let o = 0;
  while (buf.length - o >= 12) {
    const total = buf.readUInt32BE(o), hlen = buf.readUInt32BE(o + 4);
    if (buf.length - o < total) break;
    let h = o + 12; const he = h + hlen; const hdr = {};
    while (h < he) { const nl = buf[h]; const name = buf.toString("utf8", h + 1, h + 1 + nl); h += 1 + nl; const t = buf[h]; h += 1;
      if (t === 7) { const l = buf.readUInt16BE(h); hdr[name] = buf.toString("utf8", h + 2, h + 2 + l); h += 2 + l; } else break; }
    yield { hdr, payload: buf.subarray(he, o + total - 4), size: total };
    o += total;
  }
  return o;
}

/** One ConverseStream call. messages: OpenAI-style [{role, content:string}]; a "system" role becomes Converse system.
 *  Returns the bench's call() shape: { text, ttft, ms, usage:{prompt_tokens, completion_tokens, total_tokens}, finish, served, err }. */
export async function converse(region, modelId, messages, { maxTokens = 400, timeoutMs = 90000, chunks = null } = {}) {
  const t0 = performance.now();
  const system = messages.filter((m) => m.role === "system").map((m) => ({ text: m.content }));
  const msgs = messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role, content: [{ text: m.content }] }));
  const body = JSON.stringify({ ...(system.length ? { system } : {}), messages: msgs, inferenceConfig: { maxTokens } });
  const { url, headers } = sign({ region, path: `/model/${modelId}/converse-stream`, body });
  let text = "", ttft = null, usage, finish, err;
  try {
    const r = await fetch(url, { method: "POST", headers, body, signal: AbortSignal.timeout(timeoutMs) });
    if (!r.ok) { const t = await r.text(); return { text: "", ms: Math.round(performance.now() - t0), err: `http ${r.status} ${t.slice(0, 200)}` }; }
    let buf = Buffer.alloc(0);
    for await (const chunk of r.body) {
      buf = Buffer.concat([buf, Buffer.from(chunk)]);
      let used = 0;
      for (const f of frames(buf)) {
        used += f.size;
        let p = {}; try { p = JSON.parse(f.payload.toString("utf8") || "{}"); } catch {}
        const ev = f.hdr[":event-type"] || f.hdr[":exception-type"];
        if (f.hdr[":message-type"] === "exception") err = `${ev}: ${p.message || ""}`.slice(0, 200);
        else if (ev === "contentBlockDelta" && p.delta?.text) { if (ttft == null && p.delta.text.trim()) ttft = Math.round(performance.now() - t0); text += p.delta.text; chunks?.push({ t: Math.round(performance.now() - t0), n: text.length }); }
        else if (ev === "messageStop") finish = p.stopReason;
        else if (ev === "metadata" && p.usage) usage = { prompt_tokens: p.usage.inputTokens, completion_tokens: p.usage.outputTokens, total_tokens: p.usage.totalTokens };
      }
      buf = buf.subarray(used);
    }
  } catch (e) { err = String(e.message || e).slice(0, 200); }
  return { text, ttft, ms: Math.round(performance.now() - t0), usage, finish, served: modelId, err, filtered: finish === "guardrail_intervened" || finish === "content_filtered" };
}

// Arms the scout ranked promising; ids as Bedrock lists them in each region (scout/results/bedrock-list.json).
export const BR_ARMS = {
  "br:nova-2-lite": ["ap-south-1", "global.amazon.nova-2-lite-v1:0"],
  "br:nova-pro": ["ap-south-1", "apac.amazon.nova-pro-v1:0"],
  "br:deepseek-v3.2": ["ap-south-1", "deepseek.v3.2"],
  "br:mistral-large-3": ["ap-south-1", "mistral.mistral-large-3-675b-instruct"],
  "br:qwen3-next-80b": ["ap-south-1", "qwen.qwen3-next-80b-a3b"],
  "br:glm-5": ["ap-south-1", "zai.glm-5"],
  "br:minimax-m2.5": ["ap-south-1", "minimax.minimax-m2.5"],
  "br:kimi-k3": ["ap-south-1", "global.moonshotai.kimi-k3"],
  "br:grok-4.7": ["ap-south-1", "global.xai.grok-4.7"],
  "br:llama4-maverick": ["us-east-1", "us.meta.llama4-maverick-17b-instruct-v1:0"],
  "br:qwen3-coder-next": ["us-east-1", "qwen.qwen3-coder-next"],
  "br:gpt-oss-safeguard-120b": ["ap-south-1", "openai.gpt-oss-safeguard-120b"],
};
// $ per 1M (in, out), Bedrock on-demand list (scout/results/bedrock-prices-aps1.json; [U] where the scout found none).
export const BR_PRICE = {
  "br:nova-2-lite": [0.35, 2.95], "br:mistral-large-3": [0.59, 1.76], "br:qwen3-next-80b": [0.18, 1.41], "br:minimax-m2.5": [0.36, 1.44],
  "br:kimi-k3": [3.3, 16.5], "br:grok-4.7": [2.2, 6.6], "br:gpt-oss-safeguard-120b": [0.18, 0.71],  // scout SCOUT-2026-10-04.md list prices
  "br:nova-pro": [2, 10], "br:deepseek-v3.2": [2, 10], "br:glm-5": [2, 10], "br:llama4-maverick": [2, 10], "br:qwen3-coder-next": [2, 10], // [U] no meter found: upper-bound stand-in
};
// Arms that reason before answering: max-token floor like the bench's BIG_REASONERS.
export const BR_REASONERS = new Set(["br:kimi-k3", "br:glm-5", "br:minimax-m2.5", "br:gpt-oss-safeguard-120b", "br:qwen3-next-80b"]);

if (import.meta.url === `file://${process.argv[1]}`) { // self-test: node bedrock.mjs  (one 5-token call per arm)
  const out = [];
  for (const [arm, [region, id]] of Object.entries(BR_ARMS)) {
    const r = await converse(region, id, [{ role: "user", content: "say hi" }], { maxTokens: 5, timeoutMs: 30000 });
    out.push({ arm, region, id, ok: !!r.text, ttft: r.ttft, err: r.err }); console.log(arm, r.text ? `OK ttft ${r.ttft}` : r.err);
  }
  const { writeFileSync } = await import("node:fs");
  writeFileSync(new URL("results/bedrock-selftest-2026-10-04.json", import.meta.url), JSON.stringify({ at: new Date().toISOString(), out }, null, 1));
}
