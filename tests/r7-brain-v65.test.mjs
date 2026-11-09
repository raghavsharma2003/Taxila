// dc-r7-script-walk-v6-5 (main's director13 judgement, four hand judges): each fix is a PREDICATE pinned on director13's own rows
// (0-based rows of the run's .json), replayed through turn.js planTurn (tests/fixtures/replay.mjs) and textReply with the run's own
// v2.3 scripts and her own words.
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { replay, runScriptOf } from "./fixtures/replay.mjs";
import { textReply, replyDeps } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { instructionsFor } from "../server/compiler/instructions.js";
import { setScriptForTest } from "../server/director/script.js";
import { findItem } from "../server/director/items.js";
import { whiteboardIntentOf, boardItemOf, cardPageRefused } from "../server/brain/propose.js";

const RUN = "2026-11-09-director13";
const TOPIC = { c4: "c4-maths-ch05-t01", "c5-t01": "c5-maths-ch02-t01", "c5-t02": "c5-maths-ch02-t02", c6: "c6-maths-ch06-t01" };
const sentences = (t) => (String(t ?? "").match(/[^.!?।]+[.!?।]*/g) ?? []).map((x) => x.trim()).filter(Boolean);

describe("r7-brain-v65.test.mjs", () => {
  const KEEP = {};
  beforeEach(() => { KEEP.s = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT; setScriptForTest(); });
  afterEach(() => { replyDeps.chat = chat; setScriptForTest(); if (KEEP.s === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = KEEP.s; });

  /** Row n (0-based, a teacher row) replayed: her line now (the run's own draft), the state, and the pages the seam would send.
   *  `lastMove` merges into the replayed move (what production's turn.js adds from Studio's pick, e.g. altView). */
  const at = async (persona, topic, n, { lastMove = null } = {}) => {
    const T = TOPIC[topic];
    setScriptForTest(T, runScriptOf(RUN, T));
    const { kit, rows, last } = await replay(RUN, persona, T, n + 1);
    const state = lastMove ? { ...last.state, lastMove: { ...last.state.lastMove, ...lastMove } } : last.state;
    replyDeps.chat = async () => ({ text: rows[n].text });
    const out = await textReply({ instructions: instructionsFor(state, kit), state, kit, childText: last.child, history: [], ui: last.p.r.ui, module: null });
    const item = boardItemOf(state, kit, findItem);
    const a = whiteboardIntentOf({ lessonId: `v65-${persona}-${topic}-${n}`, turn: state.turn, beat: { id: "visual", type: "explain" }, next: state, kit, item, line: { text: out.reply, parts: out.guard.parts } });
    return { out, rows, last, state, kit, ask: a };
  };

  // P3 — a picture turn is its own page: the second view with its own one line; the card is not said over it
  // (each row's second view as Studio drew it in director13: rows[n].screen.altView; the example view's strip from its line)
  const P3_ROWS = [
    ["steady", "c5-t01", 18, { view: "example", parts: 4, labels: ["1/4"] }],
    ["stuck", "c5-t01", 18, { view: "example", parts: 4, labels: ["1/4"] }],
    ["offtopic", "c5-t01", 26, { view: "parts", labels: [] }],
    ["steering", "c5-t01", 14, { view: "parts", labels: [] }],
    ["steady", "c5-t02", 18, { view: "parts", labels: [] }],
    ["offtopic", "c5-t02", 28, { view: "parts", labels: [] }],
  ];
  test("P3 predicate: a picture turn drawn as a second view says that view's one line and no card over it (judges' 6 rows)", async () => {
    const bad = [];
    for (const [persona, topic, n, altView] of P3_ROWS) {
      const { out, last, ask } = await at(persona, topic, n, { lastMove: { altView } });
      const tag = `${persona} ${topic} row ${n}`;
      if (last.state.lastMove?.request !== "visual" && !last.state.lastMove?.visual) { bad.push(`${tag}: not a picture turn`); continue; }
      const card = String(last.p.r.ui?.ask?.text ?? "");
      const cardS = sentences(card).filter((x) => x.length > 12);
      const said = cardS.filter((x) => out.reply.includes(x.replace(/[.!?।]+$/, "")));
      if (said.length) bad.push(`${tag}: the card said over the second view | ${out.reply.slice(0, 160)}`);
      if (/[?？]/.test(out.reply)) bad.push(`${tag}: a question over the second view | ${out.reply.slice(0, 160)}`);
      if (ask.intent.segments?.length) bad.push(`${tag}: ${ask.intent.segments.length + 1} pages`);
      if (sentences(out.reply).length > 2) bad.push(`${tag}: more than the view's line and one pointer | ${out.reply}`);
    }
    assert.deepEqual(bad, []);
  });

  // P2′ — a card whose own page Studio refuses is not said over the page before it
  const P2B_ROWS = [["steady", "c4", 56], ["steady", "c4", 60], ["offtopic", "c4", 56]];
  test("P2′ predicate: a refused card page means no line about that card's figure; the part is dropped and logged (judges' 3 rows)", async () => {
    const bad = [];
    for (const [persona, topic, n] of P2B_ROWS) {
      const { out, last, state, kit } = await at(persona, topic, n);
      const tag = `${persona} ${topic} row ${n}`;
      const card = String(last.p.r.ui?.ask?.text ?? "");
      const item = boardItemOf(state, kit, findItem);
      const refused = cardPageRefused({ lessonId: `v65p2-${persona}-${n}`, turn: state.turn, next: state, kit, item, line: { text: out.reply, parts: out.guard.parts } });
      if (card && out.reply.includes(card.slice(0, 30)) && refused) bad.push(`${tag}: the card said, its page refused | ${out.reply.slice(-140)}`);
      if (!out.reply.includes(card.slice(0, 30)) && !out.guard.cardPageDropped) bad.push(`${tag}: the card left out with no log`);
    }
    assert.deepEqual(bad, []);
  });
});
