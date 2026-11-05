// dc-r7-script-walk-v2 R1-R3 (main's director4 judgement: "the walk is a clock, not a teacher"): a v2 beat is done only when its
// keyed question is answered right (or its remediation's follow-up is through); "pata nahi" re-teaches the same beat smaller;
// a diversion never uses a beat up; while a skill is walked, the kit stays silent. On the c6 skill-1 v2 fixture. Pure.
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initLessonState, step } from "../server/director/state.js";
import { setScriptForTest } from "../server/director/script.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { CTX, cls } from "./fixtures/kit.mjs";

const K = kitFromFile(getTopic("c6-maths-ch06-t01"));
const SC = JSON.parse(readFileSync(new URL("./fixtures/scripts/c6-s1-v2.json", import.meta.url), "utf8"));
const S1 = SC.skills[0];
const KEEP = {};
const FLAGS = ["TAXILA_R7_SCRIPT", "TAXILA_R7_ONE_LIVE"];

describe("script walk v2", () => {
  beforeEach(() => { for (const k of FLAGS) { KEEP[k] = process.env[k]; delete process.env[k]; } setScriptForTest(); setScriptForTest(K.topicId, SC); });
  afterEach(() => { setScriptForTest(); for (const k of FLAGS) { if (KEEP[k] === undefined) delete process.env[k]; else process.env[k] = KEEP[k]; } });
  const run = (ctx = {}) => {
    let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6, lang: "hinglish", interests: ["cricket"], ...ctx }, seed: 7, now: 0 }), { event: "start", kit: K, now: 0 });
    const moves = [r.move];
    const t = (text, c = cls("no_evidence"), said) => {
      // her line as spoken (the next turn's delivery check reads it)
      const recent = [...(r.state.recent ?? []), { who: "teacher", text: said ?? (r.move.mustSay ?? []).join(" ") }];
      r = step({ ...r.state, recent }, { event: "turn", kit: K, cls: c, text, now: (r.state.turn + 1) * 20_000 }); moves.push(r.move); return r;
    };
    return { t, moves, get r() { return r; } };
  };
  const toBeat = (L, beatId) => { for (let i = 0; i < 6 && L.r.move.scriptBeat?.beatId !== beatId; i++) L.t("haan"); return L.r; };

  test("the hook is set in the child's interest; e1 teaches its must-say words and poses its own question as the card", () => {
    const L = run();
    L.t("haan");
    assert.equal(L.r.move.scriptBeat.kind, "hook");
    assert.ok(L.r.state.lastContent.some((x) => /Cricket ground/.test(x)), "the cricket slot");
    L.t("haan");
    assert.equal(L.r.move.scriptBeat.beatId, "e1");
    assert.deepEqual(L.r.move.mustSay, ["parimap", "15 cm"]);
    assert.equal(L.r.ui.ask?.itemId, `script:${S1.skillId}:ask:e1`);
    assert.match(L.r.ui.ask.text, /triangle ki bhujayein 3 cm/, "the card in Hinglish");
  });

  test("R1: the beat moves on only when its question is answered right", () => {
    const L = run(); toBeat(L, "e1");
    L.t("12 cm", cls("correct"));
    let i = 0; while (i++ < 3 && L.r.move.scriptBeat?.beatId !== "e2") L.t("haan");
    assert.equal(L.r.move.scriptBeat.beatId, "e2");
  });

  test("R1: 'pata nahi' re-teaches the same beat smaller, with the same card", () => {
    const L = run(); toBeat(L, "e1");
    L.t("pata nahi", { ...cls("no_evidence"), flags: { dontKnow: true } });
    assert.equal(L.r.move.scriptBeat.beatId, "e1");
    assert.match(L.r.move.shape, /smaller step/);
    assert.equal(L.r.ui.ask?.itemId, `script:${S1.skillId}:ask:e1`);
  });

  test("R1: a line that left out the must-say words gets the same beat again", () => {
    const L = run(); toBeat(L, "e1");
    L.t("hmm", cls("no_evidence"), "Chalo ek shape dekhte hain.");
    assert.equal(L.r.move.scriptBeat?.beatId, "e1");
    assert.match(L.r.move.shape, /smaller step/);
  });

  test("R1 + remediation: a wrong answer gets its misconception's remediation, said, and its keyed follow-up", () => {
    const L = run(); toBeat(L, "e1");
    L.t("7 cm", { ...cls("incorrect"), outcome: "misconception", misconceptionId: "c6-maths-ch06-t01-m-missing-sides" });
    assert.equal(L.r.move.scriptBeat.kind, "remediation");
    assert.ok(L.r.state.lastContent.some((x) => /cheenti/.test(x)), "its spoken explanation, in Hinglish");
    L.t("achha");
    assert.equal(L.r.ui.ask?.itemId, `script:${S1.skillId}:then:c6-maths-ch06-t01-m-missing-sides`);
    L.t("38 m", cls("correct"));
    let i = 0; while (i++ < 3 && L.r.move.scriptBeat?.beatId !== "e2") L.t("haan");
    assert.equal(L.r.move.scriptBeat.beatId, "e2", "then the walk goes on");
  });

  test("R2: a diversion does not use the beat up", () => {
    const L = run(); toBeat(L, "e1");
    L.t("mujhe cricket pasand hai", { ...cls("no_evidence"), flags: { offTopic: true } });
    L.t("haan");
    assert.equal(L.r.ui.ask?.itemId, `script:${S1.skillId}:ask:e1`, "the same beat's card");
  });

  test("R3: 'ek aur example do' stays on the current beat, never the kit's worked example", () => {
    const L = run(); toBeat(L, "e1");
    L.t("ek aur example do", { ...cls("no_evidence"), request: { type: "example", whole: true } });
    assert.equal(L.r.move.scriptBeat?.beatId, "e1");
    assert.ok(!L.r.state.lastContent.some((x) => /50 m|30 m/.test(x)), "no kit worked example");
  });

  test("F3: the worked example says each step with its why in Hinglish, then their step is the card; its answer is said next", () => {
    const L = run();
    for (const b of ["e1", "e2"]) { toBeat(L, b); L.t("x", cls("correct")); }
    let i = 0; while (i++ < 4 && L.r.move.scriptBeat?.kind !== "worked") L.t("haan");
    assert.equal(L.r.move.scriptBeat.kind, "worked");
    assert.ok(L.r.move.rendered.some((x) => /kyunki/.test(x)), "the why");
    assert.ok(!L.r.move.rendered.some((x) => /closed five-sided/.test(x)), "no English given");
    assert.equal(L.r.ui.ask?.itemId, `script:${S1.skillId}:ask:worked`);
    L.t("20 m", cls("correct"));
    i = 0; while (i++ < 3 && !L.r.move.gave) L.t("haan");
    assert.equal(L.r.move.gave?.answer, "20 m baad lagegi");
  });

  test("F4: the greet promises the slot's interest, not one the script cannot use", () => {
    const L = run({ interests: ["dinosaurs", "nature"] });
    assert.ok(L.r.state.lastContent !== undefined);
    assert.match(String(L.moves[0].shape), /nature/);
  });
});

test("R4: a sentence naming another shape, or pointing at a number the board lacks, contradicts the screen", async () => {
  const { screenContradictions, screenFacts } = await import("../server/brain/say.js");
  const facts = screenFacts({ studioSlot: { artifact: { screen: { shape: "triangle", numbers: ["4", "5", "6"] } } } }, null);
  assert.deepEqual(facts, { shape: "triangle", numbers: ["4", "5", "6"] });
  assert.deepEqual(screenContradictions("Board par triangle dekho: 4, 5 aur 6 cm.", facts), []);
  assert.equal(screenContradictions("Rectangle mein chaaron sides jodte hain.", facts).length, 1);
  assert.equal(screenContradictions("Screen par 2/5 dekho.", facts).length, 1);
  // with no slot facts, the script beat's board ref names the shape
  assert.equal(screenFacts({}, { scriptBeat: { board: { template: "measured@1", params: { shape: "rect" } } } }).shape, "rectangle");
});
