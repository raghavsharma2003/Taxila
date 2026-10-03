// Learner-model persistence: skill_state, misconception_state, evidence, and the child brief.
// Every writer asserts its row count (inherited rejection: dead writers / UPDATE-only writers).
import { q, one } from "../db.js";
import { withDue } from "./bkt.js";
import { fitBrief, cleanRows } from "./brief.js";
import { misconceptionById, skillById } from "../content/index.js";
import { skillStateStmt, misconceptionFlagStmt } from "./writer.js";
import { fold, newLedger } from "./kt/ledger.js";

function expectRows(rows, n, what) {
  if (rows.length !== n) throw new Error(`${what}: expected ${n} row(s), wrote ${rows.length}`);
  return rows;
}

/** @returns {import("../../shared/contracts").SkillState} */
function fromRow(r, now) {
  const s = {
    skillId: r.skill_id, pKnown: r.p_known, status: r.status, attempts: r.attempts, correctUnaided: r.correct_unaided,
    generativePass: r.generative_pass, delayedPass: r.delayed_pass, lastSeen: new Date(r.last_seen).toISOString(),
  };
  if (r.next_review) s.nextReview = new Date(r.next_review).toISOString();
  return withDue(s, now);
}

/** → { [skillId]: SkillState } for the given skills (missing skills are simply absent). */
export async function loadSkillStates(childId, skillIds, now = new Date()) {
  if (!skillIds.length) return {};
  const rows = await q("select * from skill_state where child_id = $1 and skill_id = any($2::text[])", [childId, skillIds]);
  return Object.fromEntries(rows.map((r) => [r.skill_id, fromRow(r, now)]));
}

/** Learned skills whose review time has come, soonest first — the warm-up retrieval pool. */
export async function loadDueSkills(childId, limit = 3) {
  const rows = await q(
    `select * from skill_state where child_id = $1 and status in ('learned_today','mastered','due')
       and next_review is not null and next_review <= now() order by next_review limit $2`, [childId, limit]);
  return rows.map((r) => fromRow(r));
}

// Statement builders ({ text, params, layer }) for writes that must land in one transaction with the turn
// that caused them (routes/lesson.js). They live in the ONE writer module (writer.js), which checks the
// child's legal_mode before building any of them; re-exported here so existing imports keep working.
export { skillStateStmt, evidenceStmt, misconceptionFlagStmt, misconceptionResolveStmt } from "./writer.js";

/** @param {{ id: string, legal_mode: string }} child the child row (its mode gates the write) */
export async function saveSkillState(child, s) {
  const { text, params } = skillStateStmt(child.id, s, child);
  expectRows(await q(text, params), 1, "skill_state upsert");
}

/** @param {{ id: string, legal_mode: string }} child the child row (its mode gates the write) */
export async function flagMisconception(child, misconceptionId) {
  const { text, params } = misconceptionFlagStmt(child.id, misconceptionId, child);
  return expectRows(await q(text, params), 1, "misconception_state upsert")[0].evidence_count;
}

/** Open misconception ids, most recent first. */
export async function loadActiveMisconceptionIds(childId, limit = 3) {
  const rows = await q("select misconception_id from misconception_state where child_id = $1 and not resolved order by last_seen desc limit $2", [childId, limit]);
  return rows.map((r) => r.misconception_id);
}

/** Last ≤10 outcomes per skill, chronological — the wheel-spinning window carries across sessions. */
export async function loadRecentOutcomes(childId, skillIds) {
  if (!skillIds.length) return {};
  const rows = await q(
    `select skill_id, outcome from (
       select skill_id, outcome, at, row_number() over (partition by skill_id order by at desc) as rn
       from evidence where child_id = $1 and skill_id = any($2::text[]) and outcome <> 'no_evidence') e
     where rn <= 10 order by at`, [childId, skillIds]);
  const out = {};
  for (const r of rows) (out[r.skill_id] ??= []).push(r.outcome);
  return out;
}

/** Classes 1-4 → "6-9", classes 5-9 → "10-15" (the two design bands of learning-science §3.8). */
export const ageBandFor = (classLevel) => (classLevel <= 4 ? "6-9" : "10-15");

/**
 * Vibe defaults by band. The old vibeFrom() inferred pace and verbosity from the child's raw transcripts
 * across sessions, which is behavioural monitoring persisted beyond the session (LEARNER-MODEL §6.8 bug
 * list, NM-3): removed. Session adaptation lives in the Director's in-memory state; explicit preferences
 * (vibe_explicit, closed values) are the only persisted vibe input.
 */
const VIBE_DEFAULT = Object.freeze({ pace: "medium", verbosity: "brief", humour: "medium" });   // = the old no-history value
const vibeFor = () => ({ ...VIBE_DEFAULT });

/**
 * Build the ChildBrief from the child row and the ledger. Memory callbacks only with `memory` consent.
 * @param {any} child  child row
 * @param {{ memory: boolean }} consent
 * @returns {Promise<import("../../shared/contracts").ChildBrief>}
 */
export async function buildChildBrief(child, { memory }) {
  const [rel, wins, misIds, memories] = await Promise.all([
    one("select stage, sessions from rel_state where child_id = $1", [child.id]),
    q(`select skill_id from skill_state where child_id = $1 and status in ('learned_today','mastered') order by last_seen desc limit 3`, [child.id]),
    loadActiveMisconceptionIds(child.id, 3),
    memory
      ? q("select text from memory where child_id = $1 and superseded_by is null order by created_at desc limit 3", [child.id])
      : Promise.resolve([]),
  ]);
  const winTitles = (await Promise.all(wins.map((w) => skillById(w.skill_id)))).filter(Boolean).map((s) => s.title);
  const beliefs = (await Promise.all(misIds.map((id) => misconceptionById(id)))).filter(Boolean).map((m) => m.belief);
  const stage = rel?.stage || "first_meeting";
  return fitBrief({
    firstName: child.first_name, classLevel: child.class_level, ageBand: ageBandFor(child.class_level),
    languagePref: child.language_pref,
    interests: cleanRows(child.interests || []).slice(0, 4),
    recentWins: cleanRows(winTitles),
    activeMisconceptions: cleanRows(beliefs, 24),
    memoryCallbacks: cleanRows(memories.map((m) => m.text)),
    vibe: vibeFor(),
    relationshipStage: `${stage} (${rel?.sessions ?? 0} sessions together)`,
  });
}

// ───────────── the BKT-R / θ ledger (005 tables) ─────────────

/** kt_evidence row → EvidenceEvent (the replay input; seq is the order key). */
export function eventFromRow(r) {
  const teach = r.teach || r.cls === "teach";
  return {
    id: r.id, seq: Number(r.seq), childId: r.child_id, sessionId: r.session_id, episodeId: r.episode_id,
    sessionStartAt: new Date(r.session_start_at).toISOString(), at: new Date(r.occurred_at).toISOString(),
    skillIds: r.skill_ids, ...(teach ? { teach: true, cls: "item.open", outcome: 0 } : { cls: r.cls, outcome: r.outcome }),
    grader: r.grader, graderVersion: r.grader_version, itemKey: r.item_key,
    ...(r.assisted ? { assisted: r.assisted } : {}), ...(r.controller_easy ? { controllerEasy: true } : {}),
    ...(r.gaming_window ? { gamingWindowKt: true } : {}), ...(r.pre_attempt_help ? { preAttemptHelp: true } : {}),
    ...(r.form ? { form: r.form } : {}), ...(r.target ? { target: r.target } : {}), ...(r.topic_type ? { topicType: r.topic_type } : {}),
    ...(r.misconception_id ? { misconceptionId: r.misconception_id } : {}), ...(r.discriminates ? { discriminates: r.discriminates } : {}),
    ...(r.mis_route ? { misRoute: r.mis_route } : {}), ...(r.entry_rung ? { entryRung: r.entry_rung } : {}),
    ...(r.contaminated ? { contaminated: true } : {}), ...(r.kit_verified === false ? { kitVerified: false } : {}),
    // CE contract fields (007): absent columns (a row written before 007) read as absent, never as defaults.
    ...(r.via ? { via: r.via } : {}), ...(r.ebo ? { ebo: r.ebo } : {}), ...(r.shape_id ? { shapeId: r.shape_id } : {}),
    ...(r.weave_host ? { weaveHost: r.weave_host } : {}), ...(r.coincident ? { coincident: true } : {}),
    ...(r.unfamiliar_context ? { unfamiliarContext: true } : {}), ...(r.deference_discount ? { deferenceDiscount: true } : {}),
    ...(typeof r.span_ok === "boolean" ? { spanOk: r.span_ok } : {}),
  };
}

/** Every kt_evidence event of a child, in seq order. */
export async function loadKtEvents(childId) {
  return (await q("select * from kt_evidence where child_id = $1 order by seq", [childId])).map(eventFromRow);
}

/**
 * The child's ledger, rebuilt by replaying kt_evidence (event-sourced: replay = online fold, TP2).
 * kt_skill_state is the cached fold for readers that need no replay (parent report, brief).
 * @param {{ id: string, class_level: number }} child
 * @param {import("./kt/ledger.js").FoldCtx} [ctx]
 */
export async function loadLedger(child, ctx = {}) {
  return fold(newLedger({ childId: child.id, classLevel: child.class_level }), await loadKtEvents(child.id), ctx);
}

/** Cached KT skill states (kt_skill_state) for the given skills, keyed by skill id. */
export async function loadKtSkillStates(childId, skillIds) {
  if (!skillIds.length) return {};
  const rows = await q("select * from kt_skill_state where child_id = $1 and skill_id = any($2::text[])", [childId, skillIds]);
  return Object.fromEntries(rows.map((r) => [r.skill_id, {
    skillId: r.skill_id, paramsVersion: r.params_version, pL: r.p_l, retention: r.retention, mem: r.mem, n: r.n, flags: r.flags,
    recent: r.recent ?? [], opp: r.opp, run: r.run, display: r.display, refresh: r.refresh,
    nextReviewAt: r.next_review_at ? new Date(r.next_review_at).toISOString() : null,
    prior: r.prior_pl0 == null ? null : { pL0: r.prior_pl0, epochId: r.prior_epoch_id, seq: r.prior_seq == null ? null : Number(r.prior_seq) },
    ...(r.extra ?? {}),
  }]));
}

/** Active misconceptions from kt_misconception (unresolved, with at least one hit), most likely first. */
export async function loadKtMisconceptions(childId, limit = 5) {
  return q(`select misconception_id, logit, hits, last_at, resolved_at, check_scheduled_at from kt_misconception
     where child_id = $1 and resolved_at is null and hits > 0 order by logit desc, misconception_id limit $2`, [childId, limit]);
}

/** Conductor view key kt.dueCount from the new ledger cache (learned skills whose review time has come). */
export async function ktDueCount(childId, now = new Date()) {
  const r = await one(`select count(*)::int as n from kt_skill_state where child_id = $1 and display in ('learned_today','mastered','durable')
     and (refresh or (next_review_at is not null and next_review_at <= $2))`, [childId, new Date(now).toISOString()]);
  return r?.n ?? 0;
}
