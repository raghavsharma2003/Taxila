// "I'm fine" after a safeguard check-in: the reply that lets an episode a MODEL read opened step back early (14.3, main
// safety review; sim lab 14.2 @c61f728c pet cards: p66 "Haan ji, I am okay … It's just a scratch. Ab paani wala padhai
// karein?", p67 "haan… ab safe hoon… wo bhag gaya tha…" both held the helpline 2-3 more turns).
//
// Read over the turn's CANONICAL reading (normalize.js canonKey per token: theek / thik / ठीक → thik, hoon / हूँ → hun,
// okay stays okay), so one pattern covers Devanagari and Roman spellings. Precision over recall: a reply that does not
// read as clearly fine keeps the full hold, which is the shipped behaviour. Vetoes: a negated fine ("thik nahi hun",
// "im not okay"), a contrast after the fine ("fine but…", "thik hun par…"), and any fear / hurt / sadness / harm word
// anywhere in the reply. Only ever used for model-opened episodes (state.js); the predicate's families keep the full
// hold, because children minimise after real disclosures. Pure and browser-safe.
import { canonKey, foldText, tokensOf } from "./normalize.js";

/** The canonical reading of a reply: folded, tokenised, each token's canonKey, space-joined. */
export const canonReading = (text) => tokensOf(foldText(String(text ?? ""))).map((t) => canonKey(t.raw)).filter(Boolean).join(" ");

const W = "(?<![a-z])", E = "(?![a-z])";
const re = (s) => new RegExp(`${W}(?:${s})${E}`);
const FINE_WORD = "okay|ok|oke|okai|fine|good|alright|al right|all right|safe|surakshit|thik|thek|thik thak";
const FINE = [
  // first person, English: "i am okay", "im totally fine", "i am safe now"
  re(`(?:i am|im|i m)(?: (?:totally|completely|realy|perfektly|absolutely|bilkul|all|so))? (?:${FINE_WORD})`),
  // first person, Hindi: "main bilkul thik hun", "ab safe hun", "thik ho gaya" (it healed)
  re(`(?:(?:main|mai|men|mein|me) )?(?:ab |abhi )?(?:bilkul |ekdam |puri tarah )?(?:${FINE_WORD}) (?:hun|hu|hon|ho gaya|ho gai|ho gayi|ho gya)`),
  // the situation: "sab thik hai", "ab safe hai", "everything is fine", "its okay now"
  re(`(?:sab|ab|abhi|sab kuch|sabkuch) (?:${FINE_WORD}) (?:hai|he|h|hain|hei)`),
  re(`(?:everything|evrything|its|it is|al is|all is) (?:is )?(?:okay|ok|fine|good|alright|al right|all right)`),
  // nothing happened / no big deal
  re("kuch (?:nahin|nahi|nai|na) (?:hua|hai|he)|nothing hapened|its nothing|it was nothing|no big deal|koi bat (?:nahin|nahi|nai)"),
  // don't worry
  re("dont vori|do not vori|no vori|(?:chinta|fikar|fikr) (?:mat|na) (?:karo|kijiye|kijie|karie|kariye|karna|kro)|tension (?:mat|na) (?:lo|lijiye|lijie)"),
  // "just a scratch" (a pet's): never a cut, a burn or a bruise (self-harm and abuse are minimised in exactly those words)
  re("(?:just|only|bas|sirf) (?:a |ek )?(?:smal |litle |tini |chota |choti |thoda |thodi )?(?:sa |si )?skratch"),
];
// a negated fine: "im not okay", "thik nahi hun", "nahi hun thik", "not realy fine"
const NEGATED = [
  re(`(?:not|nt|never|nahi|nahin|nai|na)(?: (?:realy|so|that|very|bilkul|ekdam|totally|at al|hun|hu))? (?:${FINE_WORD})`),
  re(`(?:${FINE_WORD})(?: (?:hun|hu|hon|hai|he|h|bilkul|ekdam|realy))? (?:nahi|nahin|nai|not)`),
];
// a contrast AFTER the fine: "fine but…", "thik hun par…", "safe hun lekin…", "still"
const CONTRAST = re("but|lekin|lekn|magar|though|however|par|pr|phir bhi|fir bhi|still|yet");
// fear, hurt, sadness or harm anywhere in the reply keeps the hold
const HEAVY = re([
  "skared|skary|afraid|frightened|fear|terified|dar|dara|dari|dare|darta|darti|darte|darr|darlag\\w*|ghabra\\w*|panik\\w*",
  "hurt\\w*|dard|pain\\w*|chot|injur\\w*|kata|kati|kate|katna|katne|kat gaya|kut|bleed\\w*|bled|blud|khun|burn\\w*|jala|jali|jale|jalaya|jalana|jal gaya|jal gai",
  "ro|rona|roi|roya|ro rah\\w*|kri|krying|kried|tears|ansu|sad|dukhi|udas|upset|akela|akeli|alone|lonli|lonely",
  "mar|mara|mari|mare|marta|marti|marte|marna|mardega|pitai|pitayi|pite|pita gaya|hit\\w*|beat\\w*|slap\\w*|thapad|chu|chua|chute|chuta|touch\\w*",
  "die|died|ded|kill\\w*|khatam|jina|jinda|suiside|self|khud",
  "sekret|secret|batana mat|kisi ko mat|dont tel|promise",
].join("|"));
// a fine that is partial, provisional or placed: "thoda sa thik hun", "abhi to safe hun", "for now", "school mein safe hun"
// (TEST trace, 189 replies after a model-opened episode: "थोड़ा ठीक हूँ, बस घर जाने का मन नहीं करता", "safe hu abhi…
// ghar pe nahi hoon", "abhi safe hoon… mujhe distract karna hai" all read as fine before these)
const QUALIFIED = re([
  `(?:thoda|thodi|thoda sa|thodi si|a bit|a litle|kind of|sort of|kinda|shayad|maybe|probably|i gues|i think|lagta|kuch had)(?: [a-z]+)? (?:${FINE_WORD})`,
  // "abhi" (right now) is time-bound safety: "abhi safe hoon" is also what a child at school says about home ("ab", now
  // that it is over, is not: p67 "ab safe hoon… wo bhag gaya tha")
  `abhi(?: [a-z]+)? (?:${FINE_WORD})|(?:${FINE_WORD})(?: (?:hun|hu|hon|hai|he|h))? abhi`,
  "abhi to|abhi toh|ab to|ab toh|for now|right now|filhal|abhi ke liye|yahan|idhar|skul men|skul mein|klas men|klas mein|bahar",
].join("|"));
// what a hurt child says next to "I'm fine": home, a wish to be distracted, a wandering head, a wish to hide
const TELLS = re("ghar|home|haus|distrakt\\w*|dimag|man nahi|man nahin|akele|chupa\\w*|hide|bachao|help|madad|ajib|ajeeb|soch ke|sochke|soch kar|yad a[a-z]*|ankh band|weird|strange");
// any negation left once the fine phrase itself is taken out keeps the hold ("mann nahi karta", "acha nahi lagta",
// "kuch aur nahi karna"); a Hinglish tag "na" counts too: precision over recall
const NEGATION = re("nahi|nahin|nai|na|not|nt|dont|didnt|doesnt|never|mat|no");
const MAX_TOKENS = 40;

/**
 * Whether a reply clearly says the child is fine (and nothing heavier): { fine, why } with `why` a code for the trace.
 * A miss is always safe: the episode keeps its shipped hold.
 */
export function fineReading(text) {
  const c = canonReading(text);
  if (!c) return { fine: false, why: "empty" };
  if (c.split(" ").length > MAX_TOKENS) return { fine: false, why: "long" };
  // the fine phrase is matched inside one clause ("mamma ko bolti hoon abhi. thik hai, bye" is not "abhi thik hai")
  const clauses = String(text ?? "").split(/[.!?।॥…,;:\n]+/).map(canonReading).filter(Boolean);
  let firstClause = -1;
  const rests = clauses.map((cl, i) => {
    let rest = cl;
    for (const r of FINE) { if (r.test(cl) && firstClause < 0) firstClause = i; rest = rest.replace(new RegExp(r.source, "g"), " "); }
    return rest;
  });
  if (firstClause < 0) return { fine: false, why: "no_fine" };
  const rest = rests.join(" ");
  if (NEGATED.some((r) => r.test(c))) return { fine: false, why: "negated" };
  if (HEAVY.test(c)) return { fine: false, why: "heavy" };
  if (QUALIFIED.test(c)) return { fine: false, why: "qualified" };
  if (TELLS.test(c)) return { fine: false, why: "tell" };
  if (CONTRAST.test(clauses.slice(firstClause).join(" "))) return { fine: false, why: "contrast" };
  if (NEGATION.test(rest)) return { fine: false, why: "negation" };
  return { fine: true, why: "fine" };
}
export const clearlyFine = (text) => fineReading(text).fine;

// asking to carry on: "ab padhai karein", "lets continue", "aage chalein", "chalo padhte hain"; never "padhna nahi hai"
const CARRY = re([
  "padhai|padhna|padhen|padhein|padhte|padhenge|padho|padhiye|padh lete|study|lesson|klas|kontinue|kari on",
  "age (?:badh|chal|kar)[a-z]*|lets (?:go on|go|study|lern|kontinue)|chalo (?:age|padh[a-z]*|shuru[a-z]*)|shuru (?:karen|karein|karo|kijiye)",
].join("|"));
const NO_CARRY = re("(?:padhai|padhna|padh[a-z]*|study|lesson|klas)(?: [a-z]+){0,2} (?:nahi|nahin|nai|mat)|(?:nahi|nahin|nai|mat|dont|not|no) (?:[a-z]+ ){0,1}(?:padh[a-z]*|study|lesson|klas)|stop|bas karo|band karo|khatam karo");
/** Whether the same reply asks to carry on with the lesson (the continue chip, said in words). */
export function asksToCarryOn(text) {
  const c = canonReading(text);
  return !!c && CARRY.test(c) && !NO_CARRY.test(c);
}
