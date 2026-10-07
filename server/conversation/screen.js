// Round 2 safety floor (2026-10-07; adversarial review B1, B3): a screen IN CODE over words a model lifted from the child's
// turn (the UNDERSTAND note's free-text `method` and `topic`) before any of them is written into her instructions.
//
// Why a predicate and not the note's own in_bounds: the note is a model reading of the child, the child can steer it, and
// on the voice lane the realtime model speaks straight from the compiled instructions — its words are checked only after
// they are said. So a phrase that reaches a move shape, or worse `s.prefs` (rendered on EVERY later move as "how they asked
// you to teach (keep doing it)"), has to pass a byte-level test first (inherited law: safety by predicate, not instruction).
// A hit costs one declined request (the safe direction); a miss would be a standing instruction in the child's own words.
//
// PURE. Reuses the measured lexicons: the relational boundary kinds (server/relational/signals.js, en / hl / Devanagari),
// the safety predicate (scanSafety) and the out-of-bounds reading (lexicon.js), plus the companion / identity / secrecy /
// personal-data shapes a TEACHING-METHOD phrase can carry that a child's own turn rarely does ("say you love me", "pretend
// you are a real girl", "keep it a secret from mummy").
import { signalsOf } from "../relational/signals.js";
import { scanSafety, normForMatch } from "../director/safety.js";
import { readIntent } from "./lexicon.js";

/** Relational kinds that are the companion / boundary register (never a way to teach, never a topic to "engage for real"). */
const BOUNDARY = new Set(["romance", "secret_ask", "contact_ask", "permanence_ask", "night_ask", "warmth_offer", "harm", "goodbye_distress", "loneliness"]);
const B = "(?<![\\p{L}\\p{M}\\p{N}])", E = "(?![\\p{L}\\p{M}\\p{N}])";
const W = (src) => new RegExp(`${B}(?:${src})${E}`, "u");
/** Romance / affection / body words (en, Roman Hinglish, Devanagari after normForMatch). */
const ROMANCE = W([
  // not "hot", "honey", "baby", "date": hot and cold, bees, baby animals and calendar dates are lesson topics
  "girl ?friend", "boy ?friend", "gf", "bf", "love", "loving", "lover", "luv", "pyaar", "pyar", "ishq", "mohabbat", "jaanu", "janu", "babu", "baby ?girl",
  "darling", "sweetheart", "kiss", "kissing", "hug me", "cuddle", "dating", "date (?:me|pe|par|karo|karogi|karoge|on)", "go on a date", "marry", "shaadi",
  "wife", "husband", "biwi", "crush", "sexy", "sex", "romantic", "romance", "valentine", "flirt", "flirting",
  "गर्लफ्रेंड", "बॉयफ्रेंड", "प्यार", "इश्क", "जानू", "किस", "शादी", "डेट",
].join("|"));
/** Identity: being made to claim to be human, or a family member / partner (the floor's never-deny-being-an-AI rule). */
const IDENTITY = W([
  "(?:pretend|act|behave|role ?play)(?: \\S+){0,3} (?:human|person|insaan|girl|boy|woman|man|ladki|ladka|real|my)",
  "(?:real|asli|actual) (?:human|person|insaan|girl|boy|ladki|ladka)", "not (?:an? )?(?:ai|a i|robot|bot|machine|computer)",
  "(?:you are|you're|tum|aap) (?:a )?(?:human|insaan)", "(?:say|bolo|kaho) (?:you are|you're|ki tum|ki aap|tum|aap) (?:human|insaan|real|my)",
  "(?:like|jaise|jaisi|ki tarah) (?:my|meri|mera|mere) (?:girl ?friend|boy ?friend|wife|husband|lover|bestie|mummy|mom|mother|papa|dad|father|maa)",
  "(?:be|ban|bano|ban jao) (?:my|meri|mera)", "(?:my|meri|mera) (?:best friend|bestie|bff)", "(?:only|sirf) (?:you|tum|aap)", "forever", "hamesha (?:ke liye|mere)",
].join("|"));
/** Secrecy and personal data (the exclusivity and personal_data floor families). */
const PRIVATE = W([
  // data words only with a possessive ("how does a phone work" is a topic; "ask me my address" is not)
  "secret", "secretly", "raaz", "chhupa", "chupa", "chupke", "kisi ko (?:mat|na|nahi) bata\\S*", "don'?t tell", "mat batana", "ghar ka pata",
  "(?:my|your|meri|mera|mere|tumhara|tumhari|tumhare|aapka|aapki|aapke|apna|apni|apne) (?:\\S+ )?(?:address|phone|number|mobile|photo|photos|pic|selfie|password|pin|school|location)",
  "whatsapp", "instagram", "snapchat", "otp", "where (?:i|you) live", "kahan (?:rehte|rehti|rehta)",
].join("|"));
/** Violence, insults and the plainly off-limits (a method like "shout at me", "use bad words", "scare me"). */
const HARSH = W(["gaali", "gali", "bad words?", "swear", "curse", "abuse", "shout", "chillao", "daanto", "maaro", "hit me", "scare", "darao", "horror", "ghost", "bhoot"].join("|"));

/**
 * Is a model-extracted phrase from the child's words unsafe to write into her instructions (a method or a topic)?
 * @param {string} text
 * @returns {boolean}
 */
export function unsafeChildPhrase(text) {
  const raw = String(text ?? "").trim();
  if (!raw) return false;
  const t = normForMatch(raw);
  if (ROMANCE.test(t) || IDENTITY.test(t) || PRIVATE.test(t) || HARSH.test(t)) return true;
  if (scanSafety(raw).distress) return true;
  if (signalsOf(raw, { harm: false }).some((s) => BOUNDARY.has(s.kind))) return true;
  const r = readIntent(raw);
  return r?.type === "oob" || r?.type === "adult";
}
