// <Teacher>: the one teacher face for every surface (PRODUCT-DESIGN-V2 §8, §13.1). It wraps the M0 3D head
// (src/avatar/TutorFace: tier B / B-lite → the procedural head; D → the 2D plate rendered from the same look; E →
// voice ring), staged on the lesson ground (--stage + the warm --stage-pool, or the painted bg/stage-* when that art
// exists and the tier can afford it). The retired 2D clip-art faces (src/ui/TeacherFace's SVG, src/stage/*) now
// route here, so every screen shows the same person as the lesson.
//
// The AI disclosure goes with her at every size (§6.3.4, §8):
//  - label="below": "{T} · AI teacher" as plain, non-interactive text under the window (no pill, no border);
//  - label="tag":   an "AI" tag on the face's lower-left edge (SpeechRow, Keyboard), accessible name "{T}, AI teacher";
//  - label="none":  only when the caller prints the label itself.
// The 3D canvas is aria-hidden behind the role="img" host (TutorFace), and her state is exposed through the dock.
import type { CSSProperties } from "react";
import { TutorFace } from "../../avatar/TutorFace.tsx";
import type { Emotion, FloorStatus } from "../../avatar/behaviour.ts";
import type { FaceTier } from "../../avatar/tier.ts";
import type { TapSource } from "../../avatar/tap.ts";
import { Art } from "../Art.tsx";
import { t } from "../copy.ts";
import { useTeacher } from "./useTeacher.ts";
import "./teacher.css";

/** The eight floor states of PRODUCT-DESIGN-V2 §4.1. */
export type TeacherFloor = "idle" | "speaking" | "showing" | "yielding" | "your_turn" | "listening" | "heard" | "thinking";

/**
 * Floor → the face's status input. yielding leans in on her offset frame like your_turn (TV §7.1); heard holds the
 * listening face (the one 2° nod is identical for every answer); showing talks with her gaze on the tray.
 */
export function faceStatusOf(floor: TeacherFloor | null | undefined): FloorStatus | null {
  switch (floor) {
    case "speaking":
    case "showing":
      return "speaking";
    case "yielding":
    case "your_turn":
      return "your_turn";
    case "listening":
    case "heard":
      return "listening";
    case "thinking":
      return "thinking";
    default:
      return null;
  }
}

export interface TeacherProps {
  teacherId: string | null | undefined;
  band: string;
  floor?: TeacherFloor | null;
  /** Live: the full face. Plate: the D plate (deterministic pixels; tier D). Still: plate without lips. */
  form?: "live" | "plate" | "still";
  /** Her output meters (link teacher meter + replay meter). */
  meters?: TapSource[];
  mic?: { readonly value: number };
  affect?: Emotion | null;
  reducedMotion?: boolean;
  framing?: "medium" | "close";
  label?: "below" | "tag" | "none";
  /** The stage ground behind her (the lesson TeacherWindow); off for the small SpeechRow face. */
  ground?: boolean;
  /** Lights down (lesson running) vs lights up (paper ground). */
  lights?: "down" | "up";
  /** Young: the small computer-teacher picto in the window corner (§6.3.4). */
  aiPicto?: boolean;
  tier?: FaceTier;
  className?: string;
  style?: CSSProperties;
  noProbe?: boolean;
}

export function Teacher(p: TeacherProps) {
  const rec = useTeacher(p.teacherId, p.band);
  const form = p.form ?? "live";
  const tier: FaceTier | undefined = p.tier ?? (form === "live" ? undefined : "D");
  const flatGround = tier === "D" || tier === "E";
  return (
    <figure className={`teacher ${p.className ?? ""}`} style={p.style} data-teacher-id={rec.id} data-lights={p.lights ?? "down"}
      data-label={p.label ?? "below"}>
      <div className={`teacher-window ${p.ground === false ? "teacher-window--bare" : ""}`}>
        {p.ground !== false && (
          <div className="teacher-ground" aria-hidden="true">
            <span className="teacher-ground-paper" />
            <span className="teacher-ground-stage" />
            {/* Painted backdrop on tier A–C only; its softness is painted into the bitmap (no runtime blur). */}
            {!flatGround && <Art id={p.band === "b1" || p.band === "b2" ? "bg/stage-young" : "bg/stage-older"} className="teacher-ground-art" cover fallback={<span />} />}
            <span className="teacher-ground-pool" />
          </div>
        )}
        <TutorFace
          tutorId={rec.id}
          band={p.band}
          status={faceStatusOf(p.floor)}
          teacher={p.meters ?? []}
          mic={p.mic}
          reducedMotion={p.reducedMotion}
          framing={p.framing ?? "medium"}
          tier={tier}
          affect={p.affect ?? null}
          noProbe={p.noProbe}
          lang="english"
          className="teacher-face-host"
        />
        {p.aiPicto && (
          <span className="teacher-aipicto" aria-hidden="true">
            <Art id="picto/ai-teacher" fallback={<AiPicto />} />
          </span>
        )}
        {p.label === "tag" && (
          <span className="teacher-aitag" role="img" aria-label={t("teacher.tag_name", { T: rec.name })} data-ai-tag="">
            {t("teacher.tag")}
          </span>
        )}
      </div>
      {(p.label ?? "below") === "below" && (
        <figcaption className="teacher-label" data-ai-label="">{t("teacher.label", { T: rec.name })}</figcaption>
      )}
    </figure>
  );
}

/** The code-drawn "computer teacher" picto: a small screen with a face line, used until picto/ai-teacher exists. */
function AiPicto() {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="12" rx="2.5" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.6" />
      <circle cx="9.5" cy="10" r="1.1" fill="var(--ink)" />
      <circle cx="14.5" cy="10" r="1.1" fill="var(--ink)" />
      <path d="M9.5 13c1.4 1 3.6 1 5 0 M9 19.5h6 M12 16.5v3" fill="none" stroke="var(--ink)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
