// The Studio stage (LIVE-STUDIO §4, STUDENT-FLOW §5.3). W2 seam commit: the box only. OWNED BY W2-H (the veil, the
// pencil skeleton, the reveal choreography and the seven tray states fill it).
//
// What the seam fixes for every later stream (owner priority 4): the Work tray's `studio` kind reserves ONE fixed,
// responsive stage box: the largest box with the artifact's aspect (its declared design size, default 4:3) that fits
// the tray body, whole pixels, centred. Every Studio artifact (a whiteboard script, a built game or animation, a
// skeleton, an image) renders into that box and nowhere else: the box clips (`contain: strict`), the tray never grows or
// scrolls for it, and a resize (rotation, the keyboard, a font scale) refits it without a layout jump of the tray.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { STAGE_DEFAULT, type StudioArtifact, type StudioSlot } from "../../shared/studio.ts";
import { fitStage, validStage, type StageFit } from "./fit.ts";
import { rendererFor, type StudioStageEvent } from "./renderers.ts";
import "./studio.css";

/** Px kept free between the box and the tray edge, so a piece never touches the rounded tray corners. */
const STAGE_INSET = 8;
/** Upscale cap: a 400-unit piece on a wide desktop tray stays a picture, not a poster. */
const MAX_SCALE = 3;

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    if (typeof matchMedia !== "function") return;
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduced;
}

/** The available area of the stage element, tracked across resizes. null until first measured. */
function useAreaFit(design: { w: number; h: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<StageFit | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const next = fitStage({ w: r.width, h: r.height }, design, { inset: STAGE_INSET, maxScale: MAX_SCALE });
      setFit((prev) => (prev && prev.w === next.w && prev.h === next.h && prev.x === next.x && prev.y === next.y ? prev : next));
    };
    measure();
    if (typeof ResizeObserver !== "function") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [design.w, design.h]);
  return { ref, fit };
}

export function StudioStage({ slot, young, lang, onEvent }: { slot: StudioSlot; young: boolean; lang: string; onEvent?: (e: StudioStageEvent) => void }) {
  const artifact: StudioArtifact | undefined = slot.artifact;
  const design = useMemo(() => validStage(artifact?.stage ?? (artifact?.kind === "whiteboard" ? artifact.script.board : undefined), STAGE_DEFAULT),
    [artifact]);
  const { ref, fit } = useAreaFit(design);
  const reducedMotion = useReducedMotion();
  const emit = (e: StudioStageEvent) => onEvent?.(e);
  let body: ReactNode = null;
  if (artifact && fit && fit.w > 0) {
    const Renderer = rendererFor(artifact.kind);
    // A kind with no renderer yet shows the empty ground (never a placeholder text or a spinner).
    if (Renderer) body = <Renderer artifact={artifact as never} px={{ w: fit.w, h: fit.h }} design={design} reducedMotion={reducedMotion} young={young} lang={lang} onEvent={emit} />;
  }
  return (
    <div ref={ref} className="st-stage" data-testid="studio-stage" data-state={slot.state} data-kind={artifact?.kind}>
      <div className="st-box" data-testid="studio-box"
        style={fit ? { width: fit.w, height: fit.h, left: fit.x, top: fit.y } : { visibility: "hidden" }}>
        {body}
      </div>
    </div>
  );
}
