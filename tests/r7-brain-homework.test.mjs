// round 7 (Learning patch 007, HOMEWORK HELP): a homework start is an Ask on their homework. The Director names the method
// (never their answer), then always works a kit look-alike, and never poses the kit question the match found. Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { startRefusal } from "../server/routes/lesson.js";
import * as SH from "../server/director/shapes.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { CTX, cls } from "./fixtures/kit.mjs";

const K = kitFromFile(getTopic("c6-maths-ch06-t01"));
const begin = (ctx) => step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: 6, lang: "hinglish", ...ctx }, seed: 3, now: 0 }), { event: "start", kit: K, now: 0 });

test("a homework start is let through like an Ask on a done day, and refused like every start on a safety hold", () => {
  assert.equal(startRefusal("done", "homework", { limits: true }), null);
  assert.equal(startRefusal("safety_hold", "homework", { limits: true }), "lessons are paused for now");
});

test("homework: the method first (never their answer), then a worked look-alike; the matched kit question is never posed", () => {
  const avoid = K.items.find((i) => i.kind === "practice")?.id;
  let r = begin({ purpose: "doubt", homework: true, avoidItemId: avoid, askText: "ek park 40 m lamba 20 m chauda, 2 round kitne m?" });
  assert.match(r.move.shape, new RegExp(SH.homeworkMethod().split(";")[0].slice(0, 30).replace(/[()]/g, ".")));
  assert.match(r.move.shape, /never solve it/);
  r = step(r.state, { event: "turn", kit: K, cls: cls("no_evidence"), text: "achha", now: 20_000 });
  assert.equal(r.move.kind, "worked_example");
  const posed = [];
  for (let i = 0; i < 25 && !r.end; i++) {
    r = step(r.state, { event: "turn", kit: K, cls: cls("correct"), text: "haan", now: (i + 2) * 20_000 });
    if (r.move.itemId) posed.push(r.move.itemId);
  }
  assert.ok(!posed.includes(avoid), `${avoid} posed: ${posed.join(",")}`);
  // a plain Ask still answers their question
  const ask = begin({ purpose: "doubt", askText: "perimeter kya hota hai?" });
  assert.doesNotMatch(ask.move.shape, /never solve it/);
});
