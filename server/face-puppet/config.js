// The face's RUNTIME kill switches (ship5 p2-face). Both ship ON; an operator turns either off on the running Container
// App with an env change (no rebuild, no client deploy):
//   TAXILA_FACE_PUPPET2D=0  → every client that has not yet revealed a puppet shows TutorFace (the pre-puppet face),
//                             the automatic fallback path (src/face-puppet/flag.ts puppetServerAllows, PuppetFace.tsx);
//   TAXILA_DHD_VISEMES=0    → Diya's synthesis goes back to REST exactly as before (server/voice/speech.js, patch 01): no
//                             viseme frames, and the puppet lip-syncs from the audio tap (the judged live path).
// The build-time VITE_FACE_PUPPET2D=0 and the per-device ?puppet=0 remain. No auth: the answer holds no child data.
// The LOOK (round 4 stream 5): TAXILA_FACE_LOOK = r8 (default) | lamp1 picks the puppet pack every client paints
// (src/face-puppet/look.ts; a device's ?look= wins). An unknown or HELD value is the default, never an error. lamp1 is
// HELD (2026-10-10: its live puppet failed the blind uncanny gate), so TAXILA_FACE_LOOK=lamp1 serves r8; a look that
// passes its gate is added to FACE_LOOKS and becomes the default only on the owner's yes (BUILD-PLAN §5).
// The OWNER COHORT (round 4, 5b): a look that has not been approved for everyone can be shown to the owner's own accounts
// first, server-side, the way TAXILA_DUPLEX_LIVE_FOR works (server/duplex/config.js), never by a URL switch:
//   TAXILA_FACE_LOOK_FOR     comma-separated guardian accounts, each a lower-case email OR the sha256 hex of one;
//   TAXILA_FACE_COHORT_LOOK  the look they get: one of COHORT_FACE_LOOKS (cohort-only looks) or FACE_LOOKS.
// A signed-in guardian on the list gets { look: <cohort look>, cohort: "owner" }; everyone else (no cookie, another
// account, a lookup error, a slow database) gets the global look. A held look is never served, cohort or not, and the
// kill switch (TAXILA_FACE_PUPPET2D=0) is unchanged. The answer never reveals the list; a cookie-bearing answer is
// private and uncached (vary: cookie). Presentation only: the AI disclosure and the safety floor are the same on every look.
// Seam: server/index.js registers `routes` (patch docs/design/ship5/p2-face/patches/03-server-face-config.diff).
import { send } from "../http.js";
import { PUPPET_REV } from "./rev.js";
import { inCohort, liveCohort } from "../duplex/config.js";

/** Looks a client may be told to paint. */
export const FACE_LOOKS = Object.freeze(["r8"]);
/** Looks keyed in src/face-puppet/assets.ts but held (never served): the client keeps the same list (HELD_LOOKS). */
export const HELD_FACE_LOOKS = Object.freeze(["lamp1"]);
/** Looks served ONLY to the owner cohort (a candidate the owner is judging on their own phone): lamp2 (rig2's painted keys,
 *  2026-10-10). The client keeps the same list (COHORT_LOOKS in src/face-puppet/assets.ts). */
export const COHORT_FACE_LOOKS = Object.freeze(["lamp2"]);

/** TAXILA_FACE_LOOK, or the default pack (PUPPET_REV) for an unset, unknown or held value. */
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

/** How long the cohort lookup may take before the global look is answered (the duplex cohort's budget). */
export const FACE_COHORT_LOOKUP_MS = 2500;

/** The cohort's look from the env, or null when unset, unknown or held. */
export function cohortLookOf(env = process.env, cohortLooks = COHORT_FACE_LOOKS) {
  const v = String(env.TAXILA_FACE_COHORT_LOOK ?? "").trim().toLowerCase();
  return cohortLooks.includes(v) || FACE_LOOKS.includes(v) ? v : null;
}

/**
 * The face config for THIS request: the global one, or the owner cohort's look for a signed-in guardian on
 * TAXILA_FACE_LOOK_FOR. `lookup(req)` resolves the signed-in guardian or throws (injected in tests).
 * @returns {Promise<{ puppet2d: boolean, visemes: boolean, rev: string, look: string, cohort?: "owner" }>}
 */
export async function faceConfigFor(req, { env = process.env, lookup = null, timeoutMs = FACE_COHORT_LOOKUP_MS, cohortLooks = COHORT_FACE_LOOKS } = {}) {
  const base = faceConfig(env);
  const look = cohortLookOf(env, cohortLooks);
  const cohort = liveCohort({ TAXILA_DUPLEX_LIVE_FOR: env.TAXILA_FACE_LOOK_FOR });
  if (!look || look === base.look || !cohort.size) return base;
  if (!/(?:^|;\s*)tx_session=/.test(String(req?.headers?.cookie ?? ""))) return base;
  try {
    const find = lookup ?? (async (r) => (await import("../auth.js")).requireGuardian(r));
    let timer;
    const g = await Promise.race([find(req), new Promise((_, rej) => { timer = setTimeout(() => rej(new Error("slow")), timeoutMs); })]).finally(() => clearTimeout(timer));
    if (inCohort(g, cohort)) return { ...base, look, cohort: "owner" };
  } catch {
    /* not signed in, expired, the database away or slow: the global look */
  }
  return base;
}

/** GET /api/face/config: short-cached (a kill reaches new page loads within a minute); an answer that depends on the
 *  cookie (a cohort is configured and the request carries a session) is private and never shared by a cache. */
async function config(req, res) {
  const body = await faceConfigFor(req);
  const cookieDependent = !!String(process.env.TAXILA_FACE_LOOK_FOR ?? "").trim() && /(?:^|;\s*)tx_session=/.test(String(req?.headers?.cookie ?? ""));
  send(res, 200, body, cookieDependent ? { "cache-control": "private, no-store", vary: "cookie" } : { "cache-control": "public, max-age=60", vary: "cookie" });
}

export const routes = { "GET /api/face/config": config };
