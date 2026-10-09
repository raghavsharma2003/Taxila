// The Brain's reason codes: a CLOSED vocabulary (TEACHER-BRAIN §4.1 `ReasonCode`, TB12). Every proposal, rejection and
// trace row carries codes from here, never prose, so a support question is answered from brain_trace rows alone and no
// free text about a child is ever persisted (NM-3). A code is `family.value`; each family's values are enumerated.
// Pure; no I/O.

const MOVE_KINDS = ["greet", "retrieval", "hook", "explain", "worked_example", "probe", "hint", "reteach", "show_module", "practice",
  "teachback", "celebrate", "break", "wrap", "repair", "safeguard", "hold", "recap"];
const SOURCES = ["safety", "consent", "conductor", "governor", "director", "comprehension", "relational", "vibe", "studio"];
const BEATS = ["arrive", "warmup", "hook", "explain", "worked_example", "contrast", "practice_set", "probe", "explore_question", "teachback",
  "reflect", "recap", "wrap", "break", "safeguard"];
// p5-interaction request types (director/requests.js, conversation/lexicon.js + policy.js, state.js P5_REQUESTS). Listed
// here rather than imported so this module stays pure and dependency-free.
const REQUEST_TYPES = ["another", "example", "story", "slower", "visual", "language", "topic", "change_topic", "break", "stop", "goodbye",
  "continue", "confused", "thinking", "choices", "why", "how", "clarify", "repeat", "back", "skip", "know", "harder", "easier", "boredom",
  "frustration", "identity", "uptake", "decline", "answer_q", "adapt", "adopt", "adult", "park", "detour", "hold_checkin", "ask_invite", "unclear"];
// the CONVERSATION-V2 note's intents (conversation/understand.js INTENTS; a test keeps the two lists equal)
const CONV2_INTENTS = ["answer_correct", "answer_wrong", "answer_partial", "answer_hedged", "thinking_aloud", "self_correction", "dont_know",
  "ask_for_answer", "insist_wrong", "check_my_work", "question_on_topic", "clarify", "curiosity_offlesson", "explain_differently",
  "method_instruction", "example", "story", "visual_request", "game_request", "animation_request", "slower", "skip_ahead", "harder", "easier",
  "language_switch", "repeat", "change_topic", "skip_item", "diversion", "insistence", "out_of_bounds", "insistence_oob", "joke", "small_talk",
  "identity", "personal_share", "meta_feedback", "boredom", "frustration", "break_request", "distress", "end_request", "leaving", "backchannel",
  "noise", "adult_voice"];
const OVERLAYS = ["WARM_BOUNDARY", "RELEASE", "CHECK_IN", "OWN_SLIP", "AFFIRM_RECHECK", "SHARE_UPTAKE", "NOTICE", "CHRISTEN", "HOME_TEACH_BACK",
  "POINT_OUT", "LAUGH_WITH"];

/** family → its closed set of values. */
export const FAMILIES = Object.freeze({
  move: MOVE_KINDS,
  guidance: ["worked", "faded", "attempt", "example"],
  purpose: ["lesson", "practice", "doubt", "ask", "homework"],
  ladder: ["rung1", "rung2", "rung3", "rung4"],
  beat: BEATS,
  vetoed_by: SOURCES,
  over_budget: ["attention", "test", "novelty", "usd", "latency"],
  conflict: ["one_move", "one_question", "callback_in_correction", "humour_in_reteach", "reveal_on_closing_move", "reveal_while_answering", "duplicate"],
  safety: ["predicate", "classifier", "content_filter", "relational_floor", "floor_fix", "hold_one_turn", "late_disclosure"],
  rel: OVERLAYS,
  rapport: ["callback", "notice"],
  affect: ["from_relational", "safety_calm", "none"],
  studio: ["reveal", "highlight", "retire", "set_param", "whiteboard_asked", "whiteboard_slot", "whiteboard_declined", "late", "none", "replaces_rung",
    "rung_replaced", "slot"],
  // reveal_ready: Studio's piece made for this beat is revealed instead of a live board; held: the kernel accepted a reveal
  // but Studio's slotFor held it (the tray is the Director's, or the beat moved on), so it is not revealed this turn;
  // declined_by_studio: requestIntent answered null (an interactive piece is mid-use, safety, Studio switched off)
  studio_rejected: ["strained", "safety", "attention", "closing_move", "late", "no_reply", "not_explain", "voice_lane", "reveal_ready", "held",
    "declined_by_studio"],
  signal: ["answer", "question_curious", "question_clarify", "chit_chat", "idk_not_known", "idk_cant_recall", "frustration_words", "pride_words",
    "meta_slow", "meta_break", "humour", "personal_share"],
  lane: ["voice", "cascade", "text"],
  turn: ["late", "module_only", "help", "replanned", "speculation_hit", "speculation_miss", "fallback_reply", "lane_resume", "lane_resume_revoice"],
  // component_error.<seam>: a seam call threw (seam-safe.js fell back); director: the move sent differs from the kernel's
  component_error: ["safety", "director", "comprehension", "relational", "studio", "vibe", "conductor", "moment", "signals", "expressive", "purpose",
    "realtime", "voicesig"],
  // The comprehension trail of a turn (owner priority 1: "why did she treat my child's answer as wrong, or not re-teach?"
  // is answered from brain_trace rows alone): the classifier's outcome, where it came from, the verdict the child saw and
  // what the reply guard did to her words. Codes only, never words.
  cls: ["correct", "incorrect", "partial", "misconception", "dont_know", "no_evidence", "unclear", "no_attempt", "help", "none"],
  cls_source: ["model", "fallback", "error", "asr", "content_filter", "bytes", "module", "help", "chip", "exact", "lexical", "echo", "empty", "predicate",
    "relational", "speculative", "none"],
  verdict: ["correct", "partial", "not_yet", "ungraded"],
  guard: ["replaced", "rewritten", "repaired", "leak", "drift", "nowhy", "flat", "script", "long", "units", "floor", "praise", "deny", "corrects",
    "screen", "parts", "stage", "register", "ask", "twoq", "wrap", "content_filter", "unavailable"],
  // release.check_in_given: the stop phrase got its single check-in (OWNER-RESET #7); release.goodbye_wrap: the lesson ended
  release: ["goodbye", "check_in", "check_in_given", "goodbye_wrap"],
  // ship5 p3-voicesig (server/voicesig/lesson.js): the knowledge state voice timing read on this turn (named for what it
  // says about knowledge and the move it licenses, never a state of mind: restriction 12), whether the precision gate let
  // it act (vs_gate.live) or why it stayed shadow, and the tie-breaker it handed the Director when live. Trace only.
  vs: ["fluentRecall", "workingAloud", "fragileCorrect", "heldBelief", "effortfulGuess", "rapidGuess", "searching", "absent", "none", "disagree", "no_kv"],
  vs_gate: ["live", "killed", "mode_shadow", "not_measured_on_children", "precision_below_bar", "too_few_firings", "ladder_l0", "adapter_shadow"],
  vs_act: ["followUpProbe", "gentlerHint", "slowerPace"],
  // round 3 voicesig (shadow log of what she WOULD have done): the tie-breaker a shadow state would have handed the
  // Director (vs_would), whether the counterfactual plan with it changed her move (vs_diff; not_run = no plan was run),
  // and the device's thinking-pause cue calling at least one pause of this turn a pause to think (vs_hold). Trace only.
  vs_would: ["followUpProbe", "gentlerHint", "slowerPace"],
  vs_diff: ["same", "changed", "not_run"],
  vs_hold: ["fired"],
  // p5-interaction: the request a turn was read as (classify / readings / the UNDERSTAND note), the note itself
  // (conv2.note.<intent> acted on, conv2.shadow.<intent> recorded only, conv2.no_note), the 3-turn card cap, and a module
  // answer the server could not re-check. Without these the trace dropped them (knownReasons) — acceptance 2026-10-05.
  request: [...REQUEST_TYPES],
  conv2: ["no_note", ...CONV2_INTENTS.flatMap((i) => [`note.${i}`, `shadow.${i}`])],
  p5: ["capped.assert", "capped.leave"],
  module: ["unverifiable"],
});

const SETS = Object.fromEntries(Object.entries(FAMILIES).map(([k, v]) => [k, new Set(v)]));

/** Is `code` in the closed vocabulary? */
export function isReason(code) {
  if (typeof code !== "string") return false;
  const i = code.indexOf(".");
  if (i <= 0) return false;
  const set = SETS[code.slice(0, i)];
  return !!set && set.has(code.slice(i + 1));
}

/** Build a code (throws on an unknown one: a typo is a bug, never a silent new code). */
export function reason(family, value) {
  const code = `${family}.${value}`;
  if (!isReason(code)) throw new Error(`unknown reason code ${code}`);
  return code;
}

/**
 * The codes of a list that are in the vocabulary, in their given order, deduplicated. What reaches a trace row: an
 * unknown code from a proposer (another stream's typo) is dropped here rather than written.
 */
export const knownReasons = (codes) => [...new Set((codes ?? []).filter(isReason))];
