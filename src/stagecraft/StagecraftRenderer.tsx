// The Studio stage renderer for Stagecraft pieces (patch P10 registers it in src/studio/renderers.ts as the
// `stagecraft` artifact kind; patch P9 adds that kind to shared/studio.ts). One StageController per mounted stage: a
// new artifact is a reveal command (mounted under the outgoing piece, crossfaded only once it painted); the stage is
// never empty and never shows a loading state. Answers go up RAW (the host re-grades; the frame's verdict is never used).
//
// ship5 p4-content: the controller (and with it the Studio v2 host and engines, ~230 kB) is its own chunk, loaded on the
// first Stagecraft reveal and warmed on idle when this module loads, so the lesson bundle stays the size it was. Until it
// is in, the item's board twin is drawn by a plain canvas here (the same title and lines), never a spinner.
import { useEffect, useRef } from "react";
import { itemFromSlot, type StageItem } from "./stage.ts";
import { useStageMoment } from "../studio/stageContext.ts";
import type { StageController } from "./controller.ts";

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

type ControllerModule = typeof import("./controller.ts");
let ctlP: Promise<ControllerModule> | null = null;
export function loadController(): Promise<ControllerModule> {
  ctlP ??= import("./controller.ts").catch((e) => { ctlP = null; throw e; });
  return ctlP;
}
if (typeof window !== "undefined") {
  const warm = () => { void loadController().catch(() => null); };
  const ric = (window as unknown as { requestIdleCallback?: (f: () => void) => void }).requestIdleCallback;
  if (ric) ric(warm); else setTimeout(warm, 1500);
}

/** The interim board (until the controller chunk is in): the item's board twin, written plainly on the stage ground. */
function drawInterim(canvas: HTMLCanvasElement, item: StageItem): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width: w, height: h } = canvas;
  ctx.clearRect(0, 0, w, h);
  const title = String(item.board?.title ?? "").slice(0, 40);
  const lines = (item.board?.lines ?? []).slice(0, 4).map((l) => String(l).slice(0, 64));
  ctx.textAlign = "center";
  ctx.fillStyle = getComputedStyle(canvas).color || "white";
  ctx.font = `600 ${Math.round(h * 0.075)}px system-ui, sans-serif`;
  if (title) ctx.fillText(title, w / 2, h * 0.24, w * 0.9);
  ctx.font = `${Math.round(h * 0.05)}px system-ui, sans-serif`;
  lines.forEach((l, i) => ctx.fillText(l, w / 2, h * (0.42 + i * 0.11), w * 0.9));
}

export function StagecraftRenderer(props: StagecraftRendererProps) {
  const root = useRef<HTMLDivElement>(null);
  const interim = useRef<HTMLCanvasElement>(null);
  const ctl = useRef<StageController | null>(null);
  const pending = useRef<StageItem | null>(null);
  const onEvent = useRef(props.onEvent);
  onEvent.current = props.onEvent;
  // the stage's host grader (StudioStage provides it): the child's raw act goes up, the HOST's verdict comes back
  // (before this, answers only reached onEvent, which the stage never forwards to the server)
  const moment = useStageMoment();
  const answer = useRef(moment.answer);
  answer.current = moment.answer;
  useEffect(() => {
    let alive = true;
    loadController().then(({ StageController: C }) => {
      if (!alive || !root.current) return;
      const c = new C(root.current, {
        reducedMotion: props.reducedMotion,
        onMessage: (m) => {
          if (m.k === "answer") {
            const itemId = typeof m.itemId === "string" ? m.itemId : undefined;
            onEvent.current({ type: "answer", value: { itemId, value: m.value, archetype: m.archetype } });
            void answer.current({ itemId, value: m.value, archetype: m.archetype }, itemId ? { itemId } : undefined).catch(() => null);
          } else if (m.k === "done") onEvent.current({ type: "done" });
          else if (m.k === "event" && m.name) onEvent.current({ type: "interaction", name: m.name });
        },
        onEvent: (e) => { if (e.e === "painted") { onEvent.current({ type: "ready" }); if (interim.current) interim.current.style.display = "none"; } },
      });
      ctl.current = c;
      if (pending.current) { c.reveal(pending.current); pending.current = null; }
    }, () => { /* the chunk failed: the interim board stays (the board twin IS the floor) */ });
    return () => { alive = false; ctl.current?.dispose(); ctl.current = null; };
  }, [props.reducedMotion]);
  useEffect(() => {
    const id = props.slotId ?? props.artifact.slotId ?? `${props.artifact.stagecraft.rung}:${props.artifact.stagecraft.archetype ?? ""}`;
    const item = itemFromSlot({ slotId: id, stagecraft: props.artifact.stagecraft });
    if (ctl.current) ctl.current.reveal(item);
    else { pending.current = item; if (interim.current) drawInterim(interim.current, item); }
  }, [props.artifact, props.slotId]);
  return (
    <div ref={root} style={{ position: "relative", width: props.px.w, height: props.px.h, overflow: "hidden" }}>
      <canvas ref={interim} width={1000} height={625} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
    </div>
  );
}
