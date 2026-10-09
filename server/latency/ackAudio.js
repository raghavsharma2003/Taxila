// Round 3, stream relational-human: the acknowledgement's AUDIO. The phrase the ack plan chose (the child's own answer
// token, + one kit word: "chhe faces") in the lesson's own voice (styleForChild: DragonHD Diya / the character's
// gpt-4o-mini-tts voice), rendered exactly like the uptake prelude (expressive/render.js preludeRender: calm, neutral
// pitch, base rate, no marker but [calm]) and trimmed at both edges.
//
// Verdict-neutral BY CONSTRUCTION: the clip is a function of (voice render, phrase) only, cached in process memory by that
// key (never asset_cache: it is a child's words), so a right and a wrong answer with the same words get the SAME bytes.
// It is started speculatively the moment the phrase is known from the words (before classify returns: the TTS first byte
// is ~0.2-0.9 s, classify ~0.7 s), and thrown away if the ack is refused — no audio of a refused ack ever leaves the server.
import { createHash } from "node:crypto";
import { speakChunk, PCM_RATE } from "../voice/speech.js";
import { preludeRender } from "../voice/expressive/render.js";
import { edgeTrim } from "../voice/expressive/pauses.js";

const MAX = 200;
/** key → { at, p: Promise<Buffer|null> } (LRU by insertion) */
const cache = new Map();
/** The longest ack clip the device is given (a token + one word is ~0.5-0.9 s; anything longer is not an echo). */
export const ACK_MAX_MS = 1600;

const keyOf = (render, phrase) => createHash("sha256").update(JSON.stringify([render, phrase])).digest("hex").slice(0, 32);

/**
 * The PCM (s16le mono PCM_RATE) of `phrase` in this style, or null when the voice is unavailable. Never throws.
 * @param {string} phrase
 * @param {any} style speechStyle / styleForChild result
 * @param {{ speak?: typeof speakChunk, timeoutMs?: number }} [deps]
 * @returns {Promise<Buffer | null>}
 */
export function ackAudio(phrase, style, deps = {}) {
  const text = String(phrase ?? "").trim();
  if (!text || !style) return Promise.resolve(null);
  const render = preludeRender(text, style);
  if (!render) return Promise.resolve(null);
  const key = keyOf(render, text);
  const hit = cache.get(key);
  if (hit) { cache.delete(key); cache.set(key, hit); return hit.p; }
  const speak = deps.speak ?? speakChunk;
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), deps.timeoutMs ?? 4000);
  timer.unref?.();
  const p = (async () => {
    try {
      const job = speak(text, style, abort.signal, render);
      const parts = [];
      for await (const c of edgeTrim(job.read(), { lead: true, tail: true })) parts.push(Buffer.from(c));
      const pcm = Buffer.concat(parts);
      const maxBytes = Math.round((ACK_MAX_MS / 1000) * PCM_RATE) * 2;
      if (!pcm.length || pcm.length > maxBytes) return null;
      return pcm;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  })();
  cache.set(key, { at: Date.now(), p });
  while (cache.size > MAX) cache.delete(cache.keys().next().value);
  // a failed render is not remembered (the next ack tries again)
  p.then((v) => { if (!v) cache.delete(key); });
  return p;
}

/** The clip's length in ms. */
export const pcmMs = (pcm) => Math.round(((pcm?.length ?? 0) / 2 / PCM_RATE) * 1000);

/** Tests only. */
export const __ackAudio = { clear: () => cache.clear(), size: () => cache.size };
