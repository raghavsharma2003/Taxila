// Move SHAPES — telegraphic notes on what the teacher's next turn does, never lines she could say.
// Inherited law (html-portfolio `recited-prompt`): sentence-shaped prompt text gets recited verbatim,
// so nothing here is a quotable sentence, a greeting, or a praise phrase. Kit CONTENT (item prompts,
// worked examples, remediation representations) is interpolated; it is meant to be posed.

const RUNG = ["pump", "hint", "prompt", "assertion"];
const join = (...parts) => parts.filter(Boolean).join("; ");

export const greet = ({ firstName, teacherName, firstMeeting, hasCallback, warmup, topicTitle }) => join(
  `greet ${firstName} by name, warm and unhurried`,
  firstMeeting && `first meeting: name yourself — ${teacherName}, their AI teacher`,
  hasCallback && "at most one callback from the child brief, only if it fits",
  warmup ? "then pose the warm-up question (LESSON NOW) — a quick look back at something learned before"
    : `one line on today's topic (${topicTitle}); then one easy question about them`,
);

export const retrievalNext = () => "confirm the last answer in a few words — name what was right; then the next warm-up question";
export const warmupMoveOn = () => "no verdict speech on that one; it comes back later; move on";

export const hook = ({ interest, contexts, protege }) => join(
  `open with one concrete everyday situation${interest ? ` built on their interest (${interest})` : ""}${contexts.length ? ` — kit contexts: ${contexts.slice(0, 3).join(", ")}` : ""}`,
  "ask what they think will happen or which they would pick — a prediction, no right answer yet",
  "any bigger/more comparison: two quantities of one kind, in one unit — a count against a count, a distance against a distance; never across kinds",
  `mention once: at the end they will teach this to ${protege.name} (${protege.what})`,
);

export const explain = ({ skillTitle, prefix }) => join(
  prefix,
  `one idea only: ${skillTitle}`,
  "objects first, then a picture, then the symbol; point at the whiteboard anchor",
  "end with one small question that makes them USE the idea — never 'samjha?'",
);

export const worked = ({ part, parts }) => join(
  `worked example, part ${part} of ${parts}: say one step, then ask them for the next step`,
  "their thinking, your pace; no new idea",
);

const KIND_NOTE = {
  predict: "ask for their prediction before anything is shown or explained",
  contrast: "two cases side by side; ask which one fits and what is different",
  error_spot: "present it as your own working with one planted mistake; ask them to check it; never confirm the mistake as right",
  near_transfer: "same idea, new situation; let them carry it over",
  far_transfer: "real-life situation; let them find the idea in it",
  why: "ask for their reason, not just the answer",
  translate_rep: "ask them to show or say it another way (story, picture, number line)",
  retrieval: "a quick look back; no hints inside the asking",
};

/**
 * `verify`: this question checks a belief the child just voiced — the question decides it, so no verdict
 * before it (in the measured sim the teacher stated the rule, then posed the diagnostic that tests it).
 */
export const pose = ({ item, prefix, verify = false }) => join(
  prefix,
  verify && "no verdict, correction or rule about what they just said — the question decides",
  "pose the question as written, in their language; then wait",
  item.diagnostic ? "read its choices plainly; no lean in your voice toward any of them" : KIND_NOTE[item.kind],
);

export const why = ({ ageBand, contrast }) => join(
  "confirm in two or three words only — the reason is theirs to give, so do not explain it",
  ageBand !== "6-9" ? "ask how they knew or why it works about THIS question; one open question; wait"
    : contrast ? "ask how they knew — offer two reasons to pick from: the right reason vs the wrong belief (both in LESSON NOW), in either order"
      : "ask how they knew about THIS question, simply — they may say it in their own words",
  "it is a real question, not a test of whether they were lucky",
);

/**
 * A covert comprehension probe (COMPREHENSION-ENGINE.md §3, §4.1): the move shape comes from the scheduler's shape
 * RECORD (its name and family), never a written line — the voice model writes the words. Live probes are the why-class
 * shapes the live lane grades (routes/lesson.js LIVE_PROBE_SHAPES), so it is about THIS question and the reason is theirs.
 * `skin`: the persona's probe voice (a character asking), from the VIBE knobs.
 */
const FAMILY_NOTE = { B: "they judge or choose between views", C: "compare two ways", D: "predict first", E: "inside a short story" };
const SKIN_NOTE = { silly_puppet: "a silly puppet", curious_alien: "a curious alien", new_classmate: "a new classmate", cricket_commentator: "a cricket commentator", robot_golu: "Robot Golu" };
export const probe = ({ shape, ageBand, contrast, skin, protege }) => join(
  "confirm in two or three words only — the reason is theirs to give, so do not explain it",
  shape ? `covert shape: ${shape.name}${FAMILY_NOTE[shape.family] ? ` (${FAMILY_NOTE[shape.family]})` : ""}` : null,
  shape?.id === "C03" && (protege?.name ? `${protege.name}, who does not know it, asks why` : skin && SKIN_NOTE[skin] ? `voiced as ${SKIN_NOTE[skin]}, who does not know it` : null),
  ageBand === "6-9" && contrast ? "offer two reasons to pick from: the right reason vs the wrong belief (both in LESSON NOW), in either order"
    : "about THIS question; one open question; wait",
  "a real question, never a check on them",
);

/** Kit hints often carry their own rung label ("pump: …"); the shape adds it once. */
export const rungText = (h) => String(h || "").replace(/^\s*(pump|hint|prompt|assertion)\s*[:\-–]\s*/i, "");

export const hint = ({ level, rungShape, askedForAnswer }) => join(
  askedForAnswer && "they asked for the answer: decline lightly and give this nudge instead",
  `rung ${level} of 4 (${RUNG[level - 1]}): ${rungText(rungShape)}`,
  level === 4 ? "say the key plainly with a one-line reason; a similar one for them comes next" : "the key stays unsaid",
);

export const reteach = ({ representation, moveShape, again }) => join(
  `re-teach with a different representation: ${representation}`,
  `move: ${moveShape}`,
  "do not repeat the earlier explanation",
  again ? "then the same question again" : "then one small check that uses it",
);

export const changeApproach = () => join(
  "change approach — the same way is not working",
  "a smaller step: objects or the worked example, one step at a time",
  "then the same question again",
);

export const repairUnclear = () => "you did not catch it clearly: ask them to say it once more, or to tap a choice";
export const repairOffTopic = () => "one warm line about what they said; then back to the question";

/** Module-only turns: the child acted in the activity and said nothing; the lesson stays where it was. */
export const moduleGoal = ({ goal }) => join(
  `they just did it on the activity${goal ? ` (${goal})` : ""}: name exactly what they did, in a few words — the method, never ability`,
  "then carry on with the step you were on",
);
export const moduleStuck = () => join(
  "they seem stuck on the activity: one small nudge about what to try next on it",
  "the key stays unsaid; no new question",
);

export const takeBreak = () => join(
  "pause the work; struggling is a normal part of learning (about the work, never about them)",
  "offer a choice: an easier one, a short stretch break, or keep going",
);
export const stretch = () => "a 30-second stretch: stand, stretch, say ready when back";

export const safeguard = () => join(
  "STOP the lesson; calm, warm, plain words",
  "acknowledge what they said; ask if they are safe right now",
  "tell them to tell a trusted adult now — parent, a teacher",
  "share Childline 1098 (free, 24x7, for children) and Tele-MANAS 14416",
  "never promise secrecy; stay with them",
);
export const safeguardStay = () => "stay with them and keep listening; no lesson content; a trusted adult and Childline 1098 again if needed";
export const resumeAfterSafeguard = () => "gently ask whether they want to carry on with the lesson or stop for today — either is fine";

export const teachback = ({ protege }) => join(
  `${protege.name} (${protege.what}) wants to learn today's idea`,
  `ask the child to teach ${protege.name} the big idea in their own words`,
  `you voice ${protege.name} in one short line; no hints inside the asking`,
);
export const teachbackFollowup = ({ protege, missing }) => join(
  `${protege.name} asks one naive question about: ${missing}`,
  "curious, not testing; let the child explain",
);

export const wrap = ({ prefix, nextTitle, stopping }) => stopping
  ? "they want to stop: stop now; short warm goodbye; nothing left hanging"
  : join(
    prefix,
    "wrap up: name one specific thing they did today — the method, never ability",
    nextTitle && `one plain line on what comes next time (${nextTitle})`,
    "warm goodbye; no pressure to come back, no cliffhanger",
  );

/** Prefixes that confirm a just-finished answer before the next thing. */
export const CONFIRM = {
  correct: "confirm specifically: name the exact thing they got right, no ability words",
  whyGood: "acknowledge their reason specifically — the method",
  whyMissed: "give the reason yourself in one plain line (their answer was right)",
  teachbackPass: "celebrate the explanation specifically — which idea they made clear",
};
