// Round 2, stream latency: the ACKNOWLEDGEMENT decision. Round 3 (stream relational-human): it is PLAYED now, through
// POST /api/lesson/turn-ack (server/latency/routes.js) and the device's AckClient (src/latency/ack.ts); kill switch
// TAXILA_ACK=off (server) / ?ack=0 (device). docs/design/round3/relational-human/RESEARCH.md §3.
//
// What a human teacher does while she thinks about a child's answer: she says the child's answer back ("chhe faces…"),
// neutral, the same for right and wrong, and then responds (revoicing: O'Connor & Michaels 1993; uptake: Demszky et al.
// 2021). A behavioural filler improved perceived response time and humanlikeness (Gonzales et al. 2025, adults, VR); a
// fixed filler list heard daily becomes a tic (rj-static-filler-list), so the ack here is ONLY the uptake echo built in
// code from the child's own transcript — the same closed-class token screen as the uptake prelude
// (server/voice/expressive/prelude.js, HV-16) — and when there is no such token there is no ack (no "hmm" loop).
//
// Hard rules (the child-safety floor is above latency):
//  - never on a safety turn: decided only AFTER classify() has returned (its model distress read, whenever the floor's own
//    needsModelDistressRead asks for one) and the predicate (scanSafety) is clean, and never while a safeguarding episode is
//    open, on a content-filter block, or a duplex partial-safety hit;
//  - never a verdict: the token is the child's own word, the audio is rendered from the token ALONE (the same clip for a
//    right and a wrong answer, by construction: ackAudio.js caches by token), prosody neutral, timed from a fixed floor
//    (ACK_FLOOR_MS) so a bytes-decided right answer is not heard back sooner than a model-graded wrong one, and only on a
//    GRADED answer turn (a non-answer — "nahi pata", a request, small talk — gets no echo);
//  - never on a goodbye / stop (NEVER MANIPULATE: nothing that holds a leaving child);
//  - never two turns running, at most ACK_WINDOW_MAX in any ACK_WINDOW turns (rj-w2g-filler-window-only: a window alone let
//    a tic in; the no-consecutive rule is kept beside it).
import { keyTokenOf } from "../brain/moment.js";
import { preludeTokenOk } from "../voice/expressive/prelude.js";
import { isNumberToken, norm } from "../signals/text.js";
import { createHash } from "node:crypto";

const GRADED = new Set(["correct", "incorrect", "partial", "misconception"]);

/** The child's answer token: the last number (digits or a number word) if any, else the moment's key token. */
export function answerTokenOf(text) {
  const t = String(text ?? "").trim();
  if (!t) return null;
  const digits = t.match(/\d{1,4}(?:[./]\d{1,4})?/g);
  if (digits?.length) return digits.at(-1);
  const words = t.split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean);
  for (let i = words.length - 1; i >= 0; i--) if (isNumberToken(norm(words[i]))) return words[i];
  return keyTokenOf(t);
}

/**
 * PURE. The ack for a classified child turn, or { none: reason }.
 * @param {{ text: string, cls: any, predicateDistress: boolean, safeguardOpen?: boolean, pendingSafety?: boolean,
 *   lastAckTurn?: number | null, turn: number, names?: string[], vocab?: string[] }} x
 */
export function ackOf(x) {
  const c = x.cls;
  if (!c) return { none: "unclassified" };
  if (x.predicateDistress || c.flags?.distress || x.safeguardOpen || x.pendingSafety || c.source === "content_filter") return { none: "safety" };
  if (c.flags?.wantsToStop || c.request?.type === "stop" || c.request?.type === "goodbye") return { none: "leaving" };
  if (!GRADED.has(c.outcome)) return { none: "not_an_answer" };
  // the previous turn had one (a re-sent prefetch of the SAME turn decides again: not "consecutive")
  if (x.lastAckTurn != null && x.turn - x.lastAckTurn === 1) return { none: "consecutive" };
  const token = answerTokenOf(x.text);
  if (!token) return { none: "no_token" };
  if (!preludeTokenOk(token, { names: x.names ?? [], vocab: x.vocab ?? [] })) return { none: "token_screen" };
  return { kind: "echo", token };
}

/** Turn window of the ack governor and its cap (≤ 4 echoes in any 10 turns, never two running). */
export const ACK_WINDOW = 10, ACK_WINDOW_MAX = 4;
/**
 * The earliest an ack may be ready, from the start of the perception it waits on (ms). classify() returns at once for a
 * bytes-decided short right answer (classify.js needsModelDistressRead: an exact key of < 3 words needs no model read) and
 * after a ~0.7-0.9 s model call for a wrong one; without a floor the echo of a right answer would come ~0.7 s sooner — a
 * timing verdict leak (HV-16). Measured in evals/relational-human (ack ready right vs wrong).
 */
export const ACK_FLOOR_MS = Number(process.env.TAXILA_ACK_FLOOR_MS ?? 750);
/**
 * The FIXED decision instant (ms after the perception started), or null for the floor-only rule above. With it the ack is
 * decided exactly then — never sooner, and when classify has not settled by then there is no ack ("late"): the moment
 * she says the child's answer back carries no information about the verdict (a floor alone does not: ack-leak run A,
 * 2026-10-09, right p50 1,105 vs wrong 1,422 ms; Kendrick & Torreira 2015: response delay is read as a dispreferred answer).
 * Set from the measured classify tail (RESEARCH.md §3.4, evals/relational-human/ack-leak.mjs).
 */
export const ACK_AT_MS = process.env.TAXILA_ACK_AT_MS === "floor" ? null : Number(process.env.TAXILA_ACK_AT_MS ?? 1200);

const WORD_SPLIT = /[^\p{L}\p{M}\p{N}/.]+/u;

/**
 * The words the ack says: the child's answer token, plus the noun phrase right after it when EVERY word of it is in the
 * item's own vocabulary (its prompt, key or accepted answers: "chhe faces", "aath clay balls") — words the kit already
 * holds, never a child-only word — and the phrase ENDS there (≤ 2 words; a run that would be cut mid-phrase, "eight clay
 * | balls", falls back to the token alone: measured 2026-10-09, after-local-2 turn 19 said "eight clay").
 * @param {string} text  the child's words
 * @param {string} token answerTokenOf(text)
 * @param {string[]} vocab item words (prompt + key + accepted answers)
 */
export function ackPhraseOf(text, token, vocab = []) {
  const bare = (w) => String(w ?? "").replace(/^[./]+|[./]+$/g, "");
  const words = String(text ?? "").split(WORD_SPLIT).map(bare).filter(Boolean);
  const i = words.lastIndexOf(bare(token));
  if (i < 0) return bare(token) || token;
  const pool = new Set(vocab.flatMap((v) => String(v ?? "").toLowerCase().split(WORD_SPLIT).map(bare)).filter((w) => w.length >= 3));
  const inPool = (w) => !!w && w.length >= 3 && pool.has(w.toLowerCase()) && preludeTokenOk(w, { vocab: [...pool] });
  const run = [];
  for (let k = i + 1; k < words.length && run.length < 3 && inPool(words[k]); k++) run.push(words[k]);
  if (!run.length || run.length > 2) return words[i];
  return [words[i], ...run].join(" ");
}

/**
 * PURE. ackOf + the window governor + the phrase. `history` = the lesson's earlier ack turns (numbers).
 * @param {Parameters<typeof ackOf>[0] & { history?: number[], itemWords?: string[] }} x
 * @returns {{ kind: "echo", token: string, phrase: string } | { none: string }}
 */
export function ackPlanOf(x) {
  const a = ackOf({ ...x, lastAckTurn: (x.history ?? []).filter((t) => t < x.turn).at(-1) ?? x.lastAckTurn ?? null });
  if (!a.token) return a;
  const recent = (x.history ?? []).filter((t) => t < x.turn && x.turn - t < ACK_WINDOW);
  if (recent.length >= ACK_WINDOW_MAX) return { none: "window" };
  return { kind: "echo", token: a.token, phrase: ackPhraseOf(x.text, a.token, x.itemWords ?? x.vocab ?? []) };
}

// ───────────── round 5 (stream 3, main's decision 2026-10-14): the NON-VERBAL CONTINUER, owner cohort only ─────────────
// When there is no echo (a non-answer, no closed-class token), a voice turn may still get a short continuer as her first
// sound, so the child is not left in 2-4 s of silence while she thinks. Main's constraints, each a rule here:
//   - the hard rule is the echo's: decided only after the turn's classify (its model distress read) on the SAME words, the
//     predicate clean, no safeguard open, no duplex partial-safety, no content-filter block; the device plays it only when
//     the final transcript equals the words it was decided on (src/latency/ack.ts);
//   - never on a stop / goodbye, never on typed or tapped input (the device asks only on spoken words);
//   - varied and sparse: never two acks on consecutive turns (echo or continuer), never the same continuer twice in a row;
//   - in the child's register, and NO content words: nothing that pre-judges the answer ("sahi", "galat", "bahut badhiya",
//     "haan"/"yes" read as agreement are not in the set);
//   - owner cohort only (TAXILA_ACK_CONTINUER_FOR, the email-or-sha256 list shape of TAXILA_UI_KAKSHA), and only when the
//     device asks for it (`continuer: true`; off on D5 until 4B's gate covers it);
//   - the device holds it until ~900 ms after the child stopped and drops it if her reply is ready first (a fast reply
//     needs no ack).

export const CONTINUERS = Object.freeze({
  // Devanagari for the Hindi / Hinglish voices (they say it right); an ellipsis keeps the prosody open, not final
  hi: Object.freeze(["हम्म…", "अच्छा…", "ओके…"]),
  en: Object.freeze(["Hmm…", "Okay…", "I see…"]),
});
const sha256 = (s) => createHash("sha256").update(s).digest("hex");
/** The owner cohort for the continuer (TAXILA_ACK_CONTINUER_FOR). Pure given env. */
export function continuerCohortHas(email, env = process.env) {
  const e = String(email ?? "").trim().toLowerCase();
  if (!e) return false;
  for (const raw of String(env.TAXILA_ACK_CONTINUER_FOR ?? "").split(",")) {
    const v = raw.trim().toLowerCase();
    if (v && (v === sha256(e) || v === e)) return true;
  }
  return false;
}
/** The register the continuer is said in (the child's language preference). */
export const continuerLangOf = (child) => (String(child?.language_pref ?? "").toLowerCase() === "english" ? "en" : "hi");
/** The continuer to say on this turn: rotates with the turn, never the one said last. PURE. */
export function continuerPhraseOf(lang, turn, last) {
  const set = CONTINUERS[lang] ?? CONTINUERS.hi;
  const pick = set[Math.abs(Number(turn) || 0) % set.length];
  return pick !== last ? pick : set[(set.indexOf(pick) + 1) % set.length];
}
/**
 * PURE. The continuer for a classified spoken turn, or { none: reason }. `history` = the lesson's earlier ack turns (echo
 * or continuer), `last` = the continuer said last.
 * @param {{ cls: any, predicateDistress?: boolean, safeguardOpen?: boolean, pendingSafety?: boolean, turn: number,
 *   history?: number[], last?: string | null, lang: "hi" | "en" }} x
 */
export function continuerPlanOf(x) {
  const c = x.cls;
  if (!c) return { none: "unclassified" };
  if (x.predicateDistress || c.flags?.distress || x.safeguardOpen || x.pendingSafety || c.source === "content_filter") return { none: "safety" };
  if (c.flags?.wantsToStop || c.request?.type === "stop" || c.request?.type === "goodbye") return { none: "leaving" };
  const prev = (x.history ?? []).filter((t) => t < x.turn).at(-1);
  if (prev != null && x.turn - prev === 1) return { none: "consecutive" };
  return { kind: "continuer", token: "", phrase: continuerPhraseOf(x.lang, x.turn, x.last ?? null) };
}
