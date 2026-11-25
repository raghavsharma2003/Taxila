// Learning 024 Part 1 (dc-r8-director35 item 7; ruling 2, mechanisms 2, 5, 7): the checker's d36 rules. 1 an own step states its
// board where a step of its worked example has a result board; 2 a named reason's sentence is one card's; 3 the first teaching turn is
// 60 words with its start line; 5 P lines: a follow-up card's or a check's reason that states a value neither board draws. Each on a
// failing and a passing fixture (built from tests/fixtures/scripts-023/pass.json), and the nine scripts as they are today, the hits per
// script pinned so that an author's fix shows as a change here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { d36Errors, OWN_BOARD_NONE, D36_READY, isD36, ownStepBoardHits, sharedReasonHits, firstTurnWithStart, answerValueLines, d36ReportLines, firstTurn,
  d35Errors, D36_FIRST_MAX } from "../scripts/lesson-scripts/check.mjs";
import { FALLBACK_JOINTS } from "../server/director/help.js";

const PASS = () => JSON.parse(readFileSync(new URL("./fixtures/scripts-023/pass.json", import.meta.url), "utf8"));
const rule = (n) => (e) => e.filter((x) => x.includes(`(Learning 024 rule ${n})`));
// (director36, 2026-11-25: c6-maths-ch07-t03 live after two passing runs, clause 71)
const LIVE = ["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c5-maths-ch02-t03", "c6-maths-ch06-t01", "c6-maths-ch07-t01", "c6-maths-ch07-t03"];
const STAGED = ["c4-maths-ch01-t02", "c4-maths-ch06-t01"];
const load = (d, t) => JSON.parse(readFileSync(new URL(`../data/${d}/${t}.json`, import.meta.url), "utf8"));
const S = Object.fromEntries([...LIVE.map((t) => [t, load("lesson-scripts", t)]), ...STAGED.map((t) => [t, load("lesson-scripts-staged", t)])]);
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const run = (args) => {
  try { return { code: 0, out: execFileSync("node", ["scripts/lesson-scripts/check.mjs", ...args], { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 26 }) }; }
  catch (e) { return { code: e.status, out: String(e.stdout ?? "") }; }
};
// (the passing fixture: 023's pass with its own step given the last step's result board)
const fixed = () => { const s = PASS(), we = s.skills[0].workedExample; we.yourStep.board = we.steps.at(-1).resultBoard; return s; };

test("024: D36_READY is empty until the scripts pass; nothing fires unforced; the passing fixture passes rules 1-3, forced", () => {
  assert.deepEqual(D36_READY, []);
  assert.equal(isD36(fixed()), false);
  assert.deepEqual(d36Errors(PASS()), []);
  assert.deepEqual(d36Errors(fixed(), { force: true }), []);
  for (const t of Object.keys(S)) assert.deepEqual(d36Errors(S[t]), [], t);
});

// ---- 1 an own step states its board
test("024 rule 1: an own step with no board after a step's result board fails; with a board of its own it passes", () => {
  const e = rule(1)(d36Errors(PASS(), { force: true }));
  assert.equal(e.length, 1);
  assert.match(e[0], /yourStep: no board of its own after a step's result board \(the walk redraws the worked board at the step's first word\)/);
  assert.deepEqual(ownStepBoardHits(fixed()), []);
  // (no step with a result board: an own step may be posed on the worked board)
  const s = PASS(); for (const x of s.skills[0].workedExample.steps) delete x.resultBoard;
  assert.deepEqual(ownStepBoardHits(s), []);
});
test("024 rule 1: a step in OWN_BOARD_NONE passes with no board; listed with a board of its own, it fails", () => {
  const s = PASS(); s.topicId = "c6-maths-ch07-t03"; s.skills[0].skillId = "c6-maths-ch07-t03-s3";
  assert.deepEqual(rule(1)(d36Errors(s, { force: true })), []);
  s.skills[0].workedExample.yourStep.board = s.skills[0].workedExample.steps.at(-1).resultBoard;
  assert.match(rule(1)(d36Errors(s, { force: true })).join("\n"), /OWN_BOARD_NONE c6-maths-ch07-t03-s3\/workedExample\.yourStep: listed but the step has a board/);
});

// ---- 2 a named reason's sentence is one card's
test("024 rule 2: a whyAlt sentence in another card's named reason fails, naming both paths; numbers kept, case and punctuation aside", () => {
  const s = fixed(), k = s.skills[0], y = k.workedExample.yourStep;
  y.wrongAnswers = [{ answer: "16", why: { hi: "Pehle yeh socho. 16 M sirf aadha chakkar hai, wapas aane mein utna hi aur lagta hai!", en: "x" } }];
  const e = rule(2)(d36Errors(s, { force: true }));
  assert.equal(e.length, 1);
  assert.ok(e[0].includes("t-023-s1/workedExample.yourStep.wrongAnswers[0].why") && e[0].includes("t-023-s1/e1.whyAlt"), e[0]);
  // (a number is kept: the same sentence with 18 is another sentence)
  y.wrongAnswers[0].why.hi = "18 m sirf aadha chakkar hai; wapas aane mein utna hi aur lagta hai.";
  assert.deepEqual(sharedReasonHits(s), []);
  // (one card's whyAlt and its own named answer's why are one card's)
  const t = fixed(); t.skills[0].explain[0].ask.wrongAnswers = [{ answer: "16", why: { hi: t.skills[0].explain[0].ask.whyAlt.hi, en: "x" } }];
  assert.deepEqual(sharedReasonHits(t), []);
});

// ---- 3 the first teaching turn with its start line
test("024 rule 3: the start line tips a 023-fitting first turn over 60; the script's own shorter forms fit", () => {
  const pad = (s, n) => { const b = s.skills[0].explain[0]; b.point.hi = `${b.point.hi} ${Array.from({ length: n }, () => "aur").join(" ")}`; return s; };
  const base = firstTurn(fixed()).total, s = pad(fixed(), D36_FIRST_MAX - 3 - base);
  assert.equal(firstTurn(s).total, D36_FIRST_MAX - 3);
  assert.deepEqual(d35Errors(s, { force: true }).filter((x) => x.includes("(Learning 023 rule 3)")), []);
  const f = firstTurnWithStart(s);
  assert.equal(f.startFrom, "help.js FALLBACK_JOINTS.startAnyway");
  assert.equal(f.start, Math.max(...FALLBACK_JOINTS.startAnyway.map((x) => x.hi.split(/\s+/).length)));
  assert.equal(rule(3)(d36Errors(s, { force: true })).length, 1);
  s.joints = { ...(s.joints ?? {}), startAnyway: [{ hi: "Chalo, shuru.", en: "Come on." }, { hi: "Theek hai.", en: "Okay." }, { hi: "Chalo.", en: "Go." }] };
  assert.equal(firstTurnWithStart(s).startFrom, "joints.startAnyway");
  assert.deepEqual(rule(3)(d36Errors(s, { force: true })), []);
  assert.match(d36ReportLines(s)[0], /^T36 t-023-s1\/e1: start 2 \(joints\.startAnyway\) \+ hook \d+ \+ point \d+ \+ card \d+ = 59 \(limit 60\)$/);
});

// ---- 5 P lines
test("024 P: a check's reason stating a value neither its posing board nor an answerBoard draws is a P line; an answerBoard that draws it clears it", () => {
  const s = fixed();
  s.skills[0].checks.push({ id: "c1", prompt: { hi: "Is khet ka poora chakkar kitne cm?", en: "x" }, key: "84", why: { hi: "24 + 18 + 24 + 18 = 84 cm", en: "x" },
    board: { template: "measured@1", params: { shape: "rect", unit: "cm", w: 24, h: 18 } } });
  const p = answerValueLines(s);
  assert.equal(p.length, 1);
  assert.deepEqual(p[0].missing, ["84"]);
  assert.ok(d36ReportLines(s).some((x) => x.startsWith("P t-023-s1/c1.why: states \"84\"")));
  assert.deepEqual(rule(1)(d36Errors(s, { force: true })), []); // (P is never an error)
  s.skills[0].checks[0].answerBoard = { template: "unrolled@1", params: { unit: "cm", sides: [24, 18, 24, 18], total: 84 } };
  assert.deepEqual(answerValueLines(s), []);
});

// ---- the nine scripts as they are today (2026-11-24, main/d36): pinned so that an author's fix shows as a change
const PIN = {
  //                   rule 1, rule 2, rule 3 (total), P
  // (re-pinned at d36's close, from the scripts as the round left them: every rule-1 and rule-2 hit fixed, every first turn at 60 or
  // under, the P lines the answer boards cleared; the commit that moved each is in the close's repins note)
  // (director36, 2026-11-25: c4-maths-ch05-t01 failed one gate line on a rewritten sentence and keeps its release-61 script: clauses
  // 65 and 70; its pin back to the value before the round)
  "c4-maths-ch05-t01": [0, 0, 64, 9],
  "c5-maths-ch02-t01": [0, 0, 60, 4],
  "c5-maths-ch02-t02": [0, 0, 60, 2],
  "c5-maths-ch02-t03": [0, 0, 60, 2],
  "c6-maths-ch06-t01": [0, 0, 60, 16],
  "c6-maths-ch07-t01": [0, 0, 60, 15],
  "c4-maths-ch01-t02": [0, 0, 58, 4],
  "c4-maths-ch06-t01": [0, 0, 60, 11],
  "c6-maths-ch07-t03": [0, 0, 60, 11],
};
test("024 on the nine scripts: rule 1, rule 2, the first turn with its start line and the P lines, per script", () => {
  const got = Object.fromEntries(Object.keys(PIN).map((t) => [t, [ownStepBoardHits(S[t]).length, sharedReasonHits(S[t]).length, firstTurnWithStart(S[t]).total, answerValueLines(S[t]).length]]));
  assert.deepEqual(got, PIN);
  for (const t of Object.keys(PIN)) assert.equal(rule(3)(d36Errors(S[t], { force: true })).length, PIN[t][2] > D36_FIRST_MAX ? 1 : 0, t);
  // (director35 ruling 6's row, by name: s2 e1's and s1 e2's reasons shared "Tumne dono number ulat diye." until d88b3eb4e; re-pinned
  // at d36's close)
  assert.deepEqual(sharedReasonHits(S["c5-maths-ch02-t02"]).map((x) => [x.at, x.other, x.sentence]), []);
  // (c0d40c4ea gave c4-ch01-t02 s1's own step its board; cdb2de1c2 gave s3's its own)
  assert.deepEqual(ownStepBoardHits(S["c4-maths-ch01-t02"]).map((x) => x.at), []);
});

test("024 item 4: c6-ch07-t03 s2 step 1's told \"8 × 7 = 56\" passes 023 rule 1 because 8 × 7 is working and the worked board draws \"56 page\"", () => {
  const we = S["c6-maths-ch07-t03"].skills[1].workedExample;
  assert.equal(we.steps[0].resultBoard, undefined);
  assert.match(we.steps[0].told.hi, /8 × 7 = 56/);
  assert.ok(JSON.stringify(we.board).includes("56 page"));
  assert.ok(!d35Errors(S["c6-maths-ch07-t03"], { force: true }).some((x) => x.includes("s2/workedExample.steps[0].told")));
});

test("024 CLI: --d36 prints T36 for a named script; without it the output has no T36 and the exit is as before", () => {
  // (re-pinned at d36's close: c5-maths-ch02-t02 failed rule 2 and rule 3 until 096c70a89 and d88b3eb4e; it now passes --d36. The
  // failing path of each rule is held by its fixture test above)
  const a = run(["c5-maths-ch02-t02", "--d36"]);
  assert.equal(a.code, 0);
  assert.match(a.out, /T36 c5-maths-ch02-t02-s1\/e1: start \d+ /);
  assert.doesNotMatch(a.out, /\(Learning 024 rule \d\)/);
  const b = run(["c5-maths-ch02-t02"]);
  assert.equal(b.code, 0);
  assert.doesNotMatch(b.out, /T36 |Learning 024/);
});
