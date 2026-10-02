// Cascade lane, mouth: streaming gpt-4o-mini-tts (PCM 24 kHz s16le mono) and the batch transcription the
// push-to-talk fallback uses. These two calls stream or upload bodies that server/azure.js's JSON `post()`
// cannot carry, so they live here with the same rules: key only in the `api-key` header, every call timed
// and logged (kind, deployment, status, ms) — never the payload, because payloads carry children's words.
import { createHash } from "crypto";
import { DEPLOY, AzureError, endpoint } from "../azure.js";
import { q, one } from "../db.js";

export const PCM_RATE = 24_000;
/** Bytes per second of PCM16 mono at PCM_RATE. */
export const PCM_BPS = PCM_RATE * 2;

function apiKey() {
  const k = process.env.AZURE_OPENAI_API_KEY;
  if (!k) throw new AzureError("AZURE_OPENAI_API_KEY not set");
  return k;
}
const log = (kind, deployment, status, ms, extra = "") => console.info(`[azure] ${kind} ${deployment} ${status} ${ms}ms${extra}`);

// ───────────── delivery style per teacher ─────────────

/**
 * Delivery notes for gpt-4o-mini-tts `instructions`: timbre, accent, pace and register ONLY — no persona,
 * age, family or identity claim (voices-hindi.md §9.4: a voice note that says who she is becomes a human
 * claim), and no line she could say. UNMEASURED BY EAR: the /api/tts lane speaks with no instructions
 * because a voice is chosen blind, so TAXILA_TTS_STYLE=0 turns these off, and STYLE_VERSION is in every
 * cache key so a change never replays old audio.
 */
export const STYLE_VERSION = "s1";
const STYLE = {
  asha: [
    "accent: Indian; Hindi words pronounced natively, English words in an Indian-English accent",
    "register: a calm, kind primary-school teacher speaking to one young child",
    "pace: unhurried, slightly slower than conversation; small pause after a question",
    "tone: warm and steady, never sing-song or theatrical; delight short and light",
    "numbers and maths words: clear and distinct",
  ],
  arjun: [
    "accent: Indian; Hindi words pronounced natively, English words in an Indian-English accent",
    "register: a friendly, relaxed teacher speaking to one older child",
    "pace: conversational, not rushed; small pause after a question",
    "tone: warm, even, a little playful; never theatrical or over-excited",
    "numbers and maths words: clear and distinct",
  ],
};

/** { voice, instructions, version } for a teacher (characters/index.js teacherFor result). */
export function speechStyle(teacher, voice) {
  const off = process.env.TAXILA_TTS_STYLE === "0";
  const notes = STYLE[teacher?.id];
  return { voice, instructions: off || !notes ? "" : notes.join("\n"), version: off ? "none" : STYLE_VERSION };
}

// ───────────── short-phrase cache ─────────────

/** Only short chunks are cached ("Shabash!", "Chalo, ek aur karte hain."): long ones never repeat. */
export const CACHE_MAX_CHARS = 48;
const MEM_MAX = 300;
const mem = new Map(); // key → Buffer (LRU by re-insertion)
/** A cache read must never be slower than the speech it saves (TTS first byte ~280 ms measured). */
const DB_READ_TIMEOUT_MS = 150;

export function cacheKey({ voice, model = DEPLOY.tts, version, text }) {
  const h = createHash("sha256").update([voice, model, version, String(text).trim()].join("\u0000")).digest("hex").slice(0, 32);
  return `tts:${model}:${version}:${voice}:${h}`;
}
export const cacheable = (text) => String(text).trim().length <= CACHE_MAX_CHARS;

/** Swappable for tests (no database). */
export let cacheStore = {
  get: async (key) => {
    const row = await one("select body from asset_cache where key = $1", [key]);
    return row?.body?.pcm ? Buffer.from(row.body.pcm, "base64") : null;
  },
  put: (key, pcm) => q("insert into asset_cache(key, kind, body) values ($1, 'tts', $2) on conflict (key) do nothing",
    [key, { rate: PCM_RATE, pcm: pcm.toString("base64") }]),
};
export const setCacheStore = (s) => { cacheStore = s; mem.clear(); };

export async function cacheGet(key) {
  const hit = mem.get(key);
  if (hit) { mem.delete(key); mem.set(key, hit); return hit; }
  let timer;
  const pcm = await Promise.race([
    cacheStore.get(key).catch(() => null),
    new Promise((r) => { timer = setTimeout(() => r(null), DB_READ_TIMEOUT_MS); }),
  ]);
  clearTimeout(timer);
  if (pcm) memPut(key, pcm);
  return pcm;
}
export function cachePut(key, pcm) {
  memPut(key, pcm);
  void Promise.resolve().then(() => cacheStore.put(key, pcm)).catch((e) => console.warn("[voice] tts cache write failed:", e.message));
}
function memPut(key, pcm) {
  mem.delete(key);
  mem.set(key, pcm);
  while (mem.size > MEM_MAX) mem.delete(mem.keys().next().value);
}

// ───────────── streaming TTS ─────────────

/**
 * One streamed /audio/speech call. Resolves when the response headers arrive, with an async iterator over
 * the PCM body. The caller's `signal` aborts the upstream request (barge-in, client gone).
 * @returns {Promise<{ chunks: AsyncIterable<Uint8Array>, ttfbMs: number }>}
 */
export async function speechStream(text, { voice, instructions, signal, timeoutMs = 15_000 }) {
  const t0 = performance.now();
  const ctl = new AbortController();
  const onAbort = () => ctl.abort();
  signal?.addEventListener("abort", onAbort, { once: true });
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  const body = { model: DEPLOY.tts, input: String(text).slice(0, 4000), voice, response_format: "pcm", stream_format: "audio" };
  if (instructions) body.instructions = instructions;
  let res;
  try {
    res = await fetch(endpoint() + "/audio/speech", {
      method: "POST", headers: { "api-key": apiKey(), "content-type": "application/json" }, body: JSON.stringify(body), signal: ctl.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
    log("tts_stream", DEPLOY.tts, signal?.aborted ? "aborted" : "network", Math.round(performance.now() - t0));
    throw new AzureError(`tts_stream ${DEPLOY.tts} ${signal?.aborted ? "aborted" : `network error: ${e?.message || e}`}`, 0, signal?.aborted ? "aborted" : "network");
  }
  if (!res.ok) {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
    const msg = (await res.text().catch(() => "")).slice(0, 200);
    log("tts_stream", DEPLOY.tts, res.status, Math.round(performance.now() - t0));
    throw new AzureError(`tts_stream ${DEPLOY.tts} HTTP ${res.status}: ${msg}`, res.status);
  }
  const reader = res.body.getReader();
  let first = 0;
  const chunks = {
    async *[Symbol.asyncIterator]() {
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!first) first = performance.now() - t0;
          yield value;
        }
        log("tts_stream", DEPLOY.tts, res.status, Math.round(performance.now() - t0), ` ttfb=${Math.round(first)}`);
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
        reader.cancel().catch(() => {});
      }
    },
  };
  return { chunks, ttfbMs: Math.round(performance.now() - t0) };
}

/**
 * A chunk of speech fetched eagerly into memory, so sentence n+1 is generating while sentence n plays.
 * `next()` yields buffered pieces in order and waits for more until the source ends.
 */
export class Prefetch {
  constructor(start) {
    this.parts = [];
    this.done = false;
    this.error = null;
    this.wake = null;
    this.bytes = 0;
    this.cached = false;
    this.run = (async () => {
      try {
        for await (const p of await start(this)) {
          this.parts.push(Buffer.from(p));
          this.bytes += p.length;
          this.notify();
        }
      } catch (e) {
        this.error = e;
      } finally {
        this.done = true;
        this.notify();
      }
    })();
  }
  notify() { const w = this.wake; this.wake = null; w?.(); }
  async *read() {
    let i = 0;
    for (;;) {
      while (i < this.parts.length) yield this.parts[i++];
      if (this.done) { if (this.error) throw this.error; return; }
      await new Promise((r) => { this.wake = r; });
    }
  }
}

/** Start speaking one chunk: memory/DB cache for short ones, else streamed from Azure (and cached). */
export function speakChunk(text, style, signal) {
  const key = cacheable(text) ? cacheKey({ voice: style.voice, version: style.version, text }) : null;
  return new Prefetch(async (self) => {
    if (key) {
      const pcm = await cacheGet(key);
      if (pcm) { self.cached = true; return [pcm]; }
    }
    const { chunks } = await speechStream(text, { voice: style.voice, instructions: style.instructions, signal });
    if (!key) return chunks;
    return (async function* () {
      const all = [];
      for await (const c of chunks) { all.push(Buffer.from(c)); yield c; }
      if (!signal?.aborted) cachePut(key, Buffer.concat(all));
    })();
  });
}

// ───────────── batch transcription (push-to-talk fallback) ─────────────

/**
 * Recorded audio → text via /audio/transcriptions (multipart). Returns the transcript and the mean token
 * probability (→ asrConfidence), or 0 confidence with "" when the engine returned nothing.
 */
export async function transcribeClip(audio, { mime = "audio/webm", prompt, model = DEPLOY.transcribe, timeoutMs = 20_000 } = {}) {
  const t0 = performance.now();
  const fd = new FormData();
  const ext = mime.includes("ogg") ? "ogg" : mime.includes("wav") ? "wav" : mime.includes("mp4") || mime.includes("m4a") ? "m4a" : "webm";
  fd.append("file", new Blob([audio], { type: mime.split(";")[0] }), `turn.${ext}`);
  fd.append("response_format", "json");
  fd.append("include[]", "logprobs");
  if (prompt) fd.append("prompt", prompt);
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    // The v1 surface answers DeploymentNotFound for transcriptions (probe 2026-10-02); the deployment route works.
    const url = `${endpoint().replace(/\/openai\/v1$/, "")}/openai/deployments/${encodeURIComponent(model)}/audio/transcriptions?api-version=2025-03-01-preview`;
    const res = await fetch(url, { method: "POST", headers: { "api-key": apiKey() }, body: fd, signal: ctl.signal });
    const raw = await res.text();
    log("transcribe", model, res.status, Math.round(performance.now() - t0));
    if (!res.ok) throw new AzureError(`transcribe ${model} HTTP ${res.status}: ${raw.slice(0, 200)}`, res.status);
    const j = JSON.parse(raw);
    const lps = Array.isArray(j.logprobs) ? j.logprobs.map((l) => l?.logprob).filter((v) => typeof v === "number") : [];
    const confidence = lps.length ? Math.exp(lps.reduce((a, b) => a + b, 0) / lps.length) : undefined;
    return { text: String(j.text ?? "").trim(), confidence };
  } catch (e) {
    if (e instanceof AzureError) throw e;
    log("transcribe", model, e?.name === "AbortError" ? "timeout" : "network", Math.round(performance.now() - t0));
    throw new AzureError(`transcribe ${model} ${e?.name === "AbortError" ? "timed out" : `network error: ${e?.message || e}`}`, 0, "network");
  } finally {
    clearTimeout(timer);
  }
}
