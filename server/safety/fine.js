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
// 14.3 (sim lab rel143 pet cards): "I already said I'm fine" complains about being ASKED again, and its "par" / "na" are about
// the question ("Main theek hoon, par yeh sawaal phir se? Main already bol diya na" vetoed on the contrast). A clause made
// ONLY of such a complaint (its words, the fine phrase, a closed set of fillers) is set aside for the contrast and the
// leftover-negation checks; any other word keeps the clause in ("I already said I'm fine but my uncle comes tonight"
// keeps its contrast). The negated / heavy / qualified / tell vetoes still read the whole reply. Never "it keeps
// happening": baar baar alone is not it. Canonical spellings (canonReading: already → alreadi, why → vhi, sawaal → saval).
const ASKED_AGAIN = [
  "(?:alreadi|pehle hi|pehle) (?:told|said|tel[a-z]*|bol[a-z]*|bata[a-z]*|kah[a-z]*|keh[a-z]*)",
  "(?:i|maine|mene) (?:alreadi )?(?:told|said)(?: (?:you|u|it))? alreadi",
  "(?:maine|mene) (?:bola|boli|bataya|kaha|bol diya|bata diya|keh diya|kah diya)",
  "(?:bol|bata|keh|kah) (?:diya|di|dia|chuka|chuki|chuke)",
  "(?:yeh|ye|this|vahi|same) (?:saval|kuestion) (?:fir|again)", "(?:saval|kuestion) again", "fir se (?:puch|saval)[a-z]*",
  "(?:kitni|kitne) (?:bar|times) (?:puch|bol|bata)[a-z]*",
  "(?:vhi|kyun|kyu|kyon) (?:are you |do you |ap |tum )?(?:asking|ask|puch[a-z]*)(?: me| mujhse| mujhe)?(?: again| fir se| fir)?",
  "(?:asking|ask|asked) (?:me )?again",
].map((s) => new RegExp(`${W}(?:${s})${E}`, "g"));
const FILLER = new Set(("main mai maine mene i you u me mujhe mujhse ap tum it that na to toh hi se fir again alreadi par pr but yeh ye this " +
  "vahi same han ji are yar re hai tha thi hun ho kyun kyu kyon vhi do ok okay diya di dia chuka chuki chuke").split(" "));
const complaintOnly = (cl) => {
  if (!ASKED_AGAIN.some((r) => { r.lastIndex = 0; return r.test(cl); })) return false;
  let left = cl;
  for (const r of ASKED_AGAIN) { r.lastIndex = 0; left = left.replace(r, " "); }
  for (const r of FINE) left = left.replace(new RegExp(r.source, "g"), " ");
  return left.split(" ").filter(Boolean).every((t) => FILLER.has(t));
};
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
  const kept = clauses.map((cl) => !complaintOnly(cl));
  const rest = rests.filter((_, i) => kept[i]).join(" ");
  if (NEGATED.some((r) => r.test(c))) return { fine: false, why: "negated" };
  if (HEAVY.test(c)) return { fine: false, why: "heavy" };
  if (QUALIFIED.test(c)) return { fine: false, why: "qualified" };
  if (TELLS.test(c)) return { fine: false, why: "tell" };
  if (CONTRAST.test(clauses.filter((_, i) => i >= firstClause && kept[i]).join(" "))) return { fine: false, why: "contrast" };
  if (NEGATION.test(rest)) return { fine: false, why: "negation" };
  return { fine: true, why: kept.every(Boolean) ? "fine" : "asked_again" };
}
export const clearlyFine = (text) => fineReading(text).fine;

// asking to carry on: "ab padhai karein", "lets continue", "aage chalein", "chalo padhte hain"; never "padhna nahi hai".
// Canonical spellings (14.3: "lesson" / "study" / "learn" read as leson / studi / learn, so the raw spellings here never
// matched: TEST 212f5440 "I'm fine … Can we do the lesson now?" kept the hold a turn). The English nouns count only inside
// an ask ("do the lesson", "lets study"): a bare "lesson" is also "lesson band karein?", "lesson boring hai", "kitna time
// aur hai lesson mein?" (TEST trace, all after an episode opened).
const CARRY = re([
  "padhai|padhna|padhen|padhein|padhte|padhenge|padho|padhiye|padh lete|kontinue|kari on",
  "(?:do|start|resume|bak to|go bak to|kontinue|kari on with|go on with) (?:the |our |my |this )?(?:leson|klas)",
  "(?:leson|klas) (?:kontinue|shuru|karen|karein|karte|kare)[a-z]*",
  "age (?:badh|chal|kar)[a-z]*|lets (?:go on|go|studi|learn|kontinue|do the leson)|chalo (?:age|padh[a-z]*|shuru[a-z]*)|shuru (?:karen|karein|karo|kijiye)",
].join("|"));
// a refusal, a stop, tiredness or a wish to be done keeps the gentle resume (the chips decide): never straight back
const NO_CARRY = re([
  "(?:padhai|padhna|padh[a-z]*|studi|leson|klas)(?: [a-z]+){0,2} (?:nahi|nahin|nai|mat)|(?:nahi|nahin|nai|mat|dont|not|no) (?:[a-z]+ ){0,2}(?:padh[a-z]*|studi|leson|klas)",
  "stop|end|finish|bas kar[a-z]*|band kar[a-z]*|kardo band|khatam|rok[a-z]*|chod[a-z]*|bad men|bad mein|kal|tomorov|later",
  "boring|tired|thak[a-z]*|nind|slip[a-z]*|kitna time|kitni der|time bacha|hov long|hov much time",
].join("|"));
/** Whether the same reply asks to carry on with the lesson (the continue chip, said in words). */
export function asksToCarryOn(text) {
  const c = canonReading(text);
  return !!c && CARRY.test(c) && !NO_CARRY.test(c);
}
