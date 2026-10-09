// GET /api/duplex/config: the hands-free duplex switch at RUNTIME (p1-duplex, owner-ship-five-2026-10-05).
//   TAXILA_DUPLEX=0 | off      → { duplex: "off" }    every lesson not yet started uses today's cascade path (tap-to-talk);
//   TAXILA_DUPLEX=shadow       → { duplex: "shadow" } the engine runs beside today's path and only logs;
//   unset / 1 / on             → { duplex: "on" }.
//
// Round 3 (stream duplex, 2026-10-09): the OWNER-TEST COHORT. Production stays "shadow" for every child (the switch criteria
// are not met: docs/design/round3/duplex/CRITERIA.md), but the owner must be able to try the hands-free teacher on
// taxila.dev on any device without a URL trick:
//   TAXILA_DUPLEX_LIVE_FOR = comma-separated guardian accounts, each a lower-case email OR the sha256 hex of one
//                            (prefer the hash: the env then carries no address).
// While the global mode is "shadow", a request from a SIGNED-IN guardian on that list gets { duplex: "on", cohort: "owner" };
// everyone else (no cookie, another account, a lookup error, a slow database) gets the global mode. The kill switch
// (TAXILA_DUPLEX=off) always wins: no cohort is ever live over it. The answer never reveals the list.
// Presentation and turn-taking only: the safety floor (scanSafety + the model distress read on every committed turn, the AI
// disclosure, the helplines) is identical on both sides of the switch.
import { createHash } from "node:crypto";

export function duplexMode(env = process.env) {
  const v = String(env.TAXILA_DUPLEX ?? "").trim().toLowerCase();
  if (v === "0" || v === "off" || v === "false") return "off";
  if (v === "shadow") return "shadow";
  return "on";
}

const sha256 = (s) => createHash("sha256").update(s).digest("hex");

/** The owner-test cohort from the env: a Set of sha256(lower-case email) (plain emails are hashed on read). */
export function liveCohort(env = process.env) {
  const out = new Set();
  for (const raw of String(env.TAXILA_DUPLEX_LIVE_FOR ?? "").split(",")) {
    const v = raw.trim().toLowerCase();
    if (!v) continue;
    out.add(/^[0-9a-f]{64}$/.test(v) ? v : sha256(v));
  }
  return out;
}

/** Is this guardian (row with `email`) in the cohort? Pure. */
export function inCohort(guardian, cohort) {
  const e = String(guardian?.email ?? "").trim().toLowerCase();
  return !!e && cohort.has(sha256(e));
}

/** How long the cohort lookup may take before the global mode answers (the client itself gives the route 1.5 s). */
export const COHORT_LOOKUP_MS = 600;

/**
 * The mode for this request. `lookup(req)` resolves the signed-in guardian or throws (server/auth.js requireGuardian);
 * injected so the tests run without a database.
 */
export async function modeFor(req, { env = process.env, lookup = null, timeoutMs = COHORT_LOOKUP_MS } = {}) {
  const mode = duplexMode(env);
  if (mode !== "shadow") return { duplex: mode };
  const cohort = liveCohort(env);
  if (!cohort.size) return { duplex: mode };
  const cookie = String(req?.headers?.cookie ?? "");
  if (!/(?:^|;\s*)tx_session=/.test(cookie)) return { duplex: mode };
  try {
    const find = lookup ?? (async (r) => (await import("../auth.js")).requireGuardian(r));
    let timer;
    const g = await Promise.race([find(req), new Promise((_, rej) => { timer = setTimeout(() => rej(new Error("slow")), timeoutMs); })]).finally(() => clearTimeout(timer));
    if (inCohort(g, cohort)) return { duplex: "on", cohort: "owner" };
  } catch { /* not signed in, expired, slow or the database is away: the global mode */ }
  return { duplex: mode };
}

export const duplexConfigRoutes = {
  "GET /api/duplex/config": async (req, res) => {
    const body = await modeFor(req);
    res.statusCode = 200;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.setHeader("cache-control", "no-store");
    // a cohort answer depends on the cookie: never let a shared cache key it on the URL alone
    res.setHeader("vary", "cookie");
    res.end(JSON.stringify(body));
  },
};
