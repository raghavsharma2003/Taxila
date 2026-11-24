// round 7 S5 (main's director2 decision: "de-recite: sentence-shaped text in the prompts that shows up verbatim"; the inherited
// law: sentence-shaped prompt text gets recited → write shapes, not lines). The phrases director2 heard back word for word are
// gone from every shape and every rewrite instruction. Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as SH from "../server/director/shapes.js";

const RECITED = [/no guilt/i, /carry on, a short break,? or stop for today/i, /\bsay back what they said\b/i, /say back in a few/i];
test("the phrases director2 recited are in no shape (stop check-in, boredom, off-format answer)", () => {
  const shapes = [SH.stopCheck(), SH.boredOffer(), SH.offFormat({ said: "4" })];
  for (const s of shapes) for (const re of RECITED) assert.doesNotMatch(s, re, s);
  const src = readFileSync(new URL("../server/director/shapes.js", import.meta.url), "utf8").replace(/^\s*\/\/.*$/gm, "");
  for (const re of RECITED) assert.doesNotMatch(src, re);
  const say = readFileSync(new URL("../server/brain/say.js", import.meta.url), "utf8").replace(/^\s*\/\/.*$/gm, "");
  for (const re of RECITED) assert.doesNotMatch(say, re);
});
