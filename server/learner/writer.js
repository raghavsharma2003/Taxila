// THE learner writer (LEARNER-MODEL §4, §8 conventions): every insert/update/delete of learner state is
// built here, and every builder calls assertWritable(child, layer) first, so a layer the child's
// legal_mode does not permit has no write path at all. Builders return { text, params, layer } for the
// caller's ONE turn transaction (db.js tx); `commit` runs them under the child's advisory lock, re-checks
// the mode inside the transaction, and asserts every statement's row count (inherited: dead writers).
//
// A builder takes the CHILD ROW ({ id, legal_mode, consent? }), never a bare id: an id says nothing about
// the mode, and assuming the launch default for it is how an M0 child kept getting M1 writes.
import { q, tx } from "../db.js";
import { assertWritable, canWrite, classifyChildTable, isRatchetDown, legalModeOf, tablesForbiddenIn } from "./mode.js";
import { dropReason } from "./kt/bktr.js";
import { ENGINE_VERSION, currentTheta } from "./kt/ability.js";
import { foldOrder } from "./kt/ledger.js";
// W2 seam commit (BUILD-PLAN §4): the Relational OS writers (W2-I) are reached through this module too, so a learner or
// relational write has one import point. A name defined here shadows a same-named relational export (ESM rule).
export * from "../relational/writers.js";

/**
 * @param {string} layer
 * @param {string} text
 * @param {any[]} params
 * @param {{ rows?: 'one' | 'any' }} [o] rows: what commit asserts ('one' = exactly one row, the default)
 */
const stmt = (layer, text, params, { rows = "one" } = {}) => ({ text, params, layer, rows });

/**
 * The child's write context. Throws on a bare id or a row without its mode (never assumes M1).
 * @param {any} child
 * @returns {{ id: string, legal_mode: string, consent?: Record<string, boolean> }}
 */
export function ctxOf(child) {
  if (!child || typeof child !== "object" || !child.id) throw new Error("learner writer: the child row ({ id, legal_mode }) is required, not a bare id");
  const mode = child.legal_mode ?? child.legalMode;
  if (mode == null) throw new Error(`learner writer: child ${child.id} has no legal_mode (load the row, never assume a mode)`);
  return { ...child, legal_mode: legalModeOf(mode) };
}
const sameChild = (childId, c) => {
  if (String(childId) !== String(c.id)) throw new Error(`learner writer: childId ${childId} ≠ child row ${c.id}`);
};

// ───────────── legacy 001 tables (the live route's statements; the child row is the last argument) ─────────────

/** skill_state upsert (legacy ledger). @param {import("../../shared/contracts").SkillState} s */
export function skillStateStmt(childId, s, child) {
  const c = ctxOf(child); sameChild(childId, c);
  assertWritable(c, "kt");
  return stmt("kt", `insert into skill_state(child_id, skill_id, p_known, status, attempts, correct_unaided, generative_pass, delayed_pass, last_seen, next_review)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     on conflict (child_id, skill_id) do update set p_known = excluded.p_known, status = excluded.status, attempts = excluded.attempts,
       correct_unaided = excluded.correct_unaided, generative_pass = excluded.generative_pass, delayed_pass = excluded.delayed_pass,
       last_seen = excluded.last_seen, next_review = excluded.next_review
     returning skill_id`,
  [c.id, s.skillId, s.pKnown, s.status, s.attempts, s.correctUnaided, s.generativePass, s.delayedPass, s.lastSeen, s.nextReview ?? null]);
}

/**
 * Legacy evidence row.
 * @param {{ lessonId: string, seq: number } | null} turnRef the turn row it came from, by (lesson, seq)
 */
export function evidenceStmt(childId, lessonId, ev, turnRef, child) {
  const c = ctxOf(child); sameChild(childId, c);
  assertWritable(c, "kt");
  return stmt("kt", `insert into evidence(child_id, lesson_id, skill_id, item_id, probe, outcome, misconception_id, hints_used, weight, turn_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,(select id from turn where lesson_id = $10 and seq = $11)) returning id`,
  [c.id, lessonId, ev.skillId, ev.itemId ?? null, ev.probe, ev.outcome, ev.misconceptionId ?? null, ev.hintsUsed, ev.weight,
    turnRef?.lessonId ?? null, turnRef?.seq ?? null]);
}

/** A misconception showed up again: count it and (re)open it (legacy counts table). */
export function misconceptionFlagStmt(childId, misconceptionId, child) {
  const c = ctxOf(child); sameChild(childId, c);
  assertWritable(c, "mis");
  return stmt("mis", `insert into misconception_state(child_id, misconception_id, evidence_count, resolved, last_seen) values ($1,$2,1,false,now())
     on conflict (child_id, misconception_id) do update set evidence_count = misconception_state.evidence_count + 1, resolved = false, last_seen = now()
     returning evidence_count`, [c.id, misconceptionId]);
}

/** An unaided correct answer on an item that targets an open misconception closes it (the count stays). */
export function misconceptionResolveStmt(childId, misconceptionId, child) {
  const c = ctxOf(child); sameChild(childId, c);
  assertWritable(c, "mis");
  return stmt("mis", "update misconception_state set resolved = true, last_seen = now() where child_id = $1 and misconception_id = $2 and not resolved returning misconception_id",
    [c.id, misconceptionId], { rows: "any" });           // nothing open to close is a legitimate no-op
}

// ───────────── memory, format trials, relationship stage (were inserted directly by routes/lesson.js) ─────────────

/**
 * The memory layer a kind belongs to (LEARNER-MODEL §4 / LM14): tier A (learning moments) is mem_A, tier B
 * (interests, preferences) is mem_B (M2+ and P3), tier C (life events, jokes, people) is not built: null.
 */
export const MEMORY_LAYER = Object.freeze({
  learning_moment: "mem_A", commitment: "mem_A", open_thread: "mem_A", win: "mem_A", struggle: "mem_A",
  interest: "mem_B", favourite: "mem_B", preference: "mem_B",
});
export const memoryLayer = (kind) => MEMORY_LAYER[kind] ?? null;
/** May a memory of this kind be persisted for this child? (tier C never.) */
export const canWriteMemory = (child, kind) => { const l = memoryLayer(kind); return !!l && canWrite(ctxOf(child), l); };

/** One cited memory row (every fact names the turn it came from). */
export function memoryStmt(child, { kind, text, sourceTurn }) {
  const c = ctxOf(child);
  const layer = memoryLayer(kind);
  if (!layer) throw new Error(`memory kind ${kind} is tier C (not built): no write path`);
  assertWritable(c, layer);
  if (sourceTurn == null) throw new Error("memory: a cited source turn is required");
  return stmt(layer, "insert into memory(child_id, kind, text, source_turn) values ($1,$2,$3,$4) returning id", [c.id, kind, text, sourceTurn]);
}

/** A per-child format trial (format efficacy per child = pz_child: M3 only). */
export function formatTrialStmt(child, { skillId, topicType, format, allocatedBy = "prior", immediate }) {
  const c = ctxOf(child);
  assertWritable(c, "pz_child");
  return stmt("pz_child", "insert into format_trial(child_id, skill_id, topic_type, format, allocated_by, immediate) values ($1,$2,$3,$4,$5,$6) returning id",
    [c.id, skillId, topicType, format, allocatedBy, immediate]);
}

/**
 * One more session together: the relationship stage is the session count ONLY (LEARNER-MODEL B0 "remove
 * rel_state.trust"; trust is never persisted, NM-3). Part of the academic record, so layer kt (M1+).
 */
export function relSessionStmt(child) {
  const c = ctxOf(child);
  assertWritable(c, "kt");
  return stmt("kt", `insert into rel_state(child_id, sessions, stage) values ($1, 1, 'getting_to_know')
       on conflict (child_id) do update set sessions = rel_state.sessions + 1,
         stage = case when rel_state.sessions + 1 >= 20 then 'established' when rel_state.sessions + 1 >= 5 then 'familiar' else 'getting_to_know' end,
         updated_at = now()
       returning sessions`, [c.id]);
}

// ───────────── 005 tables (the BKT-R / θ ledger) ─────────────

/** Events that are never written: ASR-dropped and safety turns (counted by cohort elsewhere, KT R23). */
export const unwritable = (ev) => ["low_asr", "safety"].includes(dropReason(ev) ?? "");

/**
 * One kt_evidence row (append-only; seq is assigned by the database under the advisory lock). Always one
 * row back: the new seq, or null for a re-delivery of an event THIS child already logged (an explicit
 * no-op). An id held by ANOTHER child aborts the transaction (1/0): it is never silently dropped, because
 * the cached fold already counted it.
 */
export function ktEvidenceStmt(child, ev) {
  const c = ctxOf(child);
  assertWritable(c, "kt");
  if (unwritable(ev)) throw new Error(`kt_evidence ${ev.id}: ${dropReason(ev)} events are never written`);
  return stmt("kt", `with ins as (insert into kt_evidence(id, child_id, session_id, session_start_at, episode_id, occurred_at, skill_ids, cls, outcome,
       grader, grader_version, item_key, teach, assisted, controller_easy, gaming_window, pre_attempt_help, form, target,
       topic_type, misconception_id, discriminates, mis_route, entry_rung, contaminated, kit_verified, params_version, legal_mode_at_write,
       via, ebo, shape_id, weave_host, coincident, unfamiliar_context, deference_discount, span_ok)
     values ($1,$2,$3,$4,$5,$6,$7::text[],$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,
       $29,$30,$31,$32,$33,$34,$35,$36)
     on conflict do nothing returning seq)
     select (select seq from ins) as seq,
       1 / ((select count(*) from ins) + (select count(*) from kt_evidence k where k.child_id = $2 and k.id = $1)) as ok`,
  [ev.id, c.id, ev.sessionId, ev.sessionStartAt ?? ev.at, ev.episodeId, ev.at ?? ev.sessionStartAt, ev.skillIds, ev.teach ? "teach" : ev.cls, ev.teach ? -1 : ev.outcome,
    ev.grader ?? "code", ev.graderVersion ?? "v0", ev.itemKey ?? "", !!ev.teach, ev.assisted ?? null, !!ev.controllerEasy, !!ev.gamingWindowKt,
    !!ev.preAttemptHelp, ev.form ?? null, ev.target ?? null, ev.topicType ?? null, ev.misconceptionId ?? null, ev.discriminates ?? null,
    ev.misRoute ?? null, ev.entryRung ?? 0, !!ev.contaminated, ev.kitVerified ?? null, ev.paramsVersion ?? "kt-launch-2026-10-02", legalModeOf(c),
    // CE contract fields (007_comprehension.sql): the facet fold reads them on replay, so they are the log too.
    ev.via ?? null, ev.ebo ?? null, ev.shapeId ?? null, ev.weaveHost ?? null, !!ev.coincident, !!ev.unfamiliarContext, !!ev.deferenceDiscount,
    typeof ev.spanOk === "boolean" ? ev.spanOk : null]);
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

/**
 * The epoch base per (child, subject) plus its marginal kt_ability rows (one writer for both views). θ is
 * computed here from the epoch when the caller does not pass it, so the marginal view can never go stale.
 */
export function ktAbilityStmts(child, subject, epoch, theta = currentTheta(epoch)) {
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
 * and the ability rows (epoch base AND marginals) of subjects touched. In a mode that forbids a layer,
 * that layer is simply not staged (M0 children keep their ledger in session memory only); a FORBIDDEN
 * layer is never written.
 *
 * kt_evidence inserts are staged in foldOrder(events), deduplicated: the order the fold applied them, so
 * the seq the database assigns reproduces the cached fold on replay (TP2 on the write path).
 * @param {any} child
 * @param {import("../../shared/learner").Ledger} before
 * @param {import("../../shared/learner").Ledger} after
 * @param {import("../../shared/learner").EvidenceEvent[]} events
 * @param {{ currentTheta?: (epoch: any) => any }} [opt] θ override (tests); defaults to ability.currentTheta
 */
export function ledgerStmts(child, before, after, events, { currentTheta: thetaOf = currentTheta } = {}) {
  const c = ctxOf(child);
  const mode = legalModeOf(c);
  if (mode === "M0") return [];
  const out = [];
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const staged = new Set();
  for (const ev of foldOrder(events)) {
    if (staged.has(ev.id) || unwritable(ev) || after.seen[ev.id] === undefined || before.seen[ev.id] !== undefined) continue;
    staged.add(ev.id);
    out.push(ktEvidenceStmt(c, ev));
  }
  for (const [id, sk] of Object.entries(after.skills).sort()) if (!same(before.skills[id], sk)) out.push(ktSkillStateStmt(c, sk));
  for (const [id, m] of Object.entries(after.mis).sort()) if (!same(before.mis[id], m)) out.push(ktMisconceptionStmt(c, m));
  for (const [subject, ep] of Object.entries(after.ability).sort()) {
    if (same(before.ability[subject], ep)) continue;
    out.push(...ktAbilityStmts(c, subject, ep, thetaOf(ep)));
  }
  return out;
}

/** The serialising lock for one child's learner writes (LEARNER-MODEL §5: order by seq under the lock). */
export const lockStmt = (childId) => stmt("session", "select pg_advisory_xact_lock(hashtext($1)) is null as locked", [String(childId)]);

/**
 * Aborts the transaction (1/0) unless the child is STILL in `mode`: a turn that read the child as M1 must
 * not write after a ratchet to M0 committed (both take the same advisory lock, so this check is serialised).
 */
export const modeGuardStmt = (childId, mode) =>
  stmt("session", "select 1 / count(*) as ok from child where id = $1 and legal_mode = $2", [String(childId), legalModeOf(mode)]);

/**
 * Run the staged statements in ONE transaction: the child's advisory lock, the mode re-check, then the
 * writes. Every write must return exactly one row (rows: 'any' for the declared no-op updates), else
 * this throws — a dead writer is never silent.
 * @returns {Promise<any[][]>} rows per staged statement
 */
export async function commit(child, stmts) {
  const c = ctxOf(child);
  for (const s of stmts) if (s.layer) assertWritable(c, s.layer);
  if (!stmts.length) return [];
  const out = (await tx([lockStmt(c.id), modeGuardStmt(c.id, c.legal_mode), ...stmts])).slice(2);
  stmts.forEach((s, i) => {
    if ((s.rows ?? "one") === "one" && out[i]?.length !== 1) throw new Error(`learner commit: statement ${i} (${s.layer}) returned ${out[i]?.length ?? 0} rows, expected 1`);
  });
  return out;
}

// ───────────── the ratchet (§4) ─────────────

/**
 * Move a child DOWN to mode `to` in one transaction: the child's advisory lock (the same one every turn
 * write takes, so a ratchet and a turn are serialised), the mode change (guarded on the current mode, so a
 * concurrent ratchet loses), an audit row, and deletes of every table the new mode forbids (on M0: every
 * persisted learner row; consent, audit, safeguarding and identity rows stay — mode.js CHILD_TABLES).
 * Moving up is refused; moving to the same mode is a no-op ([]).
 */
export function ratchetStmts(child, to, { actor = "system", reason = "unspecified", existing = null } = {}) {
  const c = ctxOf(child);
  const from = legalModeOf(c);
  if (from === legalModeOf(to)) return [];
  if (!isRatchetDown(from, to)) throw new Error(`legal_mode only ratchets down (${from} → ${to} refused)`);
  const tables = tablesForbiddenIn(to).filter((t) => !existing || existing.has(t));
  return [
    lockStmt(c.id),
    stmt("session", `with g as (update child set legal_mode = $2 where id = $1 and legal_mode = $3 returning id) select 1 / count(*) as ok from g`, [c.id, to, from]),
    stmt("session", "insert into learner_mode_audit(child_id, from_mode, to_mode, reason, actor, at) values ($1,$2,$3,$4,$5,now()) returning id", [c.id, from, to, reason, actor]),
    ...tables.map((t) => stmt("session", `delete from ${t} where child_id = $1`, [c.id], { rows: "any" })),
  ];
}

/** Every table in the live schema with a child_id column. */
export const CHILD_TABLES_SQL = "select distinct table_name from information_schema.columns where table_schema = current_schema() and column_name = 'child_id' order by 1";

/**
 * The deletion list checked against the LIVE schema (information_schema): refuses to ratchet while any
 * child_id table is unclassified in mode.js (it might hold learner rows the ratchet would leave behind),
 * and deletes only tables that exist (a migration not yet applied here has nothing to delete).
 * @param {string[]} liveTables CHILD_TABLES_SQL's rows
 */
export function ratchetPlan(child, to, liveTables, opts = {}) {
  const unclassified = liveTables.filter((t) => !classifyChildTable(t));
  if (unclassified.length) throw new Error(`ratchet refused: unclassified child_id tables ${unclassified.join(", ")} (server/learner/mode.js)`);
  return ratchetStmts(child, to, { ...opts, existing: new Set(liveTables) });
}

/** Run the ratchet: read the live child tables, plan, and apply in ONE transaction. */
export async function ratchet(child, to, opts = {}) {
  const live = (await q(CHILD_TABLES_SQL)).map((r) => r.table_name);
  const stmts = ratchetPlan(child, to, live, opts);
  return stmts.length ? tx(stmts) : [];
}
