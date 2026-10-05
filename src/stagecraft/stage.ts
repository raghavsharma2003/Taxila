// The device side of a Stagecraft reveal (STAGECRAFT.md §4.3, DESIGN-V3 §6.8-§6.9): a pure state machine for the stage's
// two layers. No DOM here (controller.ts adapts it), so the zero-visible-failure laws are testable in plain Node.
//
// Laws (each is checked by tests/stagecraft-client.test.mjs over random event streams):
//   S1 never empty: the stage always paints something; before any piece it is the calm board, and a retire returns there
//   S2 never a loading state: an incoming piece mounts UNDER the outgoing one, invisible, and only crossfades in (420 ms)
//      once it has painted its first frame; there is no "loading", "being made", spinner or error layer type at all
//   S3 a failed mount keeps her words true: the incoming (or showing) piece is replaced by its board twin, built from
//      the SAME values; the board renderer needs only a 2D canvas, so it always paints
//   S4 latest command wins: a newer reveal while one is mounting replaces the pending one (the outgoing keeps showing)
//   S5 one piece at a time: at most two layers exist, and only during a crossfade
export const CROSSFADE_MS = 420;

/** What a layer can draw. There is deliberately no "loading" or "error" kind (S2). */
export type LayerKind = "engine" | "frame" | "image" | "board";
export interface BoardLike { title: string; lines: string[]; figure?: { kind: string; [k: string]: unknown } }
export interface StageItem {
  id: string;
  kind: LayerKind;
  archetype: string;
  spec?: unknown;
  src?: string;
  /** The board twin: the same idea with the same values (L7). Every item carries one. */
  board: BoardLike;
}
export interface StageEvent { at: number; e: "command" | "painted" | "failed" | "fade_done" | "retire" | "dropped"; id: string; kind?: LayerKind }
export interface StageState {
  showing: StageItem;
  incoming: StageItem | null;
  phase: "steady" | "mounting" | "fading";
  fadeStart: number;
  log: StageEvent[];
}
export interface LayerView { item: StageItem; opacity: number; visible: boolean }

export const CALM_BOARD: StageItem = Object.freeze({ id: "calm", kind: "board", archetype: "whiteboard", board: { title: "", lines: [] } }) as StageItem;
const twinOf = (it: StageItem): StageItem => ({ id: `${it.id}#board`, kind: "board", archetype: "whiteboard", board: it.board ?? { title: "", lines: [] } });
const push = (s: StageState, ev: StageEvent): StageState => ({ ...s, log: s.log.length < 2000 ? [...s.log, ev] : s.log });

export function initStage(): StageState { return { showing: CALM_BOARD, incoming: null, phase: "steady", fadeStart: 0, log: [] }; }

/** A reveal command arrives (fired by reveal.ts at the cue time). The new item mounts invisibly under the outgoing one. */
export function command(s: StageState, item: StageItem, at: number): StageState {
  if (s.showing.id === item.id) {                                          // already on stage: keep it, drop anything pending
    if (!s.incoming) return s;
    return push({ ...s, incoming: null, phase: "steady" }, { at, e: "dropped", id: s.incoming.id });
  }
  let next = s;
  if (s.incoming) next = push(next, { at, e: "dropped", id: s.incoming.id });   // S4: the pending one is superseded
  if (s.phase === "fading" && s.incoming) next = { ...next, showing: s.incoming };   // a fade in progress completes instantly
  if (next.showing.id === item.id) return { ...next, incoming: null, phase: "steady" };
  return push({ ...next, incoming: item, phase: "mounting" }, { at, e: "command", id: item.id, kind: item.kind });
}
/** The incoming item painted its first frame: the crossfade starts. */
export function painted(s: StageState, id: string, at: number): StageState {
  if (!s.incoming || s.incoming.id !== id || s.phase !== "mounting") return s;
  return push({ ...s, phase: "fading", fadeStart: at }, { at, e: "painted", id });
}
/** A mount failed (or the engine stopped): its board twin with the same values takes its place (S3). */
export function failed(s: StageState, id: string, at: number): StageState {
  if (s.incoming && s.incoming.id === id) {
    const twin = twinOf(s.incoming);
    if (twin.id === s.showing.id) return push({ ...s, incoming: null, phase: "steady" }, { at, e: "failed", id });   // its twin is already showing
    return push({ ...s, incoming: twin, phase: "mounting" }, { at, e: "failed", id });
  }
  // REVIEW 2026-10-05: the showing piece died while the next one mounts: the next one is what her line names, so it is
  // kept (it replaces the dead piece as soon as it paints; the host already crossfaded the dead engine to its own board)
  if (s.showing.id === id && s.incoming) return push(s, { at, e: "failed", id });
  if (s.showing.id === id && s.showing.kind !== "board") return push({ ...s, incoming: twinOf(s.showing), phase: "mounting" }, { at, e: "failed", id });
  return s;
}
/** Time passes: a crossfade completes after CROSSFADE_MS. */
export function tick(s: StageState, at: number): StageState {
  if (s.phase === "fading" && s.incoming && at - s.fadeStart >= CROSSFADE_MS) return push({ ...s, showing: s.incoming, incoming: null, phase: "steady" }, { at, e: "fade_done", id: s.incoming.id });
  return s;
}
/** The seam retired the piece (8 turns, or done), or a safeguard began: back to the calm board. */
export function retire(s: StageState, at: number): StageState {
  const r = command(s, CALM_BOARD, at);
  return push(r, { at, e: "retire", id: s.showing.id });
}

/** What is painted now. Always ≥ 1 visible layer with opacity 1 in total (S1, S5). */
export function view(s: StageState, at: number): LayerView[] {
  if (s.phase === "fading" && s.incoming) {
    const p = Math.min(1, Math.max(0, (at - s.fadeStart) / CROSSFADE_MS));
    return [{ item: s.showing, opacity: 1 - p, visible: p < 1 }, { item: s.incoming, opacity: p, visible: true }];
  }
  // mounting: the incoming layer exists but is invisible (opacity 0) until it paints (S2)
  const out: LayerView[] = [{ item: s.showing, opacity: 1, visible: true }];
  if (s.incoming) out.push({ item: s.incoming, opacity: 0, visible: false });
  return out;
}

/** The server's reveal outcome slot (server/stagecraft/adapters.js outcomeToSlot) → a stage item. */
export function itemFromSlot(slot: { slotId: string; stagecraft?: { rung: string; archetype?: string; spec?: unknown; boardTwin?: { values?: Record<string, unknown>; board?: BoardLike } | null; board?: { board?: BoardLike; values?: Record<string, unknown> } | null; blobUrl?: string | null } }): StageItem {
  const sc = slot.stagecraft ?? { rung: "board" };
  const twin = sc.boardTwin ?? sc.board ?? null;
  const board: BoardLike = twin?.board ?? { title: String(twin?.values?.title ?? ""), lines: [] };
  if (sc.rung === "board") return { id: slot.slotId, kind: "board", archetype: "whiteboard", board };
  if (sc.rung === "image") return { id: slot.slotId, kind: "image", archetype: "image", src: sc.blobUrl ?? undefined, board };
  if (sc.rung === "live_codegen") return { id: slot.slotId, kind: "frame", archetype: sc.archetype ?? "frame", board };
  return { id: slot.slotId, kind: "engine", archetype: sc.archetype ?? "", spec: sc.spec, board };
}
