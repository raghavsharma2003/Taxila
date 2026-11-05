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
import { answersRequest, samePage, shownBefore } from "../studio/request.js";
import { gateCtxFor, regate, retime, withSectors, withSplit, predictedLineOf, anchorSteps } from "./board-sync.js";
import { speechMsOf, WB_BOARD } from "../studio/plan.js";
import { explainerFor } from "../forge/explainer/lesson.js";
import { catalogueEntry } from "./catalogue.js";
import { fitLegible } from "./board-legible.js";
import { scriptFacts, isMotionOp } from "../../shared/whiteboard.js";
import { preferPicture } from "./beat-card.js";
import { resolveBoardRef } from "../forge/explainer/board-ref.js";
import { expand } from "../forge/explainer/templates.js";

/** = server/studio/seam.js STUDIO_ROW_PREFIX (not imported: seam.js imports this file; tests/round2-content.test.mjs pins equality). */
export const STUDIO_ROW_PREFIX = "on screen now (values to use when you point at the screen; never what is hidden): ";

export const boardFirstOn = (env = process.env) => env.TAXILA_BOARD_FIRST !== "0";
/** Checks deferred to the re-gate against her real line (spoken length only). Everything else must pass now. */
export const LINE_BOUND = new Set(["W6.timing"]);
/** The row head: distinct from every Studio archetype so isStudioRow never confuses it with a piece. */
export const ROW_HEAD = "board";
const TTL_MS = 60_000;
const picks = new Map(); // intentId → { at, script, facts, by, template, row, predicted, ahead? }

/**
 * round 7 (C1 studio-board-timing): what an ask is FOR, as one string: a board picked ahead for one ask is used only for an
 * ask with the same signature (the Director's next turn can take another move than the one its lookahead predicted).
 */
export function askSignature(ask) {
  const i = ask?.intent ?? {};
  const r = i.request ?? null;
  return JSON.stringify([i.skillId ?? null, i.need ?? null, i.misconceptionId ?? null, [...(i.itemIds ?? [])].sort(), ask?.kit?.item?.id ?? null,
    r ? [r.kind ?? null, r.subject ?? null] : null, ask?.mode ?? "fresh", i.beat ?? null]);
}
const prewarmed = { made: 0, hit: 0, used: 0, stale: 0 };   // made ahead · served to the real turn's pick · shown · dropped (another move)
/** Board-first lookahead counters for this replica (GET /api/studio/timing). */
export const prewarmStats = () => ({ ...prewarmed });
// round 7 (main, director4: Brain's R4 screen contract): what the board shows, for her line to be checked against: the shape
// kind, and the numbers and labels actually drawn (masked "?" values are not shown, so not listed)
const SHAPE_OF = { "fraction-line@1": "number line", "number-line-hop@1": "number line", "number-line-zoom@1": "number line", "fraction-parts@1": "whole in parts",
  "fraction-of@1": "area model", "equal-groups@1": "groups", "compare@1": "comparison", "flow@1": "flow", "cycle@1": "cycle", "bar-chart@1": "bar chart", "table@1": "table",
  "timeline@1": "timeline", "places@1": "map", "label@1": "labelled diagram", "column-op@1": "column sum", "place-value@1": "place value", "area-grid@1": "grid", "shade-grid@1": "grid", "angle@1": "angle", "symmetry@1": "symmetry", "parts@1": "labelled diagram", "combine-count@1": "groups" };
/** round 7 (Brain R4): the CLOSED set of shape words a screen may name (R4 matches them against her Hinglish/English). */
export const SCREEN_SHAPES = Object.freeze(["rectangle", "square", "triangle", "quadrilateral", "pentagon", "hexagon", "octagon", "polygon", "circle",
  "number line", "whole in parts", "area model", "groups", "comparison", "flow", "cycle", "bar chart", "table", "timeline", "map", "labelled diagram",
  "column sum", "place value", "grid", "angle", "symmetry", "drawing"]);
function shapeWord(raw, template) {
  const w = String(raw ?? "").toLowerCase().trim();
  if (w === "rect") return "rectangle";
  if (/^\d+-sided shape$/.test(w)) return "polygon";
  if (SCREEN_SHAPES.includes(w)) return w;
  return SHAPE_OF[template] ?? "drawing";
}
/** A script board's authored line runs 3-6x the board's own drawing (c6: 33 s over 5.8 s): stretched up to this much to keep it in step (W6). */
const SCRIPT_STRETCH = 6;
/** → { template, shape (one of SCREEN_SHAPES), numbers: string[], labels: string[], counts? (shared/whiteboard.js cleanCounts) } */
export function screenOf(c, facts, script = null) {
  const on = facts?.onScreen ?? {};
  const own = c?.facts?.onScreen ?? {};
  const shape = shapeWord(own.shape ?? on.shape, c?.template);
  const split = (v) => String(v ?? "").split(/\s*\|\s*|\s+(?=\d)/).map((x) => x.trim()).filter((x) => x && !/\?/.test(x));
  // (and every number the board itself writes: a template whose facts row names none still shows its numbers)
  const drawn = (script?.ops ?? []).flatMap((o) => (o.op === "text" || o.op === "label" ? (/\?/.test(String(o.text ?? "")) ? [] : String(o.text ?? "").match(/\d+(?:\.\d+)?(?:\/\d+)?/g) ?? [])
    : o.op === "numwork" ? (o.layout === "fraction" ? [(o.rows ?? []).flat().map(String).join("/")] : (o.rows ?? []).flat().map(String)).filter((x) => /^\d+(?:\.\d+)?(?:\/\d+)?$/.test(x)) : []));
  // round 7 (director5 SC1): what the template drew, counted (gaps, ticks, marks with labels, parts, sides with values)
  const counts = script?.facts?.counts ?? facts?.counts ?? c?.facts?.counts ?? null;
  return { template: c?.template ?? null, shape, numbers: [...new Set([...split(on.numbers).filter((x) => /\d/.test(x)), ...drawn])].slice(0, 24), labels: [...new Set(split(on.labels))], ...(counts ? { counts } : {}) };
}
/**
 * round 7 (director5 SC2): a scripted REMEDIATION board goes up only on the turn its explanation is spoken (6 of c6's 10
 * contradictions: the board went up while her line said something else). Spoken = her line carries every number the
 * board writes (the axis ends 0 and 1 aside; a fraction as itself or its two counts), or, for a board of words only, two of
 * its words. Any other beat → true.
 */
export function scriptBoardSpoken(ask) {
  try {
    const ref = ask?.intent?.boardRef, kind = ask?.intent?.scriptBeat?.kind;
    if (!ref || kind !== "remediation") return true;
    const r = resolveBoardRef(ref, {});
    const x = r.ok ? expand(r.call) : null;
    if (!x?.ok) return true;          // (a ref that does not render is the ladder's to replace, not this guard's)
    const line = String(ask?.line?.text ?? "");
    const said = new Set((line.match(/\d+(?:\.\d+)?(?:\s*\/\s*\d+)?/g) ?? []).map((n) => n.replace(/\s+/g, "")));
    const nums = screenOf({ template: r.call.template }, x.facts, x.script).numbers.filter((n) => n !== "0" && n !== "1");
    // (a written fraction a/b is spoken as "a/b" or as its two counts: "4 barabar tukde … 1 tukda rangin" under 1/4)
    const spoken = (n) => said.has(n) || (/^\d+\/\d+$/.test(n) && n.split("/").every((k) => said.has(k)));
    if (nums.length) return nums.every(spoken);
    const words = new Set((line.toLowerCase().match(/\p{L}{4,}/gu) ?? []));
    const shown = [...new Set((x.script.ops ?? []).flatMap((o) => (o.op === "text" || o.op === "label" ? String(o.text ?? "").toLowerCase().match(/\p{L}{4,}/gu) ?? [] : [])))];
    return shown.length < 2 || shown.filter((w) => words.has(w)).length >= 2;
  } catch { return true; }
}
/** A script ref's own facts as a line ("shape triangle. sides 6, 5, 4 cm"), or null when it does not render. */
function scriptRefFacts(ref, kit, ask) {
  try {
    const r = resolveBoardRef(ref, { kit });
    const x = r.ok ? expand(r.call, { band: ask?.intent?.style?.band ?? "B3" }) : null;
    if (!x?.ok) return null;
    const t = Object.entries(x.facts?.onScreen ?? {}).filter(([, v]) => !/\?/.test(String(v))).map(([k, v]) => `${k} ${v}`).join(". ");
    return t.length >= 12 ? t : null;
  } catch { return null; }
}
// round 7 (dc-r7-teaching-scripts): script board refs that did not render (the turn fell back to the code's pick)
const scriptRefs = { failed: 0 };
export const scriptRefStats = () => ({ ...scriptRefs });
/** Tests only. */
export function _resetPrewarm() { prewarmed.made = prewarmed.hit = prewarmed.used = prewarmed.stale = 0; }

/**
 * round 7 (C1 studio-board-timing, "prewarm on the beat lookahead"): pick the board for an ask the lesson WILL make (Brain's
 * lookahead: the next turn's predicted whiteboard ask, its intentId already that turn's), off the turn's critical path. The
 * pick is stored under that intentId with the ask's signature; when the real ask arrives, preselect returns it at once if the
 * ask is the one predicted, and picks afresh if not. Her real line still re-gates it (takePreselected), so a wrong
 * prediction costs nothing. Code only, no model call. → the pick, or null.
 */
export function prewarm(askAhead, o = {}) {
  const id = String(askAhead?.intent?.intentId ?? "");
  if (!id || picks.has(id)) return null;
  const p = preselect(askAhead, o);
  if (!p) return null;
  p.ahead = askSignature(askAhead);
  prewarmed.made++;
  return p;
}

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
  // round 7 (dc-r7-teaching-scripts): a scripted beat NAMES its board (intent.boardRef, Brain's whiteboardIntentOf from the
  // lesson script). It is tried first and gated like any other; a ref that fails falls through to the code's own pick
  const ref = ask?.intent?.boardRef;
  if (ref) {
    try {
      const r = resolveBoardRef(ref, { kit, item, text: predicted });
      const x = r.ok ? expand(r.call, { band, lessonId }) : null;
      if (x?.ok) out.push({ script: fitLegible(x.script), by: "script", template: r.call.template, facts: x.facts });
      else scriptRefs.failed++;
    } catch { scriptRefs.failed++; }
  }
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
export function preselect(ask, { kit, redact = [], now = Date.now(), certify = null, pictureFirst = false, avoid = null, seen = null } = {}) {
  try {
    if (!boardFirstOn() || !kit) return null;
    const id = String(ask?.intent?.intentId ?? "");
    if (!id) return null;
    // a continued board builds on the last one: the line plan's job. round 7 (main, director4 S1): NOT a scripted beat's
    // board: Brain's beat id holds across e1 → e2 → e3 (one "explain" beat), so steps 2-3 came as "continue" and got no
    // board at all; a script names a NEW page for each step
    if (ask?.mode === "continue" && !ask?.intent?.boardRef) return null;
    for (const [k, v] of picks) if (now - v.at > TTL_MS) picks.delete(k);
    if (picks.has(id)) {
      const p = picks.get(id);
      if (!p.ahead) return p;
      // the board shown since it was picked ahead may be this very page: a repeat is never served (round 5, RCA-1)
      if (p.ahead === askSignature(ask) && !shownBefore(p.script, { avoid, seen })) { if (!p.hit) { p.hit = true; prewarmed.hit++; } return p; }
      picks.delete(id); prewarmed.stale++;             // picked ahead for another move: pick for this one
    }
    // round 7 (main, director4 S2): a scripted beat's board is judged against what IT shows (its facts row: her line is
    // written from the pick's row), not against a line predicted from the kit's first item (c6: a predicted "rectangle 8
    // cm, 5 cm" line refused the authored triangle 4, 5, 6 and the code's rectangle took its place)
    const refFacts = ask?.intent?.boardRef ? scriptRefFacts(ask.intent.boardRef, kit, ask) : null;
    const predicted = refFacts ?? predictedLineOf(ask, kit);
    if (predicted.length < 12) return null;
    const a2 = { ...ask, line: { ...(ask.line ?? {}), text: predicted } };
    // W9 (no answer reveal) as if her line said NO number: the withheld set can only shrink once her real line exists
    // (withheldValues frees the values a line says), so a board that passes here cannot fail W9 later (measured live
    // 2026-10-06: 19/27 refusals were W9 when the predicted line's numbers freed a key her real line never said)
    const ctx = { ...gateCtxFor(a2, { kit, redact }), withhold: gateCtxFor({ ...ask, line: { ...(ask.line ?? {}), text: "" } }, { kit, redact }).withhold };
    const band = ctx.band ?? "B3";
    // round 4 content (beat board): a skill's first board opens on a picture when one passes
    const cands = candidates(a2, kit, ask?.line?.lessonId ?? ask?.intent?.lessonId, band, predicted);
    // round 5 (stream 2, RCA-1): a ready-made board is picked only when it shows what the child asked for, and never when
    // it is the page already on the board (the owner's lesson a95d2ff1: one cached table on 7 of 10 pages, whatever was asked)
    const request = ask?.intent?.request ?? null;
    for (const c of pictureFirst ? preferPicture(cands) : cands) {
      if (!answersRequest(c.script, request)) continue;
      // round 5 merge (main; owner-5 on 14.1): the child asks to SEE it ("whiteboard pe bana ke samjhao") and the page that
      // answers it is the one on screen NOW: it is picked, her line is written from it, and the seam KEEPS it (studio/seam.js
      // requestIntent). Never for an example (the same page is the repeat), never a page from earlier in the lesson.
      const onScreenAnswer = !!request && request.kind !== "example" && !!avoid && samePage(c.script, avoid);
      // round 7 (director5 SC2): a picture asked for while a scripted card is live re-shows THAT card's board, even when it was
      // up before (the never-repeat rule skipped it, and an older board took its place)
      const reShow = !!request && c.by === "script";
      if (!onScreenAnswer && !reShow && shownBefore(c.script, { avoid, seen })) continue;
      const s0 = withSectors(retime(c.script, Math.max(800, Number(c.script.durationMs) || 0), ctx.speechMs), ctx.reply);
      // round 7 (motion ops): a whole cut into equal parts splits when the split passes the same gate (else the still board)
      const sp = withSplit(s0);
      const s = sp !== s0 && regate({ ...sp, board: { ...WB_BOARD, ...(sp.board ?? {}) } }, a2, ctx).ok ? sp : s0;
      // round 4 content: a board the child's device cannot show legibly (server/forge3/tray-gate.js) is never preselected:
      // her line is written from this board's facts row, so it must be one that will reach the stage
      if (certify && !certify({ ...s, board: { ...WB_BOARD, ...(s.board ?? {}) } })) continue;
      const r = regate({ ...s, board: { ...WB_BOARD, ...(s.board ?? {}) } }, a2, ctx);
      const failingChecks = r.ok ? [] : (r.gate?.checks ?? []).filter((x) => !x.pass);
      // (a moving board's W19.settled that only repeats a line-bound miss is line-bound too)
      const lineBound = (c) => LINE_BOUND.has(c.id) || (c.id === "W19.settled" && (c.detail ?? []).every((d) => LINE_BOUND.has(d)));
      if (!r.ok && (!r.gate?.script || failingChecks.some((c) => !lineBound(c)))) continue;
      const facts = r.ok ? r.script.facts : scriptFacts(r.gate.script, { kind: "diagram", archetype: "whiteboard" });
      const row = rowOfFacts(facts, countsOf(s));
      if (!row) continue;
      // a board that passed only once its answer was written "?" (board-sync maskReveals) is kept AS MASKED: her real line
      // is re-gated against what will be drawn
      const kept = r.ok && r.script?.ops ? { ...s, ops: r.script.ops } : r.gate?.script?.ops ? { ...s, ops: r.gate.script.ops } : s;
      // round 7 (director5): a script's board keeps its own timing (raw): her authored line is 3-5x the short facts line it
      // was fitted to here, and two capped retimes (≤ 2x each, from a compressed copy) never reached W6's spread
      const pick = { at: now, script: kept, facts, by: c.by, template: c.template, row, predicted, strict: r.ok, screen: screenOf(c, facts, kept), ...(c.by === "script" ? { raw: c.script } : {}) };
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
    if (p.ahead && p.ahead !== askSignature(ask)) { picks.delete(String(ask?.intent?.intentId ?? "")); prewarmed.stale++; return null; }
    p.used = true;
    if (p.ahead) prewarmed.used++;
    const s0 = p.raw ? withSectors(retime(p.raw, Math.max(800, Number(p.raw.durationMs) || 0), ctx.speechMs, SCRIPT_STRETCH), ctx.reply)
      : withSectors(retime(p.script, Math.max(800, Number(p.script.durationMs) || speechMsOf(p.predicted)), ctx.speechMs), ctx.reply);
    // round 7 (M3b): its named steps land on her words, when that board passes the gate (else the even pacing)
    const an = anchorSteps(s0, ctx.reply, ctx.speechMs);
    let s = s0, r = null;
    if (an.anchored) { r = regate({ ...an.script, board: { ...WB_BOARD, ...(an.script.board ?? {}) } }, ask, ctx); if (r.ok) { s = an.script; anchoredStats.used++; } else { r = null; anchoredStats.refused++; } }
    r ??= regate({ ...s, board: { ...WB_BOARD, ...(s.board ?? {}) } }, ask, ctx);
    // a split that her real line refuses: the still board (motion never costs the board)
    if (!r.ok && s.ops.some(isMotionOp)) {
      const still = { ...s, ops: s.ops.filter((o) => !isMotionOp(o)) };
      // (refused still too: the still board's reasons are recorded, W19.settled only repeats them)
      r = regate({ ...still, board: { ...WB_BOARD, ...(still.board ?? {}) } }, ask, ctx);
    }
    if (!r.ok) { p.rejected = (r.gate?.checks ?? []).filter((x) => !x.pass).map((x) => x.id); return null; }
    return { ok: true, script: r.script, gate: r.gate, usd: 0, ms: Date.now() - t0, source: "first", by: p.by, template: p.template, screen: p.screen ?? null, syncMs: Date.now() - t0 };
  } catch { return null; }
}

/** round 7 (M3b): how often a taken board's steps were placed on her words (used) or that board was refused (refused). */
const anchoredStats = { used: 0, refused: 0 };
export const anchoredSteps = () => ({ ...anchoredStats });
/** Why the preselected board was not shown (telemetry codes): none | rejected:<check ids> | used. */
export function pickState(ask) {
  const p = picks.get(String(ask?.intent?.intentId ?? ""));
  if (!p) return "none";
  if (p.rejected) return `rejected:${p.rejected.join(",")}`;
  return p.used ? "used" : "pending";
}
export const _picks = picks;
