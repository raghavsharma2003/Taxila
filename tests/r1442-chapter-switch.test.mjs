// QA 14.4.1 (df5ce94c): "chapter 1 se shuru karo" got "Page ya chapter ka naam bataiye" while chapter 1's first topic was
// already on the button. A chapter ask's switch now says that topic is ready and asks nothing (not which page or chapter);
// a named-topic switch asks nothing either. Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { requestOf } from "../server/director/requests.js";
import { CTX, cls } from "./fixtures/kit.mjs";

const K = kitFromFile(getTopic("c9-maths-ch08-t02"));
const NE = cls("no_evidence");
const turn = (r, c, extra = {}) => step(r.state, { event: "turn", kit: K, cls: c, now: (r.state.turn + 1) * 20_000, ...extra });
const say = (r, text) => { const q = requestOf(text); return turn(r, q ? { ...NE, source: "request", request: q } : NE, { text }); };
function toCard() {
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 9 }, seed: 3, now: 0 }), { event: "start", kit: K, now: 0 });
  for (let i = 0; i < 12 && !(r.state.phase === "practice" && r.move.itemId && !r.move.itemId.startsWith("fade:")); i++) r = turn(r, NE);
  assert.ok(r.move.itemId);
  return r;
}

test("a chapter ask: the chapter's first topic is ready on the button, and she asks nothing", () => {
  for (const t of ["chapter 1 se shuru karo", "start from chapter 1"]) {
    const b = say(toCard(), t);
    assert.equal(b.move.request, "switch");
    const first = getTopic("c9-maths-ch01-t01").title;
    assert.ok((b.ui.chips ?? []).some((c) => c.id === "switch:c9-maths-ch01-t01"));
    assert.match(b.move.shape, new RegExp(`asked for chapter 1: its first topic, .*is ready for them`));
    assert.ok(b.move.shape.includes(first.slice(0, 12)), b.move.shape);
    assert.match(b.move.shape, /ask them nothing this turn: not which page or chapter/);
  }
});

test("a named-topic switch asks nothing either", async () => {
  const { switchOffer } = await import("../server/director/shapes.js");
  assert.match(switchOffer({ title: "Photosynthesis" }), /they want to study Photosynthesis instead.*ask them nothing this turn/);
});
