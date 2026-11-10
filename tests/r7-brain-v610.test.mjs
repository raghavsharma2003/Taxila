// dc-r7-script-walk-v6-10 (main's director18 judgement): each fix pinned on director18's own rows (0-based rows of the run's .json),
// walked live (tests/fixtures/walk.mjs: turn.js planTurn and textReply on the run's own scripts, her live lines in the history).
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { walk } from "./fixtures/walk.mjs";
import { rowsOf } from "./fixtures/replay.mjs";
import { pictureRowFlag, pictureTruth } from "../server/brain/picture.js";

const RUN = "2026-11-10-director18";
const T = { c4: "c4-maths-ch05-t01", "c5-t01": "c5-maths-ch02-t01", "c5-t02": "c5-maths-ch02-t02", c6: "c6-maths-ch06-t01" };
const NO_PIC = /doosri tasveer|alag chitra|second picture|another picture/i;

describe("r7-brain-v610.test.mjs", () => {
  // P6: a picture turn is one take — the drawing, the view and her line together; with no view, no picture line
  describe("P6: one call for a picture turn", () => {
    const BAD = [["steady", "c4", 18], ["steady", "c5-t01", 18], ["offtopic", "c5-t01", 28], ["steering", "c5-t01", 14], ["stuck", "c5-t02", 18],
      ["offtopic", "c5-t02", 26], ["steering", "c5-t02", 14], ["steady", "c6", 18], ["offtopic", "c6", 26]];
    const GOOD = [["offtopic", "c4", 26], ["steady", "c5-t02", 18], ["steering", "c4", 14], ["steering", "c6", 14], ["stuck", "c5-t01", 18], ["stuck", "c6", 18]];
    test("the predicate flags director18's 9 rows and none of its drawn picture rows", () => {
      for (const [p, t, n] of BAD) assert.ok(pictureRowFlag(rowsOf(RUN, p, T[t])[n]), `${p} ${t} ${n}`);
      for (const [p, t, n] of GOOD) assert.equal(pictureRowFlag(rowsOf(RUN, p, T[t])[n]), null, `${p} ${t} ${n}`);
    });
    test("the predicate throws in tests on a picture line with no view", () => {
      assert.throws(() => pictureTruth([{ part: "alt" }, { part: "card" }], { view: null, layout: { split: false } }), /P6/);
      assert.equal(pictureTruth([{ part: "alt" }], { view: "parts" }), null);
      assert.equal(pictureTruth([{ part: "body" }], { view: null }), null);
    });
    for (const [p, t, n] of BAD) test(`${p} ${t} ${n}: the line is the take's; a view said is a view drawn`, async () => {
      const x = (await walk(p, t, n + 1, { run: RUN })).find((y) => y.n === n);
      assert.ok(x, "the picture turn was walked");
      const parts = x.out.guard?.parts?.list ?? [];
      assert.doesNotThrow(() => pictureTruth(parts, { view: x.pic?.view ?? null, layout: x.hb?.layout ?? null }));
      if (x.pic?.view) {
        assert.ok(x.hb?.layout?.split, `drawn beside: ${JSON.stringify(x.hb?.layout)}`);
        assert.equal(x.hb, x.pic.take, "the draw is the one take");
        assert.ok(x.out.reply.startsWith(x.pic.line.slice(0, 20)), x.out.reply);
      } else {
        assert.ok(!parts.some((q) => q.part === "alt"), x.out.reply);
        assert.match(x.out.reply, NO_PIC);
      }
    });
  });
});
