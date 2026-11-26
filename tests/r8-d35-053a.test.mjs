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
  // (re-pinned for release 61: those four hints were said over the card's own posing board — a board to say them over, not one they own. No
  // hint in director34's scripts owns a board, so the line with the hint in words was A3's right answer there; director35 heard the old
  // reading's turns: tests/r8-d35-fix61.test.mjs)
  test("hintBoardNotDrawn, with 'owns' as release 61 reads it, flags none of director34's no-picture turns (no hint there owns a board)", () => {
    assert.deepEqual(flaggedAll("hintBoardNotDrawn"), []);
  });
  test("noPictureAfterView reads c4-ch01-t02 steering 16 (the tester view gone at the first word) and the other views lost on a no-picture turn", () => {
    const all = flaggedAll("noPictureAfterView");
    assert.ok(all.includes("steering c4-maths-ch01-t02 16"), all.join("\n"));
    assert.ok(all.every((x) => /^steering .* 16$/.test(x)), all.join("\n"));
  });
  // (re-pinned for release 61 — director35 stuck c4-ch06-t01 18 drew the board already up as the "hint's board": a hint said over the card's
  // own posing board owns no board, so this is A3 — the line in its first form, the hint in words over the board up)
  test("A1 (release 61): the card's own hint said over the card's posing board owns no board — A3's line and the hint in words (stuck c4-ch06-t01 18)", () => {
    const { rows, script } = lesson("stuck", "c4-maths-ch06-t01");
    const said = saidTo(rows, 18);
    const d = pickHelp({ script, ...at(rows, 18), request: "picture", said });
    assert.ok(!d.hintBoard);
    assert.equal(d.pictureLine?.text, script.joints.noPicture[0].hi);
    assert.match(d.rung.text, /^4 ke nishaan se shuru karke/);
    const own = ownHintOf(script, helpPart(script, at(rows, 18).part), said);
    assert.equal(own.settles, false);
    assert.equal(own.board.template, "number-line-scale@1");
    assert.equal(own.owns, null);
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
  // (main's R1/R2: a short ask is no hearing, and only a fifth hearing on her own — after a miss, a give-up or no answer — is read: 11 rows → 3)
  test("questionFiveTimes, after R1/R2 and 055 C3, reads c5-t02 steering (a follow-up card from row 18), c5-t01 and c6 steering 18 and 20, c5-t03 steering 20, offtopic c4-ch01-t02 22 and 30", () => {
    const all = flaggedAll("questionFiveTimes");
    // (d38 re-pin, to-brain 055 C3 — questionFiveTimes tightened by name: every fifth hearing on her own counts, in any form, after a yes, a
    // side-topic, a picture request or a clarify too; only the child's own request is honoured. Was the three rows at 18; now also offtopic
    // c4-ch01-t02 22 and 30 (its seven turns at one step) and the four steering rows at 20)
    assert.deepEqual(all, ["offtopic c4-maths-ch01-t02 22", "offtopic c4-maths-ch01-t02 30", "steering c5-maths-ch02-t01 18", "steering c5-maths-ch02-t01 20", "steering c5-maths-ch02-t02 18", "steering c5-maths-ch02-t02 20", "steering c5-maths-ch02-t03 20", "steering c6-maths-ch06-t01 18", "steering c6-maths-ch06-t01 20"], all.join("\n"));
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
  // (d38 re-pin, to-brain 055 C1 as main ruled in RULING-A2 A(i): this card's wordings are all unsaid at the cap, so the first cue is C1 —
  // its first unsaid wording ending on the invitation, no key — and the next miss or give-up is the key with its reason. Was: the key at the
  // first cue)
  /** The turn after `o`, her turn (C1's, which says no question) in the record as the invitation. */
  const next = (o, text, cls) => step({ ...o.state, recent: [...(o.state.recent ?? []), { who: "child", text }, { who: "teacher", text: "Ab tum batao." }] },
    { event: "turn", kit, text, cls: { confidence: 0.9, flags: {}, ...cls }, now: (o.state.turn + 1) * 20_000 });
  test("at a card: after a miss, or a give-up, the fifth hearing is C1 (an unsaid wording, the invitation, no key); the next is the key with its reason", () => {
    for (const cue of [WRONG, GIVE_UP]) {
      const { lm, o, P } = fifth(card, ...cue);
      assert.equal(lm.heardCap, undefined, cue[0]); assert.ok(!lm.gave, cue[0]); assert.ok(!o.state.keyedPart, cue[0]); assert.ok(lm.yourTurn, cue[0]);
      assert.ok(o.state.c1At?.[lm.help?.part ?? lm.cell?.part], cue[0]);
      const o2 = next(o, ...cue), lm2 = o2.state.lastMove ?? {};
      assert.equal(lm2.heardCap, P, cue[0]); assert.ok(lm2.gave, cue[0]); assert.ok(o2.state.keyedPart, cue[0]);
    }
  });
  test("R2: a short ask is no hearing — after one, a miss is not capped", () => {
    const { lm } = fifth(card, ...WRONG, SHORT_ASK_FORMS[0]);
    assert.equal(lm.heardCap, undefined); assert.ok(!lm.gave);
  });
  // (re-pinned for to-brain 054 B.4, main's ruling on question 3: a bare haan that starts a wait waits — the short ask, the step not told;
  // at a wait's third turn or later the fifth hearing is the cap as built, and the step is told on that turn only)
  test("at an asked step: Hindi and repeat requests are honoured, a bare haan waits; the step is told only by the cap — at a wait's third turn or later, or its second where the re-ask would be the fifth hearing (055 C3)", () => {
    for (const cue of [HINDI, REPEAT, HAAN]) {
      const { lm } = fifth(stepS, ...cue);
      assert.equal(lm.heardCap, undefined, cue[0]); assert.ok(!lm.stepFrom, cue[0]); assert.ok(lm.stepAsk?.prompt, cue[0]);
    }
    assert.ok(fifth(stepS, ...HAAN).lm.waitShort);
    const q = stepS.lastMove.stepAsk.prompt, P = atQuestionOf(script, q);
    const at = (n) => step({ ...stepS, qHeard: { [P]: 3 }, waitQ: { P, n }, recent: [...(stepS.recent ?? []), { who: "teacher", text: q }] },
      { event: "turn", kit, text: "haan", cls: { confidence: 0.9, flags: {}, outcome: "no_evidence" }, now: (stepS.turn + 1) * 20_000 }).state.lastMove ?? {};
    // (d38 re-pin, to-brain 055 C3 and C4: wait two's re-ask that would be the fifth hearing is what wait three is — at four hearings the cap,
    // the step told. Was: wait two at four hearings said the re-ask, uncapped. With three hearings, wait two is the re-ask as built)
    const w2 = at(1), w3 = at(2);
    assert.equal(w2.heardCap, P); assert.ok(w2.stepFrom != null); assert.equal(w2.waitN, 2);
    assert.equal(w3.heardCap, P); assert.ok(w3.stepFrom != null); assert.equal(w3.waitN, 3);
    const w2three = step({ ...stepS, qHeard: { [P]: 2 }, waitQ: { P, n: 1 }, recent: [...(stepS.recent ?? []), { who: "teacher", text: q }] },
      { event: "turn", kit, text: "haan", cls: { confidence: 0.9, flags: {}, outcome: "no_evidence" }, now: (stepS.turn + 1) * 20_000 }).state.lastMove ?? {};
    assert.equal(w2three.heardCap, undefined); assert.ok(!w2three.stepFrom); assert.equal(w2three.waitN, 2); assert.ok(w2three.waitReask);
  });
  // (d38 re-pin, as above: the step's simpler unsaid at the cap — C1 first, the step told at the next miss or give-up. Was: told at the first)
  test("at an asked step: after a miss, or a give-up, the fifth hearing is C1 (the step's unsaid wording, the invitation); the next tells the step", () => {
    for (const cue of [WRONG, GIVE_UP]) {
      const { lm, o, P } = fifth(stepS, ...cue);
      assert.equal(lm.heardCap, undefined, cue[0]); assert.ok(lm.stepFrom == null, cue[0]); assert.ok(lm.yourTurn, cue[0]);
      const lm2 = next(o, ...cue).state.lastMove ?? {};
      assert.equal(lm2.heardCap, P, cue[0]); assert.ok(lm2.stepFrom != null, cue[0]);
    }
  });
});

// to-brain 053 G: offline, a line no code path reads is what that reader's own parser returns for an empty label. The stubbed reader below
// disagrees (it labels the line the key, or a named wrong answer); the dry reading must not follow it — it is the empty label's parse.
describe("G: the offline walk reads as the model's parser reads an empty label", async () => {
  const { dryReading } = await import("../evals/hybrid-side-by-side/dry-reader.mjs");
  const { parseClassification } = await import("../server/director/classify.js");
  const mis = [{ tag: "m1", id: "mis-a", belief: "b", signs: [] }];
  const readers = {
    card: { mode: "item", key: "5", also: [], ideas: [], misconceptions: mis, open: false },
    askedStep: { mode: "item", key: "5", also: [], ideas: [], misconceptions: [], open: false },
    closingAsCard: { mode: "item", key: "8/12", also: [], ideas: [], misconceptions: mis, open: false },
    why: { mode: "why", ideas: ["equal parts"], misconceptions: mis },
    checkinOrReturn: { mode: "none", misconceptions: mis },
    closingReader: { mode: "teachback", expectations: ["equal parts"], misconceptions: mis },
  };
  const want = { card: "no_evidence", askedStep: "no_evidence", closingAsCard: "no_evidence", why: "no_evidence", checkinOrReturn: "no_evidence", closingReader: "incorrect" };
  for (const [name, target] of Object.entries(readers)) {
    test(`${name}: the dry reading is the parser's empty label (${want[name]}), not the stubbed reader's`, () => {
      const { modelFlags: _f, ...empty } = parseClassification({}, target);
      const d = dryReading(target);
      assert.equal(d.outcome, want[name]); assert.equal(d.outcome, empty.outcome); assert.equal(d.source, "dry");
      const stub = target.mode === "teachback" ? { covered: ["e1"], misconceptions: ["none"], confidence: 0.9 } : target.mode === "none" ? { belief: "m1", confidence: 0.9 } : { match: "key", confidence: 0.9 };
      const s = parseClassification(stub, target);
      if (target.mode !== "none") assert.notEqual(s.outcome, d.outcome, "the stub disagrees");
      else assert.equal(d.voiced, undefined, "no belief read from an empty label");
    });
  }
  test("the harness reads every unmatched line through dryReading", () => {
    const src = readFileSync(join(ROOT, "evals/hybrid-side-by-side.mjs"), "utf8");
    assert.match(src, /fast\.result \?\? dryReading\(target\)/);
    assert.doesNotMatch(src, /outcome: "no_evidence", confidence: 1, flags: \{\}, source: "dry"/);
  });
});
