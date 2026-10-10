// <LessonFace>: a drop-in for <TutorFace> (same props) that shows the 2D puppet wherever the puppet IS the tutor
// (Asha) and face.puppet2d is on (default on), and TutorFace everywhere else. Patch 03 swaps the import in
// src/ui/teacher/Teacher.tsx (the live lesson's TeacherWindow, Summary, TroubleScreen and every other <Teacher> render
// through it), so the lesson tile gets the puppet without touching the Desk.
//   tier E / voiceOnly → TutorFace (the child chose voice-and-board: no face at all);
//   tier D (form plate / still) → the puppet's rest poster (no WebGL), the same face as the live one;
//   otherwise → the live puppet, which falls back by itself if it cannot run.
// The look (./look.ts, round 4): under lamp1, the grown-up Asha, the puppet switched off (device, build or the server's
// TAXILA_FACE_PUPPET2D=0) shows her lamp1 STILL, never TutorFace's Plate2D vector: no fallback ever changes the face.
import { TutorFace, faceTutor, type TutorFaceProps } from "../avatar/TutorFace.tsx";
import { PuppetFace, PUPPET_TUTORS, holdsOwnStill } from "./PuppetFace.tsx";
import { puppet2dEnabled, puppetServerKnownOff } from "./flag.ts";
import { faceLookNow } from "./look.ts";

export function LessonFace(p: TutorFaceProps) {
  const tutor = faceTutor(p.tutorId, String(p.band));
  if (!PUPPET_TUTORS.has(tutor.id) || p.tier === "E" || p.voiceOnly) return <TutorFace {...p} />;
  const off = !puppet2dEnabled() || puppetServerKnownOff();
  if (off && !holdsOwnStill(faceLookNow())) return <TutorFace {...p} />;
  return (
    <PuppetFace tutorId={tutor.id} band={String(p.band)} status={p.status} teacher={p.teacher} mic={p.mic} reducedMotion={p.reducedMotion}
      gentle={p.gentle} affect={p.affect ?? null} framing={p.framing ?? "medium"} still={off || p.tier === "D"} lang={p.lang} className={p.className} />
  );
}
