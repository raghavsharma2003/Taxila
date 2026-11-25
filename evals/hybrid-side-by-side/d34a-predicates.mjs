// to-brain 051 C1 and C2 (docs/patches/to-brain/051-director33-screen-stays-answer-boards-named-miss-cap.md): the predicates they add, each
// pinned on its director33 rows (tests/r8-director33-051a.test.mjs, replayed with that run's own script snapshot) before it reads the dry matrix.
//   noPictureThenBoard  a page change on a turn that says a joints.noPicture form (the board on screen at the turn's start stays)
//   viewSameAsBoard     a `view` picture whose drawn board equals the held board (or the board on screen): nothing new drawn
//   stepSaidOverPosing  a worked step with a `resultBoard` whose `right` or `told` is said with the posing board still up
import { drawnPagesOf } from "./drawn-pages.mjs";
import { sameBoardRef, viewBoardOf } from "../../server/director/state.js";

const low = (t) => String(t ?? "").replace(/\s+/g, " ").trim().toLowerCase();
const key = (t) => low(t).replace(/\{\w+\}/g, " ").replace(/[^\p{L}\p{N}\s]+/gu, " ").replace(/\s+/g, " ").trim();
/** The board on screen when row r's turn starts: the last page her turn before drew. */
const upAt = (ctx) => drawnPagesOf(ctx?.prevT).at(-1)?.board ?? ctx?.prevT?.screen?.boardRef ?? null;
/** Whether a row says one of the script's joints.noPicture forms. */
function saysNoPicture(r, script) {
  if ((r.seams ?? []).some((x) => x.joint === "noPicture" || x.right === "noPicture")) return true;
  const forms = (script?.joints?.noPicture ?? []).flatMap((f) => [f?.hi ?? (typeof f === "string" ? f : null), f?.en]).filter(Boolean).map(key).filter((k) => k.split(" ").length >= 3);
  const T = key(r.text);
  return forms.some((f) => T.includes(f));
}
/** The script's worked steps that carry a `resultBoard`: [{ skillId, n, step }]. */
function resultSteps(script) {
  const out = [];
  for (const sk of script?.skills ?? []) (sk.workedExample?.steps ?? []).forEach((st, n) => { if (st?.resultBoard?.template) out.push({ skillId: sk.skillId, n, step: st }); });
  return out;
}
const forms = (v) => (Array.isArray(v) ? v : [v]).flatMap((f) => [f?.hi ?? (typeof f === "string" ? f : null), f?.en]).filter(Boolean);
const sentences = (t) => String(t ?? "").split(/(?<=[.!?])\s+/).map(key).filter((k) => k.split(" ").length >= 3);

export const D34A_PREDICATES = {
  /** C1: on a picture request with nothing left to draw the board on screen at the turn's start stays for the whole turn — no page change
   *  on a turn that says a noPicture form (director33 steering 16 in c4-ch05-t01, c5-ch02-t01, c5-ch02-t02, c6-ch06-t01, c4-ch06-t01). Gated. */
  noPictureThenBoard(L, r, i, ctx) {
    if (r.who !== "teacher" || !saysNoPicture(r, ctx?.script)) return null;
    const pages = drawnPagesOf(r).filter((p) => p.board?.template);
    const up = upAt(ctx);
    const first = up ?? pages[0]?.board ?? null;
    // (to-brain 054 A, main's ruling on the dry steering c4-ch06-t01 16: a card asked in a no-picture turn is said over its own board — its page
    // goes up at the card's first word; the line and the help in words stay over the board up, as C1 says)
    const cardAt = (r.pageParts ?? []).find((p) => p.part === "card")?.from;
    const moved = pages.find((p) => !sameBoardRef(p.board, first) && !(cardAt != null && cardAt > 0 && p.from === cardAt));
    return moved ? `a page change to ${moved.board.template} at char ${moved.from ?? 0} on a no-picture turn` : null;
  },
  /** C1: a second view that would draw the board already on screen is spent — a `view` picture whose drawn board equals the held board, or
   *  the board up (director33 c6-ch07-t01 steering 16: the "scale" view of a compare board already drawn to scale). Gated. */
  viewSameAsBoard(L, r, i, ctx) {
    if (r.who !== "teacher" || !r.held?.picture?.view) return null;
    const held = r.screen?.boardRef ?? r.boardRef ?? null;
    const v = viewBoardOf(held);
    if (!v) return null;
    if (sameBoardRef(v, held)) return `the ${r.held.picture.view} view of ${held.template} draws the held board itself`;
    return sameBoardRef(v, upAt(ctx)) ? `the ${r.held.picture.view} view of ${held.template} draws the board already on screen` : null;
  },
  /** C2: a worked step with a `resultBoard`, confirmed (`ask.right`) or told (`told`), is said over that board from its first word — never
   *  with the posing board still up. Reads 0 on scripts with no resultBoard. Gated. */
  stepSaidOverPosing(L, r, i, ctx) {
    if (r.who !== "teacher") return null;
    const T = key(r.text);
    for (const { n, step } of resultSteps(ctx?.script)) {
      const lines = [...forms(step.ask?.right), ...forms(step.told)].flatMap(sentences);
      const hit = lines.find((k) => T.includes(k));
      if (!hit) continue;
      const at = T.indexOf(hit);
      // (the page up where that line starts, by characters of the row's text: the page whose `from` is at or before it)
      const raw = low(r.text), first = hit.split(" ")[0];
      const ch = Math.max(0, raw.indexOf(first, Math.floor(at * 0.8)));
      const pages = drawnPagesOf(r);
      const on = [...pages].reverse().find((p) => (p.from ?? 0) <= ch + 1)?.board ?? upAt(ctx);
      if (!sameBoardRef(on, step.resultBoard)) return `step ${n + 1}'s ${forms(step.told).some((x) => sentences(x).includes(hit)) ? "told" : "right"} line said over ${on?.template ?? "no board"}, not its resultBoard`;
    }
    return null;
  },
};
