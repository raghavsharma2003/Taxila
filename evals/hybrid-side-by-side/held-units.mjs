// v6.8 H5 (main's dc-r7-held-board, director16 judgement): the held-board counter. On every teacher turn — single-page turns too —
// each SPOKEN part's unit is checked against the board the child saw while it was said (the take: the row's screen, else its
// pages), and a picture part's words against the view Studio drew. A unit is point+ask, worked+yourStep, remediation+then-card,
// bridge+next first card (a hook, a check: their own). Pure; reads a recorded row and the run's own lesson script.
// Fixture: director16's 8 rows (a: a close said over the next card's board — c4 steady 46, offtopic 46, c6 offtopic 36; b: a
// yourStep's simpler said over another beat's board — c4 steady 36, offtopic 34, c5-t02 offtopic 32; c: "yahi numbers ab patti
// par" over a view with no numbers, or over a view of numbers that were not up — c4 steady 18, c5-t02 stuck 18).

const said = (x) => (x && typeof x === "object" ? x.hi ?? x.en ?? "" : String(x ?? ""));
const key = (b) => (b ? JSON.stringify(b) : "");

/** The unit of a part's beat as the harness records it ("e2", "explain:e2", "worked", "worked:step1", "then:<t>", "rem:<t>", "c1"). */
export function unitOfBeat(beat) {
  const b = String(beat ?? "").replace(/^explain:/, "");
  if (!b) return null;
  if (/^worked(?::|$)/.test(b)) return "worked";
  const m = /^(?:then|rem):(.+)$/.exec(b);
  if (m) return `rem:${m[1]}`;
  return b;
}

/** Every unit whose own board this is (a board may be shared: an ask on its beat's board), from the lesson script. */
export function unitsOfBoard(script, board) {
  const k = key(board);
  const out = new Set();
  if (!k) return out;
  for (const sk of script?.skills ?? []) {
    for (const b of sk.explain ?? []) { if (key(b.board) === k || key(b.ask?.board) === k) out.add(b.id); }
    const we = sk.workedExample;
    if (we && (key(we.board) === k || key(we.yourStep?.board) === k)) out.add("worked");
    for (const c of sk.checks ?? []) if (key(c.board) === k) out.add(c.id);
    for (const r of sk.remediation ?? []) if (key(r.board) === k || key(r.then?.board) === k) out.add(`rem:${r.targets}`);
    if (key(sk.hook?.board) === k) out.add("hook");
    if (key(sk.bridgeBoard) === k) out.add("bridge");
  }
  return out;
}

const GENERIC_ALT = /\b(?:yahi|wahi)\s+numbers\b|\bthe same numbers\b/i;

/** The unit a row's own beat names ("s1:explain:e4" → e4, "s1:check:then:<t>" → rem:<t>, "s1:worked:worked:step1" → worked). */
export const unitOfRowBeat = (beat) => unitOfBeat(String(beat ?? "").split(":").slice(2).join(":") || String(beat ?? "").split(":").at(-1));

/**
 * The H5 flags of one recorded teacher row: [{ part, from, unit, page, why }]. `prev` is the teacher row before it (the board up
 * when this turn began), for a picture part that says "the same numbers".
 * - an unsaid card on screen: the row's card is pinned and not one word of it is spoken;
 * - a spoken part (a close, the teaching, the card) whose unit is not the unit of the page it is said over — the page's own beat
 *   (a paged turn), else the turn's beat (one page);
 * - a picture part that says "yahi numbers" over a view that shows none of the card's numbers, or whose numbers were not the
 *   board up before it.
 */
export function heldFlags(row, script, prev = null) {
  const parts = row?.pageParts ?? [];
  const text = String(row?.text ?? "");
  const flags = [];
  const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim().toLowerCase();
  if (row?.card && !norm(text).includes(norm(row.card).slice(0, 30))) flags.push({ part: "card", from: null, why: "an unsaid card on screen" });
  if (!parts.length) return flags;
  // (a held run records its held unit and switch: those are the pages; units are compared without the skill prefix)
  const loc = (u) => (u ? String(u).replace(/^[^:]*-s\d+:/, "") : null);
  const H = row.held ?? null;
  const pages = H ? [{ from: 0, unit: unitOfBeat(loc(H.unit)) }, ...(H.switchTo ? [{ from: H.switchTo.atChar, unit: unitOfBeat(loc(H.switchTo.unit)) }] : H.unitAfter ? [{ from: H.unitAfter.atChar, unit: unitOfBeat(loc(H.unitAfter.unit)) }] : [])]
    : row.segments?.length ? row.segments.map((s) => ({ from: s.from ?? 0, unit: unitOfBeat(s.beat), board: s.board ?? null }))
    : [{ from: 0, unit: unitOfRowBeat(row.beat), board: row.screen?.boardRef ?? row.boardRef ?? null }];
  parts.forEach((p, i) => {
    const end = parts[i + 1]?.from ?? text.length;
    const words = text.slice(p.from ?? 0, end).trim();
    if (!words || p.part === "aside") return;
    const page = [...pages].reverse().find((g) => (g.from ?? 0) <= (p.from ?? 0)) ?? pages[0];
    if (p.part === "alt") {
      if (!GENERIC_ALT.test(words)) return;
      const nums = (row.screen?.numbers ?? []).filter((n) => !/^[01]$/.test(String(n)));
      const prevB = prev?.screen?.boardRef ?? prev?.boardRef ?? null;
      if (!nums.length && (!row.screen?.counts?.lines?.length || key(prevB) !== key(page.board))) flags.push({ part: p.part, from: p.from, why: "a picture line says 'the same numbers' over a view of no number that was up" });
      return;
    }
    const unit = unitOfBeat(p.beat);
    if (!unit || !page.unit) return;
    if (unit !== page.unit) flags.push({ part: p.part, from: p.from, unit, page: page.unit, why: "a spoken part's unit is not its page's" });
  });
  return flags;
}

/** H5 over a recorded lesson: [{ row, flags }] for each flagged teacher row. */
export function heldCount(rows, script) {
  const out = [];
  let prev = null;
  rows.forEach((r, i) => {
    if (r.who !== "teacher") return;
    const f = heldFlags(r, script, prev);
    if (f.length) out.push({ row: i, flags: f });
    prev = r;
  });
  return out;
}
export { said };
