// The teacher record for a surface (PRODUCT-DESIGN-V2 §8: one character record supplies name, pronouns, look and
// stills to every surface). Reads shared/tutors.js through faceTutor(), the same resolver the face uses, so the
// name on the label and the face in the window can never be two different people. The roman display name is the
// only chrome name (§5.3: no Devanagari form in chrome).
//
// The child names the teacher (decision child-names-teacher): the name they gave the character reaches every surface
// through TeacherNameContext — ChildShell provides the child's saved name, and the lesson provides the name PINNED at
// lesson start (LessonStartResponse.teacher.name), so a rename never changes an open lesson. Look, pronouns, voice
// and stills stay the character's; only the name changes, and the "AI teacher" label goes with it unchanged.
import { createContext, createElement, useContext, useMemo, type ReactNode } from "react";
import { faceTutor } from "../../avatar/TutorFace.tsx";
import { pronounsFor, type Pronouns } from "../copy.ts";

export interface TeacherRecord {
  id: string;
  name: string;
  /** The look's own name (Asha, Arjun, Uma): what "Reset" goes back to. Equal to `name` when the child kept it. */
  characterName: string;
  pronouns: Pronouns;
  signatureColor: string;
  /** Interim rig stills (§8, scripts/teacher-stills.mjs): public/assets/gen/teacher/<id>/<pose>.webp. */
  stills: { portrait: string; wave: string; resting: string; reading: string; watering: string; telescope: string };
}

/** The name the child gave a character: `id` is the character it belongs to (a name never follows a switch). */
export interface TeacherNameValue { id: string | null | undefined; name: string | null | undefined }
const TeacherNameContext = createContext<TeacherNameValue | null>(null);

export function TeacherNameProvider({ id, name, children }: TeacherNameValue & { children?: ReactNode }) {
  const value = useMemo(() => ({ id, name }), [id, name]);
  return createElement(TeacherNameContext.Provider, { value }, children);
}

export function useTeacherName(): TeacherNameValue | null {
  return useContext(TeacherNameContext);
}

/** @param name  the name the child gave this character (null/empty: the character's own). */
export function teacherRecord(id: string | null | undefined, band: string, name?: string | null): TeacherRecord {
  const t = faceTutor(id, band);
  const still = (pose: string) => `teacher/${t.id}/${pose}`;
  const own = t.displayName.roman;
  return {
    id: t.id,
    name: name && name.trim() ? name.trim() : own,
    characterName: own,
    pronouns: pronounsFor(t.look.presentedGender),
    signatureColor: t.look.signatureColor,
    stills: {
      portrait: still("portrait"), wave: still("wave"), resting: still("resting"),
      reading: still("reading"), watering: still("watering"), telescope: still("telescope"),
    },
  };
}

/** The record under the name in context, when the context is about this same character. */
export function useTeacher(id: string | null | undefined, band: string): TeacherRecord {
  const ctx = useContext(TeacherNameContext);
  const resolved = faceTutor(id, band).id;
  const name = ctx && faceTutor(ctx.id, band).id === resolved ? ctx.name : null;
  return useMemo(() => teacherRecord(id, band, name), [id, band, name]);
}
