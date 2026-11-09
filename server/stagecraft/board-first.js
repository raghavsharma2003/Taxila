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
import { gateCtxFor, regate, retime, withSectors, withSplit, predictedLineOf, anchorSteps, answerValues, revealOf } from "./board-sync.js";
import { speechMsOf, WB_BOARD } from "../studio/plan.js";
import { explainerFor } from "../forge/explainer/lesson.js";
import { catalogueEntry } from "./catalogue.js";
import { fitLegible, scaleScript } from "./board-legible.js";
import { scriptFacts, isMotionOp, shiftOp, lintScript, opGeometry } from "../../shared/whiteboard.js";
import { preferPicture } from "./beat-card.js";
import { resolveBoardRef } from "../forge/explainer/board-ref.js";
import { expand } from "../forge/explainer/templates.js";
import { splitSentences } from "../voice/sentences.js";
import { clausesOf as voiceClausesOf } from "../voice/expressive/align.js";
import { normalizeScript, LIMITS as WB_LIMITS } from "../../shared/whiteboard.js";

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
const SHAPE_OF = { "fraction-line@1": "number line", "number-line-hop@1": "number line", "number-line-zoom@1": "number line", "number-line-scale@1": "number line", "fraction-parts@1": "whole in parts", "fraction-bars@1": "whole in parts", "wholes@1": "whole in parts", "unrolled@1": "drawing",
  "fraction-of@1": "area model", "equal-groups@1": "groups", "compare@1": "comparison", "flow@1": "flow", "cycle@1": "cycle", "bar-chart@1": "bar chart", "table@1": "table",
  "timeline@1": "timeline", "places@1": "map", "label@1": "labelled diagram", "column-op@1": "column sum", "place-value@1": "place value", "area-grid@1": "grid", "shade-grid@1": "grid", "angle@1": "angle", "lines@1": "angle", "symmetry@1": "symmetry", "parts@1": "labelled diagram", "combine-count@1": "groups" };
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
/** Counts with every value the board does not write (masked "?") as "?": sideValues and mark labels. */
function maskedCounts(counts, drawn) {
  const shown = new Set(drawn);
  const num = (t) => String(t ?? "").match(/\d+(?:\.\d+)?(?:\/\d+)?/g) ?? [];
  const out = { ...counts };
  if (Array.isArray(counts.sideValues)) out.sideValues = counts.sideValues.map((v) => (num(v).every((n) => shown.has(n)) ? v : "?"));
  if (Array.isArray(counts.marks)) out.marks = counts.marks.map((m) => (m.label && m.label !== "?" && !num(m.label).every((n) => shown.has(n)) ? { ...m, label: "?" } : m));
  return out;
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
  // (a grouped number, "4,815", is the number 4815 — and its groups, as before)
  const drawn = (script?.ops ?? []).flatMap((o) => (o.op === "text" || o.op === "label" ? (/\?/.test(String(o.text ?? "")) ? [] : (String(o.text ?? "").match(/\d+(?:,\d{2,3}(?!\d))*(?:\.\d+)?(?:\/\d+)?/g) ?? []).flatMap((n) => (n.includes(",") ? [n.replace(/,/g, ""), ...n.split(",")] : [n])))
    : o.op === "numwork" ? (o.layout === "fraction" ? [(o.rows ?? []).flat().map(String).join("/")] : (o.rows ?? []).flat().map(String)).filter((x) => /^\d+(?:\.\d+)?(?:\/\d+)?$/.test(x)) : []));
  // round 7 (director5 SC1): what the template drew, counted (gaps, ticks, marks with labels, parts, sides with values)
  const counts0 = c?.facts?.counts ?? script?.facts?.counts ?? facts?.counts ?? null;   // (the template's own first: a re-gate rebuilds the facts row)
  // (and the counts follow a mask: a side value or mark label the board writes as "?" is "?" in the counts too)
  const counts = counts0 && script?.ops ? maskedCounts(counts0, drawn) : counts0;
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
    const x = r.ok ? expand(r.call, { band: ask?.intent?.style?.band ?? "B3", lang: ask?.intent?.style?.lang ?? null }) : null;
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
      const x = r.ok ? expand(r.call, { band, lessonId, lang: ask?.intent?.style?.lang ?? null }) : null;
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
export function preselect(ask, { kit, redact = [], now = Date.now(), certify = null, pictureFirst = false, avoid = null, seen = null, avoidRef = null, avoidKind = null } = {}) {
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
    // director8 S3′ (amends SC2): a picture asked for while the card's own board is the page on screen: the second view of
    // the same numbers goes first (her line is written from ITS row); none → the re-show below, as before
    // (director14 S9: a LATER page of a turn that is the card's own — ofCard true on its segment, the card part of a picture
    // turn — is the card's board, never a second view: c5-t01 stuck 18's record said bars of quarters under "Isi rekha ke
    // neeche … 7 nishaan". Not ofCard on the turn's first page: Brain marks the card's board ofCard true before her line exists,
    // and that page of a picture turn IS the second view)
    const ownPage = ask?.intent?.cardPage === true;
    const card0 = request && request.kind !== "example" && !ownPage ? cands.find((c) => c.by === "script") : null;
    // (director10 G4: the card on screen by its ref — the page up was drawn, masked and labelled, on its own line;
    // director12 S4: or the same figure with other shading — c4 steady T16's 3-shaded bar under the card's 0-shaded one)
    const cardUp = sameFigure(ask?.intent?.boardRef, avoidRef);
    // (director12 S4, c5-t02 steady/stuck T18: a picture asked over an unmarked ask line — "Screen par 0 se 1 tak ki line
    // hai" — is the line's bars, whether or not that line is up yet: the line itself is no new picture)
    // (director14 S9b, c6 stuck 18: a picture asked right after a remediation — its board up, not the card's — drew the card
    // again, nothing new. The remediation's board up has a second view of its own: that board, seen another way)
    const upRef = !cardUp && avoidKind === "remediation" ? upRefOf(avoidRef) : null;
    const remAlt = card0 && upRef ? altCall(upRef, { line: predicted, withheld: ctx.withhold?.values ?? [], keys: liveKeys(ask, "") }) : null;
    const ownAlt = card0 && ((avoid && (cardUp || samePage(card0.script, avoid) || shownBefore(card0.script, { avoid }))) || unmarkedLine(ask?.intent?.boardRef));
    if (card0 && (ownAlt || remAlt)) {
      const ac0 = ownAlt ? altCall(ask.intent.boardRef, { line: predicted, withheld: ctx.withhold?.values ?? [], keys: liveKeys(ask, ""), up: cardUp ? upRefOf(avoidRef) : null }) : remAlt;
      const { view, ...ac } = ac0 ?? {};
      const ax = ac0 ? expand(ac, { band, lang: ask?.intent?.style?.lang ?? null }) : null;
      // (judged against a line that says the bars — her line is written from this row: "2 barabar bar: ek 6 barabar hisson mein …")
      const say = altSay(ac0);
      if (ax?.ok) cands.unshift({ by: "script", template: ac.template, script: ax.script, facts: ax.script.facts, altView: ALT_VIEWS.has(view) ? view : "parts", say, call: ac });
    }
    for (const c of pictureFirst ? preferPicture(cands) : cands) {
      const A2 = c.say ? { ...ask, line: { ...(ask.line ?? {}), text: c.say } } : a2, CTX = c.say ? wholesCtx({ ...gateCtxFor(A2, { kit, redact }), withhold: ctx.withhold }, c.call) : ctx;
      // (director8 S3′: the live card's OWN board — or its second view — always answers a picture asked for: a word board,
      // c4's compare cards, was skipped as "not a drawing", nothing was picked, and the ladder drew an unrelated code board)
      if (!(request && c.by === "script") && !answersRequest(c.script, request)) continue;
      // round 5 merge (main; owner-5 on 14.1): the child asks to SEE it ("whiteboard pe bana ke samjhao") and the page that
      // answers it is the one on screen NOW: it is picked, her line is written from it, and the seam KEEPS it (studio/seam.js
      // requestIntent). Never for an example (the same page is the repeat), never a page from earlier in the lesson.
      const onScreenAnswer = !!request && request.kind !== "example" && !!avoid && samePage(c.script, avoid);
      // round 7 (director5 SC2): a picture asked for while a scripted card is live re-shows THAT card's board, even when it was
      // up before (the never-repeat rule skipped it, and an older board took its place)
      const reShow = !!request && c.by === "script";
      // (director8 S1′: the scripted board of the beat still on screen — the same card, her confirming turn — stays this
      // beat's board: re-taken on her line, a value she now states is drawn (statedMark / the answers rule), else it is
      // kept; before, the never-repeat rule skipped it and the code's bare line replaced the card's board)
      const sameCard = c.by === "script" && !c.altView && !!avoid && (cardUp || samePage(c.script, avoid) || shownBefore(c.script, { avoid }));
      if (!onScreenAnswer && !reShow && !sameCard && shownBefore(c.script, { avoid, seen })) continue;
      const s0 = withSectors(retime(c.script, Math.max(800, Number(c.script.durationMs) || 0), CTX.speechMs), CTX.reply);
      // round 7 (motion ops): a whole cut into equal parts splits when the split passes the same gate (else the still board)
      const sp = withSplit(s0);
      const s = sp !== s0 && regate({ ...sp, board: { ...WB_BOARD, ...(sp.board ?? {}) } }, A2, CTX).ok ? sp : s0;
      // round 4 content: a board the child's device cannot show legibly (server/forge3/tray-gate.js) is never preselected:
      // her line is written from this board's facts row, so it must be one that will reach the stage
      if (certify && !certify({ ...s, board: { ...WB_BOARD, ...(s.board ?? {}) } })) continue;
      const r = regate({ ...s, board: { ...WB_BOARD, ...(s.board ?? {}) } }, A2, CTX);
      const failingChecks = r.ok ? [] : (r.gate?.checks ?? []).filter((x) => !x.pass);
      // (a moving board's W19.settled that only repeats a line-bound miss is line-bound too)
      const lineBound = (c) => LINE_BOUND.has(c.id) || (c.id === "W19.settled" && (c.detail ?? []).every((d) => LINE_BOUND.has(d)));
      // (director12 S6, c5-t02 steady row 78: c0's own two "?" bars failed W8 against their facts row — "wholes 2 equal bars"
      // says no 6 — and the catalogue's board took the page. The card's OWN board is judged on her real line, at the take:
      // her line is written from its row, so the row is never its judge)
      const ownCard = c.by === "script" && !c.altView;
      if (!r.ok && !ownCard && (!r.gate?.script || failingChecks.some((c) => !lineBound(c)))) continue;
      // (the second view's row is its own: "wholes 6 equal parts, 1 shaded (1/6) | …", what her picture line describes)
      const facts = c.altView && c.facts?.onScreen ? c.facts : r.ok ? r.script.facts : r.gate?.script ? scriptFacts(r.gate.script, { kind: "diagram", archetype: "whiteboard" }) : c.facts ?? scriptFacts(s, { kind: "diagram", archetype: "whiteboard" });
      const row = rowOfFacts(facts, countsOf(s));
      if (!row) continue;
      // a board that passed only once its answer was written "?" (board-sync maskReveals) is kept AS MASKED: her real line
      // is re-gated against what will be drawn
      const kept = r.ok && r.script?.ops ? { ...s, ops: r.script.ops } : r.gate?.script?.ops ? { ...s, ops: r.gate.script.ops } : s;
      // round 7 (director5): a script's board keeps its own timing (raw): her authored line is 3-5x the short facts line it
      // was fitted to here, and two capped retimes (≤ 2x each, from a compressed copy) never reached W6's spread
      // (counts: the template's own, unmasked — the take re-masks them against the board it draws)
      const counts = c.facts?.counts ?? c.script?.facts?.counts ?? null;
      const pick = { at: now, script: kept, facts, by: c.by, template: c.template, row, predicted: c.say ?? predicted, strict: r.ok, ...(c.altView ? { altView: c.altView, altCall: c.call } : {}), ...(sameCard ? { sameCard: true } : {}), screen: screenOf({ ...c, facts: { ...(c.facts ?? {}), ...(counts ? { counts } : {}) } }, facts, kept), ...(counts ? { counts } : {}), ...(c.by === "script" ? { raw: c.script } : {}) };
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
export function takePreselected(ask, ctx, t0 = Date.now(), { cardBack: back = true } = {}) {
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
    // (director11: a second view's separate wholes are wholes — W8 — whatever the card's own board is)
    const gctx = p.altCall ? wholesCtx(ctx, p.altCall) : ctx;
    let s = s0, r = null;
    if (an.anchored) { r = regate({ ...an.script, board: { ...WB_BOARD, ...(an.script.board ?? {}) } }, ask, gctx); if (r.ok) { s = an.script; anchoredStats.used++; } else { r = null; anchoredStats.refused++; } }
    r ??= regate({ ...s, board: { ...WB_BOARD, ...(s.board ?? {}) } }, ask, gctx);
    // a split that her real line refuses: the still board (motion never costs the board)
    if (!r.ok && s.ops.some(isMotionOp)) {
      const still = { ...s, ops: s.ops.filter((o) => !isMotionOp(o)) };
      // (refused still too: the still board's reasons are recorded, W19.settled only repeats them)
      r = regate({ ...still, board: { ...WB_BOARD, ...(still.board ?? {}) } }, ask, gctx);
    }
    if (!r.ok) {
      p.rejected = (r.gate?.checks ?? []).filter((x) => !x.pass).map((x) => x.id);
      // (director10 G4: a second view her real line does not describe — "Ek rectangle card …" under the unrolled sides,
      // W15 — gives way to the card's OWN board, re-shown as before the second views: never nothing)
      return p.altView ? cardBoardOn(ask, ctx, t0) : null;
    }
    // (director8 c5-t02 c3: "pehla nishaan 1/4 hai" over the asked mark's "?": a mark whose value her line states is labelled)
    const before = r.script;
    // (director10 G3: a correct verdict's reveal — Brain's scriptBeat.reveal — is said for the mark, digits on her page or not)
    const shown = statedMark(r.script, ask?.intent?.boardRef, ctx.revealText ? `${ctx.reply} ${ctx.revealText}` : ctx.reply);
    if (shown) r = { ...r, script: shown };
    // (director9: the "?" a stated mark became is that value in the SCREEN too — counts.marks and labels — not only in the
    // ops: Brain's per-segment check read counts.marks "?" under "Bilkul, Riya — pehla gap 1/8 km" on the drawn 1/8)
    const revealed = shown ? revealsOf(before, shown) : [];
    // round 7 (director6 #1): the screen is what is DRAWN now: re-gated on her real line, a value she states is no longer "?"
    // (the pick's screen was computed before her line existed, masked: R4 read "40 m lamba" against a screen with no 40)
    const out = { ok: true, script: r.script, gate: r.gate, usd: 0, ms: Date.now() - t0, source: "first", by: p.by, template: p.template, ...(p.altView ? { altView: p.altView } : {}), ...(p.sameCard ? { sameCard: true } : {}),
      screen: withReveals(screenOf({ template: p.template, facts: { ...(p.raw?.facts ?? p.facts ?? {}), ...(p.counts ? { counts: p.counts } : {}) } }, r.script?.facts ?? p.facts, r.script), revealed), syncMs: Date.now() - t0 };
    return p.altView && back ? cardBack(ask, ctx, out, t0, p.predicted) : out;
  } catch { return null; }
}

/** director11: a second view of two or three separate wholes (bars, wholes) — its outlines are wholes, not her count (W8). */
function wholesCtx(ctx, call) {
  const n = Array.isArray(call?.bars) ? call.bars.length : Array.isArray(call?.wholes) ? call.wholes.length : 0;
  return n >= 2 ? { ...ctx, wholes: n } : ctx;
}
/** The words that name a card's OWN figure, by its template (her line pointing back at it while a second view is up). */
function figureWordsOf(ref) {
  const t = ref?.template, whole = ref?.params?.whole;
  if (t === "fraction-line@1" || t === "number-line-scale@1" || t === "number-line-hop@1") return /sankhya\s+rekha|number\s+line|\brekha\b|\bnishaan|\bmarks?\b|\bline\b/i;
  if (t === "fraction-bars@1" || t === "shade-grid@1" || (t === "fraction-parts@1" && whole === "bar")) return /\bpatti|\bpattiyan|\bbars?\b|\bstrip/i;
  if (t === "fraction-parts@1") return /\bgol\b|\bcircle|\broti\b|\bpizza\b/i;
  return null;
}
/**
 * director11 S1/S2 (c5-t02 steady T18 "Dekho, yahi 1/8 aur 1/4 ab patti par. Aisi hi 0 se 1 wali sankhya rekha par …"; c5-t01
 * "… ab patti par. 1 metre ke ribbon par … 7 chalk ke nishaan"): a second view's line that goes on to name the card's OWN
 * figure brings that figure back where she names it — two pages: the second view under its caption, then the card's board.
 * Her line naming nothing of the card's figure: the second view as it was. → a board-first result.
 */
/** Words no card owns: Hinglish and English function words, and the words every fraction or shape card says. */
const CARD_STOP = new Set(("aage aapne abhi aisa aise aisi andar apna apne apni baad bahut bata batao bataoge bataogi bati bata bhaag bhi bhinn " +
  "bilkul chahiye dekho diya diye dono doosra doosre ekdum gaya gaye hissa hisse hisson hissa hota hote hoti inme isko iska iske iski isme " +
  "jaise jitne jitna kaun kaunsa kaunse kaise kahan karke karo kitna kitne kitni kiya kiye kuch kyon kyunki lekin liya liye matlab neeche " +
  "number numbers pehla pehle pehli phir poora poore raha rahe rahi sabse sahi sakte sakti socho tukda tukde tukdon tumhe tumne tumhara " +
  "tumhari unka unke unki upar usse uska uske uski wahan wahi wala wale wali yahan yahi yaani zyada barabar equal parts part piece pieces " +
  "which what many more than with from into each have does this that there their they then them were will would your about " +
  "baraabar hain haan nahi nahin bolo likho dikhao samjho samjhao mein parimap perimeter bhuja bhujayein bhujaon side sides length lambai kinaare").split(/\s+/).filter(Boolean));
/** director12 S5: the words that name THIS card — her line pointing back at it while its second view is up. From the card's
 *  own prompt (the kit item Brain sends), its board's titles and labels, and its corner names (PQRST, and each side PQ, QR …).
 *  Words the second view's own row says are its caption, never a trigger. → Set<string> (lower case) */
export function cardWordsOf(ask, say = "") {
  const out = new Set(), own = new Set((String(say).toLowerCase().match(/[a-z]+/g) ?? []));
  const add = (t) => { for (const w of String(t ?? "").toLowerCase().match(/[a-z]+/g) ?? []) if (w.length >= 4 && !CARD_STOP.has(w) && !own.has(w)) out.add(w); };
  const it = ask?.kit?.item;
  add(it?.prompt_hi); add(it?.prompt_en);
  const walk = (v, k = "") => {
    if (Array.isArray(v)) { if (k === "names" && v.every((x) => typeof x === "string" && /^[A-Z]$/.test(x)) && v.length >= 3) {
      out.add(v.join("").toLowerCase()); v.forEach((x, i) => out.add(`${x}${v[(i + 1) % v.length]}`.toLowerCase())); } else v.forEach((x) => walk(x, k)); return; }
    if (v && typeof v === "object") { for (const [kk, vv] of Object.entries(v)) walk(vv, kk); return; }
    if (typeof v === "string" && /^(title|label|labels|name|caption|items|left|right)$/.test(k)) add(v);
  };
  walk(ask?.intent?.boardRef?.params ?? {});
  return out;
}
function cardBack(ask, ctx, alt, t0, say = "") {
  try {
    const re = figureWordsOf(ask?.intent?.boardRef), text = String(ask?.line?.text ?? "");
    let m = re ? re.exec(text) : null;
    // (director12 S5, c5-t01 steering T14: "sadak" — the card's own road — named after the caption brought nothing back;
    // c6's "khet PQRST" had no trigger at all. A word of the card's own text, past her first sentence, turns the page too)
    const words = cardWordsOf(ask, say);
    if (words.size) {
      const first = Math.max(0, splitSentences(text)[0] ? text.indexOf(splitSentences(text)[0]) + splitSentences(text)[0].length : 0);
      for (const w of text.matchAll(/[A-Za-z]+/g)) {
        if (w.index < first || !words.has(w[0].toLowerCase())) continue;
        if (!m || w.index < m.index) m = { index: w.index };
        break;
      }
    }
    if (!m || !alt?.script) return alt;
    // (the clause the figure word is in turns the page: from that clause's start)
    let at = m.index;
    const cut = Math.max(text.lastIndexOf(". ", at), text.lastIndexOf("? ", at), text.lastIndexOf("! ", at), text.lastIndexOf(", ", at));
    if (cut >= 0) at = cut + 2;
    if (at < 8) { const back = cardBoardOn(ask, ctx, t0); return back ?? alt; }
    const head = text.slice(0, at).trim(), tail = text.slice(at).trim();
    if (!tail) return alt;
    const ask2 = { ...ask, line: { ...(ask.line ?? {}), text: tail } };
    const back = cardBoardOn(ask2, gateCtxFor(ask2, { kit: ctx.kit, redact: ctx.banned ?? [], prior: [] }), t0);
    if (!back?.script) return alt;
    const at1 = Math.max(800, speechMsOf(head));
    const ren = (ops, pre) => { const mm = new Map(ops.map((o) => [o.id, `${pre}${o.id}`.slice(0, 32)])); return ops.map((o) => ({ ...o, id: mm.get(o.id), ...(TARGETED.has(o.op) && mm.has(o.target) ? { target: mm.get(o.target) } : {}) })); };
    const p0 = ren(alt.script.ops.filter((o) => !isMotionOp(o)), "a.").map((o) => ({ ...o, startMs: Math.min(o.startMs, Math.max(0, at1 - 120)), endMs: Math.min(o.endMs, at1) }));
    const erase = p0.filter((o) => DRAWN.has(o.op)).map((o, k) => ({ id: `a.x${k}`.slice(0, 32), op: "erase", target: o.id, startMs: at1, endMs: at1 + 200 }));
    const p1 = ren(back.script.ops, "b.").map((o) => ({ ...o, startMs: o.startMs + at1, endMs: o.endMs + at1 }));
    const ops = [...p0, ...erase, ...p1];
    if (ops.length > WB_LIMITS.maxOps) return alt;
    const clause = splitSentences(head).reduce((n, part) => n + voiceClausesOf(part).length, 0);
    const raw = { ...alt.script, scriptId: `${alt.script.scriptId ?? "wb"}:bk`.slice(0, 64), ops, durationMs: Math.max(...ops.map((o) => o.endMs)) + 200,
      facts: back.script.facts ?? alt.script.facts, switches: [{ clause, atMs: at1, ...firstWordOf(text, at) }] };
    const n = normalizeScript(raw, { strict: false });
    if (!n.ok || !n.script?.switches?.length) return alt;
    cardBacks++;
    return { ...alt, script: n.script, screen: back.screen, screens: [{ from: 0, ...(alt.screen ?? {}) }, { from: at, ...(back.screen ?? {}) }], lastRef: refKey(ask?.intent?.boardRef) };
  } catch { return alt; }
}
let cardBacks = 0;
/** director11: second views whose line named the card's own figure and brought it back as a second page. */
export const cardBackCount = () => cardBacks;

/** The values a stated-mark rewrite wrote over "?", in board order: the "?" text ops of `before` that `after` writes. */
function revealsOf(before, after) {
  const was = new Map((before?.ops ?? []).filter((o) => o.op === "text" && String(o.text).trim() === "?").map((o) => [o.id, true]));
  return (after?.ops ?? []).filter((o) => was.has(o.id) && String(o.text).trim() !== "?").map((o) => String(o.text));
}
/** A screen whose "?" marks (counts.marks, in order) are now the revealed values: they are drawn, so they are shown. */
function withReveals(screen, revealed) {
  if (!revealed?.length || !screen) return screen;
  const q = [...revealed];
  const marks = screen.counts?.marks?.map((m) => (m.label === "?" && q.length ? { ...m, label: q.shift() } : m));
  const nums = revealed.flatMap((t) => String(t).match(/\d+(?:\.\d+)?(?:\/\d+)?/g) ?? []);
  return { ...screen, labels: [...new Set([...(screen.labels ?? []), ...revealed])], numbers: [...new Set([...(screen.numbers ?? []), ...nums])],
    ...(marks ? { counts: { ...screen.counts, marks } } : {}) };
}

/** The card's own board (intent.boardRef), drawn and gated on her real line — the re-show a failed second view falls back to. */
function cardBoardOn(ask, ctx, t0) {
  try {
    const rr = resolveBoardRef(ask?.intent?.boardRef, {});
    const x = rr.ok ? expand(rr.call, { band: ask?.intent?.style?.band ?? "B3", lang: ask?.intent?.style?.lang ?? null }) : null;
    if (!x?.ok) return null;
    const s = retime(x.script, Math.max(800, Number(x.script.durationMs) || 0), ctx.speechMs, SCRIPT_STRETCH);
    let g = regate({ ...s, board: { ...WB_BOARD, ...(s.board ?? {}) } }, ask, ctx);
    if (!g.ok) return null;
    const shown = statedMark(g.script, ask?.intent?.boardRef, ctx.revealText ? `${ctx.reply} ${ctx.revealText}` : ctx.reply);
    if (shown) g = { ...g, script: shown };
    return { ok: true, script: g.script, gate: g.gate, usd: 0, ms: Date.now() - t0, source: "first", by: "script", template: rr.call.template, sameCard: true,
      screen: screenOf({ template: rr.call.template, facts: x.script.facts }, g.script?.facts ?? x.script.facts, g.script), syncMs: Date.now() - t0 };
  } catch { return null; }
}

/**
 * director8 (c5-t02 c3): fraction-line@1's asked `mark` is drawn "?" — the card asks for it. When her line STATES that mark's
 * value ("pehla nishaan 1/4 hai", or an equal fraction 2/8), the "?" is that value, as she says it. → the script, or null.
 */
export function statedMark(script, ref, line) {
  try {
    const r = resolveBoardRef(ref, {});
    // (c7 lines@1: an asked angle "?" whose value her line states — "70°", "70 degree" — is written as that angle)
    if (r.ok && r.call.template === "lines@1" && Array.isArray(script?.ops)) {
      const deg = r.call.kind === "cross" ? r.call.deg : r.call.transversal?.deg;
      const asked = (r.call.angles ?? []).filter((a) => a?.value === "?").map((a) => ((a.at - 1) % 2 === 0 ? deg : 180 - deg));
      // (opposite angles are equal: "ek kon 70° hai" states the GIVEN 70°, and is no answer to the asked one. The asked angle
      // is written only when her line says its value more times than the board already writes it)
      const saidN = new Map();
      for (const m of String(line ?? "").matchAll(/(\d+)\s*(?:°|degree|digree|ansh)/gi)) saidN.set(Number(m[1]), (saidN.get(Number(m[1])) ?? 0) + 1);
      const writtenN = new Map();
      for (const a of r.call.angles ?? []) if (typeof a?.value === "number") writtenN.set(a.value, (writtenN.get(a.value) ?? 0) + 1);
      let k = 0, hit = false;
      const ops = script.ops.map((o) => {
        if (o.op !== "text" || String(o.text).trim() !== "?") return o;
        const v = asked[k++];
        if (!Number.isFinite(v) || (saidN.get(v) ?? 0) <= (writtenN.get(v) ?? 0)) return o;
        writtenN.set(v, (writtenN.get(v) ?? 0) + 1);
        hit = true;
        return { ...o, text: `${v}°`, ink: "accent" };
      });
      return hit ? { ...script, ops } : null;
    }
    if (!r.ok || r.call.template !== "fraction-line@1" || !Number.isInteger(r.call.mark) || !Number.isInteger(r.call.den)) return null;
    const v = r.call.mark / r.call.den;
    const said = (String(line ?? "").match(/(?<![\d/])\d+\s*\/\s*\d+(?![\d/])/g) ?? []).map((m) => m.replace(/\s+/g, ""))
      .find((f) => { const [a, b] = f.split("/").map(Number); return b > 0 && Math.abs(a / b - v) < 1e-9; });
    if (!said || !Array.isArray(script?.ops)) return null;
    let hit = false;
    const ops = script.ops.map((o) => (!hit && o.op === "text" && String(o.text).trim() === "?" ? ((hit = true), { ...o, text: said, size: "m" }) : o));
    return hit ? { ...script, ops } : null;
  } catch { return null; }
}

/**
 * director8 S3′ (main, approved 2026-11-06, amends SC2): a picture asked for while the live card's OWN board is already the
 * page on screen draws a SECOND VIEW of the same numbers — the line's (or comparison's) fractions as equal bars
 * (fraction-bars@1), certified on her line with counts.wholes. The value the card withholds is a "?" bar, never shaded.
 * No second view (a board with no fractions, a picture already in parts) → null: the page is re-shown as before.
 * → { ok, script, gate, template, altView: "parts", screen, … } or null.
 */
export function altView(ask, ctx, { upKey = null } = {}) {
  try {
    const up = upKey && sameFigure(ask?.intent?.boardRef, upKey) ? upRefOf(upKey) : null;
    const call0 = altCall(ask?.intent?.boardRef, { line: String(ctx?.reply ?? ask?.line?.text ?? ""), withheld: ctx?.withhold?.values ?? [], keys: liveKeys(ask, String(ctx?.reply ?? ask?.line?.text ?? "")), up });
    const { view, ...call } = call0 ?? {};
    const x = call0 ? expand(call, { band: ask?.intent?.style?.band ?? "B3", lang: ask?.intent?.style?.lang ?? null }) : null;
    if (!x?.ok) return null;
    const s = retime(x.script, Math.max(800, Number(x.script.durationMs) || 0), ctx.speechMs, SCRIPT_STRETCH);
    const g = regate({ ...s, board: { ...WB_BOARD, ...(s.board ?? {}) } }, ask, wholesCtx(ctx, call));
    if (!g.ok) return null;
    return cardBack(ask, ctx, { ok: true, script: g.script, gate: g.gate, usd: 0, ms: 0, source: "first", by: "script", template: call.template, altView: ALT_VIEWS.has(view) ? view : "parts", syncMs: 0,
      screen: screenOf({ template: call.template, facts: x.script.facts }, g.script?.facts ?? x.script.facts, g.script) }, Date.now(), altSay(call0));
  } catch { return null; }
}
/** compare@1 → wholes@1 when BOTH columns name a whole cut into pieces ("3 tukde") and whether they are equal; else null. */
function wholesOfCompare(c) {
  const col = (side) => {
    if (!side) return null;
    const words = [side.title, ...(side.items ?? [])].map((v) => String(v ?? "")).join(" | ").toLowerCase();
    const m = /(?<![\d/])(\d+)\s+(?:barabar\s+)?(?:tukde|tukdon|hisse|hisson|parts?|bhaag|pieces?|slice)\b/.exec(words);
    if (!m || +m[1] < 2 || +m[1] > 12) return null;
    const unequal = /\b(?:bada|bade|chhot[ae]|unequal|not equal)\b|barabar\s+nahi/.test(words);
    const equal = /\b(?:barabar|equal|same)\b/.test(words) && !unequal;
    if (!unequal && !equal) return null;
    const sh = /(?<![\d/])(\d+)\s+(?:rangin|rang wale|shaded|coloured|colored)\b/.exec(words);
    const title = String(side.title ?? "").trim();
    return { parts: +m[1], equal: !unequal, ...(sh && +sh[1] <= +m[1] ? { shade: +sh[1] } : {}), ...(title && title.length <= 18 ? { title } : {}) };
  };
  const a = col(c.left), b = col(c.right);
  return a && b && (a.parts >= 3 || a.equal) && (b.parts >= 3 || b.equal) ? { template: "wholes@1", wholes: [a, b], view: "wholes" } : null;
}

/** The second views a pick names (artifact.altView): parts (bars), line, wholes, strips (wholes as bars), unrolled (a ruler),
 *  round (a circle), example (a smaller case of the same rule: a count key's own figure would show the count). */
const ALT_VIEWS = new Set(["parts", "line", "wholes", "strips", "unrolled", "round", "example"]);
/** The row a second view's line is written from (and judged against before her line exists). */
function altSay(ac0) {
  if (!ac0) return "";
  const { view, ...ac } = ac0;
  if (view === "example") { const b = ac.bars[0]; return `Ek chhota udaharan: ek patti ${b.parts} barabar hisson mein, ${b.shade} rangin (${b.label})`; }
  return ac.wholes ? ac.wholes.map((w) => `${w.title ?? "ek"}: ${w.parts} ${w.equal ? "barabar" : "alag-alag"} tukde${w.shade ? `, ${w.shade} rangin` : ""}`).join("; ") : ac.bars ? `${ac.bars.length} barabar bar: ${ac.bars.map((b) => `ek ${b.parts} barabar hisson mein${b.shade ? `, ${b.shade} rangin${b.label === "?" ? "" : ` (${b.label})`}` : ""}`).join("; ")}`
    : ac.template === "fraction-parts@1" ? `Wahi poora ab ${ac.whole === "bar" ? "patti" : "gol"}: ${ac.parts} barabar hisse${ac.shade ? `, ${ac.shade} rangin${ac.hideResult ? "" : ` (${ac.shade}/${ac.parts})`}` : ""}`
    : ac.sides ? `${ac.figure ? `Is ${ac.figure.shape === "rect" ? (ac.figure.w === ac.figure.h ? "square" : "rectangle") : ac.figure.shape === "triangle" ? "triangle" : "aakaar"} ki ` : ""}${ac.sides.length} bhujayein seedhi karke ek line par: ${ac.sides.map((v, i) => (ac.hide?.includes(i) ? "?" : `${v} ${ac.unit}`)).join(", ")}; kul lambai ${ac.total === "?" ? "kitni" : `${ac.total} ${ac.unit}`}`
    : Array.isArray(ac.dens) ? `0 se 1 ki do sankhya rekhayein, ${ac.dens.join(" aur ")} barabar gaps, nishaan ${ac.marks.map((m) => `${m[0]}/${m[1]}`).join(", ")} par`
    : `0 se 1 ki sankhya rekha, ${ac.den} barabar gaps, nishaan ${ac.marks.map((m) => m.label).join(", ")} par`;
}
/** The ref a refKey names ({ template, params }), or null. */
export function upRefOf(key) {
  try { const j = JSON.parse(String(key ?? "")); return j?.t ? { template: j.t, params: j.p ?? {} } : null; } catch { return null; }
}
/** director12 S4: the board up (a refKey) is this card's figure — the same ref, or a fraction-parts whole cut the same way
 *  with other shading (the card's own 0-shaded bar under the 3-shaded one her earlier line drew). */
export function sameFigure(ref, upKey) {
  if (!upKey || !ref?.template) return false;
  if (refKey(ref) === upKey) return true;
  const up = upRefOf(upKey);
  if (ref.template !== "fraction-parts@1" || up?.template !== "fraction-parts@1") return false;
  const a = ref.params ?? {}, b = up.params ?? {};
  return Number(a.parts) === Number(b.parts) && (a.whole === "bar") === (b.whole === "bar");
}
/** A 0-1 line card that marks nothing (its ask is about the line itself: "1/3 ya 1/7?", "kitne gaps?"). */
function unmarkedLine(ref) {
  const c = ref?.template === "fraction-line@1" ? ref.params ?? {} : null;
  if (!c || c.target != null || Number(c.to ?? 1) > 1 || Number(c.from ?? 0) !== 0) return false;
  if ((Array.isArray(c.marks) && c.marks.length) || c.mark != null || c.hop) return false;
  return (Array.isArray(c.dens) && c.dens.length >= 1) || Number.isInteger(c.den);
}
/** director10 G4: a polygon card's sides, in order, and its unit — measured@1 (rect, square, triangle, polygon) or shape@1
 *  (a regular polygon whose `side` label gives one length: "5 cm") — or null (a circle, no lengths). */
function sidesOf(c) {
  const unit = c.unit === "m" || c.unit === "cm" ? c.unit : null;
  if (c.template === "measured@1" && unit) {
    if (c.shape === "rect" || c.shape === "square") { const w = Number(c.w), h = Number(c.h ?? c.w); return w > 0 && h > 0 ? { sides: [w, h, w, h], unit, figure: { shape: "rect", w, h } } : null; }
    if (c.shape !== "circle" && Array.isArray(c.sides) && c.sides.length >= 3 && c.sides.every((v) => Number(v) > 0)) {
      const sides = c.sides.map(Number);
      return { sides, unit, figure: sides.length === 3 ? { shape: "triangle", sides } : { shape: "polygon", n: sides.length } };
    }
    return null;
  }
  if (c.template === "shape@1") {
    const n = { triangle: 3, square: 4, pentagon: 5, hexagon: 6, heptagon: 7, octagon: 8 }[String(c.shape ?? "").toLowerCase()];
    const m = /(\d+(?:\.\d+)?)\s*(cm|m)\b/.exec(String(c.side ?? ""));
    const v = m ? Number(m[1]) : 0;
    return n && m && v > 0 ? { sides: Array.from({ length: n }, () => v), unit: m[2], figure: n === 4 ? { shape: "rect", w: v, h: v } : n === 3 ? { shape: "triangle", sides: [v, v, v] } : { shape: "polygon", n } } : null;
  }
  return null;
}

/**
 * main (director10 cause #2, A1): the live card's KEY values a second view must never draw or label — the card's answers
 * (scriptBeat.answers[0]) her line does not state; none once a correct verdict reveals them (scriptBeat.reveal). → string[]
 */
export function liveKeys(ask, line = "") {
  const beat = ask?.intent?.scriptBeat;
  if (!Array.isArray(beat?.answers) || !beat.answers.length || revealOf(beat).length) return [];
  return answerValues(beat.answers, line);
}
/** The second view's call without the live card's key: a count key cuts no scale into that many parts (the scale is drawn
 *  uncut, unnamed), a fraction key names and shades no bar, a length key labels no side or total. → the call, or null. */
function keyless(call, keys) {
  if (!call || !keys.length) return call;
  const val = (t) => { const m = /^(\d+(?:\.\d+)?)(?:\/(\d+))?$/.exec(String(t).replace(/\s+/g, "")); return m ? Number(m[1]) / (m[2] ? Number(m[2]) : 1) : null; };
  const fracKeys = keys.filter((k) => String(k).includes("/")).map(val).filter((v) => v != null);
  const numKeys = keys.filter((k) => !String(k).includes("/")).map(Number).filter(Number.isFinite);
  const isFrac = (a, b) => b > 0 && fracKeys.some((v) => Math.abs(v - a / b) < 1e-9);
  if (call.template === "fraction-bars@1") {
    // (director11 S1: only the key's VALUE is hidden — the shading the card's own figure shows stays, its name is "?")
    const bars = call.bars.map((b) => (numKeys.includes(b.parts) ? { parts: 1, shade: 0, label: "?" } : isFrac(b.shade, b.parts) ? { ...b, label: "?" } : b));
    return { ...call, bars };
  }
  if (call.template === "fraction-line@1") {
    if ((call.den && numKeys.includes(call.den)) || (Array.isArray(call.dens) && call.dens.some((d) => numKeys.includes(d)))) return null;
    const marks = (call.marks ?? []).filter((m) => (Array.isArray(m) ? !isFrac(m[0], m[1]) : !isFrac(m.num, call.den)));
    return marks.length ? { ...call, marks } : null;
  }
  if (call.template === "fraction-parts@1") return isFrac(call.shade, call.parts) ? { ...call, hideResult: true } : call;
  if (call.template === "unrolled@1") {
    const sum = call.sides.reduce((a, b) => a + b, 0);
    const hide = call.sides.map((v, i) => (numKeys.includes(v) ? i : -1)).filter((i) => i >= 0);
    return { ...call, ...(hide.length ? { hide } : {}), total: numKeys.some((k) => Math.abs(k - sum) < 1e-6) ? "?" : call.total };
  }
  return call;
}

/** The second view's call: the card board's fractions as fraction-bars@1 bars (withheld → "?", unshaded), or null. */
export function altCall(ref, { line = "", withheld = [], keys = [], up = null } = {}) {
  try {
    const out = altCall0(ref, { line, withheld, up });
    const k = keyless(out, keys);
    // (director12 S4, c5-t01 stuck T18: a count key — "kitne barabar gaps?", 8 — leaves the line's bars uncut and unnamed:
    // nothing new. The second view is then a smaller case of the same rule, its count given: never the key's own count)
    if (k?.template === "fraction-bars@1" && k.ends && out?.bars?.length && k.bars.every((b) => b.parts === 1)) {
      const nums = new Set(keys.map((v) => Number(String(v).replace(/[^\d.]/g, ""))).filter(Number.isFinite));
      const d = [4, 3, 5, 6].find((n) => n !== out.bars[0].parts && !nums.has(n) && !nums.has(n - 1));
      return d ? { template: "fraction-bars@1", bars: [{ parts: d, shade: 1, label: `1/${d}` }], ends: true, view: "example" } : null;
    }
    return k ? { ...k, ...(out?.view && !k.view ? { view: out.view } : {}) } : null;
  } catch { return null; }
}
function altCall0(ref, { line = "", withheld = [], up = null } = {}) {
  try {
    const r = resolveBoardRef(ref, {});
    if (!r.ok) return null;
    const c = r.call;
    // (director10 G4, from the LIVE card's figure) two wholes in pieces → the same wholes as strips; a polygon's sides → its
    // boundary laid straight on a ruler, the total its card asks a "?" unless her line says it; equal bars → their line
    if (c.template === "wholes@1" && c.as !== "bar" && Array.isArray(c.wholes) && c.wholes.length) return { template: "wholes@1", as: "bar", wholes: c.wholes, view: "strips" };
    const ps = sidesOf(c);
    if (ps) {
      const sum = Math.round(ps.sides.reduce((a, b) => a + b, 0) * 10) / 10;
      const said = (String(line).match(/\d+(?:\.\d+)?/g) ?? []).map(Number).includes(sum);
      const held = withheld.map(String).some((w) => Number(w) === sum);
      return { template: "unrolled@1", sides: ps.sides, unit: ps.unit, total: said && !held ? sum : "?", ...(ps.figure ? { figure: ps.figure } : {}), view: "unrolled" };
    }
    if (c.template === "fraction-bars@1" && Array.isArray(c.bars)) {
      const named = c.bars.filter((b) => b && b.label !== "?" && Number.isInteger(b.parts) && b.parts >= 2 && b.parts <= 12 && Number.isInteger(b.shade) && b.shade >= 1 && b.shade <= b.parts);
      const dens = [...new Set(named.map((b) => b.parts))];
      // (director13 S8, c5-t02 stuck row 20: an unmarked bars ask — "?" bars of 4 and 8, the card asks which piece is bigger —
      // had no second view and re-showed the same bars. Its second view is each bar as a circle of the same parts, its shading
      // kept, nothing named: one bar → fraction-parts round, two or three → wholes@1 circles side by side)
      if (!named.length) {
        const bs = c.bars.filter((b) => b && Number.isInteger(b.parts) && b.parts >= 2 && b.parts <= 12);
        if (!bs.length || bs.length !== c.bars.length || bs.length > 3) return null;
        const sh = (b) => (Number.isInteger(b.shade) && b.shade >= 0 && b.shade <= b.parts ? b.shade : 0);
        if (bs.length === 1) return { template: "fraction-parts@1", parts: bs[0].parts, shade: sh(bs[0]), whole: "circle", hideResult: true, view: "round" };
        return { template: "wholes@1", wholes: bs.map((b) => ({ parts: b.parts, equal: true, ...(sh(b) ? { shade: sh(b) } : {}) })), view: "wholes" };
      }
      if (dens.length > 2) return null;
      if (dens.length === 1) return { template: "fraction-line@1", den: dens[0], from: 0, to: 1, marks: [...new Map(named.map((b) => [b.shade, { num: b.shade, label: `${b.shade}/${b.parts}` }])).values()], view: "line" };
      return { template: "fraction-line@1", dens, from: 0, to: 1, marks: named.map((b) => [b.shade, b.parts]), view: "line" };
    }
    // (director9: a whole already in parts has its own second view — a circle or a grid becomes a bar; a bar becomes the
    // number line of the same fraction. The judges counted picture requests over these boards that drew nothing new)
    const withheldOf = (a, b) => withheld.map(String).some((w) => { const m = /^(\d+)\/(\d+)$/.exec(w); return !!m && Math.abs(Number(m[1]) / Number(m[2]) - a / b) < 1e-9; });
    // (director12 S4: a bar's second view is the same whole round — c4 steady 18, stuck 18, steering 14 redrew the bar —
    // and a circle's is the bar; the same parts and shading, the fraction written only when it is no withheld value. A card
    // drawn unshaded under the same figure shaded (the page up) keeps the shading that is already on screen)
    if (c.template === "fraction-parts@1" && Number.isInteger(c.parts) && c.parts >= 2 && c.parts <= 12) {
      const upSh = up?.template === "fraction-parts@1" && Number(up.params?.parts) === c.parts ? Number(up.params?.shade) || 0 : 0;
      const sh = Number.isInteger(c.shade) && c.shade >= 1 ? c.shade : upSh;
      if (!(sh >= 0 && sh <= c.parts)) return null;
      const hide = c.hideResult || (sh > 0 && withheldOf(sh, c.parts));
      return { template: "fraction-parts@1", parts: c.parts, shade: sh, whole: c.whole === "bar" ? "circle" : "bar", ...(hide ? { hideResult: true } : {}), view: c.whole === "bar" ? "round" : "parts" };
    }
    if (c.template === "shade-grid@1" && !Array.isArray(c.block)) {
      const n = (c.rows ?? 0) * (c.cols ?? 0), sh = c.shade ?? 0;
      if (n < 2 || n > 12 || sh < 1 || sh > n) return null;
      // (director11 S2: a one-row grid IS a strip — c4 steering T14 redrew the same 4-cell strip with a "?": its second view
      // is the same whole as a round one, cut into the same parts, the same parts shaded; its fraction written only if given)
      if ((c.rows ?? 0) === 1) return { template: "fraction-parts@1", parts: n, shade: sh, whole: "circle", ...(c.hideResult || withheldOf(sh, n) ? { hideResult: true } : {}), view: "round" };
      return { template: "fraction-bars@1", bars: [c.hideResult || withheldOf(sh, n) ? { parts: n, shade: sh, label: "?" } : { parts: n, shade: sh, label: `${sh}/${n}` }] };
    }
    // (a compare of two wholes in pieces — "Cake A: 3 tukde, 1 bada 2 chhote | Cake B: 3 tukde, sab barabar" — is drawn as
    // the two wholes themselves; one with fractions of its own still becomes bars, below)
    if (c.template === "compare@1") { const w2 = wholesOfCompare(c); if (w2) return w2; }
    if (!["fraction-line@1", "compare@1"].includes(c.template)) return null;
    const frac = (t) => { const m = /^\s*(\d+)\s*\/\s*(\d+)\s*$/.exec(String(t ?? "")); return m && Number(m[2]) >= 1 && Number(m[2]) <= 12 && Number(m[1]) <= Number(m[2]) ? [Number(m[1]), Number(m[2])] : null; };
    const fs = [];   // [a, b], or { at: [a, b] } for the asked mark
    if (c.template === "fraction-line@1") {
      if (c.target != null || Number(c.to ?? 1) > 1) return null;   // (beyond one whole, or a target to place: no bar view)
      // (a two-scale line names its marks as [a, b] pairs: [[1, 7], [1, 9]])
      for (const m of Array.isArray(c.marks) ? c.marks : []) {
        const f = Array.isArray(m) ? frac(`${m[0]}/${m[1]}`) : frac(m?.label ?? `${m?.num}/${c.den}`) ?? (Number.isInteger(m?.num) && m.num <= c.den ? [m.num, c.den] : null);
        if (f) fs.push(f);
      }
      if (Number.isInteger(c.mark) && Number.isInteger(c.den) && c.den <= 12) fs.push({ at: [c.mark, c.den] });
      if (!fs.length && Number.isInteger(c.hop?.num) && c.hop.num <= c.den) fs.push([c.hop.num, c.den]);
      // (director10 G4, c5-t01: a two-scale line is BOTH its scales — "1/4" above and the 8-gap line below that the card asks
      // about; the bars drew only the marked 1/4. A scale with no mark of its own is its bar, unnamed: "?")
      if (Array.isArray(c.dens)) for (const d of c.dens) if (Number.isInteger(d) && d >= 2 && d <= 12 && !fs.some((f) => (Array.isArray(f) ? f : f.at)[1] === d)) fs.push({ at: [0, d] });
    } else {
      // (only a title or item that IS a fraction — its one number: "1/6 roti". "1/4 ke 3 hop" and "8 ka 1/2 = 4" are
      // a count of pieces or a share of a set: as bars they would show something else)
      for (const w of [c.left?.title, ...(c.left?.items ?? []), c.right?.title, ...(c.right?.items ?? [])].map((v) => String(v ?? ""))) {
        const ns = w.match(/\d+(?:\s*\/\s*\d+)?/g) ?? [];
        // (never a fraction the item denies: "1/3 nahi" is Cake A's point — its pieces are NOT thirds)
        if (ns.length === 1 && !/\b(?:nahi|nahin|not|na)\b/i.test(w)) { const f = frac(ns[0]); if (f) fs.push(f); }
      }
    }
    // (a two-scale line — no fraction of its own — takes the fractions her line states on its scales; nothing else does)
    if (!fs.length && Array.isArray(c.dens)) for (const t of String(line).match(/(?<![\d/])\d+\s*\/\s*\d+(?![\d/])/g) ?? []) { const f = frac(t); if (f && c.dens.includes(f[1])) fs.push(f); }
    // (director12 S4: a one-scale line that marks nothing is its scale's bar, unnamed — the card asks about it)
    if (!fs.length && c.template === "fraction-line@1" && !Array.isArray(c.dens) && Number.isInteger(c.den) && c.den >= 2 && c.den <= 12) fs.push({ at: [0, c.den] });
    const isWithheld = (a, b) => withheld.map(String).some((w) => { const m = /^(\d+)\/(\d+)$/.exec(w); return !!m && Math.abs(Number(m[1]) / Number(m[2]) - a / b) < 1e-9; });
    const seen = new Set(), bars = [];
    for (const f of fs) {
      const [a, b] = Array.isArray(f) ? f : f.at, key = `${a}/${b}`;
      if (seen.has(key)) continue;
      seen.add(key);
      // (director11 S1: an asked mark keeps its POSITION — its parts shaded up to it, the value "?" — c5-t01 drew "0 shaded = ?")
      bars.push(!Array.isArray(f) ? { parts: b, shade: a, label: "?" } : isWithheld(a, b) ? { parts: b, shade: 0, label: "?" } : { parts: b, shade: a, label: key });
    }
    // (… and a line's 0 and 1 stay: the bars of a 0-1 line are drawn with its ends)
    return bars.length >= 1 && bars.length <= 3 ? { template: "fraction-bars@1", bars, ...(c.template === "fraction-line@1" ? { ends: true } : {}) } : null;
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

// ───────────────────────────── director7: one board per segment of a turn ─────────────────────────────
/**
 * round 7 (main, director7 B1/S2: "1/3 ka mark hai" asked over the 1/8 | 1/4 | 1/2 board; one board per turn while a turn
 * describes two or three): a turn's speech in SEGMENTS, each with the board it describes — the remediation say (the ask's
 * own boardRef, from the start), then the then-card, a closure, a recap … Brain marks each later segment:
 * intent.segments [{ atChar, atClause?, boardRef, scriptBeat }] (intent.then = one segment, the director7 first form).
 * → [{ from, to, text, clause, boardRef, scriptBeat }] (≥ 2 pages) or null (one board, as before).
 */
export function segmentsOf(ask) {
  const text = String(ask?.line?.text ?? "");
  // (main, director7: Brain's interim intent.cardBoard { boardRef, scriptBeat, cardText, atClause }, if one still arrives,
  // is the say at 0 and the card where its text starts in her line)
  const cb = ask?.intent?.cardBoard, cbAt = cb?.boardRef && cb.cardText ? text.lastIndexOf(String(cb.cardText).trim()) : -1;
  const marks = Array.isArray(ask?.intent?.segments) ? ask.intent.segments : ask?.intent?.then ? [ask.intent.then]
    : cbAt > 0 ? [{ atChar: cbAt, atClause: cb.atClause, boardRef: cb.boardRef, scriptBeat: cb.scriptBeat }] : [];
  // (main 2026-11-08, App 3b: Brain's `ofCard` per page, page 0 on the intent, each later page on its segment)
  const flag = (v) => (typeof v === "boolean" ? { ofCard: v } : {});
  const cuts = marks.filter((m) => m?.boardRef && Number.isInteger(m.atChar) && m.atChar > 0 && m.atChar < text.length).sort((x, y) => x.atChar - y.atChar);
  if (!cuts.length || !ask?.intent?.boardRef) return null;
  const pages = [{ from: 0, boardRef: ask.intent.boardRef, scriptBeat: ask.intent.scriptBeat, ...flag(ask.intent.ofCard) }, ...cuts.map((m) => ({ from: m.atChar, boardRef: m.boardRef, scriptBeat: m.scriptBeat, atClause: m.atClause, ...flag(m.ofCard) }))];
  const out = [];
  for (let i = 0; i < pages.length; i++) {
    const to = i + 1 < pages.length ? pages[i + 1].from : text.length;
    const seg = text.slice(pages[i].from, to).trim();
    if (!seg) return null;
    // the voice's own clause numbering (server/voice/expressive/align.js: sentences, then clauses): a segment's first clause
    // is the number of clauses before it; Brain's atClause, when sent, wins
    const before = text.slice(0, pages[i].from).trim();
    const clause = Number.isInteger(pages[i].atClause) && pages[i].atClause >= 0 ? pages[i].atClause : before ? splitSentences(before).reduce((n, part) => n + voiceClausesOf(part).length, 0) : 0;
    out.push({ from: pages[i].from, to, text: seg, clause, boardRef: pages[i].boardRef, scriptBeat: pages[i].scriptBeat, ...flag(pages[i].ofCard) });
  }
  return out.length >= 2 ? out : null;
}
/** #44: the first spoken word of her line from character `from` (normalised as lineClock.normWord) and how many words
 *  come before it — the page lands on that word's onset when the voice sends word timings. */
export function firstWordOf(text, from) {
  const t = String(text ?? ""), i = Math.max(0, Math.min(t.length, Number(from) || 0));
  const norm = (w) => String(w).toLowerCase().normalize("NFKC").replace(/[^\p{L}\p{N}/]+/gu, "");
  const before = t.slice(0, i).split(/\s+/).map(norm).filter(Boolean).length;
  const w = t.slice(i).split(/\s+/).map(norm).find(Boolean);
  return w ? { word: w.slice(0, 24), wordIndex: before } : {};
}
/** (director7's first form, kept for its callers) → { say, then, clause, th } or null. */
export function thenSplit(ask) {
  const sg = ask?.intent?.then ? segmentsOf({ ...ask, intent: { ...ask.intent, segments: [ask.intent.then] } }) : null;
  return sg ? { say: sg[0].text, then: sg[1].text, clause: sg[1].clause, th: ask.intent.then } : null;
}
const TARGETED = new Set(["highlight", "erase", "move", "rotate", "scale", "follow", "sweep", "morph"]);
const DRAWN = new Set(["stroke", "line", "arrow", "rect", "circle", "ellipse", "polygon", "sector", "text", "label", "numwork"]);
/**
 * The board for such a turn: each page gated on its own segment, composed in order — a page is erased where the next one
 * starts (its estimated onset), the next drawn from there. The script's `switches` [{ clause, atMs }] let the player move
 * each later page onto its segment's real onset. → a board-first result ({ ok, script, screen (the last page), screens
 * [{ from, screen }], by, template, source }) or null (one board, as before).
 */
/** How many later pages a paged turn dropped because their own take failed (the page before them stayed up). */
let pagesDropped = 0, firstKept = 0, firstSame = 0, pagesStilled = 0;
/** (App's T55) first pages kept as the same board already up; pages drawn still because their motion ran past the switch. */
export const pageTimingCounts = () => ({ firstSame, stilled: pagesStilled });
/** How many paged turns kept the card's board on screen for a first page whose own take failed. */
export const firstPageKeptCount = () => firstKept;
export const pagesDroppedCount = () => pagesDropped;
/** A board ref's identity (template + params, keys in order): two refs that name the same figure compare equal. */
export function refKey(ref) {
  const canon = (v) => (Array.isArray(v) ? v.map(canon) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])])) : v);
  return ref?.template ? JSON.stringify({ t: ref.template, p: canon(ref.params ?? {}) }) : null;
}
export function pagesBoard(ask, { kit, redact = [], keep = null, keepRef = null } = {}) {
  try {
    let sg = segmentsOf(ask);
    if (!sg || !kit) return null;
    const id = String(ask?.intent?.intentId ?? "");
    const takes0 = sg.map((g, i) => {
      const beat = { ...(i ? {} : ask.intent.scriptBeat ?? {}), ...(g.scriptBeat ?? {}) };
      if (i && !beat.kind) beat.kind = "check";
      if (i && beat.kind === "check" && beat.ownBoard === undefined) beat.ownBoard = true;
      const intent = { ...ask.intent, intentId: i ? `${id}:p${i}` : id, boardRef: g.boardRef, scriptBeat: beat };
      delete intent.then; delete intent.segments; delete intent.cardBoard; if (i) delete intent.request;
      // (director14 S9: each page carries its own ofCard — the card part of a picture turn is the card's own page)
      if (typeof g.ofCard === "boolean") intent.ofCard = g.ofCard; else if (i) delete intent.ofCard;
      if (i && g.ofCard === true) intent.cardPage = true; else delete intent.cardPage;
      const a = { ...ask, intent, mode: i ? "fresh" : ask.mode, line: { ...(ask.line ?? {}), text: g.text } };
      if (!picks.has(String(intent.intentId))) preselect(a, { kit, redact });
      // (director13, Brain's P3: the second view's own page never brings the card back itself — the turn's next page is the card)
      return takePreselected(a, gateCtxFor(a, { kit, redact, prior: [] }), Date.now(), { cardBack: !(i === 0 && sg.length > 1) });
    });
    // (director9, Brain's replay of c5-t01 steady T21: a 3-word tail page failed W6 and took the whole turn down with it —
    // the verdict page's revealed 1/8 never reached the screen. A LATER page that fails is dropped: the page before it
    // stays up through its words. The first page failing still fails the turn: there is nothing to stand on)
    // (director10: 31 turns unpaged, each on its FIRST page — the close said over the answered card's own board, which is
    // the board already up. That page keeps the card's board AS IT IS (`keep`, the seam's page on screen, when it is this
    // page's board); only with no card board to keep does the turn fail)
    // (App's director10 replay, steady-c6 T55: page 0, "36 cm sahi nahi hai.", 1.67 s, REDREW the 6 cm square T53 had just
    // left on screen, its perimeter walk squeezed to nothing. A first page that draws the board already up — the same card,
    // nothing new written — is that board, kept still: no redraw)
    // (a kept page is shown complete at once: its end state, no motion replayed in 200 ms)
    const stillOf = (k) => ({ ...k, ops: k.ops.filter((o) => !isMotionOp(o)).map((o) => ({ ...o, startMs: 0, endMs: Math.min(Math.max(1, o.endMs - o.startMs), 200) })), durationMs: 200 });
    if (takes0.length > 1 && takes0[0]?.script && keep?.ops?.length && !!keepRef && refKey(sg[0].boardRef) === keepRef && samePage(takes0[0].script, keep)) {
      takes0[0] = { ...takes0[0], script: stillOf(keep), source: "kept", kept: true };
      firstSame++;
    }
    if (!takes0[0]?.script) {
      const p0 = picks.get(id), base = p0?.raw ?? p0?.script ?? null;
      // (director10 G1, replayed: the card's board on screen was drawn on ITS line, masked and labelled for that line, so it
      // is rarely the same page as this pick; it is the same card when the page on screen was drawn from this ref)
      const sameRef = !!keepRef && refKey(sg[0].boardRef) === keepRef;
      if (!keep?.ops?.length || !base || !(sameRef || samePage(base, keep) || shownBefore(base, { avoid: keep }))) return null;
      const still = stillOf(keep);
      takes0[0] = { ok: true, script: still, template: p0.template, source: "kept", by: "script", kept: true,
        screen: screenOf({ template: p0.template, facts: { ...(base.facts ?? p0.facts ?? {}), ...(p0.counts ? { counts: p0.counts } : {}) } }, keep.facts ?? p0.facts, keep) };
      firstKept++;
    }
    const kept = takes0.map((t, i) => (i === 0 || t?.script ? i : -1)).filter((i) => i >= 0);
    if (kept.length < takes0.length) pagesDropped += takes0.length - kept.length;
    const takes = kept.map((i) => takes0[i]);
    sg = kept.map((i) => sg[i]);
    const lastRef = refKey(sg.at(-1).boardRef), lastKind = sg.at(-1).scriptBeat?.kind ?? (sg.length > 1 ? "check" : ask?.intent?.scriptBeat?.kind ?? null);
    if (takes.length === 1) return { ...takes[0], screens: [{ from: 0, ...(takes[0].screen ?? {}) }], lastRef, lastKind };
    // (director13, Brain's P3: a picture turn pages its second view first, under its own line, then the card's own board —
    // the turn is flagged as the second view it opens with)
    const alt0 = takes[0].altView ? { altView: takes[0].altView } : {};
    // (director12 S6: a page on another board size — the catalogue's 677×423 beside a template's 400×300 — is scaled onto
    // the turn's largest board, centred, drawn still: before, the whole turn failed to join)
    const dims = (t) => t.script.board ?? WB_BOARD;
    const b0 = takes.map(dims).reduce((a, b) => (b.w * b.h > a.w * a.h ? b : a));
    for (const t of takes) { const b = dims(t); if (b.w !== b0.w || b.h !== b0.h) { t.script = pageOnBoard(t.script, b0); pagesRescaled++; } }
    const rename = (ops, pre) => { const m = new Map(ops.map((o) => [o.id, `${pre}${o.id}`.slice(0, 32)]));
      return ops.map((o) => ({ ...o, id: m.get(o.id), ...(TARGETED.has(o.op) && m.has(o.target) ? { target: m.get(o.target) } : {}) })); };
    // each page's start: the estimated onset of its segment (the line's own clock), never before the last one
    const starts = sg.map((g, i) => (i ? Math.max(800, speechMsOf(String(ask.line.text).slice(0, g.from))) : 0));
    for (let i = 1; i < starts.length; i++) starts[i] = Math.max(starts[i], starts[i - 1] + 600);
    const ops = [];
    takes.forEach((t, i) => {
      const at = starts[i], next = starts[i + 1];
      const pre = i ? `${"abcdefgh"[i]}.` : "a.";
      // (App, T55: a page whose drawing cannot finish before its switch loses its motion to the clamp — three of four
      // `follow` ops in 120 ms. It is drawn still instead, as takePreselected draws a refused split)
      // (the switch is HER onset on the client — lineClock moves the next page onto it — and a short page is spoken faster
      // than the estimate: T55's 5 words took 1.67 s against ~3 s. A page must fit a fast reading, ~330 ms a word)
      const words = String(sg[i].text ?? "").split(/\s+/).filter(Boolean).length;
      const due = next === undefined ? undefined : Math.min(next, at + Math.max(600, words * 330));
      const late = due !== undefined && t.script.ops.some((o) => o.endMs + at > due);
      const own = late && t.script.ops.some(isMotionOp) ? t.script.ops.filter((o) => !isMotionOp(o)) : t.script.ops;
      if (own !== t.script.ops) pagesStilled++;
      const page = rename(own, pre).map((o) => {
        const s0 = o.startMs + at, e0 = o.endMs + at;
        return next !== undefined ? { ...o, startMs: Math.min(s0, Math.max(at, next - 120)), endMs: Math.min(e0, next) } : { ...o, startMs: s0, endMs: e0 };
      });
      ops.push(...page);
      if (next !== undefined) ops.push(...page.filter((o) => DRAWN.has(o.op)).map((o, k) => ({ id: `${pre}x${k}`.slice(0, 32), op: "erase", target: o.id, startMs: next, endMs: next + 200 })));
    });
    if (ops.length > WB_LIMITS.maxOps) return null;
    const first = takes[0].script, last = takes.at(-1);
    const raw = { ...first, scriptId: `${first.scriptId ?? id}:pg`.slice(0, 64), ops, durationMs: Math.max(...ops.map((o) => o.endMs)) + 200,
      facts: last.script.facts ?? first.facts, switches: sg.slice(1).map((g, k) => ({ clause: g.clause, atMs: starts[k + 1], ...firstWordOf(ask?.line?.text, g.from), ...(typeof g.ofCard === "boolean" ? { ofCard: g.ofCard } : {}) })),
      ...(typeof sg[0].ofCard === "boolean" ? { ofCard: sg[0].ofCard } : {}) };
    delete raw.card;
    const n = normalizeScript(raw, { strict: false });
    if (!n.ok || !n.script?.switches?.length) return null;
    pageStats.drawn++;
    return { ok: true, script: n.script, gate: last.gate, usd: 0, ms: 0, source: "first", by: "script", template: last.template, syncMs: 0, ...alt0,
      screen: last.screen, screens: sg.map((g, i) => ({ from: g.from, ...takes[i].screen, ...(takes[i].altView ? { altView: takes[i].altView } : {}) })), lastRef, lastKind, lastPage: last.script };
  } catch { return null; }
}
/** (director7's first form) */
export const twoPageBoard = pagesBoard;
const pageStats = { drawn: 0 };
let pagesRescaled = 0;
/** director12 S6: a page drawn on another board size, scaled uniformly onto `board` (w, h) and centred, its motion dropped. */
export function pageOnBoard(script, board) {
  const b = script.board ?? WB_BOARD;
  const k = Math.min(board.w / b.w, board.h / b.h), dx = (board.w - b.w * k) / 2, dy = (board.h - b.h * k) / 2;
  const sc = scaleScript({ ...script, board: b, ops: script.ops.filter((o) => !isMotionOp(o)) }, k);
  return { ...sc, board: { ...b, w: board.w, h: board.h }, ops: sc.ops.map((o) => shiftOp(o, dx, dy)) };
}
// ───────────────────────────── dc-r7-held-board (director16, main's v6.8) ─────────────────────────────
/** The split board a picture ask is drawn on: the held board left, its second view right, each a 320-wide panel at 0.8 of its
 *  geometry, text tokens kept whole. Measured on the child route at 360 × 640 portrait: the stage box is height-bound (about
 *  202 × 180), so a 640 × 300 board is shown at the same scale as a single 400 × 300 board — both panels' words at the px a
 *  board's words have today; at 360 × 800 and wider the scale only grows. */
export const SPLIT_BOARD = Object.freeze({ w: 640, h: 300, panel: 320 });
/** A board ref drawn as authored (no line, no gate): → { script, template, facts } or null. */
function drawRef(ref, { band = "B3", lang = null } = {}) {
  try {
    const rr = resolveBoardRef(ref, {});
    if (!rr.ok) return null;
    const x = expand(rr.call, { band, lang });
    return x?.ok ? { script: fitLegible(x.script), template: rr.call.template, facts: x.script.facts ?? x.facts } : null;
  } catch { return null; }
}
/** The second view of the held board for a picture ask: → { call, view, line } (her picture line, built from what the view
 *  draws: never "yahi numbers" over a view with none), or null when the board has no second view. */
export function heldAltOf(ask) {
  try {
    const h = ask?.intent?.held;
    if (!h?.board) return null;
    const ac0 = altCall(h.board, { line: "", withheld: [], keys: liveKeys(ask, "") });
    if (!ac0) return null;
    const { view, ...call } = ac0;
    return { call, view: ALT_VIEWS.has(view) ? view : "parts", line: altSay(ac0) };
  } catch { return null; }
}
const still = (sc) => ({ ...sc, ops: sc.ops.filter((o) => !isMotionOp(o)).map((o) => ({ ...o, startMs: 0, endMs: Math.min(Math.max(1, o.endMs - o.startMs), 200) })), durationMs: 200 });
const renameOps = (ops, pre) => { const m = new Map(ops.map((o) => [o.id, `${pre}${o.id}`.slice(0, 32)]));
  return ops.map((o) => ({ ...o, id: m.get(o.id), ...(TARGETED.has(o.op) && m.has(o.target) ? { target: m.get(o.target) } : {}) })); };
/** The held board and its second view side by side on one SPLIT_BOARD: the left panel as it stands (already drawn: still),
 *  the view drawn in after it. → the normalized script, or null (a panel the lint refuses: the held board is then kept alone). */
export function splitBoard(left, right, { leftStill = true } = {}) {
  try {
    const P = { w: SPLIT_BOARD.panel, h: SPLIT_BOARD.h };
    // (measured on the child route at 360 × 640: a board alone is zoomed to its words by the player's frame, a split spans the
    // whole 640 — its small words came out at 12 px against 16 px alone. In a split, small words are written one size up)
    const up = (sc) => ({ ...sc, ops: sc.ops.map((o) => (o.op === "text" && (o.size ?? "m") === "s" ? { ...o, size: "m" } : o)) });
    const L0 = pageOnBoard(up(leftStill ? still(left) : left), P), R0 = pageOnBoard(up(right), P);
    const lops = renameOps(L0.ops, "l."), lEnd = Math.max(0, ...lops.map((o) => o.endMs));
    const at = leftStill ? 200 : lEnd + 150;
    const rops = renameOps(R0.ops, "r.").map((o) => ({ ...shiftOp(o, SPLIT_BOARD.panel, 0), startMs: o.startMs + at, endMs: o.endMs + at }));
    const divider = { id: "split", op: "line", from: [SPLIT_BOARD.panel, 20], to: [SPLIT_BOARD.panel, SPLIT_BOARD.h - 20], ink: "soft", weight: 1, startMs: at, endMs: at + 150 };
    const ops = [...lops, divider, ...rops];
    if (ops.length > WB_LIMITS.maxOps) return null;
    const raw = { ...left, scriptId: `${left.scriptId ?? "wb"}:split`.slice(0, 64), board: { ...(left.board ?? WB_BOARD), w: SPLIT_BOARD.w, h: SPLIT_BOARD.h }, ops,
      durationMs: Math.max(...ops.map((o) => o.endMs)) + 200, facts: right.facts ?? left.facts };
    delete raw.switches;
    const n = normalizeScript(raw, { strict: false });
    if (!n.ok) return null;
    // (no word clipped or crossing into the other panel: every op inside the board, inside its own panel; no words touching)
    if (lintScript(n.script).some((i) => ["inside_board", "text_overlap", "row_labels_touch"].includes(i.check))) return null;
    const byId = new Map(n.script.ops.map((o) => [o.id, o]));
    const crosses = n.script.ops.some((o) => {
      if (o.op === "erase" || o.op === "highlight" || isMotionOp(o) || o.id === "split") return false;
      const b = opGeometry(o, byId).box, left = String(o.id).startsWith("l.");
      return left ? b.x + b.w > SPLIT_BOARD.panel + 2 : b.x < SPLIT_BOARD.panel - 2;
    });
    return crosses ? null : n.script;
  } catch { return null; }
}
/** Pages joined on her line's clock: page i from its character `from` (estimated onset), each page erased at the next. */
function joinPages(pages, text) {
  const b0 = pages.map((g) => g.script.board ?? WB_BOARD).reduce((a, b) => (b.w * b.h > a.w * a.h ? b : a));
  const sc = pages.map((g) => ((g.script.board ?? WB_BOARD).w === b0.w && (g.script.board ?? WB_BOARD).h === b0.h ? g.script : pageOnBoard(g.script, b0)));
  const starts = pages.map((g, i) => (i ? Math.max(800, speechMsOf(String(text).slice(0, g.from))) : 0));
  const ops = [];
  sc.forEach((s, i) => {
    const at = starts[i], next = starts[i + 1], pre = `${"abcdefgh"[i]}.`;
    const page = renameOps(s.ops, pre).map((o) => (next !== undefined ? { ...o, startMs: Math.min(o.startMs + at, Math.max(at, next - 120)), endMs: Math.min(o.endMs + at, next) } : { ...o, startMs: o.startMs + at, endMs: o.endMs + at }));
    ops.push(...page);
    if (next !== undefined) ops.push(...page.filter((o) => DRAWN.has(o.op)).map((o, k) => ({ id: `${pre}x${k}`.slice(0, 32), op: "erase", target: o.id, startMs: next, endMs: next + 200 })));
  });
  if (ops.length > WB_LIMITS.maxOps) return null;
  const raw = { ...sc[0], scriptId: `${sc[0].scriptId ?? "wb"}:held`.slice(0, 64), board: { ...(sc[0].board ?? WB_BOARD), w: b0.w, h: b0.h }, ops, durationMs: Math.max(...ops.map((o) => o.endMs)) + 200,
    facts: sc.at(-1).facts ?? sc[0].facts,
    switches: pages.slice(1).map((g, k) => ({ clause: g.clause ?? 0, atMs: starts[k + 1], ...firstWordOf(text, g.from) })) };
  const n = normalizeScript(raw, { strict: false });
  return n.ok ? n.script : null;
}
let heldCounts = { drawn: 0, kept: 0, switched: 0, split: 0, splitRefused: 0 };
/** dc-r7-held-board: what the held-board path did (drawn new, kept still, switched once, split for a picture). */
export const heldStats = () => ({ ...heldCounts });
/**
 * dc-r7-held-board (main's v6.8, Brain + Studio): a script turn's board is the board Brain HOLDS for the unit — the open card's
 * board, or the just-answered card's answer-state board while its close is spoken — drawn as sent, from its ref, with no
 * line-driven pick and no gate on her words. `intent.held` = { board, unit, switchTo?: { board, unit, atChar, atClause? } }:
 * at most ONE switch, where her words begin the next unit's first spoken part. The held board already up (by ref) is KEPT
 * (no redraw: a Hindi, clarify, aside or "sawaal kya hai" turn holds the board). A picture ask draws the held board's second
 * view BESIDE it (splitBoard), never instead of it; her picture line is heldAltOf's, built from what the view draws.
 * → { ok, script, kept?, split?, panels?, altView?, altLine?, screen, screens, lastRef, lastPage, held } or null.
 */
export function heldBoard(ask, { keepRef = null, keepPage = null } = {}) {
  try {
    const h = ask?.intent?.held;
    if (!h?.board?.template) return null;
    const band = ask?.intent?.style?.band ?? "B3", lang = ask?.intent?.style?.lang ?? null;
    const text = String(ask?.line?.text ?? "");
    const upSplit = keepPage?.board?.w === SPLIT_BOARD.w && keepPage?.board?.h === SPLIT_BOARD.h;
    const same = !!keepRef && refKey(h.board) === keepRef && !!keepPage?.ops?.length;
    const request = ask?.intent?.request ?? null;
    const pic = request && request.kind !== "example" ? heldAltOf(ask) : null;
    const sw = h.switchTo?.board?.template && Number.isInteger(h.switchTo.atChar) && h.switchTo.atChar > 0 && h.switchTo.atChar < text.length ? h.switchTo : null;
    // the held board: the page up when it is this board (its split, too, when no new picture is asked), else drawn new
    const base = same && !(pic && upSplit) ? { script: keepPage, template: h.board.template, facts: keepPage.facts ?? null, kept: true } : drawRef(h.board, { band, lang });
    if (!base?.script) return null;
    let page0 = base.script, altView = null, altLine = null, panels = null, split = false, altFacts = null;
    if (pic) {
      const ax = expand(pic.call, { band, lang });
      const sp = ax?.ok ? splitBoard(upSplit && base.kept ? drawRef(h.board, { band, lang })?.script ?? base.script : base.script, fitLegible(ax.script), { leftStill: !!base.kept || same }) : null;
      if (sp) { page0 = sp; split = true; altView = pic.view; altLine = pic.line; altFacts = ax.script.facts; panels = [upSplit ? drawRef(h.board, { band, lang })?.script ?? base.script : base.script, fitLegible(ax.script)]; heldCounts.split++; }
      else heldCounts.splitRefused++;
    }
    const screen0 = screenOf({ template: base.template, facts: base.facts ?? {} }, base.facts ?? page0.facts, base.script);
    const screenA = split ? screenOf({ template: pic.call.template, facts: altFacts ?? {} }, altFacts, panels[1]) : null;
    if (!sw && base.kept && !split) { heldCounts.kept++;
      // (a held board stands: shown at its end state at once, never drawn again)
      return { ok: true, kept: true, script: still(keepPage), source: "kept", by: "script", template: base.template, facts: base.facts ?? keepPage.facts ?? null, screen: screen0, screens: [{ from: 0, ...screen0 }], lastRef: keepRef, lastPage: keepPage, held: { unit: h.unit ?? null, changed: false } }; }
    let script = page0, screens = [{ from: 0, ...screen0, ...(screenA ? { beside: { ...screenA, altView } } : {}) }], lastRef = refKey(h.board), lastPage = page0, template = base.template;
    if (sw) {
      const nx = drawRef(sw.board, { band, lang });
      if (nx?.script) {
        const p0 = base.kept && !split ? still(page0) : page0;
        const before = text.slice(0, sw.atChar).trim();
        const clause = Number.isInteger(sw.atClause) ? sw.atClause : before ? splitSentences(before).reduce((n, part) => n + voiceClausesOf(part).length, 0) : 0;
        const joined = joinPages([{ script: p0, from: 0 }, { script: nx.script, from: sw.atChar, clause }], text);
        if (joined) {
          script = joined; lastRef = refKey(sw.board); lastPage = nx.script; template = nx.template; heldCounts.switched++;
          screens = [...screens, { from: sw.atChar, ...screenOf({ template: nx.template, facts: nx.facts ?? {} }, nx.facts, nx.script) }];
        }
      }
    }
    if (!base.kept) heldCounts.drawn++;
    return { ok: true, script, source: "held", by: "script", template, facts: base.facts ?? null, ...(split ? { split: true, panels, altView, altLine, altFacts } : {}), screen: screens.at(-1), screens,
      lastRef, lastPage, held: { unit: lastRef === refKey(h.board) ? h.unit ?? null : sw?.unit ?? null, changed: lastRef !== keepRef } };
  } catch { return null; }
}

/** director12 S6: pages scaled onto the turn's board so they could join. */
export const pagesRescaledCount = () => pagesRescaled;
export const twoPageStats = () => ({ ...pageStats });
