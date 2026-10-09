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
