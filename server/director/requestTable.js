// dc-r7-script-walk-v6-9 T1 (main's director17 judgement, clause 2 — listening): ONE table, request × beat kind → one response shape.
// state.js asks it at each place a request meets a scripted beat; tests/r7-brain-v69.test.mjs replays a director17 row per table row.
// Pure. A row's `rows` are the director17 rows (0-based, persona topic row) its test replays.

/** The beat kinds a request can arrive on. */
export const BEAT_KINDS = Object.freeze(["point", "worked_step", "remediation", "open_card", "spent_card", "checkin_after_point", "aside_reply", "no_card", "worked_checkin", "aside_pending"]);

/**
 * The response shapes:
 * - live_fresh_else_key: the live part re-said in authored words none of her last four turns used (never the same sentence; after a
 *   remediation, the remediation — never a skip past it); with nothing left to re-say, the key and its why.
 * - key: the card's key and its why.
 * - card_first: the card posed first, no simpler; its simpler comes only after a miss on it.
 * - serve_request: the request served as asked; the card it arrived on is never graded; no aside acknowledgement.
 * - park_later: the aside kept with a promise that names no question ("thodi der mein").
 * - return_once: an aside said again is returned to now, once; after that, the one short line.
 * - next_step: the worked example's next step, never a stop or break menu.
 * - move_on: the walk moves on first; the pending aside waits for the next boundary.
 * - ack_then_card: one code acknowledgement (never a verdict), then the card she had not said.
 */
export const REQUEST_TABLE = Object.freeze([
  { id: "T1.1", request: ["language", "clarify"], beat: "point", shape: "live_fresh_else_key", rows: ["stuck c4 10", "stuck c6 8", "stuck c5-t02 8"] },
  { id: "T1.2", request: ["language", "clarify"], beat: "worked_step", shape: "live_fresh_else_key", rows: ["steady c4 36"] },
  { id: "T1.3", request: ["language", "clarify"], beat: "remediation", shape: "live_fresh_else_key", rows: ["steering c5-t02 8", "steering c6 8", "steering c4 8"] },
  { id: "T1.4", request: ["language", "clarify"], beat: "open_card", shape: "live_fresh_else_key", rows: ["stuck c5-t01 10", "steering c5-t01 8"] },
  { id: "T1.5", request: ["language", "clarify"], beat: "spent_card", shape: "key", rows: ["stuck c5-t01 12"] },
  { id: "T1.6", request: ["miss"], beat: "spent_card", shape: "key", rows: ["stuck c4 48", "offtopic c4 34"] },
  { id: "T1.7", request: ["dont_know", "another", "clarify"], beat: "checkin_after_point", shape: "card_first", rows: ["steady c5-t01 6", "stuck c5-t01 6", "steering c5-t01 6"] },
  { id: "T1.8", request: ["visual", "repeat", "selftry", "language"], beat: "aside_reply", shape: "serve_request", rows: ["offtopic c4 26", "stuck c4 38", "offtopic c6 38"] },
  { id: "T1.9", request: ["aside"], beat: "no_card", shape: "park_later", rows: ["steady c4 36", "steady c5-t01 36", "steady c6 36"] },
  { id: "T1.10", request: ["aside_again"], beat: "*", shape: "return_once", rows: ["offtopic c4 30", "offtopic c5-t01 32"] },
  { id: "T1.11", request: ["yes"], beat: "worked_checkin", shape: "next_step", rows: ["stuck c4 54"] },
  { id: "T1.12", request: ["move_on"], beat: "aside_pending", shape: "move_on", rows: ["steady c5-t01 42", "steady c6 42"] },
  { id: "A5", request: ["aside_answer"], beat: "aside_reply", shape: "ack_then_card", rows: [] },
]);

/** The response shape for a request on a beat kind (the first row that names both; "*" any beat), or null: the walk's own rule. */
export function responseShape(request, beat) {
  const r = REQUEST_TABLE.find((x) => x.request.includes(request) && (x.beat === beat || x.beat === "*"));
  return r ? r.shape : null;
}
/** The row itself (for a test or a trace). */
export const tableRow = (request, beat) => REQUEST_TABLE.find((x) => x.request.includes(request) && (x.beat === beat || x.beat === "*")) ?? null;
