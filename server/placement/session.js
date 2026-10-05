// The placement round as a serialisable state machine (RS-6 F2). Session 1 renders it as a Studio game round (RS-4), so
// nothing here is test-shaped copy: the client gets an item to present and sends back what the child said or tapped.
// State is plain JSON (store it in the `placement` table, migration patch in docs/design/reset/prework/rs6/patches/).
//
//   const { state, item } = startPlacement({ classLevel: 5, subject: "maths", seed });
//   const { state: s2, item: next, result } = answerPlacement(state, { itemId: item.id, response: "3250" });
import { loadBank, poolFor, strandFor } from "./bank.js";
import { nextItem, priorFor, result as resultOf, prng, IDK_WEIGHT } from "./cat.js";
import { gradePlacement, IDK } from "./grade.js";

export const isIdk = (r) => typeof r === "string" && IDK.test(r.trim());
/** Longest response the grader reads (a child's spoken answer is short; a pasted essay is not an answer). */
export const MAX_RESPONSE_CHARS = 200;

/** What the client may see: never the key, never which option is correct. Options in a seeded per-item order. */
export function publicItem(item, seed = 0) {
  if (!item) return null;
  const rnd = prng((seed >>> 0) ^ [...item.id].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261));
  const options = item.options ? item.options.map((o) => ({ t: o.text, k: rnd() })).sort((a, b) => a.k - b.k).map((o) => o.t) : undefined;
  return { id: item.id, format: item.format, prompt_en: item.prompt_en, prompt_hi: item.prompt_hi, ...(item.unit ? { unit: item.unit } : {}), ...(options ? { options } : {}) };
}

function ctx(state, bank) {
  const b = bank ?? loadBank();
  const byId = new Map(b.map((it) => [it.id, it]));
  const pool = poolFor(state.subject, state.classLevel, b);
  const asked = state.asked.map((a) => ({ item: byId.get(a.itemId), y: a.y, w: a.w })).filter((a) => a.item);
  const rnd = prng((state.seed >>> 0) + state.asked.length * 7919);
  return { byId, pool, asked, rnd };
}

/**
 * @param {{ classLevel: number, subject: "maths"|"evs"|"science", seed?: number, date?: string|Date, bank?: object[] }} o
 */
export function startPlacement({ classLevel, subject, seed = Date.now() >>> 0, date = new Date(), bank } = {}) {
  if (!Number.isInteger(classLevel) || classLevel < 3 || classLevel > 9) throw new Error(`placement: class ${classLevel} outside 3-9`);
  if (!["maths", "evs", "science"].includes(subject)) throw new Error(`placement: subject ${subject} has no placement bank`);
  const state = { v: 1, classLevel, subject, strand: strandFor(subject, classLevel), seed: seed >>> 0, date: new Date(date).toISOString(),
    prior: priorFor(classLevel), asked: [], current: null, done: false, result: null };
  const { pool, asked, rnd } = ctx(state, bank);
  const it = nextItem({ classLevel, pool, asked, prior: state.prior, rnd });
  if (!it) throw new Error(`placement: empty pool for class ${classLevel} ${subject}`);
  state.current = it.id;
  return { state, item: publicItem(it, state.seed) };
}

/**
 * Record one answer and move on. `response`: the child's words or typed text, a number, or { option: i } for a tapped
 * choice (index in the order publicItem showed). An unparseable answer is recorded without evidence; "I don't know" is
 * half an observation of not knowing (cat.js IDK_WEIGHT).
 * @returns {{ state: object, item: object|null, result: object|null, correct: boolean|null }}
 */
export function answerPlacement(state0, { itemId, response, ms } = {}, { bank } = {}) {
  if (!state0 || !Array.isArray(state0.asked)) throw Object.assign(new Error("placement: no state"), { code: "PLACEMENT_STALE" });
  if (state0.done) return { state: state0, item: null, result: state0.result, correct: null };
  // A double tap or a network retry re-sends the answer to the item just graded: idempotent, the current item again
  // (review 2026-10-05: this used to throw, a 500 mid-round). Any other stale id is still an error (route: 409).
  const lastId = state0.asked[state0.asked.length - 1]?.itemId;
  if (itemId !== state0.current && itemId === lastId) {
    const { byId: b0 } = ctx(state0, bank);
    return { state: state0, item: publicItem(b0.get(state0.current), state0.seed), result: null, correct: null, repeat: true };
  }
  if (itemId !== state0.current) throw Object.assign(new Error(`placement: answer for ${itemId}, but ${state0.current} is the current item`), { code: "PLACEMENT_STALE" });
  const state = structuredClone(state0);
  const { byId } = ctx(state, bank);
  const item = byId.get(itemId);
  if (typeof response === "string" && response.length > MAX_RESPONSE_CHARS) response = response.slice(0, MAX_RESPONSE_CHARS);
  if (response != null && typeof response === "object" && !Number.isInteger(response.option)) response = null;
  const shown = publicItem(item, state.seed)?.options;
  // An item retired from the bank since the round began (bank update mid-round) is censored, never a crash.
  const correct = !item ? null : isIdk(response) ? false : gradePlacement(item, response, shown);
  const entry = { itemId, y: correct === true ? 1 : correct === false ? 0 : null, ...(isIdk(response) ? { w: IDK_WEIGHT, idk: true } : {}), ...(Number.isFinite(Number(ms)) && ms !== null && ms !== "" ? { ms: Math.max(0, Math.round(Number(ms))) } : {}) };
  state.asked.push(entry);
  const c2 = ctx(state, bank);
  const next = nextItem({ classLevel: state.classLevel, pool: c2.pool, asked: c2.asked, prior: state.prior, rnd: c2.rnd });
  if (!next) {
    state.done = true; state.current = null;
    state.result = resultOf({ classLevel: state.classLevel, strand: state.strand, asked: c2.asked, prior: state.prior, date: state.date });
    return { state, item: null, result: state.result, correct };
  }
  state.current = next.id;
  return { state, item: publicItem(next, state.seed), result: null, correct };
}
