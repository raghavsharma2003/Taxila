// The single privacy-mode setting (LEARNER-MODEL §4, decision learner-legal-mode-ratchet).
// `child.legal_mode` ∈ M0 stateless · M1 academic record (launch default) · M2 school mode (DPA) · M3 full
// consumer. A layer not permitted in a mode has NO write path: assertWritable throws (never warns), and
// it is called only by the one writer module (server/learner/writer.js). The mode only ratchets DOWN.

export const LEGAL_MODES = Object.freeze(["M0", "M1", "M2", "M3"]);
export const DEFAULT_MODE = "M1";
// rel_bond (RELATIONAL-OS §5.1, W2-I R0): the bond record — academic-record facts about what happened (stage from
// academic counts, the address the child conferred, teacher-owned events, fired milestone ids, the ritual ledger), M1+.
// rel_overlay (§9.1 L5): cross-session dependency counters — NM-3-adjacent behavioural monitoring, M3 only (counsel).
const L1 = ["kt", "mis", "ability", "need_fact", "fade", "vibe_explicit", "mem_A", "lang_tile", "rel_bond"];
const L2 = [...L1, "eta", "need_belief", "cri_agg", "mem_B", "lang_est"];
const L3 = [...L2, "vibe_slow", "interest", "value_arms", "pz_child", "cri", "rel_overlay"];
export const LAYERS = Object.freeze([...new Set(["session", ...L3, "research"])]);
export const WRITES = Object.freeze({
  M0: new Set(["session"]), M1: new Set(["session", ...L1]), M2: new Set(["session", ...L2]), M3: new Set(["session", ...L3]),
});

/**
 * Tables each persisted layer owns (the per-mode deletes walk this). Legacy 001 tables are listed with the
 * layer whose data they hold; rel_state is the session count (relationship stage = sessions only), part of
 * the academic record.
 */
export const LAYER_TABLES = Object.freeze({
  kt: ["kt_evidence", "kt_skill_state", "evidence", "skill_state", "rel_state"],
  mis: ["kt_misconception", "misconception_state"],
  ability: ["kt_ability", "kt_ability_epoch"],
  eta: ["kt_child"],
  mem_A: ["memory"],
  pz_child: ["format_trial"],
  // 018_relational.sql (W2-I): rel_bond is the per-(child, agent) bond record, rel_event its event log (moved here from
  // the M0 history list: its rows are now the bond record's events); rel_overlay_window exists only in M3.
  rel_bond: ["rel_bond", "rel_event"],
  rel_overlay: ["rel_overlay_window"],
});

/**
 * Child-keyed tables that hold persisted session history or per-child derived state but no mode layer yet
 * (transcripts, voice baselines, conductor folds, brief snapshots). M0 keeps nothing beyond the session, so
 * the ratchet to M0 deletes them too; moving between M1-M3 leaves them. `lesson` cascades its turn
 * (transcript), module_run and voice_feature rows.
 */
export const M0_HISTORY_TABLES = Object.freeze([
  "lesson", "voice_feature", "voice_baseline",
  "student_event", "conductor_state", "decision_log", "brief_snapshot", "day_plan",
  // comprehension engine (007_comprehension.sql): academic record derived from answers
  "comp_facet_state", "reteach_attempts", "rep_fluency", "weave_queue", "probe_log", "grade_audit",
  // 008_tutor_choice.sql: the child's tutor-switch analytics (choice history + time to choose) — history, not a layer
  "tutor_switch",
  // 010_parent_report.sql: rendered parent reports, derived from the academic evidence (claims cite ledger rows)
  "parent_report",
  // 011_teacher_name.sql: the names the child gave the teacher (accepted names and resets) — history, not a layer
  "teacher_name_history",
  // 018_relational.sql (W2-I): parent-visible relational facts (typed templates over closed slots) — history, deleted on M0
  "relational_note",
  // r4-khand (play_build migration): the child's saved Khand builds, a gallery derived from solved levels — history, deleted on M0
  "play_build",
]);

/**
 * Child-keyed tables the ratchet KEEPS in every mode, each with its reason (consent, audit, safeguarding,
 * identity and parent-entered facts, operational rows with no learner content).
 */
export const KEPT_TABLES = Object.freeze({
  consent: "consent record (NM-1)",
  learner_mode_audit: "audit of every mode change",
  incident: "safeguarding record",
  workspace: "child identity / lifecycle",
  child_seq: "event counter only (no content)",
  child_controls: "parent-entered controls",
  child_routine: "parent-entered routine",
  conductor_usage: "minutes used against the parent cap",
  job: "operational queue (cancel-or-run)",
  wakeup: "scheduler rows",
  notification: "guardian messages (safety/account intents)",
  notify_slot: "set-null tombstone (probe F3)",
});

/**
 * Every table with a child_id column, classified: a layer's table, an M0 history table, or kept. A table
 * missing here fails tests/learner-mode.test.mjs (migration scan) and tests/learner-db.test.mjs
 * (information_schema), so a new child table cannot silently survive the M0 ratchet.
 */
export function classifyChildTable(t) {
  if (Object.values(LAYER_TABLES).some((ts) => ts.includes(t))) return "layer";
  if (M0_HISTORY_TABLES.includes(t)) return "m0_delete";
  if (Object.hasOwn(KEPT_TABLES, t)) return "kept";
  return null;
}

/** The mode of a child row ({ legal_mode } or { legalMode }); a missing value is the launch default. */
export function legalModeOf(child) {
  const m = typeof child === "string" ? child : child?.legal_mode ?? child?.legalMode ?? DEFAULT_MODE;
  if (!LEGAL_MODES.includes(m)) throw new Error(`unknown legal_mode ${m}`);
  return m;
}

/** @param {any} child a child row, or a bare mode string */
export function canWrite(child, layer) {
  if (!LAYERS.includes(layer)) throw new Error(`unknown learner layer ${layer}`);
  const mode = legalModeOf(child);
  if (layer === "research") return mode !== "M0" && !!child?.consent?.P4;
  if (!WRITES[mode].has(layer)) return false;
  if (layer === "mem_B" && !child?.consent?.P3) return false;
  return true;
}

/** Throws unless `layer` may be persisted for this child. Called by writer.js only. */
export function assertWritable(child, layer) {
  if (canWrite(child, layer)) return;
  const mode = legalModeOf(child);
  if (layer === "mem_B" && WRITES[mode].has(layer)) throw new Error("P3 consent required");
  if (layer === "research") throw new Error(mode === "M0" ? "legal_mode M0 forbids research" : "P4 consent required");
  throw new Error(`legal_mode ${mode} forbids ${layer}`);
}

/** True when `to` is strictly below `from` (the only allowed direction). */
export const isRatchetDown = (from, to) => LEGAL_MODES.indexOf(legalModeOf(to)) < LEGAL_MODES.indexOf(legalModeOf(from));

/** Every learner table whose rows must go when a child moves to `to` (layers not allowed there). */
export function tablesForbiddenIn(to) {
  const mode = legalModeOf(to);
  const allowed = WRITES[mode];
  const layered = Object.entries(LAYER_TABLES).filter(([layer]) => !allowed.has(layer)).flatMap(([, ts]) => ts);
  return [...new Set([...layered, ...(mode === "M0" ? M0_HISTORY_TABLES : [])])].sort();
}
