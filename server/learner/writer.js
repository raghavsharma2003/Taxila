// THE learner writer (LEARNER-MODEL §4, §8 conventions): every insert/update/delete of learner state is
// built here, and every builder calls assertWritable(child, layer) first, so a layer the child's
// legal_mode does not permit has no write path at all. Builders return { text, params, layer } for the
// caller's ONE turn transaction (db.js tx); `commit` runs them under the child's advisory lock.
// Every statement RETURNs a row so the caller can assert its count (inherited: dead writers).
import { tx } from "../db.js";
import { assertWritable, isRatchetDown, legalModeOf, tablesForbiddenIn, DEFAULT_MODE } from "./mode.js";
import { dropReason } from "./kt/bktr.js";
import { ENGINE_VERSION } from "./kt/ability.js";

const stmt = (layer, text, params) => ({ text, params, layer });
/** The child's write context: { id, legal_mode, consent }. A bare id string means the launch default. */
const ctxOf = (child) => (typeof child === "string" ? { id: child, legal_mode: DEFAULT_MODE } : child);

// ───────────── legacy 001 tables (the live route's statements; signatures kept, mode added last) ─────────────

/** skill_state upsert (legacy ledger). @param {import("../../shared/contracts").SkillState} s */
export function skillStateStmt(childId, s, child = childId) {
  assertWritable(ctxOf(child), "kt");
  return stmt("kt", `insert into skill_state(child_id, skill_id, p_known, status, attempts, correct_unaided, generative_pass, delayed_pass, last_seen, next_review)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     on conflict (child_id, skill_id) do update set p_known = excluded.p_known, status = excluded.status, attempts = excluded.attempts,
       correct_unaided = excluded.correct_unaided, generative_pass = excluded.generative_pass, delayed_pass = excluded.delayed_pass,
       last_seen = excluded.last_seen, next_review = excluded.next_review
     returning skill_id`,
  [childId, s.skillId, s.pKnown, s.status, s.attempts, s.correctUnaided, s.generativePass, s.delayedPass, s.lastSeen, s.nextReview ?? null]);
}

/**
 * Legacy evidence row.
 * @param {{ lessonId: string, seq: number } | null} turnRef the turn row it came from, by (lesson, seq)
 */
export function evidenceStmt(childId, lessonId, ev, turnRef, child = childId) {
  assertWritable(ctxOf(child), "kt");
  return stmt("kt", `insert into evidence(child_id, lesson_id, skill_id, item_id, probe, outcome, misconception_id, hints_used, weight, turn_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,(select id from turn where lesson_id = $10 and seq = $11)) returning id`,
  [childId, lessonId, ev.skillId, ev.itemId ?? null, ev.probe, ev.outcome, ev.misconceptionId ?? null, ev.hintsUsed, ev.weight,
    turnRef?.lessonId ?? null, turnRef?.seq ?? null]);
}

/** A misconception showed up again: count it and (re)open it (legacy counts table). */
export function misconceptionFlagStmt(childId, misconceptionId, child = childId) {
  assertWritable(ctxOf(child), "mis");
  return stmt("mis", `insert into misconception_state(child_id, misconception_id, evidence_count, resolved, last_seen) values ($1,$2,1,false,now())
     on conflict (child_id, misconception_id) do update set evidence_count = misconception_state.evidence_count + 1, resolved = false, last_seen = now()
     returning evidence_count`, [childId, misconceptionId]);
}

/** An unaided correct answer on an item that targets an open misconception closes it (the count stays). */
export function misconceptionResolveStmt(childId, misconceptionId, child = childId) {
  assertWritable(ctxOf(child), "mis");
  return stmt("mis", "update misconception_state set resolved = true, last_seen = now() where child_id = $1 and misconception_id = $2 and not resolved returning misconception_id",
    [childId, misconceptionId]);
}

// ───────────── 005 tables (the BKT-R / θ ledger) ─────────────

/** Events that are never written: ASR-dropped and safety turns (counted by cohort elsewhere, KT R23). */
export const unwritable = (ev) => ["low_asr", "safety"].includes(dropReason(ev) ?? "");

/** One kt_evidence row (append-only; seq is assigned by the database under the advisory lock). */
export function ktEvidenceStmt(child, ev) {
  const c = ctxOf(child);
  assertWritable(c, "kt");
  if (unwritable(ev)) throw new Error(`kt_evidence ${ev.id}: ${dropReason(ev)} events are never written`);
  return stmt("kt", `insert into kt_evidence(id, child_id, session_id, session_start_at, episode_id, occurred_at, skill_ids, cls, outcome,
       grader, grader_version, item_key, teach, assisted, controller_easy, gaming_window, pre_attempt_help, form, target,
       topic_type, misconception_id, discriminates, mis_route, entry_rung, contaminated, kit_verified, params_version, legal_mode_at_write)
     values ($1,$2,$3,$4,$5,$6,$7::text[],$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28)
     on conflict (id) do nothing returning seq`,
  [ev.id, c.id, ev.sessionId, ev.sessionStartAt ?? ev.at, ev.episodeId, ev.at ?? ev.sessionStartAt, ev.skillIds, ev.teach ? "teach" : ev.cls, ev.teach ? -1 : ev.outcome,
    ev.grader ?? "code", ev.graderVersion ?? "v0", ev.itemKey ?? "", !!ev.teach, ev.assisted ?? null, !!ev.controllerEasy, !!ev.gamingWindowKt,
    !!ev.preAttemptHelp, ev.form ?? null, ev.target ?? null, ev.topicType ?? null, ev.misconceptionId ?? null, ev.discriminates ?? null,
    ev.misRoute ?? null, ev.entryRung ?? 0, !!ev.contaminated, ev.kitVerified ?? null, ev.paramsVersion ?? "kt-launch-2026-10-02", legalModeOf(c)]);
}

/** kt_skill_state upsert from a ledger skill (the cached fold; kt_evidence is the truth). */
export function ktSkillStateStmt(child, sk) {
  const c = ctxOf(child);
  assertWritable(c, "kt");
  const { skillId, paramsVersion, pL, retention, mem, n, flags, recent, opp, run, display, refresh, nextReviewAt, prior, ...extra } = sk;
  return stmt("kt", `insert into kt_skill_state(child_id, skill_id, params_version, p_l, retention, mem, n, flags, recent, opp, run, display, refresh,
       next_review_at, prior_pl0, prior_epoch_id, prior_seq, extra, legal_mode_at_write, updated_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9::smallint[],$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,now())
     on conflict (child_id, skill_id) do update set params_version = excluded.params_version, p_l = excluded.p_l, retention = excluded.retention,
       mem = excluded.mem, n = excluded.n, flags = excluded.flags, recent = excluded.recent, opp = excluded.opp, run = excluded.run,
       display = excluded.display, refresh = excluded.refresh, next_review_at = excluded.next_review_at, extra = excluded.extra,
       legal_mode_at_write = excluded.legal_mode_at_write, updated_at = now()
     returning skill_id`,
  [c.id, skillId, paramsVersion, pL, retention, mem, n, flags, recent, opp, run, display, refresh, nextReviewAt ?? null,
    prior?.pL0 ?? null, prior?.epochId ?? null, prior?.seq ?? null, extra, legalModeOf(c)]);
}

export function ktMisconceptionStmt(child, m) {
  const c = ctxOf(child);
  assertWritable(c, "mis");
  return stmt("mis", `insert into kt_misconception(child_id, misconception_id, logit, hits, last_at, resolved_at, check_scheduled_at, legal_mode_at_write)
     values ($1,$2,$3,$4,$5,$6,$7,$8)
     on conflict (child_id, misconception_id) do update set logit = excluded.logit, hits = excluded.hits, last_at = excluded.last_at,
       resolved_at = excluded.resolved_at, check_scheduled_at = excluded.check_scheduled_at, legal_mode_at_write = excluded.legal_mode_at_write
     returning misconception_id`,
  [c.id, m.misconceptionId, m.logit, m.hits, m.lastAt, m.resolvedAt, m.checkScheduledAt, legalModeOf(c)]);
}

/** The epoch base per (child, subject) plus its marginal kt_ability rows (one writer for both views). */
export function ktAbilityStmts(child, subject, epoch, theta) {
  const c = ctxOf(child);
  assertWritable(c, "ability");
  const { base } = epoch;
  const out = [stmt("ability", `insert into kt_ability_epoch(child_id, subject, epoch_id, session_id, opened_at, strands, m, s, sd0, engine_version, legal_mode_at_write)
     values ($1,$2,$3,$4,$5,$6::text[],$7::float8[],$8::float8[],$9::float8[],$10,$11)
     on conflict (child_id, subject) do update set epoch_id = excluded.epoch_id, session_id = excluded.session_id, opened_at = excluded.opened_at,
       strands = excluded.strands, m = excluded.m, s = excluded.s, sd0 = excluded.sd0, engine_version = excluded.engine_version,
       legal_mode_at_write = excluded.legal_mode_at_write
     returning subject`,
  [c.id, subject, base.epochId, epoch.sessionId ?? null, base.openedAt, base.strands, base.m, base.S, base.sd0, ENGINE_VERSION, legalModeOf(c)])];
  for (const [strand, t] of Object.entries(theta ?? {}).sort()) {
    out.push(stmt("ability", `insert into kt_ability(child_id, strand, mu, sd, n_obs, engine_version, legal_mode_at_write, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,now())
       on conflict (child_id, strand) do update set mu = excluded.mu, sd = excluded.sd, n_obs = excluded.n_obs, engine_version = excluded.engine_version,
         legal_mode_at_write = excluded.legal_mode_at_write, updated_at = now()
       returning strand`, [c.id, strand, t.mu, t.sd, t.nObs ?? 0, ENGINE_VERSION, legalModeOf(c)]));
  }
  return out;
}

/**
 * Statements for what one fold changed: the new events, every skill/misconception whose bytes changed,
 * and the ability rows of subjects touched. In a mode that forbids a layer, that layer is simply not
 * staged (M0 children keep their ledger in session memory only); a FORBIDDEN layer is never written.
 * @param {any} child
 * @param {import("../../shared/learner").Ledger} before
 * @param {import("../../shared/learner").Ledger} after
 * @param {import("../../shared/learner").EvidenceEvent[]} events
 * @param {{ currentTheta?: (epoch: any) => any }} [opt]
 */
export function ledgerStmts(child, before, after, events, { currentTheta } = {}) {
  const c = ctxOf(child);
  const mode = legalModeOf(c);
  if (mode === "M0") return [];
  const out = [];
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  for (const ev of events) if (!unwritable(ev) && after.seen[ev.id] !== undefined && before.seen[ev.id] === undefined) out.push(ktEvidenceStmt(c, ev));
  for (const [id, sk] of Object.entries(after.skills).sort()) if (!same(before.skills[id], sk)) out.push(ktSkillStateStmt(c, sk));
  for (const [id, m] of Object.entries(after.mis).sort()) if (!same(before.mis[id], m)) out.push(ktMisconceptionStmt(c, m));
  for (const [subject, ep] of Object.entries(after.ability).sort()) {
    if (same(before.ability[subject], ep)) continue;
    out.push(...ktAbilityStmts(c, subject, ep, currentTheta ? currentTheta(ep) : undefined));
  }
  return out;
}

/** The serialising lock for one child's learner writes (LEARNER-MODEL §5: order by seq under the lock). */
export const lockStmt = (childId) => stmt("session", "select pg_advisory_xact_lock(hashtext($1)) is null as locked", [String(childId)]);

/** Run the staged statements in ONE transaction under the child's advisory lock. */
export async function commit(child, stmts) {
  const c = ctxOf(child);
  for (const s of stmts) if (s.layer) assertWritable(c, s.layer);
  return stmts.length ? (await tx([lockStmt(c.id), ...stmts])).slice(1) : [];
}

// ───────────── the ratchet (§4) ─────────────

/**
 * Move a child DOWN to mode `to` in one transaction: the mode change (guarded on the current mode, so a
 * concurrent ratchet loses), an audit row, and deletes of every learner table the new mode forbids.
 * Moving up is refused; moving to the same mode is a no-op ([]).
 */
export function ratchetStmts(child, to, { actor = "system", reason = "unspecified" } = {}) {
  const c = ctxOf(child);
  const from = legalModeOf(c);
  if (from === legalModeOf(to)) return [];
  if (!isRatchetDown(from, to)) throw new Error(`legal_mode only ratchets down (${from} → ${to} refused)`);
  return [
    stmt("session", `with g as (update child set legal_mode = $2 where id = $1 and legal_mode = $3 returning id) select 1 / count(*) as ok from g`, [c.id, to, from]),
    stmt("session", "insert into learner_mode_audit(child_id, from_mode, to_mode, reason, actor, at) values ($1,$2,$3,$4,$5,now()) returning id", [c.id, from, to, reason, actor]),
    ...tablesForbiddenIn(to).map((t) => stmt("session", `delete from ${t} where child_id = $1`, [c.id])),
  ];
}
