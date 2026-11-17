// dc-r8-director26 (docs/patches/to-brain/040): each predicate rewritten or added for director26 is run over the director26 rows the
// judges named for it and must read non-zero there before it is trusted to read 0 on the dry matrix. director26's own check read 0 on
// every one of the B1 rows (helpBoard compared a remediation's help with the card board help.js borrowed for it, and could not read a
// two-page row's boards). A row number is its 0-based index in `director`, as the judges count.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { lessonFlags, PREDICATES, PENDING } from "../evals/hybrid-side-by-side/dry-predicates.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const RUNS = { d26: "2026-11-17-director26", d25: "2026-11-16-director25" };
const FILE = { c4: "c4-ch05-t01", "c5-t01": "c5-ch02-t01", "c5-t02": "c5-ch02-t02", c6: "c6-ch06-t01" };
const lessonOf = (run, topic, child) => {
  const dir = join(ROOT, "tests/fixtures/eval-results/hybrid-side-by-side/results", RUNS[run]);
  const j = JSON.parse(readFileSync(join(dir, `${child}-${FILE[topic]}.json`), "utf8"));
  const snap = join(dir, "scripts", `${j.topicId}.json`);
  const script = JSON.parse(readFileSync(existsSync(snap) ? snap : join(ROOT, "data/lesson-scripts", `${j.topicId}.json`), "utf8"));
  return { rows: j.director, script };
};
const cache = new Map();
export const flagsOf = (run, topic, child) => { const k = `${run}|${topic}|${child}`; if (!cache.has(k)) cache.set(k, lessonFlags(lessonOf(run, topic, child))); return cache.get(k); };
/** Every named row must carry a flag of the predicate. Rows are [topic, child, row] (director26) or ["d25", topic, child, row]. */
function readsOn(predicate, rows) {
  assert.ok(PREDICATES[predicate], `${predicate} exists`);
  assert.ok(!PENDING.has(predicate), `${predicate} is gated`);
  const norm = (x) => (x[0] === "d25" ? x : ["d26", ...x]);
  const missed = rows.map(norm).filter(([run, topic, child, row]) => !flagsOf(run, topic, child).some((f) => f.predicate === predicate && f.row === row));
  assert.deepEqual(missed.map((x) => x.join(" ")), [], `${predicate} reads 0 on rows it is written for`);
}

test("B1 helpBoard: a remediation's help said over another card's board (the six director26 rows), and director25's rows", () => {
  readsOn("helpBoard", [["c4", "steering", 12], ["c6", "steady", 48], ["c6", "stuck", 58], ["c6", "steering", 8], ["c5-t02", "steady", 82], ["c5-t02", "steering", 12],
    ["d25", "c4", "steady", 124], ["d25", "c4", "stuck", 30]]);
});

test("B2 stopAuthored: the stop turn is the authored line, never the model's menu", () => {
  readsOn("stopAuthored", [["c4", "stuck", 68], ["c5-t01", "stuck", 74], ["c6", "stuck", 72], ["c6", "steering", 50]]);
});

test("N1 requestAnswered: a give-up or a clarify never gets nothing (no part recorded, the hook, a point's spent wordings)", () => {
  readsOn("requestAnswered", [["c5-t01", "steady", 128], ["c5-t02", "stuck", 28], ["c5-t02", "steering", 4], ["c6", "steady", 4], ["c6", "stuck", 4], ["c6", "offtopic", 4], ["c6", "steering", 4]]);
});
test("N1 teachingParts: a teaching turn has parts (c5-t02 steering 4, the model's draft cut by the length guard)", () => {
  readsOn("teachingParts", [["c5-t02", "steering", 4]]);
});

test("J1 goOnAfterKey: the go-on line only after a key (a worked step whose ladder is empty goes on with no promise)", () => {
  readsOn("goOnAfterKey", [["c5-t02", "stuck", 58], ["c5-t02", "stuck", 64], ["c5-t01", "stuck", 44], ["c6", "stuck", 44]]);
});
test("J1 goOnStacked: no go-on line where the back-to joint follows", () => {
  readsOn("goOnStacked", [["c5-t01", "stuck", 30], ["c5-t01", "steering", 18], ["c5-t02", "stuck", 46], ["c6", "stuck", 30], ["c6", "steering", 18]]);
});
test("J1 beforeWorked: a verdict into a worked problem takes the beforeWorked joint", () => {
  readsOn("beforeWorked", [["c6", "steady", 16], ["c6", "steady", 58], ["c6", "steady", 86], ["c6", "stuck", 34], ["c6", "offtopic", 42], ["c6", "steering", 40],
    ["c5-t02", "steady", 20], ["c5-t02", "steady", 72], ["c5-t02", "steady", 132], ["c5-t02", "steering", 42]]);
});

test("R1 skillRemediation: a mix-up met again in a later skill gets that skill's own remediation", () => {
  readsOn("skillRemediation", [["c5-t02", "steady", 118], ["c5-t02", "steady", 120], ["c5-t02", "steady", 126], ["c5-t02", "steady", 146]]);
});

test("A4 asideReplied: an aside said again, or the child's answer about it, is replied to in a phrase of theirs — not 'Achha.' nor 'Oh, chauka. Achha.'", () => {
  readsOn("asideReplied", [["c4", "offtopic", 20], ["c4", "offtopic", 32], ["c6", "stuck", 54], ["c5-t02", "steady", 42], ["c5-t02", "offtopic", 40]]);
});
test("W1 closingWhy: the closing verdict says its why", () => {
  readsOn("closingWhy", [["c4", "steady", 128], ["c5-t01", "steady", 130]]);
});
test("W1 wrapAckFirst: what the child says before the wrap is answered by the acknowledgement", () => {
  readsOn("wrapAckFirst", [["c5-t02", "steady", 158], ["c6", "steady", 114]]);
});
test("Record verdictRecorded: no verdict recorded on a go-on turn where none was said", () => {
  readsOn("verdictRecorded", [["c5-t01", "stuck", 30], ["c5-t01", "stuck", 44], ["c5-t01", "steering", 18], ["c5-t02", "stuck", 46], ["c5-t02", "stuck", 58], ["c5-t02", "stuck", 64],
    ["c6", "stuck", 30], ["c6", "stuck", 44], ["c6", "offtopic", 56], ["c6", "steering", 18], ["c6", "steering", 32]]);
});
test("Record helpRecorded: a help wording is recorded as help, not as a point", () => {
  // (the six B1 rows are help wordings; every help wording of the run was recorded as a point or a remediation)
  readsOn("helpRecorded", [["c4", "steering", 12], ["c6", "steady", 48], ["c5-t02", "steering", 12]]);
});
// (dc-r8-director27 Brain 042 E3: the card's own posing board — its second view, under its authored caption — is the picture after a key too;
// director26's c5-t01 steering 14 drew it there. pictureAfterKey still reads a picture after a key on any other board; E3's pictureCaption
// reads its caption, tests/r8-director27-042.test.mjs)
test("Record pictureAfterKey: a picture after a key draws the answered board or the card's posing board — never another", () => {
  const sc = JSON.parse(readFileSync(join(ROOT, "data/lesson-scripts/c5-maths-ch02-t01.json"), "utf8"));
  const then = sc.skills[0].remediation.find((r) => r.then?.answerBoard && r.then?.board)?.then;
  assert.ok(then, "a then-card with an answer board");
  const prevT = { who: "teacher", text: "Is sawaal ka jawab 1/6 hai, kyunki x. Ab tak samajh aaya?", boardRef: then.answerBoard, pageParts: [{ part: "close", from: 0, beat: "then:x" }] };
  const at = (board) => lessonFlags({ rows: [prevT, { who: "child", text: "drawing karke samjhao", read: "no_evidence · visual" }, { who: "teacher", text: "x", boardRef: board }], script: sc }).filter((f) => f.predicate === "pictureAfterKey").length;
  assert.equal(at(then.answerBoard), 0);
  assert.equal(at(then.board), 0, "the posing board (E3)");
  assert.equal(at({ template: "shape@1", params: { shape: "hexagon" } }), 1, "another board");
});

// dc-r8-director26 C1, main's ruling change 2: longPointCard reads a point and its card in one turn over 60 words as a fault only when
// another part comes before the point (director24's rule: a verdict, a why, a key, a bridge); over 75 always. A bare point and its own card
// share a turn of up to 75 words.
test("C1 longPointCard: over 60 a fault only with a part before the point; over 75 always", () => {
  const words = (n, w = "tukda") => Array.from({ length: n }, () => w).join(" ");
  const row = (parts) => {
    let text = "", pageParts = [];
    for (const [part, beat, n] of parts) { pageParts.push({ part, from: text ? text.length + 1 : 0, beat }); text = text ? `${text} ${words(n)}` : words(n); }
    return { who: "teacher", text, pageParts, seams: [] };
  };
  const P = PREDICATES.longPointCard;
  assert.ok(!PENDING.has("longPointCard"), "gated");
  assert.equal(P({ rows: [] }, row([["body", "e1", 55], ["card", "e1", 15]])), null, "a bare point and its card, 70 words: one turn");
  assert.match(P({ rows: [] }, row([["body", "e1", 62], ["card", "e1", 16]])) ?? "", /78 words/, "a bare point and its card over 75");
  assert.match(P({ rows: [] }, row([["close", "e1", 20], ["body", "e2", 30], ["card", "e2", 15]])) ?? "", /part before the point/, "a verdict, the next point and its card over 60");
  assert.match(P({ rows: [] }, row([["bridge", "bridge", 15], ["body", "e1", 35], ["card", "e1", 12]])) ?? "", /part before the point/, "a bridge, the point and its card over 60");
  assert.equal(P({ rows: [] }, row([["close", "e1", 20], ["body", "e2", 25], ["card", "e2", 12]])), null, "57 words with a verdict: one turn, as director24 allowed");
  // (words before the point the record has no part for — her reply to an aside, the hook — are a part before it)
  const hooked = row([["body", "e1", 40], ["card", "e1", 12]]);
  const hookText = words(14, "pitch");
  const h = { ...hooked, text: `${hookText} ${hooked.text}`, pageParts: hooked.pageParts.map((p) => ({ ...p, from: p.from + hookText.length + 1 })) };
  assert.match(P({ rows: [] }, h) ?? "", /part before the point/, "the hook, the point and its card over 60");
  assert.equal(P({ rows: [] }, row([["body", "e1", 50], ["body", "e1", 15]])), null, "no card: no fault");
});
