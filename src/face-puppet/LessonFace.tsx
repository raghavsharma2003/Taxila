// <LessonFace>: a drop-in for <TutorFace> (same props) that shows the style-C 2D puppet wherever the puppet IS the
// tutor (concept C = Asha) and face.puppet2d is on (default on), and TutorFace everywhere else. Patch 03 swaps the import
// in src/ui/teacher/Teacher.tsx (the live lesson's TeacherWindow, Summary, TroubleScreen and the namer all render
// through it), so the lesson tile gets the puppet without touching the Desk.
//   tier E / voiceOnly → TutorFace (the child chose voice-and-board: no face at all);
//   tier D (form plate / still) → the puppet's rest poster (no WebGL), the same face as the live one;
//   otherwise → the live puppet, which falls back to TutorFace itself if it cannot run.
import { TutorFace, faceTutor, type TutorFaceProps } from "../avatar/TutorFace.tsx";
import { PuppetFace, PUPPET_TUTORS } from "./PuppetFace.tsx";
import { puppet2dEnabled } from "./flag.ts";

export function LessonFace(p: TutorFaceProps) {
  const tutor = faceTutor(p.tutorId, String(p.band));
  if (!puppet2dEnabled() || !PUPPET_TUTORS.has(tutor.id) || p.tier === "E" || p.voiceOnly) return <TutorFace {...p} />;
  return (
    <PuppetFace tutorId={tutor.id} band={String(p.band)} status={p.status} teacher={p.teacher} mic={p.mic} reducedMotion={p.reducedMotion}
      gentle={p.gentle} affect={p.affect ?? null} framing={p.framing ?? "medium"} still={p.tier === "D"} lang={p.lang} className={p.className} />
  );
}
