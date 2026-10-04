// The stage frame and the teacher's presence in the lesson (DESIGN-V3 §5-§6).
//
// Stage contract (§6): the stage owns the box, the artifact adapts. One absolutely-positioned slot (= stage − the 62 px
// HUD rail when there is rail content); artifacts declare a design canvas and fit with xMidYMid meet; letterbox bands take
// the stage background; nothing ever scrolls; the top-left label zone and the top-right PiP zone stay clear. A swap is a
// 420 ms cross-fade with a 0.98 → 1 scale, and the outgoing piece is held until the incoming one has painted, so the stage
// is never empty. RS-4 owns what draws INSIDE the slot; this file owns the slot.
//
// The teacher: on wide screens a large tile in the side column, on phones a PiP in the stage's reserved corner. Only one
// is mounted at a time (one live face per screen; see TeacherFace.tsx).
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon, type IconName } from "./Icon.tsx";
import { FaceSlot, type FaceSlotProps } from "./TeacherFace.tsx";
import { floorView, type FloorOpts, type V3Floor } from "./floor.ts";
import { cx } from "./primitives.tsx";
import { MOTION } from "./motion.ts";

export type ArtifactKind = "board" | "animation" | "game" | "explorable" | "image" | "simulation";
const KIND: Record<ArtifactKind, { label: string; icon: IconName }> = {
  board: { label: "Board", icon: "pencil" },
  animation: { label: "Animation", icon: "film" },
  game: { label: "Game", icon: "gamepad" },
  explorable: { label: "Explorable", icon: "hand" },
  image: { label: "Image", icon: "eye" },
  simulation: { label: "Simulation", icon: "target" },
};

/** Allowed design canvases (§6.2). Artifacts pick one; the slot letterboxes it. */
export const CANVASES = { square: [1000, 1000], board: [1000, 760], wide: [1000, 625], cinema: [1600, 900] } as const;
/** Safe zones as fractions (§6.3): label top-left 18% × 12%; PiP square = 26% of the slot's short side. */
export const SAFE = { labelW: 0.18, labelH: 0.12, pip: 0.26 } as const;
/** Minimum sizes in canvas units per 1000 of width (§6.4). */
export const MIN_UNITS = { label: 38, value: 48, stroke: 4, target: 130 } as const;

export function useWide(): boolean {
  const q = "(min-width: 900px) and (min-aspect-ratio: 5/4)";
  const get = () => typeof matchMedia !== "undefined" && matchMedia(q).matches;
  const [wide, setWide] = useState(get);
  useEffect(() => {
    if (typeof matchMedia === "undefined") return;
    const m = matchMedia(q);
    const on = () => setWide(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return wide;
}

/** Holds the outgoing artifact until the incoming one has painted, then cross-fades (never an empty stage). */
function StageSwap({ artifactKey, children, reducedMotion }: { artifactKey: string; children: ReactNode; reducedMotion?: boolean }) {
  const [outgoing, setOutgoing] = useState<{ key: string; node: ReactNode } | null>(null);
  const prev = useRef<{ key: string; node: ReactNode }>({ key: artifactKey, node: children });
  useEffect(() => {
    if (prev.current.key !== artifactKey) setOutgoing(prev.current);
    prev.current = { key: artifactKey, node: children };
  });
  useEffect(() => {
    if (!outgoing) return;
    const t = setTimeout(() => setOutgoing(null), reducedMotion ? 1 : MOTION.stage);
    return () => clearTimeout(t);
  }, [outgoing, reducedMotion]);
  return (
    <>
      {outgoing && outgoing.key !== artifactKey && <div key={`out-${outgoing.key}`} className="v3-artifact is-out" aria-hidden="true">{outgoing.node}</div>}
      <div key={artifactKey} className="v3-artifact is-in">{children}</div>
    </>
  );
}

export interface StageFrameProps {
  kind: ArtifactKind;
  /** Changing this swaps the artifact with the continuity cross-fade. */
  artifactKey: string;
  children: ReactNode;
  /** Accessible description of what is on the stage. */
  label: string;
  /** Rail content (your-move cue, readouts, game HUD). Present = the slot keeps clear of the 62 px rail. */
  rail?: ReactNode;
  /** The phone PiP (only on narrow layouts). */
  pip?: ReactNode;
  /** Overlays that sit above the artifact on glass (Later pill, a parked card). */
  overlay?: ReactNode;
  /** Child holds the floor: the slot ignores new reveals (callers queue them); shown as data-frozen for QA. */
  frozen?: boolean;
  reducedMotion?: boolean;
}

export function StageFrame({ kind, artifactKey, children, label, rail, pip, overlay, frozen, reducedMotion }: StageFrameProps) {
  const k = KIND[kind];
  return (
    <section className={cx("v3-stage", rail != null && "has-rail")} aria-label={label} data-kind={kind} data-frozen={frozen ? "" : undefined}>
      <div className="v3-stage-label"><span className="v3-tag v3-tag--glass"><Icon name={k.icon} size={13} />{k.label}</span></div>
      <div className="v3-stage-slot" data-stage-slot="">
        <StageSwap artifactKey={artifactKey} reducedMotion={reducedMotion}>{children}</StageSwap>
      </div>
      {pip}
      {overlay}
      {rail != null && <div className="v3-rail-hud">{rail}</div>}
    </section>
  );
}

/** The your-move cue (the screen's one volt while it is lit). */
export function YourMove({ children, hint, icon = "hand", lit }: { children: ReactNode; hint?: ReactNode; icon?: IconName; lit: boolean }) {
  return (
    <div className={cx("v3-yourmove", lit && "is-lit")} data-volt={lit ? "" : undefined} aria-hidden={!lit || undefined}>
      <span className="v3-yourmove-k"><Icon name={icon} size={16} /></span>
      <span>{children}</span>
      {hint && <span className="v3-yourmove-hint">{hint}</span>}
    </div>
  );
}

export function Readout({ label, value, on = true }: { label: string; value: ReactNode; on?: boolean }) {
  return <div className={cx("v3-readout-chip", on && "is-on")}>{label} <b>{value}</b></div>;
}

// ---------- the teacher ----------

export interface TeacherPresence extends Omit<FaceSlotProps, "size" | "status"> {
  name: string;
  floor: V3Floor;
  floorOpts?: FloorOpts;
}

/** Wide layouts: the large tile with name, "AI teacher" (safety floor: every screen naming her says so) and the state tag. */
export function TeacherTile({ name, floor, floorOpts, ...face }: TeacherPresence) {
  const v = floorView(floor, floorOpts);
  return (
    <div className={cx("v3-tile", v.ring && "is-speaking")} data-floor={floor}>
      <FaceSlot {...face} status={v.face} size="tile" />
      <div className="v3-tile-name">
        <span>{name} · AI teacher</span>
        <span className="v3-tile-tag" aria-live="polite">{v.tag}</span>
      </div>
    </div>
  );
}

/** Phones: the PiP in the stage's reserved top-right corner. */
export function TeacherPip({ name, floor, floorOpts, ...face }: TeacherPresence) {
  const v = floorView(floor, floorOpts);
  return (
    <div className={cx("v3-pip", v.ring && "is-speaking")} data-floor={floor} role="img" aria-label={`${name}, AI teacher, ${v.tag.toLowerCase()}`}>
      <FaceSlot {...face} status={v.face} size="pip" />
      <div className="v3-pip-name" aria-hidden="true">{name}</div>
    </div>
  );
}
