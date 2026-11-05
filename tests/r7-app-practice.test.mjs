// r7 stream E app-practice-entry: "Practise this" on a World station (its topic's practice set), and practice talks.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("a station's topic is its skill id without the -sN suffix", async () => {
  const { topicOfSkill } = await import("../src/ui-v3/kaksha/world.ts");
  assert.equal(topicOfSkill("c6-maths-ch07-t01-s1"), "c6-maths-ch07-t01");
  assert.equal(topicOfSkill("c1-english-ch09-t01-s3"), "c1-english-ch09-t01");
  assert.equal(topicOfSkill("not-a-skill"), null);
});

test("the station sheet offers Practise this (never on a hold), and practice is no longer forced to text", () => {
  const v = read("src/ui-v3/kaksha/views.tsx");
  assert.match(v, /testid="station-practise"/);
  assert.match(read("src/ui-v3/kaksha/screens/KakshaWorld.tsx"), /practiceTo=\{cachedHold\(cid\) \? null : /);
  const l = read("src/child/lesson/LessonScreen.tsx");
  assert.doesNotMatch(l, /textOnly: variant === "practice"/);
  assert.match(l, /textOnly: search\.get\("mode"\) === "text" \|\| prefs\.quiet \|\| cachedTextOnly\(cid\)/);
});

test("the World/Hangar sheet is really fixed (it opened below the page end on phones) and rises above the bottom dock", () => {
  const css = read("src/ui-v3/kaksha/kaksha.css");
  // `.kx-screen > :not(.kx-sky) { position: relative }` is 0,2,0; the fix must out-rank it
  assert.match(css, /\.kx-screen > :not\(\.kx-sky\) \{ position: relative;/);
  assert.match(css, /\.kx-screen > \.kx-sheet\.kx-sheet \{ position: fixed; \}/);
  assert.match(css, /\.kx-hasdock > \.kx-sheet\.kx-sheet \{ bottom: calc\(64px/);
});
