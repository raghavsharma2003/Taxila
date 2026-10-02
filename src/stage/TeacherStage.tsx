// StageFrame + the illustrated teacher (PRODUCT-DESIGN §3.1 layers 1-2, §3.5). The frame owns the room,
// framing, the computer-teacher badge and the face slot; the face is the 2D illustrated teacher by default
// and a 3D <TutorStage> later (avatar-v1-stack mounts into this same frame via `face`).
//
// ReactionGate (PD-G7): the face state comes from the four floor states only, plus `delighting`, which the
// lesson screen raises ONLY from a Director `affect: insight | effort` tag (never from correctness, a count or
// a streak) through useDelight (src/stage/useDelight.ts): ONE gate per lesson, not per stage instance, since
// the stage remounts at every layout change. It plays at one fixed intensity.
import type { CSSProperties, ReactNode } from "react";
import { TeacherFace, type LevelSource } from "./TeacherFace.tsx";
import type { FaceState, GazeTarget, StageOrientation } from "./faceController.ts";
import "./stage.css";

export type FloorState = "your_turn" | "listening" | "thinking" | "speaking";

export interface TeacherStageProps {
  /** The four-state floor (src/lesson status), or null before/after a live lesson (idle). */
  floor: FloorState | null;
  /** The lesson's delight window is open (useDelight: gated once per lesson, timed from her audio start). */
  delighting?: boolean;
  teacherId?: string | null;
  teacherName?: string;
  band: string;
  /** Her output meters (link teacher meter + replay meter). */
  mouth: LevelSource[];
  mic?: LevelSource;
  gaze?: GazeTarget;
  orientation?: StageOrientation;
  framing?: "medium" | "close";
  reducedMotion?: boolean;
  /** Young: the persistent non-verbal computer-teacher badge in the stage corner (§3.5 disclosure). */
  badge?: boolean;
  /** Older B4: plain surface instead of the room. */
  plainRoom?: boolean;
  /** Replace the illustrated face (3D tutor slot). */
  face?: ReactNode;
  /** Tap on her: the Young "help" gesture / the done-home request route. */
  onTap?: () => void;
  tapLabel?: string;
  className?: string;
  style?: CSSProperties;
}

export function TeacherStage(p: TeacherStageProps) {
  const state: FaceState = !p.floor ? "idle" : p.delighting && p.floor === "speaking" ? "delighted" : p.floor;

  const body = p.face ?? (
    <TeacherFace
      state={state}
      teacherId={p.teacherId}
      band={p.band}
      gaze={p.gaze}
      orientation={p.orientation}
      mouth={p.mouth}
      mic={p.mic}
      reducedMotion={p.reducedMotion}
      framing={p.framing}
      className="tx-stage-face"
    />
  );

  const Wrapper = p.onTap ? "button" : "div";
  return (
    <Wrapper
      type={p.onTap ? "button" : undefined}
      className={`tx-stage ${p.plainRoom ? "tx-stage--plain" : ""} ${p.className ?? ""}`}
      style={p.style}
      data-face-state={state}
      data-framing={p.framing ?? "medium"}
      onClick={p.onTap}
      aria-label={p.onTap ? p.tapLabel ?? p.teacherName ?? "teacher" : undefined}
    >
      {!p.plainRoom && <Room />}
      {body}
      {p.badge && <ComputerBadge />}
    </Wrapper>
  );
}

/** A static, low-detail classroom corner: never animated. */
function Room() {
  return (
    <svg className="tx-stage-room" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="200" height="120" fill="var(--tx-room-wall)" />
      <rect y="92" width="200" height="28" fill="var(--tx-room-floor)" />
      <rect x="132" y="14" width="46" height="34" rx="3" fill="var(--tx-room-window)" stroke="var(--tx-room-line)" strokeWidth="1.5" />
      <path d="M155 14 V48 M132 31 H178" stroke="var(--tx-room-line)" strokeWidth="1.2" />
      <rect x="14" y="18" width="62" height="40" rx="3" fill="var(--board)" stroke="var(--board-frame)" strokeWidth="3" />
      {/* kolam dot grid, ≤ 6% opacity */}
      <g fill="var(--ink)" opacity="0.06">
        {Array.from({ length: 30 }, (_, k) => (
          <circle key={k} cx={14 + (k % 6) * 6} cy={68 + Math.floor(k / 6) * 4.5} r="1.1" />
        ))}
      </g>
    </svg>
  );
}

/** "Computer teacher" badge: a screen with a simple face. Non-verbal; its name is for assistive tech. */
function ComputerBadge() {
  return (
    <span className="tx-stage-badge" role="img" aria-label="computer teacher">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2.5" y="3.5" width="19" height="13" rx="2.5" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.6" />
        <circle cx="9" cy="9.5" r="1.2" fill="var(--ink)" />
        <circle cx="15" cy="9.5" r="1.2" fill="var(--ink)" />
        <path d="M9 12.5 Q12 14.5 15 12.5" fill="none" stroke="var(--ink)" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M8 20.5 H16 M12 16.5 V20.5" stroke="var(--ink)" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </span>
  );
}
