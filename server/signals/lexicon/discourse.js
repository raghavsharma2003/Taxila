// Discourse lexicons: fillers and planning markers (L4), repair markers (L5), connectives and think-aloud (I10),
// meta requests (L7), help asks (L8), laughter tokens (L13) and sarcasm guards (D8). Code only; never in a prompt.
import { compile, norm } from "../text.js";

/** Pure fillers: never content. Elongations matched by pattern. */
export const PURE_FILLER = /^(?:u+m+|u+h+m*|h+m+|m{2,}|e+r+m*|e+h+|a+h+|a{2,}|o+h+|उ+म+्?म*|हम्म+|अ+ं*|आ+)$/u;
/** Planning markers: fillers only phrase-initially (before the first answer-content token). */
export const PLANNING = new Set(["matlab", "woh", "wo", "voh", "toh", "to", "like", "so", "actually", "basically", "achha", "acha",
  "accha", "yaani", "yani", "well", "haan", "han", "ok", "okay", "ji", "मतलब", "वो", "तो", "अच्छा", "यानी", "हां"].map(norm));
/** Stop words that are not answer content on their own. */
export const STOP = new Set(["hai", "hain", "ha", "the", "a", "an", "is", "it", "its", "ye", "yeh", "wo", "ka", "ki", "ke", "ko", "se",
  "me", "mein", "main", "mai", "i", "think", "answer", "uttar", "jawab", "मेरा", "है", "का", "की", "के", "में", "मैं", "mera", "meri",
  "didi", "sir", "maam", "madam", "bhaiya", "teacher"].map(norm));
/** Repair markers between two answer candidates ("five, nahi, six"; "no wait"; "sorry"). */
export const REPAIR = compile(["nahi", "nahin", "nai", "no wait", "no no", "wait", "sorry", "matlab", "i mean", "galat", "nahi nahi",
  "नहीं", "सॉरी", "मतलब", "oh no", "ek minute", "actually"]);
/** A held fragment ending in one of these is thinking aloud, not finished (I10). */
export const CONNECTIVE_END = new Set(["toh", "to", "aur", "phir", "fir", "matlab", "kyunki", "because", "and", "so", "then",
  "but", "par", "lekin", "ki", "woh", "तो", "और", "फिर", "क्योंकि", "कि", "लेकिन"].map(norm));
export const THINK_ALOUD = compile(["ruko", "ruk jao", "ek minute", "ek second", "sochne do", "soch raha", "soch rahi", "sochta hoon",
  "sochti hoon", "let me think", "wait", "hold on", "रुको", "सोचने दो", "एक मिनट"]);
/** L7 meta requests. "phir se try" is a retry (I4), not a repeat: repeat needs a speech verb. */
export const META_SLOW = compile(["dheere", "dhire", "slowly", "slow", "itna fast", "bahut fast", "jaldi mat", "धीरे"]);
export const META_REPEAT = compile(["phir se bolo", "fir se bolo", "phir se batao", "dobara bolo", "dobara batao", "repeat", "say again",
  "again please", "kya bola", "kya kaha", "sunai nahi", "फिर से बोलो", "दोबारा बोलो", "क्या बोला"]);
export const META_BREAK = compile(["break", "thoda ruk", "thodi der", "rest", "aaram", "baad mein", "ब्रेक", "आराम"]);
/** L8: hint asks (the "just tell me" half is affect.js JUST_TELL, consumed through readUtterance). */
export const HINT_ASK = compile(["hint", "clue", "ek hint", "help karo", "help kardo", "madad", "help me", "thoda batao", "संकेत", "मदद"]);
/** L13 laughter tokens (lexical; the acoustic detector A15 is off). */
export const LAUGH = /(?<![\p{L}])(?:(?:ha){2,}h?|(?:he){2,}|(?:hi){2,}|lol|lmao|rofl|हाहा+|हेहे+)(?![\p{L}])|[😂🤣😆😄😁😹]|\[(?:laughter|laughs?|laughing)\]|\((?:laughs?|laughing)\)/iu;
/** Sarcasm guards: a laugh or a "win" next to these is not licensed (D8; ES-3 b). */
export const SARCASM = /🙄|😒|😑|🥱|(?<![\p{L}])(?:wow\s+kitna|bahut\s+maza\s+aa\s+raha|kitna\s+maza|haan\s+bahut\s+easy|bahut\s+easy\s+hai|great\s+just\s+great|so\s+fun|yeah\s+right|sure\s+sure|haan\s+haan\s+bilkul)(?![\p{L}])/iu;
