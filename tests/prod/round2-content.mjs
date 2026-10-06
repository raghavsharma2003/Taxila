// Round 2 · stream content acceptance (VALUES-100 V3; docs/design/round2/content/). Same file before and after, local
// server and taxila.dev. Finishes inside --budget-min (default 14): lessons run --conc at a time (default 4), and a part
// that would start past the budget is skipped and reported, never silently dropped.
//
//   R. Requests on stage: the six owner-5 asks ("show me a diagram", "picture dikhao", "draw it", "whiteboard pe bana ke
//      samjhao", "game khelna hai", "animation dikhao na") on the typed and spoken (cascade) lanes, each in a fresh
//      lesson as the child's 3rd turn, x --reps. Pass for each: something real on the stage (a module mount, a Stagecraft
//      piece, a board that FILLS: a slot that fails or stays empty is not real), her words point at it, and never a slot
//      that failed while her line points at the screen.
//      Times: a PIECE (Stagecraft, a module): request sent → turn response (API time; device mount not included);
//      a BOARD: lateness after her audio starts = (board on the slot − reply received) − W2F_AUDIO_MS (700): a board
//      that rides the turn response is −700 (ready before she speaks).
//   B. Board sync on explanation beats: BOARD_TOPICS walked with 6 lines each, x --reps. Every whiteboard slot either
//      fills with a board that re-passes strict shape + lint + the full gate W0-W9 against her line, or her line does not
//      point at the screen; lateness as above.
//   M. Item-bound maths mounts (w1b-mounts' bar on the three production failures): a practice lesson answers the items it
//      poses for up to 8 turns; a mount whose goal is item:<id> (a bound engine plan) must appear.
//   D. Coverage (offline, the shipped files): evals/content/coverage.mjs.
// Bars: R piece p90 ≤ 3000 ms; R+B board lateness p90 ≤ 1500 ms; 0 slots failed-and-pointed-at; R real 100%; M ≥ 1 per topic.
//
// Run: NODE_USE_ENV_PROXY=1 [TAXILA_BASE=http://localhost:8795] node tests/prod/round2-content.mjs [--parts R,B,M,D]
//      [--reps 1] [--conc 4] [--budget-min 14] [--lanes both|typed] [--cov-root DIR]
import { arg, withTestAccount, ok, warn, done, BASE, PERSONAS, GREET, freshChild, openLesson, ordinaryTurn, RX, newStageOf, compact, save, kitOf, itemOf, answersFor } from "./_owner.mjs";
import { normalizeScript, lintScript } from "../../shared/whiteboard.js";
import { gateWhiteboard, withheldValues } from "../../server/studio/qa/whiteboard.js";
import { redactLine, speechMsOf } from "../../server/studio/plan.js";

const T0 = Date.now();
const PARTS = arg("parts", "R,B,M,D").split(",");
const REPS = Math.max(1, Number(arg("reps", "1")) || 1);
const CONC = Math.max(1, Number(arg("conc", "4")) || 4);
const BUDGET_MS = Math.max(1, Number(arg("budget-min", "14")) || 14) * 60_000;
const lanes = arg("lanes", "both");
const AUDIO_MS = Number(process.env.W2F_AUDIO_MS) || 700;
const left = () => BUDGET_MS - (Date.now() - T0);
const q = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.ceil(p * s.length) - 1)] : null; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** Run `jobs` (async fns) `CONC` at a time; a job that would start with < `reserveMs` of budget left is skipped. */
async function pool(jobs, reserveMs = 60_000) {
  const out = []; let i = 0, skipped = 0;
  const worker = async () => { while (i < jobs.length) { const j = jobs[i++]; if (left() < reserveMs) { skipped++; continue; } try { out.push(await j()); } catch (e) { ok(false, `job threw: ${String(e?.message ?? e).slice(0, 160)}`); } } };
  await Promise.all(Array.from({ length: CONC }, worker));
  return { out, skipped };
}
/** Poll a slot until it carries an artifact or a terminal state; ms after `t0`. */
async function slotArrival(api, lessonId, intentId, t0, maxMs = 12_000) {
  while (Date.now() - t0 < maxMs) {
    const s = (await api("GET", `/api/studio/slot?lessonId=${lessonId}&intentId=${encodeURIComponent(intentId)}`, undefined, [200, 404]).catch(() => null))?.slot;
    if (s?.artifact) return { artifact: s.artifact, state: s.state, ms: Date.now() - t0 };
    if (s?.state && !["planning", "building", "ready"].includes(s.state)) return { artifact: null, state: s.state, ms: Date.now() - t0 };
    await sleep(120);
  }
  return { artifact: null, state: "timeout", ms: Date.now() - t0 };
}
/** The stage result of one response: { kind, real, boardLateMs?, pieceMs?, artifact? } */
async function stageResult(api, L, row, before) {
  const r = row.r;
  const art = newStageOf(r, before, { visualOnly: true });
  const slot = r?.ui?.studioSlot ?? null;
  const fresh = slot && JSON.stringify(slot) !== JSON.stringify(before?.ui?.studioSlot ?? null);
  if (fresh && slot.artifact?.kind === "whiteboard") return { kind: "board", real: true, boardLateMs: -AUDIO_MS, inResponse: true, artifact: slot.artifact };
  if (fresh && slot.artifact) return { kind: slot.artifact.kind, real: true, pieceMs: row.ms };
  if (fresh && slot.intentId) {
    const a = await slotArrival(api, L.lessonId, slot.intentId, Date.now());
    if (a.artifact?.kind === "whiteboard") return { kind: "board", real: true, boardLateMs: a.ms - AUDIO_MS, inResponse: false, artifact: a.artifact };
    if (a.artifact) return { kind: a.artifact.kind, real: true, pieceMs: row.ms + a.ms };
    return { kind: `slot:${a.state}`, real: false, slotFailed: true };
  }
  if ((r?.moduleCommands ?? []).some((c) => c.op === "mount")) return { kind: "module", real: true, pieceMs: row.ms };
  return { kind: art.length ? art.join(",") : "nothing", real: art.length > 0 };
}

const out = { base: BASE, startedAt: new Date(T0).toISOString(), conc: CONC, reps: REPS, requests: [], boards: [], mounts: [], coverage: null, skipped: {} };
const pieceMs = [], boardLate = [];
let pointedEmpty = 0;

// ── R: requests on stage ──
const REQUESTS = [
  { id: "diagram", text: "show me a diagram", persona: "meher" }, { id: "picture", text: "picture dikhao", persona: "aarav" },
  { id: "draw", text: "draw it", persona: "zoya" }, { id: "whiteboard", text: "whiteboard pe bana ke samjhao", persona: "kabir" },
  { id: "game", text: "game khelna hai", persona: "golu" }, { id: "animation", text: "animation dikhao na", persona: "ishaan" },
];
if (PARTS.includes("R")) await withTestAccount(async ({ api }) => {
  const jobs = [];
  for (let rep = 0; rep < REPS; rep++) for (const rq of REQUESTS) for (const spoken of lanes === "both" ? [false, true] : [false]) jobs.push(async () => {
    const persona = PERSONAS[rq.persona];
    const child = await freshChild(api, persona);
    const tag = `${rq.id} "${rq.text}" (${spoken ? "spoken" : "typed"}, ${persona.topics[0]}, rep ${rep + 1})`;
    const L = await openLesson(api, child, { topicId: persona.topics[0], spoken, persona });
    try {
      await L.turn(GREET[persona.style] ?? GREET.hinglish, { kind: "greet" });
      const o = ordinaryTurn(L, persona); await L.turn(o.text, { kind: o.kind });
      if (L.ended) { ok(false, `${tag}: the lesson ended on an ordinary turn`); return; }
      const before = L.last;
      const row = await L.turn(rq.text, { kind: "visual" });
      const s = await stageResult(api, L, row, before);
      const reply = String(row.r?.teacherReply ?? "");
      const refers = RX.refers.test(reply);
      if (s.slotFailed && refers) pointedEmpty++;
      if (s.real && s.boardLateMs != null) boardLate.push(s.boardLateMs);
      if (s.real && s.pieceMs != null) pieceMs.push(s.pieceMs);
      ok(s.real && refers && !(s.slotFailed && refers), `R ${tag}: on stage and pointed at — ${s.kind}${s.boardLateMs != null ? ` (board late ${s.boardLateMs} ms${s.inResponse ? ", in the turn response" : ""})` : s.pieceMs != null ? ` (${s.pieceMs} ms)` : ""}${refers ? "" : " — her words do not point at it"} | "${reply.slice(0, 90)}"`);
      out.requests.push({ tag, ...s, artifact: undefined, refers, turnMs: row.ms, reply, transcript: compact(L) });
    } finally { await L.end(); }
  });
  const { skipped } = await pool(jobs);
  out.skipped.R = skipped;
}, { tag: "r2c" });

// ── B: board sync on explanation beats ──
const BOARD_TOPICS = ["c6-science-ch01-t01", "c7-science-ch01-t01", "c5-maths-ch02-t01", "c4-maths-ch05-t01", "c6-maths-ch07-t01", "c5-evs-ch01-t01"];
const LINES = ["haan, main ready hoon", "samjhao na", "mujhe nahi pata, phir se samjhao", "ek example se samjhao", "achha, aur batao", "samajh nahi aaya, board pe dikhao"];
let gateFails = 0;
if (PARTS.includes("B") && left() > 90_000) await withTestAccount(async ({ api }) => {
  const jobs = [];
  for (let rep = 0; rep < REPS; rep++) for (const topicId of BOARD_TOPICS) jobs.push(async () => {
    const classLevel = Number(topicId.match(/^c(\d)/)[1]);
    const persona = { ...PERSONAS.aarav, classLevel, topics: [topicId] };
    const child = await freshChild(api, persona);
    const L = await openLesson(api, child, { topicId, persona });
    let kit = null; try { kit = kitOf(topicId); } catch { kit = null; }
    try {
      for (const text of LINES) {
        const before = L.last;
        const row = await L.turn(text);
        const r = row.r;
        const slot = r?.ui?.studioSlot;
        if (slot?.intentId && /:wb:/.test(slot.intentId) && JSON.stringify(slot) !== JSON.stringify(before?.ui?.studioSlot ?? null)) {
          const s = await stageResult(api, L, row, before);
          const refers = RX.refers.test(String(r?.teacherReply ?? ""));
          if (!s.real) {
            if (refers) pointedEmpty++;
            ok(!refers, `B ${topicId}: a board slot that did not fill (${s.kind}) is not pointed at ("${String(r?.teacherReply ?? "").slice(0, 80)}")`);
            out.boards.push({ topicId, real: false, kind: s.kind, refers, reply: r?.teacherReply });
          } else {
            const sc = s.artifact.script;
            const name = child.first_name ?? persona.name;
            const n = normalizeScript(sc, { strict: true });
            const g = gateWhiteboard(sc, { reply: redactLine(r.teacherReply, [name]), kit: kit ?? undefined, speechMs: speechMsOf(r.teacherReply), banned: [name], withhold: withheldValues(kit, { line: redactLine(r.teacherReply, [name]) }) });
            const pass = n.ok && !lintScript(n.script).length && g.pass;
            if (!pass) gateFails++;
            ok(pass, `B ${topicId}: the board re-passes strict shape + lint + W0-W9 against her line (${g.checks.filter((c) => !c.pass).map((c) => c.id).join(",") || "ok"}; late ${s.boardLateMs} ms${s.inResponse ? ", in the turn response" : ""})`);
            boardLate.push(s.boardLateMs);
            out.boards.push({ topicId, real: true, lateMs: s.boardLateMs, inResponse: s.inResponse, pass, reply: r.teacherReply });
          }
        }
        if (r?.end) break;
      }
    } finally { await L.end(); }
  });
  const { skipped } = await pool(jobs);
  out.skipped.B = skipped;
}, { tag: "r2c-wb" }); else if (PARTS.includes("B")) { out.skipped.B = "budget"; warn("B skipped: budget"); }

// ── M: item-bound maths mounts ──
const MOUNT_TOPICS = [["c6-maths-ch07-t01", "meher"], ["c4-maths-ch05-t01", "golu"], ["c7-maths-ch08-t01", "kabir"]];
if (PARTS.includes("M") && left() > 90_000) await withTestAccount(async ({ api }) => {
  const { skipped } = await pool(MOUNT_TOPICS.map(([topicId, p]) => async () => {
    const persona = { ...PERSONAS[p], topics: [topicId] };
    const child = await freshChild(api, persona);
    // purpose "practice", as w1b-mounts: the lesson poses items from the start (a learn lesson spends its first turns on
    // the hook, the explanation and the faded worked example)
    const L = await openLesson(api, child, { topicId, persona, purpose: "practice" });
    const kit = (() => { try { return kitOf(topicId); } catch { return null; } })();
    const mounts = [...(L.opening.moduleCommands ?? [])].filter((c) => c.op === "mount");
    try {
      await L.turn(GREET[persona.style] ?? GREET.hinglish, { kind: "greet" });
      mounts.push(...(L.last?.moduleCommands ?? []).filter((c) => c.op === "mount"));
      for (let k = 0; k < 8 && !L.ended && !mounts.some((c) => /^(item|g1):/.test(c.goal ?? "")); k++) {
        const item = kit ? itemOf(kit, L.last?.ui?.ask?.itemId) : null;
        const text = item ? answersFor(item, kit, persona).correct : ordinaryTurn(L, persona).text;
        const row = await L.turn(text);
        mounts.push(...(row.r?.moduleCommands ?? []).filter((c) => c.op === "mount"));
      }
      // w1b-mounts' bar: a catalog-bound plan (item:<id>) or a G1 fill (g1:<id>), both graded by the server
      const bound = mounts.filter((c) => /^(item|g1):/.test(c.goal ?? ""));
      const posed = L.rows.map((x) => `${x.r?.move?.kind ?? "?"}:${x.r?.ui?.ask?.itemId?.replace(/^.*-(i\d+|rl-\w+)$/, "$1") ?? "-"}`).join(" ");
      ok(bound.length >= 1, `M ${topicId}: an item-bound mount (goal item:<id> or g1:<id>) in the lesson — ${bound.map((c) => `${c.engine} ${c.params?.mode ?? ""} ${c.goal}`).join("; ") || `none (mounts: ${mounts.map((c) => `${c.engine}${c.params?.mode ? ` ${c.params.mode}` : ""}`).join(", ") || "none"})`}`);
      console.log(`  M ${topicId} posed: ${posed}`);
      out.mounts.push({ topicId, bound: bound.map((c) => ({ engine: c.engine, mode: c.params?.mode, goal: c.goal })), mounts: mounts.map((c) => c.engine), posed });
    } finally { await L.end(); }
  }));
  out.skipped.M = skipped;
}, { tag: "r2c-m" }); else if (PARTS.includes("M")) { out.skipped.M = "budget"; warn("M skipped: budget"); }

// ── D: coverage (offline) ──
if (PARTS.includes("D")) {
  const { coverage } = await import("../../evals/content/coverage.mjs");
  // --cov-root: the tree whose shipped files are counted (default: this tree; a local server's own tree for before/after)
  const c = await coverage(arg("cov-root", undefined) ?? new URL("../..", import.meta.url).pathname);
  const { short: _s, ...head } = c;
  out.coverage = head;
  console.log(`D coverage (${c.boardFirst ? "board-first" : "HEAD code rung"}): game ${c.counts.game} · explainer ${c.counts.explainer} · live board ${c.counts.board} · validated key ${c.counts.key} · ALL FOUR ${c.counts.all4}/${c.total}; maths bound items ${c.mathsBinding.boundItems}/${c.mathsBinding.items}`);
  ok(c.total === 385, `D: ${c.total} class 4-7 topics counted (385 expected)`);
}

// ── bars ──
const real = out.requests.filter((x) => x.real).length;
if (out.requests.length) ok(real === out.requests.length, `R: ${real}/${out.requests.length} requests put something real on the stage`);
if (pieceMs.length) ok(q(pieceMs, 0.9) <= 3000, `R: request → piece on stage p50 ${q(pieceMs, 0.5)} ms, p90 ${q(pieceMs, 0.9)} ms ≤ 3000 (n = ${pieceMs.length}; API time from ${/localhost|127\.0\.0\.1/.test(BASE) ? "a local server" : "the sandbox"})`);
if (boardLate.length) ok(q(boardLate, 0.9) <= 1500, `R+B: board lateness after her audio starts p50 ${q(boardLate, 0.5)} ms, p90 ${q(boardLate, 0.9)} ms ≤ 1500 (n = ${boardLate.length}; ${[...out.requests, ...out.boards].filter((x) => x.inResponse).length} in the turn response)`);
const slots = out.boards.length;
if (slots) console.log(`B: ${out.boards.filter((b) => b.real).length}/${slots} board slots filled; ${gateFails} filled boards failed the re-gate`);
ok(pointedEmpty === 0, `R+B: slots that failed while her line pointed at the screen: ${pointedEmpty}`);
out.summary = { pieceMs: { n: pieceMs.length, p50: q(pieceMs, 0.5), p90: q(pieceMs, 0.9) }, boardLate: { n: boardLate.length, p50: q(boardLate, 0.5), p90: q(boardLate, 0.9) },
  realRequests: `${real}/${out.requests.length}`, boardSlotsFilled: `${out.boards.filter((b) => b.real).length}/${slots}`, gateFails, pointedEmpty, wallMs: Date.now() - T0 };
console.log(`summary ${JSON.stringify(out.summary)}`);
ok(Date.now() - T0 <= 15 * 60_000, `finished in ${Math.round((Date.now() - T0) / 1000)} s (≤ 15 min)`);
save("round2-content.json", out);
done();
