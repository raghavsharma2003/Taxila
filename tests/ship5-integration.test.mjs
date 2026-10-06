// ship5 integration regressions (2026-10-06): defects that only appeared once the five streams' patches met.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { compileWithReport } from "../server/compiler/compile.js";
import { CHARACTERS } from "../server/compiler/characters/index.js";
import { initLessonState, step } from "../server/director/state.js";
import { hintStatements } from "../server/brain/say.js";
import { kit, CTX, BRIEF, cls } from "./fixtures/kit.mjs";

describe("ship5 integration", () => {
  // w2c-personalisation / w1c-three-day on the local battery: POST /api/lesson/turn 500 (BudgetError, MOVE 288 > 260) on
  // a hook whose shape carried p5's question reading, the interest, the protégé mention and aap, plus a relational note.
  test("an over-long MOVE sheds the relational note instead of throwing (no 500 on a live turn)", () => {
    const K = kit();
    const r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 3, now: 0 }), { event: "start", kit: K, now: 0 });
    const shape = "they asked a real question about today's idea: answer it in at most two sentences, correctly and simply, without giving the key; then the question; open with one concrete everyday situation built on their interest (cricket) — kit contexts: highway distances (Delhi to Kanyakumari), cricket stadium crowds, train route kilometres; ask what they think will happen or which they would pick — a prediction, no right answer yet; any bigger/more comparison: two quantities of one kind, in one unit — a count against a count, a distance against a distance; never across kinds; mention once: at the end they will teach this to Bittu (a pretend new student who missed this class); address them with aap forms only (aap, aapka, aapne; verbs -iye / -enge), never tum or tu";
    const lessonState = { ...r.state, rel: { turn: r.state.turn, overlay: { shapeId: "recheck_aloud", kind: "REPAIR" } } };
    const input = { character: CHARACTERS.asha, brief: BRIEF, lessonState, move: { ...r.move, kind: "hook", shape }, item: r.item, next: r.next,
      content: r.content, topic: { title: "Fractions as equal shares", classLevel: 4, subject: "maths" }, language: "hinglish" };
    const rep = compileWithReport(input);
    assert.ok(rep.dropped.some((d) => d.startsWith("move:")), JSON.stringify(rep.dropped));
    assert.ok(rep.text.includes("they asked a real question about today's idea"));
  });

  // w1a-battery "0 two-question turns": the bare-question repair led with a kit hint that itself asks a question.
  test("the kit-hint lead of a repaired hint turn carries no question", () => {
    const item = { id: "x", answer: "2:3", hints: ["Pehle red ko blue se compare kijiye: red kitne aur blue kitne? Strip mein 5 boxes hain.", "b", "c", "d"] };
    const h = hintStatements(item, 1);
    assert.ok(!/[?？]/.test(h), h);
    assert.match(h, /Strip mein 5 boxes hain/);
    assert.equal(hintStatements({ id: "y", answer: "7", hints: ["Kitne hain?"] }, 1), "");
  });

  // w1c-reteach on the local battery: 0 re-teach moves. p5's card cap ends a question at rung 2-3, so the post-rung-3
  // fails W1-C's re-teach trigger counts never accrued. An asserted cap after real help now counts as one.
  test("card cap x re-teach: each asserted cap after real help counts toward two_fails_post_rung3", () => {
    const K = kit();
    let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 3, now: 0 }), { event: "start", kit: K, now: 0 });
    for (let i = 0; i < 5 && r.state.phase !== "practice"; i++) r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), now: (r.state.turn + 1) * 20_000 });
    let caps = 0, skill = null;
    for (let i = 0; i < 8 && caps < 2; i++) {
      r = step(r.state, { event: "turn", kit: K, cls: cls("incorrect"), now: (r.state.turn + 1) * 20_000 });
      if (r.state.capped?.turn === r.state.turn && r.state.capped.how === "assert") { caps++; skill ??= Object.keys(r.state.failsPostRung3 ?? {})[0]; }
    }
    assert.equal(caps, 2);
    assert.ok(skill && r.state.failsPostRung3[skill] >= 2, JSON.stringify(r.state.failsPostRung3));
  });
});
