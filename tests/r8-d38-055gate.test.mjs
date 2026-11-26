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
// (d38 RULING-A11 W3, pr2 item 1: the pizza card's told answer at a return is a key seam, joined as the circle card's same turn — four hearings,
// C1 on "7", the AI question and its reply; four hearings, the AI question and its reply twice, then "No")
WALKS.push({ name: "pizza-a-aireply", topicId: TOPIC, seek: "card", skip: 1, tail: 3, pizza: true, then: [...FOUR, "miss", "ai", "reply"].map((x) => L[x]) });
WALKS.push({ name: "pizza-c-aireply", topicId: TOPIC, seek: "card", skip: 1, tail: 3, pizza: true, then: [...[...FOUR, "ai", "reply", "ai", "reply"].map((x) => L[x]), "No"] });
// (d38 RULING-A11 W4, pr2 item 2: one definition of "help was said at this question" — a picture request's turn at the step, then "phir se
// bolo" twice and a bare yes three times: help was said, so the wait tells as order 054 built it, no C1)
WALKS.push({ name: "step-pic-wait", topicId: TOPIC, seek: "step", skip: 0, tail: 3, fresh: true, then: ["pic", "again", "again", "yes", "yes", "yes"].map((x) => L[x]) });
// (RULING-A11 W4 at the card: a picture request's turn, then the wait — help said, the wait tells; a give-up's help, a named wrong answer's
// remediation and its follow-up card, then the wait — help said and never cleared by the follow-up, the wait tells. W5: a Hindi request answered
// with help at a card with no Hindi form, then the wait — waitNoQuestion takes Q4's reading)
WALKS.push({ name: "card-pic-wait", topicId: TOPIC, seek: "card", skip: 2, tail: 3, fresh: true, then: ["pic", "again", "again", "yes", "yes", "yes"].map((x) => L[x]) });
WALKS.push({ name: "card-rem-wait", topicId: TOPIC, seek: "card", skip: 2, tail: 3, fresh: true, then: ["pata nahi", "2/1", "Pinky", "phir se bolo", "haan", "haan", "haan"] });
WALKS.push({ name: "card-hindi-wait", topicId: TOPIC, seek: "card", skip: 2, tail: 3, fresh: true, then: ["hindi", "again", "again", "yes", "yes", "yes"].map((x) => L[x]) });
WALKS.push({ name: "pizza-w1-low", topicId: TOPIC, seek: "card", skip: 1, tail: 3, pizza: true, fresh: true, then: ["yes", "right"].map((x) => L[x]) });
// (d38 RULING-A12 X1, the third review's walks (pr2/drv w6): four hearings of the pizza card, "haan" (its named mistake: the remediation and its
// follow-up card), then "aadhe se kam" three times at the follow-up card — which the offline reader reads as nothing; and the same at the
// first hearing. The follow-up card is a question like any other: never told with a wording of its part unsaid and no C1 turn at IT)
WALKS.push({ name: "pz4-fw-kam", topicId: TOPIC, seek: "card", skip: 1, tail: 3, pizza: true, then: [...FOUR.map((x) => L[x]), "haan", "aadhe se kam", "aadhe se kam", "aadhe se kam"] });
WALKS.push({ name: "pzlow-fw-kam", topicId: TOPIC, seek: "card", skip: 1, tail: 3, pizza: true, fresh: true, then: ["haan", "aadhe se kam", "aadhe se kam", "aadhe se kam"] });
// (d38 RULING-A12 X2: the way back after a TOLD follow-up card — four hearings, "haan" (the remediation), four give-ups at the follow-up card
// until she tells it, then "haan" at its check-in: the pizza card comes back as built)
// (d38 RULING-A12 X4, the third review's circ-rem-ai: four hearings of the circle card, "2/1" (its named mistake: the remediation, C1 there),
// the follow-up answered right, the way back, then the AI question and its reply — her AI line and its question only, then her reply and
// the told answer)
WALKS.push({ name: "circ-rem-ai", topicId: TOPIC, seek: "card", skip: 2, tail: 3, P: AT.card.P, then: [...FOUR.map((x) => L[x]), "2/1", "@key", L.ai, L.reply, "7"] });
// (d38 RULING-A12 X5, builder S2's open clash: at the worked problem's first asked step, a Hindi request (the step's Hindi form), then "phir se
// bolo" twice — each answered with the form she last heard — then a bare yes three times)
WALKS.push({ name: "step-hindi-wait", topicId: TOPIC, seek: "step", skip: 0, tail: 3, fresh: true, then: ["hindi", "again", "again", "yes", "yes", "yes"].map((x) => L[x]) });
// (d38 RULING-A12 X3 as main ruled it on the X3 stop: yourTurnNotThird at the cap — the C1 turn after an order-049 B4 invitation, at the circle
// card (two "phir se bolo", two give-ups, then "7" twice) and at the pizza card's follow-up card (six lines read as nothing); order 054 C3's
// named-reason turn after the way back (the reviewer's circ-loop), then a further miss of each kind told)
WALKS.push({ name: "probe-card-aagg7", topicId: TOPIC, seek: "card", skip: 2, tail: 3, P: AT.card.P, fresh: true, then: [L.again, L.again, L.give, L.give, "7", "7"] });
WALKS.push({ name: "pz4-fw-kam4", topicId: TOPIC, seek: "card", skip: 1, tail: 3, pizza: true, then: [...FOUR.map((x) => L[x]), "haan", ...Array(6).fill("aadhe se kam"), "haan"] });
WALKS.push({ name: "circ-loop", topicId: TOPIC, seek: "card", skip: 2, tail: 3, P: AT.card.P, then: [...FOUR.map((x) => L[x]), "2/1", "@key", "2/1", "@key", "2/1", "@key"] });
for (const [k, last] of [["miss", "2/1"], ["7", "7"], ["give", L.give]])
  WALKS.push({ name: `circ-loop-${k}`, topicId: TOPIC, seek: "card", skip: 2, tail: 3, P: AT.card.P, then: [...FOUR.map((x) => L[x]), "2/1", "@key", "2/1", last] });
// (RULING-A12's gate list: the reviewer's pz-loop and the four u1-park walks)
WALKS.push({ name: "pz-loop", topicId: TOPIC, seek: "card", skip: 1, tail: 3, pizza: true, then: [...FOUR.map((x) => L[x]), "haan", "@key", "haan", "@key", "haan", "@key", "haan"] });
WALKS.push({ name: "u1-park-right", topicId: TOPIC, seek: "card", skip: 1, tail: 6, pizza: true, fresh: true, then: [L.park, "haan", "@key", "@key"] });
WALKS.push({ name: "u1-park-miss2", topicId: TOPIC, seek: "card", skip: 1, tail: 6, pizza: true, fresh: true, then: [L.park, "haan", "@key", "7", "7"] });
WALKS.push({ name: "u1-park-miss2-four", topicId: TOPIC, seek: "card", skip: 1, tail: 6, pizza: true, then: [...FOUR.map((x) => L[x]), L.park, "haan", "@key", "7", "7"] });
WALKS.push({ name: "u1-circ-park-miss2", topicId: TOPIC, seek: "card", skip: 2, tail: 6, P: AT.card.P, fresh: true, then: [L.park, "2/1", "@key", "7", "7"] });
// (main's item X6, the fourth review's walks: the follow-up card taking a turn of help before it is answered right, then a miss or a give-up at
// the original card (told); the follow-up told after five give-ups, the way back opening on the help-spent line)
WALKS.push({ name: "circ4-fwg-right-miss", topicId: TOPIC, seek: "card", skip: 2, tail: 2, P: AT.card.P, then: [...FOUR.map((x) => L[x]), "2/1", L.give, "@key", "7"] });
WALKS.push({ name: "pz4-fwg-right-give", topicId: TOPIC, seek: "card", skip: 1, tail: 2, pizza: true, then: [...FOUR.map((x) => L[x]), "haan", L.give, "@key", L.give] });
WALKS.push({ name: "pz4-fw-give", topicId: TOPIC, seek: "card", skip: 1, tail: 3, pizza: true, then: [...FOUR.map((x) => L[x]), "haan", ...Array(5).fill(L.give), "haan"] });
WALKS.push({ name: "pz4-fw-give4", topicId: TOPIC, seek: "card", skip: 1, tail: 3, pizza: true, then: [...FOUR.map((x) => L[x]), "haan", "pata nahi", "pata nahi", "pata nahi", "pata nahi", "haan"] });

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
/** The question a walk's case is at: its own `P`, the pizza card's, or the card's or step's by the walk's name. */
const pOf = (w) => w.P ?? (w.pizza ? PIZZA : AT[w.name.split("-")[0]].P);
function start(rows, w) {
  for (let i = 1; i < rows.length; i++) if (rows[i].who === "child" && rows[i].text === w.then[0] && atQuestionOf(SCRIPT, rows[i - 1].text) === pOf(w)) return i;
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
    const P = pOf(w);
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

test("W3 (RULING-A11): a yes-or-no card's told answer at a return is a key seam, after her reply or the AI line, as the circle card's", { timeout: 180_000 }, () => {
  const R = run();
  for (const [name, off, first] of [["pizza-a-aireply", 11, "aiReply"], ["pizza-c-aireply", 11, "aiLine"], ["card-a-aireply", 11, "aiReply"]]) {
    const rows = R[name], i = start(rows, WALKS.find((x) => x.name === name)) + off;
    assert.deepEqual((rows[i].seams ?? []).map((x) => x.right), [first, "key", "checkin"], `${name}: ${norm(rows[i].text)}`);
  }
  const a = R["pizza-a-aireply"][start(R["pizza-a-aireply"], WALKS.find((x) => x.name === "pizza-a-aireply")) + 11];
  const c = R["card-a-aireply"][start(R["card-a-aireply"], WALKS.find((x) => x.name === "card-a-aireply")) + 11];
  assert.deepEqual(a.seams.map((x) => x.joint ?? null), c.seams.map((x) => x.joint ?? null), "the same joints as the circle card's turn");
});

test("W4 (RULING-A11): help said at a question — the walk's helpedAt and the checks' helpSaidAt agree: a picture request's turn is help, so the wait tells; helpSaidAt each side", { timeout: 180_000 }, async () => {
  const { helpSaidAt } = await import("../evals/hybrid-side-by-side/d38a-predicates.mjs");
  const R = run();
  const rows = R["step-pic-wait"], i0 = start(rows, WALKS.find((x) => x.name === "step-pic-wait"));
  const seams = (r) => (r.seams ?? []).map((x) => x.right);
  assert.ok(seams(rows[i0 + 1]).includes("caption"), norm(rows[i0 + 1].text));
  const told = rows.findIndex((x, k) => k > i0 && x.who === "teacher" && x.stepAnswer?.told);
  assert.ok(told > 0 && rows.slice(i0 + 2, told).every((x) => x.who !== "teacher" || !seams(x).includes("help")), "no C1 turn in the wait: the step told after it");
  const P = AT.step.P, part = String(rows[i0 + 1].cell?.part ?? "");
  assert.equal(helpSaidAt({ rows }, told, SCRIPT, P, part), true, "the caption is help");
  // (the other side: the same rows with the caption turn as the step's question again — no help seam — read as no help said)
  const bare = rows.map((x, k) => (k === i0 + 1 ? { ...x, seams: [{ left: "start", right: "stepAsk" }] } : x));
  assert.equal(helpSaidAt({ rows: bare }, told, SCRIPT, P, part), false);
  // (and another question between does not clear it: a follow-up card's turn put after the caption)
  const between = [...rows.slice(0, i0 + 2), { who: "teacher", text: "Roti ke 2 tukde hue, ek bada, ek chhota. Bada tukda aadhe se kam hai, aadha, ya zyada?", seams: [{ left: "start", right: "card" }], cell: { part: "c4-maths-ch05-t01-s1:rem:0:then" } }, ...rows.slice(i0 + 2)];
  assert.equal(helpSaidAt({ rows: between }, told + 1, SCRIPT, P, part), true);
});

test("W5 (RULING-A11): waitNoQuestion takes Q4's reading — at four hearings the told answer after a wait turn with no question passes where help was said; each side", { timeout: 180_000 }, () => {
  const R = run();
  const wn = (rows, i) => PREDICATES.waitNoQuestion({ rows }, rows[i], i, { script: SCRIPT });
  for (const name of ["card-hindi-wait", "card-pic-wait", "card-rem-wait"]) {
    const rows = R[name], i = rows.findIndex((x, k) => k > 4 && x.who === "teacher" && (x.seams ?? []).some((y) => y.right === "key") && rows[k - 1].text === "haan");
    assert.ok(i > 0, `${name}: the wait tells`);
    assert.equal(wn(rows, i), null, `${name}: ${norm(rows[i].text)}`);
  }
  const rows = R["card-hindi-wait"], i0 = start(rows, WALKS.find((x) => x.name === "card-hindi-wait"));
  const i = rows.findIndex((x, k) => k > i0 && x.who === "teacher" && (x.seams ?? []).some((y) => y.right === "key"));
  // (three hearings: one of the child's requests and its hearing left out — flags as before)
  const three = [...rows.slice(0, i0 + 2), ...rows.slice(i0 + 4)];
  assert.match(String(wn(three, i - 2)), /neither says the question or help/);
  // (four hearings, no help said at the question — the help turn read as the card again — and a wording unsaid: flags)
  const noHelp = rows.map((x, k) => (k === i0 + 1 ? { ...x, text: "Ek aur tukde mein rang bharo. Ab rangin tukdon ka fraction kya hoga?", seams: [{ left: "start", right: "card" }] } : x));
  assert.match(String(wn(noHelp, i)), /neither says the question or help/);
});

test("W6 (RULING-A11): aiAskAnswered's Q5 reading holds only for an aiLine seam — an aiQuestion, then a key and a check-in in one turn, her next turn not answering the reply, flags", { timeout: 180_000 }, () => {
  const R = run();
  const rows = R["card-c-aireply"], i = start(rows, WALKS.find((x) => x.name === "card-c-aireply")) + 11;
  const ctxAt = (L2, k) => ({ script: SCRIPT, prevT: L2[k - 2], prevRead: L2[k - 1].read, prevChild: L2[k - 1].text });
  assert.deepEqual((rows[i].seams ?? []).map((x) => x.right), ["aiLine", "key", "checkin"]);
  assert.equal(PREDICATES.aiAskAnswered({ rows }, rows[i + 2], i + 2, ctxAt(rows, i + 2)), null, "aiLine: passes as Q5 read it");
  const q = { ...rows[i], text: "Main AI hoon, meri koi pasand nahi hoti. Tumhe Virat kyun pasand hai? Circle 3 barabar tukdon mein bata hai aur ab 2 mein rang hai, yaani 2/3. Ab tak samajh aaya?",
    seams: [{ left: "start", right: "aiQuestion" }, { left: "aiQuestion", right: "key" }, { left: "key", right: "checkin" }] };
  const L2 = [...rows.slice(0, i), q, ...rows.slice(i + 1)];
  assert.match(String(PREDICATES.aiAskAnswered({ rows: L2 }, L2[i + 2], i + 2, ctxAt(L2, i + 2))), /not answered/);
});

test("X1 (RULING-A12): remC1Before holds for the ORIGINAL question only — a remediation at four hearings is never its follow-up card's C1 turn; the walk gives the follow-up card its own help before telling it", { timeout: 180_000 }, async () => {
  const { remC1Before } = await import("../evals/hybrid-side-by-side/d38a-predicates.mjs");
  const R = run();
  const seams = (r) => (r.seams ?? []).map((x) => x.right);
  const kw = (rows, i) => PREDICATES.keyWithWordingUnsaid({ rows }, rows[i], i, { script: SCRIPT });
  const FOLLOW = ".skills[0].remediation[0].then";
  // (the walk: at the follow-up card, after the remediation at four hearings and three lines it reads as nothing, her turn is help in a wording
  // of the follow-up card's part — never its told answer with its wordings unsaid; at the first hearing the same)
  for (const [name, off] of [["pz4-fw-kam", 13], ["pzlow-fw-kam", 7]]) {
    const rows = R[name], i0 = start(rows, WALKS.find((x) => x.name === name)), i = i0 + off;
    assert.ok(seams(rows[i0 + off - 6]).includes("remediation"), `${name}: the remediation: ${norm(rows[i0 + off - 6].text)}`);
    assert.equal(rows[i - 1].text, "aadhe se kam", name);
    assert.ok(seams(rows[i]).includes("help") && !seams(rows[i]).includes("key"), `${name}: help, not told: ${norm(rows[i].text)}`);
    assert.equal(String(rows[i].cell?.part ?? "").endsWith(":rem:0:then"), true, `${name}: at the follow-up card's part`);
    for (let k = i0; k < rows.length; k++) assert.equal(kw(rows, k), null, `${name} ${k}: ${norm(rows[k].text)}`);
  }
  // (the check, the follow-up side: the same rows with the turn as the walk said it at 3f2e3e15a — the follow-up card told with its three
  // wordings unsaid — flag; the remediation at four hearings is no C1 turn of the follow-up card)
  { const rows = R["pz4-fw-kam"], i = start(rows, WALKS.find((x) => x.name === "pz4-fw-kam")) + 13;
    const told = { ...rows[i], text: "Do tukde barabar hon tabhi har ek aadha hota; yahan bada tukda chhote se bada hai, toh aadhe se zyada. Ab tak samajh aaya?",
      seams: [{ left: "start", right: "key", joint: null }, { left: "key", right: "checkin", joint: null }] };
    const L2 = [...rows.slice(0, i), told];
    assert.equal(remC1Before({ rows: L2 }, i, SCRIPT, FOLLOW), false);
    assert.match(String(kw(L2, i)), /never said/); }
  // (the original question's side, unchanged: the told answer after the way back from a remediation started at four hearings passes, and
  // remC1Before holds for the pizza question there)
  { const rows = R["pizza-w1-first"], i = start(rows, WALKS.find((x) => x.name === "pizza-w1-first")) + 11;
    assert.ok(seams(rows[i]).includes("key"), norm(rows[i].text));
    assert.equal(remC1Before({ rows }, i, SCRIPT, PIZZA), true);
    assert.equal(kw(rows, i), null); }
});

test("X2 (RULING-A12): the way back after a TOLD follow-up card — a returnCard turn whose turn before was the follow-up's told answer and its check-in — passes questionFiveTimes and questionFifthOnHerOwn; each other side flags", { timeout: 180_000 }, () => {
  const R = run();
  const seams = (r) => (r.seams ?? []).map((x) => x.right);
  const q5 = (rows, i) => [PREDICATES.questionFifthOnHerOwn({ rows }, rows[i], i, { script: SCRIPT }), PREDICATES.questionFiveTimes({ rows }, rows[i], i, { script: SCRIPT, o: { teacherTexts: rows.slice(0, i).filter((x) => x.who === "teacher").map((x) => x.text) } })];
  const rows = R["pz4-fw-give4"], i0 = start(rows, WALKS.find((x) => x.name === "pz4-fw-give4")), told = i0 + 15, back = i0 + 17;
  assert.ok(seams(rows[i0 + 7]).includes("remediation"), norm(rows[i0 + 7].text));
  assert.deepEqual(seams(rows[told]), ["key", "checkin"], `the follow-up told: ${norm(rows[told].text)}`);
  assert.equal(rows[back - 1].text, "haan");
  assert.equal(seams(rows[back])[0], "returnCard", norm(rows[back].text));
  assert.equal(atQuestionOf(SCRIPT, rows[back].text), PIZZA, `the pizza question as built: ${norm(rows[back].text)}`);
  assert.deepEqual(q5(rows, back), [null, null], "the way back passes");
  // (the same turn with no follow-up card closed in her turn before — that turn help ending on the follow-up card — flags)
  const open = rows.map((x, k) => (k === told ? { ...x, text: "Chhote-bade tukde gin kar naam nahi rakhte. Roti ka bada tukda: aadhe se kam, aadha, ya aadhe se zyada?", seams: [{ left: "start", right: "help" }, { left: "help", right: "card" }] } : x));
  assert.ok(q5(open, back).every((x) => /heard a \d+th time/.test(String(x))), "no follow-up closed before it: flags");
  // (a second way back for one remediation — the same turn again after another "haan" — flags)
  const again = [...rows.slice(0, back + 1), child("haan"), { ...rows[back] }];
  assert.ok(q5(again, again.length - 1).every((x) => /heard a \d+th time/.test(String(x))), "a second way back flags");
});

test("X4 (RULING-A12): an AI question after the way back is answered first, alone — her AI line and its question, the card held; the told answer after the child's reply, her reply first", { timeout: 180_000 }, () => {
  const R = run();
  const seams = (r) => (r.seams ?? []).map((x) => x.right);
  const rows = R["circ-rem-ai"], i0 = start(rows, WALKS.find((x) => x.name === "circ-rem-ai")), ai = i0 + 11;
  assert.ok(seams(rows[i0 + 7]).includes("remediation"), norm(rows[i0 + 7].text));
  assert.deepEqual(seams(rows[i0 + 9]), ["verdict", "returnCard"], `the way back: ${norm(rows[i0 + 9].text)}`);
  assert.equal(rows[ai - 1].text, L.ai);
  assert.deepEqual(seams(rows[ai]), ["aiQuestion"], `her AI line and its question only: ${norm(rows[ai].text)}`);
  assert.equal(atQuestionOf(SCRIPT, rows[ai].text), null, "no question of the lesson in it");
  assert.equal(PREDICATES.orderAnswerFirst({ rows }, rows[ai], ai, { script: SCRIPT, prevT: rows[ai - 2], prevRead: rows[ai - 1].read, prevChild: rows[ai - 1].text }), null);
  assert.equal(rows[ai + 1].text, L.reply);
  assert.deepEqual(seams(rows[ai + 2]), ["aiReply", "key", "checkin"], `her reply, then the told answer: ${norm(rows[ai + 2].text)}`);
  // (the other side, the turn as the walk said it at 3f2e3e15a — the told answer before her AI line — flags orderAnswerFirst)
  const old = { ...rows[ai], text: "Circle 3 barabar tukdon mein bata hai aur ab 2 mein rang hai, yaani 2/3. Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?",
    seams: [{ left: "start", right: "key", joint: null }, { left: "key", right: "aiQuestion", joint: null }] };
  const L2 = [...rows.slice(0, ai), old];
  assert.match(String(PREDICATES.orderAnswerFirst({ rows: L2 }, old, ai, { script: SCRIPT, prevT: rows[ai - 2], prevRead: rows[ai - 1].read, prevChild: rows[ai - 1].text })), /AI line/);
});

test("X5 (RULING-A12): reaskSameAfterHelp does not read the question's Hindi form as help — the child's own request for the question answered with the form she last heard passes; after a real help turn, or on her own, the same closing question still flags", { timeout: 180_000 }, () => {
  const R = run();
  const rows = R["step-hindi-wait"], i0 = start(rows, WALKS.find((x) => x.name === "step-hindi-wait"));
  const seams = (r) => (r.seams ?? []).map((x) => x.right);
  assert.ok(seams(rows[i0 + 1]).includes("hindiSwitch"), `the step's Hindi form: ${norm(rows[i0 + 1].text)}`);
  for (const k of [3, 5]) {
    assert.equal(rows[i0 + k - 1].text, L.again);
    assert.equal(atQuestionOf(SCRIPT, rows[i0 + k].text), AT.step.P, norm(rows[i0 + k].text));
    assert.equal(flagAt(rows, i0 + k, "reaskSameAfterHelp"), false, `row ${i0 + k}: ${norm(rows[i0 + k].text)}`);
  }
  // (the other sides: her turn before a real help turn ending on the same question — flags; the child's line no request for the question,
  // the same closing question on her own — flags)
  const helped = rows.map((x, k) => (k === i0 + 1 ? { ...x, text: `Khaane se pehle wali poori barfi yaad karo. ${rows[i0 + 3].text}`, seams: [{ left: "start", right: "help" }, { left: "help", right: "stepAsk" }] } : x));
  assert.equal(flagAt(helped, i0 + 3, "reaskSameAfterHelp"), true, "after a help turn");
  const own = rows.map((x, k) => (k === i0 + 2 ? { ...x, text: "7", read: "incorrect", intent: undefined } : x));
  assert.equal(flagAt(own, i0 + 3, "reaskSameAfterHelp"), true, "on her own");
});

test("X3 (RULING-A12, as main ruled on the stop): yourTurnNotThird at four or more hearings passes the C1 turn after a B4 invitation and order 054 C3's named-reason turn, once a question; a further miss is told; each other side flags", { timeout: 180_000 }, () => {
  const R = run();
  const seams = (r) => (r.seams ?? []).map((x) => x.right);
  const yt = (rows, i) => PREDICATES.yourTurnNotThird({ rows }, rows[i], i, { script: SCRIPT });
  const at0 = (name) => start(R[name], WALKS.find((x) => x.name === name));
  // (a) the C1 turn, an order-049 B4 invitation before it
  for (const [name, b4, c1] of [["probe-card-aagg7", 5, 9], ["pz4-fw-kam4", 13, 17]]) {
    const rows = R[name], i0 = at0(name);
    assert.equal(seams(rows[i0 + b4]).at(-1), "yourTurn", `${name}: the B4 invitation: ${norm(rows[i0 + b4].text)}`);
    assert.ok(seams(rows[i0 + c1]).includes("help") && seams(rows[i0 + c1]).at(-1) === "yourTurn", `${name}: C1: ${norm(rows[i0 + c1].text)}`);
    assert.equal(yt(rows, i0 + c1), null, name);
    assert.ok(seams(rows[i0 + c1 + 2]).includes("key"), `${name}: then told: ${norm(rows[i0 + c1 + 2].text)}`);
    // (a help turn at the cap in a wording already said, ending on an invitation — the B4 turn's own help again — flags)
    const again = rows.map((x, k) => (k === i0 + c1 ? { ...x, text: rows[i0 + b4].text, seams: rows[i0 + b4].seams } : x));
    assert.match(String(yt(again, i0 + c1)), /invitation/, `${name}: a wording already said`);
  }
  // (b) order 054 C3's turn after the way back (circ-loop 18), and a further miss of any kind is told
  { const rows = R["circ-loop"], i = at0("circ-loop") + 11;
    assert.deepEqual(seams(rows[i]), ["missVerdict", "help", "yourTurn"], norm(rows[i].text));
    assert.equal(yt(rows, i), null);
    // (a second named-reason turn at the question — the same turn again after the same miss — flags)
    const two = [...rows.slice(0, i + 2), { ...rows[i] }];
    assert.match(String(yt(two, i + 2)), /invitation/, "a second named-reason turn");
    // (the same turn below four hearings — the three "phir se bolo" and their hearings left out — flags as before)
    const i0 = at0("circ-loop"), low = [...rows.slice(0, i0), ...rows.slice(i0 + 6)];
    assert.match(String(yt(low, i - 6)), /invitation/, "below four hearings"); }
  for (const name of ["circ-loop-miss", "circ-loop-7", "circ-loop-give"]) {
    const rows = R[name], i = at0(name) + 13;
    assert.ok(seams(rows[i]).includes("key") && seams(rows[i]).at(-1) === "checkin", `${name}: told: ${norm(rows[i].text)}`);
  }
});

test("X6 (main's item, the fourth review): yourTurnNotThird's C1 clause only for the first C1 turn; remC1Before reads through the follow-up card's own turns; the way back may open on the help-spent line — each side", { timeout: 180_000 }, async () => {
  const { unsaidWordings, c1ReturnAt, remC1Before } = await import("../evals/hybrid-side-by-side/d38a-predicates.mjs");
  const R = run();
  const seams = (r) => (r.seams ?? []).map((x) => x.right);
  const at0 = (name) => start(R[name], WALKS.find((x) => x.name === name));
  const yt = (rows, i) => PREDICATES.yourTurnNotThird({ rows }, rows[i], i, { script: SCRIPT });
  const kw = (rows, i) => PREDICATES.keyWithWordingUnsaid({ rows }, rows[i], i, { script: SCRIPT });
  const kb = (rows, i) => PREDICATES.keyBeforeHint({ rows }, rows[i], i, { script: SCRIPT });
  const q5 = (rows, i) => [PREDICATES.questionFifthOnHerOwn({ rows }, rows[i], i, { script: SCRIPT }), PREDICATES.questionFiveTimes({ rows }, rows[i], i, { script: SCRIPT, o: { teacherTexts: rows.slice(0, i).filter((x) => x.who === "teacher").map((x) => x.text) } })];
  const textOf = (path) => { const v = path.split(/\.|\[|\]/).filter(Boolean).reduce((o, k) => o?.[/^\d+$/.test(k) ? Number(k) : k], SCRIPT); return v?.hi ?? v; };
  /** A help turn in the first wording of the part still unsaid, ending on the invitation, put after the child's "7" at row k. */
  const secondHelp = (rows, k, part = "c4-maths-ch05-t01-s1:e3:card") => {
    const L0 = [...rows.slice(0, k), child("7")];
    const w = unsaidWordings({ rows: L0 }, L0.length, SCRIPT, part)[0];
    assert.ok(w, "a wording still unsaid");
    return [...L0, { who: "teacher", text: `${textOf(w)} Ab tum batao.`, seams: [{ left: "start", right: "help" }, { left: "help", right: "yourTurn" }], cell: { part, column: "wrong" } }];
  };
  // (X6a: after a C1 turn given by a remediation started at four hearings — circ-loop-7, the way back, then "7" — a help turn in a new wording
  // ending on an invitation is no first C1 turn: flags; after a C1 turn at a return — card-c-park — the same: flags)
  { const rows = R["circ-loop-7"], i0 = at0("circ-loop-7"), back = i0 + 9;
    assert.deepEqual(seams(rows[back]), ["verdict", "returnCard"], norm(rows[back].text));
    const L2 = secondHelp(rows, back + 1);
    assert.match(String(yt(L2, L2.length - 1)), /invitation/, "after a remediation's C1"); }
  { const rows = R["card-c-park"], i0 = at0("card-c-park");
    const k = rows.findIndex((x, n) => n > i0 && x.who === "teacher" && c1ReturnAt({ rows }, n, SCRIPT, AT.card.P));
    assert.ok(k > 0, "C1's turn at a return");
    const L2 = secondHelp(rows, k + 1);
    assert.match(String(yt(L2, L2.length - 1)), /invitation/, "after C1 at a return"); }
  // (X6b: the told answer after the remediation that was the question's C1 turn, the follow-up card having taken a turn of help, passes)
  for (const [name, off] of [["circ4-fwg-right-miss", 13], ["pz4-fwg-right-give", 13]]) {
    const rows = R[name], i = at0(name) + off;
    assert.ok(seams(rows[i]).includes("key"), `${name}: ${norm(rows[i].text)}`);
    assert.equal(seams(rows[i - 4])[0], "help", `${name}: the follow-up's help turn: ${norm(rows[i - 4].text)}`);
    assert.deepEqual([kw(rows, i), kb(rows, i)], [null, null], name);
    // (the other side: that turn at ANOTHER question's part, not the follow-up — the next card's — and the look back ends there, as before)
    const other = rows.map((x, k) => (k === i - 4 ? { ...x, text: rows.find((y) => y.who === "teacher" && atQuestionOf(SCRIPT, y.text) === ".skills[0].explain[3].ask").text, cell: { part: "c4-maths-ch05-t01-s1:e4:card", column: "other" } } : x));
    assert.equal(remC1Before({ rows: other }, i, SCRIPT, atQuestionOf(SCRIPT, rows[i - 2].text)), false, `${name}: another question between`);
    assert.match(String(kw(other, i)), /never said/, `${name}: another question between`);
  }
  // (X6c: the way back opening on the help-spent line after the follow-up's told answer passes; with no follow-up closed before it, or as a
  // second way back, it flags)
  { const rows = R["pz4-fw-give"], i0 = at0("pz4-fw-give"), told = i0 + 15, back = i0 + 17;
    assert.deepEqual(seams(rows[told]), ["key", "checkin"], norm(rows[told].text));
    assert.deepEqual(seams(rows[back]), ["helpSpent", "returnCard"], norm(rows[back].text));
    assert.deepEqual(q5(rows, back), [null, null]);
    const open = rows.map((x, k) => (k === told ? { ...x, text: "Chhote-bade tukde gin kar naam nahi rakhte. Roti ka bada tukda: aadhe se kam, aadha, ya aadhe se zyada?", seams: [{ left: "start", right: "help" }, { left: "help", right: "card" }] } : x));
    assert.ok(q5(open, back).every((x) => /heard a \d+th time/.test(String(x))), "no follow-up closed before it");
    const again = [...rows.slice(0, back + 1), child("pata nahi"), { ...rows[back] }];
    assert.ok(q5(again, again.length - 1).every((x) => /heard a \d+th time/.test(String(x))), "a second way back"); }
});
