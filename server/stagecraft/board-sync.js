// Board sync (ship5 p4-content): the live whiteboard on her clock, and never an empty board slot.
//
// Measured before this file (production 7ce6033, w2f-studio-gate, 2026-10-05): the board reached the child p50 4.66 s /
// p90 5.70 s after her line was ready, against a 1.5 s bar, because the planner (taxila-gpt6-luna, p50 ~3 s / p90 ~5.9 s
// on the bench) only started once her guarded line existed. And when it failed with no template rung to fall back to, the
// slot failed while her line already said "screen par flow dekhiye" (owner-5, animation 2/2 on prod).
//
// The ladder (each rung re-gated by code against HER REAL LINE with the full whiteboard gate W0-W9: the same check the
// w2f acceptance test runs on every board the client receives):
//   1. speculative: the moment the kernel accepts the ask (before her reply is written) the planner starts on the move's
//      kit content, the text her line is written from. If it is in by the time her line is, it is re-timed to her line's
//      spoken length and re-gated; a pass is shown at once.
//   2. the line planner (today's path), raced against a sync deadline (BOARD_SYNC_MS, default 1900 ms after the ask: her
//      audio starts ~700 ms after the reply, so the lateness stays ≤ ~1.2 s).
//   3. at the deadline: a late speculative board that passes, else the CODE board — the explain rung's own template for
//      this kit (server/forge/explainer/lesson.js explainerFor: code pick, library, terms; open-item guarded), re-timed and
//      gated against her line. Instant, kit-true.
//   4. no code board passes: wait for the line planner up to its budget (the pre-ship5 behaviour), then a late speculative
//      board; then nothing (the caller's template-rung fallback, else voice).
// Kill switch TAXILA_BOARD_SYNC=0: plan() is exactly deps.planWhiteboard (the old path). Never throws.
import { answersRequest, samePage, shownBefore, freeAsked, subjectWords, numberLineBoard, clockBoard, askedNumbers, faceDrawing } from "../studio/request.js";
import { gateWhiteboard, withheldValues, numbersIn, partitionCounts } from "../studio/qa/whiteboard.js";
import { speechMsOf, redactLine, WB_BOARD, sectorsForCutCircles } from "../studio/plan.js";
import { explainerFor } from "../forge/explainer/lesson.js";
import { catalogueEntry } from "./catalogue.js";
import { fitLegible } from "./board-legible.js";
import { takePreselected } from "./board-first.js";
import { claimsBoard } from "./claims-board.js";

// 1900 ms after the ask: her audio starts ~700 ms after the reply (text lane prewarm), so even a code board shown at the
// deadline is ≤ ~1.2 s late (the bar is 1.5 s p90), while the speculative board (started ~1.5 s earlier, at the kernel)
// gets the longest lead it can have
export const BOARD_SYNC_MS = () => Math.max(300, Number(process.env.TAXILA_BOARD_SYNC_MS) || 1900);
/** The sync deadline for a board the child asked for, when a code board is already in hand (ms). */
export const REQUESTED_SYNC_MS = 600;
export const boardSyncOn = (env = process.env) => env.TAXILA_BOARD_SYNC !== "0";
const SPEC_TTL_MS = 60_000;
const specs = new Map();         // intentId → { at, promise, result, contentText }

/** The move's kit content as one line (what her reply is written from); facts rows and empties dropped. */
export function contentLineOf(ask) {
  return (ask?.kit?.content ?? []).map(String).filter((x) => x && !/^on screen now/i.test(x)).join(" ").replace(/\s+/g, " ").trim().slice(0, 600);
}
/**
 * The best prediction of her line, from the KIT only (her line does not exist yet): the move's content lines; else the item
 * she is on; else, on a worked-example beat, the kit's worked example; else the skill's expectations; else the values of
 * what is on screen. Never the child's words. (Measured 2026-10-06: on explain moves with the template rung mounted, the
 * move's content is only the rung's facts row, so content alone left the speculative board unstarted.)
 */
export function predictedLineOf(ask, kit) {
  const c = contentLineOf(ask);
  if (c.length >= 12) return c;
  const item = ask?.kit?.item;
  if (item?.prompt_en) return String(item.prompt_en).slice(0, 600);
  const we = kit?.workedExample;
  if (we && /worked|example/.test(String(ask?.intent?.beat ?? ""))) return [we.problem, ...(we.steps ?? []).slice(0, 3)].filter(Boolean).join(" ").slice(0, 600);
  const exp = (kit?.expectations ?? []).slice(0, 2).join(" ");
  if (exp.length >= 12) return exp.slice(0, 600);
  const facts = (ask?.kit?.content ?? []).map(String).find((x) => /^on screen now/i.test(x));
  return facts ? facts.replace(/^on screen now[^:]*:\s*/i, "").replace(/\s·\s/g, ", ").slice(0, 600) : "";
}

/**
 * Start the speculative board for an accepted ask, BEFORE her line exists (turn.js, right after the kernel). Idempotent per
 * intentId. `ask` is whiteboardIntentOf(...) with any line; the content line replaces it.
 */
export function prepare(ask, { kit, prev, redact = [], planWhiteboard, budgetMs = 7000, now = Date.now() } = {}) {
  try {
    if (!boardSyncOn() || !planWhiteboard) return false;
    const id = String(ask?.intent?.intentId ?? "");
    if (!id || specs.has(id)) return false;
    const text = predictedLineOf(ask, kit);
    if (text.length < 12) return false;
    for (const [k, v] of specs) if (now - v.at > SPEC_TTL_MS) specs.delete(k);
    const e = { at: now, result: null, contentText: text, promise: null };
    e.promise = Promise.resolve()
      .then(() => planWhiteboard({ ...ask, line: { ...(ask.line ?? {}), text } }, { kit, prev, redact, budgetMs }))
      .then((r) => { e.result = r ?? null; return e.result; }, () => { e.result = { ok: false }; return e.result; });
    specs.set(id, e);
    return true;
  } catch { return false; }
}
export const _specs = specs;

/** The whiteboard gate context for her real line (mirrors plan.js planWhiteboard's own gate call). */
export function gateCtxFor(ask, { kit, redact = [], prior = [] } = {}) {
  const spoken = String(ask?.line?.text ?? "");
  const text = redactLine(spoken, redact);
  const content = (ask?.kit?.content ?? []).map(String).slice(0, 8);
  const itemText = ask?.kit?.item ? [ask.kit.item.prompt_en, ask.kit.item.prompt_hi].filter(Boolean) : [];
  const kitForGate = { ...(kit ?? {}), expectations: [...(kit?.expectations ?? []), ...content, ...itemText] };
  const withhold0 = withheldValues({ items: [...(kit?.items ?? []), ...(ask?.kit?.item && !(kit?.items ?? []).some((i) => i.id === ask.kit.item.id) ? [ask.kit.item] : [])] },
    { itemId: ask?.kit?.item?.id, line: text });
  // round 5 (stream 2): the numbers the child asked to see are not withheld (the open question's own key still is)
  const request = ask?.intent?.request ?? null;
  const withhold = freeAsked(withhold0, request, ask?.kit?.item?.id ? (kit?.items ?? []).find((i) => i.id === ask.kit.item.id) ?? ask.kit.item : null);
  if (request?.subject) kitForGate.expectations.push(request.subject, ...subjectWords(request.subject));
  if (request?.said?.length) kitForGate.expectations.push(...request.said);
  return { reply: text, kit: kitForGate, band: ask?.intent?.style?.band ?? "B3", speechMs: speechMsOf(spoken), banned: redact, prior, withhold,
    ...(request ? { extraNumbers: askedNumbers(request), face: faceDrawing(request), asked: request.kind !== "number_line" && !faceDrawing(request) } : {}) };
}

/** Scale a script's op times to a new spoken length (k clamped 0.5-2), first op no later than 800 ms. Shape only. */
export function retime(script, fromMs, toMs) {
  if (!script?.ops?.length || !(fromMs > 0) || !(toMs > 0)) return script;
  const k = Math.max(0.5, Math.min(2, toMs / fromMs));
  const ops = script.ops.map((o) => ({ ...o, startMs: Math.round(o.startMs * k), endMs: Math.max(Math.round(o.startMs * k) + 120, Math.round(o.endMs * k)) }));
  const first = Math.min(...ops.map((o) => o.startMs));
  const shift = first > 800 ? first - 800 : 0;
  const shifted = shift ? ops.map((o) => ({ ...o, startMs: o.startMs - shift, endMs: o.endMs - shift })) : ops;
  return { ...script, ops: shifted, durationMs: Math.max(...shifted.map((o) => o.endMs)) + 200 };
}

/**
 * A code-drawn round whole cut by diameters becomes N exact sectors when N is a count HER line gives (plan.js
 * sectorsForCutCircles, the W2-F fixer's own shape repair: W8 refuses a circle cut by lines because its parts cannot be
 * checked equal). Shape only, never truth: N must be her number. The template rungs draw a roti this way.
 */
export function withSectors(script, lineText) {
  if (!script?.ops?.length) return script;
  const counts = partitionCounts(String(lineText ?? ""));
  if (!counts.size) return script;
  const ops = sectorsForCutCircles(script.ops, counts, []);
  return ops === script.ops ? script : { ...script, ops };
}
/**
 * r12 RCA failure 7 (owner lesson a95d2ff1, board pages 3-5: "those examples were drawn above the previous content"). The
 * client draws EVERY op since the last fresh page under a "continue" script (src/modules/whiteboard/StudioWhiteboard.tsx
 * priorFor/remember). A continue script whose new ops land on those earlier ops (a "?" written over a "4", a staircase
 * across a table) is drawn fresh instead; one that builds beside them, targets them or erases first stays "continue".
 * Boxes are coarse (text by its length and size). PURE.
 */
const TEXT_H = { s: 14, m: 20, l: 28, xl: 36 };
export function opBox(o) {
  const pts = [];
  if (o?.op === "text" && Array.isArray(o.at)) { const h = TEXT_H[o.size] ?? 20, w = String(o.text ?? "").length * h * 0.55; pts.push([o.at[0] - w / 2, o.at[1] - h], [o.at[0] + w / 2, o.at[1] + h * 0.3]); }
  else {
    for (const k of ["from", "to", "at", "c"]) if (Array.isArray(o?.[k])) pts.push(o[k]);
    if (Array.isArray(o?.points)) pts.push(...o.points);
    if (o?.op === "rect" && Array.isArray(o.at)) pts.push([o.at[0] + (Number(o.w) || 0), o.at[1] + (Number(o.h) || 0)]);
    if (o?.op === "circle" && Array.isArray(o.c)) pts.push([o.c[0] - (o.r ?? 0), o.c[1] - (o.r ?? 0)], [o.c[0] + (o.r ?? 0), o.c[1] + (o.r ?? 0)]);
  }
  if (!pts.length) return null;
  const xs = pts.map((p) => Number(p[0])), ys = pts.map((p) => Number(p[1]));
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}
const boxesMeet = (a, b) => !!a && !!b && a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
/** "continue" or "fresh" for a script meant to continue the board whose ops (since the last fresh page) are `under`. */
export function boardModeFor(script, under = []) {
  if (script?.mode !== "continue") return "fresh";
  const ops = script.ops ?? [];
  if (!under.length || ops.some((o) => o.op === "erase")) return "continue";
  const earlier = under.filter((o) => o.op !== "erase" && o.op !== "highlight").map(opBox).filter(Boolean);
  const lands = ops.some((o) => o.op !== "highlight" && !o.target && earlier.some((b) => boxesMeet(opBox(o), b)));
  return lands ? "fresh" : "continue";
}

/** Re-gate a candidate script against her real line (and its stage). → { ok, script, gate } */
export function regate(script, ask, ctx) {
  if (!script?.ops?.length) return { ok: false, script: null, gate: null };
  const raw = { ...script, scriptId: ask?.intent?.intentId ?? script.scriptId, line: { lessonId: ask?.line?.lessonId ?? "", ...(ask?.line?.teacherReplySeq != null ? { teacherReplySeq: ask.line.teacherReplySeq } : {}) },
    anchor: "line_audio_start", mode: ask?.mode === "continue" ? "continue" : "fresh" };
  delete raw.facts;
  let g = gateWhiteboard(raw, ctx);
  // round 4 content: a board refused ONLY because it writes the answer to her question (W9) keeps its picture with that
  // answer written as "?" (the question stays open), re-gated in full. Measured: 4 of 6 boards refused on a local
  // production round3-forge run were W9-only refusals, each leaving the slot empty (2026-10-10).
  for (let k = 0; k < 3 && !g.pass; k++) {
    const failing = g.checks.filter((c) => !c.pass);
    // (W18, her own question's answer, is masked the same way: its detail is the number, written as a reveal of every op)
    if (!failing.length || failing.some((c) => c.id !== "W9.no_reveal" && c.id !== "W18.her_answer_unsaid")) break;
    const reveals = failing.flatMap((c) => (c.id === "W9.no_reveal" ? c.detail ?? [] : (c.detail ?? []).flatMap((n) => (g.script ?? raw).ops.map((o) => `${o.id}: ${n} = answer ${n}`))));
    const masked = maskReveals(g.script ?? raw, reveals);
    if (!masked) break;
    g = gateWhiteboard({ ...masked, facts: undefined }, ctx);
  }
  return g.pass ? { ok: true, script: { ...g.script, facts: g.facts }, gate: g } : { ok: false, script: null, gate: g };
}

/**
 * The script with every W9 reveal written as "?": "o7: 12 = answer 12" → that op's token; "o3: marks 3/4 on o2" → the
 * marker dropped; "word: scale" → the word replaced. null when nothing could be masked.
 */
export function maskReveals(script, reveals) {
  if (!script?.ops?.length || !Array.isArray(reveals) || !reveals.length) return null;
  const esc = (w) => String(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let ops = script.ops.map((o) => ({ ...o }));
  let changed = false;
  for (const r of reveals.map(String)) {
    const word = r.match(/^word: (.+)$/);
    if (word) {
      const src = `(^|[^\\p{L}\\p{M}])${esc(word[1])}($|[^\\p{L}\\p{M}])`;
      for (const o of ops) if ((o.op === "text" || o.op === "label") && new RegExp(src, "iu").test(String(o.text))) { o.text = String(o.text).replace(new RegExp(src, "giu"), "$1?$2"); changed = true; }
      continue;
    }
    const mark = r.match(/^([^:]+): marks /);
    if (mark) { const before = ops.length; ops = ops.filter((o) => o.id !== mark[1]); changed ||= ops.length < before; continue; }
    const tok = r.match(/^([^:]+): (\S+) = answer /);
    if (!tok) continue;
    const o = ops.find((x) => x.id === tok[1]);
    if (!o) continue;
    const src = `(^|[^\\d/.])${esc(tok[2])}($|[^\\d/.])`;
    if ((o.op === "text" || o.op === "label") && new RegExp(src).test(String(o.text))) { o.text = String(o.text).replace(new RegExp(src, "g"), "$1?$2"); changed = true; }
    else if (o.op === "numwork" && o.layout === "fraction" && /^\d+\/\d+$/.test(tok[2]) && Array.isArray(o.rows) && String(o.rows?.[0]?.[0]) === tok[2].split("/")[0] && String(o.rows?.[1]?.[0]) === tok[2].split("/")[1]) {
      // a stacked fraction a over b: its top written "?" (the whole stays, so the question is still what she asked)
      o.rows = [["?"], ...o.rows.slice(1)];
      changed = true;
    }
    else if (o.op === "numwork" && Array.isArray(o.rows)) {
      const before = JSON.stringify(o.rows);
      o.rows = o.rows.map((row) => row.map((c) => (String(c) === tok[2] || new RegExp(src).test(String(c)) ? "?" : c)));
      changed ||= JSON.stringify(o.rows) !== before;
    }
  }
  return changed ? { ...script, ops } : null;
}

/** The speculative board for this ask, if it landed and passes against her real line. */
/** Why no speculative board was used (telemetry codes only): none | pending | failed | rejected. */
export function specState(ask) {
  const e = specs.get(String(ask?.intent?.intentId ?? ""));
  if (!e) return "none";
  if (!e.result) return "pending";
  if (!e.result.ok || !e.result.script) return "failed";
  return "rejected";
}
export function takeSpec(ask, ctx) {
  const id = String(ask?.intent?.intentId ?? "");
  const own = specs.get(id);
  // this turn's own speculative board first; then (a fresh board only) another board this lesson planned from the same kit
  // text that landed unused in the last minute (measured 2026-10-06: luna lands a speculative board in 3.9-5.7 s, so it is
  // often in for the NEXT explanation line rather than its own)
  const lesson = id.split(":wb:")[0];
  const others = ask?.mode === "continue" ? [] : [...specs.entries()].filter(([k, v]) => k !== id && k.startsWith(`${lesson}:wb:`) && !v.used && v.result?.ok && Date.now() - v.at < SPEC_TTL_MS).map(([, v]) => v).reverse();
  for (const e of [own, ...others]) {
    if (!e?.result?.ok || !e.result.script || e.used) continue;
    const s = retime(e.result.script, speechMsOf(e.contentText), ctx.speechMs);
    const r = regate(s, ask, ctx);
    if (r.ok) { e.used = true; return { ...r, usd: Number(e.result.usd) || 0, reused: e !== own }; }
  }
  return null;
}

/** The code board (the kit's own explain rung), re-timed to her line and gated against it, or null. */
export function codeBoard(ask0, { kit, lessonId, band = "B3" } = {}, ctx0) {
  // round 4 content: every code rung is a whole picture: drawn FRESH (it replaces the board), never laid over the previous
  // board's ops. Measured (owner-5, local production build, 2026-10-10): a flow claims board her "continue" line needed was
  // refused for overlapping the old board's words, and the slot failed while she pointed at the screen.
  const ask = ask0?.mode === "continue" ? { ...ask0, mode: "fresh" } : ask0;
  const ctx = ctx0?.prior?.length ? { ...ctx0, prior: [] } : ctx0;
  try {
    // 0. round 4 content: her line states what is on the screen ("5 barabar parts; 3 shaded", "3 groups, 5 in each"): the
    //    board that draws exactly those claims (claims-board.js), gated against her line like every other board
    const claims = claimsBoard(ask, ctx, { band, lessonId, retime, regate, withSectors, board: WB_BOARD });
    if (claims) return claims;
    if (!kit) return null;
    // 1. the kit's explain rung (code pick from her line's own values, else the item / worked example; library; terms)
    const item = ask?.kit?.item?.id ? (kit.items ?? []).find((i) => i.id === ask.kit.item.id) ?? null : null;
    for (const t of [{ text: ask?.line?.text }, {}]) {
      const x = explainerFor({ lessonId, kit, item, openItem: item, band, ...t });
      if (!x?.params?.script) continue;
      const s = withSectors(retime(x.params.script, Math.max(800, Number(x.params.script.durationMs) || 0), ctx.speechMs), ctx.reply);
      const r = regate({ ...s, board: { ...WB_BOARD, ...(s.board ?? {}) } }, ask, ctx);
      if (r.ok) return { ...r, template: x.template, by: x.by };
    }
    // 2. the topic's authored catalogue boards (data/studio-catalogue: one per line of its checked explainer, kit-grounded,
    //    strict-shape and lint clean): the first that, re-timed, passes the gate against HER line
    const cat = catalogueEntry(kit.topicId ?? ask?.kit?.topicId);
    // round 2 content: the authored boards are 800 x 500 and 95.8% fail W1 at the phone tray as drawn: made legible first
    for (const b0 of cat?.boards ?? []) {
      const b = { ...b0, script: fitLegible(b0.script) };
      const s = withSectors(retime(b.script, Math.max(800, Number(b.script.durationMs) || 0), ctx.speechMs), ctx.reply);
      const r = regate(s, ask, ctx);
      if (r.ok) return { ...r, template: `catalogue:${b.line}`, by: "catalogue" };
    }
  } catch { /* the code board is a floor, never a failure */ }
  return null;
}

/** The caller's template rung (the explain rung's script the live board replaces), re-timed and gated, or null. */
export function templateBoard(ask, script, ctx) {
  if (!script?.ops?.length) return null;
  const s = withSectors(retime(script, Math.max(800, Number(script.durationMs) || 0), ctx.speechMs), ctx.reply);
  const r = regate({ ...s, board: { ...WB_BOARD, ...(s.board ?? {}) } }, ask, ctx);
  return r.ok ? r : null;
}
/** A template shown as the LAST rung (the line plan failed): re-timed to her line so it draws while she speaks (W6). */
export function retimeToLine(script, lineText) {
  if (!script?.ops?.length) return script;
  return withSectors(retime(script, Math.max(800, Number(script.durationMs) || 0), speechMsOf(String(lineText ?? ""))), redactLine(String(lineText ?? "")));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const settle = (p) => p.then((v) => ({ done: true, v }), () => ({ done: true, v: null }));

/**
 * The board for an ask, by the ladder above. Same result shape as plan.js planWhiteboard, plus `source` ("spec" | "line" |
 * "code") and `syncMs` (ask → board). Never throws.
 * @param {any} ask @param {{ kit?: any, prev?: any, redact?: string[], budgetMs?: number, planWhiteboard: Function, lessonId?: string }} o
 */
export async function plan(ask, o) {
  const t0 = Date.now();
  const startLine = () => settle(Promise.resolve().then(() => o.planWhiteboard(ask, { kit: o.kit, prev: o.prev, redact: o.redact, budgetMs: o.budgetMs, avoid: o.avoid, seen: o.seen })));
  if (!boardSyncOn()) return (await startLine()).v ?? { ok: false, script: null, usd: 0, why: "planner_error" };
  const prior = ask?.mode === "continue" ? (o.prev?.ops ?? []).filter((x) => x.op !== "erase") : [];
  const ctx = gateCtxFor(ask, { kit: o.kit, redact: o.redact, prior });
  const tag = (r, source, extra = {}) => ({ ok: true, script: r.script, gate: r.gate, usd: extra.usd ?? 0, ms: Date.now() - t0, source, syncMs: Date.now() - t0, ...extra });
  // round 5 (stream 2, RCA-1): a ready-made board (speculative, code, template) is drawn only when it shows what the child
  // asked for and is not the page already on the board; the line plan is told the request (plan.js) and is held to the same
  // "never the same page again"
  const request = ask?.intent?.request ?? null;
  const fits = (r) => !!r?.script && answersRequest(r.script, request) && !shownBefore(r.script, { avoid: o.avoid, seen: o.seen });
  const takeSpecFit = (a, c) => { const r = takeSpec(a, c); return r && fits(r) ? r : null; };
  // 0. round 2 content, board-first: the board chosen at kernel time (its facts were in her line's content), re-gated on her
  // real line with the full gate (the seam takes it synchronously first; this is the same rung for any other caller)
  const first = takePreselected(ask, ctx, t0);
  if (first) return first;
  // 1. the speculative board, already in: no line plan is paid for
  const early = takeSpecFit(ask, ctx);
  if (early) return tag(early, "spec", { usd: early.usd });
  const lineP = startLine();
  // the code board is computed now (pure, ~ms) so the deadline never waits on it
  // round 5: a number line the child asked for, with their numbers, is drawn by code (request.js numberLineBoard), gated
  // like any board; it is the code rung for that ask (the kit's own board never answers "number line pe 1/4 dikhao")
  // ... and a clock asked for ("ghadi draw karo") is drawn by code too (request.js clockBoard)
  // QA pass 12 D35 (prod b8fb4ee2, TEST f10fcd57: "number line pe dikhao" named no numbers, so no code line; the line plan
  // failed ~1 in 2 and the slot went "failed" under her "… dikhaiye"): with none asked, the numbers HER line says are drawn
  const lineNumbers = (String(ask?.line?.text ?? "").match(/-?\d+(?:\.\d+)?(?:\/\d+)?/g) ?? []).filter((x, i, a) => a.indexOf(x) === i).slice(0, 4);
  const nlRequest = request?.kind === "number_line" && !request.said?.length && lineNumbers.length ? { ...request, said: lineNumbers } : request;
  const nl0 = request?.kind === "number_line" ? numberLineBoard(nlRequest, { scriptId: String(ask?.intent?.intentId ?? "nl"), lessonId: ask?.line?.lessonId ?? "", spanMs: ctx.speechMs })
    : request?.subject ? clockBoard(request, { scriptId: String(ask?.intent?.intentId ?? "clock"), lessonId: ask?.line?.lessonId ?? "", spanMs: ctx.speechMs }) : null;
  const nl = nl0 ? regate(retime(nl0, nl0.durationMs, ctx.speechMs), ask, ctx) : null;
  const code0 = nl?.ok ? { ...nl, template: request.kind === "number_line" ? "number_line" : "clock", by: "request" } : codeBoard(ask, { kit: o.kit, lessonId: ask?.line?.lessonId, band: ctx.band }, ctx);
  if (nl0 && !nl?.ok) console.info(`[studio] ${request?.kind === "number_line" ? "number line" : "clock"} refused ${(nl?.gate?.checks ?? []).filter((c) => !c.pass).map((c) => c.id).join(",")}`);
  const code = fits(code0) ? code0 : null;
  // 2. until the sync deadline: the first of the line plan (if it passes) or the speculative board (if it lands and passes)
  // ship5 fixer (experience B1, V3.3 "a child's request is answered on stage within 3 s p90"): when the CHILD asked for
  // the board and a code board already passes against her line, the line plan gets a short head start only
  const deadlineAt = t0 + (ask?.requested && code ? Math.min(BOARD_SYNC_MS(), REQUESTED_SYNC_MS) : BOARD_SYNC_MS());
  const specE = specs.get(String(ask?.intent?.intentId ?? ""));
  let line = null;
  for (;;) {
    const left = deadlineAt - Date.now();
    if (left <= 0) break;
    const waits = [lineP.then((x) => ({ line: x })), sleep(left).then(() => ({ timeout: true }))];
    if (specE && !specE.result) waits.push(specE.promise.then(() => ({ spec: true })));
    const r = await Promise.race(waits);
    if (r.line) { line = r.line.v; if (line?.ok && line.script && !shownBefore(line.script, { avoid: o.avoid, seen: o.seen })) return { ...line, source: "line", syncMs: Date.now() - t0, specState: specState(ask) }; }
    if (r.spec || r.line) { const sp = takeSpecFit(ask, ctx); if (sp) { lineSpend(lineP, o); return tag(sp, "spec", { usd: sp.usd + (Number(line?.usd) || 0) }); } }
    if (r.timeout) break;
    if (r.line && (!specE || specE.result)) break;      // the line failed and nothing else is coming before the deadline
  }
  // 3. at the deadline (or once nothing better can come): a speculative board that passes, else the code board
  const spec3 = takeSpecFit(ask, ctx);
  if (spec3) { lineSpend(lineP, o); return tag(spec3, "spec", { usd: spec3.usd }); }
  if (code) { if (!line) lineSpend(lineP, o); return tag(code, "code", { template: code.template, by: code.by, usd: Number(line?.usd) || 0, specState: specState(ask) }); }
  // the Director's own template rung this board replaces (the caller's fallback), re-timed to her line, when it passes
  const tpl0 = templateBoard(ask, o.fallbackScript, ctx);
  const tpl = fits(tpl0) ? tpl0 : null;
  if (tpl) { if (!line) lineSpend(lineP, o); return tag(tpl, "template", { usd: Number(line?.usd) || 0, specState: specState(ask) }); }
  // 4. nothing on time: the line planner's own result whenever it lands (pre-ship5 behaviour), then a late spec board
  const fin = line ?? (await lineP).v;
  if (fin?.ok && fin.script && !shownBefore(fin.script, { avoid: o.avoid, seen: o.seen })) return { ...fin, source: "line", syncMs: Date.now() - t0, specState: specState(ask) };
  if (specE && !specE.result) await Promise.race([specE.promise, sleep(Math.max(0, (o.budgetMs ?? 7000) - (Date.now() - t0)))]);
  const spec4 = takeSpecFit(ask, ctx);
  if (spec4) return tag(spec4, "spec", { usd: spec4.usd + (Number(fin?.usd) || 0) });
  // an EXAMPLE asked and no worked page came (the line plan failed or ran out of time): the lesson's own ready-made page,
  // when it is not a page already shown, beats an empty board (round 5 battery iter9: c1 / c6 "ek example do" got none)
  if (request?.kind === "example") {
    const loose = [code0, tpl0].find((r) => r?.script && r.ok !== false && !shownBefore(r.script, { avoid: o.avoid, seen: o.seen }));
    if (loose) return tag(loose, loose === code0 ? "code" : "template", { usd: Number(fin?.usd) || 0, specState: specState(ask), loose: true });
  }
  return { ...(fin ?? { ok: false, script: null, usd: 0, why: "planner_error" }), source: "none", syncMs: Date.now() - t0 };
}
/** A line plan that lost the race still costs: its spend is reported when it lands (the breaker and the caps count it). */
function lineSpend(lineP, o) { lineP.then(({ v }) => { const usd = Number(v?.usd) || 0; if (usd > 0) try { o.onLateSpend?.(usd); } catch { /* accounting never breaks a lesson */ } }); }
export { numbersIn };
