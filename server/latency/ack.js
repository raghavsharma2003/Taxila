// Round 2, stream latency: the ACKNOWLEDGEMENT decision (SHADOW: decided and timed, never played in this build).
//
// What a human teacher does while she thinks about a child's answer: she says the child's answer back ("chhe…"), neutral,
// the same for right and wrong, and then responds. Research (docs/design/round2/latency/RESEARCH.md §3): a behavioural
// filler improved perceived response time and humanlikeness (Gonzales et al. 2025, adults, VR); a fixed filler list heard
// daily becomes a tic (rj-static-filler-list), so the ack here is ONLY the uptake echo built in code from the child's own
// transcript — the same closed-class token screen as the uptake prelude (server/voice/expressive/prelude.js, HV-16) — and
// when there is no such token there is no ack (no "hmm" loop).
//
// Hard rules (the child-safety floor is above latency):
//  - never on a safety turn: decided only AFTER classify() has returned (its model distress read) and the predicate
//    (scanSafety) is clean, and never while a safeguarding episode is open, on a content-filter block, or a duplex
//    partial-safety hit;
//  - never a verdict: the token is the child's own word, prosody neutral, and only on a GRADED answer turn (a non-answer —
//    "nahi pata", a request, small talk — gets no echo: echoing "pata" is not what a teacher does);
//  - never on a goodbye / stop (NEVER MANIPULATE: nothing that holds a leaving child);
//  - never two turns running (the w2g filler governor's no-consecutive rule: rj-w2g-filler-window-only).
// Status: SHADOW. Playing it needs the client to sound a short clip before the turn's reply and the reply's part 0 to drop
// its own echo (prewarm.js useFull0 already handles the inverse); that is the follow-up in APPLY.md, gated on HV-16's
// listening check. Until then the prefetch route returns the decision and its time so the harness can measure it.
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
