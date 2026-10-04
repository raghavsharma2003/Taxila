// The LLM annotator (HUMAN-VOICE §5.13, B7): delivery for lines where latency is FREE (kit narration, openings, Forge
// narration, read-aloud passages), cached forever per (text, row, language). Never on the live path: a serial LLM step
// costs ≥ 0.9 s (hv-live-planner-is-code), so the live turn uses momentPlan and only a cache HIT reaches render.js.
//
// The model never writes words (the full-text planner rewrote them: grok dropped words in 2/10, hv-full-text-planner).
// It sees numbered clauses and returns, per clause index, an emotion, a pace and a pause from closed enums under a
// strict json_schema (the 0/10 index-format failure of §4.5 is fixed by enum names, not indices). Code then validates:
// the count must match, every value is clamped to the moment row's bands, and the content law (HV-2) is asserted by
// construction (the clause texts are ours). Invalid → null (the moment plan is used). Background quota lane only.
import { createHash } from "node:crypto";
import { chat, DEPLOY } from "../../azure.js";
import { q, one } from "../../db.js";
import { align } from "./align.js";
import { momentPlan } from "./moment.js";

export const ANNOTATOR_VERSION = "an1";
const EMOTIONS = ["neutral", "warm", "amused", "delighted", "curious", "wonder", "thinking", "calm", "reassuring", "playful", "proud"];
const PACES = ["slow", "normal", "brisk"];
const PAUSES = [0, 150, 250, 350, 450, 600];
const SCHEMA = {
  type: "object", additionalProperties: false, required: ["clauses"],
  properties: { clauses: { type: "array", items: { type: "object", additionalProperties: false, required: ["i", "emotion", "pace", "pause_before"],
    properties: { i: { type: "integer" }, emotion: { type: "string", enum: EMOTIONS }, pace: { type: "string", enum: PACES },
      pause_before: { type: "string", enum: PAUSES.map(String) } } } } },
};
// Bands and shapes only (recitation law: nothing here is a line the teacher could say).
const SYSTEM = [
  "You annotate delivery for a children's teacher voice. You never write or change words.",
  "Input: numbered clauses of one teacher line and the moment (row, band, language).",
  "Output: for EVERY clause index, an emotion, a pace and a pause before it (ms), from the enums only.",
  "Keep delivery steady for older bands; vary pauses before a new idea or a question; clause 0 pause is 0.",
  "Never pick an emotion that contradicts the row (a correction row is calm, reassuring or curious).",
].join("\n");

const mem = new Map();
const MEM_MAX = 2000;
const keyOf = (text, row, lang) => `expr:${ANNOTATOR_VERSION}:${createHash("sha256").update([text.trim(), row, lang].join("\u0000")).digest("hex").slice(0, 32)}`;

/** Swappable for tests (no database). */
export let annotationStore = {
  get: async (key) => (await one("select body from asset_cache where key = $1", [key]))?.body?.ann ?? null,
  put: (key, ann) => q("insert into asset_cache(key, kind, body) values ($1, 'tts', $2) on conflict (key) do nothing", [key, { ann }]),
};
export const setAnnotationStore = (s) => { annotationStore = s; mem.clear(); };

/**
 * Validate a model answer against the clause count and the row's bands → per-clause delivery, or null.
 * @param {any} json @param {number} n clause count @param {ReturnType<typeof momentPlan>} mp
 */
export function validateAnnotation(json, n, mp) {
  const rows = Array.isArray(json?.clauses) ? json.clauses : null;
  if (!rows || rows.length !== n) return null;
  const byI = new Map(rows.map((r) => [r.i, r]));
  if (byI.size !== n) return null;
  const allowed = new Set([...mp.arc, "neutral", "warm", "calm"]);
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = byI.get(i);
    if (!r || !EMOTIONS.includes(r.emotion) || !PACES.includes(r.pace) || !PAUSES.map(String).includes(String(r.pause_before))) return null;
    const lo = Math.min(mp.sentencePause[0], mp.commaPause[0]), hi = Math.max(mp.sentencePause[1], mp.lastPause?.[1] ?? 0) * 1.25;
    out.push({ emotion: mp.register === "safety" ? "calm" : allowed.has(r.emotion) ? r.emotion : mp.arc[Math.min(i, 2)],
      pace: mp.register === "safety" ? "slow" : r.pace, pauseBeforeMs: i === 0 ? 0 : Math.round(Math.max(lo, Math.min(hi, Number(r.pause_before)))) });
  }
  return out;
}

/**
 * Ask the model (background lane) and cache the result. → per-clause delivery or null. Never on a live turn.
 * @param {string} text @param {import("../../../shared/brain").Moment} moment
 * @param {{ deployment?: string, effort?: string }} [o]
 */
export async function annotate(text, moment, { deployment = DEPLOY.fast, effort = "low" } = {}) {
  const plan = align(text, moment);
  if (!plan) return null;
  const mp = momentPlan(moment);
  const key = keyOf(text, mp.row, mp.lang);
  const hit = mem.get(key) ?? (await annotationStore.get(key).catch(() => null));
  if (hit) { mem.set(key, hit); return hit; }
  if (mp.register === "safety") return null; // safety lines take the fixed register, never a model's choices
  const user = `moment: row=${mp.row} band=${moment?.band ?? "B3"} language=${mp.lang}\nclauses:\n${plan.clauses.map((c, i) => `${i}. ${c.filler ? c.text.slice(c.filler.length + 2) : c.text}`).join("\n")}`;
  const r = await chat(deployment, [{ role: "system", content: SYSTEM }, { role: "user", content: user }], { schema: SCHEMA, schemaName: "delivery", effort, maxTokens: 900, quotaLane: "background" });
  const ann = validateAnnotation(r.json, plan.clauses.length, mp);
  if (!ann) return null;
  mem.set(key, ann);
  while (mem.size > MEM_MAX) mem.delete(mem.keys().next().value);
  void Promise.resolve().then(() => annotationStore.put(key, ann)).catch((e) => console.warn("[voice] annotation cache write failed:", e.message));
  return ann;
}

/** A cached annotation for (text, moment) from MEMORY only (the live path must not wait), else null. */
export function cachedAnnotation(text, moment) {
  const mp = momentPlan(moment);
  return mem.get(keyOf(String(text), mp.row, mp.lang)) ?? null;
}

/**
 * Overlay a cached annotation on a moment plan (fillers, licences, register and the prelude stay the moment's). Returns a
 * new plan with source "annotator", or the input plan when the counts differ.
 */
export function withAnnotation(plan, ann) {
  if (!plan || !ann || ann.length !== plan.clauses.length) return plan;
  return { ...plan, source: "annotator", clauses: plan.clauses.map((c, i) => ({ ...c, emotion: ann[i].emotion, pace: ann[i].pace, pauseBeforeMs: ann[i].pauseBeforeMs })) };
}
