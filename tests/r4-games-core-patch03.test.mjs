// games-core patch 03 (docs/design/round4/build/games-core/patches/03-play-at-practice-beat.diff): the practice beat may
// offer a real game. Which skill it practises (the current practice move's skill, then the plan's earlier skills, never one
// not yet taught, only where play admits it), and the child's decline ("not_this") gives the slot back to the library piece.
import { test } from "node:test";
import assert from "node:assert/strict";
import { playSkillsFor, studioSeam, hostFeedback, _lesson, _reset, _setDeps } from "../server/studio/seam.js";

const plan = ["t-s1", "t-s2", "t-s3"];

test("patch 03: the practice move's skill first, then earlier plan skills in plan order; never a later (untaught) one", () => {
  const all = () => true;
  assert.deepEqual(playSkillsFor("t-s2", plan, all), ["t-s2", "t-s1"]);
  assert.deepEqual(playSkillsFor("t-s1", plan, all), ["t-s1"]);
  // the G2 trace: the practice skill has no admitted game → an earlier taught one, never the plan's last
  assert.deepEqual(playSkillsFor("t-s2", plan, (s) => s !== "t-s2"), ["t-s1"]);
  assert.deepEqual(playSkillsFor("t-s1", plan, (s) => s === "t-s3"), []);
  // no known practice skill: plan order; a practice skill outside the plan is tried alone
  assert.deepEqual(playSkillsFor(null, plan, (s) => s !== "t-s1"), ["t-s2", "t-s3"]);
  assert.deepEqual(playSkillsFor("x-s9", plan, all), ["x-s9"]);
});

test("patch 03: declining the practice-beat game ('not_this') brings the library practice piece back", async () => {
  _reset();
  _setDeps({ q: async () => ({ rows: [] }) });
  studioSeam.prefetch({ lessonId: "L-dec", purpose: "practice", child: { id: "c1", class_level: 5 } });
  const L = _lesson("L-dec");
  assert.ok(L);
  const lib = { intentId: "L-dec:practice", need: "practice", archetype: "lib:sorter", state: "ready", retired: false };
  const game = { intentId: "L-dec:play:practice", need: "practice", archetype: "play:nishana/place", source: "play", state: "ready", retired: false, declineTo: lib };
  L.pieces.set(game.intentId, game);
  const r = await hostFeedback({ lessonId: "L-dec", intentId: game.intentId, action: "not_this" });
  assert.deepEqual(r, { ok: true });
  assert.equal(L.pieces.get(lib.intentId), lib);
  assert.equal(lib.retired, false);
  assert.ok(L.excluded.has("play:nishana/place"));
  _reset();
});
