// dc-r8-director27 (docs/patches/to-brain/041): each predicate written for director27 is run over the director27 rows the work order lists
// for it and must read non-zero there before it is trusted to read 0 on the dry matrix (fd-predicate-must-fail-on-judges-rows). They are
// written from the gate's sentences, not from these rows' shapes (fd-predicate-proved-on-last-runs-fault): P1's three read the paging law,
// P3's reads "a request gets help for the part she is on", P5's reads "a return is led by the back-to joint". A row number is its 0-based
// index in `director`, as the judges count.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { lessonFlags, PREDICATES, PENDING } from "../evals/hybrid-side-by-side/dry-predicates.mjs";
import { pagesOf, partsOf } from "../evals/hybrid-side-by-side/d27-predicates.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const DIR = join(ROOT, "tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-17-director27");
const FILE = { c4: "c4-ch05-t01", "c5-t01": "c5-ch02-t01", "c5-t02": "c5-ch02-t02", c6: "c6-ch06-t01" };
const cache = new Map();
const flagsOf = (topic, child) => {
  const k = `${topic}|${child}`;
  if (!cache.has(k)) {
    const j = JSON.parse(readFileSync(join(DIR, `${child}-${FILE[topic]}.json`), "utf8"));
    const snap = join(DIR, "scripts", `${j.topicId}.json`);
    const script = JSON.parse(readFileSync(existsSync(snap) ? snap : join(ROOT, "data/lesson-scripts", `${j.topicId}.json`), "utf8"));
    cache.set(k, lessonFlags({ rows: j.director, script }));
  }
  return cache.get(k);
};
/** Every named row carries a flag of one of the predicates. Rows are [topic, child, row]. */
function readsOn(predicates, rows) {
  for (const p of predicates) { assert.ok(PREDICATES[p], `${p} exists`); assert.ok(!PENDING.has(p), `${p} is gated`); }
  const missed = rows.filter(([topic, child, row]) => !flagsOf(topic, child).some((f) => predicates.includes(f.predicate) && f.row === row));
  assert.deepEqual(missed.map((x) => x.join(" ")), [], `${predicates.join("/")} reads 0 on rows it is written for`);
}

// P1, the four shapes of one fault. Each shape names its rows; the predicate that reads it is the law's sentence the row breaks.
const REM_AND_CARD = [["c5-t02", "steady", 24], ["c5-t02", "steady", 90], ["c5-t02", "stuck", 20], ["c5-t02", "offtopic", 6], ["c5-t02", "steering", 10]];
const HOOK_POINT = [["c5-t01", "steady", 2], ["c5-t01", "offtopic", 2]];
const REM_NO_BOARD = [["c5-t02", "steady", 118], ["c4", "steady", 58], ["c4", "stuck", 22], ["c4", "offtopic", 62], ["c4", "steering", 32],
  ["c6", "steady", 46], ["c6", "steady", 92], ["c6", "offtopic", 30], ["c6", "offtopic", 64]];
const CARD_AFTER_AI = [["c6", "offtopic", 10]];

test("P1 boardOfSaidPart: a board on screen belongs to a part said in the turn or before — never a card not yet said", () => {
  readsOn(["boardOfSaidPart"], [...REM_AND_CARD, ...HOOK_POINT, ...REM_NO_BOARD]);
});
test("P1 partOwnBoard: a part with a board of its own has it up at its first word; one with none keeps what is up", () => {
  readsOn(["partOwnBoard"], [...REM_AND_CARD, ...HOOK_POINT, ...REM_NO_BOARD, ...CARD_AFTER_AI]);
});
test("P1 cardBoardUp: a turn that says a card has the card's board up from the card's first word", () => {
  readsOn(["cardBoardUp"], CARD_AFTER_AI);
});
test("P1: every listed row is read by one of the three", () => {
  readsOn(["boardOfSaidPart", "partOwnBoard", "cardBoardUp"], [...REM_AND_CARD, ...HOOK_POINT, ...REM_NO_BOARD, ...CARD_AFTER_AI]);
});

test("P3 requestHelped: a request gets help for the part she is on — not a back-to line and a card, the next step, nor the previous card's help", () => {
  // (c5-t01 steady 82 — a give-up at a bridge's check-in led on by the go-on joint — re-pinned to to-brain 049 B6: the go-on joint is now
  // that turn's lead, in the greeting's start line's place; see the P5 goOnAfterKey test below)
  readsOn(["requestHelped"], [["c5-t01", "stuck", 30], ["c5-t01", "steering", 18], ["c5-t01", "stuck", 44], ["c5-t01", "steady", 80],
    ["c6", "stuck", 58], ["c6", "offtopic", 54], ["c5-t02", "stuck", 42]]);
});

test("P5 returnLed: a card said again after other parts is led by the back-to joint (or the after-key return form)", () => {
  readsOn(["returnLed"], [["c4", "offtopic", 32], ["c4", "steering", 18], ["c5-t01", "offtopic", 12], ["c5-t02", "steady", 92], ["c5-t02", "offtopic", 10],
    ["c5-t02", "steering", 20], ["c6", "offtopic", 12]]);
});

test("the predicates' readers: a remediation's own board is its first recorded board; a joint owns no board (Brain 044 T4: it keeps what is up)", () => {
  const j = JSON.parse(readFileSync(join(DIR, "steady-c5-ch02-t02.json"), "utf8"));
  const parts = partsOf(j.director[24]);
  const rem = parts.find((p) => p.part === "body" && /^rem:/.test(p.beat) && !p.joint);
  assert.equal(rem.own.template, "wholes@1", "the remediation's own board, not its then-card's");
  // (Brain 044 T4 reverses director27's "a joint is said over the part it leads into": beforeRemediation is said over what is up)
  assert.equal(parts.find((p) => p.joint)?.own, null, "beforeRemediation owns no board");
  // (a remediation with no board in the script owns none: it keeps what is up)
  const c4 = JSON.parse(readFileSync(join(DIR, "steady-c4-ch05-t01.json"), "utf8"));
  assert.equal(partsOf(c4.director[58]).find((p) => /^rem:/.test(p.beat) && !p.joint && !p.checkin)?.own, null);
  // (the drawn pages: a two-page row from its segments, at Studio's froms)
  const { pages } = pagesOf(j.director[24], null);
  assert.deepEqual(pages.map((p) => [p.from, p.board.template]), [[0, "wholes@1"], [20, "fraction-bars@1"]]);
});

// (re-pinned to to-brain 049 B6: a give-up or a clarify at a bridge's check-in goes on led by the go-on joint — the greeting's start line
// was said there — so c5-t01 steady 82, the go-on line at a bridge's check-in, is the order's shape now and no law reads it)
test("P5 goOnAfterKey: the go-on line at a bridge's give-up (c5-t01 steady 82) is to-brain 049 B6's lead, read by neither goOnAfterKey nor requestHelped", () => {
  assert.ok(PREDICATES.goOnAfterKey && !PENDING.has("goOnAfterKey"));
  assert.ok(!flagsOf("c5-t01", "steady").some((f) => ["goOnAfterKey", "requestHelped"].includes(f.predicate) && f.row === 82));
});
