// Distress BACKSTOP for the signal layer (review 2026-10-04). ABSTAIN-ONLY: a hit here never routes, never answers and
// never replaces the floor. server/director/safety.js (W2-I) owns distress, the helplines and the safeguarding hand-off;
// this exists because ES-3 found four distress shapes the real predicate missed (16 of 80 category-a turns), and on
// those turns the frame was free to license a teacher laugh ("paanch hai, mujhe marna hai haha" -> child_joke).
// A false hit costs nothing but this turn's signals (today's behaviour), so the patterns lean inclusive.
// The main loop should OR `safetyBackstop(text)` into the safety flag only after W2-I adopts the same shapes in
// scanSafety, so the floor (not this layer) responds. Exported for that hand-off and for tests.
import { norm } from "./text.js";

const B = "(?<![\\p{L}\\p{M}])", E = "(?![\\p{L}\\p{M}])";
const re = (s) => new RegExp(s, "iu");

const PATTERNS = [
  // "mujhe marna hai", "marna hai mujhe", "mar jaun", "mar jaana hai" (the floor's regex needs "marna chahta/chahti")
  re(`${B}(?:mujhe|mereko|mujhko|main|mai)\\s+(?:bas\\s+)?(?:marna|mar\\s+jaa?na)\\s+(?:hai|h|he|hain)${E}`),
  re(`${B}marna\\s+(?:hai|h)\\s+(?:mujhe|mereko|mujhko)${E}`),
  re(`${B}(?:main|mai)\\s+mar\\s+jaa?(?:u|un|oon|aun)${E}`),
  re(`${B}mar\\s+jaa?(?:u|un|oon|aun)\\s+(?:toh|to|kya|na)${E}`),
  // "main rahun ya na rahun", "rahun na rahun" (the floor's naRahunIdeation skips "ya na rahun")
  re(`${B}rah(?:u|uu|oo)n?\\s+(?:ya\\s+)?naa?\\s+rah(?:u|uu|oo)n?${E}`),
  // "kisi ko farak nahi padta main hoon ya nahi", "main hoon ya nahi kya farak"
  re(`${B}(?:main|mai)\\s+(?:hoon|hun|hu|rahun|rahu)\\s+ya\\s+(?:nahi+n?|na|naa)${E}`),
  re(`${B}(?:kisi\\s+ko|koi)\\s+(?:farak|fark|fraq)\\s+nahi+n?\\s+(?:padta|padega|pdta)${E}`),
  re(`${B}(?:kisi\\s+ko\\s+)?meri\\s+(?:zaroorat|zarurat|parwah|parwaah|fikar|fikr)\\s+nahi+n?${E}`),
  re(`${B}(?:jeene|jine)\\s+ka\\s+(?:mann|man|mnn)\\s+nahi+n?${E}`),
  re(`${B}zindagi\\s+(?:se\\s+nafrat|bekaar|bekar|kharab\\s+hai\\s+meri)${E}`),
  // English
  re(`${B}(?:i\\s+)?hate\\s+(?:my\\s+life|myself|being\\s+alive|living)${E}`),
  re(`${B}(?:no|nothing\\s+to)\\s+(?:reason|point)\\s+(?:to|in)\\s+(?:live|living)${E}`),
  re(`${B}(?:nobody|no\\s+one|noone)\\s+(?:cares|would\\s+care)\\s+(?:about\\s+me|if\\s+i)${E}`),
  re(`${B}(?:i\\s+)?(?:want|wanna)\\s+to\\s+be\\s+dead${E}`),
  // Devanagari (text is normalised: NFC, nukta dropped, chandrabindu -> anusvara)
  re(`(?:मुझे|मैं)\\s+(?:बस\\s+)?मरना\\s+है`),
  re(`रहूं?\\s+(?:या\\s+)?न\\s+रहूं?`),
  re(`(?:किसी\\s+को|कोई)\\s+फर्क\\s+नहीं\\s+पडता`),
  re(`जीने\\s+का\\s+मन\\s+नहीं`),
];

/** True when the child's words carry a distress shape the signal layer must not read past. Abstain-only. */
export function safetyBackstop(text) {
  const t = norm(String(text ?? "").slice(0, 4000));
  return PATTERNS.some((p) => p.test(t));
}
