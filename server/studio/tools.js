// Round 5, stream 2 (the board) for the Teacher agent (docs/design/round5/AGENT.md §1): the board and picture tools. The code is
// the hands, never the brain: every tool returns ScreenTruth, the one description of the screen the agent may rely on. It is
// computed from what ACTUALLY mounted (the script on the slot after the gate), never from what was asked.
//
//   board.show(lessonId, spec, { say })  write | table | shapes | work | number_line (drawn by code) | draw (a labelled sketch
//                                       by the board planner, the subject code-gated). Every page is a fresh page; the same
//                                       page twice is refused; every page passes the whiteboard gate against `say` (her line).
//   board.clear(lessonId)               the board is emptied
//   screen.now(lessonId)                what is up now
//   picture.get(lessonId, subject)      server/studio/picture.js (a real image job, or an honest "cannot")
//
// ScreenTruth = { ok, on: "board" | "picture" | "game" | "nothing", words, texts, numbers, pageId?, refused?: { why, checks },
//   job?: { id, etaMs } }. `words` is one plain sentence a model can repeat truthfully to the child.
import { studioSeam, subscribe, _lesson } from "./seam.js";
import { textsOf, numberLineBoard, answersRequest } from "./request.js";
import { drawableSubject } from "../director/state.js";
import { startPicture } from "./picture.js";

const BOARD = { w: 400, h: 300 };
const MAX_LINE = 24;
let n = 0;
const clip = (s, k = MAX_LINE) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, k);
const nums = (texts) => [...new Set(texts.flatMap((t) => String(t).replace(/[−–]/g, "-").match(/-?\d+(?:[./]\d+)?/g) ?? []))];

/** One plain sentence of what a script shows (texts and shapes), for the agent. PURE. */
export function describeScript(script) {
  if (!script?.ops?.length) return "the board is empty";
  const ops = script.ops;
  const t = textsOf(script).map((x) => clip(x, 40)).filter(Boolean);
  const parts = [];
  const isLine = ops.some((o) => o.op === "numwork" && o.layout === "number_line")
    || (ops.some((o) => o.op === "line" && Math.abs((o.to?.[0] ?? 0) - (o.from?.[0] ?? 0)) >= 150) && ops.filter((o) => o.op === "line").length >= 3);
  if (isLine) {
    const marks = ops.filter((o) => o.op === "text" && o.ink === "accent").map((o) => o.text);
    parts.push(`a number line${marks.length ? ` marked at ${marks.join(" and ")}` : ""}`);
  }
  const sectors = ops.filter((o) => o.op === "sector");
  if (sectors.length) { const shaded = sectors.filter((o) => o.fill).length; parts.push(`a circle cut into ${sectors.length} equal parts${shaded ? `, ${shaded} shaded` : ""}`); }
  const count = (op, one, many) => { const k = ops.filter((o) => o.op === op).length; if (k) parts.push(k > 1 ? `${k} ${many}` : one); };
  if (!isLine) count("circle", "a circle", "circles");
  count("rect", "a box", "boxes");
  for (const o of ops.filter((x) => x.op === "polygon")) parts.push(`a ${o.points?.length === 3 ? "triangle" : o.points?.length === 4 ? "four-sided shape" : `${o.points?.length}-sided shape`}`);
  count("arrow", "an arrow", "arrows");
  if (ops.some((o) => o.op === "numwork" && o.layout !== "number_line")) parts.push("worked numbers");
  const what = parts.length ? parts.slice(0, 5).join(", ") : "writing";
  return `the board shows ${what}${t.length ? `; written on it: ${t.slice(0, 10).join("; ")}` : ""}`;
}

/** The truth of a piece on the slot (or of nothing). */
function truthOf(piece, extra = {}) {
  const a = piece?.artifact;
  if (!a) return { ok: true, on: "nothing", words: "nothing is on the screen", texts: [], numbers: [], ...extra };
  if (a.kind === "whiteboard") {
    const texts = textsOf(a.script);
    return { ok: true, on: "board", words: describeScript(a.script), texts, numbers: nums(texts), pageId: piece.intentId, ...extra };
  }
  if (a.kind === "image") return { ok: true, on: "picture", words: `the screen shows ${a.alt || `a picture of ${piece.facts?.onScreen?.picture ?? "something"}`}`, texts: [], numbers: [], pageId: piece.intentId, ...extra };
  return { ok: true, on: "game", words: `the screen shows ${piece.archetype ?? a.kind} for the child to use`, texts: [], numbers: [], pageId: piece.intentId, ...extra };
}

/** What is up now. */
export function screenNow(lessonId) {
  const L = _lesson(lessonId);
  const on = L?.onScreen ? L.pieces.get(L.onScreen) : null;
  return truthOf(on && !on.retired && on.state !== "failed" ? on : null);
}

// ───────────────────────── specs → scripts (code) ─────────────────────────
const T = (i, beat) => ({ startMs: 300 + Math.round(i * beat), endMs: 300 + Math.round(i * beat + Math.max(200, beat * 0.85)) });
const script = (ops, scriptId) => ({ v: 1, scriptId, line: { lessonId: "" }, anchor: "line_audio_start", board: { ...BOARD, ground: "chalk" }, mode: "fresh",
  durationMs: Math.max(...ops.map((o) => o.endMs)) + 200, ops });

/**
 * A spec the code can draw exactly, as a script, or null (unknown kind / nothing to draw). PURE.
 * @param {any} spec @param {{ spanMs?: number, scriptId?: string }} [o]
 */
export function scriptForSpec(spec, { spanMs = 3000, scriptId = "tool" } = {}) {
  const k = spec?.kind;
  if (k === "number_line") {
    const s = numberLineBoard({ kind: "number_line", said: (spec.mark ?? []).map(String) }, { scriptId, spanMs });
    return s;
  }
  const beat = (count) => Math.max(250, Math.min(1500, (spanMs * 0.75) / Math.max(1, count)));
  if (k === "write") {
    const lines = (spec.lines ?? []).map((x) => clip(x)).filter(Boolean).slice(0, 6);
    if (!lines.length) return null;
    const b = beat(lines.length);
    return script(lines.map((text, i) => ({ id: `w${i}`, op: "text", at: [200, 50 + i * (220 / Math.max(1, lines.length - 1 || 1))], text, size: lines.length > 4 ? "s" : "m", align: "middle", ...T(i, b) })), scriptId);
  }
  if (k === "table") {
    const cols = (spec.columns ?? []).map((x) => clip(x, 14)).slice(0, 4);
    const rows = (spec.rows ?? []).slice(0, 5).map((r) => cols.map((_, j) => clip(r?.[j], 14)));
    if (!cols.length) return null;
    const cw = 360 / cols.length, rh = Math.min(44, 230 / (rows.length + 1));
    const ops = [];
    let i = 0;
    const b = beat(cols.length + rows.length + 1);
    cols.forEach((c, j) => ops.push({ id: `h${j}`, op: "text", at: [20 + cw * j + cw / 2, 40], text: c, size: "m", align: "middle", ink: "accent", ...T(i++ * 0.5, b) }));
    ops.push({ id: "hl", op: "line", from: [20, 52], to: [380, 52], ...T(i++ * 0.5, b) });
    rows.forEach((r, ri) => r.forEach((cell, j) => { if (cell) ops.push({ id: `c${ri}_${j}`, op: "text", at: [20 + cw * j + cw / 2, 52 + rh * (ri + 1)], text: cell, size: "s", align: "middle", ...T(i++ * 0.5, b) }); }));
    return script(ops, scriptId);
  }
  if (k === "work") {
    const layout = ["column_add", "column_sub", "column_mul", "long_div", "fraction", "equation"].includes(spec.layout) ? spec.layout : null;
    const rows = Array.isArray(spec.rows) ? spec.rows.slice(0, 6).map((r) => (Array.isArray(r) ? r.slice(0, 10).map((c) => clip(c, 8)) : [])) : [];
    if (!layout || !rows.length) return null;
    return script([{ id: "nw", op: "numwork", at: [120, 90], layout, rows, ...T(0, beat(1)) }], scriptId);
  }
  if (k === "shapes") {
    const shapes = (spec.shapes ?? []).slice(0, 4);
    if (!shapes.length) return null;
    const ops = [];
    const w = 360 / shapes.length, b = beat(shapes.length * 2);
    let i = 0;
    shapes.forEach((sh, j) => {
      const cx = 20 + w * j + w / 2, cy = 140, r = Math.min(70, w / 2 - 14);
      const fill = sh.shaded ? "accent" : undefined;
      const kind = String(sh.shape ?? "");
      if (kind === "circle") ops.push({ id: `s${j}`, op: "circle", c: [cx, cy], r, ...(fill ? { fill } : {}), ...T(i++, b) });
      else if (kind === "square" || kind === "rect") ops.push({ id: `s${j}`, op: "rect", at: [cx - r, cy - (kind === "square" ? r : r * 0.6)], w: 2 * r, h: kind === "square" ? 2 * r : 1.2 * r, ...(fill ? { fill } : {}), ...T(i++, b) });
      else if (kind === "triangle" || kind === "polygon") {
        const sides = kind === "triangle" ? 3 : Math.max(3, Math.min(10, Number(sh.sides) || 5));
        ops.push({ id: `s${j}`, op: "polygon", points: Array.from({ length: sides }, (_, q) => [Math.round(cx + r * Math.sin((2 * Math.PI * q) / sides)), Math.round(cy - r * Math.cos((2 * Math.PI * q) / sides))]), ...(fill ? { fill } : {}), ...T(i++, b) });
      } else if (kind === "parts") {
        const parts = Math.max(2, Math.min(12, Number(sh.parts) || 2)), shaded = Math.max(0, Math.min(parts, Number(sh.shaded) || 0));
        for (let q = 0; q < parts; q++) ops.push({ id: `s${j}p${q}`, op: "sector", c: [cx, cy], r, fromDeg: (360 / parts) * q, toDeg: (360 / parts) * (q + 1), ...(q < shaded ? { fill: "accent" } : {}), ...T(i++ * 0.4, b) });
      } else return;
      if (sh.label) ops.push({ id: `l${j}`, op: "label", at: [cx, cy + r + 28], text: clip(sh.label, 16), to: [cx, cy + r], ...T(i++, b) });
    });
    return ops.length ? script(ops, scriptId) : null;
  }
  return null;
}

/** Wait for this intent's slot to settle (revealed with a script, or failed), within ms. */
function settle(lessonId, intentId, ms) {
  return new Promise((resolve) => {
    let done = false, un = () => {};
    const finish = (v) => { if (done) return; done = true; clearTimeout(timer); try { un(); } catch { /* gone */ } resolve(v); };
    const timer = setTimeout(() => finish("timeout"), ms);
    un = subscribe(lessonId, { send: (m) => {
      if (m?.t === "script" && m.intentId === intentId) finish("revealed");
      else if (m?.t === "status" && m.status?.intentId === intentId && m.status.state === "failed") finish("failed");
    } });
  });
}

/**
 * board.show: put a page on the board; resolves with the screen truth. `say` is her line it goes with (the gate holds the
 * board to it: its numbers and words, its counts, its timing, never an answer still to be found).
 * @param {string} lessonId @param {any} spec @param {{ say?: string, skillId?: string, topicId?: string, band?: string, lang?: string, timeoutMs?: number }} [o]
 */
export async function boardShow(lessonId, spec, { say = "", skillId = "", topicId = "", band = "B3", lang = "hinglish", timeoutMs } = {}) {
  const intentId = `${lessonId}:tool:${++n}:${Date.now() % 100000}`;
  const line = String(say ?? "").trim();
  if (!line) return { ...screenNow(lessonId), ok: false, refused: { why: "board.show needs `say`: the line it is drawn beside", checks: ["no_line"] } };
  const base = { intent: { intentId, lessonId, kind: "whiteboard", skillId, need: "explain", beat: "explain", neededAtMs: 0, priority: "on_cue", style: { band, lang, motion: "lively" } },
    line: { lessonId, text: line }, mode: "fresh", kit: { topicId, content: [] }, requested: true };
  let ask;
  if (spec?.kind === "draw") {
    const subject = clip(spec.subject, 40);
    if (!subject || !drawableSubject(subject)) return { ...screenNow(lessonId), ok: false, refused: { why: `cannot sketch "${subject}" (not a plain thing a sketch may show)`, checks: ["subject"] } };
    ask = { ...base, intent: { ...base.intent, request: { kind: "draw", subject } }, kit: { ...base.kit, content: (spec.labels ?? []).map((x) => clip(x)).slice(0, 6) } };
  } else {
    const s = scriptForSpec(spec, { spanMs: Math.max(1200, line.length * 70), scriptId: intentId });
    if (!s) return { ...screenNow(lessonId), ok: false, refused: { why: `nothing to draw for spec kind "${spec?.kind}"`, checks: ["spec"] } };
    // what the spec writes is the agent's own content: it is allowed on the board (W4/W5 read the kit content), the gate
    // still checks legibility, overlap, counts against her line, arithmetic and never the open answer
    ask = { ...base, script: s, kit: { ...base.kit, content: textsOf(s).slice(0, 8) },
      ...(spec.kind === "number_line" ? { intent: { ...base.intent, request: { kind: "number_line", said: (spec.mark ?? []).map(String) } } } : {}) };
  }
  const ack = studioSeam.requestIntent(ask);
  if (!ack) return { ...screenNow(lessonId), ok: false, refused: { why: "the board is not available now (safety, the parent's switch, or a game in use)", checks: ["declined"] } };
  if (ack.state === "failed") return { ...screenNow(lessonId), ok: false, refused: { why: ack.refused?.includes("same_page") ? "that page is already on the board" : "the page failed the board check", checks: ack.refused ?? [] } };
  if (ack.state !== "revealed") {
    const r = await settle(lessonId, intentId, timeoutMs ?? 7500);
    if (r !== "revealed") return { ...screenNow(lessonId), ok: false, refused: { why: r === "timeout" ? "the sketch was not ready in time" : "the sketch failed the board check", checks: [r] } };
  }
  const L = _lesson(lessonId);
  const piece = L?.pieces.get(intentId);
  const truth = truthOf(piece);
  if (spec?.kind === "draw" && piece?.artifact?.script && !answersRequest(piece.artifact.script, { kind: "draw", subject: ask.intent.request.subject })) truth.words += ` (it does not name ${ask.intent.request.subject})`;
  return truth;
}

/** board.clear */
export function boardClear(lessonId) {
  studioSeam.clearBoard(lessonId);
  return { ok: true, on: "nothing", words: "the board is empty", texts: [], numbers: [] };
}

/**
 * picture.get: a real picture of a thing, made in the background (~12-20 s), moderated, then put on the stage; or an honest
 * "cannot" at once. → ScreenTruth now (the screen unchanged, `job` set; or `refused`); later `onEvent({ type:
 * "content_ready", job, truth })` when it is up, or `{ type: "content_failed", job, why }`. The agent says it is being made
 * and gives the thing in words meanwhile; it never says the picture is there before content_ready.
 * @param {string} lessonId @param {string} subject @param {{ onEvent?: (e: any) => void }} [o]
 */
export function pictureGet(lessonId, subject, { onEvent = () => {} } = {}) {
  const now = screenNow(lessonId);
  const r = startPicture(lessonId, subject, {
    reveal: (pic) => {
      const slot = studioSeam.showImage(lessonId, pic);
      try { onEvent(slot ? { type: "content_ready", job: pic.jobId, truth: screenNow(lessonId) } : { type: "content_failed", job: pic.jobId, why: "the stage is busy (a game in use) or Studio is off" }); } catch { /* the agent is gone */ }
    },
    fail: (why) => { try { onEvent({ type: "content_failed", job: r?.job?.id ?? null, why }); } catch { /* the agent is gone */ } },
  });
  if (!r.ok) return { ...now, ok: false, refused: { why: r.why, checks: [r.check] } };
  return { ...now, ok: true, job: r.job, words: `${now.words}; a picture of ${String(subject).slice(0, 40)} is being made (about ${Math.round((r.job.etaMs || 0) / 1000)} s)` };
}

export const boardTools = { show: boardShow, clear: boardClear, now: screenNow };
export const pictureTools = { get: pictureGet };
