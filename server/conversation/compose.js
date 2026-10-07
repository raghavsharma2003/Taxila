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
  // a child's request answered before the question, or the same question put again after a nudge / repair
  return !!t.request || !!t.rePose;
}

/**
 * The last system note for a lead-slot call: what this turn's words are for, as a shape (never a line she could say).
 * `why` is an extra reason (a repair after a bare draft); `lead` the request's own note when the move carries one.
 */
export function leadSlotNote({ lead = null, why = null, ageBand = "10-15" } = {}) {
  const n = LEAD_MAX_WORDS[ageBand] ?? LEAD_MAX_WORDS["10-15"];
  return [
    "THIS TURN, PART ONE ONLY: the app says the question on the card right after your words, so write only what comes before it.",
    lead ? `Do this first, as the note says: ${String(lead).replace(/[.\s]+$/, "")}.` : "Do what this move's shape asks before the question (the nudge or the step), never more than it.",
    why ? `Also: ${why}.` : null,
    `One to three short spoken sentences, at most ${n} words, in their language. No question of any kind, never the card question or its words, and never its answer or anything that gives it away (no option named as right, no example whose result is the answer).`,
  ].filter(Boolean).join(" ");
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
export const leadOk = (lead, keys = []) => words(lead) >= LEAD_MIN_WORDS && /[\p{L}]/u.test(String(lead)) && !leadDropsQuestion(lead) && !leadNamesKey(lead, keys);

/** The turn: the lead, then the card question byte for byte. PURE. */
export function composeTurn(lead, askEnd) {
  let l = String(lead ?? "").trim().replace(/[,;:—–-]+$/, "").trim();
  if (l && !/[.!।…]$/.test(l)) l += ".";
  return `${l} ${String(askEnd ?? "").trim()}`.replace(/\s{2,}/g, " ").trim();
}
