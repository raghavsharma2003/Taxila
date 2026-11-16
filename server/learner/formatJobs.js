// The night join of explain-format outcomes into the population posterior (round 7 F, learning-how-this-child-learns).
// Job kind format.join:{child}:{day} (server/conductor/config.js), enqueued by decide.js foldNight on an active day;
// registered here and loaded by server/conductor/handlers.js. Idempotent through its job key; no child id is written.
import { FinalJobError, registerHandler } from "../conductor/jobs.js";
import { joinFormatOutcomes } from "./formats.js";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** @param {any} job the claimed job row  @param {{ q?: Function }} [deps] tests inject a db */
export async function runFormatJoin(job, _ctx, deps = {}) {
  const day = job.input?.day;
  if (!DAY.test(String(day ?? ""))) throw new FinalJobError(`format.join ${job.id}: bad day ${day}`);
  const q = deps.q ?? (await import("../conductor/pg.js")).q;
  const tz = (await q("select tz from child_routine where child_id = $1", [job.child_id]).catch(() => []))[0]?.tz || "Asia/Kolkata";
  const r = await joinFormatOutcomes(job.child_id, day, { q, tz });
  return `format_join:${r.scored}/${r.decisions}:${r.cells}`;
}

registerHandler("format.join", (job, ctx) => runFormatJoin(job, ctx));
