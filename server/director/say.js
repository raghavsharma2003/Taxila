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
  "correct", "that'?s\\s+(?:right|correct|it)", "you'?re\\s+right", "right(?=\\s*[!,.])", "exactly", "perfect", "great(?:\\s+job|\\s+work)?",
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
export function verdictFor(cls, target, { moduleOnly = false } = {}) {
  if (!cls || !target || target.mode === "none" || moduleOnly) return "ungraded";
  if (cls.outcome === "correct") return "correct";
  if (cls.outcome === "partial") return "partial";
  if (cls.outcome === "incorrect" || cls.outcome === "misconception") return "not_yet";
  return "unverified";
}

/** The child-facing verdict (UiDirectives.verdict) — only for a graded kit item, never for a covert why / teach-back. */
export function uiVerdict(cls, target) {
  if (!cls || target?.mode !== "item") return undefined;
  return ({ correct: "correct", partial: "partial", incorrect: "not_yet", misconception: "not_yet" })[cls.outcome];
}

/**
 * G-PRAISE-1. → null when the words agree with the verdict, else "praise" (agreement/praise for an answer not marked
 * correct) or "contradicts" (a "wrong" opening after a correct one).
 */
export function praiseProblem(text, verdict) {
  const t = String(text ?? "").trim();
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
  const praising = (x) => PRAISE_ANY.test(x) || PRAISE_OPEN.test(x) || AGREE_OPEN.test(x);
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
