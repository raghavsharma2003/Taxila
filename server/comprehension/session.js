// The comprehension engine's per-lesson session seam (BUILD-PLAN §2, W1 seam commit). OWNED BY W1-C.
//
// server/routes/lesson.js is a hot file (W1-A owns it); the comprehension engine reaches the lesson ONLY through
// these functions, whose call sites the W0 seam commit placed:
//   loadSessionContext  at POST /api/lesson/start: the child's re-teach record, resolved (W1-C #5)
//   awaitSettled        at POST /api/lesson/turn: the held-verdict settle (W1-C #2; later.js)
// and, for director/state.js engineReteach (W1-A's hot file; seam-patches/w1c-state-reteach.patch):
//   reteachSessionInputs / noteReteach: this lesson's failed arms on a skill and the skill's prerequisites, so
//   selectReteach's prerequisite descent (2 failed arms) and park (3) can fire.
import { settleHeld } from "./later.js";
import { resolveAttempts, clusterOf } from "./resolve.js";
import { UNSEEN_PREREQ_PL } from "./reteach.js";
import { bandOf } from "./params.js";

/**
 * @typedef {{
 *   attempts?: { skillId: string, armId: string, repClass?: string, representationId?: string, outcome: string, at: string }[],
 *   repFluency?: Record<string, number>,
 *   posteriors?: Record<string, { a: number, b: number }>,
 *   prereqs?: Record<string, { skillId: string, pL: number, seen: boolean }[]>,
 * }} ReteachCtx   the selectReteach inputs read from the child's record (comprehension/reteach.js §5.3)
 *
 * @typedef {{ reteach: ReteachCtx | null }} SessionContext
 */

/** The empty context: what the caller uses when this seam returns nothing or throws. */
export const EMPTY_SESSION_CONTEXT = Object.freeze({ reteach: null });

/** The longest lesson start waits for the record (it runs beside the learner fold); past it the lesson starts without. */
export const SESSION_CTX_BUDGET_MS = 800;
const MAX_ATTEMPTS = 50;

let dbq = null, dbtx = null;
/** Tests: swap the query (and transaction) functions; null restores the app's database. */
export function _setSessionQuery(fn, txFn = null) { dbq = fn; dbtx = txFn; }
async function query(text, params = []) {
  if (dbq) return dbq(text, params);
  const { q } = await import("../db.js");
  return q(text, params);
}
async function transaction(stmts) {
  if (dbtx) return dbtx(stmts);
  const { tx } = await import("../db.js");
  return tx(stmts);
}

/** The topic of a kit skill id (`c5-maths-ch02-t01-s1` → `c5-maths-ch02-t01`). */
const topicOfSkill = (id) => String(id).replace(/-s\d+$/, "");
const subjectOf = (skillId) => clusterOf(skillId, "x").split(":")[0];

/**
 * Read what this child's record says the lesson must know at start (W1-C #5): the re-teach attempts on this
 * lesson's skills (resolved from the child's later answers first; the resolutions and the arm rewards are written in
 * the background), representation fluency, the population arm posteriors of this subject × band, and each skill's
 * cross-topic prerequisites with their pL. Called once in POST /api/lesson/start, in parallel with the learner fold.
 * A non-null `reteach` is pinned into the lesson state as `state.ctx.reteach`. Never slower than
 * SESSION_CTX_BUDGET_MS. The caller catches a rejection and uses EMPTY_SESSION_CONTEXT.
 * @param {string} childId
 * @param {{ skillIds?: string[], now?: number }} [opts]
 * @returns {Promise<SessionContext>}
 */
export async function loadSessionContext(childId, opts = {}) {
  const work = readContext(childId, opts);
  work.catch((e) => console.warn("[session] re-teach record:", String(e?.message ?? e).slice(0, 160)));
  let timer;
  const late = new Promise((r) => { timer = setTimeout(() => r(null), SESSION_CTX_BUDGET_MS); });
  const out = await Promise.race([work.catch(() => EMPTY_SESSION_CONTEXT), late]).finally(() => clearTimeout(timer));
  if (!out) console.warn(`[session] re-teach record not ready in ${SESSION_CTX_BUDGET_MS} ms; the lesson starts without it`);
  return out ?? EMPTY_SESSION_CONTEXT;
}

/** The whole read (exported for tests: no time budget). */
export async function readContext(childId, { skillIds = [], now = Date.now() } = {}) {
  const skills = [...new Set(skillIds)];
  const subjects = [...new Set(skills.map(subjectOf))];
  const { getTopic } = await import("../content/curriculum.js");
  const preTopics = Object.fromEntries(skills.map((s) => [s, (getTopic(topicOfSkill(s))?.prerequisites ?? []).slice(0, 4)]));
  const patterns = [...new Set(Object.values(preTopics).flat())].map((t) => `${t}-%`);
  const [childRows, rows, events, fluency, posts, preRows] = await Promise.all([
    query("select class_level, legal_mode from child where id = $1", [childId]),
    query(`select id, skill_id, session_id, misconception_id, arm_id, rep_class, representation_id, at, outcome, reward, rewarded_at
      from reteach_attempts where child_id = $1 and at > $2::timestamptz - interval '60 days' order by at, id limit 400`, [childId, new Date(now).toISOString()]),
    // the evidence after the oldest OPEN attempt, on the skills of open attempts (one round trip: the attempts are a subquery)
    query(`select id, seq, session_id, occurred_at, skill_ids, cls, outcome, teach, via, target, misconception_id, contaminated, assisted
      from kt_evidence k where k.child_id = $1
        and k.occurred_at > (select min(at) from reteach_attempts r where r.child_id = $1 and r.rewarded_at is null)
        and k.skill_ids && (select array_agg(distinct skill_id) from reteach_attempts r where r.child_id = $1 and r.rewarded_at is null)
      order by k.seq limit 2000`, [childId]),
    query("select representation_id, p_read from rep_fluency where child_id = $1", [childId]),
    subjects.length ? query("select arm_id, cluster, a, b from arm_posteriors where split_part(cluster, ':', 1) = any($1::text[])", [subjects]) : [],
    patterns.length ? query("select skill_id, p_l from kt_skill_state where child_id = $1 and skill_id like any($2::text[])", [childId, patterns]) : [],
  ]);
  const child = childRows[0];
  if (!child) return EMPTY_SESSION_CONTEXT;
  const band = bandOf(child.class_level ?? 5);
  const evs = events.map((r) => ({ id: r.id, seq: Number(r.seq), sessionId: r.session_id, at: new Date(r.occurred_at).toISOString(), skillIds: r.skill_ids,
    cls: r.cls, outcome: Number(r.outcome), teach: !!r.teach, via: r.via ?? undefined, target: r.target ?? undefined, misconceptionId: r.misconception_id ?? undefined,
    contaminated: !!r.contaminated, assisted: r.assisted ?? undefined }));
  const { attempts, updates } = resolveAttempts(rows, evs, { now, band });
  if (updates.length) writeResolutions(updates, childId).catch((e) => console.warn("[reteach] resolutions not written:", String(e?.message ?? e).slice(0, 160)));

  const mine = new Set(skills);
  const clusters = new Set(skills.map((s) => clusterOf(s, band)));
  const posteriors = {};
  for (const p of posts) if (clusters.has(p.cluster)) posteriors[p.arm_id] = { a: Number(p.a), b: Number(p.b) };
  const repFluency = Object.fromEntries(fluency.map((r) => [r.representation_id, Number(r.p_read)]));
  const prereqs = {};
  for (const s of skills) {
    const list = [];
    for (const t of preTopics[s]) {
      const seen = preRows.filter((r) => r.skill_id.startsWith(`${t}-`));
      if (seen.length) for (const r of seen) list.push({ skillId: r.skill_id, pL: Number(r.p_l), seen: true });
      else list.push({ skillId: `${t}-s1`, pL: UNSEEN_PREREQ_PL, seen: false });
    }
    if (list.length) prereqs[s] = list;
  }
  return { reteach: { attempts: attempts.filter((a) => mine.has(a.skillId)).slice(-MAX_ATTEMPTS), repFluency, posteriors, prereqs } };
}

/**
 * One statement per resolution: the attempt's outcome and reward, and — only when the outcome is final and the row was
 * not rewarded before — the arm's population posterior (no child id), atomically (a concurrent start cannot add the
 * same reward twice: the update is guarded on rewarded_at is null and the insert reads its returning row).
 * A TEST account's child (guardian email @taxila.test: prod-smoke, the probe fleet, tests/prod) resolves its own
 * attempt rows but never pays the population posterior: arm_posteriors are the priors every real child's arm choice
 * reads, and a scripted child's failures would bias them. The guard is in SQL (the attempt's child → guardian), so no
 * caller can forget it.
 */
export const resolutionStmt = (u) => ({
  text: `with u as (update reteach_attempts set outcome = $2, reward = $3::double precision, resolved_at = now(),
      rewarded_at = case when $4::boolean then now() else null end, cluster = $5
      where id = $1 and rewarded_at is null returning arm_id, reward,
        exists (select 1 from child c join guardian g on g.id = c.guardian_id
          where c.id = reteach_attempts.child_id and g.email ~* '@taxila\\.test$') as test_account)
    insert into arm_posteriors (arm_id, cluster, a, b, n)
      select arm_id, $5, 1 + reward, 2 - reward, 1 from u where $4::boolean and reward is not null and not test_account
    on conflict (arm_id, cluster) do update set a = arm_posteriors.a + excluded.a - 1, b = arm_posteriors.b + excluded.b - 1,
      n = arm_posteriors.n + 1, updated_at = now()`,
  params: [u.id, u.outcome, u.reward, !!u.final, u.cluster],
});

async function writeResolutions(updates, childId) {
  await transaction(updates.map(resolutionStmt));
  console.info(`[reteach] resolved ${updates.length} attempt(s) child=${childId}: ${updates.map((u) => `${u.armId}=${u.outcome}${u.final ? "/final" : ""}`).join(", ")}`);
}

// engineReteach's in-lesson inputs live in reteach.js (pure; director/state.js imports them through index.js).
export { reteachSessionInputs, noteReteach } from "./reteach.js";

/**
 * Wait, at most `maxMs`, for the blind verdicts of last turn's held events (W1-C #2, held-verdict settle). Called in
 * POST /api/lesson/turn just before the carried events are read (carriedFrom → settledGrade), with the held event
 * ids. Resolves when every id has settled or the time is up; never rejects (the caller also catches). Verdicts that
 * landed on another replica are read from pending_grade by event id and made visible to settledGrade; ids still
 * unsettled at the deadline are claimed as folded without a verdict (a later verdict becomes a correction).
 *
 * Optional third argument (backward compatible with the W0 seam): `{ until }`, a promise for the turn's classifier.
 * Started BESIDE the classifier (seam-patches/w1c-lesson-early-grade.patch), the wait lasts until both `maxMs` has
 * passed and the classifier is done (capped at later.js SETTLE_CAP_MS): a verdict that lands while the classifier
 * runs costs the turn nothing, and the turn never waits longer than max(maxMs, classifier) — never longer than the
 * old serial 600 ms wait added on top of the classifier.
 * @param {string[]} eventIds  empty when nothing is held (resolve at once)
 * @param {number} [maxMs]
 * @param {{ until?: Promise<any> | null, capMs?: number }} [opts]
 * @returns {Promise<void>}
 */
export async function awaitSettled(eventIds, maxMs = 600, opts = {}) {
  try { await settleHeld(eventIds, maxMs, { label: "turn", until: opts?.until ?? null, ...(opts?.capMs ? { capMs: opts.capMs } : {}) }); }
  catch (e) { console.warn("[settle] awaitSettled:", String(e?.message ?? e).slice(0, 160)); }
}
