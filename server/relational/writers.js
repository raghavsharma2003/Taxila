// Relational writers (RELATIONAL-OS R0: UPSERT writers for rel_state, rel_event and relational_note that assert their
// legal-mode layer, like server/learner/writer.js). W2 seam commit (BUILD-PLAN §4): OWNED BY W2-I, re-exported by
// server/learner/writer.js so every learner/relational write has one import point.
//
// Until W2-I fills it (with 018_relational.sql), it exports only the list of tables it will own: empty, so nothing
// classifies or writes them yet.

/** The relational tables these writers own (filled with 018_relational.sql: rel_state, rel_event, relational_note). */
export const RELATIONAL_TABLES = Object.freeze([]);
