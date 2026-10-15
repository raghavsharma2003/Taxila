// r12 RCA (stream 4A, 2026-10-11): the owner's two release-11 lessons (a95d2ff1, b08fe8a7; export
// docs/design/round4/build/r12/rca/owner-lessons-2026-10-11.json). One test per failure, written against the behaviour the
// fix must produce, from the lessons' real lines and the exported board pages. They fail today, so each is marked `todo`:
// node:test reports it ("# TODO") without failing the gate. A release-13 fix removes its `todo` in the same commit, and the
// test then guards it. See docs/design/round4/build/r12/rca/RCA.md. Pure: no network, no database.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { whiteboardIntentOf } from "../server/brain/propose.js";
import { screenProblem, stripScreenRefs } from "../server/director/say.js";
import { requestOf } from "../server/director/requests.js";
import { sttSession } from "../server/voice/stt.js";

const EXPORT = JSON.parse(fs.readFileSync(new URL("../docs/design/round4/build/r12/rca/owner-lessons-2026-10-11.json", import.meta.url), "utf8"));
const A = EXPORT["a95d2ff1-0d79-4d4c-8f32-dd255c2236e1"];
const line = (seq) => A.turns.find((t) => t.seq === seq).text;
const RUNG = { id: "rung-s1", engine: "explainer@1" };          // the Director's template board in the tray (brain/propose.js RUNG_ENGINE)
const BOARD_SLOT = { studioSlot: { slotId: "s", intentId: "i", artifact: { kind: "whiteboard" } } };
const TABLE_LABELS = "Recursive rule | Explicit rule | First term | Nth term";

test("RCA-1: the whiteboard ask carries what the child asked to see (turns 2, 10, 22: a game, a photo, aloo)", () => {
  // state as on turn 11 of a95d2ff1: a visual request, skill s1, the same explain beat; the child asked for aloo (round 5,
  // stream 2: the Director's move carries what was asked as move.see, from requestOf's reading of "आलू दिखाओ")
  const see = requestOf("आलू दिखाओ").see;
  const next = { ctx: { classLevel: 9, lang: "hinglish" }, lastMove: { kind: "reteach", skillId: "c9-maths-ch08-t01-s1", visual: "diagram", request: "visual", see: { ...see, off: true } },
    lastContent: [], wbBeat: "b6-explain", topicId: "c9-maths-ch08-t01" };
  const ask = whiteboardIntentOf({ lessonId: "L", turn: 11, beat: { id: "b6-explain", type: "explain" }, next, kit: { topicId: "c9-maths-ch08-t01", skills: [] }, item: null,
    line: { text: line(23), teacherReplySeq: 23 } });
  // today: nothing about the child's ask reaches Studio, so every board on s1 is the lesson's cached compare@1 table
  assert.ok(ask.intent.request, "the intent names the child's request (kind + subject), so the board can answer it or decline it");
  assert.equal(ask.intent.request.subject, "आलू");
  assert.equal(ask.mode, "fresh", "a page drawn for a request is a new page, even on the same beat");
});

test("RCA-2: a claim about the screen is checked against what is mounted (turn 3 'game', turns 23/25 'aloo')", () => {
  const table = { kind: "whiteboard", script: { ops: A.board_page[0].script.ops } };   // the s1 table, as exported
  const rung = { ...RUNG, params: { script: { ops: A.board_page[0].script.ops } } };
  // turn 3: chips up and the explainer rung mounted: today passed; nothing interactive was on screen
  assert.equal(screenProblem(line(3), { chips: [{ id: "x", label: "Keep going" }] }, rung), true, "'Screen par game' with no play piece mounted");
  // turns 23 and 25: the maths table on screen; nothing it shows is aloo
  assert.equal(screenProblem(line(23), { chips: [], studioSlot: { artifact: table } }, null), true, "'screen par aloo dekho' over a maths table");
  assert.equal(screenProblem(line(25), { studioSlot: { artifact: table } }, null), true, "'board par aloo dekho' over a maths table");
  // the release-13 replay's turn 3 (2026-10-11): "screen ke" is pointing too
  assert.equal(screenProblem("Game: screen ke four parts dekhiye—sequence, term, recursive, explicit. Pehla: next term kaise milega?", { chips: [{ id: "x", label: "Keep going" }] }, rung), true);
  // the third replay's turn 3: the table framed as a game to play on screen
  assert.equal(screenProblem("Chaliye screen par “spot the rule” kheliye: recursive rule mein previous term dekhiye. Pehle kaunsa column chunenge?", { studioSlot: { artifact: table } }, null), true);
  // and what stays allowed: pointing at what IS drawn
  assert.equal(screenProblem("Screen par dekho: Recursive rule left mein hai. Explicit rule kya karta hai?", { studioSlot: { artifact: table } }, null), false);
});

test("RCA-3: an off-topic picture ask is remembered and answered honestly (turns 18-22)", () => {
  // 'mujhe aloo ke baare mein padhna hai' names the subject the later 'Show me a picture' chip is about
  const r = requestOf(line(18));
  assert.ok(r && r.subject && /आलू|aloo|potato/i.test(r.subject), `the child's subject is kept (got ${JSON.stringify(r)})`);
});

test("RCA-4a: 'board clear karo … hatao' is a request the lesson can act on (turn 12)", () => {
  for (const said of [line(12), "board clear karo", "ye board hatao", "board saaf karo"]) {
    assert.equal(requestOf(said)?.type, "clear_board", said);
    // whole: classifyFast acts only on whole requests (the release-13 replay's turn 13 lost it as a long turn)
    assert.equal(requestOf(said)?.whole, true, said);
  }
});

test("RCA-4b: the lesson's own terms reach speech recognition ('recursive' heard as 'recording', turn 12)", { todo: "r13 fix 4" }, () => {
  const s = sttSession({ ageBand: "10-15", terms: ["recursive rule", "explicit rule"] });
  const t = s.audio.input.transcription;
  assert.ok(JSON.stringify(t).includes("recursive"), "a structured term list (never the free-text prompt: context/rejected.md) is passed");
});

test("RCA-5: the screen repair keeps what the sentence said and drops only the pointing (turn 11)", () => {
  // the export holds only the guarded reply (reasons guard.rewritten + guard.screen + guard.replaced). A reconstruction of the
  // draft's shape: she pointed at the board for the sequence. The board showed "4 | +3 | ?" (page 3) and "? | +? | ?" (page 4,
  // this reply's), so "7, 10" were not drawn and pointing at them was wrong; but the repair (stripScreenRefs) deleted the whole sentence, sequence and all,
  // and the child got "Ab 10 ke baad number bolo." with no 10 anywhere before it
  const draft = "Screen par seedhi dekho: 4, 7, 10. Ab 10 ke baad number bolo.";
  const fixed = stripScreenRefs(draft);
  assert.match(fixed, /4, 7, 10/, "the content of the pointing sentence stays, in words");
  assert.doesNotMatch(fixed, /screen/i);
});

test("RCA-7: a 'continue' page never lands on what the child already sees (pages 3-5 were drawn over the table and over each other)", async () => {
  const bs = await import("../server/stagecraft/board-sync.js");
  assert.equal(typeof bs.boardModeFor, "function", "r13 fix 7: board-sync.boardModeFor");
  // replay what the client draws under each page (src/modules/whiteboard/StudioWhiteboard.tsx priorFor/remember)
  let under = [];
  const modes = {};
  for (const p of A.board_page) {
    const mode = bs.boardModeFor(p.script, under);
    modes[p.seq] = mode;
    under = mode === "continue" ? [...under, ...p.script.ops] : [...p.script.ops];
  }
  // page 3's staircase crosses the table; page 4 writes "?" on page 3's "4" and "+3" (today page 5 also lands on the table's
  // "First term / Nth term"; with page 4 drawn clean, page 5 sits beside page 4's staircase and stays a continuation)
  assert.deepEqual([modes[3], modes[4], modes[5]], ["fresh", "fresh", "continue"]);
  // a continuation that builds beside the board stays a continuation
  const beside = { mode: "continue", ops: [{ id: "n", op: "text", at: [200, 290], size: "s", text: "next" }] };
  assert.equal(bs.boardModeFor(beside, [{ id: "a", op: "text", at: [100, 40], size: "s", text: "4" }]), "continue");
});

test("RCA evidence (passes today): 7 of 10 pages are the same s1 table; the screen guard passed turn 3", () => {
  const table = A.board_page.filter((p) => p.script.ops.some((o) => o.text === "Recursive rule") && p.script.ops.some((o) => o.text === "Explicit rule"));
  assert.equal(A.board_page.length, 10);
  assert.equal(table.length, 7);
  assert.ok(table.every((p) => p.skill_id === "c9-maths-ch08-t01-s1"));
  assert.equal(screenProblem(line(3), { chips: [{ id: "x" }] }, RUNG), true, "r13 fix 2 (today false: the guard's predicate was 'is there anything to tap', not 'is this claim true')");
  // turn 11's mechanism: with a board (not a tap target) up, a 'screen' line is a problem, and the strip keeps only the
  // sentences without the word: the child got the bare last one
  const draft = "Screen par seedhi dekho: 4, 7, 10. Ab 10 ke baad number bolo.";
  // release 13 integration (ms-r13-claims-after-board): a board with no words cannot disprove a content claim (a board of
  // shapes only is common and pointing at it is right; the packaged owner-5 run lost 4 of 12 visual requests to this);
  // the owner's turn-11 board was the rules TABLE, whose words hold none of hers, and that is still a false claim
  assert.equal(screenProblem(draft, { chips: [], ...BOARD_SLOT }, null), false, "a board of no words cannot disprove the claim");
  const tableSlot = { studioSlot: { ...BOARD_SLOT.studioSlot, artifact: { kind: "whiteboard", script: { ops: TABLE_LABELS.split(" | ").map((text, i) => ({ id: `t${i}`, op: "text", text })) } } } };
  assert.equal(screenProblem(draft, { chips: [], ...tableSlot }, null), true, "over the rules table, 'seedhi: 4, 7, 10' is not what the screen shows");
  assert.equal(stripScreenRefs(draft), "Seedhi: 4, 7, 10. Ab 10 ke baad number bolo.", "r13 fix 5: the strip keeps the content (today: the bare last sentence)");
  const spec = Object.values(EXPORT).flatMap((L) => L.brain_trace.map((b) => b.reasons));
  assert.equal(spec.filter((r) => r.includes("turn.speculation_miss")).length, 14);
  assert.equal(spec.filter((r) => r.includes("turn.speculation_hit")).length, 1);
});
