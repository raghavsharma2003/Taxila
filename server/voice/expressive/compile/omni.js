// The DragonHD Omni compiler (HUMAN-VOICE §5.9): NOT a production engine (hi-IN Omni personas are unlisted,
// dragonhdomni-not-production); kept so the day it is listed the plan already speaks it. Omni renders paralinguistic
// tags natively and silently (0/8 leak), so a licensed non-verbal IS written as its tag here (owner 2026-10-04: a laugh
// only where the engine renders it natively and in context). No <break>, no <prosody> (unsupported): pauses are
// left to the engine, and no "..." is ever sent.
import { dhdMarker } from "../caps.js";
import { escapeXml, langRuns, spokenRun } from "./dhd.js";

const TAG = { breath: "breathing", laugh: "laughter", chuckle: "laughter", sigh_relief: "sighing" };
void langRuns;

/** @param {Array<any>} clauses one part @param {{ voice: string }} v @param {{ register?: string, spoken?: object }} [o] */
export function compileOmni(clauses, v, { register = "normal", spoken } = {}) {
  const body = clauses.map((c, j) => {
    const run = spokenRun(c.text, spoken);
    if (!run) return "";
    const marker = (c.sentenceStart ?? j === 0) ? dhdMarker(register === "safety" ? "calm" : c.emotion) : null;
    const tag = register !== "safety" && TAG[c.nonverbalBefore] ? `[${TAG[c.nonverbalBefore]}] ` : "";
    return `${tag}${marker ? `[${marker}] ` : ""}${run}`;
  }).filter(Boolean).join(" ");
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="hi-IN"><voice name="${escapeXml(v.voice)}">${body}</voice></speak>`;
}
