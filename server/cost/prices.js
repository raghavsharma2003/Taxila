// Round 7, stream G (platform-cost-ledger): ONE price book for every meter a lesson spends on. server/azure.js prices model
// calls from it (usdOf), the flight recorder stamps usd on model.call / speech.tts / stt.session / d5.session, and
// server/cost/rollup.js turns a lesson's events into lesson.cost (migration 040).
//
// Retail list prices, USD, from docs/ops/MODEL-STACK.md (each row names its meter id there, 2026-10-04 price pull). Rows
// marked `estimate: true` have no confirmed retail meter yet; scripts/cost.mjs --reconcile compares the ledger with the
// Cost Management API by meter, and that, not this file, is the bill. Change a price here only with its meter id.
// PURE: no I/O.

export const PRICE_BOOK_VERSION = "2026-11-04";

/** $ per 1M tokens: in (uncached), cached in, out. */
export const CHAT = Object.freeze({
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
  // classify / signals / the model distress read (Grok 4.1 Glbl in 39dc9a3a, out 92ba57e1)
  "grok-4-1-fast-non-reasoning": { in: 0.2, cached: 0.2, out: 0.5 },
});
/** An unpriced chat deployment costs the dearest row, never 0 (budget caps must bite). */
export const CHAT_FALLBACK = "taxila-brain";

/** $ per 1M characters of synthesised speech. */
export const TTS = Object.freeze({
  "gpt-4o-mini-tts": { perMChars: 22, meter: "≈ DragonHD parity (VOICE-CHOICE §5)", estimate: true },
  "dragonhd": { perMChars: 22, meter: "ad55d150 Neural HD TTS" },
  "neural": { perMChars: 16, meter: "Neural TTS (standard)", estimate: true },
});
export const TTS_FALLBACK = "gpt-4o-mini-tts";

/** $ per hour of streamed audio. */
export const STT = Object.freeze({
  "gpt-live-transcribe": { perHour: 1.02, meter: "a3bfb6e0" },
  "gpt-4o-transcribe": { perHour: 0.36, meter: "1d21486d $6/1M audio tokens at ~1,000 tokens/min", estimate: true },
  "azure-speech-realtime": { perHour: 1.3, meter: "3bd267f0 S1 $1/h + 4c8e8932 Enhanced $0.30/h" },
  "mai-transcribe-2-streaming": { perHour: 0.36, meter: "placeholder: Fast Transcription e366297b (no retail MAI meter)", estimate: true },
});
export const STT_FALLBACK = "gpt-live-transcribe";

/** Speech-to-speech (the D5 duplex lane), $ per minute of session. */
export const S2S = Object.freeze({
  "voice-live": { perMin: 0.082, meter: "realtime audio in 34344c3d $32 / out b75a1221 $64 per 1M, per minute of teacher speech (VOICE-CHOICE §5)", estimate: true },
});

/** $ per generated image. */
export const IMAGE = Object.freeze({
  "taxila-image25-flare": { perCall: 0.0066, meter: "refresh-images-2026-10-04 (low)" },
  "taxila-image": { perCall: 0.053, meter: "gpt-image-2 medium, refresh-images-2026-10-04" },
});
export const IMAGE_FALLBACK = "taxila-image";

const round = (x) => Math.round(x * 1e8) / 1e8;

/** $ for one chat call's tokens ({in, cached, out}); unknown deployment → the dearest row. */
export function usdChat(deployment, u) {
  if (!u) return 0;
  const p = CHAT[deployment] ?? CHAT[CHAT_FALLBACK];
  const cached = Math.max(0, u.cached || 0);
  return round((Math.max(0, (u.in || 0) - cached) * p.in + cached * p.cached + Math.max(0, u.out || 0) * p.out) / 1e6);
}
/** $ for `chars` characters of speech on `engine` (a deployment or voice family: gpt-4o-mini-tts, dragonhd, neural). */
export function usdTts(engine, chars) {
  const key = /dragon/i.test(engine || "") ? "dragonhd" : TTS[engine] ? engine : /neural/i.test(engine || "") ? "neural" : TTS_FALLBACK;
  return round((Math.max(0, chars || 0) * TTS[key].perMChars) / 1e6);
}
/** $ for `sec` seconds of streamed STT on `model`. */
export function usdStt(model, sec) {
  const p = STT[model] ?? (/mai/i.test(model || "") ? STT["mai-transcribe-2-streaming"] : /speech/i.test(model || "") ? STT["azure-speech-realtime"] : STT[STT_FALLBACK]);
  return round((Math.max(0, sec || 0) / 3600) * p.perHour);
}
/** $ for `sec` seconds of a D5 speech-to-speech session. */
export const usdS2s = (sec) => round((Math.max(0, sec || 0) / 60) * S2S["voice-live"].perMin);
/** $ for `n` images on `deployment`. */
export const usdImage = (deployment, n = 1) => round(Math.max(0, n) * (IMAGE[deployment] ?? IMAGE[IMAGE_FALLBACK]).perCall);
