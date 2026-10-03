// The TeacherWindow (Face layout) and the SpeechRow (Work layout): the SAME single renderer, resized (§6.3.4).
// The face is never a picture-in-picture over content. The AI disclosure survives at every size: the Face layout
// keeps "{T} · AI teacher" under the window; the SpeechRow puts an "AI" tag on the face's lower-left edge.
import type { TapSource } from "../../avatar/tap.ts";
import type { Floor } from "../../lesson/floor.ts";
import { Teacher } from "../../ui/teacher/Teacher.tsx";
import { Caption } from "./Caption.tsx";
import type { DeskModel } from "./model.ts";

export interface FaceMedia { meters: TapSource[]; mic?: { readonly value: number } }

export function TeacherWindow({ m, media, floor, labelBelow = true }: { m: DeskModel; media: FaceMedia; floor: Floor; labelBelow?: boolean }) {
  return (
    <div className="dk-window" data-testid="teacher-window">
      <Teacher teacherId={m.teacher.id} band={m.band} floor={floor} form={m.faceForm} meters={media.meters} mic={media.mic}
        reducedMotion={m.reducedMotion} label={labelBelow ? "below" : "none"} lights={m.lights} aiPicto={m.family === "young"} affect={m.affect ?? null} />
    </div>
  );
}

export function SpeechRow({ m, media, floor, size }: { m: DeskModel; media: FaceMedia; floor: Floor; size: number }) {
  return (
    <div className="dk-speechrow" data-testid="speech-row">
      <div className="dk-speechrow-face" style={{ width: size, height: size }}>
        <Teacher teacherId={m.teacher.id} band={m.band} floor={floor} form={m.faceForm} meters={media.meters} mic={media.mic}
          reducedMotion={m.reducedMotion} label="tag" ground={false} framing="close" lights={m.lights} affect={m.affect ?? null} />
      </div>
      {m.captionsOn && <Caption text={m.caption.text} speaking={m.caption.speaking} visible={captionVisible(floor)} lang={m.caption.lang} />}
    </div>
  );
}

/** At the hand-over the caption fades to empty (yielding/your_turn): the question lives on the card. */
export const captionVisible = (floor: Floor) => floor === "speaking" || floor === "showing";
