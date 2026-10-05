// The FaceSlot adapter (src/ui-v3/TeacherFace.tsx contract): `puppetFace` is a FaceRenderer. Install it once at boot with
// installPuppetFace() (patch 03 wires it in src/main.tsx); with the flag off, or for a tutor the puppet is not (concept
// C is Asha), the slot keeps the in-house renderer unchanged.
//   - size tile / pip → the live puppet (medium / close framing), at most one live face per screen (the slot's rule);
//   - size card / chip, or `still` → the rest poster (no WebGL context), so a screen of teacher cards holds no GL.
import { inHouseFace, setFaceRenderer, type FaceRenderer, type FaceSlotProps } from "../ui-v3/TeacherFace.tsx";
import { faceTutor } from "../avatar/TutorFace.tsx";
import type { TapSource } from "../avatar/tap.ts";
import { PuppetFace, PUPPET_TUTORS } from "./PuppetFace.tsx";
import { puppet2dEnabled } from "./flag.ts";

const NO_METERS: TapSource[] = [];

export const puppetFace: FaceRenderer = (p: FaceSlotProps) => {
  const tutor = faceTutor(p.tutorId, p.band);
  if (!PUPPET_TUTORS.has(tutor.id)) return inHouseFace(p);
  const still = !!p.still || p.size === "card" || p.size === "chip";
  return (
    <PuppetFace tutorId={tutor.id} band={p.band} status={p.status} teacher={p.teacher ?? NO_METERS} mic={p.mic}
      reducedMotion={p.reducedMotion} framing={p.size === "tile" ? "medium" : "close"} still={still} lang={p.lang}
      className="v3-face-host" />
  );
};

/** Boot hook: the puppet becomes the face of every FaceSlot when face.puppet2d is on (default on). Returns whether it did. */
export function installPuppetFace(): boolean {
  if (!puppet2dEnabled()) return false;
  setFaceRenderer(puppetFace);
  return true;
}
