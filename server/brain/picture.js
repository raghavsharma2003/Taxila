// dc-r7-script-walk-v6-10 P6 (main's director18 judgement: 9 contradictions, one mechanism): a picture turn is ONE call. Her picture
// line and the drawing came from two separate calls (heldAltOf wrote the line, heldBoard drew), and on 9 of 16 picture turns the
// draw kept the board with no view beside it while her line still described one. Here one call to Studio's heldBoard returns the
// drawing, the view and the line together; the line is built from the view actually returned, and with no view there is no line.
// Production's seam (preselectWhiteboard → preselectedAltLine) and the harness both take the picture through this one take.
import { heldBoard } from "../stagecraft/board-first.js";

const STRICT = () => !!process.env.NODE_TEST_CONTEXT;

/**
 * The picture turn's take: Studio's held board with its second view beside it, and the line said about that view.
 * `ask` is the whiteboard ask for the turn (whiteboardIntentOf); a picture turn always asks for its view ({ kind: "show" } when
 * nothing was named). → { take, board, view, line, layout }: `take` is Studio's heldBoard result (the page that is drawn, once),
 * `view`/`line` are null when no view was built (then she promises no picture), `layout` is the record's split field.
 */
export function heldPicture(ask, { keepRef = null, keepPage = null } = {}) {
  const none = { take: null, board: null, view: null, line: null, layout: null };
  try {
    if (!ask?.intent?.held?.board) return none;
    const request = ask.intent.request && ask.intent.request.kind !== "example" ? ask.intent.request : { kind: "show" };
    const a = { ...ask, intent: { ...ask.intent, request }, line: { ...(ask.line ?? {}), text: "" } };
    const take = heldBoard(a, { keepRef, keepPage });
    if (!take) return none;
    const view = take.split && take.altLine ? take.altView ?? "parts" : null;
    return { take, board: take.script ?? null, view, line: view ? String(take.altLine) : null, layout: take.layout ?? (take.split ? { split: true } : { split: false }) };
  } catch { return none; }
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
