// <LessonFace>: a drop-in for <TutorFace> (same props) that shows the 2D puppet wherever the puppet IS the tutor
// (Asha), and TutorFace only for a tutor the puppet is not (a lesson pinned to the parked Arjun).
// Patch 03 swaps the import in src/ui/teacher/Teacher.tsx (the live lesson's TeacherWindow, Summary, TroubleScreen and
// every other <Teacher> render through it).
//   tier E / voiceOnly → TutorFace's voice ring (the child chose voice-and-board: no face at all);
//   tier D (form plate / still), the puppet switched off (device ?puppet=0, build, or the server's TAXILA_FACE_PUPPET2D=0)
//     → the look's rest still (no WebGL), the same face as the live one;
//   otherwise → the live puppet, which holds that same still by itself if it cannot run.
// No path shows Asha as TutorFace's Plate2D vector or 3D head: no fallback ever changes the face (round 7).
import { TutorFace, faceTutor, type TutorFaceProps } from "../avatar/TutorFace.tsx";
import { PuppetFace, PUPPET_TUTORS } from "./PuppetFace.tsx";
import { puppet2dEnabled, puppetServerKnownOff } from "./flag.ts";

export function LessonFace(p: TutorFaceProps) {
  const tutor = faceTutor(p.tutorId, String(p.band));
  if (!PUPPET_TUTORS.has(tutor.id) || p.tier === "E" || p.voiceOnly) return <TutorFace {...p} />;
  const off = !puppet2dEnabled() || puppetServerKnownOff();
  return (
    <PuppetFace tutorId={tutor.id} band={String(p.band)} status={p.status} teacher={p.teacher} mic={p.mic} reducedMotion={p.reducedMotion}
      gentle={p.gentle} affect={p.affect ?? null} framing={p.framing ?? "medium"} still={off || p.tier === "D"} lang={p.lang} name={p.name} className={p.className} />
  );
}
