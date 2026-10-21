// census 2026-10-21 F4 (option ≠ action; a95d2ff1, 6c45a7ea, c85501ec): the ways-in chips offered a picture and a game
// that nothing could build. The Director now offers, and her shape names, only the ways Studio (brain/turn.js studioSeam
// .waysFor) or the topic's own engine can answer. Pure (fixture kit; Studio's lesson state in memory).
import { test } from "node:test";
import assert from "node:assert/strict";
import { initLessonState, step } from "../server/director/state.js";
import { kit, CTX, cls } from "./fixtures/kit.mjs";

const K = kit();
const NE = cls("no_evidence");
const start = () => step(step(initLessonState({ topicId: K.topicId, kit: K, ctx: CTX, seed: 11, now: 0 }), { event: "start", kit: K, now: 0 }).state, { event: "turn", kit: K, cls: NE, now: 20_000 });
const ask = (r, type, extra = {}) => step(r.state, { event: "turn", kit: K, cls: { ...NE, request: { type, whole: true } }, text: "x", now: (r.state.turn + 1) * 20_000, ...extra });
const ids = (r) => (r.ui.chips ?? []).map((c) => c.id);

test("F4: no game and no picture to give → neither chip is offered, and her shape offers neither", () => {
  for (const type of ["change_topic", "boredom"]) {
    const r = ask(start(), type, { ways: { picture: false, game: false } });
    assert.ok(!ids(r).includes("req:game"), `${type}: ${ids(r)}`);
    assert.ok(!ids(r).includes("req:visual"), `${type}: ${ids(r)}`);
    assert.doesNotMatch(r.move.shape, /\ba game\b|\ba picture\b/, r.move.shape);
    assert.ok(ids(r).length >= 2, "still a real choice (a story / a challenge, back to the lesson)");
  }
});

test("F4: what Studio can answer is offered and named; with no read (old callers) every way stays, as before", () => {
  const can = ask(start(), "change_topic", { ways: { picture: true, game: true } });
  assert.deepEqual(ids(can), ["req:visual", "req:story", "req:game", "stop:continue"]);
  assert.match(can.move.shape, /a picture, a story or a game/);
  const old = ask(start(), "change_topic");
  assert.deepEqual(ids(old), ["req:visual", "req:story", "req:game", "stop:continue"]);
  const noGame = ask(start(), "change_topic", { ways: { picture: true, game: false } });
  assert.ok(!ids(noGame).includes("req:game"));
  assert.match(noGame.move.shape, /a picture or a story,/);
});

test("F4 (main): her words and the chips come from one list: every offered way is named, no other way is", () => {
  const NAME = { "req:visual": "a picture", "req:story": "a story", "req:game": "a game" };
  for (const type of ["change_topic", "boredom"]) for (const picture of [true, false]) for (const game of [true, false]) {
    const r = ask(start(), type, { ways: { picture, game } });
    const offered = ids(r).filter((x) => NAME[x]);
    for (const [id, words] of Object.entries(NAME)) assert.equal(new RegExp(`\\b${words}\\b`).test(r.move.shape), offered.includes(id), `${type} ${picture}/${game}: ${id} | ${r.move.shape}`);
  }
});

test("F4: studioSeam.waysFor — frozen or off Studio offers nothing visual; a prepared piece the child can act on is a game", async () => {
  const seam = await import("../server/studio/seam.js");
  const { studioSeam } = seam;
  assert.equal(studioSeam.waysFor("L-ways-none"), null, "no lesson state: the Director offers as before");
  seam.subscribe("L-ways", () => {});
  const L = seam._lesson("L-ways");
  const prev = process.env.FORGE3_PLAY;
  process.env.FORGE3_PLAY = "0";                    // play coverage out of the picture: only the lesson's own pieces
  try {
    assert.deepEqual(studioSeam.waysFor("L-ways", { skillId: "s1" }), { picture: true, game: false });
    L.pieces.set("g1", { intentId: "g1", kind: "game", source: "skeleton", state: "fallback_ready", retired: false, skillId: "s1" });
    assert.deepEqual(studioSeam.waysFor("L-ways", { skillId: "s1" }), { picture: true, game: true });
    assert.deepEqual(studioSeam.waysFor("L-ways", { skillId: "s2" }), { picture: true, game: false }, "another skill's piece is not this ask's");
    L.safety = true;
    assert.deepEqual(studioSeam.waysFor("L-ways", { skillId: "s1" }), { picture: false, game: false });
  } finally { if (prev === undefined) delete process.env.FORGE3_PLAY; else process.env.FORGE3_PLAY = prev; L.safety = false; }
});
