// to-brain 052, the predicates, checker and grader builder's parts (A4, A5, A6, B3's note, B5's two reads, C, D).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { vpcTurns, vpcErrors, VPC_OPENER_WORDS, VPC_LEAD_WORDS } from "../scripts/lesson-scripts/check.mjs";
import { wordsIn, VPC_MAX } from "../server/director/state.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const live = (t) => JSON.parse(readFileSync(join(ROOT, "data/lesson-scripts", `${t}.json`), "utf8"));

// ── A5: one count for the turn after a right answer ──
// (the two cards of c6-maths-ch06-t01 s2 as they stood at be79d35ab~1: the engine counted the turn over 70 and split it, the checker's F
// line read 53/61)
const OLD_E1_WHY_SHORT = { hi: "chaaron bhujayein: 10 + 6 + 10 + 6 = 32 m", en: "all four sides: 10 + 6 + 10 + 6 = 32 m" };
const OLD_E2_POINT = { hi: "Ek aur rectangle: 12 m lamba, 5 m chauda. Upar baayein kone se chalo, 12 m aage, phir 5 m neeche. Ab tum saamne wale kone par ho, yaani aadha chakkar. Baaki aadha bhi utna hi lamba hai. Isliye parimap = 2 × (lambai + chaudai).", en: "Another rectangle: 12 m long, 5 m wide. From the top-left corner go 12 m along, then 5 m down. Now you are at the opposite corner: half a round. The other half is as long. So perimeter = 2 × (length + breadth)." };

test("A5: the engine's count is every token, so + = × are words", () => {
  assert.equal(wordsIn("10 + 6 + 10 + 6 = 32 m"), 10);
  assert.equal(VPC_MAX, 70);
  assert.equal(VPC_OPENER_WORDS + VPC_LEAD_WORDS, 4);
});

test("A5: c6-ch06 s2 e2 with the old short reason and point is an error, with its parts; today's script passes", () => {
  const today = live("c6-maths-ch06-t01");
  assert.deepEqual(vpcErrors(today), []);
  const old = structuredClone(today);
  const s2 = old.skills.find((k) => k.skillId === "c6-maths-ch06-t01-s2");
  s2.explain.find((b) => b.id === "e1").ask.whyShort = OLD_E1_WHY_SHORT;
  s2.explain.find((b) => b.id === "e2").point = OLD_E2_POINT;
  const e = vpcErrors(old);
  assert.equal(e.length, 1, e.join("\n"));
  assert.match(e[0], /^c6-maths-ch06-t01-s2\/e2: .*short reason 12 \+ lead-in 1 \+ point 46 \+ card 12 = 74 words .*> 70/);
  const t = vpcTurns(today).find((p) => p.at === "c6-maths-ch06-t01-s2/e2");
  assert.ok(t.total <= VPC_MAX, String(t.total));
});

test("A5: an error only for a script in D34_READY (or forced)", () => {
  const s = structuredClone(live("c6-maths-ch06-t01"));
  s.topicId = "x-not-ready";
  s.skills[1].explain[0].ask.whyShort = OLD_E1_WHY_SHORT;
  s.skills[1].explain[1].point = OLD_E2_POINT;
  assert.deepEqual(vpcErrors(s), []);
  assert.equal(vpcErrors(s, { force: true }).length, 1);
});
