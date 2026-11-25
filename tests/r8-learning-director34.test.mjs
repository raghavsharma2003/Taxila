// Learning 023 Part 1 (dc-r8-director34; docs/patches/to-learning/023-director34-result-boards-several-wrong-answers-first-turns.md): the
// checker's d35 rules. 1 a value she states after an answer or in a told step is drawn on the board under it; 2 wrongAnswers; 3 the first
// teaching turn is 60 words or fewer; 4 every card has a reask; 5 a reason does not open on its own wrong answer and "nahi"; 6 one frame
// once in a skill (F6 lines); 7 the aside replies by kind. Each on a failing and a passing fixture (tests/fixtures/scripts-023/), the nine
// real scripts unchanged without --d35, and the judges' rows of director34 caught by rule 1 on the scripts as they were judged.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { d35Errors, D35_READY, isD35, undrawnValueHits, undrawnValueNotes, drawnValues, statedValues, wrongAnswerErrors, firstTurn,
  missingReasks, verdictOpenHits, frameLines, replyKindErrors, d35ReportLines, D35_FIRST_MAX, boardHasSlot } from "../scripts/lesson-scripts/check.mjs";

const FIX = (f) => JSON.parse(readFileSync(new URL(`./fixtures/scripts-023/${f}.json`, import.meta.url), "utf8"));
// (director35 clause 53, release 61: c4-maths-ch01-t02 staged again)
// (director36, 2026-11-25: c6-maths-ch07-t03 live after two passing runs, clause 71)
const LIVE = ["c4-maths-ch05-t01", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c5-maths-ch02-t03", "c6-maths-ch06-t01", "c6-maths-ch07-t01", "c6-maths-ch07-t03"];
const STAGED = ["c4-maths-ch01-t02", "c4-maths-ch06-t01"];
const load = (d, t) => JSON.parse(readFileSync(new URL(`../data/${d}/${t}.json`, import.meta.url), "utf8"));
const S = Object.fromEntries([...LIVE.map((t) => [t, load("lesson-scripts", t)]), ...STAGED.map((t) => [t, load("lesson-scripts-staged", t)])]);
const FROZEN = "./fixtures/eval-results/hybrid-side-by-side/results/2026-11-24-director34/scripts";
const J = Object.fromEntries([...LIVE, ...STAGED].map((t) => [t, JSON.parse(readFileSync(new URL(`${FROZEN}/${t}.json`, import.meta.url), "utf8"))]));
const rule = (n) => (e) => e.filter((x) => x.includes(`(Learning 023 rule ${n})`));
// (d35 closing: the scripts as they were before round d35's fixes — git df9ed5591 — keep each rule's catch tested now the nine are fixed)
const BEFORE = (f) => JSON.parse(readFileSync(new URL(`./fixtures/scripts-023/before-d35/${f}.json`, import.meta.url), "utf8"));
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const run = (args, staged = false) => {
  const dir = staged === true ? "data/lesson-scripts-staged" : staged || null;
  try { return { code: 0, out: execFileSync("node", ["scripts/lesson-scripts/check.mjs", ...args], { cwd: ROOT, encoding: "utf8", env: { ...process.env, ...(dir ? { LESSON_SCRIPTS_DIR: dir } : {}) }, maxBuffer: 1 << 26 }) }; }
  catch (e) { return { code: e.status, out: String(e.stdout ?? "") }; }
};

test("023: D35_READY holds the nine scripts of round d35; the passing fixture passes every rule, forced", () => {
  assert.deepEqual([...D35_READY].sort(), [...LIVE, ...STAGED].sort());
  assert.equal(isD35(FIX("pass")), false);
  assert.deepEqual(d35Errors(FIX("pass"), { force: true }), []);
  assert.deepEqual(d35Errors(FIX("rule1-fail")), []); // (not ready, not forced: nothing)
  assert.deepEqual(frameLines(FIX("pass")), []);
});

// ---- 1 a stated value is drawn on the board under it
test("023 rule 1: what a board draws: labels, a sum's equation, a bar's parts and shaded parts, a grid's rows and columns, a line's ticks", () => {
  const rect = drawnValues({ template: "measured@1", params: { shape: "rect", unit: "cm", w: 24, h: 18 } });
  assert.ok(rect.nums.has("24") && rect.nums.has("18") && !rect.nums.has("42"));
  assert.ok(drawnValues({ template: "area-grid@1", params: { w: 24, h: 18, mode: "perimeter", unit: "cm" } }).nums.has("84"));
  const bar = drawnValues({ template: "fraction-bars@1", params: { bars: [{ parts: 12, shade: 9, label: "" }] } });
  assert.ok(bar.fracs.has("9/12") && !bar.fracs.has("3/4") && !bar.nums.has("4") && !bar.nums.has("3"));
  assert.ok(drawnValues({ template: "shade-grid@1", params: { rows: 5, cols: 3, shade: 0 } }).fracs.has("1/3"));
  const line = drawnValues({ template: "fraction-line@1", params: { den: 4, from: 0, to: 2, marks: [] } });
  assert.ok(line.nums.has("2") && !line.fracs.has("7/4"));
  assert.ok(drawnValues({ template: "angle@1", params: { angles: [{ deg: 90, name: "Q" }], tester: true } }).things.has("tester"));
});

test("023 rule 1: what a sentence states: fractions, numbers, a named mark; the operands of a sum are its working, its result is stated", () => {
  const v = (t) => statedValues(t).map((x) => `${x.kind}:${x.v}`);
  assert.deepEqual(v("Toh 24 + 18 = 42 cm."), ["number:42"]);
  assert.deepEqual(v("dono mein 4 mein se 3 bade hisse rangeen. 6/8 aur 9/12 dono 3/4 hain."), ["fraction:6/8", "fraction:9/12", "fraction:3/4", "number:4", "number:3"]);
  assert.deepEqual(v("P par tester rakho"), ["mark:P", "thing:tester"]);
});

test("023 rule 1: the step said over the worked board fails; over its resultBoard it passes", () => {
  const e = rule(1)(d35Errors(FIX("rule1-fail"), { force: true }));
  assert.equal(e.length, 1);
  assert.match(e[0], /^t-023-s1\/workedExample\.steps\[1\]\.told: states "42" over the workedExample\.board/);
  assert.deepEqual(rule(1)(d35Errors(FIX("pass"), { force: true })), []);
});

test("023 rule 1, as judged: every judges' row of director34 is a rule-1 error on the frozen scripts", () => {
  const rows = {
    "c6-maths-ch06-t01": ["s2/workedExample.steps[1].told"], // "24 + 18 = 42" over the rectangle
    "c5-maths-ch02-t01": ["s3/workedExample.steps[0].told", "s3/workedExample.steps[1].told"], // "7/4 ka mark" over a line in quarters
    "c5-maths-ch02-t03": ["s2/workedExample.steps[0].told", "s2/workedExample.steps[1].told", "s3/workedExample.steps[0].told", "s3/workedExample.steps[1].told"],
    "c4-maths-ch01-t02": ["s2/workedExample.steps[0].told"], // the P step: a tester said over angles that draw none
    "c4-maths-ch06-t01": ["s2/workedExample.steps[1].told"], // the told "260 centimetre"
    "c6-maths-ch07-t03": ["s1/workedExample.answer", "s2/c2.why"], // "4 mein se 3" over a 12-part bar; s2 c2 with no answer board
  };
  for (const [t, ats] of Object.entries(rows)) {
    const e = rule(1)(d35Errors(J[t], { force: true }));
    for (const a of ats) assert.ok(e.some((x) => x.startsWith(`${t}-${a}:`)), `${t} ${a}`);
  }
  assert.match(rule(1)(d35Errors(J["c6-maths-ch07-t03"], { force: true })).find((x) => x.includes("s1/workedExample.answer")), /"4", "3"|"3\/4"/);
});

test("023 rule 1: a card's reason over its own answerBoard is a D line, not an error", () => {
  const s = FIX("pass");
  s.skills[0].explain[0].ask.why = { hi: "aadha chakkar 16 m, toh poora 32 m", en: "x" };
  assert.deepEqual(undrawnValueHits(s), []);
  assert.deepEqual(undrawnValueNotes(s).map((x) => x.missing), [["16"]]);
  assert.ok(d35ReportLines(s).some((x) => x.startsWith("D t-023-s1/e1.why:")));
});

test("023 rule 1 (main's ruling): a card with no answerBoard is a D line, unless its posing board leaves a slot for the value (s2 c2's kind)", () => {
  const s = FIX("pass");
  delete s.skills[0].explain[0].ask.answerBoard;
  s.skills[0].explain[0].ask.why = { hi: "ek chakkar 32 m", en: "x" };
  assert.deepEqual(undrawnValueHits(s), []);
  assert.deepEqual(undrawnValueNotes(s).map((x) => x.at), ["t-023-s1/e1.why"]);
  assert.equal(boardHasSlot({ template: "compare@1", params: { left: { title: "Upar", items: ["40", "5"] }, right: { title: "Neeche", items: ["56"] } } }), true);
  assert.equal(boardHasSlot({ template: "compare@1", params: { left: { title: "Chocolate", items: ["16 cm"] }, right: { title: "Hisse", items: ["6 cm", "2 cm"] } } }), false);
  s.skills[0].explain[0].ask.board = { template: "compare@1", params: { left: { title: "Lambai", items: ["10", "6"] }, right: { title: "Chakkar", items: ["16"] } } };
  assert.deepEqual(undrawnValueHits(s).map((x) => x.at), ["t-023-s1/e1.why"]);
  // (before d35's fixes c6-ch07-t03 s2 c2 was the only such card; the nine scripts today have none)
  assert.deepEqual(undrawnValueHits(BEFORE("c6-maths-ch07-t03")).filter((y) => y.kind === "card reason").map((y) => y.at), ["c6-maths-ch07-t03-s2/c2.why", "c6-maths-ch07-t03-s2/c2.whyShort"]);
  const cards = Object.values(S).flatMap((x) => undrawnValueHits(x).filter((y) => y.kind === "card reason").map((y) => y.at));
  assert.deepEqual(cards, []);
});

// ---- 2 wrongAnswers
test("023 rule 2: three named answers in all, wrongIfMis counted; none the key or an accepted form, none twice; a reason never names the key", () => {
  const e = wrongAnswerErrors(FIX("rule2-fail"));
  assert.equal(e.length, 4);
  for (const re of [/4 > 2 beside wrongIfMis/, /wrongAnswers\[1\]: "32 m" is the key/, /wrongAnswers\[2\]\.why: names the answer "32 m"/, /wrongAnswers\[3\]: "20 m" is named in wrongAnswers\[0\] too/]) assert.ok(e.some((x) => re.test(x)), String(re));
  assert.deepEqual(wrongAnswerErrors(FIX("rule2-pass")), []);
  assert.deepEqual(d35Errors(FIX("rule2-pass"), { force: true }), []);
  const dup = FIX("rule2-pass");
  dup.skills[0].explain[0].ask.wrongAnswers[0].answer = "16 m";
  assert.ok(wrongAnswerErrors(dup).some((x) => /wrongIfMis already/.test(x)));

  // (two beside wrongIfMis pass; a third fails; with no wrongIfMis three pass)
  const three = FIX("rule2-pass");
  three.skills[0].explain[0].ask.wrongAnswers.push({ answer: "26 m", why: { hi: "Ek lambai chhoot gayi; chaaron bhujayein judti hain.", en: "x" } });
  assert.ok(wrongAnswerErrors(three).some((x) => /3 > 2 beside wrongIfMis/.test(x)));
  delete three.skills[0].explain[0].ask.wrongIfMis;
  assert.deepEqual(wrongAnswerErrors(three), []);
});

// ---- 3 the first teaching turn
test("023 rule 3: hook, first point and its card by the engine's count, against 60", () => {
  assert.equal(D35_FIRST_MAX, 60);
  const f = firstTurn(FIX("rule3-fail"));
  assert.ok(f.total > 60 && f.total === f.hook + f.point + f.card);
  assert.equal(rule(3)(d35Errors(FIX("rule3-fail"), { force: true })).length, 1);
  assert.ok(firstTurn(FIX("pass")).total <= 60);
  // (before d35's fixes eight of the nine ran over — c6-ch06-t01 among them; the nine scripts today all fit)
  assert.ok(firstTurn(BEFORE("c6-maths-ch06-t01")).total > 60);
  assert.equal(rule(3)(d35Errors(BEFORE("c6-maths-ch06-t01"), { force: true })).length, 1);
  const over = Object.entries(S).filter(([, s]) => firstTurn(s).total > 60).map(([t]) => t).sort();
  assert.deepEqual(over, []);
});

// ---- 4 re-asks
test("023 rule 4: a card with no reask", () => {
  assert.deepEqual(missingReasks(FIX("rule4-fail")).map((x) => x.at), ["t-023-s1/e1"]);
  assert.equal(rule(4)(d35Errors(FIX("rule4-fail"), { force: true })).length, 1);
  assert.deepEqual(missingReasks(FIX("pass")), []);
});

// ---- 5 a reason that opens on the verdict
test("023 rule 5: a whyAlt opening on its own wrong answer and \"nahi\"; c5-t03 s1 e1's \"1 nahi:\" was the one in the nine (fixed in d35)", () => {
  assert.deepEqual(verdictOpenHits(FIX("rule5-fail")).map((x) => x.at), ["t-023-s1/e1.whyAlt"]);
  assert.deepEqual(verdictOpenHits(FIX("pass")), []);
  assert.deepEqual(verdictOpenHits(BEFORE("c5-maths-ch02-t03")).map((x) => x.at), ["c5-maths-ch02-t03-s1/e1.whyAlt"]);
  const all = Object.values(S).flatMap((s) => verdictOpenHits(s).map((x) => x.at));
  assert.deepEqual(all, []);
});

// ---- 6 one frame once in a skill (a line, never an error)
test("023 rule 6: two reasons sharing six words running, numbers masked, are an F6 line and no error; c5-t02 skill 1's frame was listed (fixed in d35)", () => {
  assert.equal(frameLines(FIX("rule6-fail")).length, 1);
  assert.deepEqual(d35Errors(FIX("rule6-fail"), { force: true }), []);
  assert.ok(frameLines(BEFORE("c5-maths-ch02-t02")).some((x) => /^F6 c5-maths-ch02-t02-s1: "# bada number hai par isse"/.test(x)));
  assert.deepEqual(frameLines(S["c5-maths-ch02-t02"]), []);
});

// ---- 7 the aside replies
test("023 rule 7: replyKinds, a liking's words outside liking, the \"twice\" line", () => {
  const e = replyKindErrors(FIX("asides-fail"));
  assert.equal(e.length, 3);
  assert.ok(e.some((x) => /^replyKinds: missing/.test(x)));
  assert.ok(e.some((x) => /phraseReplies\[1\]: a liking's words \("pasand"\)/.test(x))); // (its return asks what happened, not a liking)
  assert.ok(e.some((x) => /againReplies\[1\]: "Yeh baat toh do baar aa gayi\." goes/.test(x)));
  assert.deepEqual(replyKindErrors(FIX("asides-pass")), []); // (phraseReplies[0] answers a liking return: a liking there is right)
});

// ---- the nine real scripts, without --d35, as before
test("023: the nine scripts pass without --d35 (plain, and --standard --d32 --d33 --d34); rule 7 is a note, exit 0", () => {
  for (const t of LIVE) {
    for (const args of [[t], [t, "--standard", "--d32", "--d33", "--d34"]]) { const r = run(args); assert.equal(r.code, 0, `${args.join(" ")}\n${r.out.slice(0, 2000)}`); }
  }
  for (const t of STAGED) {
    for (const args of [[t], [t, "--standard", "--d32", "--d33", "--d34"]]) { const r = run(args, true); assert.equal(r.code, 0, `${args.join(" ")}\n${r.out.slice(0, 2000)}`); }
  }
  for (const s of Object.values(S)) assert.deepEqual(d35Errors(s), []);
});

test("023: with --d35 a script is held to the rules for the run (c6-maths-ch06-t01 as it was before d35 fails on rules 1, 3, 4; the replies file as it was, on rule 7)", () => {
  const r = run(["c6-maths-ch06-t01", "--d35"], "tests/fixtures/scripts-023/before-d35");
  assert.equal(r.code, 1);
  for (const n of [1, 3, 4]) assert.ok(r.out.includes(`(Learning 023 rule ${n})`), `rule ${n}`);
  assert.ok(replyKindErrors(BEFORE("lesson-aside-replies")).length > 0, "the replies file before d35 fails rule 7");
  // (today: the script and the replies file pass --d35)
  const now = run(["c6-maths-ch06-t01", "--d35"]);
  assert.equal(now.code, 0, now.out.slice(0, 2000));
  assert.ok(!now.out.includes("data/lesson-aside-replies.json: FAIL"));
  assert.deepEqual(replyKindErrors(JSON.parse(readFileSync(new URL("../data/lesson-aside-replies.json", import.meta.url), "utf8"))), []);
});
