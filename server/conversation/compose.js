// Round 2 (conversation stream, 2026-10-06): the LEAD SLOT. On a turn that re-poses the question on the card (a request
// answered first, a nudge, a repair), the question is CONTENT the app owns and the model writes only what comes before it.
// Code joins the two. Why (docs/design/round2/conversation/RESEARCH.md):
//   - the battery's commonest failure was a reply that posed the card question and dropped what the child asked for
//     (owner-2 R3 bare question 4/90 on prod, p5 4/40 card-question-only, out_of_bounds "reengages" 0/11, adult_voice 0/4):
//     one generation asked to do two jobs (respond + re-pose verbatim) drops the first when the second is pinned hard;
//   - decision-then-generate beats free generation for tutor remediation (Bridge, Wang et al. NAACL 2024: +76% preferred
//     with the expert decision given), and LLMs lose track of earlier constraints over turns (Laban et al. 2025, -39%):
//     a narrow, last-positioned instruction for ONE job is the mechanism ("position is mechanism").
// The model never writes the question; the guard keeps every truth check (leak, floor, praise, register) on the joined
// turn, so nothing here can loosen the floor. PURE helpers; brain/say.js makes the one model call.
import { sentences, leadWithoutQuestion, tidy } from "./guards.js";

const words = (t) => String(t ?? "").trim().split(/\s+/).filter(Boolean).length;
const isQ = (s) => /[?？]/.test(String(s));

/** Fewest own words a lead must carry to count as a response (a name and two words is not one). */
export const LEAD_MIN_WORDS = 4;
/** Most words a lead may carry (the turn budget is spent on the question too). */
export const LEAD_MAX_WORDS = { "6-9": 24, "10-15": 30 };
// Round 3 (conversation stream, 2026-10-09): the FIRST pose of a question is a lead-slot turn too. Measured on the local
// battery on HEAD (evals/conversation-r3, base-head-1): posing moves were rewritten on 28 of 37 turns, the first draft
// re-worded or replaced the kit question ("drift" 26, "ask" 25 of 90 turns), wrapped up mid-lesson ("Goodbye, Ishaan" on
// a probe) or asked its own follow-up. A first pose needs a bridge, not a response: a shorter lead is enough (a two-word
// "Chalo, ab:" is a bridge, as isBare already allows one own word there), and its budget is smaller because the kit
// question that follows is usually long (short turns: CIMA tutor turns average 7 words, Stasaski et al. 2020).
export const LEAD_MIN_FIRST = 2;
export const LEAD_MAX_FIRST = { "6-9": 14, "10-15": 18 };

/**
 * Should this turn be written as lead + card question? PURE.
 * @param {{ request?: string|null, kind?: string, rePose?: boolean, pinned?: string|null, diagnostic?: boolean,
 *   whyProbe?: boolean, closing?: boolean }} t
 */
// Requests whose answer is teaching content that sits next to the card question's key (answer their question, clarify a
// word, an example, a story, another way, why / how): battery run B 2026-10-07 found leads that gave the key in these
// ("expression hoga 5 guna 4 plus 2" for an example; a clarification naming the result). They keep the one-call path,
// whose own guards and rewrite are HEAD's. Measured: excluding them cost nothing on those intents (no gain was seen there).
export const CONTENT_REQUESTS = new Set(["answer_q", "clarify", "example", "story", "another", "why", "how"]);
export function leadSlotWanted(t) {
  if (!t.pinned || t.diagnostic || t.whyProbe || t.closing) return false;
  if (t.request && CONTENT_REQUESTS.has(String(t.request))) return false;
  // a child's request answered before the question, the same question put again after a nudge / repair, or (round 3) the
  // question posed for the first time (t.firstPose: a posing move at rung 0 whose question goes on the card now)
  return !!t.request || !!t.rePose || !!t.firstPose;
}

/**
 * The last system note for a lead-slot call: what this turn's words are for, as a shape (never a line she could say).
 * `why` is an extra reason (a repair after a bare draft); `lead` the request's own note when the move carries one.
 */
export function leadSlotNote({ lead = null, why = null, ageBand = "10-15", first = false, confirm = false, noAnswer = false } = {}) {
  const n = (first ? LEAD_MAX_FIRST : LEAD_MAX_WORDS)[ageBand] ?? (first ? LEAD_MAX_FIRST : LEAD_MAX_WORDS)["10-15"];
  return [
    first
      // round 3: a first pose. The lesson goes on (first drafts said goodbye on a probe move); the question is new to them
      ? "THIS TURN, PART ONE ONLY: the app puts the next question on the card and says it right after your words, so write only what comes before it; the lesson goes on."
      : "THIS TURN, PART ONE ONLY: the app says the question on the card right after your words, so write only what comes before it.",
    // a right answer is confirmed before anything else (the noconfirm guard), in the slot's own last note: position is mechanism
    confirm ? "First confirm that their last answer was right, naming the exact thing they got right (no ability words)." : null,
    // round 3 (paired battery 2026-10-09): after a filler ("ok samajh gaya", "got it") the bridge opened "Bilkul" / "Nice" /
    // "Shabaash" and was caught as praise on an unverified reply (praise was the commonest first-draft code left on the
    // patched arm, 44 of 1,032 turns). Their last line was not an answer: the note says so, last.
    noAnswer ? "Their last line was not an answer: no praise or agreement word." : null,
    lead ? `Do this first, as the note says: ${String(lead).replace(/[.\s]+$/, "")}.` : first
      ? "Then a short bridge into the new question, as this move's shape asks, never more than it; open differently from your last turn."
      : "Do what this move's shape asks before the question (the nudge or the step), never more than it.",
    why ? `Also: ${why}.` : null,
    `${first ? "One or two" : "One to three"} short spoken sentences, at most ${n} words, in their language. No question of any kind, never the card question or its words, and never its answer or anything that gives it away (no option named as right, no example whose result is the answer).`,
  ].filter(Boolean).join(" ");
}

/**
 * Round 3: the last system note of a ONE-CALL turn that answers a request with no question on the card (a joke, a park, a
 * decline, small talk said over a teaching turn): the request's own note goes last (position is mechanism), the move after
 * it. Smoke on the round-3 tree: on teaching turns the request note sat mid-prompt in the move shape and the reply taught
 * on (joke "humour" failed 4 of 8, a park's promise left out). A shape, never a line. PURE.
 */
export function requestNote(lead) {
  const l = String(lead ?? "").replace(/[.\s]+$/, "").trim();
  return l ? `THIS TURN, FIRST: ${l}. Then the rest of this move as planned, in the same short turn.` : null;
}

/**
 * Round 3: the turn shape as the LAST message of a one-call turn. The compiled prompt ends on its TURN SHAPE line, but the
 * history and the child's words come after it, so it is not last in what the model reads; on the interim paired battery
 * (2026-10-09) the commonest rewrites left on one-call turns were "ask" (a content request that did not end on the card
 * question) and "flat" (a teaching turn that only stated things). This note restates the same rules at the end; it adds none.
 * `ask` is the card question (verified content, quoted because it must be said as written). PURE.
 */
export function turnNote({ ask = null, maxWords = 25, handBack = true } = {}) {
  if (ask) return `THIS TURN: what they asked or the move's step first, in your own words, at most ${maxWords} words; then end with exactly this question and nothing after it: "${String(ask).trim()}". No other question.`;
  return handBack
    ? `THIS TURN: one idea, at most ${maxWords} words; the lesson goes on, so no goodbye; end by handing the floor back with one small question or a try-this about it (never "samjha?").`
    : null;
}

/**
 * The lead a model wrote, cleaned: question sentences out (the card question is the turn's only question), any copy or
 * re-wording of the card question out, cut marks tidied, at most `max` words of whole sentences. PURE.
 */
export function cleanLead(text, askFull, max = 30) {
  const noQ = sentences(text).filter((s) => !isQ(s)).join("");
  const lead = tidy(leadWithoutQuestion(noQ, askFull) || "");
  let out = "";
  for (const s of sentences(lead)) {
    if (words(out + s) > max) break;
    out += s;
  }
  return out.replace(/\s{2,}/g, " ").trim();
}

/**
 * A lead that says the question is being dropped, paused or left for later contradicts the question code puts right after
 * it ("Isse abhi chhod dete hain ... <the same question>?", battery 2026-10-07 frustration; "let's stop here ... Why ...?").
 * Such a lead is refused and the turn falls through to the one-call path, which writes the whole turn itself.
 */
const DROPS_IT = /\b(?:chhod\s+(?:dete|denge|do|dijiye|diya)|skip\s+kar|break\s+le|baad\s+mein\s+(?:karenge|karte|dekhenge)|rukte\s+hain|yahin\s+ruk|let['’]?s\s+stop|stop\s+here|leave\s+(?:it|this)|skip\s+(?:it|this)|come\s+back\s+to\s+(?:it|this)\s+later)\b/i;
export const leadDropsQuestion = (lead) => DROPS_IT.test(String(lead ?? ""));
/** Is a cleaned lead a response of its own (enough words, not empty punctuation, not dropping the question)? PURE. */
/**
 * Does the lead name the card question's key (or an accepted form)? The truth guard's leak check cannot see a key the
 * question itself names ("36 odd hai ya even?" → key "even"), and a lead written BEFORE that question said "36 even hai,
 * kyunki ..." on the 2026-10-07 battery (ask_for_answer-05). Any mention of a key in the lead refuses it: the turn falls
 * through to the one-call path (HEAD behaviour), so a false refusal costs nothing but the slot. PURE.
 */
const norm = (t) => String(t ?? "").toLowerCase().normalize("NFKC").replace(/[^\p{L}\p{N}/.,]+/gu, " ").replace(/\s+/g, " ").trim();
export function leadNamesKey(lead, keys = []) {
  const l = ` ${norm(lead)} `;
  return keys.filter((k) => k != null && norm(k)).some((k) => l.includes(` ${norm(k)} `));
}
export const leadOk = (lead, keys = [], { min = LEAD_MIN_WORDS } = {}) => words(lead) >= min && /[\p{L}]/u.test(String(lead)) && !leadDropsQuestion(lead) && !leadNamesKey(lead, keys);

/** The turn: the lead, then the card question byte for byte. PURE. */
export function composeTurn(lead, askEnd) {
  let l = String(lead ?? "").trim().replace(/[,;:—–-]+$/, "").trim();
  if (l && !/[.!।…]$/.test(l)) l += ".";
  return `${l} ${String(askEnd ?? "").trim()}`.replace(/\s{2,}/g, " ").trim();
}
