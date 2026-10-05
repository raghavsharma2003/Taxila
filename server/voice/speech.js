// Cascade lane, mouth: streaming gpt-4o-mini-tts (PCM 24 kHz s16le mono) and the batch transcription the
// push-to-talk fallback uses. These two calls stream or upload bodies that server/azure.js's JSON `post()`
// cannot carry, so they live here with the same rules: key only in the `api-key` header, every call timed
// and logged (kind, deployment, status, ms) — never the payload, because payloads carry children's words.
import { createHash } from "crypto";
import { DEPLOY, AzureError, endpoint } from "../azure.js";
import { EndpointConfigError, laneKey } from "../endpoints.js";
import { q, one } from "../db.js";
import { speakable } from "./spoken.js";
import { dhdStream } from "./azureTts.js";
import { plainSsml } from "./expressive/compile/dhd.js";
import { count } from "./expressive/telemetry.js";

export const PCM_RATE = 24_000;
/** Bytes per second of PCM16 mono at PCM_RATE. */
export const PCM_BPS = PCM_RATE * 2;

/** The lane's key (server/endpoints.js: TTS for speech, TRANSCRIBE for transcription), as an AzureError when unset. */
function apiKey(lane) {
  try { return laneKey(lane); } catch (e) { throw e instanceof EndpointConfigError ? new AzureError(e.message, 0, "config") : e; }
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

/**
 * { voice, instructions, version, spoken } for a teacher (characters/index.js teacherFor result). `spoken` is the
 * toSpoken() cell (mode × school medium × age band, spoken.js spokenOptsForChild) every chunk is rendered with.
 */
export function speechStyle(teacher, voice, spoken) {
  const off = process.env.TAXILA_TTS_STYLE === "0";
  const notes = STYLE[teacher?.id];
  return { voice, instructions: off || !notes ? "" : notes.join("\n"), version: off ? "none" : STYLE_VERSION, ...(spoken ? { spoken } : {}) };
}

// ───────────── what the voice is given ─────────────

/**
 * The text a speech model is given for written teacher text: numerals and notation rendered into the spoken
 * form for the lesson's mode (server/voice/spoken.js; helplines always digit by digit), then the owner's rules
 * (2026-10-04, voice-clips-off-and-numbers-normalised): no digit and no "..." reach the voice, terms from the lexicon
 * (spoken.js speakable). EVERY TTS call goes
 * through this; captions, stored turns and the leak/safety guards keep the written text. Pass complete
 * sentences (splitSentences output): a number cut mid-token ("12" | ",50") cannot be rendered right.
 * TAXILA_TTS_SPOKEN=0 sends the written text (measurement A/B only; the helplines then lose digit-exactness).
 * @param {string} text  written teacher text
 * @param {{ spoken?: object }} [style]  speechStyle() result; without `spoken`, the default Hinglish cell
 */
export function ttsInput(text, style) {
  if (process.env.TAXILA_TTS_SPOKEN === "0") return String(text);
  return speakable(text, style?.spoken ?? {});
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

/** @param {string} key @param {"memory" | "db"} [store] "memory" = never read from / written to the database */
export async function cacheGet(key, store) {
  const hit = mem.get(key);
  if (hit) { mem.delete(key); mem.set(key, hit); return hit; }
  if (store === "memory") return null;
  let timer;
  const pcm = await Promise.race([
    cacheStore.get(key).catch(() => null),
    new Promise((r) => { timer = setTimeout(() => r(null), DB_READ_TIMEOUT_MS); }),
  ]);
  clearTimeout(timer);
  if (pcm) memPut(key, pcm);
  return pcm;
}
export function cachePut(key, pcm, store) {
  memPut(key, pcm);
  if (store === "memory") return;
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
  // Already cancelled (a prewarm dropped, a barge-in) while a cache lookup ran: never start the request.
  if (signal?.aborted) throw new AzureError(`tts_stream ${DEPLOY.tts} aborted`, 0, "aborted");
  const ctl = new AbortController();
  const onAbort = () => ctl.abort();
  signal?.addEventListener("abort", onAbort, { once: true });
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  const body = { model: DEPLOY.tts, input: String(text).slice(0, 4000), voice, response_format: "pcm", stream_format: "audio" };
  if (instructions) body.instructions = instructions;
  let res;
  try {
    res = await fetch(endpoint("TTS") + "/audio/speech", {
      method: "POST", headers: { "api-key": apiKey("TTS"), "content-type": "application/json" }, body: JSON.stringify(body), signal: ctl.signal,
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

/**
 * Identity of the non-verbal bank in every cache key (HUMAN-VOICE §5.7: the bank manifest hash is part of the voice's
 * identity). Owner 2026-10-04 (voice-clips-off-and-numbers-normalised): no bank ships, so it is the constant "nobank".
 */
export const BANK_HASH = "nobank";

/**
 * Start speaking one chunk of WRITTEN teacher text: rendered by ttsInput(), then memory/DB cache for short
 * ones, else streamed from Azure (and cached). The cache key is the rendered text, so a renderer change never
 * replays audio of an old reading.
 *
 * `render` (server/voice/expressive/render.js) is what the expressive layer compiled for this part:
 *   { engine: "dhd", ssml }                    Azure Speech DragonHD (the key is the whole document: plan + voice + rate)
 *   { engine: "oai", text?, instructions? }    gpt-4o-mini-tts with band instructions
 *   store: "memory"                            never written to asset_cache (the uptake prelude carries a child's words)
 * Without `render`, a style whose engine is "dhd" speaks the plain DragonHD document at the voice's base rate, and any
 * other style speaks exactly as before. A DragonHD failure before the first byte falls back to the character's
 * gpt-4o-mini-tts voice: an IDENTITY CHANGE, sticky for the rest of the reply (`lane`, voiceLane()) and of the lesson
 * until the breaker closes, logged and counted (voice.expr.engine_fallback) once per lesson switch.
 */
export function speakChunk(written, style, signal, render, lane) {
  const dhd = render ? render.engine === "dhd" : style?.engine === "dhd" && !!style?.dhd;
  if (dhd) return speakDhd(written, style, signal, render, lane);
  const text = ttsInput(render?.text ?? written, style);
  const instructions = render?.instructions ?? style.instructions;
  const version = render?.instructions && render.instructions !== style.instructions ? `${style.version}:i${createHash("sha256").update(render.instructions).digest("hex").slice(0, 8)}` : style.version;
  const key = cacheable(text) ? cacheKey({ voice: style.voice, version, text }) : null;
  return new Prefetch(async (self) => {
    if (key) {
      const pcm = await cacheGet(key, render?.store);
      if (pcm) { self.cached = true; return [pcm]; }
    }
    const { chunks } = await speechStream(text, { voice: style.voice, instructions, signal });
    if (!key) return chunks;
    return (async function* () {
      const all = [];
      for await (const c of chunks) { all.push(Buffer.from(c)); yield c; }
      if (!signal?.aborted) cachePut(key, Buffer.concat(all), render?.store);
    })();
  });
}

// ───────────── one voice per reply, per lesson (sticky DragonHD → mini-tts fallback) ─────────────
// Fixer 2026-10-05 (w2g-sticky-engine-fallback). The fallback used to be decided per TTS part: DragonHD failing on
// sentence 2 of 3 gave Diya → marin → Diya inside one utterance (owner priority 2: one consistent teacher), and while
// DragonHD was degraded every part waited out the 4 s header timeout. Now:
//   - a circuit breaker per DragonHD voice: one failure opens it for BREAKER_OPEN_MS; then ONE request probes it
//     (half-open) while every other request speaks mini-tts; a probe that gets headers closes it (a new epoch);
//   - the breaker is asked at the START of a reply only: once a part spoke DragonHD, the rest of that reply tries it too;
//   - a reply lane (voiceLane): each part waits until the part before it has CHOSEN its engine (its headers, ~0.3 s,
//     while that part is still playing: the lookahead hides it), and once any part has fallen back every later part of
//     that reply goes straight to the character's mini-tts voice;
//   - a lesson that fell back stays on mini-tts until the breaker closes (a new epoch), so it is never the probe;
//   - voice.expr.engine_fallback counts lesson switches (one per lesson per epoch; one per reply without a lesson id).
export const BREAKER_OPEN_MS = 60_000;
const breakers = new Map(); // dhd voice → { state: "closed" | "open" | "half", until, epoch }
const stuckLessons = new Map(); // lessonId → { voice, epoch } (LRU-bounded)
const MAX_STUCK = 2000;
const breakerOf = (voice) => {
  let b = breakers.get(voice);
  if (!b) breakers.set(voice, (b = { state: "closed", until: 0, epoch: 0 }));
  return b;
};
/** May this request try DragonHD for `voice`? "try" (closed), "probe" (the one half-open request), "skip". */
function admitDhd(voice, now = Date.now()) {
  const b = breakerOf(voice);
  if (b.state === "closed") return "try";
  if (b.state === "open" && now >= b.until) { b.state = "half"; return "probe"; }
  return "skip";
}
function dhdSucceeded(voice) {
  const b = breakerOf(voice);
  if (b.state !== "closed") { b.state = "closed"; b.epoch += 1; console.info(`[voice] dhd ${voice} back: breaker closed`); }
}
function dhdFailed(voice, now = Date.now()) {
  const b = breakerOf(voice);
  b.state = "open";
  b.until = now + BREAKER_OPEN_MS;
}
function lessonStuck(lessonId, voice) {
  if (!lessonId) return false;
  const s = stuckLessons.get(lessonId);
  if (!s || s.voice !== voice) return false;
  if (breakerOf(voice).epoch !== s.epoch) { stuckLessons.delete(lessonId); return false; }
  return true;
}
/** The reply (lane) moves to mini-tts; counted and logged once per lesson switch. */
function fallBack(lane, voice, style, why) {
  if (lane?.fellBack) return;
  if (lane) lane.fellBack = true;
  const lessonId = lane?.lessonId;
  if (lessonId && lessonStuck(lessonId, voice)) return; // this lesson already switched in this epoch
  if (lessonId) {
    stuckLessons.delete(lessonId);
    stuckLessons.set(lessonId, { voice, epoch: breakerOf(voice).epoch });
    while (stuckLessons.size > MAX_STUCK) stuckLessons.delete(stuckLessons.keys().next().value);
  }
  count("engine_fallback");
  console.warn(`[voice] identity change: dhd ${voice} → oai ${style.voice}${lessonId ? ` for lesson ${String(lessonId).slice(0, 8)}` : ""} (${why})`);
}
/**
 * One reply's engine lane: pass the same lane to every speakChunk of one reply, in order (prewarm.js speakingEntry).
 * @param {string} [lessonId]
 */
export function voiceLane(lessonId) {
  return { lessonId: lessonId ?? null, fellBack: false, engine: /** @type {"dhd" | null} */ (null), chain: Promise.resolve() };
}
/** For the whole-document paths ("Hear"): may DragonHD be tried now, and report how it went. */
export const dhdBreaker = {
  admit: (voice) => admitDhd(voice) !== "skip",
  ok: (voice) => dhdSucceeded(voice),
  failed: (voice) => dhdFailed(voice),
};
/** Tests only. */
export const __breaker = { reset: () => { breakers.clear(); stuckLessons.clear(); }, state: (voice) => ({ ...breakerOf(voice) }),
  expire: (voice) => { breakerOf(voice).until = 0; } };

function speakDhd(written, style, signal, render, lane) {
  const ssml = render?.ssml ?? plainSsml(written, style.dhd, style.spoken);
  const spokenLen = ttsInput(written, style).length;
  const key = spokenLen <= CACHE_MAX_CHARS ? cacheKey({ voice: style.dhd.voice, model: "dhd", version: `${style.version}:${BANK_HASH}`, text: ssml }) : null;
  const voice = style.dhd.voice;
  // the part before this one in the same reply must have chosen its engine first
  const before = lane?.chain ?? null;
  let decided = () => {};
  if (lane) lane.chain = new Promise((r) => { decided = r; });
  const oai = async (self, why) => {
    fallBack(lane, voice, style, why);
    self.fellBack = true;
    const { chunks } = await speechStream(ttsInput(written, style), { voice: style.voice, instructions: style.instructions, signal });
    return chunks;
  };
  return new Prefetch(async (self) => {
    let chunks;
    try {
      if (before) await before;
      if (lane?.fellBack || lessonStuck(lane?.lessonId, voice)) return await oai(self, "reply already on mini-tts");
      if (key) {
        const pcm = await cacheGet(key, render?.store);
        if (pcm) { self.cached = true; if (lane) lane.engine = "dhd"; return [pcm]; }
      }
      if (signal?.aborted) throw new AzureError(`dhd_stream ${voice} aborted`, 0, "aborted");
      // the breaker decides at the START of a reply; once a part of this reply spoke DragonHD, the rest of it tries
      // DragonHD too (one voice per reply outranks the breaker; a part's own failure still moves the reply over)
      if (lane?.engine !== "dhd" && admitDhd(voice) === "skip") return await oai(self, "breaker open");
      try {
        ({ chunks } = await dhdStream(ssml, { signal }));
        dhdSucceeded(voice);
        if (lane) lane.engine = "dhd";
      } catch (e) {
        if (signal?.aborted || e?.code === "aborted") throw e;
        dhdFailed(voice);
        // identity change: the character's gpt-4o-mini-tts voice speaks this part and the rest of the reply (plain words)
        return await oai(self, `${e?.code || e?.status || "error"}: ${String(e?.message || e).slice(0, 120)}`);
      }
    } finally {
      decided();
    }
    if (!key) return chunks;
    return (async function* () {
      const all = [];
      for await (const c of chunks) { all.push(Buffer.from(c)); yield c; }
      if (!signal?.aborted) cachePut(key, Buffer.concat(all), render?.store);
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
    const url = `${endpoint("TRANSCRIBE").replace(/\/openai\/v1$/, "")}/openai/deployments/${encodeURIComponent(model)}/audio/transcriptions?api-version=2025-03-01-preview`;
    const res = await fetch(url, { method: "POST", headers: { "api-key": apiKey("TRANSCRIBE") }, body: fd, signal: ctl.signal });
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
