// The Studio stage (LIVE-STUDIO §4, STUDENT-FLOW §5.3; BUILD-PLAN W2-H #4, SF3). OWNED BY W2-H.
//
// The box (seam commit, unchanged contract): the Work tray's `studio` kind reserves ONE fixed, responsive stage box: the
// largest box with the artifact's aspect (its declared design size, default 4:3) that fits the tray body, whole pixels,
// centred. Every Studio artifact (a whiteboard script, a built game or animation, a skeleton, an image) renders into that
// box and nowhere else: the box clips (`contain: strict`), the tray never grows or scrolls for it, and a resize refits it.
//
// The moment (filled by W2-H), at constant tray height:
//   skeleton_shown  the sketch draws itself in pencil strokes in the accent colour (600 ms), a caption chip
//                   "{T} is making this for you" (rotated per lesson)
//   building        a watercolour wash fills in behind the pencil: the streamed partial, sanitised, in a script-less
//                   sandboxed frame at 60% opacity, desaturated, inert (decoration, never interaction)
//   ready           a tiny sparkle at the corner, no sound
//   revealed        the veil lifts (300 ms), the pencil fades, scale 0.98 → 1.0, the first target pulses once
//   in_use          full interaction; answers graded by the host
//   fallback_shown  the skeleton itself is the activity (correct, plain), host-graded; nothing says a build failed
// Reduced motion (OS setting or the younger band's calm mode): no pencil animation, cross-fades only.
// Never on screen: code, a percentage, a spinner, "AI is generating", an error card. A renderer's `error` swaps in the
// skeleton-as-activity (frames) or leaves the calm ground (anything else).
// The child's controls: "Show me again" (replay / reset; a signal, not a help rung) and "Not this one" (retire; that
// archetype is not offered to this child for a week), behind one small corner button.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { STAGE_DEFAULT, type StudioArtifact, type StudioSlot } from "../../shared/studio.ts";
import { fitStage, validStage, type StageFit } from "./fit.ts";
import { rendererFor, type StudioStageEvent } from "./renderers.ts";
import { StageMomentContext, type StageMoment } from "./stageContext.ts";
import { lessonOfIntent, studioApi, usePartial, useStudioSlot } from "./useStudio.ts";
import { partialDocument } from "./kit/bundle.ts";
import { sanitizePartial } from "./kit/sanitize.ts";
import { useTeacherName } from "../ui/teacher/useTeacher.ts";
import { tw2h } from "../copy/en.ts";
import "./studio.css";

/** Px kept free between the box and the tray edge, so a piece never touches the rounded tray corners. */
const STAGE_INSET = 8;
/** Upscale cap: a 400-unit piece on a wide desktop tray stays a picture, not a poster. */
const MAX_SCALE = 3;
/** The corner control (44 px: the touch minimum at every band). */
const CTRL = 44;
/** The open menu's size (studio.css .st-menu: 168 px wide; two 44 px rows, gap, padding, border). */
const MENU_W = 168, MENU_H = 104;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
/**
 * Where the open menu goes, relative to the control: below and right-aligned when it fits, else flipped above, else
 * slid beside; always clamped INSIDE the stage (the stage clips: a menu item outside it could never be tapped).
 */
export function menuPlacement(ctrl: { left: number; top: number }, stage: { w: number; h: number }): { left: number; top: number } {
  const below = CTRL + 4, above = -MENU_H - 4;
  let top = ctrl.top + below + MENU_H <= stage.h - 4 ? below : ctrl.top + above >= 4 ? above : 0;
  top = clamp(top, 4 - ctrl.top, stage.h - 4 - MENU_H - ctrl.top);
  // a menu beside the control when it cannot sit below or above (a very short tray)
  const beside = top !== below && top !== above;
  let left = beside ? (ctrl.left - MENU_W - 4 >= 4 ? -MENU_W - 4 : CTRL + 4) : CTRL - MENU_W;
  left = clamp(left, 4 - ctrl.left, stage.w - 4 - MENU_W - ctrl.left);
  return { left: Math.round(left), top: Math.round(top) };
}
let mounts = 0;

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
  const [avail, setAvail] = useState<{ w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const next = fitStage({ w: r.width, h: r.height }, design, { inset: STAGE_INSET, maxScale: MAX_SCALE });
      setFit((prev) => (prev && prev.w === next.w && prev.h === next.h && prev.x === next.x && prev.y === next.y ? prev : next));
      setAvail((prev) => (prev && prev.w === Math.round(r.width) && prev.h === Math.round(r.height) ? prev : { w: Math.round(r.width), h: Math.round(r.height) }));
    };
    measure();
    if (typeof ResizeObserver !== "function") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [design.w, design.h]);
  return { ref, fit, avail };
}

/** The phase the stage draws for a tray state. */
type Phase = "making" | "ready" | "reveal" | "live" | "empty";
const phaseOf = (state: StudioSlot["state"], hasArtifact: boolean): Phase => {
  if (!hasArtifact) return "empty";
  switch (state) {
    case "planning": case "skeleton_shown": case "building": return "making";
    case "ready": return "ready";
    case "revealed": return "reveal";
    case "in_use": case "fallback_shown": return "live";
    default: return "live";
  }
};

/** A frame that failed becomes its skeleton-as-activity (same params and words); the server retires the build. */
function skeletonFor(a: StudioArtifact): StudioArtifact | null {
  if (a.kind !== "frame" || !a.skeleton) return null;
  return { kind: "skeleton", stage: a.stage, skeleton: a.skeleton, params: a.params ?? {}, strings: a.strings ?? {}, archetype: a.archetype, intentId: a.intentId };
}

export function StudioStage({ slot: given, young, lang, onEvent }: { slot: StudioSlot; young: boolean; lang: string; onEvent?: (e: StudioStageEvent) => void }) {
  const slot = useStudioSlot(given);
  const lessonId = lessonOfIntent(slot.intentId);
  const [swap, setSwap] = useState<StudioArtifact | null>(null);
  const [epoch, setEpoch] = useState(0);
  const [menu, setMenu] = useState(false);
  const [gone, setGone] = useState(false);
  // one key per stage MOUNT (and per "Show me again" epoch): the host restarts its bookkeeping when the activity on the
  // child's screen restarts (a remount after the Director took the tray, a reload, a reconnect)
  const mountId = useRef<string>("");
  if (!mountId.current) mountId.current = `${Date.now().toString(36)}${(++mounts).toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
  useEffect(() => { setSwap(null); setEpoch(0); setMenu(false); setGone(false); }, [slot.slotId]);
  const artifact: StudioArtifact | undefined = gone ? undefined : swap ?? slot.artifact;
  const design = useMemo(() => validStage(artifact?.stage ?? (artifact?.kind === "whiteboard" ? artifact.script.board : undefined), STAGE_DEFAULT),
    [artifact]);
  const { ref, fit, avail } = useAreaFit(design);
  const reducedMotion = useReducedMotion();
  const state = swap ? "fallback_shown" : slot.state;
  const phase = phaseOf(state, !!artifact);
  const interactive = phase === "live" || phase === "reveal";
  const teacher = useTeacherName()?.name || "Your teacher";
  const caption = useMemo(() => tw2h(`making.${Math.abs(hashStr(lessonId ?? "")) % 3}` as "making.0", { T: teacher }), [lessonId, teacher]);

  const partial = usePartial(lessonId, phase === "making" ? slot.intentId ?? null : null);
  const veil = useMemo(() => (partial ? partialDocument(sanitizePartial(partial), design) : null), [partial, design]);
  const latest = useRef(onEvent);
  latest.current = onEvent;
  const emit = useCallback((e: StudioStageEvent) => {
    // a renderer's own "answer" is only the child's claim: the lesson hears the HOST's verdict ("graded", below)
    if (e.type !== "answer" && e.type !== "graded") latest.current?.(e);
    // a frame that cannot run becomes the skeleton-as-activity, quietly (LIVE-STUDIO §4.4)
    if (e.type === "error" && artifact?.kind === "frame") {
      const local = skeletonFor(artifact);
      if (local) setSwap(local);
      if (lessonId && slot.intentId) {
        void studioApi.frameError(lessonId, slot.intentId, e.reason ?? "runtime").then((r) => {
          const next = r?.slot?.artifact ?? null;
          if (!local && next?.kind === "skeleton") setSwap(next);
        });
      }
    }
  }, [artifact, lessonId, slot.intentId]);

  const moment: StageMoment = useMemo(() => ({
    interactive, epoch,
    answer: async (value: unknown, opts?: { itemId?: string }) => {
      if (!lessonId || !slot.intentId) return null;
      const r = await studioApi.answer(lessonId, slot.intentId, value, { ...(opts?.itemId ? { itemId: opts.itemId } : {}), mount: `${mountId.current}.${epoch}` });
      // the server no longer has the piece on screen: the calm ground, never a Check button that cannot answer
      if (r === "gone") { setGone(true); return null; }
      if (r) latest.current?.({ type: "graded", correct: !!r.correct, complete: !!r.complete, ...(r.alreadyClosed ? { alreadyClosed: true } : {}),
        ...(typeof r.wrongTries === "number" ? { wrongTries: r.wrongTries } : {}) });
      return r;
    },
  }), [interactive, epoch, lessonId, slot.intentId]);

  const again = () => { setMenu(false); setEpoch((n) => n + 1); if (lessonId && slot.intentId) void studioApi.feedback(lessonId, slot.intentId, "again"); };
  const notThis = () => { setMenu(false); setGone(true); if (lessonId && slot.intentId) void studioApi.feedback(lessonId, slot.intentId, "not_this"); };

  let body: ReactNode = null;
  if (artifact && fit && fit.w > 0) {
    const Renderer = rendererFor(artifact.kind);
    // A kind with no renderer yet shows the empty ground (never a placeholder text or a spinner).
    if (Renderer) body = <Renderer key={`${artifact.kind}:${epoch}`} artifact={artifact as never} px={{ w: fit.w, h: fit.h }} design={design} reducedMotion={reducedMotion} young={young} lang={lang} onEvent={emit} />;
  }
  const controls = !!artifact && artifact.kind !== "whiteboard" && interactive && !!lessonId;
  // the corner control sits outside the box when the stage has room beside it (tablet / desktop), else on its corner
  const ctrlStyle = fit ? (fit.x >= CTRL + 8 ? { left: fit.x + fit.w + 4, top: fit.y } : { left: fit.x + fit.w - CTRL - 4, top: fit.y + 4 }) : undefined;
  const menuStyle = ctrlStyle && avail ? menuPlacement(ctrlStyle, avail) : undefined;
  return (
    <div ref={ref} className={`st-stage${reducedMotion ? " is-still" : ""}`} data-testid="studio-stage" data-state={state} data-phase={phase} data-kind={artifact?.kind}>
      <div className={`st-box st-${phase}`} data-testid="studio-box"
        style={fit ? { width: fit.w, height: fit.h, left: fit.x, top: fit.y } : { visibility: "hidden" }}>
        <StageMomentContext.Provider value={moment}>
          <div className="st-art">{body}</div>
        </StageMomentContext.Provider>
        {phase === "making" && (
          <div className="st-wash" aria-hidden="true">
            {veil && fit && (
              // the streamed partial: sanitised, in a frame with NO script permission at all, inert, under the pencil
              <iframe className="st-veil" title="" tabIndex={-1} sandbox="" srcDoc={veil}
                style={{ width: design.w, height: design.h, transform: `scale(${fit.w / design.w})`, transformOrigin: "0 0" }} />
            )}
          </div>
        )}
        {phase === "ready" && <span className="st-sparkle" aria-hidden="true" />}
      </div>
      {phase === "making" && fit && (
        <div className="st-chip" style={{ left: fit.x + 10, top: fit.y + fit.h - 40 }} data-testid="studio-chip">{caption}</div>
      )}
      {controls && ctrlStyle && (
        <div className="st-ctrl" style={ctrlStyle}>
          <button type="button" className="st-ctrl-btn" aria-label={tw2h("more")} aria-expanded={menu} onClick={() => setMenu((m) => !m)} data-testid="studio-more">
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="4" cy="10" r="2" /><circle cx="10" cy="10" r="2" /><circle cx="16" cy="10" r="2" /></svg>
          </button>
          {menu && (
            <div className="st-menu" role="menu" data-testid="studio-menu" style={menuStyle}>
              <button type="button" role="menuitem" onClick={again} data-testid="studio-again">{tw2h("again")}</button>
              <button type="button" role="menuitem" onClick={notThis} data-testid="studio-notthis">{tw2h("notThis")}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function hashStr(s: string): number { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
