// The single privacy-mode setting (LEARNER-MODEL §4, decision learner-legal-mode-ratchet).
// `child.legal_mode` ∈ M0 stateless · M1 academic record (launch default) · M2 school mode (DPA) · M3 full
// consumer. A layer not permitted in a mode has NO write path: assertWritable throws (never warns), and
// it is called only by the one writer module (server/learner/writer.js). The mode only ratchets DOWN.

export const LEGAL_MODES = Object.freeze(["M0", "M1", "M2", "M3"]);
export const DEFAULT_MODE = "M1";
const L1 = ["kt", "mis", "ability", "need_fact", "fade", "vibe_explicit", "mem_A", "lang_tile"];
const L2 = [...L1, "eta", "need_belief", "cri_agg", "mem_B", "lang_est"];
const L3 = [...L2, "vibe_slow", "interest", "value_arms", "pz_child", "cri"];
export const LAYERS = Object.freeze([...new Set(["session", ...L3, "research"])]);
export const WRITES = Object.freeze({
  M0: new Set(["session"]), M1: new Set(["session", ...L1]), M2: new Set(["session", ...L2]), M3: new Set(["session", ...L3]),
});

/**
 * Tables each persisted layer owns (the M0 ratchet and the per-mode deletes walk this). Legacy 001 tables
 * are listed with the layer whose data they hold.
 */
export const LAYER_TABLES = Object.freeze({
  kt: ["kt_evidence", "kt_skill_state", "evidence", "skill_state"],
  mis: ["kt_misconception", "misconception_state"],
  ability: ["kt_ability", "kt_ability_epoch"],
  eta: ["kt_child"],
  mem_A: ["memory"],
  pz_child: ["format_trial"],
});

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
  const allowed = WRITES[legalModeOf(to)];
  return [...new Set(Object.entries(LAYER_TABLES).filter(([layer]) => !allowed.has(layer)).flatMap(([, ts]) => ts))].sort();
}
