// The INTAKE beat's reading of the child (TUTOR-MODEL §2.2-2.3): "what happened at school today?" → an IntakeFrame. PURE,
// deterministic, no model call. Code reads the frame FIRST, in a closed set, then maps it onto a CLOSED candidate set of
// syllabus topics (candidates.js). A model never picks a topic here and never grades.
//
//   kind        taught | homework | test | not_understood | want | nothing | unknown | share   (+ "safety": the predicate fired)
//   subject     maths | science | evs | english | hindi | sst | null      (from the child's words only)
//   when        today | tomorrow | this_week | past | null                (for a test or homework)
//   words       the content words left after activity words are removed (copy, check, test, homework, ma'am …): an activity
//               word never names a topic (rj-r3fix-switch-on-way-words; TUTOR-MODEL §2.3 "ma'am ne copy check ki")
//
// Detection is shape-first (how a child SAYS the thing), in a fixed order: safety > test (coming up) > homework > not
// understood > want > nothing > unknown > taught / share. The safety predicate is the frozen floor (director/safety.js),
// imported, never re-implemented.

import { scanSafety } from "../safety.js";

const T = (s) => String(s ?? "").toLowerCase().normalize("NFKC").replace(/[’`]/g, "'").replace(/\s+/g, " ").trim();
const wc = (t) => t.split(/\s+/).filter(Boolean).length;

// ── subjects (the child's words; Devanagari too). "science" in classes 3-5 is the EVS book (candidates.js maps it). ──
const SUBJECT_RX = [
  ["maths", /\b(?:maths?|mathematics|ganit|ganith|hisaab|hisab)\b|गणित/i],
  ["science", /\b(?:science|sci|vigyan|vigyaan|biology|bio|physics|chemistry)\b|विज्ञान/i],
  ["evs", /\b(?:evs|e\.v\.s|paryavaran|environment(?:al)?(?:\s+studies)?)\b|पर्यावरण/i],
  ["english", /\b(?:english|angrezi|angreji|grammar)\b|अंग्रेज़ी|अंग्रेजी|इंग्लिश/i],
  ["hindi", /\b(?:hindi|vyakaran)\b|हिंदी|हिन्दी|व्याकरण/i],
  ["sst", /\b(?:sst|s\.s\.t|social(?:\s+(?:science|studies))?|history|histroy|geography|geo|civics|political\s+science|itihas|itihaas|bhugol|samajik)\b|इतिहास|भूगोल|सामाजिक|नागरिक/i],
];
export function subjectOf(text) {
  const t = T(text);
  for (const [s, rx] of SUBJECT_RX) if (rx.test(t)) return s;
  return null;
}

// ── activity words: never a topic (TUTOR-MODEL §2.3 point 1) ──
export const ACTIVITY_WORDS = new Set(("copy copies check checked checking checkd test tests exam exams paper papers homework hw homwork " +
  "revision revise revised class classwork classes maam mam ma'am madam sir teacher teachers miss school chapter chapters lesson lessons period " +
  "periods notebook notebooks question questions sawaal sawal sawaalon kaam work worksheet worksheets page pages exercise exercises practice " +
  "padhai sum sums sawaalon prashn today aaj kal tomorrow yesterday subject unit periodic marks result answer answers book books dictation board").split(" "));

// ── shapes ──
const TEST_WORD = /\b(?:test|tests|exam|exams|paper|pariksha|parikshaa|quiz|unit\s+test|class\s+test|periodic|half[\s-]*yearly|mid[\s-]*term|weekly\s+test|viva|oral)\b|परीक्षा|टेस्ट|इम्तिहान/i;
const FUTURE = /\b(?:kal|tomorrow|parso|next\s+(?:week|day|monday|tuesday|wednesday|thursday|friday|saturday)|(?:on\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday)|is\s+(?:hafte|week)|this\s+week|agle\s+(?:hafte|week|din)|coming|aane\s+wala|aane\s+wali|hone\s+wala|hone\s+wali|hoga|hogi|hai\s+kal|soon|jaldi)\b|कल|परसों|अगले|आने\s+वाल|होगा|होगी/i;
// a test that already happened today: "bas test tha", "test hua", "test diya", "test ki copy mili", "result aaya"
const PAST_TEST = /\b(?:test|exam|paper|quiz)\s+(?:tha|thi|the|hua|hui|ho\s+gaya|ho\s+gayi|diya|diye|de\s+diya|liya|was|happened|got\s+over|over)\b|\b(?:had|wrote|gave)\s+(?:a|an|the|my)?\s*(?:test|exam|paper|quiz)\b|\b(?:test|exam|paper)\s+(?:ki|ka|ke)\s+(?:copy|copies|result|marks)\b|\b(?:result|marks)\s+(?:aaya|aaye|mila|mile|came)\b|टेस्ट\s+(?:था|हुआ|दिया)|परीक्षा\s+(?:थी|हुई)/i;
const PRESENT_TEST = /\b(?:test|exam|paper|quiz|pariksha)\s+(?:hai|h|he|hain|is|aa\s+raha|aa\s+rahi|coming)\b|\b(?:test|exam)\s+ki\s+(?:taiyari|tayari|preparation)\b|\bprepare\s+for\b|टेस्ट\s+है|परीक्षा\s+है/i;
const HW_WORD = /\b(?:home\s*work|homwork|hw|h\.w|grih\s*karya|griha\s*karya|assignment|project|worksheet)\b|होमवर्क|गृहकार्य|गृह\s*कार्य/i;
const HW_NONE = /\b(?:home\s*work|hw)\s+(?:nahi|nahin|nhi)\s+(?:mila|diya|hai)\b|\bno\s+(?:home\s*work|hw)\b|\b(?:home\s*work|hw)\s+(?:check|checked|ho\s+gaya|done|finished|kar\s+liya|complete)\b|होमवर्क\s+नहीं/i;
const CONFUSED = /\b(?:(?:kuch\s+(?:bhi\s+)?)?samajh?\s*(?:me|mein|mai)?\s*(?:nahi|nahin|nhi|na)\s*(?:aaya|aya|aaye|aaya|aa\s+raha|aa\s+rha|aa\s+rahe|aayi|aaraha)|(?:nahi|nahin|nhi)\s+samjh?(?:a|i|e)\b|samjh?(?:a|i)\s+(?:nahi|nahin|nhi)|i\s+(?:don'?t|do\s+not|didn'?t|did\s+not)\s+(?:get|understand)|(?:did\s+not|didn'?t|couldn'?t|could\s+not)\s+(?:get|understand)|i'?m\s+(?:confused|lost)|(?:not|wasn'?t|isn'?t)\s+clear|confusing|confused|samajh\s+(?:se\s+)?bahar)\b|समझ\s*(?:में)?\s*नहीं|नहीं\s*समझ/i;
// a wish to learn something of their own: "mujhe X ke baare mein jaanna hai", "X sikhao", "I want to learn X", "teach me X"
const WANT = /\b(?:jaan(?:na|ni)\s+(?:hai|h|chahta|chahti)|seekh?(?:na|ni)\s+(?:hai|h|chahta|chahti)|sikh(?:na|ni)\s+(?:hai|h|chahta|chahti)|padhna\s+(?:chahta|chahti)|sikhao|sikhaiye|sikha\s+do|samjhao|samjhaiye|batao|bataiye|(?:i\s+)?(?:want|wanna|would\s+like)\s+to\s+(?:learn|know|study|understand)|teach\s+me|tell\s+me\s+about|can\s+(?:you|we)\s+(?:teach|learn|study|do)|i'?m\s+curious|curious\s+about|how\s+do(?:es)?\s+\w+)\b|जानना\s+है|सीखना\s+है|सिखाओ|बताओ|समझाओ/i;
const ABOUT = /\b(?:ke|ki)\s+(?:baare|bare)\s+(?:mein|me|main)\b|\babout\b|के\s+बारे\s+में/i;
const NOTHING = /\b(?:kuch\s+(?:bhi\s+)?(?:nahi|nahin|nhi|na)\s+(?:padhaya|padaya|padhaye|padha|sikhaya|hua|hui|kiya|khaas|special|naya|new)|kuch\s+(?:khaas|khas|special|naya)\s+(?:nahi|nahin|nhi)|nothing(?:\s+(?:much|special|new|happened|taught))?|not\s+much|no\s+(?:class|classes|school|teaching|period)|(?:school|class)\s+(?:band|bandh|off|closed)|chhutti|chutti|holiday|vacation|free\s+period|games?\s+period|pt\s+(?:period|tha|thi|hua)|sports?\s+day|annual\s+day|function\s+(?:tha|thi|hua)|teacher\s+(?:nahi|nahin|nhi)\s+(?:aaye|aayi|aaya|aai|aa(?:e|i))|(?:ma'?am|sir|maam|madam)\s+(?:nahi|nahin|nhi)\s+(?:aaye|aayi|aaya|aai|aa(?:e|i)|thi|the|tha)|(?:copy|copies|notebook|homework)\s+(?:check|checking)|check\s+(?:ki|kiya|kiye|hui|hua)\s+(?:copy|copies)|only\s+revision|bas\s+revision|revision\s+(?:hi|hua|kiya|karaya)|didn'?t\s+(?:teach|learn|do)\s+anything|did\s+not\s+(?:teach|learn|do)\s+anything)\b|कुछ\s+(?:भी\s+)?नहीं\s+(?:पढ़ाया|हुआ|सिखाया)|छुट्टी/i;
const UNKNOWN = /^(?:(?:hmm+|umm+|uh+|haan|ha|ji|didi|ma'?am|ok)[\s,.]*)*(?:pata\s+nahi|pata\s+nahin|pta\s+(?:nahi|nhi)|maloom\s+nahi|yaad\s+(?:nahi|nahin|nhi)(?:\s+(?:hai|aa\s+raha|aaraha))?|kuch\s+yaad\s+(?:nahi|nahin|nhi)|bhool\s+(?:gaya|gayi|gya|gyi)|i\s+(?:don'?t|do\s+not)\s+(?:know|remember)|(?:i\s+)?forgot|(?:i\s+)?can'?t\s+remember|no\s+idea|not\s+sure|hmm+|umm+|पता\s+नहीं|याद\s+नहीं|भूल\s+गय[ाी])(?:[\s,.!?]+(?:didi|ma'?am|yaar|hai|h|kya|padhaya|hua|tha|thi))*[\s.!?]*$/i;
// a life event: what they did or what happened to them, not school learning
const SHARE = /\b(?:birthday|bday|janamdin|janmdin|jeet(?:a|e|i)|jeet\s+(?:gaye|gaya|gayi)|won|haar(?:a|e|i)|haar\s+(?:gaye|gaya|gayi)|lost\s+(?:the|a|our)?\s*(?:match|game)|match|cricket|football|kabaddi|khel(?:a|e)\b|played|gir(?:a|i|e)\s*(?:gaya|gayi|gaye)?|fell|chot|lagi|injured|dost|friend|friends|party|picnic|trip|ghoomne|ghumne|shaadi|wedding|naya\s+(?:pet|kutta|puppy|cycle|phone)|puppy|kitten|billi|kutta|gift|present|mummy|papa|mumma|didi\s+ne|bhaiya|nani|dadi|nana|dada|ghar\s+pe|movie\s+dekhi|cartoon|prize|medal|award|dance|competition|race)\b|जन्मदिन|जीत|दोस्त|मैच|गिर\s*गय/i;
// a learning verb: something was taught, studied, read, started
const TAUGHT = /\b(?:padhaya|padhaaya|padaya|padhaye|padhayi|padhai\s+(?:hui|ki)|padha|padhe|padhi|padhte|sikhaya|sikhaye|sikhayi|seekha|sikha|seekhe|sikhe|karaya|karwaya|samjhaya|samjhaye|bataya|bataye|shuru\s+(?:kiya|hua|hui|kiye)|start(?:ed)?|began|begin|taught|teach|learnt|learned|learning|studied|study|did|done|read|chapter|lesson|topic|explained|discussed|covered)\b|पढ़ाया|पढ़ाए|पढ़ा|पढ़ी|सिखाया|सीखा|शुरू|समझाया|बताया/i;
const TODAY = /\b(?:aaj|today|abhi)\b|आज/i;
const THIS_WEEK = /\b(?:is\s+(?:hafte|week)|this\s+week|agle\s+(?:hafte|week)|next\s+week|parso|(?:on\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday))\b|परसों|अगले\s+हफ्ते/i;
const TOMORROW_KAL = /\b(?:tomorrow|kal)\b|कल/i;
const PAST_KAL = /\bkal\s+(?:\S+\s+){0,3}(?:tha|thi|the|hua|hui|kiya|padhaya|diya)\b|\byesterday\b|कल\s+(?:\S+\s+){0,3}(?:था|थी|हुआ)/i;

function whenOf(t) {
  if (THIS_WEEK.test(t)) return "this_week";
  if (TOMORROW_KAL.test(t) && !PAST_KAL.test(t)) return "tomorrow";
  if (PAST_KAL.test(t)) return "past";
  if (TODAY.test(t)) return "today";
  return null;
}

const STOP = new Set(("a an the is are was were be to of in on at for and or but why what how which who when where do does did can could " +
  "should would will i me my mine you your it its this that these those than then so if not no yes with from by as kya kyu kyun kyon kaise kaisa " +
  "kaun kab kahan hai hain tha thi the ka ki ke ko se mein me main mai par pe aur ya bhi to toh nahi nahin na haan ek do please wala wali wale " +
  "hua hui hue mila mili mile diya diye liya kiya kiye kar karna karte karti raha rahi rahe tha thi hum humne humein hame mujhe muje mera meri mere ne bas sirf just only " +
  "aaj kal today tomorrow abhi bahut bohot thoda kuch sab all some very much also bhi wo woh ye yeh unhone unho uska uski usne iska iski " +
  "padhaya padhaaya padaya padhaye padhayi padha padhe padhi sikhaya sikhaye seekha sikha karaya samjhaya bataya shuru start started " +
  "taught learnt learned studied read did done began begin explained discussed covered new naya nayi got have has had been being " +
  "baare bare about want jaanna seekhna sikhna sikhao batao samjhao learn know tell teach").split(" "));

/** Content words: lower-case tokens (Latin + Devanagari) that are not stop words, activity words or subject names. */
export function contentWords(text) {
  const raw = T(text).match(/[\p{L}\p{M}]+(?:'[\p{L}]+)?|\d+(?:[./]\d+)?/gu) ?? [];
  return raw.filter((w) => !STOP.has(w) && !ACTIVITY_WORDS.has(w.replace(/'/g, "")) && !SUBJECT_RX.some(([, rx]) => rx.test(w)) && (w.length >= 3 || /\d/.test(w)));
}

/**
 * PURE. The child's answer to the intake question → an IntakeFrame (never a topic: candidates.js maps it).
 * @param {string} text
 * @returns {{ kind: "safety"|"taught"|"homework"|"test"|"not_understood"|"want"|"nothing"|"unknown"|"share",
 *   subject: string|null, when: string|null, words: string[], also: string[], src: "code" }}
 */
export function intakeParse(text) {
  const t = T(text);
  const frame = (kind, extra = {}) => ({ kind, subject: subjectOf(t), when: whenOf(t), words: contentWords(t), also: [], src: "code", ...extra });
  if (!t) return frame("unknown");
  // the frozen floor decides first: a harm word pre-empts every reading (TUTOR-MODEL §2.2 last branch)
  if (scanSafety(text).distress) return frame("safety", { words: [] });
  const also = [];
  const confused = CONFUSED.test(t);
  const words = contentWords(t);
  // a test COMING UP (tomorrow, this week, "test hai"): the revise segment; a test that happened today is "nothing"
  if (TEST_WORD.test(t) && !PAST_TEST.test(t) && (FUTURE.test(t) || PRESENT_TEST.test(t))) {
    if (confused) also.push("not_understood");
    if (HW_WORD.test(t)) also.push("homework");
    const when = whenOf(t);
    return frame("test", { when: when === "past" || when === "today" ? "tomorrow" : when ?? "this_week", also });
  }
  if (HW_WORD.test(t) && !HW_NONE.test(t)) {
    if (confused || /\b(?:nahi|nahin|nhi)\s+(?:aa|ho)\s+(?:raha|rahi|rha|rhi)\b|\bhelp\b|\bstuck\b|\bdifficult\b|\bhard\b|मुश्किल|नहीं\s+आ\s+रहा/i.test(t)) also.push("stuck");
    return frame("homework", { also });
  }
  if (confused) return frame("not_understood");
  // a want: a wish verb, or "X ke baare mein" with a content word (never only "tell me about school")
  if ((WANT.test(t) && (ABOUT.test(t) || words.length > 0) && !TAUGHT.test(t.replace(WANT, " "))) || (ABOUT.test(t) && words.length > 0 && !TAUGHT.test(t))) {
    return frame("want");
  }
  if (NOTHING.test(t) || (TEST_WORD.test(t) && PAST_TEST.test(t) && words.length === 0) || (PAST_TEST.test(t) && !TAUGHT.test(t))) return frame("nothing");
  if (UNKNOWN.test(t) || (wc(t) <= 3 && words.length === 0 && !subjectOf(t))) return frame("unknown");
  const taught = TAUGHT.test(t);
  const share = SHARE.test(t);
  if (taught && (words.length > 0 || subjectOf(t))) { if (share) also.push("share"); return frame("taught", { also }); }
  if (share) return frame("share");
  if (subjectOf(t) || words.length > 0) return frame("taught");
  return frame("unknown");
}

/** The frame kinds (the closed set; tests enumerate them). */
export const INTAKE_KINDS = Object.freeze(["safety", "taught", "homework", "test", "not_understood", "want", "nothing", "unknown", "share"]);
