// The teacher record for a surface (PRODUCT-DESIGN-V2 §8: one character record supplies name, pronouns, look and
// stills to every surface). Reads shared/tutors.js through faceTutor(), the same resolver the face uses, so the
// name on the label and the face in the window can never be two different people. The roman display name is the
// only chrome name (§5.3: no Devanagari form in chrome).
import { useMemo } from "react";
import { faceTutor } from "../../avatar/TutorFace.tsx";
import { pronounsFor, type Pronouns } from "../copy.ts";

export interface TeacherRecord {
  id: string;
  name: string;
  pronouns: Pronouns;
  signatureColor: string;
  /** Interim rig stills (§8, scripts/teacher-stills.mjs): public/assets/gen/teacher/<id>/<pose>.webp. */
  stills: { portrait: string; wave: string; resting: string; reading: string; watering: string; telescope: string };
}

export function teacherRecord(id: string | null | undefined, band: string): TeacherRecord {
  const t = faceTutor(id, band);
  const still = (pose: string) => `teacher/${t.id}/${pose}`;
  return {
    id: t.id,
    name: t.displayName.roman,
    pronouns: pronounsFor(t.look.presentedGender),
    signatureColor: t.look.signatureColor,
    stills: {
      portrait: still("portrait"), wave: still("wave"), resting: still("resting"),
      reading: still("reading"), watering: still("watering"), telescope: still("telescope"),
    },
  };
}

export function useTeacher(id: string | null | undefined, band: string): TeacherRecord {
  return useMemo(() => teacherRecord(id, band), [id, band]);
}
