// The INTAKE beat's move shapes (TUTOR-MODEL §2.2). Telegraphic NOTES for the reply model, never lines she could say
// (sentence-shaped prompt text gets recited: no quotes, no example sentences, no "I" or "you" lines). The intake has no stage
// build (NO_STAGE_BEATS: patch request 03 adds "intake" there). Tests lint these (tests/r4-conversation-session.test.mjs).

const clean = (s, n = 48) => String(s ?? "").replace(/[^\p{L}\p{N} ,'-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, n);

/** Turn 0: greet by their address; ONE open question about what was taught at school today; no list, no second question. */
export const intakeOpen = ({ young = false } = {}) => young
  ? "greet them by name in a few warm words; then one simple open question about what happened in class today; no list of subjects, no second question"
  : "greet them by name in a few warm words; then ONE open question about school today, what their teacher taught; no list of topics, no second question, no test framing";

/** A life share in place of an answer: one warm specific line on it, no follow-up question; then the school question once more. */
export const intakeShare = () => "they shared something from their day: one warm, specific line on it in their own words, no question about it; then the school-today question again, once, lightly";

/** Two candidate chapters, neither certain: a two-way choice, never a menu. */
export const intakeWhich = ({ a, b }) => `not sure which of two school topics they mean: one short two-way question, ${clean(a)} or ${clean(b)}, in their language; nothing else`;

/** Mapped with confidence: uptake of their words, then ask them to show ONE thing their teacher did, as this question. */
export const intakeConfirm = () => "say back the topic in their own words; then ask them to show one thing their teacher did in class, as the question below; warm and curious, no test framing, no verdict words";

/** A test coming up with no topic named: ask once what it covers (chapter or page). */
export const intakeTestScope = () => "a test is coming: one short question on what it covers, which chapter or topic; no worry words, no pressure";

/** Nothing recognisable or "pata nahi" with a known school position: recognition, the two most likely chapters as a choice. */
export const intakeRecognise = ({ a, b }) => `they cannot recall it: one light two-way choice of the likely school topics, ${clean(a)} or ${clean(b)}, or something else; no pressure`;

/** The intake is decided: receive what they said in a few words; the agenda in ONE spoken line built from the decided segment
 *  (what comes now, then a short look back); one two-way choice of order at most; never a list of topics. */
export const intakeAgenda = ({ purpose }) => {
  const now = { child_request: "what they asked for", test_revise: "getting ready for the test", homework: "their homework, step by step, never doing it for them",
    school_continue: "carrying on from what their teacher did", school_reteach: "today's class idea again, a new way in", review: "a quick look back at an earlier idea",
    level_path: "the next idea on their path", explore: "a short look at what they asked about", foundation: "a short foundation step first, then today's class idea" }[purpose] ?? "today's idea";
  return `receive their words in a few of yours; the agenda in one short spoken line: ${now}; at most one two-way choice of order (an example first or a try first); never a list of topics`;
};

/** A want outside the books with the explore tier off: say honestly it is not in their books today; the plan's topic instead. */
export const intakeWantOutside = () => "what they asked about is not in their school books here: say so honestly in a few words, warmly, with no promise to teach it later; then what is next today";

/** The intake beat's shapes (for the lint test). */
export const INTAKE_SHAPES = Object.freeze({ intakeOpen, intakeShare, intakeWhich, intakeConfirm, intakeTestScope, intakeRecognise, intakeAgenda, intakeWantOutside });
