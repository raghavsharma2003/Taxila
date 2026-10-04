// The turn's WORD and GUARD stages (TEACHER-BRAIN §5.1 stages 5-6): the teacher's reply written from the ONE compiled
// instructions string (one compile() for every lane) and guarded on the bytes by code: answer leaks, drift, floor
// breaks, praise/verdict agreement, the screen, register, script, length and the turn's shape. Moved out of
// server/routes/lesson.js unchanged by W2-E BR1 (BUILD-PLAN W2-E #2); the lesson start and the turn both call it.
import { chat, DEPLOY, isContentFilter } from "../azure.js";
import { floorViolations, scrubPii } from "../director/safety.js";
import { upcomingItem } from "../director/state.js";
import { findItem, promptFor, revealsAnswer, posesItem, handsBack, asksWhy } from "../director/items.js";
import { TURN_WORDS, FLOOR_FIX } from "../compiler/compile.js";
import { HELPLINES } from "../compiler/floor.js";
import { registerBroken, toAap } from "../director/register.js";
import { praiseProblem, stripPraise, screenProblem, stripScreenRefs, leaksStage, stripStage, askParity, endOnAsk, lastQuestionOnly, wrapsUp, stripWrap, correctsRight, stripCorrection } from "../director/say.js";
import { mixedUnitComparison, withoutMixedUnits } from "../director/units.js";
import { screenContradiction } from "../director/modules.js";

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
  const sentences = String(text).match(/[^.!?।]+[.!?।]*\s*/g) ?? [text];
  let out = "";
  for (const s of sentences) {
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
const LATIN = /^[\p{Script=Latin}\p{Script=Common}\p{M}]*$/u;
const SCRIPT_OK = { hinglish: LATIN, english: LATIN, hindi: /^[\p{Script=Latin}\p{Script=Devanagari}\p{Script=Common}\p{M}]*$/u };
const OFF_SCRIPT = { hinglish: /[^\p{Script=Latin}\p{Script=Common}\p{M}]/gu, english: /[^\p{Script=Latin}\p{Script=Common}\p{M}]/gu,
  hindi: /[^\p{Script=Latin}\p{Script=Devanagari}\p{Script=Common}\p{M}]/gu };

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
    other: "Sorry, I lost my words for a second. Can you say that again?" },
  hinglish: { wrap: "Aaj ke liye itna hi. Phir milte hain!", safeguard: `Tumne jo bataya, woh zaroori hai. Kisi bade ko batao jis par bharosa ho, ya ${HELPLINE_LINE_HI} pe call karo. Kya tum abhi theek ho?`,
    other: "Ek second, meri baat atak gayi. Kya tum phir se bata sakte ho?" },
};
/** The fixed safeguarding line (both helplines) in the child's language and address form. */
export function safeguardLine(ctx = {}) {
  const line = FALLBACK[ctx.lang === "english" ? "english" : "hinglish"].safeguard;
  return ctx.address === "aap" && ctx.lang !== "english" ? toAap(line) : line;
}
export function fallbackReply(state, item) {
  const lang = state.ctx.lang;
  const kind = state.lastMove?.kind;
  if (item && !CLOSING_MOVES.has(kind)) return promptFor(item, lang);
  const lines = FALLBACK[lang === "english" ? "english" : "hinglish"];
  const line = lines[kind] ?? lines.other;
  // The fixed lines are written in tum forms; an "aap" child hears them in aap forms (G-REG-1).
  return state.ctx.address === "aap" && lang !== "english" ? toAap(line) : line;
}

/** The draft up to (not including) its first question, then the item's own question. Exported for tests. */
export function repairDrift(draft, item, lang) {
  const sentences = String(draft).match(/[^.!?।]+[.!?।]*\s*/g) ?? [];
  const lead = [];
  for (const x of sentences) {
    if (/[?？]/.test(x)) break;
    lead.push(x);
  }
  return `${lead.join("").trim()} ${promptFor(item, lang)}`.trim();
}

/** Sentences of `text` that do not state `item`'s key (what is left of a teaching turn after a leak survived). */
export const withoutLeaks = (text, item) => (String(text).match(/[^.!?।]+[.!?।]*\s*/g) ?? []).filter((x) => !revealsAnswer(x, item)).join("").trim();

/**
 * Text-mode teacher reply from the SAME compiled instructions, guarded on the bytes: an answer leak before
 * rung 4 (on the active item, or — on a teaching turn — on the item that comes next), a posing turn that
 * does not pose the item (drift), or an over-long turn gets one rewrite; a leak or drift that survives is
 * replaced by the question itself (content), or the leaking sentences are dropped, never shipped. A model
 * failure falls back (fallbackReply) instead of throwing.
 */
export async function textReply({ instructions, state, kit, childText, trace, history = state.recent.slice(0, -1), verdict = state.lastVerdict ?? "ungraded", ui = null, module = null }) {
  const item = state.lastMove?.itemId ? findItem(state, kit, state.lastMove.itemId) : null;
  const ahead = !item && TEACHING_MOVES.has(state.lastMove?.kind) ? upcomingItem(state, kit) : null;
  const lang = state.ctx.lang;
  // A diagnostic's options are content read aloud, so they do not count against the turn length.
  const max = REPLY_MAX_WORDS[state.ctx.ageBand] + (item?.diagnostic ? words(item.options.map((o) => o.text).join(" ")) : 0);
  const guardable = item && state.hintLevel < 4 && state.pendingWhy !== item.id;
  const mustPose = guardable && state.hintLevel === 0 && POSING_MOVES.has(state.lastMove.kind);
  const mustHandBack = !CLOSING_MOVES.has(state.lastMove.kind);
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
  const wrapping = !CLOSING_MOVES.has(kindNow);
  const praiseOf = (t) => praiseProblem(t, verdict);
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
    (guardable && revealsAnswer(t, item) || ahead && revealsAnswer(t, ahead)) && "leak",
    mixedUnitComparison(own(t)) && "units",
    mustPose && !posesItem(t, item, lang) && "drift",
    whyProbe && !asksWhy(t) && "nowhy",
    mustHandBack && !handsBack(t) && "flat",
    !(SCRIPT_OK[lang] ?? LATIN).test(t) && "script",
    words(t) > max && "long",
    pinned && !parityOf(t).endsOnAsk && "ask",
    mustHandBack && parityOf(t).questions > 1 && "twoq",
    wrapping && wrapsUp(t) && "wrap",
  ].filter(Boolean);
  // The code repairs for the turn's shape (no model call): goodbye sentences out of a non-wrap turn, then the turn
  // ends on the pinned question (or keeps only its last question).
  const shapeFix = (t, f) => {
    let out = f.includes("wrap") ? stripWrap(t) : t;
    if (pinned) out = endOnAsk(out, promptFor(item, lang));
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
  // The content filter blocking the reply call (the child's words are in it) is a safety signal, not an
  // outage: the caller fails CLOSED to the safeguarding protocol (turn(): `filtered`).
  const blocked = () => ({ reply: fallbackReply(state, item), filtered: true, guard: { caught: ["content_filter"], rewritten: false, replaced: true } });
  try {
    reply = await ask(messages);
  } catch (e) {
    if (isContentFilter(e)) { console.warn("[lesson] reply blocked by the content filter"); return blocked(); }
    console.warn("[lesson] reply unavailable, falling back:", e.message);
    return { reply: fallbackReply(state, item), guard: { caught: ["unavailable"], rewritten: false, replaced: true } };
  }
  let found = problems(reply);
  const guard = { caught: found, rewritten: false, replaced: false, ...(found.length ? { firstDraft: reply } : {}) };
  // Drift (a posing turn that asked some other question) is repaired without a model call when it is the
  // only problem besides the hand-back the posed question supplies: what the draft said BEFORE its first
  // question (the acknowledgement), then the verified question itself — what the rewrite produced in 9/9
  // measured drift rewrites (5 the question alone, 4 acknowledgement + question; evals/cascade-latency.mjs,
  // 2026-10-02), at ~1 s less. Every guard runs again on the result; anything left goes to the rewrite.
  // The same holds for the G-ASK parity, two-question and goodbye problems (a pure shape fix, measured below).
  if (found.length && found.every((p) => SHAPE.has(p))) {
    const repaired = shapeFix(reply, found);
    if (!problems(repaired).length) {
      reply = repaired;
      found = [];
      guard.repaired = true;
    }
  }
  if (found.length) {
    const why = [found.includes("leak") && (ahead
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
      found.includes("stage") && "it reads out a field name or markup (like 'Whiteboard:' or brackets) — plain spoken words only",
      found.includes("register") && (address === "aap" ? "it uses tum forms — address the child with aap forms only (aap, aapka; verbs ending -iye)" : "it uses aap — address the child with tum forms (tum, tumhara)"),
      found.includes("ask") && !found.includes("drift") && `it must end by asking exactly this question, and ask nothing else: "${promptFor(item, lang)}"`,
      found.includes("twoq") && !found.includes("ask") && "it asks more than one question — keep only one question, at the end",
      found.includes("wrap") && "it says goodbye or that the lesson is over, but the lesson goes on — no goodbye words",
    ].filter(Boolean).join("; and ");
    try {
      reply = await ask([...messages, { role: "assistant", content: reply }, { role: "system", content: `Rewrite that turn: ${why}. Same move, same language, one idea, end by handing the floor back.` }]);
      guard.rewritten = true;
      found = problems(reply);
    } catch (e) {
      if (isContentFilter(e)) { console.warn("[lesson] rewrite blocked by the content filter"); return blocked(); }
      console.warn("[lesson] rewrite unavailable, guarding the draft:", e.message); // the draft's problems stand
    }
    guard.afterRewrite = found;
    if (found.includes("floor")) {
      // A teacher line that still breaks the floor is never sent: the fixed line for the move (or the question).
      reply = fallbackReply(state, item);
      guard.replaced = true;
    } else if (found.includes("leak") && ahead) {
      reply = withoutLeaks(reply, ahead) || fallbackReply(state, null);
      guard.replaced = true;
    } else if (found.includes("leak") || found.includes("drift")) {
      reply = promptFor(item, lang);
      guard.replaced = true;
    } else {
      if (found.includes("units")) { reply = withoutMixedUnits(reply) || fallbackReply(state, item); guard.replaced = true; }
      if (found.includes("script")) reply = reply.replace(OFF_SCRIPT[lang] ?? OFF_SCRIPT.english, "").replace(/\s{2,}/g, " ").trim();
      // What is left of a turn whose words contradicted the verdict or the screen: those sentences go; if nothing
      // that hands the floor back is left, the item's question (or the move's fixed line) is the turn.
      const keepOr = (t) => (t && handsBack(t) ? t : item && !CLOSING_MOVES.has(kindNow) && state.pendingWhy !== item.id
        ? `${t ?? ""} ${promptFor(item, lang)}`.trim() : t || fallbackReply(state, item));
      if (found.includes("praise")) { reply = keepOr(stripPraise(reply)); guard.replaced = true; }
      if (found.includes("corrects")) { reply = keepOr(stripCorrection(reply, right)); guard.replaced = true; }
      if (found.includes("screen")) { reply = keepOr(stripScreenRefs(reply)); guard.replaced = true; }
      if (found.includes("register") && address === "aap") { reply = toAap(reply); guard.repaired = true; }
      if (found.includes("stage")) { reply = stripStage(reply) || fallbackReply(state, item); guard.replaced = true; }
      if (found.includes("long")) reply = trimToWords(reply, max);
      // Last: the turn's shape (goodbye words out, the pinned question at the end, one question), in code.
      const left = problems(reply).filter((p) => SHAPE.has(p));
      if (left.length) { reply = shapeFix(reply, left); guard.repaired = true; }
    }
  }
  // The final words, checked once more (debug and the evals read it): what reached the child.
  const final = problems(reply).filter((p) => p !== "long" || words(reply) > max);
  if (final.length) guard.final = final;
  // The floor families of what will actually be said (the cascade speaks exactly this): [] after the guard, unless
  // even the fixed line broke a rule. The caller turns a non-empty list into the next correction and an incident.
  const floor = final.includes("floor") ? floorOf(reply) : [];
  return { reply, guard, ...(floor.length ? { floor } : {}) };
}
