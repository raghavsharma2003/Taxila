// Code predicates over what the teacher SAYS, against what the Director decided and what the screen shows
// (PRODUCT-DESIGN-V2 §4.6, §4.10; audit #6, #13). Inherited law: safety and truth by predicate, not instruction.
//
//   G-PRAISE-1  a confirmation never contradicts the verdict: no praise or agreement for an answer the verified-key
//               classifier did not mark correct (audit: "Bilkul" after "25" for "what comes after 25?"), and no
//               "wrong / not quite" opening after one it did.
//   G-SAY-1     a line that sends the child to the screen (tap, touch, click, the choices below…) needs something on
//               the screen to act on in the SAME response: Director chips (UiDirectives.chips) or a mounted module
//               (audit: "60 mein se choice tap karo" with no choices shown).
//   ask         the written question for the Question card (UiDirectives.ask), taken from what was actually said
//               when the turn has no kit item.

const S = "[^\\p{L}\\p{N}]";
const lead = (alts) => new RegExp(`(?:^|[.!?।]\\s*|—\\s*|,\\s*(?=(?:bilkul|sahi|correct|exactly|perfect|shabaa?sh)))(?:${alts})(?=${S}|$)`, "iu");

/** Words that open a turn as agreement or praise. "Haan"/"yes" count only after an answer that was not right. */
const PRAISE_OPEN = lead([
  "bilkul(?:\\s+sahi|\\s+theek)?", "sahi(?!\\s+(?:answer|jawab|uttar|tareeka|tarika|kya|kaun|kaunsa|wala|wali)\\s*(?:kya|kaun|kaunsa|hoga|hai\\s+kya|\\?))(?:\\s+hai|\\s+jawab|\\s+answer|\\s+kaha|\\s+bataya|\\s+pakda)?",
  "correct", "that'?s\\s+(?:right|correct|it)", "you'?re\\s+right", "right(?=\\s*[!.])", "exactly", "perfect", "great(?:\\s+job|\\s+work)?",
  "well\\s+done", "very\\s+good", "good\\s+job", "nice(?!\\s+try)", "shabaa?sh(?:i)?", "waa?h", "badhiya", "bahut\\s+(?:accha|achha|acha|badhiya|khoob|sahi)",
  "zabardast", "awesome", "excellent", "brilliant", "super", "ekdam\\s+(?:sahi|theek)", "theek\\s+(?:kaha|bataya)", "haan\\s+ji,?\\s+(?:sahi|bilkul)",
  "सही", "बिल्कुल", "शाबाश", "बहुत\\s+(?:अच्छा|बढ़िया)",
].join("|"));
const AGREE_OPEN = lead(["haan(?:\\s+ji)?", "ha+n", "yes", "yep", "hmm\\s+haan", "हाँ", "हां"].join("|"));
/** Praise of the answer anywhere in the turn. */
const PRAISE_ANY = new RegExp([
  `(?:aapka|tumhara|tera|your|yeh|ye|that|this|it)\\s+(?:answer|jawab|uttar)?\\s*(?:bilkul\\s+|ekdam\\s+)?(?:sahi|correct|right|theek)(?:\\s+(?:hai|tha|is|was))?(?![\\p{L}]|\\s+(?:nahi|nahin|not|hai\\s+kya|kya))`,
  `(?:aapne|tumne|you)\\s+(?:bilkul\\s+|ekdam\\s+)?(?:sahi|correct(?:ly)?|right)\\s+(?:kaha|bataya|socha|pakda|nikala|got|said|found)`,
  `you\\s+got\\s+it`, `that(?:'?s|\\s+is)\\s+(?:right|correct)`, `sahi\\s+jawab(?!\\s+(?:kya|kaun|kaunsa|hoga))`,
].join("|"), "iu");
/** A "not right" opening, after an answer the classifier marked correct. */
const DENY_OPEN = lead(["galat", "wrong", "not\\s+quite", "not\\s+right", "incorrect", "nope", "oops", "almost", "lagbhag", "thoda\\s+(?:sa\\s+)?galat",
  "nahi,?\\s+(?:ye|yeh)\\s+(?:sahi|theek)", "गलत"].join("|"));

/**
 * The verdict the teacher's words must agree with, from the classification of the child's turn on a graded target.
 * "ungraded": there was nothing to grade (no item, a teaching turn) — no constraint. "correct" | "not_yet" |
 * "partial" | "unverified" (an attempt the classifier could not label: praise would be praise on an unverified answer).
 * @param {{ outcome?: string } | null | undefined} cls  @param {{ mode: string }} target
 */
export function verdictFor(cls, target, { moduleOnly = false, childText = "" } = {}) {
  if (!cls || !target || target.mode === "none" || moduleOnly) return "ungraded";
  if (cls.outcome === "correct") return "correct";
  if (cls.outcome === "partial") return "partial";
  if (cls.outcome === "incorrect" || cls.outcome === "misconception") return "not_yet";
  // The child asked something rather than answered: there is no answer to praise or not ("Great question!" is fine).
  if (childAsks(childText)) return "ungraded";
  return "unverified";
}

/** Is the child's turn a question of their own (not an answer with a rising "?")? */
export const childAsks = (text) => {
  const t = String(text ?? "").trim();
  if (!t || /^[-−]?[\d,./\s]+\??$/.test(t)) return false;
  return /[?？]\s*$/.test(t) || /^(?:kya|kyun|kyon|kaise|kaun|kaunsa|kab|kahan|kitna|kitne|why|how|what|which|who|when|where|can|could|is|are|do|does|क्या|क्यों|कैसे)(?![\p{L}\p{M}])/iu.test(t);
};

/** The child-facing verdict (UiDirectives.verdict) — only for a graded kit item, never for a covert why / teach-back. */
export function uiVerdict(cls, target) {
  if (!cls || target?.mode !== "item") return undefined;
  return ({ correct: "correct", partial: "partial", incorrect: "not_yet", misconception: "not_yet" })[cls.outcome];
}

/**
 * G-PRAISE-1. → null when the words agree with the verdict, else "praise" (agreement/praise for an answer not marked
 * correct) or "contradicts" (a "wrong" opening after a correct one).
 */
/**
 * Warmth about the child's question, effort or thinking — not about the answer — is never a verdict ("Great
 * question!", "Nice try", "Good thinking", "Achhi koshish"). Removed before the praise predicates run.
 */
const EFFORT = /(?:^|(?<=[^\p{L}]))(?:(?:very|really|such\s+a|what\s+a)\s+)?(?:great|good|nice|lovely|interesting|smart|accha|achha|acha|achhi|acchi|badhiya|bahut\s+(?:accha|achha|achhi|badhiya))\s+(?:question|questions|try|effort|thinking|thought|idea|guess|attempt|socha|sawaal|sawal|koshish|prashn)(?![\p{L}])/giu;
export const withoutEffortPraise = (text) => String(text ?? "").replace(EFFORT, " ");

export function praiseProblem(text, verdict) {
  const t = withoutEffortPraise(text).trim();
  if (!t || verdict === "ungraded") return null;
  if (verdict === "correct") return DENY_OPEN.test(t) ? "contradicts" : null;
  // partial: "nearly" is honest; "bilkul / sahi" is not.
  if (PRAISE_OPEN.test(t) || PRAISE_ANY.test(t)) return "praise";
  if (verdict === "not_yet" && AGREE_OPEN.test(t)) return "praise";
  return null;
}

const OPENER = /^\s*(?:[\p{L}]+\s*[,—-]\s*)?(?:bilkul(?:\s+sahi)?|sahi(?:\s+hai)?|correct|exactly|perfect|great|well\s+done|very\s+good|good\s+job|nice|shabaa?shi?|waa?h|badhiya|bahut\s+(?:accha|achha|acha|badhiya)|zabardast|awesome|excellent|super|haan(?:\s+ji)?|yes|सही|बिल्कुल|शाबाश|हाँ|हां)\s*[,!.—-]+\s*/iu;

/** The turn with its praise / agreement removed: sentences that praise the answer, and a praising opener on a question. */
export function stripPraise(text) {
  const sentences = String(text ?? "").match(/[^.!?।]+[.!?।]*\s*/g) ?? [];
  const praising = (x) => { const y = withoutEffortPraise(x).trim(); return PRAISE_ANY.test(y) || PRAISE_OPEN.test(y) || AGREE_OPEN.test(y); };
  let out = sentences.filter((x) => /[?？]/.test(x) || !praising(x)).join("").trim();
  for (let i = 0; i < 3 && OPENER.test(out); i++) out = out.replace(OPENER, "");
  return out ? out[0].toUpperCase() + out.slice(1) : "";
}

// ── G-SAY-1 ──
const UI_WORDS = new RegExp([
  "\\b(?:tap|taps|tapping|touch|click|press|drag|swipe)\\b",
  "\\b(?:chhoo|chhuo|chhuiye|chhoona|chuo|dabao|dabaiye|dabana|daba\\s+do)\\b",
  "\\bscreen\\b", "\\bbuttons?\\b", "\\btiles?\\b", "\\bchips?\\b",
  "\\b(?:neeche|niche|below|upar|above)\\s+(?:diye|di|diya|wale|wali|ke|ki|the|these|those)?\\s*(?:gaye\\s+)?(?:options?|choices?|cards?|pictures?|boxes?|buttons?)\\b",
  "\\b(?:options?|choices?)\\s+(?:mein\\s+se\\s+)?(?:ek\\s+)?(?:tap|chuno|chuniye|select|on\\s+the\\s+screen)\\b",
  "टैप", "छूओ", "छुओ", "दबाओ", "स्क्रीन", "बटन",
].join("|"), "iu");

/** Does this line send the child to something on the screen? */
export const refersToScreen = (text) => UI_WORDS.test(String(text ?? ""));

/**
 * What the child can act on in this response: Director chips, or a module mounted in the tray.
 * @param {{ chips?: unknown[] } | null | undefined} ui  @param {{ id?: string } | null | undefined} module  state.module after step()
 */
export const screenHasTargets = (ui, module) => !!(ui?.chips?.length || module?.id);

/** G-SAY-1 → true when the line refers to the screen and nothing on it can be acted on. */
export const screenProblem = (text, ui, module) => refersToScreen(text) && !screenHasTargets(ui, module);

/** The line without the sentences that refer to the screen (null if nothing that hands the floor back is left). */
export function stripScreenRefs(text) {
  const sentences = String(text ?? "").match(/[^.!?।]+[.!?।]*\s*/g) ?? [];
  return sentences.filter((s) => !refersToScreen(s)).join("").trim();
}

// ── the Question card ──
export const ASK_MAX = 120;

/**
 * A question for the card, ≤ ASK_MAX characters: the whole text when it fits; else its last sentences that fit and
 * contain the question; else a word-boundary cut with an ellipsis. Never invented: always the text's own words.
 */
export function askText(text) {
  const t = String(text ?? "").replace(/\s+/g, " ").trim();
  if (t.length <= ASK_MAX) return t;
  const sentences = t.match(/[^.!?।]+[.!?।]*\s*/g) ?? [t];
  let out = "";
  for (let i = sentences.length - 1; i >= 0; i--) {
    const next = (sentences[i] + out).trim();
    if (next.length > ASK_MAX) break;
    out = sentences[i] + out;
  }
  out = out.trim();
  if (out && /[?？]/.test(out)) return out;
  const cut = t.slice(0, ASK_MAX - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 60)).trim()}…`;
}

/** The question a teacher turn hands back (its last sentence with a "?", else its last sentence), for the card. */
export function askFromReply(reply) {
  const sentences = (String(reply ?? "").replace(/\s+/g, " ").match(/[^.!?।]+[.!?।]*/g) ?? []).map((s) => s.trim()).filter(Boolean);
  const q = [...sentences].reverse().find((s) => /[?？]/.test(s)) ?? sentences.at(-1);
  return q ? askText(q) : null;
}

// ── G-LEAK-1 (audit §4.4: "Whiteboard: 45,000 ko…") ──
const STAGE = /(?:^|[\s(—-])(?:whiteboard|board|ask|shape|move|note|key|ladder|rung|lesson now|one more check|turn shape|your move)\s*:|[\[\]*#_]{1,}|\bTURN SHAPE\b|\bLESSON NOW\b/i;
/** Does a spoken line carry a stage direction, a prompt field name or markup? */
export const leaksStage = (text) => STAGE.test(String(text ?? "").replace(/_{2,}/g, " "));
/** The line without field labels and markup (the words after a label stay: they were meant to be said). */
export const stripStage = (text) => String(text ?? "")
  .replace(/(^|[\s(—-])(?:whiteboard|board|ask|shape|move|note|key|ladder|rung|lesson now|one more check|turn shape|your move)\s*:\s*/gi, "$1")
  .replace(/\[[^\]]*\]/g, " ").replace(/[\[\]*#]+/g, "").replace(/\s{2,}/g, " ").replace(/\s+([,.!?])/g, "$1").trim();

// ── G-ASK parity (audit flows G4: the card said "13 ka square kitna hai?" while she asked "10 ka square kitna hoga?"; two
// questions in one turn) ──
const normQ = (t) => String(t ?? "").toLowerCase().replace(/…/g, " ").replace(/[^\p{L}\p{N}/]+/gu, " ").trim();
const sentencesOf = (t) => (String(t ?? "").replace(/\s+/g, " ").match(/[^.!?।？]+[.!?।？]*/g) ?? []).map((x) => x.trim()).filter(Boolean);
const isQuestion = (x) => /[?？]/.test(x);

/**
 * How a reply stands against the pinned question (UiDirectives.ask.text): does it END on that question (its last words
 * are the ask's words), and how many questions does it put to the child — the ask itself counts once however many
 * question marks it carries, every other question sentence counts one. Pure; the battery and the reply guard share it.
 * `ask` null: only the question count (a turn with no pinned item).
 * @returns {{ endsOnAsk: boolean, questions: number, finalQuestion: string | null }}
 */
export function askParity(reply, ask) {
  const r = normQ(reply);
  const a = normQ(ask);
  // A card ask cut with "…" (askText: no sentence fits 120 characters) is a prefix of the question: contained is enough.
  const endsOnAsk = !a || (!!r && (/…\s*$/.test(String(ask)) ? r.includes(a) : r.endsWith(a)));
  const rest = a && r.includes(a) ? String(reply).split(new RegExp(escapeRe(String(ask).replace(/…$/, "").trim()), "i")).join(" ") : String(reply ?? "");
  const others = sentencesOf(rest).filter(isQuestion).length;
  const askIn = a && r.includes(a) ? 1 : 0;
  const finalQuestion = [...sentencesOf(reply)].reverse().find(isQuestion) ?? null;
  return { endsOnAsk, questions: others + askIn, finalQuestion };
}
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The reply rewritten in code to end on the pinned question and hold no other: every question sentence that is not
 * the ask is dropped, and the ask closes the turn. What was said before (the acknowledgement, the nudge) stays. The
 * hint itself is on the card (UiDirectives.hint), so a scaffold question that is dropped is not lost to the child.
 */
export function endOnAsk(reply, askFull) {
  const a = normQ(askFull);
  const kept = sentencesOf(reply).filter((x) => !isQuestion(x) && !(a && normQ(x) && a.includes(normQ(x))));
  return `${kept.join(" ").trim()} ${askFull}`.replace(/\s{2,}/g, " ").trim();
}

/** Keep only the LAST question of a turn with no pinned item (one question per turn). */
export function lastQuestionOnly(reply) {
  const ss = sentencesOf(reply);
  const lastQ = ss.map(isQuestion).lastIndexOf(true);
  return ss.filter((x, i) => !isQuestion(x) || i === lastQ).join(" ").trim();
}

// ── wrap language only on a wrap move (personalisation 13: "Aaj ke liye bas itna." in a probe turn, mid-lesson) ──
const WRAP_WORDS = /\b(?:aaj\s+ke\s+liye\s+(?:bas\s+)?(?:itna|itni|yahin|ye(?:h)?\s+hi)|aaj\s+(?:ka\s+)?(?:lesson|class|session)\s+(?:khatam|khatm|poora|pura|yahin)|that'?s\s+(?:all|it)\s+for\s+today|see\s+you\s+(?:next\s+time|tomorrow|soon|later)|(?:phir|kal|jaldi)\s+milte\s+hain|good\s*bye|bye[\s-]*bye|alvida|we(?:'re|\s+are)\s+done\s+for\s+today|let'?s\s+stop\s+(?:here|for\s+today))\b|आज\s+के\s+लिए\s+(?:बस\s+)?इतना|फिर\s+मिलते\s+हैं/iu;
/** Does a line close the lesson (a goodbye, "that's all for today")? Only a wrap move may say that. */
export const wrapsUp = (text) => WRAP_WORDS.test(String(text ?? ""));
/** The line without its closing sentences. */
export const stripWrap = (text) => sentencesOf(text).filter((x) => !wrapsUp(x)).join(" ").trim();

// ── G-PRAISE-2: the words never correct a right answer (W1-A local battery, 2026-10-04: a class-2 diagnostic "2, 4, 6,
// 8… and one more: how many?" key 9; the child tapped 9, graded correct, and she said "yahan 8 ke baad 2 jodna tha,
// isliye 10" — no "wrong" word for G-PRAISE-1 to catch, only a wrong option stated as the result) ──
const tokenRe = (a) => {
  const s = String(a).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return new RegExp(`(?<![\\p{L}\\p{N}/.])${s}(?![\\p{L}\\p{N}/]|\\.\\d)`, "iu");
};
/**
 * The wrong answers a graded target put in front of the child: a diagnostic's other options and the offered
 * "Show me choices" tiles that are not the key. Short labels only (a long option is a sentence, not an answer token).
 * @param {{ mode?: string, key?: string, also?: string[], options?: { text: string }[], offered?: string[] } | null} target
 */
export function wrongAnswersOf(target) {
  if (!target || target.mode !== "item") return [];
  const keys = new Set([target.key, ...(target.also ?? [])].filter((k) => k != null).map((k) => normQ(k)));
  const all = [...(target.options ?? []).map((o) => o?.text), ...(target.offered ?? [])];
  return [...new Set(all.filter((x) => typeof x === "string" && x.trim() && x.length <= 20 && !keys.has(normQ(x))))];
}
/**
 * Does a reply to a RIGHT answer state one of the wrong answers as the result, in its acknowledgement? The
 * acknowledgement is every non-question sentence that is not mostly the next question (`nextPrompt`, which may
 * itself hold the same numbers). A sentence that also says the key is a contrast ("9, not 10"), never a correction.
 * @returns {boolean}
 */
export function correctsRight(reply, { key, wrong = [], nextPrompt = "" } = {}) {
  if (!wrong.length || key == null || String(key).trim() === "") return false;
  const p = new Set(normQ(nextPrompt).split(" ").filter(Boolean));
  const mostlyNext = (x) => { const w = normQ(x).split(" ").filter(Boolean); return p.size > 0 && w.length > 0 && w.filter((v) => p.has(v)).length / w.length >= 0.6; };
  const keyRe = tokenRe(key);
  return sentencesOf(reply).filter((x) => !isQuestion(x) && !mostlyNext(x))
    .some((x) => !keyRe.test(x) && wrong.some((w) => tokenRe(w).test(x)));
}
/** The reply without the acknowledgement sentences that state a wrong answer (what is left, possibly empty). */
export function stripCorrection(reply, { key, wrong = [], nextPrompt = "" } = {}) {
  return sentencesOf(reply).filter((x) => !correctsRight(x, { key, wrong, nextPrompt })).join(" ").trim();
}
