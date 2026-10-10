// Session-first teacher (round 4, stream 4A; docs/research/round4/tutor/TUTOR-MODEL.md §2): the child just starts a session,
// she asks about school today, code maps the answer onto the syllabus graph and the kits, and the session holds segments.
// Everything here is behind TAXILA_SESSION_FIRST (default off: today's module-first start is unchanged).
//
// The owner decisions TUTOR-MODEL §9 lists are NOT decided here. Each is a switch, default off, so the owner's answer is a
// config change and never a code change:
//   TAXILA_SF_H3_PERSIST         persist representation responsiveness per child (LearnerHow H3) across sessions
//   TAXILA_SF_LIFE_CALLBACKS     callbacks to the child's life (memory tier C) in the intake greeting
//   TAXILA_SF_EXPLORE            the "teach anything" explore tier (c): a want outside the graph opens an explore segment
//   TAXILA_SF_START_ONLY_HOME    the Start-only home (the plan's topic card moves to the parent view)
//   TAXILA_SF_NOTEBOOK_CAMERA    "copy dikhao" by camera (cost-blocked today); voice-only intake when off
//   TAXILA_SF_PARENT_INTAKE_C12  classes 1-2: the parent-set timetable and pointer lead the intake (picture chips)

import { createHash } from "node:crypto";

const env = (k) => (typeof process !== "undefined" ? process.env?.[k] : undefined);
const on = (k) => /^(?:1|on|true|yes)$/i.test(String(env(k) ?? "").trim());

/** The session-first path: "off" (default) | "shadow" (decide and trace, serve today's start) | "on". */
export function sessionFirstMode() {
  const v = String(env("TAXILA_SESSION_FIRST") ?? "off").trim().toLowerCase();
  return v === "on" || v === "1" || v === "true" ? "on" : v === "shadow" ? "shadow" : "off";
}
export const sessionFirstOn = () => sessionFirstMode() === "on";

/**
 * round 4 (the owner first, main session 2026-10-10): TAXILA_SESSION_FIRST_FOR = comma-separated guardian accounts, each a
 * lower-case email OR the sha256 hex of one (the TAXILA_DUPLEX_LIVE_FOR form). For a guardian in it, the plain Start is a
 * session-first start whatever TAXILA_SESSION_FIRST says; every other account is exactly as before. PURE over env.
 */
const sha256 = (v) => createHash("sha256").update(v).digest("hex");
export function sessionCohort(e = typeof process !== "undefined" ? process.env : {}) {
  const out = new Set();
  for (const raw of String(e?.TAXILA_SESSION_FIRST_FOR ?? "").split(",")) {
    const v = raw.trim().toLowerCase();
    if (v) out.add(/^[0-9a-f]{64}$/.test(v) ? v : sha256(v));
  }
  return out;
}
/** Is this guardian (a row with `email`) in the session-first cohort? */
export function inSessionCohort(guardian, cohort = sessionCohort()) {
  const e = String(guardian?.email ?? "").trim().toLowerCase();
  return !!e && cohort.size > 0 && cohort.has(sha256(e));
}

/** The owner-decision switches (TUTOR-MODEL §9), all default off. */
export function sessionSwitches() {
  return Object.freeze({
    h3Persist: on("TAXILA_SF_H3_PERSIST"),
    lifeCallbacks: on("TAXILA_SF_LIFE_CALLBACKS"),
    explore: on("TAXILA_SF_EXPLORE"),
    startOnlyHome: on("TAXILA_SF_START_ONLY_HOME"),
    notebookCamera: on("TAXILA_SF_NOTEBOOK_CAMERA"),
    parentIntakeYoung: on("TAXILA_SF_PARENT_INTAKE_C12"),
  });
}

/** The intake's hard limits (the brief: at most 3 child turns, at most 90 s, no stage build). */
export const INTAKE_MAX_TURNS = 3;
export const INTAKE_MAX_MS = 90_000;
/** Below this confidence the mapping is never used silently: she asks a two-way "which one?". */
export const CONFIRM_MIN_P = 0.6;
