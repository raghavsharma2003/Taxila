// W2-C #6: ONE interest registry (shared/interests.js). Onboarding's pictures, the persona's session detection, Forge's
// skins and Studio's allowlist must agree with it — three taxonomies drifted apart before (personalisation audit §2.6:
// 5 of 12 tiles fell to Forge "generic").
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { INTEREST_REGISTRY, INTEREST_IDS, TILE_IDS, STUDIO_INTERESTS, interestOf, skinOf, interestIdsOf, interestsIn } from "../shared/interests.js";
import { INTERESTS as PERSONA_INTERESTS } from "../server/persona/signals.js";
import { INTEREST_IDS as FORGE_SKINS, interestIdOf } from "../server/forge/strings.js";

test("the onboarding pictures are the registry's tiles, in order (src/child/interests.ts reads them from the registry)", () => {
  assert.deepEqual([...TILE_IDS], ["cricket", "football", "space", "animals", "drawing", "music", "dance", "cooking", "trains", "stories", "building", "nature"]);
  const src = readFileSync(new URL("../src/child/interests.ts", import.meta.url), "utf8");
  assert.match(src, /from "\.\.\/\.\.\/shared\/interests\.js"/);
  assert.match(src, /INTERESTS: readonly string\[\] = TILE_IDS/);
});

test("every persona interest (the VIBE row's exampleDomain) is a registry id", () => {
  for (const id of Object.keys(PERSONA_INTERESTS)) assert.ok(INTEREST_IDS.includes(id), `persona interest ${id} is not in the registry`);
});

test("every registry skin is a Forge skin, and Forge's own keyword map gives every tile its registry skin", () => {
  for (const x of INTEREST_REGISTRY) assert.ok(FORGE_SKINS.includes(x.skin), `${x.id} → ${x.skin} is not a Forge skin`);
  for (const id of TILE_IDS) {
    assert.equal(interestIdOf(interestOf(id).label), skinOf(id), `Forge maps the "${interestOf(id).label}" tile to ${interestIdOf(interestOf(id).label)}, the registry to ${skinOf(id)}`);
    assert.notEqual(skinOf(id), "generic", `${id} has a real skin`);
  }
});

test("Studio's allowlist is a subset of the registry; labels and lookups are stable; no banned category", () => {
  for (const id of STUDIO_INTERESTS) assert.ok(INTEREST_IDS.includes(id));
  assert.equal(interestOf("Animals").id, "animals");
  assert.equal(skinOf("unknown thing"), "generic");
  assert.deepEqual(interestIdsOf(["Cricket", "cricket", "kites", "Space"]), ["cricket", "space"]);
  assert.deepEqual(interestsIn("mujhe cricket aur rocket pasand hai"), ["cricket", "space"]);
  assert.deepEqual(interestsIn("bread"), [], "whole words only");
  const banned = /relig|caste|politic|god|temple|mosque|church|brand|body|party/i;
  for (const x of INTEREST_REGISTRY) assert.ok(!banned.test(x.id + x.label + x.words.join(" ")), x.id);
});
