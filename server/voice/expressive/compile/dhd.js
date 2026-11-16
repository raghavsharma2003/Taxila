// The DragonHD compiler (HUMAN-VOICE §5.9, B2): a DeliveryPlan's clauses for ONE TTS part → one <speak> document.
// Pure. What it writes, and why (every claim measured on en-IN DragonHD, caps.js):
//   - a style marker at the start of EVERY sentence (markers reset at sentence boundaries [V]; the round-2 raters heard
//     "the context only at the start of a line, not sustained"), only markers proven silent (caps.js DHD_SILENT_MARKERS);
//   - <prosody rate> per clause = the voice's base rate (voices.js, HV-15) + {slow -10, normal 0, brisk 0}: a clause-level
//     speed-UP is not honoured (voice v4 caps probe, docs/research/voice/v4: +12% / +25% vs default and -14% vs a -22% base
//     came out no faster, n=3-4); a slow-down is (-15% → +18% duration; -32% on the -22% base → +40%). Brisk is carried by
//     the TEXT (short chunks, no break), never by rate (round 7, B6, voice-talked-not-read);
//   - <prosody pitch="-8%"> for calm and reassuring rows only: -8% → -1.6 st (n=3); -6% and -4% moved nothing measurable
//     (n=4, n=3); pitch-up, contour, <emphasis>, express-as, mstts:silence and temperature: no measurable effect;
//   - <break> for planned pauses inside the part (pauses BETWEEN parts are exact silence written by the pause realiser).
//     A <break> of X ms yields ≈ max(~300, X + ~200) ms of silence, so a planned pause P is written as max(50, P - 200)
//     and a planned pause under 250 ms is not written (it would come out ~300 ms);
//   - Devanagari runs inside <lang xml:lang="hi-IN"> (voice-choice-v2);
//   - the text is speakable() output: numbers and terms as words, no digit, no "..." (owner 2026-10-04);
//   - NEVER a paralinguistic tag (they are spoken on en-IN: 12/12) — lint.js asserts it on every document.
import { speakable } from "../../spoken.js";
import { dhdMarker } from "../caps.js";

export const PACE_DELTA = Object.freeze({ slow: -10, normal: 0, brisk: 0 });
/** The calm / reassuring pitch: the smallest drop the v4 probe could hear (-8% → -1.6 st). */
export const CALM_PITCH = -8;
/** Planned pause (ms) → the <break> that yields it on DragonHD, or "" (v4 caps: break X → ~max(300, X + 200) ms). */
export const breakFor = (ms) => (ms >= 250 ? `<break time="${Math.max(50, Math.round(ms) - 200)}ms"/>` : "");
const XMLNS = 'version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts"';

export const escapeXml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/** Wrap Devanagari runs (words joined by spaces / commas, with a closing danda) in <lang hi-IN>. Input already escaped. */
export function langRuns(escaped) {
  return escaped.replace(/[ऀ-ॣ०-ॿ]+(?:[\s,]+[ऀ-ॣ०-ॿ]+)*[।॥]?/g, (m) => `<lang xml:lang="hi-IN">${m}</lang>`);
}
const rateAttr = (n) => `${n >= 0 ? "+" : ""}${Math.round(n)}%`;
const speak = (voice, body) => `<speak ${XMLNS} xml:lang="en-IN"><voice name="${escapeXml(voice)}">${body}</voice></speak>`;
/**
 * Remove stage directions from spoken text: [bracketed] ones that are letters only ("[laughs]", "[smiles warmly]") and
 * asterisked actions ("*smiles*", "*nods happily*"). Audit V-26: a bracket with digits or symbols is maths ("[1, 2, 3]")
 * and stays; any other asterisked word ("*zaroori*") is emphasis in kit and opening text, said without its stars (the
 * fallback voice said it; DragonHD deleted it).
 */
const STAR_ACTION = /\*(?:smiles?|smiling|laughs?|laughing|nods?|nodding|giggles?|chuckles?|sighs?|winks?|claps?|pauses?|grins?|whispers?|cheers?|gasps?)\b[^*]*\*/giu;
export const stripStageDirections = (s) => String(s)
  .replace(/\[[\p{L}\p{M}\s'’-]*\]/gu, " ")
  .replace(STAR_ACTION, " ")
  .replace(/\*([\p{L}\p{M}][^*]*)\*/gu, "$1")
  .replace(/\s{2,}/g, " ").replace(/\s+([,.!?।])/g, "$1");
/** A spoken run: speakable text, escaped, Devanagari wrapped. Empty when nothing speakable is left. */
export function spokenRun(text, spoken) {
  // A bracketed or asterisked stage direction ("[laughs]", "*smiles*") is never spoken: DragonHD reads tags aloud
  // (12/12). Replies are stripped upstream (say.js stripStage); openings, kit and Forge narration may not be. Captions
  // keep the written text (fixer 2026-10-05).
  const s = stripStageDirections(speakable(text, spoken ?? {})).trim();
  return s ? langRuns(escapeXml(s)) : "";
}

/**
 * The plain document for a written part (no plan): base rate, no markers, no breaks.
 * @param {string} written
 * @param {{ voice: string, baseRate: number }} v
 * @param {object} [spoken] spokenOptsForChild cell
 */
export function plainSsml(written, v, spoken) {
  const run = spokenRun(written, spoken);
  return speak(v.voice, `<prosody rate="${rateAttr(v.baseRate)}">${run}</prosody>`);
}

/**
 * One part's document from its clauses.
 * @param {Array<import("../../../../shared/contracts").DeliveryClause & { sentenceStart?: boolean }>} clauses (one part, in order)
 * @param {{ voice: string, baseRate: number }} v
 * @param {{ register?: "normal"|"safety", pitch?: number, spoken?: object, env?: NodeJS.ProcessEnv }} [o]
 */
export function compileDhd(clauses, v, { register = "normal", pitch = 0, spoken, env } = {}) {
  const parts = [];
  clauses.forEach((c, j) => {
    const run = spokenRun(c.text, spoken);
    if (!run) return;
    if (j > 0 && c.pauseBeforeMs > 0) parts.push(breakFor(c.pauseBeforeMs));
    const emotion = register === "safety" ? "calm" : c.emotion;
    const marker = (c.sentenceStart ?? j === 0) ? dhdMarker(emotion, env) : null;
    const rate = v.baseRate + (PACE_DELTA[register === "safety" ? "slow" : c.pace] ?? 0);
    const lowPitch = register !== "safety" && (pitch < 0 || emotion === "calm" || emotion === "reassuring") ? ` pitch="${Math.min(pitch, CALM_PITCH)}%"` : "";
    parts.push(`<prosody rate="${rateAttr(rate)}"${lowPitch}>${marker ? `[${marker}] ` : ""}${run}</prosody>`);
  });
  return speak(v.voice, parts.join(""));
}
