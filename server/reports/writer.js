// Lane B (PARENT-REPORT.md §10.2): a constrained writer that ORDERS Lane A segments for the spoken script and picks
// approved connective ids. It never writes text a parent reads: its output is a list of ids, validated in code, and
// the script is assembled from our own strings. Model: taxila-brain, fallback taxila-fast (MODEL-ROUTER "Parent
// reports"). The prompt carries shapes and constraints, never example sentences (the recitation law). Two failures →
// Lane A default order, and the report still ships (the family always gets a correct report).
import { DEPLOY, chat } from "../azure.js";
import { PRICE_MICRO_USD, VOICE_CHARS, VOICE_WORDS, WRITER } from "./config.js";
import { CONNECTIVES } from "./templates.js";
import { wordCount } from "./gate.js";

const SYSTEM = [
  "Role: you arrange the parts of a short spoken note for a parent. Each part is a fixed text with an id. You never write, change or translate text.",
  "Output: JSON {order: [{kind, id}]}. kind is segment or connective. A connective id may sit before a segment.",
  "Hard constraints:",
  "1. The segment with role frame_open is first; the segment with role frame_close is last.",
  "2. Every segment with mustKeep true appears. Other segments may be left out only to stay within budgetWords.",
  "3. Each segment at most once. Never two connectives in a row. No connective first or last.",
  "4. A segment with role home, when present, is placed directly before frame_close.",
  "5. Segments with role strength or row come before a segment with role tricky.",
  "6. Total words of the chosen segments plus connectives must not exceed budgetWords, and total characters must not exceed budgetChars.",
  "7. Use only ids that appear in the input.",
].join("\n");

const SCHEMA = {
  type: "object", additionalProperties: false, required: ["order"],
  properties: { order: { type: "array", items: { type: "object", additionalProperties: false, required: ["kind", "id"],
    properties: { kind: { type: "string", enum: ["segment", "connective"] }, id: { type: "string" } } } } },
};

const ROLE = (l) => (l.key === "disclosure" ? "frame_open" : l.key === "close" ? "frame_close" : l.section);

/** Code validation of a writer order. → null when valid, else the first reason. */
export function validateOrder(order, lines, lang, cadence) {
  if (!Array.isArray(order) || !order.length) return "empty";
  const byKey = new Map(lines.filter((l) => !l.appOnly).map((l) => [l.key, l]));
  const segs = [];
  let prevConn = true, words = 0;
  for (const o of order) {
    if (o?.kind === "connective") {
      if (prevConn) return "connective_position";
      const t = CONNECTIVES[o.id]?.[lang];
      if (!t) return `unknown_connective:${o.id}`;
      words += wordCount(t); prevConn = true;
    } else if (o?.kind === "segment") {
      const l = byKey.get(o.id);
      if (!l) return `unknown_segment:${o.id}`;
      segs.push(l); words += wordCount(l.text); prevConn = false;
    } else return "bad_kind";
  }
  if (prevConn) return "connective_position";
  const ids = segs.map((l) => l.key);
  if (new Set(ids).size !== ids.length) return "duplicate";
  if (ids[0] !== "disclosure" || ids.at(-1) !== "close") return "frame";
  for (const l of byKey.values()) if (l.mustKeep && !ids.includes(l.key)) return `must_keep:${l.key}`;
  const home = ids.findIndex((k) => byKey.get(k).section === "home");
  if (home >= 0 && home !== ids.length - 2) return "home_position";
  const tr = ids.findIndex((k) => byKey.get(k).section === "tricky");
  if (tr >= 0 && ids.some((k, i) => i > tr && ["strength", "row"].includes(byKey.get(k).section))) return "tricky_position";
  if (words > VOICE_WORDS[cadence]) return `budget:${words}`;
  if (assemble(order, lines, lang).length > VOICE_CHARS) return "budget:chars";
  return null;
}

/**
 * Lane A spoken order: display order; over the word budget, drop in the declared order (PARENT-REPORT §9.1: the
 * second can-do row, then the first, then the interest line, then the tricky detail). The home activity, the header
 * and the strength are never dropped. Still over → the gate throws (never a cut sentence).
 * @returns {{ order: any[], dropped: string[] }}
 */
export function laneAOrder(lines, lang, cadence) {
  let keep = lines.filter((l) => !l.appOnly);
  const dropped = [];
  const words = () => keep.reduce((a, l) => a + wordCount(l.text), 0);
  const over = () => words() > VOICE_WORDS[cadence] || keep.map((l) => l.text).join(" ").length > VOICE_CHARS;
  const DROP = [() => keep.filter((l) => l.section === "row").at(-1), () => keep.filter((l) => l.section === "row").at(-1),
    () => keep.find((l) => l.section === "interest"), () => keep.find((l) => l.section === "tricky")];
  for (const pick of DROP) {
    if (!over()) break;
    const l = pick();
    if (l) { keep = keep.filter((x) => x !== l); dropped.push(l.key); }
  }
  return { order: keep.map((l) => ({ kind: "segment", id: l.key })), dropped };
}

/** Assemble the script text from an order (our strings only). */
export function assemble(order, lines, lang) {
  const byKey = new Map(lines.map((l) => [l.key, l]));
  return order.map((o) => (o.kind === "connective" ? CONNECTIVES[o.id][lang] : byKey.get(o.id).text)).join(" ");
}

const costOf = (deployment, usage) => {
  const p = PRICE_MICRO_USD[deployment];
  if (!p || !usage) return 0;
  return Math.ceil((usage.prompt_tokens ?? 0) * p.in + (usage.completion_tokens ?? 0) * p.out);
};
/** Worst-case cost of one call (input estimated at 3 chars/token, all of maxTokens out): the budget check runs BEFORE the call. */
const worstCase = (deployment, chars) => {
  const p = PRICE_MICRO_USD[deployment] ?? { in: 4, out: 20 };
  return Math.ceil((chars / 3) * p.in + WRITER.maxTokens * p.out);
};

/**
 * @param {{ lines: any[], lang: string, cadence: string }} input
 * @param {{ llm?: { chat: Function }, deployments?: string[], budgetMicroUsd?: number, beforeCall?: () => Promise<void>, onSpend?: (microUsd: number) => Promise<void> }} [o]
 * @returns {Promise<{ order: any[], lane: 'B'|'A', model: string|null, attempts: any[], spentMicroUsd: number, reason?: string }>}
 */
export async function orderForVoice({ lines, lang, cadence }, { llm = { chat }, deployments = [DEPLOY.brain, DEPLOY.fast], budgetMicroUsd = Infinity, beforeCall, onSpend } = {}) {
  const segments = lines.filter((l) => !l.appOnly).map((l) => ({ id: l.key, role: ROLE(l), mustKeep: !!l.mustKeep, words: wordCount(l.text), text: l.text }));
  const user = JSON.stringify({ budgetWords: VOICE_WORDS[cadence], budgetChars: VOICE_CHARS, segments, connectives: Object.entries(CONNECTIVES).map(([id, t]) => ({ id, text: t[lang] })) });
  const attempts = [];
  let spent = 0;
  for (const dep of deployments.slice(0, 2)) {
    const est = worstCase(dep, SYSTEM.length + user.length);
    if (spent + est > budgetMicroUsd) { attempts.push({ model: dep, skipped: "budget", est }); continue; }
    if (beforeCall) await beforeCall();
    const t0 = performance.now();
    try {
      const out = await llm.chat(dep, [{ role: "system", content: SYSTEM }, { role: "user", content: user }],
        { schema: SCHEMA, schemaName: "voice_order", effort: WRITER.effort, maxTokens: WRITER.maxTokens, timeoutMs: WRITER.timeoutMs, retries: 0 });
      const c = costOf(dep, out.usage);
      spent += c;
      if (onSpend && c) await onSpend(c);
      const bad = validateOrder(out.json?.order, lines, lang, cadence);
      attempts.push({ model: dep, ms: Math.round(performance.now() - t0), costMicroUsd: c, usage: out.usage ?? null, invalid: bad });
      if (!bad) return { order: out.json.order, lane: "B", model: dep, attempts, spentMicroUsd: spent };
    } catch (e) {
      attempts.push({ model: dep, ms: Math.round(performance.now() - t0), error: String(e?.code || e?.message || e).slice(0, 120) });
      if (e?.code === "cancelled") throw e;
    }
  }
  const a = laneAOrder(lines, lang, cadence);
  return { order: a.order, dropped: a.dropped, lane: "A", model: null, attempts, spentMicroUsd: spent,
    reason: attempts.map((a) => a.skipped || a.invalid || a.error).filter(Boolean).join(",") || "no_model" };
}
