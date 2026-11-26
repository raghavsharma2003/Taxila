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
import { lessonFlags, PENDING } from "../evals/hybrid-side-by-side/dry-predicates.mjs";
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

// Expected to fail ONLY until the item that fixes each lands in this session (BRIEF-P step 1); empty at the session's last commit.
const EXPECTED = new Set([
  "card-a-aireply 18 questionFifthOnHerOwn",
  "card-a-aireply 18 questionFiveTimes",
  "card-a-clar 16 questionFifthOnHerOwn",
  "card-a-clar 16 questionFiveTimes",
  "card-a-hindi 16 questionFifthOnHerOwn",
  "card-a-hindi 16 questionFiveTimes",
  "card-a-pic 16 questionFifthOnHerOwn",
  "card-a-pic 16 questionFiveTimes",
  "card-a-try 18 waitSecondNotReask",
  "card-a-yes 16 waitSecondNotReask",
  "card-b-clar 16 yourTurnNotThird",
  "card-c-aireply 16 questionFifthOnHerOwn",
  "card-c-aireply 16 questionFiveTimes",
  "card-c-aireply 18 questionFifthOnHerOwn",
  "card-c-aireply 18 questionFiveTimes",
  "card-c-aireply 20 keyWithWordingUnsaid",
  "card-c-aireply 20 readerAsideColumn",
  "card-c-park 18 questionFifthOnHerOwn",
  "card-c-park 18 questionFiveTimes",
  "card-c-park 20 questionFifthOnHerOwn",
  "card-c-park 20 questionFiveTimes",
  "step-a-again 20 reaskSameAfterHelp",
  "step-a-aireply 22 stepToldEarly",
  "step-a-give 20 giveUpVerdict",
  "step-a-hindi 22 stepToldEarly",
  "step-a-miss 20 stepToldEarly",
  "step-a-park 20 stepToldEarly",
  "step-a-pic 20 questionFifthOnHerOwn",
  "step-a-pic 20 questionFiveTimes",
  "step-a-pic 20 reaskSameAfterHelp",
  "step-a-right 20 stepToldEarly",
  "step-b-clar 20 stepToldEarly",
  "step-c-aireply 22 goOnJointTwice",
  "step-c-aireply 22 stepToldEarly",
  "step-c-park 22 keyWithWordingUnsaid",
]);

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
  for (let i = 1; i < rows.length; i++) if (rows[i].who === "child" && rows[i].text === w.then[0] && atQuestionOf(SCRIPT, rows[i - 1].text) === AT[w.name.split("-")[0]].P) return i;
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
    const P = AT[w.name.split("-")[0]].P;
    for (let k = 0; k < 3; k++) assert.equal(atQuestionOf(SCRIPT, rows[i0 + 2 * k + 1].text), P, `${w.name}: hearing ${k + 2}`);
    // (a: the fourth line is a miss and her turn is C1's — help ending on an invitation, the question not said)
    if (w.name.split("-")[1] === "a") {
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
