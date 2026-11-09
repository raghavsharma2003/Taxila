// dc-r7-script-walk-v6-6 (main's director14 judgement, four hand judges): each fix is a PREDICATE pinned on director14's own rows
// (0-based rows of the run's .json), replayed through turn.js planTurn (tests/fixtures/replay.mjs) and textReply with the run's own
// v2.3 scripts and her own words.
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { drawnContradictionsOf } from "../evals/hybrid-side-by-side/drawn-pages.mjs";
import { scriptsOf, answerBoardOf } from "../evals/hybrid-side-by-side/proxies-v64.mjs";
import { pictureMismatch } from "../evals/hybrid-side-by-side/checks.mjs";
import { replay, runScriptOf } from "./fixtures/replay.mjs";
import { textReply, replyDeps } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { setScriptForTest } from "../server/director/script.js";
import { findItem } from "../server/director/items.js";
import { whiteboardIntentOf, boardItemOf } from "../server/brain/propose.js";
import { joinParts } from "../server/brain/lineParts.js";
import { liveBeatSimpler, requeueMissedReturn } from "../server/director/state.js";
import { returnLineOk, honestTasteLine } from "../server/brain/say.js";

const RUN = "2026-11-09-director14";
const DIR = new URL(`../evals/hybrid-side-by-side/results/${RUN}/`, import.meta.url).pathname;
const TOPIC = { c4: "c4-maths-ch05-t01", "c5-t01": "c5-maths-ch02-t01", "c5-t02": "c5-maths-ch02-t02", c6: "c6-maths-ch06-t01" };
const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
const TAG = { "c4-ch05-t01": "c4", "c5-ch02-t01": "c5-t01", "c5-ch02-t02": "c5-t02", "c6-ch06-t01": "c6" };

describe("r7-brain-v66.test.mjs", () => {
  const KEEP = {};
  beforeEach(() => { KEEP.s = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT; setScriptForTest(); });
  afterEach(() => { replyDeps.chat = chat; setScriptForTest(); if (KEEP.s === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = KEEP.s; });

  /** Row n (0-based, a teacher row) of director14 replayed: her line now (the run's own words as her draft), the state, the pages. */
  const at = async (persona, topic, n, { lastMove = null, draft = null } = {}) => {
    const T = TOPIC[topic];
    setScriptForTest(T, runScriptOf(RUN, T));
    const { kit, rows, last } = await replay(RUN, persona, T, n + 1);
    const state = lastMove ? { ...last.state, lastMove: { ...last.state.lastMove, ...lastMove } } : last.state;
    replyDeps.chat = async () => ({ text: draft ?? rows[n].text });
    const out = await textReply({ instructions: instructionsFor(state, kit), state, kit, childText: last.child, history: [], ui: last.p.r.ui, module: null });
    const item = boardItemOf(state, kit, findItem);
    const a = whiteboardIntentOf({ lessonId: `v66-${persona}-${topic}-${n}`, turn: state.turn, beat: { id: "visual", type: "explain" }, next: state, kit, item, line: { text: out.reply, parts: out.guard.parts } });
    return { out, rows, last, state, kit, ask: a };
  };
  const pagesOf = (ask) => [{ atChar: 0, boardRef: ask.intent.boardRef }, ...(ask.intent.segments ?? [])];
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  describe("P4: pages by construction", () => {
    // main's 17 paging rows on director14 (a graded close then the next card, the close paged onto the card's board)
    const P4_ROWS = [["steady", "c4", 54], ["stuck", "c5-t01", 26], ["stuck", "c5-t01", 70], ["offtopic", "c5-t01", 16], ["offtopic", "c5-t01", 46],
      ["offtopic", "c5-t01", 62], ["steering", "c5-t01", 48], ["steady", "c5-t02", 42], ["steady", "c5-t02", 46], ["steady", "c5-t02", 66],
      ["steering", "c5-t02", 46], ["steady", "c6", 50], ["steady", "c6", 72], ["stuck", "c6", 54], ["offtopic", "c6", 12], ["offtopic", "c6", 66]];
    test("a graded close plus a next card is ≥ 2 pages, the first on the answered card's board; the parts are the line, in order (16 rows)", async () => {
      const bad = []; let checked = 0;
      for (const [persona, topic, n] of P4_ROWS) {
        const { out, state, ask } = await at(persona, topic, n);
        const tag = `${persona} ${topic} row ${n}`;
        const list = out.guard.parts?.list ?? null;
        if (!list) { bad.push(`${tag}: no parts list`); continue; }
        if (joinParts(list) !== norm(out.reply)) bad.push(`${tag}: the parts are not the line`);
        const graded = ["correct", "not_yet"].includes(state.lastVerdict);
        const cb = state.lastMove?.closeBeat;
        if (!graded || !cb?.board) continue;
        checked++;
        const pages = pagesOf(ask);
        const answerB = cb.answerBoard ?? null;
        if (!same(pages[0].boardRef, cb.board) && !same(pages[0].boardRef, answerB)) bad.push(`${tag}: first page ${pages[0].boardRef?.template} not the answered card's ${cb.board.template}`);
        // (her line goes on past the close onto another board — the next card, the next beat — so the turn is paged)
        // (a probe on the card just answered is asked on that card's board, by design)
        const onwards = state.lastMove?.kind !== "probe" && list.some((p) => ["body", "card", "bridge", "simpler"].includes(p.part)) && [state.lastMove?.scriptBeat?.board, state.lastMove?.cardBeat?.board].some((b) => b && !same(b, cb.board));
        if (onwards && pages.length < 2) bad.push(`${tag}: one page | ${out.reply.slice(0, 90)}`);
      }
      assert.deepEqual(bad, []);
      assert.ok(checked >= 12, `only ${checked} rows were a graded close with a next card`);
    });
    test("an edit after the assembly (a frame swap, a dropped sentence) keeps the close on its page", async () => {
      // (her draft with a taste claim after the verdict: F2 drops it after the assembly, F1 may swap the opening)
      const row = JSON.parse(readFileSync(DIR + "steady-c6-ch06-t01.json", "utf8")).director[50].text;
      const draft = row.replace(/^Bilkul sahi,/, "Haan, sahi hai,").replace(/30 m\. /, "30 m. Mujhe bhi cricket bahut pasand hai. ");
      const { out, state, ask } = await at("offtopic", "c6", 12, { draft: JSON.parse(readFileSync(DIR + "offtopic-c6-ch06-t01.json", "utf8")).director[12].text.replace(/^Bilkul sahi,/, "Haan, sahi hai,").replace(/30 cm\. /, "30 cm. Mujhe bhi cricket bahut pasand hai. ") });
      void draft;
      assert.doesNotMatch(out.reply, /pasand/);
      const pages = pagesOf(ask);
      assert.ok(pages.length >= 2, out.reply);
      assert.deepEqual(pages[0].boardRef, state.lastMove.closeBeat.board);
    });
  });
  describe("P4: a picture turn", () => {
    // main's 4 second-view rows (c5-t01): the card's page must be the card's own board, never the second view
    const PIC = [["steady", "c5-t01", 18], ["stuck", "c5-t01", 18], ["offtopic", "c5-t01", 26], ["steering", "c5-t01", 14]];
    test("is the alt page then the card's own page — or, with no picture line, the card alone on its own board (no second view asked)", async () => {
      const bad = [];
      for (const [persona, topic, n] of PIC) {
        const { out, ask, state } = await at(persona, topic, n);
        const tag = `${persona} ${topic} row ${n}`;
        const list = out.guard.parts?.list ?? [];
        const pages = pagesOf(ask);
        const hasAlt = list.some((p) => p.part === "alt"), hasCard = list.some((p) => p.part === "card");
        if (hasAlt && hasCard) {
          if (pages.length !== 2 || ask.intent.ofCard !== false || pages[1].ofCard !== true) bad.push(`${tag}: ${pages.length} pages, ofCard ${ask.intent.ofCard}/${pages[1]?.ofCard}`);
          if (!ask.intent.request) bad.push(`${tag}: the alt page is not asked as the picture`);
        } else if (hasCard && ask.intent.request) bad.push(`${tag}: the bare card asked as a picture (the second view under the card's words)`);
        if (state.lastMove?.request !== "visual" && !state.lastMove?.visual) bad.push(`${tag}: not a picture turn`);
      }
      assert.deepEqual(bad, []);
    });
  });
  describe("B1′: a Hindi request re-says the live beat's own simpler, then the card", () => {
    // (the walk changes, so the replay walks it live: recordedRun off)
    const atLive = async (persona, topic, n) => {
      const T = TOPIC[topic];
      const sc = runScriptOf(RUN, T); delete sc.recordedRun;
      setScriptForTest(T, sc);
      const { kit, rows, last } = await replay(RUN, persona, T, n + 1);
      replyDeps.chat = async () => ({ text: rows[n].text });
      const out = await textReply({ instructions: instructionsFor(last.state, kit), state: last.state, kit, childText: last.child, history: [], ui: last.p.r.ui, module: null });
      return { out, last, kit };
    };
    const ROWS = [["steady", "c4", 36], ["offtopic", "c4", 34], ["steady", "c6", 38], ["stuck", "c6", 8], ["offtopic", "c6", 32], ["steering", "c5-t01", 8]];
    test("the live beat's simpler, on that beat's board, then the card re-posed; never another beat's (main's c4 and c6 rows)", async () => {
      const bad = [];
      for (const [persona, topic, n] of ROWS) {
        const { out, last, kit } = await atLive(persona, topic, n);
        const tag = `${persona} ${topic} row ${n}`;
        const lm = last.state.lastMove ?? {};
        if (lm.request !== "language") { bad.push(`${tag}: not a language request (${lm.request})`); continue; }
        const lb = liveBeatSimpler(last.state, kit);
        if (!lb) { bad.push(`${tag}: no live beat simpler`); continue; }
        if (lm.simpler !== lb.text) bad.push(`${tag}: the simpler is not the live beat's`);
        const head = norm(lb.text).split(" ").slice(0, 4).join(" ");
        if (!norm(out.reply).includes(head)) bad.push(`${tag}: the live beat's simpler not said | ${out.reply.slice(0, 120)}`);
        const card = norm(last.p.r.ui?.ask?.text ?? "");
        if (card && !norm(out.reply).endsWith(card)) bad.push(`${tag}: the card not re-posed last`);
        if (/apna tareeka batao/i.test(out.reply)) bad.push(`${tag}: a question of hers outside the card`);
      }
      assert.deepEqual(bad, []);
    });
  });
  describe("A2: asides", () => {
    test("a return answers, never echoes: praise of their words or two of their words back is no return (director14 ×4)", () => {
      const said = "kal maine cricket khela, sixer maara";
      for (const x of ["Wah, tumne cricket mein zabardast sixer maara!", "Haan Riya, kal tumne cricket khela aur sixer maara—ball ne boundary ki sair kar li!"]) assert.equal(returnLineOk(x, said, "cricket"), false, x);
      assert.equal(returnLineOk("Cricket ke saath woh pal sach mein khaas raha hoga.", said, "cricket"), true);
    });
    test("the honest line never presumes their taste, ends on one question to them, and is short and different the second time", () => {
      const a = honestTasteLine("Virat", "hinglish", 1), b = honestTasteLine("Virat", "hinglish", 2), c = honestTasteLine("Virat", "hinglish", 3);
      for (const x of [a, b, c]) {
        assert.doesNotMatch(x, /tumhari pasand hai|is yours/i, x);
        assert.equal((x.match(/\?/g) ?? []).length, 1, x);
        assert.ok(x.trim().endsWith("?"), x);
      }
      assert.notEqual(a, b); assert.notEqual(b, c);
      assert.ok(b.split(/\s+/).length < a.split(/\s+/).length, b);
    });
    test("a return her line did not say goes back on the queue (the next boundary, the wrap at the latest)", () => {
      const s = { turn: 9, lastMove: { returned: { topic: "cricket" } }, later: [{ id: "p1", topic: "cricket", at: 4, servedAt: 9, share: true }] };
      assert.equal(requeueMissedReturn(s, { returnMissed: true }).later[0].servedAt, null);
      assert.equal(requeueMissedReturn(s, { returnSaid: true }).later[0].servedAt, 9);
    });
  });
  describe("H3: contradictions read from the pages drawn", () => {
    // main's 22 hand rows on director14 (17 paging, 4 second view, 1 model words)
    const HAND = ["c4 steady 20", "c4 steady 54", "c5-t01 steady 18", "c5-t01 stuck 18", "c5-t01 offtopic 26", "c5-t01 steering 14",
      "c5-t01 stuck 26", "c5-t01 stuck 70", "c5-t01 offtopic 16", "c5-t01 offtopic 46", "c5-t01 offtopic 62", "c5-t01 steering 48",
      "c5-t02 steady 42", "c5-t02 steady 46", "c5-t02 steady 66", "c5-t02 steering 46", "c5-t02 stuck 54",
      "c6 steady 50", "c6 steady 72", "c6 stuck 54", "c6 offtopic 12", "c6 offtopic 66"];
    test("recall ≥ 20/22 with ≤ 2 false flags on director14", () => {
      const scripts = scriptsOf(DIR);
      const got = new Set();
      for (const f of readdirSync(DIR).filter((x) => /^(steady|offtopic|stuck|steering)-.*\.json$/.test(x))) {
        const j = JSON.parse(readFileSync(DIR + f, "utf8"));
        const persona = f.split("-")[0], tag = TAG[f.slice(f.indexOf("-") + 1, -5)];
        for (const d of drawnContradictionsOf(j.director, { answerBoardOf: (id) => answerBoardOf(scripts, j.topicId, id) })) got.add(`${tag} ${persona} ${d.i}`);
      }
      const hit = HAND.filter((k) => got.has(k));
      const falseFlags = [...got].filter((k) => !HAND.includes(k));
      assert.ok(hit.length >= 20, `recall ${hit.length}/22; missed ${HAND.filter((k) => !got.has(k)).join(", ")}`);
      assert.ok(falseFlags.length <= 2, `false flags: ${falseFlags.join(", ")}`);
    });
    test("the unrolled checker hears 'patti'", () => {
      const board = { template: "measured@1", params: { shape: "triangle", unit: "cm", sides: [4, 5, 6] } };
      assert.deepEqual(pictureMismatch("Screen par dekho: teeno bhujayein ek seedhi patti par.", board, "unrolled"), []);
    });
  });
});
