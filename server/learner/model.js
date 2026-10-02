// Learner-model persistence: skill_state, misconception_state, evidence, and the child brief.
// Every writer asserts its row count (inherited rejection: dead writers / UPDATE-only writers).
import { q, one } from "../db.js";
import { withDue } from "./bkt.js";
import { fitBrief, cleanRows } from "./brief.js";
import { misconceptionById, skillById } from "../content/index.js";

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

export async function saveSkillState(childId, s) {
  const rows = await q(
    `insert into skill_state(child_id, skill_id, p_known, status, attempts, correct_unaided, generative_pass, delayed_pass, last_seen, next_review)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     on conflict (child_id, skill_id) do update set p_known = excluded.p_known, status = excluded.status, attempts = excluded.attempts,
       correct_unaided = excluded.correct_unaided, generative_pass = excluded.generative_pass, delayed_pass = excluded.delayed_pass,
       last_seen = excluded.last_seen, next_review = excluded.next_review
     returning skill_id`,
    [childId, s.skillId, s.pKnown, s.status, s.attempts, s.correctUnaided, s.generativePass, s.delayedPass, s.lastSeen, s.nextReview ?? null]);
  expectRows(rows, 1, "skill_state upsert");
}

/** @param {import("../../shared/contracts").Evidence} ev */
export async function insertEvidence(childId, lessonId, ev, turnId) {
  const rows = await q(
    `insert into evidence(child_id, lesson_id, skill_id, item_id, probe, outcome, misconception_id, hints_used, weight, turn_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id`,
    [childId, lessonId, ev.skillId, ev.itemId ?? null, ev.probe, ev.outcome, ev.misconceptionId ?? null, ev.hintsUsed, ev.weight, turnId ?? null]);
  return expectRows(rows, 1, "evidence insert")[0].id;
}

/** A misconception showed up again: count it and (re)open it. */
export async function flagMisconception(childId, misconceptionId) {
  const rows = await q(
    `insert into misconception_state(child_id, misconception_id, evidence_count, resolved, last_seen) values ($1,$2,1,false,now())
     on conflict (child_id, misconception_id) do update set evidence_count = misconception_state.evidence_count + 1, resolved = false, last_seen = now()
     returning evidence_count`, [childId, misconceptionId]);
  return expectRows(rows, 1, "misconception_state upsert")[0].evidence_count;
}

/** An unaided correct answer on an item that targets an open misconception closes it (the count stays). */
export async function resolveMisconception(childId, misconceptionId) {
  await q("update misconception_state set resolved = true, last_seen = now() where child_id = $1 and misconception_id = $2 and not resolved",
    [childId, misconceptionId]);
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
 * Dialogue-observable vibe from the child's recent turns (any lesson). Humour uptake is not measured
 * yet, so it stays "medium" rather than pretending to know.
 */
function vibeFrom(texts) {
  if (!texts.length) return { pace: "medium", verbosity: "brief", humour: "medium" };
  const words = texts.map((t) => t.split(/\s+/).filter(Boolean).length);
  const avg = words.reduce((a, b) => a + b, 0) / words.length;
  const unsure = texts.filter((t) => /pata\s*nahi|nahi\s*pata|don'?t know|पता नहीं/i.test(t)).length / texts.length;
  return { pace: unsure > 0.3 ? "slow" : avg > 12 ? "fast" : "medium", verbosity: avg >= 6 ? "chatty" : "brief", humour: "medium" };
}

/**
 * Build the ChildBrief from the child row and the ledger. Memory callbacks only with `memory` consent.
 * @param {any} child  child row
 * @param {{ memory: boolean }} consent
 * @returns {Promise<import("../../shared/contracts").ChildBrief>}
 */
export async function buildChildBrief(child, { memory }) {
  const [rel, wins, misIds, memories, recentTurns] = await Promise.all([
    one("select stage, sessions from rel_state where child_id = $1", [child.id]),
    q(`select skill_id from skill_state where child_id = $1 and status in ('learned_today','mastered') order by last_seen desc limit 3`, [child.id]),
    loadActiveMisconceptionIds(child.id, 3),
    memory
      ? q("select text from memory where child_id = $1 and superseded_by is null order by created_at desc limit 3", [child.id])
      : Promise.resolve([]),
    q(`select t.text from turn t join lesson l on l.id = t.lesson_id where l.child_id = $1 and t.speaker = 'child'
       order by t.at desc limit 30`, [child.id]),
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
    vibe: vibeFrom(recentTurns.map((t) => t.text)),
    relationshipStage: `${stage} (${rel?.sessions ?? 0} sessions together)`,
  });
}
