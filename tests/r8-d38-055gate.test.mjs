// d38 RULING-A7 P7 (to-brain 055, the cap): driven walks of c4-maths-ch05-t01 that the offline matrix does not reach, run through check-run's
// WHOLE list of gated predicates, as the matrix is. Each walk is a lesson of the dry harness itself (evals/hybrid-side-by-side.mjs --drive:
// the child answers what is live with its key until the card or asked step is on the table, then says the case's lines; read by the harness's
// own reader, planned by the route's planTurn, recorded as every matrix row is; the reply stub is the harness's, held for the whole process).
// At the card (skills[0].explain[2], "Ab rangin tukdon ka fraction kya hoga?", key 2/3: a bare "haan" is no answer there) and at the worked
// problem's first asked step ("… neeche kya aayega?", key 5):
//   (a) four hearings (the question, then "phir se bolo" three times, honoured and counted), C1 on a miss, then each of: a miss, a give-up, a
//       bare "haan", "samajh nahi aaya", a picture request, a Hindi request, "phir se bolo", a side-topic (a park; the AI question and its
//       reply), "let me try" then "haan", and the right answer;
//   (b) four hearings, then a clarify (C3's help), then a miss;
//   (c) four hearings, then a side-topic (the return turn), then a second side-topic (the told answer), then the next turn — by a park and by
//       the AI question and its reply.
// Every walk goes on three turns after its lines (answering what is live), so no lesson ends on the case's last turn. Every gated predicate
// reads 0 on every row of every walk. A flag is a fault of the walk or a clash to stop at, never a case left out.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { lessonFlags, PENDING, PREDICATES } from "../evals/hybrid-side-by-side/dry-predicates.mjs";
import { atQuestionOf } from "../server/director/question-run.js";

const ROOT = new URL("..", import.meta.url).pathname;
const TOPIC = "c4-maths-ch05-t01";
const SCRIPT = JSON.parse(readFileSync(join(ROOT, "data/lesson-scripts", `${TOPIC}.json`), "utf8"));
// (the reviewer's probe lines, pr1/tools/walk.mjs)
const L = { miss: "7", give: "pata nahi", yes: "haan", clar: "samajh nahi aaya", pic: "screen par dikhao na", hindi: "hindi mein bolo", again: "phir se bolo",
  park: "mujhe cricket pasand hai", ai: "aapko virat pasand hai?", reply: "chauka", try: "mujhe khud try karne do", right: "@key" };
const FOUR = ["again", "again", "again"];
const CASES = {
  ...Object.fromEntries(["miss", "give", "yes", "clar", "pic", "hindi", "again", "park", "right"].map((k) => [`a-${k}`, [...FOUR, "miss", k]])),
  "a-aireply": [...FOUR, "miss", "ai", "reply"],
  "a-try": [...FOUR, "miss", "try", "yes"],
  "b-clar": [...FOUR, "clar", "miss"],
  "c-park": [...FOUR, "park", "park", "yes", "park", "yes"],
  "c-aireply": [...FOUR, "ai", "reply", "ai", "reply", "yes"],
};
const AT = { card: { seek: "card", skip: 2, P: ".skills[0].explain[2].ask" }, step: { seek: "step", skip: 0, P: ".skills[0].workedExample.steps[0].ask" } };
const WALKS = Object.entries(AT).flatMap(([w, a]) => Object.entries(CASES).map(([k, lines]) => ({ name: `${w}-${k}`, topicId: TOPIC, seek: a.seek, skip: a.skip, tail: 3, then: lines.map((x) => L[x]) })));
// (P6: the told answer at the cap said as its reason alone, then a clarify answered with help twice and a third — at the card)
WALKS.push({ name: "card-p6", topicId: TOPIC, seek: "card", skip: 2, tail: 3, then: [...FOUR.map((x) => L[x]), "7", "7", "samajh nahi aaya", "phir bhi samajh nahi aaya", "phir bhi samajh nahi aaya"] });

// (d38 RULING-A8 Q1: a right answer after a help turn at an asked step is read against the step's own key — a give-up's help and a clarify's
// help at one hearing (ending on the step's question), at the card the same two to show cards were never affected; C1's three are the a-walks)
for (const [w, a] of Object.entries(AT)) for (const k of ["give", "clar"]) WALKS.push({ name: `${w}-q1-${k}`, topicId: TOPIC, seek: a.seek, skip: a.skip, tail: 3, fresh: true, then: [L[k], L.right] });
// (and the return's help — C1 at a return, after the AI line and its reply — then the right answer)
WALKS.push({ name: "step-q1-ret", topicId: TOPIC, seek: "step", skip: 0, tail: 3, then: [...FOUR, "ai", "reply", "right"].map((x) => L[x]) });

// (d38 RULING-A8 Q2: C1 reaches every path where the cap would tell with nothing offered — the c-park walk's continuation after C1's turn at
// the step (a miss gets the told step; the right answer the confirm); and main's ruling on Q2's stop: the pure wait at four hearings, at the
// card and the step — wait one as built, then C1's turn, then the told answer or step at the next bare yes)
for (const [k, last] of [["miss", "miss"], ["right", "right"]]) WALKS.push({ name: `step-q2-park-${k}`, topicId: TOPIC, seek: "step", skip: 0, tail: 3, then: [...FOUR, "park", "park", "yes", last].map((x) => L[x]) });
// (main's ruling on 054b: C1 at a wait only where no help turn was said at that question — order 054b's shape at four hearings, two give-ups
// each helped, then a bare yes three times: the wait tells as built, the key at wait three, no C1)
WALKS.push({ name: "card-q2-b3", topicId: TOPIC, seek: "card", skip: 2, tail: 3, then: ["give", "give", "yes", "yes", "yes"].map((x) => L[x]) });
for (const [w, a] of Object.entries(AT)) WALKS.push({ name: `${w}-q2-wait`, topicId: TOPIC, seek: a.seek, skip: a.skip, tail: 3, then: [...FOUR, "yes", "yes", "yes"].map((x) => L[x]) });

// (d38 RULING-A8 Q6: the pizza card, skills[0].explain[1], a yes-or-no card (key "No"; a bare "haan" there is a wrong ANSWER): four hearings
// then a give-up; C1 then a give-up; C1 then "No", the right answer; C1 then "haan", read as the wrong answer it is)
const PIZZA = ".skills[0].explain[1].ask";
for (const [k, lines] of [["four-give", [...FOUR, "give"]], ["c1-give", [...FOUR, "miss", "give"]], ["c1-right", [...FOUR, "miss", "right"]], ["c1-yes", [...FOUR, "miss", "yes"]]])
  WALKS.push({ name: `pizza-q6-${k}`, topicId: TOPIC, seek: "card", skip: 1, tail: 3, pizza: true, then: lines.map((x) => L[x]) });
// (d38 RULING-A10 T1 as RULING-A11 W1 rules it: a remediation of the pizza card's named mistake started at four hearings is that question's C1
// turn; once its follow-up card is closed her turn goes back to the pizza card exactly as built below the cap — the follow-up's verdict, the
// back-to joint, the pizza question. C1 on "7", then "haan" (the remediation and its follow-up), the follow-up answered right, then at the pizza
// card: "No" (the right verdict), "haan" again (the told answer), "pata nahi" (the told answer); four hearings then "haan" first (the remediation
// as the C1 turn), the follow-up right, then "haan". And below four hearings: "haan" at the first hearing, the follow-up right — the same return)
for (const [k, last] of [["right", "right"], ["yes", "yes"], ["give", "give"]])
  WALKS.push({ name: `pizza-w1-${k}`, topicId: TOPIC, seek: "card", skip: 1, tail: 3, pizza: true, then: [...FOUR, "miss", "yes", "right", last].map((x) => L[x]) });
WALKS.push({ name: "pizza-w1-first", topicId: TOPIC, seek: "card", skip: 1, tail: 3, pizza: true, then: [...FOUR, "yes", "right", "yes"].map((x) => L[x]) });
// (d38 main's item U1: a side-topic parked at the pizza card, then "haan" — its named mistake — so its remediation starts, the follow-up answered
// right: the card comes back; answered right: its verdict, and the parked topic's return where the walk says it)
WALKS.push({ name: "pizza-u1-park", topicId: TOPIC, seek: "card", skip: 1, tail: 3, pizza: true, fresh: true, then: ["park", "yes", "right", "right"].map((x) => L[x]) });
WALKS.push({ name: "pizza-w1-low", topicId: TOPIC, seek: "card", skip: 1, tail: 3, pizza: true, fresh: true, then: ["yes", "right"].map((x) => L[x]) });

// Rows a gated predicate flags that this pass does not fix, each named in builder P's report:
// OLDER: none left. (RULING-A8 Q1 took off step-b-clar 20 stepToldEarly: the right answer at an asked step is no longer read as nothing
// after help; Q2 took off step-c-park 22 keyWithWordingUnsaid: that turn is C1's now)
const OLDER = [];
// STOPPED: clashes held for main's ruling — a turn as ruled that a gated predicate no ruling names flags (builder P stopped at each):
// the told answer at the wait's second turn after C1 (waitSecondNotReask), the AI line then the told answer and its check-in
// (aiAskAnswered). (RULING-A8 Q3 took off step-c-aireply 22 goOnJointTwice: the told step after the return turn's joint says none)
// (RULING-A8 Q4 took off card-a-yes 16 and card-a-try 18 waitSecondNotReask, and the five C1-at-a-wait rows Q2 made: the wait's ladder at
// the cap, C1's turn where no help was said at that question, then the told answer or step)
// (RULING-A8 Q5 took off card-c-aireply 20 aiAskAnswered: the told answer's check-in is not the AI line's own question)
// STOPPED (builder Q, held for main's ruling): at the pizza card after C1's turn, "haan" — a wrong answer, read as a misconception — gets the
// misconception's remediation (not the told answer), and after its follow-up card answered right her return to the pizza card is the
// verdict and the short ask "Ab phir se socho, jawab kya hoga?" (C3 at a question heard four times), which shortAskKind flags
// (RULING-A11 W1 took off pizza-q6-c1-yes 16 shortAskKind: after the follow-up card answered right her turn goes back to the pizza card as
// built — the verdict, the back-to joint, the question; never the short ask)
const STOPPED = [];
const EXPECTED = new Set([...OLDER, ...STOPPED]);

let RUN = null;
function run() {
  if (RUN) return RUN;
  const out = mkdtempSync(join(tmpdir(), "taxila-055gate-"));
  try {
    const drive = join(out, "drive.json");
    writeFileSync(drive, JSON.stringify(WALKS));
    const env = { ...process.env, DATABASE_URL: "", DATABASE_URL_DIRECT: "", TAXILA_DB: "" };
    delete env.NODE_TEST_CONTEXT;
    execFileSync(process.execPath, [join(ROOT, "evals/hybrid-side-by-side.mjs"), "--director-only", "--dry", "--drive", drive, "--out", join(out, "o")],
      { cwd: ROOT, env, stdio: ["ignore", "ignore", "pipe"], timeout: 170_000, maxBuffer: 64 * 1024 * 1024 });
    RUN = Object.fromEntries(WALKS.map((w) => [w.name, JSON.parse(readFileSync(join(out, "o", `${w.name}.json`), "utf8")).director]));
    return RUN;
  } finally { rmSync(out, { recursive: true, force: true }); }
}
const norm = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
/** The row of the case's first line: the child's line after the fourth hearing's run began (the first "phir se bolo" after the question). */
function start(rows, w) {
  for (let i = 1; i < rows.length; i++) if (rows[i].who === "child" && rows[i].text === w.then[0] && atQuestionOf(SCRIPT, rows[i - 1].text) === (w.pizza ? PIZZA : AT[w.name.split("-")[0]].P)) return i;
  return -1;
}

test("055 gate: the driven walks reach the cap as each case says", { timeout: 180_000 }, () => {
  const R = run();
  for (const w of WALKS) {
    const rows = R[w.name], i0 = start(rows, w);
    assert.ok(i0 > 0, `${w.name}: the question was asked and its case began`);
    // (the case's lines were said in order, each answered by a turn of hers)
    w.then.forEach((t, k) => { if (t !== "@key") assert.equal(rows[i0 + 2 * k]?.text, t, `${w.name}: line ${k}`); assert.equal(rows[i0 + 2 * k + 1]?.who, "teacher", `${w.name}: her turn after line ${k}`); });
    // (four hearings before the case's fourth line: the question, then three times at the child's request, each her turn at the question)
    const P = w.pizza ? PIZZA : AT[w.name.split("-")[0]].P;
    if (!w.fresh && !w.name.endsWith("-b3")) for (let k = 0; k < 3; k++) assert.equal(atQuestionOf(SCRIPT, rows[i0 + 2 * k + 1].text), P, `${w.name}: hearing ${k + 2}`);
    // (a: the fourth line is a miss and her turn is C1's — help ending on an invitation, the question not said)
    if (w.name.split("-")[1] === "a" || /^pizza-(?:q6-c1|w1-(?:right|yes|give))/.test(w.name)) {
      const c1 = rows[i0 + 7];
      assert.ok((c1.seams ?? []).some((x) => x.right === "help") && (c1.seams ?? []).at(-1)?.right === "yourTurn", `${w.name}: C1's turn: ${norm(c1.text)}`);
    }
  }
});

test("055 gate: every gated predicate reads 0 on every row of every driven walk", { timeout: 180_000 }, () => {
  const R = run();
  const flags = [];
  for (const w of WALKS) for (const x of lessonFlags({ rows: R[w.name], script: SCRIPT }).filter((y) => !PENDING.has(y.predicate))) flags.push(`${w.name} ${x.row} ${x.predicate}`);
  assert.deepEqual(flags.filter((f) => !EXPECTED.has(f)), [], "flags outside the expected-to-fail list");
  assert.deepEqual([...EXPECTED].filter((f) => !flags.includes(f)), [], "expected-to-fail cases that now pass: take them off the list");
});

// (the readings RULING-A7 names, each side, on the driven rows themselves)
const flagAt = (rows, i, name) => lessonFlags({ rows, script: SCRIPT }).some((x) => x.row === i && x.predicate === name);
const child = (text) => ({ who: "child", text, read: "no_evidence" });

test("P1: yourTurnNotThird passes help answering the child's request at a question heard four times, ending on an invitation — the second running too", { timeout: 180_000 }, () => {
  const rows = run()["card-a-clar"];
  const i = start(rows, WALKS.find((w) => w.name === "card-a-clar")) + 9;
  assert.equal(rows[i - 1].text, "samajh nahi aaya");
  assert.equal(PREDICATES.yourTurnNotThird({ rows }, rows[i], i, { script: SCRIPT }), null);
  // (a second such turn running: the clarify again, the help again ending on an invitation)
  const two = [...rows.slice(0, i + 1), child("phir bhi samajh nahi aaya"), rows[i]];
  assert.equal(PREDICATES.yourTurnNotThird({ rows: two }, two[i + 2], i + 2, { script: SCRIPT }), null);
  // (the other side: the same help turn she chose herself — after a wrong answer, no request — still flags)
  const own = [...rows.slice(0, i - 1), { ...rows[i - 1], text: "7", read: "incorrect" }, rows[i]];
  assert.match(String(PREDICATES.yourTurnNotThird({ rows: own }, own[i], i, { script: SCRIPT })), /invitation/);
  // (and the request's help before the fourth hearing reads as before: the walk at three hearings is not this turn)
  const three = [...rows.slice(0, i - 9), ...rows.slice(i - 7, i + 1)];
  assert.match(String(PREDICATES.yourTurnNotThird({ rows: three }, three.at(-1), three.length - 1, { script: SCRIPT })), /invitation/);
});

test("P2: one C1 turn a question however it came — C3's help after a clarify at four hearings is that question's C1 turn, and the miss after it is told", { timeout: 180_000 }, () => {
  for (const w of ["card-b-clar", "step-b-clar"]) {
    const rows = run()[w], i = start(rows, WALKS.find((x) => x.name === w)) + 7;
    assert.equal(rows[i - 1].text, "samajh nahi aaya");
    assert.equal((rows[i].seams ?? []).at(-1)?.right, "yourTurn", `${w}: C3's help ends on the invitation`);
    assert.equal(rows[i + 1].text, "7");
    const told = rows[i + 2];
    assert.ok((told.seams ?? []).some((x) => ["key", "workedStep"].includes(x.right)), `${w}: the miss after it is told: ${norm(told.text)}`);
    assert.notEqual((told.seams ?? []).at(-1)?.right, "yourTurn", `${w}: never two help turns running ending on an invitation`);
  }
});

test("P3 (as restated): the told answer or step in a turn that opens on her reply passes replyCheckin and stepToldEarly at the cap — each other side still flags", { timeout: 180_000 }, () => {
  const R = run();
  const sc = (rows) => ({ script: SCRIPT });
  const stepCtx = (rows, k) => ({ script: SCRIPT, prevIntent: rows[k - 1].intent ?? null, prevRead: rows[k - 1].read, prevChild: rows[k - 1].text });
  const at0 = (name) => start(R[name], WALKS.find((x) => x.name === name));
  // (replyCheckin passes: after the return turn (five hearings), a said-again line, the key, its check-in; and after C1 on a miss (four
  // hearings, C1 given), the AI line's reply, the key, its check-in)
  for (const [name, off] of [["card-c-park", 13], ["card-a-aireply", 11]]) {
    const rows = R[name], i = at0(name) + off;
    assert.deepEqual((rows[i].seams ?? []).map((x) => x.right).slice(-2), ["key", "checkin"], `${name}: ${norm(rows[i].text)}`);
    assert.equal(PREDICATES.replyCheckin({ rows }, rows[i], i, sc(rows)), null, name);
    // (a reply and a check-in with nothing between still flags)
    const bare = { ...rows[i], seams: rows[i].seams.filter((x) => x.right !== "key") };
    assert.match(String(PREDICATES.replyCheckin({ rows }, bare, i, sc(rows))), /check-in/, name);
  }
  { // (three hearings: two of the child's requests and their hearings left out — still flags)
    const rows = R["card-a-aireply"], j0 = at0("card-a-aireply"), i = j0 + 11;
    const three = [...rows.slice(0, j0), ...rows.slice(j0 + 4)];
    assert.match(String(PREDICATES.replyCheckin({ rows: three }, three[i - 4], i - 4, sc(three))), /check-in/);
    // (four hearings, a wording unsaid, no C1 turn before: her turn after the miss says only the verdict — still flags; that turn must be the
    // return turn of RULING-A4, not a told answer)
    const noC1 = rows.map((x, k) => (k === j0 + 7 ? { ...x, text: "7 sahi nahi hai.", seams: [{ left: "start", right: "missVerdict" }] } : x));
    assert.match(String(PREDICATES.replyCheckin({ rows: noC1 }, noC1[i], i, sc(noC1))), /check-in/); }
  // (stepToldEarly passes: after the return turn, the AI line and the told step; after C1 on a miss, the AI line's reply and the told step)
  for (const [name, off] of [["step-c-aireply", 11], ["step-a-aireply", 11]]) {
    const rows = R[name], i = at0(name) + off;
    assert.ok(rows[i].stepAnswer?.told, `${name}: ${norm(rows[i].text)}`);
    assert.equal(PREDICATES.stepToldEarly({ rows }, rows[i], i, stepCtx(rows, i)), null, name);
  }
  { const rows = R["step-a-aireply"], j0 = at0("step-a-aireply"), i = j0 + 11;
    // (a step told at a return at three hearings still flags)
    const three = [...rows.slice(0, j0), ...rows.slice(j0 + 4)];
    assert.match(String(PREDICATES.stepToldEarly({ rows: three }, three[i - 4], i - 4, stepCtx(three, i - 4))), /step told/);
    // (four hearings, the step's wordings unsaid, no C1 turn before: still flags)
    const noC1 = rows.map((x, k) => (k === j0 + 7 ? { ...x, text: "Yeh jawab nahi hai.", seams: [{ left: "start", right: "stepMiss" }] } : x));
    assert.match(String(PREDICATES.stepToldEarly({ rows: noC1 }, noC1[i], i, stepCtx(noC1, i))), /step told/); }
});

test("P6: requestHelped reads a key seam after a miss verdict as the told answer of that part — the go-on line after it passes only with every wording said", { timeout: 180_000 }, () => {
  const rows = run()["card-p6"], i0 = start(rows, WALKS.find((x) => x.name === "card-p6"));
  const told = rows[i0 + 9];
  assert.deepEqual((told.seams ?? []).map((x) => x.right), ["missVerdict", "key", "checkin"], norm(told.text));
  assert.ok(!/jawab hai|answer is/i.test(told.text), "the told answer said as its reason alone");
  // (the fixture walk's row 48: after two helps at the told answer's check-in, the third request answered by the go-on line and a return)
  const M = { who: "teacher", text: "Koi baat nahi, yeh hum aage phir dekhenge. Waise, cricket mein tumne kabhi kuch barabar baanta hai?", move: "reteach",
    seams: [{ left: "start", right: "goOn", joint: "afterKeyGoOn", form: "Koi baat nahi, yeh hum aage phir dekhenge." }, { left: "goOn", right: "return", joint: null }], pageParts: [{ part: "return", from: 43 }] };
  const kid = { who: "child", text: "phir bhi samajh nahi aaya", read: "no_evidence · clarify", intent: "clarify" };
  const flags = (n) => { const L2 = [...rows.slice(0, n), kid, M]; return lessonFlags({ rows: L2, script: SCRIPT }).filter((x) => x.row === L2.length - 1 && x.predicate === "requestHelped"); };
  assert.deepEqual(flags(i0 + 14), [], "every wording of the part said: passes");
  assert.equal(flags(i0 + 12).length, 1, "a wording of the part still unsaid: the same turn flags");
});

test("Q1 (RULING-A8): after any help turn at an asked step the child's next line is read against the step's own key — the right answer confirmed, a wrong one a recorded miss; cards as before", { timeout: 180_000 }, () => {
  const R = run();
  const at0 = (name) => start(R[name], WALKS.find((x) => x.name === name));
  const seams = (r) => (r.seams ?? []).map((x) => x.right);
  // (the right answer after help: a give-up's and a clarify's help at one hearing, C1's at four — the step's confirm, the walk goes on)
  for (const [name, off] of [["step-q1-give", 2], ["step-q1-clar", 2], ["step-a-right", 8], ["card-q1-give", 2], ["card-q1-clar", 2], ["card-a-right", 8], ["step-q1-ret", 10]]) {
    const rows = R[name], i = at0(name) + off;
    assert.equal(rows[i].who, "child", name);
    assert.equal(rows[i].read, "correct", `${name}: the right answer "${rows[i].text}" read as ${rows[i].read}`);
    const t = rows[i + 1];
    if (name.startsWith("step")) { assert.ok(seams(t).includes("stepConfirm"), `${name}: ${norm(t.text)}`); assert.ok(!t.stepAnswer?.told, `${name}: not told`); }
    else assert.equal(seams(t)[0], "verdict", `${name}: ${norm(t.text)}`);
    assert.doesNotMatch(t.text, /^Nahi\b/, `${name}: never "no" to the right answer`);
  }
  // (C1 then a wrong answer: a recorded miss, then the miss verdict and the told step)
  { const rows = R["step-a-miss"], i = at0("step-a-miss") + 8;
    assert.equal(rows[i].read, "incorrect", `step-a-miss: "${rows[i].text}" read as ${rows[i].read}`);
    assert.ok(rows[i + 1].stepAnswer?.told && seams(rows[i + 1]).includes("stepMiss"), norm(rows[i + 1].text)); }
  // (C1 then a give-up: the told step, no verdict word to a give-up)
  { const rows = R["step-a-give"], i = at0("step-a-give") + 8;
    assert.equal(rows[i].text, "pata nahi");
    assert.ok(rows[i + 1].stepAnswer?.told, norm(rows[i + 1].text));
    assert.doesNotMatch(rows[i + 1].text, /^Nahi, yeh nahi hai/, norm(rows[i + 1].text)); }
});

test("Q2 (RULING-A8): where the cap would tell with no C1 turn given and a wording unsaid, the turn is C1's — after a park's answer-first line and a bare yes, and in a pure wait at four hearings; then the told step or answer, or the confirm", { timeout: 180_000 }, () => {
  const R = run();
  const at0 = (name) => start(R[name], WALKS.find((x) => x.name === name));
  const seams = (r) => (r.seams ?? []).map((x) => x.right);
  const isC1 = (r) => seams(r).includes("help") && seams(r).at(-1) === "yourTurn" && !r.stepAnswer?.told && !seams(r).includes("key");
  for (const name of ["step-c-park", "step-q2-park-miss", "step-q2-park-right"]) {
    const rows = R[name], i = at0(name) + 11;
    assert.equal(rows[i - 1].text, "haan", name);
    assert.ok(isC1(rows[i]), `${name}: C1's turn: ${norm(rows[i].text)}`);
  }
  { const rows = R["step-q2-park-miss"], i = at0("step-q2-park-miss") + 13;
    assert.equal(rows[i - 1].read, "incorrect"); assert.ok(rows[i].stepAnswer?.told && seams(rows[i]).includes("stepMiss"), norm(rows[i].text)); }
  { const rows = R["step-q2-park-right"], i = at0("step-q2-park-right") + 13;
    assert.equal(rows[i - 1].read, "correct"); assert.ok(seams(rows[i]).includes("stepConfirm") && !rows[i].stepAnswer?.told, norm(rows[i].text)); }
  for (const name of ["card-q2-wait", "step-q2-wait"]) {
    const rows = R[name], i = at0(name) + 7;
    assert.ok(!isC1(rows[i]) && !rows[i].stepAnswer?.told && !seams(rows[i]).includes("key"), `${name}: wait one as built: ${norm(rows[i].text)}`);
    assert.ok(isC1(rows[i + 2]), `${name}: C1's turn: ${norm(rows[i + 2].text)}`);
    assert.ok(rows[i + 4].stepAnswer?.told || seams(rows[i + 4]).includes("key"), `${name}: then told: ${norm(rows[i + 4].text)}`);
  }
  { const rows = R["card-q2-b3"], i0 = at0("card-q2-b3"), i = i0 + 9;
    assert.ok(seams(rows[i]).includes("key"), `card-q2-b3: the key at wait three: ${norm(rows[i].text)}`);
    assert.ok(rows.slice(0, i).filter((x) => x.who === "teacher" && atQuestionOf(SCRIPT, x.text) === AT.card.P).length >= 4, "card-q2-b3: four hearings before it");
    for (const k of [i0 + 5, i0 + 7]) assert.ok(!isC1(rows[k]), `card-q2-b3: no C1 turn in the wait: ${norm(rows[k].text)}`); }
});

test("Q4 (RULING-A8, as main restated it on Q2's stop and on 054b): the wait's ladder at the cap — waitSecondNotReask and keyWithWordingUnsaid, each side", { timeout: 180_000 }, async () => {
  const { unsaidWordings } = await import("../evals/hybrid-side-by-side/d38a-predicates.mjs");
  const R = run();
  const at0 = (name) => start(R[name], WALKS.find((x) => x.name === name));
  const ws = (rows, i) => PREDICATES.waitSecondNotReask({ rows }, rows[i], i, { script: SCRIPT });
  const kw = (rows, i) => PREDICATES.keyWithWordingUnsaid({ rows }, rows[i], i, { script: SCRIPT });
  // (b) the told answer after C1's turn at four hearings: passes (card-a-yes 16, card-a-try 18)
  for (const [name, off] of [["card-a-yes", 9], ["card-a-try", 11]]) {
    const rows = R[name], i = at0(name) + off;
    assert.ok((rows[i].seams ?? []).some((x) => x.right === "key"), `${name}: ${norm(rows[i].text)}`);
    assert.equal(ws(rows, i), null, name);
    // (three hearings: two of the child's requests and their hearings left out — flags as before)
    const j0 = at0(name), three = [...rows.slice(0, j0), ...rows.slice(j0 + 4)];
    assert.match(String(ws(three, i - 4)), /reask/, `${name}: three hearings`);
    // (two C1 turns at one question: wait two another new wording as help ending on the invitation — flags)
    const part = String(rows[i].cell?.part ?? ""), path = unsaidWordings({ rows }, i - 1, SCRIPT, part)[0];
    assert.ok(path, `${name}: a wording still unsaid`);
    const text = path.split(/\.|\[|\]/).filter(Boolean).reduce((o, k) => o?.[/^\d+$/.test(k) ? Number(k) : k], SCRIPT);
    const two = rows.map((x, k) => (k === i ? { ...x, text: `${text.hi ?? text} Ab tum batao.`, seams: [{ left: "start", right: "help" }, { left: "help", right: "yourTurn" }] } : x));
    assert.match(String(ws(two, i)), /reask/, `${name}: a second C1 turn`);
  }
  // (a) then (b) in a pure wait at four hearings: C1's turn at wait two, the told answer or step at wait three — each passes
  for (const name of ["card-q2-wait", "step-q2-wait"]) {
    const rows = R[name], i0 = at0(name), c1 = i0 + 9;
    assert.equal(ws(rows, c1), null, `${name}: C1 at wait two`); assert.equal(kw(rows, c1 + 2), null, `${name}: the told turn after C1`);
    // (three hearings: the same C1 turn at wait two flags)
    const three = [...rows.slice(0, i0), ...rows.slice(i0 + 4)];
    assert.match(String(ws(three, c1 - 4)), /reask/, `${name}: three hearings`);
    // (four hearings, no help said at the question: the told answer or step as wait two, a wording unsaid — both checks flag)
    const told = [...rows.slice(0, c1), ...rows.slice(c1 + 2)];
    assert.ok(told[c1].stepAnswer?.told || (told[c1].seams ?? []).some((x) => x.right === "key"), `${name}: ${norm(told[c1].text)}`);
    // (waitSecondNotReask reads the card's told answer, which ends on its check-in; a told step ends on the next question, which its waitAt
    // never reads as the wait's — as before)
    if (name.startsWith("card")) assert.match(String(ws(told, c1)), /reask/, `${name}: told with no help said`);
    assert.match(String(kw(told, c1)), /never said/, `${name}: keyWithWordingUnsaid, told with no help said`);
  }
  // (054b's shape at four hearings: two give-ups helped, then the wait tells the key at wait three — keyWithWordingUnsaid reads 0)
  { const rows = R["card-q2-b3"], i = at0("card-q2-b3") + 9;
    assert.equal(kw(rows, i), null, norm(rows[i].text)); }
});

test("Q5 (RULING-A8): aiAskAnswered does not read the told answer's check-in after the AI line as the AI line's own question — an AI line that asks its own question, unanswered, still flags", { timeout: 180_000 }, () => {
  const R = run();
  const rows = R["card-c-aireply"], i = start(rows, WALKS.find((x) => x.name === "card-c-aireply")) + 11;
  const ctxAt = (L, k) => ({ script: SCRIPT, prevT: L[k - 2], prevRead: L[k - 1].read, prevChild: L[k - 1].text });
  assert.deepEqual((rows[i].seams ?? []).map((x) => x.right), ["aiLine", "key", "checkin"], norm(rows[i].text));
  assert.equal(PREDICATES.aiAskAnswered({ rows }, rows[i + 2], i + 2, ctxAt(rows, i + 2)), null);
  // (the other side: her AI line asking its own question, then the next point and card with no reply to the child's answer — flags)
  const own = { ...rows[i], text: "Main AI hoon, meri koi pasand nahi hoti. Tumhe Virat ke baare mein kya lagta hai?", seams: [{ left: "start", right: "aiQuestion" }], pageParts: [{ part: "aside", from: 0 }] };
  const L2 = [...rows.slice(0, i), own, ...rows.slice(i + 1)];
  assert.match(String(PREDICATES.aiAskAnswered({ rows: L2 }, L2[i + 2], i + 2, ctxAt(L2, i + 2))), /not answered/);
  // (and a key seam without the closing check-in: the question is still read as the AI line's)
  const noCk = { ...rows[i], text: "Main AI hoon, meri koi pasand nahi hoti. Circle 3 barabar tukdon mein bata hai aur ab 2 mein rang hai, yaani 2/3. Tumhe Virat ke baare mein kya lagta hai?", seams: [{ left: "start", right: "aiLine" }, { left: "aiLine", right: "key" }, { left: "key", right: "aiQuestion" }], pageParts: [{ part: "aside", from: 0 }] };
  const L3 = [...rows.slice(0, i), noCk, ...rows.slice(i + 1)];
  assert.match(String(PREDICATES.aiAskAnswered({ rows: L3 }, L3[i + 2], i + 2, ctxAt(L3, i + 2))), /not answered/);
});

test("Q6 (RULING-A8): the told answer at a give-up on a yes-or-no card is recorded as the told answer (its key seam), as at every other card", { timeout: 180_000 }, () => {
  const R = run();
  const at0 = (name) => start(R[name], WALKS.find((x) => x.name === name));
  const seams = (r) => (r.seams ?? []).map((x) => x.right);
  { const rows = R["pizza-q6-c1-give"], i = at0("pizza-q6-c1-give") + 9;
    assert.equal(rows[i - 1].text, "pata nahi");
    assert.deepEqual(seams(rows[i]), ["key", "checkin"], norm(rows[i].text));
    assert.ok(!/^(?:Haan|Nahi|Sahi)\b/.test(rows[i].text), "no verdict word to a give-up"); }
  { const rows = R["pizza-q6-c1-right"], i = at0("pizza-q6-c1-right") + 8;
    assert.equal(rows[i].read, "correct"); assert.equal(seams(rows[i + 1])[0], "verdict", norm(rows[i + 1].text)); }
  { const rows = R["pizza-q6-c1-yes"], i = at0("pizza-q6-c1-yes") + 8;
    assert.equal(rows[i].text, "haan"); assert.ok(["incorrect", "misconception"].includes(String(rows[i].read).split(" ")[0]), `"haan" read as ${rows[i].read}`);
    assert.equal(seams(rows[i + 1])[0], "missVerdict", norm(rows[i + 1].text)); }
});

test("W1 (RULING-A11): the way back from a remediation's follow-up card is the question as built, at any hearing count — then C1 given, a miss or a give-up is told; questionFifthOnHerOwn and questionFiveTimes each side", { timeout: 180_000 }, () => {
  const R = run();
  const at0 = (name) => start(R[name], WALKS.find((x) => x.name === name));
  const seams = (r) => (r.seams ?? []).map((x) => x.right);
  const q5 = (rows, i) => [PREDICATES.questionFifthOnHerOwn({ rows }, rows[i], i, { script: SCRIPT }), PREDICATES.questionFiveTimes({ rows }, rows[i], i, { script: SCRIPT, o: { teacherTexts: rows.slice(0, i).filter((x) => x.who === "teacher").map((x) => x.text) } })];
  for (const [name, rem, back] of [["pizza-w1-right", 9, 11], ["pizza-w1-yes", 9, 11], ["pizza-w1-give", 9, 11], ["pizza-w1-first", 7, 9], ["pizza-w1-low", 1, 3]]) {
    const rows = R[name], i0 = at0(name), t = rows[i0 + back];
    assert.ok(seams(rows[i0 + rem]).includes("remediation"), `${name}: the remediation: ${norm(rows[i0 + rem].text)}`);
    assert.equal(rows[i0 + back - 1].read, "correct", `${name}: the follow-up answered right`);
    assert.deepEqual(seams(t), ["verdict", "returnCard"], `${name}: ${norm(t.text)}`);
    assert.equal(atQuestionOf(SCRIPT, t.text), PIZZA, `${name}: the pizza question as built`);
    assert.deepEqual(q5(rows, i0 + back), [null, null], `${name}: the way back passes`);
  }
  { const rows = R["pizza-w1-right"], i = at0("pizza-w1-right") + 13; assert.equal(seams(rows[i])[0], "verdict", norm(rows[i].text)); assert.ok(!seams(rows[i]).includes("key")); }
  for (const name of ["pizza-w1-yes", "pizza-w1-give", "pizza-w1-first"]) {
    const rows = R[name], i = at0(name) + (name === "pizza-w1-first" ? 11 : 13);
    assert.ok(seams(rows[i]).includes("key"), `${name}: the told answer: ${norm(rows[i].text)}`);
  }
  // (keyBeforeHint takes the same reading: the told answer after the remediation started at four hearings passes; with two of the child's
  // requests and their hearings left out — the remediation at two hearings — the same told answer flags as before)
  { const rows = R["pizza-w1-first"], i0 = at0("pizza-w1-first"), i = i0 + 11;
    const kb = (L2, k) => PREDICATES.keyBeforeHint({ rows: L2 }, L2[k], k, { script: SCRIPT });
    assert.equal(kb(rows, i), null, norm(rows[i].text));
    const fewer = [...rows.slice(0, i0), ...rows.slice(i0 + 4)];
    assert.match(String(kb(fewer, i - 4)), /hint unsaid/); }
  // (the other side: a second re-pose with no new remediation flags; the same turn with no follow-up card closed before it flags)
  { const rows = R["pizza-w1-yes"], i0 = at0("pizza-w1-yes"), back = rows[i0 + 11];
    const again = [...rows.slice(0, i0 + 13), { ...back }];
    assert.ok(q5(again, again.length - 1).every((x) => /heard a \d+th time/.test(String(x))), "a second re-pose flags");
    const noFollow = [...rows.slice(0, i0 + 8), child("haan"), { ...back, cell: { part: "c4-maths-ch05-t01-s1:e2:card", column: "right" } }];
    assert.ok(q5(noFollow, noFollow.length - 1).every((x) => /heard a \d+th time/.test(String(x))), "no follow-up card closed before it: flags"); }
});

test("U1 (main's item): the way back to a card a remediation took over comes before a parked side-topic's return — returnBeforeWayBack each side", { timeout: 180_000 }, () => {
  const R = run();
  const rows = R["pizza-u1-park"], i0 = start(rows, WALKS.find((x) => x.name === "pizza-u1-park"));
  const seams = (r) => (r.seams ?? []).map((x) => x.right);
  assert.ok(seams(rows[i0 + 3]).includes("remediation"), norm(rows[i0 + 3].text));
  const back = rows[i0 + 5];
  assert.equal(atQuestionOf(SCRIPT, back.text), PIZZA, `the card comes back: ${norm(back.text)}`);
  assert.ok(!seams(back).includes("return"), "no return while the way back is owed");
  const after = rows[i0 + 7];
  assert.equal(rows[i0 + 6].read, "correct");
  assert.deepEqual(seams(after).slice(0, 2), ["verdict", "return"], `the verdict, then the return: ${norm(after.text)}`);
  // (the other side: the return said on the follow-up's verdict, the card still open — flags)
  const early = { ...back, text: `${back.text.split(". ")[0]}. Cricket ki baari aa gayi: uske baare mein thoda aur batao na?`, seams: [{ left: "start", right: "verdict" }, { left: "verdict", right: "return" }] };
  const L2 = [...rows.slice(0, i0 + 5), early];
  assert.match(String(PREDICATES.returnBeforeWayBack({ rows: L2 }, early, L2.length - 1, { script: SCRIPT })), /way back/);
  assert.equal(PREDICATES.returnBeforeWayBack({ rows }, after, i0 + 7, { script: SCRIPT }), null);
});
