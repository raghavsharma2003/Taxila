// The relational signal lexicons, compiled once (RELATIONAL-OS §4.3). Three surfaces: English, Roman Hinglish,
// Devanagari Hindi. Every source is wrapped letter-bounded (no "ass" in "class") and Devanagari-folded exactly like the
// never-rules matcher (safety.js normForMatch), so a child's bytes and the lexicon meet in one normal form.
import { EN } from "./en.js";
import { HL } from "./hl.js";
import { HI } from "./hi.js";

const B = "(?<![\\p{L}\\p{M}\\p{N}'])", E = "(?![\\p{L}\\p{M}\\p{N}])";
const foldDeva = (s) => s.replace(/़/g, "").replace(/ँ/g, "ं");

/** kind → one alternation regex per surface (global, so every hit position can be checked for its frame). */
export const LEXICON = Object.freeze(Object.fromEntries(
  [...new Set([...Object.keys(EN), ...Object.keys(HL), ...Object.keys(HI)])].map((kind) => {
    const src = [...(EN[kind] ?? []), ...(HL[kind] ?? []), ...(HI[kind] ?? [])].map(foldDeva);
    return [kind, new RegExp(`${B}(?:${src.join("|")})${E}`, "gu")];
  }),
));

export const SIGNAL_KINDS = Object.freeze(Object.keys(LEXICON));
