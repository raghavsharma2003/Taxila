// The beat-by-beat board (round 4 content, v2 note "draws while she talks"; flag TAXILA_BEAT_BOARD, default off).
//
// SketchMind's strength is packaging, not a different mechanism (docs/research/round4/products/TEARDOWN.md): one idea per
// beat, typed cards, every topic opening on a picture, a "checkpoint ahead" chip and beats-done progress. Taxila already
// draws a board per beat in sync with her clauses (board-sync W6, continue boards within a beat); this file adds the
// packaging, from code only: each FRESH board (a new beat) gets a card { kind, n, checkpointAhead } on its script, and the
// stage draws its header (src/studio/StudioStage.tsx). Rules:
//   kind       contrast beat → example; recap / wrap / teach-back → takeaway; a board that is mostly working (numwork
//              rows, a column op) → steps; a single equation and little else → formula; else → picture
//   n          the board's beat number in this lesson (1-based); progress shows the beats done so far (no "of N": the
//              lesson's total comes with stream 4A's session plan, a patch request)
//   checkpoint after a steps / takeaway card the Director's next move is a check (practice / probe) by its own ladder;
//              the chip announces it. The check itself stays Taxila's covert, verified-key check (never a Yes/No card).
//   picture    a skill's first board prefers a picture candidate (preferPicture: the order of the code boards)
// Pure; never throws.
export const beatBoardOn = () => process.env.TAXILA_BEAT_BOARD === "1" || process.env.TAXILA_BEAT_BOARD === "on";
export const CARD_KINDS = Object.freeze(["picture", "formula", "steps", "example", "takeaway"]);
const STEPS_TEMPLATES = new Set(["column-op@1", "place-value@1"]);

/** The card kind of a board in a beat. */
export function cardKindOf({ beat = null, template = null, ops = [] } = {}) {
  const b = String(beat ?? "");
  if (b === "contrast") return "example";
  if (["recap", "wrap", "teachback", "reflect"].includes(b)) return "takeaway";
  if (STEPS_TEMPLATES.has(String(template ?? ""))) return "steps";
  const work = ops.filter((o) => o.op === "numwork");
  const shapes = ops.filter((o) => !["text", "label", "numwork", "highlight", "erase"].includes(o.op));
  const rows = work.reduce((n, o) => n + (Array.isArray(o.rows) ? o.rows.length : 0), 0);
  if (rows >= 3 || (b === "worked_example" && work.length >= 1 && shapes.length <= 2)) return "steps";
  if (work.length === 1 && shapes.length <= 1 && ops.filter((o) => o.op === "text").length <= 2) return "formula";
  return "picture";
}

/** Per lesson: beats seen with a fresh board, and the skills that already had a board. */
export function cardFor(L, ask, script, { template = null } = {}) {
  if (!L || !script) return null;
  const st = (L.beatBoard ??= { n: 0, skills: new Set(), last: null });
  const fresh = ask?.mode !== "continue";
  if (fresh) st.n++;
  const kind = cardKindOf({ beat: ask?.intent?.beat ?? null, template, ops: script.ops ?? [] });
  if (ask?.intent?.skillId) st.skills.add(ask.intent.skillId);
  const card = { kind, n: Math.max(1, st.n), checkpointAhead: kind === "steps" || kind === "takeaway" };
  st.last = card;
  return card;
}

/** Is this the skill's first board in the lesson (the beat that should open on a picture)? */
export const firstBoardOfSkill = (L, ask) => !!ask?.intent?.skillId && !(L?.beatBoard?.skills?.has(ask.intent.skillId));

/** Order code-board candidates so a picture comes first (stable otherwise). */
export function preferPicture(cands) {
  const rank = (c) => (cardKindOf({ template: c.template ?? null, ops: c.script?.ops ?? [] }) === "picture" ? 0 : 1);
  return [...cands].map((c, i) => ({ c, i })).sort((a, b) => rank(a.c) - rank(b.c) || a.i - b.i).map((x) => x.c);
}
