// The Teacher agent lane's read of one skill from the graded answers alone (round 5, stream 4A). The model says what it
// thinks; this is what the answers support. Three states (not / partly / understood), each answer a likelihood by how deep
// the item is, a small chance per answer that the child moved up a state while she taught (learning inside the lesson), and
// a read that needs the evidence to clear a bar before it says "understood" (an over-read reaches a parent; an under-read is
// fixed by the next lesson's first answer).
//
// The likelihoods are the classic slip / guess shape (BKT): someone who understands still slips on a plain item about 1 in
// 10 and on a why / predict / error-spot about 1 in 5; a partly child gets plain items right about half the time and deep
// ones about 1 in 4; a child who has not got it guesses a plain item about 1 in 7. PURE.

export const LEVELS = ["not", "partly", "understood"];
/** How deep an item is for the read: deep = it separates understood from partly (reasoning, prediction, error-spotting). */
const DEPTH = { why: "deep", predict: "deep", error_spot: "deep", teachback: "deep", far_transfer: "deep",
  contrast: "mid", near_transfer: "mid", translate_rep: "mid" };
export const depthOf = (kind) => DEPTH[kind] ?? "plain";

// P(answer | state) for correct and partly-right answers; wrong is the rest
const P = {
  plain: { not: [0.15, 0.10], partly: [0.5, 0.2], understood: [0.9, 0.05] },
  mid: { not: [0.1, 0.08], partly: [0.4, 0.2], understood: [0.85, 0.08] },
  deep: { not: [0.05, 0.05], partly: [0.25, 0.2], understood: [0.8, 0.1] },
};
const LEARN = 0.12;          // per answer, a child moves up one state with this chance (she is teaching)
const PRIOR = [0.3, 0.45, 0.25];

const outcomeOf = (g) => (g === "correct" ? 0 : String(g ?? "").startsWith("partly") ? 1 : 2);

/** Posterior over [not, partly, understood] after the graded answers in order. PURE. */
export function posteriorOf(graded, { prior = PRIOR, learn = LEARN } = {}) {
  let p = [...prior];
  for (const x of graded ?? []) {
    // a deep-tagged item the deep-kind audit marked plain (graded entry `plain`, kit item deep: false) weighs as plain
    const table = P[x.plain ? "plain" : depthOf(x.kind)];
    const o = outcomeOf(x.g);
    p = LEVELS.map((s, i) => { const [c, pt] = table[s]; const like = o === 0 ? c : o === 1 ? pt : Math.max(0.02, 1 - c - pt); return p[i] * like; });
    const z = p.reduce((a, b) => a + b, 0) || 1;
    p = p.map((v) => v / z);
    // learning after the answer (she explains it): a little mass moves up one state
    p = [p[0] * (1 - learn), p[1] * (1 - learn) + p[0] * learn, p[2] + p[1] * learn];
  }
  return p;
}

/**
 * The read: understood only when the evidence clears `bar`; otherwise the likelier of not / partly; no graded answer → null
 * (the caller keeps what it had). PURE.
 */
export function evidenceRead(graded, { bar = 0.6, ...o } = {}) {
  if (!(graded ?? []).length) return null;
  const [n, pa, u] = posteriorOf(graded, o);
  if (u >= bar) return "understood";
  return n > pa && n > u ? "not" : "partly";
}
