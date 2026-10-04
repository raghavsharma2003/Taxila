// Azure OpenAI (Foundry, OpenAI-compatible v1 surface) — the only module that talks to Azure.
// $AZURE_OPENAI_ENDPOINT already ends in /openai/v1 (per-lane overrides: server/endpoints.js); the deployment name
// goes in `model`; the key goes in the `api-key` header. Every call is timed and logged (kind, deployment, status, ms, tokens) — never the
// key and never the payload, because payloads carry children's words.

import { EndpointConfigError, laneEndpoint, laneKey, realtimeLane } from "./endpoints.js";

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
};

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
async function post(kind, deployment, path, body, { timeoutMs = DEFAULT_TIMEOUT_MS, trace, binary = false, retries = 1, lane = "CHAT" } = {}) {
  for (let attempt = 0; ; attempt++) {
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
 * @param {{ schema?: object, schemaName?: string, maxTokens?: number, effort?: string, timeoutMs?: number, retries?: number, trace?: object[] }} [opts]
 * @returns {Promise<{ text: string, json?: any, finishReason?: string, usage?: object }>}
 */
// OpenAI reasoning-family deployments take max_completion_tokens + reasoning_effort; the Direct-from-Azure open
// models (DeepSeek, Mistral, Grok, Kimi, gpt-oss, Llama) take max_tokens and reject reasoning_effort.
const REASONING_FAMILY = /^(taxila-(fast|brain|codex)|gpt-5|o\d)/i;
export const isReasoningFamily = (deployment) => REASONING_FAMILY.test(deployment);

export async function chat(deployment, messages, opts = {}) {
  const reasoning = isReasoningFamily(deployment);
  const body = { model: deployment, messages, [reasoning ? "max_completion_tokens" : "max_tokens"]: opts.maxTokens ?? 400 };
  if (opts.effort && reasoning) body.reasoning_effort = opts.effort;
  if (opts.schema) {
    body.response_format = { type: "json_schema", json_schema: { name: opts.schemaName || "result", strict: true, schema: opts.schema } };
  }
  const j = await post("chat", deployment, "/chat/completions", body, opts);
  const choice = j?.choices?.[0];
  const text = choice?.message?.content ?? "";
  const finishReason = choice?.finish_reason;
  // A filtered completion is never an answer (empty or partial content): it surfaces as a content_filter error.
  if (finishReason === CONTENT_FILTER) throw new AzureError(`chat ${deployment} completion blocked by the content filter`, 200, CONTENT_FILTER);
  if (!opts.schema) return { text, finishReason, usage: j?.usage };
  if (choice?.message?.refusal) throw new AzureError(`chat ${deployment} refused: ${String(choice.message.refusal).slice(0, 200)}`, 200, "refusal");
  if (finishReason === "length") throw new AzureError(`chat ${deployment} JSON truncated at max tokens`, 200, "truncated");
  try {
    return { text, json: JSON.parse(text), finishReason, usage: j?.usage };
  } catch {
    throw new AzureError(`chat ${deployment} returned invalid JSON`, 200, "bad_json");
  }
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
