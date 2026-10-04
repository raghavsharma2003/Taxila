// The beat a turn belongs to (TEACHER-BRAIN §6, the teaching segment between a lesson phase and a turn). W2-E: beats
// are READ from the Director's moves (BR3 in W3 makes them the planning unit that drives the Director). Each turn gets
// `ui.beat` {beatId, type, index}: the client's end-of-turn threshold reads `type` (§5.4 L1: high for why-probes and
// teach-back, low for numbers and taps), Studio reads the explanation beats, and brain_trace records it. Pure.

/** Move kind → beat type. null = the move continues the current beat (a hint, a repair, a module turn). */
const BEAT_OF_MOVE = Object.freeze({
  greet: "arrive", retrieval: "warmup", hook: "hook", explain: "explain", worked_example: "worked_example", practice: "practice_set",
  probe: "probe", teachback: "teachback", wrap: "wrap", break: "break", safeguard: "safeguard", celebrate: "reflect",
  hint: null, repair: null, show_module: null, hold: null,
});

/** The explanation beats: Studio may draw the explanation on the whiteboard while she speaks (owner priority 6). */
export const EXPLAIN_BEATS = Object.freeze(new Set(["explain", "worked_example", "contrast", "explore_question", "recap"]));

/**
 * The beat type of a move. A re-teach of a confirmed misconception is a `contrast` beat; any other re-teach (wheel-spin,
 * transfer) re-explains. A why-probe after a right answer stays a `probe`.
 * @param {{ kind: string }} move @param {{ lastReteach?: { misId?: string|null, turn?: number } | null, turn?: number }} next
 */
export function beatTypeOf(move, next) {
  const kind = move?.kind;
  if (kind === "reteach") return next?.lastReteach?.misId && next.lastReteach.turn === next.turn ? "contrast" : "explain";
  return Object.hasOwn(BEAT_OF_MOVE, kind) ? BEAT_OF_MOVE[kind] : null;
}

/**
 * The lesson's beat after this move: a new beat when the type changes, else the same beat (its id is stable while it
 * lasts). Stored on the lesson state as `beat` {id, type, n, since}; session state only.
 * @param {{ id: string, type: string, n: number, since: number } | undefined} prev
 * @returns {{ id: string, type: string, n: number, since: number } | undefined}
 */
export function nextBeat(prev, move, next) {
  const type = beatTypeOf(move, next) ?? prev?.type;
  if (!type) return prev;
  if (prev && prev.type === type) return prev;
  const n = (prev?.n ?? 0) + 1;
  return { id: `b${n}-${type}`, type, n, since: next?.turn ?? 0 };
}

/** The wire view (UiDirectives.beat). */
export const uiBeatOf = (beat) => (beat ? { beatId: beat.id, type: beat.type, index: beat.n } : undefined);
