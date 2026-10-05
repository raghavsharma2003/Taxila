// Microsoft AI Code of Conduct restriction 12 (`ct-no-voice-emotion-inference`): voice features are KNOWLEDGE states, named
// by the action they license. This is the one word list the build lint (tests/p3-voicesig-lint.test.mjs) and the runtime
// guard share, so the two can never disagree. The runtime guard drops any code or key that matches before it reaches a
// trace row (it never should: the 10k-turn test asserts the pipeline produces none). Pure.
//
// The list is the SIGNALS-SPEC §3.1 affect regex plus SPEC §1.1's additions (unsure, confident/confidence, doubt,
// nervous, hesitant, emotion*), plus the six basic emotions restriction 12 names and common near-synonyms, in English,
// romanised Hindi and Devanagari.
// It is DATA describing what must never appear, so this one file is exempt from the folder lint it serves (the lint
// names it explicitly; no other file may be added to that exemption).

const EN = [
  "frustrat", "bored", "anxi", "sad\\b", "happy", "arous", "valence", "mood", "stress", "tired", "fatigue", "confus", "delight",
  "emotion", "feel", "upset", "angry", "anger", "vibe", "unsure", "confiden", "doubt", "nervous", "hesitant", "fear", "afraid", "scared",
  "disgust", "surpris", "joy", "worr", "panic", "embarrass", "shame", "lonely", "excited", "calm\\b", "sentiment", "affect\\b", "affective",
  "distress", "cry\\b", "crying",
];
const HI_ROMAN = ["udaas", "gussa", "ghabra", "pareshan", "khush\\b", "dukhi", "darr?\\b", "sharmind", "bechain", "tension\\b"];
const HI_DEVA = ["उदास", "गुस्सा", "घबरा", "परेशान", "खुश", "दुखी", "डर", "शर्मिंद", "बेचैन", "भावना"];

/** One regex over identifiers, keys, codes and strings (case-insensitive, Unicode). */
export const EMOTION_RE = new RegExp(`(?:${[...EN, ...HI_ROMAN, ...HI_DEVA].join("|")})`, "iu");

/**
 * Input names that are other systems' words for something that is not a person's state, allowed where they appear as
 * inputs only: the STT's own score (asrConfidence / asrConf), the legacy alias kept for one release (unsureCorrect), and
 * the safety module's own name for a disclosure (distress: the safety floor, which voicesig never reads or writes).
 */
export const ALLOW = Object.freeze(new Set(["asrConfidence", "asrConf", "unsureCorrect", "distress", "distressKind", "safetyPending"]));

/** Every token in `s` that names a state of mind. */
export function emotionWordsIn(s) {
  const hits = [];
  for (const m of String(s ?? "").matchAll(/[\p{L}\p{M}_$][\p{L}\p{M}\p{N}_$-]*/gu)) if (!ALLOW.has(m[0]) && EMOTION_RE.test(m[0])) hits.push(m[0]);
  return hits;
}

/** Every key and string value in a JSON-like value that names a state of mind (deep). */
export function emotionWordsDeep(v, path = "$", out = []) {
  if (typeof v === "string") { for (const w of emotionWordsIn(v)) out.push(`${path}: ${w}`); return out; }
  if (Array.isArray(v)) { v.forEach((x, i) => emotionWordsDeep(x, `${path}[${i}]`, out)); return out; }
  if (v && typeof v === "object") {
    for (const [k, x] of Object.entries(v)) {
      for (const w of emotionWordsIn(k)) out.push(`${path}.<key>: ${w}`);
      emotionWordsDeep(x, `${path}.${k}`, out);
    }
  }
  return out;
}

/** The runtime guard: codes that name a state of mind are dropped (and counted, so a test can assert zero). */
export function cleanCodes(codes) {
  const kept = [], dropped = [];
  for (const c of codes ?? []) (emotionWordsIn(c).length ? dropped : kept).push(c);
  return { kept, dropped };
}
