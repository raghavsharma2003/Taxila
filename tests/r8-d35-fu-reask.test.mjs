// d35 follow-up 6: the checker refuses a re-ask that is its card's own closing question (case, punctuation and spaces aside).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { reaskIsQuestion, d35Errors } from "../scripts/lesson-scripts/check.mjs";

const live = (t) => JSON.parse(readFileSync(new URL(`../data/lesson-scripts/${t}.json`, import.meta.url), "utf8"));

test("a re-ask equal to the prompt's last sentence is refused; another wording passes", () => {
  const s = structuredClone(live("c5-maths-ch02-t03"));
  assert.deepEqual(reaskIsQuestion(s), []);
  const c = s.skills[0].checks[0];
  const last = c.prompt.hi.trim().split(/(?<=[.!?])\s+/).at(-1);
  c.reask = { hi: `  ${last.toUpperCase().replace(/[?]/, " ?")} `, en: c.reask.en };
  const hits = reaskIsQuestion(s);
  assert.equal(hits.length, 1); assert.match(hits[0].at, /checks|c1/);
  assert.ok(d35Errors(s).some((e) => /follow-up 6/.test(e)));
});
