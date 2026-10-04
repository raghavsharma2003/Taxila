// The Relational OS seam into the live lesson (BUILD-PLAN §4, W2 seam commit). OWNED BY W2-I; call sites owned by
// W2-E (BR5 splits the directive into the kernel's authority ranks: safety and the floor first, then RELEASE, consent,
// the teacher-owned repair, and rapport). Contract, binding on the owner:
//   - snapshot(childId) is called ONCE per lesson at start, beside the other start reads; it may read the DB, it never
//     throws into the start (the call site guards it) and it returns null when the child has no bond rows yet;
//   - decide(input) is PURE and SYNCHRONOUS (≤ 3 ms p99, 0 network; RELATIONAL-OS R1): one RelationalDirective per turn,
//     or null for "no relational move" (the turn is then byte-identical to the pre-seam turn);
//   - onLessonEnd returns statements ({ text, params }) appended to the end transaction AFTER the caller's own rows,
//     exactly like server/conductor/hooks.js: no network, no await, never throws, [] when there is nothing to write;
//   - the relational floor (F1-F6, F8-F9) ranks first in the kernel's order; nothing here may weaken the child-safety
//     floor (never deny being an AI, Childline 1098 / Tele-MANAS 14416, no romance or companion register, safeguarding
//     hand-off); teacher affect is never keyed to a correct verdict (TA1).
//
// Until W2-I fills it: snapshot → null, decide → null, onLessonEnd → [].

/** @typedef {{ text: string, params?: unknown[] }} Stmt */

export const relationalSeam = {
  /**
   * @param {string} _childId
   * @param {{ classLevel: number, lang?: string }} [_opts]
   * @returns {Promise<import("../../shared/relational").BondSnapshot | null>}
   */
  async snapshot(_childId, _opts) { return null; },

  /**
   * @param {import("../../shared/relational").RelDecideInput} _input
   * @returns {import("../../shared/relational").RelationalDirective | null}
   */
  decide(_input) { return null; },

  /**
   * @param {{ id: string, class_level?: number, legal_mode?: string }} _child
   * @param {import("../../shared/relational").RelLessonEnd} _end
   * @returns {Stmt[]}
   */
  onLessonEnd(_child, _end) { return []; },
};
