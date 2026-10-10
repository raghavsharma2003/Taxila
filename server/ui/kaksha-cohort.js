// The Kaksha owner-test cohort (BUILD-SPEC §3, patch K-P10; the same shape as server/duplex/config.js liveCohort).
//   TAXILA_UI_KAKSHA = comma-separated guardian accounts, each a lower-case email OR the sha256 hex of one (prefer the
//                      hash: the env then carries no address).
// GET /api/me (and /api/child/boot, which folds it) answers `ui: { kaksha: true }` only for a signed-in guardian on that
// list; everyone else gets `ui: { kaksha: false }`. In production builds Kaksha is ON exactly when the server said true
// (no URL step; ?ui=classic turns it off on a device; src/ui-v3/kaksha/flag.ts kakshaDecision), and typing ?ui=kaksha does
// nothing for anyone outside the cohort. The answer never reveals the list. Presentation only: no safety or data switch.
// Unset or empty: nobody (the default). Removing the env var and restarting the revision turns it off for everyone.
import { createHash } from "node:crypto";

const sha256 = (s) => createHash("sha256").update(s).digest("hex");

/** The cohort from the env: a Set of sha256(lower-case email) (plain emails are hashed on read). */
export function kakshaCohort(env = process.env) {
  const out = new Set();
  for (const raw of String(env.TAXILA_UI_KAKSHA ?? "").split(",")) {
    const v = raw.trim().toLowerCase();
    if (!v) continue;
    out.add(/^[0-9a-f]{64}$/.test(v) ? v : sha256(v));
  }
  return out;
}

/** The `ui` block of GET /api/me for this guardian (row with `email`). Pure given env. */
export function uiFlagsFor(guardian, env = process.env) {
  const e = String(guardian?.email ?? "").trim().toLowerCase();
  const cohort = kakshaCohort(env);
  return { kaksha: !!e && cohort.size > 0 && cohort.has(sha256(e)) };
}
