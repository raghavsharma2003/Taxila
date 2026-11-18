// d31 046 follow-up (the main loop's read of the d31 dry runs: four faults from Brain 046's re-ask rotation, Q5 and Q3). Each new predicate
// pinned on the rows the read named, from the d31 dry lessons copied into tests/fixtures/d31-046-followup.json (only the rows needed, at their
// own indexes; the scripts cut to the cards those rows ask), and each rule pinned on small inline fragments. Nothing here pins a sentence of
// today's script: the fixture carries the scripts the run walked.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { lessonFlags, PENDING } from "../evals/hybrid-side-by-side/dry-predicates.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const FX = JSON.parse(readFileSync(join(ROOT, "tests/fixtures/d31-046-followup.json"), "utf8"));
/** A fixture lesson as rows at their own indexes (rows the read did not need are a silent child line) and its script. */
const lesson = (name) => {
  const L = FX.lessons[name];
  const n = Math.max(...Object.keys(L.rows).map(Number)) + 1;
  return { rows: Array.from({ length: n }, (_, i) => L.rows[i] ?? { who: "child", text: "" }), script: FX.scripts[L.topicId] };
};
const flagged = (name, pred) => new Set(lessonFlags(lesson(name)).filter((f) => f.predicate === pred).map((f) => f.row));

describe("1: a re-ask is always a question a child can answer from what she just heard", () => {
  test("reaskWhole is gated and reads the nine re-asks on the card's last clause alone", () => {
    assert.ok(!PENDING.has("reaskWhole"));
    for (const [name, row] of [["steady-c6-ch07-t01", 6], ["steady-c5-ch02-t03", 10], ["steady-c5-ch02-t03", 84], ["steady-c6-ch06-t01", 90], ["offtopic-c5-ch02-t01", 22],
      ["offtopic-c5-ch02-t01", 62], ["stuck-c5-ch02-t01", 40], ["steady-c5-ch02-t02", 8], ["steady-c4-ch05-t01", 16]])
      assert.ok(flagged(name, "reaskWhole").has(row), `${name} ${row}`);
  });
  test("reaskWhole reads no re-ask on the card's reask, its whole question or the short ask", () => {
    const { rows, script } = lesson("steady-c6-ch07-t01");
    // (row 4 ends on the card's reask)
    assert.ok(!flagged("steady-c6-ch07-t01", "reaskWhole").has(4));
    const at = (text) => lessonFlags({ rows: [...rows.slice(0, 6), { ...rows[6], text }], script }).filter((f) => f.predicate === "reaskWhole" && f.row === 6);
    const help = "Nahi, yeh theek nahi hai. Socho chaar dost yeh roti barabar baant-te hain.";
    assert.deepEqual(at(`${help} ${rows[6].card}`), [], "the whole card");
    assert.deepEqual(at(`${help} Ab phir se socho, jawab kya hoga?`), [], "the short ask");
    assert.equal(at(`${help} ${rows[6].card.split(/(?<=[.?!])\s+/).at(-1)}`).length, 1, "the last clause alone");
  });
  test("the rotation's forms are the reask and the whole card — the walk never builds the last clause alone", () => {
    const src = readFileSync(join(ROOT, "server/brain/say.js"), "utf8");
    assert.match(src, /\["reask", reask\], \["short", shortT\], \["whole", whole\], \["clause", clause\]/);
    // (the clause is only a one-sentence card's with no reask)
    assert.match(src, /const clause = cs\.length < 2 && !reask && /);
  });
});

describe("2: \"What is the question?\" gets the question", () => {
  test("clarifyAsked is gated and reads the three requests answered with the short ask alone", () => {
    assert.ok(!PENDING.has("clarifyAsked"));
    for (const [name, row] of [["steady-c4-ch01-t02", 14], ["steady-c4-ch05-t01", 14], ["stuck-c4-ch01-t02", 16]]) assert.ok(flagged(name, "clarifyAsked").has(row), `${name} ${row}`);
  });
  test("clarifyAsked reads no request answered with the whole card", () => {
    const { rows, script } = lesson("steady-c4-ch01-t02");
    const r = { ...rows[14], text: `Phir se dekho: ${rows[14].card}`, seams: [{ left: "start", right: "card" }] };
    assert.deepEqual(lessonFlags({ rows: [...rows.slice(0, 14), r], script }).filter((f) => f.predicate === "clarifyAsked"), []);
  });
  test("a request to hear the question at a card with no reask, said whole in her turn before, gets the card again — reaskRunning allows it", () => {
    const { rows, script } = lesson("steady-c4-ch01-t02");
    const r = { ...rows[14], text: rows[14].card, seams: [{ left: "start", right: "card" }] };
    assert.deepEqual(lessonFlags({ rows: [...rows.slice(0, 14), r], script }).filter((f) => ["reaskRunning", "clarifyAsked"].includes(f.predicate)), []);
  });
});

describe("3: the closing check-in and the wrap", () => {
  test("wrapAckTwice is gated and reads both wrap turns opening on one form (steady c6-ch07-t01 90)", () => {
    assert.ok(!PENDING.has("wrapAckTwice"));
    assert.deepEqual([...flagged("steady-c6-ch07-t01", "wrapAckTwice")], [90]);
  });
  test("the replayed row: \"maine ek ek karke gina\" at the closing question's check-in goes on to the wrap, as \"maine dobara check kiya\" does", async () => {
    const { initLessonState, step } = await import("../server/director/state.js");
    const { setScriptForTest } = await import("../server/director/script.js");
    const { kitFromFile } = await import("../server/content/kits.js");
    const { getTopic } = await import("../server/content/curriculum.js");
    const T = "c6-maths-ch07-t01";
    const sc = JSON.parse(readFileSync(join(ROOT, "data/lesson-scripts-staged", `${T}.json`), "utf8"));
    setScriptForTest(T, sc);
    const KEEP = process.env.TAXILA_R7_SCRIPT; delete process.env.TAXILA_R7_SCRIPT;
    try {
      const kit = kitFromFile(getTopic(T));
      const ctx = { firstName: "Riya", teacherName: "Asha", teacherId: "asha", ageBand: "10-15", lang: "hinglish", interests: ["cricket"], firstMeeting: true, topicTitle: kit.title ?? T, classLevel: 6, sessionId: "11111111-1111-1111-1111-11111111aaaa", teacher: "director" };
      const s0 = step(initLessonState({ topicId: T, kit, ctx, seed: 7, now: 0 }), { event: "start", kit, now: 0 }).state;
      // (the state after the closing question's right answer said with its why and a check-in — the teach-back keyed, its wrap next)
      const at = { ...s0, phase: "teachback", teachbackScript: true, teachbackKeyed: true, teachbackPassed: true, activeItemId: undefined, lastUi: { status: "your_turn" },
        lastMove: { kind: "teachback", authoredEnd: "teachbackKey", endVerdict: "correct", probe: "P1" } };
      for (const text of ["maine ek ek karke gina", "maine dobara check kiya"]) {
        const out = step(structuredClone(at), { event: "turn", kit, text, cls: { outcome: "no_evidence", confidence: 1, flags: {} }, now: 60_000 });
        assert.equal(out.move.kind, "wrap", text);
      }
    } finally { setScriptForTest(T, undefined); setScriptForTest(); if (KEEP !== undefined) process.env.TAXILA_R7_SCRIPT = KEEP; }
  });
});

describe("4: a due return waits for a remediation's follow-up card", () => {
  test("the walk no longer ends a remediation said alone on a due return (returnEndsHeld is gone), and the follow-up card's verdict is the return's boundary", () => {
    const src = readFileSync(join(ROOT, "server/director/state.js"), "utf8");
    assert.ok(!/returnEndsHeld\(/.test(src));
    assert.match(src, /const thenDone = String\(prev\.activeItemId \?\? ""\)\.includes\(":then:"\)/);
  });
});
