// The face's RUNTIME kill switches (ship5 p2-face). Both ship ON; an operator turns either off on the running Container
// App with an env change (no rebuild, no client deploy):
//   TAXILA_FACE_PUPPET2D=0  → every client that has not yet revealed a puppet shows TutorFace (the pre-puppet face),
//                             the automatic fallback path (src/face-puppet/flag.ts puppetServerAllows, PuppetFace.tsx);
//   TAXILA_DHD_VISEMES=0    → Diya's synthesis goes back to REST exactly as before (server/voice/speech.js, patch 01): no
//                             viseme frames, and the puppet lip-syncs from the audio tap (the judged live path).
// The build-time VITE_FACE_PUPPET2D=0 and the per-device ?puppet=0 remain. No auth: the answer holds no child data.
// The LOOK (round 4 stream 5): TAXILA_FACE_LOOK = r8 (default) | lamp1 picks the puppet pack every client paints
// (src/face-puppet/look.ts; a device's ?look= wins). An unknown value is the default, never an error. lamp1 becomes the
// default only on the owner's yes (BUILD-PLAN §5 release flags): r8, then lamp1 for the owner cohort, then everyone.
// Seam: server/index.js registers `routes` (patch docs/design/ship5/p2-face/patches/03-server-face-config.diff).
import { send } from "../http.js";
import { PUPPET_REV } from "./rev.js";

export const FACE_LOOKS = Object.freeze(["r8", "lamp1"]);

/** TAXILA_FACE_LOOK, or the default pack (PUPPET_REV) for an unset or unknown value. */
export const faceLookOf = (env = process.env) => {
  const v = String(env.TAXILA_FACE_LOOK ?? "").trim().toLowerCase();
  return FACE_LOOKS.includes(v) ? v : PUPPET_REV;
};

/** @returns {{ puppet2d: boolean, visemes: boolean, rev: string, look: string }} */
export const faceConfig = (env = process.env) => ({
  puppet2d: env.TAXILA_FACE_PUPPET2D !== "0",
  visemes: env.TAXILA_DHD_VISEMES !== "0",
  rev: PUPPET_REV,
  look: faceLookOf(env),
});

/** GET /api/face/config: short-cached (a kill reaches new page loads within a minute). */
async function config(_req, res) {
  send(res, 200, faceConfig(), { "cache-control": "public, max-age=60" });
}

export const routes = { "GET /api/face/config": config };
