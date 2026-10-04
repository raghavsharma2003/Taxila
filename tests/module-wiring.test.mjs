// W1-B review blocker: the turn handler must call the module seams in director/modules.js. Both had unit tests that
// call modules.js directly and passed for a whole build while routes/lesson.js never called them, so in production a
// failed activity stayed a screen target (W1-B #4) and G1 fill answers graded nothing (#5, #6). This pins the WIRING:
//   - noteModuleEvents(state, moduleEvents) runs on the turn's state before the module answer is read (and so before
//     step(), which reads state.module);
//   - the module answer is moduleAnswerOf(state, moduleEvents), never the old inline filter that read the frame's own
//     `correct` for any `state.module.itemId === activeItemId`.
// Static by necessity: the turn handler needs Neon. tests/prod/w1b-tray.mjs and w1b-mounts.mjs are the end-to-end
// checks (they failed 4/5 and 42/48 on the unwired server). The handler moves to server/brain/turn.js in W2 (BR1), so
// both places are searched.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";

const ROOT = new URL("..", import.meta.url);
const files = ["server/routes/lesson.js",
  ...(existsSync(new URL("server/brain/", ROOT)) ? readdirSync(new URL("server/brain/", ROOT), { recursive: true }).filter((f) => f.endsWith(".js")).map((f) => `server/brain/${f}`) : [])];
const src = files.map((f) => readFileSync(new URL(f, ROOT), "utf8")).join("\n");

test("the turn handler imports and calls noteModuleEvents before it reads the module answer", () => {
  assert.match(src, /import\s*\{[^}]*\bnoteModuleEvents\b[^}]*\}\s*from\s*"\.\.\/director\/modules\.js"/, "noteModuleEvents is imported");
  const note = src.search(/\bnoteModuleEvents\(\s*state\s*,\s*moduleEvents\s*\)/);
  const answer = src.search(/\bmoduleAnswerOf\(\s*state\s*,\s*moduleEvents\s*\)/);
  assert.ok(note >= 0, "noteModuleEvents(state, moduleEvents) is called (see server/forge/seam-patches/w1b-lesson-wiring.patch)");
  assert.ok(answer < 0 || note < answer, "noteModuleEvents runs before the module answer is read");
});

test("the module answer comes from moduleAnswerOf, never the frame's own `correct` via the old inline filter", () => {
  assert.match(src, /import\s*\{[^}]*\bmoduleAnswerOf\b[^}]*\}\s*from\s*"\.\.\/director\/modules\.js"/, "moduleAnswerOf is imported");
  assert.match(src, /const\s+moduleAnswer\s*=\s*moduleAnswerOf\(\s*state\s*,\s*moduleEvents\s*\)/, "moduleAnswer = moduleAnswerOf(state, moduleEvents)");
  assert.doesNotMatch(src, /state\.module\.itemId\s*===\s*state\.activeItemId\s*\)\s*\.at\(-1\)\?\.data/, "the old inline filter is gone");
});
