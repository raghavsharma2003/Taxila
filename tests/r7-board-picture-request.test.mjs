// round 7 (M2, main via Brain's S4 harness): a c6 perimeter child who asks for a PICTURE gets a board — the worked
// example's park drawn to scale (measured@1), named "rectangle", "perimeter" written, its sides 50 m and 30 m (the worked
// example's givens, never masked as a later item's answer), and a marker that walks the whole boundary back to its start.
import { test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { CTX, cls } from "./fixtures/kit.mjs";
import { whiteboardIntentOf } from "../server/brain/propose.js";
import { findItem } from "../server/director/items.js";
import { preselect } from "../server/stagecraft/board-first.js";
import { certifyForTray } from "../server/forge3/tray-gate.js";
import { withheldValues } from "../server/studio/qa/whiteboard.js";
import { codePick } from "../server/forge/explainer/pick.js";
import { settledScript } from "../shared/whiteboard.js";

function askPicture(topicId, subject, tag) {
  const kit = kitFromFile(getTopic(topicId));
  let r = step(initLessonState({ topicId, kit, ctx: { ...CTX }, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
  for (let i = 0; i < 6 && !r.state.lastMove?.itemId; i++) r = step(r.state, { event: "turn", kit, cls: cls("no_evidence"), text: "haan", now: 20000 * (i + 1) });
  const item = r.state.lastMove?.itemId ? findItem(r.state, kit, r.state.lastMove.itemId) : null;
  const next = { ...r.state, lastMove: { ...(r.state.lastMove ?? {}), request: "visual", see: { show: "picture", ...(subject ? { subject } : {}) } } };
  const ask = whiteboardIntentOf({ lessonId: `pic-${tag}`, turn: r.state.turn, beat: { id: "b", type: "explain" }, next, kit, item, line: { text: "" } });
  return { kit, ask };
}

for (const subject of [null, "rectangle", "perimeter"]) {
  test(`c6 perimeter, a picture asked${subject ? ` for the ${subject}` : ""}: the park to scale, named, its sides written, walked round`, () => {
    const { kit, ask } = askPicture("c6-maths-ch06-t01", subject, subject ?? "plain");
    const p = preselect(ask, { kit, certify: (script) => certifyForTray({ kind: "whiteboard", script }, { vp: "p412" }).ok });
    assert.equal(p?.template, "measured@1");
    const texts = p.script.ops.filter((o) => o.op === "text").map((o) => o.text);
    for (const t of ["rectangle", "perimeter", "50 m", "30 m"]) assert.ok(texts.includes(t), `"${t}" on the board: ${texts.join(" | ")}`);
    const walks = p.script.ops.filter((o) => o.op === "follow");
    assert.equal(walks.length, 4, "one walk per side");
    const marker = settledScript(p.script).ops.find((o) => o.id === walks[0].target);
    const start = p.script.ops.find((o) => o.id === walks[0].target);
    assert.deepEqual(marker.c, start.c, "back where it began: one round");
  });
}

test("the worked example's givens are not withheld while the item IS the worked example; another item's still are", () => {
  const kit = kitFromFile(getTopic("c6-maths-ch06-t01"));
  assert.ok(!withheldValues(kit, { itemId: "fade:3" }).values.includes("50"));
  assert.ok(withheldValues(kit, { itemId: "c6-maths-ch06-t01-i01" }).values.includes("50"), "not on an ordinary item");
});

test("a sign inside brackets after × is a rule's step, and 1-9 is a range: neither is a two-group sum", () => {
  const k = { topicId: "c6-maths-ch06-t01" };
  assert.equal(codePick({ kit: k, text: "Perimeter = 2 × (50 + 30) = 2 × 80 = 160 m" })?.template === "column-op@1", false);
  assert.equal(codePick({ kit: k, text: "Fill a 1-9 magic square, starting from the centre." })?.template === "combine-count@1", false);
  assert.deepEqual(codePick({ kit: k, text: "9 − 4 = ?" }), { template: "combine-count@1", a: 9, b: 4, op: "take_away" });
});
