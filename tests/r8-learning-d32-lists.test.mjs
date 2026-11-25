// d32 lists (2026-11-19): the checker's d32 lists after the five live scripts and the two staged rewrites (c4-maths-ch01-t02,
// c6-maths-ch07-t01) were read cold and fixed. D32_READY and D32_PICTURES_READY hold the same seven topics; PICTURE_NONE names only
// cards that exist and draw nothing new (no pictureBoard, no second view); all seven pass d32Errors with rule 7 on; and the
// "appended wholes" answer-board allowance holds only when the posing board and the answer board have the same `as` shape.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { D32_READY, D32_PICTURES_READY, PICTURE_NONE, d32Cards, d32Errors, viewOf, noPictureCards, v22Errors, isD32 } from "../scripts/lesson-scripts/check.mjs";
import { INTERESTS } from "../server/persona/signals.js";

const SEVEN = [["lesson-scripts", "c4-maths-ch05-t01"], ["lesson-scripts", "c5-maths-ch02-t01"], ["lesson-scripts", "c5-maths-ch02-t02"],
  ["lesson-scripts", "c5-maths-ch02-t03"], ["lesson-scripts", "c6-maths-ch06-t01"], ["lesson-scripts-staged", "c4-maths-ch01-t02"] /* (director35 clause 53, release 61: c4-maths-ch01-t02 staged again) */, ["lesson-scripts", "c6-maths-ch07-t01"],
  // (d33, 2026-11-23: the two new staged scripts, written to Learning 021, read cold and fixed, join both lists)
  ["lesson-scripts-staged", "c4-maths-ch06-t01"], ["lesson-scripts-staged", "c6-maths-ch07-t03"]];
const load = (d, t) => {
  const s = JSON.parse(readFileSync(new URL(`../data/${d}/${t}.json`, import.meta.url), "utf8"));
  Object.defineProperty(s, "__interests", { value: INTERESTS, enumerable: false });
  return s;
};
const S = Object.fromEntries(SEVEN.map(([d, t]) => [t, load(d, t)]));

test("d32 lists: D32_READY and D32_PICTURES_READY hold the same nine topics, each once", () => {
  const seven = SEVEN.map(([, t]) => t).sort();
  assert.deepEqual([...D32_READY].sort(), seven);
  assert.deepEqual([...D32_PICTURES_READY].sort(), seven);
  assert.equal(new Set(D32_READY).size, D32_READY.length);
  assert.equal(new Set(D32_PICTURES_READY).size, D32_PICTURES_READY.length);
});

test("d32 lists: every PICTURE_NONE entry names a card that exists and has neither a pictureBoard nor a second view, with a reason", () => {
  assert.ok(PICTURE_NONE.length >= 1);
  for (const n of PICTURE_NONE) {
    assert.ok(S[n.topicId], `${n.at}: its topic is one of the seven`);
    assert.ok(typeof n.reason === "string" && n.reason.length > 20, `${n.at}: a reason`);
    const c = d32Cards(S[n.topicId]).find((x) => x.at === n.at);
    assert.ok(c, `${n.at}: the card exists`);
    assert.equal(c.card.pictureBoard, undefined, `${n.at}: no pictureBoard`);
    // (d33, 2026-11-23: a card with `noView: true` has its board's second view taken away by the checker and the walk — c6-ch06-t01 s1
    // worked step, c4-ch01-t02 s1 worked step, c4-ch06-t01's four s3 cards — so the flag stands for "no second view" here)
    assert.ok(c.card.noView === true || !(c.board?.template && viewOf(c.board, c.at)), `${n.at}: its board has no second view`);
    assert.ok(noPictureCards(S[n.topicId]).some((x) => x.at === n.at), `${n.at}: rule 7 would list it`);
  }
});

test("d32 lists: all seven scripts pass d32Errors on the gate, with rule 7 on (and forced)", () => {
  for (const [t, s] of Object.entries(S)) {
    assert.ok(isD32(s) && D32_PICTURES_READY.includes(t), t);
    assert.deepEqual(d32Errors(s), [], t);
    assert.deepEqual(d32Errors(s, { force: true }), [], `${t} forced`);
  }
  // (rule 7 bites: a listed script whose bare card loses its PICTURE_NONE entry would fail — shown by taking the picture off a card)
  const s = JSON.parse(JSON.stringify(S["c6-maths-ch07-t01"]));
  const bare = d32Cards(s).find((c) => c.card.pictureBoard && !(c.board?.template && viewOf(c.board, c.at)));
  assert.ok(bare, "a card whose only picture is its authored pictureBoard");
  delete bare.card.pictureBoard; delete bare.card.pictureCaption;
  assert.ok(d32Errors(s).some((x) => x.startsWith(`${bare.at}: its board`) && /Learning 020 rule 7/.test(x)), bare.at);
});

// A one-check fragment: a judgement card posed over one bar, its answer board appending the equal bar beside it.
const HI = (hi, en = "x") => ({ hi, en });
const frag = (posedAs, answerAs) => ({
  topicId: "t-frag", terms: [], joints: {},
  skills: [{ skillId: "t-frag-s1", explain: [], remediation: [], checks: [{
    prompt: HI("Kya 1/3 aur 4/12 barabar hain?"), key: "haan", accept: ["haan"], why: HI("dono patti ka ek hi hissa rangeen hai"),
    board: { template: "wholes@1", params: { ...(posedAs ? { as: posedAs } : {}), wholes: [{ parts: 3, shade: 1 }] } },
    answerBoard: { template: "wholes@1", params: { ...(answerAs ? { as: answerAs } : {}), wholes: [{ parts: 3, shade: 1, title: "1/3" }, { parts: 12, shade: 4, title: "4/12" }] } },
  }] }],
});
const poses = (s) => v22Errors(s).filter((x) => /checks\[0\]: its answerBoard poses/.test(x));

test("d32 lists: a wholes posing board answered by appended wholes passes only when both have the same `as`", () => {
  assert.deepEqual(poses(frag("bar", "bar")), [], "bars posed, bars appended: the same drawing, one more beside it");
  assert.equal(poses(frag("bar", null)).length, 1, "bars posed, circles answered: a new figure");
  assert.deepEqual(poses(frag(null, null)), [], "circles posed, circles appended");
  assert.equal(poses(frag(null, "bar")).length, 1, "circles posed, bars answered: a new figure");
});
