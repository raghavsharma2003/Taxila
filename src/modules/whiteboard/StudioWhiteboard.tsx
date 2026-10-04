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
import { awaitLineAnchor } from "./clock.ts";
import { WhiteboardPlayer } from "./Player.tsx";

/** lessonId → the last board drawn (ops with their final state), for a "continue" script. Process memory only. */
const boards = new Map<string, { scriptId: string; board: WhiteboardScript["board"]; ops: WbOp[] }>();
const MAX_BOARDS = 8;

function remember(script: WhiteboardScript, prior: WbOp[]) {
  const key = script.line.lessonId || "_";
  // ids are re-scoped so the next script may reuse its own ids freely
  const ops = [...prior, ...script.ops.map((o) => ({ ...o, id: `${script.scriptId}:${o.id}`, ...("target" in o ? { target: `${script.scriptId}:${o.target}` } : {}) } as WbOp))]
    .filter((o) => o.op !== "highlight").slice(-120);
  boards.delete(key);
  boards.set(key, { scriptId: script.scriptId, board: script.board, ops });
  if (boards.size > MAX_BOARDS) boards.delete(boards.keys().next().value!);
}

export function StudioWhiteboard({ artifact, px, reducedMotion, onEvent }: ArtifactRendererProps<"whiteboard">) {
  const norm = useMemo(() => normalizeScript(artifact.script), [artifact.script]);
  const script = norm.script;
  const prior = useMemo(() => {
    if (!script || script.mode !== "continue") return [];
    const b = boards.get(script.line.lessonId || "_");
    // a continue script draws on the SAME board size; on a different one it starts fresh
    return b && b.scriptId !== script.scriptId && b.board.w === script.board.w && b.board.h === script.board.h ? b.ops.map((o) => ({ ...o, startMs: 0, endMs: 0 })) : [];
  }, [script]);
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
    remember(script, prior);
    latest.current({ type: "ready" });
    return awaitLineAnchor(script.line, (at) => setStartAt(at));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script, norm.errors]);

  if (!script) return null;
  return (
    <WhiteboardPlayer script={script} prior={prior} startAt={startAt} reducedMotion={reducedMotion} width={px.w} height={px.h}
      className="wb-svg" onDone={() => {
        if (emitted.current) return;
        emitted.current = true;
        latest.current({ type: "done" });
      }} />
  );
}
