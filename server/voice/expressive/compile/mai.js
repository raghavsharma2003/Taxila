// The MAI-Voice-2.1 compiler (HUMAN-VOICE §5.9; a benchmark until MAI is GA, voice-ga-only-for-minors). Measured: bracket
// style markers return NO AUDIO and paralinguistic tags are spoken, so only <mstts:express-as> with a style from THIS
// voice's StyleList (read from voices/list at boot) plus <break> are written.
import { escapeXml, spokenRun } from "./dhd.js";

const STYLE_FOR = { warm: "friendly", amused: "cheerful", delighted: "excited", calm: "calm", reassuring: "empathetic", curious: "friendly", wonder: "hopeful", proud: "cheerful", playful: "cheerful" };

/** @param {Array<any>} clauses one part @param {{ voice: string, styles?: string[] }} v @param {{ register?: string, spoken?: object }} [o] */
export function compileMai(clauses, v, { register = "normal", spoken } = {}) {
  const allowed = new Set(v.styles ?? []);
  const body = clauses.map((c, j) => {
    const run = spokenRun(c.text, spoken);
    if (!run) return "";
    const brk = j > 0 && c.pauseBeforeMs > 0 ? `<break time="${Math.round(c.pauseBeforeMs)}ms"/>` : "";
    const style = STYLE_FOR[register === "safety" ? "calm" : c.emotion];
    return brk + (style && allowed.has(style) ? `<mstts:express-as style="${style}">${run}</mstts:express-as>` : run);
  }).join("");
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="hi-IN"><voice name="${escapeXml(v.voice)}">${body}</voice></speak>`;
}
