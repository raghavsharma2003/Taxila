// Azure Speech streaming TTS (HUMAN-VOICE B1, BUILD-PLAN W2-G #2): one SSML document → raw PCM s16le 24 kHz mono,
// streamed as it is synthesised, so the first audio waits only on the engine's first byte (DragonHD p50 ~228 ms from the
// US sandbox, n=20; HUMAN-VOICE §4.4). The same contract as speech.js speechStream (resolves at the response headers
// with an async iterator over the PCM body) so the prefetch pipeline does not care which engine speaks.
// Rules: the key goes only in the Ocp-Apim-Subscription-Key header; every call is logged with kind, voice, status and
// ms, never the payload (it carries a child's lesson text). The caller's signal aborts the upstream request.
import { AzureError } from "../azure.js";
import { speechConfig } from "../endpoints.js";

export const DHD_PCM_FORMAT = "raw-24khz-16bit-mono-pcm";
export const DHD_MP3_FORMAT = "audio-24khz-48kbitrate-mono-mp3";
/** SSML documents are capped well under the service's limit; a reply is a few sentences. */
export const MAX_SSML_CHARS = 6000;

const log = (kind, voice, status, ms, extra = "") => console.info(`[azure] ${kind} ${voice} ${status} ${ms}ms${extra}`);

/** The Speech config, as an AzureError when unset (the caller falls back to gpt-4o-mini-tts). */
export function dhdConfig(env = process.env) {
  const c = speechConfig(env);
  if (!c) throw new AzureError("azure speech not configured (AZURE_SPEECH_REGION / AZURE_SPEECH_KEY)", 0, "config");
  return c;
}

/** The voice name inside an SSML document (for logs only). */
const voiceOf = (ssml) => /<voice\s+name="([^"]+)"/.exec(ssml)?.[1] ?? "?";

/**
 * One streamed synthesis. `format` is the X-Microsoft-OutputFormat (raw PCM by default).
 * @param {string} ssml a complete <speak> document (server/voice/expressive/compile/dhd.js)
 * @param {{ signal?: AbortSignal, timeoutMs?: number, headerTimeoutMs?: number, format?: string, env?: NodeJS.ProcessEnv }} [o]
 * @returns {Promise<{ chunks: AsyncIterable<Uint8Array>, ttfbMs: number }>}
 */
/**
 * No response headers within this long → give up, so the caller can fall back to gpt-4o-mini-tts. First byte p90 is
 * ~300 ms warm; a cold TLS connection through a proxy measured > 2.5 s from the US sandbox, so the bar is 4 s
 * (TAXILA_DHD_HEADER_MS overrides): a fallback is an identity change and must not fire on a cold socket.
 */
export const HEADER_TIMEOUT_MS = 4000;
const headerMs = () => Number(process.env.TAXILA_DHD_HEADER_MS) > 0 ? Number(process.env.TAXILA_DHD_HEADER_MS) : HEADER_TIMEOUT_MS;

export async function dhdStream(ssml, { signal, timeoutMs = 15_000, headerTimeoutMs = headerMs(), format = DHD_PCM_FORMAT, env = process.env } = {}) {
  const t0 = performance.now();
  const voice = voiceOf(ssml);
  if (signal?.aborted) throw new AzureError(`dhd_stream ${voice} aborted`, 0, "aborted");
  if (String(ssml).length > MAX_SSML_CHARS) throw new AzureError(`dhd_stream ssml too long (${String(ssml).length})`, 0, "too_long");
  const { ttsBase, key } = dhdConfig(env);
  const ctl = new AbortController();
  const onAbort = () => ctl.abort();
  signal?.addEventListener("abort", onAbort, { once: true });
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  let headerLate = false;
  const headerTimer = setTimeout(() => { headerLate = true; ctl.abort(); }, headerTimeoutMs);
  const cleanup = () => { clearTimeout(timer); clearTimeout(headerTimer); signal?.removeEventListener("abort", onAbort); };
  let res;
  try {
    res = await fetch(`${ttsBase}/cognitiveservices/v1`, {
      method: "POST",
      headers: { "Ocp-Apim-Subscription-Key": key, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": format, "User-Agent": "taxila" },
      body: ssml,
      signal: ctl.signal,
    });
    clearTimeout(headerTimer);
  } catch (e) {
    cleanup();
    const why = signal?.aborted ? "aborted" : headerLate ? "timeout" : "network";
    log("dhd_stream", voice, why, Math.round(performance.now() - t0));
    throw new AzureError(`dhd_stream ${voice} ${why === "aborted" ? "aborted" : why === "timeout" ? `no headers in ${headerTimeoutMs} ms` : `network error: ${e?.message || e}`}`, 0, why);
  }
  if (!res.ok) {
    cleanup();
    const msg = (await res.text().catch(() => "")).slice(0, 200);
    log("dhd_stream", voice, res.status, Math.round(performance.now() - t0));
    throw new AzureError(`dhd_stream ${voice} HTTP ${res.status}: ${msg}`, res.status);
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
        log("dhd_stream", voice, res.status, Math.round(performance.now() - t0), ` ttfb=${Math.round(first)}`);
      } finally {
        cleanup();
        reader.cancel().catch(() => {});
      }
    },
  };
  return { chunks, ttfbMs: Math.round(performance.now() - t0) };
}

/** Whole-clip synthesis (the text lane's "Hear" replay: audio/mpeg). → Buffer */
export async function dhdClip(ssml, { format = DHD_MP3_FORMAT, signal, timeoutMs = 30_000, env } = {}) {
  const { chunks } = await dhdStream(ssml, { format, signal, timeoutMs, env });
  const all = [];
  for await (const c of chunks) all.push(Buffer.from(c));
  return Buffer.concat(all);
}
