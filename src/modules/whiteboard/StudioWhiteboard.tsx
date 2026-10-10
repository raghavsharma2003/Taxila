// The Studio stage's `whiteboard` renderer (W2-B; registered in src/studio/renderers.ts). A model-written drawing
// script (W2-F's whiteboard archetype) or a template's script, drawn by our code inside the StudioStage box in sync
// with her speech: the drawing starts at the line's first audio sample (clock.ts) and every op is timed from there.
//
// - The script is normalised on the client too (shared/whiteboard.js, lenient): anything off the board is clamped,
//   anything malformed is dropped; a script with nothing drawable reports an error and shows the empty board (never
//   an error text: the stage's rule).
// - mode "continue" keeps the previous script's board (a worked example across turns) for the same lesson; "fresh"
//   clears it.
// - Reduced motion: each op appears complete at its startMs (the player's rule).
import { useEffect, useMemo, useRef, useState } from "react";
import type { WbOp, WhiteboardScript } from "../../../shared/studio.ts";
import { normalizeScript } from "../../../shared/whiteboard.js";
import type { ArtifactRendererProps } from "../../studio/renderers.ts";
import { awaitLineAnchor, type AnchorTiming } from "./clock.ts";
import { WhiteboardPlayer } from "./Player.tsx";
import { boardSkinFromDocument, watchSkin } from "./palette.ts";

/**
 * lessonId → the board: `ops` = what is on it after the script `scriptId` (re-scoped ids), `base` = what was on it
 * BEFORE that script (so a remount of the same script draws on the same board again), `alias` = an earlier op's own id →
 * its re-scoped id (the newest wins), so a "continue" script can highlight, erase or label an op of an earlier board by
 * the id that board gave it. Process memory only.
 */
interface Board { scriptId: string; board: WhiteboardScript["board"]; base: WbOp[]; ops: WbOp[]; alias: Map<string, string> }
const boards = new Map<string, Board>();
const MAX_BOARDS = 8;
const keyOf = (lessonId: string | undefined) => lessonId || "_";

/**
 * The sync telemetry (W2-F fixer): how late this script reached the board relative to her line's first audio sample.
 * Fire-and-forget, numbers only; never blocks or breaks the drawing.
 */
function reportTiming(lessonId: string | undefined, timing: AnchorTiming): void {
  if (!lessonId || typeof fetch !== "function" || typeof window === "undefined") return;
  try {
    void fetch("/api/studio/wb-timing", { method: "POST", credentials: "same-origin", keepalive: true, headers: { "content-type": "application/json" },
      body: JSON.stringify({ lessonId, lateMs: timing.lateMs, source: timing.source }) }).catch(() => {});
  } catch { /* telemetry never breaks the board */ }
}

/** The board a script draws on: [] for a fresh script, a board of another size, or a lesson's first script. */
function priorFor(raw: { scriptId?: unknown; mode?: unknown; line?: { lessonId?: unknown }; board?: { w?: unknown; h?: unknown } } | null | undefined) {
  if (!raw || raw.mode !== "continue") return { ops: [] as WbOp[], alias: new Map<string, string>() };
  const b = boards.get(keyOf(typeof raw.line?.lessonId === "string" ? raw.line.lessonId : undefined));
  // a continue script draws on the SAME board size; on a different one it starts fresh
  if (!b || b.board.w !== raw.board?.w || b.board.h !== raw.board?.h) return { ops: [] as WbOp[], alias: new Map<string, string>() };
  const ops = b.scriptId === raw.scriptId ? b.base : b.ops;
  const alias = new Map<string, string>();
  for (const o of ops) { const own = o.id.slice(o.id.indexOf(":") + 1); alias.set(own, o.id); }
  return { ops: ops.map((o) => ({ ...o, startMs: 0, endMs: 0 })), alias };
}

const scoped = (script: WhiteboardScript, alias: Map<string, string>, own: Set<string>) => (id: string) =>
  own.has(id) ? `${script.scriptId}:${id}` : alias.get(id) ?? id;

function remember(script: WhiteboardScript, prior: WbOp[], alias: Map<string, string>) {
  const key = keyOf(script.line.lessonId);
  const cur = boards.get(key);
  if (cur && cur.scriptId === script.scriptId) return;   // a remount: the board before it is kept as it was
  // ids are re-scoped so the next script may reuse its own ids freely; targets into the earlier board keep its ids
  const own = new Set(script.ops.map((o) => o.id));
  const re = scoped(script, alias, own);
  const ops = [...prior, ...script.ops.map((o) => ({ ...o, id: re(o.id), ...("target" in o && o.target ? { target: re(o.target) } : {}) } as WbOp))]
    .filter((o) => o.op !== "highlight").slice(-120);
  boards.delete(key);
  boards.set(key, { scriptId: script.scriptId, board: script.board, base: prior, ops, alias });
  if (boards.size > MAX_BOARDS) boards.delete(boards.keys().next().value!);
}

export function StudioWhiteboard({ artifact, px, reducedMotion, onEvent }: ArtifactRendererProps<"whiteboard">) {
  const before = useMemo(() => priorFor(artifact.script as Parameters<typeof priorFor>[0]), [artifact.script]);
  const norm = useMemo(() => normalizeScript(artifact.script, { priorIds: before.alias.keys() }), [artifact.script, before]);
  const prior = before.ops;
  // targets into the earlier board are pointed at its re-scoped ids (the player looks ops up by id)
  const script = useMemo(() => {
    const n = norm.script;
    if (!n || !before.alias.size) return n;
    const own = new Set(n.ops.map((o) => o.id));
    const fix = (id: string) => (own.has(id) ? id : before.alias.get(id) ?? id);
    return { ...n, ops: n.ops.map((o) => ("target" in o && o.target ? { ...o, target: fix(o.target) } as WbOp : o)) };
  }, [norm, before]);
  const [startAt, setStartAt] = useState<number | null>(null);
  const emitted = useRef(false);
  const latest = useRef(onEvent);
  latest.current = onEvent;

  useEffect(() => {
    setStartAt(null);
    emitted.current = false;
    if (!script) {
      latest.current({ type: "error", message: `whiteboard script rejected: ${norm.errors.slice(0, 3).join(",")}` });
      return;
    }
    // the board this script leaves behind is what a later "continue" script draws on (kept now: the lesson may move on
    // before the drawing finishes)
    remember(script, prior, before.alias);
    latest.current({ type: "ready" });
    return awaitLineAnchor(script.line, (at, timing) => {
      setStartAt(at);
      reportTiming(script.line?.lessonId, timing);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script, norm.errors]);

  // r4: the Kaksha skin's board when the Desk wears it (palette.ts: Kaksha's own tokens, read where the board mounts)
  const ground = script?.board.ground ?? "chalk";
  // re-read Kaksha's tokens when the theme or look switches under the board (K: data-ktheme / data-klook)
  const [skinRev, setSkinRev] = useState(0);
  useEffect(() => watchSkin(() => setSkinRev((n) => n + 1)), []);
  const skin = useMemo(() => boardSkinFromDocument(ground), [ground, skinRev]);
  if (!script) return null;
  return (
    <WhiteboardPlayer script={script} prior={prior} startAt={startAt} reducedMotion={reducedMotion} width={px.w} height={px.h} skin={skin}
      className="wb-svg" onDone={() => {
        if (emitted.current) return;
        emitted.current = true;
        latest.current({ type: "done" });
      }} />
  );
}
