// The Conductor's end-of-day trigger for G2 (job kind `forge.g2.nightly`, registered in server/conductor/config.js and
// imported by server/conductor/handlers.js). One job per child per learning day, enqueued by the night fold
// (integration call site: decide.js enqueueReports, see the inbox). What it does, per topic the child met that day:
//   approved core in the catalogue → deliver it into the child's folder for TOMORROW (forge/g2/c/<childKey>/<day>.json);
//   in cool-down (failed / rejected < 24 h) → nothing (the child keeps G1/T1);
//   otherwise → the child waits on that identity (waiting/<identityKey>/<childKey>.json) and, if no build is in flight
//   (single-flight marker, If-None-Match), ONE ACA Job execution is started, under a daily breaker.
// When a human approves the build (review.js), every waiting child gets it — "generated, reviewed, delivered the next
// day" (FACTORY.md §0.1 E2). The job itself never waits for a build and never touches lesson-time paths.
import { randomUUID } from "crypto";
import { briefFor } from "./brief.js";
import { childKey, deliver, paths } from "./review.js";
import { getPrivate, putPrivate, listPrivate, putPublic, deletePrivate, ensurePrivateContainer } from "./store.js";
import { startBuild } from "./azure-job.js";

export const G2_JOB_KIND = "forge.g2.nightly";
/** Conductor job spec (config.js JOB_KINDS row). Slow lane; consent re-checked at claim (core_tutoring). */
export const G2_JOB_SPEC = { lane: "slow", priority: 4, purpose: "core_tutoring", budgetMicroUsd: 3_500_000, maxAttempts: 3, leaseSec: 120, allowedIn: ["paused"] };
export const MAX_TOPICS_PER_DAY = 3;
export const DAILY_BUILD_MAX = () => +(process.env.FORGE_G2_DAILY_BUILDS || 20);
export const INFLIGHT_STALE_MS = 2 * 3600_000;

const addDays = (d, n) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

/** The day's topics for a child (lessons whose learning day — local time minus 4 h — is `day`). */
export async function topicsForDay(q, childId, day, tz = "Asia/Kolkata") {
  const rows = await q(`select topic_id, count(*)::int as n from lesson
      where child_id = $1 and ((started_at at time zone $3) - interval '4 hours')::date = $2::date
      group by topic_id order by count(*) desc, topic_id limit $4`, [childId, day, tz, MAX_TOPICS_PER_DAY]);
  return rows.map((r) => r.topic_id);
}

/**
 * @param {{ child_id: string, input: { day: string, tz?: string, topicIds?: string[] } }} job
 * @param {{ q: Function, store?: object, start?: Function, now?: number }} deps
 * @returns {Promise<string>} result_ref (codes only, no child data)
 */
export async function nightly(job, deps) {
  const { q, start = startBuild, now = Date.now() } = deps;
  const store = deps.store || { getPrivate, putPrivate, listPrivate, putPublic, deletePrivate, ensurePrivateContainer };
  const day = job.input?.day;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day || "")) return "g2:bad_input";
  await store.ensurePrivateContainer?.();
  const topics = job.input?.topicIds?.length ? job.input.topicIds.slice(0, MAX_TOPICS_PER_DAY) : await topicsForDay(q, job.child_id, day, job.input?.tz);
  const ck = childKey(job.child_id);
  const forDay = addDays(day, 1);
  const tally = { delivered: 0, started: 0, joined: 0, cooldown: 0, ineligible: 0, breaker: 0 };
  for (const topicId of topics) {
    const b = briefFor(topicId);
    if (!b.ok) { tally.ineligible++; continue; }
    const cat = await store.getPrivate(paths.catalogue(b.identityKey));
    if (cat?.status === "approved") {
      await deliver(ck, { engine: cat.engine, src: cat.src, sha: cat.sha, topicId, archetype: cat.archetype, ageBand: cat.ageBand, title: cat.title, buildId: cat.buildId, levels: cat.levels }, { day: forDay }, store);
      tally.delivered++; continue;
    }
    if ((cat?.status === "failed" || cat?.status === "rejected") && Date.parse(cat.until) > now) { tally.cooldown++; continue; }
    await store.putPrivate(paths.waiting(b.identityKey, ck), JSON.stringify({ childKey: ck, forDay, at: new Date(now).toISOString() }));
    const utc = new Date(now).toISOString().slice(0, 10);
    const buildId = randomUUID();
    const claim = await store.putPrivate(paths.inflight(b.identityKey), JSON.stringify({ buildId, topicId, at: new Date(now).toISOString() }), { ifNoneMatch: true });
    if (!claim.created) {
      // a marker older than the job's replicaTimeout (30 min) + margin is a dead build: take it over
      const cur = await store.getPrivate(paths.inflight(b.identityKey));
      if (cur && Date.parse(cur.at) > now - INFLIGHT_STALE_MS) { tally.joined++; continue; }
      await store.putPrivate(paths.inflight(b.identityKey), JSON.stringify({ buildId, topicId, at: new Date(now).toISOString(), tookOver: cur?.buildId || null }));
    }
    const started = await store.listPrivate(`breaker/${utc}/`);
    if (started.length >= DAILY_BUILD_MAX()) { await store.deletePrivate?.(paths.inflight(b.identityKey)); tally.breaker++; continue; }
    await store.putPrivate(`breaker/${utc}/${buildId}`, JSON.stringify({ topicId, identityKey: b.identityKey }));
    let ex;
    try { ex = await start({ topicId, buildId }); }
    catch (e) {
      // a start that failed must not leave a marker that makes every other child "join" a build that never ran
      await store.deletePrivate?.(paths.inflight(b.identityKey));
      await store.deletePrivate?.(`breaker/${utc}/${buildId}`);
      throw e;
    }
    await store.putPrivate(paths.inflight(b.identityKey), JSON.stringify({ buildId, topicId, execution: ex.execution, at: new Date(now).toISOString() }));
    tally.started++;
  }
  return `g2:${Object.entries(tally).map(([k, v]) => `${k}=${v}`).join(",")}`;
}

// Registration with the worker's handler table (the kind's row lives in server/conductor/config.js).
const { registerHandler } = await import("../../conductor/jobs.js");
const { q } = await import("../../conductor/pg.js");
registerHandler(G2_JOB_KIND, (job) => nightly(job, { q }));
