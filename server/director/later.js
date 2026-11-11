// round 7 A7 (PIPELINE §A Brain item 6: brain-later-list-visible + brain-parked-promise-tracking). The Later list the
// Director already keeps (s.later, conversation/policy.js parkEntry / pushLater / serveLater / dueParked) is shown on the
// screen as UiDirectives.later, and the conversational moment of the turn as UiDirectives.moment. A tap on a Later entry
// (chipId `later:<id>`) is the request to talk about it now. And a promise in HER OWN line ("baad mein cricket ki baat
// karenge") with nothing parked for it this turn adds an entry, so the promise is kept before the wrap. PURE.
import { LATER_MAX, parkEntry, pushLater, sameTopic } from "../conversation/policy.js";
import { unsafeChildPhrase } from "../conversation/screen.js";

/** How long a returned entry stays on the screen (turns) after it came back, so the child sees it was kept. */
export const RETURNED_SHOWN = 2;

/**
 * The Later list as the screen shows it (shared/contracts.ts LaterEntryUi): open entries, oldest first, `due` when it
 * comes back at the next boundary (after the item on the table, or before the wrap), `returned` for a few turns once
 * served. Never more than LATER_MAX. null when there is nothing to show (the client clears the list).
 * @returns {import("../../shared/contracts.ts").LaterEntryUi[] | null}
 */
export function laterUi(later = [], { turn = 0, wrapping = false, itemOnTable = false } = {}) {
  const rows = [];
  for (const p of later ?? []) {
    if (p.servedAt != null) {
      if (turn - p.servedAt <= RETURNED_SHOWN) rows.push({ id: p.id, text: p.topic, learning: !!p.learning, status: "returned", when: p.promise ?? "at_end" });
      continue;
    }
    const due = wrapping || (p.promise === "after_question" && !itemOnTable);
    rows.push({ id: p.id, text: p.topic, learning: !!p.learning, status: due ? "due" : "open", when: p.promise ?? "at_end" });
  }
  return rows.length ? rows.slice(-LATER_MAX * 2) : null;
}

/**
 * The turn's conversational moment (shared/contracts.ts UiMoment), from what the move did with the Later list:
 * a new entry parked → park; an entry served → returned (or detour when it was a push again); a declined ask → decline;
 * a stop check-in → stop_check. null: nothing conversational happened.
 * @returns {import("../../shared/contracts.ts").UiMoment | null}
 */
export function momentOf(before = [], after = [], move = {}, { turn = 0 } = {}) {
  if (move?.checkin === "stop") return { kind: "stop_check" };
  const req = move?.request ?? null;
  if (req === "decline") return { kind: "decline" };
  const known = new Set((before ?? []).map((p) => p.id));
  const added = (after ?? []).find((p) => !known.has(p.id) && p.servedAt == null);
  if (added) return { kind: "park", laterId: added.id, topic: added.topic };
  const served = (after ?? []).find((p) => p.servedAt === turn && (before ?? []).some((b) => b.id === p.id && b.servedAt == null));
  if (served) return { kind: req === "detour" || req === "park" ? "detour" : "returned", laterId: served.id, topic: served.topic };
  if (req === "detour") return { kind: "detour" };
  return null;
}

/** The entry a `later:<id>` tap names, if it is still open. */
export const tappedEntry = (later = [], id) => (later ?? []).find((p) => p.id === id && p.servedAt == null) ?? null;

// her own promise to come back to something: "baad mein … baat karenge", "end mein … dekhenge", "we'll talk about … later"
const PROMISE = /\b(baad\s+mein|baad\s+me|end\s+mein|aakhir\s+mein|lesson\s+ke\s+baad|thodi\s+der\s+(?:mein|baad)|later|at\s+the\s+end|after\s+this\s+(?:question|one))\b[^.!?।]{0,60}\b((?:baat\s+)?kar(?:enge|ein|te\s+hain)|bata(?:ungi|unga|enge|ti\s+hoon)|samjha(?:ungi|unga|enge|ti\s+hoon)|dekh(?:enge|te\s+hain)|talk\s+about|come\s+back|get\s+back|look\s+at)\b|\b(come\s+back\s+to|get\s+back\s+to|talk\s+about)\b[^.!?।]{0,60}\b(later|at\s+the\s+end|after\s+this)\b/i;
// round 7 (main's full-run judgement #8: "cricket" got "is baat ko yaad rakhenge" and never came back; "cricket examples
// banaungi" was promised and never kept): a promise to remember, or to make examples of their thing, is a promise too
const PROMISE_MORE = /\b(?:yaad\s+rakh(?:enge|ungi|unga|ti\s+hoon|ta\s+hoon)|(?:\p{L}+\s+){0,2}examples?\s+(?:banaungi|banaunga|banayenge|dungi|dunga|denge|launga|laungi|sunaungi|sunaunga)|I'?ll\s+remember|(?:I'?ll|we'?ll)\s+(?:make|do)\s+(?:a\s+|some\s+)?(?:\p{L}+\s+)?examples?)\b/iu;
/** Does her line promise to come back to something later? */
export const promisesLater = (text) => PROMISE.test(String(text ?? "")) || PROMISE_MORE.test(String(text ?? ""));

/**
 * Her own promise kept (brain-parked-promise-tracking): when her final line promises "later" and the Director parked
 * nothing on this turn, the child's topic is parked so it comes back before the wrap. The topic is the request's topic,
 * else the child's words (≤ 60 characters), screened in code like every parked topic. Never on a safeguard turn, never a
 * duplicate of an open entry. PURE → the new list (the same list when nothing is added).
 */
export function keepPromise(later = [], { reply, turn, topic, childText, itemOnTable = false, safeguard = false } = {}) {
  if (safeguard || !promisesLater(reply)) return later ?? [];
  if ((later ?? []).some((p) => p.at === turn)) return later; // the Director parked on this turn already
  const t = String(topic || childText || "").replace(/\s+/g, " ").trim().slice(0, 60);
  if (!t || unsafeChildPhrase(t)) return later ?? [];
  if ((later ?? []).some((p) => p.servedAt == null && sameTopic(p.topic, t))) return later;
  return pushLater(later ?? [], { ...parkEntry({ topic: t, learning: true, turn, itemOnTable }), fromHer: true });
}
