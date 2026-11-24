// Round 7 M5a: the Studio stage's renderer for a code-built scene (artifact kind "scene"). The scene is normalised again
// here (a malformed scene is an error event, never drawn), its clock waits for her line's audio anchor like the whiteboard
// (clock.ts), and it reports ready / done to the stage. Reduced motion: still frames at each beat (ScenePlayer).
import { useEffect, useMemo, useRef, useState } from "react";
import { normalizeScene, lintScene } from "../../../shared/scene.js";
import type { ArtifactRendererProps } from "../../studio/renderers.ts";
import { awaitLineAnchor } from "../whiteboard/clock.ts";
import { ScenePlayer } from "./ScenePlayer.tsx";

export function SceneRenderer({ artifact, px, reducedMotion, onEvent }: ArtifactRendererProps<"scene">) {
  const norm = useMemo(() => normalizeScene(artifact.scene), [artifact.scene]);
  const scene = norm.ok && !lintScene(norm.scene).length ? norm.scene : null;
  const [startAt, setStartAt] = useState<number | null>(null);
  const latest = useRef(onEvent);
  latest.current = onEvent;
  const line = (artifact.scene as unknown as { line?: { lessonId?: string; teacherReplySeq?: number } }).line;
  useEffect(() => {
    setStartAt(null);
    if (!scene) { latest.current({ type: "error", message: `scene rejected: ${norm.errors.slice(0, 3).join(",")}` }); return; }
    latest.current({ type: "ready" });
    if (!line) { setStartAt(performance.now()); return; }
    return awaitLineAnchor(line, (at) => setStartAt(at));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);
  if (!scene) return null;
  return <ScenePlayer scene={scene} startAt={startAt} reducedMotion={reducedMotion} width={px.w} height={px.h} onDone={() => latest.current({ type: "done" })} />;
}
export default SceneRenderer;
