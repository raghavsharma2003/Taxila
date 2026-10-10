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
// round 3 fix (experience B6): arithmetic she states, and her own closed sums, checked in code
import { arithmeticSlip, selfPosedVerdict } from "./arith.js";
import { praiseProblem, stripPraise, screenProblem, stripScreenRefs, leaksStage, stripStage, saysCantShow, stripCantShow, askParity, endOnAsk, joinAsk, lastQuestionOnly, wrapsUp, stripWrap, correctsRight, stripCorrection } from "../director/say.js";
import { mixedUnitComparison, withoutMixedUnits } from "../director/units.js";
import { screenContradiction, stripStrayParts } from "../director/modules.js";
import { isBare, repeatsEarlier, tidy, leadWithoutQuestion, sentences } from "../conversation/guards.js";
import { p5Flag } from "../conversation/flags.js";
import { leadSlotWanted, leadSlotNote, cleanLead, leadOk, composeTurn, requestNote, turnNote, LEAD_MAX_WORDS, LEAD_MIN_FIRST, LEAD_MAX_FIRST } from "../conversation/compose.js";
import { fallbackLead } from "../conversation/fallback-lead.js";

/** p5-interaction: problems a gutted teaching turn's one retry may still carry, because code repairs them (never truth). */
const HELP_ASKS = new Set(["another", "clarify", "slower", "example", "story", "frustration", "easier"]);
const SOFT_FIX = new Set(["long", "twoq", "wrap", "script", "register", "stage", "cantshow", "uiword"]);
// round 3 fix (experience B10 / B2): her words never name a screen part by its internal name. The review heard "Chips mein
// chuno: keep going, short break, ya stop for today" (c4-10) and "bar1 ke 4 parts", "bar2 ko … kijiye" over strips labelled
// A and B (3 times): the child sees buttons and strips A / B, never "chips" or "bar1". PURE.
const UI_WORD = /(?<![\p{L}\p{N}])(?:chips?\s+(?:mein|me|par|pe|se|on|in|from)\b|(?:the|on|from|in)\s+(?:the\s+)?chips\b|chips\s+(?:chuno|chuniye|choose|pick|tap|dabao|dabaiye|select)\b|bar\s?[1-9](?![\p{L}\p{N}]))/iu;
export const namesUiPart = (t) => UI_WORD.test(String(t ?? ""));
/** The code repair: "chips mein / on the chips" → the screen; "bar1 / bar2" → A / B (the strips' own labels). */
export function plainUiWords(t, lang = "hinglish") {
  const scr = lang === "english" ? "on the screen" : "screen par";
  return String(t ?? "")
    .replace(/(?<![\p{L}\p{N}])bar\s?([1-9])(?![\p{L}\p{N}])/giu, (_, d) => "ABCDEFGHI"[Number(d) - 1] ?? d)
    .replace(/(?<![\p{L}\p{N}])(?:(?:the|on|from|in)\s+(?:the\s+)?chips|chips?\s+(?:mein|me|par|pe|se|on|in|from))\b/giu, scr)
    .replace(/(?<![\p{L}\p{N}])chips(?=\s+(?:chuno|chuniye|choose|pick|tap|dabao|dabaiye|select)\b)/giu, scr)
    .replace(/\s{2,}/g, " ").trim();
}
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
    checkinRel: "That's okay, stopping is completely fine. Are you okay right now, and is a grown-up nearby?",
    forgetSafety: "That is not something to forget, because your safety matters. You did the right thing by telling. Please tell a grown-up you trust, so they can help." },
  hinglish: { wrap: "Aaj ke liye itna hi. Phir milte hain!", safeguard: `Tumne jo bataya, woh zaroori hai. Kisi bade ko batao jis par bharosa ho, ya ${HELPLINE_LINE_HI} pe call karo. Kya tum abhi theek ho?`,
    safeguardCheck: `Kya tum abhi theek ho? Agar koi baat pareshan kar rahi hai, toh kisi bade ko batao jis par bharosa ho, ya ${HELPLINE_LINE_HI} pe call karo.`,
    other: "Ek second, meri baat atak gayi. Kya tum phir se bata sakte ho?",
    checkinStop: "Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.",
    checkinRel: "Theek hai, rukna bilkul theek hai. Kya tum abhi theek ho, aur koi bada paas hai?",
    forgetSafety: "Isse bhoolna theek nahi hoga, kyunki tumhari safety zaroori hai. Tumne batakar bilkul sahi kiya. Kisi bade ko zaroor batao jis par tumhe bharosa ho, taaki woh tumhari madad kar sakein." },
};
// round 2 safety floor (adversarial B2, 2026-10-07): a stop check-in is an OFFER to stop, never a teaching turn. Before
// this it was guarded as one: her honest "aaj ke liye yahin rok dete hain" tripped the goodbye check ("wrap"), the rewrite
// note said "the lesson goes on … end with one question about the same thing", stripWrap cut the stop option, and the child
// who said "bas, aaj ke liye itna hi" heard "ab isi jagah se continue karte hain — 1 kg mein kitne grams…?" (w2flow-walk
// pass 2; reproduced without a model). A check-in now must name the stop option and must not ask a lesson question or
// hold them for "one more"; what cannot be rewritten clean is the fixed check-in line below, never the lesson's question.
// round 3 fix (adversarial B5): on a forget request after a disclosure (relational overlay forget_after_safety) her line never
// promises to forget it or keep it secret (the incident row and the hand-off stand, so the promise would be false). PURE.
const FORGET_PROMISE = /(?<![\p{L}])(?:i(?:'ll| will| can| am going to)? (?:forget|not remember|keep (?:it|this|that|your secret)(?: a)? secret)|i won'?t (?:remember|keep|tell|say)|(?:it'?s|it is|this is|that'?s|that is) (?:our|a|just our) secret|(?:our|a) little secret|forgotten|between (?:us|you and me)|nobody will know|no one will know|bhool (?:jaung[ia]|jaunga|jaungi|jaati|jaata|gayi|gaya|chuk[ia]|chuke|di|diya|dungi|dunga)|bhula (?:dungi|dunga|diya|di|deti|deta)|yaad nahi\s+rakh(?:ungi|unga|ti|ta|enge|oongi)|nahi\s+rakh(?:ungi|unga|oongi|enge)|kisi ko (?:nahi|nahin|na) bata(?:ungi|unga|oongi|yenge|enge|aungi|aunga)|(?:raaz|raz|secret) (?:rakh(?:ungi|unga|enge|te|ti)?|rahega|rahegi|hai)|hamara (?:raaz|secret)|mita (?:diya|di|dungi|dunga|deti|deta)|भूल (?:जाऊँगी|जाऊंगी|जाऊँगा|जाऊंगा|गई|गया)|याद नहीं रखूँगी|याद नहीं रखूंगी|किसी को नहीं बताऊँगी|किसी को नहीं बताऊंगी|राज़|राज)(?![\p{L}])/iu;
export const promisesForget = (t) => FORGET_PROMISE.test(String(t ?? ""));

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
  // round 3 (conversation; local battery base-head-1, "end the lesson"): "Okay, Meher. We'll stop the lesson here." named
  // the stop and offered nothing else, and the child's "yes" then got "Lesson ended … <a question>". A stop check-in is a
  // CHOICE: going on (or a break) is offered as well. (The relational check-in "rel" only has to say stopping is fine.)
  if (kind === "stop" && p5Flag("R3CONV") && !GO_ON_OFFER.test(text)) out.push("nochoice");
  // round 3 integration (owner-3 on the integrated local tree, 2026-10-09, 2 of 10 stop phrases): the R3 say-back "in their
  // words" turned "lesson khatam" into "Theek hai Aarav, aap lesson khatam karna chahte hain—keep going, …": goodbye words
  // on a turn that goes on (F9 mixed signal; owner-3 RX.wrapWords). A stop check-in carries none of the owner's goodbye
  // words; the check-in's own rewrite ("offer stopping as one of the choices, not as a goodbye"), then the fixed line, apply.
  if (kind === "stop" && p5Flag("R3CONV") && CHECKIN_GOODBYE.test(text)) out.push("wrap");
  return out;
}
/** The owner-3 acceptance's goodbye words (tests/prod/_owner.mjs RX.wrapWords), read on a stop check-in only. */
const CHECKIN_GOODBYE = /\b(?:aaj ke liye (?:bas )?(?:itna|yahin)|lesson (?:yahin )?(?:khatam|khatm)|phir milenge|phir milte hain|goodbye|bye[\s-]*bye|see you|that'?s all for today|let'?s stop (?:here|for today)|yahin rok(?:te| dete) hain)\b/i;
/** The child's options include going on or a short break (Roman Hinglish / English / Devanagari). */
const GO_ON_OFFER = /(?<![\p{L}])(?:continue|keep\s+going|carry\s+on|go\s+on|aage|chalte\s+rah|jaari|padhte\s+rah|karte\s+rah|break|pause|aaram|thoda\s+ruk)|आगे|जारी|ब्रेक/iu;
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
  const posingTurn = guardable && state.hintLevel === 0 && POSING_MOVES.has(state.lastMove.kind);
  // p5-interaction: a thinking-aloud wait hands back by letting them go on, never by a question (the "thinkq" guard below)
  const thinkingWait = p5Flag("GUARDS") && state.lastMove?.request === "thinking";
  // round 2 safety floor: a check-in hands back by the choices it offers (the chips wait), never by a lesson question
  const checkin = state.lastMove?.checkin ?? null;
  const activeItem = checkin && state.activeItemId ? findItem(state, kit, state.activeItemId) : null;
  // round 3: a granted break hands back nothing (breakYes: "no question now"); before this the hand-back check made the
  // rewrite add a lesson question to "brb" / "can we pause for a bit?" (local battery base-head-1: 3 of 3 breaks rewritten)
  const restBreak = p5Flag("R3CONV") && state.lastMove?.kind === "break" && state.lastMove?.request === "break";
  // round 3 fix (adversarial B5): this turn answers a forget request after a disclosure (state.rel: the accepted overlay)
  const forgetSafety = state.rel?.overlay?.shapeId === "forget_after_safety";
  const mustHandBack = !CLOSING_MOVES.has(state.lastMove.kind) && !thinkingWait && !checkin && !restBreak;
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
  // round 3: a turn whose move answers a request that is not an answer ("thoda break chahiye", "can we play a game") has no
  // answer to praise: "Bilkul, aap break lijiye" agrees to the request (base-head-1: caught as praise, rewritten, then
  // shipped flat). Only an UNVERIFIED reading is relaxed; a graded wrong answer keeps every praise check.
  const NOT_ANSWERS = new Set(["break", "stop", "identity", "uptake", "decline", "park", "detour", "adult", "language", "change_topic", "boredom", "back",
    "visual", "story", "example", "another", "slower", "repeat", "clarify", "answer_q", "adapt", "adopt", "harder", "easier", "skip", "know", "frustration"]);
  const wordsVerdict = p5Flag("R3CONV") && verdict === "unverified" && NOT_ANSWERS.has(String(state.lastMove?.request ?? "")) ? "ungraded" : verdict;
  // round 3 fix (experience B6): her OWN closed sum ("2000 + 50 = ___?") answered with a bare number is checked in code for
  // her words ("Haan, 2000 g…" to a wrong 2000): never evidence, only what her line may agree with
  const lastAsked = !item ? history.filter((x) => x.who === "teacher").at(-1)?.text ?? null : null;
  const selfV = lastAsked ? selfPosedVerdict(lastAsked, childText) : null;
  const praiseOf = (t) => praiseProblem(t, selfV === "incorrect" ? "not_yet" : selfV === "correct" ? "correct" : wordsVerdict);
  // p5-interaction guards (conversation/guards.js): her earlier lines of this lesson (the repeat guard reads the last six)
  const G = p5Flag("GUARDS");
  const earlier = G ? history.filter((t) => t.who === "teacher").slice(-6).map((t) => t.text) : [];
  // p5-interaction (owner-2 R4: a 40-word question re-read in full on every hint turn): once the question has been posed,
  // a re-pose ends on the card's form of it (UiDirectives.ask.text, ≤ 120 characters: the question sentence itself)
  const rePose = !!item && state.pinItem === item.id && (state.pinRun ?? 0) > 1;
  const askEnd = item ? (G && pinned && rePose ? pinned : promptFor(item, lang)) : null;
  // Round 3 (conversation stream; kill switch TAXILA_P5_R3CONV=off): the question was posed on the last turn (a re-pose),
  // so a turn that ends on the card's form of it has posed it; the "drift" check (half the full prompt's content words)
  // asks only for a FIRST pose. Before this, a re-pose at rung 0 (a request answered, a question of theirs, small talk)
  // that ended on the card form tripped drift on every turn (the lead slot itself ends on the card form): base-head-1 had
  // drift on 26 of 90 turns, and the rewrite or the drift repair dropped what the draft had said to the child
  // ("pehle mera sawaal": the rainbow answer cut, insistence "engages_brief" no).
  const R3 = G && p5Flag("R3CONV");
  // round 3: the help requests whose turn must carry a line of her own before the card question (never only the question)
  const helpAsk = R3 && HELP_ASKS.has(String(state.lastMove?.request ?? ""));
  const mustPose = posingTurn && !(R3 && pinned && rePose);
  const firstPose = R3 && !!pinned && !rePose && posingTurn;
  // round 3 (conversation; smoke on the round-3 tree): confirming a RIGHT answer names the parts of the question they just
  // answered ("Haan — Flag A mein 4 equal sections hain") while the screen already shows the next idea (thirds): the parts
  // check read that as naming parts the screen does not show, and the repair cut the confirmation (8 of 94 turns, then
  // "noconfirm" on what shipped). The answered item's own question and key are verified content: their parts may be named.
  const answered = R3 && verdict === "correct" && state.itemsDone?.length ? findItem(state, kit, state.itemsDone.at(-1)) : null;
  const partsLines = answered ? [promptFor(answered, lang), String(answered.answer ?? "")] : undefined;
  // round 2 (conversation): a lead-slot turn's length is its OWN words (the card question after them is verified content,
  // like a diagnostic's options): within the lead budget it is not "long"
  const slotState = { on: false };
  const slotLength = (t) => slotState.on && !!askEnd && String(t).trim().endsWith(String(askEnd).trim())
    && words(String(t).trim().slice(0, String(t).trim().length - String(askEnd).trim().length)) <= (LEAD_MAX_WORDS[state.ctx.ageBand] ?? 30);
  // G-PRAISE-2: after a right answer the acknowledgement never states a wrong option as the result (say.js correctsRight).
  const right = verdict === "correct" && state.lastRight?.wrong?.length ? { ...state.lastRight, nextPrompt: item ? promptFor(item, lang) : ahead ? promptFor(ahead, lang) : "" } : null;
  const problems = (t) => [
    floorOf(t).length && "floor",
    forgetSafety && promisesForget(t) && "forget",
    praiseOf(t) === "praise" && "praise",
    praiseOf(t) === "contradicts" && "deny",
    right && correctsRight(t, right) && "corrects",
    screenProblem(t, ui, module) && "screen",
    // W2-B #1: the line names parts the mounted module does not show (she said quarters over fifths). Her OWN words only:
    // the kit's posed question is verified content (W2-E: the replay showed the predicate flagging a verified question
    // that names halves/quarters/eighths beside a 1/2-only predict screen, which cost a rewrite and her lead-in).
    screenContradiction(own(t), module, partsLines) && "parts",
    registerBroken(t, address) && "register",
    leaksStage(t) && "stage",
    namesUiPart(own(t)) && "uiword",
    saysCantShow(t) && "cantshow",
    (guardable && revealsAnswer(t, item) || ahead && revealsAnswer(t, ahead)) && "leak",
    mixedUnitComparison(own(t)) && "units",
    // round 3 fix (experience B6): an arithmetic result she states that is false ("1 by 4 ko 3 se multiply karne par 3 by 12")
    !!arithmeticSlip(own(t)) && "math",
    mustPose && !posesItem(t, item, lang) && "drift",
    whyProbe && !asksWhy(t) && "nowhy",
    // round 3: a turn that ends on the pinned kit question has handed the floor back, whatever its verb ("…sabse bade
    // tukde se sabse chhote tak lagao." has no "?" and no listed verb: every pose of it was "flat" and rewritten)
    mustHandBack && !handsBack(t) && !(R3 && pinned && parityOf(t).endsOnAsk) && "flat",
    !scriptOk(t, lang) && "script",
    words(t) > max && !slotLength(t) && "long",
    pinned && !parityOf(t).endsOnAsk && "ask",
    mustHandBack && parityOf(t).questions > 1 && "twoq",
    wrapping && wrapsUp(t) && "wrap",
    // p5-interaction: the reply is only the question again (owner-2 R3, 9 / 90), or a line she already said (R4, 8 / 90)
    // round 3: a welcome back is short by nature ("Wapas aa gaye, Riya!"): two own words are a response there
    // round 3 (owner-2 on both trees: "samajh nahi aaya" on a faded step got only the step's question, R3 + R7.same_again): a
    // turn answering a request for help carries a real line of its own even on a first pose
    G && pinned && isBare(t, promptFor(item, lang), pinned, helpAsk ? undefined : !rePose ? 1 : R3 && state.lastMove?.request === "back" ? 2 : undefined) && "bare",
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
    else if (f.includes("twoq")) out = lastQuestionOnly(out, { keepContent: R3 });
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
    whyProbe, closing: CLOSING_MOVES.has(kindNow), firstPose: firstPose && !checkin });
  // round 3: a first pose with no request is a bridge into a new question (shorter lead, a right answer confirmed first)
  const bridge = firstPose && !state.lastMove?.request;
  const shortLead = bridge || (R3 && state.lastMove?.request === "back");
  const leadMax = (bridge ? LEAD_MAX_FIRST : LEAD_MAX_WORDS)[state.ctx.ageBand] ?? 30;
  const leadCall = async (why = null, draft = null) => {
    const extra = [...(draft ? [{ role: "assistant", content: draft }] : []), { role: "system", content: leadSlotNote({ lead: state.lastMove?.lead ?? null, why, ageBand: state.ctx.ageBand,
      first: bridge, confirm: R3 && verdict === "correct" && !checkin, noAnswer: R3 && bridge && (wordsVerdict === "unverified" || wordsVerdict === "attempt") }) }];
    const raw = await ask([...messages, ...extra]);
    const lead = cleanLead(raw, askEnd, leadMax);
    return leadOk(lead, [item?.answer, ...(item?.acceptable ?? [])], shortLead ? { min: LEAD_MIN_FIRST } : undefined) ? composeTurn(lead, askEnd) : null;
  };
  // round 3: a one-call turn gets its own shape LAST (compose.js turnNote): a request's note first when the move answers one
  // with no card question, then the turn shape (end on the card question; or hand the floor back, no goodbye). Not on a
  // check-in, a granted break, a thinking-aloud wait, a why-probe or a closing move (each has its own shape).
  const reqNote = R3 && !pinned && !CLOSING_MOVES.has(kindNow) && !checkin && state.lastMove?.lead ? requestNote(state.lastMove.lead) : null;
  const shapeNote = R3 && !CLOSING_MOVES.has(kindNow) && !checkin && !restBreak && !thinkingWait && !whyProbe && !item?.diagnostic && mustHandBack
    ? turnNote({ ask: pinned ? askEnd : null, maxWords: TURN_WORDS[state.ctx.ageBand] ?? 25 }) : null;
  const lastNotes = [reqNote, shapeNote].filter(Boolean).join(" ");
  try {
    reply = slot ? (await leadCall()) : null;
    if (reply) { guardSlot.used = true; slotState.on = true; }
    reply ??= await ask(lastNotes ? [...messages, { role: "system", content: lastNotes }] : messages);
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
      found.includes("math") && (() => { const x = arithmeticSlip(own(reply)); return x ? `it states a result that is not true (${x.claim}: the true value is ${x.value}) — say it correctly, or leave the sum out` : null; })(),
      found.includes("floor") && `it breaks the safety floor — ${floorOf(reply).map((k) => FLOOR_FIX[k]).filter(Boolean).join("; ")}`,
      found.includes("forget") && "it promises to forget or keep secret what they told you about being unsafe — never promise that; say kindly that telling was right and that a grown-up they trust should know so they can help",
      // round 3: on a turn with no answer to judge (a filler, an unverified reply) "start from what they actually did" made the
      // rewrite echo the filler ("Tumne bas “haan” kaha", 4 of ~500 turns on the paired battery): there it says go straight on
      found.includes("praise") && (R3 && (wordsVerdict === "unverified" || wordsVerdict === "attempt")
        ? "it praises or agrees as if they answered, but there is no answer of theirs to judge this turn — no praise or agreement word; go straight on with the move, without commenting on what they said"
        : `it agrees with or praises their answer, but their answer was not marked right — no agreement or praise word for it; ${R3 ? "start from what they actually did" : "name what is sensible in it"}, then the next step`),
      found.includes("deny") && "it says their answer is wrong, but it was right — confirm it plainly",
      found.includes("corrects") && `it implies their answer was wrong or that the answer is something else, but their answer ${JSON.stringify(String(right.key))} was right — confirm it plainly and do not name any other answer as the result`,
      found.includes("screen") && "it tells them to tap or pick something on the screen, but nothing is on the screen to tap this turn — ask them to say it",
      found.includes("parts") && `it names parts the screen does not show — ${screenContradiction(own(reply), module, partsLines)?.onScreen ?? ""}`,
      found.includes("cantshow") && "it says you cannot show or draw — never say that; the board draws for you: talk about the idea itself",
      found.includes("stage") && "it reads out a field name, markup or a text picture (like 'Whiteboard:', brackets or rows of symbols like ●●●) — plain spoken words only; the board draws pictures, never your words",
      found.includes("uiword") && "it names a screen part by an internal name (chips, bar1) — say what the child sees: the buttons on the screen, strip A or B",
      found.includes("register") && (address === "aap" ? "it uses tum forms — address the child with aap forms only (aap, aapka; verbs ending -iye)" : "it uses aap — address the child with tum forms (tum, tumhara)"),
      found.includes("ask") && !found.includes("drift") && `it must end by asking exactly this question, and ask nothing else: "${askEnd}"`,
      found.includes("twoq") && !found.includes("ask") && "it asks more than one question — keep only one question, at the end",
      found.includes("wrap") && (checkin ? "it already says goodbye, but they have not chosen yet — offer stopping as one of the choices (stop for today), not as a goodbye"
        : "it says goodbye or that the lesson is over, but the lesson goes on — no goodbye words"),
      found.includes("bare") && (rePose || helpAsk ? "it is only the question again — first answer what they just said, or give the nudge or the step, in one short line of your own; then the question"
        : "it is only the question — say a short bridge of your own first (a few words to what they said), then the question"),
      found.includes("same") && "it repeats what you already said earlier, almost word for word — say something new (a different nudge, example or way in); then the question",
      found.includes("thinkq") && "they are in the middle of a thought — ask nothing at all; only a few words that let them go on and finish it",
      found.includes("noconfirm") && "their answer was right — open by confirming it in a few words, naming what they got right, before anything else",
      found.includes("hold") && "they asked to stop: it asks a lesson question or holds them for one more — this turn asks nothing about the lesson; only offer the choices",
      found.includes("nostop") && (checkin === "rel" ? "it must say plainly that stopping now is fine" : "it leaves out stopping — name all three choices: keep going, a short break, or stop for today"),
      found.includes("nochoice") && !found.includes("nostop") && "it only names stopping — they have not chosen yet: name all three choices, keep going, a short break, or stop for today",
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
    if (checkin && (found.includes("floor") || found.includes("hold") || found.includes("nostop") || found.includes("wrap") || found.includes("nochoice"))) {
      // a check-in that still asks a lesson question, holds them, or drops the stop option is never sent: the fixed line
      reply = fallbackReply(state, null);
      guard.replaced = true;
    } else if (found.includes("forget")) {
      // round 3 fix (adversarial B5): a promise to forget a disclosure is never sent: the fixed honest line
      const line = FALLBACK[lang === "english" ? "english" : "hinglish"].forgetSafety;
      reply = address === "aap" && lang !== "english" ? toAap(line) : line;
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
      // a false sum that survived the rewrite: its sentence goes (the rest of the turn stands, or the question / fixed line)
      if (found.includes("math")) { reply = keepOr(sentences(reply).filter((x) => !arithmeticSlip(own(x))).join(" ").trim()); guard.replaced = true; }
      if (found.includes("praise")) { reply = keepOr(stripPraise(reply)); guard.replaced = true; }
      if (found.includes("corrects")) { reply = keepOr(stripCorrection(reply, right)); guard.replaced = true; }
      if (found.includes("screen")) { reply = keepOr(stripScreenRefs(reply)); guard.replaced = true; }
      // W2-B fixer: a rewrite that still names part counts the screen does not show loses those sentences
      if (found.includes("parts")) { reply = keepOr(stripStrayParts(reply, module, partsLines, { keep: item ? promptFor(item, lang) : "" })); guard.replaced = true; }
      if (found.includes("register") && address === "aap") { reply = toAap(reply); guard.repaired = true; }
      if (found.includes("stage")) { reply = stripStage(reply) || fallbackReply(state, item); guard.replaced = true; }
      if (found.includes("uiword")) { reply = plainUiWords(reply, lang); guard.repaired = true; }
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
          if (soft.includes("uiword")) a = plainUiWords(a, lang);
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
    // round 3: a leak caught on the first draft no longer bars this repair: the leak repair left only the question (owner-2
    // R3 "bare question after a wrong answer": a kit hint whose numbers equal the key, cut, then nothing to say), and the new
    // lead is checked against the key (leadOk) and the joined turn may carry no problem the repaired one did not, a leak
    // included. A floor catch still bars it (rj-conv-lead-repair-after-floor).
    if (p5Flag("LEADSLOT") && item && pinned && !whyProbe && !item.diagnostic && !CLOSING_MOVES.has(kindNow) && !guard.caught.some((c) => c === "floor" || (c === "leak" && !R3))) {
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
            if (!now.includes("bare") && !now.includes("same") && !now.includes("leak") && now.every((p) => was.has(p))) { reply = again; guard.leadRepair = true; } else slotState.on = prevOn;
          }
        } catch (e) { if (isContentFilter(e)) return blocked(); }
      }
    }
    // round 3: a re-pose STILL only the question after every model repair gets the fixed code lead (conversation/
    // fallback-lead.js: the kit hint's statements when safe and not said yet, else a generic nudge she has not said this
    // lesson), never the bare question: owner-2 R3 on prod 4 of 90 turns. Code lines, never prompt text (nothing to recite).
    if (R3 && item && pinned && (rePose || helpAsk) && !whyProbe && !item.diagnostic && !CLOSING_MOVES.has(kindNow) && !checkin && !guard.caught.includes("floor")
      && problems(reply).includes("bare")) {
      const fixedLead = fallbackLead({ request: state.lastMove?.request ?? null, hint: hintStatements(item, state.lastMove?.hintLevel), rePose: true, lang, avoid: earlier });
      if (fixedLead) {
        const joined = composeTurn(address === "aap" && lang !== "english" ? toAap(fixedLead) : fixedLead, askEnd);
        const was = new Set(problems(reply)), prevOn = slotState.on;
        slotState.on = true;
        const now = problems(joined);
        if (!now.includes("bare") && now.every((p) => was.has(p))) { reply = joined; guard.codeLead = true; } else slotState.on = prevOn;
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
  // round 3: a kit hint with no closing stop ran into the question ("…as places they live What are microbes…?", base-head-1)
  const out = sentences(h).map((x) => x.trim()).filter((x) => x && !/[?？]/.test(x)).map((x) => (/[.!।…]$/.test(x) ? x : `${x}.`)).join(" ").trim();
  // it opens her turn: a capital first letter ("look at the step just before…" came out lower-case)
  return out ? out[0].toUpperCase() + out.slice(1) : "";
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
// round 3 (conversation; base-head-1): "Kabir, haan, 1 player bach jaata hai" and "Aarav, aapne … bilkul sahi groups se
// banaya" were caught as NOT confirming (the name before "haan"; "sahi" not right before a listed verb) and rewritten
// (~1-2 s each). A confirmation word in a statement among the first two sentences counts; a negated one never does. This is
// a quality check on a turn after a RIGHT answer (no truth guard is loosened: praise / deny keep their own predicates).
const CONFIRM_WORD = /(?<![\p{L}])(?:bilkul|sahi|correct(?:ly)?|right|haan|haa+n?|yes|yep|exactly|ekdam|sha+ba+sh|well\s+done|perfect|great|badhiya|zabardast|theek\s+(?:kaha|bataya|socha|pakda))(?![\p{L}])(?!\s+(?:nahi|nahin|not|hai\s+kya))|सही|बिल्कुल|हाँ|शाबाश/iu;
function confirmsFirst(t) {
  const head = sentences(t).slice(0, 2).join(" ");
  if (praiseProblem(head, "not_yet") === "praise") return true;
  return p5Flag("R3CONV") && sentences(t).slice(0, 2).some((x) => !/[?？]/.test(x) && CONFIRM_WORD.test(x));
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
