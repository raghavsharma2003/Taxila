// The Teacher agent's hands on the screen (AGENT.md §1 tools): stream 2's board and picture tools (server/studio/tools.js),
// which return ScreenTruth — what ACTUALLY mounted after the one whiteboard / tray gate — and nothing else is what she may
// say is on the screen. A picture is a background job: its content_ready / content_failed arrives between turns and is
// handed to her as part of the next event, never assumed.
import { boardShow, boardClear, screenNow, pictureGet } from "../studio/tools.js";
import { slotSnapshot } from "../studio/seam.js";

const KINDS = new Set(["write", "number_line", "table", "shapes", "work", "draw"]);
const pending = new Map();   // lessonId → content events not yet told to her
const say = (lessonId, e) => { const q = pending.get(lessonId) ?? []; q.push(e); pending.set(lessonId, q.slice(-6)); if (pending.size > 2000) pending.delete(pending.keys().next().value); };

/** The spec the agent asked for, as stream 2's board.show takes it, or null. PURE. */
export function specOf(board) {
  const k = board?.kind;
  if (!KINDS.has(k)) return null;
  const list = (x) => (Array.isArray(x) ? x.map((s) => String(s ?? "")).filter(Boolean) : []);
  if (k === "write") return list(board.lines).length ? { kind: k, lines: list(board.lines) } : null;
  if (k === "number_line") return list(board.mark).length ? { kind: k, mark: list(board.mark) } : null;
  if (k === "table") return list(board.columns).length ? { kind: k, columns: list(board.columns), rows: (board.rows ?? []).map(list) } : null;
  if (k === "work") return board.layout && (board.rows ?? []).length ? { kind: k, layout: board.layout, rows: (board.rows ?? []).map(list) } : null;
  if (k === "shapes") return (board.shapes ?? []).length ? { kind: k, shapes: board.shapes.map((s) => ({ shape: s.shape, ...(s.sides ? { sides: s.sides } : {}), ...(s.parts ? { parts: s.parts } : {}),
    ...(s.shaded ? { shaded: s.shaded } : {}), ...(s.label ? { label: s.label } : {}) })) } : null;
  if (k === "draw") return board.subject ? { kind: k, subject: String(board.subject), labels: list(board.lines) } : null;
  return null;
}

/** The real tools (tests pass their own). */
export const screenTools = {
  now: (lessonId) => screenNow(lessonId),
  show: (lessonId, spec, o) => boardShow(lessonId, spec, { ...o, timeoutMs: spec.kind === "draw" ? 4500 : 2500 }),
  clear: (lessonId) => boardClear(lessonId),
  picture: (lessonId, subject) => pictureGet(lessonId, subject, { onEvent: (e) => say(lessonId, e) }),
  slot: (lessonId, pageId) => (pageId ? slotSnapshot(lessonId, pageId) : null),
  /** content events since her last turn, as event text; drained */
  news: (lessonId) => {
    const q = pending.get(lessonId) ?? [];
    pending.delete(lessonId);
    return q.map((e) => (e.type === "content_ready" ? `content_ready: ${e.truth?.words ?? "the picture is now on the screen"}` : `content_failed: the picture could not be shown (${String(e.why ?? "").slice(0, 60)})`));
  },
};
export const _pushContentEvent = say;
