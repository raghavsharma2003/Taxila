// round 7 S2 (main's director2 decision: "worked examples are CODE-rendered from the kit's verified worked example: givens,
// then steps, then the answer, in the lesson language; the model words only the connective tissue"). Pure.
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { renderWorked, givensOf, chainOf, factOf, answerOf } from "../server/director/worked.js";
import { initLessonState, step } from "../server/director/state.js";
import { textReply, replyDeps } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { CTX, cls } from "./fixtures/kit.mjs";

const C6 = kitFromFile(getTopic("c6-maths-ch06-t01"));
const C4 = kitFromFile(getTopic("c4-maths-ch05-t01"));

test("the kit's worked example as code lines: givens, each calculation, the answer (Hinglish and English)", () => {
  assert.deepEqual(givensOf(C6.workedExample.problem), ["3", "50 m", "30 m"]);
  assert.equal(chainOf("Perimeter = 2 × (50 + 30) = 2 × 80 = 160 m."), "2 × (50 + 30) = 2 × 80 = 160 m");
  assert.equal(chainOf("One round is the perimeter of the park."), null);
  assert.equal(factOf("So 1/3 of 15 is 5.", "hinglish"), "15 ka 1/3 = 5");
  assert.equal(factOf("Share 15 pencils into 3 equal groups.", "english"), "3 equal parts");
  assert.equal(answerOf(C6.workedExample), "480 m");
  assert.deepEqual(renderWorked(C6.workedExample, { part: 1, parts: 1 }),
    ["Diya hai: 3, 50 m aur 30 m.", "Pehle: 2 × (50 + 30) = 2 × 80 = 160 m.", "Phir: 3 × 160 = 480 m.", "Toh jawab: 480 m."]);
  assert.deepEqual(renderWorked(C4.workedExample, { part: 1, parts: 1, lang: "english" }).at(-1), "So the answer is: 5.");
  // a faded step's gap is never rendered before it is posed: upTo stops before it, and no answer line
  const lead = renderWorked(C6.workedExample, { part: 1, parts: 1, upTo: 2 });
  assert.ok(lead.every((l) => !/480/.test(l)), JSON.stringify(lead));
  assert.equal(renderWorked({ problem: "Look at the cat.", steps: ["Look first."] }), null, "nothing code can read: the model words it");
});

const FLAGS = ["TAXILA_R7_PARK_TOPIC", "TAXILA_R7_BYE_CHECKIN", "TAXILA_R7_FRUSTRATION", "TAXILA_R7_WORKED_CODE"];
const KEEP = {};
describe("S2 in the lesson", () => {
  beforeEach(() => { for (const k of FLAGS) { KEEP[k] = process.env[k]; delete process.env[k]; } });
  afterEach(() => { replyDeps.chat = chat; for (const k of FLAGS) { if (KEEP[k] === undefined) delete process.env[k]; else process.env[k] = KEEP[k]; } });

  test("a worked_example move carries the rendered lines and her turn speaks them after one framing sentence", async () => {
    let r = step(initLessonState({ topicId: C6.topicId, kit: C6, ctx: { ...CTX, classLevel: 6, ageBand: "10-15", lang: "hinglish" }, seed: 3, now: 0 }), { event: "start", kit: C6, now: 0 });
    for (let i = 0; i < 8 && r.move.kind !== "worked_example"; i++) r = step(r.state, { event: "turn", kit: C6, cls: cls("no_evidence"), text: "haan", now: (i + 1) * 20_000 });
    assert.equal(r.move.kind, "worked_example");
    assert.ok(r.move.rendered?.length, JSON.stringify(r.move));
    // the model writes a whole worked example with its own numbers and a question: only its first sentence survives, if clean
    replyDeps.chat = async () => ({ text: "Rani ek park ke chaaron taraf daudti hai. Ek round 150 m hai, toh 3 round kitna?" });
    const out = await textReply({ instructions: "x", state: { ...r.state, mode: "text" }, kit: C6, childText: "haan", verdict: "ungraded", history: [], ui: r.ui, module: null });
    assert.ok(out.reply.startsWith("Rani ek park ke chaaron taraf daudti hai."), out.reply);
    for (const l of r.move.rendered) assert.ok(out.reply.includes(l), `${l} in ${out.reply}`);
    assert.doesNotMatch(out.reply, /150/);
  });

  test("TAXILA_R7_WORKED_CODE=off: no rendered lines on the move", () => {
    process.env.TAXILA_R7_WORKED_CODE = "off";
    let r = step(initLessonState({ topicId: C6.topicId, kit: C6, ctx: { ...CTX, classLevel: 6, ageBand: "10-15", lang: "hinglish" }, seed: 3, now: 0 }), { event: "start", kit: C6, now: 0 });
    for (let i = 0; i < 8 && r.move.kind !== "worked_example"; i++) r = step(r.state, { event: "turn", kit: C6, cls: cls("no_evidence"), text: "haan", now: (i + 1) * 20_000 });
    assert.equal(r.move.rendered, undefined);
  });
});
