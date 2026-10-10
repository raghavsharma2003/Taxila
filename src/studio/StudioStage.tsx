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
import { STAGE_DEFAULT, type BeatCard, type StudioArtifact, type StudioSlot } from "../../shared/studio.ts";
import { fitStage, validStage, type StageFit } from "./fit.ts";
import { rendererFor, type StudioStageEvent } from "./renderers.ts";
import { StageMomentContext, type StageMoment } from "./stageContext.ts";
import { lessonOfIntent, studioApi, usePartial, useStudioSlot } from "./useStudio.ts";
import { partialDocument } from "./kit/bundle.ts";
import { sanitizePartial } from "./kit/sanitize.ts";
import { boardFrame, type BoardFrame } from "./boardView.ts";
import { twinScript, type TwinLike } from "./twinBoard.ts";
import { applyTransform, BOARD_FLOOR_PX, BOARD_FLOOR_PX_YOUNG, fitBoard, rememberTransform, transformFor } from "./boardFit.ts";
import { useTeacherName } from "../ui/teacher/useTeacher.ts";
import { tw2h } from "../copy/en.ts";
import "./studio.css";

/** Px kept free between the box and the tray edge, so a piece never touches the rounded tray corners. */
const STAGE_INSET = 8;
/** On a phone-width tray every px goes to the piece (round 3 forge: a 16:10 world is width-bound at 328 px). */
const STAGE_INSET_PHONE = 2;
const PHONE_TRAY_MAX_W = 420;
/**
 * The device's last line (round 3 forge, docs/design/round3/forge/RESEARCH.md): a Studio v2 world (1000 x 625 design units,
 * labels 38 units, targets 130 units: src/studio-v2/core/tokens.ts MIN) whose box makes its words smaller than the play
 * text floor (shared/play.ts FLOORS.text, 14 px) or its targets smaller than 44 px (FLOORS.target) is below what any child
 * can use; on THIS device the stage then shows the same idea's board twin as a whiteboard (twinBoard.ts), never the
 * unreadable game. Measured (round 3 forge matrix): a 360 phone tray gives 12.3 px / 42 px → twin; a 412 phone 14.3 px /
 * 49 px → the game. The classes 4-5 floor (16 px) is a certification target judged on the server, NOT a swap trigger: a
 * slightly small game the child can play beats a still board (decision r3-forge device-swap-floor; reversal: observed
 * misreads or mis-taps by class 4-5 children at 14-16 px).
 */
export const DEVICE_MIN_LABEL_PX = 14, DEVICE_MIN_TARGET_PX = 44;
/**
 * The rail band (round 3 forge): on a phone-width tray a Studio v2 world's chrome (HUD readouts, the task pill) at the text
 * floor does not fit the world's own top rail: in the matrix it covered the world and the readouts (the task pill over
 * "SORTED 0/0", its goal one word per line). The stage gives that chrome a band ABOVE the world instead (studio.css
 * `[data-rail]`): one HUD row and a two-line task pill at 14 px (16 px for classes 4-5), with gaps. The world keeps its full
 * width; the band uses tray height the 16:10 box left empty (S2.uses_tray was 45% at 412 px).
 */
export const RAIL_PX = 112, RAIL_PX_YOUNG = 124;
/** round 4 content: the beat card header (one row of 14 px chips; 16 px for classes 1-5, shared/play.ts FLOORS). */
export const CARD_HEAD_PX = 34, CARD_HEAD_PX_YOUNG = 38;
const SV2 = { world: 1000, label: 38, target: 130 };
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

/** The available area of the stage element (CSS px, unrounded), tracked across resizes. null until first measured. */
function useStageArea() {
  const ref = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState<{ w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setAvail((prev) => (prev && Math.round(prev.w) === Math.round(r.width) && Math.round(prev.h) === Math.round(r.height) ? prev : { w: r.width, h: r.height }));
    };
    measure();
    if (typeof ResizeObserver !== "function") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, avail };
}

/** The px kept free around the box for a stage of this width (phone-width trays give the piece every px). */
const insetFor = (w: number) => (w <= PHONE_TRAY_MAX_W ? STAGE_INSET_PHONE : STAGE_INSET);

/** The stage box for a design in the measured area; with the rail band, the box grows by the band above the world. */
function boxFor(avail: { w: number; h: number }, design: { w: number; h: number }, railPx: number): StageFit {
  const inset = insetFor(avail.w);
  let next = fitStage({ w: avail.w, h: avail.h - railPx }, design, { inset, maxScale: MAX_SCALE });
  if (railPx > 0 && next.w > 0) next = { ...next, h: next.h + railPx, y: Math.max(inset, Math.floor((avail.h - next.h - railPx) / 2)) };
  return next;
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
  useEffect(() => { setSwap(null); setEpoch(0); setMenu(false); setGone(false); setTwinFor(null); twinArea.current = null; }, [slot.slotId]);
  const given0: StudioArtifact | undefined = gone ? undefined : swap ?? slot.artifact;
  // round 3 forge: a piece too small to use on THIS device's box (a Studio v2 world, a play level whose layout refused the
  // box, or a renderer that failed) becomes its board twin: the same idea as a legible whiteboard (twinBoard.ts)
  const [twinFor, setTwinFor] = useState<string | null>(null);
  // the area the twin was chosen at: a box that later GROWS (a phone turned to landscape, a window widened) retries the
  // piece itself (the device check and the renderer's own layout decide again)
  const twinArea = useRef<{ w: number; h: number } | null>(null);
  const twinBoardOf = (a: StudioArtifact | undefined): TwinLike | null => {
    if (!a) return null;
    if (a.kind === "stagecraft") {
      const sc = (a as Extract<StudioArtifact, { kind: "stagecraft" }>).stagecraft;
      return sc.boardTwin?.board ?? (sc.board as { board?: TwinLike } | null | undefined)?.board ?? null;
    }
    // a play piece (docs/design/round3/play/GRAMMAR.md §7) carries its level's board twin beside the play block
    if ((a.kind as string) === "play") return ((a as unknown as { boardTwin?: { board?: TwinLike } }).boardTwin?.board) ?? null;
    return null;
  };
  const twin = useMemo(() => {
    if (!given0 || twinFor !== slot.slotId) return null;
    const script = twinScript(twinBoardOf(given0), `${slot.slotId}:twin`);
    return script ? ({ kind: "whiteboard", stage: { w: script.board.w, h: script.board.h }, script } as StudioArtifact) : null;
  }, [given0, twinFor, slot.slotId]);
  const { ref, avail: area } = useStageArea();
  // round 4 content, the beat-by-beat board: a card header above a board that carries one (its height comes off the box)
  const card = ((given0?.kind === "whiteboard" ? (given0 as Extract<StudioArtifact, { kind: "whiteboard" }>).script : null) as { card?: BeatCard } | null)?.card ?? null;
  const headPx = card ? (young ? CARD_HEAD_PX_YOUNG : CARD_HEAD_PX) : 0;
  const avail = useMemo(() => (area && headPx ? { w: area.w, h: Math.max(1, area.h - headPx) } : area), [area, headPx]);
  useEffect(() => {
    if (!twinFor || !avail) return;
    const at = twinArea.current;
    if (!at) { twinArea.current = { w: avail.w, h: avail.h }; return; }
    if (avail.w > at.w * 1.08 || avail.h > at.h * 1.08) { twinArea.current = null; setTwinFor(null); }
  }, [avail, twinFor]);
  const shown0: StudioArtifact | undefined = twin ?? given0;
  // round 3 forge: a whiteboard is laid out FOR the box (boardFit.ts): on a phone its geometry scales to the box while its
  // words keep their size, so the smallest word reaches the 14 px floor where a clean layout exists. Decided once per
  // artifact (a resize refits the box, never re-lays the drawing out mid-animation); continue boards reuse their fresh
  // board's transform so they still line up with it.
  // round 4 content: ...unless the box itself changed by more than 8 % since the layout was decided. In a live lesson the
  // first measurement often lands while the Desk is still moving into its Work geometry (a smaller tray for a frame or
  // two): the layout chosen for that transient box stuck, and a board the tray gate passed at 15.5 px rendered at 11.5 px
  // (round3-forge on a local production build, game-perimeter at 360, 2026-10-10).
  const fitted = useRef<{ src: StudioArtifact; out: StudioArtifact; area: { w: number; h: number } } | null>(null);
  const artifact: StudioArtifact | undefined = useMemo(() => {
    if (!shown0 || shown0.kind !== "whiteboard" || !avail) return shown0;
    const same = (a: { w: number; h: number }) => Math.abs(a.w - avail.w) <= a.w * 0.08 && Math.abs(a.h - avail.h) <= a.h * 0.08;
    if (fitted.current?.src === shown0 && (shown0.script.mode === "continue" || same(fitted.current.area))) return fitted.current.out;
    const sc = shown0.script;
    let out: StudioArtifact = shown0;
    try {
      if (sc.mode === "continue") {
        const t = transformFor(sc);
        if (t) out = { ...shown0, stage: { w: t.w, h: t.h }, script: applyTransform(sc, t) };
      } else {
        const fr = boardFrame(sc as never);
        const inset = insetFor(avail.w);
        const r = fitBoard(sc, { w: avail.w - 2 * inset, h: avail.h - 2 * inset }, fr.framed ? { w: fr.w, h: fr.h } : sc.board, young ? BOARD_FLOOR_PX_YOUNG : BOARD_FLOOR_PX);
        rememberTransform(sc, r.t);
        if (r.t) out = { ...shown0, stage: { w: r.t.w, h: r.t.h }, script: r.script };
      }
    } catch { out = shown0; }
    fitted.current = { src: shown0, out, area: { w: avail.w, h: avail.h } };
    return out;
  }, [shown0, avail, young]);
  // a board is drawn only once its layout for this box is decided (no first frame at the wrong size)
  const boardPending = shown0?.kind === "whiteboard" && !avail;
  // round 3 forge: the stage frames a whiteboard's drawn content (boardView.ts), never the empty slate around it
  const frame: BoardFrame | null = useMemo(() => (artifact?.kind === "whiteboard" ? boardFrame(artifact.script as never) : null), [artifact]);
  // a play piece lays its world out FOR the box it is given (play DESIGN §7): it gets the whole tray, not a fixed aspect
  const playFill = (artifact?.kind as string) === "play" && !!avail;
  const design = useMemo(() => (playFill && avail ? { w: Math.max(1, Math.floor(avail.w - 2 * insetFor(avail.w))), h: Math.max(1, Math.floor(avail.h - 2 * insetFor(avail.w))) }
    : frame?.framed ? { w: frame.w, h: frame.h } : validStage(artifact?.stage ?? (artifact?.kind === "whiteboard" ? artifact.script.board : undefined), STAGE_DEFAULT)),
    [artifact, frame, playFill, avail]);
  // the rail band for a Studio v2 world on a phone-width tray
  const railPx = !!avail && avail.w <= PHONE_TRAY_MAX_W && artifact?.kind === "stagecraft" ? (young ? RAIL_PX_YOUNG : RAIL_PX) : 0;
  const fit: StageFit | null = useMemo(() => (avail && !boardPending ? boxFor(avail, design, railPx) : null), [avail, design, railPx, boardPending]);
  // the device check: decided from the box the piece actually got (never from a viewport guess)
  useEffect(() => {
    if (!fit || !given0 || given0.kind !== "stagecraft" || twinFor === slot.slotId) return;
    const s = fit.w / SV2.world;
    if (SV2.label * s < DEVICE_MIN_LABEL_PX || SV2.target * s < DEVICE_MIN_TARGET_PX) {
      if (twinBoardOf(given0)) setTwinFor(slot.slotId);
    }
  }, [fit, given0, twinFor, slot.slotId]);
  const reducedMotion = useReducedMotion();
  const state = swap ? "fallback_shown" : slot.state;
  // round 3 forge: a slot that ENDED with nothing to show (the board was refused by the gate or failed: the wire says
  // failed and no artifact came; or the server retired the piece) — measured as the commonest broken view of the round 3
  // acceptance runs (an empty white box under her line) — is reported once; the Desk gives the tray back (patch 07)
  const emptied = useRef<string | null>(null);
  useEffect(() => {
    const ended = !twin && !swap && (gone || ((slot.state === "fallback_shown" || slot.state === "failed") && !slot.artifact));
    if (!ended || emptied.current === slot.slotId) return;
    emptied.current = slot.slotId;
    onEvent?.({ type: "empty", slotId: slot.slotId });
  }, [gone, slot.state, slot.artifact, slot.slotId, twin, swap, onEvent]);
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
    // round 3 forge: a play level whose layout refused this box, or an engine that failed, shows its board twin (when it
    // carries one) instead of the empty ground
    if (e.type === "error" && (artifact?.kind === "stagecraft" || (artifact?.kind as string) === "play") && twinBoardOf(artifact)) setTwinFor(slot.slotId);
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
  }, [artifact, lessonId, slot.intentId, slot.slotId]);

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
    if (Renderer && frame?.framed && artifact.kind === "whiteboard") {
      // the camera: the whole board drawn at the frame's scale, shifted so the frame fills the box (the box clips)
      const k = fit.w / frame.w;
      const B = artifact.script.board;
      body = (
        <div className="st-frame" style={{ position: "absolute", left: Math.round(-frame.x * k), top: Math.round(-frame.y * k), width: Math.round(B.w * k), height: Math.round(B.h * k) }} data-frame={frame.zoom}>
          <Renderer key={`${artifact.kind}:${epoch}`} artifact={artifact as never} px={{ w: Math.round(B.w * k), h: Math.round(B.h * k) }} design={{ w: B.w, h: B.h }} reducedMotion={reducedMotion} young={young} lang={lang} onEvent={emit} />
        </div>
      );
    } else if (Renderer) body = <Renderer key={`${artifact.kind}:${epoch}`} artifact={artifact as never} px={{ w: fit.w, h: fit.h }} design={design} reducedMotion={reducedMotion} young={young} lang={lang} onEvent={emit} />;
  }
  // (a play piece carries its own controls and doors: the stage's corner control would sit on its goal rail — seen on a
  // 360 phone in play mode, round 3 forge after-run: it covered "2 cheez alag")
  const controls = !!artifact && artifact.kind !== "whiteboard" && (artifact.kind as string) !== "play" && interactive && !!lessonId;
  // the corner control sits outside the box when the stage has room beside it (tablet / desktop), else on its corner
  const ctrlStyle = fit ? (fit.x >= CTRL + 8 ? { left: fit.x + fit.w + 4, top: fit.y } : { left: fit.x + fit.w - CTRL - 4, top: fit.y + 4 }) : undefined;
  const menuStyle = ctrlStyle && avail ? menuPlacement(ctrlStyle, avail) : undefined;
  return (
    <div ref={ref} className={`st-stage${reducedMotion ? " is-still" : ""}`} data-testid="studio-stage" data-state={state} data-phase={phase} data-kind={artifact?.kind}
      data-legible={twin ? "twin" : undefined} data-framed={frame?.framed ? "1" : undefined} data-young={young ? "1" : undefined}>
      {card && fit && (
        <div className="st-cardhead" data-testid="beat-card" data-kind={card.kind} style={{ left: fit.x, top: fit.y + 2, width: fit.w, height: headPx - 6 }}>
          <span className="st-chip-kind">{tw2h(`card.${card.kind}` as "card.picture")}</span>
          <span className="st-beat" aria-label={tw2h("card.beat", { n: card.n })}>
            {Array.from({ length: Math.min(card.n, 8) }, (_, i) => <i key={i} className={i < card.n - 1 ? "is-done" : "is-now"} aria-hidden="true" />)}
          </span>
          {card.checkpointAhead && <span className="st-chip-check">{tw2h("card.checkpoint")}</span>}
        </div>
      )}
      <div className={`st-box st-${phase}`} data-testid="studio-box" data-rail={railPx > 0 ? "1" : undefined}
        style={fit ? { width: fit.w, height: fit.h, left: fit.x, top: fit.y + headPx, ...(railPx > 0 ? { ["--rail" as string]: `${railPx}px` } : {}) } : { visibility: "hidden" }}>
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
