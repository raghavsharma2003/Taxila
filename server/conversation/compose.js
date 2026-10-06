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
export function leadSlotWanted(t) {
  if (!t.pinned || t.diagnostic || t.whyProbe || t.closing) return false;
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
    lead ? `Do this first, fully, exactly as the note says: ${String(lead).replace(/[.\s]+$/, "")}.` : "Do what this move asks before the question, fully (the nudge, the step, or what they asked for), as the move's shape says.",
    why ? `Also: ${why}.` : null,
    `One to three short spoken sentences, at most ${n} words, in their language. No question of any kind, and never the card question or its words.`,
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

/** Is a cleaned lead a response of its own (enough words, not empty punctuation)? PURE. */
export const leadOk = (lead) => words(lead) >= LEAD_MIN_WORDS && /[\p{L}]/u.test(String(lead));

/** The turn: the lead, then the card question byte for byte. PURE. */
export function composeTurn(lead, askEnd) {
  let l = String(lead ?? "").trim().replace(/[,;:—–-]+$/, "").trim();
  if (l && !/[.!।…]$/.test(l)) l += ".";
  return `${l} ${String(askEnd ?? "").trim()}`.replace(/\s{2,}/g, " ").trim();
}
