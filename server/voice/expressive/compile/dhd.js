// The DragonHD compiler (HUMAN-VOICE §5.9, B2): a DeliveryPlan's clauses for ONE TTS part → one <speak> document.
// Pure. What it writes, and why (every claim measured on en-IN DragonHD, caps.js):
//   - a style marker at the start of EVERY sentence (markers reset at sentence boundaries [V]; the round-2 raters heard
//     "the context only at the start of a line, not sustained"), only markers proven silent (caps.js DHD_SILENT_MARKERS);
//   - <prosody rate> per clause = the voice's base rate (voices.js, HV-15) + {slow -10, normal 0, brisk +8};
//   - <prosody pitch="-6%"> for calm and reassuring rows only (pitch-up is ineffective: +15% gave +4.4%);
//   - <break> for planned pauses inside the part (pauses BETWEEN parts are exact silence written by the pause realiser);
//   - Devanagari runs inside <lang xml:lang="hi-IN"> (voice-choice-v2);
//   - the text is speakable() output: numbers and terms as words, no digit, no "..." (owner 2026-10-04);
//   - NEVER a paralinguistic tag (they are spoken on en-IN: 12/12) — lint.js asserts it on every document.
import { speakable } from "../../spoken.js";
import { dhdMarker } from "../caps.js";

export const PACE_DELTA = Object.freeze({ slow: -10, normal: 0, brisk: 8 });
const XMLNS = 'version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts"';

export const escapeXml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/** Wrap Devanagari runs (words joined by spaces / commas, with a closing danda) in <lang hi-IN>. Input already escaped. */
export function langRuns(escaped) {
  return escaped.replace(/[ऀ-ॣ०-ॿ]+(?:[\s,]+[ऀ-ॣ०-ॿ]+)*[।॥]?/g, (m) => `<lang xml:lang="hi-IN">${m}</lang>`);
}
const rateAttr = (n) => `${n >= 0 ? "+" : ""}${Math.round(n)}%`;
const speak = (voice, body) => `<speak ${XMLNS} xml:lang="en-IN"><voice name="${escapeXml(voice)}">${body}</voice></speak>`;
/** Remove [bracketed] and *asterisked* stage directions from spoken text (after speakable: no maths "*" is left). */
export const stripStageDirections = (s) => String(s).replace(/\[[^\]]*\]|\*[\p{L}][^*]*\*/gu, " ").replace(/\s{2,}/g, " ").replace(/\s+([,.!?।])/g, "$1");
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
    if (j > 0 && c.pauseBeforeMs > 0) parts.push(`<break time="${Math.round(c.pauseBeforeMs)}ms"/>`);
    const emotion = register === "safety" ? "calm" : c.emotion;
    const marker = (c.sentenceStart ?? j === 0) ? dhdMarker(emotion, env) : null;
    const rate = v.baseRate + (PACE_DELTA[register === "safety" ? "slow" : c.pace] ?? 0);
    const lowPitch = register !== "safety" && (pitch < 0 || emotion === "calm" || emotion === "reassuring") ? ` pitch="${pitch < 0 ? pitch : -6}%"` : "";
    parts.push(`<prosody rate="${rateAttr(rate)}"${lowPitch}>${marker ? `[${marker}] ` : ""}${run}</prosody>`);
  });
  return speak(v.voice, parts.join(""));
}
