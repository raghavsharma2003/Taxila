// Round 7 F, director16 D11 (v6.8, dc-r7-held-board): a unit (a card plus the teaching that leads into it) is spoken over its
// card's board, so every spoken part must be true of that board; no rhetorical "?" outside a card; the "?"-over-a-stated-
// fraction lint covers any n/p; distractors are policed within the skill only. Pure: check.mjs on the pilot scripts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { unitsOf, unitFigureErrors, rhetoricalQuestionErrors, askBoardQuestionErrors, remediationKeyErrors, boardErrors, figureOf } from "../scripts/lesson-scripts/check.mjs";

const script = (id) => JSON.parse(readFileSync(new URL(`../data/lesson-scripts/${id}.json`, import.meta.url), "utf8"));
const topic = (cls, id) => JSON.parse(readFileSync(new URL(`../data/kits/${cls}-maths.json`, import.meta.url), "utf8")).topics.find((t) => t.topicId === id);
const PILOTS = ["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c6-maths-ch06-t01"];

test("units: a point is spoken over its ask's board, a remediation over its then-card's, a bridge over the next skill's first card", () => {
  const s = script("c5-maths-ch02-t01");
  const u = Object.fromEntries(unitsOf(s).map((x) => [x.id, x]));
  const k = s.skills[0];
  assert.deepEqual(u[`${k.skillId}/${k.explain[1].id}`].board, k.explain[1].ask.board ?? k.explain[1].board);
  assert.deepEqual(u[`${k.skillId}/remediation[0]`].board, k.remediation[0].then.board);
  assert.deepEqual(u[`${k.skillId}/bridge`].board, s.skills[1].explain[0].ask?.board ?? s.skills[1].explain[0].board);
  assert.ok(u[`${k.skillId}/remediation[0]`].parts.some(([f]) => f === "say"));
});

test("the four pilots: every unit true of its card board (figure + the whiteboard gate), no rhetorical '?', no '?' over a stated fraction", async () => {
  for (const id of PILOTS) {
    const s = script(id);
    assert.deepEqual([...unitFigureErrors(s), ...rhetoricalQuestionErrors(s), ...askBoardQuestionErrors(s), ...remediationKeyErrors(s)], [], id);
    const kit = topic(id.slice(0, 2), id);
    assert.deepEqual((await boardErrors(s, kit)).errors, [], id);
  }
});

test("D11.1: a remediation that teaches on its own (no longer drawn) picture is caught against its then-card board", async () => {
  const s = script("c5-maths-ch02-t01");
  // director16: a say about a ribbon in 6 pieces over a then-card line in other parts — W10 counts it
  s.skills[0].remediation[0].then.board = { template: "fraction-line@1", params: { den: 11, from: 0, to: 1 } };
  const { errors } = await boardErrors(s, topic("c5", "c5-maths-ch02-t01"));
  assert.ok(errors.some((x) => /remediation\[0\]: W10\.screen_claims_drawn/.test(x)), errors.join("\n"));
  // a teaching line naming a strip over a round-whole card board is a figure error
  const c = script("c4-maths-ch05-t01");
  c.skills[2].explain[2].ask.board = { template: "wholes@1", params: { wholes: [{ parts: 2 }, { parts: 4 }] } };
  assert.ok(unitFigureErrors(c).some((x) => /s3\/e3 point: it points at a bar, the board is wholes@1/.test(x)));
});

test("D11.2: a rhetorical question in a point is refused (the '?'-drop cut 'Neeche ka 4? Patti ke 4 barabar tukde.')", () => {
  const s = script("c5-maths-ch02-t02");
  s.skills[0].explain[0].point.hi = "Woh ek hissa 1/4 hai. Neeche ka 4? Patti ke 4 barabar tukde.";
  assert.ok(rhetoricalQuestionErrors(s).some((x) => /explain\[0\]\.point: a question outside a card \("Neeche ka 4\?"\)/.test(x)));
});

test("D11.4: '?' over any stated n/p is caught (D10 checked only 1/p); unnamed bars pose a compare without naming or answering it", () => {
  const s = script("c5-maths-ch02-t02");
  const e4 = s.skills[1].explain[3];
  assert.match(e4.ask.prompt.hi, /2\/3/);
  assert.ok(e4.ask.board.params.bars.every((b) => b.label === "" && b.shade === 0));
  e4.ask.board.params.bars.forEach((b) => { b.label = "?"; });
  assert.ok(askBoardQuestionErrors(s).some((x) => /e4: its board labels a bar of 3 parts "\?"/.test(x)));
  // e2's ask board no longer equals its answer board
  const e2 = script("c5-maths-ch02-t02").skills[0].explain[1];
  assert.notDeepEqual(e2.ask.board, e2.ask.answerBoard);
  // equal strips are the same figure as bars, so a strip pose and a bars close agree
  assert.equal(figureOf({ template: "wholes@1", params: { as: "bar", wholes: [{ parts: 2 }, { parts: 4 }] } }), figureOf({ template: "fraction-bars@1", params: { bars: [{ parts: 4 }, { parts: 2 }] } }));
});

test("D11.6: distractors only count within the skill; later skills' keys still do", () => {
  const s = script("c5-maths-ch02-t01");
  const later = s.skills[1].explain.find((e) => e.ask?.wrongIfMis && /\d\/\d/.test(e.ask.wrongIfMis));
  if (later) {
    s.skills[0].remediation[0].say.hi += ` ${later.ask.wrongIfMis} bhi socho.`;
    assert.ok(!remediationKeyErrors(s).some((x) => x.includes(`distractor of ${s.skills[1].skillId}`)));
  }
  const t = script("c5-maths-ch02-t01");
  const key = t.skills[1].explain.find((e) => /^\d+\/\d+/.test(String(e.ask?.key ?? "")))?.ask.key;
  t.skills[0].remediation[0].say.hi += ` ${key} bhi.`;
  assert.ok(remediationKeyErrors(t).some((x) => x.includes(`states ${String(key).split(" ")[0]}, the key of ${t.skills[1].skillId}`)));
});
