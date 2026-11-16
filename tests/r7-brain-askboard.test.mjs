// main 2026-11-08 (for Studio's second views): an explain ask's own figure (ask.board, unmarked) is the card's board while the ask
// is live, and an explain ask carries its answers (Studio e101bdc1 reads scriptBeat.answers[0] to hold the key back)
import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { setScriptForTest } from "../server/director/script.js";
import { initLessonState, step } from "../server/director/state.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { whiteboardIntentOf, boardItemOf } from "../server/brain/propose.js";
import { findItem } from "../server/director/items.js";
import { CTX, cls } from "./fixtures/kit.mjs";

describe("r7-brain-askboard.test.mjs", () => {
  const T = "c5-maths-ch02-t01";
  const live = () => JSON.parse(readFileSync(new URL(`../data/lesson-scripts/${T}.json`, import.meta.url), "utf8"));
  const KEEP = {};
  beforeEach(() => { KEEP.s = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT; setScriptForTest(); });
  afterEach(() => { setScriptForTest(); if (KEEP.s === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = KEEP.s; });
  const walkTo = (beatId) => {
    const K = kitFromFile(getTopic(T));
    let r = step(initLessonState({ topicId: T, kit: K, ctx: { ...CTX, classLevel: 5, lang: "hinglish" }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
    for (let i = 0; i < 30 && !String(r.state.activeItemId ?? "").endsWith(`:ask:${beatId}`); i++) {
      const card = r.state.activeItemId && r.state.scriptCard?.id === r.state.activeItemId ? r.state.scriptCard : null;
      r = step({ ...r.state, recent: [...(r.state.recent ?? []), { who: "teacher", text: "x" }] }, { event: "turn", kit: K, cls: card ? cls("correct") : cls("no_evidence"), text: card ? String(card.answer) : "haan", now: (r.state.turn + 1) * 20_000 });
    }
    assert.ok(String(r.state.activeItemId).endsWith(`:ask:${beatId}`), `reached ${beatId}: ${r.state.activeItemId}`);
    return { K, r };
  };
  const intentOf = ({ K, r }) => whiteboardIntentOf({ lessonId: "ab", turn: r.state.turn, beat: { id: "visual", type: "explain" }, next: r.state, kit: K, item: boardItemOf(r.state, K, findItem), line: { text: r.state.scriptCard?.prompt_hi ?? "" } }).intent;

  test("an explain ask's scriptBeat carries its answers, the key first (c5-t01 e2: key 8)", () => {
    const sc = live();
    const e2 = sc.skills[0].explain.find((b) => b.id === "e2");
    setScriptForTest(T, sc);
    const L = walkTo("e2");
    const sb = L.r.state.lastMove?.scriptBeat;
    assert.equal(sb?.beatId, "e2");
    assert.equal(sb.answers?.[0], String(e2.ask.key), JSON.stringify(sb));
    assert.equal(intentOf(L).scriptBeat?.answers?.[0], String(e2.ask.key), "and on the whiteboard ask");
  });

  test("an ask with its own (unmarked) board is drawn on that board while it is live, ownBoard, with its answers", () => {
    const sc = live();
    const e3 = sc.skills[0].explain.find((b) => b.id === "e3");
    const own = { template: "number-line-scale@1", params: { dens: [5, 10] } };
    e3.ask.board = own;
    setScriptForTest(T, sc);
    const L = walkTo("e3");
    const cb = L.r.state.lastMove?.cardBeat;
    assert.deepEqual(cb?.board, own, JSON.stringify(cb));
    assert.equal(cb.ownBoard, true);
    assert.equal(cb.answers?.[0], String(e3.ask.key));
    const it = intentOf(L);
    const pages = [{ boardRef: it.boardRef, ofCard: it.ofCard }, ...(it.segments ?? [])];
    const cardPage = pages.at(-1);
    assert.deepEqual(cardPage.boardRef, own, JSON.stringify(pages));
    assert.equal(cardPage.ofCard, true);
  });
});
