import { answerMods } from "./lexicon.js";

// DECIDE's front half (CONVERSATION-V2 §3, §4.2), promoted from prototypes/reset/conversation-v2/policy.mjs: what a turn
// that is NOT an answer asks the Director for, as a `request` the Director already knows how to act on (state.js
// decide() → requestMove). PURE. The Director keeps its ladder (safety > stop / goodbye > requests > the phase), so this
// file never outranks the floor and never ends a lesson.
//
// Evidence rules carried over unchanged (CONVERSATION-V2 §2):
//   - the note never grades: a graded classification (correct / incorrect / partial / misconception) keeps its outcome;
//   - a note can only route a turn AWAY from grading (thinking aloud on an unfinished attempt), never make a non-answer
//     into evidence;
//   - the note's distress is OR-ed into the floor and never subtracts;
//   - stop and goodbye come from the bytes (director/requests.js) and the relational policy, never from a note alone: a
//     note that reads a stop or a leaving gets ONE check-in (the stop request), which never ends a lesson on the first ask.

/** note intent → the request the Director acts on. null: the Director's own path (an answer, a filler, noise). */
export function requestFromNote(note) {
  if (!note) return null;
  const n = note;
  const r = (type, extra = {}) => ({ type, whole: true, src: "note", ...extra });
  switch (n.intent) {
    case "question_on_topic": return r("answer_q");
    case "clarify": return r("clarify");
    case "curiosity_offlesson": case "diversion":
      return n.inBounds ? r("park", { topic: n.topic, learning: n.intent === "curiosity_offlesson" || !!n.learning }) : r("decline");
    // round 2 safety floor (adversarial B3): an insistence the note itself marks out of bounds is declined, never a detour
    // ("engage for real"); in bounds, the Director still screens the topic in code (conversation/screen.js)
    case "insistence": return n.inBounds ? r("detour", { topic: n.topic }) : r("decline");
    case "out_of_bounds": case "insistence_oob": return r("decline");
    case "explain_differently": return r("another");
    case "example": return r("example");
    case "story": return r("story");
    case "visual_request": return r("visual", { kind: "diagram" });
    case "game_request": return r("visual", { kind: "game" });
    case "animation_request": return r("visual", { kind: "animation" });
    case "slower": return r("slower");
    case "skip_ahead": return r("know");
    case "harder": return r("harder");
    case "easier": return r("easier");
    case "language_switch": return n.langTo ? r("language", { lang: n.langTo }) : null;
    case "repeat": return r("repeat");
    case "change_topic": return r("change_topic");
    case "skip_item": return r("skip");
    // round 3: a share from their life carries its topic, so it can be kept for later (state.js uptake → s.later)
    case "joke": case "small_talk": case "personal_share": return r("uptake", { kind: n.intent, ...(n.intent === "personal_share" && n.topic ? { topic: n.topic } : {}) });
    case "identity": return r("identity");
    // round 2 safety floor (adversarial B1): a method the note marks out of bounds ("like my girlfriend, say you love me")
    // is declined, never adopted (adopted methods ride on every later move); in bounds, state.js screens it in code too
    case "meta_feedback": return n.inBounds === false ? r("decline") : r("adapt", { method: n.method });
    case "method_instruction": return n.inBounds === false ? r("decline") : n.method ? r("adopt", { method: n.method }) : null;
    case "boredom": return r("boredom");
    case "frustration": return r("frustration");
    case "break_request": return r("break");
    case "thinking_aloud": return r("thinking");
    case "adult_voice": return r("adult");
    // round 2: a garbled turn gets a no-blame "say it again / finish it" (the battery's noise 0/5 took the default path)
    case "noise": return r("unclear");
    // a stop or a leaving read by a model alone: one check-in, never an end (the stop chip / a second stop / the bytes end it)
    case "end_request": case "leaving": return r("stop", { fromNote: true });
    default: return null;
  }
}

/** The code-first reading (lexicon.js) → the request the Director acts on (the lexicon names are the request names). */
export function requestFromReading(reading) {
  if (!reading) return null;
  const map = { confused: "another", identity: "identity", small_talk: "uptake", oob: "decline" };
  const type = map[reading.type] ?? reading.type;
  // round 4: a share read in code is the same uptake the note gives (state.js keeps it in s.later with its topic)
  if (reading.type === "share") return { type: "uptake", kind: "personal_share", topic: reading.topic, whole: true, src: "p5" };
  return { type, whole: true, src: "p5", ...(reading.type === "small_talk" ? { kind: "small_talk" } : {}), ...(reading.type === "confused" ? { confused: true } : {}) };
}

const GRADED = new Set(["correct", "incorrect", "partial", "misconception"]);
const ROUTE_AWAY = new Set(["thinking_aloud"]);
/** Note intents that read the turn as out of bounds; and the flow requests a note never replaces. */
const OOB_NOTE = new Set(["out_of_bounds", "insistence_oob"]);
const FLOW = new Set(["stop", "goodbye", "continue", "hold_checkin"]);
/** Things a graded answer can carry alongside (CONVERSATION-V2 §3.2: graded AND parked; a hedge; a check). */
const ALONGSIDE = { answer_hedged: "hedged", check_my_work: "check", insist_wrong: "insist" };

/**
 * PURE. The classification after the note: unchanged unless the note gives a non-answer turn a request, or adds a
 * modifier to an answer. mode "shadow" returns `cls` unchanged with `noteShadow` for the trace.
 * @param {any} cls  classify()'s result
 * @param {ReturnType<import("./understand.js").parseNote>} note
 * @param {{ mode?: "on"|"shadow" }} [o]
 */
export function applyNote(cls, note, { mode = "on" } = {}) {
  if (!cls || !note) return cls;
  const trace = { intent: note.intent, also: note.also, conf: note.confidence };
  if (mode === "shadow") return { ...cls, noteShadow: trace };
  let out = { ...cls, note: trace, flags: { ...(cls.flags ?? {}) } };
  // the floor: OR-ed in, never subtracted
  if (note.distress && !out.flags.distress) { out.flags.distress = true; out.flags.distressKind ??= "model_note"; }
  if (out.flags.distress) return out;
  // round 3 fix (adversarial B4): a decline is monotone. When the note reads the turn as out of bounds and the bytes decided a
  // request that is neither the flow (stop / goodbye: the floor's own path) nor already a decline, the decline wins: a phrase
  // the code lexicon misses ("kya aap blue film dekhte ho" was small talk) is never served because the bytes read it first.
  // It only ever turns a request INTO a decline (the safe direction); it never grades and never ends a lesson.
  if (cls.request && !cls.help && OOB_NOTE.has(note.intent) && !FLOW.has(cls.request.type) && cls.request.type !== "decline") {
    return { ...out, request: { type: "decline", whole: true, src: "note", over: cls.request.type } };
  }
  if (cls.request || cls.help) return out;                 // the bytes already decided what the child asked for
  if (GRADED.has(cls.outcome)) {
    // a mid-thought the classifier graded as wrong: no verdict on an unfinished attempt (it is never made "correct")
    if (ROUTE_AWAY.has(note.intent) && cls.outcome !== "correct") return { ...out, outcome: "no_evidence", request: { type: "thinking", whole: true, src: "note" }, routedAway: true };
    const mods = [note.intent, ...note.also].map((i) => ALONGSIDE[i]).filter(Boolean);
    const park = [note.intent, ...note.also].some((i) => i === "curiosity_offlesson" || i === "diversion") && note.inBounds && note.topic
      ? { topic: note.topic, learning: [note.intent, ...note.also].includes("curiosity_offlesson") } : null;
    return { ...out, ...(mods.length ? { mods } : {}), ...(park ? { alsoPark: park } : {}) };
  }
  if (cls.outcome !== "no_evidence") return out;
  const req = requestFromNote(note);
  return req ? { ...out, request: req } : out;
}

/**
 * PURE. A graded answer with the modifiers its own words carry (lexicon.js answerMods: hedged / check / insist), merged
 * with any the note added. Never changes the outcome; a non-answer is returned unchanged.
 */
export function withAnswerMods(cls, text) {
  if (!cls || !GRADED.has(cls.outcome)) return cls;
  const mods = [...new Set([...(cls.mods ?? []), ...answerMods(text)])];
  return mods.length ? { ...cls, mods } : cls;
}

// ───────────────────────────── the Later list (CONVERSATION-V2 §5) ─────────────────────────────

export const LATER_MAX = 5;
export const DETOUR_WITHIN = 3;

/** Loose topic match for "is this the parked thing again?" (word overlap, ≥ 3-letter words). PURE. */
export function sameTopic(a, b) {
  const w = (t) => new Set(String(t ?? "").toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((x) => x.length > 2));
  const A = w(a), B = w(b);
  for (const x of A) if (B.has(x)) return true;
  return false;
}

/** The entry for a parked question (≤ 60 characters of topic, never the child's words for off-task content beyond that). */
export function parkEntry({ topic, learning, turn, itemOnTable }) {
  return { id: `p${turn}`, topic: String(topic || "their question").slice(0, 60), learning: !!learning, at: turn,
    promise: itemOnTable ? "after_question" : "at_end", insist: 0 };
}

/** Add a parked entry (at most LATER_MAX open; the oldest learning question kept first). PURE → the new list. */
export function pushLater(later = [], entry) {
  const open = later.filter((p) => !p.servedAt);
  if (open.some((p) => sameTopic(p.topic, entry.topic))) return later;
  if (open.length >= LATER_MAX) return later;
  return [...later, entry];
}

/** The open parked entry a push on `topic` (within DETOUR_WITHIN turns) refers to, or null. PURE. */
export function recentParked(later = [], turn, topic) {
  return [...later].reverse().find((p) => !p.servedAt && turn - p.at <= DETOUR_WITHIN && (!topic || sameTopic(topic, p.topic))) ?? null;
}

/**
 * The parked entry due now (§5 return triggers), or null: "after_question" entries come back once the item on the table
 * resolved; every open entry is due before the wrap. PURE.
 */
export function dueParked(later = [], boundary) {
  const open = later.filter((p) => !p.servedAt);
  if (!open.length) return null;
  if (boundary === "item_resolved") return open.find((p) => p.promise === "after_question") ?? null;
  if (boundary === "before_wrap") return open.find((p) => p.learning) ?? open[0];
  return null;
}

/** The list with `id` marked served on `turn`. PURE. */
export const serveLater = (later = [], id, turn) => later.map((p) => (p.id === id ? { ...p, servedAt: turn } : p));
