// Round 5, stream 2: the board and picture tools for the Teacher agent (docs/design/round5/AGENT.md §1; server/studio/tools.js,
// server/studio/picture.js). Every tool returns the screen truth: what actually mounted, never what was asked. Pure apart from
// the in-memory Studio seam; the image and moderation calls are stubbed (no network).
import { test } from "node:test";
import assert from "node:assert/strict";
import { boardShow, boardClear, screenNow, pictureGet, scriptForSpec, describeScript } from "../server/studio/tools.js";
import { _setPictureDeps, _resetPictures, promptFor } from "../server/studio/picture.js";

const L = "00000000-0000-4000-8000-00000000b0a1";
let k = 0;
const lesson = () => `00000000-0000-4000-8000-${String(++k).padStart(12, "0")}`;

test("board.show draws code specs and returns what mounted; the same page twice is refused and the page up stays the truth", async () => {
  const id = lesson();
  const a = await boardShow(id, { kind: "write", lines: ["Half = 1/2", "Quarter = 1/4"] }, { say: "Half matlab 1/2, aur quarter matlab 1/4." });
  assert.equal(a.ok, true);
  assert.equal(a.on, "board");
  assert.deepEqual(a.texts, ["Half = 1/2", "Quarter = 1/4"]);
  assert.deepEqual(a.numbers, ["1/2", "1/4"]);
  const again = await boardShow(id, { kind: "write", lines: ["Quarter = 1/4", "Half = 1/2"] }, { say: "Half matlab 1/2, aur quarter matlab 1/4." });
  assert.equal(again.ok, false);
  assert.deepEqual(again.refused.checks, ["same_page"]);
  assert.equal(again.pageId, a.pageId, "the refused page never replaces the one the child sees");
  assert.equal(screenNow(id).pageId, a.pageId);
  const nl = await boardShow(id, { kind: "number_line", mark: ["1/4"] }, { say: "1/4 number line par: 0 aur 1 ke beech 4 barabar hisse, pehla mark." });
  assert.equal(nl.ok, true);
  assert.match(nl.words, /a number line marked at 1\/4/);
  const parts = await boardShow(id, { kind: "shapes", shapes: [{ shape: "parts", parts: 4, shaded: 1, label: "1/4" }] }, { say: "Ek roti ke 4 barabar parts, ek shaded: 1/4." });
  assert.match(parts.words, /a circle cut into 4 equal parts, 1 shaded/);
  assert.deepEqual(boardClear(id), { ok: true, on: "nothing", words: "the board is empty", texts: [], numbers: [] });
  assert.equal(screenNow(id).on, "nothing");
});

test("board.show refuses honestly: no line to draw beside, an unknown spec, a sketch of something no sketch may show", async () => {
  const id = lesson();
  assert.deepEqual((await boardShow(id, { kind: "write", lines: ["x"] }, { say: "" })).refused.checks, ["no_line"]);
  assert.deepEqual((await boardShow(id, { kind: "hologram" }, { say: "dekho" })).refused.checks, ["spec"]);
  const gun = await boardShow(id, { kind: "draw", subject: "gun" }, { say: "x" });
  assert.equal(gun.ok, false);
  assert.deepEqual(gun.refused.checks, ["subject"]);
});

test("the code specs are bounded (lines, columns, sides) and described in plain words", () => {
  const w = scriptForSpec({ kind: "write", lines: Array.from({ length: 9 }, (_, i) => `line ${i} that is much too long to fit`) });
  assert.equal(w.ops.length, 6);
  assert.ok(w.ops.every((o) => o.text.length <= 24));
  const t = scriptForSpec({ kind: "table", columns: ["a", "b", "c", "d", "e"], rows: [["1", "2"]] });
  assert.equal(t.ops.filter((o) => /^h\d/.test(o.id)).length, 4);
  const hex = scriptForSpec({ kind: "shapes", shapes: [{ shape: "polygon", sides: 6 }] });
  assert.equal(hex.ops[0].points.length, 6);
  assert.match(describeScript(hex), /a 6-sided shape/);
  assert.equal(scriptForSpec({ kind: "write", lines: [] }), null);
});

test("picture.get: a real picture job, moderated before it reaches the child; 'cannot' at once for a subject, a budget, a failed check", async () => {
  _resetPictures();
  const calls = [];
  _setPictureDeps({ generate: async (s) => { calls.push(s); return { b64: Buffer.from("jpeg").toString("base64"), deployment: "stub" }; }, moderate: async () => 0 });
  const id = lesson();
  await boardShow(id, { kind: "write", lines: ["Aloo"] }, { say: "Aloo ek tuber hai." });
  const ev = new Promise((res) => {
    const r = pictureGet(id, "Aloo!", { onEvent: res });
    assert.equal(r.ok, true);
    assert.equal(r.on, "board", "nothing changes on the screen until the picture is ready");
    assert.match(r.words, /a picture of Aloo! is being made/);
  });
  const e = await ev;
  assert.equal(e.type, "content_ready");
  assert.equal(e.truth.on, "picture");
  assert.match(e.truth.words, /a picture of aloo/);
  assert.deepEqual(calls, ["aloo"], "only the normalized subject reaches the image model");
  assert.equal(screenNow(id).on, "picture");
  // the template is fixed; the subject is its only slot
  assert.match(promptFor("aloo"), /^A friendly children's-book illustration of aloo, .*no people, no faces/);
  // cannot: a subject a picture may not show; a person
  assert.deepEqual(pictureGet(id, "meri photo").refused.checks, ["subject"]);
  // moderation refuses (fail closed): the screen is unchanged and the agent hears content_failed
  _setPictureDeps({ moderate: async () => 4 });
  const bad = await new Promise((res) => pictureGet(id, "tree", { onEvent: res }));
  assert.equal(bad.type, "content_failed");
  assert.equal(bad.why, "moderation");
  _setPictureDeps({ moderate: async () => { throw new Error("down"); } });
  assert.equal((await new Promise((res) => pictureGet(id, "river", { onEvent: res }))).type, "content_failed", "a moderation error never shows the picture");
  // budget: the lesson has had its pictures (aloo, tree, river + one more), a cached subject still comes back
  _setPictureDeps({ moderate: async () => 0 });
  await new Promise((res) => pictureGet(id, "moon", { onEvent: res }));
  assert.deepEqual(pictureGet(id, "sun").refused.checks, ["budget"]);
  assert.equal(pictureGet(id, "aloo", { onEvent: () => {} }).job.etaMs, 0, "a picture already made is shown again at once");
  _resetPictures();
});
