// Board-first (round 2, stream content): the board is chosen BEFORE her line is written, and her line is written from it.
//
// Why (measured on production, web ee97e9c, Log Analytics taxila-env, 2026-10-06 15:10-19:08 UTC, n = 189 whiteboard asks):
// the board was planned AFTER her guarded line existed (seam.requestIntent), so it chased whatever she said. 31/189 asks
// (16.4%) drew nothing: her free line named values no kit-true board could show (owner-5 "show me a diagram" 2/2 failed:
// "3 equal groups, each with 5 dots" in a fractional-units lesson → W8.counts_match_line, W6.timing at the 7 s budget), and
// the 158 drawn boards reached the child ask → board p50 1900 ms / p90 3211 ms (the code rung always waited for the full
// 1.9 s sync deadline), against a lateness bar that needs ≤ ~2.2 s.
//
// The reversal (what a human teacher does, and what authored whiteboard video does: the drawing is decided, then narrated):
//   1. at kernel time (her line does not exist yet), pick the kit's own code / library / catalogue board for the move, gated
//      with the FULL gate against the predicted line (the kit text her line is written from), only W6.timing deferred (it
//      depends on her line's spoken length alone). ~16 ms, pure, no model call. (Deferring W5 and W8 as well covered 96.8%
//      of asks offline but was rejected live: maths explain boards that did not match the kit line were preselected, then
//      refused against her real line 6/6 times; local server, 2026-10-06.)
//   2. its facts go into the move's content as ONE telegraphic row ("on screen now … board · …"): values, never a sentence,
//      so her line is written about what IS drawn (AT-7 "she names only on-screen values" by construction).
//   3. when her line exists, the board is re-timed to it and re-gated with the FULL gate W0-W9 against her REAL line; a pass
//      is shown at once (no deadline wait). A fail falls through to the existing ladder (spec, line plan, code, template)
//      exactly as before, so this can only add boards, never remove one.
// Kill switch TAXILA_BOARD_FIRST=0: nothing is preselected and nothing changes.
import { gateCtxFor, regate, retime, withSectors, predictedLineOf } from "./board-sync.js";
import { speechMsOf, WB_BOARD } from "../studio/plan.js";
import { explainerFor } from "../forge/explainer/lesson.js";
import { catalogueEntry } from "./catalogue.js";
import { fitLegible } from "./board-legible.js";
import { scriptFacts } from "../../shared/whiteboard.js";

/** = server/studio/seam.js STUDIO_ROW_PREFIX (not imported: seam.js imports this file; tests/round2-content.test.mjs pins equality). */
export const STUDIO_ROW_PREFIX = "on screen now (values to use when you point at the screen; never what is hidden): ";

export const boardFirstOn = (env = process.env) => env.TAXILA_BOARD_FIRST !== "0";
/** Checks deferred to the re-gate against her real line (spoken length only). Everything else must pass now. */
export const LINE_BOUND = new Set(["W6.timing"]);
/** The row head: distinct from every Studio archetype so isStudioRow never confuses it with a piece. */
export const ROW_HEAD = "board";
const TTL_MS = 60_000;
const picks = new Map(); // intentId → { at, script, facts, by, template, row, predicted }

/** A content line is this module's row (the turn strips last turn's before adding this turn's). */
export function isBoardFirstRow(line) {
  return typeof line === "string" && line.startsWith(`${STUDIO_ROW_PREFIX}${ROW_HEAD}`) && (line.length === STUDIO_ROW_PREFIX.length + ROW_HEAD.length || line.startsWith(`${STUDIO_ROW_PREFIX}${ROW_HEAD} · `));
}

/**
 * The drawn counts W8 checks her line against (the same families as server/studio/qa/whiteboard.js shapeFamilies: sectors
 * of one circle, boxes of one size, dots of one radius, each ≥ 2), as row values: "equal parts 4 · dots 15". Without them
 * her line named its own counts and W8 refused the board (8/8 c6-maths explain refusals, local server, 2026-10-06).
 */
export function countsOf(script) {
  const fam = new Map();
  for (const o of script?.ops ?? []) {
    const k = o.op === "sector" && Array.isArray(o.c) ? `equal parts@${Math.round(o.c[0] / 4)},${Math.round(o.c[1] / 4)},${Math.round(o.r / 4)}`
      : o.op === "rect" ? `equal boxes@${Math.round(o.w / 3)}x${Math.round(o.h / 3)}` : o.op === "circle" && o.r < 40 ? `dots@${Math.round(o.r / 3)}` : null;
    if (k) fam.set(k, (fam.get(k) ?? 0) + 1);
  }
  const out = {};
  for (const [k, n] of fam) if (n >= 2) { const name = k.split("@")[0]; out[name] = out[name] ? `${out[name]}, ${n}` : String(n); }
  return out;
}

/** StudioFacts.onScreen (+ drawn counts) → "on screen now …: board · k v · …" (whole entries only, ≤ 360 chars), or null. */
export function rowOfFacts(facts, counts = {}) {
  const on = { ...counts, ...(facts?.onScreen ?? {}) };
  let row = STUDIO_ROW_PREFIX + ROW_HEAD;
  let n = 0;
  for (const [k, v] of Object.entries(on)) {
    if (v == null || v === "" || typeof v === "object") continue;
    const part = `${String(k).replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase()} ${String(v).slice(0, 80)}`;
    if (row.length + part.length + 3 > 360) break;
    row += ` · ${part}`; n++;
  }
  return n ? row : null;
}

/** Candidate boards for this ask, in the code rung's own order: the explain rung (from the predicted line, then bare), then the topic's catalogue boards. */
function candidates(ask, kit, lessonId, band, predicted) {
  const out = [];
  const item = ask?.kit?.item?.id ? (kit?.items ?? []).find((i) => i.id === ask.kit.item.id) ?? null : null;
  for (const t of [{ text: predicted }, {}]) {
    try {
      const x = explainerFor({ lessonId, kit, item, openItem: item, band, ...t });
      if (x?.params?.script) out.push({ script: fitLegible(x.params.script), by: x.by ?? "code", template: x.template ?? null });
    } catch { /* a floor, never a failure */ }
  }
  for (const b of catalogueEntry(kit?.topicId ?? ask?.kit?.topicId)?.boards ?? []) out.push({ script: fitLegible(b.script), by: "catalogue", template: `catalogue:${b.line}` });
  return out;
}

/**
 * Pick the board for an accepted whiteboard ask before her line exists. Pure apart from the in-memory pick table; never
 * throws. → { row, facts, by } (the row goes into the move's content), or null (nothing changes: the old ladder runs).
 * @param {any} ask whiteboardIntentOf(...) with an empty line
 * @param {{ kit?: any, redact?: string[], now?: number }} o
 */
export function preselect(ask, { kit, redact = [], now = Date.now() } = {}) {
  try {
    if (!boardFirstOn() || !kit) return null;
    const id = String(ask?.intent?.intentId ?? "");
    if (!id) return null;
    if (ask?.mode === "continue") return null;              // a continued board builds on the last one: the line plan's job
    for (const [k, v] of picks) if (now - v.at > TTL_MS) picks.delete(k);
    if (picks.has(id)) return picks.get(id);
    const predicted = predictedLineOf(ask, kit);
    if (predicted.length < 12) return null;
    const a2 = { ...ask, line: { ...(ask.line ?? {}), text: predicted } };
    // W9 (no answer reveal) as if her line said NO number: the withheld set can only shrink once her real line exists
    // (withheldValues frees the values a line says), so a board that passes here cannot fail W9 later (measured live
    // 2026-10-06: 19/27 refusals were W9 when the predicted line's numbers freed a key her real line never said)
    const ctx = { ...gateCtxFor(a2, { kit, redact }), withhold: gateCtxFor({ ...ask, line: { ...(ask.line ?? {}), text: "" } }, { kit, redact }).withhold };
    const band = ctx.band ?? "B3";
    for (const c of candidates(a2, kit, ask?.line?.lessonId ?? ask?.intent?.lessonId, band, predicted)) {
      const s = withSectors(retime(c.script, Math.max(800, Number(c.script.durationMs) || 0), ctx.speechMs), ctx.reply);
      const r = regate({ ...s, board: { ...WB_BOARD, ...(s.board ?? {}) } }, a2, ctx);
      const failing = r.ok ? [] : (r.gate?.checks ?? []).filter((x) => !x.pass).map((x) => x.id);
      if (!r.ok && (!r.gate?.script || failing.some((f) => !LINE_BOUND.has(f)))) continue;
      const facts = r.ok ? r.script.facts : scriptFacts(r.gate.script, { kind: "diagram", archetype: "whiteboard" });
      const row = rowOfFacts(facts, countsOf(s));
      if (!row) continue;
      const pick = { at: now, script: s, facts, by: c.by, template: c.template, row, predicted, strict: r.ok };
      picks.set(id, pick);
      return pick;
    }
    return null;
  } catch { return null; }
}

/**
 * The preselected board for this ask, re-timed to her REAL line and re-gated with the full gate W0-W9 against it. → the
 * board-sync result shape ({ ok, script, gate, source: "first", syncMs }) or null (the ladder runs). Consumes the pick.
 */
export function takePreselected(ask, ctx, t0 = Date.now()) {
  try {
    const id = String(ask?.intent?.intentId ?? "");
    const p = picks.get(id);
    if (!p || p.used) return null;
    p.used = true;
    const s = withSectors(retime(p.script, Math.max(800, Number(p.script.durationMs) || speechMsOf(p.predicted)), ctx.speechMs), ctx.reply);
    const r = regate({ ...s, board: { ...WB_BOARD, ...(s.board ?? {}) } }, ask, ctx);
    if (!r.ok) { p.rejected = (r.gate?.checks ?? []).filter((x) => !x.pass).map((x) => x.id); return null; }
    return { ok: true, script: r.script, gate: r.gate, usd: 0, ms: Date.now() - t0, source: "first", by: p.by, template: p.template, syncMs: Date.now() - t0 };
  } catch { return null; }
}

/** Why the preselected board was not shown (telemetry codes): none | rejected:<check ids> | used. */
export function pickState(ask) {
  const p = picks.get(String(ask?.intent?.intentId ?? ""));
  if (!p) return "none";
  if (p.rejected) return `rejected:${p.rejected.join(",")}`;
  return p.used ? "used" : "pending";
}
export const _picks = picks;
