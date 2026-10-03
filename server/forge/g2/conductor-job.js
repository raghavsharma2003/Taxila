// The Conductor's end-of-day trigger for G2 (job kind `forge.g2.nightly`, registered in server/conductor/config.js and
// imported by server/conductor/handlers.js). One job per child per learning day, enqueued by the night fold
// (integration call site: decide.js enqueueReports, see the inbox). First it INGESTS every finished build (trusted:
// review.js ingest, the only path from a runner's output into the queue). Then, per topic the child met that day:
//   approved core in the catalogue (and its review manifest agrees) → merge it into the child's folder for TOMORROW;
//   pending_review → the child waits on that identity (it is delivered when a person approves; never rebuilt);
//   in cool-down (failed / rejected: 1 d, 3 d, 7 d) or in triage (4 attempts) → nothing (the child keeps G1/T1);
//   otherwise → the child waits on that identity and, if no build is in flight (create-only marker; an orphan marker
//   is taken over only by ETag), ONE ACA Job execution is started, under a daily breaker.
// The job never waits for a build and never touches lesson-time paths. Heavy modules (Blob, ARM, kit) load lazily, so
// importing this file at worker boot costs nothing.
import { randomUUID } from "crypto";

export const G2_JOB_KIND = "forge.g2.nightly";
/** Conductor job spec (config.js JOB_KINDS row). Slow lane; consent re-checked at claim (core_tutoring). */
export const G2_JOB_SPEC = { lane: "slow", priority: 4, purpose: "core_tutoring", budgetMicroUsd: 3_500_000, maxAttempts: 3, leaseSec: 120, allowedIn: ["paused"] };
export const MAX_TOPICS_PER_DAY = 3;
export const DAILY_BUILD_MAX = () => +(process.env.FORGE_G2_DAILY_BUILDS || 20);
/** A marker with no open build record behind it (the starter died between claim and start) is an orphan after this. */
export const ORPHAN_MS = 10 * 60_000;

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
 * @param {{ q: Function, store?: object, start?: Function, now?: number, execInfo?: Function }} deps
 * @returns {Promise<string>} result_ref (codes only, no child data)
 */
export async function nightly(job, deps) {
  const { q, now = Date.now() } = deps;
  const day = job.input?.day;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day || "")) return "g2:bad_input";
  if (!process.env.FORGE_G2_CHILD_SALT) return "g2:no_salt";              // final: retrying cannot fix configuration
  const [{ briefFor }, review, storeMod] = await Promise.all([import("./brief.js"), import("./review.js"), import("./store.js")]);
  const { childKey, deliver, paths, ingestAll } = review;
  const store = deps.store || { getPrivate: storeMod.getPrivate, putPrivate: storeMod.putPrivate, listPrivate: storeMod.listPrivate, deletePrivate: storeMod.deletePrivate,
    putPublic: storeMod.putPublic, getPublic: storeMod.getPublic, getRun: storeMod.getRun, listRun: storeMod.listRun, deleteRunContainer: storeMod.deleteRunContainer,
    ensurePrivateContainer: storeMod.ensurePrivateContainer };
  const start = deps.start || (async (x) => (await import("./azure-job.js")).startBuild(x));
  const execInfo = deps.execInfo ?? (deps.store ? undefined : async (ex) => (await import("./azure-job.js")).executionStatus(ex));
  await store.ensurePrivateContainer?.();
  const tally = { delivered: 0, started: 0, joined: 0, pending: 0, cooldown: 0, triage: 0, ineligible: 0, breaker: 0, mismatch: 0, ingested: 0 };
  tally.ingested = (await ingestAll(store, { now, execInfo })).filter((r) => !["running", "not_open", "raced"].includes(r.outcome)).length;
  const topics = job.input?.topicIds?.length ? job.input.topicIds.slice(0, MAX_TOPICS_PER_DAY) : await topicsForDay(q, job.child_id, day, job.input?.tz);
  const ck = childKey(job.child_id);
  const forDay = addDays(day, 1);
  const wait = (identityKey) => store.putPrivate(paths.waiting(identityKey, ck), JSON.stringify({ childKey: ck, forDay, at: new Date(now).toISOString() }));
  for (const topicId of topics) {
    const b = briefFor(topicId);
    if (!b.ok) { tally.ineligible++; continue; }
    const cat = await store.getPrivate(paths.catalogue(b.identityKey));
    if (cat?.status === "approved") {
      // defence in depth: the catalogue must agree with the person's decision on record (sha and status)
      const m = cat.buildId ? await store.getPrivate(paths.build(cat.buildId)) : null;
      if (!m || m.status !== "approved" || m.sha !== cat.sha) { tally.mismatch++; continue; }
      await deliver(ck, { engine: m.engineDef.id, sha: m.sha, topicId, archetype: m.archetype, ageBand: m.ageBand, title: m.title, buildId: m.buildId, levels: "server:levels.js" }, { day: forDay, now }, store);
      tally.delivered++; continue;
    }
    if (cat?.status === "pending_review") { await wait(b.identityKey); tally.pending++; continue; }
    if (cat?.status === "triage") { tally.triage++; continue; }
    if ((cat?.status === "failed" || cat?.status === "rejected") && Date.parse(cat.until) > now) { tally.cooldown++; continue; }
    await wait(b.identityKey);
    const utc = new Date(now).toISOString().slice(0, 10);
    const buildId = randomUUID();
    const marker = (extra = {}) => JSON.stringify({ buildId, topicId, at: new Date(now).toISOString(), ...extra });
    let claim = await store.putPrivate(paths.inflight(b.identityKey), marker(), { ifNoneMatch: true });
    if (!claim.created) {
      const cur = await store.getPrivate(paths.inflight(b.identityKey), { withEtag: true });
      const open = cur?.body?.buildId ? await store.getPrivate(paths.openBuild(cur.body.buildId)) : null;
      // a live build (open record), or a marker still inside the starter's window → join it
      if (!cur || open || now - Date.parse(cur.body.at) < ORPHAN_MS) { tally.joined++; continue; }
      claim = await store.putPrivate(paths.inflight(b.identityKey), marker({ tookOver: cur.body.buildId }), { ifMatch: cur.etag });
      if (claim.conflict) { tally.joined++; continue; }                    // another nightly took it first
    }
    const started = await store.listPrivate(`breaker/${utc}/`);
    if (started.length >= DAILY_BUILD_MAX()) { await store.deletePrivate(paths.inflight(b.identityKey)); tally.breaker++; continue; }
    await store.putPrivate(`breaker/${utc}/${buildId}`, JSON.stringify({ topicId, identityKey: b.identityKey }));
    let ex;
    try { ex = await start({ topicId, buildId }); }
    catch (e) {
      // a start that failed must not leave a marker that makes every other child "join" a build that never ran
      await store.deletePrivate(paths.inflight(b.identityKey));
      await store.deletePrivate(`breaker/${utc}/${buildId}`);
      throw e;
    }
    await store.putPrivate(paths.inflight(b.identityKey), marker({ execution: ex.execution }));
    tally.started++;
  }
  return `g2:${Object.entries(tally).map(([k, v]) => `${k}=${v}`).join(",")}`;
}

// Registration with the worker's handler table (the kind's row lives in server/conductor/config.js).
const { registerHandler } = await import("../../conductor/jobs.js");
const { q } = await import("../../conductor/pg.js");
registerHandler(G2_JOB_KIND, (job) => nightly(job, { q }));
