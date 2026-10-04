// Azure OpenAI (Foundry, OpenAI-compatible v1 surface) — the only module that talks to Azure.
// $AZURE_OPENAI_ENDPOINT already ends in /openai/v1 (per-lane overrides: server/endpoints.js); the deployment name
// goes in `model`; the key goes in the `api-key` header. Every call is timed and logged (kind, deployment, status, ms, tokens) — never the
// key and never the payload, because payloads carry children's words.

import { EndpointConfigError, laneEndpoint, laneKey, realtimeLane } from "./endpoints.js";
import { admit, settle } from "./lanes.js";

const DEFAULT_TIMEOUT_MS = 20_000;
const RETRY_DELAY_MS = 400;

/** Deployment names, read lazily so env loaded after import (dev server, tests) still applies. */
export const DEPLOY = {
  get realtime() { return process.env.DEPLOY_REALTIME || "taxila-realtime"; },
  get brain() { return process.env.DEPLOY_BRAIN || "taxila-brain"; },
  get fast() { return process.env.DEPLOY_FAST || "taxila-fast"; },
  // Role-based routing (MODEL-ROUTER): each role can move to the bake-off winner without touching call sites.
  get reply() { return process.env.DEPLOY_REPLY || this.fast; },        // live teacher reply (text + cascade lanes)
  get classify() { return process.env.DEPLOY_CLASSIFY || this.fast; },  // answer vs verified key (JSON)
  get transcribe() { return process.env.DEPLOY_TRANSCRIBE || "taxila-transcribe"; },
  get tts() { return process.env.DEPLOY_TTS || "gpt-4o-mini-tts"; },
  // Image lane (ROUTER-CHANGES A4, 2026-10-04): gpt-image-2.5-flare. No server route calls it yet (offline scripts and
  // the future Studio image lane); IMAGE below carries the quality and the fallback order every caller must use.
  get image() { return process.env.DEPLOY_IMAGE || "taxila-image25-flare"; },
};

/**
 * How the image lane is called (model-refresh images, 2026-10-04: flare-low 10/10 diagrams by eye, medium no
 * correctness gain at 2.1-8x the cost, rejected rj-image-medium-quality). quality is ALWAYS "low", never "medium".
 * Fallback: on a 429 (flare is 4 RPM for the whole subscription, image-capacity-pool-2026-10-04) or a filter refusal,
 * gpt-image-2 low; for diagrams where correctness outweighs ~28 s, sunburst low. Labels stay kit-term overlays and
 * keep the human label check (diagram-router-no-baked-labels): no generated pixel carries a curriculum fact.
 */
export const IMAGE = Object.freeze({
  quality: "low",
  fallback: Object.freeze(["taxila-image"]),
  diagramFallback: Object.freeze(["taxila-image", "taxila-image25-sunburst"]),
});

export class AzureError extends Error {
  constructor(message, status = 0, code = "") { super(message); this.status = status; this.code = code; }
}

/**
 * The Azure content filter blocked the request or its completion. Every shape it arrives in:
 * - HTTP 400 with error.code "content_filter" (OpenAI deployments; innererror ResponsibleAIPolicyViolation),
 * - HTTP 400 with choices[0].finish_reason "content_filter" and no top-level error (non-OpenAI Foundry models,
 *   context/rejected.md#router-s-filter-artifact),
 * - HTTP 200 with finish_reason "content_filter" (a filtered completion).
 * On a child's turn a block is itself a distress signal: callers on the safety path fail CLOSED on it.
 */
export const CONTENT_FILTER = "content_filter";
export const isContentFilter = (e) => !!e && (e.code === CONTENT_FILTER || e?.cause?.code === CONTENT_FILTER);
/** Does an Azure error/response body say the content filter fired? Exported for tests. */
export function bodyIsContentFilter(text) {
  let j;
  try { j = typeof text === "string" ? JSON.parse(text) : text; } catch { return /content[_ ]filter|ResponsibleAIPolicyViolation/i.test(String(text)); }
  const e = j?.error ?? {};
  return e.code === CONTENT_FILTER || e.innererror?.code === "ResponsibleAIPolicyViolation" || e.code === "ResponsibleAIPolicyViolation"
    || j?.choices?.some?.((c) => c?.finish_reason === CONTENT_FILTER) || /content management policy|content_filter/i.test(String(e.message ?? ""));
}

/** A config error from server/endpoints.js surfaces as an AzureError, as the old inline env reads did. */
const asAzure = (fn) => { try { return fn(); } catch (e) { throw e instanceof EndpointConfigError ? new AzureError(e.message, 0, "config") : e; } };
/**
 * The v1 base URL (no trailing slash) for a model lane (server/endpoints.js; default CHAT = AZURE_OPENAI_ENDPOINT unless
 * AZURE_OPENAI_ENDPOINT_CHAT overrides it). Not a secret: the browser posts its SDP offer under the realtime one —
 * use realtimeLane(session) for that, so the base matches the account that minted the key.
 */
export function endpoint(lane = "CHAT") { return asAzure(() => laneEndpoint(lane)); }
function apiKey(lane = "CHAT") { return asAzure(() => laneKey(lane)); }
export { realtimeLane };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** Azure error bodies are JSON with a message; keep a short, key-free excerpt for the log/exception. */
function excerpt(text) {
  try { const j = JSON.parse(text); return String(j.error?.message ?? j.message ?? text).slice(0, 300); }
  catch { return String(text).slice(0, 300); }
}

function log(entry, trace) {
  trace?.push(entry);
  const tok = entry.tokens ? ` in=${entry.tokens.in} out=${entry.tokens.out}` : "";
  console.info(`[azure] ${entry.kind} ${entry.deployment} ${entry.status} ${entry.ms}ms${tok}${entry.attempt ? " (retry)" : ""}`);
}

/**
 * POST one JSON body with a timeout that covers the body read, and (by default) exactly one retry on
 * timeout / network error / 429 / 5xx. A 4xx other than 429 is the caller's bug and is not retried.
 * `retries: 0` is for a backup call that must not double the latency of the path it rescues.
 * @returns {Promise<any>} parsed JSON, or a Buffer when `binary`.
 */
async function post(kind, deployment, path, body, { timeoutMs = DEFAULT_TIMEOUT_MS, trace, binary = false, retries = 1, lane = "CHAT", quotaLane } = {}) {
  for (let attempt = 0; ; attempt++) {
    // Quota lanes (server/lanes.js, W2-E): a background call may wait for its bucket; a hot call never waits. The seam is a
    // no-op (admit → undefined) until W2-E fills it. `quotaLane` is separate from `lane`, which selects the endpoint.
    let wait;
    try { wait = admit({ quotaLane, deployment, kind }); } catch (e) { console.warn("[azure] lanes.admit failed:", e?.message); }
    if (wait) await Promise.resolve(wait).catch(() => {});
    const t0 = performance.now();
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    let status = 0, err, out, usage;
    try {
      const res = await fetch(endpoint(lane) + path, {
        method: "POST",
        headers: { "api-key": apiKey(lane), "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: ctl.signal,
      });
      status = res.status;
      if (res.ok) {
        out = binary ? Buffer.from(await res.arrayBuffer()) : await res.json();
        usage = out?.usage;
      } else {
        const body = await res.text();
        err = new AzureError(`${kind} ${deployment} HTTP ${status}: ${excerpt(body)}`, status, bodyIsContentFilter(body) ? CONTENT_FILTER : "");
      }
    } catch (e) {
      err = e?.name === "AbortError"
        ? new AzureError(`${kind} ${deployment} timed out after ${timeoutMs} ms`, 0, "timeout")
        : new AzureError(`${kind} ${deployment} network error: ${e?.message || e}`, 0, "network");
    } finally {
      clearTimeout(timer);
    }
    log({ kind, deployment, status: status || err?.code || "error", ms: Math.round(performance.now() - t0), attempt,
      tokens: usage ? { in: usage.prompt_tokens ?? usage.input_tokens, out: usage.completion_tokens ?? usage.output_tokens } : undefined }, trace);
    try {
      settle({ quotaLane, deployment, kind, status: status || err?.code || "error",
        usage: usage ? { in: usage.prompt_tokens ?? usage.input_tokens, out: usage.completion_tokens ?? usage.output_tokens } : undefined });
    } catch (e) { console.warn("[azure] lanes.settle failed:", e?.message); }
    if (!err) return out;
    const retryable = status === 0 || status === 429 || status >= 500;
    if (attempt >= retries || !retryable) throw err;
    await sleep(RETRY_DELAY_MS);
  }
}

/**
 * Chat completion. With `schema`, structured outputs (strict json_schema) and the parsed object in `.json`.
 * gpt-5.6 deployments are reasoning-family: `max_completion_tokens` counts reasoning tokens too, and
 * `effort` maps to reasoning_effort ("none" | "low" | "medium" | "high"; "minimal" is rejected).
 * @param {string} deployment
 * @param {{ role: "system"|"developer"|"user"|"assistant", content: string }[]} messages
 * @param {{ schema?: object, schemaName?: string, maxTokens?: number, effort?: string, timeoutMs?: number, retries?: number, trace?: object[], quotaLane?: "hot" | "background" }} [opts]
 *   quotaLane: the quota pool this call draws on (server/lanes.js; W2 seam, ignored until W2-E fills the module)
 * @returns {Promise<{ text: string, json?: any, finishReason?: string, usage?: object }>}
 */
// OpenAI reasoning-family deployments take max_completion_tokens + reasoning_effort; the Direct-from-Azure open
// models (DeepSeek, Mistral, Grok, Kimi, gpt-oss, Llama) take max_tokens and reject reasoning_effort.
// gpt-6 deployments are reasoning-family too: before 2026-10-04 they fell through to max_tokens and every call
// returned HTTP 400 "max_tokens is not supported" (classify 40/40 model errors, distress backup failed open 4/10,
// rejected gpt6-reasoning-family-regex-400). `taxila-gpt6` prefix-matches taxila-gpt6-luna and taxila-gpt6-astra.
const REASONING_FAMILY = /^(taxila-(fast|brain|codex|gpt6|gpt61)|gpt-5|gpt-6|o\d)/i;
export const isReasoningFamily = (deployment) => REASONING_FAMILY.test(deployment);
// gpt-6.1-sol and gpt-6-astra have no "none" effort: a "none" request is sent as "low" (ROUTER-CHANGES A1).
const EFFORT_FLOOR = /^(taxila-gpt61-sol|taxila-gpt6-astra|gpt-6\.1|gpt-6-astra)/i;
/** The reasoning_effort actually sent for a deployment (undefined: none sent). Exported for tests. */
export function effortFor(deployment, effort) {
  if (!effort || !isReasoningFamily(deployment)) return undefined;
  return effort === "none" && EFFORT_FLOOR.test(deployment) ? "low" : effort;
}

export async function chat(deployment, messages, opts = {}) {
  const reasoning = isReasoningFamily(deployment);
  const body = { model: deployment, messages, [reasoning ? "max_completion_tokens" : "max_tokens"]: opts.maxTokens ?? 400 };
  const effort = effortFor(deployment, opts.effort);
  if (effort) body.reasoning_effort = effort;
  if (opts.schema) {
    body.response_format = { type: "json_schema", json_schema: { name: opts.schemaName || "result", strict: true, schema: opts.schema } };
  } else if (opts.json) {
    // json_object mode: valid JSON with no schema (compact payloads whose optional keys a strict schema would force)
    body.response_format = { type: "json_object" };
  }
  const j = await post("chat", deployment, "/chat/completions", body, opts);
  const choice = j?.choices?.[0];
  const text = choice?.message?.content ?? "";
  const finishReason = choice?.finish_reason;
  // A filtered completion is never an answer (empty or partial content): it surfaces as a content_filter error.
  if (finishReason === CONTENT_FILTER) throw new AzureError(`chat ${deployment} completion blocked by the content filter`, 200, CONTENT_FILTER);
  if (opts.json && !opts.schema) {
    if (finishReason === "length") throw new AzureError(`chat ${deployment} JSON truncated at max tokens`, 200, "truncated");
    try { return { text, json: JSON.parse(text), finishReason, usage: j?.usage }; }
    catch { throw new AzureError(`chat ${deployment} returned invalid JSON`, 200, "bad_json"); }
  }
  if (!opts.schema) return { text, finishReason, usage: j?.usage };
  if (choice?.message?.refusal) throw new AzureError(`chat ${deployment} refused: ${String(choice.message.refusal).slice(0, 200)}`, 200, "refusal");
  if (finishReason === "length") throw new AzureError(`chat ${deployment} JSON truncated at max tokens`, 200, "truncated");
  try {
    return { text, json: JSON.parse(text), finishReason, usage: j?.usage };
  } catch {
    throw new AzureError(`chat ${deployment} returned invalid JSON`, 200, "bad_json");
  }
}

// ───────────────────────────── streaming (W2-F, LIVE-STUDIO S3) ─────────────────────────────
// Studio builders stream a whole single-file artifact (6-16 k tokens, 20-60 s) so the stream guard can rewrite it at
// token time and the veil can paint it. Same rules as post(): the key only in the api-key header, payloads never
// logged, the quota lane admitted before and settled after. No retry: a builder that fails is the race partner's
// turn (and a retry would double a 40 s call). Cancellation: the caller's AbortSignal (the race loser) and a stall
// watchdog (no bytes for `stallMs`, LIVE-STUDIO §9: 20 s) both abort the socket.

/** $ per 1M tokens, Azure retail Global Standard eastus2 (MODEL-ROUTER §2 / model-refresh prices, read 2026-10-04). */
export const PRICES = Object.freeze({
  "taxila-codex": { in: 1.75, cached: 0.175, out: 14 },
  "taxila-brain": { in: 4, cached: 0.4, out: 20 },
  "gpt-5.6-terra": { in: 2, cached: 0.2, out: 12 },
  "taxila-gpt6": { in: 2, cached: 0.2, out: 10 },
  "taxila-gpt6-luna": { in: 0.1, cached: 0.01, out: 0.5 },
  "taxila-fast": { in: 0.2, cached: 0.02, out: 1.2 },
  "taxila-kimi-code": { in: 0.95, cached: 0.95, out: 4 },
  "DeepSeek-V4-Flash": { in: 0.19, cached: 0.19, out: 0.51 },
  "DeepSeek-V4-Pro": { in: 1.74, cached: 1.74, out: 3.48 },
  "grok-4.3": { in: 1.25, cached: 1.25, out: 2.5 },
});
/** Dollars for one call's usage ({in, cached, out}); an unpriced deployment costs the dearest row (never 0: caps must bite). */
export function usdOf(deployment, u) {
  if (!u) return 0;
  const p = PRICES[deployment] ?? PRICES["taxila-brain"];
  const cached = u.cached || 0;
  return (Math.max(0, (u.in || 0) - cached) * p.in + cached * p.cached + (u.out || 0) * p.out) / 1e6;
}
/** One usage shape from either API ({in, cached, out, reasoning}). Exported for tests. */
export function normUsage(u) {
  if (!u) return null;
  return {
    in: u.prompt_tokens ?? u.input_tokens ?? 0,
    cached: u.prompt_tokens_details?.cached_tokens ?? u.input_tokens_details?.cached_tokens ?? 0,
    out: u.completion_tokens ?? u.output_tokens ?? 0,
    reasoning: u.completion_tokens_details?.reasoning_tokens ?? u.output_tokens_details?.reasoning_tokens ?? 0,
  };
}

/** Server-sent events → parsed JSON objects (keep-alives and [DONE] skipped). Exported for tests. */
export async function* sseEvents(body) {
  const dec = new TextDecoder();
  let buf = "";
  for await (const chunk of body) {
    buf += typeof chunk === "string" ? chunk : dec.decode(chunk, { stream: true });
    let i;
    while ((i = buf.search(/\r?\n\r?\n/)) >= 0) {
      const block = buf.slice(0, i);
      buf = buf.slice(i + (buf[i] === "\r" ? 4 : 2));
      const data = block.split(/\r?\n/).filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("\n");
      if (!data || data === "[DONE]") continue;
      try { yield JSON.parse(data); } catch { /* keep-alive or a partial line */ }
    }
  }
}

/**
 * Stream one generation (chat completions, or the Responses API when `api: "responses"`, e.g. taxila-codex).
 * Never retries. Resolves with what arrived; throws AzureError on an HTTP error, a filter block, a stall, a timeout or
 * a cancel (code "cancelled": the caller's signal fired). `onDelta(text, soFar)` is called per content delta.
 * @param {string} deployment
 * @param {{ role: string, content: string }[]} messages  system/developer first, then user
 * @param {{ api?: "chat" | "responses", effort?: string, maxTokens?: number, timeoutMs?: number, stallMs?: number,
 *   signal?: AbortSignal, onDelta?: (d: string, soFar: string) => void, quotaLane?: "hot" | "background", trace?: object[], kind?: string }} [opts]
 * @returns {Promise<{ text: string, ttftMs: number | null, ms: number, usage: { in: number, cached: number, out: number, reasoning: number } | null, finishReason?: string, usd: number }>}
 */
export async function chatStream(deployment, messages, opts = {}) {
  const { api = "chat", effort, maxTokens = 16_000, timeoutMs = 300_000, stallMs = 20_000, signal, onDelta, quotaLane = "background", trace } = opts;
  const kind = opts.kind ?? (api === "responses" ? "responses_stream" : "chat_stream");
  const lane = api === "responses" ? "RESPONSES" : "CHAT";
  let wait;
  try { wait = admit({ quotaLane, deployment, kind }); } catch (e) { console.warn("[azure] lanes.admit failed:", e?.message); }
  if (wait) await Promise.resolve(wait).catch(() => {});
  const t0 = performance.now();
  const ctl = new AbortController();
  let why = "";
  const abort = (w) => { if (!why) why = w; ctl.abort(); };
  const timer = setTimeout(() => abort("timeout"), timeoutMs);
  let stall = setTimeout(() => abort("stalled"), stallMs);
  const onCancel = () => abort("cancelled");
  if (signal) { if (signal.aborted) abort("cancelled"); else signal.addEventListener("abort", onCancel, { once: true }); }
  let text = "", ttftMs = null, usage = null, finishReason, status = 0, err;
  const reasoning = isReasoningFamily(deployment);
  const eff = effortFor(deployment, effort);
  let body;
  if (api === "responses") {
    const [sys, ...rest] = messages;
    body = { model: deployment, stream: true, max_output_tokens: maxTokens, ...(eff ? { reasoning: { effort: eff } } : {}),
      input: [{ role: "developer", content: sys?.content ?? "" }, ...rest.map((m) => ({ role: m.role, content: m.content }))] };
  } else {
    body = { model: deployment, stream: true, stream_options: { include_usage: true }, messages, [reasoning ? "max_completion_tokens" : "max_tokens"]: maxTokens };
    if (eff) body.reasoning_effort = eff;
  }
  const push = (d) => {
    if (!d) return;
    if (ttftMs === null) ttftMs = Math.round(performance.now() - t0);
    text += d;
    try { onDelta?.(d, text); } catch (e) { console.warn("[azure] onDelta threw:", e?.message); }
  };
  try {
    const res = await fetch(endpoint(lane) + (api === "responses" ? "/responses" : "/chat/completions"), {
      method: "POST", headers: { "api-key": apiKey(lane), "content-type": "application/json" }, body: JSON.stringify(body), signal: ctl.signal,
    });
    status = res.status;
    if (!res.ok) {
      const t = await res.text();
      err = new AzureError(`${kind} ${deployment} HTTP ${status}: ${excerpt(t)}`, status, bodyIsContentFilter(t) ? CONTENT_FILTER : "");
    } else {
      let events = 0;
      for await (const ev of sseEvents(res.body)) {
        events++;
        clearTimeout(stall); stall = setTimeout(() => abort("stalled"), stallMs);
        if (ev.type === "response.output_text.delta") push(ev.delta);
        else if (ev.type === "response.completed" || ev.type === "response.incomplete") {
          usage = normUsage(ev.response?.usage) ?? usage;
          if (ev.response?.status === "incomplete") finishReason = "length";
        } else if (ev.type === "response.failed" || ev.type === "error") {
          err = new AzureError(`${kind} ${deployment} failed: ${excerpt(JSON.stringify(ev.response?.error ?? ev.error ?? ev))}`, 200,
            bodyIsContentFilter(ev.response ?? ev) ? CONTENT_FILTER : "failed");
        } else if (Array.isArray(ev.choices)) {
          for (const c of ev.choices) {
            push(c.delta?.content);
            if (c.finish_reason) finishReason = c.finish_reason;
          }
        }
        if (ev.usage && !ev.type) usage = normUsage(ev.usage);
      }
      if (finishReason === CONTENT_FILTER) err = new AzureError(`${kind} ${deployment} completion blocked by the content filter`, 200, CONTENT_FILTER);
      // a 200 whose stream closed before a single event is a cut connection, not an empty answer
      else if (!events && !err) err = new AzureError(`${kind} ${deployment} stream closed with no events`, 200, "empty_stream");
    }
  } catch (e) {
    err = why ? new AzureError(`${kind} ${deployment} ${why} after ${Math.round(performance.now() - t0)} ms`, 0, why)
      : new AzureError(`${kind} ${deployment} network error: ${e?.message || e}`, 0, "network");
  } finally {
    clearTimeout(timer); clearTimeout(stall);
    signal?.removeEventListener?.("abort", onCancel);
  }
  const ms = Math.round(performance.now() - t0);
  log({ kind, deployment, status: status && !err ? status : err?.code || status || "error", ms, tokens: usage ? { in: usage.in, out: usage.out } : undefined }, trace);
  try { settle({ quotaLane, deployment, kind, status: err ? (err.status || err.code) : status, usage: usage ? { in: usage.in, out: usage.out } : undefined }); }
  catch (e) { console.warn("[azure] lanes.settle failed:", e?.message); }
  if (err) {
    // a cancelled or failed stream is still billed for what it generated: estimate (≈ 4 chars per input token, 3.5 per
    // output token; reasoning tokens unknown) so spend caps never count a cancelled race arm as free
    const est = usage ?? (text || status === 200 ? { in: Math.round(messages.reduce((s, m) => s + String(m.content ?? "").length, 0) / 4), cached: 0,
      out: Math.round(text.length / 3.5), reasoning: 0, estimated: true } : null);
    err.partial = { text, ttftMs, ms, usage: est, usd: usdOf(deployment, est) };
    throw err;
  }
  return { text, ttftMs, ms, usage, finishReason, usd: usdOf(deployment, usage) };
}

/**
 * Mint an ephemeral realtime key for the browser (GA shape: POST /realtime/client_secrets).
 * `session.model` must be the realtime DEPLOYMENT name. The key only has to live until the SDP exchange.
 * @returns {Promise<{ value: string, expires_at: number, session?: object }>}
 */
export async function mintRealtimeSecret(session, { ttlSeconds = 120, trace } = {}) {
  const j = await post("realtime_secret", session.model, "/realtime/client_secrets",
    { expires_after: { anchor: "created_at", seconds: ttlSeconds }, session }, { trace, timeoutMs: 10_000, lane: realtimeLane(session) });
  if (!j?.value) throw new AzureError("realtime client_secrets returned no value", 200, "no_value");
  return j;
}

/** Text → mp3 via /audio/speech (gpt-4o-mini-tts takes free-text `instructions` for delivery). → Buffer */
export async function tts(text, voice, instructions, { trace } = {}) {
  const body = { model: DEPLOY.tts, input: String(text).slice(0, 4000), voice, response_format: "mp3" };
  if (instructions) body.instructions = instructions;
  return post("tts", DEPLOY.tts, "/audio/speech", body, { trace, binary: true, timeoutMs: 30_000, lane: "TTS" });
}
