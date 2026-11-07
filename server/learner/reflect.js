// "What helped?" (round 7 F, for E App's app-debrief-made-later; STUDENT-FLOW §8.2). After a lesson in which at least
// two supports were used, an older child may tap ONE chip: a made-for piece from that lesson, the drawing (board), her
// explanation, trying it myself, or not sure. It is recorded as the child's CHOICE (Conductor event child.reflect,
// first tap per lesson wins) and folded into a small count in the Conductor state. It may move the next COMPARABLE
// choice inside the set that is already admissible; it is never an effect claim, never a learning style, and never
// shown to parents (no report, teaching page or notes line reads it).
//
//   parseChoice(choice)                          "made:<id>" | board | explain | self | unsure → { kind, id? } | null
//   foldReflect(s, ev)                           decide.js's child.reflect handler: s.adapt.helped { n, recent }
//   helpedLean(helped)                           PURE: a kind the child picked at least twice of the last 5 (not unsure), else null

export const KINDS = Object.freeze(["made", "board", "explain", "self", "unsure"]);
export const RECENT = 5, LEAN_MIN = 2;
const MADE = /^made:([A-Za-z0-9_.:@\-]{1,90})$/;

/** PURE. The choice's kind (and the made-for id), or null when it is not one of the five. */
export function parseChoice(choice) {
  if (typeof choice !== "string") return null;
  const m = MADE.exec(choice);
  if (m) return { kind: "made", id: m[1] };
  return ["board", "explain", "self", "unsure"].includes(choice) ? { kind: choice } : null;
}

/** decide.js handler body: count the kind and keep the last RECENT { lessonId, kind } (no ids of made pieces kept). */
export function foldReflect(s, ev) {
  const c = parseChoice(ev.choice);
  if (!c) return;
  s.adapt ??= {};
  const h = s.adapt.helped ?? { n: {}, recent: [] };
  h.n[c.kind] = (h.n[c.kind] ?? 0) + 1;
  h.recent = [...h.recent.filter((r) => r.lessonId !== ev.lessonId), { lessonId: ev.lessonId, kind: c.kind }].slice(-RECENT);
  s.adapt.helped = h;
}

/** PURE. The kind the child chose at least LEAN_MIN times among the last RECENT taps (ties → none), else null. */
export function helpedLean(helped) {
  const cnt = {};
  for (const r of helped?.recent ?? []) if (r.kind !== "unsure") cnt[r.kind] = (cnt[r.kind] ?? 0) + 1;
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]);
  if (!top.length || top[0][1] < LEAN_MIN || (top[1] && top[1][1] === top[0][1])) return null;
  return top[0][0];
}
