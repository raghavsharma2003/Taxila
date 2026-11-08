// dc-r7-script-walk-v6-4 (main's director12 judgement, four hand judges): each fix is a PREDICATE pinned on director12's own rows
// (0-based rows of the run's .json), replayed through turn.js planTurn (tests/fixtures/replay.mjs) and textReply with the run's own
// v2.3 scripts and her own words.
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { replay, runScriptOf } from "./fixtures/replay.mjs";
import { textReply, replyDeps, returnLineOk } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { setScriptForTest } from "../server/director/script.js";
import { findItem } from "../server/director/items.js";
import { whiteboardIntentOf, boardItemOf } from "../server/brain/propose.js";
import { pagesBoard, preselect, takePreselected, refKey as refKeyOf } from "../server/stagecraft/board-first.js";
import { gateCtxFor } from "../server/stagecraft/board-sync.js";

/** The page on screen before this turn: the live card's board, drawn on its own (production's L.wbPrevPage). */
function keepOf(ask, board, kit) {
  const a = { ...ask, intent: { ...ask.intent, intentId: `${ask.intent.intentId}:up`, boardRef: board, segments: undefined, segmentPlan: undefined }, line: { ...ask.line, text: "" } };
  preselect(a, { kit });
  return takePreselected(a, gateCtxFor(a, { kit, redact: [], prior: [] }))?.script ?? null;
}

const RUN = "2026-11-08-director12";
const TOPIC = { c4: "c4-maths-ch05-t01", "c5-t01": "c5-maths-ch02-t01", "c5-t02": "c5-maths-ch02-t02", c6: "c6-maths-ch06-t01" };
const sentences = (t) => (String(t ?? "").match(/[^.!?।]+[.!?।]*/g) ?? []).map((x) => x.trim()).filter(Boolean);

describe("r7-brain-v64.test.mjs", () => {
  const KEEP = {};
  beforeEach(() => { KEEP.s = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT; setScriptForTest(); });
  afterEach(() => { replyDeps.chat = chat; setScriptForTest(); if (KEEP.s === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = KEEP.s; });

  /** Row n (0-based, a teacher row) replayed: her line now, the state, and the pages the seam would send. */
  const at = async (persona, topic, n) => {
    const T = TOPIC[topic];
    setScriptForTest(T, runScriptOf(RUN, T));
    const { kit, rows, last } = await replay(RUN, persona, T, n + 1);
    replyDeps.chat = async () => ({ text: rows[n].text });
    const out = await textReply({ instructions: instructionsFor(last.state, kit), state: last.state, kit, childText: last.child, history: [], ui: last.p.r.ui, module: null });
    const item = boardItemOf(last.state, kit, findItem);
    const a = whiteboardIntentOf({ lessonId: `v64-${persona}-${topic}-${n}`, turn: last.state.turn, beat: { id: "visual", type: "explain" }, next: last.state, kit, item, line: { text: out.reply, parts: out.guard.parts } });
    const pre = whiteboardIntentOf({ lessonId: `v64p-${persona}-${topic}-${n}`, turn: last.state.turn, beat: { id: "visual", type: "explain" }, next: last.state, kit, item, line: { text: "" } });
    const text = out.reply.replace(/\s+/g, " ").trim();
    const ps = [{ atChar: 0, boardRef: a.intent.boardRef, scriptBeat: a.intent.scriptBeat }, ...(a.intent.segments ?? [])];
    const pages = ps.map((p, i) => ({ ...p, text: text.slice(p.atChar, ps[i + 1]?.atChar ?? text.length) }));
    return { out, rows, last, kit, ask: a, pre, pages };
  };

  // P2 — no orphan lines
  const FRAGMENT = (fn) => (x) => new RegExp(`^${fn}[.!,]?$`, "i").test(x) || /^(?:ke|ki|ka|se|mein|ko|ne)\s/i.test(x) || /tulna karo kar/i.test(x);
  const P2_ROWS = [["stuck", "c5-t02", 26], ["stuck", "c5-t02", 30], ["stuck", "c5-t02", 46], ["steering", "c5-t02", 38],
    ["offtopic", "c5-t02", 38], ["steady", "c5-t02", 64], ["steady", "c5-t02", 66], ["steady", "c5-t02", 78], ["stuck", "c5-t01", 56],
    ["steady", "c5-t02", 50], ["offtopic", "c5-t02", 56], ["offtopic", "c5-t02", 16], ["steering", "c5-t02", 18],
    ["offtopic", "c4", 16], ["offtopic", "c4", 64], ["stuck", "c6", 54], ["steering", "c5-t01", 24]];
  test("P2 predicate: no spoken part without its own page — no fragments, a remediation said whole, simplers and recaps on their own board (judges' 17 rows)", async () => {
    const bad = [];
    for (const [persona, topic, n] of P2_ROWS) {
      const { out, last, kit, ask, pre, pages } = await at(persona, topic, n);
      const tag = `${persona} ${topic} row ${n}`;
      const lm = last.state.lastMove ?? {};
      const frag = sentences(out.reply).filter(FRAGMENT(last.state.ctx?.firstName ?? "Riya"));
      if (frag.length) bad.push(`${tag}: fragment ${JSON.stringify(frag)} | ${out.reply.slice(0, 120)}`);
      // a remediation's words, when said, are said whole
      if (lm.simpler && lm.simplerBeat?.kind === "remediation") {
        const missing = sentences(lm.simpler).filter((x) => !out.reply.includes(x.replace(/[.!?]$/, "")));
        if (missing.length && sentences(lm.simpler).some((x) => out.reply.includes(x.replace(/[.!?]$/, "")))) bad.push(`${tag}: remediation cut, missing ${JSON.stringify(missing)}`);
      }
      // a beat's or remediation's simpler is on the board it describes
      if (lm.simpler && lm.simplerBeat?.board) {
        const first = sentences(lm.simpler)[0];
        const pg = pages.find((p) => first && p.text.includes(first.slice(0, 24)));
        if (pg && JSON.stringify(pg.boardRef) !== JSON.stringify(lm.simplerBeat.board)) bad.push(`${tag}: simpler on ${pg.scriptBeat?.beatId}, not ${lm.simplerBeat.beatId}`);
      }
      // no recital on a live card
      if (last.state.activeItemId && /Yaad karo:|Remember:/.test(out.reply)) bad.push(`${tag}: "Yaad karo" over the live card | ${out.reply.slice(0, 100)}`);
      // a single-part turn draws its own line's board (the board picked before her line exists is the same one)
      if (pages.length === 1 && JSON.stringify(pre.intent.boardRef) !== JSON.stringify(ask.intent.boardRef)) bad.push(`${tag}: one page, but the preselect is ${pre.intent.boardRef?.template} ${JSON.stringify(pre.intent.boardRef?.params).slice(0, 40)} and her line's ${ask.intent.boardRef?.template}`);
      // a paged turn the seam can page (as production does: a first page on the board already up — the live card's — is kept
      // still; Studio's pagesBoard keep / keepRef)
      // (steady c5-t02 row 78 is Studio's: fraction-line@1 and fraction-bars@1 are drawn on different board sizes, 400×300 and
      // 677×423, and pagesBoard refuses a turn whose pages differ in size — reported to main for Studio)
      const upRef = last.before.lastMove?.cardBeat?.board ?? last.before.lastMove?.scriptBeat?.board ?? null;
      const STUDIO_SIZE = new Set(["steady c5-t02 row 78"]);
      if (pages.length > 1 && !STUDIO_SIZE.has(tag)) {
        let ok = null;
        try { ok = pagesBoard({ ...ask, intent: { ...ask.intent, intentId: `${ask.intent.intentId}:pg` }, line: { ...ask.line, text: out.reply } }, { kit, ...(upRef ? { keepRef: refKeyOf(upRef), keep: keepOf(ask, upRef, kit) } : {}) }); } catch { ok = null; }
        if (!ok) bad.push(`${tag}: unpaged (${pages.map((p) => `${p.scriptBeat?.beatId}:${p.text.split(/\s+/).length}w`).join(" | ")})`);
      }
    }
    assert.deepEqual(bad, []);
  });
  // K1 — every card ends answered
  /** The cards that left the table with neither a right answer nor their key said (a give-up or a close), in one lesson. */
  async function unanswered(persona, topic) {
    const T = TOPIC[topic];
    // (the run's own script, walked by v6.4: not marked recordedRun, so K1's re-pose is on)
    const { recordedRun, ...sc } = runScriptOf(RUN, T);
    void recordedRun;
    setScriptForTest(T, sc);
    const { plans } = await replay(RUN, persona, T, 1e9);
    const keyed = new Set(), seen = new Map();
    let live = null;
    plans.forEach((pl, k) => {
      const st = pl.state, lm = st.lastMove ?? {};
      if ((lm.gave?.answer || lm.workedDone?.answer) && pl.before.activeItemId) keyed.add(pl.before.activeItemId);
      const now = st.activeItemId ?? null;
      if (now && String(now).startsWith("script:")) seen.set(now, k);
      live = now;
    });
    const end = plans.at(-1)?.state ?? {};
    const bad = [];
    for (const [id, k] of seen) {
      // (a card still live at the end, or one asked in the lesson's last 3 turns, or waiting to be asked again, is not judged)
      if (id === live || k >= plans.length - 3 || (end.reposeQ ?? []).some((r) => r.id === id)) continue;
      if (!(end.itemsDone ?? []).includes(id) && !keyed.has(id)) bad.push(`${id.split(":").slice(-1)[0]} (last live row ${plans[k].row - 1}) left unanswered`);
    }
    return bad;
  }
  for (const persona of ["steady", "stuck", "offtopic", "steering"]) for (const topic of Object.keys(TOPIC)) {
    test(`K1 predicate: every posed card ends answered right or with its key said (${persona} ${topic})`, async () => {
      assert.deepEqual(await unanswered(persona, topic), []);
    });
  }
  // Q1 — a turn that answered nothing re-poses only the card
  const NON_ANSWER = /^(?:sawaal kya hai\?|phir se bolo(?: na)?|kya poochha, phir se bolo na|kis cheez ka jawab dun\?|mujhe khud try karne do|ruko, main khud (?:karta|karti) hoon|pehle main try karun\?)$/i;
  async function recitals(persona, topic) {
    const T = TOPIC[topic];
    setScriptForTest(T, runScriptOf(RUN, T));
    const { kit, rows, plans } = await replay(RUN, persona, T, 1e9);
    const bad = [];
    for (const pl of plans) {
      const n = pl.row - 1;
      if (!rows[n] || !NON_ANSWER.test(String(pl.child ?? "").trim())) continue;
      const card = pl.p.r.ui?.ask?.text ?? "";
      if (!card || pl.state.activeItemId !== pl.before.activeItemId) continue;
      replyDeps.chat = async () => ({ text: rows[n].text });
      const out = await textReply({ instructions: instructionsFor(pl.state, kit), state: pl.state, kit, childText: pl.child, history: [], ui: pl.p.r.ui, module: null });
      const rest = out.reply.replace(card, "").replace(/^\s*(?:Phir se dekho:|Here it is again:|Theek hai[,.]?|Achha[,.]?|Haan[,.]?|Zaroor[,.]?)\s*/i, "").trim();
      if (/Yaad karo:|Remember:/.test(out.reply)) bad.push(`row ${n}: "Yaad karo" | ${out.reply.slice(0, 100)}`);
      else if (sentences(rest).length) bad.push(`row ${n}: more than the card (${JSON.stringify(rest.slice(0, 80))})`);
    }
    return bad;
  }
  for (const persona of ["steady", "stuck", "offtopic", "steering"]) for (const topic of Object.keys(TOPIC)) {
    test(`Q1 predicate: try-first, "sawaal kya hai", "phir se bolo" re-pose only the card (${persona} ${topic})`, async () => {
      assert.deepEqual(await recitals(persona, topic), []);
    });
  }
  // H2″ — asides
  test("H2″ predicate: the return comes at the FIRST boundary after the promised card closes (c5-t02 steering: row 28, not 40)", async () => {
    const T = TOPIC["c5-t02"];
    setScriptForTest(T, runScriptOf(RUN, T));
    const { plans } = await replay(RUN, "steering", T, 1e9);
    const r = plans.find((p) => p.state.lastMove?.returned);
    assert.ok(r, "returned");
    assert.equal(r.row - 1, 28, `returned at row ${r.row - 1}: ${r.state.lastMove.scriptBeat?.beatId}`);
  });

  async function returns(persona, topic) {
    const T = TOPIC[topic];
    setScriptForTest(T, runScriptOf(RUN, T));
    const { kit, rows, plans } = await replay(RUN, persona, T, 1e9);
    const bad = [], lines = [];
    for (const pl of plans) {
      const ret = pl.state.lastMove?.returned;
      if (!ret) continue;
      const n = pl.row - 1;
      // her recorded line for the turn; the retry (one short call) answers with a line of its own about their words
      replyDeps.chat = async (_d, msgs) => (/^You are a warm teacher/.test(msgs?.[0]?.content ?? "")
        ? { text: `Wah, ${String(ret.said ?? ret.topic).split(/\s+/).find((w) => w.length > 4 && !/maine|mujhe|aapko/i.test(w)) ?? ret.topic} sunkar mazaa aa gaya!` }
        : { text: rows[n].text });
      const out = await textReply({ instructions: instructionsFor(pl.state, kit), state: pl.state, kit, childText: pl.child, history: [], ui: pl.p.r.ui, module: null });
      if (/sunke bahut achha laga|tumne mujhse .* poocha tha|lesson ke baad mujhe/i.test(out.reply)) bad.push(`row ${n}: a fixed template | ${out.reply.slice(0, 120)}`);
      const line = sentences(out.reply).find((x) => returnLineOk(x, ret.said, ret.topic));
      if (!line && !out.guard.returnMissed) bad.push(`row ${n}: no return line and none reported missed | ${out.reply.slice(0, 120)}`);
      if (line) lines.push(line);
    }
    return { bad, lines };
  }
  for (const persona of ["offtopic", "steering", "steady", "stuck"]) for (const topic of Object.keys(TOPIC)) {
    test(`H2″ predicate: each return is one line of hers answering what they said — no template, no promise, ≤ 20 words (${persona} ${topic})`, async () => {
      const { bad } = await returns(persona, topic);
      assert.deepEqual(bad, []);
    });
  }

  // T1″ — one close per worked card; no carried close after a probe reply
  /** Every turn of one replayed lesson that closes a card twice: a verdict carrying its why AND "Toh poora jawab", or a
   *  "Pichhle sawaal ka jawab" for a card whose verdict already closed it before the why-probe. */
  async function twoCloses(persona, topic) {
    const T = TOPIC[topic];
    setScriptForTest(T, runScriptOf(RUN, T));
    const { kit, rows, plans } = await replay(RUN, persona, T, 1e9);
    const bad = [];
    for (const pl of plans) {
      const n = pl.row - 1;
      if (!rows[n]) continue;
      replyDeps.chat = async () => ({ text: rows[n].text });
      const out = await textReply({ instructions: instructionsFor(pl.state, kit), state: pl.state, kit, childText: pl.child, history: [], ui: pl.p.r.ui, module: null });
      const ss = sentences(out.reply);
      const done = ss.findIndex((x) => /^(?:Toh poora jawab|So the full answer)/i.test(x));
      if (done > 0 && ss.slice(0, done).some((x) => /(?<![\p{L}])(?:kyunki|because)(?![\p{L}])/iu.test(x))) bad.push(`row ${n} verdict+why and "Toh poora jawab" | ${out.reply.slice(0, 160)}`);
      const was = pl.before.activeItemId;
      if (was && pl.before.pendingWhy === was && /(?:Pichhle sawaal ka (?:sahi )?jawab|The last question's)/i.test(out.reply)) bad.push(`row ${n} carried close after a probe reply | ${out.reply.slice(0, 160)}`);
    }
    return bad;
  }
  test("T1″: the probe reply carries no close of a card its verdict already closed (judges' c4 steering 28, c6 offtopic 36)", async () => {
    for (const [persona, topic, n] of [["steering", "c4", 28], ["offtopic", "c6", 36]]) {
      const { out, last } = await at(persona, topic, n);
      assert.equal(last.before.pendingWhy, last.before.activeItemId, "the row is a probe reply on a card closed by its verdict");
      assert.doesNotMatch(out.reply, /Pichhle sawaal ka (?:sahi )?jawab/i, `${persona} ${topic} row ${n}: ${out.reply}`);
      assert.equal(last.state.lastMove?.gave, undefined);
    }
  });
  for (const persona of ["offtopic", "steering", "steady", "stuck"]) for (const topic of Object.keys(TOPIC)) {
    test(`T1″ predicate: one close per worked card, no carried close after a probe reply (${persona} ${topic})`, async () => {
      assert.deepEqual(await twoCloses(persona, topic), []);
    });
  }

  // L1 — a Hindi request is heard and switches her lines
  const L1_ROWS = [["offtopic", "c4", 34], ["offtopic", "c5-t01", 34], ["offtopic", "c5-t02", 34], ["offtopic", "c6", 32], ["steady", "c4", 36],
    ["steady", "c5-t01", 38], ["steady", "c5-t02", 36], ["steady", "c6", 36], ["steering", "c4", 8], ["steering", "c5-t01", 8],
    ["steering", "c5-t02", 8], ["steering", "c6", 8], ["stuck", "c4", 8]];
  const ENGLISH_W = /(?<![\p{L}])(?:fractions?|parts?|pieces?|sides?|perimeter|total|marks?|lines?|equal|answer|steps?)(?![\p{L}])/iu;
  test("L1 predicate: a Hindi request turn opens by saying the switch (never a bare \"Zaroor.\"), and her lines after it carry no English teaching words (judges' 13 requests)", async () => {
    const bad = [];
    for (const [persona, topic, n] of L1_ROWS) {
      const { out, last } = await at(persona, topic, n);
      const tag = `${persona} ${topic} row ${n}`;
      if (last.state.lastMove?.request !== "language") { bad.push(`${tag}: not read as a language request`); continue; }
      const first = sentences(out.reply)[0] ?? "";
      if (!/hindi/i.test(first) || /^zaroor[.!]?$/i.test(first)) bad.push(`${tag}: no switch said | ${out.reply.slice(0, 120)}`);
      for (const k of [n, n + 2, n + 4]) {
        const r = k === n ? { out, last } : await at(persona, topic, k);
        const item = r.last.state.activeItemId ? findItem(r.last.state, r.kit, r.last.state.activeItemId) : null;
        const keyW = [item?.answer, ...(item?.acceptable ?? [])].map((x) => String(x ?? "").toLowerCase()).join(" ");
        const eng = (r.out.reply.match(new RegExp(ENGLISH_W.source, "giu")) ?? []).filter((w) => !keyW.includes(w.toLowerCase()));
        if (eng.length) bad.push(`${tag} (+${k - n}): English words ${eng.join(", ")} | ${r.out.reply.slice(0, 140)}`);
      }
    }
    assert.deepEqual(bad, []);
  });
});
