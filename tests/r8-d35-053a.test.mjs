// to-brain 053, builder A's parts (docs/patches/to-brain/053-director34-second-picture-several-wrong-answers-walk-paths.md, dc-r8-director34):
// each new predicate pinned on the director34 rows the order lists (tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-24-director34;
// rows are 0-based indexes into a lesson's `director`), replayed with that run's own script snapshot, and each rule pinned on the walk.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { lessonFlags, PENDING, PREDICATES } from "../evals/hybrid-side-by-side/dry-predicates.mjs";
import { pickHelp, addSaid, ownHintOf, helpPart, noPictureLine } from "../server/director/help.js";

const ROOT = new URL("..", import.meta.url).pathname;
const RUN = join(ROOT, "tests/fixtures/eval-results/hybrid-side-by-side/results/2026-11-24-director34");
const cache = new Map();
const scriptOf = (t) => JSON.parse(readFileSync(join(RUN, "scripts", `${t}.json`), "utf8"));
const lesson = (persona, t) => {
  const k = `${persona}|${t}`;
  if (!cache.has(k)) cache.set(k, { rows: JSON.parse(readFileSync(join(RUN, `${persona}-${t.replace("-maths-", "-")}.json`), "utf8")).director, script: scriptOf(t) });
  return cache.get(k);
};
const flagCache = new Map();
const flagsOf = (persona, t) => { const k = `${persona}|${t}`; if (!flagCache.has(k)) flagCache.set(k, lessonFlags(lesson(persona, t))); return flagCache.get(k); };
const flagged = (persona, t, name) => [...new Set(flagsOf(persona, t).filter((f) => f.predicate === name).map((f) => f.row))].sort((a, b) => a - b);
const flaggedAll = (name) => {
  const out = [];
  for (const p of ["steady", "stuck", "offtopic", "steering"]) for (const t of ["c4-maths-ch05-t01", "c4-maths-ch01-t02", "c5-maths-ch02-t01", "c5-maths-ch02-t02", "c5-maths-ch02-t03", "c6-maths-ch06-t01", "c6-maths-ch07-t01", "c4-maths-ch06-t01", "c6-maths-ch07-t03"])
    for (const r of flagged(p, t, name)) out.push(`${p} ${t} ${r}`);
  return out.sort();
};
/** The said set of a lesson's teacher rows before row i (as state.js keeps it). */
const saidTo = (rows, i) => rows.slice(0, i).reduce((s, r, n) => (r.who === "teacher" ? addSaid(s, r.text, n) : s), []);
const at = (rows, i) => ({ part: String(rows[i].cell.part).replace(/(:worked:step\d+):ask$/, "$1") });

describe("A: a second picture request", () => {
  test("the three predicates are gated", () => {
    for (const k of ["noPictureBare", "noPictureAfterView", "hintBoardNotDrawn"]) { assert.ok(PREDICATES[k], k); assert.ok(!PENDING.has(k), k); }
  });
  // (the eighth bare turn, steering c6-ch07-t03 16, is not read: every wording of its ladder is said by help.js's own reading — a sentence
  // near one said is said — so A3 has nothing to add there; the line and the invitation is what A3 leaves when all are spent)
  test("noPictureBare reads director34's bare no-picture turns (the line and the invitation, a wording unsaid): seven of the eight", () => {
    assert.deepEqual(flaggedAll("noPictureBare"), ["offtopic c4-maths-ch01-t02 26", "steering c4-maths-ch05-t01 16", "steering c4-maths-ch06-t01 16", "steering c5-maths-ch02-t01 16",
      "steering c5-maths-ch02-t02 16", "steering c6-maths-ch06-t01 16", "steering c6-maths-ch07-t01 16"].sort());
  });
  test("hintBoardNotDrawn reads the no-picture line said with the card's own hint unsaid (steering c5-t03 16, c6-ch07-t01 16; stuck c4-ch06-t01 18, c6 18)", () => {
    assert.deepEqual(flaggedAll("hintBoardNotDrawn"), ["steering c5-maths-ch02-t03 16", "steering c6-maths-ch07-t01 16", "stuck c4-maths-ch06-t01 18", "stuck c6-maths-ch06-t01 18"].sort());
  });
  test("noPictureAfterView reads c4-ch01-t02 steering 16 (the tester view gone at the first word) and the other views lost on a no-picture turn", () => {
    const all = flaggedAll("noPictureAfterView");
    assert.ok(all.includes("steering c4-maths-ch01-t02 16"), all.join("\n"));
    assert.ok(all.every((x) => /^steering .* 16$/.test(x)), all.join("\n"));
  });
  test("A1: the card's own hint, unsaid, with a board, is the picture — no line (stuck c4-ch06-t01 18 as walked)", () => {
    const { rows, script } = lesson("stuck", "c4-maths-ch06-t01");
    const said = saidTo(rows, 18);
    const d = pickHelp({ script, ...at(rows, 18), request: "picture", said });
    assert.equal(d.hintBoard, true);
    assert.equal(d.pictureLine, undefined);
    assert.match(d.rung.text, /^4 ke nishaan se shuru karke/);
    assert.equal(d.rung.board.template, "number-line-scale@1");
    const own = ownHintOf(script, helpPart(script, at(rows, 18).part), said);
    assert.equal(own.settles, false);
  });
  test("A1: a hint whose board is the card's answer board is never drawn — A3's line and the hint in words", () => {
    const { rows, script } = lesson("stuck", "c4-maths-ch06-t01");
    const s = structuredClone(script);
    const e3 = s.skills[0].explain.find((b) => b.id === "e3");
    e3.ask.answerBoard = structuredClone(e3.ask.board ?? e3.board);
    const d = pickHelp({ script: s, ...at(rows, 18), request: "picture", said: saidTo(rows, 18) });
    assert.ok(!d.hintBoard);
    assert.equal(d.pictureLine?.text, s.joints.noPicture[0].hi);
    assert.match(d.rung.text, /^4 ke nishaan/);
  });
  test("A3: nothing to draw — the script's FIRST noPicture form, then the first unsaid wording in words (steering c5-t01 16 as walked)", () => {
    const { rows, script } = lesson("steering", "c5-maths-ch02-t01");
    const d = pickHelp({ script, ...at(rows, 16), request: "picture", said: saidTo(rows, 16), jointN: { noPicture: 2 }, lessonKey: "x" });
    assert.ok(!d.hintBoard);
    assert.equal(d.pictureLine.text, script.joints.noPicture[0].hi);
    assert.equal(d.rung.path, "skills[0].remediation[2].simpler");
    assert.equal(d.card, "keep");
    assert.equal(d.key, null);
    assert.equal(noPictureLine(script, { first: true, lang: "english" }).text, script.joints.noPicture[0].en);
  });
});

describe("B: three paths in the walk", () => {
  test("the B predicates are gated", () => {
    for (const k of ["bridgeGiveUpGoesOn", "cardWholeAfterTryOrYes", "questionFiveTimes", "closeNoFitCheckin", "easierWordsNoQuestion"]) { assert.ok(PREDICATES[k], k); assert.ok(!PENDING.has(k), k); }
  });
  // (the order's fifth row, the staged c6-ch07-t03 stuck 56, is B1's list spent: its bridge has no `simpler` and the verdict before it said the
  // closed card's full reason — the go-on is what is left; listed for the script's authors)
  test("bridgeGiveUpGoesOn reads director34 c4 steady 70, c5-t03 steady 26, c6-ch07-t01 steady 26 and stuck 56", () => {
    assert.deepEqual(flaggedAll("bridgeGiveUpGoesOn"), ["steady c4-maths-ch05-t01 70", "steady c5-maths-ch02-t03 26", "steady c6-maths-ch07-t01 26", "stuck c6-maths-ch07-t01 56"].sort());
  });
  test("closeNoFitCheckin reads director34 c4 steady 54, offtopic 52 and 70", () => {
    assert.deepEqual(flaggedAll("closeNoFitCheckin"), ["offtopic c4-maths-ch05-t01 52", "offtopic c4-maths-ch05-t01 70", "steady c4-maths-ch05-t01 54"]);
  });
  test("easierWordsNoQuestion reads director34 c5-t02 steady 36", () => {
    assert.deepEqual(flaggedAll("easierWordsNoQuestion"), ["steady c5-maths-ch02-t02 36"]);
  });
  test("cardWholeAfterTryOrYes reads the order's rows (c4 steady 28, 30; c4-ch01-t02 steady 28, 30; c5-t03 steering 20; c5-t02 stuck 22, offtopic 24)", () => {
    const all = flaggedAll("cardWholeAfterTryOrYes");
    for (const x of ["steady c4-maths-ch05-t01 28", "steady c4-maths-ch05-t01 30", "steady c4-maths-ch01-t02 28", "steady c4-maths-ch01-t02 30", "steering c5-maths-ch02-t03 20", "stuck c5-maths-ch02-t02 22", "offtopic c5-maths-ch02-t02 24"]) assert.ok(all.includes(x), `${x}\n${all.join("\n")}`);
    assert.equal(all.length, 20, all.join("\n"));
  });
  test("questionFiveTimes reads c4-ch01-t02 offtopic (one step seven times) and c5-t02 steering (a follow-up card from row 18)", () => {
    const all = flaggedAll("questionFiveTimes");
    for (const x of ["offtopic c4-maths-ch01-t02 30", "steering c5-maths-ch02-t02 18", "steering c5-maths-ch02-t02 20", "steering c6-maths-ch06-t01 18"]) assert.ok(all.includes(x), `${x}\n${all.join("\n")}`);
    assert.equal(all.length, 11, all.join("\n"));
  });
  test("the 75-word predicate reads B6's turn (c5-t02 steady 42: an aside reply, the back-to line, a bridge, a point and a card, 84 words)", () => {
    assert.deepEqual(flagged("steady", "c5-maths-ch02-t02", "longTwoPart"), [42]);
  });
  test("B1: a first give-up at a bridge's check-in gets the bridge's simpler and the check-in; a second goes on", () => {
    const script = scriptOf("c4-maths-ch05-t01");
    const part = "c4-maths-ch05-t01-s2:bridge";
    const d = pickHelp({ script, part, request: "give_up", said: [] });
    assert.equal(d.card, "wait"); assert.equal(d.bridgeHelp, true);
    assert.equal(d.rung.path, `${helpPart(script, part).path}.simpler`);
    const d2 = pickHelp({ script, part, request: "give_up", said: [], bridgeAgain: true });
    assert.equal(d2.card, "goOn"); assert.equal(d2.rung, null);
  });
  test("B1: with no bridge simpler, the closed card's full reason, then the check-in", () => {
    const script = structuredClone(scriptOf("c4-maths-ch05-t01"));
    delete script.skills[1].bridgeToNext.simpler;
    const d = pickHelp({ script, part: "c4-maths-ch05-t01-s2:bridge", request: "clarify", said: [], closedWhy: { text: "Charon group barabar hote toh har ek 4 hota.", path: "x.why" } });
    assert.equal(d.card, "wait"); assert.equal(d.rung.field, "closedWhy");
    assert.match(d.rung.text, /^Charon group/);
  });
  test("B7: a Hindi request that asks to explain gets the card's unsaid hint before the form, ending on the form", () => {
    const { rows, script } = lesson("stuck", "c6-maths-ch06-t01");
    const said = saidTo(rows, 8);
    const plain = pickHelp({ script, ...at(rows, 8), request: "hindi", said });
    assert.ok(plain.hindiForm); assert.equal(plain.rung.field, "hindi");
    const ex = pickHelp({ script, ...at(rows, 8), request: "hindi", said, explain: true });
    assert.equal(ex.hindiForm, plain.hindiForm);
    assert.ok(ex.rung.text && ex.rung.field !== "hindi", JSON.stringify(ex.rung));
  });
});

// main's rulings R1 and R2 on 053 B3 (round d35): the cap of four hearings is on what she says on her own initiative — it fires only on a
// turn after a miss, a give-up or no answer. A child's request for the question (Hindi, "phir se bolo") is honoured whatever the count; a bare
// "haan" waits (B2); a short ask says no question and is no hearing. Walked on the live c4-maths-ch05-t01 script with step() alone: the
// first card and the first asked worked step, with the count set to three before her last turn (heardOf adds the question she last said).
describe("B3 after main's R1 and R2: the cap is on her own repeats", async () => {
  const { initLessonState, step } = await import("../server/director/state.js");
  const { kitFromFile } = await import("../server/content/kits.js");
  const { getTopic } = await import("../server/content/curriculum.js");
  const { findItem } = await import("../server/director/items.js");
  const { scriptFor } = await import("../server/director/script.js");
  const { atQuestionOf, SHORT_ASK_FORMS } = await import("../server/director/question-run.js");
  const TOPIC = "c4-maths-ch05-t01";
  const kit = kitFromFile(getTopic(TOPIC));
  const script = scriptFor(kit).script;
  const ctx = { firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Golu", what: "a pretend little friend" }, ageBand: "10-15", lang: "hinglish",
    interests: ["cricket"], firstMeeting: true, hasCallback: false, topicTitle: TOPIC, classLevel: 4, sessionId: "d35-053a-r1", lessonKey: "d35-053a-r1", teacher: "director" };
  let r = step(initLessonState({ topicId: TOPIC, kit, ctx, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
  let card = null, stepS = null;
  for (let i = 0; i < 200 && !(card && stepS); i++) {
    const s = r.state;
    if (!card && String(s.lastUi?.ask?.itemId ?? "").startsWith("script:") && !s.lastMove?.stepAsk?.prompt) card = s;
    if (!stepS && s.lastMove?.stepAsk?.prompt && !s.lastMove.splitClose) stepS = s;
    const it = s.activeItemId ? findItem(s, kit, s.activeItemId) : null;
    r = step(s, { event: "turn", kit, cls: { outcome: it ? "correct" : "no_evidence", confidence: 0.9, flags: {} }, text: it ? String(it.answer) : "haan", now: (s.turn + 1) * 20_000 });
  }
  /** Her fifth hearing would come now: three before, her last turn said the question (or `lastText` in its place). */
  const fifth = (s, text, cls, lastText = null) => {
    const q = s.lastMove?.stepAsk?.prompt && !s.lastMove.splitClose ? s.lastMove.stepAsk.prompt : s.lastUi.ask.text;
    const P = atQuestionOf(script, q);
    const prev = { ...s, qHeard: { [P]: 3 }, recent: [...(s.recent ?? []), { who: "teacher", text: lastText ?? q }] };
    const o = step(prev, { event: "turn", kit, text, cls: { confidence: 0.9, flags: {}, ...cls }, now: (s.turn + 1) * 20_000 });
    return { P, o, lm: o.state.lastMove ?? {} };
  };
  const HINDI = ["hindi mein bolo", { outcome: "no_evidence", request: { type: "language" } }];
  const REPEAT = ["phir se bolo", { outcome: "no_evidence", request: { type: "repeat" } }];
  const HAAN = ["haan", { outcome: "no_evidence" }];
  const WRONG = ["7", { outcome: "incorrect" }];
  const GIVE_UP = ["pata nahi", { outcome: "no_evidence", flags: { dontKnow: true } }];
  test("the walk reaches a card and an asked step", () => { assert.ok(card, "a script card"); assert.ok(stepS, "an asked worked step"); });
  test("at a card: a fifth hearing at a Hindi request honours it (the card's Hindi form, card still live, no key)", () => {
    const { lm, o } = fifth(card, ...HINDI);
    assert.equal(lm.heardCap, undefined); assert.ok(lm.hindiForm, JSON.stringify(Object.keys(lm)));
    assert.ok(!lm.gave); assert.equal(o.state.keyedPart ?? null, null); assert.equal(o.ui?.ask?.itemId, card.lastUi.ask.itemId);
  });
  test("at a card: a fifth hearing at a repeat request says the question again (no key)", () => {
    const { lm, o } = fifth(card, ...REPEAT);
    assert.equal(lm.heardCap, undefined); assert.ok(!lm.gave); assert.equal(o.ui?.ask?.itemId, card.lastUi.ask.itemId);
  });
  test("at a card: a bare haan waits (the short ask), no key", () => {
    const { lm, o } = fifth(card, ...HAAN);
    assert.equal(lm.heardCap, undefined); assert.ok(!lm.gave); assert.ok(lm.waitShort); assert.equal(o.state.keyedPart ?? null, null);
  });
  test("at a card: after a miss, or a give-up, the fifth hearing is the key with its reason", () => {
    for (const cue of [WRONG, GIVE_UP]) {
      const { lm, o, P } = fifth(card, ...cue);
      assert.equal(lm.heardCap, P, cue[0]); assert.ok(lm.gave, cue[0]); assert.ok(o.state.keyedPart, cue[0]);
    }
  });
  test("R2: a short ask is no hearing — after one, a miss is not capped", () => {
    const { lm } = fifth(card, ...WRONG, SHORT_ASK_FORMS[0]);
    assert.equal(lm.heardCap, undefined); assert.ok(!lm.gave);
  });
  test("at an asked step: Hindi and repeat requests are honoured, a bare haan waits; the step is never told", () => {
    for (const cue of [HINDI, REPEAT, HAAN]) {
      const { lm } = fifth(stepS, ...cue);
      assert.equal(lm.heardCap, undefined, cue[0]); assert.ok(!lm.stepFrom, cue[0]); assert.ok(lm.stepAsk?.prompt, cue[0]);
    }
    assert.ok(fifth(stepS, ...HAAN).lm.waitShort);
  });
  test("at an asked step: after a miss, or a give-up, the fifth hearing tells the step", () => {
    for (const cue of [WRONG, GIVE_UP]) {
      const { lm, P } = fifth(stepS, ...cue);
      assert.equal(lm.heardCap, P, cue[0]); assert.ok(lm.stepFrom != null, cue[0]);
    }
  });
});
