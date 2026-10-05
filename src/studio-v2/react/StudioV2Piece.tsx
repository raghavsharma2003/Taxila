// React wrapper for the Studio v2 host, for W2-H's StudioStage (rung 1 of reset-studio-v2-on-w2h-host). It owns nothing
// but the mount: the stage gives it a fitted box; it mounts the engine host into it and forwards host messages.
//   - answers go up as { archetype, itemId, value } (the RAW act); the in-page grade is advisory, the server re-grades
//     with the same shared/studio-spec.ts gradeAnswer from the spec it stored (never the frame's claim);
//   - engine_failed / fallback mean the host already cross-faded to the board version; the stage keeps showing it;
//   - facts feed RS-5's stageFacts (she may refer only to what is on screen);
//   - knobs ("harder", "slower", "again") are instant engine changes, no new generation (STUDIO-V2 §7).
import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import { ENGINES } from "../engines/index.ts";
import { mountStudio, type StudioHandle } from "../core/host.ts";
import type { Knob, StudioMessage } from "../core/types.ts";

export interface StudioV2Event { type: "ready" | "answer" | "done" | "fallback" | "event" | "facts"; archetype: string; itemId?: string; value?: unknown; name?: string; data?: unknown; facts?: Record<string, string | number> }
export interface StudioV2PieceProps {
  archetype: string;
  spec: unknown;                         // the planner's spec as received; the host validates/repairs it again
  reducedMotion?: boolean;
  teacher?: HTMLElement | null;          // the in-house rig's PiP element (never a portrait)
  audio?: Record<string, string>;        // explainer narration clips (the teacher's own turn), measured timing in spec
  onEvent?: (e: StudioV2Event) => void;
}
export interface StudioV2PieceHandle { knob(k: Knob): boolean; facts(): Record<string, string | number>; rung(): "engine" | "board" | null }

export const StudioV2Piece = forwardRef<StudioV2PieceHandle, StudioV2PieceProps>(function StudioV2Piece(props, ref) {
  const slot = useRef<HTMLDivElement>(null);
  const handle = useRef<StudioHandle | null>(null);
  const onEvent = useRef(props.onEvent);
  onEvent.current = props.onEvent;
  useImperativeHandle(ref, () => ({
    knob: (k) => handle.current?.knob(k) ?? false,
    facts: () => handle.current?.facts() ?? {},
    rung: () => handle.current?.rung() ?? null,
  }), []);
  useEffect(() => {
    const el = slot.current, def = ENGINES[props.archetype];
    if (!el || !def) return;           // an unknown archetype is the router's bug: the stage keeps its board rung
    const forward = (m: StudioMessage) => {
      const send = onEvent.current; if (!send) return;
      if (m.k === "answer") send({ type: "answer", archetype: m.archetype, itemId: m.itemId, value: m.value });
      else if (m.k === "ready" || m.k === "done") send({ type: m.k, archetype: m.archetype, data: m.k === "done" ? m.summary : m.data });
      else if (m.k === "engine_failed" || m.k === "fallback") send({ type: "fallback", archetype: m.archetype, name: m.name, data: m.data });
      else if (m.k === "event") send({ type: "event", archetype: m.archetype, name: m.name, data: m.data });
    };
    const h = mountStudio(el, def, { spec: props.spec, motion: props.reducedMotion ? "reduce" : undefined, teacher: props.teacher, audio: props.audio, onMessage: forward });
    handle.current = h;
    const tick = window.setInterval(() => onEvent.current?.({ type: "facts", archetype: props.archetype, facts: h.facts() }), 1000);
    return () => { window.clearInterval(tick); h.dispose(); handle.current = null; };
  }, [props.archetype, props.spec, props.reducedMotion, props.teacher, props.audio]);
  return <div ref={slot} style={{ position: "absolute", inset: 0 }} />;
});
