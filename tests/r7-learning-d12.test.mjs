// Round 7 F, director17 D12 (dc-r7-script-walk-v6-9): a bridge has no board of its own (it is spoken over the next card's);
// no card is posed on a board that shows its answer; a card's why never states a later card's key in its skill; c4's s2
// points model one grouping on their card's board. Pure: check.mjs on the pilot scripts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { answerOnBoardErrors, whyKeyErrors, structureErrorsV2 } from "../scripts/lesson-scripts/check.mjs";

const script = (id) => JSON.parse(readFileSync(new URL(`../data/lesson-scripts/${id}.json`, import.meta.url), "utf8"));
const topic = (cls, id) => JSON.parse(readFileSync(new URL(`../data/kits/${cls}-maths.json`, import.meta.url), "utf8")).topics.find((t) => t.topicId === id);
const PILOTS = ["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c6-maths-ch06-t01"];

test("the four pilots: no bridgeBoard, no card posed on its answer, no why stating a later key", () => {
  for (const id of PILOTS) {
    const s = script(id);
    assert.ok(s.skills.every((k) => !k.bridgeBoard), `${id}: a bridge is spoken over the next card's board`);
    assert.deepEqual([...answerOnBoardErrors(s), ...whyKeyErrors(s)], [], id);
  }
});

test("D12.1: a v2.3 bridge with its own board is refused (c6 steady 46/80: the bridge drew its own picture)", () => {
  const s = script("c6-maths-ch06-t01");
  s.skills[0].bridgeBoard = { template: "measured@1", params: { shape: "rect", unit: "cm", w: 6, h: 4, trace: true } };
  assert.ok(structureErrorsV2(s, topic("c6", "c6-maths-ch06-t01")).some((x) => /s1\/bridgeBoard: a bridge is spoken over the next card's board/.test(x)));
});

test("D12.2: a card posed on shaded or named bars is a picture-read (c5-t02's s1 worked board showed 1/6 and 1/3 shaded)", () => {
  const s = script("c5-maths-ch02-t02");
  const we = s.skills[0].workedExample;
  assert.ok(we.yourStep.board.params.bars.every((b) => b.shade === 0 && b.label === ""), "the yourStep has its own unnamed board");
  delete we.yourStep.board;   // posed over the worked board again, 1/6 and 1/3 shaded
  assert.ok(answerOnBoardErrors(s).some((x) => /s1\/workedExample\.yourStep: posed on fraction-bars@1 with 2 wholes already shaded or named/.test(x)));
  // the order card on labelled, shaded bars
  const t = script("c5-maths-ch02-t02");
  t.skills[0].checks[1].board = t.skills[0].checks[1].answerBoard;
  assert.ok(answerOnBoardErrors(t).some((x) => /s1\/c2: posed on/.test(x)));
  // a shaded bar whose NAME is asked ("?") is the given, not the answer
  const u = script("c5-maths-ch02-t02");
  assert.deepEqual(answerOnBoardErrors(u).filter((x) => /s3\/e1/.test(x)), []);
});

test("D12.3: a why stating a later card's key in its skill is refused (c5-t02 e1's '1/8 bas 1/4 ka aadha' gave e2's 1/4)", () => {
  const s = script("c5-maths-ch02-t02");
  assert.equal(s.skills[0].explain[1].ask.key, "1/4");
  s.skills[0].explain[0].ask.why.hi += ", 1/8 bas 1/4 ka aadha";
  assert.ok(whyKeyErrors(s).some((x) => /s1\/e1\.why: states 1\/4, the key of c5-maths-ch02-t02-s1\/e2/.test(x)));
});

test("D12.4: c4's s2 points each model one grouping on their card's board, never the ask's own answer", () => {
  const s = script("c4-maths-ch05-t01");
  for (const b of s.skills[1].explain) {
    const board = b.ask?.board ?? b.board;
    assert.equal(board.template, "equal-groups@1", `${b.id}: a grouping is drawn`);
    const each = board.params.each ?? null;
    assert.notEqual(String(each), String(b.ask.key).match(/\d+/)?.[0], `${b.id}: the drawn group is not the ask's answer`);
    assert.match(b.point.hi, /group/i, `${b.id}: the point walks the grouping`);
  }
});
