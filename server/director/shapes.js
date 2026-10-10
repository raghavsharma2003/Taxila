// Move SHAPES — telegraphic notes on what the teacher's next turn does, never lines she could say.
// Inherited law (html-portfolio `recited-prompt`): sentence-shaped prompt text gets recited verbatim,
// so nothing here is a quotable sentence, a greeting, or a praise phrase. Kit CONTENT (item prompts,
// worked examples, remediation representations) is interpolated; it is meant to be posed.

import { p5Flag } from "../conversation/flags.js";

const RUNG = ["pump", "hint", "prompt", "assertion"];
const join = (...parts) => parts.filter(Boolean).join("; ");

/**
 * `renamed`: the teacher's name differs from the child's last lesson (the child named her, or picked another teacher).
 * `interest`: an interest the parent picked at onboarding (child.interests, under the memory consent), never a guess. It used to reach the
 * teacher only through the brief row that sheds first under the prompt budget (compile.js drop 3), and the greeting
 * then asked about a topic of its own (audit #7).
 */
export const greet = ({ firstName, teacherName, firstMeeting, renamed, hasCallback, warmup, topicTitle, interest }) => join(
  `greet ${firstName} by name, warm and unhurried`,
  firstMeeting && `first meeting: name yourself — ${teacherName}, their AI teacher`,
  // the child gave the teacher a new name (decision child-names-teacher): she answers to it, and the disclosure is
  // said again under it — the name never changes what she is
  !firstMeeting && renamed && `new name from the child: answer to ${teacherName}; say once you are still their AI teacher`,
  hasCallback && "at most one callback from the child brief, only if it fits",
  warmup ? "then pose the warm-up question (LESSON NOW) — a quick look back at something learned before"
    : `one line on today's topic (${topicTitle})${interest ? `, tied to their interest (${interest}) if it fits` : ""}; then one easy question about them`,
);

export const retrievalNext = () => "confirm the last answer in a few words — name what was right; then the next warm-up question";
export const warmupMoveOn = () => "no verdict speech on that one; it comes back later; move on";

export const hook = ({ interest, contexts, protege }) => join(
  `open with one concrete everyday situation${interest ? ` built on their interest (${interest})` : ""}${contexts.length ? ` — kit contexts: ${contexts.slice(0, 3).join(", ")}` : ""}`,
  "ask what they think will happen or which they would pick — a prediction, no right answer yet",
  "any bigger/more comparison: two quantities of one kind, in one unit — a count against a count, a distance against a distance; never across kinds",
  `mention once: at the end they will teach this to ${protege.name} (${protege.what})`,
);

/**
 * round 3 fix (experience B7): the clauses a composed move shape may lose when it would not fit the MOVE section, least
 * important first (state.js fitShape). Before this a share uptake in front of an interest hook in the aap register was 263
 * tokens against the cap of 260 and compile threw: a 500 and "Your answer didn't send" on the c7 opener, 2 of 2. Each is a
 * clause this file emits whose job a code guard also does (the kit contexts are examples only; the protégé line comes back
 * at the teach-back; the comparison rule is say.js mixedUnitComparison; the child's own words are in the transcript).
 */
export const OPTIONAL_CLAUSES = Object.freeze([
  / — kit contexts: [^;]*/,
  /; mention once: at the end they will teach this to [^;]*/,
  /; any bigger\/more comparison: two quantities of one kind, in one unit — a count against a count, a distance against a distance; never across kinds/,
  /(?<=they shared something from their life) \([^()]*\)(?=:)/,
  /(?<=they brought up) [^:;]{30,}(?=:)/,
]);

export const explain = ({ skillTitle, prefix, interest }) => join(
  prefix,
  `one idea only: ${skillTitle}`,
  interest && `an example from their interest (${interest}) if it fits naturally`,
  // F16 (evals/owner-truth): "then a picture … point at the whiteboard anchor" with nothing drawn made her draw with
  // characters, deny she can draw, or recite "Whiteboard anchor:"; the screen is named only by the on-screen facts row
  "objects first, then the symbol; point at the screen only at what the on-screen row lists; never a drawing made of characters",
  "end with one small question that makes them USE the idea — never 'samjha?'",
);

export const worked = ({ part, parts }) => join(
  `worked example, part ${part} of ${parts}: say one step, then ask them for the next step`,
  "their thinking, your pace; no new idea",
);

// ── the guidance ladder (director/fading.js, W2-C #2) ──
/** The one-turn first-step probe (steal 2): only what they would do FIRST; B1 (classes 1-2) is asked about the process. */
export const firstStep = ({ band } = {}) => join(
  "pose the worked example in LESSON NOW; give no step of it",
  band === "B1" ? "ask how they would start it — the doing, not the answer" : "ask only what they would do first; one short question; wait",
  "no verdict on what they say; this is to know where to begin",
);
export const firstStepStarted = () => "they could start it: no teaching of the steps; a question for them to try";
export const firstStepStuck = () => "they could not start yet: no verdict; show the way in, one step at a time";
/** The faded step: the earlier steps are said briefly; the gap is theirs (its key stays unsaid, like any question). */
export const fadedStep = ({ band } = {}) => join(
  "the earlier steps in LESSON NOW, said briefly as done",
  band === "B1" ? "then ask what we do next — the step with the gap" : "then the step with the gap is theirs: pose it as written; wait",
  "never fill the gap for them",
);
/** Ask (a doubt): her first turn is about THEIR question, never a greeting or a hook. */
export const answerQuestion = () => join(
  "their question first (LESSON NOW): one idea that answers it, simply, from today's topic",
  "no greeting speech beyond their name; no hook",
  "end with one small question that makes them use the idea",
);
// ── the practice purpose (W2-C #7) ──
export const practiceOpen = ({ of }) => `practice set of ${of}: no greeting speech beyond their name, no hook; straight to the first question`;
export const practiceSummary = () => join(
  "the practice set is done: name one thing that went right in it — the method, never ability",
  "one question that needs another go next time, if any; no new teaching",
  "warm goodbye; nothing left hanging",
);
/** Equity profile (steal 4): ONE next step, never a menu of choices. */
export const takeBreakOneStep = () => join(
  "pause the work; struggling is a normal part of learning (about the work, never about them)",
  "one next step only: an easier one; no list of options",
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

/** Kit hints often carry their own rung label ("pump: …", "Prompt: …", "Assert: …"); the shape adds it once. */
export const rungText = (h) => String(h || "").replace(/^\s*(?:pump|hint|prompt|assert(?:ion)?|point|ask|nudge|clue)\s*[:\-–]\s*/i, "");

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

/** `chips`: choices are on screen THIS turn (UiDirectives.chips). Without them the shape never mentions tapping (G-SAY-1). */
// F14 (evals/owner-truth): "say it once more, slowly" was said to a child who had asked HER to go slowly; the pace is hers
export const repairUnclear = ({ chips = false } = {}) => (chips
  ? "you did not catch it clearly: ask them to say it once more, or to tap one of the choices on screen"
  : "you did not catch it clearly: ask them to say it once more");
// F11: "one warm line…; then back to the question" produced "baad mein baat karenge" — the child's words get a real answer
export const repairOffTopic = () => "they said or asked something else: answer it for real first, in one or two warm lines — no deferring it to later; then a light bridge to the question";

// ── typed turns and the unclear-try cap (BUILD-PLAN W1-A items 5 and 8; audit flows G4, comprehension G11) ──
/** A typed reply that answers nothing (no attempt): never "say it again" — they typed it; a small nudge, then the same question. */
export const typedNoAnswer = () => join(
  "their typed reply did not answer the question: no verdict, never ask them to repeat or say it again",
  "one small nudge toward what the question asks; then the same question again, as written",
);
/** The third unclear reply on one item: the choices go on screen (UiDirectives.chips) and the question is asked once more. */
export const offerChoices = () => join(
  "no verdict on their reply; the choices are now on screen",
  "the same question again, as written; tell them they can pick one of the choices on screen",
  "do not read the choices with any lean toward one",
);
/** Unclear past the cap: this item is left without a verdict (no evidence) and the lesson moves on. */
export const MOVE_ON_UNCLEAR = "leave this one for later, no verdict and no answer given; the next question";

// ── the child's help requests (Hint sheet, Young Help menu): client actions, never the child's words ──
/** "Show me choices": the choices for THIS question are on screen now. */
export const showChoices = () => join(
  "they asked to see choices: the choices for this question are on screen now",
  "the same question again, as written; let them pick one of the choices on screen",
  "do not read the choices out with any lean toward one; the key stays unsaid",
);
export const SKIP_ITEM = "they asked to skip this one for now: no verdict, it comes back another day; the next question";
export const KNOWS_IT = "they say they know this: no teaching; let them show it";
export const SLOWER = "they asked you to slow down: you go slower — short simple words, one small step at a time, a pause between steps; never ask them to speak slowly";
// ── the child's requests in words (director/requests.js; OWNER TEST 2026-10-04 items 3-5) ──
export const STORY_ASKED = "they asked for it as a story: the same idea told as a tiny everyday story with a character, in a few lines";
export const EXAMPLE_ASKED = "they asked for an example: one concrete example from everyday life, with your own numbers";
export const ANOTHER_ASKED = "they asked for it another way: a new, simpler way in — not the words you used before";
/** "Show me why" / "Explain it differently" / "Show me how" / an example / a story, on the question on the table. */
export const helpExplain = ({ how, example = false, story = false }) => join(
  how ? "they asked how to do it: show the first step only, with a smaller example of your own (different numbers)"
    : example ? "they asked for an example: one concrete everyday example of the same idea, with your own different numbers"
      : story ? "they asked for a story: the same idea as a tiny everyday story with a character, a few lines, your own numbers"
        : "they asked for it another way: one new, simpler picture of the same idea, with a different example",
  "the key stays unsaid",
  "then the same question again, as written",
);
// owner-truth patch 07's own stopCheck is not added: W2-I's stopCheck (below) is the one check-in shape (reconciled 2026-10-05).
export const changeTopic = () => join(
  "they want to talk about something else: say yes warmly — the lesson can wait a moment",
  "ask what they would like to talk about, in a few words; a button on the screen brings them back to the lesson",
  "no lesson question this turn",
);
/** The one side-chat turn after change_topic: their topic, for real. */
export const sideChat = () => join(
  "talk with them about what they just brought up, for real: two or three warm lines, a question back about it",
  "then offer to go back to the lesson whenever they like (a button on the screen); no lesson question this turn",
);
/** "Cricket ke baare mein baat karo": their interest, now, as the way into the same idea. `subject`: letters only, ≤ 30. */
export const topicAsked = ({ subject, teaching = false }) => join(
  `they asked to talk about ${subject}: say something real about ${subject} first (one or two lines, never 'later')`,
  teaching ? `then explain the same idea with a ${subject} example; end with one small question about it` : `then use ${subject} as the setting for the same question`,
);
const LANG_NAME = { hindi: "simple Hindi (Roman script when written)", english: "simple English", hinglish: "Hinglish" };
/** "Hindi mein samjhao" / "English mein batao": the language changes now and stays (compile.js langPinned). */
export const languageAsked = ({ lang, teaching = false }) => join(
  `they asked for ${LANG_NAME[lang] ?? lang}: from now on every turn in ${LANG_NAME[lang] ?? lang}, even if they reply in another language`,
  teaching ? "say the last idea again in it, simply, and end with one small question" : "say the question in it",
);
/** "Show me a diagram" (item 5): a picture on the stage this turn; state.js step adds whether one is mounted. */
export const showVisual = ({ kind = "diagram" } = {}) => join(
  kind === "game" ? "they want to play: the activity is the way in now" : kind === "animation" ? "they asked to see it moving: name the movement in your first words — what on the screen they can move, drag or tap, and what changes as they do (never a video you do not have)" : "they asked to see it: a picture of the same idea",
  "one idea; let the picture do the work; a few words about what to look at",
  "the key stays unsaid; then one small question about what they see",
);
export const VISUAL_ON_STAGE = "it is on the screen now: point them at it in your first words and say what to look at";
// round 3 fix (experience B2 / B3): the game / moving ask's first clause, made true once the turn knows what is on the screen
// (brain/turn.js after the play compose and the Studio slot): "game mode on. Screen par numbers dekho" was said over a
// number pad, "drag kijiye" over a tap game, "start test dabaiye" over a button labelled otherwise.
const GAME_CLAUSE = "they want to play: the activity is the way in now";
const MOVING_CLAUSE = "they asked to see it moving: name the movement in your first words — what on the screen they can move, drag or tap, and what changes as they do (never a video you do not have)";
const ASK_TRUTH = {
  game: {
    engine: "they asked for a game: no game is ready for this yet, say so honestly in a few words; the activity already on the screen is how to try it now (never call it a game)",
    none: "they asked for a game: no game is ready for this yet, say so honestly in a few words; then try it together in words, with everyday things",
  },
  moving: {
    engine: "they asked to see it moving: the activity on the screen is the thing to try; name only what it really shows (never a control it does not have, never a video)",
    none: "they asked to see it moving: nothing moves on the screen this turn, say so in a few words; then show it in words with everyday things (never ask them to drag or tap)",
  },
};
/** PURE. The visual ask's first clause for what the turn really put on the screen ("engine" kept, or "none" / a picture). */
export function askTruth(shape, visual, onScreen) {
  const k = onScreen === "engine" ? "engine" : "none";
  const s = String(shape ?? "");
  if (visual === "game") return s.replace(GAME_CLAUSE, ASK_TRUTH.game[k]);
  if (visual === "animation" || visual === "simulation") return s.replace(MOVING_CLAUSE, ASK_TRUTH.moving[k]);
  return s;
}
export const VISUAL_NOT_YET = "nothing is on the screen this turn: show it in words with everyday things they can picture; never a drawing made of characters, never that you cannot draw, never ask them to draw it";


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
/** The child said a stop phrase (state.js decide; OWNER RESET #7): a shape, never a line she could recite. */
// round 2 safety floor (2026-10-07, experience review): the "something else" clause was recited on 7/26 check-ins where the
// child had not asked (change_topic has its own move); and a check-in that asks a lesson question is a hold (NEVER
// MANIPULATE), so the shape says so — brain/say.js enforces it in code (checkInProblems).
// round 3 (conversation; smoke on the round-3 tree): "Theek hai, Zoya. Keep going, short break, ya stop?" offered the choices
// but a judge read no acknowledgement (end_request "acknowledges" failed on J2 6 of 12); the line now says back what they
// asked, in their words, before the choices
export const stopCheck = () => (p5Flag("R3CONV")
  ? "they said they want to stop: first say back in a few warm words, in their words, that they want to stop, no guilt and no pressure; then offer the three choices in your own words and their language (carry on, a short break, or stop for today), they are also on the screen, and wait; no lesson question this turn"
  : "they said they want to stop: acknowledge it warmly in one short line, no guilt and no pressure; offer the three choices in your own words and their language (carry on, a short break, or stop for today), they are also on the screen, and wait; no lesson question this turn");
/** A goodbye right after distress (RELATIONAL-OS I-7): one gentle check before they go; never a hold. */
export const relCheckIn = () => "they are leaving after something hard: one gentle check that they are okay and that a grown-up is near; stopping is fine; a button on the screen lets them stop now";
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

/**
 * Verdict notes, appended to the move by step() (never inside a voice branch): the classifier's verdict on the answer
 * just given, so the words cannot agree with an answer the key did not (G-PRAISE-1; audit #13 "Bilkul" after a wrong
 * answer). The correct case needs none: CONFIRM / retrievalNext already confirm it.
 */
export const VERDICT_NOTE = {
  // round 3 (conversation): "name what is sensible in it" was recited as the word itself ("B chunna sensible tha", "Minecraft
  // ka bada ghar alag baat hai; aapne usse yaad dilaya, sensible": 5 of 599 battery replies, round 2 run C) — the
  // recited-prompt law. Now a shape with no quotable adjective: start from what they did (uptake), then the step.
  get not_yet() {
    return p5Flag("R3CONV") ? "their answer was not right: no agreement or praise word for it; start from what they actually did, in their terms, then the step"
      : "their answer was not right: no agreement or praise word for it; name what is sensible in it, then the step";
  },
  partial: "their answer was partly right: name the right part, no full agreement",
  unverified: "no verdict on their reply: neither praise nor 'wrong'",
};

/** Prefixes that confirm a just-finished answer before the next thing. */
export const CONFIRM = {
  correct: "confirm specifically: name the exact thing they got right, no ability words",
  whyGood: "acknowledge their reason specifically — the method",
  whyMissed: "give the reason yourself in one plain line (their answer was right)",
  teachbackPass: "celebrate the explanation specifically — which idea they made clear",
};

// ── p5-interaction (CONVERSATION-V2 §3.2; the live prod battery 2026-10-05): the child's words acted on, as SHAPES ──
// Notes on what the move does, never lines she could say (the recited-prompt law). `topic` / `method` are the child's
// words reduced to letters and digits (≤ 60 characters), interpolated as data.
const clean = (t, n = 60) => String(t ?? "").replace(/[^\p{L}\p{N} ,'-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, n);
/** A re-explanation of the idea being taught NOW (a teach-phase "story / example / another way / slower"): no new step. */
export const teachAgain = ({ how }) => join(
  how === "story" ? "they asked for it as a story: the SAME idea told in story form — a named character, a moment (one day…), what happened — a few lines"
    : how === "example" ? "they asked for an example: one concrete everyday example of the SAME idea, your own numbers, plainly marked as an example"
      : how === "slower" ? "they asked you to slow down: say in two or three words that you will go slower; then the SAME idea in short simple sentences, one small step"
        : how === "deeper" ? "they asked to go deeper: the SAME idea one layer further, the why behind it or where it shows up in real life or how it links to what comes next; correct and simple, never a new skill, never your earlier words"
        : "they did not follow it: the SAME idea a new, simpler way in (a picture in words, real objects, or a different example), never your earlier words",
  "the idea in LESSON NOW is still the one on the table; no new step of the lesson yet",
  "end with one small question about it",
);
export const clarifyQuestion = () => join(
  "they asked what the question means: say what it asks in simpler words, and what a hard word in it means",
  "one tiny example of the word if it helps, never of the answer; the key stays unsaid",
  "then the same question again",
);
export const breakYes = () => "they asked for a short break: agree warmly; the lesson waits right here for them; one line for when they are back; no question now";
export const repeatShort = () => "they did not catch it: the last point again, shorter and slower; nothing new";
export const welcomeBack = () => "they are back after a moment away: welcome them back in two or three words, no goodbye and no fuss; carry on";
export const levelHarder = () => "they asked for a harder one: take them at their word, a short warm line; the harder question";
export const levelDeeper = () => "they asked to go deeper: take them at their word in a few warm words; the harder question on the same idea, a step further";
export const levelEasier = () => "they asked for an easier one: a short warm line, no fuss; the easier question";
export const boredOffer = () => join(
  // round 3: say back what they said (it is boring) before the change: "acknowledges" failed on J2 for "game, picture or challenge?"
  p5Flag("R3CONV") ? "they are bored: first say back in a few words, in their words, that this part is boring for them, no guilt; then change something NOW" : "they are bored: no guilt; change something NOW",
  "offer a different way into today's idea: a game, a picture or a quick challenge, shown on screen as choices; ask which",
  "no lesson question this turn",
);
export const frustrationStep = () => "it is the work that is hard, never them (one line, no ability words); then a smaller first step on the same question";
export const inviteQuestion = () => "they want to ask you something: a warm go-ahead of two to four words so they ask it; no verdict, no question of your own, never ask them to write it";
export const holdCheckin = () => "they asked you to wait and then went quiet for a while: one warm check-in of a few words — they can take their time, or you can carry on; no verdict, no answer, no new question about the work";
// round 3 fix (adversarial B2): a voice / typed command the play piece on screen acted on ("1/3", "teen se todo", "ho gaya")
export const playActWait = () => "they just made a move in the game on screen by voice: the game itself answers it; at most a few words that keep them playing; no verdict, no hint, no question about anything else";
export const waitThinking = () => "they are thinking aloud: no verdict and no answer; a two-to-four word go-on so they finish the thought; never a new question or the question again";
export const disclose = () => "they asked what you are: plainly an AI teacher, in one line (no body, home, food or family); then back to the work";
export const uptake = ({ kind }) => (kind === "joke" ? "they joked: one playful line back of your own, not a stock laugh; then back to the work"
  : kind === "personal_share" ? "they shared something from their life: name what they shared in their words and react to it warmly and specifically in one line, no question about it; then back to the work"
    : "a friendly question about you: one honest line as an AI (no body, home, food or favourite things of your own); then back to the work");
// round 3 (conversation): the battery's out_of_bounds "reengages" failed on 8 of 12 (round 2 run C): the decline came, the
// hook did not, and a "why not" line read as a lecture ("kisi ko hurt karna theek nahi"). Chirpy Cardinal (Alexa Prize,
// Chi et al. 2020) measured the re-offence rate per strategy: avoid + the child's name + a prompt into something new 0.346,
// empathetic 0.461, a counter-argument 0.567, asking why 0.638. So: no reason given, their name, and the hook carries it.
export const declineOob = () => (p5Flag("R3CONV") ? join(
  "that is not something for our lesson: a warm, short no in a few words, with their name — no reason why, no shame, no lecture, no promise of it later, never any part of it",
  "then a hook into today's work: one surprising true fact about today's idea, or a few words that make the question a small challenge for them (a statement, not a question)",
) : join(
  "that is not something for our lesson: a clear, warm, short no — no shame, no lecture, no promise of it later, never any part of it",
  "then one genuinely interesting hook from today's idea (a surprising fact or a quick challenge) that pulls them back, and the work",
));
// round 3 (conversation): "kindly name that it is a different thing from today's work" came back as the same sentence in
// every park ("Yeh aaj ke maths se alag baat hai", local battery base-head-1, 4 of 4 parks): the recited-prompt law. The
// park itself (the promise) says it is for later; the clause is gone.
export const parkIt = ({ topic, promise }) => join(
  p5Flag("R3CONV") ? `they brought up ${clean(topic) || "something else"}: notice it warmly and specifically, in their words`
    : `they brought up ${clean(topic) || "something else"}: notice it warmly in their words, and kindly name that it is a different thing from today's work`,
  promise === "after_question" ? "promise to come back to it right after this question" : "promise to come back to it at the end",
  "no answer to it now; then back to the work",
);
export const detourTo = ({ topic }) => `they asked again about ${clean(topic) || "it"}: engage for real in at most two sentences, then back to the work`;
export const returnParked = ({ topic, share = false }) => (share
  // round 3: a share from their life kept for later (uptakeShare) comes back as what they TOLD you, not a question to answer
  ? `before the next thing: come back to what they told you earlier (${clean(topic) || "it"}) in one warm line, no question about it`
  : `before the next thing: come back to what they asked earlier (${clean(topic) || "their question"}) — at most two sentences, or a guided question`);
/** Round 3: a share from their life ("mere paas naya cycle aaya hai") noticed now AND kept: the promise is a real later slot
 *  (s.later, served when the question resolves or before the wrap), so it is never a promise she does not keep. */
export const uptakeShare = ({ topic, promise }) => join(
  `they shared something from their life (${clean(topic) || "it"}): react to it warmly and specifically in one line, in their words, never naming a feeling of theirs`,
  promise === "after_question" ? "say you will come back to it right after this question" : "say you will come back to it before the lesson ends",
  "no question about it now; then back to the work",
);
export const answerTheirQuestion = () => "they asked a real question about today's idea: answer it in at most two sentences, correctly and simply, without giving the key; then the question";
export const adaptTo = ({ method }) => `they said how they want it${clean(method, 80) ? ` (${clean(method, 80)})` : ""}: do it that way from now on, or say kindly why not and do the nearest thing`;
export const adultVoice = () => "a grown-up is speaking: greet them briefly and respectfully; say what you will do about what they asked (go over it again, go slower, more practice, keep it short) and do it now; then hand back to the child by name";
/** Round 2: a garbled / broken-off turn (an ASR fragment, a false start). Never a verdict; the line was unclear, not them. */
export const unclearAgain = () => "you did not catch all of what they said: no verdict and no blame (the line was unclear, never them); ask them in a few warm words to say it again or finish the thought";
/** "Can we talk about something else" (owner rule 2026-10-05: steering, never a break or a wrap). */
export const offerWays = () => join(
  "they want something else: agree warmly, in your own words",
  "offer a different way into today's idea: a picture, a story or a game, shown on screen as choices, or a quick change of question; ask which",
  "no lesson question this turn",
);
/** round 3 fix (experience B8): "yeh nahi padhna, X padhna hai": a real topic of their class, offered (never a stop question). */
export const switchOffer = ({ title }) => join(
  `they want to study ${clean(title) || "another topic"} instead: say yes warmly, in your own words; it is a real topic of their class`,
  "they can start it now with the button on the screen, or carry on with today's work if they like; no guilt either way, no lesson question this turn",
);
/** The subject they named is not a topic of their class (or not found): honest, and the choices. */
export const switchElsewhere = ({ subject }) => join(
  `they want to study ${clean(subject) || "something else"} instead: say kindly that it is not in their class's lessons here, in a few words`,
  "offer to carry on with today's work in a new way, or to stop for today; no guilt, no lesson question this turn",
);
/** They chose to start the other topic: a warm close of this lesson, the next one starts at once. */
export const switchGo = ({ title }) => `they chose to start ${clean(title) || "the other topic"} now: one short warm line that you are starting it; no question, no hook`;
/** The card cap: the question has been on the table long enough. */
export const assertAndMove = () => "that question has been on the table long enough: give its answer plainly with one line of why (in LESSON NOW), no verdict on them; then the next question";
export const leaveForLater = () => "that question has been on the table long enough: leave it for later, no verdict and no answer; then the next question";
export const moduleUnverified = () => "they answered on the activity but that answer could not be read: no verdict; ask them to say or type their answer";
/** Modifiers on a graded answer (the UNDERSTAND note's alongside readings). */
export const MOD_NOTE = {
  hedged: "they sounded unsure: one light word that checking was a good idea",
  check: "they asked whether it is right: say plainly whether it is",
  insist: "they hold to their answer: take it seriously and give them a way to test it (substitute, count, a counter-example); never a flat no again",
};
/** Round 3: the second need of a two-needs turn (conversation/lexicon.js alsoReading), honoured in the same turn's words. */
export const ALSO_NOTE = {
  frustration: "they also find it hard or are tired: one short line of empathy about the work first (never about them)",
  boredom: "they also said it is boring: acknowledge it in a few words, no guilt",
  easier: "they also asked for it easier: make the step smaller and simpler",
  slower: "they also asked you to go slower: short simple sentences, one small step",
  // round 4 (battery arm 2, multi_intent-01 "samajh nahi aaya, Hindi mein batao"): as a last-section note, "say it more
  // simply" was read as an announcement ("ab main tumhe Hindi mein samjhaunga") and the question came back unexplained
  simpler: "they also did not follow: before the question, one or two short lines on what it asks, in simpler words; never only a promise to explain",
};
/**
 * Round 4 (conversation): what a request's move MUST do this turn, as a short note the compile places in the LAST section
 * (compile.js lastParts, before the check): in the MOVE section the shape lost to the last section's "the same question
 * again" (battery 2026-10-10: frustration 2/8 repeated the question with no smaller step; skip_ahead 1/7 explained again;
 * slower 2/6 promised to slow down and re-asked; a share 1/5 got no warm reaction; "haan" opened a wait on a mid-thought and
 * read as a verdict). Notes, never lines; keyed by the move's request type (or the uptake's kind).
 */
export const MUST_NOTE = Object.freeze({
  frustration: "first one short line that this is hard work and that is okay (about the work, never them); then the smaller step from the move, said plainly, before any question",
  know: "no explanation at all, not one line of teaching: straight to the one quick check",
  harder: "no explanation: straight to the harder question",
  deeper: "the next layer of the same idea first, in a few short lines; then one small question",
  slower: "first the idea again in two or three very short pieces, one per sentence; only then the question",
  thinking: "only a short go-on of two to four words: no yes or agreement word (haan, yes, sahi, right), no hint, no question",
  personal_share: "your first words react warmly to what they shared, named in their words; add nothing they did not say",
  adapt: "first, in a few words, take what they said about your teaching on board (a thank-you for praise, or the change you make now); then do it",
  adopt: "first, in a few words, take what they said about your teaching on board (a thank-you for praise, or the change you make now); then do it",
  adult: "first greet the grown-up as a grown-up in a few words and say what you will do; then hand back to the child by name",
  boredom: "first acknowledge it is getting boring in a few words, no guilt; then the change",
  // round 4 round B (battery 2026-10-10: "no game is ready for this yet", "video nahi" broke zero visible failure: a build
  // that is not there is never mentioned; game_request 4/8, animation 2/5)
  visual_game: "start a game now, in one line: if one is on the screen, how to play it; if not, a quick spoken game on this idea (one rule, then their first turn); never say a game is not ready or not available",
  visual_animation: "never say there is no video or animation: if something on the screen moves, point at what moves; if not, show the movement in words, step by step, as it happens",
  // merged-tree owner-5 (whiteboard): "Whiteboard par 120 tickets ... samajhiye" named the board but never sent the eyes to it
  visual_diagram: "never say there is no picture, never draw with characters; if the screen has it, first send their eyes there (dekho / look) and say what to see; if not, paint it in words",
  // the hook after a no (out_of_bounds reengages 8/12: the decline came, the hook was the bare question again)
  // battery arm 3 (pooled, out_of_bounds 11 -> 7 of 23): "after the short no" read as curt ("lesson ke baad bhi nahi", "woh
  // baat hum yahan nahi karenge"; the judges' declines_warm). The no stays kind; the hook leads into the question
  decline: "a kind, warm no in a few words, never curt; then one genuinely interesting thing from today's idea (a surprising fact, a real-life puzzle) leading into the question; never only the question",
  // a clarify that gave the answer away (clarify-09)
  clarify: "say what the question asks in simpler words; never the answer, the reason or the key words of the answer",
  answer_q: "answer their question first, in at most two sentences, correctly and simply; only then carry on",
  // owner-2 R7.defer (10/12 on the round-3 tree): a side question answered honestly, then "chalo wapas aate hain" / "let's get
  // back" read as deferring it; after the answer the work simply goes on
  small_talk: "answer their question honestly in one line as an AI; then straight into the work, with no words about going back or later",
  identity: "plainly an AI teacher, in one line; then straight into the work, with no words about going back or later",
  joke: "one playful line back of your own; then straight into the work, with no words about going back or later",
  // owner-4 (local acceptance on 9e371d34, 2026-10-10): "example do" on the fast lane got only the card question; the lead
  // note alone did not carry it
  // merged-tree owner-4: an unlabelled example ("ghar mein do same cups mein seeds rakhiye ...") did not read as one
  example: "first one concrete example from their life (home, school, cricket, food), named as an example (for example / jaise), in a line or two; only then the question",
  story: "first a tiny story of two or three sentences with a child in it, about this idea; only then the question",
  another: "a different example or question from the last one, never the same one again",
});
/** Round 4 (battery arm 3, family D: diversion-13 "mere paas naya cycle aaya hai", personal_share-01 "aaj mera birthday hai"):
 *  as a last-section note, "add nothing they did not say" won over the share shape's promise, and a share KEPT for later got
 *  no "we'll come back to it" (the judges' parks / acknowledges). When the share was kept this turn, the note carries it. */
export const mustShareKept = ({ promise }) => `your first words react warmly to what they shared, in their words; then a few words that you will come back to it ${promise === "after_question" ? "right after this question" : "before the lesson ends"}`;
/** Round 4 (owner-2 judge, top cause of J.confused, production and local 2026-10-10): after a teaching question the child only
 *  acknowledged ("haan", "ok", "hmm"), the next step opened a NEW example as if nothing had been asked. The note closes the
 *  asked question first. `asked` is the teacher's own last question (never the child's words). */
export const ackClose = ({ asked }) => `they only said okay to your question "${clean(asked).slice(0, 90)}": first answer it yourself in one short line, then link it to this step in a few words (the same example, or say plainly it is a new one)`;
/** ... and the card question re-asked after a bare okay read as "repeats the previous question without new guidance". */
export const ACK_CARD = "they only said okay, not an answer: first one new concrete handle (what to look at, or the first step), in words you have not used yet; then the question";
export const parkAlso = ({ topic }) => `they also asked about ${clean(topic) || "something else"}: one line that you will come back to it after this`;
/** Round 3: the turn after a stop check-in that was not a stop ("haan", an answer): the lesson simply goes on. Local
 *  battery base-head-1: "yes" after the check-in got "Lesson ended, Meher. You may close the book now. <a question>". */
export const afterCheckin = () => "after the check-in they did not ask to stop: carry on as normal, warmly; no talk of resting, breaks or ending";

// ── p5-interaction, second pass (conversation-v2 battery on a local server, 2026-10-05: the judges failed requests whose shape
// came FIRST and the pose after it — the model posed the question and dropped the request). The request is the first part of
// a two-part shape and named as such; the question follows as written. Position is mechanism. ──
/** A request answered before the question on the card: (1) the request's own note, (2) the question as written. */
export const leadThenPose = ({ item, lead }) => join(
  `two parts — first: ${lead}`,
  "second: the question on the card, as written, in their language; then wait",
  item?.diagnostic ? "read its choices plainly; no lean in your voice toward any of them" : null,
);
/** "Slowly please" with a question on the table: the same question, slower — in short pieces first, then as written. */
export const slowerPose = () => join(
  "they asked you to slow down: say in two or three words that you will go slower",
  "then the question again in short simple pieces, one idea at a time, before asking it as written; never ask them to speak slowly",
);
/** "Example do" / "story ki tarah" / "another way" on a question on the table (p5 wording of helpExplain). */
export const helpExplainP5 = ({ how, example = false, story = false }) => join(
  how ? "they asked how to do it: show the first step only, with a smaller example of your own (different numbers)"
    : example ? "they asked for an example: start by saying it is an example, then one concrete everyday case of the same idea with DIFFERENT numbers from the question, so it never states its answer"
      : story ? "they asked for a story: tell it in story form — a named character, a moment (one day…), what happened — with DIFFERENT numbers from the question, so it never states its answer"
        : "they asked for it another way: one new, simpler picture of the same idea, with a different example and different numbers",
  "the key stays unsaid",
  "then the same question again, as written",
);
/** "Hindi mein batao" with a question on the table (p5 wording): simpler first, in the new language, then the question. */
export const languageAskedP5 = ({ lang }) => join(
  `they asked for ${LANG_NAME[lang] ?? lang}: from now on every turn in ${LANG_NAME[lang] ?? lang}, even if they reply in another language`,
  "first say what the question asks, simply, in it; then the question in it",
);
/** Frustration on a question: the empathy line FIRST (about the work), then the smaller step. */
// round 3 (conversation): "one short line that this one is hard work and that is okay" was said back word for word ("is
// question mein hard work hai, aur yeh okay hai", base-head-1): the recited-prompt law. A shape: what the line does.
/** Round 3: frustration with no question on the table (teaching): the empathy line first, then the SAME idea smaller. */
export const frustrationTeach = () => "first, in your own words, a short line of empathy about how tough this part is and that getting stuck on it is normal (about the work, never about them, no ability words); then the same idea again in a smaller, simpler step";
export const frustrationFirst = () => (p5Flag("R3CONV")
  ? "first, in your own words, a short line of empathy about how tough THIS question is and that getting stuck on it is normal (about the work, never about them, no ability words); then a smaller first step on the same question"
  : "first: one short line that this one is hard work and that is okay (about the work, never about them, no ability words); then a smaller first step on the same question");
