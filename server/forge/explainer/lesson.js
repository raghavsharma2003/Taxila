// The explain rung for a lesson (W2-B #2/#3), readable SYNCHRONOUSLY by the Director (server/director/modules.js):
//
//   explainerFor({ lessonId, kit, item, band }) → { command params, facts, by } | null, in this order:
//     1. maths: the CODE pick from the text her content comes from (the posed item, else the worked example) —
//        the board's numbers ARE that text's numbers (live-content audit 6);
//     2. the topic's LIBRARY entry (library.json: model-filled offline by evals/forge-explainer.mjs --build, truth-checked
//        against the kit and render-checked; re-checked at load);
//     3. this lesson's live MODEL fill, when the prefetch (lesson start) or the move before explain (the hook) produced one;
//     4. null: the ladder steps down (the board, her voice).
//   wantExplainer(ctx) → fire the model fill in the background (only for a topic with no library entry and no code pick).
//
// Like lesson-fills.js: imports nothing heavy at load (the model call is a registered warmer), so Director tests stay pure;
// process memory only.
import { readFileSync, existsSync } from "node:fs";
import { expand } from "./templates.js";
import { codePick } from "./pick.js";
import { checkCall, kitVocabulary } from "./truth.js";

const TTL_MS = 3 * 3600_000;
const MAX_LESSONS = 2000;
const lessons = new Map();       // lessonId → { at, call: object | null, inflight: boolean, tried: boolean }
let warmer = null;               // (ctx) => Promise<{ ok, call }>
export const setExplainerWarmer = (fn) => { warmer = typeof fn === "function" ? fn : null; };
export const _explainersClear = () => lessons.clear();

// ───────────────────────────── the library ─────────────────────────────
const LIB_URL = new URL("./library.json", import.meta.url);
let library = null;
/** topicId → template call (re-checked against the CURRENT kit when used: a kit edit retires a stale entry). */
export function libraryCalls() {
  if (library) return library;
  library = new Map();
  try {
    if (existsSync(LIB_URL)) {
      const j = JSON.parse(readFileSync(LIB_URL, "utf8"));
      for (const [topicId, e] of Object.entries(j.topics ?? {})) if (e?.call?.template) library.set(topicId, e.call);
    }
  } catch (e) { console.warn("[forge] explainer library unreadable:", String(e?.message ?? e).slice(0, 120)); }
  return library;
}
export const _setLibrary = (m) => { library = m; checked.clear(); };
/** Library entries that passed the kit re-check, per (topic, kit hash). */
const checked = new Map();
function libraryCall(kit, band) {
  const call = libraryCalls().get(kit?.topicId);
  if (!call) return null;
  const key = `${kit.topicId}:${kit.hash ?? ""}:${band}`;
  if (!checked.has(key)) checked.set(key, checkCall(call, kit, { band, vocab: kitVocabulary(kit) }).ok);
  return checked.get(key) ? call : null;
}

const callHash = (call) => [...JSON.stringify(call)].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261).toString(36);

function entry(lessonId, create) {
  if (!lessonId) return null;
  let e = lessons.get(lessonId);
  if (e && Date.now() - e.at > TTL_MS) { lessons.delete(lessonId); e = undefined; }
  if (!e && create) {
    e = { at: Date.now(), call: null, inflight: false, tried: false };
    lessons.set(lessonId, e);
    if (lessons.size > MAX_LESSONS) lessons.delete(lessons.keys().next().value);
  }
  return e ?? null;
}

/**
 * The explain rung for this move, or null.
 * @param {{ lessonId?: string, kit: any, item?: any, text?: string, band?: string }} a
 * @returns {{ params: { script: any, template: string, mode: "play" }, facts: any, by: "code" | "library" | "model", template: string } | null}
 */
export function explainerFor({ lessonId, kit, item = null, text, band = "B3" }) {
  const tries = [];
  const code = codePick({ kit, item, text });
  if (code) tries.push([code, "code"]);
  const lib = libraryCall(kit, band);
  if (lib) tries.push([lib, "library"]);
  const live = entry(lessonId, false)?.call;
  if (live) tries.push([live, "model"]);
  for (const [call, by] of tries) {
    // the script id is the call's identity: the same call on the next show move is the same board (no redraw)
    const x = expand(call, { band, lessonId: lessonId ?? "", scriptId: `ex-${callHash(call)}` });
    if (x.ok) return { params: { script: x.script, template: call.template, mode: "play" }, facts: x.facts, by, template: call.template };
  }
  return null;
}

/** True when this topic has a rung without a model call (a code pick or a library entry). */
export function hasStaticExplainer({ kit, item = null, band = "B3" }) {
  return !!codePick({ kit, item }) || !!libraryCall(kit, band);
}

/**
 * Ask for a live model fill for this lesson's topic, in the background (never awaited, never throws, once per lesson).
 * A no-op without a warmer, or when the topic already has a static rung.
 * @param {{ lessonId: string, kit: any, band?: string, topicTitle?: string }} ctx
 */
export function wantExplainer(ctx) {
  if (!warmer || !ctx?.lessonId || !ctx.kit) return;
  if (hasStaticExplainer({ kit: ctx.kit, band: ctx.band })) return;
  const e = entry(ctx.lessonId, true);
  if (!e || e.call || e.inflight || e.tried) return;
  e.inflight = true;
  Promise.resolve()
    .then(() => warmer(ctx))
    .then((r) => { if (r?.ok && r.call) e.call = r.call; })
    .catch((err) => console.warn("[forge] explainer fill failed:", String(err?.message ?? err).slice(0, 120)))
    .finally(() => { e.inflight = false; e.tried = true; });
}

/** Tests: wait for a lesson's in-flight fill. */
export async function _settleExplainer(lessonId, maxMs = 5000) {
  const t0 = Date.now();
  while (entry(lessonId, false)?.inflight && Date.now() - t0 < maxMs) await new Promise((r) => setTimeout(r, 10));
}
