// Round 7 (B4, voice-d5-ear-asr): the per-lesson phrase list for the D5 ear (Voice Live azure-speech `phrase_list`).
// Evidence (open-r5-d5-asr-empties): azure-speech (hi-IN,en-IN) returned EMPTY for 5/14 short closed answers on the owner
// harness: 'सात है ना', 'तीस दीदी', 'चालीस square cm', 'हाँ'. A phrase list biases recognition toward words the lesson
// expects; it is a list of WORDS, never sentences or a prompt, so it cannot be recited (asr-kids-hinglish §3.4: an LLM
// transcriber recites sentence-shaped context; azure-speech is not an LLM, and the list is terms only).
// Sources, all from the lesson the server already holds (no child free text):
//   - the child's first name and the teacher's name (ctx.firstName, ctx.teacherName);
//   - the kit's short closed answers for this topic (item.answer + item.acceptable, ≤ 3 words, ≤ 24 chars);
//   - a fixed Hinglish core: yes / no / don't know / addressing words, and Hindi number words 1-20, the tens to 100.
// Capped at PHRASE_MAX (the service accepts far more; a short list keeps the bias on what this lesson needs). Pure.
export const PHRASE_MAX = 200;
const MAX_CHARS = 24;
const MAX_WORDS = 3;

const CORE = [
  "हाँ", "हां", "नहीं", "जी", "जी हाँ", "हाँ जी", "पता नहीं", "मालूम नहीं", "समझ नहीं आया", "फिर से", "रुको", "एक मिनट",
  "दीदी", "भैया", "सर", "मैम", "ओके", "yes", "no", "okay",
];
const HI_NUM = ["शून्य", "एक", "दो", "तीन", "चार", "पाँच", "छह", "सात", "आठ", "नौ", "दस", "ग्यारह", "बारह", "तेरह", "चौदह", "पंद्रह",
  "सोलह", "सत्रह", "अठारह", "उन्नीस", "बीस", "तीस", "चालीस", "पचास", "साठ", "सत्तर", "अस्सी", "नब्बे", "सौ", "आधा", "डेढ़", "ढाई"];

/** One candidate → a clean term, or null (too long, a sentence, markup, digits-only noise). */
export function phraseOf(s) {
  if (typeof s !== "string") return null;
  const t = s.normalize("NFC").replace(/[\u0000-\u001f<>{}\[\]"`]/g, " ").replace(/\s+/g, " ").trim().replace(/[.!?।,;:]+$/u, "");
  if (!t || t.length > MAX_CHARS) return null;
  if (t.split(" ").length > MAX_WORDS) return null;
  if (/[?!।]/u.test(t)) return null; // a sentence, not a term
  return t;
}

/**
 * The phrase list for one lesson. `state` is lesson.state (ctx.firstName, ctx.teacherName, topicId); `kit` the topic's kit
 * (kitFor), or null. Order: names, then the kit's answers (the lesson's own words), then the core; duplicates dropped.
 * @param {{ state?: any, kit?: any }} o
 * @returns {string[]}
 */
export function lessonPhrases({ state = null, kit = null } = {}) {
  const out = [];
  const seen = new Set();
  const add = (s) => {
    const p = phraseOf(s);
    if (!p) return;
    const k = p.toLowerCase();
    if (seen.has(k) || out.length >= PHRASE_MAX) return;
    seen.add(k);
    out.push(p);
  };
  const ctx = state?.ctx ?? {};
  add(ctx.firstName);
  add(ctx.teacherName);
  const topic = kitTopic(kit, state?.topicId);
  for (const it of topic?.items ?? []) {
    add(it?.answer);
    for (const a of Array.isArray(it?.acceptable) ? it.acceptable : []) add(a);
  }
  for (const c of CORE) add(c);
  for (const n of HI_NUM) add(n);
  return out;
}

/** The kit's topic for this lesson: a single-topic kit object, or the topic matching topicId in a kit file. */
function kitTopic(kit, topicId) {
  if (!kit || typeof kit !== "object") return null;
  if (Array.isArray(kit.items)) return kit;
  if (Array.isArray(kit.topics)) return kit.topics.find((t) => t?.topicId === topicId) ?? null;
  return null;
}
