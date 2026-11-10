// dc-r7-script-walk-v6-10 P6 (main's director18 judgement: 9 contradictions, one mechanism): a picture turn is ONE call. Her picture
// line and the drawing came from two separate calls (heldAltOf wrote the line, heldBoard drew), and on 9 of 16 picture turns the
// draw kept the board with no view beside it while her line still described one. Here one call to Studio's heldBoard returns the
// drawing, the view and the line together; the line is built from the view actually returned, and with no view there is no line.
// Production's seam (preselectWhiteboard → preselectedAltLine) and the harness both take the picture through this one take.
import { pictureTurn } from "../stagecraft/board-first.js";

const STRICT = () => !!process.env.NODE_TEST_CONTEXT;

/**
 * The picture turn decided ONCE (Studio's pictureTurn, claude/r4-content 2df8cf702): the held board, its view and the line said
 * about that view, together. → { decision, view, line, layout }: `decision` is passed as heldBoard's `picture` at the take, so the
 * drawing is exactly what was decided; `view`/`line` are null when no view could be built (then she promises no picture).
 */
export function heldPicture(ask, { keepRef = null, keepPage = null } = {}) {
  try {
    if (!ask?.intent?.held?.board) return { decision: null, view: null, line: null, layout: null };
    const pt = pictureTurn(ask, { keepRef, keepPage });
    const view = pt?.view && pt.line ? pt.view.view ?? "parts" : null;
    return { decision: pt ?? null, view, line: view ? String(pt.line) : null, layout: pt?.layout ?? null };
  } catch { return { decision: null, view: null, line: null, layout: null }; }
}

/**
 * P6's predicate: a picture line is never spoken on a turn whose take has no view. `parts` is her line's parts list
 * (guard.parts.list), `picture` the turn's take (heldPicture) or its record ({ view, layout }). Throws under node:test; → the flag
 * (or null) elsewhere, for the harness's count.
 */
export function pictureTruth(parts, picture) {
  const spoke = (parts ?? []).some((p) => p?.part === "alt");
  const view = !!picture?.view || !!picture?.layout?.split;
  if (!spoke || view) return null;
  const flag = { why: "a picture line spoken on a turn with no view drawn" };
  if (STRICT()) throw new Error(`P6: ${flag.why}`);
  return flag;
}

/** The same predicate over a recorded teacher row (director18's records): its picture part against the row's held record. */
export function pictureRowFlag(row) {
  const spoke = (row?.pageParts ?? []).some((p) => p?.part === "alt");
  if (!spoke) return null;
  const H = row?.held ?? null;
  const view = !!H?.layout?.split || (H?.pages ?? []).some((g) => g.beside) || (!!H && H.drawn === "held" && !!row?.screen?.altView);
  return view ? null : { why: "a picture line spoken on a turn with no view drawn", drawn: H?.drawn ?? null };
}
