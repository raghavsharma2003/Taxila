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
//
// D5 (2026-10-11, dc-r12dr-duplex-architecture): the cohort's LANE. TAXILA_DUPLEX_LANE=d5 puts a cohort answer on lane D5
// (Azure Voice Live as the ear through /api/duplex/voicelive; server/duplex/voicelive.js) when Voice Live is configured;
// unset / d4 keeps the shipped D4 lane (gpt-live-transcribe over WebRTC). Only cohort answers ever carry { lane: "d5" }:
// every other child keeps today's path. The client falls back to D4 whenever the D5 stream cannot open.
//
// Round 7 (decision D2, dc-r7-handsfree-default): hands-free duplex is the DEFAULT for every child. With the global mode
// "on" (unset / 1 / on) every answer is { duplex: "on" } and carries lane d5 whenever Voice Live is configured, unless
// TAXILA_DUPLEX_LANE=d4 pins D4. The cohort is now an OVERRIDE, not the gate: it only matters while the global mode is
// "shadow" (a staging or incident setting), where it still turns hands-free on for the listed guardians. The kill switch
// TAXILA_DUPLEX=off still wins over everything. The client's fallback order stays invisible: D5, D4, push-to-talk, typed.
import { partialPostOn } from "./childText.js";
import { createHash } from "node:crypto";
import { voiceLiveConfig } from "./voicelive.js";

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

/**
 * The lane from the env: "d5" whenever Voice Live is configured, unless TAXILA_DUPLEX_LANE pins d4 (round 7, D2: D5 is the
 * default lane, the env is the escape hatch); "d4" without a Voice Live config. Pure.
 */
export function duplexLane(env = process.env) {
  const v = String(env.TAXILA_DUPLEX_LANE ?? "").trim().toLowerCase();
  if (v === "d4" || v === "off" || v === "0") return "d4";
  return voiceLiveConfig(env) ? "d5" : "d4";
}
/** @deprecated round 7: the lane is everyone's now (duplexLane). Kept for older imports. */
export const cohortLane = duplexLane;

/** How long the cohort lookup may take. round 3 fix (experience B9): 600 → 2,500 ms, and a lookup that runs out of time
 *  answers { retry: true } beside the global mode (the client asks again) instead of a silent "shadow" for the owner. */
export const COHORT_LOOKUP_MS = 2500;

/**
 * The mode for this request. `lookup(req)` resolves the signed-in guardian or throws (server/auth.js requireGuardian);
 * injected so the tests run without a database.
 */
export async function modeFor(req, { env = process.env, lookup = null, timeoutMs = COHORT_LOOKUP_MS } = {}) {
  const mode = duplexMode(env);
  if (mode === "off") return { duplex: "off" };
  // round 7 (D2): "on" is every child's answer, on the lane the env gives
  const on = duplexLane(env) === "d5" ? { duplex: "on", lane: "d5" } : { duplex: "on" };
  if (mode === "on") return on;
  // "shadow" (staging / incident): the cohort is the override that still turns hands-free on
  const cohort = liveCohort(env);
  if (!cohort.size) return { duplex: mode };
  const cookie = String(req?.headers?.cookie ?? "");
  if (!/(?:^|;\s*)tx_session=/.test(cookie)) return { duplex: mode };
  try {
    const find = lookup ?? (async (r) => (await import("../auth.js")).requireGuardian(r));
    let timer;
    const g = await Promise.race([find(req), new Promise((_, rej) => { timer = setTimeout(() => rej(new Error("slow")), timeoutMs); })]).finally(() => clearTimeout(timer));
    if (inCohort(g, cohort)) return { ...on, cohort: "owner" };
  } catch (e) {
    // not signed in, expired or the database is away: the global mode. Too slow to tell: the global mode AND retry (the
    // client asks once more; never a cohort by accident, never a silent shadow for the owner because Neon was slow)
    if (e?.message === "slow") return { duplex: mode, retry: true };
  }
  return { duplex: mode };
}

export const duplexConfigRoutes = {
  // round 7 (Platform 002): the India D5 relay's ticket (server/duplex/d5route.js d5Ticket; loaded here lazily: no cycle)
  "POST /api/duplex/ticket": async (req, res, body) => {
    const { d5Ticket } = await import("./d5route.js");
    const out = await d5Ticket(req, body);
    res.statusCode = 200;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.setHeader("cache-control", "no-store");
    res.end(JSON.stringify(out));
  },
  /** Round 7 (Studio M4): the child's live partials for in-process listeners (server/duplex/childText.js). */
  "POST /api/duplex/child-text": async (req, res, body) => {
    const { childTextRoute } = await import("./childText.js");
    res.statusCode = await childTextRoute(req, body);
    res.setHeader("cache-control", "no-store");
    res.end();
  },
  "GET /api/duplex/config": async (req, res) => {
    const mode = await modeFor(req);
    // round 7 (Studio M4, server/duplex/childText.js): the device posts the child's live partials only when asked
    const body = mode.duplex === "on" && partialPostOn() ? { ...mode, partialPost: true } : mode;
    res.statusCode = 200;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.setHeader("cache-control", "no-store");
    // a cohort answer depends on the cookie: never let a shared cache key it on the URL alone
    res.setHeader("vary", "cookie");
    res.end(JSON.stringify(body));
  },
};
