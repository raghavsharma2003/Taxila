// r7 stream E app-notebook-log: Lessons | Made for you; ?made=<id> opens that piece; replays post nothing.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("the Notebook opens the Made page from ?made= and the shelf replays a piece with no lesson in its intent", () => {
  const n = read("src/child/screens/Notebook.tsx");
  assert.match(n, /useState<"lessons" \| "made">\(madeId \? "made" : "lessons"\)/);
  assert.match(n, /<MadeShelf cid=\{cid\} young=\{young\} openId=\{madeId\}/);
  const m = read("src/child/screens/NotebookMade.tsx");
  assert.match(m, /\/api\/studio\/made-for\?childId=/);
  assert.match(m, /intentId: `made:\$\{c\.id\}`/, "a replay intent names no lesson: the stage opens no stream and posts nothing");
  assert.doesNotMatch(m, /\.length\}|\bof\b \$\{|complete/i, "no counts or completion");
});

test("an empty shelf says what will be there, with her name", () => {
  assert.match(read("src/copy/en.ts"), /"nb\.madeEmpty": "Things \{T\} makes for you will be here\."/);
  assert.match(read("src/child/screens/NotebookMade.tsx"), /tr7\("nb\.madeEmpty", \{ T: name \}\)/);
});
