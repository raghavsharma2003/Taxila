// Learner-model persistence: skill_state, misconception_state, evidence, and the child brief.
// The writes themselves are statement builders in writer.js (one transaction with the turn).
import { q, one } from "../db.js";
import { BANDS } from "./bands.js";
import { fitBrief, cleanRows } from "./brief.js";
import { misconceptionById, skillById } from "../content/index.js";
import { fold, newLedger } from "./kt/ledger.js";

// Statement builders ({ text, params, layer }) for writes that must land in one transaction with the turn
// that caused them (routes/lesson.js). They live in the ONE writer module (writer.js), which checks the
// child's legal_mode before building any of them; re-exported here so existing imports keep working.
export { skillStateStmt, evidenceStmt, misconceptionFlagStmt, misconceptionResolveStmt } from "./writer.js";

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

/** How many recent lessons' stuck counts the guidance ladder reads (state.js noteStuck), and how far back. */
export const STUCK_LESSONS = 5;
/**
 * Per skill: items the child got stuck on (the assertion reached, or left after don't-knows) in their last few lessons,
 * from the lesson state the Director keeps (state.stuck). A ROUTING signal for the guidance ladder and the equity
 * profile only (fading.js); it never reaches KT, beliefs or a report. Errors read as no record.
 * @returns {Promise<Record<string, number>>}
 */
export async function loadRecentStuck(childId, skillIds) {
  if (!skillIds.length) return {};
  let rows = [];
  try {
    rows = await q(
      `select state->'stuck' as stuck from lesson
        where child_id = $1 and state ? 'stuck' and started_at > now() - interval '14 days'
        order by started_at desc limit ${STUCK_LESSONS}`, [childId]);
  } catch { rows = []; }
  const want = new Set(skillIds), out = {};
  for (const r of Array.isArray(rows) ? rows : []) for (const [k, n] of Object.entries(r.stuck ?? {})) if (want.has(k) && Number(n) > 0) out[k] = (out[k] ?? 0) + Number(n);
  return out;
}

/** Classes 1-4 → "6-9", classes 5-9 → "10-15" (the two design bands of learning-science §3.8). */
// round 7 (decision D3): the legacy age band is the band table's (class 4 is "10-15" now); out of range → the nearest end
// (no class known: "10-15", as before)
export const ageBandFor = (classLevel) => {
  const c = Math.round(Number(classLevel));
  return Number.isFinite(c) ? BANDS[Math.min(9, Math.max(1, c))].contract : "10-15";
};

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
