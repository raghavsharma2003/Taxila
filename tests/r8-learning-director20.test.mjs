// Round 7 F, director20 (dc-r8-director20): her authored replies around an aside; greetSimpler; a card's `ask`; the backTo
// joint; a switch's en is the same line in English. Pure: check.mjs over the pilots and the aside-replies file.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { asideReplyErrors, greetErrors, jointErrors, structureErrors, kitTopic } from "../scripts/lesson-scripts/check.mjs";

const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), "utf8"));
const PILOTS = ["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c6-maths-ch06-t01"];

test("R1: the aside-replies file holds every kind, slots right, nothing asked in a reply, a sad set", () => {
  const d = read("data/lesson-aside-replies.json");
  assert.deepEqual(asideReplyErrors(d), []);
  const bad = structuredClone(d);
  bad.kinds.food.replies[0] = { hi: "Momos mujhe bhi pasand hain, tumhe kaunse pasand hain?", en: "I like momos too, which do you like?" };
  const e = asideReplyErrors(bad);
  assert.ok(e.some((x) => /kinds\.food\.replies\[0\]: exactly one \{word\}/.test(x)) && e.some((x) => /kinds\.food\.replies\[0\]: asks nothing/.test(x)));
  assert.ok(d.sad.replies.every((f) => !/\{/.test(f.hi + f.en)));
});

test("R2 and S1: every pilot has a greetSimpler and five joint kinds; a switch's en says Hindi", () => {
  for (const id of PILOTS) {
    const s = read(`data/lesson-scripts/${id}.json`);
    assert.deepEqual([...greetErrors(s), ...jointErrors(s)], [], id);
    assert.equal(s.joints.backTo.length, 3);
    assert.ok(s.joints.hindiSwitch.every((f) => /hindi/i.test(f.en) && !/english/i.test(f.en)), id);
  }
  const s = read("data/lesson-scripts/c4-maths-ch05-t01.json");
  s.greetSimpler = { hi: "Aaj kya seekhenge?", en: "What will we learn today?" };
  assert.ok(greetErrors(s).some((x) => /one plain sentence, no question/.test(x)));
});

test("S1: a card's ask is its question alone", () => {
  const s = read("data/lesson-scripts-staged/c7-maths-ch02-t01.json");
  const c = s.skills[2].checks.find((x) => x.id === "c1");
  assert.match(c.ask.hi, /A ya B\?$/);
  c.ask = { hi: "Kahani A ya B. Batao.", en: "Story A or B. Tell me." };
  assert.ok(structureErrors(s, kitTopic(s.topicId)).some((x) => /checks\[0\]\.ask: the card's question alone/.test(x) || /\.ask: the card's question alone/.test(x)));
});
