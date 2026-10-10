// Round 4 (journey audit #15, main session 2026-10-10): the small UI defects the journey found, pinned.
//   the Hello cards after the greeting show her whole face (a centred square, not a full-width strip of forehead);
//   the set-up mic test closes its AudioContext once (a second close() was an unhandled "Cannot close a closed
//   AudioContext." page error when Continue ran the stop again);
//   the parent home's try-at-home tip starts with a capital; the parent tabs are at the 14 px floor.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { atHomeText } from "../src/parent/copy.ts";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("Hello: the compact face is a centred square", () => {
  assert.match(read("src/child/child.css"), /\.hello-main\[data-compact\] \.hello-face \{ height: 168px; width: 168px; align-self: center; \}/);
});

test("set-up mic test: end() closes the AudioContext once, and the tone's close is caught", () => {
  const src = read("src/onboarding/Check.tsx");
  assert.match(src, /let ended = false;\s*const end = \(\) => \{\s*if \(ended\) return;\s*ended = true;/);
  assert.match(src, /if \(ctx\.state !== "closed"\) void ctx\.close\(\)\.catch\(\(\) => \{\}\);/);
  assert.match(src, /o\.onended = \(\) => void ctx\.close\(\)\.catch\(\(\) => \{\}\);/);
  assert.ok(!/void ctx\.close\(\);/.test(src), "no uncaught close left");
});

test("parent home: the tip starts with a capital; the tabs are 14 px", () => {
  assert.equal(atHomeText("At home: ask Riya what they would like to learn about next, and listen to the answer."), "Ask Riya what they would like to learn about next, and listen to the answer.");
  assert.equal(atHomeText("Already capital."), "Already capital.");
  assert.match(read("src/parent/parent.css"), /\.pa-tab \{[^}]*font-size: 0\.875rem;/);
});
