// The Studio stage renderer for Stagecraft pieces (patch P10 registers it in src/studio/renderers.ts as the
// `stagecraft` artifact kind; patch P9 adds that kind to shared/studio.ts). One StageController per mounted stage: a
// new artifact is a reveal command (mounted under the outgoing piece, crossfaded only once it painted); the stage is
// never empty and never shows a loading state. Answers go up RAW (the host re-grades; the frame's verdict is never used).
import { useEffect, useRef } from "react";
import { StageController } from "./controller.ts";
import { itemFromSlot } from "./stage.ts";

/** The `stagecraft` artifact (server/stagecraft/seam-bridge.js stagecraftSlot). Typed here until P9 lands in shared/studio.ts. */
export interface StagecraftArtifact {
  kind: "stagecraft";
  stagecraft: { rung: string; archetype?: string; spec?: unknown; boardTwin?: { values?: Record<string, unknown>; board?: { title: string; lines: string[] } } | null; board?: { values?: Record<string, unknown> } | null; blobUrl?: string | null };
}
export interface StagecraftRendererProps {
  artifact: StagecraftArtifact & { slotId?: string };
  px: { w: number; h: number };
  reducedMotion: boolean;
  onEvent: (e: { type: "ready" } | { type: "done" } | { type: "answer"; value: unknown } | { type: "interaction"; name: string; data?: Record<string, unknown> }) => void;
  slotId?: string;
}

export function StagecraftRenderer(props: StagecraftRendererProps) {
  const root = useRef<HTMLDivElement>(null);
  const ctl = useRef<StageController | null>(null);
  const onEvent = useRef(props.onEvent);
  onEvent.current = props.onEvent;
  useEffect(() => {
    if (!root.current) return;
    const c = new StageController(root.current, {
      reducedMotion: props.reducedMotion,
      onMessage: (m) => {
        if (m.k === "answer") onEvent.current({ type: "answer", value: { itemId: m.itemId, value: m.value, archetype: m.archetype } });
        else if (m.k === "done") onEvent.current({ type: "done" });
        else if (m.k === "event" && m.name) onEvent.current({ type: "interaction", name: m.name });
      },
      onEvent: (e) => { if (e.e === "painted") onEvent.current({ type: "ready" }); },
    });
    ctl.current = c;
    return () => { c.dispose(); ctl.current = null; };
  }, [props.reducedMotion]);
  useEffect(() => {
    const id = props.slotId ?? props.artifact.slotId ?? `${props.artifact.stagecraft.rung}:${props.artifact.stagecraft.archetype ?? ""}`;
    ctl.current?.reveal(itemFromSlot({ slotId: id, stagecraft: props.artifact.stagecraft }));
  }, [props.artifact, props.slotId]);
  return <div ref={root} style={{ position: "relative", width: props.px.w, height: props.px.h, overflow: "hidden" }} />;
}
