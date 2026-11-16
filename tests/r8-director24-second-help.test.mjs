// dc-r8-director24 H3 under main's 035 and 037: a second request for help on the same part gets the worked answer with its board and the
// card is closed; a Hindi request is no request for help and is counted on its own — a second Hindi request on the same part gets the
// worked answer; with nothing unsaid left, a Hindi request says the same part again in Hindi words, its switch line saying so.
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initLessonState, step } from "../server/director/state.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { setScriptForTest } from "../server/director/script.js";
import { PREDICATES } from "../evals/hybrid-side-by-side/dry-predicates.mjs";

describe("r8-director24-second-help", () => {
  const KEEP = {};
  beforeEach(() => { KEEP.s = process.env.TAXILA_R7_SCRIPT; process.env.TAXILA_R7_SCRIPT = "on"; setScriptForTest(); });
  afterEach(() => { setScriptForTest(); if (KEEP.s === undefined) delete process.env.TAXILA_R7_SCRIPT; else process.env.TAXILA_R7_SCRIPT = KEEP.s; });

  const T = "c5-maths-ch02-t01";
  const sc = JSON.parse(readFileSync(new URL(`../data/lesson-scripts/${T}.json`, import.meta.url), "utf8"));
  const e1 = sc.skills[0].explain[0];
  const cls = (o, request = null) => ({ outcome: o, confidence: 0.9, flags: {}, ...(request ? { request } : {}) });
  const atCard = () => {
    const K = kitFromFile(getTopic(T));
    let r = step(initLessonState({ topicId: T, kit: K, ctx: { firstName: "Riya", lang: "hinglish", classLevel: 5, ageBand: "10-15", lessonKey: "h3" }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
    for (let i = 0; i < 10 && !r.state.activeItemId; i++) r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), text: "theek hai", now: (r.state.turn + 1) * 20_000 });
    return { K, r: { ...r, state: { ...r.state, recent: [...(r.state.recent ?? []), { who: "teacher", text: `${e1.point.hi} ${r.ui.ask.text}` }] } } };
  };
  const say = (K, r, text, c) => step(r.state, { event: "turn", kit: K, cls: c, text, now: (r.state.turn + 1) * 20_000 });
  const keyOf = () => String(e1.ask.key);

  test("a clarify, then a give-up on the same card: the worked answer on its board, the card closed", () => {
    const { K, r } = atCard();
    const card = r.state.activeItemId;
    const a = say(K, r, "samajh nahi aaya", cls("no_evidence"));
    assert.equal(a.state.lastMove.cell?.column, "clarify");
    assert.ok(!a.state.lastMove.workedAnswerSaid);
    const b = say(K, a, "pata nahi", cls("no_evidence"));
    assert.equal(b.state.lastMove.cell?.column, "give_up");
    assert.ok(b.state.lastMove.workedAnswerSaid);
    assert.equal(b.state.lastMove.gave?.answer, e1.ask.key);
    assert.ok(String(b.state.lastMove.simpler).includes(keyOf()));
    assert.ok((b.state.skipped ?? []).includes(card));
    assert.equal(b.state.activeItemId, undefined);
  });

  test("a Hindi request is no help request; a second one on the same card gets the worked answer", () => {
    const { K, r } = atCard();
    const hindi = { type: "language", lang: "hindi" };
    const a = say(K, r, "hindi mein samjhao", cls("no_evidence", hindi));
    assert.equal(a.state.lastMove.cell?.column, "hindi");
    assert.ok(!a.state.lastMove.workedAnswerSaid);
    // (a give-up after one Hindi request is the first help request: the card's own hint, no answer)
    const g = say(K, a, "pata nahi", cls("no_evidence"));
    assert.ok(!g.state.lastMove.workedAnswerSaid, g.state.lastMove.simpler);
    // (a second Hindi request on the same card: the worked answer)
    const b = say(K, a, "phir se hindi mein batao", cls("no_evidence", hindi));
    assert.equal(b.state.lastMove.cell?.column, "hindi");
    assert.ok(b.state.lastMove.workedAnswerSaid);
    assert.equal(b.state.lastMove.gave?.answer, e1.ask.key);
  });

  test("hindiNewWords reads 037: the same part again is allowed when the turn says it is the same line again", () => {
    const ctx = { prevRead: "no_evidence · language", o: { teacherTexts: ["Line ke theek beech mein ek mark hai. Woh line ko do barabar gaps mein baant-ta hai."] } };
    const same = "Line ke theek beech mein ek mark hai. Woh line ko do barabar gaps mein baant-ta hai.";
    assert.match(PREDICATES.hindiNewWords("L", { who: "teacher", text: same }, 1, ctx) ?? "", /not said to be the same/);
    assert.equal(PREDICATES.hindiNewWords("L", { who: "teacher", text: `Achha, isi ko Hindi ke shabdon mein phir se kehti hoon. ${same}` }, 1, ctx), null);
    // (the switch line and the card alone is still no new words)
    assert.match(PREDICATES.hindiNewWords("L", { who: "teacher", card: "Batao, 1/3 kahan aata hai?", text: "Achha, isi ko Hindi ke shabdon mein phir se kehti hoon. Batao, 1/3 kahan aata hai?" }, 1, ctx) ?? "", /no new words/);
  });
});
