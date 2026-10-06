// The host's grade session for a Stagecraft piece on stage (ship5 p4-content). Same interface as the Wave 2 session
// (server/studio/grade.js createGradeSession), so server/studio/seam.js hostAnswer runs one path for every piece:
//   grade(value, hint) → { correct, itemId, complete, triesBefore, closedItem, alreadyClosed?, capped?, ungraded? }
// The verdict is ALWAYS the engine registry's grader over the spec the server revealed (shared/studio-spec*.ts gradeAny:
// pure, from the raw act). The frame's own verdict, `correct` or any claim inside the value is never an input
// (rj-ot-frame-claim-as-grade). Items are the spec's keyed items where the registry lists them (extension engines' keys());
// a base RS-4 engine reports item ids with each act, and the session learns them as they arrive.
import { gradeAny, ENGINE_SPECS_EXT } from "../../shared/studio-spec-ext/index.ts";

const MAX_ANSWER_BYTES = 4096;
const MAX_ANSWERS_PER_ITEM = 12;
const CLAIM_KEYS = new Set(["correct", "verdict", "right", "isCorrect", "score", "pass"]);

/** The act as the device sent it, minus every claim field; `{ itemId, value, archetype }` envelopes are unwrapped. */
export function actOf(raw, hint = {}) {
  let v = raw;
  try { const s = JSON.stringify(v === undefined ? null : v); v = s && s.length <= MAX_ANSWER_BYTES ? JSON.parse(s) : null; } catch { v = null; }
  let itemId = typeof hint?.itemId === "string" ? hint.itemId.slice(0, 64) : null;
  if (v && typeof v === "object" && !Array.isArray(v) && "value" in v && ("itemId" in v || "archetype" in v)) {
    if (!itemId && typeof v.itemId === "string") itemId = v.itemId.slice(0, 64);
    v = v.value;
  }
  if (v && typeof v === "object" && !Array.isArray(v)) { const o = {}; for (const [k, x] of Object.entries(v)) if (!CLAIM_KEYS.has(k)) o[k] = x; v = o; }
  return { itemId, value: v };
}

/** Item ids the spec keys (extension engines), or null when the registry lists none. */
export function itemsOf(archetype, spec) {
  const d = ENGINE_SPECS_EXT[archetype];
  if (!d?.keys) return null;
  try { const ks = d.keys(spec); return Array.isArray(ks) && ks.length ? [...new Set(ks.map((k) => String(k.itemId)))] : null; } catch { return null; }
}

/** @param {string} archetype @param {unknown} spec the spec the server revealed (never the device's copy) */
export function createStageGradeSession(archetype, spec) {
  const listed = itemsOf(archetype, spec);
  const items = new Set(listed ?? []);
  const wrongs = new Map(), tries = new Map(), closed = new Set(), evidenced = new Set();
  let complete = false, answers = 0, lastVerdict = null, wrongsTotal = 0, mountKey = null;
  return {
    archetype,
    grade(raw, hint = {}) {
      answers++;
      const act = actOf(raw, hint);
      const itemId = act.itemId ?? (listed ? listed.find((id) => !closed.has(id)) ?? listed[0] : "q");
      if (!listed) items.add(itemId);
      let g;
      try { g = gradeAny(archetype, spec, itemId, act.value); } catch { g = { verdict: "ungraded" }; }
      const n = (tries.get(itemId) ?? 0) + 1;
      tries.set(itemId, n);
      const before = wrongs.get(itemId) ?? 0;
      if (g.verdict === "ungraded") return { correct: false, itemId, complete, triesBefore: before, closedItem: false, ungraded: true };
      const correct = g.verdict === "right";
      const wasClosed = closed.has(itemId) || evidenced.has(itemId);
      if (!correct && !closed.has(itemId)) { wrongs.set(itemId, before + 1); wrongsTotal++; }
      if (correct) closed.add(itemId);
      complete = !!listed && listed.every((id) => closed.has(id));
      lastVerdict = correct ? "right" : g.verdict === "partial" ? "partial" : "wrong";
      const capped = n > MAX_ANSWERS_PER_ITEM;
      return { correct, itemId, complete, triesBefore: before, closedItem: correct && !wasClosed && !capped, ...(wasClosed ? { alreadyClosed: true } : {}), ...(capped ? { capped: true } : {}) };
    },
    noteEvidence(itemId) { evidenced.add(itemId); },
    mount(key) {
      if (typeof key !== "string" || !key || key === mountKey) return false;
      const first = mountKey === null;
      mountKey = key;
      if (!first) { closed.clear(); complete = false; }
      return !first;
    },
    reset() { wrongs.clear(); tries.clear(); closed.clear(); complete = false; lastVerdict = null; wrongsTotal = 0; },
    openWrong() { return [...wrongs].filter(([id, k]) => k > 0 && !closed.has(id) && !evidenced.has(id)).map(([id, k]) => ({ itemId: id, wrongs: k })); },
    get items() { return [...items]; },
    get complete() { return complete; },
    get answers() { return answers; },
    get lastVerdict() { return lastVerdict; },
    get wrongCount() { return wrongsTotal; },
  };
}
