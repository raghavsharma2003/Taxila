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

test("F3 (census a95d2ff1 t23/25): the cantshow rewrite note never tells her a board is drawing (it pushed claims about a board with nothing on it)", async () => {
  const fs = await import("node:fs");
  const src = fs.readFileSync(new URL("../server/brain/say.js", import.meta.url), "utf8");
  const note = src.split("\n").find((l) => l.includes('found.includes("cantshow")'));
  assert.ok(note, "the cantshow note");
  assert.doesNotMatch(note, /board draws for you/);
  assert.match(note, /point at the screen only at what is on it now/);
});

test("F3 (census b08fe8a7 t7): pointing at a diagram / picture with nothing on the stage is a screen problem, and the pointing sentence goes; the bare words and a stage with something on it are untouched", async () => {
  const { screenProblem, stripScreenRefs, POINT_DIAG } = await import("../server/director/say.js");
  const empty = {};
  const board = { studioSlot: { artifact: { kind: "whiteboard", script: { ops: [{ op: "text", text: "5 groups" }] } } } };
  for (const t of ["Is diagram mein dekho, 5 groups hain. Kitne hue?", "Ab picture mein charpai dekho: cat upar hai ya neeche?", "Look at the diagram: which side is longer?", "इस चित्र में कितने त्रिकोण हैं?"]) {
    assert.equal(screenProblem(t, empty, null), true, t);
    assert.equal(screenProblem(t, board, null), false, `with a board: ${t}`);
    assert.equal(screenProblem(t, empty, null, { coming: true }), false, `a piece coming this turn: ${t}`);
  }
  for (const t of ["Tumhe drawing pasand hai?", "Now picture the next row and count all dots.", "Aap game, picture, ya quick challenge chunenge?", "Picture: 1,48,700 + 2,52,900 ko 1."]) {
    assert.equal(POINT_DIAG.test(t), false, t);
    assert.equal(screenProblem(t, empty, null), false, t);
  }
  assert.equal(stripScreenRefs("Is diagram mein dekho, 5 groups hain. 5 groups mein kitne hue?", { stageEmpty: true }), "5 groups mein kitne hue?");
  assert.equal(stripScreenRefs("Is diagram mein dekho, 5 groups hain. Kitne hue?"), "Is diagram mein dekho, 5 groups hain. Kitne hue?", "a caller that does not pass the stage strips as before");
});

test("F3 (census 6c45a7ea t33): choice chips never single the key out by its look — a key with its working is not offered beside bare answers; alike answers still are", async () => {
  const { choicesFor } = await import("../server/director/items.js");
  const items = [{ id: "a", skillId: "s", answer: "₹20" }, { id: "b", skillId: "s", answer: "₹35" }, { id: "c", skillId: "s", answer: "I walk with my feet." }, { id: "d", skillId: "s", answer: "ears" }];
  const worked = { id: "k1", skillId: "s", answer: "₹45 (30 + 15)" };
  assert.equal(choicesFor(worked, { items: [...items, worked] }, 3), null, "the key's own working would give it away: no chips");
  const bare = { id: "k2", skillId: "s", answer: "₹45" };
  assert.deepEqual([...choicesFor(bare, { items: [...items, bare] }, 3)].sort(), ["₹20", "₹35", "₹45"]);
  const word = { id: "k3", skillId: "s", answer: "eyes" };
  const c = choicesFor(word, { items: [...items, word] }, 3);
  assert.ok(c && !c.includes("I walk with my feet."), String(c));
});

test("F3 (census 3437b744 t9/13/14): a faded step's question card carries the problem it is a gap of, and fits the card whole", async () => {
  const { fadeItem } = await import("../server/director/fading.js");
  const { askText, ASK_MAX } = await import("../server/director/say.js");
  const { kitFromFile } = await import("../server/content/kits.js");
  const { getTopic } = await import("../server/content/curriculum.js");
  const kit = kitFromFile(getTopic("c9-maths-ch08-t01"));
  const its = kit.workedExample.steps.map((_, i) => fadeItem(kit, { index: i })).filter(Boolean);
  assert.ok(its.length, "the census topic's faded steps");
  for (const it of its) for (const p of [it.prompt_en, it.prompt_hi]) {
    assert.match(p, /7, 11, 15/, p);
    assert.match(p, /_{3}/, "the gap");
    assert.ok(p.length <= ASK_MAX, p);
    assert.equal(askText(p), p, "the card shows it whole (askText keeps the tail, which would drop a leading problem)");
  }
});
