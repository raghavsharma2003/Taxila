// One interface over the three teacher voices the owner is choosing between (RS-7; final pick page
// docs/research/voice/final/, decision voice-final-diya-2026-10-04): the winner is a CONFIG FLIP, never a code change.
//
//   diya   en-IN-Diya:DragonHDLatestNeural   Azure Speech DragonHD, GA          production today (voices.js row `asha`)
//   priya  hi-IN-Priya:MAI-Voice-2.1         Azure Speech MAI-Voice, PREVIEW    express-as from its StyleList, no prosody
//   marin  gpt-4o-mini-tts, voice "marin"     Azure OpenAI TTS, GA               today's fallback voice
//
// Env:
//   TAXILA_TEACHER_VOICE=diya|priya|marin   UNSET (the default) = no change at all: voices.js / speech.js decide as today.
//   TAXILA_ALLOW_PREVIEW_VOICE=1            required for priya: `voice-ga-only-for-minors` (no Preview voice takes a
//                                           production slot for children). Without it a priya flip is refused and logged,
//                                           and the legacy path speaks.
//   TAXILA_VOICE_DEVANAGARI=1               the Roman → Devanagari step (server/voice/translit) for voices whose row says
//                                           `devanagari: true`.
//
// Shape: `styleFor(choice, base)` turns speech.js's speechStyle() result into the style the existing pipeline already
// understands (engine "dhd" + dhd {voice, baseRate} for both Azure Speech voices, plus `compiler: "mai"` for Priya; plain
// oai for marin), so speakChunk / prewarm / renderParts / tts.js keep ONE code path. `documentFor` and `synthesize` are
// the standalone interface (evals, the owner's ear page, a future voice route): text in, audio out, same rules.
import { dhdStream, dhdClip, DHD_MP3_FORMAT } from "./azureTts.js";
import { escapeXml, langRuns } from "./expressive/compile/dhd.js";
import { speakable } from "./spoken.js";
import { toDevanagari, devanagariOn } from "./translit/index.js";

/**
 * The three choices. `devanagari`: does the step apply to this voice. Measured 2026-10-05 (evals/translit/render.mjs, 40 real
 * replies, Azure STT hi-IN, number words heard before → after the step): Diya 87.0 → 98.2 % (2 takes), Priya 74.7 → 93.7 %,
 * marin 91.0 → 97.6 % (1 take each). It helped all three, so all three rows are on (still behind TAXILA_VOICE_DEVANAGARI).
 */
export const VOICE_CHOICES = Object.freeze({
  diya: Object.freeze({ id: "diya", engine: "dhd", voice: "en-IN-Diya:DragonHDLatestNeural", baseRate: -35, ga: true, devanagari: true, lang: "en-IN" }),
  priya: Object.freeze({ id: "priya", engine: "mai", voice: "hi-IN-Priya:MAI-Voice-2.1", baseRate: 0, ga: false, devanagari: true, lang: "hi-IN",
    styles: Object.freeze(["excited", "softvoice"]) }),
  marin: Object.freeze({ id: "marin", engine: "oai", voice: "marin", baseRate: 0, ga: true, devanagari: true, lang: null }),
});

const warned = new Set();
const warnOnce = (k, msg) => { if (!warned.has(k)) { warned.add(k); console.warn(msg); } };

/**
 * The configured choice, or null when the switch is unset (then NOTHING changes: today's voices.js path speaks).
 * @returns {null | typeof VOICE_CHOICES[keyof typeof VOICE_CHOICES]}
 */
export function voiceChoice(env = process.env) {
  const id = String(env.TAXILA_TEACHER_VOICE ?? "").trim().toLowerCase();
  if (!id) return null;
  const c = VOICE_CHOICES[id];
  if (!c) { warnOnce(`bad:${id}`, `[voice] TAXILA_TEACHER_VOICE=${id} is not one of ${Object.keys(VOICE_CHOICES).join("|")}: ignored`); return null; }
  if (!c.ga && env.TAXILA_ALLOW_PREVIEW_VOICE !== "1") {
    warnOnce(`preview:${id}`, `[voice] ${c.voice} is a Preview voice (voice-ga-only-for-minors): set TAXILA_ALLOW_PREVIEW_VOICE=1 to use it; legacy voice speaks`);
    return null;
  }
  return c;
}

/** The spoken cell with the Devanagari decision for this voice folded in (dhd.js spokenRun and speech.js ttsInput read it). */
export function spokenFor(choice, spoken = {}, env = process.env) {
  const on = !!choice?.devanagari && devanagariOn(env);
  return on ? { ...spoken, devanagari: true } : spoken;
}

/**
 * The pipeline style for a choice. `base` is speech.js speechStyle(teacher, voice, spoken). Null choice → base unchanged.
 * Azure Speech voices ride the existing "dhd" engine path (dhdStream posts any Speech voice); Priya's documents are
 * built by compileMai (dhd.js delegates on `compiler: "mai"`, patch 01).
 */
export function styleFor(choice, base, env = process.env) {
  if (!choice) return base;
  const spoken = spokenFor(choice, base.spoken, env);
  if (choice.engine === "oai") {
    const { engine: _e, dhd: _d, ...rest } = base;
    return { ...rest, voice: choice.voice, spoken, version: `${base.version}:sw-${choice.id}` };
  }
  const dhd = { voice: choice.voice, baseRate: choice.baseRate, ...(choice.engine === "mai" ? { compiler: "mai", styles: [...choice.styles] } : {}) };
  return { ...base, engine: "dhd", dhd, spoken, version: `${base.version}:sw-${choice.id}` };
}

// ───────────── standalone interface ─────────────

/** The text the voice is given: speakable() (numbers, terms), then the Devanagari step when on for this voice. */
export function spokenText(choice, written, spoken = {}, { register, moment, env = process.env } = {}) {
  const s = speakable(written, spoken).trim();
  const cell = spokenFor(choice, spoken, env);
  return cell.devanagari ? toDevanagari(s, { force: true, mode: spoken.mode ?? "hinglish", written, register, moment }) : s;
}

/**
 * What one engine is given for one written line (no delivery plan: the plain document, the round-3 arm-B form).
 * @returns {{ engine: "speech", ssml: string } | { engine: "oai", input: string, voice: string }}
 */
export function documentFor(choice, written, spoken = {}, o = {}) {
  const c = choice ?? VOICE_CHOICES.diya;
  const text = spokenText(c, written, spoken, o);
  if (c.engine === "oai") return { engine: "oai", input: text, voice: c.voice };
  const body = langRuns(escapeXml(text));
  if (c.engine === "mai") {
    return { engine: "speech", ssml: `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="hi-IN"><voice name="${escapeXml(c.voice)}">${body}</voice></speak>` };
  }
  const rate = `${c.baseRate >= 0 ? "+" : ""}${Math.round(c.baseRate)}%`;
  return { engine: "speech", ssml: `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-IN"><voice name="${escapeXml(c.voice)}"><prosody rate="${rate}">${body}</prosody></voice></speak>` };
}

/**
 * Speak one written line with a choice. stream → { chunks, ttfbMs } (PCM s16le 24 kHz mono); clip → Buffer (mp3).
 * gpt-4o-mini-tts modules are imported lazily so this file stays importable without the database layer.
 * @param {"stream"|"clip"} kind
 */
export async function synthesize(choice, written, spoken = {}, { kind = "stream", signal, env = process.env, ...o } = {}) {
  const doc = documentFor(choice, written, spoken, { env, ...o });
  if (doc.engine === "speech") {
    return kind === "clip" ? dhdClip(doc.ssml, { format: DHD_MP3_FORMAT, signal, env }) : dhdStream(doc.ssml, { signal, env });
  }
  if (kind === "clip") { const { tts } = await import("../azure.js"); return tts(doc.input, doc.voice); }
  const { speechStream } = await import("./speech.js");
  return speechStream(doc.input, { voice: doc.voice, signal });
}
