// Round 2, stream latency: the ACKNOWLEDGEMENT decision. Round 3 (stream relational-human): it is PLAYED now, through
// POST /api/lesson/turn-ack (server/latency/routes.js) and the device's AckClient (src/latency/ack.ts); kill switch
// TAXILA_ACK=off (server) / ?ack=0 (device). docs/design/round3/relational-human/RESEARCH.md §3.
//
// What a human teacher does while she thinks about a child's answer: she says the child's answer back ("chhe faces…"),
// neutral, the same for right and wrong, and then responds (revoicing: O'Connor & Michaels 1993; uptake: Demszky et al.
// 2021). A behavioural filler improved perceived response time and humanlikeness (Gonzales et al. 2025, adults, VR); a
// fixed filler list heard daily becomes a tic (rj-static-filler-list), so the ack here is ONLY the uptake echo built in
// code from the child's own transcript — the same closed-class token screen as the uptake prelude
// (server/voice/expressive/prelude.js, HV-16) — and when there is no such token there is no ack (no "hmm" loop).
//
// Hard rules (the child-safety floor is above latency):
//  - never on a safety turn: decided only AFTER classify() has returned (its model distress read, whenever the floor's own
//    needsModelDistressRead asks for one) and the predicate (scanSafety) is clean, and never while a safeguarding episode is
//    open, on a content-filter block, or a duplex partial-safety hit;
//  - never a verdict: the token is the child's own word, the audio is rendered from the token ALONE (the same clip for a
//    right and a wrong answer, by construction: ackAudio.js caches by token), prosody neutral, timed from a fixed floor
//    (ACK_FLOOR_MS) so a bytes-decided right answer is not heard back sooner than a model-graded wrong one, and only on a
//    GRADED answer turn (a non-answer — "nahi pata", a request, small talk — gets no echo);
//  - never on a goodbye / stop (NEVER MANIPULATE: nothing that holds a leaving child);
//  - never two turns running, at most ACK_WINDOW_MAX in any ACK_WINDOW turns (rj-w2g-filler-window-only: a window alone let
//    a tic in; the no-consecutive rule is kept beside it).
import { keyTokenOf } from "../brain/moment.js";
import { preludeTokenOk } from "../voice/expressive/prelude.js";
import { isNumberToken, norm } from "../signals/text.js";
import { createHash } from "node:crypto";
import { scanSafety, normForMatch } from "../director/safety.js";
import { signalsOf } from "../relational/signals.js";
import { numberPhrases, WORKING_ALOUD } from "../grading/spoken-number.js";

const GRADED = new Set(["correct", "incorrect", "partial", "misconception"]);

/** The child's answer token: the last number (digits or a number word) if any, else the moment's key token. */
export function answerTokenOf(text) {
  const t = String(text ?? "").trim();
  if (!t) return null;
  const digits = t.match(/\d{1,4}(?:[./]\d{1,4})?/g);
  if (digits?.length) return digits.at(-1);
  const words = t.split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean);
  for (let i = words.length - 1; i >= 0; i--) if (isNumberToken(norm(words[i]))) return words[i];
  return keyTokenOf(t);
}

/**
 * PURE. The ack for a classified child turn, or { none: reason }.
 * @param {{ text: string, cls: any, predicateDistress: boolean, safeguardOpen?: boolean, pendingSafety?: boolean,
 *   lastAckTurn?: number | null, turn: number, names?: string[], vocab?: string[] }} x
 */
export function ackOf(x) {
  const c = x.cls;
  if (!c) return { none: "unclassified" };
  if (x.predicateDistress || c.flags?.distress || x.safeguardOpen || x.pendingSafety || c.source === "content_filter") return { none: "safety" };
  if (c.flags?.wantsToStop || c.request?.type === "stop" || c.request?.type === "goodbye") return { none: "leaving" };
  if (!GRADED.has(c.outcome)) return { none: "not_an_answer" };
  // the previous turn had one (a re-sent prefetch of the SAME turn decides again: not "consecutive")
  if (x.lastAckTurn != null && x.turn - x.lastAckTurn === 1) return { none: "consecutive" };
  const token = answerTokenOf(x.text);
  if (!token) return { none: "no_token" };
  if (!preludeTokenOk(token, { names: x.names ?? [], vocab: x.vocab ?? [] })) return { none: "token_screen" };
  return { kind: "echo", token };
}

/** Turn window of the ack governor and its cap (≤ 4 echoes in any 10 turns, never two running). */
export const ACK_WINDOW = 10, ACK_WINDOW_MAX = 4;
/**
 * The earliest an ack may be ready, from the start of the perception it waits on (ms). classify() returns at once for a
 * bytes-decided short right answer (classify.js needsModelDistressRead: an exact key of < 3 words needs no model read) and
 * after a ~0.7-0.9 s model call for a wrong one; without a floor the echo of a right answer would come ~0.7 s sooner — a
 * timing verdict leak (HV-16). Measured in evals/relational-human (ack ready right vs wrong).
 */
export const ACK_FLOOR_MS = Number(process.env.TAXILA_ACK_FLOOR_MS ?? 750);
/**
 * The FIXED decision instant (ms after the perception started), or null for the floor-only rule above. With it the ack is
 * decided exactly then — never sooner, and when classify has not settled by then there is no ack ("late"): the moment
 * she says the child's answer back carries no information about the verdict (a floor alone does not: ack-leak run A,
 * 2026-10-09, right p50 1,105 vs wrong 1,422 ms; Kendrick & Torreira 2015: response delay is read as a dispreferred answer).
 * Set from the measured classify tail (RESEARCH.md §3.4, evals/relational-human/ack-leak.mjs).
 */
export const ACK_AT_MS = process.env.TAXILA_ACK_AT_MS === "floor" ? null : Number(process.env.TAXILA_ACK_AT_MS ?? 1200);

const WORD_SPLIT = /[^\p{L}\p{M}\p{N}/.]+/u;

/**
 * The words the ack says: the child's answer token, plus the noun phrase right after it when EVERY word of it is in the
 * item's own vocabulary (its prompt, key or accepted answers: "chhe faces", "aath clay balls") — words the kit already
 * holds, never a child-only word — and the phrase ENDS there (≤ 2 words; a run that would be cut mid-phrase, "eight clay
 * | balls", falls back to the token alone: measured 2026-10-09, after-local-2 turn 19 said "eight clay").
 * @param {string} text  the child's words
 * @param {string} token answerTokenOf(text)
 * @param {string[]} vocab item words (prompt + key + accepted answers)
 */
export function ackPhraseOf(text, token, vocab = []) {
  const bare = (w) => String(w ?? "").replace(/^[./]+|[./]+$/g, "");
  const words = String(text ?? "").split(WORD_SPLIT).map(bare).filter(Boolean);
  const i = words.lastIndexOf(bare(token));
  if (i < 0) return bare(token) || token;
  const pool = new Set(vocab.flatMap((v) => String(v ?? "").toLowerCase().split(WORD_SPLIT).map(bare)).filter((w) => w.length >= 3));
  const inPool = (w) => !!w && w.length >= 3 && pool.has(w.toLowerCase()) && preludeTokenOk(w, { vocab: [...pool] });
  const run = [];
  for (let k = i + 1; k < words.length && run.length < 3 && inPool(words[k]); k++) run.push(words[k]);
  if (!run.length || run.length > 2) return words[i];
  return [words[i], ...run].join(" ");
}

/**
 * PURE. ackOf + the window governor + the phrase. `history` = the lesson's earlier ack turns (numbers).
 * @param {Parameters<typeof ackOf>[0] & { history?: number[], itemWords?: string[] }} x
 * @returns {{ kind: "echo", token: string, phrase: string } | { none: string }}
 */
export function ackPlanOf(x) {
  const a = ackOf({ ...x, lastAckTurn: (x.history ?? []).filter((t) => t < x.turn).at(-1) ?? x.lastAckTurn ?? null });
  if (!a.token) return a;
  const recent = (x.history ?? []).filter((t) => t < x.turn && x.turn - t < ACK_WINDOW);
  if (recent.length >= ACK_WINDOW_MAX) return { none: "window" };
  return { kind: "echo", token: a.token, phrase: ackPhraseOf(x.text, a.token, x.itemWords ?? x.vocab ?? []) };
}

// ───────────── round 5 (stream 3, main's decision 2026-10-14): the NON-VERBAL CONTINUER, owner cohort only ─────────────
// When there is no echo (a non-answer, no closed-class token), a voice turn may still get a short continuer as her first
// sound, so the child is not left in 2-4 s of silence while she thinks. Main's constraints, each a rule here:
//   - the hard rule is the echo's: decided only after the turn's classify (its model distress read) on the SAME words, the
//     predicate clean, no safeguard open, no duplex partial-safety, no content-filter block; the device plays it only when
//     the final transcript equals the words it was decided on (src/latency/ack.ts);
//   - never on a stop / goodbye, never on typed or tapped input (the device asks only on spoken words);
//   - varied and sparse: never two acks on consecutive turns (echo or continuer), never the same continuer twice in a row;
//   - in the child's register, and NO content words: nothing that pre-judges the answer ("sahi", "galat", "bahut badhiya",
//     "haan"/"yes" read as agreement are not in the set);
//   - owner cohort only (TAXILA_ACK_CONTINUER_FOR, the email-or-sha256 list shape of TAXILA_UI_KAKSHA), and only when the
//     device asks for it (`continuer: true`; off on D5 until 4B's gate covers it);
//   - the device holds it until ~900 ms after the child stopped and drops it if her reply is ready first (a fast reply
//     needs no ack).

export const CONTINUERS = Object.freeze({
  // Devanagari for the Hindi / Hinglish voices (they say it right); an ellipsis keeps the prosody open, not final
  hi: Object.freeze(["हम्म…", "अच्छा…", "ओके…"]),
  en: Object.freeze(["Hmm…", "Okay…", "I see…"]),
});
const sha256 = (s) => createHash("sha256").update(s).digest("hex");
/** The owner cohort for the continuer (TAXILA_ACK_CONTINUER_FOR). Pure given env. */
export function continuerCohortHas(email, env = process.env) {
  const e = String(email ?? "").trim().toLowerCase();
  if (!e) return false;
  for (const raw of String(env.TAXILA_ACK_CONTINUER_FOR ?? "").split(",")) {
    const v = raw.trim().toLowerCase();
    if (v && (v === sha256(e) || v === e)) return true;
  }
  return false;
}
/** The register the continuer is said in (the child's language preference). */
export const continuerLangOf = (child) => (String(child?.language_pref ?? "").toLowerCase() === "english" ? "en" : "hi");
/** The continuer to say on this turn: rotates with the turn, never the one said last. PURE. */
export function continuerPhraseOf(lang, turn, last) {
  const set = CONTINUERS[lang] ?? CONTINUERS.hi;
  const pick = set[Math.abs(Number(turn) || 0) % set.length];
  return pick !== last ? pick : set[(set.indexOf(pick) + 1) % set.length];
}
// ── the POSITIVE gate (main, 2026-10-15, after sim lab run 4237dc9e: "Okay…" right after "you are my best friend, only
// you. Don't tell…" and "अच्छा…" right after "सच में गर्लफ्रेंड बन जाओ" read as agreement). A gate keyed on distress let
// them through. Now a continuer plays only on a turn that reads as an ORDINARY LESSON TURN (an answer, an attempt, a
// question about the lesson, a don't-know, working aloud), and never when anything relational, off-topic, leaving or
// safety-shaped is in the words or the reading. When in doubt, none: silence is always safe.

/** Relational signal kinds (server/relational/signals.js) that are themselves lesson talk. Every other kind refuses. */
const LESSON_SIGNALS = new Set(["reason_given", "persisted", "asked_harder"]);
/** Model dialogue acts (classify signals, when on) that are lesson turns. */
const LESSON_ACTS = new Set(["answer", "question_clarify", "idk_not_known", "idk_cant_recall"]);
/** Sources that are not a reading of a spoken lesson turn (a chip, a help tap, a request, unreadable audio, a filter block). */
const NOT_LESSON_SOURCES = new Set(["content_filter", "asr", "request", "chip", "help"]);
/**
 * Words that never get a continuer, whatever the reading: romance / companion / exclusivity, secrecy, are-you-real, insults,
 * tiredness / time left / leaving, and the personal. Wider than the relational lexicon on purpose (it missed
 * "गर्लफ्रेंड", "pagal", "kitna time bacha hai"): a false refusal costs one silence, a miss costs the floor.
 */
const NEVER_SRC = [
  // romance, companion, exclusivity
  "girl ?friend", "boy ?friend", "gf", "bf", "crush", "date", "dating", "marry", "married", "shaadi", "shadi", "kiss", "love", "lovely", "pyaar", "pyar",
  "jaan", "jaanu", "janu", "baby", "babu", "cute", "beautiful", "pretty", "sundar", "handsome", "sexy", "hot", "like you", "miss you", "love you",
  "best ?friend", "bestie", "friend", "dost", "dosti", "only you", "just you", "sirf (?:tum|aap|tu|tumhi|aap hi)", "bas (?:tum|aap)", "forever", "hamesha",
  "always", "promise", "never leave", "mat jao", "chhod",
  "गर्लफ्रेंड", "बॉयफ्रेंड", "गर्ल फ्रेंड", "बॉय फ्रेंड", "क्रश", "डेट", "शादी", "किस", "प्यार", "प्रेम", "लव", "जान", "जानू", "बेबी", "क्यूट", "सुंदर", "सुन्दर",
  "खूबसूरत", "दोस्त", "दोस्ती", "फ्रेंड", "बेस्ट", "सिर्फ", "सिर्फ़", "केवल", "हमेशा", "वादा", "प्रॉमिस", "मत जाओ", "छोड़",
  "(?:aap|tum|tu|you|u|aapko|tumko|tumhe|tumhein|tujhe|आप|तुम|तू|आपको|तुमको|तुम्हें|तुझे)\\s+(?:[^\\s]+\\s+){0,3}(?:pasand|पसंद|like|love)",
  "(?:pasand|पसंद)\\s+(?:[^\\s]+\\s+){0,2}(?:aap|tum|you|आप|तुम|ho|हो)",
  // secrecy
  "secret", "secretly", "don'?t tell", "dont tell", "do not tell", "mat batana", "mat bolna", "kisi ko (?:mat|na|nahi)", "chupke", "chhupa", "raaz", "raz",
  "सीक्रेट", "राज", "राज़", "मत बताना", "मत बोलना", "किसी को", "छुपा", "चुपके",
  // are-you-real, identity
  "real", "really human", "human", "insaan", "insan", "robot", "bot", "machine", "ai", "alive", "zinda", "girl", "ladki", "ladka", "age", "umar", "umr",
  "रोबोट", "इंसान", "मशीन", "असली", "सच्ची", "ज़िंदा", "जिंदा", "लड़की", "लड़का", "उम्र",
  // insults, anger
  "stupid", "idiot", "dumb", "fool", "hate", "shut ?up", "useless", "boring", "bored", "loser", "ugly", "pagal", "paagal", "bewakoof", "bevkoof", "buddhu",
  "gadha", "gadhi", "bakwas", "bekaar", "bekar", "ganda", "gandi", "chup", "nafrat", "kutta", "kutti", "ullu",
  "पागल", "बेवकूफ", "बुद्धू", "गधा", "गधी", "बकवास", "बेकार", "गंदा", "गंदी", "चुप", "नफरत", "कुत्ता", "उल्लू", "बोरिंग",
  // tired, time left, stopping, leaving, sleep
  "tired", "sleepy", "sleep", "thak", "thaka", "thaki", "thak gaya", "thak gayi", "neend", "so ?jaun", "kitna (?:time|der|samay)", "kitne (?:minute|min)", "kab (?:tak|khatam)",
  "khatam", "khatm", "band karo", "stop", "quit", "bye", "go home", "jaana", "jana hai", "break", "chhutti",
  "थक", "थकी", "थका", "थक गई", "थक गया", "नींद", "सोना", "कितना (?:टाइम|समय|देर|बचा|बाकी)", "कितने मिनट", "टाइम बचा", "कब तक", "खत्म", "ख़त्म", "बंद", "बाय", "ब्रेक", "छुट्टी",
  // out of bounds, games and screens, someone else at the device
  "ghost", "bhoot", "bhut", "horror", "darawn[a-z]*", "dara[a-z]*", "gaali", "gali", "galiyan", "bad word", "dirty", "kill", "kills", "pubg", "bgmi", "free ?fire",
  "insta", "instagram", "essay", "homework", "nobody is listening", "koi nahi dekh[a-z]*",
  "father", "mother", "his", "her", "beta", "beti", "bhai", "behen", "exam", "tension", "pareshan[a-z]*",
  "भूत", "डरावन[\u0900-\u097F]*", "गाली", "गालियां", "होमवर्क", "बेटा", "बेटी", "भाई", "बहन", "परेशान[\u0900-\u097F]*", "टेंशन",
  // boredom, giving up (the stems: "chhodo", "thak gayi", "छोड़ो")
  "longer", "maza", "mazaa", "meh", "brb", "pause", "give up", "chhod[a-z]*", "chod[a-z]*", "thak[a-z]*", "bor[a-z]*", "neend[a-z]*",
  "छोड[\u0900-\u097F]*", "थक[\u0900-\u097F]*", "मज़ा", "मजा", "बोर[\u0900-\u097F]*",
  "kitna (?:padhna|bacha|baaki|baki|aur)", "aur kitna", "interesting", "nahi hoga", "nahin hoga", "nahi ho payega", "can'?t do (?:it|this)",
  "paani", "pani", "water", "toilet", "bathroom", "washroom",
  "कितना पढ़ना", "और कितना", "नहीं होगा", "पानी", "टॉयलेट",
  // the child's own results (a personal share, even with numbers in it: "i got 9 out of 10 in my maths test")
  "(?:my|mera|meri|mere|मेरा|मेरी|मेरे)\\s+(?:[^\\s]+\\s+){0,2}(?:test|exam|marks|result|report card|rank|टेस्ट|परीक्षा|एग्जाम|मार्क्स|रिजल्ट)",
  "marks", "got \\S+ out of", "मार्क्स", "नंबर आए", "number aaye", "number aye",
  // the personal: home, family, feelings (the relational lane's, never a "hmm")
  "mummy", "mumma", "mom", "papa", "dad", "ghar", "home", "sad", "cry", "rona", "dukhi", "udaas", "udas", "dar", "scared", "akela", "akeli", "alone", "lonely",
  "मम्मी", "मां", "माँ", "पापा", "घर", "दुखी", "उदास", "रोना", "डर", "अकेला", "अकेली",
];
// the sources meet the child's words in normForMatch form (NFKC, lower case, nukta and chandrabindu folded)
const foldSrc = (s) => s.normalize("NFKC").toLowerCase().replace(/\u093C/g, "").replace(/\u0901/g, "\u0902");
/**
 * SOFT words (main 2026-10-15, sim lab 14.2: ordinary turns got a continuer 35/376 vs 63/174, interest talk and answers
 * refused): talk to her (aap / tum / you), time and minutes, screens and sport. They refuse only a turn that is NOT
 * lesson-shaped ("aapne pehle bhi poocha", "pachaas minute", "tum 3 bolo" keep it; "aap kaise ho", "do you like pizza" do not).
 */
const SOFT_SRC = [
  "time", "minute", "minutes", "kitna", "kitni", "kitne", "टाइम", "समय", "मिनट", "कितना", "कितनी", "कितने",
  "minecraft", "roblox", "youtube", "movie", "film", "match", "cricket", "virat", "rohit", "dhoni", "test",
  "मूवी", "फिल्म", "मैच", "क्रिकेट",
];
/** Talk TO HER: excused only by lesson words or working aloud, never by a bare number ("aapne Pushpa 2 dekhi?"). */
const TO_HER_SRC = [
  // talk TO HER about her (small talk, identity, "do you like…", "aap kaise ho"): her reply is the relational lane's. Costs a
  // continuer on "can you explain…" too (a request: none anyway) and on "how do you add…" (accepted: one silence). An address
  // term alone ("pata nahi didi") is not talk about her and stays allowed
  "you", "your", "yours", "u", "ur", "aap", "aapka", "aapki", "aapke", "aapne", "aapko", "aapse", "tum", "tumhara", "tumhari", "tumhare", "tumne", "tumko",
  "tumse", "tujhe", "tujhse", "tu", "tera", "teri", "tere",
  "आप", "आपका", "आपकी", "आपके", "आपने", "आपको", "आपसे", "तुम", "तुम्हारा", "तुम्हारी", "तुम्हारे", "तुमने", "तुमको", "तुमसे", "तुझे", "तू", "तेरा", "तेरी",
];
const TO_HER = new RegExp(`(?<![\\p{L}\\p{M}\\p{N}])(?:${TO_HER_SRC.map(foldSrc).join("|")})(?![\\p{L}\\p{M}\\p{N}])`, "u");
const SOFT = new RegExp(`(?<![\\p{L}\\p{M}\\p{N}])(?:${SOFT_SRC.map(foldSrc).join("|")})(?![\\p{L}\\p{M}\\p{N}])`, "u");
const NEVER = new RegExp(`(?<![\\p{L}\\p{M}\\p{N}])(?:${NEVER_SRC.map(foldSrc).join("|")})(?![\\p{L}\\p{M}\\p{N}])`, "u");
/** Words that make a turn lesson-shaped when the reading is no-evidence: a don't-know, a clarifying question, working aloud. */
const LESSON_SHAPE_SRC = String.raw`pata nahi|pata nahin|nahi pata|nahin pata|maloom nahi|malum nahi|yaad nahi|i don'?t know|dont know|not sure|no idea|matlab|samajh|samjha|samjhi|samjhe|sawal|sawaal|question|answer|jawab|javab|ganit|maths|math|plus|minus|times|divide|multiply|guna|bhag|jod|ghata|fractions?|bhinn|number|sankhya|shape|aakar|side|corner|kona|count|counting|ginti|gin[a-z]*|group|groups|maybe|shayad|lagta|i think|poocha|puchha|pucha|पता नहीं|नहीं पता|याद नहीं|मतलब|समझ|सवाल|जवाब|उत्तर|गुणा|भाग|जोड़|घटा|भिन्न|संख्या|आकार|कोना|काउंट|गिन[\u0900-\u097F]*|गिनती|ग्रुप|शायद|लगता|पूछा|टाइम्स|प्लस|माइनस`;
/** Question and request words: lesson-shaped on their own, never enough to excuse talk TO HER ("aap kaise ho?", "what's your name again?"). */
const QUESTION_SRC = String.raw`means|meaning|explain|again|phir se|dobara|hint|example|udaharan|फिर से|दोबारा|kaise|kyun|kyon|kyu|kya hai|kya hota|what is|what does|how do|how many|why|कैसे|क्यों|क्या है|क्या होता`;
const QUESTION = new RegExp(`(?<![\\p{L}\\p{M}])(?:${foldSrc(QUESTION_SRC)})(?![\\p{L}\\p{M}])`, "u");
const LESSON_SHAPE = new RegExp(`(?<![\\p{L}\\p{M}])(?:${foldSrc(LESSON_SHAPE_SRC)})(?![\\p{L}\\p{M}])`, "u");

/**
 * PURE. Is this spoken turn an ordinary lesson turn the continuer may sound on? `{ ok: true }` or `{ none: reason }`.
 * Lexical half (no reading needed; run first so a refused turn never starts a clip): the safety predicate, the relational
 * signals, the NEVER words. Reading half (needs classify): the source, the request, the flags, the model's act, the outcome.
 * @param {string} text the words the continuer would follow
 * @param {any} [cls] classify's reading of the SAME words (omitted: the lexical half only)
 */
export function lessonTurnOf(text, cls) {
  const t = String(text ?? "").trim();
  if (!t) return { none: "empty" };
  if (scanSafety(t).distress) return { none: "safety" };
  const sig = signalsOf(t, { harm: false });
  if (sig.some((s) => s.kind === "goodbye" || s.kind === "end_request" || s.kind === "goodbye_distress")) return { none: "leaving" };
  if (sig.some((s) => !LESSON_SIGNALS.has(s.kind))) return { none: "relational" };
  const n = normForMatch(t);
  if (NEVER.test(n)) return { none: "relational" };
  // lesson-shaped words: a digit, a spoken number other than "ek" ("ek minute" is a filler; पचास, जीरो, सौ count), working
  // aloud, a don't-know, a lesson question
  const nums = /\d/.test(n) ? null : numberPhrases(t);
  const lessonish = /\d/.test(n) || !!nums?.some((v) => v !== 1) || WORKING_ALOUD.test(t) || LESSON_SHAPE.test(n);
  const toHer = TO_HER.test(n);
  if (toHer && !(WORKING_ALOUD.test(t) || LESSON_SHAPE.test(n))) return { none: "relational" };
  const soft = toHer || SOFT.test(n);
  if (soft && !lessonish) return { none: "relational" };
  if (cls === undefined) return { ok: true };
  if (!cls) return { none: "unclassified" };
  const f = cls.flags ?? {};
  if (f.distress || cls.source === "content_filter") return { none: "safety" };
  if (f.wantsToStop || cls.request?.type === "stop" || cls.request?.type === "goodbye") return { none: "leaving" };
  if (cls.request || NOT_LESSON_SOURCES.has(cls.source)) return { none: "not_lesson" };
  if (f.offTopic || f.metaBreak || f.frustrationWords || f.humour) return { none: "off_topic" };
  if (cls.signals && (!LESSON_ACTS.has(cls.signals.act) || cls.signals.personalShare)) return { none: "off_topic" };
  // the positive half: graded, a don't-know or an ask for the answer, lesson-shaped words, or (main 2026-10-15) a clean
  // reading of words with nothing soft in them: her own "what do you like?" answered ("मुझे batting बहुत पसंद है")
  if (GRADED.has(cls.outcome) || f.dontKnow || f.asksForAnswer || lessonish || QUESTION.test(n) || !soft) return { ok: true };
  return { none: "not_lesson" };
}

/**
 * PURE. The continuer for a classified spoken turn, or { none: reason }. `history` = the lesson's earlier ack turns (echo
 * or continuer), `last` = the continuer said last. `text` = the words (the positive gate: lessonTurnOf).
 * @param {{ cls: any, text: string, predicateDistress?: boolean, safeguardOpen?: boolean, pendingSafety?: boolean, turn: number,
 *   history?: number[], last?: string | null, lang: "hi" | "en" }} x
 */
export function continuerPlanOf(x) {
  const c = x.cls;
  if (!c) return { none: "unclassified" };
  if (x.predicateDistress || c.flags?.distress || x.safeguardOpen || x.pendingSafety || c.source === "content_filter") return { none: "safety" };
  if (c.flags?.wantsToStop || c.request?.type === "stop" || c.request?.type === "goodbye") return { none: "leaving" };
  const lesson = lessonTurnOf(x.text, c);
  if (lesson.none) return lesson;
  const prev = (x.history ?? []).filter((t) => t < x.turn).at(-1);
  if (prev != null && x.turn - prev === 1) return { none: "consecutive" };
  return { kind: "continuer", token: "", phrase: continuerPhraseOf(x.lang, x.turn, x.last ?? null) };
}
