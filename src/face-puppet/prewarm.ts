// Getting the lesson's face ready while the child is still on the home (round 7 face-prewarm-for-first-sound).
// Two parts, both no-ops when the face would not be live:
//   - the WARM HAND-OFF (PuppetFace.tsx park/adopt): the home's live stage, when its rig draws in a worker, is parked for
//     HANDOFF_PARK_MS on unmount, not the 1.5 s of a layout switch, and the lesson's face adopts it with its own meters
//     (stage.retarget). So the lesson starts with a face that is already loaded, warmed and drawing: no chunk, no worker
//     boot, no pack decode, no warm-up, and no poster to fade from. A main-thread rig is never handed off (its frames
//     would compete with Start → her first sound; the lesson then arms its own stage at her first audio, as before).
//   - the STILLS: the other framing's rest poster and the light-mouth sprites decode at idle, so a lesson face that
//     cannot be handed a stage (a lite device, a main-thread rig, a long start) paints her at once.
import { LITE_KEYS, LITE_LOOKS, liteBase } from "./lite.ts";
import { puppetPoster, type PuppetLook } from "./assets.ts";
import { faceHandoffEnabled } from "./flag.ts";

/** How long a worker-backed home stage waits for the lesson's face (ms): Start → the lesson route mounts its face is
 *  a navigation plus the lazy lesson chunk (preloaded on the home: src/child/preload.ts), well under this. Parked, the
 *  stage draws nothing; only its worker's decoded layers and GL context are held. */
export const HANDOFF_PARK_MS = 10_000;

/** The key a stage can be handed off under: the same person in the same look and band (the meters may differ). */
export const handoffKey = (tutor: string, look: string, band: string) => `${tutor}|${look}|${band}`;

/** Whether a parked stage may be adopted by a face with other meters. */
export function canHandOff(s: { isRevealed: boolean; offThread: boolean }): boolean {
  return s.isRevealed && s.offThread && faceHandoffEnabled();
}

/** The still URLs a face of this look may paint: both framings' posters and, for a lite look, its mouth sprites. */
export function stillUrls(look: PuppetLook): string[] {
  const u = [puppetPoster("medium", look), puppetPoster("close", look)];
  if (LITE_LOOKS.includes(look)) for (const k of LITE_KEYS) if (k !== "closed") u.push(`${liteBase(look)}${k}.webp`);
  return u;
}

const warmed = new Set<string>();
/** Decode the stills of a look once per page (idle work; failures are silent: the face loads them itself). */
export function prewarmStills(look: PuppetLook): void {
  if (typeof Image === "undefined") return;
  for (const url of stillUrls(look)) {
    if (warmed.has(url)) continue;
    warmed.add(url);
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    img.decode?.().catch(() => {});
  }
}
/** Tests. */
export const resetPrewarm = () => warmed.clear();
