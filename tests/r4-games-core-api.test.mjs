// core3d@1 contract (docs/design/round4/build/games-core/CORE-API.md): the pure parts the server and the client share.
//   - the dress delta a model writes is validated FIELD BY FIELD; a value outside its enum is dropped, never repaired;
//   - code rules no model can override: the lesson language, brisk only on a secure skill, music off for classes 4-5
//     unless the child turned it on;
//   - tier detection sends software / known-bad GPUs to the 2D board twin unless the harness forces 3D.
import test from "node:test";
import assert from "node:assert/strict";
import { validateDelta, dressFor, ENGINE_THEMES, DRESS_ENUMS } from "../src/play/engines/core3d/api.ts";
import { detectTier } from "../src/play/engines/core3d/tier.ts";

const base = { theme: "neela-nebula", wrapper: "mine-sweep", music: "calm", pace: "steady", teacherMove: "notice", lang: "hinglish" };

test("validateDelta keeps only enum values, drops the rest, never repairs", () => {
  assert.deepEqual(validateDelta("antariksh", { theme: "laal-grah", wrapper: "comet-catch", music: "off", pace: "brisk", teacherMove: "ghost-first", lang: "en" }),
    { theme: "laal-grah", wrapper: "comet-catch", music: "off", pace: "brisk", teacherMove: "ghost-first", lang: "en" });
  // near misses are dropped, not fixed
  assert.deepEqual(validateDelta("antariksh", { theme: "Laal-Grah", wrapper: " mine-sweep", music: "loud", pace: "fast", teacherMove: "notice ", lang: "english" }), {});
  // a theme from another engine is not a theme here
  assert.deepEqual(validateDelta("antariksh", { theme: ENGINE_THEMES.khand[0] }), {});
  // free text never passes, whatever the key
  assert.deepEqual(validateDelta("antariksh", { say: "Shabash beta!", theme: "neela-nebula" }), { theme: "neela-nebula" });
  for (const junk of [null, undefined, "x", 3, [], [{ theme: "laal-grah" }]]) assert.deepEqual(validateDelta("antariksh", junk), {});
});

test("dressFor: the language is the lesson's, brisk only when secure, music off for 4-5 unless the child turned it on", () => {
  const r = (o) => dressFor({ engine: "antariksh", base, delta: null, classLevel: 6, secure: false, childMusicOn: false, lessonLang: "hinglish", verb: "fire", ...o });
  const a = r({ delta: { lang: "en", pace: "brisk", theme: "hara-toofan" } });
  assert.equal(a.dress.lang, "hinglish"); assert.equal(a.from.lang, "rule");
  assert.equal(a.dress.pace, "steady"); assert.equal(a.from.pace, "rule");
  assert.equal(a.dress.theme, "hara-toofan"); assert.equal(a.from.theme, "model");
  assert.equal(r({ delta: { pace: "brisk" }, secure: true }).dress.pace, "brisk");
  const young = r({ classLevel: 4, delta: { music: "drive" } });
  assert.equal(young.dress.music, "off"); assert.equal(young.musicAllowed, false);
  assert.equal(r({ classLevel: 5, childMusicOn: true, delta: { music: "drive" } }).dress.music, "drive");
  assert.equal(r({}).dress.music, "calm");
  assert.equal(r({ verb: "scan" }).verb, "scan");
  for (const k of Object.keys(DRESS_ENUMS)) assert.ok(k in a.dress);
});

test("detectTier: software and known-bad GPUs get the board twin; lite GPUs the lite budget; the harness may force 3D", () => {
  const f = (o) => detectTier({ webgl2: true, majorCaveat: false, renderer: "Mali-G57 MC2", saveData: false, contextLosses: 0, ...o }).tier;
  assert.equal(f({}), "3d");
  assert.equal(f({ webgl2: false }), "2d");
  assert.equal(f({ renderer: "Google SwiftShader" }), "2d");
  assert.equal(f({ renderer: "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)))", force: "3d" }), "3d");
  assert.equal(f({ renderer: "PowerVR Rogue GE8320" }), "3d-lite");
  assert.equal(f({ saveData: true }), "3d-lite");
  assert.equal(f({ contextLosses: 1 }), "3d-lite");
  assert.equal(f({ contextLosses: 2, force: "3d" }), "2d");
  assert.equal(f({ force: "2d" }), "2d");
});
