// Round 7 (main, director7: "1/3 ka mark hai" asked over the 1/8 | 1/4 | 1/2 board, 5 turns): a remediation `say` and its
// then-card in ONE turn draw two pages. The say's clauses play over the remediation board; from the then-prompt's first
// clause, the then-card's own board. The page turns on that clause's real onset when the voice reports it (the player's
// onLineClock), else on the estimate. Pure: no DB, no model.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as seam from "../server/studio/seam.js";
import * as BF from "../server/stagecraft/board-first.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { onLineClock } from "../src/modules/whiteboard/lineClock.ts";

const T = "c5-maths-ch02-t01";
const kit = kitFromFile(getTopic(T));
const sc = JSON.parse(fs.readFileSync(`data/lesson-scripts/${T}.json`, "utf8"));
const rem = sc.skills[0].remediation[1];
const say = rem.say.hi, then = rem.then.prompt.hi, line = `${say} ${then}`;
const ask = (id, extra = {}) => ({ intent: { intentId: `${id}:wb:7`, lessonId: id, kind: "whiteboard", beat: "explain", style: { band: "B3" }, need: "explain",
  boardRef: rem.board, scriptBeat: { scriptId: "s", beatId: "rem:whole-number-bias", kind: "remediation" },
  then: { boardRef: rem.then.board, scriptBeat: { scriptId: "s", beatId: `then:${rem.targets}`, kind: "check", ownBoard: true }, atChar: say.length + 1 }, ...extra },
  line: { lessonId: id, teacherReplySeq: 7, text: line }, mode: "fresh", kit: { topicId: T, content: [] } });
const texts = (ops) => ops.filter((o) => o.op === "text" || o.op === "label").map((o) => o.text);

test("director7: the say plays over the remediation board, the then-prompt over the then-card's board (one turn, two pages)", () => {
  const id = "d7-two";
  seam.studioSeam.prefetch({ lessonId: id, purpose: "practice", kit, topicId: T, child: { id: "child-d7", class_level: 5, language_pref: "hinglish" } });
  const ack = seam.studioSeam.requestIntent(ask(id));
  assert.equal(ack?.state, "revealed");
  const s = ack.artifact.script;
  const { clause, atMs } = s.switchAt;
  assert.ok(atMs > 2000, `the turn is after the say (${atMs} ms)`);
  // page A, under the say: the three marks; page B, from the then-prompt: its 1/3 mark (not 1/8 | 1/4 | 1/2)
  const before = s.ops.filter((o) => o.startMs < atMs), after = s.ops.filter((o) => o.startMs >= atMs && o.op !== "erase");
  assert.deepEqual(["1/8", "1/4", "1/2"].filter((t) => texts(before).includes(t)), ["1/8", "1/4", "1/2"]);
  assert.ok(texts(after).includes("1/3") && !texts(after).some((t) => ["1/8", "1/4", "1/2"].includes(t)));
  // page A is erased at the turn, every op of it
  const drawnA = before.filter((o) => !["erase", "highlight"].includes(o.op)).map((o) => o.id);
  assert.deepEqual(s.ops.filter((o) => o.op === "erase" && o.startMs === atMs).map((o) => o.target).sort(), [...drawnA].sort());
  // the screen is the then-card's page; the say's page is screenBefore, up to her line's switch character
  assert.ok(ack.artifact.screen.numbers.includes("1/3"));
  assert.ok(ack.artifact.screenBefore.numbers.includes("1/8"));
  assert.equal(line.slice(ack.artifact.switchChar).startsWith(then), true);
  // the turn is the voice's own clause index of the then-prompt (sentences, then clauses)
  assert.ok(Number.isInteger(clause) && clause >= 2, `clause ${clause}`);
  // the player: the then-prompt clause sounds 900 ms later than estimated → page B (and its erase of A) moves with it
  const onsets = []; onsets[clause] = atMs + 900;
  const moved = onLineClock(s, onsets);
  const firstB = Math.min(...moved.ops.filter((o) => o.id.startsWith("b.")).map((o) => o.startMs));
  assert.equal(firstB, Math.min(...s.ops.filter((o) => o.id.startsWith("b.")).map((o) => o.startMs)) + 900);
  assert.ok(moved.ops.filter((o) => o.id.startsWith("a.")).every((o, i) => o.startMs === s.ops.filter((q) => q.id.startsWith("a."))[i].startMs), "page A stays put");
  // with no onset reported, the estimate stands
  assert.equal(onLineClock(s, []), s);
});

test("director7: without a then marker (or with a bad one) the turn draws one page as before", () => {
  const id = "d7-one";
  seam.studioSeam.prefetch({ lessonId: id, purpose: "practice", kit, topicId: T, child: { id: "child-d7b", class_level: 5, language_pref: "hinglish" } });
  const a = ask(id); delete a.intent.then;
  assert.equal(BF.twoPageBoard(a, { kit }), null);
  const bad = ask(`${id}-b`); bad.intent.then.atChar = 0;
  assert.equal(BF.thenSplit(bad), null);
  // (as Brain does at kernel time: the board is preselected before her line, then drawn on it)
  seam.studioSeam.preselectWhiteboard({ ...a, line: { ...a.line, text: "" } });
  const ack = seam.studioSeam.requestIntent(a);
  assert.equal(ack?.state, "revealed");
  assert.equal(ack.artifact.script.switchAt, undefined);
  assert.equal(ack.artifact.screenBefore, undefined);
});
