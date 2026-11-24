// round 7 (C1 studio-board-pointing-truth; main's answer to the drawAsked vs VISUAL_DRAWING question): she points at the
// board drawn for the child's ask once ONLY when a certified board-first page lands before her clause; otherwise the board
// draws later and she describes the thing in words, never sending their eyes to it (QA c2cd0d93: "picture ko words mein
// dekhiye" with the board up came from the no-pointing clause applied while a board was ready).
import { test } from "node:test";
import assert from "node:assert/strict";
import { drawAsked, DRAW_NO_POINT, DRAW_POINT_ONCE } from "../server/director/shapes.js";
import { pointShapeFor } from "../server/brain/turn.js";

test("drawAsked describes in words and never points by default (the board draws after her line)", () => {
  for (const show of ["show", "picture", "draw"]) assert.ok(drawAsked({ subject: "aloo", show }).includes(DRAW_NO_POINT), show);
});

test("a certified board-first page ready before her line: point once, then say what it shows", () => {
  const shape = drawAsked({ subject: "triangle", show: "draw" });
  const pointed = pointShapeFor(shape, { boardFirst: true });
  assert.ok(pointed.includes(DRAW_POINT_ONCE));
  assert.ok(!pointed.includes(DRAW_NO_POINT));
  assert.equal(pointShapeFor(shape, { boardFirst: false }), shape, "no board-first page: words only, unchanged");
  assert.equal(pointShapeFor("x; y", { boardFirst: true }), "x; y", "a shape without the clause is left alone");
});
