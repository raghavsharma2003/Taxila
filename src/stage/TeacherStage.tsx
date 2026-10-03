// Compatibility shim (PRODUCT-DESIGN-V2 §8, §13.1). The 2D illustrated teacher and its room are retired: every
// caller of <TeacherStage> now gets the ONE teacher, the M0 rig via src/ui/teacher/Teacher.tsx, staged on the
// lesson ground with the "{T} · AI teacher" label. The props are kept so screens owned by other workstreams
// (child home, Hello, the avatar dev page) keep compiling; new code imports Teacher directly.
import type { CSSProperties, ReactNode } from "react";
import type { TapSource } from "../avatar/tap.ts";
import { Teacher, type TeacherFloor } from "../ui/teacher/Teacher.tsx";
import "./stage.css";

export type FloorState = "your_turn" | "listening" | "thinking" | "speaking";

export interface TeacherStageProps {
  floor: FloorState | TeacherFloor | null;
  delighting?: boolean;
  teacherId?: string | null;
  teacherName?: string;
  band: string;
  mouth: TapSource[];
  mic?: { readonly value: number };
  gaze?: string;
  orientation?: string;
  framing?: "medium" | "close";
  reducedMotion?: boolean;
  /** Young: the computer-teacher picto in the window corner. */
  badge?: boolean;
  plainRoom?: boolean;
  face?: ReactNode;
  onTap?: () => void;
  tapLabel?: string;
  className?: string;
  style?: CSSProperties;
}

export function TeacherStage(p: TeacherStageProps) {
  const body = (
    <Teacher teacherId={p.teacherId} band={p.band} floor={p.floor ?? "idle"} meters={p.mouth} mic={p.mic}
      reducedMotion={p.reducedMotion} framing={p.framing} aiPicto={p.badge} affect={p.delighting ? "excited" : null} />
  );
  if (!p.onTap) return <div className={`tx-stage ${p.className ?? ""}`} style={p.style}>{body}</div>;
  return (
    <button type="button" className={`tx-stage tx-stage--tap ${p.className ?? ""}`} style={p.style} onClick={p.onTap}
      aria-label={p.tapLabel ?? p.teacherName ?? "Teacher"}>
      {body}
    </button>
  );
}
