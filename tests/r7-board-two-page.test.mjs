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
  assert.equal(s.switches.length, 1);
  const { clause, atMs } = s.switches[0];
  assert.ok(atMs > 2000, `the turn is after the say (${atMs} ms)`);
  // page A, under the say: its 5/5 mark; page B, from the then-prompt: its 1/5 mark (not 5/5)
  const before = s.ops.filter((o) => o.startMs < atMs), after = s.ops.filter((o) => o.startMs >= atMs && o.op !== "erase");
  assert.deepEqual(["5/5"].filter((t) => texts(before).includes(t)), ["5/5"]);
  assert.ok(texts(after).includes("1/5") && !texts(after).some((t) => ["5/5"].includes(t)));
  // page A is erased at the turn, every op of it
  const drawnA = before.filter((o) => !["erase", "highlight"].includes(o.op)).map((o) => o.id);
  assert.deepEqual(s.ops.filter((o) => o.op === "erase" && o.startMs === atMs).map((o) => o.target).sort(), [...drawnA].sort());
  // the screen is the then-card's page; `screens` gives each page from her line's character `from`
  assert.ok(ack.artifact.screen.numbers.includes("1/5"));
  assert.ok(ack.artifact.screens[0].numbers.includes("5/5") && ack.artifact.screens[0].from === 0);
  assert.equal(line.slice(ack.artifact.screens[1].from).startsWith(then), true);
  // the turn is the voice's own clause index of the then-prompt (sentences, then clauses)
  assert.ok(Number.isInteger(clause) && clause >= 2, `clause ${clause}`);
  // the player: the then-prompt clause sounds 900 ms later than estimated → page B (and its erase of A) moves with it
  const onsets = []; onsets[clause] = atMs + 900;
  const moved = onLineClock(s, onsets);
  const firstB = Math.min(...moved.ops.filter((o) => o.id.startsWith("b.")).map((o) => o.startMs));
  assert.equal(firstB, Math.min(...s.ops.filter((o) => o.id.startsWith("b.")).map((o) => o.startMs)) + 900);
  const drawA = (sc) => sc.ops.filter((o) => o.id.startsWith("a.") && o.op !== "erase").map((o) => o.startMs);
  assert.deepEqual(drawA(moved), drawA(s), "page A stays put (its erase turns with page B)");
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
  assert.equal(ack.artifact.script.switches, undefined);
  assert.equal(ack.artifact.screens, undefined);
});

test("director7 B1/S2: three segments (say, then-card, closure) — each segment's clauses play over its own board; each page turns on its own clause onset", () => {
  const id = "d7-three";
  seam.studioSeam.prefetch({ lessonId: id, purpose: "practice", kit, topicId: T, child: { id: "child-d7c", class_level: 5, language_pref: "hinglish" } });
  const closure = "Toh poora jawab: 1/6, 0 aur 1/5 ke beech aata hai.";
  const closureRef = { template: "fraction-line@1", params: { dens: [5, 6], from: 0, to: 1, marks: [[1, 5], [1, 6]] } };
  const full = `${line} ${closure}`;
  const a = ask(id);
  delete a.intent.then;
  a.intent.segments = [{ atChar: say.length + 1, boardRef: rem.then.board, scriptBeat: { scriptId: "s", beatId: `then:${rem.targets}`, kind: "check", ownBoard: true } },
    { atChar: line.length + 1, boardRef: closureRef, scriptBeat: { scriptId: "s", beatId: "closure", kind: "explain" } }];
  a.line = { ...a.line, text: full };
  const ack = seam.studioSeam.requestIntent(a);
  assert.equal(ack?.state, "revealed");
  const s = ack.artifact.script;
  assert.equal(s.switches.length, 2);
  const [s1, s2] = s.switches;
  assert.ok(s1.atMs < s2.atMs && s1.clause < s2.clause);
  const page = (lo, hi) => texts(s.ops.filter((o) => o.op !== "erase" && o.startMs >= lo && o.startMs < hi));
  assert.ok(page(0, s1.atMs).includes("5/5"), "the say over its own board");
  assert.ok(page(s1.atMs, s2.atMs).includes("1/5") && !page(s1.atMs, s2.atMs).includes("5/5"), "the then-prompt over the then-card's board");
  assert.ok(page(s2.atMs, Infinity).includes("1/6"), "the closure over its own board");
  assert.deepEqual(ack.artifact.screens.map((x) => x.from), [0, say.length + 1, line.length + 1]);
  // the player: each page moves with its own clause's onset (the second 500 ms early, the third 700 ms late)
  const onsets = []; onsets[s1.clause] = s1.atMs - 500; onsets[s2.clause] = s2.atMs + 700;
  const m = onLineClock(s, onsets);
  const startOf = (sc, pre) => Math.min(...sc.ops.filter((o) => o.id.startsWith(pre) && o.op !== "erase").map((o) => o.startMs));
  assert.equal(startOf(m, "b."), startOf(s, "b.") - 500);
  assert.equal(startOf(m, "c."), startOf(s, "c.") + 700);
  assert.equal(startOf(m, "a."), startOf(s, "a."));
});

test("director7 S1: a card that sends its answers withholds THOSE only — every other number it states is drawn, whatever her line says", async () => {
  const { gateCtxFor } = await import("../server/stagecraft/board-sync.js");
  const c6 = kitFromFile(getTopic("c6-maths-ch06-t01"));
  const ref = { template: "measured@1", params: { shape: "polygon", unit: "m", sides: [8, 3, 5, 4, 3, 7] } };
  const a = { intent: { intentId: "d7s1:wb:1", lessonId: "d7s1", kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: ref,
    scriptBeat: { scriptId: "s", beatId: "c1", kind: "check", answers: ["30 m", "30"] } }, line: { lessonId: "d7s1", text: "" }, mode: "fresh", kit: { topicId: "c6-maths-ch06-t01", content: [] } };
  const p = BF.preselect(a, { kit: c6 });
  assert.deepEqual(texts(p.script.ops), ["8 m", "3 m", "5 m", "4 m", "3 m", "7 m"], "no '? m' (4 and 7 are kit keys elsewhere, not this card's)");
  const real = { ...a, line: { lessonId: "d7s1", text: "Ek L-shape kamre ki 6 bhujayein hain. Kamre ka parimap kitna hai?" } };
  const t = BF.takePreselected(real, gateCtxFor(real, { kit: c6, redact: [], prior: [] }));
  assert.deepEqual(texts(t.script.ops), ["8 m", "3 m", "5 m", "4 m", "3 m", "7 m"]);
  // and the card's own answer is still never drawn: a board that wrote 30 would be masked
  assert.deepEqual(gateCtxFor(real, { kit: c6 }).withhold.values, ["30"]);
});

test("director7 S1 live guard: a '?' drawn over a number her line states is flagged (artifact.statedAsUnknown + a trace row); a withheld answer she has not said is not", async () => {
  const { gateCtxFor, statedAsUnknown } = await import("../server/stagecraft/board-sync.js");
  const c6 = kitFromFile(getTopic("c6-maths-ch06-t01"));
  const ref = { template: "measured@1", params: { shape: "polygon", unit: "m", sides: [8, 3, 5, 4, 3, 7] } };
  // (`force`: a withheld set that names a value her line states — what any upstream rule that masks a stated number would
  // hand the gate; since director8 the card-answers rule never does, so the guard is driven here directly)
  const run = (id, answers, text, force = null) => {
    const a = { intent: { intentId: `${id}:wb:1`, lessonId: id, kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: ref,
      scriptBeat: { scriptId: "s", beatId: "c1", kind: "check", answers } }, line: { lessonId: id, text }, mode: "fresh", kit: { topicId: "c6-maths-ch06-t01", content: [] } };
    BF.preselect({ ...a, line: { lessonId: id, text: "" } }, { kit: c6 });
    const ctx = gateCtxFor(a, { kit: c6, redact: [], prior: [] });
    const t = BF.takePreselected(a, force ? { ...ctx, withhold: { values: force, words: [], phrases: [] } } : ctx);
    return { t, flagged: statedAsUnknown(t.script, text, a.intent.intentId) };
  };
  // a board that writes "? m" over the 8 her line states — flagged
  const bad = run("d7g1", ["30"], "Ek side 8 m hai, baaki dekho. Parimap kitna hai?", ["8"]);
  assert.ok(texts(bad.t.script.ops).includes("? m"));
  assert.deepEqual(bad.flagged, ["8"]);
  // (director8: a card whose KEY her line states never masks it in the first place)
  const said = run("d7g0", ["8"], "Ek side 8 m hai, baaki dekho. Parimap kitna hai?");
  assert.ok(!texts(said.t.script.ops).includes("? m"));
  assert.deepEqual(said.flagged, []);
  // the card's real answer (30), unsaid: nothing is "?" over a stated number
  const ok = run("d7g2", ["30"], "Ek side 8 m hai. Parimap kitna hai?");
  assert.deepEqual(ok.flagged, []);
  // a "?" over a value her line does NOT state is the question, not a flag
  const q = run("d7g3", ["8"], "Ek side ki lambai kitni hai?");
  assert.deepEqual(q.flagged, []);
  // through the seam (director8): a card whose key her line states draws it — no "?", nothing to flag on the artifact
  const T6 = "c6-maths-ch06-t01", sid = "d7g-seam";
  seam.studioSeam.prefetch({ lessonId: sid, purpose: "practice", kit: c6, topicId: T6, child: { id: "child-d7g", class_level: 6, language_pref: "hinglish" } });
  const A = { intent: { intentId: `${sid}:wb:1`, lessonId: sid, kind: "whiteboard", beat: "explain", style: { band: "B3" }, boardRef: ref,
    scriptBeat: { scriptId: "s", beatId: "c1", kind: "check", answers: ["8"] } },
    line: { lessonId: sid, teacherReplySeq: 3, text: "Ek side 8 m hai, ek 3 m aur ek 5 m. Parimap kitna hai?" }, mode: "fresh", kit: { topicId: T6, content: [] } };
  BF.preselect({ ...A, line: { ...A.line, text: "" } }, { kit: c6 });
  const ack = seam.studioSeam.requestIntent(A);
  assert.equal(ack?.state, "revealed");
  assert.ok(!texts(ack.artifact.script.ops).includes("? m"));
  assert.equal(ack.artifact.statedAsUnknown, undefined);
  // (Brain's interim cardBoard, should one arrive, pages like a then-marker: the say at 0, the card where its text starts)
  const cb = ask("d7-cb"); const th = cb.intent.then; delete cb.intent.then;
  cb.intent.cardBoard = { boardRef: th.boardRef, scriptBeat: th.scriptBeat, cardText: then };
  const sg = BF.segmentsOf(cb);
  assert.equal(sg?.length, 2);
  assert.equal(sg[1].from, say.length + 1);
});

test("#44 word timings: a page turns on its segment's first WORD onset; with no word timings, on the clause onset; with neither, the estimate", async () => {
  const { switchOnsets, normWord } = await import("../src/modules/whiteboard/lineClock.ts");
  const id = "d7-words";
  seam.studioSeam.prefetch({ lessonId: id, purpose: "practice", kit, topicId: T, child: { id: "child-d7w", class_level: 5, language_pref: "hinglish" } });
  const ack = seam.studioSeam.requestIntent(ask(id));
  const s = ack.artifact.script, sw = s.switches[0];
  // the server stamps the switch with the then-prompt's first word and how many of her words come before it
  assert.equal(sw.word, normWord(then.split(/\s+/)[0]));
  assert.equal(sw.wordIndex, say.split(/\s+/).filter((w) => normWord(w)).length);
  const startB = (sc) => Math.min(...sc.ops.filter((o) => o.id.startsWith("b.")).map((o) => o.startMs));
  const b0 = startB(s);
  // the voice's words (her line as spoken, onsets on the board's clock): the then-prompt's first word sounds 1,250 ms late
  const spoken = line.split(/\s+/).map((w, i) => ({ w, at: 300 + i * 280 }));
  const k = sw.wordIndex; spoken[k] = { ...spoken[k], at: sw.atMs + 1250 };
  const clauses = []; clauses[sw.clause] = sw.atMs + 900;
  const at = switchOnsets(s, spoken, clauses);
  assert.equal(at[0], sw.atMs + 1250, "the word onset");
  assert.equal(startB(onLineClock(s, clauses, at)), b0 + 1250, "page B on the word");
  // no word timings (the voice sent none, or none matched): the clause onset
  assert.deepEqual(switchOnsets(s, [], clauses), [undefined]);
  assert.equal(startB(onLineClock(s, clauses, switchOnsets(s, undefined, clauses))), b0 + 900, "page B on the clause");
  // a words list that never says the switch's word: the clause onset still
  assert.equal(startB(onLineClock(s, clauses, switchOnsets(s, [{ w: "kuch", at: 50 }], clauses))), b0 + 900);
  // neither: the estimate stands
  assert.equal(onLineClock(s, [], switchOnsets(s, undefined, [])), s);
});
