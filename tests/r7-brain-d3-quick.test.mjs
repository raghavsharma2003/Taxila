// round 7 (main's director3 judgement, quick fixes alongside the teaching-scripts block), on the director3 turns.
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { textReply, replyDeps, belowLevel, rateAsFraction } from "../server/brain/say.js";
import { renderWorked } from "../server/director/worked.js";
import { chat } from "../server/azure.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { CTX, cls } from "./fixtures/kit.mjs";
import { kitPath } from "./fixtures/kit-path.mjs";

const FLAGS = ["TAXILA_R7_ONE_LIVE", "TAXILA_R7_PARK_TOPIC", "TAXILA_R7_FRUSTRATION", "TAXILA_R7_BYE_CHECKIN", "TAXILA_R7_WORKED_CODE"];
const KEEP = {};
describe("r7-brain-d3-quick (kit path: lesson scripts off)", () => {
kitPath();
describe("director3 quick fixes", () => {
  beforeEach(() => { for (const k of FLAGS) { KEEP[k] = process.env[k]; delete process.env[k]; } });
  afterEach(() => { replyDeps.chat = chat; for (const k of FLAGS) { if (KEEP[k] === undefined) delete process.env[k]; else process.env[k] = KEEP[k]; } });

  test("c6: counting a rectangle's bhujayein aloud is below class 6; adding them is not", () => {
    assert.equal(belowLevel("Aayat mein chaar bhujayein hoti hain. Ab ginein: ek, do, teen, chaar.", 6), true);
    assert.equal(belowLevel("Chaaron bhujayein jodo: 50 + 30 + 50 + 30.", 6), false);
  });

  test("c5: a rate read as a fraction is caught and never ships", async () => {
    assert.equal(rateAsFraction("Cricket mein fractions bhi hain: 5 balls mein 2 runs, score hua 2/5."), true);
    const K = kitFromFile(getTopic("c5-maths-ch02-t01"));
    let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 5, lang: "hinglish" }, seed: 3, now: 0 }), { event: "start", kit: K, now: 0 });
    for (let i = 0; i < 6 && !r.ui?.ask; i++) r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), text: "haan", now: (i + 1) * 20_000 });
    replyDeps.chat = async () => ({ text: `Cricket mein fractions bhi hain: 5 balls mein 2 runs, score hua 2/5. ${r.ui?.ask?.text ?? "Kitne?"}` });
    const out = await textReply({ instructions: "x", state: { ...r.state, mode: "text" }, kit: K, childText: "cricket", verdict: "ungraded", history: [], ui: r.ui, module: null });
    assert.equal(rateAsFraction(out.reply), false, out.reply);
  });

  test("c4: a faded gap at step 0 still states the worked example's givens", () => {
    const we = kitFromFile(getTopic("c4-maths-ch05-t01")).workedExample;
    assert.deepEqual(renderWorked(we, { part: 1, parts: 1, upTo: 0 }), ["Diya hai: 1/3 aur 15."]);
  });

  test("a card let go after misses says its key in the lesson language and a real why ('jawab before' never again)", () => {
    const K = kitFromFile(getTopic("c6-maths-ch06-t01"));
    let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6, lang: "hinglish" }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
    const t = (text, c = cls("no_evidence")) => { r = step(r.state, { event: "turn", kit: K, cls: c, text, now: (r.state.turn + 1) * 20_000 }); };
    for (const x of ["haan", "pata nahi", "4", "kyun?", "achha samajh gaya"]) t(x);
    t("6", cls("incorrect")); t("ek aur example do", { ...cls("no_evidence"), request: { type: "example", whole: true } }); t("theek hai"); t("8", cls("incorrect"));
    assert.equal(r.move.gave?.answer, "480");
    assert.match(r.move.gave?.why ?? "", /3 × 160 = 480/);
  });

  test("her name opens a line at most once in three turns", async () => {
    const K = kitFromFile(getTopic("c6-maths-ch06-t01"));
    const r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, firstName: "Riya", classLevel: 6, lang: "hinglish" }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
    const n = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), text: "haan", now: 20_000 });
    replyDeps.chat = async () => ({ text: "Riya, perimeter matlab boundary ki poori lambai. Batao, ek square ki chaaron sides barabar hoti hain na?" });
    const out = await textReply({ instructions: "x", state: { ...n.state, mode: "text" }, kit: K, childText: "haan", verdict: "ungraded", history: [{ who: "teacher", text: "Riya, aaj perimeter dekhenge." }], ui: n.ui, module: null });
    assert.doesNotMatch(out.reply, /^Riya/, out.reply);
  });
});
});
