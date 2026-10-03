// Host-side truth for G2 (pure; no browser, no network): the raw-kit answer key for a LevelSpec item, the
// re-derivation of a frame's answer from the server's own LevelSpec, and the unit solver the bot plays with.
// Shared by the QA gate (qa.js) and the lesson-time grader (serve.js), so the gate grades exactly as a lesson will.
import { parseValue, eq } from "../kitmath.js";

export const sameV = (a, b) => { const x = parseValue(a), y = parseValue(b); if (x && y) return eq(x, y); if (x || y) return false; return fold(a) === fold(b); };
export const fold = (s) => String(s ?? "").replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim().replace(/[.!?।]+$/u, "");

/** Raw-kit truth for one LevelSpec item id (independent of the LevelSpec the frame got). */
export function kitTruth(topic, itemId) {
  if (itemId.startsWith("diag:")) {
    const m = (topic.misconceptions || []).find((x) => `diag:${x.id}` === itemId);
    const opts = m?.diagnostic?.options || [];
    const right = opts.filter((o) => o.correct);
    if (right.length !== 1) return null;
    return { keys: [right[0].text.trim()], misc: Object.fromEntries(opts.filter((o) => !o.correct && o.misconceptionId).map((o) => [o.text.trim(), o.misconceptionId])) };
  }
  const it = (topic.items || []).find((x) => x.id === itemId);
  if (!it) return null;
  return { keys: [it.answer, ...(it.acceptable || [])].map((s) => String(s).trim()), misc: {}, raw: it };
}
export const regrade = (truth, value) => truth.keys.some((k) => sameV(k, value));

/** Host-side re-derivation of an answer event's value from the server's own LevelSpec. */
export function rederive(spec, payload) {
  if (spec.mode === "build") {
    if (!Array.isArray(payload.units) || payload.units.length !== spec.units.length) return { error: "units_shape" };
    let n = 0, d = 1;
    for (let k = 0; k < spec.units.length; k++) {
      const u = parseValue(spec.units[k].v); const c = payload.units[k];
      if (!u || !Number.isInteger(c) || c < 0 || c > 99) return { error: "units_value" };
      n = n * u.d + c * u.n * d; d = d * u.d;
    }
    const g = (a, b) => (b ? g(b, a % b) : Math.abs(a) || 1); const gg = g(n, d);
    return { value: d / gg === 1 ? String(n / gg) : `${n / gg}/${d / gg}` };
  }
  const slot = payload.ref?.slot;
  if (payload.ref?.item !== spec.id) return { error: "ref_item" };
  if (slot === "key") return { value: spec.key.v };
  const m = /^d:(\d+)$/.exec(slot || "");
  if (m && spec.distractors[+m[1]]) return { value: spec.distractors[+m[1]].v, misc: spec.distractors[+m[1]].misc || null };
  return { error: "ref_slot" };
}

/** Units to reach a key, greedy over the server's unit values (integers only in v0). */
export function solveUnits(spec, value = spec.key.v) {
  let rest = +value; const counts = spec.units.map(() => 0);
  const order = spec.units.map((u, k) => ({ k, v: +u.v })).sort((a, b) => b.v - a.v);
  for (const { k, v } of order) { const c = Math.floor(rest / v); counts[k] = c; rest -= c * v; }
  return rest === 0 && counts.every((c) => c <= 9) ? counts : null;
}

