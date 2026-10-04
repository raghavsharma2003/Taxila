// POLICY — prototype of CONVERSATION-V2 §3/§4 step 2: code turns the UNDERSTAND note into the teacher's move. PURE:
// (note, state) → { move, mods, park?, studio?, end, state' }. Not imported by server/ or src/; the production home is a
// Director layer in front of state.js decide() (CONVERSATION-V2 §7).
//
// The model reads (understand.mjs); code decides (here); the reply model only words the move (unchanged compile path).
// That split is measured, not taste: models as the decision layer broke hard rules in 15/72 runs and did not reproduce
// (rejected model-full-orchestrator, llm-beat-proposer-live); the code policy was 23/24 with 0 breaks.

export const LIMITS = Object.freeze({
  laterMax: 5,             // parked questions held per lesson (the rest go to the child's Later list unanswered)
  detourSentences: 2,      // an in-bounds insistence gets at most this much of her time now
  insistToDetour: 1,       // the child pushes once after a park → a brief detour (owner R6: "if the child insists ... engage briefly")
  stopConfirmTurns: 2,     // a second stop inside this many turns of the check-in pauses the lesson
  offerAfterBoredom: 1,    // boredom: the change happens on the FIRST signal, not the third
});

/** Moves the reply model can be given. Each maps to a shape in CONVERSATION-V2 §3 (never a line she could say). */
export const MOVES = Object.freeze([
  "safeguard", "pause", "check_in", "break", "adult", "decline", "grade", "wait", "hint", "decline_nudge", "recheck", "answer_q",
  "rephrase", "park", "detour", "reteach", "adopt", "show", "play", "pace_prove", "level", "repeat", "offer_choice", "skip", "uptake",
  "disclose", "adapt", "invite", "repair", "continue",
]);

const ANSWERS = new Set(["answer_correct", "answer_wrong", "answer_partial", "answer_hedged", "self_correction", "check_my_work"]);
const OFF_LESSON = new Set(["curiosity_offlesson", "diversion"]);

export function initState(o = {}) {
  return { turn: 0, phase: o.phase ?? "practice", itemOnTable: o.itemOnTable ?? true, lang: o.lang ?? "hinglish", prefs: {}, pace: 0, level: 0,
    later: [], stopAskedAt: null, minutes: o.minutes ?? 0, parentLimitMin: o.parentLimitMin ?? 30, breakAt: null };
}

/** The most recent unserved parked question, if it was parked within the last `within` turns. */
const recentParked = (s, within = 3) => [...s.later].reverse().find((p) => !p.servedAt && s.turn - p.at <= within) ?? null;

/**
 * One decision. `note` is understand.mjs's parsed note (or a gold note built from the battery's labels).
 * @returns {{ move: string, mods: object, park?: object, studio?: object, end: boolean, reason: string, state: object }}
 */
export function decide(prev, note) {
  const s = structuredClone(prev);
  s.turn += 1;
  const all = [note.intent, ...(note.also ?? [])];
  const has = (i) => all.includes(i);
  const mods = {};
  const out = (move, reason, extra = {}) => ({ move, mods, end: false, reason, ...extra, state: s });

  // modifiers first: they ride on whatever content move wins (a language switch never costs the child their question)
  if (has("language_switch") && note.langTo) { s.lang = note.langTo; mods.lang = note.langTo; }
  if (has("slower")) { s.pace = Math.max(-2, s.pace - 1); mods.pace = "slower"; }
  if (has("method_instruction") && note.method) { s.prefs = { ...s.prefs, [note.method]: s.turn }; mods.prefs = Object.keys(s.prefs); }
  if (has("meta_feedback") && /long|too much|lamba|zyada bol/i.test(note.method || note.topic || "")) { s.prefs = { ...s.prefs, short: s.turn }; mods.prefs = Object.keys(s.prefs); }

  // 1. safety before anything (the predicate OR the model; never narrowed by anything below)
  if (note.distress || has("distress")) return out("safeguard", "distress: predicate or model");
  // 2. session control. Leaving is a real need: let go now, warmly, progress saved (NEVER MANIPULATE). A stop REQUEST
  //    gets one check-in; the second stop inside the window (or the stop chip) pauses. Neither closes the day (F7).
  if (has("leaving")) return { ...out("pause", "leaving: let go now"), end: true };
  if (has("end_request")) {
    if (s.stopAskedAt != null && s.turn - s.stopAskedAt <= LIMITS.stopConfirmTurns) return { ...out("pause", "stop confirmed after the check-in"), end: true };
    s.stopAskedAt = s.turn;
    return out("check_in", "first stop request: acknowledge, offer break / 2-min wrap / keep going");
  }
  if (s.stopAskedAt != null && s.turn - s.stopAskedAt <= LIMITS.stopConfirmTurns && note.intent === "backchannel" && /^(haan|yes|ha|हाँ|ok|okay)/i.test(note.answer || "")) {
    return { ...out("pause", "yes to the stop check-in"), end: true };
  }
  if (s.minutes >= s.parentLimitMin) return { ...out("pause", "parent limit reached (a control, not a child request)"), end: true };
  if (has("adult_voice")) return out("adult", "an adult is speaking: respond to them; time requests act like a parent control");
  if (has("break_request")) { s.breakAt = s.turn; return out("break", "short break, state kept, easy way back"); }
  // 3. bounds: an out-of-bounds ask is declined warmly and the lesson wins attention back; never parked, never served
  if (has("out_of_bounds") || has("insistence_oob") || (OFF_LESSON.has(note.intent) && note.inBounds === false)) return out("decline", "out of bounds: warm decline + a hook from the lesson");
  // 4. off-lesson: park the first time; a push on a recently parked topic gets a brief detour (bounded), then back
  const parked = recentParked(s);
  if (has("insistence") || (parked && OFF_LESSON.has(note.intent) && (!note.topic || sameTopic(note.topic, parked.topic)))) {
    if (parked) { parked.insist = (parked.insist ?? 0) + 1; parked.servedAt = s.turn; }
    return out("detour", `insisted on "${parked?.topic ?? note.topic}": answer in <= ${LIMITS.detourSentences} sentences, then back`);
  }
  if (all.some((i) => OFF_LESSON.has(i))) {
    const p = { id: `p${s.turn}`, topic: note.topic || "(their question)", learning: note.intent === "curiosity_offlesson" || note.learning, at: s.turn,
      promise: s.itemOnTable ? "after this question" : "at the end" };
    if (s.later.filter((x) => !x.servedAt).length < LIMITS.laterMax) s.later.push(p);
    const answerToo = all.some((i) => ANSWERS.has(i));
    return out(answerToo ? "grade" : "park", `park "${p.topic}" (${p.promise})`, { park: p });
  }
  // 5. the work itself (answers are graded by CODE against the verified key; the model only extracted the final answer)
  if (all.some((i) => ANSWERS.has(i)) || has("insist_wrong")) return out(has("insist_wrong") ? "recheck" : "grade", "an answer: classifier/key path");
  if (has("thinking_aloud")) return out("wait", "mid-thought: hold the floor for them, no verdict");
  // 6. steering: the child's request IS the plan for this turn
  if (has("game_request") || (has("boredom") && has("game_request"))) return out("play", "a real activity now", { studio: { kind: "game", source: "child_request" } });
  if (has("visual_request")) return out("show", "a visual on the stage now", { studio: { kind: "diagram", source: "child_request" } });
  if (has("animation_request")) return out("show", "a moving visual on the stage", { studio: { kind: "animation", source: "child_request" } });
  if (has("explain_differently")) return out("reteach", "a different representation", { representation: "new" });
  if (has("example")) return out("reteach", "a concrete example", { representation: "example" });
  if (has("story")) return out("reteach", "the idea as a story", { representation: "story" });
  if (has("easier") || (has("frustration") && has("easier"))) { s.level -= 1; return out("level", "easier: smaller step / easier item"); }
  if (has("harder")) { s.level += 1; return out("level", "harder: a challenge on the same idea"); }
  if (has("skip_ahead")) return out("pace_prove", "they know it: one quick check, then move on");
  if (has("skip_item")) return out("skip", "leave this one, no verdict");
  if (has("repeat")) return out("repeat", "say it again, shorter");
  if (has("clarify")) return out("rephrase", "explain what the question/word means");
  if (has("question_on_topic")) return out("answer_q", "answer their question, then back to the item");
  if (has("change_topic")) return out("offer_choice", "something else: ask what / offer two concrete options; never end");
  if (has("boredom")) return out("offer_choice", "bored: change something now (game / challenge / hook / choice)", { studio: { kind: "game", source: "engagement" } });
  if (has("method_instruction")) return out("adopt", "do it the way they asked (prefs persist)");
  if (has("frustration")) return out("hint", "empathy about the work + a smaller step");
  if (has("dont_know")) return out("hint", "a smaller step / hint rung");
  if (has("ask_for_answer")) return out("decline_nudge", "decline lightly + a nudge");
  if (has("identity")) return out("disclose", "say plainly she is an AI teacher");
  if (has("meta_feedback")) return out("adapt", "take it on board, change something");
  if (has("joke") || has("small_talk") || has("personal_share")) return out("uptake", "one light line of uptake, then back");
  if (has("noise")) return out("repair", "no-blame repair / choices");
  if (has("backchannel")) return out(s.itemOnTable ? "invite" : "continue", "no content: invite an answer / carry on");
  if (mods.lang || mods.pace) return out("repeat", "modifier only: re-say in the new language / pace");
  return out("continue", "nothing to change");
}

/** Loose topic match for "is this the parked thing again?" (word overlap). */
export function sameTopic(a, b) {
  const w = (t) => new Set(String(t).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((x) => x.length > 2));
  const A = w(a), B = w(b);
  for (const x of A) if (B.has(x)) return true;
  return false;
}

/**
 * Where a parked question comes back (CONVERSATION-V2 §5): after the item on the table resolves ("after this
 * question"), or at the last boundary before the wrap ("at the end"); unserved ones go to the child's Later list.
 * @returns {object|null} the parked entry to raise now
 */
export function dueParked(s, boundary) {
  const open = s.later.filter((p) => !p.servedAt);
  if (!open.length) return null;
  if (boundary === "item_resolved") return open.find((p) => p.promise === "after this question") ?? null;
  if (boundary === "before_wrap") return open[0];
  return null;
}
