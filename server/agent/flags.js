// The Teacher agent lane's switch (round 5, docs/design/round5/AGENT.md §3; decision dc-r5-llm-orchestrated-teacher).
//   TAXILA_TEACHER=agent            every lesson started from now runs on the agent lane
//   TAXILA_TEACHER=off | unset      the Director lane (today's)
//   TAXILA_TEACHER_AGENT_FOR=...    the owner cohort: comma-separated lower-case emails or their sha256 hex. A guardian on
//                                   it gets the agent lane while the global mode is not "agent"; TAXILA_TEACHER=off wins.
// The lane is decided ONCE at lesson start (routes/lesson.js) and pinned on state.ctx.teacher: a lesson never switches lanes
// midway. The safety floor is identical on both lanes (scanSafety before the agent, the floor filter after it).
import { createHash } from "node:crypto";

const sha256 = (s) => createHash("sha256").update(s).digest("hex");

export function teacherMode(env = process.env) {
  const v = String(env.TAXILA_TEACHER ?? "").trim().toLowerCase();
  if (v === "agent") return "agent";
  if (v === "0" || v === "off" || v === "false" || v === "director") return "off";
  return "default";
}

export function agentCohort(env = process.env) {
  const out = new Set();
  for (const raw of String(env.TAXILA_TEACHER_AGENT_FOR ?? "").split(",")) {
    const v = raw.trim().toLowerCase();
    if (v) out.add(/^[0-9a-f]{64}$/.test(v) ? v : sha256(v));
  }
  return out;
}

/** "agent" | "director" for a lesson about to start. Pure. */
export function laneFor(guardian, env = process.env) {
  const mode = teacherMode(env);
  if (mode === "off") return "director";
  if (mode === "agent") return "agent";
  const e = String(guardian?.email ?? "").trim().toLowerCase();
  return e && agentCohort(env).has(sha256(e)) ? "agent" : "director";
}

/** The Teacher's deployment (chosen by the sim-lab bake-off; AGENT.md §1 Models). */
export const teacherDeployment = (env = process.env) => env.TAXILA_TEACHER_DEPLOY || "taxila-gpt6";
/** Per-turn and per-lesson budgets (AGENT.md §1: budgets are code, and a budget gate throws). */
export const AGENT_LIMITS = Object.freeze({
  turnTimeoutMs: Number(process.env.TAXILA_TEACHER_TIMEOUT_MS ?? 9000),
  maxOutTokens: 1200,
  lessonUsd: Number(process.env.TAXILA_TEACHER_LESSON_USD ?? 1.5),
  lessonTokens: 400_000,
  recentTurns: 10,
  offerItems: 8,
  sayMaxChars: 600,
  boardLines: 6,
});
