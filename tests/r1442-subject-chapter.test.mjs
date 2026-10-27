// 14.4.2 (main's blocker on F1(b) round 3; sim lab 38aad918 c4): "geometry padhao, triangles" on class 5 was told geometry
// is not in their class, while class 5 has "Triangles and polygons". A false claim, worse than the reteach it replaced.
// Now (i) a child's everyday subject word finds its topic (findTopic, subject-scoped, topic titles only) and (ii) no topic
// found is never "not in your class": she will look for it, and real topics of their class are the buttons. Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic, topicSequence, findTopic } from "../server/content/curriculum.js";
import { requestOf } from "../server/director/requests.js";
import { CTX, cls } from "./fixtures/kit.mjs";

const NE = cls("no_evidence");
function ask(topicId, classLevel, text) {
  const K = kitFromFile(getTopic(topicId));
  let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel }, seed: 2, now: 0 }), { event: "start", kit: K, now: 0 });
  for (let i = 0; i < 3; i++) r = step(r.state, { event: "turn", kit: K, cls: NE, now: (i + 1) * 20_000 });
  return step(r.state, { event: "turn", kit: K, cls: { ...NE, source: "request", request: requestOf(text) }, text, now: 90_000 });
}

test("38aad918 c4 on class 5: 'geometry padhao, triangles' offers Triangles and polygons, a real chapter of their book", () => {
  const b = ask("c5-maths-ch02-t01", 5, "didi, pehla gap… fractions boring hai, geometry padhao, triangles");
  assert.equal(b.move.request, "switch");
  assert.ok((b.ui.chips ?? []).some((c) => c.id === "switch:c5-maths-ch07-t01"), JSON.stringify(b.ui.chips));
  assert.doesNotMatch(b.move.shape, /say kindly that it is not in their class/);
});

test("no topic found is never 'not in your class': she will look for it, and real topics of their class are the buttons", () => {
  const first = topicSequence(1, "maths")[0];
  const b = ask(first, 1, "geometry padhao");
  assert.doesNotMatch(b.move.shape, /say kindly that it is not in their class/);
  assert.match(b.move.shape, /look for it/);
  const topics = (b.ui.chips ?? []).filter((c) => String(c.id).startsWith("switch:"));
  assert.ok(topics.length >= 1 && topics.every((c) => getTopic(c.id.slice(7))?.classLevel === 1), JSON.stringify(b.ui.chips));
});

test("a subject word never crosses subjects or reads a chapter's story title ('Animal Jumps' is maths)", () => {
  assert.notEqual(findTopic("animals", 5)?.subject, "maths");
  assert.equal(findTopic("geometry", 5)?.id, "c5-maths-ch07-t01");
  assert.equal(findTopic("त्रिभुज", 7)?.subject, "maths");
});
