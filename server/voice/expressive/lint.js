// The leak lint (HUMAN-VOICE §8.1.1, B0; HV-1, HV-6). Three checks, all pure:
//   lintSsml(ssml, engine)   what an engine is GIVEN: no paralinguistic tag on an engine that speaks them (en-IN DragonHD,
//                            MAI), no marker that is not proven silent, no digits and no "..." in the spoken text (owner
//                            2026-10-04, voice-clips-off-and-numbers-normalised: numbers reach the voice as words);
//   lintPromptText(text)     what a MODEL is given (the reply prompt, lane-A instructions): no bracketed delivery tag, no
//                            sound word, no markup word. Meera taught a tag vocabulary and got stage directions in 10/10
//                            replies [H]; a bracketed laugh direction was voiced on gpt-realtime-2.1 in ≥ 2/4 turns [M];
//   leakWords(asr, source)   what the voice SAID: tag and style words heard in an ASR transcript that the source text did
//                            not contain, in Latin AND Devanagari (cap-probe's regex missed "लाफ्टर"; this list fixes it).
import { PARALINGUISTIC, DHD_SILENT_MARKERS } from "./caps.js";

const TAG_WORDS = PARALINGUISTIC.join("|");
const TAG_RE = new RegExp(`\\[\\s*(?:${TAG_WORDS})\\s*\\]`, "i");
const BRACKET_RE = /\[\s*([A-Za-z_ ]{2,30})\s*\]/g;

/** Sound and delivery words a reply model must never see (EN + romanised + Devanagari). */
export const SOUND_WORDS = [
  "laugh", "laughs", "laughing", "laughter", "chuckle", "chuckles", "chuckling", "giggle", "giggles", "giggling", "sigh", "sighs", "sighing",
  "inhale", "inhales", "exhale", "exhales", "breathing", "humming", "haha", "hehe", "hahaha", "cough", "coughs", "coughing", "yawn", "yawns",
  "हाहा", "हीही", "लाफ्टर", "ब्रीदिंग", "साइंग", "सायिंग", "हमिंग",
];
const SOUND_RE = new RegExp(`(^|[^\\p{L}\\p{M}])(${SOUND_WORDS.join("|")})(?=$|[^\\p{L}\\p{M}])`, "iu");
const MARKUP_RE = /<\s*\/?\s*(?:break|prosody|speak|voice|mstts|emphasis|lang)\b|\bssml\b|\bstyle marker\b|\bparalinguistic\b/i;

/**
 * Problems in an engine payload (SSML for dhd/omni/mai, plain text for oai). [] = clean.
 * @param {string} payload
 * @param {"dhd"|"omni"|"mai"|"oai"} engine
 */
export function lintSsml(payload, engine = "dhd") {
  const out = [];
  const s = String(payload ?? "");
  if ((engine === "dhd" || engine === "mai" || engine === "oai") && TAG_RE.test(s)) out.push("paralinguistic_tag");
  for (const m of s.matchAll(BRACKET_RE)) {
    const w = m[1].trim().toLowerCase();
    if (engine === "omni" && PARALINGUISTIC.includes(w)) continue;
    if (engine === "dhd" || engine === "omni") { if (!DHD_SILENT_MARKERS.includes(w)) out.push(`unknown_marker:${w}`); }
    else out.push(`bracket:${w}`);
  }
  const spoken = s.replace(/<[^>]*>/g, " ").replace(BRACKET_RE, " ");
  if (/[0-9०-९]/.test(spoken)) out.push("digits");
  if (/\.\.\.|…/.test(spoken)) out.push("ellipsis");
  return [...new Set(out)];
}

/** Problems in text a MODEL reads (reply prompt, lane-A instructions). [] = clean. */
export function lintPromptText(text) {
  const out = [];
  const s = String(text ?? "");
  if (TAG_RE.test(s)) out.push("paralinguistic_tag");
  for (const m of s.matchAll(BRACKET_RE)) {
    const w = m[1].trim().toLowerCase();
    if (PARALINGUISTIC.includes(w) || DHD_SILENT_MARKERS.includes(w)) out.push(`delivery_bracket:${w}`);
  }
  if (SOUND_RE.test(s)) out.push("sound_word");
  if (MARKUP_RE.test(s)) out.push("markup_word");
  return [...new Set(out)];
}

/**
 * Tag / style words an ASR transcript contains that the source did not (the voice READ a tag or marker aloud).
 * Latin plus the Devanagari transliterations Azure ASR writes for en-IN Hindi-led audio (cap-probe: "लाफ्टर / ब्रीदिंग /
 * साइन"). Common words that are also markers ("calm", "curious", "surprised") count only when absent from the source.
 */
export const LEAK_WORDS = [
  // "hum" and "breath" are left out: romanised Hindi "hum" (we) is everyday speech; "breathing" catches the tag.
  ...PARALINGUISTIC.filter((w) => w !== "hum" && w !== "breath").map((w) => w.replace("_", " ")), ...DHD_SILENT_MARKERS, "laughs", "sighs", "throat clearing",
  "लाफ्टर", "लाफ़्टर", "ब्रीदिंग", "ब्रीथिंग", "साइंग", "सायिंग", "साइन", "साईं", "कफिंग", "यॉनिंग", "हमिंग", "चकल",
  "एप्रिशिएटिव", "अप्रिशिएटिव", "अम्यूज़्ड", "अम्यूज्ड", "एक्साइटेड", "सरप्राइज़्ड", "सरप्राइज्ड", "रीअश्योरिंग", "रिअश्योरिंग",
  "क्यूरियस", "इंट्रिग्ड", "इन्ट्रीग्ड", "रिफ्लेक्टिव", "न्यूट्रल",
];
const norm = (s) => String(s ?? "").toLowerCase().normalize("NFC");
export function leakWords(asr, source = "") {
  const a = ` ${norm(asr).replace(/[^\p{L}\p{M}\s]/gu, " ")} `;
  const src = ` ${norm(source).replace(/[^\p{L}\p{M}\s]/gu, " ")} `;
  return LEAK_WORDS.filter((w) => {
    const W = ` ${norm(w)} `;
    return a.includes(W) && !src.includes(W);
  });
}
