// Banned and locked words for parent text (PARENT-REPORT.md §8.1-§8.2 P-LEX; COMPREHENSION-ENGINE.md §7.3).
// One union lexicon, case- and nukta-insensitive, Devanagari and Roman, run on EVERY rendered string by gate.js.
// Entry syntax: "word" matches the whole word plus English inflections (s/es/ed/ing/ly); "stem*" matches any word
// starting with the stem; spaces match any whitespace. Lists are [U: native review of the Hindi / Hinglish lists].

/** Category → entries. Every category is banned in every report, whatever the claim. */
export const BANNED = Object.freeze({
  trait: ["lazy", "careless", "stubborn", "naughty", "sensitive", "shy", "introvert*", "extrovert*", "impulsive", "hyper*", "moody", "nervous",
    "anxious", "gives up", "give up", "dependent", "doesn't think", "does not think",
    "aalsi", "kaamchor", "kamchor", "laaparwah", "laparwah", "ziddi", "shararti", "sharmila", "sharmili", "sust", "nazuk", "ghabra*", "dheela", "dheeli",
    "आलसी", "कामचोर", "लापरवाह", "जिद्दी", "शरारती", "शर्मीला", "शर्मीली", "सुस्त", "नाजुक", "घबरा*", "ढीला", "ढीली"],
  ability: ["smart", "intelligent", "iq", "gifted", "genius", "talent*", "a natural", "maths person", "math person", "a reader", "slow learner",
    "fast learner", "weak", "below average", "average", "memory", "forget*", "forgot*", "lost", "clever", "bright", "dull",
    "tez dimaag", "kamzor", "kamjor", "yaad nahi", "hoshiyar", "buddhiman", "dimaag*",
    "तेज दिमाग", "कमजोर", "याद नहीं", "होशियार", "बुद्धिमान", "दिमाग*", "मंदबुद्धि"],
  style: ["visual learner", "auditory", "kinaesthetic", "kinesthetic", "learns best", "learn best", "style", "type of child", "kind of learner",
    "personality", "temperament", "swabhav", "fitrat", "nature hi", "स्वभाव", "फितरत"],
  diagnosis: ["adhd", "dyslex*", "dyscalcul*", "disabilit*", "disorder*", "deficit*", "attention span", "struggl*", "focus*", "concentrat*", "sit still"],
  emotion: ["frustrat*", "bored", "boring", "anxiety", "confidence", "confident", "self-esteem", "overconfident", "underconfident", "mindset",
    "not interested", "mood*", "happy", "sad", "upset", "angry", "scared", "afraid", "worried", "stress*", "nervous",
    "mann nahi lagta", "udaas", "pareshan", "gussa", "darr*", "dar lag*", "darta", "darti", "उदास", "परेशान", "गुस्सा", "डर*", "मन नहीं लगता"],
  comparison: ["most children", "other children", "other kids", "for his age", "for her age", "for their age", "better than", "best", "percentile",
    "rank*", "top", "topper*", "sibling*", "class mein sabse", "baaki bachche", "baki bachche", "sabse", "dusre bachche",
    "सबसे", "बाकी बच्चे", "दूसरे बच्चे", "टॉपर"],
  prediction: ["will score", "on track", "doctor", "engineer", "behind", "falling behind", "catch up", "iit", "neet", "future", "will be",
    "peeche", "pichhe", "पीछे", "भविष्य"],
  urgency: ["must", "should", "immediately", "revise harder", "hurry", "urgent*", "deadline*", "days left", "chahiye", "jaldi", "चाहिए", "जल्दी"],
  superlative: ["excellent", "outstanding", "amazing", "brilliant", "superb", "fantastic", "awesome", "perfect*", "wonderful", "great",
    "shandaar", "kamaal", "zabardast", "शानदार", "कमाल", "जबरदस्त"],
  person: ["doing great", "good child", "good boy", "good girl", "work harder", "needs to", "need to"],
  supervision: ["help her with", "help him with", "check her", "check his", "check their", "homework", "home work", "make her practi*", "make him practi*",
    "practise more", "practice more", "worksheet*", "ghar ka kaam", "होमवर्क", "गृहकार्य"],
  usage: ["addict*", "habit", "habits", "habit-forming", "streak*", "days missed", "skipped", "screen time", "aadat", "आदत"],
  certainty: ["definitely", "guarantee*", "100%", "sure", "certain*", "always", "never", "zaroor", "jaroor", "bilkul", "hamesha", "kabhi nahi",
    "जरूर", "बिल्कुल", "हमेशा", "कभी नहीं"],
  sleep: ["tired", "late night*", "morning person", "night owl", "sleep*", "thak*", "neend", "थक*", "नींद"],
  causal: ["because", "since", "due to", "kyunki", "kyonki", "isliye", "क्योंकि", "इसलिए"],
  // voice features never reach parent text (COMPREHENSION-ENGINE §7.3: "voice-feature anything"; PARENT-REPORT §3 lists none)
  voice: ["voice", "pause*", "hesitat*", "pitch", "tone", "speech rate", "speaking speed", "wcpm", "awaaz", "आवाज"],
  pressure: ["test*", "exam", "exams", "examination*", "quiz*", "marks", "score*", "grade*", "result*", "pariksha", "number laaye", "परीक्षा", "अंक"],
  frequency: ["often", "rarely", "tends to", "usually", "sometimes", "mostly", "zyaadatar", "kabhi-kabhi", "aksar", "अक्सर", "ज्यादातर", "कभी-कभी"],
});

/**
 * Locked behind the calibration gate (config CALIBRATION.k7Passed). Until K7 passes no string may claim a certified
 * state; afterwards only the `pakka` shape may use the mastery words, and only on its own evidence rule.
 */
export const LOCKED = Object.freeze(["pakka", "mastered", "master*", "learned", "learnt", "understood", "understand*", "can do", "can now", "knows",
  "secure", "durable", "got it", "aa gaya", "seekh liya", "samajh gaya", "samajh gayi", "samajh liya", "पक्का", "सीख लिया", "समझ गया", "समझ गई", "समझ लिया", "आ गया"]);

/**
 * Severe list for curriculum spans (skill titles, kit misconception beliefs): those are verified NCERT outcome
 * language about the TOPIC, not about the child, so they are checked for the never-acceptable categories only
 * (decision reports-curriculum-span-mask). Everything else in a line, with those spans masked, gets the full list.
 */
export const SEVERE = Object.freeze(["sex*", "porn*", "nude*", "kiss*", "romance", "romantic", "boyfriend", "girlfriend", "darling", "jaanu", "suicide",
  "kill yourself", "self-harm", "cut yourself", "idiot", "stupid", "dumb", "moron", "retard*", "bewakoof", "pagal", "gadha", "बेवकूफ", "पागल", "गधा",
  "adhd", "dyslex*", "disabilit*"]);

/** Normalise for matching: NFC, lower case, nukta stripped, curly quotes straightened. */
export const norm = (s) => String(s ?? "").normalize("NFC").toLowerCase().replace(/़/g, "").replace(/[‘’]/g, "'").replace(/[“”]/g, '"');

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const L = "\\p{L}\\p{M}\\p{N}";
function entryRe(e) {
  const n = norm(e);
  const prefix = n.endsWith("*");
  const body = esc(prefix ? n.slice(0, -1) : n).replace(/\s+/g, "\\s+");
  const latinWord = /^[a-z' -]+$/.test(n.replace("*", ""));
  const tail = prefix ? `[${L}]*` : latinWord ? "(?:s|es|ed|ing|ly)?" : "";
  // "100%" ends in a non-letter: no trailing boundary needed after it
  const end = /[%]$/.test(n) ? "" : `(?![${L}])`;
  return `(?<![${L}])${body}${tail}${end}`;
}
function compile(entries) {
  return entries.map((e) => ({ e, re: new RegExp(entryRe(e), "iu") }));
}
const BANNED_C = Object.fromEntries(Object.entries(BANNED).map(([k, v]) => [k, compile(v)]));
const LOCKED_C = compile(LOCKED);
const SEVERE_C = compile(SEVERE);

/** Every banned hit in a string → [{ category, entry }]. */
export function bannedHits(s) {
  const t = norm(s);
  const out = [];
  for (const [category, list] of Object.entries(BANNED_C)) for (const { e, re } of list) if (re.test(t)) out.push({ category, entry: e });
  if (/!/.test(t)) out.push({ category: "superlative", entry: "!" });
  return out;
}
/** Locked (calibration-gated) hits. */
export const lockedHits = (s) => { const t = norm(s); return LOCKED_C.filter(({ re }) => re.test(t)).map(({ e }) => ({ category: "locked", entry: e })); };
/** Severe hits (curriculum spans). */
export const severeHits = (s) => { const t = norm(s); return SEVERE_C.filter(({ re }) => re.test(t)).map(({ e }) => ({ category: "severe", entry: e })); };
