// <Teacher>: the one teacher face for every surface (PRODUCT-DESIGN-V2 §8, §13.1). It wraps <LessonFace>
// (src/face-puppet/LessonFace.tsx): Asha is the 2D puppet (live, or her rest still for form plate / still and on every
// fallback); the voice ring when the child chose voice-and-board (tier E); src/avatar/TutorFace's 3D head or plate only
// for a lesson still pinned to a parked tutor. Staged on the lesson ground (--stage + the warm --stage-pool, or the
// painted bg/stage-* when that art exists and the tier can afford it), so every screen shows the same person as the lesson.
//
// The AI disclosure goes with her at every size (§6.3.4, §8):
//  - label="below": "{T} · AI teacher" as plain, non-interactive text under the window (no pill, no border);
//  - label="tag":   an "AI" tag on the face's lower-left edge (SpeechRow, Keyboard), accessible name "{T}, AI teacher";
//  - label="none":  only when the caller prints the label itself.
// The 3D canvas is aria-hidden behind the role="img" host (TutorFace), and her state is exposed through the dock.
import type { CSSProperties } from "react";
// V4 (face.puppet2d, default on): the style-C 2D puppet where the puppet is the tutor; TutorFace otherwise.
import { LessonFace as TutorFace } from "../../face-puppet/LessonFace.tsx";
import type { Emotion } from "../../avatar/behaviour.ts";
import type { FaceTier } from "../../avatar/tier.ts";
import type { TapSource } from "../../avatar/tap.ts";
import { Art } from "../Art.tsx";
import { t } from "../copy.ts";
import { useTeacher } from "./useTeacher.ts";
import "./teacher.css";import { Protege, type ProtegeKind, type ProtegeMood } from "./Protege.tsx";


/** The eight floor states of PRODUCT-DESIGN-V2 §4.1. */
// the floor → face mapping lives in ./floor.ts (plain TS, so the tests can import it); re-exported for the callers
export { faceStatusOf, type TeacherFloor } from "./floor.ts";
import { faceStatusOf, type TeacherFloor } from "./floor.ts";

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
  /** The young band's teach-back protégé beside her (./Protege.tsx), or null. */
  protege?: { kind: ProtegeKind; mood: ProtegeMood } | null;
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
          name={rec.name}
          className="teacher-face-host"
        />
        {p.protege && (
          <Protege kind={p.protege.kind} mood={p.protege.mood} reducedMotion={p.reducedMotion}
            // not while the child is talking: she listens with her eyes on the child (behaviour.ts lookAt drops a look
            // in LISTENING and THINKING), so a glance cue then was emitted every 3.6 s and never seen (audit FACE-05)
            glance={p.floor === "speaking" || p.floor === "your_turn"} />
        )}
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
