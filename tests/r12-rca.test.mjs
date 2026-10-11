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

test("RCA-1: the whiteboard ask carries what the child asked to see (turns 2, 10, 22: a game, a photo, aloo)", { todo: "r13 fix 1" }, () => {
  // state as on turn 11 of a95d2ff1: a visual request, skill s1, the same explain beat; the child asked for aloo
  const next = { ctx: { classLevel: 9, lang: "hinglish" }, lastMove: { kind: "reteach", skillId: "c9-maths-ch08-t01-s1", visual: "diagram", request: "visual" },
    lastContent: [], wbBeat: "b6-explain", topicId: "c9-maths-ch08-t01" };
  const ask = whiteboardIntentOf({ lessonId: "L", turn: 11, beat: { id: "b6-explain", type: "explain" }, next, kit: { topicId: "c9-maths-ch08-t01", skills: [] }, item: null,
    line: { text: line(23), teacherReplySeq: 23 } });
  // today: nothing about the child's ask reaches Studio, so every board on s1 is the lesson's cached compare@1 table
  assert.ok(ask.intent.request, "the intent names the child's request (kind + subject), so the board can answer it or decline it");
});

test("RCA-2: a claim about the screen is checked against what is mounted (turn 3 'game', turns 23/25 'aloo')", { todo: "r13 fix 2" }, () => {
  // turn 3: chips were up and the explainer rung was mounted → screenProblem passes the line; nothing interactive was on screen
  assert.equal(screenProblem(line(3), { chips: [{ id: "x" }] }, RUNG), true, "'Screen par game' with no play piece mounted");
  // turn 23: the maths board was on screen; 'aloo' is in none of its labels
  assert.equal(screenProblem(line(23), { chips: [], onScreen: TABLE_LABELS, ...BOARD_SLOT }, RUNG), true, "'screen par aloo dekho' over a maths table");
  // turn 25: 'board par … dekho' — 'board' is not even a screen word today
  assert.equal(screenProblem(line(25), { onScreen: TABLE_LABELS, ...BOARD_SLOT }, null), true, "'board par aloo dekho' over a maths table");
});

test("RCA-3: an off-topic picture ask is remembered and answered honestly (turns 18-22)", { todo: "r13 fix 3" }, () => {
  // 'mujhe aloo ke baare mein padhna hai' names the subject the later 'Show me a picture' chip is about
  const r = requestOf(line(18));
  assert.ok(r && r.subject && /आलू|aloo|potato/i.test(r.subject), `the child's subject is kept (got ${JSON.stringify(r)})`);
});

test("RCA-4a: 'board clear karo … hatao' is a request the lesson can act on (turn 12)", { todo: "r13 fix 4" }, () => {
  for (const said of [line(12), "board clear karo", "ye board hatao", "board saaf karo"]) {
    assert.equal(requestOf(said)?.type, "clear_board", said);
  }
});

test("RCA-4b: the lesson's own terms reach speech recognition ('recursive' heard as 'recording', turn 12)", { todo: "r13 fix 4" }, () => {
  const s = sttSession({ ageBand: "10-15", terms: ["recursive rule", "explicit rule"] });
  const t = s.audio.input.transcription;
  assert.ok(JSON.stringify(t).includes("recursive"), "a structured term list (never the free-text prompt: context/rejected.md) is passed");
});

test("RCA-5: the screen repair keeps what the sentence said and drops only the pointing (turn 11)", { todo: "r13 fix 5" }, () => {
  // the export holds only the guarded reply (reasons guard.rewritten + guard.screen + guard.replaced). A reconstruction of the
  // draft's shape: she pointed at the board for the sequence. The board showed "4 | +3 | ?" (page 3) and "? | +? | ?" (page 4,
  // this reply's), so "7, 10" were not drawn and pointing at them was wrong; but the repair (stripScreenRefs) deleted the whole sentence, sequence and all,
  // and the child got "Ab 10 ke baad number bolo." with no 10 anywhere before it
  const draft = "Screen par seedhi dekho: 4, 7, 10. Ab 10 ke baad number bolo.";
  const fixed = stripScreenRefs(draft);
  assert.match(fixed, /4, 7, 10/, "the content of the pointing sentence stays, in words");
  assert.doesNotMatch(fixed, /screen/i);
});

test("RCA-7: a 'continue' board page builds on the page under it or clears it (pages 3-5 were drawn over the table)", { todo: "r13 fix 7" }, () => {
  const pages = A.board_page;
  for (let i = 1; i < pages.length; i++) {
    const s = pages[i].script;
    if (s.mode !== "continue") continue;
    const prevIds = new Set(pages[i - 1].script.ops.map((o) => o.id));
    const builds = s.ops.some((o) => (o.target && prevIds.has(o.target)) || o.op === "erase");
    // the client (src/modules/whiteboard/StudioWhiteboard.tsx priorFor) draws the whole previous board under a continue
    // script; a continue page that neither refers to it nor erases it paints on top of it
    assert.ok(builds, `page ${pages[i].seq} (mode continue) neither targets page ${pages[i - 1].seq} nor erases it`);
  }
});

test("RCA evidence (passes today): 7 of 10 pages are the same s1 table; the screen guard passed turn 3", () => {
  const table = A.board_page.filter((p) => p.script.ops.some((o) => o.text === "Recursive rule") && p.script.ops.some((o) => o.text === "Explicit rule"));
  assert.equal(A.board_page.length, 10);
  assert.equal(table.length, 7);
  assert.ok(table.every((p) => p.skill_id === "c9-maths-ch08-t01-s1"));
  assert.equal(screenProblem(line(3), { chips: [{ id: "x" }] }, RUNG), false, "the guard's predicate is 'is there anything to tap', not 'is this claim true'");
  // turn 11's mechanism: with a board (not a tap target) up, a 'screen' line is a problem, and the strip keeps only the
  // sentences without the word: the child got the bare last one
  const draft = "Screen par seedhi dekho: 4, 7, 10. Ab 10 ke baad number bolo.";
  assert.equal(screenProblem(draft, { chips: [], ...BOARD_SLOT }, null), true);
  assert.equal(stripScreenRefs(draft), line(11));
  const spec = Object.values(EXPORT).flatMap((L) => L.brain_trace.map((b) => b.reasons));
  assert.equal(spec.filter((r) => r.includes("turn.speculation_miss")).length, 14);
  assert.equal(spec.filter((r) => r.includes("turn.speculation_hit")).length, 1);
});
