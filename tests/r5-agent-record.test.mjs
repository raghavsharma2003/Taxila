// round 5 (stream 4A; main's cohort condition 1, overclaims): the end record words each skill only as far as the agent
// lane's earned read. Sim lab cc4b3d2: in 34 of the agent's 64 overclaims her own read was LOWER than what the parent
// summary told the judge, which the writer composed from right-answer counts only. Pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkOf, endMessages } from "../server/routes/lesson.js";

const child = { first_name: "Dev", class_level: 4 }, teacher = { name: "Asha", pronouns: { subject: "she", object: "her" } };

test("checkOf: understood is shown; an untested partly is practised, not yet checked; the Director lane has none", () => {
  assert.match(checkOf({ read: "understood" }), /^shown/);
  assert.match(checkOf({ read: "partly", depth: "untested" }), /^practised: .*not yet checked with a why or new-situation question/);
  assert.match(checkOf({ read: "partly" }), /^partly/);
  assert.equal(checkOf({ read: "not" }), "still building");
  assert.equal(checkOf(undefined), null);
  assert.equal(checkOf({ read: "unknown" }), null);
});

test("endMessages: a skill with a check gets the wording rule LAST; without checks (the Director lane) the text is as before", () => {
  const turns = [{ text: "neem wale dibbe mein" }];
  const plain = endMessages({ child, teacher, facts: { topic: "T", skills: [{ skill: "a", attempts: 2, unaidedCorrect: 2 }] }, childTurns: turns });
  assert.doesNotMatch(plain[0].content, /check/);
  const agent = endMessages({ child, teacher, facts: { topic: "T", skills: [{ skill: "a", attempts: 2, unaidedCorrect: 2, check: checkOf({ read: "partly", depth: "untested" }) }] }, childTurns: turns });
  const lines = agent[0].content.split("\n");
  assert.match(lines.at(-1), /worded only as far as its check/);
  assert.match(agent[1].content, /"check":"practised/);
  assert.equal(plain[1].content, endMessages({ child, teacher, facts: { topic: "T", skills: [{ skill: "a", attempts: 2, unaidedCorrect: 2 }] }, childTurns: turns })[1].content);
});
