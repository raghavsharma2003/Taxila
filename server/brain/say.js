// The turn's WORD and GUARD stages (TEACHER-BRAIN §5.1 stages 5-6): the teacher's reply written from the ONE compiled
// instructions string (one compile() for every lane) and guarded on the bytes by code: answer leaks, drift, floor
// breaks, praise/verdict agreement, the screen, register, script, length and the turn's shape. Moved out of
// server/routes/lesson.js unchanged by W2-E BR1 (BUILD-PLAN W2-E #2); the lesson start and the turn both call it.
import { safetyOpeningFor, safetyModeOf } from "../relational/openings.js";
import { chat, DEPLOY, isContentFilter } from "../azure.js";
import { floorViolations, scrubPii } from "../director/safety.js";
import { upcomingItem, hintShapeWords } from "../director/state.js";
import { findItem, promptFor, revealsAnswer, posesItem, handsBack, asksWhy, stripRungLabel } from "../director/items.js";
import { TURN_WORDS, FLOOR_FIX } from "../compiler/compile.js";
import { HELPLINES } from "../compiler/floor.js";
import { registerBroken, toAap } from "../director/register.js";
import { praiseProblem, stripPraise, screenProblem, stripScreenRefs, leaksStage, stripStage, saysCantShow, stripCantShow, askParity, endOnAsk, joinAsk, lastQuestionOnly, wrapsUp, stripWrap, correctsRight, stripCorrection } from "../director/say.js";
import { mixedUnitComparison, withoutMixedUnits } from "../director/units.js";
import { screenContradiction, stripStrayParts } from "../director/modules.js";
import { isBare, repeatsEarlier, tidy, leadWithoutQuestion, sentences } from "../conversation/guards.js";
import { p5Flag } from "../conversation/flags.js";
import { leadSlotWanted, leadSlotNote, cleanLead, leadOk, composeTurn, LEAD_MAX_WORDS } from "../conversation/compose.js";
import { fallbackLead } from "../conversation/fallback-lead.js";

/** p5-interaction: problems a gutted teaching turn's one retry may still carry, because code repairs them (never truth). */
const SOFT_FIX = new Set(["long", "twoq", "wrap", "script", "register", "stage", "cantshow"]);
/** Text-mode hard ceiling for the reply guard (the compiled rule asks for TURN_WORDS). */
export const REPLY_MAX_WORDS = { "6-9": 30, "10-15": 40 };

export const words = (t) => String(t || "").trim().split(/\s+/).filter(Boolean).length;

/**
 * The call-site recipe for floorViolations (context/inbox/merged/harvest-ports.json; decision never-rules-floor-violations
 * revised): the posed item's verified content — its prompt in each language, the answer, the acceptable answers, the
 * hints and the diagnostic options — is passed as `content`, which safety.js removes only as whole long segments that
 * carry a hit of their own (0/26,576 posed kit questions flagged with it). Exported for the eval.
 */
export function floorContentOf(item) {
  if (!item) return [];
  const s = (x) => (typeof x === "string" && x.trim() ? [x] : []);
  return [...s(item.prompt_en), ...s(item.prompt_hi), ...s(item.answer), ...(item.acceptable ?? []).flatMap(s), ...(item.hints ?? []).flatMap(s),
    ...(item.options ?? []).flatMap((o) => s(o?.text))];
}

/** A child's words on their way to a model: direct identifiers masked (scrubPii; decision scrub-pii-cued). */
export const scrubbed = (t) => scrubPii(t).text;

/** The reply model call, injectable for tests of the guards (tests/lesson-truth.test.mjs); production uses azure.js. */
export const replyDeps = { chat };

/** Keep whole sentences up to `max` words (last-resort guard after one rewrite failed). */
export function trimToWords(text, max) {
  const parts = p5Flag("GUARDS") ? sentences(text) : String(text).match(/[^.!?।]+[.!?।]*\s*/g) ?? [text];
  let out = "";
  for (const s of parts.length ? parts : [text]) {
    if (words(out + s) > max) break;
    out += s;
  }
  return (out || String(text).split(/\s+/).slice(0, max).join(" ") + "…").trim();
}

/** Moves whose turn must put the active item's question to the child (at rung 0, before any nudge). */
export const POSING_MOVES = new Set(["practice", "probe", "retrieval", "greet"]);
/** Moves that end the exchange or hold it; every other turn must hand the floor back. */
export const CLOSING_MOVES = new Set(["wrap", "safeguard"]);
/**
 * Teaching turns with no item on the table: what they say must not answer the question that comes next
 * (measured in evals/director-sim.mjs: an explain turn said "use one-fourth kehte hain", and the next item,
 * "Ek tukde ko kya kehte hain?", was scored as an unaided correct answer).
 */
export const TEACHING_MOVES = new Set(["hook", "explain", "worked_example", "reteach"]);
/**
 * Scripts a written reply may use: Roman for Hinglish/English (the compiled rule asks for it), Roman or
 * Devanagari for Hindi. Measured in evals/director-sim.mjs: a stray Gujarati word and Devanagari fragments
 * inside Roman Hinglish both reached the child before this check.
 */
// F18 (evals/owner-truth s09 t17): `\p{M}` accepted ANY script's combining marks, so Gujarati vowel signs (U+0A82,
// U+0AC7) passed as "Latin". Script=Inherited is the shared combining set (accents on Latin); a script's own marks belong
// to that script (Devanagari's to Devanagari, allowed only for Hindi).
const LATIN = /^[\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]*$/u;
const SCRIPT_OK = { hinglish: LATIN, english: LATIN, hindi: /^[\p{Script=Latin}\p{Script=Devanagari}\p{Script=Common}\p{Script=Inherited}]*$/u };
const OFF_SCRIPT = { hinglish: /[^\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/gu, english: /[^\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/gu,
  hindi: /[^\p{Script=Latin}\p{Script=Devanagari}\p{Script=Common}\p{Script=Inherited}]/gu };
/** Is a written reply in the scripts its language allows? Exported for tests. */
export const scriptOk = (t, lang) => (SCRIPT_OK[lang] ?? LATIN).test(String(t ?? ""));

/**
 * What the child reads when no reply could be written (the model failed twice): content where there is
 * some — the question on the table — else a fixed line for the move. Never a throw after the turn's
 * evidence is decided: the lesson goes on. The safeguard line carries the helpline (the floor's contract).
 */
/** Both crisis lines, from the one source (compiler/floor.js HELPLINES; the floor and V2 §16 name them together). */
const HELPLINE_LINE = HELPLINES.map((h) => `${h.name} ${h.number}`).join(" or ");
const HELPLINE_LINE_HI = HELPLINES.map((h) => `${h.name} ${h.number}`).join(" ya ");
export const FALLBACK = {
  english: { wrap: "That's all for today. See you next time!", safeguard: `What you said matters. Please tell a grown-up you trust, or call ${HELPLINE_LINE}. Are you okay right now?`,
    safeguardCheck: `Are you okay right now? If anything is worrying you, tell a grown-up you trust, or call ${HELPLINE_LINE}.`,
    other: "Sorry, I lost my words for a second. Can you say that again?",
    checkinStop: "That's okay. We can keep going, take a short break, or stop for today. You choose.",
    checkinRel: "That's okay, stopping is completely fine. Are you okay right now, and is a grown-up nearby?" },
  hinglish: { wrap: "Aaj ke liye itna hi. Phir milte hain!", safeguard: `Tumne jo bataya, woh zaroori hai. Kisi bade ko batao jis par bharosa ho, ya ${HELPLINE_LINE_HI} pe call karo. Kya tum abhi theek ho?`,
    safeguardCheck: `Kya tum abhi theek ho? Agar koi baat pareshan kar rahi hai, toh kisi bade ko batao jis par bharosa ho, ya ${HELPLINE_LINE_HI} pe call karo.`,
    other: "Ek second, meri baat atak gayi. Kya tum phir se bata sakte ho?",
    checkinStop: "Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.",
    checkinRel: "Theek hai, rukna bilkul theek hai. Kya tum abhi theek ho, aur koi bada paas hai?" },
};
// round 2 safety floor (adversarial B2, 2026-10-07): a stop check-in is an OFFER to stop, never a teaching turn. Before
// this it was guarded as one: her honest "aaj ke liye yahin rok dete hain" tripped the goodbye check ("wrap"), the rewrite
// note said "the lesson goes on … end with one question about the same thing", stripWrap cut the stop option, and the child
// who said "bas, aaj ke liye itna hi" heard "ab isi jagah se continue karte hain — 1 kg mein kitne grams…?" (w2flow-walk
// pass 2; reproduced without a model). A check-in now must name the stop option and must not ask a lesson question or
// hold them for "one more"; what cannot be rewritten clean is the fixed check-in line below, never the lesson's question.
/** The child's options include stopping (Roman Hinglish / English / Devanagari). */
const STOP_OFFER = /(?<![\p{L}])(?:rok|rukna|ruk|ruke|rukte|rukenge|stop|stopping|bas|band|khatam|khatm|chhutti|for today|aaj ke liye|end (?:here|now|for today))|रोक|रुक|बस|बंद|ख़?त्म|आज के लिए/iu;
/** "One more / a last / first a small check" — holding a child who asked to stop (NEVER MANIPULATE). */
const HOLD_WORDS = /(?<![\p{L}])(?:(?:pehle|first|before (?:you go|we stop|stopping))\b[^.?!।]{0,30}\b(?:check|question|sawal|sawaal|sum|try)|(?:last|aakhri|akhri|one more|ek aur|bas ek)\s+(?:chhota\s+sa\s+|small\s+|quick\s+|little\s+)?(?:check|question|sawal|sawaal|sum|try|problem))/iu;
/** A check-in's words: what is wrong with them (none: an honest offer of the three choices). Exported for tests. */
export function checkInProblems(t, { kind = "stop", active = null, lang = "hinglish" } = {}) {
  const text = String(t ?? "");
  const out = [];
  const asksLesson = (active && (text.includes(promptFor(active, lang)) || posesItem(text, active, lang)))
    || (String(text).match(/[^.!?।]*[?？]/g) ?? []).some((q) => /\d/.test(q)) || HOLD_WORDS.test(text);
  if (asksLesson) out.push("hold");
  if (!STOP_OFFER.test(text)) out.push("nostop");
  return out;
}
/**
 * The fixed safeguarding line (both helplines) in the child's language mode and address form: W2-I's vetted opening
 * (server/relational/openings.js, identical to the client's src/lesson/safetyStrings.ts) and then one check-in question.
 */
const CHECK_Q = { en: "Are you safe right now?", hinglish: { tum: "Kya tum abhi safe ho?", aap: "Kya aap abhi safe hain?" }, hi: { tum: "क्या तुम अभी सुरक्षित हो?", aap: "क्या आप अभी सुरक्षित हैं?" } };
/**
 * F10 (evals/owner-truth patch 05, reconciled with W2-I's openings): a fallback safeguard line whose trigger was ONLY the
 * classifier model or the content filter ("I'm done" read as distress) gets the neutral check-in wording, never "what you
 * said matters". Every other trigger (the predicate's families, the relational floor, an unknown/legacy state) keeps the
 * vetted disclosure opening. W2-I's CHECK opening (openings.js) names Childline only, and a fallback line must name both
 * helplines (tests/lesson-truth "safeguard fallback names ... Tele-MANAS 14416"), so the check form is patch 05's
 * two-helpline line; Devanagari has no vetted two-helpline check line yet, so it keeps the disclosure opening.
 * Wording only: the predicate, the hold and the helplines are unchanged.
 */
const CHECK_ONLY_KINDS = new Set(["model", "content_filter"]);
export function safeguardLine(ctx = {}, { kind = null } = {}) {
  const mode = safetyModeOf(ctx.lang);
  if (CHECK_ONLY_KINDS.has(kind) && mode !== "hi") {
    const line = FALLBACK[mode === "en" ? "english" : "hinglish"].safeguardCheck;
    return ctx.address === "aap" && mode !== "en" ? toAap(line) : line;
  }
  const open = safetyOpeningFor(ctx.lang, { address: ctx.address });
  const q = open.mode === "en" ? CHECK_Q.en : CHECK_Q[open.mode][ctx.address === "aap" ? "aap" : "tum"];
  return `${open.text} ${q}`;
}
export function fallbackReply(state, item) {
  if (state.lastMove?.kind === "safeguard") return safeguardLine(state.ctx, { kind: state.safeguard?.kind ?? null });
  const lang = state.ctx.lang;
  const kind = state.lastMove?.kind;
  // round 2 safety floor: a check-in the model could not write is the fixed offer of the choices (stop named), never
  // "say that again" (that asks a child who said stop to say it twice)
  if (state.lastMove?.checkin) {
    const line = FALLBACK[lang === "english" ? "english" : "hinglish"][state.lastMove.checkin === "rel" ? "checkinRel" : "checkinStop"];
    return state.ctx.address === "aap" && lang !== "english" ? toAap(line) : line;
  }
  if (item && !CLOSING_MOVES.has(kind)) {
    const q = promptFor(item, lang);
    // round 2 (conversation): a model outage (429 / timeout / every repair failed) on a turn that answers a request or puts
    // the question again is no longer a bare re-ask: a fixed code lead for what the move is doing, then the question
    // (conversation/fallback-lead.js; owner-2 prod R3 x4 + R2). Same kill switch as the lead slot.
    if (!p5Flag("LEADSLOT")) return q;
    const lead = fallbackLead({ request: state.lastMove?.request ?? null, hint: hintStatements(item, state.lastMove?.hintLevel),
      rePose: state.pinItem === item.id && (state.pinRun ?? 0) > 1, lang });
    if (!lead) return q;
    return composeTurn(state.ctx.address === "aap" && lang !== "english" ? toAap(lead) : lead, q);
  }
  const lines = FALLBACK[lang === "english" ? "english" : "hinglish"];
  const line = lines[kind] ?? lines.other;
  // The fixed lines are written in tum forms; an "aap" child hears them in aap forms (G-REG-1).
  return state.ctx.address === "aap" && lang !== "english" ? toAap(line) : line;
}

/**
 * The draft up to (not including) its first question, then the item's own question; a lead sentence that repeats part of
 * the question is dropped (F20) and, with `noLeak`, so is one that states the item's key (F17: a leak that survived the
 * rewrite used to replace the WHOLE turn with the bare question — 38/394 replies in the owner's session). Exported for tests.
 */
export function repairDrift(draft, item, lang, { noLeak = false } = {}) {
  const parts = p5Flag("GUARDS") ? sentences(draft) : String(draft).match(/[^.!?।]+[.!?।]*\s*/g) ?? [];
  const lead = [];
  for (const x of parts) {
    if (/[?？]/.test(x)) break;
    if (noLeak && revealsAnswer(x, item)) continue;
    lead.push(x);
  }
  return joinAsk(lead.join("").replace(/^[\s”"'’)\]]+/, "").trim(), promptFor(item, lang));
}

/** Sentences of `text` that do not state `item`'s key (what is left of a teaching turn after a leak survived). */
export const withoutLeaks = (text, item) => (p5Flag("GUARDS") ? sentences(text) : String(text).match(/[^.!?।]+[.!?।]*\s*/g) ?? []).filter((x) => !revealsAnswer(x, item)).join("").trim();
/**
 * Is what is left of a gutted teaching turn still a turn? F18 (evals/owner-truth s06 t2): every sentence of an explanation
 * "revealed" the next item, and the remainder was "” Aapka question?". A remainder must open on a word, carry some
 * content, and hand the floor back. Exported for tests.
 */
// p5-interaction (owner-2 s2 t11, R6.gutted: "What unit fraction represents one pot?" shipped as a whole explain turn): a
// remainder must also be a turn's worth of words (GUTTED_MIN, the battery's own bar); else the rewrite stands and the next
// item is marked spoiled.
export const GUTTED_MIN = 9;
export const coherentRemainder = (t) => !!t && !/^[\s”"'’)\]]/.test(t) && words(t) >= (p5Flag("GUARDS") ? GUTTED_MIN : 6) && handsBack(t);
/**
 * An upcoming item whose key is a STATEMENT of the idea being taught (a why / teach-back item, or a key of 6+ words such
 * as "Any question that can be checked by trying something") cannot be kept out of the explanation that teaches it: the
 * ahead-leak check would gut the turn (F18). Its answer is still discounted if said (brain/turn.js spoiledBy → spoiled →
 * hintsUsed 4), so evidence stays honest. Exported for tests.
 */
export const statementKey = (item) => !!item && (["why", "teachback"].includes(item.kind) || words(item.answer) >= 6);

/**
 * Text-mode teacher reply from the SAME compiled instructions, guarded on the bytes: an answer leak before
 * rung 4 (on the active item, or — on a teaching turn — on the item that comes next), a posing turn that
 * does not pose the item (drift), or an over-long turn gets one rewrite; a leak or drift that survives is
 * replaced by the question itself (content), or the leaking sentences are dropped, never shipped. A model
 * failure falls back (fallbackReply) instead of throwing.
 */
export async function textReply({ instructions, state, kit, childText, trace, history = state.recent.slice(0, -1), verdict = state.lastVerdict ?? "ungraded", ui = null, module = null }) {
  const item = state.lastMove?.itemId ? findItem(state, kit, state.lastMove.itemId) : null;
  const next = !item && TEACHING_MOVES.has(state.lastMove?.kind) ? upcomingItem(state, kit) : null;
  const ahead = next && !statementKey(next) ? next : null;
  const lang = state.ctx.lang;
  // A diagnostic's options are content read aloud, so they do not count against the turn length.
  const max = REPLY_MAX_WORDS[state.ctx.ageBand] + (item?.diagnostic ? words(item.options.map((o) => o.text).join(" ")) : 0);
  const guardable = item && state.hintLevel < 4 && state.pendingWhy !== item.id;
  const mustPose = guardable && state.hintLevel === 0 && POSING_MOVES.has(state.lastMove.kind);
  // p5-interaction: a thinking-aloud wait hands back by letting them go on, never by a question (the "thinkq" guard below)
  const thinkingWait = p5Flag("GUARDS") && state.lastMove?.request === "thinking";
  // round 2 safety floor: a check-in hands back by the choices it offers (the chips wait), never by a lesson question
  const checkin = state.lastMove?.checkin ?? null;
  const activeItem = checkin && state.activeItemId ? findItem(state, kit, state.activeItemId) : null;
  const mustHandBack = !CLOSING_MOVES.has(state.lastMove.kind) && !thinkingWait && !checkin;
  const whyProbe = !!item && state.pendingWhy === item.id;
  // A comparison across kinds of quantity (45,000 fans vs 4,500 km) in the teacher's OWN words; the kit's posed
  // question is verified content and is not judged here.
  const own = (t) => (item ? String(t).split(promptFor(item, lang)).join(" ") : String(t));
  const address = state.ctx.address;
  const kindNow = state.lastMove?.kind;
  // The floor's NEVER rules on the teacher's own words (director/safety.js; verified kit content is not judged).
  const floorContent = floorContentOf(item);
  const floorOf = (t) => floorViolations(t, { content: floorContent, requireHelpline: kindNow === "safeguard", goodbye: kindNow === "wrap" });
  // G-ASK parity: a turn with a pinned question (UiDirectives.ask for THIS item) ends on that question and asks no
  // other — a corrective move (hint, re-teach, repair) re-poses the same item, it never moves to a side question.
  // Any other handing-back turn asks one question at most (audit flows G4: "…14 times 14 karke batayiye. 9² kitna hota hai?").
  const pinned = item && ui?.ask?.itemId === item.id ? ui.ask.text : null;
  const parityOf = (t) => askParity(t, pinned);
  // a check-in that SAYS goodbye ("aaj ke liye yahin rok dete hain") while the child has not chosen yet is a mixed signal
  // (owner-3: the lesson goes on after it); it is still caught, but its repair is the check-in's own (below), never
  // stripWrap — which cut the stop option out and left "the lesson goes on" (adversarial B2)
  const wrapping = !CLOSING_MOVES.has(kindNow);
  const praiseOf = (t) => praiseProblem(t, verdict);
  // p5-interaction guards (conversation/guards.js): her earlier lines of this lesson (the repeat guard reads the last six)
  const G = p5Flag("GUARDS");
  const earlier = G ? history.filter((t) => t.who === "teacher").slice(-6).map((t) => t.text) : [];
  // p5-interaction (owner-2 R4: a 40-word question re-read in full on every hint turn): once the question has been posed,
  // a re-pose ends on the card's form of it (UiDirectives.ask.text, ≤ 120 characters: the question sentence itself)
  const rePose = !!item && state.pinItem === item.id && (state.pinRun ?? 0) > 1;
  const askEnd = item ? (G && pinned && rePose ? pinned : promptFor(item, lang)) : null;
  // round 2 (conversation): a lead-slot turn's length is its OWN words (the card question after them is verified content,
  // like a diagnostic's options): within the lead budget it is not "long"
  const slotState = { on: false };
  const slotLength = (t) => slotState.on && !!askEnd && String(t).trim().endsWith(String(askEnd).trim())
    && words(String(t).trim().slice(0, String(t).trim().length - String(askEnd).trim().length)) <= (LEAD_MAX_WORDS[state.ctx.ageBand] ?? 30);
  // G-PRAISE-2: after a right answer the acknowledgement never states a wrong option as the result (say.js correctsRight).
  const right = verdict === "correct" && state.lastRight?.wrong?.length ? { ...state.lastRight, nextPrompt: item ? promptFor(item, lang) : ahead ? promptFor(ahead, lang) : "" } : null;
  const problems = (t) => [
    floorOf(t).length && "floor",
    praiseOf(t) === "praise" && "praise",
    praiseOf(t) === "contradicts" && "deny",
    right && correctsRight(t, right) && "corrects",
    screenProblem(t, ui, module) && "screen",
    // W2-B #1: the line names parts the mounted module does not show (she said quarters over fifths). Her OWN words only:
    // the kit's posed question is verified content (W2-E: the replay showed the predicate flagging a verified question
    // that names halves/quarters/eighths beside a 1/2-only predict screen, which cost a rewrite and her lead-in).
    screenContradiction(own(t), module) && "parts",
    registerBroken(t, address) && "register",
    leaksStage(t) && "stage",
    saysCantShow(t) && "cantshow",
    (guardable && revealsAnswer(t, item) || ahead && revealsAnswer(t, ahead)) && "leak",
    mixedUnitComparison(own(t)) && "units",
    mustPose && !posesItem(t, item, lang) && "drift",
    whyProbe && !asksWhy(t) && "nowhy",
    mustHandBack && !handsBack(t) && "flat",
    !scriptOk(t, lang) && "script",
    words(t) > max && !slotLength(t) && "long",
    pinned && !parityOf(t).endsOnAsk && "ask",
    mustHandBack && parityOf(t).questions > 1 && "twoq",
    wrapping && wrapsUp(t) && "wrap",
    // p5-interaction: the reply is only the question again (owner-2 R3, 9 / 90), or a line she already said (R4, 8 / 90)
    G && pinned && isBare(t, promptFor(item, lang), pinned, rePose ? undefined : 1) && "bare",
    G && repeatsEarlier(t, earlier) && "same",
    // a mid-thought gets no question (conversation-v2 thinking_aloud 1/8: "new_question"); a right answer is confirmed
    // before anything else (answer_correct 4/8: a covert probe with no uptake)
    thinkingWait && /[?？]/.test(t) && "thinkq",
    G && verdict === "correct" && !CLOSING_MOVES.has(kindNow) && !checkin && !confirmsFirst(t) && "noconfirm",
    ...(checkin ? checkInProblems(t, { kind: checkin, active: activeItem, lang }) : []),
  ].filter(Boolean);
  // The code repairs for the turn's shape (no model call): goodbye sentences out of a non-wrap turn, then the turn
  // ends on the pinned question (or keeps only its last question).
  const shapeFix = (t, f) => {
    let out = f.includes("wrap") ? stripWrap(t) : t;
    if (pinned) out = endOnAsk(out, askEnd);
    else if (f.includes("drift")) out = repairDrift(out, item, lang);
    else if (f.includes("twoq")) out = lastQuestionOnly(out);
    return out;
  };
  const SHAPE = new Set(["drift", "flat", "ask", "twoq", "wrap"]);
  const messages = [
    { role: "system", content: instructions },
    // The turn being answered is the last message (childText); by default it is the newest recent row.
    // Every turn reaches the reply model with direct identifiers masked (scrubPii), history and this turn alike.
    // Teacher turns too: on the voice lane her transcript came from a model that heard the child's audio unmasked,
    // so it can repeat a phone number, school or address back.
    ...history.map((t) => ({ role: t.who === "teacher" ? "assistant" : "user", content: scrubbed(t.text) })),
    { role: "user", content: childText ? scrubbed(childText) : "(the child has joined the lesson and is listening)" },
  ];
  // Replies take ~1-2 s (measured in evals/director-sim.mjs); a stuck call is cut at 6 s and retried once.
  const ask = (msgs) => replyDeps.chat(DEPLOY.reply, msgs, { maxTokens: 220, effort: "none", timeoutMs: 6000, trace }).then((r) => r.text.trim());
  let reply;
  const guardSlot = {};
  // The content filter blocking the reply call (the child's words are in it) is a safety signal, not an
  // outage: the caller fails CLOSED to the safeguarding protocol (turn(): `filtered`).
  const blocked = () => ({ reply: fallbackReply(state, item), filtered: true, guard: { caught: ["content_filter"], rewritten: false, replaced: true } });
  // round 2 (conversation): the LEAD SLOT. A turn that answers a request before the card question, or puts the same
  // question again, is written as two parts: the model writes only what comes before the question, code adds the question
  // byte for byte (conversation/compose.js). A lead that comes back unusable falls through to the one-call path.
  const slot = G && p5Flag("LEADSLOT") && !!item && leadSlotWanted({ request: state.lastMove?.request ?? null, rePose, pinned, diagnostic: !!item?.diagnostic,
    whyProbe, closing: CLOSING_MOVES.has(kindNow) });
  const leadMax = LEAD_MAX_WORDS[state.ctx.ageBand] ?? 30;
  const leadCall = async (why = null, draft = null) => {
    const extra = [...(draft ? [{ role: "assistant", content: draft }] : []), { role: "system", content: leadSlotNote({ lead: state.lastMove?.lead ?? null, why, ageBand: state.ctx.ageBand }) }];
    const raw = await ask([...messages, ...extra]);
    const lead = cleanLead(raw, askEnd, leadMax);
    return leadOk(lead, [item?.answer, ...(item?.acceptable ?? [])]) ? composeTurn(lead, askEnd) : null;
  };
  try {
    reply = slot ? (await leadCall()) : null;
    if (reply) { guardSlot.used = true; slotState.on = true; }
    reply ??= await ask(messages);
  } catch (e) {
    if (isContentFilter(e)) { console.warn("[lesson] reply blocked by the content filter"); return blocked(); }
    console.warn("[lesson] reply unavailable, falling back:", e.message);
    return { reply: fallbackReply(state, item), guard: { caught: ["unavailable"], rewritten: false, replaced: true } };
  }
  let found = problems(reply);
  const guard = { caught: found, rewritten: false, replaced: false, ...(found.length ? { firstDraft: reply } : {}), ...(guardSlot.used ? { leadSlot: true } : {}) };
  // Drift (a posing turn that asked some other question) is repaired without a model call when it is the
  // only problem besides the hand-back the posed question supplies: what the draft said BEFORE its first
  // question (the acknowledgement), then the verified question itself — what the rewrite produced in 9/9
  // measured drift rewrites (5 the question alone, 4 acknowledgement + question; evals/cascade-latency.mjs,
  // 2026-10-02), at ~1 s less. Every guard runs again on the result; anything left goes to the rewrite.
  // The same holds for the G-ASK parity, two-question and goodbye problems (a pure shape fix, measured below).
  if (found.length && !checkin && found.every((p) => SHAPE.has(p))) {
    const repaired = shapeFix(reply, found);
    if (!problems(repaired).length) {
      reply = repaired;
      found = [];
      guard.repaired = true;
    }
  }
  if (found.length) {
    const asked = G && ["example", "story", "another"].includes(state.lastMove?.request);
    const why = [found.includes("leak") && asked && "it gives away the answer to the question — keep what they asked for, but with different numbers and a different case from the question, so its answer is never stated",
      found.includes("leak") && !asked && (ahead
      ? "it states the answer to the practice question that comes next — explain with different numbers or a different example, and do not answer that question"
      : "it gives away the key answer — the hint ladder has not reached rung 4"),
      found.includes("drift") && `it must ask exactly this question and no other: "${promptFor(item, lang)}"`,
      found.includes("nowhy") && "it must ask how they knew or why — about the question they just answered, not a new problem; the reason is theirs to give",
      found.includes("flat") && !found.includes("nowhy") && "it never hands the floor back — end with one question for the child about the same thing (and do not answer it yourself)",
      found.includes("script") && (lang === "hindi" ? "write it in Roman or Devanagari only" : "write it in Roman script only — no Devanagari or any other script"),
      found.includes("long") && `it is too long — at most ${TURN_WORDS[state.ctx.ageBand]} words`,
      found.includes("units") && "it asks which is bigger between two different kinds of quantity — compare like with like (two counts, or two lengths in one unit)",
      found.includes("floor") && `it breaks the safety floor — ${floorOf(reply).map((k) => FLOOR_FIX[k]).filter(Boolean).join("; ")}`,
      found.includes("praise") && "it agrees with or praises their answer, but their answer was not marked right — no agreement or praise word for it; name what is sensible in it, then the next step",
      found.includes("deny") && "it says their answer is wrong, but it was right — confirm it plainly",
      found.includes("corrects") && `it implies their answer was wrong or that the answer is something else, but their answer ${JSON.stringify(String(right.key))} was right — confirm it plainly and do not name any other answer as the result`,
      found.includes("screen") && "it tells them to tap or pick something on the screen, but nothing is on the screen to tap this turn — ask them to say it",
      found.includes("parts") && `it names parts the screen does not show — ${screenContradiction(own(reply), module)?.onScreen ?? ""}`,
      found.includes("cantshow") && "it says you cannot show or draw — never say that; the board draws for you: talk about the idea itself",
      found.includes("stage") && "it reads out a field name, markup or a text picture (like 'Whiteboard:', brackets or rows of symbols like ●●●) — plain spoken words only; the board draws pictures, never your words",
      found.includes("register") && (address === "aap" ? "it uses tum forms — address the child with aap forms only (aap, aapka; verbs ending -iye)" : "it uses aap — address the child with tum forms (tum, tumhara)"),
      found.includes("ask") && !found.includes("drift") && `it must end by asking exactly this question, and ask nothing else: "${askEnd}"`,
      found.includes("twoq") && !found.includes("ask") && "it asks more than one question — keep only one question, at the end",
      found.includes("wrap") && (checkin ? "it already says goodbye, but they have not chosen yet — offer stopping as one of the choices (stop for today), not as a goodbye"
        : "it says goodbye or that the lesson is over, but the lesson goes on — no goodbye words"),
      found.includes("bare") && (rePose ? "it is only the question again — first answer what they just said, or give the nudge or the step, in one short line of your own; then the question"
        : "it is only the question — say a short bridge of your own first (a few words to what they said), then the question"),
      found.includes("same") && "it repeats what you already said earlier, almost word for word — say something new (a different nudge, example or way in); then the question",
      found.includes("thinkq") && "they are in the middle of a thought — ask nothing at all; only a few words that let them go on and finish it",
      found.includes("noconfirm") && "their answer was right — open by confirming it in a few words, naming what they got right, before anything else",
      found.includes("hold") && "they asked to stop: it asks a lesson question or holds them for one more — this turn asks nothing about the lesson; only offer the choices",
      found.includes("nostop") && (checkin === "rel" ? "it must say plainly that stopping now is fine" : "it leaves out stopping — name all three choices: keep going, a short break, or stop for today"),
    ].filter(Boolean).join("; and ");
    try {
      reply = await ask([...messages, { role: "assistant", content: reply }, { role: "system", content: checkin
        ? `Rewrite that turn: ${why}. Same check-in, same language, one or two short warm sentences, then wait for their choice.`
        : `Rewrite that turn: ${why}. Same move, same language, one idea, end by handing the floor back.` }]);
      guard.rewritten = true;
      found = problems(reply);
    } catch (e) {
      if (isContentFilter(e)) { console.warn("[lesson] rewrite blocked by the content filter"); return blocked(); }
      console.warn("[lesson] rewrite unavailable, guarding the draft:", e.message); // the draft's problems stand
    }
    guard.afterRewrite = found;
    if (checkin && (found.includes("floor") || found.includes("hold") || found.includes("nostop") || found.includes("wrap"))) {
      // a check-in that still asks a lesson question, holds them, or drops the stop option is never sent: the fixed line
      reply = fallbackReply(state, null);
      guard.replaced = true;
    } else if (found.includes("floor")) {
      // A teacher line that still breaks the floor is never sent: the fixed line for the move (or the question).
      reply = fallbackReply(state, item);
      guard.replaced = true;
    } else if (found.includes("leak") && ahead) {
      // what is left must still be a turn (F18); else the rewrite stands and the next item is marked spoiled (turn.js)
      const left = withoutLeaks(reply, ahead).replace(/^[\s”"'’)\]]+/, "");
      // p5-interaction (owner-4 "story ki tarah batao": the story was cut to "Agar cake 12 pieces ka ho, ek part mein kitne?"):
      // when the child ASKED for this teaching (a story, an example, another way, slower, a picture), their request wins over
      // the next item's evidence value: the rewrite stands and that item is marked spoiled (its answer is discounted)
      if (coherentRemainder(left) && !(G && state.lastMove?.request)) { reply = left; guard.replaced = true; } else guard.spoilsAhead = ahead.id;
    } else if (found.includes("leak") || found.includes("drift")) {
      // the acknowledgement before the drift / leak stays, then the verified question (F17: never the bare question when
      // the child's words got an answer in the draft)
      reply = repairDrift(reply, item, lang, { noLeak: true });
      if (problems(reply).includes("leak")) reply = askEnd;
      guard.replaced = true;
      // p5-interaction (acceptance 2026-10-05, the req:story chip: 2 / 6 requested stories were cut to the bare question
      // because the story's numbers stated the key): a REQUESTED story / example / other way gets one more attempt with
      // other numbers; it is used only when no truth problem is left (a leak still ships the question alone)
      if (G && item && state.lastMove?.request && isBare(reply, askEnd, pinned)) {
        try {
          const again = await ask([...messages, { role: "assistant", content: guard.firstDraft ?? reply }, { role: "system", content: `Rewrite that turn: they asked for it this way, so keep it that way, but use different numbers and things from the question so it never gives away or works out the question's answer; two short sentences, then end by asking exactly this question: "${askEnd}". Same language.` }]);
          let a = again;
          if (problems(a).includes("long")) a = trimToWords(a, max);
          if (!problems(a).filter((p) => !SOFT_FIX.has(p)).length && !problems(a).includes("long") && !isBare(a, askEnd, pinned)) { reply = a; guard.reasked = true; }
        } catch (e) { if (isContentFilter(e)) return blocked(); }
      }
    } else {
      if (found.includes("units")) { reply = withoutMixedUnits(reply) || fallbackReply(state, item); guard.replaced = true; }
      if (found.includes("script")) reply = reply.replace(OFF_SCRIPT[lang] ?? OFF_SCRIPT.english, "").replace(/\s{2,}/g, " ").trim();
      // What is left of a turn whose words contradicted the verdict or the screen: those sentences go; if nothing
      // that hands the floor back is left, the item's question (or the move's fixed line) is the turn.
      const keepOr = (t) => (t && handsBack(t) ? t : item && !CLOSING_MOVES.has(kindNow) && state.pendingWhy !== item.id
        ? joinAsk(t ?? "", askEnd) : t || fallbackReply(state, item));
      if (found.includes("praise")) { reply = keepOr(stripPraise(reply)); guard.replaced = true; }
      if (found.includes("corrects")) { reply = keepOr(stripCorrection(reply, right)); guard.replaced = true; }
      if (found.includes("screen")) { reply = keepOr(stripScreenRefs(reply)); guard.replaced = true; }
      // W2-B fixer: a rewrite that still names part counts the screen does not show loses those sentences
      if (found.includes("parts")) { reply = keepOr(stripStrayParts(reply, module, undefined, { keep: item ? promptFor(item, lang) : "" })); guard.replaced = true; }
      if (found.includes("register") && address === "aap") { reply = toAap(reply); guard.repaired = true; }
      if (found.includes("stage")) { reply = stripStage(reply) || fallbackReply(state, item); guard.replaced = true; }
      if (found.includes("cantshow")) { reply = keepOr(stripCantShow(reply)); guard.replaced = true; }
      if (found.includes("long")) reply = trimToWords(reply, max);
      // Last: the turn's shape (goodbye words out, the pinned question at the end, one question), in code.
      const left = problems(reply).filter((p) => SHAPE.has(p));
      if (left.length) {
        const fixed = shapeFix(reply, left);
        // p5-interaction: the shape fix drops every question that is not the pinned one; when that leaves only the question
        // (the model's uptake was itself a question: owner-2 R3), the last lead question stays before it instead (goodbye
        // sentences still go)
        // ship5 integration (p5 x W1 "one question per turn", tests/prod/w1a-battery): on a hint turn the rung's own kit
        // hint, as STATEMENTS only, leads first; a lead question is the last resort (it makes the turn two questions).
        const hintLead = G && pinned && kindNow === "hint" ? hintStatements(item, state.lastMove?.hintLevel) : "";
        const alt = G && pinned && isBare(fixed, askEnd, pinned)
          ? (hintLead ? joinAsk(hintLead, askEnd) : keepLastLeadQuestion(left.includes("wrap") ? stripWrap(reply) : reply, askEnd)) : null;
        reply = alt && !isBare(alt, askEnd, pinned) ? alt : fixed;
        guard.repaired = true;
      }
    }
  }
  if (G) {
    // p5-interaction: a teaching turn the repairs above left gutted (owner-2 R6, 3 / 90: "What do you predict?" as a whole
    // hook, after the mixed-units strip) gets one more attempt at a full turn; it is used only when it is clean.
    // (a strip that left nothing put the fixed "lost my words" line on a teaching turn: owner-2 R2 on a local run — the same retry)
    const fixedLine = !item && reply === fallbackReply(state, null);
    if (TEACHING_MOVES.has(kindNow) && (words(reply) < GUTTED_MIN || fixedLine) && !guard.final) {
      try {
        const floorWhy = guard.firstDraft ? floorOf(guard.firstDraft).map((k) => FLOOR_FIX[k]).filter(Boolean).join("; ") : "";
        const again = await ask([...messages, { role: "assistant", content: guard.firstDraft ?? reply }, { role: "system", content: `Rewrite that turn as a full turn: the same idea in two or three short sentences, then one small question about it${ahead ? "; do not answer the practice question that comes next" : ""}; compare only like with like${floorWhy ? `; ${floorWhy}` : ""}; same language.` }]);
        // only the soft problems may remain, and they are repaired in code; any truth problem (floor, leak, praise, deny,
        // units, screen, parts) keeps the turn as it was
        const hard = problems(again).filter((p) => !SOFT_FIX.has(p));
        if (words(again) >= GUTTED_MIN && !hard.length) {
          let a = again;
          const soft = problems(a);
          if (soft.includes("wrap")) a = stripWrap(a) || a;
          if (soft.includes("script")) a = a.replace(OFF_SCRIPT[lang] ?? OFF_SCRIPT.english, "").replace(/\s{2,}/g, " ").trim();
          if (soft.includes("register") && address === "aap") a = toAap(a);
          if (soft.includes("stage")) a = stripStage(a) || a;
          if (soft.includes("cantshow")) a = stripCantShow(a) || a;
          if (words(a) > max) a = trimToWords(a, max);
          if (words(a) >= GUTTED_MIN && !problems(a).filter((p) => !SOFT_FIX.has(p)).length) { reply = a; guard.regutted = true; }
        }
      } catch (e) { if (isContentFilter(e)) return blocked(); }
    }
    // a hint turn still only the question after the rewrite: the rung's own kit hint (verified content that never states
    // the key, never a teacher note) leads the question
    if (item && kindNow === "hint" && problems(reply).includes("bare")) {
      // ship5 integration: statements only, so the repaired turn still asks ONE question (a kit hint can itself ask one)
      const h = hintStatements(item, state.lastMove?.hintLevel);
      if (h) { reply = joinAsk(h, askEnd); guard.repaired = true; }
    }
    // round 2 (conversation): a turn still only the question, or a line she already said, after every repair above: one
    // lead-slot call (the model writes only the response to what they said; code adds the question). Used only when the
    // joined turn has no problem the old one did not have; never after a floor or leak catch (a truth repair stands).
    if (p5Flag("LEADSLOT") && item && pinned && !whyProbe && !item.diagnostic && !CLOSING_MOVES.has(kindNow) && !guard.caught.some((c) => c === "floor" || c === "leak")) {
      const left = problems(reply);
      if (left.includes("bare") || left.includes("same")) {
        try {
          const why = left.includes("bare") ? "your last try was only the question: first respond to what they just said (or give the nudge or the step) in your own words"
            : "your last try repeated what you said earlier: say something new (a different nudge, example or way in)";
          const again = await leadCall(why, guard.firstDraft ?? reply);
          if (again) {
            const was = new Set(left), prevOn = slotState.on;
            slotState.on = true;
            const now = problems(again);
            if (!now.includes("bare") && !now.includes("same") && now.every((p) => was.has(p))) { reply = again; guard.leadRepair = true; } else slotState.on = prevOn;
          }
        } catch (e) { if (isContentFilter(e)) return blocked(); }
      }
    }
    // the cut marks the repairs leave (an orphan quote, an empty fragment) and a lead sentence that re-poses the question
    const tidied = tidyAround(reply, pinned ? askEnd : null);
    if (tidied && tidied !== reply) { reply = tidied; guard.tidied = true; }
  }
  // ship5 fixer (experience B4: "apna maths sawaal likho" to a child talking hands-free): on a spoken lane her OWN words ask
  // the child to say it, never to write or type it (the pinned kit question is verified content and is left byte for byte)
  if (state.mode !== "text") {
    const spoken = speakNotWrite(reply, askEnd);
    if (spoken !== reply) { reply = spoken; guard.spoken = true; }
  }
  // The final words, checked once more (debug and the evals read it): what reached the child.
  const final = problems(reply).filter((p) => p !== "long" || words(reply) > max);
  if (final.length) guard.final = final;
  // The floor families of what will actually be said (the cascade speaks exactly this): [] after the guard, unless
  // even the fixed line broke a rule. The caller turns a non-empty list into the next correction and an incident.
  const floor = final.includes("floor") ? floorOf(reply) : [];
  return { reply, guard, ...(floor.length ? { floor } : {}) };
}

/**
 * p5-interaction: the reply with every question but its LAST lead question and the pinned one dropped, ending on the pinned
 * question (the fallback when the strict one-question fix would leave only the bare question). Exported for tests.
 */
/**
 * p5-interaction: the reply with the cut marks of the repairs tidied (conversation/guards.js tidy) and, when it ends on
 * the pinned question, every lead sentence that is that question again dropped (a copy, a re-wording, a second form of a
 * blanked question: owner-2 s1 t6 "Khaali jagah bhariye: 2/5 is ___ the middle. Khaali jagah bhariye: Check: …"). The
 * question itself is verified content and is kept byte for byte. Exported for tests.
 */
/**
 * ship5 integration: the rung's kit hint (verified content) as a lead with its QUESTION sentences dropped, or "" when
 * nothing is left, it states the key, or it is a teacher's shape note. Exported for tests.
 */
export function hintStatements(item, hintLevel) {
  const h = stripRungLabel(String(item?.hints?.[(hintLevel ?? 1) - 1] ?? "")).replace(/\s+/g, " ").trim();
  if (!h || revealsAnswer(h, item) || hintShapeWords(h)) return "";
  return sentences(h).map((x) => x.trim()).filter((x) => x && !/[?？]/.test(x)).join(" ").trim();
}

export function keepLastLeadQuestion(reply, ask) {
  const r = String(reply ?? "").split(String(ask ?? "")).join(" ");
  const ss = sentences(r).map((x) => x.trim()).filter(Boolean);
  const qi = ss.map((x) => /[?？]/.test(x)).lastIndexOf(true);
  const lead = ss.filter((x, i) => !/[?？]/.test(x) || i === qi).join(" ");
  return `${leadWithoutQuestion(lead, ask) || lead} ${String(ask ?? "").trim()}`.replace(/\s{2,}/g, " ").trim();
}

export function tidyAround(reply, ask) {
  const r = String(reply ?? "").trim();
  if (ask && r.endsWith(String(ask).trim())) {
    const lead = leadWithoutQuestion(r.slice(0, r.length - String(ask).trim().length), ask);
    return `${tidy(lead)} ${String(ask).trim()}`.replace(/\s{2,}/g, " ").trim();
  }
  return tidy(r);
}

/** p5-interaction: does a reply to a RIGHT answer confirm it in its first two sentences (agreement / praise of the answer)? */
function confirmsFirst(t) {
  const head = sentences(t).slice(0, 2).join(" ");
  return praiseProblem(head, "not_yet") === "praise";
}

/** Imperatives to write / type → the spoken form (her own words only; the pinned question at the end is kept). Exported for tests. */
const WRITE_TO_SAY = [
  [/\blikh\s+(?:kar|ke)\s+(?:bhejo|batao|dikhao)\b/gi, "bolkar batao"], [/\blikh\s+(?:kar|ke)\s+(?:bhejiye|bataiye|dikhaiye)\b/gi, "bolkar bataiye"],
  [/\blikh\s+do\b/gi, "bata do"], [/\blikh\s+dijiye\b/gi, "bata dijiye"], [/\blikhiye\b/gi, "bataiye"], [/\blikho\b/gi, "batao"],
  [/\btype\s+(?:karo|kar\s+do)\b/gi, "bolo"], [/\btype\s+(?:kijiye|kariye|kar\s+dijiye)\b/gi, "boliye"],
  [/\b(?:write|type)\s+(?:it|that|this|your\s+answer|the\s+answer)(?:\s+down)?\b/gi, "say it"], [/\bwrite\s+down\b/gi, "say"],
];
export function speakNotWrite(reply, askEnd = null) {
  const r = String(reply ?? "");
  const ask = askEnd ? String(askEnd).trim() : "";
  const cut = ask && r.trim().endsWith(ask) ? r.trim().length - ask.length : r.length;
  let lead = r.slice(0, cut);
  for (const [re, to] of WRITE_TO_SAY) lead = lead.replace(re, (m) => (m[0] === m[0].toUpperCase() ? to[0].toUpperCase() + to.slice(1) : to));
  return lead + r.slice(cut);
}
