// Round 3, stream relational-human, patch 04 (server/compiler/compile.js): ONE callback from the record, rendered as a note.
// A memory about the child (lead) opens the turn from the LAST section (position is mechanism: mid-brief it was voiced 0/3);
// an interest the parent chose stays in the MOVE section as the setting of an example. Never on a safeguard or a wrap, never
// on a turn that must first fix a floor break; always droppable; the turn-shape rule stays the last line.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { compileWithReport, TURN_SHAPE_PREFIX } from "../server/compiler/compile.js";
import { CHARACTERS } from "../server/compiler/characters/index.js";
import { initLessonState, step } from "../server/director/state.js";
import { kit, CTX, BRIEF } from "./fixtures/kit.mjs";

describe("round 3 relational-human: the callback in the compile (patch 04)", () => {
  const K = kit();
  const r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 3, now: 0 }), { event: "start", kit: K, now: 0 });
  const L = { id: "L:topic:x", kind: "L", fragment: "last lesson · Faces, edges and corners of solids", lead: true };
  const P = { id: "P:int:cricket", kind: "P", fragment: "an interest their parent chose · cricket · as the context of one example", lead: false };
  const run = (callback, { kind = "hook", lane = "voice", correction } = {}) => compileWithReport({ character: CHARACTERS.asha, brief: BRIEF,
    lessonState: { ...r.state, ...(correction ? { correction } : {}), rel: { turn: r.state.turn, callbackId: callback?.id, callback } },
    move: { ...r.move, kind }, item: r.item, next: r.next, content: r.content, topic: { title: "Fractions as equal shares", classLevel: 4, subject: "maths" }, language: "hinglish", lane });
  test("a memory about the child leads, from the last section, before ONE MORE CHECK; the turn shape stays last", () => {
    for (const lane of ["voice", "text"]) {
      const lines = run(L, { lane }).text.split("\n");
      const i = lines.findIndex((l) => l.startsWith("OPEN THIS TURN WITH") && l.includes(L.fragment));
      assert.ok(i > 0, lane);
      assert.ok(lines[i + 1].startsWith("ONE MORE CHECK"), lane);
      assert.ok(lines.at(-1).startsWith(TURN_SHAPE_PREFIX), lane);
      assert.ok(!lines.some((l) => l.startsWith("- callback (once")), "not twice");
    }
  });
  test("an interest the parent chose is the setting of an example, in the move, not an announcement", () => {
    const t = run(P).text;
    assert.match(t, /- callback \(once; the setting of this example, not an announcement\): an interest their parent chose · cricket/);
    assert.ok(!t.includes("OPEN THIS TURN WITH"));
  });
  test("never on a safeguard or a wrap, never on a turn that fixes a floor break; nothing without a callback", () => {
    for (const kind of ["safeguard", "wrap"]) assert.ok(!run(L, { kind }).text.includes(L.fragment), kind);
    assert.ok(!run(L, { correction: ["memory_claim"] }).text.includes("OPEN THIS TURN WITH"), "a floor fix first, no callback");
    assert.ok(!run(null).text.includes("OPEN THIS TURN WITH"));
  });
  test("droppable: a tight last-section cap sheds the callback, never the turn shape", () => {
    const input = { character: CHARACTERS.asha, brief: BRIEF, lessonState: { ...r.state, rel: { turn: r.state.turn, callbackId: L.id, callback: L } },
      move: { ...r.move, kind: "hook" }, item: r.item, next: r.next, content: r.content, topic: { title: "Fractions as equal shares", classLevel: 4, subject: "maths" }, language: "hinglish", lane: "voice" };
    const full = compileWithReport(input);
    const last = full.sections.find((s) => s.id === "last").tokens;
    const tight = compileWithReport(input, { caps: { last: last - 5 } });
    assert.ok(!tight.text.includes("OPEN THIS TURN WITH"));
    assert.ok(tight.dropped.some((d) => d.startsWith("last:")));
    assert.ok(tight.text.split("\n").at(-1).startsWith(TURN_SHAPE_PREFIX));
  });
});
